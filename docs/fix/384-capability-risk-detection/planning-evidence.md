# Planning Evidence — fix/384-capability-risk-detection

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-11-06,
> `91a7f39`) with the command in its `source` cell.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The cut head is green before the first line of code, so every later red is this unit's: 85 root suites, 0 failures | `bun scripts/run-root-suite.mjs` → 85 `PASS` lines, 0 `FAIL` (the tally line was lost to the background pipe; the head run in the `## Log` re-states it in the foreground) | current | O1, O15, O16 |
| PE-002 | known | The base classifier **misses eight of nine** removal reproducers: `unlink` from `node:fs/promises`, an aliased removal, a namespace removal, destructured `require("node:fs").rm`, `shutil.rmtree`, `os.remove`, `find -delete` and a removal reached through a relative import all answer `standard` / no signal; only a literal `rm -rf` answers `high` | `node /tmp/probe-base.mjs` against `scripts/risk-tiers.mjs` at `91a7f39` → the nine-line `standard`/`high` matrix | current | O1, O2, O3, O4 |
| PE-003 | known | `classifyTier` has exactly two non-test callers — `scripts/ceremony/tier.mjs:115` and `scripts/workflow-status.mjs:1680` — so a change to its signature or its evidence source must be threaded through both or the two answers diverge | `rg -n "classifyTier\\(" scripts/ --glob '!*.test.mjs'` → those two call sites plus the definition | current | O12, O15 |
| PE-004 | known | The closed ceremony CLI is a registry of `<object> <subcommand>` modules with one exit contract (0 success, 1 usage error, 2 ceremonial block), JSON on stdout, and shared helpers `out`/`fail`/`block`/`parseFlags`/`onlyFlags`; adding an object is a module + a registry key | `sed -n '40,60p' scripts/ceremony.mjs`; `scripts/ceremony/lib.mjs` (`out`, `fail`, `block`, `parseFlags`, `onlyFlags`) | current | O8, O9, O10, O11 |
| PE-005 | known | The passive carrier's on-disk shape is already **read by a second consumer**: `scripts/tier-cost.mjs` (`passiveTier`) parses `/^tier\s*\|\s*([a-z]+)\s*\|/m` out of `docs/passive/<id>.md` and counts a passive carrier as four skipped ceremony steps — so the writer must emit the declared pipe-table grammar, not a dash-bullet rendering | `sed -n '127,134p' scripts/tier-cost.mjs`; its fixture `passiveCarrier()` in `scripts/tier-cost.test.mjs:69` | current | O8, O9, O12 |
| PE-006 | known | The carrier's grammar (`passive-record@1`, five fields) is an inventoried normative surface, so its fields cannot drift without the drift gate failing | `rg -n "passive-record" AGENTS.md` → `passive-record \| skills/execute-phase/references/risk-tiers.md \| block:passive-record@1 \| n/a \| no` | current | O8, O9 |
| PE-007 | known | `scripts/risk-tiers.mjs` is pinned to `node:` + schema-source imports only and to no clock/environment/network read, which excludes a real AST parser (a dependency) from the classifier path | `scripts/risk-tier-classifier.test.mjs` `F6b` (`only node: builtins may be imported`); `rg -n "^import" scripts/risk-tiers.mjs` | current | D1, O1 |
| PE-008 | known | The owner's shape for this mechanic is recorded: "one mini-analyser per language family in the repo (`mjs`, `ts`, `sh`, `py`)", deferred to `360c` with its own frozen corpus | `docs/fix/360-risk-tiered-ceremony/decisions.md` `D360-3`; `D360-5` for the carrier's writer | current | D1, O1, O8 |
| PE-009 | known | Neither the carrier nor its directory exists at the cut head, and no script writes it: `docs/passive/` is absent and the only `docs/passive` mentions in `scripts/` are a changeset placeholder rule and `tier-cost`'s reader | `ls docs/passive` → `No such file or directory`; `rg -n "docs/passive" scripts/` → `lint-changeset.test.mjs`, `lint-changeset.mjs`, `tier-cost.mjs`, `tier-cost.test.mjs` | current | O8, O10 |
| PE-010 | known | The repository has **no `.py` file** and its only `.sh` files are the scaffold's hook adapters under `template/`, so the `py`/`sh` families are pinned by fixtures rather than by this repo's own code | `git ls-files '*.py'` → 0 lines; `git ls-files '*.sh' '*.bash'` → `template/.agentic-workflow/hooks/adapters/*.sh` | current | O1, the `## Future` row |
| PE-011 | known | The root suite caps each test at 60s on the bun leg and the slowest relevant suite is the sensor's (47.5s), so two new suites with fixture work stay inside the budget | `bun scripts/run-root-suite.mjs` base run → `PASS scripts/workflow-status-sensor.test.mjs (47.5s)`; the timeout constant in `scripts/run-root-suite.mjs` | current | O13 |
| PE-012 | known | The generated documentation projection is a gate step, so a roadmap or unit-doc edit must be regenerated in the same change | `scripts/local-gate.mjs` step `docs-generated-projection` → `node scripts/docs-generate.mjs --check` | current | O14 |
| PE-013 | assumption | The bounded declaration scan (brace depth + a per-family declaration pattern) attributes a removal to the declaration that wraps it, without a real parser. A misattribution can only *add* a declaration name — a false positive that costs ceremony — because the whole analysis fails closed upward; it cannot remove one. Not sampled against a third-party corpus; the fixtures behind it are this unit's | owner: this unit (P1) — `scripts/capabilities.test.mjs` carries the fixtures, and `## Future` records the unresolved-import bound | current | D1, O4, O5 |
| PE-014 | assumption | A script that embeds a shell command or a SQL statement is a destructive surface regardless of its own language (`rm --recursive --force build/` and `DELETE FROM users` inside a `.mjs` are the 360 corpus's own fixtures). Keeping that residue beside the capability catalogue is what makes the retirement lossless; dropping it would change a frozen fixture's verdict, which no owner asked for | owner: this unit (P2) — `scripts/risk-tier-classifier.test.mjs` `F3d` is that fixture | current | O5, O16 |
| PE-015 | assumption | Two passive units cannot collide because the id is the file name and `add` refuses an existing id. It is an assumption only about the *id space*: a hand-written duplicate with a different id is not prevented by the CLI — S6/S7's rule (never by hand) is a prose constraint carried by `risk-tiers.md` and the lane, not a filesystem guard | owner: this unit (P3) — the collision fixture in `scripts/ceremony-passive.test.mjs` | current | O8 |

## Verification

- PE-001…PE-012 were sampled at the cut head with the command in the `source`
  cell (2026-11-06, `91a7f39`).
- PE-013, PE-014 and PE-015 are `assumption` with an owner: each is resolved by
  this unit's own fixtures, and each is cited as an assumption rather than as a
  sampled fact.
- No row is `unknown` at cut: the one genuinely open question (S10) is settled by
  `D1` with its two authorities, not deferred.
