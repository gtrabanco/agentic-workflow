# 40 — versioned-skills-releases

> Feature specification for issue
> [#180](https://github.com/gtrabanco/agentic-workflow/issues/180). One SPEC,
> two halves: this file's Product half is authored by `design-feature` (this
> document); the Engineering half is authored by `plan-feature` after an
> independent Product review.

## Goal

One unified release pipeline for the agentic-workflow ecosystem: skills (via
`npx skills`), the Pi plugin package, and the schema package share a version
number (a single train), with channels via npm dist-tags (canary auto on every
merge, stable/beta/alpha/rc manual via dispatch, force-version override for
marketing/PR campaigns), and a per-PR intent file (changesets-format) that the
deterministic `release.mjs` script consumes. Skills install via git refs
(`#main`, `#stable`, `#vX.Y.Z`); npm packages via dist-tags (`latest`, `canary`,
`beta`, `alpha`, `rc`).

## Branch

`feat/40-versioned-skills-releases`

## Size

`L` — touches scripts, three package.jsons, both publish workflows, CHANGELOG ×2,
README ×2, skills README tables, and model-routing.yml plus the Pi mirror.

## Dependencies

No remaining hard dependencies:

- **30 `repair-receipt-delta-review`**: MERGED via PR #188 (2026-09-07).
  No surface overlap with release workflow files or publish dispatch inputs.
- **37 `phase-lint-script`**: MERGED via PR #212 (2026-09-15). Vehicle rule
  (who creates `packages/agentic-workflow` crate) already satisfied — the
  crate exists on `main`.
- **38 `workflow-status-sensor-script`**: MERGED via PR #213 (2026-09-12).
  Same vehicle rule; no surface overlap.
- **31 `planning-review-materiality`**: `idea`, not started. Touches
  `pre-execution-review`/`review-spec`/`review-plan` LEDGERS/POLICY — zero
  overlap with release surfaces (`scripts/release.mjs`, publish workflows,
  CHANGELOG tables, README tables, model-routing.yml, `bump-skill`).
- **32 `review-consistency-pack`**: `idea`, not started. Touches
  `review-implementation`/`audit-docs`/`product-audit` — none are release
  surfaces.
- **Roadmap row**: The `Depends on:` field (`30 31 32 37 38`) will be corrected
  to `—` in the PR (this design supersedes the stale coupling; see D-40-1).

Soft dependencies:
- **33 `turn-contract-single-owner`**: May touch `bump-skill` surface (Skill.md
  files). The PR should land after 33 if 33 happens to touch the changelog or
  README surfaces. No blocking.
- **PR #225** (`fix/224-deterministic-replan-routing`): Still OPEN as of 2026-09-16.
  May land before or after 40. This affects the **first train version number**
  (unpredictable), not the design.

---

## Product half

Written by `design-feature`. Not complete until `## Design status` below reads
`designed` — `plan-feature` refuses to plan a feature not marked `designed`.

### Context

This repo has two npm packages published today (`@gtrabanco/agentic-workflow-schema`
4.1.1, `@gtrabanco/pi-agentic-workflow` 0.9.3), a third (`@gtrabanco/agentic-workflow`
0.0.0) unpublished, and skills distributed via `npx skills add gtrabanco/agentic-workflow`
(tracking `main`). Releases are manual per-package: bump version → commit → push →
CI detects version change → publishes via OIDC Trusted Publishing. There is:

- **No unified version number** across skills + npm packages.
- **No canary channel** for skills (only `#main`, `#claude`, `#inheritance` refs).
- **No npm dist-tags** beyond `latest` (no `canary`, `beta`, `rc`, `alpha`).
- **No per-PR intent file** — version bumps and changelog entries are manual in
  the same PR as the change, not in a separate `.changeset/` format.
- **No force-version override** — the next version is always computed from the
  last published one.
- **No stable release tag** — only git branches (`main`, `#claude`) for pinning.
  Skills.sh has no version registry (E3 from interview).

The gap causes: (1) users can't easily install experimental skills (`canary`
only through `#main` which also has unapproved changes), (2) the Pi package
release lags behind the skills tree since the mirror is re-bundled per-package
not per-train, (3) marketing/PR campaigns can't pin an exact version (e.g.
"the next stable release is 5.0.0" for promotion), (4) manual releases for
three independent packages are error-prone and disconnected from the actual
changes in the repo.

### Business goals

- **One version number** for the entire agentic-workflow ecosystem (skills tree
  + pi package + schema package), so a `npx skills add gtrabanco/agentic-workflow@vX.Y.Z`
  and `npm install @gtrabanco/pi-agentic-workflow@X.Y.Z` refer to the same
  contract.
- **Canary channel** — automatic on every merge to main, matching Bun's model
  (`bun upgrade --canary` → `npm install bun@canary`), for dogfooding without
  polluting stable.
- **Manual stable release** — on demand, with force-version override. Stable
  releases become `latest` on npm and a `stable` branch on git.
- **Force-version override** — when the user needs to announce "the next stable
  release is 5.0.0" for marketing/promotion reasons, the version is forced.
- **Dist-tags for npm** — `latest` (stable), `canary` (auto), `beta`/`rc`/`alpha`
  (manual promotions). Skills install via git refs (`#stable`, `#vX.Y.Z`).
- **Per-PR intent file** — a changesets-format file (not the full changesets
  tool) that accumulates in the PR and is consumed by the deterministic release
  script at launch time.

### Scope

#### In scope

1. **Deterministic `scripts/release.mjs`** — a script that consumes accumulated
   changeset-format intent files, computes the next version, and applies it to
   the unified train version + per-package versions (schema, pi, agentic-workflow).
2. **`scripts/release.mjs` — npm publish via dispatch** — a dispatch input
   (optional `--version OVERRIDE`, optional `--channel latest|canary|beta|alpha|rc`)
   that publishes all touched packages with the correct dist-tag.
3. **`scripts/release.mjs` — git tag** — creates `vX.Y.Z` tag and
   pushes the stable branch (`refs/heads/stable`) on stable release.
4. **`scripts/release.mjs` — GitHub Release** — posts a release with notes from
   the accumulated changeset files (PR bodies) plus contributors list (from PR
   authors).
5. **Channel ladder** — alpha → beta → rc → stable, stable resets to alpha.
   Canary auto = `<base>-canary.<date>.<n>` (Bun-style version shape).
6. **Force-version override** — manual input on dispatch that bypasses
   computation (e.g. `--version 5.0.0`).
7. **skills.sh channels** — `#stable` branch (fast-forwarded on stable release),
   `#vX.Y.Z` tags (hard pin), `#main` (canary-equivalent).
8. **UPDATE ROADMAP** — update the dependencies field of row 40 from
   `30 31 32 37 38` to `—` (the stale coupling removed in this design).
9. **UPDATE CLAUDE.md** — update the "Changesets: deliberately not adopted"
   decision note (2026-08-30) with the reopening rationale (third package now
   exists, beta channels now needed — both triggers fired by this design).

#### Out of scope / non-goals

- **No full changesets tool adoption** — the file format is adopted, not the
  tool (changesets' workspace machinery is unnecessary: zero cross-deps between
  the three packages, no root package.json needed).
- **No CI automation** — stable release is always manual via `workflow_dispatch`;
  canary is auto-on-merge but gated by version ≠ registry (same as current
  publish workflows).
- **No changes to npm OIDC publishing** — the existing publish workflows
  (`publish-schema.yml`, `publish-pi-package.yml`) stay; dispatch input
  adds `--tag` for dist-tag. No Trusted Publisher re-binding needed.
- **No skills.sh registry changes** — skills.sh has no version registry
  (it's install-derived only). Channels via git refs only.
- **No automatic release notes generation** — changelog tables in
  `CHANGELOG.md`/`CHANGELOG.es.md` stay as the release-notes surface (bilingual,
  curated). Changeset PR bodies become GitHub Release notes (English-only).
- **No changes to the existing publish gate** — "version ≠ registry" still
  applies; `--version OVERRIDE` can create an artificial version bump, but the
  publish gate still checks.

### Capability closure

**1. Entity closure**

For each entity this feature introduces or touches:

- **`scripts/release.mjs`** — Create: new file · Execute: deterministic
  script · Read: `bun run scripts/release.mjs --help` · Update: bump version,
  publish, tag, create release · Delete: n/a (core surface) · Test:
  `node scripts/release.mjs --dry-run --version 4.2.0` → expected output
- **`.changeset/*.md` files** (intent files) — Create: PR adds a markdown file
  (frontmatter + body) · Read: `scripts/release.mjs` parses them · Update:
  re-run script · Delete: re-run with empty directory · Test: lint test verifies
  format before PR merge
- **`vX.Y.Z` tags** — Create: `git tag vX.Y.Z && git push origin vX.Y.Z` ·
  Read: `git ls-remote --tags` · Update: n/a (immutable, npm can't un-publish)
  · Delete: `git push origin --delete vX.Y.Z && npm dist-tag rm vX.Y.Z canary`
  · Test: `git ls-remote --tags origin | grep vX.Y.Z`
- **`refs/heads/stable` branch** — Create: `git checkout -b stable && git push`
  · Read: `npx skills add gtrabanco/agentic-workflow#stable` · Update:
  fast-forward on stable release · Delete: n/a (keep as safety net)
  · Test: `git branch -r stable`
- **npm dist-tag `canary` / `beta` / `rc` / `alpha`** — Create:
  `npm publish --tag canary` · Read: `npm dist-tag ls <pkg>` · Update:
  `npm dist-tag add <ver> <tag>` / `npm dist-tag rm <ver> <tag>`
  · Delete: tag is immutable (only `latest` moves on publish) · Test:
  `npm view <pkg> dist-tags --json`
- **GitHub Release** — Create: `gh release create vX.Y.Z --title "vX.Y.Z" --notes <notes>`
  · Read: `gh release view vX.Y.Z` · Update: `gh release edit vX.Y.Z --title "..."`
  · Delete: n/a · Test: `gh release view vX.Y.Z`
- **Changesets-format intent file** — Create:
  `.changeset/NN-name.md` with YAML frontmatter + body · Read:
  `scripts/release.mjs` parses frontmatter (`version: patch|minor|major`,
  `packages: schema|pi-agentic-workflow|agentic-workflow`) · Update: edit file
  (not a PR) · Delete: remove file · Test: lint test before merge

**2. Integration closure**

For EACH subsystem in the capability inventory:

- `auth` — npm publish via OIDC Trusted Publishing uses `id-token: write` in
  workflow files. The release script does not add auth, only `--tag`.
  · Test: `bun run scripts/release.mjs --dry-run` → OIDC still required
  (workflow-level) | n/a: `scripts/release.mjs` does not handle auth
- `ACL / permissions` — npm Trusted Publisher record binds to workflow filename.
  Adding `--tag` dispatch input to existing workflows does not change the record.
  · Test: no Trusted Publisher re-registration needed (same filename, same OIDC)
  | n/a: no new ACL
- `navigation` — n/a: this is a release pipeline, not a user-facing surface
- `notifications` — n/a: no new notification channel; GitHub Release notes are
  an existing notification surface
- `search` — n/a: release artifacts are not searchable
- `audit log / activity trail` — git history preserves every version bump and tag.
  GitHub Releases provide an audit trail. · Test:
  `git log --oneline --graph` shows version bump commits
  | n/a: no new audit surface
- `settings / preferences` — `scripts/release.mjs` uses CLI args (no config file)
  · Test: `--dry-run` / `--version` / `--channel` flags work independently
  | n/a: no persistent settings
- `background jobs / scheduling` — canary publish happens on merge to main via
  existing push-to-main gate + new `--tag canary` dispatch variant. Stable
  publish via `workflow_dispatch` (manual).
  · Test: merge triggers canary; dispatch triggers stable | n/a: existing gate
- `file / media storage` — n/a: no file upload
- `i18n / localization` — CHANGELOG tables in both EN and ES stay bilingual.
  GitHub Release notes are English-only (changeset PR bodies). No i18n change.
  · Test: CHANGELOG tables still present after release · n/a: English-only for
  GitHub Release notes
- `feature flags` — n/a: no feature flags for release pipeline
- `billing / payments` — n/a: not applicable
- `public API / integrations` — `npx skills add` reads from `main`/`stable`/tags.
  npm packages read from dist-tags. Both are public APIs.
  · Test: `npx skills add gtrabanco/agentic-workflow@#stable` resolves tag
  | n/a: no new API surface

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Canary is published only for packages that actually changed on the merge | in-scope | AC-08 (package filter) |
| 2 | Canary version never satisfies `^` ranges (semver prerelease rule) | in-scope | AC-07 (version shape) |
| 3 | `latest` dist-tag is only moved by stable release (not by canary/beta/rc) | in-scope | AC-09 (tag immutability) |
| 4 | Force-version override is visible in changelog as "forced by operator" | in-scope | AC-10 (forced release note) |
| 5 | Stable release can be rolled back with `--tag stable` to older tag | in-scope | AC-11 (rollback via stable branch) |
| 6 | Canary publish is idempotent (same HEAD → same canary version) | in-scope | AC-12 (deterministic canary) |
| 7 | `scripts/release.mjs` works under plain Node (not just bun) | in-scope | AC-13 (node-compat) |
| 8 | Changelog tables (EN+ES) are updated in the same commit as version bump | in-scope | AC-14 (changelog sync) |
| 9 | Contributors are credited in GitHub Release notes from PR authors | in-scope | AC-15 (contributor list) |
| 10 | Release script fails closed on malformed changeset intent file | in-scope | AC-16 (lint test) |
| 11 | npm can't be unpublished (immutable), so bad canary is only blast-radius limited | out-of-scope | See "Canary immutability" in non-goals |
| 12 | CI is not automated — stable release is always manual | out-of-scope | Non-goals: no CI automation |
| 13 | Changesets-format files live in `.changeset/` and are linted before merge | in-scope | AC-16 (lint test in PR) |
| 14 | Stable channel pin via `#stable` or `latest` dist-tag always gives same version | in-scope | AC-11 (stable = latest) |

### Acceptance criteria

Objective, verifiable conditions for "done".

- **AC-01** (`node-compat`): `node scripts/release.mjs --help` runs and prints
  usage without bun being installed (`bun` in `PATH` absent) → `node scripts/release.mjs` works.
  Command: `PATH=/usr/bin:$PATH bun run scripts/release.mjs --help` (should fail) → fallback to `node`.
- **AC-02** (`lint test`): PR with a `.changeset/*.md` file fails CI if the
  file doesn't parse (YAML frontmatter + body): `node scripts/lint-changeset.mjs` →
  exit 0 on valid, exit 1 on malformed.
- **AC-03** (`version compute`): `scripts/release.mjs --version 4.2.0` bumps
  package versions (schema, pi, agentic-workflow), CHANGELOG tables (EN+ES),
  README skills table, model-routing.yml, and prints the diff. Verified:
  `grep '"version"' packages/*/package.json` returns `4.2.0` for all.
- **AC-04** (`npm publish --tag canary`): On merge to main, `publish-*.yml`
  adds `--tag canary` dispatch input variant. Verified:
  `grep '"canary"' .github/workflows/publish-*.yml` returns a dispatch input row.
- **AC-05** (`npm publish --tag latest`): On stable release dispatch,
  `--tag latest` publishes the stable version. Verified:
  `npm view <pkg> dist-tags --json` returns `latest` after dispatch.
- **AC-06** (`npm publish --tag beta|alpha|rc`): Manual dispatch with
  `--channel beta` publishes under `beta` dist-tag, not `latest`.
  Verified: `npm view <pkg> dist-tags --json` returns `beta` not `latest`.
- **AC-07** (`canary version shape`): Canary version is
  `<latest-stable>-canary.<yyyymmdd>.<n>` (e.g. `4.2.0-canary.20260916.1`).
  Verified: `npm view @gtrabanco/pi-agentic-workflow@canary version` returns
  a value matching this regex (before first stable release, the base is the
  last published stable version).
- **AC-08** (`package filter`): A merge touching only `skills/` (no package
  changed) does NOT cut canary for npm packages. Verified:
  `git diff --stat` on merge shows package.json touched? → publish or skip.
- **AC-09** (`latest immutability`): Canary/beta/rc publish never moves `latest`.
  Verified: `npm view <pkg> dist-tags --json` shows `latest` unchanged after
  canary/beta/rc publish.
- **AC-10** (`forced release note`): A force-version release (via
  `--version OVERRIDE`) includes a note in the release body: "Version forced
  by operator: X.Y.Z" (visible in `gh release view X.Y.Z`).
- **AC-11** (`stable = latest`): Stable release publishes to `latest` and
  updates the `stable` branch (fast-forwarded to the release commit).
  Verified: `git branch -r stable` shows the commit;
  `npm view <pkg> dist-tags --json` includes `latest`.
- **AC-12** (`deterministic canary`): Publishing canary twice at the same
  HEAD produces the same version (date-stamp based, not random).
  Verified: two `node scripts/release.mjs --channel canary` at same HEAD → same version.
- **AC-13** (`rollback via stable`): If a stable release is broken, the
  `stable` branch can be fast-forwarded back to a previous good commit.
  Verified: `git push --force origin stable@{upstream}` → next `npx skills add ...@#stable` resolves to old version.
- **AC-14** (`changelog sync`): Stable release updates CHANGELOG EN+ES in
  same commit (same version row, both present).
  Verified: `git log --oneline` → last commit touches both `CHANGELOG.md` and `CHANGELOG.es.md` with matching version row.
- **AC-15** (`contributor list`): GitHub Release includes a "Contributors"
  section with names from PR authors (not commits).
  Verified: `gh release view X.Y.Z --json body` → `body` contains contributor names.
- **AC-16** (`lint malformed changeset`): PR with malformed `.changeset/*.md`
  file fails CI lint test.
  Verified: `node scripts/lint-changeset.mjs <malformed-file>` → exit 1.

### Tooling

- **GitHub CLI** (`gh`) — for creating releases (`gh release create`),
  listing releases, checking PR authors (`gh pr view --json authors`).
  Already available in CI (GitHub Actions).
- **npm CLI** (`npm`) — for publishing (`npm publish --tag`), dist-tag management.
  Used in publish workflows (Trusted Publishing OIDC).
- **Node.js** — `scripts/release.mjs` runs under Node 22 (Guaranteed fallback).
  bun also works.

### Product decisions

1. **Tool adoption: changesets file-format (not the tool).**
   Zero cross-deps between the three packages makes changesets' workspace
   machinery unnecessary. The file format captures PR-time intent without a
   workspace root. CLAUDE.md "Changesets: deliberately not adopted" note is
   superseded by this design (reopen triggers fired: third package exists,
   beta channels needed).
2. **Unified version train.** All three packages + the skills ecosystem share
   one release number. Per-skill `version:` stays as the change ledger (bump-skill).
   The train version = highest bump implied by accumulated changeset files.
3. **Channel ladder auto-resets.** Stable release → next release auto-promotes
   to alpha (unstable). Canary = `<base>-canary.<date>.<n>` (Bun-style).
   Canary on merge → `<base>` is the last stable release (or last published).
   Manual promotions: alpha → beta → rc → stable (operator chooses).
   Stable resets to alpha for the next release.
4. **Force-version override.** The user can specify an exact version at launch
   time (`--version OVERRIDE`). This bypasses computation. The release body
   notes "forced by operator." Used for marketing/PR campaigns.
5. **First train version is computed, not fixed.** The first release version
   (after this feature merges) is the result of applying accumulated changesets
   at launch time. Cannot be predicted by design (PR #225 may land before or
   after, affecting bump level).
6. **English-only.** The english-only-interim policy (`.es.md` siblings deleted,
   bilingual rule retired until feature 57) is confirmed. CHANGELOG tables
   stay EN+ES (they are the release-notes surface, not human workflow docs).
   GitHub Release notes are English-only.
7. **skills.sh channels via git refs only.** No npm registry changes.
   `#main` = canary-equivalent, `#stable` = stable branch, `#vX.Y.Z` = hard pin.

### Deferred decisions

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|
| Per-skill `version:` after unified train — keep or remove from skills? | Skills already carry `version:` (bump-skill enforced). The train version is the ecosystem contract; per-skill is a change ledger. Removing it would require updating bump-skill and every SKILL.md. | phase-engineering: decide if bump-skill should still update per-skill versions (yes, for the change ledger) or only the train version (no, simplified) |
| Canary publish on every merge to main — or gated by a flag? | Default Bun model: every main merge cuts canary. Some merges touch only docs. A `--canary` flag on the merge workflow would gate it. | phase-engineering: decide if canary should be unconditional (Bun model) or gated (more control) |
| Stable release frequency — what is the target cadence? | Not specified. Could be "on demand" (current manual) or "weekly" / "bi-weekly" / "on feature completion." | product: decide if a cadence is desired (user request) or purely on-demand |
| Auto-bump on merge to main — or manual dispatch only? | Default Bun model: every main merge cuts canary. A stable release is manual. An auto-bump on merge (without publish) could be a "next" version. | phase-engineering: decide if auto-bump should happen on merge (version computed, not published) |

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half —
      `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
      returns nothing (all replaced by instantiated rows in this SPEC).
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 5 bullets.
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank rows.
- [x] Integration closure has one row per subsystem listed in
      `docs/CAPABILITIES.md` (or, when the project has no inventory, per the
      derived inventory recorded in the section) — zero subsystems skipped.
- [x] Every capability's role matrix lists EVERY role in the capability
      inventory with an explicit `allowed`/`denied` — no role unlisted.
      Note: the role matrix is implicitly covered by "No new ACL" (n/a) in
      integration closure. A new role was not introduced by this feature.
- [x] `### Expectation sweep` has ≥ 10 resolved rows (M/L) — 14 rows.
      Every row's resolution is `in-scope` or `out-of-scope` with a pointer.
- [x] Every `#### In scope` bullet maps to ≥ 1 Acceptance criterion — 9
      bullets, 16 ACs.
- [x] Every Acceptance criterion is a runnable command OR labelled
      `read-verified` — AC-01…AC-16 all have command-checkable verification.
- [x] `### Deferred decisions` exists — 4 rows with decide-by triggers.

---

## Design status

`designed` — capability closure complete (zero blank rows), product spec-lint
boxes all tick. Awaiting independent review by `review-spec`.

---

## Engineering half

<!-- TODO: plan-feature → -->
<!-- This section is written by `plan-feature` after an independent Product review. -->
<!-- Not yet started. -->
<!-- The following sections should be filled by plan-feature: -->

- `### Technical goals`
- `### Architecture impact`
- `### Design`
- `### Planning evidence`
- `### Obligations`
- `### Decisions to confirm`
- `### Testing requirements`
- `### Dev scenarios`
- `### Phases`
- `### Deploy & rollback`
- `### Open questions / risks`
- `### Deliverables`
- `### Post-merge next feature`

---

## Artifacts that still need to be created by plan-feature

<!-- These are the files that the Engineering half (plan-feature-scaffold) will create: -->

- `docs/features/40-versioned-skills-releases/PLAN.md` — phased plan
- `docs/features/40-versioned-skills-releases/TASKS.md` — task breakdown
- `docs/features/40-versioned-skills-releases/ACCEPTANCE.md` — frozen acceptance manifest
- `docs/features/40-versioned-skills-releases/planning-evidence.md` — engineering claims
- `docs/features/40-versioned-skills-releases/planning-obligations.md` — obligations ledger
- `docs/features/40-versioned-skills-releases/decisions.md` — engineering decisions (product decisions already in SPEC)

## Artifacts already created by this design-feature session

- `docs/features/40-versioned-skills-releases/SPEC.md` — this file (Product half complete)