---
type: fix
scope: large
ac-hash: b40f4a04c4be19d6654b7545eaf6f9baf7c21e2509ea6345b78a5393a6451038
---

# fix/260-subagent-first-execution

> Fix specification for issue #260 (roadmap row 68, delivered through the fix
> lane per the owner's explicit apply request of 2026-11-08). Scope is the
> execution topology: a non-executing orchestrator that designs, briefs and
> verifies while atomic work runs in context-free subagents on a cheap model,
> with the substrate, resource guards and document verifier this requires.

## Issue

`#260` — NEW FEATURE: Subagent-first execution — atomic work on free-context
cheap models, design and verification retained. The PR closes it via
`Closes #260`.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words
verbatim. S1 is the master request; S2–S7 are the issue body's decided
requirements (the superseded T0/T1/T2 tiers and the single-dial pruning
framing are excluded — corrected in-thread 2026-10-21/28 under #307); S8–S9
are the owner's three apply-request answers of 2026-11-08.

**S1 — Master request.**
> Apply to this repository: issue #260

**S2 — Topology: a non-executing orchestrator.**
> 1. **Topology: a non-executing orchestrator.** Existing routing assigns a
>    tier to a turn; the model that runs the turn does the work. Here the
>    orchestrator **never executes** — it freezes the design, writes a brief
>    with exact files, exact values and the exact gate command, and
>    **verifies by running**.

**S3 — Delegate contract and orchestrate mode.**
> 1. **Delegate contract.** A skill/step may declare atomic work units as:
>    exact target files, the exact gate command, and the exact expected
>    values. The orchestrator spawns a context-free subagent on the cheap
>    tier, then verifies by running the gate and reading the diff — never by
>    trusting the subagent's summary.
> 2. **Orchestrate mode.** `unit-lane` / `execute-phase` gain an explicit
>    orchestrate path that does not execute in-orchestrator, plus the
>    two-axis classifier above (size → tracking, risk → verification depth)
>    as its first decision. Default tier for delegates: cheap; `"auto"`
>    stays the operator's explicit escape (per #201's shape).

**S4 — Substrate: pi-extensible-workflows dependency (owner call 2026-11-08).**
> Substrate for the subagent dispatch layer — the issue's 'Still open' owner
> call at planning time? — Answered: selected piew-dependency ("Adopt
> pi-extensible-workflows 6.3.0 dependency").

**S5 — Optional resource-limit configuration (owner decision 2026-10-28).**
> 6. **Optional resource-limit configuration** (owner, 2026-10-28):
>    parallelism and resource use (RAM, CPU/threads) must be configurable
>    with explicit caps (e.g. "12 of 64 GB", "2 of 80 threads"). The
>    configuration is **optional**: by default the layer runs automatically —
>    self-detecting host resources with conservative defaults, truly
>    automatic where possible.

**S6 — Progress-led guards with bounded trials (2026-10-27 refinement).**
> The design consequence for #260: the subagent runtime should treat every
> spawn as a *bounded, observable trial* by default — expectation + heartbeat
> + soft bound — with hard bounds as the cheap discovery mechanism, and
> check-in as the interface to the orchestrator. Parallelism policy … is
> deferred when observation shows the host is the constraint, not because a
> threshold said so a priori.
>
> [Layering] 1. **B** — expectation + heartbeat + check-in (the decision
> loop) 2. **A-soft** — MemoryHigh/CPUQuota (informed throttling; the task
> continues) 3. **A-hard** — MemoryMax (the cheap discovery of "does not
> fit", with receipt) 4. **Receipts → B** (evidence for re-deciding;
> anti-retry) 5. Host cgroup floor (co-tenancy; already in place here).

**S7 — Document verifier, distinct from the writing CLI (non-negotiable 2).**
> 2. **A document verifier, distinct from the document-writing CLI.** The
>    runner crate's `edit` CLI writes unit docs; a **verifier** checks what
>    was written against the frozen schemas (`UNIT_DOC_REQUIRED_SECTIONS`,
>    `EVIDENCE_COLUMNS`, `PROGRESS_ENTRY_PATTERN`, roadmap columns,
>    CHANGELOG pattern) and fails closed. Writer and verifier stay separate
>    tools; `scripts/phase-lint.mjs` is the existing precedent for the
>    pattern. **It must be a deterministic script, not LSP.**

**S8 — Sequencing and delivery (owner answers 2026-11-08).**
> Mechanism carriers — Answered: selected 201-first ("Execute #201 from its
> existing branch plan first; #260 builds on its merged surface."); Delivery
> strategy — Answered: selected single-pr ("One branch (feat/260-…),
> conventional commits per slice, one PR closing #260.").

**S9 — The four non-negotiables survive any pruning (owner-decided 2026-09-24).**
> 1. **An external verifier.** Verification is never performed by the
>    writer. … 2. **A document verifier, distinct from the document-writing
>    CLI.** … 3. **Evidence and acceptance criteria keep being authored.** …
>    4. **Engram persistence.** The unit's goal, acceptance criteria, evidence
>    and discoveries are saved to Engram at unit boundaries.

**S10 — Execution layer ownership (owner decision 2026-10-28).**
> 5. **Execution layer ownership** (owner, 2026-10-28): the subagent
>    execution layer stays **in `@gtrabanco/pi-agentic-workflow`** — it does
>    not move to the future runtime-platform project.

## Impact

- `packages/agentic-workflow/src/` — two new deterministic modules behind two
  new subcommands: `verify` (the document verifier, sibling to the `edit`
  writer CLI) and `resources` (host detection + bounded-trial admission).
- `packages/pi-agentic-workflow/src/config/{types,schema,merge}.ts` — the new
  optional `subagents` root key (parallelism + resource caps); every
  pre-existing key's validation stays byte-identical.
- `packages/pi-agentic-workflow/package.json` — the pinned
  `pi-extensible-workflows` dependency and its `pi.extensions` registration
  through the node_modules resource path (only the `subagents` extension —
  the workflow-engine, starter and trajectory extensions stay unloaded).
- `skills/unit-lane/SKILL.md`, `skills/execute-phase/SKILL.md` (+ one
  reference) — the orchestrate contract prose; context budgets re-checked.
- `docs/ROADMAP.md` row 68 (status flip via the emitter's shapes), the
  `## Fixes` table row, a changeset, `docs/LOGS.md`.
- Consumers downstream: #173's migration target (the machine-checked subset
  verify() enforces), #174 (lifecycle must follow spawned work — recorded,
  not built here), #284 P2 (pi-durable upgrade path stays open).

## Retirements

Additive unit — no surface is removed. The orchestrator contract supersedes
no existing prose: the absorbed gap note in ROADMAP row 68 ("running
`/unit-lane` bare … hands execution back to the owner one
`/execute-phase <NN> P<k>` press per phase") is the narrative this topology
replaces, and the row's re-cut lands in the same change via the emitter;
`rg -c "one manual .?/execute-phase" docs/ROADMAP.md` → 0 after. Nothing else
has a no-consumer claim: the four non-negotiables and the deterministic
producers all keep their owners.

## Non-goals

- **Measured acceptance over ≥3 real units** (Mechanics 8) — it needs units
  executed after this topology lands; recorded as a standing Future cost, not
  silently dropped.
- **No new spawn runtime** — pi/piew own the spawn mechanics; this unit adds
  the deterministic guards, the config surface and the prose contract, never
  a second spawn implementation.
- **No pruning without an owning script** — no guard, receipt or ledger row
  is removed in this unit; the pruning invariant stays per-item.
- **No T0/T1 path without the deterministic gate** — cheap tiers remove
  ceremony, never checks.
- **#174's lifecycle and #206's design gate** — adjacent, not absorbed.
- **No LLM in a deterministic step**; no LSP-based document verification
  (verified finding 2026-09-24, corrected 2026-09-25).
- **No `suggested_tier` amplification, no settings picker** — #154's surface.

## Risk tier

- **Tier** — `standard` · **Task Size** — `large`
- **Named high-risk item** — none — not a high-tier unit

(Tier verdict, verbatim: `contract: risk-tier-verdict@1 · tier: standard ·
reason: 1 path(s) carry executable content: skills/unit-lane ·
reason_kind: executable-content · task_size: understood, contained_risk:
contained, resumable_from_diff: true, ceremony: unit-doc, verification:
gates · signals: []` — `bun scripts/ceremony.mjs tier classify --paths
skills/unit-lane skills/execute-phase packages/agentic-workflow/src
packages/pi-agentic-workflow/src/config`, exit 0, 2026-11-08.)

## Future

- **Measured acceptance protocol** (2026-11-08) — for ≥3 real units executed
  under the landed topology, record strong-model tokens and wall-clock
  before/after per tier; a measured reduction with no regression in the four
  non-negotiables is the topology's exit criterion. Status: `open`.
- **pi-durable checkpoint-resume verdict** (#284 P2) — if confirmed, the
  persistence layer under the delegate contract may swap; the contract does
  not change. Status: `open`.

## Future cost

- Every future executed unit under the orchestrate path records its tier,
  verification depth and the token/wall-clock row (binds: the lane's
  execution steps; feeds the measured-acceptance Future row).
- The `subagents` config key is a published config surface: breaking its
  shape later needs a versioned migration note (binds: pi package maintainers).
- The document verifier's violation vocabulary is a user-facing contract:
  new checks append codes, never rename them (binds: crate maintainers).

## Applicable tests

- `packages/agentic-workflow/test/verify.test.mjs` — the document verifier's
  suite (RED first), including the two frozen-failure reproducers.
- `packages/agentic-workflow/test/resources.test.mjs` — detection + admission
  suite (RED first).
- `packages/pi-agentic-workflow/test/config-schema-subagents.test.mjs` +
  `config-merge-subagents.test.mjs` — config key suites (RED first).
- Repo gates: `bun scripts/local-gate.mjs`; budgets after skill edits.

## Known pre-existing issues

- `docs/fix/201-operator-approved-pass-routing/SPEC.md` D3(b): the budgets
  emitter writes `estimateMax`/`linesMax` while the route checker reads
  `routeEstimateMax`/`routeLinesMax` — emitter/checker drift. **Does not
  affect** this unit unless a route ceiling must move; the same disclosed
  hand-edit pattern (with disclosure) applies if it does.
- `bun` reports version 1.4.4-canary.1 locally; gates are runtime-agnostic.
  **Does not affect** this unit (gate runs under both runtimes by design).

## Acceptance criteria

- [ ] AC1 (read-verified, S2+S3): the orchestrate contract is in the two
      executing skills — `rg -n "never executes|orchestrate" skills/unit-lane/SKILL.md skills/execute-phase/SKILL.md` → ≥1 match each; the delegate brief names exact target files, exact gate command, exact expected values, `expected_duration` and resource `requirements`; verification is "run the gate and read the diff — never by trusting the subagent's summary"; and `bun scripts/check-skill-context.mjs` exits 0 after the edits.
- [ ] AC2 (command-verified, S4): `rg -n '"pi-extensible-workflows"' packages/pi-agentic-workflow/package.json` → the exact `6.3.0` pin; `rg -n 'pi-extensible-workflows' packages/pi-agentic-workflow/package.json` shows the `pi.extensions` registration path into `node_modules`; `bun install` exits 0; the registration loads only the subagents extension (grep of the package.json `pi` block — the engine/starter/trajectory extensions are absent).
- [ ] AC3 (command-verified, S5): `agentic-workflow resources detect --json` exits 0 and prints the host envelope (memory total/available, cores, cgroup limit if any, derived parallelism); the envelope is byte-stable for the same readings (asserted on injected readings — live `MemAvailable` moves between runs by nature, so the CLI assertion is structural), and with caps forced low the derived parallelism is `serial`.
- [ ] AC4 (command-verified, S6): `agentic-workflow resources admit` refuses a spawn whose brief carries no expectations (exit 2, reason names the missing field), refuses a requirement over the declared cap (exit 2, receipt names requirement vs cap), admits a fitting bounded trial (exit 0), and blocks an identical re-run after a recorded bound-kill receipt unless the task spec changes (exit 2, `receipt` names the prior task).
- [ ] AC5 (command-verified, S5): the pi package suite covers the `subagents` key — valid shapes accepted (`parallelism: "serial"|"auto"|<int>`, cap strings), unknown inner keys rejected, merge carries the key project-over-global; `cd packages/pi-agentic-workflow && bun run test` exits 0.
- [ ] AC6 (command-verified, S7): `agentic-workflow verify docs/fix/201-operator-approved-pass-routing/SPEC.md` exits 0 (a real published unit doc passes); a fixture doc (a) missing a required section, (b) carrying an unclosed (`planned`) obligations row, or (c) carrying a fabricated receipt mark (head sha absent from git, or a mark dated in the future) exits 2 with `VERIFY REFUSAL —` naming each violation — reproducers for the 2026-09-24 fabricated receipt and the fix-258 unclosed-ledger failures.
- [ ] AC7 (command-verified, S8): the differential check — every touched deterministic command run against `git archive` of the base commit in `mktemp -d` produces stdout/stderr/exit identical to the change for pre-existing inputs; `bun scripts/local-gate.mjs` exits 0 at HEAD.
- [ ] AC8 (evidence, S9): the unit's goal, acceptance criteria and discoveries are persisted to Engram at the unit boundary (observation id recorded in `## Log`); `mem_context` returns the project's unit-boundary record.
- [ ] AC9 (command-verified, S1+S8+S10): the delivery wiring is machine-emitted — ROADMAP row 68 re-cut by the emitter's shapes, the `## Fixes` row and changeset present, the piew registration lives in `packages/pi-agentic-workflow/` (execution-layer rule), and the work arrived as conventional commits on `feat/260-subagent-first-execution` for one PR; hand-edited surfaces (the `## Fixes` row) are disclosed in `## Log` as the 201 unit did.

## Tasks

- P1 — Freeze the planning ledgers: this unit doc + `planning-evidence.md` +
  `planning-obligations.md`, ac-hash stamped, triage block pasted
  (validator: `bun scripts/unit-route.mjs --triage 260-subagent-first-execution` exits 0)
  (Implements: S1, S8)
  Relevant files: docs/fix/260-subagent-first-execution/
- P2 — Document verifier, red-first: `packages/agentic-workflow/test/verify.test.mjs`
  lands red (missing module + the AC6 fixture assertions), then
  `packages/agentic-workflow/src/verify/Verify.mjs` + the
  `agentic-workflow verify` CLI wiring land green
  (validator: `bun test packages/agentic-workflow/test/verify.test.mjs` exits 0)
  (Implements: S7, S9)
  Relevant files: packages/agentic-workflow/src/verify/, packages/agentic-workflow/bin/agentic-workflow.mjs
- P3 — Resource admission, red-first: `packages/agentic-workflow/test/resources.test.mjs`
  lands red, then `packages/agentic-workflow/src/resources/{detect,admit}.mjs`
  + the `agentic-workflow resources detect|admit` CLI wiring land green
  (validator: `bun test packages/agentic-workflow/test/resources.test.mjs` exits 0)
  (Implements: S5, S6)
  Relevant files: packages/agentic-workflow/src/resources/, packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — pi config `subagents` key, red-first: the two config suites land red,
  then `types.ts`/`schema.ts`/`merge.ts` accept and validate the key
  (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S5, S6)
  Relevant files: packages/pi-agentic-workflow/src/config/
- P5 — Substrate adoption: pin `pi-extensible-workflows@6.3.0`, register the
  subagents extension through the node_modules resource path, verify the
  installed package's actual extension contract, document the substrate and
  the disable knob in the package README
  (validator: `bun install` exits 0; `rg -n 'pi-extensible-workflows' packages/pi-agentic-workflow/package.json` matches pin + registration)
  (Implements: S4, S10)
  Relevant files: packages/pi-agentic-workflow/package.json, packages/pi-agentic-workflow/README.md
- P6 — Orchestrate prose: the non-executing orchestrator, delegate brief and
  verify-by-running contract in `unit-lane` and `execute-phase`, consuming
  `resolve-passes` (201), `resources` (P3) and the piew tools (P5); budgets
  re-checked
  (validator: `bun scripts/check-skill-context.mjs` exits 0; AC1 rg anchors match)
  (Implements: S2, S3, S6)
  Relevant files: skills/unit-lane/SKILL.md, skills/execute-phase/SKILL.md
- P7 — Wiring: ROADMAP row 68 emitter update, `## Fixes` row (disclosed hand
  edit — no row-writer exists), changeset, and the fix-index pointer
  (validator: `agentic-workflow roadmap check docs/fix/260-subagent-first-execution/SPEC.md` exits 0)
  (Implements: S1, S8, S10)
  Relevant files: docs/ROADMAP.md, .changeset/
- P8 — Verification and handoff: local gate, differential vs base, obligations
  closure, Engram persistence, session log
  (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S7, S9)
  Relevant files: docs/LOGS.md

## Triaged steps

> Pasted verbatim from `bun scripts/unit-route.mjs --triage
> 260-subagent-first-execution` (2026-11-08):

```text
TRIAGE — 260-subagent-first-execution (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

(The triage's `relay` bootstrap hint is declined by this apply-request's own
§4 rule: the repo's relay machinery never runs on its own surgery — the
frozen ledgers are the plan; no Relay packet is created.)

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #260
  ```
- **L2** — 2026-11-08, the owner's three apply answers, verbatim: substrate —
  "selected piew-dependency"; sequencing — "selected 201-first"; delivery —
  "selected single-pr".
- **E1** — 2026-11-08, `bun scripts/ceremony.mjs tier classify --paths skills/unit-lane skills/execute-phase packages/agentic-workflow/src packages/pi-agentic-workflow/src/config` · exit 0 · `tier: standard`, `reason_kind: executable-content`, `signals: []`.
- **E2** — 2026-11-08, `bun scripts/unit-route.mjs --triage 260-subagent-first-execution` · exit 0 · steps plan/implement/tests/evidence/review/docs; block pasted into `## Triaged steps` (the relay bootstrap hint declined by the apply-request's inline-surgery rule).
- **P1** — 2026-11-08, #201's merged surface landed as the base (12 commits, gate PASS on its branch per its E16) · merge 203a9875.
- **P2** — 2026-11-08, unit ledgers frozen (SPEC + planning-evidence + planning-obligations) · 4665f88f.
- **P3** — 2026-11-08, document verifier red-first: suite red b3322a6c (missing module) → green c74ce777 (`verify` + CLI; 12 tests).
- **D1** — 2026-11-08, disclosed checker decision found on the published 201 doc: the fix-lane templates' `## Acceptance criteria` is a tolerated section in the re-cut shape (feature 61 made it the canonical acceptance source; the #308 shape list predates it) — recorded on the checker, never on the shape grammar; `Evidence`/`Progress log` remain half-migration signals.
- **D2** — 2026-11-08, disclosed checker decisions found on the published 201 ledger: cells split on unescaped pipes (`\|` is markdown escaping), and a status cell of `verified — <evidence pointer>` closes (the token boundary, not equality).
- **P4** — 2026-11-08, resource layer red-first: suite red 3718268b (missing module) → green c0f04c66 (`detect` + `admit` + CLI; 13 tests); AC3's byte-stability wording corrected to same-readings (live MemAvailable moves between runs) with the ac-hash re-stamped.
- **P5** — 2026-11-08, pi config `subagents` red-first: suites red 98bef6b2 (8 failing) → green dc973305 (types/schema/merge/defaults; 632 pass bun + node); the `default-inherit` shipped-shape pin records the new key (the 201 precedent) and the `subagents` key validates strictly (parallelism serial|auto|positive-int; cap strings "<n> of <m> <unit>").
- **P6** — 2026-11-08, substrate adoption: piew 6.3.0 pinned exact, the subagents extension registered through the node_modules resource path, README documents substrate + disable knob + `subagents` key · ab678011.
- **E3** — 2026-11-08, PE-011 closed: `node -e 'import("./node_modules/pi-extensible-workflows/dist/subagents/index.js")'` → import ok; the dist's own tool table names exactly `subagents_run`, `subagents_inspect`, `subagents_steer`, `subagents_stop`, `subagents_retry` (dist/subagents/index.js:5787–5791, 10754–10791); `subagents_run` takes `model: "provider/model:thinking or alias[:thinking]"`. Only the subagents extension is registered.
- **P7** — 2026-11-08, orchestrate prose: `skills/unit-lane/references/ORCHESTRATE.md` (the contract's owner) + the declared-mode pointers in both SKILL.md files; route ceilings re-based with the growth source declared · df3ac095.
- **P8** — 2026-11-08, wiring: roadmap row 68 re-cut by `roadmap docs/ROADMAP.md rowUpsert` (findRow re-emit, status "in-progress · carried by fix #260"); the `## Fixes` row is a disclosed hand edit (no row-writer for the 4-column shape, the 201 D3(a) precedent); changeset; `docs-generate` regenerated the projection · 5f0c2fa0.
- **E4** — 2026-11-08, `bun scripts/skill-lint.mjs` · exit 0 · PASS; `bun scripts/check-skill-context.mjs` · exit 0 · PASS (29 skills); `--routes` · exit 0 · PASS (14 routes, after the declared re-basis).
- **P9** — 2026-11-08, gate extension red-first: the pi-compat guard's every-dependency-is-a-sibling premise refused the first third-party dependency; suite red 71e501a8 → guard extended (third-party deps install at their declared spec; @gtrabanco deps without a sibling still refuse) · 9dab6821.
- **E5** — 2026-11-08, differential vs `git archive 203a9875` in `mktemp -d` (scratch removed after): `memory probe --json`, `journal name --kind mechanical`, `log render --facts -` (malformed), `resolve-passes` golden — stdout/exit **SAME** in all four.
- **D3** — 2026-11-08, disclosed live-tree-guard catch: the foreground `resources detect --memory-cap "1 of 64 GB"` run exposed the CLI storing kebab-case flags under literal keys (`memory-cap`) while the caps block read `memoryCap` — the operator's cap silently dropped and the envelope derived "max". Fixed red-then-green: the suite gained the missing CLI flag layer, the parser maps each flag to the key the code reads · aaacc4d4.
- **E6** — 2026-11-08, foreground: `agentic-workflow verify docs/fix/201-operator-approved-pass-routing/SPEC.md` · exit 0 · VERIFY PASS (O6); `agentic-workflow resources detect --json` · exit 0 · envelope 11.4 GB effective / 6 cores / derived max, and `--memory-cap "1 of 64 GB"` → effective 1 GB / derived serial (O3); `resources admit --expect '{}'` · exit 2 · refusal names expected_duration + requirements (O4); the anti-retry foreground run: allow → receipt flipped to bound-kill → identical re-run refused exit 2 naming the prior task (O4, scratch record dir removed after).
- **E7** — 2026-11-08, `bun scripts/local-gate.mjs` · exit 0 · **PASS — 13 step(s) in 149s** at the final tree.
- **E8** — 2026-11-08, Engram persistence at the unit boundary: the unit's goal, ACs and discoveries saved (observation id 2577, topic key `unit-260-subagent-first-execution`); recallable via the topic key (O12; AC8).
- **E9** — 2026-11-08, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/260-subagent-first-execution/SPEC.md` · exit 0 · PASS, 0 violations (O13).
- **E10** — 2026-11-08, `bun test packages/agentic-workflow/test/` at the final tree · exit 0 · 515 pass · 0 fail (crate suites incl. verify, resources, resolve-passes).
- **D4** — 2026-11-08, owner delivery decision (answer to the #464 state report): "Esperar a que #464 se mergee, luego se incorporan los cambios en esta PR, se reconcilian y se revisa si se ha roto algo o falta algo por integrar o hay que modificar algo. Luego review independiente y si no hay findings, merge manual hecho por mi". Delivery order: (1) #464 merges first (owner's PR, owner's verdict — this branch never pushes to it); (2) main is integrated into `feat/260-subagent-first-execution` and reconciled — the branch already carries #201's content via merge 203a9875, so the integration is expected to be content-neutral or minimal, verified by the differential check; (3) reconcile-check for breakage or missing integration; (4) an independent review pass — the owner's explicit order here overrides this apply-request's inline-surgery rule for that one pass; (5) the owner merges manually. The prior handoff report's claim that #201 was "sin PR" was wrong (PR #464 existed, opened by the #201 session) — corrected to the owner when the state was re-checked.
- **D5** — 2026-11-08, owner follow-up: "Crea la PR de esta feature primero" — the explicit order supersedes D4's wait step; the branch is pushed (the pre-push hook ran the offline gate subset: PASS, 9 steps) and **PR #467** opened (base main, `Closes #260`, evidence pack per the template). D4's post-merge order stands unchanged: integrate main, reconcile, independent review, owner merges.

## Next

PR #467 open (https://github.com/gtrabanco/agentic-workflow/pull/467). When #464 merges: integrate main into this branch, reconcile (D4), run the declared verification, then the independent review pass.

## References

Issue #260 (body + 17 comments, read 2026-11-08); roadmap row 68; fix unit
`docs/fix/201-operator-approved-pass-routing/` (the base surface); #307 (the
two-axis ceremony contract); #284 P2 (pi-durable verdict); pi packages docs
(dependencies load through node_modules resource paths).

## Branch

`feat/260-subagent-first-execution`

## Depends on

`201-operator-approved-pass-routing` (merged into this branch 2026-11-08).

## Regression scope

- Pre-existing config keys validate byte-identically —
  `cd packages/pi-agentic-workflow && bun run test` exits 0.
- `resolve-passes` output unchanged —
  `bun test packages/agentic-workflow/test/resolve-passes.test.mjs` exits 0.
- The `edit` unit-doc writer and its `validate` op behave unchanged —
  `bun test packages/agentic-workflow/test/` exits 0.
- Skills stay within budgets — `bun scripts/check-skill-context.mjs` exits 0.
