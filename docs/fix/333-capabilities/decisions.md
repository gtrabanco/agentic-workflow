# Decisions — fix/333-capabilities

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/capability-inventory.test.mjs | P2 | 2026-11-03 | execute-phase | The suite is cut red-first in this same phase (P2), and this edit repairs its just-written reader: the placeholder predicate tested the raw cell, which is wrapped in a code span, so the red case reported zero placeholder cells instead of the template's thirteen. No assertion is relaxed or narrowed — every case stays exactly as written red, and the repaired predicate is wider (it strips the code span before matching).
```

## D1 — one procedure owner, one write gate, one exported header

The three surfaces the issue names get **one** owner each, never a copy:
`capability-inventory@1` (the six ordered moves) and `capability-evidence@1`
(one probe row per candidate) live only in
`skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`; the post-write gate
lives only in `BOOTSTRAP_WRITE.md`; `UPGRADE.md` points at both. The no-assumption
rule stays with its existing owner (`ask-dont-infer` in
`skills/unit-lane/references/DESIGN.md`) and is referenced, never restated —
`scripts/residue-dimensions.test.mjs` counts restatements across `skills/`.

Authority: issue #333 S6, S7, S8, S9, and `AGENTS.md`'s "Every repetition names
its owner" rule.

## D2 — the repository's inventory is repaired by deleting, not by marking `no`

This repository's nature (markdown skills + a copyable scaffold + Node scripts,
published as three npm packages; no server, no UI, no request path) cannot carry
four of the template's candidates at all, so `Navigation (menus, dashboard)`,
`Notifications (email, push, in-app)`, `File / media storage` and
`Billing / payments` are **deleted** rather than written `no`. The nine remaining
candidates keep a state that a cited path proves, and three project-specific rows
(skills distribution, scaffold export, deterministic gates) are added — the
template's list is a candidate set, not a ceiling.

Authority: issue #333 S1, S13 ("an absent subsystem is not a `no`").

## D3 — the acceptance section stays, and the mismatch it exposes is recorded

`skills/verification-contract/SKILL.md` names a unit doc `## Acceptance criteria`
section that the re-cut section list
(`packages/agentic-workflow-schema/src/pre-execution.ts`:
`UNIT_DOC_SPEC_REF_SECTIONS`) does not publish. This unit carries the section
because its instructions freeze the per-`S#` criteria there, and no gate reads a
live unit's section list (`phase-lint` has no exact-section rule;
`scripts/unit-doc-contract.test.mjs` reads the two templates only). The mismatch
is a known issue in the unit doc, not repaired here: changing the contract is
outside #333's scope.

Authority: the change's cut instructions, §5; known issue recorded in
`docs/fix/333-capabilities/SPEC.md`.
