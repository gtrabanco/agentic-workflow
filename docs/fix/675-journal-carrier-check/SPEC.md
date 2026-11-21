---
type: fix
scope: small
roadmap_summary: Issue [#675](https://github.com/gtrabanco/agentic-workflow/issues/675) (S, high): `journal aggregate --check` gains the read-side half of #468 S3 — two conforming fragments whose parsed identity collides on `(sessionSlug, kind)` are now a lint refusal naming every file, while the aggregator stops depending on byte coincidence and consumes the newest of a colliding pair, naming the superseded fragment in its receipt. Applied through the owner's local inline workflow (ledgers frozen at cut). SPEC: [SPEC](fix/675-journal-carrier-check/SPEC.md)
ac-hash: 451a78df0606c474cdad75c55941b4ec410864625fd98beda9efb4a7bb00aa34
---

# fix/675-journal-carrier-check

> One-line: the carrier lint learns the cross-fragment half of "one entry per
> conversation per kind" — a colliding `(sessionSlug, kind)` is refused naming
> every file it touches, and the aggregator stops appending both under a rule
> that only looked like byte-identity.

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

`#675` — tracked issue in the project's forge. The PR closes it via
`Closes #675`. Applied through the owner's local inline workflow (the unit
folder is `docs/fix/675-journal-carrier-check/`); the issue carries the `bug`
label and the triage verdict filed it as `fix-now (high)` on 2026-11-21.

## Specs

`S1` is the owner's instruction; `S2`–`S13` are the issue's own words, one
requirement per distinct ask, in the order the issue states them.

**S1 — Apply issue #675 to this repository.**
> Apply to this repository: issue #675

**S2 — The lint gains the cross-fragment invariant.**
> `checkJournal` gains the cross-fragment invariant: two conforming fragments whose **parsed identity** collides on `(sessionSlug, kind)` are a lint refusal naming **both** files (the grammar's unit is conversation-per-kind; timestamp and branch do not distinguish an entry slot).

**S3 — The aggregation behaviour for a colliding pair is decided and pinned here.**
> The aggregation behavior for identity-colliding duplicates is decided and pinned in the same unit: refuse (align with the write-time rule), or consume newest-first with the superseded one recorded explicitly as consumed — the choice must not depend on byte coincidence, which is the current (accidental) rule.

**S4 — Red-first, with the live pair as the red case.**
> The suite lands red-first (the live-fixture pair is the red case) per the repo's test rules.

**S5 — The writer is out of scope.**
> The writer: not broken — S3 holds there; no change to `--session` semantics.

**S6 — The lint stays a reporter.**
> The lint stays a reporter: it refuses, it never repairs or deletes (#452 S3).

**S7 — No vocabulary moves without residency.**
> Vocabulary movement: any new fixed vocabulary (e.g. a consumption/supersede marker) is published in the schema package per `vocabulary-residency@1`, otherwise none.

**S8 — `log-immutability`'s attribution model is untouched.**
> `log-immutability`'s attribution model: unchanged; only the lint gains the check.

**S9 — The verification sketch: both halves of the CLI.**
> Fixture carrier with two narrative fragments, same parsed session slug, different conforming content → `journal aggregate --check` exits non-zero and names both; `journal aggregate` (without `--check`) does not append both silently under the decided rule.

**S10 — Byte-identical duplicates keep today's behaviour.**
> Byte-identical duplicate keeps today's `already-present` behavior (regression).

**S11 — Non-colliding carriers stay green.**
> Non-colliding carriers stay green: `.gitkeep`-only, mechanical+narrative of one session, two sessions of one kind, one fragment.

**S12 — The concurrent-writer straggler is refused on the read side.**
> Concurrent-writer straggler (two writes, different seconds, same session+kind) is refused by the lint even though both created successfully — nets the write-time TOCTOU on the read side.

**S13 — Gate green; the sibling pin is answered honestly.**
> `bun scripts/local-gate.mjs` green; `scripts/structural-sibling-pins.test.mjs` covered by the new suite's sibling.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256. One
criterion per requirement, each naming the check that proves it.

1. **S1 — the issue is applied, not reinterpreted.** `git diff --name-only 278dff6c..HEAD` lists only the paths `## Impact` names, and every `S#` above appears verbatim in this document.
2. **S2 — the lint refuses the colliding pair and names both files.** `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with `checkJournal refuses two fragments of one conversation+kind, naming both files`, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check --dir <fixture>` on that pair exits 2 with both names on stderr.
3. **S3 — the aggregation rule is decided, pinned and byte-independent.** The same suite exits 0 with `the aggregator consumes the newest of a colliding pair and names the superseded fragment`, `journal-fragment-grammar@1`'s `aggregate` row states the rule, and the receipt's `superseded` row carries `{ name, supersededBy }`.
4. **S4 — red before green.** `git show <red-sha>:packages/agentic-workflow/src/journal/aggregate.mjs | rg -c 'superseded'` matches 0 while the test-only commit is the suite's head, and the `## Log` records both runs with their commit.
5. **S5 — the writer is untouched.** `git diff 278dff6c..HEAD -- packages/agentic-workflow/src/journal/write.mjs` shows only the shared-predicate replacement (no `--session` semantic change), and `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with 23 pass.
6. **S6 — the lint moves no byte.** The same suite exits 0 with `journal aggregate --check` leaving every fragment and the journal byte-identical.
7. **S7 — no vocabulary moved.** `git diff --name-only 278dff6c..HEAD -- packages/agentic-workflow-schema` is empty, and no `journal-entry`/`log-kind` vocabulary gains a member.
8. **S8 — `log-immutability` is untouched.** `git diff --name-only 278dff6c..HEAD -- scripts/log-immutability.mjs` is empty.
9. **S9 — both CLI halves answer.** `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with the `journal aggregate --check` case (exit 2, both files named) and the `journal aggregate` case (one appended, one superseded, one copy in `docs/LOGS.md`).
10. **S10 — the crash-safe re-run still holds.** The pre-existing `an already-present entry is consumed without being appended again` case stays green in the same run.
11. **S11 — non-colliding carriers stay green.** The same suite exits 0 with `checkJournal keeps non-colliding carriers green`, covering `.gitkeep`-only, mechanical+narrative of one session, two sessions of one kind and one fragment.
12. **S12 — the straggler is refused.** The same suite exits 0 with `two writes that raced past the writer's already-registered check are refused by the lint`.
13. **S13 — the gate and the sibling pin.** `bun scripts/local-gate.mjs --list` names no new script, `bun test scripts/structural-sibling-pins.test.mjs` exits 0 (nothing unpaired was added), and the gate's per-step verdict is recorded verbatim — see `## Known pre-existing issues` for the one step the repository's own carrier holds red and `## Next` for its sanctioned clearing step.

## Impact

The change is small but it sits under three consumers, and one of them is not
code:

- `packages/agentic-workflow/src/journal/aggregate.mjs` — `checkJournal` gains
  the cross-fragment pass; `aggregateJournal` gains the supersede decision and
  the receipt's `superseded` list. Both read one shared predicate for "this
  session slug names a conversation" instead of a second copy of the `local`
  exemption. `packages/agentic-workflow/src/journal/aggregate.d.mts` declares
  the same receipt shape — `superseded` included — for TypeScript consumers.
- `packages/agentic-workflow/src/journal/fragment.mjs` — exports that predicate
  (`SHARED_SESSION_SLUG`, `isConversationSession`); the name/content grammar
  does not move.
- `packages/agentic-workflow/src/journal/write.mjs` — keeps its behaviour and
  reads the shared predicate, so the write rule and the read rule cannot drift.
- `packages/agentic-workflow/bin/agentic-workflow.mjs` — the CLI header states
  the entry-slot rule beside the aggregate description, and the refusal line
  counts the refused files, so a colliding slot's count matches the files it
  names (the external verify's correction batch, 2026-11-21).
- The unit's own carriers — `docs/fix/675-journal-carrier-check/SPEC.md` (this
  doc) with its `external-verify.md`, and the two suites that pin the invariant,
  `packages/agentic-workflow/test/journal.test.mjs` and
  `scripts/local-gate.test.mjs` — carry the request, its evidence and its gate
  coverage, not new behaviour.
- `template/.agentic-workflow/journal.md` — the scaffold's carrier doc states
  the entry-slot rule next to the aggregate description and cites
  `journal-fragment-grammar@1` as its owner instead of restating it.
- `packages/agentic-workflow/README.md` — `journal-fragment-grammar@1`'s
  `aggregate` row (the supersede rule) and `journal-write-grammar@1`'s
  `carrier-check` row (the cross-fragment half) stay truthful; both are the
  declared normative surfaces (`AGENTS.md`'s `normative-surfaces@1`), so the
  drift gate reads the new wording without a new row.
- `docs/workflow/GATE_INVENTORY.md` — the `journal-carrier-check` row says what
  the step now decides; the budgets manifest re-pins the measured machine
  region (no emitter exists for the `documents` section).
- `docs/ROADMAP.md` + `docs/generated/units.md` — the fix row settles and the
  projection regenerates through the emitter, never by hand.
- `.changeset/675-journal-carrier-check.md` — the crate's shipped content moved,
  so the version-parity gate needs the release intent the release applies; the
  train bump stays the release's job (`D-40-14`).
- The repository's own carrier (`.agentic-workflow/journal/`) — its published
  contents carry the live pair; the change makes that state a refusal, and the
  sanctioned consumer (`journal aggregate`, run by the aggregation workflow with
  the bot identity) is the only surface allowed to clear it. See `## Known
  pre-existing issues`.

## Surfaces

- `packages/agentic-workflow`
- `docs`
- `template`
- `scripts`

## Retirements

Nothing is retired. The change is strictly additive at the grammar level: no
row, token or flag is removed, `journal aggregate`'s flags and `journal write`'s
`--session` semantics are unchanged, and the `already-present` consumption rule
keeps its byte-identity case. The one accidental rule that dies is the
aggregator's implicit "identical bytes are the only duplicate" — replaced by the
identity slot, pinned by test, and not a surface any consumer can name.

## Non-goals

- The writer's `already-registered` refusal (S5) and `log-immutability`'s
  attribution model (S8).
- Any errata/supersede *grammar* for a stale entry — that is #676's subject. This
  unit reuses the existing identity slot; it publishes no marker.
- Repairing, rewriting or deleting a published journal entry or a published
  fragment: `docs/LOGS.md` stays append-only and the lint still only reports.

## Risk tier

- **Tier** — `standard` · **Task Size** — `small`
- **Named high-risk item** — none — the unit reads and writes the same journal
  files the existing suites already own, adds no network or forge call, and its
  only side effect is the aggregator's existing consume, which runs in fixtures
  and in the sanctioned workflow.

## Future

none

## Future cost

- **The identity slot is now checked on both sides.** A future writer, driver or
  hook that lands a fragment must respect "one entry per conversation per kind",
  or the carrier lint refuses its PR. Binds: any new fragment producer.
- **A colliding pair is consumed newest-first.** A future producer that treats
  the carrier as an append-only log for one conversation must not rely on the
  aggregator appending both. Binds: `/log-session`, the mechanical shutdown
  writer, the headless run writer.

## Applicable tests

- `bun test packages/agentic-workflow/test/journal.test.mjs`
- `bun test packages/agentic-workflow/test/journal.write.test.mjs`
- `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs`
- `bun test scripts/local-gate.test.mjs` (the step's fixture carrier)
- `bun test scripts/structural-sibling-pins.test.mjs`

## Known pre-existing issues

- **The repository's own carrier holds the live pair** — `20261121T020442Z-…-01a1fbaf-…` and
  `20261121T114851Z-…-01a1fbaf-…` are two narrative fragments of one
  conversation, published on `main`. `affects` this unit: it is the S4
  reproducer, so `journal-carrier-check` now refuses it. The lint may not repair
  it (S6) and `log-immutability` may not hand-consume it (S8), so the only legal
  consumer is the aggregator run by `.github/workflows/agentic-workflow-journal.yml`
  with the bot identity — it consumes both, appends the newest, and names the
  superseded one. `## Next` carries the command and the ordering.
- **The guide's estimate ceiling was already red at the base commit** — the
  #668 integration merge (`dd5e4d37c`) unioned nine `AGENTS.md` lines after
  `estimateMax` had been pinned exactly to the measurement, so `check-skill-context
  --documents` measured 14,337 against 14,285 and `scripts/check-skill-context.test.mjs`
  failed before this unit wrote a line. `affects` the gate: repaired as a rider
  (`3a963d934`), pinning the exact measurement with its own `sources` row, no
  headroom granted (`D4`).
- **A stale sibling worktree** — `.worktrees/feat-667-review-pack-preamble-extraction`
  holds a branch already merged into `origin/main`, so `scripts/worktree-guard.mjs`
  reports `STALE` and the gate's `worktree-guard` step exits 1. `does-not-affect`
  this unit: the finding is about another session's workspace, not this branch,
  and the removal order is the owner's (`docs/workflow/WORKTREES.md`).
- **Two `local` narrative fragments on `feat/668-rendered-facts-skill-counts`** —
  same branch and kind, different conversations. `does-not-affect` this unit:
  `journal-write-grammar@1` states the shared slug "is not a conversation", and
  the lint reads that same predicate, so both stay legal and both append.

## Tasks

- P1 — Land the frozen-failure corpus alone: the live pair and the colliding-identity cases, observed red against the unchanged modules. (validator: `git show 675d383da:packages/agentic-workflow/src/journal/aggregate.mjs | rg -c "superseded"` matches 0, and the `E` line records the observed failure)
  (Implements: S4, S9)
  - Relevant files: packages/agentic-workflow/test/journal.test.mjs
- P2 — Add the cross-fragment invariant to `checkJournal` and the shared conversation predicate to `fragment.mjs`; the lint cases flip green with no byte moved. (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S2, S6, S11, S12)
  - Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs, packages/agentic-workflow/src/journal/fragment.mjs
- P3 — Decide and implement the aggregation rule (consume newest-first, name the superseded fragment in the receipt) and route the writer through the same predicate. (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 and `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0)
  (Implements: S3, S5, S9, S10)
  - Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs, packages/agentic-workflow/src/journal/write.mjs
- P4 — Ship the prose and the state: both grammar rows, the gate-inventory row, the budgets re-pin, the fix-index row and the regenerated projection. (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S13)
  - Relevant files: packages/agentic-workflow/README.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/ROADMAP.md
- P5 — Verify like a writer: the derived test-impact set, the differential against the base commit, and the gate's per-step verdict. (validator: `bun scripts/test-impact.mjs --base origin/main` prints the set, `bun scripts/local-gate.mjs` records every step's verdict)
  (Implements: S1, S13)
  - Relevant files: packages/agentic-workflow/src/journal, packages/agentic-workflow/test

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | code | `checkJournal` validates each fragment in isolation — name parse, block shape, identity — with no cross-fragment comparison in its loop | `packages/agentic-workflow/src/journal/aggregate.mjs:71-100` (read at the cut) | current | O1, O2 |
| PE-002 | code | `aggregateJournal` dedupes only on `log.includes(fragment.content)`, so a different-content duplicate is appended twice | `packages/agentic-workflow/src/journal/aggregate.mjs:169-176` | current | O3, O4 |
| PE-003 | code | The write path enforces "one entry per conversation per kind" at write time and exempts the shared `local` slug: `slug(options.session) !== "local"` | `packages/agentic-workflow/src/journal/write.mjs:196` | current | O5, O6 |
| PE-004 | published-grammar | `journal-write-grammar@1`'s `already-registered` row states the unit is the conversation **per kind** and that the shared identity `local` "is not a conversation and never fires" | `packages/agentic-workflow/README.md` (`journal-write-grammar@1`) | current | O5 |
| PE-005 | tree | The live pair exists on `main`: `20261121T020442Z-feat-600-config-default-materialization-narrative-01a1fbaf-…md` and `20261121T114851Z-…-01a1fbaf-…md` parse to one `(sessionId, kind)` with different bytes | `.agentic-workflow/journal/` (16 entries, read at the cut) | current | O1, O7 |
| PE-006 | code | `log-immutability` judges a fragment deletion/edition and a journal touch by commit identity; a non-aggregator unpublished commit is a violation, so no hand consumption is legal | `scripts/log-immutability.mjs:225-260` | current | O7, O8 |
| PE-007 | code | `writeFragment` creates with `flag: "wx"` and a name whose UTC second differs between two writers, so two concurrent writes of one identity both succeed — the read side is the only net | `packages/agentic-workflow/src/journal/fragment.mjs:266-300` | current | O9 |
| PE-008 | code | `scripts/structural-sibling-pins.test.mjs` pairs each `scripts/<name>.mjs` with its sibling `scripts/<name>.test.mjs`; this unit adds no script, so the pin has nothing new to pair | `scripts/structural-sibling-pins.test.mjs` | current | O10 |
| PE-009 | code | The `journal-carrier-check` gate step runs `journal aggregate --check` in the offline subset and is read by `scripts/local-gate.test.mjs` with a fixture carrier | `scripts/local-gate.mjs:264-272`, `scripts/local-gate.test.mjs:206-230` | current | O11 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | two conforming fragments whose parsed identity collides on `(sessionSlug, kind)` are a lint refusal naming every file in the group | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with `checkJournal refuses two fragments of one conversation+kind, naming both files` | the `E` line naming the case, its exit and the two names in the reason | verified |
| O2 | S6 | the lint moves no byte: a refused carrier keeps every fragment and the journal byte-identical | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with the builder's before/after byte comparison | the `E` line naming the case and its exit | verified |
| O3 | S3 | aggregation never appends an identity-colliding duplicate: the newest fragment is appended, the older is consumed and named in the receipt's `superseded` row (`{ name, supersededBy }`) | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with `the aggregator consumes the newest of a colliding pair and names the superseded fragment` | the `E` line naming the case, the receipt fields and the log's single copy | verified |
| O4 | S3 | the aggregation decision is deterministic from the identity and the declared newest-first sort, never from byte coincidence | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with the same case run twice producing one receipt shape | the `E` line naming both runs | verified |
| O5 | S2, PE-004 | the shared `local` slug is exempt on both sides: the lint and the writer read one predicate, so `local` fragments never collide while two conversations of one kind without `--session` stay legal | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with `checkJournal keeps the shared local identity legal` and `git diff 278dff6c..HEAD -- packages/agentic-workflow/src/journal/write.mjs` shows only the predicate call | the `E` line plus the diff receipt | verified |
| O6 | S5 | `journal write`'s `--session` semantics and its `already-registered` refusal are unchanged | P3 | P3 | execute-phase | `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with 23 pass | the `E` line with the pass count | verified |
| O7 | S4 | the suite lands red-first: the test-only commit is observed failing, the implementation commit observed green | P1 | P1 | execute-phase | `git show 675d383da:packages/agentic-workflow/src/journal/aggregate.mjs \| rg -c "superseded"` matches 0 | the `E` line naming the red commit, its exit and the green commit | verified |
| O8 | S8 | `log-immutability`'s attribution model is untouched | P4 | P4 | execute-phase | `git diff --name-only 278dff6c..HEAD -- scripts/log-immutability.mjs` matches 0 lines | the `E` line with the empty diff | verified |
| O9 | S12 | a concurrent-writer straggler (two writes, different seconds, one session+kind, both landed) is refused by the lint | P2 | P2 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with `two writes that raced past the writer's already-registered check are refused by the lint` | the `E` line naming the case and its exit | verified |
| O10 | S13, PE-008 | no new script is added, so `scripts/structural-sibling-pins.test.mjs` has nothing unpaired | P4 | P4 | execute-phase | `bun test scripts/structural-sibling-pins.test.mjs` exits 0 | the `E` line with the suite's exit | verified |
| O11 | S13, PE-009 | the gate step still fails a malformed fixture carrier with `JOURNAL REFUSAL` and moves no byte, now also on an identity collision | P5 | P5 | execute-phase | `bun test scripts/local-gate.test.mjs` exits 0 | the `E` line with the suite's exit | verified |
| O12 | S7 | no fixed vocabulary moves and the schema package is untouched | P4 | P4 | execute-phase | `git diff --name-only 278dff6c..HEAD -- packages/agentic-workflow-schema` matches 0 lines | the `E` line with the empty diff | verified |
| O13 | S1, S13 | the changed surfaces are green: the three journal suites and the drift gate pass at the implementation head | P5 | P5 | execute-phase | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 and `bun test scripts/normative-drift.test.mjs` exits 0 | the `E` line with both exits | verified |
| O14 | S13, PE-005, PE-006 | the repository's own carrier is refused by the new lint until its published pair is consumed, and only the aggregation workflow (bot identity) may consume it | P5 | P5 | owner (external verifier) | `bun scripts/local-gate.mjs` exits 0 after `gh workflow run agentic-workflow-journal.yml --ref main` lands its aggregation PR | the gate's `journal-carrier-check` verdict before and after the aggregation PR | in-progress |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-21, the owner's instruction and the issue's words, verbatim, are `## Specs` S1–S13 above (the issue body is the source; the fenced issue text is not duplicated here a second time).
- **D1** — 2026-11-21, **the aggregation rule is "consume newest-first, record the superseded fragment"**, not "refuse" (S3's second option). Authority: S3 lets the unit decide; S8 makes the aggregator the only legal consumer of a pending fragment, so a refusal would leave a published colliding pair permanently unresolvable — the repository's own carrier holds exactly that pair today (`## Known pre-existing issues`). The record is the receipt's `superseded` row, which names the dropped fragment and the fragment that superseded it, so nothing is silently lost (the dropped bytes stay in git history).
- **D2** — 2026-11-21, **the shared `local` slug is exempt from the cross-fragment invariant**, matching `journal-write-grammar@1`'s published sentence "the shared identity `local` … is not a conversation and never fires" (PE-004). Both sides read one predicate (`isConversationSession`) instead of a second copy. Rationale beyond consistency: two unflagged sessions on one branch are legitimately distinct conversations, so grouping them would drop one entry — silent loss — on the repository's own `feat/668` carrier.
- **D3** — 2026-11-21, **no vocabulary is published**: the supersede record is a CLI receipt field, not a fragment marker, so `vocabulary-residency@1` is not engaged and the schema package is untouched (S7).

- **E1** — 2026-11-21, the frozen corpus at `675d383da` (`bun test packages/agentic-workflow/test/journal.test.mjs`) · 27 pass / 8 fail · the eight red cases are the collision refusal, its CLI half, the supersede receipt, the three-fragment slot, determinism, the CLI aggregate and the shared-`local` receipt field; `git show 675d383da:packages/agentic-workflow/src/journal/aggregate.mjs | rg -c superseded` · 0.
- **P1** — 2026-11-21 19:47, the test-only commit `675d383da` (frozen corpus, observed red).
- **P2** — 2026-11-21 19:49, `checkJournal`'s cross-fragment pass and the shared conversation predicate · `10337fd9a`.
- **P3** — 2026-11-21 19:56, the aggregator's newest-wins consume and the receipt's `superseded` row · `fd9e11a26`.
- **E2** — 2026-11-21, `bun test packages/agentic-workflow/test/journal.test.mjs` · exit 0 · 35 pass / 0 fail.
- **E3** — 2026-11-21, `bun test packages/agentic-workflow/test/journal.write.test.mjs` · exit 0 · 23 pass / 0 fail (the writer's `--session` semantics and `already-registered` refusal unchanged).
- **E4** — 2026-11-21, `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` · exit 0 · 11 pass / 0 fail.
- **E5** — 2026-11-21, `bun test scripts/local-gate.test.mjs` · exit 0 · 62 pass / 0 fail (the malformed fixture carrier still exits 2 and moves no byte).
- **E6** — 2026-11-21, `bun test scripts/structural-sibling-pins.test.mjs` · exit 0 · 8 pass / 0 fail (no script added, nothing unpaired).
- **E7** — 2026-11-21, `bun test scripts/normative-drift.test.mjs` · exit 0 · 24 pass / 0 fail (both grammar blocks still resolve as declared surfaces).
- **E8** — 2026-11-21, the derived set: `bun test scripts/check-skill-context.test.mjs` · exit 0 · 1 pass; `bun test scripts/guide-split.test.mjs` · exit 0 · 17 pass; `bun test scripts/promise-coherence.test.mjs` · exit 0 · 37 pass; `bun test scripts/shared-doc-merge.test.mjs` · exit 0 · 18 pass; the two pi suites (`log-session-command`, `skill-parity`) · exit 0 · 12 and 8 pass.
- **E9** — 2026-11-21, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 7 budgeted documents`; `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` · exit 0 · `verdict: PASS`.
- **E10** — 2026-11-21, the differential against `278dff6c` in a `/tmp` archive pair (same fixtures, same commands, `journal aggregate`, `journal aggregate --check`, `journal write`, `journal name`, missing journal, empty carrier, malformed carrier) · the only differences are the asked-for ones: the collision refusal naming both files, the receipt's `superseded` field, and the superseded pair appending one entry; the writer's refusals, the `local` writes, the malformed refusals and the missing-journal refusal are byte-identical.
- **E11** — 2026-11-21, `bun scripts/test-impact.mjs --base origin/main` · verdict `targeted` · 7 suites derived from 6 executable paths and the two symbols (`SHARED_SESSION_SLUG`, `isConversationSession`); all 7 ran green (E8).
- **G1** — 2026-11-21, `bun scripts/local-gate.mjs --jobs 4 --no-bail` at HEAD 23e08ddca3aa856e75ecbb3e71736572c8213605 · exit 1 · 18 of 20 steps `exit 0` (secret-scan, temp-hygiene, tmp-gc, version-parity-content, rigidity-review, log-immutability, workspace-install, schema-build, skill-context-budgets, docs-generated-projection, dependency-advisories, dependency-pin-gate, root-suite 154s, crate-suite-bun 90s, crate-suite-node 110s, schema-node-compat, pi-compat-guard, pi-node-compat); two reds, both named in `## Known pre-existing issues` — `worktree-guard` exit 1 (stale sibling worktree) and `journal-carrier-check` exit 2 (the published pair this unit's lint now refuses).
- **D4** — 2026-11-21, rider repair `3a963d934`: the guide's `estimateMax` re-pinned 14,285 → 14,337 (the exact measured boundary, the fix #571 precedent) because the #668 integration merge left the base commit red; recorded in the manifest's `sources`, no headroom granted.
- **P4** — 2026-11-21 19:58, the grammar rows, gate inventory, changeset, roadmap row and regenerated projection · `7d4cf1219`, `8023e44e9`, `0a2726599`.
- **P5** — 2026-11-21 20:10, verification (E1–E11, G1) and the session journal fragment (`6c19318ba`, `20261121T201051Z-fix-675-journal-carrier-check-narrative-01a1ff9d-…`).
- **P6** — 2026-11-21 20:34, branch pushed at `23e08ddca` and PR [#677](https://github.com/gtrabanco/agentic-workflow/pull/677) opened against `main` (the pre-push hook's documented escape hatch, recorded in the body for the two disclosed reds; the branch's own `journal-carrier-check` is O14, and `worktree-guard` is another live session's worktree).

- **L2** — 2026-11-21, the owner's correction instruction, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff" — one correction batch on `## 2026-11-21 — full verdict`'s blockers, per the verify receipt's own correction bounds.
- **P7** — 2026-11-21 21:09, the batch's code slice: the refusal line counts the refused FILES (a colliding slot's `1` became `2`, malformed output byte-identical), the gate suite gains the colliding-slot case its invariant claims, the CLI header states the slot rule · `4ff94dee7`.
- **P8** — 2026-11-21 21:11, the unit-doc fold: ## Impact names all 17 diff paths (AC1), O10/AC13/Applicable tests re-spelled to the sanctioned runner, `ac-hash` re-pinned through `sectionText` (plan repair `cc1f99d1` → `451a78df`), Specs intro range `S2`–`S13`, receipt committed · `fbbc00cf0`.
- **P9** — 2026-11-21 21:15, the session entry through the carrier: one mechanical fragment (`20261121T211514Z-…-mechanical-01a1ff9d-…`, the narrative slot this conversation already holds) · `59de2b270`.
- **E12** — 2026-11-21, the frozen-failure corpus observed red: `bun test scripts/local-gate.test.mjs` pre-fix · exit 1 · 62 pass / 1 fail (`AssertionError: … did not match /^JOURNAL REFUSAL — 2 non-conforming fragment/` against `1 …`); the same suite against a `278dff6c` export with the new case · exit 1 · the case fails `0 !== 2` (base bin exits 0 on the slot; the export's three other failures are its missing `.git`).
- **E13** — 2026-11-21, differential in `mktemp -d` scratch (removed): `journal aggregate --check` on one malformed fixture at `278dff6c` and at head · both exit 2 · stdout+stderr byte-identical; the colliding fixture at head → `JOURNAL REFUSAL — 2 non-conforming fragment(s)` naming both files, at base → exit 0 `ok:true`.
- **E14** — 2026-11-21, blockers-only recheck: `git diff --name-only 278dff6c..HEAD` · exit 0 · 17 paths, each named in ## Impact (blocker 1); `bun test scripts/structural-sibling-pins.test.mjs` · exit 0 · 8 pass / 0 fail (blocker 2 — the row's and AC13's re-spelled validator; the direct spelling still exits 1 under pinned 1.4.4 and active canary alike).
- **E15** — 2026-11-21, the corrected E11 delta (E11 itself untouched — append-only): `bun scripts/test-impact.mjs --base origin/main` · exit 0 · verdict `targeted`, 17 changed / 8 executable / 27 derived entries; the 19 runnable `.test.mjs` suites · exit 0 · 537 pass / 0 fail; the 10 `template/.agentic-workflow/hooks/tests/*.sh` · all exit 0; `test/fixtures.mjs` and `test/fixtures/tool-choice-corpus.json` are non-suite listing entries (`bun test` refuses both: "Tests need .test in the filename") — "all 7 ran green" was never true of E11's own list; six runnable suites ran green then, 19 now.
- **E16** — 2026-11-21 at HEAD `59de2b270`: `bun test packages/agentic-workflow/test/journal.test.mjs` · exit 0 · 35 pass (the green run bound to a commit, AC4's second half); `journal.write.test.mjs` · 23 pass; `scripts/local-gate.test.mjs` · 63 pass (the new case in); `journal.surfaces.test.mjs` · 11; `bun test scripts/normative-drift.test.mjs` · 24; `bun scripts/test-obligation-tags.mjs` · PASS; `bun scripts/red-first.mjs` · PASS; `bun scripts/prose-gate-inventory.mjs` · PASS; `bun scripts/check-skill-context.mjs --documents` · PASS; `docs-generate --check` · PASS; `bun scripts/log-immutability.mjs` · PASS · 0 violations · base c012113b6 · range 3 commits.
- **G2** — 2026-11-21, `bun scripts/local-gate.mjs --jobs 4 --no-bail` at HEAD `59de2b270` · exit 1 · 18 of 20 steps `exit 0` (the full list G1 records, root-suite now including the colliding-slot case); the same two disclosed reds and no new one — `worktree-guard` exit 1 (stale sibling, advisory 1) and `journal-carrier-check` exit 2 (the published pair — open blocker 3/O14); live carrier + `docs/LOGS.md` sha256 byte-identical before/after, `git status --porcelain` empty.
- **F1** — 2026-11-21, folded from the full verdict: blockers 1-2 (`fbbc00cf0` + `4ff94dee7`, recheck E14) and advisories 2-7 (E15 appends E11's delta; AC4's green run bound by E16; A4's case in `4ff94dee7` with E12's reds; A5/A6 in `4ff94dee7` with E13's differential; A7 in `fbbc00cf0`). NOT folded: blocker 3 (O14 — post-merge owner/forge step, unchanged) and advisory 1 (the stale sibling worktree — the owner's removal order).
- **P10** — 2026-11-21, the correction batch delivered to PR [#677](https://github.com/gtrabanco/agentic-workflow/pull/677) under the pre-push hook's documented escape hatch `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` (the owner's push order; the reason is recorded in the PR body — the hook's red is the disclosed `journal-carrier-check` pair, O14, whose sanctioned clear is `## Next`'s post-merge workflow) · `4ff94dee7`…`767306017` plus this line.

## Next

Merge, then clear the repository's own carrier with the sanctioned consumer —
`gh workflow run agentic-workflow-journal.yml --ref main` — after the merge, so
the aggregation runs this unit's code: it consumes the live pair, appends the
newest entry, names the superseded fragment, and `journal-carrier-check` returns
green on `main`.

## References

- Issue [#675](https://github.com/gtrabanco/agentic-workflow/issues/675) — `Closes #675`.
- Pull request [#677](https://github.com/gtrabanco/agentic-workflow/pull/677) — the delivery carrier; its body carries the AC table, the decisions and the two disclosed gate reds.
- Companion issue [#676](https://github.com/gtrabanco/agentic-workflow/issues/676) — the write-side errata path; this unit owns only the read side and publishes no marker for it.
- Issue [#468](https://github.com/gtrabanco/agentic-workflow/issues/468) S3 — "one entry per conversation per kind", the rule this unit makes readable.
- Issue [#452](https://github.com/gtrabanco/agentic-workflow/issues/452) S3 — the carrier lint as a reporter.
- Issue [#405](https://github.com/gtrabanco/agentic-workflow/issues/405) — the fragment carrier and its merge-to-main aggregator.

## Branch

`fix/675-journal-carrier-check`

## Depends on

none — soft-related to #676, no `blocked-by` either way.

## Regression scope

| Scenario | Verification |
|---|---|
| A crash between the append and the delete re-presents a fragment; the re-run must not duplicate it | `bun test packages/agentic-workflow/test/journal.test.mjs` — `an already-present entry is consumed without being appended again` |
| Two sessions on one branch write one fragment each; both append newest-first | the same suite — the race fixture and the determinism case |
| The writer refuses a second entry of one kind for an explicit `--session`, and never changes the first entry's bytes | `bun test packages/agentic-workflow/test/journal.write.test.mjs` |
| A malformed fragment still refuses its own PR and moves no byte | `bun test scripts/local-gate.test.mjs` |
| `docs/LOGS.md`'s append-only rule and the aggregator-identity attribution are untouched | `git diff 278dff6c..HEAD -- scripts/log-immutability.mjs` is empty |
