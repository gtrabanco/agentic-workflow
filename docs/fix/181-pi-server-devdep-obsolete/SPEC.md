# fix/181-pi-server-devdep-obsolete

> Fix specification. Copy of `docs/fix/_TEMPLATE/SPEC.md` filled per issue #181.
> Registered in `docs/fix/README.md` (`pending`, row added by `triage-issue`
> 2026-09-07). Fix unit — no Product half exists; its authority is
> reproduction, root cause, regression scope, and rollback.

## Goal

`@gtrabanco/pi-agentic-workflow` carries `@earendil-works/pi-server@0.85.0` as
a **devDependency** that nothing in the package imports — it was a shim added
by fix #166 to cover pi 0.85.0's packaging defect (`dist/index.js` re-exported
`main` → `experimental/server.js` → `@earendil-works/pi-server`, an undeclared
dependency, causing `ERR_MODULE_NOT_FOUND` in the shipped-adapter tests).
pi 0.85.1 (2026-09-05, pi PR #9132) fixed that defect, so the shim is dead
weight — while `bun.lock` still pins the dev peer to 0.85.0 and the peer range
`*` claims any pi works. This fix drops the obsolete devDependency, pins the
peer to `>=0.85.1`, re-runs the suite green on 0.85.1, refreshes the
verified-baseline note (EN + ES) to 0.85.1 (2026-09-05), and completes the
same-PR patch release bookkeeping (0.7.1).

## Issue

#181 — tracked issue in the project's forge (label `bug`, triaged
`fix-now` on 2026-09-07). The PR must close it via `Closes #181` in the body.

## Branch

`fix/181-pi-server-devdep-obsolete` (from `main`)

## Depends on

None.

## Root cause

The shim was introduced by fix #166 (PR #168, package 0.4.1, 2026-09-04):
pi 0.85.0's `dist/index.js` eagerly re-exported `main` →
`experimental/server.js` → `@earendil-works/pi-server` without declaring it,
which broke the shipped-adapter tests with `ERR_MODULE_NOT_FOUND`; adding the
package as a devDependency satisfied the undeclared import at install time
(the 0.4.1 changelog row documents exactly this rationale,
`CHANGELOG.md:98`). pi 0.85.1 removed the defective re-export chain (pi PR
#9132, 2026-09-05), so the shim's reason no longer exists — but nothing tied
its removal to that pi release, and the lockfile's dev-peer resolution
(0.85.0) kept lagging the fixed baseline. Confirmed dead weight today: zero
`pi-server` references in the package's `src/`, `test/`, and `dist/` (PE-001).

## Detected in

Issue #181, opened 2026-09-07 by the package owner after empirically
re-verifying the suite on 0.85.1 without the shim (140/140 pass; 0.85.0
without the shim fails `ERR_MODULE_NOT_FOUND`). `triage-issue` confirmed the
same day: zero imports, stale `bun.lock` pin, stale README baseline note,
pi 0.85.1 live on the registry.

## Scope

### In scope

1. **Drop the devDep and pin the peer** (P1): remove
   `@earendil-works/pi-server` from
   `packages/pi-agentic-workflow/package.json` `devDependencies` and change
   `peerDependencies["@earendil-works/pi-coding-agent"]` from `*` to
   `>=0.85.1` (issue items 1–2); re-resolve with `bun install` so `bun.lock`
   drops the shim and resolves the peer to 0.85.1 (issue item 3).
2. **Suite green on 0.85.1** (P1): `bun run test` (tsc type contract
   including the compile-time drift guard `ThinkingLevelsMirrorMatchesPi`,
   plus the `node --test` suites including the shipped-adapter tests that
   were the original failure surface) → exit 0 (issue item 3).
3. **Baseline note refresh EN + ES** (P2): `README.md` / `README.es.md`
   Notes line — 0.85.0 → 0.85.1, date → 2026-09-05 (issue item 4; one
   bilingual edit unit, CLAUDE.md hard rule).
4. **Release bookkeeping** (P3): `version:` 0.7.0 → 0.7.1 (patch) in the
   package's `package.json` plus one row in the "Companion npm packages"
   table of `CHANGELOG.md` and `CHANGELOG.es.md` (issue item 5; CLAUDE.md
   §Packages same-PR rule).

### Out of scope

- **Publishing/retiring the `@earendil-works/pi-server` npm package itself** —
  it remains on the registry; this fix only drops *this package's* devDep.
- **Upgrading beyond 0.85.1 or adopting any pi feature** — the pin is
  `>=0.85.1`, not an upgrade; no pi feature is adopted here.
- **Automating the baseline/dependency refresh** (the known gap from #166:
  nothing ties a pi release to a note/lock refresh): routed to a future
  feature entry; this fix performs the refresh manually per the issue.
- **#182** (`scoped-workspace-state-binding`, in-progress, PR #190 open):
  review-change/audit-pr skill surface — disjoint from the package manifest;
  parallel, no merge-order constraint.
- **#179** (`declared-ledger-delta-receipts`, pending): sensor/ledger
  machinery — disjoint; parallel.
- **`agentic-workflow-schema`**: pi-agnostic, no pi peer, untouched.
- **Any skill edit** — no `SKILL.md` changes, so no `bundle:skills` re-run
  and no skill version bumps; the committed skills mirror stays untouched
  (`test/skill-parity.test.mjs` confirms it stays green).

### Planning evidence

The fix's own authority, without a Product half — one row per material claim.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: `@earendil-works/pi-server: "0.85.0"` sits in `devDependencies` while `src/`, `test/`, and `dist/` contain zero `pi-server` references, and `bun.lock` still pins both `pi-server@0.85.0` and the dev peer `pi-coding-agent@0.85.0` under a `*` peer range | repository | `packages/pi-agentic-workflow/package.json` (`devDependencies`, `peerDependencies`); `packages/pi-agentic-workflow/bun.lock:8,13,78,82`; `grep -rc pi-server src/ test/` → 0, `grep -rln pi-server dist/` → 0 (observed 2026-09-08) | main @ plan cut | O1, O2, AC1, AC2 | current | proven | — |
| PE-002 | Root cause: the devDep is the shim fix #166 added (0.4.1, PR #168, 2026-09-04) to cover pi 0.85.0's undeclared re-export chain (`main` → `experimental/server.js` → `pi-server`; `ERR_MODULE_NOT_FOUND` in the shipped-adapter tests); pi 0.85.1 (pi PR #9132, 2026-09-05) removed the chain, so the shim's reason is gone and nothing tied its removal to that release | repository + document | `CHANGELOG.md:98` / `CHANGELOG.es.md:100` (0.4.1 rows stating the shim rationale); issue #181 §Problem; triage comment confirming pi #9132 ("Fixed SDK import failures caused by unintentionally publishing internal experimental code and dependencies in 0.85.0") | main @ plan cut | O1, AC1 | current | proven | — |
| PE-003 | Regression scope: dev/test install surface only — the published tarball's `files:` is `dist`, `skills`, manifests, READMEs (never `node_modules`), `dist/` has zero `pi-server` references, and the only shipped behavioral delta is the peer range `*` → `>=0.85.1`, which makes bun/npm **warn** on a pi 0.85.0 host instead of silently accepting an untested pairing | repository | `packages/pi-agentic-workflow/package.json` (`files`, `peerDependencies`); `grep -rln pi-server dist/` → 0 | main @ plan cut | O2, AC2 | current | proven | — |
| PE-004 | Rollback path: one `git revert` of the fix PR restores the devDep, the `*` peer, the 0.85.0 lock resolution, the note, and the version; data cleanup: none; if 0.7.1 is already published, a follow-up patch bump (0.7.2) republishes the prior bytes — publish CI skips same-version pushes | derived | rule "single-PR revert + patch republish (`publish-pi-package.yml` version gate)", inputs PE-001 + PE-009 | — | O1–O7 | not-applicable | decision | — |
| PE-005 | Affected invariant/use case: the package manifest declares only what the package uses (an unimported devDependency is audit/provenance noise and misleads maintainers), and the peer range states the minimum pi the package is actually verified against | repository | `packages/pi-agentic-workflow/package.json` (`devDependencies`, `peerDependencies`); `packages/pi-agentic-workflow/README.md` §Notes (the peer-declaration claim) | main @ plan cut | O1, O5, AC2, AC3 | current | proven | — |
| PE-006 | pi 0.85.1 fixed the packaging defect; the issue's empirical proof: peer 0.85.1 **without** the devDep → full suite 140/140 pass (tsc drift guard `ThinkingLevelsMirrorMatchesPi` + `node --test`); peer 0.85.0 without the devDep → `shipped-adapter.test.mjs` fails `ERR_MODULE_NOT_FOUND`. npm registry serves 0.85.1 for both `pi-coding-agent` and `pi-server` (observed 2026-09-08) | forge | issue #181 §"Empirical proof" + §Verification (2026-09-07); triage comment (changelog #9132 confirmed 2026-09-07); `npm view @earendil-works/pi-coding-agent version` (2026-09-08) | — | O3, AC1 | current | proven | — |
| PE-007 | Peer-resolution mechanics: with the range `>=0.85.1`, the lock's current `pi-coding-agent@0.85.0` resolution becomes invalid, so `bun install` re-resolves to 0.85.1 and prunes `pi-server` (direct devDep entry at `bun.lock:8` + package entry at `bun.lock:82`) from both the lockfile and `node_modules` | repository | `packages/pi-agentic-workflow/bun.lock:8,13,78,82`; `packages/pi-agentic-workflow/package.json` | main @ plan cut | O2, AC1 | current | proven | — |
| PE-008 | The suite is peer-sensitive and covers exactly this change: `test` = `tsc && node --test test/*.test.mjs`; tsc compiles against the peer's `.d.ts` including the compile-time drift guard `ThinkingLevelsMirrorMatchesPi`; `test/shipped-adapter.test.mjs` is the suite that failed on 0.85.0 without the shim — the pre-existing detector for the packaging defect this fix un-shims | repository | `packages/pi-agentic-workflow/package.json` (`scripts.test`); `test/shipped-adapter.test.mjs`; PE-006 | main @ plan cut | O3, O8, AC1 | current | proven | — |
| PE-009 | CI publishes the package on merge when the version differs from the registry, gated by `prepublishOnly` (build + test) — merging this PR ships 0.7.1 and the refreshed note to npm immediately, so AC1–AC4 must hold before merge and bookkeeping is same-PR | repository | `.github/workflows/publish-pi-package.yml` (version gate + bun test gate); `packages/pi-agentic-workflow/package.json` `prepublishOnly` | main @ plan cut | O6, O7 | current | proven | — |
| PE-010 | The user directs: remove the `pi-server` devDep, pin the peer to `>=0.85.1`, re-run the suite green with 0.85.1 (lock re-resolved), update the README baseline note EN+ES to 0.85.1 (2026-09-05), and complete release bookkeeping (patch bump + CHANGELOG rows in both languages) | forge | issue #181 §Fix (items 1–5), §Files changed, §Verification | — | O1–O7 | not-applicable | decision | — |
| PE-011 | Required failure state: a red suite on 0.85.1 without the shim stops the unit before P2 — the break is triaged as its own finding, the shim is never silently re-added, and the baseline note is never refreshed to a pi version the package suite does not pass | document | `verification-contract` anti-gaming rules; `evidence-grounding` overclaim guardrail; #166 precedent obligation O12 | — | O8 | not-applicable | decision | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | PE-001 + PE-010 (issue item 1) | The `pi-server` devDependency is removed from the package manifest | P1 | 1 | execute-phase | AC2 validator (devDependencies check) → exit 0 | command output in progress.md | planned |
| O2 | PE-003 + PE-007 (issue item 2) | The peer range on disk is `>=0.85.1`, the lock resolves `pi-coding-agent@0.85.1`, and `pi-server` is pruned from lockfile and `node_modules` | P1 | 2 | execute-phase | AC1 + AC2 validators (peer version, lock grep, node_modules absence) | command outputs in progress.md | planned |
| O3 | PE-006 + PE-008 (issue item 3) | The package suite is green with the 0.85.1 peer and no shim (tsc type contract incl. `ThinkingLevelsMirrorMatchesPi` + full `node --test` incl. shipped-adapter) | P1 | 3 | execute-phase | AC1 validator (`bun run test`) → exit 0 | exit code + test counts in progress.md | planned |
| O4 | AC1 | The verification evidence (resolved peer, suite exit code + counts, lock/`node_modules` greps) is recorded as `- VERIFY` rows in the unit progress file | P1 | 4 | execute-phase | `grep -c "^- VERIFY" docs/fix/181-pi-server-devdep-obsolete/progress.md` → ≥ 3 | progress.md rows | planned |
| O5 | PE-005 + PE-010 (issue item 4) | The baseline note reads 0.85.1 with the date (2026-09-05) in EN and ES — one bilingual edit unit; no stale 0.85.0 claim remains in either README | P2 | 1 | execute-phase | AC3 validators → 0 stale / ≥ 1 hit each | grep output in progress.md | planned |
| O6 | PE-009 + PE-010 (issue item 5) | Package version bumped 0.7.0 → 0.7.1 | P3 | 1 | execute-phase | AC4 validator → `0.7.1` | command output | planned |
| O7 | PE-009 + PE-010 (issue item 5) | The 0.7.1 row is present in the "Companion npm packages" tables of both `CHANGELOG.md` and `CHANGELOG.es.md` — one bilingual change | P3 | 2 | execute-phase | AC4 validator greps → ≥ 1 each | grep output | planned |
| O8 | PE-011 | Required failure state: a red suite on 0.85.1 without the shim stops the unit before P2; the break is triaged as its own finding; the shim is never silently re-added and the note is never refreshed to an unverified version | P1 | 3 | execute-phase | read-verified: progress.md records any red-suite outcome plus the stop decision before P2 runs | progress.md note | planned |
| O9 | AC5 | The fix-index row flips to `done` with the PR link after the PR opens (the index's backticked done-row convention, `#166`/`#159` siblings) | P4 | close-out chain | execute-phase | AC5 validator → 1 | docs/fix/README.md row | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command with an expected outcome; the record of the suite run is
command-greppable in the unit progress file.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement.

- [x] No template placeholders left — the `### P1` scaffold lines are replaced, not kept (the literal `Hardening & PR` chain keeps the template's own pre-written tokens per the phase contract).
- [x] `### Out of scope` has ≥ 1 concrete bullet (seven, each with its route).
- [x] Every `## Acceptance` criterion is a runnable command with an expected outcome.
- [x] Every phase passes the 8-box Phase-lint below (close-out phase exempt per `skills/phase-contract/SKILL.md`; fix/161 + fix/166 precedent).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001), the root cause (PE-002), the regression scope (PE-003), and the rollback path (PE-004) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant, affected use case, and required failure state, each with a phase and a validator; no `deferred` row and none exported to a follow-up issue.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The package suite is green with `@earendil-works/pi-coding-agent` resolved to exactly 0.85.1 and `pi-server` fully pruned from the lockfile and `node_modules`. | `cd packages/pi-agentic-workflow && bun run test` → exit 0; `cd packages/pi-agentic-workflow && node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → `0.85.1`; `grep -c "pi-server" packages/pi-agentic-workflow/bun.lock` → `0`; `test ! -d packages/pi-agentic-workflow/node_modules/@earendil-works/pi-server` → exit 0 |
| AC2 | The manifest on disk carries the new peer range and no `pi-server` devDependency. | `node -p "require('./packages/pi-agentic-workflow/package.json').peerDependencies['@earendil-works/pi-coding-agent']"` → `>=0.85.1`; `node -e "process.exit(require('./packages/pi-agentic-workflow/package.json').devDependencies['@earendil-works/pi-server'] === undefined ? 0 : 1)"` → exit 0 |
| AC3 | The baseline note reads 0.85.1 with the 2026-09-05 date in EN and ES; no stale 0.85.0 claim remains in either package README. | `grep -c "0\.85\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → `0` and `0`; `grep -c "0\.85\.1" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 each |
| AC4 | Release bookkeeping complete in the same PR: package `version:` 0.7.1 and the 0.7.1 row present in both changelog tables. | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.7.1`; `grep -c "| 0.7.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each |
| AC5 | The fix-index row for #181 is closed with the PR link after the PR opens, in the index's backticked done-row convention. | ``grep -cE "\[#181\]\(https://github.com/gtrabanco/agentic-workflow/issues/181\) \| pi-server-devdep-obsolete \| \`?done\`? · \[#" docs/fix/README.md`` → 1 |

## Phases

Execution ledger — `execute-phase --fix 181` runs **all remaining phases by
default** and ticks tasks here; an explicit phase argument (e.g. `P2`) runs
exactly one phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below passes all 8 boxes (close-out phase exempt:
it carries only the literal close-out chain, fix/161 + fix/166 precedent).
Results recorded per phase.

### P1 — Drop the pi-server devDep and pin the peer to 0.85.1

Layer: `config/infra`. Done-when: `cd packages/pi-agentic-workflow && bun run
test` → exit 0 with the peer resolving to `0.85.1` and no `pi-server` in
`bun.lock`.

- [x] Edit `packages/pi-agentic-workflow/package.json`: remove `"@earendil-works/pi-server": "0.85.0"` from `devDependencies` and set `peerDependencies["@earendil-works/pi-coding-agent"]` to `>=0.85.1` (O1)
- [x] Re-resolve: `cd packages/pi-agentic-workflow && bun install` → `bun.lock` drops both `pi-server` entries and pins `@earendil-works/pi-coding-agent@0.85.1`; `node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → `0.85.1`; `test ! -d node_modules/@earendil-works/pi-server` → exit 0 (O2)
- [x] Run the gate: `cd packages/pi-agentic-workflow && bun run test` → exit 0 (tsc type contract incl. `ThinkingLevelsMirrorMatchesPi` + `node --test test/*.test.mjs` incl. `shipped-adapter.test.mjs`); on red, O8 stops the unit before P2 (O3, O8)
- [x] Append the verification evidence as `- VERIFY` rows (resolved peer version, suite exit code + counts, lock grep, `node_modules` absence) to `docs/fix/181-pi-server-devdep-obsolete/progress.md` (O4)

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:4:drop-devdep-pin-peer`

### P2 — Refresh the baseline note to pi 0.85.1 (EN + ES)

Layer: `docs`. Done-when: `grep -c "0\.85\.0"
packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md`
→ `0` and `0`.

- [x] Update the Notes baseline line in `README.md:142` and `README.es.md:148` as one bilingual edit: version → 0.85.1, date → 2026-09-05 (O5)

Phase-lint: PASS (8/8) · fingerprint `P2:docs:1:baseline-note-pi-0851`

### P3 — Release bookkeeping 0.7.1

Layer: `docs`. Done-when: `node -p
"require('./packages/pi-agentic-workflow/package.json').version"` → `0.7.1`;
`grep -c "| 0.7.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each.

- [ ] Bump `packages/pi-agentic-workflow/package.json` `version:` 0.7.0 → 0.7.1 (O6)
- [ ] Add the 0.7.1 patch row to the "Companion npm packages" table in `CHANGELOG.md` and its `CHANGELOG.es.md` sibling — one bilingual change (O7)

Phase-lint: PASS (8/8) · fingerprint `P3:docs:2:release-bookkeeping-071`

### P4 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #181`
- [ ] Update the fix-index row to `` `done` · [#<pr>](<pr-url>) ``
- [ ] Commit `docs: link PR #<n>` and push

## Rules that must never be violated

- The baseline note is never refreshed to a pi version the package suite does
  not pass (PE-011; verification-contract anti-gaming).
- The EN and ES edits ship in the same change — a diff touching only one side
  of a bilingual pair (baseline note, changelog rows) is incomplete
  (CLAUDE.md hard rule).
- `bun.lock` is the sole lockfile; a `package-lock.json` must never appear
  (`test/lockfile-policy.test.mjs` fails the suite on one).
- Release bookkeeping (version bump + both changelog tables) is same-PR
  (CLAUDE.md §Packages) — CI publishes on merge when the version differs.
- No validator is weakened or skipped to manufacture green
  (verification-contract).
- Out-of-scope problems are routed (separate fix/feature entries), never
  absorbed into this unit's phases.
- Never push or open the PR from the planning stage — that belongs to P4
  (`execute-phase --fix`).

## Impact

- **Layers** (per the package's own structure): package configuration/infra
  (manifest `package.json`, lockfile `bun.lock`) and docs (package READMEs,
  root changelogs). No source module, port, adapter, or entity changes —
  `src/` and `test/` are untouched.
- **Files**: `packages/pi-agentic-workflow/package.json` (devDep + peer +
  version), `packages/pi-agentic-workflow/bun.lock` (re-resolved),
  `packages/pi-agentic-workflow/README.md` + `README.es.md` (baseline note),
  `CHANGELOG.md` + `CHANGELOG.es.md` (0.7.1 rows), `docs/fix/README.md`
  (index row lifecycle), unit artifacts under
  `docs/fix/181-pi-server-devdep-obsolete/`.
- **Blast radius**: dev/test install surface (the lockfile's dev peer and
  devDeps are not shipped — `files:` publishes `dist`, `skills`, manifests,
  READMEs) plus, after merge, the published README claim and the peer range
  npm consumers resolve against (a pi 0.85.0 host now gets a peer-mismatch
  warning — intended, PE-003). No runtime code path changes.
- **Detection lead time**: immediate — P1's suite and lock greps and P2's
  note grep catch a stale surface at execution time; post-merge, CI's publish
  gate re-runs build + test on every version bump (PE-009).

## Operational risks

- **CI publish on merge** (PE-009): merging publishes 0.7.1 with the
  refreshed note and the tightened peer range in one push. Mitigation: AC1–AC4
  must hold before P4 opens the PR; the PR body carries the evidence.
- **`bun install` side effects**: re-resolving may prune transitive
  dev-only resolutions that `pi-server` (or the old peer pin) pulled in; the
  package suite (O3) is the gate that the new resolution set is sound. The
  lockfile-policy test confirms `bun.lock` stays the sole lockfile.
- **Contributor friction from the peer pin** (low, intended): a contributor
  on pi 0.85.0 gets a peer-mismatch warning instead of silent acceptance.
  That is the issue's explicit goal (guide stale installs to update).

## Security risks

n/a — no secrets, auth, PII, webhook, or rate-limit surface changes. Dropping
an unused devDependency reduces install surface (fewer transitive packages
during development).

## Compliance touchpoints

n/a — stated explicitly per the fix contract.

## Affected docs

Every mapped doc update is an acceptance criterion: package `README.md` +
`README.es.md` baseline note (AC3), `CHANGELOG.md` + `CHANGELOG.es.md`
companion-package rows (AC4), `docs/fix/README.md` index row lifecycle (AC5).
No `docs/workflow/` or `docs/site/` content changes.

## Observability

- Green: `cd packages/pi-agentic-workflow && bun run test` → exit 0 with the
  0.85.1 peer and no shim (AC1); the `- VERIFY` rows in the unit progress
  file record the evidence; post-merge, the CI publish gate re-runs
  build + test (PE-009).
- Silent failure caught: AC1's lock grep and `node_modules` check fail closed
  if `pi-server` resurfaces; AC3's greps fail closed while a stale 0.85.0
  claim remains; AC2's devDependencies check fails closed if the devDep was
  not removed.

## Cross-issue notes

- **#182** (in-progress, PR #190 open): touches `review-change`/`audit-pr`
  skill surfaces and a workspace-state CLI — disjoint from the package
  manifest/lock/docs surface; parallel, no merge-order constraint.
- **#179** (pending): sensor/ledger receipt machinery — disjoint; parallel.
- **Baseline-refresh automation gap** (carried from #166's out-of-scope):
  nothing ties a pi release to a note/lock/devDep refresh; remains routed to
  a future feature entry. This fix performs the refresh manually per the
  issue's acceptance criteria.
- **`@earendil-works/pi-server` on npm**: the package itself is untouched —
  only this repository's devDependency on it is dropped.

## Testing

The package's own suite is the regression gate and it is precisely
peer-sensitive: `tsc` type-contract compilation against the peer's `.d.ts`
(including the compile-time drift guard `ThinkingLevelsMirrorMatchesPi`) plus
the `node --test` suites — `test/shipped-adapter.test.mjs` is the
pre-existing detector for the packaging defect this fix un-shims (it failed
`ERR_MODULE_NOT_FOUND` on 0.85.0 without the shim, PE-006/PE-008). Run with
the re-resolved 0.85.1 peer; no heavy mocking of pi internals beyond the
documented session behavior. No new tests are added — see drafting decision 3.

## Rollback

One `git revert` of the fix PR restores the devDep, the `*` peer, the 0.85.0
lock resolution, the baseline note, and the version; data cleanup: none. If
0.7.1 is already published, a follow-up patch bump (0.7.2) republishes the
prior bytes — the publish workflow skips same-version pushes, so the bump is
required for npm to pick the revert up. Preserved: all history artifacts and
the verification evidence recorded in the unit progress file; lost: nothing.

## Effort

S — one working session: manifest edit + lock re-resolve + suite run, two
bilingual doc edits, bookkeeping rows, one PR. No source changes, no new
tests, no smoke phase (scope discipline: the issue does not ask for one).

## Decisions made during drafting

1. **Version bump is patch (0.7.1)**: the shipped delta is the manifest
   metadata (peer range) plus dev-only lockfile changes and README bytes; no
   API or behavior change. The issue requires the bump + changelog rows in
   the same PR regardless (PE-010).
2. **The baseline-note parenthetical (verified-surface list) stays
   unchanged**: 0.85.0 → 0.85.1 is a packaging-only delta (pi PR #9132), so
   the interactive surfaces it names are unchanged; the 0.85.1 verification
   for this unit is the automated suite + tsc drift guard per the issue's own
   Verification section — no manual smoke re-run is in scope (the issue does
   not ask for one).
3. **No new regression test**: `test/shipped-adapter.test.mjs` is the
   pre-existing detector for the packaging defect (PE-008) and stays in the
   gate; asserting lockfile contents in a test would duplicate
   `test/lockfile-policy.test.mjs`'s role without adding a new invariant.
   AC1's greps cover the pruned-dep invariant at execution time.
4. **O8's stop rule is stop-before-P2** (not before P3): P2 is the note edit
   this unit must never perform on an unverified pi (#166's O12 precedent,
   re-cut for this unit's phase topology).
5. **The fix-index row registered by `triage-issue` (`pending`, topic
   `pi-server-devdep-obsolete`) is kept verbatim**; this unit only flips it
   to `done` at close-out (O9). No second row is added.

## Status

`pending`

(Removed from `docs/fix/README.md` only **after** the PR merges.)
