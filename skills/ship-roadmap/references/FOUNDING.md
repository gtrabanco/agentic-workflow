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
| **External orchestrator** | Any agent invocable headless (a shell loop, CI, your own program) | loop: invoke `/ship-roadmap --continue` with the injected envelope requirement (see `orchestration-envelope`), parse the resulting envelope, re-invoke while `state: "CONTINUE"` — see `docs/workflow/ORCHESTRATION.md` |
| **Manual** | Neither of the above | re-run `/ship-roadmap --continue` yourself after each iteration; each ends with the exact next command |

Default launch contract text (adapt the first line to the detected driver):

```
Founded. Start the autopilot with:

  /loop /ship-roadmap --continue        (Claude Code)
  — or loop `/ship-roadmap --continue` from your orchestrator/by hand;
    with the driver-injected envelope requirement, re-invoke while
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

