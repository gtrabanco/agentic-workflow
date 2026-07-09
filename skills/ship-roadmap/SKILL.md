---
name: ship-roadmap
user-invocable: true
version: 1.11.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
argument-hint: "[--fullauto] | --continue [--fullauto]"
description: >
  End-to-end autopilot: found the project if needed (one upfront interview — product, features,
  stack, architecture, quality bars, ops, autonomy, budget), create or adopt the complete roadmap,
  then ship it feature by feature through the full workflow (plan → execute → review → PR → merge
  gate) driven by /loop, an external orchestrator (see docs/workflow/ORCHESTRATION.md), or manual
  re-invocation, with no further questions. Features exhausted ≠ run over: an issue sweep
  then inventories open issues plus the run's own documented residue (known-issues, trade-offs,
  postponed findings), triages everything, and ships the fix-now issues through the same stages.
  Default: opens PRs, the human merges;
  --fullauto merges MERGE-READY PRs under non-negotiable safety floors. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "ship the
  roadmap", "build the whole app from the roadmap", "run the full workflow on autopilot",
  "ship-roadmap", "autopilot this project".
---

# Ship the roadmap (autopilot)

Run the entire agentic workflow unattended between human decision points: one
interactive founding turn that asks **everything**, then a driver-fired build
loop (Claude Code's `/loop`, an external orchestrator, or manual re-invocation
— see the launch contract) that plans, implements, reviews, opens and
(optionally) merges one PR per
feature until the roadmap is done — then keeps going: an **issue sweep**
inventories open issues and the run's own documented residue (known-issues,
trade-offs, postponed findings), triages it all, and ships what's fix-now —
ending in a final report that recommends
issues, newly discovered features, and the product-audit cadence.

This is the **expensive** skill: a full run burns planning, implementation and
review tokens for every roadmap feature. It exists to spend them well — strong
tiers only where judgment lives, cheap tiers where code gets typed, humans only
where a wrong call is expensive to undo.

> **Ultracode tip:** for large roadmaps, the user can enable the `ultracode`
> session setting (`/effort ultracode`) before starting the loop — the conductor
> then fans out independent sub-work (review axes, report evidence gathering)
> more aggressively. It is a session toggle only the user can set; this skill
> cannot declare or enable it (`effort:` accepts only low/medium/high/xhigh/max).

## Turn contract — verify before ending the turn

```
✓ Exactly ONE stage advanced (or a terminal banner printed) and ONE line appended to the run log
✓ Nothing was merged outside the --fullauto floors; nothing asked mid-run
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed, then the machine envelope (fenced ```json — see ## Machine envelope) as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- You have a roadmap — or at least a product idea and a feature list in your
  head — and want the whole application built with supervision only at merge
  points and at the end.
- **Not** for one feature (`plan-feature` → `execute-phase`), one bug
  (`plan-fix`), or exploratory work. The autopilot ships a locked scope; it is
  the wrong tool when the scope is still being discovered.

## Step 0 — Discover the project (always first)

Read before acting: the agent guide (`CLAUDE.md`/`AGENTS.md`) and its
**Workflow conventions** (forge CLI, verification gate, docs language), the
documentation map, `docs/features/ROADMAP.md`, the fix index, the architecture
doc, and `.github/` templates. Then establish run context:

1. **Substrate present?** CLAUDE.md with Workflow conventions + doc map +
   roadmap + fix index → founding is skipped and interview rounds 3–4 collapse
   to confirmations of what the docs already state. Missing pieces → founding
   will create them.
2. **Workflow skills installed?** Verify `plan-feature`, `execute-phase`,
   `review-change`, and `audit-pr` are actually available in this environment
   (e.g. listed by the skills CLI or present under the skills directory), and
   **record the discovered skills-directory path in the decision record** —
   subagent prompts reference it. Missing → stop and instruct:
   `npx skills add gtrabanco/agentic-workflow`. Without these files the loop
   silently degrades.
3. **Run in progress?** `docs/features/SHIP_DECISIONS.md` exists — on any
   branch — or a `docs/ship-founding` PR is open → a run exists: `--continue`
   resumes it; a bare `/ship-roadmap` prints run status and the resume command
   instead of re-interviewing (never a second founding).
4. **Repo shape:** empty greenfield vs existing history; current branch; dirty
   tree (an unexplained dirty default branch is a stop condition, never
   something to clean up silently).

## Process

### Mode A — Found & launch (interactive): `/ship-roadmap [--fullauto]`

**1. The interview — all questions up front, then silence.** Small batched
rounds; recommended defaults on every question; skip what discovery already
answered. After Round 6 locks, **no further questions for the entire run** —
every later decision is made silently and logged with a one-line rationale.

| Round | Covers |
|---|---|
| 1 — Product | What it is, for whom; scale ceiling (solo / team / thousands of customers); lifespan & ambition (throwaway, internal, long-lived production). Calibrates every ceremony decision downstream. |
| 2 — Features | The feature list (or "elicit" → draft one from the goal); must-have vs can-wait; ordering constraints; explicit out-of-scope. |
| 3 — Stack & architecture | Stack decided? else recommend from features/constraints. Architecture chosen? else recommend the **lightest structure proportional to Round 1** — a solo tool gets a flat modular layout, a thousands-of-customers system gets enforced boundaries; never default to DDD, hexagonal, or any named pattern. Platform/runtime constraints, library vetoes. |
| 4 — Quality & ops | Test depth (smoke / workflow default / strict); whether a11y, SEO, i18n, perf budgets apply (proposed from platform type); deploy target + scaffold CI?; secrets posture; **confirm the proposed verification gate commands** — they become the gate every phase must pass. |
| 5 — Workflow & autonomy | Docs language (default English); forge + CLI (**verify with a real authenticated call now**, e.g. `gh auth status` — not mid-loop); **git workflow** (default `branches`: one active unit, sequential, no worktrees — `worktrees` only if the user declares it and their tooling manages them; recorded in the Workflow conventions and honored by every stage); merge policy (default human-merge vs `--fullauto`); the sensitive-area list (defaults: auth, payments, destructive migrations/data deletion, secrets, CI config — **seeded with every integration named in rounds 2–4**, e.g. the payment processor or auth provider the user mentioned); budget caps (default: max iterations = 4× roadmap feature count; 2 retries per red gate; 2 review-fix and 2 audit-fix cycles; optional "pause after N shipped features" checkpoint and milestone stop lines); model-routing confirmation; recommend enabling `ultracode` for the loop. |
| 6 — Confirm & launch | The drafted roadmap (numbers, order, deps, sizes) and the full decision record, presented for **one last edit**. Then: founding artifacts written, exact `/loop` command printed. |

**2. Founding (only what's missing).** Compose `init-workspace`'s process
in-turn (both opus/high — within the ≥ rule), **pre-fed with the interview
answers** so it asks nothing. Branch discipline:

- **Empty repo:** the scaffold (CLAUDE.md, docs/, .github/, completed
  ROADMAP.md, decision record) is the repo's **initial commit on the default
  branch** — there is no history to protect and no base for a PR yet.
- **Existing repo:** founding goes on a `docs/ship-founding` branch as a PR.
  Default mode: **stop after the interview** — print the PR and require it
  merged before the loop starts (building features against an unmerged
  substrate would stack PRs). `--fullauto`: gate the founding PR with
  `audit-pr` like every other PR, then merge it.

**3. The roadmap — founding IS batch design.** The interview's rounds 2–4
(features, quality/ops, workflow) already collected every product-definition
answer a `design-feature` capability closure would ask — founding is design
for every feature it names, not a shortcut around it. Adopt existing entries
(never renumber), fill gaps the interview surfaced, append elicited features.
If absent, write the complete table: NN in dependency-respecting order, slug,
**status `idea`** (the locked founding decisions are the design record, but
no per-feature `SPEC.md`/capability-closure artifact exists yet — that gets
written JIT per feature, see ADVANCE → DESIGN below), depends-on, one-line
summary with a **provisional XS/S/M/L size in the summary text** (the
template's five-state legend and column schema stay exactly as they are —
`plan-feature`/`plan-feature-scaffold` re-size authoritatively at planning
time; a size change is logged silently). Greenfield: **feature 01 is always
the project skeleton** (stack init, gate wiring, CI if requested), sized S —
founding scaffolds it immediately (composing `design-feature` +
`plan-feature-scaffold` in-turn, pre-fed from the interview, no questions) so
it lands directly at **status `planned`**, never left at `idea` — and **every
other feature's depends-on closure must include 01** (directly or
transitively), so SELECT can never start a feature on a default branch that
lacks the skeleton.

**4. The run state — two artifacts, deliberately split:**

- `docs/features/SHIP_DECISIONS.md` — **committed** (rides the founding
  commit/PR): run mode, safety floors, sensitive-area list, budget caps, stop
  lines, model routing, docs language, and a digest of every locked interview
  answer. It is the durable, auditable policy: a crash, another machine, or a
  fresh clone recovers the full run policy without re-interviewing.
- `docs/features/.ship-run.log` — **untracked** (founding appends it to
  `.gitignore`): the append-only iteration log — one line per iteration
  (`date | NN-slug | stage | outcome | evidence: SHA / PR# / verdict`), silent
  decisions with rationale, partial-stage markers, verdict↔SHA bindings.
  Machine-local mechanics; committing it would conflict across every open PR.

**5. Print the launch contract** — detect which driver this environment has
and print the matching command. **Three equivalent drivers** (the loop is the
contract; who re-invokes it is an implementation detail):

| Driver | When | Launch |
|---|---|---|
| **`/loop`** (Claude Code) | The agent has a self-re-invoking loop primitive | `/loop /ship-roadmap --continue` |
| **External orchestrator** | Any agent invocable headless (a shell loop, CI, your own program) | loop: invoke `/ship-roadmap --continue`, parse the machine envelope, re-invoke while `state: "CONTINUE"` — see `docs/workflow/ORCHESTRATION.md` |
| **Manual** | Neither of the above | re-run `/ship-roadmap --continue` yourself after each iteration; each ends with the exact next command |

Default launch contract text (adapt the first line to the detected driver):

```
Founded. Start the autopilot with:

  /loop /ship-roadmap --continue        (Claude Code)
  — or loop `/ship-roadmap --continue` from your orchestrator/by hand;
    every iteration ends with a machine envelope: re-invoke while
    state is CONTINUE (see docs/workflow/ORCHESTRATION.md)

Stop when an iteration's first line is SHIP: COMPLETE, SHIP: BLOCKED, or
SHIP: STOPPED (envelope state OK, BLOCKED, or FAILED). Iterations are
idempotent and resume cleanly; stopping at any time is safe.
```

For a fullauto run the command is `/ship-roadmap --continue --fullauto` (under
whichever driver) — the flag must ride every iteration, because auto-merge is
dual-keyed: the flag on the running command **and** `merge: fullauto` in the
committed decision record (see Merge policy). One key without the other runs
in default mode.

Each firing is a fresh `/ship-roadmap --continue` turn (on Claude Code's
`#claude` branch, at this skill's pinned tier; elsewhere, at whatever tier the
driver chose — judgment iterations deserve your strongest model). Iterations
after a terminal banner are cheap no-ops that re-print the same banner — so a
missed stop costs tokens, never correctness.

### Mode B — One loop iteration: `/ship-roadmap --continue [--fullauto]`

Every iteration is stateless-by-reconstruction — no memory is assumed between
turns:

1. **RECOVER.** Read `SHIP_DECISIONS.md` (missing → `SHIP: STOPPED — no run
   policy; run /ship-roadmap first`) and `.ship-run.log` (missing on this
   machine → recreate empty; policy lives in the committed record). **Verify
   the substrate landed:** `SHIP_DECISIONS.md` must exist on the default
   branch — an open `docs/ship-founding` PR means the substrate isn't merged
   yet → `SHIP: BLOCKED` with "merge the founding PR" as the unblock map.
   Read ROADMAP.md; query the forge for open/merged PRs on `feat/*`, `fix/*`,
   `docs/ship-founding` and `docs/ship-report` heads; check git state.
   Reconcile: a feature flips to `done` when its **PR opens** (built, not merged
   — see the PR stage), so a `done` row with an open PR is awaiting a human merge
   (default mode), not finished shipping. A **merged** PR needs no status change
   (already `done`) — it means *shipped*, and **unblocks its dependents** + counts
   toward `SHIP: COMPLETE`. The done-flip rides the PR-bound commit, never a lone
   commit on the default branch. A dirty feature branch from a crashed phase
   is handed to the next phase subagent to finish or restart (counts against
   the red-gate retry cap). Uncommitted changes on the default branch confined
   to `docs/features/<NN-slug>/` + ROADMAP.md that match an in-flight roadmap
   row are the loop's own planning output — resume that feature; the
   dirty-default stop fires only for changes matching no roadmap unit.
2. **STOP-CHECK.** Evaluate the stop conditions (below). Terminal → write or
   refresh the final report, open the report PR, print the `SHIP:` banner +
   status table, end the turn.
3. **SELECT one unit.** Priority order, first match wins:
   1. **Blocking fixes first.** A fix-index entry classified fix-now whose
      subject blocks the next startable feature (same module, a dependency's
      defect, or a red gate cause) → its fix is the selected unit
      (`plan-fix` → `execute-phase --fix` through the normal stages). Fixes
      that block nothing wait for the report's triage batch.
   2. An in-progress feature's next pending stage.
   3. The next feature at status `idea` **or** `planned` whose depends-on rows
      are all **merged** (forge state, not merely `done` — a `done` dep with
      an open PR isn't on the default branch yet, so a dependent cut from it
      would lack its code). A `defined`-but-not-`planned` row is treated the
      same as `idea` here — its design exists but its planning artifacts
      don't, so it still needs a scaffold pass before PLAN.
      **Verify the closure transitively:** a dep row marked merged whose own
      dependencies aren't merged means the roadmap's statuses are inconsistent
      → `SHIP: STOPPED` (substrate invariant broken), never build on top of it.
      → `idea`/`defined`: DESIGN first (see ADVANCE). `planned`: → PLAN
      directly.
   4. **Issue sweep — features exhausted, run NOT over.** Every roadmap feature
      is `done` **and merged** but the sweep hasn't completed → the run
      continues with issues; finishing the features is not finishing the run:
      1. **INVENTORY (once per run, its own iteration).** Enumerate (a) every
         open forge issue and fix-index entry; (b) every *documented residue*
         the run itself generated — each feature's `known-issues.md`, the
         trade-offs in `decisions.md`, and every review report's
         postponed/intentional-tradeoff findings. For residue items that are
         real defects/gaps but have no tracked issue yet, **file the issue
         now** (forge CLI; body cites the doc + trigger). **The issue body is
         Markdown — write it to a file and pass `--body-file`, never an inline
         `--body "…"`/heredoc that leaves `\`-escaped backticks** (see
         Guardrails). Log the full inventory (issue #s + sources) to the run log.
      2. **TRIAGE (compose `triage-issue` in-turn, equal tier).** Classify
         each inventoried issue against the CURRENT codebase. fix-now → it
         becomes a selectable unit; postpone / wontfix / promote-to-feature →
         the dated verdict is recorded on the issue and carried into the
         report (promotions become report feature-proposals, never in-run
         scope).
      3. **SHIP the fix-now issues** one unit at a time through the normal
         stages (`plan-fix` → EXECUTE (`--fix`) → REVIEW → PR → AUDIT), same
         budget caps, floors, and merge policy as features.
   5. Nothing startable → `SHIP: BLOCKED` with the **unblock map** ("merging
      #12 unblocks 05 and 07") and the resume command.

   `execute-phase`'s own dependency gate stays active inside every subagent —
   it's the belt to this braces. **The autopilot never passes `--force`:** a
   gate stop inside a subagent parks the feature with the unmet chain recorded;
   forcing through unmet dependencies is a human-only decision, made outside
   the loop.
4. **ADVANCE exactly one stage:**
   - **DESIGN (mid-run `idea`/`defined` unit only)** — compose `design-feature`
     in-turn (equal tier, opus/high — within the ≥ rule already stated for
     founding), **deriving the product half strictly from the locked
     `SHIP_DECISIONS.md` record — no new questions, ever** (the "no further
     questions after the interview" contract this skill already enforces for
     every other stage applies here identically). Walk capability closure
     from what rounds 2–4 already answered for this feature; stamp `## Design
     status: designed` and promote the roadmap row `idea → defined` on
     success. Then compose `plan-feature-scaffold` in the same iteration to
     promote `defined → planned` (both writes are the same JIT pass — a
     feature never sits mid-promotion between iterations). **Undesignable
     from the locked record** (the feature as scoped contradicts a locked
     decision, or needs an answer rounds 2–4 never covered) → do **not**
     guess and do **not** ask: emit `NEEDS_INPUT`, **park the unit** with the
     specific gap recorded (mirrors a red-gate park — see Stop conditions),
     and SELECT continues with the next startable unit this same run (or ends
     the iteration per the capacity guard if none remain). A parked
     undesignable unit is picked back up only by a human answering the
     recorded question and re-running `/design-feature <slug> "<answer>"`
     directly — the autopilot never re-asks it.
   - **PLAN** — compose `plan-feature` in-turn via its scoped path (equal
     tier). Every unit reaching PLAN is already `planned`-bound (DESIGN ran
     first for any `idea`/`defined` unit), so `plan-feature`'s own redirect
     gate always passes here. The interview path is **forbidden** mid-run:
     SPEC gaps are resolved silently from the decision record and logged. JIT
     planning that reveals the feature's premise is wrong (obsolete, absorbed,
     impossible on this stack) → mark it blocked with the contradiction
     recorded; never re-ask.
   - **EXECUTE** — run each phase in a **fresh cheap-tier context**: on Claude
     Code, spawn one subagent per phase with `model: sonnet` (the override is
     the only mechanism that runs *below* the conductor's turn tier); on an
     agent without subagents, the equivalent is one headless invocation per
     phase driven from outside (see `docs/workflow/ORCHESTRATION.md`), or —
     last resort — executing the phase in THIS turn while noting in the run
     log that it ran at the conductor's tier. Whatever the mechanism, the
     phase executor is instructed to read the **installed `execute-phase`
     SKILL.md first** (at the skills directory
     located in Step 0 and recorded in the decision record — e.g.
     `.claude/skills/execute-phase/SKILL.md` in Claude Code) and follow it for
     exactly one phase (or the single-pass mode for XS/S): tests-first where it
     applies, gate green, one commit, per-phase docs. Two autopilot overrides
     to its recipe: (a) **never ask** — SPEC ambiguity is resolved from the
     committed decision record with the most conservative reading, and the
     assumption is surfaced in the phase docs so the conductor logs it;
     (b) the **P1 planning commit also carries `ROADMAP.md`** (the feature's
     `in-progress` flip rides it; the **`done` flip rides the PR-stage commit**
     when the PR opens — for XS/S single-pass features the `in-progress`→`done`
     flips ride the single implementation/PR commit; any flips left at run end
     ride the report commit). Never bundle phases into one subagent.
   - **REVIEW** — compose `review-change` in-turn (equal tier), with
     **risk-proportional cadence**: XS/S and non-sensitive M features get ONE
     review at branch end (matching execute-phase's documented batch pattern);
     L or sensitive-flagged features get a checkpoint every 2 phases. Persist
     the review report into the feature's docs folder. fix-now findings → one
     sonnet fixer subagent + gate + commit **+ push (when the PR exists) +
     clean-tree check (step 5)** (max 2 review-fix cycles); every
     **non-fix-now finding is triaged** (review-change composes `triage-issue`)
     → tracked forge issue / documented decision, never inlined.
   - **PR** — **flip the feature to `done`** (built, not merged; the flip rides
     this PR-bound commit), then push and `pr create` against the default branch
     with the PR template and `Closes #N` where issue-born (forge CLI per Workflow
     conventions). With the returned URL: **print it in the iteration output**,
     update the roadmap row to `done · [#<pr>](<pr-url>)`, commit
     (`docs: link PR #<n>`) and push — the stage is NOT complete until the row
     carries its PR link. The PR always opens — a unit never ends branch-only.
   - **AUDIT** — compose `audit-pr` in-turn (equal tier); bind the verdict to
     the PR's head SHA in the run log, and **print the PR's full URL next to
     the verdict in the iteration output** (the human merging works from the
     chat, not from a CI monitor). MERGE-READY → default mode logs and
     moves on; `--fullauto` checks the floors **including audit-pr's pre-merge
     cleanliness checklist (nothing uncommitted/unpushed/unpulled — pending
     work means: push, wait for CI, re-audit; never merge on a stale
     verdict)**, **records the merge intent in the run log first**, then
     merges. BLOCKED → in-scope blockers go to a
     sonnet subagent next iteration (max 2 audit cycles, then the feature is
     parked and the loop moves on); the fixer's cycle ends committed AND
     pushed (step 5), so the re-audit judges the real branch.

   The stage sequence is per-feature and size-dependent — always **one stage
   per iteration**: a feature starting at `idea`/`defined` gets a DESIGN stage
   first; one already `planned` (including the founding-scaffolded feature 01)
   skips straight to PLAN. XS/S/M → [DESIGN] → PLAN → EXECUTE (all phases /
   single pass) → REVIEW → PR → AUDIT; L or sensitive-flagged → [DESIGN] →
   PLAN → EXECUTE (≤2 phases) → REVIEW → EXECUTE (next ≤2) → REVIEW → … → PR
   → AUDIT.
5. **CLEAN CLOSE-OUT — verify before logging the stage complete.** A stage
   only counts as advanced when the conductor has RUN and checked, on the
   unit's branch: `git status --porcelain` → empty (no tracked modification
   left behind — **docs included**: progress/testing/known-issues/roadmap
   edits ride the stage's commit, never linger), and — once the unit's PR
   exists — `git status -sb` after `git fetch` → not ahead of the remote
   (every commit pushed; the PR and CI must see what was actually done).
   A subagent that "finished" but left the tree dirty or the branch unpushed
   did NOT finish: the conductor commits/pushes the remainder itself (same
   stage, same iteration) or marks the stage partial. This check is
   unconditional for EXECUTE, REVIEW fix cycles, PR, and AUDIT fix cycles.
6. **LOG** one line to `.ship-run.log`; print `→ Next: <unit> (CONTINUE)` (the
   canonical next-step shape; `CONTINUE` stays the loop's keep-going signal),
   then the machine envelope. **Say WHY the turn is ending** — one explicit
   line before the `→ Next:` block, always one of: "iteration complete — one
   stage advanced (normal; re-invoke to continue)", "parked <unit>: <exact cap
   hit — red-gate retries / review ping-pong / audit ping-pong / 3 partials /
   planning contradiction>", or the terminal banner's reason. A turn ending
   silently reads as a crash on agents without `/loop` — never leave the stop
   unexplained.

**Capacity guard:** an iteration that cannot finish its stage in one turn
(e.g. an oversized review) writes a partial-stage marker and ends cleanly;
three consecutive partials on the same stage parks the feature as blocked.

### Model routing

| Stage | Tier | Mechanism |
|---|---|---|
| Interview, founding, roadmap creation | opus/high | this skill's frontmatter; composes `init-workspace` (equal tier), answers pre-fed |
| Recovery, routing, logging | opus/high | in-turn (tiny token volume; a subagent would add cost, not save it) |
| JIT feature design (mid-run `idea`/`defined` unit) | opus/high | compose `design-feature` + `plan-feature-scaffold` in-turn (equal tier, deriving only from `SHIP_DECISIONS.md` — no new questions) |
| JIT feature planning | opus/high | compose `plan-feature` in-turn (its internals are opus/high–medium: ≥ holds) |
| Phase execution, single-pass, fixes | **sonnet** | subagent per phase with explicit `model: sonnet` override, following `execute-phase`'s SKILL.md |
| Review checkpoints | opus/high | compose `review-change` in-turn (equal tier — orchestrators compose what they synthesize) |
| Merge gate | opus/high | compose `audit-pr` in-turn (the highest-stakes automated verdict; must share one turn with the floor checks) |
| Forge/git mechanics | — | Bash tool calls; no model judgment involved |
| Final-report evidence gathering | haiku (optional) | fan-out subagents for grep-shaped per-feature log collection when ultracode is on; synthesis stays opus |
| `product-audit` | opus/max | **never composed, never imitated by a subagent** — its effort (max) exceeds the conductor's (high) and a subagent override cannot carry `effort: max`. Hand-off only: the report prescribes when to run it. |

### Merge policy

**Default — the human merges.** The autopilot opens PRs and never merges. It
continues with the next feature whose dependencies are all merged (new branches
always cut from the freshly pulled default branch); when everything remaining
waits on human merges, it stops with `SHIP: BLOCKED` + the unblock map. After
merging, re-run the same launch command (`/loop /ship-roadmap --continue`, plus
`--fullauto` on fullauto runs) — recovery records the merges (the rows are already
`done` from PR-open), unblocks the dependents, and resumes.

**`--fullauto` — dual-keyed.** Auto-merge requires **both** the `--fullauto`
flag on the running command **and** `merge: fullauto` in the committed decision
record — a stray flag or a stale record alone can never enable it. The **first
feature PR of a greenfield run is always human-merged** (calibration: inspect
one complete artifact — code, tests, docs, review trail — before delegating).
Non-negotiable floors, evaluated fresh immediately before every merge —
**fail-closed: a floor that cannot be evaluated counts as breached**:

1. **Never merge red** — re-verify CI status via the forge CLI at merge time;
   the audit verdict is evidence, fresh green CI is the precondition. In a
   no-CI project the accepted evidence is a **fresh local verification-gate run
   on the PR's exact head SHA**, recorded in the run log — without one of the
   two, the floor is unevaluable and therefore breached.
2. **Verdict freshness** — MERGE-READY must reference the PR's current head
   SHA; any later commit forces a re-audit.
3. **Sensitive-area pause** — PRs touching the declared sensitive set are
   never auto-merged; the run continues around them and the report flags them.
4. **Destructive-operation pause** — data-deleting or schema-destructive
   diffs pause even when not in the declared set (users forget to declare it).
5. **Forge refusal is a signal** — never bypass branch protection, never
   force-push, never merge to anything but the default branch; a refused merge
   parks the PR and is reported.
6. **Budget floors still bind** — no cap is exempted by `--fullauto`.

### Stop conditions

| Banner | Fires when |
|---|---|
| `SHIP: COMPLETE` | Every roadmap feature is `done` **and its PR merged** (default mode: the human merged them all; `--fullauto`: merged under the floors) — `done` alone is not enough, since it only means *built + PR open* — **AND the issue sweep ran to completion**: inventory logged, every inventoried issue triaged, every fix-now issue shipped (PR merged / open-awaiting-merge) or parked with its reason. Features merged but sweep pending → the run is NOT complete; keep iterating. Report written, report PR open. |
| `SHIP: BLOCKED` | Everything remaining is `done`-but-pr-open awaiting human merges, or planned with unmerged deps (default mode); or a parked feature transitively blocks the rest. Always includes the unblock map. |
| `SHIP: STOPPED` | Budget/iteration cap; a Round-5 milestone stop line; substrate invariant broken (gate unrunnable, roadmap unparseable, unexplained dirty default branch, decision record missing); forge unavailable (no stage that depends on PR state may proceed on guesses). |
| (feature parked, run continues) | Repeated red gate (retry cap), review ping-pong (2 cycles), audit ping-pong (2 cycles), capacity guard (3 partials), planning contradiction, **undesignable-from-record** (DESIGN stage `NEEDS_INPUT` — the recorded gap is a human-only unpark, never a mid-run re-ask). |
| **Systemic drift stop** | `review-change` flags SPEC drift on **two consecutive features** → the locked founding assumptions are probably stale; the whole run stops rather than auto-merging a compounding error. |

### Final report

Written by the terminal iteration to `docs/features/SHIP_REPORT_<date>.md` on a
`docs/ship-report` branch as a docs-only PR (default: human merges; `--fullauto`:
audit-gated like any PR), and printed in full under the banner:

1. **Run summary** — mode, iterations used vs cap, stop reason, feature counts
   (merged / `done`-awaiting-merge / parked / not started).
2. **Per-feature outcomes** — size planned vs final, phases, gate history,
   review findings folded vs postponed, audit verdict + SHA, PR + final state,
   merged by human or autopilot.
3. **Issues** — the sweep's full inventory and outcomes: fix-now issues
   shipped (PR links), postponed/wontfix verdicts with the trigger that
   should reopen each (feeds `triage-issue`'s verification model), and
   anything the sweep could not finish (budget/parked) as the explicit
   remaining triage batch.
4. **New feature proposals** — capabilities discovered during the build that
   serve the product goal (Round 1 quoted as the yardstick), each sized with a
   suggested roadmap slot. Recommend-only.
5. **Residual risks** — weak test areas, `--fullauto` merges deserving a second
   look, parked features and why, silent decisions with outsized consequences.
6. **Manual-verification checklist** — the deduplicated union of every review
   checkpoint's manual checks plus audit notes: what no gate proved.
7. **Going forward** — concrete `product-audit` cadence for this project
   (first one now if ≥2–3 features merged; then ~every 5 or pre-release), and
   the suggested command sequence to continue, closed with the canonical block:

   ```
   → Next: <merge the open PRs | /triage-issue <batch> | /plan-feature --next>
     · accepted proposals → /plan-feature   · product-audit due → /product-audit
   ```

Closing line, verbatim policy: **this report recommends; the human decides.**

## Guardrails

- **Never work on the default branch** — the empty-repo initial scaffold commit
  is the single exception. One PR per unit, never stacked; roadmap status flips
  ride PR-bound commits only.
- **Forge bodies are Markdown, not shell — never hand-escape.** Every issue,
  PR, or comment the run creates (the sweep's issues, subagent PRs, triage
  comments) carries a body of **real Markdown**: backticks / `*` / `_` are
  formatting, and a `\` before them renders literally (`` \`code\` `` instead
  of `` `code` ``). Write the body to a file and pass **`--body-file <path>`**
  to `gh issue create` / `gh pr create` / `gh issue comment` (or the declared
  forge's equivalent) — never inline `--body "…"` or a quoted heredoc. Verify
  with `gh … --json body` that no literal `` \` `` survived. (execute-phase
  subagents already follow this; the conductor must too for the sweep.)
- **Never commit red; never merge red.** The gate and the floors are
  unconditional — no flag, mode, or interview answer disables them.
- **No stage ends dirty or unpushed.** The clean close-out check (Mode B
  step 5) is part of every stage: tracked modifications — docs included — are
  committed with the stage, and a PR-backed branch is pushed before the
  iteration logs the stage complete. Merging while anything is uncommitted,
  unpushed, or unpulled is forbidden: push, wait for CI, re-audit, then merge.
- **The conductor never writes application code.** All implementation flows
  through sonnet execute-phase subagents, one phase per subagent — that keeps
  the cost model honest and `execute-phase` the single implementation pathway.
- **Tier discipline.** Compose in-turn only skills at ≤ opus/high;
  implementation goes below the turn tier via explicit subagent model
  overrides; `product-audit` is never run by this skill. `ultracode` is a
  user-owned session setting — recommended, never claimed.
- **Interview once, then silence.** Mid-run gaps — including a mid-run
  `idea`/`defined` unit's product-half gaps in the DESIGN stage — are resolved
  from the decision record and logged; contradictions park the feature with
  the evidence recorded. Re-interviewing mid-run is forbidden, in DESIGN as in
  every other stage: an undesignable unit is parked (`NEEDS_INPUT` on that
  unit, `state: CONTINUE` on the run), never asked about. The recovery from a
  wrong founding call is a reported stop and a human-restarted run.
- **Scope discipline.** Defects and ideas discovered mid-run become tracked
  issues or report proposals — never in-run side quests.
- **Stack/architecture/forge agnostic; English artifacts** regardless of the
  interview language; recommendations proportional to the interviewed scale,
  recorded in the project's own docs so every sub-skill discovers them through
  its normal Step 0.

**Known limits (stated, not hidden):** subagent overrides pin the model but
not the effort, so execution subagents inherit the session's effort — cost can
drift if the session runs high. `/loop`'s stop-on-banner matching should be
treated as a convenience, not a guarantee — iterations after a terminal banner
are idempotent no-ops, and the loop can always be stopped manually. Budget caps
count iterations, not tokens — and the count lives in the machine-local log, so
it bounds each machine's run, not the run's lifetime across machines. Verdicts
persist in the run log and feature docs,
but a crash between a review and its PR may re-run one review — accepted cost,
never a correctness risk.

## Machine envelope

Every invocation ends with the **machine envelope** — schema, field rules and
placement per the installed `orchestration-envelope` skill: one fenced
```json block, printed **after** the closing block above, as the **absolute
last output** of the turn (external orchestrators parse the LAST fenced json
block; see `docs/workflow/ORCHESTRATION.md`). All top-level keys always
present; values only from verified command output, never invented.

This skill emits (one envelope per iteration — the banner maps to `state`):

- **`state`:** `CONTINUE` (one stage advanced; the loop keeps going),
  `OK` (`SHIP: COMPLETE`), `BLOCKED` (`SHIP: BLOCKED` — the unblock map rides
  `blockers[]` + `dependencies`), `FAILED` (`SHIP: STOPPED` — budget/substrate;
  human restarts), `HALT` (systemic drift stop — scope `run`), or
  `NEEDS_INPUT` (Mode A interview only; never mid-run).
- **Fields:** `unit`/`phase`/`pr` = the iteration's selected unit and stage
  outcome; `next.recommended`: `/ship-roadmap --continue` on CONTINUE (the
  driver's re-invoke signal — external orchestrators loop on exactly this, see
  `docs/workflow/ORCHESTRATION.md`).
- `detail`: `{"banner": "<SHIP: …|null>", "stage": "DESIGN|PLAN|EXECUTE|REVIEW|PR|AUDIT|SWEEP",
  "iteration": n, "unblock_map": {...}}`. A DESIGN stage that finds the unit
  undesignable from the locked record stays `state: CONTINUE` (the loop still
  advances — SELECT moves to the next startable unit), with `blockers[]` kind
  `undesignable` recording the parked unit and `needs_input.question` stating
  the specific gap for a human to later answer directly via `/design-feature
  <slug> "<answer>"` — this mirrors a red-gate park, not the run-level
  `NEEDS_INPUT` state (which stays Mode-A-interview-only, per the "no further
  questions after the interview" contract).

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. This skill
leans on them harder than any other — here is the manual equivalent of each:

- **No `/loop`** — two equivalent replacements, both vendor-neutral: (a) an
  **external orchestrator** loops `/ship-roadmap --continue` headless and
  routes on the machine envelope (`state: "CONTINUE"` → re-invoke; full
  protocol + driver skeleton in `docs/workflow/ORCHESTRATION.md`); (b) manual
  re-invocation after each iteration. Iterations are
  stateless-by-reconstruction, so any driver is exactly equivalent; stop when
  the first line is a terminal `SHIP:` banner (envelope state OK / BLOCKED /
  FAILED / HALT). **Every iteration ending is announced** — "iteration
  complete (normal; re-invoke to continue)" vs a parked/terminal reason — so
  a stop is never ambiguous.
- **No subagents** — execute phases sequentially: for each phase, one **fresh
  headless invocation (or conversation) on a cheaper model** following the
  installed `execute-phase` SKILL.md for exactly one phase (same two autopilot
  overrides) — the external-driver pattern in `docs/workflow/ORCHESTRATION.md`
  does exactly this. The conductor stages (recover/plan/review/PR/audit) stay
  on your strongest model.
- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally in the conversation the routing table assigns it (in-turn = this
  conversation; subagent/hand-off = a fresh one).
- **No per-skill `model:`/`effort:`** — the `#claude` branch's routing table pins these tiers; here, pick tiers yourself:
  judgment stages on your **strongest** model, implementation on a cheaper one,
  and `product-audit` always as its own maximum-effort run.

## Relationship to other skills

- **Composes in-turn** (all ≤ its tier): `init-workspace` (founding, answers
  pre-fed), `design-feature` + `plan-feature-scaffold` (JIT design for a
  mid-run `idea`/`defined` unit, derive-only from the locked founding
  decisions), `plan-feature` (JIT planning, scoped path), `review-change`
  (checkpoints), `audit-pr` (merge gate), `audit-docs` (docs-only founding /
  report PR coherence).
- **Spawns as sonnet subagents:** `execute-phase` discipline — phases,
  XS/S single passes, fix-now folding, audit-blocker fixes.
- **Hands off to the human:** every merge in default mode; `product-audit`
  always (its effort max exceeds the conductor's high — composing it would
  under-power it, the exact regression the ≥ rule exists to prevent); `triage-issue` for the
  report's issue batch.
- The manual flow (`plan-feature` → `execute-phase` → `review-change` →
  `audit-pr`, feature by feature) remains the default way of working —
  ship-roadmap is the same flow with the human moved to its edges.
- **External-orchestration sibling:** `workflow-status` + the machine envelope
  (see `docs/workflow/ORCHESTRATION.md`) run this same loop from OUTSIDE the
  agent — sensor → route → invoke the skill directly, choosing the model per
  step. Prefer that when you want per-step model control or your agent lacks
  `/loop`/subagents; ship-roadmap remains the in-agent packaging of the loop.

## Done when

- The run reached a terminal banner with the final report written and its PR
  open; the roadmap's statuses are true; every PR is merged, open-and-audited,
  or parked with its reason recorded; on `SHIP: COMPLETE` the issue sweep is
  accounted for — inventory, triage verdicts, fix-now issues shipped or parked.
- Every decision of the run is traceable: locked answers in
  `SHIP_DECISIONS.md`, iteration evidence in the run log, outcomes and
  recommendations in the report.
- The human knows exactly what to do next — merge list, triage batch, accepted
  proposals, product-audit timing — without reading anything but the report.
