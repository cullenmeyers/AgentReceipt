#!/usr/bin/env python3
import argparse, base64, hashlib, json
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from common import canonical_bytes, validate_claim

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("claim", type=Path)
    parser.add_argument("private_key", type=Path)
    parser.add_argument("--output", "-o", type=Path)
    args = parser.parse_args()
    claim = validate_claim(json.loads(args.claim.read_text(encoding="utf-8")))
    key = serialization.load_pem_private_key(args.private_key.read_bytes(), password=None)
    if not isinstance(key, Ed25519PrivateKey): raise ValueError("private key must be Ed25519")
    der = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    receipt = {"claim": claim, "signature": base64.b64encode(key.sign(canonical_bytes(claim))).decode("ascii"), "public_key_id": "sha256:" + hashlib.sha256(der).hexdigest()}
    output = json.dumps(receipt, ensure_ascii=False, indent=2) + "\n"
    if args.output: args.output.write_text(output, encoding="utf-8")
    else: print(output, end="")

if __name__ == "__main__": main()
