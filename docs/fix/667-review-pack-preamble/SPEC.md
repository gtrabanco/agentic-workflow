---
type: feature
scope: medium
roadmap_summary: the review pack's shared pass preamble has one owner (`FINDER_CONTRACT.md`); the nine passes keep their axis checklist, their inline discipline and their output block, and the probe ladder gates the merge
---

# fix/667-review-pack-preamble

> Feature specification delivered through the fix lane — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
external-verify.md | trimmable
planning-evidence.md | kept
planning-obligations.md | kept
decisions.md | kept
SPEC.md | kept
```

The probe carriers (`probe/`) are this unit's evidence, not process artifacts:
`probe/RUBRIC.md` owns the scoring the two reports apply, `probe/CELLS.md` owns
the cell materialization, and both reports stay with the unit because the merge
verdict is read from them. They are retention-managed like any carrier once the
unit settles.

## Issue

`#667` — tracked issue in the project's forge; the PR closes it via
`Closes #667`. Applied directly under the owner's local workflow: the ledgers in
this folder are the plan, and no lane machinery (`review-change`, `audit-pr`, a
fold cycle) runs over this change.

## Specs

**S1 — Apply issue #667 to this repository.**
> Apply to this repository: issue #667

**S2 — Extend the finder contract into the one owner of the whole shared preamble.**
> - **Extend `skills/review-implementation/references/FINDER_CONTRACT.md`** with
>   the shared preamble it does not yet carry: the checklist-discipline contract
>   (+ tally protocol rationale), and the `review-debt` transform-discipline
>   variant. It already owns `## Scope` + `## Materiality bar`; after this unit
>   it is the one owner of the whole shared preamble.

**S3 — The nine passes delete the duplicated preamble bytes and keep their own axis content.**
> - The nine `SKILL.md` files: duplicated preamble bytes **deleted** (`IR6`),
>   replaced by (a) the one-line scope/materiality pointers naming the owner,
>   imperative and fail-closed ("read … before the checklist; missing reference
>   → STOP"), (b) the **inline** checklist-discipline sentence + tally protocol,
>   each citing the owner as its rule (`IR11` pattern: owner states the
>   contract; the pass binds it into its own output shape), (c) their untouched
>   per-axis checklist, `Return exactly`, `Done when`.

**S4 — The probe ladder runs before and after the change, stored in the unit folder, and the implementing model compares the two reports.**
> The probe runs **before** and **after** the implementation, is stored in the
> **feature folder** (not /tmp), and the two stored reports are compared by the
> implementing model.

**S5 — The deterministic gates stay green with no invented re-pin.**
> - [ ] AC4 — `check-skill-context.mjs` both modes green — re-pin only if a
>   ceiling actually binds (growth source named); `skill-lint` green;
>   `normative-drift` green only if a grammar block lands; root gate green
>   under both runtimes.

**S6 — The golden-fixture smoke runs on the floor model before the PR, and its run-log row is appended.**
> - [ ] AC5 — Golden-fixture smoke per `docs/workflow/GOLDEN_FIXTURE.md`
>   (changed review-* skill, weakest/floor model — qwen3.6) run before the PR
>   and its run-log row appended.

S2–S6 quote the issue body S1 points at; S1 is the instruction itself. The
issue's AC1 and AC2 are restatements of S2 and S3 and are cited, never re-cut as
their own requirements.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- **The nine pass files are the runtime brief of an isolated reviewer.** They are
  consumed as the pass's whole working context (`review-change` §Isolation rule),
  so every byte moved out of a pass changes what the floor model reads. The
  degradation surface is instruction-following, and it is measured by the probe,
  not by a static gate (`probe/RUBRIC.md`).
- **`review-change` and `product-audit` compose the pack** and name it by skill
  name; no composition contract changes. The per-file survivors are named in
  `decisions.md` D4: `review-code`'s ask-don't-infer sentence, `review-verify`'s
  RUNNER pointer and its S5 discoverer→auditor paragraph.
- **`scripts/review-loop-discipline.test.mjs` block 5** pins the materiality bar's
  coordinator phrases *inside each finder*, and the suite is **byte-unchanged**
  (D8): the extraction retires the bar's *rule set* from the finders — it exists
  only at the owner, asserted by this unit's new suite — while the two operative
  phrases stay the pass's own binding, so the pin now matches the pointer instead
  of a body copy. The plan's move of the pin to the owner was not needed and did
  not happen.
- **`docs/workflow/SKILL_CONTEXT_BUDGETS.json`** carries one declared re-basis:
  the nine passes and `FINDER_CONTRACT.md` stay under their own ceilings, but the
  four `review-change:*` route ceilings bind because every route loads the owner,
  so those four rows are re-based to `ceil(measured x 1.10)` with a `sources` row
  naming the growth source (D6, E21).
- **`docs/workflow/GATE_INVENTORY.md`** is untouched unless the carrier map moves;
  no new gate is introduced.
- **`AGENTS.md` `normative-surfaces@1`** is untouched: the new contract text is
  prose, and no versioned grammar block lands (D6).

## Surfaces

- `skills/review-a11y`
- `skills/review-brand`
- `skills/review-code`
- `skills/review-debt`
- `skills/review-design`
- `skills/review-perf`
- `skills/review-security`
- `skills/review-seo`
- `skills/review-verify`
- `skills/review-implementation`
- `scripts`
- `docs`

## Retirements

What this unit retires, each with its replacement:

- **The `## Scope` body copy in eight finders and the `review-debt` scope variant**
  — replaced by one fail-closed pointer line naming the owner
  (`FINDER_CONTRACT.md` §Scope / §Transform discipline). No-consumer evidence:
  `rg -c 'the shape is the finder contract' skills/review-*/SKILL.md` → 0 after
  the change.
- **The `## Materiality bar` body copy in eight finders** — replaced by the same
  pointer shape, owner `FINDER_CONTRACT.md` §Materiality bar.
- **The composition clause in every pass** ("Composed by `review-change` /
  `product-audit` within their conversation — on any agent, follow this file
  inline as the routed step") — moved to `FINDER_CONTRACT.md` §Pass identity; each
  pass keeps the two imperatives it needs (routed step, findings-only) in one
  line that names the owner.
- **The checklist heading's discipline parenthetical in every pass** — replaced
  by the inline checklist-discipline sentence + tally protocol that cites the
  owner (S3(b), AC2). It is a replacement, never a deletion: the probe's
  citation-only cell is the failure this shape precludes.
- **`scripts/review-loop-discipline.test.mjs` block 5's copy-pin** — retired as a
  *body-copy* pin without editing the suite: the pin is byte-unchanged and now
  asserts the pointer's phrases, and the owner's rule-set assertion lands in
  `scripts/review-pack-preamble.test.mjs` instead (D8).

Not retired: the nine axis checklists, every `Return exactly` block, every
`Done when` body, every frontmatter block. Their bytes are unchanged and pinned
by the new suite (O4).

## Non-goals

- No consolidation of the nine passes into fewer skills; no checklist item is
  moved, merged, reworded or renumbered.
- No user-editable review checklists; `review-extras@1` and per-axis
  discoverability stay.
- No change to how `review-change` / `product-audit` compose the pack, and no
  change to `review-implementation`'s classifier, the severity ladder or the
  two-cycle cap.
- No budget re-pin unless a ceiling actually binds (S5); no new gate, no new
  grammar block, no new CLI surface.
- No fix for the probe's own finding that the floor model's tally bookkeeping is
  unreliable (D10) — that is an observation about the model, not a contract
  change this unit may make.

## Risk tier

- **Tier** — `standard` · **Task Size** — `contained`
- **Named high-risk item** — `none — not a high-tier unit`

The change moves the runtime brief of nine isolated reviewers, which is why the
probe ladder (S4) exists; it edits no executable path, so `ceremony tier
classify` reads it as prose plus one suite. The tier is re-derived at the
verification phase (`E` row), never asserted from memory.

## Future

- **Open** — 2026-11-22: the 2026-11-21 probe found the floor model fabricates or
  under-reports its own tally in most cells. A future unit could make the tally
  machine-derivable (count the `n/a` markers the pass emits) instead of asserted.
  Not this unit: it would change the output contract the nine passes share.

## Future cost

- **The pass preamble now has one owner**, so any future change to the scope
  contract, the materiality bar, the checklist discipline or the transform
  variant binds `skills/review-implementation/references/FINDER_CONTRACT.md` and
  reaches nine passes by citation — never by nine edits. It binds whoever edits
  a `review-*` pass next.
- **The nine passes' runtime cost grows by one cross-skill read** when a reviewer
  dereferences the pointer. `check-skill-context.mjs` cannot see it (it measures
  a skill's own `references/` only); the declared cost form is owner bytes × one
  spawned reader per pass, recorded in the unit doc rather than hidden in a
  ceiling (`PE-007`).

## Applicable tests

- `bun test scripts/review-pack-preamble.test.mjs` — the suite this unit adds
  (obligation: the pack's shared preamble has one owner, each pass still carries
  its own discipline and axis content).
- `bun test scripts/review-loop-discipline.test.mjs` — the moved materiality-bar
  pin (O11).
- `bun scripts/check-skill-context.mjs` and `--documents` — the ceilings (S5).
- `node scripts/run-root-suite.mjs` — the root gate under node, the full set.
- `bun scripts/skill-lint.mjs`, `bun test scripts/normative-drift.test.mjs` — S5.

## Known pre-existing issues

- **`review-verify`'s S5 paragraph and RUNNER pointer are per-file survivors** —
  does not affect this unit: they are explicitly kept and pinned (O6).
- **`review-loop-discipline.test.mjs` block 5 forces the materiality copy** —
  affects this unit: the pin is moved in the same commit as the extraction (D8,
  O11), which is a contract move, never a weakening.
- **The floor model's tally incoherence (1/3 coherent in the P1 control)** —
  affects the interpretation of the probe (O8), not the contract: the comparison
  is stated against this same-day control, and a within-count incoherent tally is
  recorded, never smoothed.
- **`scripts/workflow-status-sensor.test.mjs` needs ~196 s on this box while the
  shared suite bound is 120 s** — pre-existing and byte-untouched here (E17); it
  makes `bun scripts/local-gate.mjs` and a default-bound root-suite run red on an
  otherwise green tree. This unit does not calibrate it (D13); the owner decides
  whether the allowlist earns a `suiteTimeoutMs` row of its own.

## Tasks

- P1 — The probe harness materialized under the unit folder with the pre-change control stored (validator: `rg -c 'A-1' docs/fix/667-review-pack-preamble/probe/results-p1-baseline.md` matches 2 — corrected 2026-11-22 by the external-verify batch: the seeded-defect row names A-1 too, and the count was 2 since the cut)
  (Implements: S4)
  - Relevant files: docs/fix/667-review-pack-preamble/probe/runner.mjs, docs/fix/667-review-pack-preamble/probe/fixture.md, docs/fix/667-review-pack-preamble/probe/CELLS.md, docs/fix/667-review-pack-preamble/probe/RUBRIC.md, docs/fix/667-review-pack-preamble/probe/results-p1-baseline.md
- P2 — The contract suite lands alone and is observed red on the missing owner section (validator: `bun test scripts/review-pack-preamble.test.mjs` exits non-zero, observed before P3)
  (Implements: S2, S3)
  - Relevant files: scripts/review-pack-preamble.test.mjs
- P3 — The finder contract owns the whole shared preamble (validator: `bun test scripts/review-pack-preamble.test.mjs` exits 0, the owner cases)
  (Implements: S2)
  - Relevant files: skills/review-implementation/references/FINDER_CONTRACT.md
- P4 — The nine passes carry the fail-closed pointers and the inline discipline (validator: `bun test scripts/review-pack-preamble.test.mjs` exits 0 and `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S3)
  - Relevant files: skills/review-a11y/SKILL.md, skills/review-brand/SKILL.md, skills/review-code/SKILL.md, skills/review-debt/SKILL.md, skills/review-design/SKILL.md, skills/review-perf/SKILL.md, skills/review-security/SKILL.md, skills/review-seo/SKILL.md, skills/review-verify/SKILL.md, scripts/review-loop-discipline.test.mjs
- P5 — The post-change probe and the comparison verdict are stored (validator: `rg -c 'Verdict: neutral|Verdict: surpasses' docs/fix/667-review-pack-preamble/probe/results-p4-comparison.md` matches 1)
  (Implements: S4)
  - Relevant files: docs/fix/667-review-pack-preamble/probe/results-p3-post-change.md, docs/fix/667-review-pack-preamble/probe/results-p4-comparison.md
- P6 — The repository state surfaces carry the change (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S6)
  - Relevant files: docs/ROADMAP.md, docs/workflow/GOLDEN_FIXTURE.md, docs/generated/, docs/LOGS.md
- P7 — The deterministic gate runs at the head (validator: `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S1, S5, S6)
  - Relevant files: docs/fix/667-review-pack-preamble/SPEC.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

The ledger is `planning-evidence.md` in this folder (M unit).

### Obligations

The ledger is `planning-obligations.md` in this folder (M unit).

## Acceptance criteria

- **AC-S1 ✓** — The issue's own AC1–AC5 are each satisfied and evidenced: the
  contract owns the preamble, the passes were rewritten, the probe ladder ran
  and its verdict admits the merge, every declared gate is green, and the
  golden-fixture row is appended. Proved by: the `E` rows this document carries,
  each naming a command and its observed outcome, plus
  `bun test scripts/review-pack-preamble.test.mjs` exits 0.
- **AC-S2 ✓** — `FINDER_CONTRACT.md` is the single owner of the shared preamble: it
  carries `## Scope`, `## Materiality bar`, `## Checklist discipline` (with the
  tally protocol and its rationale), `## Transform discipline` (the
  `review-debt` variant) and `## Pass identity`, and it names the nine passes it
  binds. Proved by: the owner cases in
  `bun test scripts/review-pack-preamble.test.mjs` exits 0.
- **AC-S3 ✓** — Every one of the nine passes (a) carries a scope pointer and a
  materiality pointer that name the owner, are imperative and stop on a missing
  reference — except `review-debt`, which points at `## Transform discipline` for
  its scope and carries no materiality pointer (it transforms, never pads a
  checklist) — (b) carries the checklist-discipline sentence and its tally
  protocol **inline**, citing the owner, and (c) keeps its axis checklist byte
  for byte, its `Return exactly` block and its `Done when` body. Proved by: the
  pass cases in `bun test scripts/review-pack-preamble.test.mjs` exits 0, which
  compare each checklist body against its pre-change md5.
- **AC-S4 ✓** — Both probe reports exist in `probe/` and the comparison report
  states one verdict from `{surpasses, neutral, degrades}` computed from the two
  stored reports and the same-day control; a `degrades` verdict blocks the merge.
  Proved by: `rg -c 'Verdict: (neutral|surpasses)' docs/fix/667-review-pack-preamble/probe/results-p4-comparison.md`
  matches 1.
- **AC-S5 ✓ (with the suite-bound disclosure of D13)** — `bun scripts/check-skill-context.mjs`, its `--routes` mode and its `--documents` mode
  exit 0, with the one declared re-pin the bound route ceilings required (the
  four `review-change:*` rows, each naming its growth source); `bun scripts/skill-lint.mjs` exits 0; `bun test
  scripts/normative-drift.test.mjs` exits 0; `node scripts/run-root-suite.mjs`
  and `bun scripts/run-root-suite.mjs` both exit 0. Proved by: those six
  commands' `E` rows.
- **AC-S6 ✓** — The floor-model smoke ran against the changed `review-code` pass
  with `nan/qwen3.6` and its row is appended to `docs/workflow/GOLDEN_FIXTURE.md`.
  Proved by: `rg -c '667' docs/workflow/GOLDEN_FIXTURE.md` matches 1.

## Triaged steps

```
STEPS — 667 (feature, applied directly under the owner's local workflow)
Steps: probe, tests, implement, probe-compare, docs, verify
Skipped: research (the issue carries its own measured evidence), design (the
owner resolved both design questions; decisions.md D1–D10), review, release
(no package surface changes)
```

The user's workflow substitutes these ledgers for the lane's plan step; the
issue's own phase ladder (P1 baseline probe → P2 implementation → P3 post-change
probe → P4 comparison) is preserved, with the cut split into the red-first test
commit (P2) and the implementation commit (P3/P4).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-22, the request, verbatim: `Apply to this repository: issue #667` — resolved against [issue #667](https://github.com/gtrabanco/agentic-workflow/issues/667). Its normative sections are quoted verbatim under `## Specs` (S2–S6) instead of being re-pasted here; the issue body stays the source of record.
- **P1** — 2026-11-22, the probe harness (`runner.mjs`, `fixture.md`, `preamble-simulated.md`, `CELLS.md`, `RUBRIC.md`) and the P1 control stored · ab2fcf88d.
- **E1** — 2026-11-22, `bun docs/fix/667-review-pack-preamble/probe/runner.mjs --cell A --reps 3` · exit 0 · 3/3 complete, recall 9·8·9 of 11, decoys 0/3, tally coherent 1/3 (A-2 fabricated `20 evaluated`, A-3 undercounted 13 of 19).
- **P2** — 2026-11-22, the contract suite alone, observed red · 2c3d12dee.
- **E2** — 2026-11-22, `bun test scripts/review-pack-preamble.test.mjs` at 2c3d12dee · exit 1 · RED: `FINDER_CONTRACT.md: carries ## Pass identity` (the owner had no preamble sections).
- **D1–D10** — 2026-11-22, the design decisions, recorded in `decisions.md` at the cut: the owner is the existing finder contract (D1), the discipline stays inline and cites it (D2), the inline protocol lands under the checklist heading with `Done when` untouched (D3), the four header variants and their per-file survivors (D4), the identity split (D5), no budget re-pin and no grammar block (D6), the probe cells measure this tree and the comparison keys on fabrication (D7), the materiality pin survives byte-unchanged (D8), the new suite's obligation and justification (D9), the floor model's tally incoherence is an observation (D10).
- **P3** — 2026-11-22, the finder contract owns the whole preamble · cf2fa4fbb.
- **P4** — 2026-11-22, the nine passes cite the owner and keep the discipline inline; the suite's one post-red assertion narrowed to the transform variant's imperative, with its path-protection record in `decisions.md` · 64ef2de2a.
- **E3** — 2026-11-22, `bun test scripts/review-pack-preamble.test.mjs` · exit 0 · `PASS review-pack-preamble: one owner for the shared preamble, discipline inline in all nine passes`.
- **E4** — 2026-11-22, `bun test scripts/review-loop-discipline.test.mjs` · exit 0 · 0 fail — the materiality pin is byte-unchanged, so the extraction moved no gate (D8).
- **E5** — 2026-11-22, `bun test scripts/vocabulary-parity.test.mjs` · exit 0 · 35 pass / 0 fail (every finder still publishes the ladder, the impact set and the `CLASSIFY.md` citation).
- **E6** — 2026-11-22, `bun scripts/skill-lint.mjs` · exit 0 · 108 files, 7 checks, 0 findings.
- **E7** — 2026-11-22, `bun scripts/check-skill-context.mjs` · exit 0 · PASS 30 skills (the nine passes 861–1774 est, all under the 2 800 flat default; the owner 867 est, under the 2 200 reference default); `--documents` · exit 0 · PASS 7 budgeted documents. No re-pin.
- **E8** — 2026-11-22, `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass / 0 fail — no grammar block landed.
- **P5** — 2026-11-22, the post-change probe and the comparison report stored · the verdict is `neutral`.
- **E9** — 2026-11-22, `bun docs/fix/667-review-pack-preamble/probe/runner.mjs --cell B+ --reps 3` and `--cell B- --reps 3` · exit 0 · 6/6 complete, 0 fabricated tallies, 0 decoy rows, recall 8.0 (`B+`) and 8.67 (`B−`) against the control's 8.67.
- **E10** — 2026-11-22, `rg -c 'Verdict: (neutral|surpasses)' docs/fix/667-review-pack-preamble/probe/results-p4-comparison.md` · exit 0 · 1 (`Verdict: neutral`).
- **P6** — 2026-11-22, repository state: the feature row and the fix row written through the roadmap CLI, the projection re-rendered, the golden-fixture row appended, the changeset added.
- **E11** — 2026-11-22, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap docs/ROADMAP.md rowUpsert …` · exit 0 · receipt pass (`fb819ce7` → `fe931713`); `roadmap docs/ROADMAP.md fixrow …` · exit 0 · receipt pass (`8c16ef00` → `301f5092`, topic corrected to the folder slug so the settle gate reads one identity).
- **E12** — 2026-11-22, `bun scripts/docs-generate.mjs` · exit 0 · 262 units / 178 roadmap rows / 30 skills, 1 file written; `--check` · exit 0 · 3 checked, 0 stale.
- **E13** — 2026-11-22, `bun test scripts/roadmap-settle.test.mjs` · exit 0 · 10 pass / 0 fail (the live-tree case caught the fix row's slug mismatch before it shipped).
- **E14** — 2026-11-22, `bun scripts/local-gate.mjs --only version-parity-content` · exit 1 first (`GATE REJECTION — shipped-content-version`: 10 changed files under `skills/`, version unchanged), then exit 0 · PASS after `.changeset/667-review-pack-preamble.md`; `bun test scripts/lint-changeset.test.mjs` · exit 0 · 17 pass.
- **E15** — 2026-11-22, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/667-review-pack-preamble/SPEC.md` · exit 0 · PASS 6/6 on P1–P7.
- **E16** — 2026-11-22, `runner dimension-regression --base 55525abad` (this checkout launches the same command as `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --base 55525abad`) · exit 1 · `finding — missing-reverification-evidence · the range touches 10 review surface(s)`.
- **E17** — 2026-11-22, the differential: the nine passes' `check-skill-context` cells at `55525abad` versus the head — 784→858, 792→874, 1 700→1 774, 983→1 055, 795→869, 1 068→1 142, 874→948, 787→861, 1 269→1 343 est (+72…+82 each, +672 total) and no other skill's cell moved; `git diff --stat 55525abad -- scripts/workflow-status-sensor.test.mjs scripts/phase-lint.test.mjs packages/agentic-workflow/src/runner/` is empty.
- **E18** — 2026-11-22, `node scripts/run-root-suite.mjs` · exit 1 on the wire record: 137 of 138 suites PASS; `scripts/workflow-status-sensor.test.mjs` hits the 120 s suite bound (it measured 107.2 s PASS in an earlier run of the same tree, 93 s standalone under bun, and both it and `phase-lint.test.mjs` are byte-untouched by this unit — E17). `--jobs 1` reproduces the same single bound and `phase-lint.test.mjs` then passes; the bound is the box, never this change.
- **E19** — 2026-11-22, `runner dimension-regression --base 55525abad` re-run after E16 was recorded · exit 0 · `evidence | docs/fix/667-review-pack-preamble/SPEC.md` · `verdict | clean` (base 20 dimensions, head 20, 10 changed review surfaces).
- **E21** — 2026-11-22, `bun scripts/check-skill-context.mjs --routes` · exit 1 first · `review-change:adversarial: route estimate ceiling 27119 < 27856 = ceil(measured x 1.10) 25323` plus the three sibling routes; after the declared re-basis (four rows in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, each carrying its `sources` growth row) · exit 0 · `PASS route budgets: 14 routes`, with `check-skill-context.mjs` PASS 30 skills and `--documents` PASS 7 documents.
- **D12** — 2026-11-22, the route re-basis E21 forced: the bound ceilings are the four `review-change:*` routes, never the per-skill budgets; the re-pin follows the file's own arithmetic (`ceil(measured x 1.10)`) and names `issue #667 (review-pack preamble extraction)` as its growth source. S5 permits a re-pin exactly when a ceiling binds, and this one did — the first claim of "no re-pin needed" was wrong and is superseded here, not edited away.
- **E20** — 2026-11-22, `rg -c 'Not findings: comment/punctuation typos' skills/review-*/SKILL.md` · exit 1 · no matches (the bar's rule set exists only at the owner); `rg -c 'An empty table with `Decision: PASS` is the expected result' skills/review-*/SKILL.md` · exit 1 · no matches; `rg -c 'review-debt' skills/review-implementation/references/FINDER_CONTRACT.md` · exit 0 · 5.
- **D11** — 2026-11-22, the O4 amendment: the cut validator expected `never pad the table` to be gone from the finders' pointers, but that phrase is the pass's own binding and the reason `review-loop-discipline` survives byte-unchanged (D8). The row now checks what actually moved — the bar's rule set (`Not findings: …`, the closing `An empty table …` sentence) is absent from every finder and present only at the owner. No obligation was dropped, only its measurement corrected; the same batch records O16 as still open.
- **E22** — 2026-11-22, `node scripts/run-root-suite.mjs --suite-timeout 300` at head `03f656109` · exit 0 · 138 of 138 suites PASS.
- **E23** — 2026-11-22, `bun scripts/run-root-suite.mjs --suite-timeout 300` at head `03f656109` · exit 0 · 138 of 138 suites PASS.
- **D13** — 2026-11-22, the suite-bound disclosure: both legs ran with the gate's own `--suite-timeout 300` because `scripts/workflow-status-sensor.test.mjs` needs 196 s on this box (81/81 pass standalone under node) against a 120 s shared bound. The repository's default bound is untouched and no allowlist row was added — calibrating it is a cost decision for the owner, never a side effect of this unit — so the raised bound is named in the evidence rows instead of being implied by a green line.
- **D14** — 2026-11-22, `probe/preamble-simulated.md` deleted: it was the 2026-11-21 harness's simulated preamble, whose original lives in the issue body (one owner). Nothing in this harness ever read it — only the P1 log line cited it — so a copy in the tree was a duplicate, not evidence. The P1 report and the raw runs stay.
- **D15** — 2026-11-22, the journal correction: the first push answered `local-gate: FAILED at log-immutability`. The session had run `journal aggregate` locally, which the repository forbids — the journal has exactly one legal writer, the merge-to-main aggregator bot, so a local checkout lands a fragment and never touches `docs/LOGS.md`. Nothing was published (the hook refused the push), so the branch was rebuilt from `64ef2de2a` locally: `docs/LOGS.md` restored byte-identical to `55525abad`, the nine pending fragments restored byte-identical, and this session's entry landed as its own fragment. Local backup of the aggregated shape: branch `backup/667-aggregated` (`1a07d1afb`).
- **P7** — 2026-11-22, verification: the gate under both runtimes, the three checker modes, the lint, drift, projection and dimension-regression gates, all recorded as `E` rows.

## Next

`## Findings` stays empty until a review persists a row; the unit closes on the
owner's external verify.

## References

- Issue [#667](https://github.com/gtrabanco/agentic-workflow/issues/667) — the
  request and the probe's reproduction contract.
- Issue [#663](https://github.com/gtrabanco/agentic-workflow/issues/663) — the
  skill-surface interview that produced the extraction.
- `dde937a32` — the first extraction wave that moved `## Scope` +
  `## Materiality bar` to `FINDER_CONTRACT.md`.
- `docs/audits/1-2026-11-08.md` — the audit that recorded that extraction.

## Branch

`feat/667-review-pack-preamble`

## Depends on

None.

## Regression scope

| Scenario | Verified by |
|---|---|
| Every finder still publishes the ladder, the impact set and the `CLASSIFY.md` citation in its findings table | `bun test scripts/vocabulary-parity.test.mjs` exits 0 |
| The materiality bar is still reachable and binding for every finder | `bun test scripts/review-loop-discipline.test.mjs` exits 0 (the moved pin) |
| `review-change`'s composition contract and `review-verify`'s per-file survivors are intact | the pass cases in `bun test scripts/review-pack-preamble.test.mjs` exit 0 |
| Every skill's frontmatter, description budget and the per-skill context budgets unchanged | `bun scripts/check-skill-context.mjs` exits 0; the four re-based `review-change:*` route rows are the only budget cells that moved, each with its `sources` row (E21) |
| No stale projection after the docs edits | `bun scripts/docs-generate.mjs --check` exits 0 |
