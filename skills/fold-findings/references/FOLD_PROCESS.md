## Process

1. **Build the queue.** Fix-now rows with `folded: no` on the ledger (or the
   explicit finding-ID subset passed as arguments), in ledger order (id
   ascending), which is also roughly severity order since higher-severity
   findings are appended first by the writer skills.
   **`replan-in-unit` rows are not folded directly.** A row whose `route` is
   `replan-in-unit` (an in-scope fix-now too large for a single fold) is
   emitted as `REPLAN` instead of entering the per-finding loop — this skill
   never implements it inline. Its fold path is: confirm with the user the new
   phase(s) to append to the unit's SPEC `## Phases` ledger — before the final
   `Hardening & PR` phase if it has not run yet; after it, PLUS a fresh final
   `Hardening & PR` phase, if it already ran (a completed hardening never
   vouches for work added after it) — then `/execute-phase` on this same
   branch executes them;
   the executing phase flips the row `folded: yes`. The same applies if, while
   diagnosing any other finding, the smallest correct fix turns out too large
   to fold in one commit: do NOT downgrade or defer — emit `REPLAN` with the
   proposed phase(s) in the reason.
2. **One finding at a time.** For each:
   a. Read the finding's `file:line`, axis, severity, and route.
   b. Diagnose the actual root cause — not the symptom the finding names.
   c. Implement the smallest correct fix. Model-tier note: the model fixing a
      finding should never be weaker than the model that wrote the code, nor
      weaker than the finding's own subtlety warrants — a subtle logic or
      security finding earns your strongest available model for this one
      finding, even if the rest of the run is on a cheaper tier.
   d. Add/update a test for behavioral findings (see checklist).
   e. Run the gate. Red → keep fixing within this finding's scope; if it
      cannot be made green without touching work outside this finding, stop
      and mark it `BLOCKED` with what's missing — never commit red.
   f. Flip this finding's ledger row `folded: no → yes`.
   g. `git add` the diff + the ledger; `git commit -m "fix(<scope>): fold
      <finding-id> — <summary>"` — one commit per finding, never batched.
   h. If the branch has an open PR: `git push` immediately — every open PR
      always reflects the latest folded state.
   i. Emit this finding's line (see *Report*) before moving to the next.
3. **Disputes.** If frozen classification (above) blocks a fix you believe is
   wrong to apply as specified, do not silently skip it — emit `DISPUTED` with
   the evidence gathered in step 2b, and note it for the `/triage-issue`
   hand-off in the closing block. The ledger row is left `folded: no`;
   `triage-issue` (or a human) decides its fate, not this skill.
4. **Blocked.** If a finding needs an input only the user can supply (a
   product decision, a credential, an external system state) — mark it
   `BLOCKED` with exactly what's missing, leave `folded: no`, and continue to
   the next finding rather than stalling the whole run.
