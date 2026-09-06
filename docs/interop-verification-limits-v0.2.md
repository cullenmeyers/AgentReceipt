# Interop v0.2 verification: trust and limitations

A pass establishes that the strict envelope and required v0.2 claim fields are present, the independently expected Ed25519 public key has the stated SPKI fingerprint, and that key verifies the unchanged JCS-canonical claim.

It does not establish truth, authorization, identity, key custody quality, runtime integrity, safety, compliance, freshness, uniqueness, artifact availability, or business outcome. Relying parties remain responsible for signer trust, revocation and rotation, timestamp and replay policy, authorization, evidence retrieval, and domain-specific validation. RFC 8785 also intentionally limits inputs to the I-JSON/IEEE-754 domain and performs no Unicode normalization.
