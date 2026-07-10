# 13 — init-workspace-upgrade-mode · TASKS

Per-phase checklists the executor ticks off. Command-checkable criteria are the
command; genuinely judgement-only ones are labelled `read-verified`. Run all
commands from the repo root.

## P1 — Upgrade mode in `init-workspace`

- [x] Extend Step 0 detection in `skills/init-workspace/SKILL.md`: existing
      agentic-workflow scaffold (marker: `CLAUDE.md` + `docs/features/ROADMAP.md`
      or `docs/workflow/`) → offer **upgrade** as default. `read-verified` —
      `skills/init-workspace/SKILL.md` Step 0, first bullet.
- [x] Add the **Upgrade mode** process section with the six ordered steps
      (fetch current template · diff · read `MIGRATION.md` · propose-only-missing
      short interview · additive write · report). `read-verified` —
      `skills/init-workspace/SKILL.md` `## Upgrade mode` section.
- [x] Add the **additive-only, never-clobber** invariant to Guardrails.
      `read-verified` — `skills/init-workspace/SKILL.md` `## Guardrails`,
      second bullet.
- [x] `grep -qi "upgrade mode" skills/init-workspace/SKILL.md` exits 0.
- [x] `grep -qi "MIGRATION.md" skills/init-workspace/SKILL.md` exits 0.
- [x] `grep -qiE "diff|current template" skills/init-workspace/SKILL.md` exits 0
      (diff-against-current-template contract present).
- [x] `grep -qiE "never (clobber|overwrite)|additive" skills/init-workspace/SKILL.md`
      exits 0 (never-clobber invariant present).
- [x] Commit planning artifacts: `git add docs/features/13-init-workspace-upgrade-mode
      && git commit -m "docs(13-init-workspace-upgrade-mode): planning artifacts"`
      — commit `04f9edd`.
- [x] Register roadmap row 13 in `docs/features/ROADMAP.md` (`planned`, deps
      `06 07 08`); `grep -q "13 | .init-workspace-upgrade-mode" docs/features/ROADMAP.md`
      (row exists) — done in `04f9edd`.

## P2 — Documented recommendation + hardening

- [ ] Add the "updating an existing install" recommendation to `README.md`:
      `grep -q "init-workspace" README.md` exits 0 and the ordered path
      (update skills → `MIGRATION.md` → `init-workspace` upgrade → optional
      `product-audit`) is present — `read-verified`.
- [ ] Same recommendation in `README.es.md`: `grep -q "init-workspace" README.es.md`
      exits 0; wording is the ES translation — `read-verified`.
- [ ] Same recommendation in `docs/workflow/MIGRATION.md` (dated note).
      `read-verified`.
- [ ] Harden the four failure edges in `skills/init-workspace/SKILL.md`
      (`no-drift`, `no-migration`, `tailored-block`, `bootstrap-unchanged`) —
      each stated explicitly. `read-verified`.
- [ ] Run `bump-skill` for `init-workspace` (minor). Verify:
      `grep -q "^version: 2\.[1-9]" skills/init-workspace/SKILL.md` (bumped above
      2.0.0); a new `init-workspace` row exists in `CHANGELOG.md` and
      `CHANGELOG.es.md`; README skill tables updated — `read-verified`.
- [ ] `audit-docs` passes (no roadmap/folder/link drift, no leaked
      stack/real-project reference). `read-verified`.
- [ ] Open the PR: `gh pr create --base main --body-file <path>` with `Closes #20`
      in the body; **PRINT THE PR URL in the chat**.
- [ ] Update roadmap row 13 → `done · [#<pr>](<pr-url>)`.
- [ ] Commit `docs: link PR #<n>` and push.
