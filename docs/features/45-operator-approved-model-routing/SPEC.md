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
   a fallback chain — `default` now accepts either a plain array of
   `provider/modelId` strings (chain form) or a RouteFile object `{model, thinking}`
   where the `model` field also extends from a single `provider/modelId` to also
   accept an array chain. A chain is tried in the operator's order until
   one model is usable (AC11 backward-compat object form, AC3 chain shape). A
   bare-string value (e.g. `"nan/glm5.3-flash"`) is NOT valid — the operator
   must use the object form or the array form.
2. **Per-pass override**: new top-level `passes` key mapping **pass names** (the
   closed pass vocabulary of issue #201: the `review-*` finder passes, `verify`,
   `classify`, `debt`) to `{model, thinking}`, where `model` accepts the same
   single-value or array shape. `model: "inherit"` resolves to the `default`
   chain. Unknown pass names are rejected by the strict-validator rule
   (AC2, AC5, AC12, AC16, AC17); an invalid model reference is likewise a
   validator rejection, reported at the per-pass model path
   `$.passes.<pass-name>.model` per issue #201's Tests first (AC17). `thinking` semantics — valid values, accepted shape,
   absent-entry resolution — are fixed in the `thinking` semantics section below
   (AC18).
3. **`"auto"` model value**: a sanctioned "let the orchestrating agent decide"
   marker — valid but documented as operator-delegated (AC5, AC14).
4. **`resolve-passes` producer**: deterministic producer shipped by feature 43's
   crate as `aw resolve-passes` (issue #196; `.mjs` fallback per its execution
   ladder). It reads `pi-agentic-workflow.json` including `passes`, applies the
   fail-closed resolution rules **in code** (never re-derived by the model before
   each spawn), and emits a byte-stable resolved pass→model/thinking table (JSON)
   on stdout — every pass row carries both resolved fields (the model chain and
   the `thinking` value per the semantics below) (AC1, AC4, AC8, AC12, AC18).
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
   recommendation note (not auto-written) (AC7, AC15).
7. **Golden fixture update**: `docs/workflow/GOLDEN_FIXTURE.md` gains a
   pass-routing smoke test as a model precondition (AC13).
8. **Tests**: schema round-trip for arrays; `resolve-passes` golden fixtures
   (absent → default, chain resolution, `inherit` resolution, `auto` passthrough,
   unresolvable chain → inline, invalid config → exit non-zero) (AC1–AC5, AC9–AC12, AC16, AC17).
9. **Package documentation (README/CHANGELOG, EN+ES same commit)**: the pi
   package README (`README.md` + `README.es.md`) documents the extended
   vocabulary — the new `passes` key with a per-pass entry example and the
   chain-shaped `model`/`default` — and the root CHANGELOG (`CHANGELOG.md` +
   `CHANGELOG.es.md`) records the change; the EN and ES sides of both pairs are
   edited in the same commit (bilingual-doc pairing, `REPOSITORY_STATE.md` F011).
   This claims issue #201's affected-surface pair — the package README is where
   today's `default`/`commands`/`onUnavailableRoute` examples live, so an
   operator reading it must be able to learn `passes` and the chain shapes
   (AC19).

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

#### Pass-entry `thinking` semantics

These fix `thinking` — the second field of every pass entry and of every row of
the resolved table (issue #201 Mechanics 1 names `{model, thinking}` but
enumerates only `model`'s values). Grounded in the existing route vocabulary
(AD-45-008):

1. **Valid values** — exactly the route vocabulary already shipped: a Pi
   thinking level `off|minimal|low|medium|high|xhigh|max`, or `"inherit"`
   (`packages/pi-agentic-workflow/src/config/types.ts` `THINKING_LEVELS` /
   `ThinkingSetting`; the package README documents the same list for today's
   routes). `"inherit"` means "whatever the consuming turn already uses" — the
   same meaning it has on today's routes; unlike `model: "inherit"` it does not
   redirect to any chain, because thinking has no chain to inherit.
2. **Accepted shape** — a single scalar only; no array/chain. A model chain is
   a fallback over model *availability*, which a thinking level does not have:
   a level is always applicable, so there is nothing to fall through to. A
   non-scalar or unknown `thinking` value is a strict-validator rejection
   reported at the per-pass thinking path `$.passes.<pass-name>.thinking`
   (same path convention as the model path; it folds under the "invalid
   types" class of §3 —
   no fourth-plus rejection class is added).
3. **Absent-entry resolution** — the resolved table is fully resolved: every
   pass row carries both fields, so no consumer reasons about optionality
   (mirrors `EffectiveConfig`). An absent `thinking` key — or a whole absent
   pass entry — resolves to `"inherit"`, mirroring the shipped default route
   `{"model": "inherit", "thinking": "inherit"}`; a pass resolved `inline`
   under §4 above carries `thinking: "inherit"` too (no routed level applies to
   an inline run). Otherwise `thinking` is carried verbatim and is never
   rewritten by chain resolution or by `auto`, which apply to `model` only.

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
- [x] Package documentation — `packages/pi-agentic-workflow/README.md` + `README.es.md` document the extended config vocabulary (the `passes` key, per-pass `{model, thinking}` entries, chain-shaped `model`/`default`); root `CHANGELOG.md` + `CHANGELOG.es.md` record the change; each EN+ES pair is edited in the same commit (F011 pairing) · test: AC19

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
| 12 | resolve-passes exits non-zero on config the strict validator rejects | in-scope | AC12 + AC16 + AC17 |
| 13 | An untrusted project's `passes` entry (`"auto"` included) never delegates model choice (issue #201 open question, resolved yes-by-construction) | in-scope | AC14 + §Product decisions (AD-45-007) |
| 14 | The package README (EN+ES) and root CHANGELOG (EN+ES, same commit) document the extended `passes`/chain vocabulary so an operator can learn it from the docs (issue #201 affected-surface pair) | in-scope | AC19 |

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
- [x] AC9 (command-verified): schema rejects invalid array element — a config whose `default` array holds a non-ModelRef value (e.g. `"default": ["nan/glm5.3-flash", 42]`) fails the pi package's strict validator round-trip test (`packages/pi-agentic-workflow/src/config/schema.ts`)
- [x] AC10 (command-verified): alphabetical keys — `bun test scripts/pre-execution-quality.test.mjs` → the model-routing.yml key-order assertion passes with the new `passes` section in place
- [x] AC11 (command-verified): backward compatibility and chain forms — `printf '%s' '{"default":{"model":"nan/glm5.3-flash","thinking":"inherit"}}' | aw resolve-passes` → exit 0 (the existing RouteFile object form accepted after the schema extension, treated as a single-element chain); and `printf '%s' '{"default":["nan/glm5.3-flash"]}' | aw resolve-passes` → exit 0 (the plain-array chain form accepted after the schema extension); and `printf '%s' '{"default":{"model":["nan/cheap","nan/expensive"],"thinking":"high"}}' | aw resolve-passes` → exit 0 (the chain-in-object form with explicit thinking); and `printf '%s' '{"default":"nan/glm5.3-flash"}'` → exit code ≠ 0 (a bare-string `default` is rejected by the existing validator and by the extension; use the object form or the array form). This covers all three accepted `default` shapes.
- [x] AC12 (command-verified): invalid config exits non-zero — `passes` IS a known root key of this feature; an actually-unknown root key is rejected: `printf '%s' '{"default":{"model":"nan/glm5.3-flash","thinking":"inherit"},"bogus":true}' | aw resolve-passes` → exit code ≠ 0; likewise `printf '%s' '{"default":42}' | aw resolve-passes` → exit code ≠ 0 (a number is not a valid RouteFile or array)
- [x] AC13 (command-verified): golden fixture smoke test — `grep -n "pass-routing\|resolve-passes" docs/workflow/GOLDEN_FIXTURE.md` → ≥ 1 match (the smoke test is registered as a model precondition)
- [x] AC14 (read-verified): `auto` needs no trust gate of its own — `packages/pi-agentic-workflow/src/config/load.ts` does not read the project config file while the project is untrusted (S11: a cloned repository must not be able to steer routing) and `src/settings/console.ts` refuses project-scope edits while untrusted, so an untrusted project's `passes` entry — `"auto"` included — is never honored; `"auto"` in the global config is operator-written (AD-45-004, AD-45-007)
- [x] AC15 (command-verified): post-install recommendation note in the two non-bootstrapping surfaces — `grep -in "pass.?routing" skills/ship-roadmap/references/MODEL_ROUTING.md docs/workflow/GOLDEN_FIXTURE.md` → ≥ 1 match in each file, and the matched line(s) form the recommendation note (not auto-written) pointing the operator to configure `default` + `passes` entries. The criterion anchors on the recommendation phrase, not the bare token `passes`: unrelated `passes` occurrences in these files (e.g. the existing audit-prose occurrence at GOLDEN_FIXTURE.md:252) are outside its scope
- [x] AC16 (command-verified): unknown pass name rejected — `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"review-code":{"model":"nan/glm5.3-flash"},"bogus-pass":{"model":"nan/glm5.3-flash"}}}' | aw resolve-passes` → exit code ≠ 0 (the strict validator rejects `passes` keys outside the closed pass vocabulary of issue #201 Mechanics 1: `review-*` finders, `verify`, `classify`, `debt`)
- [x] AC17 (command-verified): invalid model reference rejected with issue #201's reporting shape — `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"review-code":{"model":"nope"}}}' | aw resolve-passes` → exit code ≠ 0 and the rejection is reported at the path `$.passes.review-code.model` (issue #201 Tests first: an invalid pass model reference reports the `$.passes.<pass-name>.model` path); likewise a chain element without the `provider/modelId` shape — `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"verify":{"model":["nan/glm5.3-flash","also-nope"]}}}' | aw resolve-passes` → exit code ≠ 0, reported under the same `$.passes.<pass-name>.model` path prefix (element rejections carry the array index). This is the fourth strict-validator rejection class of semantics §3
- [x] AC18 (command-verified): `thinking` carried and resolved per the semantics section — `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"debt":{"model":"nan/qwen3.6","thinking":"high"}}}' | aw resolve-passes` → exit 0, resolved `passes.debt.thinking` == `"high"` and `passes.review-code.thinking` == `"inherit"` (absent `thinking` → `"inherit"`, mirroring the shipped default route); and `printf '%s' '{"default":["nan/glm5.3-flash"],"passes":{"verify":{"model":"auto","thinking":["high"]}}}' | aw resolve-passes` → exit code ≠ 0 (non-scalar `thinking` rejected at the `$.passes.<pass-name>.thinking` path, the invalid-types class of semantics §3)
- [x] AC19 (command-verified): README/CHANGELOG (EN+ES, same commit) document the claimed affected-surface pair — `grep -n '"passes"' packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 match in each README, each match part of the documented config example / vocabulary line for the new `passes` key and the chain-shaped `model`/`default` (docs, not code); and `grep -cin "pass.?routing\|passes config" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 matching line in each CHANGELOG (the version row documenting this feature). Verified at HEAD `e13096d3` before the docs land: `"passes"` → 0 matches in both READMEs and the CHANGELOG anchor → 0/0 (exit 1), so the criterion is achievable and decidable once the docs land (the pre-verified anchoring SF-45-019 introduced). The EN and ES sides of each pair are edited in the same commit (F011); the root README/README.es are not part of this pair — issue #201 names the package README and the CHANGELOG

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
| The two post-install recommendation surfaces exist — ship-roadmap's model-routing reference and the golden-fixture procedure doc | repository | `skills/ship-roadmap/references/MODEL_ROUTING.md`; `docs/workflow/GOLDEN_FIXTURE.md` | HEAD at write | current | proven | — |
| The issue-#201 README/CHANGELOG EN+ES surfaces all exist; the package README (`README.md:73-92` + `README.es.md:75-93`) documents today's `default`/`commands`/`onUnavailableRoute` vocabulary incl. the `thinking` bullet, and carries no `"passes"` key or pass-routing/CHANGELOG anchor yet (`grep -n '"passes"'` both READMEs → 0 matches; `grep -cin "pass.?routing\|passes config"` both CHANGELOGs → 0/0, exit 1) — so AC19's anchors are genuinely new doc work and decidable | repository | `packages/pi-agentic-workflow/README.md`; `packages/pi-agentic-workflow/README.es.md`; `CHANGELOG.md`; `CHANGELOG.es.md` (grep run 2026-09-09 at HEAD `e13096d3`) | HEAD at write | current | proven | — |
| `thinking`'s valid values are the route vocabulary already shipped: `THINKING_LEVELS` = `off|minimal|low|medium|high|xhigh|max`, `ThinkingSetting` = level or `"inherit"`; the shipped default route is `{"model": "inherit", "thinking": "inherit"}`, and validator rejections are addressed by a JSON-path-ish `ConfigIssue.path` | repository | `packages/pi-agentic-workflow/src/config/types.ts` (THINKING_LEVELS, ThinkingSetting, Route, ConfigFile, ConfigIssue); `packages/pi-agentic-workflow/README.md:86,90-91` (shipped default route + vocabulary bullet) | HEAD at write | current | proven | — |

### Spec-lint (mechanical — presence checks only)

Product boxes (each box greps **only the Product-half sections above this
block**, per the box wording — the lint block's own text is out of scope):

- [x] No template placeholders left in the product half —
      `sed -n '/^## Product half/,/^### Spec-lint/p' docs/features/45-operator-approved-model-routing/SPEC.md | grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'` → no output (exit 1)
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 6 bullets
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank rows; every `n/a` carries its reason inline
- [x] Integration closure has one row per subsystem listed in
      `docs/CAPABILITIES.md` (or, when the project has no inventory, per the
      derived inventory recorded in the section) — zero subsystems skipped. 13/13 CAPABILITIES.md rows walked (1 in-scope, 12 `n/a` with reasons) + 7 derived project subsystem rows; inventory status recorded (exists, unseeded)
- [x] Every capability's role matrix lists EVERY role in the capability
      inventory with an explicit `allowed`/`denied` — inventory Roles table is an unseeded placeholder; derived roles listed explicitly: operator allowed, orchestrating agent allowed, spawned pass denied
- [x] `### Expectation sweep` has ≥ 10 resolved rows (M/L) or ≥ 5 (XS/S);
      every row's resolution is `in-scope`, `out-of-scope`, or `deferred`
      with a pointer — an unresolved or pointer-less row FAILs. 14 rows, all `in-scope` with pointers
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion (same
      wording or an explicit reference) — an in-scope item with no criterion
      FAILs. 1→AC11/AC3 · 2→AC2/AC5/AC12/AC16/AC17 · 3→AC5/AC14 · 4→AC1/AC4/AC8/AC12/AC18 · 5→AC6 · 6→AC7/AC15 · 7→AC13 · 8→AC1–AC5, AC9–AC12, AC16, AC17 · 9→AC19
- [x] Every Acceptance criterion is a runnable command OR labelled
      `read-verified` — all 19 labelled: 17 `command-verified` (piped `printf | aw resolve-passes`, `grep`, `bun test`), 2 `read-verified` (AC6, skill-contract behaviour; AC14, existing loader/console trust-gate behaviour)
- [x] `### Deferred decisions` exists; every row has a decide-by trigger, or
      the section reads `none` — 2 rows, both with triggers

## Design status

`designed` — repaired product half (batches SF-45-001…SF-45-011,
SF-45-012…SF-45-015, SF-45-016…SF-45-018, SF-45-019, and SF-45-020…SF-45-022):
capability closure complete, all expectation sweep rows resolved, spec-lint
product boxes ticked on the bounded runs pasted above.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold`, only once the Product
half above is marked `designed`.

### Technical goals
### Technical goals

- One strict-validated config vocabulary that covers both routed command turns
  and mid-turn spawned passes, so every model an agent runs is either
  operator-configured or an explicitly delegated `"auto"`.
- A deterministic offline producer (`resolve-passes`) that applies the
  fail-closed resolution rules **in code** and emits a byte-stable resolved
  pass→model/thinking table — the model is never re-derived before a spawn.
- A skill-side spawn contract that never improvises a model: ordered chain
  fallthrough at spawn time, and a fail-closed inline degrade at the
  orchestrator's model with the degrade stated in the report.

### Architecture impact

`n/a: no project invariants declared` (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`
absent — `REPOSITORY_STATE.md` F010; planning-preflight Stage 2 below records
the final classification).

- **Pi package — config module only.** The change lives in
  `packages/pi-agentic-workflow/src/config/` (`types.ts`, `schema.ts`,
  `merge.ts`) plus the chain-aware consumption in `src/routing/dispatch.ts`.
  The domain layer stays Pi-free (the existing pattern: `THINKING_LEVELS`
  mirrored in `types.ts`, never imported from Pi). The settings console
  (`src/settings/console.ts`) is untouched — picker UX is issue #154.
- **No new skill.** `review-change` and `init-workspace` gain wording and one
  reference step each; every SKILL.md edit must stay within the enforced
  context budgets (`bun scripts/check-skill-context.mjs`) and be re-bundled
  into the pi package mirror (`bun run bundle:skills`,
  `test/alias-coverage.test.mjs` reads both trees).
- **Bilingual pairing (F011).** The two documentation pairs this feature
  edits — the package README (`README.md` + `README.es.md`) and the root
  CHANGELOG (`CHANGELOG.md` + `CHANGELOG.es.md`) — are edited EN+ES in the
  same commit. `GOLDEN_FIXTURE.md` has an `.es.md` sibling: its EN edit and
  ES sibling land in the same commit too. Skills and SPECs stay English-only.
- **Claude-branch sync safety.** `model-routing.yml` gains a non-skill
  top-level `passes` section; the frontmatter injector
  (`.github/scripts/inject_claude_frontmatter.py`) currently treats *every*
  top-level key as a skill, so it must skip non-skill keys or the
  `sync-claude` workflow fails (PE-011).

### Design

#### Config vocabulary (pi package, `src/config/types.ts`)

```ts
export const PASS_NAMES = [
  "review-code", "review-security", "review-verify", "review-design",
  "review-a11y", "review-brand", "review-perf", "review-seo",
  "verify", "classify", "debt",
] as const;                                  // closed vocabulary — issue #201 Mechanics 1
export type PassName = (typeof PASS_NAMES)[number];

export type ModelChain = readonly ModelRef[];              // ordered fallback chain
export type RouteModelSetting = ModelSetting | ModelChain; // default / commands routes
export type PassModelSetting = "auto" | RouteModelSetting; // passes entries add `auto`

export interface PassEntry { model?: PassModelSetting; thinking?: ThinkingSetting; }

// RouteFile.model widens from ModelSetting to RouteModelSetting (both
// `default` and `commands` entries may carry a chain).
export interface ConfigFile {
  default?: RouteFile;
  commands?: Record<string, RouteFile>;
  onUnavailableRoute?: UnavailableRoutePolicy;
  passes?: Partial<Record<PassName, PassEntry>>;
}
```

`THINKING_LEVELS` / `ThinkingSetting` / `ModelRef` / `ConfigIssue` are
unchanged. `"auto"` is valid **only** in `passes` entries (D-E45-4): a global
`default` of `auto` is meaningless — the default already *is* the
orchestrator's model.

#### Strict validator (`schema.ts`)

- `ROOT_KEYS` gains `passes`. `default` accepts exactly three forms
  (AD-45-009): the existing RouteFile object (its `model` now scalar-or-chain),
  a plain array of ModelRef (implicit `thinking: "inherit"`), and a
  chain-in-object (`{model: [...], thinking: <level|inherit>}`). A bare string
  stays a rejection, reported at `$.default`.
- A `passes` entry is checked like a route, plus: unknown pass name → issue at
  `$.passes.<key>`; `model` additionally accepts `"auto"` and array chains;
  `thinking` stays scalar-only (no chain — semantics §2). Rejection paths:
  `$.passes.<pass-name>.model` (chain-element rejections carry the index,
  `$.passes.<pass-name>.model[1]`) and `$.passes.<pass-name>.thinking`
  (folds under the existing "invalid types" class — no new class).

#### Runtime chain consumption (`merge.ts`, `routing/dispatch.ts`)

- `resolveRoute` picks `model` as a whole value (project value replaces global;
  chains are never spliced — a project that overrides a chain restates the
  full operator order, D-E45-3). `thinking` keeps the existing key-granularity
  rule. `mergeConfigs` carries `passes` entries project-over-global at
  entry granularity; the turn router itself never consumes `passes`.
- `dispatch.ts` consumes a chain by trying entries in the operator's order
  against its existing model-registry check; the first usable entry wins
  (semantics §1). A chain exhausted with no usable entry follows the existing
  `onUnavailableRoute` policy (`stop` | `inherit`) — the command-turn analogue
  of AD-45-001's fail-closed rule, reusing the shipped mechanism.

#### resolve-passes producer (`scripts/resolve-passes.mjs`)

- **Invocation contract** (fixed by the SPEC's ACs): reads one JSON config
  from stdin, writes the resolved table as JSON to stdout, exit 0 on valid
  config, exit ≠ 0 on config the strict validator rejects; validator issues
  go to stderr, one JSON object per line (`{"path": …, "message": …}`) using
  the same paths as the pi package validator.
- **Resolved table shape** (D-E45-5, byte-stable):

  ```json
  {
    "default": { "model": ["nan/glm5.3-flash"], "thinking": "inherit" },
    "passes": {
      "review-code": { "model": ["nan/qwen3.6"], "thinking": "inherit" },
      "verify":      { "model": "auto", "thinking": "inherit" },
      "debt":        { "model": "inline", "thinking": "inherit", "reason": "no default chain" }
    }
  }
  ```

  `default` first, then every pass of the closed vocabulary in issue #201
  Mechanics 1's order. Every row carries both fields. Row `model` values:
  the resolved chain array (`"inherit"` and absent entries resolve to the
  default chain; scalar refs resolve to a one-element chain), `"auto"`
  carried verbatim, or `"inline"` when no default chain exists (absent or
  empty `default`, or an entry that yields no chain) with
  `"reason": "no default chain"` and `thinking: "inherit"` (semantics §2/§4).
  `thinking` is carried verbatim, absent → `"inherit"`, never rewritten
  (semantics §3). No timestamps, no environment data — two runs on the same
  input are byte-identical (AC8). Fixed key order = the declaration order
  above; a stable JSON serialization, no pretty-printing variation.
- **Vehicle**: self-contained zero-dependency `.mjs` at the repository's
  deterministic-scripts home (`scripts/`), runnable bun-first / node-fallback
  per the repo's runtime convention. `aw resolve-passes` (feature 43's crate,
  issue #196) is the execution ladder's top rung once feature 43 lands; the
  script is written so the crate can absorb it verbatim, and the skills'
  documented ladder is `aw resolve-passes` → `bun|node scripts/resolve-passes.mjs`
  → prose contract, degradation declared (D-E45-1).

#### Skill contracts (wording only)

- `review-change/SKILL.md` isolation rule: each pass's model comes from the
  resolved table (via the ladder above) — never re-derived. A pass whose
  chain cannot provide a model at spawn-time runs inline at the orchestrator's
  model and the report states the degrade (AC6, semantics §2).
- `references/ADVERSARIAL_SETUP.md`: `--adversarial N` assigns the N reviewers
  models round-robin from the per-pass chain (wraps when N > chain length;
  `inherit` uses the global chain; `auto` = host-agent choice, sanctioned by
  AD-45-004) (AC6, AD-45-005).
- `init-workspace/references/BOOTSTRAP_WRITE.md` + `UPGRADE.md`: a pass-routing
  interview step writing `default` + recommended `passes` entries for the
  review family into `pi-agentic-workflow.json` (upgrade mode: additive-only
  block) (AC7).

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Pi config roots are exactly `default`, `commands`, `onUnavailableRoute`; the validator is strict with JSON-path-ish issue reporting | repository | `packages/pi-agentic-workflow/src/config/schema.ts:14,97-104` | HEAD 02b12676 | O9, O12, D-E45-2 | current | proven | — |
| PE-002 | `checkRoute` requires route values to be records; a bare-string `default` and `42` are rejections today; `model` must be `inherit` or `provider/modelId` | repository | `packages/pi-agentic-workflow/src/config/schema.ts:59-98` | HEAD 02b12676 | O11 | current | proven | — |
| PE-003 | `THINKING_LEVELS` = `off…max`, `ThinkingSetting` = level or `inherit`; `ModelRef` = `provider/modelId`, split at the first slash | repository | `packages/pi-agentic-workflow/src/config/types.ts:8-16,24-28` | HEAD 02b12676 | O1, O18 | current | proven | — |
| PE-004 | Pi package test command is `tsc && bun test test/*.test.mjs` (node fallback `test:node`) | repository | `packages/pi-agentic-workflow/package.json` scripts | HEAD 02b12676 | P1 done-when | current | proven | — |
| PE-005 | Command-turn dispatch consumes `effectiveRoute(...).model` via `parseModelReference` plus a model-registry check, with the `onUnavailableRoute` policy as the unavailable-model outcome | repository | `packages/pi-agentic-workflow/src/routing/dispatch.ts:219-236` | HEAD 02b12676 | O20, D-E45-3 | current | proven | — |
| PE-006 | Merge granularity is the individual route key, project over global; inputs are validated files | repository | `packages/pi-agentic-workflow/src/config/merge.ts` | HEAD 02b12676 | O20 | current | proven | — |
| PE-007 | Deterministic scripts live at `scripts/*.mjs` with tests at `scripts/*.test.mjs` run `bun test`; bun-first / node-fallback is the repo runtime convention | repository | `scripts/` tree; `CLAUDE.md` "Runtime convention" | HEAD 02b12676 | D-E45-1, P2 done-when | current | proven | — |
| PE-008 | Execution ladder for deterministic producers: `aw` binary → `.mjs` (node/bun) → prose contract, degradation declared; `resolve-passes` is reserved to feature 43's crate | forge | https://github.com/gtrabanco/agentic-workflow/issues/196 (Mechanics; fetched 2026-09-09) | issue open at fetch | O1–O5, D-E45-1 | current | proven | — |
| PE-009 | Closed pass vocabulary: `review-code, review-security, review-verify, review-design, review-a11y, review-brand, review-perf, review-seo, verify, classify, debt` | forge | https://github.com/gtrabanco/agentic-workflow/issues/201 (Mechanics 1; fetched 2026-09-09) | issue open at fetch | O1, O16, D-E45-5 | current | proven | — |
| PE-010 | `model-routing.yml` top-level keys must stay alphabetical; pinned at the model-routing assertion of `scripts/pre-execution-quality.test.mjs` (line 482) | repository | `docs/workflow/model-routing.yml`; `scripts/pre-execution-quality.test.mjs:482` | HEAD 02b12676 | O10 | current | proven | — |
| PE-011 | The claude-branch injector iterates every top-level key of `model-routing.yml` as a skill name and exits non-zero when the matching `skills/` SKILL.md entry has no `name:` line — a non-skill `passes:` key would break the `sync-claude` workflow | repository | `.github/scripts/inject_claude_frontmatter.py` (`for name, cfg in routing.items()`); `.github/workflows/sync-derived-branches.yml` | HEAD 02b12676 | O10 | current | proven | — |
| PE-012 | `BOOTSTRAP_WRITE.md` carries numbered write-verify steps (step 10 seeds the urgency labels); `UPGRADE.md` carries seven ordered steps with additive-only writes | repository | `skills/init-workspace/references/BOOTSTRAP_WRITE.md`; `skills/init-workspace/references/UPGRADE.md` | HEAD 02b12676 | O7 | current | proven | — |
| PE-013 | `GOLDEN_FIXTURE.md` has a "Tool-calling smoke test (model precondition)" section (line 149) as the pattern the pass-routing smoke test joins; the unrelated `passes` prose at line 252 is outside AC15's scope | repository | `docs/workflow/GOLDEN_FIXTURE.md:149,252` | HEAD 02b12676 | O13, O15 | current | proven | — |
| PE-014 | Ship-roadmap's model-routing reference exists and carries the stage/tier table including the cheap-worker row the pass tiers mirror | repository | `skills/ship-roadmap/references/MODEL_ROUTING.md` | HEAD 02b12676 | O15 | current | proven | — |
| PE-015 | The package README documents today's config vocabulary at `README.md:73-92` / `README.es.md:75-93` and carries no `"passes"` key yet (grep → 0 matches, pre-verified 2026-09-09 per SPEC Evidence E13) | repository | `packages/pi-agentic-workflow/README.md`; `packages/pi-agentic-workflow/README.es.md` | HEAD 02b12676 | O19 | current | proven | — |
| PE-016 | Root CHANGELOG carries bilingual version tables + a companion-package table; rendered-facts pins `version-tables`/`package-versions` equality | repository | `CHANGELOG.md`; `CHANGELOG.es.md`; `CLAUDE.md` rendered-facts@1 | HEAD 02b12676 | O19 | current | proven | — |
| PE-017 | Skill edits must be re-bundled (`bun run bundle:skills`) — the committed `packages/pi-agentic-workflow/skills/` mirror stays byte-identical and `test/alias-coverage.test.mjs` reads both trees | repository | `CLAUDE.md` Verification + normalizer-inventory@1 | HEAD 02b12676 | O22 | current | proven | — |
| PE-018 | `review-change`'s isolation rule (passes run in isolation, "its own tier or stronger") and `ADVERSARIAL_SETUP.md`'s fixed reviewer contract are the insertion points for the model-resolution contract | repository | `skills/review-change/SKILL.md:100-110`; `skills/review-change/references/ADVERSARIAL_SETUP.md` | HEAD 02b12676 | O6 | current | proven | — |
| PE-019 | Feature 43 (`producer-package`) is `idea` — no crate and no `aw` binary exist; the ladder's `.mjs` tier is the executable vehicle this feature ships | repository | `ls packages/` (only `agentic-workflow-schema`, `pi-agentic-workflow`); `docs/features/ROADMAP.md` row 43 | HEAD 02b12676 | D-E45-1 | current | proven | — |
| PE-020 | Current versions: `review-change` 3.5.0, `init-workspace` 2.8.0, `@gtrabanco/pi-agentic-workflow` 0.7.2 | repository | skill frontmatter; `packages/pi-agentic-workflow/package.json:3` | HEAD 02b12676 | O19, O22 | current | proven | — |
| PE-021 | Human workflow documentation is bilingual when paired; skills, SPECs, and machine config are English-only | ledger | `REPOSITORY_STATE.md` F011 | snapshot 2026-08-30 | O21 | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1 | Absent pass entry + default chain → pass = default chain | P2 | task 2 | execute-phase | `printf '%s' '{"default":["nan/glm5.3-flash"]}' \| aw resolve-passes` (or `.mjs`) → exit 0, rows = default chain | test row in `scripts/resolve-passes.test.mjs` | planned |
| O2 | AC2 | `inherit` pass entry → default chain | P2 | task 2 | execute-phase | AC2 command → resolved chain equals default chain | test row | planned |
| O3 | AC3 | Per-pass override wins over the default chain | P2 | task 3 | execute-phase | AC3 command → `["nan/expensive"]` vs default | test row | planned |
| O4 | AC4 | No default chain → inline + `no default chain` reason (absent/empty default, no-yield entry) | P2 | task 4 | execute-phase | AC4 commands → exit 0, inline rows with reason | test row | planned |
| O5 | AC5 | `auto` carried verbatim | P2 | task 6 | execute-phase | AC5 command → row contains `"auto"` | test row | planned |
| O6 | AC6 | review-change consumes the resolved table; round-robin with wrap; spawn-time degrade stated in report | P3 | tasks 1–3 | execute-phase | grep anchors (SKILL.md + ADVERSARIAL_SETUP.md name the resolved table, round-robin wrap, inline degrade) — read-verified | AC6 grep output pasted | planned |
| O7 | AC7 | init-workspace writes `default` + recommended `passes` entries in bootstrap and upgrade | P4 | task 1 | execute-phase | AC7 grep → pass-routing step in both references | grep output | planned |
| O8 | AC8 | Byte stability: same input → byte-identical stdout | P2 | tasks 7–8 | execute-phase | two-run byte-identical assertion green | test row | planned |
| O9 | AC9 | Schema rejects non-ModelRef array element | P1 | task 6 | execute-phase | package suite: rejection case green | test name in package `test/` | planned |
| O10 | AC10 | model-routing.yml keys stay alphabetical with the `passes` section in place; claude-branch injector tolerates non-skill keys | P1 | task 8 | execute-phase | `bun test scripts/pre-execution-quality.test.mjs` → exit 0 | exit code pasted | planned |
| O11 | AC11 | Three accepted `default` forms resolve; bare string rejected | P1 | tasks 2, 5 / P2 task 3 | execute-phase | AC11 commands → 3× exit 0 + 1× exit ≠ 0 | test rows both suites | planned |
| O12 | AC12 | Unknown root key / invalid types → exit ≠ 0 | P2 | task 5 | execute-phase | AC12 commands → exit ≠ 0 | test rows in `scripts/resolve-passes.test.mjs` AND the package rejection suite (D-E45-2 pinning) | planned |
| O13 | AC13 | Pass-routing smoke test registered as a model precondition in GOLDEN_FIXTURE.md (EN+ES same commit) | P4 | task 3 | execute-phase | AC13 grep → ≥ 1 match | grep output | planned |
| O14 | AC14 | `auto` needs no gate of its own: untrusted project config never read (S11); verified as existing behavior | P1 | task 5 (assertion in suite) | execute-phase | AC14 read-verified: loader/console gates re-checked in the suite notes | suite note + read check | planned |
| O15 | AC15 | Recommendation note (not auto-written) in ship-roadmap MODEL_ROUTING.md + GOLDEN_FIXTURE.md, anchored on the recommendation phrase | P4 | task 2 | execute-phase | AC15 grep → ≥ 1 match per file, matched lines are the note | grep output | planned |
| O16 | AC16 | Unknown pass name rejected (closed vocabulary) | P2 | task 5 | execute-phase | AC16 command → exit ≠ 0 | test rows in both suites (D-E45-2 pinning) | planned |
| O17 | AC17 | Invalid model reference rejected at `$.passes.<pass-name>.model` (indexed elements) | P2 | task 5 | execute-phase | AC17 commands → exit ≠ 0 with the path in stderr | test rows in both suites + stderr sample | planned |
| O18 | AC18 | `thinking` carried verbatim, absent → `inherit`, non-scalar rejected at `$.passes.<pass-name>.thinking` | P2 | task 6 | execute-phase | AC18 commands → exit 0 values + exit ≠ 0 | test rows in both suites | planned |
| O19 | AC19 (README half) | Package README EN+ES document the `passes` key + chain-shaped `default`/`model`; pair edited in one commit | P4 | task 4 | execute-phase | `grep -n '"passes"' packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 match per file; `git log --name-only` shows both sides in one commit | grep output + commit list | planned |
| O20 | Scope item 1 + semantics §1 (runtime consumer) | Command-turn dispatch consumes chains in operator order; exhausted → existing `onUnavailableRoute` policy | P1 | task 4 | execute-phase | package suite incl. dispatch chain tests → exit 0 | test names pasted | planned |
| O21 | AC19 (CHANGELOG half) | Root CHANGELOG EN+ES record the change ("passes config"/"pass routing" anchor) + companion-package row for the pi minor bump; pair edited in one commit | P4 | task 5 | execute-phase | `grep -cin "pass.?routing\|passes config" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each; `git log --name-only` shows both sides in one commit | grep output + commit list | planned |
| O22 | CLAUDE.md bilingual rule / F011 | `GOLDEN_FIXTURE.md` and its `.es.md` sibling land in the same commit | P4 | task 3 | execute-phase | `git log --name-only` → both sides listed in the same commit | commit output | planned |
| O23 | CLAUDE.md Verification (mirror parity + budgets) | Skills mirror re-bundled after the last skills edit; context budgets green | P4 | task 6 | execute-phase | `bun run bundle:skills`; `bun scripts/check-skill-context.mjs` → PASS | exit codes | planned |

### Decisions to confirm

- **D-E45-1 — producer home.** The `.mjs` fallback is a self-contained
  zero-dependency `scripts/resolve-passes.mjs` at the repo's deterministic
  scripts home, runnable bun-first / node-fallback. `aw resolve-passes`
  (feature 43's crate) stays the ladder's top rung once feature 43 lands; the
  script is written so the crate can absorb it verbatim (PE-008, PE-019).
  Chosen over a pi-package CLI entry: the producer must be reachable from
  every agent's skills tree, not only pi installs, and the repo's script
  tests convention (`bun test scripts/*.test.mjs`) applies as-is.
- **D-E45-2 — bounded vocabulary duplication, pinned by fixtures.** The pi
  package schema remains the config-validation authority for the extension;
  the producer re-states the same accept/reject rules in its own code. The
  two are pinned equal by the shared AC case table (every AC command case
  appears in both `test/config-*.test.mjs` and `scripts/resolve-passes.test.mjs`),
  so drift fails one of the two suites. Feature 43's crate unifies the
  vehicle later; until then this is the same pattern the repo already accepts
  (a script and the code it wraps pinned by tests), recorded rather than
  silently duplicated.
- **D-E45-3 — chain merge + runtime consumption.** Chains merge whole-value
  (project chain replaces the global chain — no splicing); command-turn
  dispatch resolves a chain in operator order against the existing registry
  check, exhausted → the existing `onUnavailableRoute` policy. Grounded in
  scope item 1's own chain semantics and `dispatch.ts`'s shipped
  registry/policy behavior (PE-005); no new runtime mechanism invented.
- **D-E45-4 — `auto` scope.** `"auto"` is valid only in `passes` entries. A
  global `default` of `auto` is a contradiction (the default is what the
  orchestrator already runs); the validator rejects it at `$.default.model`.
- **D-E45-5 — resolved-table shape.** Fixed JSON: `default` row + one row per
  closed-vocabulary pass in issue #201 Mechanics 1's order; rows carry both
  fields; `reason` appears only on `inline` rows; scalar refs resolve to
  one-element chains; no timestamps. This is what makes AC1–AC5, AC8, AC18
  mechanically decidable.
- **D-E45-6 — injector tolerance.** `inject_claude_frontmatter.py` skips
  top-level keys with no matching skill directory under `skills/`, so
  `model-routing.yml` can carry the `passes` section without breaking the
  `sync-claude` workflow (PE-011). Skill keys keep the current behavior.
- **D-E45-7 — size confirmed.** Size stays **S** (SPEC + ACCEPTANCE.md only,
  phases ledgered in the SPEC): five phases, none multi-layer, no unresolved
  design decision — the mandatory split rule is not triggered at exactly five
  phases; a sixth phase or any multi-layer phase would trigger the split.

### Testing requirements

- Pi package: `bun run test` (`tsc && bun test test/*.test.mjs`; node fallback
  `test:node`) — table-driven round-trip for the extended vocabulary; every
  rejection asserts its exact issue path (no `assert.throws` without path).
  Prefer table-driven fixtures over per-case mocks; the package prefers
  integration tests.
- Producer: `bun test scripts/resolve-passes.test.mjs` — golden fixtures for
  every AC case (absent → default, chain resolution, inherit, auto
  passthrough, unresolvable → inline, invalid config → non-zero) plus the
  two-run byte-identical assertion. Node fallback exercised via
  `node --test` on the same fixtures (CI node-compat).
- Repo gates touched by this feature: `bun test scripts/pre-execution-quality.test.mjs`
  (alphabetical model-routing keys), `bun scripts/check-skill-context.mjs`
  (context budgets after skill edits), `bun run bundle:skills` mirror parity
  (`test/alias-coverage.test.mjs`), `npx skills add . --list`.
- No runtime model availability is ever sampled in tests (the producer is
  offline by contract); spawn-time behavior is verified as skill wording
  (read-verified), never as a mocked spawn.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `resolve-passes:no-default` | empty/zero state — config with no `default` (or `"default": []`) → every pass inline with the `no default chain` reason | existing mechanism: pipe `{}` / `{"default":[]}` to `resolve-passes` (AC4 fixture) |
| `resolve-passes:invalid-config` | invalid or oversized input — unknown root key, `42` default, non-ModelRef element, non-scalar thinking → exit ≠ 0 with the exact path | existing mechanism: piped fixture configs (AC9, AC12, AC16–AC18 fixtures) |
| `resolve-passes:unknown-pass-name` | invalid input against the closed vocabulary — a `bogus-pass` key → exit ≠ 0 | piped fixture (AC16 fixture) |
| `routing:untrusted-project` | permission denied / wrong role — an untrusted project's `passes` entry (with `"auto"`) is never honored | existing mechanism: the S11 project-trust gate (config not read while untrusted) — read-verified suite note (AC14) |
| `spawn:ladder-degradation` | dependency outage — `aw` absent → the skill ladders to `bun|node scripts/resolve-passes.mjs`; a runtime-unavailable model falls through the chain; exhausted → inline degrade stated in the report | documented ladder + spawn-time consumer wording (semantics §1–2, AC6) |
| `spawn:round-robin-wrap` | limit/threshold hit — `--adversarial N` with N > chain length wraps | ADVERSARIAL_SETUP.md round-robin rule, read-verified against a fixture table (AC6) |
| `resolve-passes:byte-stability` | concurrent/duplicate action — two resolution runs on the same input | two-run byte-identical assertion in the fixture suite (AC8) |

### Phases

`P1, P2, …` phases; `execute-phase 45` runs all remaining phases by default,
`execute-phase 45 P1` runs one atomic phase. Detailed rationale lives in this
SPEC's Engineering half; the checkboxes below are the execution ledger.

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

#### P1 — Extended pass-routing config vocabulary

Layer: `config/infra`. Done-when: `cd packages/pi-agentic-workflow && bun run test` →
exit 0 with the new table-driven round-trip and rejection suites green.

- [ ] `types.ts`: add the closed `PASS_NAMES` vocabulary (11 names, issue #201
  Mechanics 1 order), `ModelChain`, `RouteModelSetting`, `PassModelSetting`
  (`"auto"` allowed only in pass entries — D-E45-4), `PassEntry`, and the
  `passes` field on `ConfigFile` (AC2, AC5, AC9 shapes).
- [ ] `schema.ts`: extend `default` validation to the three accepted forms —
  existing RouteFile object (model scalar-or-chain), plain-array chain,
  chain-in-object — keeping the bare-string rejection at `$.default` (AC11).
- [ ] `schema.ts`: validate `passes` entries (route keys model/thinking only;
  `model` additionally accepts `"auto"` and chains; `thinking` scalar only)
  with the exact reporting paths `$.passes.<pass-name>.model` (indexed
  elements) and `$.passes.<pass-name>.thinking`, and the closed pass-name
  vocabulary (AC12, AC16, AC17, AC18).
- [ ] `merge.ts` + `routing/dispatch.ts`: whole-value chain merge
  (project over global); dispatch consumes a chain in operator order against
  the existing registry check, exhausted → the existing `onUnavailableRoute`
  policy (D-E45-3, O20).
- [ ] Package tests: table-driven valid-shape round-trip — object form,
  plain-array chain, chain-in-object, `passes` entries with
  `inherit`/`auto`/scalar/chain models and level/`inherit` thinking (AC2,
  AC5, AC11 valid side).
- [ ] Package tests: table-driven rejection suite covering semantics §3's
  classes with exact paths — non-ModelRef array element (AC9), unknown root
  key and non-record `default` (AC12), invalid model references at
  `$.passes.<pass-name>.model` incl. indexed elements and `auto` outside
  `passes` (AC17, D-E45-4), unknown pass name (AC16), non-scalar `thinking`
  path (AC18); plus the AC14 read-verified note (untrusted-project gates).
- [ ] `docs/workflow/model-routing.yml`: add the alphabetical `passes`
  section (per-pass recommended tiers for the `#claude` branch, mirroring
  ship-roadmap's cheap-worker row) and teach
  `.github/scripts/inject_claude_frontmatter.py` to skip top-level keys with
  no matching skill directory (D-E45-6) — `bun test scripts/pre-execution-quality.test.mjs`
  stays exit 0 (AC10).

#### P2 — resolve-passes producer

Layer: `config/infra`. Done-when: `bun test scripts/resolve-passes.test.mjs` →
exit 0.

- [ ] `scripts/resolve-passes.mjs` CLI contract: read one JSON config from
  stdin, emit the resolved table (D-E45-5 shape) to stdout; exit 0 valid,
  exit ≠ 0 rejected; validator issues to stderr as one JSON object per line
  with the validator's paths (AC1, AC12).
- [ ] Default-chain resolution: a pass with no `passes` entry and a pass with
  `model: "inherit"` both resolve to the `default` chain (AC1, AC2).
- [ ] Per-pass override: a pass with its own model/chain wins; all three
  accepted `default` forms resolve to the operator's order (AC3, AC11).
- [ ] Inline degrade marking: absent/empty `default` or an entry yielding no
  chain → row `model: "inline"`, `reason: "no default chain"`,
  `thinking: "inherit"` (AC4).
- [ ] Strict validation in code: the four rejection classes (unknown root
  key · invalid types · invalid model reference at `$.passes.<pass-name>.model`
  with indexed elements · unknown pass name) → exit ≠ 0 (AC12, AC16, AC17).
- [ ] `thinking` and `auto` handling: verbatim carriage, absent → `"inherit"`,
  non-scalar rejected at the `$.passes.<pass-name>.thinking` path; `auto`
  passed through untouched (AC5, AC18).
- [ ] Byte-stable emission: fixed key order, no timestamps — two runs on the
  same input produce byte-identical stdout (AC8).
- [ ] `scripts/resolve-passes.test.mjs`: golden fixture suite covering the
  full AC case table (AC1–AC5, AC8, AC11, AC12, AC16–AC18), bun-first with
  the same fixtures green under `node --test` (node-compat).

#### P3 — review-change pass-routing contract

Layer: `docs`. Done-when: `grep -n "resolve-passes" skills/review-change/SKILL.md
skills/review-change/references/ADVERSARIAL_SETUP.md` → ≥ 1 match in each.

- [ ] `skills/review-change/SKILL.md` isolation rule: every spawned pass
  resolves its model from the resolved table via the documented ladder
  (`aw resolve-passes` → `bun|node scripts/resolve-passes.mjs` → prose
  contract, degradation declared); a pass whose chain cannot provide a model
  at spawn-time runs inline at the orchestrator's model with the degrade
  stated in the report (AC6, semantics §2).
- [ ] `skills/review-change/SKILL.md`: report contract states the per-pass
  model used and any inline degrade (AC6).
- [ ] `references/ADVERSARIAL_SETUP.md`: `--adversarial N` reviewers consume
  the per-pass chain round-robin, wrapping when N > chain length; `inherit`
  uses the global chain; `auto` = sanctioned host-agent choice (AC6,
  AD-45-004, AD-45-005).
- [ ] Bump `review-change` 3.5.0 → 3.6.0 (minor: new spawn contract) via
  bump-skill — CHANGELOG EN+ES rows and README tables updated.

#### P4 — Operator onboarding documentation

Layer: `docs`. Done-when: `grep -n "passes" skills/init-workspace/references/BOOTSTRAP_WRITE.md
skills/init-workspace/references/UPGRADE.md` → ≥ 1 match in each (AC7).

- [ ] `skills/init-workspace/references/BOOTSTRAP_WRITE.md` + `UPGRADE.md`:
  pass-routing interview step that writes `default` + recommended `passes`
  entries for the review family into `pi-agentic-workflow.json` (upgrade:
  additive-only block, never clobbering an existing decision) (AC7).
- [ ] `skills/ship-roadmap/references/MODEL_ROUTING.md` +
  `docs/workflow/GOLDEN_FIXTURE.md`: post-install recommendation note (not
  auto-written) pointing the operator to configure `default` + `passes`
  entries — the note carries the "pass routing" phrase AC15 anchors on, and
  the unrelated `passes` prose at GOLDEN_FIXTURE.md:252 stays untouched
  (AC15).
- [ ] `docs/workflow/GOLDEN_FIXTURE.md` + `GOLDEN_FIXTURE.es.md` (same
  commit): register the pass-routing smoke test as a model precondition for
  pass-spawning runs — resolve a fixture config once, require exit 0 and a
  byte-stable table, before any pass-spawning review run (AC13).
- [ ] Package README EN+ES (same commit): document the extended vocabulary —
  the `passes` key with a per-pass `{model, thinking}` example and the
  chain-shaped `default`/`model` — in the config section (AC19).
- [ ] Root CHANGELOG EN+ES (same commit): feature row anchored on "passes
  config"/"pass routing"; companion-package table row for the pi package
  minor bump 0.7.2 → 0.8.0 (AC19).
- [ ] Bump `init-workspace` 2.8.0 → 2.9.0 via bump-skill; then run
  `bun run bundle:skills` so the pi package skills mirror is byte-identical
  (O21, O22).

#### P5 — Hardening & PR

- [ ] Re-run the project's full verification gate — `cd packages/pi-agentic-workflow && bun run test` → exit 0; `bun test scripts/resolve-passes.test.mjs` → exit 0; `bun test scripts/pre-execution-quality.test.mjs` → exit 0; `bun scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0 (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #201`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

#### Phase-lint

- P1 — `Phase-lint: PASS (8/8) · fingerprint P1:config/infra:7:Extended pass-routing config vocabulary`
- P2 — `Phase-lint: PASS (8/8) · fingerprint P2:config/infra:8:resolve-passes producer`
- P3 — `Phase-lint: PASS (8/8) · fingerprint P3:docs:4:review-change pass-routing contract`
- P4 — `Phase-lint: PASS (8/8) · fingerprint P4:docs:6:Operator onboarding documentation`
- P5 — `Phase-lint: PASS (8/8) · fingerprint P5:close-out:7:Hardening & PR`

### Deploy & rollback

n/a — merging is enough. The pi package publishes on merge when its version
differs from the registry (CI workflow, manual same-PR version bump);
config changes are additive (unknown keys are rejected, so an old extension
reading a new config fails loudly, never silently — the shipped strict
validator is the rollback boundary). No migrations, no feature flag.

### Open questions / risks

- **Feature 43 not merged** (`producer-package`, `idea`): the `aw` rung of
  the ladder does not exist at execution time; the `.mjs` tier is the
  executable vehicle and the prose contract is the floor. Recorded, not
  blocking planning; the dependency check routes the build-order
  recommendation (43 first). RESOLVED-by-design: the producer invocation
  contract (`aw resolve-passes` + `.mjs` fallback, stdin→stdout) is frozen by
  the Product half, so feature 43 cannot drift it.
- **Issue #154 (settings console picker)** may change the ordered-chain UX
  shape: pass entries adopt its shape when it lands — DEFERRED with its
  recorded trigger (SPEC Deferred decisions row 1).
- **Inherited questions**: issue #201's `auto`-untrusted question RESOLVED
  (AD-45-007, yes-by-construction); granularity RESOLVED (AD-45-002).
- **Risk — validator equivalence drift** between `schema.ts` and the
  producer: mitigated by the shared AC case table in both suites (D-E45-2);
  a review finding here is expected to fail one suite, not hide.

### Deliverables

- `packages/pi-agentic-workflow/src/config/{types,schema,merge}.ts` +
  `src/routing/dispatch.ts`: extended vocabulary, strict validation, chain
  consumption + package test suites.
- `scripts/resolve-passes.mjs` + `scripts/resolve-passes.test.mjs`: the
  producer and its golden-fixture suite.
- `docs/workflow/model-routing.yml` `passes` section +
  `.github/scripts/inject_claude_frontmatter.py` non-skill-key tolerance.
- `skills/review-change/SKILL.md` + `references/ADVERSARIAL_SETUP.md`
  (version bump), `skills/init-workspace/references/BOOTSTRAP_WRITE.md` +
  `UPGRADE.md` (version bump), `skills/ship-roadmap/references/MODEL_ROUTING.md`
  note, `docs/workflow/GOLDEN_FIXTURE.md` (+ ES sibling).
- `packages/pi-agentic-workflow/README.md` + `README.es.md`, root
  `CHANGELOG.md` + `CHANGELOG.es.md`, pi package version bump, re-bundled
  skills mirror.

### Post-merge next feature

Feature 43 `producer-package` (issue #196) — the `aw` crate that becomes this
feature's ladder top rung (currently `idea`: `/design-feature
43-producer-package` first). Thereafter the next `defined`/`idea` roadmap row
per `docs/features/ROADMAP.md` (e.g. 31 `planning-review-materiality`, deps
merged).
