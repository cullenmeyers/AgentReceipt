# Synthetic x402 authorization-linked receipt

This documentation-only fixture shows a BoundaryAttest Interop v0.1 receipt linking by digest to a separate, synthetic authorization artifact. It illustrates the two-layer pattern; it is not an x402 implementation, authorization format, settlement record, or production test vector.

## Files

- `boundaryattest-receipt.json` is a normal Interop v0.1 envelope. Its signed claim includes the optional adapter field `authorization_ref` and binds `result-artifact.json` with `artifact_hash`.
- `authorization-grant-signed.json` is a really signed, synthetic consent receipt. Its own canonicalization and Ed25519 signature are independent of BoundaryAttest.
- `authorization-grant.json` is the unsigned source body used to create the signed fixture; it makes the authorized facts inspectable without treating the synthetic key as a real identity.
- `authorization-grant-placeholder.json` is retained as a negative example showing why a labeled placeholder signature must not be accepted as authorization.
- `result-artifact.json` is the synthetic paid/requested API result being attested.
- `verify-authorization-link.py` is a dependency-light composition checker. It verifies the external grant under its own rules, verifies the BoundaryAttest envelope, normalizes `authorization_ref` as `sha256:<grant content_sha256>`, and checks the exact result-artifact bytes.

The grant's `content_sha256` is SHA-256 over its canonical body, excluding `content_sha256` and `signatures` (RFC 8785-compatible JSON for this float-free fixture). The BoundaryAttest adapter uses the explicit `sha256:<hex>` form, so the comparison rule is unambiguous without changing the Interop v0.1 schema.

## Run

From the repository root:

```sh
python3 examples/x402-authorization-linked-receipt-v0.1/verify-authorization-link.py
```

Expected result includes:

```json
{
  "ok": true,
  "authorization_ref_matches_grant_digest": true,
  "result_artifact_hash_matches": true
}
```

## Verification boundary

1. Verify the external grant's digest and authorizer signature with the grant's own verifier.
2. Verify the BoundaryAttest signature and recompute `artifact_hash` over the exact result bytes.
3. Compare `authorization_ref` to the external artifact's self-declared digest, after the explicit `sha256:` normalization.
4. Let a domain-specific checker decide whether the action falls within the external cap, purpose, expiry, and other conditions.

A matching link means only that the signed BoundaryAttest claim names the exact external authorization digest and result artifact. BoundaryAttest does not prove human identity, legal sufficiency, authorization validity, payment settlement, safety, correctness, or runtime integrity. The authorizer key, authorization facts, and result are synthetic.

This example deliberately makes no Interop v0.1 schema change, no core verifier change, and no required authorization layer. The authorization artifact is optional and external. See the [draft profile](../../docs/x402-authorization-linked-receipt-v0.1-draft.md) for the complete boundary and rationale.
