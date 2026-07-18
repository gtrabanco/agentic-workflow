---
name: bump-skill
user-invocable: false
version: 2.2.0
metadata:
  internal: true
description: >
  Internal skill for the agentic-workflow repo. After editing one or more
  SKILL.md files, bumps their `version:` fields and updates every piece of
  documentation in the repo that must stay in sync: CHANGELOG.md,
  CHANGELOG.es.md, README.md, and README.es.md. Run before committing any
  skill change. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Trigger phrases: "bump the skill version", "update the
  version", "update the changelog", "I just changed a skill", "log this
  change", "version bump".
---

## Turn contract — verify before ending the turn

```
✓ Every changed skill's version: was bumped and BOTH changelogs got their rows
✓ The lint results (all 7 authoring rules, including the two machine-surface
  parity/ordering checks and the internal-skill discovery-exclusion check)
  were reported
✓ The git add + commit command block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first.

## When to use

After any edit to one or more `skills/<name>/SKILL.md` files in this repo,
before committing. Handles the full documentation surface so nothing drifts.

## Step 0 — Orientation

This skill is **specific to the `agentic-workflow` repository**. Before doing
anything, confirm you are in that repo (presence of `skills/` + `CHANGELOG.md`
+ `CHANGELOG.es.md`). If not, stop and tell the user.

Versioning policy (from `CHANGELOG.md`):

| Bump | When |
|---|---|
| **major** | rename, removed/renamed flag, changed contract or output shape — ships with a migration note |
| **minor** | new backward-compatible capability: new flag, new section, new routing case |
| **patch** | wording, examples, clarifications, internal tidy — no behavior change |

## Process

### 1. Identify changed skills

Run `git diff --name-only HEAD` and `git diff --cached --name-only` to find
every modified `skills/*/SKILL.md`. Union both lists (covers staged and
unstaged). If the user names specific skills explicitly, use those instead and
verify the files exist.

If no modified skill files are found, say so and stop.

### 2. For each changed skill — read the diff and determine the bump

Run `git diff HEAD skills/<name>/SKILL.md` (add `--cached` if staged). Read
the diff carefully:

- **major** — the `name:` changed, a flag or section was removed, the output
  contract changed fundamentally. Also check `docs/workflow/MIGRATION.md` to
  see if a migration note is needed.
- **minor** — a new section, new flag, new routing case, or meaningfully
  expanded capability was added.
- **patch** — wording, examples, formatting, or internal clarifications only.

If the nature of the change is ambiguous, ask the user before proceeding. One
question covering all ambiguous skills at once is fine.

### 2b. Lint the repo's authoring rules (flag, don't fix)

For each changed skill, check the two `CLAUDE.md` authoring invariants and **warn**
if violated (this skill never edits a SKILL.md beyond its `version:` line, so it
reports — it does not auto-correct):

- **Closing `→ Next:` block.** A user-facing skill should end with a visible
  `→ Next:` recommendation block (recommended command + open `·` alternatives), not
  just a "Done when" bullet. `grep -L '→ Next:' skills/<name>/SKILL.md` flags a miss.
- **Phase naming.** Plans use `P1, P2, …` ("phases") only — never `S1`/`S2`/"Step N".
  `grep -nE '\bS[0-9]\b|\bStep [0-9]' skills/<name>/SKILL.md` should return nothing in
  a planning/execution context; flag any hit for the user to fix before committing.
- **Portability section.** Every user-facing skill (`user-invocable: true`) carries a
  `## Portability` section with the standard non-Claude-Code fallbacks.
  `grep -L '^## Portability' skills/<name>/SKILL.md` flags a miss (skip this check
  for internal skills).
- **Turn contract.** Every user-facing skill opens with a `## Turn contract`
  section (deliverable in fixed format; `→ Next:` printed last; executors run
  commands, never describe them). `grep -L '^## Turn contract' skills/<name>/SKILL.md`
  flags a miss (skip for internal skills).
- **`plugin.json` parity.** Every `skills/<name>/` with `user-invocable: true`
  has a matching `./skills/<name>` entry in `.claude-plugin/plugin.json`.
  Compare the two sets (directories vs. array entries) and flag any
  `user-invocable: true` skill missing from the array — this is what left
  `fold-findings` installing outside its category (see #71).
- **Machine-surface alphabetical order.** `.claude-plugin/plugin.json`'s
  `skills` array and `docs/workflow/model-routing.yml`'s top-level keys must
  each be alphabetical (per `CLAUDE.md`'s Conventions table). Extract each
  surface's ordered list and diff it against its sorted form
  (`sort -c`-equivalent); flag any surface that fails.
- **Internal-skill discovery exclusion.** Any `skills/<name>/` that is both
  `user-invocable: false` **and** absent from `plugin.json`'s `skills` array
  is repo-internal (meaningless outside this repo) and must carry
  `metadata.internal: true` in its frontmatter — the only mechanism the
  `skills` CLI honors to keep `npx skills add . --list` from discovering and
  offering it (`user-invocable`/`plugin.json` alone do not gate discovery;
  see `docs/fix/74-bump-skill-discovery-exclusion/decisions.md`). Skills
  present in `plugin.json` are **exempt** even if `user-invocable: false`
  (they are shipped sub-skills composed by orchestrators, not repo-internal —
  e.g. the `review-*` pack, `orchestration-envelope`,
  `plan-feature-scaffold`, `plan-feature-from-issue`). For each changed
  skill: if `user-invocable: false` and its `./skills/<name>` entry is absent
  from `plugin.json`, `grep -q 'internal: true' skills/<name>/SKILL.md`
  should succeed; flag a miss.

Report violations in the summary; do not block the bump on them.

### 3. Compute the new version

Parse `version:` from the SKILL.md frontmatter (line matching `^version:`).
Apply the semver bump: increment the appropriate component, reset lower
components to zero.

Examples: `1.2.3` + patch → `1.2.4`; `1.2.3` + minor → `1.3.0`;
`1.2.3` + major → `2.0.0`.

### 4. Update `version:` in the SKILL.md frontmatter

Replace only the `version:` line in the YAML frontmatter. Touch nothing else
in the file.

### 5. Add a row to CHANGELOG.md

Locate the per-skill table for `<name>` under `## Per-skill version history`.
Insert a new row **at the top** of that skill's table (newest first):

```
| <new-version> | <YYYY-MM-DD> | <bump-type> | <one-sentence summary> |
```

- Use today's date.
- Bump type: `major`, `minor`, or `patch`.
- Summary: one tight sentence describing the actual behavioral change — not
  the name of the bump type. Write it so a reader instantly knows what changed.

If the skill has no table yet (new skill), create one with the standard header:

```markdown
#### `<name>`
| Version | Date | Type | What changed |
|---|---|---|---|
| <new-version> | <YYYY-MM-DD> | — | First versioned release |
```

Place it in the correct subsection: **User-facing** if `user-invocable: true`,
**Internal (`user-invocable: false`)** otherwise.

Also append a brief entry to the **Release log** section at the bottom of
`CHANGELOG.md` if this is the first bump in a new date (i.e. no entry for
today yet). Merge all same-day bumps into one log line.

### 6. Add the matching row to CHANGELOG.es.md

Find the same skill's table in `CHANGELOG.es.md` and add the equivalent row
in Spanish. The content must match exactly — this is a translation, not a
separate record. Follow the same "newest first" order.

If the skill has no table yet in `CHANGELOG.es.md`, create one following the
same structure as the English version, adapted to Spanish (see existing entries
for phrasing conventions).

### 7. Check and update README.md

Open `README.md` and check two sections:

**a) Skills table** (under `## The skills`): find the row for this skill.
If the skill's description or primary behavior changed (minor or major bump),
rewrite the "What it does" cell to reflect the current state. For patch bumps,
no change is needed unless the cell is already inaccurate.

**b) Model & effort table** (under `## Recommended model & effort`): `main`
carries no `model:`/`effort:` frontmatter — this table documents the
`#claude` branch's tiers, sourced from `docs/workflow/model-routing.yml`. If
the user asks to change this skill's tier, update `model-routing.yml` (never
the `claude` branch directly — it's force-pushed by CI on every push to
`main` and a direct edit is lost) and mirror the new value into this table
row.

Make no other changes to README.md.

### 8. Check and update README.es.md

Apply the same checks as step 7 to `README.es.md`, translating any updated
text to Spanish.

### 8b. `docs/workflow/model-routing.yml` (only when a tier changed)

If step 7b changed a model/effort tier, this file must already reflect it
(step 7b is where the edit happens — this is a reminder to not skip it, not a
separate edit). Verify the skill's block matches what you just wrote to the
README table. `sync-derived-branches.yml` reads this file on every push to
`main` to regenerate the `claude` branch — a mismatch here means the next
CI run rewrites `claude` with a value the README doesn't document.

### 9. Handle major bumps — migration note

If any skill received a **major** bump due to a rename or removed/renamed
flag:

- Check `docs/workflow/MIGRATION.md`. If it exists, append a migration note.
  If it does not exist yet, create it with the standard header and the note.
- Update `CLAUDE.md` under "Skills available in this repo" if the skill's
  name or contract description changed there.
- Search the repo for cross-references to the old name:
  `grep -r "<old-name>" docs/ skills/ --include="*.md" -l`
  and update any that now point to the wrong contract.

### 10. Print a summary and the next step

Print a table:

```
skill              old → new        bump
─────────────────────────────────────────
execute-phase      1.2.0 → 1.3.0   minor
plan-fix           1.0.1 → 1.0.2   patch
```

Then print the next step:

> All documentation updated. Stage and commit:
> ```
> git add skills/<name>/SKILL.md CHANGELOG.md CHANGELOG.es.md README.md README.es.md
> git commit -m "chore(skills): bump <name> to <version> — <one-line reason>"
> ```
> If this is a major bump with a migration note, also add `docs/workflow/MIGRATION.md`.

## Guardrails

- **Never change anything in a SKILL.md except the `version:` line.**
- **Never commit or push** — this skill only edits files.
- If a skill file is not tracked by git (new file not yet added), note it and
  still update the SKILL.md version and CHANGELOG entries, but warn that the
  diff-based bump analysis is unavailable for untracked files — ask the user
  what changed.
- For the README cells, prefer updating over rewriting: keep the existing tone
  and length; change only what is factually wrong or missing.

## Portability (agents other than Claude Code)

This skill is repo-maintenance for `agentic-workflow` itself, but the repo may
be worked on from any agent:

- **No slash-command menu** — follow this `SKILL.md` directly after editing any
  skill, before committing.
- **No per-skill `model:`/`effort:`** — a mid-tier model is enough; this is
  mechanical version/changelog bookkeeping.

## Relationship to other skills

- Run after any manual edit to a skill or after `execute-phase` touches a
  skill file, and before the commit.
- `CLAUDE.md` section "Version every change" is the policy this skill
  enforces mechanically.
- Major bumps that introduce renames feed into `docs/workflow/MIGRATION.md`,
  which `init-workspace` reads when installing.

## Done when

- Every modified skill's `version:` field is updated.
- `CHANGELOG.md` and `CHANGELOG.es.md` each have a new row for every bumped
  skill, newest first.
- `README.md` and `README.es.md` skills and model tables are accurate.
- Major bumps have a migration note and cross-reference updates.
- Any authoring-rule violations (missing `→ Next:` block, `S1`/"Step" phase labels,
  a `user-invocable: true` skill absent from `plugin.json`, a non-alphabetical
  machine surface) are reported for the user to fix before committing.
- **The next step is printed** — the `git add` + `git commit` command, ready
  to run.
