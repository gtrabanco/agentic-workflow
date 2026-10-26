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

## Plan — provenance search (2026-10-21)

Receipt for the plan's own claims ("does a validator for this exist?", "did a
prior unit decide this?"):

- `grep -n "BOXES\|box8UnitDoc" scripts/phase-lint.mjs` → eight boxes run over
  unit-doc bullets; box 8 alone owns the `(validator: …)` span, so an `S#`
  link in task text has no box that rejects it (confirmed live: the P1–P6
  bullets of this unit lint PASS, verdict PASS, P1–P7 `PASS (6/6)`).
- `sed -n 514,560p scripts/unit-route.mjs` → done-phase derivation reads only
  `## Progress log` (`sectionBody(doc, "Progress log")`), so a shape without it
  must supply an equivalent Log-line derivation.
- `sed -n 1,66p scripts/unit-doc-contract.test.mjs` → the four surfaces pinned
  to the section list (schema constant, `edit/schema.mjs`, `UnitDoc.mjs`,
  router copy) — the same-PR set for Q1=A.
- `grep -rn "authority-kind" --include=*.md .` → the planning-evidence row
  shape survives in `docs/features/37-*/planning-evidence.md:12` and
  `docs/features/59-*/planning-evidence.md:12`; `skills/evidence-grounding/`
  (the old row-shape owner) was absorbed by feature 61, so `LEDGERS.md` +
  `PLAN.md` + those live rows are the current source.
- `grep -n "version-parity\|trigger set" scripts/version-parity-gate.mjs` →
  trigger set = root `skills/` + `packages/pi-agentic-workflow/**`.
- `grep -n "same PR, always" AGENTS.md:258` → a schema change mirrors types +
  JSON schema + version bump in the same PR; `AGENTS.md` §Packages → version
  bump + CHANGELOG companion row in the same PR.
- `sed -n 113,120p scripts/promise-coherence.mjs` → reader allowlist
  (`grep rg wc ls cat head tail test`); anything else is skipped, so obligation
  validators use `node --test …` (run for real at execution, never re-derived
  by prose).
- `git status --short` + `git log --oneline -1` → clean tree at `39e2aa3a`,
  base `01151e6b` (= `main`).

| id | claim | source | certainty |
|---|---|---|---|
| CLAIM-001 | An `S#` link inside a `P<n>` task bullet is not rejected by any phase-lint box: box 8 reads only the `(validator: …)` span, boxes 1–7 are unit-doc n/a or title-free | `scripts/phase-lint.mjs:640,731-748`; `skills/phase-contract/SKILL.md:83-104`; live `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` → PASS | confirmed |
| CLAIM-002 | A shape with no `## Progress log` needs a replacement derivation for "phases done" in `unit-route`, because that logic reads only that section | `scripts/unit-route.mjs:514-560` | confirmed |
| CLAIM-003 | Q1=A is a four-surface change (schema constant + selector, SDK `edit/schema.mjs`, producer `UnitDoc.mjs`, router copy) pinned by one suite | `scripts/unit-doc-contract.test.mjs:3-13,70-139`; owner answer `D1` | confirmed |
| CLAIM-004 | The planning-evidence row shape and vocabularies are read from `LEDGERS.md` §1 + `PLAN.md` + the live M/L ledgers (the old `ROWS.md` owner was absorbed by feature 61) | `skills/pre-execution-review/references/LEDGERS.md:18-39`; `skills/unit-lane/references/PLAN.md:140-160`; `docs/features/37-phase-lint-script/planning-evidence.md:12` | confirmed |
| CLAIM-005 | A schema-package change ships with a version bump + mirrored types/schema + CHANGELOG row in the same PR | `AGENTS.md:258` and §Packages; `scripts/version-parity-gate.mjs:10` | confirmed |
| CLAIM-006 | Any change under root `skills/**` requires a `packages/pi-agentic-workflow` version bump + CHANGELOG companion row in the same PR | `scripts/version-parity-gate.mjs:10,36`; `AGENTS.md` §Packages | confirmed |
| CLAIM-007 | Red-first is the repo rule: tests before implementation with the expected behaviour | `AGENTS.md` (project instructions) | confirmed |
| CLAIM-008 | `## Findings` as an extra heading is tolerated by the Product selector (only the required names are checked for presence/duplicate/order) | `packages/agentic-workflow-schema/src/pre-execution.ts:529-556`; owner answer `D3` | confirmed |
| CLAIM-009 | The reader allowlist decides which declared outcomes the coherence guard executes, so obligation validators are `node --test` commands with `exits 0` | `scripts/promise-coherence.mjs:113-114,204,260` | confirmed |
| CLAIM-010 | Prior-decisions sweep candidates: no NRS artifact is installed and no `## Design status` marker exists in this unit; the two live candidates are `AGENTS.md` and prior `decisions.md` | `find docs -iname "*normalized*"` (feature-18 folder only); `grep -c "Design status" docs/features/79-spec-by-reference/SPEC.md` → 0; `docs/features/77-promise-coherence-guard/decisions.md` D-77-1 | confirmed |
| CLAIM-011 | The standing "never `S1`/`S2`" guide rule governs *phase labels*; #308's `S#` are requirement ids — the letter of `AGENTS.md`/`PLAN.md` needs the P6 wording amendment so a weak model cannot read the two as one vocabulary | `AGENTS.md` "Phases are P1, P2, …"; `skills/unit-lane/references/PLAN.md` checklist; `#308` §Summary; assumption `A4` | confirmed |
| CLAIM-012 | Sequence: the converted fixtures must exist and be owner-reviewed (AC7) before this repo's own workflow docs move, so the owner review gates the start of P3 | `#308` §Validation without dogfooding + §Scope 4; owner answer `D1`/`D2` | confirmed |
