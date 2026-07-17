# fix/63-next-block-verdict-branching

> Fix specification. The SPEC alone is the source of truth; its
> `## Phases` section is the execution ledger.

## Goal

`review-change` step 11 emits a single static `→ Next:` block whose
recommended line is always `/audit-pr — merge gate (when the table is clean)`,
regardless of the review's `Decision`. On `Decision: FAIL` (fix-now findings
open) a weak model copies that template verbatim and recommends the merge gate
while findings are still unresolved — the exact opposite of the correct next
step (fold the findings, commit + push, re-review). This repairs the output
contract so it is unambiguous for any model strength, per CLAUDE.md's
"Checklists over heuristics; fixed output formats" authoring rule that the
skill itself currently violates. It cannot wait for a feature cycle: the
skill is an executor-path gate whose broken recommendation actively routes
weak-model runs toward merging unready branches.

## Issue

`#63` — GitHub issue. The PR must close it via `Closes #63` in the body.

## Branch

`fix/63-next-block-verdict-branching`

## Depends on

Empty — independent.

## Root cause

`skills/review-change/SKILL.md`, step 11 "Next step" (lines 190–204), gives
**one** static `→ Next:` template whose recommended line is hardcoded to
`/audit-pr — merge gate (when the table is clean)`. The verdict-dependence
lives only in a parenthetical hint (`(when the table is clean)`) and in the
ordering of the `·` sub-bullets. A frontier model reorders the block by the
`Decision` value; a weaker model (observed: qwen3.6-thinking) copies the
template verbatim — so on `Decision: FAIL` it still leads with the merge gate.
Two defects flow from this single static block: (1) wrong recommendation on
FAIL; (2) the multi-line `·` sub-bullet shape collapses into one prose line
because nothing states the block must be emitted as multiple literal lines.

## Detected in

Reported in issue #63: a real `review-change` run with qwen3.6-thinking that
correctly produced `Decision: FAIL (4 fix-now findings open)` but closed with a
`→ Next:` block leading with `/audit-pr` and with the sub-bullets flattened
into a single prose line.

## Scope

### In scope

`skills/review-change/SKILL.md` step 11 only — replace the single static
`→ Next:` template with an explicit branch on `Decision`:

- A **`Decision: FAIL`** branch whose recommended line folds the fix-now
  findings (gate green, COMMIT and PUSH, then re-run `/review-change`), with
  `/audit-pr` demoted to a sub-bullet gated on "after the table is clean".
- A **`Decision: PASS`** branch whose recommended line is
  `/audit-pr — merge gate` (today's behavior).
- The `/product-audit` recurrence condition restated as an explicit checkbox
  ("second occurrence of the same drift kind? yes → include; no → omit").
- An instruction that the chosen block is emitted as **multiple literal lines
  exactly as quoted** — sub-bullets are never joined with `·` into one line.

Each branch carries its own quoted, exact block so no model has to reorder or
select prose at runtime. Plus the mechanical repo-maintenance consequences of
editing a SKILL.md: `bump-skill` (version + `CHANGELOG*.md` + both READMEs) and
the `GOLDEN_FIXTURE` smoke test (review-change is a `review-*` executor-path
skill).

### Out of scope

- The `## Turn contract` box (line 38) already requires the `→ Next:` block be
  "the ABSOLUTE last output"; it is correct and untouched.
- Any other skill's `→ Next:` block. The same static-template pattern may exist
  elsewhere, but auditing the whole skill set for it is a separate sweep — file
  under `/product-audit` or a new issue if a second instance surfaces; do not
  fold it here.
- The `## Routing` section (lines 274–284) and step 8/9 triage/fold wording —
  the routing semantics are correct; only the closing recommendation is wrong.
- `fold-findings` (issue #65) — a proposed new skill for actually applying
  findings. Unrelated to what `review-change` *recommends* at turn end.

## Acceptance

- [ ] `skills/review-change/SKILL.md` step 11 branches explicitly on
      `Decision`, with a `FAIL` block and a `PASS` block, each quoted verbatim
      as its own fenced example.
- [ ] The `FAIL` block's `→ Next:` recommended line is the fold-and-re-review
      action (gate green → COMMIT and PUSH → re-run `/review-change`), and
      `/audit-pr` appears only as a sub-bullet gated on the table being clean.
- [ ] The `PASS` block's `→ Next:` recommended line is `/audit-pr — merge gate`.
- [ ] The `/product-audit` recurrence condition is written as an explicit
      yes/no checkbox, not only prose.
- [ ] Step 11 states the block is emitted as multiple literal lines exactly as
      quoted (no joining sub-bullets with `·` into one line).
- [ ] `review-change` `version:` bumped and `CHANGELOG.md`, `CHANGELOG.es.md`,
      `README.md`, `README.es.md` updated via `bump-skill`.
- [ ] `GOLDEN_FIXTURE` smoke test run against the changed step 11 with the
      weakest fleet model; on a synthetic FAIL scenario the emitted block leads
      with the fold action, not `/audit-pr`, and renders as multiple lines.
- [ ] `npx skills add . --list` still discovers `review-change`.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**.

### P1 — Branch step 11 on the Decision verdict

- [x] In `skills/review-change/SKILL.md` step 11, replace the single static
      `→ Next:` template with two explicitly-labelled branches — one for
      `Decision: FAIL`, one for `Decision: PASS` — each with its own fenced,
      quoted `→ Next:` block (evidence: two fenced blocks in
      `skills/review-change/SKILL.md` step 11, FAIL first).
- [x] The `FAIL` block recommends folding the fix-now findings on its `→ Next:`
      line (gate green, COMMIT and PUSH, re-run `/review-change`) and demotes
      `/audit-pr` to a sub-bullet gated on "after the table is clean" (evidence:
      FAIL block line 1 = "fold the fix-now findings into the branch"; the
      `· /audit-pr → only after the table is clean` sub-bullet).
- [x] The `PASS` block's `→ Next:` line is `/audit-pr — merge gate` (evidence:
      the PASS fenced block's first line).
- [x] Restate the `/product-audit` recurrence gate as an explicit yes/no
      checkbox in both branches (evidence: "SPEC drift flagged here AND on a
      prior unit? → /product-audit (yes: … ; no: omit this line)" in both).
- [x] Add a sentence that the selected block is emitted as multiple literal
      lines exactly as quoted, never joined with `·` into one line (evidence:
      step 11's lead-in sentence "emit the matching block verbatim, as multiple
      literal lines … Never join the `·` sub-bullets into one prose line").
- [x] Run `bump-skill` for `review-change`: bump `version:`, add rows to
      `CHANGELOG.md` + `CHANGELOG.es.md`, update the skills/model tables in
      `README.md` + `README.es.md` (evidence: `version: 2.2.0 → 2.2.1`;
      changelog rows + release-log entries in both languages. READMEs
      unchanged: patch bump, both cells still factually accurate — per
      `bump-skill` step 7a).
- [x] Smoke-test per `docs/workflow/GOLDEN_FIXTURE.md` with the weakest fleet
      model on a synthetic `Decision: FAIL` scenario; confirm the emitted block
      leads with the fold action and renders multi-line (evidence: emitted
      block led with "fold the fix-now findings into the branch — gate green,
      COMMIT and PUSH …", `/audit-pr` demoted to the table-clean sub-bullet,
      rendered as 4 literal lines, `/product-audit` correctly omitted on first
      drift occurrence).
- [x] `npx skills add . --list` lists `review-change` (evidence: `│ review-change`
      listed with its full description).

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #63`
      (evidence: https://github.com/gtrabanco/agentic-workflow/pull/68)
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #63` and push

## Impact

- **Layers touched:** documentation / skill body only — `skills/review-change/SKILL.md`
  step 11, plus the mechanical doc-sync fan-out (`CHANGELOG.md`, `CHANGELOG.es.md`,
  `README.md`, `README.es.md`). No runtime code; this repo ships no application.
- **Modules/files:** `skills/review-change/SKILL.md` (primary);
  `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md` (via `bump-skill`);
  `docs/fix/README.md` (index entry).
- **Blast radius:** behavioural, dev-facing — it changes what every future
  `review-change` run *recommends* at turn end. Currently a silent
  wrong-recommendation on FAIL routes weak-model runs toward the merge gate with
  findings open. No data corruption; no user-facing production surface.
- **Detection lead time:** silent until now — surfaced only because a human read
  the qwen3.6-thinking output. There is no automated check for `→ Next` block
  correctness; the `GOLDEN_FIXTURE` smoke test is the only guard.

## Rules that must never be violated

- **Docs language is English** — the SKILL.md, SPEC, commits, PR stay English
  (CLAUDE.md "Working rules"). `SKILL.md` has **no** `.es.md` sibling — exempt
  from bilingual sync.
- **Human-readable docs carry EN + ES siblings, updated in the same change** —
  `CHANGELOG.md`/`README.md` edits from `bump-skill` MUST update
  `CHANGELOG.es.md`/`README.es.md` in the same commit (CLAUDE.md hard rule).
  `bump-skill` does this mechanically.
- **Checklists over heuristics; fixed output formats** (CLAUDE.md) — this is the
  very rule the fix restores: the new step 11 must be a fixed, quoted,
  branch-per-verdict contract a weak model cannot misread, not a heuristic.
- **Version every change** — bump `review-change` `version:` and add a changelog
  row (CLAUDE.md). Patch-level (wording of an output block; no flag/contract
  rename).
- **Stack/architecture agnostic** — no product/stack/framework references
  introduced into the skill.
- **Every user-facing skill keeps its `## Portability` and `## Turn contract`
  sections** — unchanged by this edit; do not disturb them.

## Operational risks

n/a — no scheduled job, queue, cache, schema, or external adapter. This is a
documentation-only change to a skill body; nothing executes at build time beyond
the `skills` CLI discovery check.

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits touched. The edit is
prose in a Markdown skill body.

## Compliance touchpoints

n/a — no domain/compliance rules (data retention, regional, consumer-protection)
apply to a skill-wording change.

## Affected docs

- `CHANGELOG.md` + `CHANGELOG.es.md` — new row for the `review-change` bump
  (via `bump-skill`). → acceptance criterion above.
- `README.md` + `README.es.md` — skills table version cell for `review-change`
  (via `bump-skill`). → acceptance criterion above.
- `docs/fix/README.md` — new index row for this fix (added at draft time as
  `pending`, flipped to `done` in P2).

## Observability

No production telemetry — this repo ships no runtime. The confirmation that the
fix is "live and healthy" is the `GOLDEN_FIXTURE` smoke test: the weakest fleet
model, given a `Decision: FAIL` review, emits a `→ Next:` block that leads with
the fold-and-re-review action and renders as multiple lines. If it degrades
(a future edit re-flattens the branch), that same smoke test on the next
executor-path change is what catches it; there is no silent-degradation alarm.

## Cross-issue notes

- **#65 (fold-findings new skill)** — parallel/unrelated. #65 proposes a skill
  that *applies* findings; #63 fixes what `review-change` *recommends*. No
  overlap in the edited region; neither blocks the other.
- **#64 (phase atomicity), #66 (scope-bleed), #67 (README ladder table)** —
  unrelated; different skills/docs, no shared lines.
- No open PRs. Nothing blocks or absorbs this fix.

## Effort

**S** — one focused SKILL.md wording edit plus the mechanical `bump-skill`
fan-out and a `GOLDEN_FIXTURE` smoke test; multi-commit (edit+bump, then the
Hardening & PR close-out), well under 4h.

## Decisions made during drafting

- **Topic slug `next-block-verdict-branching`** — describes the fix (branch the
  `→ Next` block on the verdict) rather than the symptom; ≤ 40 chars, no leading
  verb. The implementer may rename if a clearer slug emerges before the branch
  is pushed.
- **Both branches quoted in full rather than a shared block with a swapped first
  line** — the issue's proposed fix asks for "its own quoted, exact block" per
  branch; full duplication is what a weak model copies safely. The implementer
  may factor shared sub-bullets *if* both blocks remain independently complete
  and quoted.
- **Version bump treated as patch** — the output-contract *shape* changes but no
  flag, name, or invocation contract does; a reviewer may argue minor. Left to
  `bump-skill`'s classification / implementer judgement.

## Testing

`GOLDEN_FIXTURE` manual smoke test (no automated suite for skill prose):
feed the changed step 11 a synthetic `Decision: FAIL` case with the weakest
fleet model and assert the emitted `→ Next:` block (a) leads with the fold
action, not `/audit-pr`, and (b) renders as multiple literal lines. Plus
`npx skills add . --list` to confirm discovery is unbroken. No unit/integration
layer applies — this repo has no application build.

## Rollback

`git revert` the fix PR's merge commit (or `git checkout main -- skills/review-change/SKILL.md`
and the four bumped doc files, then re-commit). No data-side cleanup — the change
is text only; nothing persisted, no migration, no external state. What's
preserved: full history in git log + the closed issue #63.

## Status

`pending`
