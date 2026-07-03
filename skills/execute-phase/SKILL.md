---
name: execute-phase
user-invocable: true
version: 1.8.0
argument-hint: <NN> <phase> | <NN> (single-pass) | --fix | [--force]
model: sonnet
effort: medium
allowed-tools: [Bash, Read, Edit, Write, MultiEdit]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Implement one phase of a feature (default), a small feature end-to-end in a
  single pass (SPEC-only, no planning artifacts), or a fix (--fix). Enforces
  branch safety, issue policy, the project's verification gate, and per-phase doc
  discipline. Using a non-Claude / free-inference model? Edit model:/effort: in this frontmatter to your closest equivalent tier (see the README model-equivalence table).
  Triggers: "execute phase P1 of NN", "implement the NN feature",
  "build NN from its spec", "execute-phase NN P2", "execute-phase --fix".
---

# Execute Phase

Three modes:

- **feature phase** (default) — implement one phase of `docs/features/<NN>-<slug>/` using its `TASKS.md`.
- **single-pass** — a small feature (SPEC `Size: XS/S`; only a `SPEC.md`, no planning artifacts): implement it end-to-end in one pass.
- **`--fix`** — implement a fix from `docs/fix/<n>-<topic>/`.

## Turn contract — every invocation, verify before ending the turn

```
✓ 1. Branch verified FIRST: `git branch --show-current` was RUN and its output
     pasted. Output = the default branch → `git switch -c <branch>` was RUN
     before any edit. NEVER work on main/master.
✓ 2. The gate was RUN (not assumed): commands + exit codes pasted.
✓ 3. `git add <files>` and `git commit -m "<type>(<scope>): <summary>"` were
     EXECUTED and the resulting sha is pasted. Describing a commit you did not
     run counts as NOT committed.
✓ 4. Unit finished (single-pass, --fix, or final phase)? Then `git push` and
     `gh pr create` were EXECUTED and the PR URL is pasted. The PR body is
     NEVER empty: what it does, why, evidence, and `Closes #<n>` when
     issue-born. Unit not finished? Then NOTHING was pushed.
✓ 5. Artifact language: explicit user instruction > the project's declared
     docs language > English. The CONVERSATION language never decides — a
     Spanish prompt still produces English commits/PRs/issues unless one of
     the first two says otherwise.
✓ 6. The closing `→ Next:` block is the LAST thing printed.
```

**Push policy: push happens exactly once — at the PR step. Never mid-phase,
never unasked, never to the default branch.** If, about to end the turn, any
box is unchecked: STOP and complete it now — a turn that ends with work
implemented but uncommitted, or committed but missing its PR (finished units),
is a FAILED turn, not a done one.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR, gate-before-commit, docs-language). Run `git branch --show-current` before any edit/commit; if `main`, create the working branch first (assistant only; the user may use `main`).
- **Phases are `P1, P2, …`.** The `<phase>` argument and every reference in `PLAN.md`/`TASKS.md`/`progress.md`/commits is `P1, P2, …` ("phase N") — **never** `S1`/`S2`/"Step N". If a plan you're handed uses `S1`-style labels, normalize it to `P1, …` before executing and note it in `decisions.md`.
- Implement only the requested scope — one phase (feature mode) or the whole SPEC (single-pass/fix). Never bundle phases unless asked.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).
- **When reality contradicts the plan** (a task is impossible, an assumption is wrong, a better path appears): update `TASKS.md`/`PLAN.md` and record why in `decisions.md` — never silently diverge from the written plan.
- **Dependency gate before any work** — see the section below. No edit, no branch, no commit happens for a unit whose dependency closure isn't merged, unless the user passed `--force`.

## Dependency gate (always, before any other step)

Run this check for **every** mode (feature phase, single-pass, and `--fix`)
before touching anything:

1. Read the unit's `Depends on:` (SPEC) and its roadmap/fix-index row.
2. Build the **transitive closure**: for each dependency, read *its* roadmap
   row and collect its dependencies too, until none remain.
3. For each entry in the closure, its status must be **merged in the forge**
   (`gh pr view` on its PR, or the row's PR reference) — `done`-but-PR-open is
   NOT met (its code isn't on the default branch), and a missing folder/row is
   NOT met.
4. **All met** → proceed to the normal workflow.
5. **Any unmet → STOP before any edit** and print exactly:

   ```
   DEPENDENCY GATE — <NN>-<slug> BLOCKED
   Unmet chain (deepest first is the one to start):
     <NN> ← <dep> (<status>) [← <dep-of-dep> (<status>) …]
   Build order to unblock: <deepest> → … → <NN>

   → Next: /execute-phase <deepest> P1 — the deepest unmet dependency (plan it
     first with /plan-feature <deepest> if it has no SPEC)
     · fix-type dependency → /plan-fix then /execute-phase --fix
     · proceed anyway, at your own risk → /execute-phase <NN> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

6. **`--force`** skips the stop (never the check): the gate still runs and its
   result is **recorded in `decisions.md`** ("started with unmet deps: <list>,
   user-forced <date>") before implementation begins. `--force` is a
   user-only escape hatch — the autopilot (`ship-roadmap`) must never pass it.

## Allowed & forbidden (fixed lists — no interpretation)

**Allowed changes in a phase:**
- The phase's own tasks (from `TASKS.md`, or the SPEC for single-pass/fix)
- Tests for the behavior this phase adds or alters
- The per-phase doc updates listed in the completion gate below
- The smallest refactor strictly required to land a task (state why in the commit)

**Forbidden — never, even if it "would help":**
- New abstractions beyond what the SPEC names (an interface with one
  implementation is a violation)
- New dependencies not justified in the SPEC
- Public API / contract changes the SPEC doesn't name
- Architecture changes (layers, boundaries, patterns)
- Refactoring unrelated code
- Building future phases or features early

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
✓ Docs updated — at minimum verify each of: TASKS.md (checkboxes),
  progress.md, testing.md, known-issues.md, decisions.md (if any decision was
  taken), SPEC.md (only if scope/acceptance changed — with the change logged)
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

## Issue policy

Forge operations use the project's declared forge CLI (Workflow conventions —
examples use `gh`; translate if the project declares another forge).

- **`--fix`:** every fix needs a tracked issue; create with `gh issue create --template fix.yml` if missing, populating the body from the SPEC. Use the returned number for branch and folder.
- **feature:** if it came from an issue, include `Closes #<n>` in the PR body. Don't create issues for features that didn't originate from one.
- **Language precedence for every artifact** (issues, PRs, commits, SPECs, docs): (1) an explicit user instruction in the prompt, else (2) the project's declared docs language (Workflow conventions), else (3) English. The conversation language is NOT a signal — being asked in Spanish never makes the PR Spanish. Non-matching source material gets translated first.

## Workflows

**Feature phase (default)** — `docs/features/<NN>-<slug>/`

1. Verify branch (create if on `main`). **P1 only:** if the planning artifacts
   (`docs/features/<NN>-<slug>/`) are still uncommitted, commit them first on the
   feature branch — `git add docs/features/<NN>-<slug> && git commit -m "docs(<NN>-<slug>): planning artifacts"` —
   so planning history stays separate from implementation.
2. Read `progress.md` first (the running log — what prior phases did and left
   open), then `SPEC.md` + `TASKS.md` for the requested phase. **Same-session
   shortcut:** if you executed the previous phase in this session and the
   planning docs haven't changed, don't re-read them — only the new phase's
   `TASKS.md` section.
3. Implement only that phase (see *Implementation guidance*).
4. Run the gate (type-check, tests, build). **If red:** fix within the phase's
   scope and re-run — never commit red. If the failure can't be fixed within
   this phase's scope, record it in `known-issues.md`, leave the work
   uncommitted, and stop with a clear report.
5. Update the per-phase docs.
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"` — one commit per phase, conventional format. Run this; don't just describe what should be committed.
7. **Review checkpoint** — every 2 phases (and before the PR), **stop and hand off** to `/review-change` (see below) before the next phase. Don't run it in this skill's turn.

**Single-pass** — small feature with only a `SPEC.md`, no planning artifacts:

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"`.
7. **Mark done + open the PR — always (this is the last step).** Flip the roadmap
   row to `done` (it's *built*; merge state lives in the forge, not the status —
   see *Marking done*), commit that flip, then `git push` and open the PR:
   `gh pr create --base main --title "<type>(<scope>): <summary>" --body "<summary>"`
   (add `Closes #<n>` when issue-born). A single-pass unit **never ends branch-only** —
   it always leaves an open PR, regardless of the review/audit still to come.
8. **Mandatory review hand-off** → `/review-change` (the required final quality step;
   see *Review checkpoint*), then `audit-pr` as the merge gate. Print the next step.

**`--fix`** — `docs/fix/<n>-<topic>/`, template `docs/fix/_TEMPLATE/SPEC.md`, index `docs/fix/README.md`:

1. Verify the issue exists (`gh issue view <n>`); if it doesn't, create it
   (`gh issue create --template fix.yml`, body from the SPEC).
2. **If `docs/fix/<n>-<topic>/SPEC.md` already exists (e.g. from `plan-fix`), use it — do not re-draft.** Otherwise copy the template, fill every section, and register the entry in `docs/fix/README.md`.
3. Verify branch (`fix/<n>-<topic>`).
4. Implement the fix (no planning artifacts; the SPEC is enough).
5. Run the gate.
6. Stage and commit: `git add <changed files>` then `git commit -m "fix(<scope>): <summary>"`.
7. **Mark done + open the PR — always (this is the last step).** Set the
   `docs/fix/README.md` entry's status to `done` (built, not yet merged), commit,
   `git push`, then open the PR: `gh pr create --base main --title "fix(<scope>): <summary>" --body "Closes #<n>"`.
   Run the commands. A fix **never ends branch-only** — it always leaves an open PR.
8. **Mandatory review hand-off** → `/review-change`, then `audit-pr` as the merge gate.
   Print the next step. **Keep the fix-index entry** until the PR is actually merged
   (don't drop issue tracking early; the merge gate also blocks on pending docs).
9. **After merge only:** remove the `docs/fix/README.md` entry (or archive it to the
   project's fix history per its convention) — never before the merge.

(The `Depends on:` check for fixes is the same Dependency gate above — it runs
before step 1, transitively, and blocks unless `--force`.)

## Implementation guidance (single-pass & per-phase)

**Tests first where they pay.** For core/domain and orchestration phases, write
the phase's acceptance/integration tests first (red), then implement to green —
the SPEC's dev scenarios are the test list, so its failure modes get exercised,
not just documented. UI and adapter glue may test after implementation.

Map each change to the project's layers per its architecture doc; build inner layers first, outer last:

1. **Persistence/schema** (if any) — update where defined, generate migrations with the project's tooling, never hand-edit generated output.
2. **Core/domain** — no outer-layer imports; use the project's value objects/rules.
3. **Orchestration/use-case** — inject dependencies, idempotent if re-callable, typed errors.
4. **Adapters** — implement the project's ports; never leak raw external errors inward.
5. **Controller/endpoint** — map errors to responses; webhooks: verify signature, enqueue, return fast.
6. **UI** (if any) — follow the design-system/i18n/accessibility docs; no hardcoded strings.
7. **Tests** — whatever wasn't written first (see above): light mocks of the project's interfaces; test orchestration, not adapters.

## Completion checklist (single-pass)

Write `docs/features/<NN>-<slug>/CHECKLIST.md`: schema migration applied (if any) · core layer has no outer imports · orchestration idempotent + typed errors · adapters implement ports · tests pass · type-check/lint green · UI strings localized (if UI) · domain value-object rules respected · user-facing limitations disclosed · new deps pinned. Note any decisions not captured in the SPEC.

## Review checkpoint & finishing a unit

**`review-change` is mandatory — every unit gets a final review before merge, no
exceptions.** It runs in its own turn (hand-off, not composed): a skill's model and
effort are fixed at turn start, so invoking `review-change` from here would run it at
execute-phase's `sonnet`/`medium` rather than its own `opus`/`high` — under-powering
the review. So **suggest** it; don't compose it. (General rule: across a model/effort
boundary, hand off; don't compose.) On agents without per-skill model config the same
rule holds by hand: run the review as a **separate, fresh invocation** on your
strongest model — never inline in the implementation run.

**Cadence.** Feature mode: hand off after every **2 completed phases**, and always
once more at the end so the final phase is never unreviewed. Single-pass and `--fix`
have no intermediate phases — they get the one mandatory end review.

**Finishing a unit (single-pass, `--fix`, or a feature's final phase): the last step
is always an open PR.** Mark the unit `done`, commit the flip, push, and `gh pr create`
(see the mode steps above) — regardless of the review/audit still to come. Then hand
off to `/review-change` (mandatory), which feeds `audit-pr` (the merge gate).

Checkpoint hand-off (print it — every invocation ends by suggesting the next step):

```
Phase <N> done and committed. Review checkpoint.
→ Next: /review-change — it reviews the branch at its own model/effort
  · clean    → continue with /execute-phase <NN> <next phase>
  · findings → fold fix-now into the branch; non-fix-now → /triage-issue; then re-review
```

Final-phase / single-pass / fix hand-off:

```
<unit> implemented, gate green, marked done, PR #<n> opened.
→ Next: /review-change (mandatory final review)
  · clean    → /audit-pr (merge gate) → human merges
  · findings → fold fix-now into this PR; non-fix-now → /triage-issue; re-review
```

This never auto-merges and never skips the per-phase stop: one phase at a time,
human in the loop, gate enforced each phase, every unit reviewed before merge.

### Marking done (status semantics)

A unit flips to **`done` when its last step runs — opening the PR — even though it
isn't merged yet.** `done` means *built and PR-open*; merge state lives in the forge
(the open/merged PR), not in the status. The flip is a doc change, so it rides the
PR-bound commit (never a lone commit on the default branch). **Never merge with docs
still pending, and never drop the issue / fix-index entry before merge** — those are
`audit-pr`'s gates, not removed at done-time.

## Batch execution with `/loop`

To run all phases without manual re-invocation, use Claude Code's self-paced
`/loop` with a goal rather than a direct command (the skill requires a phase
argument, so `/loop /execute-phase NN` alone won't advance automatically):

```
/loop implement all phases of feature NN one by one using /execute-phase,
commit each phase, and stop when TASKS.md shows all phases checked
```

The loop reads `TASKS.md` to pick the next uncompleted phase, implements it,
and terminates naturally when nothing remains — no explicit stop condition
needed. **Per-2-phase checkpoints are skipped in this mode, but the end review is
not optional:** at the end, **mark done + open the PR**, then run `/review-change`
once (the mandatory final review) → `audit-pr`.

Use this when the SPEC is solid and you want to review the whole branch at once
rather than after every two phases. For incremental, phase-by-phase review,
stick to the default (manual re-invocation + checkpoint hand-offs).

**No `/loop` on your agent?** Run the same loop by hand: after each phase,
re-invoke this skill with the next phase (`execute-phase <NN> <next>`) — the
closing block always names the exact next command — and keep the mandatory end
review. The sequence is identical; only the automation is missing.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — the frontmatter tiers state intent:
  planning, review, and audit need your **strongest** model; mechanical
  execution may run cheaper. Never review a change with a model weaker than
  the one that wrote it.
- **No `/loop`** — re-invoke the skill by hand per phase, following its closing
  `→ Next:` block each time (see *Batch execution* above).

## Relationship to other skills

- Planned by `plan-feature` (features) or `plan-fix` (fixes); executes their SPEC.
- **Hands off** to `review-change` (mandatory final review) at the checkpoint (every
  2 phases) and when finishing a unit — it runs at its own model/effort, not composed
  in this skill's turn. `fix-now` findings fold back here; non-fix-now routes through
  `triage-issue`.
- A finished unit (single-pass, `--fix`, or final phase) **always opens its PR and
  flips to `done`**; `audit-pr` then gates the merge (it blocks on pending docs or a
  prematurely-dropped issue entry).
- **Every invocation ends by printing the next step.**

## Done when

- The requested scope is implemented (one phase, or the whole SPEC for
  single-pass/`--fix`), the project's gate is green, per-phase docs are updated, and
  the work is committed on the correct branch — nothing bundled beyond the requested
  scope.
- **A finished unit additionally:** is flipped to `done`, has its PR opened (never
  branch-only), and prints the mandatory `/review-change` hand-off as the next step.
