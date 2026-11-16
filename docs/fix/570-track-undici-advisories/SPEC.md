---
type: fix
scope: small
ac-hash: 7602df3c6539de41d3e2e9e92df5e6ac47ce75956c123bb871f369790a7e083f
roadmap_summary: Issue [#570](https://github.com/gtrabanco/agentic-workflow/issues/570): the dev toolchain's undici sat at 8.10.2 across two product audits, carrying four blocking-ladder advisories that the repo's own pass classified report-only — the root workspace now overrides the peer toolchain's transitive pin to 8.12.4, and a contract case in the advisory suite fails the root suite whenever the resolved version falls back below the 8.12.2 fix floor, so the tracked drift cannot return silently.
---

# fix/570-track-undici-advisories

> Fix specification — one single unit document. Applied through the owner's local
> unpublished workflow (§5 ledger freeze substitutes for the lane's plan step); no
> repo review/fold machinery runs on this change. XS/S sizing: the two planning
> ledgers are embedded below, never a sibling file.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#570` — "Track undici dev-toolchain advisories (8.10.2 → 8.12.2, 4
blocking-ladder, dev-only)". The PR closes it via `Closes #570`.

## Specs

Requirements numbered `S#`, quoting the requester's words verbatim. `S1` is the
owner's apply instruction; `S2`–`S5` are the issue's own sentences, in the order
they appear.

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #570

**S2 — The tracked failure: the resolved tree, not the manifest.**
> undici 8.10.2 (transitive via `@earendil-works/pi-coding-agent`, a peerDependency of `packages/pi-agentic-workflow`) carries 4 blocking-ladder advisories — GHSA-2m5v-pch6-74hx, GHSA-4w7w-5xrc-9h26, GHSA-qrxm-fqhp-jwvm, GHSA-xjj6-f33q-929c, all fixed in 8.12.2 — plus 5 report-only rows.

**S3 — It is dev-only, and that classification does not change.**
> The repo's own dependency gate classifies these report-only: dev toolchain only, no direct import, never shipped in the four packages.

**S4 — The ask is durability, not one bump.**
> Unchanged from audit 1 (F2, 2026-11-08) — tracked here so it cannot drift silently.

**S5 — The remedy is the root workspace's, not the packages'.**
> A dev-toolchain `overrides` entry forcing `undici@^8.12.2` in the root workspace, or the peer toolchain update upstream.

## Impact

- `package.json` (repository root, the private workspace manifest) — gains the
  one `overrides` entry. No `dependencies`/`devDependencies`/`workspaces` line
  moves, and nothing here is published: the root manifest declares no package.
- `bun.lock` (the workspace's one lockfile) — the `undici` resolution and the
  root entry's override block. Every other resolved version must stay
  byte-identical (O4); a broad `bun update` moves 47 package lines and was
  rejected for exactly that reason (`## Log` D2).
- `scripts/dependency-advisory-pass.test.mjs` — one appended case. The suite
  already carries two tree-reading cases at its tail (the review pack's carrier
  and the gate step), so a repository-state assertion belongs to this contract
  rather than to a new script the audits would then have to find a consumer for.
- `scripts/dependency-advisory-pass.mjs` — **read only**. Neither the
  classification rule nor the report-only exit code moves: S3 keeps the pass
  report-only, and turning an advisory into a gate failure is unit 365's `S6`,
  not this issue.
- `packages/**` — **untouched**. No manifest, no `src/` line, no test. S5 pins
  the mechanism to the root workspace; a package-level pin would ship the claim
  that a published package depends on undici, which S3 says none does.
- `docs/ROADMAP.md` — the `## Fixes` row (hand-owned by declaration; the emitter
  only rewrites its summary cell from this document's `roadmap_summary:`), the
  regenerated projection, and this document.
- The four blocking-ladder advisories are *cleared from the receipt*, which is
  what every later audit reads: `node scripts/dependency-advisory-pass.mjs`
  drops from `9 advisories, 4 blocking` to `1 advisory, 0 blocking`.

## Retirements

Strictly additive: nothing is removed, renamed or replaced. The change adds one
`overrides` key, one lock resolution and one case; the retired thing is a *state*
(the 8.10.2 resolution), not a surface, so there is no name to reclaim and no
negative-capability pin to write beyond the case that holds the floor.

`bun scripts/residual-classify.mjs --inventory --base <rev>` is the anti-divergence
receipt for an additive unit; its diff-derived row set is empty here because the
only added surfaces are a JSON key and a test case, neither of which the
classifier inventories (it reads manifests, exports and files under `skills/`).

## Non-goals

- **No `bun update`.** A whole-workspace refresh moves 47 package lines
  (`## Log` D2 measured it); the issue asks for one dependency to leave an
  advisory, not for a toolchain refresh with its own re-verification.
- **No peer-floor bump.** `@earendil-works/pi-coding-agent` stays a
  `>=1.1.0` peer in both packages. Bumping the resolved peer 1.4.0 → 1.5.2 would
  also clear the advisories, and it is the issue's second named remedy; it is
  rejected because that is a toolchain move whose re-verification is its own
  unit (the `fix/370` precedent) and this issue names neither a version nor a
  compatibility re-check.
- **No new script.** A dedicated floor script under `scripts/` would need a
  consumer the audits can find (AGENTS.md → verification rules reject an orphan
  script); the pass's sibling suite already owns the dependency-advisory
  contract.
- **No minimatch repair.** The one remaining row (`minimatch 10.2.6`, moderate,
  fixed in the major `11.0.1`, pulled by `pi-extensible-workflows`) is outside
  this issue's scope and outside its range; recorded under
  `## Known pre-existing issues`.
- **No gate made fatal.** The pass stays report-only (S3); this unit removes the
  advisories, it does not change what a future advisory does to a review.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood / contained / resumable
- **Named high-risk item** — none — not a high-tier unit

Verdict `risk-tier-verdict@1` for the change's executable path,
`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths package.json bun.lock scripts/dependency-advisory-pass.test.mjs`:
`1 path(s) carry executable content`, `signals: []`.

## Future

- **2026-11-16 — a watched transitive floor** (`open`). `pin-watch` watches the
  workspace manifests' pins and cannot see a transitive resolution or a root
  override, so the 8.12.2 floor is held by a suite case rather than by the
  weekly watch. Teaching the watch to read `overrides` would close that gap; it
  needs its own unit (the watch's exit semantics are documented in its header
  and a new drift class changes them).

## Future cost

- The root workspace's `overrides` block is now a live mechanism: whoever
  overrides a transitive pin must also justify why the peer toolchain cannot
  carry the fix, because the next reader will ask. It binds whoever edits
  `package.json` at the root.
- The undici floor is a literal in a suite case. A future advisory fixed above
  8.12.2 is caught by the advisory pass (a blocking row on the receipt), never
  by that case — the two mechanisms answer different questions and neither is
  redundant.

## Applicable tests

- `scripts/dependency-advisory-pass.test.mjs` — the appended floor case, plus
  the suite's own cases as the differential's other half (they must stay green:
  no pass behaviour changes).
- `scripts/dependency-advisory-pass.mjs` run in the foreground on the base copy
  and on this change — the frozen-failure reproducer.
- `bun install --frozen-lockfile` — the lock/manifest agreement (`workspace-install`
  in the gate).
- The root suite as a whole (`bun scripts/run-root-suite.mjs`): the override
  changes the installed `undici` for a `src/` that imports the peer toolchain at
  runtime, so every package suite is a regression surface.

## Known pre-existing issues

- `minimatch 10.2.6` (`GHSA-g3hv-75wg-m249`, moderate, fixed in `11.0.1`) is
  pulled by `pi-extensible-workflows@6.3.0`'s `^10.2.5`. **Does not affect**
  this unit: the fix is a major outside that range, it is report-only on the
  same receipt, and the issue tracks undici alone. It stays on the receipt after
  this change (1 advisory) and is the next `fix(deps)` candidate.
- `packages/agentic-workflow-schema/dist/` is absent in a fresh worktree.
  **Does not affect** this unit: the gate's `schema-build` step runs before every
  test step that reads it.
- The `pre-push` hook's SIGPIPE exit 141 recorded in fix 571's unit doc.
  **Does not affect** this unit: the gate is run in the foreground here, and any
  push detail is recorded in `## Log` without a claim about the hook.
- **`worktree-guard` reddens on *other* sessions' worktrees.** The step audits the
  whole repository's worktree set, so a sibling unit mid-edit (`feat-565-quality-sensor`
  and `feat-563-init-workspace-interview` were both live during this session)
  fails it with `STALE: branch … is merged into origin/main`, whatever this
  branch contains. **Does not affect** this unit: `scripts/worktree-guard.mjs` is
  byte-identical to the base (`git diff d1287c3d -- scripts/worktree-guard.mjs`
  prints nothing), the finding names paths outside this branch, and the same 19
  steps are green — `worktree-guard` included — on the quiet tree G1 records.

## Acceptance criteria

The section's `ac-hash` is the SHA-256 of this section's bytes, from the
`## Acceptance criteria` heading through the line before `## Tasks`, with a
single trailing newline:
`awk '/^## Acceptance criteria$/{f=1} f&&/^## Tasks$/{f=0} f' <this file> | sha256sum`.

- **AC-S1** — The unit is frozen before the implementation lands: the ledgers,
  the criteria and the tasks are in this document at the red-test commit, the
  work arrives as conventional commits, and the red case precedes the override.
  Check: `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/570-track-undici-advisories/SPEC.md` prints `verdict PASS` and exits
  0; the `## Log` names the red commit and the implementation commit with their
  observed results.
- **AC-S2** — The resolved tree stops carrying the four blocking-ladder rows:
  `node scripts/dependency-advisory-pass.mjs` reports `0 blocking` and no
  `undici` row, where the base commit reports `4 blocking` and nine `undici`
  rows. Check: the two foreground runs recorded in `## Log`, and
  `bun test scripts/dependency-advisory-pass.test.mjs` exits 0.
- **AC-S3** — Nothing shipped changes: no package under `packages/` gains an
  `undici` entry in any dependency field, and no `src/` file moves. Check:
  `git diff --stat <base> -- packages/` prints nothing, and
  `rg -c '"undici"' packages/*/package.json` matches nothing.
- **AC-S4** — The drift cannot return silently: a resolution below the 8.12.2
  floor fails the root suite at the commit that introduces it. Check:
  `bun test scripts/dependency-advisory-pass.test.mjs` exits 1 at the red commit
  and 0 at the implementation commit, and the case's failure message names the
  four advisories and the floor.
- **AC-S5** — Exactly one mechanism, in one place: the root workspace declares
  the `overrides` block and the lock is the only other byte change outside
  `docs/` and the test. Check: `git diff <base> -- package.json` shows only the
  `overrides` addition, and `bun install --frozen-lockfile` exits 0.

## Tasks

- P1 — Freeze this unit doc with its embedded ledgers, its acceptance criteria
  and its `ac-hash`, before the first implementation line (validator:
  `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/570-track-undici-advisories/SPEC.md` prints `verdict PASS` and exits
  0)
  (Implements: S1, S4)
  - Relevant files: docs/fix/570-track-undici-advisories/SPEC.md
- P2 — Land the frozen-failure corpus alone: one case asserting the committed
  tree resolves `undici` to a version not below the 8.12.2 floor, observed
  failing on the pre-change lock (validator:
  `bun test scripts/dependency-advisory-pass.test.mjs` exits 1 at this commit
  and 0 at P3, with both runs recorded in `## Log`)
  (Implements: S2, S4)
  - Relevant files: scripts/dependency-advisory-pass.test.mjs
- P3 — Apply the remedy: the root workspace's `overrides` entry and the lock
  resolution it produces (validator:
  `bun install --frozen-lockfile` exits 0 beside
  `bun test scripts/dependency-advisory-pass.test.mjs` exiting 0)
  (Implements: S2, S5)
  - Relevant files: package.json
- P4 — Differential: drive the touched command from a base-commit copy and from
  this change in `mktemp -d`, declaring every output difference (validator:
  `diff -u /tmp/aw570-base.txt /tmp/aw570-change.txt` exits 1 naming only the
  `undici` rows and the blocking count, and both receipts exit 0)
  (Implements: S2, S3)
- P5 — Documentation and repository state in the same change: the `## Fixes`
  row, the projection through the emitter and the journal fragment (validator:
  `bun scripts/docs-generate.mjs --check` exits 0 and
  `bun scripts/roadmap-settle.mjs` exits 0)
  (Implements: S1, S4)
  - Relevant files: docs/ROADMAP.md, docs/generated/
- P6 — Verification: the deterministic gates in the foreground, every
  obligation closed (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The failure is real and unchanged since audit 1: the pass reports `186 packages resolved, 9 advisories, 4 blocking, 5 report-only`, and every blocking row is `undici 8.10.2 → 8.12.2` | issue [#570](https://github.com/gtrabanco/agentic-workflow/issues/570) body + `docs/audits/2-2026-11-16.md` F2 | read 2026-11-16 (this session) | O1, O2; the whole change |
| PE-002 | measured-baseline | The receipt is still that receipt today: `bun scripts/dependency-advisory-pass.mjs` at `d1287c3d` · exit 0 · `186 packages resolved, 9 advisories, 4 blocking, 5 report-only`, with `minimatch` the only non-undici row | this session, foreground | run 2026-11-16 (this session) | O1; D1 |
| PE-003 | registry-live | The peer toolchain's **latest** already carries the fix: `@earendil-works/pi-coding-agent@1.5.2` declares `undici: 8.12.3`, published 2026-11-10 — five days *before* the audit. The lock is frozen at `1.4.0` (undici 8.10.2), so the advisory is a stale-lock state, not a toolchain limitation | `npm view @earendil-works/pi-coding-agent version dependencies` and `npm view … time --json` | run 2026-11-16 (this session) | O1, O3; D1, D2; `## Non-goals` |
| PE-004 | committed-source | `@earendil-works/pi-coding-agent` is a **peer** in two packages (`>=1.1.0`) and is absent from every `dependencies`/`devDependencies` block, so nothing ships it; the lock's `1.4.0` entry is the peer bun resolved | `packages/pi-agentic-workflow/package.json:59`, `packages/pi-nan-agentic-workflow/package.json:45`, `bun.lock` workspace entries | read 2026-11-16 (this session) | O3, O5; S3 |
| PE-005 | measured-baseline | A root `overrides` entry is honoured by this workspace's bun: adding `{"undici": "^8.12.2"}` and installing re-resolves `undici` to **8.12.4** while `@earendil-works/pi-coding-agent` stays **1.4.0** and no other line moves | scratch `/tmp/aw570-A-*`: `bun install` → `Saved lockfile`, `164 packages installed`; `rg '^    "undici"' bun.lock` → `undici@8.12.4` | run 2026-11-16 (this session) | O1, O3, O4; D1, D3 |
| PE-006 | measured-baseline | The overridden tree clears the receipt: the pass on the scratch tree reports `186 packages resolved, 1 advisory, 0 blocking, 1 report-only`, the remaining row being `minimatch` | scratch `/tmp/aw570-A-*`: `bun scripts/dependency-advisory-pass.mjs` | run 2026-11-16 (this session) | O1, O2; D1 |
| PE-007 | measured-baseline | `bun update` (the other way to reach a fixed `undici`) is not the minimal move: it printed 47 bumped package lines, including the whole `@aws-sdk` tree, `ws` and `tslib` | scratch `/tmp/aw570-*`: `bun update` → `^ @earendil-works/pi-coding-agent 1.4.0 -> 1.5.2`, `^ ws 8.22.0 -> 8.23.0`, … (47 lines), `47 packages installed` | run 2026-11-16 (this session) | O4; D2; `## Non-goals` |
| PE-008 | measured-baseline | The second named remedy also works and also over-reaches: `bun update @earendil-works/pi-coding-agent` moves the peer `1.4.0 → 1.5.2`, brings `undici@8.12.3`, and yields `187 packages resolved, 1 advisory, 0 blocking` — the same clean receipt with the whole peer toolchain moved | scratch `/tmp/aw570-B-*`: `bun update @earendil-works/pi-coding-agent` + the pass | run 2026-11-16 (this session) | O3; D2; `## Non-goals` |
| PE-009 | committed-source | The pin doctrine refuses floating specs (`^`, `~`, `*`, `latest`, `x`) for `dependencies`/`devDependencies` and requires a partial pin to carry its reason, while the committed lock records the exact resolution regardless | `docs/workflow/PACKAGES.md:45` | read 2026-11-16 (this session) | O3; D3 |
| PE-010 | committed-source | The `--pins` gate reads `packages/*` manifests only (`packageDirs`), and `pin-watch` reads the same set, so a root `overrides` block is outside both watches — the floor needs a suite case, not a watch | `scripts/version-parity-gate.mjs:97`, `scripts/pin-watch.mjs:101` | read 2026-11-16 (this session) | O6; `## Future` |
| PE-011 | committed-source | The advisory suite already reads the real tree in its tail cases (`the review pack names the carrier`, `the local gate runs the pass in the degraded-not-failed step`), and exports `collectResolved`, so a repository-state case needs no new script | `scripts/dependency-advisory-pass.test.mjs:448,456`; `scripts/dependency-advisory-pass.mjs:87` | read 2026-11-16 (this session) | O6; D4 |
| PE-012 | committed-source | The gate installs with `bun install --frozen-lockfile`, so the lock must agree with the manifest byte-for-byte or the first step fails | `scripts/local-gate.mjs:183-190` | read 2026-11-16 (this session) | O4; P6 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S5 | the resolved tree no longer carries the four blocking-ladder `undici` advisories: `node scripts/dependency-advisory-pass.mjs` reports `0 blocking` and no `undici` row | P3 | P3 | direct application (this session) | `node scripts/dependency-advisory-pass.mjs` exits 0 with `1 advisory, 0 blocking` and no `undici` line | E line in SPEC `## Log` | verified — E4 (the change: `1 advisory, 0 blocking`) against E3 (the base: `9 advisories, 4 blocking`) |
| O2 | S4 | the frozen-failure corpus precedes the implementation and both runs are observable: the floor case fails on the pre-change lock and passes on the change | P2 | P2 | direct application (this session) | `bun test scripts/dependency-advisory-pass.test.mjs` exits 1 at the red commit and 0 at the implementation commit | E lines in SPEC `## Log` naming both commits | verified — E1 (`56451e61`, 21 pass / 1 fail) and E2 (`c8e40871`, 22 pass / 0 fail) |
| O3 | S3, S5 | nothing shipped moves: no `packages/**` manifest or `src/` file changes, and the mechanism lives in the root workspace alone | P3 | P3 | direct application (this session) | `git diff --stat d1287c3d -- packages/` prints nothing and `rg -c '"undici"' packages/*/package.json` matches nothing | E line in SPEC `## Log` | verified — E6 (empty `packages/` diff, zero `undici` manifest matches) |
| O4 | S2, S5 | the lock agrees with the manifest and moves nothing else: `bun install --frozen-lockfile` exits 0 and every non-`undici` resolution is byte-identical to the base | P3 | P3 | direct application (this session) | `bun install --frozen-lockfile` exits 0 and `git diff d1287c3d -- bun.lock` names only the `undici` line and the root entry's override block | E line in SPEC `## Log` | verified — E7 (`Checked 172 installs across 188 packages (no changes)`; the lock diff is 4 insertions / 1 deletion) |
| O5 | S3 | the pass stays report-only: its exit code and classification rule are unchanged, so a future advisory is still a receipt row and never a gate failure | P4 | P4 | direct application (this session) | `git diff --stat d1287c3d -- scripts/dependency-advisory-pass.mjs` prints nothing, and the suite's classification cases stay green | E line in SPEC `## Log` | verified — E5 (empty diff; the differential's stdout differs only in the declared rows, exit 0 both sides) and E8 (all cases green) |
| O6 | S4 | the drift cannot return silently: a resolution below the 8.12.2 floor fails the root suite and the failure names the floor and the advisories | P2 | P2 | direct application (this session) | `bun test scripts/dependency-advisory-pass.test.mjs` exits 1 when the case is driven against a sub-floor lock fixture | E line in SPEC `## Log` | verified — E1 (the real pre-change lock) and E9 (a toy lock at `undici@8.10.2`, read through the same collector) |
| O7 | S1, S4 | documentation and repository state ship in the same change: the `## Fixes` row, the projection through the emitter and the journal fragment | P5 | P5 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/roadmap-settle.mjs` exits 0 | E line in SPEC `## Log` | verified — E10, E11 (projection and settle both PASS) plus the journal fragment |
| O8 | S1 | the deterministic gate is green on the change's own tree | P6 | P6 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 | G line in SPEC `## Log` | verified — G1 (`--no-bail`: all 19 steps PASS in 617s); G2 records the bail-mode red the repository's shared worktree set produces while sibling sessions are mid-edit |

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the request, verbatim:
  ```
  Apply to this repository: issue #570
  ```
- **L2** — 2026-11-16, the issue, verbatim:
  ```
  Origin: product audit 2, finding F2
  (docs/audits/2-2026-11-16.md)

  Checked: `node scripts/dependency-advisory-pass.mjs` (2026-11-16) → "186 packages resolved, 9 advisories, 4 blocking, 5 report-only"; pin/posture review of `.github/workflows/*.yml` (no unpinned `uses:`); secret scan (one test fixture only).

  ## Evidence

  - undici 8.10.2 (transitive via `@earendil-works/pi-coding-agent`, a peerDependency of `packages/pi-agentic-workflow`) carries 4 blocking-ladder advisories — GHSA-2m5v-pch6-74hx, GHSA-4w7w-5xrc-9h26, GHSA-qrxm-fqhp-jwvm, GHSA-xjj6-f33q-929c, all fixed in 8.12.2 — plus 5 report-only rows.
  - The repo's own dependency gate classifies these report-only: dev toolchain only, no direct import, never shipped in the four packages.
  - Unchanged from audit 1 (F2, 2026-11-08) — tracked here so it cannot drift silently.

  ## Trigger to act (postpone rationale)

  Exposure is dev-only and the gate's verdict is report-only, so no fix is due now. Act when any of:
  1. the pin-watch job flags the advisory set growing or the fixed version leaving the semver range;
  2. undici becomes a shipped/production dependency anywhere in the four packages;
  3. the next release cut still resolves 8.10.2 with the peer toolchain able to take 8.12.2.

  ## Ready remedy (when triggered)

  A dev-toolchain `overrides` entry forcing `undici@^8.12.2` in the root workspace, or the peer toolchain update upstream.
  ```
- **D1** — 2026-11-16, applied at the owner's instruction with the issue's
  `postponed` trigger set **not** fired, and the state is recorded rather than
  smoothed over: trigger 1 (the set grew) is false — today's receipt is
  identical to audit 2's (PE-002); trigger 2 (shipped) is false — the peer is in
  no `dependencies` block (PE-004); trigger 3 needs a release cut after the
  filing, and the last cut is `v4.10.0` on 2026-10-30. The instruction is rung 1
  (AGENTS.md → Instruction precedence) and the branch was prepared for it, so
  the unit proceeds and this row is the disclosure.
- **D2** — 2026-11-16, the mechanism is S5's first branch (the root `overrides`
  entry), not the peer-toolchain update. Both clear the advisories (PE-005,
  PE-008); the override is chosen because it moves exactly one dependency while
  the peer bump moves `@earendil-works/pi-coding-agent` 1.4.0 → 1.5.2 — a
  toolchain change whose re-verification is its own unit (the `fix/370`
  precedent) and which this issue neither names a version for nor asks to
  re-verify.
- **D3** — 2026-11-16, the override is an **exact** pin (`8.12.4`), not the
  issue's literal `^8.12.2`. The repository's own doctrine refuses floating
  specs and requires a partial pin to carry a reason (PE-009); an override is
  the strongest place to apply that rule, because it rewrites a transitive pin
  upstream declared. The floor the issue names is preserved where it belongs —
  as the assertion in the suite case — so a future resolution below 8.12.2 is a
  red suite, and a resolution above it is a deliberate `fix(deps)` act.
- **D4** — 2026-11-16, the durable half lives in the advisory pass's sibling
  suite, not in a new script: the suite already reads the real tree in its tail
  cases and the pass already exports `collectResolved` (PE-011), while a new
  standalone floor script would be an orphan no audit could trace
  (AGENTS.md → Verification). One case, one assertion, no new surface.
- **D5** — 2026-11-16, the `## Fixes` roadmap row is written by hand because
  that table is owner-managed end to end by declaration (`docs/ROADMAP.md`); the
  emitter only rewrites its summary cell from this document's `roadmap_summary:`,
  which is what `bun scripts/docs-generate.mjs` does in P5.
- **E1** — 2026-11-16, the RED corpus at `56451e61`:
  `bun test scripts/dependency-advisory-pass.test.mjs` · exit 1 · **21 pass /
  1 fail** — `undici resolves 8.10.2, below the 8.12.2 advisory fix floor
  (GHSA-2m5v-pch6-74hx, GHSA-4w7w-5xrc-9h26, GHSA-qrxm-fqhp-jwvm,
  GHSA-xjj6-f33q-929c)`. The case is the frozen failure, not a restatement of
  it, and the red commit lands alone before the override exists.
- **E2** — 2026-11-16, the same suite on the change (`c8e40871`) · exit 0 ·
  **22 pass / 0 fail**.
- **E3** — 2026-11-16, the base receipt (scratch `git archive` of `d1287c3d` in
  `/tmp/aw570-base-*`): `node scripts/dependency-advisory-pass.mjs` · exit 0 ·
  `186 packages resolved, 9 advisories, 4 blocking, 5 report-only`, with the
  four blocking rows all `undici 8.10.2` and the four remaining ones
  `report-only`.
- **E4** — 2026-11-16, the change's receipt · exit 0 · `186 packages resolved,
  1 advisory, 0 blocking, 1 report-only`; the surviving row is `minimatch
  10.2.6`. The differential against E3 is the count line and the eight `undici`
  rows, nothing else; stderr is byte-identical and the exit status is 0 on both
  sides.
- **E5** — 2026-11-16, the pass is untouched:
  `git diff --stat d1287c3d -- scripts/dependency-advisory-pass.mjs` · exit 0 ·
  no output; every pre-existing case stays green in E2.
- **E6** — 2026-11-16, nothing shipped moves:
  `git diff --stat d1287c3d -- packages/` · exit 0 · no output;
  `rg -c '"undici"' packages/*/package.json` · 0 matches (rg exits 1 on no
  match, which is the clean result here).
- **E7** — 2026-11-16, the lock agrees with the manifest and moves nothing else:
  `bun install --frozen-lockfile` · exit 0 · `Checked 172 installs across 188
  packages (no changes)`; `git diff --stat d1287c3d -- bun.lock` → `4
  insertions(+), 1 deletion(-)`, which is the root entry's three-line override
  block plus the one resolution line.
- **E8** — 2026-11-16, `bun test scripts/dependency-advisory-pass.test.mjs` ·
  exit 0 · 22 pass / 0 fail (20 cases before this unit: the red corpus added
  the floor case and its non-vacuity sibling).
- **E9** — 2026-11-16, the floor mechanism is not vacuous: a toy workspace in
  `mktemp -d` (`package.json`, one workspace member declaring the peer, a
  `bun.lock` resolving `peer@1.4.0` and `undici@8.10.2`) read through the same
  `collectResolved`, then compared against the 8.12.2 floor · exit 0 ·
  `resolved: peer@1.4.0, undici@8.10.2, undici-types@8.9.0`, `violation: true`.
  The suite carries the same comparison as a case, so the pin cannot pass by
  accident on the real tree alone.
- **E12** — 2026-11-16, the regression surface behind the override — the two
  packages that import the peer toolchain at runtime, which the gate's steps do
  not cover: `bun run test` in `packages/pi-agentic-workflow` · exit 0 ·
  **899 pass / 0 fail across 80 files**; `bun run test` in
  `packages/pi-nan-agentic-workflow` · exit 0 · **36 pass / 0 fail across 5
  files**. The override moves `undici` under a `src/` that resolves the peer at
  runtime, so this is the run that could have regressed.
- **E10** — 2026-11-16, `node scripts/docs-generate.mjs --check` · exit 0 ·
  `Files: 3 checked · 0 missing · 0 stale · 0 orphaned`, `Roadmap: unchanged`,
  `verdict: PASS`.
- **E11** — 2026-11-16, `node scripts/roadmap-settle.mjs` · exit 0 · `213 unit
  docs checked`, `0 fix docs skipped`, `violations: 0`.
- **P1** — 2026-11-16, the unit doc frozen with its ledgers, its six criteria,
  its `ac-hash` and its six tasks · `1bb68475`.
- **P2** — 2026-11-16, the red corpus landed alone and observed red (E1) ·
  `56451e61`.
- **P3** — 2026-11-16, the root `overrides` entry and the lock resolution it
  produced (E2, E4, E7) · `c8e40871`.
- **P4** — 2026-11-16, the differential recorded (E3 vs E4: the count line and
  the eight `undici` rows, identical stderr, exit 0 both sides) and the runtime
  regression run (E12).
- **P5** — 2026-11-16, the `## Fixes` row, the projection through the emitter
  and the journal fragment (E10, E11) · `d7baaee6`.
- **G1** — 2026-11-16, `bun scripts/local-gate.mjs --no-bail` at HEAD
  `d7baaee6` · exit 0 · **`local-gate: PASS — 19 step(s)` in 617s**, none
  skipped:
  `workspace-install` (4s), `root-suite` (227s), `crate-suite-bun`,
  `crate-suite-node` (102s), `schema-node-compat`, `pi-node-compat`,
  `pi-compat-guard` (37s), `worktree-guard` and the four offline document
  steps. Run with fail-fast off on purpose: one red step (see G2) was the whole
  worktree set's state, and every other step needed a receipt.
- **G2** — 2026-11-16, `bun scripts/local-gate.mjs` (the canonical bail mode) at HEAD
  `d7baaee6` · exit 1 · `local-gate: FAILED at worktree-guard`, finding
  `.worktrees/feat-563-init-workspace-interview — STALE: branch
  feat-563-init-workspace-interview is merged into origin/main`. That worktree is
  a sibling session's live checkout, created and edited outside this unit (its
  `git log` shows its own commits from the same hour); `scripts/worktree-guard.mjs`
  is untouched by this branch and the same step passed in G1 minutes earlier
  when the tree was quiet. Recorded, not excused: `## Known pre-existing issues`
  owns the full statement.
- **P6** — 2026-11-16, the gate receipts recorded (G1 green, G2 red on another
  session's worktree).

## Next

The owner's external verification of the diff: §8's verification block, the
obligations ledger (8 rows, all `verified`) and the honest list of what was
skipped.

## References

Issue [#570](https://github.com/gtrabanco/agentic-workflow/issues/570) — closed by
this unit's PR. Its origin is finding F2 of
[product audit 2](../../audits/2-2026-11-16.md), unchanged from audit 1's F2.
The producer whose receipt this unit moves is
[fix/365-manifest-vulnerability-pass](../365-manifest-vulnerability-pass/SPEC.md);
the pin doctrine the override follows is
[PACKAGES.md](../../workflow/PACKAGES.md).

## Branch

`fix/570-track-undici-advisories`

## Depends on

none.

## Regression scope

| Scenario | How it is verified |
|---|---|
| the advisory pass reports the same shape and the same exit code for a clean, a degraded and a blocking tree | `bun test scripts/dependency-advisory-pass.test.mjs` exits 0 (the 19 pre-existing cases, untouched) |
| a `report-only` verdict still never reddens a review | the pass norm is unchanged (`git diff --stat d1287c3d -- scripts/dependency-advisory-pass.mjs` prints nothing) and the suite's report-only case stays green |
| the four packages import the peer toolchain at runtime and must keep working with the overridden `undici` | `bun run test` in `packages/pi-agentic-workflow` and `packages/agentic-workflow` exit 0; `bun scripts/run-root-suite.mjs` exits 0 |
| a fresh checkout can still install from the committed lock | the gate's `workspace-install` step (`bun install --frozen-lockfile`) exits 0 |
| no package starts shipping the dependency the issue says is dev-only | `rg -c '"undici"' packages/*/package.json` matches nothing |
