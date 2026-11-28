## Type

- [x] Feature
- [ ] Fix
- [ ] Chore / docs / infra (no behaviour change)

## Linked issue

Closes #669

---

## Feature PR — delete if this is a fix

### Phase

The unit is delivered whole, applied inline under the owner's local workflow: the
§5 ledger freeze replaced the lane's plan step, and the operator is the external
verifier. Unit doc: [`docs/features/669-deterministic-lane-driver/SPEC.md`](docs/features/669-deterministic-lane-driver/SPEC.md)
(`P1`–`P6` are recorded in its `## Log`).

### Summary

Two pi entry points into one deterministic program, and the program is the
crate's new `flow` subcommand. `flow` senses machine state only — the closed
catalog through `unit-route --triage`, the router's own route, and the unit doc's
`## Tasks`, `## Risk tier` and `## Log` through their one readers — decides the
first pending step, the post-plan stop and the session mode, and hands over one
command with a bounded read set and a turn-contract receipt. `/flow` drives a
unit from wherever it is; `/draft` is the same program stopped after the plan,
always.

### SPEC reference

- SPEC: `docs/features/669-deterministic-lane-driver/SPEC.md`
- Planning evidence: `docs/features/669-deterministic-lane-driver/planning-evidence.md`
- Obligations: `docs/features/669-deterministic-lane-driver/planning-obligations.md` (16 rows, all `verified`)
- Decisions: `docs/features/669-deterministic-lane-driver/decisions.md` (`D1`–`D11`)
- Progress: the unit doc's `## Log` (`P1`–`P6`, `E1`–`E18`, `G1`, `D1`–`D2`)

### Acceptance criteria covered

- [x] `/draft` always halts with the approval block; no path proceeds past it without `/flow`
- [x] `/flow` on an already-planned unit implements directly; `--retriage` is the only path back to planning
- [x] Without `--yes`, a tier-`high` unit halts after plan; with `--yes`, no post-plan stop fires and the override lands as a human-owner `D` row
- [x] The stop-rule surface is a decision-layer seam (v1 fixed defaults, injectable rule set; #708 owns the consumer later)
- [x] The full command completes a unit only through closed-catalog steps; every unknown refuses by name
- [x] Session composition is derived from the recorded verdict and recorded in the unit's decision ledger before execution
- [x] Every turn carries the turn-contract receipt; each judgment step's prompt is bounded (the step's reference + the unit's state pointers)
- [x] Command names, envelope grammar and `normative-surfaces@1` rows land in this change; `normative-drift` and both suites green
- [x] The lifecycle page exists and narrates `/flow`, `/draft` and `/unit-lane`, the review ladder to `MERGE-READY` and the command decision tree, with cross-links

---

## Verification

- [x] Type-check passes (`bunx tsc` in `packages/pi-agentic-workflow`)
- [x] Tests pass — **every suite this change touches is green**; see the honest exceptions below
- [x] Build passes (`bun run --cwd packages/agentic-workflow-schema build`)
- [x] No architecture violations (`vocabulary-residency`, the ledger-ownership map, `normative-surfaces@1` all refuse nothing new)
- [x] No hardcoded secrets
- [x] No hidden user-facing limitations — the whole gate result is quoted in "Notes for the reviewer"
- [x] Repo-mandated rules satisfied: red-first ordering (the suite landed at `62a82bb2b`, the implementation at `cdcfe653b`), conventional commits, one PR against `main`

### The gate, measured

`bun scripts/local-gate.mjs --jobs auto --no-bail` → **exit 1**. Every step `PASS`
except `crate-suite-bun`, whose only red suites are `doc.query` (3 tests) and
`doc.hybrid` (6 tests). Both fail **identically on a `git archive main` copy of
the base commit with the same build** — the embedding provider is absent in this
environment, not a defect of this change. The four steps that depend on
`crate-suite-bun` (`crate-suite-node`, `schema-node-compat`, `pi-node-compat`,
`pi-compat-guard`) were therefore **skipped, not failed**; the two new suites were
run under `node --test` directly to cover the gap.

The same class of pre-existing environment failure is in the pi suite: 1161 pass
/ 6 fail, all six reproduced on `main`.

The `pre-push` hook runs that same offline gate, so this branch is pushed with
the hook's own documented escape hatch (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`)
rather than `--no-verify`. The gate is not skipped on trust: it was run to
completion three times during the work and its one red is reproduced on `main`.

---

## Evidence pack — render, don't re-type

### Human layer — for the approver who did not do the work

- **Asked for:** two entry points into one deterministic program — one command
  completes a unit, one stops after the plan — where the program, not the model,
  decides what comes next.
- **Now you can:** type `/draft <unit>` to have the lane plan a unit and hand you
  an approval block that only `/flow <unit>` continues; type `/flow <unit>` to
  have it hand the model exactly one catalog step at a time, from machine state
  it reads in zero model tokens. A `high`-tier unit stops after its plan unless
  you typed `--yes`, and that override is written into the unit's decision ledger
  so it can be audited.
- **See it yourself:** in a repository that has a unit with a plan, run
  `runner flow <unit>` — it prints the block below and writes nothing. Add
  `--stop-after plan` (what `/draft` sends) and the approval block follows.

```text
FLOW — 669-deterministic-lane-driver
unit: 669-deterministic-lane-driver
unit-type: feature
scope: medium
tier: standard
planned: yes
steps: research, design, plan, implement, tests, evidence, review, docs, release
skipped: none
fused: design + plan (activity-fusion@1)
retriage: no
stop-after: none
stop: none
next-step: implement
next: /execute-phase 669-deterministic-lane-driver P6 (tier: cheap)
session: phase-per-turn
read-set (5):
  docs/features/669-deterministic-lane-driver/SPEC.md
  docs/features/669-deterministic-lane-driver/decisions.md
  docs/features/669-deterministic-lane-driver/planning-evidence.md
  docs/features/669-deterministic-lane-driver/planning-obligations.md
  skills/unit-lane/references/IMPLEMENT.md
receipt: route=execute · step=implement · tier=cheap · continuation=/flow 669-deterministic-lane-driver
fingerprint: 147102e56c984f19b99e549440955bae7d71aa906c99dc087c644e96a2cc465c
```

### Technical layer — for the merge gate

| AC | demonstration (command / capture) | observed |
|---|---|---|
| AC1 `/draft` always halts | `bun test packages/agentic-workflow/test/flow.test.mjs` (explicit-stop cases) + `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs` (`/draft never dispatches a step past the plan`) | exit 0 · 14 pass / 0 fail · 8 pass / 0 fail |
| AC2 the step list is the catalog's | same suite, `the block names the closed catalog's steps and the first pending step` (asserts equality with `unit-route --triage --json`) | exit 0 |
| AC3 planned units implement directly | same suite, `a planned unit implements directly and never re-plans`, `--retriage is the only path back to planning` | exit 0 |
| AC4 the stop is a seam, `--yes` recorded | same suite, the two tier cases and `--yes cancels the tier rule and records a human-owner D row` | exit 0 |
| AC5 composition derived and recorded | same suite, `session composition is derived from the recorded tier and size`, `--record writes the composition into the unit's decision ledger` | exit 0 |
| AC6 the four grammars are declared surfaces | `bun test scripts/normative-drift.test.mjs` | exit 0 · 24 pass / 0 fail |
| AC7 both entries are first-class commands | `bun test packages/pi-agentic-workflow/test/flow-command.test.mjs` | exit 0 · 8 pass / 0 fail |
| AC8 refusals never invent | same crate suite, `an unknown --stop-after value is refused by name`, `an unknown unit is refused and prints no next line` | exit 0 |
| router unchanged | `bun test scripts/unit-route.test.mjs` · `bun test scripts/catalog.test.mjs` | exit 0 · 64 pass · 16 pass |
| CLI surface whole | `bun test packages/agentic-workflow/test/runner.dispatch.test.mjs cli.surface cli.help` | exit 0 · 37 pass / 0 fail |
| differential vs base | `unit-route`, `--triage`, `help unit-route`, `unit-route --help` on a `git archive main` copy | byte-identical stdout / stderr / exit; `help` differs only by the new `flow` row |
| doc state | `bun scripts/check-skill-context.mjs --documents` · `bun scripts/docs-generate.mjs --check` · `agentic-workflow verify docs/features/669-…/SPEC.md` | exit 0 · `PASS 8 budgeted documents` · `verdict: PASS` · `VERIFY PASS` |

### Decisions and resolved ask-gates

- **Decision:** the driver is a crate subcommand, and the two entries are thin pi
  doors over it — so a crate-only host still has the driver, and the pi command
  cannot disagree with it. `unit-route.mjs` now exports `runTriage`,
  `computeRoute` and `projectRoot` instead of the driver keeping a second router.
- **Decision:** no new config key ships (the issue makes config shape an
  owner-interview artifact; v1 reads flags and machine state only).
- **Decision:** the stop rule is an injectable seam (`decideStop(verdict, rules)`)
  so #708's SystemOne consumer supplies its own rules without a grammar break;
  `--yes` cancels the overridable rule only, never an explicit stop.
- **Decision:** both of the driver's writes land in the unit's `decisions.md`,
  never `SPEC.md` — the ledger-ownership map forbids any script writing the unit
  doc. The map's exemption list moved from one script per ledger to a set of
  `(script, ledger)` pairs so the #650 pin and this one coexist.
- **Asked:** which door does the define command open, and does `--yes` resume it?
  → **Answered:** the issue closed both (name `/draft`, "resume-`--yes` is
  redundant"); this PR implements that and adds no resume flag.
- **New contract:** `flow-step-references@1`, `flow-stop-rules@1`,
  `flow-approval@1`, `flow-session-modes@1` — documented in
  [`docs/workflow/LIFECYCLE.md`](docs/workflow/LIFECYCLE.md) and registered in
  `AGENTS.md`'s `normative-surfaces@1` for #708 (the stop-rule consumer) and for
  every later unit that changes how the workflow is used.

## Notes for the reviewer

- **Look first at the seam, not the block.** `decideStop(verdict, rules)` and the
  `FLOW_STOP_RULES_V1` data are what #708 will own; if that shape is wrong it is
  wrong now.
- **Two commits exceed the ~400 authored-line guideline**: `cdcfe653b` (711) and
  `c40fe65ca` (424). A subcommand's surface (dispatch-table pin, usage line,
  README row, help entry) and the pi package's exact-name pins cannot land after
  the module without leaving the tree red between commits, so the slice is the
  floor rather than an artificial split.
- **The gate is red on `main` in this environment** (`doc.query`, `doc.hybrid`,
  and the pi embedding suites). That is why the push used the hook's documented
  escape hatch; the reason is recorded above, and no step was skipped on trust.
- **The correction-batch push (2026-11-28, `4c0a8da02..HEAD`, the external-verify
  B1/B2 batch) also used `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`**: the honest
  push ran the offline gate first and it failed only at `crate-suite-bun`
  (`doc.query`, `doc.hybrid`) — the same two suites measured failing identically
  on a `git archive origin/main` copy in this environment (no embedding
  provider). Every other gate step passed, the full battery ran in the
  foreground (unit `## Log` E23), and `verify@1` answers `ok: true` (E24).
  No step was skipped on trust.
- **The lifecycle page is now doc-currency** for any later unit that changes how
  the workflow is used — that obligation travels with #669 and is recorded as its
  `Future cost`.
- The unit's `pr-body.md` is a trimmable carrier and the retention declaration
  lists it as such.

---

Automated writed using a AI
