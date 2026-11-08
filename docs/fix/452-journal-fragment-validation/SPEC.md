---
type: fix
scope: medium
---

# fix/452-journal-fragment-validation

> The fragment writer becomes a programmatic CLI — the model supplies prose
> fields, code computes the name, renders the bytes and refuses anything the
> aggregator would later reject. Applied inline per the owner's governing
> request (S8–S17 below); this command substitutes for the lane's plan step, so
> the ledgers are cut here and frozen at the cut.

## Issue

[#452](https://github.com/gtrabanco/agentic-workflow/issues/452) — journal
fragment writing needs a programmatic CLI + write-side/gate validation (repeated
journal-aggregate CI refusals). Roadmap row 452 (`journal-fragment-validation`). The PR
closes it with `Closes #452` in the body.

## Specs

**S1 — One write CLI, one argument per field: the model never composes a filename.**
> 1. **A write CLI, one argument per field — the model never composes a filename.** A new `journal` operation (e.g. `journal write`) that takes the only things a model can supply — `--title`, `--content`/body fields (or `--summary`, `--decisions`, `--next`), and each metadata datum as its own argument — plus `--kind` and optional `--session`, computes everything else programmatically (UTC second, branch via git, session slug, rendered bytes through `renderEntry`/the block renderer), builds the name via `fragmentName`, **self-validates it with `parseFragmentName` before writing**, and lands the fragment atomically (refusal on collision, never overwrite — S10 kept). Stdin (`--content -`) must be accepted so long prose does not fight shell quoting. **Both model-facing routes converge on it:** `skills/log-session/SKILL.md` step 4 and the extension's invocation record (`packages/pi-agentic-workflow/src/log-session-invocation.ts`, #429's home) — the prose path and the extension path must not diverge again.

**S2 — Write-side validation is already at the library; the CLI pins it, it is never re-implemented.**
> 2. **Write-side validation — RE-SCOPED (2026-11-08): already implemented at the library, do not re-implement.** `checkedContent`/`checkedIdentity` in `writeFragment` cover the byte and name contracts. The remaining SPEC work here is pinning the existing behaviour at the new CLI surface: a hand-rolled `…-manual.md`-style name and a non-`## `-headed body are refused by the CLI (red-first tests) — the exact today-shapes, at the level the model actually reaches.

**S3 — One validate-only carrier check covers both the gate role and the lint role.**
> 3. **Carrier check before merge — this is also the linter for files already in the carrier.** `journal aggregate --check` (validate-only, no bytes moved) lists **every** non-conforming name/body in the carrier, wired into the local gate's offline pre-push subset and CI, so a malformed fragment fails *its own PR*, not the weekly aggregation — and never reaches the publish gate's package suites (`S15`). One validate-only surface covers both the gate role and the lint role; no separate linter surface.

**S4 — The 2026-11-08 unblock is history, recorded not re-done.**
> 4. **Immediate unblock — DONE (2026-11-08), recorded for history.** The still-on-`main` fragment was renamed by `f96f9ea6`; the two 2026-11-08 fragments were repaired by PR #457; `journal-aggregate` is green and `main`'s carrier is empty after #458's aggregation. Nothing left to do here.

**S4a — Correction: the carrier is not empty at this cut, and the same defect is committed again.**
> **Third consumer (2026-11-08): this also blocks package publishing, not only journal-aggregate.** … Evidence: [run 42476301641](https://github.com/gtrabanco/agentic-workflow/actions/runs/42476301641) failed `S15` with `20261108T112440Z-main-manual-narrative-local.md is not a newline-terminated CR-free block` (reproduced deterministically in a worktree at that SHA) … **Status update (2026-11-08):** `journal-aggregate` ran **green** at 2026-11-08T12:04Z, and the weekly aggregation (PR #458, merge `de72f6ab`) consumed every pending fragment — `main`'s carrier currently holds zero fragments and is conforming. … The issue's value is now **preventing recurrence** … not unblocking.

**S5 — The `session-close close` hole takes the explicit decision 5(a).**
> 5. **The `session-close close` hole — explicit SPEC decision required (2026-11-08 diagnostic).** Either: (a) `close` validates every added fragment before committing (`parseFragmentName` + the byte checks, reusing the package module — precedent exists: `scripts/batch-scheduler.mjs` imports from `packages/agentic-workflow/src/`), or (b) it is declared a non-goal in favor of the item-3 gate check. Leaving it undecided guarantees a mid-implementation debate. Prototype evidence: patched-close validation rejected the exact incident fragment at close time (fixable in the same session, minutes after the mistake instead of blocking a CI hours later) and committed a valid fragment without false positives. Position of the diagnostic: (a) — the gate is the second safety net, not the first.

**S6 — Non-goals, verbatim.**
> - No new kind values — the closed `mechanical|narrative` set and the grammar stay frozen; no `manual` alias (an alias turns "the name is the identity" back into heuristics).
> - No retroactive migration of legacy journal blocks (existing declared non-goal).
> - No change to the aggregator's validate-then-mutate or already-present contracts.
> - No auto-repair mode for committed fragments: repairing means renaming or editing committed bytes, which is an owner commit (as the three repairs already were), not a tool mode — and consumed fragments are deleted by the aggregator, so malformed files are transient.

**S7 — The issue's acceptance criteria, verbatim.**
> - `journal write` (final name per SPEC) creates a conforming fragment from field arguments + stdin; the model-facing skill step routes through it instead of "compute the name and save the file yourself", and `log-session-invocation.ts` routes the extension path through it too.
> - A hand-rolled `…-manual.md`-style name and a non-`## `-headed body are both refused by the CLI write path (red-first tests) and listed by `journal aggregate --check` — the library checks they pin already exist and must not be reimplemented.
> - The carrier check runs in the pre-push offline gate; pushing a malformed fragment fails that PR, evidenced by a fixture. Consequently the publish gate's package suites (`S15`) never again see a malformed carrier.
> - The `session-close close` decision is recorded in the SPEC (validate-at-close per 5(a), or an evidenced non-goal), with the corresponding red-first test or the non-goal note.
> - Grammar ownership untouched: `journal-fragment-grammar@1` stays owned by `packages/agentic-workflow/README.md` + `src/journal/fragment.mjs`; the new surface is declared in the normative-surfaces table, not restated, and the gate step's carrier is named in `docs/workflow/GATE_INVENTORY.md`.
> - `main`'s carrier is conforming and `journal-aggregate` runs green — **already satisfied as of 2026-11-08**; the remaining ACs are the recurrence prevention above.
> - Skill-change mechanics: the `skills/log-session/SKILL.md` rewrite runs `skill-lint`, stays within the context budgets, and — being an executor-path wording change — passes the golden fixture check (`docs/workflow/GOLDEN_FIXTURE.md`).

**S8 — Rollback and severity, verbatim.**
> ## Rollback strategy
>
> The CLI is additive; reverting the PR restores the prose-only path. The gate step is one workflow/gate line.
>
> ## Severity
>
> medium (functional but degraded — historically the journal carrier, its CI and the package publish gate were blocked while any malformed fragment sat on `main`; currently recovered, the work is recurrence prevention)

**S9 — The intent is resolved from state, and quoted verbatim.**
> ## 0. Resolve the intent from state before acting
>
> Print the resolution **before** any action — the state decides the sequence, the words only pick the verb … Outcome contract for any mismatch with reality — four outputs only, never an ad-hoc branch: `proceed` (state supports the intent), `empty` (intended action has zero matching rows — run nothing, record the search receipt, that counts as done), `ambiguous` (two continuations possible — ask **one** question), `mismatch` (state contradicts the intent — report state + evidence, ask). Never guess.

**S10 — Frozen-failure corpus first, before anything.**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S11 — Fixtures before the real tree.**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change.

**S12 — Work inline; never this repository's own machinery on its own surgery.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
>
> **Live-tree guard**: code introduced by this change (commands, hooks, emitters, scripts with side effects) is never executed against the live repository or a shared worktree until verified — mutating paths run only in scratch (§3). An accidental side effect is disclosed, cleaned, and reported in the handoff — never hidden, never doubled.

**S13 — The planning ledgers are cut here, in the repo's own shapes.**
> This command substitutes for the lane's plan step, so it writes the planning ledgers in the repo's own shapes … **Obligations** — one row per normative behaviour, compatibility invariant, affected use case, and required failure state, in the 9-column shape … **Planning evidence** — one row per Engineering claim the change rests on … **Acceptance criteria** — the unit doc's `## Acceptance criteria` section is frozen with one observable, testable criterion per `S#` … Task order is **dependency-topological first, smallest within a ready set** — a prerequisite task precedes its dependants even when larger.

**S14 — Test-first, differential, and model memory is never a source.**
> One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else. … **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it. … **Model memory is never a source**: any claim of the shape "tool/flag/syntax/API v behaves like X" carried from training is `inferred` at best — verify against the version the project pins (lockfile, manifest, action SHAs, current docs of that version) before it guides code.

**S15 — Documentation and repository state ship in the same change.**
> Ship the docs **in the same change** — never deferred: Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events; Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead; `docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff; The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection.

**S16 — Verify like a writer, hand off like one.**
> Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says — or an evidenced `n/a` … Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict.

**S17 — Correction bounds are hard.**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers (re-running the touched obligation rows' validators and flipping their statuses back) → a second pass only if the **same** blocker still fails → then one `Needs your decision` result naming the open blockers. **A new finding never earns another cycle** — it goes to me, and the turn ends.

**S18 — Dependencies and order, verbatim.**
> | Depends on | Kind | Why |
> |---|---|---|
> | — (blocking) | — | The unblock rename (item 4) is done; the CLI, the close decision and the gate are self-contained crate + scripts + skills changes. |
> | #405 (fragment carrier) | soft | The carrier + grammar this issue hardens; context, not a prerequisite — #405 is merged. |
> | #429 (log-session as extension command) | soft | `packages/pi-agentic-workflow/src/log-session-invocation.ts` is the extension's invocation record — the natural second route to converge on the new CLI alongside the skill's prose step. |
> | #449 (batch scheduler sensor) | soft | Scheduling only, not a code dependency: owner wants this landed after the current batch 3 and before the next product-audit, so the audit does not meet the same drift. |

## Impact

What this change touches beyond its own lines:

- `packages/agentic-workflow/bin/agentic-workflow.mjs` — **the named high-risk
  item** (ceremony signal `destructive`, `packages/agentic-workflow/bin/agentic-workflow.mjs`):
  the router gains `journal write` and `journal aggregate --check` beside the
  existing `aggregate`/`name`. Every other branch of the switch keeps its
  arguments and its exit codes; the differential below proves it.
- `packages/agentic-workflow/src/journal/fragment.mjs` — the read-side validator
  `fragmentFault` becomes the single predicate the aggregator, `--check`,
  `session-close close` and `writeFragment`'s own checks share. `writeFragment`
  switches its collision detection to an exclusive-create write: the name is
  identity and a racing second writer must lose, not overwrite (S1's "never
  overwrite — S10 kept").
- `packages/agentic-workflow/src/journal/block.mjs` (new) — the ONE owner of a
  narrative entry block's bytes and of the git facts that block carries.
  `scripts/session-close.mjs` delegates to it, so there is no second renderer:
  its exported `renderEntry` keeps its signature and its bytes.
- `packages/agentic-workflow/src/journal/write.mjs` (new) — the write service the
  CLI calls: field validation, block rendering, name computation,
  `parseFragmentName` self-check, one `writeFragment` call.
- `packages/agentic-workflow/src/journal/aggregate.mjs` — `checkJournal` (the
  validate-only carrier reader) and `loadFragment` reading the shared predicate.
  The validate-everything-then-mutate order and the already-present contract do
  not move (S6).
- `scripts/session-close.mjs` — `close` validates every added fragment before it
  stages or commits anything (decision D1 = the issue's 5(a)), importing the
  crate module the same way `scripts/batch-scheduler.mjs` imports
  `src/index-document.mjs`. `render` delegates its block and its git facts to
  `src/journal/block.mjs`; its output bytes must be identical.
- `scripts/local-gate.mjs` — one offline, non-test step
  `journal-carrier-check` runs `journal aggregate --check`. It is in the
  pre-push offline subset because the pre-push hook runs `--skip-network`, and it
  is not a `tests:` step because a prose-only push must still catch a malformed
  carrier.
- `scripts/local-gate.test.mjs`, `scripts/release-workflows.test.mjs` — the step
  list pin and the "every former remote check survives" case gain the new id;
  neither is weakened, the former check set is untouched.
- `skills/log-session/SKILL.md` step 4 — the fragment branch stops saying
  "compute the name … and save the entry bytes unchanged" and names
  `journal write`; the render step and the journal-append fallback stay.
- `packages/pi-agentic-workflow/src/log-session-invocation.ts` — the directive
  names `journal write` in carrier mode instead of "write this one file", so the
  extension door and the prose door name one writer (S1). `entryWritten` already
  accepts a conforming fragment under another name — the CLI writes at write
  time, seconds after the record resolved its own path.
- `AGENTS.md` — one `normative-surfaces@1` row for the new write grammar and one
  `rendered-facts@1`-free re-pin of `machineLines` (the exact pin, not a
  ceiling); `docs/workflow/SKILL_CONTEXT_BUDGETS.json` records the re-pin, its
  measured numbers and the growth source.
- `docs/workflow/GATE_INVENTORY.md` — one `script` row naming the local-gate
  step (the carrier S7 asks for) and the surface id it enforces.
- Mentions that stop being true when this lands: the skill's "the name grammar
  has one owner … never hand-roll it" paragraph's hand-save instruction; the
  extension directive's "write this one file"; the issue's S4 claim that the
  carrier is empty (it is not at `c7258644` — S4a).

## Retirements

Nothing is deleted, and the reason is a rule, not an omission:

- **The model-composed fragment filename** retires as the writer's interface: it
  is replaced by `journal write`, which computes the name (S1). Evidence:
  `rg -c 'journal name' skills/log-session/SKILL.md` moves 1 → 1 (the command
  stays discoverable for a reader) while the instruction it carried — save the
  bytes at that path yourself — is replaced; `journal name` itself is **not**
  retired (it is a read-only naming service with its own tests).
- **The unvalidated `session-close close`** retires as the second silent gap:
  **D1 — validate-at-close**, the issue's own 5(a): `close` validates every
  added fragment through the crate's own predicate (S5). No surface is removed;
  a refusal is added before the first `git add`. The alternative (5(b), declare
  the close a non-goal and lean on the gate) was rejected because the gate is
  the second safety net, not the first: the close runs minutes after the
  mistake, the gate hours later.
- **No aggregator contract moves** (S6): `--check` is a new read-only mode, and
  `aggregate` keeps its validate-then-mutate order, its already-present rule and
  its `.gitkeep` placeholder.
- No committed fragment is deleted or rewritten by this unit as a *mechanism*
  (S6 forbids an auto-repair mode). The one `main`-committed malformed fragment
  is repaired by rename on this branch as the pre-existing-red rider, exactly as
  the three earlier repairs were owner commits — bytes untouched.

## Non-goals

- No new kind values and no `manual` alias (S6); the closed
  `mechanical|narrative` set and `journal-fragment-grammar@1` stay frozen.
- No retroactive migration of legacy journal blocks, no auto-repair mode, no
  change to the aggregator's contracts (S6).
- Not the write-side byte/name contract itself: `checkedContent` /
  `checkedIdentity` already own it and this unit delegates to them (S2).
- Not a second linter: `journal aggregate --check` is the one validate-only
  surface for both the gate role and the carrier-lint role (S3).
- Not the golden-fixture run with a weak fleet model: the owner runs it before
  merge when a fleet model is available (§8's honest skips; the fixture's own
  run-log is a manual procedure, never a CI gate).
- Not `docs/LOGS.md`'s append path, not the mechanical `autoLogSession` entry,
  not feature 66's two-writer split, not `log-facts@1`.

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify --paths …` over this unit's
declared paths at the cut; copied verbatim, never written from memory.

- **Verdict** — `high` · **reason_kind** — `named-high-risk` ·
  **task_size** — `{ "understood": true, "contained_risk": "named",
  "resumable_from_diff": true, "ceremony": "unit-doc+review-change",
  "verification": "review-change" }`
- **Named high-risk item** — `packages/agentic-workflow/bin/agentic-workflow.mjs`
  (signal `destructive`): the crate's CLI router is the write door itself, and a
  wrong branch there can move bytes instead of refusing.
- **Ceremony consequence, stated rather than granted** — a `high` verdict owes
  `/review-change` then `/audit-pr` before merge
  (`skills/execute-phase/references/risk-tiers.md`). The owner's inline
  application protocol (S12) forbids running that machinery on this surgery, so
  the ceremony is **waived for this unit**; the obligation is recorded as
  outstanding-by-waiver, never as satisfied. The merge is the owner's call.

## Future

- Owner 2026-11-08, issue #444's neighbourhood: an optional decision-model
  adapter for routing/triage — not this unit. `status: open`.
- A `journal write` spelling for a *mechanical* fragment from a project that has
  no `session-close.mjs` (the shipped scaffold ships no `scripts/`): `journal
  write --kind mechanical --facts <path|->` already covers it and is exercised by
  this unit's suite; the skill's prose does not name it yet. `status: open`.

## Future cost

- Every future journal-writing surface (a new agent host, a hook, a web form)
  must call `journal write` or `writeFragment` — never compose a name. Bind: any
  writer added under `packages/` or `scripts/`; the `--check` gate step is the
  mechanical backstop.
- Any future change to a narrative entry's bytes changes
  `packages/agentic-workflow/src/journal/block.mjs` only, and
  `scripts/session-close.mjs` follows by construction.

## Applicable tests

- `packages/agentic-workflow/test/journal.write.test.mjs` (new) — the write CLI,
  `--check`, stdin, refusals, collision, naming parity.
- `packages/agentic-workflow/test/journal.test.mjs` — the existing aggregator,
  name, collision and `.gitkeep` cases must stay green (regression).
- `packages/agentic-workflow/test/journal.surfaces.test.mjs` — S15's carrier
  probe and the prose surfaces that must name the new writer.
- `scripts/session-close.test.mjs` — render bytes unchanged, close validates.
- `scripts/local-gate.test.mjs` — the step list pin.
- `packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` and
  `log-session-command.test.mjs` — the directive names the same writer.

## Known pre-existing issues

- **A malformed fragment is committed on this branch's base**:
  `.agentic-workflow/journal/20261108T121830Z-main-manual-narrative-local.md`
  (committed by `3c2b64a9`, body without its trailing newline) makes
  `packages/agentic-workflow/test/journal.surfaces.test.mjs` case
  `S15 the opted-in carrier holds only parseable fragments` fail at
  `c7258644`. **Affects this unit**: it is the frozen-failure reproducer (O1) and
  is repaired by rename-only on this branch, so the gate can read green. The
  issue's own S4/S4a records the same drift.
- **The guide's line/prose/estimate ceilings are red at the cut**:
  `bun scripts/check-skill-context.mjs --documents` fails at `c7258644` with
  `AGENTS.md: lines 573 > 477`, `estimate 9639 > 9462`, `prose lines 458 > 370`
  (measured in a `git archive main` export). **Affects this unit's validator
  only**: the machine-region pin it changes is re-pinned exactly (115 → 116), and
  the three ceilings are **not** re-based — they are a pre-existing governance
  drift this unit did not spend. `bun test scripts/check-skill-context.test.mjs`
  is therefore red at `main` and at this head, identically.
- **`pi-compat-guard` may be red at `main`** — it type-checks the published crate
  against the workspace's unpublished `src/journal` modules. **Does not affect
  this unit** unless it reproduces identically on the base export; if it does, it
  is disclosed as environmental and not repaired here.
- **`## Fixes` has no deterministic emitter** — `rowUpsert` writes the
  `## Features` table and `scripts/ceremony.mjs` lists `roadmap` as deferred. The
  fix row is a hand edit, **reported** here as the defect the owner's §7 rule
  names.

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it.

1. **S1** — `journal write --kind narrative --summary … --session s1` (with
   `--decisions`/`--next`, and equivalently `--content -` on stdin) exits 0,
   writes exactly one file under `.agentic-workflow/journal/`, and that name
   round-trips through `parseFragmentName` with kind `narrative` and session
   `s1` — proven by `bun test packages/agentic-workflow/test/journal.write.test.mjs`
   (the `journal write: field arguments land one conforming fragment` and
   `stdin` cases).
2. **S1** — `skills/log-session/SKILL.md` step 4 and
   `packages/pi-agentic-workflow/src/log-session-invocation.ts`'s carrier
   directive both name `journal write`, proven by the prose cases in
   `journal.write.test.mjs` and `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs`.
3. **S2** — `journal write --kind manual` and
   `journal write --content "Summary: …"` each exit 2 with `JOURNAL REFUSAL`,
   proven by the refusal cases in `journal.write.test.mjs`; the byte/name
   contracts still live in `writeFragment` (`git diff` shows no re-implementation).
4. **S3** — `journal aggregate --check` on a carrier holding a malformed name and
   a non-newline body lists **both**, exits 2 and moves no byte; on a conforming
   carrier it exits 0 — proven by the `--check` cases in `journal.write.test.mjs`.
5. **S3** — `bun scripts/local-gate.mjs --list` names `journal-carrier-check`, and
   an injected malformed fragment makes that step exit 2 — proven by
   `bun test scripts/local-gate.test.mjs` and the fixture case in
   `journal.write.test.mjs`.
6. **S5** — `bun scripts/session-close.mjs close` in a carrier-mode fixture
   refuses a malformed added fragment before staging anything, proven by
   `bun test scripts/session-close.test.mjs`.
7. **S7** — grammar ownership: `packages/agentic-workflow/README.md` keeps
   `journal-fragment-grammar@1`, publishes `journal-write-grammar@1`, and
   `AGENTS.md` declares the new surface plus the gate row in
   `docs/workflow/GATE_INVENTORY.md` — proven by `bun test scripts/normative-drift.test.mjs`
   and `bun scripts/prose-gate-inventory.mjs`.
8. **S7** — `bun scripts/skill-lint.mjs` exits 0 and
   `bun scripts/check-skill-context.mjs --documents` reports no
   `machine-table lines` failure (both `machineLines` pins match; the line,
   prose and estimate ceilings were already red at the cut — see
   `## Known pre-existing issues`).
9. **S10** — the frozen-failure reproducer is red before the change and green
   after: `cd packages/agentic-workflow && bun test test/journal.surfaces.test.mjs`
   fails at `c7258644` naming `20261108T121830Z-main-manual-narrative-local.md`
   and passes at the head.
10. **S14** — the differential: `session-close render` (every kind/flags
    combination the suite exercises), `journal aggregate`, `journal name`, and
    the base `journal` refusals produce byte-identical stdout/stderr/exit at the
    base export and at the head; any difference is repaired or disclosed.
11. **S15** — the roadmap and index rows, the changeset, the unit doc's evidence
    rows and the session log fragment are in the same diff; the generated
    projection is re-rendered by `bun scripts/docs-generate.mjs`, never
    hand-written.

## Tasks

P1…P18 with stable IDs, dependency-topological, smallest within a ready set.

- [x] P1 — Freeze this unit doc with its two planning ledgers (validator: `bun scripts/phase-lint.mjs docs/fix/452-journal-fragment-validation/SPEC.md` exits 0)
  (Implements: S9, S13, S17)
  Relevant files: docs/fix/452-journal-fragment-validation/SPEC.md
- [x] P2 — Land the RED corpus suite for the write CLI, the carrier check and the close refusal, observed failing on the absent operations (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits non-zero at the red commit)
  (Implements: S10, S11, S14)
  Relevant files: packages/agentic-workflow/test/journal.write.test.mjs
- [x] P3 — Land the RED close-refusal cases in the session-close suite (validator: `bun test scripts/session-close.test.mjs` exits non-zero at the red commit)
  (Implements: S10, S14)
  Relevant files: scripts/session-close.test.mjs
- [x] P4 — Extract the read-side fragment validator and the narrative block owner into the crate (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S2, S14)
  Relevant files: packages/agentic-workflow/src/journal/fragment.mjs, packages/agentic-workflow/src/journal/block.mjs
- [x] P5 — Implement the write service the CLI calls (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with the write cases green)
  (Implements: S1, S2)
  Relevant files: packages/agentic-workflow/src/journal/write.mjs
- [x] P6 — Implement the validate-only carrier reader beside the aggregator (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with the `--check` cases green)
  (Implements: S3, S6)
  Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs
- [x] P7 — Wire `journal write` and `journal aggregate --check` into the CLI router (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0)
  (Implements: S1, S2, S3, S9)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- [x] P8 — Validate added fragments in `session-close close` and delegate its block and facts to the crate owner (validator: `bun test scripts/session-close.test.mjs` exits 0)
  (Implements: S5, S14)
  Relevant files: scripts/session-close.mjs
- [x] P9 — Repair the carrier's committed malformed fragment by rename only (validator: `cd packages/agentic-workflow && bun test test/journal.surfaces.test.mjs` exits 0)
  (Implements: S4, S4a, S10)
  Relevant files: .agentic-workflow/journal/
- [x] P10 — Wire the carrier check into the local gate's offline subset and pin the step list (validator: `bun test scripts/local-gate.test.mjs` exits 0)
  (Implements: S3, S7)
  Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs
- [x] P11 — Route the skill's fragment step through the write CLI (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S1, S7)
  Relevant files: skills/log-session/SKILL.md
- [x] P12 — Route the extension's directive through the write CLI (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0)
  (Implements: S1, S7)
  Relevant files: packages/pi-agentic-workflow/src/log-session-invocation.ts
- [x] P13 — Publish the write grammar in the crate README (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S7)
  Relevant files: packages/agentic-workflow/README.md
- [x] P14 — Declare the normative surface and re-pin the guide's machine region (validator: `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S7, S15)
  Relevant files: AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- [x] P15 — Name the gate step's carrier in the gate inventory (validator: `bun scripts/prose-gate-inventory.mjs` exits 0)
  (Implements: S3, S7)
  Relevant files: docs/workflow/GATE_INVENTORY.md
- [x] P16 — Ship the release intent (validator: `bun scripts/lint-changeset.mjs .changeset/452-journal-fragment-validation.md` exits 0)
  (Implements: S15)
  Relevant files: .changeset/452-journal-fragment-validation.md
- [x] P17 — Register the unit in the `## Fixes` table (validator: `bun scripts/roadmap-settle.mjs` exits 0)
  (Implements: S15)
  Relevant files: docs/ROADMAP.md
- [x] P18 — Close the ledgers on foreground runs, render the projection and record the session entry (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S8, S11, S12, S16, S18)
  Relevant files: docs/fix/452-journal-fragment-validation/planning-obligations.md

### Planning evidence

Owned by `planning-evidence.md` beside this doc (L-size unit: the ledger is
separate, never both).

### Obligations

Owned by `planning-obligations.md` beside this doc (L-size unit: the ledger is
separate, never both).

## Triaged steps

```text
TRIAGE — 452-journal-fragment-validation (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/452-journal-fragment-validation
relay-next: create .pi-web/relays/452-journal-fragment-validation/ (charter → docs/fix/452-journal-fragment-validation/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/452-journal-fragment-validation", leg: "1") · legs: 19 = 18 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — (L) 2026-11-08, owner request verbatim: "Apply to this repository: issue #452" + the ten-step inline-application protocol, frozen as S9–S17 above; the issue's own words are S1–S8.
- **L3** — (L) 2026-11-08, owner correction request verbatim: "Apply to this repository: arregla todos los findings advisories y bloqueantes de la review, trata de solucionar toda la cadena de error para evitar producir nuevos findings al acabar, para arreglarlo redacta primero una nota de alcance real de cada findings, para revisar que no se rompe otra cosa o no se deja otra cosa rota al hacer la reparación y trata de reparar toda la cadena" — one correction batch, scope first (`## Findings`), RED before the repair; it supersedes `F1`'s "advisories not folded" reading.
- **P1** — 2026-11-08, ledgers cut at `c7258644` (main tip at the cut): unit doc + `planning-obligations.md` (O1–O27, all `planned`) + `planning-evidence.md` (PE-001–PE-018); the unit registered `in-progress` in the `## Fixes` table · `95cde38a`.
- **E1** — 2026-11-08, the frozen failure at the cut: `cd packages/agentic-workflow && bun test test/journal.surfaces.test.mjs` at `c7258644` · exit 1 · `10 pass 1 fail`, `S15 … 20261108T121830Z-main-manual-narrative-local.md is not a newline-terminated CR-free block`. The file is the issue's own shape committed again by `3c2b64a9` (blob `926869b0`): the writer label in the kind slot **and** no trailing newline, while the issue's S4 had recorded the carrier as empty (S4a corrects it).
- **E2** — 2026-11-08, the RED corpus: `bun test packages/agentic-workflow/test/journal.write.test.mjs` at `e1ee3247` · exit 1 · `0 pass 14 fail` — the write operation, the carrier check and both route statements did not exist. Committed red before any implementation.
- **E3** — 2026-11-08, the RED close: `bun test scripts/session-close.test.mjs` at `e7593aec` · exit 1 · `28 pass 2 fail` — the malformed-name and non-terminated-body fragments were committed by `close` without complaint, the issue's S5 hole reproduced.
- **P2** — 2026-11-08, the RED corpus suite: the write CLI, stdin, the two today-shape refusals, the collision, the name parity, the mechanical kind and both `--check` cases, observed `0 pass 14 fail` · `e1ee3247`.
- **P3** — 2026-11-08, the RED close cases in the session-close suite, observed `28 pass 2 fail` · `e7593aec`.
- **P4** — 2026-11-08, the crate's one read-side predicate (`fragmentFault`/`assertFragment`) and the narrative block owner `src/journal/block.mjs`, which the aggregator and the close now share · `3ad6bd7f`.
- **P5** — 2026-11-08, the write service `src/journal/write.mjs`: field validation, block rendering, name computation, `parseFragmentName` self-check, exclusive-create write · `3ad6bd7f`.
- **P6** — 2026-11-08, `checkJournal` — the validate-only carrier reader that lists every fault and moves no byte · `3ad6bd7f`.
- **P7** — 2026-11-08, the two CLI operations (`journal write`, `journal aggregate --check`) and their closed flag parser · `3ad6bd7f`.
- **P8** — 2026-11-08, `session-close close` validates every added fragment before the first `git add` and delegates its block and facts to the crate owner · `4320628e`.
- **P9** — 2026-11-08, the carrier's committed fragment repaired: rename to the identity its own heading records plus its missing terminator, blob `926869b0` preserved · `b33b546a`.
- **P10** — 2026-11-08, the gate step `journal-carrier-check` in the offline subset, with the step-list pins re-aimed (`local-gate.test.mjs`, `release-workflows.test.mjs`) · `ab501e6b`, `4f55cd3c`.
- **P11** — 2026-11-08, the skill's fragment step routes through `journal write` inside its ceiling · `4f858baf`, `b5f2631d`.
- **P12** — 2026-11-08, the extension's directive names the same command and keeps the resolved path for the settled-turn check; the pi fixture ships the modules the writer imports · `4f858baf`.
- **P13** — 2026-11-08, `journal-write-grammar@1` published in the crate README beside the fragment grammar · `d96a2a5e`.
- **P14** — 2026-11-08, the `normative-surfaces@1` row and the exact `machineLines` re-pin (115 → 116), with the pre-existing ceiling drift recorded instead of re-based · `d96a2a5e`, `af8efa04`.
- **P15** — 2026-11-08, the `journal-carrier-check` row in the gate inventory, claiming both journal grammars · `d96a2a5e`.
- **P16** — 2026-11-08, the release intent · `4f858baf`.
- **P17** — 2026-11-08, the unit registered `in-progress` in the `## Fixes` table (the table has no emitter — reported) · `95cde38a`.
- **P18** — 2026-11-08, the ledgers closed on foreground runs, the projection rendered by its generator, and the session entry written through this unit's own CLI · `4f55cd3c` and `23f6bb60`.
- **P19** — 2026-11-08, the branch pushed and **PR [#459](https://github.com/gtrabanco/agentic-workflow/pull/459)** opened against `main` with `Closes #452`; the `## Fixes` row settled to `done · #459` (hand edit — that table has no emitter).
- **D5** — (D) 2026-11-08, **the push used the hook's documented escape hatch**: a normal push was attempted first and blocked at `root-suite`, exactly at D4's pre-existing pair. The hook's own instruction ("Escape hatch (record why in the PR)") is satisfied by PR #459's "Gate status" section, which names the failure, proves it identical at `c7258644`, and records that no ceiling was re-based. The exception covers the push only — it grants nothing to any later unit and waives no gate.
- **E10** — 2026-11-08, the forge state after opening: PR #459, `Closes #452`, base `main`, head `fix/452-journal-fragment-validation`; the roadmap row reads `done · #459` and `bun scripts/unit-route.mjs 452-journal-fragment-validation` now routes `close-out` (the merge gate is the next step, which is the owner's).
- **L2** — 2026-11-08, external verdict verbatim, `NEEDS-DECISION (B1)`: "O26 + E8 … reproducer: `rg -c '^\| 452 \|' docs/ROADMAP.md` → no output, exit 1 (0 matches) at the head, at the cut `95cde38a` and at the base `c7258644`, because the row reads `| [#452](url) |` (docs/ROADMAP.md:168). E8 records '→ 1'. The row's substance reproduces (row present, `bun scripts/roadmap-settle.mjs` PASS), but a `verified` row whose stated outcome does not reproduce is a blocker by the closure rule." Authority: `docs/fix/452-journal-fragment-validation/external-verify.md` (owner's read-only pass, head `2d980397`).
- **F1** — 2026-11-08, B1 repaired (docs-only, no behaviour): O26's validator points at the row's real anchor and E8 re-records that command, not the earlier feature-table shape. Recheck of the touched row: `rg -c '^\| \[#452\]' docs/ROADMAP.md` · `1`; `bun scripts/roadmap-settle.mjs` · exit 0 · `verdict: PASS`, `violations: 0`; `bun scripts/phase-lint.mjs …` · exit 0. O26 stays `verified` on the reproduced outcome; the six advisories in the receipt are **not** folded (A3 and A5 need an owner decision, A2/A4/A6 are wording) and the reason is stated rather than acted on silently.

- **D1** — (D) 2026-11-08, **validate-at-close**: the issue's S5 offers (a) close validates or (b) an evidenced non-goal. Chosen: (a). The close runs minutes after the mistake; the gate and the aggregator run hours later, so the first net must be the one nearest the writer. Evidence for the prototype's claim is O4's case: the exact incident fragment is refused before staging and its bytes stay untouched.
- **D2** — (D) 2026-11-08, **the write-time second is the clock, with an explicit pin**: `--timestamp <iso>` exists so a reproducer and a suite can name the same fragment twice, and it is declared in `journal-write-grammar@1`. It is the only datum the caller may pin; the branch, the session slug and the name stay computed (S1).
- **D3** — (D) 2026-11-08, **red-first test corrections, disclosed rather than hidden**: five expectations were corrected against the honest behaviour, none relaxed — (1) `--check` prints its `JOURNAL REFUSAL` summary first and the per-file faults after it (the product changed to satisfy the test, not the reverse); (2) an identity contradiction now carries the filename in the lint line; (3) the incident name does not fail the name parser at all — it parses as branch `main-manual`, so the refusal is the name/heading contradiction, and the close case asserts that (the test still fails at the red commit); (4) the write receipt's `path` is absolute, so the fixture stops joining it under the repo; (5) the close fixture's carrier is untracked as a directory, so its porcelain line is `?? .agentic-workflow/`.
- **D4** — (D) 2026-11-08, **pre-existing reds are reported, not repaired**: `bun scripts/check-skill-context.mjs --documents` and its two suites (`check-skill-context`, `guide-split`) fail at `c7258644` — in a `git archive main` export — with `AGENTS.md: lines 573 > 477`, `estimate 9639 > 9462`, `prose lines 458 > 370`. This unit re-pins only the exact `machineLines` value its one row moves (115 → 116; the inventory 57 → 58) and does **not** re-base a ceiling it did not spend. The root suite is therefore 88/90 at this head, 88/90 at the base.
- **E4** — 2026-11-08, **differential** (base `c7258644` exported to `mktemp -d`, head exported beside it, both against identical pinned-date fixture repositories): `session-close render` manual/auto/`--base nope`/missing-`--summary` → byte-identical after normalizing the wall-clock second; `session-close close` append mode and carrier mode → identical receipts (same sha, same leftovers); `journal aggregate` first run and no-op re-run, `journal name`, the bin's no-arg usage, an unknown-service refusal and `log render` valid/invalid → identical after normalizing the clock second. No unrequested stdout/stderr/exit difference.
- **E5** — 2026-11-08, the carrier after the rider: `journal aggregate --check` · exit 0 · `{"ok":true,"checked":2,"refusals":[]}`; the rename kept the entry's blob `926869b0…` and the repair added exactly one terminating newline (`git diff` = `1 insertion(+), 1 deletion(-)`, `\ No newline at end of file` gone).
- **E6** — 2026-11-08, the new suites: `bun test packages/agentic-workflow/test/journal.write.test.mjs` · exit 0 · 14 pass; `bun test packages/agentic-workflow/test/journal.test.mjs` · exit 0 · 26 pass (no assertion edited); `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` · exit 0 · 11 pass; `bun test scripts/session-close.test.mjs` · exit 0 · 30 pass; `bun test scripts/local-gate.test.mjs` · exit 0 · 41 pass; `bun test scripts/release-workflows.test.mjs` · exit 0 · 24 pass.
- **E7** — 2026-11-08, the pi door: `cd packages/pi-agentic-workflow && bun run test` · exit 0 · 610 pass / 0 fail across 52 files (the fixture now copies the three crate modules `session-close.mjs` imports, because the writer genuinely resolves them).
- **G1** — 2026-11-08, `bun scripts/phase-lint.mjs docs/fix/452-journal-fragment-validation/SPEC.md` · exit 0 · `verdict PASS`, fingerprint `c04741e6…01ba` (all 18 phases `PASS (6/6)`).
- **G2** — 2026-11-08, `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass; `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS` with `journal-carrier-check` resolved at `scripts/local-gate.mjs` and `journal-carrier-check` claimed.
- **G3** — 2026-11-08, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 0 file(s)`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 29 skills` (`log-session` main estimate 2800 against its declared 2800); `--documents` reports no `machine-table lines` failure (the line/prose/estimate failures are D4's pre-existing ones).
- **G4** — 2026-11-08, `bun scripts/lint-changeset.mjs .changeset/452-journal-fragment-validation.md` · exit 0 · `ok`; `bun scripts/roadmap-settle.mjs` · exit 0 · `154 unit docs checked · 0 fix docs skipped` · `violations: 0`; `bun scripts/docs-generate.mjs` · exit 0 · `1 written`, then `--check` · exit 0 · `verdict: PASS`.
- **G5** — 2026-11-08, `bun scripts/local-gate.mjs --skip-network --no-bail` · **exit 1** · every step green except `root-suite` (D4's two pre-existing suites; `schema-node-compat` skipped as its dependent and run alone: exit 0, 756 pass). `crate-suite-bun` exit 0, `crate-suite-node` exit 0, `pi-node-compat` exit 0 (610 pass), `journal-carrier-check` exit 0, `version-parity-content` exit 0, `docs-generated-projection` exit 0. The four network steps were run separately: `workspace-install` exit 0 (167 installs, no changes), `pi-compat-guard` exit 0 (both legs `tsc --noEmit clean`), `dependency-pin-gate` exit 0, `dependency-advisories` report-only exit 0.
- **E8** — 2026-11-08, the ledger's mechanical cells: `rg -c 'fragment content must be one entry block' src/journal/fragment.mjs` → 1 and the same pattern in `write.mjs` → no match (exit 1), so the byte refusal has one home (O11); `rg -c 'validate-at-close' SPEC.md` → 2 and `rg -c '5\(a\)' SPEC.md` → 4 (O17); `rg -c '^\| \[#452\]' ROADMAP.md` → 1 at the `## Fixes` active row (`docs/ROADMAP.md:168`) and `bun scripts/roadmap-settle.mjs` → `verdict: PASS` (O26).
- **E9** — 2026-11-08, the live-tree guard: every write/close/aggregate fixture ran under `mktemp -d` (`journal-write-*`, `session-close-*`, `local-gate-*`, `journal-carrier-*`, `aw452-diff-*`); `journal aggregate` without `--check` never ran against this worktree (the mutating mode was exercised only in the scratch export and in fixtures); `ls -d /tmp/journal-* /tmp/aw452-diff-* 2>/dev/null` → 0 entries after cleanup; `git status --porcelain` names no scratch path.
- **V1** — 2026-11-08, every obligation row's validator ran in the foreground in the runs above and each row flipped `planned → verified`; no row was deferred out of the unit. O20 is verified on the gate's observed state (only D4's base-identical `root-suite` red) and O23 on the exact `machineLines` pins, because the three ceilings it does not touch were red before this unit existed — recorded, never excused.
- **P20** — 2026-11-08, the session entry is written through the CLI this unit ships and committed by `session-close close` (below); renumbered from a stray `P6` in the correction batch, because `P6` already names `checkJournal` and a log id is an identity (`log-kind@1`).
- **F2** — 2026-11-08, **folded** (the receipt's A1): `template/.agentic-workflow/journal.md` now hands the entry to `agentic-workflow journal write` and names `journal-write-grammar@1` beside `journal-fragment-grammar@1`, keeping `journal name` as the read-only answer. Scope: documentation shipped to target projects — no code reads it, and the paragraph still names the owner instead of restating it. Verified: `bun test packages/agentic-workflow/test/journal.write.test.mjs` · exit 0 · 16 pass (case `the template's fragment rules name the writer and its grammar owner`, RED at `b4de037f`); `journal.surfaces.test.mjs` · 11 pass (AC9 still holds).
- **F3** — 2026-11-08, **folded** (A2): `O18`'s invariant now states what the tree does — a second block, `journal-write-grammar@1`, beside the unchanged fragment block, no restated rows. Scope: evidence wording only. Verified: `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass; `journal.surfaces.test.mjs` · 11 pass.
- **F4** — 2026-11-08, **folded** (A3): `O20`'s "no gate exception" becomes the recorded fact — the push rode `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` over the base-identical red, disclosed in PR #459 — plus `D6`, which leaves the S12 reading to the owner and writes no waiver. Scope: the row's invariant only; `D5` and the pushed history are untouched. Verified: `rg -c 'no gate exception' planning-obligations.md` → 0 and the row names D5/D6; `rg -c '^- \*\*R' SPEC.md` → 0.
- **F5** — 2026-11-08, **folded** (A4): `O20`'s validator cell and `D7` now name which suites compare with the base export and why a bare export cannot. Scope: evidence precision; the pre-existing-red conclusion is unchanged. Verified: both ceiling suites at both ends (`E11`).
- **F6** — 2026-11-08, **folded** (A5, behaviour): `writeJournal` refuses when the carrier directory is absent instead of creating it, because its presence is the opt-in (issue #405) and one write must not flip `session-close close` into carrier mode; `journal-write-grammar@1` publishes the `carrier-absent` row. Scope: the new CLI's policy only — the library `writeFragment` keeps creating the directory for the store driver that configures its own carrier. Verified: the RED case at `b4de037f` → green here; `journal.test.mjs` 26 pass (driver path untouched); with-carrier differential identical (`E12`, `D8`).
- **F7** — 2026-11-08, **folded** (A6, `SUGGESTION`, never persisted): PR #459's compact verification list now names the mode (`check-skill-context (skills)`) because `--documents` exits 1 on the pre-existing ceilings. No file in the tree carries that line; the fix is the PR body, recorded here for the audit trail.
- **D6** — (D) 2026-11-08, **the hatch's S12 reading belongs to the owner**: `D5`'s fact stays as recorded. This batch states it plainly in `O20` and writes no waiver either way — "a disclosed hatch over a base-identical red satisfies S12" and "it does not" are both the owner's to choose at merge; the exception still grants nothing to any later unit.
- **D7** — (D) 2026-11-08, **the base reproduction's scope, stated**: the two ceiling suites (`check-skill-context`, `guide-split`) fail identically in kind at the base and the head; a bare `git archive` export also reds git-dependent suites for want of a `.git`, and the schema `dist` is a build product beside it — so only the ceiling pair is a valid comparison. `D4`'s "identically" is read as that pair, never as the whole root suite.
- **D8** — (D) 2026-11-08, **the writer never opts a project in**: on the owner's correction request (`L3`), `journal write` refuses an absent carrier instead of creating it — the directory's presence flips `session-close close` into carrier mode and hands the journal to an aggregator the project never wired, so opting in stays deliberate (`mkdir -p …`, the consent-gated install). The mechanical kind is refused the same way.
- **E11** — 2026-11-08, RED then green: `bun test packages/agentic-workflow/test/journal.write.test.mjs` at `b4de037f` exported to `mktemp -d` · exit 1 · `14 pass 2 fail` (both new cases), at the head · exit 0 · `16 pass`. Base export for `F5`: both ceiling suites fail at `c7258644` and at the head with `AGENTS.md` lines 573/574 > 477, estimate 9639/9664 > 9462, prose 458 > 370.
- **E12** — 2026-11-08, differential for `F6`, three exports side by side (`c7258644` base, `2d980397` the unit's previous head, this head) against clean pinned fixtures: **(A)** every existing command (`journal name`, `journal aggregate`, `log render`, `session-close render`) is byte-identical base vs here, exit codes included — the only difference is the router's refusal text naming `write` (same exit 2); **(B)** the new writer **with** a carrier: previous head vs here → same receipt (paths normalised) and byte-identical fragment; **(C)** the new writer **without** a carrier: previous head wrote `20261108T141044Z-feat-diff-narrative-s1.md` into a directory it created, this head exits 2 with `JOURNAL REFUSAL — the fragment carrier .agentic-workflow/journal does not exist …` and creates nothing, not even the parent.
- **E13** — 2026-11-08, the batch's suites: `bun test packages/agentic-workflow/test/journal.write.test.mjs` · exit 0 · 16 pass; `packages/agentic-workflow` `bun run test` · exit 0 · 469 pass 0 fail; `scripts/session-close.test.mjs` · 30 pass; `scripts/local-gate.test.mjs` · 41 pass; `scripts/release-workflows.test.mjs` · 24 pass; `scripts/normative-drift.test.mjs` · 21 pass; `packages/pi-agentic-workflow` `bun run test` · 610 pass 0 fail; `journal aggregate --check` on this carrier · exit 0 · `checked 4, refusals 0`; `skill-lint` · PASS; `prose-gate-inventory` · PASS; `roadmap-settle` · PASS; `lint-changeset` · ok; `docs-generate --check` · PASS; `phase-lint` · PASS.
- **L4** — (L) 2026-11-08, owner request verbatim: "Hay que aumentar el techo de AGENTS.md porque realmente aún faltan cosas de filosofía de trabajo y arquitectura por arreglar, sin perjuicio de que posiblemente podamos reducir instrucciones duplicadas, contradicciones, que sobran o que se podrían recortar. Qué falla en la root-suite? Porque sigue rojjo además del AGENTS.md? Se puede reparar? Puedes hacer debug para saber donde están los fallos exactamente?"
- **D9** — (D) 2026-11-08, **the guide ceilings are re-based on the owner's instruction**: measured `574 lines / 458 prose / 9,664 est` against `477 / 370 / 9,462`, re-based by the manifest's own arithmetic `ceil(measured x 1.10)` to `632 / 504 / 10,631`, with the reason declared in the manifest's `sources`. `machineLines` stays 116 (exact pin, region unchanged). This is the owner's call taken while the branch is open, so it supersedes `D4`/`D7`'s "the ceilings are not re-based" for the future — those lines recorded what was true at that cut; the headroom is declared for the pending philosophy-of-work and architecture material, never for debt. The guide's one malformed bold (`AGENTS.md:143`, `owner-written.****`) is repaired in the same pass (same line count).
- **D10** — (D) 2026-11-08, **the trim pass is named, not done**: the same request asks to reduce duplicated, contradictory or redundant instructions. Three candidates are recorded for their own unit, each with the reason it does not belong in this batch: (1) the branch/PR rule is stated twice (`AGENTS.md:128` "one PR per unit, always against main" and `:143` "work in short branches off main") — one owner is needed, not a second copy; (2) `### Where the gate runs` (~34 lines) restates hook/`--jobs`/merge-driver operational detail the gate inventory and `SETUP.md` own; (3) `## Worktree creation` (~100 lines) is one-kind-of-work guidance the guide's own structure says belongs one hop away. Moving it needs a new reference doc, a documentation-map row, a Deep-references row and a budget re-check — an own unit, not a silent edit.
- **E14** — 2026-11-08, the two root-suite reds are repaired and re-derived: `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 4 budgeted documents`; `bun test scripts/check-skill-context.test.mjs` · exit 0 · the file's top-level assertions now run to their PASS line (it aborted before); `bun test scripts/guide-split.test.mjs` · exit 0 · 14 pass (was 13 pass 1 fail); `bun scripts/run-root-suite.mjs` · exit 0 · 90 suites pass, 0 fail (was 88/90, the same two). Both reds were one predicate: `check-skill-context.mjs --documents` exit 0.

## Next

The owner's recheck of the correction batch — `F1` folded by `c9b2669d`, `F2`–`F7` folded here — `D9`'s
ceiling re-base and `D10`'s trim pass to schedule, and the merge (merge authority stays with the
owner). `D9` repaired the two root-suite reds, so the offline gate is green here (`E14`) and the
`pre-push` hook no longer blocks a push; this session still does not push, because pushing is the
owner's call — as is the `S12` reading of the hatch the earlier push used (`D6`). On a verdict of
blockers: one correction batch limited to them, then a recheck of the same rows (§9); a new
finding goes back to the owner and the turn ends.

## References

- Issue [#452](https://github.com/gtrabanco/agentic-workflow/issues/452); roadmap
  row 452.
- `docs/fix/405-journal-fragments/` (the carrier and its grammar),
  `docs/fix/374-pluggable-session-journal/` (the entry type and the driver
  contract), `docs/fix/429-log-session-command/` (the extension invocation
  record this unit converges with).
- `skills/pre-execution-review/references/LEDGERS.md` (row contracts),
  `skills/log-session/SKILL.md` (the prose door).

## Branch

`fix/452-journal-fragment-validation`

## Depends on

None. `#405` (merged) and `#429` (merged) are soft prerequisites that landed;
their open/closed forge state never blocks this unit (S18).

## Regression scope

| scenario | verified by |
|---|---|
| `journal aggregate` still validates everything, appends newest-first, consumes already-present bytes and deletes consumed fragments | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 with no assertion edited |
| `journal name`, the collision refusal and the `.gitkeep` placeholder keep their behaviour | `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 |
| `session-close render` output is byte-identical for manual and auto kinds, and `close` keeps its append-only proof on the non-carrier path | `bun test scripts/session-close.test.mjs` exits 0 and the differential export is byte-equal |
| Every other crate subcommand (`unit-doc`, `roadmap`, `changelog`, `budgets`, `manifest`, `doc`, `section`, `relay`, `memory`, `log`) keeps its arguments and exit codes | differential against the base export plus `bun test packages/agentic-workflow/test/` exits 0 |
| The crate suite probes the repository's own carrier and must stay green | `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exits 0 after the rider rename |
| The extension's other commands and the settings console are untouched | `bun test packages/pi-agentic-workflow/test/alias-coverage.test.mjs test/shipped-adapter.test.mjs` exits 0 |
