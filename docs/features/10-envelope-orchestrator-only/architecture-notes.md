# 10 — envelope-orchestrator-only · architecture-notes

Layer impact, surfaces touched, invariants.

## Layer

Docs/skills layer only. No runtime code, no schema, no bindings. The change is
text edits to `SKILL.md` files and `docs/workflow/*.md`, plus release metadata.

## Surfaces touched

- **Stripped (envelope section + turn-contract box removed), 14 files:**
  `skills/{audit-docs, audit-pr, bump-skill, design-feature, execute-phase,
  generate-docs, init-workspace, log-session, plan-feature, plan-fix,
  product-audit, review-change, ship-roadmap, triage-issue}/SKILL.md`.
- **Extended (contract home):** `skills/orchestration-envelope/SKILL.md`,
  `docs/workflow/ORCHESTRATION.md`, `docs/workflow/PORTABLE_PROMPT.md`.
- **Metadata:** `CHANGELOG.md`, `CHANGELOG.es.md`, `README.md`, `README.es.md`
  (via `bump-skill`); `docs/workflow/MIGRATION.md` (new entry).
- **Untouched (invariants):** `skills/workflow-status/SKILL.md` (keeps its
  envelope section — AC3); `packages/agentic-workflow-schema/**` (frozen — AC8).

## Invariants the implementation must hold

1. Exactly one skill still emits the envelope inline: `workflow-status`.
2. The envelope schema is unchanged; the npm package is untouched.
3. After the strip, the closing `→ Next:` block is the last output of every
   stripped skill's turn (no trailing JSON obligation).
4. The contract has a single authoritative home (orchestration layer) — no skill
   redefines it, and no stripped skill points at a section it no longer has.

## Why the ordering (P1 before P2)

The contract is added to its new home (P1) before it is removed from the skills
(P2) so it is never momentarily undocumented. Metadata (P3) follows the content
change; hardening (P4) sweeps for dangling references the mechanical strip could
leave behind.
