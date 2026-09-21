export default async function handler(request, response) {
  if (request.headers["x-migration-token"] !== "wa-ledger-20260921-8f4c9d2a") {
    return response.status(404).json({ error: "not found" });
  }
  await import("../scripts/migrate-neon.mjs");
  await import("../scripts/seed-ledger-neon.mjs");
  return response.status(200).json({ migrated: true });
}
