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

## Next

Run P1 — the vocabulary census and canonical declarations, fixtures first.

## References

Issue `#315` (this unit's request, `Closes #315` in the PR); roadmap row 84;
`docs/features/77-promise-coherence-guard/SPEC.md` (the #305 carrier whose
`CLAIM_KINDS` this unit extends); `scripts/unit-doc-phases.mjs` (`LOG_KINDS`,
the F22 parity precedent); `docs/features/79-spec-by-reference/SPEC.md:161,168`
(live F40 token, recorded debt); `AGENTS.md` §Normative surfaces.
