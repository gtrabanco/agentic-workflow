# 21 — workflow-contract-consolidation · PLAN

## P1 — Route cost measurement

Make the repository's context checker measure the real composed routes used by
the five hot skills. Add deterministic route declarations, stable CLI output,
regression maxima, and fixtures before rewriting contracts so every later phase
can prove savings rather than infer them from smaller individual files.

## P2 — Planning contract consolidation

Introduce the canonical planning preflight and phase contract. Refactor
`plan-feature` and its internals to reuse one roadmap/issue snapshot and one
post-write verification; make `plan-fix` consume the same safety contracts.
Slim generated feature/fix SPEC templates to instance data plus contract
version/result, preserving every phase-lint failure through the canonical
contract.

## P3 — Execution route consolidation

Split `execute-phase` mode workflows and the forge/descope/opportunistic policy
bundle into independently loaded resources. Add dependency receipts with cheap
fingerprint validation for later phases. Preserve branch, commit, docs, gate,
handoff, PR-link, `--force`, and clean/remote safeguards in compact fixed
contracts.

## P4 — Review-to-audit boundary

Remove ambiguous review merge terminology, give each review axis one owner,
classify synthesized findings once, and enforce complete-feature routing with
no in-scope deferral or automatic issue creation. Add the exact-SHA
`REVIEW-PASS` receipt. Refactor `audit-pr` to consume it and evaluate delivery
only, while preserving closure/descope, CI, traceability, mergeability, comment
idempotency, and external merge ownership.

## P5 — Hardening & PR

Run route budgets, unit/fixture checks, direct-merge negative tests,
documentation coherence, skill discovery, and the weak-model golden fixture.
Synchronize versions, migrations, changelogs, bilingual workflow docs, and
template mirrors; record before/after route costs; then open and link the PR.
