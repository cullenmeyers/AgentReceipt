# Interop v0.2 test vectors

`canonicalization-vectors.json` is language-neutral: each case supplies source JSON, expected canonical text, UTF-8 hex, and SHA-256. The Unicode case incorporates the RFC 8785 UTF-16 ordering sanity rule (an astral character sorts before U+FFFD) and proves that precomposed and combining forms are not normalized.

The receipt fixtures use the checked-in key named `test-only-private-key.pem`. It is the same public demo key material already used by the repository's v0.1 Python example, copied here only to make this fixture self-contained. It was originally created with OpenSSL Ed25519 key generation and must never be used outside tests or examples.
