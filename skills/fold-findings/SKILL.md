---
name: fold-findings
model: opus
effort: high
user-invocable: true
version: 1.4.0
argument-hint: [finding-id …]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Repair persisted fix-now findings in compatible atomic batches: root-cause
  fixes, green gate, commit/push, and per-row `folded: yes` updates. Never
  reclassify or substitute backlog notes. Triggers: "fold-findings", "fix the
  review findings", "repair audit blockers".
---

# Fold Findings

Repair persisted fix-now findings. `review-change` and `audit-pr` classify; this
skill fixes each root cause, never relabeling, deferring, or weakening its check.

## Turn contract — verify before ending the turn

```
✓ 1. Every finding taken up this turn produced its fixed per-finding output
     line (FOLDED <sha> | DISPUTED <reason> | BLOCKED <missing input> |
     REPLAN <proposed phase(s)>) — no finding silently skipped.
✓ 2. For each FOLDED batch: the gate was RUN (not assumed) and green, one
     atomic commit was RUN with its sha pasted, and (if the branch has an open PR)
     `git push` was RUN immediately after that commit.
✓ 3. The ledger row for each FOLDED finding was flipped `folded: no → yes`
     in the same commit — never a bare code fix with the ledger left stale.
✓ 4. No finding was reclassified: no severity downgrade, no fix-now →
     non-fix-now, no "actually this is fine" — a genuine objection produced
     `DISPUTED` with evidence for a user decision, never a silent drop/issue.
✓ 5. The closing `Folded: n/m · Disputed: k · Blocked: j[ · Replan: r]` tally
     and outcome-branched `→ Next:` block are printed as the ABSOLUTE last output.
     Every affected finding ID is named in that block, joined with ` + `.
```

Any unchecked box means the turn is not done.

## When to use

After `/review-change` reports `REVIEW-FAIL` with fix-now rows, or `/audit-pr`
reports `VERDICT: BLOCKED` (every blocker is fix-now). If the ledger is absent or
incomplete, reconstruct rows from the verdict in Step 0. Never process
postpone/wontfix/promote/documented-tradeoff rows; those belong to `/triage-issue`.

## Step 0 — Discover the project (always first)

Per Workflow conventions, read:

1. The unit's `review-findings.md` under `docs/features/<NN>-<slug>/` or
   `docs/fix/<n>-<topic>/`; schema is owned by `review-change`/`audit-pr`:

   ```
   | id | file:line | axis | severity | class | route | folded |
   ```

   After `VERDICT: BLOCKED`, append missing rows (`class: fix-now`, `folded: no`,
   next free `Fn`, dedupe `file:line`+axis), commit as
   `docs(<unit>): reconstruct fold ledger from audit-pr blockers`, then fold;
   never report “no findings”.
2. Queue `folded: no` rows; explicit IDs restrict it and leave other rows
   untouched. Group by root cause, verifier and rollback boundary.
3. The project's verification gate and forge CLI (use the declared forge).
4. Whether the branch has an open PR; this decides immediate push after commit.

## Progressive loading — fold queue

The allowlist is exactly these two paths; read both, in order, before changing
code or the ledger:

1. [frozen classification, definition of fixed, and forbidden actions](references/FOLD_POLICY.md)
2. [per-finding fold process](references/FOLD_PROCESS.md)

Both are normative and one hop from this file. Missing resource → stop; never
infer a classification or fold procedure.

## Report — return exactly this structure (fixed output contract)

Per finding, in processing order:

```
| <finding-id> | verdict: FOLDED <sha> | DISPUTED <reason → user decision> | BLOCKED <missing input> | REPLAN <proposed phase(s) → /execute-phase> |
```

Then exactly:

```
Folded: n/m · Disputed: k · Blocked: j · Replan: r
```

Omit `· Replan: r` when `r = 0` (preserves the existing three-field format).

Then print the REPAIR-RECEIPT as the ABSOLUTE-last output, together with the
branching `→ Next:` block below. The receipt is immutable once printed; a
later fold prints a new receipt (append-only output history — no ledger row,
no schema field). Six fields, always present:

```
## REPAIR-RECEIPT
- Repaired: <F-ids with (VF-<n>) refs, joined ` + `, or `none`>
- Refuted/open: <F-ids joined ` + `, or `none`>
- Gate: <command> → exit <n> at head <40-hex sha> · n/a when nothing was folded
- Batch class: <all-repair-in-place | frozen (replan present) | none>
- Fold diff: <shortstat from a real `git diff` run> · none when nothing was folded
- Branch: <RE-REVIEW-REQUIRED (delta) | RE-REVIEW-OPTIONAL | RE-REVIEW-SKIPPED | REPLAN-ROUTE>
```

- The `Gate` line carries the actual exit codes observed at the head the gate
  ran on — green or red. A **failed gate never silences the receipt**: the
  batch is reported with the observed exit codes and nothing folded (a red gate
  is not a silent gap).
- The `Fold diff` shortstat comes from a real `git diff` run over the batch's
  commits.
- The `Batch class` derives from the taken queue's frozen rows only — the fold
  never reclassifies (`all-repair-in-place`, `frozen (replan present)`, or
  `none` for an empty queue); the vocabulary comes from
  `review-implementation`'s closed class set.

**Freeze-batch (replan present).** When the taken queue contains any row whose
frozen class is `replan-in-unit` or `decision-required`, nothing folds: no
`folded: yes` flips, no commits. The receipt records the `REPLAN-ROUTE` branch
and every retained (unfolded) row id, and the loop stops to route to planning.

## Guardrails

Scope is the ledger (or explicit ID subset); unlisted discoveries are proposals
for user triage. Batch only when one root-cause correction, validator set and
rollback boundary own the rows: one commit/push, individual ticks/lines. Split
otherwise. Do not widen beyond a finding's file/line/axis unless its root cause
requires it; explain that in the commit. Artifact language follows user
instruction > project docs language > English; conversation language never decides.

## Portability (agents other than Claude Code)

Use explicit fallbacks when a primitive is absent: open named `SKILL.md` files in
a fresh context; use the strongest model for subtle logic/security and never
weaker than the author; process the compatible queue once and re-run only after
new review evidence.

## Relationship to other skills

```
review-change ──FAIL──┐
audit-pr ──BLOCKED─────┼──▶ fold-findings ──FOLDED──▶ re-run review-change / audit-pr
                       │                  ──DISPUTED─▶ user decision
                       │                  ──BLOCKED──▶ user supplies missing input
```

`review-change`/`audit-pr` classify and persist; this skill only flips
`folded: no` to `yes` after a real fix. `execute-phase`'s embedded fold checklist
is the inline fallback; this standalone path keeps frozen classification and its
forbidden list and never runs above its tier. `DISPUTED` stops for user evidence;
no issue is created.

## Done when

Every queued finding has its per-finding verdict and tally; every `FOLDED`
finding belongs to a pushed atomic batch and ticked row. Nothing is reclassified
or touched outside the queue.

```
→ Next: (branches on outcome; list every affected finding ID once as `F1 + F2 + …`)
  · all FOLDED (<F1> + <F2> + …) → /review-change — re-review the branch now that all listed findings are fixed
  · any DISPUTED (<F1> + <F2> + …) → user decision — resolve every evidenced dispute without creating backlog
  · any BLOCKED (<F1> + <F2> + …) → supply the listed missing inputs, then re-run /fold-findings
  · any REPLAN (<F1> + <F2> + …) → confirm all proposed SPEC phases, then /execute-phase on this same branch
```

Replace placeholders with every actual affected finding ID before printing; never
print `<F2>`, `…`, or a single representative ID in a live hand-off.

## Closing-block decision branch (choose one, at emission)

The closing block picks exactly one of four outcomes. The **no-decision →
re-review default** holds whenever the turn carries no recorded prior consumer
decision to skip.

| Batch state | Branch | `→ Next:` (consumer) |
|---|---|---|
| freeze-batch (≥ 1 replan-class row) | `REPLAN-ROUTE` | plan-fix/execute-phase on this unit after the user confirms the replan |
| `all-repair-in-place` + docs-only + no folded row severity `high` + prior consumer skip decision | `RE-REVIEW-SKIPPED` | skip — consumer has explicitly decided to skip the re-review |
| `all-repair-in-place` + docs-only + no folded row severity `high` | `RE-REVIEW-OPTIONAL` | `/review-change` (default, delta mode) — or the consumer's recorded skip decision |
| empty batch (class `none`) | `RE-REVIEW-OPTIONAL` | `/review-change` by default — safe: the head is unchanged |
| anything else (behavioral surface or any folded row `high`) | `RE-REVIEW-REQUIRED (delta)` | `/review-change` — delta mode mandatory default |

**Branch-selection decision inputs.**

- **Docs-only test (E-D3).** ``RE-REVIEW-OPTIONAL`` requires every fold-diff
  file to be a Markdown/documentation file; otherwise the batch is behavioral
  (→ `RE-REVIEW-REQUIRED (delta)`).
- **Frozen-severity-`high` override.** A folded row whose frozen severity is
  `high` forces `RE-REVIEW-REQUIRED (delta)` even on a docs-only diff. Frozen
  fields are never edited to reach a branch.
- **SKIPPED requires prior consumer decision (E-D2).** `RE-REVIEW-SKIPPED`
  is printed only by a turn carrying an explicit prior consumer decision to
  skip. A turn with no recorded prior consumer decision prints
  `RE-REVIEW-OPTIONAL` + the re-review default, **never** `RE-REVIEW-SKIPPED`.
