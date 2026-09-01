## The snapshot recipe (mechanical, executable)

Every verdict, receipt and freshness check in this workflow binds a **snapshot
digest**. One command produces it, so an author, a reviewer and a consumer cannot
drift apart while reading the same bytes.

```bash
node scripts/pre-execution-snapshot.mjs build --stage <spec|plan> --unit <NN-slug|fix-N> \
  [--dir <artifact-dir>] [--unit-kind <feature|fix>] [--artifact-revision <id>] \
  [--source-revision <sha>] [--parent <64-hex>] [--json <out-file>]
```

It prints the digest on the first line and (unless `--json`) the canonical snapshot
object. The values come from `@gtrabanco/agentic-workflow-schema`
(`buildPreExecutionArtifactSnapshot` → `digestPreExecutionArtifactSnapshot`): sorted
object keys, context rows ordered by kind then identifier, UTF-8, lowercase SHA-256.
A refused build prints the diagnostic codes and exits non-zero — a partial binding is
never printed as a digest.

### What each stage binds

| Stage | Artifact rows | Selector |
|---|---|---|
| `spec` | exactly one: `spec` → `SPEC.md` | `spec-product-v1` (title, `## Goal`, `## Branch`, `## Size`, `## Dependencies`, the Product half, `## Design status`) so planning writes cannot move a Product digest |
| `plan` | `spec`, `acceptance`, `planning-evidence`, `obligations`, `plan`, `tasks`, `testing`, `decisions`, `architecture-notes` — one row per file that exists | `whole-file` |

Rules the builder enforces and no caller may improvise around:

- **`SPEC.md` and `ACCEPTANCE.md` are required** for their stage: a missing one is
  refused, not silently dropped, because dropping it would bind a smaller set than
  the contract reviewed.
- **A ledger that lives inside the SPEC has no row** (D20): an XS/S or fix unit
  embeds `### Planning evidence` / `### Obligations`, so those rows are absent and
  their bytes are already bound by the `spec` row. Never point a row at a file that
  does not exist to make the set look complete.
- **A feature `plan` snapshot requires `--parent`**: the Product snapshot digest from
  the newest current `SPEC-REVIEW-PASS`. A **fix** unit binds **no parent at all**
  (`parentSpecSnapshotDigest: null`) and says so in the receipt: it has no Product
  half, and the only `stage: spec` binding this repository sanctions is
  `spec-product-v1`, which cannot select a half that does not exist (D6, D30).
  Passing a fix unit's own SPEC bytes off as a parent is refused by the contract,
  because the field means "the Product review I descend from".
- **Context rows are the authorities actually consulted**, each `present` with its
  digest or `absent` with `null`: `roadmap-row`, `project-guide`,
  `normalized-repository-state`, `architectural-invariants` (the *project's* declared
  file — the portable workflow contract is not a project's rule set), plus
  `governing-issue` and `dependency-unit` when the unit has them.
- **A snapshot digest is not a git blob id.** `git hash-object` stays the convention
  for the frozen `ACCEPTANCE.md` manifest receipt only; comparing it to a snapshot
  digest proves nothing and a sensor that does so is wrong, not cheap.

### Re-verifying a receipt (consumers)

```bash
node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan> --unit <NN-slug|fix-N> \
  [--dir <artifact-dir>] [--unit-kind <feature|fix>] [--receipt <receipt-id-or-digest>] \
  [--parent <64-hex>] [--policy <version>] [--source-revision <sha>] [--artifact-revision <id>]
```

`verify` shares the builder with `build`, so a feature plan check needs `--parent`
like the build did, and a fix check must omit it — the snapshot it re-derives has to
be the same shape the reviewer bound, or the comparison is meaningless.

It reads the unit's `progress.md`, takes the newest block for that stage (or the one
you name), re-derives the digest from the bytes on disk, and prints
`{current, receipt, observedDigest, digestMatches, verdictIsPass, structural}`.

`structural` is the **attribution** (finding RS13): `{fresh, reasonCode, detail,
changedPaths}`. A consumer holds only the digest a receipt recorded, never the
reviewed snapshot object, so the sensor answers from the identity lines the receipt
itself pins (Stage, Unit, Unit kind, Policy, Source revision, Parent SPEC snapshot,
Artifact revision) plus git evidence over exactly the paths the snapshot binds — in
`comparePreExecutionReceiptToSnapshot`'s documented precedence, and only with codes
from `PRE_EXECUTION_FRESHNESS_CODES`. It never fabricates a reviewed object to feed
the comparator: that would be evidence forgery wearing a real reason code. The parity
between the two is asserted case by case in
`scripts/pre-execution-attribution.test.mjs`; `scripts/pre-execution-sensor.test.mjs`
drives the CLI end to end in a throwaway repository.

`changedPaths` names files only for the dimensions git can actually explain
(`stale-context`, `stale-source-revision`, `stale-artifact-content`). A lineage
report names none: when `stale-parent` fires, the moved bytes belong to the *Product*
snapshot, and pointing at this snapshot's own files would claim a cause the report
cannot see.

- exit `0` — current **and** the verdict is that stage's PASS: the consumer may act;
- exit `3` — no receipt for the stage (`missing-receipt-snapshot`), which includes a
  block whose `Snapshot:` field is prose instead of a digest. That code means *"this
  receipt binds nothing I can read"* and nothing else: drift always gets its own
  dimension, which is the half of RS13 a consumer can act on;
- exit `4` — a receipt exists but is no longer current, or is not a PASS: route to
  the stage's review, never to the authoring skill.

`author-readiness` results, prose verdicts and legacy blocks are the cases this
sensor exists to catch: they carry no bound digest, so they fail as
`missing-receipt-snapshot` rather than being interpreted charitably. Nothing here
grants a verdict — only a reviewer turn writes the block.

### Authoring side: rotating the revision

The author's `artifactRevisionId` is the field that lets a reviewer prove its own
write landed. Rotate it on **every** write, including a revert, and rebuild the
snapshot after: `--artifact-revision <new-id>` (left unset, the builder derives both
`sourceRevision` and `artifactRevisionId` from the newest commit that touched a path
this snapshot binds — not from live `HEAD`, which rotated every receipt on every
unrelated commit, including the commit that recorded it: RS3(b)). A named authoring
event is still the stronger record: prefer an explicit id such as
`28-spec-repair-rs-20260831` over the derived sha. A reviewer that sees the same
revision as the previous receipt re-uses the previous verdict's context and must
refuse to start.
