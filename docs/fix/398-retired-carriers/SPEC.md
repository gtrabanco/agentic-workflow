---
type: fix
scope: standard
---

# fix/398-retired-carriers

> Fix two machine surfaces that still read unit carriers retired by feature 61
> (adaptive lane) and feature 79 (spec-by-reference), so they cannot judge a
> current unit.

## Issue

`#398` — audit-docs checks 10-11 and unit-route's scope fallback still read
retired unit carriers.

Two defects, one root cause: a machine surface reading a carrier it no longer
has authority to reference.

**Scope A** — `audit-docs` check 11 demands TASKS.md + progress.md +
pre-lane close-out for every in-progress/done unit — no post-61 unit has those
files. Check 10 also needs a lane-era owner.

**Scope B** — `unit-route.mjs` scope fallback reads `## Objective` /
`## Acceptance criteria` but the re-cut template has `## Specs` with `S#`
requirements instead, so new units derive `scope: trivial` and skip design,
plan, tests, review, docs.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers, in the order the issue states them.

**S1 — audit-docs check 11 gains a carrier branch, discriminated mechanically.**
> **A1 — check 11 gains a carrier branch, discriminated mechanically.** The
> marker is the unit's own artifact presence (`TASKS.md` in the unit folder →
> legacy carriage; absent → lane-era). Nothing else: no `unit-lineage` (D4), no
> branch state, no model judgment.

The issue's replacement text, verbatim; "adapted wording is fine; the four
properties are not: branch first, name the owner command, cite the two
sub-checks not `check-all`, declare the vacuous case":

```text
11. **Per-phase doc discipline — keyed on the unit's own carrier.** Pick the
    carrier mechanically, never by guess: `TASKS.md` in the unit folder means
    legacy carriage; its absence means the unit doc's `## Tasks`/`## Log`.
    - **lane-era** — `bun scripts/ceremony.mjs docs check-tasks-ticks --slug <slug>`
      and `bun scripts/ceremony.mjs docs check-progress-entry --slug <slug>` must
      both report `valid: true`: every `- [x] P<n>` has its `P<n>` line in
      `## Log`, and no task lacks one. Cite those two fields, never `check-all`
      (its `commit-format`/`docs-language` fields are checks 14 and 7).
    - **legacy** — the original assertions on that unit's own files: completed
      phases ticked in `TASKS.md`, one `progress.md` entry per completed phase,
      the literal close-out tasks in the final phase.
    - **Severity** — a `done` unit whose ledger disagrees with its tasks: HIGH.
      The same on an `in-progress` unit: LOW (it may still be settling). Only
      `high`/`low` exist in this report's legend.
    - **Close-out** is `audit-pr`'s contract (receipt + ordered gates): cite its
      verdict, never re-derive the retired literal tasks here.
```

**S2 — audit-docs check 10 keeps its legacy scope and gains the lane-era owner.**
> **A2 — check 10 keeps its legacy scope but says so**, and gains the lane-era
> owner: `bun scripts/phase-lint.mjs <unit-doc>` (owner
> `skills/phase-contract/SKILL.md`) and
> `bun scripts/ceremony.mjs docs check-phase-labels --slug <slug>`. The existing
> grep stays, labelled *legacy carriers only*, with D11's note that a `S#` hit in
> a lane-era doc is not a phase label.

**S3 — the frozen report surfaces stay untouched.**
> **A3 — do not** touch the report contract, the check count (`15`), the legend,
> or `scripts/review-loop-discipline.test.mjs` (D10).
> `skills/product-audit/references/AUDIT_DIMENSIONS.md` composes `audit-docs` and
> is forbidden from restating its axes — leave it alone.

**S4 — unit-route's scope fallback reads both accepted shapes.**
> **B1 — `unit-route.mjs` gains a spec-by-reference fallback.** In `unitFacts`
> (`scripts/unit-route.mjs:589-618`), when frontmatter declares no `scope`, the
> derivation must read **both** accepted shapes: the legacy `## Objective`/
> `## Acceptance criteria` pair **and** the spec-by-reference `## Specs`
> requirement lines (`**S<n> — …**`). A doc carrying ≥ 3 requirements is never
> `trivial`.

**S5 — the templates carry the surfaces a unit needs.**
> **B2 — the template carries the surface it needs.** Add the `type`/`scope`
> frontmatter block to `docs/features/_TEMPLATE/SPEC.md`,
> `docs/fix/_TEMPLATE/SPEC.md` and `template/docs/features/_TEMPLATE/SPEC.md`
> (values documented inline: `type: feature|fix|docs|chore`,
> `scope: trivial|xs|small|standard|medium|large|xlarge`), plus the
> `## Triaged steps` slot with the note that the block is pasted verbatim from
> `unit-route --triage` (owner of the rule: `skills/unit-lane/SKILL.md:151`).
> `scripts/scaffold-parity.test.mjs` reads both template trees — the change must
> keep them byte-identical in the sections it asserts, and the section sequence
> it pins must still hold (decide: `## Triaged steps` is a *pasted* section, so
> placing it right after `## Tasks` matches the existing exemplar
> `docs/features/79-spec-by-reference/SPEC.md:293`; if the parity contract
> refuses an added section, the fallback is to document the slot in
> `template/AGENTS.md` instead — record which).

**S6 — the vacuous pass becomes an answer, and both halves agree.**
> **B3 — the vacuous pass becomes an answer.** `checkTasksTicks`/
> `checkProgressEntry` (`scripts/ceremony/docs.mjs:49-63`) must report `n/a`
> (with the reason `no ## Tasks section — legacy carrier`) instead of
> `valid: true` when the unit doc has no `## Tasks`. Keep `check-all`'s current
> `missing-section` behaviour for the aggregate, or switch it to the same `n/a`
> — but the two halves must agree, and the choice is recorded in `decisions.md`.

**S7 — the unit's non-goals.**
> - No new `audit-docs` check: the count stays 15 and the report contract is
>   untouched (D10).
> - No rewrite of the ~30 legacy units or their `TASKS.md`/`progress.md`.
> - No change to `unit-lineage`, `audit-pr`'s gate 1, or the triage catalog.
> - Not the documentation-generation automation (that is #396).

**S8 — the phased plan, every task with its validator.**
> **P1 — red-first tests for B1.** Extend `scripts/unit-route.test.mjs` (59 cases
> today, zero mention of `trivial` — D9) with: a spec-by-reference doc with ≥ 3
> `**S#**` requirements and no frontmatter derives `scope: standard` (today:
> `trivial`); a doc with 1–2 requirements and a short objective still derives
> `trivial`; an explicit `scope:` frontmatter still wins over both. *Validator:*
> `node --test scripts/unit-route.test.mjs` → the three new cases fail on the
> current code and name the wrong derivation (red commit first, per the
> repository's red-first rule).
>
> **P2 — green: the fallback reads both shapes.** Implement B1. *Validator:*
> `node --test scripts/unit-route.test.mjs` exits 0, and
> `node scripts/unit-route.mjs --triage 103-doc-currency` keeps its current
> 8-step answer (regression: the pasted block of a real unit must not change).
>
> **P3 — red-first tests for B3.** Extend `scripts/ceremony-docs.test.mjs`
> (anchors: `:90` ticks mismatch, `:97` tick+log pass, `:107` progress missing):
> a unit doc with no `## Tasks` answers `n/a` with the legacy-carrier reason
> (today: `valid: true`). *Validator:* `node --test scripts/ceremony-docs.test.mjs`
> → the new case fails on the current code.
>
> **P4 — green: the vacuous pass becomes an answer**, plus the `check-all`
> agreement decision recorded. *Validator:* `node --test
> scripts/ceremony-docs.test.mjs` exits 0; `bun scripts/ceremony.mjs docs
> check-all --slug 32-review-consistency-pack` answers without pretending the
> unit has tasks.
>
> **P5 — templates carry the surfaces (B2).** Add frontmatter to both repo
> templates and the exported one, plus the `## Triaged steps` slot (or the
> `template/AGENTS.md` fallback if parity refuses). *Validator:* `node --test
> scripts/scaffold-parity.test.mjs` and `node --test
> scripts/unit-doc-contract.test.mjs` exit 0, and a fresh unit created from the
> template survives `node scripts/phase-lint.mjs` **and** `node
> scripts/unit-lineage.mjs --unit <new-slug>` (needs the pasted block — document
> that the triage step writes it).
>
> **P6 — scope A: rewrite checks 10 and 11 (A1, A2).** *Validator:* `bun
> scripts/skill-lint.mjs` → `verdict: PASS`; `bun scripts/check-skill-context.mjs`
> exits 0 with `audit-docs` inside its unchanged ceilings; `node --test
> scripts/review-loop-discipline.test.mjs` exits 0 **unmodified** (D10).
>
> **P7 — evidence the rewrite bites both ways.** Run the new check 11 over one
> lane-era unit (`103-doc-currency` → `valid: true` twice) and one legacy unit (a
> real defect reproduced in a throwaway copy, or cited from D6). Record both
> outputs. *Validator:* the two runs are pasted verbatim in the unit doc's
> `## Log`.
>
> **P8 — the repository gate.** *Validator:* `node scripts/run-root-suite.mjs`
> exits 0.
>
> **P9 — release intent and PR.** `.changeset/*.md` declaring
> `@gtrabanco/pi-agentic-workflow` (its content source is `skills/`) plus
> whichever packages the template change touches; one PR against `main`.
> *Validator:* `node scripts/version-parity-gate.mjs --content` → `VERDICT:
> PASS`; `node scripts/lint-changeset.mjs <the file>` → `ok`.

## Impact

What this fix touches, beyond its own files:

- `skills/audit-docs/SKILL.md` (checks 10, 11) — prose the audit reads; no
  executable effect, but it orders what an agent does next.
- `scripts/unit-route.mjs` (`unitFacts`) — every `--triage`/route run in every
  session reads it. A change here can silently re-scope an existing unit, so the
  differential sample in O2 is part of the change, not evidence after it.
- `scripts/ceremony/docs.mjs` — `docs check-*` output shape. The `n/a` answer is
  consumed by `audit-docs` check 11 and by any operator reading the JSON.
- The four unit-doc templates — every unit cut from here on copies them.
- Frozen: `scripts/review-loop-discipline.test.mjs` (check count 15) and
  `skills/product-audit/references/AUDIT_DIMENSIONS.md` (composes, never
  restates). `unit-lineage` stays the gate, untouched.

## Retirements

No surface is retired by this fix. The retired carriers (`TASKS.md`,
`progress.md`) keep existing on legacy units; the machine now **discriminates**
instead of blindly asserting them. The only literal removed is the hand-rolled
`## Specs` regex in `unitFacts`, replaced by the shared `parseSpecs` grammar
(negative pin: `rg -n 'S\\\\d\+\[\^\\\*\]' scripts/unit-route.mjs` → 0).

## Non-goals

- Do NOT change unit-lineage (D4: it is the gate)
- Do NOT touch the report contract, check count (15), or the legend
- Do NOT touch scripts/review-loop-discipline.test.mjs (D10: the frozen pin)
- Do NOT touch skills/product-audit/references/AUDIT_DIMENSIONS.md (forbidden)
- Do NOT remove TASKS.md or progress.md from legacy units
- Do NOT change audit-pr's contract

## Risk tier

**`standard`** — scope B touches executable content (`scripts/unit-route.mjs`,
`scripts/ceremony/docs.mjs`), so the passive shortcut is not available. The
issue's risk 1 asks for that to be confirmed rather than shipping scope A alone
as a passive unit; the triage verdict on the issue (`2026-11-04`) confirms it:
"The unit is **standard** (scope B touches executable content), so the passive
shortcut is not available."

**Task Size = standard · Task Size = Contained + Resumable**

## Future

none

## Future cost

none

## Applicable tests

- `node --test scripts/unit-route.test.mjs` (S4)
- `node --test scripts/ceremony-docs.test.mjs` (S6)
- `node --test scripts/scaffold-parity.test.mjs` (S5)
- `node --test scripts/unit-doc-contract.test.mjs` (S5)
- `node --test scripts/review-loop-discipline.test.mjs` (S3, unmodified)
- `node scripts/run-root-suite.mjs` (S8/P8)
- `bun scripts/skill-lint.mjs`, `bun scripts/check-skill-context.mjs` (S8/P6)

## Known pre-existing issues

- The `unit-route` skipped-reason text says `trivial scope` for a `fix` unit
  whose `research`/`design` steps are skipped by *type*, not scope. Pre-existing,
  outside this unit's asks (S7), untouched.
- `node scripts/unit-route.mjs --triage 398-retired-carriers` derives the fix
  step set from `type: fix` + the requirement count; the reason strings above
  are the only place the wrong word appears.

## Tasks

- [x] P1 — red-first tests for S4: a spec-by-reference doc with ≥3 `**S#**` requirements derives `standard`, 1–2 requirements stay `trivial`, explicit frontmatter wins, and the legacy pair keeps its previous derivation (validator: `node --test scripts/unit-route.test.mjs` exits 0)
  (Implements: S4)
  Relevant files: scripts/unit-route.test.mjs, scripts/fixtures/unit-route/docs/features/
- [x] P2 — green: `unitFacts` reads both accepted shapes through the shared `parseSpecs` grammar, plus the differential sample over every repo unit (validator: `node --test scripts/unit-route.test.mjs` exits 0; the differential run differs only on the ≥3-`S#` docs)
  (Implements: S4)
  Relevant files: scripts/unit-route.mjs
- [x] P3 — red-first tests for S6: no `## Tasks` answers `n/a` with the legacy-carrier reason in all three discipline checks, and `check-all` tells the same story (validator: `node --test scripts/ceremony-docs.test.mjs` exits 0)
  (Implements: S6)
  Relevant files: scripts/ceremony-docs.test.mjs, scripts/ceremony/docs.mjs
- [x] P4 — green: the vacuous pass becomes an `n/a` answer, `check-all` treats `n/a` as passing, decision recorded (validator: `node scripts/ceremony.mjs docs check-all --slug 32-review-consistency-pack` exits 0 with `overall: PASS`)
  (Implements: S6)
  Relevant files: scripts/ceremony/docs.mjs, docs/fix/398-retired-carriers/decisions.md
- [x] P5 — templates gain the `type`/`scope` block and the `## Triaged steps` slot in both repo and exported trees (validator: `bun test scripts/*-parity.test.mjs scripts/unit-doc-contract.test.mjs` exits 0)
  (Implements: S5)
  Relevant files: docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md
- [x] P6 — scope A: checks 10 and 11 rewritten, legacy scope labelled, lane-era owners named, count still 15 (validator: `bun scripts/skill-lint.mjs` exits 0 with `verdict: PASS`; `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S2, S3)
  Relevant files: skills/audit-docs/SKILL.md
- [x] P7 — evidence the rewrite bites both ways: one lane-era unit passes, one legacy defect reproduces (validator: `node scripts/ceremony.mjs docs check-tasks-ticks --slug 103-doc-currency` exits 0 with `valid: true` and the legacy copy exits 2 with `valid: false`)
  (Implements: S1)
  Relevant files: docs/fix/398-retired-carriers/SPEC.md
- [x] P8 — the repository gate and the non-goal sweep (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  Relevant files: all changed files
- [x] P9 — release intent passes its two gates (validator: `node scripts/version-parity-gate.mjs --content` matches `VERDICT: PASS`; `node scripts/lint-changeset.mjs <file>` matches `ok`)
  (Implements: S8)
  Relevant files: .changeset/*.md

## Triaged steps

```text
TRIAGE — 398-retired-carriers (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | `audit-docs` check 11 names `TASKS.md`/`progress.md` and the literal pre-lane close-out for every `in-progress`/`done` unit, with no carrier branch | D1: `skills/audit-docs/SKILL.md:84` (check 10 at `:81`, section header `:77`), sampled at the cut head | current | O8 |
| PE-002 | known | 48 units carry `progress.md`, 28 carry `TASKS.md` (85 files), and none of them is post-feature-61, so the literal check judges nothing today | D2: `ls docs/features/*/progress.md docs/fix/*/progress.md \| wc -l` → 48; same for `TASKS.md` → 28; loop over `docs/features/{62..84,103}-*` → no hit | current | O8 |
| PE-003 | known | A legacy unit has no `## Tasks`, so the three discipline checks currently either error (`missing-section`, exit 2) or pass vacuously (`valid: true`, nothing judged) — the two halves disagree | D3/D5: `node scripts/ceremony.mjs docs check-all --slug 32-review-consistency-pack` → `missing-section` exit 2; `docs check-tasks-ticks` → `{"valid":true,"mismatched":[]}` exit 0 | current | O3, O4, O5 |
| PE-004 | known | `unit-lineage` is a gate, not a carrier classifier: its `path` is 3-valued and `legacy` also requires a closed obligation ledger, so it may never pick a check's carrier | D4: `node scripts/unit-lineage.mjs --unit 32-review-consistency-pack --json` → `legacy-fallthrough` exit 1; `scripts/unit-lineage.mjs:283-300` | current | O8 |
| PE-005 | known | `unitFacts` derives `trivial` from the retired `## Objective`/`## Acceptance criteria` pair, so a doc carrying neither derives `trivial` regardless of how many requirements it states | D7: `scripts/unit-route.mjs:600-615` at the cut head | current | O1 |
| PE-006 | known | The scope heuristic was untested, which is why it rotted: no existing router case mentions `trivial` | D9: `rg -c trivial scripts/unit-route.test.mjs` → 0 matches over 59 cases | current | O1 |
| PE-007 | known | Re-pointing checks 10/11 does not move the frozen report pin: it asserts only `Check (1-15)`, `Checks run: <n>/15` and the absence of `MEDIUM`, and the count stays 15 | D10: `scripts/review-loop-discipline.test.mjs:547-553` | current | O10 |
| PE-008 | known | Check 10's current grep hits are benign and a lane-era `S#` hit would be a false positive, because since #308 `S#` is the requirement id, not a phase id | D11: `grep -rnE '\bS[0-9]+\b\|\bStep [0-9]' docs/features/*/{PLAN,TASKS,progress}.md` → 22, all literal `Step 0 — Discover the project` in units 06 and 13 | current | O9 |
| PE-009 | known | The template every new unit copies carries no frontmatter and no `## Triaged steps` slot; the requirement lives only in the lane's prose | D8: `head -2 docs/features/_TEMPLATE/SPEC.md` → `# NN — <unit-slug>`; `rg -n 'Triaged steps' docs/features/_TEMPLATE/SPEC.md` → 0 hits; `skills/unit-lane/SKILL.md:151` | current | O6 |
| PE-010 | known | The router and the linter already share one `## Specs` reader: `parseSpecs` in `scripts/unit-doc-phases.mjs` owns the `**S<n> — title.**` grammar and `unit-route.mjs` already imports that module, so a second regex would be a duplicate grammar | `scripts/unit-doc-phases.mjs:224-273`; `scripts/unit-route.mjs:31` (existing import) | current | O1, O2 |
| PE-011 | known | `scaffold-parity` requires the exported template to carry its repo twin's `## ` sections in order and refuses any section outside that list, so both trees must gain `## Triaged steps` and the repo change alone fails the gate | `scripts/scaffold-parity.test.mjs:80-175` (`requiredSections`, `shapeFailures`) | current | O6 |
| PE-012 | known | `unit-doc-contract` requires all four templates to carry the re-cut contract sections in order and permits extra sections, so `## Triaged steps` between `## Tasks` and `## Findings` is accepted there | `scripts/unit-doc-contract.test.mjs:139-170`; `packages/agentic-workflow-schema/src/pre-execution.ts:252-264` | current | O6 |
| PE-013 | spec | The `## Triaged steps` slot sits after the `## Tasks` sub-blocks and before `## Findings`; the exemplars that carry it also place `## Acceptance criteria` there | `docs/features/79-spec-by-reference/SPEC.md:293`; `docs/fix/370-pi-150-compat-reverification/SPEC.md:224,240`; `docs/fix/361-finding-severity-ladder/SPEC.md:302` | current | O6 |
| PE-014 | known | `unit-lineage` opens the lane-era path only when a pasted `## Triaged steps` block re-derives and every obligation row is closed, so a template copy passing `phase-lint` still needs its triage block pasted | `scripts/unit-lineage.mjs:96-110` (`parseTriagedBlock`), `:300-316` (rederive + closure) | current | O7 |
| PE-015 | assumption | A unit doc whose frontmatter block carries only comments is accepted by every reader the templates feed (`phase-lint`, `unit-lineage`, `ceremony docs`, `unit-route`) | owner: this unit (P5); basis: `frontmatterOf` ignores non-`key:` lines (`scripts/unit-route.mjs:571-581`), and no other reader parses frontmatter at all — sampled on a fixture copy in P5 | current | O6, O7 |
| PE-016 | unknown | Whether the S4 fallback changes any existing unit's derived scope: no sample existed at cut time, so the differential run is the measurement, not an afterthought | owner: this unit (P2); the measurement is the O2 validator over every `docs/{features,fix}/*/SPEC.md` | not-applicable | O2 |

## Acceptance criteria

One observable criterion per `S#`, each naming the check that proves it.

- [ ] **S1** — `skills/audit-docs/SKILL.md` check 11 branches on `TASKS.md`
  presence first, names `bun scripts/ceremony.mjs docs check-tasks-ticks` and
  `check-progress-entry` (never `check-all`), declares the no-`## Tasks` case,
  sets `done`→HIGH / `in-progress`→LOW, and delegates close-out to `audit-pr`.
  Proof: the S1 property check (`6/6` lines matched) plus `bun scripts/skill-lint.mjs` → PASS.
- [ ] **S2** — check 10 labels its grep *legacy carriers only*, names
  `bun scripts/phase-lint.mjs <unit-doc>` and
  `bun scripts/ceremony.mjs docs check-phase-labels --slug <slug>` as the
  lane-era owners, and states that an `S#` hit in a lane-era doc is not a phase
  label. Proof: the S2 property check (`3/3` matched).
- [ ] **S3** — the check count is still 15, the legend is unchanged, and neither
  `scripts/review-loop-discipline.test.mjs` nor
  `skills/product-audit/references/AUDIT_DIMENSIONS.md` is modified. Proof:
  `node --test scripts/review-loop-discipline.test.mjs` exits 0 and
  `git diff --stat main -- <both paths>` prints nothing.
- [ ] **S4** — a spec-by-reference doc with ≥3 `**S#**` requirements and no
  `scope` frontmatter derives `standard`; 1–2 requirements still derive
  `trivial`; an explicit `scope:` wins; the legacy pair keeps its old
  derivation. Proof: `node --test scripts/unit-route.test.mjs` exits 0 with the
  four `#398 B1` cases.
- [ ] **S5** — the two repo templates and the two exported templates carry the
  commented `type`/`scope` block and the `## Triaged steps` slot in the same
  order, and a copy of a template survives `phase-lint` + `unit-lineage` once
  its triage block is pasted. Proof: `node --test scripts/scaffold-parity.test.mjs`
  and `node --test scripts/unit-doc-contract.test.mjs` exit 0, plus the fixture
  run in `## Log`.
- [ ] **S6** — `check-tasks-ticks`, `check-progress-entry` and
  `check-phase-labels` answer `{"n/a": "no ## Tasks section — legacy carrier"}`
  (no `valid: true`) on a doc with no `## Tasks`, and `check-all` reports the
  same story with `overall: PASS`. Proof:
  `node scripts/ceremony.mjs docs check-all --slug 32-review-consistency-pack`
  exits 0, plus `node --test scripts/ceremony-docs.test.mjs` exits 0.
- [ ] **S7** — no `audit-docs` check is added (count 15), no legacy unit file is
  rewritten, and `scripts/unit-lineage.mjs`, `skills/audit-pr/`, and the triage
  catalog are untouched. Proof: the O14 sweep (`git diff --stat main -- …`
  prints nothing; the check count grep matches 15).
- [ ] **S8** — every phase's validator was run in the foreground and its
  observed result recorded, and the repository gate is green. Proof:
  `node scripts/run-root-suite.mjs` exits 0 and the `## Log` E lines name each
  run.

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S4, S8 (P1) | a spec-by-reference unit doc with ≥3 `**S<n> — …**` requirement lines and no `scope` frontmatter derives `standard`, never `trivial` (R1 reproducer: today it derives `trivial` and silently skips design/plan/tests/review/docs) | P1 | P1 | execute-phase | `node --test scripts/unit-route.test.mjs` exits 0 with the 4 `#398 B1` cases green | red run on the base code (cases fail naming `trivial`) then green run, as E lines in `## Log` | verified |
| O2 | S4, S8 (P2) | the fallback reads both accepted shapes through the one shared grammar, and no unit's derived scope changes except the intended ≥3-`S#` docs (differential) | P2 | P2 | execute-phase | `node scripts/unit-route.mjs --triage <slug>` over every `docs/{features,fix}/*/SPEC.md` differs from the base run only on the ≥3-`S#` set | differential table (base vs change) pasted in `## Log` | verified |
| O3 | S6, S8 (P3) | `check-tasks-ticks` answers `{"n/a": "no ## Tasks section — legacy carrier"}` on a doc with no `## Tasks`, never a vacuous `valid: true` (R2 reproducer) | P3 | P3 | execute-phase | `node --test scripts/ceremony-docs.test.mjs` exits 0 with the exact-assertion case | red run (vacuous `valid: true` observed) then green run in `## Log` | verified |
| O4 | S6, S8 (P3) | `check-progress-entry` answers the same `n/a` reason on a doc with no `## Tasks`, never a vacuous `valid: true` | P3 | P3 | execute-phase | `node --test scripts/ceremony-docs.test.mjs` exits 0 with the exact-assertion case | red run then green run in `## Log` | verified |
| O5 | S6, S8 (P4) | `check-all` tells the same story as the sub-checks: an `n/a` row is a passing row, the aggregate no longer errors `missing-section` on a legacy unit (R4 reproducer), and the choice is recorded | P4 | P4 | execute-phase | `node scripts/ceremony.mjs docs check-all --slug 32-review-consistency-pack` exits 0 with `overall: PASS` and the three `n/a` rows | pasted CLI output + the D1 decision line in `decisions.md` | verified |
| O6 | S5, S8 (P5) | the two repo templates and the two exported templates carry the commented `type`/`scope` vocabulary and the `## Triaged steps` slot, in the contract order both parity suites pin | P5 | P5 | execute-phase | `node --test scripts/scaffold-parity.test.mjs` exits 0 and `node --test scripts/unit-doc-contract.test.mjs` exits 0 | both suite runs in `## Log` | verified |
| O7 | S5, S8 (P5) | a unit copied from a template survives `phase-lint` and `unit-lineage` once its triage block is pasted (the template states the paste) | P5 | P5 | execute-phase | `node scripts/phase-lint.mjs <fixture>/SPEC.md` matches `PASS` and `node scripts/unit-lineage.mjs --unit <fixture-slug>` matches `LINEAGE OK` | the two fixture runs pasted in `## Log` | verified |
| O8 | S1, S8 (P6) | check 11 branches on `TASKS.md` presence first, names the two ceremony sub-checks (not `check-all`), declares the no-`## Tasks` case, and keeps `done`→HIGH / in-flight→LOW with close-out delegated to `audit-pr` (R3 reproducer) | P6 | P6 | execute-phase | the S1 property check over `skills/audit-docs/SKILL.md` matches 6/6 and `bun scripts/skill-lint.mjs` exits 0 with `verdict: PASS` | both runs, plus the S1 property check red-before/green-after, in `## Log` | verified |
| O9 | S2, S8 (P6) | check 10 keeps the legacy grep labelled *legacy carriers only*, names `phase-lint` and `check-phase-labels` as the lane-era owners, and notes an `S#` hit in a lane-era doc is not a phase label (R5 reproducer) | P6 | P6 | execute-phase | the S2 property check over `skills/audit-docs/SKILL.md` matches 3/3 | the check run (red-before/green-after) in `## Log` | verified |
| O10 | S3, S8 (P6) | the report contract is frozen: 15 checks, no `MEDIUM`, `review-loop-discipline.test.mjs` and `AUDIT_DIMENSIONS.md` unmodified | P6 | P6 | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` exits 0 and `git diff --stat main -- scripts/review-loop-discipline.test.mjs skills/product-audit/references/AUDIT_DIMENSIONS.md` prints nothing | both runs in `## Log` | verified |
| O11 | S1, S8 (P7) | the rewritten check 11 bites both ways: a lane-era unit passes it and a legacy defect is still caught | P7 | P7 | execute-phase | `node scripts/ceremony.mjs docs check-tasks-ticks --slug 103-doc-currency` exits 0 with `valid: true`, and the legacy-defect copy exits 2 with `valid: false` | both outputs pasted verbatim in `## Log` | verified |
| O12 | S8 (P8) | the repository gate is green at the handoff head | P8 | P8 | execute-phase | `node scripts/run-root-suite.mjs` exits 0 | exit code and pass/fail tally in `## Log` | verified |
| O13 | S8 (P9) | the release intent passes both of its gates | P9 | P9 | execute-phase | `node scripts/version-parity-gate.mjs --content` matches `VERDICT: PASS` and `node scripts/lint-changeset.mjs <file>` matches `ok` | both outputs in `## Log` | verified |
| O14 | S7, S8 (P8) | the non-goals hold: check count still 15, no legacy unit rewritten, `unit-lineage`/`audit-pr`/triage catalog untouched | P8 | P8 | execute-phase | `sed -n '/^1\. \*\*Roadmap/,/^15\. \*\*README/p' skills/audit-docs/SKILL.md | grep -cE '^[0-9]+\. '` matches 15 and `git diff --stat main -- scripts/unit-lineage.mjs skills/audit-pr` prints nothing | both runs in `## Log` | verified |

## Findings

OPEN rows only.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the issue, verbatim:
  ```
  fix: audit-docs checks 10-11 and unit-route's scope fallback still read
  retired unit carriers (#398)

  Two machine surfaces still read unit carriers retired by feature 61 and
  feature 79 spec-by-reference, so they cannot judge a current unit and read
  literally assert things that are no longer true.

  audit-docs: TASKS.md, progress.md, in-progress, done
  unit-route.mjs: scope, ## Objective, ## Acceptance criteria, ## Specs, S#,
  scope: trivial, design, plan, tests, review, docs
  ```
- **L2** — 2026-11-04, ledgers re-cut. The first cut of this unit doc carried a
  3-row obligation table (`OBS-398-1..3`) whose `authority-source` cited
  `AGENTS.md` instead of the `S#` requirements, whose `phase` column read `plan`
  instead of `P<n>`, and whose rows were already `verified` at cut time — a
  defective ledger, not a frozen one. The `S1..S8` block above is the frozen
  request, the obligations are `O1..O14` (one phase, one task, one validator
  with its outcome), the planning evidence is `PE-001..PE-016`, and every
  obligation is `planned` at cut. Recorded as a correction of a malformed cut,
  before any status could be claimed.
- **L3** — 2026-11-04, O14's validator corrected at the cut. The cell read
  `rg -c '^[0-9]+\. ' skills/audit-docs/SKILL.md` matches 15, but that pattern
  also counts the report's three process steps (18 today); it now counts the
  checks span alone (`sed -n '/^1\. \*\*Roadmap/,/^15\. \*\*README/p' … |
  grep -cE '^[0-9]+\. '` → 15). Corrected before the row moved off `planned`.

- **P1** — 2026-11-04, the S4 cases written red first: 6 cases over 6 fixtures, observed failing on the base code (59 pass · 2 fail) and again on the trimmed grammar (62 · 2) · 6c7844fe.
- **P2** — 2026-11-04, `unitFacts` reads both accepted shapes through `parseSpecs`; the differential over every unit doc was run for this row · d91ba9a6.
- **P3** — 2026-11-04, the S6 cases tightened to the exact envelope and observed failing (11 pass · 4 fail) · a0787e3c.
- **P4** — 2026-11-04, the three discipline checks answer `n/a` and `check-all` agrees · 488069ec.
- **P5** — 2026-11-04, all four templates carry the `type`/`scope` block and the `## Triaged steps` slot; validated on a throwaway copy before the real tree · b35acb8f.
- **P6** — 2026-11-04, checks 10 and 11 rewritten; the report contract untouched · 54ec9c17.
- **P7** — 2026-11-04, check 11 exercised both ways on real carriers (E13–E17).
- **P8** — 2026-11-04, the repository gate ran green at this head (E18); only this unit doc and its decisions moved afterwards.
- **P9** — 2026-11-04, the changeset intent passes its two gates (E19–E20) · 63483201.
- **E1** — 2026-11-04, base code + the current router suite (`node --test scripts/unit-route.test.mjs` in a `/tmp` copy of `main`) · exit 1 · 59 pass · 2 fail, the failures being `#398 B1` ≥3-`S#` (derived `implement, evidence`).
- **E2** — 2026-11-04, base code + the current ceremony suite, same copy · exit 1 · 11 pass · 2 fail (both `#398 B3` cases).
- **E3** — 2026-11-04, `node --test scripts/unit-route.test.mjs` on the trimmed grammar · exit 1 · 62 pass · 2 fail: emphasis miscounted, fenced quote counted.
- **E4** — 2026-11-04, `node --test scripts/unit-route.test.mjs` after `parseSpecs` · exit 0 · 64 pass · 0 fail.
- **E5** — 2026-11-04, differential `unit-route --triage --json` over all 132 `docs/{features,fix}/*/SPEC.md`, base code vs head, same tree · exit 0 · 18 differ, 114 byte-identical; every differing unit has no `scope:` frontmatter and ≥4 `S#` (4, 4, 6, 6, 9, 9, 9, 10, 10, 10, 11, 13, 14, 14, 15, 16, 20, 26). `103-doc-currency` unchanged.
- **E6** — 2026-11-04, `node --test scripts/ceremony-docs.test.mjs` with the tightened cases · exit 1 · 11 pass · 4 fail.
- **E7** — 2026-11-04, `node --test scripts/ceremony-docs.test.mjs` after the `n/a` answer · exit 0 · 15 pass · 0 fail.
- **E8** — 2026-11-04, `bun test scripts/ceremony*.test.mjs` · exit 0 · 73 pass · 0 fail across 5 files.
- **E9** — 2026-11-04, `bash /tmp/398-prose-check.sh` (S1 6 properties, S2 4, S3 3) before the rewrite · exit 1 · 6 passed · 9 missing.
- **E10** — 2026-11-04, `bash /tmp/398-prose-check.sh` after the rewrite · exit 0 · 15 passed · 0 missing.
- **E11** — 2026-11-04, `SCAFFOLD_PARITY_ROOT=<throwaway copy> node --test scripts/scaffold-parity.test.mjs` and the contract suite inside that copy · exit 0 · 17/17 and 19/19.
- **E12** — 2026-11-04, `bun test scripts/*-parity.test.mjs scripts/unit-doc-contract.test.mjs` in-tree after the template change · exit 0 · 53 pass · 0 fail.
- **E13** — 2026-11-04, `node scripts/ceremony.mjs docs check-tasks-ticks --slug 103-doc-currency` and `… check-progress-entry --slug 103-doc-currency` · exit 0 twice · `{"valid":true,"mismatched":[]}` and `{"valid":true,"missing":[]}`.
- **E14** — 2026-11-04, the same two commands on `32-review-consistency-pack` (legacy) · exit 0 twice · `{"n/a":"no ## Tasks section — legacy carrier"}`.
- **E15** — 2026-11-04, `node scripts/ceremony.mjs docs check-all --slug 32-review-consistency-pack` · exit 0 · `overall: PASS` with the three `n/a` rows (phase-labels, tasks-ticks, progress) and `commit-format`/`docs-language` valid.
- **E16** — 2026-11-04, `node scripts/ceremony.mjs docs check-tasks-ticks --slug 370-pi-150-compat-reverification` · exit 2 · `valid:false`, P1 ticked but not logged — the lane-era branch still catches a real defect.
- **E17** — 2026-11-04, the check-11 legacy branch on a `/tmp` copy of `06-design-feature`: clean `legacy carrier consistent` exit 0; with one box unticked and one phase appended without a progress entry `unticked: P1 …` + `no progress entry: P9` exit 1.
- **E18** — 2026-11-04, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s)`, `verdict: PASS`; `bun scripts/check-skill-context.mjs` · exit 0 · `audit-docs 2730 tokens / 205 lines` (ceilings 2800 / 240).
- **E19** — 2026-11-04, `node --test scripts/review-loop-discipline.test.mjs` · exit 0 · 1 pass; `git diff --stat main -- scripts/review-loop-discipline.test.mjs skills/product-audit/references/AUDIT_DIMENSIONS.md` prints nothing.
- **E20** — 2026-11-04, the template copy in a throwaway tree: `node scripts/phase-lint.mjs docs/features/99-template-cut/SPEC.md` · exit 0 · `verdict PASS`; after pasting its triage block and one contracted obligation row, `node scripts/unit-lineage.mjs --unit 99-template-cut` · exit 0 · `LINEAGE OK — lane-era … obligations closed (1)`.
- **E21** — 2026-11-04, `node scripts/lint-changeset.mjs .changeset/398-retired-carriers.md` · exit 0 · `ok`; `node scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS`.
- **E22** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 1 · 1531 pass · 2 fail, both the same failure: `FAIL context documents: AGENTS.md: estimate 6884 > 6881`. Pre-existing on `main`, not this unit: `AGENTS.md` is byte-identical to `main` (`diff -q` clean), and main's own tree reproduces the same numbers (`node scripts/check-skill-context.mjs --documents` in a `main` copy · exit 1 · same line). It landed with the PR #397 merge `27456e50` (27536 bytes → 6884; the branch head `4afd3a9f` was 27459 → 6865, inside the ceiling). O12 therefore stays open.
- **E23** — 2026-11-04, the non-goal sweep: `sed -n '/^1\. \*\*Roadmap/,/^15\. \*\*README/p' skills/audit-docs/SKILL.md | grep -cE '^[0-9]+\. '` · exit 0 · 15; `git diff --stat main -- scripts/unit-lineage.mjs skills/audit-pr` prints nothing; `git diff --name-only main -- docs/features docs/fix | grep -vE '(_TEMPLATE|398-retired-carriers)'` prints nothing; `git diff --stat main -- scripts/fixtures/catalog` prints nothing.

- **E24** — 2026-11-04, the pre-existing guide-budget overflow repaired: `AGENTS.md` lost the duplicated example `"the project's verification gate"` from the *Stack/architecture agnostic* bullet (27536 → 27501 bytes, outside the machine region, so `machine` stays 92). `node scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 389 lines · 92 machine · 297 prose · estimate 6876` (ceiling 6881). `node --test scripts/check-skill-context.test.mjs scripts/guide-split.test.mjs scripts/normative-drift.test.mjs` · exit 0 · 36/36; `node --test scripts/invocation-drift.test.mjs` · exit 0 · 13/13.
- **E25** — 2026-11-04, `node scripts/run-root-suite.mjs` at this head · exit 0 · 33 suites · 1533 pass · 0 fail (E22's two failures are gone).
## Next

Handoff gate. O1–O14 are `verified` with their evidence in `## Log`; the
repository gate is green at this head (E25). The external verifier's verdict,
then the PR against `main`, is the remaining step — not this unit's to take.

## References

- Issue: [#398](https://github.com/gtrabanco/agentic-workflow/issues/398)
- `skills/audit-docs/SKILL.md:77-105` — the checks block this unit rewrites
- `scripts/unit-route.mjs:589-618` — `unitFacts`, the fallback
- `scripts/unit-doc-phases.mjs:224-273` — `parseSpecs`, the shared `## Specs` grammar
- `scripts/ceremony/docs.mjs` — the three discipline checks and `check-all`
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger contracts
- `scripts/unit-lineage.mjs` — the gate (read, never changed)

## Branch

`fix/398-retired-carriers`

## Depends on

none

## Regression scope

- `node scripts/unit-route.mjs --triage 103-doc-currency` must keep its current
  answer (the pasted triage block of a real unit must not change).
- `node scripts/ceremony.mjs docs check-all --slug 32-review-consistency-pack`
  must answer without pretending the legacy unit has tasks.
- `node --test scripts/review-loop-discipline.test.mjs` must exit 0 unmodified.
- Legacy units (pre-61) with `TASKS.md` and `progress.md` must still be
  auditable: the check 11 legacy branch keeps its original assertions.
