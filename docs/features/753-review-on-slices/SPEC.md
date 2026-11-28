---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and scope).
type: feature
scope: medium
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
roadmap_summary: review-on-slices (review_due) — progressive review during execution, the WHEN axis of the risk-tiered ceremony
---

# 753 — review-on-slices

> One-line: review-on-slices (review_due) — progressive review during execution, the WHEN axis of the risk-tiered ceremony.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Executor gains slice boundaries and review-due evaluation.**
> The pending slice is reviewed only when `review_due` is true or the user explicitly asks; a task boundary neither authorizes review nor advances review (clause 1).

**S2 — Typed machine surface, never prose-only.**
> The `review_due` verdict is computed by the ceremony CLI family (the row-97 crate), the vocabulary (kind + reasons) is schema-published and pinned in `normative-surfaces@1`, and the executor consumes the computed value.

**S3 — Fail direction is explicit.**
> An unavailable or failed assessment never starts or lowers into a review; it emits a named degradation — review-on-slices degrades silently in no direction, it either computes or it says which input is missing.

**S4 — B3-3 sentence ban (under_budget pending).**
> The `under_budget`-pending sentence (B3-3) never enters any committed surface.

**S5 — Shadow verdicts before enforcement.**
> Shadow verdicts before enforcement; the A/B of record measured against the shipped correction-budget baseline (`min(200, changed/2)`).

**S6 — Tier→cadence mapping.**
> The tier→cadence mapping cut in config at plan time — the deterministic triage that keeps the spend proportional: **high → progressive review-due; standard → on-demand; passive → none**.

## Impact

What the change touches beyond its own files: the execute-phase executor, the ceremony CLI family (row 97), the schema vocabulary, the risk-tier classifier, and the normative surfaces inventory.

## Surfaces

The batch scheduler's lane keys this unit occupies, one per line.

- `skills/execute-phase`
- `packages/agentic-workflow-schema`
- `packages/agentic-workflow/src/runner` (ceremony tier CLI)
- `skills/execute-phase/references/risk-tiers.md`

## Retirements

None — this unit adds capability; it does not retire existing surfaces.

## Non-goals

- The `under_budget` pending-by-budget arithmetic (B3-3) except as the known-bug citation.
- The `/flow` post-plan stop rules — that is #708's seam; order relation, not a merger.
- SystemOne/materiality judging of review findings — #444's substrate, parked.
- Any change to the review pack's depth ladder (row 97's surface).

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `<standard>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status.

- #444 (decision-substrate) — review-due activation/acceleration signal (open, 2026-11-28): an advisory SystemOne proposal (slice churn, finding density, CIVER stability) that may only advance review within the tier's deterministic bounds, shadow-only first, `models.classify()` as the pi-host endpoint.
- #708 — post-plan stop rules coordination (open, 2026-11-28): order and shape to be cut by triage.

## Future cost

Standing obligations this unit imposes on future work.

- The `review_due` verdict must remain a typed, schema-published value (never prose-only) — enforced by the normative surfaces drift gate.
- A review-on-slices consumer must never copy B3-3's `under_budget` pending sentence.
- The tier→cadence mapping config must be consumed at plan time, not inferred at execute time.

## Applicable tests

The tests this unit will run (triage-decided).

- `bun test packages/agentic-workflow/test/*` (ceremony tier CLI)
- `bun test packages/agentic-workflow-schema/test/*` (new vocabulary)
- `bun scripts/run-root-suite.mjs` (node-compatible subset)
- Drift gate: `scripts/normative-drift.test.mjs` (review_due in normative-surfaces@1)
- B3-3 ban: grep gate refusing `under_budget` pending sentence in committed surfaces
- A/B measurement reproduction (shadow verdicts)

## Known pre-existing issues

- **#360** — row 97 risk-tiered ceremony (dependency: the depth axis already shipped). Affects: review-on-slices reuses row 97's classifier and vocabulary.
- **#566** — contract correction B3 (dependency: the three clauses are the contract, cited verbatim at design time). Affects: B3-3 ban, B3-1 boundary parity, B3-2 failed assessment.
- **#704** — amendment record (soft: the promise's history). Does not affect: this unit delivers on the promise.
- **#708** — post-plan stop rules (soft: order relation). Does not affect: review-due runs on the deterministic layer.

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Define `REVIEW_DUE` vocabulary in schema package (validator: `rg 'REVIEW_DUE' packages/agentic-workflow-schema/src/` shows the export)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts

- P2 — Update `normative-surfaces@1` with `review_due` grammar row (validator: `rg 'review_due' AGENTS.md` shows the row)
  (Implements: S2)
  - Relevant files: AGENTS.md

- P3 — Add `review_due` evaluation at task boundaries in execute-phase executor (validator: `rg 'review_due' packages/agentic-workflow/src/runner/` shows the evaluation)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/runner

- P4 — Add fail-closed degradation for missing/failed assessment (validator: `rg 'review_due' packages/agentic-workflow/src/runner/` shows named degradation path)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow/src/runner

- P5 — Add B3-3 ban: grep test refusing `under_budget` pending sentence (validator: `rg 'under_budget.*pending' docs/skills/execute-phase/ | grep -v 'B3-3' | grep -v 'under_budget pending sentence'` is empty)
  (Implements: S4)
  - Relevant files: scripts/structural-gates (new)

- P6 — Wire tier→cadence mapping in ceremony CLI row 97 (validator: `runner ceremony tier classify --review-due` shows cadence from tier)
  (Implements: S6)
  - Relevant files: packages/agentic-workflow/src/runner

- P7 — Verification: run root suite + all package tests (validator: `bun scripts/run-root-suite.mjs` exits 0, all package tests green)
  (Implements: S1-S6)

### Planning evidence

One row per Engineering claim (the closed column order and vocabularies are owned by `skills/pre-execution-review/references/LEDGERS.md`).

### Obligations

One row per normative behaviour, compatibility invariant, affected use case, and required failure state.

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage <slug>` here verbatim. This block is the machine's authoritative step list; the lane never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the request, verbatim:
  ```
  review-on-slices (review_due) — progressive review during execution, the WHEN axis of the risk-tiered ceremony
  ```

## Next

The single next action: run triage and begin P1 (define REVIEW_DUE vocabulary).

## References

- Issue: [#753](https://github.com/gtrabanco/agentic-workflow/issues/753)
- Roadmap: row 753
- #566 — contract correction B3 (the contract, cited verbatim at design time)
- #360 — row 97 risk-tiered ceremony (depth axis already shipped)
- #704 — amendment record
- #708 — post-plan stop rules
- #444 — decision-substrate (future review-due activation signal)
- #258 — fix/258 (evidence: twelve correction cycles that motivated this issue)
- #224 — fix/224 (evidence: review-slice A/B measurement unit)