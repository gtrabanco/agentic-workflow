# progress — fix-214 (model-selection-over-24-options)

Session ledger for this unit. Receipt blocks follow the
`agentic-workflow/pre-execution-review-receipt@1` grammar parsed by
`scripts/pre-execution-contract.mjs`.

## Pre-execution review receipt v1 — plan
- Review: rp-214-20260913-001 · Snapshot: c7b0461dfd4f21912efaf238d0a570ed74a941cf9da5746928bec86f4e79f4d9 · Verdict: plan-review-fail
- Unit: fix-214 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: af8d6431d1a447b4fae98b396b38094ef9439cfb · Artifact revision: af8d6431d1a447b4fae98b396b38094ef9439cfb
- Reviewer: review-plan (clean context, this session) · Session: 01a09be1-2f39-7201-818d-ef4b1d98de9d · Role: reviewer · Author: plan-fix (draft commit af8d6431)
- Author exclusion: not-enforceable (manual flow; reviewer session authored no plan byte) · Context clean: true
- Model diversity: not-applicable (single manual reviewer; author turn's model not recorded)
- Policy: v1
- Started/finished: 2026-09-13T17:50Z/2026-09-13T18:06Z · Findings: 2 (material open: 2)
- Ledgers read: planning-evidence 12 rows · obligations 14 rows (verified-capable: 12 — O8/O9 are human manual smoke rows)
- Prior plan receipt (re-review only): none — first cycle
- Notes: `--dir docs/fix/214-model-selection-over-24-options` (slug directory); no separate `artifactRevisionId` rotation exists in the manual flow, so revision = the working source revision af8d6431. Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-214 --dir docs/fix/214-model-selection-over-24-options --unit-kind fix` (schema package validated locally). Findings PL-1 + PL-2 appended to planning-findings.md in the same act.

## Pre-execution review receipt v1 — plan
- Review: rp-214-20260913-002 · Snapshot: 5ef96fc8be539a225e92627f23ee7371bb967ce2fdeae78c62eccca9c660fb6f · Verdict: plan-review-fail
- Unit: fix-214 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: f1a4f4b21eb67f99ada5046c5844f572600e9687 · Artifact revision: f1a4f4b21eb67f99ada5046c5844f572600e9687
- Reviewer: review-plan (clean context, this session) · Session: 01a09c03-8ab7-7201-818d-ef51f4563c86 · Role: reviewer · Author: plan-fix (repair commit f1a4f4b2)
- Author exclusion: not-enforceable (manual flow; reviewer session authored no plan byte) · Context clean: true
- Model diversity: not-applicable (single manual reviewer; author turn's model not recorded)
- Policy: v1
- Started/finished: 2026-09-13T18:25Z/2026-09-13T18:42Z · Findings: 3 (material open: 3)
- Ledgers read: planning-evidence 13 rows · obligations 14 rows (verified-capable: 12 — O8/O9 are human manual smoke rows)
- Prior plan receipt (re-review only): rp-214-20260913-001 @ c7b0461dfd4f21912efaf238d0a570ed74a941cf9da5746928bec86f4e79f4d9
- Notes: re-review after repair ar-214-2 — PL-1 (PE-007 anchors) and PL-2 (pick-less over-cap case) verified resolved against the bytes, not taken on faith; repair rotation label ar-214-2 pairs with the recomputed artifact revision f1a4f4b2 (no separate revision id exists in the manual flow — same convention as rp-001). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-214 --dir docs/fix/214-model-selection-over-24-options --unit-kind fix` (digest = stdout first line; contract validated by the schema package). PE-row anchors re-verified at f1a4f4b2 (package source unchanged since e0c18284; repair touched docs only); PE-001 re-verified against the installed runtime `@jmfederico/pi-web@1.202609.0` (`apiTypes.js:37`, throw site). New findings PL-3 + PL-4 + PL-5 appended to planning-findings.md in the same act; second cycle routed to plan-fix with the CONVERGENCE-ANOMALY block printed in the report.

## Pre-execution review receipt v1 — plan
- Review: rp-214-20260913-003 · Snapshot: 59423e3f199b421c65c06aa2550b75ce0c76b3abe486f816c816107e69851426 · Verdict: plan-review-pass
- Unit: fix-214 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null
- Parent note: fix unit — no Product half exists (D6); the contract forbids a parent on a fix plan snapshot (D30)
- Source revision: 6e6d3d78db93fa35e54c277a977f8819fc642792 · Artifact revision: 6e6d3d78db93fa35e54c277a977f8819fc642792
- Reviewer: review-plan (clean context, this session) · Session: 01a09c24-bf04-7201-818d-ef5b05550ad2 · Role: reviewer · Author: plan-fix (repair commits f1a4f4b2 + 6e6d3d78)
- Author exclusion: not-enforceable (manual flow; reviewer session authored no plan byte) · Context clean: true
- Model diversity: not-applicable (single manual reviewer; author turn's model not recorded)
- Policy: v1
- Started/finished: 2026-09-13T19:03Z/2026-09-13T19:06Z · Findings: 1 (material open: 0)
- Ledgers read: planning-evidence 14 rows · obligations 15 rows (verified-capable: 13 — O8/O9 are human manual smoke rows)
- Prior plan receipt (re-review only): rp-214-20260913-002 @ 5ef96fc8be539a225e92627f23ee7371bb967ce2fdeae78c62eccca9c660fb6f
- Notes: re-review after repair ar-214-3 — PL-3 (over-cap provider case), PL-4 (flip validator), PL-5 (operational-risks anchor) verified resolved against the bytes, not taken on faith; PL-1 + PL-2 resolutions re-verified too (corrected PE-007 anchors, pick-less over-cap case, PE-013). Repair rotation label ar-214-3 pairs with the recomputed artifact revision 6e6d3d78 (no separate revision id exists in the manual flow — same convention as rp-001/rp-002). Snapshot built with `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-214 --dir docs/fix/214-model-selection-over-24-options --unit-kind fix` (digest = stdout first line). Third cycle is lawful: both prior cycles followed persisted FAIL verdicts with changed snapshots (POLICY §4 — a repair produces a new snapshot by design); cycle 2 printed the CONVERGENCE-ANOMALY block in rp-002. Evidence anchors re-verified at 6e6d3d78 (package source unchanged since e0c18284 — `git diff e0c18284..HEAD -- packages/pi-agentic-workflow/{src,test}` empty; every commit since is docs-only): PE-001 against the installed runtime `@jmfederico/pi-web@1.202609.0` (`apiTypes.js:37` + throw site `pendingExtensionDialogStore.js:136-139`), PE-002/003/004/005/007/008/013 against package source, PE-012 harness capture; exhaustive `ui.select`/`ui.pick` sweep of `console.ts` confirms the three-surface root cause is complete (menu :103, policies :170/:175, scope :199, fields :251, chainAction :324, thinking :348-358 are fixed literal sets). Dependency closure proven: #203 (84b7f0e9) is an ancestor of HEAD. One info finding PL-6 (Rules prose anchor, non-blocking) appended in the same act.

## Dependency receipt v1
- Fingerprint: a5b16343783a441a939074c7acd4bfeca1ded22a · Closure: fix-214 ← (none — the SPEC `## Depends on` section lists no dependency unit)
- Merged PRs: none · Fully merged: yes · Verified: 2026-09-13
- Fingerprint recipe: `git hash-object --stdin` over the `## Depends on` section body (both lines, heading excluded), as recomputed at 4639760e → a5b16343. The seam this fix extends is #203 (`84b7f0e9`, merged 2026-09-09), proven an ancestor of HEAD (`git merge-base --is-ancestor`) — a prerequisite already in the base, not a `Depends on` edge.

## Acceptance receipt v1
- Manifest: docs/fix/214-model-selection-over-24-options/ACCEPTANCE.md · Blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22 · Status: frozen · Verified: 2026-09-13

## P1 — 2026-09-13
- Done: `src/settings/picker.ts` gains `SELECT_OPTION_LIMIT = 24`, `PAGED_SELECT_PREV` (`◀ Previous page`), `PAGED_SELECT_NEXT` (`More options…`), and the async `pagedSelect(select, title, options, { trailing })` helper (21 data per page = `SELECT_OPTION_LIMIT - 3`, PREV/NEXT before the trailing option, cancel passthrough). New red-first `test/paged-select.test.mjs` (7 cases: fit, 30-item paging, PREV, trailing-last on every page, cancel, at-limit boundary, property sweep 1–100). Phase-lint re-checked PASS (8/8) at fingerprint `P1:domain:3:bounded-paged-select-helper`.
- Remains: P2–P7.
- Gotchas: the ≤ cap branch calls `select(title, [...items, trailing])` verbatim, so any caller that fits keeps byte-identical behavior; `pagedSelect` awaits its `select` argument, so both `Promise`-returning and sync `SettingsUi.select` shapes work. No production caller wired yet — P2/P3/P4 consume it.
- Files: packages/pi-agentic-workflow/src/settings/picker.ts · packages/pi-agentic-workflow/test/paged-select.test.mjs · docs/fix/214-model-selection-over-24-options/SPEC.md (P1 ticks) · progress.md
- Next: P2 — Provider-first two-step model selection

## P2 — 2026-09-13
- Done: `pickModelEntry` over `SELECT_OPTION_LIMIT - 1` models now runs the provider-first two-step: unique providers (`localeCompare`-sorted) via `pick` while they fit, `pagedSelect` when the provider list itself exceeds the cap, then that provider's models via `pick`/`pagedSelect`; `prompts.modelProvider(target)` added (no existing prompt renamed, PE-007); TYPED trails every dialog and still reaches `input`, so a pick-less UI completes (OB-12). ≤ 23 models keep the single-step branch byte-identical. New red-first console cases: provider-first over 30 models (rich + pick-less `rich: false`), provider-first over 30 providers (provider dialog pages), pages within one provider, single-step preserved at 23 (rich preselection + pick-less select), TYPED-last. Validators: `-t "provider-first"` → 3 pass; `-t "pages within one provider"` → 1 pass; `-t "single-step preserved"` → 2 pass; `-t "Type another reference"` → 1 pass; `-t "over 30 providers"` → 1 pass; full suite → 201 pass. Phase-lint re-checked PASS (8/8) at fingerprint `P2:domain:4:provider-first-two-step-model-selection`.
- Remains: P3–P7.
- Gotchas: the two-step triggers at `models.length > SELECT_OPTION_LIMIT - 1` (24 models + TYPED would be 25); the provider step pages with plain `select` even when the rich seam exists (Decision 7 — paged dialogs are select-based); TYPED or a cancel at either step falls through to the text input, so the flow never dead-ends.
- Files: packages/pi-agentic-workflow/src/settings/console.ts · packages/pi-agentic-workflow/test/settings-console.test.mjs · docs/fix/214-model-selection-over-24-options/SPEC.md (P2 ticks) · progress.md
- Next: P3 — Bounded command selection

## P3 — 2026-09-13
- Done: `pickCommand` and each `pickCommandsMulti` non-rich round now route through `pagedSelect`; a list ≤ `SELECT_OPTION_LIMIT` keeps today's single sorted `select` call byte-identical, an over-cap list pages (commands carry no trailing option, so a page is 21 data + pager(s)). New red-first console cases "bounded command selection over 30 commands" (paged single select with page-2 navigation) and "bounded command multi-select rounds over 30 commands" (two picks across bounded rounds through bulk apply). Validator `-t "bounded command"` → 2 pass; full suite → 201 pass. Phase-lint re-checked PASS (8/8) at fingerprint `P3:domain:2:bounded-command-selection`.
- Remains: P4–P7.
- Gotchas: a paged command dialog never exceeds 22 options (21 data + at most one pager at the ends, 22 with both); the non-rich multi-select bounds each round's shrinking `remaining` list, never the whole list. Ordering note: the command routing and its two tests first landed inside the P2 commit; that commit was rewritten (local, unpushed) to keep P2/P3 un-bundled — this commit is the one that carries them.
- Files: packages/pi-agentic-workflow/src/settings/console.ts · packages/pi-agentic-workflow/test/settings-console.test.mjs · docs/fix/214-model-selection-over-24-options/SPEC.md (P3 ticks) · progress.md
- Next: P4 — Adapter non-TUI pick paging

## P4 — 2026-09-13
- Done: `richUi` exported as a test seam; its non-TUI `pick` fallback now pages through `pagedSelect` before `base.select`, so a > 24 option list never builds a dialog the host rejects; a ≤ cap list is still one `base.select` call with the same options in order, and `multiple: true` still returns `[picked] | undefined`. New red-first adapter cases: "the adapter non-TUI pick fallback pages long option lists before base.select" (30 options, NEXT navigation, value returned) and a ≤ cap + `multiple` preservation case. Validator `-t "pages long option lists"` → 1 pass; full suite → 203 pass. Phase-lint re-checked PASS (8/8) at fingerprint `P4:ui:2:adapter-non-tui-pick-paging`.
- Remains: P5–P7.
- Gotchas: the import of `SELECT_OPTION_LIMIT` into `extension/index.ts` is unnecessary — `pagedSelect` owns the cap and the file only needs `pagedSelect` (`noUnusedLocals` catches the leftover). Unit-loop trigger recorded for final risk selection: **layer boundary** at P3 (`domain`) → P4 (`ui`); no intermediate checkpoint taken (unit-loop mode).
- Files: packages/pi-agentic-workflow/src/extension/index.ts · packages/pi-agentic-workflow/test/shipped-adapter.test.mjs · docs/fix/214-model-selection-over-24-options/SPEC.md (P4 ticks) · progress.md
- Next: P5 — pi-web manual smoke

## Ordering decision — P6 executed before P5 (recorded, not silent)
- P5's two tasks are `manual` (live pi-web, human operator) and cannot be performed by the executor; P6 is docs/version bookkeeping with no behavioural dependency on the smoke. Executing P6 first makes the branch a complete candidate for the operator's smoke without leaving machine-checkable work undone. P7 (`Hardening & PR`) still runs only after P5 is green — the final phase never runs while an earlier one is unfinished. No SPEC/acceptance byte changed (blob stayed `94fc0ec5`).

## P6 — 2026-09-13
- Done: package `version` 0.9.1 → 0.9.2; a 0.9.2 companion-package row added to `CHANGELOG.md` and `CHANGELOG.es.md` in the same commit (bilingual pair); the package `README.md` + `README.es.md` console paragraph now names the bounded large-list behavior (provider-first over the cap, paging via `More options…` / `◀ Previous page`). Validators: `node -p` version → `0.9.2`; `grep -c "0.9.2" CHANGELOG.md CHANGELOG.es.md` → 1 each; README pair read-verified; repo `bun test scripts/normative-drift.test.mjs` → 16 pass (version cells recomputed, both languages publish the same set); package suite → 203 pass. Phase-lint re-checked PASS (8/8) at fingerprint `P6:docs:3:release-bookkeeping-0.9.2`.
- Remains: P5 (human pi-web smoke) then P7 (Hardening & PR).
- Gotchas: the `normative-drift` rendered-facts check recomputes `package:version` against both changelog tables, so the bump and the rows must land together (they do). No `skills/` change, so no `bundle:skills` re-run is owed, and the context-budget/doc generators are untouched.
- Files: packages/pi-agentic-workflow/package.json · CHANGELOG.md · CHANGELOG.es.md · packages/pi-agentic-workflow/README.md · packages/pi-agentic-workflow/README.es.md · docs/fix/214-model-selection-over-24-options/SPEC.md (P6 ticks) · progress.md
- Next: P5 — pi-web manual smoke (human-gated)

## Unit-loop receipt — P6
- Commit: b3125586 · Gate: `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → 0.9.2 · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Next: P5 (human smoke) → P7 · Attempts: 1

## P5 — 2026-09-13
- Done: the two live pi-web checks were performed by the human operator against the candidate and both passed. Rows (operator attestation, recorded by execute-phase):
- SMOKE A (over-cap registry, > 24 live models) · `/agentic-workflow-settings` → Set a command override → provider dialog opens with no "A select dialog must not offer more than 24 options" error, provider chosen, model dialog completes and saves · outcome: pass · reported by the operator 2026-09-13.
- SMOKE B (≤ 24 registry) · single-step model dialog unchanged, "Type another reference…" still completes an entry, bulk apply/clear over the command list stays bounded · outcome: pass · reported by the operator 2026-09-13.
- Remains: P7 — Hardening & PR.
- Gotchas: none. The P5 done-when counts exactly two outcome-pass rows in this file (the two above). Phase-lint re-checked PASS (8/8) at fingerprint `P5:hardening:2:pi-web-manual-smoke`.
- Files: docs/fix/214-model-selection-over-24-options/SPEC.md (P5 ticks) · progress.md
- Next: P7 — Hardening & PR

## Unit-loop receipt — P5
- Commit: dd7aa72f · Gate: two live SMOKE rows recorded above (both outcome-pass) · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Next: P7 · Attempts: 1

## P7 — 2026-09-13
- Done: Full gate re-run — `cd packages/pi-agentic-workflow && bun run test` → exit 0, 203 pass / 0 fail; `bun test scripts/normative-drift.test.mjs` → 16 pass; `bun scripts/check-skill-context.mjs` → exit 0 (`PASS context budgets: 39 skills`). Pending-docs check `git status --porcelain -- docs/` → empty. Fix index flipped to `done`, pushed, PR opened with `--body-file` (real backticks verified: 100, zero escaped), then linked to `done · [#217](https://github.com/gtrabanco/agentic-workflow/pull/217)` and pushed. Phase-lint re-checked PASS (8/8) at fingerprint `P7:close-out:7:hardening-and-pr`.
- Remains: none in-unit — the independent `/review-change` end review and the `/audit-pr` merge gate remain, and the fix-index entry stays until the PR merges.
- Gotchas: AC13 is a human-operator attestation (the two SMOKE rows record the operator's reported result, not an executor-observed one). The P5 validator counts exactly two outcome-pass rows in this file — never restate the literal pattern elsewhere here or the count drifts (a first draft did and was corrected before the P5 commit).
- Files: docs/fix/README.md · docs/fix/214-model-selection-over-24-options/SPEC.md (P7 ticks) · progress.md
- Next: unit finished

## Unit-loop receipt — P7
- Commit: pending (terminal close-out commit — this entry rides it; there is no later phase to reconcile the sha) · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 203 pass / 0 fail) · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Next: none (unit finished) · Attempts: 1

## Unit-loop receipt — P4
- Commit: 2cb84746 · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 203 pass / 0 fail) · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Trigger: layer boundary (P3 `domain` → P4 `ui`) · Next: P5 · Attempts: 1

## Unit-loop receipt — P3
- Commit: 3d0d9e42 · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 201 pass / 0 fail) · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Next: P4 · Attempts: 1

## Unit-loop receipt — P2
- Commit: 10d1dfb1 · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 201 pass / 0 fail) · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Next: P3 · Attempts: 1

## Unit-loop receipt — P1
- Commit: 84299b06 · Gate: `cd packages/pi-agentic-workflow && bun run test` (exit 0, 192 pass / 0 fail) · Acceptance blob: 94fc0ec5fc49ca4415dfa695615ef2c016a5ad22
- Next: P2 · Attempts: 1
