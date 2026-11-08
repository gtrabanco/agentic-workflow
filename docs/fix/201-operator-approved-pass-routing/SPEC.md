---
type: feature
scope: medium
ac-hash: 56b627e00107909e65a5fca47e991ec5c03935fa07750ea1a1ec98e7af2c7691
---

# fix/201-operator-approved-pass-routing

> Fix specification for issue #201 (feature row 45, delivered through the fix
> lane per the owner's explicit apply request). Scope is the 2026-11-03
> re-scope cut: exactly the `passes` config + `resolve-passes`.

## Issue

`#201` — NEW FEATURE: Operator-approved model routing for spawned review
passes (passes config + resolve-passes). The PR closes it via `Closes #201`.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.
S1–S3 are the issue body's Mechanics 1–3 (the mechanics that survive the
re-scope); corrections are appended under their own ids.

**S1 — `passes` config extension.**
> 1. **Config extension.** New top-level key `passes`: a map from pass name (`review-code`, `review-security`, `review-verify`, `review-design`, `review-a11y`, `review-brand`, `review-perf`, `review-seo`, `verify`, `classify`, `debt`) to `{model, thinking}` where `model` is one of:
>    - `"inherit"` (default for any absent pass) — the pass runs at the routed command's model (already operator-approved through `commands` routing) or inline at the orchestrator's model;
>    - `"auto"` — the operator explicitly delegates model choice to the orchestrating agent. This is the *sanctioned* "let the model decide" option and only exists because the operator wrote it;
>    - `"provider/modelId"` — a pinned reference, validated like today's `commands.<name>.model`.
>    Fail-closed rule: a pass with no entry and no default route runs **inline at the orchestrator's model** — never a spontaneous subagent spawn with an unapproved model.

**S2 — `resolve-passes` mechanical resolution.**
> 2. **Mechanical resolution.** `resolve-passes` (a `packages/agentic-workflow` producer per #196) reads the routing config — including the new `passes` key — and emits the resolved pass→model/thinking table as JSON with the fail-closed rules applied in code, not re-derived by the model before each spawn. The skill then only launches each pass with the pinned reference it received.

**S3 — Skill contract.**
> 3. **Skill contract.** `review-change` (and `ADVERSARIAL_SETUP.md`) resolves each pass's model from the resolved table before spawning and launches the run with that model pinned (host-agent subagent model parameter, headless `--model`, or extension spawn option). A model that cannot be resolved degrades to inline at the orchestrator's model, stated in the report.

**S1a — Re-scope: what remains (2026-11-03).**
> - The **`passes` config + `resolve-passes`** for spawned review passes: operator-defined named passes (which model/thinking level each `review-change --adversarial N` reviewer uses), resolution order, and the approval flow when a configured route is unavailable.
> - **First consumer already queued:** #358 routes its cross-model-family adversarial option through this config ("linked, not built there").

**S1b — Fail-closed default refinement (owner decision, 2026-10-12).**
> - **Default for an unconfigured pass**: spawn a context-clean subagent at the configured **cheap tier** (e.g. the `execute-phase` route's model family), never a spontaneous model choice.
> - **Escalation is by risk, reusing #260's tier signals** (contract/public-API/schema changes, security/auth surface, irreversibility — LOC is not a signal): adversarial passes, verification of a T2 unit, or any pass whose findings gate a merge may be pinned to the strong tier via the `passes` table — by the operator, or by `"auto"` delegation with the tier justification recorded.
> - **Independence rule unchanged**: a cheap verifier is valid only from a different model family, context-clean (feature 05 / #260 non-negotiable 1). Price never buys independence.
>
> `passes.<name>` entries keep the issue's three values (`inherit` / `auto` / pinned reference), plus:
>
> - a new top-level `passes.default` (or reuse the `execute-phase` command route) that resolves the cheap tier for unlisted passes;
> - escalation stays explicit: an entry per pass or `"auto"` with tier justification in the review report — never an implicit strong-model fallback.

**S2a — Vehicle redistribution (owner decision, 2026-09-09).**
> **Vehicle update (owner decision, roadmap row 43 declined — see PR #204):** the `packages/agentic-workflow` producer crate is no longer a separate feature. The **first producer feature implemented creates the crate** (package skeleton, TypeScript crate, bun-first scripts + `test:node` variants per #197, zero dependencies beyond `@gtrabanco/agentic-workflow-schema`) **plus the `.agentic-workflow/tmp` scratch convention** (dir + narrow `.gitignore` entries); later producers land their subcommands in it. This issue's contract is unchanged — only its execution vehicle is redistributed.

**S2b — Resolution semantics to fold into the SPEC (owner note, 2026-09-13).**
> 1. Resolve assignments **before** spawning — never mid-flight — and record which assignment produced each spawned pass in the pass record (auditability).
> 2. Fail **closed** on malformed *selected* routes for spawned passes. This is intentionally stricter than interactive routing (which warns and inherits via `onUnavailableRoute: inherit`): a spawned reviewer silently running on the wrong model is worse than a refused spawn.
> 3. Persisted defaults win over the active interactive session model for spawned roles — a spawn must not silently inherit whatever the operator happened to have selected in the session.

## Impact

- `packages/pi-agentic-workflow/src/config/{types,schema,merge}.ts` — new
  top-level config key; every existing key's validation must stay
  byte-identical (the strict validator's contract, D-E5).
- `packages/agentic-workflow-schema/src/vocabularies.ts` — the pass-name
  vocabulary's one machine owner; the pi package imports it (it already
  depends on the schema package via `@gtrabanco/n`), the runner crate mirrors
  it with a provenance comment (the `src/journal/entry.mjs` precedent — the
  crate does not depend on the schema package).
- `packages/agentic-workflow` — new `resolve-passes` subcommand (S2a: the
  crate exists; producers land their subcommands in it).
- `skills/review-change/SKILL.md` + `references/ADVERSARIAL_SETUP.md` — the
  spawn contract reads the resolved table; the adversarial
  cross-model-family paragraph (#358) flips from "resolves through #201"
  (future) to the landed config.
- Consumers downstream: #427 (Related, soft — extends the `passes` vocabulary
  once, never redefines it; recorded on both issues 2026-11-07), #434 (future
  fused passes), the settings console (a pass picker is #154's surface — not
  built here).
- Mention that stops being true when this lands: `ADVERSARIAL_SETUP.md`'s
  "Until it lands, an agent with one family runs N same-family reviewers and
  says so."

## Retirements

Additive unit — nothing is removed. The only superseded narrative is
`ADVERSARIAL_SETUP.md`'s "Until it lands…" sentence, which is rewritten to
point at the landed config in the same change (checked post-change with
`rg -c "Until it lands" skills/review-change/references/ADVERSARIAL_SETUP.md`
→ 0). The issue's dead halves (declined-43 branch plan, mid-turn subagent
model pinning) stay dead per the 2026-11-03 re-scope; no surface exists to
retire.

## Non-goals

- **init-workspace parity** (Mechanics 4) — dropped by the 2026-11-03
  re-scope ("what remains of this issue is … the `passes` config +
  `resolve-passes`"; owner confirmation 2026-11-07: "left exactly `passes`
  config + `resolve-passes`").
- **`suggested_tier` feeding pass model selection** (owner amplification
  2026-09-29) — not named by the re-scope cut; parked. Flagged in the handoff
  for the owner to rule (separate unit or SPEC amendment here).
- **pi virtual-model dispatch** (owner note 2026-09-29/2026-10-02) — a pi-only
  accelerator behind `ExtensionSurface`; the re-scope cut leaves it out.
- **Which passes run** (applicability) — #194's contract; this unit governs
  who runs them and on what model.
- **Picker primitives / ordered-chain UX** — #154's surface (already landed
  chains at the route level; `passes` entries accept the same shape).
- **#427's unified config schema** — Related (soft); #201 lands the narrow
  vocabulary #427 later extends once.
- **#260's subagent-first topology** (row 68, `idea`) — the spawn topology is
  not this unit; only the model resolution is.

## Risk tier

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none — not a high-tier unit

(Tier verdict, verbatim: `contract: risk-tier-verdict@1 · tier: standard ·
reason: 1 path(s) carry executable content: packages/pi-agentic-workflow/src/config/types.ts ·
reason_kind: executable-content · task_size: understood, contained_risk:
contained, resumable_from_diff: true, ceremony: unit-doc, verification: gates ·
signals: []` — computed 2026-11-08 with `bun scripts/ceremony.mjs tier
classify` over the planned paths.)

## Future

- 2026-11-08 — pass entries adopting #154's bulk-chain UX in the settings
  console picker (`open`) — quoted from the issue's Non-goals: "pass entries
  should adopt its ordered-chain shape when it lands (chain per pass instead
  of single reference)". The chain *shape* is accepted by this unit's schema;
  the picker UX is #154's.
- 2026-09-29 — pi `registerVirtualModel` dispatch behind `ExtensionSurface`
  (`open`) — parked by the re-scope; recovery trigger: an operator asking for
  per-request routing inside pi sessions.

## Future cost

- The `passes` vocabulary is published once
  (`packages/agentic-workflow-schema/src/vocabularies.ts`); #427 must extend
  it, never redefine it (relation recorded on both issues).
- The runner crate's mirrored copy of that vocabulary names its owner in a
  provenance comment until #427 unifies the reading; the mirror must be
  updated in the same PR that extends the published list.

## Applicable tests

- `packages/pi-agentic-workflow/test/config-schema-passes.test.mjs` (new) —
  strict-validator rows for `passes` (S1).
- `packages/pi-agentic-workflow/test/config-merge.test.mjs` (extended, name
  follows the existing suite layout) — project-over-global merge of `passes`.
- `packages/agentic-workflow/test/resolve-passes.test.mjs` (new) — golden
  fixtures for the resolution chain, `auto` pass-through, chain pass-through,
  malformed-route refusal (S2, S1a, S2b).
- Differential: the two packages' full suites before/after the change, plus
  the touched commands' stdout/exit equality against the base commit where
  their code paths are shared (existing subcommands share none of the new
  code; the shared surface is `parseConfigFile`, covered by the existing
  schema suite).

## Known pre-existing issues

- The strict validator's unknown-key message for the config root lists the
  allowed keys inline (schema.ts `validateConfig`) — it already drifts from
  `ROOT_KEYS` by omitting `autoLogSession` (`does-not-affect`: this unit adds
  `passes` to both and pins the rendered-facts row so the prose cannot drift
  silently — the rendered-facts gate recomputes it).
- `resolve-passes` cannot probe model availability/auth (that is runtime
  information a CLI does not have) — `does-not-affect`: the resolver emits
  declared references; availability failure at spawn time is S3's degrade
  path.

## Acceptance criteria

- **AC1** — `passes` is a valid top-level config key with the issue's exact
  vocabulary: the strict validator accepts `passes.<name>` and
  `passes.default` entries whose `model` is `"inherit"`, `"auto"`, a
  `provider/modelId` reference, or a reference chain (1–4), and whose
  `thinking` is a thinking setting; an unknown pass name is rejected, an
  invalid model reference reports `$.passes.<name>.model`, and an absent
  `passes` key behaves exactly as today. (check: `bun test
  packages/pi-agentic-workflow/test/config-schema-passes.test.mjs` exits 0)
- **AC2** — `passes` merges project-over-global at entry and per route-key
  granularity (a project entry that sets only `model` keeps the global
  `thinking`), matching the merge rule every other route scope uses. (check:
  `bun test packages/pi-agentic-workflow/test/config-merge-passes.test.mjs`
  exits 0)
- **AC3** — `agentic-workflow resolve-passes` reads the global and project
  config files (project wins, per the loader's merge rule) and prints a
  `resolve-passes@1` JSON table covering every published pass name, each row
  carrying `model`, `thinking`, `source`, `spawn` and `reason` with the
  fail-closed chain applied in code: `passes.<name>` → `passes.default` →
  `commands.execute-phase` (the configured cheap tier) → inline at the
  orchestrator's model (recorded, never a spontaneous choice); `"auto"`
  passes through as `auto`; `"inherit"` resolves against the routed command's
  model; a chain passes through as a chain. (check: `bun test
  packages/agentic-workflow/test/resolve-passes.test.mjs` exits 0, plus a
  foreground golden run recorded in `## Log`)
- **AC4** — a malformed selected route fails closed: unreadable/invalid JSON
  or an invalid reference in a *selected* pass route is a refusal (exit 2,
  `PASSES REFUSAL — <reason>`), never a silent fallback to another model.
  (check: `bun test packages/agentic-workflow/test/resolve-passes.test.mjs`
  exits 0)
- **AC5** — `review-change`'s prose resolves each pass's model from the
  resolved table before spawning, launches the run with that model pinned,
  and degrades to inline at the orchestrator's model stated in the report
  when unresolvable; `ADVERSARIAL_SETUP.md`'s spawn tiers carry the same rule
  and its cross-model-family paragraph points at the landed config. (check:
  `bun scripts/skill-lint.mjs` exits 0 AND `bun
  scripts/check-skill-context.mjs` exits 0)
- **AC6** — the pass-name vocabulary is published once in
  `packages/agentic-workflow-schema/src/vocabularies.ts` (`PASS_NAMES`),
  imported by the pi package's validator, mirrored in the crate with a
  provenance comment naming the owner, and pinned in `AGENTS.md`'s
  normative-surfaces inventory. (check: `bun test
  scripts/normative-drift.test.mjs` exits 0)
- **AC7** — the repository indexes and docs ship in the same change:
  roadmap row 45 and the Fixes-table row are written by the deterministic
  emitters (never hand-edited), the pi package README's Model routing section
  and the crate README/bin usage document `passes`/`resolve-passes`, a
  changeset declares the release intent, and the generated projection is
  regenerated. (check: `bun scripts/docs-generate.mjs --check` exits 0 AND
  `node packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check
  docs/fix/201-operator-approved-pass-routing/SPEC.md` exits 0)
- **AC8** — compatibility: every pre-existing config surface behaves
  identically after the change — the pi package's and the crate's full test
  suites pass, and the root suites pass. (check: `bun run test` in
  `packages/pi-agentic-workflow` exits 0; `bun run test` in
  `packages/agentic-workflow` exits 0; `node scripts/run-root-suite.mjs`
  exits 0)

## Tasks

- P1 — Publish the `passes` vocabulary: `PASS_NAMES` in
  `packages/agentic-workflow-schema/src/vocabularies.ts` (the one machine
  owner), re-exported, with the schema package's tests asserting the
  issue's eleven names and `default` handled at the config layer (validator:
  `bun run test` in `packages/agentic-workflow-schema` exits 0)
  (Implements: S1, S1b)
  Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts,
  packages/agentic-workflow-schema/src/index.ts
- P2 — RED then GREEN the pi config `passes` validation and merge: red test
  commit first (`test/config-schema-passes.test.mjs`,
  `test/config-merge-passes.test.mjs`), observed failing, then the
  `types.ts`/`schema.ts`/`merge.ts` implementation importing `PASS_NAMES`
  (validator: `bun test packages/pi-agentic-workflow/test/config-schema-passes.test.mjs
  packages/pi-agentic-workflow/test/config-merge-passes.test.mjs` exits 0)
  (Implements: S1, S1a, S2b)
  Relevant files: packages/pi-agentic-workflow/src/config/{types,schema,merge}.ts
- P3 — RED then GREEN the crate's `resolve-passes` subcommand: red test
  commit first (`test/resolve-passes.test.mjs` — golden fixtures: absent pass
  + no default → inline; `auto` → `auto`; chain → chain; malformed selected
  route → refusal), observed failing, then the implementation under
  `src/passes/` wired into `bin/agentic-workflow.mjs` (validator: `bun test
  packages/agentic-workflow/test/resolve-passes.test.mjs` exits 0)
  (Implements: S2, S1a, S1b, S2a, S2b)
  Relevant files: packages/agentic-workflow/src/passes/,
  packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — Skill contract prose: `review-change` SKILL.md (spawn step resolves
  the table before spawning; degrade path stated in the report) and
  `ADVERSARIAL_SETUP.md` (spawn tiers + cross-model-family paragraph);
  normative-surfaces row for the pass-name vocabulary in `AGENTS.md`
  (validator: `bun scripts/skill-lint.mjs` exits 0 AND `bun
  scripts/check-skill-context.mjs` exits 0 AND `bun test
  scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S1a, S1b)
  Relevant files: skills/review-change/SKILL.md,
  skills/review-change/references/ADVERSARIAL_SETUP.md, AGENTS.md
- P5 — Documentation and state via surfaces: pi README Model routing section
  (`passes`), crate README + bin usage (`resolve-passes`), changeset, roadmap
  row 45 and Fixes-table row via the emitters, generated projection
  regenerated (validator: `bun scripts/docs-generate.mjs --check` exits 0 AND
  `node packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check
  docs/fix/201-operator-approved-pass-routing/SPEC.md` exits 0)
  (Implements: S1, S2, S1b)
  Relevant files: packages/pi-agentic-workflow/README.md,
  packages/agentic-workflow/README.md, docs/ROADMAP.md, .changeset/
- P6 — Verification: both packages' suites, the touched root suites, the
  differential run of existing subcommands against the base commit, and the
  foreground validators closing the obligations ledger (validator: `node
  scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S1a, S1b, S2a, S2b)

### Planning evidence

The ledger lives beside this doc: `planning-evidence.md` (medium unit — the
ledger is a separate file, never embedded).

### Obligations

The ledger lives beside this doc: `planning-obligations.md` (medium unit —
the ledger is a separate file, never embedded).

## Triaged steps

Pasted below from `bun scripts/unit-route.mjs --triage
201-operator-approved-pass-routing` (see `## Log` E2).

<!-- triaged-steps:start -->

```text
TRIAGE — 201-operator-approved-pass-routing (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

(The triage's relay suggestion is not taken: the owner directed inline
application on this repo's own surgery — no relay packet, no fold cycle.)

<!-- triaged-steps:end -->

## Findings

OPEN rows only — appended by `review-change`/`triage-issue`. Empty at cut:
the owner directed inline application without a fold cycle (external
verification is the owner's).

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #201
  ```
  (with the owner's inline-application procedure: ledgers frozen at cut,
  work inline — no `review-change`/`audit-pr`/fold cycle on this repo's own
  surgery; the deterministic gates always run; the owner is the external
  verifier.)
- **L2** — 2026-11-08, the delivery scope, verbatim (issue comment
  2026-11-03):
  > The **`passes` config + `resolve-passes`** for spawned review passes: operator-defined named passes (which model/thinking level each `review-change --adversarial N` reviewer uses), resolution order, and the approval flow when a configured route is unavailable.
- **E1** — 2026-11-08, `bun scripts/ceremony.mjs tier classify --paths <planned paths>` · exit 0 · `tier: standard`, `reason_kind: executable-content`, `signals: []`.
- **E2** — 2026-11-08, `bun scripts/unit-route.mjs --triage 201-operator-approved-pass-routing` · exit 0 · 9 steps, none skipped; block pasted into `## Triaged steps`.

## Next

External verification by the owner (§8 handoff); the PR closes #201.

## References

- Issue [#201](https://github.com/gtrabanco/agentic-workflow/issues/201)
  (roadmap row 45), owner comments 2026-09-09, 2026-09-13, 2026-10-12,
  2026-11-03, 2026-11-07.
- Related (soft): #427 (config unification — extends this vocabulary once),
  #434 (fused passes consumer). #358 (first consumer, shipped awaiting this
  config). #154 (chain shape). #196 (crate vehicle).
- LEDGERS.md (`skills/pre-execution-review/references/LEDGERS.md`) — ledger
  row shapes.

## Branch

`feat/201-operator-model-routing`

## Depends on

none (the crate exists — feature 61/73 landed it; #427 is Related, not a
blocker).

## Regression scope

- Config validation of every existing key (`default`, `commands`,
  `onUnavailableRoute`, `onSettle`, `pathProtection`, `advance`,
  `recommendedModels`, `profiles`, `profileOrder`, `profileFallback`,
  `memory`, `telemetry`, `autoLogSession`) — verified by the pi package's
  existing config suites (AC8) plus the schema package's suite.
- Existing crate subcommands share no code with `resolve-passes` (new module);
  the bin router's dispatch is extended additively — verified by the crate's
  suite and the differential run (AC8).
- `review-change`'s single-reviewer default path is unchanged — the prose
  addition only names the resolution source for the model a pass already
  runs on; verified by the golden fixture suite
  (`scripts/golden-fixture.test.mjs`) and skill-lint.
