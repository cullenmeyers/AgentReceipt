# Exported Gate Decision and Run Result Profile v0.1 Draft

Status: experimental design note. This document is not a standard, does not define an integration, and is not part of the stable BoundaryAttest Interop Profile v0.1.

## Purpose and scope

This profile describes two narrow receipt seams for information exported across a trust domain:

- a gate decision sent to a different system or relying party; and
- an asynchronous workflow result handed to a downstream consumer.

The receipt is detached from the exported payload. It signs a canonical claim that binds the exported decision or result to a digest of the existing, untouched request or result body. The producer does not need to modify that body, and the consumer can retain or forward the receipt independently.

The two shapes below are fixed for this draft. They are application-level claim shapes, not changes to the BoundaryAttest Interop v0.1 envelope or normative schema. An implementation using the Interop v0.1 envelope must map the profile claim into that envelope without relaxing its canonicalization, key-ID, or verification rules.

This note reflects a design fit identified from KRIY maintainer feedback. It does not add a KRIY integration, modify or prescribe KRIY payloads, or imply KRIY endorsement.

## Fixed receipt shape: `gate.decision`

Use `gate.decision` only when a gate decision is exported across a trust boundary. `gate_request_digest` binds the receipt to the exact, untouched gate request bytes under the declared digest convention. `decision` is the producer's asserted verdict; its allowed vocabulary remains producer- or adapter-defined.

```json
{
  "receipt_type": "gate.decision",
  "gate_request_digest": "sha256:<hex-digest>",
  "decision": "<verdict>",
  "matched_gate_id": "<gate-id>",
  "matched_gate_name": "<gate-name>",
  "reason": "<producer-asserted reason>",
  "event_type": "<exported event type>",
  "workspace_ref": "<opaque workspace reference>",
  "timestamp": "<RFC 3339 timestamp>",
  "key_id": "<signing-key identifier>"
}
```

`workspace_ref` is correlation context only. It does not restate or prove workspace membership, tenancy isolation, RBAC policy, or authorization. `matched_gate_id`, `matched_gate_name`, and `reason` are signer assertions and do not prove that the gate was correctly selected or evaluated.

## Fixed receipt shape: `run.result`

Use `run.result` for an asynchronous result exported to another trust domain. `result_digest` binds the receipt to the exact, untouched result payload or body under the declared digest convention.

```json
{
  "receipt_type": "run.result",
  "run_id": "<run-id>",
  "workflow_id": "<workflow-id>",
  "event_type": "<result event type>",
  "status": "<producer-asserted status>",
  "result_digest": "sha256:<hex-digest>",
  "correlation_id": "<cross-system correlation identifier>",
  "timestamp": "<RFC 3339 timestamp>",
  "key_id": "<signing-key identifier>"
}
```

`run_id`, `workflow_id`, `event_type`, `status`, and `correlation_id` provide portable correlation and claimed result context. They do not establish that the run occurred as described, that the workflow was correct, or that the result is complete.

## What this profile is not for

This profile is deliberately not for:

- synchronous internal gate calls, such as an internal `POST /events/decide`, when caller and decision service are inside the same trust boundary;
- restating existing workspace, tenancy, or RBAC controls;
- generic, high-volume receipts for every tool call; or
- proving that an action or decision was safe, correct, authorized, compliant, or successfully executed.

A valid receipt proves only that the holder of the expected private key signed the unchanged canonical claim. The relying party still owns signer trust, payload retrieval, digest comparison, semantic policy, freshness and replay policy, and any downstream action.

## Shared-secret webhook signatures vs portable public-key receipts

An HMAC webhook signature authenticates delivery to a subscriber that holds the shared secret and, when combined with a nonce, timestamp, or delivery identifier and appropriate subscriber state, supports replay prevention. This is a useful delivery control.

Its verification is limited to holders of the shared secret. Because both sender and receiver can compute the same HMAC, a receiver cannot later show an independent third party cryptographic evidence that only the sender could have minted.

A detached public-key receipt signs a canonical digest with the producer's private key. A third party can verify it using the published public key without holding a subscription secret, and the receiver cannot mint another valid producer receipt. This portability and asymmetric minting property—not duplication of webhook delivery authentication—is the main value of this profile.

The two mechanisms can coexist: an HMAC can protect webhook delivery while a detached public-key receipt can travel with, or separately from, the exported decision or result.

## Adoptability constraints

- Canonicalization must be pinned by name and version. All signers and verifiers must agree on the exact bytes covered by the signature.
- Receipts should remain detached from an existing `run.completed` event or webhook body. Adoption should not require changing that existing body.
- The receipt must bind a digest of the untouched exported payload or body. The digest algorithm and the exact byte representation covered must be explicit.
- Key publication, trusted discovery, rotation, retirement, and revocation semantics matter. A `key_id` alone is not a trust source, and a verifier must not trust a public key supplied only by an untrusted receipt.
- Timestamps are signer-asserted. They do not independently prove when an event happened, receipt freshness, or ordering between events.
- A payload hash needs a retention and retrieval story: verifiers need the original bytes to recompute it. When the relevant claims are small and disclosure is acceptable, embedding those claims in the signed receipt may be more durable, but still does not prove their truth.
- The verifier should be dependency-light, easy to implement, strict about canonicalization and signature encoding, and explicit about policy checks that remain outside cryptographic verification.

## Explicit non-proofs

Passing verification does not prove truth, authorization, safety, correctness, policy quality, workspace or RBAC validity, execution, result completeness, event time, event ordering, freshness, replay absence, signer trustworthiness, private-key custody, runtime integrity, or payload availability. Digest equality proves only equality of the bytes under the declared digest convention; it does not establish that those bytes are trustworthy or semantically correct.
