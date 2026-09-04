## Persist and decide

11. **Persist fix-now findings to the fold ledger.** The unit's **fix-now fold
   ledger** is `review-findings.md`, located beside its other docs
   (`docs/features/<NN>-<slug>/review-findings.md` for a feature,
   `docs/fix/<n>-<topic>/review-findings.md` for a fix), fixed schema:


   ```
   | id | file:line | axis | severity | class | route | folded |
   ```

   **Merged unit → no write** (a PR exists and its state is `MERGED` — check
   `gh pr view --json state` when a PR is open; otherwise the unit is unmerged
   by definition). Otherwise, for each **fix-now** finding of severity `high`
   or `med` (only ledger severities; finder scale
   `critical`→`high`, `major`→`med`, `minor`→`low`): append a row
   (create the file with the header row when missing), carrying the
   verbatim `Sev` value into `severity`; `folded` always starts `no` — that
   row comes from a **confirmed** candidate only and carries its
   `finding-mark@1` signature on a **separate `VF-` row** (reviewer, head SHA,
   recheck + reproducer), as modeled in `LEDGERS.md` (§finding-mark@1) and the
   fixture.
   `execute-phase`'s fold cycle is the only step that ever flips it to `yes`.
   A `low` finding is **never persisted to the fold ledger** — report-only
   note (step 13), never blocking (finders' materiality floor). Re-runs
   **dedupe by `file:line` + axis**:
   a row already on the ledger at that `file:line`+axis is not re-appended;
   a re-report at a folded row's location is legitimate only as `regression of <id>`
   (fix provably failed) or `DISPUTED`; else `Fn+1`.
   **Non-fix-now findings are never written here** — they keep
   their destinations from step 11 (outcome routing): independent future
   capabilities batch as proposals; only the user routes them to `triage-issue`
   (D3).
   **Commit the ledger append** — rows + `REVIEW-RAN` mark, one commit
   (`docs(<unit>): persist review findings F<n>–F<m>`), pushed when a PR is open;
   an uncommitted append hands the next review a dirty-tree stop. On
   `REVIEW-PASS` with an open PR no ledger write happens (the SHA-bound
   receipt is the durable record): head and posted receipt stay identical.
12. **Close out the final-review receipt before reporting.** First derive the
   `Decision` from step 7 and persist step 11. Then, before printing any line of
   the fixed report block or the `→ Next:` block, complete the receipt action
   below. The receipt is a precondition of the report, not a follow-up.

   The durable, audit-consumable receipt is one idempotent SHA-bound PR comment
   (D6, D7). **Only on `Decision: REVIEW-PASS` AND when the PR exists** (the
   mandatory final review; the PR always exists by then — the phase gate created
   it). `REVIEW-FAIL` and `NEEDS-DECISION` post **no** passing receipt; continue
   to step 13 after recording that status.

   The reviewed head SHA is the value frozen by `git rev-parse HEAD` in the
   review process. Resolve the PR identity immediately before this action with
   `gh pr view --json number,headRefOid`. No PR → take the documented pre-PR
   path. With a PR, its `headRefOid` **must equal the reviewed head SHA** before
   querying or posting comments. A mismatch means the candidate changed during
   review: do not post a receipt and re-run `/review-change` at the PR head.

   For `REVIEW-PASS` with a PR, write the body below to a **temporary** Markdown
   file (e.g. `$TMPDIR/review-receipt.md`), then run
   `gh pr comment <N> --body-file <path>` — never inline `--body`, never commit
   the file into the branch. Before posting, run `gh pr view <N> --json comments`
   and inspect the newest matching marker. Same SHA → skip the post; older or
   absent SHA → post. After posting, run the same comment query again and confirm
   the newest marker equals the reviewed head SHA. If that confirmation fails,
   retry the receipt action; do not print a `REVIEW-PASS` report or recommend
   `/audit-pr` while the receipt is not current.

   Use **exactly** this body:

   ```markdown
   <!-- review-change:pass sha=<head SHA> contract=v1 -->
   ## review-change: REVIEW-PASS

   - Reviewed head: `<head SHA>`
   - Scope and applicable axes: <compact list>
   - Acceptance coverage: concise criterion-to-evidence summary
   - Architectural invariants: pass | n/a
   - Current-unit findings open: 0
   - Future-capability proposals: <count; no issues created>
   - Manual verification: <items or none>
   ```

13. **Report block — Return exactly this structure** after step 12 succeeds
   (fixed chat-report block; this is not the end of the turn):

   ```
   REVIEW CHANGE — scope: <scope>
   Axes run: <list>   Skipped: <list + why>
   Architectural invariants: pass | finding (<ID>) | n/a: no project invariants declared
   Receipt: current at <head SHA> | n/a: no PR | none: REVIEW-FAIL/NEEDS-DECISION

   <the synthesized decision table (step 7)>

   Manual verification (a human must check):
   - <item> …

   Notes (low · report-only, never persisted):
   - <finding + evidence, or none>

   Refuted (verified false — reported with counter-evidence, never persisted):
   - <candidate + counter-evidence, or none>

   Proposals (step 11): <n> — batched for the user, no issues created (D3)

   Summary: <1-2 sentences>
   Decision: REVIEW-PASS | REVIEW-FAIL | NEEDS-DECISION   (D10: review says these three; only audit-pr says MERGE-READY)
   ```

14. **Next step.** The `→ Next:` block is **never one static template** — branch
   on the `Decision` value from step 7 and emit the matching block **verbatim,
   as multiple literal lines**. Never join the `·` sub-bullets into one prose
   line — each sub-bullet is its own line, exactly as quoted below.
   For `REVIEW-FAIL` or `NEEDS-DECISION`, list every open finding ID in the
   closing recommendation, joined with ` + `; never hand off only the first.

   **`Decision: REVIEW-FAIL`** (any fix-now finding open) — the recommended line
   is the fold, never the merge gate. Findings were persisted in step 11; **no
   passing receipt was posted** (step 12):

   ```
   → Next: /fold-findings — repair all open fix-now findings: <F1> + <F2> + <F3>,
     then re-run /review-change on the changed HEAD (bounded at two cycles; a
     third cycle never starts without an explicit user instruction)
     · /audit-pr → only after the table is clean (not yet — findings open)
      · any finding routed replan-in-unit? → confirm the proposed SPEC phase(s),
        then /execute-phase on this same branch (yes: list the finding ids; no:
        omit this line)
      · any finding owned by plan? → /plan-feature <unit> re-cuts the plan on this
        branch, then /review-plan <unit> before execution (yes: list the ids; no:
        omit this line)
      · any finding owned by product? → /design-feature <unit>, then /review-spec
        <unit> (yes: list the ids; no: omit this line)
      · independent proposals → present to the user; only the user routes them
        to /triage-issue
     · adversarial recommendation checklist fired AND this run was
       single-reviewer? → re-run the fold review as /review-change
       --adversarial N (N per the ladder below) instead of single-reviewer
       (yes: <which box fired>; no: omit this line)
     · SPEC drift flagged here AND on a prior unit? → /product-audit (yes: the
       founding assumptions are probably stale — don't keep patching a
       compounding error; no: omit this line)
   ```

   **`Decision: REVIEW-PASS`** (table clean) — the recommended line is the merge
   gate. Receipt: PR exists → current after step 12 (exact-SHA `REVIEW-PASS` at
   `<head SHA>`); pre-PR checkpoint → no receipt, the `progress.md` compact
   marker covers it (D7):

   ```
    → Next: /audit-pr — merge gate
      · independent proposals → present to the user; only the user routes them
        to /triage-issue
     · adversarial recommendation checklist fired AND this run was
       single-reviewer? → re-run as /review-change --adversarial N (N per the
       ladder below) before /audit-pr (yes: <which box fired>; no: omit this
       line)
     · SPEC drift flagged here AND on a prior unit? → /product-audit (yes: the
        founding assumptions are probably stale — don't keep patching a
        compounding error; no: omit this line)
   ```

   **`Decision: NEEDS-DECISION`** (a decision-required finding is open — step
   10) — block without creating an issue; surface the decision to the user, who
   alone resolves it:

   ```
   → Next: decision required — resolve all open findings: <F1> + <F2> + <F3>
     before the unit continues
     · present the decision-required finding(s) with evidence; no issue is
       created (D3) and no passing receipt was posted (step 12)
     · once the user decides, re-run /review-change on this same branch
   ```

   The `/product-audit` line fires **only on recurring drift** — the same kind
   of inconsistency surfacing a second time, not a single isolated finding;
   the yes/no checkbox above is how to decide, in both branches.
