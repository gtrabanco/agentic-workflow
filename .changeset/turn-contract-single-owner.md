---
"@gtrabanco/pi-agentic-workflow": patch
---

feat(skills): single-owner turn contract — every skill loads the canonical one (issue #173)

The canonical turn contract declared "Single owner — all skills load this +
skill-specific additions only. Duplication forbidden", while 14 skills carried
their own inline `## Turn contract` sections; several duplicated boxes the
canonical file owns (the docs-language rule, the closing `→ Next:` block) and
the read-only skills contradicted its commit/push/PR boxes outright — the
independently-maintained-copy drift the rule exists to prevent.

Every skill's `## Turn contract` now loads the canonical contract and carries
only its own additions. The canonical file gains a **read-only profile** that
substitutes boxes 1–5 for skills that edit nothing (the sensors, the
report-only lints, the merge-owning auditors), so those skills load the
contract instead of contradicting it: `workflow-status`, `batch-scheduler`,
`skill-lint` and `audit-pr` adopt it. Duplicated canonical-owned boxes are
removed from `triage-issue`, `log-session`, `init-workspace`, `audit-docs`,
`product-audit`, `discover-repository-state`, `resolve-repository-state` and
the two conductors (`unit-lane`, `execute-phase`); the executor family keeps
every skill-specific box and gains the loader line. `fold-findings` migrates
while it still exists in the tree (its #307 retirement is future work), and
`log-session`'s migration is prose alignment with the fragment carrier (#405)
and the two-doors flow (#429). No behavior changed beyond the contract text
one skill loads — the `@gtrabanco/agentic-workflow-schema` package and the
machine envelopes are untouched.

The rule is pinned: `scripts/turn-contract-single-owner.test.mjs` (root suite)
refuses any `## Turn contract` section outside
`skills/orchestration-envelope/references/TURN_CONTRACT.md` that does not load
the canonical file, committed red-first against the 14-skill tree. Context
budgets re-based where the loader lines demanded it (`log-session`,
`orchestration-envelope'), and `SKILL_AUTHORING.md`'s authoring rule now
prescribes the loader shape.
