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

The stage body is a scripted receipt write, not a model turn: **no provider was
configured in the session that ran this spike**, so the token/turn half of AC7
was out of reach there (see "What was not measured"). Correction 2026-11-09:
the owner's environment does carry a provider — NaN (`@gtrabanco/pi-nan-provider`,
`qwen3.6`) — so this half is reproducible there; the claim "this environment has
no provider" was true only of the spike's session.

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

## Provider-backed measurement (2026-11-09, NaN/qwen3.6 only, owner-ordered)

The first bullet above is now measured. A real lane in scratch (`mktemp -d`,
removed after): 3 stages × 2 `pi -p` model turns each (`--provider nan --model
qwen3.6`, the owner's only authorized model), receipt per stage, tokens read
from the session files pi writes per turn. Four runs:

| run | death point | turns counted | fresh input | cacheRead | totalTokens | redone work |
|---|---|---|---|---|---|---|
| A | none (baseline) | 6 | 38,849 | 67,072 | 105,987 | — |
| A2 | none (baseline repeat) | 6 | 22,094 | 83,840 | 106,000 | — (0.01% vs A) |
| B | mid-stage-2: SIGKILL after its turn-1, before its receipt | 7 | 18,833 | 83,840 | 102,748 | stage-2 redone from turn-1: **+1 turn** |
| B2 | stage boundary: SIGKILL after stage-2's receipt | 6 | 5,319 | 100,608 | 105,993 | **none** — receipts skipped stage-1 and stage-2 |

Findings:

1. **A boundary death costs nothing.** B2's restart re-ran zero turns: the
   receipts are the ground truth the restarted entry reads, exactly P1's
   design.
2. **A mid-stage death costs exactly one extra model turn** — the uncommitted
   stage's redo. The re-sense is the deterministic sensor script: zero tokens.
3. **A stage-commit checkpoint saves none of that.** pi-durable's own spike
   resume also re-executed the uncommitted stage (`per_stage {stage-2: 2}`):
   at stage granularity, P2's checkpoint and P1's receipt restart redo the
   same turn. Saving it would need a mid-stage conversation checkpoint, which
   neither P1 nor the spike's stage-commit checkpoint provides.
4. **Raw token totals are noisy; turn count is the robust metric.** The
   per-turn total (~17.7k) is system-prompt dominated and mostly provider-cached
   (cacheRead ≈ 16.8k of it), and the cache did not survive a restart (the
   redo turn paid fresh input, cacheRead 0). Exact token deltas between runs
   vary more than the crash cost itself.
5. `pi -p --provider nan --model qwen3.6` ran headless and exited 0 on every
   turn (PE-009 is now sampled).

**Evaluation of flip condition 2:** the measured P1 restart cost is bounded at
one stage redo per mid-stage crash and zero at boundaries — the same work a
stage-commit checkpoint would redo. On this number, the cost is **not
material** against adopting an experimental substrate; condition 2 resolves
negative.

## What was not measured

- **Mid-run steering, durable subagents, multi-client inspection.** Read from the
  package's contract and its README; not exercised by this spike.
- **Behaviour under a real unit lane** (LLM stages with multi-turn reasoning
  inside one stage). The measurement above used fixed-reply turns; a stage
  whose turns carry large evolving context could make the redo turn more
  expensive than the fixed-reply bound measured here.
- **Provider cache economics.** cacheRead vs fresh input pricing under NaN was
  not itemized; the measurement reports raw counts.

## Verdict and flip conditions

`REJECT` for this repository's surface. It flips to `ADOPT` when all three hold:

1. the package leaves the experimental banner (or a pinned version is declared
   stable) **and** its release cadence settles;
2. a provider-backed measurement shows P1's restart cost is material on a real
   overnight lane — **taken 2026-11-09 (NaN/qwen3.6, above): condition resolved
   negative** — the restart cost is bounded at one stage redo per mid-stage
   death, zero at boundaries, and a stage-commit checkpoint redoes the same
   turn;
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
