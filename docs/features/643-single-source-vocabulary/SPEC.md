---
type: feature
scope: medium
---

# 643 — single-source-vocabulary

> One-line: every closed vocabulary the workflow publishes has exactly one
> machine owner — `@gtrabanco/agentic-workflow-schema` — and every consumer
> imports it. The runner crate stops carrying literal copies, the pin lives in
> one suite, and `gate-rejection-type` stops being a vocabulary whose only
> machine home is the prose that names it.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#` quoting the requester's own words verbatim.
`S1` is the turn's instruction; `S2…S11` quote issue #643, which `S1` adopts as
the request.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #643

**S2 — The goal: one owner, consumers import.**
> Consolidate **every closed vocabulary of the workflow** into `@gtrabanco/agentic-workflow-schema` as the single source of truth. The runner crate (`packages/agentic-workflow`) imports vocabularies from the schema package — the dependency and the import pattern already exist and are used by 13 modules — instead of carrying literal copies. The only permitted exception is the **named pre-build cold path**, and each mirror there is pinned in one central suite.

**S3 — The invariant.**
> **Vocabulary residency (`vocabulary-residency@1`).** `@gtrabanco/agentic-workflow-schema` is the single owner of every closed vocabulary that a published contract names (an envelope, a grammar block, a receipt, a README contract section). Consumers import from it. A literal copy is permitted **only** inside a named pre-build entrypoint (below), and every such copy carries (a) the named guarantee in its header and (b) one pin in `scripts/vocabulary-parity.test.mjs` — the only suite that may pin copies. Runner-internal implementation enums that no published contract names stay in the runner, classified in this issue's Class 3 list. Adding a token is a schema-const + consumer-update + (grammar-block if surfaced) change in one PR.

**S4 — The named pre-build cold path (owner confirms at planning).**
> **Named pre-build cold path (proposed; owner confirms at planning):** the writer/verifier commands that must run before `npm run build` exists on a fresh clone — `src/doc/**`, `src/edit/**`, `src/index-document.mjs`, `src/verify/Verify.mjs`, `src/writer/shared-merge.mjs` (merge driver), git hooks. Verified today: `src/doc/**` imports nothing from the schema (cold path intact); `config/api.mjs`, `content-guard.mjs`, `telemetry/*`, `runner/sensors/*`, `runner/risk-tiers.mjs`, `runner/ceremony/findings.mjs`, `guard/git-identity.mjs` already import the schema at runtime, proving the import pattern works.

**S5 — Class 1: delete the literal, import the const.**
> Files **not** on the list (rows 1, 2, 5, 7, 8, 9, 10): delete the literal, import from `@gtrabanco/agentic-workflow-schema`, delete the scattered pin (the import cannot drift), keep the inventory row working by re-pointing its `schema-export` file cell.

**S6 — Class 2: runner-resident vocabularies move to the schema.**
> These consts are machine vocabularies of normative surfaces (the inventory rows exist), so per the invariant they move to the schema package; the runner imports them and re-exports where a public path exists today:

**S7 — `gate-rejection-type` gets a machine home.**
> gate-rejection-type vocabulary | **prose only** (`POLICY.md` §8, `gate-rejection-vocabulary@1`) | `gate-rejection-vocabulary` (`must-name: yes`) — publish as a schema const, `POLICY.md`'s block becomes a rendered restatement bound by `rendered-facts@1`, the drift gate stops treating prose as the machine

**S8 — Class 3 is classified, not assumed.**
> The unit's audit step runs the residency test over **every** runner const and lands each in Class 1/2/3 with a one-line reason — this list is the seed, not the verdict.

**S9 — The prose drift audit.**
> Deliverable: a script-driven, token-by-token comparison of every versioned grammar block (`block:`/`table:`/README contract sections) against the const it restates, with every mismatch classified (prose error → fix prose; machine error → schema change; intentional alias → documented projection).

**S10 — The stale rationales die and the pin carrier finishes its contract.**
> 4. **The stale comments die**: *"This crate does not depend on the schema package"* (`src/passes/names.mjs`), *"until issue #427 unifies the reading"*, and the equivalent rationales in `ceremony-profile.mjs`/`materialize.mjs` headers. 5. **D2's contract completes**: `scripts/vocabulary-parity.test.mjs` header updated to state the finished rule (import-first; mirror-only on the named list; this suite is the only pin carrier) and gains the missing pins.

**S11 — The recorded acceptance.**
> - `rg -n "Object.freeze\(" packages/agentic-workflow/src/` — every remaining hit is Class 3 or carries the named-pre-build header; count recorded before/after.
> - One real-import parity script: import every mirror still standing and its schema owner, `deepEqual` — green, and it lives in `scripts/vocabulary-parity.test.mjs` only.
> - `bun scripts/normative-drift.test.mjs`, `bun test scripts/vocabulary-parity.test.mjs`, both crate suites, `bun scripts/local-gate.mjs` — green.
> - `scripts/residue-dimensions.test.mjs` still green (no rule name appears outside its owner without a pointer — the new invariant is linked, never restated).
> - Budgets: AGENTS.md machine region re-pinned for the inventory re-pointing; `bun scripts/check-skill-context.mjs --documents` green.

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it.

| AC | Criterion | Check |
|---|---|---|
| AC-1 (S1, S4) | The named pre-build cold path is decided from evidence, not preference: the decision row records that it is **empty** because the crate's only entry already resolves the built schema | `docs/features/643-single-source-vocabulary/decisions.md` carries `D1` with the `bin/agentic-workflow.mjs` → `src/config/api.mjs` import chain, and `bun test scripts/vocabulary-parity.test.mjs` exits 0 |
| AC-2 (S2, S5) | No crate module carries a literal copy of a name the schema publishes: every Class 1 name is imported | `bun test scripts/vocabulary-parity.test.mjs` exits 0 (the residency case, `class-1` rows) |
| AC-3 (S2, S6) | Every Class 2 vocabulary is published by the schema package and imported by the runner; the crate keeps exporting each name from its historical path | `bun test scripts/vocabulary-parity.test.mjs` exits 0 (the `class-2` rows) and `bun test packages/agentic-workflow/test` exits 0 |
| AC-4 (S3) | `vocabulary-residency@1` is stated once in `docs/architecture/ARCHITECTURAL_INVARIANTS.md`, and every other surface cites it instead of restating it | `bun test scripts/residue-dimensions.test.mjs` exits 0 and `rg -c 'vocabulary-residency@1' docs/architecture/ARCHITECTURAL_INVARIANTS.md` matches 1 |
| AC-5 (S7) | `gate-rejection-type` is published by the schema as a closed const with the six printed types, and `POLICY.md`'s block is recomputed against it | `bun test scripts/normative-drift.test.mjs` exits 0 (the `restates` case) |
| AC-6 (S7) | `rendered-facts@1` carries the row that binds `gate-rejection-vocabulary@1` to the published const, in both directions | `bun test scripts/normative-drift.test.mjs` exits 0 (a dropped token, an invented token, and a dropped row each refuse) |
| AC-7 (S8) | Every exported array/object const in the runner is classified: schema-published names are imported, vocabularies a normative surface names are published, everything else stays and is reported | `bun test scripts/vocabulary-parity.test.mjs` exits 0 (the residency receipt prints the three classes and their counts) |
| AC-8 (S9) | Every versioned block that restates a published const is bound by a `rendered-facts@1` row, and an unbound restatement is reported | `bun test scripts/normative-drift.test.mjs` exits 0 |
| AC-9 (S10, S11) | The stale rationale sentences are gone and the pin carrier states the finished rule | `rg -c 'does not depend on the schema package' packages/agentic-workflow/src packages/agentic-workflow/test` matches 0 and `bun test scripts/vocabulary-parity.test.mjs` exits 0 |
| AC-10 (S11) | The touched commands behave exactly as before, and the whole gate is green | the differential run in `E<n>` is byte-identical for stdout/stderr/exit, and `bun scripts/local-gate.mjs` exits 0 |

## Impact

What the change touches beyond its own files:

- **Consumes** the schema package's build. `bun run build` in
  `packages/agentic-workflow-schema` is already a gate precondition
  (`scripts/run-root-suite.mjs` rebuilds a stale `dist/`), so nothing new is
  required of a checkout.
- **Consumers of the exported names**: 48 root scripts and crate/pi suites import
  the names this unit moves. Every name stays exported from its historical module
  path, so no consumer changes — the value's origin moves, the path does not.
- **What stops being true**: the rationale sentences "This crate does not depend
  on the schema package" (`src/passes/names.mjs`, `src/edit/schema.mjs`,
  `src/edit/Provenance.mjs`, `src/runner/ceremony-profile.mjs`,
  `src/materialize/materialize.mjs`, `test/resolve-passes.test.mjs`,
  `test/provenance.test.mjs`, `scripts/unit-doc-contract.test.mjs`), the
  "dependency-free runtime mirror" claim in `src/journal/entry.mjs`, and the
  scattered mirror pins those rationales justified.
- **Cross-package**: the schema package gains one new const group and one new
  published vocabulary; its `version` follows the train version at cut (no hand bump), so a
  `.changeset/` entry ships with the change.
- **Nothing live on the other side** is touched: no forge setting, no published
  release, no branch protection.

## Surfaces

- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`
- `scripts`
- `docs`

## Retirements

Every mirror this unit retires, with its replacement. The negative-capability
pin for each is the residency case in `scripts/vocabulary-parity.test.mjs`.

| Retired surface | Where | Replacement |
|---|---|---|
| `LOG_KIND_TOKENS` literal | `src/verify/Verify.mjs` | import of the published const; the name stays exported |
| `LOG_KINDS` literal | `src/runner/unit-doc-phases.mjs` | re-export alias of the published `LOG_KIND_TOKENS` |
| `PASS_NAMES` literal | `src/passes/names.mjs` | import; the name stays exported |
| `UNIT_DOC_SECTIONS`, `UNIT_DOC_SPEC_REF_SECTIONS`, `UNIT_DOC_SECTION_SHAPES`, `EVIDENCE_COLUMNS`, `ROADMAP_COLUMNS`, `BUDGETS_OPERATIONS`, `MANIFEST_OPERATIONS`, `UNIT_DOC_OPERATIONS`, `ROADMAP_OPERATIONS`, `CHANGELOG_OPERATIONS` | `src/edit/schema.mjs` | imports/re-export aliases of the published consts |
| `DOC_PROVENANCE_CONTRACT_ID`, `_FIELDS`, `_TOOLS`, `_SCHEMA_PACKAGE`, `DOC_PROVENANCE_FORMATS`, `DOC_GRAMMAR_FAMILIES`, `DOC_GRAMMAR_VERSIONS`, `DOC_FORMAT_GRAMMARS`, `DOC_FORMAT_SHAPES`, `DOC_PROVENANCE_READER_VERDICTS`, `_REASONS`, `CURRENT_READER` | `src/edit/Provenance.mjs` | imports/re-export aliases of the published consts |
| `JOURNAL_ENTRY_KINDS`, `JOURNAL_ENTRY_CONTRACT_ID`, `JOURNAL_ENTRY_VERSION` | `src/journal/entry.mjs` | imports/re-export aliases |
| `ROADMAP_DOCUMENT`, `FIX_INDEX_DOCUMENT`, `ROADMAP_FEATURES_HEADING`, `ROADMAP_FIXES_HEADING` | `src/index-document.mjs` | imports/re-export aliases (`ROADMAP_LEGACY_READ` stays: it reads the environment) |
| `BASE_CONFIG_FILE` literal | `src/guard/git-identity.mjs` | import |
| `CEREMONY_PROFILE_CONTRACT_ID`, `CEREMONY_PROFILE_PIECES`, `_ADOPTIONS`, `_REFUSALS`, `CEREMONY_REVIEW_SURFACES` | `src/runner/ceremony-profile.mjs` | imports/re-export aliases |
| `OUTCOMES`, `ARTIFACT_KINDS`, `FINDING_CODES` | `src/materialize/materialize.mjs` | imports/re-export aliases |
| `FEEDBACK_TIERS` | `src/feedback/index.mjs` | import; the name stays exported |
| `WRITER_REFUSAL_REASONS` | `src/writer/driver.mjs` | import |
| `SHARED_MERGE_CLASSES`, `SHARED_MERGE_REFUSAL_REASONS` | `src/writer/shared-merge.mjs` | imports |
| `PATH_GUARD_REASONS` | `src/path-policy.mjs` | import |
| `DOCTOR_CHECK_STATUSES`, `INSTALL_ROUTES`, `WIZARD_MOVES` | `src/doctor/vocabulary.mjs` | imports |
| `SKILL_SCREEN_VERDICTS`, `SKILL_CONSENT_ANSWERS` | `src/skills/discovery.mjs` | imports |
| `SKILL_EXTRA_STATES` | `src/skills/register.mjs` | import |
| `NODE_SANCTIONED_SCRIPTS` | `src/tool-choice/policy.mjs` | import |
| the mirror-parity cases | `scripts/unit-doc-contract.test.mjs`, `scripts/index-document.test.mjs`, `packages/agentic-workflow/test/resolve-passes.test.mjs`, `test/provenance.test.mjs`, `test/journal.surfaces.test.mjs` | the single carrier, `scripts/vocabulary-parity.test.mjs` |

Nothing in this list leaves an `orphan`: every name is still exported from the
same path, and `rg -c '<name>'` over the tree is non-zero for each.

## Non-goals

- Renaming or re-tokening any vocabulary (the audit reports; a rename gets its own
  unit).
- Making the schema package importable without a build.
- Splitting the project into layers.
- Version-parity gates and the pin-watch job (unchanged).
- Moving `path-policy.mjs`'s own plan/record enums (`REQUIREMENTS`,
  `OPERATIONS`, `PHASE_STATES`, `DECLARATION_KINDS`, `RECORD_KINDS`) and their pi
  counterpart: no versioned block enumerates their tokens, so they are Class 3.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood: true`, `contained_risk: contained`, `resumable_from_diff: true`
- **Named high-risk item** — `none — not a high-tier unit`

```text
risk-tier-verdict@1
# cmd: agentic-workflow ceremony tier classify --paths <the change's paths>
tier | standard
reason | 4 path(s) carry executable content
reason_kind | executable-content
signals | none
```

## Future

none

## Future cost

- A new vocabulary that a published contract names must land in the schema in the
  same PR (the residency case refuses a runner-resident `schema-export` name).
- `scripts/vocabulary-parity.test.mjs` is the only pin carrier; a reviewer who
  adds a pin elsewhere adds a second one, which the residency case reports.

## Applicable tests

- `bun test scripts/vocabulary-parity.test.mjs` — the pin carrier and residency
  classifier.
- `bun test scripts/normative-drift.test.mjs` — the `schema-export` machine for
  `gate-rejection-type` and the `restates` recomputation.
- `bun test scripts/unit-doc-contract.test.mjs`, `bun test scripts/index-document.test.mjs`
  — the crate's edit layer keeps its shape after the imports.
- `bun test packages/agentic-workflow/test` and
  `bun test packages/agentic-workflow-schema/test` — both crate suites.
- `bun run test` in `packages/agentic-workflow-schema` — schema build + suites.
- `bun scripts/local-gate.mjs` — the whole gate.

## Known pre-existing issues

- `packages/agentic-workflow-schema/dist/` is a gitignored build output; a fresh
  checkout must build it before any crate import works. **Affects** this unit
  (the imports resolve to `dist/`) and is already handled by
  `scripts/run-root-suite.mjs` — does not change behaviour.
- `packages/pi-agentic-workflow/src/config/path-policy.ts` mirrors
  `src/path-policy.mjs`'s plan/record enums. **Does not affect** this unit: no
  published contract names those tokens, so they are Class 3 and stay where they
  are.
- `src/doc/envelope.mjs` closes degradations with a **pattern list**, not an
  enumerated copy: it accepts the open families the schema deliberately leaves
  open. The issue's Class 1 row 11 assumed an enumerated mirror; there is none to
  delete. **Does not affect** the unit's scope; the behaviour pin
  (`test/doc.degradations.test.mjs`) stays.
- `packages/agentic-workflow-schema/test/verification-preflight.test.mjs:208`
  asserts a 50 ms wall-clock ceiling; under the gate's concurrent worker pool it
  measured 61 ms once and refused, and passed on the same head in isolation and
  on a re-run of the step. **Does not affect** this unit (it touches no
  verification code and the base commit shows the same order of magnitude); it is
  recorded here because a red gate is never excused by an unrecorded issue.

## Tasks

- P1 — Freeze the plan: this unit doc, `planning-evidence.md`,
  `planning-obligations.md`, `decisions.md`, including `D1` (the named pre-build
  cold path, confirmed empty from the entry-point evidence).
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/643-single-source-vocabulary/SPEC.md` exits 0)
  (Implements: S1, S4)
  - Relevant files: docs/features/643-single-source-vocabulary/

- P2 — Write the frozen-failure corpus red first: the residency classifier, the
  real-import parity for every Class 1/Class 2 name, the `gate-rejection-type`
  schema-export case and the `restates` recomputation. Observed failing on the
  current tree. (validator: `bun test scripts/vocabulary-parity.test.mjs` exits 1 on the frozen tree, naming the Class 1 literal rows)
  (Implements: S2, S3, S7, S8, S9, S10)
  - Relevant files: scripts/vocabulary-parity.test.mjs, scripts/normative-drift.test.mjs

- P3 — Publish the twelve Class 2 vocabularies and `GATE_REJECTION_TYPES` in the
  schema package and export them from `index.ts`.
  (validator: `bun test scripts/vocabulary-parity.test.mjs` exits 0 for the `class-2` rows)
  (Implements: S6, S7)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts

- P4 — Replace every Class 1 literal with an import from the schema, keeping each
  name exported from its historical path.
  (validator: `bun test scripts/vocabulary-parity.test.mjs` exits 0 and `bun test packages/agentic-workflow/test` exits 0)
  (Implements: S2, S5)
  - Relevant files: packages/agentic-workflow/src/verify/Verify.mjs, packages/agentic-workflow/src/passes/names.mjs, packages/agentic-workflow/src/edit/schema.mjs, packages/agentic-workflow/src/edit/Provenance.mjs, packages/agentic-workflow/src/journal/entry.mjs, packages/agentic-workflow/src/index-document.mjs, packages/agentic-workflow/src/guard/git-identity.mjs, packages/agentic-workflow/src/runner/ceremony-profile.mjs, packages/agentic-workflow/src/runner/unit-doc-phases.mjs, packages/agentic-workflow/src/materialize/materialize.mjs

- P5 — Replace the twelve Class 2 runner-resident literals with imports.
  (validator: `bun test scripts/vocabulary-parity.test.mjs` exits 0 and `bun test packages/agentic-workflow/test` exits 0)
  (Implements: S6)
  - Relevant files: packages/agentic-workflow/src/feedback/index.mjs, packages/agentic-workflow/src/writer/driver.mjs, packages/agentic-workflow/src/writer/shared-merge.mjs, packages/agentic-workflow/src/path-policy.mjs, packages/agentic-workflow/src/doctor/vocabulary.mjs, packages/agentic-workflow/src/skills/discovery.mjs, packages/agentic-workflow/src/skills/register.mjs, packages/agentic-workflow/src/tool-choice/policy.mjs

- P6 — Make the drift gate read the machine from the schema for
  `gate-rejection-type` and add the `restates:` recomputation kind.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S7, S9)
  - Relevant files: scripts/normative-drift.test.mjs, AGENTS.md

- P7 — Delete the scattered mirror pins and the stale rationales; state the
  finished pin-carrier rule in the suite header.
  (validator: `rg -c 'does not depend on the schema package' packages/agentic-workflow/src packages/agentic-workflow/test scripts` matches 0)
  (Implements: S10)
  - Relevant files: scripts/unit-doc-contract.test.mjs, scripts/index-document.test.mjs, packages/agentic-workflow/test/resolve-passes.test.mjs, packages/agentic-workflow/test/provenance.test.mjs, packages/agentic-workflow/test/journal.surfaces.test.mjs, packages/agentic-workflow/src/edit/schema.mjs, packages/agentic-workflow/src/journal/entry.mjs

- P8 — Land the declared surfaces: the `vocabulary-residency@1` invariant, the
  re-pointed `normative-surfaces@1` rows, the `rendered-facts@1` row, the AC15
  pointer, and the re-pinned document budget.
  (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S7, S11)
  - Relevant files: docs/architecture/ARCHITECTURAL_INVARIANTS.md, AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json

- P9 — Register the unit's state: roadmap status, the generated projection, the
  changeset and the journal entry; then run the whole gate.
  (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S11)
  - Relevant files: docs/ROADMAP.md, docs/generated/, .changeset/, .agentic-workflow/journal/

### Planning evidence

The frozen ledger is `planning-evidence.md` beside this document (M/L shape).

### Obligations

The frozen ledger is `planning-obligations.md` beside this document (M/L shape).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the request, verbatim:
  ```
  Apply to this repository: issue #643
  ```
- **D1** — 2026-11-19, the named pre-build cold path is **empty**; authority: the
  issue leaves it to the owner (`S4`) and the evidence decides it. Detail and the
  import chain: `decisions.md` D1.
- **D2** — 2026-11-19, `src/doc/envelope.mjs` owes no change (no enumerated copy
  to delete; the pattern close accepts more than the const, by design).
  `decisions.md` D2.
- **D3** — 2026-11-19, every moved name keeps its historical export path; the
  crate's differing spellings survive as aliases. `decisions.md` D3.
- **D4** — 2026-11-19, the requirement set is `S1` (the turn's instruction) plus
  `S2…S11` quoting issue #643 verbatim. `decisions.md` D4.
- **E1** — 2026-11-19, `bun /tmp/pe643-*/probe.mjs` (a throwaway real-import
  probe against `dist/index.js`, removed with its temp dir) · exit 0 · 39 checks
  `EQUAL`, 12 `DRIFT` (the DRIFT rows are the Class 2 names the schema did not yet
  publish). This is `PE-002`/`PE-003`'s sample.
- **E2** — 2026-11-19, `bun test scripts/vocabulary-parity.test.mjs` on the frozen
  tree · exit 1 · 5 failing cases: class 1 (41 literals), class 2 (12 rows
  pointing at the runner), the invariant home, `GATE_REJECTION_TYPES`, and the
  stale rationale. The corpus of §2, observed red before any implementation.
- **P1** — 2026-11-19, the plan frozen (unit doc + both ledgers + decisions);
  `phase-lint` PASS 9/9 · `00d5b60df`.
- **P2** — 2026-11-19, the frozen-failure corpus landed red · `073bcf53d`.
- **E3** — 2026-11-19, `cd packages/agentic-workflow-schema && bun run test` ·
  exit 0 · 914 pass, 0 fail (52 files).
- **P3** — 2026-11-19, the thirteen vocabularies published ·
  `23afa6dac`.
- **P4** — 2026-11-19, forty-one Class 1 literals replaced by imports ·
  `009f6bc4c`.
- **E4** — 2026-11-19, `cd packages/agentic-workflow && bun run test` · exit 0 ·
  1320 pass, 0 fail (72 files), after P4 and again after P5.
- **P5** — 2026-11-19, the twelve Class 2 literals replaced by imports ·
  `212b51acf`.
- **P6** — 2026-11-19, the drift gate reads the gate-rejection machine from the
  schema and recomputes the block; the twelve `schema-export` rows re-pointed ·
  `85d5f3c13`.
- **E5** — 2026-11-19, `bun test scripts/normative-drift.test.mjs` · exit 0 ·
  22 pass, 0 fail, including the three injected `restates` refusals (a dropped
  token, an invented token, a removed block).
- **P7** — 2026-11-19, the scattered pins and the stale rationales deleted; the
  router's private shape table imported · `0fea21ad0`.
- **E6** — 2026-11-19, `rg -c 'does not depend on the schema package|ships without
  a dependency on the schema package|until issue #427 unifies the reading'`
  over `packages/agentic-workflow/src packages/agentic-workflow/test scripts` ·
  0 matches (the scanner in the parity suite reads whitespace-normalized text, so
  a wrapped rationale cannot survive it either).
- **P8** — 2026-11-19, the invariant declared, the guide bound to it, the budgets
  re-pinned · `cc0aa613a`.
- **E7** — 2026-11-19, `bun scripts/check-skill-context.mjs --documents` · exit 0
  · PASS, AGENTS.md 738 lines / 178 machine / 560 prose / 13,418 est.
- **P9** — 2026-11-19, the unit registered: roadmap status, generated projection,
  changeset, journal fragment · `bc80f9aca` · `e86ca1b96` · `a7027db9b` ·
  `24b90cb73` · `1fe5d2a1e`.
- **E8** — 2026-11-19, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  `Files: 3 checked · 0 missing · 0 stale · 0 orphaned`.
- **E9** — 2026-11-19, `bun scripts/log-immutability.mjs` · exit 0 · 0 violations.
- **E10** — 2026-11-19, `bun test scripts/vocabulary-parity.test.mjs` on the final
  tree · exit 0 · 35 pass, 0 fail. Residency receipt: **67** names imported from
  the schema, **162** runner declarations stay (Class 3).
- **E11** — 2026-11-19, differential over the touched commands (base copy
  `git archive 176ab984b` in a throwaway `/tmp` tree, path-normalized): `resolve-passes`,
  `journal name`, `ceremony tier classify`, `guard-command`, `verify --no-git`,
  `log render` — byte-identical stdout/stderr/exit. Two deltas, both declared:
  `roadmap read` differs only in `revision` (this unit changed the roadmap status
  cell) and `doctor --json` differs only in checkout state (`.serena/project.local.yml`
  present here, absent from an archived tree; `tagsVisible` 0 vs N).
- **E12** — 2026-11-19, `bun scripts/prose-gate-inventory.mjs` · exit 0 · PASS, the
  two new surface ids claimed by the drift row.
- **E14** — 2026-11-19, `bun scripts/dimension-regression.mjs --base origin/main` ·
  first run refused `missing-reverification-evidence` — the range touches
  `docs/workflow/GATE_INVENTORY.md` (the two surface ids this unit claims), and no
  unit doc recorded a run of that gate; this line is the record it asks for, and
  the re-run is clean (`verdict clean`, 18 dimensions at both ends, 1 changed
  review surface). No review dimension was added or dropped by this unit.
- **E13** — 2026-11-19, `bun scripts/local-gate.mjs --no-bail --json` over every
  applicable step · exit 0 · 18 steps passed in 614s; then
  `bun scripts/local-gate.mjs --only worktree-guard` · exit 0 · PASS. The first
  full run's `worktree-guard` failure was a peer session's leftover
  (`.worktrees/feat-596-test-relevance-sweep/.worktrees/aw596-measure-base`), which
  that session removed before the re-run; the red is recorded in `## Known
  pre-existing issues` rather than erased.

## Next

The owner reviews the diff as the external verifier: one correction batch on its
blockers, if any. `main` moved locally to `fdd39cccc` after the branch cut
(`origin/main` is still `176ab984b`), so the integration is the owner's.

## References

- Issue: [#643](https://github.com/gtrabanco/agentic-workflow/issues/643)
- Roadmap row: `docs/ROADMAP.md` → `## Features` → 643
- Prior art: unit 84 (`docs/features/84-published-vocabulary-sweep-gate/`), the
  `LOG_KINDS`/F22 pattern, `scripts/vocabulary-parity.test.mjs`
- Owner decisions: `decisions.md` beside this document
