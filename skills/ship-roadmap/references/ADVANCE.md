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
   - **REVIEW-SPEC** (only between DESIGN and PLAN) — compose `review-spec` in a
     clean context at the routed tier (opus/high), never in the turn that wrote the
     product half. `SPEC-REVIEW-PASS` releases the unit into PLAN. A FAIL whose
     findings are common-root-cause or wording-only returns to the same unit's
     author for one root-caused repair batch, then a fresh review. `NEEDS-DESIGN`
     means a product choice is open that this run's locked record cannot answer:
     **park the unit** with the exact question (`NEEDS_INPUT`, same shape as the
     undesignable park above) — the autopilot never answers a product question
     itself, and `SELECT` continues with the next startable unit.
   - **PLAN** — compose `plan-feature` in-turn via its scoped path (equal
     tier). Every unit reaching PLAN holds a current `SPEC-REVIEW-PASS` (REVIEW-SPEC
     ran first, or the unit was already planned before this gate existed and its
     own Product receipt is current), so `plan-feature`'s PRODUCT-REVIEW gate passes
     here. The interview path is **forbidden** mid-run:
     SPEC gaps are resolved silently from the decision record and logged. JIT
     planning that reveals the feature's premise is wrong (obsolete, absorbed,
     impossible on this stack) → mark it blocked with the contradiction
     recorded; never re-ask.
   - **REVIEW-PLAN** (only between PLAN and EXECUTE) — compose `review-plan` in a
     clean context at the routed tier over the plan the previous stage just froze.
     `PLAN-REVIEW-PASS` releases EXECUTE. A FAIL routes by root cause: plan-local
     (bad phase cut, blank validator, ledger drift) → one root-caused re-cut by the
     planning author and a fresh review; product-rooted or an assumption this record
     cannot settle → `NEEDS-DESIGN` → park as in REVIEW-SPEC. A second local cycle
     that changes nothing stops editing and reports `CONVERGENCE-ANOMALY` instead of
     burning a third budget. **No stage between PLAN and EXECUTE may create a forge
     issue or defer an obligation to one** — an unmet obligation fails this stage, it
     is never exported.
   - **EXECUTE** — run each unfinished **implementation phase** in a **fresh cheap-tier context**: on Claude
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
     exactly one explicit phase: tests-first where it
     applies, gate green, one commit, per-phase docs. Two autopilot overrides
     to its recipe: (a) **never ask** — SPEC ambiguity is resolved from the
     committed decision record with the most conservative reading, and the
     assumption is surfaced in the phase docs so the conductor logs it;
     (b) the **P1 planning commit also carries `ROADMAP.md`** (the feature's
     `in-progress` flip rides it; the **`done` flip rides the PR-stage commit**
     when the PR opens; any flips left at run end ride the report commit).
     Stop before the literal final `Hardening & PR` phase: PR owns that explicit
     phase so close-out has one owner. Never bundle phases into one worker.
   - **REVIEW** — compose `loop-review-fold` in-turn (equal tier) once, over
     the complete PR candidate. It reuses a current exact-SHA receipt or runs
     `review-change` context-clean, batches compatible fixes through
     `fold-findings`, and re-reviews only changed HEADs. Default correction
     budget is two; unchanged evidence stops NO-PROGRESS. L/sensitive features
     forward `--adversarial 2` (security/auth: `3`) as the unattended floor;
     other units use one final reviewer. There are no intermediate phase
     reviews in autopilot: phase gates + frozen acceptance guard execution,
     and the independent final loop judges one complete candidate. Independent
     future work remains proposals; no review/fold stage creates issues.
   - **PR** — run the unit's explicit final `Hardening & PR` phase through one
     fresh cheap-tier `execute-phase` worker. That canonical close-out flips the
     feature to `done` (built, not merged), pushes, creates the PR with `Closes
     #N` where issue-born, prints its URL, links it from the roadmap, commits the
     link, and pushes. Reconcile an already-open matching PR idempotently; never
     create a second one. The stage is incomplete until the row carries its PR
     link and the branch is clean/current.
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
     cheap-tier worker next iteration (max 2 audit cycles, then the feature is
     parked and the loop moves on); the fixer's cycle ends committed AND
     pushed (step 5), so the re-audit judges the real branch.

   Fix units take the same pair in miniature: **plan-fix → REVIEW-PLAN → EXECUTE
   (`--fix`)** — a fix has no Product hop to wait on (D6), so its plan review is the
   only pre-execution gate it can have. The stage sequence is per-feature and size-dependent — always **one stage
   per iteration**: a feature starting at `idea`/`defined` gets a DESIGN stage
   first; one already `planned` (including the founding-scaffolded feature 01)
   goes to its missing review stage, and skips to EXECUTE only when a current
   `PLAN-REVIEW-PASS` is bound to its bytes. Every size follows
   **[DESIGN → REVIEW-SPEC] → PLAN → REVIEW-PLAN → EXECUTE**
   (implementation phases, fresh cheap worker per phase) → PR (explicit
   `Hardening & PR`) → REVIEW (bounded final loop) → AUDIT. Risk changes final
   review strength, not phase cadence. The two review stages are the pre-execution
   pair: they judge documents in a clean context and are **not** the post-code
   REVIEW loop, which stays exactly as described below. Merge policy is unchanged —
   the human (or the `--fullauto` wrapper behind its recorded floors) still owns the
   merge, and neither review stage may merge, close, or file anything.
