# Decisions — 15-injection-safe-urgency

Append-only. Each entry dated, with what was decided and why. Never rewrite or
delete a prior decision.

## 2026-07-11 — Product design (design-feature, from issue #42)

Designed the Product half from issue #42 and its 2026-07-11 refinement comment.
The issue listed four open questions; resolved as follows.

### Resolved

- **Label granularity → two labels.** `urgent` (evaluate for interrupt-now,
  reaches the judge) + `fix-next` (head of queue, never interrupts). Chosen over
  a single `urgent` label because the non-interrupting priority is a genuinely
  distinct signal and, as its own capability-gated label, can never be escalated
  to an interrupt by attacker-controlled text.
- **Trust check → presence-only.** `workflow-status` reads the label object and
  trusts its presence; it does **not** cross-check the labeling actor's triage+
  permission via the issue timeline. Label application is already
  capability-gated by GitHub, so presence suffices. The label vocabulary is
  **owned/defined by `triage-issue`** (single writer, no cross-skill drift).
- **`init-workspace` label seeding → included in this feature.** Seed `urgent` +
  `fix-next` (name + color) at scaffold time and via upgrade mode
  (additive-only), so the convention lands in target projects from day one.
- **Rule-table location → the judge's system prompt** (already resolved by the
  issue's refinement comment; recorded for traceability). Canonical copy in
  `docs/workflow/ORCHESTRATION.md`; `ship-roadmap` SELECT references it rather
  than forking a second copy.

### Deferred (not in this feature)

- **Timeline / actor-permission cross-check.** Verifying the labeling actor still
  holds triage+ permission via `gh api .../timeline` `labeled` events is deferred
  defense-in-depth. Revisit only if a demoted-actor threat materializes; the
  capability gate on label application already covers the primary case.
- **Judge model id.** The rubric fixes *cheap-tier, clean-context, tool-less*; the
  exact model is an Engineering-half decision for `plan-feature`, not a product
  one.

### Invariants carried into planning

- Urgency is derived **only** from the labels object — never from title, body, or
  comment text. Unlabeled issues never reprioritize anything.
- The judge is **tool-less**, closed-binary (`FINISH_FIRST | INTERRUPT_NOW`),
  rubric-as-system-prompt, fail-safe default `FINISH_FIRST`, preceded by a
  deterministic short-circuit.
- `workflow-status` reports facts only — the pause-vs-finish decision lives solely
  in the consumer.
- Interrupt/park reuses `RESUMABLE` + `execute-phase` idempotent re-entry — no new
  park/resume machinery.

## 2026-07-11 — Engineering plan (plan-feature-scaffold)

Filled the Engineering half from the designed Product half. Size **M**.

### Resolved (engineering)

- **Judge model → a tier, not a pinned id.** The rubric names *cheapest capable
  tier in the fleet · clean context · tool-less*; no concrete model id is written.
  Resolves the Product-half deferral ("judge model id is an Engineering decision").
  Rationale: the workflow is model-agnostic across 70+ agents (README
  model-equivalence table) — pinning an id would break portability.
- **Label colors → convention, not contract.** `urgent` `#B60205` (red),
  `fix-next` `#D93F0B` (orange). The **name** is the contract; the color is
  cosmetic and a repo may recolor.
- **Both labels on one issue → `urgent` wins.** The interrupt-evaluating path
  strictly dominates head-of-queue; stated in the sensor + rubric.
- **Phase count → 5, no split.** Held to the ~5-phase ceiling (P1 triage-issue ·
  P2 workflow-status · P3 consumer judge · P4 init-workspace · P5 Hardening & PR).
  Each phase is one skill/concern with zero open decisions, so the mandatory split
  rule does not trigger. P3 edits a doc (`ORCHESTRATION.md`) **and** a skill
  (`ship-roadmap`), but as one concern — the doc IS the rubric and ship-roadmap
  only points at it; no independent decision spans the two edits.
- **`detail.urgent` shape → open `detail` extension.** The field extends the
  envelope's open `detail` object; expected no schema/type change to
  `packages/agentic-workflow-schema/`. P2 must confirm this — if the schema pins
  `detail`, mirror the field there in the same PR (per CLAUDE.md's schema-mirror
  rule).

### Invariants carried into execution

- The one data-flow path `label object → sensor field → consumer judge`; text
  never creates urgency.
- Single owner (`triage-issue`) of the label vocabulary; one canonical rubric
  (`ORCHESTRATION.md`); sensor never decides; judge tool-less by construction.
- Every `SKILL.md` edit ⇒ `bump-skill` (minor) in the same PR; `ORCHESTRATION.md`
  is a doc (no bump). PR body `Closes #42`.
