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
   by definition). Otherwise, for each **fix-now** finding: append a row
   (create the file with the header row if it doesn't exist yet), carrying the
   verbatim `Sev` value into `severity`; `folded` always starts `no` —
   `execute-phase`'s fold cycle is the only step that ever flips it to `yes`.
   Re-runs **dedupe by `file:line` + axis** (the same rule the adversarial mode
   uses to merge reviewer findings, above): a finding already on the ledger at
   that `file:line`+axis is not re-appended; a genuinely new finding gets the
   next `Fn` id. **Non-fix-now findings are never written here** — they keep
   their destinations from step 10 (outcome routing): independent future
   capabilities batch as proposals; only the user routes them to `triage-issue`
   (D3).
12. **Report block — Return exactly this structure** (fixed chat-report block;
   this is not the end of the turn). After printing its `Decision:` line, run
   step 13 before step 14; the receipt action and verification are outside this
   block:

   ```
   REVIEW CHANGE — scope: <scope>
   Axes run: <list>   Skipped: <list + why>
   Architectural invariants: pass | finding (<ID>) | n/a: no project invariants declared

   <the synthesized decision table (step 6)>

   Manual verification (a human must check):
   - <item> …

   Proposals (step 10): <n> — batched for the user, no issues created (D3)

   Summary: <1-2 sentences>
   Decision: REVIEW-PASS | REVIEW-FAIL | NEEDS-DECISION   (D10: review says these three; only audit-pr says MERGE-READY)
   ```

13. **Post the final-review receipt.** The durable, audit-consumable receipt is
   one idempotent SHA-bound PR comment (D6, D7). **Only on `Decision:
   REVIEW-PASS` AND when the PR exists** (the mandatory final review; the PR
   always exists by then — the phase gate created it). `REVIEW-FAIL` and
   `NEEDS-DECISION` post **no** passing receipt; they take their step-11/14
   paths instead. When it does fire, write the body below to a **temporary**
   Markdown file (e.g. `$TMPDIR/review-receipt.md`), then post with
   `gh pr comment <N> --body-file <path>` — never inline `--body`, never commit
   the file into the branch (D6: a review-report commit would invalidate its own
   SHA). Use **exactly** this body:

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

   **Idempotent and exact-SHA:** before posting, list existing comments
   (`gh pr view <N> --json comments`) and look for the newest
   `<!-- review-change:pass sha=... contract=v1 -->` marker. Same SHA already
   commented → **skip** (the receipt is already current; say so). Older SHA →
   post the new comment (newest matching marker wins). Any later commit makes it
   stale — the marker is bound to the head SHA it reviewed, and stale receipts
   are rejected by audit-pr.

14. **Next step.** The `→ Next:` block is **never one static template** — branch
   on the `Decision` value from step 12 and emit the matching block **verbatim,
   as multiple literal lines**. Never join the `·` sub-bullets into one prose
   line — each sub-bullet is its own line, exactly as quoted below.

   **`Decision: REVIEW-FAIL`** (any fix-now finding open) — the recommended line
   is the fold, never the merge gate. Findings were persisted in step 11; **no
   passing receipt was posted** (step 13):

   ```
   → Next: /loop-review-fold <unit> — repair compatible fix-now batches and
     re-review changed HEADs within the bounded correction budget
     · manual path → /fold-findings, then re-run /review-change
     · /audit-pr → only after the table is clean (not yet — findings open)
      · any finding routed replan-in-unit? → confirm the proposed SPEC phase(s),
        then /execute-phase on this same branch (yes: list the finding ids; no:
        omit this line)
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
   gate. Receipt: PR exists → posted in step 13 (exact-SHA `REVIEW-PASS` at
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
   → Next: decision required — the unit blocks until the user decides
     · present the decision-required finding(s) with evidence; no issue is
       created (D3) and no passing receipt was posted (step 13)
     · once the user decides, re-run /review-change on this same branch
   ```

   The `/product-audit` line fires **only on recurring drift** — the same kind
   of inconsistency surfacing a second time, not a single isolated finding;
   the yes/no checkbox above is how to decide, in both branches.
