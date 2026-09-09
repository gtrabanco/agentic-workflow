# Acceptance manifest v1 — fix-154-settings-picker-search-bulk-chain

Status: frozen

**Scoped validator shape (AC1–AC12).** Scoped validators use the direct form
`cd packages/pi-agentic-workflow && bun test test/<file>…` — it scopes to the
named files **only when they exist**: bun exits 0 on an unmatched path printing
just a note and no summary line, and `bun run test <args>` appends args after
the whole script (`tsc && bun test test/*.test.mjs`), so it never scopes. The
missing-file case is covered two ways: file-creating tasks precede the phase
whose validator names the file (P1 task 1 extends `config-merge.test.mjs`; P2
task 1 extends `unavailable-stop.test.mjs`; P4 tasks 4–5 create
`picker-filter.test.mjs` and extend `settings-console.test.mjs`; every other
named file exists before its phase), and passing evidence for a scoped
validator is the pasted summary line `Ran N tests across K file(s)` — an absent
file cannot produce it. The full gate (AC13) stays `bun run test` (tsc + whole
suite).

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | With a ≥100-model fixture registry the model picker stays windowed (cursor never leaves the screen, position indicator `N–M of K` shown) and filters while typing; the whole-registry wall and the hand-typing fall-through are gone for listed models | `cd packages/pi-agentic-workflow && bun test test/picker-filter.test.mjs test/settings-console.test.mjs` → exit 0 with the picker-window and filter cases green + scoped summary (`Ran N tests across 2 files`) pasted; `manual: open /agentic-workflow-settings in a pi session with ≥100 models — the window fits the terminal and shows the position indicator` |
| AC2 | Filter semantics are token/subsequence and slash-aware: `flash` narrows to every model whose reference contains flash; `nan/` narrows to provider `nan` only | `cd packages/pi-agentic-workflow && bun test test/picker-filter.test.mjs` → exit 0 with both pinned cases + scoped summary (`Ran N tests across 1 file`) pasted |
| AC3 | Editing an existing route opens with its current model and thinking level selected and labelled (`(current)` / `(default route)`); pressing Enter without changing anything leaves the saved file byte-identical | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 with the byte-identical no-change case green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC4 | Changing only the effort asks no model question, and changing only the model asks no effort question | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 with the field-independence cases green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC5 | One pass assigns model + effort to ≥ 2 commands and one pass clears ≥ 2 overrides; the resulting config file equals what N single-command passes produced before | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 with the bulk-equivalence fixtures green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC6 | `/aw-settings` opens the same console as `/agentic-workflow-settings` and edits the same file; an alias-coverage test pins it | `cd packages/pi-agentic-workflow && bun test test/alias-coverage.test.mjs` → exit 0 with the alias pin green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC7 | A route accepts an ordered list of models (`model`: `"inherit"`, `"provider/modelId"`, or an array of 1–4 reference strings); dispatch applies the first entry that resolves AND has configured auth; the saved config round-trips the order | `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs test/unavailable-stop.test.mjs` → exit 0 with the chain cases green + scoped summary (`Ran N tests across 2 files`) pasted |
| AC8 | When every chain entry is unusable, `onUnavailableRoute: stop` refuses the command and `inherit` runs the session model; either message names the candidates tried and why each was skipped (unknown vs. no auth) | `cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs` → exit 0 with the message-content assertions green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC9 | Existing single-string `model` / `"inherit"` configs load unchanged; an invalid chain element still reports `$.commands.<name>.model` | `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs` → exit 0 with the legacy-string and invalid-element cases green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC10 | Chain resolution never changes session state while probing — `setModel` is called at most once per routed turn | `cd packages/pi-agentic-workflow && bun test test/unavailable-stop.test.mjs` → exit 0 with the setModel-call-count assertion green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC11 | The merged view (`renderMergedConfig`) shows a route's chain in order | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 with the chain-render case green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC12 | Non-TUI modes (headless/RPC) keep a working text-input path — the picker falls back to `select`/`input` and the console never dead-ends | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 with the non-TUI fallback fixture green + scoped summary (`Ran N tests across 1 file`) pasted |
| AC13 | The package gate is green on the final tree (tsc + full suite), and the README pair documents the chain schema, the picker behaviour and the alias in the same commit, with the version bump + bilingual changelog tables in the same PR | `cd packages/pi-agentic-workflow && bun run test` → exit 0, `0 fail`; read-verified: chain + `aw-settings` present in both `README.md` and `README.es.md`; `git status --porcelain docs/` → empty after the docs commit |
| AC14 | Editing a route whose `model` is a chain (≥2 references) opens the chain builder seeded with the value in force — the current references are shown and editable (append, remove-last, Done) — and Done with no change keeps the chain | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` → exit 0 with the chain-edit seed cases green + scoped summary (`Ran N tests across 1 file`) pasted |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- Existing test assertions are immutable: this unit adds tests, never edits an
  expectation to match new behaviour. The honest-routing invariant (probe never
  mutates session state; `setModel` at most once per routed turn) and the
  rejection-path shape (`$.commands.<name>.model`) are non-negotiable.

## Commands

- `cd packages/pi-agentic-workflow && bun run test` — full gate (tsc + whole suite)
- `cd packages/pi-agentic-workflow && bun test test/config-merge.test.mjs test/unavailable-stop.test.mjs` — scoped (AC7 evidence)
- `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs test/picker-filter.test.mjs test/alias-coverage.test.mjs` — scoped (AC1/AC2/AC3–AC6/AC11/AC12 evidence)
