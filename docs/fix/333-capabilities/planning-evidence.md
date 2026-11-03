# Planning Evidence — fix/333-capabilities

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-11-03,
> `fix-333-capabilities` @ `6e65d0b3`) with the command in its `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | This repository's `docs/CAPABILITIES.md` is the raw template: 13 `yes\|no\|partial` cells, one `<role>` row, zero real values, committed as the seed at `8b68a18d` (`feat(docs): seed CAPABILITIES.md from template (feature 30 prep)`) | `rg -c 'yes\\\|no\\\|partial' docs/CAPABILITIES.md` → `13`; `rg -c '<' docs/CAPABILITIES.md` → `14`; `git log --oneline -- docs/CAPABILITIES.md` → one commit, `8b68a18d` | current | O9, O10, O13 |
| PE-002 | known | The issue's `grep -c '<' docs/CAPABILITIES.md` → `26` figure is not reproducible at this head: the command returns `14` (14 lines / 29 occurrences), so the defect is real but the number moved; the head's count governs the acceptance claim | `grep -c '<' docs/CAPABILITIES.md` → `14`; `grep -o '<' docs/CAPABILITIES.md \| wc -l` → `29` | stale | O9, O13 |
| PE-003 | known | The exported template ships 13 candidate subsystem rows plus 1 role row, and the repo copy differs from it only in the header's consumer name (`design-feature` vs "the lane's `design` catalog step") — so the repair rewrites a header, not a row set | `rg -c '^\| ' template/docs/CAPABILITIES.md` → `15` (header + separator + 13); `diff docs/CAPABILITIES.md template/docs/CAPABILITIES.md` → 3 hunks, all in the opening blockquote and the roles paragraph | current | O8, O10 |
| PE-004 | known | The discovery route states the intent in prose only — a single bullet with no ordering, no evidence table, and the algorithm reduced to "from what the code actually shows" | `sed -n '34,46p' skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`; `rg -n 'from what the code actually shows' skills/init-workspace/` → `BOOTSTRAP_DISCOVERY.md:39` | current | O1, O2, O3, O4 |
| PE-005 | known | The write route carries no capability-inventory step at all, so nothing fails a raw seed | `rg -n 'CAPABILITIES' skills/init-workspace/references/BOOTSTRAP_WRITE.md` → 0 matches (exit 1) | current | O5, O6, O13 |
| PE-006 | known | Upgrade mode names the inventory twice — once in the diff list and once as "the same discovery-seeded defaults" — which is the reference that inherits every discovery defect | `rg -n 'CAPABILITIES' skills/init-workspace/references/UPGRADE.md` → `:20`, `:28` | current | O7 |
| PE-007 | known | No consumer parses the inventory's columns: `product-audit` cross-checks rows against code in prose and `execute-phase` adds rows; nothing reads `Notes` by name, so renaming the fourth column to carry evidence breaks no reader | `rg -n 'CAPABILITIES' skills/` → `product-audit/references/AUDIT_DIMENSIONS.md:17`, `AUDIT_PROCESS.md:36`, the two `init-workspace` references — no column reader | current | O8, O11 |
| PE-008 | known | The no-assumption rule has exactly one normative owner (`ask-dont-infer@1` in the design reference) and `scripts/residue-dimensions.test.mjs` counts a restatement as any occurrence of `ask-don't-infer` outside the owner with no `DESIGN.md` within a 4-line window | `skills/unit-lane/references/DESIGN.md:116-127`; `scripts/residue-dimensions.test.mjs:195-209` (`OWNER_REL`, `REFERENCE_WINDOW = 4`), `:262-283` (the scan) | current | O4 |
| PE-009 | known | `init-workspace`'s references are budgeted per file at `referenceEstimateMax: 3412` / 280 lines, while `BOOTSTRAP_DISCOVERY.md` measures 77 lines — the procedure has room without a re-base | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`init-workspace.referenceEstimateMax`); `wc -l skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` → `77`; `bun scripts/check-skill-context.mjs` → `PASS context budgets: 28 skills` | current | O14 |
| PE-010 | known | The root gate is green at the cut head only after the declared "before" normalizers run: a fresh worktree has no `node_modules` and no `packages/agentic-workflow-schema/dist/`, and the suite reports 62 failures until both are built | `bun install` → 128 packages; `(cd packages/agentic-workflow-schema && bun run build)`; `node scripts/run-root-suite.mjs` → `tests 1381 / suites 33 / pass 1381 / fail 0 / skipped 0` (before the build: `fail 62`, every one `schema runtime is not built`) | current | O15 |
| PE-011 | known | Every path the repaired inventory will cite exists in this tree, so an "evidence path must resolve" rule is satisfiable without inventing one | `ls packages/*/package.json packages/agentic-workflow/src/doc .agentic-workflow/index.json template/.agentic-workflow/hooks .github/workflows/root-suite.yml docs/workflow/SKILL_CONTEXT_BUDGETS.json docs/LOGS.md skills/log-session/SKILL.md skills.sh.json .claude-plugin/plugin.json` → all present | current | O9, O10 |
| PE-012 | known | `scripts/*.test.mjs` are discovered by the root gate by glob, so a new repository suite needs no registration step, and `scripts/test-route-map.json` fails open to the full suite for an unmatched path | `scripts/run-root-suite.mjs:41-48` (glob discovery); `scripts/test-route-map.json` description ("An unmatched path runs the full gate") | current | O13, O15 |
| PE-013 | assumption | A table-driven, ordered procedure is what a weaker executor follows where prose was copied by rote; this unit does not sample a model run to prove it | owner: the next `docs/workflow/GOLDEN_FIXTURE.md` run over `init-workspace`; nothing in this unit is graded by a model run, only by the deterministic suite | current | O1, O5 |
| PE-014 | known | The generic evidence probes cannot be a literal command list: the repository is stack-agnostic and the named tool families are adapter examples, the same contract the performance-tooling checklist already states | `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md:52-70` ("the named tools are the TS/JS **adapter examples**; the contract is the generic block below") | current | O2 |

## Verification

- PE-001…PE-012 and PE-014 sampled at the cut head with the commands in the
  `source` cell (2026-11-03, `fix-333-capabilities` @ `6e65d0b3`).
- **PE-002 is `stale` on purpose**: it records a figure the issue states and the
  head refutes; the plan follows the head, and no acceptance criterion quotes the
  stale number.
- **PE-013** carries an owner instead of a citation: no model run was sampled, so
  the row stays `assumption` and no obligation rests on it alone.
