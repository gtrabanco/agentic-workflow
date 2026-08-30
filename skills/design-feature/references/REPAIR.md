## Repair a reviewed Product half

Load this resource only when the unit's `progress.md` carries a
`SPEC-REVIEW-FAIL` or `NEEDS-DESIGN` receipt from `review-spec`, or when the user
asks to close such findings. This is the author's repair pass — the reviewer's
findings are input, never a to-do list to be renegotiated.

### 1. Take the whole findings set as one batch

Read every open finding of the newest spec-stage receipt plus every open finding
this unit previously recorded. Classify each by root cause
(`product | plan | source | environment | runtime`) before touching any file.

Then apply **one evidence-bounded repair batch** to the owning artifact(s) and
request one re-review of the new snapshot. Rules:

- Do not fix one finding, re-review, fix the next, re-review. Findings from one
  review are one batch, because the root cause is usually shared (an un-inventoried
  obligation, a role the matrix never listed, an "obvious" domain convention that
  skipped the expectation sweep).
- Do not split a batch because the findings landed in different files; a Product
  half and its `decisions.md` are one owning artifact set.
- Findings classified outside `product` are **not** repaired here: leave them
  open, name their owner (`review-plan`/`plan-feature` for plan defects, the
  executor for source defects), and say so in the repair note. Repairing a plan
  defect by editing the Product half is scope creep with extra steps.
- Never dismiss a finding by re-arguing with it. Dismissal requires recorded
  counter-evidence that falsifies the claim, written where the finding lives.

### 2. Three repair classes — pick one per finding and record which

| Class | Allowed when | Who acts | Evidence required |
|---|---|---|---|
| Mechanical, intent-preserving | wording, heading order, pointer format, a copy-paste slip in a row that already resolves correctly | this skill, autonomously | a dated `decisions.md` line: which finding ids, why intent is unchanged |
| Closure completion | a blank/`n/a`-less closure row, a missing sweep row, an unlabelled criterion, an unowned unknown | this skill, after acquiring the evidence | new/updated evidence rows at `current` freshness |
| Product change | scope, intent, role, authority, or user outcome actually changes | the human, through this skill's interview | a dated SPEC `## Amendments` row or `Product decisions` entry quoting the user's decision |

The first two stay autonomous **only while reviewed product intent is
unchanged**. If the repair would add, remove, or redirect scope, it is the third
class: stop and ask, one bounded question at a time. The reviewer proved a gap
exists; it never chose how to fill it, and neither does this skill.

### 3. New revision, new review

1. Apply the batch to the Product half and, when a decision was made, to
   `decisions.md` (append, dated — never rewrite a prior decision).
2. Re-run the Spec-lint product boxes and the `stage: spec` readiness preflight;
   paste both results.
3. Mint a **new** `artifactRevisionId` — mandatory even when the bytes came back
   to a previous state. A revert is an authoring event; reusing the old id is how
   a stale PASS gets resurrected.
4. Hand off to `/review-spec <slug>` for a re-review of the new snapshot. Never
   self-certify the repair, never reuse the reviewer's verdict for the new bytes.

### 4. Second cycle = anomaly, not routine

One repair/re-review cycle is the normal path. Entering a second one is a
`CONVERGENCE-ANOMALY`: before any further edit, report the repeated or new finding
ids, the snapshots that changed, the evidence or obligation that was missed,
which stage owns the miss, and why the previous readiness/review/repair failed to
catch it. Route to that owner. More cycles remain allowed when correctness needs
them — they are never a way to earn a PASS, and a cycle budget that runs out does
not downgrade an open finding.

### 5. Guardrails

- Never edit `SPEC-REVIEW-PASS` text, a receipt block, or a finding's severity to
  make a gate pass. Receipts are the reviewer's output.
- Never create a forge issue to hold a current-unit obligation so this batch looks
  closed (descope guard). Amending scope requires the human's dated amendment
  first, an issue second, never the reverse.
- Never widen scope while "already in the file": new obligations re-enter the
  inventory pass with a dated note.
- Upsert rules still apply: append, date, and preserve recorded decisions.
