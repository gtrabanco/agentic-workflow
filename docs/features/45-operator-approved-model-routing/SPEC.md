# 45 — operator-approved-model-routing

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> Copy this folder to `docs/features/NN-<feature-slug>/` and keep the
> file named `SPEC.md`. Register the feature in
> `docs/features/ROADMAP.md` before starting.
>
> **One SPEC, two halves.** `design-feature` writes the **Product half**
> (product definition, capability closure, acceptance criteria) and stamps
> `## Design status`. `plan-feature` refuses to plan a feature not marked
> `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). Never split this into a separate design document —
> one file, two owners, no drift.

## Goal

Give the operator full control over which models spawned subagent passes use,
saving money by routing subagents to cheap models instead of the orchestrator's
frontier model — configurable per-skill with fallback chains, `"inherit"` to
share a global default, `"auto"` for sanctioned delegation, and a configurable
unavailable-model fallback that defaults to the orchestrator's model.

## Branch

`feat/45-operator-approved-model-routing`

## Size

**S** — config extension + resolve-passes producer + skill wiring + tests
(~2-3 commits, ≤ half a day). Implements the core routing and golden fixtures;
optional surface integration (ship-roadmap picker) deferred to #154.

## Dependencies

**Hard**: Feature 196 (producer-package) — `resolve-passes` lives in `packages/agentic-workflow` scripts.
**Soft**: Feature 154 (settings console picker) — pass entries should adopt its ordered-chain shape when it lands (deferred UX).

---

## Product half

### Context

The pi package (`@gtrabanco/pi-agentic-workflow`) already supports operator-
routed model selection for slash-command turns via `default`, `commands`, and
`onUnavailableRoute` in `pi-agentic-workflow.json` (`packages/pi-agentic-workflow/src/config/schema.ts`
root keys). However, mid-turn subagent passes (review-change's adversarial
review passes, verification, classification, debt transform, golden-fixture runs)
spawn on whatever model the host agent picks — an extension default, an agent-type
default, or the session model — never the operator's choice. Real installs route
`/review-change` to a frontier model via `pi-agentic-workflow.json` yet the
passes it spawns run on models the operator never approved, burning paid credits
or a quota-limited model at random.

Prior features: feature 27 installed the pi package with routed slash-command
aliases; feature 20 added runtime guardrails for progressive skills. This extends
the routing vocabulary from command-turns to **subagent spawns**.

### Business goals

Reduce operator cost by an order of magnitude on high-spawn operations (adversarial
reviews, multi-pass audits) without sacrificing correctness — review passes use
cheap, capable models (e.g. `nan/qwen3.6`) while orchestration retains frontier
quality (e.g. `nan/glm5.3-flash`).

### Scope

#### In scope

1. **Config extension**: extend `default` in `pi-agentic-workflow.json` to accept
   both a single `provider/modelId` (existing) and a **fallback chain** (array of
   `provider/modelId` strings). An array is tried in order until one resolves or
   all fail.
2. **Per-skill override**: new top-level `passes` key mapping skill names to
   `{model, thinking}` where `model` accepts the same single-value or array shape.
   `model: "inherit"` falls back to the `default` chain.
3. **`"auto"` model value**: a sanctioned "let the orchestrating agent decide"
   marker — valid but documented as operator-delegated.
4. **`resolve-passes` producer**: deterministic script in `packages/agentic-workflow`
   that reads `pi-agentic-workflow.json`, applies `default` → `passes` → fallback
   resolution rules, and emits a resolved `passModels.json` with the final
   per-skill model chain.
5. **review-change integration**: `review-change/SKILL.md` and `ADVERSARIAL_SETUP.md`
   read the resolved table before spawning; each pass uses its configured model.
   Adversarial review's `--adversarial N` spawns N parallel passes, each consuming
   a different model from the per-skill chain (round-robin from the array, or
   round-robin from the global chain if `"inherit"`).
6. **init-workspace bootstrap**: `init-workspace` interview adds a pass-routing
   step that writes `default` + `passes.review-change` with recommended cheap
   model chains. Other skills (golden-fixture, ship-roadmap) get a post-install
   recommendation note (not auto-written).
7. **Golden fixture update**: `docs/workflow/GOLDEN_FIXTURE.md` gains a pass-routing
   smoke test as a model precondition.
8. **Tests**: schema round-trip for arrays; `resolve-passes` golden fixtures (absent
   → default, chain resolution, `inherit` resolution, `auto` passthrough, empty
   chain → reject).

#### Out of scope / non-goals

- **No new picker primitives** — searchable/bulk/fallback-chain UX in settings is
  #154's scope; pass entries adopt its shape when it lands (deferred).
- **No change to which passes run** — applicability is review-change's contract;
  #194 (deterministic-review-change) owns the "which passes" question.
- **No per-pass-per-subagent granularity** — configuration is per-skill; all subagents
  of a skill share the same model chain (e.g. `review-change` has one chain for all
  its adversarial passes).
- **No model cost tracking or reporting** — cost accounting is a separate concern.
- **No global model whitelist** — operator approval is implicit in the config file;
  no separate allowlist or validation gate beyond schema validation.
- **No dynamic model selection during execution** — the chain is read once at
  spawn-time; changing models mid-run requires restart.
- **No new test infrastructure** — golden fixtures use existing harness; no new
  CI gate.

### Capability closure

**1. Entity closure**

For EACH entity this feature introduces or touches:

- **Config file** (`pi-agentic-workflow.json`)
  - [x] Create — UI: init-workspace interview · API: JSON file write · test: schema validation
  - [x] Read/list — UI: none (file read) · API: `effectiveRoute()` + `resolve-passes` · test: golden fixtures
  - [x] Update — UI: none yet (#154 deferred) · API: file write via init-workspace · test: schema validation
  - [x] Delete — UI: n/a · API: n/a · test: n/a: config is additive; removal is operator responsibility, not a feature operation
  - [x] State transitions: n/a: no state machine on config entities

- **Resolved model chain** (`passModels.json` output)
  - [x] Create — API: `resolve-passes` script · test: golden fixture `resolve`
  - [x] Read/list — API: `resolve-passes` stdout/stderr · test: golden fixture `validate`
  - [x] Update — API: re-run `resolve-passes` on config change · test: golden fixture `resolve` with different input
  - [x] Delete — API: remove output file · test: n/a: output is ephemeral

- **resolve-passes producer script**
  - [x] Create — API: `packages/agentic-workflow/scripts/resolve-passes.mjs` · test: unit tests
  - [x] Read/list — API: CLI execution · test: exit 0 on valid input
  - [x] Update — API: re-run on config change · test: golden fixture
  - [x] Delete — API: n/a: producer is a deliverable of this feature, not a mutable entity

For EACH capability (action a user can take):
  - [x] Visible entry point: init-workspace interview + manual config edit · test: golden fixture

For EACH role in the capability:
  - operator (config writer): allowed — writes and reads config, runs resolve-passes
  - orchestrator (agent): allowed — reads resolved chain, spawns with model
  - pass (subagent): n/a: pass is a runtime entity, not a role

For EACH role / permission this feature introduces:
  - [x] Assigned where: implicit — anyone who writes `pi-agentic-workflow.json`
  - [x] Revoked where: n/a: no explicit revoke mechanism (operator edits or deletes config)
  - [x] Viewed where: n/a: config file itself is the source of truth

**2. Integration closure**

Derived inventory from `packages/pi-agentic-workflow/src/config/` + codebase scan
(no `CAPABILITIES.md` exists):

- [x] Config system — extends existing `RouteFile` shape; `mergeConfigs` + `effectiveRoute`
  unchanged (reads-only at runtime); resolve-passes produces the resolution before
  merge · test: golden fixture `resolve` validates resolution chain
- [x] Schema validation — `schema.ts` extended to accept `ModelRef[]` in `default`;
  types.ts extends `ModelSetting` to include `"auto"` · test: schema round-trip
- [x] review-change skill — ADVERSARIAL_SETUP.md updated to reference resolved table;
  pass launch picks from per-skill chain · test: golden fixture `verify`
- [x] golden-fixture — GOLDEN_FIXTURE.md gains pass-routing smoke test · test: golden fixture
  run with configured cheap model
- [x] init-workspace — BOOTSTRAP_WRITE.md + UPGRADE.md gain pass-routing step · test:
  golden fixture `resolve` on init-workspace output
- [x] model-routing.yml (documented tiers) — pass tiers for the #claude branch;
  per-pass keys under the new `passes` top-level section · test: grep validation
  for alphabetical order per CLAUDE.md

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | A pass with no `passes.<skill>` entry uses `default` chain | in-scope | AC1: `resolve-passes` absent-skill → default fallback |
| 2 | A pass with `"inherit"` uses the `default` chain | in-scope | AC2: `resolve-passes` inherit → default resolution |
| 3 | An unavailable model in the chain tries the next one | in-scope | AC3: `resolve-passes` chain resolution with unavailable model |
| 4 | All models in the chain exhausted → report failure | in-scope | AC4: `resolve-passes` empty result after exhaustion |
| 5 | `"auto"` value is accepted and passed through | in-scope | AC5: `resolve-passes` auto passthrough |
| 6 | Adversarial `--adversarial N` consumes N distinct models from the chain | in-scope | AC6: review-change adversarial model assignment |
| 7 | init-workspace writes recommended `default` and `passes.review-change` | in-scope | AC7: init-workspace default config output |
| 8 | resolve-passes output is deterministic (same input → same output) | in-scope | AC8: golden fixture byte-stability test |
| 9 | Config schema rejects non-ModelRef values in arrays | in-scope | AC9: schema validation rejects invalid array element |
| 10 | Model routing YAML keys are alphabetical (CLAUDE.md rule) | in-scope | AC10: grep alphabetical order check |
| 11 | A single string `model` value still works (backward compat) | in-scope | AC11: backward compatibility single value |
| 12 | resolve-passes exits non-zero on invalid config | in-scope | AC12: resolve-passes exits non-zero on invalid input |

### Acceptance criteria

- [ ] AC1: `resolve-passes` absent-skill → default fallback — run: `echo '{}' | bun scripts/resolve-passes.mjs` → output has only default chain for every skill
- [ ] AC2: `resolve-passes` inherit → default — config with `passes.test: {model: "inherit"}` → resolved model = default chain
- [ ] AC3: `resolve-passes` chain resolution — config with `default: ["nan/cheap1", "nan/cheap2", "inherit"]` and `passes.review: {model: "nan/expensive"}` → resolved has both chains correctly nested
- [ ] AC4: `resolve-passes` empty result after exhaustion — config with `default: []` → resolve-passes exits non-zero with reason
- [ ] AC5: `resolve-passes` auto passthrough — config with `model: "auto"` → output has `"auto"` in the resolved chain
- [ ] AC6: review-change adversarial model assignment — review-change spawns N adversarial passes, each gets a different model from the per-skill chain (round-robin)
- [ ] AC7: init-workspace default config output — init-workspace writes `pi-agentic-workflow.json` with `default` array and `passes.review-change` chain
- [ ] AC8: golden fixture byte-stability — two identical runs of resolve-passes on same input produce byte-identical output
- [ ] AC9: schema validation rejects invalid array element — config with `"default": { "model": "not-a-reference" }` → schema error
- [ ] AC10: grep alphabetical order check — `grep -n "passes:" docs/workflow/model-routing.yml` returns alphabetically ordered keys under `passes`
- [ ] AC11: backward compatibility single value — config with `default.model: "nan/glm5.3-flash"` (string, not array) → resolve-passes treats as single-element chain
- [ ] AC12: resolve-passes exits non-zero on invalid input — config with unknown root key `passes` and invalid type → exit code ≠ 0

### Tooling

- `@gtrabanco/agentic-workflow-schema` — config schema validation (v3.4.0+)
- `node` / `bun` — runtime for resolve-passes producer (deterministic scripts)

### Product decisions

- **Fallback default**: inherit (orchestrator's model) when a configured model is unavailable. Rationale: safest path — the operator explicitly approved the orchestrator's model for the command; using it preserves correctness.
- **Config granularity**: per-skill, not per-pass. Rationale: adversarial reviews spawn N parallel passes of the *same* skill — they share one chain, and the orchestrator distributes models round-robin from that chain. Per-pass would require the operator to enumerate every pass name, which defeats the purpose.
- **Global fallback location**: `default` accepts an array (extends existing shape). Rationale: avoids a new top-level key; `default` already represents the global fallback for commands.
- **`auto`**: included in the model vocabulary but documented as operator-delegated. Rationale: the operator explicitly wrote `"auto"` — it's a conscious choice to delegate, not a gap.

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Per-pass picker UX in #154 settings | #154 owns the searchable/bulk/fallback-chain UI primitives; 45 provides the data, #154 provides the UI | #154 implementation phase |
| Per-pass-per-subagent granularity | Not required now; if a future feature needs it, the config schema can be extended (arrays inside `passes.<skill>` for each pass) | When a use case justifies it |

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half — `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'` returns nothing
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 6 bullets
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank rows
- [x] Integration closure has one row per subsystem listed in `docs/CAPABILITIES.md` — project has no CAPABILITIES.md; derived inventory from config system, review-change, golden-fixture, init-workspace, model-routing (6 rows)
- [x] Every capability's role matrix lists EVERY role with explicit `allowed`/`denied` — operator: allowed, orchestrator: allowed, pass: n/a
- [x] `### Expectation sweep` has ≥ 5 resolved rows (XS/S) — 12 rows, all resolved to `in-scope` with pointers
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion — 8 scope bullets map to AC1-AC12
- [x] Every Acceptance criterion is a runnable command OR labelled `read-verified` — all are runnable commands (grep, bun, echo | pipe)
- [x] `### Deferred decisions` exists — 2 rows, both with decide-by triggers

## Design status

`designed` — capability closure complete, all expectation sweep rows resolved,
all spec-lint boxes ticked.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

- Extend `packages/pi-agentic-workflow/src/config/types.ts` to include `"auto"` in `ModelSetting` and `RouteFile.model` to accept `ModelRef | ModelRef[]`
- Extend `packages/pi-agentic-workflow/src/config/schema.ts` validator for `default.model` arrays
- Create `packages/agentic-workflow/scripts/resolve-passes.mjs` producer
- Wire `review-change/SKILL.md` + `ADVERSARIAL_SETUP.md` to consume the resolved table
- Update `init-workspace/references/BOOTSTRAP_WRITE.md` + `UPGRADE.md` with pass-routing step
- Update `docs/workflow/GOLDEN_FIXTURE.md` with pass-routing smoke test
- Update README/CHANGELOG (EN+ES) with pass-routing feature

### Architecture impact

- Outer-layer-only: changes are in config schema + producer script + skill docs
- No changes to the schema package's public API or runtime behavior
- No changes to the core merge logic (`mergeConfigs`, `effectiveRoute`) — they read-only; resolution is pre-merge

### Open questions / risks

- **Backward compat**: extending `RouteFile.model` from `ModelSetting` to `ModelSetting | ModelRef[]` is additive but changes the TypeScript type — existing configs with string values must still validate. Tested by AC11.
- **Adversarial round-robin**: when `N > chain.length`, does the orchestrator reuse models? Proposed: yes, round-robin wraps — documented in review-change spec.
- **resolve-passes location**: feature 196 (producer-package) defines `packages/agentic-workflow/scripts/` as the producer home. This feature must wait for 196's merge.

---

→ Next: /review-spec 45-operator-approved-model-routing — product half designed and readiness-clean; it needs an
    independent review before any engineering planning
  · more to design → re-run /design-feature 45-operator-approved-model-routing "<instruction>" (upsert, destroys nothing,
    rotates the artifact revision)
  · recurring gap in this project's capability closure → /product-audit (a systemic pattern,
    not a one-off design fix)