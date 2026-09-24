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

Map the stack detection signal from Step 0 to the Serena `language_servers`
entry. Every detected language must be listed — a repo can need several:

| Detected | Entry |
|---|---|
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

After activation, confirm the language server initialised by asking Serena
for the project status and verifying `Language server status: initialized` for
every language in `language_servers`. If it did not, say so and record it as a
residual. **Never claim LSP evidence for a run whose server never started.**

## LSP is for code, not for docs

Verified 2026-09-24: with no markdown/yaml/json server configured, a diagnostic
request for a `.md` / `.yml` / `.json` file comes back as **TypeScript false
positives** (the only available server is used as a fallback). So document
verification is a deterministic script's job, never LSP.

## Tool install is a different step

This file owns the **project config**, not the tool. If Serena is not installed,
offer the install (ask-first; `uv`/`uvx` preferred, `pipx` fallback) or record
it as a residual. The install half is tracked by #219.

## Degraded path

Serena unavailable → warn once, continue, and record the absence in the unit's
evidence. **Never block a run on it.**
