---
type: fix
scope: xs
roadmap_summary: Issue [#633](https://github.com/gtrabanco/agentic-workflow/issues/633) (S): session chaining and its cache economics recorded — one session runs the lane and the executor, no model switch mid-unit (a switch is a full re-prefill), the 5-minute cache TTL rewards consecutive turns, and Relay's per-leg isolation is justified only where isolation is the point. The practice, its caveats and four verified evidence pointers live in this unit doc; carrier is the unit doc + ledgers, never both it and a `ceremony passive add` record (D1). PR [#637](https://github.com/gtrabanco/agentic-workflow/pull/637) — `done` in the status machine means built and awaiting the merge, and the owner is this workflow's external verifier. SPEC: [SPEC](fix/633-cache-economics-passive-record/SPEC.md)
---

# fix/633-cache-economics-passive-record

> One-line: the session-chaining practice and its cache economics become a
> durable record — four practice claims, two caveats, four fetched evidence
> pointers — so the next session does not re-derive the analysis.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#633` — tracked issue in the project's forge, closed by this PR via `Closes #633`.

## Specs

**S1 — apply the request to this repository.**
> "Apply to this repository: issue #633"

**S2 — the record's subject: the practice.**
> ## Goal
>
> Record the session-chaining practice and its cache economics as a passive record, so the next session (or another contributor) does not re-derive the analysis: chain the lane and the executor in ONE session; do not switch models mid-unit (a model switch is a full re-prefill); the 5-minute cache TTL rewards consecutive turns.

**S3 — the evidence the record rests on.**
> ## Why (evidence)
>
> - Anthropic prompt caching: cache reads at 0.1x base input (write 1.25x, 5-min TTL) — the second read of a prefix already amortizes the write. https://platform.claude.com/docs/en/build-with-claude/prompt-caching
> - Measured production coding-agent hit rates: Claude Code ~100%, qwen-code 80%; a 30-turn agent session at 90% hits saves ≈71%. https://www.morphllm.com/prompt-caching
> - SGLang RadixAttention: 52–74% production hit rates, up to 5x throughput. https://arxiv.org/abs/2312.07104
> - Cognition, "Don't Build Multi-Agents": single-threaded linear agent; actions carry implicit decisions. https://cognition.com/blog/dont-build-multi-agents

**S4 — what the record carries, and its carrier as the issue states it.**
> ## In scope
>
> - One passive record under `docs/passive/<id>.md`, written by `ceremony passive add` (tier: passive — zero unit-doc ceremony; the CLI is its only writer), containing: the practice, the TTL and model-switch caveats, when Relay's per-leg isolation justifies its cost, and the evidence pointers above.

**S5 — the record never contradicts doctrine.**
> - The recorded practice must not contradict existing doctrine (turn contract, per-phase commits, gates unchanged).

**S6 — out of scope.**
> ## Out of scope
>
> - No code, config, skill or template changes — any behavior change belongs to the phase-batching feature, tracked separately.
> - No Relay work.

**S7 — the declared surface.**
> ## Surfaces
>
> - docs/passive

**S8 — the issue's acceptance criteria, as the issue states them.**
> ## Acceptance criteria
>
> - `docs/passive/<id>.md` exists, written by `ceremony passive add`, citing the external sources above.
> - The project's deterministic gate passes.
> - No other file changed (passive tier: no unit folder, no phases, no review pass).

**S9 — work inline; the deterministic gates are the only gates that run.**
> "Work inline — never run this repo's own machinery on its own surgery. No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always."

**S10 — documentation and state ship in the same change, written through their surfaces.**
> "- Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events;
> - Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead;
> - `docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff;
> - The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection."

**S11 — verify like a writer; the owner is the external verifier.**
> "Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says — or an evidenced `n/a` (cite `path:line`, a ledger row, or a contract). A `planned`, `in-progress`, blank, or `deferred` row blocks the handoff — name the open ids; never defer out of the unit (deferral needs my SPEC amendment first, never a follow-up issue)."
>
> "…run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict."

**S12 — correction bounds.**
> "After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers (re-running the touched obligation rows' validators and flipping their statuses back) → a second pass only if the **same** blocker still fails → then one `Needs your decision` result naming the open blockers. **A new finding never earns another cycle** — it goes to me, and the turn ends."

**S13 — open the PR at completion.**
> "Create the PR when you have finished"

## The practice

The record itself. Four claims, each one sentence long, so a later session reads
them and stops re-deriving the analysis.

- **R1** — **one session, lane then executor.** Run one unit's triage, its cut, its
  implementation and its verification in a single conversation: the prefix (the
  project guide, the unit doc, the planning ledgers, the tool definitions) stays
  byte-identical, so each turn reads it from cache instead of paying for it again
  as fresh input. A unit split across sessions re-pays the prefill for every
  session it was split into — the cost is the split, not the work.
- **R2** — **never switch models mid-unit.** A model switch is a full re-prefill:
  the new model holds no cache for this conversation's prefix, so the whole
  prompt is billed as fresh input at base price. When a unit genuinely needs a
  stronger model for one step, the switch point is a **fresh context** handed the
  unit's carrier (unit doc + git), never an inline swap — per-phase commits are
  what make that handoff cheap, because the resume point is a commit rather than
  a conversation.
- **R3** — **the TTL, not the clock, sets the rhythm.** A cached prefix expires after
  a minimum of five minutes of inactivity; a write with the 5-minute TTL costs
  1.25× base input and a read costs 0.1× (per-model exceptions below). Consecutive
  turns amortize the write; a gap longer than the TTL makes the next turn pay it
  again. This is why an interrupted unit resumes from its carrier into a fresh
  session with one full prefill, rather than being "kept warm" by idle turns.
- **R4** — **Relay's per-leg isolation is bought, not free.** Every Relay leg starts
  fresh, and isolation is exactly what it sells: a reviewer that did not write the
  diff, an external verifier, a different model family's judgment. A full prefill
  for that leg's prompt is the price, so the split is justified when isolation is
  the point and is waste when two legs only continue each other's work — R1
  governs *within* a leg, Relay governs *between* isolated roles.

**What the practice does not change (S5).** The turn contract's boxes, the
per-phase commit boundary and every gate are untouched: this is a statement about
conversation shape and what it costs, never about ceremony. Nothing here licenses
skipping a phase, a ledger or a check.

**No repository-local figure is claimed.** `tier-cost@2` carries the provider's
token breakdown but no cache column, so this repository has no measured hit rate
of its own (PE-008). Projecting one is issue #631's scope, and it is a forward-only
measurement: the figures below are external, cited as external.

## The evidence

Four pointers, each fetched at the cut rather than recalled (PE-001 … PE-004), with
what the source itself states.

- **C1** — Anthropic, prompt caching — https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  — cache writes with the 5-minute TTL cost 1.25× base input, writes with the
  1-hour TTL cost 2×, and cache reads cost 0.1× with per-model exceptions (0.025×
  on Claude Fable 5.2 / Mythos 5.2 / Fable 5.1 / Mythos 5.1, 0.05× on Opus 5.5 /
  Sonnet 5.5); a cached prefix expires after a minimum of five minutes of
  inactivity; the API reports the split in `cache_creation_input_tokens` and
  `cache_read_input_tokens`. Fetched 2026-11-18.
- **C2** — Morph, prompt caching — https://www.morphllm.com/prompt-caching —
  a 30-turn coding agent whose 20k-token system prompt and tool definitions stay
  byte-identical while 1,500 tokens per turn append sends 1,252,500 prompt tokens;
  at a 90% hit rate the session costs $0.459 instead of $1.58, a 71% reduction.
  Measured sessions in its table: Claude Code, 182 messages, ~100% (136,640 cache
  reads against 677 fresh input tokens); qwen-code, 131 messages, 80% (75,072
  against 18,489). Fetched 2026-11-18.
- **C3** — SGLang, arXiv 2312.07104 — https://arxiv.org/abs/2312.07104 — its
  runtime reuses the KV cache across calls (RadixAttention), and the abstract
  reports up to **6.4×** higher throughput than state-of-the-art inference
  systems. The abstract states no production hit-rate figure. Fetched 2026-11-18;
  see D2 for the two figures in S3 this source does not carry.
- **C4** — Cognition, "Don't Build Multi-Agents" —
  https://cognition.ai/blog/dont-build-multi-agents (the URL in S3 is
  `cognition.com`, which redirects here) — the case for a single-threaded linear
  agent: actions carry implicit decisions that a parallel branch cannot see, and a
  subagent is for answering a well-defined question, not for writing code.
  Fetched 2026-11-18.

## Acceptance criteria

Frozen at cut. One observable criterion per `S#`, each naming the check that
proves it.

- **AC-S1** — the unit exists in the fix lane's home with this session's work
  behind it. Check: `git diff --name-only main...HEAD` lists
  `docs/fix/633-cache-economics-passive-record/SPEC.md`.
- **AC-S2** — the record carries the practice's four claims. Check:
  `rg -c '^- \*\*R[1-4]\*\* —' docs/fix/633-cache-economics-passive-record/SPEC.md`
  prints `4`.
- **AC-S3** — four evidence pointers are present and each is the fetched source
  with what it states. Check:
  `rg -c '^- \*\*C[1-4]\*\* —' docs/fix/633-cache-economics-passive-record/SPEC.md`
  prints `4`, and
  `rg -o 'platform\.claude\.com/docs/en/build-with-claude/prompt-caching|morphllm\.com/prompt-caching|arxiv\.org/abs/2312\.07104|cognition\.ai/blog/dont-build-multi-agents' docs/fix/633-cache-economics-passive-record/SPEC.md | sort -u | wc -l`
  prints `4` — the four distinct sources cited across the record (D5:
  the total-URL count this replaced froze `20` and drifted to `23` as the
  append-only `## Log` grew; a distinct-source count cannot drift).
- **AC-S4** — the carrier is this unit doc and no `ceremony passive add` record is
  written for the same scope (D1). Check: `git status --porcelain docs/passive`
  prints nothing, and `ls docs/passive` names no file containing `633`.
- **AC-S5** — nothing in the record contradicts doctrine: the changed file set is
  exactly the declared one. Check: `git diff --name-only main...HEAD` prints only
  paths under `docs/fix/633-cache-economics-passive-record/`, plus
  `docs/ROADMAP.md`, `docs/generated/`, and `.agentic-workflow/journal/`.
- **AC-S6** — the out-of-scope list holds. Check:
  `git diff --name-only main...HEAD | rg -c '^(skills/|packages/|template/|scripts/|\.changeset/)'`
  prints `0`.
- **AC-S7** — the declared surface holds: every changed path is documentation. Check:
  `git diff --name-only main...HEAD | rg -v '^(docs/|\.agentic-workflow/journal/)'`
  prints nothing.
- **AC-S8** — the issue's three criteria are met in the carrier D1 names: the
  record exists and cites the sources (AC-S2, AC-S3), the deterministic gate
  passes (AC-S9), and no file outside the declared set changed (AC-S5). Check:
  the three checks above all pass.
- **AC-S9** — the deterministic gate passes, run in the foreground. Check:
  `bun scripts/local-gate.mjs` exits 0, recorded as a `G` line.
- **AC-S10** — the state surfaces were written through their own writers, never by
  hand. Check: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/633-cache-economics-passive-record/SPEC.md`
  exits 0, `bun scripts/docs-generate.mjs --check` exits 0, and
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check`
  exits 0.
- **AC-S11** — every obligation row is `verified` on a foreground run. Check: the
  `### Obligations` table carries no row whose status is `planned`,
  `in-progress`, blank or `deferred` (`rg -c '\| (planned|in-progress|deferred) \|' …`
  prints `0`).
- **AC-S12** — no correction cycle has run at first delivery: the `## Log`
  carries zero `F` lines and zero `V` lines. Check:
  `rg -c '^- \*\*(F|V)[0-9]+\*\*' docs/fix/633-cache-economics-passive-record/SPEC.md`
  prints `0`.
- **AC-S13** — the PR exists, against `main`, closing the issue. Check:
  `gh pr view fix/633-cache-economics-passive-record --json url,body` exits 0 and
  the body carries `Closes #633`.

## Impact

Documentation only, in one unit folder plus the state surfaces that index it.

- **The carrier decision is the one thing that changes shape from the issue.** S4
  names `docs/passive/<id>.md` written by `ceremony passive add`; S8 repeats it as
  "no other file changed". This unit ships the other carrier the owner's standing
  local workflow orders (S1, S9, S10) — the unit doc plus its ledgers — and writes
  no `ceremony passive add` record for the same scope. `docs/fix/435-project-charter/decisions.md`
  D1 is the precedent: the two carriers are mutually exclusive, never both. D1
  below records the same decision for this unit, so the next session finds one
  rule and not two.
- **Issue #633's own evidence list carries two figures its cited source does not
  state** (S3's SGLang bullet: "52–74% production hit rates, up to 5x
  throughput"). The fetched abstract reports up to 6.4× throughput and no
  production hit rate; the 50–99% "SGLang benchmark workloads" cell belongs to
  C2's table, not the paper. The record writes the source's figure and discloses
  the divergence (D2) rather than repeating the issue's; correcting the issue body
  is a forge write the owner owns, and is not performed here (S9's live-tree
  discipline).
- **Roadmap row 633 stops being an `idea`.** Its status cell moves to
  `in-progress · carried by fix #633` through `roadmap rowUpsert` (the row writer,
  never a hand edit), and its description cell is rewritten by the same writer
  because the one it carried — "Zero unit-doc ceremony", naming
  `ceremony passive add` as the writer — stops being true under D1. Measured, not
  assumed: `docs-generate` syncs the **Fixes** table's notes cell from this doc's
  `roadmap_summary:` but leaves a **Features** row verbatim when the unit's kind is
  `fix` (the generator's `syncTable` filters units by their own `kind`, and this
  folder is `docs/fix/**`), so the Features row is the row writer's business
  end to end. The `## Fixes` `### Active` row is `roadmap fixrow`'s.
- **The projection changes**: `docs/generated/units.md` (and whatever else the
  emitter derives) is re-rendered by the renderer, never hand-written.
- **The journal carrier is armed here** (`.agentic-workflow/journal/` exists), so
  this session's entry is a narrative fragment written by `journal write`, and
  `journal aggregate` — not this session — appends it to `docs/LOGS.md`. S10's
  "the session entry is appended" is satisfied through that writer (D4).
- **Mentions that stop being true when this lands**: row 633's summary (rewritten
  by the emitter), and the issue body's AC-1/AC-3 (a carrier that will not exist).
  The second is disclosed, not silently patched.

## Surfaces

- `docs`

## Retirements

Strictly additive. The unit introduces one unit-doc folder and one record section
inside it; it retires no surface, token, helper or narrative — there is nothing to
remove because the change only adds prose to a folder that did not exist before.
The inventory the template asks a strictly additive unit for is recorded after the
first commit, when `bun scripts/residual-classify.mjs --inventory --base main` has
a diff to read (Log `E` line).

## Non-goals

- No code, config, skill, template or script change (S6): the practice statement
  changes no behaviour, and any phase-batching policy is issue #632's.
- No Relay work (S6): R4 states when isolation is worth its price; it does not
  change the Relay contract, its packet or its budget.
- No measured figure from this repository: no cache column exists in
  `tier-cost@2` and inventing one here would be the fabrication #631 exists to
  prevent.
- No forge write: the issue body and its labels are left as they are (S9).

## Risk tier

Computed, never chosen; the verdict below is the classifier's own output, copied
verbatim from the run recorded as `E3` in `## Log`.

```text
risk-tier-verdict@1
tier | passive
reason | every changed path is documentation, an image or prose: no executable effect
reason_kind | no-executable-effect
signals | —
task_size | understood: yes · contained_risk: contained · resumable_from_diff: yes · ceremony: none · verification: readback
changed_paths | 3
```

`passive` normally means "no unit doc at all" (`skills/execute-phase/references/risk-tiers.md`,
`docs/fix/_TEMPLATE/SPEC.md` §Risk tier). This unit keeps the unit doc anyway,
because the owner's standing local order (S1, S9, S10) explicitly orders that
carrier and instruction precedence puts an explicit prompt instruction above the
repository's documents — the same call, with the same reasoning, as
`docs/fix/435-project-charter/decisions.md` D1. The verdict is recorded, never
hidden (D1).

- **Tier** — `passive` · **Task Size** — `understood: yes · contained_risk: contained · resumable_from_diff: yes`
- **Named high-risk item** — none — not a high-tier unit

## Future

none — the issue named nothing deferred, and the two forward consumers it points
at (measured hit rate, phase-batching policy) are already tracked as issues #631
and #632.

## Future cost

- **Whoever adds a cache column to the measured ledger owns the figure, and it is
  a forward-only measurement** — binds issue #631 and any later telemetry unit:
  `docs/workflow/TIER_COST.md` carries the row contract, and this record's
  "no repository-local figure" claim (S2's fourth paragraph) becomes true history
  the moment a measurement exists, so it is corrected by a new dated line, never
  by editing the claim away.
- **The chain rule binds session planning, not just this document** — binds every
  future unit applied through this workflow: R1/R2 are the reason a unit is not
  split across models mid-flight, and a hand-off that ignores them pays a full
  prefill; the record names that price so the choice is made with it visible.

## Applicable tests

`n/a — no tests step for this fix`. The change touches no executable surface; the
test-impact verdict at the change's base is recorded in `## Log` (`E2`), and the
deterministic gate is the whole verification (S9, AC-S9).

## Known pre-existing issues

- **`ceremony tier classify` fails closed upward on a directory path** — handing
  it `docs/fix/633-cache-economics-passive-record` (a folder that does not exist
  yet) answers `standard` with `executable-content`, because a path it cannot read
  is never proven inert. Does **not** affect this unit: the verdict is computed
  over the changed **files** (PE-005), where the same scope answers `passive`.
- **The ledger reader requires a bare status token, and older units do not carry
  one** — `relay obligations` compares the ninth cell to `verified` exactly, while
  `docs/fix/621-batch-scheduler-surface-verification/planning-obligations.md`
  writes `verified — E3 (…)` in that cell, so a closed ledger reads as 18 open
  rows. Does **not** affect this unit: its own rows carry the bare token, and the
  E-line reference lives in `required-evidence`. The 621 ledger is a separate
  repair and is not touched here.
- **Issue #633's SGLang figures do not match the cited paper** — disclosed in
  `## Impact` and D2; it affects the *issue body*, not this unit's bytes.
- **`scripts/unit-route.test.mjs` `#291 F7` is a wall-clock assertion** — it times
  a spawned subprocess against a temp fixture (`elapsed < 500ms`) and fails under
  the gate's parallel load while passing standalone (E10: 64 pass / 0 fail alone,
  then passes in the gate's third run). Does **not** affect this unit, which adds
  no executable path and no fixture. Named here because a red gate is never
  excused by an unrecorded issue; the repair is a separate unit (a bounded
  measurement instead of a bare deadline).

## Tasks

- P1 — Cut the unit doc: the frozen request (S1…S13), the practice record (R1–R4), the four evidence pointers, the acceptance criteria and the two ledgers (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/633-cache-economics-passive-record/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: docs/fix/633-cache-economics-passive-record/SPEC.md
- P2 — Register the unit: row 633's status through `roadmap rowUpsert` and its summary through the emitter (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/633-cache-economics-passive-record/SPEC.md` exits 0)
  (Implements: S10)
  - Relevant files: docs/ROADMAP.md
- P3 — Write the state surfaces: the session's narrative journal fragment, then the projection re-rendered (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` exits 0)
  (Implements: S10)
  - Relevant files: .agentic-workflow/journal/, docs/generated/
- P4 — Run the deterministic gate in the foreground, record the delivery handoff the correction bounds bind from, and open the PR that closes the issue (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S9, S11, S12, S13)
  - Relevant files: docs/fix/633-cache-economics-passive-record/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | doc | A 5-minute-TTL cache write costs 1.25× base input, a 1-hour write 2×, a read 0.1× with per-model exceptions (0.025× Fable/Mythos 5.x, 0.05× Opus/Sonnet 5.5), and a prefix expires after a minimum of five minutes of inactivity | https://platform.claude.com/docs/en/build-with-claude/prompt-caching | fetched 2026-11-18 | R3, C1, O2 |
| PE-002 | doc | A 30-turn byte-identical-prefix session at a 90% hit rate costs $0.459 instead of $1.58 (−71%); its table measures Claude Code at ~100% and qwen-code at 80% | https://www.morphllm.com/prompt-caching | fetched 2026-11-18 | R3, C2, O2 |
| PE-003 | doc | The SGLang abstract reports up to 6.4× throughput through KV-cache reuse and states no production hit-rate figure | https://arxiv.org/abs/2312.07104 | fetched 2026-11-18 | C3, D2, O2 |
| PE-004 | doc | The single-threaded-agent argument: actions carry implicit decisions a parallel branch cannot see; subagents answer questions, they do not write code | https://cognition.ai/blog/dont-build-multi-agents (S3's `cognition.com` redirects here) | fetched 2026-11-18 | R4, C4, O2 |
| PE-005 | code | `ceremony tier classify` answers `passive` for prose files under `docs/**` and fails closed upward (`standard`, `executable-content`) for a directory path | ran `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths …` at `2a609bca` | ran 2026-11-18 | Risk tier, D1, O7 |
| PE-006 | code | A unit doc's section shape is a subset test, so an extra `##` section is accepted by the reader | `packages/agentic-workflow/src/edit/schema.mjs:63` | read 2026-11-18 | the record's own `## The practice` / `## The evidence` sections |
| PE-007 | code | With `.agentic-workflow/journal/` present the carrier is armed, so the session entry is a fragment written by `journal write` and `journal aggregate` is the only writer of `docs/LOGS.md` | `docs/LOGS.md:8-15`, `packages/agentic-workflow/README.md` (`journal-fragment-grammar@1`), `.agentic-workflow/journal/` present | read 2026-11-18 | D4, O8 |
| PE-008 | code | `tier-cost@2` carries the provider's token breakdown and no cache hit-rate column, so this repository has no measured hit rate | `docs/workflow/TIER_COST.md` | read 2026-11-18 | R3's closing paragraph, O2 |
| PE-009 | repo | The obligation `status` cell is a bare token from `planned \| in-progress \| verified \| n/a \| deferred`, and `relay obligations` compares it exactly | `skills/pre-execution-review/references/LEDGERS.md` §2, `packages/agentic-workflow/src/relay/Packet.mjs:441-446` | read 2026-11-18 | the ledger's status column, O1–O9 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 · AC-S2 | The record states all four practice claims: one session for lane and executor, no mid-unit model switch (a full re-prefill), the five-minute TTL rewarding consecutive turns, Relay's isolation justified only where isolation is the point | P1 | P1 | direct application (this session) | `rg -c '^- \*\*R[1-4]\*\* —' docs/fix/633-cache-economics-passive-record/SPEC.md` prints `4` | `E` line in `## Log` naming the run and the count | verified |
| O2 | S3 · AC-S3 | Each of the four evidence pointers is present with what its source states, and no figure is written that the source does not carry | P1 | P1 | direct application (this session) | `rg -c '^- \*\*C[1-4]\*\* —' docs/fix/633-cache-economics-passive-record/SPEC.md` prints `4` | `E` line in `## Log` with the same count, plus the fetch receipts | verified |
| O3 | S4 · S8 · D1 · AC-S4 | The carrier is this unit doc and no `docs/passive/<id>.md` record exists for the same scope — the two carriers are mutually exclusive | P1 | P1 | direct application (this session) | `git status --porcelain docs/passive` prints nothing | `E` line in `## Log` naming the run and its empty output | verified |
| O4 | S5 · AC-S5 | The record contradicts no doctrine: the changed file set is exactly the declared one, so nothing claims a gate, commit or cadence change | P1 | P1 | direct application (this session) | `git diff --name-only main...HEAD \| rg -v '^(docs/fix/633-cache-economics-passive-record/\|docs/ROADMAP\.md$\|docs/generated/\|\.agentic-workflow/journal/)'` prints nothing | `E` line in `## Log` with the changed-path list | verified |
| O5 | S6 · AC-S6 | No code, config, skill, template, script or changeset path is touched | P1 | P1 | direct application (this session) | `git diff --name-only main...HEAD \| rg -c '^(skills/\|packages/\|template/\|scripts/\|\.changeset/)'` prints `0` | `E` line in `## Log` with the count | verified |
| O6 | S7 · AC-S7 | Every changed path is documentation or the armed journal carrier | P1 | P1 | direct application (this session) | `git diff --name-only main...HEAD \| rg -v '^(docs/\|\.agentic-workflow/journal/)'` prints nothing | `E` line in `## Log` with the path list | verified |
| O7 | S8 · S9 · AC-S9 | The project's deterministic gate passes, run in the foreground, with no gate exception granted by this change | P4 | P4 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 | `G` line in `## Log` with the step count and the exit | verified |
| O8 | S10 · AC-S10 | The roadmap row, the projection and the session entry are written by their own writers, never by hand | P2, P3 | P3 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/633-cache-economics-passive-record/SPEC.md` exits 0, `bun scripts/docs-generate.mjs --check` exits 0, `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` exits 0 | `E` lines in `## Log`, one per writer, with its exit | verified |
| O9 | S11 · S13 · AC-S11 · AC-S13 | Every row of this ledger closes on a foreground run, and the PR exists against `main` with `Closes #633` | P4 | P4 | direct application (this session) | `rg -c '\| (planned\|in-progress\|deferred) \|' docs/fix/633-cache-economics-passive-record/SPEC.md` prints `0` and `gh pr view fix/633-cache-economics-passive-record --json url,body` exits 0 | the ledger itself at the handoff head, plus the PR URL in `## Log` | verified |

Phase/task collision note: O1–O6 ride P1, O8 rides P2 and P3 (the roadmap row and
the two later writers), O7 and O9 ride P4. No row needs two phases.

**State at the handoff:** every row is `verified` on a foreground run (E5–E9,
E11, G1) — nine rows, zero open, zero deferred.

## Triaged steps

This unit is applied through the owner's local, unpublished workflow, where its
§5 frozen ledgers substitute for the lane's plan step; the machine step list
(`runner unit-route --triage`) is therefore not cut here, and the phases above are
the authoritative order (`P1` → `P4`).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the issue, verbatim:
  ```
  ## Goal

  Record the session-chaining practice and its cache economics as a passive record, so the next session (or another contributor) does not re-derive the analysis: chain the lane and the executor in ONE session; do not switch models mid-unit (a model switch is a full re-prefill); the 5-minute cache TTL rewards consecutive turns.

  ## Why (evidence)

  - Anthropic prompt caching: cache reads at 0.1x base input (write 1.25x, 5-min TTL) — the second read of a prefix already amortizes the write. https://platform.claude.com/docs/en/build-with-claude/prompt-caching
  - Measured production coding-agent hit rates: Claude Code ~100%, qwen-code 80%; a 30-turn agent session at 90% hits saves ≈71%. https://www.morphllm.com/prompt-caching
  - SGLang RadixAttention: 52–74% production hit rates, up to 5x throughput. https://arxiv.org/abs/2312.07104
  - Cognition, "Don't Build Multi-Agents": single-threaded linear agent; actions carry implicit decisions. https://cognition.com/blog/dont-build-multi-agents

  ## In scope

  - One passive record under `docs/passive/<id>.md`, written by `ceremony passive add` (tier: passive — zero unit-doc ceremony; the CLI is its only writer), containing: the practice, the TTL and model-switch caveats, when Relay's per-leg isolation justifies its cost, and the evidence pointers above.
  - The recorded practice must not contradict existing doctrine (turn contract, per-phase commits, gates unchanged).

  ## Out of scope

  - No code, config, skill or template changes — any behavior change belongs to the phase-batching feature, tracked separately.
  - No Relay work.

  ## Surfaces

  - docs/passive

  ## Acceptance criteria

  - `docs/passive/<id>.md` exists, written by `ceremony passive add`, citing the external sources above.
  - The project's deterministic gate passes.
  - No other file changed (passive tier: no unit folder, no phases, no review pass).

  ## Dependencies

  None.
  ```
- **L2** — 2026-11-18, the order's open question, which the owner answered by declining to answer it:
  ```
  Create the PR when you have finished
  ```
  No carrier was named, so the recommendation stated with the question stands (D1).
- **D1** — 2026-11-18, carrier decided under instruction precedence: this unit doc
  plus its ledgers, **no** `ceremony passive add` record for the same scope. The
  classifier answers `passive` for the changed files (E3), and the passive tier's
  default carrier is `docs/passive/<id>.md` with no unit doc — but the owner's
  explicit prompt instruction (S1/S9/S10) orders the unit-doc carrier, and
  instruction precedence puts it above the repository's documents. Precedent, with
  the same collision and the same reasoning: `docs/fix/435-project-charter/decisions.md`
  D1 ("the two carriers are mutually exclusive, never both").
- **D2** — 2026-11-18, the record writes what the sources state, not what S3 says
  about them: C3 carries the abstract's "up to 6.4× throughput" and no production
  hit rate, because neither "52–74% production hit rates" nor "up to 5x
  throughput" appears in https://arxiv.org/abs/2312.07104; the 50–99% benchmark
  cell belongs to C2's table. Correcting the issue body is a forge write the owner
  owns and is not performed here.
- **D3** — 2026-11-18, the roadmap moves through the writers, and the measurement
  changed the route: `roadmap fixrow` writes the `## Fixes` `### Active` row,
  `roadmap rowUpsert` writes the **Features** row 633 (status and description), and
  `docs-generate` re-renders the projection plus the Fixes row's notes cell from
  this doc's `roadmap_summary:`. The emitter does **not** touch the Features row:
  it filters units by their own `kind`, and this unit's carrier is `docs/fix/**`, so
  the row keeps its owner-written summary cell. A hand edit of any cell remains a
  defect; fix #569 is the receipt for what a regeneration does to a hand-edited one.
- **D4** — 2026-11-18, the session entry is a narrative journal fragment, not a
  direct `docs/LOGS.md` append: this checkout carries `.agentic-workflow/journal/`,
  so the carrier is armed (PE-007) and `journal aggregate` is that file's only
  writer. S10's "the session entry is appended" is satisfied by the fragment.
- **E1** — 2026-11-18, `gh issue view 633 --json number,title,state,labels,body` ·
  exit 0 · state `OPEN`, one label `documentation`, body as quoted in S2–S8.
- **E2** — 2026-11-18, `bun scripts/test-impact.mjs --base main` · exit 0 ·
  `TEST IMPACT — empty` · verdict `empty` · changed 4 · executable 0 · suites 0 ·
  reason "no executable path changed — record this verdict, run no TDD ceremony,
  invent no test" — the prose-only ceremony is skipped, as the rule orders.
- **E3** — 2026-11-18, `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths docs/fix/633-cache-economics-passive-record/SPEC.md,docs/ROADMAP.md,docs/generated/units.md`
  · exit 0 · tier `passive`, `reason_kind` `no-executable-effect`, `changed`
  = 3 — the verdict copied verbatim into `## Risk tier`. The same scope handed the
  folder path instead answers `standard`/`executable-content` (PE-005).
- **E4** — 2026-11-18, the four fetches (PE-001 … PE-004) · exit 0 each · C1:
  5-min write 1.25×, 1-hour 2×, read 0.1× with per-model exceptions; C2: 90% hits
  → $0.459 against $1.58 (−71%), Claude Code ~100%, qwen-code 80%; C3: up to 6.4×
  throughput, no hit-rate figure; C4: single-threaded argument, subagents answer
  questions.
- **E5** — 2026-11-18, `rg -c '^- \*\*R[1-4]\*\* —' docs/fix/633-cache-economics-passive-record/SPEC.md`
  · exit 0 · `4` (O1).
- **E6** — 2026-11-18, `rg -c '^- \*\*C[1-4]\*\* —' …` · exit 0 · `4`;
  `rg -c 'https://' …` · exit 0 · `20` (O2) — the URL total was true when recorded
  and superseded 2026-11-18 by E13/D5: it drifted to `23` at the shipped head and
  the check was replaced.
- **E7** — 2026-11-18, `git status --porcelain docs/passive` · exit 0 · no output;
  `ls docs/passive` names no file containing `633` (O3).
- **E8** — 2026-11-18, at `40abb897`, `git diff --name-only main...HEAD` · exit 0 ·
  four paths — `.agentic-workflow/journal/20261118T205542Z-fix-633-…md`,
  `docs/ROADMAP.md`, `docs/fix/633-cache-economics-passive-record/SPEC.md`,
  `docs/generated/units.md` (O4); `… | rg -c '^(skills/|packages/|template/|scripts/|\.changeset/)'`
  · `0` (O5); `… | rg -v '^(docs/|\.agentic-workflow/journal/)'` · no output (O6).
- **E9** — 2026-11-18, the three state writers · `roadmap check docs/fix/633-cache-economics-passive-record/SPEC.md`
  → `verdict: PASS`, `violations: 0` · `bun scripts/docs-generate.mjs --check` →
  `Files: 3 checked · 0 missing · 0 stale · 0 orphaned`, `verdict: PASS` ·
  `journal aggregate --check` → `{"ok":true,"checked":81,"refusals":[]}`,
  exit 0 (O8).
- **E10** — 2026-11-18, `bun scripts/local-gate.mjs`, three runs recorded in full
  because two of them were red:
  - run 1, `--no-bail`: 19 steps, 18 PASS, red on `worktree-guard` —
    `FINDING .worktrees/feat-631-cache-hit-rate — STALE: branch
    feat-631-cache-hit-rate is merged into origin/main · dirty`. Another session's
    worktree, predating this branch's commits, and nothing in this unit's diff can
    clear it without destroying uncommitted work there. That session removed it
    before run 3, so the finding was never this unit's.
  - run 2, default: red on `root-suite` — `scripts/unit-route.test.mjs` `#291 F7:
    long Progress-log line uses linear scan (not quadratic split)`, a
    `elapsed < 500ms` wall-clock assertion around a spawned subprocess built from a
    temp fixture, not from this tree. Standalone re-run of that suite: 64 pass,
    0 fail. A load-sensitive flake under the gate's four-worker pool, recorded in
    `## Known pre-existing issues`, not excused.
  - run 3, default: PASS — 19 steps, 957s (`G1`).
- **E11** — 2026-11-18, `gh pr create --base main --head fix/633-cache-economics-passive-record`
  · exit 0 · PR [#637](https://github.com/gtrabanco/agentic-workflow/pull/637),
  body carrying `Closes #633` (O9).
- **G1** — 2026-11-18, `bun scripts/local-gate.mjs` · exit 0 ·
  `local-gate: PASS — 19 step(s) in 957s`, at `cb984a4e` (O7).
- **G2** — 2026-11-18, `bun scripts/local-gate.mjs` · exit 0 ·
  `local-gate: PASS — 19 step(s) in 902s`, at `e8e4ec46` — the shipped head, after
  the settle repair (E12), so the receipt matches the bytes the PR carries (O7).
- **E12** — 2026-11-18, the settle gate caught a real miss of mine at `44673573`:
  `bun scripts/roadmap-settle.mjs` → `pr-url-unsettled` on this doc, because its
  Log carries the PR URL while the row still read `in-progress`; the contract is
  `done · [#N](<same url>)`. Repaired through the writers, never by hand:
  `roadmap rowUpsert` (Features row) and `roadmap fixrow` (Fixes row) → both at
  `done · [#637](https://github.com/gtrabanco/agentic-workflow/pull/637)`, then
  `bun scripts/docs-generate.mjs` re-synced the Fixes notes cell from
  `roadmap_summary:`. `bun scripts/roadmap-settle.mjs` → `violations: 0`, PASS.
  The first commit's `in-progress` was wrong, and the gate — not a reviewer —
  caught it, which is the point of the settle invariant.
- **D5** — 2026-11-18, the owner's external verify returned `NEEDS-DECISION` with
  one blocker (receipt: `external-verify.md`, head `fb1eae45`) and ordered the
  correction batch. B1: AC-S3's second check froze a total-URL count (`20`) over
  an append-only document, and the count drifted +1 per later commit to `23` at
  the shipped head — a frozen outcome that no longer reproduced. The repair
  replaces the brittle count with a distinct-source count that cannot drift (the
  four canonical URLs, `sort -u`), not a re-frozen number the next Log line would
  break again. Advisories triaged, none fixed in this batch: A1 (the emitter
  projects only the first wrapped `One-line:` line, so row 633's generated
  summary cell ends mid-sentence) is pre-existing at base — row 630 shows the
  same artifact — and an emitter change is outside S6; owner's call. A2 (the
  root-suite wall-clock flake class) is already in `## Known pre-existing
  issues`. A3 is the disclosed journal-fragment convention. B1 is folded here —
  the findings grammar folds a row into a `## Log` line, the table stays
  open-rows-only.
- **E13** — 2026-11-18, the correction recheck (blockers only), at the batch
  bytes: AC-S3's repaired check
  `rg -o '…' docs/fix/633-cache-economics-passive-record/SPEC.md | sort -u | wc -l`
  → `4`; `rg -c '^- \*\*C[1-4]\*\* —' …` → `4` (O2); the
  planned/in-progress/deferred sweep → 0 (AC-S11); `rg -c '^- \*\*(F|V)[0-9]+\*\*' …`
  → 0 (AC-S12); `agentic-workflow phase-lint docs/fix/633-cache-economics-passive-record/SPEC.md`
  → verdict PASS, 4/4 phases; `agentic-workflow roadmap check …` → PASS, 0
  violations; `bun scripts/roadmap-settle.mjs` → PASS, 0 violations;
  `bun scripts/docs-generate.mjs --check` → PASS; `journal aggregate --check` →
  ok; `bun scripts/test-impact.mjs --base main` → `empty`.

## Next

The owner's external verdict on the diff, with the ledger closed and one thing
left that is the owner's call and not a defect.

**Correction batch 1 (2026-11-18):** the verdict came back `NEEDS-DECISION (B1)`,
the batch folded it (D5, E13), and the next step is the owner's delta re-verify —
blockers only, per the receipt — plus the A1 owner's call (the emitter's
`One-line:` projection, a separate unit's scope).

**Closed:** every obligation row is `verified` on a foreground run — the practice
and citation counts (E5, E6), the empty passive carrier (E7), the changed-path set
(E8), the three state writers (E9), the gate (G1: `local-gate: PASS — 19 step(s)
in 957s`) and the PR (E11).

**Open by design, not deferred:** issue #633's AC-1 and AC-3 name
`docs/passive/<id>.md` and "no other file changed". D1's carrier writes neither, so
those two cells of the *issue* are unmet on purpose — amending the issue body is a
forge write the owner owns and was not performed here.

The record itself is R1–R4 with C1–C4 behind it; D1 holds the carrier and the
precedent, D2 the one figure the issue states that its source does not, D3 the
roadmap route the measurement corrected.

## References

- Issue [#633](https://github.com/gtrabanco/agentic-workflow/issues/633) — closed by this PR via `Closes #633`.
- Roadmap row 633 (`docs/ROADMAP.md` `## Features`).
- `docs/fix/435-project-charter/decisions.md` D1 — the carrier precedent.
- `skills/execute-phase/references/risk-tiers.md` — the tier's carrier rule this unit overrides by owner instruction.
- `docs/workflow/TIER_COST.md` — the measured ledger that has no cache column yet (issue #631 owns it).

## Branch

`fix/633-cache-economics-passive-record`

## Depends on

none.

## Regression scope

`n/a — the change adds prose in a folder that did not exist and touches no
executable surface`, so no previously-working behaviour can regress. The one
observable side effect is the roadmap row's status and summary cells, whose
pre-change bytes are pinned in `## Log` (`E` line) and recoverable from git.
