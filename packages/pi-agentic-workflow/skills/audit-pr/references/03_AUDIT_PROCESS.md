## Process

1. **Gather** — Step 0: project contract, PR, SPEC + artifacts, CI status.
2. **Consume the review receipt** — Step 1: fetch the PR's `headRefOid` and
   comments in one query (`gh pr view <N> --json headRefOid,comments`) and take
   the **newest** marker
   `<!-- review-change:pass sha=<40-hex> contract=v1 -->`. Its `sha` must equal
   that query's `headRefOid` current head SHA. Any mismatch is stale; do not
   use a local diff to preserve a receipt for a different PR head.
   - **current** → acknowledge scope/axes, acceptance coverage, invariant result,
     manual checks; continue to the gates.
   - **absent / stale** → **BLOCKER** (no review evidence at the head), routed to
     `/review-change`; never re-review from here.
3. **Walk the contract** — evaluate every gate above against evidence. For each,
   record pass / blocker / n-a with the specific artifact or check that proves it.
4. **Confirm deferrals are real** — for anything postponed (an unchecked task, a
   review finding, a known issue), verify a tracked issue + trigger exists. A
   deferral with no destination is a blocker, not a pass.
5. **Decide** — one verdict:
   - **MERGE-READY** — every applicable gate passes (including a current receipt);
     list the few things the human should still eyeball (the manual-verification
     items the receipt surfaced).
   - **BLOCKED** — one or more gates fail; output the ranked blocker list.
6. **Persist blockers to the fold ledger (BLOCKED verdict only).** Every blocker
   on a **BLOCKED** verdict is, by definition, fix-now — merge is gated on it.
   Append each to the unit's fix-now fold ledger `review-findings.md` (same
   location and fixed schema
   `| id | file:line | axis | severity | class | route | folded |` as
   `review-change`'s persist step) — the **same ledger**, not a separate one
   (D4: the fold cycle consumes one list). **Merged unit → no write** — check
   `gh pr view --json state`; `MERGED` skips the persist step entirely. For
   each blocker: `file:line` = the cited evidence location (the gate name
   when no single line applies); `axis` = the gate name (e.g. `Review
   receipt`, `Docs`, `Traceability`); `severity` = `high` (a blocker gates
   the merge by definition); `class` = `fix-now`; `route` = the routing this
   skill's own Routing section assigns to that kind of blocker; `folded`
   starts `no`.
   Re-runs **dedupe by `file:line` + axis**, identical to `review-change`'s
   rule — a blocker already on the ledger at that `file:line`+axis is not
   re-appended; a genuinely new blocker gets the next `Fn` id.
7. **Post the MERGE-READY comment on the PR (MERGE-READY only).** The verdict
   must be visible on the PR itself — as a **comment**, never in a commit
   message (a commit trailing "MERGE-READY" pollutes history and goes stale
   the moment the branch moves). Write the body to a file (Markdown rule —
   see Guardrails) and run
   `gh pr comment <N> --body-file <path>` with exactly this body:

   ```markdown
   <!-- audit-pr:merge-ready sha=<head SHA> -->
   ## ✅ audit-pr: MERGE-READY

   - **Audited head:** `<head SHA>` · CI: <green|local-gate-green>
   - **Review receipt:** `REVIEW-PASS` at `<head SHA>` (consumed, not re-reviewed)
   - **Date:** <YYYY-MM-DD>
   - **Before merge, a human should still verify:**
     - <manual-verification item — or "nothing">

   Any commit after `<head SHA>` voids this verdict — re-run `audit-pr`.
   ```

   **Idempotent:** first check the existing comments
   (`gh pr view <N> --json comments`) for the `<!-- audit-pr:merge-ready -->`
   marker — same SHA already commented → skip (say so); older SHA → post the
   new comment (the newest marker wins). Never post a comment for a BLOCKED
   verdict — blockers go in the chat report only, so the PR page never shows
   a stale green flag.
8. **Report** — the verdict block below, always headed by the PR's full URL.
   In an active `ship-roadmap --fullauto` AUDIT stage, return the verdict to the
   conductor; never run its merge wrapper from this skill.
