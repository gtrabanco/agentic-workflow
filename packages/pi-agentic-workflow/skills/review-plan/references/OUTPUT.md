## Verdicts, receipt, and routes

### Persist the receipt first, then report

Append the receipt to `docs/features/<NN>-<slug>/progress.md` (fix units:
`docs/fix/<N>/progress.md`), then append every finding row to
`planning-findings.md` (ledger contract: `pre-execution-review/references/LEDGERS.md`).
Any later write to a reviewed plan artifact rotates `artifactRevisionId` and makes
this receipt stale — that is the contract working, not a mistake.

One `PreExecutionReviewReceipt v1`
(`agentic-workflow/pre-execution-review-receipt@1`) per review:

```text
## Pre-execution review receipt v1 — plan
- Review: <receipt-id> · Snapshot: <64-hex|refused> · Verdict: <plan-review-pass|plan-review-fail|needs-design>
- Unit: <unitId> · Stage: plan · Unit kind: <feature|fix>
- Parent SPEC snapshot: <64-hex> · Parent Product receipt: <receipt-id of the current SPEC-REVIEW-PASS>
- Source revision: <40-hex> · Artifact revision: <artifactRevisionId>
- Reviewer: <id> · Session: <id> · Role: <reviewer|critic|synthesizer|arbiter> · Author: <id>
- Author exclusion: <enforced|not-enforceable> · Context clean: <true|false>
- Model diversity: <same-model|cross-model|not-applicable> · Policy: <policyVersion>
- Started/finished: <UTC>/<UTC> · Findings: <n> (material open: <n>)
- Ledgers read: planning-evidence <n> rows · obligations <n> rows (verified-capable: <n>)
- Prior plan receipt (re-review only): <receipt-id> @ <snapshot digest> or `none — first cycle`
```

The two parent lines are not optional decoration. A feature Plan receipt that cannot
name the exact Product snapshot it descends from binds no lineage, so it cannot be
quoted by `execute-phase`: report `PLAN-REVIEW-FAIL` with `class: plan` and the
`L1` check id instead of emitting a parentless PASS. A fix unit writes
`- Parent SPEC snapshot: null` — the contract forbids a parent on a fix plan
snapshot (D30) — and adds
`- Parent note: fix unit — no Product half exists (D6)`; it never borrows another
unit's Product receipt and never fabricates a Product half to satisfy the field.

Fields the runtime can enforce but a manual review must still state:
`contextClean`, `authorExclusion`, `modelDiversity`. If cleanliness is false, or
the reviewer identity equals the author's under `enforced` exclusion, a PASS is
not emit-able — return `PLAN-REVIEW-FAIL` and name the reason.

A `Snapshot:` line carries the digest the builder printed, or the one form a refused
build may take — `refused`, with the builder's own code beside it, never a value
computed here instead:

```text
- Snapshot: refused · Build: refused (<the reason code the builder printed>)
```

Write that pair in place of the `Snapshot:` line, end the turn with this stage's FAIL
verdict, and file one finding row per refused artifact carrying its code verbatim: the
checks bind to a snapshot, so with no snapshot none of them ran. `SNAPSHOT.md` owns why
a refusal prints no digest and what a consumer then reads this receipt as.

### Verdict blocks — return exactly one

```text
PLAN-REVIEW-PASS — <NN-slug|fix-N>
- Snapshot: <digest> · Artifact revision: <artifactRevisionId> · Checks: L1–L6 + <12|16>/Pn
- Obligations: <n> rows, none blank/deferred/unvalidated · Material findings open: 0
- Read-only: no plan artifact modified
- Authority: execution may bind this receipt for this exact snapshot
```

```text
PLAN-REVIEW-FAIL — <NN-slug|fix-N> BLOCKED
- Snapshot: <digest> · Artifact revision: <artifactRevisionId>
- Failed checks: <Lnn, Pnn, Fnn, …>
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
- Repair owner: `plan-feature <slug>` / `plan-fix <N>` — one batch over this whole set
- Parent state: <current | stale-parent → review-spec first | missing → review-spec first>
```

```text
NEEDS-DESIGN — <NN-slug|fix-N>
- Snapshot: <digest> · Blocking rows: <Lnn / Pnn / obligation-id>
- Missing choice (product authority only): <one bounded question>
- Recommended default: <the smallest coherent answer>
- Downstream: this Plan receipt and every execution decision bound to the parent
  Product half are invalid until the answer lands and the Product half is re-reviewed
```

`NEEDS-DESIGN` when the answer requires inventing product intent, scope, role,
authority, or user outcome; `PLAN-REVIEW-FAIL` when the plan is decidable but
incomplete, contradictory, unowned, or unsupported. Never blend them; never emit
a fourth verdict, a generic "approved", or a `SPEC-REVIEW-*` verdict from this
stage.

### Routes

| Verdict / class | Who acts | What happens next |
|---|---|---|
| `PLAN-REVIEW-PASS` | nobody | `/execute-phase <NN>` binds this receipt + exact snapshot digest |
| `PLAN-REVIEW-FAIL`, `class: plan` | `plan-feature` / `plan-fix` (the author) | one root-caused repair batch → new `artifactRevisionId` → re-review of the new snapshot |
| `PLAN-REVIEW-FAIL`, `class: product` | `design-feature` | repair the Product half → `review-spec` → the Plan receipt is re-derived (`stale-parent`) |
| `PLAN-REVIEW-FAIL`, `class: source\|environment\|runtime` | its owner, later | record the row, keep it `open`, route it. Do not edit the plan to hide it and do not start `execute-phase` on a plan carrying an open material row |
| `NEEDS-DESIGN` | the human, through `design-feature` | dated amendment → new Product revision → `review-spec` → `plan-feature` replan → `/review-plan` again |

Repeating this review follows the no-progress and convergence rules in
`pre-execution-review/references/POLICY.md` §4 — a repeat needs
a changed snapshot or a named falsifiable question plus a new evidence route, and
entering a second repair/re-review cycle prints the `CONVERGENCE-ANOMALY` block
before any further edit. A second cycle never grants PASS and never gets folded
into `review-change → fold-findings`, which repairs source, not plan authority.

### Skill-specific turn-contract boxes

```text
✓ Snapshot digest computed from one revision and pasted; no mixed-revision bytes
✓ Parent lineage named: feature → exact Product snapshot + Product receipt; fix → `null` + parent note (never a borrowed or fabricated Product)
✓ L1–L6 resolved, and every applicable P/F check resolved to pass / finding / n/a
✓ Obligation ledger swept row by row: none blank, deferred, duplicated, unvalidated
✓ One verdict block returned verbatim from the closed set
✓ Receipt appended to progress.md and findings appended to planning-findings.md
✓ `git status --porcelain` shows no change to any reviewed plan artifact
✓ Closing `→ Next:` printed as the absolute last output
```

### Closing recommendation

On PASS:

```
→ Next: /execute-phase <NN> — plan reviewed; execution binds this receipt
  · plan changed underneath → re-run /review-plan <NN> first
  · Product half moved after this receipt → the parent went stale: /review-spec <NN>
```

On FAIL or NEEDS-DESIGN, name every finding id once, in order, joined with ` + `:

```
→ Next: /plan-feature <NN-slug> "<instruction>" (or /plan-fix <N> "<instruction>") —
    one repair batch for F1 + P9 + L4, then /review-plan <NN-slug> re-reviews the new
    artifact revision
  · class: product → /design-feature <NN-slug> then /review-spec <NN-slug>; the plan
    re-derives afterwards
  · a missing product choice → answer it yourself in the instruction; nothing here chooses
  · a second cycle about to start → print CONVERGENCE-ANOMALY first, then route to the owner
```
