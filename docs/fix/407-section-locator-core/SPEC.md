---
type: feature
scope: medium
---

# fix/407-section-locator-core

> One primitive that locates a Markdown section or line range through the AST and
> splices the original string by offset, so every section-splice consumer shares
> one fence-safe, lossless implementation instead of re-deriving heading scans.

## Issue

`#407` — tracked issue in the project's forge. The PR must close it via
`Closes #407` in the body.

Roadmap row: **106 `section-locator-core`**. The issue is the request; the roadmap
row is the index entry, and their dependency cells disagree (see §Known
pre-existing issues).

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — One section/range primitive, built once.**
> One primitive for "locate a markdown section/range and remove or replace it losslessly", built once in the runner crate and consumed by `doc read/edit` (#366), the pi-bundle stripper, and any future section-splice surface.

**S2 — Correctness over convenience: the AST locator.**
> Correctness, not convenience: string `indexOf` heading matching matches `##`-like lines inside fenced code blocks; an AST locator cannot.

**S3 — Locate by mdast positions, mutate by byte-offset splice.**
> Locate via `mdast-util-from-markdown` node positions; mutate via byte-offset splice of the original string (lossless by construction outside edited ranges).

**S4 — Selector resolution.**
> Selector resolution: heading path (depth-aware: a `##` section spans until the next heading of depth ≤ its own), heading regex, line-in-scope (exact / regex).

**S5 — Dual surface.**
> Dual surface: library export + CLI subcommand (`agentic-workflow`).

**S6 — One new dependency, in the runner crate only.**
> New dependency `mdast-util-from-markdown` in the runner crate only (schema package stays dependency-free); pinned per `docs/workflow/PACKAGES.md`.

**S7 — Red-first sibling suite.**
> Red-first sibling suite: fencing-safe cases, nested headings, multi-byte safety, byte-identity of untouched ranges.

**S8 — Untouched bytes are byte-identical (golden).**
> Untouched bytes are byte-identical to the source for every operation (golden).

**S9 — A fenced `## heading`-like line is never a heading.**
> A fenced code block containing `## heading`-like lines is never matched as a heading.

**S10 — 0 or >1 sections raises a typed error.**
> Selector resolving to 0 or >1 sections raises a typed error (callers decide policy).

**S11 — Gates green, dependency pinned, lockfile updated.**
> Root suites pass; dependency pinned and lockfile updated.

**S12 — No dependency.**
> None. Shared prerequisite of #366's remaining scope and the stripper issue.

**S13 — Multi-byte offsets proven before the API freezes.**
> `mdast` position offsets vs byte offsets on non-ASCII content — needs an explicit multi-byte test before the API freezes.

**S14 — Out of scope.**
> Manifest logic, hashing, CI checks (stripper issue); `doc read/edit/index` subcommands (#366); rewriting the existing `src/edit/UnitDoc.mjs` string-splice editors (they keep working; migration is a possible later unit if a defect appears).

## Impact

- **Deliverables consumed later, not by this unit:** `doc read/edit` (#366) and the
  pi-bundle stripper (#410) import `packages/agentic-workflow/src/doc/section-locator.mjs`
  instead of writing their own scanners. Their units are untouched here.
- **The runner crate gains a second dependency** (`mdast-util-from-markdown`,
  exact-pinned) and the root `bun.lock` records its resolution graph. The crate's
  published description/README sentence "one pinned pure-JS dependency" stops
  being true and is corrected in the same change.
- **The CLI router gains a `section` command** and its hardcoded `usage:` line is
  extended; every pre-existing command keeps its own branch untouched.
- **The schema package is untouched** and stays dependency-free (S6).
- **The retrieval chunker (`src/doc/chunks.mjs`) is untouched.** It stays the
  fence-aware line scanner for the FTS store; the locator is the AST-based
  section/range primitive. Two consumers, two contracts, no shared rewrite.
- **Nothing about `src/edit/UnitDoc.mjs` changes** (S14): its `indexOf`-based
  editors keep working and keep their defect; a later unit may migrate them.

## Retirements

Nothing is retired: this unit only adds a primitive.

- No existing surface is superseded — `rg -c 'section-locator' packages/ scripts/` → 0
  at the cut head, so there is no predecessor to delete.
- `src/doc/chunks.mjs` is not superseded: it answers a different question (chunks
  for the retrieval index, 1-based inclusive lines) and its suites stay green.
- The crate's dependency *claim* is corrected, not retired: the word "one" becomes
  the real inventory (S6).

## Non-goals

- S14 in full: manifest logic, hashing, CI checks, the `doc read/edit/index`
  subcommands, and any rewrite of the `UnitDoc.mjs` string-splice editors.
- No new schema-package types and no dependency there.
- No silent normalization: the primitive never reformats untouched bytes, and it
  never edits the source string outside the reported range.
- No publish, no version bump by hand: the release intent is a changeset.
- Findings discovered during implementation never expand this unit.

## Risk tier

Computed, never chosen:

```text
$ bun scripts/ceremony.mjs tier classify
"tier": "standard"
"reason": "the change names no path, so nothing proves it inert — fail closed upward"
```

- **Tier** — `standard` · **Task Size** — understood · contained risk · resumable from diff
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

| Rule | Binds |
|---|---|
| The selector grammar is the contract #366 and #410 consume; widening it is a SPEC change owned by the consuming unit, never a quiet addition here | whoever extends the selector set |
| Sections are **ATX headings that are direct children of the document root**; a setext heading, a blockquote heading and a fenced heading are never sections (S2/S9). Adding setext support is a deliberate contract change with its own test | any later consumer that wants setext or quoted headings |
| `start`/`end` are UTF-16 code-unit offsets into the source string; `byteStart`/`byteEnd` are derived. A consumer that hashes a range must use the byte fields, never the string offsets (S13) | anyone hash-binding a removed range, e.g. #410's manifest |
| The runner crate now ships two exact-pinned dependencies; the next one follows `docs/workflow/PACKAGES.md`'s pin rule and the same-PR lockfile update | the next dependency change in `packages/agentic-workflow` |

## Applicable tests

- `packages/agentic-workflow/test/doc.section-locator.test.mjs` — the red-first
  library suite: fencing safety, nested headings, multi-byte offsets,
  byte-identity goldens, typed errors, selector resolution, dependency pin.
- `packages/agentic-workflow/test/section.cli.test.mjs` — the CLI surface:
  `locate`/`remove`/`replace`, stdout/`--write`/`--json`, refusal and usage exits.
- `bun scripts/run-root-suite.mjs --bail` — the root suites (S11).
- The crate's node leg (`bun run test:node` in `packages/agentic-workflow`) —
  the guaranteed-fallback runtime.
- Differential check against the base commit (`6fbfa115`) for every pre-existing
  CLI command, run from a throwaway copy and recorded in the `## Log` (S11).

## Known pre-existing issues

- **`src/edit/UnitDoc.mjs:setSection` is fence-blind** (`content.indexOf("\n## ")`).
  Observed: a unit doc whose Evidence body carries a fenced `## Non-goals` example
  is spliced at that fenced line, producing a dangling fence and a promoted
  heading. **Does not affect this unit** (S14 keeps the migration out) — it is the
  defect class S2 exists to keep out of the new primitive, and it is pinned as a
  reproducer in the new suite's corpus.
- **Roadmap row 106 says `depends on 105`, the issue's `Dependencies` says `None`**
  (S12), and #406 is open with no unit folder. **Does not affect this unit**: the
  in-scope list consumes no #406 type; the row's cell is sequencing, and the owner
  chose #407 first (2026-11-05 session log). The cell is left as the index has it.

## Tasks

- P1 — Locate sections through the mdast node positions with typed selector resolution and lossless splice (validator: `bun test test/doc.section-locator.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S7, S8, S9, S10, S13, S14)
  Relevant files: packages/agentic-workflow/src/doc/section-locator.mjs, packages/agentic-workflow/test/doc.section-locator.test.mjs
- P2 — Pin the parser dependency and publish the library type projection (validator: `rg -c '"mdast-util-from-markdown": "2\.1\.0"' packages/agentic-workflow/package.json` matches 1)
  (Implements: S3, S5, S6, S11)
  Relevant files: packages/agentic-workflow/package.json, packages/agentic-workflow/src/doc/section-locator.d.mts, bun.lock
- P3 — Add the `section` CLI subcommand over the same primitive (validator: `bun test test/section.cli.test.mjs` exits 0)
  (Implements: S5, S10)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/doc/section-grammar.mjs, packages/agentic-workflow/test/section.cli.test.mjs
- P4 — Correct the crate reference and record the release intent (validator: `rg -c 'section locate' packages/agentic-workflow/README.md` matches 1)
  (Implements: S5, S6, S11)
  Relevant files: packages/agentic-workflow/README.md, .changeset/407-section-locator-core.md
- P5 — Run the full offline gate over both runtimes (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S11, S12)

### Planning evidence

M/L home: the rows live beside this document in
[`planning-evidence.md`](planning-evidence.md) — never embedded here.

### Obligations

M/L home: the rows live beside this document in
[`planning-obligations.md`](planning-obligations.md) — never embedded here.

## Triaged steps

This change is applied locally by the owner's direct-application workflow (no
lane, no `review-change`, no `audit-pr` on this unit), so the step list is the
task list above; the deterministic routers still judge the document.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-05, the issue, verbatim:
  ```
  ## Goal

  One primitive for "locate a markdown section/range and remove or replace it losslessly", built once in the runner crate and consumed by `doc read/edit` (#366), the pi-bundle stripper, and any future section-splice surface. Correctness, not convenience: string `indexOf` heading matching matches `##`-like lines inside fenced code blocks; an AST locator cannot.

  ## Business value

  Removes three planned reimplementation; fixes a latent correctness defect class in section splicing; unblocks #366.

  ## In scope

  - Locate via `mdast-util-from-markdown` node positions; mutate via byte-offset splice of the original string (lossless by construction outside edited ranges).
  - Selector resolution: heading path (depth-aware: a `##` section spans until the next heading of depth ≤ its own), heading regex, line-in-scope (exact / regex).
  - Dual surface: library export + CLI subcommand (`agentic-workflow`).
  - New dependency `mdast-util-from-markdown` in the runner crate only (schema package stays dependency-free); pinned per `docs/workflow/PACKAGES.md`.
  - Red-first sibling suite: fencing-safe cases, nested headings, multi-byte safety, byte-identity of untouched ranges.

  ## Out of scope

  - Manifest logic, hashing, CI checks (stripper issue); `doc read/edit/index` subcommands (#366); rewriting the existing `src/edit/UnitDoc.mjs` string-splice editors (they keep working; migration is a possible later unit if a defect appears).

  ## Acceptance criteria

  - Untouched bytes are byte-identical to the source for every operation (golden).
  - A fenced code block containing `## heading`-like lines is never matched as a heading.
  - Selector resolving to 0 or >1 sections raises a typed error (callers decide policy).
  - Root suites pass; dependency pinned and lockfile updated.

  ## Dependencies

  None. Shared prerequisite of #366's remaining scope and the stripper issue.

  ## Open questions / risks

  - `mdast` position offsets vs byte offsets on non-ASCII content — needs an explicit multi-byte test before the API freezes.

  Automated written using an AI.
  ```
- **L2** — 2026-11-05, request context, verbatim from the owner's application order:
  ```
  Apply to this repository: issue #407

  This is a local, unpublished workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step: … Work inline — never run this repo's own machinery on its own surgery. No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: plan briefly, implement, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```

## Next

P1 — the RED library suite first (`doc.section-locator.test.mjs` observed failing on the missing module), then the implementation observed green.

## References

- Issue [#407](https://github.com/gtrabanco/agentic-workflow/issues/407) — this unit.
- Roadmap row 106 `section-locator-core` (`docs/ROADMAP.md`).
- Issue [#366](https://github.com/gtrabanco/agentic-workflow/issues/366) (doc read/edit/index) and feature 71 `doc-cli` — first consumer.
- Issue [#410](https://github.com/gtrabanco/agentic-workflow/issues/410) (pi-bundle stripper) — second consumer.
- `docs/workflow/PACKAGES.md` — the dependency pin rule S6 cites.
- `docs/fix/319-location-index-consolidation/SPEC.md` F14 — the same fence-blindness
  defect class in a sibling scanner, repaired there with one fence grammar.

## Branch

`feat/407-section-locator-core`

## Depends on

empty — S12: the issue's `Dependencies` section says `None`, and this unit consumes
no artifact of #406 (roadmap row 105); see §Known pre-existing issues.

## Regression scope

| Scenario | Verifying command |
|---|---|
| Every pre-existing CLI command behaves as at the base commit | differential run of `unit-doc`, `roadmap`, `changelog`, `budgets`, `manifest`, `doc`, `memory`, `log` against a base-commit copy (`6fbfa115`) — same stdout/stderr/exit |
| The retrieval chunker and its suites keep their behaviour | `bun run test` in `packages/agentic-workflow` (chunks/query/sync suites unchanged) |
| The schema package stays dependency-free and green | `bun run test` in `packages/agentic-workflow-schema`; `rg -c '"dependencies"' packages/agentic-workflow-schema/package.json` matches 0 |
| The root suites keep passing | `bun scripts/run-root-suite.mjs --bail` exits 0 |
