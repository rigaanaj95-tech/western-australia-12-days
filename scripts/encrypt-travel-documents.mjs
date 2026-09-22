import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const MAGIC = Buffer.from("WADOC1");
const ITERATIONS = 600_000;

const FILES = [
  ["229571(1).pdf", "wa-parks-pass.enc"],
  ["Booking Receipt For Fri Oct 2, 2026 (AKAC-300826)(1).pdf", "lancelin-booking.enc"],
  ["Your Perth Quad receipt [_1129-0018](1).pdf", "lancelin-payment.enc"],
  ["Confirmation_for_Booking_ID_#_(15).pdf", "hotel-criterion-perth.enc"],
  ["Confirmation_for_Booking_ID_#_(11).pdf", "hotel-jurien-bay.enc"],
  ["Confirmation_for_Booking_ID_#_(9).pdf", "hotel-questro-breeze.enc"],
  ["Confirmation_for_Booking_ID_#_(7).pdf", "hotel-carnarvon-first.enc"],
  ["Confirmation_for_Booking_ID_#_(5).pdf", "hotel-potshot-exmouth.enc"],
  ["Confirmation_for_Booking_ID_#_(3).pdf", "hotel-carnarvon-second.enc"],
  ["Confirmation_for_Booking_ID_#_(1).pdf", "hotel-african-reef.enc"],
  ["Confirmation_for_Booking_ID_#_(13).pdf", "hotel-vibe-subiaco.enc"],
  ["IMMI Grant Notification.pdf", "australia-visa-grant.enc"],
  ["Nationwest Aviation - Kalbarri Scenic Flights - Order RU9ZH2C - Payment receipt(1).pdf", "shark-bay-flight-payment.enc"],
  ["Order RU9ZH2C is Confirmed(3).pdf", "shark-bay-flight-confirmation.enc"],
  ["英文版机票行程单(1).pdf", "outbound-flight-ztn.enc"],
  ["英文版机票行程单(3).pdf", "outbound-flight-lkk.enc"]
];

const password = process.env.ATTACHMENT_PASSWORD;
const sourceDir = process.argv[2];
const outputDir = process.argv[3] || "assets/documents/encrypted";

if (!password || password.length < 8) {
  throw new Error("ATTACHMENT_PASSWORD must contain at least 8 characters");
}
if (!sourceDir) {
  throw new Error("Usage: ATTACHMENT_PASSWORD=... node scripts/encrypt-travel-documents.mjs <source-dir> [output-dir]");
}

await mkdir(outputDir, { recursive: true });

async function encryptFile(sourceName, outputName) {
  const plaintext = await readFile(path.join(sourceDir, sourceName));
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const payload = Buffer.concat([MAGIC, salt, iv, ciphertext, cipher.getAuthTag()]);
  await writeFile(path.join(outputDir, outputName), payload);
  return { outputName, bytes: payload.length };
}

const encrypted = [];
for (const [sourceName, outputName] of FILES) {
  encrypted.push(await encryptFile(sourceName, outputName));
}

const verifierSalt = randomBytes(16);
const verifierIv = randomBytes(12);
const verifierKey = pbkdf2Sync(password, verifierSalt, ITERATIONS, 32, "sha256");
const verifierCipher = createCipheriv("aes-256-gcm", verifierKey, verifierIv);
const verifierCiphertext = Buffer.concat([
  verifierCipher.update(Buffer.from("west-australia-travel-documents")),
  verifierCipher.final()
]);
await writeFile(
  path.join(outputDir, "vault-check.enc"),
  Buffer.concat([MAGIC, verifierSalt, verifierIv, verifierCiphertext, verifierCipher.getAuthTag()])
);

console.log(`Encrypted ${encrypted.length} travel documents into ${outputDir}`);
