# x402 authorization-linked receipt profile v0.1 (draft)

Status: experimental, documentation-only profile. This is not a change to the normative BoundaryAttest Interop Profile v0.1 schema.

## Purpose

An x402 or other payment flow may need evidence about both an action/result and the authority under which money was spent. Those are separate layers:

- **BoundaryAttest receipt:** a provenance, action, result, or handoff attestation. It narrowly establishes that the expected signing key signed a particular claim and that the signed claim was not altered.
- **External consent/authorization receipt:** a separately signed artifact describing who or what authorized the spend and its cap, purpose, expiry, or other authorization conditions.

BoundaryAttest does not define or interpret the authorization artifact. Amount, cap, purpose, expiry, identity, delegation, and consent semantics remain in the external format and its verifier.

## Optional signed claim link

An adapter may add `authorization_ref` inside an Interop v0.1 `claim`. It is an optional adapter-specific field, covered by the BoundaryAttest signature. It is never required for Interop v0.1 compatibility.

The recommended value is a content digest of the exact external signed authorization artifact, for example:

```json
"authorization_ref": "sha256:<64-lowercase-hex-digest>"
```

An integrating profile may instead use a structured value with a clearly defined `content_sha256` member. In either form, the profile must specify exactly which bytes or canonical representation are hashed. The example uses `sha256:` followed by SHA-256 of the external artifact's exact checked-in bytes.

`authorization_ref` is a content binding, not an authorization decision. It does not import the referenced artifact's semantics into BoundaryAttest and does not establish that the artifact is authentic, valid, applicable, or legally sufficient.

## Delegated authorization / operator approval gates

Some flows separate the parties involved in a spend or irreversible action. The **BoundaryAttest receipt signer** attests the action, result, or handoff claim; the **executor or agent** performs, submits, or broadcasts the action; and the **authorizer or operator** approves the action or spend before execution. These roles may be held by different parties.

In such a flow, `authorization_ref` may point to an external authorization or approval artifact whose own format and rules distinguish the authorizer from the executor and describe an amount or cap, purpose, scope, expiry, or other constraints. BoundaryAttest does not define or evaluate those roles or conditions. By binding the action or result claim to the external artifact's digest, a receipt can preserve the distinction between "agent decided and acted" and "agent executed an externally authorized decision."

This binding does not prove human identity, legal sufficiency, policy validity, payment settlement, correctness, safety, or runtime integrity. Those remain external facts and checks.

## Verification flow

1. Verify the BoundaryAttest receipt signature using an independently trusted expected public key, then recompute and compare any referenced action, artifact, or result hashes.
2. Fetch the external authorization artifact named by `authorization_ref` and recompute its digest using the profile's declared byte or canonicalization rule.
3. Verify the external authorization artifact using its own signature, identity, delegation, freshness, revocation, and validity rules.
4. If required, a domain-specific checker compares the payment or action with the external authorization envelope, including its amount or cap, purpose, expiry, subject, resource, and any other constraints.

Steps 2–4 are outside the BoundaryAttest Interop v0.1 verifier. A valid BoundaryAttest signature alone must not be treated as successful authorization or settlement.

## Non-proofs

Neither this linking pattern nor a passing BoundaryAttest verification proves:

- human identity or that a person participated;
- legal sufficiency, consent, or authorization validity;
- that a payment was submitted, accepted, or settled;
- that an action stayed within an amount, cap, purpose, expiry, or other authorization condition;
- safety, correctness, truth, completeness, or policy compliance;
- signer trustworthiness or appropriate key custody;
- runtime, host, tool, service, or execution integrity.

BoundaryAttest's narrow claim remains: the expected signer signed this claim about an artifact, action, result, or handoff, and the signed claim was not altered.

## Why this stays profile-level

Authorization systems differ in principals, delegation, budgets, currencies, purposes, expiry rules, revocation, legal meaning, and signature formats. Adding those concepts to the core schema would make BoundaryAttest responsible for domain policy it cannot verify and would broaden a deliberately narrow attestation primitive.

Interop v0.1 already permits signed adapter-specific fields inside `claim`, so an optional digest link requires no normative schema or verifier change. Applications that understand this profile can follow the reference and apply their own authorization rules; generic BoundaryAttest verifiers can safely treat it as an unknown signed claim extension.

See the [synthetic fixture set](../examples/x402-authorization-linked-receipt-v0.1/) for the linking pattern.
