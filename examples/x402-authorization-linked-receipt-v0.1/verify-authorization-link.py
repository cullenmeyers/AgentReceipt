#!/usr/bin/env python3
"""Verify the docs-only x402 authorization-linked receipt example.

The example intentionally keeps authorization outside BoundaryAttest core. This
checker performs the composition seam only:

1. verify the external grant's own canonical digest and Ed25519 signature;
2. verify the BoundaryAttest Interop v0.1 envelope with its existing verifier;
3. compare ``authorization_ref`` with the grant's self-declared digest; and
4. verify the receipt's result artifact hash over exact file bytes.

A passing result does not establish real identity, payment, authorization,
truth, or settlement. The shipped authorizer and data are synthetic.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

EXAMPLE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(EXAMPLE_DIR.parent / "python-interop-v0.1"))
from verify_receipt import verify_receipt  # noqa: E402


def canonical_body(grant: dict) -> bytes:
    body = {k: v for k, v in grant.items() if k not in ("content_sha256", "signatures")}
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def verify_grant(grant: dict) -> tuple[bool, str]:
    canonical = canonical_body(grant)
    expected_digest = hashlib.sha256(canonical).hexdigest()
    if grant.get("content_sha256") != expected_digest:
        return False, "grant content_sha256 does not match its canonical body"
    try:
        auth = grant["signatures"]["authorizer"]
        if auth["alg"] != "ed25519":
            return False, "unsupported grant signature algorithm"
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(auth["public_key"])).verify(
            bytes.fromhex(auth["signature"]), canonical
        )
    except (KeyError, ValueError, InvalidSignature) as exc:
        return False, f"grant authorizer signature invalid: {exc}"
    return True, "grant digest and authorizer signature verified"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, default=EXAMPLE_DIR / "boundaryattest-receipt.json")
    parser.add_argument("--grant", type=Path, default=EXAMPLE_DIR / "authorization-grant-signed.json")
    parser.add_argument("--artifact", type=Path, default=EXAMPLE_DIR / "result-artifact.json")
    parser.add_argument("--public-key", type=Path, default=EXAMPLE_DIR.parent / "python-interop-v0.1" / "demo-public-key.pem")
    args = parser.parse_args()

    receipt = json.loads(args.receipt.read_text(encoding="utf-8"))
    grant = json.loads(args.grant.read_text(encoding="utf-8"))
    grant_ok, grant_detail = verify_grant(grant)
    envelope = verify_receipt(args.receipt.read_text(encoding="utf-8"), args.public_key.read_bytes())
    authorization_ref = receipt.get("claim", {}).get("authorization_ref")
    ref_ok = authorization_ref == "sha256:" + grant.get("content_sha256", "")
    artifact_expected = receipt.get("claim", {}).get("artifact_hash")
    artifact_actual = "sha256:" + hashlib.sha256(args.artifact.read_bytes()).hexdigest()
    artifact_ok = artifact_expected == artifact_actual
    result = {
        "ok": grant_ok and envelope.get("ok", False) and ref_ok and artifact_ok,
        "grant": grant_detail,
        "boundaryattest_envelope": envelope,
        "authorization_ref_matches_grant_digest": ref_ok,
        "result_artifact_hash_matches": artifact_ok,
        "limits": ["synthetic authorizer", "synthetic artifact", "no proof of real authorization or settlement"],
    }
    print(json.dumps(result, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
