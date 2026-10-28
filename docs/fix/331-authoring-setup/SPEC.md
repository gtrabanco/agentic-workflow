# fix/331-authoring-setup

## Issue

`#331` — NEW FEATURE: Authoring-repo initial setup — setup doc, setup/update scripts, CI check. The PR closes it via `Closes #331` in the body.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order the
issue states them.

**S1 — Initial setup doc.**
> `docs/workflow/SETUP.md`: prerequisites, per-tool install, what is committed (`.serena/project.yml`, `.engram/`, `.serena/memories/`) vs local state, Windows-via-WSL note.

**S2 — setup-env.mjs bootstrap.**
> `scripts/setup-env.mjs`: idempotent bootstrap — installs bun (respecting `.node-version`) / verifies node, installs `uv` → `serena-agent`, `engram`, and the `gentle-engram` pi package; **never initializes, wipes or rewrites `.engram/`** (it is committed shared state); verifies the committed `.serena/project.yml`; `--check` read-only mode for CI.

**S3 — update-tools.mjs.**
> `scripts/update-tools.mjs`: upgrades `serena-agent` (`uv tool upgrade`) and `gentle-engram` (`pi install npm:gentle-engram@latest`), reporting installed vs published versions — reusing the detection/pin logic of `scripts/pin-watch.mjs` (which already tracks `serena-agent` installed-vs-published drift); `--dry-run` flag.

**S4 — CI check job.**
> CI: a job running `node scripts/setup-env.mjs --check` on macos + linux.

**S5 — README pointer.**
> README pointer from the "Setup" area to `docs/workflow/SETUP.md`.

**S6 — node scripts, two-islands preserved.**
> two **package-manager-agnostic scripts** run with `node` (consistent with the existing node-fallback runtime convention; no root `package.json` is created, preserving the two-islands rule).

**S7 — binaries first, macOS + Linux, WSL-only Windows.**
> Installs happen through **binaries first** so macOS and Linux are supported; Windows is documented as WSL-only, not a supported target.

## Impact

- New files only: `docs/workflow/SETUP.md`, `scripts/setup-env.mjs`, `scripts/update-tools.mjs`, `scripts/setup-env.test.mjs`, `scripts/update-tools.test.mjs`, `.github/workflows/setup-check.yml`, the unit dir. No existing command's code path changes — `update-tools.mjs` imports `scripts/pin-watch.mjs` exports read-only (`installedVersion`, `pypiLatest`, `npmLatest`), so pin-watch behaviour must stay exactly as committed (proven by its existing suite).
- `docs/fix/README.md` gains one Active row while the PR is open.
- `README.md` gains one pointer line under `### Setup`.
- Readers of `docs/LOGS.md`'s `/aw-local-*` pivot note get the documented substitute: one-command provisioning.

## Non-goals

- Splitting `AGENTS.md` (own unit — opened as a separate issue immediately after this one).
- Any change to the two packages' packaging/publishing or a root `package.json`.
- Windows-native support (WSL documented only; `win32` is refused with a message).
- Changes to `init-workspace` (its contract is target projects, not this repo).
- Installing the `pi` CLI itself: the issue scopes the *pi package* install (`gentle-engram`), not the pi binary. A machine without `pi` gets a clear non-zero failure naming the prerequisite (AC1's unresolvable-prerequisite rule).
- Relitigating feature 66's pi-package route (`pi install npm:gentle-engram@latest`, never `engram setup pi`).

## Acceptance criteria

One observable, testable criterion per requirement; the check that proves each is named. This section is the frozen acceptance source (post-feature-61 unit-doc era).

- **AC1 (S2)** — `node scripts/setup-env.mjs` on a fresh macOS/Linux clone provisions bun, uv, `serena-agent`, `engram` and the `gentle-engram` pi package end-to-end; a second run performs zero installs; an unresolvable prerequisite (node absent/behind `.node-version`, `pi` absent) exits non-zero with a message naming the tool. Check: `node --test scripts/setup-env.test.mjs` exits 0 (plan/idempotency/failure tests) + a foreground idempotency run recorded in the unit `## Log`.
- **AC2 (S2)** — `node scripts/setup-env.mjs --check` verifies without installing or writing anything and exits 0 when every tool is present, 1 when any is missing. Check: `node --test scripts/setup-env.test.mjs` exits 0 + foreground `node scripts/setup-env.mjs --check` · exit 0.
- **AC3 (S2)** — `.engram/` is byte-identical after any script run. Check: `node --test scripts/setup-env.test.mjs` — the dedicated guard test hashes `.engram/` before/after a `--check` subprocess run at the repo root and asserts no plan step can ever target `.engram/`, run `engram setup`, or `pi-engram init`.
- **AC4 (S3)** — `node scripts/update-tools.mjs --dry-run` reports current vs latest for `serena-agent` and `gentle-engram` without changing anything. Check: `node --test scripts/update-tools.test.mjs` exits 0 + foreground dry-run recorded in the `## Log`.
- **AC5 (S4)** — `.github/workflows/setup-check.yml` runs on `macos-latest` and `ubuntu-latest`, provisions the runner, then runs `node scripts/setup-env.mjs --check`. Check: `node --test scripts/setup-env.test.mjs` (workflow assertions) exits 0. Actual CI green is observable only after push — disclosed to the external verifier, never claimed locally.
- **AC6 (S1, S5)** — `docs/workflow/SETUP.md` documents every step the scripts automate (each install command verbatim) and README's Setup area links it. Check: `grep -n "docs/workflow/SETUP.md" README.md` exits 0 · ≥1 match; `node --test scripts/setup-env.test.mjs` (doc-coverage assertions) exits 0.
- **AC7 (S3)** — update-tools reuses pin-watch's detection/pin logic (`installedVersion`, `pypiLatest`, `npmLatest`) and upgrades via `uv tool upgrade serena-agent` + `pi install npm:gentle-engram@latest`. Check: `node --test scripts/update-tools.test.mjs` exits 0.
- **AC8 (S6)** — both scripts are `.mjs` entry points run with `node`; no root `package.json` exists. Check: `test ! -e package.json` exits 0; `node --test scripts/setup-env.test.mjs scripts/update-tools.test.mjs` exits 0.
- **AC9 (S7)** — installs go through binaries first (bun.sh installer, astral.sh uv installer, Homebrew tap / GitHub-Releases tarball for engram); `win32` is refused with the WSL note. Check: `node --test scripts/setup-env.test.mjs` exits 0.

## Future

Ideas the user deferred, captured verbatim with a date and a status. Write `none` when nothing was deferred.

- none — 2026-10-28. The issue defers nothing; its out-of-scope list (AGENTS.md split, package changes, Windows-native, init-workspace) is scope exclusion, not deferral.

## Future cost

Standing obligations this fix imposes on future work. Each row: the rule + who it binds.

- `scripts/pin-watch.mjs` exports (`installedVersion`, `pypiLatest`, `npmLatest`) are now a consumed API surface: renaming or reshaping them binds `scripts/update-tools.mjs`. Binds anyone editing pin-watch.
- The CI provision job installs real tools on runners; a broken upstream installer (bun.sh, astral.sh, PyPI, Homebrew tap, GitHub Releases) reddens it through no commit of ours. Binds workflow maintenance.
- `SETUP.md` must track any change to the automated steps — a script step changed without its doc row is SPEC drift. Binds future edits to either script.

## Applicable tests

- `node --test scripts/setup-env.test.mjs` — one test per requested rule (S2/S4/S6/S7) plus the `.engram/` byte-identity guard.
- `node --test scripts/update-tools.test.mjs` — one test per requested rule (S3) plus the pin-watch reuse proof.
- Full gate: `node --test scripts/*.test.mjs` — proves every existing command sharing changed code keeps its previous behavior (no existing command is modified; the suites are the differential proof).

## Known pre-existing issues

- `engram doctor --json` still warns about ambiguous attribution on this repo (feature 66 `## Known issues`) — does-not-affect: this unit never runs `engram doctor`.
- `node` on the authoring machine is v26 while `.node-version` pins `v24.21.0` — affects: the node *verification* rule must tolerate a newer major (documented in SETUP.md), not require exact equality; the CI runner gets v24 from `setup-node` with `node-version-file`.

## Tasks

- P1 — Freeze the planning ledgers: unit doc (this file), `planning-evidence.md`, `planning-obligations.md`; register the row in `docs/fix/README.md` (validator: `bun scripts/phase-lint.mjs docs/fix/331-authoring-setup/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7)
  Relevant files: docs/fix/331-authoring-setup/
- P2 — RED tests for setup-env: plan/idempotency, --check read-only + exit codes, `.engram/` byte-identity guard, `.serena/project.yml` verification, unresolvable-prerequisite failure, win32 refusal, engram install route per platform, CI workflow assertions, doc-coverage assertions (validator: `node --test scripts/setup-env.test.mjs` fails RED before P3, exits 0 after)
  (Implements: S2, S4, S6, S7)
  Relevant files: scripts/setup-env.test.mjs
- P3 — Implement `scripts/setup-env.mjs` (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S2, S6, S7)
  Relevant files: scripts/setup-env.mjs
- P4 — RED tests then implement `scripts/update-tools.mjs` reusing pin-watch detection (validator: `node --test scripts/update-tools.test.mjs` exits 0)
  (Implements: S3, S6)
  Relevant files: scripts/update-tools.test.mjs, scripts/update-tools.mjs
- P5 — Write `docs/workflow/SETUP.md` covering every automated step, committed vs local state, and the WSL note (validator: `node --test scripts/setup-env.test.mjs` doc-coverage assertions exit 0)
  (Implements: S1, S7)
  Relevant files: docs/workflow/SETUP.md
- P6 — Add the README Setup-area pointer to `docs/workflow/SETUP.md` (validator: `grep -n "docs/workflow/SETUP.md" README.md` exits 0)
  (Implements: S5)
  Relevant files: README.md
- P7 — Add `.github/workflows/setup-check.yml` (macos + ubuntu; provision then `node scripts/setup-env.mjs --check`) (validator: `node --test scripts/setup-env.test.mjs` workflow assertions exit 0)
  (Implements: S4)
  Relevant files: .github/workflows/setup-check.yml
- P8 — Whole-unit verification: full root gate + both scripts in the foreground, close the obligations ledger (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S2, S3, S6)

### Planning evidence

M/L unit — the ledger lives in [`planning-evidence.md`](planning-evidence.md) beside this doc; never both.

### Obligations

M/L unit — the ledger lives in [`planning-obligations.md`](planning-obligations.md) beside this doc; never both.

## Findings

OPEN rows only, appended by `review-change` and `triage-issue`.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-10-28, the issue, verbatim:
  ```
- **E1** — 2026-10-28, `node scripts/setup-env.mjs` · exit 0 · twice: "SETUP — everything is already provisioned; nothing to do (idempotent re-run)" both times (AC1 idempotency on the authoring machine).
- **E2** — 2026-10-28, `node scripts/setup-env.mjs --check` · exit 0 · all 8 rows ok (node v26 ≥ 24, bun 1.4.4, uv 0.12.4, serena 2.1.0, engram 3.6.0, pi 1.4.0, gentle-engram 0.4.2, project.yml 10993 bytes).
- **E3** — 2026-10-28, `node scripts/update-tools.mjs --dry-run` · exit 0 · serena-agent 2.1.0/2.1.0 current, gentle-engram 0.4.2/0.4.2 current, nothing changed.
- **E4** — 2026-10-28, `node --test scripts/setup-env.test.mjs` · exit 0 · 34/34, including the `.engram/` byte-identity guard (sha256 before/after a repo-root `--check` subprocess) and the /tmp fixture run that caught the missing `os` import before any real-tree run.
- **G1** — 2026-10-28, `node --test scripts/*.test.mjs` · exit 0 · 1008/1008 pass (full root gate; includes pin-watch 35/35 — previous behavior holds, S3 differential).
- **G2** — 2026-10-28, `bun scripts/check-skill-context.mjs --routes` · exit 0 · "PASS route budgets: 14 routes".
- **G3** — 2026-10-28, `bun scripts/phase-lint.mjs docs/fix/331-authoring-setup/SPEC.md` · exit 0 · verdict PASS, fingerprint 4b073c2c…
- **G4** — 2026-10-28, `grep -n "docs/workflow/SETUP.md" README.md` · exit 0 · README.md:78; `test ! -e package.json` · exit 0.
- **P1** — 2026-10-28, ledgers frozen (SPEC + evidence + obligations + fix-index row) · 883ea2cd.
- **P2** — 2026-10-28, setup-env RED tests + /tmp fixture validation (bare machine exit 1, all-present exit 0 no-op, unresolvable node exit 1, .engram byte-identical; the fixture caught the missing `os` import the injected-probe suite masked) · c4a03239.
- **P3** — 2026-10-28, setup-env.mjs implemented, 30 tests green · c4a03239.
- **P4** — 2026-10-28, update-tools RED tests then implementation; pin-watch reuse-by-identity pinned; 10 tests green · d9f6bc20.
- **P5** — 2026-10-28, docs/workflow/SETUP.md + doc-coverage assertions · 075d0a25.
- **P6** — 2026-10-28, README Setup-area pointer · 075d0a25.
- **P7** — 2026-10-28, .github/workflows/setup-check.yml + workflow assertions · dfdc2106.
- **P8** — 2026-10-28, whole-unit verification (G1–G4, E1–E4) and the obligations ledger closed (15/15 verified) · this commit.
  ## Goal

  A developer (or agent session) that clones this repository has **no documented or automated path** to provision the authoring toolchain. `init-workspace` provisions Serena and Engram for *target projects* (consumers of `template/`); the authoring side never got the counterpart when feature 66 adopted them. Today the prerequisites — bun + `.node-version` (v24), `uv tool install -p 3.13 serena-agent` with the committed `.serena/project.yml`, the `engram` binary plus the `pi install npm:gentle-engram@latest` package, and the opt-in dogfooding symlink (`ln -sfn ../skills .claude/skills`) — are discoverable only by reading logs and AGENTS.md side notes.

  This unit delivers an **initial setup doc** plus two **package-manager-agnostic scripts** run with `node` (consistent with the existing node-fallback runtime convention; no root `package.json` is created, preserving the two-islands rule). Installs happen through **binaries first** so macOS and Linux are supported; Windows is documented as WSL-only, not a supported target.

  ## Business value

  Cuts contributor and agent-session onboarding from "archaeology" to one command; removes the manual drift that motivated the owner-side local tooling (see the `/aw-local-*` pivot in `docs/LOGS.md`); aligns with the workflow's own goal of leaving nothing manual.

  ## In scope

  - `docs/workflow/SETUP.md`: prerequisites, per-tool install, what is committed (`.serena/project.yml`, `.engram/`, `.serena/memories/`) vs local state, Windows-via-WSL note.
  - `scripts/setup-env.mjs`: idempotent bootstrap — installs bun (respecting `.node-version`) / verifies node, installs `uv` → `serena-agent`, `engram`, and the `gentle-engram` pi package; **never initializes, wipes or rewrites `.engram/`** (it is committed shared state); verifies the committed `.serena/project.yml`; `--check` read-only mode for CI.
  - `scripts/update-tools.mjs`: upgrades `serena-agent` (`uv tool upgrade`) and `gentle-engram` (`pi install npm:gentle-engram@latest`), reporting installed vs published versions — reusing the detection/pin logic of `scripts/pin-watch.mjs` (which already tracks `serena-agent` installed-vs-published drift); `--dry-run` flag.
  - CI: a job running `node scripts/setup-env.mjs --check` on macos + linux.
  - README pointer from the "Setup" area to `docs/workflow/SETUP.md`.

  ## Out of scope

  - Splitting `AGENTS.md` (own unit — opened as a separate issue immediately after this one).
  - Any change to the two packages' packaging/publishing or a root `package.json`.
  - Windows-native support (WSL documented only).
  - Changes to `init-workspace` (its contract is target projects, not this repo).

  ## Acceptance criteria

  - Fresh clone on macOS and Linux: `node scripts/setup-env.mjs` provisions the toolchain end-to-end, is idempotent (second run is a no-op), and exits non-zero with a clear message on an unresolvable prerequisite.
  - `node scripts/setup-env.mjs --check` verifies without installing/writing anything and exits 0/1 accordingly.
  - `.engram/` content is byte-identical after any script run (guarded by a test, not prose).
  - `node scripts/update-tools.mjs --dry-run` reports current vs latest for both tools without changing anything.
  - CI runs the `--check` job on macos + linux and is green.
  - `docs/workflow/SETUP.md` covers every step the scripts automate and is linked from README.

  ## Dependencies

  None. Independent of the AGENTS.md split unit.

  ## Open questions / risks

  - `engram` binary install route on a fresh machine (uv tool vs npm global) needs confirming at design time; feature 66 already pinned the *pi package* route to `pi install npm:gentle-engram@latest` — that decision is not relitigated here.
  - CI runners for the `--check` job: full install may need network access to PyPI/npm; the job may need to tolerate degraded mode like the registry-half gates do.
  ```
- **D1** — 2026-10-28, implementer (the issue's first open question, resolved at design time with evidence `planning-evidence.md` PE-001/PE-005): the `engram` binary is neither a uv tool nor an npm package — it is a Go binary distributed via the Homebrew tap `gentleman-programming/tap/engram` (macOS/Linux) and GitHub-Releases tarballs `engram_<version>_<os>_<arch>.tar.gz`. `setup-env.mjs` installs: brew on macOS when Homebrew is present, the release tarball into `~/.local/bin` otherwise.
- **D2** — 2026-10-28, implementer (S4 on a fresh runner): `--check` alone on a pristine runner fails by design (nothing is installed yet), so the CI job **provisions first** (`node scripts/setup-env.mjs`) and then runs the `--check` demanded by S4 as the verification step. The issue's degraded-mode risk is answered the same way the registry-half gates answer it: the job tolerates upstream installer breakage by failing visibly, never by silently skipping.

## Next

Hand the diff to the owner for the external verdict (workflow §7): the PR (branch `feature/331-authoring-repo-setup`, base `main`, `Closes #331`) is the owner's to open/merge; CI green (AC5/PE-009) is observable only after push.

## References

- Issue #331 (the PR closes it via `Closes #331`).
- `docs/features/66-engram-memory-substrate/SPEC.md` — the pi-package route decision (not relitigated).
- `docs/features/67-serena-provisioning/SPEC.md` — the Serena install contract (`uv tool install -p 3.13 serena-agent`).
- `scripts/pin-watch.mjs` — the detection/pin logic S3 reuses.

## Branch

`feature/331-authoring-repo-setup` (pre-created off `main` at `fc79b77f`; one PR per unit, base `main`).

## Depends on

Independent — none.

## Regression scope

- `scripts/pin-watch.mjs` behaviour: unchanged source; its suite (`node --test scripts/pin-watch.test.mjs`) proves the previous behavior still holds after the new import surface exists.
- The root suites (`node --test scripts/*.test.mjs`): green before and after; the only tree changes are new files plus the two doc rows, so any pre-existing green suite staying red is a regression of this unit.
- `.engram/`, `.serena/` committed state: byte-identical after any script run (AC3's guard test).
