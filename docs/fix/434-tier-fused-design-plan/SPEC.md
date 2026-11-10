---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and to the requirement count (scope).
type: fix
scope: small
ac-hash: 05dcee7a99f53cf40dd9d1d7f1012a661ef81058575599978ed9620d44a56b61
---

# fix/434-tier-fused-design-plan

> **Tier-fused design/plan with delta provenance and topological task order.**
> Applied inline per the owner's governing request (S9–S18 below); this command
> substitutes for the lane's plan step, so the ledgers are cut here and frozen at
> the cut (2026-11-10, base `27275c94`). The three coupled changes land as one
> fix unit: delta provenance in the plan, tier-fused activity in the conductor,
> and the already-landed topological order pinned rather than re-authoured.

## Issue

[#434](https://github.com/gtrabanco/agentic-workflow/issues/434) — NEW FEATURE:
tier-fused design/plan with delta provenance and topological task order. Part of
the #307 direction (kernel amendment of 2026-11-06, item 2). The PR closes it
with `Closes #434` in the body.

## Specs

**S1 — The three coupled plan changes.**
> Three coupled plan changes: **(1) delta provenance** — the plan journals only claims the design step did not already settle and sweeps only the deltas; **(2) tier-fused activity** — `standard` runs one investigate→orient→ask→decide pass over the unit in one conductor session with **carriers separated**; `high` keeps the cold pre-execution-review separation; **(3) topological task order** — prerequisite tasks precede their dependants regardless of size.

**S2 — Delta provenance: the plan journals and sweeps only deltas.**
> In `standard`, the lane runs design and plan as **one pass** whose decision points are tagged design/plan; the plan journals only `CLAIM-*` rows whose claim the design pass did not journal (`INV-*`); the candidate-source sweep runs only over the delta rows; ACs stay the plan's **input** (never re-decided — existing rule, now the fusion's guard).

**S3 — `high` keeps the separated stages.**
> In `high`, design and plan remain separated stages with the cold pre-execution-review between them — a deliberate cut, not a cost.

**S4 — Topological task order with validator scheduling on the same graph.**
> Task ordering gains the precedence rule: dependency topology first, then smallest-first within a ready set; validator scheduling respects the same graph.

**S5 — Measured acceptance per #307's rule.**
> Measured acceptance per #307's rule: tokens + wall-clock per unit, before/after, ≥3 real units, ≥2 models (arXiv 2610.37255's harness methodology).

**S6 — Where the change lands.**
> `skills/unit-lane/references/PLAN.md` + `DESIGN.md`, the conductor's step contract (SKILL.md), `scripts/catalog.json` step graph.

**S7 — Path: one fix unit; the golden-fixture ritual applies.**
> One fix unit amending the two lane references plus the catalog graph; the golden-fixture ritual (`GOLDEN_FIXTURE.md`) applies because executor-path wording changes are a performance surface (arXiv 2610.37255).

**S8 — The fused pass injects context, not a gate.**
> This issue must **not** resurrect a reviewer pass — the fused pass injects *context*, not a new gate (TDAD ablation, arXiv 2603.17973: procedural prescription without targeted context raised regressions 6.08%→9.94%).

**S9 — Cite-sources clause: adopted knowledge gets an ATTRIBUTION row in the implementing PR.**
> Adopted knowledge → `docs/research/ATTRIBUTION.md` row in the implementing PR.

**S10 — The intent is resolved from state, and quoted verbatim (the owner's application protocol, §0–§1).**
> Print the resolution **before** any action — the state decides the sequence, the words only pick the verb … Outcome contract for any mismatch with reality — four outputs only, never an ad-hoc branch: `proceed` … `empty` … `ambiguous` … `mismatch` … Never guess. … Number the request as `S1..Sn`, quoting my words **verbatim** — exact strings, error messages, examples. Never summarize, never add a requirement I did not ask for, mark assumptions as assumptions. Every later decision cites its `S#`.

**S11 — The frozen-failure corpus is RED before anything (§2).**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S12 — Fixtures before the real tree, and the live-tree guard (§3, §4).**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change. … **Live-tree guard**: code introduced by this change (commands, hooks, emitters, scripts with side effects) is never executed against the live repository or a shared worktree until verified — mutating paths run only in scratch (§3). An accidental side effect is disclosed, cleaned, and reported in the handoff — never hidden, never doubled.

**S13 — No self-machinery on this change (§4).**
> **Work inline — never run this repo's own machinery on its own surgery** … No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.

**S14 — The ledgers are cut here, in the repo's own shapes, and frozen at the cut (§5).**
> This command substitutes for the lane's plan step, so it writes the planning ledgers in the repo's own shapes — row contracts owned by `skills/pre-execution-review/references/LEDGERS.md`, mirrored in `docs/fix/_TEMPLATE/SPEC.md`. A change applied without them is a legacy unit with no ledgers, and the repo's reviews and audits refuse it until they are constructed — so cut them here, never retrofit them later … Task order is **dependency-topological first, smallest within a ready set** — a prerequisite task precedes its dependants even when larger.

**S15 — Test-first, differential, and model memory is never a source (§6).**
> One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else. … **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it. … **Model memory is never a source** — any claim of the shape "tool/flag/syntax/API v behaves like X" carried from training is `inferred` at best — verify against the version the project pins (lockfile, manifest, action SHAs, current docs of that version) before it guides code. One fetch; record the source in the affected PE row. … Work-unit commits of ~400 authored changed lines (additions+deletions), Conventional Commit messages, tests and docs alongside behavior.

**S16 — Documentation and repository state ship in the same change (§7).**
> Ship the docs **in the same change** — never deferred: Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events; Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead; `docs/LOGS.md`: the session entry is appended … before the final handoff; The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection.

**S17 — Verification is run in the foreground and handed off without self-approval (§8).**
> Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says — or an evidenced `n/a` (cite `path:line`, a ledger row, or a contract). A `planned`, `in-progress`, blank, or `deferred` row blocks the handoff — name the open ids … Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict.

**S18 — Correction bounds are hard (§9).**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers (re-running the touched obligation rows' validators and flipping their statuses back) → a second pass only if the **same** blocker still fails → then one `Needs your decision` result naming the open blockers. **A new finding never earns another cycle** — it goes to me, and the turn ends.

## Impact

Beyond its own lines the change touches:

- **Every future lane run.** The conductor's session composition for `design` +
  `plan` changes at `standard` risk tier (one pass, carriers separated); the
  triage block gains an additive `Fused:` line. Consumers of the triage block:
  `scripts/unit-cycle.mjs` and `scripts/unit-lineage.mjs` parse it by fixed
  line-prefix (`Steps:` / `Skipped:` / `Budget:`), so an added line is ignored
  by both (PE-004) — the invariant that makes the line safe to add.
- **`scripts/catalog.json` consumers.** `unit-route.mjs` (steps, `budget_tier`,
  `relay`), `scripts/relay-packet.mjs` (leg tiers), the catalog test's closed-9
  assertion. The fusion is a new top-level declarative key appended beside them;
  no existing key moves (PE-005).
- **Doc surfaces stating the changed behavior:** `docs/workflow/LANE_FLOW.md`
  (the catalog-steps lifecycle and the triage block sample),
  `docs/workflow/SKILLS.md` (the `unit-lane` row names the catalog), the root
  `AGENTS.md` `normative-surfaces@1` table (the new versioned block's row),
  `docs/research/ATTRIBUTION.md` (adoption rows), `docs/ROADMAP.md` row 434.
- **The pre-execution contracts are not touched.** The fusion changes session
  composition, never gate ownership: the carriers stay separated and both
  stages' gates bind per their existing contracts (`PRE_EXECUTION_GATE.md`,
  `SNAPSHOT.md`).

**Marked assumption (owner words → delivered semantics).** S3 says "`high`
keeps the cold pre-execution-review separation". Delivered reading: at `high`
nothing fuses — design and plan remain the two separated triaged steps they are
today, and the cold pre-execution-review cycle stays where its owners put it
(the plan snapshot still guards execution; no *new* review turn is inserted
between the two steps). Evidence for the reading: S8 forbids resurrecting a
reviewer pass, and `pre-execution-review`'s own header records that feature 61
P8b retired the standalone review-spec/review-plan verdict skills — the pack
"owns the ledger shapes the lane and execute-phase consume, not a verdict gate"
(`skills/pre-execution-review/SKILL.md`). If the owner reads S3 as wanting a
*new* cold review turn between the two steps at `high`, that is a correction
under §9, not an invention made here.

## Retirements

The plan step's testimony contract is superseded: today `PLAN.md` Stage 1
orders "the same provenance search the design step ran" re-run over *every*
plan claim, and Stage 2 sweeps *every* `CLAIM-*` row. The delta-provenance rule
(S2) supersedes that re-run: the plan journals and sweeps only the delta rows.
The superseded sentence is deleted in the same change, with the
negative-capability pin as its task validator (`rg -c "same provenance search"
skills/unit-lane/references/PLAN.md` → 0, sweep grep and before/after counts in
the task) — `replace-implies-delete` (#340).

## Non-goals

- **No reviewer pass is resurrected** (S8): no verdict vocabulary, no gate
  receipt, no review turn is added by the fused pass; the skill never prints a
  stage verdict of its own.
- **No triage reordering**: the nine closed steps, their order and their
  `budget_tier` values stay exactly as they are; fusion is a session-composition
  annotation on two adjacent steps, never a new step, and a unit whose recorded
  tier is `high` or unrecorded gets byte-identical triage output to today.
- **No measured acceptance claimed in this unit** (S5): the instrument does not
  exist at cut; the rule lands as a standing `## Future` row and a
  future-cost obligation (the #360 O17 precedent), never a claimed number.
- **No change to `execute-phase`, the relay contract, or the pre-execution
  snapshot stages** — the change is lane-conductor scope only.
- Findings discovered during implementation never widen scope past these
  boundaries; they go to the owner per §9.

## Risk tier

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "contained", resumable_from_diff: true, ceremony: "unit-doc", verification: "gates"}`
- **Named high-risk item** — `none — not a high-tier unit`

(Copy of `bun scripts/ceremony.mjs tier classify --paths
"skills/unit-lane/references/PLAN.md,skills/unit-lane/references/DESIGN.md,skills/unit-lane/SKILL.md,scripts/catalog.json,scripts/unit-route.mjs,scripts/activity-fusion.test.mjs,docs/fix/434-tier-fused-design-plan/SPEC.md"`
at the cut head `27275c94` — `tier: "standard"`, `reason: "3 path(s) carry
executable content: scripts/activity-fusion.test.mjs, scripts/catalog.json, scripts/unit-route.mjs"`,
no signals. The verdict can only rise; a rise appends a `## Log` line, never a
quiet edit.)

## Future

- `open` — 2026-11-10, the measured acceptance (S5): "tokens + wall-clock per
  unit, before/after, ≥3 real units, ≥2 models (arXiv 2610.37255's harness
  methodology)" — the instrument that collects these does not exist at cut
  (the #360 precedent cut the same rider to its own child, #383). Kept open
  here; aggregated on the model-memory unit's side when ≥3 post-fusion units
  have run, or as its own split child on request.

## Future cost

- The fusion binds every future lane conductor: at `standard` the design and
  plan steps run as one pass in one session with carriers separated — a run
  that executes the four-stage loop twice at `standard` is a defect this rule
  owns, and every review that reads a lane run judges it by the
  `activity-fusion@1` block.
- Delta provenance binds every future plan step and every pre-execution
  reviewer: a plan that re-journals a claim `sources.md` already settles is a
  defect, not thoroughness.

## Applicable tests

- `scripts/activity-fusion.test.mjs` — this unit's own pin (red-first): the
  prose-shape pins for the `activity-fusion@1` block, the delta-provenance
  wording, the conductor pointer and the no-resurrected-reviewer pin, plus the
  machine pins for the catalog declaration and the triage `Fused:` line
  (sandboxed catalog copies, the `catalog.test.mjs` pattern).
- The catalog suite `scripts/catalog.test.mjs` and the root suite
  (`node scripts/run-root-suite.mjs`) — the regression boundary for every unit
  type/scope combination's step list, tiers, skips, budget and JSON shape.

## Known pre-existing issues

- The `## Fixes` active row of `docs/ROADMAP.md` has **no deterministic
  writer** (readers only — the #429 E8 / #433 PE-005 finding). Affects this
  unit only in that its roadmap row is a disclosed hand edit (O9), never a
  silent one.
- **The journal aggregate refuses a stale foreign fragment
  (does-not-affect).** The shared `.agentic-workflow/journal/` carries a
  pending `manual`-kind fragment from another session that the aggregator
  refuses before moving any byte (recorded by #433's known-issues). This unit's
  session entry uses the manual-append fallback if the aggregate still refuses
  (O10).
- **node-leg gate reds, base-identical (does-not-affect).** As recorded by
  #433: under this environment's node v26.13.0 the spawned-CLI suites
  (`doc-discipline`, `roadmap-moved`) red on the node leg and pass under
  `bun test`; base-identical, not introduced here.

## Tasks

- P1 — Cut the red suite `scripts/activity-fusion.test.mjs` — one pin per requested rule (S2 delta provenance, S2/S3 fusion tiers, S4 ordering pin, S8 no-resurrected-reviewer) plus the machine pins for the catalog declaration and the triage `Fused:` line and the unchanged-behaviour pin for a tier-unrecorded unit's byte-identical triage output — committed alone and observed failing (validator: `bun test scripts/activity-fusion.test.mjs` exits non-zero naming the missing rule)
  (Implements: S1, S2, S4, S8, S11, S12, S15)
  Relevant files: scripts/activity-fusion.test.mjs
- P2 — `scripts/catalog.json` gains the machine fusion declaration (one appended top-level key: fused steps, `applies_when` on the recorded risk tier, carriers/gates separated) and `scripts/unit-route.mjs` emits the additive `Fused:` line reusing the recorded-tier single reader — validated on sandbox catalog copies before the tracked bytes change (validator: `bun test scripts/activity-fusion.test.mjs scripts/catalog.test.mjs` exits 0)
  (Implements: S1, S2, S6, S12)
  Relevant files: scripts/catalog.json, scripts/unit-route.mjs
- P3 — `PLAN.md`: the `activity-fusion@1` block (one normative owner) and the delta-provenance amendment of Stages 1–3 with the superseded re-run sentence deleted; `DESIGN.md` and `SKILL.md` carry one-line owner pointers, not restatements (validator: `bun test scripts/activity-fusion.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S6, S8)
  Relevant files: skills/unit-lane/references/PLAN.md, skills/unit-lane/references/DESIGN.md, skills/unit-lane/SKILL.md
- P4 — Documentation and repository state in the same change: the `ATTRIBUTION.md` row (S9), the roadmap row 434 status (disclosed hand edit — no writer exists), the declared docs surface (`docs/workflow/LANE_FLOW.md`, `docs/workflow/SKILLS.md`), the normative-surfaces row in the root `AGENTS.md`, the changeset intent, the regenerated projection, and the session log (validator: `bun scripts/lint-changeset.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S9, S16)
  Relevant files: docs/research/ATTRIBUTION.md, docs/ROADMAP.md, docs/workflow/LANE_FLOW.md, docs/workflow/SKILLS.md, AGENTS.md, .changeset/, docs/generated/, .agentic-workflow/journal/
- P5 — Foreground verification and ledger close: every obligation row flips on its own validator's observed run; the golden-fixture run-log row records the executor-path wording change honestly (weakest-model availability disclosed per the ritual's precedent rows); the declared verification set runs in the foreground (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S7, S10, S13, S14, S15, S16, S17, S18)
  Relevant files: docs/fix/434-tier-fused-design-plan/SPEC.md

Task order note (S14): the tokens are dependency-topological — P1 (the pins
that define the rules) precedes P2/P3 (the rules' carriers); P2 precedes P3
because P3's prose pins read the machine declaration's id; P4 last-but-one
because its emitters validate landed bytes; P5 closes the ledgers. Within each
ready set the smallest token ran first.

### Planning evidence

One row per Engineering claim the change rests on (`id | authority-kind | claim |
source | freshness | affected-decision-or-obligation` — base shape owned by
`skills/unit-lane`'s planning reference; vocabularies owned by
`skills/pre-execution-review/references/LEDGERS.md`):

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | `PLAN.md` Stages 1–3 currently order the *full* loop over every plan claim: Stage 1 "Open with the same provenance search the design step ran" and journals every claim `CLAIM-*`; Stage 2 "sweep every one of them"; Stage 3 asks over the unswept remainder. The delta rule amends these three stages in place and deletes the re-run sentence | `skills/unit-lane/references/PLAN.md` (§Stage 1, §Stage 2, checklist items 1–4) | fresh at cut | O1, O2 |
| PE-002 | repository | the four-stage loop's shape (investigate → orient → ask → decide, `sources.md` journal, `decisions.md` ask/decide blocks) is defined by `DESIGN.md` and re-entered by `PLAN.md`; the fused pass keeps every stage's semantics and only collapses the two runs into one session — carriers (sources/decisions/SPEC vs Tasks/Evidence) stay separate | `skills/unit-lane/references/DESIGN.md` (§Purpose, §Fixed output contract); `skills/unit-lane/references/PLAN.md` (§Stage 1, §Fixed output contract, the four `<!-- …:start -->` panes) | fresh at cut | O2, O8 |
| PE-003 | repository | the recorded risk tier's reader is `recordedTier(specText)` — exported, pure, the single reader of all three recorded shapes (`## Risk tier` block, a `## Log` JSON line, a `tier:` sentence). `unit-route.mjs` reuses it; no second parser is written | `scripts/ceremony/tier.mjs` (`recordedTier`, `RISK_TIER_KINDS`) | fresh at cut | O3 |
| PE-004 | repository | the triage block's machine consumers parse fixed line prefixes only — `unit-cycle.mjs` regexes `^Steps:\s*(.+)$` and `unit-lineage.mjs` `startsWith("Steps:")`-scans a closed name list — so an appended `Fused:` line changes neither; the existing suites pin the rest | `scripts/unit-cycle.mjs` (declaredSteps), `scripts/unit-lineage.mjs` (`TRIAGE_LINE_NAMES`) | fresh at cut | O3, O7 |
| PE-005 | repository | `catalog.json`'s consumers read named keys (`steps`, `catalog.*.budget_tier`, `relay`) and the suite asserts the closed-9 step set plus per-step `budget_tier`; no consumer validates unknown top-level keys, so an appended declarative key is safe | `scripts/catalog.test.mjs`; `scripts/unit-route.mjs` (`loadCatalog`, `relayTiers`); `scripts/relay-packet.mjs` | fresh at cut | O3 |
| PE-006 | repository | S4's precedence rule is already landed — commit `e964bb7c` (#433) wrote topology-first, smallest-within-a-ready-set and the dependent-validator rule into `PLAN.md`'s Purpose, output contract and checklist; this unit pins it and adds no restatement | `git log --oneline -- skills/unit-lane/references/PLAN.md` → `e964bb7c`; `skills/unit-lane/references/PLAN.md` (Purpose, order paragraph, checklist item "Tasks are ordered dependency-topological first…") | fresh at cut | O4 |
| PE-007 | evidence standing-obligation precedent | a measured-acceptance rider whose instrument does not exist at cut is stated as a standing obligation and an open `## Future` row, nothing claimed — the #360 O17 precedent | `docs/fix/360-risk-tiered-ceremony/planning-obligations.md` (O17); `docs/fix/360-risk-tiered-ceremony/SPEC.md` (`## Future`, split child #383) | fresh at cut | O5 |
| PE-008 | repository | no reviewer pass may be resurrected: `pre-execution-review` states the lane's pre-execution path survives as ledger shapes "not a verdict gate", and S8's owner words forbid a new gate — the fused pass adds context, none | `skills/pre-execution-review/SKILL.md` (header + When to use); governing request S8 | fresh at cut | O6 |
| PE-009 | repository | executor-path wording changes are a golden-fixture surface: the ritual demands a weakest-model run-log row per changed executor-path skill; where no weak model is available, the precedent honest forms are a recorded `NOT RUN` / manual read-through row, never a fabricated PASS | `docs/workflow/GOLDEN_FIXTURE.md` (When to run, Run log precedent rows incl. the 2026-07-12 substituted manual read-through) | fresh at cut | O9 |
| PE-010 | repository | every versioned grammar block a normative surface carries must have its row in the root `AGENTS.md` `normative-surfaces@1` table — the drift gate refuses the unregistered block, so P4 ships the row with the block | `AGENTS.md` (§Normative surfaces); `scripts/normative-drift.test.mjs` | fresh at cut | O8 |
| PE-011 | repository | frozen-failure corpus verdict is empty: the change repairs a cost structure (the loop run twice per unit), not a named failure — no reproducer exists in the findings ledger or history, so §2 pads nothing and the red-first rule arrives via the S2-isomorphic pins instead | `rg -n "twice|duplicate|re-run" docs/fix/*/review-findings.md` — no open row against the plan's duplicate journal (run 2026-11-10; receipt in `## Log` E2) | fresh at cut | S11 verdict |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case,
and required failure state (`obligation-id | authority-source |
affected-use-case-or-invariant | phase | task |
implementation-owner | validator | required-evidence | status` — shape owned by
`skills/pre-execution-review/references/LEDGERS.md`):

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | Delta provenance: the plan journals only `CLAIM-*` rows whose claim the design pass did not journal (`INV-*` already in `sources.md`) and sweeps only the delta rows; the AC-as-input check is the fusion's guard, unchanged | P3 | PLAN.md delta-provenance amendment | lane agent | `bun test scripts/activity-fusion.test.mjs` exits 0 (the delta cases) | E5 in `## Log` | planned |
| O2 | S2 | Tier-fused activity at `standard`: one investigate→orient→ask→decide pass over the unit in one conductor session, decision points tagged design/plan, carriers separated — owned by the `activity-fusion@1` block | P3 | PLAN.md block + conductor pointer | lane agent | `bun test scripts/activity-fusion.test.mjs` exits 0 (the standard-fusion prose cases) | E5 in `## Log` | planned |
| O3 | S2 | Machine fusion: `catalog.json` declares the fused pair; triage prints the additive `Fused:` line iff both steps are triaged and the recorded tier is `standard`; a `high` or unrecorded tier yields byte-identical output to the base (differential), and a malformed declaration fails closed | P2 | catalog.json + unit-route.mjs | lane agent | `bun test scripts/activity-fusion.test.mjs` exits 0 (the sandbox triage cases: standard/high/unrecorded/malformed) + `bun test scripts/catalog.test.mjs` exits 0 | E4 + E5 in `## Log` | planned |
| O4 | S3 | At `high`, design and plan remain separated stages, and no new review turn or gate is inserted — the pre-execution contracts stay where their owners put them (the marked assumption lives in `## Impact`) | P3 | PLAN.md block (the `high` row) | lane agent | `bun test scripts/activity-fusion.test.mjs` exits 0 (the high-separation + sandbox high case) | E5 in `## Log` | planned |
| O5 | S4 | The precedence rule stands after the change: dependency topology first, smallest within a ready set, dependent validators after their prerequisites — pinned, not re-authoured (PE-006) | P3 | PLAN.md pin in the suite | lane agent | `bun test scripts/activity-fusion.test.mjs` exits 0 (the S4 ordering pin) | E5 in `## Log` | planned |
| O6 | S8 | No reviewer pass is resurrected: the lane references add no verdict vocabulary and no gate receipt; the fused pass is context, never a verdict | P3 | no-resurrection negative pin | lane agent | `rg -c "SPEC-REVIEW-PASS|PLAN-REVIEW-PASS" skills/unit-lane/` exits 1 with 0 matches and `bun test scripts/activity-fusion.test.mjs` exits 0 (the negative pin) | E5 in `## Log` | planned |
| O7 | S15 (differential) | Every existing consumer of the touched machine surfaces keeps its behavior: the nine-step triage table, tiers, skips, budget, JSON shape, relay leg tiers, and the `Fused:`-tolerant parsers | P5 | differential via existing suites + the unrecorded-tier sandbox case | lane agent | `bun test scripts/catalog.test.mjs scripts/unit-doc-contract.test.mjs` exits 0 and `node scripts/run-root-suite.mjs` exits 0 | G2 + G3 in `## Log` | planned |
| O8 | S16 (budgets) | The changed references and conductor stay inside the context-budget manifest; a ceiling exceeded is repaired by the declared re-base (a manifest source entry appended, never trimmed semantics), per the #432/#433 precedent | P5 | budget gate (+ declared re-base if exceeded) | lane agent | `bun scripts/check-skill-context.mjs --routes` exits 0 (or E-row records the re-base receipt and the gate re-runs green) | G4 in `## Log` | planned |
| O9 | S7, S16 | Executor-path wording change carries the golden-fixture ritual receipt: the run-log row appended `activity-fusion`-searchable and dated 2026-11-10, with weakest-model availability disclosed (the actual model run, or the manual-read-through substitution the file's own precedent rows sanction); the ritual's run never writes to the live tree | P5 | run-log row | lane agent | `rg -n "activity-fusion" docs/workflow/GOLDEN_FIXTURE.md` exits 0 with ≥1 run-log row | E9 in `## Log` | planned |
| O10 | S9, S16 | Repository state ships in the same change: the ATTRIBUTION row (S9), the roadmap row 434 status (disclosed hand edit — no writer exists, known-issues), the declared docs surface currency, the changeset intent, the regenerated projection, and the session log entry | P4 | docs/state | lane agent | `bun scripts/lint-changeset.mjs` exits 0, `bun scripts/docs-generate.mjs --check` exits 0, and `rg -n "434-tier-fused-design-plan" docs/ROADMAP.md` exits 0 | E7 + E8 in `## Log` | planned |
| O11 | S5 | Measured acceptance stated, never claimed: the standing obligation and open `## Future` row are frozen in this unit; no token/wall-clock number is asserted without its instrument | P3 | `## Future` + future-cost row | lane agent | `rg -n "≥3 real units" docs/fix/434-tier-fused-design-plan/SPEC.md` exits 0 with ≥1 match | E5 in `## Log` | planned |
| O12 | S17 | Ledger close discipline: every obligation row ends `verified` or evidenced-`n/a` on a foreground run; a `planned` row at handoff is the named blocker | P5 | ledger close | lane agent | `node scripts/unit-lineage.mjs --unit 434-tier-fused-design-plan` exits 0 naming `obligations closed` | E10 in `## Log` | planned |

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it. Frozen at the cut; `ac-hash:` in the frontmatter is the frozen section's
SHA-256.

| # | Criterion | Proved by |
|---|---|---|
| AC-S1 | `PLAN.md` carries the delta-provenance rule: the plan journals only `CLAIM-*` rows whose claim the design pass did not journal, sweeps only the delta rows, and the superseded full re-run sentence is deleted (S2.1) | `bun test scripts/activity-fusion.test.mjs` exits 0 (the delta-provenance cases) |
| AC-S2 | The `activity-fusion@1` block states the `standard` pass: one investigate→orient→ask→decide pass over the unit in one conductor session, decision points tagged design/plan, carriers separated (S2.2) | the same suite's standard-fusion prose cases exit 0 |
| AC-S3 | The same block states the `high` shape: separated stages, no new review turn or gate inserted (S3, S8) | the same suite's high-separation and no-resurrection cases exit 0 |
| AC-S4 | The precedence rule stands after the change — dependency topology first, smallest within a ready set, dependent validators after their prerequisites — pinned, not re-authored (S4) | the same suite's ordering case exits 0 |
| AC-S5 | The measured acceptance is stated as the standing obligation and the open `## Future` row, and no token/wall-clock number is claimed (S5) | `rg -n "≥3 real units" docs/fix/434-tier-fused-design-plan/SPEC.md` exits 0 with ≥1 match |
| AC-S6 | The change lands on exactly the named surfaces — the two lane references, the conductor's `SKILL.md`, `scripts/catalog.json` (plus its triage emitter and the unit's own pin suite) (S6) | `git diff --name-only main…HEAD` names only those plus the unit's declared docs/state files |
| AC-S7 | The golden-fixture ritual receipt exists: a run-log row dated 2026-11-10 naming the changed executor-path skill, with weakest-model availability disclosed honestly (S7) | `rg -n "activity-fusion" docs/workflow/GOLDEN_FIXTURE.md` exits 0 with ≥1 run-log row |
| AC-S8 | No reviewer pass is resurrected: the lane references add no verdict vocabulary and no gate receipt | `rg -c "SPEC-REVIEW-PASS\|PLAN-REVIEW-PASS" skills/unit-lane/` exits 1 with 0 matches |

## Triaged steps

Paste of `bun scripts/unit-route.mjs --triage 434-tier-fused-design-plan` at the
cut head `27275c94` (2026-11-10), verbatim:

```text
TRIAGE — 434-tier-fused-design-plan (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

(The `relay:` lines are this session's own runtime suggestion, not part of the
step list; the governing request S13 runs the change inline, no relay — the
same note the #433 precedent carries.)

## Findings

OPEN rows only (see the template's `findings-table@1` grammar above). Empty at
cut.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-10, the issue, verbatim:
  ```
  NEW FEATURE: tier-fused design/plan with delta provenance and topological task order

  Three coupled plan changes: (1) delta provenance — the plan journals only claims the design step did not already settle and sweeps only the deltas; (2) tier-fused activity — `standard` runs one investigate→orient→ask→decide pass over the unit in one conductor session with carriers separated; `high` keeps the cold pre-execution-review separation; (3) topological task order — prerequisite tasks precede their dependants regardless of size.

  Expected behaviour:
  1. In `standard`, the lane runs design and plan as one pass whose decision points are tagged design/plan; the plan journals only `CLAIM-*` rows whose claim the design pass did not journal (`INV-*`); the candidate-source sweep runs only over the delta rows; ACs stay the plan's input (never re-decided — existing rule, now the fusion's guard).
  2. In `high`, design and plan remain separated stages with the cold pre-execution-review between them — a deliberate cut, not a cost.
  3. Task ordering gains the precedence rule: dependency topology first, then smallest-first within a ready set; validator scheduling respects the same graph.
  4. Measured acceptance per #307's rule: tokens + wall-clock per unit, before/after, ≥3 real units, ≥2 models (arXiv 2610.37255's harness methodology).

  Where: `skills/unit-lane/references/PLAN.md` + `DESIGN.md`, the conductor's step contract (SKILL.md), `scripts/catalog.json` step graph.
  Path: One fix unit amending the two lane references plus the catalog graph; the golden-fixture ritual (GOLDEN_FIXTURE.md) applies because executor-path wording changes are a performance surface (arXiv 2610.37255).
  ```
- **E1** — 2026-11-10, `bun scripts/ceremony.mjs tier classify --paths "skills/unit-lane/references/PLAN.md,skills/unit-lane/references/DESIGN.md,skills/unit-lane/SKILL.md,scripts/catalog.json,scripts/unit-route.mjs,scripts/activity-fusion.test.mjs,docs/fix/434-tier-fused-design-plan/SPEC.md"` · exit 0 · `tier: standard`, `reason: 3 path(s) carry executable content`, no signals.
- **E2** — 2026-11-10, frozen-failure corpus search (S11): `rg -n "twice|duplicate|re-run" docs/fix/*/review-findings.md` over open findings and `git log --all --grep` over the plan-step history → no reproducer of a plan-step defect that delta provenance repairs; the corpus is empty and §2 pads nothing. The RED-first rule continues via the S2-isomorphic pins (PE-011).

## Next

Hand the diff to the owner for the external verdict (S17): the diff summary, the
obligations ledger state, the verification block, the §7 documentation state,
and every failed/skipped/pending check — no self-approval.

## References

- [#434](https://github.com/gtrabanco/agentic-workflow/issues/434) — this unit's
  issue (closed by the PR's `Closes #434`).
- [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) — the ODD
  direction; kernel amendment item 2; the measured-acceptance rule.
- [#432](https://github.com/gtrabanco/agentic-workflow/issues/432),
  [#433](https://github.com/gtrabanco/agentic-workflow/issues/433) — closed hard
  blockers (the certainty/admissibility vocabulary and the precedent
  enumeration this change builds on).
- [#269](https://github.com/gtrabanco/agentic-workflow/issues/269) — soft
  related: the fused pass authors the per-phase `Relevant files:` lines;
  #269's remaining P2 defines how the executor consumes them (author first —
  landed here, consumer unblocked).
- `docs/workflow/GOLDEN_FIXTURE.md`; `docs/fix/433-precondition-closure/` (the
  application-protocol precedent); `docs/fix/360-risk-tiered-ceremony/` (the
  measured-acceptance precedent).

## Branch

`fix/434-tier-fused-design-plan`

## Depends on

None — #432 and #433 are closed and merged; #307 and #269 are soft relations
recorded above (the dependency semantics live in the `## Dependencies` prose +
native `blocked-by`, `docs/workflow/ISSUE_WORKFLOW.md`).

## Regression scope

What previously-working behaviour must NOT break:

- Every unit type/scope combination's triage output (the catalog suite's
  step lists, tiers, skips, budget and JSON shape) — `bun test
  scripts/catalog.test.mjs`.
- The triage block's downstream parsers (`unit-cycle`, `unit-lineage`) — the
  root suite (`node scripts/run-root-suite.mjs`).
- The lane's high-tier shape: distinct design and plan stages, their carriers
  and gates exactly as today — pinned by `scripts/activity-fusion.test.mjs`.
- The pre-execution snapshot contracts (untouched files) — the root suite.
