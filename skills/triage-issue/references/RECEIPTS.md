## Typed receipts — a legal findings input beside a markdown file

Findings used to arrive one way: a markdown file (`docs/audits/<id>-*.md`, or a
unit's findings carrier). A **receipt** is the same findings without the prose —
a typed envelope whose rows already carry the fields a verdict needs. Both are
legal inputs; this reference owns the receipt half.

### What a receipt is

| Carrier | Where it comes from | What it carries |
|---|---|---|
| `EnvelopeFixNowFinding` rows | the workflow envelope (`@gtrabanco/agentic-workflow-schema`, shape published beside the envelope's `fix_now` array) | `id`, `target` (`S<n>` or `file:line`), `axis`, `severity` (the published ladder), `impact`, `class`, `route` |
| `gate-receipt@1` | the local gate's machine receipt (`gate-receipt@1`, published grammar) | the verdict, the checks and their statuses, the SHA the receipt bound |
| `EXTERNAL VERIFY` block | the owner's local apply/review flow, landed as `docs/fix/<unit>/external-verify.md` | one row per blocker: the claim, the reproducer, the observed result, the verdict |

A receipt is **not** a replacement for the markdown carrier — it is the same
truth with the fields typed. A markdown audit file is still read as a markdown
audit file, and a unit's `## Findings` carrier is still the fold ledger. Never
build a third carrier out of a receipt.

### How the modes consume one

- **Audit-finding mode** (`triage-issue <audit-id> F<k>`) accepts a receipt
  *in addition to* `docs/audits/<id>-*.md`: read the receipt, keep the row ids,
  and continue at step 2 of the audit process (verify against current code).
  The `↳ triaged <date>: <verdict>` note lands in whichever carrier the finding
  came from — the audit file, or the receipt's own source-of-truth file
  (`external-verify.md`).
- **Review-finding mode** (`--prioritize-now <unit> F<k>`) reads the unit's
  findings carrier first and falls back to a receipt only when the carrier is
  empty for that unit. One carrier wins; never merge two.
- **Issue mode** needs no receipt: an issue's body and comments are prose by
  contract.

### Rules that do not bend

1. **A receipt is evidence, never authority.** Every row is re-verified against
   the current tree before a verdict is reached — the same check the markdown
   path owes. A receipt that reproduces nothing is `wontfix` (obsolete) with the
   failing check named.
2. **Freshness is bound, not assumed.** A receipt carries the SHA it was bound
   to. A receipt whose SHA is not an ancestor of the current head is re-run
   before it is read as evidence; when it cannot be re-run, the verdict says so.
3. **Ids survive.** A finding keeps its id through the verdict, the route and
   the fixing unit, so a later reader can join the receipt to the fix.
4. **No new fields, no local dialect.** A receipt is read through the published
   shape. A missing field is a malformed input (stop and report), never a
   default invented here.
5. **One findings carrier per unit.** A receipt never becomes a second ledger:
   the verdict writes to the carrier the unit already owns (`## Findings` for a
   migrated unit, `review-findings.md` for a legacy one, the audit file for an
   audit finding).

### What a verdict does with it

The classification is unchanged — the seven published verdicts, the `Criteria:`
provenance line, the fixed verdict block. The receipt only changes where the row
was read from:

```text
REVIEW FINDING <F-k> — <short title>
Checked: <the receipt row, the command that re-verified it, the observed result>
VERDICT: fix-now | replan-in-unit | decision-required | product-repair | disputed
Action taken: <current-unit fold/phase | unit-lane | user decision>
```
