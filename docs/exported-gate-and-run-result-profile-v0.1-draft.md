# Exported Gate Decision and Run Result Profile v0.1 Draft

Status: experimental design note. This document is not a standard, does not define an integration, and is not part of the stable BoundaryAttest Interop Profile v0.1.

## Purpose and scope

This profile describes two narrow receipt seams for information exported across a trust domain:

- a gate decision sent to a different system or relying party; and
- an asynchronous workflow result handed to a downstream consumer.

The receipt is detached from the exported payload. It signs a canonical claim that binds the exported decision or result to digests of the existing, untouched bodies. The producer does not need to modify or rewrap those bodies, and the consumer can retain or forward the receipt independently.

The two shapes below are fixed for this draft. They are application-level claim shapes, not changes to the BoundaryAttest Interop v0.1 envelope or normative schema. An implementation using the Interop v0.1 envelope must map the profile claim into that envelope without relaxing its canonicalization, key-ID, or verification rules.

This note reflects a design fit identified from KRIY maintainer feedback. It does not add a KRIY integration, modify or prescribe KRIY payloads, or imply KRIY endorsement.

## Fixed receipt shape: `gate.decision`

Use `gate.decision` only when a gate decision is exported across a trust boundary. `gate_request_digest` binds the receipt to the exact exported gate-request body and `gate_response_body_digest` binds it to the exact exported gate-response body. `decision` is the producer's asserted verdict; its allowed vocabulary remains producer- or adapter-defined.

```json
{
  "receipt_type": "gate.decision",
  "profile": "exported.gate.decision",
  "profile_version": "0.1-draft",
  "gate_request_digest": {
    "algorithm": "sha256",
    "value": "<lowercase-hex-digest>",
    "content_type": "application/json",
    "byte_convention": "raw_http_body",
    "source": "<optional opaque request reference>"
  },
  "gate_response_body_digest": {
    "algorithm": "sha256",
    "value": "<lowercase-hex-digest>",
    "content_type": "application/json",
    "byte_convention": "raw_http_body",
    "source": "<optional opaque response reference>"
  },
  "decision": "<verdict>",
  "matched_gate_id": "<gate-id>",
  "matched_gate_name": "<gate-name>",
  "reason": "<producer-asserted reason>",
  "event_type": "<exported event type>",
  "workspace": "<opaque workspace reference>",
  "overridable": false,
  "timestamp": "<RFC 3339 timestamp>",
  "key_id": "<signing-key identifier>"
}
```

`profile` and `profile_version` are fields inside the signed claim. A filename, document title, envelope version, or out-of-band declaration is not a substitute for them. `workspace` is correlation context only. It does not restate or prove workspace membership, tenancy isolation, RBAC policy, or authorization. `matched_gate_id`, `matched_gate_name`, `reason`, and `overridable` are signer assertions and do not prove that the gate was correctly selected or evaluated.

## Fixed receipt shape: `run.result`

Use `run.result` for an asynchronous result exported to another trust domain. `result_digest` binds the receipt to the exact, untouched result payload or body under the declared digest convention.

```json
{
  "receipt_type": "run.result",
  "profile": "exported.run.result",
  "profile_version": "0.1-draft",
  "run_id": "<run-id>",
  "workflow_id": "<workflow-id>",
  "event_type": "<result event type>",
  "status": "<producer-asserted status>",
  "result_digest": {
    "algorithm": "sha256",
    "value": "<lowercase-hex-digest>",
    "content_type": "application/json",
    "byte_convention": "raw_http_body",
    "source": "<optional opaque result reference>"
  },
  "correlation_id": "<cross-system correlation identifier>",
  "exported_webhook_event_id": "<exported event identifier>",
  "timestamp": "<RFC 3339 timestamp>",
  "key_id": "<signing-key identifier>"
}
```

`profile` and `profile_version` are signed claim fields here as well. `exported_webhook_event_id` must be present when this receipt accompanies an exported `run.completed` event and identifies that event. For other event types it is optional and should be omitted when not applicable. `run_id`, `workflow_id`, `event_type`, `status`, `correlation_id`, and `exported_webhook_event_id` provide portable correlation and claimed result context. They do not establish that the run occurred as described, that the workflow was correct, or that the result is complete.

## Digest binding

Every digest field in this profile is a self-describing object with:

- `algorithm`: the digest algorithm, for example `sha256`;
- `value`: the digest value in an explicitly profile-defined encoding (this draft's examples use lowercase hexadecimal);
- `content_type`: the media type of the digested representation, for example `application/json` or `text/plain`;
- `byte_convention`: the rule that produces the digested bytes, such as `raw_http_body`, `jcs_canonical_json`, or `utf8_text`; and
- optional `source` (or an equivalently defined reference field): a stable, non-authoritative reference for locating or correlating the bytes.

`raw_http_body` means the exact octets sent or exported as the HTTP body, before any JSON parsing, reserialization, whitespace change, character-set conversion, decompression convention change, or other reformatting. A verifier must hash those retained bytes, not a reconstructed JSON value. `jcs_canonical_json` requires the parties to pin the applicable JSON Canonicalization Scheme specification/version. `utf8_text` means the UTF-8 encoding of the stated text; producers must also define whether line endings or Unicode normalization are preserved or normalized. The digest object's convention describes payload bytes only; it does not alter the Interop v0.1 signed-claim canonicalization rules.

For `gate.decision`, both digest objects are required: the request binding alone is insufficient because the signed decision must also bind the exact exported gate-response body. For `run.result`, `result_digest` is required and binds the untouched exported result body or artifact selected by the producer.

## Null and optional semantics

- `matched_gate_id` and `matched_gate_name` are non-null when an explicit gate matched. They may be `null` only when no explicit gate matched or when the producer used a documented default or fallback decision. They should not be omitted: explicit `null` distinguishes that case from a field that was not captured.
- A default or fallback gate decision must still include non-null `decision`, `reason`, `event_type`, `workspace`, `gate_request_digest`, and `gate_response_body_digest` fields. The `reason` should identify the default/fallback path without claiming more than the producer knows.
- `overridable` is a boolean when the source system has that concept and its value is known. It may be `null` or omitted only when the source system has no overridability concept. If the concept exists but the value is unknown or was not captured, the producer should represent that state explicitly rather than treating omission as “not applicable.”
- `exported_webhook_event_id` is required and non-null when a `run.result` receipt accompanies `run.completed`. It is omitted when no exported webhook event accompanies the result; `null` must not be used to blur an unknown or uncaptured identifier.

In general, producers must document field-level meanings and avoid ambiguous absence whenever a relying party needs to distinguish “not applicable,” “unknown,” and “not captured.” Profile-required fields must not be omitted merely because their value is inconvenient to obtain.

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
- Receipts should remain detached from an existing `run.completed` event or webhook body. Adoption should not require changing or rewrapping that existing body.
- The receipt must bind the required digests of untouched exported payloads or bodies. Each digest must declare its algorithm, value encoding, content type, and exact byte convention.
- Key publication, trusted discovery, rotation, retirement, and revocation semantics matter. A `key_id` alone is not a trust source, and a verifier must not trust a public key supplied only by an untrusted receipt.
- Timestamps are signer-asserted. They do not independently prove when an event happened, receipt freshness, or ordering between events.
- A payload hash needs a retention and retrieval story: verifiers need the original bytes to recompute it. When the relevant claims are small and disclosure is acceptable, embedding those claims in the signed receipt may be more durable, but still does not prove their truth.
- The verifier should be dependency-light, easy to implement, strict about canonicalization and signature encoding, and explicit about policy checks that remain outside cryptographic verification.

## Explicit non-proofs

Passing verification does not prove truth, authorization, safety, correctness, policy quality, workspace or RBAC validity, execution, result completeness, event time, event ordering, freshness, replay absence, signer trustworthiness, private-key custody, runtime integrity, or payload availability. Digest equality proves only equality of the bytes under the declared digest convention; it does not establish that those bytes are trustworthy or semantically correct.
