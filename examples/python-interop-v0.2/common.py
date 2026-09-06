"""Independent Python support for BoundaryAttest Interop Profile v0.2."""
from typing import Any
import rfc8785

REQUIRED_CLAIM_FIELDS = ("receipt_version", "receipt_role", "event_id", "timestamp", "action_type", "status")

def canonical_bytes(value: Any) -> bytes:
    # rfc8785.dumps performs JCS serialization and returns UTF-8 bytes.
    return rfc8785.dumps(value)

def validate_claim(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("claim must be a JSON object")
    for field in REQUIRED_CLAIM_FIELDS:
        if field not in value:
            raise ValueError(f"missing required claim field: {field}")
    if value["receipt_version"] != "0.2":
        raise ValueError('receipt_version must be "0.2"')
    if value["receipt_role"] not in ("client_observed", "server_attested"):
        raise ValueError("unsupported receipt_role")
    canonical_bytes(value)
    return value
