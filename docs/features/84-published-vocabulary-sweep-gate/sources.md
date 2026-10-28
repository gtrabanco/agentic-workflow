# Sources — unit 84 (published-vocabulary-sweep-gate)

Provenance receipt for the design step: where I looked before I wrote anything
(`## Investigate` receipt), then one row per claim the SPEC makes, each with a
source or an owner answer. A row with no source is a question, never a default.

## Investigate — provenance search (2026-10-27)

Receipt (the greps/reads run, their hits):

- `gh api repos/gtrabanco/agentic-workflow/issues/315` → the full request (§Goal,
  §In scope 1–4, §Out of scope, §Acceptance criteria 1–6, §Dependencies,
  §Open questions). Labels: `promoted`. Roadmap row 84 registers it.
- `sed -n '86,110p' scripts/promise-coherence.mjs` → `CLAIM_KINDS` has exactly
  8 members (validator, formula, measure, surface, removed-phrase,
  section-length, prerequisite, contradiction); `REASON_CODES` is the closed
  fail-closed vocabulary beside it.
- `sed -n '780,840p' scripts/workflow-status.mjs` → the F37/F38/F39 instances
  are already repaired on `main`: `readLogMarks` reads through the shared
  `parseLog` (fence-aware), and `bounded()` routes through the router's one
  `flattenCell` class before the 120-char cap — so S3's pins pin the *pattern*,
  they do not repair live instances.
- `sed -n '44,52p' docs/features/_TEMPLATE/SPEC.md`, `sed -n '56,64p'
  docs/fix/_TEMPLATE/SPEC.md`, `sed -n '66,74p;146,154p'
  packages/agentic-workflow/src/edit/UnitDoc.mjs` → the Future-status vocabulary
  (`open | planned | discarded <YYYY-MM-DD>`) is published in prose at all the
  surfaces the issue names; no parser reads it (`grep -rn "kept deferred"
  scripts/ packages/` → 0 hits, per unit 79's VF-40 recheck).
- `grep -rn "LOG_KINDS" scripts/ skills/ packages/` → the F22 precedent:
  `scripts/unit-doc-phases.mjs:209` owns the closed set,
  `scripts/spec-by-reference.test.mjs:265-285` pins the templates' prose copies
  against it, `scripts/phase-lint.mjs:65,835` reads it as the machine.
- `grep -n "normative-surfaces" AGENTS.md` → the inventory block at
  `AGENTS.md:321`; `scripts/normative-drift.test.mjs` parses it and fails
  closed; `scripts/normative-drift.test.mjs:1336` already asserts grammar
  owners are "read from one owner, named in code".
- `grep -rn "kept deferred" docs/` → the live F40 token survives at
  `docs/features/79-spec-by-reference/SPEC.md:161,168` (closed unit; recorded
  debt with re-trigger condition at `review-findings.md:447`).
- `sed -n '490,680p' scripts/unit-route.mjs` → triage reads `type`/`scope`
  frontmatter, requires one of the two published section shapes, and derives
  steps from `scripts/catalog.json`'s `budget_tier`s.
- Memory recall (`mem_context`, project `agentic-workflow`): unit 79 closed
  (PR #311 merged, roadmap row `done`); owner's parallel-work decision on
  #315/#318 recorded in session memory; notation pinned (#N = forge, feature NN
  without hash). Probe verdict: `degraded` (session-ambiguity check) — recorded
  in the Log, non-blocking per the memory protocol §1.

| id | claim | source | certainty |
|---|---|---|---|
| INV-001 | `promise-coherence.mjs` is the sweep gate's carrier: 8 closed claim kinds, extensible only as a SPEC change in the owning reference | `scripts/promise-coherence.mjs:86-96`; `docs/features/77-promise-coherence-guard/SPEC.md` §Future cost | confirmed |
| INV-002 | The Future-status vocabulary is published in prose in ≥3 surfaces and no parser reads it (the F40 class is unpinned today) | `docs/features/_TEMPLATE/SPEC.md:46-52`; `docs/fix/_TEMPLATE/SPEC.md:58-64`; `packages/agentic-workflow/src/edit/UnitDoc.mjs:70,150`; unit 79 VF-40 | confirmed |
| INV-003 | The F22/`LOG_KINDS` pattern (one owner const + parity tests pinning every second copy) is the repo's established way to machine-pin a closed vocabulary | `scripts/unit-doc-phases.mjs:209`; `scripts/spec-by-reference.test.mjs:265-285`; `scripts/phase-lint.mjs:65,835` | confirmed |
| INV-004 | The `normative-surfaces@1` inventory in `AGENTS.md` is the declared home for "what orders what", parsed and enforced fail-closed by `normative-drift.test.mjs` | `AGENTS.md:321`; `scripts/normative-drift.test.mjs` | confirmed |
| INV-005 | The F37/F38/F39 instances are repaired on `main`; scope item 3 is pins on the pattern, not instance repairs | `scripts/workflow-status.mjs:788-840` | confirmed |
| INV-006 | The six acceptance criteria are the owner's own words and are adopted verbatim | issue #315 §Acceptance criteria | confirmed |
| INV-007 | Sweep declarations stay bounded to the cited surface plus inventory-declared siblings — never repo-wide sweeps | issue #315 §Open questions ("keep the declared set bounded") | confirmed |
| INV-008 | `#305` is merged (PR #309), `#308` merged via PR #311 (roadmap row 79 `done`), `#303` merged (PR #310) — the dependency set of this unit is all landed | `gh api …/issues/305,308,303 --jq .state`; roadmap rows 77/79 | confirmed |
| INV-009 | A fold's log entry is where a sweep declaration belongs (the fold already appends `F` lines naming the fold commit and what was verified) | `skills/unit-lane/references/` log grammar (`log-kind@1`, `F` token); `docs/features/79-spec-by-reference/SPEC.md` `## Log` F-line shape | confirmed |
| INV-010 | Unit 79's live `kept deferred` tokens are recorded debt, not an open defect this unit repairs (closed units stay closed) | `docs/features/79-spec-by-reference/review-findings.md:447`; issue #315 §Out of scope | confirmed |
| INV-011 | The `skills` CLI + bump-skill rule: any `skills/**` change bumps the pi package version + CHANGELOG row in the same PR | `AGENTS.md` §Packages; `scripts/version-parity-gate.mjs` | confirmed |
| INV-012 | The schema-mirror rule applies to any new published vocabulary (types + `envelope.schema.json` + version bump, same PR) | `AGENTS.md` §Verification (schema bullet); issue #315 AC5 | confirmed |
