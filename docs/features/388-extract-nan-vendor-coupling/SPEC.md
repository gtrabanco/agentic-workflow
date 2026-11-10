---
type: feature
scope: large
---

# 388 — extract-nan-vendor-coupling

> One-line: extract every NaN vendor decision out of `@gtrabanco/pi-agentic-workflow` into a new optional companion package `@gtrabanco/pi-nan-agentic-workflow`, with tier-aware quota routing as preset data.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — extract the vendor coupling (issue #388 Goal, verbatim).**
> `@gtrabanco/pi-agentic-workflow` currently hardcodes NaN-specific vendor decisions: a built-in `nan` provider profile with a per-skill model ladder, provider special-casing in the settings console, and NaN prose inside a skill. This feature extracts all of it into a new optional companion package, `@gtrabanco/pi-nan-agentic-workflow`, so the main pi layer ships provider-neutral and NaN becomes an opt-in install — the owner's decisions about models stop being baked into the generic package.

**S2 — in scope (issue #388, verbatim bullets).**
> - New package `@gtrabanco/pi-nan-agentic-workflow` (pi package): ships the NaN preset — provider id, the per-skill model ladder, and the token-counter quirk guidance — as data/defaults consumed by the main package.
> - `@gtrabanco/pi-agentic-workflow` becomes provider-neutral: a preset/profile contribution seam replaces the built-in `nan` default; `recommendedModels: true` without any companion preset is a documented no-op.
> - Settings console/view generalized: profiles listed from config + contributed presets; the built-in-not-editable (P5) rule applies to preset-contributed profiles.
> - `skills/log-session/SKILL.md` prose neutralized (skills stay product-agnostic).
> - README split: generic docs stay; NaN guidance moves to the new package.
> - `docs/workflow/PACKAGES.md` adoption for the 4th package: bun workspace, single lockfile, version-parity train + pin rules, changeset; sibling test suites per repo rules.
> - Measurable lock-in gate: a suite asserting the main package (src + README) contains no `nan` provider literals.

**S3 — tier-aware quota routing (issue #388 amendment 1, verbatim bullets).**
> - **Tier metadata as data**: every model in the preset declares its quota tier (`unlimited` | `limited`). Tier facts live in the companion package, never in the generic one, and are trivially editable when the provider changes its quota structure.
> - **Unlimited-first defaults for low-stakes work**: skills/task classes that can be done with a weaker model (summarization, mechanical logging, triage-style passes, cheap catalog steps) default to `qwen3.6`-first; the limited-tier ladder is reserved for skills whose output quality is load-bearing (review axes, audits, planning). The current ladders were written quota-blind — this re-cuts them tier-aware.
> - **Subagent and child-task routing included**: tasks that skills spawn (subagents, child sessions, conductor continuations) follow the same tier policy — unlimited-first unless the task class is declared strength-sensitive.
> - **Explicit opt-out**: a global flag (e.g. `tierRouting: off`) plus per-skill override. The unlimited tier is weaker and/or slower, so the routing must be avoidable — a user who prefers strength everywhere, or cannot tolerate latency on a given task, disables it without losing the rest of the preset.

**S4 — acceptance criteria (issue #388, verbatim bullets).**
> - `@gtrabanco/pi-agentic-workflow` src and README contain zero occurrences of the `nan` provider id (enforced by a test, not by prose).
> - Installing only `@gtrabanco/pi-agentic-workflow` with `recommendedModels: true` yields no built-in vendor profile; behavior documented.
> - Installing the companion package restores today's behavior (same ladder, same settings UX) without user config changes.
> - `skills/log-session/SKILL.md` names no provider or model id.
> - Root suites + package suites pass; version-parity gate covers the new package.

**S5 — tier routing acceptance criteria (issue #388 amendment 1, verbatim bullets).**
> - The preset declares a tier per model as data; ladders derive their order from tier + task class, never from a hand-ordered array that silently drifts from the tier facts.
> - With tier routing on, every unlimited-eligible skill lists `qwen3.6` first; limited-tier models appear in a skill's ladder only where the skill is classified strength-sensitive, and the classification is visible (documented per skill, not folklore).
> - With the opt-out on (global or per skill), the ladders match today's published order — no silent quality regression for users who disable routing.
> - Subagent/child-task routing is covered by tests: a spawned task classified low-stakes resolves to the unlimited tier under routing-on, and to the non-routing ladder under routing-off.

**S6 — out of scope (issue #388, verbatim bullets).**
> - Any NaN API integration beyond the preset data (embeddings providers etc. belong to their own units).
> - Changing the crate (`agentic-workflow`) or the schema package — the coupling is confined to the pi layer + one skill.
> - Removing the generic per-skill model routing feature — only the hardcoded vendor default moves.

**S7 — dependency relations (issue #388 triage update, verbatim).**
> - **Related (soft) — #427, after it**: the vendor config keys re-home onto the unified schema; never a parallel home.
> - **Related (soft) — #201**: the tier-routing policy shares the pass→model vocabulary that #201 defines.

**S8 — fleet refresh + four cost postures (owner request 2026-11-10, recorded).**
> NaN launched new plans and models (four paid "larger" models: kimi-k3.1-pro, qwen3.8-max, deepseek-v4-pro, hy4; a credits-based tariff with per-model monthly free allowances; base/premium concurrency). The preset's recommendations are re-cut against benchmark evidence — independent evaluations (Artificial Analysis, Vals AI, NIST) preferred, vendor claims flagged where unreplicated — into FOUR approved profiles: best quality (cost no object, with cross-model verification discipline), a balanced default living inside the free allowances, a cost-minimal posture optimized for performance per completed task, and a no-credits posture that never spends credits. The provider's own guide is a cost-only input, never taken on faith (e.g. deepseek-v4-pro's unreplicated vendor numbers keep it out of leading rungs; qwen3.8-max's weak agentic evidence keeps it out of every ladder).

**S9 — profile selection surface (owner decisions 2026-11-10, recorded).**
> The config stays flexible but opinionated by default: absent any selection, the preset resolves the `economy` posture. Selection is a generic key (`presetProfile`: one name or an ordered array, first = most preferred) so the chain can demote between postures as credits run out; user-defined profiles and per-skill overrides compose on top (the mechanisms feature 63 and amendment 1 already ship). Profile names: `quality`, `balanced`, `economy`, `no-credits-continue-working`. The companion README must state the default and the flexibility prominently, on top.

**S10 — amendment 2 acceptance criteria.**
> - The seam accepts a preset that contributes a NAMED profile catalog; each entry travels as `<provider>.<profile>` in the chain, the bare `<provider>` name resolves the preset's default profile, and legacy single-profile presets keep today's bare-name behavior.
> - `presetProfile` parses strict (slug string or non-empty slug array), merges project-over-global wholesale, and is published in the pi section descriptor.
> - Unknown profile names are skipped; a selection naming nothing the catalog carries falls back to the preset's default entry — a typo never silently drops the provider out of the chain.
> - The companion declares the four postures with `economy` as the default; every profile publishes a full ladder; `PUBLISHED_LADDER` continues to pin the balanced reference; the billing tier map carries the November 2026 tariff facts.
> - Tier routing (on by default) demotes only the mechanical one-way passes plus non-strength-sensitive spawned tasks to the zero-credit chain; `tierRouting: false` byte-matches the selected profile's published ladder.
> - The companion README documents all four ladders, the plans/credits picture, the corrected reasoning-control matrix (mimo-v2.6-flash and deepseek-v4-flash switchable; qwen3.8-flash at 1M context), and the out-of-credits guidance.

### Frozen request (verbatim, §1)

- **S1** — "Apply to this repository: issue #388" (the user's entire message; issue #388 body carries the requirements quoted above).

**Interpretation decision D1** (recorded, not silent): S4 bullet 3 ("restores today's behavior (same ladder, same settings UX)") predates amendment 1, which states the ladders "were written quota-blind — this re-cuts them tier-aware" and S5 pins routing-on ladders to `qwen3.6`-first. Reading the two together: installing the companion restores model routing out of the box (same profile name, same settings UX, no config change) with the tier-aware ladder as the new default; routing-off (opt-out) restores today's exact published ladders (S5 bullet 3). The non-routing ladder data is byte-pinned to today's `RECOMMENDED_PROFILES.nan`.

## Impact

- Consumers of the built-in `nan` profile: `src/config/profiles.ts` (resolution), `src/routing/dispatch.ts` (chain probing — already generic via `providerAvailable`), settings console/view (display + P5 edit rule), README docs, five test suites.
- New consumer: the companion package's registration extension (imports the main package's preset registry — a new cross-package seam; the main package must not name any provider).
- Config schema gains one optional generic key (`tierRouting`); the strict parser must reject malformed shapes (fail-closed, same discipline as `profileFallback`).
- `docs/features/_TEMPLATE` unaffected; root README's NaN section moves to the companion README (an asset reference `docs/assets/nan-cloud.svg` moves with it).
- The generated docs projection (`docs/generated/**`) re-renders from the roadmap row — via `bun scripts/docs-generate.mjs`, never hand-edited.

## Retirements

- `RECOMMENDED_PROVIDERS` and `RECOMMENDED_PROFILES` in `packages/pi-agentic-workflow/src/config/recommended.ts` — replaced by the preset registry; replacement evidence: `rg -n 'RECOMMENDED_PROVIDERS|RECOMMENDED_PROFILES' packages/` → 0 after the change.
- `packages/pi-agentic-workflow/src/config/recommended.ts` itself — its generic `RecommendedProfile` interface moves to `src/config/types.ts`; the file is deleted.
- The root README's `#### Running on NaN.builders` section (lines ~244–420) — moved to `packages/pi-nan-agentic-workflow/README.md`.
- The `nan` literals in `src/settings/console.ts` (~5), `src/settings/view.ts` (1), `src/config/profiles.ts` (special cases), `src/config/types.ts` (doc comment) — replaced by registry-driven generic code.

## Non-goals

- No NaN API integration beyond preset data (S6).
- No changes to `packages/agentic-workflow` or `packages/agentic-workflow-schema` (S6).
- No removal of generic per-skill model routing (S6).
- No re-home of config keys onto the unified schema — that is #427's unit, after this one (S7).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable_from_diff · ceremony: unit-doc · verification: gates`
- **Named high-risk item** — none — `signals[]` empty (verdict `risk-tier-verdict@1`, `bun scripts/ceremony.mjs tier classify`, 2026-11-09).

## Future cost

- The tier classification is "for now": when NaN announces quota changes, a tier edit in `packages/pi-nan-agentic-workflow/src/preset.ts` is a one-line data edit (S3). Re-trigger condition: provider quota-structure announcement.
- The npm Trusted Publisher record for the 4th package name must be registered on npmjs.com by the owner (one-time step, same as the 2026-10-28 consolidation) — `publish.yml` derives the package list from the tree, so no workflow edit is needed, but the first publish fails E403 until the record exists.

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/vendor-neutral.test.mjs` (new — the lock-in gate + skill neutrality, RED before implementation).
- `bun test packages/pi-agentic-workflow/test/provider-presets.test.mjs` (new — the seam).
- `bun test packages/pi-agentic-workflow/test/model-profiles.test.mjs` (rewritten onto the seam — the built-in-profile assertions it pinned are retired by S2, the seam behavior replaces them).
- `bun test packages/pi-agentic-workflow/test/settings-console.test.mjs`, `test/profile-fallback.test.mjs`, `test/config-schema-*.test.mjs` (existing behavior over changed code).
- `bun test packages/pi-nan-agentic-workflow/test/*.test.mjs` (new package suites: tier data, derivation, routing on/off, task classes, registration).
- `node scripts/run-root-suite.mjs` (root gate), `bun scripts/version-parity-gate.mjs` (parity), `bun scripts/check-skill-context.mjs` (budgets).

## Known pre-existing issues

- Roadmap row 45 notes #201 (pass→model vocabulary) is still `in-progress` — affects: this unit's tier-routing reuses command names, not #201's vocabulary; does-not-affect: the preset data shape (additive config, not the pass catalog).
- `agent.md` AGENTS.md rule "Never change a test to pass it": the `model-profiles.test.mjs` rewrite below is driven by S2 retiring the built-in profile, recorded here before the edit; every assertion maps 1:1 to a seam equivalent and none is deleted or narrowed (docs-parity tests re-home to the companion).

## Tasks

- P1 — RED corpus: vendor-neutral lock-in gate + preset-seam tests, observed failing on the current tree (validator: `bun test packages/pi-agentic-workflow/test/vendor-neutral.test.mjs` exits 1 on the pre-change tree, then 0)
  (Implements: S4)
- P2 — provider-preset seam in the main package: registry, generic profile resolution, `tierRouting` config (schema/defaults/merge/types), delete `recommended.ts` tables (validator: `bun run test --cwd packages/pi-agentic-workflow` exits 0)
  (Implements: S2, S4)
- P3 — settings console/view generalized onto the registry; P5 for preset profiles; existing suites hold (validator: `bun test packages/pi-agentic-workflow/test/settings-console.test.mjs` exits 0)
  (Implements: S2, S4)
- P4 — companion package `@gtrabanco/pi-nan-agentic-workflow`: preset data + tier catalog + derivation + registration extension + package tests (validator: `bun test packages/pi-nan-agentic-workflow/test/*.test.mjs` exits 0)
  (Implements: S1, S2, S3, S5)
- P5 — prose neutrality + README split: `skills/log-session/SKILL.md`, root README NaN section → companion README, pi package README generalization (validator: `bun test packages/pi-agentic-workflow/test/vendor-neutral.test.mjs` exits 0)
  (Implements: S1, S2, S4)
- P6 — packaging + docs state: `PACKAGES.md` 4th-package adoption, changeset intent, roadmap row, `bun.lock`, `docs/LOGS.md`, docs projection via `bun scripts/docs-generate.mjs` (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S4)
- P7 — full foreground verification: root suite, parity gate, context budgets, differential check (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S4, S5)
- P8 — seam extension for multi-profile presets (main package): `ProviderPreset.profiles`/`defaultProfile` + profile-aware resolution, `presetProfile` config (schema/merge/types/descriptor), settings listing, pi README docs; red-first `config-schema-preset-profile.test.mjs` + `preset-profiles.test.mjs` (validator: `bun test packages/pi-agentic-workflow/test/preset-profiles.test.mjs test/config-schema-preset-profile.test.mjs` red before, green after)
  (Implements: S9, S10)
- P9 — companion re-cut: billing-tier map + four published ladders + profile-aware resolver + registration catalog; test re-aims justified in `decisions.md` (validator: `bun test packages/pi-nan-agentic-workflow/test/*.test.mjs` exits 0)
  (Implements: S8, S9, S10)
- P10 — companion README rewrite: four-ladder tables, plans & credits, corrected reasoning matrix, out-of-credits guidance (validator: `bun test packages/pi-nan-agentic-workflow/test/docs-parity.test.mjs` exits 0)
  (Implements: S8, S10)
- P11 — unit state: changeset amendment, this doc's log, gates re-run (validator: `bun scripts/lint-changeset.mjs .changeset/388-extract-nan-vendor-coupling.md` exits 0)
  (Implements: S8, S10)

### Planning evidence

M/L unit — the ledger lives in [planning-evidence.md](planning-evidence.md) (this section names it, never embeds it).

### Obligations

M/L unit — the ledger lives in [planning-obligations.md](planning-obligations.md) (this section names it, never embeds it).

## Triaged steps

> Paste of `bun scripts/unit-route.mjs --triage 388-extract-nan-vendor-coupling` (2026-11-09, exit 0), verbatim. Per the owner's local workflow (§4) this unit is applied **inline** — the lane's relay dispatch and review/fold cycle are not run on the repo's own surgery; the deterministic gates are.

```text
TRIAGE — 388-extract-nan-vendor-coupling (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

The `relay: bootstrap-needed` line of the raw output is declined: the owner's workflow replaces the lane's relay orchestration with the inline ledger freeze (§4/§5).

## Findings

OPEN rows only, appended by `review-change` and `triage-issue` (`findings-table@1`):

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #388
  ```
- **E1** — 2026-11-09, `bun scripts/unit-route.mjs --triage 388-extract-nan-vendor-coupling` · exit 0 · steps: research…release, none skipped, budget strong; relay bootstrap declined (inline per owner workflow §4).
- **E2** — 2026-11-09, `bun scripts/ceremony.mjs tier classify` · exit 0 · tier `standard`, signals `[]`, task_size `understood/contained/resumable_from_diff`.
- **D1** — 2026-11-09, owner-workflow interpretation (recorded in `## Specs`): S4's "same ladder" (pre-amendment) is superseded by amendment 1's tier-aware re-cut; routing-off restores the published ladders (S5 bullet 3).
- **P0** — 2026-11-09, planning ledgers frozen (this doc + `planning-evidence.md` + `planning-obligations.md`); the freeze substitutes for the lane's plan step.
- **E3** — 2026-11-09, `bun test packages/pi-agentic-workflow/test/vendor-neutral.test.mjs test/provider-presets.test.mjs test/config-schema-tier-routing.test.mjs` (RED run, pre-implementation) · exit 1 · 3 vendor-neutral fails, 12 tierRouting-schema fails, preset-seam suite fails on the missing `dist/config/presets.js` — the frozen-failure corpus (§2).
- **E4** — 2026-11-09, base-copy differential (§6): `git archive main` → `/tmp` scratch, `bun install --frozen-lockfile` + `bun test test/*.test.mjs` in the pi package · base 758 tests/69 files with 2 fails (`lifecycle: the staged copy is gitignored and untracked` — a git-metadata artifact of the archive copy, not a behavior difference); change 777 tests/71 files, 0 fail · deltas = the new seam/gate suites and the 1:1 model-profiles re-aim only.
- **P1** — 2026-11-09, RED corpus committed (`d4341117`).
- **P2** — 2026-11-09, seam implemented: `config/presets.ts` registry, generic `profiles.ts`, `recommended.ts` retired, `tierRouting` config (schema/merge/types), console/view generalized · commit `68b8a763`.
- **P4** — 2026-11-09, companion package `@gtrabanco/pi-nan-agentic-workflow` (preset data, tier derivation, registration extension, README split, docs-parity re-home) · commit `cc133a7d`.
- **P6** — 2026-11-09, packaging + docs state: changeset, CHANGELOG row, PACKAGES.md adoption, roadmap row slug fix, docs projection regenerated via `bun scripts/docs-generate.mjs` (emitter, never hand-edited), AGENTS/README/CAPABILITIES counts 3 → 4 packages.
- **G1** — 2026-11-09, `bun scripts/lint-changeset.mjs .changeset/388-extract-nan-vendor-coupling.md` · exit 0.
- **G2** — 2026-11-09, `bun scripts/version-parity-gate.mjs --content` · exit 0 · content parity holds, companion row present (after adding the CHANGELOG 4.10.0 row; the first run failed `companion-row-missing` — repaired, not waived).
- **G3** — 2026-11-09, `bun scripts/docs-generate.mjs --check` · exit 0 · 3 checked, 0 stale (after emitter regeneration; first run DRIFT — repaired via the emitter).
- **G4** — 2026-11-09, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PACKAGES.md 101 lines / 2380 estimate` within ceilings (two intermediate runs over budget were repaired by trimming wordiness; no rule text lost).
- **G5** — 2026-11-09, `node scripts/run-root-suite.mjs` · exit 0 · 101 suites PASS, 0 fail (final run; the run before the repairs failed 2: `check-skill-context` and `roadmap-settle` slug-mismatch — both repaired).
- **E5** — 2026-11-09, `bun test` packages/pi-agentic-workflow (777 pass / 0 fail) and packages/pi-nan-agentic-workflow (20 pass / 0 fail).
- **E6** — 2026-11-09, `git diff HEAD -- packages/agentic-workflow packages/agentic-workflow-schema` · empty (O13 holds on this branch's base). **Discovery: the branch is 19 commits behind `main` — #427 (unified config schema) merged mid-unit; `git merge-tree` reports content conflicts in `src/config/{merge,schema,types}.ts`. Reported to the owner with options; no integration guessed.
- **E7** — 2026-11-09, owner decision `integrate-now`: `git merge main` (19 commits, #427 unified config) resolved on the branch — tierRouting re-homed beside the routing keys the pi section owns (strict-parser ROOT_KEYS, ConfigFile/EffectiveConfig with #427's base-file split kept, project-over-global merge, and #427's published descriptor `PI_CONFIG_EXTENSION` + committed `agentic-workflow.config.json`, byte-pin intact); roadmap rows 427/388 both kept. Post-merge verification: pi package 779/0, companion 20/0, crate 604/0, schema 836/0, root suite 101 PASS / 0 FAIL, `docs-generate --check` PASS, parity gate PASS; O13 re-verified clean against the new main (`git diff main -- packages/agentic-workflow packages/agentic-workflow-schema` empty). Merge commit `6cd67e3b` + projection regeneration.
- **P7** — 2026-11-09, obligations ledger closed: all 15 rows `verified` on foreground runs. Handoff awaits the owner's verdict on the integrated diff (§8).
- **E8** — 2026-11-10, owner verdict on the request to re-cut the recommendations onto the refreshed NaN fleet: benchmark research run (independent evaluators preferred — Artificial Analysis Intelligence Index/√-bench families, Vals AI Terminal-Bench runs, NIST CAISI replication gaps; vendor tables flagged where unreplicated: deepseek-v4-pro's SWE-bench 80.6 claim measured 74.0 by NIST and Terminal-Bench 87.9 measured 54.68 by Vals AI; AA Intelligence Index 53 vs Flash's 52) — qwen3.8-max (strong reasoner, weak agentic) and hy4 (vendor-run evidence only) kept out of every default ladder; glm5.3-flash's pre-launch independent verification (57 vs glm5.3's 60 on the AA Index, GDPval-AA Elo tie) grounds its promotion.
- **E9** — 2026-11-10, RED corpus (pre-implementation): `bun test packages/pi-agentic-workflow/test/preset-profiles.test.mjs test/config-schema-preset-profile.test.mjs` → 19 fail / 4 pass (the 4 passing rows are the legacy single-profile behavior already covered); companion suites red on the missing exports (`PROFILES`, `PROFILE_LADDERS`, `freeChain`, …).
- **P8** — 2026-11-10, seam extension: `ProviderPreset.profiles`/`defaultProfile` + profile-aware resolution (`resolvePresetEntry`, per-entry chain names), `presetProfile` config (strict slug shape, wholesale project-over-global merge, descriptor regenerated +17 lines), settings console/view generalized (catalog entries listed, P5 guard on chain names), pi README section rewritten · commit `8e8faeb8`.
- **P9** — 2026-11-10, companion re-cut: billing-tier map (`free`/`quota`/`paid`, 11 chat models), four published ladders (`PROFILE_LADDERS`, owner-approved tables), profile-aware resolver with the narrow demotion set (`log-session`/`workflow-status`/`audit-docs` + non-strength task classes → zero-credit chain), registration declares the catalog with `economy` default · commit `bc2fafb3`.
- **P10** — 2026-11-10, companion README rewrite: default-and-flexibility statement on top, posture selection how-to (ordered array = ride down as credits run out; user profiles win via `profiles` shadowing), plans/credits picture (subscriptions, packs, allowances, rate limits), 11-model tariff table with free quotas, corrected reasoning-control matrix, four-ladder table, per-pick benchmark provenance, out-of-credits guidance · landed with P9's commit.
- **P11** — 2026-11-10, unit state: changeset amendment appended, SPEC S8–S10 + tasks P8–P11 recorded, test re-aims justified in `decisions.md`, journal fragment written.
- **P12** — 2026-11-10, data-residency documentation: the companion README grows a **Data residency — what runs where** section (owner request, same day): the six EU-cluster models named, the five External-provider models flagged `not EU-compliant until verified`, and four complete manual override blocks (user profiles shadowing each chain name — no new preset profiles) that make every posture EU-only, with the mechanical rows pinned to the zero-credit chain by hand because a shadowing profile replaces the preset's derivation wholesale (tier routing no longer applies to the shadowed name). Gap recorded, not hidden: spawned strength-sensitive task classes are not user-overridable and `quality`/`balanced` still carry the external design rung on that route.
- **P13** — 2026-11-10, catalog record: the owner's raw tariff/catalog quote recorded verbatim as `packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc` (provenance header: sources, authorship, capture date 2026-11-10, license note, docs-wins rule; explicitly not machine-consumed — `src/preset.ts` stays the route-data source of truth). New `test/catalog-parity.test.mjs` (5 tests) pins the snapshot to the billing tier map (tier derived from the snapshot itself must equal `NAN_MODELS`), the README's humanized allowances, the tariff trios, the plan/pack economics, and the header itself — a provider change now walks: update the snapshot, follow the failures. One README figure repaired in the same pass (hy4's output column 125 → 125.05, the snapshot's exact value).
- **G6** — 2026-11-10, verification: pi package 802 pass / 0 fail (74 files), companion 24 pass / 0 fail · `bun scripts/lint-changeset.mjs` exit 0 · `bun scripts/version-parity-gate.mjs --content` PASS · `bun scripts/docs-generate.mjs --check` PASS (0 stale) · `bun scripts/check-skill-context.mjs --documents` PASS · `node scripts/run-root-suite.mjs` 101 PASS / 0 fail (two runs).

## Next

Owner verdict on the integrated diff (the branch now carries #427's main + this change; E7 records the resolution).

## References

- Issue #388 (feature, OPEN) — `Closes #388` in the PR.
- Soft order: #427 (after — unified schema re-home), #201 (pass→model vocabulary).
- Roadmap: `docs/ROADMAP.md` (new feature row 388).
