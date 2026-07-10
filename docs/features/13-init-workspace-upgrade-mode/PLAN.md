# 13 — init-workspace-upgrade-mode · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` and called *phases*.
Planning (this artifact set) is done; `P1` is the first implementation phase and
also commits the planning artifacts. The last phase (`P2`) is hardening. Opening
the PR is the final *step* of `P2`, not a phase of its own.

## P1 — Upgrade mode in `init-workspace`

Add the new mode to the skill body — the substantive behavioral change.

- In `skills/init-workspace/SKILL.md`, extend **Step 0** so an existing
  agentic-workflow scaffold (marker heuristic: `CLAUDE.md` + `docs/features/ROADMAP.md`
  or `docs/workflow/`) is offered **upgrade** as the default action, distinct
  from bootstrap's merge/adapt/abort.
- Add an **Upgrade mode** process section covering, in order and unambiguously:
  1. fetch the **current** `template/` (reuse the bootstrap degit + private-source note);
  2. **diff** the project's `CLAUDE.md`/`docs` substrate against it → list blocks
     present in the template but absent/placeholder in the project;
  3. **read `docs/workflow/MIGRATION.md`** for each missing block's rationale;
  4. **propose only the missing blocks** — one batched, discovery-defaulted interview;
  5. write **additively** — fill placeholders, add missing blocks, **never clobber
     a tailored block, never delete**;
  6. report blocks added/filled/skipped + residual placeholders.
- Add the **additive-only, never-clobber** invariant to the skill's Guardrails.
- Commit this feature's planning artifacts (SPEC + this set) and **register
  roadmap row 13** (`planned`, deps 06/07/08 — all merged).

Single concern: the skill's `SKILL.md`. Verification: the P1 `grep` acceptance
checks pass (`upgrade mode`, `MIGRATION.md`, four-part contract present).

## P2 — Documented recommendation + hardening (hardening phase)

Document the path and close the failure edges.

- **Documented recommendation** — in `README.md`, `README.es.md`, and
  `docs/workflow/MIGRATION.md`: the ordered path *update skills → read
  `MIGRATION.md` → `init-workspace` (upgrade) → optional `product-audit`*.
- **Harden the mode's edges** in `skills/init-workspace/SKILL.md` — state each
  explicitly: `init:no-drift` (nothing missing → "substrate current, nothing to
  migrate"); `init:no-migration` (`MIGRATION.md` absent → diff-only + note);
  `init:tailored-block` (existing tailored block → never-clobber, list as
  residual); `init:bootstrap-unchanged` (bare/foreign repo → bootstrap, upgrade
  never engages).
- **`bump-skill`** — minor bump for `init-workspace`; CHANGELOG rows (EN/ES);
  README skill-table rows (EN/ES).
- **Close out**: open the PR (`gh pr create --body-file …`, `Closes #20`, PRINT
  THE PR URL); set roadmap row 13 → `done · [#PR]`; commit `docs: link PR #<n>`
  and push.

Single concern: workflow docs + the skill's failure-edge wording + release
bookkeeping. Verification: the P2 `grep`/`read-verified` acceptance checks +
`audit-docs` coherence.
