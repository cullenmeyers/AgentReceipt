#!/usr/bin/env python3
"""Minimal BoundaryAttest Interop Profile v0.1 receipt signer."""

import argparse
import base64
import hashlib
import json
import re
from pathlib import Path
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


KEY_NAME = re.compile(r"^[a-z][a-z0-9_]*$")
MAX_SAFE_INTEGER = 2**53 - 1
REQUIRED_CLAIM_FIELDS = (
    "receipt_version",
    "receipt_role",
    "event_id",
    "timestamp",
    "action_type",
    "status",
)


def _check_canonical_subset(value: Any, path: str = "claim") -> None:
    """Keep Python ordering/number encoding identical to v0.1 stableJson."""
    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str) or not KEY_NAME.fullmatch(key):
                raise ValueError(f"{path}: keys must be lowercase ASCII snake_case: {key!r}")
            _check_canonical_subset(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _check_canonical_subset(child, f"{path}[{index}]")
    elif isinstance(value, bool) or value is None or isinstance(value, str):
        return
    elif isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            raise ValueError(f"{path}: integer is outside JavaScript's safe integer range")
    elif isinstance(value, float):
        raise ValueError(f"{path}: floating-point values are not supported by this example")
    else:
        raise ValueError(f"{path}: unsupported JSON value")


def canonical_claim_bytes(claim: dict[str, Any]) -> bytes:
    _check_canonical_subset(claim)
    return json.dumps(
        claim,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def validate_claim(claim: Any) -> dict[str, Any]:
    if not isinstance(claim, dict):
        raise ValueError("claim must be a JSON object")
    for field in REQUIRED_CLAIM_FIELDS:
        if field not in claim:
            raise ValueError(f"missing required claim field: {field}")
    if claim["receipt_version"] != "0.1":
        raise ValueError('receipt_version must be "0.1"')
    if claim["receipt_role"] not in ("client_observed", "server_attested"):
        raise ValueError("unsupported receipt_role")
    canonical_claim_bytes(claim)
    return claim


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("claim", type=Path, help="JSON file containing exactly the claim")
    parser.add_argument("private_key", type=Path, help="Ed25519 PKCS #8 PEM private key")
    parser.add_argument("-o", "--output", type=Path, help="receipt output (stdout if omitted)")
    args = parser.parse_args()

    claim = validate_claim(json.loads(args.claim.read_text(encoding="utf-8")))
    private_key = serialization.load_pem_private_key(
        args.private_key.read_bytes(), password=None
    )
    if not isinstance(private_key, Ed25519PrivateKey):
        raise ValueError("private key must be Ed25519")

    public_der = private_key.public_key().public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
    )
    receipt = {
        "claim": claim,
        "signature": base64.b64encode(
            private_key.sign(canonical_claim_bytes(claim))
        ).decode("ascii"),
        "public_key_id": "sha256:" + hashlib.sha256(public_der).hexdigest(),
    }
    rendered = json.dumps(receipt, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")


if __name__ == "__main__":
    main()
