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
- **Feature `plan` snapshots require `--parent`**: the Product snapshot digest from
  the newest current `SPEC-REVIEW-PASS`. A fix unit passes its own SPEC snapshot
  digest and says so in the receipt (D6).
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
  [--receipt <receipt-id-or-digest>]
```

It reads the unit's `progress.md`, takes the newest block for that stage (or the one
you name), re-derives the digest from the bytes on disk, and prints
`{current, receipt, observedDigest, digestMatches, verdictIsPass, structural}`.

- exit `0` — current **and** the verdict is that stage's PASS: the consumer may act;
- exit `3` — no receipt for the stage (`missing-receipt-snapshot`), which includes a
  block whose `Snapshot:` field is prose instead of a digest;
- exit `4` — a receipt exists but is no longer current, or is not a PASS: route to
  the stage's review, never to the authoring skill.

`author-readiness` results, prose verdicts and legacy blocks are the cases this
sensor exists to catch: they carry no bound digest, so they fail as
`missing-receipt-snapshot` rather than being interpreted charitably. Nothing here
grants a verdict — only a reviewer turn writes the block.

### Authoring side: rotating the revision

The author's `artifactRevisionId` is the field that lets a reviewer prove its own
write landed. Rotate it on **every** write, including a revert, and rebuild the
snapshot after: `--artifact-revision <new-id>` (the builder defaults it to the current
`HEAD` sha, which is already a fresh value once the write is committed). A reviewer
that sees the same revision as the previous receipt re-uses the previous verdict's
context and must refuse to start.
