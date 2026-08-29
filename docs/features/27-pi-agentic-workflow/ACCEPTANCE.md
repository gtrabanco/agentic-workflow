# Acceptance manifest v1 — 27-pi-agentic-workflow

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | `package.json` has name `@gtrabanco/pi-agentic-workflow`, keyword `pi-package`, `publishConfig.access` `public`, and a `pi` manifest listing the extension and skills | `node -e "const p=require('./packages/pi-agentic-workflow/package.json'); if(p.name!=='@gtrabanco/pi-agentic-workflow') process.exit(1); if(!p.keywords.includes('pi-package')) process.exit(1); if(!p.pi.extensions||!p.pi.skills) process.exit(1)"` → exit 0 |
| AC2 | Every bundled skill file is byte-identical to `skills/<name>/`; every `user-invocable: true` skill included; internal composed skills included; `metadata.internal: true` excluded | `cd packages/pi-agentic-workflow && node --test test/skill-parity.test.mjs` → exit 0 |
| AC3 | Extension registers one slash command per bundled `user-invocable: true` skill using the skill's `name`, plus `agentic-workflow-settings` | `cd packages/pi-agentic-workflow && node --test test/alias-coverage.test.mjs` → exit 0 |
| AC4 | `/plan-feature 27-pi-agentic-workflow` dispatches the `plan-feature` skill with argument `27-pi-agentic-workflow` (no dropped or reordered tokens) | `cd packages/pi-agentic-workflow && node --test test/argument-forwarding.test.mjs` → exit 0 |
| AC5 | With both config files present, project `commands.design-feature` overrides global `commands.design-feature`; unspecified keys keep global/default values | `cd packages/pi-agentic-workflow && node --test test/config-merge.test.mjs` → exit 0 |
| AC6 | With no config files, effective default route is `{ "model": "inherit" }` and dispatch happens without calling `setModel`; empty override list resolves to `inherit`, not an error | `cd packages/pi-agentic-workflow && node --test test/default-inherit.test.mjs` → exit 0 |
| AC7 | Non-inherit route snapshots model + thinking level, calls `setModel`/`setThinkingLevel` before dispatch, restores both after `agent_settled` unless the user changed the model during that turn | read-verified: lifecycle walkthrough in `test/restore-after-settle.test.mjs` covers snapshot/apply/restore ordering and the user-change guard |
| AC8 | After a routed command settles, session model id and thinking level equal the pre-dispatch snapshot | `cd packages/pi-agentic-workflow && node --test test/restore-after-settle.test.mjs` → exit 0 |
| AC9 | A configured `provider/modelId` that is missing or unauthenticated does not dispatch when `onUnavailableRoute` is `stop` (default); message names the command, the route, and `/agentic-workflow-settings` | `cd packages/pi-agentic-workflow && node --test test/unavailable-stop.test.mjs` → exit 0 |
| AC10 | `/agentic-workflow-settings` displays merged config, sets default route, sets/clears a per-command override, sets `onUnavailableRoute`, saves to global or project scope; project save refused when untrusted | read-verified: console walkthrough over the registered command (P4), with save/merge behavior covered by `test/config-merge.test.mjs` + `test/untrusted-project-config.test.mjs` |
| AC11 | First workflow-command dispatch shows the configuration hint exactly once; acknowledgement persisted in global package state across sessions | `cd packages/pi-agentic-workflow && node --test test/first-run-hint.test.mjs` → exit 0 |
| AC12 | Dispatch refused (no skill expansion) when the agent is busy, a routed invocation is in flight, or a present config file fails schema/parse validation | `cd packages/pi-agentic-workflow && node --test test/dispatch-refusals.test.mjs` → exit 0 |
| AC13 | When project trust is false, the project file is ignored even if it exists | `cd packages/pi-agentic-workflow && node --test test/untrusted-project-config.test.mjs` → exit 0 |
| AC14 | Full package test suite passes | `cd packages/pi-agentic-workflow && npm test` → exit 0 |
| AC15 | `README.md` + `README.es.md` synchronized with reciprocal language-switcher links, documenting install, alias list source (public skills), config paths, default inherit, fail-closed unavailable routes | `grep -c "pi install" packages/pi-agentic-workflow/README.md` → ≥1; `grep -c "pi install" packages/pi-agentic-workflow/README.es.md` → ≥1; `grep -c "Versión en español" packages/pi-agentic-workflow/README.md` → ≥1; `grep -c "English version" packages/pi-agentic-workflow/README.es.md` → ≥1 |
| AC16 | No Pi core source, shell CLI, schema-package change, skill-prose fork, or `settings.json` plugin key introduced | read-verified: `git diff main --stat` shows changes only under `packages/pi-agentic-workflow/` + `docs/features/27-pi-agentic-workflow/` + `docs/features/ROADMAP.md`; schema package diff empty |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/pi-agentic-workflow && npm test`
- `cd packages/pi-agentic-workflow && npm pack --dry-run`
- `cd packages/agentic-workflow-schema && npm test` (regression — surface must stay untouched)
