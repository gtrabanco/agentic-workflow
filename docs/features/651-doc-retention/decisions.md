# 651 — decisions

Owner decisions inherited from the issue are cited as `S12`-style quotes in the
unit doc; the entries below are the decisions this cut had to take where the
issue delegated the choice to planning.

## D1 — The settled carrier is `unit-doc@3`, shape `settled`

The shape table gains a third member (`settled`) and the provenance format
vocabulary gains `unit-doc@3`. The settled **required** section set is
`Specs · Acceptance criteria · Impact · Non-goals · Future · Future cost ·
Known pre-existing issues · Log · References`.

`Acceptance criteria` is in the settled required list because it belongs to the
*legacy* list too: `validate()` refuses a section that belongs to another
accepted shape unless the resolved shape requires it, so leaving it out would
make every settled unit fail its own shape check. `Evidence` is deliberately
**not** a settled section: S3 says the evidence collapses to one digest line,
and `log-kind@1` already carries an `E` line for exactly that.

Authority: S2, S3; evidence PE-001, PE-006.

## D2 — The reader's own generation advances to `unit-doc@3`

`CURRENT_READER.format` moves from `unit-doc@2` to `unit-doc@3`, and
`readable_from` stays `0`, so `unit-doc@1` and `unit-doc@2` documents degrade
(`format-older-compatible`) and are never refused for age. The alternative —
leaving the reader at @2 — would refuse every settled document as
`format-newer-than-reader`, which contradicts S2 ("all valid forever").

The consequence is pinned, not hidden: the canonical fixture in
`test/doc-provenance.test.mjs` moves to @3 and the @2 case stays asserted as a
degradation. No call site branches on `current`; the one non-test reader that
branches on a verdict (`Verify.mjs:155`) branches on `refuse`, which is
unchanged for @1/@2.

Authority: S2; evidence PE-002, PE-015.

## D3 — The trim matrix has one owner

`UNIT_DOC_TRIM_FILES` and `UNIT_DOC_KEEP_FILES` are published once, in
`packages/agentic-workflow-schema/src/doc-retention.ts`, and every consumer
imports them (the crate's write path, the declaration gate, the producer). A
file in neither list is `unclassified` and **refuses** the write path instead of
being guessed — the matrix can grow only by editing the publisher.

Authority: S4, S9; evidence PE-001.

## D4 — "Proved-merged" has one offline answer and one online answer

The CLI must refuse a unit that has not shipped, and it runs offline (no forge).
The two halves are the same predicate with different proof strength:

- `status: "done"` on the unit's roadmap/fix-index row — the lifecycle mark this
  repository already treats as shipped (the sensor's own `mergeResolver` builds
  on it);
- `carrier: "legacy" | "spec-by-reference"` plus `format` at `unit-doc@2` or
  newer — the stamp gate S5/S6 require;
- the unit folder carries no uncommitted bytes (`git status --porcelain` over the
  folder is empty), so a settle never archives work that exists only on disk.

The sensor adds its forge proof (`mergeResolver` on the same `done` row) and
reuses the carrier half verbatim, so `pending_trim` and the CLI never disagree
about *which* unit is a candidate — only about how strong the merge proof is,
and the weaker one is still a refusal-free `done` row.

Authority: S5, S6, S8; evidence PE-005.

## D5 — One archive layout, one restore contract

`<archiveDir>/<unit-id>/` holds `manifest.json` plus `files/<name>` for every
trimmed file. `manifest.json` declares
`contract: "doc-retention-archive@1"`, `unit`, `settled_at`, `source_revision`
(the `HEAD` the settle ran at), the settled SPEC's digest, and one row per
archived file: `path | contentHash` in the published `sha256:<64 hex>` spelling.

The rows are **not** `projection-manifest@1` rules: a rule requires an
`enforcingCommand` and a selector for a projection to remove, and an archived
unit file has neither. What is reused is the digest spelling and the
`remove`-op semantics (the file no longer lives in the unit folder).

`doc restore` re-hashes each archived file and refuses on any mismatch before
writing, so a tampered archive can never silently overwrite a settled document.

Authority: S5; evidence PE-014.

## D6 — `docRetention` section shape and defaults

```json
{
  "mode": "keep-all",
  "pendingTrimAfterDays": 0,
  "archiveDir": ".agentic-workflow/archive",
  "archiveRetentionDays": null,
  "seamHook": null
}
```

- `mode`: `keep-all` (the default — detection reports, the trim step never runs)
  or `archive` (the trim step may run). It gates **only** the trim step, never
  validation (S6).
- `pendingTrimAfterDays`: the age window `pending_trim[]` waits before offering a
  merge; `0` reports immediately, which is the answer the issue's open question
  gets — age is not evidence, and a threshold that hides debt is the defect the
  feature exists to remove.
- `archiveDir`: repo-relative, gitignored; `doc archive` refuses a path outside
  the repository.
- `archiveRetentionDays`: `null` = never prune the archive (S5's "default:
  never").
- `seamHook`: `null` or a command string the project declares; it receives
  `AGENTIC_WORKFLOW_ARCHIVE_DIR` and `AGENTIC_WORKFLOW_UNIT` in its environment.
  A hook that exits non-zero is reported as a degradation **after** the local
  archive is committed on disk — the offsite copy can fail without destroying
  the local record.

Authority: S5, S6, S7; evidence PE-018.

## D7 — `detail.retention` is the sensor surface; the continuation never hijacks a decision

`pending_trim[]` lives at `detail.retention` (the `DETAIL_KEYS` licence), not at
the envelope top level: it is a sensor projection, and the strict envelope
already refuses an undeclared `detail` key. Each row carries the archive command
it would run.

`next.continuation` is projected **only** when the deterministic resolver's
answer is the nothing-to-do fallback — otherwise retention would outrank an
actionable recommendation and the sensor would recommend housekeeping over work.
The archive command is otherwise available as `pending_trim[].command`.

Authority: S8; evidence PE-004.

## D8 — Trim declaration: a block in the templates, not an annotation per section

The mechanism S9 leaves open is a `retention-declaration@1` block carried by the
four unit-doc templates (features/fix × repo/template). Rows are
`path | disposition` with `disposition` in `trimmable | kept | out-of-scope`, and
`scripts/retention-declaration.mjs --check` compares every row against the
published matrix — an unclassified path, a conflicting disposition or a matrix
file with no row is refused by name. A per-section annotation would have to sit
in prose no machine reads; a block is what `normative-surfaces@1` can resolve.

Authority: S9; evidence PE-001, PE-010.

## D9 — `G` lines survive by construction

The issue leaves open whether `G` (gate-run) lines also survive as one-liners.
The trimmer **never edits a `## Log` line** — the settled grammar keeps the whole
section — so `L1`, `D`, `E`, `G`, `F`, `R` and `V` all survive with no rule of
their own. Nothing to decide per token; the guarantee is structural.

Authority: S3, S10; evidence PE-007.

## Residual promises

None. Every surface this unit adds has a shipped consumer in the same change:

| surface | consumer |
|---|---|
| `UNIT_DOC_TRIM_FILES` / `UNIT_DOC_KEEP_FILES` | `packages/agentic-workflow/src/retention/retention.mjs`, `scripts/retention-declaration.mjs` |
| `classifyUnitRetention()` | `src/retention/retention.mjs`, `scripts/retention-debt.mjs`, `src/runner/sensors/workflow-status.mjs` |
| `UNIT_DOC_SETTLED_SECTIONS` | `resolveUnitDocShape()` → `UnitDoc.mjs`, `unit-route.mjs`, `Verify.mjs`, the sensor, `findings-corpus.mjs` |
| `unit-doc@3` | `deriveFormat()`, `readDocProvenance()`, `Verify.mjs` |
| `docRetention` config section | `src/retention/retention.mjs` (the trim gate), `config` CLI (generated), `init-workspace` |
| `detail.retention` | the `unit-lane` close-out and the `workflow-status` consumer |
| `retention-declaration@1` | `scripts/retention-declaration.mjs`, the four templates |
