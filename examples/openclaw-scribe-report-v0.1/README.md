# Synthetic SCRIBE External Report Handoff

Status: synthetic, docs/examples only, and experimental.

This example tests one narrow BoundaryAttest seam: SCRIBE generates an incident report inside a local SOC lab, the SOC prepares a recipient-specific external copy, and then hands that final artifact to an external reviewer that does not inherently trust the SOC's Wazuh, OpenCTI, OpenClaw, or local logging stack.

It is not an OpenClaw, Wazuh, or OpenCTI integration; it is not endorsed by those projects or by any developer whose feedback informed the scenario. It is not production SOC software or production key custody.

## Where the trust boundary is

The internal workflow is:

```text
SCOUT -> ORACLE -> DEFENDRIX -> optional RESPONDER -> SCRIBE
```

Those internal events do not each need a portable receipt. Within the SOC trust domain, the existing Wazuh, OpenCTI, OpenClaw, and local workflow records remain the appropriate source of truth. SCRIBE creating the report is also still an internal event.

BoundaryAttest starts being useful when the exact report crosses outside that domain. The example receipt therefore records `soc.report.external_handoff`, not report generation and not one receipt per agent.

The ordering is deliberate:

```text
internal SCRIBE report
-> redaction/rendering/recipient-specific packaging
-> final recipient-deliverable artifact
-> SHA-256 over those exact final bytes
-> sign external-handoff receipt
-> export final artifact + receipt
```

Hashing must happen after every transformation that changes the bytes the recipient is expected to verify. A pre-redaction source hash cannot stand in for a redacted or rendered deliverable.

## Files

- `internal-scribe-report.md` is a concise fictional source report retained inside the synthetic SOC. It is not the artifact covered by the portable receipt.
- `final-external-reviewer-report.md` is the final recipient-specific copy. This exact file, after its illustrative removal of internal ownership metadata, is the artifact covered by `artifact_hash`.
- `sample-receipt.json` is a genuinely signed BoundaryAttest Interop Profile v0.1 fixture.
- `sample-public-key.pem` is the expected demo public key. The matching checked-in interop demo key is development-only and must not be used for production custody.
- `verify-example.ts` verifies the signature, recomputes SHA-256 over the exact report bytes, and checks the optional RESPONDER representation.

## Receipt choices

The receipt reuses [Interop Profile v0.1](../../docs/interop-profile-v0.1.md) without changing its schema. SOC-specific fields are adapter extensions inside `claim`, so they are signed.

`receipt_role` is `server_attested` because the synthetic signer represents the SOC-side handoff service attesting to its own external export/handoff event. It is not the external recipient attesting to receipt, and it is not a client observing an unrelated executing server. This role does not make the SOC trustworthy; a verifier must obtain the expected public key through a trusted path and decide whether to rely on it.

`timestamp` is `2026-08-18T15:05:00.000Z`, the later handoff/attestation event time required by the profile. `report_generated_at` is `2026-08-18T14:22:31.000Z`, when SCRIBE created the report internally. Keeping both avoids incorrectly treating generation as the trust-boundary event.

`artifact_hash` is SHA-256 over the raw bytes of `final-external-reviewer-report.md`. It binds the signed handoff claim to the exact final content the external reviewer is supposed to verify—not the internal source and not an intermediate rendering. Changing even one byte causes the artifact comparison to fail.

If a client, regulator, and another incident-response team receive differently redacted, rendered, or packaged bytes, each final variant needs its own artifact hash, external-handoff event, and signed receipt. One receipt cannot verify several different outputs. Even semantically equivalent outputs require separate hashes when their bytes differ.

The nested `lineage` object contains only compact hashes of synthetic internal record references. It does not copy SCOUT, ORACLE, DEFENDRIX, or RESPONDER payloads into the portable receipt. These hashes neither reveal nor make the underlying records available. A verifier that wants to compare lineage needs the referenced evidence separately plus the same hashing rules used by the SOC.

`responder_status` is `no_response_required` and `lineage.responder_ref_hash` is explicitly `null`. Together they say the adapter considered RESPONDER, no execution occurred, and the absence is intentional. A null reference alone was ambiguous: it could also mean a response occurred but was not captured, or that the field was never populated.

For this example only, an adapter could use the small illustrative vocabulary `no_response_required`, `response_pending`, `response_not_captured`, `not_applicable`, and `response_recorded`. `response_recorded` should accompany a non-null reference hash. These values are not a BoundaryAttest core enum or a generalized RESPONDER standard; another adapter can define its own signed semantics.

## Source lineage and privacy

The portable receipt deliberately does not include a hash of `internal-scribe-report.md`. Its job is to let the recipient verify the final copy without receiving the source or internal SOC payloads. The originating SOC may keep a separate, access-controlled companion lineage record that binds the delivered variant's hash to a source-report hash. An authorized internal reviewer could later use that record and the retained files to examine the transformation.

Putting an opaque source hash in the portable claim could make cross-boundary correlation easier, but it also exports a stable identifier and does not prove the source was true, complete, securely retained, or correctly redacted. This example favors data minimization and keeps that linkage internal.

## Verification

From the repository root:

```sh
npm run build
npm run example:openclaw-scribe-report-v0.1
```

The verifier:

1. validates the Interop Profile v0.1 envelope and Ed25519 signature against the expected demo public key;
2. recomputes SHA-256 over the exact final external artifact bytes and compares it with `claim.artifact_hash`; and
3. checks the scenario's action, incident reference, role, and explicit RESPONDER status/reference combination.

Signature verification and artifact comparison are separate checks. A recipient should use an expected key obtained independently of an untrusted receipt and apply its own freshness, signer-trust, authorization, and acceptance policy.

## Narrow meaning and limitations

A passing check establishes only that the expected signing key signed the unchanged claim and that the supplied final recipient artifact bytes match the signed `artifact_hash`.

It does not prove that:

- the external party actually received the artifact;
- the report is true or the alert was real;
- SCOUT triaged correctly;
- ORACLE enrichment was accurate or complete;
- DEFENDRIX correlation was correct;
- RESPONDER made the correct decision or should have run;
- SCRIBE's narrative is true;
- the redaction was correct;
- the underlying SOC records were uncompromised or externally available;
- the incident report or evidence set is complete;
- the action was authorized;
- the signer should be trusted;
- the signing key had production-grade custody;
- the signer or runtime was uncompromised;
- regulatory, legal, or compliance requirements were satisfied; or
- the external party opened or read the report.

See [Interop v0.1 verification: trust and limitations](../../docs/interop-verification-limits-v0.1.md) for the profile-wide boundary.

## Feedback to seek from a real SOC workflow

The useful practitioner questions are deliberately small:

- Is the external handoff the right event to attest, and which SOC component actually controls that event?
- Can the handoff service reliably freeze and hash the exact final bytes before export, with no later transport transformation?
- Would an access-controlled internal companion lineage record be sufficient, or is the correlation value of an opaque source hash in the portable claim worth its disclosure and privacy cost?
- Does this example-specific RESPONDER vocabulary distinguish the operational states a recipient actually needs?
- What independent key-distribution, retention, and timestamp/freshness policy would an external reviewer require?

These questions test the receipt seam and field semantics; they are not a proposal for generalized SOC provenance, per-agent receipts, a new event bus, or a production adapter.
