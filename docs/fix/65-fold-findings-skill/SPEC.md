# fix/65-fold-findings-skill

## Goal

Author a new standalone, strict skill `fold-findings` that takes a review/audit
findings ledger and **truly repairs** each fix-now finding — closing the escape
hatches that a lazy or weak model reaches for (known-issues dump, tradeoff note,
severity downgrade, test weakening, lint suppression, `TODO` stubs). Today the
capability exists only as an embedded "fold cycle" inside `execute-phase` plus a
prompt the user re-types by hand after every `review-change` FAIL / `audit-pr`
block; a re-typed prompt whose contract must close escape hatches is exactly the
thing a skill exists to make reliable. It cannot wait for a feature cycle because
every un-folded finding is a silently-lost correctness/security fix — the same
defect class as #63 and #64 (contracts must be un-misreadable by weak models).

## Issue

`#65` — GitHub issue. Required. The PR must close it via `Closes #65` in the body.

## Branch

`fix/65-fold-findings-skill`

## Depends on

None. #64 (atomicity lint) and #66 (scope-bleed guardrail) are the same defect
class but independent — neither blocks nor is blocked by this fix.

## Root cause

There is no first-class skill for "here is a findings ledger — repair it." The
fold behavior lives only as a prose "mini-cycle" inside
`skills/execute-phase/SKILL.md` (§ *Folding review / audit findings*, lines
~404–428) and as an ad-hoc user prompt. Prose embedded in another skill's body
is not independently invocable, is not model-tier-routed for the fix itself, and
gives a weak model no fixed contract that forbids the escape hatches — so
findings get "resolved" by annotation, downgrade, or a weakened test instead of a
root-cause fix.

## Detected in

Raised as issue #65 (author: repo owner) after repeatedly hand-writing the same
"truly fix, don't dump to known-issues" prompt. Named for the existing "fold
cycle" vocabulary already used across `execute-phase` and `review-change`.

## Scope

### In scope

1. **New skill `skills/fold-findings/SKILL.md`** — full body implementing the
   issue's contract (see *SPEC sections → Skill contract* below): frozen
   classification, definition-of-fixed checklist, forbidden list, one-finding-at-
   a-time process, `FOLDED | DISPUTED | BLOCKED` per-finding verdicts, fixed
   output contract, `DISPUTED → /triage-issue` routing, model-tier note,
   Turn contract, Guardrails, Portability, Relationship-to-other-skills,
   closing `→ Next:` block. `user-invocable: true`, `version: 1.0.0`.
2. **Minimal hand-off wiring so the skill is reachable** (not orphaned):
   - `review-change` step 11 `Decision: FAIL` `→ Next:` block: recommend
     `/fold-findings` as the canonical fold path (today it describes the fold
     inline). Preserve the multi-line fixed-output shape #63 established — swap
     the recommended verb, do not restructure the block.
   - `execute-phase` § *Folding review / audit findings*: name `/fold-findings`
     as the standalone skill that performs this cycle, keeping the inline
     checklist as the in-context / portability fallback.
3. **Registration** (so a new skill is discoverable and tier-routed):
   - `docs/workflow/model-routing.yml` — add a `fold-findings:` tier entry.
   - `docs/workflow/SKILLS.md` **and** `SKILLS.es.md` — add the catalog row and
     the invocation-reference row (bilingual sync, same change).
   - README skills table + model table (EN + ES) and both CHANGELOGs — produced
     by running `bump-skill` (P3), not hand-edited.
4. **Smoke-test** the executor-path edits (`execute-phase`, `review-change`, and
   the new `fold-findings`) via `docs/workflow/GOLDEN_FIXTURE.md` on the weakest
   fleet model.

### Out of scope

- **Deleting `execute-phase`'s embedded fold cycle.** It stays as the portability
  / in-context fallback; only a reference to the new skill is added. A future
  consolidation, if wanted, is its own issue.
- **Rewriting `triage-issue`.** It already accepts issue numbers and produces
  verdicts; `DISPUTED` findings route to it unchanged. If a new `--from-finding`
  entry point turns out to be needed, file it separately.
- **Changing the ledger schema** (`review-findings.md`
  `| id | file:line | axis | severity | class | route | folded |`). `fold-findings`
  consumes and ticks it as-is; owning the `folded: no → yes` transition moves
  from `execute-phase` to `fold-findings` conceptually, but the column and file
  are unchanged.
- **#64 atomicity lint / #66 scope-bleed guardrail.** Related but separate issues.

## Acceptance

Objective, verifiable conditions for "done":

- [ ] `skills/fold-findings/SKILL.md` exists with `name: fold-findings`,
      `user-invocable: true`, `version: 1.0.0`, and a `description` carrying
      concrete trigger phrases.
- [ ] Body contains, each as a distinct checkable section: `## Turn contract`,
      `When to use`, `Step 0 — Discover the project`, `Process`, `Guardrails`,
      `Relationship to other skills`, `## Portability`, `Done when`, and a
      closing `→ Next:` block — matching the CLAUDE.md skill-anatomy list.
- [ ] The **frozen-classification** rule is stated verbatim in intent: the skill
      never reclassifies (no severity downgrade, no fix-now → non-fix-now, no
      "actually fine"); a genuine objection yields `DISPUTED` + evidence → routed
      to `/triage-issue`, never a silent dodge.
- [ ] The **definition-of-fixed checklist** is present as a `✓`-list, every box
      independently checkable: root-cause diff exists · gate green · behavioral
      finding has an added passing test/check · ledger row ticked `folded: yes`
      with sha · committed **and pushed**.
- [ ] The **forbidden list** is present as a `✗`-list covering: known-issues /
      backlog entry · `decisions.md` tradeoff note · deleting/skipping/loosening/
      `.skip` a test · `eslint-disable`/`@ts-ignore`-style suppression as the fix ·
      `TODO`/`FIXME` as the fix · `folded: yes` without a reviewer-mappable diff ·
      fixing anything not in the ledger (opportunistic → `/triage-issue`).
- [ ] The **process** is one-finding-at-a-time in ledger/severity order, one
      commit per finding (`fix(<scope>): fold <finding-id> — <summary>`), push,
      then tick the row.
- [ ] The **per-finding output contract** is quoted verbatim
      (`| id | verdict: FOLDED <sha> | DISPUTED <reason → /triage-issue> | BLOCKED <missing input> |`)
      and the report ends `Folded: n/m · Disputed: k · Blocked: j`.
- [ ] The closing `→ Next:` block branches on outcome: all folded → `/review-change`
      re-review (recommended); any `DISPUTED` → `/triage-issue <ids>`; any
      `BLOCKED` → what the user must provide.
- [ ] `review-change` `Decision: FAIL` `→ Next:` recommends `/fold-findings`,
      keeping the multi-line fixed-output shape (no `·`-joined prose).
- [ ] `execute-phase` § *Folding review / audit findings* names `/fold-findings`.
- [ ] `docs/workflow/model-routing.yml` has a `fold-findings:` entry.
- [ ] `docs/workflow/SKILLS.md` **and** `SKILLS.es.md` each carry a `fold-findings`
      catalog row + invocation-reference row (reciprocal, same change).
- [ ] README skills table + model table (EN + ES) and `CHANGELOG.md` +
      `CHANGELOG.es.md` updated via `bump-skill`; every edited SKILL.md has its
      `version:` bumped (new skill = 1.0.0; wiring edits = minor bump).
- [ ] `npx skills add . --list` discovers `fold-findings`.
- [ ] GOLDEN_FIXTURE smoke test passes for the changed executor-path skills on the
      weakest fleet model.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### P1 — Author `skills/fold-findings/SKILL.md`

- [ ] Create `skills/fold-findings/SKILL.md` with frontmatter: `name: fold-findings`,
      `user-invocable: true`, `version: 1.0.0`, a `description` with trigger
      phrases ("fold the findings", "fix the review findings", "repair the audit
      blockers", "fold-findings").
- [ ] Write `## Turn contract` (boxes: per-finding contract emitted; git commit+push
      actually RUN with sha per folded finding; closing `→ Next:` printed last;
      artifact-language rule).
- [ ] Write `When to use` and `Step 0 — Discover the project (always first)`
      (discover the project's verification gate, the ledger location, the forge CLI).
- [ ] Write `Process`: ingest ledger (fix-now rows `folded: no`) and/or `audit-pr`
      blocker list; optional finding-ID restriction arg; one finding at a time in
      ledger/severity order → fix root cause → run gate → one commit
      `fix(<scope>): fold <finding-id> — <summary>` → push → tick `folded: yes`
      with sha.
- [ ] Write the **frozen-classification** rule + the `FOLDED | DISPUTED | BLOCKED`
      verdicts, with `DISPUTED` (evidence → `/triage-issue`) and `BLOCKED`
      (missing input) defined.
- [ ] Write the **definition-of-fixed** `✓`-checklist and the **forbidden** `✗`-list
      verbatim from the issue (every acceptance box above).
- [ ] Write the fixed **per-finding output contract** and the
      `Folded: n/m · Disputed: k · Blocked: j` tally line.
- [ ] Write the **model-tier note** (fixer never weaker than the code's writer nor
      than the finding's subtlety; subtle logic/security bumps to the finding's tier).
- [ ] Write `Guardrails`, `Relationship to other skills`
      (`review-change` classifies → `fold-findings` folds fix-now → `triage-issue`
      handles non-fix-now / disputes), `## Portability (agents other than Claude
      Code)`, `Done when`, and the outcome-branched closing `→ Next:` block.

### P2 — Wire hand-offs and register the skill

- [ ] `skills/review-change/SKILL.md` step 11 `Decision: FAIL` `→ Next:` block:
      recommend `/fold-findings` as the fold path; keep the multi-line fixed shape
      (no `·`-joined prose), keep the `/audit-pr` / non-fix-now / product-audit
      sub-bullets. Bump `version:` (minor).
- [ ] `skills/execute-phase/SKILL.md` § *Folding review / audit findings*: add a
      sentence naming `/fold-findings` as the standalone skill for this cycle, inline
      checklist retained as fallback. Bump `version:` (minor).
- [ ] `docs/workflow/model-routing.yml`: add `fold-findings:` with `model`/`effort`
      (proposed `opus` / `high` — never below the review tier that produced the
      findings; see *Decisions*).
- [ ] `docs/workflow/SKILLS.md`: add the `fold-findings` catalog row (Review/Decide
      area) and its `## Invocation & arguments reference` row.
- [ ] `docs/workflow/SKILLS.es.md`: add the reciprocal Spanish rows (bilingual sync,
      same change).

### P3 — Sync docs and smoke-test

- [ ] Run `bump-skill`: confirm `fold-findings` 1.0.0 + the two wiring bumps land in
      `CHANGELOG.md`, `CHANGELOG.es.md`, and the README skills + model tables
      (EN + ES). Report its 5-rule lint.
- [ ] `npx skills add . --list` → `fold-findings` appears.
- [ ] Run the `docs/workflow/GOLDEN_FIXTURE.md` procedure on the weakest fleet model
      for `fold-findings`, `execute-phase`, and `review-change`; paste the outcome.

### P4 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #65`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #65` and push

## Impact

- **Layers touched:** the skill layer (`skills/`) — one new skill + two edited
  contracts; the shared-docs layer (`docs/workflow/` catalog + model routing);
  the distribution surface (README tables + CHANGELOGs). No application code (this
  repo ships no app).
- **Modules / files:** `skills/fold-findings/SKILL.md` (new);
  `skills/review-change/SKILL.md`; `skills/execute-phase/SKILL.md`;
  `docs/workflow/model-routing.yml`; `docs/workflow/SKILLS.md` + `SKILLS.es.md`;
  `README.md` + `README.es.md`; `CHANGELOG.md` + `CHANGELOG.es.md`;
  `docs/fix/README.md`.
- **Blast radius:** dev-only, additive. A mis-authored contract weakens fold
  discipline (findings could still slip) but breaks no runtime; the risk is a
  weak-model misread, which the GOLDEN_FIXTURE smoke test targets.
- **Detection lead time:** immediate at author/review time (`npx skills add . --list`,
  golden fixture, review-change of this very PR).

## Rules that must never be violated

- **Docs language is English** for the SKILL.md, SPEC, commits, PR (docs-language
  rule); human-tutorial edits (`SKILLS.md`) carry their ES sibling in the SAME
  change (bilingual-sync hard rule).
- **`user-invocable: true`** on the new skill, or it never shows in the menu.
- **Phases are `P1, P2, …`** in every artifact the skill emits — never `S1`/"Step N".
- **Checklists over heuristics; fixed output contracts** — the whole reason the
  skill exists; the `✓`/`✗` lists and the per-finding contract must be copy-verbatim,
  un-misreadable by a weak model.
- **Hand off, don't compose across a higher tier** — `fold-findings` hands off to
  `/triage-issue` and `/review-change` (both may run at ≥ its tier); it must not
  silently compose a higher-tier skill in its own turn.
- **Version every change** — new skill 1.0.0; each edited skill bumped; both
  CHANGELOGs + both README tables synced (`bump-skill`).
- **The frozen-classification invariant** the skill itself enforces: it never
  edits the review's class/severity; disputes are explicit (`DISPUTED`), never silent.

## Operational risks

None runtime. The only "operational" hazard is documentation drift: a new skill
that isn't registered in every table (README EN/ES, model-routing, SKILLS EN/ES,
CHANGELOG EN/ES) — mitigated by running `bump-skill` (P3) and the manual SKILLS
catalog rows (P2), then `npx skills add . --list` as the discovery check.

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits touched. (The skill's own
forbidden list *improves* security posture by refusing to fold a security finding
via suppression instead of a fix.)

## Compliance touchpoints

n/a — no domain/compliance rules (data retention, regional, consumer-protection)
apply to skill-authoring docs.

## Affected docs

Each is an acceptance criterion above:

- `skills/fold-findings/SKILL.md` — new.
- `skills/review-change/SKILL.md` — FAIL `→ Next:` recommends `/fold-findings`.
- `skills/execute-phase/SKILL.md` — fold-cycle section names `/fold-findings`.
- `docs/workflow/model-routing.yml` — `fold-findings:` tier.
- `docs/workflow/SKILLS.md` + `SKILLS.es.md` — catalog + invocation rows (bilingual).
- `README.md` + `README.es.md` — skills table + model table (via `bump-skill`).
- `CHANGELOG.md` + `CHANGELOG.es.md` — entries (via `bump-skill`).
- `docs/fix/README.md` — this fix's index row (P4 flip to `done`).
- `docs/workflow/REVIEW_AND_CLASSIFY.md` — check the passing "fold" mentions still
  read correctly once `/fold-findings` exists; touch only if a reference now misleads.

## Observability

No prod signal (docs repo). The health check is: `npx skills add . --list` lists
`fold-findings`; the GOLDEN_FIXTURE run shows the weakest model honoring the
`✓`/`✗` contract; a subsequent `review-change` FAIL `→ Next:` points a user at
`/fold-findings` and the fold produces per-finding `FOLDED <sha>` lines.

## Cross-issue notes

- **#64** (phase atomicity lint) — parallel, same defect class (weak-model-proof
  contracts); does not gate this fix. Unrelated files.
- **#66** (scope-bleed guardrail) — parallel; shares the "no opportunistic /
  exported scope" principle that `fold-findings`' forbidden list also encodes
  ("fixing anything NOT in the ledger → `/triage-issue`"). Keep the wording
  consistent but implement independently.
- **#63** (merged, #68) — established the multi-line verdict-branched `→ Next:`
  shape this fix must preserve when editing `review-change`'s FAIL block.
- No open PRs. No absorbable/blocking issues.

## Effort

**M** — multi-commit (one new skill + two contract edits + five doc/table
surfaces across EN/ES + a golden-fixture smoke run), self-contained, ≤ 1 day. Not
L: no application code, no migration, no external dependency.

## Decisions made during drafting

- **Model tier `opus` / `high`** proposed for `fold-findings` in `model-routing.yml`:
  the fixer must never be weaker than the reviewer that produced the finding, and
  `review-change`/`review-code`/`review-security` sit at `opus`/`high`. The skill
  body still says subtle logic/security findings stay at that tier while routine
  ones *may* drop — but the frontmatter default is the safe ceiling. Implementer
  may re-question against the fold-cycle routing row in the README.
- **Wiring is in scope, minimally.** Orphaning the skill (author it but leave no
  `→ Next:` pointing at it) would fail the issue's own "Ordering" flow
  (`review-change → fold-findings → triage-issue`). So P2 rewires the two
  hand-off points — but *only* swaps the recommended path, preserving #63's fixed
  block shape; it does not restructure those contracts.
- **`execute-phase`'s inline fold cycle is kept**, not deleted — it is the
  portability fallback for agents/contexts that fold in-line. Consolidation, if
  ever wanted, is a separate issue (recorded in *Out of scope*).
- **Slug `fold-findings-skill`** (no leading verb, ≤ 40 chars) for the fix folder,
  distinct from the skill name `fold-findings`.

## Testing

- **Discovery test:** `npx skills add . --list` includes `fold-findings`
  (contract-level check that the skill is well-formed and registered).
- **Golden-fixture smoke test** (`docs/workflow/GOLDEN_FIXTURE.md`) on the weakest
  fleet model for `fold-findings`, `execute-phase`, `review-change` — the
  project's substitute for unit tests on prose skills; catches wording a frontier
  model absorbs but a weak model misreads. This is the primary regression guard.
- **Cross-reference resolution:** every `/fold-findings` link and doc reference
  resolves; no broken links in the documentation map.
- No application unit/integration layer exists in this repo.

## Rollback

`git revert` the PR merge commit (or `gh pr revert`). Data-side cleanup: none —
purely additive docs/skill files; reverting removes `skills/fold-findings/` and
restores the two edited contracts and the tables to their prior text. Nothing
persisted, nothing lost.

## Status

`pending`
