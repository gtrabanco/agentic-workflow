# 471 — journal-github-action · decisions

Owner-scoped decisions and the path-protection records for this unit. The records
are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration they
answer lives in [`SPEC.md`](SPEC.md) `## Risk tier` (the unit declares no
`## Path protection` block because it modifies no existing suite — see the record
below).

## Path-protection escape records

Every suite this unit touches is a protected path (`**/*.test.*`, `tests/**`,
`freeze: true`). This unit **modifies no existing suite**: the corpus is one new
file, and every existing journal suite is run unchanged as the non-regression
half (O14).

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/journal.headless.test.mjs | P2 | 2026-11-15 | direct application (owner apply order §2/§5) | the new headless writer's corpus is created as the red commit, before the module, the CLI operation or the action exist; it writes only throwaway `mktemp -d` copies and never reads or edits a sibling suite
```

## Decisions

- **D1** (2026-11-15) — **The write path is the carrier fragment; the aggregator
  remains the only writer of the journal file.** `S15` asks for "deterministic
  append of the fragment to `docs/LOGS.md` … the same merge discipline as
  `docs/generated/**`". The merge discipline that shipped for the journal is
  #405's carrier: the fragment **is** the append-only unit, and
  `journal aggregate` is the append. A CI writer appending to `docs/LOGS.md`
  directly would (a) contradict #405's AC1 ("no writer edits `docs/LOGS.md`
  directly" when opted in), (b) be refused by the push-level
  `log-immutability` gate (#468) as a hand-append, and (c) duplicate a merge path
  the repository already has. The issue marks the sketch "details at triage", so
  this is the triage decision, and the `docs-generated` projection check is
  unaffected because nothing under `docs/generated/` moves. Authority: `S15`,
  PE-002, PE-003.

- **D2** (2026-11-15) — **The `## Triaged steps` block is this unit's own
  declared step list.** `unit-route --triage` has no registration for a lane that
  never opened this unit, and the apply order's §5 freeze substitutes for the
  lane's plan step. Frozen in the SPEC at the cut rather than pasted from a
  machine that cannot answer.

- **D3** (2026-11-15) — **No new configuration key.** `S18` asks for enablement
  "through the unified config home (#427), opt-in at init-workspace like every
  install surface". The unified config policy asks first "is it really
  configurable?"; here the carrier directory's presence is already the opt-in
  (#405 D4), and a second signal would let the two disagree — a key saying "on"
  with no carrier, or a carrier that a key silently disables. So the action
  refuses an absent carrier (O8) and the install surface stays the one
  consent-gated question in `init-workspace`. Authority: `S18`, PE-005,
  `AGENTS.md` §Config policy.

- **D4** (2026-11-15) — **The action is a composite action at `journal/`, and its
  crate version is derived from its own tree, never restated.** `uses:
  gtrabanco/agentic-workflow/journal@<tag>` requires `action.yml` in that
  directory, so the path is the issue's own `…journal@vX` shape. The metadata
  declares inputs and one `run` step (`node "$GITHUB_ACTION_PATH/headless.mjs"`,
  because a composite action receives no `INPUT_*` automatically — PE-006), and
  the adapter reads the crate version from
  `$GITHUB_ACTION_PATH/../packages/agentic-workflow/package.json`, which is the
  tagged tree's own version: one train, one pin, and no literal for
  `rendered-facts@1` to police. Authority: `S13`, PE-006, PE-007.

- **D5** (2026-11-15) — **Provenance rides the grammar's existing fields, and no
  field is added.** `S17` says "per the grammar's fields". The fragment's
  session slug carries the run (`gha-<run id>`, which `GITHUB_RUN_ID` keeps
  stable across re-runs) and the entry's heading label names the workflow, the
  run id and the actor (plus the issue, when declared), because the label is the
  block owner's own free-text cell. Adding a metadata line or a kind would move
  `journal-write-grammar@1` and the byte-parity contracts for a string the
  grammar already carries. Authority: `S17`, `S20`, PE-002, PE-004.

- **D6** (2026-11-15) — **One entry per headless run; a second invocation is a
  no-op, not a duplicate.** `writeJournal` already refuses a second fragment of
  one kind for a session (`already registered`), which is right for a
  conversation and wrong for a CI re-run: the operator re-runs a job to fix an
  unrelated step, and the writer must not create a second entry or fail the job.
  `journal headless` therefore answers `already-present` (exit 0, the existing
  name and path) when the carrier already holds this run's narrative fragment.
  Authority: `S13`, PE-006 (`GITHUB_RUN_ID` is unchanged by a re-run).

- **D7** (2026-11-15) — **The action never holds a token and declares no
  permission.** A composite action's metadata has no `permissions` key (PE-006),
  so a `permissions:` block there would be a lie; the calling job declares
  `permissions: contents: write` for the push that carries the fragment. The
  action's only effect is one file in the workspace — no `gh`, no API, no comment,
  no label (O6). Authority: `S16`, PE-006.

- **D8** (2026-11-15) — **The adapter refuses instead of installing.** It resolves
  `AGENTIC_WORKFLOW_RUNNER` (the runner contract's documented override, so this
  repository's own suites exercise the working tree), then `bunx`, then `npx`,
  and refuses with an actionable message when no runtime exists or `node` is
  older than the crate's `engines`. An action that quietly installs a runtime
  would make its own verdict depend on the network at write time. Authority:
  `S13`, PE-008, PE-010.
