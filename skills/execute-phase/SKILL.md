---
name: execute-phase
user-invocable: true
version: 2.11.2
argument-hint: <NN> [P<k>] | --fix <n> [P<k>] | [--force]
allowed-tools: [Bash, Read, Edit, Write, MultiEdit]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Implement one phase of a feature (default), or a small feature / a fix (--fix)
  by its SPEC's ## Phases ledger — one phase per invocation, the final phase is
  always Hardening & PR (the close-out); legacy SPECs without ## Phases run
  end-to-end in a single pass. Enforces
  branch safety, issue policy, the project's verification gate, and per-phase doc
  discipline. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "execute phase P1 of NN", "implement the NN feature",
  "build NN from its spec", "execute-phase NN P2", "execute-phase --fix".
---

# Execute Phase

Three modes:

- **feature phase** (default) — implement one phase of `docs/features/<NN>-<slug>/` using its `TASKS.md`.
- **single-pass unit** — a small feature (SPEC `Size: XS/S`; only a `SPEC.md`, no planning artifacts): execute its SPEC's `## Phases` **one phase per invocation**; a SPEC without `## Phases` runs end-to-end in one pass (legacy fallback — see *Workflows*).
- **`--fix`** — implement a fix from `docs/fix/<n>-<topic>/`: same phased consumption and legacy fallback.

## Turn contract — every invocation, verify before ending the turn

```
✓ 1. Branch verified FIRST: `git branch --show-current` was RUN and its output
     pasted. Output = the default branch → `git switch -c <branch>` was RUN
     before any edit. NEVER work on main/master.
✓ 2. Phase-lint pre-flight guard RUN against the target phase (after the
     dependency/own-status gates, before any edit) — its 8 boxes were checked,
     not assumed. Any FAIL without `--force` → STOP with the fixed block; no
     edit happens on a non-atomic phase.
✓ 3. The gate was RUN (not assumed): commands + exit codes pasted.
✓ 4. `git add <files>` and `git commit -m "<type>(<scope>): <summary>"` were
     EXECUTED and the resulting sha is pasted. Describing a commit you did not
     run counts as NOT committed.
✓ 5. Unit finished (single-pass, --fix, or final phase)? Then `git push` and
     `gh pr create` were EXECUTED and **the PR URL is printed in the chat**
     (not every agent shows open PRs — the link in the chat is the contract).
     The PR body is NEVER empty: what it does, why, evidence, and
     `Closes #<n>` when issue-born. The body is passed with `--body-file`
     (real Markdown, NO `\`-escaped backticks — see Issue policy). AND the roadmap row (or fix-index entry)
     was updated to `done · [#<pr>](<pr-url>)` in a follow-up
     `docs: link PR #<n>` commit, pushed to the same branch. A `done` row
     without its PR link is an UNFINISHED unit. Unit not finished? Then
     NOTHING was pushed.
✓ 6. Clean-tree check LAST: `git status --porcelain` was RUN and its output
     pasted immediately before ending the turn. Any tracked modification —
     CODE OR DOCS (`docs/**` counts; doc updates left uncommitted are the #1
     close-out failure) — was committed before the turn ended. AND if the
     branch has an open PR: `git status -sb` shows the branch is NOT ahead of
     its remote (every commit pushed). A dirty tree or an unpushed commit on a
     PR-backed branch = the turn is NOT done.
✓ 7. Artifact language: explicit user instruction > the project's declared
     docs language > English. The CONVERSATION language never decides — a
     Spanish prompt still produces English commits/PRs/issues unless one of
     the first two says otherwise.
✓ 8. Descope guard applied to every issue created this turn (see *Descope
     guard* under *Issue policy*): each classified discovered vs. descope; any
     descope has a user-approved, dated `## Amendments` entry in the governing
     SPEC created BEFORE the issue, and the issue links it. No issue created
     this turn is the first record of a descope. No issues created this turn?
     Box passes trivially — state so.
✓ 9. Every out-of-scope finding discovered during implementation was classified
     with the Opportunistic finding policy, recorded in `decisions.md`, and
     handled only by its recorded decision. No finding? State `none`.
✓ 10. The closing `→ Next:` block is printed as the ABSOLUTE last output.
```

**Push policy — two regimes, by whether the PR exists yet.** Before the PR:
push happens exactly once, at the PR step — never mid-phase, never unasked,
never to the default branch. **After the PR exists:** every subsequent commit
on that branch (folded review findings, audit-blocker fixes, doc updates, the
`docs: link PR` commit) is pushed **immediately after committing** — an open
PR must always show the branch's latest state; CI and the merge gate judge
the remote, not your working copy. If, about to end the turn, any box is
unchecked: STOP and complete it now — a turn that ends with work implemented
but uncommitted, committed but unpushed (PR open), or committed but missing
its PR (finished units), is a FAILED turn, not a done one.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR, gate-before-commit, docs-language). Run `git branch --show-current` before any edit/commit; if `main`, create the working branch first (assistant only; the user may use `main`).
- **Phases are `P1, P2, …`.** The `<phase>` argument and every reference in `PLAN.md`/`TASKS.md`/`progress.md`/commits is `P1, P2, …` ("phase N") — **never** `S1`/`S2`/"Step N". If a plan you're handed uses `S1`-style labels, normalize it to `P1, …` before executing and note it in `decisions.md`.
- Implement only the requested scope — one phase (feature mode) or the whole SPEC (single-pass/fix). Never bundle phases unless asked.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).
- **When reality contradicts the plan** (a task is impossible, an assumption is wrong, a better path appears): update `TASKS.md`/`PLAN.md` and record why in `decisions.md` — never silently diverge from the written plan.
- **Dependency gate before any work** — see the section below. No edit, no branch, no commit happens for a unit whose dependency closure isn't merged, unless the user passed `--force`.
- **Phase-lint pre-flight guard before any edit** — see the section below, right after the dependency/own-status gates. No edit happens for a phase that fails the canonical 8-box phase-lint, unless the user passed `--force`.

## Context budget (hard rule — small models re-pay full context every turn)

- **File cap: read at most 10 files in full per phase**, beyond the unit's
  own docs (`SPEC.md`, the phase's `TASKS.md` section, `progress.md`).
  Targeted reads (≤ 50 lines of a named range) and grep/glob results do NOT
  count against the cap. About to exceed it → STOP reading; record what you
  know and what's still unverified in the phase's `Gotchas:` line, then
  proceed on what targeted reads can confirm, or report the blocker — never
  sweep the codebase.
- **Summarize, don't hold.** The moment a file yields the fact you needed,
  write the fact (with its `file:line`) into your working notes / the
  progress entry and work from the note. Never re-read a file already
  summarized; never quote whole files into the conversation.
- **Step 0 minimum set (fixed).** Discovery reads exactly: the agent guide's
  Workflow conventions + the architecture doc section covering the phase's
  declared `Layer:`. Nothing else by default; every additional doc counts
  against the file cap.

## Phase handoff record (`progress.md` — fixed schema)

Every phase ends by APPENDING one entry to the unit's `progress.md`. Feature
mode: the file `plan-feature-scaffold` created. Phased XS/S single-pass and
`--fix` units: create `progress.md` beside the SPEC on P1 (the SPEC's
checkboxes stay the task ledger; this file is the **handoff channel**).
Fixed schema — all five lines present, `none` is a valid value, free prose
is not:

```
## P<k> — <YYYY-MM-DD>
- Done: <the phase's delivered tasks, one line>
- Remains: <in-unit work still open, or none>
- Gotchas: <surprises, workarounds, or decisions the NEXT phase must know, or none>
- Files: <paths touched>
- Next: P<k+1> — <its title> | unit finished
```

The entry rides the phase commit (no sha in the entry — the commit that
carries it IS the phase's sha; `git log` resolves it). The next phase
starts in a **fresh conversation** and reads ONLY `SPEC.md`, its own phase's
`TASKS.md` section (or SPEC `## Phases`), and `progress.md` — this file IS
the handoff; never rely on session memory from a previous phase.

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
4. **All met** → proceed to the **own-status precondition** below.
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

### Own-status precondition (runs after the dependency closure is met, still before any edit)

Feature mode only (a fix has no roadmap-status equivalent — its own state is
the fix-index entry, unaffected). Read this unit's own roadmap row status
(the five-state machine — `docs/features/ROADMAP.md` → Status legend):

1. **`idea`** (or no `SPEC.md` with `## Design status: designed`) → STOP,
   before any edit:

   ```
   OWN-STATUS GATE — <NN>-<slug> BLOCKED (idea)
   This unit has no completed product design yet.

   → Next: /design-feature <slug> — write the product half first
     · proceed anyway, at your own risk → /execute-phase <NN> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

2. **`defined`** (product half designed, engineering half / planning
   artifacts not yet scaffolded) → STOP:

   ```
   OWN-STATUS GATE — <NN>-<slug> BLOCKED (defined)
   Product half designed; engineering half + planning artifacts not yet scaffolded.

   → Next: /plan-feature <slug> — scaffold the engineering half + TASKS.md
     · proceed anyway, at your own risk → /execute-phase <NN> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

3. **`planned`+** → proceed to the normal workflow.
4. **Legacy compat.** A row still reading a plain `planned` with no
   five-state history: check its `SPEC.md` product half. Complete
   (`## Design status: designed`) → treat as `defined`+`planned`, no
   redirect. Incomplete/absent → treat as `idea`, redirect per step 1. See
   `docs/workflow/MIGRATION.md`.
5. **`--force`** skips the STOP (never the check), same rule as the
   dependency gate: recorded in `decisions.md` before implementation begins;
   the autopilot (`ship-roadmap`) must never pass it.

## Phase-lint pre-flight guard (always, before any edit — after the dependency/own-status gates)

**Legacy-SPEC carve-out (check this first, before anything else in this
section):** if the target SPEC has **no `## Phases` section**, skip this
guard entirely — no lint run, no STOP — and fall straight through to the
*Workflows* section's legacy single-pass flow ("A SPEC without `## Phases`
… runs the legacy flow … end-to-end in one pass"). The guard below applies
only to a SPEC that carries a `## Phases` ledger.

Before touching any code, run the canonical 8-box phase-lint
(`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — the authoritative
copy, also quoted in `docs/features/_TEMPLATE/SPEC.md` `### Phases`) against
the **target phase** (its title, declared layer, task list, and done-when).

1. **All 8 boxes tick** → proceed to the normal workflow.
2. **Any box FAILs → STOP before any edit** and print exactly:

   ```
   PHASE-LINT GATE — <NN|n>-<slug> <phase> BLOCKED
   Failed boxes:
     ✗ <box label> — <one-line reason>
     [✗ <box label> — <one-line reason>] …

   → Next: /plan-feature <NN> — re-cut or split the phase (feature)
     · fix-type unit → /plan-fix — re-cut or split the phase
     · proceed anyway, at your own risk → /execute-phase <NN|--fix n> <phase> --force
       (the override is recorded in decisions.md — never silent)
   ```

3. **`--force`** skips the STOP (never the check): the lint still runs and its
   result is **recorded in `decisions.md`** (feature mode) or the fix SPEC's
   own notes / `progress.md` if present ("executed non-atomic phase: <failed
   boxes>, user-forced <date>") before implementation begins. `--force` is a
   user-only escape hatch — the autopilot (`ship-roadmap`) must never pass it.

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

Before implementation, consume frozen facts and decisions in
`docs/workflow/REPOSITORY_STATE.md` when present. Inspect directly only for an
absent fact; route contradictory evidence to `resolve-repository-state`.
Documentation, planned work, and inference never prove implementation.
Before any edit, require the ledger status to be `frozen`; a missing, `draft`,
`contradicted`, or `resolved` snapshot stops implementation and routes to
discovery or resolution first.

## Issue policy

Forge operations use the project's declared forge CLI (Workflow conventions —
examples use `gh`; translate if the project declares another forge).

> **Forge bodies are Markdown, not shell — never hand-escape them.** Backticks,
> `*`, `_`, `#`, `|` in an issue / PR / comment body are **formatting**; a `\`
> before them renders **literally** (`` \`code\` `` instead of `` `code` ``) —
> the #1 forge-formatting bug (worse on some agents than others). Fix it at the
> source: **never pass a Markdown body inline** (`--body "…"`, a quoted
> `<<'EOF'` heredoc, or single quotes — all of these preserve a stray `\` or
> mangle backticks). Instead **write the body to a file with the Write tool**
> (plain Markdown — real backticks, zero backslashes; scratchpad is fine) and
> pass **`--body-file <path>`**: `gh issue create --body-file <path>`,
> `gh pr create --body-file <path>`, `gh issue comment <n> --body-file <path>`
> (or the declared forge's equivalent). Short one-liners with no Markdown (e.g.
> a bare `Closes #12`) may stay inline. **Verify after creating:**
> `gh issue view <n> --json body` / `gh pr view <n> --json body` must show
> backticks rendering — a literal `` \` `` in the output means redo it with
> `--body-file`.

- **`--fix`:** every fix needs a tracked issue; create with `gh issue create --template fix.yml --body-file <path>` if missing, populating the body from the SPEC (body as a Markdown file — see the Markdown rule above). Use the returned number for branch and folder.
- **feature:** if it came from an issue, include `Closes #<n>` in the PR body. Don't create issues for features that didn't originate from one.
- **Language precedence for every artifact** (issues, PRs, commits, SPECs, docs): (1) an explicit user instruction in the prompt, else (2) the project's declared docs language (Workflow conventions), else (3) English. The conversation language is NOT a signal — being asked in Spanish never makes the PR Spanish. Non-matching source material gets translated first.

### Descope guard (run before creating any issue during this unit)

A cheap way to look finished is to quietly convert unfinished SPEC scope into a
follow-up issue — the unit reads as done, the scope silently moved to the
backlog. Before creating **any** issue while executing this unit, classify it
with the fixed **descope test**:

- **Descope** — the issue's content overlaps a SPEC acceptance criterion or a
  phase task that is **not fully delivered** in this unit.
- **Discovered work** — everything else (genuinely new, outside the SPEC's
  promises) — file it freely; that's what `triage-issue` is for.

**On a descope → STOP before creating the issue.** An issue may never be the
first record of a descope. The descope must first be recorded as an explicit,
**user-approved, dated SPEC amendment**:

1. Get explicit user approval for the descope **first** (ask; never
   self-authorize moving a criterion out of scope — the amendment row must
   never be written before approval is in hand).
2. **Only then** move the criterion/task out of the active `## Acceptance` (or
   `## Phases` ledger), and log it in the governing SPEC's `## Amendments`
   section (create the section if absent) with this canonical row format:
   ```
   - <YYYY-MM-DD> — descoped: "<criterion/task>" — approved by user — follow-up: #<n>
   ```
3. **Only then** create the follow-up issue, and **link the amendment** in its
   body. Immediately after, edit the `## Amendments` row to replace the
   `#<n>` placeholder with the real issue number, and commit that edit — a
   row still reading the literal `#<n>` placeholder is unlinked and fails
   `audit-pr`'s symmetric check.

`audit-pr`'s scope-bleed gate and `product-audit`'s recurrence signal both key
off this same `## Amendments` log — it is the single authoritative record of
every descope, defined once here.

### Opportunistic finding policy (run when implementation discovers work)

This policy applies to a **real, out-of-scope finding discovered while
implementing the current unit**: a lint warning, dead code, missing defensive
check, documentation defect, or similar work that the current phase did not
promise. A missing acceptance criterion or phase task is **not** a finding to
route: it remains in-scope work and must be delivered (or follows the descope
guard above).

**Current policy — one source of truth.** Use the complete policy below for
every target project. The target project's agent guide and docs may supply
evidence for a finding, but they do not override its thresholds, decision
order, actions, or decision-log fields. Do not combine local heuristics with
this policy. A configurable project override is future work: it needs a
versioned, machine-checkable schema before it can be introduced safely. Record
`source: workflow` in every decision row.

**Fallback policy — classify every finding in this order; the first matching
row wins.** Estimates are the smallest complete fix, including tests and docs.
Before assigning a decision, write a pass/fail result for every box in the
candidate row. Each row uses **its own** limits: never reuse an Autofix limit
for an Opportunistic Fix, or vice versa. A failed row cannot be selected; move
to the next row and record the failed box in `Why`.

| Decision | Pass only if every box is true | Action |
|---|---|---|
| **Autofix** | ✓ ≤15 changed lines; ✓ ≤2 files; ✓ every file is already modified in this phase; ✓ low implementation and regression risk; ✓ no public API, schema, migration, dependency, permission, architecture, or user-visible behavior change; ✓ the primary phase objective remains unchanged | Fix now in the current phase commit; run the normal verification gate. |
| **Opportunistic Fix** | ✓ ≤40 changed lines; ✓ ≤3 files; ✓ every file is already modified in this phase or directly covered by its test; ✓ directly supports the current phase's behavior or makes its touched code consistent; ✓ low implementation and regression risk; ✓ no public API, schema, migration, dependency, permission, or architecture change; ✓ no acceptance criterion is added, removed, or changed; ✓ the primary phase objective remains unchanged | Fix in the current phase commit; add or update the focused test when behavior is affected; run the normal verification gate. |
| **Create Issue** | Any Autofix or Opportunistic Fix box fails, the evidence is uncertain, the finding is independent of the current phase, or it needs product/risk judgment | Do not change code for the finding. Apply the descope guard before filing; then create a tracked issue and route it through `triage-issue`. |

**Numerical boundary check — run before the remaining boxes.** `≤` is
inclusive. An estimate of 16–40 lines and 1–3 files **fails Autofix size** and
**passes Opportunistic Fix size**. An estimate of more than 40 lines or more
than 3 files fails both fix decisions. At 0–15 lines and 1–2 files, check
Autofix first; if any non-size Autofix box fails, still check Opportunistic
Fix rather than creating an issue immediately.

**Decision ladder — follow literally.** If the estimate is 16–40 lines, never
write `Autofix`: write `Opportunistic Fix` only when every other Opportunistic
Fix box passes; otherwise write `Create Issue`. If the estimate is more than
40 lines, write `Create Issue`. Only a 0–15-line finding may be `Autofix`.

**Record before acting — no silent scope expansion.** For each finding append a
row to `decisions.md` (create `## Opportunistic finding decisions` and its
header if absent) before editing or filing:

```
| Date | Finding | Evidence | Estimate (lines/files) | Risk | Local files | Decision | Why | Policy source | Record |
|---|---|---|---|---|---|---|---|---|---|
| <YYYY-MM-DD> | <one line> | <file:line or command> | <n lines>/<n files> | <low/med/high> | <yes/no + paths> | <Autofix/Opportunistic Fix/Create Issue> | <failed/passed boxes> | <workflow> | <pending commit, commit sha, or issue #n> |
```

For `Create Issue`, write `pending issue` in `Record`, create the issue only
after the descope guard passes, then replace it with the real `issue #<n>` in
the same phase commit. If the decision is not deterministic from the evidence,
record `Create Issue — judgment required` and ask the user before filing or
changing code. This table is the execution log required for later review;
`known-issues.md` remains for blockers, not a substitute for this decision.

## Workflows

**Feature phase (default)** — `docs/features/<NN>-<slug>/`

1. Verify branch (create if on `main`). **P1 only:** if the planning artifacts
   (`docs/features/<NN>-<slug>/`) are still uncommitted, commit them first on the
   feature branch — `git add docs/features/<NN>-<slug> && git commit -m "docs(<NN>-<slug>): planning artifacts"` —
   so planning history stays separate from implementation.
2. Read `progress.md` first (the phase handoff record — fixed schema above;
   the last entry's `Remains:`/`Gotchas:` lines are the previous phase's
   message to you), then `SPEC.md` + the requested phase's `TASKS.md`
   section. That is the whole handoff — never rely on session memory from a
   previous phase, and honor the *Context budget* for everything beyond
   these files.
3. Implement only that phase (see *Implementation guidance*).
4. Run the gate (type-check, tests, build). **If red:** fix within the phase's
   scope and re-run — never commit red. If the failure can't be fixed within
   this phase's scope, record it in `known-issues.md`, leave the work
   uncommitted, and stop with a clear report.
5. Update the per-phase docs.
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"` — one commit per phase, conventional format. Run this; don't just describe what should be committed.
7. **Review checkpoint (recommended, not blocking)** — check the *Review checkpoint triggers* above; when one fires, **recommend** a hand-off to `/review-change` in the closing block, naming the trigger (see below). The user decides: review now, or continue straight to the next phase — the skill never forces the intermediate stop. The **end-of-unit review stays mandatory** (it feeds `audit-pr`, the merge gate). Never run the review in this skill's turn.

**Resuming an interrupted phase (stated contract — any agent must honor it).**
If, on entry, the unit branch already carries dirty files or commits belonging
to the requested phase (a prior run died mid-turn — e.g. the driver process
restarted), do **not** restart the phase from scratch: reconcile against
`TASKS.md` first — verify each ticked task's evidence actually exists (code
path / test present), untick any tick without evidence, then continue from the
first unticked task. Idempotent re-entry is the contract `workflow-status`'s
crash-recovery verdict `RESUMABLE` relies on. If the ledger contradicts the
commits in a way that has no unique next task, stop and report instead of
guessing (that is its `AMBIGUOUS` verdict — a human decides).

**Phased single-pass units — the default for both modes below.** Every fix
SPEC and every XS/S feature SPEC drafted since `plan-fix` 2.1.0 /
`plan-feature-scaffold` 1.8.0 carries a `## Phases` section (**≥ 2 phases**;
the final one is always `Hardening & PR`). When the SPEC has it, run **one
phase per invocation**: `execute-phase <NN> [P<k>]` /
`execute-phase --fix <n> [P<k>]` — `P<k>` omitted → the **first phase with an
unticked task** (deterministic; no judgement). The SPEC's checkboxes are the
execution ledger (there is no `TASKS.md`): tick each task with evidence, and
reconcile on re-entry exactly as *Resuming an interrupted phase* above
prescribes for `TASKS.md`. Each phase appends its handoff entry to a
`progress.md` beside the SPEC (created on P1 — see *Phase handoff record*). Implementation phases run the mode's steps below
but **STOP after the phase commit — no push, no PR** (the per-phase stop and
the turn contract's box 5 "unit not finished" rule). The final
`Hardening & PR` phase runs the close-out — the mode's "Mark done + open the
PR" step — **in its own invocation**: its pre-written tasks ARE the close-out
chain; execute them literally, in order. A SPEC **without** `## Phases`
(drafted before those versions) runs the **legacy flow** below unchanged,
end-to-end in one pass.

**Single-pass** — small feature with only a `SPEC.md`, no planning artifacts
(SPEC carries `## Phases` → phased per the block above; otherwise legacy,
all steps in one pass):

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"`.
7. **Mark done + open the PR — always (the close-out; in a phased SPEC these
   are the final `Hardening & PR` phase's tasks, run in their own
   invocation).** Flip the roadmap
   row to `done` (it's *built*; merge state lives in the forge, not the status —
   see *Marking done*), commit that flip, then `git push` and open the PR
   (body written to a file as Markdown, per the Markdown rule above):
   `gh pr create --base main --title "<type>(<scope>): <summary>" --body-file <path>`
   (put `Closes #<n>` in that body when issue-born). Then, with the URL `gh pr create`
   returned: **print it in the chat**, update the roadmap row to
   `done · [#<pr>](<pr-url>)`, commit (`docs: link PR #<n>`), and push again —
   the link commit rides the same open PR. A single-pass unit **never ends
   branch-only** — it always leaves an open, chat-linked PR, regardless of the
   review/audit still to come.
8. **Mandatory review hand-off** → `/review-change` (the required final quality step;
   see *Review checkpoint*), then `audit-pr` as the merge gate. Print the next step.

**`--fix`** — `docs/fix/<n>-<topic>/`, template `docs/fix/_TEMPLATE/SPEC.md`, index `docs/fix/README.md` (SPEC carries `## Phases` → phased per the block above; otherwise legacy, all steps in one pass):

1. Verify the issue exists (`gh issue view <n>`); if it doesn't, create it
   (`gh issue create --template fix.yml --body-file <path>`, body from the SPEC
   written to a Markdown file — per the Markdown rule above).
2. **If `docs/fix/<n>-<topic>/SPEC.md` already exists (e.g. from `plan-fix`), use it — do not re-draft.** Otherwise copy the template, fill every section, and register the entry in `docs/fix/README.md`.
3. Verify branch (`fix/<n>-<topic>`).
4. Implement the fix (no separate planning artifacts; the SPEC and its `## Phases` ledger are enough).
5. Run the gate.
6. Stage and commit: `git add <changed files>` then `git commit -m "fix(<scope>): <summary>"`.
7. **Mark done + open the PR — always (the close-out; in a phased SPEC these
   are the final `Hardening & PR` phase's tasks, run in their own
   invocation).** Set the
   `docs/fix/README.md` entry's status to `done` (built, not yet merged), commit,
   `git push`, then open the PR with the body written to a Markdown file (per the
   Markdown rule above): `gh pr create --base main --title "fix(<scope>): <summary>" --body-file <path>`
   (the body includes `Closes #<n>`). Run the commands. Then, with the returned URL: **print it in the chat**,
   set the `docs/fix/README.md` entry to `done · [#<pr>](<pr-url>)`, commit
   (`docs: link PR #<n>`), and push again. A fix **never ends branch-only** —
   it always leaves an open, chat-linked PR.
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

**Cadence.** Feature mode: after each completed phase, the closing block
**recommends** the hand-off whenever a *Review checkpoint trigger* fires
(layer boundary, accumulation, or sensitivity — see above), naming which one —
a suggestion the user may skip to keep executing phases; the skill never
blocks on an intermediate review. What is **never optional** is the end: every
unit gets one `review-change` pass before merge (single-pass and `--fix`
included — they have no intermediate phases, so the end review is their only
one).

**Finishing a unit (single-pass, `--fix`, or a feature's final phase): the last step
is always an open PR.** Mark the unit `done`, commit the flip, push, and `gh pr create`
(see the mode steps above) — regardless of the review/audit still to come. Then hand
off to `/review-change` (mandatory), which feeds `audit-pr` (the merge gate).

**Adversarial pass at that mandatory end review.** `review-change` evaluates its
own recommendation checklist there (`L`/sensitive change, reviewer not the
fleet's strongest or weaker than the author, or a single model family on a
`≥M` change) and — only when a box fires — recommends `--adversarial N`
(N=2 default, N=3 on a security/auth surface or a single-family fleet) instead
of its default single-reviewer pass. This is evaluated once, at that mandatory
end review; it does not change the trigger-based checkpoint cadence above.

Checkpoint hand-off (print it — every invocation ends by suggesting the next
step; when a trigger fires, the review is the recommendation, continuing is a
listed alternative — the user picks):

```
Phase <N> done and committed. Review checkpoint (recommended) — <trigger name> fired: <one-line reason>.
→ Next: /review-change — it reviews the branch at its own model/effort
  · skip the checkpoint → /execute-phase <NN> <next phase> (the mandatory end review still covers everything)
  · findings (if you review) → fold fix-now into the branch; non-fix-now → /triage-issue; then re-review
```

`<trigger name>` is one of `layer boundary`, `accumulation`, or `sensitivity`
(see *Review checkpoint triggers*); `<one-line reason>` cites the evidence
(e.g. "next phase declares `api`, this one was `domain`", "612 lines / 11
files since `a1b2c3d`", "phase touched auth middleware"). No trigger fired?
Omit the checkpoint line entirely and go straight to naming the next phase.

### Folding review / audit findings (a first-class mini-cycle)

**`/fold-findings` is the standalone skill for this cycle** — it carries the
full frozen-classification rule and forbidden list (no known-issues dump, no
severity downgrade, no test loosening, no suppression-as-fix) as a fixed,
independently-invocable contract; prefer it as a fresh hand-off (its own
turn, its own model/effort) whenever one is available. The checklist below is
the in-context / portability fallback for folding inline within this skill's
own turn (e.g. no slash-command menu, or an agent that folds without leaving
its current context).

When `review-change` findings (fix-now) or `audit-pr` blockers are folded back
into a branch that already has an open PR, the fold is complete **only** when
every step below ran — fixing the code and stopping is the classic way findings
end up "solved" locally but absent from the merged PR:

```
✓ Fixes implemented (scope: only the routed findings — nothing extra)
✓ Gate RUN and green (exit codes pasted)
✓ Per-phase / unit docs updated where the finding touched them
  (known-issues.md entry resolved? progress.md notes the fold)
✓ Each folded finding's row in the unit's `review-findings.md` ledger (if one
  exists — the ledger is optional; a unit with no fix-now findings has none)
  flipped `folded: no → yes` — the one and only ledger state transition, owned
  solely by this fold cycle
✓ `git add` + `git commit` RUN (sha pasted) — e.g.
  `fix(<scope>): fold review findings — <summary>`
✓ `git push` RUN (PR is open → every commit pushes immediately)
✓ `git status --porcelain` RUN → empty; `git status -sb` → not ahead of remote
```

Then hand back to the gate that sent you (`/review-change` re-review, or
`/audit-pr` re-audit). Never report findings as resolved while any box is
unchecked — an unpushed fix does not exist for CI, the reviewer, or the merge.

Final-phase / single-pass / fix hand-off:

```
<unit> implemented, gate green, marked done.
PR opened: <FULL PR URL — always printed here; not every agent shows open PRs>
Roadmap/fix-index row: done · #<n> (linked and pushed)
→ Next: /review-change (mandatory final review)
  · clean    → /audit-pr (merge gate) → human merges
  · findings → fold fix-now into this PR; non-fix-now → /triage-issue; re-review
  · docs site declared (documentation map has a `Docs site` block) →
    /generate-docs <unit> — document what this unit changed; the generated
    pages ride this same PR (commit + push them before the merge gate)
```

The `/generate-docs` line appears **only** when the project's documentation
map declares a `Docs site` block — never suggest it otherwise (a project
without a docs site has nowhere to publish).

This never auto-merges and never skips the per-phase stop: one phase at a time,
human in the loop, gate enforced each phase, every unit reviewed before merge.

### Marking done (status semantics)

A unit flips to **`done` when its last step runs — opening the PR — even though it
isn't merged yet.** `done` means *built and PR-open*; merge state lives in the forge
(the open/merged PR), not in the status. **A `done` row always carries its PR
reference** — `done · [#<pr>](<pr-url>)` — added right after `gh pr create`
returns the URL (follow-up `docs: link PR #<n>` commit on the same branch);
`done` without a PR link is the tell-tale of an unfinished close-out. The flip is a doc change, so it rides the
PR-bound commit (never a lone commit on the default branch). **Never merge with docs
still pending, and never drop the issue / fix-index entry before merge** — those are
`audit-pr`'s gates, not removed at done-time.

**One phase = one session.** Never execute two phases in one conversation on a
non-frontier model — models degrade over long horizons; a fresh session per
phase preserves the cheap-execution guarantee. The `/loop` batch shape below
already clears and re-invokes per phase; this rule is *why* it does — an
external orchestrator or a by-hand loop must honor it the same way (see
*Portability*, "No `/loop`").

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
needed. **Trigger-based checkpoints are skipped in this mode, but the end review is
not optional:** at the end, **mark done + open the PR**, then run `/review-change`
once (the mandatory final review) → `audit-pr`.

Use this when the SPEC is solid and you want to review the whole branch at once
rather than at each intermediate checkpoint. For incremental, phase-by-phase
review, stick to the default (manual re-invocation + checkpoint hand-offs).

**No `/loop` on your agent?** Two vendor-neutral equivalents: (a) an
**external orchestrator** loops this skill headless, injecting the
driver-facing envelope requirement (see `orchestration-envelope`) so each
invocation's `state`/`next.recommended` say exactly what to run next
(`CONTINUE` → next phase on a cheap tier, `READY_FOR_REVIEW` → review on a
strong tier); protocol + driver skeleton in `docs/workflow/ORCHESTRATION.md`.
(b) Run the same loop by hand: after each phase, re-invoke this skill with the
next phase (`execute-phase <NN> <next>`) — the closing block always names the
exact next command — and keep the mandatory end review. The sequence is
identical; only the automation differs.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  planning, review, and audit need your **strongest** model; mechanical
  execution may run cheaper. Never review a change with a model weaker than
  the one that wrote it — and prefer a different model family than the
  writer's: same-family instances share training blind spots, cross-family
  decorrelates errors.
- **No `/loop`** — re-invoke the skill by hand per phase, following its closing
  `→ Next:` block each time (see *Batch execution* above).

## Relationship to other skills

- Planned by `plan-feature` (features) or `plan-fix` (fixes); executes their SPEC.
- **Hands off** to `review-change` — recommended at a trigger-based checkpoint
  (layer boundary, accumulation, or sensitivity; skippable), **mandatory** when
  finishing a unit — it runs at its own model/effort, not composed in this
  skill's turn. `fix-now` findings fold back here; non-fix-now routes through
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
- **The tree is clean and the remote current:** `git status --porcelain` is empty
  (docs included) and, when the branch has an open PR, nothing is left unpushed.
- **A finished unit additionally:** is flipped to `done`, has its PR opened (never
  branch-only) with **the PR URL printed in the chat**, and prints the mandatory
  `/review-change` hand-off as the next step.
