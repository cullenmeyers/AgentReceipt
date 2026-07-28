# ckg-agentforce / BoundaryAttest receipt mapping v0.1 (draft)

Status: external implementation mapping based on ckg-agentforce v0.5.3. This is not a BoundaryAttest core profile change. It does not change the core schema, verifier, cryptography, canonicalization, stable vectors, package exports, or CI.

## Why `verify_source` is a clean receipt seam

`verify_source(concept, receipt=True)` already produces provenance at the point where a caller asks ckg-agentforce to check the source associated with a concept. Appending a receipt there binds a small signed claim to an existing, meaningful result without replacing the detailed provenance output or requiring receipts for every internal graph operation. It is also late enough to record the selected source URL and its content hash.

The receipt role is `server_attested`: the running ckg-agentforce process states what it did and observed. A per-process signing key is appropriate for the narrow fixture-level statement, “this running process attested this provenance claim at this moment.” It is not a durable organizational identity.

## External envelope and claim

The v0.5.3 implementation emits:

```json
{
  "claim": {
    "receipt_version": "experimental-interop-v0.1",
    "receipt_role": "server_attested",
    "event_id": "ckg-verify-source-<uuid>",
    "timestamp": "2026-07-27T18:42:16.381Z",
    "action_type": "ckg.verify_source",
    "status": "success",
    "concept_label": "Einstein Trust Layer",
    "source_url": "https://example.invalid/source",
    "source_hash": "sha256:<hex>",
    "artifact_hash_alg": "sha256"
  },
  "signature": "ed25519:<base64>",
  "public_key": "<base64 raw Ed25519 public key>",
  "public_key_id": "sha256:<hex>"
}
```

The `ckg.verify_source` fields mean:

| Field | Meaning |
| --- | --- |
| `concept_label` | The concept whose recorded provenance was checked. |
| `source_url` | The source URL selected by ckg-agentforce. |
| `source_hash` | The claimed SHA-256 digest of the selected source material. |
| `artifact_hash_alg` | The hash algorithm named by the producer, currently `sha256`. |
| `status` | `success` for a current successful check; `stale` when the producer reports that its source evidence is no longer current. |

`success` and `stale` are producer assertions inside the signed claim, not conclusions independently established by signature verification. Consumers need ckg-agentforce's provenance and freshness rules to interpret them.

## Embedded key and compatibility boundary

ckg-agentforce includes a top-level `public_key` convenience field containing the raw 32-byte Ed25519 public key in base64. This makes a receipt self-contained for cryptographic checking, but a key carried by an untrusted receipt does not establish that the signer should be trusted.

This envelope is an external extension fixture, not a strictly compatible BoundaryAttest Interop Profile v0.1 receipt:

- BoundaryAttest's strict envelope accepts only `claim`, `signature`, and `public_key_id`; it rejects the additional top-level `public_key`.
- ckg-agentforce uses `receipt_version: "experimental-interop-v0.1"`, while the current strict profile requires `"0.1"`.
- ckg-agentforce prefixes its base64 signature with `ed25519:`; the strict profile stores the base64 signature without that prefix.

The example therefore uses explicit local verification logic matching the external producer. It does not pass this receipt to BoundaryAttest's strict verifier or weaken that verifier.

### Key-ID representation

ckg-agentforce appears to calculate:

```text
public_key_id = "sha256:" + hex(sha256(raw_32_byte_ed25519_public_key))
```

BoundaryAttest Interop Profile v0.1 calculates:

```text
public_key_id = "sha256:" + hex(sha256(spki_der_public_key_bytes))
```

These identifiers differ for the same Ed25519 key because the hashed byte representations differ. The fixture checks the CKG raw-key identifier explicitly and leaves BoundaryAttest's SPKI DER rule unchanged. An adapter translating this receipt into a BoundaryAttest-native receipt would need to remove `public_key`, use version `"0.1"`, remove the signature prefix, and recalculate the key ID over SPKI DER; changing signed claim fields also requires a new signature.

## Benchmark export claim

A related export seam can sign a compact benchmark result:

```json
{
  "receipt_version": "experimental-interop-v0.1",
  "receipt_role": "server_attested",
  "event_id": "ckg-benchmark-export-<uuid>",
  "timestamp": "2026-07-27T18:45:03.104Z",
  "action_type": "ckg.benchmark_result.exported",
  "status": "success",
  "domain": "agentforce",
  "queries_tested": 30,
  "f1_score": 0.471,
  "dataset_hash": "sha256:<hex>",
  "benchmark_artifact_hash": "sha256:<hex>",
  "artifact_hash_alg": "sha256"
}
```

This binds `domain + queries_tested + f1_score + dataset_hash + benchmark_artifact_hash`. The producer still must define exactly which dataset and artifact bytes are hashed.

## Verification limits

Successful fixture verification proves only that the embedded public key verifies the signature over the unchanged claim and that `public_key_id` matches that raw key. It does not prove:

- Salesforce source truth or availability;
- source extraction or interpretation correctness;
- graph completeness or correctness;
- benchmark inputs, execution, or score correctness;
- authorization to perform or attest the action;
- timestamp freshness, non-replay, key custody, or key revocation;
- long-term organizational identity or trust in the self-presented key.

Relying parties must establish key trust, freshness, authorization, artifact retrieval, digest recomputation, and correspondence with native provenance separately.
