# decisions — 29-bounded-implementation-discovery

## Product decisions

- **PD1 — Internal gate:** users invoke `execute-phase`; they do not need to
  remember a new public mapping command.
- **PD2 — Question-bound exploration:** seven fixed questions and evidence
  closure/blocker determine completion, never file/search/read counts.
- **PD3 — Read before write:** no source/test or setup mutation occurs before a
  complete READY map.
- **PD4 — Existing upstream owners:** Plan defects return to planning/review;
  Product/authority defects return to human design/review; mapping owns neither.
- **PD5 — No issue spill:** current-unit obligations stay in the unit; mapping
  never calls the forge.
- **PD6 — Measure before claim:** canary observations precede efficiency/token
  assertions.

## Engineering decisions

- **D1 — One internal progressive owner:** keep the discovery contract in one
  internal skill/reference loaded by `execute-phase` only on the pre-write path.
- **D2 — Inline/fresh risk route:** localized complete evidence may stay inline;
  uncertainty, topology, sensitive boundaries, prior attempts, or bias require
  a fresh read-only mapper.
- **D3 — Fixed map:** bind conclusion/evidence to SPEC/Plan receipts, phase
  fingerprint and obligations, HEAD/clean source, cited content, and a
  single-consumption mapping revision.
- **D4 — Preparation continuity:** map before any repository write; after READY,
  accept only unchanged HEAD or one direct descendant changing exactly the
  already-reviewed planning allowlist, then revalidate before code/test edit.
- **D5 — Four outcomes:** READY, REPLAN, NEEDS-DESIGN, BLOCKED; no
  NEEDS-DECISION alias or local Plan/spec repair.
- **D6 — Probe before READY:** run the cheapest relevant read-only falsifier;
  unavailable high-risk evidence blocks rather than becoming a rationale.
- **D7 — Ephemeral map:** no file/schema/public command; AWL may persist exact
  inputs/output/consumption opaquely and must retain the same semantics.
- **D8 — Advisory accelerators:** Serena/symbol navigation and Engram/memory may
  find evidence, but only current repository authority satisfies fields.
- **D9 — Distribution:** change canonical skills, rebuild Pi bundle through the
  feature-27 script, test byte parity, and version affected surfaces.
