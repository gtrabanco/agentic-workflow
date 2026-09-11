# testing — 38-workflow-status-sensor-script

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Script skeleton + envelope emission | schema validity, field presence, read-only greps, idempotence, flag contract, envelope-mismatch | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (P1 pins green + existing suites green) |
| Failure contract | offline degradation, forge timeout, missing-git, hint-guard, hint-fail-open, stream-separation, help/version | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (P2 pins green + P1 pins unchanged) |
| Skill slimming | budget re-base, discipline-test pin re-targeting, version bump, normative drift | `node scripts/check-skill-context.mjs` → exit 0; `node --test scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs` → exit 0 (P3 pins green) |
| Qualification | all frozen validators green, schema package untouched, Pi bundle parity, bilingual sync | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` → empty; `node --test scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs scripts/audit-pr-receipt.test.mjs scripts/review-loop-discipline.test.mjs` → exit 0; `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` → exit 0 (P4) |
| Injection safety | Feature 15's labels-only invariant preserved in the new script | read-verified at PR time: code review against feature 15 (PR #47) merge commit; the labels-only path preserved verbatim |

## Mandatory scenario inventory

Each dev scenario from the SPEC resolves to the named phase's pins:

- **sensor:empty-state** — fixture repo with no roadmap rows, no PRs, no in-flight units; envelope prints the empty shapes (`design_candidates: []`, `fix_now: []`), exit 0 (P2, A-02 fixture).
- **sensor:invalid-input** — `--not-a-real-flag` → non-zero + stderr usage (P2, A-20); missing path / invalid JSON hint → `unavailable-hint-<cause>` note, exit 0 (P2, A-19).
- **sensor:envelope-mismatch** — stub schema build whose `validateEnvelope` always fails → stderr diagnostic, envelope still printed, exit 0 (P1, E-38-1; F34 repair re-points the stale P2 label — ladder row 1 and the TASKS P1 pin carry this scenario).
- **sensor:dependency-outage** — `gh` shim failing fast → fail-fast degradation codes, exit 0 (P2, A-4); non-terminating `gh` shim → `unavailable-forge-timeout` within the bound (P2, A-21).
- **sensor:concurrent-action** — run twice in parallel on the same tree: both exit 0, outputs byte-identical, no locks or shared state (P2, A-5 concurrent run).
- **sensor:limit-threshold** — fixture with > 5 open issues → `untriaged_issues.oldest_open` capped at 5; merged-PR list capped at 20 (P2, ENVELOPE_FIELDS/SENSOR_CORE caps).
- **sensor:permission-denied** — n/a: the sensor is a read-only CLI with no auth, role, or permission surface (P1, Capability closure: Authentication/ACL rows n/a).
- **sensor:data-loss** — n/a: the script writes no file and deletes nothing (P1, stdout-only output, non-goal §5).