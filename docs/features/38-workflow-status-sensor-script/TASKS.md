# TASKS — 38-workflow-status-sensor-script

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit. Tests are written
red-first inside each phase and made green by that phase's implementation —
never edited to pass.

## P1 — Sensor script core emission

Layer: config/infra · Done-when: `node --test
scripts/workflow-status-sensor.test.mjs` → exit 0 with the schema-validity,
field-presence, read-only, idempotence, roadmap-mapping, labels-only,
flag-contract (A-17/A-20), and envelope-mismatch (E-38-1) pins green on the
git fixture repo, and the existing root suites still exit 0.

- [ ] Write the module scaffold in `scripts/workflow-status.mjs` — ES module header,
  Node ≥ 18 shebang, shebang line `#!/usr/bin/env node`, import `loadSchemaRuntime` from
  `./schema-runtime.mjs`, `loadSchemaRuntime()` call in `main()`, schema package version
  read from `packages/agentic-workflow-schema/package.json` (PE-001; E-38-4).
- [ ] Implement argv parsing — `--help` (prints usage text to stdout, exit 0),
  `--version` (reads schema package version from
  `packages/agentic-workflow-schema/package.json` line 3 field `version`, prints it,
  exit 0), `--json-only` (flag present = accepted no-op; no behavior change),
  `--last-envelope <json|path>` (capture the value for envelope builder; path is
  file-read later, json is inline string), unknown flag → usage diagnostic on stderr
  + non-zero exit (value: 1, following the repo convention 1–2 from
  `scripts/check-skill-context.mjs` and `scripts/ledger-provenance.mjs` — A:20 pin).
- [ ] Implement read-only enforcement — the script source code is never mutated by the
  script itself; structural proof that the script does not call any mutation functions
  via the test suite (A:3 greps for `createBranch|git push|gh pr (edit|merge|close|create)|
  gh issue (edit|close|label|create)|writeFile|fs\.write|unlink` in the script; returns
  nothing). The no-prompt check (A:22) greps for `readline|createInterface|process\.stdin\.
  (read|setRawMode)|@clack|inquirer|prompts?\(|confirm\(` — returns nothing. Both greps
  are fixture-test assertions (regex against the script source file, not runtime calls).
- [ ] Implement envelope skeleton — build the Envelope v2 object in the schema's literal
  field order: `unit` (empty object), `pr` (empty array), `gates` (empty object),
  `findings` (`fix_now` empty array), `dependencies` (empty), `blockers` (empty array),
  `recommendations` (empty object), `needs_input` (null), `next` (`state` and
  `recommended` keys), `detail` (required, may be empty), `state` (string). Build
  `state: "OK"`, `recommended` as a placeholder string.
- [ ] Implement self-validation — call `validateEnvelope(envelope)` after building it;
  if validation fails, print the validation error to stderr but still print the envelope
  to stdout with exit 0 (E-38-1: the self-check is diagnostic, not a gate). If validation
  passes, proceed to stdout print. The envelope-mismatch pin asserts that a stubbed
  failing schema's `validateEnvelope` produces stderr diagnostic + envelope printed + exit 0.
- [ ] Implement stdout/stderr separation — `process.stdout.write(json)` for the envelope;
  `process.stderr.write()` for diagnostics, validation errors, and error messages;
  the `--json-only` flag suppresses any human-readable summary (the script only prints
  the envelope anyway — A:17 no-op). A:23 pin asserts stdout alone parses as valid JSON.
- [ ] Write red-first fixture tests — build `scripts/workflow-status-sensor.test.mjs` with
  a git-init fixture repo following the pattern from `scripts/workflow-status-pre-execution.test.mjs`:
  `git init`, `git config user.email/name`, create a minimal `ROADMAP.md` row, add fixture
  `gh` shim. Test: skeleton envelope validates (`validateEnvelope` → `valid`), field
  presence (`state`, `next`, `detail` present), read-only greps pass on the script source,
  idempotence (`diff <(node scripts/workflow-status.mjs) <(node scripts/workflow-status.mjs)`
  empty), flag contracts (`--help` exit 0, `--version` exit 0, `--json-only` byte-identical,
  unknown flag non-zero + stderr usage).
- [ ] Phase-lint all 8 tasks against the 8-box contract (phase-contract: title names one
  deliverable, one layer = config/infra, ≤ 8 tasks, one checkbox = one deliverable,
  zero decision words, no conditional scope, no external manual gates, machine-checkable
  done-when). Record fingerprint `P1:config/infra:8:sensor-script-core-emission`.

## P2 — Sensor script failure contract

Layer: config/infra · Done-when: `node --test
scripts/workflow-status-sensor.test.mjs` → exit 0 with the offline,
forge-timeout, missing-git, hint-guard, hint-fail-open, `--help`/`--version`,
and stream-separation pins green and every P1 pin unchanged.

- [ ] Implement SENSOR_CORE steps 1–2 — `git branch --show-current` (returns current branch
  name), `git status --porcelain` (dirty tree detection), `git fetch` + `git status -sb`
  (ahead/behind). Forge: the three `gh` list commands verbatim from `SENSOR_CORE.md` step 2:
  `gh pr list --state open --json number,title,headRefName,url,statusCheckRollup`,
  `gh pr list --state merged --limit 20 --json number,headRefName`,
  `gh issue list --state open --json number,title,labels`. Each `gh` call wrapped in a
  bounded wall-clock timeout (implementation constant, suite-pinned at E-38-5 value;
  the timeout value is a module constant, tested via A:21's non-terminating `gh` shim).
- [ ] Implement SENSOR_CORE step 3 — urgency labels-only scan: read the `labels` array from
  each item in the step-2 issue list JSON output (already fetched); for items carrying
  `urgent` or `fix-next`, emit `{number, title, label}`; an issue with both labels is
  reported as `urgent` (strictly dominates — `fix-next` head-of-queue, no-interrupt path
  is redundant); in-flight unit's interruptibility facts: current phase from step 7
  (later), dirty tree from step 1, distance to commit boundary — all from the same
  reads. A:7 pin asserts the script source never references `body` or `comment` strings.
- [ ] Implement SENSOR_CORE steps 4–5 — roadmap/fix-index parsing: read
  `docs/features/ROADMAP.md` rows into the five-state machine
  (`idea/defined/planned/in-progress/done`); for rows with non-standard status, map to the
  nearest five-state value with `default: idea` and note the raw status string in
  `workflow_observations`; read `docs/fix/README.md` for the fix index. Build transitive
  depends-on closure: for each non-merged unit, follow every `Depends on:` entry; mark
  each edge met (dep's PR merged = `done`-with-PR-and-merged) or unmet; detect cycles
  (a unit depends on itself transitively) and inconsistencies (a `done` row whose own deps
  aren't merged) — report as `substrate` blockers. A:6 pin asserts ambiguous row mapping.
- [ ] Implement SENSOR_CORE steps 6–6a — readiness: for each unit, classify based on status
  and deps: `idea` → list under `design_candidates` (never `startable_now`, next command
  `/design-feature <slug>`); `defined` or `planned` + deps met → `startable_now`, next
  command `defined` → `/plan-feature <slug>`, `planned` → `/execute-phase <NN>`; unmet deps
  → `blocked_units`. 6a: receipt sensing — for units at `defined`, `planned`, `in-progress`,
  or `done` with a linked unmerged PR, shell out to the snapshot verifier:
  `node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan> --unit <id>
  [--parent <64-hex> for plan-stage features]`. Map the verifier's structured verdict
  to the label table (`current`/`missing`/`stale`/`wrong-stage`/`substitute`/
  `self-approved`/`author-readiness`/`legacy`/`impossible-timeline`). A unit without a
  current PASS for the stage it is about to enter is demoted from `startable_now` to a
  `gate` blocker naming the missing review; `detail.pre_execution` records the row.
  Unresolvable revisions fail open → unflagged (E-38-8).
- [ ] Implement SENSOR_CORE steps 7–9 — phase progress: for each in-flight unit, read
  `docs/features/<NN>-<slug>/TASKS.md` — `current` phase number, `total` phases, per-phase
  checkbox completion count. Pending quality gates: for each unit with commits, read its
  `docs/features/<NN>-<slug>/review-findings.md` ledger, find the newest `REVIEW-RAN`
  row, check if its sha is an ancestor of the unit's head and no commit after it touched
  bound inputs per `PRE_EXECUTION.md` SNAPSHOT.md (if equality with head, the mark moved
  the head — unreviewed). Derive `review_pending`/`audit_pending`/`merge_ready` per unit.
  Fix-now fold-ledger: read `folded: no` rows from `review-findings.md`, emit structured
  items with `suggested_tier` from the fixed table: `high` → `strong`; axis in
  `{security, correctness, logic, architecture, design, concurrency}` → `strong`; else
  `cheap`.
- [ ] Implement crash-recovery verdict mapping — checklist from CRASH_RECOVERY.md: check
  working tree per unit branch (`git status --porcelain` + unpushed commits), check
  phase-ledger coherence (`progress.md`/`TASKS.md` vs commits), classify each unit's
  verdict (`CLEAN`/`RESUMABLE`/`AMBIGUOUS`). Reduce multi-branch verdicts to the worst
  precedence: `AMBIGUOUS` > `RESUMABLE` > `CLEAN`. Map to envelope state:
  `CLEAN` → `state: OK`, `RESUMABLE` → `state: CONTINUE`, `AMBIGUOUS` → `state: NEEDS_INPUT`
  with `needs_input.question` and `needs_input.options`. Substrate blocker: if NRS ledger
  is missing/draft/contradicted/resolved, emit `BLOCKED` + concrete discovery command.
  `CRASH RECOVERY` sub-block appended to the human report.
- [ ] Implement `--last-envelope` no-progress guard — if the flag value is present: load
  the hint (if it contains `{`, treat as inline JSON; otherwise read from file path).
  Diff the hint's `next.recommended` against the recomputed state: if the hint recommended
  `/plan-feature <slug>` or `/design-feature <slug>` for a unit that is still at the same
  pre-advance status (`defined` for plan-feature, `idea` for design-feature), emit a
  `workflow_observations` note per `ENVELOPE_FIELDS.md` shape (name it as suspected, not
  confirmed). Append the divergence note to `detail.workflow_observations`; the hint never
  mutates `state`/`next` (A:18 pin).
- [ ] Implement degrade-to-namespaced-codes — every environmental failure produces a
  namespaced code in `detail`: forge `unavailable-forge-no-network`,
  `unavailable-forge-timeout` (bounded wall-clock timeout), `unavailable-forge-auth`;
  git `unavailable-git-missing`; hint `unavailable-hint-missing-path`,
  `unavailable-hint-invalid-json`; all degrade to exit 0. The offline fixture pin
  (A:4) asserts severed network → fail-fast degradation codes, exit 0, no hang.
  The timed-out-forge pin (A:21) asserts non-terminating `gh` shim →
  `unavailable-forge-timeout` within the bound, exit 0.

## P3 — Workflow-status skill slimming

Layer: docs · Done-when: `node scripts/check-skill-context.mjs` → exit 0 with
the re-based `workflow-status` entry, and `node --test
scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs
scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs`
→ exit 0 with the re-targeted pins.

- [ ] Slim `skills/workflow-status/SKILL.md` — replace the prose-instructed ~10-command
  assembly sequence (Step 0 → progressive loading → SENSOR_CORE → crash recovery →
  envelope assembly → human report) with a single script call:
  `node scripts/workflow-status.mjs [--json-only] [--last-envelope <json|path>]`.
  Keep: the turn-contract boxes (read-only, envelope on every invocation, the
  no-progress guard ran when `--last-envelope` is supplied), the `--json-only` flag docs,
  the relationship/when-to-use sections, the schema package reference in Machine envelope
  (the schema owner, envelope fields pointer). Keep the portability section (sensor uses
  repository and forge commands). Replace the human report section with: "run the script,
  read the JSON, interpret `next.recommended` per the published contract, print the
  human report." Remove the individual numbered commands from SENSOR_CORE — they are now
  the script's responsibility.
- [ ] Slim `skills/workflow-status/references/SENSOR_CORE.md` — replace the numbered-command
  prose (steps 1–9 with detailed git/gh commands) with a single script call:
  `node scripts/workflow-status.mjs` executes the complete SENSOR_CORE sequence. Keep the
  `sensor-fields@1` grammar block (it is the normative-drift surface and the field contract
  the script implements). Keep ENVELOPE_FIELDS.md, CRASH_RECOVERY.md, GUARDRAILS.md,
  PRE_EXECUTION.md, PORTABILITY.md, SENSOR_SIGNALS.md references unchanged (they own
  semantics the slimmed skill still applies).
- [ ] Slim `skills/workflow-status/references/ENVELOPE_CORE.md` — replace the envelope
  assembly prose (step-by-step construction of the Envelope v2 object) with the single
  fact: "The script is the deterministic producer of the Envelope v2; the skill interprets
  it." Keep the crash-recovery state mapping (`CLEAN` → `OK`, `RESUMABLE` → `CONTINUE`,
  `AMBIGUOUS` → `NEEDS_INPUT`) and the tier map the skill interprets.
- [ ] Re-target discipline-test pins from prose-presence to script-behavior form —
  `bounded-delivery-loops.test.mjs` line 21 reads SKILL.md and line 40 reads
  SENSOR_CORE.md (6a heading): re-point the 6a heading pin from SENSOR_CORE.md's prose
  to the script invocation in SKILL.md; the SKILL.md routing pin (that the skill follows
  the progressive loading allowlist) stays valid because the slimmed skill still loads
  the remaining reference files (CRASH_RECOVERY, ENVELOPE_FIELDS, etc.).
  `workflow-status-pre-execution.test.mjs` line 53 reads SENSOR_CORE.md for the
  mechanical-currency rule: re-point the currency rule source from SENSOR_CORE.md step 8
  to the script's implementation (the script's step 6a receipt sensing implements the same
  currency logic — the script's subprocess invocation of the snapshot verifier is the
  mechanical check; the pin asserts the script's receipt-sensing path exists via a grep
  for the snapshot-verifier invocation string).
  `pre-execution-quality.test.mjs` line 1046 reads SENSOR_CORE.md for the label-override
  pin: re-point to the script's labels-only scan implementation (the script processes the
  labels JSON from step-2's output; the pin asserts the script source contains the label
  processing logic, verified by a grep for the label-handling pattern).
  Every pin keeps its asserted behavior and gains the stronger form — script-behavior is
  strictly stronger than prose-presence (O26).
- [ ] Update `scripts/normative-drift.test.mjs` — adjust the declared surfaces for the
  slimmed references. The `sensor-envelope-fields` grammar (line 845 surface) still
  references `SENSOR_CORE.md` — it remains valid because the grammar block is kept. Add a
  new surface `sensor-script-vocab` if the script now carries normative field ordering
  (it does: `validateEnvelope` ensures the field order is correct).
- [ ] Re-measure the slimmed `workflow-status` skill — read `docs/workflow/SKILL_CONTEXT_BUDGETS.json`,
  add the `workflow-status` entry with updated budget values (the slimmed skill has fewer
  lines → lower estimate). The skill currently has no entry → uses defaults
  (`mainEstimateMax: 2800`, `referenceEstimateMax: 2200`). After slimming, the main text
  shrinks from 149 lines to approximately 80-90 lines (remove ~100 lines of prose commands,
  keep turn-contract boxes and structural sections); the reference files shrink by ~100
  lines (SENSOR_CORE.md removes ~100 lines of command prose). Re-measure using the
  `check-skill-context.mjs` metrics (ceil(UTF-8 bytes / 4) for the estimate).
  Write the budget entry to the manifest with the re-measured value.
- [ ] Bump `workflow-status` 3.2.1 → 3.3.0 via the bump-skill contract — minor bump
  (process rewording, external argv + envelope contract unchanged, E-38-2). Both CHANGELOG
  siblings gain a version-row at the top of the version history. Update the version table
  in `docs/workflow/SKILLS.md` (the skill count + version columns). Keep the skill inside
  the context budget (the slimmed skill's budget entry is added in step 6, so the total
  effect is a budget-neutral change with a minor version bump).

## P4 — Qualify the sensor unit

Layer: hardening · Done-when: every frozen validator in `ACCEPTANCE.md`
passes, `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`
→ empty, and the PR is open with `Closes #185` (PR URL printed in the chat).

- [ ] Wire driver contract in `docs/workflow/ORCHESTRATION.md` — add the script as the
  envelope's deterministic producer. Reference the script path
  `scripts/workflow-status.mjs` in the driver integration section where the envelope is
  consumed. State the invocation convention: `node scripts/workflow-status.mjs [--json-only]
  [--last-envelope <json|path>]`. Note that the script's output is the single source of
  truth for the envelope shape (business goal 3). The driver reads the script's JSON and
  interprets `next.recommended`.
- [ ] Synchronize bilingual driver wiring in `docs/workflow/ORCHESTRATION.es.md` — the
  same script wiring as the EN file (reciprocal switcher links intact; the ES sibling must
  be updated in the same change per the CLAUDE.md bilingual sync rule).
- [ ] Add additive MIGRATION note — `docs/workflow/MIGRATION.md` gains a dated note about
  the workflow-status slimming: "The `workflow-status` sensor (v3.3.0) now runs the
  deterministic script `scripts/workflow-status.mjs` instead of prose-instructed git/gh
  commands; the envelope shape and the machine contract are identical. The script provides
  declared degradation codes, bounds forge latency, and enforces read-only by construction."
- [ ] Verify the schema package is byte-untouched — `git diff --name-only main...HEAD --
  packages/agentic-workflow-schema` → empty. The envelope vocabulary is unchanged (A:13);
  `detail` is schema-unconstrained, so every new `detail` shape needs no package change.
- [ ] Run full regression suite — execute every root discipline suite:
  `node --test scripts/workflow-status-sensor.test.mjs` (new sensor suite),
  `node --test scripts/bounded-delivery-loops.test.mjs` (loop discipline with re-targeted pins),
  `node --test scripts/pre-execution-quality.test.mjs` (pre-execution quality with re-targeted pins),
  `node --test scripts/workflow-status-pre-execution.test.mjs` (pre-execution sensor with re-targeted pins),
  `node --test scripts/normative-drift.test.mjs` (versioned grammar drift check),
  `node --test scripts/ledger-provenance.test.mjs` (ledger provenance),
  `node --test scripts/ledger-ownership.test.mjs` (ledger ownership),
  `node --test scripts/audit-pr-receipt.test.mjs` (audit-pr receipt),
  `node --test scripts/review-loop-discipline.test.mjs` (review-loop discipline),
  `node --test scripts/check-skill-context.mjs` (context budgets); all must exit 0.
  `cd packages/agentic-workflow-schema && npm test` must exit 0 (schema package untouched).
- [ ] Run Pi mirror re-bundle — `cd packages/pi-agentic-workflow && npm run bundle:skills`;
  verify parity tests pass; update distribution metadata as required. The bundle copies
  skill trees only; root `scripts/` do not travel (PE-009). In-repo dogfooding is unaffected.
  The installed-release gap is tracked in known-issues.md → #198.
- [ ] Close planning docs truthfully — `progress.md` gains a handoff entry with Done
  (P4 complete), Remains (PR merge), Gotchas (the scripts/ distribution gap for installed
  copies), Files (list all changed files). `testing.md` is complete (validation ladder all
  rows PASS). `known-issues.md` has no remaining blockers.
- [ ] Open the PR — `gh pr create --body-file docs/features/38-workflow-status-sensor-script/pr-body.md`
  (body written as a Markdown file, real backticks, never inline `--body`/heredoc that
  leaves `\`-escaped backticks). The PR body must include: `Closes #185`, the branch name
  `feat/38-workflow-status-sensor-script`, a summary of changes (new script, slimmed skill,
  re-targeted pins), and the acceptance verification results.
- [ ] Update the roadmap row — change from `defined` to `in-progress` (PR open, merge
  pending). Format: `in-progress · [PR #<n>](<pr-url>) · Depends on: none`
  (status `in-progress` means PR is open but not yet merged; the merge state lives in the
  forge).
- [ ] Commit and push — `git commit -a -m "feat(38): deterministic workflow-status sensor script"`;
  `git push origin feat/38-workflow-status-sensor-script`.
- [ ] Update roadmap row to `done` — after merge, update the row to
  `done · [#<pr>](<pr-url>)` and commit.
- [ ] Close the PR — the PR is open and awaiting merge; this step is manual (per the
  repository's convention of human merge).
- [ ] Recompute and record the frozen `ACCEPTANCE.md` blob —
  `git hash-object docs/features/38-workflow-status-sensor-script/ACCEPTANCE.md` → sha;
  append an acceptance receipt to `progress.md` with `Status: frozen` + `Verified: 2026-09-09`.