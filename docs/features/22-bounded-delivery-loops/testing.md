# Testing

Frozen source: `ACCEPTANCE.md`, blob
`e7e6458604e0f6bf673295180d6b264f8934210c`.

All repository gates passed on 2026-08-09:

- `node scripts/bounded-delivery-loops.test.mjs`
- `node scripts/check-skill-context.test.mjs`
- `node scripts/check-skill-context.mjs`
- `node scripts/check-skill-context.mjs --routes`
- `node scripts/dependency-gate.test.mjs`
- `node scripts/review-receipt.test.mjs`
- `node scripts/audit-pr-receipt.test.mjs`
- `npx skills add . --list` — 31 distributed skills discovered
- local Markdown-link existence probe — 63 changed files checked
- `git diff --check`

The static contract suite covers target-only and explicit-phase dispatch,
capability/mechanical grouping, acceptance weakening rejection, proposal-only
discoveries, compatible finding batches, and every bounded-loop terminal.

Live weak-model probes:

- Qwen3 8B without thinking passed deterministic dispatch/grouping and terminal
  selection but failed exact loop counters. It is a worker floor, not a
  conductor floor.
- Qwen3 14B with thinking passed OpenAI-style tool calling, frozen-manifest
  preservation, remaining/explicit phase routing, proposal-only discoveries,
  and exact loop terminal/counter traces.
- `nan/qwen3.6` is now reachable through the configured Pi provider. It used the
  read tool successfully, preserved the frozen-manifest rule, selected literal
  target/explicit phases, kept an unrelated enhancement as a proposal, and
  returned exact bounded-loop terminal/counter traces. DeepSeek Flash, MiMo,
  and Gemma4 are also visible in the configured provider catalog; they were not
  promoted to conductor evidence without their own fixture runs.
