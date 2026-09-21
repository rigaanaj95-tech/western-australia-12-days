import test from "node:test";
import assert from "node:assert/strict";
import handler, {
  buildSnapshot,
  parseChanges,
  parseCollections,
  parseTripId
} from "../../api/trip/[tripId].js";

function createResponse() {
  const headers = new Map();
  return {
    headers,
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

test("trip API validates route and collection parameters", () => {
  assert.equal(parseTripId("wa-north-20260923"), "wa-north-20260923");
  assert.deepEqual(parseCollections("bills,travelers,bills"), ["bills", "travelers"]);
  assert.throws(() => parseTripId("../secret"), /unsupported/);
  assert.throws(() => parseCollections("bills,secrets"), /unsupported/);
});

test("trip API validates record changes", () => {
  const changes = parseChanges({
    changes: [{
      op: "upsert",
      collection: "bills",
      id: "bill-1",
      value: { id: "bill-1", baseAmountCents: 1200 }
    }]
  }, ["bills"]);
  assert.equal(changes[0].value.baseAmountCents, 1200);
  assert.throws(() => parseChanges({
    changes: [{
      op: "upsert",
      collection: "bills",
      id: "bill-1",
      value: { id: "bill-2" }
    }]
  }, ["bills"]), /must match/);
  assert.throws(() => parseChanges({
    changes: [
      { op: "delete", collection: "bills", id: "bill-1" },
      { op: "delete", collection: "bills", id: "bill-1" }
    ]
  }, ["bills"]), /only be changed once/);
});

test("trip API scopes returned records to requested collections", () => {
  const snapshot = buildSnapshot([
    { collection: "bills", value: { id: "bill-1" }, updated_at: "2026-09-21T11:00:00.000Z" },
    { collection: "travelers", value: { id: "person-1" }, updated_at: "2026-09-21T11:01:00.000Z" }
  ], ["bills"]);
  assert.deepEqual(snapshot.bills, [{ id: "bill-1" }]);
  assert.deepEqual(snapshot.travelers, []);
  assert.equal(snapshot.updatedAt, "2026-09-21T11:00:00.000Z");
});

test("trip API returns a clear error when the database is not configured", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousPostgresUrl = process.env.POSTGRES_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  try {
    const response = createResponse();
    await handler({
      method: "GET",
      headers: {},
      query: { tripId: "trip-1", collections: "bills" }
    }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.error, "shared storage is unavailable");
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousPostgresUrl === undefined) delete process.env.POSTGRES_URL;
    else process.env.POSTGRES_URL = previousPostgresUrl;
  }
});

test("trip API rejects unsupported methods without touching the database", async () => {
  const response = createResponse();
  await handler({ method: "PUT", headers: {}, query: {} }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.get("allow"), "GET, POST");
});
