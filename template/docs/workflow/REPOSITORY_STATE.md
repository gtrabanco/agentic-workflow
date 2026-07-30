# Normalized Repository State

> Evidence-backed snapshot of the repository. The repository remains the source
> of truth; this ledger is a frozen, reviewable representation of observed truth.

## Snapshot

| Field | Value |
|---|---|
| Snapshot ID | `<YYYY-MM-DD>-<short-id>` |
| Source revision | `<git sha or unavailable>` |
| Status | `draft | frozen | contradicted | resolved` |
| Created by | `discover-repository-state | resolve-repository-state` |

## Repository Facts

| ID | Statement | Evidence | Observed at | Status |
|---|---|---|---|---|

Facts are direct observations. They never contain interpretation.

## Accepted decisions

| ID | Decision | Rationale | Evidence | Accepted at |
|---|---|---|---|---|

## Planned work

| ID | Work | Status | Evidence |
|---|---|---|---|

Planned work is not implementation evidence.

## Documentation

| ID | Statement | Document evidence | Implementation evidence |
|---|---|---|---|

Documentation is not implementation evidence unless a Repository Fact cites
separate repository evidence.

## Open Questions

| ID | Question | Evidence | Owner |
|---|---|---|---|

## Inference

| ID | Reasoning | Based on |
|---|---|---|

Inference must never be promoted to a Repository Fact automatically.

## Contradictions

| ID | Frozen fact | New evidence | Reported by | Resolution |
|---|---|---|---|---|

Only `resolve-repository-state` resolves a contradiction and publishes the next
frozen snapshot.
