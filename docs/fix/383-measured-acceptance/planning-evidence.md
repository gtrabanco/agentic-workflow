# Planning Evidence — fix/383-measured-acceptance

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut base (2026-11-03, `626e4461`,
> `origin/main`) with the command in its `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The cut head is green before the first line of code, so every later red belongs to this unit | `node scripts/run-root-suite.mjs` → `ℹ tests 1513 · ℹ suites 33 · ℹ pass 1512 · ℹ fail 0 · ℹ skipped 1` | current | O15 |
| PE-002 | known | A unit's tier is read from its **own carrier** by one function (`recordedTier`, matching `"tier": "x"` or a `tier: `x`` cell), never stored in a second place; today exactly 1 unit of 128 has one | `sed -n '/export function recordedTier/,+12p' scripts/ceremony/tier.mjs`; `bun scripts/ceremony.mjs tier plan` → `totals 128 · recorded 1` | current | O2, O4 |
| PE-003 | known | The ceremony a tier owes is a declared, countable set of four steps ("no unit folder, no phases, no evidence table, no review pass"), so "phases skipped" is countable without inventing a per-unit baseline | `sed -n '/## The three tiers/,/## The passive carrier/p' skills/execute-phase/references/risk-tiers.md` | current | O6 |
| PE-004 | known | The size tier is derived from the risk verdict by `sizeTierOf()` and its rules have exactly one home; a second derivation would be a second classifier | `rg -n 'export function sizeTierOf' -A 12 scripts/risk-tiers.mjs` | current | O2, O4 |
| PE-005 | known | pi 1.5.0 exposes everything the accumulator needs: `turn_start.timestamp`, `turn_end.message` (assistant messages always carry `usage`), `tool_execution_end.durationMs` (monotonic clock), `session_shutdown` | `rg -n 'TurnStartEvent|TurnEndEvent|durationMs|session_shutdown' ~/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` | current | O9, O10, O11, O12 |
| PE-006 | known | A unit cannot be mapped to its own historical diff offline: unit docs record `## Branch`, but merged branches are deleted and the merge commit is forge evidence — so the comparison cannot be reconstructed for old units | `sed -n '/^## Branch/,+3p' docs/fix/382-red-first-commits/SPEC.md`; `git log --no-merges --all --grep='red-first'` returns no unit boundary | current | O5 |
| PE-007 | known | The package's pi floor is `>=0.99.1` and two surfaces pin it (`README.md`'s verified baseline and `test/verified-baseline.test.mjs`); `Usage.cost.totalFromProvider` exists only from pi 1.5.0, `durationMs` from 1.1.0 | `rg -n 'pi-coding-agent' packages/pi-agentic-workflow/package.json` → `">=0.99.1"`; pi `CHANGELOG.md` (1.5.0 `totalFromProvider`, 1.1.0 `durationMs`) | current | O14 |
| PE-008 | known | No instrument exists to supersede, so `## Retirements` states a reason rather than a task | `rg -c 'tier-cost\|TIER_COST' scripts packages skills -g '!node_modules'` · exit 1, 0 matches | current | O1 |
| PE-009 | known | The closed ceremony CLI's registry is pinned by its own suite, so adding an object there costs a test update and buys no behaviour this unit needs; measurement is a sensor, not a ceremony operation | `rg -n 'unknown-object\|REGISTRY' scripts/ceremony.test.mjs`; `sed -n '20,60p' scripts/ceremony.mjs` | current | Impact (standalone CLI) |
| PE-010 | known | `ledger-ownership@1` in `LEDGERS.md` is the single owner of the truth-class table and `scripts/ledger-ownership.test.mjs` reads it, so a new ledger is a row there, never a prose paragraph elsewhere | `sed -n '/ledger-ownership@1/,/^```$/p' skills/pre-execution-review/references/LEDGERS.md` | current | O7 |
| PE-011 | known | `normative-surfaces@1` in the guide is the inventoried surface list and `scripts/normative-drift.test.mjs` fails closed on a grammar-bearing surface with no fixed grammar in its `grammar` cell | `sed -n '/normative-surfaces@1/,/^```$/p' AGENTS.md`; `rg -n 'must-name\|schema-export' scripts/normative-drift.test.mjs` | current | O8 |
| PE-012 | assumption | A unit's ceremony is countable as "declared steps recorded vs absent" from its own carrier (a unit doc with `## Tasks`/`## Log`, or nothing at all for a passive unit). Sampled on three unit docs only; P2's fixtures are the corpus that pins it | owner: this unit (P2) — `scripts/tier-cost.test.mjs` carries the carrier matrix | current | O6 |
| PE-013 | unknown | Whether ≥3 units per tier will exist while this unit is open — measured at the cut head as 1 recorded tier in 128 units, which is the whole reason S6's verdict is `insufficient-corpus` | `bun scripts/ceremony.mjs tier plan` → `recorded 1` | current | O5 |
| PE-014 | unknown | Which pi release introduced `turn_start.timestamp` — it is absent from pi's `CHANGELOG.md`, so the floor cannot be justified from the changelog alone | owner: P6 verifies it against the pinned 1.5.0 types before the floor sentence is written | current | O14 |
| PE-015 | known | Session-span "wall-clock" is dominated by absence, which is why S4a removes it: 123.4 h maximum inter-message gap against 372.1 h span in this repository's own session corpus, and up to 1525.4 h machine-wide, against minutes of work | `bun -e '<sessions gap sampler over ~/.pi/agent/sessions>'` → `2026-10-18T12-39 maxGap=123.4h span=372.1h` (repo corpus); machine-wide `maxGap=1525.4h span=1715.3h` | current | O3 |

## Verification

- PE-001…PE-011 and PE-015 were sampled at the cut base (2026-11-03, `626e4461`, `origin/main`) with the command in the `source` cell. PE-001's suite run was re-executed at this branch's head (`9d21d6f6`), whose only delta from the base is this unit's own documentation.
- **PE-012 is `assumption` with an owner**: P2's fixtures are its corpus; it is never cited as if sampled elsewhere.
- **PE-013 and PE-014 are `unknown` with an owner**: PE-013 is S6's measured precondition (and its answer *is* `insufficient-corpus`), PE-014 is closed by P6 before the floor sentence is written.
