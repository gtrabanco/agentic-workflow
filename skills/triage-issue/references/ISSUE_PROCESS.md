## Process

1. **Parse the issue's own contract.** Extract its severity and any "When to
   fix" / "Trigger" / "Acceptance (when triggered)" clause. Many issues carry an
   explicit signal-based trigger — honor it.
2. **Verify the trigger against current code.** Do the actual check, e.g.:
   - count real consumers of a duplicated helper (is the "3rd consumer" here?),
   - check a threshold (article count, p95 latency, row count),
   - reproduce a reported defect, or confirm it's already fixed.
   Use `grep`/`gh`/tests — cite the evidence (paths, counts, line refs).
3. **Scope-membership check.** Before classifying, decide whether this issue
   already belongs to a unit that is currently open, per this fixed checklist
   (every item independently checkable):
   - List candidate open units mechanically: roadmap/fix-index rows with
     status `in-progress` or `planned`, plus any unit with an open PR
     (`gh pr list --state open`).
   - For each candidate, compare the issue against it: membership = ✓ the
     issue's ask overlaps a SPEC **acceptance criterion** or a **phase task**
     — quote **both** sides (the issue's own line and the matching SPEC/phase
     line) before calling it a match; no quote pair means not a member.
   - **Member of an open unit → verdict `fix-in-unit <unit>`.** Resolve the
     issue on that unit's own branch, never as a new standalone unit. Pick
     exactly one of these sub-routes:
     - *repairable as-is* → **fold into the unit's** current/next phase, or
       append a provenance-marked row to the unit's `review-findings.md` (see
       *Ledger-append mechanism* below).
     - *changes the unit's shape* → **incremental replan** on the same unit:
       name the exact command — `design-feature <slug> "<instruction>"`
       (product half, upsert) for a product-shape change, `plan-feature
       <slug>` (re-run, engineering half) for an engineering-shape change, or
       a user-approved, dated `## Amendments` entry per #66's mechanism (fix
       units). Never write "replan if needed" — always name which of the
       three applies and why.
     - *born as an un-amended descope of an unmerged unit* →
       **scope-bleed restore**: the route is restore-the-criterion-in-the-unit
       (no matching `## Amendments` entry); the issue closes as
       scope-returned, not as new work.
   - No candidate matched → fall through to today's four-verdict
     classification below, unchanged.
4. **Classify** into one of:
   - **fix-now** — defect or trigger met → route to `plan-fix` then
     `execute-phase --fix`; add the entry to the fix index. **High severity** →
     apply the urgency label per *Urgency label vocabulary* above (`urgent` by
     default; `fix-next` when the call is "queue it next" rather than "maybe
     interrupt now" — see that section's table). Non-high severity → no label.
   - **promote-to-feature** — really new capability → route to `plan-feature`
     (the router handles the issue path). Apply the `promoted` disposition
     label per *Disposition label vocabulary* above.
   - **postpone** — valid but trigger unmet → leave open; post a **dated
     re-confirmation** comment stating what you checked and why it stays
     deferred. Do **not** implement deferred work inline. Apply the
     `postponed` disposition label per *Disposition label vocabulary* above.
   - **wontfix** — obsolete or explicitly bounded by the issue → propose closing,
     with rationale. Apply the `wontfix` disposition label per *Disposition
     label vocabulary* above.
5. **When the call is the user's, ask.** If the decision hinges on product/risk
   judgment rather than evidence, present the verdict and options and let the
   user choose before acting.
6. **Report and keep docs coherent.** Post the decision as a dated issue comment
   with evidence. **The comment is Markdown, not shell — never hand-escape it:**
   backticks / `*` / `_` in the body are formatting; a `\` before them renders
   literally (`` \`code\` `` instead of `` `code` ``). Write the comment body to
   a file with the Write tool (plain Markdown, real backticks, zero backslashes)
   and post it with **`gh issue comment <n> --body-file <path>`** (or the
   declared forge's equivalent) — never an inline `--body "…"` or a quoted
   heredoc, which mangle backticks. After posting, `gh issue view <n> --json
   comments` must show the backticks rendering, no literal `` \` ``. On a
   fix-now + high-severity verdict, the comment also states the urgency label
   applied (or the failure to apply it — see *Apply-on-verdict (urgency)*
   above); on a **postpone**, **promote**, or **wontfix** verdict, the comment
   states the disposition label applied instead (or its failure — see
   *Apply-on-verdict (disposition)* above). Either way this is
   the one GitHub-state mutation this skill makes without separate
   confirmation, because it is fully determined by the verdict just reached,
   never by issue text. If it
   becomes an active fix, register it in the fix index; if
   closed, remove any stale index entry. Any **other** GitHub state mutation
   (closing, unrelated labels) still needs confirmation when ambiguous.
7. **Return exactly, per issue** (fixed verdict format — batch runs repeat it,
   then add one summary table):

   ```
   ISSUE #<n> — <title>
   Trigger (the issue's own): <quoted clause | "none stated">
   Checked: <the exact commands/counts/repro run>
   Evidence: <paths, counts, line refs, output>
   VERDICT: fix-now | fix-in-unit | promote | postpone | wontfix
   Action taken: <fix-index entry + route | dated comment posted + disposition label applied | close proposed + disposition label applied>
   ```

   No member unit matched a `fix-in-unit` candidate for this issue → the
   verdict, evidence, and action above are exactly what they would have been
   without the scope-membership step — today's four-verdict classification,
   unchanged.

   **Batch summary table — group by home unit.** When triaging several issues
   in one run, the closing summary table groups every `fix-in-unit` issue
   under its home unit's heading (one heading per unit, its member issues
   listed beneath), with any issue that matched no open unit listed last under
   a plain "no member unit" heading — this is the signal that surfaces N
   issues sharing one open unit at a glance, not N separate rows.

