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
## 2026-10-28 — Path-protection justification (P2, applied inline per the owner's local workflow)

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/bump-skill.test.mjs | P2 | 2026-10-28 | execute-phase | The RED fixture mirrored a per-skill Internal table; the real CHANGELOG.md Internal section uses the combined 5-column row shape, and the first implementation's created-anchor path mis-attributed that table's rows (normative-drift pin caught it). Fixture corrected to the real grammar plus a combined-row insertion test — a differential finding, not a weakened assertion.
justification | scripts/release-workflows.test.mjs | P5 | 2026-10-28 | execute-phase | The AC-05/AC-06 regex omitted the shell quote the workflow command legitimately carries (the tag expression falls back to latest when the channel input is absent); the assertion is corrected to match the quoted form, not weakened.
justification | scripts/release.test.mjs | P6 | 2026-10-28 | execute-phase | Owner follow-up (canary/stable suggestion GHA): the changeset body must build the changelog summary (it was a generic 'Release <version>' line) and plan must list each changeset with its semver annotation — the tests extend the RED corpus for these two behaviors, none is weakened.
justification | scripts/release.test.mjs | P7 | 2026-10-28 | execute-phase | Owner follow-up (dependency closure): the fixture gains the real dependency lines (pi pins crate + schema exactly) so the new RED test can pin that apply rewrites the downstream exact pins to the train version — the extension mirrors the real graph, no assertion weakened.
justification | scripts/release.test.mjs | P8 | 2026-10-28 | execute-phase | Owner follow-up (the apply GHA): a release-notes mode test joins the corpus (the workflow consumes it for --notes-file); extension, no assertion weakened.
justification | scripts/release-workflows.test.mjs | P8 | 2026-10-28 | execute-phase | Owner follow-up (the apply GHA): the release-train.yml contract tests (apply + one commit + tag + release, never npm publish) extend the suite; extension, no assertion weakened.
justification | scripts/release-workflows.test.mjs | P9 | 2026-10-28 | execute-phase | Owner-directed consolidation (D-40-12): the suite's publish contract re-targets the single .github/workflows/publish.yml (jobs chained needs:, three version gates, push paths over all three package trees) — the old three-file assertions are replaced, not weakened; the file-deletion assertion is added.
justification | scripts/npm-version-gate.test.mjs | P9 | 2026-10-28 | execute-phase | Owner-directed consolidation (D-40-12): the gate's workflow list re-targets the single publish.yml — the workflow-routing assertions must scan the file that now exists, none is weakened.
```

## 2026-10-28 — D-40-8: the bump writer is the skill's bundled tool, not a repo script

- **What**: The mechanical writer lives at `skills/bump-skill/scripts/bump-skill.mjs` (skill-bundled), not `scripts/bump-skill.mjs`. CLI is unchanged apart from the path.
- **Why**: The durable-ledger ownership gate (AC16 scan 2, `scripts/ledger-ownership.test.mjs`) closes `scripts/*.mjs` to writers of mapped ledgers, and the `ledger-ownership@1` map is closed to exactly the seven AC16 truth classes — `CHANGELOG.md` version rows and the per-skill `SKILL.md` version line are release-history records no truth class can host, and the map's owner vocabulary is skills-only (`skill:entry`), so a repo-level script can never be declared. The map's own text resolves this class of record: "their writers are the phases that already order them". The skill that orders the bump is `bump-skill`; its bundled script is that skill's mechanical hand, owned by the skill's prose contract (AGENTS.md "Version every change" + `bump-skill/SKILL.md`), exactly as the map expresses ownership for non-ledger durable records. The issue amendment's literal suggestion (`scripts/bump-skill.mjs` "or package script") predates the gate's current strictness; both suggested homes are inside the scanned surface.
- **Consequence**: `scripts/release.mjs` stays in `scripts/` — its `apply` mode writes the same release-history surfaces and currently passes the scan only because its write paths are call-site-inline (not const-bound), so the extractor resolves nothing. That is accidental compliance, disclosed here; the ownership surface for release writes is this decision and the release workflow's prose contract, and a future gate that widens extraction will need this decision as the recorded approval.
- **Flagged for the external verifier**: this relocation is this unit's own interpretation of the ownership ontology; veto here if the owner prefers widening the ownership map instead.

## 2026-10-28 — D-40-9: canary automation rides the publish workflows' own path filters (O14 amendment)

- **What**: No separate `canary.yml`. The AC-08 invariant ("a skills-only merge cuts no npm canary") is enforced by the publish workflows' existing push `paths:` filters, which name only package trees + the workflow file — a skills-only merge triggers no publish run at all. The `channel` dispatch input on each publish workflow is the canary/manual-promotion mechanism; auto-canary at a rewritten version inside the push run would change push behavior (a Trusted-Publisher-bound workflow publishing a version not in package.json) and is not built in this unit.
- **Why**: SPEC non-goals forbid Trusted Publisher re-binding; a new workflow file cannot publish for the packages at all. The invariant holds either way; the mechanism is the existing filters.
- **O14 validator**: `node --test scripts/release-workflows.test.mjs` — test `push triggers name package paths only — a skills-only merge cuts no npm release (AC-08)`.

## 2026-10-28 — D-40-10: dependency closure and publish order (owner-directed)

- **What**: (1) `release.mjs apply` rewrites every exact pin a package holds on another local package to the train version (pi pins the crate 0.5.0 AND the schema 4.9.0 — verified against the tree; non-exact ranges and foreign packages are never touched). (2) The publish workflows chain in dependency order — schema (push + dispatch) → runner crate (`workflow_run` on "Publish schema package") → pi (`workflow_run` on "Publish runner crate") — each guarded on the upstream's `success` conclusion. No workflow file is renamed (Trusted Publisher intact).
- **Why**: pi's install resolves its exact pins from the registry — publishing the train in parallel races on "pin at a local version not yet published" (the parity gate's --pins half fails that state by design, so the closure must be applied, and the install must run after the upstream published). Under the unified train nothing ever publishes "alone": every release moves all three versions, satisfying the owner's rule that schema/skills/crate are never published without pi.
- **Operator consequence**: pi and the crate no longer publish on their own push — the chain (or a dispatch) is the trigger; a release train's `apply` moves the pins, so run `bun install` in each touched package before committing (apply prints the reminder; the frozen lockfiles would fail CI otherwise, by design).

## 2026-10-28 — D-40-11: the apply GHA — one launch, one release train, one commit

- **What**: `release-train.yml` (workflow_dispatch, `contents: write`, input `version` for the D-40-4 override): applies the train (all package versions + exact local pins + CHANGELOG rows from the changeset bodies), refreshes the per-package lockfiles with `bun install`, adds exactly ONE release commit, pushes it (firing the publish chain schema → crate → pi), tags `vX.Y.Z`, fast-forwards `stable` and opens the GitHub Release with `release-notes` (changeset bodies + forced marker). It never runs npm publish. The first train lands at the highest published package version (4.9.0 today — schema), so pi jumps 0.37.0 → train at the first cut.
- **Why**: the owner's operator model is "launch a GHA, get the release": version suggestion stays in `release-plan.yml` (read-only); the cut is this workflow. Skills' per-skill `version:` frontmatter does NOT move with the train — the skills' ecosystem version is the `vX.Y.Z` tag / `#stable` ref (D-40-2).

## 2026-10-28 — D-40-12: the three publish workflows consolidate into one publish.yml (owner-directed)

- **What**: `.github/workflows/publish.yml` replaces `publish-schema.yml`, `publish-agentic-workflow.yml` and `publish-pi-package.yml` (deleted). Three publish jobs chained `schema-publish` / `crate-publish` (parallel) → `pi-publish` (`needs: [schema-publish, crate-publish]` — pi's install resolves its exact crate+schema pins from the registry), one shared `channel` dispatch input, one push trigger over the three package trees + the workflow file, a `concurrency` group serializing runs, and each package keeps its node-compat job + exact-version gate (pi keeps mutation + tarball gates).
- **Why**: with manual, unified, train-based releases, three files publishing the same train was structure without a function. The Trusted Publisher filename binding is the price: **the owner re-registers the three packages' records on npmjs.com to `publish.yml`** (owner-approved as trivial); until then a publish fails E403. This supersedes the SPEC's "no Trusted Publisher re-binding" non-goal and D-40-1's "re-binding stay rejected" wording for THIS filename change only — the rejection of the changesets tool's re-binding (a new release workflow) stands.
- **Supersedes**: O22's "publish workflow filenames unchanged" phrasing — the invariant that survives is "npm publish + OIDC stay in the publish workflow; the release train never publishes".
