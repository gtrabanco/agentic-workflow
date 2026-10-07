# 72 — pi-100-compat-guard

> One-line: re-verify the pi 1.0.0 compatibility baseline, add a PR-time two-leg
> pi drift guard, and refresh the package's verification records (issue #283).

## Objective

Close the three compatibility-verification gaps the 2026-10-02 audit of
`@gtrabanco/pi-agentic-workflow` found after pi 1.0.0 shipped: a stale README
baseline, no PR-time type-check of the package, and a frozen lockfile that pins
the peer to 0.99.1. The code is compatible as-is (COMPAT-OK) — this unit fixes
the *verification* so future pi API drift cannot reach or hide from us.

## Why

pi 1.0.0 shipped 2026-10-01 (changelog range audited: 0.87.0 → 1.0.0). The
package's `tsc` only runs inside `publish-pi-package.yml` — post-merge, only
when the version differs from the registry — and even then against the
lockfile's pi 0.99.1, so it can never see a newer pi. The audit's temp-copy
type-check against pi 1.0.0 was clean; nothing records or re-runs it.

## User outcome

A contributor whose change breaks against the pi peer floor or against latest
pi sees the PR fail with the offending leg named, before merge. The README
states the verified pi version at a glance. The issue carries the verbatim
re-verification evidence and a one-command dev-hygiene refresh.

## Acceptance criteria

From issue #283 (its own ACs, not induced — verbatim intent, exact versions
re-based where the repo moved on, see Known pre-existing issues):

1. **AC1 — Re-verification recorded.** The audit's temp-copy type-check is
   re-run in-repo against pi 1.0.0 and its commands + verbatim result are
   pasted as a comment on issue #283 (evidence, not assertion).
2. **AC2 — PR-time drift guard.** A PR-triggered job (in `root-suite.yml`)
   type-checks `packages/pi-agentic-workflow` against two pi legs: (a) the peer
   floor `0.99.1`, (b) `latest` (currently 1.0.0). Any type error fails the PR.
   The pi install for both legs happens outside the lockfile path — temp copy +
   `npm install --no-save --no-package-lock`; no npm lockfile may appear under
   `packages/` (`test/lockfile-policy.test.mjs` fails the suite on it).
3. **AC3 — README baseline updated.** `packages/pi-agentic-workflow/README.md`
   Notes show the verified version `Pi 1.0.0 (2026-10-02)` and the peer floor
   `0.99.1` at one glance (0.99.1 line kept as history).
4. **AC4 — Dev hygiene documented.** One command sequence that refreshes the
   package's stale `node_modules` to the lockfile floor without touching
   `bun.lock`, posted as a comment on issue #283.
5. **AC5 — Version discipline.** `package.json` patch bump + `CHANGELOG.md`
   row in the same PR (repo rule: touched package ⇒ same-PR bump + row). No
   `bump-skill` (no `SKILL.md` touched).

### Design closure

- Entity closure: `pi-compat-guard` job (runs the two-leg type-check on every
  PR and push); README Notes (the at-a-glance verified-version record); issue
  #283 comments (the AC1 evidence + AC4 hygiene record); package version +
  changelog row (the same-PR release record). Each names its role; nothing
  else in the unit changes.
- Role closure: PR contributor (sees the red guard with the offending leg
  named), CI runner (executes the job on PR + main + dispatch), package
  consumer (reads the README baseline), issue reader (reproduces AC1/AC4 from
  the posted comments).
- Expectation sweep: a type error in either leg fails the PR; a clean run
  passes both legs; an npm lockfile appearing under `packages/` is rejected by
  `test/lockfile-policy.test.mjs` regardless of the guard; the `latest` leg
  tracking the dist-tag is accepted behaviour (the tripwire), not drift.

### Prior-decisions contradiction sweep

Candidate sources checked 2026-10-07: `docs/workflow/WORKFLOW_INVARIANTS.md`,
`docs/workflow/REPOSITORY_STATE.md` (W001 — pi package, compatible),
`AGENTS.md`, `docs/features/27-pi-agentic-workflow/decisions.md`,
`docs/features/65-doc-toolchain/decisions.md`. No unit-specific decisions.md
exists.

| claim | prior decision | source path | relation |
|---|---|---|---|
| guard installs pi via npm in a temp copy | npm lockfiles are banned under `packages/`; bun.lock is the sole lockfile | AGENTS.md (Packages / lockfile policy) | `compatible` (the guard installs `--no-package-lock` outside the tree and O1 verifies it) |
| same-PR patch bump + changelog row | touched package ⇒ same-PR bump + row | AGENTS.md (Packages / version bumps) | `compatible` (is AC5) |
| one PR for the whole unit | one PR per unit of work, against `main` | AGENTS.md (Working rules) | `compatible` |

## Non-goals

- No `src/` changes — the audit found none required (COMPAT-OK).
- No peer-range change: stays `>=0.99.1` (raising to `>=1.0.0` would needlessly
  drop working 0.99.x support).
- No `skills/` or `template/` changes: the harness/skills sweep found zero
  references to any changed pi surface (stack-agnostic holds).
- Not the place for classifier / virtual-model adoption — that stays on the
  parked JEV-later list (recovery trigger unchanged).
- Independent of #281 (open package bug — fix separately, do not bundle) and
  #274 (pi tool-surface feature — rebase note posted there).

## Future cost

- The guard job's floor leg (`0.99.1`) and the package's peer floor must move
  together — binds whoever bumps the peer range in
  `packages/pi-agentic-workflow/package.json`.
- The `latest` leg tracks the npm `latest` dist-tag by design: a future pi
  breaking release surfaces as a red PR in *this* repo, which is the intended
  tripwire — binds whoever reacts to the red guard.

## Applicable tests

- `bun run test` in `packages/pi-agentic-workflow` (the suite includes
  `test/lockfile-policy.test.mjs`, which refuses an npm lockfile under
  `packages/` — directly relevant to the temp-copy install pattern).
- The new guard's two-leg `tsc --noEmit` run locally (AC2's validator).
- Root suites: `node --test scripts/*.test.mjs`.

## Known pre-existing issues

- Issue #283's AC1/AC3 name pi `1.0.0` (the npm `latest` at audit time,
  2026-10-02); the in-repo re-verification (2026-10-07) resolves `latest` to
  **pi 1.0.4** and is clean there too. Affects the ACs' literals only — the
  README baseline is written from the re-verification (`1.0.4`, 2026-10-07),
  which is the intent of AC3 (a current, at-a-glance baseline).
- Issue #283 states the AC5 bump as `0.18.5 → 0.18.6`; the package is at
  `0.19.0` at execution time (0.19.0 shipped via PR #282 on 2026-10-05).
  Affects AC5's literals only — the patch-bump rule is applied from the actual
  version (`0.19.0 → 0.19.1`).
- Issue #283 states local dev `node_modules` is at 0.85.1; it is already at the
  lockfile floor 0.99.1 (verified 2026-10-07). Does-not-affect: AC4 still
  documents the refresh sequence for the next time it drifts.

## Tasks

- P1 — Write the AC2 guard first as a runnable local script shape (the exact
  two-leg temp-copy `tsc --noEmit` command sequence), then encode it as a
  `pi-compat-guard` job in `.github/workflows/root-suite.yml` (validator:
  local two-leg run exits 0 with both legs' tsc clean).
  - Relevant files: .github/workflows/root-suite.yml
- P2 — Update `packages/pi-agentic-workflow/README.md` Notes (validator:
  `grep -n "Verified against Pi 1.0.0" packages/pi-agentic-workflow/README.md` exits 0).
  - Relevant files: packages/pi-agentic-workflow/README.md
- P3 — Post AC1 evidence + AC4 dev-hygiene comments on issue #283 (validator:
  `gh issue view 283 --json comments` shows both).
  - Relevant files: docs/features/72-pi-100-compat-guard/SPEC.md
- P4 — Version discipline: `package.json` 0.19.0 → 0.19.1 + `CHANGELOG.md` row
  (validator: `node --test scripts/normative-drift.test.mjs` exits 0).
  - Relevant files: packages/pi-agentic-workflow/package.json, CHANGELOG.md
- P5 — Verification: package suite + root suites green on the full diff
  (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0 and
  `node --test scripts/*.test.mjs` exits 0).
  - Relevant files: packages/pi-agentic-workflow/, scripts/

### Planning evidence

| id | claim | source | verified |
|---|---|---|---|
| E1 | Audit temp-copy `tsc --noEmit` against pi 1.0.0 was clean | Issue #283 body (audit evidence, 2026-10-02) | re-run in P1 |
| E2 | `tsc` for this package currently only runs in `publish-pi-package.yml`, against lockfile pi 0.99.1 | `.github/workflows/publish-pi-package.yml`; `packages/pi-agentic-workflow/bun.lock` | 2026-10-07 (read both) |
| E3 | `root-suite.yml` is PR-triggered and already builds the schema package | `.github/workflows/root-suite.yml` | 2026-10-07 (read) |
| E4 | `test/lockfile-policy.test.mjs` fails the suite on an npm lockfile | `packages/pi-agentic-workflow/test/lockfile-policy.test.mjs` | 2026-10-07 (read) |

**Research record (R1):** sources inspected 2026-10-07 — issue #283 body
(audit evidence + ACs), `.github/workflows/root-suite.yml` +
`publish-pi-package.yml` (where tsc runs today),
`packages/pi-agentic-workflow/{package.json,tsconfig.json,bun.lock,README.md}`
(peer floor, compile include, pinned lockfile resolution, stale baseline),
`packages/agentic-workflow-schema/package.json` (dist entry points for the
local-resolution question). Stated uncertainties, closed during P1: whether
npm resolves the package.json deps + pi legs in a bare temp copy with
`--ignore-scripts` (yes — verified by the local run), and which pi-tui version
pairs with each leg (`0.99.1` with the floor, `latest` with latest, matching
the audit's pairing). Evidence row: R1 in Evidence.

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | AGENTS.md (lockfile policy) | No npm lockfile under `packages/` | P1 | P5 | pi-compat-guard job | `test/lockfile-policy.test.mjs` inside package suite | suite output | open |
| O2 | AGENTS.md (same-PR bump) | Touched package ⇒ same-PR version bump + changelog row | P4 | P4 | AC5 | `normative-drift.test.mjs` | suite output | open |
| O3 | Issue #283 AC2 | Guard installs pi outside the lockfile path | P1 | P1 | pi-compat-guard job | two-leg run output | verbatim output | open |

## Evidence

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | inspected issue #283 + both workflows + package manifests/lockfile/README | 0 | surfaces mapped: tsc today runs only in publish flow vs lockfile 0.99.1 | pi (opus, unit-lane) |
| P1 | two-leg temp-copy `tsc --noEmit` (local, exact job commands) | 0 / 0 | leg 0.99.1 clean; leg latest (=pi 1.0.4) clean | pi (opus, unit-lane) |

## Triaged steps

```text
TRIAGE — 72-pi-100-compat-guard (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Skipped: release: small scope
Budget: strong
```

Run 2026-10-07 via `bun scripts/unit-route.mjs --triage 72-pi-100-compat-guard`.
This block is authoritative — the model never re-derives, reorders, or invents
steps.

## Progress log

2026-10-07 17:20 — research+design+plan records written (R1 row, design closure, prior-decisions sweep clean) → commit 220d880d — next: P1 implement
2026-10-07 17:35 — P1: `pi-compat-guard` job encoded in root-suite.yml; two-leg local run green (0.99.1 + latest=1.0.4) → commit @P1@ — next: P2 README baseline
2026-10-07 17:40 — P2: README Notes baseline updated (1.0.4 verified + 0.99.1 floor at one glance) → commit @P2@ — next: P3 issue evidence comments
2026-10-07 17:50 — P3: AC1 re-verification + AC4 hygiene comments posted on #283 → commit @P3@ — next: P4 version bump + changelog
2026-10-07 18:00 — P4: package.json 0.19.0→0.19.1 + CHANGELOG row; normative-drift green → commit @P4@ — next: P5 full verification
2026-10-07 18:20 — P5 (tests step): package suite 426 pass / 0 fail; root suites 648 pass / 0 fail (one red first traced to a stale local schema dist, pre-existing; green after rebuild) → commit @P5@ — next: evidence + review

## Next

## References

- Issue [#283](https://github.com/gtrabanco/agentic-workflow/issues/283) (this PR closes it via `Closes #283`).
- Sequencing precondition: PR [#282](https://github.com/gtrabanco/agentic-workflow/pull/282) merged 2026-10-05 — satisfied.
- Roadmap row 72 in `docs/features/ROADMAP.md`.
