---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and scope).
type: feature
scope: small
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
roadmap_summary: claim staleness projection (trigger-gated, parked) — project changedPaths onto sources.md CLAIM/INV rows
---

# 634 — claim-staleness-projection

> One-line: project pre-execution snapshot's `changedPaths` attribution onto the unit folder's claim ledger (`sources.md` CLAIM/INV rows), marking a claim `stale (P<n> · <sha>)` when the bytes it cite move.

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

**S1 — Project changedPaths onto sources.md CLAIM/INV rows.**
> Mark a claim `stale (P<n> · <sha>)` when the bytes it cites move.

**S2 — Consumer contract from observed case.**
> The consumer contract is decided from the observed case that fired the trigger — never pre-designed here.

**S3 — Signal surface for #444's risk scoring (optional).**
> Possible signal surface for #444's risk scoring.

## Impact

What the change touches beyond its own files: the pre-execution snapshot sensor's `changedPaths` attribution, the unit folder's claim ledger (`sources.md`), and any executor that reads CLAIM/INV rows.

## Surfaces

The batch scheduler's lane keys this unit occupies, one per line.

- `packages/agentic-workflow` (snapshot sensor projection)
- `skills` (unit-lane / execute-phase references, only if the consumer contract touches them)

## Retirements

None — this unit adds a staleness mark; it does not retire existing surfaces.

## Non-goals

- No behavior change until a trigger fires.
- No pre-designed consumer policy — the policy emerges from the first observed case.
- No risk scoring integration for #444 — that is an optional signal surface.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `<standard>` · **Task Size** — `<verdict.task_size>`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status.

- None deferred at this time.

## Future cost

Standing obligations this unit imposes on future work.

- The `stale (P<n> · <sha>)` mark must be consumed by at least one executor that reads sources.md CLAIM/INV rows, or the mark is a finding, not a signal.
- The consumer policy (block/warn/re-read) must be declared in the first observed case that fired the trigger.

## Applicable tests

The tests this unit will run (triage-decided).

- `bun test packages/agentic-workflow/test/*` (snapshot sensor)
- `bun scripts/run-root-suite.mjs` (node-compatible subset)
- Trigger verification: verify all three trigger conditions are detectable
- Staleness mark: verify `stale (P<n> · <sha>)` appears correctly

## Known pre-existing issues

- **#444** — decision-substrate (trigger condition 3: activates and wants unit-level signals). Affects: this unit is trigger-gated by #444 activation.
- **#179** — fix/179-declared-ledger-delta-receipts (related: RS13 / RS3(b) ledger staleness at another level). Does not affect: claim-level staleness is a different dimension.
- **#269** — executor read sets (does not affect: executor reads per-phase Relevant files, not CLAIM rows).

## Tasks

P1…Pn with stable IDs, one line each, smallest first.

- P1 — Verify all three trigger conditions are detectable (validator: each trigger has a boolean check function)
  (Implements: S2)
  - Relevant files: scripts/trigger-checks (new)

- P2 — Implement `stale (P<n> · <sha>)` mark projection onto sources.md CLAIM/INV rows (validator: `rg 'stale' docs/fix/179/` shows the mark shape is new, `rg 'stale' docs/features/634/` shows the projection works)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/snapshot, docs/features/634-claim-staleness-projection/sources.md

- P3 — Record trigger detection in sources.md CLAIM/INV rows (validator: the projection writes `stale (P<n> · <sha>)` to the correct row)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/snapshot

- P4 — Verification: run root suite (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1)

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
  claim staleness projection (trigger-gated, parked)
  ```

## Next

The single next action: run triage and begin P1 (verify trigger conditions).

## References

- Issue: [#634](https://github.com/gtrabanco/agentic-workflow/issues/634)
- Roadmap: row 634
- #444 — decision-substrate (trigger condition 3)
- #179 — fix/179-declared-ledger-delta-receipts (related ledger staleness at another level)
- #269 — executor read sets (executor reads per-phase Relevant files, not CLAIM rows)