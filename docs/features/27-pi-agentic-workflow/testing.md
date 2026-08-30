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

## Correction to the P3 matrix (end review, 2026-08-29)

The matrix below claimed to pin AC8's ordering. It did not: two mutants the end
review ran against the shipped build survived it — deleting the own-switch
discriminator, and restoring thinking *before* the model. Both were invisible for
the same reason: `test/helpers/session.mjs` replayed Pi's `model_select` faithfully
but omitted that `setModel` **re-derives and applies the thinking level**
(`core/agent-session.js`), so the suite could not see the level move at all. The
matrix is accurate for the 16 rules it exercised and silent on that one; the fold
added the missing case and re-ran both mutants (see `review-findings.md`).

## Mutation evidence — reproducible (run `npm run mutation`)

The numbers are produced by `packages/pi-agentic-workflow/scripts/mutation-check.mjs`, which
patches each mutant in a copy of the package under a temp dir, builds it, runs the named suite
there, and exits non-zero if any mutant survives. Earlier tallies were prose and two were
wrong; the list is a script now, not a paragraph.

| Rule broken | Killed by |
|---|---|
| `AC12 busy guard` | test |
| `AC12 invalid-config refusal` | test |
| `AC12 in-flight refusal — src/routing/dispatch.ts(184,41): error TS18048: 'pending' is possibly 'undefined'.` | compiler |
| `AC9 unavailable route stops` | test |
| `Pi expands the template` | test |
| `AC3 dispatch the name Pi expands (F3)` | test |
| `AC8 record the clamped level (N-3)` | test |
| `AC8 restore the level a model switch moved (F1) — src/routing/dispatch.ts(100,9): error TS6133: 'touched' is declared but its value is never read.` | compiler |
| `AC7 own switch is not an operator move — src/routing/dispatch.ts(13,1): error TS6133: 'modelRefKey' is declared but its value is never read.` | compiler |
| `N-4 undo restores the session — src/routing/dispatch.ts(160,32): error TS1434: Unexpected keyword or identifier.` | compiler |
| `F7 unreadable is not absent — src/config/load.ts(56,7): error TS6133: 'NOT_THERE' is declared but its value is never read.` | compiler |
| `AC13 untrusted project never read — src/config/load.ts(92,45): error TS6133: 'projectTrusted' is declared but its value is never read.` | compiler |
| `F8 a command needs an explicit true` | test |
| `N-1 the adapter wires model_select` | test |
| `N-1 the adapter settles` | test |
| `N-1 the adapter wires thinking_level_select` | test |
| `N-1 trust comes from Pi` | test |
| `N-1 the project file comes from Pi's cwd` | test |
| `N-2 the latch is releasable from the console` | test |
| `F4 an explicit stop is saved` | test |
| `F4 an explicit inherit is saved` | test |
| `F12 a duplicate name is reported, never registered` | test |
| `F13 the scanner stops at the closing ---` | test |
| `F14 the summary follows the effective policy` | test |
| `F15 only a cleaned draft reaches the disk` | test |

`25 mutants · 19 killed · 0 survived · 6 compile-enforced · 0 stale` — 19 rules are pinned by a failing test; the 6 compiler entries do not build at all
(the unused-symbol rules reject them), so the build is the enforcement. 127 tests pass.
