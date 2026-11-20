---
type: feature
scope: large
---

# 651 — doc retention

> One-line: a settled third unit-doc carrier plus a deterministic, stamp-gated trim/archive step, so a merged unit collapses to its permanent record while everything else stays restorable from a gitignored archive.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Apply issue #651 to this repository.**
> Apply to this repository: issue #651

**S2 — Third accepted carrier `settled`.**
> **Third accepted unit-doc carrier `settled`** following the #308 precedent: `validate()` resolves the shape from the document's own headings — `legacy`, `spec-by-reference` and `settled` are all valid forever, per document (mixed-state rule: a repo that toggled archiving on and off carries both full and settled docs, all valid). Mirrored in both packages with the existing parity test; a `normative-surfaces@1` row for the new carrier grammar; `DOC_PROVENANCE_FORMATS` gains the settled format const and `deriveFormat()` learns it (schema-const change).

**S3 — Settled SPEC grammar.**
> **Settled SPEC grammar** — keeps: frontmatter + `roadmap_summary:`, one-line, Objective/Specs, ACs, Impact, Non-goals, Future, Future cost, Known pre-existing issues, `## Log` (`L1` + `D` + one-line `F`/`R`/`V` marks), References. Trims: Tasks, Findings table (empty post-merge), Evidence rows → one digest line, Next, Applicable tests.

**S4 — File trim matrix.**
> **File trim matrix** (files move to the gitignored archive before any deletion):
>
>   - TRIM → archive: `TASKS.md`, `PLAN.md`, `progress.md`, `ACCEPTANCE.md` (legacy), `testing.md`, `CHECKLIST.md`, `BRIEF.md`, `pr-body.md`, `external-verify.md`, `review-findings.md` (all-folded legacy), `planning-findings.md`.
>   - KEEP: `SPEC.md` (settled), `decisions.md`, `known-issues.md`, `planning-obligations.md`, `planning-evidence.md`, `architecture-notes.md`, `sources.md`, `research.md`.
>   - KEEP outside units: `docs/LOGS.md`, journal fragments, `docs/audits/`, `docs/passive/`, `docs/research/`, `TIER_COST.md`.

**S5 — Single write path with dry-run, archive and restore.**
> **Write path (single)**: `agentic-workflow doc archive [--dry-run] [--unit <id>] [--all-eligible]` + `doc restore` — projection-manifest@1 `remove` + `contentHash` binding, atomic per unit, refuses non-proved-merged units and non-stamped/older-format docs (out-of-scope items reported visibly in the dry-run report, never silently skipped), re-stamps provenance at settle, stages files into the gitignored archive, then calls the project-declared seam hook for offsite copy; local deletion only after the configured retention window (default: never).

**S6 — Mixed-state validity.**
> **Mixed-state validity**: config gates only whether the trim step runs, never validation; a half-trimmed doc satisfies neither carrier → fails closed everywhere (the contentHash binding makes the trim atomic).

**S7 — Config `docRetention`.**
> **Config `docRetention`**: base section in the unified config (#427 home), schema-first in `packages/agentic-workflow-schema/src/config.ts`, default `keep-all`, offered by `init-workspace`, changeset + roadmap row.

**S8 — Detection surfaces.**
> **Detection surfaces**: `workflow-status` gains `retention.pending_trim[]` (deterministic predicate: proved-merged + full carrier + threshold) with the archive command projected at `next.continuation`; product-audit gains the retention-debt dimension reusing the same predicate; the conductor close-out (`unit-cycle`/`advance`) consumes `pending_trim[]` when `docRetention` allows.

**S9 — Trim ceremony declaration.**
> **Trim ceremony declaration**: every new section, file or template change declares trimmable-or-kept as part of the ceremony (mechanism shape decided at planning: template annotation vs retention-declaration block).

**S10 — Reader reconciliation.**
> **Reader reconciliation**: `findings-corpus.mjs` (one-line marks survive), `readLogMarks` (declare D survives / G,F,R,V collapse to their one-liners), `docs-generate.mjs` `hasTasks` status derivation learns the settled carrier, review-mark freshness guard (trim refuses non-proved-merged), relay `obligationsOf` pin (lane-time only), `Verify.mjs` pin.

**S11 — Pre-plan re-mapping before the plan freezes.**
> Before the plan is frozen, the analysis this issue records MUST be re-run against the tree as it stands then: new sections/files created since 2026-11-19, commands that read the candidate-to-trim sections or the settled sections, and every lateral effect of features and fixes landed in the meantime (new readers, new vocabularies, new template surfaces). The issue body is the record of the 2026-11-19 analysis, not a substitute for the fresh one; its findings land in the unit doc's planning ledgers.

## Re-analysis (S11 — run at this cut, not inherited from the issue body)

Re-derived from the tree at `ab8fad926` before the plan froze:

- **Carrier resolution** is one table, `UNIT_DOC_SECTION_SHAPES` in
  `packages/agentic-workflow-schema/src/pre-execution.ts`, and every reader
  iterates it (`src/edit/UnitDoc.mjs`, `src/runner/unit-route.mjs`,
  `src/runner/sensors/workflow-status.mjs`, `src/verify/Verify.mjs`,
  `scripts/findings-corpus.mjs`). Adding `settled` to that table is therefore
  the whole carrier change; no reader keeps a private section list.
- **Carrier derivation** is `deriveFormat()` → `DOC_FORMAT_SHAPES`
  (`doc-provenance.ts`), one shape → format table. `CURRENT_READER` names its own
  generation, so a settled carrier needs a new format token (`unit-doc@3`) and
  the reader's generation must advance with it, or every settled document refuses
  as `format-newer-than-reader`.
- **`config.schema.json`** is a generated projection asserted against
  `composeConfigSchema(BASE_CONFIG_SECTIONS)`
  (`test/config-schema-artifact.test.mjs`), so the new section must be
  regenerated, never hand-edited.
- **The envelope is strict**: `packages/agentic-workflow-schema/src/index.ts`
  rejects an unknown top-level key and an unknown `detail` key
  (`DETAIL_KEYS`), so the retention projection must be declared there.
- **Merge proof already exists** in the sensor (`makeMergeResolver`,
  `merged` set) and in the roadmap/index row status; the trimmer reuses the
  status half offline and the resolver half in the sensor (decision D4).
- **Section readers tolerate extras** and only refuse a *foreign* accepted-shape
  section, so `Acceptance criteria`, `Surfaces`, `Retirements` and `Risk tier`
  must be in the settled required list (or absent) or every settled unit doc
  would fail its own shape check.
- **`readLogMarks`** already keeps `D`, `F`, `R`, `V` and `G`; the trimmer never
  edits a `## Log` line, so S10's "declare D survives" holds by construction and
  the settled grammar keeps the whole section.
- **`docs-generate.mjs`** derives a rowless feature's status from `hasTasks`;
  a settled unit has no `## Tasks`, so the derivation must learn the settled
  carrier or every settled unit flips back to `defined`.
- **`relay obligationsOf`** reads the obligations ledger files that the trim
  matrix KEEPs (`planning-obligations.md`); it needs no change, only a pin.
- **Mid-cut tree movement (S11 re-run after `origin/main` moved).** Unit 632
  (`model-aware-phase-batching`, `#658`) landed while this plan was being cut. It
  adds `packages/pi-nan-agentic-workflow` and a `phaseBatching` **extension**
  section, four `normative-surfaces@1` rows, four ids in the gate inventory's
  `normative-surface-grammar` cell, and a `## Phase batching` section in
  `docs/workflow/CONFIG.md`. It touches none of this unit's carriers
  (`pre-execution.ts`, `doc-provenance.ts`, the unit-doc templates, the
  sensor's `detail` licence) — the merge is additive for this plan. The lateral
  effects it does create are work this plan must do the same way: the new
  normative row and the gate-inventory cells are edited in the same pass as the
  existing ones (P5), the `docRetention` row lands in `docs/workflow/CONFIG.md`
  beside the `phaseBatching` row (P7), and every new root suite declares its
  `test-obligation:` tag (P5/P6) because `test-obligation-tags` refuses a suite
  without one.

## Acceptance criteria

One criterion per requirement; the named check is what proves it.

1. **AC1 (S2)** — `validate()` resolves `legacy`, `spec-by-reference` and
   `settled` from the headings, and the same table is published in both packages:
   `bun test packages/agentic-workflow-schema/test/doc-retention.test.mjs` and
   `bun test packages/agentic-workflow/test/settled-carrier.test.mjs` exit 0.
2. **AC2 (S3)** — the settle projection keeps exactly the settled section set and
   collapses the evidence table into one `E` log line:
   `bun test packages/agentic-workflow/test/doc-retention.test.mjs` exits 0.
3. **AC3 (S4)** — the trim/keep matrix is one published pair of consts and the
   archive moves exactly the trimmable files:
   `bun test packages/agentic-workflow-schema/test/doc-retention.test.mjs` exits 0.
4. **AC4 (S5)** — `doc archive --dry-run` prints the eligibility report (including
   out-of-scope rows), the write path refuses a non-proved-merged unit before any
   byte moves, and `doc restore` reconstructs the trimmed files:
   `bun test packages/agentic-workflow/test/doc-retention.test.mjs` exits 0.
5. **AC5 (S6)** — a half-trimmed document satisfies neither carrier and fails
   closed in the writer, the verifier and the sensor:
   `bun test packages/agentic-workflow/test/settled-carrier.test.mjs` exits 0.
6. **AC6 (S7)** — `docRetention` is a base config section defaulting to
   `keep-all`, and the committed `config.schema.json` is its generated
   projection: `bun run --cwd packages/agentic-workflow-schema check:config-schema`
   exits 0.
7. **AC7 (S8)** — the sensor emits `detail.retention.pending_trim[]` and projects
   the archive command at `next.continuation` only for the nothing-to-do case;
   the retention-debt producer reuses the same predicate:
   `bun test packages/agentic-workflow/test/workflow-status-retention.test.mjs`
   and `bun test scripts/retention-debt.test.mjs` exit 0.
8. **AC8 (S9)** — the templates carry a `retention-declaration@1` block whose
   rows agree with the published matrix:
   `bun scripts/retention-declaration.mjs --check` exits 0.
9. **AC9 (S10)** — the settled fixture keeps `docs-generate`, `findings-corpus`
   and the log marks green: `bun test scripts/docs-generate.test.mjs` and
   `bun test scripts/findings-corpus.test.mjs` exit 0.
10. **AC10 (S11)** — `## Re-analysis` above cites the cut revision and each
    reader the settled carrier reaches.

## Impact

- **Consumers of the carrier table**: `src/edit/UnitDoc.mjs`,
  `src/runner/unit-route.mjs`, `src/verify/Verify.mjs`,
  `src/runner/sensors/workflow-status.mjs`, `scripts/findings-corpus.mjs`,
  `scripts/docs-generate.mjs`. All read `UNIT_DOC_SECTION_SHAPES`; adding
  `settled` changes `resolveUnitDocShape`'s answer for an already-settled
  document from `null` to `settled`, which is the point.
- **Consumers of the reader generation**: every `readDocProvenance` call site
  sees `unit-doc@2` documents degrade (`format-older-compatible`) instead of
  `current`. No call site branches on `current`; the pinned tests that assert it
  move their canonical fixture to the new generation and keep the @2 case pinned
  as a degradation.
- **`config.schema.json`** changes; `config validate|init|schema|list` gain the
  section automatically (they are generated from the registry).
- **The envelope's `detail` licence** grows by one key; a consumer that rejects
  unknown keys must learn `retention` (only the schema package does).
- **`scripts/normative-drift.test.mjs`** reads the `normative-surfaces@1` block,
  so the new grammar row must resolve (a `block:` in `ARCHITECTURE.md`).
- **`docs/generated/**`** is regenerated by the emitter; no hand edit.
- **What stops being true**: "`docs/features/<unit>/` always carries its
  `progress.md`/`TASKS.md`" — after a settle they live in the archive, and the
  unit doc says where.
- **Ask before touching**: the live `docs/features/` tree — the trimmer only runs
  in scratch during this unit; the repository's own units are never settled by
  this change.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`
- `scripts`
- `skills/workflow-status`
- `skills/product-audit`
- `skills/unit-lane`
- `skills/init-workspace`
- `template`
- `docs`

## Retirements

None. The unit is strictly additive: one new carrier, one new format token, one
new config section, one new envelope key, one new command pair, one new producer.
Every existing carrier, format token and section keeps working
(`legacy`, `spec-by-reference`, `unit-doc@1`, `unit-doc@2`), so no name is
reclaimed and no surface is deleted.

## Non-goals

- GitHub Action automation, forge webhooks, per-merge extra PRs (owner decision:
  vendor lock). Detection and application stay sensor/product-audit/CLI/manual.
- Unversioned docs (pre-#462 stamp): out of scope forever. The documented
  eligibility path is a provenance re-stamp.
- Promotion of cross-cutting decisions to permanent docs — companion issue #650.
- The local post-merge announce hook — deferred until a user demands it.
- Editor/UI for browsing the archive — `doc restore` plus git is the interface.
- Settling this repository's own existing units. This unit ships the mechanism;
  applying it is a separate, owner-triggered sweep.

## Risk tier

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none — not a high-tier unit (`passive`/`standard`
  docs and library code; the write path is gated behind the archive command and
  is exercised only in scratch fixtures).

Computed with `bun packages/agentic-workflow/bin/agentic-workflow.mjs runner
ceremony tier classify --help` at plan time; the change is code plus docs with no
destructive path reachable from an existing command.

## Future

none

## Future cost

- **The trim matrix is one pair of consts.** A future file added to a unit folder
  must be classified in `UNIT_DOC_TRIM_FILES` or `UNIT_DOC_KEEP_FILES`; a file in
  neither is reported `unclassified` by `doc archive --dry-run` and refuses the
  write path rather than being guessed. Binds every later unit-doc carrier change.
- **The settled required list is a carrier contract.** Adding a settled section
  means editing `UNIT_DOC_SETTLED_SECTIONS` and the template together; a settled
  document carrying a section from another shape fails closed. Binds the carrier
  owners.
- **The archive manifest is the restore contract.** Changing its shape is a
  projection-manifest generation change, never a silent extension. Binds anyone
  touching `src/retention/retention.mjs`.

## Applicable tests

- `bun test packages/agentic-workflow-schema/test/doc-retention.test.mjs`
- `bun test packages/agentic-workflow/test/settled-carrier.test.mjs`
- `bun test packages/agentic-workflow/test/doc-retention.test.mjs`
- `bun test packages/agentic-workflow/test/workflow-status-retention.test.mjs`
- `bun test scripts/retention-debt.test.mjs`
- `bun test scripts/retention-declaration.test.mjs`
- `bun test scripts/docs-generate.test.mjs` (settled fixture)
- `bun test scripts/findings-corpus.test.mjs` (settled fixture)
- `bun test packages/agentic-workflow-schema/test/config-schema-artifact.test.mjs`
- `bun test packages/agentic-workflow-schema/test/doc-provenance.test.mjs`
- `bun scripts/retention-declaration.mjs --check`
- `bun scripts/test-obligation-tags.mjs`
- `bun scripts/check-skill-context.mjs`

## Known pre-existing issues

- `packages/agentic-workflow-schema/test/doc-provenance.test.mjs` pins
  `unit-doc@2` as the current reader generation. **Affects** this unit: the
  canonical fixture moves to `unit-doc@3` and the @2 case stays pinned as a
  degradation (decision D2), because the reader's own generation is the axis the
  settled carrier advances.
- `docs/generated/**` is a projection with a gitignored-merge driver armed
  optionally. **Does not affect** this unit: the emitter runs before the handoff.

## Tasks

- P1 — Publish the settled carrier, the provenance format token, the trim matrix, the retention predicate and the `docRetention` config section in the schema package, with their suites.
  (Implements: S2, S4, S6, S7)
  (validator: `bun test packages/agentic-workflow-schema/test/doc-retention.test.mjs` exits 0)
  - Relevant files: packages/agentic-workflow-schema/src/pre-execution.ts, packages/agentic-workflow-schema/src/doc-provenance.ts, packages/agentic-workflow-schema/src/doc-retention.ts, packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/src/index.ts
- P2 — Implement the pure settle projection and the eligibility report in the crate, with its suite.
  (Implements: S3, S4, S6)
  (validator: `bun test packages/agentic-workflow/test/doc-retention.test.mjs` exits 0)
  - Relevant files: packages/agentic-workflow/src/retention/retention.mjs
- P3 — Wire `doc archive [--dry-run] [--unit] [--all-eligible]` and `doc restore`, the archive manifest and the refuse-before-write path, with its suite.
  (Implements: S5, S7)
  (validator: `bun test packages/agentic-workflow/test/doc-retention.test.mjs` exits 0)
  - Relevant files: packages/agentic-workflow/src/retention/retention.mjs, packages/agentic-workflow/src/doc/grammar.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — Project `detail.retention.pending_trim[]` and the nothing-to-do continuation in the workflow-status sensor, with its suite.
  (Implements: S8)
  (validator: `bun test packages/agentic-workflow/test/workflow-status-retention.test.mjs` exits 0)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/workflow-status.mjs
- P5 — Reconcile the readers: settled status derivation in `docs-generate`, the settled fixture in `findings-corpus`, the retention-debt producer for product-audit, the new normative-surface row, the gate-inventory row+cell, and the obligation tags on every new root suite.
  (Implements: S8, S10)
  (validator: `bun test scripts/retention-debt.test.mjs` exits 0)
  - Relevant files: scripts/docs-generate.mjs, scripts/retention-debt.mjs, scripts/retention-reconciliation.test.mjs, AGENTS.md, docs/architecture/ARCHITECTURE.md, docs/workflow/GATE_INVENTORY.md
- P6 — Ship the `retention-declaration@1` block in the templates and its `--check` gate.
  (Implements: S9)
  (validator: `bun scripts/retention-declaration.mjs --check` exits 0)
  - Relevant files: template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md, docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, scripts/retention-declaration.mjs
- P7 — Write the doctrine: the retention procedure and the re-stamp path in `ARCHITECTURE.md`, the four skill surfaces, the `docRetention` row in `docs/workflow/CONFIG.md`, the changeset and the roadmap row.
  (Implements: S8, S9, S11)
  (validator: `bun scripts/normative-drift.test.mjs` exits 0)
  - Relevant files: docs/architecture/ARCHITECTURE.md, docs/workflow/CONFIG.md, skills/workflow-status/SKILL.md, skills/product-audit/references/AUDIT_DIMENSIONS.md, skills/unit-lane/SKILL.md, skills/init-workspace/SKILL.md, .changeset/
- P8 — Verification: every declared suite plus the project gate, and the differential check against the base commit.
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11)
  (validator: `bun scripts/local-gate.mjs --push-base main` exits 0)
  - Relevant files: (whole change)

### Planning evidence

The ledger lives beside this document: [`planning-evidence.md`](planning-evidence.md).

### Obligations

The ledger lives beside this document: [`planning-obligations.md`](planning-obligations.md).

## Triaged steps

> Cut inline (this unit runs the local application workflow, not the lane's
> triage). The step list is the `## Tasks` order above: P1 → P8.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-22, the request, verbatim:
  ```
  Apply to this repository: issue #651
  ```
- **L2** — 2026-11-22, mid-cut correction, verbatim:
  ```
  Ha habido un merge nuevo que está en origin/main, añadelo y revisa por si tienes que replanificar
  ```
- **D1** — 2026-11-19, the issue's binding owner decisions (kept as the issue records them): the settled `## Log` keeps the one-line `F`/`R`/`V` marks; no GitHub Action and no extra PR per merge; `architecture-notes.md` and `planning-evidence.md` are KEEP; unversioned docs are out of scope forever (stamp-gated); detection is sensor + product-audit in this iteration.
- **D2** — 2026-11-22, this cut's own decisions — the settled carrier is `unit-doc@3` with the section set and the shared-section tolerance, the reader generation advances, the matrix has one owner, proved-merged has an offline and an online proof, the archive layout and restore contract, the `docRetention` shape, `detail.retention` as the sensor surface, the declaration block, and `G`-line survival by construction: [`decisions.md`](decisions.md).
- **D3** — 2026-11-22, mid-cut replan (L2): unit 632 (`#658`) landed on `origin/main` and was integrated at `8f8537a98`; it is additive for this plan, and its four new normative rows, its `CONFIG.md` section and the obligation-tag rule are folded into P5/P7 by the `## Re-analysis` section. No objective, obligation or acceptance criterion changed.
- **P1** — 2026-11-22 09:10, froze the unit doc, its decisions and both planning ledgers (30 obligations, 18 evidence rows) · `48d92be7e`.
- **P2** — 2026-11-22 09:20, cut the schema corpus red, then published the settled carrier, `unit-doc@3`, the trim matrix, the eligibility predicate, the archive manifest and the `docRetention` section; regenerated `config.schema.json` · `e25a140ac` → `aed627b0c`.
- **P3** — 2026-11-22 09:40, cut the write-path suite red, then implemented the settle projection, the assessment, the dry-run report and the archive/restore write path; wired `doc archive|restore` after cutting its own CLI suite red · `9a12de354`, `ef0cee2ac` → `8b655bcff`.
- **P4** — 2026-11-22 10:05, projected `detail.retention.pending_trim[]`, the declared out-of-scope rows and the nothing-to-do continuation in the sensor · `36808f35f`.
- **P5** — 2026-11-22 10:40, reconciled the readers (`docs-generate` settled status derivation, `findings-corpus` log marks without a findings table), cut the audit producer and the declaration gate red, then shipped both, the four template declarations, the four normative rows, the two gate-inventory rows, the workflow page, the CLI section, the config row, the four skill surfaces, the changeset and the roadmap status · `ba2a8f217` → `56fe60f40`.
- **P6** — 2026-11-22 11:05, the P8 pass: added the missing `settled-carrier.test.mjs` (parity, mixed state, half-state fail-closed), fixed the writer to tolerate a section two accepted carriers share (`## Acceptance criteria`, which the settled carrier requires) and deleted the verifier's string-matched carve-out it supersedes, pointed `ARCHITECTURE.md` at the procedure and the re-stamp path, and extended the frozen dimension set with `Retention debt`.
- **E1** — 2026-11-22, `bun test packages/agentic-workflow-schema/test/doc-retention.test.mjs` · exit 0 · `6 pass 0 fail` (O1, O4, O8, O17).
- **E2** — 2026-11-22, `bun test packages/agentic-workflow/test/settled-carrier.test.mjs` · exit 0 · `4 pass 0 fail` (O2, O15, O30).
- **E3** — 2026-11-22, `bun test packages/agentic-workflow-schema/test/doc-provenance.test.mjs` · exit 0 · `15 pass 0 fail` (O5).
- **E4** — 2026-11-22, `bun test packages/agentic-workflow/test/doc-retention.test.mjs` · exit 0 · `12 pass 0 fail` (O6, O7, O9, O10, O11, O12, O13, O14).
- **E5** — 2026-11-22, `bun test packages/agentic-workflow/test/doc-retention-cli.test.mjs` · exit 0 · `5 pass 0 fail` (O10, O11, O13, O16, O17).
- **E6** — 2026-11-22, `bun test packages/agentic-workflow/test/workflow-status-retention.test.mjs` · exit 0 · `4 pass 0 fail` (O18, O19).
- **E7** — 2026-11-22, `bun run --cwd packages/agentic-workflow-schema check:config-schema` · exit 0 · `config.schema.json: current` (O16).
- **E8** — 2026-11-22, `bun test scripts/retention-debt.test.mjs` · exit 0 · `4 pass 0 fail` (O20).
- **E9** — 2026-11-22, `bun test scripts/retention-declaration.test.mjs` · exit 0 · `6 pass 0 fail` (O22).
- **E10** — 2026-11-22, `bun scripts/retention-declaration.mjs --check` · exit 0 · `4 templates, 19 rows each, verdict PASS` (O22).
- **E11** — 2026-11-22, `bun test scripts/docs-generate.test.mjs` · exit 0 · `31 pass 0 fail` (O23).
- **E12** — 2026-11-22, `bun test scripts/findings-corpus.test.mjs` · exit 0 · `15 pass 0 fail` (O24).
- **E13** — 2026-11-22, `bun test scripts/normative-drift.test.mjs` · exit 0 · `22 pass 0 fail` (O3).
- **E14** — 2026-11-22, `bun scripts/lint-changeset.mjs` · exit 0 · `ok 651-doc-retention.md` (O27).
- **E15** — 2026-11-22, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/651-doc-retention/SPEC.md` · exit 0 · `verify@1` receipt, 30 obligations closed, no violations (read live on this working tree).
- **E16** — 2026-11-22, `rg -c 'retention\.pending_trim' skills/unit-lane/SKILL.md` → `1`; `rg -c 'provenance re-stamp' docs/architecture/ARCHITECTURE.md` → `1`; `rg -c '^## Re-analysis' docs/features/651-doc-retention/SPEC.md` → `1`; `rg -c 'docRetention' skills/init-workspace/SKILL.md` → `1` (O21, O25, O26, O28).
- **E17** — 2026-11-22, `bun scripts/dimension-regression.mjs --root . --base origin/main` · exit 0 · `20 dimensions · changed review surfaces 3 · evidence docs/features/651-doc-retention/SPEC.md · clean` (the guard's own contract, satisfied by this `## Log`).
- **G1** — 2026-11-22, `HEAD 3a7d8e6ff8a163835aee7a795ebe73971f4bbdb7`, `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 19 step(s) in 829s`.
- **G2** — 2026-11-22, `HEAD 3e724794a922466f3248802fe16c89263f02042a`, `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 19 step(s) in 840s` (the receipt head; the run covers every step, `root-suite`, both crate legs, the schema and pi node-compat legs included).
- **R1** — 2026-11-22, `HEAD 3a7d8e6ff8a163835aee7a795ebe73971f4bbdb7` · no review run on this change: the owner's local application workflow runs the unit inline and the owner is the external verifier, so the gate is the receipt and no `review-change` receipt is claimed.

## Next

The owner's external verification (`/aw-local-review` on the head); nothing is
self-approved here.

## References

- Issue [#651](https://github.com/gtrabanco/agentic-workflow/issues/651) — the
  feature record (analysis of 2026-11-19).
- Roadmap row `651 · doc-retention` (`docs/ROADMAP.md`).
- Companion: issue #650 (decision promotion, shipped).
- Carrier precedent: issue #308 (`spec-by-reference`), issue #462 (the stamp).
