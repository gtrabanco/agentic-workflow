---
type: feature
scope: large
---

# 78 — spec-by-reference

> One-line: the unit document re-cut to spec-by-reference — requirements as
> numbered `S#` quoting the owner's exact words verbatim, tasks linked to their
> `S#`, and one append-only `## Log` inside the doc that carries the original
> request, the corrections, the evidence runs and the gate runs — with the
> per-unit findings ledger collapsed into it.

## Issue

`#308` — tracked issue. The PR closes it via `Closes #308`. Direction and
credit: [#307](https://github.com/gtrabanco/agentic-workflow/issues/307)
(Gentleman-Programming's ODD canon).

## Objective

Re-cut the unit document to **spec-by-reference** (issue #308): requirements as
numbered `S#` that quote the owner's exact strings verbatim — never
summarized, no unrequested requirements — tasks linked to their `S#`, and an
append-only `## Log` inside the doc where `L1` is the original request
verbatim, corrections are verbatim, and evidence and gate runs are log lines.
The governing clause, quoted as contract from the ODD canon: *"A diferencia de
SDD, un cambio no re hace todo, solo re hace esa spec y la tarea asociada"* —
a change appends a Log entry, rewrites **only** the affected `S#`, and reopens
**only** its task.

## Why

Unit `fix-258-harden-needs-input-contracts` demonstrated the failure mode this
eliminates: 23 wholesale SPEC rewrites, every review cycle re-running *every*
declared validator across the whole unit, and owner decisions paraphrased into
prose that then drifted (the "3–5 line pointer" was a paraphrase, not the
owner's words). Spec-by-reference makes drift diffable and makes review slices
meaningful. The machine side is half the unit: today
`node scripts/unit-route.mjs --triage <unit>` fails closed when the doc misses
any of the 14 required sections (`scripts/unit-route.mjs:649`), so a re-cut
template cannot pass any gate until the linter, the router and the drift gate
read the new grammar alongside the current one.

## User outcome

An owner who changes their mind writes one correction line: the lane appends a
`## Log` entry, rewrites only the `S#` their words changed, and reopens only
that task — nothing else in the document moves, so `git diff` shows exactly
what the change touched. A reviewer reads the `## Log` for the request, the
corrections, the gate runs and the folded findings instead of re-running the
whole declared validator set, and an open finding lives in one short table in
the unit doc instead of a second ledger file beside it.

## Acceptance criteria

Induced from issue #308 §Scope (each AC cites the scope item it came from;
validators are re-confirmed at the plan step).

1. **Templates re-cut** (#308 §Scope 1) — both `docs/features/_TEMPLATE/SPEC.md`
   and `docs/fix/_TEMPLATE/SPEC.md` carry the spec-by-reference structure:
   `## Specs` with numbered `S#` quoting owner strings verbatim, `## Tasks`
   linking each task to its `S#`, an append-only `## Log` whose `L1` is the
   original request verbatim, `## Impact` kept, and the Evidence table folded
   into `## Log` as one line per observed run (command, exit, output ≤2 lines).
   Validator: `node --test scripts/unit-doc-contract.test.mjs
   scripts/pre-execution-quality.test.mjs` exits 0.
2. **Machine support — dual grammar** (#308 §Scope 2) — `scripts/phase-lint.mjs`
   accepts the new grammar alongside the current one during migration, and
   `scripts/unit-route.mjs` reads both (triage section check, `S#`-linked task
   bullets, phase/done derivation), so a migrated unit doc routes and lints
   green while an unmigrated one is unchanged. Validator: `node --test
   scripts/phase-lint.test.mjs scripts/unit-route.test.mjs` exits 0 with both
   shapes in the fixtures.
3. **Drift gate follows the grammar** (#308 §Scope 2) — every new normative
   grammar block the re-cut introduces is declared in `normative-surfaces@1`
   and `node --test scripts/normative-drift.test.mjs` exits 0.
4. **Ledger collapse** (#308 §Scope 3) — `review-findings.md` is no longer the
   carrier for a migrated unit: OPEN findings stay a short table
   (`id`, `S#`/`file:line`, `axis`, `severity`, `class`, `route`), folded
   history becomes `## Log` lines (fold sha + what was verified), and
   `REVIEW-RAN` / `GATE-RAN` / `VF` marks become log lines carrying exit codes.
   No new receipt enters without one retiring. Validator: `node --test
   scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs
   scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs`
   exits 0.
5. **Migration is fixture-validated first** (#308 §Scope 4) — the new grammar
   and lint rules run green against committed fixtures (the golden fixture plus
   a converted copy of `fix-258`'s real documents) *before* this repository's
   own workflow docs move; open units migrate at their next touch, closed units
   are never rewritten. Validator: `node --test scripts/golden-fixture.test.mjs`
   plus the new fixture suite exits 0; no closed unit's doc appears in the
   change (`git diff --name-only main` shows no `docs/features/<done>-*` /
   `docs/fix/<closed>-*` doc outside the fixture copy).
6. **Positive prescription** (#308 §Scope 5, owner directive) — the plan step
   says what to do (cut each `S#` from the request verbatim, link the tasks,
   keep the log), stated as a positive checklist, never as a prohibition list.
   Validator: `node --test scripts/knowledge-honesty-contract.test.mjs` exits 0.
7. **Owner review of the converted fixtures** (#308 §Validation without
   dogfooding) — the implementer never verifies its own format change: the
   converted `fix-258` fixture corpus is presented to the owner for review
   before this repo's own docs are touched. Verified-by: owner acceptance
   recorded as a `decision` row in `decisions.md`.
8. **Nothing weakened** — no existing test is deleted or loosened to pass; the
   root suites and both package suites stay green. Validator: `node --test
   scripts/*.test.mjs`, `bun run test` in `packages/agentic-workflow-schema`
   and `packages/pi-agentic-workflow` all exit 0.

## Impact

What the change touches beyond its own files:

- **Templates (both `docs/features/_TEMPLATE/SPEC.md` and
  `docs/fix/_TEMPLATE/SPEC.md`)** — every future unit starts from the
  re-cut shape; the template is the enforcement surface a lane copy inherits.
- **Machine readers of the unit doc:** `scripts/phase-lint.mjs` +
  `scripts/unit-doc-phases.mjs` (task grammar, `S#` links), `scripts/unit-route.mjs`
  (the 14-section triage check at `:381-385,:649`, phase-done derivation from
  `## Progress log` at `:514-560`, open-row routing from `review-findings.md`
  at `:716`), `scripts/workflow-status.mjs` (`:640-699` ledger reads),
  `scripts/ledger-provenance.mjs`, `scripts/promise-coherence.mjs` (validator
  cells), `scripts/unit-lineage.mjs`.
- **The drift gate:** `normative-surfaces@1` in `AGENTS.md` gains rows for the
  new grammar blocks; `scripts/normative-drift.test.mjs` fails closed until it
  does.
- **Skills narrating the old shape:** `unit-lane` (plan step — positive
  prescription), `execute-phase` (`SKILL.md:83` section readiness),
  `verification-contract` (`## Evidence` as the execution receipt),
  `fold-findings`, `review-change` (`PERSIST_AND_DECIDE.md` ledger carrier),
  `triage-issue`, `audit-pr`, `workflow-status`, plus `LEDGERS.md`'s
  `review-mark@1` / `finding-mark@1` / `gate-ran@1` blocks.
- **The schema package (Q1 = A, `decisions.md` D1 — shipped here):**
  `UNIT_DOC_REQUIRED_SECTIONS`
  (`packages/agentic-workflow-schema/src/pre-execution.ts:225`) is mirrored by
  three surfaces and pinned by `scripts/unit-doc-contract.test.mjs`; a
  required-list or selector change is a mirrored package change in the same PR
  (version bump in P6, both shapes accepted so closed units keep validating).
- **What stops being true when it lands:** `review-findings.md` is the carrier
  for migrated units; Evidence rows are the receipt; `REVIEW-RAN` / `GATE-RAN`
  / `VF` are marks rather than log lines; a unit doc without `## Specs` /
  `## Log` is the current shape (it becomes the legacy shape, still readable).
- **Must be asked before touching:** the schema package's published section
  contract (Q1 in `decisions.md`) and any closed/historical unit doc (never
  migrated — issue #308 Non-goals).

## Non-goals

From issue #308 §Non-goals:

- No change to the review machinery here — `review-on-slices` / `review_due` is
  a follow-up unit once slices exist.
- No migration of closed/historical unit docs.
- No schema-package break: `UNIT_DOC_REQUIRED_SECTIONS` tolerates the new
  sections; the required-list change, if wanted, is a separate mirrored package
  change. *(Resolved by `decisions.md` D1: the non-goal is amended — the
  mirrored package change ships in this unit, both shapes accepted.)*
- Findings discovered during implementation never expand scope.

## Future

- `open`, 2026-10-21 — "No change to the review machinery here
  (review-on-slices / review_due is a follow-up unit once slices exist)."
  (#308 §Non-goals)
- `discarded 2026-10-21` — "the required-list change, if wanted, is a separate
  mirrored package change." (#308 §Non-goals; absorbed into this unit by the
  owner's `decisions.md` D1 — the mirrored change ships with the re-cut)

## Future cost

- Every unit doc reader carries dual-grammar code (old shape + re-cut shape)
  for as long as unmigrated units are routed — binds the maintainers of
  `phase-lint`, `unit-route`, `workflow-status`, `ledger-provenance` until a
  later unit retires the legacy shape.
- `S#` are requirement ids and `P#` are phase labels; any surface that prints
  or parses one must keep the two vocabularies apart — binds everyone writing
  `## Specs`, `## Tasks` and plan prose (`AGENTS.md`, `phase-contract`).
- Migrated units no longer carry `review-findings.md`; tooling that assumes the
  file must probe the unit doc first — binds future script additions.

## Applicable tests

`node --test scripts/phase-lint.test.mjs`, `node --test scripts/unit-route.test.mjs`,
`node --test scripts/normative-drift.test.mjs`, `node --test
scripts/unit-doc-contract.test.mjs`, `node --test
scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs`,
`node --test scripts/review-loop-discipline.test.mjs`, `node --test
scripts/workflow-status-sensor.test.mjs`, `node --test
scripts/golden-fixture.test.mjs`, `node --test
scripts/knowledge-honesty-contract.test.mjs`, plus the root suites
(`node --test scripts/*.test.mjs`).

## Known pre-existing issues

- `unit-route --triage` fails closed on a doc missing any of the 14 required
  sections (`scripts/unit-route.mjs:649`) — **affects** this unit: the re-cut
  template cannot be triaged (or routed) until AC2 lands.
- `scripts/unit-doc-contract.test.mjs` pins four surfaces (schema constant,
  SDK duplicate, producer skeleton, router copy) to the 14-section list —
  **affects** this unit: P2/P3 re-pin them to the agreed shape under Q1; a pin
  is repointed, never weakened.
- `AGENTS.md` ("Phases are `P1, P2, …`, never `S1`/`S2`") and
  `skills/unit-lane/references/PLAN.md` ("Phases labeled P1, P2, … (never S1)")
  forbid `S#` labels in a SPEC/TASKS — **affects** this unit: #308 mandates
  `S#` as *requirement* ids, so the docs step amends both wordings to keep
  `S#` = spec ids and `P#` = phase labels (owner can correct; recorded as
  assumption A4).
- Existing `review-findings.md` files (25+ closed/historical units, incl.
  `fix/258`'s 1,208-line ledger) stay in-tree — **does-not-affect**: closed
  units are never migrated; the readers keep their legacy path for them.
- The root suites resolve the schema package's build output
  (`packages/agentic-workflow-schema/dist`, gitignored) — **affects** this
  environment only: `bun install --frozen-lockfile && bun run build` ran
  2026-10-21 in both packages before any gate below; a fresh clone must run it
  again (`2 failing` suites before it, `775/775` after — same tree).

## Tasks

- P1 — Fixtures and red-first pins first: commit
  `scripts/fixtures/spec-by-reference/` (the golden fixture's spec-by-reference
  copy plus a converted copy of `fix/258`'s documents — the AC5 corpus and the
  AC7 review input) and the new-grammar cases in the linter, router,
  drift-gate and unit-doc-contract suites, red until P2–P5 deliver them; then
  hand the converted corpus to the owner — no repository workflow doc moves
  before AC7's acceptance row exists (O2).
  (validator: `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs scripts/normative-drift.test.mjs` exits 1 at this phase — the new cases fail by design — and exits 0 after P4)
  Relevant files: scripts/fixtures/spec-by-reference, scripts/phase-lint.test.mjs, scripts/unit-route.test.mjs, scripts/normative-drift.test.mjs, scripts/golden-fixture.test.mjs
- P2 — Section contract (both shapes, `D1`): the required-section set learns
  two accepted shapes — the current 14 (closed units, never migrated) and the
  re-cut set (`## Specs` / `## Log` in place of `## Evidence` /
  `## Progress log`) — and the three mirrors
  (`packages/agentic-workflow/src/edit/schema.mjs`,
  `packages/agentic-workflow/src/edit/UnitDoc.mjs`,
  `scripts/unit-route.mjs`) follow with `scripts/unit-doc-contract.test.mjs`
  re-pinned to both. Entry gate: AC7 owner acceptance recorded (O2); the
  package version bump rides P6.
  (validator: `node --test scripts/unit-doc-contract.test.mjs` exits 0 with both-shape cases)
  Relevant files: packages/agentic-workflow-schema/src/pre-execution.ts, packages/agentic-workflow/src/edit/schema.mjs, packages/agentic-workflow/src/edit/UnitDoc.mjs, scripts/unit-route.mjs, scripts/unit-doc-contract.test.mjs
- P3 — Templates re-cut: both `docs/features/_TEMPLATE/SPEC.md` and
  `docs/fix/_TEMPLATE/SPEC.md` gain `## Specs` (numbered `S#` quoting the
  owner's strings verbatim), `## Tasks` (each task linked to its `S#`) and the
  append-only `## Log` (`L1` = original request verbatim, corrections verbatim,
  evidence and gate runs as lines), keep `## Impact` and the planning-ledger
  headers, and fold the Evidence table into Log lines.
  (validator: `node --test scripts/unit-doc-contract.test.mjs scripts/pre-execution-quality.test.mjs scripts/lane-era-lineage.test.mjs` exits 0)
  Relevant files: docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md
- P4 — Machine dual-grammar: `scripts/unit-doc-phases.mjs` +
  `scripts/phase-lint.mjs` accept `S#`-linked task bullets and the new
  sections beside the current grammar; `scripts/unit-route.mjs` reads both
  shapes (triage section check, done-phases derived from `## Log`, `S#` task
  links); `normative-surfaces@1` gains the new grammar rows with their machine
  vocabularies.
  (validator: `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs scripts/normative-drift.test.mjs` exits 0 — P1's red cases go green here)
  Relevant files: scripts/unit-doc-phases.mjs, scripts/phase-lint.mjs, scripts/unit-route.mjs, AGENTS.md
- P5 — Ledger collapse: `## Findings` (`id`, `S#`/`file:line`, `axis`,
  `severity`, `class`, `route`) carries the OPEN rows and `## Log` carries the
  folded history (fold sha + what was verified) plus `REVIEW-RAN` /
  `GATE-RAN` / `VF` lines with exit codes; `review-findings.md` retires for
  migrated units; every reader probes the unit doc first and falls back to the
  legacy file (`unit-route`, `workflow-status`, `ledger-provenance`,
  `LEDGERS.md`, `fold-findings`, `review-change`, `triage-issue`, `audit-pr`).
  (validator: `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs` exits 0)
  Relevant files: skills/pre-execution-review/references/LEDGERS.md, scripts/workflow-status.mjs, scripts/ledger-provenance.mjs, skills/fold-findings/SKILL.md, skills/review-change/references/PERSIST_AND_DECIDE.md
- P6 — Wording, migration rule and bookkeeping: the plan step states the
  positive checklist (cut each `S#` from the request verbatim, link the tasks,
  keep the log) and the migration rule (open units at next touch, closed
  never); `AGENTS.md` / `PLAN.md` keep `S#` (requirement ids) and `P#` (phase
  labels) as two vocabularies (PE-011); `bump-skill` pass + CHANGELOG rows +
  schema/Pi package version bumps with the companion row.
  (validator: `node --test scripts/knowledge-honesty-contract.test.mjs` exits 0; `bun scripts/check-skill-context.mjs` exits 0; `node scripts/version-parity-gate.mjs --content --base main` exits 0)
  Relevant files: skills/unit-lane/references/PLAN.md, skills/unit-lane/SKILL.md, AGENTS.md, CHANGELOG.md
- P7 — Verification: run every AC's command, fill the Evidence rows, run the
  root suites and both package suites, record AC7's owner acceptance, open the
  PR with `Closes #308`.
  (validator: `node --test scripts/*.test.mjs` exits 0; `bun run test` exits 0 in `packages/agentic-workflow-schema` and `packages/pi-agentic-workflow`)
  Relevant files: docs/features/78-spec-by-reference/SPEC.md, .github

### Planning evidence

M/L unit — the ledger is frozen as `planning-evidence.md` in this folder (plan
step, sizing rule `skills/unit-lane/references/PLAN.md:153-160`), which also
holds the prior-decisions contradiction sweep; this section names it and does
not duplicate its rows.

### Obligations

M/L unit — obligations are frozen as `planning-obligations.md` in this folder
(plan step); this section names it and does not duplicate its rows.

## Triaged steps

```text
TRIAGE — 78-spec-by-reference (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

Step notes:
- **research** — provenance receipt in `sources.md` (19 claim rows, every
  greps/read listed); evidence rows R1–R2 below. Domain source for the ODD
  canon: `#308` quoting the Gentleman-Programming ODD text (cited as
  direction in `#307`, URL only, ≤3 sources). Uncertainties: none outside the
  three design questions.
- **design** — ACs induced from `#308` §Scope 1–5 (ask-don't-infer: the issue
  states each scope item); gap interview batched as Q1–Q3 and closed by the
  owner: `D1` full re-cut + mirrored package change (both shapes), `D2` one
  unit at `scope: large`, `D3` open findings in their own `## Findings`
  section — resolutions and the five dated assumptions in `decisions.md`.
- **plan** — Tasks P1–P7 below; planning ledgers cut in the M/L home
  (`planning-evidence.md` with the prior-decisions sweep,
  `planning-obligations.md` O1–O10, one phase each); plan backlog empty
  (`none — no questions: every claim was settled by provenance or research`).
- **implement/tests** — P1 fixtures + red-first pins (owner review gate O2),
  P2 section contract, P3 templates, P4 dual grammar, P5 ledger collapse,
  P6 wording + bookkeeping; one phase per hand-off at the `implement` tier
  (`cheap`), diff guard after each.
- **evidence/review/docs** — Evidence row per AC, owner acceptance of the
  converted fixture corpus (AC7/O2), review verdict, `bump-skill` + CHANGELOG +
  package bumps (P6), PR with `Closes #308` (P7), release step at close-out.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed
output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | research: `grep -rln "review-findings" scripts skills docs template .github packages` + per-file reads | exit 0 | 6 scripts, 8 skills/references, 6 test suites read the ledger | this session, 2026-10-21 |
| R2 | research: `sed -n 649,651p scripts/unit-route.mjs` + `packages/agentic-workflow-schema/src/pre-execution.ts:225-241,529-556` | exit 0 | triage fails closed on a missing section; selector requires all 14 in order | this session, 2026-10-21 |
| — | `bun scripts/unit-route.mjs --triage 78-spec-by-reference` (block pasted verbatim under `## Triaged steps`) | exit 0 | 9 steps, 0 skipped, budget strong | this session, 2026-10-21 |
| — | `bun scripts/phase-lint.mjs docs/features/78-spec-by-reference/SPEC.md` (design-time run, pre-plan re-cut) | exit 0 | P1–P6 `PASS (6/6)` · verdict PASS | this session, 2026-10-21 |
| — | `node scripts/promise-coherence.mjs` (head after the unit doc's Impact paths were made absolute) | exit 0 | `verdict PASS` · claims 35 checked / 77 skipped | #305 guard, this session |
| — | `node scripts/needs-input.mjs docs/features/78-spec-by-reference` | exit 0 | `Open questions: 3` · route `design` · continuation `no-decision-available` | dispatcher, this session |
| — | `node --test scripts/*.test.mjs` (root suites, after the schema build) | exit 0 | tests 775, pass 775, fail 0 | this session, 2026-10-21 |
| — | `node scripts/needs-input.mjs docs/features/78-spec-by-reference` (after `D1`–`D3`) | exit 0 | `Open questions: 0` · `Pending: none` | dispatcher, 2026-10-21 |
| — | `bun scripts/phase-lint.mjs docs/features/78-spec-by-reference/SPEC.md` (P1–P7 cut) | exit 0 | `P1`–`P7` `PASS (6/6)` · verdict PASS | this session, 2026-10-21 |
| AC5 | `node --test scripts/spec-by-reference.test.mjs` — the committed corpus (10 fixture docs under `scripts/fixtures/spec-by-reference/`) read by the new suite | exit 1 | `16 tests · 9 pass · 7 fail` — the 7 are the migrated-grammar/router cases P2/P4 deliver, red by design | this session, 2026-10-21 |
| AC5 | `node --test scripts/*.test.mjs` — P1's red-first pins | exit 1 | `811 tests · 791 pass · 20 fail`, every failure a `#308` case; no pre-existing test broke | this session, 2026-10-21 |
| AC5 | `node --test scripts/golden-fixture.test.mjs` — the converted golden-fixture copy beside the untouched toy tree | exit 0 | `15 tests · 15 pass · 0 fail` (3 new: converted copy lints, conversion invents no requirement, toy tree untouched) | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base 60cd668f --unit 78-spec-by-reference` | exit 0 | `DIFF-GUARD PASS` · Lines 314 (+314/−0) · Files 6 (limit 8) | this session, 2026-10-21 |
| AC7 | owner review of the converted corpus before any workflow doc moved — answer recorded as `D4` in `## Progress log` | accepted | `ask acdfb420-4ddb-4cf7-a165-61cc636266b7`: the corpus is the format; `S#` quotes the owner, `S1a`–`S5a` append corrections, tasks link `S#`, `## Findings` holds OPEN rows, `## Log` is append-only | human-owner, 2026-10-21 |
| — | `node scripts/needs-input.mjs docs/features/78-spec-by-reference` (after `D4`) | exit 0 | `Open questions: 0` · `Pending: none` | dispatcher, 2026-10-21 |
| AC2 | `node --test scripts/unit-doc-contract.test.mjs` — the shape table read by every producer | exit 1 | `11 tests · 10 pass · 1 fail` — the remaining failure is P3's template re-cut, by design | this session, 2026-10-21 |
| AC2 | `bun run build` + `bun run test` in `packages/agentic-workflow-schema` | exit 0 | `tsc` clean · `721 pass · 0 fail` | this session, 2026-10-21 |
| AC8 | `bun run test` in `packages/pi-agentic-workflow` | exit 0 | `432 pass · 0 fail` (after `bun install --frozen-lockfile`) | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base e54a5387 --unit 78-spec-by-reference` | exit 0 | `DIFF-GUARD PASS` · Lines 396 (+361/−35) · Files 6 (limit 8) | this session, 2026-10-21 |

## Progress log

`2026-10-21 22:40 — unit doc created from issue #308 (--from-issue); roadmap row 78 registered; research + design provenance recorded in sources.md (19 claims); three open questions appended to decisions.md; triage block pasted; phase-lint PASS (6/6 ×6), promise-coherence PASS, root suites 775/775 → 15ab46a1 — next: batched gap interview (Q1–Q3), then the plan step`
`2026-10-21 23:25 — owner answered Q1–Q3 (`D1` full re-cut + mirrored package change, `D2` one unit scope large, `D3` `## Findings` section); plan step cut: 12 CLAIM rows in sources.md, planning-evidence.md (PE-001–PE-013 + contradiction sweep), planning-obligations.md (O1–O10), BRIEF.md questions pane; tasks re-cut to P1–P7; roadmap row 78 `defined` → `planned` (own-status gate) → (this commit) — next: /execute-phase 78-spec-by-reference P1 (tier: cheap)`
`2026-10-21 23:58 — P1 — committed the migration corpus (`scripts/fixtures/spec-by-reference/`: the converted fix/258 documents beside their verbatim `REQUEST.md`, the golden-fixture conversion copy, a `UNIT_ROUTE_REPO` tree with legacy + migrated + broken + missing-shared units) and the red-first pins in four suites (`spec-by-reference.test.mjs` new; phase-lint, unit-route, normative-drift, unit-doc-contract, golden-fixture extended): 20 `#308` cases fail by design and no pre-existing test broke (811 tests, 791 pass); path-protection declaration + justification rows recorded in `decisions.md`; diff-guard PASS 314 lines / 6 files → 1ce956b4 — next: owner review of the converted corpus (AC7/O2), then P2 (section contract, both shapes)`
`2026-10-21 — D4 — owner accepted the converted corpus as the spec-by-reference format (AC7/O2 closed); P2's entry gate is met. The acceptance is a `D` line here, not a `decisions.md` `decision` row: that grammar's `question` cell must name a declared `Q#`, and this gate closes none — `node scripts/needs-input.mjs` fails closed on the mismatch → next: P2`
`2026-10-21 — P2 — the section contract learns both shapes (O1, D1): `UNIT_DOC_SPEC_REF_SECTIONS` + `UNIT_DOC_SECTION_SHAPES` + `resolveUnitDocShape`/`unitDocSectionsFor` published by the schema package, mirrored in the SDK's `schema.mjs` (no import — AC21), read by the producer's `validate`/`setSection` (half-migrated docs refused) and by the router's triage section check; the producer gained `createSpecByReference` with its own re-cut skeleton. The two shapes differ in exactly six headings (`Specs` replaces `Objective`/`Why`/`User outcome`/`Acceptance criteria`; `Findings`/`Log` replace `Evidence`/`Progress log`). Schema 721/721 and Pi 432/432 green; diff-guard PASS 396 lines / 6 files → next: P3 (templates re-cut)`

## Next

P1 and P2 are committed: the corpus and its red-first pins, and the section
contract that accepts both shapes. P3 re-cuts the templates.

→ Next: /execute-phase 78-spec-by-reference P3 (tier: cheap) — re-cut both unit-doc templates to the accepted shape
  · whole-unit operator run complete → /review-change (mandatory end review)
  · findings (REVIEW-FAIL) → /fold-findings repairs them; a fresh /review-change follows the fold
  · merge gate after REVIEW-PASS → /audit-pr — the merge gate

## References

- Issue [#308](https://github.com/gtrabanco/agentic-workflow/issues/308) — the
  request (closes via `Closes #308`)
- Issue [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) —
  direction contract (ODD hybrid; credit: Gentleman-Programming's ODD,
  [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai))
- Issues [#303](https://github.com/gtrabanco/agentic-workflow/issues/303)
  (positive prescription, closed) and
  [#305](https://github.com/gtrabanco/agentic-workflow/issues/305)
  (promise-coherence, closed) — the dependencies #308 names
- `docs/fix/258-harden-needs-input-contracts/` — the failure corpus the
  migration fixtures are cut from
- `docs/features/77-promise-coherence-guard/decisions.md` (D-77-1) — the
  machine-equals-product precedent behind Q1
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger blocks the
  collapse retires
