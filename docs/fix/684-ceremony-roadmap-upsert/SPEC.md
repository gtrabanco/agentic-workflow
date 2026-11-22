---
type: fix
scope: small
roadmap_summary: Issue [#684](https://github.com/gtrabanco/agentic-workflow/issues/684) (S): `ceremony roadmap row-upsert` handed the roadmap *document* to the writer where the writer takes a *path*, so both arms died before writing a byte — established while closing #680 (PR #683), whose row could only be settled by hand. The path is now passed to both arms, the row-upsert arm's local read and its `next`/`written` double-write are gone, and the fix row is settled end to end by a case that asserts the row, the receipt and every other byte.
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
- `packages/agentic-workflow/src/edit/Roadmap.mjs` — **read, never changed**.
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
  operations.

## Known pre-existing issues

- The roadmap fixture in that suite carries a five-column `## Fixes` table
  (`| # | Slug | Status | Depends on | Summary |`) while the repository's index
  and `fixRowUpsertEdits` use the four-column `| Issue | Topic | Status | Notes |`
  — **does-not-affect** this unit's diagnosis (the path bug fires before any
  table shape is read) but **affects** the fix arm's reachability, so `P1`
  repairs the fixture to the shape the writer targets.
- `ceremony roadmap check --slug <slug>` reports `row-missing` for a row that
  exists, because it compares the row's *second* cell to the issue number
  (`E4`) — **does-not-affect** this unit; `P4` verifies the registered row with
  `rg` rather than through that operation.

## Tasks

- P1 — The RED corpus: the fix-arm and feature-arm settle cases plus the four-operation differential in the ceremony suite, and the fixture's `## Fixes` table moved to the writer's four-column shape (validator: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits non-zero, observed before P2)
  (Implements: S1, S2, S4)
  - Relevant files: packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs
- P2 — The fix: `roadmapPath()` to both writer arms, the arm's local read and its `next`/`written` double-write removed, `upserted` read from the writer's own `ok` (validator: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: packages/agentic-workflow/src/runner/ceremony/roadmap.mjs
- P3 — The differential over the base commit in a throwaway copy: `read`, `list`, `settle` and `check` answer byte-identical stdout/exit before and after (validator: `diff /tmp/pe684-base /tmp/pe684-change` answers empty, one file per operation)
  (Implements: S2)
  - Relevant files: docs/fix/684-ceremony-roadmap-upsert/SPEC.md
- P4 — Documentation and state: the unit doc's ledgers and log, the `## Fixes` row registered through the repaired command, and the `docs/LOGS.md` session entry (validator: `rg -c 'issues/684' docs/ROADMAP.md` matches 1)
  (Implements: S1, S4)
  - Relevant files: docs/ROADMAP.md, docs/LOGS.md, docs/fix/684-ceremony-roadmap-upsert/SPEC.md
- P5 — Verification: the strengthened suite and the repository gate (validator: `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4)
  - Relevant files: docs/fix/684-ceremony-roadmap-upsert/SPEC.md

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

## Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md` §2).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | A fix unit settles its own `## Fixes` row through the owner: exit 0, `"upserted": true`, and the row's status cell reads the requested status — the use case #684 was filed for (row 680) | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the `roadmap` case's fix-arm assertions green in that file; `## Log` `E5` | planned |
| O2 | S2 | The feature arm settles a `## Features` row the same way, so the repair is one contract for both tables, never a fix-only patch | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the same case's feature-arm assertions green; `## Log` `E5` | planned |
| O3 | S2, S3 | One writer per write: the arm hands the path to the writer and writes nothing itself, so the file cannot be written twice and no `undefined` can reach `writeFileSync` | P2 | P2 | execute-phase | `rg -c 'typeof next === "string"' packages/agentic-workflow/src/runner/ceremony/roadmap.mjs` matches 1 (only the untouched `settle` arm's own `write`) | the `rg` line and the case's single-write assertion, `## Log` `E5` | planned |
| O4 | S4 | The regression case this issue asks for exists and fails at the base commit: it asserts the row, the receipt and every other byte, so the tautology that let the defect through is gone | P1 | P1 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits non-zero at `55525abad` | the red run captured at base in a throwaway copy; `## Log` `E5` | planned |
| O5 | S4 | Invariant: no byte outside the spliced row moves — the roadmap's other tables, prose and separators are copied through untouched | P1 | P1 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the case's whole-file diff assertion (exactly one line differs); `## Log` `E5` | planned |
| O6 | S2 | Affected use cases that must not regress: `roadmap read`, `list`, `settle` and `check` answer byte-identical stdout and exit at base and at the change | P3 | P3 | execute-phase | a `diff` of the four captured runs against the base copy reports no difference | the four captured outputs and the empty `diff`, `## Log` `E6` | planned |
| O7 | S1 | Required failure state: a writer refusal still exits non-zero and leaves the tree byte-clean, so the repair never turns a refusal into a silent success | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` exits 0 | the case's refusal assertion (a roadmap with no `## Fixes` table refuses and changes nothing); `## Log` `E5` | planned |
| O8 | S1, S4 | The documented close-out route for a fix unit is executable: the repository's own row 684 is registered through the repaired command rather than by hand | P4 | P4 | execute-phase | `rg -c 'issues/684' docs/ROADMAP.md` matches 1 | the row in `docs/ROADMAP.md` and the command's receipt, `## Log` `E9` | planned |

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

## Next

P1 — the RED corpus in `packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`.

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
