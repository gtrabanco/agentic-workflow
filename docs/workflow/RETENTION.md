# Document retention — the settled carrier, the trim, and the archive

> A merged unit's process artifacts are never read again. This page owns the
> procedure that collapses them into the unit's permanent record, and the
> contracts a reader, a sensor or a restore depends on. It is the product
> surface, not a one-off sweep: a project that enables `docRetention` runs it
> per unit, and a project that does not still gets the detection.

## Why a third carrier

A unit folder carries two different things: the **permanent record** (what was
asked, what was promised, what was decided, what was learned) and the **process
trail** (phase logs, task lists, the evidence table, review ledgers). After 40–50
shipped units the second one dominates the tree, and every reader — the retrieval
index, the sensors, a human — pays for bytes nobody needs. Deleting them loses
the traceability a later audit asks for; keeping them makes the cost grow with
every unit shipped. A **settled** carrier is the third answer: the record stays,
the trail moves to a restorable archive, and the unit stays readable by every
existing reader.

`legacy`, `spec-by-reference` and `settled` are all valid **forever**, per
document. A repository that toggled archiving on and off carries full and settled
units side by side and every one of them validates.

## The settled carrier

```text
settled-carrier@1
section | required | what a settled unit keeps
Specs | yes | the requester's words, verbatim, with their ids
Acceptance criteria | yes | the frozen criteria the unit shipped against
Impact | yes | what the change touched beyond its own files
Non-goals | yes | what the unit is not
Future cost | yes | the standing obligations it imposes
Known pre-existing issues | yes | what was red or broken before it and whether it affected it
Log | yes | every `L`/`E`/`G`/`F`/`D`/`R`/`V` line, untouched
References | yes | the issues, roadmap row and PR the unit belongs to
Future | no | the deferred ideas; kept when present, tolerated when absent
Surfaces · Retirements · Risk tier | no | the plan-time blocks; kept when present
```

The settle is a **carrier** change, never a content rewrite:

- `## Tasks`, `## Findings`, `## Applicable tests` and `## Next` are removed — a
  settled unit has no open work, and the open-findings table is empty by
  definition (the trim refuses a unit whose legacy `review-findings.md` still
  carries an unfoleded row).
- The **evidence table collapses into exactly one `E` line** appended to
  `## Log`, carrying the commands it recorded, their exit status and a digest of
  the bytes that left. `log-kind@1` already publishes `E`, so no new token enters.
- **Every `## Log` line survives verbatim.** That is the whole point: the
  request (`L1`), the owner decisions (`D`), the review marks (`R`), the folded
  findings (`F`), the verifications (`V`), the gate runs (`G`) and the evidence
  (`E`) are the unit's traceability, and `findings-corpus` and the sensor's
  `readLogMarks` read them there.
- Every kept section is re-emitted **byte for byte**; the projection never
  re-renders prose.
- The stamp is re-emitted at settle: the carrier derives `unit-doc@3`, with
  grammars `log-kind`, `obligations`, `unit-doc`. A document whose headings no
  longer satisfy the settled carrier is refused, never stamped with a format its
  own body denies.

## Eligibility — one predicate, two proofs

`classifyUnitRetention()` in `packages/agentic-workflow-schema/src/doc-retention.ts`
is the only answer to "is this unit a candidate". It resolves one state, in this
order:

| State | Meaning |
|---|---|
| `not-done` | the roadmap/fix-index row is not `done` — the merge proof the offline CLI can read |
| `already-settled` | the carrier is already `settled` |
| `unstamped` | no `doc-provenance@1` block: **out of scope forever** |
| `older-format` | stamped `unit-doc@1` (the legacy carrier) |
| `unknown-carrier` | the headings satisfy no accepted shape |
| `open-findings` | a legacy `review-findings.md` still carries an unfoleded row |
| `dirty-unit-dir` | the unit folder carries uncommitted bytes |
| `eligible` | every gate passed |

**Proved-merged has two proofs and one predicate.** The CLI is offline, so its
proof is the `done` lifecycle row plus a committed unit folder; the sensor adds
its forge merge resolver on the same row. Both then apply the same carrier and
stamp half, so the report and the write path never disagree about *candidacy*.

**Unversioned documents never become eligible by accident.** A unit written
before the provenance stamp (`#462`) carries no `format:`; the documented path is
a provenance re-stamp — `agentic-workflow unit-doc <slug> provenance` writes the
stamp the carrier derives — and only then does the unit enter the matrix.

**The config never invalidates a document.** `docRetention.mode` gates the trim
step only. `keep-all` (the shipped default) still reports eligibility; it just
does not offer the trim, and it never makes a settled or a full document refuse.

## The commands

```
agentic-workflow doc archive --dry-run            # the full report, writes nothing
agentic-workflow doc archive --unit <id>          # settle one unit
agentic-workflow doc archive --all-eligible       # settle every unit past the window
agentic-workflow doc restore --unit <id>          # put the trail back
```

- **`--dry-run` prints every row**: the candidates with the files it would trim,
  every non-candidate with its refusal reason, and every **out-of-scope** document
  (`unstamped`, `older-format`) named rather than skipped.
- **A refusal moves no byte.** All preconditions are evaluated over the whole plan
  before the first write; a target that fails one is reported with its reason and
  skipped.
- **Write order per unit**: the archive is staged and renamed into place (it is
  durable first), then the carrier is settled in place, then the trimmable files
  are removed. A failure at any step leaves either the full carrier or the settled
  one, never a half state.
- Exit: `0` the report ran or every target settled · `2` a refusal, with the
  published reason on the `DOC REFUSAL —` line.

## The archive

```text
retention-archive@1
field | what it binds
contract | `doc-retention-archive@1`
unit | the repo-relative unit folder the archive belongs to
settled_at | the UTC instant the settle ran
source_revision | the `HEAD` the settle ran at
spec_digest | `sha256:<64 hex>` of the carrier before the settle
files | one row per archived file: `path | contentHash` (`sha256:<64 hex>`)
```

`<archiveDir>/<unit>/` holds `manifest.json` plus `files/<name>`. The directory
defaults to `.agentic-workflow/archive` and **must be gitignored**: the write path
refuses a directory git does not ignore (`archive-not-ignored`), because a trim
whose archive is committed has only moved the bytes.

`restore` re-hashes every archived file **before the first write** and refuses
`content-hash-mismatch`, `target-conflict` or `archive-incomplete` — a tampered
archive can never overwrite a settled document.

The rows are not `projection-manifest@1` rules: a projection rule names a source,
a selector and the command that enforces a removal from a rendered document, and
an archived unit file has none of those. What is reused is the digest spelling
(`sha256:<64 lowercase hex>`) and the removal semantics.

**The seam hook** (`docRetention.seamHook`) is the project-declared offsite copy.
It runs after the local archive is durable, with `AGENTIC_WORKFLOW_UNIT` and
`AGENTIC_WORKFLOW_ARCHIVE_DIR` in its environment. A non-zero exit is reported as
a degradation: the local record is never destroyed by a failed copy.

**Local deletion is off by default.** `docRetention.archiveRetentionDays: null`
means the archive is never pruned; a number prunes it only after the configured
window.

## The trim declaration

Every unit-doc template declares, in its own preamble, which carrier files a
settle trims and which it keeps, so the ceremony and the matrix move together:

```text
retention-declaration@1
column | shape | what it holds
path | <bare file name> | a carrier file of the unit folder
disposition | trimmable \| kept \| out-of-scope | what a settle does with it — the published matrix's answer, or a path this project declares out of scope
```

`bun scripts/retention-declaration.mjs --check` refuses a missing matrix row, a
conflicting disposition, a `trimmable`/`kept` row the matrix does not publish, a
duplicate and a template with no block. The matrix itself is published once, in
`UNIT_DOC_TRIM_FILES` / `UNIT_DOC_KEEP_FILES`; the declaration and the gate are
two readers of it, never a second copy.

## Detection

| Surface | What it says |
|---|---|
| `workflow-status` | `detail.retention.pending_trim[]` — one row per candidate past the window, with the archive command it would run — and `detail.retention.out_of_scope[]` for the documents that can never be settled. The command reaches `next.continuation` only when the resolver has nothing actionable to recommend and `docRetention.mode` is `archive`. |
| `product-audit` | the **Retention debt** dimension, whose producer is `bun scripts/retention-debt.mjs` (`retention-debt@1`, codes `pending-trim`, `unstamped-doc`, `unclassified-file`). |
| `unit-lane` close-out | reads `pending_trim[]` and offers the archive command when the project allows the trim step. |

```text
retention-debt@1
row | what it carries
root · mode | the tree read and the configured posture
units · pending · out-of-scope | the counts
unit | one row per unit folder: its state and the files a settle would trim
finding | `<code> \| <unit> \| <detail>` — the closed code set above
verdict | `PASS` (no debt) or `DEBT` (at least one finding)
```

## The reader contract

A settle must not break a reader, so each reader that touches a unit carrier was
reconciled when the carrier landed:

- `resolveUnitDocShape()` resolves the third shape from the headings; every
  reader iterating `UNIT_DOC_SECTION_SHAPES` learns it with no private list.
- `deriveFormat()` maps `settled` → `unit-doc@3`; `readDocProvenance()` treats
  `unit-doc@1`/`@2` as older-and-readable (degrade, never refuse for age).
- `findings-corpus` reads the `## Log` marks whether or not a `## Findings` table
  is there.
- `docs-generate` derives a rowless feature folder's status from the carrier: a
  settled unit reads `done`, and its missing `## Tasks` can never flip it back to
  `defined`.
- `Verify.mjs` refuses a half-trimmed document (no carrier resolves) and a stamp
  whose format disagrees with the headings.
- The sensor's `readLogMarks` keeps `D`, `F`, `R`, `V` and `G`, which survive by
  construction because the trimmer never edits a log line.
- `relay obligationsOf` reads the obligations ledger the matrix keeps in place,
  so the lane-time check is unaffected.

## Related

- Carrier precedent: `spec-by-reference` (issue #308) and the stamp (issue #462).
- The config section is documented in [CONFIG.md](CONFIG.md).
- The audit dimension lives in
  [`skills/product-audit/references/AUDIT_DIMENSIONS.md`](../../skills/product-audit/AUDIT_DIMENSIONS.md).
