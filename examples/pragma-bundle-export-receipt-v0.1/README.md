# Pragma bundle export receipt v0.1 draft example

This folder contains a synthetic, docs-only example of an external BoundaryAttest receipt around values already produced or checked by Pragma. It is not an integration, endorsement, partnership, Pragma feature, or statement of Pragma support.

Pragma and BoundaryAttest have separate jobs:

1. Pragma verifies the `.pragma` bundle internals using its normal fingerprints, hashes, and structural/content validation.
2. BoundaryAttest verifies the signed claim around those fingerprints using a separately trusted expected public key.
3. The verifier compares the receipt's bundle fingerprint, project fingerprint, root reference, and export metadata hash with the Pragma-computed bundle/project/root/export metadata values.

The receipt is a tamper-evident claim, not a substitute for checking the bundle. `sample-export-metadata.json` is the exact JSON value hashed by the fixture using BoundaryAttest stable JSON serialization. `sample-public-key.pem` is provided only to make the signature check reproducible; a production verifier must obtain its expected key through a trusted channel. All identifiers, versions, timestamps, metadata, and Pragma-style fingerprints are synthetic placeholders and are not evidence from Pragma or a real workspace.

Passing verification does not prove that the Flow is correct, that the bundle is safe to import, that the signer is legally authorized, or that imported execution will behave correctly. It does not replace Pragma's bundle validation. It does not prove workspace, user, or organization identity unless key custody and identity mapping are separately trusted.

See the [draft profile](../../docs/pragma-bundle-export-receipt-v0.1-draft.md) for the field mapping and complete verification boundary. The receipt keeps the unchanged Interop v0.1 envelope and key-ID rules; profile-specific data appears only inside `claim`.
