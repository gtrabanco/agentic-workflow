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
- Never dismiss a finding by re-arguing with it: dismissal requires recorded
  counter-evidence that falsifies the claim (`pre-execution-review/references/POLICY.md`
  §2), written into the
  `planning-findings.md` row's resolution evidence, never into chat.

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

Cycle rules have one owner: `pre-execution-review/references/POLICY.md` §4 — a repeat needs a changed
snapshot or a named falsifiable question plus a new evidence route, and entering
a second repair/re-review cycle prints the `CONVERGENCE-ANOMALY` block (repeated
and new finding ids, the snapshots that moved, the evidence or obligation missed,
the owning stage, and why the prior readiness/review/repair failed) **before** any
further edit, then routes to that owner. More cycles stay allowed when
correctness needs them; they never earn a PASS, and an exhausted cycle budget
does not downgrade an open finding.

A repair responding to a persisted verdict is **never** a loop defect (POLICY §4
scopes every guard to blind re-reviews): a unit whose `progress.md` carries an open
FAIL/NEEDS-DESIGN receipt is being repaired by definition, so no "already complete"
answer exists for it and no cycle cap converts its verdict into a dead end.

The spec-stage detail this skill adds: the owning stage of a Product-half miss is
`product` unless the evidence proves the plan asked for something the SPEC never
said — then it is `plan`, and it leaves this skill for `plan-feature`.

### 5. Guardrails

- Never edit `SPEC-REVIEW-PASS` text, a receipt block, or a finding's severity to
  make a gate pass. Receipts are the reviewer's output.
- Never create a forge issue to hold a current-unit obligation so this batch looks
  closed (descope guard). Amending scope requires the human's dated amendment
  first, an issue second, never the reverse.
- Never widen scope while "already in the file": new obligations re-enter the
  inventory pass with a dated note.
- Upsert rules still apply: append, date, and preserve recorded decisions.
