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

- [ ] `### Dev scenarios` has ≥ 1 failure-mode row, or an explicit
      `n/a: <reason>`.
- [ ] Every phase passes the 8-box Phase-lint.
- [ ] No template placeholders left anywhere in the file.

## Design status

`designed`

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

### Architecture impact

### Design

### Decisions to confirm

### Testing requirements

### Dev scenarios

### Phases

### Deploy & rollback

### Open questions / risks

### Deliverables

### Post-merge next feature
