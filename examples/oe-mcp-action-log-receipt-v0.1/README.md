# Experimental OE MCP action-log receipt example

This folder demonstrates a narrow external mapping from one synthetic OE MCP operational log record to a portable BoundaryAttest receipt. It is not an OE MCP integration, partnership, endorsement, or standard, and it makes no change to BoundaryAttest core behavior or Interop Profile v0.1.

## What the files represent

- `sample-oe-mcp-log-entry.json` is the synthetic raw operational record. OE MCP owns and retains records like this in `oe-mcp-log.json`.
- `sample-redacted-log-entry.json` is the selected, externally redacted object. Its input and result bodies are digests rather than sensitive payloads.
- `sample-receipt.json` is an Ed25519-signed Interop Profile v0.1 claim over the SHA-256 hash of that entire redacted object.
- `sample-public-key.pem` is the expected synthetic example public key. Shipping it beside the receipt does not establish trust.
- `verify-example.ts` verifies the signature and recomputes all demonstrated hash bindings.

The raw log and the receipt have separate jobs: the raw entry is operational evidence; the receipt is a portable signed claim about selected redacted evidence. Keep `oe-mcp-log.json` for operational inspection. Do not put connector credentials, tokens, cookies, or raw sensitive inputs/results in a receipt.

## Run it

From the repository root:

```sh
npm run build
npm run example:oe-mcp-action-log-receipt-v0.1
```

The command verifies the checked-in signature with the expected public key, hashes the redacted entry with the declared algorithm, compares the mapped connector/tool/status/timestamp fields and input/output digests, and performs a small check for credential-shaped claim fields.

## What passing does not prove

Passing does not prove action correctness, authorization, appropriate connector credentials, target-system state, or runtime integrity. It does not prove that OE MCP emitted the sample or that the selected record is complete or truthful. It does not replace the OE MCP action log.

All identifiers, timestamps, and digests are synthetic. This folder is an external experimental example, not a stable fixture. See the [mapping note](../../docs/oe-mcp-action-log-receipt-v0.1-draft.md) for the full field mapping and verification limits.
