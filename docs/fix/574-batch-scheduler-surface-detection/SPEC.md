---
type: fix
scope: medium
ac-hash: 1a615a18f6801f04fa9b8b15c9af946d88d8087ecce8347ac7904f92dd7a0e37
roadmap_summary: Issue [#574](https://github.com/gtrabanco/agentic-workflow/issues/574) (M): batch-scheduler surface detection had three blind spots — a fenced code block in an issue body desynchronised the global backtick pairing and swallowed every later declared token (#504 declares `packages/pi-agentic-workflow/` and resolved to no surface at all), an issue declaring nothing was silently planned as `general` with no degradation and no finding, and a unit doc on disk was never consulted. The planner now tokenizes per line with fenced blocks inert, reads a declared `## Surfaces` section first (`## Where`/`## In scope` unchanged), falls back to the unit doc's `## Surfaces` and then its `Relevant files:`, and reports each blind issue as `surface-unknown-issue-<n>` in `degraded[]` plus a `blind-spot` finding when a batch carries two or more. The four SPEC templates and the four issue forms publish the section; `--infer-surfaces <n>` prints the ready-to-paste declaration for triage. SPEC: [SPEC](fix/574-batch-scheduler-surface-detection/SPEC.md)
---

# fix/574-batch-scheduler-surface-detection

> Fix specification — one single unit document. Applied through the owner's
> local, unpublished workflow: the ledgers below are frozen at cut, the change
> is worked inline, and the owner is the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#574` — [BUG: batch-scheduler surface detection blind spots — issues without
## Where/Scope are silently parallel-safe](https://github.com/gtrabanco/agentic-workflow/issues/574).
The PR closes it via `Closes #574`.

## Specs

**S1 — The templates publish a `## Surfaces` section.**
> Add a mandatory `## Surfaces` section to the issue template and feature/fix SPEC template.
>
> Where surface keys match the existing batch-scheduler lane keys: `packages/<name>`, `skills/<name>`, `scripts`, `docs`, `template`, `.github`.

**S2 — Triage declares the surfaces when the body does not.**
> When triaging an issue (unit-lane plan step), if `## Surfaces` is absent, triage-issue should:
> - Read the issue body to infer likely surfaces from context (e.g., mentions of file names, package names, script paths)
> - Add a `## Surfaces` section to the issue body with the inferred surfaces
> - If inference fails, mark as `surface-unknown` and report a `degraded: surface-unknown` in the batch plan

**S3 — The scheduler stops being quiet about an unknown surface.**
> Enhance the scheduler to:
> - Detect issues with missing surfaces and report them as `degraded` in the envelope
> - Use any surface information from unit docs (SPEC.md, unit-folder files) as a fallback
> - Consider `degraded: surface-unknown` as a signal for the human to prioritize serial execution over parallel
> - When multiple issues have `surface-unknown` in the same batch, report a `blind-spot` finding

**S4 — Existing open issues pick the surface up through triage.**
> All existing open issues with unit docs get their surfaces inferred and written to the issue body during triage

**S5 — The parser's suite covers the three sources.**
> Tests: `scripts/batch-scheduler.test.mjs` covers surface detection from issue body, from unit docs, and degraded path

**S6 — The root suite passes.**
> Root suite passes

The issue's `## Problem` examples are context, not requirements: they do not
reproduce as written. Measured at cut head `888aaceb` with the shipped
`extractSurfaces` over the 11 open issues, `#504` and `#560` both resolve to
`{docs, scripts}` (they already share two lanes) and `#504`/`#568` resolve to
`packages/pi-agentic-workflow` and `packages/agentic-workflow` (disjoint). The
defect the issue describes is real; its named pairs are not the shape it takes.
See `PE-001`–`PE-003`.

## Impact

- `scripts/batch-scheduler.mjs` — the section reader, the tokenizer, the
  surface resolution chain, the degraded entry, the finding and the
  `--infer-surfaces` flag. Its consumers: `workflow-status` (reads the same
  shared parsers, never this script), the `batch-scheduler` skill (prose), and
  every operator who reads `degraded[]`/`findings[]`.
- `packages/agentic-workflow-schema` — two closed vocabularies gain a value
  (`BATCH_FINDING_CODES` += `blind-spot`, the `degraded[]` pattern += the
  `surface-unknown-issue-<n>` family) and the draft-07 projection follows. The
  document version does **not** move: no field is added (the #509 precedent).
- The four SPEC templates (`docs/` and `template/`) gain the section; the four
  issue forms (`.github/` and `template/.github/`) gain the field. The two trees
  are compared by `scripts/scaffold-parity.test.mjs`, so a one-sided edit is red.
- `skills/batch-scheduler/` and `skills/triage-issue/` teach the section, the
  resolution order and the serial-execution signal; `docs/workflow/ISSUE_WORKFLOW.md`
  owns the issue-body contract that the `## Surfaces` section joins.
- What must be asked before acting on the other side: the section lands in issue
  bodies by triage, never by this change — the live forge is not rewritten here
  (decision D10).

## Retirements

The change replaces one internal mechanism and adds surfaces that arrive with
their consumer. No published surface is retired.

- **Retired: the fence-unaware global backtick pairing.** `scopeSections`,
  `extractSurfaces` and `extractFileClaims` paired backticks across the whole
  body (`/`([^`])`/g` over a slice), so a fenced code block desynchronised the
  pairing and every later declaration vanished into a garbage token — the
  mechanism behind `#504`'s empty surface set and behind file claims such as
  `bash\nbun test scripts/telemetry-coverage.test.mjs`. Replaced by
  `proseTokens` (per line, fenced blocks inert). Its only consumer was the
  section reader itself: `rg -c 'scopeSections' scripts packages --glob
  '!*test*'` → 1 definition, no other caller.
- **Added surfaces, each with its consumer in this same change**
  (`bun scripts/residual-classify.mjs --inventory --base origin/main` is the
  receipt, recorded as an `E` line below): the `## Surfaces` section name (read
  by `resolveSurfaces`, written by triage and the four SPEC templates), the
  `blind-spot` finding code (validated by the schema package, reported by the
  skill), the `surface-unknown-issue-<n>` degraded family (validated by the
  schema package, read by the skill's serial-execution rule) and the
  `--infer-surfaces` flag (called by the triage step). No `orphan` row: every
  added surface names its consumer, so `--inventory` prints no `andamio` either.

## Non-goals

- **Not** adding `## Surfaces` to the unit-doc required-section lists
  (`UNIT_DOC_SPEC_REF_SECTIONS` / `UNIT_DOC_REQUIRED_SECTIONS`). Measured with
  the selector's own reader, that would refuse the 108 unit docs resolving
  `spec-by-reference` and the 7 resolving `legacy` (`PE-005`); the section is
  template-only, like `## Retirements` (#318). See D1.
- **Not** extending `file-overlap`: an issue's file claims stay what its body
  declares plus what its branch rewrites. A unit doc's `Relevant files:` feeds
  surfaces only, never file claims — the issue does not ask for it and a
  cross-lane pair of `Relevant files:` is a weaker claim than a diff.
- **Not** writing `## Surfaces` into live issue bodies from this change. The
  mechanism and the triage step deliver S2; the backfill happens per issue when
  triage runs (D10).
- **Not** inventing a seventh lane key or inferring surfaces from git history,
  imports or bundle graphs — the six documented roots are the vocabulary.
- **Not** making a surface declaration mandatory enough to refuse an issue: a
  `surface-unknown` declaration is a legal answer, and the plan reports it.

## Risk tier

Verdict copied verbatim from `agentic-workflow ceremony tier classify` over the
planned paths (`contract: risk-tier-verdict@1`):

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit (`signals: []`)
- **Reason** — `executable-content`: 10 planned paths carry executable content

## Future

none

## Future cost

- **The section stays optional.** A future unit that wants it required must
  migrate the closed corpus first; until then the section is a template answer,
  not a contract. Binds whoever next touches the unit-doc shape.
- **Every new lane key must be added in `surfaceKey` and in the templates'
  key list in the same change.** Two homes, one pin
  (`scripts/batch-scheduler.test.mjs` reads both). Binds the next lane-key
  addition.
- **A degraded family is not a finding.** `surface-unknown-issue-<n>` never
  blocks a plan; `blind-spot` is the finding that marks the compounded case.
  Binds the next consumer that wants to gate on surfaces.

## Applicable tests

Triage-decided, one line per suite this unit runs:

- `bun test scripts/batch-scheduler.test.mjs` — the surface rules and the
  template/parser coherence pin.
- `bun run test` in `packages/agentic-workflow-schema` — the two vocabulary
  additions and the draft-07 projection.
- `bun test scripts/unit-doc-contract.test.mjs` — the four templates keep the
  re-cut order and the new section stays out of the required lists.
- `bun test scripts/scaffold-parity.test.mjs` — the export matches its repo twin.
- `node scripts/run-root-suite.mjs` — the whole gate.

## Known pre-existing issues

- **`#504`'s body loses every declaration after its first fenced block** —
  *affects* this unit: it is the reproducer for the tokenizer half, and it is
  the reason the scheduler reported the issue as touching nothing.
- **The issue's own pairs do not reproduce** (`#504`/`#560` share `docs` and
  `scripts`; `#504`/`#568` are disjoint) — *does not affect* the change: the
  mechanism is fixed against the measured behaviour, and the unit doc records
  the measurement instead of the claim (`PE-001`).
- **`#554` declares `template/.agentic-workflow/hooks/` in `## Context`, never
  in `## In scope`** — *does not affect* the change: scanning only the declared
  section is the intended precedence (D3); `#554` becomes a visible
  `surface-unknown-issue-554` instead of a silent `general` lane, and triage
  fixes it per issue.

## Acceptance criteria

One criterion per requirement, each naming the check that proves it.

- **AC-S1** — The four SPEC templates carry `## Surfaces` directly after
  `## Impact`, and the four issue forms carry a `surfaces` field whose
  description names the six lane keys, while `UNIT_DOC_SPEC_REF_SECTIONS` does
  **not** gain the section (an existing closed unit still resolves its shape).
  Check: `bun test scripts/unit-doc-contract.test.mjs` exits 0 and `bun test
  scripts/batch-scheduler.test.mjs` exits 0 (the template-coherence case reads
  the eight files and the schema constant).
- **AC-S2** — `agentic-workflow`'s triage step can produce the declaration
  without a model inventing lane keys: `--infer-surfaces <n>` prints the exact
  `## Surfaces` block for an issue (fenced blocks inert, `## Where`/`## In
  scope` honored), prints `- surface-unknown` when nothing resolves, and writes
  nothing. Check: `bun test scripts/batch-scheduler.test.mjs` exits 0
  (`F7`-family cases) and `rg -n 'infer-surfaces' skills/triage-issue/` matches
  ≥2.
- **AC-S3** — An issue whose body declares a path after a fenced code block
  still resolves that surface; a declaration inside a fence contributes
  nothing; a declared `## Surfaces` section wins over `## Where`/`## In scope`;
  with no declaration the unit doc's `## Surfaces`, then its `Relevant files:`,
  are the fallback; with nothing anywhere the issue is reported
  `surface-unknown-issue-<n>` in `degraded[]` and a batch carrying two or more
  such issues reports one `blind-spot` finding. Check: `bun test
  scripts/batch-scheduler.test.mjs` exits 0 (`F1`–`F5`, `F7`).
- **AC-S4** — The backfill route is stated where triage reads it and needs no
  live forge write from this change. Check: `rg -n 'surface-unknown'
  skills/triage-issue/` matches ≥2 and `git diff --stat origin/main..HEAD --
  .github` shows no issue body.
- **AC-S5** — The suite states the three sources explicitly (body, unit doc,
  degraded path) as separate named cases. Check: `rg -n 'surface detection' -A2
  scripts/batch-scheduler.test.mjs` matches the three `F`-families, and `bun
  test scripts/batch-scheduler.test.mjs` exits 0.
- **AC-S6** — The whole deterministic gate is green. Check: `node
  scripts/run-root-suite.mjs` exits 0.

## Tasks

- P1 — Freeze the unit doc and both planning ledgers from the issue's verbatim
  text (validator: `ls docs/fix/574-batch-scheduler-surface-detection/ | wc -l`
  matches 3)
  (Implements: S1)
  - Relevant files: docs/fix/574-batch-scheduler-surface-detection/
- P2 — RED corpus: one failing case per surface rule (fence inertness, declared
  `## Surfaces` precedence, unit-doc fallback, `surface-unknown` degradation,
  `blind-spot` finding, `--infer-surfaces`) plus the template-coherence pin,
  observed failing before any implementation (validator: `bun test
  scripts/batch-scheduler.test.mjs` exits non-zero on the new cases)
  (Implements: S3, S5)
  - Relevant files: scripts/batch-scheduler.test.mjs
- P3 — Schema package: `BATCH_FINDING_CODES` += `blind-spot`, the `degraded[]`
  pattern admits the `surface-unknown-issue-<n>` family, the draft-07
  projection and the package corpus move with them, version unchanged
  (validator: `bun run test` in `packages/agentic-workflow-schema` exits 0)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow-schema/src/batch-plan.ts,
    packages/agentic-workflow-schema/batch-plan.schema.json,
    packages/agentic-workflow-schema/test/batch-plan.test.mjs
- P4 — Script: `proseTokens` and the fence-aware section reader; `## Surfaces`
  as the first declared section with `## Where`/`## In scope` unchanged
  (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 — `F1`, `F2`)
  (Implements: S3)
  - Relevant files: scripts/batch-scheduler.mjs
- P5 — Script: `resolveSurfaces` — unit-doc fallback (`## Surfaces`, then
  `Relevant files:`), the degraded entry and the `blind-spot` finding
  (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 — `F3`, `F4`, `F5`)
  (Implements: S3)
  - Relevant files: scripts/batch-scheduler.mjs
- P6 — Script: `--infer-surfaces <n>` printing the ready-to-paste block,
  print-only (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 —
  `F7`)
  (Implements: S2)
  - Relevant files: scripts/batch-scheduler.mjs
- P7 — Templates: `## Surfaces` in the four SPEC templates and a `surfaces`
  field in the four issue forms (validator: `bun test
  scripts/unit-doc-contract.test.mjs` exits 0 and `bun test
  scripts/scaffold-parity.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/_TEMPLATE/SPEC.md, docs/features/_TEMPLATE/SPEC.md,
    template/docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md,
    .github/ISSUE_TEMPLATE/fix.yml, .github/ISSUE_TEMPLATE/feature.yml,
    template/.github/ISSUE_TEMPLATE/fix.yml,
    template/.github/ISSUE_TEMPLATE/feature.yml
- P8 — Docs and repository state in the same change: `references/PLAN.md`
  grammar (the section, the resolution order, the two new codes),
  `SKILL.md` (the serial-execution rule), `triage-issue` (the declaration step
  and the backfill), `docs/workflow/ISSUE_WORKFLOW.md`, `README.md` currency,
  the roadmap row status, changeset intent, `docs/LOGS.md`, the generated
  projection through the renderer (validator: `bun
  scripts/check-skill-context.mjs` exits 0, `bun scripts/docs-generate.mjs
  --check` exits 0)
  (Implements: S1, S2, S4)
  - Relevant files: skills/batch-scheduler/, skills/triage-issue/,
    docs/workflow/ISSUE_WORKFLOW.md, README.md, docs/ROADMAP.md, .changeset/,
    docs/LOGS.md
- P9 — Verification: the declared gates in the foreground, the differential run
  base-vs-change over the live issue corpus, every obligation closed
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
- P10 — Correction batch 1: the six blockers of the 2026-11-16 external verify
  closed in one batch with their red-first corpus and one blockers-limited
  recheck (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 and
  `bun test scripts/unit-doc-contract.test.mjs` exits 0)
  (Implements: S1, S3, S5)
  - Relevant files: scripts/batch-scheduler.mjs, scripts/batch-scheduler.test.mjs,
    packages/agentic-workflow-schema/src/batch-plan.ts,
    skills/batch-scheduler/references/PLAN.md, skills/batch-scheduler/SKILL.md,
    docs/fix/574-batch-scheduler-surface-detection/SPEC.md,
    docs/fix/574-batch-scheduler-surface-detection/planning-obligations.md

### Planning evidence

M/L unit: the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md) — one row per Engineering claim.

### Obligations

M/L unit: the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md) — one row per normative
behaviour, compatibility invariant, affected use case, and required failure
state.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the issue, verbatim (elided only where the body repeats
  its own acceptance list, marked `[…]`):
  ```
  ## Problem

  batch-scheduler reads declared surfaces from `## Where` and `## In scope` sections of issue bodies. When an issue lacks these sections (common for many open issues: #504, #560, #568 have none), the scheduler cannot detect file overlaps between them.
  […]
  ## Requirements

  ### 1. Surface declaration in issue templates
  ### 2. triage-issue surface estimation
  ### 3. batch-scheduler improvement
  ```
- **D1** — 2026-11-16, #318's precedent (owner decision recorded in
  `scripts/unit-doc-contract.test.mjs`): `## Surfaces` enters the four SPEC
  templates as a template-only section, **not** as a required unit-doc section.
  Declaring it required would refuse the 108 unit docs that resolve
  `spec-by-reference` today and the 7 that resolve `legacy` (`PE-005`) — a
  migration nobody asked for.
- **D2** — 2026-11-16, S1's key list: the section carries the six roots
  `surfaceKey` already publishes (`packages/<name>`, `skills/<name>`, `scripts`,
  `docs`, `template`, `.github`); no new vocabulary.
- **D3** — 2026-11-16, S3's precedence: `## Surfaces` is exclusive when present
  (a declaration beats prose); otherwise `## Where` + `## In scope` keep today's
  union; otherwise the whole body is the inference source, never a declaration.
- **D4** — 2026-11-16, S3's fallback: the unit doc's `## Surfaces` section
  first, then the union of its `## Tasks` `Relevant files:` cells — the grammar
  `scripts/relevant-files.mjs` already parses, so no second parser.
- **D5** — 2026-11-16, S3's vocabulary: a second degraded family
  `surface-unknown-issue-<n>`. `unavailable-<source>-<cause>` means a source
  could not be read; this one means every source was read and the issue
  declares nothing — a different fact, never smuggled under the first.
- **D6** — 2026-11-16, S2's mechanism: `--infer-surfaces <n>` is print-only.
  The planner's single write path stays its own state file; the forge write is
  triage's (`gh issue edit`), which already owns forge mutations.
- **D7** — 2026-11-16, the tokenizer: a fenced block is code, not a
  declaration. Tokens are read per line, so an unmatched backtick can no longer
  swallow the rest of a body.
- **D8** — 2026-11-16, S3's finding: `blind-spot` fires per batch when two or
  more batched issues have unknown surfaces (the issue's own wording); a single
  unknown row degrades and is handled by the skill's serial-execution rule.
- **D9** — 2026-11-16, #509's precedent: vocabulary-only extensions keep
  `batch-plan@3`. No field is added, so no version bump.
- **D10** — 2026-11-16, the live forge: this change does not rewrite issue
  bodies. The backfill S4 names runs per issue through triage, after this
  mechanism is verified — the local workflow's live-tree guard forbids running
  new code against the live tree before that.

- **E1** — 2026-11-16, `bun test scripts/batch-scheduler.test.mjs` · exit 0 ·
  77 pass, 0 fail (the 70 pre-existing cases plus `F1`–`F5`, `F7`, `T1`); the
  same suite under `node --test` is 77 pass, 0 fail.
- **E2** — 2026-11-16, `bun test scripts/unit-doc-contract.test.mjs` · exit 0 ·
  21 pass, 0 fail (the four templates keep the re-cut order; the section stays
  out of both required lists).
- **E3** — 2026-11-16, `bun test scripts/scaffold-parity.test.mjs` · exit 0 ·
  17 pass, 0 fail (the exported scaffold mirrors its repo twin's H2 set).
- **E4** — 2026-11-16, `bun run test` in `packages/agentic-workflow-schema` ·
  exit 0 · 887 pass, 0 fail (49 files; the two vocabulary additions and the
  draft-07 projection).
- **E5** — 2026-11-16, the differential (O14): `batch-scheduler.mjs --root .
  --issues-file <11 open issues> --no-state --json-only` on the base copy
  (`origin/main` = `888aaceb`) against the change · both exit 0 · two intended
  differences and no other: `#554` moves from the `general` lane to
  `packages/pi-agentic-workflow` + `template`, and the `file-overlap: 504,590`
  finding disappears because the `docs`/`scripts` lanes now name the unit in
  flight on them and the pair serializes there instead of being offered as
  parallel. `degraded[]`, `launched[]`, `label_blocked[]` and every other lane
  are byte-identical.
- **E6** — 2026-11-16, `bun scripts/check-skill-context.mjs` · exit 0 · PASS 30
  skills; `--documents` PASS 4 budgeted documents.
- **E7** — 2026-11-16, `bun scripts/docs-generate.mjs --check` · exit 0 · 3
  checked, 0 missing, 0 stale, 0 orphaned.
- **E8** — 2026-11-16, `rg -n 'surface-unknown' skills/triage-issue/` · exit 0 ·
  3 matches (the declaration step's unknown answer, the verdict line's cell, the
  never-rewrite rule).
- **E9** — 2026-11-16, `agentic-workflow phase-lint docs/fix/574-…/SPEC.md` ·
  exit 0 · `verdict PASS`, every phase 6/6.
- **E10** — 2026-11-16, `bun scripts/promise-coherence.mjs` · exit 0 · verdict
  PASS, 42 checked / 23 skipped (historical bases); the unit doc alone: PASS,
  1 checked.
- **E11** — 2026-11-16, `node scripts/run-root-suite.mjs --suite-timeout 400` ·
  exit 1 · 113 of 114 suites pass; `scripts/unit-route.test.mjs` fails only its
  `#291 F7` wall-clock assertion (582ms, expected <500ms) on a box at load
  average ~9.5 on 6 CPUs — the same test passes 3/3 standalone (327–431ms) and
  neither `unit-route.mjs` nor `unit-doc-phases.mjs` is in this unit's diff.
  With the default 120s bound, `scripts/phase-lint.test.mjs` additionally hits
  the suite bound under that load; it passes 162/162 in 73s standalone.
- **G1** — 2026-11-16, `HEAD 05838c8a` · `agentic-workflow diff-guard --base origin/main` · exit 1
  · `DIFF-GUARD BREACH — 1307 lines > 400 · 28 files > 8`. Reported, not
  force-fit: the unit must land the parser, the two vocabularies, the eight
  templates and the docs together (a section nothing parses is an orphan
  surface, and stacked PRs are refused by this repository's guide). The size is
  the unit's own scope, named here rather than hidden.

- **P9** — 2026-11-16, the unit published for external verification:
  `agentic-workflow ceremony pr create --base main` → PR
  [#599](https://github.com/gtrabanco/agentic-workflow/pull/599) · head
  `3464cbf3` (28 files, +1296/−59). The branch was pushed after the pre-push
  local gate reported `PASS — 16 step(s)`, re-run with
  `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` after two hook-equipped pushes exited
  141 (SIGPIPE) *after* that PASS line; the PR records both facts.

## Next

The owner's external verdict on this diff — 2026-11-16 handoff; no tracked task
is pending inside the unit.

## References

- Issue [#574](https://github.com/gtrabanco/agentic-workflow/issues/574)
- `docs/fix/509-batch-scheduler-stale-claims/` — the sibling unit that shaped
  this document's vocabulary extension (#509's D9/D12 precedents)
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger shapes
- `scripts/unit-doc-contract.test.mjs` — the `## Retirements` precedent (#318)

## Branch

`fix/574-surface-detection-blind-spots`

## Depends on

none

## Regression scope

What must keep working, each row with the check that proves it:

| Scenario | Check |
|---|---|
| An issue declaring `## Where` keeps exactly the surfaces it declared | `bun test scripts/batch-scheduler.test.mjs` exits 0 (`W1`-family, the existing `whereSection` fixtures) |
| An issue declaring `## In scope` keeps exactly the surfaces it declared | same suite, `B3` cases |
| A body with no section at all still names its surfaces from prose (the documented fallback, test `B3`) | same suite |
| Laned plans, claims, launch evidence, file overlap, soft/hard deps and the state file are unchanged | same suite (the 70 pre-existing cases) |
| The planner still never spawns, never creates worktrees, writes only its state file | same suite (`S9`) + the `--infer-surfaces` case asserting no write |
| Every unit doc on disk still resolves its shape | `bun test scripts/unit-doc-contract.test.mjs` exits 0; `bun scripts/promise-coherence.mjs` exits 0 |
