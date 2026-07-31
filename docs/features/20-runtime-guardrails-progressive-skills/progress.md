# 20 — runtime-guardrails-progressive-skills · progress

Last reviewed: —

## P1 — 2026-07-31
- Done: Added the canonical command/path guard, four platform adapters/config examples, transient fullauto wrapper, and shell fixtures.
- Remains: P2 — Fullauto policy
- Gotchas: Direct merges have no allow marker; fullauto enters through the wrapper. Hook payload adapters require `jq`, while the OpenCode adapter calls the canonical policy through Bun.
- Files: template/.agentic-workflow/hooks/, template/.claude/, template/.cursor/, template/.github/hooks/, template/.opencode/plugins/, docs/features/20-runtime-guardrails-progressive-skills/
- Next: P2 — Fullauto policy

## P2 — 2026-07-31
- Done: Made audit-pr verdict-only, made active ship-roadmap fullauto the sole automated merge authority, added transient/comment requirements, and integrated opt-in hook installation into bootstrap/upgrade.
- Remains: P3 — Context distribution
- Gotchas: The wrapper is a deterministic accidental-action tripwire, not caller authentication; forge rulesets remain the hard boundary. Major migration notes supersede audit-pr's historical standalone auto-merge policy.
- Files: skills/audit-pr/SKILL.md, skills/ship-roadmap/SKILL.md, skills/init-workspace/SKILL.md, template/CLAUDE.md, template/.agentic-workflow/hooks/README.md, README.md, README.es.md, CHANGELOG.md, CHANGELOG.es.md, docs/workflow/, docs/features/20-runtime-guardrails-progressive-skills/
- Next: P3 — Context distribution

## P3 — 2026-07-31
- Done: Added skills.sh groups, Claude marketplace metadata, conservative product-audit manual-invocation metadata, and deterministic context/reference budgets.
- Remains: P4 — Progressive loading
- Gotchas: skills.sh and marketplace files affect discovery/distribution only. The byte/4 metric is a stable regression proxy, not a claim about provider billing tokens.
- Files: skills.sh.json, .claude-plugin/marketplace.json, scripts/check-skill-context.mjs, docs/workflow/SKILL_CONTEXT_BUDGETS.json, skills/product-audit/SKILL.md, README.md, README.es.md, CHANGELOG.md, CHANGELOG.es.md, docs/features/20-runtime-guardrails-progressive-skills/
- Next: P4 — Progressive loading

## P4 — 2026-07-31
- Done: Split all eight budgeted skills into compact activation cores and explicit one-hop route resources; retained universal turn, safety, NRS, invariant, portability, and handoff contracts in the entrypoints; synchronized bilingual context guidance and version history.
- Remains: P5 — Hardening & PR
- Gotchas: Route resources are normative and fail closed when missing. The byte/4 result measures direct activation, not every conditional resource a long workflow may legitimately load later.
- Files: skills/execute-phase/, skills/ship-roadmap/, skills/workflow-status/, skills/review-change/, skills/audit-pr/, skills/triage-issue/, skills/design-feature/, skills/init-workspace/, docs/workflow/SKILLS.md, docs/workflow/SKILLS.es.md, README.md, README.es.md, CHANGELOG.md, CHANGELOG.es.md
- Next: P5 — Hardening & PR
