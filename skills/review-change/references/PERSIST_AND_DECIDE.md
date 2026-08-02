## Persist and decide

9. **Persist fix-now findings to the fold ledger.** The unit's **fix-now fold
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
   their `triage-issue` destinations from step 8.
10. **Report — Return exactly this structure** (fixed output contract; nothing
   more, nothing less):

   ```
   REVIEW CHANGE — scope: <scope>
   Axes run: <list>   Skipped: <list + why>
   Architectural invariants: pass | finding (<ID>) | n/a: no project invariants declared

   <the synthesized decision table (step 6)>

   Manual verification (a human must check):
   - <item> …

   Non-fix-now destinations (step 8): <n> triaged — <issue #s / decisions / drops>

   Summary: <1-2 sentences>
   Decision: PASS | FAIL   (FAIL while any fix-now finding is open)
   ```

11. **Next step.** The `→ Next:` block is **never one static template** — branch
   on the `Decision` value from step 10 and emit the matching block **verbatim,
   as multiple literal lines**. Never join the `·` sub-bullets into one prose
   line — each sub-bullet is its own line, exactly as quoted below.

   **`Decision: FAIL`** (any fix-now finding open) — the recommended line is the
   fold, never the merge gate:

   ```
   → Next: /fold-findings — repair each fix-now finding for real (frozen
     classification, no known-issues dump/downgrade/suppression escape hatch),
     then re-run /review-change
     · /audit-pr → only after the table is clean (not yet — findings open)
     · any finding routed replan-in-unit? → confirm the proposed SPEC phase(s),
       then /execute-phase on this same branch (yes: list the finding ids; no:
       omit this line)
     · non-fix-now → /triage-issue (issue / documented decision / justified drop)
     · adversarial recommendation checklist fired AND this run was
       single-reviewer? → re-run the fold review as /review-change
       --adversarial N (N per the ladder below) instead of single-reviewer
       (yes: <which box fired>; no: omit this line)
     · SPEC drift flagged here AND on a prior unit? → /product-audit (yes: the
       founding assumptions are probably stale — don't keep patching a
       compounding error; no: omit this line)
   ```

   **`Decision: PASS`** (table clean) — the recommended line is the merge gate:

   ```
   → Next: /audit-pr — merge gate
     · non-fix-now → /triage-issue (issue / documented decision / justified drop)
     · adversarial recommendation checklist fired AND this run was
       single-reviewer? → re-run as /review-change --adversarial N (N per the
       ladder below) before /audit-pr (yes: <which box fired>; no: omit this
       line)
     · SPEC drift flagged here AND on a prior unit? → /product-audit (yes: the
       founding assumptions are probably stale — don't keep patching a
       compounding error; no: omit this line)
   ```

   The `/product-audit` line fires **only on recurring drift** — the same kind
   of inconsistency surfacing a second time, not a single isolated finding;
   the yes/no checkbox above is how to decide, in both branches.
