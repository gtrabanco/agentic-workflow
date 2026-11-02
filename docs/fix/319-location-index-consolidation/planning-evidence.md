# Planning Evidence — fix/319-location-index-consolidation

> One row per Engineering claim the change rests on. `authority-kind`:
> `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` |
> `not-applicable`. Every `known` row was sampled at the cut head (2026-10-30,
> `main` @ `1c9375a1`).

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | 181 files mention the legacy path; 138 of them are historical unit docs (`docs/features/**`, `docs/fix/**`) plus `CHANGELOG.md`/`docs/LOGS.md`/`.serena`, so the live surface is small and the move must not sweep history | `rg -l 'docs/features/ROADMAP' \| wc -l` → 181; `rg -l 'docs/features/ROADMAP' docs/features docs/fix \| wc -l` → 138; `rg -l 'docs/features/ROADMAP' scripts packages skills template docs/workflow \| wc -l` → 40; `grep -rn ... --include=*.mjs --include=*.ts scripts packages \| wc -l` → 31 lines in 22 files | current | O1, O12 |
| PE-002 | known | Root scripts can import the crate's source directly — no build step — because a root script already does: `scripts/unit-cycle.mjs` and `scripts/roadmap-settle.mjs` import `../packages/agentic-workflow/src/edit/Roadmap.mjs` | `rg -n 'agentic-workflow/src/edit' scripts/*.mjs` → `scripts/roadmap-settle.mjs:42`, `scripts/unit-cycle.mjs` import block | current | O6, O7 |
| PE-003 | known | The crate's writer takes the table path as an argument (`rowUpsert(table, …)`, `findRow(table, nn)`, `checkUnitDoc({indexText})`) and holds no path constant, so the constant is additive and no writer signature changes | `packages/agentic-workflow/src/edit/Roadmap.mjs:70-120,128-150,220-275` | current | O6, O8 |
| PE-004 | known | The schema package publishes `dist/` built from `src/*.ts` and `src/index.ts` re-exports every public constant; a new `src/paths.ts` plus one `export *` line is enough to publish the constant | `packages/agentic-workflow-schema/package.json` (`main: ./dist/index.js`), `src/index.ts:3880-3900` (the existing re-export tail) | current | O3, O7, O13 |
| PE-005 | assumption | In a consolidated document the fix parsers would read feature rows as fixes: `scripts/workflow-status.mjs`'s `parseFixIndex` takes the first cell's first number and feature rows carry a bare `NN`. The claim is not asserted from source reading alone — it is pinned by a test case before the consolidating change | owner: this unit (P2); basis: `scripts/workflow-status.mjs:391-437` (`parseRoadmap` requires `/^\d+$/`, `parseFixIndex` accepts any `(\d+)`), `scripts/unit-route.mjs:300-360` | current | O9 |
| PE-006 | known | Root tests that load the schema package need the gitignored `dist/` build (`scripts/schema-runtime.mjs` throws when absent), so a new root suite must never import it — the mirror-parity check reads both sources as text instead | `scripts/schema-runtime.mjs:14-45` | current | O7, O13 |
| PE-007 | known | `skills/` is the only skills tree in git; the Pi package stages its copy at test/pack time from `skills/`, so the issue's "×2 copies" is one edit point | AGENTS.md §Distribution; `packages/pi-agentic-workflow` stages `skills/` via `bundle:skills` | current | O11 |
| PE-008 | known | `scripts/promise-coherence.test.mjs`'s F20 pin requires the corpus rule's single owner (`scripts/unit-doc-phases.mjs`) to hold the roadmap literal; the literal moves to the published constant, so the pin must follow the rule's new home without weakening it | `scripts/promise-coherence.test.mjs:500-515` | current | O6, O12 |
| PE-009 | known | Fixture trees that carry both indexes: `scripts/fixtures/{unit-route,roadmap-settle,catalog}`, `scripts/fixtures/vocabulary-probe/tree`, `scripts/fixtures/spec-by-reference/tree`, and the golden fixture's `audit-target` (fix index only) | `find scripts/fixtures -name 'ROADMAP.md' -o -path '*fix/README.md'` | current | O10 |
| PE-010 | assumption | Closing the alias window later is a one-constant change because the closed path is implemented and tested now (`ROADMAP_LEGACY_READ = false` → `roadmap-moved`), so D2's "one release train" needs no follow-up code | owner: this unit (P2); basis: the closed-window case in `scripts/index-document.test.mjs` | current | O5 |
| PE-011 | known | The two audit-facing prose surfaces that describe where a unit registers (`template/AGENTS.md`, `skills/unit-lane/SKILL.md`) are the only live docs naming the fix index as a separate file besides the skills the issue lists | `rg -n 'docs/fix/README' skills template docs/workflow` | current | O11 |
| PE-012 | known | The version-parity gate triggers on any `skills/**` or `packages/**` change and accepts a `.changeset/*.md` intent file in place of a manual bump | AGENTS.md §Packages (feature 40/75); `scripts/version-parity-gate.mjs` | current | O13 |
| PE-013 | known | `promise-coherence` is a repo-local gate over its own checkout (`const ROOT = …import.meta.url`) with no `--root`, and `unit-route --triage` routes a document by its own sections, so neither can be pointed at a pre-move tree; the refusal suite pins the consumers that do accept a target and says so in its header instead of faking a case | `scripts/promise-coherence.mjs:106,1294`, `scripts/unit-route.mjs` triage mode; `node scripts/promise-coherence.mjs` on a pre-move tree prints its own checkouts's verdict | current | O14 |

## Verification

- PE-001…PE-004, PE-006…PE-009, PE-011, PE-012 sampled at the cut head with the
  commands in the `source` cell.
- **PE-005 resolved at P2**: `scripts/index-document.test.mjs` pins the
  cross-table collision case (a feature row numbered `N` is not a fix row `N`)
  and it fails against the unscoped parser, so the assumption is claimed by a
  test rather than by reading.
- **PE-010 resolved at P2**: the closed-window case exists and passes with
  `ROADMAP_LEGACY_READ = false` passed explicitly; the default stays `true`
  (D2). No `unknown` rows remain.
