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

**S6a — the window is closed now (requester correction, 2026-10-30).**
> Si ya tenemos la nueva versión de ROADMAP.md en docs con issues y features resuelve lo de ROADMAP_LEGACY_READ = true, asegurate de que los scripts y todo el código determinista que apunta al roadmap lo resuelve correctamente y que toda la maquinaria de ceremonia que implique el roadmap esté actualizada. Comprobar si la issue 332 necesita algún apunte o corrección.

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
verbatim (the issue's own recommendation); **D2** kept the alias window open for
one release train — **superseded by D4** (S6a closes it in this unit).

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
  (validator: `rg -n 'docs/features/ROADMAP' docs/workflow skills template` exits 0)
  (Implements: S8, S9, S10, S7)
  Relevant files: skills/unit-lane/SKILL.md
- P7 — Verification: declaration, receipt and the changeset intent.
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S4, S10, S12)
  Relevant files: .changeset

- P8 — Close the migration window: every deterministic consumer resolves the published path only and refuses a pre-move tree with a `roadmap-moved` pointer.
  (validator: `node --test scripts/roadmap-moved.test.mjs` exits 0)
  (Implements: S6a)
  Relevant files: scripts/roadmap-moved.test.mjs
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
| S4 | no closed unit folder is touched | `git diff --name-only main...HEAD -- docs/features docs/fix` → the moved index, the stub and `docs/fix/319-location-index-consolidation/*`, and no `docs/{features,fix}/<NN>-<slug>/` folder |
| S5 | the fix conventions (removed-after-merge lifecycle + status legend) live in the consolidated doc, and `docs/fix/README.md` is a one-line stub pointing at `docs/ROADMAP.md#fixes` | `wc -l < docs/fix/README.md` → 1 and `rg -c 'docs/ROADMAP.md#fixes' docs/fix/README.md` → 1 |
| S6 | both paths are accepted during the window with identical results, and the closed window refuses the old path with a `moved` pointer instead of an empty parse | `node --test scripts/index-document.test.mjs` exits 0 (alias-equivalence + closed-window cases) and `node scripts/index-document.test.mjs --demo moved` prints `roadmap-moved` |
| S6a | the window is closed: every deterministic consumer (router, sensor, unit cycle, vocabulary probe, settle validator, ceremony CLI, crate `roadmap check`, schema snapshot) refuses a pre-move tree with `roadmap-moved` and no index-derived output, while the documented rollback lever still reads it | `node --test scripts/roadmap-moved.test.mjs scripts/index-document.test.mjs` exits 0 and `cd packages/agentic-workflow-schema && bun run test` exits 0 (the #319 snapshot case) |
| S7 | the legacy path literal survives in exactly one place in code, and the crate and schema constants agree | `grep -rn "docs/features/ROADMAP" --include=*.mjs --include=*.ts scripts packages` → 1 line; `node --test scripts/index-document.test.mjs` exits 0 (parity case) |
| S8 | every live reader/writer uses the published constant, and the fixture trees carry the consolidated layout | `node scripts/run-root-suite.mjs` exits 0 and `rg -c 'docs/features/ROADMAP' scripts/fixtures` → 1 (one historical fixture pre-existing at main, protected by S4) |
| S9 | `template/` scaffolds the new layout and `init-workspace`'s upgrade reference offers the move additively | `rg -c 'docs/ROADMAP.md' template/AGENTS.md` → 6 and `rg -c 'docs/ROADMAP.md' skills/init-workspace/references/UPGRADE.md` → 2 |
| S10 | the issue's five criteria hold, measured by their own commands | the Validators block in the close-out receipt |
| S11 | D1 (fix lifecycle verbatim) and D2 (one-train alias window) are recorded, and D2's supersession by D4 is recorded too | D1, D2 and D4 recorded in the body (S11 §) and in the Log → `rg -c '\*\*(D1|D2|D4)\*\*'` matches 5 (2 body + 3 Log) |
| S6b | the documented rollback lever governs every consumer: with the window closed a pre-move-only tree is refused with its `roadmap-moved` pointer, and with the lever on the same tree reads its rows | `cd packages/agentic-workflow && bun run test` exits 0 ("the documented rollback lever re-opens the pre-move path for every consumer") |
| S7b | a migrated tree's `## Fixes` table owns its fix rows: an absent row is never answered from a stale standalone index, while a half-migrated tree keeps the documented fallback | `cd packages/agentic-workflow-schema && bun run test` exits 0 ("#319 F9") |
| S12 | no new gate, no schema break beyond the constant's release | `cd packages/agentic-workflow-schema && bun run test` exits 0; `git diff --stat main...HEAD -- packages/agentic-workflow-schema/envelope.schema.json` is empty |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|
| F15 | packages/agentic-workflow/src/index-document.mjs:207 · packages/agentic-workflow-schema/src/index.ts:2154-2156 | correctness | med | source | fold |
| F16 | packages/agentic-workflow-schema/src/index.ts:2196,2216 | correctness | med | source | fold |
| F17 | docs/fix/319-location-index-consolidation/SPEC.md `## Log` (S3 record) | spec-drift | med | source | fold |


## Log

- **F1** — 2026-11-02, FOLDED at `git rev-parse --short HEAD` after this commit — root cause: `roadmapTableRows` fell back to the whole document when the requested heading was absent, so a document that declares its tables by heading but has no `## Fixes` answered a fix check with its `## Features` rows. Fix: that fallback is now taken only for documents that do not declare tables by heading, and only in the fix direction (a pre-319 roadmap keeps its features table under its title). Regression: `packages/agentic-workflow/test/roadmap-check.test.mjs` "never reads a feature row as the fix row of the same NN when ## Fixes is absent" — red without the fix (`slug-mismatch — doc folder says 'beta', row says 'alpha'`), green with it.
- **F2** — 2026-11-01, FOLDED in `a5c75e79` — corrected the comment at `index.ts:2271` to reflect the code: standalone fix index has priority when both are present, consolidated is the fallback.
- **F3** — 2026-11-02, FOLDED at the same commit as F1 — root cause: the schema package parsed table rows with `split("|")`, so an escaped `\|` became a column boundary and every later cell shifted; `fixUnit` read the escaped fragment's successor as the status. Fix: the schema now holds the crate's `tableCells` contract. Regression: `packages/agentic-workflow-schema/test/machine-contract.test.mjs` "#319 F3: an escaped pipe stays one cell" — red without the fix, green with it.
- **F4** — 2026-11-01, REPLANNED IN UNIT — S8's criterion said `rg -c 'docs/features/ROADMAP' scripts/fixtures` → 0 while one hit is a historical record fixture pre-existing at `main` that S4 forbids rewriting. The criterion was corrected to the measured `1` with its reason; no behaviour changed.
- **F5** — 2026-11-01, REPLANNED IN UNIT — S11's criterion counted D1/D2 in the specification body only (→ 2); they are also recorded as Log decisions. The criterion now names the total across body and Log (→ 4).
- **V7** — 2026-11-02, correction of this unit's own fold record. The first pass rewrote S8/S11's criteria **and** logged F1/F3 as `none` without a code change. Both were wrong: editing a criterion to match the observed output is the weakening `fold-findings` forbids, and an open `route: fold` row cannot be left with a prose note. F1 and F3 are now folded at their root causes with red-first regressions; F4 and F5 are recorded as replanned-in-unit (their `replan-in-unit` class freezes the fold batch, so they are never folded). The earlier `docs(319): fold F2 (comment), F4/F5 (criteria)` commit stays in history; this entry supersedes its claims.
- **V8** — docs/fix/319-location-index-consolidation/SPEC.md:230 · reviewer review-change · HEAD 2a68d2bb01775554535a612157e036010ddd0315 · recheck: direct read + `git diff 980573a7..HEAD` on this file — the Log's removed-line ids are L1, D1–D5, E1–E6, P1–P7, V1–V6, R1, G1; V7's supersession clause covers only the F1/F3/F4/F5 fold claims, none of those marks. Consequences re-measured at head: `rg -c '\*\*D1\*\*|\*\*D2\*\*'` → 2 against S11's required 4; S3's "recorded in the unit Log" unmet (Log ids are F1–F5 + V7 only, zero hits for 316/315/318); `## References` cites the frozen request L1, which no longer exists in the unit folder; `rg -n '\*\*E[0-9]\*\*'` → nothing (execution receipt gone) · confirmed
- **V9** — packages/agentic-workflow-schema/src/index.ts:2310 · reviewer review-change · HEAD 2a68d2bb01775554535a612157e036010ddd0315 · recheck: failing reproducer against unchanged code — `compileWorkflowSnapshot` with `input.documents` carrying both a standalone fix index (row `42-slug … in-progress`) and the consolidated index resolves the unit from `docs/fix/README.md` (standalone wins), while the crate pins the opposite order ("keeps preferring the consolidated ## Fixes table once the tree is migrated — a stale standalone index that would disagree: it must be ignored", `packages/agentic-workflow/test/roadmap-check.test.mjs:337-341`) · confirmed
- **V10** — scripts/unit-route.mjs:316-327,339 · reviewer review-change · HEAD 2a68d2bb01775554535a612157e036010ddd0315 · recheck: instrumented reproducer (counted `fs.readFileSync` on the index during a status lookup on a scratch tree) — fix unit with a matching row → 2 full reads; miss path → 4 (the `exists` probe is a full `readProject` read, the text is read again, and `standaloneFixRows()` repeats the pair) · confirmed
- **R2** — 2026-11-02, review at HEAD 2a68d2bb01775554535a612157e036010ddd0315 · verdict REVIEW-FAIL · cycle 2 (delta re-review escalated to a full pass: fold diff 384 changed lines > 200) · gate exit 0
- **G2** — 2026-11-02, `node scripts/run-root-suite.mjs` · exit 0 · 1301 pass, 0 fail; `packages/agentic-workflow-schema` `bun run test` · 728/728; `packages/agentic-workflow` `bun run test` · 258/258; `node --test scripts/roadmap-moved.test.mjs scripts/index-document.test.mjs` · exit 0 · 15/15; `bun scripts/check-skill-context.mjs` · PASS · 28 skills; `node --test scripts/normative-drift.test.mjs` · exit 0; `node scripts/version-parity-gate.mjs --content --base main` · exit 0 — all at HEAD 2a68d2bb01775554535a612157e036010ddd0315 (reviewer gate run)
- **L1** — 2026-10-30, the issue, verbatim:

  ```text
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
- **D2** — 2026-10-30, issue S11's second open question, decided: the alias
  window stays open for one release train (`ROADMAP_LEGACY_READ = true`), with
  the fail-closed `roadmap-moved` path implemented and tested now. Closing the
  window is a one-constant flip plus the legacy branch's deletion, owned by the
  next release cut (see `## Future cost`).
- **D3** — 2026-10-30, S9's criterion counts measured at P6, not assumed: the
  planning cut guessed `3`/`≥1` mentions; the delivered substrate names the path
  6 times in `template/AGENTS.md` and twice in `UPGRADE.md`, so the frozen
  criterion carries the measured values. No behaviour changed — the criterion
  was unverifiable as written.
- **E1** — 2026-10-30, `node --test scripts/index-document.test.mjs` · exit 0 ·
  8/8 pass (O1, O4, O5, O6, O7, O8, O9).
- **E2** — 2026-10-30, `node scripts/run-root-suite.mjs` · exit 0 · 1301 pass,
  0 fail (O8, O10, O13).
- **E3** — 2026-10-30, `cd packages/agentic-workflow && bun run test` · exit 0 ·
  254 pass, `cd packages/agentic-workflow-schema && bun run test` · exit 0 ·
  727 pass, `cd packages/pi-agentic-workflow && bun run test` · exit 0 · 454 pass.
- **E4** — 2026-10-30, `bun scripts/check-skill-context.mjs` · exit 0 ·
  `PASS context budgets: 28 skills`.
- **E5** — 2026-10-30, `node scripts/version-parity-gate.mjs --content --base main`
  · exit 0 · PASS (changeset route for all three packages);
  `--pins` · exit 0 · PASS (both local pins match).
- **D4** — 2026-10-30, owner instruction quoted as S6a: the migration window is
  **closed now**, not at a later release cut. D2's "one release train" is
  superseded. `ROADMAP_LEGACY_READ` is `false` in both published constants
  modules; it stays as the documented rollback lever, and closing the window is
  pinned per consumer by `scripts/roadmap-moved.test.mjs`.
- **D5** — 2026-10-30, issue `#332` (split `AGENTS.md` into a core guide plus
  progressive references) needs **no correction from this unit**: it pins
  `scripts/normative-drift.test.mjs`'s `GUIDE_REL`, the `homes` assertion in
  `scripts/pre-execution-quality.test.mjs` and an inventory of `AGENTS.md`
  readers, none of which this change touched (`git diff --name-only
  main...HEAD -- AGENTS.md scripts/normative-drift.test.mjs
  scripts/pre-execution-quality.test.mjs` is empty), and it names no index path.
  Its `human-revision-needed` label holds it, so nothing was written to the
  issue.
- **E6** — 2026-10-30, `grep -rn "docs/features/ROADMAP" --include=*.mjs
  --include=*.ts scripts packages` · 1 line · the alias constant in
  `packages/agentic-workflow/src/index-document.mjs` (R1).
- **P1** — 2026-10-30, cut the unit doc, the two ledgers and the index
  registration · `5b2a2d27`.
- **P2** — 2026-10-30, published the constants in the crate, migrated the eight
  live consumers, added the schema mirror and scoped both tables; the vector
  whose fixture cited the pre-move path is re-blessed · `ec64bb4f`.
- **P3** — 2026-10-30, mirrored the constants in the schema package
  (`src/paths.ts`, re-exported from the package root) and made
  `compileWorkflowSnapshot` read the consolidated document through them;
  `cd packages/agentic-workflow-schema && bun run test` · 727 pass · `ec64bb4f`.
- **P4** — 2026-10-30, moved and consolidated the index; the fix index is the
  one-line stub · `67f2e3a8`.
- **P5** — 2026-10-30, re-pinned the six fixture trees and the golden fixture ·
  `5d5e360a`.
- **P6** — 2026-10-30, migrated the skills, `template/`, and the live
  `docs/workflow/` pages; `init-workspace` upgrade step 4 offers the move
  additively · `5e7cfa5f`.
- **P7** — 2026-11-01, verification: declared the S10 criteria against the
  close-out receipt and wrote the `.changeset` intent (both packages major, and
  the six affected skills — `execute-phase`, `init-workspace`,
  `pre-execution-review`, `triage-issue`, `unit-lane`, `workflow-status` — major);
  `node scripts/run-root-suite.mjs` · exit 0 · 1301 pass,
  `bun scripts/check-skill-context.mjs` · PASS · 28 skills,
  `node scripts/version-parity-gate.mjs --content --base main` · PASS · `5e7cfa5f`.
- **V1** — 2026-11-01, external verification of `main...HEAD` at `63793b5e`: one
  blocker and four ledger advisories, all corrected here without changing
  behaviour. **Blocker** — `packages/agentic-workflow-schema/README.md` still
  taught the pre-move path: its `compileWorkflowSnapshot` example passed
  `{ path: "docs/features/ROADMAP.md" }`, which at `1c9375a1` derived the unit
  and at `63793b5e` yields `unit: null` plus a `unit` unknown (the window is
  closed); the example now names `docs/ROADMAP.md`, so no live surface teaches a
  path the compiler refuses. **Advisories** — O5's quoted diagnostic
  text, O6's `index-document.mjs:28`, and the stale `1292`/`726` suite counts in
  E2, E3, O7, O8, O10 and O13 now carry the re-verified `1301`/`727`. Every
  declared validator re-ran at the corrected head: root suite 1301/1301, schema
  727/727, crate 254/254, pi 454/454, `index-document` 8/8, `roadmap-moved`
  7/7, skill-context PASS, version-parity PASS both halves.
- **V2** — packages/agentic-workflow/src/index-document.mjs:175 · reviewer review-change · HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 · recheck: failing reproducer against unchanged code — half-migrated tree (canonical `docs/ROADMAP.md` with feature row `91 alpha`, no `## Fixes`, standalone `docs/fix/README.md` carrying `[#91] beta`): `node packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/91-beta/SPEC.md` → `slug-mismatch — doc folder says 'beta', row says 'alpha'`, exit 1; variant without a colliding NN → PASS 0 violations while the unit's fix row sits unread in the standalone index; fully migrated control → PASS. Four sibling consumers keep the standalone fallback (pinned by `scripts/workflow-status-sensor.test.mjs:1120`; promised by `docs/workflow/MIGRATION.md:39-41` and `skills/init-workspace/references/UPGRADE.md:48-51`) · confirmed
- **V3** — packages/agentic-workflow-schema/src/index.ts:2271-2274 · reviewer review-change · HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 · recheck: direct read — the comment states "the consolidated index wins when a caller supplies both" while `documentFor(input.documents, FIX_INDEX_DOCUMENT) ?? roadmapDocument` makes the standalone document win whenever present; masked only by the declared-inert `fixUnit` matcher · confirmed
- **V4** — packages/agentic-workflow-schema/src/index.ts:2083-2099 · reviewer review-change · HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 · recheck: direct read — `sectionContent` duplicates the crate's `roadmapSection` (`packages/agentic-workflow/src/index-document.mjs:113-146`) with no recorded reason, and the pair diverges on escaped `\|` (`tableCells` handles it at index-document.mjs:142; the schema's `split("|")` at index.ts:2117 does not); the mirror-parity test pins only the four constants · confirmed
- **V5** — docs/fix/319-location-index-consolidation/SPEC.md:223 · reviewer review-change · HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 · recheck: direct read — `rg -c 'docs/features/ROADMAP' scripts/fixtures` → 1 (`scripts/fixtures/unit-route/docs/features/37-phase-lint-script/review-findings.md:18`, a record fixture pre-existing at main whose historical text S4 forbids rewriting) against the criterion's stated 0 · confirmed
- **V6** — docs/fix/319-location-index-consolidation/SPEC.md:226 · reviewer review-change · HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 · recheck: direct read — `rg -c '\*\*D1\*\*|\*\*D2\*\*' docs/fix/319-location-index-consolidation/SPEC.md` → 4 (S11 body :69-70 + Log decisions :247,:250) against the criterion's stated 2 · confirmed
- **R1** — 2026-11-01, review at HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 · verdict REVIEW-FAIL · cycle 1 · gate exit 0
- **G1** — 2026-11-01, `node scripts/run-root-suite.mjs` · exit 0 · 1301 pass, 0 fail at HEAD 980573a7ec0f4cc10bf7a04e6ef619513e6c18a6 (reviewer gate run, isolated verify pass; `node --test scripts/roadmap-moved.test.mjs` · exit 0 · 7/7, `node --test scripts/index-document.test.mjs` · exit 0 · 8/8, `bun scripts/check-skill-context.mjs` · PASS · 28 skills)

## Next

External verification — the requester is the verifier. The verdict is theirs;
nothing here self-approves.

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
- **F6** — 2026-11-02, FOLDED with F7/F8 — root cause: the `2a68d2bb` fold rewrote the `## Log` instead of appending to it, deleting L1, D1–D5, E1–E6, P1–P7, V1–V6, R1 and G1 (V7's supersession covered only the F1/F3/F4/F5 fold claims). Fix: every deleted entry is restored verbatim from `git show 2a68d2bb^:docs/fix/319-location-index-consolidation/SPEC.md`, above this cycle's entries; S11's criterion was re-cut to the set it can now prove (D1/D2/D4 in the body and in the Log, `rg -c` → 5). Regression: `rg -c '\*\*(D1|D2|D4)\*\*'` → 5, and the pre-fold entries are byte-identical to the parent blob.
- **F7** — 2026-11-02, FOLDED with F6/F8 — root cause: `compileWorkflowSnapshot` resolved the fix branch from `documentFor(input.documents, FIX_INDEX_DOCUMENT) ?? roadmapDocument`, so the standalone index won whenever present — and a migrated tree always ships it as a stub, making the consolidated `## Fixes` table unreachable. Fix: the consolidated document is read first and the standalone index is the fallback, matching the order the crate pins. Regression: `packages/agentic-workflow-schema/test/machine-contract.test.mjs` "#319 F7: the consolidated ## Fixes table wins over a stale standalone fix index" — red without the fix (`source: docs/fix/README.md`), green with it.
- **F8** — 2026-11-02, FOLDED with F6/F7 — root cause: `roadmapIndexText()` proved existence with a full `readProject()` read and then read the file again, and `standaloneFixRows()` repeated the pair — four full reads of the consolidated index per status lookup on the miss path. Fix: the existence probe is `statSync`, the resolved document is read once per process, and the stale "read only while the alias window is open" comment now states what the code does. Regression: `scripts/unit-route.test.mjs` "#319 F8: one status lookup reads the index once, not once per probe" — red without the fix (`2 !== 1`), green with it.
- **V11** — SR-11 fold · `docs/fix/319-location-index-consolidation/SPEC.md`, cycle 2 · head 5c8bf14e restored then folded at this commit · recheck: direct read — the restored `## Log` carries L1, D1–D5, E1–E6, P1–P7, V1–V6, R1 and G1 verbatim from the parent blob, and S11's re-cut criterion measures 5 · confirmed
- **V12** — `packages/agentic-workflow-schema/src/index.ts:2303` · head at fold · recheck: reproducer — the #319 F7 regression is red on the pre-fold code (unit provenance `docs/fix/README.md`) and green after, with `packages/agentic-workflow/test/roadmap-check.test.mjs`'s consolidated-first case still green · confirmed
- **V13** — `scripts/unit-route.mjs:316` · head at fold · recheck: instrumented read count — 2 before the fold, 1 after, measured inside `scripts/unit-route.test.mjs` by counting `fs.readFileSync` calls on `docs/ROADMAP.md` · confirmed
- **V14** — packages/agentic-workflow-schema/src/index.ts:2311 · reviewer review-change · HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a · recheck: failing reproducer against unchanged code — `compileWorkflowSnapshot` with the consolidated index carrying a `## Fixes` table without a row for the unit plus a stale standalone `docs/fix/README.md` carrying `42-slug` resolves the unit from the stale standalone (`unit {"kind":"fix","id":"42-slug"}`, provenance `["docs/fix/README.md"]`), while the crate pins "keeps preferring the consolidated ## Fixes table once the tree is migrated — a stale standalone index that would disagree: it must be ignored" (`packages/agentic-workflow/test/roadmap-check.test.mjs:338`); the #319 F7 regression only pins the row-present case · confirmed
- **V15** — packages/agentic-workflow/bin/agentic-workflow.mjs:303 · reviewer review-change · HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a · recheck: reproducible command — a patched copy with `ROADMAP_LEGACY_READ = true` on a legacy-only tree: `roadmap check docs/fix/91-beta/SPEC.md` → `EDIT REFUSAL — index not found …` exit 2, while the same patched module's `readRoadmapIndex` returns `docs/features/ROADMAP.md` — the lever re-opens the shared reader but the CLI never consults it, contradicting the constant's contract (`index-document.mjs:38-40`) and S6a · confirmed
- **V16** — docs/fix/319-location-index-consolidation/SPEC.md:188 · reviewer review-change · HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a · recheck: direct command — `rg -n 'docs/features/ROADMAP' docs/workflow skills template` → exit 0, 8 lines (7 added by this branch: `MIGRATION.md` ×4, `UPGRADE.md` ×2, `skills/init-workspace/SKILL.md` ×1, plus one pre-existing `GOLDEN_FIXTURE.md` run-log row) against P6's frozen "exits 1" · confirmed
- **V17** — docs/ROADMAP.md:127 · reviewer review-change · HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a · recheck: direct read — fix row `[#319] … in-progress` vs feature row 86 `done · [#351]` in the same document; the legend defines `done` = "built, PR open, awaiting merge" and PR #351 is open · confirmed
- **V18** — .changeset/319-location-index-consolidation.md:20 · reviewer review-change · HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a · recheck: direct read — the changeset names "the tolerant document suffix" among the crate's exports; neither package exports any suffix constant · confirmed
- **F11 (plan re-cut)** — 2026-11-02, REPLANNED IN UNIT via the plan step on this branch — P6's frozen validator read `rg -n 'docs/features/ROADMAP' docs/workflow skills template` exits 1, which no correct delivery can satisfy: the migration prose this phase ships must name the pre-move path to move off it (`MIGRATION.md`, `UPGRADE.md`, the `init-workspace` scaffold probe), and `GOLDEN_FIXTURE.md`'s run log is append-only record (S4). Re-cut to `exits 0` and paired with the reader pin that actually proves the phase (S7's one-literal check, 1 line — the alias definition), declared as S7. `node scripts/phase-lint.mjs docs/fix/319-location-index-consolidation/SPEC.md` · verdict PASS at this head.
- **F9** — 2026-11-02, FOLDED in the cycle-3 batch — root cause: `compileWorkflowSnapshot` conflated "the consolidated index has no `## Fixes` table" (a half-migrated tree, where the documented fallback applies) with "the table exists and does not declare this unit" (a migrated tree, where a stale standalone copy must never shadow it — the crate's own pin). Fix: the fallback is taken only when the consolidated document carries no `## Fixes` heading; a migrated tree's table owns its rows outright. Regression: `packages/agentic-workflow-schema/test/machine-contract.test.mjs` "#319 F9" — red without the fix (unit resolved as `42-slug` from `docs/fix/README.md`), green with it, and the half-migrated control still reads its standalone row. Declared as S7b.
- **F10** — 2026-11-02, FOLDED in the cycle-3 batch — root cause: the crate CLI computed its canonical index by hand and never consulted the shared resolver, so the documented rollback lever (`ROADMAP_LEGACY_READ`) could not re-open the pre-move path there: a legacy-only tree answered "index not found" and lost the `roadmap-moved` pointer. Fix: the CLI resolves the index through `resolveRoadmapSource`, so the lever governs it as it governs every other consumer, and the lever reads one run-time channel (`AGENTIC_WORKFLOW_ROADMAP_LEGACY_READ=1`) an installed package can actually flip. Regression: `packages/agentic-workflow/test/roadmap-check.test.mjs` "the documented rollback lever re-opens the pre-move path for every consumer" — red without the fix, green with it. Declared as S6b.
- **F12** — 2026-11-02, FOLDED in the cycle-3 batch — the fix row for #319 read `in-progress` while feature row 86 read `done · [#351]` in the same document, and the legend defines `done` as built with the PR open; the Notes also named an "alias window" as delivered without disclosing that D4 closed it. Corrected to `done · [#351]` and to what shipped. No regression: the row is data, and `roadmap-settle` reads the settled shape (root suite green).
- **F13** — 2026-11-02, FOLDED in the cycle-3 batch — the changeset named "the tolerant document suffix" among the crate's exports; no such constant exists in either package. Replaced with the `roadmap-moved` code, which is published. Swept the sibling claim in the same sentence (`scripts/roadmap-moved.test.mjs` alone never pinned the schema snapshot — `machine-contract` does), and the low notes from the same review on the same surface: `MIGRATION.md`'s "verbose probe" → `vocabulary probe`, and its pinning sentence now names both suites.
- **G4** — 2026-11-02, the cycle-3 fold gate at the batch head — `node scripts/run-root-suite.mjs` · exit 0 · 1302 pass; `packages/agentic-workflow-schema` `bun run test` · 730 pass; `packages/agentic-workflow` `bun run test` · 259 pass; `packages/pi-agentic-workflow` `bun run test` · 454 pass; `node --test scripts/index-document.test.mjs` · 8 pass; `node scripts/phase-lint.mjs docs/fix/319-location-index-consolidation/SPEC.md` · PASS; `bun scripts/check-skill-context.mjs` · PASS · 28 skills; `node --test scripts/normative-drift.test.mjs` · 20 pass; `node scripts/version-parity-gate.mjs --content --base main` · PASS.
- **R3** — 2026-11-02, review at HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a · verdict REVIEW-FAIL · cycle 3 (delta re-review escalated to a full pass: width — `docs/LOGS.md` outside the cited-file union; size — 282 changed lines > 200) · gate exit 0 · run on the user's explicit instruction past the two-cycle cap
- **G3** — 2026-11-02, `node scripts/run-root-suite.mjs` · exit 0 · 1302 pass, 0 fail; `packages/agentic-workflow-schema` `bun run test` · 729/729; `packages/agentic-workflow` `bun run test` · 258/258; `packages/pi-agentic-workflow` `bun run test` · 454/454; `node --test scripts/roadmap-moved.test.mjs scripts/index-document.test.mjs` · exit 0 · 15/15 (`--demo moved` prints `roadmap-moved`); `bun scripts/check-skill-context.mjs` · PASS · 28 skills; `node --test scripts/normative-drift.test.mjs` · exit 0 · 20/20; `node scripts/version-parity-gate.mjs --content --base main` · exit 0 — all at HEAD a125d0009a4a0e60f0355188948afc59f28b9f4a (reviewer gate run)
- **V19** — packages/agentic-workflow/src/index-document.mjs:198-213 · reviewer review-change --adversarial 2 (R2, confirmed by the orchestrator) · HEAD 55c382530674ff233908e9242a4f33bb3f77d032 · recheck: failing reproducer against unchanged code — a ` ```markdown `-fenced example row under `## Fixes` is returned by `roadmapTableRows(doc, "fix")` as a live data row (`[["[#999](u)","fake-fix","in-progress"],["[#319](u)","real","done"]]`), because the row scanner does not track fences while its own section parser (`roadmapSection`, line 117) does; the schema mirror (`tableFor`/`sectionContent`, index.ts:2083-2141) has the same gap · confirmed
- **R4** — 2026-11-02, review at HEAD 55c382530674ff233908e9242a4f33bb3f77d032 · verdict REVIEW-FAIL · cycle 4 (delta since R3 escalated to a full pass: width — `docs/LOGS.md` outside the cited-file union; size — 253 changed lines > 200) · adversarial 2 reviewers (R1 correctness/logic, R2 security/inputs), 6 confirmed candidates, 1 fix-now persisted (F14) · gate exit 0 · run on the user's explicit instruction past the two-cycle cap
- **G5** — 2026-11-02, `node scripts/run-root-suite.mjs` · exit 0 · 1302 pass, 0 fail; `packages/agentic-workflow-schema` `bun run test` · 730/730; `packages/agentic-workflow` `bun run test` · 259/259; `packages/pi-agentic-workflow` `bun run test` · 454/454; `node --test scripts/roadmap-moved.test.mjs scripts/index-document.test.mjs` · exit 0 · 15/15 (`--demo moved` prints `roadmap-moved`); `bun scripts/check-skill-context.mjs` · PASS · 28 skills; `node --test scripts/normative-drift.test.mjs` · exit 0; `node scripts/version-parity-gate.mjs --content --base main` · exit 0 PASS; `bun scripts/promise-coherence.mjs` · verdict PASS — all at HEAD 55c382530674ff233908e9242a4f33bb3f77d032 (reviewer gate run)
- **F14** — 2026-11-02, FOLDED at the batch head below — root cause: `roadmapTableRows` scanned section lines for rows without tracking fences, while the sibling `roadmapSection` tracked them, so one document had two fence grammars; a fenced (or indented) example row — the shape the index itself teaches writers — was ingested as a live data row by the sensor, the router, the crate's `checkUnitDoc` and the schema mirror, and a `~~~` block was "closed" by a backtick line. Fix: one exported grammar owns it (`fenceRun`, CommonMark's rule — a block closes only on a run of the character that opened it, at equal-or-greater length, with nothing but spaces after) plus `isLiveTableRow`; `roadmapSection` and `roadmapTableRows` both decide through it, the schema mirror holds the same rule as `indexFenceRun`/`tableRowCells` (and its `tableCells` now slices boundary pipes exactly as the crate does, so each cell is `cells[i]` on both sides). Regression: `packages/agentic-workflow/test/roadmap-check.test.mjs` "#319 F14: the row scanner reads one fence grammar, so a fenced example is never a live row" and `packages/agentic-workflow-schema/test/machine-contract.test.mjs` "#319 F14: a fenced example row is never a unit, on either published side" — both red without the fix, green with it. Swept: the three row scans in the tree (`roadmapTableRows`, `parseIndexRows`, `tableRowCells`) and the schema's duplicated pipe-slicing.
- **V20** — packages/agentic-workflow/src/index-document.mjs:207 · reviewer review-change · HEAD 402bdbf1b325188bcd3641bf33c64f014b2f7e1b · recheck: direct module comparison of both `tableCells` implementations over row shapes at the reviewed head — a row without a trailing pipe (`| 12 | topic \| sub | in-progress | x`) yields `["12","topic | sub","in-progress"]` in the crate (the unconditional `slice(1, -1)` drops the last data cell) vs `["12","topic | sub","in-progress","x"]` in the schema (conditional trailing strip keeps it); a leading-escaped row with a trailing pipe yields `[]` in the crate vs one cell in the schema — F14's "each cell is `cells[i]` on both sides" holds only for rows that carry a trailing pipe · confirmed
- **V21** — packages/agentic-workflow-schema/src/index.ts:2196,2216 · reviewer review-change · HEAD 402bdbf1b325188bcd3641bf33c64f014b2f7e1b · recheck: failing reproducer against unchanged code — `compileWorkflowSnapshot` over a `## Features` table whose in-progress row carries an escaped `\|` resolves the unit with provenance `line: 1` (the normalized `cells.join(" | ")` row is not a substring of the document, so `lineNumber` returns its miss sentinel); the identical row without the escape resolves `line: 7`; the pre-fold code passed the raw source line and hit exactly · confirmed
- **V22** — docs/fix/319-location-index-consolidation/SPEC.md `## Log` · reviewer review-change · HEAD 402bdbf1b325188bcd3641bf33c64f014b2f7e1b · recheck: direct read — zero non-quotation Log hits for #316/#315/#318 (the only hits are S1's frozen body quotes and V8's own text); the merges themselves are verified on `git log main --grep=316` — S3's "recorded in the unit Log" clause stays unmet; the F6 restoration rebuilt the pre-fold Log verbatim and the pre-fold Log never carried the S3 evidence line either · confirmed
- **R5** — 2026-11-02, review at HEAD 402bdbf1b325188bcd3641bf33c64f014b2f7e1b · verdict REVIEW-FAIL · cycle 5 (delta re-review escalated to a full pass: width — `packages/agentic-workflow-schema/src/pre-execution.ts` outside the F14 cited-file union; size — 287 changed lines > 200) · single-reviewer run, adversarial recommendation surfaced in the report · gate: G6 consumed at the identical head · run on the user's explicit instruction past the two-cycle cap
- **G6** — 2026-11-02, the F14 fold gate at the batch head — `node scripts/run-root-suite.mjs` · exit 0 · 1302 pass; `packages/agentic-workflow` `bun run test` · 260 pass; `packages/agentic-workflow-schema` `bun run test` · 731 pass; `packages/pi-agentic-workflow` `bun run test` · 454 pass; `node --test scripts/roadmap-moved.test.mjs scripts/index-document.test.mjs` · exit 0 · 15 pass; `bun scripts/check-skill-context.mjs` · PASS · 28 skills; `node --test scripts/normative-drift.test.mjs` · 20 pass; `node scripts/version-parity-gate.mjs --content --base main` · PASS; `bun scripts/promise-coherence.mjs` · verdict PASS; `node scripts/phase-lint.mjs docs/fix/319-location-index-consolidation/SPEC.md` · verdict PASS
