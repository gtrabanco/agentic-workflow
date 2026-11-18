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
- Feature 537's unit doc and its roadmap row state "14 documented tool
  surfaces". That is a closed unit's frozen record, not a live claim, and
  `rendered-facts@1` does not pin it. **Does not affect** this unit: the count a
  reader acts on is the inventory block's own (`doctor` refuses a documented row
  without a probe, whichever the number), and this unit adds the fifteenth row
  without editing history. Re-trigger condition: a future unit that needs the
  live count to be prose-visible pins it in `rendered-facts@1` first.

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

- **D1** — 2026-11-18, owner request (S1) read against its own open question: arming is **default-on where `pi` is installed** (the authoring environment) and opt-in elsewhere. A contributor without pi gets the export line in the check output and nothing is written, so the provisioner never guesses at an environment it cannot own. (An agent never applies a decision the owner kept open without recording which way it read.)
- **D2** — 2026-11-18, AC3 is read as three statuses with one precedence, stated once in `evaluateVehicle`: `unarmed` when the override is unset (AC3's own words), `stale` when the override **is** applied but does not reach this checkout's bin (the vehicle in force is a release), `unreachable` when the armed path does not exist, `ok` otherwise. The "installed package predates the newest canary" fact rides the evidence and the advisory in every branch, so the measured defect (574/590/526) stays visible whichever status names it — the row never hides a behind release.
- **D3** — 2026-11-18, the route's outcome vocabulary is `setup-defect | code-bug | unresolved`, never a new triage verdict (the set is closed, `TRIAGE_VERDICTS`): a report whose every symptom the move explains ends as `wontfix`, and a surviving symptom falls through to the ordinary classification unchanged.
- **D4** — 2026-11-18, the arming surface is a **gitignored env fragment plus the documented `source`**, not a config key and not a daemon change: S1 asks for arming, and the issue's own "not a new mechanism" rule forbids re-homing the override's semantics. A session that never sources the file reports `unarmed` — the honest signal, and the reason the doctor row reads the process, not the file.
- **E0** — 2026-11-18, `bun test packages/agentic-workflow/test/doctor.checks.test.mjs packages/agentic-workflow/test/doctor.inventory.test.mjs` · exit 0 · 27 pass (the cut-head baseline, PE-013).
- **E1** — 2026-11-18, the three new suites before any implementation · exit 1 · `Cannot find module '../src/doctor/vehicle.mjs'`, `Export named 'VEHICLE_FILE' not found in module`, and the parity suite failing on the same missing module (the red commit `92d9c161`).
- **E2** — 2026-11-18, `bun test packages/agentic-workflow/test/doctor.vehicle.test.mjs packages/agentic-workflow/test/doctor.inventory.test.mjs packages/agentic-workflow/test/doctor.checks.test.mjs` · exit 0 · 40 pass, 0 fail (cases `F1`–`F4`, `F13`).
- **E3** — 2026-11-18, `bun test scripts/setup-env.test.mjs` · exit 0 · 85 pass, 0 fail (cases `F5`–`F8` plus every pre-existing case).
- **E4** — 2026-11-18, `bun test scripts/triage-setup-defect.test.mjs` · exit 0 · 7 pass, 0 fail (cases `F9`–`F12`).
- **E5** — 2026-11-18, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · 22 pass; `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass (the surface is claimed and its grammar resolves).
- **E6** — 2026-11-18, `bun test scripts/residue-dimensions.test.mjs scripts/guide-split.test.mjs scripts/doc-discipline.test.mjs scripts/invocation-drift.test.mjs` · exit 0 · 79 pass (the new rule name has one owner, the guide did not grow a second copy).
- **E7** — 2026-11-18, `cd packages/agentic-workflow && bun test` · exit 0 · 1318 pass, 0 fail, 72 files.
- **E8** — 2026-11-18, `bun scripts/check-skill-context.mjs` · PASS 30 skills; `bun scripts/check-skill-context.mjs --documents` · PASS 4 budgeted documents (after the declared re-bases recorded in `SKILL_CONTEXT_BUDGETS.json`).
- **E9** — 2026-11-18, `node scripts/setup-env.mjs --check` before arming · exit 1 · `MISS dogfooding-vehicle: AGENTIC_WORKFLOW_RUNNER is not set … (installed 5.0.0-canary.20261118.2, newest canary v5.0.0-canary.20261118.2) — run: export AGENTIC_WORKFLOW_RUNNER='bun /home/agent/projects/agentic-workflow/.worktrees/feat-611-dogfooding-vehicle/packages/agentic-workflow/bin/agentic-workflow.mjs'`.
- **E10** — 2026-11-18, `node scripts/setup-env.mjs` · exit 0 · two steps (`serena-cache`, `dogfooding-vehicle`), then the idempotent re-run line. `.pi/vehicle.env` written; `git status --short` empty (the file is ignored, `#611` explained the file).
- **E11** — 2026-11-18, `. .pi/vehicle.env && bun packages/agentic-workflow/bin/agentic-workflow.mjs runner resolve` · exit 0 · `RUNNER RESOLVED — AGENTIC_WORKFLOW_RUNNER` with `argv: bun /home/agent/…/packages/agentic-workflow/bin/agentic-workflow.mjs` (AC1's second half).
- **E12** — 2026-11-18, `node scripts/setup-env.mjs --check` after arming · exit 0 · `ok dogfooding-vehicle: bun /home/agent/…/agentic-workflow.mjs (source: AGENTIC_WORKFLOW_RUNNER)`, `VERDICT: PASS`.
- **E13** — 2026-11-18, `node scripts/setup-env.mjs --doctor` · exit 0 · `ok dogfooding-vehicle vehicle armed → /home/agent/… · installed 5.0.0-canary.20261118.2 · canary v5.0.0-canary.20261118.2`, `SUMMARY — ok 14 … n/a 1`, `VERDICT: PASS`.
- **E14** — 2026-11-18, the differential (`mktemp -d`, `git archive 2a609bca`, both doctor modules and both setup-env modules observing this checkout) · exit 0 · `DIFFERENTIAL — no unrequested difference`: every pre-existing row, its human line, its summary key and every `--check` row byte-identical; the only addition is the documented row.
- **E15** — 2026-11-18, `bun scripts/version-parity-gate.mjs --content` · exit 1 before the changeset (`GATE REJECTION — shipped-content-version` for both packages) → exit 0 after `.changeset/611-dogfooding-vehicle.md` was added; the gate's alternative route, not a version bump nobody asked for.
- **G1** — 2026-11-18, `bun scripts/local-gate.mjs --jobs 4` · exit 0 · `local-gate: PASS — 19 step(s) in 959s` (root suite, crate suites, both compat legs, budgets, projections, changeset lint).
- **P1** — 2026-11-18, the unit doc and its two ledgers frozen (`a6fd5231`); phase-lint PASS over `P1`–`P7`.
- **P2** — 2026-11-18, the three suites landed red (`92d9c161`), E1.
- **P3** — 2026-11-18, the vehicle module, the doctor row and its documented inventory row (`a842aa6e`), E2.
- **P4** — 2026-11-18, the arming step and the read-only check in `setup-env.mjs` (`a842aa6e`), E3, E9–E12.
- **P5** — 2026-11-18, the triage setup-defect route and its parity pin (`a842aa6e`), E4.
- **P6** — 2026-11-18, the SETUP.md vehicle section, the RUNNER.md pointer, the surface registration and the budget re-bases (`7aa4838b`), E5, E6, E8, E9(ritual).
- **P7** — 2026-11-18, the crate suite, the differential and the local gate (`7aa4838b` + the changeset), E7, E14, E15, G1.

- **E16** — 2026-11-18, `bun scripts/dimension-regression.mjs --base origin/main` · exit 0, verdict `refused` · `missing-reverification-evidence` — the range touches one review surface (`skills/triage-issue/references/ISSUE_PROCESS.md`), which is a route addition, not a dimension change; 17 dimensions at base and 17 at head, none dropped. This line is the re-verification record the finding asks for.
- **E17** — 2026-11-18, `bun scripts/dimension-regression.mjs --base origin/main` after E16 landed · exit 0 · `dimension-regression@1 · base 2dda53f · 17 dimensions · head 17 dimensions · changed review surfaces 1 · evidence: this unit doc · verdict: pass` (no finding).

- **E18** — 2026-11-18, correction of E17 (a Log line is never edited, so this appends): `bun scripts/dimension-regression.mjs --base origin/main` after E16 landed · exit 0 · the observed block is `base | 2dda53f · 17 dimensions` / `head | 17 dimensions · changed review surfaces 1` / `evidence | docs/features/611-dogfooding-vehicle/SPEC.md` / `verdict | clean` — E17's `verdict: pass` was typed before the run; the observed word is `clean`.

## Next

The owner's external verdict on this handoff — the unit doc, the obligation ledger
(13/13 verified) and the diff are the pack; the merge and any published canary cut
are the owner's.

## References

- Issue [#611](https://github.com/gtrabanco/agentic-workflow/issues/611) — `Closes #611`.
- Route comment from issue #610 (`Spawn provenance` → this unit's observability scope).
- `skills/runner-contract/references/RUNNER.md` (the override), `docs/workflow/SETUP.md` (provisioning), feature 537 (`tool-inventory@1`).
