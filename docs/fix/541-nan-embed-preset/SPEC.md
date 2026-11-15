---
type: feature
scope: medium
roadmap_summary: Issue [#541](https://github.com/gtrabanco/agentic-workflow/issues/541): the NaN preset ships the doc-index **embedding profile** (provider block, a measured `chunk_limit`, and pacing derived from the provider's documented limits) through the provider-preset seam, and the settings console materializes it into `.agentic-workflow/index.json` per key behind user-written values — so a NaN install gets working auto-hybrid retrieval with no hand-written `index.json`, while the runner crate stays provider-neutral and validates the profile against its own config schema.
---

# fix/541-nan-embed-preset

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change. M sizing: the two
> planning ledgers are sibling files, never embedded here.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#541` — "NEW FEATURE: NaN preset ships the doc-index embed profile (provider
block + safe chunk_limit + pacing) through the provider-preset seam". The PR
closes it via `Closes #541`.

Carrier: the issue is registered as feature row 541 in `docs/ROADMAP.md`
(slug `nan-embed-preset`, promoted 2026-11-13); the work runs through the fix
lane, so its carrier folder is this one, never a `docs/features/` folder.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #541

**S2 — The preset owns the doc-index embedding profile, and the pi package materializes it.**
> `@gtrabanco/pi-nan-agentic-workflow` (the optional NaN preset, issue #388) should also own the **doc-index embedding profile**: the provider block (`baseUrl`, `model: qwen3-embedding`, `envVar: NAN_API_KEY`), a safe `provider.chunk_limit`, and the `provider.pacing` values that match NaN's documented limits (60 rpm per key, 32K max input per request, embeddings endpoint unlimited billing and unconstrained concurrency). `@gtrabanco/pi-agentic-workflow` accepts the preset through the provider-preset seam it already registers into and materializes it into the project's index config, so a NaN user gets working auto-hybrid retrieval with no hand-written `index.json` — today a project with a configured provider and large files hits a deterministic provider 400 (issue #540).

**S3 — The preset ships the provider block with provider-derived values, not runtime discovery.**
> - The preset ships an embed profile block matching `packages/agentic-workflow`'s existing `provider` config surface: `baseUrl`, `model`, `envVar`, `chunk_limit`, `pacing` (`batchSize`, `requestsPerMinute`, `maxAttempts`, delays) — values derived from nan.builders/docs/models (60 rpm key-global, 32K max input), not from runtime discovery.

**S4 — The pi package materializes the profile at a bootstrap surface, user values winning.**
> - The pi package materializes the preset profile into the project's index config (`.agentic-workflow/index.json` or its unified-config section per the config policy, issue #427) at the appropriate bootstrap surface (`init-workspace` offer / settings command), honoring the nearest-instruction-wins rule: user-written values always win over preset values.

**S5 — The runner crate stays provider-neutral.**
> - The runner crate (`packages/agentic-workflow`) stays provider-neutral: no NaN reference, no runtime injection — the preset is config data, the crate only ever reads config.

**S6 — The preset documents the key-global caveat.**
> - The preset documents the key-global caveat: the 60 rpm limit is per API key and shared with chat traffic (Open WebUI, other tools), so the shipped pacing stays conservative or the trade-off is stated.

**S7 — The surface shows where each value came from.**
> - `/agentic-workflow-settings` (or the equivalent surface) shows whether the embed profile came from the preset, the user, or the default.

**S8 — Out of scope.**
> - Changing the crate's pacing/chunk-limit machinery or its envelope vocabulary — owned by the crate (the related defect work rides issue #540).
> - Any provider discovery at runtime (probing `/v1/models`, measuring rpm) — config data only.
> - Non-NaN presets — the seam is generic; other provider packages can copy the shape.
> - The doc-index query/sync behavior itself — feature 65 / fix 443 own it.

**S9 — Acceptance criteria, verbatim.**
> - [ ] With only the two pi packages installed (main + nan preset) and no hand-written `index.json`, `doc --sync` on this repo embeds 100% of chunks with no `unavailable-embeddings-provider-down` degradation and the pinned model matches the preset's.
> - [ ] A user-written `provider.*` value in the project config beats the preset value for every key (precedence test).
> - [ ] The preset profile validates against the crate's config schema (`chunk_limit` positive integer, pacing positive integers) — a bad value in the preset is refused, not silently passed through.
> - [ ] The pi package tests cover the materialization and precedence; the preset package tests cover the profile data; both packages' suites pass.
> - [ ] Crate README documents the provider surface; preset README documents the profile and the 60 rpm key-global caveat; version-parity and changeset gates pass.

**S10 — The owner calls the issue leaves open.**
> - Where the profile materializes: `.agentic-workflow/index.json` (the crate's current read path) vs. the unified config's extension section (issue #427 policy) — the SPEC author decides; the crate currently reads only `index.json`, so materializing there is the zero-code path.
> - Whether the preset should ship pacing below 60 rpm by default given the key-global limit (chat traffic competes) — owner call.
> - `chunk_limit: 6000` chars was validated empirically on this repo; the preset may prefer a more generous value (e.g. 8,000–10,000 chars with `batchSize` 4–6) — bounded by the 32K-token request ceiling, not credit cost (embeddings are unlimited).

## Impact

- `packages/agentic-workflow/src/doc/config.mjs` (+ a new `config.d.mts`) — the
  schema owner. `validateConfig` gains the full provider-block validation
  (`baseUrl`/`model`/`envVar` non-empty strings, `provider.pacing` positive
  integers) and its body is exported as `validateIndexConfigObject(root, parsed)`
  so a writer outside the crate validates a candidate against the same code the
  loader runs. `loadConfig` delegates to it: **no behavior change for a valid
  file**, and a previously-latent bad pacing value is now refused at load with a
  named usage error instead of only at sync time (declared tightening, D4).
- `packages/pi-agentic-workflow/src/config/presets.ts` — the seam gains
  `embedProfile?` on `ProviderPreset` plus `getEmbedProfiles()`. The seam keeps
  knowing the *shape*, never a provider name.
- `packages/pi-agentic-workflow/src/config/embed-profile.ts` (new) — the
  materializer: per-key precedence plan, candidate validation through the crate,
  write, and the origin report (`preset` / `user` / `default`).
- `packages/pi-agentic-workflow/src/settings/console.ts` — one new menu entry
  (`Doc index embedding profile`) that shows the per-key origin and asks before
  writing; a declined question writes nothing, an untrusted project refuses.
- `packages/pi-nan-agentic-workflow/src/embed-profile.ts` (new) +
  `src/extension.ts` — the NaN profile data and its registration; the data is
  pinned to `catalog/nan-catalog-2026-11.jsonc`.
- The three package READMEs (crate provider surface, pi seam + console action,
  preset profile + the 60 rpm key-global caveat),
  `skills/init-workspace/SKILL.md` (the retrieval-index consent bullet names the
  action instead of hand-writing the file), `docs/ROADMAP.md` (fix row +
  feature-row status through the writers), `.changeset/`, `docs/LOGS.md`.
- Consumers of the changed code: `loadConfig` has one importer family inside the
  crate (`store.mjs`, `sync.mjs`, `query.mjs`, `embeddings.mjs`, `retrieval.mjs`)
  and none outside it; `getProviderPresets()` has three consumers
  (`settings/view.ts`, `settings/console.ts`, `config/profiles.ts`); the
  console's `prompts` table is read by `test/settings-console.test.mjs`, so a new
  entry there must not re-sequence an existing flow.

**Named high-risk item**: none — the tier verdict below is `standard`; the one
destructive surface the change touches is the settings console's write, which is
exercised in `/tmp` fixtures and in-memory collectors only.

## Retirements

- The `validateConfig`-private provider checks retire into the exported
  `validateProviderConfig` (one implementation, two callers: the loader and the
  materializer). Evidence they moved, not vanished:
  `rg -c 'provider\.chunk_limit must be a positive integer' packages/agentic-workflow/src/doc/config.mjs` → 1.
- The console's "the only file this console writes is the unified config" is
  narrowed by prose, not by code: the index-config write is a separate,
  consent-gated action with its own file. Nothing is removed.
- Everything else is **strictly additive**; the added-surface inventory is the
  diff (`git diff --stat main..HEAD`) plus the `## Obligations` rows, each with
  its named consumer.

## Non-goals

- No change to the crate's pacing/chunk-limit *machinery*, envelope vocabulary or
  degradation set (S8).
- No runtime provider discovery, no `/v1/models` probe, no measured rpm (S8).
- No provider name, NaN prose or vendor constant enters
  `packages/pi-agentic-workflow/` or the crate (S5, S8).
- No new native slash command: the surface is the settings console entry S7 names.
- No automatic write at extension load, in the query path, or in `doc --sync`.

## Risk tier

- **Tier** — `standard` · **Task Size** — medium
- **Named high-risk item** — none — not a high-tier unit

Computed, not chosen: `standard` — executable source in three packages, one
config-validation tightening with a declared differential, and no
`destructive`/security-tagged path (the only write is a consent-gated JSON file
under `.agentic-workflow/`, which the crate already owns).

## Future

none

## Future cost

- **The index provider block has two writers from now on**: the operator (hand
  edit) and the console's materializer. They are kept honest by the crate being
  the only validator (`validateIndexConfigObject`) — a future writer must call it
  too, never re-implement the checks.
- **The origin report compares values, not provenance**: a project whose
  hand-written values equal the preset's reports `preset`. That is deliberate
  (the values are identical, so the statement is true) and binds future work:
  provenance must never be inferred from anything else.
- **A preset value change reaches an already-materialized project only by an
  explicit re-apply**: the materializer fills absent keys, so it never rewrites
  what it wrote earlier. A future "update to the preset's current values" action
  is a new unit, not a silent extension.

## Applicable tests

- `packages/agentic-workflow/test/doc.config.test.mjs` (new sibling suite: the
  provider block, the exported validator, the load-path parity).
- `packages/agentic-workflow` regression: `doc.store`, `doc.embeddings`,
  `doc.sync`, `doc.hybrid` suites (the loader's consumers).
- `packages/pi-agentic-workflow/test/embed-profile.test.mjs` (new: plan,
  precedence, validation refusal, idempotence, report).
- `packages/pi-agentic-workflow/test/embed-profile-console.test.mjs` (new: the
  menu entry, consent, decline, untrusted project, origin display).
- `packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` (new: a
  materialized profile in a git fixture → `doc --sync` embeds every chunk, no
  degradation, pinned model equals the profile's).
- `packages/pi-nan-agentic-workflow/test/embed-profile.test.mjs` (new: the data,
  its registration, its catalog parity, its validation through the seam).
- Regression: `packages/pi-agentic-workflow/test/settings-console.test.mjs`,
  `provider-presets.test.mjs`, `vendor-neutral.test.mjs`.

## Known pre-existing issues

- `docs/fix/570-…`-class store defects are out of scope: the crate's `doc` path
  is untouched beyond `config.mjs`, `affects` only the validation timing (D4).
- The repo's own `.agentic-workflow/index.json` sets `chunk_limit: 6000` and
  `pacing.batchSize: 6` by hand — `does-not-affect` this unit: it is a valid
  config and is never rewritten (the live-tree guard), it only informs the
  preset's values (PE-010).
- `scripts/doc-discipline.test.mjs` polices index.json documentation; it is a
  root suite and stays green (it reads docs, not this change's code).

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the two
  planning ledgers are frozen in this folder before the implementation landed,
  and the work arrives as conventional commits. Check:
  `ls docs/fix/541-nan-embed-preset/` lists `SPEC.md`,
  `planning-evidence.md` and `planning-obligations.md`, and the freeze commit
  carries every row `planned`.
- **AC-S2** — The preset package exports the NaN embed profile and registers it
  through the seam, and the profile's values are the provider's documented ones.
  Check: `cd packages/pi-nan-agentic-workflow && bun test test/embed-profile.test.mjs`
  exits 0 and `test/catalog-parity.test.mjs` pins `base_url`, the model slug and
  the 60 rpm limit to the recorded snapshot.
- **AC-S3** — The profile validates against the crate's config schema, and a bad
  value is refused by name instead of written. Check:
  `cd packages/agentic-workflow && bun test test/doc.config.test.mjs` exits 0
  (positive-integer `chunk_limit`, positive-integer pacing, the string fields)
  and `cd packages/pi-agentic-workflow && bun test test/embed-profile.test.mjs`
  exits 0 (a fixture preset with `chunk_limit: 0` and one with
  `pacing.batchSize: 0` are both refused, nothing is written).
- **AC-S4** — Materialization honors nearest-instruction-wins per key and is
  idempotent. Check: the same pi suite's precedence cases (a user-written
  `provider.model`, `provider.chunk_limit` and `provider.pacing.batchSize` each
  survive a materialization that fills the remaining keys; a second run writes
  nothing).
- **AC-S5** — The materialization surface is the settings console action, it
  shows the per-key origin (`preset` / `user` / `default`), and it asks before
  writing: a decline writes nothing, an untrusted project refuses, and no preset
  registered means a warning with no write. Check:
  `cd packages/pi-agentic-workflow && bun test test/embed-profile-console.test.mjs`
  exits 0.
- **AC-S6** — End to end, a project with a materialized profile and no
  hand-written `index.json` embeds every chunk, declares no degradation, and
  pins the profile's model. Check: `test/embed-profile-e2e.test.mjs` exits 0
  (git fixture + the injected embedder: `store.pending === 0`,
  `degradations === []`, `store.model` equals the profile's `model`).
- **AC-S7** — The crate stays provider-neutral and the seam knows only a shape.
  Check: `! rg -q 'nan' packages/agentic-workflow/src/doc/config.mjs` exits 0,
  `! rg -qi 'nan' packages/pi-agentic-workflow/src/config/embed-profile.ts` exits
  0, and `cd packages/pi-agentic-workflow && bun test test/vendor-neutral.test.mjs`
  exits 0.
- **AC-S8** — Documentation and release intent ship in the same change: the
  crate README documents the full provider surface, the preset README documents
  the profile and the 60 rpm key-global caveat, `skills/init-workspace/SKILL.md`
  names the action instead of a hand-written file, `.changeset/` carries the
  release intent, and the roadmap rows are written through `rowUpsert` /
  `fixrow`. Check: `bun scripts/lint-changeset.mjs` exits 0,
  `bun scripts/version-parity-gate.mjs --content` exits 0,
  `bun scripts/docs-generate.mjs --check` exits 0, and
  `bun scripts/check-skill-context.mjs` exits 0.
- **AC-S9** — No previous behaviour regresses: a valid `index.json` loads
  exactly as before, the keyword-only path is unchanged, and the console's
  existing flows are untouched. Check: the baseline suites re-run green —
  `cd packages/agentic-workflow && bun run test`,
  `cd packages/pi-agentic-workflow && bun run test`,
  `cd packages/pi-nan-agentic-workflow && bun run test`,
  `bun scripts/run-root-suite.mjs` — all exit 0, plus the differential receipt
  in the `## Log` (`G` lines) for the crate's config commands.

## Tasks

- P1 — Cut this unit doc and freeze the two planning ledgers in the repo's own
  shapes (9-column obligations, 6-column evidence), every row `planned` at cut.
  (validator: `rg -c '^\| O[0-9]+ \|' docs/fix/541-nan-embed-preset/planning-obligations.md` matches ≥15)
  (Implements: S1)
  - Relevant files: docs/fix/541-nan-embed-preset/SPEC.md, docs/fix/541-nan-embed-preset/planning-evidence.md, docs/fix/541-nan-embed-preset/planning-obligations.md
- P2 — Land the crate's validation suite red, then green: the provider-block
  checks and the exported `validateIndexConfigObject`.
  (validator: `cd packages/agentic-workflow && bun test test/doc.config.test.mjs` exits 0)
  (Implements: S3, S9)
  - Relevant files: packages/agentic-workflow/test/doc.config.test.mjs, packages/agentic-workflow/src/doc/config.mjs, packages/agentic-workflow/src/doc/config.d.mts
- P3 — Extend the seam with `embedProfile` and `getEmbedProfiles`, red then
  green. (validator: `cd packages/pi-agentic-workflow && bun test test/provider-presets.test.mjs test/embed-profile.test.mjs` exits 0)
  (Implements: S2, S5)
  - Relevant files: packages/pi-agentic-workflow/src/config/presets.ts, packages/pi-agentic-workflow/test/embed-profile.test.mjs
- P4 — Implement the materializer (plan, precedence, validation, write, report),
  red then green. (validator: `cd packages/pi-agentic-workflow && bun test test/embed-profile.test.mjs` exits 0)
  (Implements: S2, S4, S7, S9)
  - Relevant files: packages/pi-agentic-workflow/src/config/embed-profile.ts
- P5 — Wire the console entry and its consent, red then green.
  (validator: `cd packages/pi-agentic-workflow && bun test test/embed-profile-console.test.mjs` exits 0)
  (Implements: S4, S7)
  - Relevant files: packages/pi-agentic-workflow/src/settings/console.ts, packages/pi-agentic-workflow/test/embed-profile-console.test.mjs
- P6 — Prove the end-to-end embed with a materialized fixture profile.
  (validator: `cd packages/pi-agentic-workflow && bun test test/embed-profile-e2e.test.mjs` exits 0)
  (Implements: S9)
  - Relevant files: packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs
- P7 — Ship the NaN profile data, its registration and its catalog parity, red
  then green. (validator: `cd packages/pi-nan-agentic-workflow && bun test` exits 0)
  (Implements: S2, S3, S6)
  - Relevant files: packages/pi-nan-agentic-workflow/src/embed-profile.ts, packages/pi-nan-agentic-workflow/src/extension.ts, packages/pi-nan-agentic-workflow/test/embed-profile.test.mjs, packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc
- P8 — Documentation and state: the three READMEs, the init-workspace bullet,
  the changeset, the roadmap rows, the capabilities row and the session log.
  (validator: `bun scripts/lint-changeset.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S6, S7, S9)
  - Relevant files: packages/agentic-workflow/README.md, packages/pi-agentic-workflow/README.md, packages/pi-nan-agentic-workflow/README.md, skills/init-workspace/SKILL.md, .changeset/541-nan-embed-preset.md, docs/ROADMAP.md, docs/LOGS.md
- P9 — Verification: every package suite, the root gate and the obligation
  ledger closed.
  (validator: `bun scripts/run-root-suite.mjs` exits 0 and every obligation row is `verified`)
  (Implements: S1, S9)
  - Relevant files: docs/fix/541-nan-embed-preset/planning-obligations.md

## Triaged steps

n/a — the owner's local workflow replaces the triage step list for this unit
(`/unit-lane` is not run; §5's ledger freeze is the plan). The audit trail is
`## Log` `P` lines plus the `## Obligations` phases.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-15, the request, verbatim:
  ```
  Apply to this repository: issue #541
  ```
- **L2** — 2026-11-15, the issue's in-scope and acceptance text, verbatim:
  ```
  ### In scope

  - The preset ships an embed profile block matching `packages/agentic-workflow`'s existing `provider` config surface: `baseUrl`, `model`, `envVar`, `chunk_limit`, `pacing` (`batchSize`, `requestsPerMinute`, `maxAttempts`, delays) — values derived from nan.builders/docs/models (60 rpm key-global, 32K max input), not from runtime discovery.
  - The pi package materializes the preset profile into the project's index config (`.agentic-workflow/index.json` or its unified-config section per the config policy, issue #427) at the appropriate bootstrap surface (`init-workspace` offer / settings command), honoring the nearest-instruction-wins rule: user-written values always win over preset values.
  - The runner crate (`packages/agentic-workflow`) stays provider-neutral: no NaN reference, no runtime injection — the preset is config data, the crate only ever reads config.
  - The preset documents the key-global caveat: the 60 rpm limit is per API key and shared with chat traffic (Open WebUI, other tools), so the shipped pacing stays conservative or the trade-off is stated.
  - `/agentic-workflow-settings` (or the equivalent surface) shows whether the embed profile came from the preset, the user, or the default.

  ### Acceptance criteria

  - [ ] With only the two pi packages installed (main + nan preset) and no hand-written `index.json`, `doc --sync` on this repo embeds 100% of chunks with no `unavailable-embeddings-provider-down` degradation and the pinned model matches the preset's.
  - [ ] A user-written `provider.*` value in the project config beats the preset value for every key (precedence test).
  - [ ] The preset profile validates against the crate's config schema (`chunk_limit` positive integer, pacing positive integers) — a bad value in the preset is refused, not silently passed through.
  - [ ] The pi package tests cover the materialization and precedence; the preset package tests cover the profile data; both packages' suites pass.
  - [ ] Crate README documents the provider surface; preset README documents the profile and the 60 rpm key-global caveat; version-parity and changeset gates pass.
  ```

## Next

Close the obligation ledger: every row `verified` with its foreground validator
receipt, then hand the diff to the owner as the external verifier.

## References

- Issue [#541](https://github.com/gtrabanco/agentic-workflow/issues/541) — `Closes #541`.
- Issue [#388](https://github.com/gtrabanco/agentic-workflow/issues/388) — the
  provider-preset seam and the companion package (`docs/features/388-extract-nan-vendor-coupling/`).
- Issue [#540](https://github.com/gtrabanco/agentic-workflow/issues/540) — the
  request budget and the rejection semantics the profile must respect
  (`docs/fix/540-embedding-pass-batch-limit/`).
- Issue [#443](https://github.com/gtrabanco/agentic-workflow/issues/443) /
  [#470](https://github.com/gtrabanco/agentic-workflow/issues/470) — the doc
  index, `provider.pacing` and `provider.chunk_limit`.
- Issue [#427](https://github.com/gtrabanco/agentic-workflow/issues/427) — the
  unified config; `docs/workflow/CONFIG.md` owns why the index config is not one
  of its sections (D1 below).
- `packages/pi-nan-agentic-workflow/catalog/nan-catalog-2026-11.jsonc` — the
  recorded provider facts every profile value derives from.

## Branch

`feat/541-new-feature-nan-preset-ships-the-doc-index-embed`

## Depends on

`docs/fix/540-embedding-pass-batch-limit/` — merged on `main` (the request
budget and `embeddings-request-rejected` are the profile's safety floor). Soft
order only, declared resolved.

## Regression scope

| Scenario | Verified by |
|---|---|
| A valid `index.json` (including this repository's) loads with the same merged config as before | `packages/agentic-workflow` `doc.store` + `doc.config` suites exit 0 |
| The keyword-only path is unchanged when no provider is configured (no `chunk_limit` truncation, no enforcement) | `packages/agentic-workflow` `doc.sync` suite exits 0 |
| The provider-resolution precedence (`cli` > env > config) is unchanged | `packages/agentic-workflow` `doc.embeddings` suite exits 0 |
| The settings console's existing flows are untouched by the new menu entry | `packages/pi-agentic-workflow` `settings-console` suite exits 0 |
| A registered preset without an `embedProfile` behaves exactly as before | `packages/pi-agentic-workflow` `provider-presets` suite exits 0 |
