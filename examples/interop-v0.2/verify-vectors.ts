#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { jcsCanonicalize } from "../../src/jcs.js";
import { verifyInteropV02Receipt, type FailureReason } from "./verify-receipt.js";

const DIR = resolve("examples/interop-v0.2/test-vectors");
type CanonicalVector = { name: string; input_json: string; canonical: string; utf8_hex: string; sha256: string };
const canonicalVectors = JSON.parse(readFileSync(resolve(DIR, "canonicalization-vectors.json"), "utf8")) as CanonicalVector[];
let failures = 0;
for (const vector of canonicalVectors) {
  const canonical = jcsCanonicalize(JSON.parse(vector.input_json));
  const bytes = Buffer.from(canonical, "utf8");
  const ok = canonical === vector.canonical && bytes.toString("hex") === vector.utf8_hex && createHash("sha256").update(bytes).digest("hex") === vector.sha256;
  console.log(`${ok ? "PASS" : "FAIL"} canonicalization ${vector.name}`);
  if (!ok) failures += 1;
}

const receiptCases: Array<[string, string, "pass" | FailureReason]> = [
  ["valid-receipt.json", "public-key.pem", "pass"], ["tampered-claim.json", "public-key.pem", "invalid_signature"],
  ["valid-receipt.json", "wrong-public-key.pem", "public_key_id_mismatch"], ["unsupported-version.json", "public-key.pem", "unsupported_version"],
  ["unsupported-receipt-role.json", "public-key.pem", "unsupported_receipt_role"], ["missing-required-field.json", "public-key.pem", "missing_claim_field:status"],
];
for (const [receiptFile, keyFile, expected] of receiptCases) {
  const result = verifyInteropV02Receipt(readFileSync(resolve(DIR, receiptFile), "utf8"), readFileSync(resolve(DIR, keyFile), "utf8"));
  const actual = result.ok ? "pass" : result.reason;
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} receipt ${receiptFile}: expected ${expected}, got ${actual}`);
  if (!ok) failures += 1;
}
if (failures) process.exitCode = 1;
