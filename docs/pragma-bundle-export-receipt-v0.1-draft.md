# Pragma bundle export receipt profile v0.1 (draft)

Status: docs/examples-only discussion draft based on Pragma maintainer feedback. This is not an integration, endorsement, partnership, Pragma feature, or statement of Pragma support. It does not change BoundaryAttest's Interop Profile v0.1 schema, verifier, vectors, canonicalization, key-ID rules, package exports, or dependencies.

## Purpose and boundary

Pragma already verifies the internal structural and content integrity of a `.pragma` bundle using its normal bundle fingerprints and hashes. That validation remains authoritative for the bundle format.

This draft describes a separate, external receipt. BoundaryAttest signs a small claim over the bundle fingerprint, project fingerprint, root reference, and export metadata values that Pragma already exposes or computes. The receipt makes that external claim tamper-evident; it does not inspect or validate the bundle internals and does not replace any Pragma check.

```text
.pragma bundle -- Pragma validation --> computed fingerprints and metadata
                                          |
                                          v
                              external BoundaryAttest claim
```

## Claim shape

The receipt uses the unchanged BoundaryAttest Interop Profile v0.1 envelope. Profile-specific fields live inside `claim` and are therefore covered by the signature.

| Field | Meaning |
| --- | --- |
| `receipt_version` | The existing Interop Profile value, `"0.1"`. |
| `profile` | Draft profile identifier, `pragma.bundle.export-receipt`. |
| `profile_version` | Draft profile version, `0.1`. |
| `receipt_role` | Existing signer perspective. The fixture uses `client_observed` for an external exporter, not a Pragma attestation. |
| `action_type` | Fixed value `pragma.bundle.export`. |
| `status` | The external signer's claimed export result, not a conclusion established by signature verification. |
| `bundle_fingerprint` | Opaque fingerprint copied from or computed by Pragma for the bundle. Verifiers compare it with Pragma's independently computed value. |
| `project_fingerprint` | Opaque project fingerprint from Pragma, checked the same way. |
| `root_ref` | Pragma root reference associated with the export. |
| `export_metadata_hash` | Digest of the exact external export-metadata representation named by `export_metadata_hash_alg`. An implementation may instead carry non-sensitive `export_metadata` directly, but should define its representation precisely. |
| `pragma_version` | Optional Pragma version reported by the exporting environment, when present. |
| `bundle_format_version` | Optional bundle format version reported by Pragma, when present. |
| `signer.public_key_id` | Signed copy of the expected signer key identifier. It must agree with the envelope `public_key_id`; neither value establishes trust by itself. |
| `timestamp` | Time the external receipt claim was created. |
| `event_id` | Unique receipt event identifier used with relying-party replay policy. |

The sample labels the export metadata digest `sha256+boundaryattest-stable-json-v0.1` because it hashes the checked-in JSON value using BoundaryAttest's existing stable JSON serialization. This is an example convention, not a proposed Pragma fingerprint or canonicalization rule.

## Verification flow

1. Pragma verifies the `.pragma` bundle internals using its normal structural checks, fingerprints, and hashes.
2. BoundaryAttest verifies the signed external claim using a separately trusted expected public key and the unchanged Interop v0.1 rules.
3. The relying verifier compares `bundle_fingerprint`, `project_fingerprint`, `root_ref`, and the export metadata value or hash with values independently computed or reported through the trusted Pragma verification path.

A valid signature without step 1 or step 3 establishes only that the expected key signed the unchanged claim. A matching fingerprint does not expand what Pragma's fingerprint itself means.

## Explicit non-proofs

Even when all three verification steps pass, the receipt:

- does not prove the Flow is correct;
- does not prove the bundle is safe to import;
- does not replace Pragma's bundle validation;
- does not prove the signer is legally authorized;
- does not prove workspace, user, or organization identity unless key custody and identity mapping are separately trusted; and
- does not prove imported execution will behave correctly.

It also does not make timestamps trustworthy, prevent replay by itself, establish that the signer told the truth, or establish that the configured public key should be trusted. Relying parties own expected-key distribution, key custody, identity mapping, freshness/replay policy, and import or execution policy.

## Synthetic example

The [example fixture](../examples/pragma-bundle-export-receipt-v0.1/) contains placeholder Pragma-style fingerprints, synthetic metadata, an example public key, and a signed receipt. It is documentation test material only and is not evidence emitted by Pragma or a real workspace.
