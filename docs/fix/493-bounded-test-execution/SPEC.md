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
  (verdict at cut on an empty change: `standard`, `empty-change`, fail-closed-upward;
  re-classified with the real paths at P7 and recorded in the Log.)

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

## Next

P2 — the frozen-failure corpus, RED.

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
