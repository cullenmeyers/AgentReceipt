# Synthetic SCRIBE External Report Handoff

Status: synthetic, docs/examples only, and experimental.

This example tests one narrow BoundaryAttest seam: SCRIBE generates an incident report inside a local SOC lab, then the SOC hands the exact report artifact to an external reviewer that does not inherently trust the SOC's Wazuh, OpenCTI, OpenClaw, or local logging stack.

It is not an OpenClaw, Wazuh, or OpenCTI integration; it is not endorsed by those projects or by any developer whose feedback informed the scenario. It is not production SOC software or production key custody.

## Where the trust boundary is

The internal workflow is:

```text
SCOUT -> ORACLE -> DEFENDRIX -> optional RESPONDER -> SCRIBE
```

Those internal events do not each need a portable receipt. Within the SOC trust domain, the existing Wazuh, OpenCTI, OpenClaw, and local workflow records remain the appropriate source of truth. SCRIBE creating the report is also still an internal event.

BoundaryAttest starts being useful when the exact report crosses outside that domain. The example receipt therefore records `soc.report.external_handoff`, not report generation and not one receipt per agent.

## Files

- `synthetic-incident-report.md` is a concise, fictional SCRIBE report with no live infrastructure, credentials, personal data, or operational malware instructions.
- `sample-receipt.json` is a genuinely signed BoundaryAttest Interop Profile v0.1 fixture.
- `sample-public-key.pem` is the expected demo public key. The matching checked-in interop demo key is development-only and must not be used for production custody.
- `verify-example.ts` verifies the signature, recomputes SHA-256 over the exact report bytes, and checks the optional RESPONDER representation.

## Receipt choices

The receipt reuses [Interop Profile v0.1](../../docs/interop-profile-v0.1.md) without changing its schema. SOC-specific fields are adapter extensions inside `claim`, so they are signed.

`receipt_role` is `server_attested` because the synthetic signer represents the SOC-side handoff service attesting to its own external export/handoff event. It is not the external recipient attesting to receipt, and it is not a client observing an unrelated executing server. This role does not make the SOC trustworthy; a verifier must obtain the expected public key through a trusted path and decide whether to rely on it.

`timestamp` is `2026-08-18T15:05:00.000Z`, the later handoff/attestation event time required by the profile. `report_generated_at` is `2026-08-18T14:22:31.000Z`, when SCRIBE created the report internally. Keeping both avoids incorrectly treating generation as the trust-boundary event.

`artifact_hash` is SHA-256 over the raw bytes of `synthetic-incident-report.md`. It binds the signed handoff claim to that exact exported content. Changing even one byte causes the example's artifact check to fail.

The nested `lineage` object contains only compact hashes of synthetic internal record references. It does not copy SCOUT, ORACLE, DEFENDRIX, or RESPONDER payloads into the portable receipt. These hashes neither reveal nor make the underlying records available. A verifier that wants to compare lineage needs the referenced evidence separately plus the same hashing rules used by the SOC.

`responder_ref_hash` is explicitly `null`: no RESPONDER playbook or agent action occurred. The field distinguishes an inapplicable response step from a required or silently invented one.

## Verification

From the repository root:

```sh
npm run build
npm run example:openclaw-scribe-report-v0.1
```

The verifier:

1. validates the Interop Profile v0.1 envelope and Ed25519 signature against the expected demo public key;
2. recomputes SHA-256 over the exact report file bytes and compares it with `claim.artifact_hash`; and
3. checks the scenario's action, incident reference, role, and `null` RESPONDER reference.

Signature verification and artifact comparison are separate checks. A recipient should use an expected key obtained independently of an untrusted receipt and apply its own freshness, signer-trust, authorization, and acceptance policy.

## Narrow meaning and limitations

A passing check establishes only that the expected signing key signed this unchanged claim about this specific report artifact and SOC-side handoff, and that the supplied report bytes match its signed `artifact_hash`.

It does not prove that:

- the alert was real;
- SCOUT triaged correctly;
- ORACLE enrichment was accurate or complete;
- DEFENDRIX correlation was correct;
- RESPONDER made the correct decision or should have run;
- SCRIBE's narrative is true;
- the underlying SOC records were uncompromised or externally available;
- the incident report or evidence set is complete;
- the action was authorized;
- the signer should be trusted;
- the signing key had production-grade custody;
- the signer or runtime was uncompromised;
- regulatory, legal, or compliance requirements were satisfied; or
- the external party actually received, opened, or read the report.

See [Interop v0.1 verification: trust and limitations](../../docs/interop-verification-limits-v0.1.md) for the profile-wide boundary.

## Feedback to seek from a real SOC workflow

The useful practitioner questions are deliberately small:

- Is the external handoff the right event to attest, and which SOC component actually controls that event?
- Can the handoff service reliably hash the exact bytes the recipient receives, after rendering, redaction, packaging, or transport transformations?
- Are opaque lineage hashes useful, and what stable internal record bytes or identifiers should each hash cover?
- Is explicit `null` sufficient for a non-invoked RESPONDER, or is a signed reason/status needed?
- What independent key-distribution, retention, and timestamp/freshness policy would an external reviewer require?

These questions test the receipt seam and field semantics; they are not a proposal for generalized SOC provenance, per-agent receipts, a new event bus, or a production adapter.
