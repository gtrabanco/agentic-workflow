## Review-finding process

Use this route only for `/triage-issue --prioritize-now <unit> F<k> [F<j> …]`
after `/fold-findings` leaves rows unresolved.

1. Read the target unit's SPEC, frozen acceptance, current PR HEAD, the full
   `review-findings.md`, and the evidence for every named row. Confirm that
   each row is still `folded: no`; never triage a row already folded.
2. Reproduce or verify every finding against the current code. Keep the
   finding's original ID, severity, class, and route in the report. Do not
   turn a review finding into a generic issue just to make it disappear.
3. Apply the `--prioritize-now` instruction to every row:

   - A complete correction that fits the current unit and is reviewable now
     remains on the current unit. Route it to `/fold-findings` or an explicit
     `/execute-phase <unit> P<n>`.
   - A correction too large for the current fold is `replan-in-unit`. For a
     feature, re-run `/plan-feature <slug>`; for a fix, re-run `/plan-fix
     <issue-number>`. The plan must append concrete `P<n>` phases to the unit's
     SPEC and preserve the finding's acceptance evidence.
   - A product, architecture, or acceptance decision that blocks safe work is
     `decision-required`. Ask the user; do not guess or weaken the finish line.
   - A finding disproved by current evidence is `disputed`. Preserve the row
     and show the evidence; do not mark it folded or silently delete it.

4. Never implement the new phases in this triage turn. After a replan, ask the
   user to continue manually with `/execute-phase <unit> P<n>` (or the fix
   equivalent), then re-run `/review-change` on the resulting HEAD (the manual path).

Return exactly one block per finding:

```text
REVIEW FINDING <F-k> — <short title>
Checked: <commands and evidence>
VERDICT: fix-now | replan-in-unit | decision-required | disputed
Action taken: <current-unit fold/phase | plan-feature | plan-fix | user decision>
```

Close with every finding ID mapped to its own command, joined with ` + `, and
ask the user to execute any newly appended phases manually. A `replan-in-unit`
result never means the loop passed.
