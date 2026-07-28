#!/usr/bin/env node

import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FIXTURE_DIR = resolve("examples/ckg-agentforce-verify-source-v0.1");
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const EXPECTED_TOP_LEVEL_FIELDS = ["claim", "signature", "public_key", "public_key_id"] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ExternalEnvelope = {
  claim: { [key: string]: JsonValue };
  signature: string;
  public_key: string;
  public_key_id: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Matches json.dumps(..., sort_keys=True, separators=(",", ":")) for these
// ASCII-keyed, JSON-compatible fixtures.
function pythonStyleCanonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(pythonStyleCanonicalJson).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${pythonStyleCanonicalJson(value[key])}`)
    .join(",")}}`;
}

function parseEnvelope(text: string): ExternalEnvelope {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || !isRecord(parsed.claim)) {
    throw new Error("receipt and claim must be JSON objects");
  }
  if (
    typeof parsed.signature !== "string" ||
    typeof parsed.public_key !== "string" ||
    typeof parsed.public_key_id !== "string"
  ) {
    throw new Error("signature, public_key, and public_key_id must be strings");
  }
  const fields = Object.keys(parsed).sort();
  if (fields.join(",") !== [...EXPECTED_TOP_LEVEL_FIELDS].sort().join(",")) {
    throw new Error(`unexpected external envelope fields: ${fields.join(",")}`);
  }
  return parsed as ExternalEnvelope;
}

function canonicalBase64(value: string, expectedBytes: number, label: string): Buffer {
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== expectedBytes || decoded.toString("base64") !== value) {
    throw new Error(`${label} must be canonical base64 for ${expectedBytes} bytes`);
  }
  return decoded;
}

function verifyExternalEnvelope(envelope: ExternalEnvelope): { rawKeyId: string; spkiKeyId: string } {
  const rawPublicKey = canonicalBase64(envelope.public_key, 32, "public_key");
  const rawKeyId = `sha256:${createHash("sha256").update(rawPublicKey).digest("hex")}`;
  if (envelope.public_key_id !== rawKeyId) {
    throw new Error(`raw public_key_id mismatch: expected ${rawKeyId}, got ${envelope.public_key_id}`);
  }

  if (!envelope.signature.startsWith("ed25519:")) {
    throw new Error("signature must have the ed25519: prefix");
  }
  const signature = canonicalBase64(envelope.signature.slice("ed25519:".length), 64, "signature");
  const spkiDer = Buffer.concat([ED25519_SPKI_PREFIX, rawPublicKey]);
  const publicKey = createPublicKey({ key: spkiDer, format: "der", type: "spki" });
  const canonicalClaim = Buffer.from(pythonStyleCanonicalJson(envelope.claim), "utf8");
  if (!verify(null, canonicalClaim, publicKey, signature)) {
    throw new Error("invalid Ed25519 signature");
  }

  const spkiKeyId = `sha256:${createHash("sha256").update(spkiDer).digest("hex")}`;
  return { rawKeyId, spkiKeyId };
}

function main(): void {
  const fixtures = ["verify-source-receipt.json", "benchmark-export-receipt.json"];
  for (const fixture of fixtures) {
    const envelope = parseEnvelope(readFileSync(resolve(FIXTURE_DIR, fixture), "utf8"));
    const { rawKeyId, spkiKeyId } = verifyExternalEnvelope(envelope);
    console.log(`PASS ${fixture}: signature and raw-key ID verified`);
    console.log(`  CKG raw-key ID:       ${rawKeyId}`);
    console.log(`  BoundaryAttest SPKI:  ${spkiKeyId} (intentionally different)`);
  }
  console.log("PASS external fixture only; strict BoundaryAttest v0.1 compatibility is not claimed");
}

main();
