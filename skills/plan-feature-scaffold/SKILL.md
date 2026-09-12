---
name: plan-feature-scaffold
model: opus
effort: medium
user-invocable: false
version: 2.2.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal step of plan-feature: from an already-designed SPEC (product half
  `designed`), fill the **engineering half** and generate the planning
  artifact set scaled to the feature's size (XS/S → SPEC-only with ≥ 2 phases
  in the SPEC, last = Hardening & PR; M/L → full set with a hardening phase),
  freeze one compact ACCEPTANCE.md for every size, and register the roadmap
  entry. Docs only — never code.
---

# Plan Feature — Scaffold (internal)

Turn a designed feature into the project's complete planning artifact set,
ready for phase-by-phase execution. Fills only the SPEC's **engineering half**
— the product half (goal, context, scope, capability closure) already exists
and is marked `designed` before this skill ever runs (`plan-feature`'s
redirect gate guarantees it). **Docs only — never code.**

## When to use

- The `plan-feature` router calls this once a feature's product half is
  `designed` — from `design-feature`, `plan-feature-from-issue`, or an
  already-scoped slug/SPEC — to fill the engineering half of its
  `docs/features/<NN>-<slug>/SPEC.md` and the rest of the folder, then update
  the roadmap.

Not for product definition (that is `design-feature`) or writing code (that is
`execute-phase`) or deciding *whether* to build (that is the `plan-feature`
router / `triage-issue`).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the feature SPEC **template**, the **roadmap**
(numbering/order/deps), 1–2 recent feature folders to mirror the artifact set, and
the architecture/domain docs the map points to. No template/roadmap → fall back to
the agent guide and state the assumption.

## Progressive loading — scaffold only after discovery

The reference allowlist is exactly one path. After Step 0, read and execute the
complete [scaffold process](references/SCAFFOLD_PROCESS.md). It owns the product-
half gate, artifact scaling, roadmap transition, re-read, and fixed completion
report. The [phase contract](<../phase-contract/SKILL.md>) owns the 8-box
phase-lint and the normalized phase fingerprint.

The resource is normative and one hop from this file. Missing resource → stop;
never reconstruct phase or close-out wording from memory.

The [verification contract](<../verification-contract/SKILL.md>) owns the
`ACCEPTANCE.md` schema, validation ladder, and anti-weakening rules. Consume it
after the engineering plan is complete and before registering `planned`.

## Research and reference trace (plan stage)

- **Conditional web research.** Plan-stage research runs only when a bounded
  question (ROWS.md Q1–Q5) cannot be answered from repository evidence: run
  exactly one web pass before the phases are emitted and freeze what it
  returns as evidence rows (URL and access date). A question the repository
  answers is never re-fetched.
- **Mandatory reference trace.** Affected code is located by symbol/reference
  search — LSP/serena when the environment offers it, grep otherwise — and the
  blast radius is derived from that search, never from model memory: added or
  changed code can break callers the plan must name.

## Guardrails

- Docs only. No source edits, migrations, or dependencies.
- Respect the architecture: honor layer rules (inner layers don't import outer)
  and any domain/i18n/SEO/a11y rules from the docs map.
- **Architectural invariants.** The [planning preflight](<../planning-preflight/SKILL.md>)
  owns the normalized repository state read and the ONE final architectural
  classification for the whole plan; consume it here. Its absence is compatible:
  record `n/a: no project invariants declared` in the engineering half. For
  every applicable rule, record its ID, repository evidence, and
  `preserves | violates | introduces | changes` classification in
  `### Architecture impact`. Only `preserves` may produce phases; the other
  classifications stop for an explicit architectural decision through the
  project's declared authority — and only after the full plan exists, never
  converted into a phase task or inferred from the product half.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise honor the project's **Workflow conventions** (branch/PR, docs-language).

## Relationship to other skills

Invoked by the `plan-feature` router (after `design-feature` /
`plan-feature-from-issue` designed the product half, or directly for an
already-designed scoped slug/SPEC). Hands off to `execute-phase` for P1;
`audit-docs` audits anytime.

## Done when

- `docs/features/<NN>-<slug>/` exists with the SPEC's engineering half +
  `ACCEPTANCE.md` + every scaled planning artifact filled — the product half untouched from what
  `design-feature` / `plan-feature-from-issue` wrote.
- The roadmap lists the feature with correct number, order, dependencies, and
  **status `planned`** (the `defined → planned` write this skill owns) —
  **re-read and confirmed after the write**, not assumed from having run it.
- No code changed; open questions captured in `decisions.md`.
