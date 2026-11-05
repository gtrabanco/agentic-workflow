# Planning Evidence — fix/356-test-targeting

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-11-04,
> `main` @ `c8b64d0b`) with the command in its `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The guide layer is already over its declared estimate ceiling at the cut head: `AGENTS.md` measures 6884 against `estimateMax` 6881, so the root gate is red before this unit's first line, and any `AGENTS.md` amendment must declare a re-basis whose source names the inherited drift | `bun scripts/check-skill-context.mjs --documents` at `c8b64d0b` · exit 1 · `AGENTS.md: estimate 6884 > 6881`; `bun scripts/run-root-suite.mjs` · exit 1 · 2 failures, both `check-skill-context` | current | O9, O10; `## Known pre-existing issues` |
| PE-002 | known | `AGENTS.md`'s three machine blocks are counted separately from prose (`machineBlocks` / `machineLines` / `proseLinesMax`), so one new `normative-surfaces@1` row moves `machineLines` by exactly one and leaves prose counting alone | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`documents.files["AGENTS.md"]`: `machineBlocks` 3, `machineLines` 92, `proseLinesMax` 302); `scripts/check-skill-context.mjs` `machineRegion()` | current | O2, O9 |
| PE-003 | known | Every `references/*.md` under a skill must be linked from that skill's `SKILL.md` (`unreachable reference`) and must open on a heading, and a new reference file is bounded by the skill's `referenceEstimateMax` / `referenceLinesMax` — for `execute-phase` 3232 est / 280 lines | `scripts/check-skill-context.mjs` (`unreachable reference`, `first content line must be a heading`, `referenceEstimateMax`); `SKILL_CONTEXT_BUDGETS.json` `skills["execute-phase"].referenceEstimateMax` = 3232 | current | O2, O4, O9 |
| PE-004 | known | A route declares its loaded references explicitly, so a reference cited but absent from a route's `references` list costs no route budget — the precedent is `execute-phase/references/risk-tiers.md`, cited and not loaded (owner decision m2-b) | `SKILL_CONTEXT_BUDGETS.json` `routes["execute-phase:*"].references.execute-phase` (never lists `risk-tiers.md`); `AGENTS.md` `docs/workflow` re-basis entry for #360 | current | O2, O9 |
| PE-005 | known | `rg -l -w -F -f <patterns> <files>` prints the files containing any pattern as a whole word and exits 0 on a hit / 1 on none, and GNU `grep -l -w -F -f <patterns> <files>` answers identically — so the two matcher tiers differ in binary only, never in answer | sampled in `/tmp`: `rg -l -w -F -f pats.txt a.test.mjs b.test.mjs` → `a.test.mjs`, exit 0; `grep -l -w -F -f pats.txt a.test.mjs b.test.mjs` → `a.test.mjs`, exit 0; both exit 1 with empty output on a no-match pattern file | current | O4, O5 |
| PE-006 | known | This repository commits `.serena/project.yml` with its `language_servers`, so the LSP tier's availability probe has a committed file to read and the tier can be declared instead of assumed | `ls .serena/project.yml`; `skills/init-workspace/references/SERENA.md` (the committed-config convention) | current | O6 |
| PE-007 | known | Skill prose may not teach `node scripts/…` without a `fallback`/`absent` declaration on the line or the one before it, and every `scripts/*.mjs` usage string must print the bun form — so the new reference and the new script must be written bun-first | `scripts/invocation-drift.mjs` (`NODE_SCRIPT_LITERAL`, `declaresFallback`, `USAGE_NODE`); `bun scripts/invocation-drift.mjs` at the cut head · exit 0 | current | O2, O4, O9 |
| PE-008 | known | `scripts/test-route-map.json` is a declared normative surface whose unmatched paths answer `full-suite`, so a new `scripts/*` pair needs its own route row or every checkpoint on it pays the full gate | `scripts/test-route-map.json` (`description`); `scripts/test-route.test.mjs`; `AGENTS.md` `## Normative surfaces` (`sweep-declaration`-adjacent rows) | current | O9 |
| PE-009 | known | The root suite discovers `scripts/*.test.mjs` with no registration step and neutralizes git signing for throwaway fixture repositories, so the new suite joins by existing and its fixtures can commit | `scripts/run-root-suite.mjs` (`suites()`, the `GIT_CONFIG_*` preamble) | current | O1, O7, O9 |
| PE-010 | assumption | A target project names its test files by one of the conventions the hint's declared pattern table reads (`*.test.*`, `*.spec.*`, `test_*`, `*_test`, `*_spec.rb`, `*Test.java` or a `test`/`tests`/`__tests__` directory). A project using another convention gets `no candidate test file matched` and falls back to its own gate — owner: the hint's `TEST_FILE_PATTERNS` table, extended by whoever adopts a new convention | not sampled: this repository uses `scripts/*.test.mjs` and `packages/*/test/*.test.mjs`, both covered; no other convention exists here to sample | current | O1, O4; `## Future cost` |

## Verification

Re-sampled on the change tree before hand-off; the runs are `E`/`G` lines in the
unit doc's `## Log`.
