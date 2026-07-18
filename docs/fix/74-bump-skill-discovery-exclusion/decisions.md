# Decisions — fix/74-bump-skill-discovery-exclusion

## Primary-source CLI capability finding

Issue #74's first acceptance criterion required establishing the `skills` CLI's
actual exclusion capabilities from primary sources before scoping the fix — the
prior fix (#40) had assumed "no way to exclude a skill from a default install"
based only on `npx skills add --help`, which turned out to be wrong.

Read directly from the `skills` npm package's bundled `dist/cli.mjs`, verified
in **both** version 1.5.16 (resolved from this machine's npx cache) and version
1.5.19 (latest published, what consumers actually get via
`npx skills@latest add …`):

- The frontmatter parser drops any skill whose `metadata.internal` is `true`,
  unless overridden:

  ```js
  if (data.metadata?.internal === true && !shouldInstallInternalSkills()
      && !options?.includeInternal) return null;
  ```

- The override is an environment variable, not a CLI flag:

  ```js
  function shouldInstallInternalSkills() {
    const envValue = process.env.INSTALL_INTERNAL_SKILLS;
    return envValue === "1" || envValue === "true";
  }
  ```

- `.claude-plugin/plugin.json`'s `skills` array is **additive, not an
  allowlist**: the discovery routine adds every path it declares, then
  unconditionally also pushes the repo's `skills/` directory onto the search
  list. Omission from the manifest therefore cannot hide a skill from
  discovery — it only changes which category label the CLI shows it under.
- There is **no** `.skillsignore` file and **no** other per-skill
  discovery-exclusion frontmatter field (`private`/`hidden` are not read by
  the CLI).

Empirically confirmed against this repo: `npx skills add . --list` reports
"Found 29 skills" before the fix and "Found 28 skills" (bump-skill absent)
after adding `metadata.internal: true`; `INSTALL_INTERNAL_SKILLS=1 npx skills
add . --list` reports "Found 29 skills" with bump-skill present, proving the
override path.

## Decision: option 2 (use the CLI's own exclusion mechanism)

The issue's three options were:

1. **Move `bump-skill` out of `skills/`** (e.g. `tools/bump-skill/` or a real
   `.claude/skills/bump-skill/` directory) — narrows the `.claude/skills`
   symlink and breaks the uniform `skills/<name>/SKILL.md` layout several docs
   describe.
2. **Use a supported CLI exclusion mechanism, if one exists** — the issue
   flagged this as unverified and noted a supported mechanism would moot
   options 1 and 3.
3. **Convert `bump-skill` to a hook** — the user's own suggestion, flagged in
   the issue as weak on the merits: `bump-skill` picks a semver bump
   (major/minor/patch) and writes changelog + README prose, which is judgement
   work a shell hook cannot perform; a hook could at most remind the author to
   run the skill.

**Decision: option 2.** The primary-source finding above establishes that a
first-class, supported exclusion mechanism exists (`metadata.internal: true`).
Per the issue's own framing, this makes options 1 and 3 unnecessary — no
architect judgement call remains once the CLI capability question is
answered. The fix is a one-key frontmatter change plus a lint rule to keep it
from silently regressing, with no path change and no dependency on
shell-hook logic that cannot make judgement calls.

**Options 1 and 3 rejected**, for the record:

- **Option 1 (relocate)** — rejected because it is strictly more disruptive
  than option 2 for the same outcome: it breaks the `.claude/skills → ../skills`
  symlink `CLAUDE.md` and `docs/workflow/REPLICATE.md` describe, and the
  uniform `skills/<name>/SKILL.md` layout every other skill (and the `skills`
  CLI itself) assumes. Kept as the documented fallback if the CLI's
  `metadata.internal` gate is ever removed upstream (see the SPEC's
  Operational risks section).
- **Option 3 (hook)** — rejected on the merits stated in the issue: a
  `PostToolUse`/pre-commit hook firing on `skills/*/SKILL.md` edits can at
  most *remind* the author to run `bump-skill`; it cannot itself choose a
  semver bump or write changelog/README prose. It also does nothing about
  discovery, which is the actual defect — a reminder to run `bump-skill`
  would not stop `npx skills add . --list` from offering it to consumers.

## Scope precision: which skills get `metadata.internal: true`

Fourteen skills in this repo are `user-invocable: false`. Thirteen of them
(`orchestration-envelope`, the nine `review-*` sub-skills, `plan-feature-scaffold`,
`plan-feature-from-issue`) are still listed in `.claude-plugin/plugin.json`
because they are composed in-turn by user-facing orchestrators
(`review-change`, `product-audit`, `plan-feature`) in target projects — they
must stay discoverable and installable. Only `bump-skill` is both
`user-invocable: false` **and** absent from `plugin.json`; it is the sole
skill marked `metadata.internal: true`. The new `bump-skill` lint rule (§2b,
rule 7) keys on this conjunction specifically to avoid ever flagging the 13
shipped sub-skills.
