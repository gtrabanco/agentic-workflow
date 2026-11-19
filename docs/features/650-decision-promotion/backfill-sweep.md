# 650 — backfill sweep carrier

The one-time audit-style pass issue #650's fifth in-scope element asks for: the
existing `decisions.md`, `architecture-notes.md` and `## Log` `D` lines read for
**promotable content** — a general rule whose scope is cross-unit and whose only
statement sits in a unit ledger. This file is the sweep's persisted findings
carrier (the finding rows below), not a second ledger: the promotions it landed
are in their owner docs, and the unit ledger rows that cited them link there.

## Method

Run once, at the plan's P12, over a declared sample — declared here before the
reading, so the sweep can be re-checked:

| carrier | sample | why |
|---|---|---|
| `docs/features/*/decisions.md` · `docs/fix/*/decisions.md` | every file (128), every machine-readable `decision` row (17) | the deterministic half: read through the crate's own parser by `bun scripts/decision-promotion.mjs .` |
| `## Log` `D` lines in the unit docs | every line whose date cell is 2026-11 or later (24 of 589) | the newest decisions, where the issue's own surfaces had already moved |
| `architecture-notes.md` | every file (27), its `## Contract impact` section | the issue names it as a carrier |

The deterministic receipt this pass consumed, quoted verbatim:

```text
decision-promotion@1
ledgers | read 128 · no-block 116 · unreadable 4 · decisions 17 · scoped 0 · cross-unit 0 · promoted 0
verdict | clean
```

Its three numbers are the sweep's own starting finding, and they are reported
rather than smoothed over:

- **`scoped 0`** — no decision row anywhere carries a scope cell, because the
  cell ships in this change. The rule therefore binds **forward**: nothing was
  back-filled into the existing rows, and a `legacy` row stays a decision of its
  day (`D4`).
- **`no-block 116`** — 116 of the 128 ledgers carry no `open-questions@1` marker
  at all (a records-only file, or a ledger whose decisions live in a prose
  table). The parser reads none of them, so the promotion rule cannot reach them
  until a unit touches them — the audit dimension reports them by count.
- **`unreadable 4`** — four ledgers carry the marker where the dispatcher cannot
  read it. Those are findings (`B1`–`B4`).

## Findings

`disposition` is one of: **promoted** (landed in an owner doc by this change),
**already-owned** (an owner doc already carries the rule — cited), **unit-only**
(binds the unit that took it, nothing to promote), **finding** (a defect this
pass reports rather than repairs).

| id | carrier:line | the statement | disposition | owner doc / evidence |
|---|---|---|---|---|
| B1 | `docs/features/644-substrate-gap-alarm/decisions.md:18` | the ledger's `open-questions@1` block sits after a prose paragraph and a heading, so the dispatcher refuses the file (`malformed-ledger-header`) and its questions read as none | finding | repair route: move the marker to the file's first block — the rule is now published in `skills/unit-lane/references/DESIGN.md` § Stage 3 (promoted as `B5`) |
| B2 | `docs/features/82-relay-lane-execution/decisions.md:7` | same defect: prose above the marker | finding | same repair route (`B5`) |
| B3 | `docs/fix/331-authoring-setup/decisions.md:11` | same defect: prose above the marker | finding | same repair route (`B5`) |
| B4 | `docs/features/84-published-vocabulary-sweep-gate/decisions.md:12` | a `decision` row records `lane decision under the owner's issue delegation` in the authority cell; the reader requires `human-owner` and refuses the ledger (`invalid-authority`) | finding | repair route: the row's authority cell names who decided — a delegated lane decision is not a `human-owner` row, so the row belongs in the `## Log` `D` shape the unit doc owns, with the authority named in prose |
| B5 | `docs/fix/303-investigate-orient-ask/decisions.md:61` | "A `decisions.md` is read only while its `open-questions@1` block is the first non-heading block … This is a reader-side ordering rule the skill prose does not state" — verified at this cut: `rg 'first non-heading\|ordering rule' skills/ template/ docs/workflow/` found no owner | **promoted** | `skills/unit-lane/references/DESIGN.md` § Stage 3 (the block is the file's readable span) + `template/AGENTS.md` § Workflow conventions (the same rule, one line, for a target project) |
| B6 | `docs/features/60-path-protection-guards/architecture-notes.md:34` | the shipped protected-path classes (a `**/*.test.*` write needs a `justification` record) — a cross-unit rule a unit author only meets by tripping it | already-owned | the machine: `packages/agentic-workflow/src/path-policy.mjs` classes + `template/.agentic-workflow/path-policy.json`; the contract: `skills/orchestration-envelope/references/TURN_CONTRACT.md` § `path-protection@1` |
| B7 | `## Log` `D` lines, 2026-11-04 (`docs/fix/103-doc-currency/SPEC.md`) | "every manual invocation was written as `node …`, which violates the guide's bun-first rule" | already-owned | `AGENTS.md` § "Runtime convention — bun runs scripts and tests"; the row itself cites the owner, so it is a repetition, not a promotion |
| B8 | `docs/features/84-published-vocabulary-sweep-gate/decisions.md:12` (`D2`) | "schema-package consts are canonical, prose surfaces and root scripts cite them" | already-owned | `docs/architecture/ARCHITECTURAL_INVARIANTS.md` `AI-001` (the owner) and `AGENTS.md` `IR1` (the always-loaded law row) |
| B9 | `docs/fix/303-investigate-orient-ask/decisions.md:62` | "the `OR-*`/`INV-*`/`ASK-*` row shapes the first attempt minted were published by no tool and read by nothing" | already-owned | `skills/unit-lane/references/DESIGN.md` § Stage 3 ("Do not invent a question table of your own") and `AGENTS.md` § Normative surfaces (a surface with no fixed grammar is the defect) |
| B10 | `docs/features/40-versioned-skills-releases/decisions.md:16` | "the installable unit is the repo at a ref, not a per-skill artifact; pinning needs one repo-wide release tag" | already-owned | `docs/workflow/PACKAGES.md` § release train and `AGENTS.md` § "No backward-compatibility support" (one train version, `D-40-14`) |
| B11 | `docs/fix/384-capability-risk-detection/decisions.md:12` (`D2`) | "the capability ids stay internal evidence … no new published vocabulary is introduced" | unit-only | binds that unit's analyser; the general rule it applies is `AI-001`, already owned |
| B12 | `docs/fix/440-product-audit-rescope/decisions.md:15` (`D-440-5`) | the changeset intent has its own deterministic gates run by the root suite | already-owned | `docs/workflow/PACKAGES.md` § changesets and the `lint-changeset` gate row in `docs/workflow/GATE_INVENTORY.md` |

## Promotions landed by this pass

| promotion | owner doc | what changed |
|---|---|---|
| `B5` — the ledger block's readable span | `skills/unit-lane/references/DESIGN.md` § Stage 3 | the rule is stated where the block's grammar is published, with the failing state named (`malformed-ledger-header`, questions read as none) |
| `B5` — the same rule for a target project | `template/AGENTS.md` § Workflow conventions | one bullet in the ledger's own rule list, no second copy of the grammar |

Both statements live in exactly one owner each; this carrier cites them and
does not restate them (`AGENTS.md` `IR11`).

## What the pass did not promote, and why

The remaining statements the sample surfaced were **unit-only** (a decision about
that unit's own analyser, corpus or ordering) or **already owned** (`B6`–`B10`,
`B12`): in each case an owner doc, a published const or a gate already carries
the rule, so promoting it would create the second copy this feature exists to
prevent. The one boundary the pass could not close is stated instead of guessed:
a rule that only ever appears in a **prose table** of a `decisions.md` (the 116
`no-block` ledgers) is invisible to the deterministic sweep, so it stays the
audit dimension's model remainder until that ledger is re-cut.
