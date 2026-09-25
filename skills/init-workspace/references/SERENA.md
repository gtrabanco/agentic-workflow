## Why this step exists

LSP-backed navigation and verification must actually work. A project-local
`.serena/project.yml` that pins the wrong `language_servers` silently disables
the server, and every symbol call then times out with
`Language server status: not initialized` (verified 2026-09-24 in this
repository).

## The convention this file owns

- `.serena/project.yml` is **committed** to version control (the project's
  config, not a dev-local override).
- `.serena/project.local.yml` and `.serena/cache/` stay local (tool-internal
  state).
- The target's `.gitignore` must therefore ignore every `.serena` tree **except
  the root `project.yml`** — the block below enforces that.

## What to write into the target .gitignore

When the target's `.gitignore` does not already contain the block below, append
it (additive only — see rules below):

```text
# Ignore every .serena tree (tool-local state); version ONLY the root project
# config. Serena's own .serena/.gitignore keeps cache and per-dev overrides local.
**/.serena/
!.serena/
.serena/*
!.serena/project.yml
```

**Rules:**

- **Additive only** — append the block when it is absent.
- If the target already ignores `.serena` wholesale (e.g. `.serena/` without
  an `!` carve-out), **propose the narrowing** and apply it **only with consent**.
- **Never rewrite unrelated lines.** Only touch the `.serena` block.
- **Idempotent** — skip when the exact block (all four lines) is already
  present.

## Language servers for the detected stack

Write language servers in this order: **fixed entries first** (always written,
regardless of the target), then **detected entries** (from Step 0 signals).

### Fixed entries — always written

| Entry | Why always |
|---|---|
| `markdown` | Every scaffolded project has `docs/` and `.md` files (this workflow's own documentation is Markdown) |
| `json` | Manifests and tool config (`package.json`, `tsconfig.json`, settings) exist in nearly every stack |

### Never auto-detected rule

**`markdown`, `yaml`, and `json` are never auto-detected by Serena — they must
appear in `language_servers` explicitly, or requests for those file types fall
back to another server and produce false positives** (e.g. TypeScript diagnostics
on a `.yml`). Every server listed above (and `yaml` when `.yml`/`.yaml` files
are present) is explicit-only.

### Detected entries — append when present

| Detected | Entry |
|---|---|
| `.yml` / `.yaml` files present (CI workflows, config) | `yaml` |
| `package.json` / `tsconfig.json` (TypeScript or JavaScript) | `typescript` |
| `pyproject.toml` / `requirements.txt` | `python` |
| `go.mod` | `go` |
| `Cargo.toml` | `rust` |
| `pom.xml` / `build.gradle` | `java` |
| `Gemfile` | `ruby` |
| `composer.json` | `php` |
| `CMakeLists.txt` / `Makefile` (C/C++) | `cpp` |
| `.csproj` / `.sln` | `csharp` |
| shell-dominant repo (`*.sh` prevalent) | `bash` |

The authoritative list of valid values is Serena's own `ls_config.py`
(`LanguageServerId`). An id Serena does not know about is silently ignored by
Serena — **the health check below is what proves the list is correct.**

## Ask first

Never write `.serena/` or `.gitignore` without an explicit yes, and report
exactly what was written. (This matches the skill's existing installation-consent
rule.)

## Health check — fail closed at the claim

After activation, confirm **each listed server** initialised by asking Serena
for the project status and verifying `Language server status: initialized` for
every language in `language_servers`. If a server did not initialise, the
check names the offending entry. Removing a failing entry (per the startup
rule below) is the correct remediation — never leave a dead entry in the file.
**Never claim LSP evidence for a run whose server never started.**

### Startup rule (critical)

> **A server that fails to start must not stay listed.** One failing entry
> disables the whole language-server manager — every symbol call for the
> project then fails with `Language server manager is not initialized`.
> After writing the config, the health check must confirm **every** listed
> server started; any entry that fails is removed from `language_servers`
> and recorded as a residual with its exact error (e.g. `markdown`: marksman
> needs the system `libicu` package).

## When a server is missing or fails

`markdown`, `yaml`, and `json` servers exist but are explicit-only and
experimental: they must be listed by hand or requests fall back and produce
false positives.

- **Missing (not listed)** → fallback server answers → false positives for that
  file type (e.g. TypeScript diagnostics on a `.yml`).
- **Failing (listed but broken)** → whole manager down → every symbol call
  fails with `Language server manager is not initialized`. Remediation: remove
  the entry from `language_servers` and record the residual (e.g. `markdown`:
  marksman needs the system `libicu` package).

Document verification (schema rules like required sections/columns) stays a
deterministic script's job regardless — LSP serves navigation and diagnostics,
not our document grammar. `node`+`npm` are required for json/yaml; `libicu` is
required for marksman.

## Tool install is a different step

This file owns the **project config**, not the tool. If Serena is not installed,
offer the install (ask-first; `uv`/`uvx` preferred, `pipx` fallback) or record
it as a residual. The install half is tracked by #219.

## Degraded path

Serena unavailable → warn once, continue, and record the absence in the unit's
evidence. **Never block a run on it.**
