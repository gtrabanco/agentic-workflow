# 20 — runtime-guardrails-progressive-skills · architecture-notes

| Concern | Owner | Rule |
|---|---|---|
| Normalized policy | `.agentic-workflow/hooks/guard-command.sh` | one allow/block implementation; no platform payload parsing |
| Platform payloads | thin adapters | extract command/path and translate the normalized result only |
| Automated merge | fullauto wrapper + `ship-roadmap` | no direct merge exception; forge-derived PR/head/base/audit evidence, transient, SHA-bound, fail-closed |
| Merge verdict | `audit-pr` | read-first verdict and PR comment; never merge |
| Skill activation | main `SKILL.md` | universal contract and deterministic route table only |
| Conditional detail | `references/*.md` | one hop, explicitly loaded by route, no nested references |
| Context enforcement | `scripts/check-skill-context.mjs` | committed budgets and resource-link integrity |
| Distribution | plugin/marketplace/skills.sh manifests | presentation and installation only; no runtime-policy claim |

No root project architecture or invariant document exists; this feature adds no
application runtime layer.
