# 23 — workflow-skill-capability-profiles

> Feature specification. This is the feature document read at the start of the
> workflow. The Product half is complete; `plan-feature-scaffold` owns the
> Engineering half.

## Goal

Extend the public workflow-skill inventory with additive, machine-readable
capability metadata so headless consumers can select context, model class, and
safety checks without opening a model session, inspecting skill prose, or
hard-coding skill names.

## Branch

`feat/23-workflow-skill-capability-profiles`

## Size

`S` — one package-scoped delivery unit covering the public TypeScript contract,
the built-in metadata table, table-driven tests, distribution output, and the
existing bilingual package reference.

## Dependencies

- Hard dependencies: none. The existing `WorkflowSkillProfile` inventory from
  merged PR #135 is present on `main`.
- Soft dependencies: none.

---

## Product half

### Context

The schema package now exports `WORKFLOW_SKILL_PROFILES`, but each entry declares
only its output contract and native fallback. A headless consumer therefore
cannot determine a skill's maximum effects, reasoning class, advisory context,
or evidence requirements without reading prose or maintaining a private routing
table. Issue #136 defines a provider-agnostic, closed-vocabulary capability
profile that keeps repository evidence authoritative and makes missing metadata
fail closed.

### Business goals

- Reduce avoidable model sessions and private routing-table maintenance for
  headless workflow consumers.
- Prevent accidental privilege, context, or evidence expansion by publishing
  reviewed maximum capabilities with each built-in skill profile.
- Keep the schema package portable: declarative metadata only, with no provider,
  runtime, filesystem, Git, forge, or network adapter.

### Product-surface considerations

- i18n: the package reference remains synchronized in English and Spanish.
- Accessibility: n/a, because the feature exposes no user interface.
- SEO: n/a, because the feature adds no public web route or indexed content.
- Pricing: n/a, because it adds no commercial plan, metering, or provider cost.
- UI design reference: n/a, because the only surface is package metadata.

### Scope

#### In scope

- **S1:** Export readonly values and TypeScript unions for the exact closed
  vocabularies defined by issue #136.
- **S2:** Add an optional `capabilities` object to `WorkflowSkillProfile` and
  populate it for every built-in entry with the exact corrected profile table.
- **S3:** Preserve `output` and `nativeFallback`, existing parser/rendering
  behavior, and compatibility for externally constructed profiles that omit
  `capabilities`.
- **S4:** Require capability-aware consumers to fail closed when metadata is
  absent and forbid runtime profile widening.
- **S5:** Add table-driven validation for exact inventory coverage, duplicates,
  and unknown vocabulary values.
- **S6:** Publish the change as a package minor release and document the
  evidence-authority boundary in synchronized English and Spanish references.

#### Out of scope / non-goals

- No provider-specific model, pricing, memory product, or routing adapter.
- No agent runtime, orchestrator implementation, or automatic tool/skill
  invocation.
- No skill-prose edits solely to duplicate package metadata.
- No filesystem, Git, forge, or network I/O in the schema package.
- No undeclared metadata fields or additional vocabulary values.
- No runtime API for consumers to create, mutate, delete, or widen built-in
  profiles.
- No project-wide `docs/CAPABILITIES.md` addition; this SPEC records the derived
  package inventory needed for this feature only.

### Capability closure

The repository has no project-level `docs/CAPABILITIES.md`. For this declarative
package feature, the derived inventory is: public package API; headless-driver
routing; existing machine contracts; bilingual package documentation; package
distribution. The applicable roles are `headless consumer` and `package
maintainer`.

**1. Entity closure — workflow-skill capability profile**

- [x] Create — n/a: built-in profiles are package-authored static metadata;
  consumers receive no runtime creation surface.
- [x] Read/list — UI: n/a, no UI surface · API: package-root
  `WORKFLOW_SKILL_PROFILES`, exported readonly vocabularies, and TypeScript unions
  · test: public-entry import plus exact-table coverage.
- [x] Update — UI: n/a, no UI surface · API: n/a at runtime; package maintainers
  change source only through a reviewed package change · test: exact-table and
  vocabulary validation.
- [x] Delete — n/a: consumers cannot remove built-in entries; exact inventory
  coverage rejects omissions.
- [x] State transitions — n/a: declarative immutable metadata has no runtime
  lifecycle or transition state.

**Capabilities and role matrix**

- [x] Inspect a built-in profile's capability metadata — visible entry point:
  package-root exports · `headless consumer`: allowed · `package maintainer`:
  allowed.
- [x] Author a reviewed built-in profile change — visible entry point: package
  source plus pull-request review · `headless consumer`: denied · `package
  maintainer`: allowed.
- [x] Widen a profile at runtime — visible entry point: n/a, no runtime mutation
  surface · `headless consumer`: denied · `package maintainer`: denied; changes
  require a new reviewed package version.
- [x] Assign/revoke/view introduced roles or permissions — n/a: the feature
  introduces descriptive routing roles, not runtime ACL roles or permissions.

**2. Integration closure — derived inventory**

- [x] Public package API — root exports expose the readonly vocabularies, unions,
  optional capability shape, and populated built-in profiles without changing
  existing export meanings · test: package public-entry import test.
- [x] Headless-driver routing — consumers can inspect maximum effects, reasoning,
  context sources, and required evidence; consumers requiring this metadata fail
  closed when it is absent · test: absent-capabilities fail-closed fixture.
- [x] Existing machine contracts — `renderOutputInstruction()`, `parseTurn()`,
  Envelope v2, SkillOutcome v1, and WorkflowSnapshot v1 remain behaviorally
  unchanged · test: existing schema-package suite plus regression assertions.
- [x] Bilingual package documentation — English and Spanish references explain
  repository evidence as authoritative and semantic/episodic context as advisory
  · test: read-verified synchronized sections.
- [x] Package distribution — compiled JavaScript and declarations expose the new
  metadata through the existing package entry point in a minor release · test:
  build plus package dry-run contents check.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Every built-in skill has capability metadata | in-scope | S2; AC2 |
| 2 | Existing external profile construction remains compatible | in-scope | S3; AC3 |
| 3 | Missing capability metadata is never guessed from a skill name | in-scope | S4; AC4 |
| 4 | Consumers cannot widen maximum effects at runtime | in-scope | S4; AC5 |
| 5 | Existing machine-contract behavior remains unchanged | in-scope | S3; AC6 |
| 6 | Documentation stays synchronized in English and Spanish | in-scope | S6; AC7 |
| 7 | Metadata selects concrete providers or model names | out-of-scope | Provider-specific non-goal |
| 8 | The package invokes tools, skills, or external I/O | out-of-scope | Runtime and I/O non-goals |
| 9 | The feature seeds a project-wide capability inventory | out-of-scope | `docs/CAPABILITIES.md` non-goal |

### Acceptance criteria

- [ ] **AC1 — read-verified:** Export readonly values and TypeScript unions for
  exactly: roles `sensor | planner | executor | reviewer | auditor | publisher`;
  effects `repository-read | repository-write | git-write | forge-read |
  forge-write`; reasoning `mechanical | semantic | critical`; context sources
  `repository | semantic-context | episodic-memory | execution-state`; required
  evidence `workflow-snapshot | current-candidate | verification |
  independent-review | audit | issue-state | pull-request-state`.
- [ ] **AC2 — read-verified:** Every built-in profile matches this exact table;
  effects are maximum effects permitted by the normal skill contract.

  | Skill | Role | Reasoning | Effects | Context sources | Required evidence |
  |---|---|---|---|---|---|
  | `init-workspace` | executor | semantic | repository-read, repository-write, git-write, forge-read, forge-write | repository, semantic-context | none |
  | `workflow-status` | sensor | mechanical | repository-read, forge-read | repository, execution-state | workflow-snapshot |
  | `discover-repository-state` | sensor | semantic | repository-read, repository-write, git-write | repository, semantic-context | none |
  | `resolve-repository-state` | planner | critical | repository-read, repository-write | repository, semantic-context, execution-state | workflow-snapshot |
  | `design-feature` | planner | critical | repository-read, repository-write, forge-read | repository, semantic-context, episodic-memory, execution-state | workflow-snapshot |
  | `plan-feature` | planner | critical | repository-read, repository-write, forge-read | repository, semantic-context, episodic-memory, execution-state | workflow-snapshot |
  | `plan-fix` | planner | critical | repository-read, repository-write, git-write, forge-read | repository, semantic-context, episodic-memory, execution-state | workflow-snapshot, issue-state |
  | `triage-issue` | planner | critical | repository-read, repository-write, forge-read, forge-write | repository, semantic-context, episodic-memory, execution-state | workflow-snapshot, issue-state |
  | `execute-phase` | executor | semantic | repository-read, repository-write, git-write, forge-read, forge-write | repository, semantic-context, episodic-memory, execution-state | workflow-snapshot, current-candidate |
  | `review-change` | reviewer | critical | repository-read, repository-write, forge-read, forge-write | repository, semantic-context, execution-state | current-candidate, verification |
  | `loop-review-fold` | reviewer | critical | repository-read, repository-write, git-write, forge-read, forge-write | repository, semantic-context, episodic-memory, execution-state | current-candidate, independent-review |
  | `audit-pr` | auditor | critical | repository-read, repository-write, forge-read, forge-write | repository, semantic-context, execution-state | current-candidate, verification, independent-review, pull-request-state |

- [ ] **AC3 — command-verified:** `capabilities` is optional on the public
  `WorkflowSkillProfile` TypeScript boundary, every shipped built-in profile
  populates it, and the pre-existing `skill`, `output`, and `nativeFallback`
  fields retain their types and source-compatible writability.
- [ ] **AC4 — read-verified:** A capability-aware consumer presented with a
  profile lacking `capabilities` must fail closed instead of inferring values
  from the skill name.
- [ ] **AC5 — read-verified:** Runtime widening is unsupported; any later
  vocabulary or built-in profile change requires a reviewed package change and
  new package version.
- [ ] **AC6 — command-verified:** `cd packages/agentic-workflow-schema && npm
  test` exits 0, covers exact inventory uniqueness and rejects unknown role,
  effect, reasoning, context-source, and evidence values, while existing
  `renderOutputInstruction()`, `parseTurn()`, Envelope v2, SkillOutcome v1, and
  WorkflowSnapshot v1 regressions remain green.
- [ ] **AC7 — read-verified:** `packages/agentic-workflow-schema/README.md` and
  `README.es.md` contain synchronized capability-profile guidance stating that
  repository evidence is authoritative and semantic/episodic context is
  advisory.
- [ ] **AC8 — command-verified:** the package version receives a minor bump and
  `cd packages/agentic-workflow-schema && npm pack --dry-run` includes compiled
  JavaScript, declarations, and both package references through the existing
  package entry point.
- [ ] **AC9 — read-verified:** No runtime create, update, delete, state-transition,
  ACL-assignment, or profile-widening surface is introduced.
- [ ] **AC10 — read-verified:** No provider/model mapping, agent runtime, automatic
  invocation, skill-prose mirror, undeclared field, or external I/O is added.

### Tooling

n/a: no specialized external skill or MCP is required for implementation; the
existing TypeScript compiler and schema-package test scripts are authoritative.

### Product decisions

- **D1 — Correct maximum-effects evidence before drafting.** The project lead
  accepted adding `git-write` to `init-workspace` and
  `discover-repository-state`, plus `repository-write` to `audit-pr`, based on
  their current skill contracts. Issue #136 records the dated evidence.
- **D2 — Optional boundary, complete built-ins.** `capabilities` remains optional
  and the three legacy profile fields retain source-compatible writability, but
  every built-in profile is populated, deeply readonly, and a capability-aware
  consumer fails closed on absence.
- **D3 — Size `S`.** The change is one package-scoped delivery unit and should
  fit one implementation commit plus hardening/PR closeout.
- **D4 — Derived inventory only.** The package surfaces listed under Capability
  closure are sufficient for this feature; seeding project-wide
  `docs/CAPABILITIES.md` would expand issue scope.
- **D5 — Repository preflight.** `Preflight: Stage 1 — NRS n/a · arch: deferred`.
  There is no active project NRS and no project architectural-invariants
  document outside the exportable template; final Stage 2 remains owned by the
  complete engineering plan.
- **D6 — Traceability.** Origin: issue #136. The implementation PR must include
  `Closes #136`.

### Deferred decisions

none

## Amendments

| Date | Approved by | Change | Traceability |
|---|---|---|---|
| 2026-08-22 | user (`Revisa si los findings AC* son aceptables... planifica los fixes en esta misma rama`) | Reopen PR #140 on the same branch after acceptance review proved that the minor release made the three pre-existing `WorkflowSkillProfile` fields readonly and that AC2, AC7, and AC8 used non-deterministic validators. Strengthen AC3 to preserve source-compatible writability, replace the affected validators without loosening their outcomes, and append corrective phases plus a fresh final close-out. | Issue #136 · PR #140 · F3 + F4 |

### Spec-lint (mechanical — product boxes)

- [x] No template placeholders remain in the Product half.
- [x] Out of scope / non-goals contains concrete bullets.
- [x] Every entity, capability, role, and state row is filled or has an explicit
  `n/a` reason.
- [x] Integration closure covers every subsystem in the recorded derived
  inventory.
- [x] Every capability lists both roles as explicitly allowed or denied.
- [x] Expectation sweep contains nine resolved rows with pointers.
- [x] Every in-scope bullet maps to at least one acceptance criterion.
- [x] Every acceptance criterion is command-verified or read-verified.
- [x] Deferred decisions exists and reads `none`.

## Design status

`designed`

---

## Engineering half

Written by `plan-feature-scaffold` after this Product half.

### Technical goals

- Export readonly vocabulary arrays and TypeScript unions for exactly the closed
  vocabularies defined by issue #136 (roles, effects, reasoning, context sources,
  required evidence).
- Add an optional `capabilities` object to `WorkflowSkillProfile` and populate it
  for every built-in entry with the exact corrected profile table.
- Preserve the types and source-compatible writability of `skill`, `output`, and
  `nativeFallback`, existing parser/rendering behavior, and compatibility for
  externally constructed profiles that omit `capabilities`.
- Require capability-aware consumers to fail closed when metadata is absent and
  forbid runtime profile widening (immutable exports only).

### Architecture impact

The schema package `@gtrabanco/agentic-workflow-schema` v3.0.0 gains additive
metadata; no existing export meaning changes, no breaking changes.

Preflight: NRS `consumed` · invariant classification: `n/a` (no project
invariants declared; `docs/ARCHITECTURAL_INVARIANTS.md` is empty). Every
applicable rule from NRS accepted decisions (AD-002 bilingual, AD-004 one-PR-per-unit,
AD-007 schema package strict contracts) is preserved.

- **Schema/package boundary**: `WorkflowSkillProfile` gains optional `capabilities`;
  all other fields (`skill`, `output`, `nativeFallback`) retain their existing
  types and writability. A separate deeply readonly built-in boundary protects
  the shipped inventory without narrowing externally constructed profiles —
  preserves NRS AD-007 (package strict contracts) and NRS AD-002 (bilingual docs rule).
- **NRS status**: frozen → consumed. No contradictions detected.

### Design

- **Vocabulary arrays and unions**: Export five readonly const arrays and derive
  TypeScript union types for roles (`sensor | planner | executor | reviewer | auditor | publisher`),
  effects (`repository-read | repository-write | git-write | forge-read | forge-write`),
  reasoning (`mechanical | semantic | critical`), context sources (`repository | semantic-context | episodic-memory | execution-state`),
  and required evidence (`workflow-snapshot | current-candidate | verification | independent-review | audit | issue-state | pull-request-state`).
  The `as const` annotation on arrays guarantees compile-time immutability; derived
  unions (`typeof ARR[number]`) reject unknown values at compile time.
- **Capabilities interface**: Define `WorkflowSkillCapabilities` with fields
  `role`, `reasoning`, `effects` (readonly array), `contextSources` (readonly array),
  `requiredEvidence` (readonly array). Add optional `capabilities?: WorkflowSkillCapabilities`
  to the source-compatible `WorkflowSkillProfile`; use a separate deeply readonly
  boundary for shipped built-ins (D2 — optional boundary, complete built-ins).
- **Profile population**: Populate `capabilities` on all 12 built-in profiles from the
  exact AC2 table. Each profile gets the correct role, reasoning, effects, context
  sources, and required evidence per the specification.
- **Immutability**: Export the vocabulary arrays and profile table through the
  package's public entry point (`packages/agentic-workflow-schema/src/index.ts`)
  with `as const` and readonly array types. No runtime create/update/delete/widen
  surface is introduced (AC9).
- **Fail-closed**: The optional `capabilities` field means consumers must check
  for its presence before using it. A capability-aware consumer presented with a
  profile lacking `capabilities` must fail closed (AC4). No inference from skill
  name is permitted.
- **Table-driven tests**: New `packages/agentic-workflow-schema/test/capabilities.test.mjs`:
  exact-table coverage for all 12 built-ins, duplicate-skill rejection, unknown
  vocabulary rejection, missing-capability rejection, and Object.isFrozen assertions
  on exported arrays/objects (AC6, AC8).

### Decisions to confirm

- **D1 — Correct maximum-effects evidence before drafting.** The project lead
  accepted adding `git-write` to `init-workspace` and
  `discover-repository-state`, plus `repository-write` to `audit-pr`, based on
  their current skill contracts. Issue #136 records the dated evidence.
- **D2 — Optional boundary, complete built-ins.** `capabilities` remains optional
  and the three legacy profile fields retain source-compatible writability, but
  every built-in profile is populated, deeply readonly, and a capability-aware
  consumer fails closed on absence.
- **D3 — Size `S`.** The change is one package-scoped delivery unit and should
  fit one implementation commit plus hardening/PR closeout.
- **D4 — Derived inventory only.** The package surfaces listed under Capability
  closure are sufficient for this feature; seeding project-wide
  `docs/CAPABILITIES.md` would expand issue scope.
- **D5 — Repository preflight.** `Preflight: NRS consumed · invariant classification: n/a (no project invariants declared; docs/ARCHITECTURAL_INVARIANTS.md is empty)`. Every applicable rule from NRS accepted decisions (AD-002 bilingual, AD-004 one-PR-per-unit, AD-007 schema package strict contracts) is preserved.
- **D6 — Traceability.** Origin: issue #136. The implementation PR must include
  `Closes #136`.

### Testing requirements

- **Table-driven tests**: `packages/agentic-workflow-schema/test/capabilities.test.mjs`
  — exact-table coverage for all 12 built-ins, duplicate-skill rejection, unknown
  vocabulary rejection (each of the 5 vocabularies), missing-capability rejection
  (fail-closed consumer), and `Object.isFrozen` assertions on exported arrays/objects.
- **Regression tests**: existing `npm test` suite remains green —
  `renderOutputInstruction()`, `parseTurn()`, Envelope v2, SkillOutcome v1, and
  WorkflowSnapshot v1 regressions.
- **Type compatibility fixture**: `test/fixtures/workflow-skill-profile-compat.ts`
  compiles omission of `capabilities` and assignments to all three legacy fields,
  while the exported built-in inventory remains deeply readonly — AC3.
- **Release-contract tests**: language-aware EN/ES capability semantics and the
  four independently required `npm pack --dry-run --json` artifacts — AC7, AC8.

### Dev scenarios

n/a — no runtime behavior; the schema package adds static metadata and TypeScript
unions only. No dev-scenario harness applicable.

### Phases

### P1 — Export capability vocabularies, types, and populate built-in profiles

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 and coverage includes the new `capabilities.test.mjs` table-driven suite.

- [ ] Define and export readonly `as const` arrays and derived TypeScript unions for
  roles, effects, reasoning, context sources, and required evidence (AC1).
- [ ] Define `WorkflowSkillCapabilities` interface with role, reasoning, effects,
  contextSources, and requiredEvidence fields; add optional `capabilities?:
  WorkflowSkillCapabilities` to `WorkflowSkillProfile` (AC2, AC3, D2).
- [ ] Populate `capabilities` on all 12 built-in profiles from the exact AC2 table
  (`init-workspace`, `workflow-status`, `discover-repository-state`,
  `resolve-repository-state`, `design-feature`, `plan-feature`, `plan-fix`,
  `triage-issue`, `execute-phase`, `review-change`, `loop-review-fold`,
  `audit-pr`) with the correct role, reasoning, effects, context sources,
  and required evidence per the specification.
- [ ] Add table-driven `packages/agentic-workflow-schema/test/capabilities.test.mjs`:
  exact-table coverage for all 12 built-ins, duplicate-skill rejection,
  unknown vocabulary rejection for each of the 5 vocabularies, and
  missing-capability rejection (fail-closed consumer fixture).
- [ ] Add `Object.isFrozen` assertions on exported vocabulary arrays and profile
  entries (forbid runtime widening — AC5, AC9).
- [ ] Verify existing regression tests remain green —
  `renderOutputInstruction()`, `parseTurn()`, Envelope v2, SkillOutcome v1,
  and WorkflowSnapshot v1.
- [ ] Add synchronized capability-profile guidance to
  `packages/agentic-workflow-schema/README.md` and `README.es.md` (evidence
  authoritative, semantic/episodic context advisory — AC7).
- [ ] Bump `packages/agentic-workflow-schema/package.json` version
  `3.0.0 → 3.1.0` (minor release — AC8).

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate — `cd packages/agentic-workflow-schema && npm test` → exit 0 (45/45); `node scripts/check-skill-context.mjs` → PASS (35 skills); `npx skills add . --list` → exit 0; `npm pack --dry-run` lists `dist/index.js`, `dist/index.d.ts`, `README.md`, `README.es.md` (AC8)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the roadmap row status to `done` and commit the flip — commit `e0f99b3`
- [x] `git push` — branch pushed, PR branch remote-current
- [x] Open the PR (`gh pr create --body-file .pr-feature-23-body.md`) — [PR #140](https://github.com/gtrabanco/agentic-workflow/pull/140), body includes `Closes #136`
- [x] Update the roadmap row to `done · [#140](https://github.com/gtrabanco/agentic-workflow/pull/140)`
- [x] Commit `docs: link PR #140` and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P1:schema:8:Export capability vocabularies, types, and populate built-in profiles

### P3 — Restore public profile compatibility

Layer: schema. Preserve the new immutable built-in capability inventory without
narrowing the pre-existing public `WorkflowSkillProfile` write contract.

- [ ] Add `test/fixtures/workflow-skill-profile-compat.ts` and a test-runner assertion
  that first reproduces TS2540 when assigning `skill`, `output`, and
  `nativeFallback` on the current declaration while still allowing omission of
  `capabilities` (F3, AC3).
- [ ] Restore source-compatible writability for the three legacy
  `WorkflowSkillProfile` fields; keep the new `capabilities` boundary optional.
- [ ] Introduce a dedicated deeply readonly type boundary for shipped built-in
  profiles so `WORKFLOW_SKILL_PROFILES` stays immutable at compile time and
  runtime without narrowing externally constructed profiles.
- [ ] Retarget the compile-time readonly invariant and internal profile lookup to
  the built-in boundary; confirm the guard emits no JavaScript or declaration
  artifacts.
- [ ] Re-run the schema-package regression suite, including exact AC2 inventory,
  fail-closed behavior, runtime freezing, and the new compatibility fixture.

Done-when: `cd packages/agentic-workflow-schema && npm test` exits 0 and the
compatibility fixture compiles assignments to all three legacy fields while
`Object.isFrozen(WORKFLOW_SKILL_PROFILES)` remains true.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P3:schema:5:Restore public profile compatibility

### P4 — Harden release evidence

Layer: hardening. Make the frozen AC2, AC7, and AC8 validators deterministic and
prove that each named artifact or bilingual semantic is independently present.

- [ ] Add `test/release-contract.test.mjs` with language-aware EN/ES capability
  semantics assertions and exact required-file assertions over
  `npm pack --dry-run --json` (F4, AC7, AC8).
- [ ] Prove the AC2 exact-table test, rather than a source-word count, is the
  sole 12-profile inventory validator and fails on a missing, duplicate, or
  mismatched built-in.
- [ ] Run the full schema package test suite and inspect the JSON pack manifest
  for the four independently required public artifacts.

Done-when: `cd packages/agentic-workflow-schema && npm test` exits 0 and the
release-contract test proves both language-specific semantics plus all four
packed files independently.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P4:hardening:3:Harden release evidence

### P5 — Hardening & PR

Layer: close-out. Re-establish a clean exact-HEAD review and audit receipt after
P3 and P4 invalidate the completed P2 close-out.

- [ ] Run `cd packages/agentic-workflow-schema && npm test` and record exit 0.
- [ ] Run `node scripts/check-skill-context.mjs` and record PASS.
- [ ] Run `npx skills add . --list` and record exit 0.
- [ ] Run `cd packages/agentic-workflow-schema && npm pack --dry-run --json` and
  confirm the release-contract assertions cover every required artifact.
- [ ] Run `git status --porcelain -- docs/` and `git status --porcelain`; require
  a clean committed tree before review.
- [ ] Set roadmap row 23 to `done · [#140]`, commit with Conventional Commits,
  and push the branch so PR #140 is remote-current.
- [ ] Run a fresh `/review-change` at the pushed HEAD and require its exact-SHA
  `review-change:pass` PR receipt before handing off to `/audit-pr`.

Done-when: every project gate is green, PR #140 points at the reviewed HEAD, and
the newest PR comment carries the exact-HEAD `review-change:pass` marker.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P5:close-out:7:Hardening & PR

### Deploy & rollback

The package ships as a minor release (v3.0.0 → v3.1.0). No migration, no feature
flag, no config change. Rollback: revert the PR to restore prior package version
v3.0.0.

### Open questions / risks

- **Risk**: the capability table in AC2 reflects current skill contracts;
  if a skill's actual permissions change later, the table needs updating.
  Accepted: D5 — the package enforces fail-closed on absence so any
  consumer relying on stale metadata fails safely (not guessing from skill name).
  Issue #136 records the dated evidence for the current table.
- **Risk**: `as const` arrays provide compile-time immutability but not
  runtime freezing by default. Mitigated: `Object.isFrozen` assertions in tests
  ensure frozen arrays at runtime (AC9).

### Deliverables

- Updated `packages/agentic-workflow-schema/src/index.ts` — vocabulary arrays,
  TypeScript unions, `WorkflowSkillCapabilities` interface, optional
  `capabilities` on `WorkflowSkillProfile`, populated profiles, immutable
  exports.
- New `packages/agentic-workflow-schema/test/capabilities.test.mjs` — table-driven
  tests for exact coverage, duplicate rejection, unknown value rejection,
  fail-closed consumer, and `Object.isFrozen`.
- Planned `packages/agentic-workflow-schema/test/fixtures/workflow-skill-profile-compat.ts`
  plus `test/release-contract.test.mjs` — legacy public-type compatibility,
  language-aware docs semantics, and exact packed-file coverage.
- Updated `packages/agentic-workflow-schema/README.md` and `README.es.md` —
  synchronized capability-profile guidance.
- Updated `packages/agentic-workflow-schema/package.json` — version bump
  3.0.0 → 3.1.0 (minor).
- Updated `docs/features/23-workflow-skill-capability-profiles/SPEC.md` —
  engineering half filled.
- Updated `docs/features/23-workflow-skill-capability-profiles/ACCEPTANCE.md` —
  frozen acceptance manifest.

### Post-merge next feature

None specified — the roadmap's next `defined` entry (if any) will be evaluated.
Feature 23's capability profiles are additive metadata for headless consumers;
the schema package is now instrumented for capability-aware routing.
