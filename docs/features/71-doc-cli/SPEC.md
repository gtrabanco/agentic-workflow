---
type: feature
scope: medium
---

# 71 — doc-cli

> One-line: half A of issue #192, re-homed here by 65's D6 split — a
> deterministic `doc` CLI over Markdown (section-level `read`, section-splice
> `edit`, derived structure index with stable section IDs, TypeBox validation,
> lossless roundtrip), experimental and disposable, never a decision authority.

## Objective

Ship issue #192's half A in `packages/agentic-workflow` (the runner crate of
feature 61) as the positional branch of the single entry point row 65 creates —
`agentic-workflow doc read | edit | index`:

1. `doc read --file <path> --section <id|title>` loads one section instead of a
   whole skill or SPEC.
2. `doc edit` splices a section rewrite back into Markdown in place,
   deterministically.
3. `doc index` regenerates a derived JSON structure index (stable section IDs,
   parsed frontmatter, skill triggers, phase mapping, dependencies) validated
   against TypeBox schemas, byte-identical across runs.

`Closes #192` at this unit's merge — the retrieval half (`--sync` / `--query`)
belongs to row 65, and neither half waits on the other (the issue's own
sequencing note, answered by D6).

## Why

Agent loops today re-derive repository knowledge through grep/sed round trips
and load whole documents where one section would do. The win comes from
**selection** — section-level loading plus a derived index — not from changing
the source format: the issue's research settled representation against 20 years
of industry precedent (Markdown stays the authoring format; `SKILL_CONTEXT_BUDGETS.json`
is this repo's own MD-source + JSON-derived proof).

Row 65 split the halves at design time (D6, 2026-10-01): 27 ACs breached the
diff guard's 400-line / 8-file per-step budget, the halves are independently
valuable and independently risky (65's judge fixture can stop retrieval at P1
without dragging this CLI), and one unit equals one PR. Both halves share D5's
stable section-ID function, so this unit is **additive on 65, never a rewrite**.

## User outcome

- `doc read --file <path> --section <id>` loads only the section an agent
  needs instead of a whole `SKILL.md`.
- `doc edit` rewrites a section in Markdown in place — git stays the review
  surface, and two runs over the same input produce the same bytes.
- `doc index` regenerates a byte-identical JSON structure index (stable section
  IDs, no timestamps); a second `review-change`-style pass loads only the
  relevant sections and the token/byte delta is recorded in Evidence.
- No build step: `SKILL.md` files are never generated or rewritten, so pi keeps
  loading skills natively with no drift surface.

## Acceptance criteria

Scenario-induced from issue #192; carried **verbatim** from row 65's split
record (D6, 2026-10-01) so the numbers keep their #192 identity. AC4 (no build
step, transversal) stays asserted in row 65.

1. **Roundtrip is lossless.** MD → AST → MD is byte-identical on unchanged
   input, proven against the golden fixtures and every `skills/**` doc; the
   allowed normalizations are listed explicitly in the test. Verified by the
   roundtrip suite exiting 0.
2. **Index regeneration is deterministic.** Two `doc index` runs over an
   unchanged corpus produce byte-identical output — stable section IDs, no
   timestamps. Verified by a diff of two runs (empty diff).
3. **Measured savings demo.** A second `review-change`-style pass loads only
   the relevant sections (receipts ledger + index) instead of a whole
   `SKILL.md`; the token/byte delta is recorded in Evidence.
5. **Schemas validated in CI.** Frontmatter and structured artifacts
   (SPEC, receipts) validate against TypeBox (TypeCompiler) schemas in the test
   suite. Verified by the suite exiting 0 with a deliberately invalid fixture
   rejected.
6. **Ship experimental.** The toolchain is documented as experimental, and any
   published pi-package surface is marked alpha/experimental. Verified by grep
   of the documented label.

## Non-goals

- **Half B — everything retrieval.** `--sync` / `--query` / `--status` /
  `--rebuild`, the SQLite/FTS5 store, embeddings and the hybrid path, the
  freshness manifest, git hooks, `init-workspace` consent and the discovery
  allowlist are row 65's, not this unit's.
- **JSON as source of truth** for docs/skills — rejected by the issue's prior
  research (git diff/review legibility, LLM authoring ergonomics, the Agent
  Skills standard, roundtrip lossiness).
- **Migrating or regenerating existing docs** — additive tooling only.
- **The docs web UI itself** — it owns its own feature.
- **Server or managed vector DBs** (pgvector, Qdrant, Chroma) — row 65's
  documented P4 non-goal, unchanged here.
- **Any memory protocol** — Engram (#262) owns conversational recall; the index
  is row 65's disposable cache over git.
- **The index/CLI as gate or decision authority** — gates, receipts and
  exhaustive audits stay on grep/LSP/scripts (row 65's discipline tests).
- **Replacing Serena (symbols) or grep (exhaustive sweeps).**
- Findings discovered during implementation never widen this unit; they are
  recorded and routed to their owner.

## Future cost

| Rule | Binds |
|---|---|
| Roundtrip losslessness is a corpus obligation — every `skills/**` and `docs/**` doc must round-trip, and the allowed-normalizations list lives inside the test as a contract, never silently widened | whoever edits the scanner or the golden fixtures |
| The section-ID function is **shared with row 65** (D5): one function, both halves | anyone changing a section-ID rule — the change lands in both units, additive only |
| Experimental/alpha labelling persists until promotion is earned by measured context/token savings on a real flow | whoever would publish or advertise this toolchain |
| The crate's dependency claim is written from the actual manifest (`typebox`, plus row 65's `sqlite-vec`) | the docs/release steps of both halves while #192 is open |
| Every touched `SKILL.md` owes a `bump-skill` version bump + `CHANGELOG.md` row | this unit's docs/release steps and every later edit |

## Applicable tests

- Root suite `node --test scripts/*.test.mjs` (baseline recorded at this
  unit's research step) — must stay green.
- Crate suites `bun run test` and `bun run test:node` in
  `packages/agentic-workflow`.
- New suites, red-first, house style so they ride the gate: the lossless
  roundtrip golden over `skills/**`, the determinism diff of two `doc index`
  runs, and the deliberately invalid TypeBox fixture.
- `bun scripts/check-skill-context.mjs` after any skill wording growth.

The `tests` triage step therefore runs rather than being skipped.

## Known pre-existing issues

- **Row 65 `doc-toolchain` ships the entry point, the fence-aware scanner and
  the shared section-ID function (D2/D5)** — **affects** positively: this unit
  is additive; the roadmap `Depends on: 65` gate holds it until 65 merges.
- **D8 library policy (TypeBox in, remark out; re-trigger = the golden corpus
  itself)** — **affects** AC1: its "MD → AST → MD" wording predates the
  remark-out ruling recorded in 65's D8. The design step must resolve that
  tension by **ask-don't-infer** (native fence-aware scanner round-trip versus
  read-only `remark-parse` under D8's stated criteria, whichever unit hits it),
  never by inference. Flagged here so it is a designed question, not a silent
  assumption.
- **Crate dependency surface** — **affects**: `typebox` (and half B's
  `sqlite-vec`) land with row 65; this unit adds nothing beyond TypeBox, so the
  README dependency claim is one edit at 65's docs step, not two.
- **Issue #192 stays open until this unit merges** — **affects**: row 65 must
  not close it; `Closes #192` belongs to this unit's PR.
- **U6 crate README drift** (still claiming "Current producers: none yet") —
  **does-not-affect**: routed to `audit-docs`, never fixed inside either half.

## Tasks

Rough cut at creation (2026-10-01) — this unit's own `plan` step re-cuts the
final phase list with per-phase validators and runs the prior-decisions
contradiction sweep; the roadmap row stays `defined` until that step.

- P1 — Research: map the crate's existing section services
  (`UnitDoc.setSection`, `evidence_addRow`, `progress_logEntry`), the
  fence-aware heading/frontmatter scanner, and the golden corpus
  (`skills/**` + `docs/**`) against AC1's roundtrip wording. (validator:
  `bun scripts/unit-route.mjs --triage 71-doc-cli` exits 0 with rows R1+ in the
  Evidence section)
- P2 — Design: fix the section-splice `doc edit` semantics, the explicit
  allowed-normalizations list, the structure-index JSON shape with stable
  section IDs (D5's shared function), and TypeBox schema authority (AC5).
  (validator: `grep -c "^| D" docs/features/71-doc-cli/SPEC.md` exits 0 with
  rows D1+ present)
- P3 — Plan: re-cut the phase list for AC1–AC3 and AC5–AC6, map every AC to a
  phase with its validator, and run the prior-decisions contradiction sweep.
  (validator: `bun scripts/phase-lint.mjs docs/features/71-doc-cli/SPEC.md`
  exits 0)
- P4 — Implement: section-level `doc read` over the fence-aware scanner and the
  shared stable-ID function, so a section loads by id and by title.
  (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test, skills/
- P5 — Implement: section-splice `doc edit` plus the derived `doc index` JSON
  and its TypeBox validation. (validator:
  `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test, packages/agentic-workflow/package.json
- P6 — Tests: the lossless roundtrip golden over `skills/**`, the determinism
  diff of two `doc index` runs, and the deliberately invalid TypeBox fixture.
  (validator: `node --test scripts/*.test.mjs` exits 0)
  - Relevant files: scripts/, packages/agentic-workflow/test, skills/
- P7 — Evidence: one row per AC with the roundtrip, determinism and
  measured-savings outputs pasted. (validator:
  `grep -c "^| " docs/features/71-doc-cli/SPEC.md` exits 0 with the AC rows
  present)
- P8 — Review: the review pack axes over the accumulated diff with every
  finding classified into the fixed decision table. (validator:
  `grep REVIEW-VERDICT docs/features/71-doc-cli/SPEC.md` exits 0)
- P9 — Docs: experimental labelling, the workflow/replicate docs touch,
  `CHANGELOG.md` rows, and the roadmap row update. (validator:
  `bun scripts/check-skill-context.mjs` exits 0 and
  `node scripts/check-changelog-row.mjs` exits 0)
- P10 — Release: crate version bump for `@gtrabanco/agentic-workflow` with its
  `CHANGELOG.md` row, same PR. (validator:
  `bun scripts/npm-version-gate.mjs` exits 0)
- P11 — Verification: every gate re-run at head — root suite, both crate
  runtimes, context budgets, diff guard. (validator:
  `node --test scripts/*.test.mjs` exits 0)

AC→task map (rough cut): AC1→P6, AC2→P6, AC3→P6+P7, AC5→P5+P6, AC6→P9.
Ordered smallest-first; P11 is the verification tail.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| T1 | `bun scripts/unit-route.mjs --triage 71-doc-cli` | 0 | block pasted verbatim under `## Triaged steps` below | main agent |
| T2 | `bun scripts/phase-lint.mjs docs/features/71-doc-cli/SPEC.md` | 0 | verdict PASS over the rough-cut bullets (re-run at this unit's own plan step) | main agent |

## Triaged steps

```text
TRIAGE — 71-doc-cli (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Skipped: none
Budget: strong
```

(`bun scripts/unit-route.mjs --triage 71-doc-cli`, exit 0 — block pasted
verbatim by this unit's own lane invocation; the bare token `71` is ambiguous
with `docs/fix/71-skill-registration-parity`, so the full slug is the correct
token.)

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

2026-10-01 — unit doc created from `docs/features/_TEMPLATE/SPEC.md` at row 65's
plan step (D6): AC1–AC3 + AC5–AC6 carried verbatim from #192, split record and
inherited decisions (D5/D6/D8) recorded, roadmap row 71 added with status
`defined` and `Depends on: 65`, rough phase cut P1–P11 lint-clean → evidence:
T1/T2 rows — next: research step (P1) once row 65 merges

## Next

Research step (P1) — run after row 65 merges (roadmap `Depends on: 65`):
map the crate's section services and fence-aware scanner against AC1's
roundtrip wording, record the D8 remark-out tension as an explicit design
question, then `/unit-lane 71-doc-cli` through design and plan.

## References

- Issue [#192](https://github.com/gtrabanco/agentic-workflow/issues/192) — the
  source of the ACs; `Closes #192` at this unit's merge.
- Roadmap row 71 `doc-cli` (`docs/features/ROADMAP.md`) — `defined`, depends on 65.
- Row 65 `doc-toolchain` (`docs/features/65-doc-toolchain/SPEC.md`) — the split
  record D6 and the shared design rows D1–D10 (D2 entry point, D5 section-ID
  function, D8 library policy).
- Feature 61 / `packages/agentic-workflow` — the entry-point vehicle.
- `docs/workflow/LANE_FLOW.md`, `docs/workflow/FEATURE_WORKFLOW.md` — the lane
  contract this unit runs under.
