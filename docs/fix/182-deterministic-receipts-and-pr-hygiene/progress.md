# Unit 182 — progress log (fix/182-deterministic-receipts-and-pr-hygiene)

## Pre-execution review receipt v1 — plan
- Review: rp-fix182-20260917-001 · Snapshot: 2f2471eeb5a2d49c93e8076bdcd7960378bd9462d93f1e0801e392ab8fb9b4d0 · Verdict: plan-review-fail
- Unit: fix-182 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: f971a03e52fd8106ad33f6623f6987111e758db6 · Artifact revision: f971a03e52fd8106ad33f6623f6987111e758db6
- Reviewer: review-plan (review-only turn) · Session: 01a0b1b2-493d-7302-a9d2-cf1a1ddf35c0 · Role: reviewer · Author: plan-fix (commits c541aac5 + f971a03e)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T23:27:26Z/2026-09-17T23:33:06Z · Findings: 2 (material open: 2)
- Ledgers read: planning-evidence 10 rows (PE-001…PE-010, embedded in the SPEC) · obligations 9 rows (O1…O9, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): none — first cycle

Notes:
- Snapshot built by `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix`; `validated: schema` (digest stable across builds). Rows: `spec` → SPEC.md (37816 B, `baf3edd3ddae288e298c933a3a0db6c4cf8b52b2f0bd5477125af8de72a0c77c`) + `acceptance` → ACCEPTANCE.md (3794 B, `fea076d94e250e81a54af691510611ff7f3130987c5f9f13875ac0c941b5fe16`); `planning-evidence`/`obligations`/`tasks`/`testing`/`decisions`/`plan`/`architecture-notes` rows absent (fix template: SPEC + ACCEPTANCE are the source of truth; the two planning tables are embedded in the SPEC and bound through the whole-file `spec` row). Contexts: `project-guide` (CLAUDE.md) and `normalized-repository-state` (docs/workflow/REPOSITORY_STATE.md) present and bound; `architectural-invariants` absent — the optional project doc does not exist (NRS F010), so the SPEC's invariant classification `n/a` is evidence-backed. `parentSpecSnapshotDigest: null` — no fabricated Product half (D6/D30); progress.md carried no `stage: spec` receipt before this review.
- Manual-runtime disclosure (Portability): no runtime rotates `artifactRevisionId`; the planner's declared `ar-fix182-20260917-plan-1` is carried here in the notes while the receipt field carries the derived content revision (`f971a03e`, the SPEC-draft commit). Mutate-and-revert detection depends on any future plan write producing new bytes and a fresh snapshot.
- Falsification stance before checking: **CONFIRMED-GAPS** — PF-1 survived falsification with a reproduced, code-level absence (no `emit` CLI test exists anywhere; the refusal has no fixture seam). Hostile-reader attacks that were refuted with evidence: PE-003's "26 files" recomputed from `git show --stat c541aac5` (26); PE-008's single-owner claim recomputed (`scripts/audit-pr-receipt.test.mjs:19-26` imports the runtimes, zero local `REVIEW_MARKER_RE`); PE-004's single-revert rollback is executable (no unit commit after `c541aac5` touched the 26 files — `8f151bc0` touched `docs/LOGS.md`, `f971a03e` the unit folder); PE-009's row-35 boundary re-read in `docs/features/ROADMAP.md:35` and `docs/fix/README.md`.
- Ledger sweep (L1–L6): L1 pass (fix snapshot parent is `null` and the receipt states it — no invented lineage); L2 pass (PE-001…PE-010 resolve, none `unknown`, none `drifted`/`stale`; PE-004 `not-applicable` + `decision` is the sanctioned shape for a derived decision row, ROWS.md); L3/L4 pass (O1–O9 row by row — none blank, none `deferred`, none duplicated, each exactly one phase/task/owner/validator/evidence; AC1–AC9 each map to an obligation); L5 **finding PF-1/PF-2** (two named failure states point at validators that do not exercise them); L6 pass (no prior `planning-findings.md` rows existed — this review opens the ledger).
- Verification spot-checks at `f971a03e` (re-run live this turn): `node scripts/phase-lint.mjs docs/fix/182-…/SPEC.md` → `verdict PASS` with the exact recorded fingerprint `a4244d3853e066ec83eabb719707ee65386da31a51249d10ab7c6804ea360994`; `node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs` → 55 pass / 0 fail; `node --test scripts/*.test.mjs` (root suite) → 528 pass / 0 fail; `cd packages/pi-agentic-workflow && bun run test` → 224 pass / 0 fail; `bun scripts/check-skill-context.mjs` → `PASS context budgets: 40 skills`; `node scripts/audit-pr-gate.mjs hygiene` → exit 2 with `branch-pushed: fail` ("branch is 1 commit(s) ahead of its remote") and `tree-clean`/`pr-ready` `pass`; `grep -c "review-receipt.mjs emit" skills/review-change/SKILL.md` = 1, `grep -c "audit-pr-gate.mjs hygiene" skills/audit-pr/SKILL.md` = 1, `grep -c "session-close.mjs close" skills/log-session/SKILL.md` = 2, `grep -c "review-receipt.mjs" scripts/audit-pr-receipt.test.mjs` = 1, AC9 grep = 1. `GATE_NAMES` is exactly the 13 declared names (`scripts/audit-pr-gate.mjs:49-64`); versions match (review-change 3.6.0, audit-pr 5.2.0, log-session 2.2.0, pi 0.11.0) and the pi mirror differs from `skills/` only by the deliberately excluded `bump-skill`.
- Failed checks: L5, P10, P11. Passing: L1, L2, L3, L4, L6, P1–P9, P12, F1–F4.
- Non-material observations (not findings): (a) the SPEC's `## Status` reads `in-progress` while `docs/fix/README.md` carries `pending` and the SPEC header says "registered … (`pending`)" — the fix-index flip is `execute-phase`'s (`P4`), so this is a label reading, not a plan defect; (b) the fix-index row carries an owner decision before merge (roadmap row 35 `scoped-receipt-verifier` cites #182, so `Closes #182` orphans the row) — the SPEC flags it in `## Cross-issue notes` and AC9 requires the SPEC to name it, so it is a disclosed human decision, not an engineering gap; (c) the batch-1 regression suites and the "red-first" claim are not verifiable from history because implementation and tests landed in one commit `c541aac5` — informational, the suites are green.
- Read-only: no reviewed artifact (`SPEC.md`, `ACCEPTANCE.md`, the roadmap, the fix-index row) was modified. Only this ledger (`progress.md`) and `planning-findings.md` were written.

## Dependency receipt v1
- Fingerprint: d5dcd84f3e017c172a8cd79ee783637f212bf06e · Closure: fix-182-deterministic-receipts-and-pr-hygiene ← (none declared)
- Merged PRs: none · Fully merged: yes (empty closure) · Verified: 2026-09-18

## Acceptance receipt v1
- Manifest: docs/fix/182-deterministic-receipts-and-pr-hygiene/ACCEPTANCE.md · Blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e · Status: frozen · Verified: 2026-09-18

## Preflight record (execute-phase --fix 182, whole-unit)
- Dependency gate: PASS — SPEC `Depends on` is empty; no closure to traverse.
- Own-status: n/a — fix unit has no roadmap-status equivalent (fix-index entry is its state).
- Pre-execution gate: PASS — newest `stage: plan` receipt `rp-fix182-20260917-002`, verdict `plan-review-pass`, snapshot `8f6126b308175af3b32c27c749966783393cf3f038d9cea752938220d8fce3ca`, `current: true`, `digestMatches: true`, `verdictIsPass: true` (`node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 0).
- Acceptance-manifest gate: PASS — `git hash-object ACCEPTANCE.md` = `3ff5b7f104954d80d218f1085ddc7ef4bac0421e`, matching the SPEC-recorded frozen blob.
- Phase-lint: PASS (8/8) all phases · fingerprint `f660b4dbe98cf247e700b9efe2175ee0ffe8b6e3535682192e8d942bd3f4ed81`.
- Architectural invariants: n/a — no project invariant document declared (NRS F010).
- Queue (reconciled against repository evidence): `P1, P4`. P2 and P3 tasks were verified already landed (`packages/pi-agentic-workflow/src/extension/receipt-guard.ts` + wiring + test; the AC7 greps ≥ 1; `CHANGELOG.md` rows; `SKILL_CONTEXT_BUDGETS.json`). P1 tasks 3 and 7 (the two CLI contract tests the repair batch declared) are absent from the tree — the phase's remaining work.

```text
IMPLEMENTATION MAP — fix-182 P1
Map revision: map-fix182-p1-20260918-1
Source identity: HEAD 15cc9c9f · clean source (git status --porcelain empty) · cited: scripts/review-receipt.mjs, scripts/audit-pr-gate.mjs, scripts/review-receipt.test.mjs, scripts/audit-pr-receipt.test.mjs, scripts/session-close.test.mjs
Authority: plan receipt rp-fix182-20260917-002 (8f6126b3) + SPEC/ACCEPTANCE 3ff5b7f1 + phase fingerprint P1:config/infra:8:deterministic-receipt-runtime-family
Planning evidence: PE-001 confirmed (pre-`c541aac5` prose loop replaced by the runtime), PE-002 confirmed (three prose contracts now runtimes), PE-008 confirmed (audit-pr-receipt.test.mjs imports the runtimes), PE-011 carried (PF-1/PF-2 repair = the two missing CLI tests)
Obligations: O1 (P1·3 `emit` moved-head refusal), O2 (P1·4 single grammar owner), O4 (P1·7 `hygiene --apply` CLI)
Entry points: scripts/review-receipt.mjs `emit` branch (refuses when `before.head !== opts.head`, throws naming both heads) · scripts/audit-pr-gate.mjs `hygiene` branch (`--apply` loops `stated.repairs` → `run("gh",["pr","ready"])`, then re-reads when repairs > 0)
Affected surfaces: scripts/review-receipt.test.mjs (adds the `emit` CLI case) · scripts/audit-pr-receipt.test.mjs (adds the `hygiene --apply` CLI case; needs `spawnSync`/`os` imports and a `script` path)
Current behaviour: both runtime paths exist and are reachable; only the CLI-level tests are missing — the pure decisions are already pinned
Reuse and constraints: fake-`gh`-on-`PATH` pattern from scripts/review-receipt.test.mjs render case (PATH override) and scripts/session-close.test.mjs `makeRepo` throwaway-git-repo pattern · `mkdtempSync` fixtures · no network · no forge · tests must not be weakened
Expected writes: scripts/review-receipt.test.mjs → O1 · scripts/audit-pr-receipt.test.mjs → O4
Validation: falsification probe = `node --test scripts/review-receipt.test.mjs scripts/audit-pr-receipt.test.mjs` (currently green with the two paths unexercised) · TDD target = both new CLI cases fail before the code they exercise would regress, i.e. they bind the runtime branch · phase gate = `node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs` exit 0
Plan assumptions: confirmed — the `emit` refusal and `hygiene --apply` loop are as PE-011 describes
Contradictions: none
Unknowns: none
Decision: READY
```

## Pre-execution review receipt v1 — plan
- Review: rp-fix182-20260917-002 · Snapshot: 8f6126b308175af3b32c27c749966783393cf3f038d9cea752938220d8fce3ca · Verdict: plan-review-pass
- Unit: fix-182 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: 81ee3ff609c450f1e273607913f932abab3ffbcb · Artifact revision: 81ee3ff609c450f1e273607913f932abab3ffbcb
- Reviewer: review-plan (review-only turn) · Session: 01a0b1d4-e377-7302-a9d2-cf2b10504a74 · Role: reviewer · Author: plan-fix (commits c541aac5 + f971a03e + 81ee3ff6)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T00:05:14Z/2026-09-18T00:12:00Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 11 rows (PE-001…PE-011, embedded in the SPEC) · obligations 9 rows (O1…O9, verified-capable: 0 — all validators pin work still to land)
- Prior plan receipt (re-review only): rp-fix182-20260917-001 @ 2f2471eeb5a2d49c93e8076bdcd7960378bd9462d93f1e0801e392ab8fb9b4d0

Notes:
- Snapshot built by `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` at source revision `81ee3ff6`; `validated: schema` (digest stable across builds). Rows: `spec` → SPEC.md (40444 B, `d261956b2eecb1e6bac8c601a08c1451055f2f4c314e4a05e3c0f517c8ea81a0`) + `acceptance` → ACCEPTANCE.md (3927 B, `316b953fb1618ecef9320f116ede918295ee3ea224da840a7b458f56028b21ce`); `planning-evidence`/`obligations`/`tasks`/`testing`/`decisions`/`plan`/`architecture-notes` rows absent (fix template; the two planning tables are embedded in the SPEC and bound through the whole-file `spec` row). Contexts: `project-guide` (CLAUDE.md, `ff24d7e4…`) and `normalized-repository-state` (docs/workflow/REPOSITORY_STATE.md, `e1b81e29…`) present and bound; `architectural-invariants` absent (NRS F010 → the SPEC's invariant classification `n/a` is evidence-backed). `parentSpecSnapshotDigest: null` (D6/D30).
- Manual-runtime disclosure (Portability): no runtime rotates `artifactRevisionId`, so the two receipt revision lines carry the derived content revision (`81ee3ff6`) that `verify` re-derives, while the planner's declared label `ar-fix182-20260917-plan-2` is recorded here beside it (POLICY §7 pairing, never a substitution). The prior review recorded the same split for `ar-fix182-20260917-plan-1` @ `f971a03e`.
- Falsification stance before the check table: **NO-CONFIRMED-GAPS**. Probe results: the two failure states PF-1/PF-2 named now point at P1 tasks 3 and 7, which declare the missing tests as plan work (`scripts/review-receipt.test.mjs` has no `emit` invocation today — 20 cases, zero `emit`; `scripts/audit-pr-receipt.test.mjs` tests `hygieneFromState` but no `hygiene --apply` CLI) — the declaration is the deliverable, and P1's done-when runs both suites, so the validator becomes fail-capable once the tasks land. Hostile-reader attacks refuted with evidence: PE-003 recomputed (`git show --stat c541aac5` → 26 files, 1916 insertions); PE-008 recomputed (`scripts/audit-pr-receipt.test.mjs:19-26` imports the runtimes, one `review-receipt.mjs` import); PE-009 re-read (`docs/features/ROADMAP.md:45` row 35 cites #182); PE-006/PE-007 re-read (`docs/LOGS.md:1603`); PE-001/PE-002 pre-fix bytes reproduced from `c541aac5^` (step 12 temp-file + retry prose; log-session "rides along with the next commit"); the ACCEPTANCE blob claim recomputed (`git hash-object ACCEPTANCE.md` → `3ff5b7f104954d80d218f1085ddc7ef4bac0421e`, matching the SPEC's recorded blob).
- Ledger sweep (L1–L6): L1 pass (fix parent `null`, stated, no invented lineage); L2 pass (PE-001…PE-011 resolve — `repository`/`proven` for the nine code/document claims, `derived`/`decision`/`not-applicable` for PE-004 and PE-011, the sanctioned shape); L3/L4 pass (O1–O9 row by row — none blank, duplicated, `deferred`, or unowned; each names one phase/task/owner/validator/evidence; AC1–AC9 each map to an obligation); L5 pass — the repair closed the two scenario↔validator gaps: "The PR head moved…" → P1·3 → AC1 (`emit` moved-head refusal test, fake `gh`), "A draft PR…" → P1·7 → AC4 (`hygiene --apply` CLI test), and `### Failure scenarios`/`## Testing`/O4/AC4 all name those tasks; L6 pass (PF-1/PF-2 `resolved` with resolution evidence and `resolving-artifact-revision ar-fix182-20260917-plan-2`; no open material row for the bound snapshot).
- Verification spot-checks at `81ee3ff6` (re-run live this turn): `node scripts/phase-lint.mjs docs/fix/182-…/SPEC.md` → `verdict PASS`, reproducing the SPEC's recorded fingerprint `f660b4dbe98cf247e700b9efe2175ee0ffe8b6e3535682192e8d942bd3f4ed81`; `node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs` → 55 pass / 0 fail; `node --test scripts/*.test.mjs` (root) → 528 pass / 0 fail; `cd packages/pi-agentic-workflow && bun run test` → 224 pass / 0 fail; `bun scripts/check-skill-context.mjs` → `PASS context budgets: 40 skills`; `node scripts/audit-pr-gate.mjs hygiene` → exit 2, `branch-pushed: fail` ("branch is 2 commit(s) ahead of its remote"), `tree-clean`/`pr-ready` pass, `repairs: []`; `GATE_NAMES` is exactly the 13 declared names; AC7 greps `review-receipt.mjs emit`=1, `audit-pr-gate.mjs hygiene`=1, `session-close.mjs close`=2; AC9 grep=1; versions review-change 3.6.0 / audit-pr 5.2.0 / log-session 2.2.0 / pi 0.11.0 with CHANGELOG rows; pi mirror differs from `skills/` only by the deliberately excluded `bump-skill`.
- Non-material observations (not findings): (a) the SPEC's `## Status` reads `in-progress`, the header "registered … (`pending`)", and `docs/fix/README.md` carries `pending` — the `done` flip is P4's, so this is a label reading, not a plan defect; (b) the fix-index row's owner decision (roadmap row 35 cites #182) is disclosed in `## Cross-issue notes` and required by AC9 — a human decision before merge, not an engineering gap; (c) `## Rollback` names the behavior commit `c541aac5`; the repair's two test tasks land as additional commits, so a full unit rollback also reverts those test-only bytes (reverting the behavior commit alone leaves the new tests failing) — the behavior rollback stays executable and the tests are additive. Not material.
- Read-only: no reviewed artifact (`SPEC.md`, `ACCEPTANCE.md`, the roadmap, the fix-index row) was modified. Only this ledger (`progress.md`) was written; `planning-findings.md` gains no row (zero new findings).

## Unit-loop receipt — P1
- Commit: 32a6f142 · Gate: `node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs` (exit 0, 59 pass) · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: P4 · Attempts: 1

## P1 — 2026-09-18
- Done: added the two CLI contract tests the 2026-09-17 repair batch declared (P1 tasks 3 and 7) — `scripts/review-receipt.test.mjs` now pins the `emit` moved-head refusal and the equal-head one-post path through a fake `gh` on `PATH`; `scripts/audit-pr-receipt.test.mjs` now pins `hygiene --apply` on a throwaway repo with a fake `gh` (exactly one `gh pr ready`, re-read clean). Reconciled the ledger: P1 tasks 1,2,4,5,6,8 and every P2/P3 task were verified already landed (`c541aac5`); P1–P3 checkboxes ticked and O1–O8 marked `verified`.
- Remains: P4 (Hardening & PR) close-out only.
- Gotchas: the plan snapshot digest is bound to the pre-execution SPEC bytes; ticking the phase checkboxes after the gate is the contract's own progress mark and does not re-open the gate (which runs once, before the first edit). The two new tests bind the real runtime branches — the refusal message wording is "the candidate changed during review", asserted verbatim.
- Files: scripts/review-receipt.test.mjs, scripts/audit-pr-receipt.test.mjs, docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: P4 — Hardening & PR

## P4 — 2026-09-18
- Done: full project gate re-run green (root suite 532 pass, pi suite 224 pass, context budgets `PASS: 40 skills`, phase-lint `verdict PASS`); fix-index row flipped to `done` and committed (`44ff4506`), branch pushed; PR opened and linked back into the index (`docs: link PR #241`); the roadmap row-35 boundary decision is carried in the PR body's "Decision required before merge" note.
- Remains: none — the unit is delivered; merge is gated by `/audit-pr` after the mandatory end review.
- Gotchas: the owner decision on roadmap row 35 (`scoped-receipt-verifier`, currently citing #182) remains open and is the one human decision before merge; the fix-index row stays until the PR actually merges.
- Files: docs/fix/README.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: unit finished
