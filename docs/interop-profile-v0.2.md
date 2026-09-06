# BoundaryAttest Interop Profile v0.2

Status: experimental compatibility profile using the external RFC 8785 standard. BoundaryAttest v0.2 is not itself a formal external standard. v0.1 remains frozen for legacy verification.

## Envelope and claim

The only top-level fields are `claim`, `signature`, and `public_key_id`; extras are forbidden. `claim` must be an object containing `receipt_version` exactly `"0.2"`, `receipt_role` (`client_observed` or `server_attested`), `event_id`, `timestamp`, `action_type`, and `status`. Adapter extensions remain inside the signed claim.

The signature is Ed25519 over UTF-8 bytes of the RFC 8785/JCS canonicalized `claim` only and is encoded as standard base64. `public_key_id` is `sha256:` plus lowercase SHA-256 hex of the expected public key's SPKI DER bytes. The verifier receives that expected key independently.

## JCS requirements

Inputs are I-JSON values. Object names are sorted recursively by raw, unescaped unsigned UTF-16 code units; arrays retain order. Strings use ECMAScript JSON escaping without Unicode normalization and lone surrogates are rejected. Finite IEEE-754 numbers use ECMAScript shortest JSON serialization (`-0` becomes `0`); NaN and infinities are rejected. Unsupported JavaScript values, sparse arrays, cycles, symbol keys, accessors, and non-JSON objects must not be silently coerced or omitted. Canonical JSON has no insignificant whitespace.

Implementations must emit object members directly in sorted order rather than rebuilding an object before `JSON.stringify`, because integer-like property enumeration can reorder names such as `"2"` and `"10"`.

## Verification and meaning

Verification uses the same structural checks and failure-code ordering as v0.1, with version `"0.2"` and JCS canonicalization. A passing result proves only envelope compatibility, key-fingerprint agreement, signature validity, and claim integrity. It does not prove truth, authorization, compliance, signer trust, runtime integrity, freshness, or business outcome. See the [adapter guide](interop-adapter-guide-v0.2.md), [limitations](interop-verification-limits-v0.2.md), [schema](schemas/interop-receipt-v0.2.schema.json), and [vectors](../examples/interop-v0.2/test-vectors/).
