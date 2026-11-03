---
name: skill-lint
user-invocable: false
version: 4.10.0
metadata:
  internal: true
description: >
  Internal agentic-workflow maintenance: after SKILL.md edits, lint the repo's
  authoring rules, the machine-surface registration rules and the skill-content
  smell/security checks. Triggers: "lint the skill", "skill authoring check",
  "check the skill rules", "scan skills for smells".
---

## Turn contract — verify before ending the turn

```
✓ `bun scripts/skill-lint.mjs` ran and its report block is pasted verbatim
  (a `PASS` verdict, or every `FINDING` line as printed)
✓ The eight authoring rules were checked against each changed SKILL.md
  (`references/DISCOVERY_AND_LINT.md`) — including the two machine-surface
  parity/ordering checks, the internal-skill discovery-exclusion check and the
  published-vocabulary check — and every violation was reported
✓ Nothing was repaired, added or rewritten — the lint reports only
✓ The git add + commit command block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first.

## When to use

After any edit to one or more `skills/<name>/SKILL.md` files (or to a
`references/` file beside one) in this repo, before committing. The skill is
**lint-only**: it reports, never repairs, and it bumps nothing — skills carry the
unified train version, stamped by `scripts/release.mjs apply` at cut time
(D-40-14), and a skill change ships via a `.changeset/` intent file.

## Step 0 — Orientation

This skill is **specific to the `agentic-workflow` repository**. Before doing
anything, confirm you are in that repo (presence of `skills/` +
`CHANGELOG.md`). If not, stop and tell the user.

## Process

### 1. Run the content checks

The mechanical half is code:

```
bun scripts/skill-lint.mjs                    # the whole tree — the sweep
bun scripts/skill-lint.mjs --skill <name>     # only the skill(s) you changed
```

Paste its block verbatim. The seven checks (hidden comments, frontmatter tags,
invisible codepoints, unpinned URLs, credential/exfiltration shapes, backslash
paths, time-sensitive claims), the shapes each admits and the smells this repo
deliberately does not adopt are owned by
[skill content checks](references/CHECKS.md). Exit `0` is `PASS`, `1` is
`FAIL`, `2` is a usage error — never re-read the block for a verdict the exit
code already gave.

### 2. Lint, warn, never repair

Check all eight `AGENTS.md` authoring invariants per
[change discovery and authoring lint](references/DISCOVERY_AND_LINT.md).
Report every violation without fixing it. These are structure and registration
rules (closing block, phase labels, portability, turn contract, plugin
registration and its order, internal-skill metadata); the content checks in
step 1 do not cover them, and they do not cover the content checks.

### 3. Print a summary and the next step

Paste both results (the scanner block, then the authoring-rule findings), then
print the next step:

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
- **Never weaken a check to get a green** — a finding is repaired in the prose
  that caused it, or recorded as a decision in `references/CHECKS.md`; the
  patterns live in `scripts/skill-lint.mjs` and are pinned by its suite.
- If a skill file is not tracked by git (new file not yet added), say so in
  the report — the change-discovery step cannot see it.

## Portability (agents other than Claude Code)

This skill is repo-maintenance for `agentic-workflow` itself, but the repo may
be worked on from any agent:

- **No slash-command menu** — follow this `SKILL.md` directly after editing any
  skill, before committing.
- **No per-skill `model:`/`effort:`** — a mid-tier model is enough; this is
  classification + lint bookkeeping. The content checks are code, so they give
  the same answer on any model.
- **No `bun`-only assumption** — `bun scripts/skill-lint.mjs` is the form to
  print. The fallback is `node scripts/skill-lint.mjs`: same argv, same block.

## Relationship to other skills

- Run after any manual edit to a skill or after `execute-phase` touches a
  skill file, and before the commit.
- `AGENTS.md` section "One version: the unified train" is the policy this
  skill lints against.
- The version-parity gate (`scripts/version-parity-gate.mjs`) is the CI half:
  a skills change must ship with a `.changeset/` intent file (or a package
  bump + companion row).
- Context budgets are not this skill's: `scripts/check-skill-context.mjs` owns
  them, and `references/CHECKS.md` records that as a deliberate skip.
- Renames and other breaking surfaces feed `docs/workflow/MIGRATION.md`,
  which `init-workspace` reads when installing.

## Done when

- The scanner's block is pasted and every `FINDING` line is reported for the
  user to fix before committing — or the verdict is `PASS`.
- All eight authoring-rule violations (missing `→ Next:` block, `S1`/"Step"
  phase labels, a `user-invocable: true` skill absent from `plugin.json`, a
  non-alphabetical machine surface, a drifted `Sev`/`Impact` cell, …) are
  reported for the user to fix before committing.
- **The next step is printed** — the `git add` + `git commit` command, ready
  to run.
