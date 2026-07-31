# Python Interop Profile v0.1 example

This is a minimal Python-native reference signer and verifier for arbitrary host-provided artifact/action digests and structured metadata. It is an example, not a production library. It emits the strict BoundaryAttest Interop Profile v0.1 envelope with exactly `claim`, `signature`, and `public_key_id` at the top level.

## What verification means

Passing verification proves only possession of the expected signing key and integrity of the signed claim. It does **not** prove the claim is true, the action was authorized or safe, compliance, runtime integrity, caller identity, or downstream state. The caller must supply an independently trusted expected public key; a key bundled with an untrusted receipt is not a trust decision.

## Requirements and quick start

- Python 3.9 or later
- [`cryptography`](https://cryptography.io/) for Ed25519 and DER/SPKI key handling

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r examples/python-interop-v0.1/requirements.txt
.venv/bin/python examples/python-interop-v0.1/sign_receipt.py \
  examples/python-interop-v0.1/sample_claim.json \
  examples/python-interop-v0.1/demo-private-key.pem \
  --output /tmp/boundaryattest-sample-receipt.json
.venv/bin/python examples/python-interop-v0.1/verify_receipt.py \
  /tmp/boundaryattest-sample-receipt.json \
  examples/python-interop-v0.1/demo-public-key.pem
```

With a Python environment containing the requirements active, the repository command verifies the checked-in deterministic sample and then regenerates and verifies it:

```sh
npm run example:python-interop-v0.1
```

`demo-private-key.pem` and `demo-public-key.pem` are public, fixed **demo-only** development keys. Never use them for real receipts. Production deployments should use organization-managed keys or an appropriate KMS/HSM.

## Supplying a host claim

Put the required fields and all host-provided digest/metadata fields in one JSON claim object, then pass it to `sign_receipt.py`. The signer canonicalizes and signs exactly that object. `sample_claim.json` demonstrates a host-provided artifact digest, explicit digest algorithm, correlation ID, and nested metadata. To attest an action without an artifact, use an appropriate signed field such as `input_hash`, `output_hash`, or an adapter-specific digest name.

The verifier rejects extra envelope fields and verifies against the public key supplied on its command line. It prints `{"ok":true}` or a stable v0.1 failure reason and returns a nonzero status on failure.

## Canonicalization compatibility

BoundaryAttest v0.1 uses its existing JavaScript `stableJson`, not RFC 8785/JCS: object keys are recursively sorted, arrays retain their order, JSON is compact, and UTF-8 bytes of exactly `claim` are signed.

JavaScript `localeCompare` is not fully portable across languages. This example therefore accepts the profile's documented interoperable naming convention—lowercase ASCII `snake_case` keys at every nesting level—where Python sorting matches the current v0.1 vectors. It also rejects floating-point values and integers outside JavaScript's safe range because Python and JavaScript can serialize those differently. Strings, booleans, nulls, safe integers, arrays, and nested objects are supported. These guardrails prevent producing a receipt that only appears interoperable.

## Conceptual adapter mappings

- **agentenv export bundles:** the exporting host can use `server_attested`, put its bundle/content digest in `artifact_hash`, name the export in `target_ref`, and carry an export or workflow ID in a signed correlation field.
- **Knossos MCP actions/artifacts:** an MCP adapter can map an executed tool call to `action_type`, its result to `status`, an artifact digest to `artifact_hash`, and session/task identifiers to signed claim extensions. Use `client_observed` for a client observation and `server_attested` only when the executing host signs.

These are conceptual mappings, not claims of partnership or completed integration.

See the repository's [Interop Profile v0.1](../../docs/interop-profile-v0.1.md) and [verification limits](../../docs/interop-verification-limits-v0.1.md) for the normative compatibility target and trust boundary.
