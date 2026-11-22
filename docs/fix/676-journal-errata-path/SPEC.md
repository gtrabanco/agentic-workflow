---
type: fix
scope: medium
roadmap_summary: Issue [#676](https://github.com/gtrabanco/agentic-workflow/issues/676) (M, high): a stale journal entry now has a sanctioned errata path — `journal write --supersedes <fragment>` lands the correction as a NEW fragment whose block declares the one it corrects, the carrier lint reads a slot as one entry plus its declared chain, and the aggregator lands the correction once. Applied through the owner's local inline workflow (ledgers frozen at cut). SPEC: [SPEC](fix/676-journal-errata-path/SPEC.md)
ac-hash: PENDING
---

# fix/676-journal-errata-path

> One-line: the journal gains the door it was missing — a stale entry is
> corrected by a new fragment that names it, never by rewriting the stale bytes,
> never by a second unlinked entry.

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

`#676` — tracked issue in the project's forge. The PR closes it via
`Closes #676`. Applied through the owner's local inline workflow (the unit
folder is `docs/fix/676-journal-errata-path/`); `docs/ROADMAP.md`'s fix row for
#676 carries the triage verdict `fix-now (M)` of 2026-11-21.

## Specs

`S1` is the owner's instruction; `S2`–`S13` are the issue's own words, one
requirement per distinct ask, in the order the issue states them.

**S1 — Apply issue #676 to this repository.**
> Apply to this repository: issue #676

**S2 — The writer refuses the rewrite.**
> **Re-writing** the same conversation+kind is refused by the writer (`already registered — …another --session id is a different conversation`); a different `--session` id is by definition a *different conversation*, so the stale entry keeps no link to its correction.

**S3 — Editing or deleting the stale fragment is refused.**
> **Editing or deleting** the stale fragment (pending or published) is refused by `log-immutability` (fragment-hand-edited / fragment-hand-deleted / log-hand-appended) — correctly: the journal is aggregator-only.

**S4 — The refusal routes nowhere and the skill documents no procedure.**
> An agent with genuinely obsolete claims (push state, merge state, gate results that moved mid-unit) is boxed into either writing an unlinked correction under a fresh session id or **hand-editing** — the second happened live.

**S5 — A sanctioned errata path, decided in the unit among candidates.**
> A **sanctioned errata path**, decided in the unit among (non-exclusive) candidates:

**S6 — Supersedes semantic.**
> **(a) Supersedes semantic** — e.g. `journal write --supersedes <fragment>` writes the correcting entry and marks the superseded one, so the aggregator integrates it with the correction visible (chronology respected, byte-immutability intact). If a marker enters the fragment bytes or name, its fixed vocabulary publishes in the schema package (`vocabulary-residency@1`) and the carrier lint learns it (see the companion issue's expected-behaviour decision).

**S7 — Documented recipe.**
> **(b) Documented recipe** — write a correction entry that deterministically references the stale one (a link convention the block grammar carries), formalized in the writer's refusal text (route the message), the skill's checklist and the package README grammar.

**S8 — Lifecycle state on slots.**
> **(c) Lifecycle state on slots** — a name/byte-level status the lint and aggregator both read.

**S9 — Boundaries every option must keep.**
> Boundaries every option must keep: `docs/LOGS.md` stays append-only; published fragment bytes are never rewritten; closed vocabularies stay resident; no backward-compat shims (IR6).

**S10 — Out of scope.**
> - Relaxing S3 ("one entry per conversation per kind" stays) or `log-immutability`'s attribution model.
> - Any migration/rewrite of already-published journal bytes.
> - The lint's cross-fragment gap itself — owned by the companion issue (#675), not duplicated here.

**S11 — The scenario fixture.**
> Scenario fixture: an entry goes stale mid-unit; the sanctioned path produces a conforming carrier (`journal aggregate --check` green under both the lint's current and post-#675 rules), the aggregator integrates the correction once, and the stale entry is visibly superseded/linked machine-checkably.

**S12 — The unwritten paths still refuse.**
> The unwritten paths still refuse: hand edit, hand delete, second same-slot write — `log-immutability` and the writer unchanged.

**S13 — The skill's checklist and the budgets.**
> The skill's checklist gains the stale-entry line; `check-skill-context` budgets re-pinned if the skill grows.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(`sectionText`, heading and the next `## ` excluded). One criterion per
requirement, each naming the check that proves it.

1. **S1 — the issue is applied, not reinterpreted.** `git diff --name-only 55525abad..HEAD` lists only the paths `## Impact` names, and every `S#` above appears verbatim in this document.
2. **S2 — the writer's refusal survives and now names the door.** `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with `journal write: an explicit session already registered is refused, never duplicated` and `journal write: the already-registered refusal routes to --supersedes, naming the entry's newest fragment`.
3. **S3 — `log-immutability` is untouched.** `git diff --name-only 55525abad..HEAD -- scripts/log-immutability.mjs` matches 0 lines, `bun scripts/log-immutability.mjs` exits 0 on the range, and `bun test scripts/log-immutability.test.mjs` exits 0.
4. **S4 — the refusal routes and the skill documents the recipe.** The same write suite exits 0 with the routing case (`--supersedes <the newest fragment>` on stderr), and `skills/log-session/SKILL.md` carries the Turn-contract correction box and the stale-entry paragraph.
5. **S5 — the decision is recorded, not implied.** `decisions.md` `D1` names the chosen candidate (a+b composed), the rejected one (c) with its reason, and the authority (`S5`, `S6`, `S7`, `S8`).
6. **S6 — the supersedes semantic is implemented.** `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with `journal write --supersedes lands the correction as a new fragment declaring the stale one`, and the receipt carries `supersedes`.
7. **S7 — the recipe is documented where a caller reads it.** The same write suite exits 0 with `the declared prose states the errata path — the writer's flag, the block cell and the skill's checklist`, covering `journal-fragment-grammar@1`'s `errata` row, `journal-write-grammar@1`'s `supersedes` row, the template carrier doc and the skill.
8. **S8 — the rejected lifecycle candidate is recorded.** `decisions.md` `D1` states why the marker lives in the block (read by the lint and the aggregator) instead of a separate slot status, citing the byte-immutability boundary (`S9`).
9. **S9 — every boundary holds.** `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with the correction case's stale-bytes assertion; `bun test scripts/log-immutability.test.mjs` exits 0; and `bun test scripts/normative-drift.test.mjs` exits 0 with the marker's inventory row declared.
10. **S10 — the out-of-scope surfaces are untouched.** `git diff --name-only 55525abad..HEAD -- scripts/log-immutability.mjs` matches 0 lines, the second same-slot write without the flag still exits 2 (`S2`'s case), and no published journal byte was rewritten (`git diff 55525abad..HEAD -- docs/LOGS.md` shows appends only).
11. **S11 — the sanctioned path is a conforming carrier and one landing.** `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with `checkJournal accepts a slot that is one entry plus its declared correction`, `journal aggregate --check is green on the errata pair and moves no byte`, and `the aggregator integrates a declared correction once and names the superseded fragment`.
12. **S12 — the unwritten paths refuse.** The same suite exits 0 with `checkJournal refuses a slot whose correction names the wrong predecessor`, `checkJournal refuses a fragment that declares two corrections`, and the pre-existing `checkJournal refuses two fragments of one conversation+kind, naming both files` stays green.
13. **S13 — the skill's checklist and the budgets.** `bun scripts/check-skill-context.mjs` exits 0 (30 skills) with `log-session` inside its re-pinned ceiling, and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s `log-session` entry names this unit as the growth source.

## Impact

The change sits in the journal's write path and its read-side lint, and it
crosses one package boundary:

- `packages/agentic-workflow-schema/src/journal.ts` — publishes the marker's
  closed set (`JOURNAL_ERRATA_MARKERS`, `JournalErrataMarker`) beside the entry
  kind vocabulary; `src/index.ts` re-exports both. No entry field moves, so
  `JOURNAL_ENTRY_VERSION` and `journal-entry.schema.json` are untouched.
- `packages/agentic-workflow/src/journal/block.mjs` — the block owner renders
  the one `Supersedes` cell and reads it back (`errataLinks`, `supersedesOf`).
- `packages/agentic-workflow/src/journal/fragment.mjs` — the shared predicate
  returns the declared link and refuses a fragment naming two predecessors; the
  name/byte grammar does not move.
- `packages/agentic-workflow/src/journal/write.mjs` — `--supersedes`: the slot's
  fragments are read newest-first, the target must be that head, the write must
  be newer, and the `already registered` refusal routes to the flag by name.
- `packages/agentic-workflow/src/journal/aggregate.mjs` — the lint's
  cross-fragment pass reads the declared chain (one entry plus corrections)
  instead of counting fragments; one comparator serves the batch order and the
  chain.
- `packages/agentic-workflow/bin/agentic-workflow.mjs` — the `journal write`
  usage line and the flag pass-through.
- The three suites that pin it — `test/journal.test.mjs`,
  `test/journal.write.test.mjs`, `test/journal.surfaces.test.mjs` — and
  `scripts/local-gate.mjs` (the `log-immutability` step now reads a module that
  imports the schema package, so it declares the same edges as
  `journal-carrier-check`).
- The declared prose: `packages/agentic-workflow/README.md` (`journal-fragment-
  grammar@1`'s `errata` row and `entry-slot`/`fragment-content` cells,
  `journal-write-grammar@1`'s `supersedes` row and routed `already-registered`
  row, the `carrier-check` and `refusal` rows), `template/.agentic-workflow/
  journal.md` (the target project's carrier doc), `skills/log-session/SKILL.md`
  (the Turn-contract box and the recipe).
- The machine inventory: `AGENTS.md`'s `normative-surfaces@1` gains the
  `journal-errata-marker` row; `docs/workflow/GATE_INVENTORY.md`'s
  `journal-carrier-check` row states the chain rule;
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-pins `log-session`'s ceiling and
  the guide's `machineLines`.
- `.changeset/676-journal-errata-path.md` — the three shipped packages' release
  intent; the train bump stays the release's job (`D-40-14`).
- This unit's own carriers and `docs/LOGS.md`'s session entry.

## Surfaces

- `packages/agentic-workflow`
- `packages/agentic-workflow-schema`
- `scripts`
- `docs`
- `template`
- `skills/log-session`

## Retirements

Nothing is retired. The change is strictly additive at the grammar level: no
row, token, flag or cell is removed, `journal write`'s existing flags and
`journal aggregate`'s receipt keep their shape, and a slot with a second
*undeclared* fragment stays exactly the refusal #675 shipped. The one accidental
rule that narrows is the lint's "any two fragments of a slot" — replaced by "one
entry plus the corrections that declare it", pinned by test, and not a surface
any consumer can name.

## Non-goals

- The writer's `already-registered` rule itself (S3/S10): one entry per
  conversation per kind stays, and a second same-slot write without the flag
  still refuses.
- `log-immutability`'s attribution model (S10): a fragment edit or delete by a
  non-aggregator commit stays a violation, and this unit touches no byte of it.
- Any migration, rewrite or deletion of already-published journal bytes (S10).
- The lint's cross-fragment gap as such (S10) — #675 owns it; this unit only
  teaches the slot rule the declared link.
- An errata path for an entry already aggregated into `docs/LOGS.md`: the
  journal is append-only, so a new entry is the append it allows, and no
  fragment survives to name.

## Risk tier

Copied verbatim from `runner ceremony tier classify` over the executable paths
(`packages/agentic-workflow-schema/src/journal.ts` and the four journal modules):
`tier: standard`, `reason_kind: executable-content`, `signals: []`,
`task_size: { understood: true, contained_risk: contained, resumable_from_diff:
true }`.

- **Tier** — `standard` · **Task Size** — `medium`
- **Named high-risk item** — none — the unit reads and writes the journal files
  the existing suites already own, adds no network or forge call, and its only
  side effect is the write the caller asked for, exercised in `mktemp` fixtures.

## Future

none

## Future cost

- **A correction names its immediate predecessor.** A future producer of
  journal fragments must not land a second fragment of one slot without the
  declared link, or the carrier lint refuses its PR. Binds: `/log-session`, the
  mechanical shutdown writer, the headless run writer.
- **The marker is published, so its spelling is a contract.** A future errata
  marker is a schema-constant + block-cell + grammar-row change in one PR
  (`vocabulary-residency@1`). Binds: any producer or reader of the block.

## Applicable tests

- `bun test packages/agentic-workflow/test/journal.test.mjs`
- `bun test packages/agentic-workflow/test/journal.write.test.mjs`
- `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs`
- `bun test packages/agentic-workflow/test/journal.headless.test.mjs`
- `bun test packages/agentic-workflow/test/journal.driver.test.mjs`
- `bun test scripts/log-immutability.test.mjs`
- `bun test scripts/local-gate.test.mjs`
- `bun test scripts/session-close.test.mjs`
- `bun test scripts/normative-drift.test.mjs`
- `bun test scripts/vocabulary-parity.test.mjs`
- `bun test scripts/structural-sibling-pins.test.mjs`

## Known pre-existing issues

- **A stale sibling worktree** — a session other than this one owns another
  worktree, and `scripts/worktree-guard.mjs` reports it `STALE` when the branch
  is already merged. `does-not-affect` this unit: the finding is about another
  session's workspace, not this branch, and the removal order is the owner's
  (`docs/workflow/WORKTREES.md`).
- **`scripts/version-parity-gate.mjs --content` needed the third package in the
  changeset** — `skills/log-session/SKILL.md` is content of
  `packages/pi-agentic-workflow`, so the changeset declares all three shipped
  packages. `affects` the gate: repaired inside this unit before the first green
  run, named in `## Log`.

## Tasks

- P1 — Land the frozen-failure corpus alone: the errata cases in the writer
  suite and the carrier suite, observed red against the unchanged modules.
  (validator: `git show 8aa89f03e --stat` names only the two test files, and the
  `E` line records the observed failures)
  (Implements: S4, S6, S7, S11, S12)
  - Relevant files: packages/agentic-workflow/test/journal.test.mjs, packages/agentic-workflow/test/journal.write.test.mjs
- P2 — Publish the marker's closed set in the schema package, render and read
  the block cell, and teach the shared predicate the declared link.
  (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0)
  (Implements: S6, S9)
  - Relevant files: packages/agentic-workflow-schema/src/journal.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow/src/journal/block.mjs, packages/agentic-workflow/src/journal/fragment.mjs
- P3 — Add the writer's `--supersedes` and route the `already registered`
  refusal to it. (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with the six errata cases)
  (Implements: S2, S4, S6, S12)
  - Relevant files: packages/agentic-workflow/src/journal/write.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — Read the declared chain in the carrier lint (one entry plus its
  corrections) and keep one comparator for the batch order and the chain.
  (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S5, S8, S11, S12)
  - Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs
- P5 — Ship the prose and the state: the grammar rows, the template carrier doc,
  the skill's recipe, the machine inventory rows, the re-pinned budgets, the
  changeset and the surfaces pin. (validator: `bun scripts/check-skill-context.mjs` exits 0 and `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exits 0)
  (Implements: S7, S9, S13)
  - Relevant files: packages/agentic-workflow/README.md, template/.agentic-workflow/journal.md, skills/log-session/SKILL.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, .changeset/676-journal-errata-path.md
- P6 — Verify like a writer: the derived test-impact set, the differential
  against the base commit, the gate's per-step verdict and the session entry
  through the carrier. (validator: `bun scripts/test-impact.mjs --base origin/main` prints the set and `bun scripts/local-gate.mjs` records every step's verdict)
  (Implements: S1, S10)
  - Relevant files: packages/agentic-workflow/src/journal, packages/agentic-workflow/test

### Planning evidence

Frozen at the cut in [`planning-evidence.md`](planning-evidence.md) (M unit —
the ledger lives beside this document, never both).

### Obligations

Frozen at the cut in [`planning-obligations.md`](planning-obligations.md) (M
unit — the ledger lives beside this document, never both). Before the unit
ships, every row is `verified` or an evidenced `n/a`.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-21, the owner's instruction and the issue's words, verbatim,
  are `## Specs` S1–S13 above (the issue body is the source; it is not
  duplicated here a second time).
- **L2** — 2026-11-21, the owner's instruction that binds this document's shape,
  verbatim: "Apply to this repository: issue #676" — applied through the local,
  unpublished inline workflow: the §5 ledger freeze is the plan, the repo's
  deterministic gates are the only machinery that runs, and the diff is handed
  to the owner as the external verifier.
- **L3** — 2026-11-21, **disclosed deviation:** the ledgers in
  `planning-evidence.md` / `planning-obligations.md` were written into this
  document after the red corpus and the first code slice landed, not before the
  first line of code. The corpus (P1) was cut first as the workflow requires;
  the ledgers were then frozen against the behaviour the corpus pins and before
  the verification phase. Nothing is simulated: every row's status is the state
  of a validator that ran, and this line is the honest record of the ordering.
- **D1** — 2026-11-21, **the errata path is (a) supersedes semantic + (b)
  documented recipe, composed; (c) is rejected.** Authority: S5 lets the unit
  decide among the candidates; S6 requires that a marker entering the bytes
  publishes its vocabulary in the schema package, and the lint learn it; S7
  requires the refusal text, the skill's checklist and the package grammar to
  carry the convention. The link is one `Supersedes` cell in the correcting
  entry's block (a block-grammar convention the block owner renders and reads),
  and the writer's `--supersedes` is its only producer. (c) — a slot status in
  the name or an edit to the stale bytes — is rejected because a name-level
  status changes the identity grammar every consumer parses, while a byte-level
  status contradicts S9's "published fragment bytes are never rewritten" and
  `log-immutability`'s aggregator-only consumption. The chain is read newest
  first, so chronology is the reader's, never a guess.
- **D2** — 2026-11-21, **a slot is one entry plus the corrections that declare
  it**, not "at most two fragments". The lint accepts a chain of any length (a
  correction can itself go stale mid-unit and be corrected), refuses a
  correction that skips its immediate predecessor, and refuses an oldest
  fragment that claims to correct something — all naming every file. The
  aggregator's newest-wins consume (#675 D1) is unchanged: it lands the newest
  of the chain once and names the fragments it superseded.
- **D3** — 2026-11-21, **the marker's vocabulary publishes in the schema
  package** (`JOURNAL_ERRATA_MARKERS` in `src/journal.ts`, declared by the
  guide's `journal-errata-marker` inventory row) because the cell's spelling is
  read by three consumers — the writer, the carrier lint and the aggregator — and
  `vocabulary-residency@1` forbids a second copy. The cell is not a
  `journal-entry@1` field: the canonical entry's core stays closed, its
  `metadata` map stays open, and `JOURNAL_ENTRY_VERSION` does not move.
- **D4** — 2026-11-21, **the errata path is carrier-scoped.** `--supersedes`
  names a fragment still in the carrier; an entry already aggregated into
  `docs/LOGS.md` is a published journal byte, so its correction is a new append
  (the journal's own rule) and the writer's normal path already allows it. This
  is the scope S10 keeps: nothing published is rewritten.
- **E1** — 2026-11-21, the frozen corpus at `8aa89f03e` · `bun test
  packages/agentic-workflow/test/journal.test.mjs` · 36 pass / 4 fail · and
  `bun test packages/agentic-workflow/test/journal.write.test.mjs` · 23 pass / 7
  fail — the eleven red cases are the correction's landing, its routing refusal,
  its three refusals (foreign target, no session, older second), the mechanical
  refusal, the prose pin, the chain acceptance, the broken chain, the two-cell
  ambiguity and the CLI's green half.
- **E2** — 2026-11-21, the corpus' ordering case was corrected before the green
  commit: with the pinned second equal to the stale fragment's, the computed name
  is the stale one's, so the case exercised the *collision* rule, not the
  ordering rule. The fixture now writes one second earlier; the case stays red at
  `8aa89f03e` for the intended reason (no `--supersedes` flag exists there) and
  the assertion is unchanged.
- **P1** — 2026-11-21 21:12, the test-only commit `8aa89f03e` (frozen corpus,
  observed red).
- **P2** — 2026-11-21 21:31, the marker's vocabulary, the block cell and the
  shared predicate · (this commit's slice, see the commit list in `## Next`).
- **P3** — 2026-11-21 21:31, the writer's `--supersedes` and the routed refusal.
- **P4** — 2026-11-21 21:31, the lint's declared chain and the one comparator.
- **P5** — 2026-11-21 21:31, the prose, the inventory rows, the re-pinned
  budgets and the changeset.

## Next

Hand the diff to the owner — the external verifier — with `## Obligations`
closed and the verification block recorded.
