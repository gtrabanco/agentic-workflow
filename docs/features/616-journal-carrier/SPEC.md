---
type: feature
scope: medium
roadmap_summary: Issue [#616](https://github.com/gtrabanco/agentic-workflow/issues/616) (M): the session journal becomes a deterministic corpus carrier — `journal-corpus@1` reads `docs/LOGS.md` and the `.agentic-workflow/journal/` fragments for correction classes, rework per unit and admitted false positives, cross-joined to the findings corpus — plus one pass-only-if `Journal signals` dimension consuming that receipt. Unit doc: [features/616-journal-carrier](features/616-journal-carrier/SPEC.md)
---

# 616 — journal-carrier

> One-line: give product-audit the log-driven surface it never had — the session
> journal read as one deterministic corpus (corrections per class, sessions per
> unit, admitted false positives) cross-joined to the findings corpus, with one
> pass-only-if dimension that consumes the receipt and judges only the
> non-mechanizable remainder.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Apply issue 616 in this repository.**
> Apply to this repository: issue #616

**S2 — The journal carrier.**
> - **Journal carrier**: extend the corpus's carrier set (or a sibling script with its own red-first suite, same pair rules as every `scripts/*.mjs`) to parse `docs/LOGS.md` entries and the `.agentic-workflow/journal/` fragments, emitting at least these deterministic signals with `file:line` provenance and per-row byte digests (same contract as `findings-corpus@1`):
>   - **corrections count per class** — parsed from the journal's `Correction:` / correcting-line blocks;
>   - **sessions per unit** — the re-work/thrashing signal (what the structural-detector literature calls analysis paralysis; threshold judgment stays model-side);
>   - **admitted false positives** — self-refuted or concurrently-discarded findings reviewers already admitted, cross-joinable against the existing corpus rows.

**S3 — The product-audit dimension.**
> - **Product-audit dimension**: one `AUDIT_DIMENSIONS.md` row consuming that receipt receipt-quoted (the #440 pre-pass pattern), the model sweeping only the non-mechanizable remainder (e.g. judging *why* a unit needed 20 sessions). The parser decides nothing — it derives; the dimension judges.

**S4 — Phase attribution for journal classes.**
> - **Phase attribution for journal classes**, reusing the corpus's existing `axis → phase` map so a recurring journal class proposes the same `GATE_INVENTORY.md` route the corpus classes do.

**S5 — Evolution-regression coverage.**
> - **Evolution-regression coverage**: the new dimension joins `scripts/dimension-regression.mjs`'s frozen set so it cannot silently disappear.

**S6 — The dedup contract.**
> - **Dedup contract**: journal-derived findings that duplicate an existing corpus row cluster into one finding (the audit's existing dedup rule), citing both carriers.

**S7 — The boundary: derived aggregates only.**
> - **LLM-judging whole session traces / transcripts** — impractical at deployment (arXiv 2509.02360) and below the accuracy floor the literature reports (TRAIL, Who&When). The journal's *derived aggregates* only.
> - **OpenTelemetry / exporter / external observability infrastructure** — this product is a skills+crate repo, not a service; per-session cost already ships via the `tier-cost@2` telemetry ledger (#383/#504). No new telemetry pipeline.
> - **Mining logs inside `review-change`** — its scope is one diff; the repo-wide hunt stays product-audit's exclusive surface (the existing relationship table in `SKILL.md`). The carrier is shared; the consumers are not.
> - **Editing how the journal is written** — the fragment pattern, the append-only rule and the aggregator are #405's; this issue is read-only over them.
> - **Automatic fixes or issue opening from journal signals** — unchanged: the audit proposes; the user decides.

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S1) | the unit doc, both planning ledgers and the roadmap row exist in the repo's own shapes, and the doc is accepted by the unit-doc contract | `bun test scripts/unit-doc-contract.test.mjs` exits 0 and `bun test scripts/dimension-regression.test.mjs` exits 0 |
| AC-2 (S2) | one deterministic reader emits the `journal-corpus@1` receipt over `docs/LOGS.md` and `.agentic-workflow/journal/`, every row carrying `file:line` provenance and a 12-hex digest of its own line bytes; an absent carrier is named, never guessed | `bun test scripts/journal-corpus.test.mjs` exits 0 (the provenance, digest and absent-carrier cases) |
| AC-3 (S2) | the receipt carries exactly three signal kinds — `corrections` per class, `sessions` per unit, `false-positive` per admitted row — and no severity, no route and no threshold judgement | `bun test scripts/journal-corpus.test.mjs` exits 0 (the signal-shape and closed-vocabulary cases) |
| AC-4 (S2) | a correction's class is the corpus row it resolves (`axis×klass`); a correction that resolves to no row is `unjoined`, counted and listed — never bucketed into a guessed class | `bun test scripts/journal-corpus.test.mjs` exits 0 (the class-join and unjoined cases) |
| AC-5 (S2) | the reader parses both entry renderers it must read — the narrative block and the mechanical `log render` block — so the writer and the audit cannot disagree about the heading shape | `bun test scripts/journal-corpus.test.mjs` exits 0 (the renderer-parity case) |
| AC-6 (S2) | required failure state: neither carrier present is the `insufficient-input` verdict (exit 1), never a vacuous clean | `bun test scripts/journal-corpus.test.mjs` exits 0 (the no-carrier case) |
| AC-7 (S3) | `AUDIT_DIMENSIONS.md` carries the `Journal signals` row with its producer, and one pass-only-if section stating that the receipt is consumed never re-derived and that the model sweeps only the non-mechanizable remainder | `bun test scripts/journal-corpus.test.mjs` exits 0 (the prose-pin cases) |
| AC-8 (S3) | `AUDIT_PROCESS.md` names `bun scripts/journal-corpus.mjs` beside the other producers it runs in the pre-pass | `bun test scripts/journal-corpus.test.mjs` exits 0 (the process-pin case) |
| AC-9 (S4) | a recurring joined class gets the corpus's own phase and the corpus's own `GATE_INVENTORY.md` destination, imported from `findings-corpus.mjs`; an axis the map does not know reads `phase unmapped · propose none` | `bun test scripts/journal-corpus.test.mjs` exits 0 (the attribution cases) and `rg -c 'from "\./findings-corpus\.mjs"' scripts/journal-corpus.mjs` matches 1 |
| AC-10 (S5) | `Journal signals` is in the evolution gate's frozen dimension set, so a later change cannot drop it without a red | `bun test scripts/dimension-regression.test.mjs` exits 0 (the live-tree frozen set) |
| AC-11 (S6) | every journal row carries the publication it joins, and the receipt states the join cardinality (rows, corpus rows, clusters, unjoined) the audit's dedup rule rests on | `bun test scripts/journal-corpus.test.mjs` exits 0 (the dedup-cardinality case) |
| AC-12 (S7) | the reader reads and derives only: it writes nothing, calls no network and never edits the journal, the fragments or the corpus; no log content is model-judged by the change | `rg -c 'writeFileSync|appendFileSync|mkdirSync' scripts/journal-corpus.mjs` matches 0 and `bun test scripts/journal-corpus.test.mjs` exits 0 (the read-only case) |
| AC-13 (S2) | the seeded fixture yields exactly one signal per class and its clean twin yields zero, so the pass-only-if contract is demonstrated on a throwaway tree | `bun scripts/product-audit-journal-fixture.mjs <dir>` exits 0 and `bun test scripts/journal-corpus.test.mjs` exits 0 (the seeded/clean cases) |
| AC-14 (S3) | the new receipt grammar is registered in `normative-surfaces@1`, claimed by a gate-inventory row, and resolves from committed source; both documents stay inside their declared budgets | `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0 |
| AC-15 (S1) | the root suites pass and the release intent ships | `bun scripts/run-root-suite.mjs` exits 0 and `bun scripts/lint-changeset.mjs .changeset/616-journal-carrier.md` exits 0 |

## Impact

- **New deterministic producer**: `scripts/journal-corpus.mjs` + its sibling
  suite. It imports `buildCorpus`/`phaseOfAxis`/`PHASE_DESTINATION` from
  `scripts/findings-corpus.mjs` and the fence-aware primitives from
  `packages/agentic-workflow/src/runner/unit-doc-phases.mjs`, so the corpus has
  one parser and the document reader has one fence owner. `PHASE_DESTINATION`
  gains an `export` (no behaviour change) so the two readers share one map
  instead of holding two copies.
- **Changed skill surfaces**: `skills/product-audit/references/AUDIT_DIMENSIONS.md`
  (one applicability row, one pass-only-if section, the `journal-corpus@1`
  grammar block) and `references/AUDIT_PROCESS.md` (the producer named in the
  pre-pass step). Both ride the reference budget declared in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`.
- **Guide layer**: one `normative-surfaces@1` row (`journal-corpus-grammar`) and
  its claim in `docs/workflow/GATE_INVENTORY.md`; the guide's `linesMax`,
  `machineLines`, `estimateMax` and the inventory's `machineLines`/`estimateMax`
  are re-pinned to the measured tree.
- **A protected-path addition**: `scripts/dimension-regression.test.mjs`'s
  `FROZEN` set gains `Journal signals`. That is the gate's documented contract
  ("adding a dimension means extending it here in the same change"), not a
  relaxation — the row is recorded in `decisions.md`.
- **Consumed from other units**: #437's corpus rows and its `axis → phase` map,
  #405's fragment carrier and `journal-fragment-grammar@1`, #394's mechanical
  entry renderer, #590's evolution gate and dimension table, #595's dimension
  set.
- **What stops being true**: the claim, verified in issue #616's own context
  block, that the session journal "is read by **nothing**: no corpus carrier, no
  audit dimension, no gate". After this unit each of those three reads it.
- **Ask before touching**: the journal's write side (`journal-fragment-grammar@1`,
  the aggregator, the two renderers) is read-only here; the corpus's admission
  rules and its `axis → phase` map are consumed, never redefined.

## Surfaces

- `scripts`
- `skills/product-audit`
- `docs`

## Retirements

Strictly additive: nothing is retired. Every surface this unit adds names its
consumer, so the residual classifier reads `andamio` with a live consumer rather
than an orphan.

| Added surface | Named consumer |
|---|---|
| `scripts/journal-corpus.mjs` (`journal-corpus@1`) | `skills/product-audit/references/AUDIT_DIMENSIONS.md` § Journal-signal sweep; `scripts/journal-corpus.test.mjs` |
| `scripts/product-audit-journal-fixture.mjs` | the same reference's pass-only-if contract; `scripts/journal-corpus.test.mjs` |
| `Journal signals` (dimension row) | product-audit's progressive loading; `scripts/dimension-regression.test.mjs`'s frozen set |
| `journal-corpus-grammar` (block) | `AGENTS.md#normative-surfaces@1`; `docs/workflow/GATE_INVENTORY.md` `normative-surface-grammar` row |

## Non-goals

- No new standalone review skill and no change to `review-change`: the carrier is
  shared, the consumers are not (S7).
- No telemetry pipeline, no exporter, no transcript ingestion (S7).
- No edit to how the journal is written — no new fragment kind, no second
  renderer, no aggregator change (S7).
- No automatic repair or issue opening: the audit proposes, the owner decides.
- Findings discovered during implementation never expand scope.

## Risk tier

- **Tier** — `standard` · **Task Size** — `unit-doc`
- **Named high-risk item** — `none — not a high-tier unit` (computed by
  `agentic-workflow ceremony tier classify --paths scripts/journal-corpus.mjs
  scripts/journal-corpus.test.mjs` → `tier: "standard"`,
  `reason_kind: "executable-content"`, `signals: []`; the verdict verbatim is in
  the `## Log` D2 line).

## Future

None deferred. The issue's out-of-scope list is scope, not deferred work, and no
row here is offered at close.

## Future cost

- **A new review dimension must extend the frozen set**: `scripts/dimension-regression.test.mjs`
  carries the expected dimension ids, so adding one means touching that constant
  in the same change.
- **A new signal kind is a contract change**: `SIGNAL_KINDS` is closed in
  `scripts/journal-corpus.mjs` and the `journal-corpus@1` block declares it, so a
  fourth signal moves the script, the reference and this suite together.
- **A journal whose heading shape changes must change one reader**: the parity
  case pins the reader against `renderEntryBlock` (narrative) and `renderEntry`
  (mechanical), so a renderer change reddens the journal carrier before an audit
  reads a silently different journal.

## Applicable tests

- `bun test scripts/journal-corpus.test.mjs` — the reader, the join, the three
  signals, the attribution, the dedup cardinality, determinism, the absent
  carriers, the seeded/clean fixture and the prose pins.
- `bun test scripts/dimension-regression.test.mjs` — the frozen dimension set at
  the live tree plus the gate's existing vectors.
- `bun test scripts/normative-drift.test.mjs`, `bun scripts/prose-gate-inventory.mjs`,
  `bun scripts/check-skill-context.mjs --documents` — registration and budgets.
- `bun test scripts/structural-sibling-pins.test.mjs` — the heading-reader
  allowlist, which this reader joins with its reason.
- `bun scripts/run-root-suite.mjs` — the whole root suite at the handoff head.

## Known pre-existing issues

- **The aggregated journal carries two heading stamp shapes and one malformed
  heading** — `docs/LOGS.md` holds ISO stamps (`2026-11-09`, `2026-11-09T18:11Z`,
  a few with a `.035Z` millisecond tail), the fragment grammar's compact
  `20261107T133500Z`, 24 non-entry `## ` headings (`## What happened`,
  `## feat/65-doc-toolchain — manual`) and mechanical entries with no prose
  cells. **Does not affect** the design: the reader accepts every stamp shape the
  two renderers and the fragment grammar produce, skips a heading that carries no
  stamp, and reads correcting lines only — it never assumes a prose cell exists.
  **Affects** the counted baseline, which the receipt reports as measured rather
  than as the issue's prose figures (`feat/37` 43 entries) — the numbers differ
  because the issue's count is not this reader's rule.
- **Eleven of the journal's refutations name a finding the corpus cannot resolve**
  (a loose `planning-findings.md`, a unit outside `## Findings`). **Does not
  affect** correctness: they are reported `unjoined` with the reason. **Affects**
  the join coverage the dimension sees (16 of 27 resolve at this head).
- **`scripts/dimension-regression.test.mjs` is a protected path** and this unit
  adds one id to its frozen list. **Affects** the owner's approval: the row is
  recorded as a `justification` in `decisions.md` and named in the handoff; no
  assertion is relaxed, skipped or narrowed.

## Tasks

- P1 — Cut the unit doc, both planning ledgers, the decisions record and the roadmap row.
  (validator: `bun test scripts/unit-doc-contract.test.mjs` exits 0)
  (Implements: S1)
  - Relevant files: docs/features/616-journal-carrier/SPEC.md, docs/features/616-journal-carrier/planning-evidence.md, docs/features/616-journal-carrier/planning-obligations.md, docs/features/616-journal-carrier/decisions.md, docs/ROADMAP.md
- P2 — Land the carrier's suite alone, observed failing on the missing module and the missing fixture builder (the red commit).
  (validator: `bun test scripts/journal-corpus.test.mjs` exits 1, naming the missing `scripts/journal-corpus.mjs`)
  (Implements: S2, S3, S4, S6)
  - Relevant files: scripts/journal-corpus.test.mjs
- P3 — Implement the reader, the fixture builder and the shared phase-destination export; every carrier case green.
  (validator: `bun test scripts/journal-corpus.test.mjs` exits 0)
  (Implements: S2, S4, S6, S7)
  - Relevant files: scripts/journal-corpus.mjs, scripts/product-audit-journal-fixture.mjs, scripts/findings-corpus.mjs, scripts/structural-sibling-pins.mjs
- P4 — Write the dimension and its consuming step; register the block grammar; claim it in the gate inventory; re-pin both budgets.
  (validator: `bun scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md, skills/product-audit/references/AUDIT_PROCESS.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P5 — Extend the evolution gate's frozen dimension set and re-run every dimension: the new row is present and the prior set is intact.
  (validator: `bun test scripts/dimension-regression.test.mjs` exits 0 and `bun scripts/dimension-regression.mjs --base origin/main` exits 0)
  (Implements: S5)
  - Relevant files: scripts/dimension-regression.test.mjs, scripts/dimension-regression.mjs
- P6 — Close the documentation and state: changeset, regenerated projection, settled roadmap row, the session entry as a journal fragment, every obligation verified.
  (validator: `bun scripts/lint-changeset.mjs .changeset/616-journal-carrier.md` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1)
  - Relevant files: .changeset/616-journal-carrier.md, docs/generated/, docs/ROADMAP.md, .agentic-workflow/journal/

The planning ledgers live beside this file, for a medium unit:
[planning-evidence.md](planning-evidence.md) and
[planning-obligations.md](planning-obligations.md).

## Triaged steps

Cut by hand, because the owner's local workflow replaces the lane's plan step
(no `runner unit-route --triage` ran on this unit); the step set below is what
the plan executes and the router's own vocabulary names it:

```text
TRIAGE — 616-journal-carrier (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the request, verbatim:

  ```
  Apply to this repository: issue #616
  ```

- **D1** — 2026-11-18, intent resolved from state, not from the words: no unit
  folder, no ledger and no commit for #616 existed, the worktree
  `.worktrees/feat-616-journal-carrier` sat on `main`'s tip with an empty diff,
  and the issue is `OPEN` with one `feature` label and no `blocked-by`
  relationship — so the intent is `continue`, starting at P1.
- **D2** — 2026-11-18, the risk tier is computed, not chosen:
  `agentic-workflow ceremony tier classify --paths scripts/journal-corpus.mjs
  scripts/journal-corpus.test.mjs skills/product-audit/references/AUDIT_DIMENSIONS.md`
  → `tier: "standard"`, `reason_kind: "executable-content"`, `signals: []`.
- **D3** — 2026-11-18, the class rule: a correction's class is the corpus row its
  own bytes resolve to (`axis×klass`, the corpus's `attribute` order), and a
  correction that resolves to nothing is `unjoined`, counted and listed. A
  lexical class taxonomy was rejected: it would attribute a class the journal
  never declared, which is exactly the guess `findings-corpus@1` refuses for an
  unknown axis (`phase unmapped`, never bucketed).
- **D4** — 2026-11-18, the heading-shape decision: no crate change. The reader
  owns its entry-heading walk (fence-aware through `unit-doc-phases.mjs`'s
  `openFence`/`closesFence`, and allowlisted in
  `scripts/structural-sibling-pins.mjs` with its reason), and a parity test pins
  it against both renderers — `block.mjs`'s narrative block and `log/render.mjs`'s
  mechanical entry — so the shape is compared rather than assumed.
- **D5** — 2026-11-18, a protected path: `scripts/dimension-regression.test.mjs`'s
  `FROZEN` set gains `Journal signals`, which is that gate's documented contract
  ("adding a dimension means extending it here in the same change"). It is an
  assertion addition, never a relaxation; the record lives in `decisions.md` and
  the owner approves it with the handoff, since no auto-approval authority exists.

- **E1** — 2026-11-18, the cut-time readings that fix the baseline, all foreground:
  `bun scripts/findings-corpus.mjs` · exit 0 · `units 240 · findings 1153 · admitted
  125 · repeat-classes 9`; `wc -l docs/LOGS.md` → 7644; the probe over the same
  bytes → 1059 stamped entries, 24 unstamped `## ` headings, 80 pending fragments
  (80 stamped entries), 3 bold `Correction` lines, 27 refutation lines naming a
  finding id of which 16 resolve onto a corpus row.
- **E2** — 2026-11-18, the pair's red and green, both foreground:
  `bun test scripts/journal-corpus.test.mjs` at the suite's own commit
  (`43c1aef5`) · exit 1 · `Cannot find module './journal-corpus.mjs'`; after the
  reader and the fixture builder land · exit 0 · 23 pass / 0 fail.
- **E3** — 2026-11-18, the live receipt: `bun scripts/journal-corpus.mjs` · exit 0
  · `log | docs/LOGS.md · entries 1059`, `fragments | .agentic-workflow/journal ·
  files 80`, `entries | 1139 · skipped headings 24`, `rows | 30 · corrections 3 ·
  refuted 27`, `join | rows 30 · corpus-rows 13 · clusters 3 · unjoined 14`,
  `verdict | signals 183`, in 0.81 s.
- **E4** — 2026-11-18, the pass-only-if twins:
  `bun scripts/product-audit-journal-fixture.mjs <scratch>` · exit 0 →
  `seeded/` yields exactly three signals (one correction class, one rework unit,
  one admitted false positive) and `clean/` yields `verdict | clean`; the suite's
  seeded/clean case is green over both.
- **E5** — 2026-11-18, the differential against the base tree (`main` = `2dda53fe`,
  read from a throwaway `git worktree add --detach` under `/tmp`): the two
  commands that share the changed code answer the same bytes at base and head —
  `bun scripts/coverage-gap.mjs --repo .` is byte-identical (exit 0 both sides);
  `bun scripts/findings-corpus.mjs` differs only in `units 240 -> 241` and
  `migrated-carriers 129 -> 130`, the arithmetic of this unit's own folder
  carrying a `## Findings` section. No stdout, stderr or exit delta nobody asked
  for.
- **E6** — 2026-11-18, the budgets and the registration, all foreground:
  `bun scripts/prose-gate-inventory.mjs` · `verdict: PASS` (the new
  `journal-corpus` row resolves its suite token and `journal-corpus-grammar` is
  claimed); `bun test scripts/normative-drift.test.mjs` · exit 0 · 21 pass /
  0 fail; `bun scripts/check-skill-context.mjs --documents` · exit 0 · `AGENTS.md
  729 / 169 / 560 / 13,188`, `GATE_INVENTORY.md 177 / 82 / 95 / 7,617`;
  `bun scripts/check-skill-context.mjs --skill product-audit` · exit 0 (6,239 est
  / 265 lines inside the re-based 6,863).
- **E7** — 2026-11-18, the two sweeps this change can redden, and they did:
  `bun test scripts/skill-lint.test.mjs` · exit 1 · `SL-04 unpinned-url
  skills/product-audit/references/AUDIT_DIMENSIONS.md:172` — the issue link was a
  URL where the reference's convention is a bare `#616`; repaired, re-run exit 0 ·
  20 pass / 0 fail. `bun test scripts/promise-coherence.test.mjs` · exit 1 ·
  `formula-mismatch ceil(6254 x 1.10)` narrated 6,879/6,881 where the exact
  arithmetic answers 6,880; the narration and the ceiling were corrected to the
  measured 6,239 → `ceil(6239 x 1.10) = 6863`, re-run exit 0 · 37 pass / 0 fail.
- **G1** — 2026-11-18, `bun test scripts/structural-sibling-pins.test.mjs` · exit 0 ·
  8 pass / 0 fail — the reader joined the heading-reader allowlist with its reason
  instead of silencing the pin.
- **G2** — 2026-11-18, `bun test scripts/dimension-regression.test.mjs` · exit 0 ·
  10 pass / 0 fail with `Journal signals` in the frozen set (18 dimensions at the
  live tree).
- **G3** — 2026-11-18, `bun scripts/dimension-regression.mjs --base main` · exit 1 ·
  `verdict | refused` with `missing-reverification-evidence` — the evolution gate
  biting on this very change before this Log carried the run. That is its designed
  failing vector on real data, not a repaired test.
- **G4** — 2026-11-18, `bun scripts/dimension-regression.mjs --base main` · exit 0 ·
  `verdict | clean` (18 dimensions head / 17 base, 5 review surfaces, evidence =
  this doc).

## Next

P2: land `scripts/journal-corpus.test.mjs` alone and observe it failing on the
missing `scripts/journal-corpus.mjs`.

## References

- Issue [#616](https://github.com/gtrabanco/agentic-workflow/issues/616) — the
  request this unit applies; the PR closes it via `Closes #616`.
- [#437](https://github.com/gtrabanco/agentic-workflow/issues/437) — the findings
  corpus this carrier extends (`findings-corpus@1`).
- [#405](https://github.com/gtrabanco/agentic-workflow/issues/405) — the fragment
  carrier this reader consumes and never edits.
- [#590](https://github.com/gtrabanco/agentic-workflow/issues/590) — the
  evolution-regression gate whose frozen set gains this dimension.
- [#595](https://github.com/gtrabanco/agentic-workflow/issues/595) — the
  precedent for a pass-only-if dimension section with its own grammar block.
