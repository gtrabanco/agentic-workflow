# testing — 38-workflow-status-sensor-script

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Script skeleton + envelope emission | schema validity, field presence, read-only greps, idempotence, flag contract, envelope-mismatch | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (P1 pins green + existing suites green) — P1 green 2026-09-11 (19/19); `node --test scripts/*.test.mjs` 226/227, the one failure pre-existing (`check-skill-context` route ceilings, see known-issues B-04) |
| Failure contract | offline degradation, forge timeout, forge auth, forge missing-cli, missing-git, hint-guard, hint-fail-open, stream-separation, help/version | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (P2 pins green + P1 pins unchanged) — P2 green 2026-09-11 (33/33); root suites 240/241, the one failure pre-existing (known-issues B-04) |
| Skill slimming | budget re-base, discipline-test pin re-targeting, version bump, normative drift | `node scripts/check-skill-context.mjs` → exit 0; `node --test scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs` → exit 0 (P3 pins green) — P3 green 2026-09-11: `check-skill-context` exit 0 (39 skills / 22 routes) after the declared re-basis; discipline suites 87/87; `workflow-status` 3.2.1 → 3.3.0 |
| Qualification | all frozen validators green, schema package untouched, Pi bundle parity, bilingual sync | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` → empty; `node --test scripts/ledger-provenance.test.mjs scripts/ledger-ownership.test.mjs scripts/audit-pr-receipt.test.mjs scripts/review-loop-discipline.test.mjs` → exit 0; `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` → exit 0 (P4) — P4 green 2026-09-11: schema diff empty; root suite 241/241; schema package 684/684; pi package 173/173 |
| Injection safety | Feature 15's labels-only invariant preserved in the new script | read-verified at PR time: code review against feature 15 (PR #47) merge commit; the labels-only path preserved verbatim |
| Read-path fold batch | per-finding pins (F20, F27–F35), one `git status` scan, one batched upstream read, zero review-mark spawns for closed units, capped verifier spawns | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 (P5 pins green + P1–P4 pins unchanged) — P5 green 2026-09-12 (51/51); `node --test scripts/*.test.mjs` → 259/259 |

## Mandatory scenario inventory

Each dev scenario from the SPEC resolves to the named phase's pins:

- **sensor:empty-state** — fixture repo with no roadmap rows, no PRs, no in-flight units; envelope prints the empty shapes (`design_candidates: []`, `fix_now: []`), exit 0 (P2, A-02 fixture).
- **sensor:invalid-input** — `--not-a-real-flag` → non-zero + stderr usage (P2, A-20); missing path / invalid JSON hint → `unavailable-hint-<cause>` note, exit 0 (P2, A-19).
- **sensor:envelope-mismatch** — stub schema build whose `validateEnvelope` always fails → stderr diagnostic, envelope still printed, exit 0 (P1, E-38-1; F34 repair re-points the stale P2 label — ladder row 1 and the TASKS P1 pin carry this scenario).
- **sensor:dependency-outage** — `gh` shim failing fast → fail-fast degradation codes, exit 0 (P2, A-4); non-terminating `gh` shim → `unavailable-forge-timeout` within the bound (P2, A-21); auth-failing `gh` shim → `unavailable-forge-auth`, exit 0; `gh` absent from PATH → `unavailable-forge-missing-cli`, exit 0; missing `git` binary → `unavailable-git-missing`, exit 0 (P2, F37 fold — the declared forge/git failure states are exercised); a zero-PR answer is a success, and malformed forge answers (non-JSON stdout, non-array JSON) degrade as `unavailable-forge-malformed-answer`, exit 0 (P5, F28/F29/F30).
- **sensor:concurrent-action** — two sensor processes genuinely in flight on the same tree: both exit 0, outputs byte-identical, no locks or shared state (P2/P5, A-5 concurrent run; F31 re-cut the pin from two sequential `spawnSync` calls to two overlapping child processes).
- **sensor:limit-threshold** — fixture with > 5 open issues → `untriaged_issues.oldest_open` capped at 5; merged-PR list capped at 20; open-PR/open-issue reads carry `--limit` so the forge's default page cannot truncate the reported counts (P2/P5, ENVELOPE_FIELDS/SENSOR_CORE caps; F35).
- **sensor:permission-denied** — n/a: the sensor is a read-only CLI with no auth, role, or permission surface (P1, Capability closure: Authentication/ACL rows n/a).
- **sensor:data-loss** — n/a: the script writes no file and deletes nothing (P1, stdout-only output, non-goal §5).