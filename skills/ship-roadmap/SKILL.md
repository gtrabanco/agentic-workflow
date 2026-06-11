---
name: ship-roadmap
user-invocable: true
version: 1.0.0
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
argument-hint: "[--fullauto] | --continue [--fullauto]"
description: >
  End-to-end autopilot: found the project if needed (one upfront interview — product, features,
  stack, architecture, quality bars, ops, autonomy, budget), create or adopt the complete roadmap,
  then ship it feature by feature through the full workflow (plan → execute → review → PR → merge
  gate) driven by /loop, with no further questions. Default: opens PRs, the human merges;
  --fullauto merges MERGE-READY PRs under non-negotiable safety floors. Triggers: "ship the
  roadmap", "build the whole app from the roadmap", "run the full workflow on autopilot",
  "ship-roadmap", "autopilot this project".
---

# Ship the roadmap (autopilot)

Run the entire agentic workflow unattended between human decision points: one
interactive founding turn that asks **everything**, then a `/loop`-driven build
loop that plans, implements, reviews, opens and (optionally) merges one PR per
feature until the roadmap is done — ending in a final report that recommends
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
| 5 — Workflow & autonomy | Docs language (default English); forge + CLI (**verify with a real authenticated call now**, e.g. `gh auth status` — not mid-loop); merge policy (default human-merge vs `--fullauto`); the sensitive-area list (defaults: auth, payments, destructive migrations/data deletion, secrets, CI config — **seeded with every integration named in rounds 2–4**, e.g. the payment processor or auth provider the user mentioned); budget caps (default: max iterations = 4× roadmap feature count; 2 retries per red gate; 2 review-fix and 2 audit-fix cycles; optional "pause after N shipped features" checkpoint and milestone stop lines); model-routing confirmation; recommend enabling `ultracode` for the loop. |
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

**3. The roadmap.** Adopt existing entries (never renumber), fill gaps the
interview surfaced, append elicited features. If absent, write the complete
table: NN in dependency-respecting order, slug, `status: planned`, depends-on,
one-line summary with a **provisional XS/S/M/L size in the summary text** (the
template's 3-status legend and column schema stay exactly as they are —
`plan-feature` re-sizes authoritatively at planning time; a size change is
logged silently). Greenfield: **feature 01 is always the project skeleton**
(stack init, gate wiring, CI if requested), sized S — and **every other
feature's depends-on closure must include 01** (directly or transitively), so
SELECT can never start a feature on a default branch that lacks the skeleton.

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

**5. Print the launch contract**, mode-dependent — default:

```
Founded. Start the autopilot with:

  /loop /ship-roadmap --continue

Stop when an iteration's first line is SHIP: COMPLETE, SHIP: BLOCKED, or
SHIP: STOPPED. You can also stop the loop manually at any time; iterations
are idempotent and resume cleanly.
```

For a fullauto run the command is `/loop /ship-roadmap --continue --fullauto` —
the flag must ride every iteration, because auto-merge is dual-keyed: the flag
on the running command **and** `merge: fullauto` in the committed decision
record (see Merge policy). One key without the other runs in default mode.

Each `/loop` firing is a fresh `/ship-roadmap --continue` turn at this skill's
own opus/high (a looped slash command runs at the skill's frontmatter tier on
every iteration). Iterations after a terminal banner are cheap no-ops that
re-print the same banner — so a missed stop costs tokens, never correctness.

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
   Reconcile: merged PR → stage the roadmap flip to `done` (flips **ride the
   next PR-bound commit** — see the carrier rule in step 4 — never a lone
   commit on the default branch). A dirty feature branch from a crashed phase
   is handed to the next phase subagent to finish or restart (counts against
   the red-gate retry cap). Uncommitted changes on the default branch confined
   to `docs/features/<NN-slug>/` + ROADMAP.md that match an in-flight roadmap
   row are the loop's own planning output — resume that feature; the
   dirty-default stop fires only for changes matching no roadmap unit.
2. **STOP-CHECK.** Evaluate the stop conditions (below). Terminal → write or
   refresh the final report, open the report PR, print the `SHIP:` banner +
   status table, end the turn.
3. **SELECT one unit.** An in-progress feature's next pending stage; else the
   next `planned` feature whose depends-on rows are all `done` → PLAN; else
   nothing startable → `SHIP: BLOCKED` with the **unblock map** ("merging #12
   unblocks 05 and 07") and the resume command.
4. **ADVANCE exactly one stage:**
   - **PLAN** — compose `plan-feature` in-turn via its scoped path (equal
     tier). The interview path is **forbidden** mid-run: SPEC gaps are resolved
     silently from the decision record and logged. JIT planning that reveals
     the feature's premise is wrong (obsolete, absorbed, impossible on this
     stack) → mark it blocked with the contradiction recorded; never re-ask.
   - **EXECUTE** — spawn **one subagent per phase, model=sonnet**
     (execute-phase's native tier; the override is the only mechanism that runs
     *below* the conductor's turn tier). Each subagent is instructed to read
     the **installed `execute-phase` SKILL.md first** (at the skills directory
     located in Step 0 and recorded in the decision record — e.g.
     `.claude/skills/execute-phase/SKILL.md` in Claude Code) and follow it for
     exactly one phase (or the single-pass mode for XS/S): tests-first where it
     applies, gate green, one commit, per-phase docs. Two autopilot overrides
     to its recipe: (a) **never ask** — SPEC ambiguity is resolved from the
     committed decision record with the most conservative reading, and the
     assumption is surfaced in the phase docs so the conductor logs it;
     (b) the **P1 planning commit also carries `ROADMAP.md`** (staged status
     flips and the feature's `in-progress` flip ride it; for XS/S single-pass
     features they ride the single implementation commit, and any flips left at
     run end ride the report commit). Never bundle phases into one subagent.
   - **REVIEW** — compose `review-change` in-turn (equal tier), with
     **risk-proportional cadence**: XS/S and non-sensitive M features get ONE
     review at branch end (matching execute-phase's documented batch pattern);
     L or sensitive-flagged features get a checkpoint every 2 phases. Persist
     the review report into the feature's docs folder. fix-now findings → one
     sonnet fixer subagent + gate + commit (max 2 review-fix cycles); postpone
     findings → tracked forge issues, never inlined.
   - **PR** — push, `pr create` against the default branch with the PR
     template and `Closes #N` where issue-born (forge CLI per Workflow
     conventions).
   - **AUDIT** — compose `audit-pr` in-turn (equal tier); bind the verdict to
     the PR's head SHA in the run log. MERGE-READY → default mode logs and
     moves on; `--fullauto` checks the floors, **records the merge intent in
     the run log first**, then merges. BLOCKED → in-scope blockers go to a
     sonnet subagent next iteration (max 2 audit cycles, then the feature is
     parked and the loop moves on).

   The stage sequence is per-feature and size-dependent — always **one stage
   per iteration**: XS/S/M → PLAN → EXECUTE (all phases / single pass) →
   REVIEW → PR → AUDIT; L or sensitive-flagged → PLAN → EXECUTE (≤2 phases) →
   REVIEW → EXECUTE (next ≤2) → REVIEW → … → PR → AUDIT.
5. **LOG** one line to `.ship-run.log`; print `CONTINUE — next: <unit>` as the
   last line.

**Capacity guard:** an iteration that cannot finish its stage in one turn
(e.g. an oversized review) writes a partial-stage marker and ends cleanly;
three consecutive partials on the same stage parks the feature as blocked.

### Model routing

| Stage | Tier | Mechanism |
|---|---|---|
| Interview, founding, roadmap creation | opus/high | this skill's frontmatter; composes `init-workspace` (equal tier), answers pre-fed |
| Recovery, routing, logging | opus/high | in-turn (tiny token volume; a subagent would add cost, not save it) |
| JIT feature planning | opus/high | compose `plan-feature` in-turn (its internals are opus/high–medium: ≥ holds) |
| Phase execution, single-pass, fixes | **sonnet** | subagent per phase with explicit `model: sonnet` override, following `execute-phase`'s SKILL.md |
| Review checkpoints | opus/high | compose `review-change` in-turn (equal tier — orchestrators compose what they synthesize) |
| Merge gate | opus/high | compose `audit-pr` in-turn (the highest-stakes automated verdict; must share one turn with the floor checks) |
| Forge/git mechanics | — | Bash tool calls; no model judgment involved |
| Final-report evidence gathering | haiku (optional) | fan-out subagents for grep-shaped per-feature log collection when ultracode is on; synthesis stays opus |
| `product-audit` | fable/max | **never composed, never imitated by a subagent** — its tier exceeds the conductor's and a subagent override cannot carry `effort: max`. Hand-off only: the report prescribes when to run it. |

### Merge policy

**Default — the human merges.** The autopilot opens PRs and never merges. It
continues with the next feature whose dependencies are all merged (new branches
always cut from the freshly pulled default branch); when everything remaining
waits on human merges, it stops with `SHIP: BLOCKED` + the unblock map. After
merging, re-run the same launch command (`/loop /ship-roadmap --continue`, plus
`--fullauto` on fullauto runs) — recovery flips the rows and resumes.

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
| `SHIP: COMPLETE` | Every roadmap feature is `done`; report written, report PR open. |
| `SHIP: BLOCKED` | Everything remaining is pr-open awaiting merges or planned with unmerged deps (default mode); or a parked feature transitively blocks the rest. Always includes the unblock map. |
| `SHIP: STOPPED` | Budget/iteration cap; a Round-5 milestone stop line; substrate invariant broken (gate unrunnable, roadmap unparseable, unexplained dirty default branch, decision record missing); forge unavailable (no stage that depends on PR state may proceed on guesses). |
| (feature parked, run continues) | Repeated red gate (retry cap), review ping-pong (2 cycles), audit ping-pong (2 cycles), capacity guard (3 partials), planning contradiction. |
| **Systemic drift stop** | `review-change` flags SPEC drift on **two consecutive features** → the locked founding assumptions are probably stale; the whole run stops rather than auto-merging a compounding error. |

### Final report

Written by the terminal iteration to `docs/features/SHIP_REPORT_<date>.md` on a
`docs/ship-report` branch as a docs-only PR (default: human merges; `--fullauto`:
audit-gated like any PR), and printed in full under the banner:

1. **Run summary** — mode, iterations used vs cap, stop reason, feature counts
   (done / pr-open / parked / not started).
2. **Per-feature outcomes** — size planned vs final, phases, gate history,
   review findings folded vs postponed, audit verdict + SHA, PR + final state,
   merged by human or autopilot.
3. **Issues** — opened during the run, each with a suggested triage verdict
   **and the trigger that should reopen it** (feeds `triage-issue`'s
   verification model); suggested next command: one batch `/triage-issue`.
4. **New feature proposals** — capabilities discovered during the build that
   serve the product goal (Round 1 quoted as the yardstick), each sized with a
   suggested roadmap slot. Recommend-only.
5. **Residual risks** — weak test areas, `--fullauto` merges deserving a second
   look, parked features and why, silent decisions with outsized consequences.
6. **Manual-verification checklist** — the deduplicated union of every review
   checkpoint's manual checks plus audit notes: what no gate proved.
7. **Going forward** — concrete `product-audit` cadence for this project
   (first one now if ≥2–3 features merged; then ~every 5 or pre-release), and
   the suggested command sequence to continue.

Closing line, verbatim policy: **this report recommends; the human decides.**

## Guardrails

- **Never work on the default branch** — the empty-repo initial scaffold commit
  is the single exception. One PR per unit, never stacked; roadmap status flips
  ride PR-bound commits only.
- **Never commit red; never merge red.** The gate and the floors are
  unconditional — no flag, mode, or interview answer disables them.
- **The conductor never writes application code.** All implementation flows
  through sonnet execute-phase subagents, one phase per subagent — that keeps
  the cost model honest and `execute-phase` the single implementation pathway.
- **Tier discipline.** Compose in-turn only skills at ≤ opus/high;
  implementation goes below the turn tier via explicit subagent model
  overrides; `product-audit` is never run by this skill. `ultracode` is a
  user-owned session setting — recommended, never claimed.
- **Interview once, then silence.** Mid-run gaps are resolved from the decision
  record and logged; contradictions park the feature with the evidence
  recorded. Re-interviewing mid-run is forbidden — the recovery from a wrong
  founding call is a reported stop and a human-restarted run.
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

## Relationship to other skills

- **Composes in-turn** (all ≤ its tier): `init-workspace` (founding, answers
  pre-fed), `plan-feature` (JIT planning, scoped path), `review-change`
  (checkpoints), `audit-pr` (merge gate), `audit-docs` (docs-only founding /
  report PR coherence).
- **Spawns as sonnet subagents:** `execute-phase` discipline — phases,
  XS/S single passes, fix-now folding, audit-blocker fixes.
- **Hands off to the human:** every merge in default mode; `product-audit`
  always (fable/max exceeds the conductor — composing it would under-power it,
  the exact regression the ≥ rule exists to prevent); `triage-issue` for the
  report's issue batch.
- The manual flow (`plan-feature` → `execute-phase` → `review-change` →
  `audit-pr`, feature by feature) remains the default way of working —
  ship-roadmap is the same flow with the human moved to its edges.

## Done when

- The run reached a terminal banner with the final report written and its PR
  open; the roadmap's statuses are true; every PR is merged, open-and-audited,
  or parked with its reason recorded.
- Every decision of the run is traceable: locked answers in
  `SHIP_DECISIONS.md`, iteration evidence in the run log, outcomes and
  recommendations in the report.
- The human knows exactly what to do next — merge list, triage batch, accepted
  proposals, product-audit timing — without reading anything but the report.
