## Review checkpoint triggers (feature mode)

The recommended, skippable checkpoint fires on **what accumulated since the
last checkpoint**, not on a phase count — a phase-counter cadence re-miscalibrates
whenever phase size changes (see `#77`). After each phase commit, check all
three; recommend the checkpoint (naming which trigger fired) the moment any
one does:

1. **Layer boundary** — the phase about to start declares a different
   `Layer:` (the phase-lint enum) than the phase just committed. The just-closed
   layer is a coherent reviewable unit.
2. **Accumulation** — the unreviewed diff since the last-reviewed marker
   exceeds **> 400 changed lines (insertions + deletions) OR > 8 changed
   files**, measured with `git diff --stat <baseline>..HEAD`. Covers a long run
   of small same-layer phases the layer-boundary trigger would miss.
3. **Sensitivity** — the phase just committed touches auth, payments,
   destructive migrations, secrets, or CI config → recommend an **immediate**
   checkpoint on closing it, regardless of the other two triggers. This is a
   **single-reviewer** recommendation and does not change `review-change`'s
   own once-per-unit adversarial cadence (`skills/review-change/SKILL.md`
   "Cadence — once per unit") — the two are independent mechanisms.

**Last-reviewed marker.** Home: `progress.md`'s header line
`Last reviewed: <sha>`. Sole writer: `execute-phase` — stamped with the
just-committed phase's sha immediately after a checkpoint is taken (review
happens in a separate turn, so this skill records the marker at the start of
the *next* phase it executes, using the sha the user confirmed was reviewed).
If the marker is absent (unit's first checkpoint, or a legacy `progress.md`
predating this rule), the baseline is `git merge-base <default-branch> HEAD` —
never treat a missing marker as a blocker or crash condition.

## Allowed & forbidden (fixed lists — no interpretation)

**Allowed changes in a phase:**
- The phase's own tasks (from `TASKS.md`, or the SPEC for single-pass/fix)
- Tests for the behavior this phase adds or alters
- The per-phase doc updates listed in the completion gate below
- The smallest refactor strictly required to land a task (state why in the commit)
- An `Autofix` or `Opportunistic Fix` that passes every box in the
  *Opportunistic finding policy* below

**Forbidden — never, even if it "would help":**
- New abstractions beyond what the SPEC names (an interface with one
  implementation is a violation)
- New dependencies not justified in the SPEC
- Public API / contract changes the SPEC doesn't name
- Architecture changes (layers, boundaries, patterns)
- Refactoring unrelated code
- Building future phases or features early
- Folding a discovered finding into the branch before it passes the
  *Opportunistic finding policy*
- Creating an issue that descopes a SPEC acceptance criterion or phase task
  without a user-approved, dated `## Amendments` entry (see *Descope guard*
  under *Issue policy* below) — an issue may never be the first record of a
  descope

Something forbidden looks necessary → stop, record it in `decisions.md` or
`known-issues.md`, and surface it — never do it silently.

## Phase completion gate — pass only if (every box, every phase)

```
✓ Verification gate green — type-check + tests + build actually RUN (paste exit
  status), never assumed
✓ Every task of this phase checked off in TASKS.md, each mapped to evidence
  (code path or test name)
✓ Tests updated/added for every behavior this phase changed
✓ No TODO/FIXME/HACK markers left in the diff
✓ No duplicated logic (reuse the existing helper — cite it if one existed)
✓ No dead code introduced (unused imports, functions, unreachable branches)
✓ No hidden breaking change (changed public contracts diffed against their
  consumers)
✓ Architecture doc respected (dependency directions, layer boundaries)
✓ Architectural invariants preserved or backed by an explicit recorded decision
✓ Docs updated — at minimum verify each of: TASKS.md (checkboxes),
  progress.md (one handoff entry in the fixed schema — Done / Remains /
  Gotchas / Files / Next), testing.md, known-issues.md, decisions.md (if any
  decision was taken), SPEC.md (only if scope/acceptance changed — with the
  change logged), docs/CAPABILITIES.md (only if this phase introduced a new
  cross-cutting subsystem, role, or permission — append the row, additive,
  never rewrite existing ones; explicitly n/a when the project has no
  inventory file)
✓ Docs COMMITTED with the phase — after the phase commit,
  `git status --porcelain -- docs/` returns nothing. Doc updates ride the
  phase commit (same `git add`), never sit uncommitted "for later"
```

A phase that cannot tick every box is **not done**: fix within the phase's
scope, or record the blocker in `known-issues.md`, leave the work uncommitted,
and stop with a clear report. Never commit red; never tick a box you didn't
verify.

## Branch

| Mode | Format |
|------|--------|
| feature / single-pass | `feat/<NN>-<slug>` |
| `--fix` | `fix/<issue-number>-<topic>` |

Read the SPEC's `Branch` field; create with `git switch -c <name>`. If absent/ambiguous, ask. Never commit, amend, or force-push on `main`.

**Honor the project's declared Git workflow** (Workflow conventions — `branches`
or `worktrees`). Default and assumption everywhere: **`branches`** — one active
unit at a time, sequential, plain `git switch -c`; **never create a worktree**.
Only when the project explicitly declares `worktrees` may a unit get its own
checkout — and then one worktree per unit, removed after merge.

## Normalized Repository State

When present, consume frozen facts and decisions in
`docs/workflow/REPOSITORY_STATE.md`. Inspect directly only for an absent fact;
route contradictory evidence to `resolve-repository-state`. Documentation,
planned work, and inference never prove implementation. A present ledger whose
status is `draft`, `contradicted`, or `resolved` stops implementation and routes
to discovery or resolution first. If no ledger exists, inspect the repository
directly and record `n/a: no normalized repository state`; NRS is optional.

## Architectural invariants

Before any edit, discover the optional project invariant document declared in
the documentation map (normally
`docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent, record
`n/a: no project invariants declared` and continue. For every applicable rule,
cite its ID and repository evidence and classify the phase as `preserves`,
`violates`, `introduces`, or `changes`. Use frozen NRS facts when present, but
the repository remains authoritative and conflicting evidence routes to the
resolver.

Only `preserves` may continue. A `violates`, `introduces`, or `changes` result
stops before edits and requires an explicit architectural decision through the
project's declared authority. A decision record alone is not sufficient: the
declared authority must apply the decision to the invariant document, and the
resulting rule must be re-evaluated and evidenced as `preserves` before the
phase can resume. The executor does not edit the invariant document itself.
Do not alter the SPEC or tests to make the phase pass, and do not convert the
decision into phase work. Return exactly:

```
ARCHITECTURAL INVARIANT GATE — <NN|fix n> <P<k>|single-pass> BLOCKED
Invariant: <ID> — <violates|introduces|changes>
Evidence: <repository path:line or command result>
Decision required: <project-declared architectural authority>

→ Next: <decision path> — record the explicit architectural decision, then re-run this phase
  · evidence conflict → /resolve-repository-state — reconcile the frozen fact first
  · no invariant document → record n/a and continue only when no other rule applies
```

