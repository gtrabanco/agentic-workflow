# External verify — 611 dogfooding-vehicle

2026-11-18 · read-only external verify of `feat-611-dogfooding-vehicle` against `origin/main`.
No correction was applied by this run; findings below are routed to `/aw-local-apply`.

```text
EXTERNAL VERIFY — base: 2dda53fe3e7f1834fbb46ad007a044f5e7cddd44 · head: 4c4f1f940766d7d531cea1d77b4ca8da0103905c
Blockers: 1 — B1: the unit's frozen record contradicts the shipped vehicle-status mapping (details below)
Advisories: 1 — A1: the unarmed/stale vehicle row renders its instruction twice (cosmetic, new-row output only)
Sibling sweep: B1's four record spots; otherwise clean (piAgentDir move has no stale importer; no live "14 surfaces" count claims outside the recorded known-issue; changeset and D2 carry the shipped mapping)
Completeness: S1–S5 all resolved to tasks with (Implements: S#) whose validators re-ran green here (85 / 40 / 7 / count-1 / 22+21); AC2's "in a pi session" half is a recorded disposition (PE-011); obligations 13/13 verified, 12 re-run green, O10's validator green but its stated invariant clause does not reproduce (named in B1)
Spot check: node scripts/setup-env.mjs --check (armed shell) → match (ok dogfooding-vehicle: bun <this checkout's bin> (source: AGENTIC_WORKFLOW_RUNNER), VERDICT: PASS, exit 0 — E12; runner resolve also matched E11)
Verdict: NEEDS-DECISION (B1)
```

## B1 — the frozen record contradicts the shipped vehicle-status mapping

Spots (all inside the unit dir, all asserting the superseded AC3 literal mapping):

- `docs/features/611-dogfooding-vehicle/SPEC.md:61` — S2 criterion line: "`unreachable` when no canary tag is visible" and "`stale` when the installed package predates the newest canary tag".
- `docs/features/611-dogfooding-vehicle/SPEC.md:125` — Future cost: "a clone that never fetches tags reports `unreachable` and a repair, never a false `ok`".
- `docs/features/611-dogfooding-vehicle/planning-obligations.md:25` — O10 clause 1: "A checkout that cannot see any canary tag reports `unreachable` with the fetch repair, never a false `ok`" — while the same row's own verified cell cites "`F3`: no canary tag visible → `unarmed` with the fetch repair", contradicting its invariant on one line.
- `docs/features/611-dogfooding-vehicle/planning-evidence.md:23` — PE-012: "`unreachable` is reserved for a clone that cannot answer (no tags)".

Shipped reality (what landed in code, tests, changeset and D2): `unarmed` when the override is unset, `stale` when it is applied but does not reach this checkout's bin, `unreachable` when the armed path does not exist, `ok` otherwise; the installed-behind-canary fact rides the evidence/advisory in every branch. Verified here by probes derived from the AC wording (direct module import from head):

- armed + no local canary tags → status `ok` with the "no canary tag is visible … run `git fetch --tags`" advisory (never `unreachable`);
- unset + no tags → status `unarmed`, instruction `git fetch --tags && export AGENTIC_WORKFLOW_RUNNER='…'`;
- `git tag` failing entirely → still `ok` (armed) with the same advisory;
- the shipped suite pins the same: `doctor.vehicle.test.mjs` F3 asserts `unarmed` for no-tags-visible.

Reproducer: run the doctor row over a checkout whose local tag list is empty (`git tag --list '*canary*'` → empty; reproduced in a `mktemp -d` scratch of head, no network needed) — observed `unarmed`/`ok`-with-advisory, never `unreachable`. Base-vs-head: the row does not exist at base (2dda53fe), so this is not a base regression; the blocker ground is the surviving-mentions rule — the shipped mapping landed in one set of surfaces (code + tests + changeset + D2) while these four record spots kept asserting the superseded truth, and O10 is marked `verified` on evidence that contradicts its own stated outcome.

Smallest action: re-word the four spots to the D2/shipped precedence (`unreachable` = armed path missing; no-tags → `unarmed` with fetch+arm instruction when unset, `ok` with the cannot-compare advisory when armed; installed-behind rides the advisory). Record-side only — no code or test change is needed; the shipped behavior is the honest one. Route: `/aw-local-apply`.

## A1 — instruction rendered twice on the unarmed/stale vehicle row

`packages/agentic-workflow/src/doctor/doctor.mjs:77` (`withCommand` appends "— run: <instruction>" when the advisory does not already embed it) plus `packages/agentic-workflow/src/doctor/doctor.mjs:123` (`renderDoctor` appends "· <instruction>" again): the unarmed/stale vehicle row prints its arming line twice on one line (observed live and in scratch). Advisory because it is the change's own new row output (no base behavior to regress), nothing pins the render, and the `ok` row is unaffected.

## Evidence appendix (command: observed result)

- `bun test scripts/setup-env.test.mjs` → exit 0, 85 pass (E3's tally).
- `bun test packages/agentic-workflow/test/doctor.vehicle.test.mjs` → exit 0, 13 pass; `doctor.inventory.test.mjs` → 6 pass (15 rows ↔ 15 probes); `doctor.checks.test.mjs` → 21 pass (13+6+21 = E2's 40).
- `bun test scripts/triage-setup-defect.test.mjs` → exit 0, 7 pass (E4).
- `bun test scripts/prose-gate-inventory.test.mjs` → 22 pass; `scripts/normative-drift.test.mjs` → 21 pass (E5).
- `bun test packages/agentic-workflow/test/runner.resolve.test.mjs` → exit 0, 17 pass; `git diff --stat 2a609bca -- 'packages/*/package.json'` → empty (O11).
- `rg -c 'merged unit touched' docs/workflow/SETUP.md` → 1; `rg -c 'setup-env.mjs' skills/runner-contract/references/RUNNER.md` → 1 (S4/S5/O9).
- `rg -c 'writeFileSync|mkdirSync|appendFileSync|rmSync|git\(.*config' packages/agentic-workflow/src/doctor/vehicle.mjs` → 0 matches (O5).
- `bun scripts/run-root-suite.mjs --jobs 4` → exit 0, 125/125 suites PASS (clean re-run; a first run's single failure in `scripts/unit-route.test.mjs` "#291 F7" was load noise from this verify's own concurrent scratch work — the suite is untouched by the diff, imports nothing the change touched, and passed quiet and in the clean run; O12 green).
- Scratch (`mktemp -d`, `git archive HEAD`, network unnecessary): arming mode wrote exactly `.pi/vehicle.env` with the documented export line (plus the other provisioning artifacts), second run planned zero vehicle steps (O1 idempotency); `--check` and `--doctor` proven read-only (byte-identical tree checksums before/after) before any live run. No mutation path was executed against the live tree unproven; live `git status` stayed clean throughout.
- Live spot checks: sourced `.pi/vehicle.env` → `runner resolve` answers `RUNNER RESOLVED — AGENTIC_WORKFLOW_RUNNER` with this checkout's bin (E11); `node scripts/setup-env.mjs --check` → `ok dogfooding-vehicle: bun …/bin/agentic-workflow.mjs (source: AGENTIC_WORKFLOW_RUNNER)`, `VERDICT: PASS`, exit 0 (E12, byte-equal row); `--doctor` in an unarmed shell prints the `unarmed` row with installed + canary evidence and the exact arming line (the unarmed counterpart of E13's armed row; row arithmetic sums to 15 in both shapes).
