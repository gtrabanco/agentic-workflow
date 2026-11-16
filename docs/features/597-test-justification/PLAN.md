# #597 — Test justification at creation + evidence-backed deletion authority

## Origin

Issue [#597](https://github.com/gtrabanco/agentic-workflow/issues/597).

## What's wrong

The workflow now has a deletion-legality rule (owner 2026-11-16, recorded in #595/#596) and two upcoming surplus checks (#595 product-audit; #596 the relevance sweep), but **no surface authorizes or executes a test deletion**, and no surface requires a new test to justify itself:

1. When a test is marked for deletion (`fix-now (delete)` finding, or a plan step that removes a test), no skill's contract states it may actually delete — skills say "findings only, never edits code" (product-audit, review-*) or "never weaken a test" (execute-phase TESTS.md), and an agent reading those rules cannot distinguish an evidence-backed deletion from the forbidden weakening.
2. When a new test is created, nothing requires naming the **independent behavioral gap** it covers (TestPrism: passing a reference ≠ discriminating implementations; Zhang & Mesbah 2015: the obligation is the value unit; gentle-ai #5092's identical finding: "the worker guidance does not require explaining the additional protection of a new test"). Today the justification is model-guessed and unrecorded.

## Expected behaviour

1. **Oracle justification at creation — execute-phase.** A test the triage/plan requests carries a one-line justification naming the independent obligation: the observable contract or behavioral gap it covers, **not** the implementation under test. The RED evidence (which already names the targeted tests) carries the justification line in the unit doc's Evidence. A test without a justification line is a review finding (`fix-now`), not a silent pass. Prose owner: `skills/unit-lane/references/TESTS.md` + `skills/execute-phase/references/TEST_IMPACT.md`; no new ceremony beyond the line.
2. **Deletion authority, stated where it is executed:**
   - **execute-phase may delete a test when the unit's plan (the triaged step list) explicitly marks it** — the deletion is a planned task, its evidence row cites the legality ground (surface dead / obligation-level duplicate / cost-over-risk, owner rule 2026-11-16) and the evidence source.
   - **fold-findings may delete a test when a finding row is `fix-now (delete)`** — the row already carries the finding's evidence; the fold's commit and the `folded: yes` update record the deletion. This extends fold-findings' contract from "repair" to include evidence-backed deletion; its current wording ("never reclassify or substitute") stays intact.
   - **Nobody else deletes**: product-audit/review-* stay findings-only (their non-goals already say so); test-impact targeting never deletes.
3. **The boundary, written once:** deletion with cited evidence is legal; weakening, emptying, or skipping a test to make anything pass is never (AGENTS.md). Deleting a test is not an exception to red-first (red-first governs new pairs) and never happens to turn a red suite green — a suite that goes red because a deletion removes a needed guard is a planning error, routed back to the owner. Prose owner: `skills/unit-lane/references/TESTS.md`; AGENTS.md links it, not restates it (every-repetition-names-its-owner).
4. **Normative registration:** the deletion-grounds vocabulary (dead-surface / obligation-duplicate / cost-over-risk) needs its owner surface and a row in `docs/workflow/GATE_INVENTORY.md` + the AGENTS.md owner tables; budget re-basis for touched routes; changeset.

## Where

- `skills/unit-lane/references/TESTS.md` — the justification line, the deletion authority and the boundary (prose owner)
- `skills/execute-phase/` — the RED-evidence justification line; the planned-deletion task shape
- `skills/fold-findings/SKILL.md` — the `fix-now (delete)` execution contract
- `AGENTS.md` — link-only amendment to the tests-before-implementation bullet
- `docs/workflow/GATE_INVENTORY.md`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `.changeset/`

## Non-goals

- No decision-model dependency (the substrate's role is recorded in #444; nothing here reads a model).
- No new gate or script — prose contracts and existing gates only.
- No reclassification power for fold-findings (it executes what the finding already says).
- No deletion without the #595/#596 evidence standard.