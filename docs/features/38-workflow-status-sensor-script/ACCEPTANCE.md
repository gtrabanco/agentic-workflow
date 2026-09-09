# Acceptance manifest v1 — 38-workflow-status-sensor-script

Status: frozen

Frozen 2026-09-09 by `plan-feature-scaffold` from the SPEC's acceptance
criteria A:1–A:23 + the read-verified criterion; extended 2026-09-09 by the
operator-authorized F26 repair (A-24, ENVELOPE_CORE.md slimming) and the F28
repair (A-07 check scoped to forge request fields). One stable ID per SPEC
criterion (`A-01`…`A-24`, `A-RV`); validators copied from the criteria and made
concrete. Modifying this manifest during execution requires a user-approved
SPEC amendment.

| ID | Required outcome | Validator |
|---|---|---|
| A-01 | `scripts/workflow-status.mjs` exists | `test -f scripts/workflow-status.mjs` -> exit 0 |
| A-02 | Script output is valid Envelope v2 JSON built from the schema package's vocabulary (fixture repo, steps 1–9 field presence incl. 6a) | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (schema-validity + field-presence pin sections, git fixture repo) |
| A-03 | Script is read-only: no mutation action (branch creation, push, label mutation, issue/PR writes, file writes); label *reading* stays (A-07's labels-only scan) | `grep -nE '(createBranch\|git push\|gh pr (edit\|merge\|close\|create)\|gh issue (edit\|close\|label\|create)\|writeFile\|fs\.write\|unlink)' scripts/workflow-status.mjs` -> no match |
| A-04 | Offline fixture: no network -> forge sections degrade to declared codes, exit 0, no hang (fail-fast case; the stalling case is A-21) | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (offline pin section: `gh` fails fast -> declared `unavailable-forge-*` codes in `detail`, exit 0, no hang) |
| A-05 | Idempotence: two consecutive runs on the same fixture tree -> byte-identical output verbatim (no volatile fields by construction) | `diff <(node scripts/workflow-status.mjs) <(node scripts/workflow-status.mjs)` -> empty (fixture repo run) |
| A-06 | Ambiguous roadmap row -> mapped five-state value (nearest, `default: idea`) + raw status noted in `detail.workflow_observations` | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (ambiguous-row pin section: fixture with a non-standard status) |
| A-07 | Urgency labels read from the labels object only (bodies/comments never fetched or read); `title` is allowed (SENSOR_CORE step 3 emits `urgent.issues[].title` — output, not a scan) | `grep -nE '\-\-json[^|]*(body\|comment)' scripts/workflow-status.mjs` -> no match (no forge request field list includes `body`/`comment` — F28 repair: scoped to request fields) AND `grep -cE 'labels' scripts/workflow-status.mjs` -> ≥ 1 |
| A-08 | Envelope vocabulary consumed through the repo's established loader (built local package by explicit path; no bare-specifier import) | `grep -nE "from ['\"]\\./schema-runtime\\.mjs['\"]" scripts/workflow-status.mjs` -> match AND `grep -nE "^import .*'@gtrabanco/agentic-workflow-schema'" scripts/workflow-status.mjs` -> no match |
| A-09 | `skills/workflow-status` slimmed: fixed-sequence prose replaced by the script call (SKILL.md + SENSOR_CORE.md); the `sensor-fields@1` grammar block stays (normative-drift surface) | `grep -c 'scripts/workflow-status.mjs' skills/workflow-status/SKILL.md skills/workflow-status/references/SENSOR_CORE.md` -> ≥ 1 each AND `grep -cE '^[0-9]+\. \*\*' skills/workflow-status/references/SENSOR_CORE.md` -> 0 |
| A-10 | `--help` and `--version` supported (`--version` prints the schema package's version) | `node scripts/workflow-status.mjs --help` -> exit 0 + usage; `node scripts/workflow-status.mjs --version` -> exit 0 + version |
| A-11 | No external dependency beyond the schema runtime (loader-path consumption); missing build names its precondition instead of `ERR_MODULE_NOT_FOUND` | (a) with `packages/agentic-workflow-schema/dist/index.js` built: `node -e "import('./scripts/workflow-status.mjs')"` -> exit 0; (b) with `dist/` hidden: same import fails with the loader's named precondition error ("schema runtime is not built") |
| A-12 | `decideWorkflowAction()` is NOT referenced in the script | `grep -c 'decideWorkflowAction' scripts/workflow-status.mjs` -> 0 |
| A-13 | No change to the envelope vocabulary — schema package byte-untouched | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` -> empty; `cd packages/agentic-workflow-schema && npm test` -> exit 0 |
| A-14 | Discipline-test pins re-based and `check-skill-context` budgets updated for the slimmed sensor route | `node scripts/check-skill-context.mjs` -> exit 0 with the updated `workflow-status` entry |
| A-15 | Envelope v2 `detail` lists each degraded dimension when degraded | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (offline pin section asserts the `detail` degradation entries) |
| A-16 | `docs/workflow/ORCHESTRATION.md` driver wiring points consumers at the script | `grep -c 'workflow-status.mjs' docs/workflow/ORCHESTRATION.md` -> ≥ 1 |
| A-17 | `--json-only` is an accepted no-op (argv parity) | `diff <(node scripts/workflow-status.mjs --json-only) <(node scripts/workflow-status.mjs)` -> empty |
| A-18 | `--last-envelope <json\|path>` guard: a stale hint (inline-JSON and file-path variants) whose `next.recommended` targeted a unit still at its pre-advance status produces the `workflow_observations` no-progress note (shape per ENVELOPE_FIELDS.md), the divergence line is present, and the recomputed `state`/`next` are unchanged by the hint | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (stale-hint pin section, both hint variants) |
| A-19 | Unreadable/malformed hint degrades without failing: `unavailable-hint-<cause>` note, exit 0, recomputed envelope unaffected | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (missing-path + invalid-JSON hint pins) |
| A-20 | Invalid invocation is the only fatal exit class and exits non-zero with a usage diagnostic on stderr (repo convention: ledger-provenance exit 2, check-skill-context exit 1) | `node scripts/workflow-status.mjs --not-a-real-flag` -> non-zero exit + usage diagnostic on stderr |
| A-21 | Slow-but-alive forge cannot hang the script: a non-terminating `gh` shim degrades to `unavailable-forge-timeout` with exit 0 within the bounded forge timeout | `node --test scripts/workflow-status-sensor.test.mjs` -> exit 0 (non-terminating-`gh`-shim pin section) |
| A-22 | No interactive prompts — headless by construction | `grep -nE '(readline\|createInterface\|process\\.stdin\\.(read\|setRawMode)\|@clack\|inquirer\|prompts?\\(\|confirm\\()' scripts/workflow-status.mjs` -> no match |
| A-23 | Stdout for data, stderr for diagnostics — stdout alone is one valid JSON document; offline diagnostics land on stderr | `node scripts/workflow-status.mjs 2>/dev/null \| node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{JSON.parse(s)})'` -> exit 0; the A-04 offline fixture asserts degradation/diagnostic lines on stderr while stdout stays valid envelope JSON |
| A-24 | `references/ENVELOPE_CORE.md` slimmed to interpret-and-recommend (script-backed reference present; assembly self-check prose gone — the script owns the self-check, E-38-1) | `grep -c 'scripts/workflow-status.mjs' skills/workflow-status/references/ENVELOPE_CORE.md` -> ≥ 1 AND `grep -cE 'self-check before printing' skills/workflow-status/references/ENVELOPE_CORE.md` -> 0 |
| A-RV | Feature 15's injection-safety invariant (urgency from labels only) is preserved in the new script | read-verified: code-review pass over the urgency path against feature 15 (#47), noted in progress.md and confirmed in PR review |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The discipline-test pins are updated to the new contract, never weakened: every existing pin keeps its asserted behavior or gains a strictly stronger assertion (O26).

## Commands

- `node --test scripts/workflow-status-sensor.test.mjs`
- `node --test scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs`
- `node scripts/check-skill-context.mjs`
- `node --test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/pre-execution-quality.test.mjs scripts/audit-pr-receipt.test.mjs`
- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
- `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`
