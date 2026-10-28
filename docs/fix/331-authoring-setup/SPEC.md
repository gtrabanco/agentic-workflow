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

**S8 — progressive verify-fix-next pipeline (owner amendment, 2026-10-28).**
> Al crear worktrees del repo a veces falla serena por lo que el setup debe verificar si las tools están instaladas, si no lo están instalarlas antes de pasar al siguiente paso. Lo siguiente verificar config y  que esta config está actualizada, si no lo está hacerlo y pasar al siguiente paso. Y así hasta que todo se queda bien instalado

**S2a — bun pinned by its own .bun-version (owner correction of S2's interpretation, 2026-10-28).**
> .node-version para node y .bun-version para bun si es que bun lo soporta

**S2b — bun pin is a minimum (owner correction of S2a's semantics, 2026-10-28).**
> Pinea bun a >=1.4.0

**S10 — fix PE-010, the serena-in-worktree failure (owner amendment, 2026-10-28).**
> Arregla PE-010

**S11 — node and bun are the user's prerequisites; bun is opt-in (owner amendment, 2026-10-28).**
> bun y node fuera, ya el usuario debe instalar una para tener pi y poder desarrollar, lo demás sí está bien. Si el usuario no tiene bun debe preguntar si quiere usar bun ya que preferimos bun por su rendimiento.

**S12 — no setup CI (owner decision, 2026-10-28).**
> cuando acabes, acuerdate de quitar los dos ci de las gha

The owner's operating rule behind S12 (recorded as D8): CI is not created or
modified without explicit permission — GHA minutes and red noise are real
costs; what is not explicitly permitted is asked, never assumed. The
`setup-check.yml` workflow S4 introduced is deleted; `--check` remains a local
verification tool.

**S9 — worktree quick resetup (owner amendment, 2026-10-28).**
> esto permite algo progresivo y rápido y por ejemplo corregir defectos que surgen al, por ejemplo crear un worktree porque entiendo que habrá archivos que viven en el directorio pero están en el gitignore y así al crear un worktree se puede hacer un resetup rápido si es necesario.

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

- **AC1 (S2)** — `node scripts/setup-env.mjs` on a fresh macOS/Linux clone provisions uv, `serena-agent`, `engram` and the `gentle-engram` pi package end-to-end (bun only when the user opted in); a second run performs zero installs; an unresolvable prerequisite (`pi` absent) exits non-zero with a message naming the tool. node/bun are never installed or failed-over by the script (S11). Check: `node --test scripts/setup-env.test.mjs` exits 0 (plan/idempotency/failure tests) + a foreground idempotency run recorded in the unit `## Log`.
- **AC2 (S2)** — `node scripts/setup-env.mjs --check` verifies without installing or writing anything and exits 0 when every required tool is present, 1 when any required one is missing; an absent optional bun (S11) is a `warn` row that never fails the verdict. Check: `node --test scripts/setup-env.test.mjs` exits 0 + foreground `node scripts/setup-env.mjs --check` · exit 0.
- **AC3 (S2)** — `.engram/` is byte-identical after any script run. Check: `node --test scripts/setup-env.test.mjs` — the dedicated guard test hashes `.engram/` before/after a `--check` subprocess run at the repo root and asserts no plan step can ever target `.engram/`, run `engram setup`, or `pi-engram init`.
- **AC4 (S3)** — `node scripts/update-tools.mjs --dry-run` reports current vs latest for `serena-agent` and `gentle-engram` without changing anything. Check: `node --test scripts/update-tools.test.mjs` exits 0 + foreground dry-run recorded in the `## Log`.
- **AC5 (S4 — superseded by S12)** — the `setup-check.yml` CI job was removed by owner decision D8 (CI never without explicit permission); no workflow may run `setup-env`. Check: `node --test scripts/setup-env.test.mjs` (S12 absence assertions) exits 0.
- **AC6 (S1, S5)** — `docs/workflow/SETUP.md` documents every step the scripts automate (each install command verbatim) and README's Setup area links it. Check: `grep -n "docs/workflow/SETUP.md" README.md` exits 0 · ≥1 match; `node --test scripts/setup-env.test.mjs` (doc-coverage assertions) exits 0.
- **AC7 (S3)** — update-tools reuses pin-watch's detection/pin logic (`installedVersion`, `pypiLatest`, `npmLatest`) and upgrades via `uv tool upgrade serena-agent` + `pi install npm:gentle-engram@latest`. Check: `node --test scripts/update-tools.test.mjs` exits 0.
- **AC8 (S6)** — both scripts are `.mjs` entry points run with `node`; no root `package.json` exists. Check: `test ! -e package.json` exits 0; `node --test scripts/setup-env.test.mjs scripts/update-tools.test.mjs` exits 0.
- **AC9 (S7)** — installs go through binaries first (bun.sh installer, astral.sh uv installer, Homebrew tap / GitHub-Releases tarball for engram); `win32` is refused with the WSL note. Check: `node --test scripts/setup-env.test.mjs` exits 0.
- **AC10 (S8)** — the provision run is a progressive verify→fix→next pipeline: tools are installed before the next step runs, a failed step stops the pipeline with the tool named, and the run loops verify→fix (bounded, max 3 passes) until everything verifies or the unfixable rows are reported with exit 1. Check: `node --test scripts/setup-env.test.mjs` exits 0 (pipeline/stop/convergence tests) + the foreground run in the `## Log`.
- **AC11 (S8)** — config verification covers committed state read-only (`.serena/project.yml` non-empty; `.engram/config.json` valid JSON with `project_name` — never rewritten, never initialized) and local gitignored state, which the script creates or rebuilds: `.serena/cache`, `packages/agentic-workflow-schema/dist/` (bun install + build), `packages/pi-agentic-workflow/node_modules`. `--check` reports all of it without writing. Check: `node --test scripts/setup-env.test.mjs` exits 0.
- **AC14 (S10)** — PE-010 is fixed at its reproduced root cause: the machine-local `.serena/project.local.yml` override (markdown deliberately absent — marksman crashes on this machine for lack of libicu, and one failing LS kills the whole manager) is created by setup-env in any checkout that lacks it, so a fresh worktree's serena starts; PE-010's `unknown` evidence row resolves to this reproduction. Check: `node --test scripts/setup-env.test.mjs` exits 0 + the foreground worktree reproduction (`serena project index` succeeding after the fix) recorded in the `## Log`.
- **AC13 (S2a, amended by S2b)** — the repo commits `.bun-version` (1.4.0); setup-env reads it as a **minimum** (S2b): an installed bun ≥ the pin verifies (a newer bun is accepted), bun behind the pin is a MISS row repaired at the pinned version via the official installer's version argument (`| bash -s "bun-v<version>"`); since S11 an **absent** bun installs only on the user's opt-in answer. Check: `node --test scripts/setup-env.test.mjs` exits 0.
- **AC12 (S9)** — the same command run inside a fresh worktree (gitignored local state absent, committed config present) converges to exit 0, so a worktree can be re-setup quickly. Check: `node --test scripts/setup-env.test.mjs` exits 0 (worktree-shaped fixture: committed files present, local state absent).
- **AC15 (S11)** — node is never a verify row or a plan step; a bun-less machine plans zero installs and verifies ok with a `warn` row; the opt-in question is only asked in an interactive terminal, the accepted answers are pinned (`y`/`yes`), and a declined/non-interactive run prints the note naming node as the fallback and the pinned installer; the bun-built local steps (`schema-dist`, `pi-crate-modules`) are skipped — never failed — while bun is absent. Check: `node --test scripts/setup-env.test.mjs` exits 0 (S11 describes).
- **AC16 (S12)** — `.github/workflows/setup-check.yml` does not exist and no workflow under `.github/workflows/` runs `setup-env`. Check: `node --test scripts/setup-env.test.mjs` (S12 describe) exits 0.

## Future

Ideas the user deferred, captured verbatim with a date and a status. Write `none` when nothing was deferred.

- none — 2026-10-28. The issue defers nothing; its out-of-scope list (AGENTS.md split, package changes, Windows-native, init-workspace) is scope exclusion, not deferral.

## Future cost

Standing obligations this fix imposes on future work. Each row: the rule + who it binds.

- `scripts/pin-watch.mjs` exports (`installedVersion`, `pypiLatest`, `npmLatest`) are now a consumed API surface: renaming or reshaping them binds `scripts/update-tools.mjs`. Binds anyone editing pin-watch.
- `SETUP.md` must track any change to the automated steps — a script step changed without its doc row is SPEC drift. Binds future edits to either script.
- The toolchain contract is owner-set (S11): node and bun are the user's prerequisites, bun opt-in. A future change that re-introduces automated node/bun management needs a new owner amendment. Binds future edits to `setup-env.mjs`.

## Applicable tests

- `node --test scripts/setup-env.test.mjs` — one test per requested rule (S2/S4/S6/S7) plus the `.engram/` byte-identity guard.
- `node --test scripts/update-tools.test.mjs` — one test per requested rule (S3) plus the pin-watch reuse proof.
- Full gate: `node --test scripts/*.test.mjs` — proves every existing command sharing changed code keeps its previous behavior (no existing command is modified; the suites are the differential proof).

## Known pre-existing issues

- `engram doctor --json` still warns about ambiguous attribution on this repo (feature 66 `## Known issues`) — does-not-affect: this unit never runs `engram doctor`.
- `node` on the authoring machine is v26 while `.node-version` pins `v24.21.0` — moot for this unit since S11 (the setup script no longer verifies node; CI's `setup-node` reads the file directly).

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
- P9 — RED tests for the progressive pipeline: stepwise stop-on-failure, bounded convergence, config verification (committed read-only, local state rebuilt when missing), worktree-shaped fixture, PATH augmentation after installer runs (validator: `node --test scripts/setup-env.test.mjs` fails RED before P10, exits 0 after)
  (Implements: S8, S9)
  Relevant files: scripts/setup-env.test.mjs
- P10 — Implement the progressive pipeline in `scripts/setup-env.mjs`: config steps (`.serena/cache`, schema dist build, pi-crate modules), verify→fix loop with max 3 passes, PATH augmentation, stop-on-first-failure (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S8, S9)
  Relevant files: scripts/setup-env.mjs
- P11 — Update `docs/workflow/SETUP.md` with the progressive pipeline, the local-state steps and the worktree resetup note, + doc-coverage assertions (validator: `node --test scripts/setup-env.test.mjs` doc-coverage assertions exit 0)
  (Implements: S1, S8, S9)
  Relevant files: docs/workflow/SETUP.md, scripts/setup-env.test.mjs
- P12 — Re-verify the whole unit and close the amended ledger (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S8, S9)
- P13 — RED tests for the bun pin: `.bun-version` read, minimum verification, pinned install/repair command, doc-coverage (validator: `node --test scripts/setup-env.test.mjs` fails RED before P14, exits 0 after)
  (Implements: S2a)
  Relevant files: scripts/setup-env.test.mjs
- P14 — Implement the bun pin in `scripts/setup-env.mjs` + commit `.bun-version` (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S2a)
  Relevant files: scripts/setup-env.mjs, .bun-version
- P15 — Update `docs/workflow/SETUP.md` (`.bun-version` in the tool table and the committed-state list), re-verify and close the amended ledger (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S2a, S1)
  Relevant files: docs/workflow/SETUP.md
- P16 — RED tests for the minimum semantics (S2b): ≥ comparison, behind-row, repair-only-when-behind (validator: `node --test scripts/setup-env.test.mjs` fails RED before P17, exits 0 after)
  (Implements: S2b)
  Relevant files: scripts/setup-env.test.mjs
- P17 — Implement the minimum semantics in `scripts/setup-env.mjs` and amend SETUP.md (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S2b)
  Relevant files: scripts/setup-env.mjs, docs/workflow/SETUP.md
- P18 — Re-verify the whole unit and close the amended ledger (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S2b)
- P19 — RED tests for the S10 override row, including the AC3 guard scanning the write payload (validator: `node --test scripts/setup-env.test.mjs` fails RED before P20, exits 0 after)
  (Implements: S10)
  Relevant files: scripts/setup-env.test.mjs
- P20 — Plan the machine-local `.serena/project.local.yml` override in `scripts/setup-env.mjs`, never overwriting an existing one (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S10)
  Relevant files: scripts/setup-env.mjs
- P21 — Reproduce PE-010 in a fresh worktree and record the fix in `docs/workflow/SETUP.md` (validator: `node scripts/setup-env.mjs` in a fresh `git worktree` exits 0 and the `--check` after it exits 0)
  (Implements: S10)
  Relevant files: docs/workflow/SETUP.md, scripts/setup-env.test.mjs
- P22 — RED tests for the S11 amendment, then implement it: node gone from verify/plan, bun opt-in via interactive question (`parseYesNo`, `bunOptInNote`), warn rows that never fail `--check`, bun-built local steps skipped while bun is absent (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S11)
  Relevant files: scripts/setup-env.mjs, scripts/setup-env.test.mjs
- P23 — Remove `.github/workflows/setup-check.yml` and its suite assertions; add the S12 absence assertions (validator: `node --test scripts/setup-env.test.mjs` exits 0)
  (Implements: S12)
  Relevant files: .github/workflows/setup-check.yml, scripts/setup-env.test.mjs
- P24 — Update `docs/workflow/SETUP.md` (node/bun prerequisites, bun opt-in, warn semantics, CI section removed), re-verify the whole unit and close the amended ledger (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S11, S12)

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
- **G1** — 2026-10-28, `node --test scripts/*.test.mjs` · exit 0 · 1008/1008 pass at P8 (later amended: 1022 after S8/S9, 1030 after S2a, 1040 after S10 — the latest full-gate run is the authoritative one, G5). Includes pin-watch 35/35 — previous behavior holds, S3 differential.
- **G2** — 2026-10-28, `bun scripts/check-skill-context.mjs --routes` · exit 0 · "PASS route budgets: 14 routes".
- **G3** — 2026-10-28, `bun scripts/phase-lint.mjs docs/fix/331-authoring-setup/SPEC.md` · exit 0 · verdict PASS at P8 (fingerprint 4b073c2c…; superseded on every later commit — the current verdict is G6 and it is the one that must hold).
- **G4** — 2026-10-28, `grep -n "docs/workflow/SETUP.md" README.md` · exit 0 · README.md:78; `test ! -e package.json` · exit 0.
- **G5** — 2026-10-28, `node --test scripts/*.test.mjs` · exit 0 · 1045/1045 (full root gate after the review round: 71/71 in the setup-env suite, 10/10 update-tools, pin-watch 35/35 unchanged).
- **G6** — 2026-10-28, `bun scripts/phase-lint.mjs docs/fix/331-authoring-setup/SPEC.md` · exit 0 · verdict PASS, fingerprint 0c04e043… (the S10 requirement is linked from P19–P21; the earlier BLOCKED verdict was the missing link, now closed).
- **V1** — 2026-10-28, external-verification round, four blockers closed: (1) S10 linked from P19–P21 so the declared phase-lint validator passes again (the previous 90f7fe7d commit left `spec-unlinked: S10` and G3's PASS no longer reproduced); (2) `planSetup` fails on a missing `pi` CLI even when the package is already installed — an isolated-HOME run with the package present and no pi now exits 1 naming pi instead of reporting `done`; (3) the engram tarball route names the real release asset (`process.arch` is passed through and `x64` maps to `amd64`) and the unused `fetch` seam is gone; (4) `runProvision` re-probes through `advance` so the loop tests prove ordering, a second-pass convergence and PATH-driven unlocking, and the AC3 guard scans the override write payload. Six of the new tests fail against the pre-fix script and pass here. G5/G6 record the green run.
- **L2** — 2026-10-28, owner amendment, verbatim:
  ```
  Al crear worktrees del repo a veces falla serena por lo que el setup debe verificar si las tools están instaladas, si no lo están instalarlas antes de pasar al siguiente paso.
  Lo siguiente verificar config y  que esta config está actualizada, si no lo está hacerlo y pasar al siguiente paso.
  Y así hasta que todo se queda bien instalado esto permite algo progresivo y rápido y por ejemplo corregir defectos que surgen al, por ejemplo crear un worktree porque entiendo que habrá archivos que viven en el directorio pero están en el gitignore y así al crear un worktree se puede hacer un resetup rápido si es necesario.
  ```
- **D3** — 2026-10-28, owner decision on the §1 single focused question: **"Solo estado local"** — config repair is local-only; the script rebuilds gitignored local state and verifies committed config read-only, never rewrites or regenerates committed config (no `serena init`). Recorded as Q1 in decisions.md; evidence row PE-012.
- **L3** — 2026-10-28, owner correction, verbatim:
  ```
  .node-version para node y .bun-version para bun si es que bun lo soporta
  ```
- **D4** — 2026-10-28, owner decision resolving PE-006: bun is pinned by a committed `.bun-version` (exact match — the convention bun's ecosystem honors, PE-013), symmetric with `.node-version` for node. The S2 interpretation "bun respects `.node-version`" is superseded.
- **L4** — 2026-10-28, owner correction, verbatim:
  ```
  Pinea bun a >=1.4.0
  ```
- **D5** — 2026-10-28, owner decision amending S2a's semantics: `.bun-version` is a **minimum** (bun ≥ pin verifies; only missing-or-behind installs/repairs at the pin), symmetric with node's ≥ rule — the exact-match reading is superseded.
- **L5** — 2026-10-28, owner amendment, verbatim:
  ```
  Arregla PE-010 en PE-009 no lo puedes arreglar hasta que no se arregle con la issue 180 es un error de pin de versiones
  ```
- **D6** — 2026-10-28, owner decision: PE-009 (CI green of setup-check) is **blocked by issue #180** (versioned skills releases — a version-pinning error); the unit does not attempt CI-side fixes. AC5's CI-green clause stays disclosed as blocked-by-#180 until that unit lands; the workflow-file assertions (O11's local validator) remain in force.
- **D7** — 2026-10-28, PE-010 resolution (owner-directed): the root cause is reproduced, not inferred — the machine-local `.serena/project.local.yml` (gitignored, deliberately omitting markdown because marksman crashes on this machine: "Couldn't find a valid ICU package"; one failing LS disables the whole manager) exists only in the main checkout, so every fresh worktree runs the committed project.yml whose `markdown` server kills serena. Fix: setup-env creates the override when missing (local-only authority, PE-012); `serena project init`/rewrite of committed config stays forbidden. Secondary observation (no code): serena logs warn on stale worktree paths in `~/.serena/serena_config.yml` and skips them itself — recorded, out of scope.
- **E8** — 2026-10-28, `node scripts/setup-env.mjs` on this machine · exit 0 · pass 1 repaired bun 1.4.4 → 1.4.0 via the pinned installer (`bash -s "bun-v1.4.0"`), pass 2 clean; `--check` VERDICT: PASS afterwards; `bun --version` → 1.4.0; `bun scripts/check-skill-context.mjs --routes` exit 0 under the pinned bun; `node --test scripts/*.test.mjs` exit 0 · 1030/1030 (56/56 in the setup-env suite); fixture /tmp/setup-env-bunpin: drifted `--check` exit 1 naming the pin, real-installer repair converged in an isolated HOME.
- **E9** — 2026-10-28, `node scripts/setup-env.mjs --check` after S2b · exit 0 · bun row "1.4.4 (≥ .bun-version)" — the machine's newer bun satisfies the minimum, no repair step; 66/66 setup-env tests (minimum semantics: 1.3.9 MISS, 1.4.4 ok).
- **E10** — 2026-10-28, the PE-010 reproduction and fix, foreground: detached worktree `/tmp/serena-wt-probe` → `serena project index` FAILED twice (LanguageServerManagerInitialisationError, markdown LS "stdout read process terminated unexpectedly"; same failure in `agentic-workflow-180`) while the main checkout indexed 306 files cleanly; after `node scripts/setup-env.mjs` wrote `.serena/project.local.yml` (typescript, bash, json, yaml — markdown deliberately absent) the SAME worktree indexed 307 files, exit 0. Root cause: committed project.yml requests marksman, which crashes without libicu, and one failing LS kills the whole manager; only the main checkout's gitignored local override survived. Secondary (no code, D7): serena warns and self-skips stale worktree paths in its global config.
- **P16** — 2026-10-28, S2b RED tests, minimum semantics implemented, SETUP.md amended · 82f4c2a7.
- **P17** — 2026-10-28, bun minimum pin live: no repair planned for 1.4.4 · 82f4c2a7.
- **P18** — 2026-10-28, S2b ledger closed (O21 verified, O20 n/a-superseded) · 82f4c2a7.
- **P19** — 2026-10-28, S10 RED tests (override row, create-never-overwrite, AC3 guard refinement) · 90f7fe7d.
- **P20** — 2026-10-28, override creation implemented in setup-env.mjs · 90f7fe7d.
- **P21** — 2026-10-28, worktree reproduction (E10) + SETUP.md row + ledger closed (23 rows: 21 verified, 1 n/a evidenced, 1 blocked-by-#180 disclosed) · 90f7fe7d.
- **P13** — 2026-10-28, bun-pin RED tests (8) · 82f4c2a7.
- **P14** — 2026-10-28, `.bun-version` (1.4.0) committed + minimum pin implemented in setup-env.mjs · 82f4c2a7.
- **P15** — 2026-10-28, SETUP.md pin rows, whole-unit re-verification, ledger 20/20 verified · 82f4c2a7.
- **E5** — 2026-10-28, live evidence for S9: this workspace is itself a git worktree (`git worktree list` → /home/agent/projects/agentic-workflow-331) and shows the exact shape — committed `.serena/project.yml` present, gitignored `.serena/cache` and `packages/pi-agentic-workflow/node_modules` absent, `dist/` present only because it was built during G1.
- **P1** — 2026-10-28, ledgers frozen (SPEC + evidence + obligations + fix-index row) · 883ea2cd.
- **P2** — 2026-10-28, setup-env RED tests + /tmp fixture validation (bare machine exit 1, all-present exit 0 no-op, unresolvable node exit 1, .engram byte-identical; the fixture caught the missing `os` import the injected-probe suite masked) · c4a03239.
- **P3** — 2026-10-28, setup-env.mjs implemented, 30 tests green · c4a03239.
- **P4** — 2026-10-28, update-tools RED tests then implementation; pin-watch reuse-by-identity pinned; 10 tests green · d9f6bc20.
- **P5** — 2026-10-28, docs/workflow/SETUP.md + doc-coverage assertions · 075d0a25.
- **P6** — 2026-10-28, README Setup-area pointer · 075d0a25.
- **P7** — 2026-10-28, .github/workflows/setup-check.yml + workflow assertions · dfdc2106.
- **P8** — 2026-10-28, whole-unit verification (G1–G4, E1–E4) and the obligations ledger closed (15/15 verified) · 2090ef90.
- **E6** — 2026-10-28, `node scripts/setup-env.mjs` in THIS worktree · exit 0 · pass 1 created `.serena/cache` and installed `packages/pi-agentic-workflow/node_modules` (frozen lockfile), pass 2 verified clean — the S9 quick-resetup run on the live scenario; `--check` exit 0 afterwards; `.engram/` byte-identical (fixture run: /tmp/setup-env-wt worktree-shaped copy — check exit 1 naming serena-cache, provision converged, no-op second run).
- **E7** — 2026-10-28, `node --test scripts/*.test.mjs` · exit 0 · 1022/1022 (48/48 in the setup-env suite); `node scripts/update-tools.mjs --dry-run` · exit 0.
- **P9** — 2026-10-28, amendment RED tests (13 failing before P10) · a4a777da.
- **P10** — 2026-10-28, progressive pipeline implemented (config steps, verify→fix loop max 3 passes, PATH augmentation, stop-on-first-failure) · a4a777da.
- **P11** — 2026-10-28, SETUP.md config-layer + worktree-resetup sections, doc-coverage assertions green · a4a777da.
- **P12** — 2026-10-28, whole-unit re-verification (E6/E7, 1022/1022) and the amended ledger closed (19/19 verified) · a4a777da.
- **L6** — 2026-10-28, owner amendment, verbatim:
  ```
  bun y node fuera, ya el usuario debe instalar una para tener pi y poder desarrollar, lo demás sí está bien. Si el usuario no tiene bun debe preguntar si quiere usar bun ya que preferimos bun por su rendimiento.
  ```
- **L7** — 2026-10-28, owner decision, verbatim:
  ```
  cuando acabes, acuerdate de quitar los dos ci de las gha
  ```
- **D8** — 2026-10-28, owner decision (with its operating rule): the setup CI leg (S4's `setup-check.yml`, macos + ubuntu matrix) is **removed** — CI is never created or modified without explicit permission (GHA minutes and red noise are real costs); what is not explicitly permitted is asked, never assumed. S4/AC5/O11/PE-009 are superseded; `--check` stays as a local verification tool. Recorded in decisions.md.
- **E11** — 2026-10-28, `node scripts/setup-env.mjs --check` after S11 · exit 1 in this worktree only for the S10 override row (created by the provision run that follows); no node row exists; bun present → `ok bun: bun 1.4.0 (≥ .bun-version)`. Non-TTY provision run (`echo | node scripts/setup-env.mjs`) prints no bun question and never installs bun; 76/76 setup-env tests.
- **P22** — 2026-10-28, S11 implemented: node rows removed from verify/plan, bun opt-in question (interactive) with `parseYesNo`/`bunOptInNote`, warn rows never fail the verdict, bun-built local steps skipped while bun is absent.
- **P23** — 2026-10-28, `.github/workflows/setup-check.yml` deleted; suite assertions replaced with the S12 absence assertions (no workflow runs `setup-env`).
- **P24** — 2026-10-28, SETUP.md amended (node/bun user prerequisites, bun opt-in row, warn semantics, CI section removed); ledger amended (O5 n/a, O11 superseded, O2/O21 amended, O23/O24 added) and the whole gate re-run green (E12).
- **E12** — 2026-10-28, `node --test scripts/*.test.mjs` · exit 0 · the full root gate after S11/S12; `bun scripts/phase-lint.mjs docs/fix/331-authoring-setup/SPEC.md` · exit 0 · verdict PASS.
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

PR (branch `feature/331-authoring-repo-setup`, base `main`, `Closes #331`) is the owner's to open and merge. The setup CI leg (S4/AC5/O11/PE-009) was removed by owner decision D8 — nothing CI-side remains in this unit.

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
