---
type: feature
scope: medium
roadmap_summary: Issue [#705](https://github.com/gtrabanco/agentic-workflow/issues/705) (M): the tool doctor gains a `relay` row that reports Relay dispatch capability up front — PI WEB's session marker, the session daemon endpoint pi-web itself resolves, and the `@jmfederico/pi-relay` package with its `relay` + `relay-runner` skills — plus `doctor --check <id>` to read one row, and the lane's degradation prose and `init-workspace`'s interview cite that row instead of re-deriving presence.
ac-hash: 152edac2c4d2b7f8c999f41b53aa92d6e9b8e723663fd2ea88649ff5aa195f40
---

# 705 — relay-doctor-check

> One-line: Relay dispatch capability becomes a doctor check the operator can read
> before planning a leg — the generic half the crate can observe, with the
> session-level bridge named honestly as its owner's question.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
```

## Issue

`#705` — tracked issue in the project's forge, labelled `feature` + `promoted`
(triage verdict: promoted to a feature SPEC). This unit's PR closes it via
`Closes #705`.

The issue carries a **scope decision from a joint analysis (2026-11-24)** that
this unit's planning adopts as `S7`: the issue's own delimitation rule splits
the three probes into a generic half (crate-observable) and a pi-specific half
(the extension's). The acceptance criteria written before that decision
(`S6`) are read through it — `S6` is quoted verbatim and never rewritten; the
reading is frozen in `## Acceptance criteria` and recorded as `D2`.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. `S1` is the operator's order; `S2`–`S8` quote the
issue's own words, which that order adopts as the work.

**S1 — the order: apply #705 to this repository, inline.**
> Apply to this repository: issue #705

**S2 — the goal: report Relay dispatch capability as a first-class doctor check.**
> Make the tool-doctor check and report **Relay dispatch capability** as a first-class doctor check: whether the session can actually chain Relay legs (`pi-web` present, the `pi-web:session-dispatch:v1` session-dispatch bridge resolvable, and `@jmfederico/pi-relay`'s `relay`+`relay-runner` skills loaded). Today the lane discovers this only at hand-off time — when the `dispatch_relay` extension emits the bridge event into an absent listener or the degradation prose falls back to the per-phase route — instead of the operator knowing up front.
>
> This is deliberately **not** an auto-install feature. `@jmfederico/pi-relay` is not published on npm (its manifest is `private: true`; it ships embedded inside the pi-web distribution), and installing it alone without pi-web is useless: `prepareRelayDispatch` works, but `dispatch_relay` requires PI WEB's session dispatch bridge and fails before dispatching with `Relay dispatch requires PI WEB's session dispatch bridge … no session was dispatched`. The check therefore verifies the whole capability, never one half of it.

**S3 — the business value: transparency, low support, no doomed installs.**
> - **Transparency:** the operator sees Relay availability (or its degradation route) before planning work that may want legs, not at the first failed hand-off.
> - **Low-support:** no silent dead-end — the doctor names exactly what is missing (pi-web absent, bridge unreachable, package not loaded) and states the documented degradation (`→ Next: /execute-phase <NN> P<k>` per phase), which the lane already owns in `skills/unit-lane/references/RELAY.md` §Degradation.
> - **No doomed installs:** prevents any future temptation to "install pi-relay" into a pi-without-pi-web setup where it cannot dispatch; the doctor says why `instruct-only` is the correct route for that package if it is ever missing while pi-web is present.

**S4 — in scope.**
> - A new doctor check (entry in the doctor inventory, `packages/agentic-workflow/src/doctor/checks.mjs` + its envelope fields) reporting Relay dispatch capability with a closed result set consistent with `DOCTOR_CHECK_STATUSES`.
> - Probing, in order: (1) pi-web session context (`PI_WEB_SESSION` / sessiond presence), (2) the session-dispatch bridge resolvable through the host protocol the extension documents, (3) `relay` + `relay-runner` skills discoverable in the loaded skill set.
> - Each failure names its actionable cause: pi-web absent → degradation is the by-design route; package missing under pi-web → the embedded package path/install guidance.
> - Relay availability correlated into the surfaces that consult it: `init-workspace`'s provisioning interview and the lane's relay routing prose cite the doctor check instead of re-deriving presence ad hoc.
> - The check is offline-safe (never dispatches anything, never spawns a session to probe).
> - Documentation: doctor README block (`tool-inventory@1` / `tool-doctor-envelope@1` consumers), the doctor inventory owner doc row it lands under.

**S5 — out of scope.**
> - No auto-install of `@jmfederico/pi-relay` or of pi-web — owner decision recorded 2026-12 (session thread): the package is embedded in pi-web and dispatch is bridge-gated, so an install adds the unusable half.
> - No change to the relay packet format, `dispatch_relay` semantics, or `RELAY.md`'s ownership/`Forbidden` sections (they keep pi-relay as their owner for prose and method).
> - No pre-/auto-approval of relay dispatch (the human "Approve and dispatch" bootstrap stays untouched; the `/flow` session-composition question is issue #669's).
> - No doctor check for the relay *packet checker* (`runner relay check <unit>`) — that already exists and is lane-time by design.

**S6 — the acceptance criteria as written in the issue (read through `S7`).**
> - [ ] `agentic-workflow doctor --check relay` (both `runner relay`-equivalent entry points) reports one of the closed statuses with its cause and, on absence, the documented degradation route — verifyable in all three observed environments: pi-web present (capability reported), pi without pi-web (absence named + per-phase fallback stated), pi-web present but bridge unreachable.
> - [ ] The check never dispatches a session, never spawns a relay leg, and works offline.
> - [ ] `init-workspace`'s interview surfaces the doctor's relay result instead of its own ad-hoc pi-web detection.
> - [ ] The `Forbidden` rule "never dispatch without human approval" is untouched — the check reports capability, it does not alter consent.
> - [ ] Root gate green under both runtimes; schema package rebuilt if any vocabulary moved.

**S7 — the scope decision that reads `S6`: generic vs pi-specific, probe by probe.**
> Reviewed against the repo's own doctor delimitation rule (`docs/research/2026-11-13-tool-doctor-inventory.md`): *generic = everything observable without a live agent session; pi-specific = everything depending on session semantics — the generic doctor detects the symptom, the domain owner interprets the context.*
>
> | Probe | Layer | Verdict |
> |---|---|---|
> | pi-web session context | generic | in scope — the crate already carries the resolution precedent: `piWebPresent()` (`src/runner/unit-route.mjs:555`, `PI_WEB_SESSION === "1"`) and the bridge refusal constant `RELAY_BRIDGE` (:550); the check reuses that resolution rather than re-deriving it (IR11) |
> | session-dispatch bridge resolvable | pi-specific | **re-scoped out of the crate check** — the bridge is a session event (`pi-web:session-dispatch:v1`) emitted by the host's `dispatch_relay` tool; a bash-invoked crate check cannot observe a live session's listeners. The generic check reports the environment proxies and names the session-level question as the extension's domain — the same generic/pi-specific split the engram incident precedent drew (binary-vs-served = generic; ownership mismatch = extension-only) |
> | relay + relay-runner skills | installed = generic; loaded = pi-specific | in scope as the **installed** set: `@jmfederico/pi-relay` present in pi's installed-packages tree is disk-observable (the doctor inventory's row-10 precedent: `~/.pi/agent` context and installed npm packages are generic). Whether a skill is *loaded in this session* is session state and stays out of the crate check, named as such |
>
> The acceptance criteria above predate this decision; the unit's planning phase revises them to the split — the crate check answers the generic layer, and "pi-web present but bridge unreachable" becomes the degraded row of the env-level report (the check names the session-level uncertainty honestly) rather than a fact the crate claims to probe.

**S8 — the open questions and risks the issue itself names.**
> - The bridge's host protocol is emitted as an event (`pi-web:session-dispatch:v1`) — the check must decide how to probe it without performing a dispatch (a no-op probe vs. trusting environmental signals like `PI_WEB_SESSION` and the sessiond socket). Triage/design decides with evidence.
> - Whether a missing Relay capability for a `runner relay tiers`-planned unit belongs in the lane's triage output as a routed fact or stays doctor-only.
> - pi-web version-shape drift: the bridge protocol is versioned (`v1`) and undocumented-on-purpose as a host contract; the check should report a stale-bridge gracefully rather than guess across versions.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the order is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits and `rg -n 'review-change|audit-pr|fold-findings' docs/features/705-relay-doctor-check/` matches no run record: no review pack, no fold cycle, no self-granted gate exception.
2. **S2, S4 — the doctor reports Relay capability as one documented row with one closed status.** `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0 with the case `the relay row answers one published status, and names its cause`; `bun test packages/agentic-workflow/test/doctor.inventory.test.mjs` exits 0 with the row count of 17 and the case `documented → probed: every documented row has a probe, in registry order`.
3. **S3 — a missing capability names its cause and the documented degradation route.** `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0 with the cases `no PI WEB session: the row is not-applicable and names the per-phase hand-off` and `the dead-end cases name the missing half, never a silent blank`.
4. **S4, S7, S8 — the pi-specific half is named, never claimed.** `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0 with the cases `the bridge is evidence with an owner, never a probed fact` and `pi-web marker present and no session daemon: unreachable, and the marker alone never reads as ok`; the probe's evidence carries `bridge.observable === false` and no status claims a dispatch was attempted.
5. **S4, S7 — the installed set is read from Pi's own package declarations.** `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0 with the cases `a registered path entry carrying both skills is ok` and `a declared package missing a skill is missing, and names the skill`.
6. **S3, S5 — a package absent under pi-web is missing *and* the advice refuses npm.** `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0 with the case `absent under pi-web: the embedded path is named, npm is refused, and the instruction is the local install`; the inventory row's install route is `instruct-only`.
7. **S6 AC1 — `doctor --check relay` reads one row deterministically.** `bun test packages/agentic-workflow/test/doctor.cli.test.mjs` exits 0 with the cases `--check narrows the envelope to one row and keeps the exit contract` and `an unknown --check id refuses with the documented ids`.
8. **S6 AC1 — both carriers print the same row.** `bun test packages/agentic-workflow/test/doctor.cli.test.mjs` exits 0 with the case `setup-env --doctor and doctor --json print the same relay row`; `bun scripts/setup-env.mjs --doctor --json` carries a `relay` row.
9. **S6 AC2 — the check never dispatches, never spawns and works offline.** `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0 with the case `the probe spawns nothing, reads no network and writes nothing`; a fake `ops` whose `git`, `ghAuth`, `httpJson` and `version` are spies records zero calls.
10. **S6 AC3 — the interview and the lane cite the check instead of re-deriving presence.** `rg -n 'runner doctor --check relay' skills/init-workspace/SKILL.md skills/unit-lane/references/RELAY.md` matches both files, and the same two files carry no ad-hoc `PI_WEB_SESSION` detection instruction.
11. **S6 AC4 — consent is untouched.** `rg -n 'Never dispatch without' skills/unit-lane/references/RELAY.md` matches the unchanged `Forbidden` bullet, and `git diff main...HEAD -- skills/unit-lane/references/RELAY.md` carries no hunk inside that section's bullets.
12. **S6 AC5 — the gate is green under both runtimes and no vocabulary moved.** `bun scripts/run-root-suite.mjs` exits 0; `bun run --cwd packages/agentic-workflow test` exits 0 under bun and `node --test` exits 0 for the touched suites; `git diff --name-only main...HEAD` lists no `packages/agentic-workflow-schema/src/` file (no `DOCTOR_CHECK_STATUSES` value was needed).
13. **S3, S4 — the documented surfaces ship with the code.** `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 (help registry, usage line and README rows agree); the crate README's `tool-inventory@1` carries the `relay` row and its `doctor-envelope@1` block declares the filter; `.changeset/705-relay-doctor-check.md` lints clean.
14. **S5, S8 — nothing outside scope moves, and the session's own state is written through its writers.** `git diff --name-only main...HEAD` lists only this unit's declared surfaces; the roadmap row moves through `roadmap rowUpsert`; `docs/LOGS.md` carries the session entry appended by the log-session flow.

## Impact

One new capability row on a surface three other consumers already read, plus one
narrowing flag on the command that prints it.

- **`packages/agentic-workflow/src/doctor/`** — a new probe module
  (`relay.mjs`), one registry entry in `checks.mjs`, one filter in
  `doctor.mjs`. Every reader of the envelope sees one more row: the crate
  README's `tool-inventory@1` must document it in the same commit or the
  doctor's own bijection refusal (exit 2, `inventory-drift`) fires for every
  run — the sharpest consumer of this change.
- **`packages/agentic-workflow/src/runner/pi-web.mjs`** (new) — the one owner of
  "is a PI WEB session present" and "where is its session daemon", imported by
  the router (`unit-route.mjs`) and by the doctor probe. The router's answer must
  stay byte-identical: `scripts/relay-route.test.mjs` is the differential
  baseline that proves it.
- **`packages/agentic-workflow/bin/agentic-workflow.mjs`** — **the named
  high-risk item** (risk-tier signal `destructive`): the flag parser gains
  `--check <id>`. The classifier's escalation reason is
  `../src/doc/retrieval.mjs · (module-level)` — a pre-existing property of that
  file, not a path this unit's edit touches; the edit is additive inside the
  doctor/setup arm.
- **`packages/agentic-workflow/src/runner/help.mjs`** — the `doctor` help row's
  `flags` list. `cli.surface.test.mjs` pins the usage line, the help registry and
  the crate README's usage rows to one set, so all three move together.
- **`skills/`** — two prose surfaces: `init-workspace`'s tool-evidence step (the
  provisioning interview) and the lane's `RELAY.md` (§When this applies,
  §Degradation). Both are budget-pinned by `docs/workflow/SKILL_CONTEXT_BUDGETS.json`,
  so the context gate re-measures them.
- **`docs/features/705-relay-doctor-check/`** — the unit's own carrier.
- **What stops being true**: the lane's `RELAY.md` §Degradation said the router
  "says why" relay is absent and nothing more; the availability question now has
  a deterministic answer *before* a packet exists, and the page says where.
  No sentence claiming the crate checks the bridge is added — the opposite is
  stated.

## Surfaces

- `packages/agentic-workflow`
- `skills/unit-lane`
- `skills/init-workspace`
- `docs`

## Retirements

Strictly additive: no surface is removed and no token is renamed. The computed
inventory of what this unit *adds*, each with its consumer, so nothing lands
orphaned:

| surface | consumer |
|---|---|
| `packages/agentic-workflow/src/runner/pi-web.mjs` | `unit-route.mjs` (the router's existing marker) and `src/doctor/relay.mjs` (the new probe) |
| `packages/agentic-workflow/src/doctor/relay.mjs` | the `relay` entry in `src/doctor/checks.mjs`, and `test/doctor.relay.test.mjs` |
| `doctor --check <id>` | `skills/unit-lane/references/RELAY.md` §Degradation and `skills/init-workspace/SKILL.md`'s tool-evidence step |
| the `relay` inventory row | the crate README's `tool-inventory@1` block, read by `doctor.inventory.test.mjs` |

`runner residual-classify --inventory --base main` is the manifest-derived
receipt for these rows (§ `## Log` E-line).

## Non-goals

- No auto-install of `@jmfederico/pi-relay` or of pi-web, and no installer for
  either (S5): the package is embedded in the host distribution and dispatch is
  bridge-gated, so an install adds the unusable half.
- No change to the relay packet format, to `dispatch_relay` semantics, or to
  `RELAY.md`'s `## Ownership` and `## Forbidden` sections (S5). The page gains
  two citations; its contract does not move.
- No pre-approval or auto-approval of a dispatch (S5, S6 AC4).
- No crate-level probe of the session-dispatch bridge (S7): a bash-invoked check
  cannot observe a live session's listeners, and a probe that pretends to is the
  defect this unit exists to prevent.
- No `relay check <unit>` packet checker change (S5): that check is lane-time by
  design and already ships.
- No routing of Relay availability into `unit-route --triage` as a machine fact
  (S8's second question): the router keeps its one deterministic marker and the
  doctor answers capability. Recorded as `D3`.

## Risk tier

Copied verbatim from `runner ceremony tier classify` at the cut head over the
planned paths:

- **Tier** — `high` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true, ceremony: "unit-doc+review-change", verification: "review-change"}`
- **Named high-risk item** — `packages/agentic-workflow/bin/agentic-workflow.mjs` (`signal: destructive`)

`reason`: `1 path(s) touch a named high-risk surface: destructive (packages/agentic-workflow/bin/agentic-workflow.mjs · ../src/doc/retrieval.mjs · (module-level))`.
The named surface's escalation is the module-level reference that file has always
carried; this unit's hunk is the `--check` flag inside the doctor/setup arm and
nothing else. The `review-change` half of the ceremony is replaced by the
operator's own external verification (S1's inline workflow, `## Log` L2/D1).

## Future

none.

## Future cost

- A new doctor row now costs three edits in one commit (registry entry, README
  row, count literals in two suites) — the gate refuses the drift both ways, so
  whoever adds the next row is told by a red suite rather than by prose.
- `pi-web.mjs` is the one owner of the session marker. A scond host marker
  (another daemon, another env name) extends that module, never a probe.
- A pi-web release that renames the shipped package directory
  (`dist/pi-packages/relays`) or drops `pi.skills` breaks the `missing`/`ok`
  answer for the installed half; the fixture in `doctor.relay.test.mjs` is the
  place that records the shape, so the next version bump is a one-file repair.

## Applicable tests

- `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` — the new probe
  and its five answers (red first).
- `bun test packages/agentic-workflow/test/doctor.cli.test.mjs` — `--check`, its
  refusal and the two carriers.
- `bun test packages/agentic-workflow/test/doctor.inventory.test.mjs` and
  `bun test packages/agentic-workflow/test/doctor.vehicle.test.mjs` — the
  documented↔probed bijection and the two row-count literals.
- `bun test packages/agentic-workflow/test/cli.surface.test.mjs` — help registry,
  usage line and README parity for the new flag.
- `bun test scripts/relay-route.test.mjs` — the router's relay hint and its
  degradation wording, unchanged after the `pi-web.mjs` extraction.
- `bun test packages/agentic-workflow/test/self-documenting-cli.skill.test.mjs` —
  the CLI surface the skills' prose cites.
- `bun run --cwd packages/agentic-workflow test` — the package gate.
- `bun scripts/check-skill-context.mjs`, `bun scripts/skill-lint.mjs`,
  `bun test scripts/normative-drift.test.mjs`,
  `bun test scripts/prose-gate-inventory.test.mjs` — the prose budgets and the
  drift gates the changed pages belong to.

## Known pre-existing issues

- **The risk-tier classifier escalates every edit to
  `bin/agentic-workflow.mjs`** on a module-level reference to
  `../src/doc/retrieval.mjs` — `does-not-affect`: the signal is recorded as the
  named high-risk item above and the hunk stays inside the doctor/setup arm.
- **`scripts/test-obligation-tags.test.mjs` refuses an untagged *root* suite** —
  `does-not-affect`: this unit adds no root suite; the new tests are package
  suites, which the gate does not tag.
- **`doctor.cli.test.mjs` spawns cost ~2.7s each on this host** — `affects` this
  unit's verification cost only: every spawn case carries an explicit timeout and
  the new `--check` cases reuse the same budget.
- **`@jmfederico/pi-relay` is `private: true` and unpublished** — `affects` the
  probe's design, not the tree: the check reads it on disk and never asks a
  registry (recorded as `S2`, `D5`).

## Tasks

- P1 — Cut the unit doc, the two standalone ledgers, the decisions and known-issues carriers; register the roadmap row through its writer (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/705-relay-doctor-check/SPEC.md --no-git` exits 0)
  (Implements: S1, S4)
  - Relevant files: docs/features/705-relay-doctor-check/SPEC.md, docs/features/705-relay-doctor-check/planning-evidence.md, docs/features/705-relay-doctor-check/planning-obligations.md, docs/features/705-relay-doctor-check/decisions.md, docs/features/705-relay-doctor-check/known-issues.md
- P2 — RED: the probe suite, the `--check` cases and the two row-count literals land alone and are observed failing on the absent module (validator: `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 1 with the module-resolution failure recorded as an `E` line)
  (Implements: S2, S3, S4, S6)
  - Relevant files: packages/agentic-workflow/test/doctor.relay.test.mjs, packages/agentic-workflow/test/doctor.cli.test.mjs, packages/agentic-workflow/test/doctor.inventory.test.mjs, packages/agentic-workflow/test/doctor.vehicle.test.mjs
- P3 — One owner for the session marker: `src/runner/pi-web.mjs` carries `piWebPresent`, the daemon endpoint resolution and the bridge wording; the router imports them and its output stays byte-identical (validator: `bun test scripts/relay-route.test.mjs` exits 0)
  (Implements: S4, S7)
  - Relevant files: packages/agentic-workflow/src/runner/pi-web.mjs, packages/agentic-workflow/src/runner/unit-route.mjs
- P4 — The probe: `src/doctor/relay.mjs` answers the five rows from evidence the crate can read (validator: `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` exits 0)
  (Implements: S2, S3, S4, S7, S8)
  - Relevant files: packages/agentic-workflow/src/doctor/relay.mjs
- P5 — The row and the filter: the `relay` registry entry, the documented inventory row, `doctor --check <id>` and the help/usage parity (validator: `bun test packages/agentic-workflow/test/doctor.inventory.test.mjs` exits 0 AND `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0)
  (Implements: S2, S4, S6)
  - Relevant files: packages/agentic-workflow/src/doctor/checks.mjs, packages/agentic-workflow/src/doctor/doctor.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/README.md
- P6 — The two prose citations: the lane's degradation and the interview's tool-evidence step name the check, and the budgets re-measure (validator: `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S3, S4, S6)
  - Relevant files: skills/unit-lane/references/RELAY.md, skills/init-workspace/SKILL.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P7 — State and release intent: the changeset, the roadmap row through its writer, the session journal entry (validator: `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S4, S5)
  - Relevant files: .changeset/705-relay-doctor-check.md, docs/ROADMAP.md, docs/LOGS.md
- P8 — Verification: the package gate under bun and node, the root suite and the obligation ledger closed (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: docs/features/705-relay-doctor-check/planning-obligations.md, docs/features/705-relay-doctor-check/SPEC.md

## Triaged steps

`runner unit-route --triage 705` at the cut head, verbatim:

```text
TRIAGE — 705 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/705-relay-doctor-check
relay-next: create .pi-web/relays/705-relay-doctor-check/ (charter → docs/features/705-relay-doctor-check/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/705-relay-doctor-check", leg: "1") · legs: 9 = 8 phases + 1 coherence review
```

The `relay:` / `relay-next:` pair belongs to this pi-web session's own packet
state, not to a triaged step: this unit is applied inline by the operator's
workflow (`## Log` L2), so no Relay packet is dispatched. The `review` step is
replaced by that same workflow's external verification, and the `release` step is
the changeset that ships with the code.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-24, the operator's order, verbatim:
  ```
  Apply to this repository: issue #705
  ```
- **L2** — 2026-11-24, the operator's governing workflow for this application, verbatim (the part that binds the procedure):
  ```
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```
- **L3** — 2026-11-24, the operator's verification contract, verbatim (the part that binds the hand-off):
  ```
  Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict.
  ```
- **E1** — 2026-11-24, the frozen-failure reproducer, run against a copy of the base commit (`git archive main` into `/tmp`, the workspace `node_modules` linked): `bun packages/agentic-workflow/bin/agentic-workflow.mjs doctor --check relay` · exit **2** · `DOCTOR REFUSAL — unknown argument "--check" (usage: doctor [--json] [--root <dir>] | setup …)` — the capability was unreportable, which is the defect `S2` describes.
- **E2** — 2026-11-24, the suite landing alone at `c4c6dab4b` · `bun test test/doctor.relay.test.mjs` exit **1** (`Cannot find module '../src/doctor/relay.mjs'`, 0 pass / 1 fail / 1 error) · `bun test test/doctor.cli.test.mjs` exit 1 (3 fail: the two `--check` cases and the two-carrier case) · `bun test test/doctor.inventory.test.mjs` exit 1 (17 expected, 16 documented).
- **E3** — 2026-11-24, `bun test packages/agentic-workflow/test/doctor.relay.test.mjs` · exit 0 · **15 pass / 0 fail** — the five environments, the two halves, the installed set and the zero-spawn invariant.
- **E4** — 2026-11-24, `bun test test/doctor.inventory.test.mjs test/doctor.checks.test.mjs test/doctor.vehicle.test.mjs test/doctor.wizard.test.mjs` · exit 0 · **49 pass / 0 fail**.
- **E5** — 2026-11-24, `bun test test/doctor.cli.test.mjs test/cli.surface.test.mjs` · exit 0 · **21 pass / 0 fail** (`--check` narrows in 0.36s, the unknown id refuses with the documented ids, the two carriers print one identical row).
- **E6** — 2026-11-24, the router's differential: `bun test scripts/relay-route.test.mjs` · exit 0 · **13 pass / 0 fail**, and `unit-route --triage 705` run from the base copy and from this head over the same repository prints **byte-identical** blocks with `PI_WEB_SESSION` set (7 lines) and unset (6 lines).
- **E7** — 2026-11-24, the three observed environments of `S6 AC1`, against one scratch root: PI WEB present → `ok  relay  PI WEB session · daemon /home/agent/.pi-web/sessiond.sock · @jmfederico/pi-relay 0.1.0 · skills relay, relay-runner`, exit 0; without the marker → `N/A  relay  no PI WEB session · … · → Next: /execute-phase <NN-slug> P<k>`, exit 0; marker set with no daemon (`PI_WEB_SESSIOND_SOCKET=/tmp/not-a-daemon.sock`) → `UNREACHABLE  relay  … daemon absent at /tmp/not-a-daemon.sock … dispatch_relay requires PI WEB's session dispatch bridge (pi-web:session-dispatch:v1) …`, exit 0 with one advisory.
- **E8** — 2026-11-24, the differential check (base copy vs this head, same scratch root and env): `doctor --json` — ids `16 → 17`, **added: relay, removed: none, rows whose bytes moved: none**, `inventory` `{rows:16} → {rows:17, check:null}`, `summary` `ok 9 → 10` with every other cell unchanged; the human block differs in exactly three lines (the header count, the added row, the summary) and `help doctor` in exactly one (`--check`).
- **E9** — 2026-11-24, the cost the filter buys: `bun … doctor --json` **3,272 ms** (17 rows, version batch + engram health) against `bun … doctor --check relay --json` **240 ms** (1 row) — the same host, three runs each, before `D12` the narrowed read was 2,529 ms.
- **E10** — 2026-11-24, `bun run --cwd packages/agentic-workflow test` · exit 0 · **84/84 suites PASS**; `node --test test/doctor.relay.test.mjs test/doctor.inventory.test.mjs test/doctor.vehicle.test.mjs test/doctor.checks.test.mjs` · **58 pass / 0 fail**; `node --test test/doctor.cli.test.mjs test/cli.surface.test.mjs test/doctor.wizard.test.mjs` · **27 pass / 0 fail**.
- **E11** — 2026-11-24, `bun scripts/run-root-suite.mjs --jobs 4` · exit 0 · **143/143 PASS**.
- **E12** — 2026-11-24, `bun scripts/skill-lint.mjs` · `0 finding(s) · verdict: PASS`; `bun scripts/check-skill-context.mjs` · `PASS context budgets: 31 skills` (init-workspace 7,219 est inside its 7,895 ceiling, unit-lane unchanged at 5,350); `--documents` · `PASS context documents: 7 budgeted documents` — no re-pin was needed.
- **E13** — 2026-11-24, `bun test scripts/normative-drift.test.mjs scripts/prose-gate-inventory.test.mjs scripts/invocation-drift.test.mjs` · exit 0 · **59 pass / 0 fail** — the `tool-inventory@1` and `tool-doctor-envelope@1` blocks still resolve as normative surfaces.
- **E14** — 2026-11-24, `bun … docs-generate --check` · **DRIFT** (roadmap + `docs/generated/units.md` stale) → `bun … docs-generate` · `1 written · 0 deleted · 2 unchanged · verdict: PASS` — the summary cell and the unit index came from the emitter (`D10`).
- **E15** — 2026-11-24, `bun scripts/lint-changeset.mjs .changeset/705-relay-doctor-check.md` · `ok`; `bun scripts/version-parity-gate.mjs --content` · `VERDICT: PASS` (the changeset declares the crate and the pi package).
- **E16** — 2026-11-24, `bun … journal write --kind narrative …` · `{"ok":true, "name":"20261124T130149Z-feat-705-tool-doctor-relay-check-narrative-local.md", "bytes":3429}` and `journal aggregate --check` · `ok: 39 checked, 0 refusals` — the session entry is the fragment the aggregator owns, never a `LOGS.md` append.
- **E17** — 2026-11-24, the `ac-hash` recompute after the `## Triaged steps` and ledger corrections (`D13`, `D11`, `D14`): `sha256` of the `## Acceptance criteria` section reads `152edac2c4d2b7f8c999f41b53aa92d6e9b8e723663fd2ea88649ff5aa195f40`, unchanged from the cut — no correction touched a criterion.
- **G1** — 2026-11-24, HEAD `feaea16a7`, `bun scripts/local-gate.mjs --jobs 4` · exit 0 · **`local-gate: PASS — 20 step(s) in 853s`**, including `root-suite` (143/143), `crate-suite-bun`, `crate-suite-node`, `pi-node-compat` (1074 pass / 1 skipped / 0 fail), `schema-node-compat`, `docs-generated-projection`, `version-parity-content`, `skill-context-budgets`, `journal-carrier-check`, `log-immutability`, `secret-scan`, `worktree-guard`, `red-first`.
- **P1** — 2026-11-24, unit doc + the two standalone ledgers + decisions + known-issues cut; the roadmap row moved through `roadmap rowUpsert` · `6144d9d33`.
- **P2** — 2026-11-24, the suite alone, observed red (E2) · `c4c6dab4b`.
- **P3** — 2026-11-24, `src/runner/pi-web.mjs` and the router's import (byte-identical output, E6) · `4c192c8a4`.
- **P4** — 2026-11-24, the probe module · `cb0893f10`.
- **P5** — 2026-11-24, the registry entry, the filter, the flag and the README row · `3879c4e34`.
- **P6** — 2026-11-24, the lane's reference and the interview's tool-evidence step · `714b7725f`.
- **P7** — 2026-11-24, the changeset, the emitted projection and the journal fragment · `feaea16a7`.
- **P8** — 2026-11-24, the differential, the gate (G1) and the ledger closure · this commit.
- **D11** — 2026-11-24, the absent-capability answer carries no advisory (the route lives in evidence and is rendered), so a healthy host's `summary.advisories` stays zero; O3's cell corrected before verification.
- **D12** — 2026-11-24, shared facts are read only when the selected rows declare them (`probe.needs`), amending D4's “same cost” with the measured 3.3s → 0.24s.
- **D13** — 2026-11-24, the `## Triaged steps` block replaced with the command's own bytes after the plan's reconstruction differed in two tiers and the absent addendum.
- **D14** — 2026-11-24, O11's validator narrowed to `PI_WEB_SESSION_ENV` (the marker's one definition), since the router's usage prose names the variable it documents.

## Next

Nothing in the unit is open: every obligation verified, the gate green. The next
action is the operator's external verification of the diff, then the merge gate on
the PR this unit's branch opens.

## References

- Issue [#705](https://github.com/gtrabanco/agentic-workflow/issues/705) — the work order this unit applies; the PR closes it via `Closes #705`.
- `docs/research/2026-11-13-tool-doctor-inventory.md` — the delimitation rule (`S7`) this unit's scope rests on.
- Issue [#537](https://github.com/gtrabanco/agentic-workflow/issues/537) — the doctor, its inventory block and its envelope; this unit adds one row to them.
- Issue [#294](https://github.com/gtrabanco/agentic-workflow/issues/294) — the lane's relay seam; this check reports the seam's availability and changes nothing about it.
- Issue [#611](https://github.com/gtrabanco/agentic-workflow/issues/611) — the `dogfooding-vehicle` row, the row-after-row precedent this unit follows (probe module + own suite + inventory row).
- Issue [#703](https://github.com/gtrabanco/agentic-workflow/issues/703) — the live battery that reads this envelope; one more row rides its report at zero extra cost.
- Issue [#669](https://github.com/gtrabanco/agentic-workflow/issues/669) — `/flow` composes Relay legs and will consult this same capability signal.

## Branch

`feat/705-tool-doctor-relay-check` (the worktree branch this unit is applied on;
the unit slug follows the roadmap row's topic cell).

## Depends on

Empty — independent. Related, no blocker: #294 (the seam), #669 (the composer),
#703 (the envelope's other consumer).

## Regression scope

| scenario | check |
|---|---|
| the router still prints the same `relay:` hint and the byte-identical machine block | `bun test scripts/relay-route.test.mjs` exits 0 |
| the doctor's other sixteen rows still answer their evidence and statuses | `bun test packages/agentic-workflow/test/doctor.checks.test.mjs` exits 0 |
| the documented inventory and the probes stay one declaration, both ways | `bun test packages/agentic-workflow/test/doctor.inventory.test.mjs` exits 0 |
| the wizard's plan still derives one move per row | `bun test packages/agentic-workflow/test/doctor.wizard.test.mjs` exits 0 |
| `--json` and the fixed human block still agree over every row | `bun test packages/agentic-workflow/test/doctor.cli.test.mjs` exits 0 |
| help, usage line, README and the dispatch set still name one surface | `bun test packages/agentic-workflow/test/cli.surface.test.mjs` exits 0 |
| every skill still fits its context ceiling and its authoring lint | `bun scripts/check-skill-context.mjs` exits 0 and `bun scripts/skill-lint.mjs` exits 0 |
