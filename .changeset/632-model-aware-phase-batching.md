---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": minor
---

feat: model-aware phase batching policy (issue #632)

The whole-unit executor mode stops being an assumption about what a model can
hold. The schema package publishes `phase-batching@1`: a versioned document
with the contract id, four closed vocabularies (decision, reason, tool harness,
cache posture), the capability and eligibility blocks, and a validator that
refuses any document whose decision, phase count and reason disagree.

The NaN preset carries the model half — one capability record per routed model
whose cells are facts the recorded catalog publishes (context window, the tool
harness its `capabilities[]` documents, the cache posture its own rate pair
implies) plus the phases the preset's declared thresholds derive from those two
— and a deterministic policy that turns an eligible unit and that record into
the document. It ships OFF, exposes `/nan-phase-batching` to print the
recommendation from a live session, and fails closed on every fact it cannot
read: an unknown model, an undocumented harness, an unmeasured cache, a flat
one, a high risk tier, a large unit, a Relay leg, or a single remaining phase.

The pi package declares the `phaseBatching.enabled` key in its extension
section (ONE optional boolean, shipped `false`, a misspelling refused by name),
so the preset can read it through the same seam that carries `tierRouting`; with
only this package installed the key is a documented no-op. No route, risk tier
or gate moves: one phase is still one commit, the diff guard still runs per
phase, and the evidence rows are the same rows. The default flips only when the
tier-cost corpus shows, over at least three real units per tier, a measured
saving at equal first-review PASS parity — recorded in `docs/workflow/CONFIG.md`
beside the key.
