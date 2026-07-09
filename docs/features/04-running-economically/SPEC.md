# 04 — running-economically

> Feature specification. Size S — this SPEC is the only planning artifact;
> implement with `execute-phase 04` in a single pass. Closes #11.

## Goal

Teach the workflow to run **cheaply without losing quality** by writing down
three operating facts it currently leaves to folklore: (1) between units/phases
you start a **fresh conversation** and let `log-session` + the SPEC/TASKS/progress
docs carry memory — you do **not** compact; (2) the end-of-unit review should
prefer a **different model family** than the writer's, not just an equal-or-stronger
one; (3) an external driver maximizes **prompt-cache** hits with byte-stable
prefixes and never switches model mid-unit. All three are docs/guidance additions
to existing files — no behavior changes beyond a single cross-family sentence in
two skills.

## Branch

`feat/04-running-economically`

## Size

`S` — three guidance additions across existing docs plus one sentence added to a
rule in two skills; one small PR, single pass.

## Dependencies

None. First unit of the 2026-07-09 backlog chain (U1); nothing depends on it and
it depends on nothing. (Issue #11.)

## Context

The repo already documents *which* model tier to point each skill at
(README "Recommended model & effort" + "Model equivalence"), and ORCHESTRATION.md
documents per-step tier choice for an external driver. But three cost-shaping
facts agreed in the 2026-07-09 design session are written nowhere:

- **Context hygiene.** `grep -rniI "compact"` across `docs/` and `skills/`
  returns nothing — the workflow never states that compaction is expensive or
  that a fresh conversation is nearly free. This omission caused a real token
  spike: auto-compaction re-reads the **entire** conversation with the
  **currently selected** session model and fires near the context limit (exactly
  when re-reading costs most), whereas the workflow's docs (SPEC/TASKS/progress +
  `log-session`) already *are* the persistent memory, so a new conversation
  reloads only those.
- **Cross-family review.** The invariant "never review a change with a model
  weaker than the one that wrote it" appears in `skills/review-change`,
  `skills/execute-phase`, and both READMEs — but it stops at *strength*.
  Same-family model instances share training blind spots; a cross-family reviewer
  decorrelates errors. The rule should say "…and prefer a different model
  **family** than the writer's."
- **Driver prompt-cache.** `grep -rniI "prompt cache"` returns nothing.
  ORCHESTRATION.md tells a driver to pick a tier per step but never that
  byte-stable prefixes and a short invocation window win cache hits, nor that
  switching model mid-unit invalidates both the cache and the style.

## Business goals

n/a — internal workflow economics.

## Technical goals

- Make the cheap way to run the flow the **documented** way, with the cost
  mechanism stated (not just the rule) so any operator — human or driver —
  understands *why*.
- Keep it fully **portable**: guidance only. No skill-driven compaction
  automation (compaction mechanics are agent-specific and not part of the
  contract).
- Touch the cross-family rule **everywhere it appears** so the four copies stay
  consistent (audit-docs would otherwise flag drift).

## Scope

### In scope

1. **Context-hygiene section** — primary home `docs/workflow/FEATURE_WORKFLOW.md`
   (a new `## Context hygiene & cost` section), with a short fixed-rule pointer
   added to `template/CLAUDE.md` under its `## Session log` section so target
   projects inherit the operating rule. Fixed rules to state:
   - End of unit **or** phase → run `log-session`, then start a **new
     conversation**. Never compact to cross that boundary.
   - Hand-offs to review/audit → always a fresh conversation (already the
     contract; now with the economics stated for *why*).
   - Compact **only** mid-phase when you hold unpersisted state you cannot afford
     to lose — and even then prefer committing WIP + a `progress.md` note and
     cutting to a new conversation.
   - Cost facts, stated plainly: compaction re-reads the **entire** conversation
     with the **currently selected** session model (input) and writes the summary
     (output); auto-compact fires near the context limit, i.e. when re-reading is
     most expensive; a fresh conversation costs ~zero because SPEC/TASKS/progress
     + `log-session` are the persistent memory.
2. **Cross-family review line** — extend the existing rule "never review a change
   with a model weaker than the one that wrote it" with "…and prefer a different
   model **family** than the writer's (same-family instances share training blind
   spots; cross-family decorrelates errors)". Apply the addition to **all four**
   current locations:
   - `skills/review-change/SKILL.md` (Portability) — **patch** bump.
   - `skills/execute-phase/SKILL.md` (Portability) — **patch** bump.
   - `README.md` (the two-invariants paragraph, ~line 319).
   - `README.es.md` (the Spanish equivalent, ~line 329).
3. **Driver prompt-cache guidance** — a new subsection in
   `docs/workflow/ORCHESTRATION.md` (near "Replacing `/loop`"): keep the
   system prompt / preamble **byte-stable** across invocations (same skill → same
   prefix) to maximize cache hits; group a unit's invocations within a short
   window (cache TTL ~5 min); **never switch model mid-unit** (invalidates cache
   *and* style). Note that a one-invocation-per-step driver never needs
   compaction at all.
4. **bump-skill bookkeeping** — `CHANGELOG.md` + `CHANGELOG.es.md` rows for the
   two patched skills; README EN/ES skill/model tables unchanged (no new skill,
   counts and tiers unchanged — only the invariant-line prose is edited by hand).

### Out of scope / non-goals

- **A new standalone doc** (e.g. `RUNNING_ECONOMICALLY.md`) — the issue places
  each topic in its existing home; a new page would fragment the guidance and
  isn't warranted for three additions.
- **Skill-driven compaction automation** — explicitly rejected (agent-specific,
  not portable). Guidance lives in docs only; no skill *does* anything with it.
- **Any behavior change to a skill** beyond the one cross-family sentence — no
  new flags, no gate changes, no output-contract changes.
- **Phase economics / cheap-executability checklist** — that is U5
  (`plan-feature-scaffold`), a separate unit.
- **Adding `ORCHESTRATION.md` to the `docs/workflow/README.md` Pages table** —
  a pre-existing map gap, not this unit's job (leave for U11's docs batch).

## Architecture impact

None. Markdown-only additions to existing docs plus one sentence in two skill
bodies. Preserves the stack-agnostic rule: concrete model names appear only where
they already do (README equivalence tables); the new guidance uses generic
phrasing ("the session model", "a different model family", "the driver").

## Design

- **Placement contract** (so the implementer doesn't improvise homes):
  - Context hygiene → `## Context hygiene & cost` in `FEATURE_WORKFLOW.md`,
    inserted after `## Stage 2 — Execute, one phase at a time`; 2–3 line pointer
    in `template/CLAUDE.md` under `## Session log`.
  - Cross-family → append to the existing sentence in the four files listed
    above; do **not** restructure the surrounding paragraph.
  - Prompt-cache → `## Prompt-cache economics` in `ORCHESTRATION.md`, after
    `## Replacing `/loop` (the driver loop)`.
- **Exact cross-family clause** (identical wording in all four, adapted to
  language): after "…weaker than the one that wrote it", add
  "— and prefer a different model **family** than the writer's: same-family
  instances share training blind spots, cross-family decorrelates errors."
- **Version rule**: only `review-change` and `execute-phase` are edited as
  skills → **patch** bump each; run `bump-skill` for both.

## Decisions to confirm

- **D1 — no new doc; edit existing homes.** Chosen per issue #11 (context hygiene
  → FEATURE_WORKFLOW/template; cache → ORCHESTRATION; cross-family → the rule's
  existing copies). Keeps the pack to one small PR and avoids doc fragmentation.
- **D2 — context-hygiene primary home is `FEATURE_WORKFLOW.md`, with a short
  rule mirrored into `template/CLAUDE.md`.** The issue says "and/or"; putting the
  full economics in the tutorial and a fixed rule in the template gives both the
  explanation and the inherited operating rule. (If the lead prefers template-only
  or FEATURE_WORKFLOW-only, narrow here.)
- **D3 — the cross-family clause is guidance ("prefer"), not a hard gate.**
  Chosen: model-family availability varies by fleet; a hard requirement would be
  unenforceable on single-family setups. The strength invariant stays hard.

## Acceptance criteria

- `docs/workflow/FEATURE_WORKFLOW.md` contains a `## Context hygiene & cost`
  section stating all four fixed rules and the compaction cost mechanism;
  `template/CLAUDE.md` `## Session log` carries the short fixed-rule pointer.
- `grep -rniI "prefer a different model family" skills/review-change/SKILL.md
  skills/execute-phase/SKILL.md README.md` returns **three** hits — the English
  copies carry the byte-identical clause; `README.es.md` carries the deliberately
  Spanish-worded equivalent ("prefiere una familia de modelo distinta..."),
  verified manually since it will never match an English-only grep.
- `docs/workflow/ORCHESTRATION.md` contains a `## Prompt-cache economics`
  subsection covering byte-stable prefixes, the ~5-min-window grouping, the
  never-switch-model-mid-unit rule, and the one-invocation-per-step / no-compaction
  note.
- `skills/review-change/SKILL.md` and `skills/execute-phase/SKILL.md` are
  **patch**-bumped; `CHANGELOG.md` + `CHANGELOG.es.md` have a row for each.
- `npx skills add . --list` still lists every skill; markdown links resolve; no
  stack-specific names leaked outside the existing README equivalence tables.
- The PR body carries `Closes #11`.

## Testing requirements

Docs-level gate (CLAUDE.md → Verification): `npx skills add . --list` exit 0;
markdown link sweep across changed docs; stack-leak grep confirms no new
product/stack names outside the README equivalence tables; the acceptance-criteria
greps above run as the executable checks.

## Dev scenarios

n/a — documentation and a one-sentence rule extension; no runtime surface, no
failure modes to reproduce.

## Phases

Single-pass (`execute-phase 04`) — no PLAN/TASKS. Close-out: run `bump-skill`
for the two patched skills, open the PR with `Closes #11`, print its URL, set the
roadmap row → done. The completion `CHECKLIST.md` is written at close-out
(matching features 02 and 03).

## Deploy & rollback

n/a — merging is enough; rollback is a revert of the single PR.

## Open questions / risks

- R1 — the four cross-family copies could drift again later; mitigated by
  `audit-docs` (cross-document coherence) and by keeping the clause wording
  identical so a grep catches any single-copy edit.

## Deliverables

Edits to `docs/workflow/FEATURE_WORKFLOW.md`, `docs/workflow/ORCHESTRATION.md`,
`template/CLAUDE.md`, `skills/review-change/SKILL.md`,
`skills/execute-phase/SKILL.md`, `README.md`, `README.es.md`, `CHANGELOG.md`,
`CHANGELOG.es.md`; this SPEC; the roadmap row 04. PR closes #11.

## Post-merge next feature

`05` (U2 — adversarial, context-clean end-of-unit review; issue #12) — see
`docs/features/ROADMAP.md`. The backlog chain is U1→U2→U3→…
