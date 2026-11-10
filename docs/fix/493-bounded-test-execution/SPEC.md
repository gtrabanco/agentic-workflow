---
type: fix
scope: medium
---

# fix/493-bounded-test-execution

> The root gate learns the two execution bounds that actually work against the
> bun runaway class — an external, signal-based suite wall-clock killer and a
> sampled RSS watchdog per suite worker — the per-test budget drops to 10 s with
> an annotated allowlist for the suites that legitimately cost more, and the
> scripted UI harness stops repeating scalar answers forever. Issue #493 takes
> over #476's timeout half; #476's temp-hygiene, /tmp GC and worktree guards
> stay untouched.

## Issue

`#493` — tracked issue in the project's forge. The PR must close it via
`Closes #493` in the body (the commit carries the footer).

## Specs

**S1 — the apply request.**
> "Apply to this repository: issue #493"

**S2 — external wall-clock killer in `run-root-suite.mjs`.**
> "**External wall-clock killer in `run-root-suite.mjs`** — every suite process is spawned under a suite-level wall-clock bound (default ~120 s, `--suite-timeout <s>` to override). Exceeding it is a named, red verdict (`SUITE TIMEOUT`), never a silent pass. Signal-based, so it kills microtask-starved children that timers cannot."

**S3 — RAM watchdog per suite worker.**
> "**RAM watchdog per suite worker** — sample each child's RSS; past a cap (default ~1.5 GB) kill it and report a named red verdict (`SUITE MEMORY CAP`). Alternative weighed: `systemd-run --user -p MemoryMax=…` per worker (cleaner cgroup accounting, harder to keep portable); the sampled-watchdog route needs no new runtime dependency and is the proposed default."

**S4 — 10 s default per-test budget with an annotated allowlist.**
> "**Default per-test budget 10 s with an explicit annotated allowlist** — `--timeout=10000`/`--test-timeout=10000` becomes the default everywhere the 60 s lives today (root gate + both packages' `test` scripts). A suite that legitimately needs more per test (bun→bun spawn overhead, full-history git walks — the reason #476 chose 60 s) must appear in an explicit allowlist file, one entry per suite with the reason and measured cost. A slow test becomes a design flag: split it, mock it, or justify it in writing."

**S5 — anti-loop trap in the scripted harness.**
> "**Anti-loop trap in the scripted harness** — `scriptedUi` throws (`no scripted answer for: <title>`) the moment a scalar answer is consumed a second time or an array runs dry, exactly like the harness's own `take()` already does. This converts the whole hang class into a red failure in milliseconds. Applies to the settings-console harness in `packages/pi-agentic-workflow`; the same contract for any future scripted UI."

**S6 — bounded re-ask in the console (low priority).**
> "**(Product-side, low priority) bounded re-ask in the console** — `openAScope` and the other `for(;;)` loops in `settings/console.ts` could count repeated identical re-asks on the same title and surface a refusal instead of looping. In production an infinite validation re-ask loop is also a UX defect. Cheap; not the load-bearing guard."

**S7 — the acceptance criteria (runnable).**
> "- `bun scripts/run-root-suite.mjs` reports `SUITE TIMEOUT` (red, named verdict) for a suite that sleeps past the suite bound, and `SUITE MEMORY CAP` for one that allocates past the RSS cap — both provable with throwaway fixture suites.
> - With the allowlist empty, `bun scripts/run-root-suite.mjs` and both packages' `bun run test` are green under the 10 s default; every entry added to the allowlist names its reason and measured per-test cost.
> - A unit test pins the harness trap: a scripted UI whose scalar answer is re-asked fails red in < 100 ms, never hangs.
> - The whole suite set survives an injected infinite loop: any suite that hangs is killed by the gate within its bound, on a machine with no operator wrapper present."

**S8 — what the issue does not own.**
> "What this issue deliberately does **not** own: the #427 fixture correction (that lane's blocker), and the operator-side `/tmp` crontab (working, admin domain, out of scope per #476's boundary)."

## Impact

Callers of the changed surfaces: `scripts/local-gate.mjs` and the CI workflow
delegate to `run-root-suite.mjs`, so every gate path inherits the bounds and
the 10 s default with no flag change. Consumers of the package suites: the two
`bun run test` scripts (developer muscle memory — the invocation string stays
identical). The `#427` settings-console suite and any other consumer of
`scriptedUi` now fails red instead of looping when its answer script runs dry
— the #427 F4 fixture is exactly that class and is that lane's merge blocker,
not this unit's. Prose that stops being true: AGENTS.md's runtime-convention
paragraph ("budgets a 60s per-test timeout on the bun leg") is pinned by
`scripts/invocation-drift.mjs` SUITE_CARVE_OUT and both change in the same PR.
The watchdog's RSS sampling reads `/proc`/`ps` on the host running the gate —
CI runners and local machines only; no shared infrastructure.

## Retirements

The 60 s per-test budget as a fixed constant everywhere it lives today:
`scripts/run-root-suite.mjs` (`--timeout=60000` / `--test-timeout=60000`), the
two packages' `test` scripts, and the AGENTS.md sentence the drift pin names.
Replacement: the 10 s default plus `scripts/test-timeout-allowlist.json` (the
annotated allowlist). Negative-capability pin at delivery:
`rg -c '60000' scripts/run-root-suite.mjs packages/*/package.json` → 0.

## Non-goals

- The #427 fixture correction (`passes: { "review-change": … }` → a valid pass
  name): that lane's merge blocker, PE-005. This unit must not touch
  `feat/427`'s fixture or the `loadConfig` validation.
- The operator-side `/tmp` crontab (S8: admin domain, out of scope per #476).
- `systemd-run` cgroup accounting per worker (S3 weighs it and rejects it for
  portability; the sampled watchdog is the declared route).
- Re-running or re-judging any suite's content; the gate's step list is
  untouched — this change wraps execution, it does not reorder it.

## Risk tier

- **`standard`** · **Task Size** — understood, contained risk, resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit
  (re-classified at P7 with the real paths — E11: `tier: standard`,
  `reason_kind: executable-content`, 10 executable paths, no high-risk signals;
  the cut-time verdict was `standard`/`empty-change` on an empty diff)

## Future

- 2026-11-10 — "Alternative weighed: `systemd-run --user -p MemoryMax=…` per
  worker" (S3) — status: discarded 2026-11-10 for this unit (portability); may
  return as its own unit if a cgroup-accounted cap is ever needed.

## Future cost

- The allowlist file `scripts/test-timeout-allowlist.json` is a standing
  obligation: every future suite that exceeds the 10 s default must enter it
  with a reason and a measured cost, or be split. Binds: every unit that adds
  or slows a suite.

## Applicable tests

`scripts/run-root-suite.test.mjs` (new end-to-end verdict cases), the two
packages' suites (the trap pin lives in
`packages/pi-agentic-workflow/test/settings-console.test.mjs`), and
`scripts/invocation-drift.mjs` (re-pinned literals).

## Known pre-existing issues

- `packages/pi-agentic-workflow/test/settings-console.test.mjs` (post-#427
  merge) carries the F4 fixture with an invalid pass name — affects the
  package suite's ability to go green, does-not-affect this unit's guards; it
  is #427's merge blocker (S8) and is expected red here until that lane lands.
- `scripts/ceremony.mjs tier classify` on an empty change fails closed to
  `standard` (`empty-change`) — does-not-affect this unit; re-classified at P7.

## Tasks

- P1 — Cut the unit doc, both planning ledgers and the `## Fixes` row (validator: `bun scripts/unit-route.mjs --triage 493-bounded-test-execution` exits 0)
  (Implements: S1)
- P2 — RED: the frozen-failure corpus — end-to-end `SUITE TIMEOUT` / `SUITE MEMORY CAP` verdict cases against hanging/allocating scratch fixture suites, the allowlist-contract cases, and the harness-trap pin (validator: `bun test scripts/run-root-suite.test.mjs` exits non-zero on the new cases and `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` fails the trap pin, before P3)
  (Implements: S2, S3, S4, S5)
  Relevant files: scripts/run-root-suite.test.mjs, packages/pi-agentic-workflow/test/settings-console.test.mjs
- P3 — GREEN: external wall-clock killer + RSS watchdog in `run-root-suite.mjs` (validator: `bun test scripts/run-root-suite.test.mjs` exits 0)
  (Implements: S2, S3, S7)
  Relevant files: scripts/run-root-suite.mjs
- P4 — 10 s default + `scripts/test-timeout-allowlist.json` + drift pin + AGENTS.md currency (validator: `bun scripts/invocation-drift.mjs` exits 0 and `rg -c '60000' scripts/run-root-suite.mjs packages/pi-agentic-workflow/package.json packages/agentic-workflow-schema/package.json` matches 0)
  (Implements: S4, S7)
  Relevant files: scripts/run-root-suite.mjs, scripts/test-timeout-allowlist.json, scripts/invocation-drift.mjs, AGENTS.md, packages/*/package.json
- P5 — GREEN: the `scriptedUi` anti-loop trap + pin (validator: `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` exits 0 with the trap case under 100 ms)
  (Implements: S5, S7)
  Relevant files: packages/pi-agentic-workflow/test/settings-console.test.mjs
- P6 — Bounded re-ask in the console's `for(;;)` loops (validator: `cd packages/pi-agentic-workflow && bun test test/settings-console.test.mjs` exits 0 with the bounded-re-ask case)
  (Implements: S6)
  Relevant files: packages/pi-agentic-workflow/src/settings/console.ts
- P7 — Differential vs base, injected-loop survival in scratch, allowlist measured costs, full gate, indexes/changeset/LOGS/projection (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)

### Planning evidence

Frozen at cut: this M unit's ledger is
[`planning-evidence.md`](planning-evidence.md) beside this doc (XS/S embeds;
M/L files — never both).

### Obligations

Frozen at cut: this M unit's ledger is
[`planning-obligations.md`](planning-obligations.md) beside this doc.

## Triaged steps

Applied inline at the owner's request (the owner's §4 workflow substitutes for
the lane's triage); the owner's workflow document owns the step list for this
unit. No Relay packet is cut and no self-granted gate exception is issued.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-10, the request, verbatim:
  ```
  Apply to this repository: issue #493
  ```
  (the request's full content is issue #493 verbatim, recorded in the forge;
  its guards and acceptance criteria are quoted unedited in S2–S8 above)
- **L2** — 2026-11-10, context: a prior apply session on
  `feat/493-external-wall-clock-killer` was blocked twice by a concurrent actor
  deleting that worktree; it made no commits and the branch carried no unique
  work, so this unit restarts clean on `fix/493-bounded-test-execution`
  (fast-forwarded to `main` @ `f349d7b5`, which now carries the merged #427).
- **L3** — 2026-11-10, environment incident disclosed: while the ledgers were
  being cut, the worktree at `.git/worktrees/fix/493-bounded-test-execution`
  was deleted twice mid-run by a concurrent actor (it was also re-registered in
  git's worktree list as removed while this session held it as cwd). The
  session restored it each time via the two-step `git worktree add` + `move`
  pattern, salvaged the just-written ledger files through a `/tmp` backup, and
  committed them immediately to make the state durable. No other checkout was
  touched; no content was lost.
- **L4** — 2026-11-10, discovery: guard 4 (the `scriptedUi` anti-loop trap)
  already shipped on `main` — commit `68330216` (the #427 lane) consumes
  scripted scalar answers once and throws on a re-ask, with `repeat(value)` as
  the declared opt-in and a dry array returning `undefined` (the closed-dialog
  escape). This unit pins that shipped contract instead of re-implementing it;
  the first draft of the pin expected the issue's literal dry-array throw and
  was corrected to the shipped refinement before the green run (P lines below).
- **L5** — 2026-11-10, discovery: `scripts/red-first.test.mjs`'s
  shipped-history walk exceeds bun's own 5s standalone default — the failure is
  pre-existing at `f349d7b5` (reproduced on a base checkout), masked until now
  by the gate's 60s budget; it enters the measured allowlist rather than being
  "fixed" by loosening a runner default.
- **E1** — 2026-11-10, `bun test scripts/run-root-suite.test.mjs` (base
  `f349d7b5`, red corpus) · exit 1 · `SyntaxError: Export named 'argvFor' not
  found` — module-absent red, 0 pass / 1 error.
- **E2** — 2026-11-10, `bun test -t "scriptedUi trap"
  test/settings-console.test.mjs` (base, first draft pins) · 2 fail bounded
  (~1 ms each; expectations corrected per L4 before the green run).
- **E3** — 2026-11-10, `bun test -t "validation dead-end"` (pre-implementation,
  stale-dist state) · the case hung until the external `timeout 60` killed the
  runner (exit 124) — the incident class reproduced as the red, bounded only by
  the external killer this unit adds.
- **E4** — 2026-11-10, `bun test scripts/run-root-suite.test.mjs` (head) · exit
  0 · 23 pass; the end-to-end `SUITE TIMEOUT` case completed in 2072 ms and
  `SUITE MEMORY CAP` in 1152 ms. Same suite under `node --test`: 23 pass.
- **E5** — 2026-11-10, differential (scratch `mktemp -d`, base `f349d7b5` vs
  head, same fixture suites): passing suite byte-identical apart from the
  header's declared `· suite bound 120.0s · mem cap 1536 MB`; the hang suite at
  base runs unbounded (external `timeout 8` kills it, exit 124, silent) while
  at head it dies at the 2.0s bound with `FAIL … — SUITE TIMEOUT`, exit 1.
  Nothing undeclared differs.
- **E6** — 2026-11-10, injected-loop survival (scratch, 4 suites, no operator
  wrapper): `node scripts/run-root-suite-head.mjs --suite-timeout 3` → 3
  healthy suites PASS while the injected infinite loop dies at 3.0s with the
  named verdict; exit 1.
- **E7** — 2026-11-10, `timeout 300 bun test --timeout=60000 -t "forge"
  scripts/workflow-status-sensor.test.mjs` · exit 0 · the two timeout-path
  tests measure 10572 ms and 10568 ms — the allowlist's first entry.
- **E8** — 2026-11-10, `rg -c '60000' scripts/run-root-suite.mjs
  packages/pi-agentic-workflow/package.json
  packages/agentic-workflow-schema/package.json` · exit 1 (0 matches).
- **E9** — 2026-11-10, `bun scripts/invocation-drift.mjs` · exit 0 ·
  `verdict: PASS` with the re-pinned tokens; its suite 13 pass under bun and
  node after the compliant-tree fixture superseded with the contract.
- **E10** — 2026-11-10, `bun scripts/check-skill-context.mjs --documents` ·
  exit 0 · `PASS context documents: 4 budgeted documents` after the ceiling
  re-base (643/519/10876 measured, `ceil(measured × 1.10)` → 708/571/11964,
  source named in the manifest).
- **E11** — 2026-11-10, `bun scripts/ceremony.mjs tier classify --base
  f349d7b5` · exit 0 · `tier: standard`, `reason_kind: executable-content`, no
  high-risk signals — recorded under `## Risk tier`.
- **E12** — 2026-11-10, `bun scripts/lint-changeset.mjs` · exit 0 · the new
  `.changeset/493-bounded-test-execution.md` accepted.
- **P1** — 2026-11-10 01:19, unit doc + both ledgers cut and the `## Fixes` row
  registered · `2e5c4129` (re-committed after the L3 worktree wipe; the
  `bun scripts/unit-route.mjs --triage 493-bounded-test-execution` validator
  exits 0).
- **P2** — 2026-11-10, red corpus committed observed red · `3a28bdb2` (E1, E2,
  E3).
- **P3** — 2026-11-10, external wall-clock killer + RSS watchdog · `37323b5e`
  (E4; the end-to-end cases also surfaced and pinned the `NODE_TEST_CONTEXT`
  silent-pass latent bug).
- **P4** — 2026-11-10, 10s default + allowlist + drift pin + AGENTS.md ·
  `99ff71a3` (E8, E9, E10).
- **P5** — 2026-11-10, the trap pinned (shipped already, L4) · `3f222afd`;
  package suite 760 pass / 0 fail.
- **P6** — 2026-11-10, bounded re-ask in `openAScope` · `fb59db75` (E3 red →
  green in ~7 ms; suite 761 pass under bun and node).
- **P7** — 2026-11-10, measured allowlist + projection · the allowlist commit
  (E6, E7); `bun scripts/docs-generate.mjs` re-rendered `docs/generated/units.md`
  by the emitter (1 written, 2 unchanged), `scripts/docs-generate.test.mjs` 22
  pass.
- **G1** — 2026-11-10, `bun scripts/run-root-suite.mjs` (bun leg, bounds armed,
  10s default + measured allowlist, no operator wrapper) · exit 0 · 101/101
  suites PASS, including `workflow-status-sensor` (50.8s) under its measured
  30s budget.
- **G2** — 2026-11-10, `node scripts/run-root-suite.mjs` (the CI shape) · exit
  0 · 101/101 suites PASS.
- **G3** — 2026-11-10, both packages' `bun run test` · exit 0 ·
  `agentic-workflow-schema` 836 pass / `pi-agentic-workflow` 761 pass, both
  under the 10s default.
- **G4** — 2026-11-10, `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 17 step(s) in 166s` (all 17 steps: workspace-install, version-parity, projection, log-immutability, temp-hygiene, tmp-gc, worktree-guard, pins, advisories, schema-build, journal-carrier, pi node-compat, crate suites both runtimes, root-suite, pi-compat-guard, schema node-compat)

## Next

External verification — the owner reads the diff, the ledgers and the evidence
above and delivers the verdict; per the owner's workflow (§8) no gate result
here self-approves the change.

## References

- Issue [#493](https://github.com/gtrabanco/agentic-workflow/issues/493) — the source issue
- Issue [#476](https://github.com/gtrabanco/agentic-workflow/issues/476) — the prior incident; this unit takes over its timeout half
- `docs/workflow/GATE_INVENTORY.md` — which carrier each gate check has

## Branch

`fix/493-bounded-test-execution`

## Depends on

Independent. `#427`'s fixture correction is a parallel lane's blocker (S8);
this unit's package-suite runs tolerate that red fixture as a declared
pre-existing issue.

## Regression scope

- Every suite that passes today keeps passing, and a suite's exit status is
  still forwarded verbatim (named `SUITE TIMEOUT` / `SUITE MEMORY CAP` verdicts
  are the only new failure shapes) — `bun scripts/run-root-suite.mjs` exits 0.
- `--bail`, `--jobs`, subset selection and the gpgsign scrubbing behave
  byte-identically — `bun test scripts/run-root-suite.test.mjs` exits 0.
- The settings-console suite's existing cases keep passing against the trapped
  harness (tests that legitimately script repeated answers do so with
  multi-answer queues, never reliance on repeats) — the package suite's green
  cases stay green.
