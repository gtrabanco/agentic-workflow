## Review-finding process

Use this route only for `/triage-issue --prioritize-now <unit> F<k> [F<j> …]`
after `/fold-findings` leaves rows unresolved.

1. Read the target unit's SPEC, frozen acceptance, current PR HEAD, the full
   findings carrier — the unit doc's `## Findings` for a migrated unit (#308),
   `review-findings.md` for a legacy one, probed in that order and never both —
   and the evidence for every named row. Confirm the row is still open in its own
   carrier: `folded: no` in a legacy ledger, still present in `## Findings` for a
   migrated unit (a folded row has left that table for a `## Log` `F` line); never
   triage a row already folded.
2. Reproduce or verify every finding against the current code. Keep the
   finding's original ID, severity, class, and route in the report. Do not
   turn a review finding into a generic issue just to make it disappear.
3. Apply the `--prioritize-now` instruction to every row:

   - A complete correction that fits the current unit and is reviewable now
     remains on the current unit. Route it to `/fold-findings` or an explicit
     `/execute-phase <unit> P<n>` — **never implement it in this turn**. The
     fold owns the fix, the gate and the `folded:` flip: writing the flip here
     would make this skill the second owner of a state
     `ledger-ownership@1` assigns solely to `fold-findings:folded-flag`
     (`LEDGERS.md`), so a row this skill appends starts `folded: no` and stays
     that way until the fold closes it.
   - A correction too large for the current fold is `replan-in-unit`. Run
     `bun scripts/unit-route.mjs <unit>` (node fallback if bun is not installed);
     its `route: replan` line prints the planner command — `/unit-lane <unit>` for a
     feature, `/unit-lane --fix <n>` for a fix — which re-runs the lane's `plan` step and appends concrete
     `P<n>` phases to the unit's SPEC, preserving the finding's acceptance
     evidence. The lane's `review` step gates execution.
   - A product, architecture, or acceptance decision that blocks safe work is
     `decision-required`. Ask the user; do not guess or weaken the finish line.
   - A finding disproved by current evidence is `disputed`. Preserve the row
     and show the evidence; do not mark it folded or silently delete it.
   - A `fix-now` finding whose owning stage is `product` — the finding is
     against the product half, not the code — is `product-repair` (#293). Run
     `bun scripts/unit-route.mjs <unit>` (node fallback if bun is not installed);
     its `route: product` line prints the lane hand-off (`/unit-lane <unit>` for a feature, `/unit-lane --fix <n>`
     for a fix): the lane repairs the half, its review step re-judges it. Never
     fold it into the current unit — the fold loop repairs source, not
     authority (`pre-execution-review` POLICY §4).

4. Never implement the new phases in this triage turn. After a replan, ask the
   user to continue manually with `/execute-phase <unit> P<n>` (or the fix
   equivalent), then re-run `/review-change` on the resulting HEAD (the manual path).

Return exactly one block per finding:

```text
REVIEW FINDING <F-k> — <short title>
Checked: <commands and evidence>
VERDICT: fix-now | replan-in-unit | decision-required | product-repair | disputed
Action taken: <current-unit fold/phase | unit-lane | user decision>
```

Close with every finding ID mapped to its own command, joined with ` + `, and
ask the user to execute any newly appended phases manually. A `replan-in-unit`
result never means the loop passed.
