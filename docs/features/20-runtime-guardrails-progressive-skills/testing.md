# 20 — runtime-guardrails-progressive-skills · testing

## Planned checks

- Canonical command/path guard allow/block matrix.
- Claude Code, Cursor, Copilot, and OpenCode adapter payload normalization.
- Fullauto wrapper success, failure, cleanup, head/base validation, and comment idempotency.
- JSON parsing for both distribution manifests.
- Main-file budgets and one-hop reference integrity for every segmented skill.
- `npx skills add . --list` discovery parity.
- Weakest-model golden fixture for changed executor-path contracts.

## Results

- P1: `shellcheck template/.agentic-workflow/hooks/*.sh template/.agentic-workflow/hooks/adapters/*.sh template/.agentic-workflow/hooks/tests/*.sh` passed.
- P1: `test-command-guard.sh` passed 6 allowed and 13 blocked cases, including normalized Claude/Cursor and Copilot payloads.
- P1: `test-fullauto-merge.sh` passed success, already-merged retry, failure cleanup, and idempotent comment cases.
- P1: all hook JSON examples parsed with Node's `JSON.parse`.
