---
type: fix
scope: large
roadmap_summary: Issue [#646](https://github.com/gtrabanco/agentic-workflow/issues/646) (L): docs + skills reconciliation — REPOSITORY_STATE freshness contract (`covers-through`, staleness rule, re-freeze of the fossil snapshot), unowned-duplicate reconciliation in `docs/` and `skills/` (B-table + D-table → owner pointer or delete), synthesis-and-reduction pass, cache-aware progressive-loading ladder, second full read, and the durable restatement detector the class needs. Excludes AGENTS.md reduction (#645, merged), vocabulary residency (#643, merged) and the substrate alarm (#644, merged).
---

# fix/646-docs-skills-reconciliation

> One-line: the documentation tree stops carrying copies of rules that already
> have an owner, the frozen repository snapshot stops being consumed as current
> truth after a recorded decision reverses it, and a deterministic sweep keeps
> the restatement class from regrowing while a loading ladder keeps a session
> from reading the wrong tier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#646` — tracked issue in the project's forge, closed by this PR via `Closes #646`.

## Specs

The requirements are the issue's `## In scope` section, one requirement per
`S#`, quoted verbatim. `## Amendment 2`'s items are appended as corrections under
their own ids (`S3a`, `S3b`, `S5a`, `S6a`, `S6b`), never as rewrites of the line
they amend.

**S1 — REPOSITORY_STATE freshness contract.**
> **S1 — REPOSITORY_STATE freshness contract.** Add to the frozen-ledger contract: a `covers-through` date field on the snapshot; the staleness rule (a frozen fact or accepted decision contradicted by a dated, recorded owner decision → the fact is `stale`, the tree is verified, the contradiction is reported — never consumed as current); `resolve-repository-state` (or a re-freeze) as the recorded close step of any unit that reverses or supersedes an accepted decision; the WORKFLOW_INVARIANTS step-2 wording amended to the freshness-checked order. Machine surface where one exists (the snapshot's own table grammar; a suite pins the new fields red-first). Then **re-freeze the current state**: run the discover/resolve path so the fossil rows (F004, F006, F007, F010, F011, AD-002) are replaced by current verified facts — the F011/AD-002 English contradiction is the acceptance reproducer (fixture: stale fact + newer decision → `stale` verdict, not consumption).

**S2 — Unowned-duplicate reconciliation in docs/.**
> **S2 — Unowned-duplicate reconciliation in docs/.** For every row of the B-table: the copy becomes a pointer to its owner (the GATE_INVENTORY pattern) **or** is deleted — never restated. B1's copies must not carry a wording the owner does not (the lost inline-batch exception is the proof this class drifts). B5: one home for the AI-001 template (design step decides which of the two docs owns it; the other links). B6: layout gains the missing entries. B7: header sentence reworded to the real state. A2: fix the index row; add `rendered-facts@1` rows for count-class restatements this pass finds (the three/four-packages class). Every converted pointer keeps the doc's budget ceilings honest (`check-skill-context --documents` re-measured, manifest sources updated).

**S3 — Synthesis and reduction pass (ask-first deletions).**
> **S3 — Synthesis and reduction pass (ask-first deletions).** Walk every doc under `docs/` **and every reference under `skills/*/references/`** (including `docs/design/`, `docs/research/`, `docs/assets/`, `docs/passive/`, `docs/pre-spec/`, `docs/telemetry/`): (a) merge sections that say the same thing twice within one doc or across siblings (candidates seeded: `docs/workflow/README.md` core principles vs SKILLS.md design rules — one home, the other links; LANE_FLOW vs FEATURE_WORKFLOW overlap; TESTS.md's intra-file duplicate); (b) synthesize verbose passages that survive; (c) **obsolete-section removal list** — every proposed deletion carries its evidence (superseded-by pointer, zero-reader verification, git history) and lands **only after the owner approves that batch**; the unit proceeds with the approved subset and records declines. Frozen historical records (`docs/features/*`, `docs/fix/*`, LOGS) are out of scope — they are history, never edited for currency. REDESIGN.md's false "draft" status and `ship-roadmap.png` are seeded candidates for the list.

**S3a — The Notion mirror is eliminated (pre-authorized deletion).**
> **A2 — The Notion mirror is eliminated (owner decision, pre-authorized deletion).**
> `docs/workflow/README.md:8`: *"A reader-friendly multi-page mirror lives in Notion ('Agentic Workflow')"* — also cited at `docs/design/REDESIGN.md:237`. Owner decision 2026-11-19: the mirror is **retired**. Both references are deleted in this unit's S3 (they carry evidence enough: external surface, no sync mechanism, no normativity declaration — a distribution claim that cannot be verified from the tree).

**S3b — The durable detector is a requirement.**
> **A6 — The durable detector is a requirement, not a recommendation.**
> A one-pass reconciliation decays: the TESTS.md intra-file duplicate is the proof the class regrows, and no sweep owns it today (audits 1–2 missed every finding of this unit). **The unit ships the detector**: (a) the restatement-without-owner sweep becomes an **audit-docs dimension** (or a `residue-dimensions` rule with the B/D tables as its seeded corpus) so product-audit runs it on every pass; (b) every *"cited, never restated"* claim in a reference gets a **probe** — the TEST_IMPACT precedent generalized, so the claim is machine-verified instead of asserted; (c) the probe set and the dimension's pass criteria are pinned by a suite red-first. S5's second read feeds the corpus; the detector keeps it dead.

**S4 — Progressive-loading architecture (cache-aware).**
> **S4 — Progressive-loading architecture (cache-aware).** Document and implement the loading ladder: what every session loads always (AGENTS.md core + documentation map) vs one-hop-on-demand (deep references, deep docs) vs rarely (audits, research). Deliverables: (a) the ladder documented in the documentation map with each doc's tier; (b) per-file ordering guidance — stable regions first, volatile regions last — so a growing machine block (e.g. `normative-surfaces@1`, re-pinned by nearly every unit) does not invalidate the cache of the prose before it; evaluate (measure, decide, record) whether the machine blocks of AGENTS.md move to a dedicated late-loaded file vs staying inline re-ordered; (c) the balance rule stated: always-loaded content is the minimum every session needs (identity, precedence, working rules, the map), everything else earns its place by measured read-frequency; (d) measurement before/after (bytes a fresh session reads for a typical unit-lane task). This S does NOT shrink AGENTS.md (that is #645's) — it orders and tiers the whole tree.

**S5 — Second full read (the hunter pass).**
> **S5 — Second full read (the hunter pass).** Re-read every docs file **and every skill file** end-to-end with the three lenses: more duplicates (same class as B1–B5 / D1–D5), dead docs (nothing reads them: no inbound pointer from the map, no gate, no skill reference — verified, not assumed), missing architecture information (a decision that exists in git history, issues, or the CHANGELOG but has no owning doc — e.g. anything the #643 residency audit surfaced that lacks an architecture home). Deliverable: a findings table (file × finding × evidence × route: fix-now / delete-with-approval / new-unit), folded into S2/S3/S4/S6 execution where the owner approves.

**S5a — The second read is a FULL READ, verified with evidence.**
> **B — The second read is a FULL READ, verified with evidence (scope correction).**
> The findings above came from keyword sweeps; S5's hunter pass is a **complete read of every in-scope file** — every `SKILL.md` and every file under every `references/`, all of `docs/workflow/`, `docs/design/`, `docs/research/`, `docs/assets/`, `docs/passive/`, `docs/pre-spec/`, `docs/telemetry/`, all of `template/`, and the `.github/` templates — and every finding (old or new) carries line-level evidence. Files the sweeps never opened, named so they cannot be skipped again: `docs/workflow/RECOMMENDED_SKILLS.md`, `docs/workflow/GIT_IDENTITY_HARDENING.md`, `.github/ISSUE_TEMPLATE/fix.yml`, `docs/passive/*`, `docs/pre-spec/*`, `docs/telemetry/schema.json`, and **all of `template/AGENTS.md`** (636 lines).
>
> **Scope clarification (owner)**: `template/AGENTS.md` ≠ root `AGENTS.md` — different domains by construction (the target project's guide vs the agentic-workflow product's own host guide); they are not duplicates of each other. The full read verifies their shared content anyway — the template's "Workflow conventions", "PR & branch workflow" and "Commit format" sections may restate host rules, and each overlap is classified: owner pointer / sanctioned project-shaped adaptation / unowned copy. The same classification applies to every template file: it serves the target project, and it must not silently contradict the product's own rules.

**S6 — Skills prose reconciliation (the D-table).**
> **S6 — Skills prose reconciliation (the D-table).** Same mechanics as S2, applied to the skills tree, with the owner-pointer-or-delete rule:
>
> - **D1 (red-first)**: AGENTS.md owns the obligation; TEST_IMPACT owns the mechanism. TESTS.md's checklist copy and its "## Red-first commits" section collapse to **one** pointer to the owner (keeping the checklist's own checklist-cell if the lane needs one, as a pointer not a restatement). execute-phase's *"UI/adapter glue may test after"* exception goes to an **owner decision**: either the owner adopts the exception in the owning surface (AGENTS.md or TEST_IMPACT) or the copy drops it — the design step records which; the exception surviving only in a restatement copy is the defect. The evidence phrasing unifies on the owner's (*"naming both commit SHAs"*). TEST_IMPACT's "never restated" claim becomes true — and a probe (or the residue-dimensions suite's next rule) verifies it instead of trusting it.
> - **D2 (weaker-than-author)**: one home is chosen by the design step (candidates: TEST_IMPACT's mechanism-adjacent section, ORCHESTRATE's pass-model section, or review-change's pass-routing block — the owner is wherever the rule's *mechanism* lives); the other 5 wordings become pointers; RELAY's strong-tier addendum for coherence/adversarial either joins the owner (as the sanctioned elaboration) or stays as RELAY's own declared exception with the owner pointer.
> - **D3 (portability citations)**: the 5 violating no-slash sections convert to the compliant pattern (cite PORTABILITY.md, keep only skill-specific fallbacks) — the 4 compliant skills are the proof the pattern works.
> - **D4 (branch rule)**: RELEASE.md's copy becomes *"one PR per unit, against the project's **default branch**"* with the AGENTS.md owner pointer **and** the inline-batch exception named; TURN_CONTRACT's box-1 wording stays (it owns the box).
> - **D5 (inline degrade)**: review-change cites ORCHESTRATE as the contract's owner; ORCHESTRATE either absorbs the reviewer-pass nuance or the pointer carries it.
> - **Minors**: DOCS.md's conventional-commit copy gains the owner pointer; RELAY's tier table cites `catalog.json` (the same source unit-lane names) instead of hardcoding tiers.
>
> Every skills change re-runs `bun scripts/skill-lint.mjs` and `bun scripts/check-skill-context.mjs`; budgets re-pinned where pointer conversion shrinks content (with the manifest's growth-source recorded, negative).

**S6a — The stack-agnostic rule and host-agent naming (decision required, then enforced).**
> **A1 — The "stack-agnostic" rule vs host-agent naming (decision required, then enforced).**
> `AGENTS.md` Working rules: *"Do not introduce references to any specific product, stack, framework, ORM, runtime, or architecture pattern into the skills or the shared docs."* Yet the skills name **Claude Code in ~10 files** (every `## Portability (agents other than Claude Code)` section — execute-phase:368, fold-findings:314, review-change/references/PORTABILITY.md, audit-docs:244, log-session:191, workflow-status/references/PORTABILITY.md, product-audit:240 — plus ADVERSARIAL_SETUP.md:79, log-session:195, product-audit:85), and `init-workspace` names **Claude/Cursor/Copilot/OpenCode** (the safety-adapter offer; `docs/workflow/SKILLS.md:56`). No carve-out is recorded anywhere — the rule and the practice contradict, the same decision-vs-counter-decision class this unit exists to close. **Requirement**: the unit records the owner decision in the rule's own text (one sentence carve-out: the rule scopes to the *target project's stack*; host-agent names are sanctioned where a portability or adapter feature requires them) and S5's sweep then verifies no *other* product naming survives unsanctioned. The decision is recorded in the unit doc, never inferred.

**S6b — D4's scope is wider than first reported.**
> **A4 — D4's scope is wider than first reported (amended evidence).**
> The `main` hardcode is not just RELEASE.md's rule line — the whole executor/release path carries it: `execute-phase/SKILL.md:279` ("open the PR on `main`"), `unit-lane/references/RELEASE.md:27` ("PR created on `main`"), `RELEASE.md:52-53` (the rule), and `execute-phase/references/EXECUTION_CONTRACT.md:114` scopes the force-push ban *to `main`* while the owner (AGENTS.md) bans it on **any published history** — a fourth divergence of the same rule. S6-D4 covers all four sites; each spells "default branch" (or cites the branch field the unit declares) and carries the AGENTS.md owner pointer.

## Acceptance criteria

Frozen at cut. The issue carries no `## Acceptance criteria` section, so the
list is one observable criterion per requirement, each naming the check that
proves it (owner: the issue, quoted in `## Specs`).

- **AC-S1** — The snapshot contract carries `covers-through`, every accepted
  decision carries a `decided` date, and the reader answers `fresh` on the
  committed snapshot. A fixture in which a decision is dated after
  `covers-through` answers `stale` (exit 1) and names the contradiction; a
  missing `covers-through` and a `stale` fact with no `superseded-by` refuse
  closed. The fossil rows (F004, F006, F007, F010, F011, AD-002) are replaced by
  current verified facts. Check: `bun scripts/repository-state.mjs docs/workflow/REPOSITORY_STATE.md`
  prints `verdict: fresh` and exits 0; `bun test scripts/repository-state.test.mjs`
  exits 0 with cases `F-646-1`…`F-646-5`; `rg -c 'feature 57 restores' docs/workflow/REPOSITORY_STATE.md`
  matches 0.
- **AC-S2** — No B-table copy survives as a restatement: each becomes a pointer
  to its owner or is gone, the AI-001 template has exactly one home plus a link,
  the layout names `docs/audits/` and `.claude-plugin/`, the header no longer
  promises an absent `CLAUDE.md`, the package count is machine-pinned, and the
  budgets re-measure clean. Check: `bun scripts/restatement-sweep.mjs` prints
  `verdict: PASS`; `bun scripts/check-skill-context.mjs --documents` exits 0;
  `bun test scripts/normative-drift.test.mjs` exits 0 with the new
  `count:packages` row.
- **AC-S3** — The obsolete-removal list is committed with per-item evidence and
  its landing state (the approved subset or the recorded decline) is a `D` line;
  the seeded candidates are decided either way; frozen history is untouched.
  Check: `rg -c '^### R[0-9]+' docs/fix/646-docs-skills-reconciliation/second-read.md`
  matches at least the seeded candidates, and every row carries an
  `evidence:` cell (`rg -c 'evidence: ' …` matches the row count).
- **AC-S3a** — Neither the Notion mirror sentence nor its `REDESIGN.md` citation
  survives. Check: `rg -c -i 'notion' docs/workflow/README.md docs/design/REDESIGN.md`
  matches 0 for both files.
- **AC-S3b** — The restatement sweep exists, is bound to a corpus block, refuses
  an unowned restatement and a false "cited, never restated" claim on fixtures,
  passes on the tree, is claimed by `audit-docs` and by a product-audit
  dimension, and is inventoried as a gate. Check:
  `bun test scripts/restatement-sweep.test.mjs` exits 0;
  `bun scripts/restatement-sweep.mjs` prints `verdict: PASS`;
  `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`.
- **AC-S4** — The ladder is documented with a tier per document, the balance
  rule and the per-file ordering guidance; the guide's volatile machine region
  sits after its stable prose; the before/after read cost of a representative
  `unit-lane` task is measured and recorded. Check:
  `rg -c 'loading-ladder@1' docs/workflow/LOADING.md` matches 1 and
  `bun scripts/check-skill-context.mjs --documents` exits 0 with the measured
  table recorded in `second-read.md`.
- **AC-S5** — Every in-scope file of the S5a list is read and carries a row with
  line-level evidence and a route; the file set is derived from the tree, not
  typed. Check: `bun scripts/reading-coverage.mjs --scope docs-skills` prints
  `verdict: covered` and exits 0 (no in-scope file unread).
- **AC-S5a** — The full-read ledger names each of the files the keyword sweeps
  never opened. Check: `rg -c 'RECOMMENDED_SKILLS|GIT_IDENTITY_HARDENING|fix.yml|docs/passive/|docs/pre-spec/|docs/telemetry/schema.json|template/AGENTS.md' docs/fix/646-docs-skills-reconciliation/second-read.md`
  matches at least 7.
- **AC-S6** — No D-table copy survives as a restatement: the red-first
  mechanism has one owner, the weaker-than-author rule has one home, the five
  no-slash sections cite `PORTABILITY.md`, the four branch-rule sites spell
  "default branch" with the owner pointer and the inline-batch exception, the
  inline-degrade rule cites `ORCHESTRATE.md`, the minor copies cite their
  owners, and `skill-lint` plus the budgets pass. Check:
  `bun scripts/restatement-sweep.mjs` prints `verdict: PASS`,
  `bun scripts/skill-lint.mjs` prints its PASS line, and
  `bun scripts/check-skill-context.mjs` exits 0.
- **AC-S6a** — The stack-agnostic rule's text carries the owner's carve-out
  sentence (the rule scopes to the target project's stack; host-agent names are
  sanctioned where a portability or adapter feature requires them) and the full
  read verifies no unsanctioned product naming survives. Check:
  `rg -c "host-agent" AGENTS.md` matches 1, and the S5 table carries one row per
  host name found with its classification.
- **AC-S6b** — All four branch-rule sites name the default branch and the
  force-push ban in `EXECUTION_CONTRACT.md` scopes to published history, not to
  `main`. Check: `rg -c 'on `main`' skills/execute-phase/references/EXECUTION_CONTRACT.md`
  matches 0 for the ban sentence and `bun scripts/restatement-sweep.mjs` passes
  its branch-rule corpus row.

## Impact

Cut at plan time. Every surface this fix reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `docs/workflow/REPOSITORY_STATE.md` | S1: `covers-through`, dated decisions, the fossil rows re-frozen | `WORKFLOW_INVARIANTS.md` step 2, `discover-`/`resolve-repository-state`, every architecture-touching session |
| `docs/workflow/WORKFLOW_INVARIANTS.md` | S1: step 2 becomes the freshness-checked order; B5: the AI-001 template becomes a link | the evaluation protocol every architecture change follows |
| `docs/architecture/ARCHITECTURAL_INVARIANTS.md` | S2-B5: the one home of the AI-001 template | the same protocol, the `vocabulary-residency` law |
| `docs/workflow/README.md`, `SKILLS.md`, `FEATURE_WORKFLOW.md` | S2-B1..B4, S3: copies become pointers; the Notion sentence goes (S3a) | the tutorial's readers, `workflow-docs-index` |
| `AGENTS.md` | S2-B6/B7 (layout, header), S4 (map row + machine-region order), S6a (carve-out) | every session; five budgets |
| `skills/unit-lane/references/TESTS.md` | S6-D1: two copies collapse to one pointer | the tests step, the lane's checklist |
| `skills/execute-phase/SKILL.md`, `references/EXECUTION_CONTRACT.md` | S6-D1/D4: the exception decision, the default branch, the force-push scope | every executor run |
| `skills/unit-lane/references/ORCHESTRATE.md` | S6-D2: the weaker-than-author rule's one home | the pass-model routing every dispatched pass follows |
| `skills/execute-phase`, `batch-scheduler`, `unit-lane`, `resolve-`, `discover-repository-state` | S6-D3: five bare no-slash sections become citations | agents without a slash menu |
| `skills/unit-lane/references/RELEASE.md`, `RELAY.md`, `DOCS.md`, `skills/review-change/SKILL.md` | S6-D4/D5/minors | the release step, the relay packet, the docs step, the review route |
| `skills/resolve-repository-state/references/STATE_CONTRACT.md` (new) | S1: the snapshot's machine contract and the staleness rule | both repository-state skills, the new reader |
| `skills/audit-docs/references/RESTATEMENT.md` (new) | S3b: the corpus and the probe set | `audit-docs`, `product-audit`, the sweep |
| `scripts/repository-state.mjs` (new), `scripts/restatement-sweep.mjs` (new), `scripts/reading-coverage.mjs` (new) | S1, S3b, S5: the deterministic readers | the root suite, the gate, `audit-docs` |
| `docs/workflow/LOADING.md` (new) | S4: the ladder, the balance rule, the ordering guidance | the documentation map, every authoring session |
| `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | every prose change: the ceilings re-measured and the sources recorded | `check-skill-context.mjs` |

## Surfaces

- `docs`
- `skills`
- `scripts`
- `template`
- `.github`

## Retirements

No surface is retired: this is a **strictly additive** unit plus prose
conversions, so the answer is the computed inventory rather than a removal
record. The added surfaces are the three scripts with their suites (consumed by
the root suite and the gate), the two references with their readers, and the
loading page with its index row; each carries its consumer in `## Impact`. The
inventory receipt is `bun scripts/residual-classify.mjs --inventory --base origin/main`
in `## Log` `E2`; no row lands `orphan` — a script the root suite runs and a
reference a skill cites are both consumers the classifier resolves from the
diff, and any row it cannot resolve is answered by a `residual-promise@1` row in
`decisions.md` rather than by a silent claim.

## Non-goals

- **AGENTS.md reduction** — #645 landed it (2026-11-19, PR #652); this unit only
  amends the map, the layout entry, the header sentence, the one carve-out
  sentence and the machine region's order, and every ceiling is re-measured.
- **Vocabulary movement / residency enforcement** — #643 landed it; the new
  grammars here are block-local receipts, declared `machine: n/a` exactly as
  `test-impact-verdict` is, and no published closed vocabulary is duplicated.
- **needs-input routing and the substrate alarm** — #644's; the freshness rule
  is referenced from that family, never restated.
- **Frozen history** — `docs/features/*`, `docs/fix/*` (other units) and
  `docs/LOGS.md` are never edited for currency.
- **A content decision that changes workflow semantics** — this unit re-points
  and orders; the one semantic decision it takes (S6a's carve-out) is the
  owner's, recorded as a `D` line, and never inferred.

## Risk tier

Verdict computed at the cut with `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify`:

- **Tier** — `standard` · **Task Size** — understood + contained + resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit.

```text
risk-tier-verdict@1
tier | passive | standard | high
passive | documentation, images, comments, prose with no executable effect | the deterministic gate is the whole verification
standard | the ceremony this document describes | this doc + the ledgers + the gate
high | this doc + the named high-risk item from the verdict's signals[] | + the full review pass
```

The cut-time verdict was `empty-change` (`the change names no path, so nothing
proves it inert — fail closed upward`); the handoff re-runs it against the
real diff and records that verdict beside this one.

## Future

none — the issue's own out-of-scope section already deferred #645/#643/#644,
and each is merged, so nothing is left deferred from this unit.

## Future cost

| Rule | Who it binds |
|---|---|
| A snapshot whose `covers-through` predates a recorded owner decision is `stale`: a unit that reverses or supersedes an accepted decision re-freezes the snapshot as its recorded close step | every unit that reverses a decision; `resolve-repository-state` |
| A restatement of a rule in the corpus must carry its owner pointer, and a "cited, never restated" claim must survive its probe | every doc and skill edit; `audit-docs` and `product-audit` run the sweep |
| A volatile machine region sits after the stable prose in an always-loaded file | every addition to `AGENTS.md` and to any always-loaded guide |
| A rule with one home is cited, never re-worded, in a second place | every author and reviewer of docs and skills |

## Applicable tests

- `bun test scripts/repository-state.test.mjs` — the freshness reader and its
  frozen-failure corpus.
- `bun test scripts/restatement-sweep.test.mjs` — the detector, its fixtures and
  the live tree.
- `bun test scripts/reading-coverage.test.mjs` — the full-read ledger's coverage.
- `bun test scripts/normative-drift.test.mjs` — the two new normative surfaces
  and the `count:packages` rendered fact.
- `bun test scripts/prose-gate-inventory.test.mjs` — the two new gate rows.
- `bun test scripts/check-skill-context.test.mjs` — the budgets over the
  changed docs and skills.
- `node scripts/run-root-suite.mjs` and `bun scripts/local-gate.mjs` — the
  whole gate at the handoff.

## Known pre-existing issues

- `scripts/worktree-guard.test.mjs` reports a repository-state finding for this
  checkout's sibling worktrees (`.worktrees/feat-651-doc-retention`,
  `feat-654-guard-layer` are other live sessions' checkouts, not this unit's):
  **does-not-affect** this unit — it is report-only and it names other sessions'
  work, never this change.
- `docs/ROADMAP.md:198`'s `Unit doc:` cell points at
  `features/646-docs-skills-reconciliation/SPEC.md`, a path that never existed:
  **affects** this unit (S2's index-currency class). The cell is owner-managed
  for a fix row (`docs/ROADMAP.md`'s `## Fixes` writer keys the row), so the
  correct path is recorded in the row through the writer at the release step or
  reported to the owner — never hand-edited.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s `documents.sources` carries a
  43-line re-pin history whose entries name merges, not measurements; #632
  pruned its duplicates. **does-not-affect** this unit beyond appending one
  source row per re-pin.

## Tasks

P1…P10, dependency-topological, smallest within a ready set.

- P1 — Cut this unit doc with its two frozen planning ledgers (validator: `bun test scripts/pre-execution-quality.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
  - Relevant files: docs/fix/646-docs-skills-reconciliation/SPEC.md, docs/fix/646-docs-skills-reconciliation/planning-evidence.md, docs/fix/646-docs-skills-reconciliation/planning-obligations.md, docs/fix/646-docs-skills-reconciliation/decisions.md
- P2 — RED: commit `scripts/repository-state.test.mjs` alone, observed failing (validator: `bun test scripts/repository-state.test.mjs` exits 1 with the module absent)
  (Implements: S1)
  - Relevant files: scripts/repository-state.test.mjs
- P3 — GREEN: `scripts/repository-state.mjs`, the `repository-state@1` contract reference, both repository-state skills' citations, the normative-surface row, the gate-inventory row and the re-measured budgets (validator: `bun test scripts/repository-state.test.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`)
  (Implements: S1)
  - Relevant files: scripts/repository-state.mjs, skills/resolve-repository-state/references/STATE_CONTRACT.md, skills/resolve-repository-state/SKILL.md, skills/discover-repository-state/SKILL.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P4 — Re-freeze `docs/workflow/REPOSITORY_STATE.md` against the current tree and amend the invariant protocol's step 2 (validator: `bun scripts/repository-state.mjs docs/workflow/REPOSITORY_STATE.md` prints `verdict: fresh` and exits 0)
  (Implements: S1)
  - Relevant files: docs/workflow/REPOSITORY_STATE.md, docs/workflow/WORKFLOW_INVARIANTS.md
- P5 — Reconcile the docs/ duplicates (B1–B7, A2) to owner pointers, delete the two Notion citations, and pin the count-class restatement to the machine (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S2, S3a)
  - Relevant files: docs/workflow/README.md, docs/workflow/SKILLS.md, docs/workflow/FEATURE_WORKFLOW.md, docs/workflow/WORKFLOW_INVARIANTS.md, docs/architecture/ARCHITECTURAL_INVARIANTS.md, docs/design/REDESIGN.md, AGENTS.md, scripts/normative-drift.test.mjs
- P6 — Reconcile the skills D-table (D1–D6, minors) to owner pointers and record the two owner decisions their copies raised (validator: `bun scripts/skill-lint.mjs` exits 0 and `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S6, S6a, S6b)
  - Relevant files: skills/unit-lane/references/TESTS.md, skills/unit-lane/references/ORCHESTRATE.md, skills/unit-lane/references/RELEASE.md, skills/unit-lane/references/RELAY.md, skills/unit-lane/references/DOCS.md, skills/execute-phase/SKILL.md, skills/execute-phase/references/EXECUTION_CONTRACT.md, skills/review-change/SKILL.md, skills/batch-scheduler/SKILL.md, skills/unit-lane/SKILL.md, skills/resolve-repository-state/SKILL.md, skills/discover-repository-state/SKILL.md, AGENTS.md
- P7 — RED: commit `scripts/restatement-sweep.test.mjs` alone, observed failing (validator: `bun test scripts/restatement-sweep.test.mjs` exits 1 with the module absent)
  (Implements: S3b)
  - Relevant files: scripts/restatement-sweep.test.mjs
- P8 — GREEN: `scripts/restatement-sweep.mjs`, the corpus reference, the `audit-docs` check, the product-audit dimension, the normative-surface and gate rows (validator: `bun scripts/restatement-sweep.mjs` prints `verdict: PASS` and `bun test scripts/restatement-sweep.test.mjs` exits 0)
  (Implements: S3b)
  - Relevant files: scripts/restatement-sweep.mjs, skills/audit-docs/references/RESTATEMENT.md, skills/audit-docs/SKILL.md, skills/product-audit/references/AUDIT_DIMENSIONS.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P9 — S4: the loading ladder, the guide's machine-region order, the map row and the before/after measurement (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and `rg -c 'loading-ladder@1' docs/workflow/LOADING.md` matches 1)
  (Implements: S4)
  - Relevant files: docs/workflow/LOADING.md, docs/workflow/README.md, AGENTS.md
- P10 — S5/S5a: the full read with its evidence, the removal list and the coverage reader (validator: `bun scripts/reading-coverage.mjs --scope docs-skills` prints `verdict: covered` and exits 0)
  (Implements: S3, S5, S5a)
  - Relevant files: docs/fix/646-docs-skills-reconciliation/second-read.md, scripts/reading-coverage.mjs, scripts/reading-coverage.test.mjs
- P11 — Close the unit: evidence rows, obligations, budgets, changeset, journal fragment and the declared gates (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S3a, S3b, S4, S5, S5a, S6, S6a, S6b)
  - Relevant files: docs/fix/646-docs-skills-reconciliation/SPEC.md, .changeset/646-docs-skills-reconciliation.md, .agentic-workflow/journal/

### Planning evidence

The M/L carrier: [`planning-evidence.md`](planning-evidence.md). This unit is
`scope: large`, so the ledger is the separate file and this section only names it.

### Obligations

The M/L carrier: [`planning-obligations.md`](planning-obligations.md). Every row
is `verified` at the handoff, each naming the `E`/`G` line that closed it; no row
is deferred and none is a silent `n/a`.

## Triaged steps

n/a — the owner's local workflow substitutes the lane's plan step (§5 of the
run instruction): this unit's step list is `## Tasks` above, and no
`runner unit-route --triage` was run. Recorded rather than pasted, so the
section is a stated substitution instead of a forged machine block.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` quotes the run instruction verbatim; the issue's own text is
`L2` by reference (it is ~4,000 words and mutation-free in the forge).

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-20, the run instruction, verbatim:
  ```
  Apply to this repository: issue #646
  ```
  plus the correction: `Ha habido un merge nuevo que está en origin/main, añadelo y revisa por si tienes que replanificar`.
- **L2** — the issue: [#646](https://github.com/gtrabanco/agentic-workflow/issues/646) —
  `NEW FEATURE: docs + skills reconciliation — REPOSITORY_STATE freshness contract, unowned-duplicate removal, synthesis pass, cache-aware progressive loading, second full read`, including `## Amendment 2`. Quoted per requirement in `## Specs`; the body is not re-pasted because it is unedited in the forge.
- **D1** — owner decision (`#646` `## Non-goals`): the product-vs-dogfooding boundary holds — this unit edits `docs/**`, `skills/**`, `template/`, `scripts/` and the guide's map/layout/carve-out lines only; AGENTS.md reduction stays #645's.
- **D2** — owner decision (`#646` A2, 2026-11-19): the Notion mirror is retired; both citations are deleted.
- **D3** — design decision (this unit, PE-006): the AI-001 template's one home is `docs/architecture/ARCHITECTURAL_INVARIANTS.md` — the project-domain doc the workflow protocol points at; `WORKFLOW_INVARIANTS.md` links to it. Reason: the template is a *project* artifact, and #645's two-tier decision keeps the workflow doc as the portable contract.
- **D4** — design decision (PE-004): the weaker-than-author rule's one home is `skills/unit-lane/references/ORCHESTRATE.md` § The delegate brief — the pass-model resolution every dispatched pass consumes; RELAY's strong-tier addendum stays as that file's declared elaboration with the owner pointer.
- **P1** — 2026-11-20, cut the unit doc and both planning ledgers (this commit).
- **P2** — 2026-11-20, integrated `origin/main` before the cut: `git merge --ff-only origin/main` took 28 commits (unit 632 model-aware phase batching, the W47 journal aggregation). Replan check recorded: no S2/S6 target moved (632 touched `docs/workflow/CONFIG.md`, `GATE_INVENTORY.md`, the budgets and `packages/`), two baselines were re-read (AGENTS.md 631 lines / 194 machine; `GATE_INVENTORY.md` 183 / 88), the snapshot's facts were re-measured post-merge, and S4 gained a citation obligation: `phase-batching@1`'s `PHASE_BATCHING_CACHE_POSTURES` owns *model* cache posture, so the loading ladder cites it instead of defining a second notion.

- **D5** — design decision (S6 D1, the red-first *"UI/adapter glue may test after"* exception): **dropped**. The owner surface (`AGENTS.md` § Working rules) states the obligation with no carve-out, and `TEST_IMPACT.md` states the mechanism; an exception that survives only in a restatement copy is the defect S6 names, and adopting it would add a semantic carve-out to a law with no measured need — the guide already answers the real case with a recorded `empty` test-impact verdict. The clause is deleted from `execute-phase`, and no owner surface gains it.
- **D6** — owner decision recorded in a rule's own text (S6a): the stack-agnostic rule scopes to the **target project's** stack; a host agent's name is sanctioned where a portability or adapter feature requires it, and never as a technology recommendation. The carve-out lives in `AGENTS.md` § Working rules, and `second-read.md` classifies every host name the tree carries against it.

- **D7** — design decision (S3b, the detector): the seed set is a **declared corpus**, not a heuristic — each row names the rule, its one owner, the identifying phrase, the scopes, the declared exceptions and the claimant — and the sweep reads it, so a rule enters by editing a table instead of by editing a script. A claim of "never restated" is measured by the same run, and a rule whose phrase matches nothing is reported as a dead seed instead of passing quietly.
- **P3/P4** — 2026-11-20, `8208c4018`: the reader, the `repository-state@1` contract, the re-frozen snapshot, the amended invariant protocol and the registration (normative surface, gate row, budgets). The two tasks landed in one commit because the frozen acceptance couples them: the suite's live-tree case cannot pass before the snapshot is re-frozen, so splitting them would have committed a red implementation. **E3**–**E7** below are its receipts.
- **P5** — 2026-11-20, `6ecb20d41`: the docs/ conversions (B1–B7, A2), the two mirror citations (S3a) and the `count:packages` claim kind with its case.
- **P6** — 2026-11-20, `d161e9d2a`: the skills D-table, the two owner decisions it raised (`D5`, `D6`) and the vacation of the five bare portability sections. **E8**–**E9** are its receipts.
- **P7/P8** — 2026-11-20, suite `0c05e889d` red then `297643f11` green: the corpus, the sweep, the `audit-docs` check 18 and the `product-audit` dimension. **E10**, **E11**.
- **P9** — 2026-11-20, `6a7d50d2e`: `docs/workflow/LOADING.md`, the map row and the guide's machine regions moved last. The measurement is `docs/fix/646-docs-skills-reconciliation/second-read.md` § Measurements.
- **P10** — 2026-11-20, suite `dc0d21cae` red then `6f816372b` green: the second read, its ledger and `scripts/reading-coverage.mjs`. **E12**, **E13**.
- **P11** — 2026-11-20, `f455bc425` and the state commit: the projection re-emitted, the changeset, the journal fragment, the ledgers closed and the gate. **E14**–**G2**.

- **E1** — 2026-11-20, `bun test scripts/repository-state.test.mjs` at `24c664234` · exit 1 · `0 pass · 1 fail` — `Cannot find module './repository-state.mjs'` (the red commit).
- **E2** — 2026-11-20, `bun scripts/repository-state.mjs` · exit 0 · `repository-state — 2026-11-20-reconciliation-refreeze · covers-through 2026-11-20 · 13 facts · 9 decisions` / `verdict: fresh`.
- **E3** — 2026-11-20, `bun test scripts/repository-state.test.mjs` · exit 0 · 9 pass, 0 fail — `F-646-1`…`F-646-6` plus the contract-parity and live-snapshot cases.
- **E4** — 2026-11-20, `bun scripts/repository-state.mjs --ttl-days 30 --today 2027-06-01 docs/workflow/REPOSITORY_STATE.md` · exit 1 · `verdict: stale` with `REASON expired — … is 193 days old (ttl 30)` — expiry is computed, not assumed.
- **E5** — 2026-11-20, `bun test scripts/normative-drift.test.mjs` · exit 0 · 23 pass (22 at `8fc204abb`; the new case is the `count:packages` refusal).
- **E6** — 2026-11-20, `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS` — both new gate rows and the two new surface ids resolve.
- **E7** — 2026-11-20, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 6 budgeted documents`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 30 skills`; `--routes` · exit 0 · `PASS route budgets: 14 routes`.
- **E8** — 2026-11-20, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 0 file(s)` — `verdict: PASS` after every skills edit.
- **E9** — 2026-11-20, `bun test scripts/guide-split.test.mjs` 17 pass, `bun test scripts/residue-dimensions.test.mjs` 30 pass, `bun test scripts/inviolable-rules.test.mjs` 18 pass, `bun scripts/inviolable-rules.mjs` → `PASS inviolable rules: 14 rows · 1 home`.
- **E10** — 2026-11-20, `bun test scripts/restatement-sweep.test.mjs` at `0c05e889d` · exit 1 · `0 pass · 1 fail` (missing module), then at `297643f11` · exit 0 · 9 pass.
- **E11** — 2026-11-20, `bun scripts/restatement-sweep.mjs` · exit 0 · `6 rule(s) · 12 file(s) matched · 0 finding(s)` / `verdict: PASS`; the same command on the pre-fix bytes is `F-646-7`/`F-646-9` in the suite.
- **E12** — 2026-11-20, `bun test scripts/reading-coverage.test.mjs` at `dc0d21cae` · exit 1 · `0 pass · 1 fail` (missing module), then at `6f816372b` · exit 0 · 6 pass.
- **E13** — 2026-11-20, `bun scripts/reading-coverage.mjs --scope docs-skills` · exit 0 · `234 in scope · 40 full · 199 scanned · 0 finding(s)` / `verdict: covered`.
- **E14** — 2026-11-20, the differential run against `git archive 8fc204abb`: `bun test scripts/normative-drift.test.mjs` 22 pass at base (23 at head — the added case is this unit's), `bun scripts/check-skill-context.mjs --documents` PASS at both, `bun scripts/skill-lint.mjs` PASS at both, `bun scripts/prose-gate-inventory.mjs` PASS at both; the touched skills' estimates moved by the pointer sentences recorded in the manifest's `mainSources`. No unasked difference.
- **E15** — 2026-11-20, `bun scripts/version-parity-gate.mjs --content --base origin/main` · exit 0 · `VERDICT: PASS` (the changeset route); `bun scripts/lint-changeset.mjs` · exit 0 · `ok 646-docs-skills-reconciliation.md`.
- **E16** — 2026-11-20, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 checked · 0 missing · 0 stale` / `verdict: PASS`.
- **E17** — 2026-11-20, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` · exit 0 · `{"ok":true,"checked":1,"refusals":[]}`; `bun scripts/log-immutability.mjs` · exit 0 · `0 violations · base 8fc204abb · range 11 commits`.
- **E18** — 2026-11-20, `bun scripts/promise-coherence.mjs` · exit 0 · `claims: 45 checked · 24 skipped` / `verdict: PASS`.
- **G1** — HEAD `f455bc4250405c4e884c1322906509596ec0947d`, 2026-11-20, `bun scripts/local-gate.mjs --jobs 4 --skip-network` · exit 0 · `local-gate: PASS — 15 step(s) in 783s`.
- **G2** — HEAD `f455bc4250405c4e884c1322906509596ec0947d`, 2026-11-20, `bun scripts/local-gate.mjs --only pi-compat-guard,dependency-pin-gate,dependency-advisories --jobs 2` · exit 0 · `local-gate: PASS — 3 step(s) in 51s`.

## Next

P2: commit `scripts/repository-state.test.mjs` alone and observe it red.

## References

- Issue [#646](https://github.com/gtrabanco/agentic-workflow/issues/646) — `Closes #646`.
- [Second full read](second-read.md) — the S5/S5a findings, the removal list and the measurements.
- [Decisions](decisions.md) — the path-protection records and residual promises.
- `docs/workflow/GATE_INVENTORY.md` — the two new gate rows this unit claims.
- Landing order: #645 (merged, PR #652), #643 (merged, PR #648), #644 (merged), then this unit.

## Branch

`fix/646-docs-skills-reconciliation`

## Depends on

none — the three soft relations (#645, #643, #644) are merged, so no blocker is open.

## Regression scope

| Scenario | Verified by |
|---|---|
| The snapshot reader is not consumed by anything else, so no existing consumer changes behaviour | `bun test scripts/normative-drift.test.mjs` and `bun test scripts/prose-gate-inventory.test.mjs` stay green |
| The docs the B-table converts keep every rule they stated, as a pointer | `bun scripts/restatement-sweep.mjs` prints `verdict: PASS` and the audit-docs check list still resolves |
| The skills' executor-path wording keeps its meaning (the golden-fixture protocol's deterministic half) | `bun scripts/golden-fixture.test.mjs` exits 0 |
| Every budgeted document still passes after the conversions | `bun scripts/check-skill-context.mjs --documents` and `bun scripts/check-skill-context.mjs` exit 0 |
| The whole root suite keeps its pre-existing green | `node scripts/run-root-suite.mjs` exits 0 |
