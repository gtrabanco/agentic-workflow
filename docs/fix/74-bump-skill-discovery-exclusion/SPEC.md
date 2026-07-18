# fix/74-bump-skill-discovery-exclusion

## Goal

`bump-skill` is repo-maintenance for `agentic-workflow` itself, yet
`npx skills add . --list` still **discovers and offers it for install** to
every consumer of the pack — listed under the `General` category and
selectable. Fix #40 already made it `user-invocable: false` and dropped it
from `plugin.json`, but neither lever gates *discovery*: the CLI scans
`skills/*/SKILL.md` directly and the manifest is additive, not an allowlist.
This fix uses the `skills` CLI's own supported exclusion mechanism —
`metadata.internal: true` in the SKILL.md frontmatter — to hide `bump-skill`
from `npx skills add` discovery while keeping it working in this repo (where
Claude Code reads the symlinked SKILL.md directly, not via the CLI). It then
encodes the rule as a `bump-skill` authoring lint so it cannot silently
recur. It can't wait for a feature cycle: the pack's whole premise is being
stack-agnostic and portable, and it currently ships a repo-only maintenance
tool to every install.

## Issue

`#74` — GitHub issue. Required. The PR must close it via `Closes #74` in the
body.

## Branch

`fix/74-bump-skill-discovery-exclusion`

## Depends on

None. (Shares the parity-lint theme with `#71`, but `#71` is already merged —
PR [#95] — so there is no ordering constraint.)

## Root cause

The repo treats `skills/` as both "the installable source" and "where every
skill lives, internal ones included" (`CLAUDE.md`, Repository layout). For a
repo-only skill those two roles conflict, and until now no mechanism
separated them:

- `user-invocable: false` (`skills/bump-skill/SKILL.md:3`) governs only the
  **post-install** slash-command menu, not discovery or installation.
- Absence from `.claude-plugin/plugin.json`'s `skills` array does not hide it:
  the CLI's discovery function always pushes the `skills/` directory onto its
  search list regardless of the manifest (verified — see the primary-source
  finding below), so the manifest only supplies the *category label*. Being
  absent just relabels it from `Agentic Workflow` to `General`.

Fix #40 (issue [#40], closed 2026-07-11) drafted its SPEC on the assumption
that "the `skills` CLI has **no way to exclude a skill from a default
install**" — an assumption made from `npx skills add --help` alone, never
verified against the CLI source. That assumption was wrong, which is why the
skill still ships.

### Primary-source CLI capability finding (acceptance criterion #1)

Established by reading the `skills` CLI bundle directly (`skills` npm package,
`dist/cli.mjs`), verified in **both** the version resolved from this repo's
cache (**1.5.16**) and the current latest published version (**1.5.19**, which
consumers get via `npx skills@latest add …`):

- The parser drops any skill whose frontmatter sets `metadata.internal: true`:

  ```js
  if (data.metadata?.internal === true && !shouldInstallInternalSkills()
      && !options?.includeInternal) return null;
  ```

- The env override is:

  ```js
  function shouldInstallInternalSkills() {
    const envValue = process.env.INSTALL_INTERNAL_SKILLS;
    return envValue === "1" || envValue === "true";
  }
  ```

- The manifest is confirmed **additive, not an allowlist**: the discovery
  routine reads `.claude-plugin/plugin.json`'s `skills`, adds each declared
  dir, then unconditionally runs `searchDirs.push(join(pluginBase, "skills"))`
  — so omission from `plugin.json` cannot hide anything.
- There is **no** `.skillsignore` and **no** other per-skill discovery-exclusion
  field (`private`/`hidden` are not honored).

**Consequence:** a first-class, supported exclusion mechanism exists, which
the issue itself notes "makes options 1 and 3 unnecessary." Option 2 is the
fix; options 1 (relocate out of `skills/`) and 3 (convert to a hook) are
rejected — rationale recorded in `decisions.md` (P2).

## Detected in

User report, 2026-07-17 (issue #74), confirmed from the repo root:
`npx skills add . --list` lists `bump-skill` under `General` and offers it
for install, despite `user-invocable: false` and absence from `plugin.json`.

## Scope

### In scope

1. Add a `metadata:` block with `internal: true` to
   `skills/bump-skill/SKILL.md`'s frontmatter (the only repo-internal skill —
   see the exactness note below).
2. Record the primary-source CLI finding and the option-2 decision (with the
   rationale for rejecting options 1 and 3) in
   `docs/fix/74-bump-skill-discovery-exclusion/decisions.md`.
3. Add a seventh `bump-skill` authoring lint rule ("internal-skill discovery
   exclusion") that enforces the invariant going forward, and update the
   rule-count references (`## Turn contract`, the lint-report line) from
   "6 authoring rules" to "7".
4. Add a one-line note to `CLAUDE.md` (the `bump-skill` entry / Authoring-a-skill
   guidance) that a repo-internal skill carries `metadata.internal: true` to
   stay out of `npx skills add` discovery.

**Exactness of the internal set.** The lint rule keys on the *conjunction*
`user-invocable: false` **AND** absent from `plugin.json`'s `skills` array.
Fourteen skills are `user-invocable: false`, but thirteen of them
(`orchestration-envelope`, the `review-*` pack, `plan-feature-scaffold`,
`plan-feature-from-issue`) **are** listed in `plugin.json` because
orchestrators compose them in target projects — they must stay discoverable
and installable. Only `bump-skill` satisfies both conditions, so it is the
only skill that receives `metadata.internal: true`. The review-pack
sub-skills must **not** be marked internal.

### Out of scope

- Relocating `bump-skill` out of `skills/` (option 1) — unnecessary given
  option 2; rejection recorded in `decisions.md`.
- Converting `bump-skill` to a hook (option 3) — it is judgement work (pick
  major/minor/patch, write changelog + README prose) a shell hook cannot do;
  rejection recorded in `decisions.md`.
- Any `docs/workflow/REPLICATE.md` or `docs/workflow/model-routing.yml` edit:
  the acceptance criterion is conditional on a **path change**, and option 2
  changes no path. `bump-skill` stays at `skills/bump-skill/` — both files are
  unaffected. (Confirmed: `model-routing.yml` still references `bump-skill` at
  its current key; nothing to reconcile.)
- The broader `plugin.json` ↔ `skills/` parity lint — already shipped by #71
  (PR #95). This fix adds one adjacent rule, it does not rework #71's rules.

## Rules that must never be violated

- **`bump-skill` still runs in this repo.** Claude Code reads
  `.claude/skills/bump-skill/SKILL.md` (via the `.claude/skills → ../skills`
  symlink) and invokes it through the Skill tool per `CLAUDE.md` — none of
  that goes through the `skills` CLI discovery path, so `metadata.internal:
  true` does not affect in-repo dogfooding.
- **The shipped internal sub-skills stay shipped.** The 13 `user-invocable:
  false` skills that are in `plugin.json` must remain discoverable/installable
  — they are dependencies of the review orchestrators. `metadata.internal`
  goes on `bump-skill` only.
- **Docs language English** for all committed artifacts (SKILL.md, SPEC,
  decisions.md, commits, PR).
- **Stack/architecture agnostic** — no product/stack references introduced.
- **One PR, base `main`, conventional commits.**

## Operational risks

- **CLI version dependency.** The mechanism is a property of the `skills`
  CLI, not of this repo. It is present in 1.5.16 and 1.5.19; a future CLI
  release could in principle remove it. Low risk (it's the CLI's documented
  internal-skill feature), no mitigation beyond the recorded finding. If it
  ever regresses, the fallback is option 1 (relocate) — noted in
  `decisions.md`.
- No scheduled-job / queue / cache / schema / external-adapter interaction.

## Security risks

None. No auth, secrets, PII, webhooks, or rate-limits touched. The change is
a single frontmatter key plus documentation.

## Compliance touchpoints

n/a — no domain/compliance rules apply to skill-pack metadata.

## Affected docs

- `skills/bump-skill/SKILL.md` — frontmatter (`metadata.internal`) + the new
  lint rule and rule-count references. (Its version bump + CHANGELOG rows are
  handled by running `bump-skill` on itself in the hardening phase.)
- `CLAUDE.md` — one-line note on the repo-internal-skill convention.
- `docs/fix/74-bump-skill-discovery-exclusion/decisions.md` — new file.
- No ES sibling is implicated: SKILL.md, SPEC, decisions.md, and CLAUDE.md
  are English-only per the docs-language rule (no `.es.md` counterpart).

## Observability

Not a runtime service — "live and healthy" is verified by command, not a
metric: `npx skills add . --list` (with `INSTALL_INTERNAL_SKILLS` unset)
returns a skill list that does **not** include `bump-skill`, while
`INSTALL_INTERNAL_SKILLS=1 npx skills add . --list` **does** — proving the
mechanism gates it rather than the skill being broken.

## Cross-issue notes

- `#40` (closed) — the first, incomplete pass; its SPEC's "no exclusion
  mechanism" assumption is the thing this fix corrects.
- `#71` (closed, PR #95) — shipped the `plugin.json` ↔ `skills/` parity lint;
  this fix adds one adjacent rule to the same `bump-skill` lint section. No
  ordering dependency.
- Open issues #79, #82, #89 — scanned, unrelated (workflow-status envelope,
  SPEC-template heading rendering, audit-pr scope-bleed text-match). No PRs
  open. #74 is independent.

## Effort

**XS–S.** One frontmatter key, one new file, one lint rule + count bump, one
`CLAUDE.md` line. Multi-file but mechanical; ≤ ~2h including verification.

## Decisions made during drafting

- **Option 2 chosen over 1 and 3, by evidence.** The issue left the fix
  undecided pending the CLI-capability question. That question is now answered
  from primary source (the `metadata.internal` gate exists), which the issue
  itself said "makes options 1 and 3 unnecessary." The architect resolves it
  to option 2; no residual user judgement call remains. Full rationale is
  written to `decisions.md` in P2 (per acceptance criterion #2).
- **Lint keys on the conjunction, not `user-invocable: false` alone** — to
  avoid flagging the 13 shipped review-pack sub-skills (see Scope exactness).
- **decisions.md, not just the SPEC** — the issue's acceptance criterion #2
  names `decisions.md` explicitly, so the unit carries one even though the fix
  template is otherwise SPEC-only.

## Acceptance

- [ ] The `skills` CLI's actual exclusion capability is established from
      primary sources and recorded (done in this SPEC's "Primary-source CLI
      capability finding" + `decisions.md`): `metadata.internal: true` gates
      discovery; manifest is additive; no `.skillsignore`.
- [ ] The option decision (option 2) and the rationale for rejecting options 1
      and 3 are recorded in
      `docs/fix/74-bump-skill-discovery-exclusion/decisions.md`.
- [ ] `npx skills add . --list` (with `INSTALL_INTERNAL_SKILLS` unset) no
      longer lists `bump-skill`.
- [ ] `INSTALL_INTERNAL_SKILLS=1 npx skills add . --list` still lists
      `bump-skill` (proves the mechanism, not breakage).
- [ ] `bump-skill` still resolves and runs in this repo via
      `.claude/skills/bump-skill/SKILL.md` (symlink intact; Skill-tool
      invocation unaffected).
- [ ] `skills/bump-skill/SKILL.md`'s new lint rule enforces the conjunction
      (`user-invocable: false` AND absent from `plugin.json`) ⇒
      `metadata.internal: true`, and the rule-count references read "7".
- [ ] `CLAUDE.md` documents the repo-internal-skill convention
      (`metadata.internal: true`) in one line.
- [ ] No `plugin.json` entry is added or removed; the 13 shipped
      `user-invocable: false` sub-skills are unchanged (no `metadata.internal`
      added to any of them).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here.

### Phase-lint (authoritative copy lives in `docs/fix/_TEMPLATE/SPEC.md`)

Each implementation phase below was cut to pass all 8 atomicity boxes (one
deliverable-named title, one declared layer, ≤ 8 tasks, one checkbox = one
deliverable, zero decision words, no conditional scope mutation, no
manual/external gate inside an implementation phase, machine-checkable
done-when).

### P1 — Mark bump-skill internal in frontmatter

Layer: `config/infra`. Done-when:
`INSTALL_INTERNAL_SKILLS= npx skills add . --list` → output contains no
`bump-skill` line, **and** `INSTALL_INTERNAL_SKILLS=1 npx skills add . --list`
→ output contains a `bump-skill` line.

- [x] Add a `metadata:` block with `internal: true` to
      `skills/bump-skill/SKILL.md`'s YAML frontmatter (below
      `user-invocable: false`; leave every other frontmatter line byte-for-byte
      unchanged, including `version:` — the bump happens in hardening).
      Evidence: `skills/bump-skill/SKILL.md:4-5`.
- [x] Capture the exclusion: run `npx skills add . --list` with
      `INSTALL_INTERNAL_SKILLS` unset and confirm `bump-skill` is absent from
      the output (paste the relevant lines).
      Evidence: `Found 28 skills` (down from 29); `bump-skill` not among the
      listed names.
- [x] Capture the override: run `INSTALL_INTERNAL_SKILLS=1 npx skills add . --list`
      and confirm `bump-skill` reappears (paste the relevant lines).
      Evidence: `Found 29 skills`; `│    bump-skill` present in the listing.
- [x] Confirm in-repo dogfooding intact: `readlink .claude/skills` → `../skills`
      and `test -f .claude/skills/bump-skill/SKILL.md` → exit 0.
      Evidence: `readlink` returned `../skills`; symlinked SKILL.md reachable.

### P2 — Record the decision and encode the lint

Layer: `docs`. Done-when:
`test -f docs/fix/74-bump-skill-discovery-exclusion/decisions.md` → exit 0,
**and** `grep -q 'metadata.internal' skills/bump-skill/SKILL.md` → exit 0
(the rule references it), **and** `grep -c '7 authoring rules' skills/bump-skill/SKILL.md`
≥ 1.

- [ ] Create `docs/fix/74-bump-skill-discovery-exclusion/decisions.md`
      recording: (a) the primary-source CLI finding (the
      `data.metadata?.internal === true` discovery gate, verified in
      `dist/cli.mjs` 1.5.16 and 1.5.19; manifest additive; no `.skillsignore`);
      (b) option 2 chosen; (c) options 1 and 3 rejected, with the one-line
      reason each.
- [ ] Add lint rule 7 ("internal-skill discovery exclusion") to
      `skills/bump-skill/SKILL.md` §2b: any `skills/<name>/` that is
      `user-invocable: false` **AND** absent from `plugin.json`'s `skills`
      array must carry `metadata.internal: true`; include the grep recipe and
      an explicit note that skills present in `plugin.json` are exempt.
- [ ] Update the rule-count references in `skills/bump-skill/SKILL.md`
      (`## Turn contract` line and the §2b lint-report sentence) from
      "6 authoring rules" to "7 authoring rules".
- [ ] Add a one-line note to `CLAUDE.md`'s `bump-skill` / Authoring-a-skill
      guidance: a repo-internal skill (`user-invocable: false`, not in
      `plugin.json`) carries `metadata.internal: true` to stay out of
      `npx skills add` discovery.

### P3 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted):
      `npx skills add . --list` discovers every shipped skill and NOT
      `bump-skill`; markdown/cross-references resolve; no stack/real-project
      references leaked.
- [ ] Run `bump-skill` on `skills/bump-skill/SKILL.md` (version + both
      CHANGELOGs + both README tables), since this unit edits it.
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #74`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #74` and push

## Testing

No unit-test layer applies (a frontmatter key + docs). Verification is by
command, at the **integration** layer against the real CLI:
`npx skills add . --list` with the env var unset (bump-skill absent) and set
(bump-skill present). Regression watch: the same command must still list all
28 shipped skills — confirm the count is unchanged except for the removal of
`bump-skill` from the offered set.

## Rollback

Single-commit `git revert` of the fix commit removes the `metadata.internal`
key (bump-skill reappears in discovery) and the lint rule. No data-side
cleanup — nothing in any target-project workflow depends on `bump-skill`'s
presence or absence.

## Status

`pending`
