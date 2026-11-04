# Decisions — fix/398-retired-carriers

The question ledger (`open-questions@1`, the grammar `scripts/needs-input.mjs`
reads), the decisions this unit took where the issue delegates the choice, and
the assumptions it carries. Append-only: a superseded entry gets a new row
naming it.

open-questions@1
id | date | type | question | blocks | search-receipt | options | route

## Decisions

- **D1 — 2026-11-04 — S6: the `n/a` answer is the whole answer, and `check-all`
  agrees.** `checkTasksTicks`, `checkProgressEntry` and `checkPhaseLabels`
  return `{"n/a": "no ## Tasks section — legacy carrier"}` with no `valid` key;
  the dispatch blocks only on `valid === false`; `check-all` counts an `n/a` row
  as passing, so a legacy unit's aggregate prints `overall: PASS` with the three
  `n/a` rows instead of the old `missing-section` error. `checkPhaseLabels` is
  included because it shared the `missing-section` failure the issue's D3
  records, and leaving it out would make the aggregate disagree with the
  sub-checks — the exact defect S6 forbids. Why this shape: `valid: true` is the
  claim "I judged and it holds", which is false when there is nothing to judge;
  `n/a: <reason>` is the repository's own fully-valid passing row
  (`skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:16`). The
  alternative the issue allowed (aggregate keeps `missing-section`) would make
  the two halves tell different stories on the same unit, so it was discarded.
- **D2 — 2026-11-04 — S5: the `## Triaged steps` slot sits after the `## Tasks`
  sub-blocks and before `## Findings`.** The exemplars that carry it place it
  there (`docs/features/79-spec-by-reference/SPEC.md:293`,
  `docs/fix/370-pi-150-compat-reverification/SPEC.md:224`,
  `docs/fix/361-finding-severity-ladder/SPEC.md:302`), and
  `scripts/scaffold-parity.test.mjs` reads the repo twin's `## ` list as the
  required list, so the slot also lands in **both** exported templates
  (`template/docs/features/_TEMPLATE/SPEC.md`,
  `template/docs/fix/_TEMPLATE/SPEC.md`) — the parity contract accepts the added
  section (it is in the repo twin by then), so the `template/AGENTS.md`
  fallback the issue named was not needed. A copy keeps the paste note: the
  block is written by `unit-route --triage`, never re-derived by hand
  (`skills/unit-lane/SKILL.md:151`).
- **D3 — 2026-11-04 — S5: the template's frontmatter ships as a commented
  vocabulary block, not as active values.** `type: feature | fix | docs | chore`
  and `scope: trivial | … | xlarge` are the documented value domain; an active
  `scope:` would hardcode a scope on every copy and bypass the derivation S4
  fixes, and an active `type:` would overrule the folder the unit actually lives
  in (`unitFacts` reads frontmatter before the path). The copier uncomments and
  sets the two values; until then the readers fall back exactly as before.
- **D4 — 2026-11-04 — S4: the fallback reads `## Specs` through `parseSpecs`,
  not a second regex.** `scripts/unit-doc-phases.mjs` already owns the
  `**S<n> — title.**` grammar and `scripts/unit-route.mjs` already imports that
  module, so a private regex would be a second grammar over the same document —
  the drift class `scripts/unit-doc-contract.test.mjs` exists to prevent. The
  first cut of P2 carried such a regex; it was replaced before the handoff.

## Assumptions

- **A1 — 2026-11-04** — a template copy whose frontmatter block carries only
  comments is accepted by `phase-lint`, `unit-lineage`, `ceremony docs` and
  `unit-route` (PE-015). Sampled on a fixture copy in P5; if a reader rejects it,
  the block becomes active in the two repo templates only and this record is
  superseded.
- **A2 — 2026-11-04** — the differential sample over every
  `docs/{features,fix}/*/SPEC.md` is the measurement of the S4 fallback's blast
  radius (PE-016), not a formality: any unit whose derived step set moves without
  being a ≥3-`S#` spec-by-reference doc is a finding against this change.

## path-protection-records@1

The files this unit edits, for the phases that touch them. Declared here because
the unit was applied directly (no `execute-phase` run), so the records the guard
would read are written up front rather than per phase.

justification | .worktrees/398-retired-carriers/scripts/unit-route.test.mjs | P1 | 2026-11-04 | direct | red-first cases for S4 — the suite the change is judged by
justification | .worktrees/398-retired-carriers/scripts/fixtures/unit-route/docs/features/50-specbyref-many/SPEC.md | P1 | 2026-11-04 | direct | S4 fixture: ≥3 `**S#**` requirements, no frontmatter
justification | .worktrees/398-retired-carriers/scripts/fixtures/unit-route/docs/features/51-specbyref-few/SPEC.md | P1 | 2026-11-04 | direct | S4 fixture: 1 requirement, no frontmatter
justification | .worktrees/398-retired-carriers/scripts/fixtures/unit-route/docs/features/52-explicit-scope/SPEC.md | P1 | 2026-11-04 | direct | S4 fixture: explicit `scope:` wins
justification | .worktrees/398-retired-carriers/scripts/fixtures/unit-route/docs/features/53-legacy-pair/SPEC.md | P1 | 2026-11-04 | direct | S4 fixture: the legacy `## Objective`/`## Acceptance criteria` pair keeps its derivation
justification | .worktrees/398-retired-carriers/scripts/unit-route.mjs | P2 | 2026-11-04 | direct | S4 implementation: `unitFacts` reads both shapes through `parseSpecs`
justification | .worktrees/398-retired-carriers/scripts/ceremony-docs.test.mjs | P3 | 2026-11-04 | direct | S6 red-first cases
justification | .worktrees/398-retired-carriers/scripts/ceremony/docs.mjs | P4 | 2026-11-04 | direct | S6 implementation: the `n/a` answer and the `check-all` agreement
justification | .worktrees/398-retired-carriers/docs/features/_TEMPLATE/SPEC.md | P5 | 2026-11-04 | direct | S5: frontmatter vocabulary + `## Triaged steps` slot
justification | .worktrees/398-retired-carriers/docs/fix/_TEMPLATE/SPEC.md | P5 | 2026-11-04 | direct | S5: frontmatter vocabulary + `## Triaged steps` slot
justification | .worktrees/398-retired-carriers/template/docs/features/_TEMPLATE/SPEC.md | P5 | 2026-11-04 | direct | S5: the exported twin `scaffold-parity` compares against
justification | .worktrees/398-retired-carriers/template/docs/fix/_TEMPLATE/SPEC.md | P5 | 2026-11-04 | direct | S5: the exported twin `scaffold-parity` compares against
justification | .worktrees/398-retired-carriers/skills/audit-docs/SKILL.md | P6 | 2026-11-04 | direct | S1/S2: checks 10 and 11 rewritten; count stays 15
