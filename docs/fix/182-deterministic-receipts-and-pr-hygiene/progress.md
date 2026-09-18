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
- Pre-execution gate (superseded): the `rp-fix182-20260917-002` receipt held at revision 81ee3ff6 and stopped being current when the main-sync merge moved `CLAUDE.md`; superseded by the e2a42683 merge. The current gate is `rp-fix182-20260918-004` (recorded in the newest `Pre-execution review receipt v1 — plan` block below): `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 0, `current: true`, `digestMatches: true`, `verdictIsPass: true`.
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

## Preflight record (execute-phase --fix 182, phases P5–P10)
- Dependency gate: PASS — SPEC `Depends on` is empty; no closure to traverse.
- Own-status: n/a — fix unit has no roadmap-status equivalent (fix-index entry is its state).
- Pre-execution gate: PASS — newest `stage: plan` receipt `rp-fix182-20260918-004`, verdict `plan-review-pass`, snapshot `5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea`, `current: true`, `digestMatches: true`, `verdictIsPass: true` (`node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 0).
- Acceptance-manifest gate: PASS — `git hash-object docs/fix/182-deterministic-receipts-and-pr-hygiene/ACCEPTANCE.md` = `3ff5b7f104954d80d218f1085ddc7ef4bac0421e`, matching the frozen blob.
- Phase-lint: PASS (8/8) all phases · fingerprint `24c1adc8acec3570498a98ad5d2c9f9534279c4cc6b31e5135bc8b287d176fe9`.
- Architectural invariants: n/a — no project invariant document declared (NRS F010).
- Queue (reconciled against repository evidence): `P5, P6, P7, P8, P9, P10`. P1–P4 are ticked and their evidence exists; P5–P10 are unticked and each defect reproduces live: P5's two corrected-gate-line markers absent (`grep -c "held at revision 81ee3ff6"` = 0, `grep -c "superseded by the e2a42683 merge"` = 0), P6 `grep -c "audit-pr-gate.mjs comment" skills/audit-pr/SKILL.md` = 0 / `grep -c "gh pr comment" …` = 1, P7 a no-upstream throwaway repo returns `branch-pushed: pass` exit 0 (should be fail), P8 `packages/pi-agentic-workflow/src/extension/index.ts:137` `spawnSync` has no `timeout`, P9 the mirror is byte-identical today (P6 will drift it, P9 re-bundles).

```text
IMPLEMENTATION MAP — fix-182 P5–P10
Map revision: map-fix182-p5-p10-20260918-1
Source identity: HEAD 02ce4465 · clean source (git status --porcelain empty) · cited: docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md, skills/audit-pr/SKILL.md, scripts/audit-pr-gate.mjs, scripts/audit-pr-receipt.test.mjs, packages/pi-agentic-workflow/src/extension/receipt-guard.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/receipt-guard.test.mjs, packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/scripts/bundle-skills.mjs, packages/pi-agentic-workflow/test/skill-parity.test.mjs, CHANGELOG.md, docs/fix/README.md
Authority: plan receipt rp-fix182-20260918-004 (5e14f732) + SPEC/ACCEPTANCE 3ff5b7f1 + phase fingerprints P5:docs:3:merged-head-plan-receipt-reconciliation · P6:docs:2:audit-pr-merge-ready-box-names-comment-runtime · P7:config/infra:3:branch-pushed-gate-fails-closed-without-upstream · P8:config/infra:3:settled-turn-git-probe-is-time-bounded · P9:config/infra:2:pi-mirror-parity-for-repaired-skill · P10:hardening:9:hardening-pr
Planning evidence: PE-012 confirmed (the hand-assembled `gh pr comment --body-file` path is `skills/audit-pr/SKILL.md:47`; already removed in `references/03_AUDIT_PROCESS.md:49`), PE-013 confirmed (`aheadCount()` returns 0 on any non-zero exit; no-upstream repro exit 128), PE-014 confirmed (the `progress.md:36` line still presents a standing gate; live verify exit 4 stale-context before this write), PE-015 confirmed (`index.ts:137` no `timeout`; comments at `:131-135`/`:185-187` claim it never blocks), PE-016 confirmed (`scripts/pre-execution-snapshot.mjs:483` `verdictIsPass` exact)
Obligations: O10 (P5·1–3), O11 (P6·1–2), O12 (P7·1–3), O13 (P8·1–3), O14 (P9·1–2), plus P10 re-verification of O1–O14
Entry points: progress.md `Pre-execution gate` line + newest receipt block (P5) · skills/audit-pr/SKILL.md:46-48 turn-contract box (P6) · audit-pr-gate.mjs `hygieneFromState` `:147-166` and `aheadCount` `:197-200` (P7) · receipt-guard.ts exports + index.ts `readGitStatus` `:128-137` and `agent_settled` `:171-189` (P8) · bundle-skills.mjs `bundleSkills` + package.json version (P9) · docs/fix/README.md row (P10)
Affected surfaces: P6 edit drifts the bundled mirror → test/skill-parity.test.mjs fails until P9 re-bundles (planned coupling, disclosed) · P7 change touches `hygieneFromState` consumers (CLI `hygiene`, `evaluate --hygiene`) and the existing CLI fixtures `makeRepo` that have no upstream (must gain a remote to stay truthfully `pass`) · P8 change is consumed by the Pi extension lifecycle and pinned by test/receipt-guard.test.mjs against `dist/` · P9 re-bundle touches the whole bundled `skills/` tree and the companion-packages CHANGELOG row
Current behaviour: all five defects reproduce live (see the Queue line); no runtime path is missing — each phase is a bounded correction or a rebundle
Reuse and constraints: P7 reuses the `hygieneFromState` pure shape and the existing fake-`gh`/`makeRepo` fixture pattern (`scripts/audit-pr-receipt.test.mjs:226-302`); P8 reuses `dirtyWorktreeWarning` and the same test file's Pi-free import of `../dist/extension/receipt-guard.js`; P9 reuses `bun scripts/bundle-skills.mjs` (the only bundle writer) and `skills/bump-skill` for the audit-pr patch; validators may not be weakened; the full project gate is the four ACCEPTANCE commands
Expected writes: progress.md (P5) → O10 · skills/audit-pr/SKILL.md + CHANGELOG.md + skills/bump-skill run (P6) → O11 · scripts/audit-pr-gate.mjs + scripts/audit-pr-receipt.test.mjs (P7) → O12 · receipt-guard.ts + index.ts + test/receipt-guard.test.mjs (P8) → O13 · packages/pi-agentic-workflow/skills/ re-bundle + package.json + CHANGELOG.md companion row (P9) → O14 · docs/fix/README.md + SPEC.md + progress.md (P5–P10) → O10–O14 evidence
Validation: falsification probes = the P5 greps + `verify` exit-0 JSON, P6 greps on `skills/audit-pr/SKILL.md`, the no-upstream `hygiene` repro, the P8 direct read of `index.ts:137`; TDD targets = P7's no-upstream fixture (red before the `hygieneFromState` change) and P8's hanging-fake-git probe (red before the bounded probe); phase gates = P5 verify exit 0 + greps, P6 `bun scripts/check-skill-context.mjs` exit 0, P7 `node --test scripts/audit-pr-receipt.test.mjs` exit 0, P8 `cd packages/pi-agentic-workflow && bun run test` exit 0, P9 `cd packages/pi-agentic-workflow && bun run test` exit 0, P10 the four ACCEPTANCE commands
Plan assumptions: confirmed — every cited line and count matches the live tree
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
- Done: full project gate re-run green (root suite 532 pass, pi suite 224 pass, context budgets `PASS: 40 skills`, phase-lint `verdict PASS`); fix-index row flipped to `done` and committed (`44ff4506`), branch pushed; PR opened and linked back into the index (`docs: link PR #241`); the roadmap row-35 boundary decision is carried in the PR body's "Decision required before merge" note. Then synced `origin/main` (feature 55) in `e2a42683` — resolved the `CHANGELOG.md` / `docs/LOGS.md` / pi `package.json` conflicts, re-bundled the pi skills mirror, and re-ran the gate green on the merged tree (root 544 pass, pi 224 pass, context `PASS: 40 skills`); PR #241 is now `MERGEABLE` / `CLEAN`.
- Remains: none — the unit is delivered; merge is gated by `/audit-pr` after the mandatory end review.
- Gotchas: the owner decision on roadmap row 35 (`scoped-receipt-verifier`, currently citing #182) remains open and is the one human decision before merge; the fix-index row stays until the PR actually merges.
- Files: docs/fix/README.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: unit finished

## Pre-execution review receipt v1 — plan
- Review: rp-fix182-20260918-003 · Snapshot: 5a9c450f79c9b74a45d92c4de5681f3e74ce1473d38bb8afb08d38ee614886af · Verdict: plan-review-fail
- Unit: fix-182 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: 2644b0a72f1692d8db811d753545c47cdaa14b77 · Artifact revision: 2644b0a72f1692d8db811d753545c47cdaa14b77
- Reviewer: review-plan (review-only turn) · Session: 01a0b3b8-1576-7302-a9d2-cf4bc78bfaa9 · Role: reviewer · Author: plan-fix (commit 2644b0a7)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T08:53:00Z/2026-09-18T09:07:00Z · Findings: 2 (material open: 2)
- Ledgers read: planning-evidence 15 rows (PE-001…PE-015, embedded in the SPEC) · obligations 14 rows (O1…O14, verified-capable: 9 — O1–O8 verified, O9–O14 planned)
- Prior plan receipt (re-review only): rp-fix182-20260917-002 @ 8f6126b308175af3b32c27c749966783393cf3f038d9cea752938220d8fce3ca

Notes:
- Snapshot built by `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` at source revision `2644b0a7`; `validated: schema` (digest stable across two builds). Rows: `spec` → SPEC.md (58902 B, `92e4ee0bde1c06c56578ac31949b8ebae6b9b27b112eaecaa09f49ded9fc7f91`) + `acceptance` → ACCEPTANCE.md (3927 B, `316b953fb1618ecef9320f116ede918295ee3ea224da840a7b458f56028b21ce`); `planning-evidence`/`obligations`/`tasks`/`testing`/`decisions`/`plan`/`architecture-notes` rows absent (fix template; the two planning tables are embedded in the SPEC and bound through the whole-file `spec` row). Contexts: `project-guide` (CLAUDE.md, `f5c8e142…`) and `normalized-repository-state` (docs/workflow/REPOSITORY_STATE.md, `e1b81e29…`) present and bound; `architectural-invariants` absent (NRS F010 → the SPEC's invariant classification `n/a` is evidence-backed). `parentSpecSnapshotDigest: null` (D6/D30).
- Manual-runtime disclosure (Portability): no runtime rotates `artifactRevisionId`; the receipt's revision lines carry the derived content revision (`2644b0a7`) that `verify` re-derives, while the planner's declared label `ar-fix182-20260918-plan-3` is recorded here beside it (POLICY §7 pairing, never a substitution). Prior cycles recorded the same split (`ar-…-plan-2` @ `81ee3ff6`, `ar-…-plan-1` @ `f971a03e`).
- Cycle context: this is the third `stage: plan` review of fix-182. The prior receipt `rp-fix182-20260917-002` was a PASS at `81ee3ff6` (plan-2); the unit then executed `P1`–`P4` (PR #241 open) and the 2026-09-18 replan appended `P5`–`P10` at `2644b0a7` (plan-3) in response to `review-change` findings F1–F4. The snapshot changed (`8f6126b308175af3b32c27c749966783393cf3f038d9cea752938220d8fce3ca` → `5a9c450f79c9b74a45d92c4de5681f3e74ce1473d38bb8afb08d38ee614886af`), so this is a changed-snapshot re-review, not a blind repeat — no `CONVERGENCE-ANOMALY` is due for *this* turn (the prior verdict was a PASS and this turn's input was the router's `route: replan`, not a FAIL-driven repair). Warning for the owner: this FAIL opens a **second** plan repair/re-review cycle (cycle 1 was `rp-fix182-20260917-001` FAIL → repair `plan-2` → `rp-fix182-20260917-002` PASS), so the next re-review must print the `CONVERGENCE-ANOMALY` block before any further edit, then route to `plan-fix`.
- Falsification stance before the check table: **CONFIRMED-GAPS**. A hostile reader can attack two F1/F3 outcome claims as validated by checks that pass on the unrepaired state: (a) O10/P5 assert `verdictIsPass` — the newest receipt's verdict, independent of currency (`scripts/pre-execution-snapshot.mjs:483`) — and a live `verify` prints `verdictIsPass: true` with `current: false, digestMatches: false`; the phase's done-when never checks that the superseded `Pre-execution gate` line (`progress.md:36`) was corrected; (b) row 8's validator proves the new `audit-pr-gate.mjs comment` token is present but not that `gh pr comment --body-file` was removed, so the F1 failure state is not exercised. Attacks refuted with evidence: PE-012 (`grep -c "audit-pr-gate.mjs comment" skills/audit-pr/SKILL.md` → 0, `…hygiene` → 1; the box's stale `gh pr comment --body-file` at `skills/audit-pr/SKILL.md:47`; the pi mirror carries the same bytes), PE-013 (`aheadCount()` returns `0` on any non-zero exit; a no-upstream branch reproduces exit 128), PE-014 (live `verify` → exit 4, `stale-context`, `changedPaths: ["CLAUDE.md"]`, exactly as recorded), PE-015 (`index.ts:137` `spawnSync` with no `timeout`; the "never blocks" comment at `:186-187`), PE-003/PE-009/PE-010 re-read; the ACCEPTANCE blob claim recomputed (`git hash-object ACCEPTANCE.md` → `3ff5b7f104954d80d218f1085ddc7ef4bac0421e`, matching the SPEC's recorded frozen blob); PR #241 `OPEN`/`MERGEABLE`/head `c3649687`, non-draft, as `P4` records.
- Ledger sweep (L1–L6): L1 pass (fix snapshot parent `null`, stated, no invented lineage); L2 pass (PE-001…PE-015 resolve — `repository`/`proven` for the code/document claims, `derived`/`decision`/`not-applicable` for PE-004 and PE-011, the sanctioned shape; no `unknown`, no `drifted`/`stale`); L3 pass (O1–O14 — one row per normative behaviour, ids unique and stable, none duplicated); L4 pass (each row names exactly one phase/task/owner/validator/evidence with a non-blank status; no `deferred` row); L5 **finding PF-3/PF-4** (failure-scenario rows 11 and 8 point at validators that do not exercise the failure state they name); L6 pass (PF-1/PF-2 `resolved` with resolution evidence and `resolving-artifact-revision ar-fix182-20260917-plan-2`; no open planning-findings row for the bound snapshot — the review-findings F1–F4 are the source-class rows this plan repairs in `P5`–`P9`).
- Verification spot-checks at `2644b0a7` (re-run live this turn): `node scripts/phase-lint.mjs docs/fix/182-…/SPEC.md` → `verdict PASS`, reproducing the SPEC's recorded fingerprint `24c1adc8acec3570498a98ad5d2c9f9534279c4cc6b31e5135bc8b287d176fe9`; `node --test scripts/*.test.mjs` (root) → 544 pass / 0 fail; `cd packages/pi-agentic-workflow && bun run test` → 224 pass / 0 fail; `bun scripts/check-skill-context.mjs` → `PASS context budgets: 40 skills`; `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 4, `current:false`, `digestMatches:false`, `verdictIsPass:true`, `structural.reasonCode:"stale-context"` (`CLAUDE.md`); AC7 greps `review-receipt.mjs emit`=1, `audit-pr-gate.mjs hygiene`=1, `session-close.mjs close`=2; AC9 grep=1; `GATE_NAMES` is exactly the 13 declared names; versions review-change 3.6.0 / audit-pr 5.2.0 / log-session 2.2.0 / pi 0.11.0. Pi suite green at HEAD (the stale mirror bytes match on both trees today; P6 will break parity and P9 re-bundles).
- Failed checks: L5, P10, P11. Passing: L1, L2, L3, L4, L6, P1–P9, P12, F1–F4.
- Non-material observations (not findings): (i) PE-015 cites `index.ts:128-131` for one of "the two comments" whose text sits at `:131-135` (the row's primary `:137` and `:185-187` citations are exact, so the claim is evidenced; an imprecise secondary range only); (ii) `O1`–`O8` are marked `verified` from the `P1`–`P4` progress entries and the green suites — the required test names are described rather than quoted verbatim, but each named validator ran green this turn; (iii) the fix-index row already reads `done` · [#241] while `P5`–`P10` are unexecuted — the status legend's `done` is "built + PR open, human merge pending" and `P10` re-confirms it, so this is a label reading, not a gate.
- Read-only: no reviewed artifact (`SPEC.md`, `ACCEPTANCE.md`, the roadmap, the fix-index row) was modified. Only this ledger (`progress.md`) and `planning-findings.md` were written.

## Re-review self-check (POLICY §8) — rp-fix182-20260918-003
```json
{
  "current": false,
  "stage": "plan",
  "unit": "fix-182",
  "receipt": {
    "id": "rp-fix182-20260918-003",
    "verdict": "plan-review-fail",
    "snapshot": "5a9c450f79c9b74a45d92c4de5681f3e74ce1473d38bb8afb08d38ee614886af",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "5a9c450f79c9b74a45d92c4de5681f3e74ce1473d38bb8afb08d38ee614886af",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```
- Self-check command: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 4 (verdict persisted, not a PASS — the verdict itself is the emit result; `structural.fresh: true`, `digestMatches: true`; `current: false` is the PASS-only field, per POLICY §8).


## Pre-execution review receipt v1 — plan
- Review: rp-fix182-20260918-004 · Snapshot: 5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea · Verdict: plan-review-pass
- Unit: fix-182 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: dbda8e01aa4b8520be609f41043352f87ee1d333 · Artifact revision: dbda8e01aa4b8520be609f41043352f87ee1d333
- Reviewer: review-plan (review-only turn) · Session: 01a0b4e9-86e7-7302-a9d2-cf5e9e2ac8b0 · Role: reviewer · Author: plan-fix (commit dbda8e01)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T14:26:38Z/2026-09-18T15:03:13Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 16 rows (PE-001…PE-016, embedded in the SPEC) · obligations 14 rows (O1…O14, verified-capable: 9 — O1–O8 verified, O9–O14 planned)
- Prior plan receipt (re-review only): rp-fix182-20260918-003 @ 5a9c450f79c9b74a45d92c4de5681f3e74ce1473d38bb8afb08d38ee614886af

Notes:
- CONVERGENCE-ANOMALY — fix-182 plan (second repair/re-review cycle, printed before any further edit per POLICY §4; the anomaly is reported and routed, never a stop, and the repair it routes has already run):
  ```text
  CONVERGENCE-ANOMALY — fix-182 plan
  - Finding ids: repeated: none / new: none (PF-3 and PF-4 both resolved by this write)
  - Snapshots: 5a9c450f79c9b74a45d92c4de5681f3e74ce1473d38bb8afb08d38ee614886af → 5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea (artifactRevisionId ar-fix182-20260918-plan-3 → ar-fix182-20260918-plan-4)
  - Missed: the plan-receipt-currency proof for F3 (PF-3: the P5/O10 validator asserted the newest verdict, which stays true while the receipt is stale) and the comment-path-removal proof for F1 (PF-4: the P6/O11 validator asserted the runtime token, not the removal of the hand-assembled path)
  - Owning stage: plan
  - Why the prior repair failed: the plan-3 replan appended the F1–F4 phases but proved the two outcomes with presence tokens that already pass on the unrepaired state, so the plan could pass while the exact defects survived
  - Route to owner: plan-fix (owner performed the PF-3/PF-4 in-place repair; artifact revision ar-fix182-20260918-plan-4, commit dbda8e01)
  ```
- Snapshot built by `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` at source revision `dbda8e01`; `validated: schema` (digest stable across builds). Rows: `spec` → SPEC.md (63406 B, `afe55bbf051694af02a7f87a30cd888c67ea60951ada237fa478389d5b69cb33`) + `acceptance` → ACCEPTANCE.md (3927 B, `316b953fb1618ecef9320f116ede918295ee3ea224da840a7b458f56028b21ce`); `planning-evidence`/`obligations`/`tasks`/`testing`/`decisions`/`plan`/`architecture-notes` rows absent (fix template; the two planning tables are embedded in the SPEC and bound through the whole-file `spec` row). Contexts: `project-guide` (CLAUDE.md, `f5c8e142…`) and `normalized-repository-state` (docs/workflow/REPOSITORY_STATE.md, `e1b81e29…`) present and bound; `architectural-invariants` absent (NRS F010 → the SPEC's invariant classification `n/a` is evidence-backed). `parentSpecSnapshotDigest: null` (D6/D30).
- Manual-runtime disclosure (Portability): no runtime rotates `artifactRevisionId`; the receipt's revision lines carry the derived content revision (`dbda8e01`) that `verify` re-derives, while the planner's declared label `ar-fix182-20260918-plan-4` is recorded here beside it (POLICY §7 pairing, never a substitution). Prior cycles recorded the same split (`ar-…-plan-3` @ `2644b0a7`, `ar-…-plan-2` @ `81ee3ff6`, `ar-…-plan-1` @ `f971a03e`).
- No-progress/convergence: this repeat is sanctioned — the input is the PF-3/PF-4 repair turn's changed snapshot (`5a9c450f…` → `5e14f732…`), produced in response to the persisted FAIL receipt `rp-fix182-20260918-003`; per POLICY §4 no cycle cap or anomaly rule blocks or ends it. The anomaly above is printed and routed; the findings it names are both `resolved` with resolution evidence in `planning-findings.md`.
- Falsification stance before the check table: **NO-CONFIRMED-GAPS**. Hostile-reader attacks refuted with evidence on the current bytes: PE-012 (the hand-assembled path is exactly `skills/audit-pr/SKILL.md:47` on both trees, `grep -c "audit-pr-gate.mjs comment"` = 0 while the reference file already runs the runtime at `references/03_AUDIT_PROCESS.md:49`); PE-013 (`scripts/audit-pr-gate.mjs:197-200` returns `0` on any non-zero `rev-list` exit); PE-014 (the recorded preflight line at `progress.md:36` still presents `current: true`, and the live `verify` answers exit 4, `current:false`, `digestMatches:false`, `structural.reasonCode:"stale-source-revision"`); PE-015 (`packages/pi-agentic-workflow/src/extension/index.ts:137` `spawnSync` has no `timeout`, and the comments at `:131-135`/`:185-187` claim the opposite); PE-016's cited line `scripts/pre-execution-snapshot.mjs:483` is exact (`verdictIsPass`); the ACCEPTANCE blob recomputed (`git hash-object` → `3ff5b7f104954d80d218f1085ddc7ef4bac0421e`, matching the SPEC's frozen blob) and its last touch is `81ee3ff6` (unchanged by the plan-3 and plan-4 writes).
- Ledger sweep (L1–L6): L1 pass (fix snapshot parent `null`, stated, no invented lineage); L2 pass (PE-001…PE-016 resolve — `repository`/`proven` for the code/document claims, `derived`/`decision`/`not-applicable` for PE-004, PE-011 and PE-016, the sanctioned shape; no `unknown`, no `drifted`/`stale`); L3 pass (O1–O14 — one row per normative behaviour, stable unique ids, none duplicated); L4 pass (each row names exactly one phase/task/owner/validator/evidence with a non-blank status; no `deferred` row; each validator copied from `ACCEPTANCE.md` or the phase done-when); L5 pass — the PF-3/PF-4 repair made both previously wrong-reason validators fail-capable: P5's gate now requires `"current": true` and `"digestMatches": true` (fails on the stale state today) plus the corrected-gate-line markers, and P6's gate now requires `grep -c "gh pr comment" skills/audit-pr/SKILL.md` → 0 (fails at 1 today); `### Failure scenarios` rows 11 and 8 name those same checks; L6 pass (PF-1…PF-4 all `resolved` with resolution evidence and `resolving-artifact-revision` `ar-fix182-20260917-plan-2` / `ar-fix182-20260918-plan-4`; no open material row; the review-findings F1–F4 rows are the source-class rows P5–P9 repair).
- Verification spot-checks at `dbda8e01` (re-run live this turn): `node scripts/phase-lint.mjs docs/fix/182-…/SPEC.md` → `verdict PASS`, reproducing the SPEC's recorded whole-set fingerprint `24c1adc8acec3570498a98ad5d2c9f9534279c4cc6b31e5135bc8b287d176fe9` and all ten per-phase fingerprints; `node --test scripts/*.test.mjs` (root) → 544 pass / 0 fail; `cd packages/pi-agentic-workflow && bun run test` → 224 pass / 0 fail; `bun scripts/check-skill-context.mjs` → `PASS context budgets: 40 skills`; `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 4 on the prior FAIL receipt (`structural.reasonCode: "stale-source-revision"`, `changedPaths: ["SPEC.md"]`), the state this receipt supersedes; `git hash-object ACCEPTANCE.md` → `3ff5b7f1…`; P5's gate greps at HEAD → 0 for both corrected-gate-line markers and 3 for the receipt heading, so P5 cannot pass on the unexecuted state; P6's gate greps → `audit-pr-gate.mjs comment` = 0 and `gh pr comment` = 1, so P6 cannot pass on the unexecuted state; AC7 greps `review-receipt.mjs emit` = 1, `audit-pr-gate.mjs hygiene` = 1, `session-close.mjs close` = 2; AC9 grep = 1; `GATE_NAMES` is exactly the 13 declared names; versions review-change 3.6.0 / audit-pr 5.2.0 / log-session 2.2.0 / pi 0.11.0, each with its `CHANGELOG.md` row; the pi mirror differs from `skills/` only by the deliberately excluded `bump-skill` (so P6 will break parity and P9 re-bundles).
- P5 gate feasibility (checked, not assumed): `buildSnapshot` defaults `sourceRevision`/`artifactRevisionId` to `contentRevision(git, boundPaths)` — the newest commit touching a **bound** path — not live HEAD, so the P5 write to `progress.md` (not a bound artifact) leaves the plan receipt `current: true`; the gate is reachable once this PASS is on disk. `artifactRevision` is likewise the content revision (`dbda8e01`), which `verify` re-derives.
- Non-material observations (not findings): (i) the SPEC's `## Status` reads `in-progress` while the fix-index row reads `done` · [#241] — the index's `done` is "built + PR open, human merge pending" and `P10` re-confirms it, so this is a label reading, not a gate; (ii) the roadmap row-35 `scoped-receipt-verifier` boundary (it cites #182) remains the one open owner decision before merge, disclosed in `## Cross-issue notes` and required by AC9 — a human decision, not an engineering gap; (iii) AC1's "malformed argument set" outcome is exercised by the `validateEmitOptions` unit test inside the AC1 suite rather than by a dedicated `### Failure scenarios` row (info: the suite that AC1 names runs it); (iv) the O1–O8 `verified` required-evidence quotes test names in prose rather than verbatim (pre-existing, every named validator ran green this turn).
- Read-only: no reviewed artifact (`SPEC.md`, `ACCEPTANCE.md`, `planning-findings.md`, the roadmap, the fix-index row) was modified. Only this ledger (`progress.md`) was written; `planning-findings.md` gains no row (zero new findings).

## Re-review self-check (POLICY §8) — rp-fix182-20260918-004
```json
{
  "current": true,
  "stage": "plan",
  "unit": "fix-182",
  "receipt": {
    "id": "rp-fix182-20260918-004",
    "verdict": "plan-review-pass",
    "snapshot": "5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```
- Self-check command: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 0 (`current: true`, `digestMatches: true`, `verdictIsPass: true`, `structural.fresh: true`).

## P5 — 2026-09-18
- Done: reconciled the merged-head plan receipt record. The superseded `Pre-execution gate` line in the first preflight record now reads `held at revision 81ee3ff6` and `superseded by the e2a42683 merge`, and points at the current receipt. Recorded the fresh `stage: plan` receipt `rp-fix182-20260918-004` — snapshot `5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea`, source revision `dbda8e01aa4b8520be609f41043352f87ee1d333` — in the newest receipt block. Re-ran the plan-stage verify for the appended ledger; exit-0 JSON pasted below. Ticked P5 (O10 `verified`).
- Remains: P6–P10.
- Gotchas: `verify` re-reads the newest receipt and the *bound* artifact bytes; `progress.md` is not a bound path, so this reconciliation does not move the snapshot digest (`current: true` holds). The two corrected-gate-line markers are the P5/O10 falsification hooks the plan-review added.
- Files: docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md
- Next: P6

```json
{
  "current": true,
  "stage": "plan",
  "unit": "fix-182",
  "receipt": {
    "id": "rp-fix182-20260918-004",
    "verdict": "plan-review-pass",
    "snapshot": "5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "5e14f732c1bda4bb59a8f73be75d0436a328d9d29b58e20a16381099dee5bdea",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

## Unit-loop receipt — P5
- Commit: pending · Gate: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` (exit 0) + P5 greps · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: P6 · Attempts: 1

## P6 — 2026-09-18
- Done (commit predecessor `f5d266ea`): the `audit-pr` turn-contract box now names `bun scripts/audit-pr-gate.mjs comment` as the step that posts the MERGE-READY comment and proves the marker landed (the reference `03_AUDIT_PROCESS.md` step 7 carries the full `--pr … --head … --gates-json …` invocation); the hand-assembled `gh pr comment --body-file` path is gone from the box. Box kept within the 2800 main-estimate ceiling (2795 est / 206 lines). Bumped `audit-pr` frontmatter 5.2.0 → 5.2.1 (patch, wording only) and added its `CHANGELOG.md` row. `bump-skill` patch rule: the `README.md` skills-table cell carries no version and its description ("MERGE-READY posts a dated SHA-bound PR comment") stays accurate, so it is unchanged by design, not by omission. O11 `verified`.
- Remains: P7–P10.
- Gotchas: this edit drifts the bundled Pi mirror, so `test/skill-parity.test.mjs` is red until P9 re-bundles in the next phase — the planned coupling the SPEC names, deliberately not hidden. P6's own gate is `bun scripts/check-skill-context.mjs`; the first box draft overran the audit-pr 2800 main-estimate ceiling, so the box was compacted to 2795 est.
- Files: skills/audit-pr/SKILL.md, CHANGELOG.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: P7

## Unit-loop receipt — P6
- Commit: pending · Gate: `bun scripts/check-skill-context.mjs` (exit 0) + P6 greps (`audit-pr-gate.mjs comment` ≥ 1, `gh pr comment` = 0) · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: P7 · Attempts: 1

## P7 — 2026-09-18
- Done (commit predecessor `5c572afa`): `aheadCount()` now returns `null` when `git rev-list --count @{upstream}..HEAD` exits non-zero, and `hygieneFromState` maps `branchAhead: null` to `branch-pushed: fail` with the blocker "the branch has no resolvable upstream to compare against" — never a zero ahead-count. Red-first: the pure `branchAhead: null` case and the CLI no-upstream case failed before the change, both green after. `makeRepo` gained a configured bare remote so the existing CLI fixtures stay truthfully `branch-pushed: pass`; the new fixture calls `makeRepo({ withRemote: false })`. O12 `verified`.
- Remains: P8–P10.
- Gotchas: the falsification hook is the no-upstream throwaway repo (exit 128 counted as zero before, now the blocked state). The `evaluate --hygiene` path consumes the same `aheadCount()`, so it fails closed too. Root suite 546 pass / 0 fail.
- Files: scripts/audit-pr-gate.mjs, scripts/audit-pr-receipt.test.mjs, docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: P8

## Unit-loop receipt — P7
- Commit: pending · Gate: `node --test scripts/*.test.mjs` (exit 0, 546 pass) · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: P8 · Attempts: 1

## P8 — 2026-09-18
- Done (commit predecessor `51390cae`): `receipt-guard.ts` now exports `GIT_STATUS_TIMEOUT_MS = 2000` and `readGitStatusBounded(cwd)` — a `spawnSync` with that `timeout` where timeout, spawn error and non-zero status all return `""` (clean). `index.ts` drops its unbounded local `readGitStatus` and consumes the probe directly in the `agent_settled` handler, with the real contract stated in the comment (time-bounded, swallows failure, never parks the turn). Red-first: the new `readGitStatusBounded`/`GIT_STATUS_TIMEOUT_MS` imports failed before the export; the hanging-git probe now times out in under 5 s and reads clean. O13 `verified`.
- Remains: P9–P10.
- Gotchas: the P6 `audit-pr` byte edit drifted the bundled mirror, so the parity suite is red on the P8 commit alone; the re-bundle is P9's deliverable. Verified on the combined working tree (P8 + the P9 bundle refresh): `cd packages/pi-agentic-workflow && bun run test` → 227 pass / 0 fail. The probe test temporarily swaps `process.env.PATH` and restores it, and never hits the network.
- Files: packages/pi-agentic-workflow/src/extension/receipt-guard.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/receipt-guard.test.mjs, docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: P9

## Unit-loop receipt — P8
- Commit: pending · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 227 pass on the combined P8+P9-bundle tree) · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: P9 · Attempts: 1

## P9 — 2026-09-18
- Done (commit predecessor `ede4be5e`): re-bundled the Pi skills mirror with `bun scripts/bundle-skills.mjs` (39 skills / 125 files, `bump-skill` excluded) so the bundled `audit-pr` bytes match `skills/` after the P6 edit; `diff -rq skills packages/pi-agentic-workflow/skills` now reports only the excluded `bump-skill`. Bumped `@gtrabanco/pi-agentic-workflow` 0.11.0 → 0.11.1 and added its companion-packages `CHANGELOG.md` row (covering the re-bundle and the P8 bounded probe); merged today's release-log line to name the whole P6–P9 close-out. O14 `verified`.
- Remains: P10.
- Gotchas: the P8 commit alone was red only on the parity suite (the planned drift); this commit closes it, so the tree is green again. `bun run test` = 227 pass / 0 fail.
- Files: packages/pi-agentic-workflow/skills/audit-pr/SKILL.md, packages/pi-agentic-workflow/package.json, CHANGELOG.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: P10

## Unit-loop receipt — P9
- Commit: pending · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 227 pass) · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: P10 (close-out) · Attempts: 1

## P10 — 2026-09-18 (close-out)
- Full project gate re-run (all four ACCEPTANCE commands exit 0):
  - `node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs` → exit 0, 61 pass / 0 fail
  - `node --test scripts/*.test.mjs` → exit 0, 546 pass / 0 fail
  - `bun scripts/check-skill-context.mjs` → exit 0, `PASS context budgets: 40 skills`
  - `cd packages/pi-agentic-workflow && bun run test` → exit 0, 227 pass / 0 fail
- Pending-docs check (`git status --porcelain -- docs/`): empty after this close-out commit; the phase receipts and SPEC ticks ride it.
- Fix-index: `docs/fix/README.md:17` already reads `` `done` · [#241](https://github.com/gtrabanco/agentic-workflow/pull/241) `` — the flip and the `docs: link PR #241` commit are not re-made (no empty commit).
- PR: `gh pr view 241 --json url,state,isDraft,mergeable` → `OPEN`, non-draft, `MERGEABLE`, head branch `fix/182-deterministic-receipts-and-pr-hygiene`; URL https://github.com/gtrabanco/agentic-workflow/pull/241 — verified, never re-created.
- Obligations: O9–O14 reconciled to `verified` from the P4–P9 evidence — O9 the index row, O10 the P5 verify JSON + corrected-gate-line markers, O11 the P6 greps + context PASS, O12 the P7 no-upstream case + the 546-pass root suite, O13 the P8 probe pins, O14 the P9 parity + 0.11.1 row. No `deferred` row.
- Remains: task 9 — the mandatory end review (`/review-change`) at the terminal head, in a fresh context; then `/audit-pr` as the merge gate.
- Files: docs/fix/182-deterministic-receipts-and-pr-hygiene/SPEC.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: mandatory `/review-change` end review

## Unit-loop receipt — P10
- Commit: pending · Gate: the four ACCEPTANCE commands (exit 0) · Acceptance blob: 3ff5b7f104954d80d218f1085ddc7ef4bac0421e
- Next: mandatory `/review-change` end review, then `/audit-pr` · Attempts: 1

## End review + fold — 2026-09-18
- End review (`review-change`, fresh context) at `a9e663c4`: **`REVIEW-FAIL`**, no receipt posted. Four new fix-now findings F5–F8; the four carried rows F1–F4 were re-verified as repaired by P5–P10 and are now ticked closed. Ledger append committed by the reviewer at `90f0ba3c` and pushed.
- Folded in three atomic batches, each gate-green and pushed:
  - **F5** `658fd31b` — closed CLI flag contract across `review-receipt.mjs`, `audit-pr-gate.mjs`, `session-close.mjs`: unknown/misspelled flags are usage errors, `--flag=value` and the documented `-R owner/name` alias are honored. Regression tests: misspelled `--invariant`, unknown `--prr`/`--summry`, inline `--head=`, and the `-R` scope reaching the fake `gh`.
  - **F6** `4ba18969` — `hygieneFromState` takes `isDraft: null` for "not observed" and fails `pr-ready` closed; the CLI passes `null` without `--pr`. Regression tests: pure `isDraft: null` and CLI `hygiene` with no `--pr`.
  - **F7+F8** `0798c3e1` — `resolveBase` refuses an explicit `--base` that does not resolve instead of falling back to `origin/main`; `baselineOf` distinguishes an absent path (empty baseline) from an unresolvable HEAD or unreadable blob (throws). Regression tests: `render --base refs/does/not/exist` and a no-HEAD repo `close`.
- F1–F4 closed in this ledger commit: F1 the `audit-pr` box (P6 `5c572afa`), F2 the no-upstream `branch-pushed` failure (P7 `51390cae`), F3 the merged-head receipt reconciliation (P5 `f5d266ea`), F4 the bounded settled-turn probe (P8 `ede4be5e`).
- Gate at `0798c3e1`: `node --test scripts/*.test.mjs` → exit 0, 556 pass / 0 fail. Re-review of the folded head is the mandated next step (within the two-cycle bound).

```text
## REPAIR-RECEIPT
- Repaired: F1 + F2 + F3 + F4 + F5 (VF-5) + F6 (VF-6) + F7 (VF-7) + F8 (VF-8)
- Refuted/open: none
- Gate: node --test scripts/*.test.mjs → exit 0 at head 0798c3e1 · 556 pass / 0 fail
- Batch class: all-repair-in-place
- Fold diff: 7 files changed, 208 insertions(+), 40 deletions(-)
- Branch: RE-REVIEW-REQUIRED (delta)
```

- Files: scripts/review-receipt.mjs, scripts/audit-pr-gate.mjs, scripts/session-close.mjs, scripts/review-receipt.test.mjs, scripts/session-close.test.mjs, scripts/audit-pr-receipt.test.mjs, docs/fix/182-deterministic-receipts-and-pr-hygiene/review-findings.md, docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md
- Next: re-run `/review-change` at the folded head
