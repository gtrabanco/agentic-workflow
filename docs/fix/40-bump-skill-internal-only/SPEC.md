# fix/40-bump-skill-internal-only

## Goal

`bump-skill` is repo-maintenance for `agentic-workflow` itself, yet it ships
`user-invocable: true` and is enumerated in the Claude Code plugin manifest —
so every consumer of `npx skills add gtrabanco/agentic-workflow` gets a
`/bump-skill` slash-menu entry that does nothing for them (they aren't authoring
this pack's `SKILL.md` files or maintaining its CHANGELOG/README). This fix
reclassifies `bump-skill` as an **internal** skill (`user-invocable: false`) and
drops it from the plugin manifest, removing the menu entry for every consumer
via both distribution channels, and reconciles the skill-count docs that assume
the old user-facing classification. It's small but worth doing now because it's
the one skill whose menu surface is pure noise for ~99% of installs, and the
inconsistency (a skill whose own description says "Internal skill for the
agentic-workflow repo" while flagged `user-invocable: true`) is already
confusing the docs.

## Issue

`#40` — GitHub issue. Required. The PR must close it via `Closes #40` in the
body.

## Branch

`fix/40-bump-skill-internal-only`

## Depends on

None — independent.

## Root cause

`bump-skill` was authored `user-invocable: true` (`skills/bump-skill/SKILL.md:3`)
because the repo's own maintainers invoked it as a slash command, and it was
added to the plugin manifest's `skills` array
(`.claude-plugin/plugin.json:23`) alongside the genuinely user-facing skills.
The `skills` CLI has **no way to exclude a skill from a default install** (see
Decisions made during drafting), so the only levers that remove the menu entry
are the skill's own `user-invocable` flag and the plugin manifest — neither was
set to "internal", so the entry leaks into every install.

## Detected in

User conversation, 2026-07-11 — the user asked whether `bump-skill` should
appear in user-facing docs at all; confirmed it is `user-invocable: true` (not
the repo's technical "internal" category) but scoped to maintaining this repo
specifically, and gets installed into every consumer project regardless. Filed
as issue #40.

## Scope

### In scope

The smallest change set that removes the `/bump-skill` menu entry for consumers
and keeps the repo's docs internally consistent:

1. **`skills/bump-skill/SKILL.md`** — frontmatter `user-invocable: true` →
   `user-invocable: false`. This is the single change that removes the skill from
   the slash-command menu on every agent that honors the flag (Claude Code and
   the 70+ others). Nothing else in the file changes.
2. **`.claude-plugin/plugin.json`** — remove the `"./skills/bump-skill"` entry
   from the `skills` array (drops it from the Claude Code plugin channel). JSON
   stays valid; the array goes from 28 to 27 entries.
3. **`docs/workflow/SKILLS.md`** — remove the `/bump-skill` row from the
   "invocation forms" table (§ "Every user-invocable skill's invocation forms");
   move `bump-skill` out of the "Of the 15" user-facing enumeration into the
   internal set; update the count header `15 user-facing … + 13 internal` →
   `14 user-facing … + 14 internal`.
4. **`README.md`** — update both skill-count occurrences to `14 user-facing +
   14 internal` (the layout block "the 28 skills (15 user-facing + 13 internal)"
   and the prose "**15 user-facing skills** … + **13 internal**").
5. **`README.es.md`** — the same two count occurrences, in Spanish
   (`15 de cara al usuario + 13 internas` → `14 … + 14 …`).
6. **`CLAUDE.md`** — in the "Repo maintenance skill (specific to this repo)"
   note, add that `bump-skill` is now `user-invocable: false` (invoked via the
   Skill tool / by following its `SKILL.md`, not the slash menu).
7. **Bookkeeping** (in the Hardening phase, via `bump-skill` itself): bump
   `bump-skill`'s `version:`, add the changelog rows, and **move** its per-skill
   table from the "User-facing" subsection to the "Internal
   (`user-invocable: false`)" subsection in both `CHANGELOG.md` and
   `CHANGELOG.es.md`.

### Out of scope

- **Physically excluding `bump-skill` from a default CLI install.** Verified
  impossible: the `skills` CLI scans the filesystem and copies all discovered
  `SKILL.md` files; it has no `--exclude` flag and no per-skill manifest field to
  skip one (`--metadata` is telemetry-only). A default `npx skills add` still
  **copies** the `bump-skill` folder — but with `user-invocable: false` it no
  longer surfaces in the menu, which is the actual harm. Documenting a consumer
  opt-out (`npx skills remove bump-skill`) belongs to a docs follow-up if ever
  wanted, not here.
- **Rewriting historical feature/fix docs** that mention "run `bump-skill`"
  (`docs/features/**`, `docs/fix/35-*`). Those are accurate records of past runs;
  `bump-skill` still exists and still does the bookkeeping — only its menu surface
  changes. Track-don't-inline: not part of this fix.
- **Removing `bump-skill`'s `## Turn contract` / `## Portability` sections.**
  Harmless on an internal skill; not required to close #40. If ever tidied, that
  is a separate `bump-skill` edit.
- **Spanish sibling of `docs/workflow/SKILLS.md`** — does not exist yet (issue
  #37 tracks creating Spanish siblings for `docs/workflow/*.md`). When #37 lands,
  its Spanish `SKILLS.md` must carry the `14 + 14` count; nothing to do here.

## Acceptance

Objective, verifiable conditions for "done":

- [ ] `grep -n '^user-invocable:' skills/bump-skill/SKILL.md` shows
      `user-invocable: false`.
- [ ] `.claude-plugin/plugin.json` parses as valid JSON and its `skills` array
      has 27 entries with `./skills/bump-skill` **absent**
      (`python3 -c "import json;d=json.load(open('.claude-plugin/plugin.json'));assert './skills/bump-skill' not in d['skills'];assert len(d['skills'])==27"`).
- [ ] `grep -rn '/bump-skill' docs/workflow/SKILLS.md` returns **nothing** (the
      slash-form invocation row is gone).
- [ ] No live doc states the old split: `grep -rn '15 user-facing\|13 internal\|15 de cara al usuario\|13 internas' README.md README.es.md docs/workflow/SKILLS.md`
      returns nothing; each of those files instead states `14 user-facing +
      14 internal` (or the Spanish equivalent) once per prior occurrence.
- [ ] `CLAUDE.md` "Repo maintenance skill" note states `bump-skill` is
      `user-invocable: false` (invoked via the Skill tool, not the slash menu).
- [ ] `bump-skill`'s `version:` was bumped and its per-skill changelog table
      lives under the **Internal (`user-invocable: false`)** subsection in both
      `CHANGELOG.md` and `CHANGELOG.es.md`, each with a new row for this change.
- [ ] `npx skills add . --list` still discovers all 28 skills (the CLI scan is
      unchanged — expected; menu visibility is governed by the flag, not the
      scan).
- [ ] Updated `docs/workflow/SKILLS.md`, `README.md`, `README.es.md`, `CLAUDE.md`
      (the "Affected docs" list) — each has its acceptance criterion above.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### P1 — Reclassify bump-skill as internal (flag + manifest + count docs)

- [ ] `skills/bump-skill/SKILL.md`: change frontmatter `user-invocable: true`
      → `user-invocable: false`. Touch nothing else in the file. Verify:
      `grep -n '^user-invocable:' skills/bump-skill/SKILL.md` → `false`.
- [ ] `.claude-plugin/plugin.json`: remove the `"./skills/bump-skill",` line
      from the `skills` array; keep valid JSON. Verify with the acceptance
      one-liner (parses, 27 entries, `./skills/bump-skill` absent).
- [ ] `docs/workflow/SKILLS.md`: (a) delete the
      `| \`bump-skill\` | \`/bump-skill\` | … |` row from the invocation-forms
      table; (b) update the count sentence `**15 user-facing skills** … + **13
      internal**` → `**14 user-facing skills** … + **14 internal**`; (c) in the
      "Of the 15: 12 core workflow skills, a `log-session` … a `workflow-status`
      … and the repo-only `bump-skill` maintenance helper" sentence, move
      `bump-skill` out of the user-facing tally and describe it as an internal
      maintenance helper (adjust the "Of the 15" wording to "Of the 14"
      accordingly). Verify: `grep -rn '/bump-skill' docs/workflow/SKILLS.md`
      returns nothing.
- [ ] `README.md`: update both count occurrences (layout block line ~56 and
      prose line ~73) `15 user-facing + 13 internal` → `14 user-facing +
      14 internal`.
- [ ] `README.es.md`: update both count occurrences (layout block line ~57 and
      prose line ~74) `15 de cara al usuario + 13 internas` → `14 de cara al
      usuario + 14 internas`.
- [ ] `CLAUDE.md`: in the "Repo maintenance skill (specific to this repo)"
      block, add a clause that `bump-skill` is now `user-invocable: false` —
      invoked via the Skill tool / by following its `SKILL.md`, not the slash
      menu.
- [ ] Gate for this phase: JSON validity + the grep checks above all pass;
      `npx skills add . --list` still reports 28 skills.

### P2 — Hardening & PR

- [ ] Run `bump-skill` on `bump-skill` (recommended **minor** bump —
      metadata reclassification, zero behavior change; if `bump-skill`'s own
      diff analysis judges the removal of the `/bump-skill` menu surface a
      contract change, **major** is acceptable — the executor decides). Ensure
      it adds the changelog rows AND **moves** `bump-skill`'s per-skill table to
      the **Internal (`user-invocable: false`)** subsection in both
      `CHANGELOG.md` and `CHANGELOG.es.md` (an existing table is not auto-moved —
      move it by hand if the tool leaves it under "User-facing").
- [ ] Re-run the project's full verification gate (commands + exit codes pasted):
      `python3 -c "import json;d=json.load(open('.claude-plugin/plugin.json'));assert './skills/bump-skill' not in d['skills'] and len(d['skills'])==27"`
      (exit 0); `npx skills add . --list` (discovers 28); the Acceptance
      grep checks (all pass).
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #40`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #40` and push

## Testing

No application build exists (docs/packaging change). "Green" is the repo's own
verification, exercised as architecture-style assertions:

- **JSON contract** — `.claude-plugin/plugin.json` parses and the `skills` array
  is exactly the 27 remaining skills (Python `json.load` + `assert`).
- **CLI discovery** — `npx skills add . --list` still enumerates all 28 skills
  (proves the scan is untouched; the flip changes menu visibility, not
  discovery).
- **Grep invariants** — no `/bump-skill` slash-form in `docs/workflow/SKILLS.md`;
  no `15 user-facing`/`13 internal` (or Spanish) strings remain in the live docs;
  `user-invocable: false` present in the SKILL.md.

There is no runtime unit/integration layer to add; the menu-visibility behavior
is an agent-runtime property of the flag and is verified manually (see
Observability).

## Impact

- **Layers touched** — distribution/packaging metadata (`SKILL.md` frontmatter,
  `plugin.json`) and documentation (`SKILLS.md`, `README*.md`, `CLAUDE.md`,
  `CHANGELOG*.md`). No skill **behavior** changes.
- **Modules and files** — `skills/bump-skill/SKILL.md`,
  `.claude-plugin/plugin.json`, `docs/workflow/SKILLS.md`, `README.md`,
  `README.es.md`, `CLAUDE.md`, `CHANGELOG.md`, `CHANGELOG.es.md`.
- **Blast radius** — dev-/consumer-experience only: one slash-menu entry
  disappears. No data, no runtime, no schema, no CI logic touched. This repo's
  own maintainers lose the `/bump-skill` slash shortcut but keep the skill via
  the Skill tool (confirmed invocable — internal skills such as
  `review-implementation`, `plan-feature-scaffold`, `orchestration-envelope` are
  invoked via the Skill tool, not the menu). The user confirmed they never invoke
  `/bump-skill` manually; it is already run for them via the Skill tool.
- **Detection lead time** — immediate and self-evident: the acceptance greps
  fail loudly if any piece is missed; a wrong menu state is visible the moment an
  agent lists its skills.

## Rules that must never be violated

- **Docs language is English** for committed artifacts; the Spanish
  `README.es.md`/`CHANGELOG.es.md` edits are exact translations of the English
  changes, not new content.
- **Stack/architecture agnostic** — no product/stack/framework reference
  introduced.
- **Version every change** — any `SKILL.md` edit ⇒ a `version:` bump + changelog
  rows in the same PR (`bump-skill`'s own rule; enforced in P2).
- **`bump-skill` never edits a `SKILL.md` beyond its `version:` line** — the
  `user-invocable` flip is a manual P1 edit, not something `bump-skill` performs.
- **One PR per unit of work, against `main`** — this fix is a single PR off
  `main`.

## Operational risks

- **Self-referential execution.** P2 runs `bump-skill` immediately after P1 makes
  `bump-skill` internal in the same working tree. Internal skills remain invocable
  via the Skill tool, so this works; but a running agent session may have cached
  the pre-flip registry (precedent: feature 10 hit a stale globally-installed
  copy at `~/.claude/skills/bump-skill/`). Mitigation: if the Skill tool won't
  surface the freshly-edited `bump-skill`, perform the version/changelog
  bookkeeping by hand following `skills/bump-skill/SKILL.md` — `execute-phase`
  already knows this fallback.
- No scheduled-job, queue, cache-invalidation, schema, or external-adapter
  interaction. The npm schema package (`packages/agentic-workflow-schema/`) is
  untouched, so the CLAUDE.md "same-PR schema mirror" rule does not apply.

## Security risks

n/a — no auth, secrets, PII, webhooks, or rate-limits touched. Packaging/docs
only.

## Compliance touchpoints

n/a — no domain/compliance rules (data retention, regional, consumer-protection)
are involved.

## Affected docs

Each is already an acceptance criterion above:

- `docs/workflow/SKILLS.md` — remove the `/bump-skill` invocation row; reclassify
  `bump-skill` as internal; fix the `14 + 14` count.
- `README.md` — both skill-count occurrences → `14 user-facing + 14 internal`.
- `README.es.md` — both skill-count occurrences (Spanish) → `14 + 14`.
- `CLAUDE.md` — note `bump-skill` is `user-invocable: false` (Skill-tool /
  `SKILL.md`, not slash menu).
- `CHANGELOG.md` / `CHANGELOG.es.md` — new `bump-skill` rows, table moved to the
  Internal subsection (P2, via `bump-skill`).

## Observability

No production surface (this is a skills pack, not a running app). The fix is
"live and healthy" when, after a consumer runs `npx skills update` (or a fresh
`npx skills add`), the agent's skill/command menu no longer offers `/bump-skill`.
The in-repo, scriptable proxies are the acceptance greps (`user-invocable: false`
present; `/bump-skill` absent from `SKILLS.md`; `plugin.json` array = 27 without
`bump-skill`). There is no log line or metric; degradation would show up only as
the menu entry reappearing, caught by the acceptance greps on the next change.

## Cross-issue notes

- **#42** (enhancement — injection-safe urgency, `triage-issue`/`workflow-status`)
  — unrelated. No overlap.
- **#38** (bug — npm schema publish stuck at 1.0.0) — unrelated; touches the
  schema package, not the skills classification.
- **#37** (documentation — `docs/workflow/*.md` has no Spanish sibling) —
  **parallel, not blocking**. The Spanish `SKILLS.md` sibling does not exist yet,
  so there is nothing to mirror now; when #37 creates it, it must carry the
  `14 + 14` count. Recorded so #37 doesn't silently reintroduce the old split.
- No open PRs — nothing to rebase against.

## Effort

**S** — one manual frontmatter flip, one small JSON edit, and mechanical
count/reclassification edits across four docs plus the P2 changelog bookkeeping.
Multiple files but zero design decisions; ≤ a couple of hours, effectively one
implementation phase + the standard close-out.

## Decisions made during drafting

- **Approach A chosen by the user** (`user-invocable: false` + drop from
  `plugin.json`) over "document a CLI opt-out" (issue option 1) or "docs-only
  wording tightening" (issue option 2). Rationale: A is the only approach that
  actually removes the menu entry for every consumer via both channels, and it
  aligns the flag with the skill's own "Internal skill for the agentic-workflow
  repo" self-description. The user confirmed they never invoke `/bump-skill`
  manually (it is run for them via the Skill tool), so the maintainer-side cost
  is effectively zero.
- **Issue option 3 (CLI auto-skips via metadata) verified impossible.** Checked
  against the actual CLI (`npx skills add --help` / root help): the only
  install-time selector is `--skill` (an **allowlist**, supporting `*`); there is
  **no `--exclude`** flag and **no frontmatter/manifest field** the CLI honors to
  skip a skill (`--metadata <json>` attaches JSON to install telemetry only). The
  CLI discovers skills by **filesystem scan** (`npx skills add . --list` reports
  "Found 28 skills"), independent of `plugin.json`. So the CLI channel cannot be
  made to omit `bump-skill` on a default install — hence the flag-based approach.
- **Recommended bump: minor** (`2.0.0 → 2.1.0`) — metadata reclassification with
  no behavior/contract change to the skill's process, arguments, or output. If
  `bump-skill`'s own diff analysis judges the removal of the `/bump-skill` menu
  surface a contract change, a **major** bump is acceptable; the executor
  (running `bump-skill`) makes the final call in P2.
- **CLI still copies the `bump-skill` folder** on a default install (unavoidable,
  per option-3 finding). Accepted: `user-invocable: false` means it never
  surfaces in the menu, so the copied-but-hidden folder is invisible noise, not
  menu noise. Not worth a follow-up unless a consumer complains about the folder.

## Status

`pending`
