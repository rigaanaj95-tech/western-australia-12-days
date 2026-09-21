import { neon } from "@neondatabase/serverless";

const ALLOWED_COLLECTIONS = Object.freeze(["bills", "travelers", "todos", "tickets"]);
const ALLOWED_COLLECTION_SET = new Set(ALLOWED_COLLECTIONS);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_CHANGES = 100;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_RECORD_BYTES = 32 * 1024;

export function parseTripId(value) {
  if (Array.isArray(value)) throw new RequestError(400, "tripId must appear once");
  const tripId = String(value || "").trim();
  if (!ID_PATTERN.test(tripId)) {
    throw new RequestError(400, "tripId contains unsupported characters");
  }
  return tripId;
}

export function parseCollections(value) {
  if (Array.isArray(value)) throw new RequestError(400, "collections must appear once");
  const collections = [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))];
  if (!collections.length || collections.some((collection) => !ALLOWED_COLLECTION_SET.has(collection))) {
    throw new RequestError(400, "collections contains an unsupported collection");
  }
  return collections;
}

export function parseChanges(body, collections) {
  const payload = typeof body === "string" ? parseJson(body) : body;
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray(payload.changes)) {
    throw new RequestError(400, "body must contain a changes array");
  }
  if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_BODY_BYTES) {
    throw new RequestError(413, "request body exceeds the size limit");
  }
  if (!payload.changes.length || payload.changes.length > MAX_CHANGES) {
    throw new RequestError(400, `changes must contain between 1 and ${MAX_CHANGES} items`);
  }

  const enabled = new Set(collections);
  const seen = new Set();
  return payload.changes.map((change) => {
    if (!change || typeof change !== "object" || Array.isArray(change)) {
      throw new RequestError(400, "each change must be an object");
    }
    const op = String(change.op || "");
    const collection = String(change.collection || "");
    const id = String(change.id || "").trim();
    if (!["upsert", "delete"].includes(op)) throw new RequestError(400, "change op must be upsert or delete");
    if (!enabled.has(collection)) throw new RequestError(400, "change collection was not requested");
    if (!ID_PATTERN.test(id)) throw new RequestError(400, "record id contains unsupported characters");

    const key = `${collection}:${id}`;
    if (seen.has(key)) throw new RequestError(400, "a record may only be changed once per request");
    seen.add(key);

    if (op === "delete") return { op, collection, id };
    if (!change.value || typeof change.value !== "object" || Array.isArray(change.value)) {
      throw new RequestError(400, "upsert changes require an object value");
    }
    if (String(change.value.id || "") !== id) {
      throw new RequestError(400, "record value id must match change id");
    }
    const serialized = JSON.stringify(change.value);
    if (Buffer.byteLength(serialized, "utf8") > MAX_RECORD_BYTES) {
      throw new RequestError(413, "record exceeds the size limit");
    }
    return { op, collection, id, value: change.value };
  });
}

export function buildSnapshot(rows, collections) {
  const snapshot = {
    version: 1,
    settings: null,
    bills: [],
    travelers: [],
    todos: [],
    tickets: [],
    updatedAt: new Date().toISOString()
  };
  let latest = 0;
  const enabled = new Set(collections);
  for (const row of rows || []) {
    if (!enabled.has(row.collection) || !ALLOWED_COLLECTION_SET.has(row.collection)) continue;
    const value = typeof row.value === "string" ? parseJson(row.value) : row.value;
    if (value && typeof value === "object" && !Array.isArray(value)) snapshot[row.collection].push(value);
    const timestamp = new Date(row.updated_at).getTime();
    if (Number.isFinite(timestamp)) latest = Math.max(latest, timestamp);
  }
  if (latest) snapshot.updatedAt = new Date(latest).toISOString();
  return snapshot;
}

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new RequestError(400, "request contains invalid JSON");
  }
}

function setResponseHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function selectTripRecords(query, tripId, collections) {
  return query`
    SELECT collection, value, updated_at
    FROM trip_records
    WHERE trip_id = ${tripId}
      AND (
        (${collections.includes("bills")} AND collection = 'bills')
        OR (${collections.includes("travelers")} AND collection = 'travelers')
        OR (${collections.includes("todos")} AND collection = 'todos')
        OR (${collections.includes("tickets")} AND collection = 'tickets')
      )
    ORDER BY collection, created_at, record_id
  `;
}

async function readSnapshot(sql, tripId, collections) {
  const rows = await selectTripRecords(sql, tripId, collections);
  return buildSnapshot(rows, collections);
}

async function applyChanges(sql, tripId, collections, changes) {
  const results = await sql.transaction((transaction) => [
    ...changes.map((change) => (
      change.op === "delete"
        ? transaction`
            DELETE FROM trip_records
            WHERE trip_id = ${tripId}
              AND collection = ${change.collection}
              AND record_id = ${change.id}
          `
        : transaction`
            INSERT INTO trip_records (trip_id, collection, record_id, value)
            VALUES (${tripId}, ${change.collection}, ${change.id}, ${JSON.stringify(change.value)}::jsonb)
            ON CONFLICT (trip_id, collection, record_id)
            DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          `
    )),
    selectTripRecords(transaction, tripId, collections)
  ]);
  return buildSnapshot(results.at(-1), collections);
}

export default async function handler(request, response) {
  setResponseHeaders(response);
  if (!["GET", "POST"].includes(request.method)) {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "method not allowed" });
  }

  try {
    const contentLength = Number(request.headers["content-length"] || 0);
    if (contentLength > MAX_BODY_BYTES) throw new RequestError(413, "request body exceeds the size limit");
    const tripId = parseTripId(request.query?.tripId);
    const collections = parseCollections(request.query?.collections);
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) throw new RequestError(503, "database is not configured");
    const sql = neon(connectionString);

    const snapshot = request.method === "GET"
      ? await readSnapshot(sql, tripId, collections)
      : await applyChanges(sql, tripId, collections, parseChanges(request.body, collections));
    return response.status(200).json(snapshot);
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    if (!(error instanceof RequestError)) console.error("Neon trip API failed", error);
    return response.status(statusCode).json({
      error: statusCode >= 500 ? "shared storage is unavailable" : error.message
    });
  }
}
