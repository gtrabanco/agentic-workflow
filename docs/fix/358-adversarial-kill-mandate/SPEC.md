# fix/358-adversarial-kill-mandate

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape from `docs/fix/_TEMPLATE/SPEC.md`. The request is issue #358 (its summary,
> proposed fix, non-goals and acceptance criteria quoted verbatim in `## Specs`
> and `L1`); the planning ledgers are frozen as the sibling
> `planning-evidence.md` / `planning-obligations.md` (M sizing) and this
> document's sections name them instead of embedding them.
>
> Applied as a **local, unpublished** change (the workflow changing its own
> surgery): no `review-change`, no `audit-pr`, no fold cycle runs on this unit.
> The deterministic gates do — always.

## Issue

`#358` — adversarial review reframed as kill-mandate with diff-only reflector.
The PR must close it with `Closes #358`. Roadmap row 95
(`adversarial-kill-mandate`) is this unit's registry entry, and the delivered
unit is registered in `docs/ROADMAP.md`'s `## Fixes` table.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim. `S1`–`S7` are
the issue's *Proposed fix* and *Non-goals*; `S8`–`S12` are its *Acceptance
criteria*, in the issue's order. `L1` in `## Log` carries the whole body.

**S1 — Kill-mandate reframing: `kill | confirm` with falsifying or supporting
evidence, anti-invention from cycle 1.**
> **Kill-mandate reframing**: for each existing finding, the adversarial pass returns `kill | confirm` with falsifying or supporting evidence. New findings require new falsifying evidence (anti-invention rule applies from cycle 1 of the pass, not just across cycles).

**S2 — Diff-only reflector as the final precision filter.**
> **Diff-only reflector** as the final precision filter: sees only the diff + the finding claim (no exploration transcript, no tool notes); returns keep/drop per finding with a reason.

**S3 — CIVER stability check: misattribution is re-scoped before persisting.**
> **Stability check** (CIVER): a reproducer that also fires on untouched adjacent code ⇒ misattribution ⇒ the finding is re-scoped before persisting, never persisted as-is.

**S4 — Cross-model-family resolves through #201, linked and not built here.**
> **Cross-model-family option** for adversarial passes resolves through #201's `passes` config — linked, not built here.

**S5 — Non-goal: neither the merge gate nor the two-cycle cap changes.**
> - No change to the merge gate (`audit-pr`) or the two-cycle cap.

**S6 — Non-goal: no recall-side machinery; the FN risk is stated.**
> - No recall-side machinery: kill mandates optimize precision; the operator owns rescued findings (the paper's documented FN risk is accepted and stated in the report).

**S7 — Non-goal: no new skill or menu entry — contract wording plus conductor
wiring.**
> - No new skill or menu entry — this is `review-change`/`ADVERSARIAL_SETUP.md` contract wording plus conductor wiring where applicable.

**S8 — Fixture: a weak finding killed, a real finding confirmed.**
> - [ ] Fixture: a weak finding killed by the adversarial pass with falsifying evidence, and a real finding confirmed.

**S9 — Fixture: the diff-only reflector drops a hallucinated comment.**
> - [ ] Fixture: the diff-only reflector drops a hallucinated comment it cannot ground in the diff.

**S10 — Fixture: an unstable reproducer is re-scoped, never persisted as-is.**
> - [ ] Fixture: an unstable reproducer (fires on unrelated adjacent code) → finding re-scoped, not persisted as-is.

**S11 — Token delta vs the current additive run, recorded as evidence.**
> - [ ] Token delta vs the current additive adversarial run recorded as evidence (the papers' 5–15× claim is theirs, ours is measured).

**S12 — Gates green and a changeset ships.**
> - [ ] `check-skill-context` green; root suites green; changeset per repo rule.

### Assumptions (marked, never silently inferred)

- **A1 (from S11)** — "ours is measured" is read as *measurable by this
  repository deterministically*: the reviewed route's context cost
  (`scripts/check-skill-context.mjs --routes`, est = bytes/4) before and after,
  plus the two contract payloads' byte cost. A live model-token delta needs a
  real multi-model adversarial run, which no committed gate can reproduce; the
  unit records the measurable channel and states the limit in the same
  `## Log` `E` line rather than claiming a number it cannot re-derive.
- **A2 (from S1, S2)** — "conductor wiring" (S7) means a deterministic checker
  the conductor calls, not a new skill: the verdicts a reviewer returns are
  grammar, so the repository's existing pattern (`normative-surfaces@1` +
  a sibling suite) applies, and the conductor's only added step is one command.

The grammar the machine reads (`spec-requirement@1`) — one `**S# — title.**` line
per requirement followed by the requester's `>` words.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- **The adversarial route's wording is what changes behaviour, so its three
  references move together.** `ADVERSARIAL_SETUP.md` gains the kill-mandate,
  reflector and stability contracts with the `adversarial-verdict@1` grammar;
  `ADVERSARIAL_SYNTHESIS.md` states what fusion does with a verdict (it fuses
  the surviving rows, and a `kill`/`drop` is a recorded, reported verdict — the
  "never drop a finding while synthesizing" rule is not weakened, because the
  verdict is produced *before* fusion and carries its own evidence).
  `REVIEW_PROCESS.md` stays untouched: its step 6 already verifies every
  candidate before synthesis (`confirmed`/`refuted`, PE-003) and the kill
  mandate formalizes that existing step inside the two adversarial references
  rather than adding a competing one — so the always-loaded process (and every
  non-adversarial route) pays nothing.
- **`review-change/SKILL.md`** gains one route-table line and one turn-contract
  line — the conductor must know the pass ends in a verdict record, not in a
  findings table alone. Main-skill budget headroom is 271 est / 9 lines, so the
  addition is two sentences or it re-bases with a declared reason.
- **A published vocabulary, not prose-only.** The three closed sets live in
  `packages/agentic-workflow-schema/src/vocabularies.ts` (the canonical home,
  unit 84/D2) and are pinned by `scripts/vocabulary-parity.test.mjs` against the
  `adversarial-verdict@1` block; the block itself is a normative surface in
  `AGENTS.md`'s `normative-surfaces@1`, so `scripts/normative-drift.test.mjs`
  refuses a token the machine does not publish. That is a schema-package change
  (minor bump via changeset) and it needs the package rebuilt to be tested.
- **New deterministic checker `scripts/adversarial-verdict.mjs`** with its
  sibling suite (`scripts/structural-sibling-pins.test.mjs` requires the pair;
  `scripts/red-first.mjs` requires the suite's commit to precede the
  implementation's). It validates a pass record against the published sets and
  emits the persistable rows, so S8–S10 are fixtures with an executable
  expectation instead of prose.
- **Readers of the route context** — `scripts/check-skill-context.mjs`
  (`review-change:adversarial`, `review-change:default-*`,
  `review-change:synthesize` and the `review-change` skill budget) and
  `scripts/skill-lint.mjs` (structure only). The default route loads
  `ADVERSARIAL_RECOMMENDATION.md`, which is untouched, so the default and
  synthesize routes pay nothing for this change.
- **Not touched:** `scripts/audit-pr-gate.mjs`, `scripts/review-receipt.mjs`,
  `skills/audit-pr/`, the two-cycle cap sentences, `REVIEW_PROCESS.md`'s
  delta-mode/escalation rules, `skills/fold-findings/`, and the `--synthesize`
  paste contract. Any of those moving would be S5's scope violation.
- **`README.md`** describes `--adversarial N` in one paragraph; its sentence
  about "merged by `file:line` at an inclusion threshold of ≥1" stays true and
  gains no second copy of this contract (documentation currency is a pointer,
  never a restatement — `audit-docs` check 15).

## Retirements

Nothing is retired: this change *adds* a verdict layer to an opt-in mode. The
additive finder pass stays the default; the `≥1` inclusion threshold, the
`file:line`-plus-axis dedupe and the "never drop, downgrade or reclassify while
synthesizing" rule all survive because the kill/reflector verdicts are produced
*before* fusion, each carrying its own evidence (a `kill` without falsifying
evidence is refused by the checker, not silently honoured).

`rg -c 'never.*downgrad' skills/review-change/references/ADVERSARIAL_SYNTHESIS.md`
→ 1 before and after: the rule is preserved verbatim and gains a sentence saying
which step owns the decision it forbids fusion to make.

## Non-goals

- No change to `audit-pr`, its receipt or the two-cycle cap (S5) — the mode stays
  opt-in and the loop bound is untouched.
- No recall-side rescue machinery (S6): a killed finding is reported with its
  falsifying evidence and the report states the false-negative risk, so the
  operator can override; no auto-resurrection, no scoring, no second pass.
- No new skill, no menu entry, no new review axis (S7).
- No `passes` config or `resolve-passes` (S4) — that is row 45 / issue #201, and
  this unit links it in one sentence.
- No change to the default (non-adversarial) review route beyond step 6's
  wording: a single-reviewer review that never ran an adversarial pass produces
  no verdict record.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood · contained · resumable from
  diff, ceremony `unit-doc`, verification `gates`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict copied verbatim from `bun scripts/ceremony.mjs tier classify --paths
<the 24 changed paths>` at close:

```text
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "15 path(s) carry executable content: docs/workflow/SKILL_CONTEXT_BUDGETS.json, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/src/vocabularies.ts, …",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": []
}
```

## Future

none

## Future cost

- **Every future adversarial-pass change re-runs one command.** A change to the
  pass's wording that adds or renames a verdict token must move the schema const,
  the `adversarial-verdict@1` block and the parity pin in one PR — enforced by
  `scripts/vocabulary-parity.test.mjs`. It binds `review-change`'s authoring.
- **The checker's record shape is a contract.** `scripts/adversarial-verdict.mjs`
  is the machine that accepts a pass's verdicts; widening it (a new verdict, a
  new reflector field) is a grammar change with a new fixture, never a relaxed
  assertion. It binds any future conductor.

## Applicable tests

`scripts/adversarial-verdict.test.mjs` (the new pair's suite),
`scripts/vocabulary-parity.test.mjs` (the second copies),
`scripts/normative-drift.test.mjs` (the new surface), `scripts/red-first.mjs`
(the pair's commit order), plus the root gate and the schema package's suite.

## Known pre-existing issues

- `review-change`'s main skill sits at 3,186 of a 3,457 est ceiling (271 est, 9
  lines of headroom) — **affects this unit**: the two added sentences must fit or
  the ceiling re-bases with its recorded reason.
- The `review-change:adversarial` route measures 21,955 of 24,151 est (2,196 est,
  153 lines of headroom) — **affects this unit** for the same reason.
- `scripts/red-first.mjs` reads git history only, so a suite committed together
  with its implementation fails this unit's own gate — **affects this unit**:
  the pair lands as two commits in that order.
- The `docs/fix/_TEMPLATE/SPEC.md` `## Risk tier` block wants the classifier's
  verdict, and the classifier reads changed paths including ignored build output
  in a worktree — **does not affect** the unit: the verdict is taken over the
  unit's declared paths (`--paths`) at close.
- `bun scripts/check-skill-context.mjs --documents` is **already red at the base
  commit** `c8b64d0b` (`AGENTS.md: estimate 6884 > 6881` — three estimate units
  over the ceiling the #383 re-base left) — **affects this unit**: the four
  inventory rows re-base `AGENTS.md` anyway, so this unit's re-base covers both
  the pre-existing 3 units and its own growth, and the differential run in `E13`
  records the base's red line beside the head's PASS.

## Tasks

- [x] P1 — Freeze the unit doc and its sibling ledgers; register the unit in the
  roadmap and add the changeset (validator: `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S7, S12)
  Relevant files: docs/fix/358-adversarial-kill-mandate, docs/ROADMAP.md, .changeset
- [x] P2 — Land the RED suite and its fixtures: the three acceptance fixtures plus
  the anti-invention, transcript-leak and evidence-kind cases, all failing on the
  missing module (validator: `bun test scripts/adversarial-verdict.test.mjs` exits 1 before P3)
  (Implements: S8, S9, S10)
  Relevant files: scripts/adversarial-verdict.test.mjs, scripts/fixtures/adversarial-verdict
- [x] P3 — Implement the deterministic checker `scripts/adversarial-verdict.mjs`
  (validator: `bun test scripts/adversarial-verdict.test.mjs` exits 0)
  (Implements: S1, S2, S3, S8, S9, S10)
  Relevant files: scripts/adversarial-verdict.mjs
- P4 — Publish the three closed sets in the schema package and pin the block to
  them (validator: `bun test scripts/vocabulary-parity.test.mjs` exits 0 and its
  three new cases assert the published tokens)
  (Implements: S1, S2, S3)
  Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, scripts/vocabulary-parity.test.mjs
- P5 — Declare the new grammar surface in `AGENTS.md` and make the drift gate
  resolve it (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S2, S3, S7)
  Relevant files: AGENTS.md, skills/review-change/references/ADVERSARIAL_SETUP.md
- P6 — Write the verdict-layer contract into the two mode references and state
  the mechanism in the README's review-change row
  (validator: `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S6, S7)
  Relevant files: skills/review-change/references/ADVERSARIAL_SETUP.md
- P7 — Record the token-delta measurement as `E` lines in `## Log`
  (validator: `bun scripts/check-skill-context.mjs --routes` exits 0 and its
  `review-change:adversarial` row is recorded before and after, with the delta,
  in `## Log` `E10`)
  (Implements: S11)
  Relevant files: docs/fix/358-adversarial-kill-mandate/SPEC.md
- P8 — Run the whole verification block and close the obligations ledger
  (validator: `bun scripts/run-root-suite.mjs` exits 0 with `fail 0`, and
  `(cd packages/agentic-workflow-schema && bun run test)` exits 0)
  (Implements: S5, S6, S7, S12)
  Relevant files: docs/fix/358-adversarial-kill-mandate/planning-obligations.md

### Planning evidence

Frozen as the sibling `planning-evidence.md` (M sizing) — not embedded.

### Obligations

Frozen as the sibling `planning-obligations.md` (M sizing) — not embedded.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the issue, verbatim:
  ```
  ## Summary

  `review-change --adversarial N` spawns isolated reviewers whose default output is *more findings*. Three 2026 papers converge on a different shape:

  - **arXiv [2604.19049](https://arxiv.org/abs/2604.19049)** (Refute-or-Promote): reviewers given **kill mandates** (attempt to *disprove* each candidate) with context asymmetry killed **79–83% of false positives**; same-family unanimity is a warning sign in both directions (documented FP and FN cases; the FN case was recovered only by human override).
  - **arXiv [2608.09290](https://arxiv.org/abs/2608.09290)** (OpenCodeReview): an **independent reflector that sees only the diff** — not the explorer's tool transcript — removed hallucinated comments without self-reinforcing bias; same model, **2.17× SEM-F1 vs Claude Code at 5–15× fewer tokens**.
  - **arXiv [2610.36010](https://arxiv.org/abs/2610.36010)** (CIVER): a finding is genuine iff a **targeted repair resolves it and the review stays stable under unrelated changes** (77% genuine-defect identification on SWE-Review-Bench).

  This composes with the repo's own direction (falsification-first charter, #270; anti-invention rule, feature 50; clean-context receipts): the adversarial pass should *verify* claims, not enumerate possibilities.

  ## Proposed fix

  1. **Kill-mandate reframing**: for each existing finding, the adversarial pass returns `kill | confirm` with falsifying or supporting evidence. New findings require new falsifying evidence (anti-invention rule applies from cycle 1 of the pass, not just across cycles).
  2. **Diff-only reflector** as the final precision filter: sees only the diff + the finding claim (no exploration transcript, no tool notes); returns keep/drop per finding with a reason.
  3. **Stability check** (CIVER): a reproducer that also fires on untouched adjacent code ⇒ misattribution ⇒ the finding is re-scoped before persisting, never persisted as-is.
  4. **Cross-model-family option** for adversarial passes resolves through #201's `passes` config — linked, not built here.

  ## Non-goals

  - No change to the merge gate (`audit-pr`) or the two-cycle cap.
  - No recall-side machinery: kill mandates optimize precision; the operator owns rescued findings (the paper's documented FN risk is accepted and stated in the report).
  - No new skill or menu entry — this is `review-change`/`ADVERSARIAL_SETUP.md` contract wording plus conductor wiring where applicable.

  ## Acceptance criteria

  - [ ] Fixture: a weak finding killed by the adversarial pass with falsifying evidence, and a real finding confirmed.
  - [ ] Fixture: the diff-only reflector drops a hallucinated comment it cannot ground in the diff.
  - [ ] Fixture: an unstable reproducer (fires on unrelated adjacent code) → finding re-scoped, not persisted as-is.
  - [ ] Token delta vs the current additive adversarial run recorded as evidence (the papers' 5–15× claim is theirs, ours is measured).
  - [ ] `check-skill-context` green; root suites green; changeset per repo rule.

  ---

  *Automated written using AI.*
  ```

- **D1** — 2026-11-04, owner decision (this cut): the ledger's O9 and O14
  validators were written as repo-wide word bans (`resurrect`, `passes:`) and
  would have failed on the sentence that *states* the absence of the mechanism
  plus three pre-existing unrelated hits. Both cells were narrowed at cut to
  what the requirement actually forbids — O9 to the changed-file set of the code
  trees, O14 to `resolve-passes` — before any of them was run. Recorded here
  because a corrected validator that is not disclosed reads like one that always
  passed.
- **P1** — 2026-11-04, the unit doc, both ledgers, the roadmap registration and
  the changeset · `0fe253dd` (415 added, 1 deleted).
- **E1** — 2026-11-04, `bun test scripts/adversarial-verdict.test.mjs` · exit 1 ·
  red: `Cannot find module './adversarial-verdict.mjs'` (the suite landing before
  the implementation) · commit `09bcc9b7`.
- **P2** — 2026-11-04, the RED suite plus seven fixtures (three acceptance
  scenarios and the anti-invention, reflector-leak, evidence-kind and CLI cases)
  · `09bcc9b7` (439 added).
- **P3** — 2026-11-04, the three published sets and the checker ·
  `9a1de734` (329 added).
- **E2** — 2026-11-04, `bun test scripts/adversarial-verdict.test.mjs` · exit 0 ·
  `11 pass / 0 fail`.
- **E3** — 2026-11-04, `bun scripts/adversarial-verdict.mjs --record
  scripts/fixtures/adversarial-verdict/record-kill-confirm.json --diff
  scripts/fixtures/adversarial-verdict/diff-kill-confirm.patch` · exit 0 ·
  `tally: 2 persist · 1 killed · 0 dropped · 0 violation(s)` / `verdict: PASS`.
- **E4** — 2026-11-04, the same command on `record-hallucination-kept.json` ·
  exit 1 · `VIOLATION ungrounded-keep F1 — no hunk of this diff changes
  skills/review-change/SKILL.md:88, so the reflector cannot ground the claim and
  must drop it`.
- **E5** — 2026-11-04, `bun test scripts/vocabulary-parity.test.mjs` · exit 0 ·
  `20 pass / 0 fail`, including the three new `#358` cases (the block binds both
  directions and the checker reads the published consts, not a local list).
- **E6** — 2026-11-04, `bun test scripts/normative-drift.test.mjs` · exit 0 ·
  `21 pass / 0 fail` — the four new inventory rows resolve with no edit to the
  gate.
- **E7** — 2026-11-04, `(cd packages/agentic-workflow-schema && bun run test)` ·
  exit 0 · `732 pass / 0 fail`.
- **E8** — 2026-11-04, `bun scripts/skill-lint.mjs` · exit 0 ·
  `0 finding(s) in 0 file(s)`.
- **E9** — 2026-11-04, `bun scripts/check-skill-context.mjs` · exit 0 ·
  `PASS context budgets: 28 skills`; `--routes` → `PASS route budgets: 14 routes`;
  `--documents` → `PASS context documents: 3 budgeted documents`.
- **P4/P5/P6** — 2026-11-04, the contract and its declared surface landed as one
  commit (the consts had to precede the block for the parity pin to be green):
  `06014ed9` (164 added, 11 deleted) — `ADVERSARIAL_SETUP.md` (86 → 160 lines,
  `adversarial-verdict@1` included), `ADVERSARIAL_SYNTHESIS.md` (53 → 66) with the
  placement paragraph, the four `normative-surfaces@1` rows, the parity cases and
  the two budget re-bases. `README.md` (the review-change row) is in the working
  tree for the close commit.
- **E10 — token delta (S11, measured; A1 states the limit)** — the reviewed
  route `review-change:adversarial` at the base commit measured **21,955 est /
  1,523 lines** (11 loaded files) and at this change **23,372 est / 1,610 lines**
  (`bun scripts/check-skill-context.mjs --routes`, run in a `git archive` copy of
  `c8b64d0b` and in the worktree) — **+1,417 est (+6.5%) / +87 lines (+5.7%)**,
  all of it the two contract files: `ADVERSARIAL_SETUP.md` 4,733 B → 9,526 B,
  `ADVERSARIAL_SYNTHESIS.md` 3,549 B → 4,425 B. The other
  routes are unmoved or nearly so: `default-backend`/`default-web` 20,302 →
  20,302 (**0**), `synthesize` 20,771 → 20,990 (+219, the placement paragraph),
  and `review-change/SKILL.md` 3,186 → 3,186 (**0**). **What is measured is the
  contract channel**, not a live model run: the per-finding arbitration payload
  is the diff plus the claim, and the checker refuses a reflector input carrying
  anything else (`reflector-not-diff-only`), so no transcript is ever re-sent.
  The papers' 5–15× figure is theirs and is `unknown` here (PE-012) — a live
  multi-model delta needs a real adversarial run, which no committed gate can
  re-derive, so this unit reports the channel it can reproduce and says so.
- **E11** — 2026-11-04, the regression scope, run: `git diff --name-only main --
  scripts/audit-pr-gate.mjs scripts/review-receipt.mjs skills/audit-pr` → empty;
  `rg -c 'Two-cycle cap' skills/review-change/references/REVIEW_PROCESS.md` → 1;
  `git diff --name-status main -- skills/ | rg '^A'` → empty;
  `rg -n 'argument-hint' skills/review-change/SKILL.md` → the unchanged
  `<path-or-glob> [--adversarial N] [--synthesize>`.
- **E12** — 2026-11-04, the unit's own code-tree diff (`git diff --name-only main
  -- scripts/ packages/agentic-workflow/src packages/agentic-workflow-schema/src`)
  → the checker, its suite, its fixtures, the parity suite and the two schema
  sources and nothing else (O9, O14).
- **G1** — 2026-11-04, `bun scripts/run-root-suite.mjs` · exit 0 · `1536 tests ·
  1535 pass · 0 fail · 1 skip` (the skip is the pre-existing deleted-skill
  fixture). Previously red on two local-only artifacts, fixed before this run:
  the worktree's `node_modules` symlink broke `doc-discipline`'s `grep -lE` walk,
  and `AGENTS.md`'s machine region overran its pin — both were this session's,
  neither is a product defect.
- **G2** — 2026-11-04, `bun scripts/lint-changeset.mjs` · exit 0 ·
  `.changeset/358-adversarial-kill-mandate.md` valid.
- **G3** — 2026-11-04, `bun scripts/phase-lint.mjs
  docs/fix/358-adversarial-kill-mandate/SPEC.md` · exit 0 · `verdict PASS` with
  every phase `PASS (6/6)`.
- **G4** — 2026-11-04, `node packages/agentic-workflow/bin/agentic-workflow.mjs
  roadmap check docs/fix/358-adversarial-kill-mandate/SPEC.md` · exit 0 ·
  `verdict: PASS / violations: 0`.
- **E13 — differential check** — a `git archive c8b64d0b` copy against the
  worktree, same commands, output diffed: `skill-lint` **identical** (PASS, 0
  findings both sides); `check-skill-context --skill review-change`
  **identical**; `--routes` differs **only** in the two rows this unit grew
  (`review-change:adversarial` 21,955/1,523 → 23,372/1,610 and
  `review-change:synthesize` 20,771/1,437 → 20,990/1,450 — the measured deltas
  recorded in `E10`); `--documents` differs from a **red** base
  (`AGENTS.md: estimate 6884 > 6881`) to a **green** head (393 lines / 96
  machine / 297 prose / 7,054 est). No unrequested stdout, stderr or exit-code
  difference was found.
- **E14** — 2026-11-04, the advisory-fold re-run: `bun test
  scripts/adversarial-verdict.test.mjs` · exit 0 · `12 pass / 0 fail` (the
  grounding case added in `1c08ed64`); E3's fixture block byte-identical
  (`2 persist · 1 killed`, `verdict: PASS`, exit 0); E4's refusal unchanged
  (exit 1); `bun scripts/check-skill-context.mjs` / `--routes` / `--documents`
  all PASS; `node scripts/run-root-suite.mjs` · exit 0 · `fail 0 · 1 skip` (the
  same pre-existing deleted-skill fixture); `(cd packages/agentic-workflow-schema
  && bun run test)` · exit 0 · `732 pass / 0 fail`.
- **D2** — 2026-11-04, external-verify advisory fold: the external verification
  returned five advisories, four repaired here — (1) `scripts/adversarial-verdict.mjs`'s
  `changedLines` mistook a header-shaped content line (`+++ …`, produced by an
  added markdown line starting with `++ `) for a file header, ending the hunk
  walk and producing false `ungrounded-keep` refusals; fixed by bounding the
  walk with the hunk's declared extents (red case first, `1c08ed64` →
  `21fc20e0`); (2) this Impact section claimed `REVIEW_PROCESS.md` names the two
  new sub-steps — false, the file is untouched by design and the claim is
  reworded to what the diff does; (3) `docs/workflow/SKILLS.md`'s
  `review-change` row still narrated the pass as enumeration only and now
  states the verdict layer; (4) O16's validator cell demanded `skipped 0` while
  the root gate's pre-existing deleted-skill fixture contributes a disclosed
  skip — the cell now states the reality it asserts. The fifth (the PR
  description must carry `Closes #358`) is a forge surface, not a committed
  byte — left to the PR.

## Next

The owner's review of the diff: `/review-change` on a fresh context is the
external verification this unit does not self-grant, then `/audit-pr` at the
merge gate.

## References

- Issue [#358](https://github.com/gtrabanco/agentic-workflow/issues/358) — the
  request, quoted in `## Specs`/`L1`.
- `docs/ROADMAP.md` row 95 (`adversarial-kill-mandate`); row 45 / issue
  [#201](https://github.com/gtrabanco/agentic-workflow/issues/201) owns the
  `passes` config this unit only links (S4).
- Feature 11 (`adversarial-multi-reviewer`) — the mode this unit reframes;
  feature 50 / issue #205 — the reviewer anti-invention rule this unit extends
  to cycle 1 of the pass; issue #270 — the falsification-first charter.
- `docs/research/papers-sweep-2026-11-02.md` — the sweep that surfaced the three
  papers (evidence, never authority).

## Branch

`fix/358-adversarial-kill-mandate`

## Depends on

11 (done), 69 (done). Soft: row 45 / #201 (open, `passes` config — linked only,
never built here, per S4).

## Regression scope

| Scenario | Verified by |
|---|---|
| The default (non-adversarial) review route still loads none of the new contract | `bun scripts/check-skill-context.mjs --route review-change:default-backend` exits 0 and `ADVERSARIAL_SETUP.md` is not in its file list |
| The `--synthesize` route still fuses pasted tables at threshold ≥1 and still forbids dropping/downgrading while synthesizing | the fusion contract's rule sentence is present verbatim; `bun scripts/check-skill-context.mjs --route review-change:synthesize` exits 0 |
| The merge gate and its receipt are unchanged | `git diff main -- scripts/audit-pr-gate.mjs scripts/review-receipt.mjs skills/audit-pr/` prints nothing |
| The two-cycle cap, delta mode and escalation are unchanged | `git diff --name-only main -- skills/review-change/references/REVIEW_PROCESS.md` prints nothing — the mode's contract lives in the two adversarial references, so the always-loaded process (and every non-adversarial route) pays nothing |
| The published skill set and menu entries are unchanged | `git diff --name-status main -- skills/` prints no `A` row |
| The schema package's existing published sets are unchanged and still importable | `(cd packages/agentic-workflow-schema && bun run test)` exits 0 |
