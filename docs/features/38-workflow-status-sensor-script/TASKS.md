# TASKS — 38-workflow-status-sensor-script

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit. Tests are written
red-first inside each phase and made green by that phase's implementation —
never edited to pass. Frozen finish line: `ACCEPTANCE.md` (rows A-01…A-23,
A-RV); obligations in `planning-obligations.md` (O1–O26).

## P1 — Sensor script core emission

Layer: config/infra · Done-when: `node --test
scripts/workflow-status-sensor.test.mjs` -> exit 0 with the schema-validity,
field-presence, read-only, idempotence, roadmap-mapping, and labels-only pins
green on the git fixture repo, and the existing root suites still exit 0.

- [ ] Write red-first pins in new `scripts/workflow-status-sensor.test.mjs` (git-init fixture repo per the `workflow-status-pre-execution.test.mjs` harness pattern): output parses as one JSON document that `validateEnvelope` accepts; steps 1–9 field presence per the `sensor-fields@1` grammar; idempotence (two runs byte-identical); the A-03 mutation grep, A-07 labels-only greps, A-08 loader-import greps, A-12 no-`decideWorkflowAction` grep, and A-22 no-prompts grep.
- [ ] Create `scripts/workflow-status.mjs`: ESM, `import { loadSchemaRuntime } from "./schema-runtime.mjs"` (named fail-fast precondition, no published fallback), argv parsing over the closed flag set (`--json-only`, `--last-envelope <json|path>`, `--help`, `--version`), unknown flag -> usage on stderr + non-zero exit.
- [ ] Implement steps 1–3: git state commands, forge state via the SENSOR_CORE `gh` list commands, urgency labels-only scan (`{number, title, label}`, `urgent` dominates) + in-flight interruptibility facts reusing the same reads.
- [ ] Implement steps 4–5: roadmap + fix-index row parsing into the five-state machine (ambiguous status -> nearest value, `default: idea`, raw string noted in `workflow_observations`); transitive depends-on closure with met/unmet edges (`done`-with-open-PR is NOT met) and cycle/consistency substrate blockers.
- [ ] Implement steps 6–6a: readiness classification (`design_candidates` / `startable_now` / `blocked_units`); receipt sensing via `node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan> --unit <id> [--parent <64-hex>]` mapped through the label table with label-overrides-status-command demotion; unresolvable revisions fail open.
- [ ] Implement steps 7–9: phase progress from in-flight `TASKS.md`; pending quality gates from the `review-findings.md` review-mark ancestry rule; fix-now fold-ledger projection with the fixed `suggested_tier` table.
- [ ] Assemble the envelope in the schema's field order, run `validateEnvelope` as a self-check (mismatch -> stderr diagnostic, envelope still printed, exit 0), and print exactly one JSON document to stdout with a fixed key order and no clock reads.
- [ ] Make the red-first pins green on the fixture and confirm the existing root suites still exit 0 (`node --test scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs` — skill prose untouched in P1); commit the phase.

## P2 — Sensor script failure contract

Layer: config/infra · Done-when: `node --test
scripts/workflow-status-sensor.test.mjs` -> exit 0 with the offline,
forge-timeout, missing-git, hint-guard, hint-fail-open, flag, and
stream-separation pins green and every P1 pin unchanged.

- [ ] Write red-first pins: severed-network fixture (A-04), non-terminating `gh` shim (A-21), missing-git fixture (degradation code, exit 0), missing-path + invalid-JSON hints (A-19), unknown-flag non-zero + stderr usage (A-20), stdout-alone-JSON parse + offline diagnostics on stderr (A-23), `--json-only` byte-identical no-op (A-17), stale-hint no-progress note with recomputed `state`/`next` unchanged (A-18, inline-JSON + file-path variants).
- [ ] Emit namespaced `unavailable-<source>-<cause>` degradation codes into the corresponding `detail` dimensions (forge: no-network, timeout, auth, missing-cli; git: missing; hint: missing, unreadable, invalid — Product decision 6).
- [ ] Bound every forge call with a wall-clock timeout (implementation constant, suite-pinned) so a hanging forge degrades to `unavailable-forge-timeout` with exit 0; missing `gh` binary and missing git degrade with exit 0.
- [ ] Implement `--json-only` as an accepted no-op and `--help`/`--version` (usage text; `--version` prints the schema package's version from `packages/agentic-workflow-schema/package.json`).
- [ ] Implement `--last-envelope <json|path>`: load the hint (inline JSON string or file path), diff it against the recomputed envelope, run the no-progress guard with the exact note shape from ENVELOPE_FIELDS.md, and append the divergence line + guard note to `detail.workflow_observations`; the hint never mutates `state`/`next`.
- [ ] Degrade unreadable/malformed hints fail-open: `unavailable-hint-<cause>` note in `detail.workflow_observations`, exit 0, recomputed envelope unaffected.
- [ ] Keep stdout = one JSON document and stderr = diagnostics in every code path, including degraded runs.
- [ ] Make the P2 pins green and keep every P1 pin + existing root suite green; commit the phase.

## P3 — Workflow-status skill slimming

Layer: docs · Done-when: `node scripts/check-skill-context.mjs` -> exit 0 with
the re-based `workflow-status` entry, and `node --test
scripts/bounded-delivery-loops.test.mjs scripts/pre-execution-quality.test.mjs
scripts/workflow-status-pre-execution.test.mjs scripts/normative-drift.test.mjs`
-> exit 0 with the re-targeted pins.

- [ ] Re-target the discipline pins red-first: `bounded-delivery-loops.test.mjs`'s SKILL.md routing pin + SENSOR_CORE.md `6a.` heading pin, `workflow-status-pre-execution.test.mjs`'s step-8 rule source (read from the script's own contract/suite instead of the slimmed prose), `pre-execution-quality.test.mjs`'s SENSOR_CORE label-override pin — every pin keeps its asserted behavior and gains the script-behavior form; `PRE_EXECUTION.md` pins stay untouched (file not slimmed).
- [ ] Slim `skills/workflow-status/SKILL.md` to interpret-and-recommend: run `node scripts/workflow-status.mjs [--json-only] [--last-envelope <json|path>]`, read the JSON, interpret `next.recommended` (tier map, suggested triggers) and the degradation codes per the published contract, print the human summary then the envelope last; keep the turn-contract boxes (read-only, envelope on every invocation, the no-progress guard ran by the script when the flag is supplied).
- [ ] Slim `references/SENSOR_CORE.md` fixed-sequence prose to the script call reference; keep the `sensor-fields@1` grammar block and the label-override/step-6a behavioral statements only as script-owned references.
- [ ] Slim `references/ENVELOPE_CORE.md` fixed-shape assembly prose to script-backed references; keep the crash-recovery state mapping and the `next.tier` command map the skill interprets.
- [ ] Re-base `docs/workflow/SKILL_CONTEXT_BUDGETS.json` for the slimmed sensor skill (add the `workflow-status` entry with the smaller measured budgets; A-14).
- [ ] Bump `workflow-status` 3.2.1 -> 3.3.0 via the `bump-skill` contract (both CHANGELOG siblings get rows) and keep the skill inside its re-based budget.
- [ ] Verify the six untouched reference files are byte-identical (`git diff --name-only main...HEAD -- skills/workflow-status/references/CRASH_RECOVERY.md skills/workflow-status/references/ENVELOPE_FIELDS.md skills/workflow-status/references/GUARDRAILS.md skills/workflow-status/references/PRE_EXECUTION.md skills/workflow-status/references/PORTABILITY.md skills/workflow-status/references/SENSOR_SIGNALS.md` -> empty); run the re-targeted discipline suites + `check-skill-context.mjs` green; commit the phase.

## P4 — Qualify the sensor unit

Layer: hardening · Done-when: every frozen validator in `ACCEPTANCE.md`
passes, `git diff --name-only main...HEAD -- packages/agentic-workflow-schema`
-> empty, and the PR is open with `Closes #185` (PR URL printed in the chat).

- [ ] Driver wiring: `docs/workflow/ORCHESTRATION.md` names `scripts/workflow-status.mjs` as the envelope's deterministic producer (consumers read the same JSON directly; `decideWorkflowAction()` stays consumer-side) — EN + ES siblings in one change with reciprocal switcher links intact.
- [ ] Add the additive note to `docs/workflow/MIGRATION.md` (sensor slims to script + interpretation; skill 3.2.1 -> 3.3.0).
- [ ] Re-bundle the pi mirror only through `cd packages/pi-agentic-workflow && npm run bundle:skills` (metadata/version bump per that package's own contract) and pass its suite/parity tests.
- [ ] Run the full frozen validation ladder: every `ACCEPTANCE.md` validator -> PASS, with the tally and outputs recorded in `progress.md`.
- [ ] Confirm untouched surfaces: `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` -> empty and `cd packages/agentic-workflow-schema && npm test` -> exit 0 (A-13).
- [ ] Injection-safety read-verified pass: code-review the urgency path against feature 15 (#47)'s labels-only invariant and note the result in `progress.md` (A-RV).
- [ ] Close out the planning docs truthfully: tick `TASKS.md`, update `planning-obligations.md` statuses to `verified` with the named evidence, record the `ACCEPTANCE.md` blob receipt in `progress.md`.
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
