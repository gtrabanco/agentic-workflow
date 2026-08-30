# testing — 29-bounded-implementation-discovery

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Discovery contract | seven questions, fixed map, planning-evidence confirmation, four verdicts, inline/fresh routes, probe, no count proxy | `node --test scripts/implementation-discovery.test.mjs` |
| First-write gate | read-only ordering, source identity, setup continuity, drift, consumption, recovery | same root suite, named ordering/freshness matrix |
| Backward routes | REPLAN/NEEDS-DESIGN/BLOCKED, source-local fold, no issue export, authority preservation | implementation-discovery plus bounded-loop/audit suites |
| Feature-28 regression | current SPEC/Plan review receipt semantics and package contracts remain green | `cd packages/agentic-workflow-schema && npm test`; feature-28 root fixtures |
| Pi distribution | canonical root skill bundle parity and Pi package behavior | `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` |
| Context/installability | intended skills discover and every entrypoint remains within budget | `node scripts/check-skill-context.mjs`; `npx skills add . --list` |
| Manual weak-executor route | localized/fresh/upstream/blocker flows run without invented edits/issues | dated golden-fixture PASS |
| Candidate quality | exact candidate independently reviews with no fix-now row | current `review-change` PASS receipt |

## Mandatory scenario inventory

- Localized single-entry behavior reaches inline READY with focused evidence.
- Many-file same-layer behavior uses as many relevant reads as needed and
  closes by questions rather than threshold.
- Cross-layer/public/persistence/security/recovery/compatibility work chooses a
  fresh mapper.
- Existing helper/pattern and affected caller/adapter/failure path are found and
  cited before expected writes.
- Plan assumption contradicted by source returns REPLAN; Product/authority gap
  returns NEEDS-DESIGN; required evidence outage returns exact BLOCKED.
- Focused probe passes, fails, and is unavailable; high-risk unavailable never
  yields READY.
- Dirty tracked and untracked source, cited-content drift, wrong parent,
  unexpected setup path, consumed map, crash before/after first write, and
  causal revert all follow the frozen semantics.
- Repeated read with no new question/evidence stops; changed revision or named
  insufficiency permits a targeted reread.
- Compatibility invariant reveals an affected current-unit use case which is
  added to obligation mapping rather than exported to an issue.
- Missing or contradicted Plan-level topology, architecture, obligation, or
  validator evidence returns REPLAN; the mapper never invents it to reach READY.

## Canary fields

For one comparable manual feature, one fix, and one cross-boundary unit, record:

- elapsed time/model calls from execution start to first correct edit;
- number of REPLAN/NEEDS-DESIGN/BLOCKED outcomes before edit;
- post-review repairs and review/fold cycles;
- files/lines substantially rewritten or reverted;
- total latency and exposed model tokens;
- current-unit obligations moved to follow-up issues.

Use observed values or `not yet measured`. A smaller number is not automatically
caused by this feature; record confounders and avoid a savings claim without a
comparable baseline. Any sample entering a second repair/re-review cycle fails
qualification until its owning root cause is corrected and the sample reruns;
the threshold never authorizes dropping a finding.
