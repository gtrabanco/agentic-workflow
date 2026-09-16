# Testing — 52-machine-checked-turn-contract

Artifact revision: `52-plan-2`.

## Test layers

- **Integration (primary) — engine suite:** `packages/agentic-workflow/test/turn-contract.engine.test.mjs`
  (`node --test packages/agentic-workflow/test/`, node v22 per `.node-version` —
  directory mode). Each case builds a throwaway fixture repo with
  `git init -b <default>` in a temp directory, runs the engine with the
  fixture as cwd (subdirectory case included), and asserts the exact stdout
  line plus exit code. gh is stubbed through a PATH-shim script emitting
  canned JSON for the box4 cases (`pr-not-open`, `pr-head-mismatch`,
  `pr-unreachable`, open-PR pass). A no-tree-mutation assertion diffs
  `git status --porcelain` around every invocation. Coverage is the
  D-52-9-proportionate set: per-box pass/fail/n-a (box2's `acceptance-missing`
  and `phase-lint-failed` named among the codes — the phase-lint clause is
  engine-only, ED-52-3), `--help`, unknown flag,
  subdirectory, no-mutation — no flag × state combinatorial sweep.
- **Integration — hook suite:** `template/.agentic-workflow/hooks/tests/test-turn-contract.sh`
  follows the house helper pattern of `test-command-guard.sh` (PE-008): the
  same fixture-repo matrix driven through the bash shim, plus the AC12 grep
  guard (`grep -n -e node -e bun -e npm -e npx template/.agentic-workflow/hooks/turn-contract.sh`
  → no matches — repeated `-e` patterns; the escaped-pipe form matches the
  literal string and cannot fail, PLAN52-F1).
- **Parity:** `packages/agentic-workflow/test/turn-contract.parity.test.mjs`
  runs the same fixture-repo matrix through both engines and asserts
  byte-identical stdout lines and exit codes (AC7). This is the drift gate
  between the crate engine and the scaffold shim.
- **Grammar conformance:** `scripts/turn-contract-grammar.test.mjs` parses
  the fenced `turn-contract-receipt@1` block from
  `skills/orchestration-envelope/references/TURN_CONTRACT.md` (the single
  grammar source, D-52-5), asserts both engines' outputs conform, and checks
  the `CLAUDE.md` normative-surfaces row is present. Runs beside
  `node --test scripts/normative-drift.test.mjs`, which must stay green
  (the new row parses; machine `n/a` precedent — PE-009).
- **Skill-surface regression (existing suites, unchanged):**
  `bun scripts/check-skill-context.mjs` (budget headroom after the
  `TURN_CONTRACT.md` profile section — six skills load it, PE-015),
  `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
  (mirror re-bundled same PR), `node --test
  scripts/workflow-status-sensor.test.mjs` (envelope `next` fields — AC10).

## Runtime constraints

- bun-first, node fallback everywhere (`AGENTIC_WORKFLOW_RUNTIME=bun|node`
  override; `npm_config_user_agent` starting with `bun/` pins bun). The
  engine itself is invoked as a plain node-compatible script.
- No network: the only forge access is gh in box4, stubbed in every suite.
- Fixtures are throwaway temp git repos; nothing is written inside the
  repository under test (asserted).
