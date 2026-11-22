---
type: fix
scope: small
roadmap_summary: Issue [#684](https://github.com/gtrabanco/agentic-workflow/issues/684) (S): `ceremony roadmap row-upsert` handed the roadmap *document* to the writer where the writer takes a *path*, so both arms died before writing a byte — established while closing #680 (PR #683), whose row could only be settled by hand. The path is now passed to both arms, the row-upsert arm's local read and its `next`/`written` double-write are gone, and the fix row is settled end to end by a case that asserts the row, the receipt and every other byte. Owner-ordered extension: the `## Fixes` row writer derives the table's own header words, column count and issue-keyed column, so a consumer table shaped `Folder | Topic | Status | Depends on | Issue` settles instead of being refused as a missing table, and every refusal names the constraint that failed.
---

# fix/684-ceremony-roadmap-upsert

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
planning-evidence.md | kept
planning-obligations.md | kept
decisions.md | kept
SPEC.md | kept
```

## Issue

`#684` — tracked issue in the project's forge. The PR closes it via
`Closes #684`.

## Specs

**S1 — a fix row settles through `row-upsert`: the row updates and the receipt answers `upserted: true`.**
> Expected: the `## Fixes` row updates, receipt `upserted: true`.
> Observed: `WriterError: ENAMETOOLONG`, no byte written (the working tree stays clean).

**S2 — both writer arms receive the path, not the document.**
> Pass the path, not the content, to both arms — `fixRowUpsert(roadmapPath(), …)`

**S3 — the shadowing local is dropped.**
> and drop the shadowing local

**S4 — a regression case settles a fix row end to end.**
> add a regression case that settles a fix row end to end

### Owner-ordered scope extension (2026-11-22)

The owner extended this unit's frozen scope after the first fix was verified. The
eight requirements below quote his words verbatim, keep his own `S1..S8` labels
inside each quote, and are numbered `S5..S12` here so the issue's frozen `S1..S4`
stay citable. Mapping: owner `S1..S8` = unit `S5..S12`, one-to-one, in order.

**S5 — the writer works with the table's actual header words and column count.**
> S1. The Fixes-table row writer `fixRowUpsert` (packages/agentic-workflow/src/edit/Roadmap.mjs — fixRowKey / fixRowUpsertEdits) must work with the table's actual header words and column count, not only its own hardcoded shape.

**S6 — the consumer's five-column header is accepted, not refused as a missing table.**
> S2. Today the writer refuses a Fixes table whose header is `| Folder | Topic | Status | Depends on | Issue |` (5 filter columns; quoted verbatim from the consumer that hit it) with Roadmap Fixes table not found (expected an | Issue | table under '## …'). The consumer had to hand-write its settle — that forced hand-write is the defect this extension removes (observed 2026-11-22, fix-101 run).

**S7 — locate by heading, accept the real header, key by issue number, splice a full-length row.**
> S3. Expected behaviour: the writer locates the `## Fixes` table by its heading, validates/accepts the table's REAL header words and column count (any column order keeping one issue-number-keyed cell), finds the row by the issue number inside its link or bare numeric cell (the existing fixRowKey logic), and splices the full-length row matching that column count.

**S8 — an unresolvable shape stays fail-closed and names the constraint that failed.**
> S4. Where the table shape carries no issue-keyed cell or is otherwise unresolvable, the refusal stays fail-closed but names the exact constraint that failed (never table not found when a table exists) — a refusal must never force a hand-write.

**S9 — the extension sits on top of `12c8c2add` and changes nothing about it.**
> S5. This extension sits on top of the in-flight fix (12c8c2add hand the roadmap path, not its body, to both row writers) and changes nothing about it — depth is the shape-validation layer only.

**S10 — freeze the extension's RED corpus first.**
> S6. Freeze the extension's RED corpus first: a fixture whose Fixes table carries the header `| Folder | Topic | Status | Depends on | Issue |` must run the writer's settle and fail today with the S2 refusal.

**S11 — after the fix the same fixture settles with the row length matching the column count.**
> S7. After the fix, that same fixture settles the row keyed by the issue number in its link/bare cell, with the row length matching the table's column count, byte-checkable against the fixture.

**S12 — the repository's own roadmap shape stays byte-compatible and existing tests stay green.**
> S8. Do not break the shape this repository's own roadmap uses (its header and row stay byte-compatible; existing tests stay green).

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` — the `row-upsert`
  operation. Its local `text` read, its `next` binding and its `written`
  double-write are the defect's whole surface; nothing else in the module moves.
- `packages/agentic-workflow/src/edit/Roadmap.mjs` — **read, never changed by this
  fix** (the owner-ordered extension at `### Extension impact` lifts that freeze
  for the `## Fixes` shape layer and nothing else).
  `rowUpsert(table, …)` and `fixRowUpsert(table, …)` both document and implement
  `table` as the roadmap file's *path* (`Roadmap.mjs:166-168`, `:412-414`), and
  both already write the file themselves. The ceremony was the only caller that
  disagreed.
- `packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` — the roadmap
  case. Its assertion `upsert.code === 0 || upsert.code === 1` accepts the
  crash, so the defect passed every gate; the fixture's `## Fixes` table
  (`| # | Slug | Status | Depends on | Summary |`) is also not the shape
  `fixRowUpsertEdits` targets (`| Issue | Topic | Status | Notes |`, header cell
  `Issue`), so the fix arm could never have been exercised against it.
- Consumers of the settled row: `skills/execute-phase/SKILL.md` §close-out
  documents `agentic-workflow roadmap <index> fixrow '<json>'` as the fix row's
  writer — that prose stays true and is what this unit makes executable.
- Untouched operations in the same module (`read`, `list`, `settle`, `check`)
  keep their byte-for-byte behaviour; the differential in P3 proves it. Their own
  defects are reported, not repaired here (see `## Non-goals`).
- Nothing live on the other side: the change writes only the row the caller
  names, through the writer that already owned the write.

### Extension impact (2026-11-22, owner-ordered)

The first fix froze `packages/agentic-workflow/src/edit/Roadmap.mjs` as **read,
never changed**. The extension lifts that freeze for three functions and no
more — `fixRowKey`'s line-anchored cell rule, `fixRowUpsertEdits`'s single
hardcoded header/row shape, and `fixRowUpsert`'s post-write check that reads the
same shape:

- `packages/agentic-workflow/src/edit/Roadmap.mjs` — the extension's whole
  surface. `rowUpsert`, `rowUpsertEdits`, `annotate`, `findRow`, `checkUnitDoc`
  and the `NN`-lookup family are not touched, so the `## Features` writer's
  contract is unchanged.
- `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` — untouched:
  `12c8c2add`'s path hand-off stays byte-identical (`S9`).
- Every project that ships a `## Fixes` table — the writer is shared code, so the
  change widens what it *accepts* while emitting the same bytes for the shape
  this repository's own roadmap uses (`S12`).
- Consumers of the refusal text: `bin/agentic-workflow.mjs roadmap fixrow` and the
  ceremony surface `WriterError.message` verbatim (`Roadmap.mjs:49-55`), so a
  reworded refusal is a caller-visible string and must name the failing
  constraint (`PE-016`).
- Test surfaces: `packages/agentic-workflow/test/edit.test.mjs` (the writer's own
  cases, the refusal cases and the CLI route) and
  `packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` (the settle end
  to end).

## Surfaces

- `packages/agentic-workflow`

## Retirements

Strictly a **replacement inside one arm**, plus its superseded local names. No
shipped surface, token or grammar is removed, so no `orphan` retirement exists to
classify; the added surface is none — the command already shipped.

| Superseded | Replaced by |
|---|---|
| `const text = readFileSync(roadmapPath(), "utf8")` inside the `row-upsert` arm — the read the writer already performs itself | `roadmapPath()` passed as the writer's `table` argument |
| `const next = …` / `const written = typeof next === "string" ? next : next.text` — a second write of a value no receipt carries (`makeReceipt` has no `text` field), which would have failed with `ERR_INVALID_ARG_TYPE` the moment the path bug was fixed alone | the writer's own return value, read for its `ok` |

The module-level `write()` helper stays: `settle` still calls it.

## Non-goals

- **`roadmap settle`, `roadmap list` and `roadmap check` in the same module.**
  All three read `roadmapTableRows` — which returns **cell arrays**, not objects —
  as if it returned `{nn, slug, status, summary}` (`roadmap.mjs:47-52`, `:88-99`,
  `:107-110`). `settle` additionally passes content where `rowUpsert` takes a
  path and routes `## Fixes` rows through the *features* writer. Reproducers are
  recorded in `## Log` (`E3`, `E4`); they are separate units, not this one.
- **The ceremony's refusal output.** An uncaught `WriterError` escapes `run()` as
  a stack trace with exit 1, against the module's own "JSON on stdout, always"
  contract (`E2`). Pre-existing, every ceremony module inherits it, and repairing
  it changes the exit/JSON shape of operations this unit does not touch.
- The forge URL `fixRowUpsert` is handed (`roadmap.mjs:67`): it hardcodes this
  repository's `github.com/gtrabanco/agentic-workflow`, which is a portability
  unit of its own (`IR` domain rules, not this fix).
- Registering rows for units that have no `docs/fix/<nn>-<topic>/SPEC.md`:
  `resolveUnit` refuses them, and that refusal is correct.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood + contained risk + resumable from diff
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

- A `row-upsert` caller now has no way to report a *healthy* write as
  `upserted: false` by accident and no way to write the file twice: subsuming
  code that runs the writer and then patches the text must go through the writer's
  `expected` CAS argument instead. Binds: `src/runner/ceremony/roadmap.mjs`.

## Applicable tests

- `packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` — the roadmap
  case, strengthened from a tautology to the end-to-end settle (fix arm and
  feature arm) plus the byte-identity differential over the four untouched
  operations; and, for the extension, the consumer-shaped `## Fixes` table
  settled end to end with its whole document byte-checked.
- `packages/agentic-workflow/test/edit.test.mjs` — the writer's own cases (the
  extension's `SHAPE-1..SHAPE-6` and the CLI `fixrow` route), which is where the
  shape rule's accepted forms and its four refusals are pinned.

## Known pre-existing issues

- The roadmap fixture in that suite carries a five-column `## Fixes` table
  (`| # | Slug | Status | Depends on | Summary |`) while the repository's index
  and `fixRowUpsertEdits` use the four-column `| Issue | Topic | Status | Notes |`
  — **does-not-affect** this unit's diagnosis (the path bug fires before any
  table shape is read) but **affects** the fix arm's reachability, so `P1`
  repairs the fixture to the shape the writer targets. **Superseded by the
  extension**: the writer now derives the table's own shape (`PE-012`,
  `E13`), so that original five-column header would settle too — the fixture's
  repaired four-column form is kept because it is the shape this repository
  uses and the one `S12` must keep byte-compatible.
- `ceremony roadmap check --slug <slug>` reports `row-missing` for a row that
  exists, because it compares the row's *second* cell to the issue number
  (`E4`) — **does-not-affect** this unit; `P4` verifies the registered row with
  `rg` rather than through that operation.

## Tasks

- [x] P1 — The RED corpus: the fix-arm and feature-arm settle cases plus the four-operation differential in the ceremony suite, and the fixture's `## Fixes` table moved to the writer's four-column shape (validator: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits non-zero, observed before P2)
  (Implements: S1, S2, S4)
  - Relevant files: packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs
- [x] P2 — The fix: `roadmapPath()` to both writer arms, the arm's local read and its `next`/`written` double-write removed, `upserted` read from the writer's own `ok` (validator: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: packages/agentic-workflow/src/runner/ceremony/roadmap.mjs
- [x] P3 — The differential over the base commit in a throwaway copy: `read`, `list`, `settle` and `check` answer byte-identical stdout/exit before and after (validator: `diff /tmp/pe684-base /tmp/pe684-change` answers empty, one file per operation)
  (Implements: S2)
  - Relevant files: docs/fix/684-ceremony-roadmap-upsert/SPEC.md
- [x] P4 — Documentation and state: the unit doc's ledgers and log, the `## Fixes` row registered through the repaired command, and the `docs/LOGS.md` session entry (validator: `rg -c 'issues/684' docs/ROADMAP.md` matches 1)
  (Implements: S1, S4)
  - Relevant files: docs/ROADMAP.md, docs/LOGS.md, docs/fix/684-ceremony-roadmap-upsert/SPEC.md
- [x] P5 — Verification: the strengthened suite and the repository gate (validator: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4)
  - Relevant files: docs/fix/684-ceremony-roadmap-upsert/SPEC.md
- [x] P6 — The extension's frozen ledgers: S5–S12 verbatim, PE-011–PE-018, O9–O18, AC-S5–AC-S12 and the phases that deliver them (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/684-ceremony-roadmap-upsert/SPEC.md` answers `PASS`)
  (Implements: S5, S6, S7, S8, S9, S10, S11, S12)
  - Relevant files: docs/fix/684-ceremony-roadmap-upsert/SPEC.md
- [x] P7 — The extension's RED corpus: the consumer-shaped fixture settles at the writer level, through the CLI route and through the ceremony, and fails at the cut head with the S2 refusal (validator: `bun test packages/agentic-workflow/test/edit.test.mjs` exits non-zero at `80724abbb`)
  (Implements: S6, S10)
  - Relevant files: packages/agentic-workflow/test/edit.test.mjs, packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs
- [x] P8 — The shape-validation layer: the header words, column count and issue-keyed column are derived from the table, the refusal names the constraint that failed, and the spliced row carries the table's column count (validator: `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0)
  (Implements: S5, S7, S8, S11)
  - Relevant files: packages/agentic-workflow/src/edit/Roadmap.mjs
- [x] P9 — The compatibility differential: the repository's own four-column table and every untouched caller answer byte-identically, and the ceremony's two arms stay green (validator: `bun test packages/agentic-workflow/test/edit.test.mjs` and `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exit 0)
  (Implements: S9, S12)
  - Relevant files: packages/agentic-workflow/test/edit.test.mjs, packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs, docs/ROADMAP.md
- [x] P10 — Documentation and state: the release intent, the unit doc's evidence and log, the roadmap summary through the emitter, the session journal, and the repository gate (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S5, S6, S7, S8, S9, S10, S11, S12)
  - Relevant files: .changeset/684-ceremony-roadmap-upsert.md, docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md, docs/fix/684-ceremony-roadmap-upsert/SPEC.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

One row per Engineering claim this change rests on. Every source below was read
in this session at the cut head `55525abad`; a claim carried from training is
never `confirmed`, and an unsampled assumption is `unknown` with an owner.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | Both arms fail at the cut head, not only the fix arm: the feature arm dies in `rowUpsert`, the fix arm in `fixRowUpsert`, each with the roadmap **document** as the `path` it tried to open, and neither writes a byte | `/tmp/pe684-*` (throwaway repo: one feature unit `91-toy`, one fix unit `77-toy`, a roadmap carrying both tables), `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony roadmap row-upsert --slug 77-toy --status done` → `WriterError` / `expose path: "# Roadmap\n\n## Features…"` / `EXIT=1`; the same with `--slug 91-toy` → `rowUpsert` / `EXIT=1`; `git status --porcelain` → empty | measured 2026-11-22 (this session) | O1, O2, O6; AC-S1, AC-S2 |
| PE-002 | committed-source | The errno in the issue is node's spelling of this defect, not a second one: this box's `node` resolves to bun's shim, and bun reports `ENOENT` for the same over-long name where libuv reports `ENAMETOOLONG` | `bash -lc 'command -v node'` → `/home/agent/.bun/bin/node`; the `PE-001` run prints `ENOENT: no such file or directory, open '# Roadmap…'` | measured 2026-11-22 (this session) | AC-S1 (the criterion asserts the row, never the errno) |
| PE-003 | committed-source | Both writers take a **path** and write the file themselves; `rowUpsert` then re-reads it to validate its pipe count, so a caller that also writes is a second writer | `packages/agentic-workflow/src/edit/Roadmap.mjs:166-168` (`writeShared({ path: table, … })` then `readFileSync(table, "utf8")`), `:412-414`, `:155-160` (the docblock: "table is the absolute path to the roadmap Markdown file") | read 2026-11-22 (this session) | O1, O2, O3; D1 |
| PE-004 | committed-source | The receipt the writer returns carries `service/op/path/schema/before/after/ok` and **no `text` field**, so the arm's `written` post-write is a write of `undefined` — a second defect that the path bug masks | `Roadmap.mjs:38-40` (`makeReceipt`), `:174-183` (the `rowUpsert` return); `rg -c 'text' packages/agentic-workflow/src/edit/Roadmap.mjs` → only prose and `readFileSync` locals | read 2026-11-22 (this session) | O3; D1 |
| PE-005 | committed-source | `roadmap.mjs` imports no `text` helper, so the issue's "shadows the imported `text` helper used elsewhere in that module" is **not** what happened — the local simply carries the document under a name that reads like a path in the writer's signature | `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:14-19` (the import list: `out, fail, block, onlyFlags, parseFlags, resolveUnit, listUnits, git`); `rg -n 'export (function|const) text' packages/agentic-workflow/src/runner/lib.mjs` → 0 | read 2026-11-22 (this session) | S3; D2 (the local is dropped anyway, for the reason that is true) |
| PE-006 | committed-source | The existing roadmap case cannot catch this: it accepts `code === 0 || code === 1`, and its fixture's `## Fixes` header is `| # \|`, which `fixRowUpsertEdits` refuses as `invalid-document` before it writes | `packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs:332-333`; `:57-64` (the fixture table); `Roadmap.mjs:388-390` (the `| Issue |` header guard) | read 2026-11-22 (this session) | O4, O5; AC-S4 |
| PE-007 | committed-source | The repository's own `## Fixes` table is the four-column `| Issue | Topic | Status | Notes |` keyed by `[#N](issue url)`, and `fixRowUpsert` emits exactly that row — so a settled fix row is one line spliced, nothing more | `docs/ROADMAP.md:213-225` (the legend and table header), `Roadmap.mjs:406` (the emitted row literal) | read 2026-11-22 (this session) | O2, O6; AC-S2 |
| PE-008 | committed-source | A `WriterError` escapes `run()` unwrapped — the ceremony suite in `PE-001` prints a node stack on stderr and echoes no JSON — against the module's own "JSON on stdout, always" contract | `packages/agentic-workflow/src/runner/ceremony/index.mjs:82-90` (no try/catch around `handler(op, rest)`); `roadmap.mjs:1-11` (the contract) | read 2026-11-22 (this session) | reported as `## Non-goals`; O7 keeps the exit non-zero and the byte unwritten, and makes no claim about the shape |
| PE-009 | measured-run | `settle`, `list` and `check` are broken independently of this defect, so folding them in would be a different unit: `roadmapTableRows` returns cell arrays and the module dereferences `row.status`/`row.nn`/`row.slug` on them | `bun … ceremony roadmap list` in the `PE-001` fixture → the slugs grouped under `idea` with the status strings as members; `settle` → `settled: 0` for an `in-progress` row whose summary carries a PR url; `check --slug 77-toy` → `row-missing` | measured 2026-11-22 (this session) | `## Non-goals`; O6 (their behaviour is preserved, not repaired) |
| PE-010 | committed-source | The command this unit repairs is the close-out route the executor documents for a fix unit, so a repair is what makes the shipped prose executable rather than aspirational | `skills/execute-phase/SKILL.md:284-287` ("a fix unit writes its `## Fixes` row with `agentic-workflow roadmap <index> fixrow '<json>'` — keyed by the issue number in its `[#N](url)` cell, never a hand edit") | read 2026-11-22 (this session) | O8; AC-S1 |
| PE-011 | measured-run | The consumer shape of `S6` is refused today by the header guard, not by a path or a separator defect: a five-column `## Fixes` table — the consumer's `Folder`, `Topic`, `Status`, `Depends on`, `Issue` header — settles nothing and throws `WriterError` with the `S2` message | `/tmp/pe684x-*` scratch: `fixRowUpsert(<fixture carrying that five-column header>, {issue: 101, …})` → `WriterError: Roadmap Fixes table not found (expected an Issue table under '## Fixes')`, exit 1, file byte-identical | measured 2026-11-22 (this session) | O9, O14; AC-S6 |
| PE-012 | committed-source | The refusal `S6` quotes is one literal guard: the table's header line must start with a cell whose word is `Issue` (so the issue cell must be **first**), the row key is anchored at the line's first cell, and the emitted row is a fixed four-cell literal | `packages/agentic-workflow/src/edit/Roadmap.mjs:384` (the header guard), `:367-374` (`fixRowKey`'s line-anchored regexes), `:391` (the four-cell `newRow`) | read 2026-11-22 (this session) | O9, O10, O11, O12; AC-S5, AC-S7 |
| PE-013 | committed-source | The post-write check carries the same hardcoded shape: it requires the row to contain `[#<issue>]` (so a bare numeric key reports `ok: false` after a good write) and counts pipes against a fixed five, not against the table's own column count | `packages/agentic-workflow/src/edit/Roadmap.mjs:417-419` | read 2026-11-22 (this session) | O10, O11, O17; AC-S5, AC-S7 |
| PE-014 | committed-source | This repository's own `## Fixes` header is the four words `Issue`, `Topic`, `Status`, `Notes`, and its separator carries one cell per column, so a header-derived generalisation emits that row byte-for-byte — nothing in the repo's own table needs a special case | `docs/ROADMAP.md:225-226` (header + separator), `Roadmap.mjs:391` (the literal it already emits) | read 2026-11-22 (this session) | O16, O18; AC-S12 |
| PE-015 | measured-run | The existing writer contract is green before the extension, so its case is a measured regression baseline rather than an assumption: `bun test packages/agentic-workflow/test/edit.test.mjs` → 0 fail, FF-2 and the CLI `fixrow` case included | `bun test packages/agentic-workflow/test/edit.test.mjs` in this worktree (exit 0) | measured 2026-11-22 (this session) | O15, O16, O18; AC-S9, AC-S12 |
| PE-016 | committed-source | A refusal's *text* is the only thing a caller can read: `throwRefusal` sets `error.message = result.detail`, the CLI prints it and the ceremony lets it escape as a stack trace, so `S8`'s "names the exact constraint" is the repair's whole observability | `packages/agentic-workflow/src/edit/Roadmap.mjs:49-55` (`throwRefusal`), `bin/agentic-workflow.mjs:1638` (no message rewriting), `src/runner/ceremony/index.mjs:82-90` (no catch) | read 2026-11-22 (this session) | O12, O13; AC-S8 |
| PE-017 | committed-source | The write itself is one declared line range: `writeShared` splices exactly the range the edit names and refuses `stale-read` instead of last-write-wins, so a full-length replacement row cannot disturb another byte | `packages/agentic-workflow/src/edit/Roadmap.mjs:117-155` (`lineOffsets`/`insertAfterLineEdit`), `src/writer/driver.mjs` (`writeShared`) | read 2026-11-22 (this session) | O11; AC-S7 |
| PE-018 | committed-source | No caller reads a column position: both `fixRowUpsert` callers hand over the table path and read only the receipt, so widening the accepted shape changes no caller contract | `bin/agentic-workflow.mjs:1633-1640` (`roadmap fixrow`), `src/runner/ceremony/roadmap.mjs:66-77` (the fix arm) | read 2026-11-22 (this session) | O9, O17; AC-S5 |

## Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md` §2).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | A fix unit settles its own `## Fixes` row through the owner: exit 0, `"upserted": true`, and the row's status cell reads the requested status — the use case #684 was filed for (row 680) | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the `roadmap` case's fix-arm assertions green in that file; `## Log` `E5` | verified |
| O2 | S2 | The feature arm settles a `## Features` row the same way, so the repair is one contract for both tables, never a fix-only patch | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the same case's feature-arm assertions green; `## Log` `E5` | verified |
| O3 | S2, S3 | One writer per write: the arm hands the path to the writer and writes nothing itself, so the file cannot be written twice and no `undefined` can reach `writeFileSync` | P2 | P2 | execute-phase | `rg -c 'typeof next === "string"' packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` matches 1 (only the untouched `settle` arm's own `write`) | the `rg` line and the case's single-write assertion, `## Log` `E5` | verified |
| O4 | S4 | The regression case this issue asks for exists and fails at the base commit: it asserts the row, the receipt and every other byte, so the tautology that let the defect through is gone | P1 | P1 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits non-zero at `55525abad` | the red run captured at base in a throwaway copy; `## Log` `E5` | verified |
| O5 | S4 | Invariant: no byte outside the spliced row moves — the roadmap's other tables, prose and separators are copied through untouched | P1 | P1 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the case's whole-file diff assertion (exactly one line differs); `## Log` `E5` | verified |
| O6 | S2 | Affected use cases that must not regress: `roadmap read`, `list`, `settle` and `check` answer byte-identical stdout and exit at base and at the change | P3 | P3 | execute-phase | a `diff` of the four captured runs against the base copy answers empty | the four captured outputs and the empty `diff`, `## Log` `E6` | verified |
| O7 | S1 | Required failure state: a writer refusal still exits non-zero and leaves the tree byte-clean, so the repair never turns a refusal into a silent success | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the case's refusal assertion (a roadmap with no `## Fixes` table refuses and changes nothing); `## Log` `E5` | verified |
| O8 | S1, S4 | The documented close-out route for a fix unit is executable: the repository's own row 684 is registered through the repaired command rather than by hand | P4 | P4 | execute-phase | `rg -c 'issues/684' docs/ROADMAP.md` matches 1 | the row in `docs/ROADMAP.md` and the command's receipt, `## Log` `E9` | verified |
| O9 | S5, S7 | A `## Fixes` table whose issue-keyed cell is not the first column settles its row: the consumer's five-column header — `Folder`, `Topic`, `Status`, `Depends on`, `Issue`, in that order — answers exit 0, `"upserted": true`, a status cell holding the requested token and an issue link in its own last cell | P8 | P8 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the ceremony case's consumer-shape assertions green; `## Log` `E13` | verified |
| O10 | S5, S7 | The row is found by the issue number inside the key column's link **or** bare numeric cell, in any column order, and is updated in place — never duplicated | P8 | P8 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 | the writer case's bare-key and reordered-header assertions green; `## Log` `E13` | verified |
| O11 | S7, S11 | Invariant: the spliced line carries exactly the header's column count; the columns the writer knows are rewritten, the columns it does not know keep the row's own cells, and every other byte is carried through | P8 | P8 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 | the case's whole-document byte equality against the fixture; `## Log` `E13` | verified |
| O12 | S8 | Required failure state: a table carrying no issue-keyed header cell is refused with that constraint named — never `table not found` — exit non-zero and not one byte written | P8 | P8 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 | the refusal case's message assertion plus the untouched-file assertion; `## Log` `E13` | verified |
| O13 | S8 | Required failure state: a shape that is otherwise unresolvable — a separator whose cell count disagrees with the header, or a `## Fixes` heading whose section carries no header row — refuses naming that mismatch | P8 | P8 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 | the mismatch cases' message assertions; `## Log` `E13` | verified |
| O14 | S6 | The extension's RED corpus is frozen before the implementation: the consumer-shape fixture runs the writer's settle and fails at the extension's cut head `80724abbb` with the `S2` refusal | P7 | P7 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits non-zero at `80724abbb` | the red run captured in a throwaway copy of that head; `## Log` `E13` | verified |
| O15 | S9 | The first fix is unchanged: `12c8c2add`'s path hand-off, its receipt reading and its green cases survive the extension | P9 | P9 | execute-phase | `rg -c 'typeof next === "string"' packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` matches 1 | the `rg` line plus `git diff 80724abbb -- packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` empty; `## Log` `E14` | verified |
| O16 | S8 | Compatibility invariant: this repository's own `## Fixes` table keeps its four header words — `Issue`, `Topic`, `Status`, `Notes` — and the writer emits its row byte-for-byte as before | P9 | P9 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 | the FF-2 emitted-row assertion green plus the header readback recorded at `## Log` `E14`; AC-S12's `rg` line in `E14` | verified |
| O17 | S5, S8 | Affected use case: the documented close-out route `agentic-workflow roadmap fixrow <path> <json>` settles a consumer-shaped row and reports `ok: true` | P8 | P8 | execute-phase | `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 | the CLI case's receipt and written row; `## Log` `E13` | verified |
| O18 | S7, S12 | Affected use cases that must not regress: the ceremony's fix and feature arms settle their rows and touch no other byte, and a roadmap with no Fixes table still refuses and writes nothing | P9 | P9 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the existing roadmap case green at the extension head; `## Log` `E14` | verified |

## Acceptance criteria

- **AC-S1** — `ceremony roadmap row-upsert --slug <fix-unit> --status done` on a
  repository whose `## Fixes` table carries that issue settles the row: exit 0,
  `"upserted": true` on stdout, and the row's status cell reads `done`. Proved
  by: the fix-arm assertions of the `roadmap` case in
  `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0.
- **AC-S2** — `ceremony roadmap row-upsert --slug <feature-unit> --status planned
  --summary <text>` settles the `## Features` row the same way (exit 0,
  `"upserted": true`, the status and summary cells rewritten), and no byte
  outside that one row changes. Proved by: the feature-arm assertions of the same
  case plus its whole-file line diff, exits 0.
- **AC-S3** — The `row-upsert` arm carries no local copy of the document and no
  second write: `rg -c 'typeof next === "string"'` over
  `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` matches 1 (only the
  untouched `settle` arm). Proved by: that `rg` line recorded in `## Log` `E5`
  and `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`
  exits 0.
- **AC-S4** — The regression case settles a fix row end to end — row, receipt and
  the untouched remainder of the document — and it fails at the base commit
  `55525abad`, so it is a regression test and not a description of the fix.
  Proved by: the recorded red run at base (`E5`) and the green run at the change.

### Extension criteria (2026-11-22, owner-ordered)

- **AC-S5** — The writer works with the table's actual header words and column
  count: a `## Fixes` table whose issue-keyed cell sits anywhere is accepted.
  Proved by: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`
  exits 0 with the consumer-shape case, and `S12`'s four-column case stays green.
- **AC-S6** — Today's refusal is reproduced as the extension's RED corpus: the
  consumer-shape fixture fails at `80724abbb` with
  `Roadmap Fixes table not found (expected an | Issue | table under '## Fixes')`.
  Proved by: the recorded red run (`E13`) and O14's validator.
- **AC-S7** — Locating the table by its heading, accepting any column order that
  carries one issue-keyed cell, keying the row by the issue number in its link or
  bare numeric cell, and splicing a full-length row: the row's cell count equals
  the header's, byte-checked. Proved by: the whole-document equality assertions of
  `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 and
  `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0.
- **AC-S8** — An unresolvable shape refuses fail-closed and names the failing
  constraint; a table that exists is never reported as not found, and no byte
  moves. Proved by: the refusal cases of
  `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0.
- **AC-S9** — `12c8c2add` is untouched: `git diff 80724abbb --
  packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` answers empty and its
  case stays green. Proved by: that `diff` and
  `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0.
- **AC-S10** — The RED corpus is frozen before the implementation. Proved by: the
  test commit precedes the writer commit and its red run at the cut head is
  recorded (`E13`).
- **AC-S11** — After the fix the same fixture settles the row keyed by the issue
  number with the row length matching the table's column count. Proved by: the
  same cases' row-length and whole-document assertions, plus the fixture bytes
  recorded in `E13`.
- **AC-S12** — This repository's own roadmap header and row stay byte-compatible
  and the existing tests stay green. Proved by:
  `rg -c '^\| Issue \| Topic \| Status \| Notes \|$' docs/ROADMAP.md` matches 1
  and `bun scripts/run-root-suite.mjs` exits 0.

## Triaged steps

```
TRIAGE — 684-ceremony-roadmap-upsert (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-22, the issue, verbatim (the outer fence is `~~~` because the
  quoted body carries fences of its own, and a nested ``` would close the quote
  early and swallow every later section):
  ~~~
  `ceremony roadmap row-upsert --slug <NN-slug> --status <status>` is the documented owner for settling a roadmap row, but on a **fix** unit it fails before writing anything:

  ```
  WriterError: ENAMETOOLONG: name too long, open '# Roadmap
  The workflow's **single location index**, in one document: ...
  ```

  ## Root cause

  `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:61-64` reads the roadmap into a variable, then hands that same string to the fix-path writer as the **table path**:

  ```js
  const text = readFileSync(roadmapPath(), "utf8");
  const next = unit.type === "fix"
    ? fixRowUpsert(text, { ... })          // text is the document, not a path
    : rowUpsert(text, { ... });            // signature also takes a path
  ```

  `fixRowUpsert(table, …)` (`packages/agentic-workflow/src/edit/Roadmap.mjs:413`) passes `table` to `writeShared({ path: table, … })`, which opens it — hence `ENAMETOOLONG` on the document body.

  The variable also shadows the imported `text` helper used elsewhere in that module, which is how the mistake survives review.

  ## Impact

  Every fix unit that wants to settle its row to `done · [#PR](url)` through the owner cannot: the only working route is a hand edit, which the repository's own rules call a defect. Hit while closing #680 (PR #683) — the row still reads `pending` for exactly this reason.

  ## Reproducer

  ```
  bun packages/agentic-workflow/bin/agentic-workflow.mjs \
    ceremony roadmap row-upsert --slug 680-relay-closeout-receipt-orphan --status done
  ```

  Expected: the `## Fixes` row updates, receipt `upserted: true`.
  Observed: `WriterError: ENAMETOOLONG`, no byte written (the working tree stays clean).

  ## Fix sketch

  Pass the path, not the content, to both arms — `fixRowUpsert(roadmapPath(), …)` — and drop the shadowing local; add a regression case that settles a fix row end to end.
  ~~~
- **L2** — 2026-11-22, the owner's local-workflow order for this unit, verbatim:
  ```
  Apply to this repository: issue #684
  ```
- **L3** — 2026-11-22, the owner's scope extension, verbatim (`S1`–`S8` in his
  numbering; `S5`–`S12` here, one-to-one in order):
  ```
  S1. The Fixes-table row writer `fixRowUpsert` (packages/agentic-workflow/src/edit/Roadmap.mjs — fixRowKey / fixRowUpsertEdits) must work with the table's actual header words and column count, not only its own hardcoded shape.

  S2. Today the writer refuses a Fixes table whose header is `| Folder | Topic | Status | Depends on | Issue |` (5 filter columns; quoted verbatim from the consumer that hit it) with Roadmap Fixes table not found (expected an | Issue | table under '## …'). The consumer had to hand-write its settle — that forced hand-write is the defect this extension removes (observed 2026-11-22, fix-101 run).

  S3. Expected behaviour: the writer locates the `## Fixes` table by its heading, validates/accepts the table's REAL header words and column count (any column order keeping one issue-number-keyed cell), finds the row by the issue number inside its link or bare numeric cell (the existing fixRowKey logic), and splices the full-length row matching that column count.

  S4. Where the table shape carries no issue-keyed cell or is otherwise unresolvable, the refusal stays fail-closed but names the exact constraint that failed (never table not found when a table exists) — a refusal must never force a hand-write.

  S5. This extension sits on top of the in-flight fix (12c8c2add hand the roadmap path, not its body, to both row writers) and changes nothing about it — depth is the shape-validation layer only.

  S6. Freeze the extension's RED corpus first: a fixture whose Fixes table carries the header `| Folder | Topic | Status | Depends on | Issue |` must run the writer's settle and fail today with the S2 refusal.

  S7. After the fix, that same fixture settles the row keyed by the issue number in its link/bare cell, with the row length matching the table's column count, byte-checkable against the fixture.

  S8. Do not break the shape this repository's own roadmap uses (its header and row stay byte-compatible; existing tests stay green).
  ```
- **E1** — 2026-11-22, the cut head · `git rev-parse --short HEAD` → `55525abad`,
  `git rev-list --count origin/main..HEAD` → `0`, `git status --porcelain` →
  empty · exit 0.
- **E2** — 2026-11-22, the reproducer of `S1` in a throwaway repo
  (`/tmp/pe684-*`, one `## Features` row 91, one `## Fixes` row #77) ·
  `ceremony roadmap row-upsert --slug 77-toy --status done` → `WriterError`,
  `path: "# Roadmap\n\n## Features…"`, `EXIT=1`; `git status --porcelain` empty ·
  the failure of record (`PE-001`).
- **E3** — 2026-11-22, the feature arm, same repo ·
  `ceremony roadmap row-upsert --slug 91-toy --status planned --summary probe` →
  `WriterError` at `Roadmap.mjs:168` (`rowUpsert`), `EXIT=1`, no byte written ·
  the defect is both-armed, wider than the issue's title (`PE-001`).
- **E4** — 2026-11-22, the sibling operations, same repo ·
  `ceremony roadmap list` → the two slugs listed under `idea` with the status
  strings as members; `ceremony roadmap check --slug 77-toy` → `row-missing`;
  `ceremony roadmap settle` → `settled: 0` · three independent pre-existing
  defects, recorded in `## Non-goals` (`PE-009`).
- **E5** — 2026-11-22, the regression corpus, red then green · at `55525abad`
  with the case of `fe1eaaa61` in place:
  `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` →
  `11 pass / 1 fail`, the failure `1 !== 0` at the fix arm's `assert.equal(fix.code, 0)`
  with the stack naming `fixRowUpsert` and the document as the path; at the change
  (`12c8c2add`) the same command → `12 pass / 0 fail`. The `rg` validator of `O3`
  reads `1` at the change (it read `3` at base, the file's own count).
- **E6** — 2026-11-22, the untouched-operation differential · the base tree
  (`git archive 55525abad` into `/tmp/pe684-diff/base`, workspace links pointing at
  the same `node_modules`) and the change, each against its own copy of one
  fixture repo: `ceremony roadmap read`, `list`, `settle` and
  `check --slug 77-toy`, stdout + stderr + exit captured ·
  `diff -r /tmp/pe684-diff/runs/base /tmp/pe684-diff/runs/change` → empty; exits
  `read 0/0`, `list 0/0`, `settle 0/0`, `check 2/2`; both fixture trees clean after
  the run (`settle` matched nothing at either head, so it wrote nothing).
- **E7** — 2026-11-22, the requested difference, same harness ·
  `ceremony roadmap row-upsert --slug 77-toy --status done` at base → exit 1, no
  byte written (`git diff --numstat` empty on the fixture); at the change → exit 0,
  `{"upserted": true, "slug": "77-toy"}`, `1+/1-` on `docs/ROADMAP.md`, the row
  `| [#77](https://github.com/gtrabanco/agentic-workflow/issues/77) | toy | done |  |`.
- **E8** — 2026-11-22, the package suite · `cd packages/agentic-workflow && bun test test/`
  → exit 0 · `1388 pass / 0 fail` across 78 files.
- **E9** — 2026-11-22, this unit's own row, registered through the repaired command
  on the live worktree · `ceremony roadmap row-upsert --slug 684-ceremony-roadmap-upsert
  --status in-progress --summary <the unit doc's roadmap_summary>` → exit 0,
  `{"upserted": true, "slug": "684-ceremony-roadmap-upsert", "status": "in-progress"}`,
  `1+/0-` on `docs/ROADMAP.md`; then `bun scripts/docs-generate.mjs` → `PASS`,
  `1 written · 0 deleted · 2 unchanged`, which re-synced the Notes cell from the
  unit doc's `roadmap_summary:` (edit the unit doc, never the table).
  `rg -c 'issues/684' docs/ROADMAP.md` → 1.
- **E10** — 2026-11-22, the projection and the budgets ·
  `bun scripts/docs-generate.mjs --check` → `PASS`, `3 checked · 0 stale`;
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs promise-coherence
  docs/fix/684-ceremony-roadmap-upsert/SPEC.md` → `PASS`, `3 checked · 10 skipped`
  (the skipped ones are the suite validators and the scratch `diff`, neither of
  which that reader executes); `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  phase-lint docs/fix/684-ceremony-roadmap-upsert/SPEC.md` → `PASS`, `6/6` on every
  phase.
- **G1** — 2026-11-22, HEAD 12c8c2add6f64e5af49ea97b1079672d9542931a ·
  `bun scripts/run-root-suite.mjs` · exit 0 · `137 suite(s)`, `137 PASS`, `0 FAIL`.
  The working tree carried this receipt's own uncommitted prose.
- **G2** — 2026-11-22, HEAD 12c8c2add6f64e5af49ea97b1079672d9542931a ·
  `bun scripts/local-gate.mjs --skip-network` · exit 1, on one suite in a change it
  does not touch: `crate-suite-bun` exit 0, then `crate-suite-node` red with
  `packages/agentic-workflow/test/doc.structure.test.mjs — SUITE TIMEOUT` at 240.4s.
  The suite is in `scripts/test-timeout-allowlist.json` at a 240s bound with this
  exact load class as its recorded reason, and it is green standalone —
  `node --test test/doc.structure.test.mjs` → `19 pass / 0 fail` in 171.9s,
  `bun test test/doc.structure.test.mjs` → `19 pass / 0 fail` in 206.5s. This host
  ran it 240s+ while the same gate dispatched four suites at once.
- **G3** — 2026-11-22, HEAD 12c8c2add6f64e5af49ea97b1079672d9542931a ·
  `bun scripts/local-gate.mjs --skip-network --jobs 2 --only version-parity-content,
  docs-generated-projection,skill-context-budgets,journal-carrier-check,
  log-immutability,push-identity,secret-scan,temp-hygiene,tmp-gc,worktree-guard,
  rigidity-review,dimension-regression,schema-node-compat,pi-node-compat,
  pi-compat-guard,dependency-pin-gate,dependency-advisories` · exit 0 ·
  `PASS — 12 step(s)`; the three network steps run on their own → exit 0 ·
  `PASS — 3 step(s)`, one `REPORT-ONLY` verdict by design. The first attempt was red
  at `version-parity-content` because a shipped package changed with no release
  intent; `D5`'s changeset is what closed it.
- **G4** — 2026-11-22, HEAD 0043a875c72fa9f11fc61233002a58254383165f ·
  `bun scripts/local-gate.mjs --skip-network --jobs 2` · exit 0 ·
  `PASS — 16 step(s) in 834s` — every offline step, `crate-suite-bun`,
  `crate-suite-node` and `root-suite` included, at two workers. The node leg alone
  at the same budget · exit 0 · `78 suite(s)`, `78 PASS`. So `G2`'s red is the
  four-worker dispatch, not the tree: the same suites, the same head, green as soon
  as the box is not four suites deep. The working tree carried this receipt's own
  uncommitted prose.
- **D1** — 2026-11-22, the fix shape: the writer takes the path and owns the write,
  so the arm hands it `roadmapPath()` and reports the writer's own post-state (`ok`)
  as `upserted`. The arm's local read and its `next`/`written` write-back are deleted
  rather than repaired: a receipt carries no `text` field, so repairing only the path
  would have moved the crash one line down.
- **D2** — 2026-11-22, the issue's second root-cause clause is false and is not
  repeated: `roadmap.mjs` imports no `text` helper (`PE-005`), so nothing was
  shadowed. The local is dropped for the reason that is true — the document never had
  a place in that arm once the writer reads the file itself.
- **D3** — 2026-11-22, scope held: `settle`, `list` and `check` are broken on their
  own (`PE-009`) and an uncaught writer refusal prints a stack trace (`PE-008`).
  All four are reported with reproducers in `## Non-goals`; a new finding never earns
  a correction cycle in this unit.
- **D4** — 2026-11-22, the fixture's two tables are repaired to the headers the
  writers key on (`| NN |` and `| Issue |`) in the same commit as the RED case:
  without them the fix arm refuses as `invalid-document` before it reaches the defect,
  so the case could not have been red for the right reason.
- **D5** — 2026-11-22, release intent: one `patch` changeset for
  `@gtrabanco/agentic-workflow`. `version-parity-content` refuses a shipped package
  whose content changed with no bump or changeset, and the train stamps the version.
- **D6** — 2026-11-22, the settle form this issue's `## Impact` names —
  `done · [#PR](url)` — belongs to `roadmap fixrow`, not to the repaired
  `ceremony roadmap row-upsert`: the ceremony validates the *token* against
  `ROADMAP_STATUSES` (bare `done`), so the PR decoration is not its grammar and it
  refuses that status (`bad-status`, exit 1, no byte written — measured, `E11`).
  `roadmap fixrow` is the fix row's writer that `execute-phase` documents and the one
  that carries the link; the ceremony arm stays the route for a bare status. Both are
  the owner — neither is a hand edit.
- **E11** — 2026-11-22, the settle form of `## Impact`, written by the owner writer
  on this worktree after the session was resumed · the row's own cells with the
  status cell rewritten to `done · [#686](https://github.com/gtrabanco/agentic-workflow/pull/686)`,
  handed to `agentic-workflow roadmap fixrow docs/ROADMAP.md '<json>'` → exit 0,
  receipt `ok: true`, `before 7f8a27c8 / after 0fe1f02c`, `1+/1-` on
  `docs/ROADMAP.md` — the status cell only, every other byte carried through · then
  `roadmap check docs/fix/684-ceremony-roadmap-upsert/SPEC.md` → `PASS`,
  `violations: 0`, **with the settle armed** (this doc now carries #686, so a row
  still reading `in-progress` would answer `pr-url-unsettled`) ·
  `bun scripts/docs-generate.mjs` → `PASS`, `1 written · 0 deleted · 2 unchanged`,
  then `--check` → `PASS`, `3 checked · 0 stale` · `agentic-workflow verify` →
  `ok: true`, `violations: []` · `agentic-workflow phase-lint` → `PASS`, `6/6` on
  every phase · the ceremony arm asked for the same decorated status → `bad-status`,
  exit 1, no byte written (`D6`).

- **P6** — 2026-11-22, the extension's ledgers cut at the owner's order ·
  `phase-lint` → `PASS (6/6)` on every phase, `P6`–`P10` included; the
  requirement numbering is `S5`–`S12` with the owner's own labels kept inside
  each quote (`L3`), so the issue's frozen `S1`–`S4` stay citable.
- **P7** — 2026-11-22, the extension's RED corpus frozen before the writer
  moved (`E12`): six writer cases and one ceremony case, all red at `80724abbb`
  for the reason the consumer reported.
- **P8** — 2026-11-22, the shape layer (`1b709afa8`): `fixTableShape` reads the
  `## Fixes` section, its header words, its column count and the issue-keyed
  column; the splice, the refusal and the receipt's verdict all read it.
- **P9** — 2026-11-22, the differential (`E14`): five operations on a copy of
  this repository's own roadmap answer byte-identical receipts and documents at
  `80724abbb` and at the fix.
- **E12** — 2026-11-22, the extension's cut head `80724abbb` in a throwaway copy
  (`git archive` into `/tmp/pe684x-red-*` + the two committed test files) ·
  `bun test test/edit.test.mjs` → `31 pass / 7 fail`, every failure the
  consumer-shape corpus, the CLI case's message
  `EDIT REFUSAL — Roadmap Fixes table not found (expected an | Issue | table under '## Fixes')` ·
  `bun test test/runner.ceremony-p1p2.test.mjs` → `12 pass / 1 fail` (the
  consumer-shape settle) · both exit non-zero.
- **E13** — 2026-11-22, the same corpus at `1b709afa8` ·
  `bun test test/edit.test.mjs` → `38 pass / 0 fail` (the six `SHAPE-*` cases and
  the CLI route green) · `bun test test/runner.ceremony-p1p2.test.mjs` →
  `13 pass / 0 fail` · the consumer row after the settle:
  `| 77-toy | toy | done | — | [#77](https://github.com/gtrabanco/agentic-workflow/issues/77) |`,
  five cells against five columns, whole document equal to the fixture with only
  that line's status and issue cells moved.
- **E14** — 2026-11-22, the compatibility differential on a copy of this
  repository's own `docs/ROADMAP.md`, base `80724abbb` vs the fix · `roadmap
  fixrow` (existing row 684, then a new issue 9999), `roadmap rowUpsert` (row
  684) and `roadmap annotate 684` → receipts identical at both heads
  (`before/after` `0fe1f02c → a0faaa34 → f642689e → 0e294847 → fdb6b685`), the
  two documents `diff`-empty after every step · `rg -c '^\| Issue \| Topic \| Status \| Notes \|$'
  docs/ROADMAP.md` → `1` · `git diff 80724abbb --
  packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` → empty ·
  `rg -c 'typeof next === "string"' …/roadmap.mjs` → `1` · the live worktree
  stayed read-only (`git status --porcelain` showed only the writer edit).
- **E15** — 2026-11-22, the package suite at `1b709afa8` ·
  `cd packages/agentic-workflow && bun test test/` → `1396 pass / 0 fail`, 78
  files (1388 before this change + the 8 new cases).
- **D7** — 2026-11-22, the shape rule is header-derived and closed: the issue key
  is a header cell worded `Issue`, `Issues` or `#` (one only — two is
  `2 issue-keyed columns`, none is `no issue-keyed column`), values map by the
  same words (`topic`/`summary`/`title`, `status`, `notes`/`note`), unknown
  columns keep the row's own cells on an update and stay empty on an insert, and
  a missing `url` leaves the bare number instead of inventing a link. Deriving
  the key column from the data cells was refused: it is a guess about a column's
  meaning, and `IR10` asks rather than guesses.
- **D8** — 2026-11-22, one branch, one PR: the extension lands on
  `fix/684-ceremony-roadmap-upsert` on top of PR #686's verified state (owner
  order `S9`), as its own commits — ledgers, RED corpus, fix — rather than a
  second unit or a second pull request.
- **G5** — 2026-11-22, HEAD cbfff034a597ea5e657c3e86c109de1ab7e45cd8 ·
  `bun scripts/run-root-suite.mjs` → exit 0 · `137 suite(s)`, `137 PASS`,
  `0 FAIL` · `bun scripts/local-gate.mjs --skip-network --jobs 2` → exit 0 ·
  `PASS — 16 step(s) in 661s`, the node leg alone `1040 pass / 0 fail /
  1 skipped` · `agentic-workflow verify <SPEC>` → `ok: true`,
  `violations: []` · `roadmap check <SPEC>` → `PASS`, `violations: 0` ·
  `promise-coherence <SPEC>` → `PASS`, `4 checked · 24 skipped` (the skipped
  ones are the suite runners and the scratch `diff`, which that reader never
  executes) · `phase-lint <SPEC>` → `PASS`, `6/6` on every phase, `P10`
  included. The working tree carried this receipt's own uncommitted prose.
- **G6** — 2026-11-22, the pre-push hook's own gate over the pushed range at
  `0a946e721`, the head it carried · `git push origin
  fix/684-ceremony-roadmap-upsert` → hook run `local-gate: PASS — 18 step(s) in
  692s`, then `80724abbb..0a946e721` published · the first attempt at the same
  range failed `crate-suite-bun` (exit 1 in 249s) while two gates ran
  concurrently on this box; the same step is green standalone at one worker
  (190s) and at its default dispatch (171s), and the retry's 18-step run
  covers it — the load class `G2` already records for this unit, not a failure
  of a case.

## Next

PR [#686](https://github.com/gtrabanco/agentic-workflow/pull/686) is open with
`Closes #684` and now also carries the owner-ordered extension
(`S5`–`S12`): the ledgers extended at the cut, the RED corpus at `80724abbb`,
the shape layer at `1b709afa8`, and the state, evidence and gate receipts after
them. The owner's external verify of the extension's diff is the remaining
step — any correction comes from that verdict, never from this session
(`## Log` `G5` is the gate's own receipt, not a verdict). Two things stay
reported, not fixed: the raft of sibling defects in the same module
(`## Non-goals`, `E4`) and the load-induced `doc.structure` suite timeout (`G2`).

The `## Fixes` row still reads `done · [#686]` (`E11`): the extension lands in
the same PR, so the settle form does not change.

## References

- Issue: [#684](https://github.com/gtrabanco/agentic-workflow/issues/684)
- Found while closing [#680](https://github.com/gtrabanco/agentic-workflow/issues/680)
  (PR [#683](https://github.com/gtrabanco/agentic-workflow/pull/683)).
- Recut evidence from the earlier units that refused to hand-edit around it:
  `docs/LOGS.md` `D6` of `feat/597-test-justification-creation` ("the writer
  takes a path, not text"), `D7` of `feat/596-test-relevance-sweep`, and
  `PE-014` of `docs/fix/596-*` (the both-arms `ENAMETOOLONG` shape).

## Branch

`fix/684-ceremony-roadmap-upsert`

## Depends on

Independent.

## Regression scope

| Scenario | Verified by |
|---|---|
| `ceremony roadmap read` still answers both tables unchanged | the four-operation differential of `P3` (`O6`) |
| `ceremony roadmap list` still groups by status exactly as before | the same differential (`O6`) — preserved, not repaired |
| `ceremony roadmap settle` still answers its own tally | the same differential (`O6`) |
| `ceremony roadmap check` still answers its own verdict | the same differential (`O6`) |
| A writer refusal still exits non-zero and writes nothing | the refusal assertion of the roadmap case (`O7`) |
| The rest of the ceremony surface is untouched | `bun test packages/agentic-workflow/test/runner.ceremony-p0.test.mjs` and `...-p1p2.test.mjs` exit 0 |
| This repository's own four-column `## Fixes` row is emitted byte-for-byte | the base-vs-head differential over `fixrow` (update and insert), `rowUpsert` and `annotate` on a copy of `docs/ROADMAP.md` (`E14`) |
| A consumer-shaped table (five columns, issue key last) settles instead of refusing | the writer's `SHAPE-1` case and the ceremony's consumer-shape case (`E13`) |
| `rowUpsert`, `annotate` and the `NN`-lookup family keep their contract | the same differential (`E14`) and `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 |
