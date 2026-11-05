---
type: feature
scope: small
---

# 100 — parallel-gate-impact-hook

> The root gate's bun leg runs one worker per CPU by default, and the pre-push
> hook skips the test steps when `test-impact` proves the push range changes no
> executable path.

## Specs

**S1 — Root suite in parallel.**
> Ahora que corremos los tests con Bun, se pueden correr los tests en paralelo para que tarden menos en correr todos los tests? Es que tardamos mucho en hacer un push.

**S2 — CI runs parallel through the same script.**
> Modifica el ci root-suite para que también lo haga en paralelo si es que modificando el script no es suficiente.

**S3 — The push hook skips only the test steps when nothing executable changed.**
> También deberíamos evaluar si hay cambios que necesiten tests y si no hay cambios que necesiten test no correr los hooks.

## Impact

- `scripts/run-root-suite.mjs` gains a bounded worker pool; its only in-repo
  consumer is `scripts/local-gate.mjs` (step `root-suite`), which keeps calling
  it with `--bail` — the flag's meaning (first red stops the gate) is unchanged,
  only faster. CI is unaffected at the workflow level: `root-suite.yml` runs
  `node scripts/local-gate.mjs`, which delegates to this script, so the node leg
  (one process per suite) parallelizes through the same pool — no workflow edit
  is needed, and `release-workflows.test.mjs` pins that delegation stays.
- `scripts/local-gate.mjs` gains `--push-base <rev>` and a `tests:` marker on
  the test-bearing steps; the regenerated `pre-push` hook body must be
  reinstalled on every checkout that has the old one
  (`bun scripts/local-gate.mjs --install-hook`).
- `AGENTS.md` §Verification carries the new facts; the
  `scripts/invocation-drift.mjs` suite-carve-out tokens keep their exact wording.
- Measured baseline (2026-11-05, 6 cores): the full bun leg ran 207s
  sequentially and ~124s with a 6-worker per-file pool, all 80 suites green.

## Retirements

Additive change: no surface, token or helper is removed. `rg -c 'run-root-suite'`
still names the same script everywhere; the only reworded prose is the script's
own usage header and the hook body, both owned by this unit.

## Non-goals

- Making any individual suite faster (the `workflow-status-sensor` suite's ~80s
  of subprocess spawns stays; it is a known pre-existing issue below).
- Changing which checks exist, their order, or the remote gate.
- Skipping the whole hook: the cheap offline checks still run on a prose-only
  push (owner decision, S3 clarification).
- Opt-in parallelism: the bun leg is parallel by default (`--jobs 1` restores
  the old shape) (owner decision, S1 clarification).

## Risk tier

Computed with `bun scripts/ceremony.mjs tier classify` (2026-11-05):

- **Tier** — `standard` · **Task Size** — `contained` (`understood`, `resumable_from_diff`, ceremony `unit-doc`, verification `gates`)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

- **2026-11-05, open** — cutting the `workflow-status-sensor` suite's spawn
  count would lower the parallel gate's critical path below its current ~80s
  floor. Not this unit: it is a suite-internal optimization, not a gate shape.

## Future cost

- Every future step added to `scripts/local-gate.mjs` must declare `tests: true`
  when it runs a test suite, or a prose-only push will run it (the skip filter
  reads the marker, not the step's name).

## Applicable tests

- `scripts/run-root-suite.test.mjs` (new — the pool contract)
- `scripts/local-gate.test.mjs` (extended — the `tests:` marker, the verdict
  parser, the `--push-base` dry-run matrix, the hook body)
- `scripts/git-env.test.mjs`, `scripts/invocation-drift.test.mjs`,
  `scripts/risk-tier-ceremony.test.mjs`, `scripts/release-workflows.test.mjs`
  (path-derived impact set of the two changed scripts)

## Known pre-existing issues

- `scripts/workflow-status-sensor.test.mjs` takes ~80s standalone (78
  subprocess-spawning tests) — `does-not-affect` correctness; it caps the
  parallel gate's wall time at that suite's duration.

## Tasks

- P1 — tests first, observed red: the pool contract suite and the local-gate cases (validator: `bun test scripts/run-root-suite.test.mjs scripts/local-gate.test.mjs` exits non-zero before implementation)
  (Implements: S1, S3)
- P2 — the worker pool in `scripts/run-root-suite.mjs` (`--jobs <n>`, default one worker per CPU, `--bail` kills in-flight suites) (validator: `bun scripts/run-root-suite.mjs --bail` exits 0)
  (Implements: S1, S2)
- P3 — `scripts/local-gate.mjs`: `tests:` markers, `--push-base <rev>` running `test-impact`, empty verdict skips the test steps, regenerated hook body (validator: `bun test scripts/local-gate.test.mjs` exits 0)
  (Implements: S2, S3)
- P4 — docs currency: `AGENTS.md` §Verification, both script headers, hook reinstall (validator: `bun scripts/invocation-drift.mjs` exits 0)
  (Implements: S1, S2, S3)
- P5 — verification: the derived impact set green, then the full local gate (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3)

## Triaged steps

```
TRIAGE — 100-parallel-gate-impact-hook (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-05, the request, verbatim:
  ```
  Ahora que corremos los tests con Bun, se pueden correr los tests en paralelo
  para que tarden menos en correr todos los tests? Es que tardamos mucho en
  hacer un push.
  También deberíamos evaluar si hay cambios que necesiten tests y si no hay
  cambios que necesiten test no correr los hooks.
  ```
- **D1** — 2026-11-05, owner decisions via the clarification form: both changes
  in one PR; the CI workflow is edited only if the script change does not cover
  it; on a `test-impact` `empty` verdict the hook skips only the test steps; the
  bun leg is parallel by default.
- **E1** — 2026-11-05, `bun scripts/ceremony.mjs tier classify` · exit 0 ·
  `standard` / `contained`, no signals.

## Next

P1 — write the red tests.

## References

- Roadmap row 100 (`## Features`).
- `scripts/test-impact.mjs` (issue #356) — the impact map the hook consumes.
