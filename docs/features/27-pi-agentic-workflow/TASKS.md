# TASKS — 27-pi-agentic-workflow

Per-phase checklists. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — Package skeleton with byte-identical skill bundling

Layer: config/infra · Done-when: `cd packages/pi-agentic-workflow && node --test test/skill-parity.test.mjs` →
exit 0, and `git status` shows only this feature's paths.

- [x] Create branch `feat/27-pi-agentic-workflow` from `main`
- [x] `package.json`: name `@gtrabanco/pi-agentic-workflow`, keyword `pi-package`, `publishConfig.access: public`, peerDependency `@earendil-works/pi-coding-agent`, `pi` manifest listing `./dist/extension/index.js` + `./skills` (AC1)
- [x] Bundle script copies `skills/<name>/` minus `metadata.internal: true` skills into `packages/pi-agentic-workflow/skills/` (AC2)
- [x] `test/skill-parity.test.mjs` written FIRST (red before bundling completes): byte-identical files, all `user-invocable: true` included, internal composed skills included, `metadata.internal: true` excluded (AC2)
- [x] Extension entry `src/extension/index.ts` present and referenced by the manifest (no behavior yet)
- [x] `npm pack --dry-run` lists extension, skills, manifests (AC1)
- [x] Commit this feature's planning artifacts (SPEC + artifact set) and confirm roadmap row 27 reads `planned` (the `defined → planned` flip written during scaffold)

## P2 — Routing config engine

Layer: domain · Done-when: `cd packages/pi-agentic-workflow && node --test test/config-merge.test.mjs test/default-inherit.test.mjs test/untrusted-project-config.test.mjs` → exit 0.

- [x] Config types + strict schema: `default` route, `commands` map, `onUnavailableRoute: "stop"|"inherit"`; route = `model: "inherit"|"provider/modelId"`, `thinking: level|"inherit"` — `src/config/types.ts`, `src/config/schema.ts`, `src/config/defaults.ts`. `ModelRef` is a `${string}/${string}` template type so a slashless reference fails at compile time as well as at validation.
- [x] `test/config-merge.test.mjs` written FIRST (red before merge logic — verified by running the suite with `dist/config/` absent: exit 1): project `commands.design-feature` overrides global, unspecified keys keep global/default (AC5). 9 tests.
- [x] Global loader `~/.pi/agent/pi-agentic-workflow.json`; missing file → in-package default `inherit` — `src/config/load.ts` (`configFilePaths(agentDir, cwd)`; the caller supplies Pi's `getAgentDir()`, so a relocated profile keeps working). Asserted both through an injected reader and against a real temp directory.
- [x] Project loader `.pi/pi-agentic-workflow.json` gated on `ctx.isProjectTrusted()`; `test/untrusted-project-config.test.mjs`: file ignored when trust is false (AC13). 6 tests, one of which asserts the project path is **never read** while trust is off. P3 feeds the gate from `ctx.isProjectTrusted()` on every dispatch.
- [x] `test/default-inherit.test.mjs`: no config files → `{ "model": "inherit" }`; empty override list resolves to `inherit`, not an error (AC6). 8 tests. *Reconciled:* the task's "dispatch without `setModel`" leg needs the dispatcher, which is a P3 deliverable — P3 adds it to **this same AC6 validator** (`test/dispatch-refusals.test.mjs` covers the refusal side). No assertion was dropped, only sequenced; `ACCEPTANCE.md` is unchanged.
- [x] Strict validation: present-but-invalid JSON/schema → error object, never silently `inherit` (AC12 loader leg, D-E5) — `parseConfigFile` returns `{ok:false, issues:[{path,message}]}` with a field path, and `loadConfig` fails closed (`ok:false`, config = shipped default) so P3 can refuse dispatch.

## P3 — Routed command execution

Layer: api · Done-when: `cd packages/pi-agentic-workflow && node --test test/alias-coverage.test.mjs test/argument-forwarding.test.mjs test/dispatch-refusals.test.mjs test/restore-after-settle.test.mjs test/unavailable-stop.test.mjs test/first-run-hint.test.mjs` → exit 0.

- [ ] Register one command per bundled `user-invocable: true` skill named after its frontmatter `name:`; `test/alias-coverage.test.mjs` (AC3)
      *(P2 carry-in: the same suite asserts every `commands` key in a config file exists in the catalogue — a typo'd command name must not silently route nothing.)*
- [ ] Forward post-command arguments verbatim and in order; `test/argument-forwarding.test.mjs`: `/plan-feature 27-pi-agentic-workflow` → `plan-feature` + `27-pi-agentic-workflow` (AC4)
- [ ] Dispatch guard: refuse (no skill expansion) when agent busy, routed invocation in flight, or present config invalid; `test/dispatch-refusals.test.mjs` (AC12)
- [ ] Snapshot session model + thinking level before any non-inherit dispatch (AC7)
- [ ] Apply the resolved route via `setModel` / `setThinkingLevel` before dispatch (AC7)
- [ ] Restore snapshot after `agent_settled` unless the user changed the model during the routed turn; `test/restore-after-settle.test.mjs` (AC7, AC8)
- [ ] `onUnavailableRoute`: default `stop` — no dispatch, message names command, route, `/agentic-workflow-settings`; `inherit` mode dispatches on the session model; explicit `inherit` never fails; `test/unavailable-stop.test.mjs` (AC9)
- [ ] First-run hint shown exactly once, acknowledgement persisted in `~/.pi/agent/pi-agentic-workflow-state.json`; `test/first-run-hint.test.mjs` (AC11, D-E7)

## P4 — Agentic-workflow settings console

Layer: ui · Done-when: `cd packages/pi-agentic-workflow && node --test test/settings-console.test.mjs` → exit 0 (view/save state transitions); AC10 itself is read-verified on the registered command.

- [ ] Register `/agentic-workflow-settings` (also asserted by `test/alias-coverage.test.mjs`)
- [ ] Display merged effective config; empty override list rendered as `inherit`, not an error (AC10, AC6)
- [ ] Set default route
- [ ] Set or clear a per-command override
- [ ] Set `onUnavailableRoute` to `stop` or `inherit`
- [ ] Save to global scope (`~/.pi/agent/pi-agentic-workflow.json`)
- [ ] Save to project scope (`.pi/pi-agentic-workflow.json`); refused when the project is untrusted (AC10)

## P5 — Bilingual package READMEs

Layer: docs · Done-when: `grep -c "pi install" packages/pi-agentic-workflow/README.md` → ≥1 and same for `README.es.md`, switcher links present both ways (AC15).

- [ ] `README.md`: install, alias list source (every public skill), config paths (global + project JSON), default `inherit`, fail-closed unavailable routes (AC15)
- [ ] `README.es.md`: faithful sibling, same sections (AD-002 same-change rule)
- [ ] Reciprocal language-switcher links (`> 🇪🇸 [Versión en español](README.es.md)` / `> 🇬🇧 [English version](README.md)`), read-verified sync

## P6 — Hardening & PR

Layer: hardening · Done-when: `cd packages/pi-agentic-workflow && npm test` → exit 0 AND the PR URL is printed in the chat.

- [ ] Dev-scenario sweep — each failure mode asserted by a named suite: `config:missing-files` (default-inherit), `config:malformed-json` (dispatch-refusals), `config:untrusted-project` (untrusted-project-config), `routing:unavailable-model` (unavailable-stop), `dispatch:in-flight-duplicate` (dispatch-refusals), `hint:exactly-once` (first-run-hint) — read-verified list
- [ ] AC16 read-verify: `git diff main --stat` shows only `packages/pi-agentic-workflow/`, `docs/features/27-pi-agentic-workflow/`, `docs/features/ROADMAP.md`; schema-package diff empty
- [ ] Full gate: `cd packages/pi-agentic-workflow && npm test` → exit 0 (AC14); regression `cd packages/agentic-workflow-schema && npm test` → exit 0 (AD-007)
- [ ] `npm pack --dry-run` lists extension, all bundled skills, manifests
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat (roadmap-only traceability — no `Closes #` line; body references feature 27)
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
