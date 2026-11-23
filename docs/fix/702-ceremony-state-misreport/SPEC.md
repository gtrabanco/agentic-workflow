---
type: fix
scope: large
roadmap_summary: Issue [#702](https://github.com/gtrabanco/agentic-workflow/issues/702) (L, high): the runner's ceremony-state writers and the merge gate's verdict stop misreporting. `ceremony findings` splices the carrier table instead of rebuilding the section (prose survives), a fold writes the fold log line under the closed finding's own id and `append` accepts `--id`, one carrier grammar is in force with a typed defect for the other shape or for two carriers at once, and `audit-pr-gate` reports a gate nobody could evaluate as `unevaluatable` with its own reason instead of `gate <name> failed` — a new value in the published gate-check-status family. `roadmap fixrow`'s hardcoded shape was verified already covered by #684.
ac-hash: 39097ecf6c772b4fe52a1d992b814cb390137c7c457477519f6a1e13bb641768
---

# fix/702-ceremony-state-misreport

> One-line: the runner mis-wrote or mis-reported ceremony state and the wrong
> report cost review cycles — the findings carrier now keeps prose and identity,
> one grammar is in force, and an unevaluatable gate says so.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Issue

`#702` — `bug: runner ceremony-state writers and verdicts misreport — findings
writer destroys section prose and renumbers rows, legacy/migrated carrier split,
audit-pr-gate evaluate reports unevaluatable as failed, roadmap fixrow
brittleness`. The PR closes it via `Closes #702`. The issue carries the `urgent`
label and its severity is `high` (triage comment 2026-11-23, `VERDICT: fix-now`).
Applied through the owner's local, unpublished inline workflow: the ledgers below
are the plan, no repository review machinery runs on this change, and the diff is
handed to the owner as the external verifier.

## Specs

`S1` is the owner's instruction; `S2`–`S6` are the issue's five defect reports,
quoted verbatim and in the issue's order; `S7`–`S10` are the issue's
`## Expected behaviour` bullets, also verbatim — the acceptance each defect is
judged by.

**S1 — the issue is applied, not reinterpreted.**
> Apply to this repository: issue #702

**S2 — the findings writer destroys non-table prose.**
> **`ceremony findings append`/`update` rewrite the whole `## Findings` section and destroy non-table prose** (absorbs draft /tmp/f101-issue-drafts/03). `writeRows` uses `replaceSection(md, "findings", renderFindings(rows))` — the rebuilt section carries only table rows, while the migrated carrier (`findings-table@1`) prescribes keeping report-only material as prose under the table. fix-101 fold A1 had to hand-write rows in the carrier's exact schema to avoid destroying the report-only record. Every `update` runs the same path.

**S3 — row identity and renumbering.**
> **Row identity/renumbering**: `ceremony findings update --folded true` deletes the row and appends a `## Log` line whose kind number is the closed row's leading id (closing row `F1` writes a fold log line `F1`, colliding with the review's own finding ids); `append` has no `--id`, so after closing rows the next append skips numbers (F1+F3 closed → next append was `F15`). Observed on fix-101 folds (commit 9bb060e).

**S4 — the legacy and migrated carrier grammars coexist with no signal.**
> **The legacy and migrated carrier grammars coexist and nothing detects or normalizes the split.** findings-table@1 (current) says a folded row leaves the table, becomes a `## Log` line, and the table carries a mandatory `impact` cell; fix-334's ledger still uses the legacy shape (permanent `folded:` column, 7 columns, audit-pr's hand-reconstructed rows chose legacy deliberately). `unit-route`'s findings-reader resolves both, so a consumer drifts between grammars without any signal, and every tool that counts rows must know two shapes.

**S5 — `audit-pr-gate evaluate` reports an unevaluatable environment as N content failures.**
> **`audit-pr-gate evaluate` reports an unevaluatable environment as N simultaneous generic `gate <name> failed`** (absorbs draft /tmp/f101-issue-drafts/04). In the `.git/worktrees/` layout evaluate BLOCKED wholesale with 13 `gate <name> failed` lines while its sibling `audit-pr-gate hygiene --pr <N>` PASSED at the same instant in the same checkout — the verdict asserts thirteen content failures when the truth is the layout makes most gates unevaluatable (ambiguous `HEAD`, unprovable merge-bases). Fail-closed is correct; the reason "failed" misroutes diagnosis. Needs a per-gate unevaluatable outcome (a new value in the gate-check-status vocabulary family, shipped with its schema bump).

**S6 — `roadmap fixrow`'s hardcoded shape is verified covered, or it rides here.**
> **`roadmap fixrow` hardcodes the `| Issue |` header shape and a 4-column row** (fix-101 field data; #684 got an owner-ordered extension — verify this row was covered there, and if not it rides here as an additional writer defect, src/edit/Roadmap.mjs).

**S7 — a rewrite preserves the prose it claims, or refuses and names what it would lose.**
> - Any section rewrite preserves claimed non-table prose, or the writer refuses and names what would be lost.

**S8 — a row close keeps its identity.**
> - Row closes keep identity: the fold log line names the finding id it closed, `append` accepts `--id`, and sequence numbers never jump.

**S9 — one carrier grammar in force, the other shape a loud typed defect.**
> - One carrier grammar in force; a carrier parsed in the other grammar is a loud, typed defect (not silent dual support).

**S10 — a gate that cannot be evaluated is its own outcome with its own reason.**
> - A gate that cannot be evaluated is its own outcome with its own reason (environment/layout), never folded into content failure.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the issue is applied inside its declared surface.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD` lists only paths `## Impact` names, and every `S#` above appears verbatim in this document.
2. **S2 — a rewrite keeps the prose it claims.** `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` exits 0 with `a section rewrite keeps the report-only prose under the table` and `every write op keeps non-table prose (append, update, delete, delete-all, merge)`; the section the writer could not splice is refused by `a section without the carrier table is refused, naming what would be lost`.
3. **S3 — a closed row keeps its identity and ids never jump.** The same suite exits 0 with `a fold writes the F log line under the finding's own id`, `append accepts --id and refuses an id the carrier already used` and `the next id comes from the carrier, never from prose citing an older id` — the `F1`+`F3` → `F15` reproducer included as a case.
4. **S4 — one grammar in force, the other shape loud.** The same suite exits 0 with `a doc table in the ledger grammar is a typed defect, and every write refuses it`, `a superseded six-column table is read as its own grammar and refused for writing`, `dual carriers are a typed defect naming both paths`, `a side ledger in the doc grammar is a typed defect` and `the legacy side ledger stays readable and is never rewritten`; `bun test packages/agentic-workflow/test/findings-carrier.test.mjs` exits 0 with the two `unit-route` row cases, and `bun test scripts/findings-corpus.test.mjs` keeps its frozen `1165`/`56` counts.
5. **S5 — an unevaluatable gate is its own outcome.** `bun test scripts/audit-pr-receipt.test.mjs` exits 0 with `an unevaluated gate is its own outcome with its own reason, never a content failure`, `a supplied unevaluatable gate keeps the caller's reason and still blocks`, `the gates map's outcome vocabulary is closed` and `the receipt judge's unreadable subprocess is unevaluatable, a judged receipt failure is not`; `bun run --cwd packages/agentic-workflow-schema test` exits 0 with the new status accepted and both projections agreeing; the CLI's own `evaluate` over a current receipt and no gate map prints `unevaluatable` blockers, never `gate <name> failed`.
6. **S6 — the `## Fixes` writer shape is verified covered.** `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0 with `CLI: roadmap fixrow settles a consumer-shaped Fixes row` and `CLI: roadmap fixrow writes a Fixes row — no hand edit`, and `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- packages/agentic-workflow/src/edit` matches 0 lines.
7. **S7 — prose is preserved or the write refuses.** Covered by criterion 2's three cases: the prose survives, and no table means a refusal that names the section.
8. **S8 — `--id`, the named fold line, no jumps.** Covered by criterion 3's three cases.
9. **S9 — the other grammar is a typed defect.** Covered by criterion 4's five carrier cases plus the two consumer cases.
10. **S10 — the reason is the environment, not a content failure.** Covered by criterion 5's four cases plus the CLI receipt: the reason names what made the gate unreadable (`not-evaluated`, the caller's own reason, or the judge's status), and the verdict still blocks.

## Impact

Four surfaces, one vocabulary, and the prose that declares them:

- `packages/agentic-workflow/src/runner/findings-carrier.mjs` (**new**) — the one
  owner of the findings carrier's grammars: the header cells of
  `findings-table@1`, of its superseded six-column predecessor, and of the legacy
  `review-findings.md` ledger; row parsing by the table's own header names; the
  prose-preserving table splice; and the typed defect list (`dual-carrier`,
  `wrong-carrier-grammar`, `superseded-grammar`, `carrier-table-missing`).
  Every consumer imports it instead of keeping its own column arithmetic.
- `packages/agentic-workflow/src/runner/lib.mjs` — `parseFindings` and
  `renderFindings` delegate to that owner (their signatures stay, so the
  ceremony's other modules keep their calls); `appendLogLine` gains the explicit
  number a fold needs to keep identity.
- `packages/agentic-workflow/src/runner/ceremony/findings.mjs` — `writeRows`
  splices the table instead of rebuilding the section; `nextId` reads the carrier;
  `append` gains `--id`; `update --folded true` writes the identity-bound `F`
  line; `findingsCarrier` refuses a dual carrier and reports the grammar it read;
  every write refuses a carrier it cannot round-trip.
- `packages/agentic-workflow/src/runner/unit-route.mjs` and
  `src/runner/sensors/workflow-status.mjs` — the row reader and the sensor read
  the grammar through the new owner (no positional misread), and the sensor's
  existing `observations` channel carries a carrier defect. `src/findings-corpus/`
  reports the same defect without changing what it counts.
- `packages/agentic-workflow/src/audit-pr-gate/index.mjs` — `GATE_OUTCOMES`, a
  per-gate report carrying its own reason, blockers that name the outcome, and a
  `gate-receipt` judge that separates "the receipt is missing/stale" from "the
  judge could not be read". The CLI refuses a gate value outside the vocabulary.
- `packages/agentic-workflow-schema/src/gate-receipt.ts` +
  `gate-receipt.schema.json` — `GATE_CHECK_STATUSES` gains `unevaluatable`; the
  value enters once, in the published family the `normative-surfaces@1` row
  binds to the gate-receipt grammar.
- Tests and their receipts: `packages/agentic-workflow/test/runner.ceremony-findings.test.mjs`
  and `packages/agentic-workflow/test/findings-carrier.test.mjs` (**new**),
  `scripts/audit-pr-receipt.test.mjs` (four new cases; one restated assertion, D8),
  `packages/agentic-workflow-schema/test/gate-receipt.test.mjs`, and
  `scripts/findings-corpus.test.mjs`.
- The declared prose: `packages/agentic-workflow/README.md` (the findings
  grammar and the gate outcomes it reports), `skills/audit-pr/references/03_AUDIT_PROCESS.md`
  (the blocker the verdict persists and the outcome vocabulary it reads), and
  `skills/pre-execution-review/references/LEDGERS.md` (§`findings-table@1` — the
  fold line's number is the finding id, and the carrier's one owner).
- `.changeset/702-ceremony-state-misreport.md` — the two shipped packages' patch
  intent.
- `docs/ROADMAP.md` — the `## Fixes` row, written through
  `agentic-workflow roadmap fixrow`, never by hand; `docs/generated/units.md`
  follows the emitter.
- This unit's own carriers and the session entry in `docs/LOGS.md`.
- Nothing live on the other side: every mutating path introduced here was
  exercised in `mktemp -d` trees first (§3 of the apply order), never against the
  live repository or a shared worktree.

## Surfaces

- `packages/agentic-workflow`
- `packages/agentic-workflow-schema`
- `skills/audit-pr`
- `skills/pre-execution-review`
- `docs`

## Retirements

Nothing is retired. `findings-table@1`, `log-kind@1`, `gate-receipt@1`,
`findings-ledger`-shaped side ledgers, the ceremony's object/subcommand set, its
flag set and its receipts all keep their bytes and their readers. Two narrower
outcomes are stated, not silent: an `append` that used to accept a silently
skipped id now refuses an id already used (the requested identity), and a gate
value outside the merge gate's vocabulary is a usage error instead of a silent
`failed`. `gate-receipt@1`'s core fields and token are unchanged — the added
check status is additive to the published set, so no receipt that validates today
stops validating (D5).

## Non-goals

- The legacy carriers already in the tree (56 side ledgers, 18 six-column doc
  tables): they are read, never migrated or rewritten. A rewrite of history is a
  different unit with an owner decision behind it.
- `findings-corpus`'s admission/attribution/metrics readings: the reader gains
  the defect signal and keeps every count it froze.
- The ceremony's `ledger`, `review`, `evidence`, `acceptance` and `roadmap`
  objects, and `audit-pr-gate`'s hygiene/comment commands: unchanged, pinned by
  their existing suites.
- `retention`'s and `correction-budget`'s side-ledger probes: they read presence
  and open rows from a legacy file only, never a doc table, so the split cannot
  reach them.
- Re-cutting the live roadmap's duplicate feature-98 rows (a pre-existing red,
  `## Known pre-existing issues`): another unit's owner-managed index row.
- A `--date`/`--author` flag on a fold line, or any log-kind vocabulary change:
  `log-kind@1`'s `F` token is what the identity binds to.

## Risk tier

Copied from `runner ceremony tier classify` over the change's executable paths
(`packages/agentic-workflow/src/runner/`, `packages/agentic-workflow/src/audit-pr-gate/`,
`packages/agentic-workflow-schema/src/gate-receipt.ts`): `tier: standard`,
`reason_kind: executable-content`, `signals: []` — no network call, no forge
write, no live state mutated by the change itself; every write is a local file
splice exercised in scratch.

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none.

## Future

none

## Future cost

- **One carrier grammar owner.** Any future change to what a findings row is —
  a new cell, a new ladder token — edits `findings-carrier.mjs` and the template
  that declares `findings-table@1`, never a consumer's column arithmetic. Binds:
  the ceremony's findings module, `unit-route`'s readers, the sensors, the corpus.
- **A new gate outcome is a vocabulary change.** Adding a value to the merge
  gate's vocabulary means the schema family first, then the module, then the
  prose — and the value is a version bump of the schema package, because a
  consumer pinned to the old set would read the new value as unknown. Binds:
  `/audit-pr`, the crate's gate module, the schema package's reviewers.
- **An `F` log line's number is a cross-reference.** Anything that reads a fold
  line by its number (the corpus does) must keep reading the finding's id, so a
  future "fold event" counter cannot be introduced beside it.

## Applicable tests

- `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs`
- `bun test packages/agentic-workflow/test/findings-carrier.test.mjs`
- `bun test packages/agentic-workflow/test/runner.ceremony-p0.test.mjs`
- `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`
- `bun test packages/agentic-workflow/test/runner.sensors.test.mjs`
- `bun test packages/agentic-workflow/test/edit.test.mjs`
- `bun run --cwd packages/agentic-workflow-schema test`
- `bun test scripts/audit-pr-receipt.test.mjs`
- `bun test scripts/findings-corpus.test.mjs`
- `bun test scripts/vocabulary-parity.test.mjs`
- `bun test scripts/normative-drift.test.mjs`

## Known pre-existing issues

- **`workspace-install` is red on `main` and on this branch alike** —
  `packages/pi-agentic-workflow/package.json` pins `@gtrabanco/agentic-workflow:
  4.10.0` while the crate's local version is `4.10.1`, so the workspace link
  resolves the registry copy and the pi package's `prepare` (`tsc`) cannot see
  the source modules (`error TS2307: Cannot find module
  '@gtrabanco/agentic-workflow/src/…'`). Verified at the base commit
  (`6dcfa53ad`, exported to `/tmp` and installed there): `bun
  scripts/local-gate.mjs --only workspace-install` → `exit 2`, the same line.
  `affects` the gate (12 dependants skipped, every one run by hand and recorded
  in `G1`) and `pi-node-compat`, which fails on the identical link at the base
  commit too. Not repaired here: the train version and the sibling pin are the
  release machinery's owner decision, not this unit's.
- **`scripts/unit-doc-contract.test.mjs`'s `#462 every unit-doc template stamps
  its own carrier and the train version` is red on `main` and on this branch
  alike** — the templates stamp `4.10.0` while the train is `4.10.1`. Verified
  at the base commit (`bun test scripts/unit-doc-contract.test.mjs` → 20 pass /
  1 fail, the same case). `does-not-affect` any path this change touches.
- **The roadmap's Features table carries two `98` rows** — the `idea` row for
  `deterministic-tool-doctor` and fix #361's `done` row for
  `finding-severity-ladder`, so `roadmap-settle` reports one `slug-mismatch`.
  Verified pre-existing at the base commit and reported by fix #696's ledger as
  well. `does-not-affect` any path this change touches; left alone — the row is
  the owner-managed index, and no emitter deletes a row.
- **The Features table also carries a `702` row for this fix** — the triage
  sweep (`0c0e2718a`) registered four triaged *fixes* as `idea` feature rows
  beside their `## Fixes` rows. `affects` the index's honesty, not this change's
  tests: reported, never hand-deleted (no emitter deletes a feature row, and the
  same artifact is on `main` for #703/#704/#706).
- **`docs/fix/353-residue-shadow-copies/SPEC.md` carries a `## Findings` table in
  the ledger grammar with `folded` rows still in it** — the exact mixed carrier
  `S4` describes, in a merged unit. `affects` the corpus reading (its two rows
  are reported as `wrong-carrier-grammar` now and still counted) and is reported,
  never repaired: rewriting a settled unit's history is out of this unit's
  scope, and the new reader states the grammar it found instead of pretending it
  is current.
- **`scripts/audit-pr-receipt.test.mjs`'s gh-subprocess cases flake under load**
  (recorded by fix #435): `does-not-affect` the four cases this change adds,
  which are pure `auditVerdict`/`gateReceiptGate` calls over fixtures.

## Tasks

- P1 — Land the frozen-failure corpus alone: the findings-carrier and ceremony
  suites, the four `audit-pr-receipt` cases, and the schema status case —
  observed red against the unchanged modules, with the two field reproducers
  (`F1`+`F3` → `F15`, and the 14 `gate <name> failed` blockers) recorded.
  (validator: `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` exits 1 naming the missing behaviours at the red commit)
  (Implements: S2, S3, S4, S5, S7, S8, S9, S10)
  - Relevant files: packages/agentic-workflow/test/runner.ceremony-findings.test.mjs, packages/agentic-workflow/test/findings-carrier.test.mjs, scripts/audit-pr-receipt.test.mjs, packages/agentic-workflow-schema/test/gate-receipt.test.mjs
- P2 — Publish the gate outcome: `unevaluatable` in the schema's check-status
  family, its Draft-07 projection and the suite's literal.
  (validator: `bun run --cwd packages/agentic-workflow-schema test` exits 0)
  (Implements: S5, S10)
  - Relevant files: packages/agentic-workflow-schema/src/gate-receipt.ts, packages/agentic-workflow-schema/gate-receipt.schema.json, packages/agentic-workflow-schema/test/gate-receipt.test.mjs
- P3 — Add the carrier grammar owner: the three header grammars, row parsing by
  header name, the prose-preserving splice, the typed defects.
  (validator: `bun test packages/agentic-workflow/test/findings-carrier.test.mjs` exits 0)
  (Implements: S2, S4, S7, S9)
  - Relevant files: packages/agentic-workflow/src/runner/findings-carrier.mjs, packages/agentic-workflow/src/runner/lib.mjs
- P4 — Make the ceremony keep prose and identity: splice the table, allocate ids
  from the carrier, accept `--id`, bind the fold line to the closed id, report
  and refuse the grammars, refuse a dual carrier.
  (validator: `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` exits 0 and `bun test packages/agentic-workflow/test/runner.ceremony-p0.test.mjs` exits 0)
  (Implements: S2, S3, S4, S7, S8, S9)
  - Relevant files: packages/agentic-workflow/src/runner/ceremony/findings.mjs, packages/agentic-workflow/src/runner/lib.mjs
- P5 — Make the consumers loud: the row reader and the sensor read through the
  owner and report a carrier defect; the corpus reports it and keeps its counts.
  (validator: `bun test packages/agentic-workflow/test/findings-carrier.test.mjs` exits 0 and `bun test scripts/findings-corpus.test.mjs` exits 0)
  (Implements: S4, S9)
  - Relevant files: packages/agentic-workflow/src/runner/unit-route.mjs, packages/agentic-workflow/src/runner/sensors/workflow-status.mjs, packages/agentic-workflow/src/findings-corpus/index.mjs
- P6 — Report each gate's own outcome: per-gate report with reasons, unevaluatable
  absent gates, typed blockers, the receipt judge's split, the CLI's closed
  vocabulary.
  (validator: `bun test scripts/audit-pr-receipt.test.mjs` exits 0)
  (Implements: S5, S10)
  - Relevant files: packages/agentic-workflow/src/audit-pr-gate/index.mjs, scripts/audit-pr-receipt.test.mjs
- P7 — Ship the declared prose and state: the crate README's carrier and outcome
  grammar, the audit-pr process's outcome vocabulary, the LEDGERS fold-line rule,
  the changeset, the roadmap fix row through the writer, and the session entry.
  (validator: `bun scripts/lint-changeset.mjs .changeset/702-ceremony-state-misreport.md` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` exits 0)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/README.md, skills/audit-pr/references/03_AUDIT_PROCESS.md, skills/pre-execution-review/references/LEDGERS.md, .changeset/702-ceremony-state-misreport.md, docs/ROADMAP.md
- P8 — Verify like a writer: the derived test-impact set, the differential against
  the base commit, `roadmap fixrow`'s coverage receipt, the unit-doc verifier and
  the local gate in the foreground.
  (validator: `bun scripts/local-gate.mjs --jobs 4 --no-bail` reports every step's verdict and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/702-ceremony-state-misreport/SPEC.md` prints `VERIFY PASS`)
  (Implements: S1, S6)
  - Relevant files: docs/fix/702-ceremony-state-misreport, docs/LOGS.md

### Planning evidence

Frozen at the cut in [`planning-evidence.md`](planning-evidence.md) (large unit —
the ledger lives beside this document, never both).

### Obligations

Frozen at the cut in [`planning-obligations.md`](planning-obligations.md) (large
unit — the ledger lives beside this document, never both). Before the unit ships,
every row is `verified` or an evidenced `n/a`.

## Triaged steps

`n/a — the owner's local inline workflow substitutes for the lane's plan step:
§5's ledger freeze is the plan, and no `unit-route --triage` block is derived for
this change (it would be a second, competing step list).`

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-23, `#702` — the owner's instruction and the issue's words,
  verbatim, are `## Specs` S1–S10 above (the issue body and its triage comment
  are the source; they are not duplicated here a second time).
- **L2** — 2026-11-23, the owner's instruction that binds this document's shape,
  verbatim: "Apply to this repository: issue #702" — applied through the local,
  unpublished inline workflow: the §5 ledger freeze is the plan, only the
  repository's deterministic gates run, and the diff is handed to the owner as
  the external verifier.
- **L3** — 2026-11-23, the reproducers the issue reports, re-run before any
  implementation in `mktemp -d` scratch: a report-only prose line under the
  table was **gone** after one `findings update --folded true`; closing `F1`+
  `F2` and then appending with a `## Log` line citing `F9`/`F14` wrote `F15`;
  `evaluate` over a current receipt and no gate map printed **14** `gate <name>
  failed` blockers for gates nobody read.
- **E1** — 2026-11-23, the frozen corpus alone at `77b0eeceb`, red against the
  unchanged tree: `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs`
  · exit 1 · **0 pass / 12 fail**; `…/findings-carrier.test.mjs` · exit 1 ·
  `Cannot find module '../src/runner/findings-carrier.mjs'`;
  `bun test scripts/audit-pr-receipt.test.mjs` · exit 1 · `Export named
  'GATE_OUTCOMES' not found`; `bun test scripts/findings-corpus.test.mjs` ·
  exit 1 · 15 pass / 2 fail; `bun run --cwd packages/agentic-workflow-schema test`
  · exit 1 · 950 pass / 1 fail (`the check status family publishes
  unevaluatable`).
- **E2** — 2026-11-23, the published status (`fa969ca78`): `bun run --cwd
  packages/agentic-workflow-schema test` · exit 0 · **951 pass / 0 fail**; the
  same suite on the node leg · exit 0 · 951 pass / 0 fail.
- **E3** — 2026-11-23, the carrier and its ceremony writer (`7ee4b0662`):
  `bun test packages/agentic-workflow/test/runner.ceremony-findings.test.mjs` ·
  exit 0 · **12 pass**; `…/findings-carrier.test.mjs` · exit 0 · **7 pass**
  (the two `unit-route` row cases and the sensor's carrier observation
  included).
- **E4** — 2026-11-23, the carrier's untouched behaviour: `bun test
  packages/agentic-workflow/test/runner.ceremony-p0.test.mjs` · exit 0 · 9 pass;
  `…/runner.ceremony-p1p2.test.mjs` · exit 0 · 14 pass; `bun test
  scripts/ceremony-findings-ledger.test.mjs` · exit 0 · **19 pass** (the legacy
  1,208-row carrier still answers every one of its tables).
- **E5** — 2026-11-23, the crate's own gate on both runtimes: `bun run test` in
  `packages/agentic-workflow` · exit 0 · **1474 pass / 0 fail / 82 files**;
  `bun run test:node` · exit 0 · 82 suites pass.
- **E6** — 2026-11-23, the merge gate's own contract: `bun test
  scripts/audit-pr-receipt.test.mjs` · exit 0 · **32 pass** (the four new cases
  and the restated omitted-gate assertion); `bun test
  scripts/gate-receipt.test.mjs` · exit 0 · 10 pass (the receipt gate's split
  outcome).
- **E7** — 2026-11-23, the corpus: `bun test scripts/findings-corpus.test.mjs` ·
  exit 0 · **17 pass**, its live-tree case still `1165` findings / `56` legacy
  ledgers / `229` fold annotations.
- **E8** — 2026-11-23, the differential (§6): a `mktemp` fixture (a migrated
  unit with prose, a legacy unit, a dual unit, a roadmap row, a current receipt)
  built twice — once against `git archive origin/main` and once against this
  branch — and driven through **18 commands** (`findings read/summarize/append/
  update` on both carriers, `unit read`, `ledger read`, `audit-pr-gate
  evaluate` with a full map / a partial map / no map and its `hygiene`,
  `roadmap read`, `workflow-status --json-only`). Every remaining difference is
  the requested surface: the reported `grammar`/`defects`, the dual-carrier
  refusal, the prose that survives a fold, the gate outcomes and the additive
  `gates`/`unevaluatable` report. `hygiene`, `roadmap read`, `workflow-status`
  and the write receipts are byte-identical.
- **E9** — 2026-11-23, the declared state: `bun
  packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` ·
  exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned`; `… roadmap fixrow
  docs/ROADMAP.md '<payload>' --json` · `ok: true` · `ce777cf2 → 21006f62`;
  `… roadmap check docs/fix/702-ceremony-state-misreport/SPEC.md --json` ·
  `violations: []`; `bun scripts/roadmap-settle.mjs` · exit 1 · 1 violation
  (the base-present duplicate feature-98 row, A3).
- **E10** — 2026-11-23, the two field reproducers, re-run at the head: after
  folding `F1`+`F2`, an append answers **`F3`**, never `F15`; the `F` fold lines
  read `**F1**` and `**F3**`, each naming the id it closed; `evaluate` over a
  current receipt and no gate map prints **13** `gate <name> unevaluatable:
  not-evaluated` and one `gate gate-receipt failed: missing` — no gate is
  accused of a failure nobody observed.
- **E11** — 2026-11-23, S6's coverage verified rather than assumed: `bun test
  packages/agentic-workflow/test/edit.test.mjs` · exit 0 · 40 pass, including
  `CLI: roadmap fixrow settles a consumer-shaped Fixes row` (the five-column
  `Folder | Topic | Status | Depends on | Issue` table) and `CLI: roadmap fixrow
  writes a Fixes row — no hand edit`; `git diff --name-only
  $(git merge-base origin/main HEAD)..HEAD -- packages/agentic-workflow/src/edit`
  · 0 lines.
- **E12** — 2026-11-23, the branch's own subjects (`git log --format=%s
  6dcfa53ad..HEAD`): two `docs(702)`, three `fix(702)`, one `test(702)` and one
  `feat(schema)` — no review, fold or audit commit; the red commit
  (`77b0eeceb`) touches test files only.
- **G1** — 2026-11-23, GATE-RAN · HEAD 194e67199 · `bun scripts/local-gate.mjs --jobs 4
  --no-bail` · exit 1 · 20 steps; the offline steps green (`temp-hygiene`,
  `secret-scan`, `tmp-gc`, `worktree-guard`, `rigidity-review`,
  `version-parity-content`, `dependency-pin-gate`); the sole red
  `workspace-install` (**A1**, verified at the base commit) skipped 12
  dependants, every one run by hand at this head: `schema-build` exit 0,
  `crate-suite-bun` exit 0 (82 suites, 0 fail), `crate-suite-node` exit 0 (82
  suites, 0 fail), `root-suite` **139 PASS / 2 FAIL** (`roadmap-settle` = A3,
  `unit-doc-contract` = A2, both base-present), `docs-generated-projection` exit
  0, `skill-context-budgets` exit 0, `journal-carrier-check` exit 0 (14 checked,
  0 refusals), `log-immutability` exit 0 (0 violations, 8 commits in range),
  `schema-node-compat` exit 0 (951 pass / 0 fail), `pi-node-compat` **exit 1 —
  A1, base-identical**, `pi-compat-guard` exit 0, `dependency-advisories` exit 0
  (0 advisories).
- **D1** — 2026-11-23, a fold line's number **is** the finding id it closed: two
  counters sharing the `F` namespace is what made a reader map a fold line to a
  different finding. Authority: S3, S8.
- **D2** — 2026-11-23, finding ids are allocated from the carrier's own open rows
  **and** its fold lines, so a closed id is never reused; `append --id` names one
  explicitly and refuses a used id. Authority: S3, S8.
- **D3** — 2026-11-23, a write splices the table block and keeps every other byte
  of the section; a section with no table is refused (`carrier-table-missing`)
  instead of having one invented over its prose. Authority: S2, S7.
- **D4** — 2026-11-23, four grammar states, three policies: `findings-table@1` is
  writable, `findings-table@0` is readable and write-refused (a write would shift
  every cell after the missing `impact`), the ledger grammar is readable in a
  side ledger and a typed defect in a doc table, and a unit carrying both is a
  typed defect. Authority: S4, S9.
- **D5** — 2026-11-23, the new check status is additive: `unevaluatable` joins the
  published family and `gate-receipt@1`'s core fields, version and token are
  unchanged, so no receipt that validates today stops validating. The version
  bump travels with the changeset (the release applies it), never as a silent
  code-only change. Authority: S5, S10.
- **D6** — 2026-11-23, an absent gate value is `unevaluatable: not-evaluated`,
  never `failed`; a supplied failure is still a content failure, and the verdict
  still fails closed (blocked) — what changes is what the verdict *claims*.
  Authority: S5, S10.
- **D7** — 2026-11-23, defect 5 (`roadmap fixrow`) is verified covered and not
  re-fixed: `fixTableShape` derives the header words, the column count and the
  issue-keyed column, and both cases pass at the base commit. Authority: S6.
- **D8** — 2026-11-23, two existing assertions were restated to the wider
  contract, never weakened (records in `decisions.md`): the omitted-gate blocker
  (`gate pr-ready failed` → `unevaluatable: not-evaluated`, still blocked and
  still naming the gate) and `gateReceiptGate`'s return (a string → the
  structured outcome, the same pass/blocks meaning). A third file's fixture
  became a real legacy unit because the dual-carrier rule makes its old fixture a
  defect. Authority: S1, S5.
- **D9** — 2026-11-23, two ceilings were re-based at the declared growth source
  and one reference line cap got a declared override, rather than trimming the
  contract text they bound (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`, entries
  named `issue #702`). Authority: S1.
- **P1** — 2026-11-23, the frozen corpus alone · `77b0eeceb`.
- **P2** — 2026-11-23, the published status · `fa969ca78`.
- **P3** — 2026-11-23, the carrier owner and the writers/readers rewired ·
  `7ee4b0662`.
- **P4** — 2026-11-23, the byte-identical differential repair and the multi-table
  legacy read · `b1c2cdd06`.
- **P5** — 2026-11-23, the merge gate's outcomes · `5d90071ce`.
- **P6** — 2026-11-23, the declared prose, the changeset, the `## Fixes` row and
  the projection · `dc4b3ad4d`.
- **P7** — 2026-11-23, the re-based ceilings and their declared growth source ·
  `194e67199`.

## Next

The owner's verdict on this diff: the obligations ledger, the verification block
and the pre-existing issues named above — four proven at the base commit, and
every skipped gate step run by hand with its result recorded in `G1`.

## References

- Issue [#702](https://github.com/gtrabanco/agentic-workflow/issues/702) — the PR
  closes it.
- [fix #684](../684-ceremony-roadmap-upsert/SPEC.md) — the `## Fixes` row writer's
  owner-ordered shape extension this unit verifies (`O13`).
- [fix #361](../361-finding-severity-ladder/SPEC.md) — `findings-table@1`'s
  severity ladder and `impact` cell.
- [feature 79](../features/79-spec-by-reference/SPEC.md) — the carrier collapse
  (issue [#308](https://github.com/gtrabanco/agentic-workflow/issues/308)): a
  migrated unit doc's `## Findings` + `## Log`, a legacy unit's side ledger.
- [feature 108](../features/108-machine-gate-receipts/SPEC.md) — the machine gate
  receipt (issue [#409](https://github.com/gtrabanco/agentic-workflow/issues/409))
  whose check-status family gains `unevaluatable`.

## Branch

`fix/702-ceremony-state-misreport`

## Depends on

none

## Regression scope

- **The ceremony's other objects keep their answers.** `bun test packages/agentic-workflow/test/runner.ceremony-p0.test.mjs` and `…/runner.ceremony-p1p2.test.mjs` exit 0: `ledger`, `review`, `evidence`, `acceptance`, `roadmap`, `plan` and `passive` answer as before, and an unknown object/subcommand still refuses `unknown-subcommand`.
- **The findings vocabulary refusals are unchanged.** The same suites exit 0: an off-ladder severity or impact is `unknown-vocabulary`, a `BLOCKER` with `report-only` is `blocker-cannot-be-advisory`, and a folded row's flip back is still refused.
- **The sensors' envelopes keep their shapes.** `bun test packages/agentic-workflow/test/runner.sensors.test.mjs` and `…/quality-metrics.collect.test.mjs` exit 0: a carrier defect is an extra `observations` string, never a new envelope field.
- **The corpus keeps its readings.** `bun test scripts/findings-corpus.test.mjs` exits 0 with `1165` findings, `56` legacy ledgers, `229` fold annotations and the live-tree count case green.
- **The merge gate keeps its contract.** `bun test scripts/audit-pr-receipt.test.mjs` exits 0: the receipt gate stays first, `MERGE-READY` still requires every gate to pass, hygiene still derives from observed state, and the comment action stays idempotent by SHA — with `D8`'s single restated assertion.
- **The `## Fixes` writer is untouched.** `git diff --name-only $(git merge-base origin/main HEAD)..HEAD -- packages/agentic-workflow/src/edit` matches 0 lines, and `bun test packages/agentic-workflow/test/edit.test.mjs` exits 0.
