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
frontier model — configurable per pass with fallback chains, `"inherit"` to
share a global default, `"auto"` for sanctioned delegation, and a configurable
unavailable-model fallback that degrades to inline at the orchestrator's model.

## Branch

`feat/45-operator-approved-model-routing`

## Size

**S** — config extension + resolve-passes producer + skill wiring + tests
(~2-3 commits, ≤ half a day). Implements the core routing and golden fixtures;
optional surface integration (ship-roadmap picker) deferred to issue #154.

## Dependencies

**Hard**: Feature 43 `producer-package` (issue
[#196](https://github.com/gtrabanco/agentic-workflow/issues/196)) — the
`resolve-passes` producer ships as feature 43's `aw resolve-passes`
subcommand (with the `.mjs` fallback of its execution ladder); this feature
cannot start before feature 43 lands the crate.

**Soft**: Issue [#154](https://github.com/gtrabanco/agentic-workflow/issues/154)
(settings console picker) — pass entries adopt its ordered-chain shape when it
lands (deferred UX).

Architectural invariants: n/a — no project invariants declared
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent;
`REPOSITORY_STATE.md` F010).

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
   `provider/modelId` strings). A chain is tried in the operator's order until
   one model is usable (AC11 backward-compat single value, AC3 chain shape).
2. **Per-pass override**: new top-level `passes` key mapping **pass names** (the
   closed pass vocabulary of issue #201: the `review-*` finder passes, `verify`,
   `classify`, `debt`) to `{model, thinking}`, where `model` accepts the same
   single-value or array shape. `model: "inherit"` resolves to the `default`
   chain. Unknown pass names are rejected by the strict-validator rule (AC2, AC5, AC12).
3. **`"auto"` model value**: a sanctioned "let the orchestrating agent decide"
   marker — valid but documented as operator-delegated (AC5, AC14).
4. **`resolve-passes` producer**: deterministic producer shipped by feature 43's
   crate as `aw resolve-passes` (issue #196; `.mjs` fallback per its execution
   ladder). It reads `pi-agentic-workflow.json` including `passes`, applies the
   fail-closed resolution rules **in code** (never re-derived by the model before
   each spawn), and emits a byte-stable resolved pass→model/thinking table (JSON)
   on stdout (AC1, AC4, AC8, AC12).
5. **review-change integration**: `review-change/SKILL.md` and
   `references/ADVERSARIAL_SETUP.md` read the resolved table before spawning;
   each pass is launched with its configured model. A pass whose chain cannot
   provide a model at spawn-time degrades inline at the orchestrator's model,
   stated in the report. Adversarial `--adversarial N` spawns N parallel passes,
   each consuming a different model from the per-pass chain (round-robin from
   the array, or round-robin from the global chain if `"inherit"`) (AC6).
6. **init-workspace bootstrap**: `init-workspace` interview adds a pass-routing
   step that writes `default` + recommended `passes` entries for the review
   family. Other skills (golden-fixture, ship-roadmap) get a post-install
   recommendation note (not auto-written) (AC7).
7. **Golden fixture update**: `docs/workflow/GOLDEN_FIXTURE.md` gains a
   pass-routing smoke test as a model precondition (AC13).
8. **Tests**: schema round-trip for arrays; `resolve-passes` golden fixtures
   (absent → default, chain resolution, `inherit` resolution, `auto` passthrough,
   unresolvable chain → inline, invalid config → exit non-zero) (AC1–AC5, AC9–AC12).

#### Unavailable-model and chain-exhaustion semantics

These semantics resolve the previously contradictory AC4/expectation 4 against
the recorded fallback decision (AD-45-001) and issue #201's fail-closed rule:

1. An ordered chain is tried in the operator's order; the first usable model
   wins. Usability is judged at **spawn-time** by the consuming skill —
   `resolve-passes` is offline and never samples runtime model availability.
2. Chain exhausted, or no approved default (`default` absent **or empty
   array**): the pass runs **inline at the orchestrator's model** and the report
   states the degrade — never a spontaneous subagent spawn with an unapproved
   model, never a failed run.
3. `resolve-passes` exit code is non-zero only for config the strict validator
   rejects (unknown root key, invalid types, invalid model references, unknown
   pass names); a valid config always exits 0 with a fully resolved table.
4. Where the degrade is declared: resolve-time for schema-level facts — the
   table marks a pass left with no chain by schema-level facts (absent or empty
   `default`, or a pass entry that yields no chain) `inline` with the per-pass
   reason `no default chain`; spawn-time for runtime availability — the consumer
   states the degrade in its report. Schema-invalid references are never an
   inline case: the strict validator rejects them (§3, AC12). This refines
   issue #201's golden fixture "chain of unresolvable refs → inline with
   reason": its inline-with-reason outcome applies to schema-level degenerate
   chains; runtime unavailability degrades at spawn-time per §1; invalid
   references are validator rejections per §3.
5. `auto` requires no trust gate of its own: the pi package's project-trust
   gate already refuses to read an untrusted project's config file at all
   (`packages/pi-agentic-workflow/src/config/load.ts`, S11 — "a cloned
   repository must not be able to steer routing"), so an untrusted project's
   `passes` entry, `"auto"` included, can never delegate model choice;
   `"auto"` in the global file is the operator's own writing (AD-45-004).
   This resolves issue #201's open question ("Should `auto` be refused while
   the project is untrusted? Proposed: yes") as yes-by-construction (AD-45-007).

#### Out of scope / non-goals

- **No new picker primitives** — searchable/bulk/fallback-chain UX in settings is
  issue #154's scope; pass entries adopt its shape when it lands (deferred).
- **No change to which passes run** — applicability is review-change's contract;
  issue #194 (deterministic-review-change) owns the "which passes" question.
- **No per-pass-per-subagent granularity** — configuration is per pass name; all
  subagents of one pass share the same model chain (e.g. `review-code` has one
  chain for all its adversarial instances).
- **No model cost tracking or reporting** — cost accounting is a separate concern.
- **No global model whitelist** — operator approval is implicit in the config file;
  no separate allowlist or validation gate beyond schema validation.
- **No dynamic model selection during execution** — the chain is read once at
  spawn-time; changing models mid-run requires restart.

### Capability closure

**1. Entity closure**

For EACH entity this feature introduces or touches:

- **Config file** (`pi-agentic-workflow.json`)
  - [x] Create — UI: init-workspace interview · API: JSON file write · test: schema round-trip (AC9)
  - [x] Read/list — UI: none (file read) · API: the pi package's config loader + `aw resolve-passes` · test: golden fixtures (AC1–AC5, AC11)
  - [x] Update — UI: none yet (issue #154 deferred) · API: file write via init-workspace · test: schema round-trip (AC9)
  - [x] Delete — n/a: config is additive; removal is operator responsibility, not a feature operation
  - [x] State transitions: n/a: no state machine on config entities

- **Resolved model chain** (resolved pass→model/thinking table, JSON on stdout)
  - [x] Create — API: `aw resolve-passes` (feature 43 producer) · test: golden fixture — chain resolution (AC1–AC5)
  - [x] Read/list — API: producer stdout, consumed by review-change · test: golden fixture — resolution output (AC6 read-verified)
  - [x] Update — API: re-run `aw resolve-passes` on config change · test: golden fixture with different input (AC3)
  - [x] Delete — n/a: output is ephemeral (stdout/CI artifact), not a managed entity

- **resolve-passes producer** (feature 43's `aw resolve-passes`; `.mjs` fallback)
  - [x] Create — API: shipped by feature 43's crate per issue #196 · test: producer unit tests in that crate
  - [x] Read/list — API: CLI execution (`aw resolve-passes`) · test: exit 0 on valid input (AC1, AC11)
  - [x] Update — API: n/a: the producer is a deliverable of feature 43; this feature only consumes it
  - [x] Delete — n/a: producer removal is feature 43's concern

For EACH capability (action a user can take):
  - [x] Visible entry point: init-workspace interview + manual config edit · test: AC7 (bootstrap write), AC2/AC5 (manual config)

For EACH role in the capability:
  - inventory note: `docs/CAPABILITIES.md` exists but is an unseeded template —
    its Roles table holds only a placeholder row, so roles are derived here:
  - operator (config writer): allowed — writes and reads config, runs `aw resolve-passes`
  - orchestrating agent: allowed — reads the resolved table, spawns passes (read-only consumer)
  - spawned pass (subagent): denied — a pass never writes config or the resolved table

For EACH role / permission this feature introduces:
  - [x] Assigned where: implicit — anyone who writes `pi-agentic-workflow.json` (file-system authority; no ACL exists)
  - [x] Revoked where: n/a: no explicit revoke mechanism (operator edits or deletes config)
  - [x] Viewed where: n/a: config file itself is the source of truth

**2. Integration closure**

Inventory: `docs/CAPABILITIES.md` **exists** but is an unseeded template (every
row a placeholder — see Evidence row E6). Its fixed subsystem set is walked below
(one row each, none skipped), followed by the project-specific subsystems derived
from the config system and the skills tree. Seeding `docs/CAPABILITIES.md` from
the template is init-workspace's job — offered as a follow-up, not done here.

For EACH subsystem in `docs/CAPABILITIES.md` (13 rows):

- [x] Authentication — n/a: no authenticated surface exists in this project (skills, docs, deterministic scripts; no user accounts)
- [x] ACL / permissions — n/a: no permission registry; the only authority boundary is file-system access to `pi-agentic-workflow.json`
- [x] Navigation (menus, dashboard) — n/a: no dashboard/menu surfaces; skills are invoked by slash command
- [x] Notifications — n/a: no notification channels; output is inline turn reports
- [x] Search — n/a: no search surfaces
- [x] Audit log / activity trail — n/a: no activity trail beyond git history and `docs/LOGS.md`; model routing adds none
- [x] Settings / preferences — in-scope: `pi-agentic-workflow.json` is the settings store; the new `passes` root key extends it · test: schema round-trip (AC9) + golden fixtures (AC2, AC7)
- [x] Background jobs / scheduling — n/a: nothing scheduled; resolution runs on demand
- [x] File / media storage — n/a: no media; only the config file and the resolved table
- [x] i18n / localization — n/a: config keys and reports are English-only (`REPOSITORY_STATE.md` F011)
- [x] Feature flags — n/a: no flag store; routing is explicit config, not flags
- [x] Billing / payments — n/a: no payments; model cost tracking is out of scope
- [x] Public API / integrations — n/a: no public API surface; the resolved table is consumed by in-repo skills only

Derived project subsystems (from `packages/pi-agentic-workflow/src/config/` +
the skills tree; recorded because the inventory is unseeded):

- [x] Config system — `pi-agentic-workflow.json` extended: `default` accepts a single ref or an array chain; the merge/loader path keeps reading the same file · test: schema round-trip (AC9, AC11)
- [x] Schema validation — the pi package's strict validator (`packages/pi-agentic-workflow/src/config/schema.ts`) accepts the new shapes and rejects unknown root keys, invalid types, invalid references, and unknown pass names · test: AC9, AC12
- [x] review-change skill — `SKILL.md` + `references/ADVERSARIAL_SETUP.md` consume the resolved table before spawning; round-robin model distribution for adversarial passes · test: read-verified (AC6)
- [x] golden-fixture — `docs/workflow/GOLDEN_FIXTURE.md` gains the pass-routing smoke test · test: AC13
- [x] init-workspace — `references/BOOTSTRAP_WRITE.md` + `references/UPGRADE.md` gain the pass-routing step · test: AC7
- [x] `docs/workflow/model-routing.yml` (documented tiers) — pass tiers for the #claude branch; new keys alphabetical per `CLAUDE.md` Conventions · test: AC10

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | A pass with no `passes` entry resolves to the `default` chain when one exists | in-scope | AC1 |
| 2 | A pass with `"inherit"` uses the `default` chain | in-scope | AC2 |
| 3 | An unavailable model in a chain falls through to the next entry in the operator's order | in-scope | AC3 (chain shape) + AC4 (exhaustion degrade) |
| 4 | A chain exhausted or empty → the pass degrades inline at the orchestrator's model, stated in the report | in-scope | AC4 |
| 5 | `"auto"` value is accepted and passed through | in-scope | AC5 |
| 6 | Adversarial `--adversarial N` consumes N distinct models from the chain (round-robin, wraps) | in-scope | AC6 |
| 7 | init-workspace writes recommended `default` and `passes` entries | in-scope | AC7 |
| 8 | resolve-passes output is deterministic (same input → same output) | in-scope | AC8 |
| 9 | Config validation rejects non-ModelRef values in arrays | in-scope | AC9 |
| 10 | Model routing YAML keys stay alphabetical (CLAUDE.md rule) | in-scope | AC10 |
| 11 | A single string `model` value still works (backward compat) | in-scope | AC11 |
| 12 | resolve-passes exits non-zero on config the strict validator rejects | in-scope | AC12 |
| 13 | An untrusted project's `passes` entry (`"auto"` included) never delegates model choice (issue #201 open question, resolved yes-by-construction) | in-scope | AC14 + §Product decisions (AD-45-007) |

### Acceptance criteria

All commands assume the producer invocation contract fixed by feature 43
(issue #196): `aw resolve-passes` with the config file piped on stdin and the
resolved JSON table on stdout; the `.mjs` fallback of #196's execution ladder
satisfies the same commands.

- [x] AC1 (command-verified): absent pass entry + default chain exists → pass = default chain — `printf '%s' '{"default":["nan/glm5.3-flash"]}' | aw resolve-passes` → exit 0; every pass with no `passes` entry resolves to the `["nan/glm5.3-flash"]` chain
- [x] AC2 (command-verified): `inherit` → default — `printf '%s' '{"default":["nan/cheap1"],"passes":{"review-code":{"model":"inherit"}}}' | aw resolve-passes` → resolved `passes.review-code` chain equals the `default` chain
- [x] AC3 (command-verified): per-pass chain vs global default — `printf '%s' '{"default":["nan/cheap1","nan/cheap2"],"passes":{"review-code":{"model":"nan/expensive"}}}' | aw resolve-passes` → `passes.review-code` resolves to `["nan/expensive"]` and every other pass to `["nan/cheap1","nan/cheap2"]`
- [x] AC4 (command-verified): fail-closed inline degrade — `printf '%s' '{}' | aw resolve-passes` → exit 0; every pass resolved `inline` with the per-pass reason `no default chain`; the same inline result for `"default": []`, and for a pass entry `{"model":"inherit"}` with no usable `default`. A chain of schema-invalid references is not this case — the strict validator rejects it (exit ≠ 0, AC12); a chain of schema-valid but runtime-unavailable models is judged at spawn-time by the consumer, which states the degrade in its report (AC6) — the offline producer never samples runtime availability (scope item 4)
- [x] AC5 (command-verified): auto passthrough — `printf '%s' '{"passes":{"verify":{"model":"auto"}}}' | aw resolve-passes` → resolved `passes.verify` chain contains `"auto"`
- [x] AC6 (read-verified): adversarial model assignment — `skills/review-change/SKILL.md` + `references/ADVERSARIAL_SETUP.md` name the per-pass model resolution from the resolved table and the round-robin distribution (wraps when N > chain length); a pass whose chain cannot provide a model degrades inline with the degrade stated in the report
- [x] AC7 (command-verified): init-workspace bootstrap write — `grep -n "passes" skills/init-workspace/references/BOOTSTRAP_WRITE.md skills/init-workspace/references/UPGRADE.md` → the pass-routing step appears in both, writing `default` and recommended `passes` entries
- [x] AC8 (command-verified): byte stability — two runs of `aw resolve-passes` on the same input produce byte-identical stdout
- [x] AC9 (command-verified): schema rejects invalid array element — a config whose `default` array holds a non-ModelRef value (e.g. `"default": {"model": "not-a-reference"}`) fails the pi package's strict validator round-trip test (`packages/pi-agentic-workflow/src/config/schema.ts`)
- [x] AC10 (command-verified): alphabetical keys — `bun test scripts/pre-execution-quality.test.mjs` → the model-routing.yml key-order assertion passes with the new `passes` section in place
- [x] AC11 (command-verified): backward compatibility — `printf '%s' '{"default":"nan/glm5.3-flash"}' | aw resolve-passes` → treated as the single-element chain `["nan/glm5.3-flash"]`
- [x] AC12 (command-verified): invalid config exits non-zero — `passes` IS a known root key of this feature; an actually-unknown root key is rejected: `printf '%s' '{"default":"nan/glm5.3-flash","bogus":true}' | aw resolve-passes` → exit code ≠ 0; likewise `printf '%s' '{"default":42}' | aw resolve-passes` → exit code ≠ 0
- [x] AC13 (command-verified): golden fixture smoke test — `grep -n "pass-routing\|resolve-passes" docs/workflow/GOLDEN_FIXTURE.md` → ≥ 1 match (the smoke test is registered as a model precondition)
- [x] AC14 (read-verified): `auto` needs no trust gate of its own — `packages/pi-agentic-workflow/src/config/load.ts` does not read the project config file while the project is untrusted (S11: a cloned repository must not be able to steer routing) and `src/settings/console.ts` refuses project-scope edits while untrusted, so an untrusted project's `passes` entry — `"auto"` included — is never honored; `"auto"` in the global config is operator-written (AD-45-004, AD-45-007)

### Tooling

- `packages/pi-agentic-workflow/src/config/schema.ts` — the pi package's strict
  validator for `pi-agentic-workflow.json` (root keys, model references, new
  `passes` shapes); the config-validation authority for this feature
- `aw resolve-passes` (feature 43's crate, issue #196) — the resolve-passes
  producer this feature consumes; `bun`/`node` run its `.mjs` fallback
  deterministically

### Product decisions

- **Fallback default**: inline at the orchestrator's model when the chain is
  exhausted, empty, or absent. Rationale: safest path — the operator explicitly
  approved the orchestrator's model for the command; using it preserves
  correctness. (AD-45-001; operationalized by AD-45-006.)
- **Config granularity**: per pass name, not per subagent instance. Rationale:
  adversarial reviews spawn N parallel instances of the *same* pass — they share
  one chain, and the orchestrator distributes models round-robin from that
  chain. Per-instance would require the operator to enumerate every instance,
  which defeats the purpose. (AD-45-002.)
- **Global fallback location**: `default` accepts an array (extends existing
  shape). Rationale: avoids a second global key; `default` already represents
  the global fallback for commands. (AD-45-003.)
- **`auto`**: included in the model vocabulary but documented as
  operator-delegated. Rationale: the operator explicitly wrote `"auto"` — it's a
  conscious choice to delegate, not a gap. (AD-45-004.)
- **Adversarial distribution**: round-robin from the per-pass chain; wraps when
  N > chain length. Rationale: simple, deterministic, no new configuration
  needed. (AD-45-005.)
- **`auto` and the project-trust gate**: `auto` carries no gate of its own — it
  is honored exactly where its config file is honored. The pi package's
  project-trust gate refuses to read an untrusted project's config file at all
  (`packages/pi-agentic-workflow/src/config/load.ts`, S11), so an untrusted
  project's `passes` entry, `"auto"` included, can never delegate model choice;
  `"auto"` in the global file is operator-written. Resolves issue #201's open
  question as yes-by-construction — the gate it proposed already exists at
  config-load time; a second, dedicated `auto` gate would be unreachable dead
  code. (AD-45-007.)
- **Unavailable-model semantics**: spawn-time ordered fallthrough; exhausted or
  empty chain → inline at the orchestrator's model with the degrade stated; the
  offline producer applies schema-level resolution only and exits non-zero only
  for invalid config. Rationale: a deterministic offline producer cannot sample
  runtime availability, and the recorded fallback decision (AD-45-001) plus
  issue #201's fail-closed rule already fix the outcome. (AD-45-006.)

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Per-pass picker UX in issue #154 settings | #154 owns the searchable/bulk/fallback-chain UI primitives; 45 provides the data, #154 provides the UI | #154 implementation phase |
| Per-instance (per-subagent) granularity | Not required now; if a future feature needs it, the config schema can be extended | When a use case justifies it |

### Evidence

Compact grounding rows for the Product half (base row per
`evidence-grounding/references/ROWS.md`):

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| `passes` is a new top-level root key mapping the closed pass vocabulary (`review-*`, `verify`, `classify`, `debt`) to `{model, thinking}`; `inherit` default; `auto` sanctioned; fail-closed inline at the orchestrator's model | forge | https://github.com/gtrabanco/agentic-workflow/issues/201 (Mechanics 1; fetched 2026-09-09) | issue state: open at fetch | current | proven | — |
| Producer vehicle: feature 43's `aw` crate with a reserved `resolve-passes` subcommand; execution ladder `aw` → `.mjs` → prose contract | forge | https://github.com/gtrabanco/agentic-workflow/issues/196 (Mechanics; fetched 2026-09-09) | issue state: open at fetch | current | proven | — |
| Ordered fallback chain per route: tried in the operator's order, first resolvable-and-authenticated model applied | forge | https://github.com/gtrabanco/agentic-workflow/issues/154 (Expected behaviour: Fallback order; fetched 2026-09-09) | issue state: open at fetch | current | proven | — |
| Pi config roots are exactly `default`, `commands`, `onUnavailableRoute`; strict validator semantics | repository | `packages/pi-agentic-workflow/src/config/schema.ts:17` (ROOT_KEYS) | HEAD at write | current | proven | — |
| Pi config validation lives in the pi package; the schema package holds no RouteFile validator and the pi package does not depend on it | repository | `packages/pi-agentic-workflow/package.json` (no schema-pkg dependency); `packages/agentic-workflow-schema/src/` (grep RouteFile: none) | HEAD at write | current | proven | — |
| `docs/CAPABILITIES.md` exists as an unseeded template — 13 placeholder subsystem rows, placeholder Roles row | repository | `docs/CAPABILITIES.md` | HEAD at write | current | proven | — |
| Roadmap row 43 is `producer-package` (issue #196); row 45 exists with status `defined`, deps `43` (written by this feature's repair batch, SF-45-002) | document | `docs/features/ROADMAP.md:53,55` | HEAD at write | current | proven | — |
| No `packages/agentic-workflow` package exists; only `agentic-workflow-schema` and `pi-agentic-workflow` | repository | `ls packages/` | HEAD at write | current | proven | — |
| Exhaustion/empty chain → inline at the orchestrator's model, degrade stated; offline producer exits non-zero only for invalid config | user | `decisions.md` AD-45-001 + AD-45-006 (2026-09-09); issue #201 fail-closed rule | dated rows | not-applicable | decision | — |
| No project invariants document declared | ledger | `REPOSITORY_STATE.md` F010 | snapshot 2026-08-30 | current | proven | — |
| `auto` carries no separate trust gate: the project config file is not read while the project is untrusted (S11), and the settings console refuses project-scope edits while untrusted | repository | `packages/pi-agentic-workflow/src/config/load.ts` (S11 note + `projectTrusted` gate); `packages/pi-agentic-workflow/src/settings/console.ts:156` | HEAD at write | current | proven | — |

### Spec-lint (mechanical — presence checks only)

Product boxes (each box greps **only the Product-half sections above this
block**, per the box wording — the lint block's own text is out of scope):

- [x] No template placeholders left in the product half —
      `sed -n '/^## Product half/,/^### Spec-lint/p' docs/features/45-operator-approved-model-routing/SPEC.md | grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'` → no output (exit 1)
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 6 bullets
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank rows; every `n/a` carries its reason inline
- [x] Integration closure has one row per subsystem listed in
      `docs/CAPABILITIES.md` (or, when the project has no inventory, per the
      derived inventory recorded in the section) — zero subsystems skipped. 13/13 CAPABILITIES.md rows walked (1 in-scope, 12 `n/a` with reasons) + 6 derived project subsystem rows; inventory status recorded (exists, unseeded)
- [x] Every capability's role matrix lists EVERY role in the capability
      inventory with an explicit `allowed`/`denied` — inventory Roles table is an unseeded placeholder; derived roles listed explicitly: operator allowed, orchestrating agent allowed, spawned pass denied
- [x] `### Expectation sweep` has ≥ 10 resolved rows (M/L) or ≥ 5 (XS/S);
      every row's resolution is `in-scope`, `out-of-scope`, or `deferred`
      with a pointer — an unresolved or pointer-less row FAILs. 13 rows, all `in-scope` with pointers
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion (same
      wording or an explicit reference) — an in-scope item with no criterion
      FAILs. 1→AC11/AC3 · 2→AC2/AC5/AC12 · 3→AC5/AC14 · 4→AC1/AC4/AC8/AC12 · 5→AC6 · 6→AC7 · 7→AC13 · 8→AC1–AC5, AC9–AC12
- [x] Every Acceptance criterion is a runnable command OR labelled
      `read-verified` — all 14 labelled: 12 `command-verified` (piped `printf | aw resolve-passes`, `grep`, `bun test`), 2 `read-verified` (AC6, skill-contract behaviour; AC14, existing loader/console trust-gate behaviour)
- [x] `### Deferred decisions` exists; every row has a decide-by trigger, or
      the section reads `none` — 2 rows, both with triggers

## Design status

`designed` — repaired product half (batches SF-45-001…SF-45-011 and
SF-45-012…SF-45-015): capability closure complete, all expectation sweep rows
resolved, spec-lint product boxes ticked on the bounded runs pasted above.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals

The architectural outcomes — not implementation detail.

### Architecture impact

How the feature interacts with the project's architecture and layering
(as defined in its architecture doc). State the invariants the
implementation must hold (e.g. "outer-layer-only — no changes to the
core/domain layer"). If the feature touches the core/domain, justify it
here.

### Design

The substantive technical content: entities, ports, adapters, schema,
data shapes, algorithms, state machines. Pre-resolve every decision the
implementer would otherwise have to guess. Close inherited open
questions explicitly. This is the section that most reduces
implementation risk — if it is vague, the implementation improvises.

### Planning evidence

One compact row per Engineering claim that a phase relies on — never an
exploration transcript. M/L units freeze this table in
`planning-evidence.md` and leave the heading here reading
`see planning-evidence.md`; XS/S units fill it in place.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|

### Obligations

One row per normative behaviour, applicable compatibility invariant, affected use
case, and required failure state — the completeness map `execute-phase` and
`audit-pr` read. M/L units freeze it in `planning-obligations.md`; XS/S units fill
it in place. Status is `planned | in-progress | verified | n/a | deferred`;
`n/a` requires evidence, and no current-unit obligation may be `deferred` to a
follow-up issue.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|

### Decisions to confirm

Engineering decisions the project lead must make (or has made) before
implementation starts. Record the chosen option and the rationale, so
later reviewers understand the trade-off.

### Testing requirements

What must be tested and how. State the test layer (unit / integration
/ architecture) and any tooling or runtime constraints. The project
prefers integration and architecture tests over heavy mocking.

### Dev scenarios

The situations this feature introduces that must be reproducible in local
dev — happy path **and** failure modes (empty/degraded state, races,
outages, mass changes, data loss). Seed the failure modes from this **fixed
category list** — walk every category and write a scenario or
`n/a: <reason>` (unaided recall under-enumerates; the list makes coverage a
presence check): empty/zero state · invalid or oversized input · permission
denied / wrong role · dependency outage or timeout · concurrent/duplicate
action · limit or threshold hit. For each, name it and state how it is
reached through an **existing** mechanism (queued message, guard threshold,
manual override, stubbed source) — scenarios are orchestration, never new
domain. If the project has a runnable dev-scenario harness, register each
scenario there (dev-gated, never reaching production) and link it here;
otherwise list them as prose.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `<area>:<name>` | the situation | the existing trigger |

### Phases

High-level phase breakdown; detailed tasks are expanded in `TASKS.md`.
**Phases are labelled `P1, P2, …` and called *phases* — never `S1`/`S2` or
"Steps".** `execute-phase <NN>` runs all remaining phases by default; an
explicit `P<n>` runs one atomic phase. Planning (producing the planning artifacts) is done by `plan-feature`
before execution, so it is **not** a numbered phase here. `P1` is the first
implementation phase (it also commits the planning artifacts); the **last phase
is always hardening** (edge cases + the dev-scenario failure modes). For **M/L**,
opening the PR is the final *step* of the hardening phase (its `TASKS.md`
checklist ends with the literal close-out tasks), not a phase of its own. For
**XS/S** (SPEC-only, no `TASKS.md`), list the phases **here, with checkbox
tasks** — **always ≥ 2**: `P1` implementation, final phase `P2 — Hardening & PR`
carrying the literal close-out tasks (fixed wording — see
`docs/fix/_TEMPLATE/SPEC.md` `## Phases`); `execute-phase` ticks this section as
its ledger. Each implementation phase
header is followed by `Layer: <schema/db|domain|api|ui|config/infra|docs|
hardening>. Done-when: <command> → <expected outcome>.` before its task list
(same scaffold as `docs/fix/_TEMPLATE/SPEC.md` `### P1`) — the phase-lint's
"one declared layer" and "machine-checkable done-when" boxes need somewhere to
be filled in, not invented.

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

### Deploy & rollback

Only when shipping needs more than merging: schema migrations and their order,
feature flag (if gradual rollout), config/env changes, and the rollback path
(revert PR? data cleanup?). State **n/a** explicitly when merging is enough.

### Open questions / risks

Known unknowns and risks. Promote to `TASKS.md` if they become
blockers. Mark inherited questions as RESOLVED or DEFERRED with a
pointer to where they are now handled.

### Deliverables

The concrete artifacts the PR contains.

### Post-merge next feature

The expected next feature in the sequence — see `docs/features/ROADMAP.md`.
