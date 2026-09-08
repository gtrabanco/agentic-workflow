# Acceptance manifest v1 — fix-154-settings-picker-search-bulk-chain

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | With a ≥100-model fixture registry the model picker stays windowed (cursor never leaves the screen, position indicator `N–M of K` shown) and filters while typing; the whole-registry wall and the hand-typing fall-through are gone for listed models | `cd packages/pi-agentic-workflow && bun run test test/picker-filter.test.mjs test/settings-console.test.mjs` → exit 0 with the picker-window and filter cases green; `manual: open /agentic-workflow-settings in a pi session with ≥100 models — the window fits the terminal and shows the position indicator` |
| AC2 | Filter semantics are token/subsequence and slash-aware: `flash` narrows to every model whose reference contains flash; `nan/` narrows to provider `nan` only | `cd packages/pi-agentic-workflow && bun run test test/picker-filter.test.mjs` → exit 0 with both pinned cases |
| AC3 | Editing an existing route opens with its current model and thinking level selected and labelled (`(current)` / `(default route)`); pressing Enter without changing anything leaves the saved file byte-identical | `cd packages/pi-agentic-workflow && bun run test test/settings-console.test.mjs` → exit 0 with the byte-identical no-change case green |
| AC4 | Changing only the effort asks no model question, and changing only the model asks no effort question | `cd packages/pi-agentic-workflow && bun run test test/settings-console.test.mjs` → exit 0 with the field-independence cases green |
| AC5 | One pass assigns model + effort to ≥ 2 commands and one pass clears ≥ 2 overrides; the resulting config file equals what N single-command passes produced before | `cd packages/pi-agentic-workflow && bun run test test/settings-console.test.mjs` → exit 0 with the bulk-equivalence fixtures green |
| AC6 | `/aw-settings` opens the same console as `/agentic-workflow-settings` and edits the same file; an alias-coverage test pins it | `cd packages/pi-agentic-workflow && bun run test test/alias-coverage.test.mjs` → exit 0 with the alias pin green |
| AC7 | A route accepts an ordered list of models (`model`: `"inherit"`, `"provider/modelId"`, or an array of 1–4 reference strings); dispatch applies the first entry that resolves AND has configured auth; the saved config round-trips the order | `cd packages/pi-agentic-workflow && bun run test test/config-merge.test.mjs test/unavailable-stop.test.mjs` → exit 0 with the chain cases green |
| AC8 | When every chain entry is unusable, `onUnavailableRoute: stop` refuses the command and `inherit` runs the session model; either message names the candidates tried and why each was skipped (unknown vs. no auth) | `cd packages/pi-agentic-workflow && bun run test test/unavailable-stop.test.mjs` → exit 0 with the message-content assertions green |
| AC9 | Existing single-string `model` / `"inherit"` configs load unchanged; an invalid chain element still reports `$.commands.<name>.model` | `cd packages/pi-agentic-workflow && bun run test test/config-merge.test.mjs` → exit 0 with the legacy-string and invalid-element cases green |
| AC10 | Chain resolution never changes session state while probing — `setModel` is called at most once per routed turn | `cd packages/pi-agentic-workflow && bun run test test/unavailable-stop.test.mjs` → exit 0 with the setModel-call-count assertion green |
| AC11 | The merged view (`renderMergedConfig`) shows a route's chain in order | `cd packages/pi-agentic-workflow && bun run test test/settings-console.test.mjs` → exit 0 with the chain-render case green |
| AC12 | Non-TUI modes (headless/RPC) keep a working text-input path — the picker falls back to `select`/`input` and the console never dead-ends | `cd packages/pi-agentic-workflow && bun run test test/settings-console.test.mjs` → exit 0 with the non-TUI fallback fixture green |
| AC13 | The package gate is green on the final tree (tsc + full suite), and the README pair documents the chain schema, the picker behaviour and the alias in the same commit, with the version bump + bilingual changelog tables in the same PR | `cd packages/pi-agentic-workflow && bun run test` → exit 0, `0 fail`; read-verified: chain + `aw-settings` present in both `README.md` and `README.es.md`; `git status --porcelain docs/` → empty after the docs commit |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- Existing test assertions are immutable: this unit adds tests, never edits an
  expectation to match new behaviour. The honest-routing invariant (probe never
  mutates session state; `setModel` at most once per routed turn) and the
  rejection-path shape (`$.commands.<name>.model`) are non-negotiable.

## Commands

- `cd packages/pi-agentic-workflow && bun run test`
- `cd packages/pi-agentic-workflow && bun run test test/config-merge.test.mjs test/unavailable-stop.test.mjs`
- `cd packages/pi-agentic-workflow && bun run test test/settings-console.test.mjs test/picker-filter.test.mjs test/alias-coverage.test.mjs`
