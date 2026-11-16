---
type: fix
scope: xs
ac-hash: 7145a4e3b9e017569694e80525a41cbb99b946e18780b6d06c08ae6967fc8c20
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

**S8 — Fold the external-verify findings that deserve a fix (correction batch, 2026-11-16; the session's first ask, recorded in-doc as S8 to continue the id sequence).**
> triage and fix those that deserve to fix but understand the context before fix

**S9 — Prove the batch broke nothing else, looping until the related surface is whole (the session's second ask).**
> check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff

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
the heading `## Why it works this way` — has no consumer outside this unit's own
record (`rg -c 'Why it works this way' --glob '!README.md' --glob '!docs/ROADMAP.md' --glob '!docs/fix/527-readme-evidence-rationale/**' --glob '!.agentic-workflow/**'` → no
match, exit 1 — every mention the exclusions cover is this unit's own: its
receipt, its roadmap row, its journal fragment), so there is no second
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
- P5 — Fold the EXTERNAL VERIFY blocker B1 of this unit (receipt `external-verify.md`): restate the Retirements receipt so it
  reproduces as declared, execute the triage the verdict recorded (A1's forge label under D1; A2/A3 dispositions; A4's
  head re-observation), and re-run the unit's gates.
  (Implements: S8, S9)
  (validator: `rg -c 'Why it works this way' --glob '!README.md' --glob '!docs/ROADMAP.md' --glob '!docs/fix/527-readme-evidence-rationale/**' --glob '!.agentic-workflow/**'` exits 1)
  - Relevant files: docs/fix/527-readme-evidence-rationale/SPEC.md, docs/fix/527-readme-evidence-rationale/external-verify.md

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
| PE-013 | measured-probe | README already names the retired `ship-roadmap` autopilot in its *Projects built with this workflow* table (line 577, "the (now retired) `ship-roadmap` autopilot"), which is why O5's validator scopes to this unit's own section rather than the whole file | `rg -n 'ship-roadmap' README.md` at `7b18226b` → `577:` only | run 2026-11-17 at `7b18226b` | S6; O5; D5 |
| PE-014 | measured-probe | The B1 receipt defect reproduces and its fix is stable: the as-recorded command `rg -c 'Why it works this way' --glob '!README.md'` prints `docs/fix/527-readme-evidence-rationale/external-verify.md:1`, `docs/fix/527-readme-evidence-rationale/SPEC.md:11` and `docs/ROADMAP.md:1` at head (plus the journal fragment under `--hidden`) against the receipt's `→ 0`, while the scoped form excluding this unit's own carriers answers no match, and base `7b18226b` carries zero mentions of the heading (the heading does not exist there) | foreground runs of both forms at `7dff1c21`; `git grep 'Why it works this way' 7b18226b` → no match | run 2026-11-16 at `7dff1c21` | S8; O13 |
| PE-015 | committed-source | The forge still carries the `postponed` verdict D1 superseded, and that label has machine consumers: `BATCH_BLOCKING_LABELS = ["postponed", "backlog", "human-revision-needed"]` makes an issue unlaunchable and `workflow-status` classifies `postponed` as a disposition label, so the stale verdict misroutes the sensors | `scripts/batch-scheduler.mjs:71`; `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs:1226-1228,1265`; `gh issue view 527 --json labels` → `["backlog","postponed"]` | read/run 2026-11-16 at `7dff1c21` | S8; O14 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S5, S5a, S7 | The risk-tiered-ceremony row names the classifier that ships, never the `scripts/` path `edde336c` retired | P2 | P2 | direct application (this session) | `rg -c 'packages/agentic-workflow/src/runner/risk-tiers.mjs' README.md` matches 1 and `rg -c 'scripts/risk-tiers.mjs' README.md` exits 1 | `E` line in `## Log` (E5) | verified (E5) |
| O2 | S3, S7 | Every citation the section makes resolves in a committed file — one `rg` per arXiv id and per named project source, all matching at least once | P2 | P2 | direct application (this session) | the citation sweep, one `rg` per id over `docs/research/ ATTRIBUTION.md` | `E` line listing the resolved sources (E6) | verified (E6) |
| O3 | S5, S7 | No unverified figure: every number the section prints is quoted from a committed source, byte for byte | P2 | P2 | direct application (this session) | one `rg -F` per figure over the committed sources | `E` line, one row per figure (E7) | verified (E7) |
| O4 | S5, S6 | The section states shipped behaviour only: the editing-stack row names the two rungs that ship and marks the preservation rung `recorded, not shipped` with its carrier | P2 | P2 | direct application (this session) | `rg -c 'recorded, not shipped' README.md` matches 1 and `rg -c '67-serena-provisioning' README.md` matches 1 | `E` line (E8) | verified (E8) |
| O5 | S5, S6 | The never-auto-merge row names the carriers that exist (the MERGE-READY receipt, the conductor's forbidden verbs) and names no retired authority | P2 | P2 | direct application (this session) | `sed -n '/^## Why it works this way/,/^## Install/p' README.md \| rg -c 'ship-roadmap'` exits 1 and `rg -c 'MERGE-READY' README.md` matches 2 | `E` line (E9) | verified (E9) |
| O6 | S2 | README growth moves no budget: the context manifest's `documents` ceilings are untouched and still pass | P2 | P2 | direct application (this session) | `git diff --name-only 7b18226b...HEAD -- docs/workflow/SKILL_CONTEXT_BUDGETS.json` → no output; `bun scripts/check-skill-context.mjs --documents` exits 0 | `E` line plus the gate `G` line (E10, G3) | verified (E10, G3) |
| O7 | S1 | No test is invented and no suite is weakened for a prose change: the impact verdict is `empty` and no `scripts/*.test.mjs` moves | P2 | P2 | direct application (this session) | `bun scripts/test-impact.mjs --base origin/main` prints `verdict: empty`; `git diff --name-only origin/main...HEAD -- 'scripts/*.test.mjs'` → no output (base repaired under D7 after the owner's rebase) | `E` line (E11, E20) | verified (E11, E20) |
| O8 | S1 | The generated projection is re-rendered by the emitter, never hand-written, and is clean at head | P3 | P3 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 at head | `E` line (E12) plus the gate `G` line | verified (E12, G3) |
| O9 | S4 | The index rows land through the crate's receipted writers — feature row 527 and its `## Fixes` row — and never as a hand edit | P3 | P3 | direct application (this session) | `roadmap read docs/ROADMAP.md --nn 527` prints the new row; both writes return a `rowUpsert`/`fixRowUpsert` receipt | `E` line with both receipts (E13) | verified (E13) |
| O10 | S4 | The dated activation condition is recorded, not silently dropped: the un-postpone authority is a decision line and row 527 stops reading `idea · postponed` | P1 | P1 | direct application (this session) | `rg -c 'idea · postponed' docs/ROADMAP.md` for row 527 → 0 after `E13`; `rg -c '^\- \*\*D1\*\*' docs/fix/527-readme-evidence-rationale/SPEC.md` → 1 | `E` line (E13) plus the `D1` line | verified (E13) |
| O11 | S1 | The unit doc lints PASS under its own grammar and every obligation closes through the readers | P1 | P4 | direct application (this session) | `phase-lint` exits 0 with `verdict PASS`; `verify` exits 0 with `obligations-closure` ok | `G` lines (G1, G2) | verified (G1, G2) |
| O12 | S2 | The section is discoverable where the "what" is: it sits between `## Core principles` and `## Install` and names `docs/research/` as its carrier | P2 | P2 | direct application (this session) | `rg -c '^## Why it works this way$' README.md` matches 1 and `rg -c 'docs/research/2026-11-12-input-quality-and-editing/' README.md` matches 1, with the heading-order receipt in E14 | `E` line (E14) | verified (E14) |
| O13 | S8 | The Retirements receipt reproduces as declared after the fold: zero mentions of the heading outside README and this unit's own carriers, so the shipped claim never overstates its sweep again | P5 | P5 | direct application (this session) | `rg -c 'Why it works this way' --glob '!README.md' --glob '!docs/ROADMAP.md' --glob '!docs/fix/527-readme-evidence-rationale/**' --glob '!.agentic-workflow/**'` exits 1 | `E` line in `## Log` (E19) | verified (E19) |
| O14 | S8 | The forge carries the un-postpone D1 recorded: issue #527 no longer carries the superseded `postponed` verdict its machine consumers read | P5 | P5 | direct application (this session) | `gh issue view 527 --json labels --jq '[.labels[].name]'` matches `["backlog"]` | `E` line (E19) | verified (E19) |
| O15 | S9 | The batch breaks nothing: the unit's readers, the projection and the offline root gate stay green on the corrected head | P5 | P5 | direct application (this session) | `bun scripts/local-gate.mjs --skip-network --jobs auto` exits 0 | `G` lines (G7, G8) | verified (G7, G8) |

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
- **AC8 (S8)** — the correction batch folds B1 and executes the triage the verdict recorded: the scoped Retirements
  command exits 1, the receipt carries the batch addendum, and issue #527 carries no `postponed` label. Checks: the
  O13 and O14 validators (E19).
- **AC9 (S9)** — the batch introduces no regression: unit readers, projection, settle and the offline root gate re-run
  green on the corrected head. Check: O15's validator (G7, G8) plus `bun scripts/test-impact.mjs --base origin/main`
  staying `empty` (E20).

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
- **D5** — 2026-11-17, O5's validator is amended before P2 runs: its original form (`rg -c 'ship-roadmap' README.md` exits 1) is unsatisfiable because README line 577 already names the retired `ship-roadmap` autopilot in the *Projects built with this workflow* table — a pre-existing, accurate mention of a retirement that this unit does not touch. The validator is narrowed to this unit's own section instead of the whole file, so it keeps judging the change and stops judging history. Authority: the §5 freeze covers the ledger's shape and rulings, and a validator that cannot hold is corrected with its reason recorded — never quietly relaxed (`PE-013`).
- **E1** — 2026-11-17, the base state (the §0 probe): `git rev-list --left-right --count main...HEAD` → `0	0` at `7b18226b`; `ls docs/fix | rg 527` → no output; `gh issue view 527 --json labels,state` → `OPEN`, `backlog` + `postponed`; `gh issue view 307 --json state` → `CLOSED`; roadmap row 527 → `idea · postponed`.
- **E2** — 2026-11-17, environment receipt: `bun install --frozen-lockfile` → `164 packages installed [2.49s]`, then `cd packages/agentic-workflow-schema && bun run build` → `tsc`, exit 0 (the fresh worktree carried no `node_modules`/`dist`; `## Known pre-existing issues`).
- **E3** — 2026-11-17, the issue's stale carrier (`PE-002`): `git log --all --oneline -- scripts/risk-tiers.mjs` → last entry `edde336c refactor(352): retire the migrated runtimes from scripts/`; `ls packages/agentic-workflow/src/runner/risk-tiers.mjs` → present, so S5's row-1 path is retired and the shipped classifier is the runner module.
- **E4** — 2026-11-17, the risk verdict, copied into `## Risk tier`: `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "README.md,docs/fix/527-readme-evidence-rationale/SPEC.md,docs/ROADMAP.md"` · exit 0 · `tier: passive`, `reason_kind: no-executable-effect`, `signals: []`, `task_size: {understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: none, verification: readback}`.
- **E5** — 2026-11-17, O1: `rg -c 'packages/agentic-workflow/src/runner/risk-tiers.mjs' README.md` → `1`; `rg -c 'scripts/risk-tiers.mjs' README.md` · exit 1 (0 matches: the retired path is cited nowhere).
- **E6** — 2026-11-17, O2, the citation sweep: 14 distinct arXiv ids extracted from the section and resolved over `docs/research/` — `2601.20404` 2 files · `2602.11988` 2 · `2604.19049` 3 · `2604.27296` 3 · `2605.10039` 2 · `2605.22534` 2 · `2606.13175` 2 · `2606.22528` 3 · `2609.04061` 2 · `2609.05779` 3 · `2609.36789` 2 · `2610.21073` 3 · `2610.22382` 3 · `2611.07286` 3 — every id resolves, none depends on a fetch.
- **E7** — 2026-11-17, O3, the figure sweep (`rg -F -l` per figure over `docs/research/` and `docs/workflow/GATE_INVENTORY.md`): `from 0% to 19–59%` 1 · `negative strict pass@1` 1 · `+6.3 points` 1 · `13/26` 1 · `accepted first round` 1 · `17–39%` 2 · `+9.3/+12.7` 1 · `over 30%` 1 · `0.195 → 0.131` 1 · `−26.6%` 3 · `Pass@1 +2.3 points` 1 · `15.4%` 2 · `33.1%` 2 · `+20% reasoning tokens` 1 · `Root guides reduce tokens on real PRs` 1 · `Instruction adherence depends on file structure` 1 — 16 of 16 verbatim in a committed file.
- **E8** — 2026-11-17, O4: `rg -c 'recorded, not shipped' README.md` → `1`; `rg -c '67-serena-provisioning' README.md` → `1`; `rg -c 'Relevant files' README.md` → `1` — the unshipped half is marked and the shipped rungs name their carriers.
- **E9** — 2026-11-17, O5: `sed -n '/^## Why it works this way/,/^## Install/p' README.md | rg -c 'ship-roadmap'` · exit 1 (0 matches in this section); `rg -c 'MERGE-READY' README.md` → `2` (the skills table's `audit-pr` row and the new row). The `ship-roadmap` mention at README:577 is the pre-existing, accurate retirement note in the projects table (`PE-013`, `D5`).
- **E10** — 2026-11-17, O6: `git diff --name-only 7b18226b...HEAD -- docs/workflow/SKILL_CONTEXT_BUDGETS.json` → no output; `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 4 budgeted documents` (AGENTS.md 708/145/563/12,483 and the three references unchanged).
- **E11** — 2026-11-17, O7: `bun scripts/test-impact.mjs --base 7b18226b` → `verdict: empty` · `changed: 4` · `executable: 0` · `suites (0)` · `reason: no executable path changed — record this verdict, run no TDD ceremony, invent no test`; `git diff --name-only 7b18226b...HEAD -- 'scripts/*.test.mjs'` → no output.
- **E12** — 2026-11-17, O8: `bun scripts/docs-generate.mjs` → `Files: 1 written · 0 deleted · 2 unchanged`, then `bun scripts/docs-generate.mjs --check` → `Files: 3 checked · 0 missing · 0 stale · 0 orphaned` · `verdict: PASS`. The single rendered delta is this unit's row in `docs/generated/units.md`.
- **E13** — 2026-11-17, O9 and O10, the two index writes through the crate's writers: `roadmap docs/ROADMAP.md rowUpsert {nn:"527",…}` · `Before: 9f121137 · After: 75e38f1e`; `roadmap docs/ROADMAP.md fixrow {issue:"527",…}` · `Before: 75e38f1e · After: 491075d1`; at head `roadmap read docs/ROADMAP.md --nn 527` prints `in-progress · carried by fix #527` and `rg -c 'idea · postponed' docs/ROADMAP.md` for that row · exit 1.
- **E14** — 2026-11-17, O12 and AC2/AC3: `rg -n '^## (Core principles|Why it works this way|Install)$' README.md` → `347`, `359`, `393` (ordering `Core principles < Why it works this way < Install`); `sed -n '/^## Why it works this way/,/^## Install/p' README.md | rg -c '^\| \*\*'` → `7`; `rg -c 'docs/research/2026-11-12-input-quality-and-editing/' README.md` → `1`.
- **E15** — 2026-11-17, the §3 fixture, before any live write: a copy of `docs/ROADMAP.md` under `mktemp -d /tmp/roadmap-fixture.XXXXXX` took both writes and produced `9f121137 → 75e38f1e → 491075d1` — the identical revision chain the live table then produced; the `--expect` probe replayed the read revision after the first write and refused `stale-read`; the repeated `fixrow` returned `Before: 491075d1 · After: 491075d1` (idempotent, one row) and `diff` showed only the two intended lines. Scratch removed (`rm -rf /tmp/roadmap-fixture.*`).
- **E16** — 2026-11-17, the differential on the only reader that touches the changed files: `bun scripts/docs-generate.mjs --check` in a base copy at `7b18226b` → exit 0, 0 stale (`PE-011`); at the pre-render head → the one added unit row; at the post-render head → exit 0 again. No stdout/stderr/exit difference outside the intended row.
- **G1** — 2026-11-17, HEAD `8bc37b85`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/527-readme-evidence-rationale/SPEC.md` · exit 0 · `P1–P4 Phase-lint: PASS (6/6)` · `verdict PASS`.
- **G2** — 2026-11-17, HEAD `8bc37b85`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/527-readme-evidence-rationale/SPEC.md` · exit 0 · `ok: true` across sections, obligations-closure, provenance-stamp, log-kinds, cited-paths and cited-gates.
- **G3** — 2026-11-17, HEAD `8bc37b85`, the docs surfaces: `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`; `bun scripts/roadmap-settle.mjs` · exit 0 · `217 unit docs checked · 0 fix docs skipped` · `verdict: PASS` · `violations: 0`; `bun scripts/check-skill-context.mjs --documents` · exit 0.
- **G4** — 2026-11-17, HEAD `8bc37b85`, the suites that read this change's surfaces: `bun test scripts/unit-doc-contract.test.mjs scripts/docs-generate.test.mjs scripts/roadmap-settle.test.mjs scripts/prose-gate-inventory.test.mjs scripts/residue-dimensions.test.mjs scripts/index-document.test.mjs scripts/normative-drift.test.mjs` · exit 0 · **142 pass · 0 fail** (4.85s).
- **G5** — 2026-11-17, HEAD `8bc37b85`, the offline root gate: `bun scripts/local-gate.mjs --skip-network --jobs auto` → `root-suite: exit 0 in 125s` and every step before it green; it then **FAILED at `worktree-guard`** on another session's stale worktree (`.worktrees/feat-555-programmatic-runner-detection` — branch merged into `origin/main` and dirty), which this change neither owns nor may clean: shared state, reported not touched. The steps after it were run directly at the same head and are green — `rigidity-review.mjs` exit 0, `bun run test:node` in `packages/agentic-workflow-schema` **853 pass · 0 fail**, in `packages/pi-agentic-workflow` **919 pass · 0 fail · 1 skipped**. The four network steps are outside the offline subset and are disclosed, never counted as run.
- **P1** — 2026-11-17, the unit doc with the frozen ledgers, every obligation `planned` at cut · `58a1c455`.
- **P2** — 2026-11-17, the README section (`## Why it works this way`, 34 added lines) plus `D5`'s validator amendment · `8bc37b85`.
- **D6** — 2026-11-17, four validator cells are rewritten into the reader's declared-outcome form (`matches <N>` instead of `→ 1` / `≥ 1`) while the claims they assert are unchanged: `scripts/promise-coherence.mjs` re-runs an obligation's own command and compares the declared outcome, so an arrow-form cell was skipped as "no declared outcome" — disclosed but unverified — and one of them (O1) mis-bound the later `exits 1` as the first command's outcome. After the rewrite the reader re-runs six claims against the tree and reports `verdict PASS · 6 checked · 10 skipped`, the skips naming their own reason. Authority: the §5 freeze is over the ledger's rulings and shape; an outcome form the reader cannot execute is a closed obligation without a receipt, so it is corrected with its reason recorded instead of left skipped.

- **P3** — 2026-11-17, the indexes and the session door: both `## Fixes`/features writes through the crate's writers, the projection re-rendered by the emitter (one added row) and the narrative fragment `20261116T135024Z-feat-527-readme-evidence-rationale-narrative-local.md` (1,979 bytes, `journal aggregate --check` → `85 checked · 0 refusals`, `log-immutability` → `PASS · 0 violations`) · `58af96b2`.
- **P4** — 2026-11-17, the verification sweep and the receipt batch: E5–E16 and G1–G5 recorded, every obligation closed, then the validator-form correction (`D6`) · `6187430d`, `2fde06c0`.
- **G6** — 2026-11-17, HEAD `2fde06c0`, the final-head readers, all exit 0: `agentic-workflow verify` (`VERIFY PASS`, `ok: true`), `agentic-workflow phase-lint` (`verdict PASS`, P1–P4 6/6), `scripts/docs-generate.mjs --check` (`0 missing · 0 stale · 0 orphaned`), `scripts/roadmap-settle.mjs` (`217 unit docs checked · 0 violations`), `scripts/promise-coherence.mjs` (`verdict PASS · 6 checked · 10 skipped`, each skip naming its reason).
- **E17** — 2026-11-17, the PR and the settle: PR [#585](https://github.com/gtrabanco/agentic-workflow/pull/585) opened against `main` with `Closes #527`; feature row 527 settled to `done · [#585] · carried by fix #527` (`rowUpsert 491075d1 → af302d2e`) and the `## Fixes` row to `done · [#585]` (`fixrow af302d2e → 9b69d8f6`), both through the crate's writers with every other cell preserved; the projection re-rendered by the emitter (one changed row) and `bun scripts/docs-generate.mjs --check` · exit 0 · `0 missing · 0 stale · 0 orphaned`.
- **L3** — 2026-11-16, the correction-batch request, verbatim (recorded in-doc as S8/S9 to continue the id sequence):
  ```
  triage and fix those that deserve to fix but understand the context before fix
  check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
  Scope resolved from state before acting: the latest `EXTERNAL VERIFY` block (this unit's `external-verify.md`, base `7b18226b` · head `7dff1c21`) — one blocker (B1), four advisories (A1–A4), so the verb is *fix findings* and the outcome `proceed`. Triage at cut: **B1 fix** — restate the Retirements receipt so it reproduces (O13); **A1 fix** — remove the forge's superseded `postponed` verdict under D1's recorded authority (machine consumers in PE-015, O14), `backlog` kept — it is not a LABELS.md verdict label and D1 supersedes only `postponed`; **A2 dispose** — the 2026-11-12 decision record and the LOGS entries are dated history, never rewritten (same class as the journal); **A3 dispose** — environmental load flake with no code cause (suite passes standalone, test-impact `empty`); **A4 fix** — head re-observation appended (E20).
- **E18** — 2026-11-16, frozen-failure corpus RED before the fold (§2): `rg -c 'Why it works this way' --glob '!README.md'` · exit 0 · `docs/fix/527-readme-evidence-rationale/external-verify.md:1`, `docs/fix/527-readme-evidence-rationale/SPEC.md:11`, `docs/ROADMAP.md:1` — plus `.agentic-workflow/journal/20261116T135024Z-…-narrative-local.md:1` under `--hidden` — against the receipt's recorded `→ 0`. Base side: `git grep 'Why it works this way' 7b18226b` → no match (the heading does not exist at base). The scoped reproducer the fold ships answers `exits 1` at head (fixture run before any edit).
- **E19** — 2026-11-16, foreground obligation validators after the fold: O13 the scoped command · exit 1 (0 matches); O14 `gh issue edit 527 --remove-label postponed` · exit 0, labels `["backlog","postponed"]` → `["backlog"]`, read back `gh issue view 527 --json labels --jq '[.labels[].name]'` · exit 0 · `["backlog"]`. O13/O14 flipped to `verified` on this run.
- **E20** — 2026-11-16, the A4 re-observation and the O7/AC9 base evidence after the owner's rebase moved the base `7b18226b` → `9e6c431a`: `bun scripts/test-impact.mjs --base origin/main` · exit 0 · `verdict: empty` · `changed: 6` · `executable: 0`, and `git diff --name-only origin/main...HEAD -- 'scripts/*.test.mjs'` → no output; the as-frozen `--base 7b18226b` run answers `targeted` (changed: 100 · executable: 3 — the range now carries main's own undici work, `scripts/dependency-advisory-pass.test.mjs` among them), which is why O7's cell and AC9's base moved under D7. E11's `changed: 4` stays a true receipt of its own run (A4).
- **D7** — 2026-11-16, plan repair forced by the owner's concurrent integration (authority: the D6 precedent — the §5 freeze covers the ledger's rulings and shape, and an outcome form that can no longer hold is corrected with its reason recorded): between the verdict and this batch the owner rebased the branch onto the moved `origin/main` (`7dff1c21`'s commits re-picked as `ceac0757…8346ec83`, then `b055ba82` for the shared-doc projection, force-with-lease push observed live at 16:05 UTC), so O7's validator and AC9's frozen check — both citing `--base 7b18226b` — would judge main's own commits instead of this unit. Both cells move to `--base origin/main`; the assertions (`empty`, no test files moved) are unchanged and re-run green in E20. The receipt's head `7dff1c21` stays a true historical citation (object reachable).
- **G7** — 2026-11-16, HEAD `e4a61ed1`, the readers after the fold: `phase-lint` · exit 0 · `verdict PASS` (P1–P5 6/6); `docs-generate --check` · exit 0 · `0 missing · 0 stale · 0 orphaned`; `roadmap-settle` · exit 0 · `218 unit docs checked · 0 violations`; `check-skill-context --documents` · exit 0 · `PASS context documents: 4`; `promise-coherence` · exit 0 · `verdict PASS · 8 checked · 12 skipped`, each skip naming its reason (O13 among the checked).
- **G8** — 2026-11-16, HEAD `e4a61ed1`, O15's validator, both attempts disclosed: first · exit 1 · `FAILED at root-suite` — `red-first` O4's 30 s budget exceeded under machine load 15.7 from concurrent worktree suites, while the gate itself passes on this tree (`bun scripts/red-first.mjs` · exit 0 · `53 pair(s) · 28 after the cutoff` · `verdict: PASS`, 0 findings — timing, not content; same class as the receipt's A3); retry at load ~7 · exit 0 · `root-suite: exit 0 in 216s` · `local-gate: PASS — 15 step(s) in 678s` · 4 network steps skipped by `--skip-network`. O15 flipped on the green run.
- **P5** — 2026-11-16, the correction batch: B1 folded, A1 executed, A2/A3 disposed, A4 recorded · `e4a61ed1` (receipt + ledgers cut), this commit (the fold).
- **L4** — 2026-11-16, the batch record: B1 restated at `## Retirements` (scoped command, exit 1, every excluded mention disclosed as this unit's own); A1 executed — `postponed` removed from #527 under D1 (E19), `backlog` kept — not a LABELS.md verdict and D1 supersedes only `postponed`; A2/A3 disposed — dated history and environmental load flake, no tree change; A4 recorded (E20). Disclosed: (1) the owner concurrently rebased this branch mid-batch at 16:05 UTC and force-pushed it — both lineages cited honestly (D7); (2) this unit's `external-verify.md` vanished from the untracked worktree during that integration and was restored verbatim with its date corrected from the misdated `2026-11-17` to the true run date `2026-11-16` — the unit's frozen log lines carry the same off-by-one against their `2026-11-16` commit dates and stay untouched (append-only history, pre-existing); (3) no writer ran against the live tree in this batch beyond the repo's own gates and the crate's documented readers, and the one forge mutation (A1) is E19's receipt.
## Next

The merge is the owner's: PR [#585](https://github.com/gtrabanco/agentic-workflow/pull/585)
carries the reviewed diff plus the correction batch (B1 folded, A1–A4 triaged
per `external-verify.md`), both index rows read `done · [#585]`, and the batch's
receipts are E19/E20 + G7/G8. Next for the owner: the delta external-verify of
this batch — re-run the Retirements receipt, the O13–O15 and repaired O7
validators — then merge.

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
