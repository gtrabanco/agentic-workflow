## Verdicts, receipt, and routes

### Persist the receipt first, then report

After the checks, append the receipt to the unit's `docs/features/<NN>-<slug>/
progress.md`. Any later write to a reviewed artifact rotates `artifactRevisionId`
and makes this receipt stale — that is the contract working, not a mistake.

One `PreExecutionReviewReceipt v1`
(`agentic-workflow/pre-execution-review-receipt@1`) per review, in a fenced block:

```text
## Pre-execution review receipt v1 — spec
- Review: <receipt-id> · Snapshot: <64-hex> · Verdict: <spec-review-pass|spec-review-fail|needs-design>
- Unit: <unitId> · Stage: spec · Parent: null
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

| Verdict | Who repairs | What happens next |
|---|---|---|
| `SPEC-REVIEW-PASS` | nobody | `/plan-feature <NN-slug>` binds this receipt + exact snapshot digest |
| `SPEC-REVIEW-FAIL` | `design-feature` (the author) | one root-caused repair batch → new revision → re-review of the new snapshot |
| `NEEDS-DESIGN` | the human, through `design-feature` | dated `## Amendments`/`Product decisions` entry → new revision → re-review |

A finding whose `class` is `plan`, `source`, `environment`, or `runtime` does not
become work here: record it, keep it open, and route it to its owner (`review-plan`
for plan defects, the executor for source defects). This skill repairs nothing and
schedules nothing.

### Skill-specific turn-contract boxes

```text
✓ Snapshot digest computed from one revision and pasted; no mixed-revision bytes
✓ All 14 Product checks resolved to pass / finding / n/a with a reason
✓ One verdict block returned verbatim from the closed set
✓ Receipt appended to the unit's progress.md before the report was printed
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
