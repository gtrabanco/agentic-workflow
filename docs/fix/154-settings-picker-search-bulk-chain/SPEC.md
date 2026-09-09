# fix/154-settings-picker-search-bulk-chain

> Fix specification for issue #154 — the `/agentic-workflow-settings` console's
> list pickers are unusable at registry scale: no search, no scroll window, no
> pre-selected current value, one command per pass, and exactly one model per
> route. No Product half: a fix unit's authority is reproduction, root cause,
> regression scope, and rollback. Five defects (A–E), one shared root cause
> (the picker primitive) plus one blocked capability (the ordered fallback
> chain).

## Goal

Make per-skill model routing actually configurable on a normal install: a
searchable, windowed picker that opens on the value in force; independent
model/thinking field editing; one-pass bulk apply/clear over several commands;
a `/aw-settings` alias; and an ordered model fallback chain per route, probed
by dispatch without touching session state mid-probe. Without this, the
shipped package degrades to its defaults on any registry with more models than
fit a terminal (issue #154 severity: high).

## Issue

`#154` — ["ISSUE: /agentic-workflow-settings pickers are unusable at scale —
no search, no current value, no bulk edit, no model fallback
chain"](https://github.com/gtrabanco/agentic-workflow/issues/154) (`bug`,
opened 2026-08-30 by `gtrabanco`). The PR closes it via `Closes #154`.

## Branch

`fix/154-settings-picker-search-bulk-chain` (from `main` at `f48dff00`;
re-branched from the provisioned worktree branch `fix/154`, which had been cut
at `a60722f0` carrying fix #200's SPEC commits — one PR per unit, AD-004).

## Depends on

None. Follow-up to feature 27 (F-27, PR #150); independent of #201, #198,
#196, #174 (see Cross-issue notes).

## Root cause

**A–D — the picker primitive.** F-27 built the console against the
deliberately narrow Pi-free seam `SettingsUi.select(title, options)`
(`src/routing/types.ts:49`), which has no filter, no initial index, no
multi-select and no current-value argument. Every console prompt therefore
inherits Pi's non-searchable `ui.select`:

- **A** — the model list is the whole registry plus `TYPED` as the last row
  (`src/settings/console.ts:70,187`); both fall-through paths are free text
  (`console.ts:188,190`), so anything past the terminal's height requires
  hand-typing `provider/modelId`.
- **B** — menu, policy, scope, model, thinking and command prompts all call
  `ui.select` (`console.ts:86,125,149,187,210,222`); Pi's
  `ExtensionSelectorComponent` renders one text child per option with no
  filter handling (pi-coding-agent 0.85.1,
  `dist/modes/interactive/components/extension-selector.js`).
- **C** — `askModel` (`console.ts:184-206`) and `askThinking`
  (`console.ts:209-212`) never pass a current value, so the cursor is always
  index 0 and the value in force is neither marked nor selected;
  `editRoute` (`console.ts:176-183`) always asks both fields in sequence, so
  there is no "keep current" either.
- **D** — `setOverride` picks exactly one command (`console.ts:109-115`) via
  `pickCommand` (`console.ts:217-223`); `clearOverride` the same
  (`console.ts:116-121`).

**E — the route shape.** `ModelSetting = "inherit" | ModelRef` and
`RouteFile.model?: ModelSetting` (`src/config/types.ts:21,30`); `dispatch.ts`
resolves exactly one reference (`src/routing/dispatch.ts:222-234`) with a
single global `onUnavailableRoute` policy. Multi-provider redundancy is
unexpressible. This is F-27's own config-schema scope, not a regression.

All five are confirmed in source, not just observed; the issue's line numbers
match this revision exactly (PE-001..PE-003).

## Detected in

First real configuration pass on `@gtrabanco/pi-agentic-workflow` v0.1.0
(F-27, PR #150) against a Pi registry with models from several providers
(2026-08-30, issue #154 reproduction steps 1–6). Baseline suite on this
branch's base: `bun run test` in `packages/pi-agentic-workflow` → **140 pass,
0 fail** (2026-09-08), so every defect is a missing capability, not a failing
assertion.

## Scope

### In scope

- **A+B — searchable windowed picker.** `SettingsUi` gains an optional rich
  picker (`src/routing/types.ts` — a structural superset, so existing call
  sites keep compiling); the Pi adapter implements it with `ctx.ui.custom()`
  over `@earendil-works/pi-tui`'s `SelectList` (`setFilter`,
  `setSelectedIndex`, built-in windowing + scroll-info line), with an
  in-package token/subsequence, slash-aware filter. Typing narrows the list
  anywhere a list can overflow (model, thinking, command menus); the cursor
  never leaves the screen and a position indicator (`12–31 of 148`) is shown.
  Non-TUI modes (headless/RPC) fall back to `select`/`input` so the console
  never dead-ends.
- **C — current value + independent fields.** Editing a route opens each
  picker **on** the value in force, labelled (`(current)` / `(default route)`
  when inheriting); a field chooser asks which fields to change (model,
  thinking) and only the selected fields are asked; Enter with no change
  leaves the saved file byte-identical.
- **D — bulk edit.** One pass selects several commands and applies one
  model + thinking to all; the same for clearing several overrides. The
  resulting file equals what N single-command passes produce. A reference
  missing from the live registry produces a per-command advisory warning, not
  a blocked write (dispatch's own probe stays the authoritative gate).
- **Alias — `/aw-settings`.** A second registered command that opens the same
  console against the same files (a pointer, not a separate route; config
  keys are unaffected).
- **E — ordered model fallback chain.** `model` accepts
  `"inherit" | "provider/modelId" | ["provider/modelId", …]` (1–4 entries,
  elements must be references). `dispatch.ts` probes the chain **before**
  applying — first entry that resolves AND has configured auth is applied;
  `setModel` runs at most once per routed turn; `onUnavailableRoute` decides
  only after the chain is exhausted, and both refusal and fallback messages
  name every candidate and why it was skipped (unknown vs. no auth).
  Merge preserves the chain (project over global, per key); the merged view
  renders a chain in order.
- **Tests** for all of the above (red-first, per this repo's convention),
  package README EN+ES, and package release bookkeeping (version bump +
  bilingual changelog tables).

### Out of scope

- **#201 (operator-approved model routing for spawned review passes)** —
  different surface (review passes / `resolve-passes`), no shared file or
  flow with this console; separate feature.
- **Per-chain-entry thinking levels** — rejected: one thinking level per
  route (the issue's own proposal). Per-entry levels multiply the restore
  logic and the "operator seized the session mid-turn" rules in
  `dispatch.ts`.
- **Live chain reorder keys** — the chain is built in order (repeated
  append, remove-last, done); changing order means rebuilding the chain. A
  custom reorder keyboard model is new UI territory this fix does not open.
- **Pi core changes** — none are needed (PE-004); any upstream gap found
  during execution is a separate report, never a fork of Pi's components.
- **#198 / #196 (per-skill script relocation; producer package)** —
  unrelated package-layout features; no overlap with
  `packages/pi-agentic-workflow/src`.
- **#200 (check-skill-context fixture)** — its own branch
  `fix/200-over-budget-fixture-stale-guard`; this unit was re-branched from
  `main` precisely to keep the two apart.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: with a multi-provider registry the model prompt renders one row per model (whole registry + `TYPED` last), typing does not filter, the cursor leaves the screen, and both fall-throughs are free-text `provider/modelId or inherit`; the current thinking level is never marked | forge + repository | issue #154 repro steps 1–4 (https://github.com/gtrabanco/agentic-workflow/issues/154, 2026-08-30); `packages/pi-agentic-workflow/src/settings/console.ts:70,184-206` | `f48dff00` | AC1, AC2, AC3 | current | proven | — |
| PE-002 | Root cause A–D: the `SettingsUi` seam (`select(title, options)`) has no filter/initial-index/multi-select/current-value argument, and every console prompt goes through it; `editRoute` always asks both fields | repository | `packages/pi-agentic-workflow/src/routing/types.ts:49`; `src/settings/console.ts:86,125,149,187,210,222` (prompts), `:109-121` (single-command set/clear), `:176-183` (both fields in sequence) | `f48dff00` | AC1, AC3, AC4, AC5, AC12 | current | proven | — |
| PE-003 | Root cause E: `ModelSetting = "inherit" \| ModelRef` is a single reference; `dispatch.ts` resolves exactly one reference and applies one global `onUnavailableRoute` policy | repository | `packages/pi-agentic-workflow/src/config/types.ts:21,30`; `src/routing/dispatch.ts:222-258` | `f48dff00` | AC7, AC8 | current | proven | — |
| PE-004 | Pi capability check (issue's "no upstream change needed" claim, verified): `ctx.ui.custom<T>(factory, {overlay})` exists (pi-coding-agent 0.85.1 `dist/core/extensions/types.d.ts:116-136`); `@earendil-works/pi-tui` `SelectList` exposes `setFilter`/`setSelectedIndex`/built-in windowing + scrollInfo (`dist/components/select-list.d.ts:38-39`); `ModelSelectorComponent`/`ThinkingSelectorComponent` are exported but `ModelSelectorComponent` needs a `ModelRuntime` that `ExtensionContext` does not expose — so the picker is built over `SelectList`, not over Pi's model selector. **Correction:** `fuzzyFilter`/`fuzzyMatch` exist in pi-coding-agent but are **not** exported, so the subsequence/slash-aware filter is implemented in this package | repository | installed `@earendil-works/pi-coding-agent@0.85.1` + `@earendil-works/pi-tui@0.85.1` dist typings (read 2026-09-08) | 0.85.1 | AC1, AC2, AC12; P4 design | current | proven | — |
| PE-005 | Chain probing fits the primitives the router already injects: `ModelLookup.find()` + `hasConfiguredAuth()` + `setModel(): Promise<boolean>`; probing uses only the first two, so no session state moves mid-probe. A trial `setModel()` must never be used to probe: selecting a model re-derives the thinking level inside Pi (N-3) and would leave the session half-switched | repository | `packages/pi-agentic-workflow/src/routing/types.ts:33-45,57-63`; `src/routing/dispatch.ts:222-249,265-269` (N-3 comment) | `f48dff00` | AC7, AC8, AC10 | current | proven | — |
| PE-006 | Regression scope: existing behaviour is pinned by the current suite (140/140 green on the base revision, 2026-09-08) — `default-inherit`, `unavailable-stop`, `restore-after-settle`, `config-merge`, `dispatch-refusals`, `settings-console`, `alias-coverage`, `skill-parity`. E is additive: a string `model` loads exactly as before; a chain is read only when a file declares an array | repository | `packages/pi-agentic-workflow/test/` (14 files); baseline run `bun run test` → `140 pass / 0 fail` | `f48dff00` | AC9, AC12 | current | proven | — |
| PE-007 | Rollback: A–D are console-only — reverting restores `src/settings/console.ts` + the new picker module, and the seam stays a superset so old call sites keep compiling; E is additive and backward compatible — revert is the config-schema + merge + dispatch commits, leaving the picker untouched. No data, no migration, no cache (config files are JSON) | derived | rule: per-commit revert of P1/P2 (E) vs P3–P6 (A–D, alias) of the unit's PR; inputs PE-002, PE-003, PE-006 | `f48dff00` | Rollback section | current | proven | — |
| PE-008 | Affected invariant / use case: F-27's "honest routing" invariant — a configured route applies to one invocation and is restored after `agent_settled`; a rejection names the value and the field path the loader would use (`$.commands.<name>.model`, AC5 shape); `clean()` elides empty routes by VALUE, never by default-agreement (F4). All must survive the console and schema changes | document | `docs/features/27-pi-agentic-workflow/SPEC.md` §"Engineering half" (Technical goals, Command surface, Settings console); `src/settings/console.ts:243-259` (clean, F4 comment); `src/settings/view.ts:14-19` (routePath) | current tree | OB-11, OB-13, AC3, AC9 | current | proven | — |
| PE-009 | Cross-issue exposure: no open PRs exist (2026-09-08). #201 (review-pass routing), #198/#196 (package layout), #174 (state flow) share no file or flow with this fix. #200's branch is separate; this unit was re-branched from `main` at `f48dff00` to stay independent | forge | `gh pr list --state open` → `[]`; issues #201, #198, #196, #174, #200 (titles read 2026-09-08) | 2026-09-08 | Cross-issue notes | current | proven | — |
| PE-010 | Seam-superset claim (compilation): adding an optional member to `SettingsUi` cannot break existing call sites — all current uses (`console.ts`, tests, factory wiring) reference only the existing four members | derived | rule: TypeScript structural typing over an optional member; input rows PE-002, PE-006 | `f48dff00` | AC13, P4 task 1 | current | proven | — |
| PE-011 | Alias surface: commands are registered by name via `registrar.registerCommand(SETTINGS_COMMAND, …)` (`src/extension/factory.ts:92`; the `knownCommands` guard is at `factory.ts:79`; `index.ts:96-104` is the console wiring `runSettingsConsole({…})` inside the `settings:` surface callback, not the registration). A second registration `aw-settings` with the same handler is a pointer — config keys and `routePath` are unaffected | repository | `packages/pi-agentic-workflow/src/extension/factory.ts:79,92` (knownCommands + settings registration); `src/extension/index.ts:96-104` (console wiring); `test/alias-coverage.test.mjs` (pins the settings command today) | `f48dff00` | AC6 | current | proven | — |
| PE-012 | Docs surfaces: the package README pair documents the settings command and the invalid-configuration path (`README.md:120,131`; `README.es.md:125,137`) and must gain the chain schema + alias; the bilingual same-commit rule is a repo hard rule (AD-002). Package version bumps are manual and same-PR with the changelog package tables | document + ledger | `packages/pi-agentic-workflow/README.md` / `README.es.md`; `CLAUDE.md` §"Working rules" (bilingual hard rule) + §"Packages" (version bumps); `REPOSITORY_STATE.md` AD-002 | current tree | AC12, P7 | current | proven | — |
| PE-013 | Observability surface: the package has no metrics/alerts; health is expressed through `ui.notify` messages (refusals, warnings, saves) and the test suite's exit status. Both new message families (chain-exhausted refusal, bulk advisory warnings) are pinned by tests, not by prose | repository | `src/routing/dispatch.ts` (refuse/notify pattern); `test/unavailable-stop.test.mjs` (message assertions) | `f48dff00` | Observability section, AC8 | current | proven | — |

No web pass was needed: every bounded question (Q1–Q5) was answered from
repository + installed-package evidence (PE-001..PE-013).

### Obligations

**Scoped validator shape (OB-1…OB-14 and every P1–P6 done-when).** Scoped
validators use the direct form `cd packages/pi-agentic-workflow && bun test
test/<file>…`, never `bun run test <args>` — the package's test script is
`tsc && bun test test/*.test.mjs`, so `bun run` appends args after the whole
script and never scopes, while the direct form scopes to the named files **only
when they exist**: `bun test` on an unmatched path exits 0 printing just a note
and no summary line. The missing-file case is covered two ways: (1) task
ordering — every file-creating task precedes the phase whose validator names
the file (P1 task 1 extends `config-merge.test.mjs`; P2 task 1 extends
`unavailable-stop.test.mjs`; P4 tasks 4–5 create `picker-filter.test.mjs` and
extend `settings-console.test.mjs`; every other named file exists before its
phase); (2) required evidence — every scoped validator's required evidence is
the pasted summary line `Ran N tests across K file(s)`, which an absent file
cannot produce. The full gate (OB-16) stays `bun run test` (tsc + whole suite).

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | Issue #154 "Expected behaviour" (Filter, Scroll) + PE-001/PE-004 | Any list that can overflow filters while typing, keeps the cursor visible, and shows a position indicator | P4 | Picker task 4 | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs test/picker-filter.test.mjs` → exit 0 with the picker cases green + scoped summary (`Ran N tests across 2 files`) | Scoped summary line + test names pasted in the phase tick | planned |
| OB-2 | Issue #154 (Filter semantics) + PE-004 | `flash` matches every ref containing flash; `nan/` matches provider `nan` only (token/subsequence, slash-aware) | P4 | Picker filter unit test | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/picker-filter.test.mjs` → exit 0 with the two pinned cases + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-3 | Issue #154 (Current value; Independent fields) + PE-008 | Route editing opens on the value in force (labelled), asks only changed fields, and a no-change edit saves a byte-identical file | P5 | Field-chooser + preselection tasks | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 (byte-identical + independence cases) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-4 | Issue #154 (Bulk edit) | One pass assigns model + thinking to ≥ 2 commands and one pass clears ≥ 2; result equals N single passes; per-command advisory warning for registry-missing refs | P6 | Bulk tasks | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 (bulk equivalence fixtures) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-5 | Issue #154 (Shorthand) + PE-011 | `/aw-settings` opens the same console editing the same file; config keys unaffected; alias-coverage pins it | P3 | Alias tasks | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/alias-coverage.test.mjs` → exit 0 + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-6 | Issue #154 (Fallback order) + PE-003/PE-005 | A route's `model` accepts an ordered reference chain (1–4 entries); schema rejects non-reference elements and > 4 entries; single-string and `inherit` load unchanged | P1 | Red-first chain tests task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs` → exit 0 + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-7 | Issue #154 (Fallback order) + PE-003 | Merge preserves a chain project-over-global per key, with its order round-tripping through a save | P1 | Merge task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs` → exit 0 (order round-trip case) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-8 | Issue #154 (Fallback order) + PE-005 | Dispatch applies the first chain entry that resolves AND has configured auth, probing without session mutation | P2 | Chain-probe tests task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs` → exit 0 + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-9 | Issue #154 (Fallback order, exhaustion) + PE-013 | Chain exhausted: `stop` refuses naming every candidate and why it was skipped (unknown vs. no auth); `inherit` runs the session model with the same explanation | P2 | Exhaustion message task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs` → exit 0 + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-10 | Issue #154 (probe purity) + PE-005 | Chain probing never mutates session state: `setModel` called at most once per routed turn | P2 | Probe-purity test task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs` → exit 0 (setModel-call-count assertion) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-11 | PE-008 (AC5 path shape, schema side) | Schema rejections keep the loader's field-path shape (`$.commands.<name>.model`), naming the offending element or the limit | P1 | Schema validation task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs` → exit 0 (invalid-element path cases) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-12 | PE-004 (mode guard) | Non-TUI modes keep a working text-input path: the picker falls back to `select`/`input`, the console never dead-ends | P4 | Fallback task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 (fallback fixture) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-13 | PE-008 (AC5 path shape, console side) | Console rejections — including hand-typed chain elements — keep the loader's path shape (`$.commands.<name>.model` / `...thinking`) | P5 | Rejection-path task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-14 | AC11 + PE-003 | The merged view renders a route's chain in order | P5 | Merged-view task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 (chain-render case) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |
| OB-15 | PE-012 (docs + release bookkeeping) | README EN+ES document the chain schema, the picker and the alias in the same change; version bump + bilingual changelog tables in the same PR | P7 | Docs tasks | execute-phase --fix | read-verified: chain + `aw-settings` present in both READMEs; `git status --porcelain docs/` → empty after commit | Grep output + PR diff pasted | planned |
| OB-16 | PE-006 (gate) | The package gate is green on the final tree, including tsc | P7 | Verify-only gate task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun run test` → exit 0, `0 fail` | Command output pasted | planned |
| OB-17 | AC14 + PE-008 (F2 / A1) | Editing a route whose `model` is a chain (≥2 refs) opens the chain builder seeded with the value in force and labels it, so the operator sees and can edit the current chain rather than rebuilding it blind | P9 | Chain-builder seed task | execute-phase --fix | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 (chain-edit seed cases) + scoped summary (`Ran N tests across 1 file`) | Scoped summary line pasted | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` — never unlabelled prose.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction, the root
      cause, the regression scope, and the rollback path — none blank, none
      `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Rules that must never be violated

- **Honest routing (F-27 invariant, PE-008):** a probe never mutates session
  state — `setModel` at most once per routed turn; restore semantics
  (`restore-after-settle`) are untouched by this fix.
- **Rejection-path shape (F-27 AC5):** config rejections keep naming the
  loader's field path (`$.commands.<name>.model` / `.../thinking`) in the
  operator's terms.
- **Fail-closed config:** a present-but-invalid file still refuses dispatch
  (`dispatch-refusals`); a chain is validated strictly — an invalid element
  is an error, never a silent skip at load time (loading-time skipping is
  dispatch's job, with named reasons).
- **Test immutability (verification-contract):** existing assertions in
  `test/*.test.mjs` are immutable; this fix adds tests, it never edits an
  expectation to match new behaviour. The scripted-ui contract of
  `test/settings-console.test.mjs` (prompts from the `prompts` table) is
  preserved.
- **Bilingual docs (AD-002):** `README.md` and `README.es.md` change in the
  same commit, never one side alone.
- **Dependency policy (CLAUDE.md §Packages):** `@earendil-works/pi-tui` is
  added pinned to the exact version matching the pi peer line, exact-version
  pinning everywhere, no lockfile but `bun.lock`.

## Impact

- **Layers touched** — domain (`config/types.ts`, `config/schema.ts`,
  `config/merge.ts`), api (`routing/dispatch.ts`, `extension/factory.ts`,
  `extension/index.ts`), ui (`settings/console.ts`, `settings/view.ts`, new
  picker module, `routing/types.ts` seam), docs (package README EN+ES,
  changelog tables, version bump).
- **Modules and files** — `packages/pi-agentic-workflow/src/config/*`,
  `src/routing/*`, `src/settings/*`, `src/extension/*`, `package.json`,
  `README.md`, `README.es.md`, `test/*`.
- **Blast radius** — the package only. No skill tree change (no
  `bundle:skills` / `bump-skill` run), no schema package change, no
  `settings.json` keys (F-27 AC16 holds). The seam stays a superset
  (PE-010); string `model` configs load byte-identically (PE-006).
- **Detection lead time** — CI publishes on merge (`publish-pi-package.yml`);
  the package gate is local per CLAUDE.md, so a regression surfaces at the
  next local gate run before push. Post-fix, the chain-exhaustion and probe
  messages give immediate in-session detection of an unusable route.

## Operational risks

- **Pi API surface** — the picker rides `ctx.ui.custom` + `pi-tui`
  `SelectList` (PE-004). Risk: a future pi/pi-tui minor changes those
  signatures. Mitigation: pinned exact pi-tui version; the peer line
  `>=0.85.1` is re-verified on the cadence of #166-style baseline refreshes;
  the mode-guard fallback keeps the console usable even if the custom path
  throws (the factory's console error handler already reports a dead console
  instead of taking the session down).
- **Concurrency** — none new: the console runs only while the agent is idle
  (the routed-turn latch and busy guards are dispatch-side and untouched).
- **Schema** — additive only; no migration. Old files parse exactly as
  before (OB-6).

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits involved. The console
writes only the two dedicated JSON files it already wrote; the project file
stays gated on project trust (AC13 of F-27, unchanged and re-pinned by the
existing `untrusted-project-config` test).

## Compliance touchpoints

n/a — no domain or compliance rules apply.

## Affected docs

- `packages/pi-agentic-workflow/README.md` + `README.es.md` — chain schema,
  picker behaviour, `/aw-settings` alias (OB-15; becomes AC12).
- `CHANGELOG.md` + `CHANGELOG.es.md` — package table row + version bump
  (same PR, manual-bump rule).
- `docs/fix/README.md` — the `pending` index row for #154 (written with this
  SPEC; flipped to `done · PR #…` only in the final phase).

## Observability

Health signals, all pinned by tests (PE-013): the chain-exhaustion refusal
(`...stopped: <route> tried <candidate₁> (…), <candidate₂> (…)...`), the
`inherit`-policy fallback warning naming every skipped candidate, the bulk
per-command advisory warnings, and the save confirmations. Silent failure
would be a chain silently falling back without naming candidates — the
message-content assertions in `test/unavailable-stop.test.mjs` are the pin.
No metrics/alerts exist for this package.

## Cross-issue notes

- **#201 (operator-approved model routing for spawned review passes)** —
  unrelated surface (review passes, not the settings console). Parallel;
  no dependency. Decision: ship independently (PE-009).
- **#198 / #196 (package layout / producer package)** — may move scripts
  around; they do not touch `packages/pi-agentic-workflow/src`. Parallel.
- **#174 (State Flow lifecycle on workflow commands)** — orthogonal
  lifecycle opt-in; no overlap with this console or the route schema.
- **#200 (check-skill-context fixture)** — separate unit on its own branch;
  this unit's branch was cut from `main` (`f48dff00`) so the two PRs carry
  disjoint commits.
- **F-27 / PR #150** — the introducing feature; follow-up by design
  (issue #154 "Depends on: None. Follow-up to F-27").

## Effort

**M** — five coordinated surfaces in one package (schema, dispatch, picker
primitive + console flows, alias, docs), multiple commits, ≈ 1 day. The issue
itself proposes the same phasing (picker → bulk → chain); an L would mean a
separate feature, and nothing here opens one: E is additive schema, A–D are
console-scoped.

## Decisions made during drafting

- **Chain length capped at 4** — the issue asks whether to cap; 8 was called
  "almost certainly a mistake". 4 entries (primary + 3 fallbacks) keeps the
  merged view readable; the schema rejects longer chains with a message
  naming the limit (OB-6).
- **One thinking level per route, not per chain entry** — the issue's own
  proposal, adopted; keeps `restore-after-settle` logic untouched.
- **Chain reorder = rebuild** — the chain is built in order (append, remove
  last, done); no live reorder keys. Recorded so the implementer does not
  invent keyboard bindings.
- **Bulk warnings are advisory** — the pass warns per command when a chosen
  reference is missing from the live registry, but never blocks the write;
  dispatch's probe (with `onUnavailableRoute`) remains the authoritative
  availability gate. Justification: the registry is only reachable when a
  live session has one, and the fail-closed policy already covers the
  refuse case.
- **`fuzzyFilter` is not imported from Pi** — the issue claimed it is
  exported; verification (PE-004) shows it is internal, so the filter is
  implemented in-package with the same subsequence/slash semantics the AC
  pins.
- **Picker built over pi-tui `SelectList`, not Pi's `ModelSelectorComponent`**
  — the component is exported but needs a `ModelRuntime` that the extension
  context does not expose (PE-004). `@earendil-works/pi-tui` is added as a
  pinned dependency at the version matching the pi peer line.
- **Branch re-cut** — the provisioned worktree branch `fix/154` was cut at
  `a60722f0` (containing fix #200's SPEC commits); this unit re-branched
  from `main` at `f48dff00` so the PR carries exactly one unit's commits
  (AD-004).

## Testing

Red-first per this repo's convention, at three layers. **Domain:**
`test/config-merge.test.mjs` gains chain cases (order preservation,
project-over-global per key, legacy strings unchanged, invalid element paths,
cap rejection). **API:** `test/unavailable-stop.test.mjs` gains the
chain-exhaustion refusals/fallbacks (message content naming candidates and
skip reasons) and the `setModel`-at-most-once assertion; the existing
single-string cases stay untouched. **UI:** `test/settings-console.test.mjs`
gains scripted picker flows (filter, preselection, labels, byte-identical
no-change, field independence, bulk equivalence, non-TUI fallback) and
`test/picker-filter.test.mjs` is a pure unit suite for the filter function;
`test/alias-coverage.test.mjs` pins `/aw-settings`. Integration-over-mocking
is preserved: the scripted-ui harness keeps driving the real console module,
and dispatch tests keep driving the real router.

## Rollback

Per-commit revert of the unit's PR (or `git revert <sha>` on `main`):
- A–D + alias revert with `src/settings/console.ts`, the picker module and
  the seam addition — the seam's superset shape means old call sites keep
  compiling before and after (PE-007, PE-010).
- E reverts as the config-schema + merge + dispatch commits, leaving the
  picker (A–D) intact; string `model` configs load identically before and
  after (PE-006).
- Data cleanup: none — config files are operator-owned JSON; a file written
  by the new console (chain form) still parses on the reverted code only if
  it holds no array; an operator rolling back while using chains must
  flatten `model` back to a string (the revert message will state this).

## Phases

Execution ledger — `execute-phase --fix 154` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:domain:4:model-chain-config-schema`
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:api:4:chain-probe-dispatch`
- P3 — `Phase-lint: PASS (8/8) · fingerprint P3:api:3:aw-settings-alias-command`
- P4 — `Phase-lint: PASS (8/8) · fingerprint P4:ui:5:searchable-windowed-picker-primitive`
- P5 — `Phase-lint: PASS (8/8) · fingerprint P5:ui:6:current-value-field-editing`
- P6 — `Phase-lint: PASS (8/8) · fingerprint P6:ui:4:bulk-apply-and-clear`
- P7 — `Phase-lint: PASS (8/8) · fingerprint P7:docs:3:package-docs-release-bookkeeping`
- P8 — `Phase-lint: PASS (8/8) · fingerprint P8:close-out:7:hardening-and-pr`

### P1 — Model-chain config schema

Layer: `domain`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs`
→ exit 0 with the new chain cases green and the scoped summary line
(`Ran N tests across 1 file`) pasted — the file exists by then (created by
this phase's first task).

- [x] Red-first tests in `test/config-merge.test.mjs`: a chain
      (`"model": ["a/m1", "b/m2"]`) merges project-over-global per key and
      round-trips its order; legacy `"inherit"` and single-string `model`
      files parse unchanged; a non-reference element and a > 4-entry chain
      are rejected with the path `$.commands.<name>.model` (OB-6, OB-11).
- [x] Extend `ModelSetting` / `RouteFile.model` / `Route.model` in
      `src/config/types.ts` to the union
      `"inherit" | ModelRef | readonly ModelRef[]` (OB-6).
- [x] Extend `checkRoute` in `src/config/schema.ts`: an array `model` must be
      non-empty, hold only reference strings, and hold at most 4 entries;
      every violation reports at `$.commands.<name>.model` naming the
      offending element or the limit (OB-6, OB-11).
- [x] Extend `mergeConfigs`/`resolveRoute` in `src/config/merge.ts` so a
      chain is picked as one per-key value (project over global) with its
      order preserved; no other merge behaviour changes (OB-7).

### P2 — Chain-probe dispatch

Layer: `api`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs test/default-inherit.test.mjs`
→ exit 0 with the new chain cases green and the scoped summary line
(`Ran N tests across 2 files`) pasted — both files exist by then (extended by
this phase's first task; `default-inherit.test.mjs` already exists).

- [x] Red-first tests in `test/unavailable-stop.test.mjs`: an exhausted chain
      with `stop` refuses naming every candidate and why it was skipped
      (unknown vs. no auth); with `inherit` it dispatches on the session
      model with the same explanation; a chain whose first entry resolves
      and has auth applies exactly that entry; `setModel` is called at most
      once per routed turn (OB-8, OB-9, OB-10).
- [x] Extend `dispatch.ts` route resolution: when `route.model` is a chain,
      probe entries in order with `ctx.find` + `ctx.hasConfiguredAuth` only
      (no session mutation), collect one skip reason per entry, and apply
      the first usable entry (OB-8, OB-10).
- [x] Route the exhausted-chain outcome through the existing
      `onUnavailableRoute` handling (whose two policies keep their current
      meanings) with the per-candidate message; keep the single-reference
      path byte-identical in behaviour and message shape (OB-9).
- [x] Keep the post-probe `setModel` failure handling exactly as today
      (refuse or inherit-continue), now reachable per chain entry selection,
      with the probe-purity assertion covering it: a failed selection must
      not add a second `setModel` call (OB-9, OB-10).

### P3 — `/aw-settings` alias command

Layer: `api`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/alias-coverage.test.mjs`
→ exit 0 with the alias pin green and the scoped summary line
(`Ran N tests across 1 file`) pasted — the file exists by then (extended by
this phase's first task).

- [x] Red-first test in `test/alias-coverage.test.mjs`: the extension
      registers both `agentic-workflow-settings` and `aw-settings`, and the
      alias handler opens the same console (same `settings` handler invoked)
      with no separate route key (OB-5).
- [x] Export an `SETTINGS_COMMAND_ALIAS = "aw-settings"` constant beside
      `SETTINGS_COMMAND` in `src/routing/types.ts` and register the alias in
      `src/extension/factory.ts` with the same description and handler
      (OB-5).
- [x] Add the alias to `knownCommands` so a route name typo check stays
      exact, and assert the registered-command count in the alias test
      (OB-5).

### P4 — Searchable windowed picker primitive

Layer: `ui`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/picker-filter.test.mjs test/settings-console.test.mjs`
→ exit 0 with the picker cases green and the scoped summary line
(`Ran N tests across 2 files`) pasted — both files exist by then (created by
this phase's tasks 4–5; the phase cannot complete before they exist).

- [x] Add the optional rich picker to the `SettingsUi` seam in
      `src/routing/types.ts` (filterable select with initial selection,
      multi-select, position indicator) as a structural superset — existing
      call sites compile unchanged (OB-1, PE-010).
- [x] Add `@earendil-works/pi-tui` as a pinned dependency in
      `package.json` (exact version matching the pi peer line) and run
      `bun install` so `bun.lock` records it (OB-1, PE-004).
- [x] Implement the picker in the Pi adapter (`src/extension/index.ts` +
      a new `src/settings/picker.ts` component): `ctx.ui.custom()` over
      `SelectList` with in-package subsequence/slash-aware filtering,
      windowed rendering with the `N–M of K` indicator, guarded by the
      session mode — non-TUI modes fall back to `select`/`input`
      (OB-1, OB-12, PE-004).
- [x] Red-first `test/picker-filter.test.mjs`: `flash` matches every
      reference containing flash; `nan/` matches provider `nan` only;
      subsequence tokens match in order; empty query returns all
      (OB-2).
- [x] Red-first scripted cases in `test/settings-console.test.mjs`: the
      model picker consumes the rich seam, filters while typing, and
      accepts the pre-selected current value (OB-1).

### P5 — Current-value field editing

Layer: `ui`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs`
→ exit 0 with the current-value cases green and the scoped summary line
(`Ran N tests across 1 file`) pasted — the file exists since P4.

- [x] Red-first tests: editing an existing route opens the model and
      thinking pickers on the values in force, labelled `(current)` /
      `(default route)`; Enter with no change saves a byte-identical file;
      changing only the thinking asks no model question and changing only
      the model asks no thinking question (OB-3).
- [x] Pass the merged effective values for the target into `editRoute` in
      `src/settings/console.ts` (resolved from the merged view, so
      `(default route)` shows when inheriting) (OB-3).
- [x] Add the field chooser to `editRoute`: the operator marks the fields to
      change (model, thinking) as separate selectable answers; only the
      marked fields are asked; marking none leaves the route untouched
      (OB-3).
- [x] Add the ordered chain builder to the model field: repeated append via
      the picker, remove-last, done — the saved `model` is the chain in
      built order (OB-6, OB-7).
- [x] Keep every rejection message in the loader's path shape
      (`$.commands.<name>.model` / `...thinking`), including for chain
      elements typed by hand (OB-13).
- [x] Extend `renderMergedConfig` in `src/settings/view.ts` so a route with
      a chain renders its references in order (e.g.
      `a/m1 → b/m2 / inherit`), keeping the existing single-reference and
      `inherit` renderings unchanged (OB-14).

### P6 — Bulk apply and bulk clear

Layer: `ui`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs`
→ exit 0 with the bulk cases green and the scoped summary line
(`Ran N tests across 1 file`) pasted — the file exists since P4.

- [x] Red-first tests: one pass assigns model + thinking to ≥ 2 commands and
      the saved file equals what N single-command passes produce; one pass
      clears ≥ 2 overrides; a reference missing from the live registry
      produces a per-command warning and still writes the route
      (OB-4).
- [x] Add the bulk menu entries to `runSettingsConsole` and a multi-select
      command picker over the seam's multi mode (OB-4).
- [x] Implement bulk apply: one field pass (model via P5's builder +
      thinking) applied to every selected command, with the per-command
      advisory warning against the live registry when one is reachable
      (OB-4).
- [x] Implement bulk clear: multi-select over existing overrides, removing
      every selected key in one save (OB-4).

### P7 — Package docs and release bookkeeping

Layer: `docs`. Done-when:
read-verified — chain + alias present in both READMEs; version bumped with
changelog rows.

- [x] Update `packages/pi-agentic-workflow/README.md`: the config schema
      section documents the chain form with an example, the picker behaviour
      (filter, current value, bulk, non-TUI fallback), and the
      `/aw-settings` alias (OB-15).
- [x] Update `packages/pi-agentic-workflow/README.es.md` with the faithful
      Spanish sibling of the same edits — same commit (OB-15, AD-002).
- [x] Bump `version:` in `packages/pi-agentic-workflow/package.json` (minor)
      and add the row to the "Companion npm packages" tables in
      `CHANGELOG.md` + `CHANGELOG.es.md` in the same PR (OB-15).

### P9 — Chain-edit visibility

Added post-P8 by amendment A1 (below) — the unit's replan-in-unit resolution of
review finding F2. Layer: `ui`. Done-when:
`cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs`
→ exit 0 with the chain-edit seed cases green and the scoped summary line
(`Ran N tests across 1 file`) pasted — the file exists since P4.

- [ ] Red-first tests: editing a route whose `model` is a chain (≥2 references)
      opens the chain builder seeded with the value in force; remove-last trims
      the tail; append adds a fallback up to the cap; Done with no change keeps
      the chain (OB-17 / F2).
- [ ] Seed `askModel` in `src/settings/console.ts`: when `current.model` is a
      chain, start the builder from the existing references instead of empty and
      label the current chain so the operator sees what they are editing; fresh
      and single-string editing keep the existing flow (OB-17).
- [ ] Keep the chain capped at `MAX_MODEL_CHAIN` and every rejection in the
      loader's field-path shape `$.commands.<name>.model` (OB-17, OB-13, OB-11).

## Amendments

### A1 — 2026-09-09 · F2 (review-change cycle 1, adversarial 2): chain-edit visibility → P9

User-approved replan-in-unit for review finding **F2** (decision-required).
OB-3/AC3 promise route editing "opens on the value in force (labelled)" — true
for single-string models, but editing a route whose `model` is a chain gave the
picker `initial: undefined` and started the chain builder empty, so the operator
could not see or edit the existing chain and had to rebuild it blind. This
amendment adds phase P9 (seed the chain builder from the current chain) and
acceptance criterion AC14 pinning it. No acceptance criterion or validator is
weakened: AC3's validator is unchanged; AC14 is added alongside it.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
