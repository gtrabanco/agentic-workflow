---
type: feature
scope: large
---

# 79 — spec-by-reference

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

- `open` — kept deferred 2026-10-26 — "No change to the review machinery here
  (review-on-slices / review_due is a follow-up unit once slices exist)."
  (#308 §Non-goals — the owner's own words fix the condition; resolved without
  re-asking: the deferral is the issue's recorded answer)
- `discarded 2026-10-21` — "the required-list change, if wanted, is a separate
  mirrored package change." (#308 §Non-goals; absorbed into this unit by the
  owner's `decisions.md` D1 — the mirrored change ships with the re-cut)
- `open` — kept deferred 2026-10-23 — "`ledger-ownership@1` gains a section-level carrier form, so a migrated unit's `## Findings` and `## Log` have a machine row of their own (the map keys one row per file pattern today, and AC16 freezes seven truth classes)." (#308 review F24; owner decision `decisions.md` D5)

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
scripts/spec-by-reference.test.mjs` (the migration corpus itself — AC5's declared gate, listed so a later
delete of the migration gate is caught by what cites it), `node --test
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
  Relevant files: docs/features/79-spec-by-reference/SPEC.md, .github

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
TRIAGE — 79-spec-by-reference (feature)
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
| — | `bun scripts/unit-route.mjs --triage 79-spec-by-reference` (block pasted verbatim under `## Triaged steps`) | exit 0 | 9 steps, 0 skipped, budget strong | this session, 2026-10-21 |
| — | `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` (design-time run, pre-plan re-cut) | exit 0 | P1–P6 `PASS (6/6)` · verdict PASS | this session, 2026-10-21 |
| — | `node scripts/promise-coherence.mjs` (head after the unit doc's Impact paths were made absolute) | exit 0 | `verdict PASS` · claims 35 checked / 77 skipped | #305 guard, this session |
| — | `node scripts/needs-input.mjs docs/features/79-spec-by-reference` | exit 0 | `Open questions: 3` · route `design` · continuation `no-decision-available` | dispatcher, this session |
| — | `node --test scripts/*.test.mjs` (root suites, after the schema build) | exit 0 | tests 775, pass 775, fail 0 | this session, 2026-10-21 |
| — | `node scripts/needs-input.mjs docs/features/79-spec-by-reference` (after `D1`–`D3`) | exit 0 | `Open questions: 0` · `Pending: none` | dispatcher, 2026-10-21 |
| — | `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` (P1–P7 cut) | exit 0 | `P1`–`P7` `PASS (6/6)` · verdict PASS | this session, 2026-10-21 |
| AC5 | `node --test scripts/spec-by-reference.test.mjs` — the committed corpus (10 fixture docs under `scripts/fixtures/spec-by-reference/`) read by the new suite | exit 1 | `16 tests · 9 pass · 7 fail` — the 7 are the migrated-grammar/router cases P2/P4 deliver, red by design | this session, 2026-10-21 |
| AC5 | `node --test scripts/*.test.mjs` — P1's red-first pins | exit 1 | `811 tests · 791 pass · 20 fail`, every failure a `#308` case; no pre-existing test broke | this session, 2026-10-21 |
| AC5 | `node --test scripts/golden-fixture.test.mjs` — the converted golden-fixture copy beside the untouched toy tree | exit 0 | `15 tests · 15 pass · 0 fail` (3 new: converted copy lints, conversion invents no requirement, toy tree untouched) | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base 60cd668f --unit 79-spec-by-reference` | exit 0 | `DIFF-GUARD PASS` · Lines 314 (+314/−0) · Files 6 (limit 8) | this session, 2026-10-21 |
| AC7 | owner review of the converted corpus before any workflow doc moved — answer recorded as `D4` in `## Progress log` | accepted | `ask acdfb420-4ddb-4cf7-a165-61cc636266b7`: the corpus is the format; `S#` quotes the owner, `S1a`–`S5a` append corrections, tasks link `S#`, `## Findings` holds OPEN rows, `## Log` is append-only | human-owner, 2026-10-21 |
| — | `node scripts/needs-input.mjs docs/features/79-spec-by-reference` (after `D4`) | exit 0 | `Open questions: 0` · `Pending: none` | dispatcher, 2026-10-21 |
| AC2 | `node --test scripts/unit-doc-contract.test.mjs` — the shape table read by every producer | exit 1 | `11 tests · 10 pass · 1 fail` — the remaining failure is P3's template re-cut, by design | this session, 2026-10-21 |
| AC2 | `bun run build` + `bun run test` in `packages/agentic-workflow-schema` | exit 0 | `tsc` clean · `721 pass · 0 fail` | this session, 2026-10-21 |
| AC8 | `bun run test` in `packages/pi-agentic-workflow` | exit 0 | `432 pass · 0 fail` (after `bun install --frozen-lockfile`) | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base e54a5387 --unit 79-spec-by-reference` | exit 0 | `DIFF-GUARD PASS` · Lines 396 (+361/−35) · Files 6 (limit 8) | this session, 2026-10-21 |
| AC1 | `node --test scripts/unit-doc-contract.test.mjs scripts/pre-execution-quality.test.mjs scripts/lane-era-lineage.test.mjs` — both templates re-cut | exit 0 | `31 tests · 31 pass · 0 fail` | this session, 2026-10-21 |
| AC1 | producer `validate()` on both re-cut templates | exit 0 | `{"ok":true,"violations":[]}` for `docs/features/_TEMPLATE/SPEC.md` and `docs/fix/_TEMPLATE/SPEC.md` | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base 3226d239 --unit 79-spec-by-reference` | exit 0 | `DIFF-GUARD PASS` · Lines 199 (+130/−69) · Files 3 (limit 8) | this session, 2026-10-21 |
| AC2 | `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs` — the re-cut grammar read by both | exit 0 | `phase-lint 158/158` · `unit-route 50/50` | this session, 2026-10-21 |
| AC3 | `node --test scripts/normative-drift.test.mjs` — the four new grammar blocks declared | exit 0 | `20 tests · 20 pass · 0 fail` | this session, 2026-10-21 |
| AC2 | `bun scripts/check-skill-context.mjs` at the P4 head | exit 0 | `PASS context budgets: 28 skills` · `PASS route budgets: 14 routes` | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base 28215d3c --unit 79-spec-by-reference` — one honest split (grammar / declaration) | exit 0 | grammar half 296 lines / 6 files · declaration half 82 lines / 3 files | this session, 2026-10-21 |
| AC4 | `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs` | exit 0 | `101 tests · 101 pass · 0 fail` (3 new sensor cases read `## Findings` + `## Log`) | this session, 2026-10-21 |
| AC8 | `node --test scripts/*.test.mjs` at the P5 head | exit 0 | `814 tests · 814 pass · 0 fail` | this session, 2026-10-21 |
| — | `bun scripts/diff-guard.mjs --base 67d4e5bc --unit 79-spec-by-reference` — one honest split (carrier / prose) | exit 0 | carrier half 181 lines / 2 files · prose half 90 lines / 7 files | this session, 2026-10-21 |
| AC1 | `node --test scripts/unit-doc-contract.test.mjs scripts/pre-execution-quality.test.mjs` | exit 0 | `12 tests · 12 pass · 0 fail` | this session, 2026-10-21 |
| AC2 | `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs` | exit 0 | `208 tests · 208 pass · 0 fail` — both shapes in the fixtures | this session, 2026-10-21 |
| AC3 | `node --test scripts/normative-drift.test.mjs` | exit 0 | `20 tests · 20 pass · 0 fail` — four new surfaces declared | this session, 2026-10-21 |
| AC4 | `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs` | exit 0 | `101 tests · 101 pass · 0 fail` | this session, 2026-10-21 |
| AC5 | `node --test scripts/golden-fixture.test.mjs scripts/spec-by-reference.test.mjs` · `git diff --name-only main -- docs/` | exit 0 | `31 tests · 31 pass · 0 fail` · no `docs/features/<done>-*` or `docs/fix/<closed>-*` in the change | this session, 2026-10-21 |
| AC6 | `node --test scripts/knowledge-honesty-contract.test.mjs` | exit 0 | `9 tests · 9 pass · 0 fail` | this session, 2026-10-21 |
| AC8 | `node --test scripts/*.test.mjs` | exit 0 | `814 tests · 814 pass · 0 fail` | this session, 2026-10-21 |
| AC8 | `bun run test` in `packages/agentic-workflow-schema` (after `bun run build`) | exit 0 | `721 tests · 721 pass · 0 fail` | this session, 2026-10-21 |
| AC8 | `bun run test` in `packages/pi-agentic-workflow` | exit 0 | `432 tests · 432 pass · 0 fail` | this session, 2026-10-21 |
| — | `bun scripts/check-skill-context.mjs` and `--routes` | exit 0 | `PASS context budgets: 28 skills` · `PASS route budgets: 14 routes` | this session, 2026-10-21 |
| — | `node scripts/version-parity-gate.mjs --content --base main` | exit 0 | `content parity holds: version 0.26.0 → 0.27.0, companion row present` · `VERDICT: PASS` | this session, 2026-10-21 |
| — | `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` | exit 0 | `verdict PASS` · P1–P7 `PASS (6/6)` | this session, 2026-10-21 |
| — | `node scripts/promise-coherence.mjs` | exit 0 | `verdict PASS` · `claims: 35 checked` | this session, 2026-10-21 |
| — | `node scripts/needs-input.mjs docs/features/79-spec-by-reference` | exit 0 | `Open questions: 0` · `Pending: none` | this session, 2026-10-21 |
| — | PR opened with `Closes #308` | exit 0 | https://github.com/gtrabanco/agentic-workflow/pull/311 | this session, 2026-10-21 |
| — | review step: every gate re-run at the review head — `node --test scripts/*.test.mjs` | exit 0 | `814 tests · 814 pass · 0 fail` | this session, 2026-10-23 |
| — | review step: `bun run build` + `bun run test` in `packages/agentic-workflow-schema`; `bun run test` in `packages/pi-agentic-workflow` | exit 0 | `721 pass · 0 fail` · `432 pass · 0 fail` | this session, 2026-10-23 |
| — | review step: `bun scripts/check-skill-context.mjs` (+ `--routes`) · `node scripts/version-parity-gate.mjs --content --base main` · `bun scripts/phase-lint.mjs docs/features/79-spec-by-reference/SPEC.md` · `node scripts/promise-coherence.mjs` · `node scripts/needs-input.mjs docs/features/79-spec-by-reference` | exit 0 (each) | budgets PASS 28/14 · parity PASS · phase-lint PASS (7/7) · promise PASS 35 checked · open questions 0 | this session, 2026-10-23 |
| — | review step: AC integrity — `## Acceptance criteria` sha256 at `15ab46a1` (triage-time commit) vs this head | unchanged | `d8ea4523b3e6873e` · 53 lines, byte-identical | this session, 2026-10-23 |
| — | review step: three independent axis reviewers over `git diff main...HEAD` (code correctness · scope & acceptance · contract & consistency); every row re-verified against source before recording | 3 × FAIL | 7 material · 15 report-notes · block in `## Review verdict` | this session, 2026-10-23 |
| — | `bun scripts/diff-guard.mjs --base main --unit 78` (whole-unit measurement; no implement step this turn) | exit 1 | `BREACH · Lines: 3528 > 400 · Files: 52 > 8` — **exception recorded** (D2: one `scope: large` unit; every implement phase guarded at its own base) | this session, 2026-10-23 |

| — | review fold (cycle 1): `node --test scripts/*.test.mjs` at the fold head | exit 0 | `824 tests · 824 pass · 0 fail` — the 10 cases this fold added; none deleted or loosened | this session, 2026-10-23 |
| AC1 | `node --test scripts/unit-doc-contract.test.mjs scripts/pre-execution-quality.test.mjs` + `bun scripts/phase-lint.mjs` on both templates | exit 0 | `13 tests · 13 pass` · both templates `verdict PASS` (F21: the shipped examples broke their own `(Implements: …)` rule) | this session, 2026-10-23 |
| AC2 | `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs` | exit 0 | `160/160` · `51/51` — symmetric half-shape refusal (F1), sanitized echo (F14), owner-vocabulary routing (F6) | this session, 2026-10-23 |
| AC4 | `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs scripts/workflow-status-compact.test.mjs` | exit 0 | `114 tests · 114 pass` — the mark gate asserted both ways; the doc-carrier recount and both memo carriers pinned | this session, 2026-10-23 |
| AC8 | `node --test scripts/*.test.mjs` · `bun run build` + `bun run test` (schema 4.8.0) · `bun run test` (pi package) | exit 0 | `824/824` · `721/721` · `432/432` | this session, 2026-10-23 |
| — | `bun scripts/check-skill-context.mjs` (+ `--routes`) · `node scripts/version-parity-gate.mjs --content --base main` · `node scripts/unit-lineage.mjs --unit 79-spec-by-reference` · `node scripts/needs-input.mjs docs/features/79-spec-by-reference` · `node scripts/promise-coherence.mjs` | exit 0 (each) | budgets PASS 28/14 · parity PASS · `LINEAGE OK — obligations closed (10)` · open questions 0 · promise PASS | this session, 2026-10-23 |
| — | memory probe: `agentic-workflow memory probe` (the feature-66 CLI) | refused | `EDIT REFUSAL — Unknown service: memory` — CLI unavailable in this environment; **degraded recorded once**; the Engram MCP tools carry the unit's memory writes instead | this session, 2026-10-26 |
| — | ledger closure: owner dispute resolutions persisted — F17/F20/F24 folded cell → `ignore · owner decision 2026-10-23` with RESOLVED provenance lines | exit 0 | `bun scripts/unit-route.mjs 79-spec-by-reference` → `open-rows: 0` (fold queue empty); `ledger-provenance --check` → `CHECK PASS` | this session, 2026-10-26 |
| — | review cycle 4: delta scope `66837370..56f8ea25` measured `git diff --stat` | escalated | 314 added+deleted > 200 — **size trigger fired** → full pass over `git diff main...HEAD` at frozen head `56f8ea25` | this session, 2026-10-26 |
| — | review cycle 4: four isolated axis passes (code · security · verify · perf) + two folded-row re-verification passes (F1–F26, F27–F39), 6 context-clean subagents | 4 × PASS · 36/36 fixed | 0 material · 2 low report-notes · 2 low proposals; every folded row re-verified fixed at its cited surface | isolated subagents, 2026-10-26 |
| — | review cycle 4 gates (verify axis, isolated): root `node --test scripts/*.test.mjs` · schema `bun run test` · pi `bun run test` | exit 0 (each) | `828 tests · 828 pass · 0 fail` · `721 pass · 0 fail` · `432 pass · 0 fail` | review-verify subagent, 2026-10-26 |
| — | review cycle 4: AC integrity — `## Acceptance criteria` sha256 at `15ab46a1` vs `56f8ea25` (extractor-normalized) | unchanged | `de9aea6898468b0d` · 52 lines, byte-identical (the earlier `d8ea4523b3e6873e · 53 lines` was a different extraction variant of the same unchanged section) | this session, 2026-10-26 |
| — | review cycle 4: merge-drift check — `git merge-tree <merge-base> main HEAD` · `git show main:packages/pi-agentic-workflow/package.json` | 0 conflicts | main advanced (feature 66 merged, pi 0.31.0); no conflict markers; parity re-checked green 0.31.0→0.33.0 | this session, 2026-10-26 |
## Progress log

`2026-10-21 22:40 — unit doc created from issue #308 (--from-issue); roadmap row 78 registered; research + design provenance recorded in sources.md (19 claims); three open questions appended to decisions.md; triage block pasted; phase-lint PASS (6/6 ×6), promise-coherence PASS, root suites 775/775 → 15ab46a1 — next: batched gap interview (Q1–Q3), then the plan step`
`2026-10-21 23:25 — owner answered Q1–Q3 (`D1` full re-cut + mirrored package change, `D2` one unit scope large, `D3` `## Findings` section); plan step cut: 12 CLAIM rows in sources.md, planning-evidence.md (PE-001–PE-013 + contradiction sweep), planning-obligations.md (O1–O10), BRIEF.md questions pane; tasks re-cut to P1–P7; roadmap row 78 `defined` → `planned` (own-status gate) → (this commit) — next: /execute-phase 79-spec-by-reference P1 (tier: cheap)`
`2026-10-21 23:58 — P1 — committed the migration corpus (`scripts/fixtures/spec-by-reference/`: the converted fix/258 documents beside their verbatim `REQUEST.md`, the golden-fixture conversion copy, a `UNIT_ROUTE_REPO` tree with legacy + migrated + broken + missing-shared units) and the red-first pins in four suites (`spec-by-reference.test.mjs` new; phase-lint, unit-route, normative-drift, unit-doc-contract, golden-fixture extended): 20 `#308` cases fail by design and no pre-existing test broke (811 tests, 791 pass); path-protection declaration + justification rows recorded in `decisions.md`; diff-guard PASS 314 lines / 6 files → 1ce956b4 — next: owner review of the converted corpus (AC7/O2), then P2 (section contract, both shapes)`
`2026-10-21 — D4 — owner accepted the converted corpus as the spec-by-reference format (AC7/O2 closed); P2's entry gate is met. The acceptance is a `D` line here, not a `decisions.md` `decision` row: that grammar's `question` cell must name a declared `Q#`, and this gate closes none — `node scripts/needs-input.mjs` fails closed on the mismatch → next: P2`
`2026-10-21 — P2 — the section contract learns both shapes (O1, D1): `UNIT_DOC_SPEC_REF_SECTIONS` + `UNIT_DOC_SECTION_SHAPES` + `resolveUnitDocShape`/`unitDocSectionsFor` published by the schema package, mirrored in the SDK's `schema.mjs` (no import — AC21), read by the producer's `validate`/`setSection` (half-migrated docs refused) and by the router's triage section check; the producer gained `createSpecByReference` with its own re-cut skeleton. The two shapes differ in exactly six headings (`Specs` replaces `Objective`/`Why`/`User outcome`/`Acceptance criteria`; `Findings`/`Log` replace `Evidence`/`Progress log`). Schema 721/721 and Pi 432/432 green; diff-guard PASS 396 lines / 6 files → 3226d239 — next: P3 (templates re-cut)`
`2026-10-21 — P3 — both templates re-cut to the accepted shape (O3): `## Specs` with the `S#` quote markers and the append-only-correction rule, `## Tasks` with `(Implements: S#)`, `## Findings` for OPEN rows, and `## Log` publishing the `log-kind@1` closed vocabulary (L/E/G/F/D/P); `## Evidence` and `## Progress log` are gone, every other section kept. Both validate clean through the producer; the `#305` template pins now follow the shape each template declares, with a new case refusing a legacy-only section in a re-cut template. diff-guard PASS 199 lines / 3 files → 28215d3c — next: P4 (dual grammar in the linter, router and drift gate)`
`2026-10-21 — P4 — machine dual-grammar (O4, O5): `scripts/unit-doc-phases.mjs` gained `parseSpecs`/`parseLog`/`loggedPhases`/`sectionText` and the `(Implements: …)` link on every parsed bullet; `phase-lint` reports four document rules under their own ids (`task-link-missing`, `task-link-dangling`, `spec-unlinked`, `spec-quote-missing`, `log-kind`, `spec-section-missing`); the router derives done phases from `## Log` and OPEN rows from `## Findings`; the templates publish `spec-requirement@1`/`task-spec-link@1`/`log-kind@1`/`findings-table@1` and `AGENTS.md` declares the four surfaces. Committed as two atomic halves (grammar `fdb4393b`, declaration `67d4e5bc`) after one honest split — 9 files/378 lines over the file limit as one commit, each half within it. Root suites 811/811, both package suites green → next: P5 (ledger collapse)`
`2026-10-21 — P5 — ledger collapse (O6): a migrated unit's `## Findings` section is the OPEN-row carrier and its `## Log` lines carry the folded history, review marks and gate runs; `workflow-status` probes the doc first (`findingsCarrier`) and projects the same rows and suggestions from either carrier, and reports each `G`/`F`/`D` log line as a bounded observation; the router reads `## Findings` when the section exists. The prose half (`LEDGERS.md`, `fold-findings`, `review-change`'s persist step, `triage-issue`, `audit-pr`, `workflow-status`) states probe-first and the fallback, with the route ceilings re-based and their growth source named. Committed as two atomic halves (carrier `b0842449`, prose `bcc2bf6b`). Root suites 814/814, budgets PASS 28 skills / 14 routes; a disk-inode exhaustion in /tmp (not a code failure) was diagnosed and cleared mid-phase → next: P6 (wording, migration rule and bookkeeping)`
`2026-10-21 — P6 — wording, migration rule and bookkeeping (O8, O9): the plan step's checklist states spec-by-reference positively (cut each `S#` from the request verbatim, link every task, open `## Log` with `L1`, keep `## Findings` OPEN-only) and `AGENTS.md` keeps `S#` (requirement ids) and `P#` (phase labels) apart; the template agent guide documents both accepted shapes and the carrier rule. Bookkeeping: seven skills bumped (unit-lane 2.4.0 minor, six patches), CHANGELOG rows for each plus `pre-execution-review` 2.8.1 in the internal table, Pi package 0.27.0 with its companion row, README's three carrier restatements corrected. Committed in three atomic halves (`df9d029a` wording, `717190b3` bumps, `ddd33e3b` release). The drift gate caught a real defect mid-phase — a CHANGELOG row restating `pre-execution-review` at 2.8.0 while its frontmatter said 2.8.1 — fixed by adding the missing internal row. Root 814/814, budgets PASS, version-parity PASS → next: P7 (verification + PR)`
`2026-10-21 — P7 — verification (O10): every AC's declared validator re-run at this head — AC1 12/12, AC2 208/208, AC3 20/20, AC4 101/101, AC5 31/31 with no closed unit doc in the diff, AC6 9/9, AC8 814/814 (root) + 721/721 (schema) + 432/432 (pi); context and route budgets PASS, version-parity PASS, phase-lint PASS, promise-coherence PASS, needs-input 0 open questions. PR #311 opened with `Closes #308` → f7f3b0e — next: /review-change on the changed HEAD`
`2026-10-23 17:20 — review step — three independent axis reviewers over `git diff main...HEAD` plus a full gate re-run at this head: `REVIEW-VERDICT: FAIL` (7 material, 15 report-notes, every material row re-verified against source before recording — block written to `## Review verdict`); evidence reproduced (root 814/814, schema 721/721, pi 432/432, budgets/parity/phase-lint/promise-coherence/needs-input all exit 0) and AC integrity unchanged (`## Acceptance criteria` sha256 `d8ea4523b3e6873e`); whole-unit `diff-guard --base main` measured 3528 lines / 52 files → **EXCEPTION recorded** per D2 (one `scope: large` unit, every implement phase guarded at its own base — never a shrunk diff); the stale `## Next` pane re-cut here; the Progress-log entries deliberately keep this doc's paragraph form (re-cutting them to list items mid-review would make the router refuse on the in-progress status and break review-change/fold-findings discovery — N15) → next: /review-change 79-spec-by-reference (persist the findings and own the receipt); ladder steps 2–4 wait behind the repair`
`2026-10-23 20:05 — review fold (cycle 1) — /fold-findings over the persisted ledger: 23 rows folded in five atomic batches (F1+F14 · F6+F21+F22 · F5+F8+F13+F15+F16+F18+F23+F24 · F2+F3+F4 · F11+F12+F19+F7+F9+F10+F25+F26), three rows left open as DISPUTED with their evidence (F17, F20, F24-as-written); nothing reclassified, no test weakened or deleted. Gates re-run at the fold head: root 824/824, schema 721/721 after the 4.8.0 bump (F9 — the dual-shape selector had shipped as four entries in the 4.7.0 row, invisible to the parity gate whose trigger set is `skills/**` + `packages/pi-agentic-workflow/**`), pi 432/432, budgets PASS 28 skills / 14 routes with every re-based ceiling naming its growth source, `LINEAGE OK` (O1–O10 verified), needs-input 0 open questions (AC7/O2's carrier now exists as `Q4`/`D4`), promise-coherence PASS. Disclosed correction to the review itself: N8 was refuted last turn and should not have been — both shipped templates failed their own `(Implements: …)` rule (`spec-unlinked: S2`, exit 1); it is folded here as F21's root cause, not left as a refuted candidate → next: /review-change 79-spec-by-reference (delta re-review)
`2026-10-23 21:40 — dispute resolutions (owner) — F20 DISMISSED (## Impact is the pre-change surface map by contract; `promise-coherence` PASS over 36 claims). F17 DISMISSED as reported and re-scoped: the re-cut link rules are inert on a legacy-shape doc, so this unit's own Tasks are not a defect, while every future unit is covered — both templates now lint PASS under `unit-doc-contract.test.mjs` (F21) and the SDK's re-cut skeleton lints PASS (measured at this head, fingerprint e95e5258…). F24 RESOLVED by D5: the citation pin is this unit's machine backing (landed in d885f693), and the map amendment is deferred to its own unit in ## Future. One discovery the review never held: `createSpecByReference` is exported and unwired — no CLI verb reaches it and `packages/agentic-workflow/test/edit.test.mjs` imports only the legacy `create` — so the producer's re-cut skeleton has no caller and no pin; raised as a proposal for the owner to route, not bundled into this fold → next: /review-change 79-spec-by-reference (delta, cycle 2)
`2026-10-25 09:15 — triage (cycle 2): /triage-issue --prioritize-now 79-spec-by-reference F27 + F28 + F29 — all three classified fix-now, source-owned. F27 (parity gate high): 0.31.0→0.32.0 bump + CHANGELOG row committed (bc4d37ba). F28 (sectionBounds med): sectionBounds moved into unit-doc-phases.mjs as shared fence-aware reader, imported by workflow-status.mjs and ledger-provenance.mjs. F29 (findingsRows med): workflow-status imports findingsRows from unit-route.mjs instead of re-defining rowsFromFindingsSection. Gates: parity PASS 0.31.0→0.32.0 · phase-lint 160/160 · golden-fixture 15/15 · spec-by-reference 17/17 · ledger-ownership 12/12. All three folded → next: /review-change 79-spec-by-reference (final cycle)
`2026-10-26 — review fold (cycle 5) — F40 folded: the two `## Future` rows' status token `kept deferred <date>` re-cut to the published vocabulary — `open` with the deferral dated in prose (`open | planned | discarded <YYYY-MM-DD>`, `_TEMPLATE/SPEC.md:48` · `docs/fix/_TEMPLATE/SPEC.md:60` · `UnitDoc.mjs:70,150`; "keep-deferred" stays an offer outcome); the owner's D5 deferral decision untouched; sweep confirms no other off-vocab status token in the unit's docs → next: /review-change 79-spec-by-reference (delta)
`2026-10-26 — review cycle 4 (delta escalated to a full pass; owner-authorized) — persisted the owner's 2026-10-23 dispute resolutions into the ledger (F17/F20/F24 → disposition `ignore`, decided-never-routed per `unit-route` NOT_OPEN; fold queue empty, router `open-rows: 0`); reviewed head frozen at 56f8ea25, size trigger fired (314 > 200) so the delta ran as a full pass: four isolated axis reviewers (code PASS · security PASS · perf PASS · verify PASS) + two re-verification passes (36/36 folded rows fixed); every gate green at this head (root 828/828, schema 721/721, pi 432/432, parity 0.31.0→0.33.0, budgets 28/14, lineage OK, needs-input 0, promise-coherence PASS, phase-lint PASS, ledger-provenance CHECK PASS); AC integrity unchanged (`de9aea6898468b0d`, byte-identical to `15ab46a1`); main advanced under the PR (feature 66 merged, main pi 0.31.0) — merge-tree shows 0 conflicts, parity re-checked green → `REVIEW-VERDICT: PASS` — next: /review-change 79-spec-by-reference posts the SHA-bound receipt, then the audit stage closes the ladder`
`2026-10-26 — audit stage (/audit-pr) — BLOCKED with three blockers, all cleared in this pass: the branch conflicted with main (7 files) because feature 78 was merged as `78-unit-cycle` (#314) while this branch was open → rebased onto origin/main (44 commits replayed), renumbered the unit to 79 (folder, 63 in-tree references, roadmap row), re-cut the version ladder above main's published versions (execute-phase 6.2.2, unit-lane 2.4.3, pi 0.34.0; the schema pin stays at the published 4.7.0), and settled roadmap row 79 to `done · [#311]`; the second blocker was missing CI evidence (no run at the audited head, the last one red on dependency-pin-drift) and the third the unreachable close-out route. Every gate re-run at the rebased head: root 885/885, schema 721/721, pi 471/471, budgets 28 skills / 14 routes (policy re-basis #9), parity PASS, phase-lint PASS, promise-coherence PASS, needs-input 0, ledger-provenance CHECK PASS, LINEAGE OK. The rebase rewrote every SHA, so the citations above name pre-rebase commits; the two ledger markers that pointed at rewritten commits are re-pointed (F27 → `9a35a976`, F36 → `ac8e20b8`) → next: /review-change 79-spec-by-reference (the receipt at the old head is void)`
`2026-10-26 — audit fold (F48) — the renumber to 79 left the unit-identity headings behind: the H1s of SPEC/BRIEF/decisions/sources/planning-evidence/planning-obligations still read unit 78 while the folder, roadmap row 79, `unit-route` and the audit entry above say 79 (feature 78 is `78-unit-cycle`, PR #314); the six H1s are re-pointed to 79, the dated assumption A1 is marked superseded in place (history kept, never rewritten) and the `## Next` pane is re-cut — the receipt at `89b9eeb` is void at this fold's head → next: /review-change 79-spec-by-reference, then /audit-pr re-runs`

## Next

```text
AUDIT-VERDICT: BLOCKED (2026-10-26, /audit-pr pass 2) → fixed (F48)
- Evidence consumed, every other gate pass: review receipt current at `89b9eeb`
  (scope manifest `585e6ff7…`, AC1–AC8 named, 0 open findings, invariants
  `n/a`, manual checks none) · `LINEAGE OK — lane-era … obligations closed
  (10)` · CI green (root-suite, pi-compat-guard, dependency-pin-gate) ·
  MERGEABLE, base `main`, not draft · roadmap row 79 `done · [#311]` ·
  `Closes #308` in the PR body · hygiene clean. Closure block absent →
  `design-debt` warning (retrofit at the next touch)
- One blocker, folded here: the renumber to 79 left the unit-identity headings
  behind — the six H1s still read `78` while the folder, roadmap row 79,
  `unit-route` and the log say 79 (feature 78 is `78-unit-cycle`, PR #314).
  Folded: the six H1s re-pointed to 79, dated assumption A1 marked superseded
  in place (history kept, never rewritten), this pane re-cut
- Gates at the fold head: root 889/889 · phase-lint PASS · promise-coherence
  PASS (42 claims) · needs-input 0 · ledger-provenance CHECK PASS
- The rebase onto `origin/main` earlier in this unit replayed 44 commits and
  rewrote every SHA, so citations above this fold name pre-rebase commits and
  the two ledger markers are re-pointed (F27 → `9a35a976`,
  F36 → `ac8e20b8`)
```

→ next: /review-change 79-spec-by-reference — the F48 audit fold moved the head,
so the receipt at `89b9eeb` is void here; post the SHA-bound receipt at this head,
then /audit-pr re-runs.

## Review verdict

```text
REVIEW-VERDICT: PASS
- Cycle: 4 — delta over the last three fold batches (`e838a8c7` F37+F38+F39 ·
  `b1c83f3e` F36 · `b52e7743` F35), escalated to a full pass — size trigger
  fired (314 added+deleted > 200); owner-authorized after the two-cycle cap
- Reviewed head: 56f8ea254f12b1d433a086d8812be5297cfb4421 (= PR #311 head)
- Findings: 0 material · 2 low report-notes · 2 low proposals (never
  persisted — below the materiality floor; the owner routes them)
- Re-verification: 36/36 folded rows fixed at their cited surfaces;
  F17/F20/F24 owner-decided (`ignore`) — the fold queue is empty
- AC integrity: `## Acceptance criteria` byte-identical between `15ab46a1`
  and this head
```

Four isolated axis passes ran over `git diff main...HEAD` at the reviewed head
(`review-code` PASS, `review-security` PASS, `review-perf` PASS,
`review-verify` PASS) plus two folded-row re-verification passes (F1–F26,
F27–F39): every gate re-run green (root 828/828, schema 721/721, pi 432/432,
parity 0.31.0→0.33.0 PASS, budgets 28 skills/14 routes, lineage OK,
promise-coherence PASS, needs-input 0, phase-lint PASS, ledger-provenance
CHECK PASS); no test deleted or loosened. History: cycle 1 FAIL (7 material /
15 report-notes — folded as F1–F26), cycle 2 FAIL (F27–F29), cycle 3 FAIL
(F35–F39) — every row folded or owner-decided; the per-cycle record lives in
`review-findings.md`. The low rows (never persisted): dead `sectionRange`
helper (`scripts/workflow-status.mjs`) and a dead branch in the F38 corpus
test (report-notes); per-unit doc re-read ×4 and unbounded `## Log`
observation growth (proposals — the second extends the recorded perf-benchmark
proposal). The owner routes them: a tiny fold batch or the next touch.

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
