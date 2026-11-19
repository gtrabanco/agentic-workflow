---
type: feature
scope: medium
---

# 645 — guide-minimalism

> One-line: the host guide carries only what every session must always see, the
> rest loads progressively through its documentation map, and the laws no session
> may violate get a designated always-loaded section whose every row says whether
> a machine enforces it, a recorded reason keeps it prose, or a filed unit owns its
> carrier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

Requirements, each numbered `S#`, quoting the requester's own words verbatim.
`S1` is the turn's instruction; `S2…S6` quote issue #645, which `S1` adopts, plus
the owner amendment of 2026-11-19 that S1's issue carries.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #645

**S2 — The inviolable-rules section.**
> **S1 — The inviolable-rules section (AGENTS.md).** A new, bounded section (machine-region counted like `normative-surfaces@1`) listing every rule a session may never violate. One row per rule: rule id | one-sentence statement (never a restatement — the owner is linked) | materialization state (`materialized: <gate/script>` · `soft-by-design: <reason>` · `materializable: proposed feature`). Seed set from today's rules: no force-push (soft-by-design, #346), no test edits to pass, red-first ordering (`red-first.mjs`), `human-revision-needed` hold, single-home vocabulary residency (materializing via #643), ask-dont-infer (materializing via the substrate-alarm issue), every repetition names its owner (`residue-dimensions.test.mjs`), domain separation (audit-dimension), published-history is owner-written (soft), worktree namespace guard (`worktree-guard.mjs`), docs-language English-only, no backward-compat shims. Each `materializable: proposed` row gets its feature issue **at the same time the section lands** — a rule that stays prose without a recorded reason is the defect this section exists to prevent.

**S3 — The reduction pass.**
> **S2 — The reduction pass (the owner's 2026-11-08 order).** Walk `AGENTS.md` line by line: duplicated rules (kept beside their owner with a pointer instead), contradictions (each resolved with the owner decision recorded), redundant prose, load-bearing ambiguity (rewrite or move). Material moved to a deep reference gains a documentation-map row (one hop). The pass ends with the guide **smaller** than it started, with the ceilings re-based down to the measured boundary — a reduction pass that re-bases upward is a failed pass.

**S4 — Doctrine for target projects.**
> **S3 — Doctrine for target projects (skills level).** `SKILL_AUTHORING.md` and `init-workspace` own the user-project guide shape: the guide they scaffold follows the same doctrine — essentials in the host guide, progressive loading via a documentation map, an inviolable-rules section, and the materialization discipline. `init-workspace`'s interview offers the section; the authored scaffold carries it. This is where the "no invented answers" guarantee (#644 family) meets the guide: a project whose guide lacks the substrate sections is detected there.

**S5 — The package's own guide surface.**
> **S4 — pi-agentic-workflow guide surface.** The package's README/guide prose gets the same pass: what the package must always say (install, the lane contract, the config keys) stays; everything else points to the repo docs. The package has no AGENTS.md gate today — its guide size is bounded by this unit's audit, with the ceiling recorded wherever the package's own contract files live.

**S6 — Enforcement.**
> **S5 — Enforcement.** The section joins the machine region (counted, pinned); `check-skill-context.mjs --documents` keeps enforcing ceilings; the reduction pass records its before/after measurement in the budgets manifest with the growth source (negative). S1's per-row materialization state is auditable: a row whose `materialized:` cell names a gate that does not exist is a fixture red in a suite (same shape as `docs-generated-projection`).

**S7 — The owner amendment: where the section lives, and what it absorbs.**
> **The inviolable-rules section lives in AGENTS.md (owner decision).**
> The laws a session may never violate must be **always-loaded** — a pointer to an on-demand reference defeats the purpose, so the section lands in the guide itself, not in a linked doc. … S1's AGENTS.md section adopts that design: declarative slot where the rule is project-tunable, fixed prose where the rule is host-fixed. … Each row carries: rule id | one-line statement | owner pointer (never a restatement of the owner's mechanism) | materialization state (`materialized: <gate>` · `soft-by-design: <reason>` · `materializable: <feature issue>`). Rules that are restatements of an owner surface cite it; the section's own additions are the laws that had no home.

**S8 — The two-tier decision recorded.**
> `ARCHITECTURAL_INVARIANTS.md` keeps its project-domain role (decision recorded, no shell-into-laws conversion). … The unit records this two-tier decision in the unit doc: host laws → AGENTS.md always-loaded section; project-domain invariants → the ARCHITECTURAL_INVARIANTS template.

**S9 — The doctrine applies at all three levels.**
> The doctrine applies at all three levels the workflow ships: (1) this repository's `AGENTS.md`, (2) the guides the skills tell target projects to write (`init-workspace`, `SKILL_AUTHORING.md`), and (3) `packages/pi-agentic-workflow`'s own guide surface (its README/guide prose).

**S10 — Out of scope, verbatim.**
> - The vocabulary residency corrections and inventory re-pointing (owned by #643).
> - The substrate alarm and needs-input routing (owned by its own issue, same family).
> - Any new rule content — this issue structures the rules that exist; a genuinely new rule is its own unit.
> - Mechanical enforcement of the force-push ban (soft-by-design stays soft; #346 owns that decision).

**S11 — The verification sketch.**
> - Before/after: `bun scripts/check-skill-context.mjs --documents` — lines, prose, est all **lower** than 728/571/13,259; the manifest records the reduction with its arithmetic.
> - The inviolable-rules section is machine-counted and every row's materialization cell resolves (gate exists / soft reason recorded / feature issue linked).
> - `rg` audit: no rule statement duplicated outside its owner without a pointer (`residue-dimensions.test.mjs` stays green and its rule count grows only for the new section's own lint).
> - `init-workspace` scaffold + upgrade produce the guide shape with the section (suite red-first); `packages/pi-agentic-workflow` guide measured with its recorded ceiling.

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it. Frozen at the plan cut; a criterion is never rewritten at close.

| id | requirement | criterion | proving check |
|---|---|---|---|
| AC-S1 | S1 | the unit dir carries this document, `planning-evidence.md`, `planning-obligations.md` and `decisions.md`, and every obligation row is `verified` or an evidenced `n/a` | `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/645-guide-minimalism/SPEC.md` exits 0 · `rg -c 'planned\|in-progress' docs/features/645-guide-minimalism/planning-obligations.md` matches 0 |
| AC-S2 | S2 | `AGENTS.md` carries one `## Inviolable rules` section holding the `inviolable-rules@1` block with one row per law, each row's owner pointer and state resolving | `bun scripts/inviolable-rules.mjs` exits 0 and prints `PASS inviolable rules: 14 rows` |
| AC-S3 | S3 | the guide measures **fewer** lines, prose lines and estimated bytes than the pre-change 745 / 565 / 13,586, and the manifest's ceilings are re-based **down** to `ceil(measured × 1.10)` | `bun scripts/check-skill-context.mjs --documents` exits 0 and prints `AGENTS.md` with `lines` < 745, `prose` < 565, `estimate` < 13586 |
| AC-S4 | S4 | `docs/workflow/SKILL_AUTHORING.md` states the target-project guide doctrine and the scaffold (`template/AGENTS.md`) plus `init-workspace` carry the section | `bun test scripts/guide-split.test.mjs` and `bun test scripts/scaffold-guide.test.mjs` exit 0 |
| AC-S5 | S5 | the package's guide is budgeted in the same manifest with a declared ceiling and no upward drift on this change | `bun scripts/check-skill-context.mjs --documents --json` exits 0 and its `documents` array carries `packages/pi-agentic-workflow/README.md` |
| AC-S6 | S6 | the laws table is pinned exactly by its own line count and a row naming a gate that does not exist is a fixture red in a suite; the gate is inventoried and runs in the local gate | `bun test scripts/inviolable-rules.test.mjs` exits 0 · `bun test scripts/check-skill-context.test.mjs` exits 0 · `bun test scripts/prose-gate-inventory.test.mjs` exits 0 |
| AC-S7 | S7 | the section lives in `AGENTS.md` itself, not behind a pointer, and its rows carry the four declared cells | `rg -n '^## Inviolable rules$' AGENTS.md` matches 1 · `bun scripts/inviolable-rules.mjs` exits 0 |
| AC-S8 | S8 | the two-tier decision is recorded in this unit's `decisions.md`, and `docs/architecture/ARCHITECTURAL_INVARIANTS.md` is not converted into a host-laws document (it keeps its project-domain role, whatever it already declares) | `rg -c 'host laws' docs/features/645-guide-minimalism/decisions.md` matches ≥ 1 · `git diff --stat origin/main -- docs/architecture/ARCHITECTURAL_INVARIANTS.md` prints nothing |
| AC-S9 | S9 | all three levels move: the repo guide, the scaffold + its doctrine, and the package guide | AC-S2 · AC-S4 · AC-S5 all pass |
| AC-S10 | S10 | no rule content is invented (every row cites an existing law) and no force-push mechanism ships | `bun scripts/inviolable-rules.mjs` exits 0 · `rg -c 'soft-by-design: .*#346' AGENTS.md` matches 1 |
| AC-S11 | S11 | the four verification-sketch checks are run and their output recorded in `## Log` | `rg -c '^- \\*\\*E' docs/features/645-guide-minimalism/SPEC.md` matches ≥ 6 |

## Impact

- **Consumers of the guide**: every session in this repository reads `AGENTS.md`;
  the reduction changes where the worktree procedure and the config policy are
  read from (`docs/workflow/WORKTREES.md`, `docs/workflow/CONFIG.md`), so the
  documentation map and the deep-references index gain rows and the moved prose
  is deleted from the guide in the same change.
- **Other units in flight**: #646 (docs/skills reconciliation) excludes the
  AGENTS.md reduction precisely because this unit performs it; #643 landed the
  vocabulary invariant this section's first row cites; #644 owns the carrier for
  the no-assumption law; #610 owns the tool-choice carrier. None of those rows
  claims its carrier exists yet when it does not.
- **Stops being true**: `AGENTS.md`'s claim that `scripts/residue-dimensions.test.mjs`
  refuses *any* rule name outside its owner (it refuses one: the no-assumption
  rule) — corrected here, with the general detector named as #646's.
- **Live surfaces**: the budgets manifest is a shared document class
  (`docs/workflow/SKILL_CONTEXT_BUDGETS.json` has a merge driver); the change is
  a re-base of one file's ceilings and a new pin, landed as one edit.
- **The template**: `template/AGENTS.md`'s `## Hard rules` becomes
  `## Inviolable rules` so the repo and the scaffold speak one name; a target
  project that already carries `## Hard rules` is added-to by `init-workspace`'s
  upgrade pass, never rewritten in place.

## Surfaces

- `docs`
- `scripts`
- `template`
- `skills/init-workspace`
- `packages/pi-agentic-workflow`

## Retirements

| surface | replacement | evidence |
|---|---|---|
| `AGENTS.md` §"Worktree creation" (the six-step procedure, 128 lines) | [`docs/workflow/WORKTREES.md`](../../workflow/WORKTREES.md), one hop from the guide's deep-references index; the law stays in the guide's `## Inviolable rules` as `IR8` | `rg -c '^### Step 1 — Determine the branch name' AGENTS.md` → 0 · `rg -c '^### Step 1 — Determine the branch name' docs/workflow/WORKTREES.md` → 1 |
| `AGENTS.md` §"Config policy for new features" (the four questions, 25 lines) | [`docs/workflow/CONFIG.md`](../../workflow/CONFIG.md) §"Adding a config key to a feature", which already owns them | `rg -c '^1\. \*\*Is it really configurable\?\*\*' AGENTS.md` → 0 · same pattern in `docs/workflow/CONFIG.md` → 1 |
| `AGENTS.md` §"Skills available in this repo" (the `skill-lint` paragraph) | [`docs/workflow/SKILL_AUTHORING.md`](../../workflow/SKILL_AUTHORING.md), which owns authoring | `rg -c 'was `bump-skill`' AGENTS.md` → 0 · `rg -c 'was `bump-skill`' docs/workflow/SKILL_AUTHORING.md` → 1 |
| `template/AGENTS.md` §"Hard rules" (the heading, not the rules) | the same section under its one name `## Inviolable rules` | `rg -c '^## Hard rules$' template/AGENTS.md` → 0 · `rg -c '^## Inviolable rules$' template/AGENTS.md` → 1 |

## Non-goals

- Re-cutting the vocabulary inventory or moving vocabulary (#643 owns it; the
  section only cites `vocabulary-residency@1`).
- The substrate alarm and its needs-input route (#644).
- Any new law: every row cites a rule that already exists in this repository or
  in the scaffold it ships. `IR13` (no secret enters the tree) is completed
  rather than invented — it is the scaffold's oldest rule (`template/AGENTS.md`
  §Hard rules) and it already has the `secret-scan` gate; see `D2`.
- Mechanizing the force-push ban (#346 removed that enforcement deliberately).
- Rewriting `ARCHITECTURAL_INVARIANTS.md` into a host-laws document (`S8`).

## Risk tier

- **Tier** — `standard` · **Task Size** — `contained`
- **Named high-risk item** — none — not a high-tier unit
- **Verdict source** — `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --base origin/main`, run at the plan cut over the planned paths; recorded verbatim in `## Log` as `E1`. The classifier answers `passive` only for prose with no executable effect; this unit ships a script, a suite, a checker mode and a manifest pin, so the honest tier is `standard`.

## Future

none — nothing was deferred to this section; the out-of-scope items above are
other units' work, not this unit's future.

## Future cost

| rule | binds |
|---|---|
| A new law enters `## Inviolable rules` as a row with a resolving state, never as a new paragraph in `## Working rules` | every future unit that writes an always-loaded rule |
| The section's line count is pinned in the manifest; adding a row is a manifest edit with its reason, the same arithmetic as every other ceiling | every future unit that adds or removes a law |
| A `materialized: <gate-id>` cell must name a row of `docs/workflow/GATE_INVENTORY.md`; a gate that stops existing fails `scripts/inviolable-rules.mjs` | every unit that retires or renames a gate |
| The scaffold's `## Inviolable rules` section and the repo's share one name and one row shape, so a target project's guide is read by the same reader | every unit that touches `template/AGENTS.md` or the package's guide |

## Applicable tests

| suite | what it proves for this unit |
|---|---|
| `scripts/inviolable-rules.test.mjs` | the gate: fixture reds for a missing block, an unresolvable `materialized:`, an empty reason, a malformed row, a duplicate id; green on the live tree |
| `scripts/check-skill-context.test.mjs` | the exact section pin: a missing pinned section and a one-line growth are both refused; every pre-existing documents case still holds |
| `scripts/guide-split.test.mjs` | the guide layer's order, one-hop index, no restatement, and the doctrine stated in its owner |
| `scripts/scaffold-guide.test.mjs` | the scaffold's section shape and the absence of authored ids in a copied file |
| `scripts/prose-gate-inventory.test.mjs` | the new gate's inventory row and its claimed surface id |
| `scripts/normative-drift.test.mjs` | the new `inviolable-rules` normative-surface row's grammar resolves |
| `scripts/residue-dimensions.test.mjs` | the corrected ownership claim (one gate, one rule) still passes and its live assertions hold |
| `scripts/workflow-docs-index.test.mjs` | the moved reference is indexed |
| `scripts/local-gate.test.mjs` | the new gate is a step of the local gate |

## Known pre-existing issues

- `scripts/residue-dimensions.test.mjs`'s "Every repetition names its owner" gate
  refuses exactly one rule name (the no-assumption rule) while `AGENTS.md` claims
  the general form. **Affects** this unit: the claim is corrected here (S3's
  "load-bearing ambiguity" clause) and the general detector is named as #646's.
  The suite's own assertions are unchanged.
- `docs/workflow/GATE_INVENTORY.md` carries no row for `packages/pi-agentic-workflow`'s
  package suites (e.g. `test/feedback.test.mjs`). **Affects** this unit: `IR12`
  cites that suite as a path, not as a gate id, because it is not inventoried.
  Inventorying the package's suites is #646's scope, not this unit's.
- The issue's "Verified current state" (2026-11-17) says
  `ARCHITECTURAL_INVARIANTS.md` declares no invariant, its only `## AI-` entry
  being the fenced example. #643 landed after that date and declared **`AI-001 —
  every closed vocabulary the workflow publishes has one machine owner`**, so the
  premise is stale while the decision `S8` records is not. **Affects** this unit:
  `D8` restates the tier split against what the document now carries, `IR1` cites
  `AI-001` as the vocabulary law's mechanism, and no host law is written into the
  invariant document.
- The roadmap row for #645 lives in the hand-owned half of the features table and
  its state cell is `promoted`. **Does not affect** this unit: no state cell is
  hand-edited here; settlement happens through `scripts/roadmap-settle.mjs` once a
  PR exists.

## Tasks

- P1 — Freeze the plan: this unit doc, `planning-evidence.md`,
  `planning-obligations.md` and `decisions.md`, with the pre-change measurement
  recorded as `E1`.
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/645-guide-minimalism/SPEC.md` exits 0)
  (Implements: S1, S8, S10)
  - Relevant files: docs/features/645-guide-minimalism/

- P2 — Land the frozen-failure corpus red: the gate's fixture reds (missing
  block, unresolvable `materialized:`, dash reason, malformed row, duplicate id,
  two homes) and the live-tree red on today's guide, observed failing against the
  missing module.
  (validator: `bun test scripts/inviolable-rules.test.mjs` exits 1 naming the missing `scripts/inviolable-rules.mjs`)
  (Implements: S2, S6)
  - Relevant files: scripts/inviolable-rules.test.mjs

- P3 — Implement `scripts/inviolable-rules.mjs`: parse the `inviolable-rules@1`
  block, resolve each row's owner pointer and state against the tree and
  `docs/workflow/GATE_INVENTORY.md`, refuse a second home, print the fixed
  envelope.
  (validator: `bun test scripts/inviolable-rules.test.mjs` exits 0)
  (Implements: S2, S6, S11)
  - Relevant files: scripts/inviolable-rules.mjs

- P4 — Pin the laws table exactly: suite cases first (the block at its pin, one
  line over, and a declared pin whose block is gone), then the `--documents`
  support that counts one versioned block from its opening fence to its closing
  fence.
  (validator: `bun test scripts/check-skill-context.test.mjs` exits 0)
  (Implements: S6)
  - Relevant files: scripts/check-skill-context.test.mjs, scripts/check-skill-context.mjs

- P5 — Rewrite the guide: the `## Inviolable rules` section, the reductions the
  doctrine orders (worktree procedure to `docs/workflow/WORKTREES.md`, config
  policy to its owner's pointer, `skill-lint` to the authoring reference, the
  duplicated mechanism prose to one line each), the corrected ownership claim, the
  new `normative-surfaces@1` and deep-references rows, then the manifest's
  downward re-base with the section pin and the new document row.
  (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and prints `AGENTS.md` lines < 745)
  (Implements: S2, S3, S6, S7, S11)
  - Relevant files: AGENTS.md, docs/workflow/WORKTREES.md, docs/workflow/README.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json

- P6 — Carry the doctrine (S3) into the surfaces that ship it: `SKILL_AUTHORING.md`
  states the target-project guide shape, `init-workspace` offers the section, and
  the scaffold renames its section and gives each rule its state cell — suite
  cases first.
  (validator: `bun test scripts/guide-split.test.mjs` and `bun test scripts/scaffold-guide.test.mjs` exit 0)
  (Implements: S4, S7, S9)
  - Relevant files: docs/workflow/SKILL_AUTHORING.md, skills/init-workspace/SKILL.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, template/AGENTS.md, scripts/guide-split.test.mjs, scripts/scaffold-guide.test.mjs

- P7 — Bound the package's guide (S4 level 3): measure
  `packages/pi-agentic-workflow/README.md`, add its budget row and its one-hop
  index row, and land the pass that removes prose the repo docs own.
  (validator: `bun scripts/check-skill-context.mjs --documents --json` exits 0 and its rows include the package README)
  (Implements: S5, S9, S11)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json

- P8 — Register the gate where a push runs it (`docs/workflow/GATE_INVENTORY.md`
  row + claimed surface id, `scripts/local-gate.mjs` step) and verify: the declared
  commands in the foreground, the projection regenerated, the ledgers closed.
  (validator: `bun test scripts/prose-gate-inventory.test.mjs` and `bun test scripts/local-gate.test.mjs` exit 0)
  (Implements: S6, S11)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, scripts/local-gate.mjs, AGENTS.md

- P9 — Close: the evidence rows appended, every obligation row closed at
  `verified` (an evidenced `n/a` where a row allows one), the projection
  regenerated, the session log appended.
  (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S11)
  - Relevant files: docs/LOGS.md, docs/features/645-guide-minimalism/

### Planning evidence

Frozen beside this document: [`planning-evidence.md`](planning-evidence.md).

### Obligations

Frozen beside this document: [`planning-obligations.md`](planning-obligations.md).

## Triaged steps

Read from the machine, not chosen here. The router's verdict at the plan cut is
the authoritative step list; the tasks above are its expansion, in its order, and
the lane never re-derives or reorders it.

```text
TRIAGE — 645-guide-minimalism (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/645-guide-minimalism
relay-next: create .pi-web/relays/645-guide-minimalism/ (charter → docs/features/645-guide-minimalism/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/645-guide-minimalism", leg: "1") · legs: 10 = 9 phases + 1 coherence review
```

The `review` step is the one the operator's instruction supersedes for this
change (`D9`): this unit is applied inline and the operator is its external
verifier, so no `review-change`, `audit-pr` or fold cycle runs on it. Every other
triaged step is executed here, in the router's order.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from `log-kind@1`.

- **L1** — 2026-11-19, the request, verbatim:
  ```
  Apply to this repository: issue #645
  ```
- **D1** — 2026-11-19, the laws table is pinned by its **own** line count
  (`blockLines` in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`) instead of by
  joining the guide's machine region: the machine region spans the first declared
  block to the last, so a laws section placed among the guide's early sections
  would be counted with everything between it and `rendered-facts@1`. The pin is
  exact — one added row fails `--documents` with both counts named. Authority:
  S6's "counted, pinned" plus S7's always-loaded placement.
- **D2** — 2026-11-19, `IR13` (no secret enters the tree) is completed rather
  than invented: `template/AGENTS.md` §Hard rules has carried it since the
  scaffold existed and `scripts/secret-scan.test.mjs` enforces it here, so the
  guide was the only level without the law. Authority: S7's "the section's own
  additions are the laws that had no home" plus S10's boundary (no *new* rule
  content).
- **D3** — 2026-11-19, the two-tier decision `S8` records: host laws live in
  `AGENTS.md`'s always-loaded section; `docs/architecture/ARCHITECTURAL_INVARIANTS.md`
  keeps its target-project template role and this repository declares none
  there. Authority: S8 verbatim.
- **D4** — 2026-11-19, `IR3` (test immutability) and `IR4` (red-first) are two
  rows, not one: they have different carriers (`red-first-ordering` is a
  materialized gate; immutability is `soft-by-design`), and one row carries one
  state. Authority: S2's seed list ("red-first ordering", "no test edits to pass")
  read against S7's one-state-per-row shape.
- **D9** — 2026-11-19, the router's `review` step is superseded for this change:
the operator's instruction applies the unit inline and holds the external verifier
role, so no `review-change`, `audit-pr` or fold cycle runs here. The repo's
**deterministic** gates still run, in full. Authority: the operator's instruction
for this turn (§4 "Work inline — never run this repo's own machinery on its own
surgery"), read against `E2`'s step list.
- **E1** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --base origin/main` · exit 0 ·
  `tier: standard`, `reason: 1 path(s) carry executable content: docs/features/645-guide-minimalism/`, `task_size.ceremony: unit-doc`.
- **E2** — 2026-11-19, `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route --triage 645-guide-minimalism` · exit 0 ·
  `Steps: research, design, plan, implement, tests, evidence, review, docs, release` — pasted verbatim above.
- **E3** — 2026-11-19, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 745 180 565 13586` against ceilings 745 / 571 / 14745 — the pre-change boundary this pass must move down.
- **E4** — 2026-11-19, `gh api repos/gtrabanco/agentic-workflow/issues/{644,646}` · exit 0 · both `open`; `…/610` → `closed` (its carrier shipped), which is why `IR14` cites a materialized gate instead of a filed unit.
- **D8** — 2026-11-19, the issue's dated premise is corrected in writing: #643
  landed `AI-001` in `docs/architecture/ARCHITECTURAL_INVARIANTS.md`, so the
  document is no longer an empty template. The tier split of `D3`/`S8` holds
  unchanged — host laws stay in `AGENTS.md`, project-domain invariants stay in
  that document — and `IR1` cites `AI-001` rather than restating it. Authority:
  `docs/architecture/ARCHITECTURAL_INVARIANTS.md:31` at the cut HEAD.

- **D10** — 2026-11-19, `D1`'s first shape (a heading-bounded `sectionLines` pin)
  was replaced by the block-bounded `blockLines` pin during P4: a heading-bounded
  count needs a second heading reader in `scripts/check-skill-context.mjs`, which
  `scripts/structural-sibling-pins.test.mjs` refuses and which the crate's shared
  reader cannot serve inside a copied fixture (the crate's module chain is not in
  the fixture tree). The block bound needs no heading reader, is exact to the
  line, and is measured by the same fence walk the checker already owns. Authority:
  S6 ("counted, pinned"), read with the structural-sibling pin.
- **E5** — 2026-11-19, `bun test scripts/inviolable-rules.test.mjs` · exit 1 · 17 pass, 1 fail — the live-tree case, red on the guide that does not carry the block yet (P5 closes it).
- **E6** — 2026-11-19, `bun test scripts/check-skill-context.test.mjs` · exit 1 · red on the checker that ignored `blockLines` (the three new cases); · exit 0 after the implementation — `1 pass, 0 fail`.

- **P1** — 2026-11-19, plan frozen: this document, `planning-evidence.md`
  (14 rows at the cut, 15 after `PE-015`), `planning-obligations.md` (15 rows),
  `decisions.md` (D1–D9); `phase-lint` PASS 9/9 · `c463d7c2c`.
- **P2** — 2026-11-19, the gate's suite lands alone and is observed red on the
  missing module (18 failures, 0 pass) · `7ab6ce237`.
- **P3** — 2026-11-19, `scripts/inviolable-rules.mjs` implemented; 17 of 18 cases
  green, the live-tree case red until the guide carries the block · `e02a1dd23`.
- **P4** — 2026-11-19, the pinned-block cases land red (`a663e2193`, red on the
  checker that ignored the pin), then `blockLines` lands in the budgets checker
  with the fence walk shared with the machine-region measure · `5684f32ec`.
- **P5** — 2026-11-19, the guide rewritten: the laws section, the reduction, the
  downward re-base · `64585d99a`.
- **P6** — 2026-11-19, the doctrine carried into the scaffold and the skill; the
  cases land red first (`93883d872`, 2 + 1 failures), then the prose ·
  `9f31b3d15`.
- **E7** — 2026-11-19, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md 602 181 421 12581` (was 745 / 180 / 565 / 13586) against the re-based ceilings 660 / 461 / 13804; the laws table pinned at `blockLines: 18`.
- **E8** — 2026-11-19, `bun scripts/inviolable-rules.mjs` · exit 0 · `PASS inviolable rules: 14 rows · 1 home`.
- **E9** — 2026-11-19, `bun test scripts/inviolable-rules.test.mjs` · exit 0 · 18 pass / 0 fail — the six fixture reds, the path-and-gate state forms, and the live-tree seed list.
- **E10** — 2026-11-19, `bun test scripts/check-skill-context.test.mjs` · exit 0 · 1 pass / 0 fail — the pin at size, one line over, and a declared pin whose block is gone.
- **E11** — 2026-11-19, `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS` with the new `inviolable-rules` row claiming the `inviolable-rules` surface.
- **E12** — 2026-11-19, `git diff --stat origin/main -- docs/architecture/ARCHITECTURAL_INVARIANTS.md` · exit 0 · no output (the invariant document is untouched, `S8`).
- **E13** — 2026-11-19, the line-identity comparison of the package README against `AGENTS.md` and `docs/workflow/*.md` · 1 shared line — `PE-015`, `D11`.
- **G1** — 2026-11-19, `bun scripts/run-root-suite.mjs` · exit 0 · 128 suites PASS, no FAIL line.
- **G2** — 2026-11-19, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned`, roadmap unchanged.
- **G3** — 2026-11-19, `bun scripts/local-gate.mjs --skip-network --jobs 2` · exit 0 · `local-gate: PASS — 15 step(s)`, the crate suites 1,015 pass / 1 skipped (the pre-existing skip) and the root suite 128 PASS.
- **P7** — 2026-11-19, the package guide bounded: measured 1,178 lines / 16,057 est, its budget row and one-hop index row landed, the overlap measurement recorded (`PE-015` · `D11`).
- **P8** — 2026-11-19, the gate registered in `docs/workflow/GATE_INVENTORY.md` with the `inviolable-rules` surface claimed; no `scripts/local-gate.mjs` step was added because the gate's suite rides the `root-suite` step already — the gate runs on every push through that carrier, and `G3` is the evidence.
- **P9** — 2026-11-19, close: ledgers flipped to `verified`, the projection regenerated, the session entry written as a journal fragment · `09cfe44b1`.
- **G4** — 2026-11-19, `bun scripts/dimension-regression.mjs --base origin/main` · exit 1 first — `missing-reverification-evidence`: the range touches one review surface (`docs/workflow/GATE_INVENTORY.md`, where the new gate's row lands) and no unit doc recorded the run · after this line · exit 0, `verdict | clean`, `18 dimensions` at the base and at the head, `changed review surfaces 1`, this document as the evidence carrier. Nothing was dropped and no dimension changed: the only touched review surface is the inventory's own row.

- **G5** — 2026-11-19, the installed `pre-push` hook ran the offline gate over the push range `c1ccc19..39fc304a7` · exit 0 · `local-gate: PASS — 17 step(s) in 660s` (crate suites 1,015 pass / 1 pre-existing skip; every offline step green).
- **P10** — 2026-11-19, the branch pushed and the PR opened: [#652](https://github.com/gtrabanco/agentic-workflow/pull/652) · `39fc304a7` is the head the hook verified.

## Next

The operator's verdict. The unit is closed in this change: every obligation row
is `verified`, the root suite and the projection are green at the head, and the
diff is handed over rather than self-approved (`D9`).

## References

- Issue [#645](https://github.com/gtrabanco/agentic-workflow/issues/645) — the request this unit adopts (`Closes #645`).
- PR [#652](https://github.com/gtrabanco/agentic-workflow/pull/652) — this unit's delivery, branch `feat/645-guide-minimalism-doctrine`.
- [`docs/workflow/SKILL_AUTHORING.md`](../../workflow/SKILL_AUTHORING.md) — the authoring rules the doctrine joins.
- [`docs/workflow/GATE_INVENTORY.md`](../../workflow/GATE_INVENTORY.md) — the gate ids a `materialized:` row cites.
- [`docs/fix/_TEMPLATE/SPEC.md`](../../fix/_TEMPLATE/SPEC.md) — the ledger shapes this document mirrors.
