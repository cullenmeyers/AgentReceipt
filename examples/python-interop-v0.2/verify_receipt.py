#!/usr/bin/env python3
import argparse, base64, binascii, hashlib, json
from pathlib import Path
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from common import REQUIRED_CLAIM_FIELDS, canonical_bytes

TOP_LEVEL_FIELDS = ("claim", "signature", "public_key_id")
def fail(reason: str) -> dict[str, object]: return {"ok": False, "reason": reason}

def verify_receipt(text: str, public_pem: bytes) -> dict[str, object]:
    try: receipt = json.loads(text)
    except (json.JSONDecodeError, ValueError): return fail("invalid_json")
    if not isinstance(receipt, dict): return fail("invalid_receipt")
    for field in TOP_LEVEL_FIELDS:
        if field not in receipt: return fail(f"missing_top_level_field:{field}")
    for field in receipt:
        if field not in TOP_LEVEL_FIELDS: return fail(f"unexpected_top_level_field:{field}")
    claim = receipt["claim"]
    if not isinstance(claim, dict): return fail("claim_not_object")
    if not isinstance(receipt["signature"], str) or not isinstance(receipt["public_key_id"], str): return fail("invalid_receipt")
    for field in REQUIRED_CLAIM_FIELDS:
        if field not in claim: return fail(f"missing_claim_field:{field}")
    if claim["receipt_version"] != "0.2": return fail("unsupported_version")
    if claim["receipt_role"] not in ("client_observed", "server_attested"): return fail("unsupported_receipt_role")
    try:
        key = serialization.load_pem_public_key(public_pem)
        if not isinstance(key, Ed25519PublicKey): return fail("public_key_id_mismatch")
        der = key.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    except (TypeError, ValueError): return fail("public_key_id_mismatch")
    if receipt["public_key_id"] != "sha256:" + hashlib.sha256(der).hexdigest(): return fail("public_key_id_mismatch")
    try:
        key.verify(base64.b64decode(receipt["signature"], validate=True), canonical_bytes(claim))
    except (InvalidSignature, ValueError, TypeError, binascii.Error, UnicodeError): return fail("invalid_signature")
    return {"ok": True}

def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument("receipt", type=Path); parser.add_argument("public_key", type=Path); args = parser.parse_args()
    result = verify_receipt(args.receipt.read_text(encoding="utf-8"), args.public_key.read_bytes())
    print(json.dumps(result, separators=(",", ":"))); raise SystemExit(0 if result["ok"] else 1)
if __name__ == "__main__": main()
