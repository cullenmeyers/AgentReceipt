# Provider-side signing: adoption strategy and risk

BoundaryAttest may be less constrained by receipt format than by whether providers and servers are willing to sign receipts. This note captures that open strategic question. It is informed by feedback from Kin Lane / API Evangelist and should not be read as evidence of established customer or provider demand.

## Where logs are enough

Inside a single accepted trust boundary, ordinary application logs, provider audit logs, and traces are usually the better tools. If the operator, user, and reviewer all accept the same system of record, a portable signature may add cost without resolving a meaningful disagreement.

BoundaryAttest should not require every internal event to be signed. Selective receipts are more plausible for consequential actions at boundaries where the parties do not share, control, or indefinitely trust the same logs.

## Where portable receipts may matter

The stronger case is a cross-boundary agent or API action: a user or organization asks a third-party provider to do something, and the parties may later disagree about what the provider observed, allowed, refused, or executed. A narrow signed receipt can travel with a ticket, transaction, workflow, audit packet, or dispute record without requiring every relying party to have access to the provider's internal logs.

API catalog and agent-readiness work also points to a possible gap: an API may describe available operations while lacking a declared, verifiable account of what an agent was permitted to do and what it actually did. A receipt could help carry part of that account across systems, but BoundaryAttest does not yet establish that providers or customers will adopt it for this purpose.

## Evidence from discoverable dry-run support

“71 of 26,568 scored providers (0.27%) declared a dry-run or simulate mode, as measured by API Evangelist on 2026-08-12. This counts what is discoverable in machine-readable form and is therefore a floor.”

This statistic measures machine-readable, discoverable declarations, not all dry-run or simulation behavior that may exist internally or be documented elsewhere. It may therefore undercount genuine dry-run or simulate behavior. At the same time, naive keyword matching would overcount: terms such as `preview` and `validate` often refer to content rendering or request/schema validation rather than simulation of an operation's effects.

The finding is evidence that a discoverability and attestation gap exists, but it does not prove customer or provider demand for BoundaryAttest. Nor does it imply that APIs without these declarations are unsafe.

## Two provider adoption motions

The evidence points to two distinct provider populations and messages:

- for providers with dry-run or simulate behavior: **sign what you already simulate**; and
- for x402 or other per-call payment providers: **sign what you already settle**.

The observed intersection between these populations is empty. That means they should be treated as two different adoption motions, not as one unified cohort. Dry-run and simulation support is stronger evidence that the gap exists: providers already distinguish a proposed operation from its effects, creating a natural place for an attributable receipt. But x402 and per-call payment providers are the stronger first-customer wedge because settlement already involves a counterparty, amount, request, outcome, and possible dispute.

## Why `server_attested` is the important test

A `client_observed` receipt is primarily the client's signed account of what it sent and received. It can preserve client-side evidence, but it is weak when the dispute is specifically about what a provider received, permitted, refused, or executed.

A `server_attested` receipt is more valuable in that dispute because the provider or executing server signs a narrow claim about its own observation or action. The signature still does not prove that the claim is true or that the action was correct, safe, or authorized. Its value comes from attributable provider-side authorship, subject to trust in the signing key, key custody, and server runtime.

## Provider incentives and costs

A provider might sign receipts if doing so measurably reduces customer, audit, support, or dispute pain. Potential benefits include giving enterprise customers portable evidence for consequential operations, shortening investigations, clarifying whether an action was allowed or refused, and reducing dependence on bespoke log exports.

Those benefits must outweigh real costs and risks:

- implementing and operating signing at the correct server boundary;
- protecting, rotating, and publishing trust information for signing keys;
- defining stable, narrow claims and retention behavior;
- handling support questions when receipts and other records appear to differ;
- managing throughput, latency, storage, and availability impact;
- reviewing privacy, confidentiality, regulatory, and disclosure concerns; and
- accepting possible legal, contractual, or reputational consequences of an attributable signed statement.

Providers may rationally prefer their existing logs, audit products, or contractual reports. They may also see signed receipts as creating a new evidentiary or support obligation without sufficient customer benefit.

## Adoption risks and the next milestone

The central adoption risk is that the party whose signature would add the most value has the weakest incentive to provide it. A technically interoperable receipt format is insufficient if providers will not operate signing keys, commit to claim semantics, and support the resulting evidence.

The concrete milestone is therefore not another receipt variant or additional format work. One real provider or executing server signing a `server_attested` receipt in a real or near-production flow matters more than additional format work. That implementation should document:

- the customer, audit, or dispute problem it removes;
- why the provider agreed to sign;
- the exact claim and boundary the provider was willing to attest;
- implementation, operations, privacy, legal, and support costs; and
- how relying parties used the receipt alongside—not instead of—existing logs.

Until that milestone is met, provider-side signing should remain an open adoption hypothesis and strategic risk, not a demand or product-market-fit claim.

## Non-goals

Provider-side receipts are not intended to:

- replace application logs, traces, provider audit logs, or other systems of record;
- prove truth, correctness, safety, or authorization by themselves;
- require every internal event or low-value diagnostic action to be signed; or
- force providers to expose sensitive request or response payloads. Narrow claims and digests can avoid disclosure, although providers must still evaluate metadata leakage and correlation risk.
