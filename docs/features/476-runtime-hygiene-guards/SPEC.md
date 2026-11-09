# 476 — runtime-hygiene-guards

## Objective

The repository stops producing temp-dir leaks and worktree leftovers, and self-heals what it already produced: a static hygiene floor (red push on any leak-capable file), a runtime GC sweep wired into the local gate, a worktree audit with non-destructive repair, and per-test timeout budgets on every runner path — manual invocations included.

## Why

A real incident (2026-11-09) saturated `/tmp` with 494,244 files and ~3,532 leaked fixture directories and blocked pi-web: a `bun test` process hung in uninterruptible sleep at 6.4 GB RAM, and the session daemon locked behind the same disk I/O. Forensics found 14 test files creating temp dirs with zero cleanup capability, suites cleaning only on the happy path, manual invocations bypassing every timeout, and finished sessions leaving worktrees behind — some with severed `.git` links whose git administration bled into the working tree. System-level configuration (quotas, tmpfiles daemons) is the admin's job and stays out of scope; the repository must stop producing the leak and sweep its own.

## User outcome

A developer (or an agent session) can run any test, leave a worktree behind, or get a run killed mid-flight without accumulating junk on the shared machine: every gate run sweeps the machine's temp roots for the repository's own fixture prefixes, a red push names every leak-capable file, corrupted worktrees are repaired with one non-destructive command, and no test can hang a machine for an hour again.

## Acceptance criteria

- AC1 — `node scripts/temp-hygiene.mjs` exits 0 with zero findings on the repaired tree; every scanned file that creates temp dirs carries `rmSync` or `tempRoot` in the same file.
- AC2 — `node scripts/tmp-gc.mjs --dry-run` prints the discovered prefixes and removes nothing; without `--dry-run` it removes only matching entries older than the age bound, never a fresh directory, never a name no source declared, never a filesystem or sources root.
- AC3 — `node scripts/worktree-guard.mjs` exits 0 on a tree whose only worktrees are the primary and live unit branches; `--prune` repairs severed `.git` links with `git worktree repair` (non-destructive), prunes vanished entries, removes clean leftovers, never forces a dirty worktree and never deletes a branch.
- AC4 — `node scripts/local-gate.mjs --list` includes `temp-hygiene`, `tmp-gc` and `worktree-guard` as offline steps; they ride the pre-push offline subset.
- AC5 — every bun test invocation path carries a per-test timeout (root gate 60 s on both legs; the two packages' `test` scripts 60 s), so a hung test dies instead of eating the machine.
- AC6 — the 14 leak-capable suites (10 root scripts, `journal.write`, `session-telemetry`, `telemetry-ledger-sink`, `telemetry-wiring`) create their fixtures through the tracked `tempRoot` helper; `UnitDoc.mjs` carries no dead `mkdtempSync`/`tmpdir` imports.

## Impact

- New gate steps in `scripts/local-gate.mjs` (offline, so they run on every push including prose-only ones) and new rows in `docs/workflow/GATE_INVENTORY.md`.
- New repo-wide convention: temp-dir creation in scanned scopes requires a cleanup capability in the same file — owned by the `temp-hygiene-floor` inventory row, never restated in prose.
- The worktree audit enforces the documented worktree rules against live state: worktrees outside the legal home (`--home`, default `<repo>/.git/worktrees`) are findings, so the current relocated worktrees (`/home/agent/projects/<name>`) fail the gate until they move back inside or the owner amends the rule.
- `git worktree prune` is no longer safe to run blind: a severed `.git` link reads as `prunable` to git, and pruning destroys the repair path — `worktree-guard --prune` repairs before it prunes.

## Non-goals

- No system-level guards (quotas, systemd-tmpfiles, RAM monitors) — the admin's configuration, not the repository's.
- No per-site cleanup proof (pairing every `mkdtemp` with its `rmSync` by AST) — the static check is a floor, not a proof; the GC is the runtime backstop.
- No automatic branch deletion — `worktree-guard --prune` removes worktrees and prints `SUGGEST git branch -D <branch>`; branches are the owner's call.
- No change to the leak prefixes themselves — the GC discovers them from the sources, so adding a fixture never touches this unit.

## Future cost

- Every future gate step added to `scripts/local-gate.mjs` must appear in `DEPS` and in `scripts/local-gate.test.mjs`'s pinned id list — existing cost, unchanged by this unit.
- A fixture prefix the sources declare enters the GC allowlist automatically; a temp dir created outside the scanned scopes (new top-level directory) escapes both the floor and the allowlist until its scope is added to `scopes()`/`discoverPrefixes()`.

## Applicable tests

`scripts/temp-root.test.mjs`, `scripts/temp-hygiene.test.mjs`, `scripts/tmp-gc.test.mjs`, `scripts/worktree-guard.test.mjs` (new, red-first), plus the 14 repaired suites and `scripts/local-gate.test.mjs`.

## Known pre-existing issues

- `packages/pi-agentic-workflow/test/settings-console.test.mjs` cleans up only on its happy path (2 `rmSync` calls for 5 fixture roots) — does-not-affect: its leak class is the one this unit repairs in the other 14 suites, and the GC sweeps whatever it still leaks; its own repair is left to the file owner.
- A concurrent session relocated the live worktrees to `/home/agent/projects/<name>` while this unit ran (the mover also severed worktree `.git` links — the CORRUPTED finding exists because of it) — affects: the `worktree-guard` gate step reports those worktrees as OUTSIDE until they move back inside the legal home or the owner amends the rule.
- Manual `bun test` runs in a worktree without `bun install` fail on missing workspace links — does-not-affect: the local gate's `workspace-install` step owns that precondition.

## Tasks

- P1 — the four suites land red (temp-root contract, temp-hygiene floor, tmp-gc sweep, worktree audit) (validator: `bun test scripts/temp-root.test.mjs` exits 0 after P2)
  (Implements: AC1, AC2, AC3)
- P2 — the implementations: `scripts/temp-root.mjs`, `scripts/temp-hygiene.mjs`, `scripts/tmp-gc.mjs`, `scripts/worktree-guard.mjs` (validator: `bun test scripts/temp-hygiene.test.mjs scripts/tmp-gc.test.mjs scripts/worktree-guard.test.mjs` exits 0)
  (Implements: AC1, AC2, AC3)
- P3 — the 14 leak-capable suites move onto `tempRoot`; `UnitDoc.mjs` drops its dead imports (validator: `node scripts/temp-hygiene.mjs` exits 0)
  (Implements: AC6)
- P4 — the three offline gate steps wired into `scripts/local-gate.mjs` (+ `DEPS`, + the pinned test expectations), timeout flags on both packages' `test` scripts and the root gate's node leg (validator: `node scripts/local-gate.mjs --list` exits 0 listing the three steps)
  (Implements: AC4, AC5)
- P5 — verification: the root gate passes on the branch (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: AC1–AC6)

## Evidence

| task | command | exit | when |
|---|---|---|---|
| P1 | `bun test scripts/temp-root.test.mjs` (+ the other three) | 1 (red, modules missing) | before P2 |
| P2 | `bun test scripts/temp-root.test.mjs scripts/temp-hygiene.test.mjs scripts/tmp-gc.test.mjs scripts/worktree-guard.test.mjs` | 0 | at P2 |
| P3 | `node scripts/temp-hygiene.mjs` | 0 (354 scanned · 108 creating · 0 findings) | at P3 |
| P3 | `bun test` over the 14 repaired suites | 0 | at P3 |
| P4 | `node scripts/local-gate.mjs --list` | 0 | at P4 |
| P5 | `node scripts/run-root-suite.mjs` | 0 | at P5 |
| P6 | `bun scripts/local-gate.mjs --jobs 4` | 0 — PASS, 16 step(s) in 151 s | at close |
| P7 | `bun scripts/local-gate.mjs --jobs 4 --no-bail` (post-merge, 17 steps) | 0 for 16 step(s); `log-immutability` red on `base 9a635063 · range 83 commits`, green on `--base origin/main` — its six violations are commits already published on `main`, none from this unit | at integration |
| P7 | `node scripts/log-immutability.mjs --base origin/main` | 0 — PASS, 0 violations over the 16 commits this branch carries | at integration |
| P7 | `bun scripts/check-skill-context.mjs --documents` | 0 — `GATE_INVENTORY.md` 154 lines / 62 machine / 5,217 est, inside 161 / 5,542 | at integration |

## Progress log

- L1 — request (2026-11-09, verbatim): "necesitamos guards para evitar la creación masiva de archivos temporales sin eliminar al acabar … También necesitamos guards que eliminen worktrees creados para pruebas".
- E1 — P1 red observed: the four suites fail on the missing modules before any implementation exists.
- E2 — P2 green: 5 + 10 + 11 + 12 cases across the four suites.
- E3 — P3: `temp-hygiene` 0 findings on the repaired tree; the 14 repaired suites pass.
- E4 — P4: the three steps listed; `DEPS` closed; timeout flags on both legs of every runner path.
- E5 — P5: the root gate green (see Evidence).
- E6b — close: the full local gate green (16 steps, 151 s) — the three new offline steps ran live: the GC swept the machine roots, the floor found zero leak-capable files, the audit reported the relocated worktrees as report-only OUTSIDE lines.
- E6 — owner correction mid-unit (2026-11-09): the `HEAD`/`gitdir` untracked files inside worktrees are the symptom of a corrupted worktree, not a temp-file class — the guard gains the `CORRUPTED` finding and repairs it with `git worktree repair` (non-destructive), never by pruning; a naive `git worktree prune` on a severed link destroys the recovery path.
- E7 — integration (2026-11-09): `origin/main` moved to `d9a02efc` (units 460, 468, 174, 227 landed) and the PR conflicted on four files. Resolved by merge, never by rebase — the pushed branch tip `9a635063` is published history. The union keeps both step sets (`log-immutability` from main, then `temp-hygiene`/`tmp-gc`/`worktree-guard` from this branch) and the same order in both pinned step-list expectations; the `GATE_INVENTORY` budget keeps both provenance entries, adds the merge entry, and re-pins `machineLines` 59 → 62 (the measured union). The three surfaces main also carried (`scripts/log-immutability.mjs`, the 468 unit docs, its changeset, the `contentFault` export) merged to identical bytes, and the fragments main's aggregator consumed stay consumed.

## Next

Merge gate: the PR carries the unit; flip the roadmap row to `done` at merge.

## References

- Issue [#476](https://github.com/gtrabanco/agentic-workflow/issues/476)
- `docs/workflow/GATE_INVENTORY.md` — the rows `temp-hygiene-floor`, `tmp-gc-sweep`, `worktree-audit`
- `scripts/temp-root.mjs`, `scripts/temp-hygiene.mjs`, `scripts/tmp-gc.mjs`, `scripts/worktree-guard.mjs`
