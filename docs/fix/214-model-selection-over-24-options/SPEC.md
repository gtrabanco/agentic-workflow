# fix/214-model-selection-over-24-options

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> separate planning artifacts: the SPEC and sibling `ACCEPTANCE.md` are the
> source of truth, and its `## Phases` section is the execution ledger.

## Goal

Break the model selection UI into a two-step provider-then-model flow when the
model list exceeds 24 entries, so the console never crashes with
"Settings could not be opened: A select dialog must not offer more than 24
options".  With dozens of providers and models in play, a flat list exceeds Pi's
dialog limit and makes the whole settings console unusable for override/edit
operations.

## Issue

[#214](https://github.com/gtrabanco/agentic-workflow/issues/214) — tracked issue
in the project's forge. The PR closes it via `Closes #214` in the body.

## Branch

`fix/214-model-selection-over-24-options`

## Depends on

None. Independent.

## Root cause

`src/settings/console.ts` line 269 in `pickModelEntry()` calls
`deps.ui.select()` with the full model list:

```ts
answer = await deps.ui.select(prompts.modelPicked(target), [...deps.models, TYPED]);
```

When `deps.models` contains more than 24 references (the common case when a Pi
instance has many providers registered), Pi's select dialog rejects the call and
displays:

```
Settings could not be opened: A select dialog must not offer more than 24 options
```

The same pattern also affects `pickCommandsMulti()` on line 382 and
`pickCommand()` on line 363 when the command list exceeds the limit.

The existing code has a rich-picker path through `deps.ui.pick()` which is
filterable, windowed, and unlimited, but the fall-back `deps.ui.select()` path
is hit whenever the UI does not implement `pick` (or in tests, where `pick` is
mocked but the select path is still tested).

## Detected in

User report: when overriding a model for a routed command, if the live model
registry returns more than 24 `provider/modelId` references, the settings
console crashes immediately on the model selection screen.  Confirmed by reading
`src/settings/console.ts` line 269 — it passes the entire `deps.models` array
directly to `deps.ui.select()`.

## Scope

### In scope

- Detect when the model list exceeds 24 entries (24 is Pi's hard limit plus 1
  for the "Type another reference…" option).
- Split the model selection into two steps:
  1. Present a list of unique providers extracted from the model list (always ≤
     24 because Pi's provider registry is small).
  2. After the provider is chosen, show only models from that provider.
- If the model list is ≤ 24, keep the existing single-step flow.
- Apply the same bounded-list logic to `pickCommand()` and
  `pickCommandsMulti()` so the settings console never crashes on large command
  lists either.
- The "Type another reference…" option stays as the last item in every dialog.

### Out of scope

- Changing the provider-model registry API or fetching logic.
- Adding filtering/searchability to the `select` dialogs (that is the `pick`
  seam's responsibility).
- Any change outside the package's `src/settings/console.ts` and its tests.
- Changing the limit constant — 24 is Pi's enforced hard cap, not configurable.

### Planning evidence

The fix's own authority, without a Product half.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|
| E1 | A flat list of > 24 model references sent to `deps.ui.select()` crashes with "A select dialog must not offer more than 24 options" | reproduction | `src/settings/console.ts:269` — `deps.ui.select(prompts.modelPicked(target), [...deps.models, TYPED])` | HEAD | AC: model selection never crashes when list > 24 | current | verified | code read |
| E2 | The same crash pattern exists for command lists in `pickCommand()` (line 363) and `pickCommandsMulti()` (line 382) | root cause | `src/settings/console.ts` lines 363, 382 | HEAD | AC: command selection dialogs also bounded | current | verified | code read |
| E3 | The rich-picker path (`deps.ui.pick`) is unlimited but the fallback (`deps.ui.select`) is not | regression scope | `src/settings/console.ts:261` — `pick` path uses the same full list | HEAD | fix must not regress the `pick` path | current | verified | code read |
| E4 | Tests mock both `pick` and `select`; they verify the `select` path with small lists | rollback path | `test/settings-console.test.mjs` — scripted UI with `select` and `pick` | HEAD | revert the provider-grouping logic | current | verified | code read |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|
| O1 | Issue AC | Model selection never crashes with > 24 models — splits to provider → model | P1 | extract providers, group models, two-step select | console.ts:pickModelEntry() | test + manual | green suite | planned |
| O2 | Issue AC | Model selection ≤ 24 keeps the existing single-step flow | P1 | guard the provider-split behind the 24-item threshold | console.ts | test | small-list assertion | planned |
| O3 | Issue AC | Command selection also bounded to ≤ 24 entries | P1 | apply the same bounded-list logic to pickCommand and pickCommandsMulti | console.ts | test | green suite | planned |
| O4 | Issue AC | The "Type another reference…" option survives in every dialog | P1 | append TYPED as last item after any grouping | console.ts | test | last-item assertion | planned |
| O5 | Issue AC | No regression: tests still exercise the `pick` and `select` paths | P2 | run full test suite | package | `bun run test` | green suite | planned |

## Acceptance

Objective, verifiable conditions for "done".

- `cd packages/pi-agentic-workflow && bun run test` → all tests pass.
- With > 24 models, the console first shows providers, then model list per
  provider — no "select dialog must not offer more than 24 options" error.
- With ≤ 24 models, the existing single-step flow is preserved.
- The "Type another reference…" option is always the last item.
- `git status --porcelain -- docs/` → empty (no stray docs).

### Spec-lint (mechanical — presence checks only)

- [ ] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'` over the filled sections returns nothing).
- [ ] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [ ] Every `## Acceptance` criterion is a runnable command OR labelled `read-verified`.
- [ ] Every phase passes the 8-box Phase-lint below.
- [ ] `### Planning evidence` has `current` rows for reproduction, root cause,
      regression scope, and rollback path.
- [ ] `### Obligations` has one row per obligation, each with a phase and
      validator; no `deferred` row.

## Phases

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

`Phase-lint: PASS (8/8) · fingerprint P1:domain:5:bounded-model-and-command-selection`

### P1 — Bounded model and command selection

Layer: `domain`. Done-when: `cd packages/pi-agentic-workflow && bun run test`
→ all tests pass.

- [ ] Extract `pickModelEntry()` so when `deps.models` exceeds 24 entries it
      first presents unique provider names (derived from `provider/modelId`),
      then on provider selection shows only that provider's models.  The
      single-step path is preserved when the list is ≤ 24.
- [ ] Append the "Type another reference…" (`TYPED`) option as the last item in
      every generated dialog.
- [ ] Apply the same bounded-list logic to `pickCommand()` and
      `pickCommandsMulti()` so the command selector also never exceeds 24 items.
- [ ] Add a test that passes > 24 models and verifies the two-step provider →
      model flow triggers a provider-first select dialog, then a second select
      with ≤ 24 models.
- [ ] Add a test that verifies the single-step flow when models ≤ 24.

### P2 — Hardening & PR

Layer: hardening · Done-when: `git status --porcelain -- docs/` → empty, and the
project verification gate commands exit 0.

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #214`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #214` and push

## Testing

Unit tests in `test/settings-console.test.mjs`:

- One test with > 24 models that verifies the provider-first select dialog
  appears, the provider is chosen, and then a ≤ 24 model list is presented.
- One test with ≤ 24 models that verifies the existing single-step flow is
  preserved.
- One test with > 24 commands that verifies the command selector is also bounded.
- All pre-existing tests remain green (no regression of the `pick` rich-seam or
  small-list `select` flows).

## Rollback

Revert only the console.ts changes:
`git revert <merge-sha of this PR>` — the model list and command list data come
from Pi's registry and are unchanged by this fix.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the
forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)