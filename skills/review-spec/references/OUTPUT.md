## Verdicts, receipt, and routes

### Persist the receipt first, then report

Append the receipt to the unit's `docs/features/<NN>-<slug>/progress.md` **and
each finding row to the unit's `planning-findings.md`** with
`stage: spec` (ledger contract: `pre-execution-review/references/LEDGERS.md`);
create the file from that contract when the unit has none. A findings ledger the
reviewer cannot write is not a ledger. Any later write to a reviewed artifact
rotates `artifactRevisionId` and makes this receipt stale — that is the contract
working, not a mistake.

One `PreExecutionReviewReceipt v1`
(`agentic-workflow/pre-execution-review-receipt@1`) per review, in a fenced block:

```text
## Pre-execution review receipt v1 — spec
- Review: <receipt-id> · Snapshot: <64-hex|refused> · Verdict: <spec-review-pass|spec-review-fail|needs-design>
- Unit: <unitId> · Stage: spec · Unit kind: <feature|fix> · Parent: null
- Source revision: <40-hex> · Artifact revision: <artifactRevisionId>
- Reviewer: <id> · Session: <id> · Role: reviewer · Author: <id>
- Author exclusion: <enforced|not-enforceable> · Context clean: <true|false>
- Model diversity: <same-model|cross-model|not-applicable> · Policy: <policyVersion>
- Started/finished: <UTC>/<UTC> · Findings: <n> (material open: <n>)
```

Fields the runtime can enforce but a manual review must still state:
`contextClean`, `authorExclusion`, `modelDiversity`. If context cleanliness is
false or the reviewer identity equals the author's under an enforced exclusion,
a PASS is not emit-able — return `SPEC-REVIEW-FAIL` and name the reason.

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

**Self-check (`verify --stage spec …`, POLICY §8).** In the same act as appending the
receipt, run the recipe owner's re-verify for this stage and paste the sensor's JSON
answer beside the verdict block before reporting:

```bash
node scripts/pre-execution-snapshot.mjs verify --stage spec --unit <NN-slug> --dir docs/features/<NN>-<slug> --unit-kind <feature|fix>
```

A digest-bound receipt requires `structural.fresh: true` (and, for a PASS verdict,
`current: true`); `exit 3` (`missing-receipt-snapshot`) or a digest-bound
`structural.fresh: false` means the mark did not land — fix the write and re-run, the
verdict is not emit-able in this turn. A `Snapshot: refused` receipt's
`missing-receipt-snapshot` answer is its sanctioned form. A verdict block printed
without the pasted self-check output is a contract defect — chat-only is
`missing-receipt-snapshot` to every consumer.

### Verdict blocks — return exactly one

```text
SPEC-REVIEW-PASS — <NN-slug>
- Snapshot: <digest> · Artifact revision: <artifactRevisionId> · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

```text
SPEC-REVIEW-FAIL — <NN-slug> BLOCKED
- Snapshot: <digest> · Artifact revision: <artifactRevisionId>
- Failed checks: <Cnn, …>
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
- Repair owner: `design-feature <NN-slug>` — one batch over this whole set
```

```text
NEEDS-DESIGN — <NN-slug>
- Snapshot: <digest> · Blocking rows: <Cnn / decision id>
- Missing product choice (product authority only): <one bounded question>
- Recommended default: <the smallest coherent answer>
- Downstream: any Plan evidence bound to this unit is now invalid and must be
  re-reviewed after the answer lands
```

`NEEDS-DESIGN` when the answer requires inventing product intent, scope, role,
authority, or user outcome; `SPEC-REVIEW-FAIL` when the half is decidable but
incomplete, contradictory, or unsupported. Never blend them, and never emit a
fourth verdict.

### Routes

**Resolution map — the finding's `class` cell names its resolver, and only that
resolver:** class `product` → `design-feature` (then `/review-spec` re-judges the
new revision) · class `plan` → `plan-feature` / `plan-fix` re-cuts the plan (then
`/review-plan` re-judges) · class `source` | `environment` | `runtime` → the
executor's fold path (`/fold-findings`, then re-run `/review-change`).
**`fold-findings` never repairs a planning artifact**, and a planning finding is
never resolved by patching the artifact during review — folding repairs source,
not authority.

| Verdict | Who repairs | What happens next |
|---|---|---|
| `SPEC-REVIEW-PASS` | nobody | `/plan-feature <NN-slug>` binds this receipt + exact snapshot digest |
| `SPEC-REVIEW-FAIL` | `design-feature` (the author) | one root-caused repair batch → new revision → re-review of the new snapshot |
| `NEEDS-DESIGN` | the human, through `design-feature` | dated `## Amendments`/`Product decisions` entry → new revision → re-review |

A finding whose `class` is `plan`, `source`, `environment`, or `runtime` does not
become work here: record it, keep it open, and route it to its owner (`review-plan`
for plan defects, the executor for source defects). This skill repairs nothing and
schedules nothing.

Repeating this review follows the no-progress and convergence rules in
`pre-execution-review/references/POLICY.md` §4: a repeat needs a
changed snapshot or a named falsifiable question plus a new evidence route, and
entering a second repair/re-review cycle prints `CONVERGENCE-ANOMALY` before any
further edit. A `design-feature` repair turn re-reads the union of open findings
from `planning-findings.md`, not just the newest receipt, so nothing recorded here
is ever lost between cycles.

### Skill-specific turn-contract boxes

```text
✓ Snapshot digest computed from one revision and pasted; no mixed-revision bytes
✓ All 14 Product checks resolved to pass / finding / n/a with a reason
✓ One verdict block returned verbatim from the closed set
✓ RUN `verify --stage spec` for this stage in-turn, JSON pasted beside the block;
  `exit 0` (+ `current: true` on PASS) — `exit 3`/`structural.fresh: false` means
  the mark did not land, fix and re-run, verdict not emit-able
✓ `git status --porcelain` shows no change to any reviewed artifact
✓ Closing `→ Next:` printed as the absolute last output
```

### Closing recommendation

On PASS:

```
→ Next: /plan-feature <NN-slug> — Product half reviewed; the plan binds this receipt
  · design changed underneath → re-run /review-spec <NN-slug> first
  · recurring closure gaps across units → /product-audit (a systemic pattern, not one SPEC)
```

On FAIL or NEEDS-DESIGN, name every finding id once, in order, joined with ` + `:

```
→ Next: /design-feature <NN-slug> "<instruction>" — one repair batch for F1 + F2 + F4,
    then /review-spec <NN-slug> re-reviews the new artifact revision
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC
```
