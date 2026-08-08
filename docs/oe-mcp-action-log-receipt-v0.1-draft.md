# Experimental OE MCP action-log receipt mapping v0.1 (draft)

Status: external discussion draft based on maintainer feedback about the persistent action log introduced in OE MCP v1.6.5. This is not an OE MCP integration, partnership, endorsement, or standard. It does not change BoundaryAttest core behavior, package exports, verifier semantics, stable fixtures, or Interop Profile v0.1.

## Separation of responsibilities

OE MCP owns `oe-mcp-log.json` as its operational record. Each connector tool call can be represented there with its timestamp, connector name, tool name, input parameters, and result/status. The OE MCP log remains the place to inspect operational detail and history.

BoundaryAttest sits beside that log. An opt-in external adapter may select one redacted entry, or a deterministically exported and redacted log window, hash that selected material, and sign a narrow portable claim about the hash. The receipt does not ingest, manage, or replace the source log.

```text
oe-mcp-log.json -> select window/entry -> redact -> canonicalize + hash -> sign receipt claim
     OE MCP owned                 external adapter                 BoundaryAttest envelope
```

This draft uses a single redacted entry. The same pattern can bind an exported window by setting `selection_type` to `exported_log_window` and placing that window's digest in `log_entry_hash`; the field name is retained for this small draft rather than proposing a core schema change.

## Experimental claim mapping

The receipt uses the existing Interop Profile v0.1 envelope. All mapping-specific fields are inside `claim` and therefore covered by the signature.

| Claim field | Meaning |
| --- | --- |
| `receipt_version` | Existing interop value, `"0.1"`. |
| `receipt_role` | Existing role describing the signer perspective. The sample uses `client_observed`; it is not an OE MCP host attestation. |
| `event_id` | Synthetic receipt event identifier. |
| `timestamp` | Time the receipt claim was created. |
| `action_type` | Namespaced experimental action, `oe_mcp.action_log_entry`. |
| `status` | Selected log entry result status. |
| `log_entry_hash` | SHA-256 digest of the selected, redacted, canonically serialized log entry (or exported window). |
| `log_entry_hash_alg` | Hash and canonicalization label. The sample uses `sha256+boundaryattest-stable-json-v0.1`. |
| `connector_name` | Connector name copied from the selected record. |
| `tool_name` | Connector tool name copied from the selected record. |
| `result_status` | Explicit result status copied from the selected record. It matches `status` in this sample. |
| `event_timestamp` | Event/log timestamp copied from the selected record. |
| `selection_type` | `redacted_log_entry` or `exported_log_window`. |
| `input_hash` | Digest reference for the input representation; never raw credentials or sensitive parameters. |
| `output_hash` | Digest reference for the result representation; never a raw sensitive result. |
| `redaction_profile` | Optional external redaction profile name. |
| `redaction_profile_version` | Optional external redaction profile version. |
| `source_log_file` | Optional non-authoritative source reference, here `oe-mcp-log.json`. |
| `verification_limits` | Signed statements delimiting what verification does not establish. |

The example computes `log_entry_hash` over the complete JSON value in `sample-redacted-log-entry.json` using BoundaryAttest's current `stableJson` serialization and SHA-256. The label makes that example-specific canonicalization dependency explicit. It is not proposed as an OE MCP digest standard.

## Redaction and data handling

Selection and redaction happen before signing. Receipts must not contain secrets, access tokens, session cookies, private connector credentials, or raw sensitive connector payloads. Inputs and results should appear only as hashes, redacted digests, or deliberately non-sensitive classifications. A production adapter would need a documented redaction policy, canonicalization contract, and controls preventing sensitive values from entering receipt claims.

The raw sample is synthetic. Even there, connector inputs and results are represented by digests rather than realistic payloads. The redacted sample demonstrates the exact portable object whose hash is signed.

## Verification limits

Successful receipt verification proves only that the expected key signed the unchanged claim and, when the example's additional recomputation succeeds, that the checked redacted entry hashes to the value in that claim.

It does not prove:

- the logged action was correct;
- the action was authorized;
- connector credentials were appropriate;
- the target system reached or retains any claimed state;
- OE MCP, the connector, the adapter, or the signing runtime had integrity;
- the log entry is complete, truthful, uniquely selected, or correctly ordered;
- the receipt timestamp or log timestamp is trustworthy; or
- the expected public key should be trusted merely because it accompanies the sample.

The receipt does not replace `oe-mcp-log.json`. A relying party must separately obtain and trust the expected key, source log or export, selection/redaction policy, timestamp policy, and any evidence needed for authorization, correctness, or target-state conclusions.

## Example

The runnable synthetic example is in [`examples/oe-mcp-action-log-receipt-v0.1/`](../examples/oe-mcp-action-log-receipt-v0.1/). It verifies the existing interop envelope, recomputes the redacted entry digest, checks the mapped connector/tool/status/timestamp and input/output hashes, and rejects raw credential-shaped fields in the receipt claim. It is an experimental example, not a stable interoperability fixture.
