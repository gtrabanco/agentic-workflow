# fix/86-triage-open-unit-awareness

> Fix specification. Shared unit for **#86 + #87** (multi-issue `plan-fix`,
> primary = lowest number = 86). Both add *open-unit awareness* to
> `triage-issue`; they share one mechanism (the scope-membership check), so
> they merge into one unit per `plan-fix`'s shared-root-cause contract.

## Goal

`triage-issue` treats every issue as independent backlog: classify → route to a
**new** unit (`plan-fix` / `plan-feature`) or a comment. It has no step that
asks whether the issue's content already **belongs to a unit that is currently
open** (an in-flight feature/fix or an open PR). Two failure modes follow, one
per merged issue:

- **#87 (high):** in-scope work of an open feature surfaces as several issues; triage
  correctly-per-its-contract routes each to its own fix unit → *N branches/PRs
  for one feature's pending work*, scope fragmented, and the feature merges
  "green" while its own scope ships piecemeal behind it.
- **#86 (medium):** a fix-now finding that belongs to an open unit (typically a
  tradeoff the user promotes during that unit's review cycle) gets a full
  standalone fix unit **and** never reaches `fold-findings`, because
  `review-findings.md` is written only by `review-change`/`audit-pr` — the
  repair queue is structurally split in two.

This fix adds a **scope-membership step** (before classification) and a new
`fix-in-unit` verdict that resolves member issues **on the open unit's own
branch** — either by appending a provenance-marked row to that unit's
`review-findings.md` fold ledger (#86) or by an incremental replan of the unit
(#87). It cannot wait for a feature cycle: it is the **consumer-side**
complement of the now-merged #66 (producer-side descope guard) — #66 stops
scope from *leaving* a unit; this routes scope that already left *back* to it.

## Issue

`#86` (primary) — GitHub issue. `#87` — merged into this unit.
The PR must close **both**: one `Closes #<n>` line per issue in the body
(`Closes #86`, `Closes #87`).

## Branch

`fix/86-triage-open-unit-awareness`

## Depends on

None open. **#66** (producer-side scope-bleed guardrail) is already merged
(PR #88) — its `## Amendments` mechanism (`skills/execute-phase/SKILL.md`
L305–318) is a stable reference the `fix-in-unit` scope-bleed sub-route points
at, not a moving target. **#80** (multi-issue `plan-fix` contract) is merged
(PR #84) and governs how this shared unit was formed.

## Root cause

`skills/triage-issue/SKILL.md` was authored for a 1-issue → 1-decision flow.
Its classification (`## Process` step 3, L152–167) enumerates exactly four
verdicts — `fix-now` / `promote` / `postpone` / `wontfix` — and the only
fix-now route is a **new** unit (`plan-fix` → `execute-phase --fix`, L153–157;
flow diagram L226–231). Nothing anywhere compares the issue against the scope
of a currently-open unit: there is no membership condition, so an issue that is
really an open unit's undone in-scope work (or a promoted-during-review
finding) has **no route home**. The producer side is covered by #66; the
**consumer side does not exist**.

## Detected in

Real use (issue bodies + triage comments 2026-07-17, verdicts `fix-now` on
both). Not a runtime crash — a routing/contract gap: triage-issue, doing its
job correctly per its current contract, fragments an open unit's scope into
parallel fix units and splits the fold queue.

## Scope

### In scope

The smallest change set that gives `triage-issue` open-unit awareness, plus the
doc parity the change forces.

1. **`skills/triage-issue/SKILL.md`** — the single behavioral change:
   - a **scope-membership step** (new `## Process` step, before classification)
     as a fixed, weak-model-executable checklist (see *Membership checklist*
     below);
   - a fifth verdict **`fix-in-unit <unit>`** added to the fixed output
     contract (`Trigger / Checked / Evidence / VERDICT / Action`) and to the
     batch summary table (grouped by home unit);
   - the `fix-in-unit` route's three sub-routes, each naming the **exact
     command** (no "replan if needed"): fold-into-ledger (#86), incremental
     replan (#87), scope-bleed restore (#87);
   - the **ledger-append mechanism** (#86): the fold-into-ledger sub-route
     appends a provenance-marked row to the unit's `review-findings.md` in the
     fixed 7-column schema so `fold-findings` picks it up in one queue;
   - `Closes #<n>` wired to the **unit's** PR (not a new PR);
   - the `## Relationship to other skills` diagram + the closing `→ Next:`
     block updated so a `fix-in-unit` verdict recommends the unit's next command
     (`/execute-phase <NN> P<k>` or `/fold-findings`), never `/plan-fix`;
   - **non-member issues: the existing four-verdict classification is
     byte-for-byte unchanged.**

2. **Doc parity** (docs restating the triage route set — bilingual-sync rule):
   - `docs/workflow/ISSUE_WORKFLOW.md` + `.es.md` — the Stage-3 verdict table
     (L57–60) gains the `fix-in-unit` row; the Stage-4 fix-path prose notes the
     open-unit branch.
   - `docs/workflow/SKILLS.md` + `.es.md` — the `triage-issue` rows (invocation
     table L128; skill-map L79; flow diagram L155/L162) enumerate the new route.
   - `README.md` + `README.es.md` — the `triage-issue` skill row (L137) + the
     issue-flow diagram (L464–466) enumerate the new route.

3. **Consumer verification (read-only, this PR):**
   - `fold-findings` consumes a triage-born row **unchanged** — the row respects
     the fixed schema; the provenance marker lives inside an existing column, so
     no `fold-findings` edit is needed (verify, don't assume).
   - `workflow-status` step 9 ledger parsing (`skills/workflow-status/SKILL.md`
     L139–156) tolerates the provenance marker — it reads named columns, the
     marker is additive text in `route`; the envelope shape is unchanged, so the
     npm schema mirror is **untouched** (verify, don't assume).

4. **Version + changelog + README tables** via `bump-skill` (minor bump —
   backward-compatible new capability): `skills/triage-issue/SKILL.md`
   `version:`, `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md`.

### Out of scope

- **Producer-side scope-bleed guards** (`execute-phase` descope guard, `audit-pr`
  scope-bleed gate) — already shipped by #66/#88. This fix only *consumes* the
  amendment mechanism it defined; it does not touch those skills.
- **`fold-findings` / `workflow-status` behavioral changes** — expected to be
  verify-only. If verification shows a genuine parsing break, the minimal
  adjustment lands in **this** PR (acceptance box covers it); a larger
  workflow-status surface belongs to **#79** (postponed, expose new signals).
- **Auto-detecting membership across issues the user did NOT pass** — the
  membership check runs on each triaged issue only; cross-issue discovery stays
  the user's job (mirrors #80's explicit-input-only stance).
- **Changing the `review-findings.md` column schema** — the schema is owned by
  `review-change`/`audit-pr`; provenance is an in-column marker, not a new
  column (see *Decisions*).
- **#79's `next.suggested` triggers** — this fix *feeds* them when #79 lands;
  it does not implement them.

## Acceptance

Objective, verifiable conditions for "done". (`— #NN` marks the source issue.)

- [ ] **Membership step present** — a new `## Process` step, before
      classification, contains the fixed *Membership checklist* (candidate-unit
      enumeration → per-candidate SPEC/criteria/phase-task comparison →
      membership verdict), every item independently checkable. — #87
- [ ] **`fix-in-unit` verdict added** to the fixed output contract
      (`VERDICT: fix-now | fix-in-unit | promote | postpone | wontfix`) and to
      the batch summary table, which **groups issues by home unit**. — #87
- [ ] **Membership evidence quotes both sides** — the verdict block quotes the
      issue line AND the SPEC acceptance-criterion / phase-task line it maps to;
      membership is never asserted without both quotes. — #87
- [ ] **Replan sub-route names the exact command per case** — `design-feature
      <slug> "<instruction>"` (product-half reshape, upsert) / re-run
      `plan-feature <slug>` (engineering-half reshape) / SPEC `## Amendments`
      entry per #66 (fix units) — the phrase "replan if needed" does not appear. — #87
- [ ] **Scope-bleed sub-route present** — if membership shows the issue was born
      as a descope of an unmerged unit **without** a #66 `## Amendments` entry,
      the verdict says so and routes to *restore-the-criterion-in-the-unit*; the
      issue closes as scope-returned, not new work. — #87
- [ ] **Ledger-append mechanism present** — the fold-into-ledger sub-route
      appends a row to the unit's `review-findings.md` in the fixed schema
      `| id | file:line | axis | severity | class | route | folded |` with
      `folded: no` and a provenance marker `triage #<n> <YYYY-MM-DD>` in the
      `route` cell. — #86
- [ ] **`Closes #<n>` wired to the unit's PR** — the `fix-in-unit` route states
      the issue closes via the open unit's PR, never a new PR. — #86/#87
- [ ] **Non-member routing provably unchanged** — the four existing verdicts and
      their routes/labels are byte-for-byte unchanged for any issue that maps to
      no open unit; a checklist line asserts "no member unit → today's
      classification, unchanged". — #87
- [ ] **`fold-findings` consumes a triage-born row unchanged** — verified by
      reading its Step 0 schema (L64–74) + Process (L128–149): the marker is
      inside `route`, the 7 columns are intact; no edit to `fold-findings`, or a
      minimal one in this PR if verification finds a break. — #86
- [ ] **`workflow-status` parsing verified against the marker** — reading step 9
      (L139–156): named-column read, marker additive in `route`, envelope shape
      unchanged → npm schema package untouched; documented in this SPEC. — #86
- [ ] **`→ Next:` block updated** — a `fix-in-unit` verdict recommends the unit's
      next command (`/execute-phase <NN> P<k>` for a phaseable repair,
      `/fold-findings` for a ledger row), not `/plan-fix`. — #87
- [ ] **Docs restating triage routes updated, same change** —
      `docs/workflow/ISSUE_WORKFLOW.md` + `.es.md`, `docs/workflow/SKILLS.md` +
      `.es.md`, `README.md` + `README.es.md` all enumerate `fix-in-unit`
      (bilingual-sync rule). — #86/#87
- [ ] **`bump-skill` run** — `triage-issue` `version:` bumped (minor),
      `CHANGELOG.md` + `CHANGELOG.es.md` rows added, README skills/model tables
      refreshed. — #86/#87
- [ ] **Verification gate green** — `npx skills add . --list` lists
      `triage-issue`; cross-references in edited docs resolve; no stack/real-
      project references leaked.

## Membership checklist (verbatim target for the skill body)

The step the skill body must encode, before classification, every box
independently checkable by a weak model:

1. **List candidate open units** (mechanical — no judgement): features/fixes
   with status `in-progress` or `planned` (roadmap + `docs/fix/README.md`) plus
   any unit with an open PR (`gh pr list --state open`).
2. **For each candidate, compare the issue to the unit** — membership = ✓ the
   issue's ask overlaps a SPEC **acceptance criterion** or a **phase task**.
   Quote **both** sides in the verdict (the issue line and the SPEC/phase line);
   no quote pair → not a member.
3. **Member of an open unit → verdict `fix-in-unit <unit>`.** Resolve on the
   unit's own branch; pick exactly one sub-route:
   - *repairable as-is* → **fold into the unit's ledger**: append a
     provenance-marked row to `review-findings.md` (#86 mechanism) →
     `/fold-findings`; or fold into the unit's current/next phase →
     `/execute-phase <NN> P<k>`.
   - *changes the unit's shape* → **incremental replan on the same unit**:
     `design-feature <slug> "<instruction>"` (product half, upsert) **or** re-run
     `plan-feature <slug>` (engineering half) **or** a user-approved dated
     `## Amendments` entry per #66 (fix units). Name which one and why.
   - *born as an un-amended descope of an unmerged unit* → **scope-bleed
     restore**: route is restore-the-criterion-in-the-unit; the issue closes as
     scope-returned.
4. **No candidate matched → today's four-verdict classification, unchanged.**

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### Phase-lint (authoritative copy — keep in sync with
`docs/features/_TEMPLATE/SPEC.md` `### Phases`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

- [ ] Title names ONE deliverable — FAIL if it joins nouns with `+`, `,`,
      `&`, `and`/`y`, or `/`.
- [ ] One declared layer — each phase declares exactly one of the fixed enum
      `schema/db | domain | api | ui | config/infra | docs | hardening |
      close-out`; FAIL if any task's target file belongs to another. Tests
      for the phase's own layer belong to the phase; a test-only phase
      declares `hardening`.
- [ ] ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
- [ ] One checkbox = one deliverable — FAIL if a task contains a `→` chain
      of implementation steps, enumerates > 3 cases/scenarios, or creates
      > 1 file of distinct concerns.
- [ ] Zero decision words — FAIL on `Decide`, `choose`, `OR` between
      alternatives, `If … then <change scope>`.
- [ ] No conditional scope mutation — a task may not move work between
      phases at runtime.
- [ ] No external/manual gates inside implementation phases —
      human/out-of-repo verifications live in the hardening/close-out phase,
      marked `manual`.
- [ ] Machine-checkable done-when — every phase ends with one verifiable
      invariant (a command + expected outcome).

### P1 — Scope-membership checklist

Layer: `docs`. Done-when:
`grep -c "scope-membership\|Membership checklist" skills/triage-issue/SKILL.md`
→ ≥ 1.

- [x] Add a new `## Process` step, positioned before classification, titled
      "Scope-membership check". — `skills/triage-issue/SKILL.md` new step 3
- [x] State the candidate-enumeration item: list open units mechanically —
      roadmap/fix-index rows with status `in-progress` or `planned`, plus any
      unit with an open PR (`gh pr list --state open`). — step 3, bullet 1
- [x] State the per-candidate comparison item: membership requires quoting
      both the issue's line and the matching SPEC acceptance-criterion or
      phase-task line; no quote pair means not a member. — step 3, bullet 2
- [x] State the fallthrough item: no candidate matched → today's four-verdict
      classification, unchanged. — step 3, bullet 3

### P2 — `fix-in-unit` verdict definition

Layer: `docs`. Done-when:
`grep -c "fix-in-unit" skills/triage-issue/SKILL.md` → ≥ 3.

- [x] Add `fix-in-unit <unit>` to the fixed output contract's `VERDICT:` line
      (`VERDICT: fix-now | fix-in-unit | promote | postpone | wontfix`). —
      `skills/triage-issue/SKILL.md` step 7 fixed-format block
- [x] Add the batch summary table's group-by-home-unit rule (member issues
      listed under their unit's heading). — step 7, "Batch summary table"
      paragraph
- [x] Add an explicit non-regression line: "no member unit → today's
      four-verdict classification, unchanged" — leave the four existing
      verdict rows and their labels untouched. — step 7, paragraph directly
      under the fixed-format block

### P3 — `fix-in-unit` repair sub-routes

Layer: `docs`. Done-when:
`grep -c "fold into the unit\|incremental replan\|scope-bleed restore" skills/triage-issue/SKILL.md`
→ ≥ 3.

- [x] Add the fold-into-ledger sub-route (repairable as-is → append a
      provenance-marked row to the unit's `review-findings.md`, or fold into
      the unit's current/next phase). —
      `skills/triage-issue/SKILL.md` step 3, "repairable as-is" bullet
- [x] Add the incremental-replan sub-route naming the three exact commands as
      separate lines — `design-feature <slug> "<instruction>"`,
      `plan-feature <slug>`, and a `## Amendments` entry per #66; the phrase
      "replan if needed" appears nowhere. — step 3, "changes the unit's
      shape" bullet
- [x] Add the scope-bleed-restore sub-route (issue born as an un-amended
      descope of an unmerged unit → restore-the-criterion; the issue closes as
      scope-returned, not new work). — step 3, "born as an un-amended
      descope" bullet

### P4 — Ledger-append mechanism (#86)

Layer: `docs`. Done-when:
`grep -c "review-findings.md\|triage #" skills/triage-issue/SKILL.md` → ≥ 2.

- [ ] Quote the fixed 7-column schema
      (`| id | file:line | axis | severity | class | route | folded |`) and
      specify the appended row starts `folded: no`.
- [ ] Specify the provenance marker format `triage #<n> <YYYY-MM-DD>` placed
      inside the `route` cell.
- [ ] State the frozen-classification guarantee: the row is born from the
      dated verdict of the disposition-owning skill, never a silent
      reclassification.
- [ ] Wire `Closes #<n>` to the unit's own PR in the `fix-in-unit` action text
      (never a new PR).

### P5 — Consumer verification notes (#86)

Layer: `hardening`. Done-when: `grep -c "fold-findings\|workflow-status" docs/fix/86-triage-open-unit-awareness/SPEC.md`
→ ≥ 2 (Testing section carries both read-through notes).

- [ ] Read `skills/fold-findings/SKILL.md` Step 0 schema (L64–74) + Process;
      confirm the provenance marker sits inside the existing `route` column
      and all 7 columns are intact; record the result in this SPEC's
      `## Testing` section; edit `fold-findings` only if the check fails.
- [ ] Read `skills/workflow-status/SKILL.md` step 9 (L139–156); confirm it
      reads named columns, the marker is additive inside `route`, and the
      envelope shape (and therefore the npm schema mirror) is unchanged;
      record the result in this SPEC's `## Testing` section.

### P6 — `fix-in-unit` hand-off wiring

Layer: `docs`. Done-when:
`grep -c "fix-in-unit" skills/triage-issue/SKILL.md` → ≥ 5 (verdict line +
diagram + closing block references combined).

- [ ] Update the `## Relationship to other skills` diagram to show the
      `fix-in-unit` route.
- [ ] Update the closing `→ Next:` block so a `fix-in-unit` verdict
      recommends `/execute-phase <NN> P<k>` or `/fold-findings`, never
      `/plan-fix`.

### P7 — Bilingual doc-parity sweep

Layer: `docs`. Done-when:
`grep -rl "fix-in-unit" docs/workflow/ISSUE_WORKFLOW.md docs/workflow/ISSUE_WORKFLOW.es.md docs/workflow/SKILLS.md docs/workflow/SKILLS.es.md README.md README.es.md`
→ lists all 6 files.

- [ ] Add the `fix-in-unit` row to `docs/workflow/ISSUE_WORKFLOW.md` Stage-3
      verdict table plus a Stage-4 open-unit note.
- [ ] Mirror that same edit in `docs/workflow/ISSUE_WORKFLOW.es.md`.
- [ ] Enumerate `fix-in-unit` in `docs/workflow/SKILLS.md`'s `triage-issue`
      rows (invocation table, skill-map, flow diagram).
- [ ] Mirror that same edit in `docs/workflow/SKILLS.es.md`.
- [ ] Enumerate `fix-in-unit` in `README.md`'s `triage-issue` skill row and
      issue-flow diagram.
- [ ] Mirror that same edit in `README.es.md`.

### P8 — Hardening & PR

- [ ] Run `/bump-skill` for `triage-issue` (minor version bump, `CHANGELOG.md`
      + `CHANGELOG.es.md` rows, README skills/model tables refreshed)
- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #86` and `Closes #87`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #86` and push

## Testing

No application build — "green" per `CLAUDE.md` *Verification*:

- **Skill discovery** — `npx skills add . --list` lists `triage-issue`.
- **Route-enumeration grep** — `fix-in-unit` present in all 7 target files
  (SKILL + 6 docs); `plan-fix` no longer the only fix-now route in the diagrams.
- **Non-member invariance** — the four existing verdict rows, their routes, and
  their label sub-sections are unchanged (diff-review, no semantic change).
- **Consumer read-through** — `fold-findings` Step 0 schema and `workflow-status`
  step 9 read named columns; the provenance marker sits inside `route`; both
  verified read-only, no edit (or a minimal same-PR edit if the read finds a
  break). No unit/integration test layer exists for markdown skills — this is a
  documentation/contract change, so review + grep are the gate.

## Rollback

Single PR-revert: `git revert -m 1 <merge-sha>` (or close the PR unmerged). No
data side: the change is skill/doc text only — no schema, no persisted state, no
`review-findings.md` rows written by the fix itself (it only *documents* how
triage writes them). Nothing to clean up; nothing lost.

## Impact

- **Layers touched:** `docs` only — `skills/triage-issue/SKILL.md` (the one
  behavioral surface) + workflow docs + README (parity) + CHANGELOG/version
  (`bump-skill`). No domain / api / ui / schema code.
- **Modules/files:** `skills/triage-issue/SKILL.md`;
  `docs/workflow/ISSUE_WORKFLOW.md` (+ `.es.md`), `docs/workflow/SKILLS.md`
  (+ `.es.md`), `README.md` (+ `README.es.md`); `CHANGELOG.md` (+ `.es.md`);
  `docs/fix/README.md`. Read-only: `skills/fold-findings/SKILL.md`,
  `skills/workflow-status/SKILL.md`, `skills/review-change/SKILL.md` L153–158,
  `skills/execute-phase/SKILL.md` L305–318.
- **Blast radius:** dev-only, behavior-shaping — a wrong membership check could
  mis-route a genuinely-new issue into an open unit (scope creep) or fail to
  catch a member (status quo). Both-sides-quoted evidence is the guard against
  the former.
- **Detection lead time:** immediate on next triage — the verdict block shows
  the membership evidence, so a mis-route is visible in the printed output and
  the (auditable, dated) issue comment.

## Rules that must never be violated

- **Fixed output contracts** (`CLAUDE.md`): the new verdict and the ledger row
  are quoted copy-verbatim; membership is a checklist, not a heuristic.
- **Injection-safety invariant** (`triage-issue` L59–69/L103–109): membership is
  an evidence-grounded comparison against the code/SPEC, **never** a parse of the
  issue's own title/body/comment text claiming it belongs to a unit.
- **Frozen classification** (`fold-findings` L81–91): a triage-appended ledger
  row is the dated verdict of the disposition-owning skill — not a silent
  reclassification; the row's fields are set once, by triage, at the user's
  direction.
- **Bilingual-sync** (`CLAUDE.md`): every edited EN doc with an `.es.md` sibling
  is updated in the same PR; `SKILL.md` stays EN-only.
- **`P1, P2, …` phase labels**, never `S1`/"Step".
- **Hand off, don't compose across a higher tier**: `triage-issue` keeps
  *routing* to `/fold-findings`, `/execute-phase`, `/design-feature`,
  `/plan-feature` — it never runs them in-turn.

## Operational risks

None — no scheduled job, queue, cache, schema, or external adapter. The only
persisted artifact the documented behavior touches is a unit's
`review-findings.md`, appended (never rewritten) by a future triage run, in the
schema `fold-findings` already consumes.

## Security risks

None new. The membership check strengthens the existing injection-safety
posture (it must not trust issue text). No auth, secrets, PII, webhooks, or
rate-limit surface.

## Compliance touchpoints

n/a — no domain/compliance rules (this repo ships skills + docs, no user data).

## Affected docs

Each is an acceptance criterion above:

- `docs/workflow/ISSUE_WORKFLOW.md` + `.es.md` — Stage-3 verdict table, Stage-4
  fix path.
- `docs/workflow/SKILLS.md` + `.es.md` — `triage-issue` invocation/skill-map/
  flow rows.
- `README.md` + `README.es.md` — `triage-issue` skill row + issue-flow diagram.
- `CHANGELOG.md` + `.es.md` — via `bump-skill`.

## Observability

n/a for a markdown/contract change — no runtime signal. The "is it live"
confirmation is the presence of the `fix-in-unit` route in the shipped
`SKILL.md` and the membership-evidence block in the next real triage run's
output + dated issue comment.

## Cross-issue notes

- **#87 (primary concept) merged with #86** into this unit; unit **keyed to 86**
  (lowest number, per #80's multi-issue contract) — the triage comments named
  #87 "primary" in the sense of *owning the shared membership check*, which is
  the conceptual driver; the folder/branch key is mechanical (see *Decisions*).
- **#66** merged (PR #88) — precondition satisfied; the scope-bleed sub-route
  references its `## Amendments` mechanism as a stable target.
- **#80** merged (PR #84) — the contract under which #86+#87 were merged here.
- **#79** (postponed) — this fix *feeds* its `next.suggested` triggers when it
  lands; any larger `workflow-status` envelope surface belongs there, not here.
- **#89** (postponed) — audit-pr text-match scope-bleed detection gap; unrelated
  to triage routing, stays its own item.

## Effort

**M** (multi-commit, ≤ 1 day) — one behavioral skill edit split across two
concerns (#87 membership + #86 ledger) plus 6 bilingual doc-parity files and
`bump-skill`; no code, no tests to author, but wide doc surface and a
copy-verbatim contract to get exactly right.

## Decisions made during drafting

- **Provenance is an in-column marker, not a new column.** The row carries
  `triage #<n> <YYYY-MM-DD>` appended to the **`route`** cell, keeping the fixed
  7-column schema (`| id | file:line | axis | severity | class | route |
  folded |`) intact. *Why:* the schema is owned by `review-change`/`audit-pr`; a
  new column would force edits in four skills and risk the npm envelope mirror.
  #86's acceptance prefers "envelope/npm **untouched**". *Alternative
  (rejected):* add a `| provenance |` column — heavier, breaks positional
  readers, triggers the schema-package mirror rule. The implementer may
  re-question if a marker-in-`route` proves ambiguous for `fold-findings`.
- **Unit keyed to 86, not 87.** #80's rule keys a merged unit to the **lowest**
  issue number; #87 remains the conceptual driver (it owns the membership check
  #86 reuses). No behavioral consequence — both issues are `Closes`-d.
- **`fold-findings` / `workflow-status` treated as verify-only.** The design
  keeps the marker inside an existing column precisely so neither needs a code
  change; if verification (P5) finds a real break, the minimal fix lands in this
  PR, otherwise no edit.
- **Sub-route command names taken from live skills:** `design-feature <slug>
  "<instruction>"` (upsert, `design-feature` L93/L207), `plan-feature <slug>`
  (router), `## Amendments` (execute-phase L305–318). No new command invented.
- **`## Phases` re-cut before P1 execution (2026-07-18).** The originally
  drafted P1 ("Membership step + `fix-in-unit` verdict (skeleton, #87)")
  failed `execute-phase --fix`'s phase-lint pre-flight on two boxes: the title
  joined two deliverables with `+`, and its first task packed a 4-step `→`
  chain into one checkbox — both slipped past `plan-fix`'s own emission-time
  lint. User chose "re-cut P1 now" over `--force`. The ledger was split into
  seven atomic phases (P1 membership checklist, P2 verdict definition, P3
  fold/replan sub-routes, P4 ledger-append mechanism, P5 consumer
  verification, P6 `→ Next:`/diagram, P7 bilingual doc parity) plus P8
  Hardening & PR — same acceptance criteria, no scope change, only the
  execution granularity changed.

## Status

`in-progress`
