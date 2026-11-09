# Pi Durable driver spike — issue #284 P2

**Verdict: `REJECT` (defer), mechanism validated.** Adoption of
`@earendil-works/pi-durable` as this repository's execution substrate is refused
*now*, for the two reasons recorded below plus one it cannot avoid yet: the
package is still explicitly experimental and the cost comparison the issue asks
for needs a provider. The mechanism itself works and is reproducible with the
harness this unit ships, so a future adoption starts from a working shape
instead of a fresh spike. Flip conditions are listed at the end.

- Date: 2026-11-09 · Unit: `docs/fix/284-unattended-durability/` · Issue: #284 (P2)
- Substrate: `@earendil-works/pi-durable@1.5.0` (installed in a scratch dir;
  **not** a dependency of this repository or of the Pi package)
- Harness: `scripts/pi-durable-spike.mjs` + `scripts/pi-durable-spike.test.mjs`
- Runtime: bun 1.4.4, node 26.13 (repo `.node-version`)

## The question

The issue asks whether a **headless driver that implements `sensor → decide →
invoke` as durable tasks** buys more than P1's supervisor restart: turns and
tokens wasted by step-level re-invocation vs checkpoint resume, plus what only a
durable substrate provides (mid-run steering, durable subagents, multi-client
inspection).

## Method

One lane = the conductor's three stages, each stage a durable task:

- the stage's **commit is its receipt** — the task and the lane document that
  records its id land in one transaction, so a committed stage is never created
  twice;
- a ledger line per phase invocation records the pid and the invocation number,
  which is what makes re-execution countable;
- deaths are real `SIGKILL`s of the process, in two places:
  `--kill-after <n>` (after the nth committed stage — the step boundary P1 also
  restarts at) and `--kill-during <stage>` (inside the phase, before its commit);
- a second invocation of the same lane is the resume: `harness.resume()`
  continues what the killed process left, and nothing is re-created.

The stage body is a scripted receipt write, not a model turn: **no provider is
configured in this environment**, so the token/turn half of AC7 is out of reach
here (see "What was not measured").

## Recorded runs

Scratch install and lane commands (`PI_DURABLE_DIR` points at it):

```sh
mkdir /tmp/pdspike && cd /tmp/pdspike && bun add @earendil-works/pi-durable@1.5.0
cd <repo> && PI_DURABLE_DIR=/tmp/pdspike bun scripts/pi-durable-spike.mjs \
  --dir /tmp/pdspike/ev/a --stage stage-1 --stage stage-2 --stage stage-3 --json
```

| Run | Command | Observed |
|---|---|---|
| A — clean lane | 3 stages, no kill | `phases: 3`, `per_stage` each `1`, `reexecuted: []`, `resumed: false`, one pid |
| B — kill at the step boundary | `--kill-after 1`, then the same lane again | attempt 1 **exit 137**; attempt 2 `resumed: true`, `phases: 3`, `per_stage` each `1`, `reexecuted: []`, two pids |
| C — kill inside a phase | `--kill-during stage-2`, then the same lane again | attempt 1 **exit 137**; attempt 2 `resumed: true`, `phases: 4`, `per_stage {stage-1: 1, stage-2: 2, stage-3: 1}`, `reexecuted: ["stage-2"]` |

Reading:

- **Committed work is exactly-once.** A stage that committed is never re-created
  and never re-run (B and C both show `stage-1: 1`).
- **An uncommitted phase is at-least-once.** It re-runs from its top after the
  restart — the documented contract, and the reason a stage body must be
  idempotent or route its effect through the conductor's ground-truth reconcile.
- **The lane survives both death points without a human.** No supervisor script
  and no re-invocation decision were needed: opening the same storage and
  resuming is enough.

## What P1 already buys (the baseline this was measured against)

P1 restarts at the *step* boundary: `advance --resume` preflights the journal,
spawns the sensor, and decides again — two conductor steps re-executed per crash
— inside a **fresh `pi -p` session**, which is where the token cost lives. That
cost is proportional to the session context and was not measurable here. The
durable substrate removes the step re-execution and the session re-creation; it
does not remove the need for a restarter (something must open the storage).

## What only the substrate provides (verified by reading its contract, not run)

- mid-run steering and queued messages against a run that is already going;
- durable subagents (`#260`'s orchestrator shape) that survive the parent's death;
- multi-client inspection of one run (the `#295` panel direction), because the
  state lives in shared storage rather than in one process's memory;
- `requestId` exactly-once submissions — the primitive a restart hint needs.

## Cost

- **92 packages** installed into the scratch tree for `pi-durable@1.5.0` (its
  own dependency closure: `@earendil-works/chord`, `pi-ai`, `pi-schema`,
  `pi-codemode`, `photon`, …) versus zero new dependencies for P1.
- The package README still says: "**Experimental.** The API changes without
  notice between releases." Its own version line moved `1.0.0` → `1.5.0`
  between 2026-10-01 and 2026-10-21.
- A driver on top of it duplicates wiring this repository already owns
  (`scripts/unit-cycle.mjs`, the conductor loop), which is a second reason to
  keep it out of the shipped package.

## What was not measured

- **Tokens and turns wasted by P1's re-invocation.** Needs a configured model
  provider; this environment has none. The structural half is measured (two
  conductor steps per crash), the token half is not.
- **Mid-run steering, durable subagents, multi-client inspection.** Read from the
  package's contract and its README; not exercised by this spike.
- **Behaviour under a real unit lane** (LLM stages). The lane's stage bodies here
  are scripted receipts.

## Verdict and flip conditions

`REJECT` for this repository's surface. It flips to `ADOPT` when all three hold:

1. the package leaves the experimental banner (or a pinned version is declared
   stable) **and** its release cadence settles;
2. a provider-backed measurement shows P1's restart cost is material on a real
   overnight lane (the number this spike could not take);
3. the ownership question the issue records (2026-10-28) is answered: the durable
   driver belongs to a runtime/platform project, and this repository keeps P1.

Until then the harness stays as the reproducible evidence, and `advance --resume`
+ the operator supervisor remain the shipped unattended path.

## Reproduction

```sh
# offline contract (the substrate is optional; the suite skips SP6 without it)
bun test scripts/pi-durable-spike.test.mjs
# the recorded runs, with a scratch substrate
PI_DURABLE_DIR=/tmp/pdspike bun test scripts/pi-durable-spike.test.mjs
```
