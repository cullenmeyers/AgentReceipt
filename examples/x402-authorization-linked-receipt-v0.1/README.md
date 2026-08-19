# Synthetic x402 authorization-linked receipt

This documentation-only fixture shows a BoundaryAttest Interop v0.1 receipt linking by digest to a separate, synthetic authorization artifact. It illustrates the two-layer pattern; it is not an x402 implementation, authorization format, settlement record, or production test vector.

## Files

- `boundaryattest-receipt.json` is a normal Interop v0.1 envelope signed by the demo receipt signer. Its claim identifies a synthetic executor agent, includes the optional adapter field `authorization_ref`, and binds `result-artifact.json` with `artifact_hash`.
- `authorization-grant-placeholder.json` stands in for an external operator approval artifact. It separately identifies the synthetic human/operator authorizer and the executor agent, and gives the approval a cap, purpose, scope, and expiry. Its rules belong entirely to that external system. Its deliberately marked placeholder signature is not verifiable and must never be accepted as real authorization.
- `result-artifact.json` is the synthetic API result being attested and carries a synthetic transaction reference for the executor's submitted payment.

The fixture therefore models three distinct roles: the BoundaryAttest receipt signer attests the claim, the agent executes the request and payment, and the operator approves the bounded spend beforehand. `authorization_ref` binds the signed action/result claim to the exact external approval artifact bytes; it does not turn the receipt signer or executor into the authorizer.

For these fixtures, both digest fields are `sha256:` plus lowercase SHA-256 of the exact checked-in file bytes, including formatting and the final newline:

```text
authorization_ref = sha256(exact bytes of authorization-grant-placeholder.json)
artifact_hash     = sha256(exact bytes of result-artifact.json)
```

The BoundaryAttest receipt is signed with the repository's public, demo-only Python interop key so its envelope has a structurally ordinary signature and key ID. The key is not copied into this folder because a key shipped beside a receipt would not establish trust. It can be checked with the expected public key at `../python-interop-v0.1/demo-public-key.pem`.

## Expected verification sequence

1. Verify the BoundaryAttest signature and recompute `artifact_hash` over the exact result bytes.
2. Recompute `authorization_ref` over the exact authorization artifact bytes.
3. Verify a real external authorization artifact under its own rules. This fixture intentionally cannot pass that step because its signature is a labeled placeholder.
4. Let a domain-specific checker decide whether the payment/action falls within the external cap, purpose, expiry, and other conditions.

A matching link means only that the signed BoundaryAttest claim names those exact external approval artifact bytes. It preserves the distinction between an agent making the decision and an agent executing an operator-authorized decision. BoundaryAttest does not prove human identity, legal sufficiency, policy or authorization validity, payment settlement, safety, correctness, or runtime integrity. Its narrow proof is that the expected signing key signed the unchanged claim.

See the [draft profile](../../docs/x402-authorization-linked-receipt-v0.1-draft.md) for the complete boundary and rationale.
