# Feature map

> **Seeded at upgrade (2026-11-28), maintained by the lane's docs step.** Every
> unit that adds, changes or removes a user-facing flow updates its row in the
> same change (owner: `skills/unit-lane/references/DOCS.md`). The column
> contract is `materialization@1` in the runner crate's README.

Why this exists: the repository is judged by the jobs it does for its users, and
a flow nobody can name is a flow nobody can verify. The map is the shortest
answer to three questions an agent otherwise re-derives (or guesses) every unit:
**what exists** (the flow, in the user's words), **how a user reaches it** (the
entry point), **what evidence demonstrates it** (a named check — no captures in
this repo; `captures: discarded` in the ceremony profile).

## The map

```text
feature-map@1
```

| flow | what-exists | how-a-user-reaches-it | evidence | status |
|---|---|---|---|---|
| Install the workflow into a repository | the skills, the documentation scaffold and (this repo's case) the substrate's missing blocks land in the target project, owner-consented | `npx skills add gtrabanco/agentic-workflow` → `/init-workspace` (bootstrap or upgrade) | `runner scaffold-contract check` + `runner substrate check` in the runner crate's suites; the crate's CLI suites pin the ops | shipped |
| Run a delivery unit end to end | one unit doc carries triage → plan → execute → review, with the deterministic gates at each step | `/unit-lane` → `/execute-phase` → `/review-change` | schema suites (envelope, verdict vocabularies) + per-file suites under `scripts/*.test.mjs` in the root gate | shipped |
| Review and audit a change | findings-only review passes over the changed surface, classified into fix-now / backlog / ignore, ending in a MERGE-READY verdict or named blockers | `/review-change` (+ internal axes) → `/audit-pr` | `packages/agentic-workflow` receipt suites (review-gate, audit-pr-gate) | shipped |
| Keep the docs in sync | roadmap tables, generated projection and unit docs in one truth; drift reported with typed findings | `/audit-docs` · `runner doc --sync` · `bun scripts/docs-generate.mjs --check` | `scripts/docs-generate.mjs --check` in the local gate; audit-docs suites | shipped |
| Change the standard itself | the inviolable laws, the closed vocabularies and the adapters' default behavior in the unified config | `AGENTS.md § Inviolable rules` + `packages/agentic-workflow-schema/src/vocabularies.ts` | published-vocabulary-parity + normative-surfaces gate | shipped |

## Caveats

- The server-over-MQTT runner vision (the charter's long-term horizon) has no
  row yet: it is roadmap, not a shipped flow — it earns a row when a unit ships
  the first slice.
