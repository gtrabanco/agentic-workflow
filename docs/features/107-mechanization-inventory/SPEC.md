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

**S16 — Correction: fix items 1 and 3, and open the PR.**
> "Arregla 1 (D1), 3 y abre la pr"

S12–S15 are the governing request's own process requirements, quoted verbatim
from the turn that delegated issue #408; S1–S11 are the issue it delegates to.
S16 is the appended correction (never a rewrite of S6): it orders the two
disclosed defects repaired and the branch opened as a PR, so S6's
classification-only boundary still covers S1–S15's artifacts and no longer
forbids these two repairs.

## Impact

- **Consumes** (read-only): every `skills/*/SKILL.md`, the deterministic surfaces
  it names (`scripts/*.mjs`, the `agentic-workflow` crate's subcommands),
  `docs/ROADMAP.md` row 107.
- **Produces**: `INVENTORY.md` in this folder — the worklist every future
  extraction unit (the folded #410/#411/#412/#414 chain, and whatever the owner
  promotes later) reads instead of re-deriving candidacy.
- **Stops being true**: nothing. No skill prose, manifest entry, script or
  template changes (S6). The roadmap row gains one link (S9).
- **Ask before touching**: the pi bundle manifest and any projection op — out
  of scope. Skill prose is otherwise out of scope too; S16 authorizes exactly
  one repair (`skills/audit-docs/SKILL.md` check 13) and the one gate fix it
  needs (`scripts/log-immutability.mjs` plus its suite).

## Retirements

None — this is a docs unit and it supersedes no surface. The inventory *names*
future retirements (the prose each candidate would displace) but retires none
(S6); an empty retirement list here is the honest answer, not a gap.

## Non-goals

- Extracting any prose into code or adding a manifest entry (S6). Editing a
  skill is out of scope except the one repair S16 orders: the truncated
  `audit-docs` check 13.
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

- `skills/audit-docs/SKILL.md` check 13 was truncated mid-sentence ("for
  orphan pages each:", "propose )") when the `generate-docs` skill retired.
  **Affects** this unit as row `AD20`; **repaired** under S16 — the check now
  names the renderer's own header, scopes the provenance criteria to pages that
  carry the fields, answers `n/a — no provenance fields` otherwise, and points
  the refresh at `bun scripts/docs-generate.mjs`.
- The sandbox has no `node` binary; the repo's suites spawn `node` as their
  documented fallback, so they failed here until a bun-backed `node` shim was
  put on `PATH` for the gate run (G3/G4 record both).
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
- **AC7 (S6)** — classification only, with S16's two authorized repairs excluded:
  `git diff --name-only main -- | rg -v '^(docs/features/107-mechanization-inventory/.*|docs/ROADMAP\.md|docs/LOGS\.md|\.agentic-workflow/journal/.*|docs/generated/.*|\.changeset/408-mechanization-inventory\.md|scripts/log-immutability\.mjs|scripts/log-immutability\.test\.mjs|skills/audit-docs/SKILL\.md)$' | wc -l` matches 0.
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
- **AC15 (S14)** — the session entry is in the journal itself, not a pending
  fragment: `rg -c '^## .*feat-408-mechanization-inventory' docs/LOGS.md`
  matches 4 and `ls .agentic-workflow/journal/*408-mechanization-inventory*`
  matches 0. (Refrozen 2026-11-09 by the owner's B3 order: the original `matches 1`
  predates two later entries for this unit — the correction batch's own (`17:31:14Z`)
  and a concurrent session's (`17:31:52Z`) — and this batch's aggregation added the
  fourth (`18:11:04Z`); the criterion's substance is unchanged: every entry is in the
  journal and no fragment is pending.)
- **AC16 (S15)** — the roadmap row was written by the emitter: the
  `roadmap rowUpsert` receipt (`ok: true`, exit 0) is recorded as an `E` line,
  and `rg -c 'INVENTORY.md' docs/ROADMAP.md` matches 1.
- **AC17 (S16 · D1)** — the aggregator and the gate agree:
  `bun scripts/log-immutability.mjs --base main` exits 0 and reports
  `0 violations`, and its suite reports 19 pass / 0 fail on a node-capable `PATH`.
- **AC18 (S16 · item 3)** — check 13 is grammatical and current:
  `rg -c 'for orphan pages|propose $' skills/audit-docs/SKILL.md` matches 0,
  `bun scripts/skill-lint.mjs --skill audit-docs` exits 0 and
  `bun scripts/check-skill-context.mjs` exits 0.
- **AC19 (S16 · PR)** — the unit is opened as a PR: `gh pr view --json url` for
  the branch returns a URL, recorded in `## References`.

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
- P4 — Write the session entry through the journal carrier, whose aggregator
  consumes it into the journal (validator: `rg -c '^## .*feat-408-mechanization-inventory' docs/LOGS.md` matches 4)
  (Implements: S14)
  Relevant files: docs/LOGS.md
- P5 — Run the deterministic gate, record the receipts and close the obligations
  ledger (validator: `bun scripts/docs-generate.mjs --check` exits 0 and the log records the root suite's verdict)
  (Implements: S5, S9, S12, S13)
  Relevant files: docs/features/107-mechanization-inventory/SPEC.md
- P6 — Fix D1: aggregate the entry into the journal and make the gate accept the
  aggregator's separator (validator: `bun scripts/log-immutability.mjs --base main` exits 0)
  (Implements: S14, S16)
  Relevant files: scripts/log-immutability.mjs, scripts/log-immutability.test.mjs, docs/LOGS.md
- P7 — Repair `audit-docs` check 13 against what ships, with its changeset
  (validator: `bun scripts/skill-lint.mjs --skill audit-docs` exits 0 and `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S16)
  Relevant files: skills/audit-docs/SKILL.md, .changeset/408-mechanization-inventory.md
- P8 — Push the branch and open the PR against `main`
  (validator: `gh pr view --json url -q .url` prints a URL and `rg -c '^- PR \[#482\]' docs/features/107-mechanization-inventory/SPEC.md` matches 1)
  (Implements: S16)
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
| O6 | S6 | No implementation, manifest entry or skill-prose edit lands with this unit beyond the two repairs S16 authorizes. | P5 | P5 | author (inline) | `git diff --name-only main -- \| rg -v '^(docs/features/107-mechanization-inventory/.*\|docs/ROADMAP\.md\|docs/LOGS\.md\|\.agentic-workflow/journal/.*\|docs/generated/.*\|\.changeset/408-mechanization-inventory\.md\|scripts/log-immutability\.mjs\|scripts/log-immutability\.test\.mjs\|skills/audit-docs/SKILL\.md)$' \| wc -l` matches 0 | the path list in the log | verified |
| O7 | S7 | Every row carries a one-line reason; no row is left unexplained. | P2 | P2 | author (inline) | `rg -c '^\| [A-Z]{2}[0-9]{2} \|.*\|  \|$' docs/features/107-mechanization-inventory/INVENTORY.md` matches 0 | the count | verified |
| O8 | S8 | Every row naming an existing runner-crate command or script carries its `duplicate-of-code` flag. | P2 | P2 | author (inline) | `awk -F'\|' '/^\| [A-Z]{2}[0-9]{2} / { gsub(/ /,"",$6); gsub(/ /,"",$7); if (($6=="no") != ($7=="none")) print }' docs/features/107-mechanization-inventory/INVENTORY.md \| wc -l` matches 0 | the count plus the residue table §5 | verified |
| O9 | S9 | The docs checks pass and roadmap row 107 links the inventory doc. | P3 | P3 | author (inline) | `bun scripts/docs-generate.mjs --check` exits 0; `bun scripts/roadmap-settle.mjs` exits 0; `rg -c 'INVENTORY.md' docs/ROADMAP.md` matches 1 | both gate outputs plus the row | verified |
| O10 | S10 | No dependency is declared and the pilot feed is recorded. | P1 | P1 | author (inline) | `rg -c 'Feeds the pilot issue' docs/features/107-mechanization-inventory/SPEC.md` matches 4 | four occurrences: the requirement quote, the Impact line and the References line | verified |
| O11 | S11 | Every multi-step procedure with one judgment branch is split into its deterministic sub-steps plus a row naming the branch. | P2 | P2 | author (inline) | `rg -c '^\| [A-Z]{2}[0-9]{2} \|.*mixed' docs/features/107-mechanization-inventory/INVENTORY.md` matches 17, and every such row's reason contains `branch:` | §2 mixed count and the rows | verified |
| O12 | S12 | No `review-change`/`audit-pr`/fold run touches this unit. | P5 | P5 | author (inline) | `rg -c '^- \*\*R[0-9]' docs/features/107-mechanization-inventory/SPEC.md` matches 0 | the count | verified |
| O13 | S13 | The deterministic gate runs at the delivered head and every red it reports is reproduced at the base. | P5 | P5 | author (inline) | `bun scripts/docs-generate.mjs --check` exits 0; `G1` records the root suite's 80 pass / 16 fail with the same 16 reproduced at `1fa39fe1` | the `G1` line with both runs | verified |
| O14 | S14 | The session entry reaches the journal itself before the handoff. | P4 | P4 | author (inline) | `rg -c '^## .*feat-408-mechanization-inventory' docs/LOGS.md` matches 4 | the appended block | verified |
| O16 | S16 | The aggregator's own output passes the gate that judges it (D1), pinned red-first. | P6 | P6 | author (inline) | `bun scripts/log-immutability.mjs --base main` exits 0; its suite reports 19 pass / 0 fail | `E11`/`G3` lines and the two commits (test red, fix green) | verified |
| O17 | S16 | `audit-docs` check 13 reads as one grammatical, current check. | P7 | P7 | author (inline) | `bun scripts/skill-lint.mjs --skill audit-docs` exits 0 and `bun scripts/lint-changeset.mjs` exits 0 | `E12` line | verified |
| O18 | S16 | The unit is opened as a PR against `main`. | P8 | P8 | author (inline) | `gh pr view --json url` prints a URL | the URL in `## References` | verified |
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



- **D1** — 2026-11-09, the session entry is written through the journal carrier's
  own writer (`.agentic-workflow/journal/*-narrative-local.md`), not by
  appending `docs/LOGS.md`: `scripts/log-immutability.mjs` (unit 468) names the
  aggregator as that file's only legal writer, so the letter of S14 ("manual
  append") would have reddened the gate S13 orders me to run. The entry exists
  before the handoff — the requirement's substance — via the declared writer.
  Superseded by D3: the entry was aggregated into the journal itself.
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
- **P4** — 2026-11-09, session entry written through the journal writer (a
  fragment at the time; superseded by P6, which aggregated it into `docs/LOGS.md`).
- **L2** — 2026-11-09, the correction, verbatim:
  ```
  Arregla 1 (D1), 3 y abre la pr
  ```
- **D3** — 2026-11-09, D1 resolved (S16 item 1). The entry was aggregated into
  `docs/LOGS.md` by the aggregator CLI over a carrier holding only this
  session's fragment (`journal aggregate --journal-dir .agentic-workflow/tmp/agg-408`),
  the fragment was consumed, and the commit carries the aggregator's own
  committer identity — the workflow's, not a borrowed environment. That exposed
  the real defect: `scripts/log-immutability.mjs` tested the raw range suffix for
  the `## ` heading while the aggregator writes a blank-line separator first, so
  the gate reddened on the aggregator's own output. Fixed red-first — test
  `6e3d9ea7` observed red (18 pass / 1 fail), fix `d41f7844` observed green
  (19 pass / 0 fail). S14 now holds literally: the entry is in the journal and
  nothing is pending.
- **D4** — 2026-11-09, check 13 repaired (S16 item 2) against what ships rather
  than by restoring the retired `generate-docs` command: the check names the
  renderer's own header, applies the orphan/stale criteria only to pages that
  carry `source-unit`/`updated`, answers `n/a — no provenance fields` otherwise,
  and points the refresh at `bun scripts/docs-generate.mjs`.
- **E11** — 2026-11-09, `agentic-workflow journal aggregate --journal-dir .agentic-workflow/tmp/agg-408 --log docs/LOGS.md` · exit 0 · `{"ok":true,"appended":["20261109T153901Z-feat-408-mechanization-inventory-narrative-local.md"],"removed":["20261109T153901Z-feat-408-mechanization-inventory-narrative-local.md"],"fragments":1}`.
- **E12** — 2026-11-09, `bun scripts/skill-lint.mjs --skill audit-docs` · exit 0 · `0 finding(s)`, `verdict: PASS`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 29 skills`; `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/version-parity-gate.mjs --content --base main` · exit 0 · `VERDICT: PASS`.
- **E13** — 2026-11-09, `bun scripts/log-immutability.mjs --base main` · exit 0 · `0 violations`, `verdict: PASS`; the suite reports `19 pass / 0 fail`.
- **G3** — 2026-11-09, `PATH=<bun-backed node shim> bun scripts/run-root-suite.mjs` · exit 1 at head `d41f7844c7617c5460e7f70dd21f32fa097f533f` · 95 of 96 suites pass; the single failure is `scripts/invocation-drift.test.mjs`, which asserts node-runner semantics for a `node --test` skip and therefore fails only because the shim replaces `node` with bun (this machine has no node binary).
- **G4** — 2026-11-09, the same suite with no shim · exit 1 at head `d41f7844c7617c5460e7f70dd21f32fa097f533f` · 16 suites fail, every one of them spawning `node`; the identical set fails at `1fa39fe1`, so none of it is this change's regression.
- **P6** — 2026-11-09, D1 fixed: the entry aggregated into the journal, the
  gate made to accept the aggregator's separator · commits `6e3d9ea7` (red) and
  `d41f7844` (green).
- **P8** — 2026-11-09, branch pushed and PR
  [#482](https://github.com/gtrabanco/agentic-workflow/pull/482) opened against `main`;
  the index row settled to `done · [#482](…)` through the emitter.
- **P7** — 2026-11-09, `audit-docs` check 13 repaired with its changeset;
  `skill-lint`, the context budgets, the changeset lint and the version-parity
  gate all green.
- **L3** — 2026-11-09, the external verifier's verdict (`external-verify.md`, two
  blockers), and the correction request, verbatim:
  ```
  Apply to this repository: fix the findings, just relevant, make sure dont break
  other thing when fixing, if you do fix that and make a loop until no issue is
  report due a finding report
  ```
- **D5** — 2026-11-09, the verifier's B1 and B2 repaired. **B1**: the stray
  fragment at the end of this file's `### Obligations` table (a truncated copy of
  O14's last cell, introduced by `77db19e8`) is deleted. **B2**: the S6 validator
  in `AC7`/`O6` had stopped reproducing — it reported 4 paths, because S16's two
  authorized repairs (`.changeset/408-mechanization-inventory.md`,
  `scripts/log-immutability.mjs` + its suite, `skills/audit-docs/SKILL.md`) fall
  outside the S6-era carve. The pattern is now anchored and names those four
  paths exactly rather than a directory prefix, so a new file under a carved
  prefix is still caught and the negative control still fails closed. `O13`
  quoted `62 pass / 16 fail` where `G1` records `96 suites: 80 pass, 16 fail`;
  corrected to `80`.
- **E14** — 2026-11-09, the three reproducers re-run at the corrected head:
  stray rows in the `### Obligations` table → 0 (header row excluded); the `AC7`
  command → `0`, with the negative control still listing an uncarved path
  (`scripts/roadmap-settle.mjs`) while the carved set passes;
  `root suite's 80 pass / 16 fail` matches `G1`'s `80 pass, 16 fail`.
- **D6** — 2026-11-09, the owner's fix-B3 order authorizes the amendment the
  delta verify named as owner-only: `AC15`/`O14`/`P4`'s frozen `matches 1` is
  refrozen to `matches 4` — two later entries for this unit (the correction
  batch's own `17:31:14Z` and a concurrent session's `17:31:52Z`) predate this
  batch, whose aggregation adds the fourth (`18:11:04Z`, written through the
  journal writer and aggregated from a temp carrier holding only this batch's
  fragment; the two pending `main` fragments of advisory N1 are untouched).
  The criterion's substance is unchanged: every entry is in the journal, no
  fragment pending. Re-trigger: a future entry for this unit moves the count
  again — the count is a ledger fact, refreeze it with a dated note, never
  hand-edit `docs/LOGS.md`.
- **E15** — 2026-11-09, the B3 validator re-run at the amended head:
  `rg -c '^## .*feat-408-mechanization-inventory' docs/LOGS.md` → 4;
  `ls .agentic-workflow/journal/*408-mechanization-inventory* | wc -l` → 0;
  `bun scripts/log-immutability.mjs --base main` → exit 0, `0 violations`;
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify …/SPEC.md` →
  `VERIFY PASS`, `violations: []`; `bun scripts/phase-lint.mjs …/SPEC.md` →
  PASS; `bun scripts/docs-generate.mjs --check` → PASS; `bun
  scripts/roadmap-settle.mjs` → PASS, violations 0.

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
- PR [#482](https://github.com/gtrabanco/agentic-workflow/pull/482) —
  `Closes #408`.
