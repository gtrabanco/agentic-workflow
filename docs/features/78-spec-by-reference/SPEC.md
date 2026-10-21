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
- **The schema package (pending Q1):** `UNIT_DOC_REQUIRED_SECTIONS`
  (`packages/agentic-workflow-schema/src/pre-execution.ts:225`) is mirrored by
  three surfaces and pinned by `scripts/unit-doc-contract.test.mjs`; a
  required-list or selector change is a mirrored package change in the same PR.
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
  change. *(Tension recorded as Q1 — the triage gate requires all 14 sections
  today, so how far the machine moves is the owner's call.)*
- Findings discovered during implementation never expand scope.

## Future

- `open`, 2026-10-21 — "No change to the review machinery here
  (review-on-slices / review_due is a follow-up unit once slices exist)."
  (#308 §Non-goals)
- `open`, 2026-10-21 — "the required-list change, if wanted, is a separate
  mirrored package change." (#308 §Non-goals; Q1 decides whether this unit
  absorbs it)

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

- P1 — Red-first pins and fixtures: commit the fixture corpus (the golden
  fixture's spec-by-reference copy plus a converted copy of `fix/258`'s
  documents) and the red-first cases for the new grammar in the linter, router
  and drift-gate suites.
  (validator: `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs scripts/normative-drift.test.mjs` exits 0 — the new cases are red until P2/P3 land)
  Relevant files: scripts/fixtures/spec-by-reference, scripts/phase-lint.test.mjs, scripts/unit-route.test.mjs, scripts/normative-drift.test.mjs
- P2 — Templates re-cut: both `docs/features/_TEMPLATE/SPEC.md` and
  `docs/fix/_TEMPLATE/SPEC.md` gain `## Specs` /
  `## Tasks` (`S#` links) / `## Log`, keep `## Impact`, fold the Evidence table
  into Log lines; the four pinned section-contract surfaces are re-pointed to
  the agreed shape (Q1) in the same change.
  (validator: `node --test scripts/unit-doc-contract.test.mjs scripts/pre-execution-quality.test.mjs scripts/lane-era-lineage.test.mjs` exits 0)
  Relevant files: docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, scripts/unit-doc-contract.test.mjs, packages/agentic-workflow-schema/src/pre-execution.ts
- P3 — Machine dual-grammar: `unit-doc-phases.mjs` + `phase-lint.mjs` accept
  `S#`-linked task bullets and the new sections alongside the current grammar;
  `unit-route.mjs` reads both shapes (triage section check, phase/done
  derivation); `normative-surfaces@1` gains the new grammar rows; schema
  mirrors follow if Q1 requires it (version bump, same PR).
  (validator: `node --test scripts/phase-lint.test.mjs scripts/unit-route.test.mjs scripts/normative-drift.test.mjs scripts/unit-doc-contract.test.mjs` exits 0 on both-shape fixtures)
  Relevant files: scripts/unit-doc-phases.mjs, scripts/phase-lint.mjs, scripts/unit-route.mjs, AGENTS.md
- P4 — Ledger collapse: the open-findings short table + `## Log` lines (fold
  sha, what was verified, `REVIEW-RAN`/`GATE-RAN`/`VF` as log lines with exit
  codes) replace `review-findings.md` for migrated units; every reader is
  rewired to probe the unit doc first and fall back to the legacy file.
  (validator: `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/review-loop-discipline.test.mjs scripts/workflow-status-sensor.test.mjs` exits 0)
  Relevant files: skills/pre-execution-review/references/LEDGERS.md, scripts/workflow-status.mjs, scripts/ledger-provenance.mjs, skills/fold-findings/SKILL.md, skills/review-change/references/PERSIST_AND_DECIDE.md
- P5 — Positive prescription and migration rules: the plan step states what to
  do (cut each `S#` verbatim, link tasks, keep the log) as a positive
  checklist; the migration rule (open units at next touch, closed never) lands
  in the lane/executor references; `AGENTS.md`/`PLAN.md` `S#`-vs-`P#` wording
  amended; `bump-skill` pass + CHANGELOG rows + package version bumps.
  (validator: `node --test scripts/knowledge-honesty-contract.test.mjs` exits 0; `bun scripts/check-skill-context.mjs` exit 0; `node scripts/version-parity-gate.mjs --content --base main` exit 0)
  Relevant files: skills/unit-lane/references/PLAN.md, skills/unit-lane/SKILL.md, AGENTS.md, CHANGELOG.md
- P6 — Verification: run every AC's command, fill the Evidence rows, run the
  root suites and both package suites, present the converted fixture corpus to
  the owner (AC7), open the PR with `Closes #308`.
  (validator: `node --test scripts/*.test.mjs` exits 0; `bun run test` exits 0 in both packages)

### Planning evidence

M/L unit — the ledger is frozen as `planning-evidence.md` in this folder (plan
step, sizing rule `skills/unit-lane/references/PLAN.md:153-160`); this section
names it and does not duplicate its rows.

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
  states each scope item); gap interview open — Q1 section-set strategy, Q2
  unit sizing, Q3 open-findings carrier, batched in `decisions.md`.
- **plan** — Tasks P1–P6 below; planning ledgers freeze as
  `planning-evidence.md` / `planning-obligations.md` (M/L sizing rule);
  prior-decisions contradiction sweep runs with the plan step.
- **implement/tests** — P1 pins + fixtures red-first, P2 templates, P3 machine
  dual-grammar, P4 ledger collapse, P5 wording + bookkeeping; one phase per
  hand-off at the `implement` tier (`cheap`), diff guard after each.
- **evidence/review/docs** — Evidence row per AC, owner acceptance of the
  converted fixture corpus (AC7), review verdict, `bump-skill` + CHANGELOG +
  package bumps (P5), PR with `Closes #308` (P6), release step at close-out.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed
output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | research: `grep -rln "review-findings" scripts skills docs template .github packages` + per-file reads | exit 0 | 6 scripts, 8 skills/references, 6 test suites read the ledger | this session, 2026-10-21 |
| R2 | research: `sed -n 649,651p scripts/unit-route.mjs` + `packages/agentic-workflow-schema/src/pre-execution.ts:225-241,529-556` | exit 0 | triage fails closed on a missing section; selector requires all 14 in order | this session, 2026-10-21 |
| — | `bun scripts/unit-route.mjs --triage 78-spec-by-reference` (block pasted verbatim under `## Triaged steps`) | exit 0 | 9 steps, 0 skipped, budget strong | this session, 2026-10-21 |
| — | `bun scripts/phase-lint.mjs docs/features/78-spec-by-reference/SPEC.md` | exit 0 | P1–P6 `PASS (6/6)` · verdict PASS | this session, 2026-10-21 |
| — | `node scripts/promise-coherence.mjs` (head after the unit doc's Impact paths were made absolute) | exit 0 | `verdict PASS` · claims 35 checked / 77 skipped | #305 guard, this session |
| — | `node scripts/needs-input.mjs docs/features/78-spec-by-reference` | exit 0 | `Open questions: 3` · route `design` · continuation `no-decision-available` | dispatcher, this session |
| — | `node --test scripts/*.test.mjs` (root suites, after the schema build) | exit 0 | tests 775, pass 775, fail 0 | this session, 2026-10-21 |

## Progress log

`2026-10-21 22:40 — unit doc created from issue #308 (--from-issue); roadmap row 78 registered; research + design provenance recorded in sources.md (19 claims); three open questions appended to decisions.md; triage block pasted; phase-lint PASS (6/6 ×6), promise-coherence PASS, root suites 775/775 → 15ab46a1 — next: batched gap interview (Q1–Q3), then the plan step`

## Next

Answer the three open questions in `decisions.md` (Q1 section-set strategy, Q2
unit sizing, Q3 open-findings carrier), then the plan step cuts the phases.

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
