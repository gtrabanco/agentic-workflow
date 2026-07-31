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

## P5 — 2026-07-31
- Done: Hardened route selectors and semantic reference boundaries from the initial weak-model failure; passed the final hook, context, manifest, authoring, discovery, and Qwen3 golden gates; opened PR #116 and linked it from the roadmap.
- Remains: Fresh-context mandatory final review; no merge was attempted.
- Gotchas: The initial Qwen3 probe is retained as FAIL immediately before the superseding PASS. Hooks remain defense-in-depth and the user's external OpenCode configuration was not edited.
- Files: scripts/check-skill-context.mjs, docs/workflow/GOLDEN_FIXTURE.md, docs/workflow/GOLDEN_FIXTURE.es.md, docs/features/20-runtime-guardrails-progressive-skills/, docs/features/ROADMAP.md
- Next: `/review-change` in a conversation that did not implement this PR

## Replan P6–P8 — 2026-07-31
- Reason: the independent review retained fullauto authority, adapter, context-checker, and workflow findings that cannot be folded safely as one-off fixes.
- Decision: the user confirmed P6 and P7; because P5 has already completed, P8 is a fresh mandatory `Hardening & PR` phase.
- Scope: P6 owns the fullauto authority boundary; P7 owns adapter/context-guard closure; P8 owns tree synchronization, the user-approved history repair, and the final adversarial review/audit gate.
- Remains: P6 — Fullauto authority boundary.
- Next: `/execute-phase 20 P6`.

## P6 — 2026-07-31
- Done: Bound fullauto authorization to the current forge PR head, default base, SHA-bound audit comment, and decision file fetched from that head; expanded direct-merge blocking to interpreter wrappers and added negative authority fixtures.
- Remains: P7 — Adapter and context-guard closure
- Gotchas: Fullauto now fails closed when the forge exposes no CI checks; the wrapper accepts only PR number and run ID, and the audit comment must match the current head SHA.
- Files: template/.agentic-workflow/hooks/fullauto-merge.sh, template/.agentic-workflow/hooks/guard-command.sh, template/.agentic-workflow/hooks/tests/test-command-guard.sh, template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh, skills/ship-roadmap/SKILL.md, skills/ship-roadmap/references/AUDIT_AND_MERGE.md, skills/ship-roadmap/references/ADVANCE.md, skills/audit-pr/SKILL.md, docs/features/20-runtime-guardrails-progressive-skills/
- Next: P7 — Adapter and context-guard closure

## P7 — 2026-08-01
- Done: Corrected the OpenCode adapter to use plugin-context `worktree`, rejected nested files and directories below skill `references/`, expanded checker CLI fixtures for `--manifest-only` and bare `--skill`, and reconfirmed progressive-route budgets.
- Remains: P8 — Hardening & PR
- Gotchas: The OpenCode fixture now passes context at plugin initialization; the runtime event still supplies tool and argument data through the hook input/output pair.
- Files: template/.opencode/plugins/agentic-workflow-guard.ts.example, template/.agentic-workflow/hooks/tests/test-opencode-guard.sh, scripts/check-skill-context.mjs, scripts/check-skill-context.test.mjs, docs/features/20-runtime-guardrails-progressive-skills/
- Next: P8 — Hardening & PR

## P8 — 2026-08-01
- Done: Reconciled F38 (tree clean and synced; only the nine feature skills differ from `origin/main`), resolved F39 (scoped reword `39dc7a9` on the branch and pushed), and passed the full verification set: hook fixtures (command 6/27, fullauto cleanup + idempotent comment, opencode allow/block), context checker and tests (31 skills, depth 1), manifest `JSON.parse` on all three manifests, `npx skills add . --list` (30 skills), and `git diff --check` on both the branch diff and the worktree.
- Remains: F40 — adversarial review, fold any fix-now findings, and `/audit-pr` merge gate.
- Gotchas: The OpenCode fixture context arrives at plugin init; runtime events flow through the hook input/output pair.
- Files: docs/features/20-runtime-guardrails-progressive-skills/
- Next: P8 — adversarial review and audit-pr gate (F40)
