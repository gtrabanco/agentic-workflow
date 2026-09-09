# Acceptance manifest v1 — 38-workflow-status-sensor-script

Status: frozen

Frozen 2026-09-09 by `plan-feature-scaffold` from the SPEC's acceptance
criteria A:1…A:23 + read-verified. One stable ID per SPEC criterion;
validators copied from the criteria. Modifying this manifest during execution
requires a user-approved SPEC amendment.

| ID | Required outcome | Validator |
|---|---|---|
| AC-01 | The sensor script file exists at the expected path | `test -f scripts/workflow-status.mjs` → exit 0 |
| AC-02 | Script output is valid Envelope v2 — a fixture-repo test runs the script and validates the output against the schema package's envelope schema | fixture-repo property test: build git repo, run `node scripts/workflow-status.mjs`, parse stdout as JSON, validate with `validateEnvelope` → result `valid` |
| AC-03 | Script is read-only: no mutation calls (branch/push/label-mutation/write) exist in the source | `grep -nE '(createBranch|git push|gh pr (edit|merge|close|create)|gh issue (edit|close|label|create)|writeFile|fs\.write|unlink)' scripts/workflow-status.mjs` → returns nothing |
| AC-04 | Offline fixture: network severed → forge sections degrade to declared codes, exit 0, no hang | fixture-repo test with `gh` shim failing fast → `unavailable-forge-no-network` codes in `detail`, exit 0, no hang |
| AC-05 | Idempotence: two consecutive runs on the same fixture tree → byte-identical output | `diff <(node scripts/workflow-status.mjs) <(node scripts/workflow-status.mjs)` → empty output |
| AC-06 | Ambiguous roadmap row → mapped state + named degradation in output | fixture-repo test with a non-standard status row → `detail` contains the mapped state code and the raw string note in `workflow_observations` |
| AC-07 | Urgency labels read from the labels object only — script never fetches/bodies comments and always reads labels | `grep -nE '\b(body|comment)' scripts/workflow-status.mjs` → nothing AND `grep -cE 'labels' scripts/workflow-status.mjs` ≥ 1 |
| AC-08 | Script consumes schema vocabulary through the repo's established loader | `grep -nE "from ['\"]\\./schema-runtime\\.mjs['\"]" scripts/workflow-status.mjs` → match AND `grep -nE "^import .*'@gtrabanco/agentic-workflow-schema'" scripts/workflow-status.mjs` → nothing |
| AC-09 | `skills/workflow-status/SKILL.md` slimmed: SENSOR_CORE numbered-command prose replaced by script call reference | `git diff --cached -- skills/workflow-status/SKILL.md | grep -c 'workflow-status.mjs'` ≥ 1 AND the original numbered-command steps count is reduced |
| AC-10 | `--help` exits 0 and prints usage; `--version` exits 0 and prints schema package version | `node scripts/workflow-status.mjs --help` → exit 0; `node scripts/workflow-status.mjs --version` → exit 0; version string present in output |
| AC-11 | No external dependencies beyond the schema package — dynamic import via loader succeeds with built dist, fails with named precondition when dist is missing | `node -e "import('./scripts/workflow-status.mjs')"` → exit 0 (with built dist); same import with `dist/` gitignored → "schema runtime is not built" error message |
| AC-12 | `decideWorkflowAction()` is NOT referenced in the script | `grep -c 'decideWorkflowAction' scripts/workflow-status.mjs` → 0 |
| AC-13 | No change to the envelope vocabulary — the schema package is byte-untouched | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` → empty |
| AC-14 | Discipline-test pins and `check-skill-context` budgets re-based for the slimmed sensor route | `node scripts/check-skill-context.mjs` → exit 0 with the updated `workflow-status` budget entry |
| AC-15 | Envelope v2 output includes `detail` section listing each degraded dimension (when offline) | offline fixture output contains `detail` key with degradation entries (`forge`, `git` sources listed) |
| AC-16 | `docs/workflow/ORCHESTRATION.md` driver wiring points consumers at the script | `grep -c 'workflow-status.mjs' docs/workflow/ORCHESTRATION.md` → ≥ 1; bilingual `.es.md` sibling has the same wiring |
| AC-17 | `--json-only` is an accepted no-op — output is identical with and without the flag | `diff <(node scripts/workflow-status.mjs) <(node scripts/workflow-status.mjs --json-only)` → empty |
| AC-18 | `--last-envelope <json|path>` guard: stale hint whose `next.recommended` targeted a unit still at pre-advance status → `detail.workflow_observations` contains the no-progress note | fixture-repo test with stale hint → `workflow_observations` contains the no-progress divergence note; recomputed `state`/`next` unchanged |
| AC-19 | Unreadable/malformed hint degrades without failing — exit 0 with `unavailable-hint-<cause>` note | fixture-repo test with missing path → `unavailable-hint-missing-path` note, exit 0; invalid JSON hint → `unavailable-hint-invalid-json` note, exit 0 |
| AC-20 | Invalid invocation is the only fatal exit — unknown flag → non-zero exit with usage diagnostic on stderr | `node scripts/workflow-status.mjs --not-a-real-flag` → non-zero exit code; stderr contains usage diagnostic |
| AC-21 | Slow-but-alive forge cannot hang the script — bounded wall-clock timeout degrades to `unavailable-forge-timeout` | fixture-repo test with `gh` shim that accepts connections but never terminates → script exits 0 within the timeout bound, `unavailable-forge-timeout` in `detail` |
| AC-22 | No interactive prompts — the script is headless by construction | `grep -nE '(readline|createInterface|process\.stdin\.(read|setRawMode)|@clack|inquirer|prompts?\(|confirm\()' scripts/workflow-status.mjs` → nothing |
| AC-23 | Stdout for data, stderr for diagnostics — stdout alone parses as one valid JSON document | `node scripts/workflow-status.mjs 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{JSON.parse(s)})'` → exit 0 (stdout alone is valid JSON) |
| AC-RV | Feature 15's injection-safety invariant (urgency from labels only) preserved in the new script | read-verified at PR time: code review against feature 15 (PR #47) merge commit; urgency labels-only path preserved verbatim |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node scripts/check-skill-context.mjs`
- `node --test scripts/workflow-status-sensor.test.mjs`
- `node --test scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs`
- `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`
- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
- `grep -c 'workflow-status.mjs' docs/workflow/ORCHESTRATION.md`