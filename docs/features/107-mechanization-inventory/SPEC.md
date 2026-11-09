---
type: docs
scope: small
---

# 107 — mechanization-inventory

> Docs-only backlog: every procedural step carried in shipped skill prose,
> classified as *verifiable-without-interpretation* (mechanizable candidate) or
> *judgment* (irreducible prose), prioritized by execution frequency × stability
> × enforcement value. The deliverable is [`INVENTORY.md`](INVENTORY.md).

## Issue

[#408](https://github.com/gtrabanco/agentic-workflow/issues/408) — promoted to a
feature SPEC; roadmap row 107. The governing request also carries the local
unpublished-workflow protocol (S12–S15), which this unit obeys instead of the
repo's own review machinery.

## Specs

**S1 — Docs-only inventory of procedural steps.**
> "Docs-only inventory: classify every procedural step currently carried in skill prose as *verifiable-without-interpretation* (mechanizable candidate) or judgment (irreducible prose), prioritized by execution frequency × stability. The backlog that turns "prose reducible to code must be code" from a principle into a worklist."

**S2 — Walk every shipped skill.**
> "Walk every shipped skill (~25, `metadata.internal` excluded): enumerate procedural steps, classify each against the criterion, note which are already duplicated by existing runner-crate commands (grep-level residue check)."

**S3 — Priority table.**
> "Priority table: frequency of execution × stability × enforcement value."

**S4 — Per-skill section map.**
> "Record the per-skill section map (heading path + one-line role) so later manifest entries reference stable section paths."

**S5 — Docs language and owner review.**
> "Docs language English; owner review before merge."

**S6 — Out of scope: classification only.**
> "Any implementation, manifest entries, prose edits — classification only. The judgment call "this should become a new guard" stays a roadmap decision; the inventory only marks candidacy."

**S7 — Coverage acceptance.**
> "Every shipped skill covered; every step classified with a one-line reason."

**S8 — Duplicate-of-code acceptance.**
> "Every prose step invoking an existing runner-crate command flagged as `duplicate-of-code` candidate."

**S9 — Checks and roadmap link.**
> "`audit-docs` and cross-reference checks pass; the inventory doc is linked from the roadmap row that owns it."

**S10 — Dependencies.**
> "None. Feeds the pilot issue and all follow-up extraction units."

**S11 — Criterion edge cases.**
> "The criterion ("verifiable without interpretation") has edge cases (multi-step procedures with one judgment branch) — classify the deterministic sub-steps, mark the branch explicitly."

**S12 — No self-review machinery on this change.**
> "No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change."

**S13 — Deterministic gates still run.**
> "The one exception is the repo's deterministic gates (tests, lints) — run those always."

**S14 — Session log appended.**
> "`docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff;"

**S15 — Index rows through the emitters.**
> "Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead;"

S12–S15 are the governing request's own process requirements, quoted verbatim
from the turn that delegated issue #408; S1–S11 are the issue it delegates to.

## Impact

- **Consumes** (read-only): every `skills/*/SKILL.md`, the deterministic surfaces
  it names (`scripts/*.mjs`, the `agentic-workflow` crate's subcommands),
  `docs/ROADMAP.md` row 107.
- **Produces**: `INVENTORY.md` in this folder — the worklist every future
  extraction unit (the folded #410/#411/#412/#414 chain, and whatever the owner
  promotes later) reads instead of re-deriving candidacy.
- **Stops being true**: nothing. No skill prose, manifest entry, script or
  template changes (S6). The roadmap row gains one link (S9).
- **Ask before touching**: any skill prose, the pi bundle manifest, or a
  projection op — all explicitly out of scope.

## Retirements

None — this is a docs unit and it supersedes no surface. The inventory *names*
future retirements (the prose each candidate would displace) but retires none
(S6); an empty retirement list here is the honest answer, not a gap.

## Non-goals

- Extracting any prose into code, adding a manifest entry, or editing a skill (S6).
- Deciding that a candidate *should* become a guard — the inventory marks
  candidacy; the decision is a roadmap call (S6).
- Re-classifying a judgment step as mechanizable by wishful reading: a step with
  no closed input/output is `judgment` (S11).
- Repairing pre-existing prose defects found during the walk (recorded under
  `## Known pre-existing issues`, never edited).

## Risk tier

`bun scripts/ceremony.mjs tier classify --paths docs/features/107-mechanization-inventory/SPEC.md,docs/features/107-mechanization-inventory/INVENTORY.md,docs/ROADMAP.md,docs/LOGS.md`
answers, verbatim:

- **Tier** — `passive` · **Task Size** — understood · contained · resumable (`ceremony: none`, `verification: readback`)
- **reason** — "every changed path is documentation, an image or prose: no executable effect"
- **reason_kind** — `no-executable-effect` · **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit.

**Owner-instructed deviation, disclosed.** The `passive` tier's own rule says a
passive unit gets no unit doc (its readback lives in `docs/passive/<id>.md`).
The governing request (S1–S15) explicitly orders the planning ledgers frozen in
this unit's folder, which outranks the tier's default ceremony (instruction
precedence: the prompt first, the docs after). This doc and its ledgers exist as
the request orders; no phase ceremony beyond them is carried, and the
verification is the tier's `readback` plus the deterministic gate (S13).

## Future

None — nothing was deferred. Rows queued for later are the inventory's own
candidates and belong to the roadmap, not here.

## Future cost

- Every future extraction unit reads `INVENTORY.md` for candidacy instead of
  re-walking 29 skills; the unit that extracts a row updates it in the same PR.
- A newly shipped skill is not covered until an inventory refresh adds its
  section map and rows; the coverage receipt (inventory §2) makes an uncovered
  skill visible instead of silent.

## Applicable tests

n/a — no executable behaviour changes; the declared verification is the
deterministic gate (S13) plus the coverage/row-count receipts recorded in
`INVENTORY.md` §7 and this doc's `## Log` `E`/`G` lines.

## Known pre-existing issues

- `skills/audit-docs/SKILL.md` check 13 is truncated mid-sentence ("Scan the
  declared content dir for orphan pages each:", "that page is **stale** (LOW:
  propose )"). **Affects** this unit only as the reason recorded on row `AD20`;
  the defect is reported, never repaired (S6 forbids prose edits).
- The `passive` tier and the `spec-by-reference` unit-doc shape disagree about
  whether a passive unit carries a doc, and the schema's re-cut section list has
  no `## Acceptance criteria` while the shipped fix-lane templates carry one.
  **Does not affect** this unit: the governing request orders the doc, and
  `agentic-workflow verify` tolerates the acceptance-criteria section on the
  fix-lane templates (recorded in the log).
- No doc-gate defect at base: `bun scripts/docs-generate.mjs --check` and
  `bun scripts/roadmap-settle.mjs` are green at `1fa39fe1`.
- 16 root suites fail at `1fa39fe1` (fixture-repo git operations and forge
  reads unavailable in this sandbox) and fail identically on a detached worktree
  of `main`; **does not affect** this unit, and no test is touched (G1/G2
  record both runs).

## Acceptance criteria

One observable criterion per `S#`; each names the check that proves it.

- **AC1 (S1)** — `INVENTORY.md` classifies every step in the two-class
  vocabulary. `rg -c '^\| [A-Z]{2}[0-9]{2} \|' docs/features/107-mechanization-inventory/INVENTORY.md` matches 338.
- **AC2 (S2)** — every shipped skill has a section. `rg -c '^### [a-z]' docs/features/107-mechanization-inventory/INVENTORY.md` matches 29 and `ls -d skills/*/ | wc -l` matches 29.
- **AC3 (S2)** — no skill is `metadata.internal`, so "shipped" is all of them.
  `rg -l 'metadata.internal: true' skills/*/SKILL.md | wc -l` matches 0.
- **AC4 (S3)** — the priority table exists with its three axes and a score.
  `rg -c '^\| [0-9]+ \| [A-Z]{2}[0-9]{2} \| .* \| [0-9] \| [0-9] \| [0-9] \| [0-9]+ \|' docs/features/107-mechanization-inventory/INVENTORY.md` matches 253.
- **AC5 (S4)** — every skill's stated `##`/`###` counts equal the file's own
  headings: the section-parity `diff` command recorded in `INVENTORY.md` §7
exits 0.
- **AC6 (S5)** — English-only artifacts:
  `rg -c '[\x{e1}\x{e9}\x{ed}\x{f3}\x{fa}\x{f1}]' docs/features/107-mechanization-inventory/SPEC.md docs/features/107-mechanization-inventory/INVENTORY.md` matches 0; owner review before merge — `manual:` the owner's verdict on the handoff.
- **AC7 (S6)** — classification only:
  `git diff --name-only main -- | rg -v '^(docs/features/107-mechanization-inventory/|docs/ROADMAP.md|docs/LOGS.md|.agentic-workflow/journal/|docs/generated/)' | wc -l` matches 0.
- **AC8 (S7)** — every row carries a one-line reason (no empty final cell):
  `rg -c '^\| [A-Z]{2}[0-9]{2} \|.*\|  \|$' docs/features/107-mechanization-inventory/INVENTORY.md` matches 0.
- **AC9 (S8)** — every row's `duplicate-of-code` cell and its carrier cell agree:
  `awk -F'|' '/^\| [A-Z]{2}[0-9]{2} / { gsub(/ /,"",$6); gsub(/ /,"",$7); if (($6=="no") != ($7=="none")) print }' docs/features/107-mechanization-inventory/INVENTORY.md | wc -l` matches 0.
- **AC10 (S9)** — the doc checks pass and the roadmap row links the inventory:
  `bun scripts/docs-generate.mjs --check` exits 0, `bun scripts/roadmap-settle.mjs` exits 0, `rg -c 'INVENTORY.md' docs/ROADMAP.md` matches 1.
- **AC11 (S10)** — no dependency declared and the pilot feed recorded:
  `rg -c 'Feeds the pilot issue' docs/features/107-mechanization-inventory/SPEC.md` matches 4 (the requirement quote, the Impact line and the References line).
- **AC12 (S11)** — every mixed procedure is split and each mixed row names its
  deterministic prefix and its judgment branch:
  `rg -c '^\| [A-Z]{2}[0-9]{2} \|.*mixed' docs/features/107-mechanization-inventory/INVENTORY.md` matches the count stated in §2, and every such row's reason contains `branch:`.
- **AC13 (S12)** — no review machinery ran (no review mark in the log):
  `rg -c '^- \*\*R[0-9]' docs/features/107-mechanization-inventory/SPEC.md` matches 0.
- **AC14 (S13)** — the deterministic gate ran and its only red is the base's own:
  `bun scripts/docs-generate.mjs --check` exits 0 and the `G1` log line records
  `bun scripts/run-root-suite.mjs` with its 16 pre-existing failures reproduced at
  `1fa39fe1`.
- **AC15 (S14)** — the session entry exists: `ls .agentic-workflow/journal/*feat-408-mechanization-inventory-narrative-local.md | wc -l` matches 1.
- **AC16 (S15)** — the roadmap row was written by the emitter: the
  `roadmap rowUpsert` receipt (`ok: true`, exit 0) is recorded as an `E` line,
  and `rg -c 'INVENTORY.md' docs/ROADMAP.md` matches 1.

## Tasks

- P1 — Freeze this unit doc, its embedded planning ledgers and the acceptance
  criteria (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/107-mechanization-inventory/SPEC.md` exits 0)
  (Implements: S5, S7, S10)
  Relevant files: docs/features/107-mechanization-inventory/SPEC.md
- P2 — Author `INVENTORY.md`: method and criterion, 29 section maps, one
  classified row per step with its reason and duplicate flag, the priority
  table, the residue list, the coverage receipts (validator: `rg -c '^### [a-z]' docs/features/107-mechanization-inventory/INVENTORY.md` matches 29 and `rg -c '^\| [A-Z]{2}[0-9]{2} \|' docs/features/107-mechanization-inventory/INVENTORY.md` matches 338)
  (Implements: S1, S2, S3, S4, S6, S7, S8, S11)
  Relevant files: docs/features/107-mechanization-inventory/INVENTORY.md
- P3 — Link the inventory from roadmap row 107 through the `roadmap rowUpsert`
  emitter (validator: `bun scripts/roadmap-settle.mjs` exits 0 and `rg -c 'INVENTORY.md' docs/ROADMAP.md` matches 1)
  (Implements: S9, S15)
  Relevant files: docs/ROADMAP.md
- P4 — Write the session entry through the journal carrier's own writer (the
  only legal path: the aggregator owns the log file) (validator: `ls .agentic-workflow/journal/*feat-408-mechanization-inventory-narrative-local.md | wc -l` matches 1)
  (Implements: S14)
  Relevant files: .agentic-workflow/journal/
- P5 — Run the deterministic gate, record the receipts and close the obligations
  ledger (validator: `bun scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S5, S9, S12, S13)
  Relevant files: docs/features/107-mechanization-inventory/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured | The shipped-skill set is 29 directories, every one with a `SKILL.md`. | `ls -d skills/*/ \| wc -l` → 29; `ls skills/*/SKILL.md \| wc -l` → 29 | 2026-11-09 (this turn) | O2, AC2 |
| PE-002 | measured | No shipped skill carries `metadata.internal: true`, so the issue's filter excludes nothing. | `rg -l 'metadata.internal: true' skills/*/SKILL.md \| wc -l` → 0 | 2026-11-09 | O2, AC3, INVENTORY §2 |
| PE-003 | measured | Per-skill commit churn over 18 months is the stability axis's evidence: 7…229 commits per skill directory. | `git log --since='18 months ago' --format= --name-only -- skills/<n>/ \| rg -c "^skills/<n>/"` | 2026-11-09 | INVENTORY stability column; O4 |
| PE-004 | measured | The deterministic surface already ships 153 `scripts/*.mjs` (96 with a sibling suite) plus the crate's subcommands (`unit-doc`, `roadmap`, `changelog`, `budgets`, `manifest`, `doc`, `section`, `memory`, `log`, `journal`, `relay`, `resolve-passes`, `verify`, `resources`). | `ls scripts/*.mjs \| wc -l` → 153; `ls scripts/*.test.mjs \| wc -l` → 96; `packages/agentic-workflow/bin/agentic-workflow.mjs` usage header | 2026-11-09 | every `duplicate-of-code` cell; O8 |
| PE-005 | measured | The base commit's doc gates are green, so a red gate after the change is this unit's defect, not pre-existing. | `bun scripts/docs-generate.mjs --check` → PASS; `bun scripts/roadmap-settle.mjs` → PASS, violations 0 | 2026-11-09 (at 1fa39fe1) | O9, AC10 |
| PE-006 | measured | The computed risk tier for the declared path set is `passive`. | `bun scripts/ceremony.mjs tier classify --paths …` → `tier: passive`, `reason_kind: no-executable-effect` | 2026-11-09 | `## Risk tier` |
| PE-007 | code | "Runner-crate commands" names the `@gtrabanco/agentic-workflow` CLI plus this repo's `scripts/*.mjs` gates — there is no separate binary. | `packages/agentic-workflow/bin/agentic-workflow.mjs` header; the `scripts/` tree | 2026-11-09 | INVENTORY carrier vocabulary; O8 |
| PE-008 | code | `audit-docs` check 13's prose is truncated in the shipped file. | `skills/audit-docs/SKILL.md` (Checks 13) | 2026-11-09 | `## Known pre-existing issues`; row AD20 |
| PE-009 | inferred | Execution frequency is assigned from each skill's position in the documented flow (per phase, per review, per session, occasional) — owner: this unit's author; no counter exists in the tree. | `docs/workflow/SKILLS.md` flow order and the skills' hand-off blocks | 2026-11-09 | the `F` column of every row |
| PE-010 | code | The repo's deterministic verification is `docs-generate --check`, `roadmap-settle` and `run-root-suite`; there is no application build. | `AGENTS.md` §Verification | 2026-11-09 | O13, P5 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | Every procedural step in shipped skill prose lands in exactly one of the two published classes. | P2 | P2 | author (inline) | `rg -c '^\| [A-Z]{2}[0-9]{2} \|' docs/features/107-mechanization-inventory/INVENTORY.md` matches 338 | row count in `INVENTORY.md` §7 | verified |
| O2 | S2 | Every shipped skill (29; no `metadata.internal` exception) has a section map and step rows. | P2 | P2 | author (inline) | `rg -c '^### [a-z]' docs/features/107-mechanization-inventory/INVENTORY.md` matches 29 | coverage table §2 with both counts | verified |
| O3 | S3 | Each row carries frequency, stability, enforcement value and a computed score, and the priority table ranks by it. | P2 | P2 | author (inline) | `rg -c '^\| [0-9]+ \| [A-Z]{2}[0-9]{2} \| .* \| [0-9] \| [0-9] \| [0-9] \| [0-9]+ \|' docs/features/107-mechanization-inventory/INVENTORY.md` matches 253 | §4 ranking plus the scoring command in §7 | verified |
| O4 | S4 | Every skill's section map carries heading paths and one-line roles whose counts equal the file's headings. | P2 | P2 | author (inline) | the §7 section-count command exits 0 | the command and its output in §7 | verified |
| O5 | S5 | The artifacts are English-only and the owner reviews them before merge. | P1 | P1 | author (inline) | `rg -c '[\x{e1}\x{e9}\x{ed}\x{f3}\x{fa}\x{f1}]' docs/features/107-mechanization-inventory/SPEC.md docs/features/107-mechanization-inventory/INVENTORY.md` matches 0 | the count plus the owner's verdict in the handoff | verified |
| O6 | S6 | No implementation, manifest entry or skill-prose edit lands with this unit. | P5 | P5 | author (inline) | `git diff --name-only main -- \| rg -v '^(docs/features/107-mechanization-inventory/\|docs/ROADMAP.md\|docs/LOGS.md\|.agentic-workflow/journal/\|docs/generated/)' \| wc -l` matches 0 | the path list in the log | verified |
| O7 | S7 | Every row carries a one-line reason; no row is left unexplained. | P2 | P2 | author (inline) | `rg -c '^\| [A-Z]{2}[0-9]{2} \|.*\|  \|$' docs/features/107-mechanization-inventory/INVENTORY.md` matches 0 | the count | verified |
| O8 | S8 | Every row naming an existing runner-crate command or script carries its `duplicate-of-code` flag. | P2 | P2 | author (inline) | `awk -F'\|' '/^\| [A-Z]{2}[0-9]{2} / { gsub(/ /,"",$6); gsub(/ /,"",$7); if (($6=="no") != ($7=="none")) print }' docs/features/107-mechanization-inventory/INVENTORY.md \| wc -l` matches 0 | the count plus the residue table §5 | verified |
| O9 | S9 | The docs checks pass and roadmap row 107 links the inventory doc. | P3 | P3 | author (inline) | `bun scripts/docs-generate.mjs --check` exits 0; `bun scripts/roadmap-settle.mjs` exits 0; `rg -c 'INVENTORY.md' docs/ROADMAP.md` matches 1 | both gate outputs plus the row | verified |
| O10 | S10 | No dependency is declared and the pilot feed is recorded. | P1 | P1 | author (inline) | `rg -c 'Feeds the pilot issue' docs/features/107-mechanization-inventory/SPEC.md` matches 4 | four occurrences: the requirement quote, the Impact line and the References line | verified |
| O11 | S11 | Every multi-step procedure with one judgment branch is split into its deterministic sub-steps plus a row naming the branch. | P2 | P2 | author (inline) | `rg -c '^\| [A-Z]{2}[0-9]{2} \|.*mixed' docs/features/107-mechanization-inventory/INVENTORY.md` matches 17, and every such row's reason contains `branch:` | §2 mixed count and the rows | verified |
| O12 | S12 | No `review-change`/`audit-pr`/fold run touches this unit. | P5 | P5 | author (inline) | `rg -c '^- \*\*R[0-9]' docs/features/107-mechanization-inventory/SPEC.md` matches 0 | the count | verified |
| O13 | S13 | The deterministic gate runs at the delivered head and every red it reports is reproduced at the base. | P5 | P5 | author (inline) | `bun scripts/docs-generate.mjs --check` exits 0; `G1` records the root suite's 62 pass / 16 fail with the same 16 reproduced at `1fa39fe1` | the `G1` line with both runs | verified |
| O14 | S14 | The session entry is written before the handoff, through the carrier's legal writer. | P4 | P4 | author (inline) | `ls .agentic-workflow/journal/*feat-408-mechanization-inventory-narrative-local.md \| wc -l` matches 1 | the fragment path | verified |
| O15 | S15 | The roadmap row is written through the emitter, never by hand. | P3 | P3 | author (inline) | the `roadmap rowUpsert` receipt prints `ok: true` and exits 0 | the receipt (`E` line) | verified |

## Triaged steps

This unit ran inline under the governing request's §5 substitution (local,
unpublished workflow; no lane triage, S12). The step set it actually used:

```text
Triaged steps: [design, plan, docs, evidence]
Tiers: docs=standard · evidence=standard
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

None — no review pass ran (S12).

## Log

- **L1** — 2026-11-09, the request, verbatim (the delegating turn; the excerpt
  keeps both verbatim strings this unit is obliged by):
  ```
  Apply to this repository: issue #408

  ## 4. Work inline — never run this repo's own machinery on its own surgery
  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change.
  ...
  The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```

- **P1** — 2026-11-09, unit doc frozen from the issue's own words; ledgers cut
  (15 obligations, 10 planning-evidence rows); computed tier recorded as
  `passive` with the governing request's deviation disclosed.
- **E1** — 2026-11-09, `bun scripts/ceremony.mjs tier classify --paths …` · exit 0 · `"tier": "passive"`, `"reason_kind": "no-executable-effect"`.
- **E2** — 2026-11-09, `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0 missing · 0 stale · 0 orphaned`, `verdict: PASS` (at `1fa39fe1`).
- **E3** — 2026-11-09, `bun scripts/roadmap-settle.mjs` · exit 0 · `164 unit docs checked`, `verdict: PASS`, `violations: 0` (at `1fa39fe1`).

## Next

The owner's verdict on the handoff. If the classification stands, promote the
top-ranked candidates to their own roadmap rows, one extraction per unit; if a
row is misclassified, the correction is a two-line edit in `INVENTORY.md` §3
plus its score — never a rewrite of the method.

## References

- Issue [#408](https://github.com/gtrabanco/agentic-workflow/issues/408);
  roadmap row 107 (`docs/ROADMAP.md` § Features).
- The inventory: [`INVENTORY.md`](INVENTORY.md).
- Feeds the pilot issue and all follow-up extraction units (S10): roadmap
  row 109 (the folded #410/#411/#412/#414 chain).

- **D1** — 2026-11-09, the session entry is written through the journal carrier's
  own writer (`.agentic-workflow/journal/*-narrative-local.md`), not by
  appending `docs/LOGS.md`: `scripts/log-immutability.mjs` (unit 468) names the
  aggregator as that file's only legal writer, so the letter of S14 ("manual
  append") would have reddened the gate S13 orders me to run. The entry exists
  before the handoff — the requirement's substance — via the declared writer.
- **D2** — 2026-11-09, the computed `passive` tier says a passive unit carries no
  unit doc; the governing request (S1–S15) orders the ledgers frozen in this
  folder. The request wins (instruction precedence), the deviation is recorded
  in `## Risk tier`, and no ceremony beyond the ledgers is carried.
- **E4** — 2026-11-09, `bun /tmp/408-inv/row.mjs` (the `roadmap rowUpsert` emitter over `docs/ROADMAP.md`) · exit 0 · `{"service":"roadmap","op":"rowUpsert","before":"4500b1fb","after":"9417fa80","ok":true}`.
- **E5** — 2026-11-09, `bun scripts/docs-generate.mjs` · exit 0 · `Sources: 165 units · 131 roadmap rows · 3 packages · 29 skills · 57 scripts`, `1 written`, `verdict: PASS`; `--check` afterwards: `0 missing · 0 stale · 0 orphaned`, `verdict: PASS`.
- **E6** — 2026-11-09, `bun scripts/roadmap-settle.mjs` · exit 0 · `165 unit docs checked · 0 fix docs skipped`, `verdict: PASS`, `violations: 0`.
- **E7** — 2026-11-09, `bun scripts/test-impact.mjs --base main` · exit 0 · `changed: 2 · executable: 0 · suites (0)`, `reason: no executable path changed` (the empty verdict, recorded instead of an invented test).
- **E8** — 2026-11-09, `bun scripts/phase-lint.mjs docs/features/107-mechanization-inventory/SPEC.md` · exit 0 · `P1…P5 Phase-lint: PASS (6/6)`, `verdict PASS`.
- **E9** — 2026-11-09, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/107-mechanization-inventory/SPEC.md` · exit 0 · `VERIFY PASS`, `ok: true`, `violations: []`, shape `spec-by-reference`.
- **E10** — 2026-11-09, the acceptance counts: `rg -c '^\| [A-Z]{2}[0-9]{2} \|' INVENTORY.md` → 338; `rg -c '^### [a-z]' INVENTORY.md` → 29; `rg -c '^\| [0-9]+ \| [A-Z]{2}[0-9]{2} \| .* \| [0-9] \| [0-9] \| [0-9] \| [0-9]+ \|' INVENTORY.md` → 253; the S4 section-parity `diff` → exit 0 (no output).
- **G1** — 2026-11-09, `bun scripts/run-root-suite.mjs` · exit 1 at head `7b5027d3689f03f6396b0ab244b8af050d4159c1` · the root gate dispatched 96 suites: 80 pass, 16 fail (`audit-pr-receipt`, `ceremony`, `ceremony-docs`, `ceremony-findings-ledger`, `ceremony-passive`, `ceremony-unit-plan`, `ceremony-workspace`, `continuation-discipline`, `invocation-drift`, `local-gate`, `log-immutability`, `next-step-ranking`, `review-loop-discipline`, `review-receipt`, `workflow-status-compact`, `workflow-status-sensor`) — all fixture/forge-dependent, none touching this unit's paths.
- **G2** — 2026-11-09, the differential baseline: the same `bun scripts/run-root-suite.mjs` in a detached `git worktree` of `1fa39fe1` fails the same 16 suites (plus `doc-discipline` and `roadmap-moved`, which fail only there because that checkout's `node_modules` is a symlink the suite's `grep` refuses). Delivered head `2c6d388e` introduces no failing suite the base does not already have; the doc gates (`docs-generate --check`, `roadmap-settle`, `phase-lint`, `verify`, `log-immutability --base main`) are green at the delivered head.
- **P2** — 2026-11-09, `INVENTORY.md` authored: 29 section maps, 338 classified
  rows, 253-row priority ranking, residue table, limits and receipts · commit `a3ecba02`.
- **P3** — 2026-11-09, roadmap row 107 written by the emitter and the generated
  projection re-rendered · commit `7b5027d3`.
- **P4** — 2026-11-09, session entry written through the journal writer:
  `.agentic-workflow/journal/20261109T153901Z-feat-408-mechanization-inventory-narrative-local.md`.
