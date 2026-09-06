#!/usr/bin/env python3
import hashlib, json, sys
from pathlib import Path
from common import canonical_bytes
from verify_receipt import verify_receipt

VECTOR_DIR = Path(__file__).parents[1] / "interop-v0.2" / "test-vectors"
failures = 0
for vector in json.loads((VECTOR_DIR / "canonicalization-vectors.json").read_text(encoding="utf-8")):
    result = canonical_bytes(json.loads(vector["input_json"]))
    ok = result.decode("utf-8") == vector["canonical"] and result.hex() == vector["utf8_hex"] and hashlib.sha256(result).hexdigest() == vector["sha256"]
    print(f"{'PASS' if ok else 'FAIL'} canonicalization {vector['name']}")
    failures += 0 if ok else 1
cases = [("valid-receipt.json", "public-key.pem", "pass"), ("tampered-claim.json", "public-key.pem", "invalid_signature"), ("valid-receipt.json", "wrong-public-key.pem", "public_key_id_mismatch"), ("unsupported-version.json", "public-key.pem", "unsupported_version"), ("unsupported-receipt-role.json", "public-key.pem", "unsupported_receipt_role"), ("missing-required-field.json", "public-key.pem", "missing_claim_field:status")]
for receipt_file, key_file, expected in cases:
    result = verify_receipt((VECTOR_DIR / receipt_file).read_text(encoding="utf-8"), (VECTOR_DIR / key_file).read_bytes())
    actual = "pass" if result["ok"] else result["reason"]
    ok = actual == expected; print(f"{'PASS' if ok else 'FAIL'} receipt {receipt_file}: expected {expected}, got {actual}"); failures += 0 if ok else 1
raise SystemExit(1 if failures else 0)
