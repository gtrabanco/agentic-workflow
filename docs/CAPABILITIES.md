# Capability inventory

> The maintained list of this project's **cross-cutting subsystems** and
> **roles** — the substrate the lane's `design` catalog step's *Integration
> closure* walks so no feature ships without deciding how it touches auth, ACL,
> navigation, and the rest. A model cannot reliably *guess* which subsystems
> your project has, but it can *walk a list* — this file is that list.
>
> **Ownership & lifecycle:** seeded by `init-workspace` (from discovery +
> interview); **extended by `execute-phase`** whenever a phase introduces a new
> subsystem, role, or permission (additive, in the same commit as the code);
> freshness-checked by `product-audit` (inventory ↔ code drift is a Process &
> docs finding); **read by the `design` catalog step** for every feature's
> Integration closure. Keep every row honest — a subsystem marked `no` is as
> load-bearing as one marked `yes` (it tells the designer what does NOT exist
> yet).
>
> **This project's type.** Markdown skills + a copyable documentation scaffold +
> deterministic Node scripts, published as three npm packages: no server, no UI,
> no request path. Every row below carries the path that proves its state (a
> `no` carries the surface inspected and found absent). Rows deleted because the
> project type cannot carry the surface — no question asked, per issue #333:
> `Navigation (menus, dashboard)`, `Notifications (email, push, in-app)`,
> `File / media storage`, `Billing / payments`.

## Roles

Every role/permission level the project has. The lane's `design` step role matrix
must list EVERY row here with an explicit `allowed`/`denied` per capability.
`Granted where` names the file or configuration that assigns the role.

| Role | Description | Granted where |
|---|---|---|
| Owner | The human merge, release and policy authority: approves merges, ratifies ledger verdicts, authorizes a published-history rewrite, and is the only party that may remove a hold label | `AGENTS.md` ("published history is owner-written") and the `human-owner` owner cell in `skills/pre-execution-review/references/LEDGERS.md` |
| Agent session | An agent run driving the workflow: works on a branch, commits, runs the gates, and hands the diff to the owner; may not force-push, merge, or remove a hold label | `AGENTS.md` working rules, enforced by `template/.agentic-workflow/hooks/` and `packages/agentic-workflow/src/path-policy.mjs` |

## Cross-cutting subsystems

One row per subsystem. `Exists` is `yes | partial | no` — never blank. `yes` and
`partial` carry the path that proves them; `no` carries the surface that was
inspected and found absent.

| Subsystem | Exists | Surfaces / entry points | Evidence |
|---|---|---|---|
| Authentication | no | — | Probe: `packages/agentic-workflow/bin/agentic-workflow.mjs` is a local CLI with no request path, and `packages/agentic-workflow-schema/package.json` declares no auth dependency; publishing authenticates through the forge's OIDC in `.github/workflows/publish.yml`, outside in-tree code |
| ACL / permissions | partial | Path guard, command guard | `packages/agentic-workflow/src/path-policy.mjs` (`evaluatePathGuard`, `PATH_GUARD_REASONS`) and `template/.agentic-workflow/hooks/`; no user-facing permission registry, because the project has no users |
| Search | yes | `agentic-workflow doc --query` | `packages/agentic-workflow/src/doc/` (index, embeddings, query) with the committed `.agentic-workflow/index.json`; the freshness hooks live in `template/.agentic-workflow/hooks/` |
| Audit log / activity trail | yes | `log-session`, a unit's `## Log`, gate receipts | `docs/LOGS.md` with `skills/log-session/SKILL.md`; per-unit receipts are the `GATE-RAN` / `R` / `V` marks in `skills/pre-execution-review/references/LEDGERS.md` |
| Settings / preferences | partial | Committed project configuration | `.agentic-workflow/index.json` (retrieval index config) and `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (context ceilings); no user-scoped preferences store |
| Background jobs / scheduling | partial | Git hooks, CI | `template/.agentic-workflow/hooks/` (`index-sync.sh` on post-merge, post-checkout and post-rewrite) and `.github/workflows/root-suite.yml`; no queue and no worker |
| i18n / localization | no | — | Probe: no locale file exists, and `AGENTS.md` states the documentation language is English-only permanently (the bilingual `.es.md` siblings were removed repo-wide) |
| Feature flags | no | — | Probe: release channels (`canary`, stable) are publish tags driven by `.github/workflows/publish.yml`, not runtime flags — no flag store, and no flag read at a decision point |
| Public API / integrations | yes | Three published npm packages, the skills manifest | `packages/agentic-workflow/package.json`, `packages/agentic-workflow-schema/package.json` and `packages/pi-agentic-workflow/package.json`; `skills.sh.json` plus `.claude-plugin/plugin.json` publish the skills surface |
| Skills distribution | yes | `npx skills add gtrabanco/agentic-workflow` | `skills/` is the installable source, `skills.sh.json` its manifest, and `packages/pi-agentic-workflow/package.json` the packaged copy |
| Scaffold export | yes | `npx degit gtrabanco/agentic-workflow/template` | `template/`, copied verbatim by `skills/init-workspace/SKILL.md`; a bootstrapped project is born on it |
| Deterministic gates | yes | `node scripts/run-root-suite.mjs` | `scripts/`, where every gate ships its sibling suite, wired into CI by `.github/workflows/root-suite.yml` |
