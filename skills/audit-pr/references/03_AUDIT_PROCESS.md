## Process

1. **Gather** — Step 0: project contract, PR, SPEC + artifacts, CI status.
2. **Consume the review receipt** — Step 1: run the receipt verifier, which
   fetches `headRefOid` + comments and applies the currency rule itself:
   `bun scripts/review-receipt.mjs verify --pr <N>` — exit `0` current, `3`
   absent, `4` stale. Its `headRefOid` is the current head SHA: a marker for any
   other SHA is stale, never preserved from a local diff.
   - **current (0)** → acknowledge scope/axes, acceptance coverage, invariant
     result, manual checks; continue to the gates.
   - **absent / stale** → **BLOCKER** (no review evidence at the head), routed to
     `/review-change`; never re-review from here.
3. **Walk the contract** — evaluate every gate above against evidence, recording
   pass / blocker / n-a with the artifact that proves it. The three
   terminal-hygiene gates (`tree-clean`, `branch-pushed`, `pr-ready`) are **read
   from state, never asserted** — hygiene previously had no owner at merge time:
   `bun scripts/audit-pr-gate.mjs hygiene --pr <N> --apply` (exit `0` clean, `2`
   blocked). `--apply` performs the only mechanical repair there is (`gh pr
   ready`, so a draft is flipped rather than reported); a dirty tree names its
   paths and an unpushed branch its commit count — those stay the author's to fix.
   Fold the three results into the gate map you decide on in step 5.
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
   message. Run `bun scripts/audit-pr-gate.mjs comment --pr <N> --head <head
   SHA> --gates-json <gate map>`: it builds the fixed body, posts once, re-reads,
   and **exits non-zero unless the newest `<!-- audit-pr:merge-ready sha=… -->`
   marker names the head**. **Idempotent by marker** — same SHA skips, an older
   SHA re-posts (newest wins) — and it **refuses to post for a BLOCKED verdict**,
   so the page never shows a stale green flag.
8. **Report** — the verdict block below, always headed by the PR's full URL.
   In an active `advance --fullauto` AUDIT stage, return the verdict to the
   conductor; never run its merge wrapper from this skill.
