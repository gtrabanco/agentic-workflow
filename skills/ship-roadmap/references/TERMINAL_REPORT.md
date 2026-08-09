### Final report

Written by the terminal iteration to `docs/features/SHIP_REPORT_<date>.md` on a
`docs/ship-report` branch as a docs-only PR (default: human merges; `--fullauto`:
audit-gated like any PR), and printed in full under the banner:

1. **Run summary** — mode, iterations used vs cap, stop reason, feature counts
   (merged / `done`-awaiting-merge / parked / not started).
2. **Per-feature outcomes** — size planned vs final, phases, gate history,
   review findings folded vs postponed, audit verdict + SHA, PR + final state,
   merged by human or autopilot.
3. **Issues** — the sweep's existing-issue inventory and outcomes: fix-now issues
   shipped (PR links), postponed/wontfix verdicts with the trigger that
   should reopen each (feeds `triage-issue`'s verification model), and
   anything the sweep could not finish (budget/parked) as the explicit
   remaining triage batch. Untracked residue is listed separately as proposals;
   the run created no backlog for it.
4. **New feature proposals** — capabilities discovered during the build that
   serve the product goal (Round 1 quoted as the yardstick), each sized with a
   suggested roadmap slot. Recommend-only.
5. **Residual risks** — weak test areas, `--fullauto` merges deserving a second
   look, parked features and why, silent decisions with outsized consequences.
6. **Manual-verification checklist** — the deduplicated union of every review
   checkpoint's manual checks plus audit notes: what no gate proved.
7. **Going forward** — concrete `product-audit` cadence for this project
   (first one now if ≥2–3 features merged; then ~every 5 or pre-release), and
   the suggested command sequence to continue, closed with the canonical block:

   ```
   → Next: <merge the open PRs | /triage-issue <batch> | /plan-feature --next>
     · accepted proposals → /plan-feature   · product-audit due → /product-audit
   ```

Closing line, verbatim policy: **this report recommends; the human decides.**
