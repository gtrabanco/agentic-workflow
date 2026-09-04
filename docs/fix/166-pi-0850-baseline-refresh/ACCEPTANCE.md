# Acceptance manifest v1 — fix-166-pi-0850-baseline-refresh

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The package suite is green with `@earendil-works/pi-coding-agent` 0.85.x as the resolved dev peer — `tsc` type contract (including the compile-time drift guard `ThinkingLevelsMirrorMatchesPi`) plus the full `node --test` suite. | `cd packages/pi-agentic-workflow && bun run test` → exit 0; `cd packages/pi-agentic-workflow && node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → starts with `0.85.` |
| AC2 | The manual smoke ran on pi 0.85.x and its six observations (install, package skills load, friendly command registration with correct names, one routed command set/clear, settings console round-trip, first-run hint) are recorded with per-observation outcomes. | `grep -c "^- SMOKE" docs/fix/166-pi-0850-baseline-refresh/progress.md` → 6 (substance of each row: `manual: the named observation executed on pi 0.85.x with its recorded outcome`) |
| AC3 | The verified-baseline note reads 0.85.0 with the date (2026-09-04) in EN and ES; no stale 0.84.x claim remains in either package README. | `grep -c "0\.84" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → `0` and `0`; `grep -c "0\.85\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 each |
| AC4 | Release bookkeeping complete in the same PR: package `version:` 0.4.1 and the 0.4.1 row present in both changelog tables. | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.4.1`; `grep -c "| 0.4.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each |
| AC5 | The PR description records a verdict (pass / adapted / not applicable) for each of the issue's five in-scope delta-scan items. | `grep -c "^- VERDICT" docs/fix/166-pi-0850-baseline-refresh/pr-body.md` → 5 (the file is the PR body passed to `gh pr create --body-file`) |
| AC6 | The fix-index row for #166 is closed with the PR link after the PR opens. | `grep -cE "\[#166\]\(https://github.com/gtrabanco/agentic-workflow/issues/166\) \| pi-0850-baseline-refresh \| done · \[#" docs/fix/README.md` → 1 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC
  amendment.
- The baseline note is never refreshed to a pi version the package suite does
  not pass (SPEC obligation O12); a red suite on 0.85.x stops the unit before
  P3 and is triaged as its own finding.
- The EN and ES note edits ship in the same change — a diff touching only one
  side of the pair is incomplete and must not be committed.
- Passing declared checks is necessary, not sufficient; final independent
  review and the named manual smoke remain required.
- Validator stability honored: no validator gates on forge state or surfaces
  other workflow actors mutate — AC2/AC5 grep the unit's own committed
  artifacts, AC6 greps `docs/fix/README.md` (the executor's own close-out
  commit), never the PR/issue state itself.

## Commands

- `cd packages/pi-agentic-workflow && bun run test`
- `cd packages/pi-agentic-workflow && node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"`
- `grep -c "^- SMOKE" docs/fix/166-pi-0850-baseline-refresh/progress.md`
- `grep -c "0\.84" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md`
- `grep -c "0\.85\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md`
- `node -p "require('./packages/pi-agentic-workflow/package.json').version"`
- `grep -c "| 0.4.1 |" CHANGELOG.md CHANGELOG.es.md`
- `grep -c "^- VERDICT" docs/fix/166-pi-0850-baseline-refresh/pr-body.md`
- `grep -cE "\[#166\]\(https://github.com/gtrabanco/agentic-workflow/issues/166\) \| pi-0850-baseline-refresh \| done · \[#" docs/fix/README.md`
