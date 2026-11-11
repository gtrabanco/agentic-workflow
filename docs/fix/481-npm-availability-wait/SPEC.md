---
type: fix
scope: small
---

# fix/481-npm-availability-wait

> An npm publish only proves the registry accepted the upload, not that the CDN
> serves the tarball. The cut/publish jobs therefore announce a release (git tag,
> GitHub release, `canary` dist-tag write) while an install can still 404. This
> unit adds a deterministic availability+integrity wait and places it before every
> announcement.

## Issue

`#481` — tracked issue in the project's forge. The PR must close it via
`Closes #481` in the body (or the forge's equivalent auto-close convention).

## Specs

**S1 — the apply request.**
> Apply to this repository: issue #481

**S2 — the broken behaviour.**
> A canary cut announces its release while npm may still be processing the tarballs. On the 2026-11-09 cut (run 42638128017), all three packages published successfully, but `@gtrabanco/agentic-workflow-schema@5.0.0-canary.20261109.1` returned **404 on its tarball URL for ~10 minutes** after the publish step — while the packument, the `canary` dist-tag and the git tag were already visible. A `pi update --all` run during that window failed twice (404, then bun's negative packument cache masking the version). The publish itself was correct: the shasum in the run log (`517e4be5…`) matches the registry once the tarball propagated.

**S3 — the required ordering invariant.**
> No signal a cut/publish produces (git tag, GitHub release, dist-tag write) should be emitted before every published tarball is actually downloadable **and** matches the shasum recorded in its packument.

**S4 — the availability gate script.**
> 1. New script `scripts/npm-availability-wait.mjs` (+ sibling suite, red-first):
>    - Input: a `name@version` list (the `publish-plan.tsv` rows for cuts; explicit pairs for the publish jobs).
>    - Per package: read the packument, resolve `dist.tarball` + `dist.shasum`, poll the tarball URL (default every 20 s) until it returns 200 **and** the downloaded bytes hash to the recorded shasum — availability plus integrity, not just a HEAD.
>    - `--timeout` (default 10 min) and `--interval` flags; timeout exits non-zero so the run fails visibly instead of announcing an uninstallable release. Fail closed on a packument that never lists the version.
>    - Same style as `scripts/npm-version-gate.mjs`: pure Node ESM, network injected in tests, no live network in the suite.

**S5 — the workflow wiring.**
> 2. Wire it in `.github/workflows/publish.yml` on **every job that publishes npm**:
>    - `cut-prerelease`: between "Publish the channel" and "Record the cut as a tag and a GitHub pre-release" — *release visible = installable*.
>    - `schema-publish`, `crate-publish`, `pi-publish`: after `npm publish`, before "Point the canary dist-tag at the stable release" — the dist-tag never moves to a version the CDN cannot serve.
> Cost: a few minutes of runner time per cut (polling usually clears in 1–5 min, well under the timeout). What cannot be fixed from the repo is a client's negative packument cache (`bun pm cache rm` clears it locally); it stops mattering once the workflow stops inviting installs during the window.

**S6 — the issue's acceptance criteria.**
> - A cut whose tarball is not yet served does not create the git tag or the GitHub pre-release until the wait passes (verified with an injected-slow-fetch test of the gate; workflow edit reviewed against `docs/workflow/GATE_INVENTORY.md`).
> - A publish-mode run never moves the `canary` dist-tag before the tarball is verifiably available.
> - Timeout produces a failed run with a clear message naming the package whose tarball never became available.
> - `scripts/npm-availability-wait.test.mjs` lands red-first and passes without network access.

**S7 — the rollback strategy.**
> Remove the wait step from the four jobs (the script and suite are inert without callers).

## Acceptance criteria

One observable, testable criterion per `S#`; the check that proves it is named.

- **AC1 (S1)** — the unit is cut from the template with both planning ledgers and the declared `## Fixes` row; `bun scripts/unit-route.mjs --triage 481-npm-availability-wait` exits 0.
- **AC2 (S2)** — the 2026-11-09 failure is reproduced red before implementation: a tarball that 404s while its packument lists the version never reads as available. Validator: `bun test scripts/npm-availability-wait.test.mjs` exits non-zero on the red commit.
- **AC3 (S3)** — the wait emits no availability signal before the tarball returns 200 and its bytes hash to the recorded shasum. Validator: the injected-slow-fetch ordering test in `scripts/npm-availability-wait.test.mjs` exits 0 and records no `available` event before the successful tarball read.
- **AC4 (S4)** — the script exposes the declared contract: `name@version` inputs (including `--plan publish-plan.tsv`), packument `dist.tarball`+`dist.shasum`, 20 s default interval, 10 min default timeout, non-zero timeout naming the package, fail-closed on a version the packument never lists, pure Node ESM with injected network. Validator: `bun test scripts/npm-availability-wait.test.mjs` exits 0 with every case listed in `## Applicable tests`.
- **AC5 (S5)** — all npm-publishing jobs wait before their signal: `cut-prerelease` waits between the publish loop and the tag/pre-release step; `schema-publish`, `crate-publish`, `pi-publish` and the post-issue `nan-publish` wait after `npm publish` and before `npm dist-tag add … canary`. Validator: `bun test scripts/release-workflows.test.mjs` exits 0 with the new placement assertions.
- **AC6 (S6)** — every issue acceptance bullet maps to a passing validator: slow-fetch ordering (AC3), dist-tag gating (AC5), timeout naming the package (AC4), red-first no-network suite (AC2 + `bun scripts/red-first.mjs` exits 0). `docs/workflow/GATE_INVENTORY.md` carries the row that cites the suite.
- **AC7 (S7)** — the rollback is real: the script writes no tag, release or dist-tag itself, and the workflow call sites are the only coupling. Validator: `rg -c "node:child_process|execSync|spawnSync" scripts/npm-availability-wait.mjs` exits 1 (0 matches) and `rg -c "npm-availability-wait" .github/workflows/publish.yml` matches 5.

## Impact

Callers: the five npm-publishing jobs in `.github/workflows/publish.yml` —
`cut-prerelease` (one wait for the whole `publish-plan.tsv`) and the four
`*-publish` jobs (one explicit `name@version` each). The wait adds runner time
after `npm publish` and before the tag/pre-release/dist-tag writes; it changes
no version, no package content and no publish decision. Consumers of the
workflow shape: `scripts/release-workflows.test.mjs` pins job blocks, step
order, the version-gate call sites and the dist-tag promotions, so its new
assertions are part of this change. Prose that stops being true:
`docs/workflow/GATE_INVENTORY.md` gains the availability gate's row (the issue's
S6 requires the workflow edit be reviewed against it). The `nan-publish` job
postdates the issue (#502) but publishes npm, so "every job that publishes npm"
(S5) includes it; that is the declared reading, not an extra feature.

## Retirements

Nothing is retired: the unit only adds a gate and its call sites. The
`npm-version-gate.mjs` decision stays the publish/skip authority — the wait
never second-guesses it, it waits for whatever the gate published. No negative
capability is removed, so no negative-capability pin is owed.

## Non-goals

- Client-side caches: a negative packument cache (`bun pm cache rm`) is out of
  the repository's reach and is exactly what S5 says stops mattering.
- Retrying or re-publishing a failed package, and any change to the version
  train, the changesets, or the publish gates.
- Replacing `npm-version-gate.mjs` or reading dist-tags to decide anything.
- The #307 direction: the issue records it as an owner preference with no
  technical dependency; this unit does not wait for it.

## Risk tier

- **`standard`** · **Task Size** — understood, contained risk, resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- none.

## Future cost

- The 10-minute availability budget is a standing CI cost per cut and per
  publish job: a future change that adds a publishing job must add its wait
  call (and the `release-workflows` placement pin) or the invariant regresses.
  Binds: every unit that adds an npm-publishing job.

## Applicable tests

`scripts/npm-availability-wait.test.mjs` (new, red-first): immediate success;
slow tarball after N polls with no early availability signal; packument version
appears late; integrity mismatch retried then failed; timeout names the package;
packument that never lists the version fails closed; `--plan` parsing of a
`publish-plan.tsv`; usage errors; scoped-name URL encoding. All network is
injected; no live registry call.

`scripts/release-workflows.test.mjs` (extended, red-first): one wait step per
npm-publishing job, placed after the publish and before the tag/release/dist-tag
step; `cut-prerelease` reads `publish-plan.tsv`; each `*-publish` job names its
own `name@version`.

## Known pre-existing issues

- `docs/workflow/GATE_INVENTORY.md`'s Fixes-adjacent rows and the
  `release-workflows` suite already disagree on nothing today; the new row is
  additive and does not require a carrier migration. Does-not-affect.
- The worktree has no `node_modules` until `bun install`; the suite needs no
  package dependency (Node builtins only) and the local gate installs the
  workspace first. Does-not-affect.
- The default worker count (one per CPU) makes a few git-heavy suites
  (`roadmap-settle`, `red-first`, `run-root-suite`, `scope-manifest`, the
  ceremony suites) exceed their per-test budget under full parallel load; each
  is green when run alone and the gate is green at `--jobs 2`/`--jobs 4`.
  Does-not-affect this unit's behaviour; recorded so the receipt is honest.
- The `worktree-guard` step failed on a stale registration
  (`.worktrees/fix-437-review-loop-mechanics`, directory already absent).
  Removed with `git worktree remove --force` (no work existed on disk); the
  gate then passed. Does-not-affect this unit.

## Tasks

- P1 — Cut the unit doc, the embedded planning ledgers, the acceptance criteria and the `## Fixes` row (validator: `bun scripts/unit-route.mjs --triage 481-npm-availability-wait` exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/481-npm-availability-wait/SPEC.md, docs/ROADMAP.md
- P2 — RED: the frozen-failure corpus — new suite cases (slow tarball ordering, timeout naming, integrity mismatch, missing version, plan parsing) and the publish.yml placement assertions (validator: `bun test scripts/npm-availability-wait.test.mjs` exits non-zero and `bun test scripts/release-workflows.test.mjs` exits non-zero, before P3/P4)
  (Implements: S2, S3, S4, S5, S6)
  - Relevant files: scripts/npm-availability-wait.test.mjs, scripts/release-workflows.test.mjs
- P3 — GREEN: `scripts/npm-availability-wait.mjs` with injected network, availability+integrity polling, `--plan`/`--timeout`/`--interval`, fail-closed timeout (validator: `bun test scripts/npm-availability-wait.test.mjs` exits 0)
  (Implements: S2, S3, S4, S6)
  - Relevant files: scripts/npm-availability-wait.mjs
- P4 — Wire the wait in all five npm-publishing jobs at the S5 positions (validator: `bun test scripts/release-workflows.test.mjs` exits 0)
  (Implements: S3, S5, S6)
  - Relevant files: .github/workflows/publish.yml
- P5 — Declare the gate in `docs/workflow/GATE_INVENTORY.md`, register the test route, add the changeset, settle the roadmap row and regenerate the projection (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0)
  (Implements: S1, S6, S7)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, scripts/test-route-map.json, .changeset/481-npm-availability-wait.md, docs/ROADMAP.md, docs/generated/units.md
- P6 — Differential vs base, full local gate, session log entry (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7)

### Planning evidence

Frozen at cut (XS/S embeds the ledgers; no sibling files).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | the packument lists each version under `versions[<v>].dist` with `tarball` (absolute URL) and `shasum` (SHA-1 hex) | live registry sample `curl https://registry.npmjs.org/@gtrabanco%2Fagentic-workflow-schema` (2026-11-11) plus `npm view … dist.tarball dist.shasum` → same pair | sampled 2026-11-11 | O2, O3, O5 |
| PE-002 | issue | a packument can list a version, its dist-tag and its shasum while the tarball URL still returns 404 for minutes | issue #481 S2 (run 42638128017) | 2026-11-09 incident record | O1, O2, O6 |
| PE-003 | repository | `scripts/release.mjs publish-plan` writes `name<TAB>dir<TAB>version<TAB>tag` rows to `publish-plan.tsv` and the cut job reads them in that order | `.github/workflows/publish.yml` publish loop + `scripts/release.mjs` publish-plan | tree at cut | O4, O7 |
| PE-004 | repository | the npm-publishing jobs are `cut-prerelease`, `schema-publish`, `crate-publish`, `pi-publish`, `nan-publish`; each names its own package version | `.github/workflows/publish.yml` job blocks | tree at cut | O7, O8 |
| PE-005 | repository | the runtime exposes global `fetch` returning a `Response` with `arrayBuffer()`, and `node:crypto` `createHash("sha1")` yields the packument shasum encoding | `node -e "typeof fetch"` → `function`, `node -e "require('node:crypto').createHash('sha1').update('x').digest('hex')"`; Node 26.13.0 (`.node-version`) | sampled 2026-11-11 | O2, O5 |
| PE-006 | repository | the root suite must not touch the live network; injecting `fetchImpl`, `sleepImpl` and `now` into the core lets every case run deterministically | design of `scripts/npm-version-gate.mjs` (registry read injected via `--published`) and this suite's dependency list | tree at cut | O5, O9 |
| PE-007 | repository | `scripts/release-workflows.test.mjs` owns the publish.yml shape (job blocks, step order, gate call sites, dist-tag count) | suite source and its `jobBlock` helper | tree at cut | O8, O10 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S3 | no availability/announcement signal is emitted before a tarball is downloadable and matches its shasum | P2 | P2 | execute-phase (inline) | `bun test scripts/npm-availability-wait.test.mjs` exits 0 with the ordering case | E line for the red run and the green run | verified |
| O2 | S4, PE-001, PE-002 | per package: read the packument, resolve `dist.tarball`+`dist.shasum`, poll until 200 and SHA-1 match; default interval 20 s | P3 | P3 | execute-phase (inline) | `bun test scripts/npm-availability-wait.test.mjs` exits 0 with immediate, slow and integrity cases | E line naming the green suite | verified |
| O3 | S4, PE-001 | integrity is checked on the downloaded bytes, never a HEAD or a status-only probe | P3 | P3 | execute-phase (inline) | `bun test scripts/npm-availability-wait.test.mjs` exits 0 with the mismatch case never reporting available | E line for the mismatch case | verified |
| O4 | S4, PE-003 | `--plan <publish-plan.tsv>` reads name+version from the declared columns; explicit `name@version` args work for the publish jobs | P3 | P3 | execute-phase (inline) | `bun test scripts/npm-availability-wait.test.mjs` exits 0 with the plan and pair cases | E line for the plan/pair cases | verified |
| O5 | S4, PE-005, PE-006 | pure Node ESM, network injected; no live network in the suite; scoped names URL-encoded | P3 | P3 | execute-phase (inline) | `rg -n "https://registry" scripts/npm-availability-wait.test.mjs` exits 1 (0 literal registry URLs in the suite) and the suite exits 0 | E line for the rg probe + suite | verified |
| O6 | S4 | `--timeout` defaults to 600 s and a timeout exits non-zero naming the package whose tarball never became available | P3 | P3 | execute-phase (inline) | `bun test scripts/npm-availability-wait.test.mjs` exits 0 with the timeout case asserting the package name in the message | E line for the timeout case | verified |
| O7 | S4, PE-002 | fail closed when the packument never lists the version within the budget; never report it available | P3 | P3 | execute-phase (inline) | `bun test scripts/npm-availability-wait.test.mjs` exits 0 with the missing-version case | E line for the missing-version case | verified |
| O8 | S5, PE-004 | `cut-prerelease` waits after "Publish the channel" and before "Record the cut as a tag and a GitHub pre-release" | P4 | P4 | execute-phase (inline) | `bun test scripts/release-workflows.test.mjs` exits 0 with the cut placement assertion | E line for the workflow suite | verified |
| O9 | S5, PE-004 | every `*-publish` job (schema, crate, pi, nan) waits after `npm publish` and before `npm dist-tag add … canary` | P4 | P4 | execute-phase (inline) | `bun test scripts/release-workflows.test.mjs` exits 0 with one wait per job and the dist-tag ordering assertion | E line for the workflow suite | verified |
| O10 | S6 | the slow-fetch reproducer proves the tag/release signal cannot precede availability, and the workflow keeps that order | P2, P4 | P4 | execute-phase (inline) | `bun test scripts/release-workflows.test.mjs` exits 0 and `bun test scripts/npm-availability-wait.test.mjs` exits 0 | E lines for both suites | verified |
| O11 | S6, PE-007 | the new suite lands red before implementation and the existing publish.yml contract still passes | P2 | P2 | execute-phase (inline) | `bun scripts/red-first.mjs` exits 0 and `bun test scripts/release-workflows.test.mjs` exits 0 | E line for the red commit, the red-first report and the green suite | verified |
| O12 | S6 | the gate is declared where the workflow edit is reviewed: a `GATE_INVENTORY.md` row resolves its file+token, and the projection is current | P5 | P5 | execute-phase (inline) | `bun scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 | E lines for both commands | verified |
| O13 | S7 | the script writes no tag, release or dist-tag; removing the workflow steps leaves it inert | P5 | P5 | execute-phase (inline) | `rg -c -e "node:child_process" -e "execSync" -e "spawnSync" scripts/npm-availability-wait.mjs` exits 1 (0 matches) and `rg -c "npm-availability-wait" .github/workflows/publish.yml` matches 5 | E line for both rg probes | verified |

## Triaged steps

Applied inline at the owner's request; the owner's workflow (§4/§5) substitutes
for the lane's triage, so this unit carries no Relay packet and no self-granted
gate exception. The `## Tasks` list above is the frozen step list for this unit.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-11, the request, verbatim:
  ```
  Apply to this repository: issue #481
  ```
  (the request's full content is issue #481 verbatim, recorded in the forge;
  its broken behaviour, required ordering, script contract, workflow placement,
  acceptance criteria and rollback are quoted unedited in S2–S7 above)
- **L2** — 2026-11-11, environment action disclosed: `bun scripts/local-gate.mjs`
  first failed at `worktree-guard` on a stale registration
  `.worktrees/fix-437-review-loop-mechanics` whose directory was already gone
  (prune reported nothing; `git worktree remove --force` on the missing path
  succeeded). No work existed on disk and no other checkout was touched; the
  gate then ran.
- **D1** — 2026-11-11, `nan-publish` postdates the issue (#502) but publishes
  npm, so S5's "every job that publishes npm" includes it. The declared reading
  is recorded here instead of silently shipping four call sites.
- **D2** — 2026-11-11, the wait uses a shared deadline (one `--timeout` for the
  whole invocation), not one budget per package: a canary cut publishes all
  declared packages near-simultaneously, and a per-package budget could multiply
  the runner cost by the member count. A timed-out package is named in the error.
- **E1** — 2026-11-11, `bun test scripts/npm-availability-wait.test.mjs` at the
  red commit `92c55aa6` · exit 1 · `Cannot find module
  './npm-availability-wait.mjs'` — 0 pass / 1 fail / 1 error (module-absent red).
- **E2** — 2026-11-11, `bun test scripts/release-workflows.test.mjs` at
  `92c55aa6` · exit 1 · 25 pass / 1 fail — the only failure is the new
  "every npm-publishing job waits…" case; every pre-existing assertion passed.
- **E3** — 2026-11-11, `bun test scripts/npm-availability-wait.test.mjs` at the
  green head · exit 0 · 17 pass / 0 fail; `node --test
  scripts/npm-availability-wait.test.mjs` · fail 0. The reproducer case asserts
  the availability signal follows the tarball 200 + shasum match, with three
  404 polls before it.
- **E4** — 2026-11-11, `bun test scripts/release-workflows.test.mjs` · exit 0 ·
  26 pass / 0 fail (the pre-existing 25 plus the placement case).
- **E5** — 2026-11-11, `bun scripts/red-first.mjs` · exit 0 · `0 finding(s)`,
  `verdict: PASS` (the suite commit `92c55aa6` precedes the implementation
  `fec35709`).
- **E6** — 2026-11-11, `bun scripts/prose-gate-inventory.mjs` · exit 0 ·
  `verdict: PASS` with the `npm-availability-gate` row resolved.
- **E7** — 2026-11-11, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  `verdict: PASS`; the emitter wrote `docs/generated/{units,code}.md`.
- **E8** — 2026-11-11, probes: `rg -c "https://registry"
  scripts/npm-availability-wait.test.mjs` · exit 1 (0 matches — no live registry
  URL); `rg -c "node:child_process|execSync|spawnSync"
  scripts/npm-availability-wait.mjs` · exit 1 (0 matches — the gate cannot run a
  signal command); `rg -c "npm-availability-wait"
  .github/workflows/publish.yml` · 5 matches; YAML parse → 7 jobs, 5
  `Wait for npm tarball availability` steps.
- **E9** — 2026-11-11, `bun scripts/roadmap-settle.mjs` · exit 0 · 186 unit docs
  checked, `verdict: PASS` (the folder slug matches the roadmap row
  `npm-availability-wait`).
- **E10** — 2026-11-11, differential: no pre-existing executable command changed
  (the new script has no base counterpart); the one shared contract is
  `scripts/release-workflows.test.mjs`, whose 25 pre-existing assertions pass
  identically at base and at head (E2/E4), and the workflow diff is the five
  inserted wait steps only — an evidenced `n/a` for a behavioural differential.
- **E11** — 2026-11-11, `bun scripts/check-skill-context.mjs --documents` · exit
  0 · `PASS context documents: 4 budgeted documents`; the inventory's
  `machineLines` moves 64 → 65 with its source row.
- **P1** — 2026-11-11, unit doc + embedded ledgers + acceptance criteria + the
  `## Fixes` row · `e0b2aa87` (`unit-route --triage` exits 0).
- **P2** — 2026-11-11, red corpus committed observed red · `92c55aa6`
  (E1, E2).
- **P3** — 2026-11-11, `scripts/npm-availability-wait.mjs` green · `fec35709`
  (E3).
- **P4** — 2026-11-11, the five publish.yml wait steps · `aba57994` (E4).
- **P5** — 2026-11-11, gate inventory row, test route, changeset, roadmap row,
  regenerated projection · `5926bc5c` (E6, E7).
- **E12** — 2026-11-11, two full-gate attempts failed at `root-suite` under
  concurrent load (default workers, then `--jobs 2`), each time on a different
  set of git-heavy suites; every named suite is green alone and the serial gate
  below is green. Recorded as the load-sensitivity in Known pre-existing issues,
  never as a pass by assumption.
- **G1** — 2026-11-11, `bun scripts/local-gate.mjs --jobs 1` · HEAD `3ef8e2e7` ·
  exit 0 · `local-gate: PASS — 17 step(s) in 657s`.
- **G2** — 2026-11-11, HEAD `3ef8e2e7` · `bun scripts/run-root-suite.mjs`
  (default workers) · exit 0 · the full root suite PASS.
- **P6** — 2026-11-11, obligations closed, gate declared, guide budget re-pinned
  and the evidence recorded · `3ef8e2e7` (G1, G2).

## Next

P2 — land the red corpus and observe it fail on the missing module and the
missing workflow steps.

## References

- Issue [#481](https://github.com/gtrabanco/agentic-workflow/issues/481) — the source issue
- Issue [#502](https://github.com/gtrabanco/agentic-workflow/pull/510) — added the `nan-publish` job this unit also gates
- `docs/workflow/GATE_INVENTORY.md` — the gate's declared carrier
- `scripts/npm-version-gate.mjs` — the style and the pure-CLI precedent

## Branch

`fix/481-npm-availability-wait`

## Depends on

Independent. Issue #307 is an owner preference with no technical dependency and
does not block this unit.

## Regression scope

- The publish/skip decision is unchanged: `scripts/npm-version-gate.mjs` and its
  suite stay byte-identical — `bun test scripts/npm-version-gate.test.mjs` exits 0.
- The existing publish.yml contract still holds: job list, version-gate call
  sites, dist-tag promotion gating, canary tag/pre-release shape —
  `bun test scripts/release-workflows.test.mjs` exits 0.
- No workflow step loses its `if:` guard or its ordering relative to the others;
  the wait is inserted, never a replacement — the same suite's existing
  assertions plus the new placement assertions.
