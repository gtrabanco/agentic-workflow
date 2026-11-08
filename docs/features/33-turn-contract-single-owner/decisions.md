# 33 — turn-contract-single-owner — decisions

Path-protection records for this unit (append-only; owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md`):

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | scripts/turn-contract-single-owner.test.mjs | the final-phase grep gate (S4) is a test-only pin over `skills/*/SKILL.md`; a test file under `scripts/` is the only surface the root suite discovers, and it carries no side effects
created | docs/features/33-turn-contract-single-owner/ | the unit's own ledger home (SPEC + planning ledgers + decisions), the path this document lives in
created | docs/features/33-turn-contract-single-owner/*.md | its planning ledgers and log
created | .changeset/turn-contract-single-owner.md | the release intent file the parity gate requires for a skill change
modified | skills/*/SKILL.md | the migration target set: each bespoke `## Turn contract` section is rewired to load the canonical contract (S3)
modified | skills/orchestration-envelope/references/TURN_CONTRACT.md | the read-only profile (S2), prose only
modified | docs/workflow/SKILL_AUTHORING.md | the authored turn-contract rule this unit supersedes is amended in the same change (docs currency)
modified | docs/workflow/SKILL_CONTEXT_BUDGETS.json | only if the context arithmetic demands a re-base (O4)
```

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/turn-contract-single-owner.test.mjs | P1 | 2026-11-08 | execute-phase | S4's grep gate must be a test the root suite runs; a test-only file under `scripts/` is the repo's established pin carrier and no executable code is added. Red-first (§2 of the apply-command): the suite lands alone, observed failing on the live tree's 11 bespoke sections.
justification | docs/features/33-turn-contract-single-owner/SPEC.md | P1 | 2026-11-08 | execute-phase | The unit's own ledger home; the apply-command (L1) substitutes for the lane's plan step and freezes the ledgers here in the repo's own shapes.
```

## Decision log

- **D-33-1 (2026-11-08)** — Unit home: `docs/features/33-turn-contract-single-owner/`
  from the feature template, not `docs/fix/173-…`: the issue is a feature
  (roadmap row 33, `feat/` branch, `enhancement` label) and the repo's own
  convention names feature unit dirs by roadmap row (`docs/features/52-…` for
  issue #226). The apply-command's `docs/fix/` path was resolved as the fix-lane
  spelling of the same rule. Recorded so the lineage readers find the unit.
- **D-33-2 (2026-11-08)** — The scope list is the live-tree recount (11 bespoke,
  4 canonical), superseding the stale 9-list of the 2026-11-03 re-scope; legend
  in SPEC `## Impact`. Task order is size-ascending after the two prerequisites
  (gate test, read-only profile) — dependency-topological first, smallest within
  a ready set.
- **D-33-3 (2026-11-08, pre-implementation amendment)** — The recount widened
  from 11 to **14** bespoke sections: `execute-phase`, `init-workspace`,
  `unit-lane` reference `TURN_CONTRACT.md` elsewhere in their bodies (the
  open-questions pointer), which the 2026-11-03 re-scope's file-level metric
  counted as "canonical", but their `## Turn contract` sections never load the
  contract. S1's own words ("All skills load this + skill-specific additions
  only. Duplication forbidden") and the pinned gate decide the in-section rule.
  Their migration is the cheap form — a loader line, additions preserved, only
  duplicated canonical-owned boxes removed. PE-001, O3, O8 and the task list
  renumbered accordingly (P3–P16 migration, P17 close, P18 verification).
