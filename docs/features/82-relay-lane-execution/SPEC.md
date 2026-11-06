---
type: feature
scope: medium
ac-hash: 5f1c456946c81ccd3b7eb1efe1d18f473f32b6f27fb31f04d373807232d18206
---

# 82 — relay-lane-execution

> One-line: run each triaged phase as a pi-web Relay leg from the lane, with the unit doc as the durable plan and a fresh-context coherence reviewer as the pre-PR gate.

## Specs

**S1 — Each triaged phase becomes a Relay leg dispatched through pi-web, the unit doc stays the durable plan, and a fresh-context coherence reviewer replaces the lane's pre-PR gate.**
> Compose the lane with **pi-web Relays**: after triage (`unit-lane --from-issue` / `plan-feature`), each triaged phase becomes a **Relay leg** dispatched via pi-web's `dispatch_relay`, with the unit doc as the durable plan and a **fresh-context coherence reviewer** as the lane's pre-PR gate.

**S2 — The #293 D1/D3/D4 gaps are closed structurally and per-phase model routing becomes reachable by construction.**
> This resolves #293's D1/D3/D4 gaps structurally instead of patching them, and makes per-phase model routing (#293 D3) reachable by construction.

**S3 — Division of ownership: agentic-workflow owns the plan; Relay owns the continuity.**
> agentic-workflow owns the **plan**; Relay owns the **continuity**.

**S4 — The charter is a pointer: it names the unit doc and its acceptance criteria and restates neither plan, gates nor steps.**
> **Charter** = pointer, not copy: the unit doc path (SPEC.md) and its acceptance criteria are the finish line. The charter references them; it never restates the plan, gates or steps.

**S5 — The baton is a phase cursor plus evidence pointers: it points at the unit doc's Evidence rows and Progress log and never duplicates them.**
> **Baton (`status.md`)** = phase cursor + evidence pointers only: "P1 done (commit sha, gate result) → P2 next". It *points* at Evidence rows and the Progress log in the unit doc; it never duplicates them.

**S6 — `decisions.md` carries consequential decisions and rejected approaches discovered during execution, kept minimal, with the unit doc authoritative.**
> **`decisions.md`** = consequential decisions and rejected approaches discovered during execution that are worth remembering beyond the unit doc's own records (kept minimal; the unit doc stays authoritative).

**S7 — Context budgets stay intact: the handover is pointers, never embedded SKILL.md content.**
> Context budgets stay intact: the handover is pointers, not embedded SKILL.md content — no `check-skill-context` pressure.

**S8 — The plan phase is unchanged and keeps its human approval.**
> **Plan phase (unchanged)**: `/unit-lane --from-issue <N>` (or `plan-feature`) produces the triaged unit doc with P1..P4, ACs, Evidence-row template, gates. Human approval.

**S9 — Relay bootstrap creates the packet and waits for human approval before the packet turns `Active` and leg 1 is seeded.**
> **Relay bootstrap**: create the packet (charter = unit-doc reference + ACs; status = `Draft — awaiting approval`, leg cursor). Human approves → status `Active`, leg 1 seeded.

**S10 — A leg runs the triaged phase under the `execute-phase <NN> P<k>` contract, updates baton and log, and dispatches `leg: k+1` as its final action; the leg count is the phase count plus the review legs with no open-ended chain.**
> **Each leg**: fresh session loads `relay` + `relay-runner` skills and the applicable workflow skills, reads charter + baton, runs the triaged phase (same contract as `execute-phase <NN> P<k>`: gate → commit → Evidence rows → Progress log), updates baton + log, then `dispatch_relay(leg: k+1)` as its final action. Leg count = phase count + review legs; no open-ended chain.

**S11 — Per-leg model routing maps the catalog's per-step `budget_tier`: mechanical phases on the cheap tier, coherence review and adversarial passes on the strong tier; the previously dead data becomes the runtime routing.**
> **Per-leg model routing**: `dispatch_relay` accepts `model`/`thinkingLevel`. Map from the catalog's per-step `budget_tier` (#293 D3): mechanical phases on the cheap unlimited tier; coherence review and any adversarial pass on the strong tier. This is the runtime realization of the routing that `recommended.ts` + `budget_tier` declare today as dead data.

**S12 — A fresh leg performs the coherence review with the four-item positive-verification checklist and writes the existing `REVIEW-VERDICT` block; it is the lane gate and emits no receipt.**
> **Coherence reviewer (pre-PR gate, replaces the lane's inline review — #293 D1)**: when a leg finishes substantive work, the final review does NOT pass through. A fresh leg performs the coherence review with a positive-verification checklist: (a) log/Progress entries ↔ actual diff coherence; (b) decisions ↔ plan ↔ ACs coherence; (c) re-run each Evidence row (reproducibility); (d) AC-section hash unchanged from triage. Output = the existing `REVIEW-VERDICT` block in the unit doc. This is the lane gate — it emits no receipt (receipts require an open PR, per #293 D1's structural conflict).

**S13 — After the PR opens, the formal review and the merge gate keep their lane close-out ordering.**
> **Post-PR**: `/review-change` formal review (isolated passes, receipt) → `/audit-pr` merge gate, both ordered by the lane close-out (#293 D1/D2 unchanged).

**S14 — Without pi-web the dispatch fails before dispatch and the lane degrades to the existing per-phase `execute-phase` hand-off; Relay is an enhancement of the seam, not a new hard dependency.**
> **Falls back cleanly**: without pi-web running, `dispatch_relay` fails before dispatch ("requires PI WEB's session dispatch bridge") — the lane must then degrade to the existing `/execute-phase <NN> P<k>` hand-off path (#293 D4). Relay is an enhancement of the seam, not a new hard dependency.

**S15 — This implements #293's D1/D3/D4 seam; D2 (ordered `audit-pr`) is unchanged.**
> **#293**: this implements its D1/D3/D4 seam via Relay; D2 (ordered `audit-pr`) unchanged. #293 remains the tracking issue for the non-Relay path.

**S16 — #260 is complementary: it puts atomic work on cheap free-context subagents inside a leg, this puts phases on fresh-context legs across sessions.**
> **#260** (subagent-first): complementary — #260 puts atomic *work* on cheap free-context subagents inside a leg; this puts *phases* on fresh-context legs across sessions. Both keep design+verification with the orchestrator.

**S17 — #201 stays a different layer: its `passes` table governs passes spawned inside a leg, the leg's own `model` governs the leg.**
> **#201** (pass model routing): the `passes` table governs models of passes spawned inside a leg; `dispatch_relay`'s per-leg `model` governs the leg itself. Different layers, one operator-approved table each.

**S18 — #174's equivalence is recorded when implementing: a leg with a maintained baton is a state-flow episode with materialized state on disk, with no dependency created.**
> **#174** (SKILLSTATE lifecycle): a Relay leg with a well-maintained baton is effectively a state-flow episode with materialized state on disk (inspectable in pi-web's Relays panel). No dependency; record the equivalence when implementing.

**S19 — No new relay engine: pi-web owns `dispatch_relay` and this repository composes with it.**
> No new relay engine in this repo — pi-web owns `dispatch_relay`; we compose with it.

**S20 — Relay replaces the lane's inline pre-PR review only; it never replaces `review-change`/`audit-pr` or the receipt contract.**
> Relay does not replace `review-change`/`audit-pr` or the receipt contract; it replaces the lane's inline pre-PR review only.

**S21 — No packet schema change is required in pi-web for v1.**
> No packet schema changes in pi-web required for v1 (charter/status/log as-is).

**S22 — The affected surfaces are named: the lane skill and its new relay reference, the executor skill, the router, the catalog's tier mapping, the budgets manifest, and README/CHANGELOG.**
> `skills/unit-lane/SKILL.md` (+ close-out §6), new `skills/unit-lane/references/RELAY.md` (packet layout, leg contract, coherence checklist), `skills/execute-phase/SKILL.md` (leg = one-phase mode parity), `scripts/unit-route.mjs` (emit relay bootstrap hint when pi-web detected), `scripts/catalog.json` `budget_tier` → leg model mapping, budgets (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`), README/CHANGELOG (EN+ES same commit).

**S23 — The packet validation contract is tested first: charter points at an existing unit doc, the baton phase-cursor grammar, and the coherence output matches the `REVIEW-VERDICT` grammar.**
> Packet validation contract: charter points at an existing unit doc; baton phase cursor grammar; coherence-checklist output block matches `REVIEW-VERDICT` grammar.

**S24 — A deterministic, fixture-tested degradation prints the per-phase `execute-phase` fallback when dispatch is unavailable.**
> Degradation: `dispatch_relay` unavailable → printed `/execute-phase <NN> P<k>` fallback (deterministic, fixture-tested).

**S25 — The leg handover prompt stays under the context ceiling.**
> Budget gate: leg handover prompt stays under the context ceiling.

## Acceptance criteria

One observable criterion per requirement; each names the check that demonstrates it. `bun test scripts/<file>.test.mjs exits 0` means that suite is the demonstration; the prose criteria name a `rg` count over the surface that must carry the fact.

1. **AC1 (S1)** — `bun test scripts/relay-route.test.mjs` exits 0, and `rg -c dispatch_relay skills/unit-lane/references/RELAY.md` matches 1.
2. **AC2 (S2)** — `bun scripts/relay-packet.mjs tiers 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0 and prints `execute: cheap` and `coherence-review: strong`.
3. **AC3 (S3)** — `rg -c '^## Ownership' skills/unit-lane/references/RELAY.md` matches 1.
4. **AC4 (S4)** — `bun scripts/relay-packet.mjs check 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0 on the pointer-shaped charter, and the same command over a tree in which `rejected/charter-restates-tasks.md` replaces it exits 1 (case pinned by `bun test scripts/relay-packet.test.mjs`).
5. **AC5 (S5)** — `bun test scripts/relay-packet.test.mjs` exits 0, including the case where the baton duplicates an `| AC |` evidence row.
6. **AC6 (S6)** — `rg -c decisions.md skills/unit-lane/references/RELAY.md` matches 3, and the checker accepts an absent `decisions.md` (packet still passes).
7. **AC7 (S7)** — `bun scripts/relay-packet.mjs budget 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0 naming `measured` and `ceiling`, and `bun scripts/check-skill-context.mjs --routes` exits 0.
8. **AC8 (S8)** — `rg -c 'Human approval' skills/unit-lane/references/RELAY.md` matches 1.
9. **AC9 (S9)** — `bun test scripts/relay-packet.test.mjs` exits 0, including the `Draft — awaiting approval` state check and the `Active` transition fixture.
10. **AC10 (S10)** — `rg -c 'final operational action' skills/unit-lane/references/RELAY.md` matches **1**, and AC12's checker proves the review legs are bounded.
11. **AC11 (S11)** — `bun scripts/relay-packet.mjs tiers 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0; the printed `source:` line names `scripts/catalog.json` as the only tier source.
12. **AC12 (S12)** — `bun test scripts/relay-packet.test.mjs` exits 0 on a `REVIEW-VERDICT` block that matches the owned grammar and fails closed on each malformed variant.
13. **AC13 (S13)** — `rg -c review-change skills/unit-lane/references/RELAY.md` matches 2 and `rg -c REVIEW-VERDICT skills/unit-lane/references/RELAY.md` matches 2, with `references/REVIEW.md` named as the block's owner.
14. **AC14 (S14)** — `bun test scripts/relay-route.test.mjs` exits 0, including the case that with `PI_WEB_SESSION` unset the route prints `next: /execute-phase <unit> P<k>` and no relay line.
15. **AC15 (S15)** — `rg -c audit-pr skills/unit-lane/references/RELAY.md` matches 3; the pre-PR gate is stated as receipt-free.
16. **AC16 (S16)** — `rg -c '#260' skills/unit-lane/references/RELAY.md` matches **1**.
17. **AC17 (S17)** — `rg -c '#201' skills/unit-lane/references/RELAY.md` matches **1**.
18. **AC18 (S18)** — `rg -c '#174' skills/unit-lane/references/RELAY.md` matches **1**.
19. **AC19 (S19)** — `git diff --name-only` for this unit names no relay engine module; the only new executable is `scripts/relay-packet.mjs` (read-only checker).
20. **AC20 (S20)** — `rg -c 'emits no receipt' skills/unit-lane/references/RELAY.md` matches 1, and the same file names `/review-change` as the receipt owner.
21. **AC21 (S21)** — the unit reads the packet with pi-web's own anchors (`charter.md`, `status.md`, `log.md`) and adds no packet field requirement: `rg -c 'packet schema' skills/unit-lane/references/RELAY.md` matches **0**.
22. **AC22 (S22)** — every named surface is in the diff: `git diff --name-only` contains `skills/unit-lane/SKILL.md`, `skills/unit-lane/references/RELAY.md`, `skills/execute-phase/SKILL.md`, `scripts/unit-route.mjs`, `scripts/catalog.json`, `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, `README.md`, `.changeset/82-relay-lane-execution.md`.
23. **AC23 (S23)** — `bun test scripts/relay-packet.test.mjs` exits 0, covering a charter pointing at a missing unit doc, a malformed phase cursor and a malformed `REVIEW-VERDICT`.
24. **AC24 (S24)** — `bun test scripts/relay-route.test.mjs` exits 0 on the two fixtures (`PI_WEB_SESSION` set/unset) and on the absent-packet case.
25. **AC25 (S25)** — `bun scripts/relay-packet.mjs budget 20-relay-unit --repo scripts/fixtures/relay-packet` exits 0 with `measured < ceiling`, and the same command over a padded baton exits 1 (case pinned by `bun test scripts/relay-packet.test.mjs`).

## Impact

- **Consumes:** the pi-web Relay packet contract (`charter.md` / `status.md` / `log.md`, optional `decisions.md`, the `dispatch_relay(packet, leg, cwd?, model?, thinkingLevel?)` tool) — verified against the shipped package source, never against prose; `scripts/catalog.json`'s `budget_tier` (single tier source, #291 AC4); `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (single context-ceiling owner); `scripts/unit-route.mjs` (single route owner); `skills/unit-lane/references/REVIEW.md` (`REVIEW-VERDICT` grammar owner); `skills/phase-contract/SKILL.md` (phase grammar owner).
- **Consumed by:** `skills/unit-lane/SKILL.md`'s close-out ladder (the receipt stage is untouched: the pre-PR coherence gate emits no receipt, so `review-receipt.mjs verify` still gates `/audit-pr`); `skills/execute-phase/SKILL.md` (a leg is one phase, same contract); future row 87 (`pi-web-workflow-panel`, sequenced after 82) which projects Relay packets.
- **Stops being true:** the catalog's `budget_tier` is the whole routing story — a leg's `model`/`thinkingLevel` now consumes it; "the lane's review step is the only pre-PR gate" (a fresh-context leg performs it when pi-web is present); `.pi-web/relays/` is pi-web-only territory (the lane bootstraps it).
- **Stale in the issue, corrected here, no requirement removed:** S22's `EN+ES same commit` half is superseded — `AGENTS.md` §Working rules records the owner decision of 2026-10-27 (issue #232): the package ships **English-only permanently**, no `.es.md` sibling may be created. S22's `CHANGELOG` half is likewise the release's write: the per-skill history is a frozen archive (`CHANGELOG.md` §Per-skill version history, D-40-14) and `scripts/release.mjs apply` writes the companion row at cut, so the PR ships the changeset (`.changeset/82-relay-lane-execution.md`) and the release renders it. S8's `plan-feature` and S1's `plan-feature` are retired skills (feature 61 absorbed them; the lane's plan step owns that work). S11's `recommended.ts` path is `packages/pi-agentic-workflow/src/config/recommended.ts`.
- **Asks before touching something live:** nothing on the pi-web side is written; the packet directory is `.pi-web/relays/` (already gitignored) and the repo asks the human for the packet approval the tool requires.

## Retirements

The unit adds; it retires no surface. Reason: the lane's inline pre-PR review is **replaced in behaviour** only when pi-web is present (S12/S14), so `RELAY.md` composes with `references/REVIEW.md`, which stays the grammar and fallback owner; deleting that reference would delete the degradation path S14 requires. Pin: `rg -c 'REVIEW-VERDICT' skills/unit-lane/references/REVIEW.md` matches **2** at the head.

## Non-goals

- **No relay engine and no `dispatch_relay` reimplementation** (S19): no packet validation runtime, no session dispatch, no pi-web plugin.
- **No packet schema change requested from pi-web** (S21) and no pi-web fork.
- **No replacement of `review-change` / `audit-pr` / the receipt contract** (S20): the coherence verdict is evidence, never a receipt.
- **No subagent dispatch inside a leg** (S16) and no `passes` table (#201, S17).
- **No new section in the unit-doc template** and no scaffold change.
- **No model profile editing**: the leg tier is *named*, the operator's `model`/`profileOrder` still decides the concrete model.

## Risk tier

- **Tier** — `standard` · **Task Size** — `contained`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict produced at cut with `bun scripts/ceremony.mjs tier classify` over the branch paths; copied here verbatim in `## Log` (`D` line) after the first code commit, because the classifier reads the diff. A model-supplied tier would not be an input.

## Future

- `open` — 2026-11-05, owner-verbatim from the issue: "No packet schema changes in pi-web required for v1 (charter/status/log as-is)." The v2 packet shapes stay pi-web's decision.
- `open` — 2026-11-05, owner-verbatim from the issue: "#201 (pass model routing): the `passes` table governs models of passes spawned inside a leg; `dispatch_relay`'s per-leg `model` governs the leg itself." The `passes` configuration remains #201's scope, never this unit's.

## Future cost

- **Every skill that spawns a leg names its tier from `scripts/catalog.json`** — binds `unit-lane`, `execute-phase` and any future leg-spawning skill: no second tier table.
- **`RELAY.md` stays a pointer layer** — binds whoever edits the lane: a packet never embeds `SKILL.md` content, or `check-skill-context` pressure (S7) returns.
- **The coherence verdict never becomes a receipt** — binds `review-change`/`audit-pr` owners: a `REVIEW-VERDICT` line is evidence, and the merge gate still reads `bun scripts/review-receipt.mjs verify --pr <N>`.

## Applicable tests

- `scripts/relay-packet.test.mjs` — the new checker's suite (packet validation, budget, tier mapping, `REVIEW-VERDICT` grammar).
- `scripts/relay-route.test.mjs` — the router's relay hint and its degradation (fixture trees, `PI_WEB_SESSION` set/unset).
- `scripts/unit-route.test.mjs`, `scripts/catalog.test.mjs` — the touched router/catalog keep their previous behaviour.
- Root gate: `bun scripts/run-root-suite.mjs`, `bun scripts/check-skill-context.mjs --routes`, `bun scripts/check-skill-context.mjs --documents`, `bun scripts/phase-lint.mjs docs/features/82-relay-lane-execution/SPEC.md`, `bun scripts/promise-coherence.mjs`, `bun scripts/normative-drift.test.mjs`, `bun scripts/version-parity-gate.mjs --content`.

## Known pre-existing issues

- **`local-gate.mjs`'s `pi-compat-guard` step fails in this checkout** (`src/auto-log-session.ts(32,31): error TS2307: Cannot find module '@gtrabanco/agentic-workflow/src/log/render.mjs'`): the step copies `packages/pi-agentic-workflow/{src,tsconfig.json,package.json}` into a temp dir and installs the registry pin, which ships `dist/` only (`files: ["dist", "skills", …]`), so the sibling `src/…` import the package's own source uses cannot resolve outside the workspace. **does-not-affect this unit**: `git diff --stat caee2502 -- packages/` is empty, so the step's whole input set is byte-identical to the base; the offline subset of the same gate passes.
- **`workflow-status-sensor.test.mjs`'s two forge-timeout cases are load-sensitive** (`P2: a forge that never answers times out and degrades`, `F19: a slow-but-alive forge costs one shared bound`): they fail identically at the cut head and at the base when the machine is busy (both sides hit the 5 s bound), and pass in the idle root-suite run at the head. **does-not-affect**: no forge path is touched by this unit.
- **`scripts/docs-generate.test.mjs` is red at the base** (`docs/generated/{code,index,units}.md: stale`, 3 of 3): the committed projection was not regenerated after its sources moved. **affects this unit** — this unit's own sources (a new unit doc, a changed roadmap row) require the docs step to regenerate the projection, which settles the pre-existing drift in the same commit.
- **The checkout arrived with an empty worktree and an empty index** (all 1,363 tracked files staged as deleted, no `node_modules`, no `dist/`). **does-not-affect** this unit's behaviour: `git reset --hard HEAD` plus `bun install --frozen-lockfile` plus the schema package's `bun run build` restored the documented baseline.
- **`docs/features/71-doc-cli` and `docs/features/72-pi-100-compat-guard` remain `defined`/`done` without a matching roadmap status change in this unit's area.** **does-not-affect**: no shared file is edited.

## Tasks

- [x] P1 — Freeze the unit doc, the two planning ledgers and the roadmap row for issue #294 (validator: `bun scripts/phase-lint.mjs docs/features/82-relay-lane-execution/SPEC.md` exits 0)
  (Implements: S8, S22)
  Relevant files: docs/features/82-relay-lane-execution/SPEC.md, docs/features/82-relay-lane-execution/planning-evidence.md, docs/features/82-relay-lane-execution/planning-obligations.md, docs/ROADMAP.md
- [x] P2 — Land the red suites for the packet checker and the relay route, with their committed fixtures, before any implementation (validator: `bun test scripts/relay-packet.test.mjs scripts/relay-route.test.mjs` exits 1 naming the missing module)
  (Implements: S23, S24, S25)
  Relevant files: scripts/relay-packet.test.mjs, scripts/relay-route.test.mjs, scripts/fixtures/relay-packet/
- [x] P3 — Implement the read-only packet checker: packet layout, charter pointer, baton grammar, leg budget, tier mapping, `REVIEW-VERDICT` grammar (validator: `bun test scripts/relay-packet.test.mjs` exits 0)
  (Implements: S4, S5, S6, S7, S9, S11, S12, S25)
  Relevant files: scripts/relay-packet.mjs
- [x] P4 — Emit the relay bootstrap hint and the per-phase fallback from the router, reading the leg tier from the catalog (validator: `bun test scripts/relay-route.test.mjs scripts/unit-route.test.mjs scripts/catalog.test.mjs` exits 0)
  (Implements: S1, S2, S14, S24)
  Relevant files: scripts/unit-route.mjs, scripts/catalog.json, scripts/fixtures/
- [x] P5 — Publish the relay leg contract in the lane skill and give the executor its one-phase parity sentence (validator: `bun scripts/check-skill-context.mjs --routes` exits 0)
  (Implements: S3, S10, S12, S13, S15, S16, S17, S18, S19, S20, S21)
  Relevant files: skills/unit-lane/references/RELAY.md, skills/unit-lane/SKILL.md, skills/execute-phase/SKILL.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, AGENTS.md
- [x] P6 — Ship the documentation and release surface: README, CHANGELOG companion row, changeset, regenerated projections, roadmap row (validator: `bun scripts/version-parity-gate.mjs --content` exits 0)
  (Implements: S22)
  Relevant files: README.md, CHANGELOG.md, .changeset/82-relay-lane-execution.md, docs/generated/
- [x] P7 — Close the obligations ledger and re-run the declared verification at the head (validator: `bun scripts/relay-packet.mjs obligations 82-relay-lane-execution` exits 0)
  (Implements: S23, S24, S25)

### Planning evidence

Lives beside this doc: [`planning-evidence.md`](planning-evidence.md) (M/L unit — never both).

### Obligations

Lives beside this doc: [`planning-obligations.md`](planning-obligations.md) (M/L unit — never both). Before the unit ships, every row is `verified` (or an evidenced `n/a`).

## Triaged steps

Pasted verbatim from `bun scripts/unit-route.mjs --triage 82-relay-lane-execution` (2026-11-05):

```text
TRIAGE — 82-relay-lane-execution (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-05, the request, verbatim (issue [#294](https://github.com/gtrabanco/agentic-workflow/issues/294), §Summary):

  ```
  Compose the lane with pi-web Relays: after triage (`unit-lane --from-issue` / `plan-feature`), each triaged phase becomes a Relay leg dispatched via pi-web's `dispatch_relay`, with the unit doc as the durable plan and a fresh-context coherence reviewer as the lane's pre-PR gate.
  ```

- **D2** — 2026-11-05, owner (plan repair): the ledger and acceptance validators moved from an
  env-prefixed fixture invocation (`RELAY_PACKET_REPO=…`) to the checker's own `--repo <dir>` flag,
  so every declared validator is one backticked command a reviewer can re-run. No requirement,
  scope or threshold changed.
- **D3** — 2026-11-05, owner (measurement repair, before any P5 run): the acceptance criteria were
  cut before `RELAY.md` existed, so their count claims read `≥ 1`. Each is now the exact count the
  file carries (`dispatch_relay` 1, `decisions.md` 3, `review-change` 2, `REVIEW-VERDICT` 2,
  `audit-pr` 3, `emits no receipt` 1), so `bun scripts/promise-coherence.mjs` can re-run them
  instead of skipping an unparseable claim. No requirement changed.
- **E1** — 2026-11-05, red run before the implementation: `bun test scripts/relay-packet.test.mjs` · exit 1 · 0 pass / 30 fail (module missing). `bun test scripts/relay-route.test.mjs` · exit 1 · 1 pass / 12 fail.
- **E2** — 2026-11-05, green run after the implementation: `bun test scripts/relay-packet.test.mjs` · exit 0 · 30 pass / 0 fail. `bun test scripts/relay-route.test.mjs` · exit 0 · 13 pass / 0 fail.
- **E3** — 2026-11-05, compatibility run: `bun test scripts/unit-route.test.mjs scripts/catalog.test.mjs` · exit 0 · 80 pass / 0 fail.
- **P1** — 2026-11-05 11:10 — unit doc, the two planning ledgers, the roadmap row at `in-progress` · 0a1cfef9.
- **P2** — 2026-11-05 11:40 — the red suites and the packet corpus (observed 0/30 and 1/13) · c09055d8.
- **P3** — 2026-11-05 12:20 — the packet checker: four modes, pi-web's bounds, the pointer-shaped charter, the baton grammar, the verdict grammar, the handover ceiling · 83fd61e8.
- **P4** — 2026-11-05 12:20 — the router's relay hint and its degradation, the catalog leg mapping, the handover ceiling in the budgets manifest · 83fd61e8.
- **P5** — 2026-11-05 13:30 — `RELAY.md` (ownership, packet, bootstrap, leg contract, coherence review, routing, degradation), the lane's hand-off pointer and close-out note, the executor's parity sentence, the budgets re-basis and the inventory row.
- **G1** — 2026-11-05, `bun scripts/check-skill-context.mjs` · exit 0 · 28 skills. `--routes` · exit 0 · 14 routes. `--documents` · exit 0 · AGENTS.md 432 lines / 98 machine / 334 prose / 7,709 est.
- **D4** — 2026-11-05, owner (release-surface repair): S22 names `CHANGELOG` in the same commit, but the per-skill history is a frozen archive (`CHANGELOG.md` §Per-skill version history — D-40-14) and the companion row is written by `scripts/release.mjs apply` (`scripts/release.mjs:924-943`). The unit ships the changeset instead — the route `scripts/version-parity-gate.mjs --content` accepts — and AC22 pins that file. No requirement removed; the CHANGELOG row still lands, at release.
- **P6** — 2026-11-05 14:20 — README lane row, the `SKILLS.md` lane section, the changeset, the regenerated projections (which settle the pre-existing `docs/generated` drift: 106 → 117 roadmap rows).
- **D5** — 2026-11-05, owner (validator precision repair, before the closure run): O17 declared `rg -c review-receipt … REVIEW.md` matches 1; the file carries the receipt contract three times (emit, verify, the close-out refusal), so the row now pins 3. The invariant is unchanged — REVIEW.md is not edited by this unit, and the count drops if the receipt contract is ever removed from it.
- **E4** — 2026-11-05, the packet checker at the head: `bun scripts/relay-packet.mjs tiers 20-relay-unit --repo scripts/fixtures/relay-packet` · exit 0 · `execute: cheap`, `coherence-review: strong`, `source: scripts/catalog.json`. `budget 20-relay-unit --repo scripts/fixtures/relay-packet` · exit 0 · `measured: 241 est`, `lines: 29`, `ceiling: 1200 est`.
- **E5** — 2026-11-05, the surface counts at the head: `rg -c '^## Ownership'` 1 · `rg -c 'Human approval'` 1 · `rg -c 'final operational action'` 1 · `rg -c 'emits no receipt'` 1 · `rg -c review-change` 2 · `rg -c '#260|#201|#174'` 3, all over `skills/unit-lane/references/RELAY.md`. `rg -c 'subscriptions|websocket|dispatchThroughHost' scripts/relay-packet.mjs` · exit 1 · no match (the checker carries no dispatch engine).
- **E6** — 2026-11-05, the differential run: the router at `caee2502` and at the head, over every fixture unit with `PI_WEB_SESSION` unset — byte-identical stdout and exit codes except one added `relay: unavailable — …` line in the units that take an execution hand-off.
- **G2** — 2026-11-05, `bun scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS` (changeset route). `bun scripts/phase-lint.mjs docs/features/82-relay-lane-execution/SPEC.md` · exit 0 · `verdict PASS`.
- **P7** — 2026-11-05 16:10 — obligations O1–O23 verified with their evidence recorded above; the two fixture mirrors (`lane-era-lineage`, `workflow-status-sensor`) gained the router's new import, the obligations parser fails closed on a malformed row, and the `## Future` rows follow the published `status`-first shape the vocabulary probe reads.
- **D6** — 2026-11-05, `bun scripts/ceremony.mjs tier classify` → `risk-tier-verdict@1`: `tier: standard`, `reason_kind: executable-content` (9 executable paths), `task_size.ceremony: unit-doc`, `task_size.contained_risk: contained` — copied verbatim into `## Risk tier`.
- **L2** — 2026-11-05, the owner's instruction, verbatim: "Abre la PR mientras se completa la review" — the PR opens before the review rather than after it: the branch is pushed, PR [#419](https://github.com/gtrabanco/agentic-workflow/pull/419) is open, and the lane's ordered close-out (`/review-change` receipt → `/audit-pr`) still applies and is still owed.
- **P8** — 2026-11-05 18:40 — branch pushed (`feat/294-relay-orchestrated-lane`, 8 commits) with the pre-push gate PASS, PR #419 opened against `main`, roadmap row 82 settled `done · [#419]` through the crate's writer.
- **G5** — 2026-11-05, `git push -u origin feat/294-relay-orchestrated-lane` · pre-push hook `local-gate: PASS — 7 step(s) in 102s`. `bun scripts/roadmap-settle.mjs` · exit 0 · `verdict: PASS`.
- **G4** — 2026-11-05, `bun scripts/local-gate.mjs --skip-network` · exit 0 · 7 steps PASS in 106s (workspace install, schema build, both crate suites, root suite, content parity, dependency pins). The full run stops at `pi-compat-guard` — the recorded pre-existing registry/source-resolution failure above, whose input set is byte-identical to the base.
- **G3** — 2026-11-05, `bun scripts/run-root-suite.mjs` · exit 0 · 83 suites PASS. `bun scripts/promise-coherence.mjs` · exit 0 · `verdict PASS`, 32 claims checked. `bun scripts/vocabulary-probe.mjs` · exit 0 · 0 violations. `bun scripts/check-skill-context.mjs` · exit 0 · 28 skills; `--routes` 14 routes; `--documents` 3 documents.
- **D7** — 2026-11-05, owner (external-verify correction): the coherence checklist's item (d) named an "AC-section hash recorded at triage" that no surface wrote — a dangling contract. The design step now freezes the section at record time: `ac-hash:` in the unit doc's frontmatter, computed with the section parser's own semantics (the command lives once, in `DESIGN.md` §Fixed output contract; `REVIEW.md` and `RELAY.md` item (d) point at it), and this doc records its own value. No requirement, gate or validator changed; the impact set is prose, the template comment and this frontmatter line — no executable path — so the test-impact verdict is `empty`.
- **G6** — 2026-11-05, after the correction: `bun test` over the ten impacted suites (relay-packet, relay-route, unit-route, catalog, lane-era-lineage, knowledge-honesty-contract, residue-dimensions, spec-by-reference, scaffold-parity, golden-fixture) · exit 0 · 235 pass / 0 fail. `bun scripts/check-skill-context.mjs` · exit 0 · 28 skills; `--routes` · exit 0; `--documents` · exit 0. `bun scripts/phase-lint.mjs docs/features/82-relay-lane-execution/SPEC.md` · exit 0 · fingerprint unchanged. The re-recorded `ac-hash:` recomputes to the recorded value at this head. `bun scripts/promise-coherence.mjs` · exit 0 · 29 checked / 16 skipped (row 82 is `done` · [#419], so this unit is closed evidence — the `32 checked` in `G3` was its in-flight scan before the settle).

## Next

Owner verification: read the seven commits, re-run the verification block below, and give the verdict. After the verdict and with a PR open, the lane's ordered close-out is unchanged — `/review-change 82-relay-lane-execution` posts the SHA-bound receipt, then `/audit-pr <PR-url>` is the merge gate.

## References

- Issue [#294](https://github.com/gtrabanco/agentic-workflow/issues/294) — this unit. `Closes #294`.
- Roadmap row 82 (`docs/ROADMAP.md` §Features).
- Issue [#293](https://github.com/gtrabanco/agentic-workflow/issues/293) — the D1/D3/D4 seam this unit closes structurally; [#291](https://github.com/gtrabanco/agentic-workflow/issues/291) (per-phase hand-off and `budget_tier`) shipped as feature 73.
- pi-web Relay package `@jmfederico/pi-relay` (`relay`, `relay-runner`, `dispatch_relay`) — anchor documents and dispatch bounds verified from the shipped source.
- PR: https://github.com/gtrabanco/agentic-workflow/pull/419
