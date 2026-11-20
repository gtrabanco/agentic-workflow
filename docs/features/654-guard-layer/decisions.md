# 654 — guard-layer · decisions

Owner-scope decisions live in the unit doc's `## Log` (`D1…D9`), beside the
requirement they answer. This file carries only what the repository's own
path-protection floor requires the unit to declare, plus the named consumers the
residual classifier needs for the surfaces this unit adds.

## Path-protection records

`**/*.test.*` is a frozen class under the shipped floor
(`packages/pi-agentic-workflow/src/config/path-policy.ts`,
`SHIPPED_PATH_POLICY`), so every test this unit creates or extends needs a
pre-freeze `modify` `justification` row (owner:
`skills/orchestration-envelope/references/TURN_CONTRACT.md`, block
`path-protection@1`). Every row below is a suite this unit creates or extends —
never a test edited to pass: the red-first corpus is written before its
implementation, and the two existing suites only gain cases.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/guard-plugin.test.mjs | P2 | 2026-11-20 | execute-phase | the red-first corpus of the published guard-plugin contract — the file does not exist before this unit
justification | packages/pi-agentic-workflow/test/guard-plugin-config.test.mjs | P2 | 2026-11-20 | execute-phase | the red-first corpus of the `guardPlugins` config section — the file does not exist before this unit
justification | packages/pi-agentic-workflow/test/guard-plugin-core.test.mjs | P2 | 2026-11-20 | execute-phase | the red-first corpus of the kind seam, the registration and the declared degradation — the file does not exist before this unit
justification | packages/pi-agentic-workflow/test/permission-layer.test.mjs | P2 | 2026-11-20 | execute-phase | the retirement pins and the adoption's documented facts — the file does not exist before this unit
justification | packages/agentic-workflow/test/provision.permissions.test.mjs | P2 | 2026-11-20 | execute-phase | the red-first corpus of the renderer and the CLI operation — the file does not exist before this unit
justification | packages/pi-agentic-workflow/test/path-protection.test.mjs | P6 | 2026-11-20 | execute-phase | O4's scratch pair is added to the suite that owns Tier 2's decisions; additive cases only, no existing assertion moves (IR3)
justification | packages/pi-agentic-workflow/test/default-inherit.test.mjs | P4 | 2026-11-20 | execute-phase | the resolved-shape expectation gains the new section, the same additive edit unit #632 made for `phaseBatching`; no existing key's expectation changes
```

## Residual promises

`bun scripts/residual-classify.mjs --inventory --base origin/main` classifies
every surface this unit adds, and the classifier resolves a claim only from the
ledgers — a relative TypeScript import is not a claim it reads. Each module below
has a live consumer today; the row says which (owner: `skills/unit-lane/references/DESIGN.md`
§ `residual-promise@1`), so the next sweep resolves the surface instead of
guessing.

```text
residual-promise@1
surface | consumer | date | owner
packages/agentic-workflow-schema/src/guard-plugin.ts | the pi package's `src/guards/plugin-core.ts` (imports the contract) and the crate's `src/provision/permissions.mjs` (renders the policy) | 2026-11-20 | issue #654
packages/pi-agentic-workflow/src/guards/plugin-core.ts | packages/pi-agentic-workflow/src/extension/guard-plugin-wiring.ts (registers the links at session start) | 2026-11-20 | issue #654
packages/pi-agentic-workflow/src/extension/guard-plugin-wiring.ts | packages/pi-agentic-workflow/src/extension/index.ts (called from the `session_start` handler) | 2026-11-20 | issue #654
packages/agentic-workflow/src/provision/permissions.mjs | packages/agentic-workflow/bin/agentic-workflow.mjs (`provision permissions`) | 2026-11-20 | issue #654
skills/init-workspace/references/PERMISSIONS.md | skills/init-workspace/SKILL.md (the progressive-loading allowlist and the guardrails consent bullet) | 2026-11-20 | issue #654
```
