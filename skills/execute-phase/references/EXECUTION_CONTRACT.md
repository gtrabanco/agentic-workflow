## Review checkpoint triggers

The recommended, skippable checkpoint fires on **what accumulated since the
last checkpoint**, not on a step count — a step-counter cadence re-miscalibrates
whenever step size changes. After each step commit, check all three; recommend
the checkpoint (naming which trigger fired) the moment any one does:

1. **Layer boundary** — the step about to start declares a different `Layer:`
   (the phase-lint enum) than the step just committed. The just-closed layer is
   a coherent reviewable unit.
2. **Accumulation** — the unreviewed diff since the last-reviewed marker
   exceeds **> 400 changed lines (insertions + deletions) OR > 8 changed
   files**, measured with `git diff --stat <baseline>..HEAD`.
3. **Sensitivity** — the step just committed touches auth, payments,
   destructive migrations, secrets, or CI config → recommend an **immediate**
   checkpoint on closing it. This is a single-reviewer recommendation and does
   not change `review-change`'s own once-per-unit adversarial cadence — the two
   are independent mechanisms.

**Last-reviewed marker.** Home: the unit doc's Evidence section header line
`Last reviewed: <sha>`. Sole writer: `execute-phase` — stamped after a checkpoint
is taken (the next step records the sha the user confirmed was reviewed). If
absent (unit's first checkpoint), the baseline is
`git merge-base <default-branch> HEAD` — never treat a missing marker as a
blocker or crash condition.

## Allowed & forbidden (fixed lists — no interpretation)

**Allowed changes in a step:**
- The step's own tasks (from the unit doc's `Tasks` section)
- Tests for the behavior this step adds or alters
- The per-step doc updates listed in the step completion gate below
- The smallest refactor strictly required to land a task (state why in the commit)
- An `Autofix` or `Opportunistic Fix` that passes every box in the
  *Opportunistic finding policy* below

**Forbidden — never, even if it "would help":**
- New abstractions beyond what the unit doc's Acceptance criteria name
- New dependencies not justified in the unit doc
- Public API / contract changes the unit doc doesn't name
- Architecture changes (layers, boundaries, patterns)
- Refactoring unrelated code
- Building future steps or features early
- Folding a discovered finding into the branch before it passes the
  *Opportunistic finding policy*
- Creating an issue that descopes an acceptance criterion without explicit user
  approval and a dated `## References` entry (see *Descope guard* below)
  — an issue may never be the first record of a descope

Something forbidden looks necessary → stop, record it in `decisions.md` or
`known-issues.md`, and surface it — never do it silently.

## Step completion gate

The step completion gate verifies that Evidence rows are complete for the
step's acceptance criteria, the unit doc is committed clean, and the diff guard
(if applicable) passed. The mark's shape, ownership, and reuse rule are
declared in `LEDGERS.md` (§gate-ran@1).

```
GATE-RAN | HEAD <40-hex sha> | <cmds> | exit <code>
```

- **Record**: whoever runs the gate records a mark at the head the gate
  actually ran (green or red). A red run (exit code ≠ 0) is recorded as
  evidence, not silence.
- **Consume**: any skill may consume a green run only at the identical HEAD.
  A changed head ⇒ re-run the gate.
- **Recorder column-sets**: `execute-phase:gate-ran-marks` (executor steps)
  and `review-change:review-gate-ran-marks` (reviewer steps) are declared in
  the Evidence truth-class row's owner cell.

## Step completion gate — pass only if (every box, every step)

```
✓ Verification gate green — type-check + tests + build actually RUN (paste exit
  status), never assumed
✓ Every task of this step checked off in the unit doc's `Tasks` section, each
  mapped to an Evidence row (code path or test name)
✓ Tests updated/added for every behavior this step changed
✓ Tests-first red run recorded (core/domain + orchestration steps, n/a for
  test-after UI/adapter steps) — the failing first run's command, exit status,
  and failing test names are in the unit doc's `Progress` log
✓ No TODO/FIXME/HACK markers left in the diff
✓ No duplicated logic (reuse the existing helper — cite it if one existed)
✓ No dead code introduced (unused imports, functions, unreachable branches)
✓ No hidden breaking change (changed public contracts diffed against their
  consumers)
✓ Architecture doc respected (dependency directions, layer boundaries)
✓ Architectural invariants preserved or backed by an explicit recorded decision
✓ Evidence rows complete for the step's ACs — unit doc committed clean
  (one dated `YYYY-MM-DD HH:MM` Progress entry, all Evidence rows current)
✓ Docs COMMITTED with the step — the unit doc carries all required sections
  (Tasks, Evidence, Progress, References); no orphan files remain
```

A step that cannot tick every box is **not done**: fix within the step's
scope, or record the blocker in the unit doc's `Progress` log, leave the
work uncommitted, and stop with a clear report. Never commit red; never tick
a box you didn't verify.

## Branch

| Mode | Format |
|------|--------|
| unit step | `feat/<NN-slug>` |
| fix unit | `fix/<issue-number>-<topic>` |

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
Unit doc evidence rows (Evidence, Progress) are the single source of truth
for step completion — no separate ACCEPTANCE.md, progress.md, or TASKS.md.

## Architectural invariants

Before any edit, discover the optional project invariant document declared in
the documentation map (normally
`docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent, record
`n/a: no project invariants declared` and continue. For every applicable rule,
cite its ID and repository evidence and classify the step as `preserves`,
`violates`, `introduces`, or `changes`. Use frozen NRS facts when present, but
the repository remains authoritative and conflicting evidence routes to the
resolver.

Only `preserves` may continue. A `violates`, `introduces`, or `changes` result
stops before edits and requires an explicit architectural decision through the
project's declared authority. A decision record alone is not sufficient: the
declared authority must apply the decision to the invariant document, and the
resulting rule must be re-evaluated and evidenced as `preserves` before the
phase can resume. The executor does not edit the invariant document itself.
Do not alter the unit doc or tests to make the step pass, and do not convert
the decision into step work. Return exactly:

```
ARCHITECTURAL INVARIANT GATE — <NN-slug> <P<k>> BLOCKED
Invariant: <ID> — <violates|introduces|changes>
Evidence: <repository path:line or command result>
Decision required: <project-declared architectural authority>

→ Next: <decision path> — record the explicit architectural decision, then re-run this step
  · evidence conflict → /resolve-repository-state — reconcile the frozen fact first
  · no invariant document → record n/a and continue only when no other rule applies
```
