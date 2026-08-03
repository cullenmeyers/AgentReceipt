# External interop patterns

## Why this page exists

BoundaryAttest is experimental and is not a standard. This page indexes external implementations, integration examples, and repository examples that have exercised its portable signed-claim model. It is a starting point for maintainers evaluating what has actually been tried, where strict interoperability ends, and which checks remain the integrating system's responsibility.

## Pattern 1: source/provenance claim receipt

[ckg-agentforce](https://github.com/Yarmoluk/ckg-agentforce) is an external implementation whose `verify_source(concept, receipt=True)` option emits a BoundaryAttest-style signed receipt for a source/provenance claim. The repository includes a [mapping note](ckg-agentforce-boundaryattest-mapping-v0.1-draft.md) and [runnable fixtures](../examples/ckg-agentforce-verify-source-v0.1/).

This validates source verification as a useful receipt seam, but the external envelope is not strictly compatible with Interop Profile v0.1. ckg-agentforce includes a top-level `public_key` convenience field and fingerprints raw Ed25519 key bytes. The strict BoundaryAttest envelope keeps only `claim`, `signature`, and `public_key_id`, and derives the key ID from SPKI DER bytes. Translation therefore requires explicit normalization and re-signing; the strict verifier is not relaxed.

## Pattern 2: export/import artifact handoff receipt

[agentenv](https://github.com/css521/agentenv) has an external integration example at `examples/boundaryattest-export/` (commit [`7110a264332509b8601c7090a9a80409f38ff9d3`](https://github.com/css521/agentenv/commit/7110a264332509b8601c7090a9a80409f38ff9d3)). It uses BoundaryAttest's Python interop example as a pinned compatibility checkout and gates import on:

- strict receipt verification against an expected public key;
- `server_attested`, action, status, and export-kind policy checks;
- SHA-256 recomputation over the exact received bundle bytes; and
- importing the same private staged bytes that were hashed.

The division of responsibility matters: BoundaryAttest proves expected-key possession and signed-claim integrity. The agentenv adapter owns claim policy, artifact binding, staging, and import gating. This is an external integration example, not a partnership, endorsement, or production-deployment claim.

## Pattern 3: Python-native arbitrary digest signing

The [Python interop example](../examples/python-interop-v0.1/) signs arbitrary host-provided artifact or action digests plus structured metadata. It emits the strict Interop Profile v0.1 envelope—`claim`, `signature`, and `public_key_id`—and requires Python's `cryptography` package. Its checked-in keys are demo-only, and its documented cross-language canonicalization limits are part of the example's compatibility boundary.

## Pattern 4: benchmark/eval result artifact receipt

The [benchmark/eval design note](benchmark-result-receipt-example.md) and [public-artifact example](../examples/benchmark-result-public-v0.1/) show a receipt binding a benchmark or eval artifact hash and signed metadata. That binding does not establish that the benchmark is correct, fair, representative, or complete.

Where reproducibility requires both views, a producer can record a hash of the exact raw artifact bytes and a separate hash of a documented public canonical artifact. The producer must define which bytes and canonicalization each digest covers; this does not change BoundaryAttest's signed-claim canonicalization.

## What these patterns have in common

- A small signed claim crosses a system or trust boundary.
- The expected public key comes from trusted verifier configuration, not from an untrusted receipt alone.
- Artifact consumers recompute digests over the exact bytes they will use.
- Domain semantics and accept/reject policy stay with the adapter or relying party.
- Strict envelope and key-ID rules remain stable even when an external producer uses a nearby experimental shape.

Additional [TrustMCP](../examples/trustmcp-post-scan-receipt/), [FAF](../examples/faf-mcp-handoff-v0.1/), and [Airflow](../examples/airflow-report-receipt/) examples explore related handoff and post-action receipt seams; they are experimental examples, not adoption claims.

## What BoundaryAttest does not prove

A passing signature check proves only that the corresponding expected key signed the unchanged claim. It does not prove truth, authorization, safety, compliance, signer trustworthiness, key custody, runtime integrity, artifact correctness, freshness, completeness, or downstream state. Relying parties must separately define signer trust, semantic policy, replay/freshness rules, artifact retrieval and digest checks, and the action taken after verification.

## Where to start

1. Read [Interop Profile v0.1](interop-profile-v0.1.md) and its [verification limits](interop-verification-limits-v0.1.md).
2. Run the [Interop v0.1 vectors](../examples/interop-v0.1/) to understand the strict envelope and failure cases.
3. Use the [Python interop example](../examples/python-interop-v0.1/) for a minimal cross-language signer/verifier or the [adapter guide](interop-adapter-guide-v0.1.md) for a dependency-free implementation path.
4. Choose the closest pattern above, then document the adapter-owned semantic and artifact checks explicitly.
