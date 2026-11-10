# Unified config — what this skill offers, and what it never writes

> Owner of the machine contract: `@gtrabanco/agentic-workflow-schema`
> (`config.schema.json`). Owner of the CLI/API: `@gtrabanco/agentic-workflow`.
> This page is the init-workspace checklist; it restates no schema.

## The two files, two scopes

An agentic-workflow install reads two files at each scope:

| File | Owner | Holds |
|---|---|---|
| `agentic-workflow.json` | the framework | cross-tool feature sections: `logSession`, `memory`, `telemetry`, `guards`, `advance`, `pathProtection` |
| `pi-agentic-workflow.json` | the `pi-agentic-workflow` package | package-internal section: routing, profiles, passes, subagent limits, State Flow |

- Global scope: `~/.pi/agent/` (the host's agent directory, never hardcoded).
- Project scope: `.pi/` in the project root.
- Project overrides global; shipped defaults fill only keys the operator left
  undefined. Both files are JSONC (comments and trailing commas allowed).
- A package can publish another extension file instead of `pi-agentic-workflow.json`
  by shipping a `config-extension@1` descriptor and naming it from its
  `package.json` under `agenticWorkflow.config`. init-workspace never invents one.

## What init-workspace offers

Ask one consented question: **“Create the project config file now?”**. On yes,
run the package's own initializer — never hand-write the file:

```bash
bunx @gtrabanco/agentic-workflow config init --scope project
```

The command writes a commented `.pi/agentic-workflow.json` whose every value is
a comment, so the file starts at the shipped defaults. It refuses to overwrite.
On no, write nothing and record the residual; the CLI still resolves defaults.

For a package-specific section, the owner is the package, not this skill:

```bash
bunx @gtrabanco/agentic-workflow config set pi.model.default provider/model-id --scope project
```

(Replace `model.default` with the path `config list` prints; the pi package
publishes its own section.)

## Verification

```bash
bunx @gtrabanco/agentic-workflow config validate --scope both
```

Exit 0 is clean; exit 2 lists every issue by path. `--sanitize` removes unknown
keys and `--no-warn-unknown` silences only the unknown-key class — neither is a
default, and init-workspace never passes either without an explicit ask.

## New feature config

The policy for adding a section (triage, scope, schema, defaults, docs,
init-workspace offer, changeset, roadmap) lives in the repository's own
`AGENTS.md`; this skill reads it from the target project and never restates it.
