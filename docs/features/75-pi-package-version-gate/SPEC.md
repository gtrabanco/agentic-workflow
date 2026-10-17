---
type: feature
scope: medium
---

# 75 — pi-package-version-gate

> One-line: a PR-triggered CI gate that refuses any change to what `@gtrabanco/pi-agentic-workflow` ships — root `skills/**` or the package tree — without a package version bump + CHANGELOG companion row, and refuses a dependency pin whose target has published a newer version.

## Objective

A deterministic, dependency-free gate script (`scripts/version-parity-gate.mjs`) wired into `root-suite.yml` as two jobs: an offline **content** gate (skills/package-tree changed vs base ⇒ package version differs vs base, else fail naming the package and the required CHANGELOG row) and a **dependency-pin** gate (registry latest > exact pin ⇒ fail with the fix message; unreachable registry ⇒ visibly degraded pass). The same PR repairs the live drift: schema pin 4.5.0 → 4.6.0 and package 0.19.1 → 0.20.0 so the first gated release publishes registry parity with main.

## Why

Root `skills/**` is the Pi package's shipped content but lives outside `packages/pi-agentic-workflow/**`, so a skills-only merge bumps nothing: `publish-pi-package.yml` never triggers, `npm-version-gate` is never asked, and npm ships stale skills. Verified live on the branch worktree (2026-10-15): registry 0.19.1 lacks `skills/bump-skill` entirely and differs in 5 skill files (commits `9c232599`, `11f99cea`, `d235446b`, `7b40b1c3`); the schema pin still says 4.5.0 while the registry published 4.6.0 (#289 unreachable for Pi consumers). The failure class was reported as #164 (closed by #180's promotion without implementing the option-4 PR gate) and produced the broken 0.18.5 release (#281). Nothing in CI currently asks "did the shipped content change?".

## User outcome

A contributor merging a skills-only PR can no longer strand it off npm: the PR goes red with a message naming `@gtrabanco/pi-agentic-workflow`, the required version bump, and the CHANGELOG companion row. A dependency publishing ahead of the pin turns every open PR red with the fix in the message ("bump the pin + the package version in the same PR"). After merge, `npm view @gtrabanco/pi-agentic-workflow version` serves a bundle byte-equivalent to main's `skills/`.

## Acceptance criteria

1. A PR that changes `skills/**` without bumping `packages/pi-agentic-workflow/package.json` (vs base) fails a PR-triggered gate with a message naming the package and the required CHANGELOG companion row — and the same gate fires when the pin's target has published a newer version than the pin.
2. The gate's trigger set is explicitly `skills/**` + `packages/pi-agentic-workflow/**` + the pinned dependency versions (the package tree alone is the gap #164 missed).
3. `bun run test` in the Pi package gains no new flakiness: the check is deterministic, offline (the registry check is a separate, clearly-degraded-when-unreachable job), and runs on every PR like the root suites.
4. First release after the gate lands carries the stranded skill fixes and the schema 4.6.0 pin — registry parity with main demonstrated in the PR's evidence.
5. AGENTS.md "Packages" section updated to name the gate and its triggers; CHANGELOG row; version bumps per the versioning rule.

## Non-goals

- No auto-bump or auto-version pipeline (#180 owns the promoted auto-bump + stable-tag work; this unit enforces the manual rule, it does not automate it).
- No change to `publish-pi-package.yml`'s `paths` filter: the enforced bump makes every content merge touch `packages/pi-agentic-workflow/**`, which already triggers the publish workflow.
- No parity gate for the other two packages (`agentic-workflow-schema`, `agentic-workflow`): their content lives inside their own trees, which their publish workflows' `paths` filters already cover.
- No scheduled registry polling; the pin check runs on every PR (and on main pushes), nothing else.
- No new runtime dependency: the gate script uses `node:` builtins only, `git`/`npm` CLIs as spawned processes.
- No `skills/**` content change in this unit.

## Future

none

## Future cost

- The gate's trigger set (`skills/**` + `packages/pi-agentic-workflow/**` + pinned dependency versions) is contract: any future packaging change that alters what the Pi package ships (e.g. a new content source outside those paths) must extend the gate's trigger list in the same PR. Binds: future packaging PRs, `root-suite.yml` maintainers.

## Applicable tests

`scripts/version-parity-gate.test.mjs` — offline, deterministic (fixture-driven, injected registry fetcher): content-mode pass/fail matrix (skills changed / package tree changed / unrelated change × version bumped / not × CHANGELOG row present / absent), pin-mode drift/degraded/equal matrix, semver comparator. Runs in the root suites (`node --test scripts/*.test.mjs`).

## Known pre-existing issues

- #180 (open, promoted): auto-bump + stable-tag pipeline — related, not blocking; its trigger set covers shape 1 but not the dependency-pin shape. Does-not-affect this unit's gate.
- #281 (closed symptom): 0.18.5 published out of sync with source — same release-parity class, prior evidence. Does-not-affect the implementation.
- Registry 0.19.1 vs main skills drift + schema pin 4.5.0 vs registry 4.6.0 (verified 2026-10-15 on this branch): the live defect this unit repairs in P4; affects AC4 directly.

## Tasks

P1 — `scripts/version-parity-gate.mjs`: dependency-free gate with two modes — `--content` (offline: three-dot diff vs `--base` over `skills/**` + `packages/pi-agentic-workflow/**`; any hit ⇒ head `version` ≠ base `version`, else fail naming the package and the CHANGELOG row; bump-without-row also fails) and `--pins` (each exact `dependencies` pin vs injected/npm-fetched registry latest; registry > pin ⇒ fail with "bump the pin + the package version in the same PR"; fetch failure ⇒ exit 0 with a visible degradation notice; peerDependencies and non-exact specs skipped with a notice) (validator: `node scripts/version-parity-gate.mjs --content --base origin/main` exits 0 on a clean worktree)
  - Relevant files: scripts/version-parity-gate.mjs
P2 — `scripts/version-parity-gate.test.mjs`: fixture-driven suite pinning the AC1/AC2 matrix, the degradation behaviour, and the semver comparator (validator: `node --test scripts/version-parity-gate.test.mjs` exits 0)
  - Relevant files: scripts/version-parity-gate.test.mjs, scripts/version-parity-gate.mjs
P3 — `root-suite.yml` wiring: a PR-gated content-gate step (runs `--content` against the PR base; deterministic, offline) and a separate `dependency-pin-gate` job (runs `--pins`; the clearly-degraded-when-unreachable registry job) (validator: `node scripts/version-parity-gate.mjs --content --base $(git merge-base origin/main HEAD)` exits 0)
  - Relevant files: .github/workflows/root-suite.yml
P4 — Repair the live drift: pin `@gtrabanco/agentic-workflow-schema` 4.5.0 → 4.6.0 in `packages/pi-agentic-workflow/package.json`, bump the package 0.19.1 → 0.20.0, refresh `bun.lock`, add the CHANGELOG companion row (validator: `bun install --frozen-lockfile` in `packages/pi-agentic-workflow` exits 0, and `bun scripts/check-changelog-row.mjs pi-agentic-workflow 0.20.0` prints 1)
  - Relevant files: packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/bun.lock, CHANGELOG.md
P5 — AGENTS.md "Packages" section names the gate, its two triggers, and the degraded-registry job (validator: `node --test scripts/normative-drift.test.mjs` exits 0)
  - Relevant files: AGENTS.md
P6 — Verification: full root suites + Pi package suites green; gate demonstrates AC1 (fail on simulated skills-only change) and AC4 parity locally (staged bundle vs repo `skills/` diff empty) (validator: `node --test scripts/*.test.mjs` exits 0 and `bun run test` in `packages/pi-agentic-workflow` exits 0)
  - Relevant files: scripts/version-parity-gate.mjs, packages/pi-agentic-workflow/package.json

### Planning evidence

| id | claim | source | status |
|---|---|---|---|
| PE-001 | Registry 0.19.1 lacks `skills/bump-skill` and differs in 5 skill files vs main's `skills/` | local tarball diff, 2026-10-15 (`/tmp/parity-check`) | verified |
| PE-002 | Registry `@gtrabanco/agentic-workflow-schema` latest is 4.6.0; the Pi package pins 4.5.0 | `npm view` outputs, 2026-10-15 | verified |
| PE-003 | `publish-pi-package.yml` `on.push.paths` covers only `packages/pi-agentic-workflow/**` + the workflow file; root-suite.yml runs on every `pull_request` with full history | `.github/workflows/publish-pi-package.yml`, `.github/workflows/root-suite.yml` | verified |
| PE-004 | The enforced version bump makes every content merge touch `packages/pi-agentic-workflow/package.json`, so the publish workflow triggers without a `paths` change | D3 reasoning over PE-003 | unknown — ASSUMPTION-UNVERIFIED (owner: release step P6 evidence) |

### Obligations

| id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1/AC2 | `skills/**` or `packages/pi-agentic-workflow/**` changed vs base without a version bump ⇒ gate exits non-zero naming the package + CHANGELOG row | P2 | P2 | scripts/version-parity-gate.mjs | `node --test scripts/version-parity-gate.test.mjs` | failing-case test rows | planned |
| O2 | AC1/AC2 | registry latest > exact pin ⇒ gate exits non-zero with the fix message | P2 | P2 | scripts/version-parity-gate.mjs | `node --test scripts/version-parity-gate.test.mjs` | drift test rows | planned |
| O3 | AC3 | registry unreachable ⇒ `--pins` exits 0 with a visible degradation notice (never fails on network) | P2 | P2 | scripts/version-parity-gate.mjs | `node --test scripts/version-parity-gate.test.mjs` | degraded test row | planned |
| O4 | AC3 | content mode is fully offline and deterministic (git + filesystem only) | P1 | P1 | scripts/version-parity-gate.mjs | `node scripts/version-parity-gate.mjs --content --base origin/main` | clean-run output | planned |
| O5 | AC1 | bump present but CHANGELOG companion row absent ⇒ gate fails | P2 | P2 | scripts/version-parity-gate.mjs | `node --test scripts/version-parity-gate.test.mjs` | row-absent test row | planned |
| O6 | AC4 | shipped bundle byte-equivalent to repo `skills/` at the release commit | P6 | P6 | release step | staged-bundle vs `skills/` diff empty | parity diff output | planned |

## Triaged steps

```
TRIAGE — 75-pi-package-version-gate (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

AC-section digest at triage: `a52ef2a4831ca1c4676323fcdfcc655c6fbb0e40162897d3417a34c611592a92`

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | local npm tarball diff + `npm view` + workflow file reads | 0 | 0.19.1 missing `bump-skill`, 5 files differ; schema pin 4.5.0 vs registry 4.6.0 | opus research step |

## Progress log

2026-10-15 — unit created from issue #292 (`--from-issue`); research + design recorded, roadmap row 75 registered — next: triage

## Next

Run triage and execute the first triaged step.

## References

- Issue #292 (this unit closes it)
- #164 (closed, option 4 never implemented), #180 (open, promoted auto-bump), #281 (prior symptom), #285/#289 (the stranded schema 4.6.0 fix)
- `scripts/npm-version-gate.mjs` (the publish-side exact-membership gate this complements)
