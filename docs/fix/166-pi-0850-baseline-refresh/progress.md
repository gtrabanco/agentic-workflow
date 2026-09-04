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
