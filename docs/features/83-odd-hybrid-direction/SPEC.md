---
# Draft — scope is set by triage, not by this draft.
type: feature
# scope: pending triage (unit-route)
---

# 83 — odd-hybrid-direction

> **DRAFT SPEC — direction contract.** Pre-triage: this document carries the
> direction and its invariants only. No phases, tasks, tests or gates are
> specified here; they are derived at triage (`bun scripts/unit-route.mjs
> --triage odd-hybrid-direction`), never invented in this draft.

## Issue

`#307` — tracked issue ([NEW FEATURE: ODD-hybrid direction — organic default
(G_Programming ODD) + owner directives + our deterministic layer](https://github.com/gtrabanco/agentic-workflow/issues/307),
opened 2026-10-21). Direction and credit: **Gentleman-Programming's ODD
(Organic-Driven Development)** — [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai),
default workflow since v3; ODD and the delegation write-up already
cross-referenced from #260.

**One-line shape** (the issue's own words): *organic where ODD is organic (we
are currently bureaucratic there), deterministic where we already lead
(unit-route, needs-input, phase-lint, diff-guard — and #305/#303 next).*

## The mapping that motivates this

Verbatim from the issue — the mapping between ODD's principles and this
project's current state:

| ODD principle | Our current state |
|---|---|
| Small understood work runs **inline, gate only** — no pipeline | T0/T1/T2 tiers defined in #260 (owner-decided 2026-09-24) but **never wired**; every unit pays full ceremony |
| Substantial work = **ONE recoverable feature document** | We grew to 1 unit doc + 3 ledgers + marks-on-marks (unit 258: 440-line SPEC, 1,151-line ledger) |
| **Test-first default**: one RED test per requested rule, nothing padded | Exists (dispatcher's 22 red-first tests) but not the default; prose units get review findings instead of tests |
| **Honest state**: no task completes because an agent reported confidence | Violated: F30→F48→F50, `verified` rows with failing validators — exactly what #305 mechanizes |
| Review (RDD) is **informational, risk-gated, non-blocking** | Our review is mandatory-blocking for everything; unit 258 burned 12 review→fold cycles |
| **Whatever can be computed is computed** (states, routes, hashes, limits) | ✅ Our strength: unit-route, needs-input, phase-lint, diff-guard; #305 + #303 extend it |
| Uncertainty → **one focused question, wait** | ✅ Replicated well: the needs-input dispatcher + `open-questions@1` |

## Specs

Requirements, quoted from the issue verbatim (spec-by-reference).

**S1 — Adopt the organic half of ODD on top of the deterministic layer.**
> **Direction contract**: adopt the *organic* half of Gentleman-Programming's **ODD (Organic-Driven Development)** ([gentle-ai](https://github.com/Gentleman-Programming/gentle-ai), default workflow since v3) on top of the deterministic layer this project already leads with, improved with the owner's recorded directives (ceremony proportional to risk, reviews are expensive, positive prescription, impact surfaces, unit sizing, receipt-neutrality).

**S2 — The hybrid, in four layers.**
> 1. **Organic default (from ODD)** — explore before changing; understood+small runs inline with the gate only (T0); substantial work tracks in ONE document (the unit doc, slimmed); test-first with one RED test per rule; unresolved uncertainty becomes one focused question and the run waits (the needs-input dispatcher).
> 2. **The owner's improvements over ODD** — ceremony proportional to *risk*, never size (the #260 tier signals); impact surface cut at plan (callers / consumers / survivors sweep); positive prescriptions (checklists over prohibitions); unit sizing = one surface per unit with the 400-line budget measured at *unit* level and no self-serve exceptions; bounded corrections (blockers-only re-check — already adopted into #260 from the cross-reference); **receipt-neutrality**: no new receipt, mark or ledger enters without retiring an older one.
> 3. **Determinism (ours, extended)** — states, routes, hashes, limits and transitions stay in scripts so model tokens buy judgment; #305 adds promise-coherence (every executable claim reproduces at the head); #303 adds the sizing/impact rule at plan time; the document verifier (#260 non-negotiable 2) closes the writer/verifier split.
> 4. **Review repositioned** — informational evidence for low-risk work (RDD's stance), full `review-change` only at T2, re-checks bounded to blockers, the two-cycle cap as a hard stop. Reviews verify; they never re-derive design.

**S3 — The ODD trade: ceremony must shrink, not stack.**
> - Full ceremony as the universal default → tier-routed ceremony.
> - The review→fold loop as the *convergence mechanism* → deterministic gates converge; reviews judge risk.
> - Prose re-verification rituals (re-running declared validators by hand across cycles) → #305's automated promise-coherence run.
> - Marks-on-marks growth (VF rows documenting folds of folds) → the producer emits the mark once.

**S4 — Measured acceptance.**
> Measured acceptance stays #260's: tokens and wall-clock per unit, per tier, before/after over ≥3 real units. No prose deletion without the measurement.

## Pruning invariant

Absorbed into #307 from #260 (owner-decided 2026-09-24, narrowed; absorbed
2026-10-28). Pruning targets **ceremony that restates a machine value or
duplicates a check a script can own** — version/count tables duplicated in
prose, contract text copied into several skills, per-finding ledger rows a
producer can emit, turn-contract boxes recited instead of machine-checked.

A prose block, receipt, ledger or box may be removed **only** if:

- (a) a deterministic script already owns that check (`scripts/*.mjs`
  producers), or
- (b) it is machine-checkable from a committed artifact.

Otherwise it **stays**. "A strong model did not need it" is **not** a valid
justification — the portability guarantee (any model strength, 70+ agents via
the `skills` CLI) is the stated goal that justifies the prose in the first
place. In #307's measured, stronger form the cut is **architectural**:
contracts move to **rendered/deterministic surfaces**, not shorter prose
(gentle-ai ships 1,119 lines of `SKILL.md` across 11 skills vs this repo's
8,800 including references). The narrowed invariant above remains the
per-item test; **receipt-neutrality** (no new receipt, mark or ledger enters
without retiring an older one) bounds growth.

This invariant does **not** touch the four non-negotiables below. They are
not ceremony; they are the audit surface.

## The four non-negotiables

What must survive any pruning (owner-decided 2026-09-24, #260):

1. **An external verifier.** Verification is never performed by the writer.
   Independence rules are the existing ones: never weaker than the writer,
   and context-clean for judgment verdicts (feature 05). Cheap is fine — a
   *different family* cheap model is exactly what the adversarial row already
   recommends; independence, not price, is the requirement.
2. **A document verifier, distinct from the document-writing CLI.** A
   **verifier** checks what was written against the frozen schemas
   (`UNIT_DOC_REQUIRED_SECTIONS`, `EVIDENCE_COLUMNS`, `PROGRESS_ENTRY_PATTERN`,
   roadmap columns, CHANGELOG pattern) and fails closed. Writer and verifier
   stay separate tools; `scripts/phase-lint.mjs` is the existing precedent
   for the pattern. **It must be a deterministic script, not LSP** (verified
   finding 2026-09-24: TS false positives on non-code files).
3. **Evidence and acceptance criteria keep being authored.** The Evidence
   table and the numbered acceptance criteria remain curated artifacts, not
   generated filler and not removed by the slimming — a CLI may help write
   them, the verifier checks them, but a human/model decision puts them
   there.
4. **Engram persistence.** The unit's goal, acceptance criteria, evidence and
   discoveries are saved to Engram at unit boundaries (save/recall protocol),
   so recall does not depend on re-reading docs, and a lost orchestrator
   context is recoverable.

## Relations

Verbatim from the issue's *Mechanics / relations* section:

- #260 carries the topology and the tier signals; this contract is the
  *direction* both #260 and #303/#305 implement.
- #303 (already carrying #306): plan-time sizing, impact surfaces, positive
  prescription — layer 2 + 3.
- #305: promise-coherence guard — layer 3's enforcement of ODD's honest-state
  rule.

## Non-goals

Verbatim from the issue:

- No adoption of gentle-ai's CLI, model-per-role table or review-lens
  taxonomy (rejected, recorded in #260).
- No softening of the four non-negotiables (external verifier, document
  verifier, authored AC/Evidence, Engram persistence).
- No workflow change lands without its measured token delta.

## What is not in this draft

Deliberately absent until triage derives them — this draft invents none of
them: phases, tasks, acceptance criteria, test impact, risk-tier verdict,
ledgers, triaged steps. The `## Specs` above and the issue body are the whole
input triage consumes.

## Log

- **L1** — 2026-10-21, the request, verbatim (issue #307, title):
  ```
  NEW FEATURE: ODD-hybrid direction — organic default (G_Programming ODD) + owner directives + our deterministic layer
  ```
  Full body lives in the issue; its sections are quoted as `## Specs` and the
  sections above.

## References

- Issue [#307](https://github.com/gtrabanco/agentic-workflow/issues/307) —
  this direction contract
- Issue [#260](https://github.com/gtrabanco/agentic-workflow/issues/260) —
  execution topology, tier signals, pruning invariant (narrowed
  2026-09-24), the four non-negotiables, measured acceptance
- Issue [#303](https://github.com/gtrabanco/agentic-workflow/issues/303) —
  plan-time sizing, impact surfaces, positive prescription (layers 2+3)
- Issue [#305](https://github.com/gtrabanco/agentic-workflow/issues/305) —
  promise-coherence guard (layer 3)
- [gentle-ai](https://github.com/Gentleman-Programming/gentle-ai) — ODD
  (Organic-Driven Development), Gentleman-Programming; credit per S1
