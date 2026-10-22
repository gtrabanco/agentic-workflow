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

The report's `health:` line carries one entry per listed server. When the check
cannot run at all — no tool, no installer, or a refused consent, including a
refused **trust** append (§Trust) — it says so once, on that line, with the
reason, instead of reporting a pass: an absent check is a residual, never a
silent pass.

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

## Provisioning the tool — one consented question

This file owns the **project config** *and* the tool that reads it. The install
half (`#219`) lands here as one step, never a second interview.

**Order inside the step (fixed):**

1. **Detect what can be performed** — `uv --version` first, then `pipx
   --version`. Never offer a route the machine cannot run.
2. **Ask ONCE**, with the whole set in the question: the tool install, the MCP
   registration for **the detected platform only**, and the global trust append
   when the project root is not covered. One yes covers the set the question
   names; a narrower yes narrows the set.
3. **On yes** — install, register, append trust, then report exactly what
   happened (§Report).
4. **On no** — install nothing, register nothing, write nothing. Record the
   absence as a residual with its reason and finish; the run still completes.

**Install routes, in the order tried:**

| Route | Command | When |
|---|---|---|
| preferred | `uv tool install -p 3.13 serena-agent`, then `serena init` | `uv` is on PATH |
| fallback | `pipx install serena-agent`, then `serena init` | `uv` absent, `pipx` present — **MCP path only** |

`serena init` creates the global `serena_config.yml` when absent and never
rewrites an existing one. `serena -V` prints `Serena <version>`: that is the
health reader, and the only proof the tool runs.

### MCP registration — the detected platform, its own shape

Register **one** server named `serena`, in the config file of the platform
Step 0 detected. Never write a cross-platform blob, and never write a second
platform's file "to be safe". A per-workspace file (`.vscode/mcp.json`,
`.cursor/mcp.json`) needs the same consent as the rest; a global one
(`~/.codex/config.toml`, the JetBrains `mcp.json`) is append-only — the one
entry, never another line.

| Detected | Where | Entry |
|---|---|---|
| Claude Code | `claude mcp add serena -- serena start-mcp-server --context claude-code --project "$(pwd)"` (user scope: `--scope user`, `--project-from-cwd`) | command `serena` |
| Copilot / VS Code | `.vscode/mcp.json` → `servers.serena` | `{"type":"stdio","command":"serena","args":["start-mcp-server","--context=vscode","--project","${workspaceFolder}"]}` |
| Cursor | `.cursor/mcp.json` → `mcpServers.serena` | `{"command":"serena","args":["start-mcp-server","--context=ide"]}` |
| JetBrains Copilot | the global `mcp.json` Copilot opens | `{"type":"stdio","command":"serena","args":["start-mcp-server","--context=jb-copilot-plugin"]}` |
| Codex | `~/.codex/config.toml` → `[mcp_servers.serena]` | `command = "serena"`, `args = ["start-mcp-server","--project-from-cwd","--context=codex"]` |

### Trust — the fresh clone (global config, consent-gated)

`trusted_project_path_patterns` lives in the user's **global** `serena_config.yml`,
not the project's `.serena/project.yml`, and a fresh config defaults it to `[]`.
A project root no pattern covers starts no language server, so the health check
fails with nothing in the project to blame.

- **Detect** — read the global config, test this project root against the
  patterns.
- **Offer the append inside the same consented question.** This file is shared by
  every project on the machine, so it is never written implicitly.
- **On yes** — append **one pattern naming this project root**. Never rewrite,
  reorder or reformat any other line; an append is the only permitted edit.
- **On no** — record the untrusted state as the health-check residual. It is a
  residual, not an error, and it never blocks the run.

### Report — exactly what happened

Close the step with this fixed block. "Installed" is never assumed and never
reported from the intent to install:

```text
SERENA PROVISIONING
tool:      <installed | already present | refused | no installer | failed: <reason>>
version:   <serena -V output, or n/a>
mcp:       <registered <platform> -> <path> | already present | refused | failed: <reason>>
trust:     <appended <pattern> | already covered | refused - untrusted | n/a>
config:    <written .serena/project.yml | already present | skipped: <reason>>
health:    <one line per listed server, see below>
residual:  <none | the reason this run is degraded>
```

## Degraded path

Serena unavailable — no tool, no installer (`uv`, `pipx`), or a refused consent —
→ warn once, continue, and record the absence with its reason in the unit's
evidence. **Never block a run on it**, and never let a degraded run read as a
healthy one: the report says which line is missing and why.

LSP evidence itself stays confined to **TypeScript/JavaScript**: a diagnostic
from any other listed server is navigation aid, never verification evidence, and
no claim may cite it. Document verification (schema rules, required sections,
column counts) stays a **deterministic script's** job regardless — LSP serves
navigation, not our document grammar.
