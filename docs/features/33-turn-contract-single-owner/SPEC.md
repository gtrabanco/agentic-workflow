---
type: feature
scope: large
ac-hash: 754fd27fd45f8010f1c794007b1b8a5328f3648de3357de97d04e02960a2a470
---

# 33 — turn-contract-single-owner

> Feature unit doc for roadmap row 33 / issue
> [#173](https://github.com/gtrabanco/agentic-workflow/issues/173). Cut in the
> re-cut `spec-by-reference` shape. Size: **L** — planning ledgers live beside
> this doc as `planning-evidence.md` / `planning-obligations.md` (never both
> embedded and separate). The planning ledgers were frozen by the owner's
> apply-command workflow (which substitutes for the lane's plan step), not by
> `plan-feature` — the `## Triaged steps` block was still cut from the
> deterministic triage so the shapes stay the repo's own.

## Issue

`#173` — the PR closes it via `Closes #173`. Roadmap row 33. Features 30–32
(all merged) are the declared dependency gate; feature 52 (merged, PR #236)
pinned the machine profile this migration adopts per skill.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim — here
the issue body and its dated re-scope comments are the request. The frozen
apply-command (2026-11-08, this branch) is L1 in `## Log`; every later decision
cites its `S#`.

**S1 — Enforce the canonical turn contract's single-owner rule.**
> Enforce the canonical turn contract's own single-owner rule. Today `orchestration-envelope/references/TURN_CONTRACT.md` states "Single owner … All skills load this + skill-specific additions only. Duplication forbidden", but only 5 skills load it — 13+ user-invocable skills carry bespoke inline "Turn contract — verify before ending the turn" blocks, several containing boxes that belong to the canonical one (docs-language, `→ Next:` last), which is exactly the drift the rule exists to prevent.

**S2 — P0: the canonical contract gains a read-only profile.**
> **P0 — `TURN_CONTRACT.md` gains a read-only profile** (commit/push/PR boxes are inapplicable to read-only skills like `workflow-status`: "Nothing was edited, committed, pushed") so read-only skills can load the canonical contract instead of contradicting it.

**S3 — P1..Pn: one skill per phase, sequential, no batching.**
> **P1..Pn — one skill per phase**, sequential, no batching: `audit-pr`, `product-audit`, `triage-issue`, `fold-findings`, `plan-fix`, `ship-roadmap`, `workflow-status`, `init-workspace`, `log-session`, `generate-docs`, `audit-docs`, `discover-repository-state`, `resolve-repository-state` → load canonical + skill-specific additions only; reconcile contradictions with the canonical boxes; `check-skill-context` budgets re-based per phase (its ceiling mechanics are already automated); Pi mirror re-bundled (`npm run bundle:skills`) per phase.

**S4 — Final phase: the grep gate, pinned by a test.**
> **Final phase — grep gate**: no bespoke turn-contract block remains outside the canonical file (pinned by a test).

**S5 — Non-goals are contract, not commentary.**
> - No behavioral change to any skill beyond the contract text it already enforces — this is a single-source-of-truth refactor.
> - No schema/envelope changes (`orchestration-envelope` untouched beyond the read-only profile prose).

**S6 — Re-scope (2026-11-03 comment): the target set is the live non-canonical set, adopting feature 52's machine profile.**
> **Re-scoped scope:** migrate the 9 non-canonical skills to the canonical contract + skill-additions, one skill per phase, sequential, no batching; adopt feature 52's machine profile per skill; `check-skill-context` budgets re-based per phase; final grep gate pinned by a test (no bespoke block remains). The absorbed planning family stays out of scope (already noted in the 2026-09-22 re-scope).

**S7 — Deprecated targets (2026-11-07 comment) are honored, not migrated blindly.**
> - **Deprecated targets, 2026-11-07**: (1) the **fold-findings** phase dies when its retirement triggers land (#307 design note 6) — the skill leaves the tree, so it cannot migrate; drop the phase at that point, never migrate it first. (2) the **log-session** phase is reshaped by the fragment carrier (#405, merged) and #429's two-doors design — the migration there is prose alignment with the carrier flow, not the old inline contract. Net live targets shrink accordingly; the one-skill-per-phase sequencing rule stands.

## Impact

Live-tree recount at cut (2026-11-08, this worktree @ `0cb26ee2`; §Turn-contract
heading + in-section canonical-reference sweep over `skills/*/SKILL.md`):

| Class | Skills |
|---|---|
| Canonical loader (its `## Turn contract` section references `TURN_CONTRACT.md`) | `review-change` |
| Bespoke section (no canonical reference in the section) — the migration targets, size-ascending | `resolve-repository-state` (79 lines), `discover-repository-state` (83), `skill-lint` (133, internal), `workflow-status` (134), `batch-scheduler` (147), `triage-issue` (172), `log-session` (221), `audit-pr` (228), `audit-docs` (235), `product-audit` (283), `init-workspace` (313), `unit-lane` (332), `execute-phase` (364), `fold-findings` (390) |

(`Execute-phase`, `init-workspace`, `unit-lane` reference the canonical file
elsewhere in their bodies — the open-questions pointer — which is why the
2026-11-03 re-scope counted five "referencing" skills: those four plus the
speaker skill itself. Their sections never load the contract, though, so under
S1's own words — "All skills load this + skill-specific additions only. Duplication
forbidden" — they are bespoke sections and this gate pins the in-section rule.
Their migration is the cheap form: add the loader line, keep every
skill-specific box, drop only lines that duplicate canonical-owned boxes.
Amendment recorded as D-33-3.)

The stale lists are superseded by this recount, recorded so S6's "9" is read as
"the live non-canonical set": `plan-fix`/`generate-docs`/`ship-roadmap` do not
exist in the tree; `batch-scheduler` and `skill-lint` were born (or remained)
bespoke after the recount; the executor family shifted class since.
**Retired targets honored (S7):** `fold-findings` is still in the tree at cut,
so it migrates (its retirement triggers have not landed); `log-session`
migrates as carrier-flow alignment.

What consumes this unit: `scripts/turn-contract-grammar.test.mjs` reads the
canonical file's versioned blocks (they must not move); every migrated skill's
own gates and suites read its SKILL.md (`check-skill-context` budgets,
`skill-lint`, the Pi bundle parity tests); `docs/workflow/SKILL_AUTHORING.md`
states the 2–6-boxes authoring rule this unit supersedes and is amended in the
same change.

What must be asked before touching anything live: nothing — the change is
skill-prose + one test file; no command's behavior changes (S5).

## Retirements

Every bespoke inline turn-contract section outside
`skills/orchestration-envelope/references/TURN_CONTRACT.md`. Replacement: the
canonical loader line + skill-specific additions. Pin: the grep gate (S4) counts
`0` bespoke sections at close —
`bun test scripts/turn-contract-single-owner.test.mjs` exits 0.

## Non-goals

S5 verbatim, plus: no new skill, no repackaging, no rewrite of any
skill-specific addition's substance (only its duplication of canonical-owned
boxes), no roadmap resequencing beyond this row.

## Risk tier

- **`standard`** (S5's prose-only surface, fail-closed tier from
  `bun scripts/ceremony.mjs tier classify` at cut: `empty-change` — no path was
  staged yet, so nothing proved it inert and the tier closed upward; recorded
  verbatim in `planning-evidence.md` PE-002) · **Task Size** — verdict.task_size:
  understood, contained, resumable-from-diff
- **Named high-risk item** — `none — not a high-tier unit`

## Future

- The fold-findings phase dies when #307's retirement triggers land (S7, owner
  2026-11-07) — `open`, owned by issue #307, not this unit.
- #332-split guide dedup pass may further shrink the authoring rule this unit
  amends — `open`.

## Future cost

Every future skill gets its `## Turn contract` by loading the canonical file +
additions; a bespoke block re-appearing is a red gate (S4's test), and the
authoring rule in `SKILL_AUTHORING.md` binds every author to the loader shape.

## Applicable tests

- `bun test scripts/turn-contract-single-owner.test.mjs` (new gate, P1 red →
  close green)
- `bun test scripts/turn-contract-grammar.test.mjs`, `bun test scripts/normative-drift.test.mjs`,
  `bun test scripts/check-skill-context.test.mjs`, `bun scripts/skill-lint.mjs`,
  `bun scripts/check-skill-context.mjs` (+ `--documents`),
  `node scripts/run-root-suite.mjs`, and `packages/pi-agentic-workflow`'s
  `bun run test` (bundle parity).

## Known pre-existing issues

- The `postponed` label on #173 predates the owner's activation; does not block
  (only `human-revision-needed` blocks) — noted, not fixed here.
- Roadmap execution-order note still names #332 as prioritized over this row;
  superseded by the owner's direct activation (L1). Does not affect the change
  surface.

## Tasks

Phase labels are `P1, P2, …`; order is dependency-topological first, smallest
within a ready set. One skill per phase (S3): the fourteen bespoke skills sort
by SKILL.md size ascending after the two prerequisites.

- P1 — Cut the grep gate RED: `scripts/turn-contract-single-owner.test.mjs` pins
  "every `## Turn contract` section in `skills/*/SKILL.md` references the
  canonical `TURN_CONTRACT.md`"; fixture-validated on a scratch copy, committed
  failing, output recorded
  (Implements: S4)
  (validator: `bun test scripts/turn-contract-single-owner.test.mjs` exits 1 at this commit)
  Relevant files: scripts/turn-contract-single-owner.test.mjs
- P2 — Read-only profile in the canonical contract (prose; versioned blocks
  untouched)
  (Implements: S2)
  (validator: `bun test scripts/turn-contract-grammar.test.mjs` exits 0)
  Relevant files: skills/orchestration-envelope/references/TURN_CONTRACT.md
- P3 — Migrate `resolve-repository-state`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/resolve-repository-state/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill resolve-repository-state` exits 0)
  Relevant files: skills/resolve-repository-state/SKILL.md
- P4 — Migrate `discover-repository-state`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/discover-repository-state/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill discover-repository-state` exits 0)
  Relevant files: skills/discover-repository-state/SKILL.md
- P5 — Migrate `skill-lint`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/skill-lint/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill skill-lint` exits 0)
  Relevant files: skills/skill-lint/SKILL.md
- P6 — Migrate `workflow-status` onto the read-only profile
  (Implements: S1, S2, S3)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/workflow-status/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill workflow-status` exits 0)
  Relevant files: skills/workflow-status/SKILL.md
- P7 — Migrate `batch-scheduler` onto the read-only profile
  (Implements: S1, S2, S3)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/batch-scheduler/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill batch-scheduler` exits 0)
  Relevant files: skills/batch-scheduler/SKILL.md
- P8 — Migrate `triage-issue`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/triage-issue/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill triage-issue` exits 0)
  Relevant files: skills/triage-issue/SKILL.md
- P9 — Migrate `log-session` as carrier-flow alignment (S7)
  (Implements: S1, S3, S7)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/log-session/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill log-session` exits 0)
  Relevant files: skills/log-session/SKILL.md
- P10 — Migrate `audit-pr`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/audit-pr/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill audit-pr` exits 0)
  Relevant files: skills/audit-pr/SKILL.md
- P11 — Migrate `audit-docs`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/audit-docs/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill audit-docs` exits 0)
  Relevant files: skills/audit-docs/SKILL.md
- P12 — Migrate `product-audit`
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/product-audit/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill product-audit` exits 0)
  Relevant files: skills/product-audit/SKILL.md
- P13 — Migrate `init-workspace` (loader line + reconcile its duplicated
  canonical boxes)
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/init-workspace/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill init-workspace` exits 0)
  Relevant files: skills/init-workspace/SKILL.md
- P14 — Migrate `unit-lane` (loader line; skill-specific boxes stay)
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/unit-lane/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill unit-lane` exits 0)
  Relevant files: skills/unit-lane/SKILL.md
- P15 — Migrate `execute-phase` (loader line; skill-specific boxes stay,
  PREFLIGHT supplement pointer kept)
  (Implements: S1, S3, S6)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/execute-phase/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill execute-phase` exits 0)
  Relevant files: skills/execute-phase/SKILL.md
- P16 — Migrate `fold-findings` (still in tree — S7 honored)
  (Implements: S1, S3, S7)
  (validator: `rg -c 'references/TURN_CONTRACT.md' skills/fold-findings/SKILL.md` matches ≥1 and `bun scripts/check-skill-context.mjs --skill fold-findings` exits 0)
  Relevant files: skills/fold-findings/SKILL.md
- P17 — Close the gate: test green; amend `SKILL_AUTHORING.md`'s turn-contract
  authoring rule to the loader shape; README/docs currency sweep; budgets
  manifest re-base only where the arithmetic demands
  (Implements: S3, S4, S5)
  (validator: `bun test scripts/turn-contract-single-owner.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs` exits 0)
  Relevant files: scripts/turn-contract-single-owner.test.mjs, docs/workflow/SKILL_AUTHORING.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, README.md
- P18 — Verification block in the foreground: root suite, package tests, changeset,
  docs-generate projection, session log
  (Implements: S1, S4, S5)
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  Relevant files: .changeset/, docs/generated/, docs/LOGS.md

### Planning evidence

Ten Engineering claims, `PE-001…PE-010` — the M/L ledger lives in
`planning-evidence.md`; this section names it, never embeds it.

### Obligations

Ten obligations, `O1…O13` — the M/L ledger lives in `planning-obligations.md`;
this section names it, never embeds it. Before the handoff every row is
`verified` (or an evidenced `n/a`).

## Triaged steps

Paste from `bun scripts/unit-route.mjs --triage 33-turn-contract-single-owner` (cut 2026-11-08):

```text
TRIAGE — 33-turn-contract-single-owner (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
```

The apply-command (L1) substitutes for this unit's `plan` step (§5 froze the
ledgers) and redirects `review` to the owner as external verifier (§4, §8) —
the repo's own review/fold machinery never runs on this change.

## Acceptance criteria

One observable criterion per `S#`.

- **AC1 (S1)** — At close, zero `skills/*/SKILL.md` carries a bespoke turn-contract
  section: every `## Turn contract` section references
  `orchestration-envelope/references/TURN_CONTRACT.md`. Check:
  `bun test scripts/turn-contract-single-owner.test.mjs` exits 0.
- **AC2 (S2)** — `TURN_CONTRACT.md` carries a read-only profile naming the
  substitution for the commit/push/PR boxes, and every migrated read-only skill
  cites it instead of contradicting those boxes. Check: `rg -n 'read-only profile' skills/orchestration-envelope/references/TURN_CONTRACT.md` matches ≥1 and `rg -l 'read-only' skills/workflow-status/SKILL.md skills/batch-scheduler/SKILL.md skills/skill-lint/SKILL.md` lists all three.
- **AC3 (S3)** — Each live target was migrated in its own commit, in the phase
  order of `## Tasks`; per-skill context budget passes (`bun scripts/check-skill-context.mjs --skill <n>` exits 0 for all fourteen) and no budget re-base was needed beyond what the manifest's own arithmetic justifies (any re-base recorded with its source).
- **AC4 (S4)** — The grep gate exists as
  `scripts/turn-contract-single-owner.test.mjs`, was committed RED first (the
  red SHA and its failing output are `## Log` lines), and is green at close.
- **AC5 (S5)** — The diff touches only skill prose, `TURN_CONTRACT.md`'s
  read-only profile prose, docs surfaces, and the new test: `git diff main --stat -- packages/agentic-workflow-schema packages/pi-agentic-workflow/src` prints nothing, and `orchestration-envelope`'s diff is TURN_CONTRACT.md-only.
- **AC6 (S6)** — The SPEC's Impact section carries the recount table this cut
  measured, and the migration list is exactly its bespoke column.
- **AC7 (S7)** — The Log records the tree-presence decisions for both deprecated
  targets (fold-findings present → migrated; log-session → carrier-flow
  alignment).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #173
  ```
  (with the apply-command workflow §0–§9 attached, which substitutes for the
  lane's plan step: §5 froze these ledgers; §4 forbids the repo's own
  review/fold machinery on this change; §8 makes the owner the external
  verifier).

## Next

Hand the diff to the owner for verification (§8) — then PR + roadmap
`done` row + `Closes #173`.

## References

Issue #173 · Roadmap row 33 · Features 30/31/32 (dependency gate) · Feature 52
(PR #236, machine profile) · `skills/orchestration-envelope/references/TURN_CONTRACT.md` ·
`docs/workflow/SKILL_AUTHORING.md` §Turn contract

## Branch

`feat/173-single-owner-turn-contract` (exists, at `main` tip `0cb26ee2`).

## Depends on

Features 30, 31, 32 — all `done · merged` (roadmap rows 30–32). Feature 52 —
`done · [#236]`, the machine profile adopted per skill.
