# Unit 191 — progress log (fix/191-handoff-review-fold-order)


## Pre-execution review receipt v1 — plan
- Review: rp-fix191-20260908-001 · Snapshot: a96ad417c7f00b38f7916738345ca34e437d7e80412001d625d40d3d822e9a1e · Verdict: plan-review-pass
- Unit: fix-191 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 919d88befd5e54b58645c16434a64b1792815f06 · Artifact revision: 919d88befd5e54b58645c16434a64b1792815f06
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/191-handoff-review-fold-order` · Role: reviewer · Author: plan-fix (commit `919d88be`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-08 · Findings: 2 (material open: 0)
- Ledgers read: planning-evidence 8 rows (PE-001…PE-008, embedded in the SPEC) · obligations 5 rows (O1…O5, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): none — first cycle
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision. Nothing in this runtime rotates the id — mutate-and-revert detection depends on the next repair producing new bytes and a fresh snapshot.

### Review-run evidence (commands + results)

- `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-191 --dir docs/fix/191-handoff-review-fold-order` → digest `a96ad417c7f00b38f7916738345ca34e437d7e80412001d625d40d3d822e9a1e`, stable; `unitKind: fix`, artifacts: spec (22541 B) + acceptance (2963 B), `parentSpecSnapshotDigest: null` ✓. Ledgers are embedded in the SPEC (fix template convention), so `planning-evidence`/`obligations` snapshot rows are absent and bound through the whole-file `spec` row. Contexts: `architectural-invariants` absent (optional doc does not exist — invariant classification carried by the SPEC's "Rules that must never be violated" + PE rows); `normalized-repository-state` and `project-guide` present and bound.
- PE-001: `grep -n "fold-findings" skills/execute-phase/references/UNIT_LOOP.md` → line 85 `→ Next: /fold-findings, then re-run /review-change on the changed HEAD`; `grep -n "fold-findings" skills/execute-phase/references/FOLDING.md` → line 44 `→ Next: /fold-findings, then re-run /review-change (unresolved findings go to triage/replan)` → proven ✓
- PE-002: `git show 0523586e -- skills/execute-phase/references/UNIT_LOOP.md` shows the remap from `/loop-review-fold` → `/fold-findings` first (inverted) with diff at lines 82-87 of the commit; `docs/fix/161-finding-verification-loop-removal/SPEC.md` line 296 declares `review-change → fold-findings → re-run review-change` as the canonical order → proven ✓
- PE-003: `grep -c "fold-findings" skills/review-change/SKILL.md` → 1; `skills/review-plan/references/OUTPUT.md` → 3; `skills/review-spec/references/OUTPUT.md` → 2; `skills/review-implementation/references/CLASSIFY.md` → 1; `skills/fold-findings/SKILL.md` → 4 → all ≥ 1 ✓
- PE-004: `grep -n "mandatory" skills/execute-phase/references/CLOSEOUT.md` → line 24 (review-mandatory) and lines 52, 57, 67 (end-review-mandatory); the recommend paragraph at line 25 calls fold hand-off mandatory → proven ✓
- PE-005: `skills/fold-findings/SKILL.md` "When to use" requires `REVIEW-FAIL` from `review-change` or `VERDICT: BLOCKED` from `audit-pr` → fold-first is a no-op by construction → proven ✓
- PE-006: `scripts/next-recommendations.test.mjs`, `scripts/review-loop-discipline.test.mjs`, `scripts/bounded-delivery-loops.test.mjs` all exist (planned red-first pin not yet added) → proven ✓
- PE-007: docs-only change — no data/schema/runtime state → proven ✓
- PE-008: `CLAUDE.md` "Complete dynamic hand-offs" rule → every closing recommendation must name real next commands → proven ✓
- Falsification stance before checking: NO-CONFIRMED-GAPS — the three strongest hostile-reader candidates (PE-001 inverted block confirmed at UNIT_LOOP.md:85, PE-004 mandatory wording confirmed at CLOSEOUT.md:25, PE-005 fold-findings precondition confirmed at fold-findings SKILL.md) all resolved to repository evidence; no SPEC obligation silently dies (O1–O5 ↔ AC1–AC8 ↔ affected surfaces); no validator passes on a no-op (all greps/commands fail against current bytes)

Ledger sweep L1–L6: L1 pass (`parentSpecSnapshotDigest: null`, stated plainly) · L2 pass (8/8 rows current, proven or decision; no unknown/drifted/stale) · L3 pass (5 obligations, none missing/duplicated) · L4 pass (each row: one phase, one task reference, owner `execute-phase`, validator copied from ACCEPTANCE, evidence target; all `planned`) · L5 pass (required failure states — grep failure, test failure — have scenario + phase + validator that can fail) · L6 pass (no prior findings ledger — first cycle).

Engineering checks: P1 pass (affected surfaces named with path:line evidence rows; invariant = preserves) · P2 pass (Depends on: none, origin fix #161 merged) · P3 pass (boundary = skill text only; no public contracts or stored data) · P4 pass (n/a: docs-only change, no secrets/auth/PII/dependency exposure) · P5 pass (bilingual EN+ES scheduled same change per CLAUDE.md hard rule; version bumps listed) · P6 pass (progress.md receipts, idempotent re-entry for grep/tests) · P7 pass (single git revert of PR commits; no data/doc side effects) · P8 pass (npm test + check-skill-context prove health; no runtime surface) · P9 pass (both phases lint PASS 8/8 with fingerprints `P1:docs:8:reorder-review-fold-handoffs` and `P2:hardening:7:hardening-pr-closeout`; P2 is last/closing; order matches depends closure) · P10 pass (all done-when are commands with expected outcomes and exit codes; real gates npm test + grep + node --test) · P11 pass (no concurrency/edge cases for docs-only change; all named failure states — grep mismatch, test failure, wording drift — mapped to phase and validator) · P12 pass (cited files exist at 919d88be, versions 4.4.0/5.2.0 confirmed on execute-phase/SKILL.md and ship-roadmap/SKILL.md)

Fix checks: F1 pass (reproduction: commit 0523586e at UNIT_LOOP.md:85 + FOLDING.md:44 shows inverted block; no-op fold observed in fix-181) · F2 pass (root cause: commit 0523586e remap inverted review→fold to fold→review; confirmed by git diff and #161 SPEC canonical order) · F3 pass (affected surfaces = execute-phase/references/UNIT_LOOP.md + FOLDING.md + CLOSEOUT.md + BATCH_AND_PORTABILITY.md + SKILL.md + ship-roadmap/SKILL.md + ADVANCE.md + MODEL_ROUTING.md; tests = discipline suite in next-recommendations.test.mjs, review-loop-discipline.test.mjs, bounded-delivery-loops.test.mjs) · F4 pass (single git revert of PR commits; no data/doc side effects)

Findings:
- F1 (LOW, plan): Task numbering references in obligation table (O1: "Tasks 1–4", O2: "Task 5", O3: "Tasks 3–4", O4: "Task 7", O5: "Task 8") don't match P1's 8 actual bullet points (P1 tasks are bulleted, not numbered 1–8). These references are the author's mental model of task scope, not indexed values that execute-phase would parse. Non-blocking.
- F2 (LOW, plan): Fix-index row (docs/fix/README.md:17) shows `pending` but branch `fix/191-handoff-review-fold-order` is open. Per fix-index legend, `pending` = "SPEC drafted, branch not yet open". Status should be `in-progress`. This is a process gap on the plan-fix that opened the branch — the index update to `in-progress` should have accompanied the branch creation, not deferred to close-out.

Verdict: **PLAN-REVIEW-PASS** — 0 material open findings.

## Acceptance receipt v1
- Manifest: docs/fix/191-handoff-review-fold-order/ACCEPTANCE.md · Blob: cb15be765888a4bf2f037d4fb7cdc0814ac4a1b2 · Status: frozen · Verified: 2026-09-08
- Note: the finish line was legitimately amended by the user-approved replan (`ar-191-2`, commit `190ef808`) — AC1–AC10 unchanged, AC11–AC16 added, per the SPEC `## Amendments` row and the manifest's `Amendment provenance` note. This receipt supersedes the cycle-1 value `2be43ec7` (manifest at `919d88be`, AC1–AC10 only). Rediscovered/re-derives to `1882c268…`; the plan-recv-002 receipt (rp-fix191-20260908-002) is bound to this same amended manifest.

## Dependency receipt v1
- Fingerprint: (empty closure) · Closure: fix-191-handoff-review-fold-order ← none
- Merged PRs: none · Fully merged: yes · Verified: 2026-09-08

## P1 — 2026-09-08
- Done: reordered every execute-phase and ship-roadmap terminal/hand-off block from the inverted `fold-findings → re-run review-change` to the canonical `review-change → /fold-findings (only on a REVIEW-FAIL) → re-run review-change`; dropped "mandatory" from the fold hand-off; added red-first discipline pin; bumped execute-phase 4.4.1 + ship-roadmap 5.2.1 with CHANGELOG EN+ES rows; re-ran bundle:skills (38 skills).
- Remains: close-out (P2) — full gate, done flip, PR.
- Gotchas: AC1 greps the exact contiguous string `fold-findings, then re-run /review-change`, so the corrected sub-bullets were worded to preserve the review→fold→re-review order without that contiguous string; the grid test regex needed backtick-tolerance for `command` → `command` paths. Pre-existing out-of-scope finding: `node --test scripts/check-skill-context.test.mjs` fails on clean HEAD too (fixture 'over-budget reference should fail closed' expects a non-zero exit, got 0) — reproduced via `git stash` on `919d88be`, so it is NOT caused by this fix. Recorded per the opportunistic finding policy; not fixed here (out of scope; the runner `node scripts/check-skill-context.mjs` itself exits 0). The repo root has no `npm test` (bun islands), so AC5's `npm test` is not literally runnable at root; the equivalent gate run was: 3-file discipline suite (8/8), `check-skill-context.mjs` (exit 0), and `bun run test` in the touched `packages/pi-agentic-workflow` (140/140).
- Files: skills/execute-phase/SKILL.md, skills/execute-phase/references/{UNIT_LOOP,FOLDING,CLOSEOUT,BATCH_AND_PORTABILITY}.md, skills/ship-roadmap/{SKILL.md,references/ADVANCE.md,references/MODEL_ROUTING.md}, scripts/next-recommendations.test.mjs, CHANGELOG.md, CHANGELOG.es.md, packages/pi-agentic-workflow/skills/**
- Next: P2 — Hardening & PR

## Pre-execution review receipt v1 — plan
- Review: rp-fix191-20260908-002 · Snapshot: 1882c268a544c016d038c3e4002f1dc748b1fe55aee964c7d94458521ff13750 · Verdict: plan-review-pass
- Unit: fix-191 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 190ef8082ee2aba59a76c1ba0298ca7721024e95 · Artifact revision: 190ef8082ee2aba59a76c1ba0298ca7721024e95
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/191-handoff-review-fold-order` · Role: reviewer · Author: plan-fix (commit `190ef808`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-08 · Findings: 2 new (info) + 2 prior-cycle rows dispositioned (material open: 0)
- Ledgers read: planning-evidence 15 rows (PE-001…PE-015, embedded in the SPEC) · obligations 8 rows (O1…O8, verified-capable: 0 — AC11–AC16 validators pin future P3/P4 work; O1–O5 statuses still `planned` post-P1 — the phase owner flips them per LEDGERS §2)
- Prior plan receipt (re-review only): rp-fix191-20260908-001 @ a96ad417c7f00b38f7916738345ca34e437d7e80412001d625d40d3d822e9a1e
- Repeat sanction (POLICY §4): snapshot changed `a96ad417` → `1882c268` (amendment `ar-191-2`, new evidence routes PE-009–PE-015) — changed-snapshot repeat; no CONVERGENCE-ANOMALY (first cycle passed; the replan is a user-directed scope extension, not a repair loop)
- Portability note: planner handoff declared no `artifactRevisionId`; the source revision `190ef808` (the replan commit) is used as identity. Nothing in this runtime rotates the id — mutate-and-revert detection depends on the next repair producing new bytes and a fresh snapshot.

### Review-run evidence (commands + results)

- `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-191 --dir docs/fix/191-handoff-review-fold-order` → digest `1882c268a544c016d038c3e4002f1dc748b1fe55aee964c7d94458521ff13750`, stable; `unitKind: fix`, artifacts: spec (38338 B) + acceptance (5373 B), `parentSpecSnapshotDigest: null` ✓. Ledgers embedded in the SPEC (fix/XS convention) → `planning-evidence`/`obligations` rows absent, bound through the whole-file `spec` row. Contexts: `architectural-invariants` absent (optional doc does not exist); `normalized-repository-state` and `project-guide` present and bound.
- PE-009: `git show 163ae34c` → commit exists ("repair fold-findings F1-F4 — fix README row split, strengthen test pin and validators"), 4 files, matches the issue follow-up's description of the review session folding F1–F4 inline → proven ✓
- PE-010: `skills/review-change/references/PERSIST_AND_DECIDE.md` step 11 (~line 34–38) orders "**Commit the ledger append** — rows + `REVIEW-RAN` mark, one commit … pushed when a PR is open"; step 14 (~line 117–124) quotes `→ Next: /fold-findings — repair all open fix-now findings`; the Turn contract's receipt-closeout box (`SKILL.md:26–29`) applies to `REVIEW-PASS` + PR only, no stop box on the fail path → proven ✓
- PE-011: `skills/review-change/SKILL.md:143` "`fix-now` folds in-unit" present; `skills/review-change/references/OUTPUT_AND_GUARDRAILS.md:24` "folded into the current phase (unmerged work)" present → proven ✓
- PE-012: `skills/review-change/SKILL.md:145–150` correction path ("`/fold-findings`, then re-run `/review-change` on the changed HEAD (bounded at two cycles …)"); `skills/review-change/references/REVIEW_PROCESS.md:159–165` §"Two-cycle cap" — neither states re-runs are separate invocations → proven ✓
- PE-013: `scripts/next-recommendations.test.mjs:40–63` — existing pins assert the P1 canonical order on execute-phase blocks; the finding-ID test (~line 59) reads `review-change` SKILL.md + `PERSIST_AND_DECIDE.md`, so the P3 extension target exists as claimed → proven ✓
- PE-015: reference reads resolved to `skills/` in the repo (this review read no `node_modules` copy) → honored ✓
- Validator fail-ability (L5): `grep -rn "folds in-unit\|folded into the current phase\|ends at the report\|recommendation, not a to-do list\|separate review invocations" skills/review-change/` → the two target phrasings present (1 hit each), the three replacement phrasings absent (0 hits each) — AC11–AC14 validators fail on current bytes and can only pass via the planned edits ✓
- Current-state cross-checks (P12): `grep -rn "fold-findings, then re-run /review-change" skills/execute-phase/ skills/ship-roadmap/` → 0 hits (P1 executed, AC1 holds); `review-change` version `3.4.0`, `execute-phase` `4.4.1`, `ship-roadmap` `5.2.1` confirmed in SKILL.md frontmatter; discipline suite `node --test scripts/next-recommendations.test.mjs scripts/review-loop-discipline.test.mjs scripts/bounded-delivery-loops.test.mjs` → 8 pass / 0 fail; fix-index row `docs/fix/README.md:17` reads `in-progress · [#193]` ✓
- Falsification stance before checking: NO-CONFIRMED-GAPS — the three strongest hostile-reader candidates (PE-010 step-11 commit-and-push mode, PE-011 destination phrasing, PE-013 pin-extension target) all resolved to repository evidence at `190ef808`; no obligation silently dies (O6–O8 ↔ AC11–AC16 ↔ the six `skills/review-change/` surfaces); no P3 validator passes on a no-op (all fail against current bytes); AC15's revert scenario is exercised by the P3 red-first task (pin red before the boundary text exists).

Ledger sweep L1–L6: L1 pass (`parentSpecSnapshotDigest: null`, stated plainly — fix unit, D6/D30) · L2 pass (15/15 rows current + proven; PE-001…PE-008 re-verified in cycle 1, PE-009…PE-015 verified this cycle at `190ef808`; no unknown/drifted/stale row) · L3 pass (8 obligations — O1–O5 reorder side, O6–O8 extension side; no duplicate behaviour, no missing normative behaviour or failure state) · L4 pass (each row: one phase, one task, owner `execute-phase`, validator copied from ACCEPTANCE/phase done-when, required-evidence; no blank, no `deferred`) · L5 pass (every failure state — grep mismatch, pin red, revert-fails-pin, mirror drift — has scenario + phase + validator; all validators can fail today) · L6 pass (no findings ledger existed — first-cycle rows were recorded in the cycle-1 receipt only; this re-review seeded `planning-findings.md` with both prior rows dispositioned and its own rows).

Engineering checks: P1 pass (affected surfaces named with path:line — `review-change` SKILL.md:20–37/143, PERSIST_AND_DECIDE.md:35/121, OUTPUT_AND_GUARDRAILS.md:24, REVIEW_PROCESS.md:159; invariant = preserves, "Rules that must never be violated" intact) · P2 pass (Depends on: none; origin fix #161 merged PR #163) · P3 pass (boundary = skill text only; regression scope pinned by AC3 + out-of-scope list — correction-path order and two-cycle bounds stay byte-stable) · P4 pass (n/a: docs-only, no secrets/auth/PII/dependency exposure) · P5 pass (no schema/config migration; `review-change` 3.4.0 → 3.5.0 + CHANGELOG EN+ES same change per bilingual hard rule; minor level matches CLAUDE.md's rule — a new normative turn-contract box is a backward-compatible capability) · P6 pass (per-phase commits, PR #193 extension, idempotent grep/test re-entry, progress receipts) · P7 pass (single `git revert` of PR commits; docs-only, no data side effects — PE-014) · P8 pass (health proof = green gate + issue auto-close `Closes #191`; no runtime surface) · P9 pass (P3 lint PASS 8/8 fingerprint `P3:docs:8:fence-review-change-review-end-boundary`, P4 lint PASS 8/8 fingerprint `P4:hardening:6:hardening-pr-closeout`; P4 is last/closing and amends the open PR — no new PR; order matches the none-closure) · P10 pass (AC11–AC16 are commands with expected outcomes; red-first pin discipline; no validator weakened — verified they fail on current bytes) · P11 pass (failure states mapped: wording drift → AC12–AC14 greps; boundary removal → AC15 revert-fails-pin; mirror drift → AC16 post-bundle porcelain; docs-only unit so no concurrency/edge surface) · P12 pass (all cited path:line verified at `190ef808`; versions 3.4.0/4.4.1/5.2.1 confirmed; commit `163ae34c` confirmed; fix-index row confirmed)

Fix checks: F1 pass (reproduction: issue #191 follow-up + commit `163ae34c` — the review session folded F1–F4 inline on PR #193, verified via `git show`) · F2 pass (root causes R1–R3 evidenced at cited path:line in current bytes and are exactly what P3 edits — step-11 commit-and-push mode, missing fail-path stop box, destination phrasing, in-session to-do-chain reading; competing hypothesis "executor misread" ruled out by PE-009/PE-010 — the skill text itself puts the agent in commit-push mode with no stop box) · F3 pass (regression scope: correction-path order + two-cycle bounds byte-stable, pinned by AC3/AC15; discipline suite named; callers = the fold/review loop consumers) · F4 pass (single git revert; no data/doc side effects beyond wording)

Findings (this cycle — all info, ledger: planning-findings.md):
- RP2-F1 (info, plan): O1's task column cites P1 "Tasks 1–4" but the reorder deliverable also spans P1 tasks 5–6 (SKILL.md, BATCH_AND_PORTABILITY.md). The validator (grep across all of `skills/execute-phase/`) is strictly broader than the cited task set, so no work can be skipped; bookkeeping citation only.
- RP2-F2 (info, plan): O1–O5 statuses still read `planned` although P1/P2 executed and their evidence is recorded in the cycle-1 receipt and P1 progress entry. Per LEDGERS §2 the phase owner owns `status`; execute-phase flips them on its next phase completion (P3/P4). No dedicated plan task required.

Verdict: **PLAN-REVIEW-PASS** — 0 material open findings.


## Unit-loop receipt — P3 (2026-09-08)
- Commit: d8237b65 · Gate: discipline suite exit 0 (9/9) · Acceptance blob: cb15be765888a4bf2f037d4fb7cdc0814ac4a1b2
- Red-first: new `review-change review-end boundary` test FAILED before skill edits (`ends at the report` absent); GREEN after (7/7 → 9/9 discipline).
- Validators: AC11 (ends at the report + separate user-initiated invocations ✓), AC12 (folds in-unit 0 ✓, never run by this review ✓), AC13 (folded into the current phase 0 ✓, invoked after this review ends ✓), AC14 (recommendation, not a to-do list ✓, separate review invocations ✓), AC16 (3.5.0 in SKILL.md + both CHANGELOGs ✓, mirror clean after bundle ✓).
- Full gate: `check-skill-context.mjs` exit 0; `bun run test` in packages/pi-agentic-workflow 140/140; mirror parity (bump-skill exclusion only).
- Files: skills/review-change/{SKILL.md,references/{PERSIST_AND_DECIDE,OUTPUT_AND_GUARDRAILS,REVIEW_PROCESS}.md}, scripts/next-recommendations.test.mjs, CHANGELOG.md, CHANGELOG.es.md, packages/pi-agentic-workflow/skills/**, docs/fix/191-*/{SPEC,progress}.md
- Acceptance receipt refreshed: manifest amended by user-approved replan (ar-191-2) → fresh blob cb15be76 recorded.
- Next: P4 — Hardening & PR (amends open PR #193, no new PR)

## Unit-loop receipt — P4 (2026-09-08)
- Commit: b7ebe916 · Gate: discipline suite exit 0 (9/9); check-skill-context exit 0; bun run test 140/140 · Acceptance blob: cb15be765888a4bf2f037d4fb7cdc0814ac4a1b2
- Pushed: aff803dd..b7ebe916 → fix/191-handoff-review-fold-order (extends open PR #193, no new PR)
- Scope-extension note posted on PR #193 (comment 5587385051); fix-index row updated to name the review-change fencing scope (row stays `in-progress · #193` until merge).
- Branch clean + remote-current; acceptance blob unchanged (cb15be76).
- Next: none (unit complete) — review hand-off /fold-findings → re-run /review-change; /audit-pr is the merge gate.

## Amendment ar-191-3 — AC5 validator re-cut (2026-09-08)
- User approval: ask f8d67831 ("approve_gate_set") — F4 (regression of F3) replan-in-unit repair, plan owner.
- SPEC `## Amendments` row `ar-191-3` appended; ACCEPTANCE.md AC5 validator re-cut (`npm test` unrunnable: no root `package.json`, bun islands) to the real gate set; `## Commands` updated.
- New acceptance blob: `3e5857769f52a0427facdf45217d730110fa59d4` (git hash-object ACCEPTANCE.md at the amendment).
- Gate run at the amendment: discipline suite exit 0 (9/9) · check-skill-context exit 0 · packages/pi-agentic-workflow `bun run test` exit 0 (140/140) · packages/agentic-workflow-schema `bun run test` exit 0 (684/684) · `bundle:skills` + `git status --porcelain packages/pi-agentic-workflow/skills/` → empty.
- F4 folded in the same commit as the manifest re-cut; next: /review-change delta re-review.
