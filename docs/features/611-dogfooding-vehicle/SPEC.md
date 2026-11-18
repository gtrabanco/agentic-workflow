---
type: feature
scope: medium
roadmap_summary: Issue [#611](https://github.com/gtrabanco/agentic-workflow/issues/611) (M): `setup-env.mjs` arms `AGENTIC_WORKFLOW_RUNNER` for the authoring checkout, the tool doctor gains a `dogfooding-vehicle` row that reports `unarmed`/`stale`/`ok` with real evidence, and `triage-issue` gains the setup-defect route (runner refusal + the subcommand exists in the tree + stale/unarmed vehicle = a setup state, never a code bug) pinned by a parity test.
---

# 611 — dogfooding-vehicle

> One-line: an authoring session runs this repository's own workflow from the
> working tree, and when it cannot, a doctor row says so as a **setup state**
> instead of a bug report.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

The owner's request is issue [#611](https://github.com/gtrabanco/agentic-workflow/issues/611)
`## In scope`, one requirement per bullet, quoted verbatim. The issue's
`## Acceptance criteria` (`AC1`–`AC6`) are its own list and are quoted in
`## Acceptance criteria` below; they are the criteria, not additional
requirements. The issue's `## Out of scope` bullets are quoted in `## Non-goals`.

**S1 — `setup-env.mjs` arms the vehicle.**
> **`setup-env.mjs` arms the vehicle**: a step (opt-in for contributors without pi, default-on for the authoring environment) that sets/verifies `AGENTIC_WORKFLOW_RUNNER` pointing at the working tree's `packages/agentic-workflow/bin/agentic-workflow.mjs`, with the empty-value unset spelling honoured; `--check` verifies it and reports the resolved `runner resolve` source.

**S2 — a doctor row reports the vehicle's state.**
> **Doctor row `dogfooding-vehicle`** in `tool-inventory@1` (`packages/agentic-workflow/README.md`): compares the installed pi package version against the repo's newest canary tag (and, when armed, the override's target tree) → status `ok` / `stale` (installed behind main's newest canary) / `unarmed` (override never applied — the declared contract whose configuration was not applied, an existing doctor status). Move: `instruct-only` — print the exact arming line and, when stale, the canary cut + `pi install` refresh command. The doctor writes nothing, per its own contract.

**S3 — triage stops classifying a setup state as a code bug.**
> **Triage false-bug route**: `skills/triage-issue` gains the classification rule — *runner refusal + the subcommand/skill exists in the working tree + the installed vehicle is stale/unarmed = setup defect (route to the arming/refresh move), never a code bug*. It cites RUNNER.md and the doctor row; it never restates the override's semantics.

**S4 — the post-merge refresh ritual is written down.**
> **Post-merge refresh ritual**: documented (and, if cheap, surfaced by the unit close-out) — when a merged unit touched `skills/` or `packages/`, the next session's vehicle is stale by construction; the doctor row is what makes that visible, the ritual text says what to do (cut canary + reinstall, or arm the override).

**S5 — documentation currency ships with the unit.**
> **Docs currency**: `docs/workflow/SETUP.md` (the vehicle section), `skills/runner-contract/references/RUNNER.md` (the override section already exists — extend with "the authoring environment arms this by default" pointer to setup-env), GATE_INVENTORY row if a gate carrier is added.

## Acceptance criteria

Frozen at cut. The issue's own list is quoted first (its words, its ids), then
one criterion per `S#` with the check that proves it.

The issue's `## Acceptance criteria`, verbatim:

> - AC1 — Fresh authoring checkout + `node scripts/setup-env.mjs` arms `AGENTIC_WORKFLOW_RUNNER` to the working tree's bin; a subsequent `runner resolve` reports `source: AGENTIC_WORKFLOW_RUNNER`; `--check` verifies it without writing.
> - AC2 — With the vehicle armed, a subcommand merged but not released (reproducer: any current `packages/agentic-workflow` subcommand absent from the installed canary) runs successfully from the working tree in a pi session.
> - AC3 — `agentic-workflow doctor` reports the `dogfooding-vehicle` row: `unarmed` when the override is unset, `stale` when the installed pi package predates main's newest canary tag, `ok` otherwise — each with real evidence (versions, resolved path) and the `instruct-only` move printing the exact commands.
> - AC4 — The triage rule is pinned by a test (`skills/triage-issue` parity/content check): the setup-defect route fires for the runner-refusal+tree-has-subcommand+stale-vehicle shape and never for a genuine missing subcommand in the tree.
> - AC5 — `tool-inventory@1`'s new row has a probe (doctor refuses an undocumented probe and a documented row without one, per its own contract); docs currency shipped in the same unit (SETUP.md + RUNNER.md pointer).
> - AC6 — Consumer coherence untouched: the pin, `normative-drift` and the runner-set parity tests stay green (the vehicle is an environment concern, never a manifest change).

Per requirement:

- **S1** — `bun test scripts/setup-env.test.mjs` exits 0: the arming step writes the working tree's bin, is idempotent, treats an empty exported value as unset, and `--check` reports the resolved source without writing. (AC1)
- **S2** — `bun test packages/agentic-workflow/test/doctor.vehicle.test.mjs` exits 0: `unarmed` when the override is unset, `stale` when the installed package predates the newest canary tag, `ok` when armed, `unreachable` when no canary tag is visible, `not-applicable` outside an authoring checkout — each with its evidence and its `instruct-only` command. (AC3)
- **S3** — `bun test scripts/triage-setup-defect.test.mjs` exits 0: the route fires for the refusal+in-tree+stale/unarmed shape, never for a genuinely missing subcommand, and the prose block cites its owners instead of restating the override. (AC4)
- **S4** — `rg -c 'merged unit touched' docs/workflow/SETUP.md` matches 1: the ritual is documented where the provisioning page lives. (S4)
- **S5** — `bun test scripts/prose-gate-inventory.test.mjs` exits 0 and `rg -c 'setup-env.mjs' skills/runner-contract/references/RUNNER.md` matches 1: the surface registration resolves and the pointer is written. (AC5, AC6)

## Impact

New behaviour, all of it additive and read-only except one gitignored file:

- `scripts/setup-env.mjs` gains the vehicle layer (write `.pi/vehicle.env`, verify it) and its `--check` row.
- `packages/agentic-workflow/src/doctor/vehicle.mjs` (new) owns the vehicle evidence and the setup-state decision; `checks.mjs` gains one row; the crate README gains one documented row.
- `skills/triage-issue/references/ISSUE_PROCESS.md` gains the setup-defect route and its `setup-defect-route@1` block; `scripts/triage-setup-defect.test.mjs` pins it.
- Docs: `docs/workflow/SETUP.md`, `skills/runner-contract/references/RUNNER.md`, the guide's `normative-surfaces@1` and the gate inventory's surface claim.

No manifest, pin or published vocabulary changes: `RUNNER_CANDIDATES`, `runner-pin@1`, `DOCTOR_CHECK_STATUSES`, `INSTALL_ROUTES` and `WIZARD_MOVES` are consumed as they are.

## Surfaces

- `scripts/setup-env.mjs` + `scripts/setup-env.test.mjs`
- `packages/agentic-workflow/src/doctor/vehicle.mjs` (new), `checks.mjs`, `test/doctor.vehicle.test.mjs`
- `packages/agentic-workflow/README.md` (`tool-inventory@1` row)
- `skills/triage-issue/references/ISSUE_PROCESS.md` + `scripts/triage-setup-defect.test.mjs`
- `skills/runner-contract/references/RUNNER.md` (pointer), `docs/workflow/SETUP.md` (vehicle section)
- `AGENTS.md` (`normative-surfaces@1` row), `docs/workflow/GATE_INVENTORY.md` (surface claim)

## Retirements

None — this unit removes no surface. The `guard`-era config keys and the retired
pass/verdict skills are untouched.

## Non-goals

The issue's `## Out of scope`, verbatim:

> - **Linking the CLI globally or changing the pin mechanics** — the exact pin is the consumers' contract (RUNNER.md, #555); a fork-by-link would break skills↔package coherence.
> - **Re-pointing the skills (prose) layer** — an env var cannot re-point prose; the authoring options stay the two documented ones (`.claude/skills` mount, `pi --no-skills --skill`, fix #157). This issue arms only the runner half.
> - **The tool-choice enforcement carrier** — #610 owns it; this issue only guarantees #610's rollout step (cut + reinstall) has a visible, detected vehicle.
> - **Automating the canary cut itself** — `scripts/release.mjs` and the publish workflow own cuts; the ritual is documentation + doctor visibility, not a new cut path.
> - **Spawn-provenance observability** (distinguishing "spawn of the pi package" from "agent invocation" in runner output/journal) — proposed as a comment on #610; this issue takes it only if triage there routes it here.

Owner-routed addition, from the issue's own comment (`#610`'s spawn-provenance
bullet routed to this unit's observability scope): the provenance line stays
open until its consumer exists — this unit ships the detection half (the doctor
row), not a provenance field.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood, contained, resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit

The tier is re-confirmed at P7 with `runner ceremony tier classify` once the diff
exists; a computed `high` answer stops the unit and names its signal.

## Future

None deferred. The issue's open question ("default-on vs opt-in arming") is
decided in `D1` below, not deferred.

## Future cost

- The vehicle file's value names an absolute path, so it is per-checkout by
  construction: a worktree re-runs `setup-env.mjs` (idempotent) instead of
  copying a stale path. Binds every checkout created from this change on.
- `stale` compares against the **local** canary tags: a clone that never fetches
  tags reports `unreachable` and a repair, never a false `ok`. Binds CI-less
  checkouts.

## Applicable tests

- `scripts/setup-env.test.mjs` — the arming, idempotency and `--check` cases (plus every pre-existing case, unchanged).
- `packages/agentic-workflow/test/doctor.vehicle.test.mjs` — evidence, statuses, the setup-state decision table.
- `packages/agentic-workflow/test/doctor.inventory.test.mjs` — the documented row ↔ probe pair.
- `packages/agentic-workflow/test/doctor.checks.test.mjs` — the envelope over a healthy host stays green with the new row.
- `scripts/triage-setup-defect.test.mjs` — the triage route's prose ↔ decision parity.
- `scripts/prose-gate-inventory.test.mjs`, `scripts/normative-drift.test.mjs` — surface registration and pin coherence.

## Known pre-existing issues

- `docs/features/610-shell-tool-choice-enforcement/` is in progress on another
  branch (PR #617). It touches `packages/pi-agentic-workflow/` and the guide's
  gate inventory; this unit touches the guide's `normative-surfaces@1` and the
  same inventory. **Affects** the merge, not this unit's correctness: both blocks
  are edited additively, one row each.
- `docs/LOGS.md` is shared (`.gitattributes` names it). **Affects** the merge
  only; this unit appends through the journal writer.

## Tasks

- P1 — Freeze this unit doc and its planning ledgers (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/611-dogfooding-vehicle/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/features/611-dogfooding-vehicle/SPEC.md, docs/features/611-dogfooding-vehicle/planning-evidence.md, docs/features/611-dogfooding-vehicle/planning-obligations.md
- P2 — RED: the three suites land first and fail on the missing module, the missing row and the missing block (validator: `bun test packages/agentic-workflow/test/doctor.vehicle.test.mjs` exits 1)
  (Implements: S1, S2, S3)
  - Relevant files: packages/agentic-workflow/test/doctor.vehicle.test.mjs, scripts/setup-env.test.mjs, scripts/triage-setup-defect.test.mjs
- P3 — The vehicle module, the doctor row and its documented inventory row (validator: `bun test packages/agentic-workflow/test/doctor.vehicle.test.mjs packages/agentic-workflow/test/doctor.inventory.test.mjs packages/agentic-workflow/test/doctor.checks.test.mjs` exits 0)
  (Implements: S2)
  - Relevant files: packages/agentic-workflow/src/doctor/vehicle.mjs, packages/agentic-workflow/src/doctor/checks.mjs, packages/agentic-workflow/README.md
- P4 — `setup-env.mjs` arms the vehicle and verifies it read-only, consuming the same module (validator: `bun test scripts/setup-env.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: scripts/setup-env.mjs, scripts/setup-env.test.mjs, **/.gitignore
- P5 — The triage setup-defect route and its parity pin (validator: `bun test scripts/triage-setup-defect.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: skills/triage-issue/references/ISSUE_PROCESS.md, scripts/triage-setup-defect.test.mjs
- P6 — Docs currency, the surface registration and the roadmap cell (validator: `bun test scripts/prose-gate-inventory.test.mjs scripts/normative-drift.test.mjs` exits 0)
  (Implements: S4, S5)
  - Relevant files: docs/workflow/SETUP.md, skills/runner-contract/references/RUNNER.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/ROADMAP.md
- P7 — Verification: the crate suite, the root gate and the differential pass (validator: `bun scripts/run-root-suite.mjs` exits 0 and `cd packages/agentic-workflow && bun run test` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/features/611-dogfooding-vehicle/SPEC.md, docs/features/611-dogfooding-vehicle/planning-obligations.md

### Planning evidence

This is an M unit, so the ledger lives in
[planning-evidence.md](planning-evidence.md) — this section names it and never
embeds a second copy.

### Obligations

This is an M unit, so the ledger lives in
[planning-obligations.md](planning-obligations.md) — this section names it and
never embeds a second copy.

## Triaged steps

The owner's local apply order (§5 of the request) substitutes for the lane's plan
step, so the Tasks list above **is** the frozen plan. The router's own step block,
recorded at the cut (`bun packages/agentic-workflow/bin/agentic-workflow.mjs
unit-route --triage docs/features/611-dogfooding-vehicle`):

```text
TRIAGE — 611-dogfooding-vehicle (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the request, verbatim:
  ```
  Apply to this repository: issue #611

  This is a **local, unpublished** workflow for changing agentic-workflow itself. […] Follow this order, every step: […]
  ```
  (The elided spans repeat the standing local apply-order text — the same text
  every unit of this workflow receives; the issue is quoted in full in `## Specs`.)

## Next

P2 — land the three suites RED before any implementation byte.

## References

- Issue [#611](https://github.com/gtrabanco/agentic-workflow/issues/611) — `Closes #611`.
- Route comment from issue #610 (`Spawn provenance` → this unit's observability scope).
- `skills/runner-contract/references/RUNNER.md` (the override), `docs/workflow/SETUP.md` (provisioning), feature 537 (`tool-inventory@1`).
