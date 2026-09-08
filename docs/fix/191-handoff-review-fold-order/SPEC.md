# fix/191-handoff-review-fold-order

> Fix specification. Source: `docs/fix/_TEMPLATE/SPEC.md`. The SPEC and its
> frozen `ACCEPTANCE.md` are the source of truth; `## Phases` is the execution
> ledger.

## Goal

Reorder every terminal/hand-off block that recommends `/fold-findings` **before**
the first `review-change` pass into the canonical order
`review-change → fold-findings (if fix-now findings) → re-run review-change → audit-pr`,
and drop the word "mandatory" from the fold hand-off (the mandatory step is the
review; folding is conditional on findings). A `/fold-findings` invocation with no
review verdict behind it has nothing to fold — its own "When to use"
(`skills/fold-findings/SKILL.md`, "When to use") requires a `REVIEW-FAIL` from
`review-change` or a `VERDICT: BLOCKED` from `audit-pr`. In practice (fix-181
session, PR #190) the recommendation was followed as written and produced a no-op
step plus confusion about whether the mandatory end review had been skipped.

## Issue

`#191` — tracked issue in the project's forge. The PR must close it via
`Closes #191` in the body.

## Branch

`fix/191-handoff-review-fold-order`

## Depends on

None. Origin fix `161-finding-verification-loop-removal` is merged (PR #163); the
defect is a residual from its P3a, not a pending dependency.

## Root cause

Fix #161 P3a (commit `0523586e`, "loop-review-fold retirement across live
consumers") mechanically remapped every terminal block that pointed at the retired
`/loop-review-fold` router. The diff inverted the order the same commit message
and the #161 SPEC (`docs/fix/161-finding-verification-loop-removal/SPEC.md`,
"`review-change → fold-findings → re-run review-change` path") both declare:

```diff
-→ Next: /loop-review-fold <unit> — select the persisted review/fold route, then triage or replan unresolved findings
-  · manual path → /review-change, then /fold-findings and re-review as required
+→ Next: /fold-findings, then re-run /review-change on the changed HEAD
+  · manual path → /fold-findings, then re-run /review-change as required
```

The remap put `fold-findings` in the `→ Next:` recommendation slot (first leg)
instead of behind a review verdict. `review-change`'s own correction path
(`skills/review-change/SKILL.md`, "Relationship to other skills": "On `REVIEW-FAIL`
the manual correction path is `/fold-findings`, then re-run `/review-change`") is
the correct ordering — fold is only ever the **second** leg, after a verdict.

## Detected in

Issue #191 (2026-09-08, label `bug`), reported after the fix-181 session
(2026-09-08, PR #190) followed the execute-phase terminal block as written and hit
the no-op fold. Cross-checked against `git log` for commit `0523586e` and the
canonical order declared by the #161 SPEC.

## Scope

### In scope

All inverted blocks on the two verified surfaces (`skills/execute-phase/`,
`skills/ship-roadmap/`), plus their pinned tests — red-first — and the release
bookkeeping convention:

- `skills/execute-phase/references/UNIT_LOOP.md` — terminal
  "UNIT LOOP — <unit> COMPLETE" block (`→ Next: /fold-findings, then re-run
  /review-change on the changed HEAD — triage or replan unresolved findings`).
- `skills/execute-phase/references/FOLDING.md` — "Final-phase / single-pass /
  fix hand-off" block (`→ Next: /fold-findings, then re-run /review-change …`).
- `skills/execute-phase/references/CLOSEOUT.md` — two spots: the
  "Review checkpoint & finishing a unit" recommend paragraph ("Recommend the
  manual `/fold-findings` → re-run `/review-change` path because it preserves
  fresh review contexts…") and the "Finishing a unit" hand-off sentence ("Then
  hand off to `/fold-findings`, then re-run `/review-change`, which feeds
  `audit-pr`"). Reconcile the recommend paragraph with the mandatory-review
  sentence above it — the review is mandatory, the fold is conditional.
- `skills/execute-phase/SKILL.md` — "Relationship to other skills" paragraph
  ("recommends the manual `/fold-findings` → re-run `/review-change` path after
  opening the PR") and the "Done when" bullet (which additionally calls the fold
  hand-off **mandatory** — a fold with zero findings is not mandatory anything).
- `skills/execute-phase/references/BATCH_AND_PORTABILITY.md` — the whole-unit
  close-out line ("recommends the manual `/fold-findings` → re-run
  `/review-change` path") and the fresh-context driver step 3 ("route
  `READY_FOR_REVIEW` to `/fold-findings`, then re-run `/review-change`").
- `skills/ship-roadmap/SKILL.md` — "Relationship to other skills" model table
  cell ("the review→fold manual path (`/fold-findings` → re-run
  `/review-change`)").
- `skills/ship-roadmap/references/ADVANCE.md` — REVIEW-stage bullet
  ("compose the manual review→fold path in-turn (equal tier) once,
  `/fold-findings`, then re-run `/review-change`, over the complete PR
  candidate").
- `skills/ship-roadmap/references/MODEL_ROUTING.md` — "Final review/correction
  loop" row ("compose the manual path `/fold-findings`, then re-run
  `/review-change`").
- Discipline tests that pin the affected blocks — updated red-first, never
  weakened: `scripts/next-recommendations.test.mjs` and any sibling test pinning
  the exact inverted wording (`scripts/bounded-delivery-loops.test.mjs`,
  `scripts/review-loop-discipline.test.mjs` readers of these references).
- Version bumps (`execute-phase` 4.4.0 → patch, `ship-roadmap` 5.2.0 → patch),
  `CHANGELOG.md` EN rows, and `CHANGELOG.es.md` sibling in the same change
  (CLAUDE.md bilingual hard rule).
- `bundle:skills` Pi-mirror re-bundle per repo convention.

### Out of scope

- Surfaces that already state the fold as the second leg after a verdict — do
  not regress them: `skills/review-change/SKILL.md` ("On `REVIEW-FAIL` …"
  correction path), `skills/review-change/references/REVIEW_PROCESS.md`
  (two-cycle cap), `skills/review-plan/references/OUTPUT.md` (class-route map),
  `skills/review-spec/references/OUTPUT.md` (class-route map),
  `skills/review-implementation/references/CLASSIFY.md` (owning-stage table),
  `skills/pre-execution-review/references/POLICY.md` §5,
  `skills/fold-findings/SKILL.md` diagram (both legs behind `audit-pr
  ──BLOCKED──▶`).
- #172 (fold-flag ownership / review-pack consistency) — separate concern.
- #182 (receipt scoping / audit-pr terminal-hygiene owner) — separate concern.
- Any behavioral change to the review→fold loop bounds (two-cycle cap,
  re-verification) — those live in `REVIEW_PROCESS.md` and are already correct.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: the execute-phase terminal block recommends `/fold-findings` before any review verdict, and following it as written produced a no-op fold (fix-181 session, PR #190). | issue | #191 body + `skills/execute-phase/references/UNIT_LOOP.md` line 85 | @ `0523586e` parent of `main` (2026-09-08) | P1 tasks 1–6 (every block reorder) | current | proven | execute-phase |
| PE-002 | Root cause: fix #161 P3a commit `0523586e` remapped the retired `/loop-review-fold` terminal block and inverted review→fold into fold→review, contradicting its own commit message and SPEC. | repo | `git show 0523586e`; `docs/fix/161-finding-verification-loop-removal/SPEC.md`; `skills/review-change/SKILL.md` correction path | 2026-09-08 | P1 tasks 1–6 | current | proven | execute-phase |
| PE-003 | Regression scope: only the blocks recommending fold first invert the order; verdict-following uses in `review-change`/`review-plan`/`review-spec`/`review-implementation`/`fold-findings` diagrams are correct and must not regress. | repo | grep `fold-findings` over `skills/` (2026-09-08); issue #191 "Affected surfaces" | 2026-09-08 | P1 task 7 (grep sweep) + AC3 | current | proven | execute-phase |
| PE-004 | The end review is mandatory and already stated so; only the hand-off ordering is wrong (`CLOSEOUT.md` states both in adjacent lines). | repo | `skills/execute-phase/references/CLOSEOUT.md` "Review checkpoint & finishing a unit" (~line 23 mandatory sentence vs ~line 25 recommend paragraph) | 2026-09-08 | P1 task 3 (reconcile paragraph) | current | proven | execute-phase |
| PE-005 | `fold-findings` cannot act without a `REVIEW-FAIL` (review-change) or `VERDICT: BLOCKED` (audit-pr); a fold-first recommendation is a no-op by construction. | repo | `skills/fold-findings/SKILL.md` "When to use" | 2026-09-08 | Goals + every block reorder | current | proven | — |
| PE-006 | Tests pin discipline over these blocks; the affected pins live in `scripts/next-recommendations.test.mjs` (finding-ID hand-offs) and sibling discipline readers (`review-loop-discipline.test.mjs`, `bounded-delivery-loops.test.mjs`) — none currently pins the inverted order, so red-first means adding a pin, not loosening one. | repo | grep over `scripts/*.test.mjs` (2026-09-08) | 2026-09-08 | P1 task 7 (pin canonical order red-first) | current | proven | execute-phase |
| PE-007 | Rollback path: single revert of the unit's commit(s) on the PR branch; no data, schema, or runtime state involved (docs-only change). | repo | `git revert` flow in `## Rollback` | 2026-09-08 | Rollback section | current | proven | — |
| PE-008 | Affected invariant: "Complete dynamic hand-offs" (CLAUDE.md) — every closing recommendation must name the real next command; a fold-first hand-off names an impossible step. | repo | `CLAUDE.md` "Working rules" — Complete dynamic hand-offs | 2026-09-08 | Obligations O1–O4 | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | PE-001 / PE-002 | Every execute-phase terminal/hand-off block recommends `review-change` before any `fold-findings` (fold only after a verdict) | P1 | Tasks 1–4 | execute-phase | `grep -n "fold-findings, then re-run /review-change" skills/execute-phase/` → 0 hits, and each block's `→ Next:` line leads with `/review-change` | grep output pasted in phase notes | planned |
| O2 | PE-001 | Every ship-roadmap surface (`SKILL.md` table cell, `ADVANCE.md` REVIEW bullet, `MODEL_ROUTING.md` row) states the review→fold order | P1 | Task 5 | execute-phase | `grep -n "fold-findings, then re-run /review-change" skills/ship-roadmap/` → 0 hits | grep output pasted in phase notes | planned |
| O3 | PE-004 | The "mandatory" label sits on the review, never on the fold hand-off | P1 | Tasks 3–4 | execute-phase | `grep -n "mandatory.*fold" skills/execute-phase/SKILL.md skills/execute-phase/references/CLOSEOUT.md` → 0 hits | grep output pasted in phase notes | planned |
| O4 | PE-003 / PE-006 | Discipline tests pin the canonical order and the old wording cannot return; verdict-following uses in `review-change`/`review-plan`/`review-spec`/`review-implementation`/`fold-findings` still pass | P1 | Task 7 | execute-phase | `node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` → all pass, with a new red-first pin added | test run output pasted | planned |
| O5 | PE-008 / CLAUDE.md version rule | Release bookkeeping complete: both skills bumped, CHANGELOG EN+ES rows, bundle re-sync | P1 | Task 8 | execute-phase | `git status --porcelain` shows the four release artifacts; `CHANGELOG.md` and `CHANGELOG.es.md` each contain a row for the bump | diff visible in commit | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command, or labelled `read-verified` — never unlabelled prose.

- **AC1 (command-verified)** — the inverted pattern is gone from both verified
  surfaces: `grep -rn "fold-findings, then re-run /review-change" skills/execute-phase/ skills/ship-roadmap/` → exit 0 with **0 matches**.
- **AC2 (command-verified)** — every reordered block leads with the review:
  `grep -rn "→ Next: /review-change" skills/execute-phase/references/UNIT_LOOP.md skills/execute-phase/references/FOLDING.md skills/execute-phase/references/CLOSEOUT.md` → ≥ 3 matches, one per file.
- **AC3 (command-verified)** — verdict-following uses did not regress:
  `grep -c "fold-findings" skills/review-change/SKILL.md skills/review-plan/references/OUTPUT.md skills/review-spec/references/OUTPUT.md skills/review-implementation/references/CLASSIFY.md skills/fold-findings/SKILL.md` → all counts ≥ 1.
- **AC4 (command-verified)** — the discipline suite is green with the new pin:
  `node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` → all tests pass; at least one assertion in `next-recommendations.test.mjs` matches the canonical order on `UNIT_LOOP.md`.
- **AC5 (command-verified)** — full gate: `npm test` → all pass.
- **AC6 (command-verified)** — no "mandatory" fold wording remains:
  `grep -rn "mandatory \`/fold-findings\`\|mandatory \`/fold-findings" skills/execute-phase/` → 0 matches; `grep -n "mandatory" skills/execute-phase/references/CLOSEOUT.md` matches only the review-mandatory sentences.
- **AC7 (command-verified)** — context budgets still pass for both edited skills: `node scripts/check-skill-context.mjs` → exit 0.
- **AC8 (command-verified)** — release bookkeeping: `grep -n "4.4.1" skills/execute-phase/SKILL.md CHANGELOG.md CHANGELOG.es.md` → ≥ 1 match per file, and `grep -n "5.2.1" skills/ship-roadmap/SKILL.md CHANGELOG.md CHANGELOG.es.md` → ≥ 1 match per file.
- **AC9 (read-verified)** — `CHANGELOG.md` and `CHANGELOG.es.md` carry faithful
  sibling rows for the same bumps in the same change (CLAUDE.md bilingual hard
  rule); `bundle:skills` re-bundle output committed.
- **AC10 (read-verified)** — every edited hand-off block's wording matches the
  canonical correction path already declared by
  `skills/review-change/SKILL.md` ("On `REVIEW-FAIL` the manual correction path
  is `/fold-findings`, then re-run `/review-change` …") — same order, same
  two-cycle pointer where the block already carried it.

### Spec-lint (mechanical — presence checks only)

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint (results recorded below).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001),
      the root cause (PE-002), the regression scope (PE-003), and the rollback
      path (PE-007) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Phases

Execution ledger — `execute-phase --fix 191` runs all remaining phases by
default; an explicit `P<n>` runs exactly one phase. Final phase is
`Hardening & PR` (pre-written tasks kept literally).

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

- P1: `Phase-lint: PASS (8/8) · fingerprint P1:docs:8:reorder-review-fold-handoffs`
  (single layer `docs`; 8 tasks; one deliverable).
- P2: `Phase-lint: PASS (8/8) · fingerprint P2:hardening:7:hardening-pr-closeout`
  (test-only/hardening layer; literal close-out chain).

### P1 — Reorder review-fold hand-offs across execute-phase and ship-roadmap

Layer: `docs`. Done-when:
`grep -rn "fold-findings, then re-run /review-change" skills/execute-phase/ skills/ship-roadmap/` → 0 matches, and `node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` → all pass.

- [x] Red-first: add to `scripts/next-recommendations.test.mjs` a test asserting the canonical order on the execute-phase terminal blocks (`UNIT_LOOP.md` `→ Next:` line leads with `/review-change`, fold named only after it; `FOLDING.md` same; `CLOSEOUT.md` hand-off sentence same; no `mandatory` wording on the fold in `execute-phase/SKILL.md`) — run it and paste the red output before editing the skills. (RED confirmed: new test failed on `→ Next: /fold-findings, then re-run /review-change` in UNIT_LOOP.md before edits.)
- [x] Reorder the terminal block in `skills/execute-phase/references/UNIT_LOOP.md` to `→ Next: /review-change on the changed HEAD …` with the fold only as the correction leg after a `REVIEW-FAIL` (keep the `/audit-pr` merge-gate sub-bullet).
- [x] Reorder the hand-off block in `skills/execute-phase/references/FOLDING.md` the same way, preserving the existing `·` alternatives (clean → `/audit-pr`; findings → fold; docs-site line unchanged).
- [x] Reconcile `skills/execute-phase/references/CLOSEOUT.md`: keep the mandatory-review sentence, rewrite the recommend paragraph and the "hand off to `/fold-findings`" sentence to the review-first order (the fold is conditional on findings).
- [x] Rewrite `skills/execute-phase/SKILL.md` "Relationship to other skills" paragraph and the "Done when" bullet to the review-first order and drop the word "mandatory" from the fold hand-off (mandatory applies to the review).
- [x] Rewrite `skills/execute-phase/references/BATCH_AND_PORTABILITY.md` close-out line and fresh-context driver step 3 (`READY_FOR_REVIEW` routes to `/review-change`; fold follows only on `REVIEW-FAIL`).
- [x] Rewrite the three ship-roadmap surfaces to the review→fold order: `skills/ship-roadmap/SKILL.md` model table cell, `skills/ship-roadmap/references/ADVANCE.md` REVIEW bullet, `skills/ship-roadmap/references/MODEL_ROUTING.md` "Final review/correction loop" row.
- [x] Green check: update the red-first pin if wording drifted, run the full discipline suite (`node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs`), then `npm test` — paste all outputs; commit P1. (Discipline suite: 8 pass / 0 fail; full gate run below.)

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (`npm test` + `node scripts/check-skill-context.mjs`) and paste commands + exit codes (root has no `npm test` — bun islands; ran discipline suite exit 0, `node scripts/check-skill-context.mjs` exit 0, `bun run test` in the touched pi package exit 0)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip (commit `35f0aace`)
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #191`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

## Testing

- Layer: docs (skills). No runtime code exists — the "tests" are the repo's
  discipline suite, which greps the skill text. The new red-first pin in
  `scripts/next-recommendations.test.mjs` is the regression test for this fix
  (AC4); the full suite (`npm test`) guards every other pin (AC5).
- Regression-risk test: AC3 pins the verdict-following uses so the reorder cannot
  accidentally strip correct second-leg fold wording.

## Rollback

Single `git revert` of the PR's commit(s) on `fix/191-handoff-review-fold-order`
(or PR-revert on the forge); re-run `npm test` after revert. Data-side cleanup:
none — docs-only change. Nothing is preserved or lost beyond the wording.

## Observability

Not applicable at runtime — this repository has no deployed application. Health
proof is the green gate: `npm test` and `node scripts/check-skill-context.mjs`
in CI on the PR, plus the issue auto-close (`Closes #191`).

## Affected docs

- `CHANGELOG.md` + `CHANGELOG.es.md` — EN row per bump + faithful ES sibling
  (bilingual hard rule) → covered by AC8/AC9.
- No other human docs touch this wording (`docs/workflow/*` grep confirms the
  inverted pattern does not appear there — verified 2026-09-08; if execution
  finds a stray hit inside `docs/`, it folds in-unit as the same mechanical edit).

## Cross-issue notes

- #172 (review-pack consistency / fold-flag ownership) — open; declares
  ownership of the fold flag, not the hand-off order. No dependency; record
  this fix's canonical order there if it lands later. Decision: no dependency.
- #182 (receipt scoping / audit-pr hygiene owner) — open; `audit-pr` remains the
  merge gate in the reordered blocks. No dependency. Decision: no dependency.
- #180 (versioned skills releases) — open; this fix does manual bumps per
  current convention. Decision: no dependency.

## Effort

**S** (≤ 4h, 2 commits): eight mechanical text reorders + one test pin + release
bookkeeping across two skills; no behavioral logic to re-derive.

## Security risks

n/a — docs-only change to skill text; no auth, secrets, PII, webhooks, or
rate-limit surface.

## Operational risks

None at runtime. Text-only edits to two skills; risk is limited to pinned-test
drift, guarded by the discipline suite and context budgets (AC4, AC5, AC7).

## Compliance touchpoints

n/a.

## Impact

- Layers touched: `docs` (skill text) — single layer, no code.
- Files: the eight surfaces listed in `### In scope` plus
  `scripts/next-recommendations.test.mjs`, `CHANGELOG.md`, `CHANGELOG.es.md`,
  `docs/fix/README.md`, and the `bundle:skills` mirror output.
- Blast radius: users of `execute-phase` and `ship-roadmap` terminal hand-offs
  (every unit close-out); no other skill's text changes.
- Detection lead time: immediate — the discipline suite and grep gate the change
  before merge; no runtime telemetry exists for skill text.

## Rules that must never be violated

- "Complete dynamic hand-offs" (`CLAUDE.md`): every closing recommendation names
  the real next commands, no placeholders — a fold-first recommendation names an
  impossible step, so the review must lead.
- "Checklists over heuristics" (`CLAUDE.md`): reordered blocks keep the exact
  `→ Next:` + `·` sub-bullet shape.
- The two-cycle review→fold cap (`skills/review-change/references/REVIEW_PROCESS.md`)
  stays intact — this fix changes only ordering and labeling, never the bounds.
- Bilingual hard rule (`CLAUDE.md`): the `CHANGELOG.es.md` sibling row ships in
  the same change.

## Status

`pending`

(Removed from `docs/fix/README.md` only **after** the PR merges.)
