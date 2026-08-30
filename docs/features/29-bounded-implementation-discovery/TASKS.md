# TASKS — 29-bounded-implementation-discovery

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit.

## P1 — Define bounded implementation discovery

Layer: docs · Done-when: `node --test
scripts/implementation-discovery.test.mjs` -> exit 0 for discovery-contract
fixtures.

- [ ] Write red-first fixtures for all seven questions, every fixed map field, complete ordered obligation coverage, and the four closed decisions.
- [ ] Add one internal non-user-invocable implementation-discovery skill/reference with exact inputs, read-only boundary, compact output, stop conditions, and `SkillOutcome v1` handoff.
- [ ] Define inline eligibility and fresh-mapper triggers from evidence completeness, uncertainty, topology, public/persistence/security/recovery/compatibility risk, prior attempts, and authoring bias.
- [ ] Delete/prohibit every file/search/read-count proxy and add one-file, many-file same-layer, and cross-layer route fixtures proving equivalent question closure.
- [ ] Define path:line/symbol/test evidence, affected-surface/reference discovery, helper/pattern/invariant reuse, expected-write-to-obligation mapping, and unknown ownership.
- [ ] Require the cheapest relevant observed read-only falsification probe before READY and encode failed/unavailable high-risk outcomes.
- [ ] Define repeated-search/read no-progress and context compaction: conclusions once, reread only for changed source, new question, insufficient evidence, or contradiction.
- [ ] Bump/changelog the new internal skill surface and keep its entry/reference within current progressive-context budgets.

## P2 — Gate the first phase write

Layer: docs · Done-when: `node --test
scripts/implementation-discovery.test.mjs` -> exit 0 for ordering, identity,
continuity, drift, consumption, and recovery fixtures.

- [ ] Insert discovery in `execute-phase` after dependency/status/acceptance/phase/feature-28 receipt checks and before branch creation, planning commit, or implementation edit.
- [ ] Define source identity as exact HEAD, clean tracked/untracked source proof, allowed current-unit planning paths, cited-content manifest digest, receipt/phase bindings, and opaque mapping revision.
- [ ] Add deterministic continuity verification for unchanged HEAD or one direct descendant whose entire diff is the exact reviewed planning allowlist; reject every other setup mutation.
- [ ] Make READY require every field/question/phase obligation, no material contradiction/unknown, observed probe, and expected writes wholly inside frozen phase authority.
- [ ] Consume READY at the first implementation write; a newly required path, changed evidence, or contradiction stops before expanding and remaps/routes.
- [ ] Add crash/re-entry semantics: resume before write only with current unconsumed proof; after any partial write always remap current source before continuing.
- [ ] Add drift/non-resurrection fixtures for SPEC/Plan/receipt/phase/HEAD/cited-content/setup changes, consumed map, interrupted write, revert/new causal attempt, and out-of-protocol limitation.
- [ ] Bump/changelog `execute-phase` and update its progressive preflight/recovery references without duplicating the discovery contract.

## P3 — Integrate upstream routing and compact handoff

Layer: docs · Done-when: `node --test
scripts/implementation-discovery.test.mjs scripts/bounded-delivery-loops.test.mjs
scripts/audit-pr-receipt.test.mjs` -> exit 0.

- [ ] Route `REPLAN` to `plan-feature`/`plan-fix` plus fresh `review-plan`; route `NEEDS-DESIGN` to human design/review/planning; route `BLOCKED` to one exact evidence prerequisite.
- [ ] Pass the fresh writer only frozen phase authority plus the compact map; prohibit raw exploration dumps and preserve every relevant claim, evidence pointer, contradiction, and unknown.
- [ ] Document semantic/symbol navigation and Engram as optional advisory locators with direct repository/Git/search/read/test fallback and identical evidence requirements.
- [ ] Integrate source-plan root causes with current review/fold routes: source-local findings stay local, Plan/Product defects return upstream, and mapping never replaces candidate review.
- [ ] Preserve current-unit obligation ownership and prohibit forge calls/automatic issues; unrelated defects remain subject to existing user-authorized opportunistic triage.
- [ ] Add legacy/manual routes using sequential fresh conversations and exact artifact/source bindings without claiming missing machine receipts or durable guarantees.
- [ ] Update workflow-status/ship-roadmap/orchestration handoffs only as needed to expose discovery READY/upstream/blocker outcomes without adding a competing durable state owner.
- [ ] Add end-to-end feature/fix fixtures for compact handoff, upstream round trip, legacy/manual path, no issue/file/schema side effects, and unchanged TDD/verification/review/audit authority.

## P4 — Harden and qualify implementation discovery

Layer: hardening · Done-when: every frozen validator passes and the exact
candidate has current independent review evidence with no unresolved fix-now
finding.

- [ ] Synchronize workflow/orchestration/feature/fix/migration/golden docs EN/ES, portable prompts, templates, skill catalog, and canary table without creating a public command/schema/map artifact.
- [ ] Bump/changelog every changed skill, rebuild canonical skills into feature 27's Pi package only through `bundle:skills`, bump distribution metadata as required, and pass Pi parity/package tests.
- [ ] Run implementation-discovery, full existing root, feature-28 schema/route, execution/review/fold/audit, context-budget, installability, and documentation regression gates.
- [ ] Execute and log the weakest-supported-executor golden fixture for localized READY, fresh mapper, REPLAN, NEEDS-DESIGN, BLOCKED, and no-automatic-issue behavior.
- [ ] Run a comparable manual feature/fix canary and record observed or `not yet measured` first-edit, replan, repair, rework, latency, token, and issue-spill values without a savings claim.
- [ ] Run independent context-clean `review-change` on the exact candidate, fold every fix-now finding through its root-cause route, and repeat only for changed evidence/new falsifiable question until PASS.
- [ ] Close progress/testing/known-issues truthfully, flip roadmap row 29 to `done`, and verify the frozen acceptance manifest at terminal HEAD.
- [ ] Commit/push the terminal candidate and open one PR against `main` with `Closes #149`, exact gates/canary boundary, no schema/map artifact claim, and no self-authorship line.
