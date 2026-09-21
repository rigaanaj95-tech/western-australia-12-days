import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL (or POSTGRES_URL) before running the Neon migration.");
}

const migrationUrl = new URL("../optional/neon/migrations/0001_trip_records.sql", import.meta.url);
const migrationSql = await readFile(fileURLToPath(migrationUrl), "utf8");
const statements = migrationSql
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);
const sql = neon(connectionString);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Neon migration complete (${statements.length} statements).`);
