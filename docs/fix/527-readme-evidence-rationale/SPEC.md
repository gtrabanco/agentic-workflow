---
type: fix
scope: xs
---

# fix/527-readme-evidence-rationale

> The workflow's rules are cheap to state and expensive to earn: every one of
> them costs tokens, turns or a wait, and the measurements that justified them
> lived only in `docs/research/` and `ATTRIBUTION.md`, where nobody reading the
> README would find them. This unit adds the missing map — one README section
> pairing each **shipped** decision with the study or measurement behind it — and
> nothing else: no new claim, no new figure, no mechanism that does not exist.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#527` — a README section documenting the evidence base behind the workflow's
design decisions, so the "why" survives next to the "what". The PR closes it via
`Closes #527`.

The issue was filed `postponed` with a dated activation condition (S4). The
owner's order in this session un-postpones it; the authority is recorded as `D1`
rather than assumed.

## Specs

**S1 — apply the issue.**
> Apply to this repository: issue #527

**S2 — what the unit is.**
> **Docs-only unit, deferred by the owner (2026-11-12)**: a README section documenting the **evidence base** behind the workflow's design decisions, so the "why" survives next to the "what".

**S3 — where the research lives.**
> The full research and verdict tables live in `docs/research/2026-11-12-input-quality-and-editing/` (committed with this issue's registration).

**S4 — the activation condition.**
> **Before the next stable release cut.** Until then this stays `postponed` (same pattern as #444's dated activation condition).

**S5 — the seven decisions and the evidence to cite, verbatim.**
> | Decision already shipped | Evidence to cite |
> |---|---|
> | Risk-tiered ceremony (proportional to risk, never size) | scripts/risk-tiers.mjs design; Cockburn *Crystal* (ATTRIBUTION row 2026-11-10); measured token deltas rule |
> | Cross-family review rule (never review with the writer's family) | arXiv 2604.19049 (cross-family critics catch correlated blind spots); arXiv 2610.22382 (same-model elicitation/verification can HURT — negative pass@1) |
> | Spec-by-reference unit docs | gentle-shell#1718 measured (paraphrased handoffs failed 13/26; spec-by-reference accepted first round); arXiv 2609.36789 (GitHarness — local updates, never global rewrites) |
> | The editing stack: LSP localizes → verbatim whole files → regenerate (new behavior) / block-diff (refactor) → preservation instruction | arXiv 2611.07286, 2610.21073, 2609.05779, 2604.27296, 2609.04061 |
> | Deterministic gates over prose rules | arXiv 2606.22528 (Governance Decay: constraint violations 0→19–59% post-compaction); D-31-6 |
> | Never-auto-merge | arXiv 2605.22534 (merge outcome ≠ quality signal — 15.4% of merged agentic PRs needed reviewer involvement after); arXiv 2606.13175 (accountability gap of automated approvals) |
> | rg-first over grep; commands+boundaries over derivable descriptions | arXiv 2602.11988 + 2601.20404 (AGENTS.md studies); 2605.10039 (instruction adherence) |

**S5a — the stale carrier in S5's first row.**
> scripts/risk-tiers.mjs

The row's path cell is quoted above word for word, with the issue's code-span
formatting dropped: the document reader treats a backticked path as a *claim on
the tree*, and this one is retired. It no longer exists —
`edde336c` (`refactor(352): retire the migrated runtimes from scripts/`) moved
it to `packages/agentic-workflow/src/runner/risk-tiers.mjs`. S7's "no unverified
claim" governs the README, so the section cites the shipped path and this
correction is recorded (`PE-002`, `O1`) instead of quoting a retired one.

**S6 — the dependency and the shipping rule.**
> | #307 | soft (prose) | Much of the rationale documents #307's direction — the section must state **shipped** behavior, so it lands after the direction's headline slices. |

#307 is `CLOSED`, so the soft gate is satisfied (`PE-001`).

**S7 — the non-goal.**
> - No new claims: every citation comes from the committed research folder or ATTRIBUTION.md — the README states no unverified figure (the README is a narrative surface; the sweep is the evidence carrier).

## Impact

- `README.md` — one new section, `## Why it works this way`, between
  `## Core principles` and `## Install`: a seven-row decision → evidence table,
  the "recorded, not shipped" note for the editing stack's fourth rung, and a
  pointer to the committed sweep.
- `docs/fix/527-readme-evidence-rationale/` — this unit doc, its frozen ledgers
  and its decision record.
- `docs/ROADMAP.md` — feature row 527 (`idea · postponed` → the in-flight form)
  and one `## Fixes` row, both through the crate's receipted writers.
- `docs/generated/**` — re-rendered by the emitter, never hand-written.
- `.agentic-workflow/journal/` — one narrative fragment for the session.

Consumers of what changes: nobody executes this prose. The nearest consumer is
`audit-docs`, which compares the README against the roadmap and the code — so
every claim the section makes must name a surface that exists, which is what
`O1`, `O4` and `O5` verify rather than assume.

## Retirements

Strictly additive, so the answer is the computed surface inventory rather than a
retire list (`E13`). Nothing in the tree becomes obsolete: the section adds no
script, grammar, manifest entry or vocabulary, and the only name it introduces —
the heading `## Why it works this way` — has no consumer anywhere in the tree
(`rg -c 'Why it works this way' --glob '!README.md'` → 0), so there is no second
home to reconcile and no surface to retire.

The pre-existing prose this unit supersedes is zero by construction: the README
carried no evidence section before (`git show 7b18226b:README.md | rg -c
'Governance Decay|2606\.22528'` → 0), and `## References` stays exactly as it is
— it is a loose bibliography, this section is the decision→evidence map, and
they cite different things for different purposes.

## Non-goals

- **No new claims, no new figures** (S7): every number the section states is
  quoted from a committed file, and every arXiv id resolves there. The section
  never becomes an evidence carrier.
- **No mechanism is documented as shipped that is not shipped** (S6): the
  editing stack's preservation rung is marked recorded-not-shipped and names
  its carrier.
- **No change to `docs/research/` or `ATTRIBUTION.md`.** Nothing is adopted
  here, so no row is appended; the ledger's own rule is that a row appears when
  an idea is *adapted*, not when an already-shipped decision is explained.
- **No new gate, script, fixture, template block or vocabulary.** A prose
  section needs no machine surface, and inventing one is the ceremony this
  repository removes rather than adds.
- **No README rewrite.** The existing sections stay byte-identical; the section
  is inserted, never a section moved or reflowed.

## Risk tier

Computed by the closed ceremony CLI over this change's own path set, copied
verbatim, never written from memory (`E4`):

- **Tier** — `passive` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: none`, `verification: readback` · **signals** — `[]`
- **Reason** — `every changed path is documentation, an image or prose: no
  executable effect` (`reason_kind: no-executable-effect`).
- **Named high-risk item** — none — not a high-tier unit.

The `passive` contract's "no unit-doc ceremony" and §5's unit-doc order coexist
the way fix #500 and fix #560 resolved them: the prose change keeps its readback
in this doc's `## Log`, the ledgers §5 orders are cut here, and no
`docs/passive/` record is created beside it — one change, one carrier (`D2`).

## Future

`none` — nothing was deferred. The evidence base itself defers work, but to its
own carriers: the elicitation layer is #526, the repair-mode rung is recorded on
#307, and the post-stable context wording is the sweep's item 3.

## Future cost

- **Every new row of that table owes a committed citation.** A decision added to
  the section without a source in `docs/research/` or `ATTRIBUTION.md` restates
  a claim the ledger cannot audit — it is a defect against S7, not a style
  preference. Binds: whoever next edits the section.
- **A recorded-but-unshipped rung must flip its own wording when it ships.**
  The note marks the preservation instruction `recorded, not shipped` and names
  its carrier (#307). Binds: the unit that ships the repair mode.
- **The section is a map, never a second evidence carrier.** A figure added here
  that the sweep does not carry splits the truth in two. Binds: review.

## Applicable tests

`n/a — no tests step for this fix`. A prose-only change: `bun
scripts/test-impact.mjs --base 7b18226b` answers `verdict: empty` with 0
executable paths, so no test is invented and no existing suite is weakened
(`E10`, `O7`). The section's own claims are verified by their citation sweep
(`E6`), which is a readback, not a suite.

## Known pre-existing issues

- **The issue's first evidence row names a retired path** (S5a): the issue's
  row-1 cell points at a `scripts/` module `edde336c` retired.
  `affects` this unit — the section must cite the shipped classifier, and the
  correction is recorded in S5a/`O1` rather than silently applied.
- **`ATTRIBUTION.md` carries no row for arXiv 2606.13175**, while
  `docs/research/papers-sweep-2026-11-06-merge-gates.md:14,34` does.
  `does-not-affect` this unit: S7 admits "the committed research folder **or**
  `ATTRIBUTION.md`", and the addendum is the committed research folder. Filed as
  an observation, not repaired here (repairing a ledger is its own unit).
- **The worktree shipped without `node_modules`/`schema dist`**, so every
  ceremony CLI call fails until `bun install --frozen-lockfile` plus the schema
  build run (`E2`). Environmental, `does-not-affect` the change.
- **Concurrent worktrees on this machine** make the shared `prose-gate-inventory`
  check sensitive to another session's `multiple-homes` state. `does-not-affect`
  the section: it adds no gate row, and the receipt is recorded where it fires.

## Tasks

- P1 — Cut the frozen ledgers and the decision record in this doc.
  (Implements: S1, S2, S4)
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/527-readme-evidence-rationale/SPEC.md` exits 0)
  - Relevant files: docs/fix/527-readme-evidence-rationale/SPEC.md
- P2 — Insert the evidence section in the README: seven decision rows, each naming its shipped
  carrier and its committed citation, stating shipped behaviour only and adding
  no figure the committed sources do not carry.
  (Implements: S2, S3, S5, S6, S7)
  (validator: `sed -n '/^## Why it works this way/,/^## Install/p' README.md | rg -c '^\| \*\*'` prints `7`, and the citation sweep `E6` exits 0)
  - Relevant files: README.md
- P3 — The indexes: roadmap row 527 and its `## Fixes` row through the crate's
  receipted writers, the generated projection through the emitter, the session
  fragment through the journal writer.
  (Implements: S1, S4)
  (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/roadmap-settle.mjs` exits 0)
  - Relevant files: docs/ROADMAP.md, docs/generated/units.md
- P4 — The verification sweep: the unit-doc readers, the projection, the touched
  suites and the offline root gate.
  (Implements: S1)
  (validator: `bun scripts/local-gate.mjs --skip-network --jobs auto` exits 0)
  - Relevant files: README.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-probe | The §0 state is "continue": branch `feat/527-readme-evidence-rationale` sits 0 commits ahead and 0 behind `main` at `7b18226b`, no `docs/fix/527-*` dir exists, no `EXTERNAL VERIFY` block or review verdict exists for it, issue #527 is `OPEN` with `backlog`+`postponed`, and its only dependency #307 is `CLOSED` | `git rev-list --left-right --count main...HEAD`, `ls docs/fix`, `gh issue view 527 --json labels,state`, `gh issue view 307 --json state`, this session | run 2026-11-17 at `7b18226b` | S1; D1, D3 |
| PE-002 | committed-source | The risk-tiers module the issue names no longer exists under `scripts/`: its last commit is `edde336c refactor(352): retire the migrated runtimes from scripts/`, and the shipped classifier is `packages/agentic-workflow/src/runner/risk-tiers.mjs` | `git log --all --oneline` over the retired module → `edde336c …`; `ls packages/agentic-workflow/src/runner/risk-tiers.mjs` → present | read 2026-11-17 at `7b18226b` | S5, S5a, S7; O1 |
| PE-003 | committed-source | The evidence carrier exists and carries the verdicts: `docs/research/2026-11-12-input-quality-and-editing/` holds `README.md` (136 lines, the narrative + the 13/26 measurement) and `papers-sweep.md` (222 lines, one verdict row per paper) | `wc -l docs/research/2026-11-12-input-quality-and-editing/*.md` → `136`, `222` | read 2026-11-17 at `7b18226b` | S3; O2, O3 |
| PE-004 | committed-source | Every figure the section states is present verbatim in a committed file: `0% to 19–59%` (`docs/workflow/GATE_INVENTORY.md:16`), `13/26` and "accepted first round" (sweep `README.md`), `+6.3 points` and "negative strict pass@1" (`papers-sweep.md` §2610.22382), `17–39%` (§2611.07286), `+6.3`/`+9.3`/`+12.7` (§2610.21073), `−30%` (§2604.27296), `0.195 → 0.131`/`−26.6%`/`+2.3` (§2609.04061), `15.4%`/`33.1%` (`papers-sweep-2026-11-06-merge-gates.md`), `+20%` (`ATTRIBUTION.md` row 2602.11988) | the sweep files, `ATTRIBUTION.md` and `GATE_INVENTORY.md` at this head | read 2026-11-17 at `7b18226b` | S5, S7; O2, O3 |
| PE-005 | committed-source | arXiv 2606.13175 has no `ATTRIBUTION.md` row but is committed in the research folder — the accountability-gap claim is at `papers-sweep-2026-11-06-merge-gates.md:14` (verdict) and `:34` (the decision it shaped) | `rg -n '2606\.13175' docs/research/` → two files, `ATTRIBUTION.md` absent from the match set | read 2026-11-17 at `7b18226b` | S7; O2 |
| PE-006 | committed-source | The editing stack is only **partly** shipped: the five papers are `evidence only` in `ATTRIBUTION.md` (nothing adopted), the sweep states the preservation instruction is a candidate amendment recorded on #307 and that the composed stack's four other rungs already have homes; the shipped rungs this repository can name are Serena provisioning (`docs/features/67-serena-provisioning/`) and each phase's `Relevant files:` line (`skills/phase-contract/SKILL.md`) | `ATTRIBUTION.md` 2026-11-12 rows; `papers-sweep.md` §"The composed stack"; `ls docs/features/67-serena-provisioning`; `rg -n 'Relevant files' skills/phase-contract/SKILL.md` | read 2026-11-17 at `7b18226b` | S5, S6; O4 |
| PE-007 | committed-source | The merge rule ships as `audit-pr`'s SHA-bound MERGE-READY receipt plus a conductor that cannot merge — `FORBIDDEN_VERBS = new Set(["merge", "fullauto-merge"])` — and the old automated-merge authority `ship-roadmap` no longer exists in `skills/`, so the section must not name it | `packages/pi-agentic-workflow/src/conductor/loop.ts:56`; `ls skills \| rg ship-roadmap` → nothing; `packages/pi-agentic-workflow/test/conductor-loop.test.mjs` (AC9) | read 2026-11-17 at `7b18226b` | S5, S6; O5 |
| PE-008 | committed-source | README growth is not budget-gated: the context manifest's `documents.files` declares `AGENTS.md` and the `docs/workflow/` references, never `README.md` | `jq '.documents.files \| keys' docs/workflow/SKILL_CONTEXT_BUDGETS.json` | read 2026-11-17 at `7b18226b` | S2; O6 |
| PE-009 | measured-probe | The change is `passive`: `ceremony tier classify` over the declared path set returns `tier: passive`, `reason_kind: no-executable-effect`, `signals: []` | `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "README.md,docs/fix/527-readme-evidence-rationale/SPEC.md,docs/ROADMAP.md"` | run 2026-11-17 at `7b18226b` | Risk tier; D2 |
| PE-010 | measured-probe | The impact set is empty, so no test is invented: `test-impact` answers `verdict: empty` over the unit's own diff | `bun scripts/test-impact.mjs --base 7b18226b` | run 2026-11-17 at `7b18226b` | Applicable tests; O7 |
| PE-011 | measured-probe | The generated projection is **clean at base**, so any drift after the change is this unit's own rather than pre-existing | `bun scripts/docs-generate.mjs --check` at `7b18226b` → exit 0, 0 stale | run 2026-11-17 at `7b18226b` | O8 |
| PE-012 | committed-source | The index writers are the crate's, not a hand edit: `roadmap rowUpsert` (features table) and `roadmap fixrow` (the `## Fixes` table) are CAS-guarded (`--expect`) and return a receipt | `packages/agentic-workflow/src/edit/Roadmap.mjs:166,412`; `packages/agentic-workflow/bin/agentic-workflow.mjs:1317-1425` | read 2026-11-17 at `7b18226b` | S4; O9, O10 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S5, S5a, S7 | The risk-tiered-ceremony row names the classifier that ships, never the `scripts/` path `edde336c` retired | P2 | P2 | direct application (this session) | `rg -c 'packages/agentic-workflow/src/runner/risk-tiers.mjs' README.md` → 1 and `rg -c 'scripts/risk-tiers.mjs' README.md` exits 1 | `E` line in `## Log` (E5) | planned |
| O2 | S3, S7 | Every citation the section makes resolves in a committed file — one `rg` per arXiv id and per named project source, all matching at least once | P2 | P2 | direct application (this session) | the citation sweep, one `rg` per id over `docs/research/ ATTRIBUTION.md` | `E` line listing the resolved sources (E6) | planned |
| O3 | S5, S7 | No unverified figure: every number the section prints is quoted from a committed source, byte for byte | P2 | P2 | direct application (this session) | one `rg -F` per figure over the committed sources | `E` line, one row per figure (E7) | planned |
| O4 | S5, S6 | The section states shipped behaviour only: the editing-stack row names the two rungs that ship and marks the preservation rung `recorded, not shipped` with its carrier | P2 | P2 | direct application (this session) | `rg -c 'recorded, not shipped' README.md` → 1 and `rg -c '67-serena-provisioning\|Relevant files' README.md` ≥ 1 | `E` line (E8) | planned |
| O5 | S5, S6 | The never-auto-merge row names the carriers that exist (the MERGE-READY receipt, the conductor's forbidden verbs) and names no retired authority | P2 | P2 | direct application (this session) | `rg -c 'ship-roadmap' README.md` exits 1 and `rg -c 'MERGE-READY' README.md` ≥ 1 | `E` line (E9) | planned |
| O6 | S2 | README growth moves no budget: the context manifest's `documents` ceilings are untouched and still pass | P2 | P2 | direct application (this session) | `git diff --name-only 7b18226b...HEAD -- docs/workflow/SKILL_CONTEXT_BUDGETS.json` → no output; `bun scripts/check-skill-context.mjs --documents` exits 0 | `E` line plus the gate `G` line (E10, G3) | planned |
| O7 | S1 | No test is invented and no suite is weakened for a prose change: the impact verdict is `empty` and no `scripts/*.test.mjs` moves | P2 | P2 | direct application (this session) | `bun scripts/test-impact.mjs --base 7b18226b` prints `verdict: empty`; `git diff --name-only 7b18226b...HEAD -- 'scripts/*.test.mjs'` → no output | `E` line (E11) | planned |
| O8 | S1 | The generated projection is re-rendered by the emitter, never hand-written, and is clean at head | P3 | P3 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 at head | `E` line (E12) plus the gate `G` line | planned |
| O9 | S4 | The index rows land through the crate's receipted writers — feature row 527 and its `## Fixes` row — and never as a hand edit | P3 | P3 | direct application (this session) | `roadmap read docs/ROADMAP.md --nn 527` prints the new row; both writes return a `rowUpsert`/`fixRowUpsert` receipt | `E` line with both receipts (E13) | planned |
| O10 | S4 | The dated activation condition is recorded, not silently dropped: the un-postpone authority is a decision line and row 527 stops reading `idea · postponed` | P1 | P1 | direct application (this session) | `rg -c 'idea · postponed' docs/ROADMAP.md` for row 527 → 0 after `E13`; `rg -c '^\- \*\*D1\*\*' docs/fix/527-readme-evidence-rationale/SPEC.md` → 1 | `E` line (E13) plus the `D1` line | planned |
| O11 | S1 | The unit doc lints PASS under its own grammar and every obligation closes through the readers | P1 | P4 | direct application (this session) | `phase-lint` exits 0 with `verdict PASS`; `verify` exits 0 with `obligations-closure` ok | `G` lines (G1, G2) | planned |
| O12 | S2 | The section is discoverable where the "what" is: it sits between `## Core principles` and `## Install` and names `docs/research/` as its carrier | P2 | P2 | direct application (this session) | `awk` over the two headings prints ordering `Core principles < Why it works this way < Install`; `rg -c 'docs/research/2026-11-12-input-quality-and-editing/' README.md` ≥ 1 | `E` line (E14) | planned |

## Acceptance criteria

One observable, testable criterion per requirement, each naming the check that
proves it (frozen at cut):

- **AC1 (S1)** — the issue lands as one change whose ledgers were cut before the
  README edit: `git log --oneline 7b18226b..HEAD` names the unit-doc commit
  before the README commit, and `phase-lint` prints `verdict PASS` (G1).
- **AC2 (S2)** — the README carries one section documenting the evidence base,
  placed beside the "what": `rg -c '^## Why it works this way' README.md` → `1`
  and the ordering check prints `Core principles < Why it works this way <
  Install` (E14).
- **AC3 (S3)** — the section names the committed research folder as the carrier:
  `rg -c 'docs/research/2026-11-12-input-quality-and-editing/' README.md` ≥ `1`
  (E14).
- **AC4 (S4)** — the dated activation condition is honoured and recorded: `D1`
  carries the owner's authority and `roadmap read docs/ROADMAP.md --nn 527` no
  longer prints `idea · postponed` (E13).
- **AC5 (S5)** — all seven decisions are documented: `sed -n '/^## Why it works
  this way/,/^## Install/p' README.md | rg -c '^\| \*\*'` → `7`, with each row's
  citation resolving (E6).
- **AC6 (S6)** — no unshipped behaviour is described as shipped: the one
  recorded-only rung is marked `recorded, not shipped` and the never-auto-merge
  row names no retired authority (E8, E9).
- **AC7 (S7)** — no new claim: every arXiv id in the section resolves in
  `docs/research/` or `ATTRIBUTION.md`, and every figure is quoted verbatim
  (E6, E7).

## Triaged steps

n/a — no `## Triaged steps` block: this unit is applied through the owner's
local workflow, which freezes the ledgers above in place of the lane's plan step
and never runs this repository's machinery on its own surgery (§4). The
deterministic gates still run (§8).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the issue, verbatim:
  ```
  ## Summary

  **Docs-only unit, deferred by the owner (2026-11-12)**: a README section documenting the **evidence base** behind the workflow's design decisions, so the "why" survives next to the "what". The full research and verdict tables live in `docs/research/2026-11-12-input-quality-and-editing/` (committed with this issue's registration).

  ## Un-postpone trigger

  **Before the next stable release cut.** Until then this stays `postponed` (same pattern as #444's dated activation condition).

  ## Draft scope (what the section documents, each with its citations)

  | Decision already shipped | Evidence to cite |
  |---|---|
  | Risk-tiered ceremony (proportional to risk, never size) | `scripts/risk-tiers.mjs` design; Cockburn *Crystal* (ATTRIBUTION row 2026-11-10); measured token deltas rule |
  | Cross-family review rule (never review with the writer's family) | arXiv 2604.19049 (cross-family critics catch correlated blind spots); arXiv 2610.22382 (same-model elicitation/verification can HURT — negative pass@1) |
  | Spec-by-reference unit docs | gentle-shell#1718 measured (paraphrased handoffs failed 13/26; spec-by-reference accepted first round); arXiv 2609.36789 (GitHarness — local updates, never global rewrites) |
  | The editing stack: LSP localizes → verbatim whole files → regenerate (new behavior) / block-diff (refactor) → preservation instruction | arXiv 2611.07286, 2610.21073, 2609.05779, 2604.27296, 2609.04061 |
  | Deterministic gates over prose rules | arXiv 2606.22528 (Governance Decay: constraint violations 0→19–59% post-compaction); D-31-6 |
  | Never-auto-merge | arXiv 2605.22534 (merge outcome ≠ quality signal — 15.4% of merged agentic PRs needed reviewer involvement after); arXiv 2606.13175 (accountability gap of automated approvals) |
  | rg-first over grep; commands+boundaries over derivable descriptions | arXiv 2602.11988 + 2601.20404 (AGENTS.md studies); 2605.10039 (instruction adherence) |

  ## Dependencies

  | Depends on | Kind | Why |
  |---|---|---|
  | #307 | soft (prose) | Much of the rationale documents #307's direction — the section must state **shipped** behavior, so it lands after the direction's headline slices. |

  ## Non-goals

  - No new claims: every citation comes from the committed research folder or ATTRIBUTION.md — the README states no unverified figure (the README is a narrative surface; the sweep is the evidence carrier).

  Automated written using AI.
  ```
- **L2** — 2026-11-17, the requester's order, verbatim: "Apply to this repository: issue #527"
- **D1** — 2026-11-17, §0 resolution from state before any action: **continue** — the branch `feat/527-readme-evidence-rationale` sits at `7b18226b` (0 commits ahead, 0 behind `main`), no `docs/fix/527-*` unit dir exists, and no `EXTERNAL VERIFY` block or review verdict exists for it, so the issue's own first incomplete phase is the §5 ledger cut; `fix findings` and `re-verify` were excluded on that evidence. Authority: the owner's local workflow, §0, plus PE-001. The same line records the **un-postpone**: issue #527 carries `postponed` with a dated trigger (S4) and the owner's order is the authority that invokes it — recorded, never assumed.
- **D2** — 2026-11-17, the `passive` tier and §5's unit-doc order coexist: the classifier's verdict is copied verbatim into `## Risk tier` and the doc is cut anyway, with no `docs/passive/` record beside it — the fix #500 / fix #560 precedence, one change one carrier. Authority: the owner's local workflow §5; PE-009.
- **D3** — 2026-11-17, no `roadmap_summary:` override is declared in this doc's frontmatter: row 527's summary cell is owner-written prose that the emitter would otherwise overwrite on the next render. The row's status and the `## Fixes` row move through the crate's writers only. Authority: PE-012; the fix #560 `D9` precedent.
- **D4** — 2026-11-17, nothing is appended to `docs/research/` or `ATTRIBUTION.md`: the section explains decisions already shipped and cites evidence already recorded, and the ledger's own contract appends a row when an idea is *adapted*, not when a shipped decision is explained. Authority: S7's non-goal; `ATTRIBUTION.md` §Policy; PE-004.

## Next

P2 — write the README section against the frozen ledgers, with the citation
sweep as its validator.

## References

- Issue [#527](https://github.com/gtrabanco/agentic-workflow/issues/527) — closed
  by this PR via `Closes #527`.
- [Research folder](../../research/2026-11-12-input-quality-and-editing/README.md)
  and its [papers sweep](../../research/2026-11-12-input-quality-and-editing/papers-sweep.md).
- [Source attribution ledger](../../research/ATTRIBUTION.md).
- [Merge-gate addendum](../../research/papers-sweep-2026-11-06-merge-gates.md) —
  the 2605.22534 / 2606.13175 evidence.
- [Gate inventory](../../workflow/GATE_INVENTORY.md) — the Governance Decay
  argument and the carriers it produced.
- #307 (closed) — the direction the rationale documents.
- Roadmap row 527; the `## Fixes` row for this unit.

## Branch

`feat/527-readme-evidence-rationale`

## Depends on

`n/a` — #307 is closed; no fix folder must merge first.

## Regression scope

| Scenario | Verified by |
|---|---|
| The README's existing sections are byte-identical apart from the inserted section | the diff names only added lines plus the section anchor (`git diff 7b18226b...HEAD -- README.md`) |
| Every README anchor the tree links to still resolves | `bun scripts/workflow-docs-index.test.mjs`-equivalent link check inside the root gate, plus the reader's `cited-path-missing` check (G2) |
| The roadmap's other rows are untouched by the two writes | the writer receipts' `rowUpsert`/`fixRowUpsert` before/after pair plus `bun scripts/roadmap-settle.mjs` (G3) |
| The generated projection stays emitter-owned | `bun scripts/docs-generate.mjs --check` exits 0 (E12) |
| No suite is edited for a prose change | `git diff --name-only 7b18226b...HEAD -- 'scripts/*.test.mjs'` → no output (E11) |
