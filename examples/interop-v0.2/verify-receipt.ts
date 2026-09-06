import { createHash, createPublicKey, sign, verify } from "node:crypto";
import { jcsCanonicalBytes } from "../../src/jcs.js";

const TOP_LEVEL_FIELDS = ["claim", "signature", "public_key_id"] as const;
export const REQUIRED_CLAIM_FIELDS = ["receipt_version", "receipt_role", "event_id", "timestamp", "action_type", "status"] as const;
export type FailureReason = "invalid_json" | "invalid_receipt" | `missing_top_level_field:${string}` | `unexpected_top_level_field:${string}` | "claim_not_object" | `missing_claim_field:${string}` | "unsupported_version" | "unsupported_receipt_role" | "public_key_id_mismatch" | "invalid_signature";
export type VerificationResult = { ok: true } | { ok: false; reason: FailureReason };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const hasOwn = (value: object, field: string): boolean => Object.prototype.hasOwnProperty.call(value, field);

export function interopV02PublicKeyId(publicKeyPem: string): string {
  const der = createPublicKey(publicKeyPem).export({ type: "spki", format: "der" });
  return `sha256:${createHash("sha256").update(der).digest("hex")}`;
}

export function signInteropV02Claim(claim: Record<string, unknown>, privateKeyPem: string): string {
  return sign(null, jcsCanonicalBytes(claim), privateKeyPem).toString("base64");
}

export function verifyInteropV02Receipt(receiptText: string, publicKeyPem: string): VerificationResult {
  let receipt: unknown;
  try { receipt = JSON.parse(receiptText); } catch { return { ok: false, reason: "invalid_json" }; }
  if (!isRecord(receipt)) return { ok: false, reason: "invalid_receipt" };
  for (const field of TOP_LEVEL_FIELDS) if (!hasOwn(receipt, field)) return { ok: false, reason: `missing_top_level_field:${field}` };
  for (const field of Object.keys(receipt)) if (!(TOP_LEVEL_FIELDS as readonly string[]).includes(field)) return { ok: false, reason: `unexpected_top_level_field:${field}` };
  if (!isRecord(receipt.claim)) return { ok: false, reason: "claim_not_object" };
  if (typeof receipt.signature !== "string" || typeof receipt.public_key_id !== "string") return { ok: false, reason: "invalid_receipt" };
  for (const field of REQUIRED_CLAIM_FIELDS) if (!hasOwn(receipt.claim, field)) return { ok: false, reason: `missing_claim_field:${field}` };
  if (receipt.claim.receipt_version !== "0.2") return { ok: false, reason: "unsupported_version" };
  if (receipt.claim.receipt_role !== "client_observed" && receipt.claim.receipt_role !== "server_attested") return { ok: false, reason: "unsupported_receipt_role" };
  let keyId: string;
  try { keyId = interopV02PublicKeyId(publicKeyPem); } catch { return { ok: false, reason: "public_key_id_mismatch" }; }
  if (receipt.public_key_id !== keyId) return { ok: false, reason: "public_key_id_mismatch" };
  try {
    return verify(null, jcsCanonicalBytes(receipt.claim), publicKeyPem, Buffer.from(receipt.signature, "base64"))
      ? { ok: true }
      : { ok: false, reason: "invalid_signature" };
  } catch { return { ok: false, reason: "invalid_signature" }; }
}
