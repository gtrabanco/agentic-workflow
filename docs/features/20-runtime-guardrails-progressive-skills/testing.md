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
- P2: `audit-pr` authoring checks passed at 4.0.0 and no auto-merge branch remains.
- P2: `ship-roadmap` authoring checks passed at 3.0.0; sole-authority, wrapper, cleanup, and PR-comment markers are present.
- P2: `init-workspace` authoring checks passed against `references/BOOTSTRAP_DISCOVERY.md`; bootstrap and additive upgrade paths name all four adapters.
- P2: plugin alphabetical order and version/changelog parity checks passed.
- P2: both command/fullauto fixtures passed again after the workflow-policy changes.
- P3: `node scripts/check-skill-context.mjs --manifest-only` passed with eight budgeted skills and one-hop references.
- P3: `skills.sh.json`, `.claude-plugin/marketplace.json`, and `SKILL_CONTEXT_BUDGETS.json` parsed as JSON; every grouped skill directory exists.
- P3: `product-audit` 3.0.0 exposes both manual-only metadata keys and retains its explicit invocation contract.
- P4: `node scripts/check-skill-context.mjs` passed all eight skills, including one-hop reachability, no nested reference links, main/reference line limits, and description budgets.
- P4/P5 final: direct activation estimates are `execute-phase` 3,016; `design-feature` 2,654; `ship-roadmap` 2,467; `review-change` 2,205; `init-workspace` 1,983; `audit-pr` 1,962; `workflow-status` 1,788; and `triage-issue` 1,443. All stay below their committed hard budgets; `execute-phase` remains about 77% below its pre-segmentation estimate of 13,010.
- P4: every segmented entrypoint retains `Turn contract`, `Portability`, and `→ Next:`; executor/review/audit entrypoints also retain explicit NRS and Architectural invariants routing.
- P4: `git diff --check` and both bilingual context-guidance acceptance greps passed.
- P5: the first Qwen3 8B (`--think=false`) progressive-route probe failed and exposed ambiguous selectors plus references cut mid-contract. Route allowlists/tables and semantic boundaries were tightened; the checker now rejects a reference whose first content line is not a heading.
- P5: the hardened Qwen3 8B run passed all eight natural route-selection cases and the exact `execute-phase` defined-status blocker; the OpenAI-compatible tool smoke returned `finish_reason: tool_calls`, `get_time`, and parseable `{}` arguments. Both bilingual golden logs contain the failed and superseding passed rows.
- P5: `shellcheck`, `test-command-guard.sh` (6 allowed / 13 blocked), and `test-fullauto-merge.sh` (cleanup + idempotent comment) passed again on the final tree.
- P5: all JSON manifests/examples parsed; grouped skill directories exist; plugin/model-routing order, bilingual version/changelog parity, and user-skill entrypoint contracts passed.
- P5: `node scripts/check-skill-context.mjs` passed 8 budgeted skills and 48 reachable, semantically headed, one-hop references with no nested reference links.
- P5: `npx skills add . --list` discovered 30 installable skills and exited 0.
- P5: PR [#116](https://github.com/gtrabanco/agentic-workflow/pull/116) opened against `main`; no merge command was run.
