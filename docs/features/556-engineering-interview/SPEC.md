---
type: feature
scope: medium
roadmap_summary: extend init-workspace's charter interrogation with a repo-objectives interview and a bibliography-backed technical question bank (charter layer 3)
---

# 556 — engineering-interview

> One-line: extend `init-workspace`'s charter interrogation (charter layer 3) with a repo-objectives interview and a bibliography-backed technical question bank, so the substrate records *why-grade* engineering decisions.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Repo objectives interview.**
> "repo purpose, users, team shape (solo/small/large), optimization target (speed vs stability vs compliance), automation appetite — each answer recorded with the workflow consequence it toggles."

**S2 — Technical question bank (testing).**
> "Testing strategy — Cohn's test pyramid; Feathers characterization tests for legacy code; property/fuzz appetite (feeds verification-contract's existing validator slots)."

**S3 — Technical question bank (architectural boundaries).**
> "Architectural boundaries — Evans (bounded contexts → module boundaries), Parnas (information hiding); per boundary: is it enforced in machine (lint/dependency-analysis/CI) or prose only? — the answer feeds the verification-materialization issue."

**S4 — Technical question bank (dependency policy, production verification, decision records, API posture).**
> "Dependency policy — pinning posture, vendoring appetite, deprecation handling (Fowler's smells as the vocabulary). Production verification — Humble & Farley (Continuous Delivery) pipeline-as-verification; SRE book SLIs/error budgets; observability appetite. Decision records — Nygard ADRs as the home for answer provenance. API posture — design-for-misuse / safer-API-over-exception (Meyer's DbC as vocabulary)."

**S5 — Checklist-first qualification.**
> "a question earns its place only when two plausible answers change a workflow behavior downstream (CONTRA-style). No universal questionnaire; simple installs never earn the full bank."

**S6 — Team-adaptation knob.**
> "team conventions override every default; the bank records the default as a dated assumption, never as an override of an existing team rule."

**S7 — Bootstrap output.**
> "Bootstrap on a bare repo runs objectives + technical layers and writes every concrete answer into the agent guide's `## Project charter` / registered criteria catalogue, with unanswered items as dated assumptions — `init-workspace` output diff shows them; no placeholder survives where an answer was given."

**S8 — Question catalog citation.**
> "Every question in the bank cites its bibliography source and states the workflow behavior its answer toggles; a question failing that rule fails the route's own check."

**S9 — Convention precedence.**
> "An install over a team that already declares a convention records the team's rule and never the bank's default (fixture: pre-seeded convention survives bootstrap)."

**S10 — Enforcement answer capture.**
> "The enforcement-prose-or-machine answer for each declared boundary is written where the materialization step reads it."

**S11 — Context budget compliance.**
> "the bank is a reference loaded only when the route reaches the interview (entrypoint stays within the committed ceiling)."

## Acceptance criteria

- AC1 — S1: the bank carries one objectives-layer row per dimension the issue names (purpose, users, team shape, optimization target, automation appetite), and each names the workflow behaviour its answer toggles. (check: `rg -c '^\| OBJ-[0-9]{2} \|' skills/init-workspace/references/ENGINEERING_INTERVIEW.md` prints 5, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs charter check --guide template/AGENTS.md --bank skills/init-workspace/references/ENGINEERING_INTERVIEW.md` exits 0)
- AC2 — S2: the testing area carries Cohn's pyramid, Feathers' characterization tests and the property/fuzz appetite, each with its citation. (check: `rg -c '^\| TST-[0-9]{2} \|' skills/init-workspace/references/ENGINEERING_INTERVIEW.md` prints 3, and the rows name `Cohn`, `Feathers` and `QuickCheck`)
- AC3 — S3: the boundaries area declares Evans/Parnas as its vocabulary and asks the per-boundary machine-or-prose question. (check: `rg -n '^\| ARC-02 \|' skills/init-workspace/references/ENGINEERING_INTERVIEW.md` matches 1, and the row's question carries `machine` and `prose-only`)
- AC4 — S4: dependency policy, production verification, decision records and API posture each carry at least one cited question. (check: `rg -c '^\| (DEP|VER|DEC|API)-[0-9]{2} \|' skills/init-workspace/references/ENGINEERING_INTERVIEW.md` prints 5 or more)
- AC5 — S5: a row earns its place only with two behaviour-changing answers and a stated ask condition; a row missing either is refused. (check: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0 with the `row-toggles-single` and `row-applies-when-missing` refusal cases, and every shipped row carries both)
- AC6 — S6: a team convention is never overwritten — `charter land` reports the slot `kept` and leaves its bytes intact. (check: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0 with the `pre-seeded convention survives` case)
- AC7 — S7: a concrete answer lands in the guide's charter slot, and an unanswered slot with a bank default lands as a dated assumption (`assumed <YYYY-MM-DD> — <value>`). (check: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0 with the `written` and `assumed` cases, and `rg -c '^- \*\*(Repo purpose|Users|Team shape|Optimization target|Automation appetite|Testing strategy|Architectural boundaries|Dependency policy|Production verification|Decision records|API posture):\*\*' template/AGENTS.md` prints 11)
- AC8 — S8: the bank's own check refuses a question with no bibliography source or no toggled behaviour, and passes the shipped bank. (check: `bun packages/agentic-workflow/bin/agentic-workflow.mjs charter check --guide template/AGENTS.md --bank skills/init-workspace/references/ENGINEERING_INTERVIEW.md` exits 0, and the same command on a fixture row missing `source` exits 1 with `CHARTER CHECK BLOCKED`)
- AC9 — S9: the pre-seeded-convention fixture survives the landing pass while a placeholder slot beside it receives the answer. (check: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0 with the fixture asserting both slots in one run)
- AC10 — S10: the enforcement answer is written into the guide's `Architectural boundaries` slot in the documented shape (`<boundary> → machine: <mechanism>` or `<boundary> → prose-only`), where the materialization step reads it. (check: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0 with `the enforcement answer has two legal shapes and a filled slot outside them is refused`, and `rg -l 'Architectural boundaries' template/AGENTS.md skills/init-workspace/references/ENGINEERING_INTERVIEW.md` prints both files)
- AC11 — S11: the bank ships as a reference the route loads at the interview, and the entrypoint stays inside its declared ceiling (the ceiling is rebased in this change with its growth source named). (check: `bun scripts/check-skill-context.mjs --skill init-workspace` exits 0, and `rg -c '\(references/ENGINEERING_INTERVIEW\.md\)' skills/init-workspace/SKILL.md` prints 2 — the allowlist entry and the §Charter bullet both name it)

## Impact

- `init-workspace` skill: `§Charter` gains layer 3, the progressive-loading allowlist gains the interview reference, and the two bootstrap references gain the layer-3 round and its write.
- `template/AGENTS.md`: the `## Project charter` section gains the objectives layer and the engineering-posture slots; a bootstrapped project starts with eleven keyed slots instead of six.
- `template/docs/workflow/VERIFICATION_CRITERIA.md`: names the interview as a source of `stamped assumption (dated)` rows, so the posture answers reach the registered criteria catalogue.
- `packages/agentic-workflow`: a new `charter` file service (`state`, `land`, `check`) — the deterministic landing the write step invokes, and the bank's own check. Its bin usage line and README command table are one surface (`test/cli.surface.test.mjs` pins both).
- Consumed by `verification-materialization` (557): S1/S4 of that SPEC read the declared boundary's enforcement answer; this unit writes it into the `Architectural boundaries` slot in a documented shape.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json`: the `init-workspace` main ceiling is rebased with the growth source named (the manifest's own rule), because the entrypoint carries 4 lines of slack today.
- Nothing stops being true: the identity/domain layers (#435) and their write step keep their contracts; layer 3 is added beside them, not over them.

## Retirements

Strictly additive: this unit retires no surface. Its added-surface inventory is the anti-divergence receipt, computed after the change lands (the tree has no base commit before it):

```text
bun scripts/residual-classify.mjs --inventory --base main
```

## Non-goals

- Lane-level pre-spec elicitation (#526 owns it)
- Materializing verification code/config in the target project (557 owns it)
- Any stack/framework-specific question

## Risk tier

**Tier** — `standard` · **Task Size** — `standard`
**Named high-risk item** — `none — not a high-tier unit`

## Future

none

## Future cost

The bibliography citations must stay idea-adapted, never vendored text: a bank row cites author + work as the idea's source, and never copies a passage. A later sweep that adds a row inherits the same cell contract, so attribution stays one rule (`docs/research/ATTRIBUTION.md`).

## Applicable tests

The landing and the bank check are deterministic, so they are tested where the code lives:

- `bun test packages/agentic-workflow/test/charter.test.mjs` — the `charter` file service (`state` / `land` / `check`), its refusal cases, and the shipped bank + template pin.
- `bun scripts/skill-lint.mjs` — the new reference and the edited skill surfaces.
- `bun scripts/check-skill-context.mjs` — the entrypoint stays inside its rebased ceiling; the new reference inside the reference ceiling.
- `bun scripts/normative-drift.test.mjs` — the new `interview-bank` surface row resolves.
- `bun scripts/scaffold-guide.test.mjs` — the template guide stays neutral, visible and undated.
- `bun scripts/test-impact.mjs --base main` — the derived set this change can affect.

## Known pre-existing issues

- `docs/ROADMAP.md` rows 556–558 never name their own issues — issue #569, triaged fix-now; does-not-affect this unit (this unit edits its own unit doc, and the projection re-syncs its summary cell from that doc).
- `bun scripts/worktree-guard.mjs` reports `STALE` for sibling sessions' worktrees (`.worktrees/feat-527-readme-evidence-rationale` and `.worktrees/feat-555-programmatic-runner-detection`, branches already merged into `origin/main`; the count grew while this unit ran) — does-not-affect this unit: the finding names no path this change touches, and this branch's own worktree is clean at the gate's head. Owner: the sessions that own those worktrees remove them.

## Tasks

- [x] P1 — Freeze this unit's planning ledgers and acceptance criteria beside the SPEC (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/556-engineering-interview/SPEC.md` exits 0)
  (Implements: S5, S6)
  - Relevant files: docs/features/556-engineering-interview/SPEC.md, docs/features/556-engineering-interview/planning-evidence.md, docs/features/556-engineering-interview/planning-obligations.md
- [x] P2 — Write the engineering interview reference: the objectives layer plus the eight-cell question bank (validator: `rg -c '^\| [A-Z]{3}-[0-9]{2} \|' skills/init-workspace/references/ENGINEERING_INTERVIEW.md` matches 16)
  (Implements: S1, S2, S3, S4, S5, S6, S10, S11)
  - Relevant files: skills/init-workspace/references/ENGINEERING_INTERVIEW.md
- [x] P3 — Add the layer-3 charter slots to the template agent guide (validator: `rg -c '^- \*\*(Repo purpose|Team shape|Optimization target|Automation appetite|Testing strategy|Architectural boundaries|Dependency policy|Production verification|Decision records|API posture):\*\*' template/AGENTS.md` matches 10)
  (Implements: S1, S7, S10)
  - Relevant files: template/AGENTS.md
- [x] P4 — Land the `charter` service's suite first, observed red on the missing module (validator: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 1 with the missing-module error)
  (Implements: S8, S9)
  - Relevant files: packages/agentic-workflow/test/charter.test.mjs
- [x] P5 — Implement the `charter` file service and document it beside its siblings (validator: `bun test packages/agentic-workflow/test/charter.test.mjs` exits 0)
  (Implements: S6, S7, S8, S9, S10)
  - Relevant files: packages/agentic-workflow/src/charter/interview.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- [x] P6 — Wire the interview round into the skill's charter section and progressive-loading allowlist (validator: `rg -c 'references/ENGINEERING_INTERVIEW\.md' skills/init-workspace/SKILL.md` matches 2)
  (Implements: S5, S6, S11)
  - Relevant files: skills/init-workspace/SKILL.md
- [x] P7 — Wire the discovery round into bootstrap discovery and its landing into the write step (validator: `rg -c 'charter land' skills/init-workspace/references/BOOTSTRAP_WRITE.md` matches 1)
  (Implements: S1, S3, S6, S7, S10)
  - Relevant files: skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md
- [x] P8 — Declare the bank as a normative surface and rebase the skill's context ceiling with its growth source (validator: `bun scripts/normative-drift.test.mjs` exits 0)
  (Implements: S8, S11)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- [x] P9 — Record the evidence, flip the obligation rows, and regenerate the projection (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S7, S11)
  - Relevant files: docs/features/556-engineering-interview/SPEC.md, docs/features/556-engineering-interview/planning-obligations.md, docs/LOGS.md

## Triaged steps

```text
TRIAGE — 556-engineering-interview (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/556-engineering-interview
relay-next: create .pi-web/relays/556-engineering-interview/ (charter → docs/features/556-engineering-interview/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/556-engineering-interview", leg: "1") · legs: 10 = 9 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- L1 — 2026-11-15, the request (GitHub issue #563):
  ```
  NEW FEATURE: init-workspace engineering interview — repo objectives + bibliography-backed technical question bank (charter layer 3)
  ```
- D1 — 2026-11-15, triaged as `promote` — valid feature proposal with clear scope, dependencies, and acceptance criteria. The issue is well-structured (goal, business value, in scope, out of scope, acceptance criteria, dependencies) and aligns with the workflow's charter-driven design principles.
- D2 — 2026-11-16, the deterministic half is a crate file service, not a loose `scripts/` entry: every file service the workflow invokes ships as a `agentic-workflow` subcommand (`packages/agentic-workflow/README.md`), and `init-workspace` runs in a target project that carries no `scripts/` tree (PE-001).
- D3 — 2026-11-16, the bank's data lives in a `table:interview-bank@1` surface in the reference and its cell contract in the same document's fenced block; the check compares the table's header with the declared cells, so a new column cannot arrive unannounced (PE-004).
- P1 — 2026-11-16 06:40, froze this unit's SPEC (S1–S11, AC1–AC10), the evidence ledger (PE-001..PE-010) and the obligations ledger (O1–O17) · `1c2851d0`.
- P2 — 2026-11-16 07:10, the interview bank (16 rows, eight cells, two layers) and the eleven layer-3 charter slots · `4b5ad664`.
- E1 — 2026-11-16 09:20, `bun test packages/agentic-workflow/test/charter.test.mjs` · exit 1 · `Cannot find module '../src/charter/interview.mjs'` — the red commit `2420df6f` carries the suite alone.
- P3 — 2026-11-16 09:25, red suite committed alone · `2420df6f`.
- P4 — 2026-11-16 11:40, the `charter` file service (`state`/`land`/`check`), its bin dispatch, its README row, the discovery round and the write step · `bbecee0a`, `eb9b479d`.
- E2 — 2026-11-16 11:44, `bun test packages/agentic-workflow/test/charter.test.mjs` · exit 0 · 22 pass / 0 fail (the refusal cases, the kept/written/assumed landing, the boundary shapes, the shipped pin, the CLI boundary).
- E3 — 2026-11-16 11:50, `node packages/agentic-workflow/bin/agentic-workflow.mjs charter check --guide template/AGENTS.md --bank skills/init-workspace/references/ENGINEERING_INTERVIEW.md` · exit 0 · `CHARTER CHECK PASS — … 16 row(s) · 22 slot(s)`; the same command on a fixture row without a source exits 1 with `CHARTER CHECK BLOCKED`.
- E4 — 2026-11-16 11:52, the row counts the SPEC's criteria read: `rg -c '^\| OBJ-[0-9]{2} \|'` = 5, `TST` = 3, `ARC` = 2, `DEP|VER|DEC|API` = 6, and the five objectives slots in `template/AGENTS.md` = 5.
- G1 — 2026-11-16 11:56, `bun test packages/agentic-workflow/…` full crate suite · exit 0 · 858 pass / 0 fail across 48 files.
- G2 — 2026-11-16 12:02, `bun scripts/skill-lint.mjs` · exit 0 · 0 finding(s) in 103 files.
- G3 — 2026-11-16 12:04, `bun scripts/check-skill-context.mjs` · exit 0 · PASS context budgets: 30 skills; `--documents` PASS context documents: 4; `--routes` PASS route budgets: 14 routes.
- G4 — 2026-11-16 12:06, `bun scripts/normative-drift.test.mjs` · exit 0 · 21 pass / 0 fail — the `interview-bank` row resolves in the inventory.
- G5 — 2026-11-16 12:08, `bun scripts/prose-gate-inventory.test.mjs` · exit 0 · 22 pass / 0 fail — `charter-bank-shape` is cited and its surface claimed.
- G6 — 2026-11-16 12:10, `bun scripts/docs-generate.mjs --check` · exit 0 · 3 files checked, 0 stale, roadmap unchanged.
- G7 — 2026-11-16 12:12, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/556-engineering-interview/SPEC.md` · exit 0 · `verdict PASS`, nine phases at PASS (6/6).
- D6 — 2026-11-16, the template's layer-3 block first shipped a `Dependency policy` bullet beside the domain layer's own slot of that name; the check now refuses a duplicated key (`slot-duplicate`) and the bullet is gone, so the dependency questions land in the one home the domain layer owns and the shipped charter carries 21 slots, not the 22 the earlier lines in this log ran against. Appended, never an edit of those lines.
- P5 — 2026-11-16 12:14, declared the bank as a normative surface
- D5 — 2026-11-16, correcting D3's wording (appended, never edited): the bank's declared grammar is `block:interview-bank@1` — the fenced cell contract in the reference — and its question rows are the markdown table after that block; a table-marker surface would have been found by the drift gate at a marker-bearing heading, which this document does not carry.
- D7 — 2026-11-16, three criteria named their check loosely and now name it exactly as the tree prints it (AC5's finding codes, AC10's case name, AC11's count of 2 links rather than 1). Corrected before the first review, and recorded here rather than silently rewritten.
- G9 — 2026-11-16 14:09, `bun scripts/local-gate.mjs --skip-network --jobs 2 --no-bail` · 14 of 15 steps exit 0 (version-parity, schema-build, docs projection, journal carrier, log immutability, secret scan, temp hygiene, tmp-gc, rigidity, root-suite 182s, crate bun 206s / node 95s, schema 7s, pi 17s) and the one red step is `worktree-guard`, which names two sibling sessions' merged worktrees and no path of this change — recorded under Known pre-existing issues.
- G8 — 2026-11-16 13:20, `bun scripts/local-gate.mjs --skip-network --jobs 2` · exit 0 · `local-gate: PASS — 15 step(s) in 503s` (root-suite 174s, crate-suite bun 262s / node 127s, schema and pi legs green; the first run's only red was the version-parity step, which the changeset cleared, and the pi node leg's `CRATE_COMMANDS` parity pin, which now lists `charter`).
- D4 — 2026-11-16, the two edges this change had to move on existing surfaces, each with its reason: `scripts/review-loop-discipline.test.mjs` pinned the template's charter-slot count at 11 and the shipped template now prints 22 (layer 3's eleven slots) — the assertion's property (every charter slot prints, none skipped) is unchanged and the count follows the template; `packages/pi-agentic-workflow/scripts/projection.mjs`'s `CRATE_COMMANDS` is the declared set the projection may name, and a newly dispatched bin command enters it (the parity test compares it with the bin's case list). Neither edit relaxes an assertion.
 with its gate row, and rebased the `init-workspace` main and reference ceilings with their growth sources · `9d140350`.

## Next

Owner verdict on the diff (the owner is the external verifier for this repository's own surgery). After the verdict: the owner integrates `main` on the branch and merges, and 557 reads the `Architectural boundaries` slot.

## References

- Depends on: #435 (charter layers 1-2), #526 (checklist-first evidence)
- Consumed by: #564 (verification materialization)
- Evidence: `docs/research/2026-11-15-all-code-is-slop-mapping.md` (owner-directed mapping of Lauren Tan's talk), `docs/research/2026-11-12-input-quality-and-editing/` (checklist-first)
