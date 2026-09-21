import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

const TRIP_ID = "wa-north-20260923";
const LKK_ID = "person-e241090e-e776-4c86-ad3e-df33fee8b71a";
const ZTN_ID = "person-23ff8e36-3853-4f73-b09d-216d7dfb7d3d";
const PARTICIPANT_IDS = Object.freeze([LKK_ID, ZTN_ID]);
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const checkOnly = process.argv.includes("--check");
const sqlOnly = process.argv.includes("--sql");
const sqlSeedOnly = process.argv.includes("--sql-seed");

const travelers = [
  { id: LKK_ID, name: "LKK", initial: "L", color: "#D96C42" },
  { id: ZTN_ID, name: "ZTN", initial: "Z", color: "#217D91" }
];

const sourceBills = [
  ["bill-c8780ddb-4161-408d-a1aa-2aad6990ac23", 200000, "其他", "paid", "签证费", "2人；原账单未标付款人，暂记 LKK", LKK_ID, "2026-09-21T11:01:00.313Z"],
  ["bill-2dff2ccc-4af8-4b06-a51d-a91e80aa5d1a", 503100, "交通", "paid", "上海-吉隆坡-珀斯", "原账单未标付款人，暂记 LKK", LKK_ID, "2026-09-21T11:01:05.108Z"],
  ["bill-3363c3cf-f637-44be-b15e-c76a9e7b242d", 516300, "交通", "paid", "珀斯-吉隆坡-杭州", "原账单未标付款人，暂记 LKK", LKK_ID, "2026-09-21T11:01:10.297Z"],
  ["bill-2f1bdf9d-10e0-45b4-9ec9-61ce1418972c", 832257, "住宿", "paid", "8晚酒店", "ZTN付", ZTN_ID, "2026-09-21T11:01:14.690Z"],
  ["bill-94c370a9-9b6c-4656-bffc-f0d74e971f8e", 202200, "住宿", "paid", "2晚酒店", "LKK付，421.13 AUD", LKK_ID, "2026-09-21T11:01:20.296Z"],
  ["bill-4d4e93d9-562d-4d49-80fc-c9ae6f7096ce", 209400, "交通", "paid", "租车9天", "LKK付", LKK_ID, "2026-09-21T11:01:34.314Z"],
  ["bill-66ca9631-c2c1-432c-95a4-9ed000e79ea7", 259200, "门票", "paid", "Shark Bay小飞机", "LKK付，540 AUD", LKK_ID, "2026-09-21T11:01:39.406Z"],
  ["bill-af38f732-8a8f-4716-b3ec-80556ec49e3b", 116000, "门票", "paid", "Lancelin越野+滑沙", "LKK付，241.5 AUD", LKK_ID, "2026-09-21T11:01:45.022Z"],
  ["bill-86388f21-6b09-4687-83cc-087c7f2365cc", 7200, "门票", "paid", "公园通票", "LKK付，15 AUD/车，5天，几乎所有公园可用", LKK_ID, "2026-09-21T11:01:50.306Z"],
  ["bill-b08ce230-aa24-4bed-a3b8-8f4747e502e5", 381200, "其他", "paid", "现金 800 AUD", "原账单未标付款人，暂记 LKK", LKK_ID, "2026-09-21T11:01:55.525Z"],
  ["bill-7365d8d9-6cce-4d82-9cb2-dbf2b28b1e46", 25270, "购物", "paid", "手机卡 2张", "原账单未标付款人，暂记 LKK", LKK_ID, "2026-09-21T11:02:01.056Z"],
  ["bill-94c6d431-9284-42c2-a259-3a68f9ea864f", 133000, "交通", "planned", "租车保险 / 额外区域", "现场买；全包保险14 AUD/天，额外司机5 AUD/天，远地区额外付150 AUD", "", "2026-09-21T11:02:20.680Z"],
  ["bill-89127670-54ca-4766-8251-6abe325f6d0f", 30000, "交通", "planned", "停车", "预估", "", "2026-09-21T11:02:25.048Z"],
  ["bill-2c828946-9735-45ae-8603-029b32c82598", 160000, "交通", "planned", "加油", "预估", "", "2026-09-21T11:02:29.538Z"],
  ["bill-beacf717-2dce-4e08-9564-a9b3b7ff77a3", 50000, "交通", "planned", "打车", "预估", "", "2026-09-21T11:02:33.648Z"],
  ["bill-c41f604c-9b6f-43e9-a5fa-5ade7bc66995", 800000, "餐饮", "planned", "吃饭", "预估", "", "2026-09-21T11:02:37.491Z"],
  ["bill-31dc0eea-74d1-4d46-957d-f55796623636", 100000, "购物", "planned", "买零食 / 用品", "预估", "", "2026-09-21T11:02:51.531Z"],
  ["bill-3325663f-4d3a-44b5-a57d-6c6e4d9afe2c", 38400, "其他", "planned", "浮潜装备租赁", "全装备+湿衣，次日归还", "", "2026-09-21T11:02:56.054Z"],
  ["bill-21ce110b-e0f5-485e-9cb5-efb47c5d94e7", 14400, "门票", "planned", "Monkey Mia看海豚门票", "预算", "", "2026-09-21T11:03:00.556Z"],
  ["bill-38ec3b2a-cb10-4ce1-b8c5-138ac9c7dd1b", 57600, "交通", "planned", "Rottnest船票", "预算", "", "2026-09-21T11:03:04.724Z"],
  ["bill-cc6b0614-e0c9-4608-929f-f3490d0a8db1", 33600, "交通", "planned", "Rottnest巴士", "预算", "", "2026-09-21T11:03:09.058Z"]
];

const bills = sourceBills.map(([
  id, amount, category, status, note, paymentNote, payerId, timestamp
]) => ({
  id,
  originalAmountCents: amount,
  baseAmountCents: amount,
  currency: "CNY",
  category,
  status,
  note,
  paymentNote,
  orderedAt: "",
  payerId,
  participantIds: [...PARTICIPANT_IDS],
  createdAt: timestamp,
  updatedAt: timestamp
}));

const records = [
  ...travelers.map((value) => ({ collection: "travelers", value })),
  ...bills.map((value) => ({ collection: "bills", value }))
];
const paidCents = bills.filter((bill) => bill.status === "paid").reduce((sum, bill) => sum + bill.baseAmountCents, 0);
const plannedCents = bills.filter((bill) => bill.status === "planned").reduce((sum, bill) => sum + bill.baseAmountCents, 0);
const summary = {
  tripId: TRIP_ID,
  travelers: travelers.length,
  bills: bills.length,
  paidCents,
  plannedCents,
  projectedCents: paidCents + plannedCents
};

if (paidCents !== 3252127 || plannedCents !== 1417000 || bills.length !== 21) {
  throw new Error("Ledger seed totals do not match the source browser snapshot.");
}

if (sqlSeedOnly) {
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  console.log(`INSERT INTO trip_records (trip_id, collection, record_id, value, created_at, updated_at)
SELECT
  ${quote(TRIP_ID)},
  item->>'collection',
  item->'value'->>'id',
  item->'value',
  COALESCE((item->'value'->>'createdAt')::timestamptz, NOW()),
  COALESCE((item->'value'->>'updatedAt')::timestamptz, NOW())
FROM jsonb_array_elements(${quote(JSON.stringify(records))}::jsonb) AS item
ON CONFLICT (trip_id, collection, record_id)
DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;`);
} else if (sqlOnly) {
  const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
  const migration = await readFile(new URL("../optional/neon/migrations/0001_trip_records.sql", import.meta.url), "utf8");
  const inserts = records.map(({ collection, value }) => {
    const timestamp = value.createdAt || "2026-09-21T11:00:00.000Z";
    return `INSERT INTO trip_records (trip_id, collection, record_id, value, created_at, updated_at)
VALUES (${quote(TRIP_ID)}, ${quote(collection)}, ${quote(value.id)}, ${quote(JSON.stringify(value))}::jsonb, ${quote(timestamp)}::timestamptz, ${quote(value.updatedAt || timestamp)}::timestamptz)
ON CONFLICT (trip_id, collection, record_id)
DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;`;
  }).join("\n\n");
  const verification = `SELECT
  COUNT(*) FILTER (WHERE collection = 'travelers') AS travelers,
  COUNT(*) FILTER (WHERE collection = 'bills') AS bills,
  COALESCE(SUM((value->>'baseAmountCents')::bigint) FILTER (WHERE collection = 'bills' AND value->>'status' = 'paid'), 0) AS paid_cents,
  COALESCE(SUM((value->>'baseAmountCents')::bigint) FILTER (WHERE collection = 'bills' AND value->>'status' = 'planned'), 0) AS planned_cents
FROM trip_records
WHERE trip_id = ${quote(TRIP_ID)};`;
  console.log(`${migration.trim()}\n\nBEGIN;\n${inserts}\nCOMMIT;\n\n${verification}`);
} else if (!checkOnly) {
  if (!connectionString) {
    throw new Error("Set DATABASE_URL (or POSTGRES_URL) before seeding the Neon ledger.");
  }
  const sql = neon(connectionString);
  await sql.transaction((transaction) => records.map(({ collection, value }) => transaction`
    INSERT INTO trip_records (trip_id, collection, record_id, value, created_at, updated_at)
    VALUES (
      ${TRIP_ID},
      ${collection},
      ${value.id},
      ${JSON.stringify(value)}::jsonb,
      ${value.createdAt || "2026-09-21T11:00:00.000Z"}::timestamptz,
      ${value.updatedAt || "2026-09-21T11:00:00.000Z"}::timestamptz
    )
    ON CONFLICT (trip_id, collection, record_id)
    DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
  `));
  console.log(JSON.stringify({ mode: "seed", ...summary }, null, 2));
} else {
  console.log(JSON.stringify({ mode: "check", ...summary }, null, 2));
}
