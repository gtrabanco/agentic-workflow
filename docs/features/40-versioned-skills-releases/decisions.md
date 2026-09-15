# Decisions — 40-versioned-skills-releases

Product-half decisions recorded by `design-feature` (append-only; newest last).

## 2026-09-16 — D-40-1: Tool adoption — changesets file-format (not the tool)

- **What**: Adopt the changesets file format (`.changeset/*.md` with YAML frontmatter + body) but NOT the full changesets tool. A deterministic `scripts/release.mjs` script consumes the accumulated files.
- **Why**: The three npm packages (schema 4.x, pi 0.x, agentic-workflow 0.x) have zero cross-dependencies. Changesets' core value (workspace dependency propagation) buys nothing. Adopting the tool would require a root `package.json`/workspace manifest — a change to the bun-islands architecture — plus re-registering both npm Trusted Publisher records (new workflow filename). The file format captures the PR-time intent without the workspace root.
- **Authority**: user instruction (2026-09-16, design interview).
- **Supersedes**: The 2026-08-30 "Changesets: deliberately not adopted" note in CLAUDE.md. Reopening triggers fired: (1) third package exists (`@gtrabanco/agentic-workflow` 0.0.0), (2) per-package beta/snapshot channels now needed.
- **CLAUDE.md update**: The line "Changesets: deliberately not adopted ... Revisit when a third package lands or per-package beta/snapshot channels are needed." will be updated in the PR to reflect this design.

## 2026-09-16 — D-40-2: Unified version train

- **What**: One release version shared across all skills + pi-agentic-workflow + agentic-workflow-schema. Per-skill `version:` stays in SKILL.md frontmatter (bump-skill enforced) as the change ledger.
- **Why**: The installable unit is the repo at a ref, not a per-skill artifact. Pinning needs one repo-wide release tag (`vX.Y.Z`). The train version = highest bump implied by accumulated changeset files. npm packages keep their own independent versions (the train version drives them).
- **Authority**: user instruction (2026-09-16, design interview).
- **Edge case**: The first train version is computed at launch from accumulated changesets, not predicted by design. PR #225 may land before or after this feature, affecting the bump level.

## 2026-09-16 — D-40-3: Channel ladder auto-resets

- **What**: Stable release → next release auto-promotes to alpha (unstable). Canary = `<base>-canary.<date>.<n>` (Bun-style version shape). Manual promotions: alpha → beta → rc → stable.
- **Why**: Stable releases are the most important (they go to `latest` on npm and `stable` branch). Canary is the least important (untested, experimental). The ladder provides a clear progression for releases: start unstable (alpha), improve (beta → rc), ship (stable). After stable, the next release resets to alpha (a new train).
- **Authority**: user instruction (2026-09-16, design interview).
- **Canary shape**: `<latest-stable>-canary.<yyyymmdd>.<n>`. Monotonic, always unique (run/counter), never satisfies `^` ranges (semver prerelease rule). When the real stable version ships, it outranks every `canary.*`.

## 2026-09-16 — D-40-4: Force-version override

- **What**: The user can specify an exact version at launch time (`--version OVERRIDE`). This bypasses computation. The release body notes "forced by operator."
- **Why**: Marketing/PR campaigns need to pin an exact version (e.g. "the next stable release is 5.0.0"). The version is always computed, but the override is a documented escape hatch.
- **Authority**: user instruction (2026-09-16, design interview).
- **Edge case**: The version must not collide with an already-published version. The script checks before publishing.

## 2026-09-16 — D-40-5: English-only confirmed (english-only-interim)

- **What**: The bilingual rule (`.es.md` siblings in the same commit as `.md`) is retired until feature 57 (`per-release-bilingual`). CHANGELOG tables stay bilingual (they are the release-notes surface, not human workflow docs). GitHub Release notes are English-only.
- **Why**: The english-only-interim branch was merged (EE 0x9e) on 2026-09-16. The owner explicitly decided to stop paying the per-commit EN/ES translation duty. Feature 57 owns the restore.
- **Authority**: user instruction (2026-09-16, design interview).
- **Note**: CHANGELOG tables are bilingual because they are the committed release-notes surface. They are updated in the same commit as version bump (both EN+ES). GitHub Release notes are English-only because they come from PR bodies (changeset-format files).

## 2026-09-16 — D-40-6: Dependencies cleared

- **What**: The `Depends on:` field for row 40 in `docs/features/ROADMAP.md` is corrected from `30 31 32 37 38` to `—`.
- **Why**: 30 (repair-receipt-delta-review) merged PR #188, 37 (phase-lint-script) merged PR #212, 38 (workflow-status-sensor-script) merged PR #213. All have no surface overlap with release surfaces (CHANGELOG tables, publish workflows, model-routing.yml, `scripts/release.mjs`). 31 (planning-review-materiality) and 32 (review-consistency-pack) are `idea`, not started, and touch `pre-execution-review`/`review-spec`/`review-plan` LEDGERS/POLICY — zero overlap with release surfaces.
- **Authority**: user instruction (2026-09-16, design interview).
- **Soft**: 33 (turn-contract-single-owner) may touch the `bump-skill` surface. The PR should land after 33 if 33 happens to touch changelog or README tables. No blocking.
- **Supersedes**: The stale row in ROADMAP.md which cites `30 31 32 37 38` and "Depends on 37+38 (scripts created by producer rule are prerequisites for version bump automation)." The vehicle rule (who creates `packages/agentic-workflow` crate) was already satisfied — the crate exists on `main` since row 37 merged.

## 2026-09-16 — D-40-7: skills.sh channels via git refs only

- **What**: skills.sh channels via git refs: `#main` (canary-equivalent), `#stable` (stable branch, fast-forwarded on stable release), `#vX.Y.Z` (hard pin).
- **Why**: skills.sh has no version registry (it's install-derived only). Git refs are the only channel surface. npm packages use dist-tags (`latest`, `canary`, `beta`, `rc`, `alpha`).
- **Authority**: user instruction (2026-09-16, design interview).
- **Verification**: `npx skills add gtrabanco/agentic-workflow@#stable` resolves to the stable branch ref. `npx skills add gtrabanco/agentic-workflow@#v4.2.0` hard-pins to the tag.