# Issue #663 — skill surface: interview record and evidence-based diagnosis

Date: 2026-11-20 · Branch: `doc/663-skill-surface-interview` (clean vs `main` at `fc17d9661`) · Status: diagnosis only — no restructuring plan, no implementation.

This note is the evidence carrier for issue #663 after the interview. The issue
forbade analysis before the owner answered; the owner answered on 2026-11-20 and
asked for research, diagnosis and log review to decide with. Section 1 records
the interview, sections 2–3 carry the measured evidence, section 4 states the
decision points with a non-binding advisory each, section 5 declares what this
pass did not verify, and section 6 summarizes the log review the owner asked for.

## 1. Interview record (owner answers, 2026-11-20)

1. **Is the 30-skill surface a problem?** — *“Necesito asesoría y research,
   diagnóstico y revisión de logs por tu parte para poder decidir.”* The owner
   wants an evidence-based consultation before deciding; this note is that.
2. **Good-enough outcome** — reduce content that is redundant, copied or
   obsolete; reduce skills to minimum expression while doing the same; convert
   prose parts that are convertible to code via the universal CLI.
3. **Cost ceiling** — a full migration is acceptable.
4. **Sacred skills** — none named; the owner flagged `unit-lane` instead: it
   owns the whole development process and there is no obvious stop after design
   and plan for approval. Open proposal: rename the full-flow skill to
   something like `/flow` and split a design+plan entry like `define-unit`.
5. **Review pack** — undecided; the owner wants reviews adaptable by the user
   (“solo un método”) and questions whether fixed axes like accessibility make
   sense as shipped skills.
6. **Axis discoverability** — discovering each review axis individually is
   material.
7. **External consumers** — none known.
8. **Timeline** — wait; discuss only if the trim is actually pursued.

## 2. Verified tree facts vs the issue's claims

Measured on this branch (30 skill directories, all with a `SKILL.md`):

| Claim in issue #663 | Measured 2026-11-20 | Delta |
|---|---|---|
| 29 `SKILL.md` files | 30 | −1 |
| 13 user-facing skills (list of 15 names) | **14** carry `user-invocable: true`; `skill-lint` is `false` | issue's own list contradicts its count |
| 14 reference directories | 17 | −3 |
| ~5,220 lines of SKILL.md | 5,308 | drifted upward since the issue was written |
| 9 review-* passes with the same structure | **confirmed** — identical section skeleton (H1 / Scope / Checklist / Materiality bar / Return exactly / Done when) | exact |
| Progressive loading bounds token cost | confirmed — `SKILL_CONTEXT_BUDGETS.json` defaults: main ≤ 2,800 est / 240 lines, references ≤ 2,200 est / 280 lines, one hop deep | exact |

The count drift inside a freshly written issue is itself evidence: hand-rendered
counts rot. The repo already owns the fix pattern (`rendered-facts@1` in
`AGENTS.md` recomputes rendered values against their machine source).

## 3. Findings

### F1 — Size and token cost are a solved problem; the real costs are navigation and restatement drift

The 9 review passes are 71–129 lines each; the largest `SKILL.md` files are
`init-workspace` (444), `fold-findings` (435), `execute-phase` (412) and
`unit-lane` (382) — each carries machine-contract prose pinned by gates
(`check-skill-context.mjs` enforces the ceilings). No token emergency exists.
What measurably hurts is (a) navigating 30 names without a task-oriented view
and (b) duplicated prose drifting (section 2's table; F2).

### F2 — Duplication is real but narrow: one shared preamble, not the whole bodies

- `## Scope` bodies are **byte-identical in 8 of the 9 passes** (same md5;
  `review-debt` differs — it transforms instead of checking).
- The section skeleton and the checklist preamble line (“evaluate EVERY item —
  none is optional; n/a must be stated”) are identical in all 9.
- The discipline sections (`Materiality bar`, `Return exactly`, `Done when`)
  are **different in every pass** (9 distinct md5s over that region; `review-debt`
  has `## Transform` and no `## Materiality bar`).

Consequence: the issue's option (a) — one consolidated ~300–400-line skill —
would erase genuine per-axis differences or bloat them into conditionals. The
trim that survives the evidence is one owner reference carrying the shared
preamble (scope contract + checklist discipline), with the 9 files keeping their
unique checklists. The issue's merge-conflict worry is unproven: the 9 files
share almost no *edited* content (per-axis checklists differ), so the measured
friction is “the same edit repeated 9 times”, which a single owner reference
kills — that is exactly `IR11`'s “every repetition names its owner”.

### F3 — “Prose → code via universal CLI” is already the active direction, not a new one

Commit `fc17d9661` (#553, merged) declares “universal CLI coverage — no shipped
skill cites a script path”. Open issue #603 is its continuation (self-documenting
help surface, failure feedback with candidates, agent-facing usage knowledge
layer). The CLI already owns the mechanical steps: `unit-route --triage`
(closed catalog), `ceremony tier classify`, `pre-execution-snapshot`,
`needs-input`, `substrate check`, `ledger-provenance`, `diff-guard`,
`phase-lint`, `review-receipt verify`, `relevant-files`, `forge-read`,
`quality-metrics`, `doctor`, `skills register|inventory`, `roadmap rowUpsert`,
`docs-generate`, `journal name`, `memory probe`. The residual prose is
predominantly judgment work (checklists, design decisions) — not code-able by
nature. The efficient move is finishing #603, not opening a parallel effort.

### F4 — The `unit-lane` concern is evidence-backed where it matters: the missing approval stop, not the name

- **The gap is real.** The lane's design/plan steps end and the conductor
  hands off to `/execute-phase <NN-slug> P<k>` automatically across a turn
  boundary (`skills/unit-lane/SKILL.md` §4). The turn boundary is a pause, not
  an approval: nothing requires the owner to bless the design+plan before
  phases run. The pre-execution machinery (planning ledgers,
  `pre-execution-review`, `PRE_EXECUTION_GATE.md`, snapshots) is machine-checked,
  never human-approved.
- **Practice already runs ahead of contract.** Recent sessions show the owner
  externally verifying plans before implementation as an informal ritual
  (`docs/LOGS.md` 2026-11-16/17: planning ledgers frozen first, “Owner external
  verify … then push and open the single PR”, `external-verify.md` receipts).
  The ritual exists; the lane does not mandate it.
- **Naming has a measured cost and a mechanism constraint.** The pi package
  derives slash commands from skill names — “Each skill adds its command —
  there is no alias table to keep in sync”
  (`packages/pi-agentic-workflow/README.md`) — so `/flow` cannot be an alias
  without new machinery; it is a rename or a second skill. Live-surface rename
  cost: **731 mentions** (`skills/` 217, `packages/` 144, `docs/workflow/` 129,
  `docs/ROADMAP.md` 22, `template/` 18, `README.md` 13, plugin manifest 1),
  plus the closed-vocabulary surfaces (`normative-surfaces@1` rows, budgets
  routes, `alias-coverage`/`skill-parity` tests, staged copy). Historical
  surfaces (`docs/LOGS.md`, `CHANGELOG.md`, superseded SPECs) are records and
  stay untouched. Dogfooding adds a mandatory step: this repo consumes the
  installed release, so a rename lands only through release + pin bump.
- **A separate `define-unit` entry partially re-creates the retired surface.**
  The lane absorbed `design-feature`/`plan-feature`/`review-spec`/`review-plan`
  precisely to kill the fixed-pipeline split (`docs/workflow/SKILLS.md`; feature
  61). A second entry point that runs design+plan then stops must be designed
  against that history — same catalog, same references, one conductor — or the
  drift the absorption ended comes back.

Options, smallest first: **(A)** an explicit approval stop inside the lane
after the plan step (the conductor halts with an owner-approval block; the
owner's yes is the only key forward) — no rename, no new skill; **(B)** rename
`unit-lane` → `flow` with `define-unit` as a second entry over the same catalog;
**(C)** rename only. (A) addresses the evidenced need; (B)/(C) add discoverability
value at measured cost.

### F5 — Review adaptability: the substrate already exists; the built-in pack is the shipped method

- **External axes are already a designed route**: the guide's
  “Optional review extras” note + `review-extras@1` registration ledger
  (`template/AGENTS.md`; `agentic-workflow skills register|inventory`; decay
  states `unpinned|stale|incomplete` audited by `product-audit`). A user who
  wants an axis the repo does not ship registers their own skill as an extra.
- **Ceremony is already adaptable**: `ceremony-profile@1` publishes
  `review-passes` as a piece a target project can pay or discard
  (`CEREMONY_PROFILE_PIECES`/`ADOPTIONS` in the schema package).
- **Axis applicability is already conditional**: `review-change`'s matrix runs
  `design`/`a11y`/`brand`/`seo` only on the surfaces they apply to (web/TUI/
  output text), so a project without a UI never triggers those passes.
- What is *not* user-editable is the 9 built-in checklists — deliberately: the
  repo ships one version at a time (`IR6`), and an installed skill a user edits
  is overwritten by the next update. The coherent shape is: built-in pack is
  the method; user axes are external extras. This also satisfies answer 6
  (per-axis discoverability): one skill per axis already makes each axis
  individually reachable, and merging would reduce exactly that.

### F6 — Obsolete/redundant content: thin harvest in live surfaces

Retired names (`design-feature`, `review-spec`, `review-plan`, `ACCEPTANCE.md`)
appear in live docs only as history or migration records (`FEATURE_WORKFLOW.md`,
`MIGRATION.md`, `SKILLS.md` context lines) — not as instructions. No stale
instruction block was found in `skills/`. The measured rot is metadata (section
2's counts), not prose. The “redundant/copy” harvest is F2's preamble; the
“obsolete” harvest is currently empty.

## 4. Decision points (owner's)

| # | Question | Advisory (non-binding) |
|---|---|---|
| D1 | Big restructure now? | No. The surface is already lean where the evidence points; the costs are navigation and repetition, and both have narrow fixes. |
| D2 | Review pack shape | Keep 9 separate (matches answer 6 and F5). If the trim proceeds, extract the shared preamble into one owner reference (F2); do not consolidate bodies. |
| D3 | `unit-lane` | Land the approval stop first (F4-A) — it is the evidenced need. The rename to `/flow` and/or `define-unit` is a separate decision with its own unit; a second entry must reuse the closed catalog, not fork it. |
| D4 | Prose → CLI | Continue #603; do not open a parallel direction. |

A trim unit, if the owner orders one, is bounded: F2's preamble extraction, the
F4-A stop, and the section-2 count corrections — none of it a 30-file rewrite.

## 5. What this diagnosis did not verify

- Whether `Return exactly` formats could ever merge (they differ by design).
- The full `check-skill-context --routes` impact of a rename (plan-stage work,
  only if D3's rename is ordered).
- Whether any pi-package alias mechanism exists beyond the README's “no alias
  table” statement (no contradicting evidence found).

## 6. Log review (owner request)

Recent sessions (`docs/LOGS.md`, journal fragments of 2026-11-16 → 11-20) show:
#553 landed universal CLI coverage; #655 (git identity guard) and #526/#470/#590/
#595 corrections landed through the owner-external-verify ritual; #603, #600,
#598, #634, #613/#614, #444, #295 are open features. The plan-approval ritual
the owner asked about in D3 is practiced informally but written nowhere as a
lane requirement — the one place where practice and contract visibly diverge.

## Addendum — disposition of the disclosed node-runtime defect (2026-11-20)

The finding in the passive record's readback (node exits 0 on a dirty close;
introduced by #553 at `fc17d9661`) was repaired the same day as an owner-directed
inline batch on `main` per AGENTS.md §Working rules: commit `c830b2879` adopts
the dispatch spelling `check-skill-context.mjs` already used
(`main(...) ?? process.exitCode ?? 0`); `scripts/session-close.test.mjs` is
30/30 under node and bun, and `main` was pushed. The crate's own dispatch path
(`runRunnerCommand`) needed no change — it already honored the contract.

## 7. Owner verdicts, second round (2026-11-20) — and the parked unit-lane split sketch

Verdicts over §4's decision points:

- **D2** (review pack shape): approved — extract the shared preamble into one
  owner reference; the 9 passes stay separate.
- **D3** (`unit-lane`): superseded by a larger direction (below). The small
  approval-stop proposal is folded into it — do not file separately.
- **D4** (prose → CLI): **no superseed** of #603; it keeps its roadmap row with
  no hard ordering against the trim — no dependency either direction (the
  preamble and the count pins touch judgment prose, not CLI usage knowledge).
  For the split's pi mechanism specifically, #603's self-documenting help is
  complementary and slightly ahead of it: new commands want a discoverable
  usage surface.
- **D1** (big restructure): declined — bounded trim only.
- Trim items 2 and 3 may ride as separate units; no ordering constraint between
  them (the preamble extraction changes no count the facts rows would pin).

### The unit-lane split — parked sketch (owner direction; mechanics open)

The owner's frame: the split lives in the **pi layer** — the friendly command is
a pi-agentic-workflow surface, not a portable skill boundary. Desired shape:

- One command runs the whole ceremony to done — guardrails intact:
  ask-don't-infer, the design interview when answers are unknown, halts on open
  questions; it never invents what it does not know.
- A second command runs design + plan only and stops for owner approval.
- Resume **in the same conversation** by re-invoking with `--yes`
  (pi-durable for one-shot units that load no other context); fresh-context
  paths (Relay legs) remain for big or isolated units. Per-command model
  routing (already in the pi config) is a driver for two commands: the strong
  model for design+plan, cheaper tiers for execution phases.

Mechanical options for the future unit to decide:

1. **Two pi commands over ONE skill via a command-preset feature** (config:
   command → skill + fixed args + optional model route). New small mechanism —
   the pi package today derives commands strictly from skill names ("there is
   no alias table to keep in sync"). A preset keeps the portable skill name
   untouched (no 731-mention rename) while giving the owner's `/unit` +
   `/define-unit` typing surface — the option that matches the owner's "it is
   a pi subcommand" frame at the lowest cost.
2. Flags on one command (`--define-only`, `--yes`) — zero machinery, but no
   per-command model routing.
3. Two skills — rejected: forks the closed catalog (feature 61's absorption).

Open questions parked with it: command names; whether define-only is a triage
profile of the closed catalog or a flag; `--yes` provenance (owner-typed only,
recorded in `decisions.md` as a human-owner D row, never agent-supplied);
same-conversation resume via pi-durable vs a plain session continue; the
interaction with the close-out ladder, the receipt stages and
`--retriage`/`--fix`/`--from-issue`.

This section is the resumption evidence for that unit's pre-spec; nothing here
is a plan yet.

## 8. Trim filed on the forge (2026-11-20)

The two approved trim units are filed as feature issues (labels `feature`,
`needs-triage`, `## Surfaces` declared, no `blocked-by` edges — none blocks):

- **#667** — review pack: one owner reference for the shared pass preamble; the 9 passes keep their own checklists (D2).
- **#668** — rendered-facts rows for the skill-surface counts, recomputed from the tree (the counts section 2 measured rotting).

No ordering constraint between them (disjoint surfaces and test-impact sets).
The unit-lane split (§7) stays parked with the owner; the inline session-close
fix is already on `main` (`c830b2879`, §Addendum).
