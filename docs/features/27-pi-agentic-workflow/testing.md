# testing — 27-pi-agentic-workflow

## Layers

- **Package unit/integration tests** (`node --test`, `test/*.test.mjs` after
  `tsc`) — the primary layer. Exercises the extension's
  public surface (registered commands, config engine, routing lifecycle) with
  test doubles standing in for the Pi `ctx` at the boundary — the same contract
  style as `packages/agentic-workflow-schema`; no heavy mocking beyond it.
  `tsconfig.test.json` is not shipped: this package has no TypeScript test
  fixtures (fixtures are generated JS/JSON in temp dirs), so a second `tsc`
  pass would re-check `src/` twice (see `decisions.md` D-E2 note).
- **Build/packaging checks** — `npm pack --dry-run` artifact listing; manifest
  assertions (AC1). Packaging correctness is part of green, not an afterthought.
- **Regression** — `cd packages/agentic-workflow-schema && npm test` stays green
  (AD-007: the schema surface is untouched by this feature).
- Red-first rule: validator-shaped suites (`skill-parity`, `config-merge`,
  `untrusted-project-config`, `dispatch-refusals`) are written before the
  behavior they gate and fail red until it lands.

## Commands

- `cd packages/pi-agentic-workflow && npm test` — compile strict TS, run the
  full suite. Exit 0 required (AC14).
- `cd packages/pi-agentic-workflow && node --test test/<suite>.test.mjs` —
  per-AC suites named in `ACCEPTANCE.md`.
- `cd packages/pi-agentic-workflow && npm pack --dry-run` — artifact listing.
- `cd packages/agentic-workflow-schema && npm test` — regression gate.

## Fixtures

- Skill-tree fixtures: a trimmed toy `skills/`-shaped tree (public + internal +
  `metadata.internal: true` variants) so parity/coverage/exclusion assertions
  don't depend on the repo's live skill set — the real tree is asserted too.
- Config fixtures: global/project JSON pairs (override, merge, malformed,
  untrusted-trust-off variants) written to temp dirs, never the developer's
  real `~/.pi/` — the loaders take the directory paths as inputs.
- Lifecycle fixtures: scripted `ctx` doubles (busy flag, in-flight flag,
  `setModel` success/failure, `agent_settled` callback, `isProjectTrusted`)
  driving the idle → routing → dispatched → settled → restored machine.

read-verified: AC7 (snapshot/apply/restore ordering + user-change guard) and
AC10 (settings console walkthrough) are judged on the suite + registered
command, not fabricated into green.

## Run log

| Date | Phase | Command | Result |
|---|---|---|---|
| 2026-08-29 | P1 | `node --test test/skill-parity.test.mjs` before bundling existed | red — 5 real-tree suites failed on the missing bundle (fixtures green), as the red-first rule requires |
| 2026-08-29 | P1 | `node scripts/bundle-skills.mjs` | `bundled 34 skills (105 files) · excluded: bump-skill` |
| 2026-08-29 | P1 | `node --test test/skill-parity.test.mjs` | exit 0 — 7 pass / 0 fail (AC2 validator) |
| 2026-08-29 | P1 | AC1 manifest check (`node -e …name/keyword/pi manifest`) | exit 0 |
| 2026-08-29 | P1 | `tsc && npm pack --dry-run` | 109 files: `dist/extension/index.js`, 105 `skills/**`, `package.json`, `LICENSE` |
| 2026-08-29 | P1 | `npm test` (compile + full suite) | exit 0 |
