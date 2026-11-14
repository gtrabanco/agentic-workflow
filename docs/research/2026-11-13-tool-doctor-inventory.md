# Tool doctor inventory — what a deterministic setup/wizard can check

**Date:** 2026-11-13 · **Method:** code-level spike against the installed `gentle-engram`
extension (v0.7.0), the `@gtrabanco/pi-agentic-workflow` extension sources
(`src/extension/engram.ts`), `scripts/setup-env.mjs`, the crate's
`src/resources/` module, and the `init-workspace` skill references.
**Feeds:** the "deterministic tool doctor + setup wizard in the CLI" feature
issue (chain: #352 → #424 → this) and the engram startup-report semantics fix.

## The delimitation rule

**Generic = everything observable without a live agent session: files,
binaries, HTTP endpoints, `git config`, git hooks.** pi-specific = everything
depending on **session semantics** (store ownership, caller binding, write
attribution) or on **maintainer-curated pairing knowledge** (companion ↔ core
versions). Instruct-only = what belongs to the operator's shell or the host's
own package manager.

The 2026-11-13 engram incident proves the line: "binary 3.7.1 vs served 3.6.0"
is generic (two `--version` probes plus `GET /health` — any CLI can do it),
while the *ownership mismatch* guard (WSL2 shared-loopback, foreign server that
is never adopted nor killed) is pi-specific — it lives in the extension because
only the extension knows *when* and *why* to ask. The generic doctor detects
the symptom; the domain owner interprets the context.

## Inventory

| # | Surface | Generic check (evidence) | pi-specific part | Provision route |
|---|---|---|---|---|
| 1 | node | version probe; gate `engines >=24` (crate package.json) | — | instruct-only (S11: operator prerequisite) |
| 2 | bun | version vs committed `.bun-version` pin | — | curl installer, opt-in (S11 asks) |
| 3 | rg | presence + version — **gap**: `setup-env.mjs` does not check it, yet AGENTS.md orders "check availability once per session, never assume" | — | instruct-only |
| 4 | git | version, `user.name`/`user.email` configured | — | instruct-only |
| 5 | gh | version + `gh auth status` | — | `gh auth login`, instruct-only |
| 6 | serena | binary (`uv tool install -p 3.13 serena-agent` — not npm: the extensibility case), `.serena/project.yml` `language_servers` (parse logic already exists: `pi-agentic-workflow/src/routing/serena-readiness.ts`), `project.local.yml` | project semantics stay with pi | `uv tool install` |
| 7 | engram binary | `ENGRAM_BIN`/PATH resolution + `--version` | — | brew (macOS) / GitHub releases tarball / `go install` — three routes, hardcoded today in `setup-env.mjs` (brew only) |
| 8 | engram server | `GET /health` → version + status; **binary-vs-served version pair** (gap that caused the 2026-11-13 incident) | ownership: `engram instance-id` + local/remote comparison + foreign-server guard (extension-only, `index.ts` `initializeEngramServer`) | `engram run -d` |
| 9 | gentle-engram companion | pin read from pi `settings.json` (via `PI_CODING_AGENT_DIR`) | **the companion↔core pair is curated, not derivable** (0.7.0 ↔ 3.7.1 per the README) — a maintainer-owned product surface the issue must locate | `pi install npm:gentle-engram@latest` |
| 10 | pi host | `~/.pi/agent` context, installed npm packages | PI WEB daemon: **out of scope** (repo rule: never touch the hosting daemon) | — |
| 11 | agent adapters | read-only scan of each adapter's MCP config/settings (Claude Code, Cursor, Copilot, OpenCode — init-workspace's named adapters) | init-workspace's never-overwrite write rules | consented writes remain skill-owned |
| 12 | hooks / merge drivers | `.git/hooks/pre-push` present; `git config merge.<class>.driver` for the four shared-document classes + `docs-generated` | — | installed by init-workspace, **verifiable by the doctor** |
| 13 | skills CLI | `npx skills add . --list` | — | authoring-only, already gated in this repo |

## Crate precedent the doctor should follow

`packages/agentic-workflow/src/resources/detect.mjs`: read-only module, own
contract id (`resources-detect@1`), injectable probes (tests never depend on
the host), zero dependencies. A doctor module is its twin (`doctor@1`), and its
vocabularies can live in the crate itself as `schema-export` constants —
precedent: `PATH_GUARD_REASONS` in `src/path-policy.mjs`, already named by
`normative-surfaces@1`.

## Gaps the spike surfaced (the feature's motivation, concretely)

1. **rg is assumed, never checked** (row 3) despite the tool-choice rule.
2. **Engram binary-vs-server version pair unchecked** (row 8) — the exact
   failure that occurred on 2026-11-13 (3.6.0 server running from a deleted
   binary inode).
3. **Hooks and shared-merge drivers degrade silently when un-armed** (row 12).
4. **Install routes are hardcoded per tool** (`setup-env.mjs` consts) instead of
   a closed, extensible `install-route` vocabulary (npm/bun · pip/uv · brew ·
   single binary · instruct-only) — serena and engram prove npm is not enough.

## Decisions the SPEC must take (not invented here)

- Mode contract: `doctor`/`--check` read-only, exit codes 0/1 with never-failing
  warnings (reuse `setup-env.mjs` semantics); the mutating wizard only in TTY,
  consent one decision per question; instruct-only items carry the exact
  command to copy and are re-verified by the same checker afterwards.
- Where `setup-env.mjs` lives after #352's migration (repo-own scribe keeps its
  "repo-own dev/CI checks only" end state — but its checks may migrate into the
  doctor).
- The companion↔core pairing table: home, owner, update procedure.
- Sustitutibility of third-party tools (memory provider, search, LSP) by user
  preference via the unified config (#427's four questions) — deferred,
  recorded as a future decision, not part of this feature.
