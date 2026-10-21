# Sources — unit 78 (spec-by-reference)

Provenance receipt for the design step: where I looked before I wrote anything
(`## Investigate` receipt), then one row per claim the SPEC makes, each with a
source or an owner answer. A row with no source is a question, never a default.

## Investigate — provenance search (2026-10-21)

Receipt (the greps/reads run, their hits):

- `gh issue view 308 --json body` → the full request (§Summary, §Why, §Scope
  1–5, §Non-goals, §Validation without dogfooding).
- `gh issue view 307 --json body` → the direction contract and its
  Mechanics/Non-goals (ODD hybrid; #303/#305 named as the implementing
  pre-work).
- `gh issue view 303/305 --json state` → both CLOSED; `git log --oneline -3`
  → `01151e6b feat: promise-coherence guard … (#305) (#309)` merged at the
  branch base (`git merge-base HEAD main` = `01151e6b`).
- `sed -n 649,651p scripts/unit-route.mjs` → triage fails closed
  (`missing mandatory sections: …`) when any of `UNIT_DOC_SECTIONS` is absent.
- `sed -n 225,241p packages/agentic-workflow-schema/src/pre-execution.ts` →
  `UNIT_DOC_REQUIRED_SECTIONS` = the 14-section frozen list (owner constant,
  `Impact` since #305).
- `sed -n 529,556p packages/agentic-workflow-schema/src/pre-execution.ts` →
  `selectSpecProduct` requires all 14, exact-heading, in order; extras outside
  the list are tolerated (`Future`, `Issue`, `Branch`, `Regression scope`).
- `sed -n 1,66p scripts/unit-doc-contract.test.mjs` → four surfaces pinned to
  that list (schema constant, SDK `edit/schema.mjs`, producer `UnitDoc.mjs`,
  router copy).
- `sed -n 1,40p scripts/phase-lint.mjs` → the linter already carries **two**
  grammars (plan grammar, unit-doc grammar) behind one verdict contract owned
  by `skills/phase-contract/SKILL.md`.
- `grep -rln "review-findings" scripts skills docs template .github packages` →
  carrier read by 6 scripts, 8 skill references, 6 test suites, 25+ unit
  folders.
- `grep -rn "review-findings" scripts/*.mjs` → `unit-route.mjs:716` (route
  detection), `workflow-status.mjs:640,672,699` (sensor),
  `ledger-provenance.mjs:20,57` (provenance CLI).
- `sed -n 1,40p docs/fix/_TEMPLATE/SPEC.md` → the fix template is the same
  closed 14 sections plus four extras (`Issue`, `Branch`, `Depends on`,
  `Regression scope`).
- `grep -rn "^## Specs\|^## Log\|^## Findings" docs template skills` → no
  `## Specs` collision anywhere; `## Log` exists only in a legacy
  `progress.md`; `## Findings` exists only in `product-audit`.
- `sed -n 153,160p skills/unit-lane/references/PLAN.md` → M/L units freeze
  `planning-evidence.md` / `planning-obligations.md` as separate files.
- `grep -n "Phases are \`P1" AGENTS.md` + `PLAN.md` checklist → the standing
  "never `S1`/`S2`" rule that #308's `S#` ids sit against.
- `docs/features/77-promise-coherence-guard/decisions.md` `## D-77-1` → the
  owner already chose "required since #305" over "tolerated extra" when a
  published surface and the machine disagreed.
- `ls scripts/fixtures/golden-fixture/` → `toy-spec.md`, `toy-plan.md`,
  `expected/`, `RUN_LOG_NOTES.md` — the fixture corpus the migration extends.

| id | claim | source | certainty |
|---|---|---|---|
| INV-001 | The unit document re-cuts to `## Specs` / `## Tasks` / `## Log`, keeps `## Impact`, and folds the Evidence table into `## Log` (one line per observed run: command, exit, output ≤2 lines) | `#308` §Scope 1 | confirmed |
| INV-002 | `phase-lint.mjs` accepts the new grammar alongside the current one during migration, `unit-route.mjs` reads both, and `normative-surfaces@1` is updated for any new grammar block | `#308` §Scope 2 | confirmed |
| INV-003 | `review-findings.md` disappears for migrated units: OPEN findings stay a short table (id, S#/file:line, axis, severity, class, route), folded history becomes `## Log` lines (fold sha + what was verified), REVIEW-RAN/GATE-RAN/VF become log lines with exit codes, no new receipt without retiring one | `#308` §Scope 3 | confirmed |
| INV-004 | Migration is fixture-validated first (golden fixture + a converted copy of fix-258's documents); open units migrate at their next touch; closed units never | `#308` §Scope 4 | confirmed |
| INV-005 | The plan step is prescribed positively (cut `S#` verbatim, link tasks, keep the log), never as a prohibition list | `#308` §Scope 5; `#303` §Summary | confirmed |
| INV-006 | Non-goals: no review-machinery change (review-on-slices / review_due is a follow-up unit), no closed/historical doc migration, no schema-package break | `#308` §Non-goals | confirmed |
| INV-007 | Triage fails closed when the unit doc misses any required section, so the re-cut template cannot route or triage until the machine reads both shapes | `scripts/unit-route.mjs:649-651` | confirmed |
| INV-008 | The section list is one owner constant mirrored by three surfaces and pinned by one contract suite; a list change is a four-surface, same-PR change | `packages/agentic-workflow-schema/src/pre-execution.ts:225`; `scripts/unit-doc-contract.test.mjs:3-13` | confirmed |
| INV-009 | The Product selector requires all 14 headings, exact-match and in order; headings outside the list are already tolerated | `packages/agentic-workflow-schema/src/pre-execution.ts:529-556` | confirmed |
| INV-010 | The linter already runs two grammars behind one verdict contract, so "new grammar alongside the current one" has an in-repo precedent to follow | `scripts/phase-lint.mjs:1-40` | confirmed |
| INV-011 | The findings ledger is read by `unit-route` (routing), `workflow-status` (sensor), `ledger-provenance` (CLI) and written by `review-change`/`fold-findings`; 6 test suites pin its shape | grep receipt above; `scripts/ledger-ownership.test.mjs`, `scripts/review-loop-discipline.test.mjs`, `scripts/workflow-status-sensor.test.mjs` | confirmed |
| INV-012 | The ledger's mark grammars (`ledger-ownership@1`, `review-mark@1`, `finding-mark@1`, `gate-ran@1`) are published by `LEDGERS.md`, which the collapse must retire or re-shape one for one | `skills/pre-execution-review/references/LEDGERS.md` | confirmed |
| INV-013 | A standing rule forbids `S1`/`S2` labels in SPEC/PLAN/TASKS while #308 mandates `S#` as requirement ids — the two need an explicit vocabulary split, not a silent overlap | `AGENTS.md` ("Phases are P1, P2, …"), `skills/unit-lane/references/PLAN.md` checklist; `#308` §Summary | confirmed |
| INV-014 | The owner already ruled once that a published surface and the machine must not diverge in the permissive direction ("required since #305", not "tolerated extra") — the precedent behind Q1 | `docs/features/77-promise-coherence-guard/decisions.md` D-77-1 | confirmed |
| INV-015 | Closed units are never migrated, so whatever ships must keep old-shape docs readable by the machine indefinitely | `#308` §Non-goals + §Scope 4 (consequence: dual-shape reading) | inferred |
| INV-016 | Both named dependencies are closed and merged at this branch's base (#303's four-stage references, #305's promise-coherence guard) | `gh issue view 303/305` → CLOSED; `git log --oneline -1` = `01151e6b` | confirmed |
| INV-017 | The golden fixture is a committed read-only corpus (`toy-spec.md`, `toy-plan.md`, `expected/`) with an executable suite, so the migration corpus has a home beside it | `ls scripts/fixtures/golden-fixture/`; `scripts/golden-fixture.test.mjs` | confirmed |
| INV-018 | An M/L unit freezes its planning ledgers as `planning-evidence.md` / `planning-obligations.md` in the unit folder, never both homes | `skills/unit-lane/references/PLAN.md:153-160` | confirmed |
| INV-019 | `--from-issue <n>` on a tracked issue with no folder is the router's own printed form, and the folder carries the issue number | `scripts/unit-route.mjs:33` (`plan-from-issue`); `#308` has no folder yet | confirmed |
