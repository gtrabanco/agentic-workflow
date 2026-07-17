# fix/67-nan-ladder-design-feature-row

## Goal

The README "Running on NaN.builders" section maps every workflow skill to a NaN
model via the **Preference ladders per task** table, but `design-feature` —
the single highest-judgment skill in the flow (product-definition + capability
closure) — appears in **no row**. Anyone running the workflow on NaN has no
routing guidance for it and will, by default, fall through to a cheaper tier
than its judgment warrants. This is a documentation-completeness defect in a
just-shipped reference table, cheap to close now and awkward to leave as a
known hole. The fix adds one **Product definition** row to the table (and the
supporting caveat prose) in both `README.md` and `README.es.md`.

## Issue

`#67` — GitHub issue. Required. The PR must close it via `Closes #67` in the
body.

## Branch

`fix/67-nan-ladder-design-feature-row`

## Depends on

None — independent. Issue #37/#50 (fix `37-bilingual-human-docs`) introduced the
NaN routing section and is already merged; this only extends its table.

## Root cause

The NaN routing section (README.md "Running on NaN.builders", added by
[#50](https://github.com/gtrabanco/agentic-workflow/pull/50) closing #37) built
the **Preference ladders per task** table (`README.md:329-335`,
`README.es.md:343-349`) by grouping skills into task classes — Merge gates,
Planning/routing/triage, Execution/mechanical, Cheap, Folding — and omitted
`design-feature` entirely. `design-feature` is a comparatively recent, distinct
skill (its `#claude` routing is `model: opus`, `effort: high` per
`docs/workflow/model-routing.yml:20-22` and the per-skill table at
`README.md:222`), and it does not fit the existing five rows: it is
judgment-heavy like Merge gates but is a **product-definition** step, not a
merge verdict, so it fell through the grouping.

## Detected in

Filed as issue #67 by the maintainer on 2026-07-16 — a documentation-coherence
gap noticed while reading the NaN routing table (the kind of drift
`audit-docs` / `product-audit` exist to catch).

## Scope

### In scope

The exact change set — mechanical doc edits only:

1. **`README.md`** — insert one **Product definition** row into the *Preference
   ladders per task* table (`README.md:329-335`), placed **immediately after the
   Merge gates row** (both are Mimo-first, high-judgment ladders — keeping them
   adjacent). Row content, verbatim from the issue's proposed row:

   | Task | Skills | €200 plan | Basic-plan ladder | Never here |
   |---|---|---|---|---|
   | **Product definition** | `design-feature` | GLM-5.2, Thinking on, High | 1. **Mimo V2.5** (reasoning always on; different family from the Qwen executor adds independence) → 2. **Qwen3.6** (thinking ON — only for XS/S or derivative features, quota-saver) → 3. **DeepSeek V4 Flash** (`reasoning_effort: high`) | Gemma4; Qwen3.6 thinking OFF |

2. **`README.md`** — add a short rationale paragraph (below the table, near the
   existing `Qwen3.6` reasoning caveat) capturing the issue's four rationale
   points condensed: (a) `design-feature` output = the SPEC's product half +
   capability closure = **founding assumptions** whose errors compound through
   plan → execute → review (the merge-gate class, hence Mimo first, not the
   cheap tier); (b) Qwen3.6-with-thinking is acceptable **only** as rung 2 for
   XS/S or derivative features, because the raw-idea interview keeps a human in
   the loop and `plan-feature`'s capability-closure gate re-checks the output
   downstream (per the README's own "re-checked reasoning" caveat); (c) Mimo
   V2.5's always-on reasoning is the *correct* spend here (few invocations, high
   leverage), unlike mechanical volume; (d) sanity-check against
   `GET /v1/models` before pinning, per the existing catalog caveat.

3. **`README.es.md`** — mirror both edits (new **Definición de producto** row in
   the table at `README.es.md:343-349`, same placement after *Puertas de merge*;
   Spanish rationale paragraph) in the **same commit** — bilingual sync rule
   (CLAUDE.md hard rule).

### Out of scope

- **Editing the fold-cycle / "never weaker" prose** (`README.md:337-341`,
  `README.es.md:351-356`) and the closing model-invariant paragraph
  (`README.md:389-395`). The issue asks to add `design-feature` there "if
  applicable" — it is **not applicable**: that prose is skill-agnostic
  model-comparison guidance (it names no individual skills), so there is no skill
  enumeration to extend. Recorded under *Decisions made during drafting*.
- Any change to `design-feature`'s `#claude` per-skill routing
  (`model-routing.yml`, `README.md:222`) — already correct (Opus/high), not part
  of this gap.
- Re-verifying or restructuring the other five ladder rows.

## Acceptance

Objective, verifiable conditions for "done":

- [ ] `README.md` *Preference ladders per task* table has a **Product
      definition** row for `design-feature` with all five columns populated
      exactly as the issue's proposed row (€200 plan = "GLM-5.2, Thinking on,
      High"; basic-plan ladder = Mimo V2.5 → Qwen3.6 (thinking ON, XS/S only) →
      DeepSeek V4 Flash (`reasoning_effort: high`); Never here = "Gemma4;
      Qwen3.6 thinking OFF"), placed directly after the Merge gates row.
- [ ] `README.md` carries the condensed four-point rationale paragraph for the
      new row (founding-assumptions / merge-gate class; Qwen3.6 rung-2
      restriction to XS/S + downstream re-check; Mimo always-on spend justified;
      `GET /v1/models` sanity-check).
- [ ] `README.es.md` has the faithful Spanish sibling of **both** the row
      (**Definición de producto**) and the rationale paragraph, in the same
      commit — no EN-only diff.
- [ ] Table column counts and Markdown pipes are intact in both files (no broken
      table rendering); the new row uses the same column order as the existing
      rows.
- [ ] `git grep -n "Product definition" README.md` and
      `git grep -n "Definición de producto" README.es.md` each return the new
      ladder row.
- [ ] No stack/real-project references leaked; all committed artifacts (SPEC,
      commit, PR) in English; the human-readable README rationale text is the
      only bilingual content.

## Phases

### P1 — Add the Product definition ladder row (both READMEs)

- [x] `README.md`: insert the **Product definition** row into the *Preference
      ladders per task* table immediately after the **Merge gates** row, five
      columns verbatim from the issue's proposed row.
- [x] `README.md`: add the condensed four-point rationale paragraph below the
      table (near the `Qwen3.6` reasoning caveat).
- [x] `README.es.md`: insert the faithful Spanish **Definición de producto** row
      in the same table position (after *Puertas de merge*).
- [x] `README.es.md`: add the faithful Spanish rationale paragraph.
- [x] Verify both tables still render (pipe/column count unchanged) and
      `git grep -n "Product definition" README.md` +
      `git grep -n "Definición de producto" README.es.md` each hit the new row.
- [x] Commit both files together (bilingual sync rule — never an EN-only diff).

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #67`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #67` and push

## Testing

Documentation-only change — no automated test layer applies. Verification is the
project's "green" definition (CLAUDE.md → Verification):

- Markdown well-formedness: both ladder tables render with intact column counts
  (visual/pipe check + `git grep` for the new row title in each file).
- Cross-reference integrity: no links added; the new row references only models
  already defined in the section's catalog/pros-cons tables.
- No stack/real-project references leaked into README or shared docs.
- Bilingual parity: `README.md` and `README.es.md` gain semantically identical
  content in the same commit.

## Impact

- **Layers touched:** documentation only (`README.md`, `README.es.md`). No code,
  no skills, no templates, no schema package.
- **Modules and files (paths):** `README.md` (table `329-335`, rationale prose
  `337-348`); `README.es.md` (table `343-349`, rationale prose `351-364`).
- **Blast radius:** dev-only, cosmetic — affects human reading guidance for
  NaN.builders routing. No runtime, no CI, no installable behavior. A wrong ladder
  recommendation could at worst route `design-feature` to a weaker model than
  ideal, but the human always reviews design output (raw-idea interview) so the
  downside is bounded.
- **Detection lead time:** immediate — a rendering or content error is visible on
  the next README read / PR diff.

## Rules that must never be violated

- **Docs-language rule** — committed artifacts (SPEC, commit, PR) in English;
  README prose is the sanctioned bilingual exception (EN original + ES sibling).
- **Bilingual sync (CLAUDE.md hard rule)** — the `README.es.md` edit ships in the
  **same commit** as the `README.md` edit; an EN-only diff is incomplete and must
  not be committed or merged.
- **Stack/architecture agnostic** — no product/stack/framework references
  introduced (the row names only NaN models already documented in the section).
- **One PR per unit of work, always against `main`; never work on `main`
  directly.**

## Operational risks

None. No scheduled job, queue, cache, schema, or external adapter is touched.
No concurrency or eventual-consistency surface.

## Security risks

None — no auth, secrets, PII, webhooks, or rate-limit surface. Text-only doc edit.

## Compliance touchpoints

n/a — no domain/compliance rules apply to a README routing-guidance table.

## Affected docs

- `README.md` — *Running on NaN.builders → Preference ladders per task* table +
  rationale prose. **This is the fix itself**, not a follow-on doc update.
- `README.es.md` — the Spanish sibling of the same section (bilingual sync).

No other doc in the CLAUDE.md documentation map references this table, so no
downstream doc update is required.

## Observability

n/a — documentation change with no runtime signal. "Live and healthy" = the row
renders in the merged README on GitHub; confirmed by the PR diff and the merged
file, not by a log/metric/alert.

## Cross-issue notes

- No open issue or PR overlaps, blocks, or is absorbed by this fix (issue has no
  comments; `docs/fix/README.md` active table shows all sibling fixes `done`).
- Prerequisite context only: the NaN routing section this extends was added by
  the merged `37-bilingual-human-docs` fix ([#50](https://github.com/gtrabanco/agentic-workflow/pull/50)).
  No live dependency.

## Effort

**XS** (1 commit, ≤ 1h) — two mechanical, mirrored doc edits (one table row +
one rationale paragraph, per language). No design decisions, no code.

## Decisions made during drafting

- **Row placement: after the Merge gates row.** The issue frames
  `design-feature` as "the merge-gate class (Mimo first), not the cheap tier".
  Placing the new **Product definition** row directly after **Merge gates**
  keeps the two Mimo-first, high-judgment ladders adjacent. (Alternative:
  after Planning/routing/triage — rejected as the ladder shape and rationale are
  merge-gate-class, not planning-class.) Re-questionable by the implementer.
- **Fold-cycle / "never weaker" prose: no edit** (see *Out of scope*). The
  issue's "if applicable" resolves to *not applicable* — that prose names no
  individual skills.
- **Rationale condensed, not verbatim.** The issue lists four rationale bullets;
  the README already documents the Qwen3.6 re-check caveat and the `GET
  /v1/models` catalog check, so the new paragraph states the row-specific
  reasoning tightly rather than duplicating existing caveats in full. The
  implementer may expand if a reviewer wants more.

## Status

`done`
