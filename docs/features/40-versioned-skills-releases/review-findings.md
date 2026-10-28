# Review findings — 40-versioned-skills-releases

Review-change cycle 1 (single-reviewer) against the branch
`feature/180-versioned-skills-releases`. The passes froze head `22f3145` and the
verified findings transferred to the merge tip `28dd594a` (the merge delta
`22f3145..28dd594a` touches only `CHANGELOG.md` at rows outside every finding's
zone, `docs/LOGS.md`, `bun.lock` — zero delta on every cited file). Gate green at
the reviewed head. Axes run: code, security, verify, perf, brand; skipped:
design, a11y, seo (no UI/web surface). Owner scoping for the fold: code +
acceptance-criteria findings first (F1, F2, F12, F3), doc-surface rows after.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/changeset-create.mjs:89 | code | high | fix-now | fold | no |
| F2 | scripts/changeset-create.mjs:9-10,94-107 | code | med | fix-now | fold | no |
| F3 | docs/features/40-versioned-skills-releases/SPEC.md:474,516,519 + planning-obligations.md O1–O4,O21 | workflow | med | fix-now | replan-in-unit | no |
| F4 | CHANGELOG.md:119-120 | code,brand | med | fix-now | fold | no |
| F5 | CHANGELOG.md:815-817 | code | med | fix-now | fold | no |
| F6 | .changeset/versioned-skills-releases.md:5 (+ CHANGELOG.md 0.37.0 row body) | code,brand | med | fix-now | fold | no |
| F7 | docs/workflow/REPLICATE.md:44-46 | brand | med | fix-now | fold | no |
| F8 | docs/workflow/FEATURE_WORKFLOW.md:120-125 | code,brand | med | fix-now | fold | no |
| F9 | skills/skill-lint/references/DISCOVERY_AND_LINT.md:21-22 | brand | med | fix-now | fold | no |
| F12 | .github/workflows/publish.yml:98-100,155-157 | security | med | fix-now | fold | no |
| VF-1 | scripts/changeset-create.mjs:89 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck failing reproducer run against unchanged code: dirty entry `"?? scripts/bar.mjs"` parses to `"ripts/bar.mjs"` (`.slice(2)` after the status strip) | code | confirmed | finding-mark | n/a | n/a |
| VF-2 | scripts/changeset-create.mjs:94 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: `git log -1` over the branch while the header (:9-10) and FEATURE_WORKFLOW.md promise "any `!`/feat over the branch's commits"; test fixtures only place the decisive commit last | code | confirmed | finding-mark | n/a | n/a |
| VF-3 | docs/features/40-versioned-skills-releases/SPEC.md:516 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read + run: `node --test scripts/bump-skill.test.mjs` exits 2 (file deleted by D-40-14, commit c08555f1); `find` shows no `bump-skill.mjs`; no `## Amendments` in SPEC | workflow | confirmed | finding-mark | n/a | n/a |
| VF-4 | CHANGELOG.md:119 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read + diff: stray `|---|---|---|---|` mid-table after 0.28.0 and the 0.37.0 row below 0.31.0/0.29.0/0.28.0; release.mjs contract is "newest row first" | code,brand | confirmed | finding-mark | n/a | n/a |
| VF-5 | CHANGELOG.md:815-817 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: three `bump-skill` rows (2.4.3/2.4.2/2.4.0) appended under the "FROZEN ARCHIVE — D-40-14 … nothing is appended anymore" header created by this same diff; rows cite the deleted bundled writer | code | confirmed | finding-mark | n/a | n/a |
| VF-6 | .changeset/versioned-skills-releases.md:5 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: body says "bump-skill slimmed to classify + run its bundled writer"; writer deleted (sibling intent skill-train-version.md:5); claim ships to GitHub Release notes + CHANGELOG row | code,brand | confirmed | finding-mark | n/a | n/a |
| VF-7 | docs/workflow/REPLICATE.md:44-46 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: "Each skill carries its own `version:` … changes are logged in CHANGELOG.md" contradicts D-40-14 (train version stamped by release.mjs apply) in a file the diff touches | brand | confirmed | finding-mark | n/a | n/a |
| VF-8 | docs/workflow/FEATURE_WORKFLOW.md:120-125 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: the lint-changeset/parity-gate two-sentence block appears twice back-to-back | code,brand | confirmed | finding-mark | n/a | n/a |
| VF-9 | skills/skill-lint/references/DISCOVERY_AND_LINT.md:21-22 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: "This skill edits nothing — it reports. A SKILL.md, so report violations without fixing them:" — truncated/garbled sentence | brand | confirmed | finding-mark | n/a | n/a |
| VF-12 | .github/workflows/publish.yml:98-100,155-157 · reviewer review-change · HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c · recheck direct read: dispatch input `version` → `ARGS="--version $FORCE_VERSION"` expanded unquoted (`node scripts/release.mjs apply $ARGS`) — shell word-splitting/injection before release.mjs's own semver validation; reachable only with workflow_dispatch (write) rights | security | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 28dd594ac6fccfda871088d00d0e28dd6224374c | node --test scripts/*.test.mjs | exit 0 (1050 pass / 0 fail) | gate-mark | n/a | n/a |

## Refuted (never a row)

- LOGS.md commit/file counts "drift" from the final diff — each log entry cites
  its own commit range (`Commits: 11 (464089a9…6fd656a9)`), so the counts are
  per-head snapshots, not final-state claims.

## Report notes (low · report-only, never blocking)

- F10 scripts/release.mjs:30-33 duplicated header sentence (DEBT-8).
- F11 release.mjs usage() omits release-notes/publish-plan modes (DEBT-9).
- F13 publish.yml:473 unpinned `npm install -g npm@latest` (DEBT-1).
- F14 actions pinned by tag, not SHA (repo-wide convention) (DEBT-2).
- F15 gate notice echoed raw into `::warning::` (repo-controlled text today) (DEBT-3).
- F16 push-to-main auto-publish — accepted by design (OIDC binds repo/ref; gate + tests).
- F17–F20 perf lows with DEBT-4..7 triggers.
- F21 LOGS.md:3569,3583 verbatim owner-request Spanish quotes — frozen-request
  convention, not authored prose.
