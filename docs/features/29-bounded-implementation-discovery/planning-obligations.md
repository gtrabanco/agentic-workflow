# Planning obligations — 29-bounded-implementation-discovery

One row per acceptance criterion (AC1–AC13) from the frozen ACCEPTANCE.md.
Created 2026-09-05 by the plan author under the legacy-adoption rule
(feature-28 resolved finding RS10): none of the acceptance rows was mapped to a
phase, task, implementation-owner, validator, and required evidence, so this
ledger is constructed from the acceptance rows as they stand, without editing
the frozen ACCEPTANCE.md, SPEC product half, decisions, or roadmap.

This ledger answers N29-001 and N29-005 and satisfies the size-`M` obligation
ledger rule (`LEDGERS.md` §Obligations): every AC maps to a phase, task, owner,
validator, and required evidence with one closed status.

Nine-column rule held: no cell quotes a closed `|`-separated vocabulary —
vocabularies are joined with commas. Statuses stay `planned` until each row's
evidence lands during execution.

obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
O1 | AC1 | strict contract: seven fixed questions, exact fixed map fields, complete ordered phase-obligation coverage, four closed decisions | P1 | Define the bounded discovery contract | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (map and verdict fixtures) | planned
O2 | AC2 | inline/fresh routing keyed on evidence completeness, uncertainty, topology, and risk, never file counts; one-file, many-file, inline, fresh all converge by question/evidence | P1 | Define the bounded discovery contract | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (one-file, many-file, inline, fresh fixtures) | planned
O3 | AC3 | discovery is read-only and precedes every branch/planning/implementation write; READY authorizes only deterministic allowlisted setup and the first write after exact continuity revalidation | P2 | Gate the first phase write | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (ordering and preparation-continuity fixtures) | planned
O4 | AC4 | READY rejected for uncovered obligation, contradiction, or unknown; engineering drift returns REPLAN, product/authority gap returns NEEDS-DESIGN, unavailable required evidence returns BLOCKED with one exact prerequisite | P1 | Define the bounded discovery contract | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (route matrix) | planned
O5 | AC5 | cheapest relevant read-only falsification probe recorded with observed result; unavailable or failed high-risk probe never rewritten as success | P1 | Define the bounded discovery contract | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (probe matrix) | planned
O6 | AC6 | semantic navigation and direct-repository fallback produce equivalent required map evidence; writer handoff excludes raw exploration history and keeps every relevant claim/unknown | P3 | Integrate evidence-aware execution routing | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (adapter and handoff fixtures) | planned
O7 | AC7 | SPEC/Plan/receipt/phase/source/cited-content drift, unexpected setup path, consumed map, interrupted partial execution, and new causal revert all invalidate old READY; repeated unchanged reads stop as no-progress | P2 | Gate the first phase write | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (freshness, consumption, recovery, no-progress matrix) | planned
O8 | AC8 | mandatory scenario matrix: localized inline, broad same-layer, cross-layer, reusable-helper and affected-consumer, contradicted Plan, stale, unavailable, repeated-read, compatibility-invariant, and context/result pressure (map:limit-hit) | P1 | Define the bounded discovery contract | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (named scenario inventory complete) | planned
O9 | AC9 | no issue, committed map, planning unit, schema, or source/test edit during mapping; current-unit obligations cannot export automatically | P3 | Integrate evidence-aware execution routing | execute-phase | `node --test scripts/implementation-discovery.test.mjs` | exit 0 (side-effect spy and repository-diff fixtures) | planned
O10 | AC10 | canary records time/model calls to first correct edit, pre-edit replans, post-review repairs, diff/rework, latency, tokens, and issue spill with observed or not-yet-measured values and no unsupported savings claim | P4 | Qualify implementation discovery | execute-phase | read-verified completed canary table | dated PASS with observed or not-yet-measured values | planned
O11 | AC11 | root regressions, feature-28 package/route gates, Pi bundle/parity/package tests, context budgets, installability, migration/docs checks, executor-path golden fixture | P4 | Qualify implementation discovery | execute-phase | npm test, npm run bundle:skills, node scripts/check-skill-context.mjs, npx skills add . --list | exit 0, dated golden PASS | planned
O12 | AC12 | exact candidate independently reviews with no unresolved fix-now finding; preserves feature 28, TDD, staged verification, candidate review, and audit authority | P4 | Qualify implementation discovery | execute-phase | review-change current exact-head PASS receipt | PASS with no unresolved fix-now | planned
O13 | AC13 | READY rejects missing/contradicted Plan-level topology, architecture, obligation, or validator evidence; end-to-end feature/fix/cross-boundary canary records source-local repair cycles and emits CONVERGENCE-ANOMALY on second-cycle entry without suppressing findings | P1 | Define the bounded discovery contract | execute-phase | `node --test scripts/implementation-discovery.test.mjs` plus read-verified completed qualification corpus | exit 0 and dated PASS, no second-cycle sample | planned

## Closure

- Every acceptance criterion AC1–AC13 has one mapped obligation row with a phase,
  task, implementation-owner, validator, required evidence, and one closed status.
- No acceptance row or Product-half artifact was edited to produce this ledger.
- No omission, duplication, or renumbering: ids run O1–O13 one-to-one with AC1–AC13.
