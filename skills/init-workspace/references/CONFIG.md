# Unified config — what this skill offers, and what it never writes

> Owner of the machine contract: `@gtrabanco/agentic-workflow-schema`
> (`config.schema.json`). Owner of the CLI/API: `@gtrabanco/agentic-workflow`.
> This page is the init-workspace checklist; it restates no schema.

## The two files, two scopes

An agentic-workflow install reads two files at each scope:

| File | Owner | Holds |
|---|---|---|
| `agentic-workflow.json` | the framework | cross-tool feature sections: `logSession`, `memory`, `telemetry`, `guard`, `gitIdentity`, `advance`, `pathProtection`, `contentGuard`, `batchScheduler` |
| `pi-agentic-workflow.json` | the `pi-agentic-workflow` package | package-internal section: routing, profiles, passes, subagent limits, State Flow, shell-tool choice |

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
runner config init --scope project
```

The command writes a commented `.pi/agentic-workflow.json` whose every value is
a comment, so the file starts at the shipped defaults. It refuses to overwrite.
On no, write nothing and record the residual; the CLI still resolves defaults.

For a package-specific section, the owner is the package, not this skill:

```bash
runner config set pi.model.default provider/model-id --scope project
```

(Replace `model.default` with the path `config list` prints; the pi package
publishes its own section.)

## Materializing the explicit defaults (one consented question)

The bank's `CFG-01` row owns why this is asked; this section owns how it runs.
After `config init`, and again on an existing install whose files drifted, ask
**one** consented question, worded so the answer is informed:

> Every tunable option currently lives in code as a default, so your config file
> shows only what you wrote. Materializing writes **every** option into
> `.pi/agentic-workflow.json` (project) and the agent directory's
> `agentic-workflow.json` (global), each with its shipped default and an English
> comment that documents it. Values you already set are preserved; an option you
> left undefined gains its default; an option the schema no longer declares is
> dropped — after the existing file is copied to `<file>.bak-<timestamp>`.
> Materialize the defaults now?

The answer runs the package's own engine — never a hand-written file:

```bash
runner config default [--scope global|project|both]
```

- **Yes** ⇒ run it, print the receipt (files written, keys materialized, keys
  removed, backup paths) and let the project's `CFG-01` answer record the
  posture.
- **No** ⇒ writes nothing and records the residual; the defaults still resolve in
  code, so the project loses no behaviour. Nothing rewrites config in the
  background: the operator, this question, the console, or a `doctor` advisory
  is what starts a run.

## The lane vocabulary (one consented question)

Ask where the project plans parallel work, and only when the answer is not
already declared:

> Which directories are this project's parallel lanes — the trees two units can
> work in at the same time? (For a web app that is usually `src/pages`,
> `src/shared`, `migrations`; leave it empty and the scheduler uses the
> directories your tree already carries.)

The answer is written by the CLI, never by hand — one project-relative
directory per entry:

```bash
runner config set batchScheduler.surfaces '["src/pages","src/shared","migrations"]' --scope project
```

- **Answered** ⇒ the value is the project's vocabulary. Every key a unit
  declares must be one of those directories (or a directory under one), and a
  tree the list omits resolves to nothing rather than silently opening a lane.
- **Empty** ⇒ write nothing: the scheduler recognizes the trees this workflow
  ships with and discovers the project's own top-level directories, so an
  unconfigured project still schedules in parallel lanes (coarser ones). The
  emitter's stderr advisory is what names the line to run later.
- **Never** invent a lane key in a unit doc or issue body to compensate: the
  vocabulary is this key, and the owner of its meaning is
  `skills/batch-scheduler/references/PLAN.md` § The surface vocabulary.

## Verification

```bash
runner config validate --scope both
```

Exit 0 is clean; exit 2 lists every issue by path. `--sanitize` removes unknown
keys and `--no-warn-unknown` silences only the unknown-key class — neither is a
default, and init-workspace never passes either without an explicit ask.

## New feature config

The policy for adding a section (triage, scope, schema, defaults, docs,
init-workspace offer, changeset, roadmap) lives in the repository's own
`AGENTS.md`; this skill reads it from the target project and never restates it.
