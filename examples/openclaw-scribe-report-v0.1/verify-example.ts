#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyInteropReceipt } from "../interop-v0.1/verify-receipt.js";

const EXAMPLE_DIR = resolve("examples/openclaw-scribe-report-v0.1");

type JsonRecord = Record<string, unknown>;

function sha256Bytes(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function objectField(value: JsonRecord, field: string): JsonRecord {
  const selected = value[field];
  if (typeof selected !== "object" || selected === null || Array.isArray(selected)) {
    throw new Error(`${field} must be an object`);
  }
  return selected as JsonRecord;
}

function assertEqual(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function main(): void {
  const receiptText = readFileSync(resolve(EXAMPLE_DIR, "sample-receipt.json"), "utf8");
  const publicKeyPem = readFileSync(resolve(EXAMPLE_DIR, "sample-public-key.pem"), "utf8");
  const finalArtifactBytes = readFileSync(
    resolve(EXAMPLE_DIR, "final-external-reviewer-report.md"),
  );

  const verification = verifyInteropReceipt(receiptText, publicKeyPem);
  if (!verification.ok) throw new Error(`receipt verification failed: ${verification.reason}`);

  const receipt = JSON.parse(receiptText) as JsonRecord;
  const claim = objectField(receipt, "claim");
  const lineage = objectField(claim, "lineage");

  assertEqual("receipt_role", claim.receipt_role, "server_attested");
  assertEqual("action_type", claim.action_type, "soc.report.external_handoff");
  assertEqual("incident_ref", claim.incident_ref, "INC-2026-0042");
  assertEqual("artifact_hash", claim.artifact_hash, sha256Bytes(finalArtifactBytes));
  assertEqual("responder_status", claim.responder_status, "no_response_required");
  assertEqual("responder_ref_hash", lineage.responder_ref_hash, null);

  console.log("PASS sample-receipt.json: Interop Profile v0.1 signature verified");
  console.log("PASS final-external-reviewer-report.md: exact recipient artifact bytes match artifact_hash");
  console.log("PASS RESPONDER: no_response_required with a null reference is explicit and consistent");
  console.log("LIMIT: verification does not establish delivery, report truth, alert reality, agent or redaction correctness, authorization, source completeness, compliance, signer trust, key custody, or SOC runtime integrity.");
}

try {
  main();
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
