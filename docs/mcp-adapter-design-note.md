# MCP Adapter Design Note

Status: experimental design note. This document records the current design conclusion from BoundaryAttest issue #2. It is not a specification, dependency commitment, or change to the stable BoundaryAttest Interop Profile v0.1.

## Purpose

BoundaryAttest may support MCP-oriented adapters that help MCP clients and servers emit portable signed receipts around selected trust-boundary events. The adapter layer should make common receipt patterns easier to adopt while preserving the distinction between what a client observed, what a server attested, and what only project-specific code can describe accurately.

## Key conclusion

Use both an MCP SDK wrapper and project hooks, not either/or.

A thin wrapper can provide a useful baseline with little integration work. Project hooks remain necessary wherever the meaningful auditable event is more specific than an MCP request or response envelope. The two approaches serve different trust boundaries and levels of domain knowledge.

## `AttestedClient`

`AttestedClient` is the highest-value candidate for a thin SDK wrapper. It would wrap MCP client calls and emit baseline `client_observed` receipts for what the client observed sending and receiving.

Where appropriate, the wrapper would hash the request, response, or error rather than store raw payloads. This makes it useful for low-integration adoption and for applications that want portable evidence around calls without deeply modifying their MCP client code.

A client-observed receipt cannot prove what the server actually executed. It establishes only the signed client's claim about the request it sent and the response or error it observed, under the applicable key and runtime trust assumptions.

## `AttestedServer`

`AttestedServer` should be opt-in middleware or hook infrastructure, with receipt emission off by default. Projects should enable it per tool or per selected event rather than blanket-wrap every handler blindly.

For simple tools, a handler-level hook may be enough. For composite tools, the server adapter may expose a sub-event API so project code can identify individual high-value operations within one MCP tool call. It should emit `server_attested` receipts only for selected events whose meaning and evidence are worth preserving.

## Project hooks

Project hooks remain necessary because a single composite tool may contain multiple meaningful auditable events. An SDK envelope alone cannot infer which internal operation crossed a trust boundary or which domain context makes that operation intelligible.

Project-specific mapping may be required for:

- artifact hashes and target references
- policy and redaction decisions
- session, task, workflow, or tenant labels
- domain-specific status and event meaning
- final outputs that differ from the raw MCP response shape

Selective capture is a feature, not a flaw. It limits noise, disclosure, storage, and misleading claims while letting projects attest the events that actually matter.

## Adapter mechanics worth standardizing

An experimental adapter could standardize a small set of mechanics without standardizing project policy:

- hash-not-payload defaults, so raw prompts, outputs, and sensitive inputs are not retained unless explicitly chosen
- redaction hooks that run before hashing or receipt construction, with clear semantics about what representation was hashed
- explicit `receipt_role` selection, especially `client_observed` versus `server_attested`
- a small, documented status vocabulary for successful calls, tool errors, transport errors, cancellations, and other relevant outcomes
- fail-open sink behavior, so receipt persistence failures do not break the underlying MCP operation by default, while still being observable
- consistent verification-limits wording that states what signatures, hashes, roles, and runtime trust do and do not establish
- correlation IDs for relating client receipts, server receipts, traces, tasks, and project events without implying equivalence
- optional artifact hash support with explicit algorithm and scope

## Non-goals

The MCP adapter should not:

- replace project logs or traces
- prove correctness, authorization, compliance, or runtime integrity
- require raw prompt or output storage
- force all MCP tools to emit receipts
- change the stable BoundaryAttest Interop Profile v0.1
- become a policy engine

## Relationship to Code Engine MCP

Code Engine MCP validated a project-hooks approach using BoundaryAttest v0.1 interop. That work included CI on both sides, a persisted key with external verification, artifact hash verification, and optional provenance behind `PROVENANCE_ENABLED`.

This experience is design input: it demonstrates that project hooks can carry application-specific provenance while remaining interoperable at the receipt layer. It does not make Code Engine MCP a BoundaryAttest dependency, and it is not an endorsement or compatibility commitment beyond the behavior that was tested.

## Open questions

- What should the exact `AttestedClient` API be?
- What should the exact `AttestedServer` API be?
- What shape should a sub-event API use for composite tools?
- How should streaming, large, or multimodal content be hashed?
- How should client and server receipts be correlated without overstating what correlation proves?
- What should adapter fixtures contain and validate?
- Should the adapter become an experimental package, or remain docs and examples first?

This note does not change the core receipt envelope, Interop Profile v0.1 semantics, schema, verifier behavior, canonicalization, cryptography or key handling, test vectors, package exports, or CI behavior.
