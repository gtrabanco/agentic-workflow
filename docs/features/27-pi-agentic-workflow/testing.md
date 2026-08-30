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

## Mutation evidence (P3)

The P3 suites were written after the implementation, so "green on first run"
proves nothing on its own. Each rule the phase owns was broken in the source, one
at a time, and the named validator had to fail. 16 mutants, 16 killed; the source
was restored from a pristine copy between runs.

| Mutant (source rule broken) | Suite that had to fail | Result |
|---|---|---|
| busy guard removed | `dispatch-refusals` | killed |
| in-flight refusal removed | `dispatch-refusals` | killed |
| invalid-config refusal removed | `dispatch-refusals` | killed |
| project-trust gate bypassed in the loader | `untrusted-project-config` | killed |
| shipped `onUnavailableRoute` flipped to `inherit` | `unavailable-stop` | killed |
| `stop` policy treated as `inherit` at dispatch | `unavailable-stop` | killed |
| credential check removed | `unavailable-stop` | killed |
| skill expansion switched off | `argument-forwarding` | killed |
| argument whitespace normalised | `argument-forwarding` | killed |
| `settle()` never restores | `restore-after-settle` | killed |
| operator model change ignored | `restore-after-settle` | killed |
| snapshot taken after applying the route | `restore-after-settle` | killed |
| hint never shown | `first-run-hint` | killed |
| hint latch never set in memory | `first-run-hint` | killed |
| unknown-route report removed | `alias-coverage` | killed |
| internal skills given commands | `alias-coverage` | killed |

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
| 2026-08-29 | P3 | thinking-level drift guard against the real `ExtensionAPI` type | compiles (mirrors equal); shrinking the mirror locally fails with TS2322 |
| 2026-08-29 | P3 | 16-mutant mutation matrix (see above) | 16 killed / 0 survived |
| 2026-08-29 | P3 | `node --test test/alias-coverage.test.mjs … test/first-run-hint.test.mjs` (six AC validators, P3 done-when) | exit 0 — 37 pass / 0 fail |
| 2026-08-29 | P3 | `node --test test/default-inherit.test.mjs` with the AC6 dispatch leg added | exit 0 — 10 pass / 0 fail |
| 2026-08-29 | P3 | compiled entry imported and driven through a Pi-shaped API double (`PI_CODING_AGENT_DIR` pointed at a temp dir) | registered 18 aliases + `agentic-workflow-settings`, subscribed `agent_settled`/`model_select`/`thinking_level_select`, dispatched `/skill:plan-feature --next` |
| 2026-08-29 | P3 | `npm test` (compile + full suite) | exit 0 — 74 pass / 0 fail |
| 2026-08-29 | P3 | AC1 manifest re-check + `npm pack --dry-run` | exit 0; 129 files |
| 2026-08-29 | P4 | `node --test test/settings-console.test.mjs` (P4 done-when) | exit 0 — 18 pass / 0 fail |
| 2026-08-29 | P4 | console run through the **real** entry (`dist/extension/index.js`) with a Pi-shaped `ctx.ui`, temp `PI_CODING_AGENT_DIR` | wrote `<agentDir>/pi-agentic-workflow.json`; `loadConfig` read the saved route back |
| 2026-08-29 | P4 | 4-mutant mutation matrix (see above) | 4 killed / 0 survived |
| 2026-08-29 | P4 | `npm test` (compile + full suite) | exit 0 — 93 pass / 0 fail |
| 2026-08-29 | P4 | `node --test test/skill-parity.test.mjs` (AC1 manifest) + `npm pack --dry-run` | exit 0; `dist/settings/*.js` included |
| 2026-08-29 | P5 | AC15 gate: `grep -c "pi install"` in each README, `grep -c "Versión en español"` in `README.md`, `grep -c "English version"` in `README.es.md` | 2 / 2 / 1 / 1 — all ≥1 |
| 2026-08-29 | P5 | README command table ↔ live catalogue, section count and JSON example across both languages (`test/alias-coverage.test.mjs`) | exit 0 — 9 pass / 0 fail |
| 2026-08-29 | P5 | `npm test` (compile + full suite) | exit 0 — 94 pass / 0 fail |
| 2026-08-29 | P6 | `cd packages/pi-agentic-workflow && npm test` (AC14) | exit 0 — 94 pass / 0 fail |
| 2026-08-29 | P6 | `cd packages/agentic-workflow-schema && npm test` (AD-007 regression) | exit 0 — 554 pass / 0 fail |
| 2026-08-29 | P6 | AC1 manifest validator run verbatim from `ACCEPTANCE.md` | exit 0 |
| 2026-08-29 | P6 | `git diff main --name-only` outside the AC16 allow-list | empty |
| 2026-08-29 | P6 | `git diff main --name-only -- packages/agentic-workflow-schema \| wc -l` | 0 |
| 2026-08-29 | P6 | `npm pack` + `tar -tzf` vs `find skills -type f` | 137 entries; 105/105 skill files present; extension entry, both READMEs, `package.json`, `LICENSE` included |
| 2026-08-29 | P6 | **real Pi integration**: `pi install ./` then `pi list` with the compiled entry and `pi` manifest | installed and resolved to the package path; `pi -e ./dist/extension/index.js --offline --list-models` started with no extension-load error; global settings restored with `pi uninstall ./` afterwards |
| 2026-08-29 | P6 | live command-execution smoke (`pi -p "/help"`) | **not run** — the provider session hit its usage limit; recorded in `known-issues.md` as the one uncovered integration surface |
| 2026-08-29 | end review | `review-change` on `bfd465c9` (inline axis fallback; `subagent` launches broken in this build) | REVIEW-FAIL — 10 fix-now rows persisted in `review-findings.md` |
| 2026-08-29 | fold | 12 new tests written red before the repairs (F1/F2 lifecycle sequence, F3 wire key, F4 explicit-value saves, F7 unreadable file, F8 undeclared `user-invocable`) | each failed against the pre-fix build, then passed |
| 2026-08-29 | fold | 7 mutants re-run: own-switch discriminator, thinking-before-model, F1 value-gated restore, F3 directory key, F4 policy elision, F4 inherit-only elision, F7 unreadable-as-absent, F8 missing-key default, F9 ignored computed count | 9 killed / 0 survived |
| 2026-08-29 | fold | `cd packages/pi-agentic-workflow && npm test` | exit 0 — 106 pass / 0 fail |
