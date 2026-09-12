# PLAN — 38-workflow-status-sensor-script

Four implementation phases (core emission → failure contract → skill slimming → qualification).
Artifact revision of this plan set: `38-plan-1` (rotated by `plan-feature-scaffold`
on 2026-09-09).

## P1 — Sensor script core emission

Layer: config/infra · Task count: 8

Write the sensor script with schema-runtime loader, argv parsing, read-only enforcement,
envelope emission + self-validation, fixture-repo test harness.

- [ ] Create `scripts/workflow-status.mjs` scaffold — module header, Node ≥ 18 shebang,
  import `loadSchemaRuntime` from `./schema-runtime.mjs`, no bundler, no transpilation.
- [ ] Implement argv parsing — `--help` (prints usage, exit 0), `--version` (prints schema
  package version from `packages/agentic-workflow-schema/package.json`, exit 0),
  `--json-only` (accepted no-op), unknown flag (fatal: usage diagnostic on stderr + non-zero
  exit), `--last-envelope <json|path>` (parse and pass to envelope builder).
- [ ] Implement read-only enforcement — verify the script source code at build time that
  no mutation calls exist (structural proof via grep-equivalent check in test suite);
  verify no prompt libraries or stdin-interactive code present (A:3, A:22 pins).
- [ ] Implement schema-runtime loader — call `loadSchemaRuntime()` to import the schema
  package's built dist; the loader throws the named "schema runtime is not built" when
  `dist/` is missing (A:11's case (b) precondition).
- [ ] Implement the envelope skeleton — build the Envelope v2 object in the schema's field
  order with `state`, `next`, and empty `detail`; import `validateEnvelope` and self-check
  the envelope before printing (E-38-1: self-check is diagnostic only, not a gate).
- [ ] Implement stdout/stderr separation — the envelope JSON goes to stdout only; all
  diagnostics, validation mismatches, and error messages go to stderr; stdout alone
  parses as one valid JSON document (A:23 pin).
- [ ] Write red-first fixture test — `scripts/workflow-status-sensor.test.mjs` with a
  git-init fixture repo (following the harness pattern from `workflow-status-pre-execution.test.mjs`);
  test skeleton envelope validates against schema (`validateEnvelope` → `valid`);
  read-only greps pass; idempotence check (two runs → byte-identical).
- [ ] Phase-lint all 8 tasks against the 8-box contract (phase-contract); record
  fingerprint `P1:config/infra:8:sensor-script-core-emission`.

## P2 — Sensor script failure contract

Layer: config/infra · Task count: 8

Implement the complete SENSOR_CORE sequence (steps 1–9) with degradation codes, forge
timeout, crash-recovery verdict mapping, `--last-envelope` no-progress guard.

- [ ] Implement SENSOR_CORE steps 1–2 — `git branch --show-current` / `git status
  --porcelain` / `git fetch` + `git status -sb`; three `gh` list commands verbatim from
  SENSOR_CORE.md step 2 (`gh pr list --state open`, `gh pr list --state merged --limit 20`,
  `gh issue list --state open`) wrapped in bounded wall-clock timeout (E-38-5).
- [ ] Implement SENSOR_CORE step 3 — urgency labels-only scan of the step-2 issue list
  (`{number, title, label}` array from step-2's `--json` output); `urgent` dominates when
  both labels present; in-flight unit's interruptibility facts from the same reads
  (reusing phase progress from step 7, crash recovery from step 7).
- [ ] Implement SENSOR_CORE steps 4–5 — roadmap/fix-index parsing into the five-state
  machine (`idea/defined/planned/in-progress/done`); non-standard status maps to nearest
  five-state value with `default: idea` and notes the raw string in `workflow_observations`;
  transitive depends-on closure with met/unmet edges (done-with-open-PR is NOT met);
  cycle/consistency substrate blockers (A:6 pin).
- [ ] Implement SENSOR_CORE steps 6–6a — readiness classification (`idea` →
  `design_candidates`; `defined`/`planned` + deps met → `startable_now`; unmet deps →
  `blocked_units`); receipt sensing via subprocess to `scripts/pre-execution-snapshot.mjs
  verify --stage <spec|plan> --unit <id> [--parent <64-hex>]`; map structured verdict
  to label table (`current`/`missing`/`stale`/`wrong-stage`/`substitute`/
  `self-approved`/`author-readiness`/`legacy`/`impossible-timeline`); label overrides
  status-only command (demotion to `gate` blocker, `detail.pre_execution` row);
  unresolvable revisions fail open → unflagged (E-38-8).
- [ ] Implement SENSOR_CORE steps 7–9 — phase progress from each in-flight `TASKS.md`
  (`current`/`total`/per-phase checkbox completion); pending quality gates from the
  `review-findings.md` review-mark ancestry rule (mark sha ancestor of head, no later
  commit touched bound inputs per SNAPSHOT.md); fix-now fold-ledger projection (read
  `folded: no` rows, emit structured items with `suggested_tier` from the fixed table).
- [ ] Implement crash-recovery verdict mapping — checklist from CRASH_RECOVERY.md:
  dirty tree + ledger coherence → `CLEAN`/`RESUMABLE`/`AMBIGUOUS`; multi-branch worst
  precedence (`AMBIGUOUS` > `RESUMABLE` > `CLEAN`); map to envelope state
  (`CLEAN` → `OK`, `RESUMABLE` → `CONTINUE`, `AMBIGUOUS` → `NEEDS_INPUT`); substrate
  blocker overrides (missing/non-frozen NRS → `BLOCKED` + `/discover-repository-state`).
- [ ] Implement `--last-envelope` no-progress guard — load hint (inline JSON or file path);
  diff the hint's `next.recommended` against the recomputed state for each unit; if the
  unit's recomputed status is still at the same pre-advance state the hint expected it to
  leave (`defined` for `/plan-feature`, `idea` for `/design-feature`), emit a
  `workflow_observations` note per ENVELOPE_FIELDS.md shape; the hint never mutates
  `state`/`next` (A:18 pin).
- [ ] Implement degrade-to-namespaced-codes for every environmental failure — forge
  `unavailable-forge-timeout` (bounded timeout per E-38-5), git `unavailable-git-missing`,
  hint `unavailable-hint-missing-path`/`unavailable-hint-invalid-json`; all with exit 0.

## P3 — Workflow-status skill slimming

Layer: docs · Task count: 7

Slim the sensor skill to interpret-and-recommend, re-target discipline pins, re-base
budgets, bump version.

- [ ] Slim `skills/workflow-status/SKILL.md` — replace the prose-instructed ~10-command
  assembly sequence with a single script call `node scripts/workflow-status.mjs`;
  keep the turn-contract boxes (read-only, envelope on every invocation, the no-progress
  guard ran when `--last-envelope` is supplied); keep the `--json-only` flag docs;
  keep the relationship/when-to-use sections; keep the schema package reference in
  Machine envelope (the schema owner, envelope fields pointer).
- [ ] Slim `skills/workflow-status/references/SENSOR_CORE.md` — replace the numbered
  command prose with the script call; keep the `sensor-fields@1` grammar block (it is
  the normative-drift surface and the field contract the script implements).
- [ ] Slim `skills/workflow-status/references/ENVELOPE_CORE.md` — replace the envelope
  assembly prose with the script-owns-assembly fact; keep the state mapping + tier map
  the skill interprets.
- [ ] Re-target discipline-test pins from prose-presence to script-behavior form —
  `bounded-delivery-loops.test.mjs` (6a heading + SKILL.md routing pin): re-point from
  SENSOR_CORE.md numbered steps to the script invocation; `workflow-status-pre-execution.test.mjs`
  (step-8 rule source): re-point the mechanical-currency rule source to the script's
  implementation; `pre-execution-quality.test.mjs` (label-override pin): re-point to
  the script's urgency labels-only path. Every pin keeps its asserted behavior and gains
  the stronger form (script-behavior is strictly stronger than prose-presence) (O26).
- [ ] Update `scripts/normative-drift.test.mjs` — adjust the declared surfaces for the
  slimmed references; `sensor-envelope-fields` grammar still declared from
  `SENSOR_CORE.md` (the grammar block is kept); new surface `sensor-script-vocab` if the
  script now carries normative field ordering.
- [ ] Re-measure the slimmed `workflow-status` skill against
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — add/update the skill's entry in the
  manifest with the new budget values; run `node scripts/check-skill-context.mjs` green.
- [ ] Bump `workflow-status` 3.2.1 → 3.3.0 via the bump-skill contract — both CHANGELOG
  siblings gain a version-row; update the version table in `docs/workflow/SKILLS.md` or
  `docs/workflow/SKILLS.es.md` if present; keep the skill inside the context budget.

## P4 — Qualify the sensor unit

Layer: hardening · Task count: 9

Driver wiring, bilingual sync, Pi bundle parity, full validation, PR + roadmap.

- [ ] Wire driver contract in `docs/workflow/ORCHESTRATION.md` — name the script as the
  envelope's deterministic producer; add the script path and invocation convention to the
  driver integration section.
- [ ] Synchronize bilingual driver wiring — `docs/workflow/ORCHESTRATION.es.md` gains the
  same script wiring (reciprocal switcher links intact; the ES sibling must be updated
  in the same change).
- [ ] Add additive MIGRATION note — `docs/workflow/MIGRATION.md` gains a dated note about
  the workflow-status slimming (the sensor now runs the script instead of prose; the
  envelope shape is identical).
- [ ] Verify the schema package is byte-untouched — `git diff --name-only main...HEAD --
  packages/agentic-workflow-schema` → empty; the envelope vocabulary is unchanged.
- [ ] Run full regression suite — all root discipline suites exit 0 with the re-targeted
  pins; the sensor fixture suite exits 0 with all property tests green; schema package
  suite green; ledger-ownership + audit-pr-receipt suites green.
- [ ] Run Pi mirror re-bundle — `cd packages/pi-agentic-workflow && npm run bundle:skills`;
  verify parity tests pass; update distribution metadata as required.
- [ ] Close planning docs truthfully — `progress.md` (handoff entry with Done/Remains/
  Gotchas/Files); `testing.md` (validation ladder complete); `known-issues.md` (no
  remaining blockers).
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file,
  real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat.
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`.
- [ ] Commit `docs: link PR #<n>` and push.

### Close-out (P4 completion)

- [ ] Run the PR URL print: `gh pr view <n> --json url` → verify the PR is open and the
  URL matches the printed value.
- [ ] Recompute and record the frozen `ACCEPTANCE.md` blob: `git hash-object
  docs/features/38-workflow-status-sensor-script/ACCEPTANCE.md` → sha; append receipt
  to `progress.md` with `Status: frozen` + `Verified: <date>`.