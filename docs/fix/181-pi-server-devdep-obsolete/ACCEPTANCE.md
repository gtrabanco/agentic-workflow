# Acceptance manifest v1 — fix-181-pi-server-devdep-obsolete

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The package suite is green with `@earendil-works/pi-coding-agent` resolved to exactly 0.85.1 and `@earendil-works/pi-server` fully pruned from the lockfile and `node_modules` — `tsc` type contract (including the compile-time drift guard `ThinkingLevelsMirrorMatchesPi`) plus the full `node --test` suite including `test/shipped-adapter.test.mjs`. | `cd packages/pi-agentic-workflow && bun run test` → exit 0; `cd packages/pi-agentic-workflow && node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → `0.85.1`; `grep -c "pi-server" packages/pi-agentic-workflow/bun.lock` → `0`; `test ! -d packages/pi-agentic-workflow/node_modules/@earendil-works/pi-server` → exit 0 |
| AC2 | The manifest on disk carries the tightened peer range and no `pi-server` devDependency. | `node -p "require('./packages/pi-agentic-workflow/package.json').peerDependencies['@earendil-works/pi-coding-agent']"` → `>=0.85.1`; `node -e "process.exit(require('./packages/pi-agentic-workflow/package.json').devDependencies['@earendil-works/pi-server'] === undefined ? 0 : 1)"` → exit 0 |
| AC3 | The verified-baseline note reads 0.85.1 with the date (2026-09-05) in EN and ES; no stale 0.85.0 claim remains in either package README. | `grep -c "0\.85\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → `0` and `0`; `grep -c "0\.85\.1" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 each |
| AC4 | Release bookkeeping complete in the same PR: package `version:` 0.7.1 and the 0.7.1 row present in both changelog tables. | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.7.1`; `grep -c "| 0.7.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each |
| AC5 | The fix-index row for #181 is closed with the PR link after the PR opens, in the index's backticked done-row convention. | ``grep -cE "\[#181\]\(https://github.com/gtrabanco/agentic-workflow/issues/181\) \| pi-server-devdep-obsolete \| \`?done\`? · \[#" docs/fix/README.md`` → 1 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC
  amendment.
- The baseline note is never refreshed to a pi version the package suite does
  not pass (SPEC obligation O8, PE-011); a red suite on 0.85.1 without the
  shim stops the unit before P2 and is triaged as its own finding — the shim
  is never silently re-added.
- The EN and ES edits ship in the same change — a diff touching only one side
  of a bilingual pair (baseline note, changelog rows) is incomplete and must
  not be committed.
- `bun.lock` is the sole lockfile; no `package-lock.json` may appear.
- Passing declared checks is necessary, not sufficient; final independent
  review and the project gate remain required.
- Validator stability honored: no validator gates on forge state or surfaces
  other workflow actors mutate — AC1–AC4 grep the unit's own in-repo files
  and command outputs, AC5 greps `docs/fix/README.md` (the executor's own
  close-out commit), never the PR/issue state itself.

## Commands

- `cd packages/pi-agentic-workflow && bun run test`
- `cd packages/pi-agentic-workflow && node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"`
- `grep -c "pi-server" packages/pi-agentic-workflow/bun.lock`
- `test ! -d packages/pi-agentic-workflow/node_modules/@earendil-works/pi-server`
- `node -p "require('./packages/pi-agentic-workflow/package.json').peerDependencies['@earendil-works/pi-coding-agent']"`
- `node -e "process.exit(require('./packages/pi-agentic-workflow/package.json').devDependencies['@earendil-works/pi-server'] === undefined ? 0 : 1)"`
- `grep -c "0\.85\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md`
- `grep -c "0\.85\.1" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md`
- `node -p "require('./packages/pi-agentic-workflow/package.json').version"`
- `grep -c "| 0.7.1 |" CHANGELOG.md CHANGELOG.es.md`
- ``grep -cE "\[#181\]\(https://github.com/gtrabanco/agentic-workflow/issues/181\) \| pi-server-devdep-obsolete \| \`?done\`? · \[#" docs/fix/README.md``
