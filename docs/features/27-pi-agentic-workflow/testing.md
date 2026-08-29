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
  untrusted-trust-off variants). Most assertions drive the loader through an
  injected in-memory reader; two cases run against real temp directories so the
  shipped filesystem read and the on-disk path layout are covered too. The
  loader takes the directories as inputs, so nothing here can touch the
  developer's real `~/.pi/`.
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
| 2026-08-29 | base | `git rebase main` + roadmap conflict resolution (user-approved renumber 28/29) | linear on `829ad18`; `git hash-object ACCEPTANCE.md` = `22d3f33…` unchanged |
| 2026-08-29 | base | `git diff main --name-only` (AC16 scope) | only `docs/features/ROADMAP.md`, `docs/features/27-pi-agentic-workflow/`, `packages/pi-agentic-workflow/` |
| 2026-08-29 | base | `node --test test/skill-parity.test.mjs` after rebase | exit 0 — 7/7, bundle still byte-identical to the new base's skill tree |
| 2026-08-29 | P2 | the three P2 suites before `src/config/*` existed (`dist/config/` moved aside) | red — all three exit 1 on the missing modules, as the red-first rule requires |
| 2026-08-29 | P2 | `node --test test/config-merge.test.mjs test/default-inherit.test.mjs test/untrusted-project-config.test.mjs` | exit 0 — 23 pass / 0 fail (AC5, AC6, AC13 validators) |
| 2026-08-29 | P2 | thinking-level drift guard probe (stale 6-level mirror vs Pi) | `error TS2322: Type 'true' is not assignable to type 'false'` — the guard fails the build when Pi's levels change |
| 2026-08-29 | P2 | `npm test` (compile + full suite) | exit 0 — 30 pass / 0 fail |
