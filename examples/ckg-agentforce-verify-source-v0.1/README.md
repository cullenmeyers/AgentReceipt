# ckg-agentforce `verify_source` receipt fixture

This runnable example checks two self-contained receipts shaped like the external ckg-agentforce v0.5.3 implementation:

- `verify-source-receipt.json` represents `ckg.verify_source`.
- `benchmark-export-receipt.json` represents the proposed benchmark export claim.

The event identifiers, timestamps, URLs, hashes, key, and signatures are synthetic fixture data. They demonstrate the wire shape and cryptographic checks; they are not captured evidence from Salesforce or ckg-agentforce.

Run:

```sh
npm run build
npm run example:ckg-agentforce-verify-source-v0.1
```

The verifier uses isolated local logic matching the external format: Python-style sorted compact JSON for the claim, an `ed25519:` signature prefix, a base64 raw Ed25519 public key, and SHA-256 over that raw key for `public_key_id`.

This is an external/extension fixture, not a BoundaryAttest Interop Profile v0.1 vector. BoundaryAttest's strict verifier would reject the extra top-level `public_key` and the experimental version string. It also fingerprints SPKI DER rather than raw key bytes. The embedded key makes cryptographic verification self-contained; it does not make the key trusted.

Verification proves signer/key possession and claim integrity only. It does not prove Salesforce source truth, extraction correctness, graph completeness, benchmark correctness, authorization, freshness, or long-term organizational identity. See the [mapping note](../../docs/ckg-agentforce-boundaryattest-mapping-v0.1-draft.md) for field semantics and the full compatibility boundary.
