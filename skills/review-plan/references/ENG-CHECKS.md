## Engineering and fix checks

Loaded after `CHECKS.md` has built the snapshot, run the falsification
pass and swept the ledgers. Feature units run P1–P12; fix units run P1–P12 **plus**
F1–F4. Every row gets exactly one result: `pass`, `finding`, or `n/a: <reason>`
where the reason cannot contradict scope.

### 4. Engineering checks (fixed list — one row each, in order)

Feature units run P1–P12; fix units run P1–P12 **plus** F1–F4. Every row gets
`pass`, `finding`, or `n/a: <reason>` where the reason cannot contradict scope.

| # | Check | PASS only if |
|---|---|---|
| P1 | Architecture | affected surfaces are named with `path:line` evidence rows, and the invariant classification is present (`preserves`, or the stop block for `violates`/`introduces`/`changes`) |
| P2 | Dependency closure | the unit's dependency closure is merged or the hand-off names the exact blocking PR; no phase depends on unwritten work outside the unit |
| P3 | Compatibility | the boundary is stated: public contracts, formats, stored data, and callers that must keep working, with the row that proves each was considered |
| P4 | Security | secrets, input validation, authn/authz, PII and dependency exposure the plan creates are addressed or explicitly `n/a` with a non-contradicting reason |
| P5 | Migration | any schema/roadmap/config/doc migration names its forward path, its legacy-adoption rule, and who runs it; docs/EN–ES sync is scheduled, not hoped for |
| P6 | Recovery | interruption per phase has a resume path (`progress.md` receipts, idempotent re-entry); no phase leaves the tree mid-write with no way to tell what landed |
| P7 | Rollback | the rollback path is executable at the granularity the plan ships (revert set, migration reversal), and out-of-band causal limits are stated rather than overclaimed |
| P8 | Operability | after delivery someone can see it works: logs/status/metrics/docs surface the behaviour and the project's sensor reports the new state honestly |
| P9 | Phase atomicity and order | every phase passes the canonical 8-box phase-lint with its recorded fingerprint (`phase-contract` owns the rules — this skill only verifies they were applied), order matches the `Depends on` closure, no phase builds a later phase's deliverable early, last phase is hardening/close-out |
| P10 | Validators | each phase's done-when is a command with an expected outcome; the gate set is the project's real gates; no validator was weakened, skipped, or re-scoped to make a phase reachable |
| P11 | Scenario coverage | the scenario matrix covers every named failure state, edge, empty/oversize, concurrency, and crash/re-entry case in scope, and each maps to a phase and validator |
| P12 | Source evidence | the plan's file/symbol claims match the repository at `sourceRevision` (cited `path:line`), including version/status claims about dependencies |
| F1 | Reproduction | the fix names a command or exact steps that reproduce the defect at a cited revision, with observed output recorded |
| F2 | Root cause | the cause is evidenced in code (`path:line`) and is the cause the fix edits — not a symptom; competing hypotheses are recorded as rows and ruled out with evidence |
| F3 | Regression scope | the affected surface and the tests that would catch a re-break are named, including callers of the changed behaviour |
| F4 | Rollback | the fix states how to un-ship it, including data or doc side effects, without a fake Product-half ceremony |
