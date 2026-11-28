---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and scope).
type: feature
scope: small
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
roadmap_summary: claim staleness projection — the pre-execution snapshot's changedPaths attribution projected onto `sources.md` CLAIM/INV rows as a `staleness` mark
---

# 634 — claim-staleness-projection

> One-line: project the pre-execution snapshot's `changedPaths` attribution onto the unit folder's claim ledger (`sources.md` CLAIM/INV rows), marking a claim `stale (P<n> · <sha>)` when the bytes it cites move.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
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

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Project changedPaths onto sources.md CLAIM/INV rows.**
> Mark a claim `stale (P<n> · <sha>)` when the bytes it cites move.

**S2 — Consumer contract from observed case.**
> The consumer contract is decided from the observed case that fired the trigger — never pre-designed here.

**S2a — Proceed with no observed case (owner directive, 2026-11-28).**
> selected both

S2a is the owner's correction to S2's premise, appended under its own id and
leaving S2 untouched. The option the owner selected reads, verbatim: *"Both, in
one PR — repair the unit doc, then implement the projection against it — still
needs the trigger you consider fired, since the issue body gates the behaviour
change."* No trigger was found fired (§ Log `E1`–`E3`), so this is an **owner
waiver** of the issue's gate, not a trigger claim: it is recorded as `D1` in
`decisions.md`. Because no observed case exists, S2's own rule ("never
pre-designed here") still binds the *consumer policy*, which is why S2a delivers
the least-authority consumer — the mark plus a read-only report — and gates
nothing (`D2`).

**S3 — Signal surface for #444's risk scoring (optional).**
> Possible signal surface for #444's risk scoring.

**S5 — Open the pull request.**
> Create the PR

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it. This section is the anchor the review's per-criterion coverage reads.

**AC1 (S1).** A CLAIM/INV row whose cited repository path moved after a recorded
phase is marked exactly `stale (P<n> · <sha>)` — the literal shape, with the
newest recorded phase whose revision no longer contains the cited bytes — and
`claims --emit` prints the row's own `staleness` cell carrying it. The command
emits those bytes and never writes them: `sources.md` is a durable unit-folder
record, so the ledger-ownership map's `no-script-writer` directive keeps every
script off it (`D5`).
Proved by: `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0
and its `stale mark` cases assert the exact string (never a substring match), and
its `--emit` case proves the ledger file is byte-unchanged afterwards.

**AC2 (S2, S2a).** The consumer contract is recorded as a decision (`D2`) and
observable in behaviour: the projection writes the mark, `--check` exits 1 when a
stale row exists and 0 when none does, and **no gate in this repository consumes
it** — the delta adds no blocking path.
Proved by: `decisions.md` `D2` present; the suite's `--check` exit-code cases; a
live-tree search proving no gate references the op.

**AC3 (S3).** The #444 risk-scoring signal stays unimplemented — #444 is open and
`postponed` — and the deferral is recorded with its re-trigger in
`known-issues.md` rather than dropped.
Proved by: `rg 'risk-scor' docs/features/634-claim-staleness-projection/` finds the
recorded re-trigger; the projection's envelope carries no scoring field.

**AC4 (S5).** One pull request against `main` carries the whole unit.
Proved by: `gh pr view <n> --json baseRefName,headRefName` reports `main` and
`fix/634-claim-staleness-projection`.

**AC5 (S1).** The projection runs on this unit's own claim ledger — the real
tree, not only a fixture — and its rows come back with a mark (`fresh`,
`stale …`, `no-citation` or `unverified …`), never blank.
Proved by: `bun packages/agentic-workflow/bin/agentic-workflow.mjs pre-execution-snapshot claims --unit 634-claim-staleness-projection` prints one row per CLAIM/INV row in `sources.md`.

## Impact

What the change touches beyond its own files: the pre-execution snapshot sensor
(`pre-execution-snapshot` gains a fourth op and reuses `changedBoundPaths` rather
than re-deriving git evidence), the unit folder's claim ledger (`sources.md`
gains one appended column), the crate README's command row and its new
`claim-staleness@1` grammar block, and the normative-surface inventory in
`AGENTS.md`. It retires nothing: the `build|verify|contract` ops and their exit
contracts are untouched.

## Surfaces

The batch scheduler's lane keys this unit occupies, one per line.

- `packages/agentic-workflow` — the sensor module, its suite, the help index and the crate README
- `docs/features/634-claim-staleness-projection` — this unit doc, `sources.md`, `decisions.md`
- `AGENTS.md` — one `normative-surfaces@1` row for the new grammar

## Retirements

None — this unit adds an op and a column; it deletes no surface (`IR6` is not
engaged: nothing is superseded).

## Non-goals

- No behaviour change to `build`/`verify`/`contract`; the op is additive.
- No pre-designed consumer policy: the projection never blocks a gate, and `D2`
  records why the least-authority consumer is the only honest one without an
  observed case.
- No risk scoring integration for #444 — explicitly optional in S3 and recorded
  as a re-triggered known issue.
- No migration of the six other `sources.md` claim journals: the projection
  writes the column only into the unit it is asked about.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `standard` · **Task Size** — small (two files of new logic, one appended column, no schema change)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status.

- None deferred at this time.

## Future cost

Standing obligations this unit imposes on future work.

- The `stale (P<n> · <sha>)` mark must be consumed by at least one executor that
  reads sources.md CLAIM/INV rows, or the mark is a finding, not a signal. The
  consumer shipped here is the read-only report (`--check`); a *blocking* policy
  still needs the first observed case that S2 names.
- Once a real case fires, `D2`'s mark-and-report policy is re-opened and the
  block/warn/re-read question answered from it.

## Applicable tests

The tests this unit will run (triage-decided).

- `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` — the new suite: the mark grammar, the phase-precedence rule, the four no-signal states, the idempotent write, and the CLI wiring on a throwaway repository.
- `bun test packages/agentic-workflow/test/cli.surface.test.mjs` and `packages/agentic-workflow/test/cli.help.test.mjs` — the command surface still matches its README.
- `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` — the three existing ops keep their behaviour.
- `node scripts/normative-drift.test.mjs` — the new grammar surfaces resolve.
- `bun scripts/run-root-suite.mjs` — the whole root suite.

## Known pre-existing issues

- **#444** — decision-substrate (S3's trigger condition 3). Affects: the risk-scoring signal stays out of this unit; it is re-triggered by `known-issues.md`, not silently dropped.
- **#179** — fix/179-declared-ledger-delta-receipts (related ledger staleness at another level). Does not affect: claim-level staleness is a different dimension.
- **#269** — executor read sets. Does not affect: the executor reads per-phase `Relevant files`, not CLAIM rows; `D2` keeps this projection out of the executor's path.

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Freeze this unit doc's planning evidence, obligations and acceptance criteria (validator: `agentic-workflow unit-doc 634-claim-staleness-projection validate` prints `"ok": true`; the ledgers carry ≥ 6 PE rows and ≥ 8 obligation rows)
  (Implements: S2a)
  - Relevant files: docs/features/634-claim-staleness-projection/SPEC.md, decisions.md

- P2 — RED: land the claim-staleness suite alone, observed failing on the absent module (validator: `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits non-zero and its output names `claim-staleness.mjs`)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/test/claim-staleness.test.mjs

- P3 — GREEN: the projection module — cited-path extraction, phase→revision reading, the mark grammar, and the idempotent column projection (validator: `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/claim-staleness.mjs

- P4 — The `claims` op on `pre-execution-snapshot`: `--emit`, `--check`, the envelope, and the unchanged three ops (validator: `bun test packages/agentic-workflow/test/claim-staleness.test.mjs scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` exits 0)
  (Implements: S1, S2)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs, packages/agentic-workflow/src/runner/help.mjs

- P5 — Docs and surface registration: the crate README's Commands row plus the `claim-staleness@1` grammar block, the `AGENTS.md` normative-surface row, the changeset (validator: `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 and `node scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S2a)
  - Relevant files: packages/agentic-workflow/README.md, AGENTS.md, .changeset/634-claim-staleness-projection.md

- P6 — Verification: the new suite, the sensor suites, the package suite, the root suite, and the live projection over this unit's own `sources.md` (validator: `bun scripts/run-root-suite.mjs` exits 0 and the live `claims --unit 634-claim-staleness-projection` prints one marked row per claim)
  (Implements: S1, S5)
  - Relevant files: docs/features/634-claim-staleness-projection/

- P7 — Release settle: the roadmap row through the writer, the journal fragment through `journal write`, the PR opened against `main` (validator: `gh pr view <n> --json baseRefName` reports `"main"`)
  (Implements: S5)
  - Relevant files: docs/ROADMAP.md, .agentic-workflow/journal/

### Planning evidence

One row per Engineering claim the change rests on. `authority-kind` is the closed cell (`known | assumption | unknown | spec`), `freshness` is `current | stale | not-applicable`. Every row was sampled at the cut head (`51747154e`). Column order and vocabularies are owned by `skills/pre-execution-review/references/LEDGERS.md` §1.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The git evidence this projection needs already exists and is the sensor's own: `changedBoundPaths(gitRun, revision, paths)` answers exactly "which of these paths differ between that revision and the worktree", uncommitted edits and untracked additions included — so the projection reuses it instead of writing a second git reader | `packages/agentic-workflow/src/runner/sensors/pre-execution-snapshot.mjs:193`; `scripts/pre-execution-attribution.test.mjs` | current | O1; O7 |
| PE-002 | known | The `sources.md` CLAIM/INV table is `id \| claim \| source \| provenance \| certainty` and is owned by DESIGN.md § Provenance; no cell-count pin exists, and the one programmatic reader resolves cells by header index and skips a row whose width differs from its header — so an appended, width-consistent `staleness` column changes no reader's answer | `skills/unit-lane/references/DESIGN.md` § Provenance; `scripts/knowledge-honesty-contract.test.mjs:301-318` (`provenanceRows`); `rg -n '^\| id \| claim \| source \| provenance' docs/features/*/sources.md` → 8 tables, 5 columns each | current | O6; D3 |
| PE-003 | known | A recorded phase is a `## Log` `P<n>` line, and that line carries the phase's commit sha in backticks — the phase→revision map the mark's `<n>` and `<sha>` come from, read through the existing `parseLog` instead of a second parser | `packages/agentic-workflow/src/runner/unit-doc-phases.mjs:327,350` (`parseLog`, `loggedPhases`); `docs/features/394-auto-log-session/SPEC.md:222` (`P1 … · \`ad5a2b3f\``) | current | O1; O2; O4 |
| PE-004 | known | The `certainty` cell carries its own closed meaning and a `confirmed`/`inferred` fact stays true while a citation rots — so the staleness mark cannot live in `certainty` without conflating two independent truths, and it cannot live in a separate block without leaving the claim it judges | `skills/unit-lane/references/DESIGN.md` § Provenance (the `certainty` ceiling table) | current | O6; D3 |
| PE-005 | known | The mark shape is new: no claim-level `stale (P<n>` exists anywhere in the tree today, so the projection introduces a grammar rather than reading one | `rg -n 'stale \(P' docs/` → 0 claim-level hits (only prose about this unit) | current | O1; O9 |
| PE-006 | known | The mark vocabulary is a Class-3 runner-internal set — no published contract names it — so `vocabulary-residency@1` keeps it in its own module instead of the schema package, and no schema/version mirror enters this PR | `docs/architecture/ARCHITECTURAL_INVARIANTS.md:65` (`vocabulary-residency@1`, `runner-internal` row) | current | O1; O9 |
| PE-007 | known | Adding an *op* to an existing subcommand needs no usage-line or README-token change: the surface suite pins only the top-level subcommand list, and the help index carries ops per subcommand | `packages/agentic-workflow/test/cli.surface.test.mjs:19-27`; `packages/agentic-workflow/src/runner/help.mjs:214-219` | current | O9 |
| PE-008 | known | A `spec-by-reference` unit doc (this one) requires `Specs … Tasks … Log` and tolerates `## Acceptance criteria` as a shared section — the shape precedent feature 105 ships — so the criteria section goes in without a re-cut | `packages/agentic-workflow-schema/src/pre-execution.ts:253-305`; `docs/features/105-projection-manifest-vocabulary/SPEC.md:24,84`; `agentic-workflow unit-doc 105-projection-manifest-vocabulary validate` → `"ok": true` | current | O10 |
| PE-009 | known | A script may not write a durable unit-folder ledger: the `ledger-ownership@1` map declares one owner per AC16 truth class and a `# no-script-writer:` directive for the records no script may touch, and its scan fails closed on a script writing a declared-or-durable ledger it is not declared for — feature 669 hit the same boundary writing `decisions.md` instead of `SPEC.md` | `skills/pre-execution-review/references/LEDGERS.md:180-191` (`ledger-ownership@1`, the directive line); `scripts/ledger-ownership.test.mjs:772` (scan 2 over the real tree) | current | O11; D5 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and required failure state. Nine-column shape owned by `skills/pre-execution-review/references/LEDGERS.md` §2; every row is `planned` at cut and `verified` only with its validator run in the foreground and its evidence recorded where `required-evidence` says.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 (`Mark a claim stale (P<n> · <sha>) when the bytes it cites move`); AC1 | A CLAIM/INV row whose cited repository path moved after a recorded phase carries the literal mark `stale (P<n> · <sha>)` | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the `stale mark` case names the exact string in the suite | verified |
| O2 | S1; AC1; PE-003 | The mark names the **newest** recorded phase whose revision no longer contains the cited bytes — never the earliest, never a fabricated revision | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the `phase precedence` case (three phases, one move) passes | verified |
| O3 | S1; AC1 | A row whose `source` cell cites no resolvable repository path is `no-citation` — never `stale`, and never silently dropped from the report | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the `no-citation` case (an owner-answer row) passes | verified |
| O4 | S1; AC1; PE-003 | Failure state: a unit recording no `P<n>` phase leaves every row `unverified: no-recorded-phase` — a false `fresh` is a defect | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the `no phase` case asserts the exact unverified mark | verified |
| O5 | S1; AC1 | Failure state: a recorded revision git cannot resolve leaves the row `unverified: unresolvable-revision (P<n>)`, never a silent `fresh` | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the `unresolvable revision` case asserts the exact unverified mark | verified |
| O6 | S1; AC1; PE-002; PE-004; D5 | Compatibility: the projection touches only the `staleness` column and is idempotent — every other cell, row, escape (`\|`) and byte outside the CLAIM/INV tables is preserved, a second `--emit` is byte-identical, and the command writes no file | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the projection cases: byte-equal second emit, escaped-pipe row preserved, prose outside the table untouched, and the ledger file byte-unchanged after `--emit` | verified |
| O7 | S1; PE-001 | Compatibility: the existing `build`/`verify`/`contract` ops keep their behaviour and exit contracts; the op is additive | P4 | P4 | execute-phase | `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` exits 0 | both suites green at the change head | verified |
| O8 | S2; S2a; AC2 | The consumer is mark-and-report, never a blocker: `--check` exits 1 when a stale row exists, 0 when none does, 2 on a usage error, and no gate in the tree consumes the op | P4 | P4 | execute-phase | `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` exits 0 | the `--check` exit-code cases plus the no-consumer search recorded as `E` in `## Log` | verified |
| O9 | S1; S2a; AC1; PE-005; PE-006; PE-007 | The new surface is declared where the machine reads it: the crate README's Commands row carries the op and publishes `claim-staleness@1`, and `AGENTS.md`'s `normative-surfaces@1` names the block | P5 | P5 | execute-phase | `node scripts/normative-drift.test.mjs` exits 0 and `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 | both exit codes in `## Log` `E` lines | verified |
| O10 | S2a; AC5; PE-008 | Documentation currency: this unit doc validates in its own shape and the projection runs on this unit's own claim ledger, printing one marked row per CLAIM/INV row | P1 | P1 | execute-phase | `agentic-workflow unit-doc 634-claim-staleness-projection validate` prints `"ok": true`; `agentic-workflow pre-execution-snapshot claims --unit 634-claim-staleness-projection` prints a mark for every row | the validator outputs recorded in `## Log` `E`/`G` lines | verified |
| O11 | S1; AC1; PE-009 | The command is read-only under every flag: `--emit` and the envelope print, and no path opens `sources.md` for writing, because the ledger-ownership map forbids a script writing a durable unit-folder record | P4 | P4 | execute-phase | `bun test scripts/ledger-ownership.test.mjs` exits 0 | that suite's scan 2 green over the real tree, plus the same obligation pinned by the claim suite's byte-unchanged case | verified |

## Triaged steps

This built `unit-route` publishes no `--triage` flag (its usage is
`unit-route <unit|issue>`), and the router refuses to answer for this unit while
it is complete-but-unmerged. Its words, verbatim:

```text
UNIT ROUTE — error
unit docs/features/634-claim-staleness-projection has all phases recorded but status is 'in-progress' (not 'done') — settle the index or roadmap status before routing to close-out
```

So no machine step list is pasted here: the `## Tasks` phases above are the step
list, and the router's refusal is recorded rather than replaced by a hand-written
substitute for a block it never emitted.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the request, verbatim:
  ```
  claim staleness projection (trigger-gated, parked)
  ```
- **L2** — 2026-11-28, the request, verbatim:
  ```
  Apply to this repository: issue #634

  This is a **local, unpublished** workflow for changing agentic-workflow itself.
  The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:
  …
  ```
  The owner then asked, verbatim: `Create the PR`, and answered the
  PR-content question with `selected both` (the option text is quoted under
  S2a).
- **D1** — 2026-11-28, the owner waived the issue's trigger gate. Authority: the
  owner's `selected both` answer to an option whose text states the caveat
  verbatim ("still needs the trigger you consider fired, since the issue body
  gates the behaviour change"), after three `E` lines showing no trigger fired.
  Recorded as `D1` in `decisions.md`; the client never claims a trigger fired.

- **E1** — trigger 3 checked: `gh issue view 444 --json state,labels` → `state: OPEN`, labels `backlog`, `postponed`, `feature`. #444 has not activated, so trigger 3 has not fired.
- **E2** — trigger 1 checked: `rg -n 'runner flow|/flow|flow driver' docs/LOGS.md` → 12 hits, every one about *building* #669 (`:10220` "Feature 669 closed", `:9929` "/draft and /flow don't exist yet"); the driver merged with PR #749 at 2026-11-28T11:24Z, under four hours before this cut. Zero journal entries show a unit run under it, so the "majority of standard units via driver" condition has not fired.
- **E3** — trigger 2 checked: `rg -n -i 'no longer matches|source drift|stale claim|cited path' --glob 'docs/**/{known-issues,SPEC,review-findings}.md'` → no finding whose root cause is a claim citing bytes a phase rewrote. The adjacent cases sit at other, already-owned levels: #179 (ledger RS13/RS3(b)), #509 (lane claims), `docs/fix/706-log-write-path-fix/known-issues.md:12` (a claim's word), `docs/features/79-spec-by-reference/review-findings.md:37` (F20 disputed → dismissed). Trigger 2 has not fired.
- **E4** — the red receipt: `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` → exit 1, `Cannot find module '../src/runner/sensors/claim-staleness.mjs'`, observed with the module moved aside so the failure is the intended one and not a wrong import specifier.
- **E5** — `bun test packages/agentic-workflow/test/claim-staleness.test.mjs` → 22 pass, 0 fail.
- **E6** — `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → 32 pass, 0 fail (O7: the three existing ops keep their behaviour).
- **E7** — `bun test packages/agentic-workflow/test/cli.surface.test.mjs packages/agentic-workflow/test/cli.help.test.mjs packages/agentic-workflow/test/runner.sensors.test.mjs` → 40 pass, 0 fail.
- **E8** — `bun test scripts/normative-drift.test.mjs` → 24 pass, 0 fail; `bun scripts/check-skill-context.mjs --documents` → PASS, 8 budgeted documents (O9).
- **E9** — `bun test scripts/ledger-ownership.test.mjs scripts/git-config-writes.test.mjs packages/agentic-workflow/test/claim-staleness.test.mjs` → 47 pass, 0 fail (O11).
- **E10** — the differential against the base commit: `git archive 51747154e` into a throwaway tree, then the same suites there. `doc.query` + `doc.hybrid` → 44 pass / 9 fail on base AND on head, identical; `scripts/single-repo-leaks.test.mjs` → 13/2 on one base run and 12/3 on the next, and 12/3 on head — flaky on both sides, not a regression. With `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL`, `…_API_KEY`, `…_MODEL`, `…_MAX_REQUEST_CHARS` and `NAN_API_KEY` unset, `doc.query` → 22 pass 0 fail and `doc.hybrid` + `doc.structure` → 50 pass 0 fail: the provider variables this session exports are the cause, and they poison the base tree the same way.
- **G1** — the gate: `bun scripts/local-gate.mjs --jobs 1` with those ambient variables unset → **exit 0, `PASS — 20 step(s) in 859s`** (`crate-suite-node` exit 0 in 251s, `root-suite` exit 0 in 364s). Two earlier runs are recorded rather than discarded: `--jobs 4` died at `crate-suite-bun` on the `doc.*` suites, and `--jobs 2` died at `root-suite` on `single-repo-leaks`' probe timeouts — both traced to the ambient variables plus a box at load 11.5 on 6 cores, and both reproduced on the base commit (`E10`).
- **F1** — folded inside the unit, each a real gate finding against this change: `scripts/git-config-writes.test.mjs` refused the fixture's `git config user.*` writes (the identity now rides each commit as `-c`); `scripts/ledger-ownership.test.mjs` refused `--write` touching a durable unit-folder record (the op became `--emit`, `D5`); `scripts/prose-gate-inventory.test.mjs` refused a declared surface that no gate row cited; the guide's own budget was re-pinned to the exact measurement for the new machine row.
- **P1** — 2026-11-28, the unit doc repaired: both ledgers cut (8 evidence rows, 11 obligations), one criterion per requirement, the two unsatisfiable validators replaced, `sources.md` + `decisions.md` + `known-issues.md` added · `1447db55a`.
- **P2** — 2026-11-28, the suite landed alone and red, then two corrections of its own expectations before any implementation existed — the phase-revision rule (the corpus puts the phase's commit first) and the import specifier · `22608b40a`, `f0d831919`, `a4d148019`.
- **P3** — 2026-11-28, the projection module: cited-path extraction, phase→revision reading, the mark grammar, the idempotent column projection · `8603afbbd`.
- **P4** — 2026-11-28, the `claims` op on `pre-execution-snapshot` and its help row · `7000bc08a`, corrected to `--emit` in `6d3cc388f`.
- **P5** — 2026-11-28, the surface declared: the crate README's command row and the `claim-staleness@1` block, the `normative-surfaces@1` row, the skill reference's paragraph, the changeset · `7c893722e`, with the budget re-pin and the roadmap status in `8694f0cc5` and the gate-inventory claim in `66801b4fa`.
- **P6** — 2026-11-28, verification: `E5`–`E10`, `G1`, and the live projection over this unit's own ledger (recorded below).
- **P7** — 2026-11-28, release settle: the roadmap row, the journal fragment, the pull request.
- **E13** — the consumer check behind `O8`/AC2: `rg -n "pre-execution-snapshot claims" --glob '!docs/**' --glob '!*.test.mjs' -l` → 2 hits, the crate README and the sensor itself (the skill reference joins them under `C1`). No gate, hook, script or skill invokes the op, so nothing in this repository gates on its exit code — `D2` is observable, not a claim in prose.
- **E12** — the review-dimension evolution check for this range: `runner dimension-regression --base 5174715` → `21 dimensions` at base and at head, `changed review surfaces 1` (`skills/pre-execution-review/references/LEDGERS.md`, where `sources.md` joined the `no-script-writer` directive). No dimension was dropped or narrowed: the edit only *removes* a writer from a record, so the audit's dimension set is unchanged and nothing needs re-deriving. This line is the recorded run the gate asks for (`E12` carries the command it names).
- **E11** — the live projection over this unit's own ledger (AC5), at head `78b35dbbb`: `agentic-workflow pre-execution-snapshot claims --unit 634-claim-staleness-projection` → 12 rows, `5 stale · 7 fresh · 0 no-citation · 0 unverified`, every row marked. The five stale rows are the honest answer, not a defect: `CLAIM-001` cites the sensor, `CLAIM-007` cites `decisions.md`, `INV-002`/`INV-003` cite this doc and `INV-005` cites `known-issues.md`, and all four files moved after `P5` — the phase the mark names. Each was re-read against the tree while writing this line and each still holds. `--check` over the same head → exit 1 (five stale rows), which is the report's only gate and nothing consumes it (`D2`).


## Next

Hand the diff to the owner for external verification. Nothing is approved here:
the unit's own `G1` is a writer's receipt, and `--check` gates nothing by design
(`D2`).

## References

- Issue: [#634](https://github.com/gtrabanco/agentic-workflow/issues/634)
- Roadmap: row 634
- #444 — decision-substrate (S3's trigger condition 3)
- #179 — fix/179-declared-ledger-delta-receipts (related ledger staleness at another level)
- #269 — executor read sets (executor reads per-phase Relevant files, not CLAIM rows)
