# fix/214-model-selection-over-24-options

> Fix specification for issue #214 — the settings console crashes with
> "A select dialog must not offer more than 24 options" when the live model
> registry or command list is long. Every dialog the console and its adapter
> drive is bounded, models go provider-first in two steps over the cap, and
> overlong lists page instead of crashing.

## Goal

Repair the settings console so it never crashes with Pi-web's
"A select dialog must not offer more than 24 options" when the live model
registry (or the routed-command list) is long: every dialog the console or its
adapter drives is bounded, model selection switches to the issue's
provider-first two-step flow over the cap, and overlong lists page instead of
crashing. A flat list crash makes the whole console unusable for override,
default-route, and bulk operations, so this cannot wait for a feature cycle.

## Issue

[#214](https://github.com/gtrabanco/agentic-workflow/issues/214) — tracked
issue in the project's forge. The PR closes it via `Closes #214` in the body.

## Branch

`fix/214-model-selection-over-24-options`

## Depends on

None. Independent — the rich picker seam it extends already merged (#154 /
PR #203, merged 2026-09-09) and is part of this branch's base.

## Root cause

Three unbounded `select` surfaces forward full operator-facing lists into a
dialog host that enforces a 24-option cap (pi-web:
`EXTENSION_DIALOG_OPTION_LIMIT = 24`, exact error "A select dialog must not
offer more than 24 options"):

1. **Adapter, live pi-web path** — `richUi().pick`'s non-TUI fallback forwards
   the full option list to `base.select`
   (`packages/pi-agentic-workflow/src/extension/index.ts:60-65`). With the
   package's own adapter the console always takes the rich path (the adapter
   always defines `pick`), so in pi-web a > 24 model registry crashes
   `pickModelEntry` and a > 24 command list crashes the bulk multi-pick —
   through this line, not through the console's own fallback.
2. **Console, pick-less UIs** — `pickModelEntry`'s select fallback passes
   `[...deps.models, TYPED]` unbounded
   (`packages/pi-agentic-workflow/src/settings/console.ts:269`) for any UI
   without the rich seam.
3. **Console, command pickers** — `pickCommand` always uses `ui.select` with
   the full sorted list in every mode
   (`packages/pi-agentic-workflow/src/settings/console.ts:371`), and
   `pickCommandsMulti`'s non-rich rounds select an unbounded `remaining` list
   (`packages/pi-agentic-workflow/src/settings/console.ts:391`).

The defect is a coverage gap of #154/#203: that fix shipped the rich seam
(filterable, windowed, unlimited in TUI) and its non-TUI fallback, but bounded
neither the fallback's dialog size nor the console's select-only paths.

## Detected in

User report 2026-09-12 (issue #214): opening `/agentic-workflow-settings` in
pi-web with more than 24 `provider/modelId` references in the live registry
crashes the model selection screen for override, default-route, and bulk
operations. Verified against this branch's source at `e0c18284` (all three
surfaces above) and against the installed runtime
(`@jmfederico/pi-web@1.202609.0`, cap constant + throw site).

## Scope

### In scope

- `src/settings/picker.ts`: add `SELECT_OPTION_LIMIT = 24` (the documented
  dialog cap), the two pager labels (`◀ Previous page`, `More options…`), and
  a `pagedSelect(select, title, options, { trailing })` helper — one dialog
  when the list fits, otherwise 21-item pages with pager entries and the
  trailing option last, so no dialog ever exceeds 24 options.
- `src/settings/console.ts` `pickModelEntry`: when the model list exceeds
  `SELECT_OPTION_LIMIT - 1` (TYPED occupies one slot), switch to the issue's
  provider-first two-step flow — unique providers (prefix before the first
  `/`, `localeCompare`-sorted) in a first bounded dialog — itself paged when
  the provider list exceeds the cap (O15) — then that provider's
  models in a second bounded dialog, "Type another reference…" last in every
  dialog and still answered by the existing `input` flow. Lists ≤ 23 keep
  today's single-step flow byte-identical (rich pick with preselection when
  the seam exists, plain select otherwise).
- `src/settings/console.ts` `pickCommand` and `pickCommandsMulti`: route any
  option list over `SELECT_OPTION_LIMIT` through `pagedSelect` (commands carry
  no TYPED trailing; sorted order and the ≤ 24 single-dialog behavior are
  unchanged).
- `src/extension/index.ts`: page the non-TUI `pick` fallback through
  `pagedSelect` when the list exceeds the cap (TUI `ctx.ui.custom` path and
  `multiple: true` return semantics unchanged).
- Red-first tests: new `test/paged-select.test.mjs`, new cases in
  `test/settings-console.test.mjs` and `test/shipped-adapter.test.mjs`.
- Release bookkeeping: package `version:` 0.9.1 → 0.9.2, CHANGELOG row pair,
  README sentence pair (all in the same PR per CLAUDE.md).

### Out of scope

- The rich picker seam itself (`filterReferences`, `createPickerComponent`,
  `PICKER_MAX_VISIBLE`, TUI `ctx.ui.custom` wiring) — already filterable,
  windowed, unlimited; untouched for ≤ cap lists.
- Adding filter/search to `select` dialogs — that is the pick seam's job.
- The adapter's non-TUI `pick(multiple: true)` single-return limitation (one
  selection per call outside TUI) — pre-existing, not a crash; routed to its
  own fix entry (see Cross-issue notes), never inlined here.
- Model registry / dispatch / `model` chain schema changes; the fix only
  changes how existing lists are presented.
- The 24 constant as a configurable — it is the host's enforced cap
  (`SELECT_OPTION_LIMIT` remains the single knob in code).

### Planning evidence

The fix's own authority, without a Product half: reproduction, root cause with
code evidence, regression scope, rollback path, and the affected invariant or
use case — one compact row each. Never an exploration transcript.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction — a pi-web extension select dialog offering more than 24 options is rejected with "A select dialog must not offer more than 24 options"; the cap is `EXTENSION_DIALOG_OPTION_LIMIT = 24` | document | `@jmfederico/pi-web@1.202609.0 dist/shared/apiTypes.js:37` (constant) + `dist/server/sessions/pendingExtensionDialogStore.js:136-139` (throw), installed runtime read 2026-09-13 | 1.202609.0 | AC2, AC6, AC8 · O1, O5, O7 | current | proven | code read this plan |
| PE-002 | Root cause (live path) — the adapter's rich-pick non-TUI fallback forwards the full option list to `base.select`, so in pi-web a > 24 model registry or command list crashes the console | repository | `packages/pi-agentic-workflow/src/extension/index.ts:60-65` | e0c18284 | AC2, AC8 · O1, O7 | current | proven | code read |
| PE-003 | Root cause (pick-less path) — `pickModelEntry`'s select fallback passes `[...deps.models, TYPED]` unbounded to any UI without the rich seam | repository | `packages/pi-agentic-workflow/src/settings/console.ts:269` (seam guard at :261, TYPED at :84) | e0c18284 | AC2, AC4, AC5 · O1, O3, O4 | current | proven | code read |
| PE-004 | Root cause (command surfaces) — `pickCommand` always selects the full sorted list in every mode, and `pickCommandsMulti`'s non-rich rounds select an unbounded `remaining` list | repository | `packages/pi-agentic-workflow/src/settings/console.ts:366-372` (select at :371) and :375-398 (rounds select at :391) | e0c18284 | AC7 · O6 | current | proven | code read |
| PE-005 | Regression scope — the TUI rich path (`pick` → `ctx.ui.custom` SelectList, windowed/unlimited) and every ≤ cap flow must stay byte-identical; only over-cap flows change | repository | `packages/pi-agentic-workflow/src/settings/console.ts:261-268`; `src/settings/picker.ts:67-107` (`createPickerComponent`); `src/extension/index.ts:66-90` | e0c18284 | AC1, AC4 · O3, O14 | current | proven | code read |
| PE-006 | Rollback path — one `git revert` of the fix PR restores the prior dialog behavior; config files, schema, and registry data are untouched, so cleanup is none | derived | rule "single-PR revert of a package-only change" (inputs PE-002 + PE-003 + PE-004; CLAUDE.md §Packages keeps data formats stable) | — | O14 | not-applicable | decision | — |
| PE-007 | Invariant — the console's `prompts` table strings are the test-facing contract: tests key answers by exact prompt title, so the two-step flow must add its prompt, never rename existing ones | repository | `packages/pi-agentic-workflow/src/settings/console.ts:45-47` (comment) + :48-80 (table, `} as const;` at :80); `test/settings-console.test.mjs:26-60` (scriptedUi) | e0c18284 | AC2-AC5 · O1-O4 | current | proven | code read |
| PE-008 | Invariant — a non-rich UI must never dead-end (OB-12): the select fallbacks exist so the console completes without the pick seam; bounding must keep every flow completable | document | `docs/fix/154-settings-picker-search-bulk-chain/SPEC.md` (OB-12); `packages/pi-agentic-workflow/src/extension/index.ts:49-51` (adapter comment) | e0c18284 | AC2, AC7 · O1, O6 | current | proven | code read |
| PE-009 | Issue authority — the issue prescribes: provider-first two-step when the model list exceeds the cap, single-step preserved below it, "Type another reference…" last in every dialog, command selectors bounded too, no regression | forge | https://github.com/gtrabanco/agentic-workflow/issues/214 (body read 2026-09-13) | issue state 2026-09-13 | AC2-AC7, AC13 · O1-O9 | current | proven | issue body |
| PE-010 | Release rule — a touched package bumps `version:` and adds a row to the CHANGELOG companion-packages tables in the same PR | document | `CLAUDE.md` §"Packages" ("Version bumps are manual and same-PR") | e0c18284 | AC9, AC10 · O10, O11 | current | proven | doc read |
| PE-011 | Bilingual rule — human docs (README/CHANGELOG) carry EN + ES siblings updated in the same change; SPECs, commits, PRs stay English-only | ledger | `docs/workflow/REPOSITORY_STATE.md` AD-002 + F011; `CLAUDE.md` §"Working rules" | e0c18284 | AC10, AC11 · O11, O12 | current | proven | ledger row |
| PE-012 | Required failure state — no dialog the console or adapter drives may ever offer more than 24 options: `scriptedUi` records every `select`/`pick` option array, so any over-cap option list in a test fails its assertions | derived | rule "option-array capture proves the bound" (inputs PE-001 + PE-003 + PE-004); `test/settings-console.test.mjs:31-60` | e0c18284 | AC2-AC8 · O1-O7 | current | proven | code read |
| PE-013 | Validator capability — `scriptedUi` also supports a pick-less UI (`rich: false`) that drives the select fallback and records every `select` option array, so O1's "every UI mode" claim is provable only by an over-cap pick-less case: without one, a two-step implemented only in the rich branch passes every frozen validator while `console.ts:269` stays unbounded (review-plan finding PL-2) | repository | `packages/pi-agentic-workflow/test/settings-console.test.mjs:26-60` (scriptedUi harness) and :266-286 (`rich: false` fallback test); `packages/pi-agentic-workflow/src/settings/console.ts:268-270` (the unbounded fallback branch) | e0c18284 | AC2 · O1 | current | proven | code read |
| PE-014 | Required failure state — the provider dialog itself must page when the unique provider list exceeds the cap: Pi imposes no provider ceiling (the issue's "providers are always ≤ 24" is an assumption, not an invariant), so Decision 2's provider-list paging needs a frozen over-cap provider case; without one, an implementation asking the provider with plain `pick`/`select` passes AC2-AC6 while a > 24-provider registry crashes the first dialog (review-plan finding PL-3) | derived | SPEC `## Decisions made during drafting` 2 (provider-count gap, paging closer); issue #214 body ("siempre ≤ 24 porque el registro de providers de Pi es pequeño" — assumption); planning-findings.md PL-3 | e0c18284 (source) / 2fbcedf0 (finding) | AC2, AC6 · O1, O15 | current | proven | review finding + issue body read this repair |

### Obligations

One row per normative behaviour, applicable invariant, affected use case, and
required failure state. Status is `planned | in-progress | verified | n/a |
deferred`; `n/a` requires evidence, and no current-unit obligation may be
`deferred` to a follow-up issue.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC2; PE-001, PE-002, PE-003, PE-009, PE-013, PE-014 | > 23 model lists select provider-first in two bounded steps in every UI mode | P2 | 4 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "provider-first"` → 3 pass (rich fixture + pick-less `rich: false` fixture + over-cap provider-list fixture) | test output in progress.md | planned |
| O2 | AC3; PE-001, PE-012 | a single provider registering > 23 models still never exceeds the cap (paged model step) | P2 | 4 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "pages within one provider"` → pass | test output in progress.md | planned |
| O3 | AC4; PE-005 | ≤ 23 model lists keep the single-step dialog byte-identical (rich pick with preselection / plain select) | P2 | 4 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "single-step preserved"` → pass | test output in progress.md | planned |
| O4 | AC5; PE-007, PE-009 | "Type another reference…" is the last option of every model dialog | P2 | 4 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "Type another reference"` → pass | test output in progress.md | planned |
| O5 | AC6; PE-001, PE-012 | `pagedSelect` never builds a dialog over `SELECT_OPTION_LIMIT` (21 data + pager entries + trailing ≤ 24) | P1 | 3 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/paged-select.test.mjs` → all pass | test output in progress.md | planned |
| O6 | AC7; PE-004, PE-008 | command selection (single and multi rounds) never offers > 24 options | P3 | 2 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "bounded command"` → 2 pass | test output in progress.md | planned |
| O7 | AC8; PE-002 | the adapter's non-TUI pick fallback pages option lists > 24 before calling `base.select` | P4 | 2 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/shipped-adapter.test.mjs -t "pages long option lists"` → pass | test output in progress.md | planned |
| O8 | AC13; PE-009 | live pi-web: a > 24-model registry opens the two-step flow without the cap error | P5 | 1 | human operator (row recorded by execute-phase) | manual: `- SMOKE … outcome: pass` row in progress.md | progress.md row | planned |
| O9 | AC13; PE-009 | live pi-web: a ≤ 24 registry keeps the single-step dialog; the TYPED path and command flows complete | P5 | 2 | human operator (row recorded by execute-phase) | manual: `- SMOKE … outcome: pass` row in progress.md | progress.md row | planned |
| O10 | AC9; PE-010 | package version bumped 0.9.1 → 0.9.2 | P6 | 1 | execute-phase | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.9.2` | command output | planned |
| O11 | AC10; PE-010, PE-011 | CHANGELOG companion-package rows updated as a bilingual pair in the same commit | P6 | 2 | execute-phase | read-verified: `grep -c "0.9.2" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each | grep output | planned |
| O12 | AC11; PE-011 | package README pair documents the bounded large-list behavior | P6 | 3 | execute-phase | read-verified: console paragraph in both README siblings names the bounding | read evidence | planned |
| O13 | AC12; PE-009 | fix index carries the unit row and is flipped to `done · [PR]` at close-out | P7 | 6 | execute-phase | read-verified: from repo root, `grep -cE "model-selection-over-24-options.*done · \[#"` → 1 (plain presence is green from plan time — review-plan finding PL-4; only the `done · [PR]` flip proves the outcome) | grep output | planned |
| O14 | AC1; PE-005, PE-006 | no regression: the full package suite (all pre-existing flows) stays green at close-out | P7 | 1 | execute-phase | `cd packages/pi-agentic-workflow && bun run test` → exit 0 | pasted commands + exit codes | planned |
| O15 | AC2; PE-012, PE-014 | the provider dialog itself pages when the unique provider list exceeds the cap (Decision 2's provider-list paging) | P2 | 4 | execute-phase | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "over 30 providers"` → pass | test output in progress.md | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` / `manual` — never
unlabelled prose. IDs are frozen in `ACCEPTANCE.md`.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified` / `manual`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001),
      the root cause (PE-002/PE-003/PE-004), the regression scope (PE-005),
      and the rollback path (PE-006) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Rules that must never be violated

- The `prompts` table strings are the test-facing contract: add the two-step
  prompt, never rename an existing one (PE-007).
- The rich pick seam stays an optional structural superset; a UI without it
  must still complete every flow — bounding may never dead-end a fallback
  (OB-12, PE-008).
- Value-in-force preselection stays on every rich pick dialog that has a
  current value (#154 OB-3, PE-005).
- Model references remain `provider/modelId`; the fix never loosens
  `parseModelReference` validation (`console.ts:288-297`).
- English-only committed artifacts; bilingual EN + ES human docs updated in the
  same change (AD-002, F011, CLAUDE.md §Working rules).
- Package version bump + CHANGELOG pair in the same PR; dependency versions
  stay pinned exact — this fix adds none (CLAUDE.md §Packages, PE-010).
- One PR per unit of work against `main`; never commit to `main`; the plan
  stage never pushes (CLAUDE.md; plan-fix hard rules).
- Tests are immutable once written; the executor fixes code until green
  (`verification-contract`).
- Config schema, `model-routing.yml`, envelope contracts, and `skills/` stay
  untouched — package `src/` + `test/` + release bookkeeping only.

## Impact

- **Layers** (per the repo's package layout): `domain` — the settings console
  flow and its picker helpers (`src/settings/picker.ts`,
  `src/settings/console.ts`); `ui` — the extension's UI adapter wiring
  (`src/extension/index.ts`).
- **Modules and files**: `src/settings/picker.ts`, `src/settings/console.ts`,
  `src/extension/index.ts`; tests `test/paged-select.test.mjs` (new),
  `test/settings-console.test.mjs`, `test/shipped-adapter.test.mjs`;
  `package.json` (version), `CHANGELOG.md` + `CHANGELOG.es.md`,
  `README.md` + `README.es.md` (package), `docs/fix/README.md`.
- **Blast radius**: only dialog construction inside the settings console and
  its adapter. Routing, dispatch, config load/merge/save, the chain builder,
  and the rich picker component are untouched; every ≤ cap flow is
  byte-identical (PE-005). No persisted format changes.
- **Detection lead time**: the crash is immediate and total on affected
  environments (the console refuses the model screen), so a regression is
  caught by the AC suite at PR time and on first use in pi-web; no slow-burn
  failure mode exists.

## Operational risks

None — no scheduled jobs, queues, caches, schema, or external adapters
interact with dialog construction; the console still edits one config file at
a time behind the same parse gates (`console.ts:216` invalid-file save
refusal, `:427` invalid-draft save refusal — both unchanged). The only
operational surface is the interactive dialog flow itself.

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate limits; the dialogs render
registry/config content to the local operator only and never send anything.

## Compliance touchpoints

n/a — no domain/compliance rules apply to dialog sizing.

## Affected docs

Each becomes an acceptance criterion:

- `CHANGELOG.md` + `CHANGELOG.es.md` — 0.9.2 companion-package rows (AC10).
- `packages/pi-agentic-workflow/README.md` + `README.es.md` — one sentence on
  the bounded large-list behavior in the console paragraph (AC11).
- `docs/fix/README.md` — the #214 unit row, flipped to `done · [PR]` at
  close-out (AC12).
- No other `docs/` prose changes; this unit's folder carries the SPEC set.

## Observability

The package has no metrics/log surface for dialogs, so health is proven by the
AC suite (AC1-AC8) plus the two manual pi-web SMOKE rows (AC13). The only new
silent-failure mode — a dialog paging when it could have fit — is bounded by
the at-limit unit tests (AC6). No new telemetry is added.

## Cross-issue notes

- **#154 / PR #203** (merged 2026-09-09): prerequisite, already in this
  branch's base — this fix extends its seam; its ≤ cap behavior is frozen
  regression scope (PE-005). It absorbed nothing of #214 (the cap gap
  postdates it).
- **#201** (operator-approved model routing for spawned review passes):
  parallel — different surface (passes config/routing), no file or flow
  overlap.
- **PR #212** (deterministic phase-lint script): parallel — skills/scripts
  only, no package overlap.
- **NEW problem discovered, routed out**: in non-TUI mode the adapter's
  `pick(multiple: true)` fallback returns at most one selection
  (`src/extension/index.ts:63`), so a bulk apply picks one command per call
  outside TUI — pre-existing, not a crash, not absorbed here; record it as its
  own fix entry (no issue is auto-created from a plan).
- Forge sweep 2026-09-13: no other open issue or PR touches
  `packages/pi-agentic-workflow/src/settings/**` or the extension adapter.

## Effort

M — five code phases across three source files plus red-first suites, a manual
smoke phase, and release bookkeeping; multi-commit (red-first per phase);
bounded well under a day.

## Decisions made during drafting

1. **Single-step ceiling is 23 models, not the issue's "≤ 24"**: TYPED
   occupies one dialog slot, so 24 models + TYPED = 25 would still crash. The
   safe boundary is `models.length > SELECT_OPTION_LIMIT - 1` → two-step.
2. **Pagination backs the two-step**: the issue assumes "providers ≤ 24 and
   small", but neither a provider's model count nor the provider count is
   capped by Pi; per-provider paging and provider-list paging close both gaps.
3. **Bounding applies in every UI mode when a dialog would exceed the cap**:
   the console cannot detect a host's cap, and one uniform behavior keeps
   tests and UX predictable (native TUI select has no cap today — uniformity
   chosen over mode-specific divergence).
4. **TUI model lists > 23 move from the flat searchable picker to the
   two-step flow** (the issue's prescribed UX); ≤ 23 keeps the flat picker
   with preselection.
5. **Commands page rather than group** (no provider/model structure), and
   `pickCommand` stays `select`-based — adopting the pick seam would churn
   #154's tested command flows for no cap benefit.
6. **Provider = the prefix before the first `/`** of a registry reference
   (registry refs are `parseModelReference`-valid); providers sort with
   `localeCompare`, models within a provider keep registry order.
7. **Preselection rides the rich seam's `initial`** in every fitting dialog
   (provider prefix of the value in force, then the value); paged dialogs are
   select-based (`ui.select` has no preselection) — acceptable on the over-cap
   edge.
8. **The adapter's non-TUI `multiple: true` single-return semantics stay
   unchanged** (pre-existing limitation — routed to its own entry, see
   Cross-issue notes).
9. **No new dependency**: the helper lives in the package's own
   `src/settings/picker.ts`; `SELECT_OPTION_LIMIT` is the single knob if a
   future host enforces a different cap.
10. **The pick-less over-cap case is its own P2 task** (repair of review-plan
    finding PL-2): O1's "every UI mode" claim needs a frozen case driving
    `rich: false` through the select fallback, kept separate from the
    rich-fixture case list so the shared-path implementation cannot hide
    behind the rich branch (PE-013).
11. **The over-cap provider list is its own frozen case** (repair of
    review-plan finding PL-3): Decision 2's provider-list paging needs a
    scenario that forces the provider dialog over the cap; a dedicated case
    (30 providers × 1 model each) keeps every frozen two-step test
    single-dimension — the main fixture's provider dialog fits (30 models
    across 4 providers), so provider paging is asserted only where it is the
    point (PE-014).

## Testing

Unit level (scripted-UI integration over the console flow), red-first, names
frozen — validators key on these exact strings:

- `test/settings-console.test.mjs` (new cases):
  - "settings console model picker: provider-first two-step over 30 models" — 30 models across 4 providers (the provider dialog itself fits the cap; the two-step split is the exercise) (O1)
  - "settings console model picker: provider-first two-step over 30 models in a pick-less UI" — drives `rich: false` (the OB-12 harness mode) so the two-step runs through the select fallback (`console.ts:269`), asserting every dialog ≤ 24 options and "Type another reference…" last (O1, PE-013)
  - "settings console model picker: provider-first two-step over 30 providers" — 30 providers × 1 model each, so the provider dialog itself exceeds the cap and pages (`More options…` reaches the page-2 providers; choosing one completes the model step); every dialog ≤ 24 options (O15, PE-014)
  - "settings console model picker: pages within one provider over 30 models"
  - "settings console model picker: single-step preserved at 23 models"
  - "settings console model picker: Type another reference is the last option in every model dialog"
  - "settings console model picker: bounded command selection over 30 commands"
  - "settings console model picker: bounded command multi-select rounds over 30 commands"
- `test/paged-select.test.mjs` (new): fit/pagination arithmetic, trailing-last
  on every page, PREV/NEXT navigation, `undefined` passthrough, at-limit
  boundary (24 options / 23 + trailing).
- `test/shipped-adapter.test.mjs` (new case): "the adapter non-TUI pick
  fallback pages long option lists before base.select".
- All pre-existing tests stay green (rich seam, small-list select flows, chain
  builder, bulk flows) — AC1.
- Manual: the two pi-web SMOKE rows (P5).

## Phases

Execution ledger — `execute-phase --fix 214` runs **all remaining phases by
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
record the result here per phase.

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:domain:3:bounded-paged-select-helper`
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:domain:4:provider-first-two-step-model-selection`
- P3 — `Phase-lint: PASS (8/8) · fingerprint P3:domain:2:bounded-command-selection`
- P4 — `Phase-lint: PASS (8/8) · fingerprint P4:ui:2:adapter-non-tui-pick-paging`
- P5 — `Phase-lint: PASS (8/8) · fingerprint P5:hardening:2:pi-web-manual-smoke`
- P6 — `Phase-lint: PASS (8/8) · fingerprint P6:docs:3:release-bookkeeping-0.9.2`
- P7 — `Phase-lint: PASS (8/8) · fingerprint P7:close-out:7:hardening-and-pr`

### P1 — Bounded paged-select helper

Layer: `domain`. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ exit 0 (all suites green).

- [x] Red-first `test/paged-select.test.mjs`: cover single-dialog fit (≤ 24
      with/without trailing), the 21-per-page arithmetic with
      `◀ Previous page` / `More options…` entries (≤ 24 per dialog with
      trailing), trailing-last on every page, PREV/NEXT navigation,
      `undefined` passthrough, and the at-limit boundary (24 options / 23 +
      trailing) — run to red (O5, PE-001, PE-012).
- [x] Add `SELECT_OPTION_LIMIT = 24`, `PAGED_SELECT_PREV`, and
      `PAGED_SELECT_NEXT` exports to `src/settings/picker.ts` (PE-001).
- [x] Implement `pagedSelect(select, title, options, { trailing })` in
      `src/settings/picker.ts` per the frozen arithmetic: when the list fits,
      one `select` call; otherwise 21-item pages with PREV/NEXT appended
      before the trailing option (O5).

### P2 — Provider-first two-step model selection

Layer: `domain`. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ exit 0.

- [x] Red-first console tests in `test/settings-console.test.mjs` (names
      frozen in `## Testing`): the four model-picker cases — two-step over 30
      models, paging within one provider, single-step preserved at 23 (select
      and rich pick with preselection), TYPED-last on every dialog
      (O1-O4, PE-003, PE-007, PE-009).
- [x] Red-first pick-less over-cap case in `test/settings-console.test.mjs`:
      "provider-first two-step over 30 models in a pick-less UI" — the console
      runs with `rich: false` so the two-step executes through the select
      fallback (`console.ts:269`), every dialog ≤ 24 options, TYPED last
      (O1, PE-003, PE-013).
- [x] Red-first over-cap provider-list case in `test/settings-console.test.mjs`:
      "provider-first two-step over 30 providers" — a registry of 30 providers
      × 1 model each makes the provider dialog itself exceed the cap, so the
      first dialog pages (`More options…` reaches the page-2 providers) and
      every dialog stays ≤ 24 options (O15, PE-014).
- [x] Implement in `pickModelEntry` (`src/settings/console.ts`): when
      `deps.models.length > SELECT_OPTION_LIMIT - 1`, extract unique providers
      (prefix before the first `/`, `localeCompare`-sorted), ask the provider
      via `pick`/`pagedSelect` with `[...providers, TYPED]` (TYPED → direct
      `input`), then ask the model within the chosen provider with
      `[...providerModels, TYPED]` (TYPED → `input`); add
      `prompts.modelProvider(target)`; keep the ≤ 23 single-step branch
      byte-identical (O1-O4, O15).

### P3 — Bounded command selection

Layer: `domain`. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ exit 0.

- [x] Red-first console tests: "bounded command selection over 30 commands"
      (paged single select with navigation to page 2) and "bounded command
      multi-select rounds over 30 commands" (two picks across bounded rounds
      via the bulk-apply flow) (O6, PE-004).
- [x] Route `pickCommand` and each `pickCommandsMulti` non-rich round through
      `pagedSelect` when the option list exceeds `SELECT_OPTION_LIMIT` (sorted
      order unchanged; ≤ 24 lists keep today's single `select` call
      byte-identical) (O6).

### P4 — Adapter non-TUI pick paging

Layer: `ui`. Done-when: `cd packages/pi-agentic-workflow && bun run test` →
exit 0.

- [x] Red-first adapter test in `test/shipped-adapter.test.mjs` — "the adapter
      non-TUI pick fallback pages long option lists before base.select": mode
      ≠ `tui`, 30 options → every `base.select` call receives ≤ 24 options,
      NEXT navigates, the picked value is returned (O7, PE-002).
- [x] In `richUi().pick`'s non-TUI branch (`src/extension/index.ts`), page
      through `pagedSelect` when `[...options].length > SELECT_OPTION_LIMIT`;
      leave the ≤ 24 branch and the `multiple: true` return semantics
      unchanged (O7).

### P5 — pi-web manual smoke

Layer: `hardening` (manual tasks — phase-contract rule 7's sanctioned home,
marked `manual`). Done-when:
`grep -c "SMOKE .* outcome: pass" docs/fix/214-model-selection-over-24-options/progress.md`
→ `2`.

- [x] manual: In pi-web on a registry whose model list exceeds the cap (the
      report's environment), open `/agentic-workflow-settings` → Set a command
      override: the provider dialog appears (no cap error), choose a provider,
      the model dialog completes and saves; record a
      `- SMOKE … outcome: pass|fail` row in progress.md (O8, PE-009).
- [x] manual: In pi-web on a ≤ 24 registry, verify the single-step dialog is
      unchanged, "Type another reference…" still completes an entry, and a
      bulk apply over the command list stays bounded; record the second
      `- SMOKE` row (O9).

### P6 — Release bookkeeping 0.9.2

Layer: `docs`. Done-when:
`node -p "require('./packages/pi-agentic-workflow/package.json').version"` →
`0.9.2`.

- [x] Bump `version:` 0.9.1 → 0.9.2 in
      `packages/pi-agentic-workflow/package.json` (O10, PE-010).
- [x] Add the 0.9.2 row to the companion-packages tables in `CHANGELOG.md`
      and `CHANGELOG.es.md` (bilingual pair, same commit) (O11, PE-010,
      PE-011).
- [x] Add one sentence to the console paragraph in the package `README.md` and
      `README.es.md` pair: lists longer than 24 options never reach a single
      dialog — models group provider-first and overlong lists page
      (O12, PE-011).

### P7 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #214`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #214` and push

## Rollback

Revert the fix PR (`gh pr revert <pr>` or `git revert <merge-sha>` on `main`)
— one step restores the prior dialog behavior. Data cleanup: none — config
files, schema, and registry data are untouched by the fix (PE-006). If 0.9.2
is already published, ship the revert as 0.9.3 (publish CI skips same-version
pushes).

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the
forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
