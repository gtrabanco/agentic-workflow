# Acceptance manifest v1 — fix-214-model-selection-over-24-options

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The package suite (tsc + bun test across all files, including the new suites) is green | `cd packages/pi-agentic-workflow && bun run test` → exit 0 |
| AC2 | With > 23 models the console selects provider-first: the first dialog offers providers (+ "Type another reference…"), the second only the chosen provider's models; every dialog ≤ 24 options | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "provider-first"` → pass |
| AC3 | A single provider with > 23 models pages its model dialog (21/page, `More options…`, TYPED last) instead of crashing | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "pages within one provider"` → pass |
| AC4 | With ≤ 23 models the single-step flow is byte-identical (rich pick with preselection when the seam exists, plain select otherwise) | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "single-step preserved"` → pass |
| AC5 | "Type another reference…" is the last option of every model dialog (provider dialog, every page, model dialog) | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "Type another reference"` → pass |
| AC6 | `pagedSelect` never builds a dialog over 24 options: 21 data + pager entries + trailing arithmetic, PREV/NEXT navigation, `undefined` passthrough, at-limit boundary | `cd packages/pi-agentic-workflow && bun test test/paged-select.test.mjs` → all pass |
| AC7 | Command selection never offers > 24 options: `pickCommand` pages over-24 lists; `pickCommandsMulti` non-rich rounds are bounded | `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "bounded command"` → 2 pass |
| AC8 | The adapter's non-TUI pick fallback pages > 24 option lists before `base.select`; ≤ 24 lists are unchanged | `cd packages/pi-agentic-workflow && bun test test/shipped-adapter.test.mjs -t "pages long option lists"` → pass |
| AC9 | Package version bumped for the release | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.9.2` |
| AC10 | Release rows present in the bilingual changelog pair | read-verified: from repo root, `grep -c "0.9.2" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each (companion-packages table row) |
| AC11 | Package README pair documents the bounded large-list behavior | read-verified: the console paragraph in `packages/pi-agentic-workflow/README.md` and `README.es.md` names the > 24-option bounding (provider-first / paging) |
| AC12 | Fix index carries the #214 unit row | read-verified: from repo root, `grep -c "model-selection-over-24-options" docs/fix/README.md` → 1 (flipped to `done · [PR]` at close-out) |
| AC13 | Live behavior verified in pi-web on both registry sizes | manual: two `- SMOKE … outcome: pass` rows recorded in `docs/fix/214-model-selection-over-24-options/progress.md` (P5) |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/pi-agentic-workflow && bun run test`
- `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "provider-first"`
- `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "pages within one provider"`
- `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "single-step preserved"`
- `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "Type another reference"`
- `cd packages/pi-agentic-workflow && bun test test/paged-select.test.mjs`
- `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs -t "bounded command"`
- `cd packages/pi-agentic-workflow && bun test test/shipped-adapter.test.mjs -t "pages long option lists"`
- `node -p "require('./packages/pi-agentic-workflow/package.json').version"`
- `grep -c "0.9.2" CHANGELOG.md CHANGELOG.es.md` (repo root)
- `grep -c "model-selection-over-24-options" docs/fix/README.md` (repo root)
