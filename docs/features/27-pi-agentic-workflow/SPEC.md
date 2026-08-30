# 27 — pi-agentic-workflow

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature` writes the **Product half**
> and stamps `## Design status`. `plan-feature` refuses to plan a feature
> not marked `designed`, then writes the **Engineering half**.

## Goal

Ship `@gtrabanco/pi-agentic-workflow`, a self-contained Pi package that
installs the canonical agentic-workflow skills and exposes them as native Pi
slash commands, with optional per-command model and thinking routing that
never silently downgrades a configured route.

## Branch

`feat/27-pi-agentic-workflow`

## Size

`M` — one cohesive npm/Pi package covering deterministic skill bundling,
slash-command aliases, two-scope JSON configuration, an interactive settings
command, invocation-scoped model lifecycle, and clean-install verification.
No Pi core changes. Full planning artifact set required.

## Dependencies

- Hard dependencies: none on other roadmap units. The package consumes
  published Pi extension APIs (`registerCommand`, `sendUserMessage`,
  `setModel`, `setThinkingLevel`, `agent_settled`) already present in Pi.
- Soft dependencies: none. Feature 26 (`staged-verification-contracts`) is a
  parallel in-progress unit on another branch and is not required here.
- Traceability: roadmap only; no GitHub tracking issue.

---

## Product half

Written by `design-feature`.

### Context

Pi users can already load agentic-workflow skills, but the native skill
surface is `/skill:<name>` and every invocation inherits the session model.
That makes the workflow harder to discover than Claude-style `/design-feature`
commands and prevents planning or review skills from using a stronger model
than the parent session.

This repository already ships skills in `skills/` and one npm package,
`packages/agentic-workflow-schema/`. It does not ship a Pi package. Pi
packages can bundle skills plus a TypeScript extension, register slash
commands, and change the session model for a turn. Pi does **not** provide a
supported namespaced plugin block inside `settings.json`; extensions own
dedicated JSON files under `~/.pi/agent/` and `.pi/`.

The gap is a first-class Pi plugin: one `pi install` that provides the
canonical skills, friendly aliases, file-based plus console configuration,
and fail-closed model routing.

**Architectural invariants:** n/a: no project invariants declared
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` is absent on this revision).
NRS accepted decisions preserved: AD-002 (bilingual human docs), AD-004 (one
PR against `main`), AD-007 (schema package untouched).

### Business goals

- Make agentic-workflow usable in Pi with the same command names operators
  already know, without a second skills installer.
- Let operators assign stronger or cheaper models to specific workflow
  commands without leaving the session stuck on that model.
- Keep a single workflow implementation: Pi must not fork skill prose.

### Scope

#### In scope

- **S1.** Publish npm package `@gtrabanco/pi-agentic-workflow` from
  `packages/pi-agentic-workflow/` with the `pi-package` keyword and a `pi`
  manifest that loads the bundled extension and skills.
- **S2.** Bundle every canonical skill needed at runtime (all
  `user-invocable: true` skills plus internal composed skills). Exclude only
  skills marked `metadata.internal: true`. Bundled skill files match the
  repository `skills/` source byte-for-byte.
- **S3.** Register a friendly Pi slash command for every bundled
  `user-invocable: true` skill (`/design-feature`, `/execute-phase`, …),
  forwarding arguments to the matching canonical skill.
- **S4.** Register `/agentic-workflow-settings` for interactive view and
  edit of routing configuration, with an explicit global vs project save
  scope.
- **S5.** Load configuration from dedicated JSON files: global
  `~/.pi/agent/pi-agentic-workflow.json` and project
  `.pi/pi-agentic-workflow.json`. Project values override global values.
  Missing files resolve to the in-package default. Do not write plugin keys
  into Pi `settings.json`.
- **S6.** Support one default route plus optional per-command overrides.
  Each route may set `model` to `inherit` or `provider/modelId`, and may set
  a thinking level or inherit it. The shipped/effective default route is
  `inherit`.
- **S7.** Apply a non-inherit route only for that command invocation, then
  restore the previous session model and thinking level after the agent
  settles. Do not restore over an explicit user model change made during the
  routed turn.
- **S8.** If a non-inherit route is unknown or unauthenticated, **stop and
  explain** by default (`onUnavailableRoute: stop`). Operators may set
  `onUnavailableRoute: inherit`. Explicit `inherit` routes never fail closed
  for model availability.
- **S9.** On the first workflow-command execution after install, show a
  one-time persisted hint that per-command models can be configured via
  `/agentic-workflow-settings` or the JSON files.
- **S10.** Refuse to dispatch when the agent is already busy, when a routed
  invocation is already in flight, or when a config file is present but
  invalid.
- **S11.** Ignore project configuration until the project is trusted by Pi.
  Global configuration still applies.
- **S12.** Ship synchronized English and Spanish package READMEs describing
  install, commands, config paths, and fail-closed routing.

#### Out of scope / non-goals

- No Pi core patches, forks, or built-in Pi commands.
- No shell CLI such as `pi workflow design-feature`.
- No GitHub tracking issue for this unit.
- No Pi-specific variants of canonical `SKILL.md` files.
- No plugin keys inside Pi `settings.json`.
- No `init-workspace` auto-install of this Pi package.
- No Claude Code plugin / marketplace packaging in this unit.
- No edits to `docs/workflow/model-routing.yml` or skill `model:` frontmatter.
- No changes to `@gtrabanco/agentic-workflow-schema`.
- No grouped routing profiles (planning/execution/review buckets).
- No requirement to run setup before the first command.
- No project-wide `docs/CAPABILITIES.md` seed in this unit (derived inventory
  lives in this SPEC).
- No gallery video/image assets for pi.dev.

### Capability closure

The repository has no project-level `docs/CAPABILITIES.md`. Derived inventory
for this package feature:

- npm / Pi package distribution
- canonical skills catalog
- Pi slash-command navigation
- plugin settings / preferences
- notifications (hints and failures)
- documentation (package README EN+ES)
- project trust
- authentication / ACL / search / audit log / billing / feature flags /
  background jobs / file storage: not product surfaces of this repo

Roles: `pi user`, `project maintainer`, `package maintainer`.

**1. Entity closure — Pi package**

- [x] Create — UI: `pi install npm:@gtrabanco/pi-agentic-workflow` · API:
  npm package with `pi` manifest · test: package name/manifest assertions
- [x] Read/list — UI: `pi list` plus Pi command autocomplete · API: package
  `pi.skills` / `pi.extensions` · test: discovered skill and command coverage
- [x] Update — UI: `pi update npm:@gtrabanco/pi-agentic-workflow` · API: npm
  versioned package · test: version present on `package.json`
- [x] Delete — UI: `pi remove npm:@gtrabanco/pi-agentic-workflow` · API: Pi
  package manager · test: n/a: removal is owned by Pi, not this package
- [x] State transitions — n/a: a published package has no runtime states
  beyond install/update/remove owned by Pi

**Entity closure — routing config**

- [x] Create — UI: `/agentic-workflow-settings` save, or writing the JSON
  file · API: global and project config files · test: settings write + file
  fixture
- [x] Read/list — UI: `/agentic-workflow-settings` merged view · API: load
  global then project · test: merge fixture
- [x] Update — UI: `/agentic-workflow-settings` · API: overwrite JSON ·
  test: override and scope fixtures
- [x] Delete — UI: settings command can clear a per-command override or
  restore `inherit` · API: omit key / write `inherit` · test: missing file
  equals default inherit
- [x] State transitions — n/a: config is declarative JSON, not a stateful
  record

**Entity closure — command alias**

- [x] Create — n/a: aliases are package-authored at load, not user-created
- [x] Read/list — UI: Pi `/` autocomplete · API: `pi.registerCommand` names
  matching each public skill · test: alias coverage vs `user-invocable: true`
- [x] Update — n/a: operators cannot rename aliases
- [x] Delete — n/a: disabling the package/resource is Pi `pi config`
- [x] State transitions — idle → routing → dispatched → settled → restored;
  busy or invalid config stays idle · test: lifecycle and refusal fixtures

**Capabilities and role matrix**

- [x] Install and use the package — visible entry point: `pi install` ·
  `pi user`: allowed · `project maintainer`: allowed · `package maintainer`:
  allowed
- [x] Invoke a friendly workflow command — visible entry point: `/<skill>` ·
  `pi user`: allowed · `project maintainer`: allowed · `package maintainer`:
  allowed
- [x] Configure default and per-command routes in global JSON — visible
  entry point: `/agentic-workflow-settings` (global scope) and
  `~/.pi/agent/pi-agentic-workflow.json` · `pi user`: allowed ·
  `project maintainer`: allowed · `package maintainer`: allowed
- [x] Configure project routes — visible entry point:
  `/agentic-workflow-settings` (project scope) and
  `.pi/pi-agentic-workflow.json` · `pi user`: denied unless the same human
  is the project maintainer · `project maintainer`: allowed ·
  `package maintainer`: allowed
- [x] Author bundled skill variants — visible entry point: n/a · `pi user`:
  denied · `project maintainer`: denied · `package maintainer`: denied;
  skills remain canonical repository copies
- [x] Assign/revoke/view introduced roles or permissions — n/a: descriptive
  operator roles only; no runtime ACL registry

**2. Integration closure — derived inventory**

- [x] npm / Pi package distribution — new package under
  `packages/pi-agentic-workflow/` with `pi-package` keyword, `pi` manifest,
  peerDependency on Pi, public npm access · test: `package.json` + pack
  dry-run
- [x] canonical skills catalog — package copies runtime skills unchanged;
  excludes `metadata.internal: true` · test: byte-identical parity check
- [x] Pi slash-command navigation — one alias per public skill plus
  `/agentic-workflow-settings` · test: command registry coverage
- [x] plugin settings / preferences — dedicated JSON files, project-over-
  global merge, in-package default `inherit` · test: merge and default
  fixtures
- [x] notifications — fail-closed errors, busy/in-flight refusals, one-time
  first-run hint · test: message fixtures
- [x] documentation — synchronized package `README.md` and `README.es.md` ·
  test: read-verified language-switcher + install/config sections
- [x] project trust — project file unread until `ctx.isProjectTrusted()` ·
  test: untrusted-project fixture
- [x] Authentication — n/a: Pi owns provider login; this package only
  consumes `setModel` success/failure
- [x] ACL / permissions — n/a: no application permission registry
- [x] Search — n/a: no search index
- [x] Audit log / activity trail — n/a: no audit store
- [x] Background jobs / scheduling — n/a: no workers
- [x] File / media storage — n/a: only the two JSON config files
- [x] i18n / localization — package READMEs EN+ES; command UI English-only
  (process artifacts stay English)
- [x] Feature flags — n/a
- [x] Billing / payments — n/a
- [x] Public API / integrations — npm + Pi package install only; no HTTP API
- [x] Roadmap / workflow docs — this feature row and SPEC; human tutorial
  mention of the Pi package is engineering-half README work already in S12
- [x] Schema package — n/a: no contract change
- [x] model-routing.yml — n/a: Claude-branch frontmatter is a different
  distribution channel

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | One Pi install is enough to use the workflow | in-scope | S1 S2; AC1 AC2 |
| 2 | Friendly `/design-feature` exists, not only `/skill:design-feature` | in-scope | S3; AC3 |
| 3 | Extra arguments after the command reach the skill | in-scope | S3; AC4 |
| 4 | Missing config still runs by inheriting the session model | in-scope | S6 S9; AC6 AC11 |
| 5 | Project JSON overrides global JSON | in-scope | S5; AC5 |
| 6 | Invalid JSON does not silently inherit a configured route | in-scope | S10; AC12 |
| 7 | An unavailable configured model stops with a setup message | in-scope | S8; AC9 |
| 8 | The session model returns after the workflow command | in-scope | S7; AC8 |
| 9 | A settings command can edit routes without hand-editing JSON | in-scope | S4; AC10 |
| 10 | Bundled skills do not drift from canonical `skills/` | in-scope | S2; AC2 |
| 11 | First run tells the operator that custom models are optional | in-scope | S9; AC11 |
| 12 | Untrusted project files cannot change routing | in-scope | S11; AC13 |
| 13 | Empty override list is shown as inherit, not an error | in-scope | S6; AC6 AC10 |
| 14 | A second alias during an in-flight routed command is refused | in-scope | S10; AC12 |
| 15 | Shell CLI `pi workflow …` ships in v1 | out-of-scope | Out of scope: no shell CLI |
| 16 | Plugin keys live in Pi `settings.json` | out-of-scope | Out of scope: dedicated JSON files |
| 17 | Canonical skills get Pi-only rewrites | out-of-scope | Out of scope: no skill variants |
| 18 | `init-workspace` auto-installs the Pi package | out-of-scope | Out of scope: no init-workspace change |
| 19 | Claude `model-routing.yml` is imported automatically | out-of-scope | Out of scope: no model-routing.yml edits |
| 20 | Namespaced Pi `settings.json` plugin API | deferred | Deferred decisions row D1 |

### Acceptance criteria

- [ ] **AC1 — command-verified:** `packages/pi-agentic-workflow/package.json`
  has `"name": "@gtrabanco/pi-agentic-workflow"`, keyword `pi-package`,
  `publishConfig.access` `public`, and a `pi` manifest listing the extension
  and skills. Check:
  `node -e "const p=require('./packages/pi-agentic-workflow/package.json'); if(p.name!=='@gtrabanco/pi-agentic-workflow') process.exit(1); if(!p.keywords.includes('pi-package')) process.exit(1); if(!p.pi.extensions||!p.pi.skills) process.exit(1)"`
- [ ] **AC2 — command-verified:** every bundled skill file is byte-identical
  to `skills/<name>/` for that name, every `user-invocable: true` skill is
  included, internal composed skills are included, and
  `metadata.internal: true` skills are excluded. Check: package test
  `skill-parity`.
- [ ] **AC3 — command-verified:** the extension registers one slash command
  per bundled `user-invocable: true` skill using that skill's `name`, plus
  `agentic-workflow-settings`. Check: package test `alias-coverage`.
- [ ] **AC4 — command-verified:** invoking `/plan-feature 27-pi-agentic-workflow`
  dispatches the `plan-feature` skill with argument
  `27-pi-agentic-workflow` (no dropped or reordered tokens). Check: package
  test `argument-forwarding`.
- [ ] **AC5 — command-verified:** when both config files exist, project
  `commands.design-feature` overrides global `commands.design-feature` and
  unspecified keys keep the global/default value. Check: package test
  `config-merge`.
- [ ] **AC6 — command-verified:** with no config files, the effective default
  route is `{ "model": "inherit" }` and the command dispatches without
  calling `setModel`. Check: package test `default-inherit`.
- [ ] **AC7 — read-verified:** a non-inherit route snapshots the current
  model and thinking level, calls `setModel` / `setThinkingLevel` before
  dispatch, and restores both after `agent_settled` unless the user changed
  the model during that turn.
- [ ] **AC8 — command-verified:** after a routed command settles, the session
  model id and thinking level equal the pre-dispatch snapshot. Check:
  package test `restore-after-settle`.
- [ ] **AC9 — command-verified:** a configured `provider/modelId` that is
  missing or has no API key does not dispatch when `onUnavailableRoute` is
  `stop` (default); the operator sees a message naming the command, the
  route, and `/agentic-workflow-settings`. Check: package test
  `unavailable-stop`.
- [ ] **AC10 — read-verified:** `/agentic-workflow-settings` can display the
  merged config, set the default route, set or clear a per-command override,
  set `onUnavailableRoute`, and save to either global or project scope.
  Project save is refused when the project is not trusted.
- [ ] **AC11 — command-verified:** the first workflow-command dispatch shows
  the configuration hint exactly once and persists that acknowledgement in
  global package state so later sessions do not repeat it. Check: package
  test `first-run-hint`.
- [ ] **AC12 — command-verified:** dispatch is refused (no skill expansion)
  when the agent is busy, a routed invocation is in flight, or a present
  config file fails schema/parse validation. Check: package test
  `dispatch-refusals`.
- [ ] **AC13 — command-verified:** when project trust is false, the project
  file is ignored even if it exists. Check: package test
  `untrusted-project-config`.
- [ ] **AC14 — command-verified:** `cd packages/pi-agentic-workflow && npm
  test` exits 0.
- [ ] **AC15 — read-verified:** `packages/pi-agentic-workflow/README.md` and
  `README.es.md` are synchronized, include reciprocal language-switcher
  links, and document install, alias list source (public skills), config
  paths, default inherit, and fail-closed unavailable routes.
- [ ] **AC16 — read-verified:** no Pi core source, shell CLI, schema-package
  change, skill-prose fork, or `settings.json` plugin key is introduced.

### Tooling

Pi docs and examples used for this design: `docs/packages.md`,
`docs/skills.md`, `docs/extensions.md`, `docs/settings.md`,
`examples/extensions/preset.ts`, `examples/extensions/send-user-message.ts`.
No additional MCP is required. Implementation uses `@earendil-works/pi-coding-agent`
as a peer dependency.

### Product decisions

| ID | Decision | Rationale |
|---|---|---|
| D-P1 | Plugin slash commands, not Pi core and not a shell CLI | User: this is a Pi plugin. Pi already supports `registerCommand`. |
| D-P2 | Name everything `pi-agentic-workflow`; npm `@gtrabanco/pi-agentic-workflow` | User-requested consistent naming. |
| D-P3 | Self-contained package: skills + extension in one install | Prevents extension/skill version drift. |
| D-P4 | Dedicated JSON files, not Pi `settings.json` | Pi has no supported plugin settings namespace or typed accessor. |
| D-P5 | Default plus per-command overrides | Compact config; exact models only where needed. |
| D-P6 | Default route `inherit`; fail-closed only for explicit non-inherit routes | Zero-setup first run; configured routes stay honest. |
| D-P7 | Restore model and thinking after `agent_settled` | Routing is per invocation, not a session takeover. |
| D-P8 | `/agentic-workflow-settings` is mandatory console configuration | User required a console path in addition to JSON. |
| D-P9 | Alias every `user-invocable: true` skill; no aliases for internals | Complete public coverage without exposing composed internals. |
| D-P10 | Canonical skills unchanged; exclude `metadata.internal: true` | One workflow implementation; `bump-skill` is repo maintenance. |
| D-P11 | Roadmap-only traceability | User declined a tracking issue. |
| D-P12 | Size M | Packaging, config UI, lifecycle, and clean-install tests are one unit but need the full artifact set. |
| D-P13 | `onUnavailableRoute` default `stop`, optional `inherit` | User asked for configurable fallback with stop as default. |
| D-P14 | Do not restore over an explicit user model change during the routed turn | Avoid fighting `/model` or Ctrl+P. |
| D-P15 | One routed invocation at a time; busy agent refuses new aliases | Prevents nested `setModel` and stolen in-flight turns. |

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| D1 — migrate config into Pi `settings.json` if Pi later adds a supported plugin-settings API | Pi has no such API today; using undocumented extra keys would be brittle | Re-open only if Pi documents a stable namespaced plugin settings field |

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half —
      `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
      over the sections above returns nothing. The fenced Capability-closure
      template blocks are replaced by instantiated rows.
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet.
- [x] Every Capability closure row is filled or `n/a: <reason>`.
- [x] Integration closure has one row per derived-inventory subsystem.
- [x] Every capability's role matrix lists EVERY derived role with
      `allowed`/`denied`.
- [x] `### Expectation sweep` has ≥ 10 resolved rows; every resolution is
      `in-scope`, `out-of-scope`, or `deferred` with a pointer.
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion.
- [x] Every Acceptance criterion is a runnable command OR labelled
      `read-verified`.
- [x] `### Deferred decisions` exists; every row has a decide-by trigger.

Engineering boxes (scaffold time):

- [x] `### Dev scenarios` has ≥ 1 failure-mode row, or an explicit
      `n/a: <reason>`.
- [x] Every phase passes the 8-box Phase-lint.
- [x] No template placeholders left anywhere in the file (same grep, whole
      file). Mechanical residuals reviewed and classified non-placeholder: the
      frozen product half's domain path notation (`/skill:<name>`,
      `skills/<name>/` — meaning "every skill"/Pi's command path, not slots)
      and this spec-lint section's own `n/a: <reason>` wording. No unfilled
      template slots remain.

## Design status

`designed`

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

- **One install, zero setup:** `pi install npm:@gtrabanco/pi-agentic-workflow` yields friendly
  `/design-feature`-style commands with `inherit` default routing — no config file is required for
  the first dispatch.
- **Honest routing:** a configured non-inherit route applies to exactly one invocation and is
  restored after `agent_settled`; an unavailable configured route stops with a named explanation
  instead of silently downgrading.
- **Single workflow implementation:** bundled skills are byte-identical build copies of `skills/`
  with a parity test as the drift guard; no skill prose is forked.
- **Clean packaging:** self-contained npm package with a `pi` manifest; nothing outside
  `packages/pi-agentic-workflow/` changes (no Pi core, no schema package, no `settings.json` keys).

### Architecture impact

New self-contained package under `packages/pi-agentic-workflow/` — the repo's second package
(precedent: `packages/agentic-workflow-schema/`, NRS F003/F004). Invariants the implementation
must hold:

- **Bundled skills are build artifacts, not sources.** `skills/` remains the single source of
  truth; the bundle script copies each skill directory from `skills/` minus
  `metadata.internal: true` skills, and the
  parity test fails the build on any byte drift. No skill file is ever edited inside the package.
- **Extension-only integration.** The package consumes Pi extension APIs (`registerCommand`,
  `sendUserMessage`, `setModel`, `setThinkingLevel`, `agent_settled`, `ctx.isProjectTrusted()`)
  via a peerDependency on `@earendil-works/pi-coding-agent`; no Pi core changes.
- **Dedicated config files only.** Global `~/.pi/agent/pi-agentic-workflow.json`, project
  `.pi/pi-agentic-workflow.json`; the extension never writes plugin keys into Pi `settings.json`
  (Pi has no supported plugin settings namespace — product decision D-P4).
- **Layer mapping used by the phase-lint** (a plugin's whole surface is extension code, so layers
  classify the *kind* of work): `config/infra` = manifest/build/bundling; `domain` = pure config
  load/merge/validate logic; `api` = command registration, dispatch guards, routing lifecycle;
  `ui` = the interactive `/agentic-workflow-settings` console; `docs` = package READMEs;
  `hardening`/`close-out` per the enum.
- NRS accepted decisions preserved: AD-002 (README pair synchronized in the same change), AD-004
  (one PR against `main`), AD-007 (schema package untouched).

### Design

**Package layout** (`packages/pi-agentic-workflow/`):

```
package.json              name @gtrabanco/pi-agentic-workflow · keyword pi-package ·
                          publishConfig.access public · peerDependencies: @earendil-works/pi-coding-agent
                          pi: { extensions: ["./dist/extension/index.js"], skills: "./skills" }
dist/extension/index.js   compiled extension (source: src/extension/index.ts)
skills/<skill>/…          bundled byte-identical copies (committed build output)
test/*.test.mjs           node:test suites (tsc + tsconfig.test.json, schema-package precedent)
README.md / README.es.md  synchronized package docs (AC15)
```

**Config schema** (both files, identical shape):

```json
{
  "default": { "model": "inherit", "thinking": "inherit" },
  "commands": {
    "plan-feature": { "model": "provider/modelId", "thinking": "high" }
  },
  "onUnavailableRoute": "stop"
}
```

`model` is `"inherit"` or an exact `provider/modelId`; `thinking` is a Pi thinking level or
`"inherit"`; `onUnavailableRoute` is `"stop" | "inherit"`. Ship-shipped default: `inherit`.

**Config engine (domain):**

1. Global file loaded from `~/.pi/agent/pi-agentic-workflow.json`; missing file → in-package
   default (`inherit`). Project file loaded from `.pi/pi-agentic-workflow.json` **only when
   `ctx.isProjectTrusted()`** — an untrusted project's file is ignored even if present (S11).
2. Merge is per-key, project over global; unspecified keys keep the global/default value (S5).
3. Validation is strict: a present file that fails JSON parse or schema validation is an error —
   dispatch is refused, never silently treated as inherit (S10). An empty/absent override list is
   `inherit`, not an error (S6).

**Command surface (api):** at load, one friendly command per bundled `user-invocable: true` skill,
named exactly after the skill's frontmatter `name:` (S3/D-P9). A handler run:

1. **Guards (S10):** refuse (no skill expansion, explanatory message) when the agent is busy, when
   a routed invocation is already in flight, or when a present config file failed validation.
2. **Route resolution:** effective route = per-command override, else default. `inherit` →
   dispatch immediately without calling `setModel` (S6). Non-inherit → snapshot the current model
   + thinking level, call `setModel`/`setThinkingLevel` (S7).
3. **Unavailable route (S8):** if the configured model is unknown or unauthenticated → default
   `stop`: no dispatch; message names the command, the route, and `/agentic-workflow-settings`.
   `onUnavailableRoute: "inherit"` → dispatch on the session model. Explicit `inherit` routes
   never fail closed for model availability.
4. **Dispatch:** the invocation is forwarded to the canonical skill with arguments verbatim and
   in order (S3; AC4 pins `/plan-feature 27-pi-agentic-workflow` → `plan-feature` +
   `27-pi-agentic-workflow`), using the extension messaging mechanism cited in the product
   design (`examples/extensions/send-user-message.ts`).
5. **Restore (S7):** after `agent_settled`, restore the snapshotted model + thinking level —
   **unless** the user changed the model during the routed turn (S14/AC7: never restore over an
   explicit user change).
6. **First-run hint (S9):** on the first workflow-command dispatch, show a one-time hint that
   per-command models are optional (`/agentic-workflow-settings` or the JSON files); persist the
   acknowledgement in a dedicated global state file (`~/.pi/agent/pi-agentic-workflow-state.json`,
   separate from the config file so user config is never rewritten by state bookkeeping).

**Settings console (ui):** `/agentic-workflow-settings` displays the merged effective config
(empty override list rendered as `inherit`), then supports: set default route · set or clear a
per-command override · set `onUnavailableRoute` · save to **global** or **project** scope with an
explicit scope choice; project save is refused when the project is untrusted (S11/AC10).

**State machine (from the SPEC's entity closure):** `idle → routing → dispatched → settled →
restored`; busy or invalid-config input never leaves `idle`.

### Decisions to confirm

- **D-E1 — One unit, six phases.** The plan cuts to six single-layer phases. The hard split rule
  (">~5 phases") was evaluated: splitting would move the settings console + docs (S4/S12) into a
  new chained unit — a product re-scope the scaffold cannot perform (product half is frozen;
  D-P12 pins one unit), and every phase here still passes all eight lint boxes with local-only
  verification, satisfying the rule's intent. Recorded instead of silently exceeding.
- **D-E2 — Test stack mirrors the schema package:** TypeScript + `tsc` + `tsconfig.test.json` +
  `node --test` (NRS F005 precedent); `npm test` = compile then run.
- **D-E3 — Bundled skills are committed build copies** with the parity test as the drift guard
  (byte-for-byte from `skills/`; a merged skill fix flows into the next bundle, and the test
  fails if a copy is stale at build time).
- **D-E4 — Settings console declares layer `ui`** (interactive console surface the operator
  reads/edits); dispatch-only command handlers declare `api`.
- **D-E5 — Strict config validation:** present-but-invalid = refuse (S10); only *missing* files
  resolve to the default. Locked by tests, not judgment.
- **D-E6 — READMEs are written in P5**, after all behavior exists, so install/config/routing
  sections document built features — no docs written ahead of the code they describe.
- **D-E7 — Hint acknowledgement state lives in a dedicated state file**
  (`~/.pi/agent/pi-agentic-workflow-state.json`), never inside the user's config file.

### Testing requirements

- **Layer:** package unit/integration tests (`node --test`) over the public extension surface
  (registered commands, config engine, routing lifecycle) with test doubles standing in for the
  Pi `ctx` — the same contract style as the schema package; no heavy mocking beyond the boundary.
- Red-first where the task is validator-shaped (config validation, parity): the suite file lands
  before the behavior completes and fails red until then.
- Every command-checkable AC is a named suite file (see `ACCEPTANCE.md` validators):
  `skill-parity`, `alias-coverage`, `argument-forwarding`, `config-merge`, `default-inherit`,
  `restore-after-settle`, `unavailable-stop`, `first-run-hint`, `dispatch-refusals`,
  `untrusted-project-config`.
- Regression: the schema package's own suite (`cd packages/agentic-workflow-schema && npm test`)
  stays green — AD-007 requires the untouched surface to stay untouched.

### Dev scenarios

Failure modes seeded from the fixed category list; each is reachable through an existing
mechanism (missing/malformed files, Pi trust flag, provider availability, extension in-flight
flag, persisted state file) — scenarios are orchestration, never new domain:

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `config:missing-files` | empty/zero state — no config anywhere | both JSON files absent → default `inherit` dispatch, hint shown (P2/P3 tests) |
| `config:malformed-json` | invalid or oversized input | present file with bad JSON/schema → refusal, never silent inherit (P2 test) |
| `config:untrusted-project` | permission denied / wrong role | `ctx.isProjectTrusted() === false` → project file ignored; project save refused (P2/P4 tests) |
| `routing:unavailable-model` | dependency outage or timeout | `setModel` fails / unknown `provider/modelId` → stop + message naming command, route, settings (P3 test) |
| `dispatch:in-flight-duplicate` | concurrent/duplicate action | second alias while a routed invocation is in flight → refused, first turn untouched (P3 test) |
| `hint:exactly-once` | limit or threshold hit | acknowledgement persisted in global state → hint never repeats in later sessions (P3 test) |

### Phases

Phases `P1…P6`; `P6` is the hardening phase and ends with the literal close-out chain (the PR is
its final step, not a phase of its own). Detailed task checklists live in `TASKS.md`; the
high-level cut:

- **P1 — Package skeleton with byte-identical skill bundling** — `config/infra`. Manifest,
  bundling, parity test.
- **P2 — Routing config engine** — `domain`. Files, trust gate, merge, default, strict validation.
- **P3 — Routed command execution** — `api`. Aliases, forwarding, refusals, snapshot/apply/restore,
  unavailable routes, first-run hint.
- **P4 — Agentic-workflow settings console** — `ui`. Merged view, route editing, scoped saves.
- **P5 — Bilingual package READMEs** — `docs`. EN+ES synchronized (AC15).
- **P6 — Hardening & PR** — `hardening`. Dev-scenario sweep, full gate, AC16 read-verify, close-out.

Phase-lint results (canonical eight-box contract, `skills/phase-contract/SKILL.md`):

- `Phase-lint: PASS (8/8) · fingerprint P1:config/infra:5:package-skeleton-with-byte-identical-skill-bundling`
- `Phase-lint: PASS (8/8) · fingerprint P2:domain:7:routing-config-engine`
- `Phase-lint: PASS (8/8) · fingerprint P3:api:8:routed-command-execution`
- `Phase-lint: PASS (8/8) · fingerprint P4:ui:7:agentic-workflow-settings-console`
- `Phase-lint: PASS (8/8) · fingerprint P5:docs:3:bilingual-package-readmes`
- `Phase-lint: PASS (8/8) · fingerprint P6:hardening:8:hardening-and-pr`

### Deploy & rollback

Merge is not the whole ship: after the PR merges, publish with `npm publish` from
`packages/pi-agentic-workflow/` (public access; version `0.1.0`; OTP per account config). The
roadmap row flips to `done · [#<pr>]` at close-out regardless — merge state lives in the forge.
Rollback: `npm deprecate @gtrabanco/pi-agentic-workflow "superseded"` + revert PR; users remove
with `pi remove npm:@gtrabanco/pi-agentic-workflow` (Pi-owned). No data cleanup — the only
user-side artifacts are the two JSON config files and the state file.

### Open questions / risks

- **Pi API surface drift** (`setThinkingLevel`, `agent_settled`, manifest fields): pinned by the
  peerDependency range; P1's manifest assertions and P3's lifecycle tests fail loudly on drift.
  RESOLVED for planning: dispatch goes through the extension messaging mechanism cited in the
  product design (`send-user-message.ts` example) — no open decision.
- **Skill drift between `skills/` and the bundle** — RESOLVED by D-E3 (parity test fails the
  build). Not an open question; listed as the risk the parity test exists to catch.
- **Roadmap row 26 is missing** (staged-verification-contracts shipped as PR #145 without a
  roadmap row) — documentation drift, not a dependency of this unit (SPEC: feature 26 "is not
  required here"). Recorded in `known-issues.md`, destined for `/audit-docs`.

### Deliverables

- `packages/pi-agentic-workflow/` — `package.json` with `pi` manifest, extension (`src/` +
  `dist/`), bundled `skills/` copies, `test/` suites, `README.md` + `README.es.md`.
- Planning artifacts (this SPEC's engineering half, `ACCEPTANCE.md`, `PLAN.md`, `TASKS.md`,
  `progress.md`, `testing.md`, `known-issues.md`, `decisions.md`, `architecture-notes.md`).
- Roadmap row 27 registered `planned` (this turn), `done · [#<pr>]` at close-out.

### Post-merge next feature

None queued: after 27, every roadmap row reads `done` and no `defined`/`idea` row remains. Next
actions are maintenance-shaped: `/audit-docs` (also picks up the missing row 26), then
`/product-audit` for a tooling sweep of the new Pi package — a new unit starts only from
`/design-feature`.
