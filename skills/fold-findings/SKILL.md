---
name: fold-findings
user-invocable: true
version: 1.11.0
argument-hint: [finding-id …]
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
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
✓ 6. Claim-evidence loop ran: before committing, every claim the repair
     introduces was reproduced with the command and observed output pasted
     into the claim table (`claim | command | output | ✓`). Loop ran until
     green inside the same turn. (S5)
✓ 7. Class escalation checked: ≥ 2 folded rows sharing mechanism+axis
     were escalated to one class-level fix-now finding. (S1)
✓ 8. Evidence-bound check: every finding citation was verified — the cited
     file:line exists and the snippet matches the working tree verbatim. (S10)
✓ 9. Reviewer anti-invention check: new findings are grounded in
     provably-changed bytes (git-computed) or a mis-run cited check. (S10)
✓ 10. Net narration diff ≤ 0 per fold: lines deleted, not moved. (S10)
✓ 11. Closure status printed: `closure: complete | open(n)`. (S4)
```

Any unchecked box means the turn is not done.

## When to use

After `/review-change` reports `REVIEW-FAIL` with fix-now rows, or `/audit-pr`
reports `VERDICT: BLOCKED` (every blocker is fix-now). If the ledger is absent or
incomplete, reconstruct rows from the verdict in Step 0. Never process
postpone/wontfix/promote/documented-tradeoff rows; those belong to `/triage-issue`.

## Step 0 — Discover the project (always first)

Per Workflow conventions, read:

1. The unit's findings carrier: a migrated unit (issue #308) keeps its OPEN rows
   in its own `SPEC.md` under `## Findings`, with folded history and marks as
   `## Log` lines; a legacy unit keeps `review-findings.md` under
   `docs/features/<NN>-<slug>/` or `docs/fix/<n>-<topic>/`. Probe the doc first and
   fall back to the file — a unit with the section never reads both. Each carrier
   has **its own** schema, owned by `review-change`/`audit-pr` and stated for both
   shapes in `pre-execution-review/references/LEDGERS.md`:

   - legacy (7 cols): `\| id \| file:line \| axis \| severity \| class \| route \| folded \|`
     — closing a row flips `folded: no → yes`, and this skill is that flip's sole writer
   - migrated (6 cols, `findings-table@1`): `\| id \| S# / file:line \| axis \| severity \|
     class \| route \|` — every row it holds is OPEN; closing one **deletes the row** and
     appends a `## Log` `F` line naming the fold commit. There is no `folded` column to
     flip, and `class` here is the repairing owner (`product`/`plan`/`source`/
     `environment`/`runtime`), not a disposition.

   Never write one carrier's row into the other's grammar. After `VERDICT: BLOCKED`,
   append missing rows in the carrier's own schema (next free `Fn`, dedupe
   `file:line`+axis; legacy `class: fix-now`, `folded: no`), commit as
   `docs(<unit>): reconstruct fold ledger from audit-pr blockers`, then fold; never
   report “no findings”.
2. Queue the carrier's open rows — a legacy `folded: no` row, a migrated row of
   `## Findings` (all of them are open); explicit IDs restrict the queue and leave
   other rows untouched. Group by root cause, verifier and rollback boundary.
3. **Class escalation (S1).** After grouping: ≥ 2 folded rows sharing
   mechanism+axis ⇒ one class-level fix-now finding whose repair targets the
   *mechanism*, not a repeated instance. The two-cycle cap then means what it
   was built to mean: a class the loop refuses to repair is a planning defect,
   not more folds. Document the escalation as `F<next> (class: <mechanism>,
   replaces F<a> + F<b> + …)` in the ledger.
4. **Evidence-bound check (S10, from #218).** Before processing, verify every
   finding's citation: the cited `file:line` exists and the snippet matches the
   working tree verbatim. Wrong-citation and position-drift findings are
   discarded mechanically — `refuted` with evidence, no cycle consumed.
5. **Reviewer anti-invention check (S10, from #205).** Any new finding surfaced
   during fold must be grounded in **provably-changed bytes** (git-computed) or
   a **mis-run cited check** (the cited validator's own output contradicts it).
   A finding without changed-bytes grounding is a report-note, never fix-now.
6. The project's verification gate and forge CLI (use the declared forge).
7. Whether the branch has an open PR; this decides immediate push after commit.

## Progressive loading — fold queue

The allowlist is exactly these two paths; read both, in order, before changing
code or the ledger:

1. [frozen classification, definition of fixed, and forbidden actions](references/FOLD_POLICY.md)
2. [per-finding fold process](references/FOLD_PROCESS.md)

Both are normative and one hop from this file. Missing resource → stop; never
infer a classification or fold procedure.

## Claim-evidence loop (S5 — mandatory before commit)

Before committing the fold fix, run the claim-evidence loop. This is not optional;
a turn that writes without verifying its own claims is the exact failure class
that produced unit 79's F49→F50→F51.

1. **Claim ledger.** Enumerate every claim the repair introduces: each new
   figure, cross-reference, "X is now Y"; in code: each behavior the fix
   declares. Write one row per claim.
2. **Mandatory reproduction.** Every claim is executed, never asserted:
   re-derive the figure with the command, resolve the reference with grep,
   reproduce the behavior. Paste command + observed output into the claim
   table — never type the expected result by hand.
3. **Loop until green.** red → repair → re-run, *inside the same turn*, until
   every claim in the closure set verifies. The repairer's turn does not end
   with unreproduced claims.
4. **Admission rule.** If no command can verify the sentence, it is not a
   claim, it is an opinion, and it does not get written. This extends the
   repo's own tests-first rule to documentation artifacts.

Output the claim table as:

```
## Claim-evidence table
| claim | command | output | status |
|---|---|---|---|
| <claim text> | `<command>` | `<observed output>` | ✓ |```

All rows must have `status: ✓`. A `status: ✗` row means the turn is not done
— repair and re-run the claim.

The row shape is published grammar, not convention (`evidence-row@1` in
`@gtrabanco/agentic-workflow-schema`: `EVIDENCE_ROW_COLUMNS`,
`EVIDENCE_ROW_VERDICTS`, `validateEvidenceRow`). A row whose claim is empty, whose
command or output is not a backticked command/observation, or whose verdict is
outside `✓ | ✗` is a shape violation — prose in the command cell is refused
exactly like an empty one, because a typed expectation is the defect the shape
exists to stop.

## Closure status (S4, S11)

At the end of the fold, print the closure status:

```
closure: complete | open(n)
```

- `complete` — all findings in the queue are resolved (folded, refuted, disputed, or replanned).
- `open(n)` — n findings remain open (blockers that need user input). Print the count and the blocker IDs.

Cycle-count stops being the health metric; closure is the invariant.

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
- Batch class: <all-repair-in-place | frozen (replan present) | frozen (product owner present) | none>
- Fold diff: <shortstat from a real `git diff` run> · none when nothing was folded
- Branch: <RE-REVIEW-REQUIRED (delta) | RE-REVIEW-OPTIONAL | RE-REVIEW-SKIPPED | REPLAN-ROUTE | PRODUCT-ROUTE>
```

- The `Gate` line carries the actual exit codes observed at the head the gate
  ran on — green or red. A **failed gate never silences the receipt**: the
  batch is reported with the observed exit codes and nothing folded (a red gate
  is not a silent gap).
- The `Fold diff` shortstat comes from a real `git diff` run over the batch's
  commits.
- The `Batch class` derives from the taken queue's frozen rows only — the fold
  never reclassifies (`all-repair-in-place`, `frozen (replan present)`,
  `frozen (product owner present)`, or `none` for an empty queue); the
  vocabulary comes from `review-implementation`'s closed class set.

**Freeze-batch (replan present).** When the taken queue contains any row whose
frozen class is `replan-in-unit` or `decision-required`, nothing folds: no
`folded: yes` flips, no commits. The receipt records the `REPLAN-ROUTE` branch
and every retained (unfolded) row id, and the loop stops. The consumer is the
conclusion the already-run router printed, never the invocation itself: on
`route: replan` the planner command it printed — `/unit-lane <slug>` for a
feature unit or `/unit-lane --fix <n>` for a fix unit; on `route: decision` stop
and surface the decision to the user, never a planner. `<unit>` is the bare folder number or the full slug (both resolve). The invocation
`bun scripts/unit-route.mjs <unit>` (node fallback if bun is not installed) is the discovery step the fold already
ran; it is never the recommendation.

**Freeze-batch (product owner present).** Any taken `fix-now` row whose `Route`
cell begins `product owner`, `product-owned` or `owned by product` (head-anchored,
identical to `scripts/unit-route.mjs`'s `PRODUCT_ROUTE` regex,
per `#293`) freezes the batch too —
nothing folds, no `folded: yes` flips, no commits: the fold loop repairs source,
never authority (`pre-execution-review` POLICY §4, `#293`). The receipt records
the `PRODUCT-ROUTE` branch and the retained row ids; the consumer is the
router's printed `route: product` lane hand-off. Full condition and hand-off
table: [`FOLD_PROCESS.md`](references/FOLD_PROCESS.md) §Batch classification.

## Guardrails

Scope is the ledger (or explicit ID subset); unlisted discoveries are proposals
for user triage. Batch only when one root-cause correction, validator set and
rollback boundary own the rows: one commit/push, individual ticks/lines. Split
otherwise.

**The fix covers the change and everything that depends on it.** When what a
piece receives changes, find its callers; when what it delivers changes, find
its consumers; when something is removed, check what still uses it and ask
before breaking it. A surviving mention of what changed — a comment, a prose
claim, a declared validator, a manifest narration, a sibling surface stating
the same thing — is part of this same fold, never a finding for the next
cycle. The fold ends when nothing still asserts what is no longer true; state
in the commit which surfaces the correction swept. Artifact language follows user
instruction > project docs language > English; conversation language never decides.

**A token- or claim-shaped change carries its sweep declaration.** When the
fold changes a published vocabulary token, a claim kind, a phrase a surface
asserted, or a reader/echo pattern, append one fixed line per stale form to
this fold's `## Log` entry (a legacy unit's `## Progress log`) — the same
bar as `log-kind@1` and `findings-table@1`: fixed grammar, fixed output, no
judgment calls:

```
swept: /<pattern>/<flags> → expected <n> in <glob>
```

`<pattern>` is the stale form as a JS regex body, `<flags>` its flags (empty
allowed); `<n>` is the survivor count you expect outside the allowlist —
normally `0`, and non-zero only where the `<glob>` names surfaces that
legitimately keep the form (the ledger's own quote of the finding, log lines,
fixtures). `<glob>` is the bounded scope: the finding's cited surface plus its
inventory-declared siblings, never a repo-wide sweep. The pattern body carries
the bounds the gate refuses outside — at most 200 characters, and never a
quantified group whose own body is quantified — because the gate runs that body
once per line of the whole `<glob>` corpus, so an over-bound declaration is
refused by name instead of compiled (`bun
scripts/promise-coherence.mjs`, node fallback if bun is not installed) re-runs
every declared grep and fails closed with `sweep-mismatch`, naming
`file:line`, the regex and the observed count. A fold that changes such a
surface and emits no declaration is a `workflow` finding at review.

**Re-review skip default inversion (S9, feature 30).** The `RE-REVIEW-OPTIONAL/SKIPPED`
branch shipped in feature 30 was never exercised once (11 cycles on docs-only
changes). Fix: for docs-only batches with a green sweep declaration
(#315's claim kind), **skip becomes the machine-decided default** — re-review
requires recorded justification. Why safe *now*: the residual risk the default
hedged (stale survivors) becomes a pre-commit failure once #315's sweep kind
exists. The decision moves from human inertia (always yes) to machine rule
(batch class + sweep green ⇒ skip).

**Net narration diff ≤ 0 (S10 1).** Each fold must strictly decrease the defect
surface. Add a computed check: the net narration diff per fold must be ≤ 0 —
lines deleted, not moved. Measured by `git diff --numstat` over the fold's
commit. This is the arithmetic that makes #307's "deterministic gates converge"
possible.

**Defect identity: mechanism, not file:line (S4).** Defect identity in the ledger
moves from `file:line` to the *mechanism* (the site stays as evidence). When
folding, group by mechanism+axis, not by file:line+axis. The same bug surfacing
as F49, then F50, then F51 costs a full review cycle each time when grouped by
file:line; grouped by mechanism, one class escalation fixes all three.

**Per-file review state (S10 6, from #218; shipped as S16).** `review-state.json`
per unit, single writer = `scripts/review-state.mjs`, model passes read-only: each
file in the affecting-path inventory ends a cycle `reviewed@<sha>` or
`skipped@<sha>` with a concrete reason; skips auto-invalidate when a later diff
touches the file; coverage closure `inventory − reviewed − skipped = 0` is a
mechanical receipt check. Run `node scripts/review-state.mjs check --unit <slug>`
and paste the block — `closure: complete` exits 0, `closure: open(n)` exits 1 and
is a blocker, never a note.

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

`review-change`/`audit-pr` classify and persist;
`ledger-ownership@1` / `fold-findings:folded-flag` is the sole writer of
the `folded: no → yes` flip — this skill only flips that flag after a real
fix. `execute-phase`'s embedded fold checklist
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
  · any REPLAN (<F1> + <F2> + …) → /unit-lane <slug> or /unit-lane --fix <n> — the lane re-runs its plan step, appends the phases to the unit's SPEC; its review step gates before /execute-phase on this unit
  · any DECISION (<F1> + <F2> + …) → stop and surface the decision to the user — a `route: decision` conclusion names no planner, so the unit waits on the user before any plan or code change
  · any PRODUCT (<F1> + <F2> + …) → /unit-lane <slug> or /unit-lane --fix <n> — the lane repairs the half, its review step re-judges it
```

Every `· ` sub-bullet is exactly one physical line — never hard-wrapped across
several lines, never joined into one prose line.

Replace placeholders with every actual affected finding ID before printing; never
print `<F2>`, `…`, or a single representative ID in a live hand-off. Resolve the
`/unit-lane <slug>` / `/unit-lane --fix <n>` unit argument the same way — never
carry `<slug>` or `<n>` into a live hand-off.

## Closing-block decision branch (choose one, at emission)

The closing block picks exactly one of five outcomes. The **no-decision →
re-review default** holds whenever the turn carries no recorded prior consumer
decision to skip.

| Batch state | Branch | `→ Next:` (consumer) |
|---|---|---|
| freeze-batch (≥ 1 product-owned row) | `PRODUCT-ROUTE` | `/unit-lane <slug>` (feature) or `/unit-lane --fix <n>` (fix) when the router concludes `product` — the lane repairs the half through its `design` step, its `review` step re-judges it; the conclusion printed by `bun scripts/unit-route.mjs <unit>` (node fallback if bun is not installed; discovery step the fold already ran) |
| freeze-batch (≥ 1 replan-class row) | `REPLAN-ROUTE` | `/unit-lane <slug>` (feature) or `/unit-lane --fix <n>` (fix) when the router concludes `replan` — user confirms, the lane's `plan` step appends the phases and its `review` step gates, then `/execute-phase` on this unit; on `route: decision` stop and surface the decision to the user — the conclusion printed by `bun scripts/unit-route.mjs <unit>` (node fallback if bun is not installed; discovery step the fold already ran) |
| `all-repair-in-place` + docs-only + green sweep declaration + no folded row severity `high` | `RE-REVIEW-SKIPPED` | skip — green sweep (#315) + docs-only ⇒ skip is default (S9); re-review requires recorded justification |
| `all-repair-in-place` + docs-only + no sweep declaration + no folded row severity `high` + prior consumer skip decision | `RE-REVIEW-SKIPPED` | skip — consumer has explicitly decided to skip the re-review |
| `all-repair-in-place` + docs-only + no sweep declaration + no folded row severity `high` | `RE-REVIEW-OPTIONAL` | `/review-change` (default, delta mode) — or the consumer's recorded skip decision |
| empty batch (class `none`) | `RE-REVIEW-OPTIONAL` | `/review-change` by default — safe: the head is unchanged |
| anything else (behavioral surface or any folded row `high`) | `RE-REVIEW-REQUIRED (delta)` | `/review-change` — delta mode mandatory default |

**Branch-selection decision inputs.**

- **Docs-only test (E-D3).** ``RE-REVIEW-OPTIONAL`` requires every fold-diff
  file to be a Markdown/documentation file; otherwise the batch is behavioral
  (→ `RE-REVIEW-REQUIRED (delta)`).
- **Frozen-severity-`high` override.** A folded row whose frozen severity is
  `high` forces `RE-REVIEW-REQUIRED (delta)` even on a docs-only diff. Frozen
  fields are never edited to reach a branch.
- **SKIPPED with sweep (S9).** `RE-REVIEW-SKIPPED` is printed when the batch
  is docs-only + has a green sweep declaration (#315's claim kind), even
  without a prior consumer decision. This is the default inversion: skip is
  the machine-decided default for docs-only + sweep green. Prior consumer
  decision is still accepted (backwards-compatible).
- **SKIPPED without sweep (E-D2).** `RE-REVIEW-SKIPPED` requires an explicit
  prior consumer decision when the batch is docs-only but has no sweep
  declaration. A turn with no recorded prior consumer decision prints
  `RE-REVIEW-OPTIONAL` + the re-review default, **never** `RE-REVIEW-SKIPPED`.
