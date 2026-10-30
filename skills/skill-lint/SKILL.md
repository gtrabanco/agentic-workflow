---
name: skill-lint
user-invocable: false
version: 4.10.0
metadata:
  internal: true
description: >
  Internal agentic-workflow maintenance: after SKILL.md edits, lint the repo's
  authoring rules and the machine-surface registration rules. Triggers:
  "lint the skill", "skill authoring check", "check the skill rules".
---

## Turn contract — verify before ending the turn

```
✓ The lint results (all 7 authoring rules, including the two machine-surface
  parity/ordering checks and the internal-skill discovery-exclusion check)
  were reported
✓ Every violation was reported to the user, none silently repaired
✓ The git add + commit command block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first.

## When to use

After any edit to one or more `skills/<name>/SKILL.md` files in this repo,
before committing. The skill is **lint-only**: it reports, never repairs, and
it bumps nothing — skills carry the unified train version, stamped by
`scripts/release.mjs apply` at cut time (D-40-14), and a skill change ships
via a `.changeset/` intent file.

## Step 0 — Orientation

This skill is **specific to the `agentic-workflow` repository**. Before doing
anything, confirm you are in that repo (presence of `skills/` +
`CHANGELOG.md`). If not, stop and tell the user.

## Process

### 1. Lint, warn, never repair

Check all seven `AGENTS.md` invariants per
[change discovery and authoring lint](references/DISCOVERY_AND_LINT.md).
Report every violation without fixing it.

### 2. Print a summary and the next step

Paste the lint results, then print the next step:

> Lint reported. Stage and commit:
> ```
> git add skills/<name>/SKILL.md .changeset/
> git commit -m "<type>(skills): <one-line reason>"
> ```
> A skill change must ship with a `.changeset/*.md` intent file declaring the
> Pi package — `scripts/lint-changeset.mjs` lints it and the version-parity
> gate enforces it.

## Guardrails

- **Never change anything in a SKILL.md** — this skill reports; the writer is
  you, the editor, and the version stamper is `scripts/release.mjs apply`.
- **Never commit or push** — this skill only lints and reports.
- If a skill file is not tracked by git (new file not yet added), say so in
  the report — the change-discovery step cannot see it.

## Portability (agents other than Claude Code)

This skill is repo-maintenance for `agentic-workflow` itself, but the repo may
be worked on from any agent:

- **No slash-command menu** — follow this `SKILL.md` directly after editing any
  skill, before committing.
- **No per-skill `model:`/`effort:`** — a mid-tier model is enough; this is
  classification + lint bookkeeping.

## Relationship to other skills

- Run after any manual edit to a skill or after `execute-phase` touches a
  skill file, and before the commit.
- `AGENTS.md` section "One version: the unified train" is the policy this
  skill lints against.
- The version-parity gate (`scripts/version-parity-gate.mjs`) is the CI half:
  a skills change must ship with a `.changeset/` intent file (or a package
  bump + companion row).
- Renames and other breaking surfaces feed `docs/workflow/MIGRATION.md`,
  which `init-workspace` reads when installing.

## Done when

- All seven authoring-rule violations (missing `→ Next:` block, `S1`/"Step"
  phase labels, a `user-invocable: true` skill absent from `plugin.json`, a
  non-alphabetical machine surface, …) are reported for the user to fix before
  committing.
- **The next step is printed** — the `git add` + `git commit` command, ready
  to run.
