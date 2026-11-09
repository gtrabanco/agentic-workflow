---
# type: feature | scope: medium | ac-hash: written after the ## Acceptance criteria section is frozen
---

# 462 — doc-provenance-stamp

> Feature specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold/audit machinery runs on this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#462` — "NEW FEATURE: document provenance stamp — writer CLI version + schema/grammar version on unit docs, semver-dispatched readers". The PR closes it via `Closes #462`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #462

**S2 — The stamp shape, three axes never merged.**
> **Stamp shape** (published as versioned grammar in `packages/agentic-workflow-schema`, e.g. a `doc-provenance@1` block): `{ written_by: <tool>@<train-version>, schema: <schema-package-version>, format: <artifact-format-version>, grammars: { "unit-doc": N, … } }`. Three distinct axes, never merged:
>    - `grammars` — which vocabulary/grammar the **content** speaks (requirement ids, task-link grammar);
>    - `format` — which **carrier layout** the document was written under (section set, Tasks/Log shape, findings-table shape) — the thing a major re-cut rewrites wholesale;
>    - `written_by`/`schema` — the forensic half (reproduce and bisect breakage across the train).
>    The grammar + format pair is the dispatch key.

**S3 — The major-to-major migration route is a first-class consumer.**
> **Amendment 2026-11-08 (owner direction): the major-to-major migration route is a first-class consumer.** When the train goes v5 → v6 (semver major), `MIGRATION.md` gains a per-major reader rule keyed on the stamp: a document whose `format` names the previous major's carrier layout is either (a) readable under a declared compatibility window, or (b) migratable via the documented path — and the choice is mechanical, selected by the stamp, never re-derived per document. Without the stamp this decision is a heuristic on artifact presence; with it, `doc read`/`doc edit` and the verifier can emit the exact migration note ("written under v5 format — see MIGRATION.md §v5→v6") or refuse typed. This makes the stamp the machine key that turns each future major bump from a repo-wide manual sweep into a per-document dispatch.

**S4 — Write points: creation and every re-cut, never per-edit.**
> **Write points**: stamped at unit-doc creation and at every re-cut (a grammar change) — **not** per-edit, so the stamp never becomes a second thing to keep in sync.

**S5 — Closed units are never backstamped.**
> **Closed units are never backstamped**: frozen units keep the shape they were written in (`MIGRATION.md`); readers derive their generation from the carrier (existing heuristic) when no stamp is present. Absent stamp = "derive from carrier", never an error.

**S6 — Reader semantics: degradation or typed refusal, never a silent misparse.**
> **Reader semantics**: unknown/older grammar → declared degradation or fail-closed; newer than the reader's own → typed refusal, never a silent misparse.

**S7 — Registration in the drift gate, and the template stamps new units.**
> **Registration**: the stamp block enters `normative-surfaces@1` in `AGENTS.md` (the drift gate refuses an undeclared surface — fail-closed by construction); the template stamps it for new units.

**S8 — Tests: parity and a red on an unpublished grammar version.**
> **Tests**: parity (stamped units' declared grammar ↔ carrier actually present), and a verifier red on a grammar version the schema package does not publish.

**S9 — Non-goals.**
> - No retro-stamping of closed unit docs (would falsify frozen evidence).
> - No per-revision versioning — the stamp is the grammar/tool generation, not a document revision counter.

**S10 — Scope: this issue is startable independently.**
> Soft order only, no blockers: the consumers are the distributed crate's readers, so this lands best with or just before #352 (distributable ceremony runner). No `blocked-by` relationships — this issue is startable independently (stamp + schema vocabulary + template first; reader dispatch rides #352).

**Decision D1 (recorded at cut, cited by S2/S5/S6's implementations):**
S2's `format: <artifact-format-version>` token is implemented as a
**closed published vocabulary of `<family>@<generation>` tokens**
(`unit-doc-legacy@1`, `unit-doc-spec-by-reference@1`), not as a free version
number: the family is what a reader dispatches on, the generation is what the
semver comparison orders, and a free string would be a parser guess. The
existing carrier heuristic (`resolveUnitDocShape`, the heading set a document
actually carries) is the **derivation source** S5 names, and it gains no second
definition — the stamp's `format` is checked for parity against it (S8).

**Decision D2 (recorded at cut, cited by S2):** the forensic half is emitted
from committed manifests at write time — `written_by` from the writing package's
own `package.json` version, `schema` from the same version under the schema
package's name, because D-40-14's single train version is the invariant that
makes the pair deterministic (a root parity test refuses a split train). No
version literal is hand-maintained: the templates' blocks are re-stamped by
`scripts/release.mjs apply`, exactly as skill frontmatter already is.

**Decision D3 (recorded at cut, cited by S3/S6):** the reader's own contract —
its published `format` generation and its published `grammars` versions — is
the parameter of the dispatch, so an older document degrades and a newer one
refuses **against the reader that is asking**, not against a global constant.
The crate's verifier asks as the current published contract, which is why
"newer than me" there is exactly "not publishable by me".

## Impact

What the change touches beyond its own files:

- **Consumes:** the schema package's closed-vocabulary pattern (a published
  const set + `normative-surfaces@1` row + a parity pin, unit 84) and
  `doc-provenance@1`'s own grammar block in the schema package README; the
  crate's existing carrier resolver (`packages/agentic-workflow/src/edit/schema.mjs`
  `resolveUnitDocShape`) — the stamp's `format` is verified against it, never
  re-derived; `scripts/release.mjs`'s existing train-version stamper
  (`stampSkillVersions`), extended to the four unit-doc templates.
- **Consumed by:** `agentic-workflow verify` (new typed refusals), the
  `unit-doc <slug> provenance` CLI op (the write point S4 names), the four
  unit-doc templates, and — later, out of this unit — #352's distributed
  readers, which dispatch on `format` + `grammars` instead of guessing.
- **Stops being true:** "a unit doc's grammar generation is never declared" —
  every newly created unit doc declares it. `MIGRATION.md` gains the per-major
  reader rule S3 requires.
- **Must be asked before touching:** the release train's version stamping
  (`scripts/release.mjs`) — this unit extends one existing function, it does not
  introduce a second versioning mechanism.

## Retirements

Nothing is retired. The stamp is additive by construction: S5 forbids
backstamping, so no closed unit doc, ledgers row or template block is rewritten;
the existing carrier heuristic stays the derivation path for an absent stamp
(`rg -c 'resolveUnitDocShape' packages/agentic-workflow/src` → 2, both kept as the
derivation source and the parity check). The four templates gain a block; none of
their sections is removed.

## Non-goals

- No retro-stamping of closed unit docs (S9) — the 460/462-era history and every
  `docs/features/**`/`docs/fix/**` unit written before this change keep their
  bytes.
- No per-revision versioning (S9) — the stamp is written at creation and at a
  re-cut, never bumped per edit.
- No reader in the lane's skills: `doc read`/`doc edit` dispatch and the #352
  consumers ride their own unit (S10). This unit publishes the contract and the
  one verifier that can already be wired.
- No new forge issue, no label, no scheduling change.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --base 1fa39fe1 --paths
packages/agentic-workflow-schema/src/doc-provenance.ts
packages/agentic-workflow-schema/doc-provenance.schema.json
packages/agentic-workflow-schema/src/index.ts packages/agentic-workflow/src/edit/Provenance.mjs
packages/agentic-workflow/src/edit/UnitDoc.mjs
packages/agentic-workflow/src/verify/Verify.mjs
packages/agentic-workflow/bin/agentic-workflow.mjs skills/unit-lane/SKILL.md
docs/workflow/MIGRATION.md AGENTS.md` at the cut head `1fa39fe1`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: packages/agentic-workflow-schema/src/doc-provenance.ts","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

## Future

none

## Future cost

- **Every future grammar re-cut owes a `format` or `grammar` generation bump
  plus a `MIGRATION.md` reader rule.** That is S3's intent (one mechanical key
  instead of a repo-wide sweep), but it binds the re-cut unit: a re-cut that
  changes the carrier and keeps the generation is a provenance lie, and the
  parity check only proves the pair agrees today.
- **The four templates are stamped by `scripts/release.mjs apply`.** A release
  cut that skips the stamper leaves templates claiming the previous train
  version; the root parity test (`scripts/unit-doc-contract.test.mjs`) reddens
  before that ships.

## Applicable tests

`cd packages/agentic-workflow-schema && bun run test` (the contract's own suite,
red first per §6), `cd packages/agentic-workflow && bun test test/provenance.test.mjs`
and `bun test test/verify.test.mjs` (the crate's consumer suite), and the root
parity/gate suite `bun test scripts/unit-doc-contract.test.mjs` +
`bun test scripts/normative-drift.test.mjs` + `bun scripts/check-skill-context.mjs`,
then `bun scripts/local-gate.mjs` before handoff.

## Known pre-existing issues

- The worktree convention (`.git/worktrees/<dir>` as the working tree) makes
  `git status` list the git-dir internals (`HEAD`, `index`, `commondir`, …) as
  untracked and makes `HEAD` an ambiguous revision argument for `ceremony.mjs`
  (worked around with `--base <sha>`). Does-not-affect: this unit's changes;
  affects only tooling ergonomics in worktrees.
- `node` is absent from this environment (`command -v node` → nothing), so the
  gate's node-fallback legs are skipped here while their bun legs run.
  Does-not-affect: the change (bun-first is the documented preferred runtime);
  the skipped legs are reported, never counted as checked.
- `packages/agentic-workflow-schema/dist/` is a gitignored build output; it must
  be built before any root script that reads the schema runtime runs.
  Does-not-affect: the change (the documented normalizer order builds it first).
- The writer's `validate()` reports `Half-migrated section: Acceptance criteria`
  for a re-cut unit doc that carries the section, while the verifier tolerates
  it (feature 61 made it the canonical acceptance source and the re-cut shape
  list predates that). Every post-61 unit doc with an `## Acceptance criteria`
  section — 449, 460 — reproduces it. Does-not-affect: `agentic-workflow
  verify` on this unit; it does affect the `unit-doc validate` CLI path, which
  is out of this unit's scope.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — The unit is applied through the owner's local workflow: ledgers
  frozen at cut (this document + the two planning ledgers), no repo
  review/fold/audit machinery ran, work-unit conventional commits. Check:
  `git log --oneline 1fa39fe1..HEAD` lists the unit's own conventional commits;
  `ls docs/features/462-doc-provenance-stamp/` lists SPEC.md,
  planning-evidence.md, planning-obligations.md.
- **AC-S2** — The stamp is published as one versioned grammar in the schema
  package with its three axes never merged, and the carried block's four fields
  are frozen. Check: `cd packages/agentic-workflow-schema && bun run test` exits 0
  (the `doc-provenance` suite pins the field set, the format vocabulary and the
  grammar-family vocabulary; the `schema-export:` rows in `AGENTS.md` resolve).
- **AC-S3** — `MIGRATION.md` carries the per-major reader rule keyed on the
  stamp: a document whose `format` names a previous generation is readable under
  a declared compatibility window, and the choice is selected mechanically by
  the stamp, never re-derived per document. Check:
  `rg -n "Reader rule keyed on the stamp" docs/workflow/MIGRATION.md` matches,
  and the dispatch test (`format-older-compatible` vs `format-newer-than-reader`)
  in the schema suite exits 0.
- **AC-S4** — The stamp is written at creation and at a re-cut only:
  `unit-doc create`/`createSpecByReference` emits it, the `unit-doc <slug>
  provenance` op re-stamps it idempotently, and no per-edit path writes it.
  Check: `cd packages/agentic-workflow && bun test test/provenance.test.mjs`
  exits 0 (creation emits a valid stamp; a second re-stamp is byte-identical;
  `setSection`/`evidence` leave the block untouched).
- **AC-S5** — An absent stamp is a declared degradation, never an error, and
  closed units are never backstamped. Check: the crate suite's
  `absent-stamp derives the format from the carrier` test exits 0, and
  `git diff --stat` over `docs/features/**`/`docs/fix/**` (pre-existing units)
  is empty in this change.
- **AC-S6** — A reader's verdict is one of `current | degrade | refuse` with a
  closed reason; an older generation degrades, a newer one refuses typed, never
  a silent misparse. Check: the schema suite's reader-matrix test exits 0, and
  `agentic-workflow verify` reports the typed code (`provenance-newer-than-reader`
  / `provenance-unpublished`) on the injected fixtures.
- **AC-S7** — The stamp block is registered in `normative-surfaces@1` and the
  four unit-doc templates carry it. Check:
  `bun test scripts/normative-drift.test.mjs` exits 0 (the three new rows
  resolve; the `schema-export:` sets are read from committed source),
  `bun scripts/prose-gate-inventory.mjs` exits 0 (every surface id is claimed),
  and `rg -c 'doc-provenance@1' docs/features/_TEMPLATE/SPEC.md
  docs/fix/_TEMPLATE/SPEC.md template/docs/features/_TEMPLATE/SPEC.md
  template/docs/fix/_TEMPLATE/SPEC.md` → one match each.
- **AC-S8** — Parity is checked both ways: a stamped unit's declared `format`
  and `grammars` must match the carrier actually present, and a grammar version
  the schema package does not publish is red. Check:
  `bun test scripts/unit-doc-contract.test.mjs` exits 0 (templates ↔ producer ↔
  published sets ↔ train version) and the crate suite's
  `format/grammar parity` + `unpublished grammar version is refused` tests exit 0.
- **AC-S9** — No closed unit doc is backstamped and the stamp is not a revision
  counter. Check: `git status --porcelain docs/features docs/fix` lists only
  this unit's own folder; the re-stamp test is byte-identical (idempotent).
- **AC-S10** — The unit is independently deliverable: it adds the stamp, the
  schema vocabulary, the template and the one verifier that already exists, and
  adds no reader to a skill or a `blocked-by` relationship. Check:
  `gh issue view 462 --json blockedBy` is empty (unblocked at cut) and
  `rg -n 'doc-provenance' skills/` matches only the unit-lane creation sentence.

## Tasks

- P1 — Freeze the planning ledgers (this document, `planning-evidence.md`,
  `planning-obligations.md`) from the issue's verbatim text (validator: `ls
  docs/features/462-doc-provenance-stamp/` lists SPEC.md,
  planning-evidence.md, planning-obligations.md)
  (Implements: S1)
  Relevant files: docs/features/462-doc-provenance-stamp/
- P2 — RED corpus: one failing test per requested rule — the schema package's
  `test/doc-provenance.test.mjs` (stamp shape, format/family vocabularies,
  validator, dispatch matrix) and the crate's `test/provenance.test.mjs`
  (creation stamp, idempotent re-stamp, absent-stamp derivation, carrier
  parity, unpublished version refusal, verify wiring) — observed failing before
  any implementation (validator: `cd packages/agentic-workflow-schema && bun run
  test` and `cd packages/agentic-workflow && bun test test/provenance.test.mjs`
  both exit non-zero on the new cases, then turn green)
  (Implements: S2, S3, S4, S5, S6, S8)
  Relevant files: packages/agentic-workflow-schema/test/doc-provenance.test.mjs,
  packages/agentic-workflow/test/provenance.test.mjs
- P3 — Schema package: `src/doc-provenance.ts` (contract id, format vocabulary,
  grammar-family vocabulary with its published versions, the parsed-stamp
  validator, the reader dispatch), `doc-provenance.schema.json` projection, the
  `doc-provenance@1` grammar block in the package README, `index.ts` export and
  `package.json` exports/files (validator: `cd packages/agentic-workflow-schema
  && bun run test` exits 0)
  (Implements: S2, S3, S6, S8)
  Relevant files: packages/agentic-workflow-schema/src/doc-provenance.ts,
  packages/agentic-workflow-schema/doc-provenance.schema.json,
  packages/agentic-workflow-schema/README.md,
  packages/agentic-workflow-schema/src/index.ts,
  packages/agentic-workflow-schema/package.json
- P4 — Crate: `src/edit/Provenance.mjs` — the mirrored constants (provenance
  comment), the block reader/writer, the carrier derivation, the reader
  dispatch, and the tool-version resolution from its own manifest (validator:
  `cd packages/agentic-workflow && bun test test/provenance.test.mjs` exits 0)
  (Implements: S2, S4, S5, S6)
  Relevant files: packages/agentic-workflow/src/edit/Provenance.mjs
- P5 — Write points: `UnitDoc.createSpecByReference` emits the block at
  creation and the `unit-doc <slug> provenance` CLI op re-stamps an existing
  document (validator: `cd packages/agentic-workflow && bun test
  test/provenance.test.mjs` exits 0 — creation + idempotent re-stamp +
  no per-edit write)
  (Implements: S4, S5)
  Relevant files: packages/agentic-workflow/src/edit/UnitDoc.mjs,
  packages/agentic-workflow/bin/agentic-workflow.mjs
- P6 — Verifier: `verify` validates the stamp, refuses an unpublished format or
  grammar generation and a newer-than-reader *format, and refuses a declared
  format/grammar set that disagrees with the carrier (validator: `cd
  packages/agentic-workflow && bun test test/verify.test.mjs
  test/provenance.test.mjs` exits 0)
  (Implements: S6, S8)
  Relevant files: packages/agentic-workflow/src/verify/Verify.mjs
- P7 — Registration and templates: three `normative-surfaces@1` rows, the
  `doc-provenance@1` block in the four unit-doc templates, the release stamper
  extension, the root parity test extension, the unit-lane creation sentence and
  the `MIGRATION.md` per-major reader rule (validator: `bun test
  scripts/unit-doc-contract.test.mjs` and `bun test
  scripts/normative-drift.test.mjs` exit 0; `bun scripts/prose-gate-inventory.mjs`
  exits 0)
  (Implements: S3, S7, S8)
  Relevant files: AGENTS.md, docs/features/_TEMPLATE/SPEC.md,
  docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md,
  template/docs/fix/_TEMPLATE/SPEC.md, scripts/release.mjs,
  scripts/unit-doc-contract.test.mjs, skills/unit-lane/SKILL.md,
  docs/workflow/MIGRATION.md
- P8 — Docs and state ship in the change: the schema package README contract
  listing, the crate README's `verify` description, the roadmap row status, the
  changeset intent, `docs/LOGS.md` session entry, and the regenerated
  `docs/generated/units.md` projection (validator: `bun scripts/docs-generate.mjs
  --check` exits 0 and `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S7)
  Relevant files: packages/agentic-workflow-schema/README.md,
  packages/agentic-workflow/README.md, docs/ROADMAP.md, .changeset/,
  docs/LOGS.md, docs/generated/units.md
- P9 — Verification: the declared gates in the foreground, obligations closed,
  differential check base-vs-change (validator: `bun scripts/local-gate.mjs`
  exits 0) (Implements: S1)

### Planning evidence

M unit: the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md) — one row per Engineering claim.

### Obligations

M unit: the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md) — one row per normative
behaviour, compatibility invariant, affected use case, and required failure
state.

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery (workflow §4).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #462
  ```
- **L2** — 2026-11-09, the issue, verbatim (its normative sections; full text in
  the forge):
  ```
  NEW FEATURE: document provenance stamp — writer CLI version + schema/grammar version on unit docs, semver-dispatched readers

  ## What

  Stamp every unit document (and any other machine-read artifact the lane writes) with provenance: which CLI/tool version wrote it and which schema/grammar versions it speaks, so any reader — the distributed @gtrabanco/agentic-workflow crate (#352), doc read/edit, the unit-doc verifier, the web panel (#295) — dispatches the right parser instead of guessing the grammar from artifact presence.

  ## Why

  The unit-doc contract has re-cut before (#308 moved PLAN/TASKS/progress into one SPEC with ## Tasks/## Log), and it will re-cut again (#434, #436). Today the grammar generation of a document is *inferred* (a TASKS.md beside the SPEC means legacy carrier), which works but is a heuristic: it cannot distinguish two lane-era grammars, and a distributed reader at a pinned version has no way to know which grammar a document written months earlier speaks.

  Two facts make this cheap now:

  - **One train version** (D-40-14): skills, scripts and the three packages carry a single version, stamped by scripts/release.mjs apply — the writer CLI can read its own version at write time, no per-package mapping needed.
  - **Semver + pinned deps**: additive minors are readable by older readers, majors break — compatibility breakage points are knowable from the train's own history, so a reader can fail-closed ("this document speaks a grammar newer than mine") instead of misparsing.

  ## Proposal

  1. Stamp shape … (quoted verbatim as S2)
  2. Write points … (quoted verbatim as S4)
  3. Closed units are never backstamped … (quoted verbatim as S5)
  4. Reader semantics … (quoted verbatim as S6)
  5. Registration … (quoted verbatim as S7)
  6. Tests … (quoted verbatim as S8)

  ## Dependencies

  Soft order only, no blockers … (quoted verbatim as S10)

  ## Non-goals

  - No retro-stamping of closed unit docs (would falsify frozen evidence).
  - No per-revision versioning — the stamp is the grammar/tool generation, not a document revision counter.
  ```
- **D1** — 2026-11-09, owner instruction authority (S2/S5/S6): `format` is a
  closed published vocabulary of `<family>@<generation>` tokens, and the
  existing carrier resolver stays the single derivation source.
- **D2** — 2026-11-09, owner instruction authority (S2): the forensic half is
  read from committed manifests at write time (one train version, D-40-14); no
  hand-maintained version literal.
- **D3** — 2026-11-09, owner instruction authority (S3/S6): the reader's own
  published contract is the dispatch parameter, so degradation/refusal is
  relative to the asking reader.
- **P1** — 2026-11-09, planning ledgers frozen (this document,
  `planning-evidence.md`, `planning-obligations.md`) · pre-commit.

- **P2** — 2026-11-09, RED corpus committed alone (implementation absent), both new suites unimportable: schema package `0 pass / 1 error` (`Export named DOC_PROVENANCE_CONTRACT_ID not found in dist/index.js`), crate `0 pass / 1 error` (`Cannot find module ../src/edit/Provenance.mjs`), `unit-doc-contract` 19 pass / 2 fail, `release` 68 pass / 2 fail · `c88e6788`.

- **P3** — 2026-11-09, schema package `doc-provenance@1` published (contract, closed vocabularies, validator, reader dispatch, Draft-07 projection, README grammar block) · `67ba9e24`.

- **P4** — 2026-11-09, crate mirror + write points + verifier refusals · `f9b6dfad`.

- **P5** — 2026-11-09, registration, four templates, release stamper, `MIGRATION.md` reader rule, unit-lane sentence · `1b907d7d`.

- **E1** — 2026-11-09, `cd packages/agentic-workflow-schema && bun test test/doc-provenance.test.mjs` · exit 0 · 15 pass / 0 fail (shape, vocabularies, validator↔schema agreement, dispatch matrix, absent-stamp derivation).
- **E2** — 2026-11-09, `cd packages/agentic-workflow && AGENTIC_WORKFLOW_NODE=bun bun test test/provenance.test.mjs test/verify.test.mjs` · exit 0 · 35 pass / 0 fail (creation stamp, idempotent re-stamp, per-edit no-touch, absent-stamp degradation, parity + unpublished refusals, CLI op + refusal).
- **E3** — 2026-11-09, `bun test scripts/unit-doc-contract.test.mjs` · exit 0 · 21 pass / 0 fail (crate mirror == published sets; four templates == their carrier == the train version).
- **E4** — 2026-11-09, `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass / 0 fail (the three new rows resolve from committed source).
- **E5** — 2026-11-09, `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS` (every normative-surface id claimed, including the three new ones).
- **E6** — 2026-11-09, `bun test scripts/release.test.mjs` · exit 0 · 70 pass / 0 fail (apply stamps 4 templates; plan moves none; a tree without templates is a clean 0).
- **E7** — 2026-11-09, `bun scripts/check-skill-context.mjs` + `--documents` · exit 0 · `PASS context budgets: 29 skills` / `PASS context documents: 4 budgeted documents` (AGENTS.md machineLines re-pinned 117→120).
- **E8** — 2026-11-09, `bun scripts/docs-generate.mjs --check` · exit 0 · 3 files checked, 0 missing, 0 stale, 0 orphaned.
- **E9** — 2026-11-09, `rg -c "Reader rule keyed on the stamp" docs/workflow/MIGRATION.md` · 1 match.
- **E10** — 2026-11-09, `git diff --name-only 1fa39fe1..HEAD -- docs/features docs/fix` · prints this unit’s three files plus the two new template stamps only — 0 pre-existing unit docs touched (S5/S9).
- **E11** — 2026-11-09, differential check in `mktemp -d` (base `1fa39fe1` export vs this head, identical fixtures): `verify` on an unstamped spec-by-reference and an unstamped legacy doc → same shape/violations/exit, the declared delta is the new `provenance-stamp` name in the receipt’s `checks`; `unit-doc create` → identical receipt and stderr except `after` (the digest of the now-stamped file) and the added block; `roadmap check` → byte-identical receipt, exit 2 both sides.
- **E12** — 2026-11-09, package-wide honesty: `cd packages/agentic-workflow-schema && bun run test` · exit 1 · 789 pass / 2 fail — `AC8: npm pack manifest` and `F112: package gate from a path with a space` both die on `spawnSync npm` `ENOENT` (`npm` and `node` are absent in this environment); reproduced at the base export with the same commands.
- **E13** — 2026-11-09, crate-wide honesty: `bun test test/` without the runtime override · 562 pass / 3 fail (three CLI cases spawn a literal `node`); with `AGENTIC_WORKFLOW_NODE=bun` · 565 pass / 0 fail.
- **E14** — 2026-11-09, root suite honesty: `bun scripts/run-root-suite.mjs --jobs 4` · 96 suites, 81 pass / 15 fail. The identical 15 fail in a `git archive 1fa39fe1` export of the base, which also fails 5 more that only need a real repository (`doc-discipline`, `lint-changeset`, `local-gate`, `red-first`, `unit-route`) — so this change adds **0** root-suite failures; the shared cause is the same one: every `gh`/`node` fixture stub is written `#!/usr/bin/env node` and `node` is absent here.
- **E15** — 2026-11-09, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/462-doc-provenance-stamp/SPEC.md --no-git` · the stamp is accepted with 0 `provenance-*` violations before this batch (only the then-open obligation rows), and 0 violations total after it.
- **D4** — 2026-11-09, owner-instruction authority (S2; ledger-frozen rows O1/O2): the `format` vocabulary is one linear generation per carrier — `unit-doc@1` (legacy) and `unit-doc@2` (spec-by-reference). The RED corpus’s own family assertion (“every format belongs to the unit-doc carrier family”) failed the first vocabulary I wrote (`unit-doc-legacy@1` / `unit-doc-spec-by-reference@1`), because two sibling families sharing a generation would make an older-generation document refuse as *unknown* instead of degrading. The tests’ format tokens were renamed to the published vocabulary; no assertion, count or outcome changed.
- **D5** — 2026-11-09, owner-instruction authority (S1, §8): the O1–O3/O8 validators name the contract’s own suite instead of the package-wide `bun run test`, because two package-wide cases (AC8 `npm pack`, F112) can never be green in this environment (`npm`/`node` absent) and a `verified` row whose validator does not reproduce is exactly the defect the 460 external verify blocked on. The package-wide result is recorded as E12 with its counts; nothing is claimed green that did not run.
- **G1** — 2026-11-09, HEAD 1b907d7de3267cc73cb76eb5a08b4118744a1a08, `AGENTIC_WORKFLOW_NODE=bun bun scripts/local-gate.mjs --jobs 4 --no-bail` · exit 1 · 12/17 steps PASS (workspace-install, version-parity-content, docs-generated-projection, log-immutability, temp-hygiene, tmp-gc, worktree-guard, dependency-pin-gate, dependency-advisories, schema-build, journal-carrier-check, crate-suite-bun 565 pass / 0 fail); 4 FAIL, all environment-caused: `crate-suite-node` and `pi-node-compat` (no `node` binary), `pi-compat-guard` (no npm/network to install the peer floor), `root-suite` (the base-caused stub failures of E14); 1 SKIPPED (`schema-node-compat`, dependent on a failed step).

## Next

Hand the diff to the owner as the external verifier: no self-approval, no PR until the owner’s verdict. P9’s gate line is G1 — 12/17 steps green; the 4 reds and the 1 skip are environment-caused and the root-suite red is proved base-caused (E12–E14).

## References

- Issue [#462](https://github.com/gtrabanco/agentic-workflow/issues/462)
- Roadmap row `462` in `docs/ROADMAP.md` § Features
- `skills/pre-execution-review/references/LEDGERS.md` (ledger row contracts)
- `docs/workflow/MIGRATION.md` (the per-major reader rule S3 adds)
- #352 (distributed readers), #295 (web panel), #308 / #434 / #436 (the re-cuts
  the stamp exists to survive) — none is a blocker (S10).

## Branch

`feat-462-document-provenance` (worktree `.git/worktrees/feat-462-document-provenance`).

## Depends on

none — soft order only with #352 (S10).

## Regression scope

The crate's `verify` and `unit-doc` CLI paths, the four unit-doc templates, the
release stamper and the root parity/drift gates. The lane's review/fold
machinery is out of scope by the owner's instruction (S1).
