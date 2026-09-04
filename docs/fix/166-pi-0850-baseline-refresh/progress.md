# fix/166 — pi-0850-baseline-refresh · progress

## Pre-execution review receipt v1 — plan
- Review: rp-fix166-20260904-001 · Snapshot: debd8046aaec7bca56df0c18e5a12b98d1d2211b617575bb704f9dd8507f606a · Verdict: plan-review-fail
- Unit: fix-166 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 74e3adc3f3ede536b1ca1415fac0bbb59a704127 · Artifact revision: 74e3adc3f3ede536b1ca1415fac0bbb59a704127
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/166-pi-0850-baseline-refresh` · Role: reviewer · Author: plan-fix (commit `74e3adc3`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Policy note: manual portability run; POLICY.md/LEDGERS.md not loaded (no `--adversarial`, first cycle); receipt contract `pre-execution-review-receipt@1`
- Started/finished: 2026-09-04T~15:14Z / 2026-09-04T15:35Z · Findings: 3 (material open: 2)
- Ledgers read: planning-evidence 12 rows · obligations 12 rows (verified-capable: 12)
- Prior plan receipt (re-review only): none — first cycle
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision. Nothing in this runtime rotates the id — mutate-and-revert detection depends on the next repair producing new bytes and a fresh snapshot (fix-161 disclosure shape).
- Freshness note: registry (`npm view` → `0.85.0`), forge issue #166, and pi's `packages/coding-agent/CHANGELOG.md` were re-fetched live during this review (2026-09-04); PE-006, PE-007, PE-010 held. Snapshot `verify` ran clean post-append (first-cycle `missing-receipt-snapshot` before this block existed).

### Review-run evidence (commands + results)

- `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-166 --dir docs/fix/166-pi-0850-baseline-refresh` → digest `debd8046aaec7bca56df0c18e5a12b98d1d2211b617575bb704f9dd8507f606a`; `unitKind: fix`, artifacts: spec (26355 B) + acceptance (3960 B), `parentSpecSnapshotDigest: null` ✓
- PE-001: `README.md:142` / `README.es.md:148` say 0.84.3; `bun.lock:75` resolves `0.84.4`; `node_modules` peer is `0.84.4` → proven ✓
- PE-002: `git log --oneline -S "Verified against Pi" -- packages/pi-agentic-workflow/README.md` → single hit `2bf91948` → proven ✓
- PE-006: fetched changelog confirms 0.85.0 persistent thinking effort + skills/#8552 + no `registerCommand`/extension-API changes; `/thinking` selector rework in 0.84.3 (lines 106/115), 0.84.4's change is styling (line 78); `ui_prompt_start`/`ui_prompt_end` in 0.84.4 → proven, decision 4's correction accurate ✓
- PE-007: `package.json:53` dev peer `*`; `npm view @earendil-works/pi-coding-agent version` → `0.85.0` → proven ✓
- PE-008: drift guard `ThinkingLevelsMirrorMatchesPi` at `src/extension/index.ts:32-44`; `dispatch.ts:111,273`; `restore-after-settle.test.mjs:143` → proven ✓
- PE-009: publish workflow version gate + test gate comments verified in `.github/workflows/publish-pi-package.yml`; `prepublishOnly` build+test at `package.json:48` → proven ✓
- PE-003/PE-010/PE-011: `gh issue view 166` fetched live — 5 in-scope delta-scan items, out-of-scope routes, acceptance criteria map 1:1 to AC1–AC5 → proven ✓
- AC3 reachability: exactly one `0.84` occurrence per README (the note lines) → 0/0 reachable post-edit ✓; AC4 reachability: companion table rows are `| 0.4.0 | …` format → `| 0.4.1 |` row fits ✓
- AC6 probe: the frozen regex scores **0** against the index's own backticked done rows (lines 17/19) — finding PR-1
- Package gate state at review: not run (execution not started; suite runs at P1 per plan)

Verdict: **PLAN-REVIEW-FAIL** — findings PR-1 + PR-2 open material; repair owner `plan-fix` (class: plan). PR-3 recorded as info/proposal (non-material).

## Pre-execution review receipt v1 — plan
- Review: rp-fix166-20260904-002 · Snapshot: 5b7e8d84efd21c668621fa7b32e3131b40d20893be72853ccca73ef953bc40c9 · Verdict: plan-review-pass
- Unit: fix-166 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 24c20e23a3431729d4a6a3428f5faac41cfabd14 · Artifact revision: 24c20e23a3431729d4a6a3428f5faac41cfabd14
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/166-pi-0850-baseline-refresh` · Role: reviewer · Author: plan-fix (commit `24c20e23`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Policy note: manual portability run; POLICY.md §4 loaded for the repeat gate (changed snapshot — repair batch ar-166-2); no `--adversarial`; receipt contract `pre-execution-review-receipt@1`
- Started/finished: 2026-09-04T~21:05Z / 2026-09-04T21:16Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 12 rows · obligations 12 rows (verified-capable: 12)
- Prior plan receipt (re-review only): rp-fix166-20260904-001 @ debd8046aaec7bca56df0c18e5a12b98d1d2211b617575bb704f9dd8507f606a
- Portability note: nothing in this runtime rotates `artifactRevisionId` — mutate-and-revert detection still depends on new repair bytes + a fresh snapshot (fix-161 disclosure shape). Pairing per POLICY §7: the repair ledger's claimed revision is `ar-166-2` (plan-fix repair batch, `planning-findings.md` repair-cycle note); the recomputed builder value is the source-revision fallback `24c20e23a3431729d4a6a3428f5faac41cfabd14`, which the parsed field carries. The pair is the disclosure; neither value substitutes for the other.
- Freshness note: registry (`npm view` → `0.85.0`), forge issue #166, and pi's `packages/coding-agent/CHANGELOG.md` re-fetched live during this re-review (2026-09-04); PE-006/PE-007/PE-003/PE-010 held.

### Review-run evidence (commands + results)

- Snapshot build: `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-166 --dir docs/fix/166-pi-0850-baseline-refresh` → digest `5b7e8d84efd21c668621fa7b32e3131b40d20893be72853ccca73ef953bc40c9`; `unitKind: fix`, artifacts: acceptance (4309 B) + spec (27381 B), `parentSpecSnapshotDigest: null` ✓
- L6 / PR-1 resolution verified: AC6 validator backtick-tolerant in ACCEPTANCE.md AC6 + Commands and SPEC AC6 row; P5 task 8 prescribes the backticked `` `done` · [#<pr>](<pr-url>) `` cell. Probes: repaired regex → 1 on #161's real backticked done row (`docs/fix/README.md:19`), 0 on #166's current `` `pending` `` row, 1 on each synthesized backticked + unbackticked post-flip row ✓
- L6 / PR-2 resolution verified: O12 re-anchored (Phase P2 · Task 3) and extended to "a red suite on 0.85.x or any failed smoke observation" with stop-before-P3; PE-012 extended; failure semantics in O6 + AC2 (SPEC + ACCEPTANCE); Rules bullet 1, quality-floor bullet 3, P2 layer line, Operational risks all extended (grep: 7 hits SPEC / 3 hits ACCEPTANCE) ✓
- L6 / PR-3: proposal routing stands as resolved (disclosure in Root cause / Out of scope / Observability; no forge writes) ✓
- PE-001: `README.md:142` / `README.es.md:148` say 0.84.3; `bun.lock:75` resolves `0.84.4`; `node_modules` peer `0.84.4` → proven ✓
- PE-002: `git log --oneline -S "Verified against Pi" -- packages/pi-agentic-workflow/README.md` → single hit `2bf91948` → proven ✓
- PE-005: `## Notes` at `README.md:140`; note bullet at `:142` is the claim surface → proven ✓
- PE-006: live changelog — `## [0.85.0] - 2026-09-04`, persistent Claude thinking effort, skills-when-Bash-only fix #8552, `ui_prompt_start`/`ui_prompt_end` in 0.84.4, no 0.85.0 `registerCommand`/extension-API changes → proven ✓
- PE-007: `package.json:52-54` dev peer `*`; `bun.lock:75` → `0.84.4`; `npm view @earendil-works/pi-coding-agent version` → `0.85.0` live → proven ✓
- PE-008: drift guard `ThinkingLevelsMirrorMatchesPi` at `src/extension/index.ts:32-44`; `dispatch.ts:111,273` `setThinkingLevel` per-command; `test/restore-after-settle.test.mjs:143` → proven ✓
- PE-009: `prepublishOnly` build+test at `package.json:48`; publish workflow version gate ("newer than the one on the registry", same-version pushes no-op) → proven ✓
- PE-010: `gh issue view 166` live — five in-scope delta-scan items ↔ AC5's five `- VERDICT` lines, acceptance criteria map 1:1 to AC1–AC5 → proven ✓
- Validator reachability: AC3 → exactly one `0.84` per README (`:142`/`:148`, the note lines) → 0/0 post-edit reachable; AC4 → `| 0.4.0 |` rows at `CHANGELOG.md:92`/`CHANGELOG.es.md:94` → `| 0.4.1 |` fits; AC5 → 5 in-scope items confirmed live; AC6 → 1 match on real sibling done row, 0 pre-flip; 19 user-facing skills claim confirmed at `docs/workflow/SKILLS.md:7` ✓
- O3/O6 pre-state: `^- VERIFY` → 0, `^- SMOKE` → 0 (execution not started; validators gate P1/P2 output) ✓
- Package gate state at review: not run (execution not started; suite runs at P1 per plan)

### Check results

- L1 parent: fix unit — snapshot carries `parentSpecSnapshotDigest: null` ✓, receipt states it ✓ (D6/D30)
- L2 evidence integrity: 12/12 rows `proven`/`decision`, none `unknown`/`drifted`/`stale`; all proven rows re-verified at HEAD ✓
- L3 obligation completeness: 12 rows, one per normative behaviour / invariant / use case / required failure state; none missing, none duplicated ✓
- L4 obligation mapping: each row = one phase + one task + `execute-phase` owner + validator + required-evidence; no blank, no `deferred` ✓
- L5 scenario↔validator↔phase closure: red suite (O12), failed smoke (O12, repaired), stale claim (AC3), bun-update side effects (O2), publish-on-merge (Operational risks) — every validator can fail ✓
- L6 findings ledger honest: PR-1/PR-2 resolved with verified byte-level evidence, PR-3 resolved proposal; no open, no dismissed rows ✓
- P1–P12: pass (P5 EN–ES sync scheduled via AC3/AC4 same-change rule; P9 phase-lint PASS 8/8 recorded per phase, P5 close-out exempt; P10 validators unchanged in strength — AC6 amended per the prior review's own fix-now route) ✓
- F1–F4: pass (reproduction PE-001 at cited revision; root cause evidenced `2bf91948` + ruled-out competitor #164; regression scope AC1/AC2/AC3 + CI gate; rollback single-revert + republish caveat verified in workflow comments) ✓

Verdict: **PLAN-REVIEW-PASS** — no findings; both cycle-1 material findings verified repaired; execution may bind this receipt for snapshot `5b7e8d84efd21c668621fa7b32e3131b40d20893be72853ccca73ef953bc40c9`.
