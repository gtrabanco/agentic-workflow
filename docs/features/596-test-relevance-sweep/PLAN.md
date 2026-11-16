# #596 — Test relevance sweep: obligation tags per suite, duplication evidence, measured wall-clock

## Origin

Issue [#596](https://github.com/gtrabanco/agentic-workflow/issues/596).

## What's wrong

Issue #364 ("test triage — relevance review of all suites") was closed as a duplicate of #356 on 2026-11-02, but the two overlap only partially. #356 shipped the **execution** half (test targeting + the recorded `empty` verdict — implemented: `scripts/test-impact.mjs`, `skills/execute-phase/references/TEST_IMPACT.md`, the AGENTS.md rule amendment). #364's remaining points **never shipped**:

1. **Relevance audit of every suite**: "each test tagged by the surface it protects; suites that duplicate coverage are merged or deleted (with evidence)" — no tag surface, no sweep, no duplication evidence mechanism exists (verified 2026-11-16: nothing in `scripts/`, `skills/`, `docs/workflow/`).
2. The `skill-lint` tag-coverage check #364 named in its Where section.
3. The measured wall-clock per change class (docs-only / script change / package change) before/after.

Today ~114 root suites exist with no recorded justification per suite, and the workflow cannot answer "which tests justify their cost?" deterministically.

The utility standard is settled science (execution half already cites TDAD arXiv 2603.17973; the surplus standard):

- Zhang & Mesbah, ESEC/FSE 2015 — assertions (the obligations) correlate with effectiveness; the line count does not (Inozemtseva & Holmes, ICSE 2014 — coverage ≈ 0 correlation with effectiveness controlling suite size).
- Rothermel et al. 1998 / Rothermel, Harrold et al. 2004 — coverage-based test-suite minimization can **severely compromise fault detection**; deletion must be obligation-safe, not line-safe.
- Harrold, Gupta, Soffa 1993 — the classical minimization formulation (greedy over test requirements): the mechanism shape for obligation-level dedup.
- Elbaum et al. 2000/2002 (test prioritization) — rank by expected fault-detection value: the shape for ordering the sweep.
- Myers 1979 — a test exists to find errors; risk-based testing (ISTQB/Bach) — intensity proportional to complexity/risk.
- Recent: arXiv 2607.22880 (suite size weakly correlates with kill-rate for LLM tests), arXiv 2610.32548 BlindSpot (obligation taxonomy: boundary-value adequacy, control-flow adequacy, oracle strength — the AAA-aligned classification to adopt).

## Expected behaviour

1. **Closed obligation vocabulary** (the tag's values), declared as a `schema-export` in `packages/agentic-workflow-schema/src/vocabularies.ts` with its owner doc — proposed starter set, adapted from BlindSpot's obligation metrics + Zhang & Mesbah: `contract` (the observable API/behavior contract), `failure-path`, `boundary`, `prompt-byte`/`distribution-contract` (distribution-surface tests — legitimate even where they look redundant), `fixture-support`, `convention`.
2. **Tag surface beside each suite** — one annotation line at the suite head naming the surface it protects and its obligation values. Beside-the-suite (not a central registry) so tags cannot rot away from what they describe; the deadcode-ratchet lesson (gentle-ai #4120: orphan helpers invisible to a binary-rooted scan).
3. **The sweep** — all root suites tagged; per-cluster owner decision (keep / merge / delete) recorded. A test disappears exactly when its surface no longer exists, it is an obligation-level duplicate, or its cost exceeds the risk it covers (owner rule 2026-11-16). Deletion **never** happens on line-coverage evidence alone (Rothermel's warning); the deterministic evidence is obligation-level duplication (from the tags) plus **selective** mutation kill-rate on contested/suspicious clusters — deterministic trigger for which clusters get the sweep (highest-cost, lowest-obligation-count first — Elbaum's prioritization shape); never exhaustive (cost precedent: gentle-ai #5092 rejected mandatory mutation passes).
4. **The maintenance rule, mechanically armed**: a gate check (structural-sibling-pins style) refuses a new suite without a tag; product-audit's surplus check (#595) consumes the tags — surface gone ⇒ test flagged for deletion. When the tagged surface disappears, the test disappears: the tag is what makes that rule detectable without re-deriving it every audit.
5. **Measured wall-clock per change class** (#364's point 4, owner-requested inclusion): docs-only / script change / package change, measured before the sweep and after, recorded in the unit doc's evidence.
6. **test-impact.mjs stays untouched and model-free** — the targeting half is done and correct; this unit adds the justification half.
7. **Normative registration**: vocabulary row in AGENTS.md's `normative-surfaces@1` + `GATE_INVENTORY.md`; tag grammar owner doc; budgets re-based for touched surfaces.

## Where

- `packages/agentic-workflow-schema/` — the obligation vocabulary (`schema-export`), version bump
- `scripts/` — the tag-presence gate check + its sibling suite (red-first, two commits); optional: the duplication-evidence helper and its suite
- `skills/unit-lane/references/TESTS.md` + AGENTS.md — the deletion-vs-weakening boundary and the tag rule (prose, one owner, linked not restated)
- `docs/workflow/GATE_INVENTORY.md`, the AGENTS.md owner tables, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `.changeset/`

## Non-goals

- No deletion of tests without obligation-level evidence (inherited from #364's non-goal, now with its literature-backed definition).
- No exhaustive mutation sweep.
- No decision-model dependency anywhere — deterministic scripts and prose only; the decision-substrate (#444, soft Related) upgrades candidate proposal later without touching this unit's evidence producers.
- No weakening, deletion, or skipping of tests to make anything pass — the boundary is written, not implied.
- No test-framework choice; no graph infrastructure beyond the declared tag surface.