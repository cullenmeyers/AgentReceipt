#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableJson } from "../../src/hash.js";
import { verifyInteropReceipt } from "../interop-v0.1/verify-receipt.js";

const EXAMPLE_DIR = resolve("examples/oe-mcp-action-log-receipt-v0.1");

type JsonRecord = Record<string, unknown>;

function readObject(fileName: string): JsonRecord {
  const value: unknown = JSON.parse(readFileSync(resolve(EXAMPLE_DIR, fileName), "utf8"));
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${fileName} must contain a JSON object`);
  }
  return value as JsonRecord;
}

function child(value: JsonRecord, field: string): JsonRecord {
  const selected = value[field];
  if (typeof selected !== "object" || selected === null || Array.isArray(selected)) {
    throw new Error(`${field} must be an object`);
  }
  return selected as JsonRecord;
}

function sha256Stable(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableJson(value)).digest("hex")}`;
}

function assertEqual(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function rejectCredentialFields(value: unknown, path = "claim"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectCredentialFields(entry, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;

  const forbidden = /(^|_)(access_token|api_key|authorization|cookie|credential|client_secret|password|refresh_token|secret)(_|$)/i;
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    if (forbidden.test(key)) throw new Error(`credential-shaped field is forbidden at ${path}.${key}`);
    rejectCredentialFields(entry, `${path}.${key}`);
  }
}

function main(): void {
  const receiptText = readFileSync(resolve(EXAMPLE_DIR, "sample-receipt.json"), "utf8");
  const publicKeyPem = readFileSync(resolve(EXAMPLE_DIR, "sample-public-key.pem"), "utf8");
  const verification = verifyInteropReceipt(receiptText, publicKeyPem);
  if (!verification.ok) throw new Error(`receipt verification failed: ${verification.reason}`);

  const receipt = JSON.parse(receiptText) as JsonRecord;
  const claim = child(receipt, "claim");
  const redacted = readObject("sample-redacted-log-entry.json");
  const input = child(redacted, "input");
  const result = child(redacted, "result");
  const redaction = child(redacted, "redaction");

  assertEqual("log_entry_hash_alg", claim.log_entry_hash_alg, "sha256+boundaryattest-stable-json-v0.1");
  assertEqual("log_entry_hash", claim.log_entry_hash, sha256Stable(redacted));
  assertEqual("connector_name", claim.connector_name, redacted.connector_name);
  assertEqual("tool_name", claim.tool_name, redacted.tool_name);
  assertEqual("result_status", claim.result_status, result.status);
  assertEqual("status", claim.status, result.status);
  assertEqual("event_timestamp", claim.event_timestamp, redacted.event_timestamp);
  assertEqual("input_hash", claim.input_hash, input.hash);
  assertEqual("output_hash", claim.output_hash, result.hash);
  assertEqual("redaction_profile", claim.redaction_profile, redaction.profile);
  assertEqual("redaction_profile_version", claim.redaction_profile_version, redaction.version);
  assertEqual("source_log_file", claim.source_log_file, "oe-mcp-log.json");
  rejectCredentialFields(claim);

  console.log("PASS sample-receipt.json: interop signature verified");
  console.log("PASS sample-redacted-log-entry.json: signed hash and mapped fields verified");
  console.log("PASS receipt claim: no credential-shaped fields found");
  console.log("LIMIT: verification does not establish correctness, authorization, credentials, target state, or runtime integrity; OE MCP logs remain authoritative operational records.");
}

try {
  main();
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
