## Advance exactly one stage

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
     L or sensitive-flagged features get a checkpoint on the same three named
     triggers `execute-phase`'s interactive checkpoint uses — layer boundary,
     accumulation, sensitivity (see `skills/execute-phase/SKILL.md` "Review
     checkpoint triggers", `#77`) — evaluated after each phase commit, rather
     than a fixed phase count. **For L or sensitive-flagged features, every
     `review-change` invocation in this stage — checkpoint or end review —
     runs with `--adversarial 2`: a HARD FLOOR, not a recommendation.** The
     autopilot is unattended, so a risk-proportional review floor replaces
     the human's skip judgment that the interactive advisory checkpoint
     relies on elsewhere. This deliberately does **not mirror**
     `review-change`'s own interactive auto-recommend-for-L/sensitive
     behavior (advisory, skippable there) — the two are intentionally
     different policies for different contexts (human present vs.
     unattended loop) and must never be "aligned" into one. XS/S and
     non-sensitive M stay single-reviewer. Persist the review report into
     the feature's docs folder. fix-now findings → one sonnet fixer subagent +
     gate + commit **+ push (when the PR exists) + clean-tree check (step
     5)** (max 2 review-fix cycles); every **non-fix-now finding is triaged**
     (review-change composes `triage-issue`) → tracked forge issue /
     documented decision, never inlined.
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
     moves on; `--fullauto` treats `audit-pr` as verdict/comment-only, checks
     the floors, **records the merge intent in the run log first**, then calls
     `.agentic-workflow/hooks/fullauto-merge.sh` with only the PR number and
     run id. The wrapper derives and verifies head, base, decision, and audit
     evidence from the forge. Never invoke `gh pr merge` directly.
     BLOCKED → in-scope blockers go to a
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
