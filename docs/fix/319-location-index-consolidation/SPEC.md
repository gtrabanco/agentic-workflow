# fix/319-location-index-consolidation

> Fix specification — one single unit document, cut in the re-cut
> `spec-by-reference` shape from `docs/fix/_TEMPLATE/SPEC.md`. Size: **M** — the
> planning ledgers live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate).

## Issue

`#319` — NEW FEATURE (BREAKING): consolidate the location indexes — `docs/features/ROADMAP.md`
moves to `docs/ROADMAP.md` as the single Features+Fixes index. The PR closes it
via `Closes #319`.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim. The frozen
request is L1; every later decision cites its `S#`.

**S1 — Summary: one index, one writer, and it is breaking.**
> Move `docs/features/ROADMAP.md` → `docs/ROADMAP.md` and consolidate the workflow's location indexes into one document: a `## Features` table (current format unchanged), a `## Fixes` table (absorbing `docs/fix/README.md`'s active-fixes index), and the status machine + conventions (transferred verbatim). One index, one writer — the same "single surface, single owner" rule the repo already applies to unit docs.
>
> **This is a breaking change**: the path is read and written by deterministic code (sensors, router, crate, schema tests) and the repo's normative surfaces inventory pins surfaces beside it. It ships as a feature unit with its own migration plan, never as a drive-by rename.

**S2 — Why: three reconstructed indexes collapse to one read point.**
> - The live state is split across three places: features in `docs/features/ROADMAP.md`, fixes in `docs/fix/README.md`, issues only in the forge. Triage today means reading three indexes; `audit-docs` and the sensor each reconstruct the picture.
> - One document gives the sensor, `audit-docs` and humans a single read point and keeps the row-removal-after-merge lifecycle (`## Fixes` keeps the fix index's convention, relocated).
> - The crate already owns the deterministic roadmap writer (feature 78 / `edit/Roadmap.mjs`, call sites wired by #316) — the move is a path constant + renames on top of a writer that exists, not new machinery.

**S3 — Sequencing: the hard dependency is satisfied.**
> - **Lands AFTER #316** (fix-next): #316 wires the roadmap writer's call sites; landing the move first would make its PR chase a renamed path.
> - Coordinate with #315/#318 (parallel candidates): `promise-coherence.mjs` reads the path too — either sequence after #315 or accept a small rebase.

**S4 — Blast radius: only live surfaces migrate, historical docs are record.**
> 420 references across ~150 files. Of those, **~135 are historical unit/fix docs that are NOT touched** (append-only evidence; closed units are never rewritten — paths inside them are record, not code). Only the live surfaces migrate:

…with the issue's layer table (code · schema package · fixtures · skills ×2 copies ·
substrate/docs — [elided: the full table — verbatim in L1]).

**S5 — Move + consolidate.**
> 1. **Move + consolidate**: `docs/ROADMAP.md` gains `## Features` (current columns verbatim), `## Fixes` (the fix index's active table + its status legend; row removed only after merge — same rule), and the status machine/conventions sections. `docs/fix/README.md` becomes a one-line stub pointing at `docs/ROADMAP.md#fixes` (the `docs/fix/<n>-<topic>/` SPEC folders stay where they are).

**S6 — Read alias, single write path.**
> 2. **Read alias, single write path**: sensors/router read the old path tolerantly during a migration window (accept both, write only the new); after the window, reading the old path fails closed with a `moved` pointer — never a silent empty parse.

**S7 — Constant change once.**
> 3. **Constant change once**: the crate and schema package expose the path as a published constant; consumers import it instead of hardcoding (kills the 15-file recurrence for any future move).

**S8 — Normative surfaces and tests re-pinned in the same PR.**
> 4. **Normative surfaces + tests re-pinned in the same PR**: `normative-surfaces@1`, drift tests, fixture trees, and the two skills copies stay byte-identical except for the path.

**S9 — template/ and init-workspace substrate.**
> 5. **template/ + init-workspace substrate** updated so target projects scaffold the new layout; upgrade mode offers the migration additively (never clobbers).

**S10 — Acceptance criteria (the issue's own list).**
> - Every live reader/writer imports the published constant; `grep -rn "docs/features/ROADMAP" --include=*.mjs --include=*.ts scripts packages` returns only the alias definition.
> - Root suites green with fixtures re-pinned; golden fixture updated.
> - `docs/fix/README.md` is a stub; its conventions row lives in the consolidated doc.
> - Historical docs untouched (`git diff --name-only` over the PR contains no closed unit folder).
> - `audit-docs` runs clean against the new single index.

**S11 — Open questions, resolved by owner decision in this unit.**
> - Does the consolidated doc keep the fix index's "row removed after merge" lifecycle verbatim, or does `## Fixes` gain the five-state status column? (Recommendation: keep verbatim; lifecycle unification is a separate decision.)
> - Alias window length (one release vs. removed same-PR).

Both are declared "for design, not blockers", so this unit decides them and
records the decision rather than guessing: **D1** keeps the fix lifecycle
verbatim (the issue's own recommendation); **D2** keeps the alias window open for
one release train, with the fail-closed path implemented and tested now so
closing the window is a one-constant change, not a new implementation.

**S12 — Non-goals.**
> - No rewrite of historical unit/fix docs.
> - No schema-package break beyond the version bump that publishes the new constant.
> - No new gates; `audit-docs` remains the drift checker.

## Impact

- **Readers/writers of the path** (all live): `scripts/unit-route.mjs`,
  `scripts/workflow-status.mjs`, `scripts/unit-cycle.mjs`,
  `scripts/unit-doc-phases.mjs`, `scripts/roadmap-settle.mjs`,
  `scripts/ceremony/unit.mjs`, `scripts/pre-execution-contract.mjs` (comment
  only), `packages/agentic-workflow/bin/agentic-workflow.mjs` (index defaults),
  `packages/agentic-workflow-schema/src/index.ts` (`compileWorkflowSnapshot`).
- **Readers/writers of the fix index**: they move to the consolidated document's
  `## Fixes` table — `parseFixIndex` (sensor), `fixIndexIssues`/`fixIndexStatus`
  (router), `inFlightUnitDocs` (shared corpus reader), `statusIndex`
  (ceremony `unit`), `settle` (roadmap-settle), the crate's `roadmap check`
  index default, and the schema snapshot's fix branch.
- **Unit docs opened before this unit**: untouched (S4/S12) — their paths are
  record. `docs/fix/319-location-index-consolidation/` is the only unit folder
  this change touches.
- **Skills and substrate**: the five skills the issue names (both copies: the Pi
  package stages `skills/`, so `skills/` is the single edit point), `template/`,
  and the live `docs/workflow/` pages.
- **Fixtures**: every fixture tree that carries the two indexes migrates with the
  real layout, so the suites exercise the layout the repo actually ships.
- **`.serena/memories/core.md`, `CHANGELOG.md`, `docs/LOGS.md`**: historical
  mentions stay (S4, S12). They record what past sessions did; they are not live
  surfaces.

## Retirements

- The `docs/features/ROADMAP.md` **file** (content moves to `docs/ROADMAP.md`);
  replacement = `docs/ROADMAP.md`. Negative pin:
  `rg -c 'docs/features/ROADMAP' docs/workflow/LANE_FLOW.md` → 0.
- The `docs/fix/README.md` **index body** (status legend, active table,
  conventions); replacement = the stub plus `docs/ROADMAP.md` § Fixes.
  Negative pin: `rg -c '^## Active' docs/fix/README.md` → 0.
- Hardcoded path literals in live code; replacement = the published constant.
  Negative pin: `grep -rn "docs/features/ROADMAP" --include=*.mjs --include=*.ts scripts packages` → 1
  line (the alias definition itself).

## Non-goals

The issue's non-goals (S12), plus:

- No unification of the two lifecycles (feature five-state vs fix
  removed-after-merge) — that is the separate decision S11 names.
- No change to `docs/features/<NN>-<slug>/` folder naming, no move of the fix
  SPEC folders, no new drift gate.
- No rewrite of any closed unit doc, `CHANGELOG.md` history or `docs/LOGS.md`
  entries.

## Future

`none` — nothing was deferred by the requester.

## Future cost

- The alias constant is a standing obligation on the next train release: closing
  the window (D2) flips `ROADMAP_LEGACY_READ` to `false` and deletes the legacy
  branch of `readRoadmapDocument`. It binds whoever cuts the release after this
  unit ships.
- The two published constants (crate + schema package) are a mirror pair; the
  parity test in `scripts/index-document.test.mjs` binds any future edit of one
  to the other. It binds every future change to the path.

## Applicable tests

| id | reproducer (frozen before implementation) | expectation |
|---|---|---|
| R1 | `grep -rn "docs/features/ROADMAP" --include=*.mjs --include=*.ts scripts packages` | 31 hits across 22 files at cut time (measured 2026-10-30); one hit — the alias definition — after |
| R2 | `test -f docs/ROADMAP.md` | absent today, present after |
| R3 | `head -1 docs/fix/README.md` on a repo whose index was consolidated | full index today; one-line stub after |
| R4 | a repo carrying **both** paths, and one carrying **only** the old path with the window closed | identical parse for the first; `roadmap-moved` refusal for the second (never an empty parse) |
| R5 | the consolidated index read by the fix parsers (`parseFixIndex`, `checkUnitDoc` kind `fix`) | a feature row numbered N is never read as a fix row N |

R1–R5 are O1, O2, O5, O6, O9's validators below.

## Known pre-existing issues

- `packages/agentic-workflow-schema/dist/` is a gitignored build output that root
  tests load through `scripts/schema-runtime.mjs`. This unit's root test reads
  **source files as text** (the repo's established mirror-parity style) and needs
  no build; the schema package's own suite builds before it tests.
- `fixUnit` in `compileWorkflowSnapshot` matches `NN-slug`-shaped first cells,
  which this repo's fix rows (`| [#331](url) | topic | … |`) never produce; the
  fix branch is therefore inert on this repo today. This unit preserves that
  behaviour exactly (it only changes where the text is read from) and does not
  take the opportunity to fix it — that would be a second, undocumented semantic
  change.

## Tasks

- P1 — Cut the unit doc, ledgers, and the index registration.
  (validator: `node scripts/phase-lint.mjs docs/fix/319-location-index-consolidation/SPEC.md` exits 0)
  (Implements: S3, S5, S10)
  Relevant files: docs/fix/319-location-index-consolidation/SPEC.md
- P2 — Publish the path constants + the tolerant/closed reader in the crate, and migrate every live consumer to it.
  (validator: `node --test scripts/index-document.test.mjs` exits 0)
  (Implements: S6, S7, S8)
  Relevant files: packages/agentic-workflow/src/index-document.mjs
- P3 — Mirror the constants in the schema package and read the consolidated document in `compileWorkflowSnapshot`.
  (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S7, S8, S12)
  Relevant files: packages/agentic-workflow-schema/src/paths.ts
- P4 — Move and consolidate the index; reduce `docs/fix/README.md` to the stub.
  (validator: `node --test scripts/index-document.test.mjs` exits 0)
  (Implements: S1, S2, S5, S11)
  Relevant files: docs/ROADMAP.md
- P5 — Re-pin the fixture trees and the golden fixture to the consolidated layout.
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S8, S10)
  Relevant files: scripts/fixtures
- P6 — Migrate the skills, `template/` substrate and live `docs/workflow/` pages.
  (validator: `rg -n 'docs/features/ROADMAP' docs/workflow skills template` exits 1)
  (Implements: S8, S9, S10)
  Relevant files: skills/unit-lane/SKILL.md
- P7 — Verification: declaration, receipt and the changeset intent.
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S4, S10, S12)
  Relevant files: .changeset

### Planning evidence

The ledger lives beside this doc as `planning-evidence.md` (M unit).

### Obligations

The ledger lives beside this doc as `planning-obligations.md` (M unit).

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it.

| S# | criterion | proving check |
|---|---|---|
| S1 | `docs/ROADMAP.md` carries one `## Features` table, one `## Fixes` table, the status machine and the conventions; `docs/features/ROADMAP.md` no longer exists | `test ! -e docs/features/ROADMAP.md` exits 0 and `rg -c '^## (Features|Fixes|Status legend|Conventions)$' docs/ROADMAP.md` → 4 |
| S2 | one index is the read point: the sensor and the router resolve both features and fixes from `docs/ROADMAP.md` | `node --test scripts/index-document.test.mjs` exits 0 |
| S3 | the hard dependency is satisfied at cut time (#316, #315, #318 merged) | `git log --oneline -1` on `main` contains the #316 merge; recorded in the unit Log |
| S4 | no closed unit folder is touched | `git diff --name-only main...HEAD -- docs/features docs/fix` matches only `docs/fix/319-location-index-consolidation/*` |
| S5 | the fix conventions (removed-after-merge lifecycle + status legend) live in the consolidated doc, and `docs/fix/README.md` is a one-line stub pointing at `docs/ROADMAP.md#fixes` | `wc -l < docs/fix/README.md` → 1 and `rg -c 'docs/ROADMAP.md#fixes' docs/fix/README.md` → 1 |
| S6 | both paths are accepted during the window with identical results, and the closed window refuses the old path with a `moved` pointer instead of an empty parse | `node --test scripts/index-document.test.mjs` exits 0 (alias-equivalence + closed-window cases) and `node scripts/index-document.test.mjs --demo moved` prints `roadmap-moved` |
| S7 | the legacy path literal survives in exactly one place in code, and the crate and schema constants agree | `grep -rn "docs/features/ROADMAP" --include=*.mjs --include=*.ts scripts packages` → 1 line; `node --test scripts/index-document.test.mjs` exits 0 (parity case) |
| S8 | every live reader/writer uses the published constant, and the fixture trees carry the consolidated layout | `node scripts/run-root-suite.mjs` exits 0 and `rg -c 'docs/features/ROADMAP' scripts/fixtures` → 0 |
| S9 | `template/` scaffolds the new layout and `init-workspace`'s upgrade reference offers the move additively | `rg -c 'docs/ROADMAP.md' template/AGENTS.md` → 6 and `rg -c 'docs/ROADMAP.md' skills/init-workspace/references/UPGRADE.md` → 2 |
| S10 | the issue's five criteria hold, measured by their own commands | the Validators block in the close-out receipt |
| S11 | D1 (fix lifecycle verbatim) and D2 (one-train alias window) are recorded and implemented | `rg -c '\*\*D1\*\*|\*\*D2\*\*' docs/fix/319-location-index-consolidation/SPEC.md` → 2 |
| S12 | no new gate, no schema break beyond the constant's release | `cd packages/agentic-workflow-schema && bun run test` exits 0; `git diff --stat main...HEAD -- packages/agentic-workflow-schema/envelope.schema.json` is empty |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-10-30, the issue, verbatim:

  ```
  # NEW FEATURE (BREAKING): consolidate the location indexes — docs/features/ROADMAP.md moves to docs/ROADMAP.md as the single Features+Fixes index
  ```

  The body is frozen verbatim in `## Specs` above, section by section
  (Summary · Why · Sequencing · Blast radius · Mechanics · Acceptance criteria ·
  Open questions · Non-goals). The only elisions are the blast-radius layer
  table and the sequencing bullets' detail, both marked in S3/S4; read them from
  the forge with `gh issue view 319 --json body --jq .body`.

- **D1** — 2026-10-30, issue S11's first open question, decided as the issue
  recommends: `## Fixes` keeps the fix index's "row removed after merge"
  lifecycle verbatim. Lifecycle unification is not part of this unit.
- **D3** — 2026-10-30, S9's criterion counts measured at P6, not assumed: the
  planning cut guessed `3`/`≥1` mentions; the delivered substrate names the
  path 6 times in `template/AGENTS.md` and twice in `UPGRADE.md`, so the frozen
  criterion carries the measured values. No behaviour changed — the criterion
  was unverifiable as written.
- **D2** — 2026-10-30, issue S11's second open question, decided: the alias
  window stays open for one release train (`ROADMAP_LEGACY_READ = true`), with
  the fail-closed `roadmap-moved` path implemented and tested now. Closing the
  window is a one-constant flip plus the legacy branch's deletion, owned by the
  next release cut (see `## Future cost`).

## Next

Hand the diff to the requester for external verification (S10's Validators
block first, then the reviewer's verdict).

## References

- Issue `#319` — the frozen request (L1).
- Feature row 86 `location-index-consolidation` — this fix's roadmap row.
- `#316` (roadmap writer call sites), `#315` (published-vocabulary pin),
  `#318` (class escalation) — the sequencing dependencies, all merged.
- `skills/pre-execution-review/references/LEDGERS.md` — the two ledgers' row
  contracts.

## Branch

`fix/319-location-index-consolidation`

## Depends on

`none` — #316, #315 and #318 are merged at cut time (S3).

## Regression scope

| scenario | verifying check |
|---|---|
| a repo with only the legacy roadmap still senses and routes (migration window) | `node --test scripts/index-document.test.mjs` exits 0 (alias case); `node scripts/workflow-status.mjs` on a legacy fixture exits 0 |
| the sensor's feature/fix separation is unchanged on today's layout | `node --test scripts/workflow-status-sensor.test.mjs scripts/workflow-status-compact.test.mjs scripts/next-step-ranking.test.mjs` exits 0 |
| the router's issue routing and status reads are unchanged | `node --test scripts/unit-route.test.mjs scripts/unit-cycle.test.mjs` exits 0 |
| the settle validator and the crate's `roadmap check` agree with the docs | `bun scripts/roadmap-settle.mjs` exits 0 and `cd packages/agentic-workflow && bun run test` exits 0 |
| the crate's roadmap writer keeps its behaviour | `cd packages/agentic-workflow && bun run test` exits 0 |
| the schema snapshot contract keeps its shape | `cd packages/agentic-workflow-schema && bun run test` exits 0 |
| skill context budgets and drifted-normative surfaces stay green | `bun scripts/check-skill-context.mjs` exits 0 and `node --test scripts/normative-drift.test.mjs` exits 0 |
