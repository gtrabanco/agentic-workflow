---
type: feature
scope: medium
---

# 84 — published-vocabulary-sweep-gate

> One-line: the fold **survivors** rule becomes bytes — published closed
> vocabularies get canonical machine declarations with parity pins and a
> validator probe, and `promise-coherence` gains a `swept:` claim kind that
> re-runs a fold's survivor greps and fails closed. Requirement ids are `S#`
> (quoting the owner verbatim); phases are `P#`.

## Specs

Every requirement below is the owner's string (issue #315, promoted), quoted
between the markers. `S#` is a requirement id; `P#` (in `## Tasks`) is a phase
label. A later correction is a verbatim quote under its own requirement id,
never a rewrite of the id it corrects.

**S1 — machine-pin the published vocabularies.**
> **Published-vocabulary pin (the F40 class).** The repo publishes closed vocabularies in prose (Future status `open | planned | discarded <YYYY-MM-DD>`, log-kind, findings-table `class`/`route`, …). For each: one canonical machine-readable declaration (extending the `normative-surfaces@1` inventory in `AGENTS.md`, or a shared vocabulary module the prose surfaces cite), a parity test pinning every second copy of the set (the F22/`LOG_KINDS` pattern), and a validator probe that applies the vocabulary across every unit doc's `## Future` rows (and any other section the inventory declares) so an off-vocabulary token fails the root suite, not the next review cycle.

**S2 — a sweep-receipt claim kind in the promise-coherence gate.**
> **Sweep-receipt claim kind (the F35/F37/F38/F39 class).** Extend `scripts/promise-coherence.mjs` with one new closed claim kind: a **sweep declaration** the fold (and any prose-carrying edit) appends to its log entry — `swept: <regex> → expected <n>` lines naming the stale form and its expected survivor count (typically 0 outside an explicit allowlist: the ledger's own quote of the finding, log lines, fixtures). The gate re-runs each grep and fails closed naming `file:line`, the regex, and the observed count. The `FOLDING.md` checklist and `fold-findings` 1.9.0's guardrail gain the box that emits the declaration; a fold without a sweep declaration for a token/claim-shaped change is a `workflow` finding.

**S3 — negative-capability pins for structural siblings.**
> **Negative-capability pins for structural siblings (the F39 class).** Where the related surface is *code*, not prose, the durable check is a pin on the pattern, not the instance: e.g. no inline `## `-heading search outside the shared reader (`grep -rn 'search(/^## ' scripts/*.mjs` → only `sectionBounds`), every echo path of carrier cells routes through `sanitize()` (grep all push sites). Each pin lands in the owning suite with a corpus case naming the finding that motivated it.

**S4 — inventory backfill, dated, no historical rewrite.**
> **Inventory backfill.** A dated census of the published-but-unpinned vocabularies and reader/echo-path patterns currently in the tree, recorded as the inventory rows and pins above — no historical unit doc is rewritten (append-only evidence holds; closed units stay closed).

### Acceptance criteria (owner words, issue #315)

1. Every vocabulary declared in the inventory has: a canonical machine-readable set, a parity test for second copies, and a validator probe exercised across all unit docs — a deliberately off-vocabulary token in a fixture unit doc fails the root suite naming `file:line`.
2. A fold that changes a token/claim-shaped surface produces a sweep declaration; re-running each declared grep reproduces the expected counts, and a seeded stale survivor in a fixture fails `promise-coherence` with `file:line`, regex and observed count.
3. The negative-capability pins (heading-search, sanitize coverage) fail on a fixture that reintroduces the F37/F38/F39 pattern.
4. The sweep declaration is executable by a weak model: fixed grammar, fixed output, no judgment calls — same bar as the `log-kind@1` and `findings-table@1` blocks.
5. No existing test is deleted or loosened; root + both package suites stay green; schema package mirrors any new published vocabulary (types + version bump, same PR).
6. Validators re-confirmed at the plan step (per #308's spec-by-reference discipline).

## Impact

- **Consumes:** `scripts/promise-coherence.mjs` (the closed `CLAIM_KINDS` / `REASON_CODES` vocabularies — the #305 carrier; this unit adds a claim kind, never a second guard), `scripts/unit-doc-phases.mjs` (`LOG_KINDS`, the F22 precedent), the `normative-surfaces@1` inventory in `AGENTS.md`, the two unit-doc templates and the `UnitDoc` skeleton (the prose Future-status surfaces), `skills/execute-phase/references/FOLDING.md` and `skills/fold-findings/SKILL.md` (the prescription half that already shipped), and the schema package's mirror rule.
- **Its deliverables are consumed by:** the root suite (the new pins and probes run on every push), the fold gate (`fold-findings` / `execute-phase` folds now emit sweep declarations the gate re-runs), `review-change` (a fold without a declaration is a `workflow` finding), and every future unit whose docs carry inventory-declared sections.
- **Stops being true:** vocabulary membership asserted only in prose (the template Future-status sentences, `LEDGERS.md` prose, `log-kind@1` restatements) becomes pinned bytes — a prose edit that changes a set without the canonical declaration now fails the root suite instead of surfacing at the next review.
- **Ask before touching:** closed/historical unit docs (append-only; the probe's corpus scope decision is recorded in `decisions.md` D3), the `CLAIM_KINDS` set (closed vocabulary — extending it is a SPEC change in the owning reference, unit 77's Future-cost rule), and the schema package's published surface (mirror rule: types + `envelope.schema.json` + version bump, same PR).

## Non-goals

- No rewrite of historical unit docs (append-only; closed units are never rewritten — AC5 discipline from #308).
- No LSP-based document verification (feature 68's non-negotiable: a document verifier is a deterministic script, never LSP — verified false-positive behavior on non-code files).
- No new review authority, cycle limit change, or per-finding model routing (owned by #201/feature 45 and the closed CLASSIFY set).
- Engram/memory persistence of project norms — memory stays an index/router pointing at committed surfaces, never the source of truth (the gentle-ai/Engram reconciliation pattern; a memory-side promise would recreate the #305 class at the memory layer).

## Future

none

## Future cost

| Rule | Binds |
|---|---|
| A published vocabulary is a closed set with one canonical declaration; adding or removing a token is a schema-const + grammar-block + parity-pin change in one PR, never a prose-only edit | whoever extends any inventory-declared vocabulary |
| A fold or prose-carrying edit that changes a token/claim-shaped surface appends its `swept:` declaration to the log entry; skipping it is a `workflow` finding | every `fold-findings` / `execute-phase` executor |
| A new `## `-heading reader or carrier-cell echo path must join the shared helper; the negative-capability pins fail the suite otherwise | whoever adds a reader or echo path in `scripts/*.mjs` |
| Sweep declarations stay bounded — the finding's cited surface plus its inventory-declared siblings, never repo-wide regex sweeps | whoever writes or reviews a sweep declaration |

## Applicable tests

`node --test scripts/*.test.mjs` (root, includes the new vocabulary-probe, sweep-claim and pin suites), `bun run test` in `packages/agentic-workflow-schema`, `bun run test` in `packages/agentic-workflow`, `bun scripts/check-skill-context.mjs` and `--routes`, `bun scripts/phase-lint.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md`.

## Known pre-existing issues

- `docs/features/79-spec-by-reference/SPEC.md:161,168` still carry the `kept deferred <date>` token (unit 79's F40, folded with the tokens left as recorded debt — re-trigger condition at `docs/features/79-spec-by-reference/review-findings.md:447`). `affects` this unit's probe design: the validator's corpus excludes closed units (decision D3), so the tokens fire only when 79's D5-deferred Future-carrier unit touches them.
- `scripts/promise-coherence.mjs` deliberately reports non-executable prose claims as `skip:` lines (unit 77 AC7) — `does not affect` this unit; the sweep declaration is a *new executable* claim kind, not a retroactive parse of prose.
- Unit 78's F35 class (byte-identical verdict copy across `## Next` / `## Review verdict`) is already repaired in that unit's fold history — `does not affect` this unit's scope; S2 makes the *class* gate-detectable, and S3 pins the sibling pattern.

## Tasks

- P1 — Vocabulary census + canonical declarations: cut the dated inventory (published-but-unpinned vocabularies and reader/echo-path patterns in the tree), declare the canonical sets as schema-package consts the prose surfaces cite, add the `normative-surfaces@1` inventory rows in `AGENTS.md`, and land the parity tests pinning every second copy (LOG_KINDS/F22 pattern; fixtures-first — a deliberately off-vocabulary token in a fixture unit doc is committed before the probe exists) (validator: `node --test scripts/*.test.mjs` exits 0 and `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S1, S4)
  Relevant files: packages/agentic-workflow-schema/src/, scripts/unit-doc-phases.mjs, AGENTS.md, docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md, packages/agentic-workflow/src/edit/UnitDoc.mjs, scripts/fixtures/

- P2 — Vocabulary validator probe: one deterministic script (root-suite wired) that applies every declared vocabulary across open unit docs' `## Future` rows and the other inventory-declared sections, fails closed naming `file:line` and the offending token, and rejects the P1 fixture (validator: `node --test scripts/vocabulary-probe.test.mjs` exits 0 — suite name settled at cut time if the owning file differs)
  (Implements: S1)
  Relevant files: scripts/ (new probe + test), scripts/fixtures/

- P3 — Sweep-receipt claim kind in `promise-coherence.mjs`: `CLAIM_KINDS` gains `sweep`, `REASON_CODES` gains its fail-closed reason, the `swept: <regex> → expected <n>` grammar is parsed from a fold's log entry, each declared grep is re-run and compared, and a seeded stale survivor in a fixture fails with `file:line`, regex and observed count; schema package mirrors the new vocabulary (types + `envelope.schema.json` + version bump, same PR) (validator: `node --test scripts/promise-coherence.test.mjs` exits 0 and `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S2)
  Relevant files: scripts/promise-coherence.mjs, scripts/promise-coherence.test.mjs, packages/agentic-workflow-schema/src/, packages/agentic-workflow-schema/envelope.schema.json

- P4 — Fold-side wiring: the `FOLDING.md` checklist and `fold-findings`' guardrail gain the sweep-declaration box (fixed grammar, fixed output, no judgment calls — same bar as `log-kind@1`), a fold without a declaration for a token/claim-shaped change is named a `workflow` finding in the review-pack wording, and every touched skill bumps via `bump-skill` (validator: `bun scripts/check-skill-context.mjs --routes` exits 0 and `node --test scripts/*.test.mjs` exits 0)
  (Implements: S2)
  Relevant files: skills/execute-phase/references/FOLDING.md, skills/fold-findings/SKILL.md, skills/review-code/SKILL.md, CHANGELOG.md, README.md

- P5 — Negative-capability pins: no inline `## `-heading search outside the shared reader, every echo path of carrier cells routes through the one flatten class — each pin in its owning suite with a corpus case naming the motivating finding (F37/F38/F39), each failing on a fixture that reintroduces the pattern (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S3)
  Relevant files: scripts/workflow-status.mjs, scripts/unit-doc-phases.mjs, scripts/*.test.mjs, scripts/fixtures/

- P6 — Verification sweep at the head: root suite, both package suites, context + route budgets, phase-lint on this document, promise-coherence at the head, and every Evidence line re-run (validator: `node --test scripts/*.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4)
  Relevant files: docs/features/84-published-vocabulary-sweep-gate/SPEC.md

- P7 — Release settle: after the PR exists, settle the roadmap row via the crate's writer (`agentic-workflow roadmap rowUpsert`, status `done · [#N](<pr-url>)`, every other cell preserved) (validator: `bun scripts/roadmap-settle.mjs` exits 0)
  (Implements: S1, S2, S3, S4)
  Relevant files: docs/features/ROADMAP.md

### Planning evidence

M/L unit — the ledger is frozen as `planning-evidence.md` in this folder (plan
step, sizing rule `skills/unit-lane/references/PLAN.md`), which also holds the
prior-decisions contradiction sweep; this section names it and does not
duplicate its rows.

### Obligations

M/L unit — the ledger is frozen as `planning-obligations.md` in this folder;
this section names it and does not duplicate its rows.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. A folded row leaves this table and becomes a `## Log` line.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|
| F16 | packages/pi-agentic-workflow/bun.lock | workflow | med | source | fold |
| F19 | scripts/promise-coherence.mjs:588 | perf | med | source | fold |
| F20 | scripts/vocabulary-probe.mjs:151 | code | med | source | fold |

## Triaged steps

<!-- pasted verbatim from `bun scripts/unit-route.mjs --triage 84` -->

```text
TRIAGE — 84 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
```

Research, design and plan ran in the authoring turn (this doc, `sources.md`,
`decisions.md`, both planning ledgers); execution phases P1–P7 hand off to
`/execute-phase 84-published-vocabulary-sweep-gate P<k>` one phase per turn.

## Log

- **L1** — 2026-10-27, the request (issue #315, verbatim):
  ```
  ### Goal

  Unit 258 burned **12 review→fold cycles**; unit 78 (PR #311) burned **5 review invocations past a 2-cycle cap** with 40 findings. Post-mortem on both ledgers shows the same second-order class producing most of the tail: **a fold or an owner-directed edit repairs the cited surface and leaves the *related* surfaces stale** — the survivors-sweep rule is ordered in prose but enforced by nothing. Concretely, from PR #311:

  - **F35** — the F26 fold re-cut the `## Next` pane and left the byte-identical verdict copy in `## Review verdict` (`grep -c '^| M1 |'` → 2).
  - **F37/F38/F39** — the F28/F29 fold moved two `## Log` readers onto the shared fence-aware `sectionBounds` but left a **third** reader (`scripts/workflow-status.mjs:788-792`) fence-blind, and the `sanitize()` coverage F29's fold route explicitly promised "in the same batch" did not reach the other echo paths (`bounded()` at `:805-808`, `readFixNow` at `:815-835`).
  - **F40** — the post-PASS doc re-cut wrote the status token `kept deferred <date>` outside the closed Future vocabulary the same PR publishes in three prose surfaces (`docs/features/_TEMPLATE/SPEC.md:48`, `docs/fix/_TEMPLATE/SPEC.md:60`, `packages/agentic-workflow/src/edit/UnitDoc.mjs:70,150`); no parser reads it, so no gate saw it.

  The prescription half already shipped twice (`fold-findings` 1.9.0: "change + dependents, survivors swept in the same batch"; `execute-phase` 6.1.0: the same phrasing in `FOLDING.md` plus the `promise-coherence` box). The enforcement half does not exist: `promise-coherence.mjs` checks executable claims of its 8 closed kinds (command, count, named surface) — "nothing still asserts what is no longer true" is **not a claim of those shapes**, so a fold ends green while a sibling surface still carries the stale token. This unit turns the survivors rule from prose into bytes.

  ### In scope

  1. **Published-vocabulary pin (the F40 class).** [S1 — quoted verbatim in `## Specs`]
  2. **Sweep-receipt claim kind (the F35/F37/F38/F39 class).** [S2 — quoted verbatim in `## Specs`]
  3. **Negative-capability pins for structural siblings (the F39 class).** [S3 — quoted verbatim in `## Specs`]
  4. **Inventory backfill.** [S4 — quoted verbatim in `## Specs`]

  ### Out of scope

  - No rewrite of historical unit docs (append-only; closed units are never rewritten — AC5 discipline from #308).
  - No LSP-based document verification (feature 68's non-negotiable).
  - No new review authority, cycle limit change, or per-finding model routing.
  - Engram/memory persistence of project norms — memory stays an index/router pointing at committed surfaces, never the source of truth.

  ### Acceptance criteria

  [Six owner ACs quoted verbatim under `## Specs` → "Acceptance criteria (owner words)"]

  ### Dependencies

  - #305 (merged — PR #309): `promise-coherence.mjs` is the carrier; this unit adds a claim kind, not a second guard.
  - #308 (in flight — PR #311): its `## Future`/`## Log` grammar and the `normative-surfaces@1` follow-up are the first vocabulary inventory consumers; open units migrate at next touch.
  - Soft: #303 (merged — PR #310): the plan stage's investigate/orient step is where the sibling-surface enumeration is prescribed; this unit owns the gate-side half.
  ```
  Elision note: the four scope-item and AC bodies are quoted in full at their
  `S#` rows and the AC block above; the elision markers name where, per the
  `spec-requirement@1` grammar ("unedited apart from a marked elision"). The
  full unedited body is issue #315 in the forge.
- **P1** — 2026-10-27 00:00 — lane: unit doc resolved from issue #315 (`--from-issue`), specs S1–S4 quoted verbatim, provenance searched (`sources.md`), decisions D1–D3 recorded, roadmap row 84 → `defined`, triage run and pasted → 1a62e2c1 — next: P1 (vocabulary census).
- **E1** — 2026-10-27, `bun scripts/unit-route.mjs --triage 84` · exit 0 · all 9 steps, budget strong, implement tier cheap.
- **E2** — 2026-10-27, `bun scripts/phase-lint.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · verdict PASS, 7/7 phases.
- **E3** — 2026-10-27, memory probe (`agentic-workflow memory probe` via the crate bin) · exit 0 · verdict `degraded` — `session-ambiguity` check failed (1+20 findings); recorded per the memory protocol §1/§7, non-blocking, boundary save attempted with explicit `project`.
- **P2** — 2026-10-27 00:00 — P1 vocabulary census + canonical declarations: the dated census cut from the tree, `packages/agentic-workflow-schema/src/vocabularies.ts` publishes `FUTURE_STATUS_KINDS`, `FINDINGS_TABLE_SEVERITIES`, `LOG_KIND_TOKENS`, `SWEEP_CLAIM_KINDS` and `SWEEP_MISMATCH_REASONS` (4.9.0), the `normative-surfaces@1` rows and both template surfaces cite them, and `scripts/vocabulary-parity.test.mjs` pins every second copy — fixtures first (`f4d730e0` RED, then `17f3a507`) — next: P2 (validator probe).
- **P3** — 2026-10-27 00:00 — P2 vocabulary validator probe: `scripts/vocabulary-probe.mjs` applies every declared set across open unit docs' `## Future` rows and the inventory's other sections, failing closed with `file:line` and the offending token; closed units are out of the corpus (decision D3) → c3b5c2fa — next: P3 (sweep claim kind).
- **P4** — 2026-10-27 00:00 — P3 sweep-receipt claim kind: `CLAIM_KINDS` gains `sweep`, `REASON_CODES` gains `sweep-mismatch`, the `swept: /<pattern>/<flags> → expected <n> in <glob>` declaration is parsed from the fold's log entry and each declared grep re-runs fence-aware (the declaring doc stays in the corpus — the true F35 shape is a stale copy in a *sibling section of the same doc*) → a92e7daf — next: P4 (fold-side wiring).
- **P5** — 2026-10-27 00:00 — P5 negative-capability pins: `scripts/structural-sibling-pins.mjs` pin A refuses an inline `## `-heading search outside an allowlisted reader and pin B refuses a carrier-cell echo path without the one flatten class, each with a corpus case that reintroduces the pattern; the pins went RED on four live F39 siblings, all refactored onto `sectionBounds` (and the shared reader itself never advanced past a scanned line — quadratic on a 50k-char log line) → feca1fc0, ba49d63c — next: P4 (fold-side wiring).
- **P6** — 2026-10-27 00:00 — P4 fold-side wiring: `FOLDING.md`'s checklist and `fold-findings`' guardrail carry the sweep-declaration box (fixed grammar, fixed output, no judgment call), `review-code`'s checklist names a missing declaration a `workflow` finding, `bump-skill` applied (`execute-phase` 6.4.0, `fold-findings` 1.10.0, `review-code` 1.3.0), and the Pi package publishes them as 0.36.0 with the eight `execute-phase:*` route ceilings re-based at the declared reason → ba49d63c, 078d51d6 — next: P6 (verification sweep at the head).
- **E4** — 2026-10-27, `bun scripts/version-parity-gate.mjs --content --base main` · exit 0 · `VERDICT: PASS` — version 0.35.2 → 0.36.0, companion row present.
- **E5** — 2026-10-27, `bun scripts/check-skill-context.mjs` and `--routes` · exit 0 · `PASS context budgets: 28 skills`, `PASS route budgets: 14 routes`.
- **E6** — 2026-10-27, `bun scripts/diff-guard.mjs --base <last-step-commit> --unit 84` · exit 0 · `DIFF-GUARD PASS` on every phase commit (the fold-side wiring split into content `ba49d63c` and bookkeeping `078d51d6` when the combined 12 files breached the guard).
- **P7** — 2026-10-27 00:00 — P6 verification sweep at the head: every declared suite re-run green (root 951/951, schema 721/721, runner 254/254), context and route budgets PASS, phase-lint PASS, promise-coherence PASS; the one root failure the sweep caught was `review-loop-discipline`'s maintained `fold-findings` version pin, re-pointed 1.9.2 → 1.10.0 exactly as its own comment orders ("the assertion is re-pointed, never weakened") — next: open the PR (P7 release settle follows).
- **E7** — 2026-10-27, `node --test scripts/*.test.mjs` · exit 0 · `tests 951 / pass 951 / fail 0`.
- **E8** — 2026-10-27, `cd packages/agentic-workflow-schema && bun run test` · exit 0 · `721 pass, 0 fail`.
- **E9** — 2026-10-27, `cd packages/agentic-workflow && bun run test` · exit 0 · `254 pass, 0 fail`.
- **E10** — 2026-10-27, `bun scripts/phase-lint.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · `verdict PASS` 7/7 phases.
- **E11** — 2026-10-27, `bun scripts/promise-coherence.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · `verdict PASS` (claims 0 checked · 7 skipped, every skip a command outside the reader allowlist).
- **P8** — 2026-10-27 00:00 — P7 release settle: the PR opened on `main` with `Closes #315` (https://github.com/gtrabanco/agentic-workflow/pull/330), the unit doc's References carries `- PR: <url>`, and the roadmap row settled to `done · [#330](<url>)` through the crate's writer at HEAD `27f15a80` with its `dependsOn` and `description` cells re-emitted unchanged — next: the mandatory end review.
- **E12** — 2026-10-27, `bun scripts/roadmap-settle.mjs` · exit 0 · `verdict: PASS` — 111 unit docs checked, 0 violations.
- **E13** — 2026-10-27, `bunx @gtrabanco/agentic-workflow roadmap docs/features/ROADMAP.md rowUpsert '<json>'` · exit 0 · `Schema: roadmap-table@1 · Receipt: pass` — Before `558aae60` · After `27f15a80`.
- **R1** — 2026-10-27, review-change cycle 1 · HEAD `e835f15895ed5c4a57726cd08751546e0b676400` · four isolated axis passes (code, security, verify, perf; design/a11y/brand/seo skipped — no UI/web surface) + isolated classifier and debt transform · verdict **REVIEW-FAIL** — 9 fix-now open (F1–F8, F12), gate red at the reviewed head (G1) · no passing receipt posted.
- **G1** — 2026-10-27, `node --test scripts/*.test.mjs` · exit 1 · `tests 951 / pass 950 / fail 1` (`vocabulary-probe.test.mjs` "the repository's own head is in vocabulary" — the probe corpus is empty because roadmap row 84 is already `done`); `bun run test` in `packages/agentic-workflow-schema` · exit 0 · 721/721; `bun run test` in `packages/agentic-workflow` · exit 0 · 254/254; `bun scripts/check-skill-context.mjs` and `--routes` · exit 0 · 28 skills / 14 routes; `bun scripts/phase-lint.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · PASS; `bun scripts/promise-coherence.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · PASS (claims 0 checked · 7 skipped — see F12).
- **V1** — 2026-10-27, F1 · reviewer review-change · HEAD `e835f158…` · recheck command reproducer: `node --test scripts/vocabulary-probe.test.mjs` exit 1 ("the probe scanned at least the in-flight unit docs"); `bun scripts/vocabulary-probe.mjs` → `0 documents checked`.
- **V2** — 2026-10-27, F2 · reviewer review-change · HEAD `e835f158…` · recheck reproducer + direct read: a grammar-legal nested-quantifier pattern (`(a+)+$`) takes 83.2 s for five `test()` calls on one 29-char line; `parseSweepDeclaration` (`scripts/promise-coherence.mjs:342-353`) compiles the doc-sourced body with no size/complexity/time bound and `sweepCount` runs it per line over ≤5000 files × 2 MB.
- **V3** — 2026-10-27, F3 · reviewer review-change · HEAD `e835f158…` · recheck reproducer: `sectionBounds` returns UTF-16 indices (`[47,69]` on a 69-char/76-byte doc) while `sweepCount` accumulates `Buffer.byteLength` offsets (`scripts/promise-coherence.mjs:435`) — the declaring doc's Log exemption misaligns on any non-ASCII doc; the `:417` comment mislabels `sectionBounds` as byte ranges.
- **V4** — 2026-10-27, F4 · reviewer review-change · HEAD `e835f158…` · recheck direct read + grep: the only occurrence of `outsideFences` in `scripts/vocabulary-probe.mjs` is its definition (`:64`); `documentViolations` re-implements the same fence walk inline.
- **V5** — 2026-10-27, F5 · reviewer review-change · HEAD `e835f158…` · recheck direct read: `inFlightDocs` (`scripts/vocabulary-probe.mjs:199`) and `runProbe` (`:201-204`) both `readLines` the same corpus per run.
- **V6** — 2026-10-27, F6 · reviewer review-change · HEAD `e835f158…` · recheck direct read: the Future (`:103`) and Findings (`:129`) loops inline the fence walk while `openFence`/`closesFence` are exported by `scripts/unit-doc-phases.mjs:24,29` — the F37-class duplication S3's own pin targets.
- **V7** — 2026-10-27, F7 · reviewer review-change · HEAD `e835f158…` · recheck direct read: `out.push` precedes the cap check and the `return` exits only the current walk level (`scripts/promise-coherence.mjs:406-408`), so sibling recursion keeps appending past 5000.
- **V8** — 2026-10-27, F8 · reviewer review-change · HEAD `e835f158…` · recheck direct read: `allowlisted.has(path.basename(hit.file))` (`scripts/structural-sibling-pins.mjs:125`) — a same-named script in any subdirectory bypasses pin A.
- **V9** — 2026-10-27, F12 · reviewer review-change · HEAD `e835f158…` · recheck command output: `bun scripts/promise-coherence.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` → `claims: 0 checked · 7 skipped` (every validator command "outside the reader allowlist") — the gate's PASS on this doc is vacuous.
- **V10** — 2026-10-27, refuted candidate (review-code) · HEAD `e835f158…` · counter-evidence: the `SWEEP_DECLARATION` grammar `(?:(?:[^/\\]|\\.)*)` forces every in-body `/` to be escaped, so `lastIndexOf("/")` in `parseSweepDeclaration:345` always lands on the closing delimiter — reproducer payloads with escaped-slash/escaped-backslash bodies extract identically via `slice(1, lastIndexOf("/"))` and via delimiter math. Not a row.
- **F1** — 2026-10-27, folded — the head test no longer gates the root suite on the release step's own roadmap write (`done · [#330]` is the prescribed state once the PR exists, and a validator may not depend on a surface another actor mutates). The pin is now the corpus rule itself: the scanned set must equal the set independently re-derived from the roadmap and the fix index, both directions, and the non-vacuity witness moved to the frozen fixture corpus (asserted at exactly its two documents) — strictly stronger than `>= 1`. · commit 87afdf30
  swept: /assert\.ok\(result\.documentsChecked >= 1/ → expected 0 in scripts/vocabulary-probe.test.mjs
  swept: /documentsChecked >= 1/ → expected 1 in scripts/vocabulary-probe.test.mjs
- **F2** — 2026-10-27, folded — the sweep's pattern body is bounded before it is compiled: `sweepPatternRefusal` refuses a body over 200 characters and a group quantified over its own quantified body (the recorded reproducer `(a+)+$` cost 83 s for five `test()` calls on one 29-character line). An outside-bound declaration fails closed naming which bound tripped, reusing the published `sweep-mismatch` reason — no vocabulary moved, so no schema mirror was due. The fixture declares both shapes and the suite asserts the refusal is a bound check, not a timed-out run. · commit 1fa35626
  swept: /<pattern> is the stale form as a JS regex body, <flags> the flags/ → expected 0 in skills/execute-phase/references/FOLDING.md
- **F3** — 2026-10-27, folded — `sweepCount` walked the file with `Buffer.byteLength` offsets while the declaring document's Log exemption is a `sectionBounds` string-index range; on any doc with non-ASCII before `## Log` the exemption mis-aligned and a clean fold failed its own declaration. The scan now walks string indices (CRLF-safe), and the two comments that called the ranges byte ranges are corrected. New corpus: a declaring doc whose drift before `## Log` is asserted to be real, so the case cannot go ASCII-only and stop proving anything. · commit 1fa35626
  swept: /Buffer\.byteLength\(line, "utf8"\)/ → expected 0 in scripts/promise-coherence.mjs
  swept: /as byte ranges to skip/ → expected 0 in scripts/promise-coherence.mjs
- **F4** — 2026-10-27, folded — `outsideFences()` was dead: the only occurrence in the probe was its own definition while both section loops re-implemented the same walk. Deleted with the private `FENCE` const it depended on. · commit 4de8ea19
  swept: /outsideFences/ → expected 0 in scripts/vocabulary-probe.mjs
- **F5** — 2026-10-27, folded — every in-flight unit doc was read twice per probe run (once to filter on the dated progress entry, once again in `runProbe`). `inFlightDocs` now returns the `{ file, lines }` pairs and the probe consumes them directly; the scanned set is also exposed so a test can pin the corpus. · commit 4de8ea19
  swept: /inFlightDocs\(root\)\.map/ → expected 0 in scripts/vocabulary-probe.mjs
- **F6** — 2026-10-27, folded — the probe's three private fence walks collapsed into one `unfenced()` helper built on the shared reader's exported `openFence`/`closesFence`, the exact F37-class duplication this unit's S3 pin exists to refuse. The clean fixture gained a fenced F40 quote, so routing through the helper is proven to exempt the fold's own evidence rather than assumed. · commit 4de8ea19
  swept: /let fence = null;/ → expected 1 in scripts/vocabulary-probe.mjs
- **F7** — 2026-10-27, folded — the 5000-file ceiling was checked after `push` and `return`ed only out of the current recursion level, so sibling directories kept appending past the bound. The check now runs at the top of every walk level, the constant is named, and `sweepFiles(root, glob, maxFiles)` takes its ceiling so the bound is proven on a three-file corpus instead of a fabricated 5000-file one. · commit 1fa35626
  swept: /if \(out\.length >= 5000\) return;/ → expected 0 in scripts/promise-coherence.mjs
- **F8** — 2026-10-27, folded — `HEADING_READER_ALLOWLIST` was keyed by base name and matched with `path.basename(hit.file)`, so a script in any subdirectory that shared an allowlisted name bypassed pin A in silence. Hits now carry the repository-relative path and the filter compares whole paths; the non-vacuity pin got stronger with it — every key must still carry a heading search or the entry fails as prunable, replacing "some entry is still used". · commit e7db7293
  swept: /path\.basename\(hit\.file\)/ → expected 0 in scripts/structural-sibling-pins*.mjs
- **F12** — 2026-10-27, folded — the gate re-runs the class it can re-run safely: a claim whose command is `node`/`bun` plus a committed report validator (`phase-lint`, `check-skill-context`, `roadmap-settle`, `vocabulary-probe`, `structural-sibling-pins`) executes argv-style with no shell, no glob, no placeholder argument, never a `.test.mjs`, and never this gate's own file. The span search prefers a runnable command, so a cell whose first span is prose no longer hides its real validator, and every refusal names itself (`suite runner — this pass never executes the suite that runs it`; `this gate itself`). A document that extracted claims but machine-checked none now says so in its tally. This unit's own doc reads `2 checked · 5 skipped` where it read `0 checked · 7 skipped`. · commit 1fa35626
  swept: /`bun …` or `gh …` from a document would make this pass/ → expected 0 in scripts/promise-coherence.mjs
- **G2** — 2026-10-27, gate runs at `HEAD e7db7293` (the fold head; the ledger line that records them is the next commit and carries no code) — `node --test scripts/*.test.mjs` · exit 0 · `958 pass / 0 fail`; `bun run test` in `packages/agentic-workflow-schema` · exit 0 · 721/721; `bun run test` in `packages/agentic-workflow` · exit 0 · 254/254; `bun scripts/check-skill-context.mjs` · exit 0 · 28 skills; `--routes` · exit 0 · 14 routes; `bun scripts/phase-lint.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · PASS; `bun scripts/normative-drift.test.mjs` · exit 0 · 20/20; `bun scripts/vocabulary-probe.mjs` · exit 0; `bun scripts/structural-sibling-pins.mjs` · exit 0; `bun scripts/roadmap-settle.mjs` · exit 0 · 0 violations.
- **E14** — 2026-10-27, `bun scripts/promise-coherence.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · `verdict PASS` — every `swept:` declaration above re-ran to its expected count at this head, and the tally reads checked claims, not only skips.
- **R2** — 2026-10-27, review-change cycle 2 (delta, escalated to full pass — width: 16 files outside the folded rows' cited union; size: 644 changed lines / 21 files) · folded rows F1–F8+F12 re-verified at cited locations, all defects gone · reviewed head `126a4a7e` frozen at start; branch moved to `c0206f1d` mid-review (4 foreign docs commits + affecting `fe08f2af`, increment verified) · four isolated axis passes (code, security, verify, perf; design/a11y/brand/seo skipped — no UI/web surface) + isolated classifier and debt transform · verdict **REVIEW-FAIL** — 7 fix-now open (F14–F20), gate red at current head (G3) · no passing receipt posted.
- **G3** — 2026-10-27, at reviewed head `126a4a7e`: `node --test scripts/*.test.mjs` · exit 0 · 958/958; `bun scripts/promise-coherence.mjs docs/features/84-published-vocabulary-sweep-gate/SPEC.md` · exit 0 · `claims: 13 checked · 5 skipped`; schema 721/721 and runner 254/254, budgets 28/14, phase-lint PASS (verify pass, observed). At moved head `c0206f1d`: `version-parity-gate --content` PASS, but `cd packages/pi-agentic-workflow && bun run test` · exit 1 · 470/471 — `lockfile-policy.test.mjs` "bun.lock workspace pins match package.json dependencies" fails (schema pin 4.9.0 not in committed lock, F16).
- **V11** — 2026-10-27, F14 · reviewer review-change · HEAD `c0206f1d` · two independent finders reproduced live: `runCommand` spawns `spawnSync(command, { shell: true })` (:341, comment claims "without a shell") and `COMPOSITION` (:64/180) blocks `; && || $( > < \n` but not a single `|`, backticks or `$VAR` — the code finder executed a doc-sourced claim piped into an arbitrary script; a `grep \`touch /tmp/pwned\` x` payload passes the guard.
- **V12** — 2026-10-27, F15 · reviewer review-change · HEAD `c0206f1d` · measured reproducer: `(a|aa)+$` and `(a{2,})+` both test false against `SWEEP_NESTED_QUANTIFIER` (:538) yet backtrack 66–83 s on one short line; `sweepCount` runs `regex.test` per line over the corpus with no wall-clock bound — the 200-char budget admits ungrouped overlap chains (`a*a*a*b`).
- **V13** — 2026-10-27, F16 · reviewer review-change · HEAD `c0206f1d` · recheck command output: `cd packages/pi-agentic-workflow && bun run test` → 470 pass / 1 fail; assertion actual `["@gtrabanco/agentic-workflow-schema: package.json 4.9.0"]` — commit fe08f2af bumped the pin without running `bun install`; the committed `bun.lock` is stale (F23 lockfile policy).
- **V14** — 2026-10-27, F17 · reviewer review-change · HEAD `c0206f1d` · recheck direct read: the runner arg loop (:295-312) admits plain tokens, and `scripts/vocabulary-probe.mjs:217-222` resolves `--root <any-dir>` — a unit doc can point an allowlisted validator at an arbitrary directory and gate-echo its content.
- **V15** — 2026-10-27, F18 · reviewer review-change · HEAD `c0206f1d` · recheck direct read: `for (const lineNumber of found ?? [])` (:682) — `sweepCount` returning null on an unreadable file folds to zero matches, so an `expected 0` declaration passes without the file being examined; violates the gate's own fail-closed rule.
- **V16** — 2026-10-27, F19 · reviewer review-change · HEAD `c0206f1d` · recheck direct read: each `swept:` declaration re-walks and re-reads the whole glob corpus (:588-600); `sweepFiles`' cap bounds matching files only — the walk stats every entry below it (:556-578) and `headingSearchHits` has no count/depth cap (scripts/structural-sibling-pins.mjs:81-105).
- **V17** — 2026-10-27, F20 · reviewer review-change · HEAD `c0206f1d` · recheck direct read: `inFlightDocs` (scripts/vocabulary-probe.mjs:151) and `inFlightUnitDocs` (scripts/promise-coherence.mjs:1091) are byte-similar copies of the roadmap + fix-index row grammar — two gates can silently disagree on which docs are "in flight".

## Next

Cycle-1 findings F1–F8 and F12 are folded and their rows left this table; the head
carries the repairs. Next is the bounded re-review of the fold diff: `/review-change`
on this branch (cycle 2, delta scope), then `/audit-pr` once it posts the exact-HEAD
`review-change:pass` receipt. F9–F11 stay report-only notes and F13 the batched
proposal — none of them is ledger work, and the third cycle never starts without an
explicit owner instruction.

## References

- PR: https://github.com/gtrabanco/agentic-workflow/pull/330
Issue `#315` (this unit's request, `Closes #315` in the PR); roadmap row 84;
`docs/features/77-promise-coherence-guard/SPEC.md` (the #305 carrier whose
`CLAIM_KINDS` this unit extends); `scripts/unit-doc-phases.mjs` (`LOG_KINDS`,
the F22 parity precedent); `docs/features/79-spec-by-reference/SPEC.md:161,168`
(live F40 token, recorded debt); `AGENTS.md` §Normative surfaces.
