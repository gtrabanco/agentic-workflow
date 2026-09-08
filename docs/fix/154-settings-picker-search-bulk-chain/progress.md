# Unit 154 — progress log (fix/154-settings-picker-search-bulk-chain)


## Pre-execution review receipt v1 — plan
- Review: rp-fix154-20260908-001 · Snapshot: a0ed8357905ab4763fe15273ebfd086a7fd5b1e4116261dab8fff3e8e4cb70a6 · Verdict: plan-review-fail
- Unit: fix-154 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 86e35298df1709c98bacc6aca143621c2ba06fa0 · Artifact revision: 86e35298df1709c98bacc6aca143621c2ba06fa0
- Reviewer: review-plan (fresh pi session) · Session: pi-web review turn on `fix/154-settings-picker-search-bulk-chain` · Role: reviewer · Author: plan-fix (commit `86e35298`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-08 · Findings: 2 (material open: 2)
- Ledgers read: planning-evidence 13 rows (PE-001…PE-013, embedded in the SPEC) · obligations 16 rows (OB-1…OB-16, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): none — first cycle
- Portability note: the planner's handoff declared no `artifactRevisionId`; the builder fell back to the source revision `86e35298` (the draft-SPEC commit). Nothing in this runtime rotates the id — mutate-and-revert detection depends on the next repair producing new bytes and a fresh snapshot.

### Review-run evidence (commands + results)

- `node scripts/pre-execution-snapshot.mjs build --stage plan --unit fix-154 --dir docs/fix/154-settings-picker-search-bulk-chain --unit-kind fix` → digest `a0ed8357905ab4763fe15273ebfd086a7fd5b1e4116261dab8fff3e8e4cb70a6`; `unitKind: fix`, artifacts: spec (41391 B) + acceptance (5345 B), `parentSpecSnapshotDigest: null` ✓. Ledgers are embedded in the SPEC (fix template convention), so `planning-evidence`/`obligations` snapshot rows are absent and bound through the whole-file `spec` row. Contexts: `architectural-invariants` absent (optional doc does not exist — invariant classification carried by the SPEC's "Rules that must never be violated" + PE rows); `normalized-repository-state` and `project-guide` present and bound.
- PE-001: `gh issue view 154` → state OPEN, label `bug`, author `gtrabanco`, title matches the SPEC's Issue section; issue body repro steps 1–6 and the Expected-behaviour table (Filter/Scroll/Current value/Bulk edit/Fallback order) match OB-1…OB-9 authority rows; `pi-coding-agent 0.85.1` `dist/modes/interactive/components/extension-selector.js` renders one `Text` child per option (`:54`) and contains 0 `setFilter` occurrences → proven ✓
- PE-002: `src/routing/types.ts:49` = `SettingsUi.select(title, options)` ✓; console.ts verified line-by-line: `:70` TYPED, `:86` menu, `:109-115` setOverride single command, `:116-121` clearOverride single, `:125` policy, `:149` scope, `:176-183` editRoute both fields in sequence, `:184-206` askModel, `:187` whole-registry select + TYPED last, `:188,190` free-text fall-throughs, `:209-212` askThinking, `:217-223` pickCommand, `:222` select → proven ✓
- PE-003: `src/config/types.ts:21` `ModelSetting = "inherit" | ModelRef`, `:30` `RouteFile.model?: ModelSetting` ✓; `src/routing/dispatch.ts:222-234` resolves exactly one reference via `parseModelReference` + `ctx.find`, one global `onUnavailableRoute` policy (`:231-241`) → proven ✓
- PE-004: installed versions `@earendil-works/pi-coding-agent@0.85.1` + `@earendil-works/pi-tui@0.85.1` ✓; `dist/core/extensions/types.d.ts` ~116-136 `custom<T>(factory, {overlay…})` ✓; pi-tui `select-list.d.ts:38-39` `setFilter`/`setSelectedIndex`, `maxVisible`/`getVisibleRange` windowing + `scrollInfo` theme slot ✓; `fuzzyFilter` found only inside `.js.map` source maps, absent from `dist/index.d.ts` exports → not exported, correction upheld ✓; `ModelSelectorComponent` exported but its constructor requires `modelRuntime: ModelRuntime` (`model-selector.d.ts:43`) and `ModelRuntime` appears nowhere in the extension-context typings → SelectList-based picker justified ✓
- PE-005: `dispatch.ts:224-227` probes with `ctx.find` + `ctx.hasConfiguredAuth` only; `setModel` first called at `:249` after the blocker check; N-3 comment ("Pi re-derives thinking inside `setModel`… session half-switched") at `:265-269` → proven ✓
- PE-006: baseline re-run at `86e35298`: `cd packages/pi-agentic-workflow && bun run test` → **140 pass / 0 fail, 14 files** — matches the SPEC's recorded baseline; all 8 named suite files exist in `test/` → proven ✓
- PE-008: `src/settings/view.ts:14-19` `routePath` = `$.commands.<target>` shape ✓; `console.ts:243-259` save/clean region with the loader-second-opinion comment at `:259` ✓
- PE-009: `gh pr list --state open` → `[]` (no open PRs, 2026-09-08); `gh pr view 150` → MERGED 2026-08-30 (F-27 merged, P2 closure) ✓
- PE-011: substantive claim proven — registration by name exists and `knownCommands` guards route-name typos — but the cited location is wrong: `registerCommand(SETTINGS_COMMAND, …)` is at `src/extension/factory.ts:92`, `knownCommands` at `factory.ts:79`; `index.ts:96-104` is the `runSettingsConsole` wiring, not registration → finding RP1-F2 (low, plan)
- PE-012: `README.md:120` (`/agentic-workflow-settings` block) + `:131` troubleshooting table ✓; `README.es.md:125/:137` siblings ✓; AD-002 at `docs/workflow/REPOSITORY_STATE.md:38` ✓; bilingual same-commit rule + exact-version pinning + `bun.lock`-only rules confirmed in `CLAUDE.md` ✓
- Falsification stance before checking: CONFIRMED-GAPS — the three strongest hostile-reader candidates: (1) "a phase's deliverable could be accepted while its validator passes for the wrong reason" → **confirmed**: every scoped validator (`bun run test test/<file>`) runs the full suite and exits 0 before any phase work exists (P4's named `test/picker-filter.test.mjs` is absent today, validator exit 0) → RP1-F1; (2) "an Engineering claim a hostile reader could call invented" → PE-011's registration location, refuted as cited, confirmed one hop away → RP1-F2; (3) "a SPEC obligation this plan cannot deliver" → none: OB-1…OB-16 ↔ AC1–AC13 ↔ phase tasks all map, every validator's target suite exists or is created by its phase's tasks, and no obligation silently dies.
- Validator no-op runs (L5 falsification, all at `86e35298`): `bun run test test/picker-filter.test.mjs` → `140 pass / 0 fail, 14 files`, exit **0** (file absent — P4 not executed); `bun run test test/config-merge.test.mjs` → full suite, exit 0 (P1 no-op passes); direct `bun test test/config-merge.test.mjs` → `9 pass, 1 file` (the direct form scopes once the file exists); direct `bun test test/zzz-missing.test.mjs` → exit **0** (bun treats an unmatched path as a filter — even the repaired shape needs task ordering / required-evidence to cover the missing-file case)

### Ledger sweep L1–L6

- L1 **pass** — fix unit: snapshot carries `parentSpecSnapshotDigest: null` and this receipt states the parent note plainly; no Product receipt borrowed or claimed (D6/D30).
- L2 **pass** — 13/13 PE rows `current` + `proven`; no `unknown`, `drifted`, or `stale` row; no unsampled model/service assumption cited as fact (PE-004 samples the installed 0.85.1 dist typings; the `fuzzyFilter` correction is itself a refuted issue claim). PE-011's location imprecision is filed as RP1-F2, not an evidence-lifecycle defect.
- L3 **pass** — 16 obligations, one per normative behaviour, applicable invariant (honest routing, rejection-path shape, fail-closed config, bilingual docs, dependency policy), affected use case, and required failure state (exhaustion refusal, inherit fallback, probe purity, non-TUI fallback, invalid elements, cap rejection, advisory warnings); no duplicates, ids stable.
- L4 **pass** — every row: exactly one phase + one task reference, owner `execute-phase --fix`, validator copied from ACCEPTANCE/phase done-when, `required-evidence` named; no blank status, no `deferred`.
- L5 **FAIL** — scenario↔validator↔phase closure holds on paper, but the validators as written cannot fail for their stated scope: each scoped command passes on a no-op of its phase's work (RP1-F1). Every other validator (full gate OB-16, read-verified greps OB-15) can fail today.
- L6 **pass** — no prior findings ledger existed; this receipt seeds `planning-findings.md` with both cycle-1 rows, both open.

### Engineering checks (fix unit: P1–P12 + F1–F4)

- P1 pass — affected surfaces named with path:line (root cause A–E, Impact section, PE-001…PE-005, PE-011); invariant classification present ("Rules that must never be violated" + PE-008: preserves honest routing, rejection-path shape, fail-closed config)
- P2 pass — Depends on: none; F-27 (PR #150) MERGED 2026-08-30 (verified via `gh`); no phase depends on unwritten work outside the unit
- P3 pass — boundary stated: seam stays a structural superset (PE-010), legacy string/`inherit` configs load byte-identically (PE-006/OB-6), no `settings.json` keys, alias adds no config key or route key, `knownCommands` typo-check stays exact (P3 task)
- P4 pass — n/a justified without contradicting scope: no auth/secrets/PII/webhooks; console writes only the two files it already wrote; project-file trust gate untouched and re-pinned by the existing `untrusted-project-config` test
- P5 pass — no schema/data migration (additive union; OB-6); README EN+ES scheduled as one change (OB-15, AD-002); version bump + bilingual changelog tables same PR, manual-bump rule honoured
- P6 pass — recovery rides execute-phase's progress receipts + per-phase commits; every done-when command is idempotently re-runnable; no phase leaves the tree mid-write without a tell (commit per phase)
- P7 pass — rollback executable at per-commit granularity (PE-007: A–D+alias vs E commit sets), out-of-band causal limit stated honestly (a chain-form config file does not parse on reverted code — flatten to string; revert message will state it)
- P8 pass — health signals are the `ui.notify` message families, each pinned by test assertions (PE-013); gate exit status as the suite sensor; no metrics/alerts exist and none claimed
- P9 pass — 8 phases, each with a recorded `Phase-lint: PASS (8/8)` fingerprint; task counts 4/4/3/5/6/4/3/7 all ≤ limits; one deliverable per title; layer order domain → api → api → ui → ui → ui → docs → close-out matches the none-closure; last phase is the literal Hardening & PR chain
- P10 **finding** — done-when commands exist with expected outcomes and the gate set is real, but the scoped validator shape cannot fail for its scope (RP1-F1); no validator was weakened relative to today's gates, yet 14/16 obligations and 6 phase done-whens pass on a no-op
- P11 pass — failure states mapped to phase+validator: chain exhaustion (P2/OB-9), probe purity (P2/OB-10), invalid element + cap + path shape (P1/OB-6, OB-11; P5/OB-13), non-TUI fallback (P4/OB-12), byte-identical no-change (P5/OB-3), bulk equivalence + advisory warnings (P6/OB-4); oversize via the ≥100-model fixture (AC1); concurrency explicitly bounded (console runs only while idle)
- P12 **finding** — all citations verified at `86e35298` except PE-011's `index.ts:96-104` (actual registration at `factory.ts:92`, RP1-F2); version claims 0.85.1/0.85.1, PR #150 merged, `SETTINGS_COMMAND` constant, and the baseline 140/140 all confirmed

### Fix checks

- F1 pass — reproduction: issue #154 repro steps 1–6 (forge, OPEN/bug) + code-level confirmation of each defect at cited `path:line` (PE-001/PE-002) + observed output recorded (baseline 140/140: every defect is a missing capability, not a failing assertion)
- F2 pass — root cause evidenced in code and is exactly what the fix edits: the `SettingsUi.select(title, options)` seam (types.ts:49) + every console prompt through it, and the single-reference `ModelSetting`/dispatch resolution (types.ts:21,30; dispatch.ts:222-234); competing hypothesis for E ("regression") ruled out — F-27's own config-schema scope, recorded
- F3 pass — regression scope named: the 8 suite files + baseline output (PE-006), callers of the seam (console call sites, tests, factory wiring, PE-010), E additive so string configs load unchanged (PE-006/OB-6)
- F4 pass — per-commit revert path with data/doc side effects stated (chain-form file flatten note); no fake Product-half ceremony

### Verdict

Verdict: **PLAN-REVIEW-FAIL** — 2 material open findings (RP1-F1 medium, RP1-F2 low), failed checks L5 + P10 (P12 finding).

- Failed checks: L5, P10 (P12 finding)
- Findings (unioned, one row each — full rows in `planning-findings.md`):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | RP1-F1 | medium | plan | L5/P10 | Scoped validators `bun run test test/<file>` never scope (arg appended after the whole script) and exit 0 with the named file absent — every implementation phase's validator passes on a no-op | no-op runs at `86e35298`: 140/14 files, exit 0 for absent `test/picker-filter.test.mjs`; direct `bun test <missing>` exit 0 | re-run commands listed in Review-run evidence |
  | RP1-F2 | low | plan | P12 | PE-011 cites `index.ts:96-104` for the settings-command registration; actual registration is `factory.ts:92` (`knownCommands` at `:79`) | grep of `factory.ts` / `index.ts` | re-read at `86e35298` |
- Repair owner: `plan-fix 154` — one batch over both rows (rewrite the scoped validators in SPEC `### Obligations` + phase done-whens and in ACCEPTANCE.md's validator cells; correct the PE-011 citation), then `/review-plan fix-154` re-reviews the new artifact revision
- Parent state: current (fix unit — no parent)

## Repair receipt v1 — plan (cycle 2)
- Repair of: rp-fix154-20260908-001 (PLAN-REVIEW-FAIL, findings RP1-F1 medium + RP1-F2 low) · Artifact revision: `7aeab75d42896e8bc3b8b458a9eb603e74b81931` (repair commit) · Date: 2026-09-08
- Author: plan-fix (repair batch, one commit) · Role: author · Language: English artifacts (declared docs language; conversation language never decides)
- RP1-F1 (L5/P10) — repaired: every scoped validator (OB-1…OB-14 in SPEC `### Obligations`, the P1–P6 done-whens in `## Phases`, AC1–AC12 validator cells in ACCEPTANCE.md) rewritten from `bun run test test/<file>` (never scopes; exits 0 on a missing file) to direct `cd packages/pi-agentic-workflow && bun test test/<file>…`, which scopes once the file exists (`9 pass, 1 file` re-demonstrated at the repair revision). Missing-file case (bun exits 0 with only a note) covered by (1) file-creating task ordering — stated explicitly in the SPEC's scoped-validator-shape note and in each done-when: P1 task 1 extends `config-merge.test.mjs`, P2 task 1 extends `unavailable-stop.test.mjs`, P4 tasks 4–5 create `picker-filter.test.mjs` / extend `settings-console.test.mjs`, all other named files exist before their phase; (2) required evidence = the pasted summary line `Ran N tests across K file(s)`, which an absent file cannot produce. Full gate (OB-16 / AC13) keeps `bun run test` (tsc + whole suite); no validator weakened — the manifest's Status stays `frozen`, amended pre-execution by the repair owner before any execution receipt existed.
- RP1-F2 (P12) — repaired: PE-011 claim + source-and-location corrected to `src/extension/factory.ts:92` (registration `registrar.registerCommand(SETTINGS_COMMAND, …)`), `factory.ts:79` (`knownCommands`), `index.ts:96-104` named as the `runSettingsConsole` wiring, not the registration.
- Evidence re-runs by the author at the repair revision: `bun run test test/config-merge.test.mjs` → full suite `140 pass / 0 fail, 14 files, exit 0` (arg never scopes); `bun test test/config-merge.test.mjs` → `9 pass / 0 fail, 1 file` (direct form scopes); `bun test test/zzz-missing.test.mjs` → exit 0, note only, no summary line; `bun test test/config-merge.test.mjs test/unavailable-stop.test.mjs` → `17 pass / 0 fail, 2 files` (multi-file direct form scopes); `sed -n 75,95p src/extension/factory.ts` → `:79` knownCommands, `:92` settings registration; `sed -n 90,108p src/extension/index.ts` → `runSettingsConsole` wiring.
- Spec-lint re-run post-repair: placeholder grep returns only the pre-existing literal loader path `$.commands.<name>.model` and the canonical phase-lint template lines (unchanged from the reviewed draft); zero residual `bun run test test/` validator cells.
- Findings ledger: RP1-F1, RP1-F2 → `resolved` with resolution evidence, `resolving-artifact-revision: 7aeab75d` (planning-findings.md).
- Repair commit: `7aeab75d` `docs(fix): repair scoped validators + PE-011 citation for #154 (RP1-F1, RP1-F2)` — SPEC.md + ACCEPTANCE.md; findings/progress resolution recorded in this commit.
## Pre-execution review receipt v1 — plan (re-review, cycle 2)
- Review: rp-fix154-20260908-002 · Snapshot: 989184d22a5670184540f3249a5cc992dbede5349e604a66ade0f08e1e0e18dc · Verdict: plan-review-pass
- Unit: fix-154 · Stage: plan · Unit kind: fix
- Parent SPEC snapshot: null · Parent Product receipt: none
- Parent note: fix unit — no Product half exists (D6); no `review-spec` upstream, none claimed
- Source revision: 7aeab75d42896e8bc3b8b458a9eb603e74b81931 · Artifact revision: 7aeab75d42896e8bc3b8b458a9eb603e74b81931
- Reviewer: review-plan (fresh pi session) · Session: pi-web re-review turn on `fix/154-settings-picker-search-bulk-chain` · Role: reviewer · Author: plan-fix (commit `7aeab75d`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: same-model · Policy: v1
- Context-clean note: this conversation wrote/replanned no part of the unit (review-only turn)
- Started/finished: 2026-09-08 (session clock finish 2026-09-08T22:49Z) · Findings: 1 (material open: 0)
- Ledgers read: planning-evidence 13 rows (PE-001…PE-013, embedded in the SPEC) · obligations 16 rows (OB-1…OB-16, verified-capable: 0 — all validators pin future work)
- Prior plan receipt (re-review only): rp-fix154-20260908-001 @ a0ed8357905ab4763fe15273ebfd086a7fd5b1e4116261dab8fff3e8e4cb70a6 (PLAN-REVIEW-FAIL, RP1-F1 medium + RP1-F2 low)
- No-progress gate: satisfied — the snapshot changed (`a0ed83…` → `989184d2…` via the repair batch `7aeab75d`), so this re-review judges a new artifact revision, not a repeat of the cycle-1 question. First re-review; no CONVERGENCE-ANOMALY.
- Portability note: unchanged — the runtime does not rotate `artifactRevisionId`; the repair commit `7aeab75d` is the current artifact revision, and fff08ffe touched only progress.md/planning-findings.md (not snapshot-bound bytes).

### Repair verification (both RP1 rows re-checked at this revision)

- RP1-F1 (scoped validators) — **repaired, verified**: zero residual `bun run test test/` cells in SPEC `### Obligations` + `## Phases` done-whens and ACCEPTANCE.md validator cells (grep → 0). Fresh falsification probes at this revision: `bun test test/config-merge.test.mjs` → `9 pass, 1 file` (direct form scopes); `bun test test/config-merge.test.mjs test/unavailable-stop.test.mjs` → `17 pass, 2 files`; `bun run test test/picker-filter.test.mjs` → full suite `140 pass / 0 fail, 14 files, exit 0` (full form never scopes — the repair was necessary); missing-file: `bun test test/zzz-missing.test.mjs` → **exit 1** at bun 1.4.2 with only a note and no summary line (fail-closed — stronger than the exit-0 behaviour the cycle-1 evidence recorded); mixed case `bun test test/config-merge.test.mjs test/picker-filter.test.mjs` (one file absent) → exit 0 but summary `across 1 file`, which fails every required-evidence cell pinning `across 2 files`. All three no-op paths (file absent, partial file set, full-form arg) now fail closed or are betrayed by the required summary line. L5/P10 restore to pass.
- RP1-F2 (PE-011 citation) — **repaired, verified**: SPEC PE-011 now cites `src/extension/factory.ts:92` (`registrar.registerCommand(SETTINGS_COMMAND, …)`), `factory.ts:79` (`knownCommands`), `index.ts:96-104` as the `runSettingsConsole` wiring; re-read at HEAD confirms all three (`grep -n` → factory.ts :79, :92; index.ts :94 wiring block). No packages/ bytes changed since `f48dff00` (`git diff --name-only f48dff00..HEAD -- packages/` → empty), so all 13 PE rows keep `current` + `proven`.

### Re-review checks

- Ledger sweep: L1 pass (fix unit — snapshot `parentSpecSnapshotDigest: null`, stated plainly, no borrowed Product receipt) · L2 pass (13/13 rows current+proven; PE-011 corrected; no unknown/drifted/stale) · L3 pass (16 obligations, ids stable, no duplicates) · L4 pass (each row: one phase, one task, owner `execute-phase --fix`, validator copied, required evidence named, no blank/deferred) · L5 pass (scenario↔validator↔phase closure restored — see probes above; no validator weakened: the full gate OB-16/AC13 keeps `bun run test`) · L6 pass (RP1-F1, RP1-F2 resolved with resolution evidence @ `7aeab75d`; no open material row carried into execution)
- Engineering checks (fix unit): P1–P9 pass (unchanged from cycle 1 — surfaces, closure, compatibility boundary, security n/a, no migration, recovery, rollback, observability, phase-lint fingerprints 8/8 across P1–P8) · P10 pass (restored — every scoped validator can fail for its scope; required-evidence pins the `Ran N tests across K file(s)` summary) · P11 pass (unchanged) · P12 pass (restored — PE-011 corrected; all other citations verified at this revision)
- Fix checks: F1–F4 pass (unchanged from cycle 1)
- Falsification stance: **NO-CONFIRMED-GAPS** — strongest hostile-reader candidates probed and refuted: (1) "a scoped validator still passes on a no-op" → refuted by the three probe paths above; (2) "an Engineering claim is invented" → PE-011 was the one imprecise row, now corrected and re-verified; (3) "a phase's deliverable is accepted while its validator passes for the wrong reason" → a file set smaller than the validator names produces `across K file(s)` with K < the required count, so the evidence paste fails; partial-implementation risk (existing file, missing cases) is the ordinary test-validator residual owned by `review-change`, not a no-op.
- Non-material observation filed: RP2-F1 (info) — ACCEPTANCE.md AC4/AC5 say "effort" where the field is `thinking` (SPEC, obligations, and src use `thinking`; `src/` has 0 "effort" occurrences). Wording only — no validator, required outcome, or behaviour affected.



## Acceptance receipt v1
- Manifest: docs/fix/154-settings-picker-search-bulk-chain/ACCEPTANCE.md · Blob: b582c5008cda34e59d20c7b08ba379067a67e6f6 · Status: frozen · Verified: 2026-09-08

## Unit-loop receipt — P1
- Commit: 18ba3c3b · Gate: `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs` (exit 0, 16 pass / 0 fail) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P2 · Attempts: 1
- Done: model-chain config schema — `ModelSetting = "inherit" | ModelRef | readonly ModelRef[]`, `MAX_MODEL_CHAIN = 4` (types.ts); `checkRoute` accepts a non-empty chain of ≤4 reference strings, every violation reported at `$.commands.<name>.model` naming the offending element or the limit (schema.ts); merge picks a chain as one per-key value with order preserved — no code change needed, `pick(first-defined)` already treats a chain as an opaque value once types.ts makes it a valid ModelSetting; **7 new chain tests** in config-merge.test.mjs.
- Remains: P2 (chain-probe dispatch) … P8 (hardening & PR).
- Gotchas: the scoped validator `bun test test/<file>` needs `bun run build` (tsc) first because the suite imports `../dist/…` and `dist/` is gitignored (not committed). A `/\"…\"/u` regex is a SyntaxError under the `u` flag — used `assert.ok(msg.includes(…))` instead. merge.ts needed no edit despite P1 task 4 naming it (verified by the round-trip and global-only chain tests).
- Files: src/config/types.ts, src/config/schema.ts, test/config-merge.test.mjs, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P2 chain-probe dispatch.

## Unit-loop receipt — P2
- Commit: 939b41f3 · Gate: `cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs test/default-inherit.test.mjs` (exit 0, 25 pass / 0 fail) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P3 · Attempts: 1
- Done: chain-probe dispatch — `dispatch.ts` probes a `route.model` chain in order with only `ctx.find` + `ctx.hasConfiguredAuth` (no session mutation), collects one skip reason per entry, applies the first usable one, and routes an exhausted chain through `onUnavailableRoute` (`stop` refuses / `inherit` notifies) naming every candidate and why it was skipped; the single-reference path is byte-identical in behaviour and message shape; the select-failure message now names the chosen entry via `chosenRef`. **7 new chain tests** in unavailable-stop.test.mjs (applies-first-usable, skip-no-auth, swallow-unknown, exhausted-stop, exhausted-inherit, probe-purity once, no-second-setModel).
- Remains: P3 (alias) … P8 (hardening & PR).
- Gotchas: the chain `stop` message shape is `… the configured model chain <refs> is unavailable (<reason>; <reason>).` — the single-reference path keeps its original `… the configured model <ref> <blocker>.` phrasing. `chosenRef` records the specific reference behind `target` so a select failure on a chain names only the chosen entry (not the whole array). `selectFails: true` still refuses via `setModel` returning false; probing never calls `setModel`.
- Files: src/routing/dispatch.ts, test/unavailable-stop.test.mjs, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P3 `/aw-settings` alias command.

## Unit-loop receipt — P3
- Commit: d36ece93 · Gate: `cd packages/pi-agentic-workflow && bun test test/alias-coverage.test.mjs` (exit 0, 15 pass / 0 fail) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P4 · Attempts: 1
- Done: `/aw-settings` alias — `SETTINGS_COMMAND_ALIAS = "aw-settings"` exported beside `SETTINGS_COMMAND` (routing/types.ts); `factory.ts` extracts the settings command into a shared `settingsHandler` and registers both names with the same description + handler (a pointer, never a separate route surface), and adds the alias to `knownCommands` so a route-name typo check stays exact. New red-first test pins both registrations, the same description, the same handler invocation (calls.notify === ["settings"]), and the registered-command count (3). The two existing exact-registered-set assertions updated to include the alias.
- Remains: P4 (picker primitive) … P8 (hardening & PR).
- Gotchas: adding the alias is a real new registered command, so the existing exact-set assertions in alias-coverage.test.mjs legitimately change (they were pinned pre-alias). The AC15 README command-table test still passes because `/aw-settings` is not yet added to the README table — P7 must add it in the settings section, not as a separate command-table row, or that test re-fails.
- Files: src/routing/types.ts, src/extension/factory.ts, test/alias-coverage.test.mjs, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P4 searchable windowed picker primitive.

## Unit-loop receipt — P4
- Commit: 0d8bbda6 · Gate: `cd packages/pi-agentic-workflow && bun test test/picker-filter.test.mjs test/settings-console.test.mjs` (exit 0, 34 pass / 0 fail) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P5 · Attempts: 1
- Done: searchable windowed picker primitive — `SettingsUi.pick` optional rich seam (filterable, `initial` preselection, `multiple`, position indicator) as a structural superset (routing/types.ts); `@earendil-works/pi-tui@0.85.1` pinned dependency + bun.lock; `src/settings/picker.ts` with the pure in-package subsequence/slash-aware `filterReferences` (OB-2) and `createPickerComponent` over pi-tui `SelectList` (rebuilds the window client-side so the in-package filter — not `SelectList`'s prefix `setFilter` — drives typing); the adapter's `richUi` wires `pick` through `ctx.ui.custom()` in TUI mode and falls back to `select` in non-TUI mode (OB-12). `askModel`/`askThinking` use `pick` when present and pass the value in force as `initial`. 6 filter tests + 2 console tests (rich seam consumes + non-TUI fallback).
- Remains: P5 (current-value field editing) … P8 (hardening & PR).
- Gotchas: (1) **deviation from SPEC's `N–M of K` indicator** — pi-tui `SelectList` ships a built-in `(index+1 / count)` position indicator; the SPEC's literal `N–M of K` range format is not reachable through its `theme.scrollInfo` (which formats a pre-built string), so the shipped indicator is `(index+1/count)` and the SPEC wording is aspirational (flag for review-change). (2) The in-package filter drives the window by rebuilding the `SelectList` per keystroke (`setFilter` is prefix-only, and `SelectList` has no post-construction item setter), so the subsequence/slash-aware semantics are honored, at a rebuild cost per keystroke. (3) The adapter's live custom-component path is exercised only by the manual AC1/AC2 check — the automated suite pins the filter function, the seam consumption, and the non-TUI fallback, not the live TUI rendering. (4) Console tests now exercise `pick` (the scripted ui gained a `pick`); `rich: false` strips it to pin the non-TUI fallback.
- Files: src/routing/types.ts, src/settings/picker.ts (new), src/settings/console.ts, src/extension/index.ts, package.json, bun.lock, test/picker-filter.test.mjs (new), test/settings-console.test.mjs, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P5 current-value field editing.

## Unit-loop receipt — P5
- Commit: bfd2aa09 · Gate: `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` (exit 0, 33 pass / 0 fail) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P6 · Attempts: 1
- Done: current-value field editing — `editRoute` opens on the merged value in force (`currentFor(target)`), the field chooser (`prompts.fields` — both/model/thinking) asks only the marked field and leaves an unmarked one at its merged value (AC4 field independence), a no-change edit saves a byte-identical file; the ordered chain builder (append via the picker, remove-last, done, capped at MAX_MODEL_CHAIN=4) saves the model as a chain in build order; model-entry rejection keeps the loader path shape `$.commands.<name>.model` (including chain elements hand-typed or inherit-in-chain); `renderMergedConfig` renders a chain in order (`a/m1 → b/m2 / inherit`) with single-ref/inherit unchanged. 5 new console tests (model-only, thinking-only, byte-identical, chain builder, merged chain render).
- Remains: P6 (bulk apply/clear) … P8 (hardening & PR).
- Gotchas: (1) **label gap** — OB-3/AC3 names `(current)` / `(default route)` labels in the picker; the implemented behavior preselects the value in force via `pick(…, { initial })` and reproduces the file byte-identically, but the literal label suffix is not rendered by the picker (the seam's `pick` takes values only, and `SelectList` labels are not wired to it). Flag for review-change; the manual AC3 check covers the labelled display. (2) `askModel` validation now uses `parseModelReference` (schema-consistent) instead of the old console regex, so `provider/modelId/id` (a slash inside the id) is accepted — consistent with the schema, which already accepted it. (3) The field chooser a menu (both/model/thinking) rather than independent multi-select toggles — behaviorally equivalent to "only marked fields asked; none → untouched".
- Files: src/settings/console.ts, src/settings/view.ts, test/settings-console.test.mjs, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P6 bulk apply and bulk clear.

## Unit-loop receipt — P6
- Commit: 82239504 · Gate: `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` (exit 0, 36 pass / 0 fail) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P7 · Attempts: 1
- Done: bulk apply + bulk clear — `runSettingsConsole` gains `bulkApply`/`bulkClear` menu entries; `pickCommandsMulti` picks several commands over the seam's `multiple` mode (with a repeated-select fallback for a non-rich UI); bulk apply runs ONE field pass (model via the chain builder + thinking) and applies it to every selected command, warning per command when a chosen reference is absent from the live registry (never blocks the write — dispatch's probe stays authoritative); bulk clear removes every selected override in one save. 3 new console tests (apply-to-two-matches-single-pass, clear-two, missing-ref-warning-per-command).
- Remains: P7 (docs + release bookkeeping) … P8 (hardening & PR).
- Gotchas: the multi-select command pick uses `prompts.command` over the seam's `multiple: true`; the scripted harness returns the whole selection for a multiple pick (and a queue for a single pick). The non-rich fallback loops single selects + a confirm; the tests drive the rich path. `route.model` is optional on the `RouteFile` return, so `warnMissingModel` receives `route.model ?? inherit`.
- Files: src/settings/console.ts, test/settings-console.test.mjs, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P7 package docs and release bookkeeping.

## Unit-loop receipt — P7
- Commit: 7fd87ea5 · Gate: read-verified — chain + `aw-settings` present in both README.md and README.es.md; version bumped 0.7.2 → 0.8.0 with a row in the "Companion npm packages" tables of CHANGELOG.md + CHANGELOG.es.md; full gate `bun run test` exit 0, 171 pass / 0 fail (AC15 README command-table, troubleshooting-quote, example-identity and section-count checks all green) · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Next: P8 · Attempts: 1
- Done: package docs + release bookkeeping — README.md config-schema section documents the ordered fallback chain (`model` array of 1–4 refs, dispatch probes with `find`/`hasConfiguredAuth`, exhaustion names candidates), the searchable windowed picker behaviour (filter, current-value preselection, position indicator, non-TUI fallback), the field-choice + byte-identical no-change + bulk apply/clear, and the `/aw-settings` alias; README.es.md carries the faithful sibling with the byte-identical config example (same commit, AD-002); package.json version → 0.8.0 (minor) with a bilingual changelog row in both CHANGELOG.md/CHANGELOG.es.md.
- Remains: P8 (hardening & PR).
- Gotchas: the AC15 alias-coverage checks pin the README: `/aw-settings` must NOT appear in the main command-table (it is documented in the settings-console section only) or that test re-fails; the config example JSON must stay byte-identical EN==ES; section counts must match. Kept `/aw-settings` out of the command table and the example identical — AC15 green. The `0.8.0` changelog row uses the `0.7.2` row's date epoch (2026-09-09) to stay monotonic.
- Files: packages/pi-agentic-workflow/README.md, README.es.md, package.json, CHANGELOG.md, CHANGELOG.es.md, docs/fix/154-settings-picker-search-bulk-chain/SPEC.md, docs/fix/154-settings-picker-search-bulk-chain/progress.md.
- Next: P8 hardening & PR.

## Unit-loop receipt — P8
- Commit: cc626760 · Gate: `bun run test` (exit 0, 171 pass / 0 fail) + acceptance blob `b582c5008cda34e59d20c7b08ba379067a67e6f6` (re-derived, exact) + `git status --porcelain docs/` → empty · Acceptance blob: b582c5008cda34e59d20c7b08ba379067a67e6f6
- Close-out: fix-index row flipped to `done`; push; PR opened with `Closes #154`; link row to `done · [#<pr>](<url>)`.
- Next: none (unit complete) — `/review-change` on the changed HEAD is the mandatory end review.
