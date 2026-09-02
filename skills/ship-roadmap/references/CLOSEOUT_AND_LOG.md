## Close out and log the iteration

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
   unconditional for REVIEW-SPEC/REVIEW-PLAN repairs, EXECUTE, REVIEW fix cycles,
   PR, and AUDIT fix cycles.
6. **LOG** one line to `.ship-run.log`; print `→ Next: <unit> (CONTINUE)` (the
   canonical next-step shape; `CONTINUE` stays the loop's keep-going signal).
   **Say WHY the turn is ending** — one explicit
   line before the `→ Next:` block, always one of: "iteration complete — one
   stage advanced (normal; re-invoke to continue)", "parked <unit>: <exact cap
   hit — red-gate retries / review ping-pong / audit ping-pong / 3 partials /
   planning contradiction>", or the terminal banner's reason. A turn ending
   silently reads as a crash on agents without `/loop` — never leave the stop
   unexplained.

**Capacity guard:** an iteration that cannot finish its stage in one turn
(e.g. an oversized review) writes a partial-stage marker and ends cleanly;
three consecutive partials on the same stage parks the feature as blocked.
