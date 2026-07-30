# 18 — normalized-repository-state · PLAN

## P1 — NRS artifact and discovery contract

Create the canonical ledger and discovery-only writer. It records evidence-backed
facts, keeps categories disjoint, freezes the snapshot, and is mirrored in the
template.

## P2 — Contradiction resolution

Create the resolver. It alone accepts or rejects new evidence, updates a fact or
decision, and publishes the next frozen snapshot.

## P3 — Planning and execution consumption

Update bootstrap, design, planning, and execution to consume NRS and propose
contradictions rather than overwrite facts.

## P4 — Review, audit, status, and orchestration consumption

Give review, audit, status, and orchestration the same read-only rule without
changing envelope semantics.

## P5 — Hardening & PR

Exercise failure modes, run gates, synchronize bilingual docs, and open/link PR.
