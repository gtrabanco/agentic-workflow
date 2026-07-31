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

This AUDIT stage is the **sole automated merge authority**. Authorization lasts
for this invocation and this merge attempt only:

1. `audit-pr` returns a fresh SHA-bound MERGE-READY verdict and never merges.
2. Record merge intent in `.ship-run.log` before execution.
3. Invoke exactly:

   ```sh
   AGENTIC_WORKFLOW_SHIP_ROADMAP_FULLAUTO=1 \
     .agentic-workflow/hooks/fullauto-merge.sh \
     --pr <number> --head <audited-sha> --base <default> --run-id <run-id>
   ```

   For a no-CI project, add
   `AGENTIC_WORKFLOW_LOCAL_GATE_SHA=<audited-sha>` only after the fresh local
   gate ran on that exact SHA. These variables prefix this command only; never
   export them or configure an agent-wide allow rule.
4. The wrapper re-checks the committed decision, clean/synchronized branch,
   local and remote head, base, mergeability, and CI/local-gate evidence. It
   creates a namespaced marker under the git common directory only after those
   checks, installs cleanup with `trap`, and removes the marker on success,
   failure, signal, or already-merged recovery.
5. After the forge reports MERGED, the wrapper posts one idempotent comment
   marked `<!-- agentic-workflow:automerge head=<sha> -->`, containing the run,
   audited head, and merge commit. That PR comment is the durable automerge log;
   no repository log grows.

Direct `gh pr merge`, `glab mr merge`, `git merge`, and forge-API merge calls
remain blocked by the command guard at all times. There is no `.automerge` file
and no persistent exception for a later manual `audit-pr` or shell session.

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
