# 20 — runtime-guardrails-progressive-skills · progress

Last reviewed: —

## P1 — 2026-07-31
- Done: Added the canonical command/path guard, four platform adapters/config examples, transient fullauto wrapper, and shell fixtures.
- Remains: P2 — Fullauto policy
- Gotchas: Direct merges have no allow marker; fullauto enters through the wrapper. Hook payload adapters require `jq`, while the OpenCode adapter calls the canonical policy through Bun.
- Files: template/.agentic-workflow/hooks/, template/.claude/, template/.cursor/, template/.github/hooks/, template/.opencode/plugins/, docs/features/20-runtime-guardrails-progressive-skills/
- Next: P2 — Fullauto policy
