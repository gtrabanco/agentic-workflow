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

- P1 — Freeze this unit doc with its two planning ledgers (validator: `bun scripts/phase-lint.mjs docs/fix/452-journal-fragment-validation/SPEC.md` exits 0)
  (Implements: S9, S13, S17)
  Relevant files: docs/fix/452-journal-fragment-validation/SPEC.md
- P2 — Land the RED corpus suite for the write CLI, the carrier check and the close refusal, observed failing on the absent operations (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits non-zero at the red commit)
  (Implements: S10, S11, S14)
  Relevant files: packages/agentic-workflow/test/journal.write.test.mjs
- P3 — Land the RED close-refusal cases in the session-close suite (validator: `bun test scripts/session-close.test.mjs` exits non-zero at the red commit)
  (Implements: S10, S14)
  Relevant files: scripts/session-close.test.mjs
- P4 — Extract the read-side fragment validator and the narrative block owner into the crate (validator: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S2, S14)
  Relevant files: packages/agentic-workflow/src/journal/fragment.mjs, packages/agentic-workflow/src/journal/block.mjs
- P5 — Implement the write service the CLI calls (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with the write cases green)
  (Implements: S1, S2)
  Relevant files: packages/agentic-workflow/src/journal/write.mjs
- P6 — Implement the validate-only carrier reader beside the aggregator (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0 with the `--check` cases green)
  (Implements: S3, S6)
  Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs
- P7 — Wire `journal write` and `journal aggregate --check` into the CLI router (validator: `bun test packages/agentic-workflow/test/journal.write.test.mjs` exits 0)
  (Implements: S1, S2, S3, S9)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- P8 — Validate added fragments in `session-close close` and delegate its block and facts to the crate owner (validator: `bun test scripts/session-close.test.mjs` exits 0)
  (Implements: S5, S14)
  Relevant files: scripts/session-close.mjs
- P9 — Repair the carrier's committed malformed fragment by rename only (validator: `cd packages/agentic-workflow && bun test test/journal.surfaces.test.mjs` exits 0)
  (Implements: S4, S4a, S10)
  Relevant files: .agentic-workflow/journal/
- P10 — Wire the carrier check into the local gate's offline subset and pin the step list (validator: `bun test scripts/local-gate.test.mjs` exits 0)
  (Implements: S3, S7)
  Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs
- P11 — Route the skill's fragment step through the write CLI (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S1, S7)
  Relevant files: skills/log-session/SKILL.md
- P12 — Route the extension's directive through the write CLI (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0)
  (Implements: S1, S7)
  Relevant files: packages/pi-agentic-workflow/src/log-session-invocation.ts
- P13 — Publish the write grammar in the crate README (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S7)
  Relevant files: packages/agentic-workflow/README.md
- P14 — Declare the normative surface and re-pin the guide's machine region (validator: `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S7, S15)
  Relevant files: AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P15 — Name the gate step's carrier in the gate inventory (validator: `bun scripts/prose-gate-inventory.mjs` exits 0)
  (Implements: S3, S7)
  Relevant files: docs/workflow/GATE_INVENTORY.md
- P16 — Ship the release intent (validator: `bun scripts/lint-changeset.mjs .changeset/452-journal-fragment-validation.md` exits 0)
  (Implements: S15)
  Relevant files: .changeset/452-journal-fragment-validation.md
- P17 — Register the unit in the `## Fixes` table (validator: `bun scripts/roadmap-settle.mjs` exits 0)
  (Implements: S15)
  Relevant files: docs/ROADMAP.md
- P18 — Close the ledgers on foreground runs, render the projection and record the session entry (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
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
- **P1** — 2026-11-08, ledgers cut at `c7258644` (main tip at the cut): unit doc + `planning-obligations.md` (O1–O20, all `planned`) + `planning-evidence.md` (PE-001–PE-016).

## Next

P2 — land the RED corpus suite.

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
