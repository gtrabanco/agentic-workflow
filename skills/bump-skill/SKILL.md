---
name: bump-skill
user-invocable: false
version: 2.4.0
metadata:
  internal: true
description: >
  Internal agentic-workflow maintenance: after SKILL.md edits, bump semver,
  lint authoring rules, and synchronize changelogs, READMEs, routing metadata,
  and migrations. Triggers: "bump the skill", "update the changelog",
  "version bump".
---

## Turn contract — verify before ending the turn

```
✓ Every changed skill's version: was bumped (by its bundled scripts/bump-skill.mjs) and
  the per-skill CHANGELOG table got its row
✓ The lint results (all 7 authoring rules, including the two machine-surface
  parity/ordering checks and the internal-skill discovery-exclusion check)
  were reported
✓ Every judgment note the script printed (README cells, argument-hint,
  migration notes) was handled or explicitly reported to the user
✓ The git add + commit command block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first.

## When to use

After any edit to one or more `skills/<name>/SKILL.md` files in this repo,
before committing. Since the issue #180 amendment (2026-09-07) the mechanical
half is a **script**: you classify the change, run the script, paste its diff
summary. The only judgment left is the classification and the lint report.

## Step 0 — Orientation

This skill is **specific to the `agentic-workflow` repository**. Before doing
anything, confirm you are in that repo (presence of `skills/` +
`CHANGELOG.md`). If not, stop and tell the user.

Versioning policy (from `CHANGELOG.md`):

| Bump | When |
|---|---|
| **major** | rename, removed/renamed flag, changed contract or output shape — ships with a migration note |
| **minor** | new backward-compatible capability: new flag, new section, new routing case |
| **patch** | wording, examples, clarifications, internal tidy — no behavior change |

## Process

### 1. Classify the change (the only judgment left)

For every changed skill, choose the bump level from its diff per the policy
table above. You may let the script infer it instead — it prints the
derivation and you verify it.

### 2. Run the script

```sh
node skills/bump-skill/scripts/bump-skill.mjs <skill>... --level <patch|minor|major> --summary "<one sentence>"
```

The script applies every mechanical surface atomically: the `version:` line in
each SKILL.md (and nothing else there) and the newest-first row in the skill's
`CHANGELOG.md` table (creating the table in the matching User-facing/Internal
section for a new skill). The surfaces and table grammar it mechanizes are
documented in [version and documentation sync](references/VERSION_AND_DOCS.md).
Dry-run first with `--dry-run` if unsure. It also
prints judgment notes — handle every one:

- **README cells** (minor/major): update the affected Skills-table cell in
  `README.md` — prefer updating over rewriting; keep tone and length.
- **argument-hint**: if the frontmatter hint changed, review where it is echoed.
- **major bumps**: append the migration to `docs/workflow/MIGRATION.md`, update
  the `AGENTS.md` skill entry when its name/contract changed, and fix stale
  cross-references found under `docs/` and `skills/`.
- **bundle**: run `bun run bundle:skills` before publishing.

### 3. Lint, warn, never repair

Check all seven `AGENTS.md` invariants per
[change discovery and authoring lint](references/DISCOVERY_AND_LINT.md). This
flow may edit only the `version:` line in a SKILL.md (plus the surfaces step 2
names), so report violations without fixing them.

### 4. Print a summary and the next step

Paste the script's summary table, then print the next step:

> All documentation updated. Stage and commit:
> ```
> git add skills/<name>/SKILL.md CHANGELOG.md README.md
> git commit -m "chore(skills): bump <name> to <version> — <one-line reason>"
> ```
> If this is a major bump with a migration note, also add `docs/workflow/MIGRATION.md`.

## Guardrails

- **Never change anything in a SKILL.md except the `version:` line** — the
  script enforces this mechanically.
- **Never commit or push** — this skill only edits files.
- If a skill file is not tracked by git (new file not yet added), the script
  cannot infer the level — classify it yourself and pass `--level`.
- For the README cells, prefer updating over rewriting: keep the existing tone
  and length; change only what is factually wrong or missing.

## Portability (agents other than Claude Code)

This skill is repo-maintenance for `agentic-workflow` itself, but the repo may
be worked on from any agent:

- **No slash-command menu** — follow this `SKILL.md` directly after editing any
  skill, before committing.
- **No per-skill `model:`/`effort:`** — a mid-tier model is enough; the script
  carries the mechanical work, so this is classification + lint bookkeeping.

## Relationship to other skills

- Run after any manual edit to a skill or after `execute-phase` touches a
  skill file, and before the commit.
- `AGENTS.md` section "Version every change" is the policy this skill enforces
  mechanically (via the bundled `scripts/bump-skill.mjs`).
- The version-parity gate (`scripts/version-parity-gate.mjs`) is the CI half:
  a skills change must ship with a package version bump + companion row (or a
  `.changeset/` intent file).
- Major bumps that introduce renames feed into `docs/workflow/MIGRATION.md`,
  which `init-workspace` reads when installing.

## Done when

- Every modified skill's `version:` field is updated **by the script**.
- `CHANGELOG.md` has a new row for every bumped skill, newest first.
- Every judgment note the script printed is handled or reported.
- Major bumps have a migration note and cross-reference updates.
- Any authoring-rule violations (missing `→ Next:` block, `S1`/"Step" phase labels,
  a `user-invocable: true` skill absent from `plugin.json`, a non-alphabetical
  machine surface) are reported for the user to fix before committing.
- **The next step is printed** — the `git add` + `git commit` command, ready
  to run.
