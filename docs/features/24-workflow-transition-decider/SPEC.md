# 24 — workflow-transition-decider

> Feature specification. This is the feature document read at the start of the
> workflow. The Product half is complete; `plan-feature-scaffold` owns the
> Engineering half.

## Goal

Export a pure, deterministic `decideWorkflowAction(input)` function from the
schema package that combines a validated `WorkflowSnapshot v1`, the last
validated `SkillOutcome v1`, and the declared skill capability profiles
(feature 23 / issue #136) to decide whether a headless consumer may invoke the
next skill, must refresh with `workflow-status`, or must stop — removing
avoidable sensor model calls while keeping a closed safety fallback whenever
evidence is stale, unknown, or contradictory. Origin: issue
[#137](https://github.com/gtrabanco/agentic-workflow/issues/137).

## Branch

`feat/24-workflow-transition-decider`

## Size

`S` — one package-scoped delivery unit (public TypeScript contract, closed
transition/evidence tables, decision pipeline, three test layers, bilingual
package reference, minor release), mirroring feature 23's shape.

## Dependencies

- Hard: feature `23-workflow-skill-capability-profiles` (issue #136, PR #140 —
  **merged** 2026-08-22). Effect and evidence checks consume its public
  `WORKFLOW_SKILL_PROFILES` capability metadata.
- Soft: none. Issues #138 and #139 (receipt binding, staged verification
  contracts) will later *strengthen* the merge-rule evidence chain; they are
  independent future units, not prerequisites.

---

## Product half

### Context

The schema package already compiles trusted workflow facts (`WorkflowSnapshot
v1`), parses validated skill results (`SkillOutcome v1`), and publishes
capability profiles (`WORKFLOW_SKILL_PROFILES`, feature 23). But every headless
consumer invents its own transition rules: it either spends a model call on
`workflow-status` before every action or — worse — trusts a stale `next`
instruction. A shared deterministic decision function removes avoidable sensor
calls while retaining a closed fallback whenever evidence cannot be proven
mechanically. This feature reuses the existing snapshot compiler; it creates no
second repository-state model.

### Business goals

- Reduce avoidable `workflow-status` sensor model calls for headless drivers.
- Stop drivers from trusting stale `next` instructions: a transition that
  cannot be proven mechanically remains a sensor call.
- Keep the package portable: a pure function, no filesystem, Git, forge,
  provider, or agent invocation.

### Product-surface considerations

- i18n: the package reference is updated in English and Spanish in the same
  change (NRS AD-002).
- Accessibility: n/a, no user interface.
- SEO: n/a, no public web route.
- Pricing: n/a, no commercial surface.
- UI design reference: n/a, the only surface is package API.

### Scope

#### In scope

- **S1:** Export a pure `decideWorkflowAction(input)` function from the schema
  package.
- **S2:** Input = a validated `WorkflowSnapshot v1`; zero or one last validated
  `SkillOutcome v1`; the source revision at which that outcome was recorded; a
  closed policy containing allowed intents and whether forge-writing effects
  are authorized.
- **S3:** Return exactly one closed decision — `invoke` (proven transition),
  `sense` (fresh sensing required), or `stop` (advancement forbidden) — with
  the exact shapes in Design.
- **S4:** Export only these initial reason codes — sense:
  `sense-initial | sense-stale-revision | sense-missing-evidence |
  sense-unknown-state | sense-unlisted-transition`; stop: `stop-blocked |
  stop-needs-input | stop-failed | stop-contradiction | stop-policy-denied |
  stop-forbidden-transition`; invoke: `invoke-proven-transition`.
- **S5:** Encode the exact direct-invocation transition table (reproduced in
  Design). `status` is always returned as `sense`; `ask-human`, `stop`, and
  `none` are handled by the stop/sense rules rather than invoked as skills.
- **S6:** Apply the exact evidence rules after the table match (reproduced in
  Design), including the merge rule and capability-profile-driven effect and
  evidence checks — no hard-coded private skill lists in the checks.
- **S7:** Document mandatory sensor points: initial/recovered runs, stale
  source revision, relevant snapshot unknowns, contradictions, unrecognized
  targets, and any transition not present in the closed table.
- **S8:** Table-driven tests covering fresh, stale, blocked, needs-input,
  failed, contradictory, unknown, unauthorized-effect, missing-evidence,
  review, audit, and merge cases; property/fuzz tests proving malformed or
  unrecognized values cannot produce `invoke`; determinism tests.
- **S9:** One safe model-call-elision example and one mandatory
  `workflow-status` fallback example in the bilingual package reference; minor
  release `3.1.0` → `3.2.0`.

#### Out of scope / non-goals

- No filesystem, Git, forge, provider, or agent invocation (pure function).
- No replacement or removal of `workflow-status`.
- No inference from prose, transcript text, branch names, or undocumented
  status spellings.
- No automatic merge or bypass of review/audit gates.
- No changes to `WorkflowSnapshot v1`, `Envelope v2`, or `SkillOutcome v1`
  (types, validators, or the three shipped JSON schema files) — a separately
  justified versioned contract change would be required.
- No second repository-state model — the existing snapshot compiler is reused.
- No runtime, adapter, provider, storage layer, or driver implementation; the
  caller owns authorization, storage, and execution.
- No new JSON schema file: `decideWorkflowAction` is an in-process function
  API, not a model-facing wire contract.
- No `ORCHESTRATION.md`/`PORTABLE_PROMPT.md` driver-guide wiring — deferred
  (see Deferred decisions).
- No UI, network API, ACL, or persistence surface: n/a by design.

### Capability closure

The repository has no project-level `docs/CAPABILITIES.md`. Derived inventory
for this feature: public package API; headless-driver routing; existing
machine contracts; bilingual package documentation; package distribution.
Roles: `headless consumer` and `package maintainer`.

**1. Entity closure — the `decideWorkflowAction` decision API**

- [x] Create — n/a: a package-authored function; consumers receive no runtime
  creation surface.
- [x] Read/list — UI: n/a, no UI surface · API: package-root
  `decideWorkflowAction`, the decision types, the reason-code vocabularies, and
  the frozen `WORKFLOW_TRANSITION_TABLE` · test: public-entry import plus the
  exhaustiveness suite.
- [x] Update — n/a at runtime; package maintainers change the closed tables
  only through a reviewed package change and a new version · test: frozen
  exports and exhaustiveness suite.
- [x] Delete — n/a: consumers cannot remove the function or its tables.
- [x] State transitions — n/a: a pure function has no runtime lifecycle; every
  call is independent.

**Capabilities and role matrix**

- [x] Evaluate a decision (invoke the function) — visible entry point:
  package-root export · `headless consumer`: allowed · `package maintainer`:
  allowed.
- [x] Extend the closed transition/evidence tables (new skill rows, new
  intents) — visible entry point: package source plus pull-request review ·
  `headless consumer`: denied · `package maintainer`: allowed.
- [x] Widen effects or bypass the caller policy at runtime — visible entry
  point: n/a, no runtime mutation surface · `headless consumer`: denied ·
  `package maintainer`: denied.

**2. Integration closure — derived inventory**

- [x] Public package API — additive exports only; existing export meanings
  unchanged · test: full regression suite.
- [x] Headless-driver routing — effect and evidence checks read
  `WORKFLOW_SKILL_PROFILES` (feature 23); no private skill permission lists ·
  test: profile-driven check fixtures.
- [x] Existing machine contracts — `WorkflowSnapshot v1`, `SkillOutcome v1`,
  `Envelope v2`, and the three JSON schemas remain unchanged · test: existing
  suites plus a diff-clean check on the schema JSON files.
- [x] Bilingual package documentation — `README.md` and `README.es.md` gain the
  synchronized decision section with both examples and the sensor points ·
  test: grep anchors in both files.
- [x] Package distribution — minor release `3.2.0` through the existing entry
  point; artifact set unchanged · test: `npm pack --dry-run`.

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Every current `WorkflowIntent` is covered; a new intent without an explicit rule fails the tests | in-scope | S4/S5; AC1 |
| 2 | Malformed or unrecognized input can never produce `invoke` | in-scope | S8; AC3 |
| 3 | The same input always produces the same decision, with no I/O | in-scope | S8; AC4 |
| 4 | A stale, unknown, or contradictory state never yields a direct invocation — the sensor fallback is mandatory | in-scope | S7; AC2, AC5 |
| 5 | Consumers that do not call the function keep current behavior | in-scope | S9; AC6, AC7 |
| 6 | Documentation ships in English and Spanish in the same change | in-scope | S9; AC5 |
| 7 | The helper itself invokes skills, merges PRs, or performs I/O | out-of-scope | Pure-function non-goal |
| 8 | A second repository-state model or snapshot type is introduced | out-of-scope | Reuse-snapshot non-goal |
| 9 | Driver-guide (`ORCHESTRATION.md`) wiring lands in this unit | deferred | Deferred decisions row |

### Acceptance criteria

- [ ] **AC1 — command-verified:** `cd packages/agentic-workflow-schema && npm
  test` exits 0 and includes an exhaustiveness suite that derives coverage from
  `WORKFLOW_INTENTS` and `WORKFLOW_TRANSITION_TABLE`: every intent is a row
  key, an allowed next intent, or an explicit recommendation/merge rule, so
  adding an intent without a rule fails the suite.
- [ ] **AC2 — command-verified:** the table-driven suite covers the twelve
  scenario classes — fresh, stale, blocked, needs-input, failed,
  contradictory, unknown, unauthorized-effect, missing-evidence, review, audit,
  and merge — and `npm test` exits 0.
- [ ] **AC3 — command-verified:** the property/fuzz suite (seeded,
  deterministic) proves malformed or unrecognized values cannot produce
  `invoke` and never throw; `npm test` exits 0.
- [ ] **AC4 — command-verified + read-verified:** determinism is proven by
  deep-equality on repeated calls with identical input (command); the module
  adds no I/O imports and the function is value-in/value-out (read-verified).
- [ ] **AC5 — command-verified:** `grep` finds the decision section, the
  model-call-elision example, and the `workflow-status` fallback example in
  both `packages/agentic-workflow-schema/README.md` and `README.es.md`, with
  the mandatory sensor points listed.
- [ ] **AC6 — command-verified:** existing verification passes unchanged —
  `cd packages/agentic-workflow-schema && npm test` → exit 0; `node
  scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0.
- [ ] **AC7 — command-verified + read-verified:** the package version reads
  `3.2.0`, `npm pack --dry-run` lists the unchanged public artifact set, and no
  existing export changes meaning (read-verified against the v3.1.0 surface).
- [ ] **AC8 — read-verified:** `WorkflowSnapshot v1`, `SkillOutcome v1`, and
  `Envelope v2` are untouched — `git diff` clean on the three shipped
  `*.schema.json` files and the existing contract types — and the function
  consumes the existing snapshot compiler output.
- [ ] **AC9 — read-verified:** effect and evidence checks read
  `WORKFLOW_SKILL_PROFILES` capability metadata; `decideWorkflowAction`
  contains no private skill permission list (the exported
  `WORKFLOW_TRANSITION_TABLE` is the closed, versioned contract itself).

### Tooling

n/a: the existing TypeScript compiler and the schema-package test scripts are
authoritative; no external skill or MCP is required.

### Product decisions

- **D1 — Recommendation-intent mapping.** The last outcome's `next.intent` is
  the proposed transition. `status` maps to `sense` with
  `sense-unlisted-transition` (a direct `status` invocation is not present in
  the closed table — the sensor point fires); `ask-human` maps to `stop` /
  `ask-human` / `stop-needs-input` (a human answer is pending); `stop` maps to
  `stop` / `stop` / `stop-blocked` (advancement requires external action);
  `none` maps to `sense` / `sense-unlisted-transition` per the issue. These are
  the only mappings expressible within the closed reason-code set and are
  locked by tests.
- **D2 — Contradiction/resolver reconciliation.** A declared contradiction
  stops every proposal except `resolve-repository-state` itself when the
  closed table allows it after the last skill (`workflow-status` or
  `discover-repository-state`): the declared contradiction is the resolver's
  trigger evidence. This is the only reading under which the issue's
  `resolve-repository-state` table entries are reachable.
- **D3 — Per-intent target contracts.** Targets are validated against trusted
  identities where the snapshot carries them (active unit id, current named
  phase, contradiction fields) and against the identities the last outcome
  recorded (issues, PRs, dependency units); the exact arity/identity table is
  in Design. Free-form, additional, or mismatched targets return
  `stop-forbidden-transition`; a required identity that is missing returns
  `sense-missing-evidence`.
- **D4 — Public closed tables.** `WORKFLOW_TRANSITION_TABLE` and the
  reason-code vocabularies are exported (frozen) so the exhaustiveness suite —
  and any driver — can consume them; the tables are versioned with the package
  like the capability profiles.
- **D5 — Receipt attestation chain.** "Current review receipt", "current pass
  receipt", and "current passing audit" are attested by the last outcome's
  skill, status, and recommendation at the matching source revision (freshness
  binds the receipt to the current candidate). Deeper PR/verification binding
  arrives with issues #138/#139 and requires no change here.
- **D6 — Size `S`.** One package-scoped delivery unit in feature 23's shape;
  no split trigger applies (≤ ~5 phases, single-layer phases, zero open design
  decisions).
- **D7 — Traceability.** Origin: issue #137. The implementation PR must
  include `Closes #137`.

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Wire `decideWorkflowAction` into `docs/workflow/ORCHESTRATION.md` + `PORTABLE_PROMPT.md` driver guidance | Issue #137 scopes documentation to the package references; driver-guide integration is a separate docs unit with its own bilingual sync | The next driver-integration or docs-batch unit (e.g., after #138/#139 land) |

### Spec-lint (mechanical — product boxes)

- [x] No template placeholders remain in the Product half.
- [x] Out of scope / non-goals contains concrete bullets.
- [x] Every entity, capability, role, and state row is filled or has an
  explicit `n/a` reason.
- [x] Integration closure covers every subsystem in the recorded derived
  inventory.
- [x] Every capability lists both roles as explicitly allowed or denied.
- [x] Expectation sweep contains nine resolved rows with pointers.
- [x] Every in-scope bullet maps to at least one acceptance criterion.
- [x] Every acceptance criterion is command-verified or read-verified.
- [x] Deferred decisions exists with a decide-by trigger row.

## Design status

`designed`

---

## Engineering half

Written by `plan-feature-scaffold` after this Product half.

### Technical goals

- Add the decision contract surface (types, reason-code vocabularies, frozen
  transition table) as additive package exports with no existing meaning
  changed.
- Implement `decideWorkflowAction` as a pure, deterministic, fail-closed
  pipeline over `WorkflowSnapshot v1` + the last `SkillOutcome v1` + caller
  policy, consuming `WORKFLOW_SKILL_PROFILES` for effect and evidence checks.
- Prove the contract with three test layers: exhaustiveness, table-driven
  twelve-class coverage, and property/fuzz plus determinism.
- Ship the bilingual reference section and the `3.2.0` minor release.

### Architecture impact

The schema package `@gtrabanco/agentic-workflow-schema` v3.1.0 gains an
additive function API; no existing export, validator, or schema changes.

Preflight: NRS consumed · invariant classification: `n/a` (no project
invariants declared — `docs/architecture/ARCHITECTURAL_INVARIANTS.md` is absent
at HEAD; only the `template/` copy exists). Applicable NRS accepted decisions
are preserved: AD-002 (bilingual docs updated in the same change — README EN +
ES in one PR), AD-004 (one PR per unit against `main`), AD-007 (schema-package
strict contracts — `npm test` green, no contract drift, additive minor
release).

- **Schema/package boundary:** all additions live in
  `packages/agentic-workflow-schema/src/index.ts` (sibling-23 precedent,
  single-file package); the three shipped `*.schema.json` files and the
  existing contract types are untouched.
- **Layering:** pure function over already-exported types
  (`WorkflowSnapshot`, `SkillOutcome`, `WorkflowSkillProfile`,
  `WORKFLOW_INTENTS`) — no new layer, port, or adapter; no I/O.
- **NRS status:** frozen → consumed; no contradictions affecting this plan.

### Design

Pre-resolves every decision an implementer would otherwise guess. All tables
below are reproduced from issue #137 verbatim where marked.

#### Input and output shapes

```ts
export interface WorkflowDecisionPolicy {
  readonly allowedIntents: readonly WorkflowIntent[];
  readonly forgeWriteAuthorized: boolean;
}

export interface WorkflowDecisionInput {
  readonly snapshot: WorkflowSnapshot;              // validated WorkflowSnapshot v1
  readonly lastOutcome: SkillOutcome | null;        // 0..1 last validated SkillOutcome v1
  readonly lastOutcomeSourceRevision: string | null; // revision the outcome was recorded at
  readonly policy: WorkflowDecisionPolicy;          // closed caller policy
}

// invoke intent excludes the non-invocation intents by construction
export type WorkflowInvocableIntent = Exclude<WorkflowIntent, "status" | "ask-human" | "stop" | "none">;

export type WorkflowActionDecision =
  | { readonly kind: "invoke"; readonly intent: WorkflowInvocableIntent;
      readonly targets: readonly string[]; readonly reasonCode: "invoke-proven-transition";
      readonly evidenceRefs: readonly string[]; readonly detail: string }
  | { readonly kind: "sense"; readonly intent: "status"; readonly targets: readonly [];
      readonly reasonCode: WorkflowDecisionSenseReason;
      readonly evidenceRefs: readonly string[]; readonly detail: string }
  | { readonly kind: "stop"; readonly intent: "ask-human" | "stop";
      readonly targets: readonly string[];
      readonly reasonCode: WorkflowDecisionStopReason;
      readonly evidenceRefs: readonly string[]; readonly detail: string };
```

`detail` is a deterministic template string (no timestamps, randomness, or
locale). `evidenceRefs` collects the trusted references justifying the
decision: outcome `evidence_refs`, snapshot provenance `field@source:line`
entries, and contradiction fields where relevant.

#### Reason codes (verbatim, closed)

- sense: `sense-initial | sense-stale-revision | sense-missing-evidence |
  sense-unknown-state | sense-unlisted-transition`
- stop: `stop-blocked | stop-needs-input | stop-failed | stop-contradiction |
  stop-policy-denied | stop-forbidden-transition`
- invoke: `invoke-proven-transition`

Exported as two frozen arrays plus derived unions and the combined
`WorkflowDecisionReasonCode` union.

#### Direct-invocation transition table (verbatim from issue #137)

| Last validated skill | Direct next intents allowed after all evidence checks |
| --- | --- |
| none | none; return `sense-initial` |
| `init-workspace` | `discover-repository-state` |
| `workflow-status` | `init-workspace`, `discover-repository-state`, `resolve-repository-state`, `design-feature`, `plan-feature`, `plan-fix`, `triage-issue`, `execute-phase`, `review-change`, `loop-review-fold`, `audit-pr`; `merge` only under the merge rule below |
| `discover-repository-state` | `resolve-repository-state` when a declared contradiction exists; otherwise `plan-feature` only when repository state is frozen |
| `resolve-repository-state` | none; require a fresh `workflow-status` sensor after any resolution write |
| `design-feature` | `plan-feature` |
| `plan-feature` | `design-feature`, `plan-feature` for a named unmet dependency, or `execute-phase` |
| `plan-fix` | `execute-phase` |
| `triage-issue` | `plan-fix`, `plan-feature`, or `execute-phase` for the exact recorded issue/unit target |
| `execute-phase` | `execute-phase` for the next named phase, or `review-change` |
| `review-change` | `loop-review-fold` when current findings remain, or `audit-pr` only with a current pass receipt |
| `loop-review-fold` | `review-change` after a fold changed the candidate, or `audit-pr` only with a current pass receipt and no open findings |
| `audit-pr` | `triage-issue` for exact filed blocker issues, or `merge` only under the merge rule below |

`status` is always returned as `sense`; `ask-human`, `stop`, and `none` are
handled by the stop/sense rules rather than invoked as skills. A review or
audit gate cannot be skipped even when the previous outcome recommends a later
intent — the closed table enforces this mechanically (a later intent is simply
not in the row's allowed set).

The table ships as the frozen exported `WORKFLOW_TRANSITION_TABLE`, with row
conditions (`resolve requires declared contradiction`, `plan-feature after
discover requires frozen repository state`) expressed as data so the
exhaustiveness suite and drivers can consume them.

#### Evidence rules (verbatim from issue #137, applied after the table match)

- `design-feature`, `plan-feature`, `plan-fix`, `triage-issue`,
  `execute-phase`, `review-change`, `loop-review-fold`, and `audit-pr` require
  `repositoryState: frozen` and no contradiction;
- an invoked skill must have every `requiredEvidence` item declared by #136
  (read from `WORKFLOW_SKILL_PROFILES`);
- `execute-phase` additionally requires an active unit and a known named
  current phase;
- `loop-review-fold` requires a current review receipt with open findings;
  `audit-pr` requires a current review pass with no open findings;
- `merge` requires a current passing audit bound to the current candidate,
  current full verification, an open pull request whose head matches the
  candidate, green required checks, and explicit forge-write authorization in
  caller policy;
- a target must match the trusted active unit/phase/issue identities; free-form
  or additional targets return `stop-forbidden-transition`.

#### State and error behavior (verbatim from issue #137)

- With no last outcome, return `sense`.
- If the last outcome revision differs from `snapshot.sourceRevision`, return
  `sense`.
- `blocked`, `needs-input`, and `failed` outcomes return `stop` and preserve
  their canonical blockers/questions.
- Any snapshot contradiction returns `stop` with the contradiction evidence.
- An unknown that affects the requested transition returns `sense`; unrelated
  unknowns remain visible but do not become permission to proceed.
- `next.intent: none` returns `sense-unlisted-transition`; an unknown/additional
  target or denied effect returns `stop-forbidden-transition` /
  `stop-policy-denied`; missing current evidence returns
  `sense-missing-evidence`. It must never guess an alternative action.
- A review or audit gate cannot be skipped even when the previous outcome
  recommends a later intent.

#### Decision pipeline (normative order)

`D1` Defensive validation — re-validate the snapshot
(`validateWorkflowSnapshotV1`) and, when present, the outcome
(`validateSkillOutcomeV1`); malformed snapshot/outcome → `sense` /
`sense-missing-evidence` (detail lists validation errors; never throws).
Malformed policy (bad shape, unknown intents, non-boolean authorization) →
`stop` / `stop` / `stop-policy-denied`.

`D2` No last outcome → `sense` / `sense-initial`.

`D3` `lastOutcomeSourceRevision` ≠ `snapshot.sourceRevision` (or null while an
outcome is present) → `sense` / `sense-stale-revision`.

`D4` Outcome status routing — `blocked` → `stop` / `ask-human` /
`stop-blocked` (targets = blocker ids; detail preserves blockers); `needs-input`
→ `stop` / `ask-human` / `stop-needs-input` (targets = question ids; detail
preserves questions); `failed` → `stop` / `stop` / `stop-failed` (targets =
blocker ids; detail = summary). `completed` and `continue` proceed.

`D5` Contradiction present (`repositoryState === "contradicted"` or
`contradictions.length > 0`) — if the proposal is `resolve-repository-state`
AND the last skill row allows it (`workflow-status`, `discover-repository-state`)
AND the outcome status is `completed`/`continue`, continue to `D8` (the declared
contradiction is the resolver's trigger evidence, D2); otherwise → `stop` /
`stop` / `stop-contradiction` with the contradiction evidence.

`D6` Proposal routing (`outcome.next.intent`) — `none` → `sense` /
`sense-unlisted-transition`; `status` → `sense` / `sense-unlisted-transition`
(D1 mapping); `ask-human` → `stop` / `ask-human` / `stop-needs-input`;
`stop` → `stop` / `stop` / `stop-blocked`; `merge` → `D10`; a skill intent →
`D7`.

`D7` Closed-table match — the proposal must be allowed by the row for
`outcome.skill` (row absent → `sense-unlisted-transition`). Unmet row
conditions → the condition is missing evidence: a frozen-state condition
unmet because `repositoryState` is `unknown` → `sense-unknown-state`; unmet for
`missing`/`draft`/`needs-input` → `sense-missing-evidence`.

`D8` Authorization — look up the invoked skill's profile
(`WORKFLOW_SKILL_PROFILES`); profile or `capabilities` absent → `sense` /
`sense-missing-evidence` (fail closed). Intent ∉ `policy.allowedIntents` →
`stop` / `stop` / `stop-policy-denied`. `forge-write` ∈
`profile.capabilities.effects` while `policy.forgeWriteAuthorized` is false →
`stop` / `stop` / `stop-policy-denied`.

`D9` Evidence rules, first failure wins:
1. **Frozen-eight gate** — for the eight listed intents:
    `repositoryState === "frozen"` required; `unknown` → `sense-unknown-state`;
    `missing`/`draft`/`needs-input` → `sense-missing-evidence`.
2. **Affecting unknowns** — any `snapshot.unknowns` entry whose `field` touches
   the transition's evidence subjects (`repositoryState`, `unit`, `unit.status`,
   `phase`, `phase.current`) → `sense` / `sense-unknown-state`. Unrelated
   unknowns are surfaced in `detail`/`evidenceRefs` but never grant permission.
3. **requiredEvidence checkers** — every item in
   `profile.capabilities.requiredEvidence` must pass the checker table below;
   an item blocked only by an affecting unknown → `sense-unknown-state`;
   otherwise unprovable → `sense-missing-evidence`.
4. **execute-phase gate** — `snapshot.unit` non-null AND
   `snapshot.phase.current` non-null, else `sense-missing-evidence`
   (`sense-unknown-state` when an affecting unknown is present).
5. **Receipt rules** — `loop-review-fold` requires the last skill to be
   `review-change` (fresh, `completed`/`continue`) recommending it — the current
   review receipt with open findings; `audit-pr` requires the last skill to be
   `review-change` or `loop-review-fold` (fresh, `completed`/`continue`)
   recommending it — the current pass receipt with no open findings (the
   recommendation itself carries the verdict, D5 of the product decisions).
6. **Target contract** — the per-intent table below; violations as stated.
7. All checks pass → `{kind: "invoke", intent, targets: validated,
   reasonCode: "invoke-proven-transition", evidenceRefs, detail}`.

`D10` Merge rule (`merge` proposal) — the last skill must be `workflow-status`
or `audit-pr` (else `sense-unlisted-transition`). After `workflow-status` the
snapshot carries no pull-request/checks facts → `sense` /
`sense-missing-evidence`. After `audit-pr`: outcome `completed`/`continue`
(pass) recommending `merge`, fresh at the current revision (this binds the
passing audit, the full verification, the open PR with head matching the
candidate, and the green required checks to the current candidate — attested by
the audit receipt, D5); policy: `merge` ∈ `allowedIntents` AND
`forgeWriteAuthorized`, else `stop-policy-denied`; target contract: exactly the
recorded PR identity. All pass → `invoke` / `merge`.

#### requiredEvidence checker table

| Item | Mechanical check (snapshot + last outcome + policy) |
|---|---|
| `workflow-snapshot` | A validated, fresh snapshot is in hand (D2/D3 passed); for the frozen-eight, the D9.1 gate |
| `current-candidate` | `snapshot.unit` non-null; `execute-phase` additionally `snapshot.phase.current` non-null (D9.4) |
| `verification` | The last outcome is fresh and its skill — per the closed table — is one whose `completed`/`continue` status attests a current verification gate for the candidate (`execute-phase`, `loop-review-fold`, `review-change`, `audit-pr`) |
| `independent-review` | The last outcome is fresh and its skill is `review-change` or `loop-review-fold` (the review receipt, D9.5) |
| `issue-state` | The proposed targets carry exactly the issue identities the last outcome recorded; missing → `sense-missing-evidence` |
| `pull-request-state` | Attested by a fresh `completed` `audit-pr` outcome recommending `merge` (its own required evidence was verified when it ran) |
| `audit` | Attested by a fresh `completed` `audit-pr` outcome (the passing audit bound to the candidate by revision equality) |

#### Target-contract table

| Intent | Arity | Trusted identity rule | Failure |
|---|---|---|---|
| `execute-phase` | exactly 1 | `=== snapshot.phase.current` (the next named phase) | 0 or null phase → `sense-missing-evidence`; mismatch or >1 → `stop-forbidden-transition` |
| `review-change`, `loop-review-fold`, `audit-pr` | 0..1 | if present, `=== snapshot.unit.id` | mismatch or >1 → `stop-forbidden-transition` |
| `design-feature` | 0..1 | a feature name (creation flow; no snapshot identity exists yet) | >1 → `stop-forbidden-transition` |
| `plan-feature` | 0..1 | 0 = next roadmap unit; 1 = the active unit id or the named dependency unit recorded by the last outcome | >1 → `stop-forbidden-transition` |
| `plan-fix` | exactly 1 | the issue identity recorded by the last outcome | 0 → `sense-missing-evidence`; >1 → `stop-forbidden-transition` |
| `triage-issue` | 1..n | issue identities recorded by the last outcome | 0 → `sense-missing-evidence` |
| `init-workspace`, `discover-repository-state` | 0 | — | any target → `stop-forbidden-transition` |
| `resolve-repository-state` | 0..n | each `===` a snapshot contradiction field identity (or empty) | non-contradiction target → `stop-forbidden-transition` |
| `merge` | exactly 1 | the PR identity recorded by the last `audit-pr` outcome | 0 → `sense-missing-evidence`; >1 or non-recorded → `stop-forbidden-transition` |

Snapshot-bound identities (unit, phase, contradiction fields) are
cross-validated against the snapshot; issue/PR/dependency identities are
validated as recorded by the last outcome (arity and non-emptiness). No
inference from prose, transcript text, or branch names, ever.

### Decisions to confirm

- **D1–D7** as recorded in Product decisions (recommendation mapping,
  contradiction/resolver reconciliation, target contracts, public closed
  tables, receipt attestation chain, size S, traceability). These close the
  issue's residual mechanical gaps; changing any of them later is a reviewed,
  versioned package change.

### Testing requirements

- **Exhaustiveness suite** (`test/workflow-decision.test.mjs`): every
  `WORKFLOW_INTENTS` member covered by the exported
  `WORKFLOW_TRANSITION_TABLE` or the recommendation/merge rules; every row key
  is a profiled skill or `none`; `Object.isFrozen` on the exported table and
  vocabularies.
- **Table-driven suite** (`test/workflow-decision.test.mjs`): the twelve
  scenario classes — fresh, stale, blocked, needs-input, failed,
  contradictory, unknown, unauthorized-effect, missing-evidence, review, audit,
  merge — one fixture per class asserting the exact decision kind, intent,
  reason code, and target handling.
- **Property/fuzz suite** (`test/workflow-decision-property.test.mjs`):
  seeded deterministic mutations of valid fixtures (wrong types, unknown enum
  values, extra fields, nulls, oversized strings) never produce `invoke` and
  never throw; determinism via deep-equality on repeated calls.
- **Regression:** the full pre-existing package suite stays green
  (`renderOutputInstruction()`, `parseTurn()`, Envelope v2, SkillOutcome v1,
  WorkflowSnapshot v1, capability profiles).
- Layer: package unit tests (the function is pure — integration testing is the
  driver's concern, out of scope).

### Dev scenarios

No dev harness applies (pure function); every scenario is driven through an
existing test fixture.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `decision:first-run` | empty/zero state — no last outcome | fixture: snapshot + `lastOutcome: null` → `sense-initial` |
| `decision:stale-outcome` | stale evidence | fixture: outcome revision ≠ `sourceRevision` → `sense-stale-revision` |
| `decision:contradiction` | contradicted repository state | fixture: snapshot with `contradictions` → `stop-contradiction` (resolver path: resolve proposal → invoke) |
| `decision:unknown-state` | degraded evidence | fixture: `repositoryState: "unknown"` / affecting `unknowns` → `sense-unknown-state` |
| `decision:policy-denied` | permission denied / wrong role | fixture: policy without forge-write authorizing a forge-write skill; intent ∉ `allowedIntents` → `stop-policy-denied` |
| `decision:malformed-input` | invalid or oversized input | property suite: mutated fixtures → `sense`/`stop`, never `invoke`, never throws |
| `decision:target-mismatch` | unrecognized targets | fixture matrix: free-form/additional/mismatched targets → `stop-forbidden-transition` |
| dependency outage or timeout | n/a — pure function with no external dependencies | — |
| concurrent/duplicate action | n/a — no shared state; every call independent | — |
| limit or threshold hit | n/a — no limits or thresholds in the contract | — |

### Phases

`execute-phase 24` runs all remaining phases by default; an explicit `P<n>`
runs one atomic phase. This section is the execution ledger.

### P1 — Export the workflow-decision contract surface

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new exhaustiveness suite.

- [ ] Define and export the frozen reason-code vocabularies with derived
  TypeScript unions for the five sense codes, six stop codes, and
  `invoke-proven-transition`.
- [ ] Define and export `WorkflowDecisionPolicy`, `WorkflowDecisionInput`, and
  the three `WorkflowActionDecision` variants (invoke, sense, stop) with the
  exact closed shapes from Design.
- [ ] Define and export the frozen `WORKFLOW_TRANSITION_TABLE` reproducing the
  13-row direct-invocation table verbatim, with row conditions expressed as
  data.
- [ ] Re-export the decision contract surface from the package entry point
  `src/index.ts`.
- [ ] Add `test/workflow-decision.test.mjs` with the exhaustiveness suite:
  every `WORKFLOW_INTENTS` member is covered as a row key, an allowed next
  intent, or an explicit recommendation/merge rule; every row key is a
  profiled skill or `none`.
- [ ] Assert `Object.isFrozen` on the exported vocabularies and the transition
  table.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P1:schema:6:Export the workflow-decision contract surface

### P2 — Implement the decideWorkflowAction decision pipeline

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 (compiles; existing suites and the P1 exhaustiveness suite remain
green).

- [ ] Implement the `decideWorkflowAction` entry with defensive runtime
  validation: a malformed snapshot or outcome returns `sense` with
  `sense-missing-evidence`, a malformed policy returns `stop` with
  `stop-policy-denied`, and unknown values never throw.
- [ ] Implement initial and freshness routing: an absent last outcome returns
  `sense-initial`; an outcome revision mismatch returns `sense-stale-revision`.
- [ ] Implement outcome-status stop routing for `blocked`, `needs-input`, and
  `failed`, preserving canonical blockers and questions into targets,
  evidence refs, and detail.
- [ ] Implement contradiction routing: a declared contradiction with a
  table-allowed `resolve-repository-state` proposal proceeds toward invoke;
  every other proposal under contradiction returns `stop-contradiction` with
  the contradiction evidence.
- [ ] Implement recommendation routing for `status`, `ask-human`, `stop`, and
  `none`, plus the closed-table match with row conditions: unlisted
  transitions return `sense-unlisted-transition`, unmet row conditions return
  `sense-missing-evidence` (or `sense-unknown-state` when the state is
  unknown).
- [ ] Implement authorization checks: a missing profile or capabilities object
  returns `sense-missing-evidence`; an intent outside
  `policy.allowedIntents` or an unauthorized `forge-write` effect returns
  `stop-policy-denied`.
- [ ] Implement the evidence rules: the frozen-eight repositoryState gate,
  affecting unknowns, the per-item `requiredEvidence` checkers, and the
  execute-phase active-unit and named-current-phase gate.
- [ ] Implement the per-intent target contract and the merge rule, emit
  `invoke-proven-transition` with validated targets and evidence refs, and
  export `decideWorkflowAction` from the package entry point.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P2:schema:8:Implement the decideWorkflowAction decision pipeline

### P3 — Prove decision behavior with the full test matrix

Layer: hardening. Done-when: `cd packages/agentic-workflow-schema && npm test`
→ exit 0 with the table-driven, property, and determinism suites.

- [ ] Add the table-driven suite covering the twelve scenario classes: fresh,
  stale, blocked, needs-input, failed, contradictory, unknown,
  unauthorized-effect, missing-evidence, review, audit, and merge.
- [ ] Add `test/workflow-decision-property.test.mjs` with a seeded,
  deterministic fuzz loop proving malformed or unrecognized input values never
  produce `invoke` and never throw.
- [ ] Add determinism assertions: identical input produces deeply equal
  decisions on repeated calls.
- [ ] Add the target-contract negative matrix: free-form, additional, and
  mismatched targets return `stop-forbidden-transition`; missing required
  identities return `sense-missing-evidence`.
- [ ] Re-run the full package suite and record that every pre-existing test
  remains green.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P3:hardening:5:Prove decision behavior with the full test matrix

### P4 — Release the bilingual decision reference

Layer: schema. Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0; `grep '"version"' packages/agentic-workflow-schema/package.json` →
`3.2.0`; `npm pack --dry-run` lists the unchanged public artifact set.

- [ ] Add the `decideWorkflowAction` section to `README.md`: contract summary,
  the mandatory sensor points, one safe model-call-elision example, and one
  mandatory `workflow-status` fallback example.
- [ ] Add the synchronized Spanish section to `README.es.md` carrying the same
  contract summary, sensor points, and both examples.
- [ ] Bump the package version `3.1.0` → `3.2.0` (minor, additive).
- [ ] Run `npm pack --dry-run` and confirm the public artifact set is unchanged
  from v3.1.0.

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P4:schema:4:Release the bilingual decision reference

### P5 — Hardening & PR

Layer: close-out. Done-when: every project gate is green, the PR is open with
`Closes #137`, and the roadmap row reads `done · [#<pr>](<pr-url>)`.

- [ ] Re-run the project's full verification gate — `cd
  packages/agentic-workflow-schema && npm test` → exit 0; `node
  scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push` — branch pushed, PR branch remote-current
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
  Markdown file, real backticks, never inline `--body`/heredoc that leaves
  `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes
  `Closes #137`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<pr>` and push

#### Phase-lint

Phase-lint: PASS (8/8) · fingerprint P5:close-out:7:Hardening & PR

### Spec-lint (mechanical — engineering boxes, run at scaffold time)

- [x] `### Dev scenarios` has ≥ 1 failure-mode row (the fixed category list is
  walked; n/a rows carry reasons).
- [x] Every phase passes the 8-box Phase-lint (records above).
- [x] No template placeholders left anywhere in the file.

### Deploy & rollback

The package ships as a minor release (`3.1.0` → `3.2.0`); additive API, no
migration, no flag, no config change. Rollback: revert the PR to restore
v3.1.0.

### Open questions / risks

- **Risk — mapping choices are v1 contract.** The recommendation-intent
  mappings and target contracts (D1/D3) are choices within the issue's closed
  reason-code set; they are locked by tests, and changing them later is a
  reviewed, versioned package change. Accepted.
- **Risk — merge-rule evidence is receipt-attested.** The merge rule trusts a
  fresh `audit-pr` pass outcome as the attestation for PR state, checks, and
  verification. Issues #138 (candidate-bound review receipts) and #139 (staged
  verification contracts) will tighten exactly this chain; no contract change
  is needed here (D5).
- **Inherited — NRS F023/F024 (stale SKILLS.md counts, deleted REPOSITORY_STATE
  history):** RESOLVED elsewhere — feature 23's close-out synced the counts and
  the NRS ledger is present and frozen at HEAD; not touched by this unit.

### Deliverables

- Updated `packages/agentic-workflow-schema/src/index.ts` — reason-code
  vocabularies, decision types, frozen `WORKFLOW_TRANSITION_TABLE`,
  `decideWorkflowAction`, package-root exports.
- New `packages/agentic-workflow-schema/test/workflow-decision.test.mjs` —
  exhaustiveness + twelve-class table-driven suite + target-contract matrix.
- New `packages/agentic-workflow-schema/test/workflow-decision-property.test.mjs`
  — property/fuzz + determinism suite.
- Updated `packages/agentic-workflow-schema/README.md` + `README.es.md` —
  synchronized decision section with both examples and the sensor points.
- Updated `packages/agentic-workflow-schema/package.json` — version `3.2.0`.
- Updated `docs/features/ROADMAP.md` — row 24 registered (`planned`).
- This `SPEC.md` + `ACCEPTANCE.md` — frozen planning artifacts.

### Post-merge next feature

Issue
[#138](https://github.com/gtrabanco/agentic-workflow/issues/138) — bind review
receipts to exact candidate content: the natural next unit; it strengthens the
`review-change`/`audit-pr`/`merge` evidence chain this decider consumes.
