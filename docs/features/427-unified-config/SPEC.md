---
type: feature
scope: large
---

# 427 — unified-config

> One unified config schema, two scopes, an operator CLI/API, and a plugin
> contract a package uses to publish its own config section.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — one unified config file.**
> Define a **single unified config file** schema where all **feature configurations** have their own section, with global (per-user) and project-level precedence, mergeable at runtime, with a CLI and API to modify it without knowing the full format. Also define a `pi` section for the package's own internal config that only makes sense inside `pi-agentic-workflow`.

**S2 — fill in the gaps, not a deep merge of defaults.**
> The resolution is a **fill-in the gaps** process, not a deep merge of defaults

**S3 — JSONC.**
> Use **JSONC** (JSON with comments). Bun parses JSONC natively; for Node.js compatibility a `jsonc` parse package should be used.

**S4 — schema generation.**
> Define a standard way to generate the JSON schema from TypeScript definitions

**S5 — runtime loader.**
> Define the single source of truth for config

**S6 — CLI.**
> Define a CLI (`@gtrabanco/agentic-workflow config`) that allows standardized modification

**S7 — API.**
> Define an API that does the same as the CLI

**S8 — AGENTS.md policy.**
> Document the process for when a new feature needs a config parameter

**S9 — documentation.**
> **Human docs**: Document the unified config file with all sections, their purpose, defaults, and example values

**S10 — migrate consumers.**
> **M7**: Migrate all existing config consumers to the unified loader

**S11 — init-workspace.**
> **M8**: Update `init-workspace` to use the new config system

**S12 — milestones M1–M10.**
> **M1**: Define the unified schema proposal (example config, section list, all current features mapped, `pi` section structure, feature vs pi zero-overlap distinction documented, default-as-fill-in behavior documented, extension registration architecture documented, override mechanism documented)
> **M2**: Implement JSONC parsing (Bun native + Node.js fallback package)
> **M3**: Implement schema generation from TypeScript types (with feature/pi separation, default-as-fill-in)
> **M4**: Implement the config loader with global/project overlay + default fill-in (feature + pi sections, extension registration)
> **M5**: Implement the CLI (`agentic-workflow config`) with `validate --sanitize` and `--no-warn-unknown`, `init` generates commented config
> **M6**: Implement the programmatic API (`ConfigApi` with `ConfigNode` and `category` field)
> **M7**: Migrate all existing config consumers to the unified loader
> **M8**: Update `init-workspace` to use the new config system
> **M9**: Document everything (human, API, CLI) — same format for all
> **M10**: Add notes to the issue about `.agentic-workflow/` internal structure and `pi-agentic-workflow-state.json` location evaluation (proposals, not implementation)

**S1a — owner correction: package-specific files and a plugin surface.**
> schema en agentic-workflow-schema
> La cli de configuración de agentic-workflow en agentic-workflow
> Lo que sea específico de pi-agentic-workflow en pi-agentic-workflow pero desde agentic-workflow como librería debe existir una forma de leer y definir parámetros y esquema personalizados para pi-agentic-workflow y debe poder cambiarse esa configuración usando bunx @gtrabanco/agentic-workflow, es decir debe existir un sistema de plugin o un equivalente al patrón strategy que ciertos archivos colocados donde se debe puedan ampliar ese esquema y dónde cambia la configuración @gtrabanco/agentic-workflow y así podamos tener una configuración agentic-workflow.json para agentic-workflow y otra pi-agentic-workflow.json para el paquete de pi en las partes específicas del paquete.

**S1b — owner correction: delivery.**
> delivery: entire issue M1–M10 in this session.

## Impact

- `packages/agentic-workflow-schema` gains the config machine contract, the
  JSONC parser, the fill-in resolver, the extension descriptor validator and the
  generated `config.schema.json`.
- `packages/agentic-workflow` gains `config` in the CLI surface, the store and
  the API, and depends on the schema package.
- `packages/pi-agentic-workflow` migrates its feature sections to the base file:
  `logSession` replaces `autoLogSession`, `memory`/`telemetry`/`guards`/
  `advance`/`pathProtection` leave the pi file, and routing/profiles/passes/
  subagents/stateFlow stay there as the `pi` extension section.
- `skills/init-workspace` offers the initializer; `AGENTS.md` gains the config
  policy; `docs/workflow/CONFIG.md` becomes the human guide.
- Consumers: the extension factory/loader, the settings console, the
  auto-log-session wiring, the telemetry wiring and the Engram provisioning all
  read the same `EffectiveConfig`; no consumer reads a file directly.
- Live surfaces: a real `~/.pi/agent/pi-agentic-workflow.json` from a previous
  install is now invalid (feature keys moved). `config validate` names each key;
  the migration table is in `docs/workflow/CONFIG.md`.

## Retirements

- `autoLogSession` (the `{ mode: "off"|"mechanical" }` block) is deleted from
  the config schema, types, merge and wiring; `logSession` replaces it. Pin:
  `rg -c 'autoLogSession' packages/pi-agentic-workflow/src` → 0.
- `AdvanceConfigFile`, `MemoryConfigFile`, `TelemetryConfigFile`,
  `AutoLogSessionConfigFile`, `AutoLogSessionPublisherFile` and
  `AUTO_LOG_SESSION_*` are deleted; the base schema owns those shapes.
- The hand-rolled feature validators in `pi/config/schema.ts`
  (`checkAdvance`, `checkPathProtection`, `checkTelemetry`, `checkMemory`,
  `checkAutoLogSession`, `checkAutoLogPublisher`) are deleted; the shared
  validator owns them.
- `mergeAdvance`, `mergeAutoLogPublisher` and the feature branches of
  `mergeConfigs` are deleted; the base resolver owns them.

## Non-goals

- Moving the retrieval index (`.agentic-workflow/index.json`) into the unified
  config; that is an M10 proposal, not this unit.
- Moving or versioning the `pi-agentic-workflow-state.json` state cache (runtime
  state, out of scope by the issue's own words).
- A web renderer for the docs.
- Backward compatibility for the old feature keys: the repository's
  no-backward-compatibility rule applies, and the migration table replaces it.

## Risk tier

- **Tier** — `standard` · **Task Size** — `standard` (understood, contained, resumable from diff)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

- `.agentic-workflow/index.json` and `pi-agentic-workflow-state.json` location
  proposals (M10) — `open`, deferred by the issue itself.

## Future cost

- A new base section must be added to `BASE_CONFIG_SECTIONS` and
  `config.schema.json` regenerated; the drift test fails otherwise.
- A package that adds an extension section must ship and version its
  `config-extension@1` descriptor and keep it in sync with its validator
  (`packages/pi-agentic-workflow/test/config-extension.test.mjs` is the model).

## Applicable tests

`bun test` in `packages/agentic-workflow-schema`,
`packages/agentic-workflow` and the config-related suites in
`packages/pi-agentic-workflow`; the generated-schema drift test; the CLI surface
test. The full `node scripts/run-root-suite.mjs` gate is the final check.

## Known pre-existing issues

- `settings-console.test.mjs` is slow in this environment (git-heavy fixtures;
  one test takes >15 s). `does-not-affect` the config contract; the suite was
  run in the background and its verdict is recorded in `## Log`.
- The worktree is registered under `.git/worktrees/feat-427-…`, so git's admin
  files appear untracked in the tree. `does-not-affect` the change; commits stage
  explicit paths only.

## Tasks

- P1 — Publish the shared config contract: JSONC parser, base section registry, strict validator, fill-in resolver, extension descriptor validator, generated `config.schema.json`. (validator: `bun test packages/agentic-workflow-schema/test/config-jsonc.test.mjs packages/agentic-workflow-schema/test/config-contract.test.mjs packages/agentic-workflow-schema/test/config-schema-artifact.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S12)
  Relevant files: packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/src/config-jsonc.ts, packages/agentic-workflow-schema/scripts/generate-config-schema.mjs
- P2 — Add the config CLI/API and the plugin discovery in `@gtrabanco/agentic-workflow`. (validator: `bun test packages/agentic-workflow/test/config-cli.test.mjs packages/agentic-workflow/test/cli.surface.test.mjs` exits 0)
  (Implements: S6, S7, S1a, S12)
  Relevant files: packages/agentic-workflow/src/config/api.mjs, packages/agentic-workflow/src/config/discovery.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P3 — Migrate the pi consumers to the base file and publish the `pi` extension section. (validator: `bun test packages/pi-agentic-workflow/test/config-extension.test.mjs packages/pi-agentic-workflow/test/auto-log-session-config.test.mjs packages/pi-agentic-workflow/test/default-inherit.test.mjs packages/pi-agentic-workflow/test/path-protection.test.mjs` exits 0)
  (Implements: S1, S10, S1a, S12)
  Relevant files: packages/pi-agentic-workflow/src/config, packages/pi-agentic-workflow/agentic-workflow.config.json
- P4 — Document the human/CLI/API surface, add the AGENTS.md config policy and offer the initializer from `init-workspace`. (validator: `bun scripts/check-skill-context.mjs` exits 0 and `bun scripts/workflow-docs-index.test.mjs` exits 0)
  (Implements: S8, S9, S11, S12)
  Relevant files: docs/workflow/CONFIG.md, AGENTS.md, skills/init-workspace/references/CONFIG.md
- P5 — Close the ledgers and run the verification gate. (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S12)
  Relevant files: docs/features/427-unified-config/

### Planning evidence

The ledger is [`planning-evidence.md`](planning-evidence.md) (M/L unit; not embedded).

### Obligations

The ledger is [`planning-obligations.md`](planning-obligations.md) (M/L unit; not embedded).

## Acceptance criteria

- **AC1 (S1)** — `BASE_CONFIG_SECTIONS` names exactly `logSession`, `memory`, `telemetry`, `guards`, `advance`, `pathProtection`; each carries its own JSON Schema and defaults. Proven by `config-contract.test.mjs` ("the base registry carries the feature sections the issue names").
- **AC2 (S1, S1a)** — a package publishes a section through a `config-extension@1` descriptor discovered from `package.json` or `config-extensions/`, and the same CLI edits that section's file. Proven by `config-cli.test.mjs` ("an installed package extends the schema and the same CLI edits its file").
- **AC3 (S2)** — defaults fill only undefined keys; a defined object is never deep-merged with its default. Proven by `config-contract.test.mjs` ("fillDefaults fills only undefined keys") and the resolution case.
- **AC4 (S3)** — JSONC accepts line/block comments, trailing commas and a BOM, keeps comment markers inside strings, and reports line/column on a syntax error. Proven by `config-jsonc.test.mjs`.
- **AC5 (S4)** — the committed `config.schema.json` is exactly the generator's output and names every base section. Proven by `config-schema-artifact.test.mjs` and `generate:config-schema --check`.
- **AC6 (S5)** — the pi loader resolves the base file and the pi file into one `EffectiveConfig`, project over global, and a broken file fails closed. Proven by `default-inherit.test.mjs` and `auto-log-session-config.test.mjs`.
- **AC7 (S6)** — `config get/set/list/show/validate/init/reset` runs against a throwaway project; a refusal exits 2 and writes nothing. Proven by `config-cli.test.mjs`.
- **AC8 (S7)** — the API is the CLI's engine (`createConfigApi`), every write validates first and `list` exposes path/type/category/default. Proven by `config-cli.test.mjs` ("list names every node…").
- **AC9 (S8)** — `AGENTS.md` states the config policy and links the owner. Proven by reading the section; `audit-docs` reads the documentation map.
- **AC10 (S9)** — `docs/workflow/CONFIG.md` documents the files, scopes, resolution, every section and default, the CLI/API and the extension contract. Proven by reading it; `workflow-docs-index.test.mjs` requires its row.
- **AC11 (S10)** — `autoLogSession` is gone from the pi package (`rg -c` → 0) and routing consumers read the pi file; feature consumers read the base file. Proven by the targeted pi suites.
- **AC12 (S11)** — `init-workspace` offers `config init` and refuses to hand-write a schema; the reference is linked. Proven by reading the skill and its reference.

## Triaged steps

`n/a — local unpublished workflow; the plan is this document plus the two planning ledgers.`

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #427
  ```
- **D1** — 2026-11-09, owner decision: the whole issue (M1–M10) in this session; the machine schema lives in `agentic-workflow-schema`, the CLI in `agentic-workflow`, and the pi section in `pi-agentic-workflow` through a discoverable plugin descriptor.
- **P1** — 2026-11-09, shared config contract landed · `2ee0b07e`.
- **P2** — 2026-11-09, config CLI/API and plugin discovery landed · `e47a81d0`.
- **P3** — 2026-11-09, pi consumer migration and extension section landed · `c1fc0b85`.
- **E1** — 2026-11-09, `bun test packages/agentic-workflow-schema` · exit 0 · 816 pass, 0 fail.
- **E2** — 2026-11-09, `bun test packages/agentic-workflow` · exit 0 · 595 pass, 0 fail.
- **E3** — 2026-11-09, targeted pi config suites (`config-extension`, `auto-log-session-config`, `default-inherit`, `path-protection`, `auto-log-session-wiring`, `shipped-adapter`, `telemetry-extension`, `telemetry-wiring`, `config-merge-*`) · exit 0.
- **E4** — 2026-11-09, `bun scripts/skill-lint.mjs` → PASS; `bun scripts/check-skill-context.mjs` → exit 0; `bun scripts/check-skill-context.mjs --documents` → PASS (4 documents); `bun test scripts/workflow-docs-index.test.mjs` → 5 pass; `rg -c 'autoLogSession' packages/pi-agentic-workflow/src` → no matches.
- **E5** — 2026-11-09, `bun run check:config-schema` (schema package) → `config.schema.json: current`, exit 0.
- **E6** — 2026-11-09, `bun test packages/pi-agentic-workflow/test/settings-console.test.mjs` → 59 pass before the process was killed by the environment (exit 137) during a git-heavy fixture; the config-affected `F4` case was not reached in that run and is re-run filtered in E7.
- **G1** — 2026-11-09, `bun scripts/run-root-suite.mjs --jobs 2` on `HEAD 52eaebbd` · exit 0 · 97 suite(s), 0 FAIL.

## Next

External verification of the branch by the owner; then the plan/fix-index/roadmap rows and the PR.

## References

Issue #427. Related soft: #201, #388. Blocked-by consumer: #470.
