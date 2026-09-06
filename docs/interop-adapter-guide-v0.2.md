# Interop Profile v0.2 adapter guide

Map a selected local event into the v0.2 required claim fields plus signed adapter extensions. Validate it as I-JSON, canonicalize the claim with RFC 8785, UTF-8 encode it, and sign those bytes with an operator-controlled Ed25519 key. Publish only the strict three-field envelope and identify the key with its SPKI DER SHA-256 fingerprint.

Keep signing keys outside agent/model inputs. Supply the expected public key to verifiers through trusted configuration, not from the receipt. Preserve source logs and evidence separately; hashes and receipts correlate evidence but do not replace operational records or prove that claim contents are true.

Run both language implementations against the shared vectors before exchanging receipts. Do not use `sort_keys`, locale comparison, or a sorted reconstructed JavaScript object as a JCS substitute.
