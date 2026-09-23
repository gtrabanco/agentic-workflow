---
type: feature
scope: large
---

# 62 — pi-native-conductor

> Deterministic pi-native orchestrator replacing the retired ship-roadmap role: sensor → decideWorkflowAction() → verbatim continuation invocation, as pi package commands over the lane's runner.

## Objective

Ship a deterministic conductor as `@gtrabanco/pi-agentic-workflow` commands that reads the workflow-status Envelope v2, decides the next action with `decideWorkflowAction()` (schema package), and invokes the printed continuation verbatim — replacing the retired `ship-roadmap` skill's orchestration role with code instead of model-held procedure. Exists now because feature 61 retired ship-roadmap and deferred its conductor half to this row.

## Why

`ship-roadmap` (retired in feature 61 P9) carried the stage-orchestration loop — sensor → decision → next command — plus the urgency micro-judge, the unattended `--adversarial 2` floor, batch-design, and closeout, all as prose a model had to re-derive every invocation. Feature 61 landed the lane, the sensor's priority queue (`next.recommended` computed in code), and the continuation contract (`next.continuation` with argv + preconditions + refusals), but no machine consumer drives units end-to-end from it yet: the operator still reads the envelope and types the next command by hand.

## User outcome

An operator invokes one pi command (e.g. `/advance` or the conductor entry) and the system runs the deterministic decide-then-invoke loop over the lane's runner: it prints the sensor envelope's recommendation, executes the continuation verbatim when preconditions hold, and stops with a typed refusal otherwise. Unattended runs keep feature 20's merge-authority rules (default: human merge).

## Acceptance criteria

1. **Native `advance` command**: after installing the package, a pi session exposes an `advance` command registered by package code (not derived from a skill dir), which runs the deterministic conductor loop and prints one envelope-of-record block per iteration. Verification: the package test harness dispatches `advance` through `createSession()` and observes the loop run against a scripted sensor double.
2. **Decide-then-invoke loop**: each iteration runs the repo's sensor (`scripts/workflow-status.mjs`, spawned with `runtimeBin`), validates the Envelope v2 JSON, feeds the mapped snapshot + policy to `decideWorkflowAction()`, and on `invoke` sends the decision's command through the existing router — the `argv` of `next.continuation` (or `next.recommended`) is never mutated; a display-only rendering may be printed. Verification: a test with a fake envelope asserting `sendUserMessage` receives exactly the mapped `/skill:<verb> <args>` string.
3. **Fail-closed refusals**: sensor spawn failure, non-JSON output, schema-invalid envelope, or a `degradations[]`-present envelope the policy refuses → typed refusal from `CONTINUATION_REFUSALS` (`sensor-degraded`, `precondition-uncheckable`, `rendering-failed`, `no-decision-available`), nothing invoked, loop stops with the refusal code printed. Verification: one test per refusal code.
4. **Sense and stop verdicts**: a `sense` decision re-runs the sensor once and, if the revision is still stale or evidence missing, stops without invoking; every `stop` decision ends the loop with its reason code (`stop-*` closed set) and detail surfaced to the operator. Verification: table-driven tests over decision outputs.
5. **Deterministic urgency judge**: with `detail.urgent` present — no urgent issues → no judge; an issue labeled `fix-next` → queued head-of-line next iteration, never interrupting; `interruptibility.dirty == false` → `INTERRUPT_NOW` (in-flight unit parked with a WIP commit note before selecting the urgent fix); `tasks_from_boundary <= 1` → `FINISH_FIRST`; the ambiguous middle → fail-safe `FINISH_FIRST`. No model call in the judge. Verification: table-driven tests over the four short-circuit rows + fail-safe row.
6. **Unattended adversarial floor**: when the run is unattended (`--unattended`/`--fullauto`), an invocation of a review-class command carries `--adversarial 2` for L/sensitive units and `--adversarial 3` for security/auth units, resolved from config + envelope unit facts; attended runs add nothing. Verification: tests asserting the appended flag per unit class.
7. **Closeout gate between iterations**: a stage counts only when `git status --porcelain` is empty and the branch is not ahead of its upstream; a dirty/unpushed end marks the iteration partial, and 3 consecutive partials on the same unit stop the loop with a park reason. Verification: tests with scripted git doubles.
8. **Terminal banners**: loop end prints exactly one of `ADVANCE: COMPLETE` (nothing startable), `ADVANCE: BLOCKED` (with unblock map from the envelope), `ADVANCE: STOPPED` (cap/refusal/needs-input), or the refusal/stop code — never a bare hang. Iteration cap (config, default 12) stops with `stop-failed` + cap detail. Verification: tests per banner.
9. **Merge authority intact**: the conductor never merges — when the envelope reports a merge-ready PR awaiting human merge, the loop stops with `stop-needs-input` naming `/audit-pr` + human merge. `--fullauto` changes nothing about merging in this unit (feature 20 floors stay). Verification: test asserting no merge command is ever sent.
10. **Run log**: every iteration appends one line (`YYYY-MM-DD HH:MM — <decision kind/code> — <command or stop> — <iteration k/cap>`) to a gitignored run log next to the workflow state; the file is never committed. Verification: test asserting the log line format and `.gitignore` coverage.
11. **Snapshot mapping is deterministic and tested**: the envelope→`WorkflowSnapshot` mapping is a pure function with table-driven tests (each envelope field lands in the snapshot field the schema type declares); `decideWorkflowAction` receives no other source of truth. Verification: mapping tests + property test reuse from the schema package.
12. **Gates stay green**: root suite, schema suite, and pi package suite (incl. `test:node` node-compat) pass at merge time; the conductor is consumer-only — no envelope field, reason code, or refusal code changes. Verification: full gate run recorded in Evidence.

## Non-goals

- Not the AWL runner (the future public `agwo.party` runner) — this is the pi package command layer only; `npm name agwo` stays reserved.
- Not a re-implementation of the lane, the triage catalog, or the sensor — the conductor consumes Envelope v2 and `decideWorkflowAction()` verbatim; it never re-derives a decision the schema package already computes.
- No merge to `main` performed by the conductor — feature 20's merge-authority rules keep the human merge as the default; `--fullauto` only changes what the conductor may *invoke*, never what it may *merge*.
- No new envelope fields, refusal codes, or reason codes — this unit is a consumer; any schema change is a separate unit.
- No revival of ship-roadmap prose — behaviors migrate as deterministic code paths, not as re-created skill text.

## Future cost

- Any new `next.reason` code, refusal code, or envelope field binds the conductor's decision table — add the mapping in the same PR that changes the schema package.
- The conductor must keep working when the sensor degrades (`degradations[]` present) — fail closed to a typed refusal, never guess.
- Retired-skill aliases must not reappear: the conductor's command names live in the pi package, not in `skills/`.

## Applicable tests

- `packages/pi-agentic-workflow/test/` — new conductor suites copied from the existing harness (fake pi context, registered-command dispatch): decision-table mapping (each `next.reason` → the exact continuation), refusal paths (all `CONTINUATION_REFUSALS` codes), precondition gate (unsatisfied precondition → typed refusal, no invocation), urgency micro-judge and unattended adversarial floor, batch-design and closeout steps.
- `scripts/continuation-discipline.test.mjs` + `scripts/workflow-status-sensor.test.mjs` (root suite) — must stay green: the conductor consumes, never mutates, the envelope contract.
- `packages/agentic-workflow-schema` suite — stays green (no schema change; consumer-only).

## Known pre-existing issues

- Issue [#246](https://github.com/gtrabanco/agentic-workflow/issues/246) — product-owned review findings have no machine route (`unit-route` falls through to `fold`). **does-not-affect** this unit: the conductor consumes `next.*` from the sensor, not review-finding routing.
- `@gtrabanco/pi-agentic-workflow` still depends on `file:../agentic-workflow` on `main` (publish follow-up in PR #253). **affects** this unit's release step only: the conductor's commands must work with the pinned `0.1.1` runner, so the release step merges/lands after the dep flip.

## Tasks

Tests come first in every phase (never change a test to pass it):

- P1 — Tests-first: conductor suite skeleton in `packages/pi-agentic-workflow/test/` copied from `test/dispatch-refusals.test.mjs` + `test/runtime.test.mjs` harness patterns; scripted sensor double; add `@gtrabanco/agentic-workflow-schema` (exact pin) dependency.
- P2 — Envelope→snapshot pure mapping (`src/conductor/snapshot.ts`) + sensor client (`src/conductor/sensor.ts`: spawn via `runtimeBin`, parse, validate, fail-closed refusals) with their tests green.
- P3 — Decision mapping + verbatim invocation (`src/conductor/decide.ts`, `src/conductor/invoke.ts`) over the existing router; sense/stop/refusal handling; tests green.
- P4 — Deterministic urgency judge + in-flight parking (`src/conductor/urgency.ts`); tests green.
- P5 — Unattended adversarial floor + closeout gate + run log + loop caps/banners (`src/conductor/{adversarial,closeout,loop}.ts`); tests green.
- P6 — Register the native `advance` command in `src/extension/factory.ts` + config keys (`advance.iterationsCap`, `advance.sensitivePaths`, `advance.securityPaths`); node-compat (`test:node`) green.
- P7 — Verification: full gates (root suite, schema suite, pi suite, npm pack tarball assertion) recorded as Evidence rows.
- P8 — Docs: conductor section in `docs/workflow/ORCHESTRATION.md` + `docs/workflow/LANE_FLOW.md` command table + package README; pi package version bump + CHANGELOG row (same PR).


## Evidence

Triaged steps (verbatim, authoritative):

```
TRIAGE — 62-pi-native-conductor (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Skipped: none
Budget: strong
```

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| 1 | `bun run test` (packages/pi-agentic-workflow) | 0 | 339 pass / 0 fail — loop end-to-end against scripted doubles; `advance` registered in `factory.ts` | main agent |
| 2 | loop + smoke: `runSensor` → `decideFromEnvelope` on the real repo envelope | 0 | `decision: sense sense-initial` — argv mapped verbatim, never mutated | main agent |
| 3 | `bun test test/conductor-sensor.test.mjs` | 0 | spawn failure / non-JSON / invalid / degraded → `sensor-degraded` | main agent |
| 4 | `bun test test/conductor-decide.test.mjs` + loop AC4 | 0 | sense → re-sense → STOPPED; stop codes surfaced | main agent |
| 5 | `bun test test/conductor-urgency.test.mjs` | 0 | 5 rows table-driven; no model call | main agent |
| 6 | `bun test test/conductor-invoke.test.mjs` | 0 | attended none / unattended L 2 / security 3 | main agent |
| 7 | `bun test test/conductor-closeout.test.mjs` | 0 | clean iff porcelain empty ∧ ahead 0; 3 partials park | main agent |
| 8 | `bun test test/conductor-loop.test.mjs` | 0 | COMPLETE / BLOCKED / STOPPED / CONTINUE banners + cap | main agent |
| 9 | loop AC9 tests | 0 | merge-ready → stop-needs-input naming /audit-pr; no merge sent | main agent |
| 10 | loop AC10 test | 0 | `YYYY-MM-DD HH:MM — kind/code — cmd — k/cap` | main agent |
| 11 | `bun test test/conductor-snapshot.test.mjs` | 0 | mapping table + purity | main agent |
| 12 | full gates: root `node --test scripts/*.test.mjs`; schema `bun run test`; pi `bun run test` + `test:node`; `npm pack --dry-run` | 0 / 0 / 0 / 0 | 554 · 717 · 339 (bun) · 339 (node) all pass; pack 216.5 kB / 142 files | main agent |
| — | smoke: real sensor spawn vs this repo + decide | 0 | `ok: true state=NEEDS_INPUT next=/workflow-status` | main agent |

## Progress log

- 2026-09-23 10:20 — unit doc created from template, triage run (steps skipped: none after tests declared) → 5e58da47 — next: research
- 2026-09-23 10:40 — research step: ship-roadmap archaeology from git history (44267b1d~1) + issue #233 + pi/schema/sensor integration map; frozen design: native `advance` command, envelope→snapshot mapping, deterministic urgency judge (fail-safe FINISH_FIRST), unattended adversarial floor, closeout gate, banners ADVANCE: COMPLETE/BLOCKED/STOPPED → evidence (subagent reports, this session) — next: implement P1–P8
- 2026-09-23 10:45 — design+plan frozen in SPEC (12 ACs, P1–P8 tests-first); schema 4.5.0 pinned; tests-first agent + docs agent launched (nan/qwen3.6 + nan/mimo-v2.5) → commit — next: implementation

- 2026-09-23 10:45 — design+plan frozen in SPEC (12 ACs, P1–P8 tests-first); schema 4.5.0 pinned; tests-first agent + docs agent launched (nan/qwen3.6 + nan/mimo-v2.5) → 2791f4ed — next: implementation
- 2026-09-23 11:30 — tests-first: 84 tests / 8 files (AC1–AC12), red on absent module → evidence (agent report) — next: implement
- 2026-09-23 13:30 — implement: src/conductor/ (9 modules, 1081 LOC) + config wiring + factory registration; defects found in review and fixed (urgency judge unwired in loop, invocation rebuilt discarding adversarial floor, sensor cwd bug, hardcoded retired-skill command list, log separator, bare-JSON parse contract, sense bound) → working tree — next: gates
- 2026-09-23 13:45 — tests repaired under path-protection justification (sensor fixture SyntaxError, loop assertion TypeError, alias-coverage registration set) + real-env smoke fix (validateEnvelope over strict fenced parser: sensor emits documented next.reason/candidate_count) → 339/339 bun + node — next: release
- 2026-09-23 14:00 — release: pi 0.15.0 bump, CHANGELOG row, docs banners (ADVANCE: CONTINUE), evidence rows → commit — next: diff guard + PR

## Next

Diff guard → exception record (large unit) → push → PR (Closes #233) → roadmap row 62 → owner review.

## References

- Issue [#233](https://github.com/gtrabanco/agentic-workflow/issues/233) — `Closes #233` (the pi-agentic-workflow command route; the AWL-runner route stays open as future work for the public runner).
- Roadmap row 62, `docs/features/ROADMAP.md`.
- Feature 61 (PR [#251](https://github.com/gtrabanco/agentic-workflow/pull/251)) — retired `ship-roadmap`; landed the lane, sensor priority queue, continuation contract.
- Feature 20 — merge-authority rules the conductor inherits unchanged.
- `docs/workflow/LANE_FLOW.md` §Programmatic contract — envelope + continuation constraints.
- `docs/workflow/ORCHESTRATION.md` — canonical urgency pause-vs-finish rubric (feature 15).
- Follow-up publish PR [#253](https://github.com/gtrabanco/agentic-workflow/pull/253) — pi 0.14.0 dependency flip; lands before this unit's release step.

