# fix/157-claude-skills-self-mount

## Goal

Stop repository sessions from self-consuming the working-copy workflow. The
committed `.claude/skills -> ../skills` symlink makes every Claude Code session
opened in this checkout activate the in-development workflow — including
half-written skills — so its gates (review-plan / execute-phase /
verification-contract receipts) apply to the skill-authoring session itself,
block progression, and can shift mid-flight because they are read from the tree
being edited. The fix untracks the symlink, makes local opt-in mounts
uncommittable, and documents the dogfooding model: repo sessions consume the
workflow from the installed release; authoring sessions opt in explicitly.

## Issue

#157 — tracked in this repo's forge (`gtrabanco/agentic-workflow`). The PR
closes it via `Closes #157`.

## Branch

`fix/157-claude-skills-self-mount`

## Depends on

None. Open issues #156 (release tags), #154 (settings pickers), #152 (bilingual
sibling drift check) and roadmap unit 29 (#149) share no file or surface with
this change (see Cross-issue notes).

## Root cause

Dogfooding design decision from the initial layout: `.claude/skills` is a
committed symlink to `../skills` (git mode `120000`, blob `42c5394a…`;
`git ls-files -s .claude/` at HEAD `6b07737b`), and `.gitignore` deliberately
keeps it tracked (`.gitignore:17-19` — "the tracked `.claude/skills` mount is a
template artifact"). The repo documents the mount as dogfooding
(`CLAUDE.md:23`, `README.md:57`, `README.es.md:58`), so skill activation and
skill authoring are the same thing in this checkout: the working-copy workflow
is always active, its gates consult the repo's own workflow state for the
authoring work, and gate definitions can change mid-session because they come
from the same tree being edited.

The symlink is also load-bearing for authoring prose: six cross-skill canonical
references resolve through `.claude/skills/…` (`skills/review-plan/SKILL.md:30,
68, 69`, `skills/review-change/SKILL.md:22`, `skills/review-spec/SKILL.md:29`,
`skills/design-feature/SKILL.md:23`, `skills/execute-phase/SKILL.md:33`,
`skills/ship-roadmap/references/ADVANCE.md:62`), so deleting the symlink alone
would break canonical link resolution. The fix must decouple activation
(default off) from cross-link resolution (explicit, opt-in local mount).

## Detected in

Skill-authoring session creating `review-plan`: the active working-copy
workflow demanded review receipts for the authoring work itself and blocked
progression. Reported on checkout `3992ac17` (2026-09-01) in issue #157;
mechanism re-verified at HEAD `6b07737b` by the triage comment (2026-09-02) and
by this planning pass.

## Scope

### In scope

1. Untrack the symlink: `git rm --cached .claude/skills` — the index entry is
   dropped, the working-tree file stays for the implementer, fresh clones get
   no mount.
2. `.gitignore`: add a `.claude/skills` rule next to the existing
   `.claude/pre-execution-gates/` entry, and reword the comment block
   (`.gitignore:17-19`) that justifies the tracked mount — a local opt-in
   mount becomes impossible to commit accidentally.
3. `CLAUDE.md`, `README.md`, `README.es.md`: drop the `.claude/skills` line
   from the layout block and document the dogfooding model in the same change
   (EN + ES siblings, one commit) — repo sessions use the installed release;
   authoring sessions opt in with the gitignored mount
   (`ln -sfn ../skills .claude/skills`) or exercise a single working-copy
   skill via per-session skill flags (e.g. `pi --no-skills --skill
   skills/<name>/SKILL.md`).
4. `.serena/memories/core.md`: replace the "`.claude/skills` symlinks to
   `../skills`" bullet with the installed-release + opt-in-mount model.

### Out of scope

- Pi npm installs cannot resolve `.claude/skills/…` canonical cross-references
  (the issue's "Related finding"): the package bundles skills verbatim
  (byte-parity contract) with no path rewriter. Routed to a future issue —
  this unit never opens forge issues; file it separately if it should be
  tracked.
- Any change under `skills/` (issue acceptance: root `skills/` untouched —
  skills.sh discovery intact; the six cross-skill references stay and resolve
  via the opt-in mount), under `packages/` (bundle + parity tests unaffected),
  `.claude-plugin/marketplace.json` (names no path — verified), or
  `template/` (its `.claude/` carries only hooks, README and a settings
  example — the self-mount does not propagate to consumers).
- Consumer-side tutorial docs that mention `.claude/skills/` as a
  *target-project install location* (`docs/workflow/REPLICATE.md:60`,
  `docs/workflow/PORTABLE_PROMPT.md:49` + ES, `docs/workflow/MIGRATION.md:614
  -620` + ES, `docs/workflow/SKILLS.md:256` + ES,
  `docs/workflow/REVIEW_AND_CLASSIFY.md:11` + ES): they describe where the
  skills CLI installs for consumers and remain accurate after this fix.

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | The `.claude/skills` symlink is committed (mode `120000`, blob `42c5394a…`) and documented as dogfooding, so working-copy skills activate in Claude Code sessions of this checkout. | repository | `git ls-files -s .claude/`; `CLAUDE.md:23`; `README.md:57`; `README.es.md:58`; `.gitignore:17-19` | 6b07737b | O1, O3 | current | proven | — |
| PE-002 | Reproduction + affected use case: authoring or modifying a skill in this repo gets gated by the active working-copy workflow itself (receipts demanded, progression blocked); the use case "author skills here without self-gating" is broken today. | forge | https://github.com/gtrabanco/agentic-workflow/issues/157 (body + triage comment 2026-09-02) | 6b07737b | O1 | current | proven | — |
| PE-003 | The symlink is load-bearing for six cross-skill canonical references; deletion alone breaks them — the fix must decouple activation from link resolution via an opt-in mount the docs teach. | repository | `skills/review-plan/SKILL.md:30,68,69`; `skills/review-change/SKILL.md:22`; `skills/review-spec/SKILL.md:29`; `skills/design-feature/SKILL.md:23`; `skills/execute-phase/SKILL.md:33`; `skills/ship-roadmap/references/ADVANCE.md:62` | 6b07737b | O3, O4, O5 | current | proven | — |
| PE-004 | Regression scope: no script, test, or CI reference to `.claude/skills` exists, so untracking cannot break automation. | repository | grep over `scripts/`, `.github/`, `packages/agentic-workflow-schema/test`, `packages/pi-agentic-workflow/test` → no matches (run at `6b07737b`) | 6b07737b | O6 | current | proven | — |
| PE-005 | Distribution channels are independent of the mount: the skills CLI reads root `skills/` (`npx skills add . --list` exits 0); the Pi package mirrors `skills/` byte-for-byte (`test/skill-parity.test.mjs`); `marketplace.json` names no path. | repository | `npx skills add . --list` (exit 0); `packages/pi-agentic-workflow/test/skill-parity.test.mjs`; `.claude-plugin/marketplace.json` | 6b07737b | O7, O8, O9 | current | proven | — |
| PE-006 | Regression scope is repo-local: `template/.claude/` carries only hooks, README and a settings example, so the self-mount does not propagate to consumers copying the scaffold. | repository | `git ls-files template/.claude/` (5 entries, no `skills`) | 6b07737b | O9 | current | proven | — |
| PE-007 | Rollback: a single `git revert` of the untrack commit re-tracks the symlink (or `ln -sfn ../skills .claude/skills` locally); the change set is git-metadata + docs only, so no data or artifact cleanup exists. | derived | git-revert mechanics over PE-001 (single-commit, non-code change set) | 6b07737b | Rollback section | current | proven | — |
| PE-008 | The issue's cited "full diagnosis" (`docs/research/skill-authoring-consumption-separation-2026-09-01.md`) was never committed; this SPEC relies only on repository evidence, not on that doc. | repository | `git log --all` on the path → empty; `docs/research/` holds two unrelated files | 6b07737b | Decisions made during drafting #2 | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | Issue #157 AC "git ls-files .claude/ returns nothing" | Invariant: the repo carries no always-on activation surface; fresh checkouts are inert | P1 | Drop the index entry | execute-phase | AC1 — `git ls-files .claude/` → no output, exit 0 | Pasted command + output in progress.md | verified |
| O2 | Issue #157 AC ".claude/skills is added to .gitignore" | Required failure state: a local opt-in mount cannot be re-committed (without force) | P1 | Add the ignore rule | execute-phase | AC2 — `git check-ignore -v .claude/skills` → exit 0 naming the rule | Pasted command + output in progress.md | verified |
| O3 | Issue #157 AC "CLAUDE.md … layout sections drop the symlink line" | Use case: repo docs describe the real layout and the authoring opt-in | P2 | CLAUDE.md layout note | execute-phase | AC3 + AC4 (CLAUDE.md counts) | Pasted grep output in progress.md | verified |
| O4 | Issue #157 AC (README layout) + `CLAUDE.md` → Working rules bilingual rule | Bilingual pair updated in the SAME change (EN + ES, one commit) | P2 | README pair note | execute-phase | AC3 + AC4 (README.md / README.es.md counts) | Pasted grep output in progress.md | verified |
| O5 | Issue #157 AC ".serena/memories/core.md updated" | Use case: local agent memory matches the shipped model | P2 | core.md bullet swap | execute-phase | AC5 — both greps on core.md | Pasted grep output in progress.md | verified |
| O6 | Issue #157 AC "No script, test, or CI reference … breaks" | Invariant: automation stays green after untracking | P3 | Verification gate | execute-phase | AC6 — grep no matches + `node scripts/check-skill-context.mjs` exit 0 | Pasted commands + exit codes in progress.md | verified |
| O7 | Issue #157 AC "skills.sh discovery intact" | Use case: consumers can still discover and install every skill | P3 | Verification gate | execute-phase | AC7 — `npx skills add . --list` exit 0 | Pasted command + exit code in progress.md | verified |
| O8 | Issue #157 AC "Pi package bundle + parity tests pass" | Invariant: the committed mirror stays byte-identical to `skills/` | P3 | Verification gate | execute-phase | AC8 — `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` passes | Pasted test result in progress.md | verified |
| O9 | Issue #157 AC "marketplace.json untouched" + root `skills/` untouched | Required failure state: fix bleeds into distribution surfaces | P3 | Verification gate | execute-phase | AC9 — diff-scope filter → no output | Pasted command + output in progress.md | verified |

## Amendments

| Date | Approved by | Change | Linked issue |
| --- | --- | --- | --- |
| 2026-09-03 | user (`F1 -> a`) | Amend the frozen AC9 validator so its exclusion list also carries `\.claude/skills`: P1 of this very unit deletes the previously-tracked mount, so the deletion necessarily appears in `main...HEAD` and the original filter could never pass on a branch that succeeds. Also escape the dots in the SPEC's own copy of the alternation, which was amended by `7fad64ae` without this ledger entry. The required outcome is unchanged and not weakened: no `skills/`, `packages/`, `.claude-plugin/` or `template/` path may appear in the diff. Re-frozen as a replacement manifest with a fresh blob-bound receipt. | [#157](https://github.com/gtrabanco/agentic-workflow/issues/157) |
| 2026-09-03 | review-findings fold (F10) | Re-freeze manifest with `$`-anchor regex precision (blob `78218f21`) to prevent prefix-matching of exclusion rules (e.g. `.gitignore.bak`); required outcome unchanged and strength retained | [#157](https://github.com/gtrabanco/agentic-workflow/issues/157) |
| 2026-09-03 | user (F15 fold — end the re-review loop) | Add `docs/LOGS\.md` to the AC9 exclusion list: the session log is a workflow-bookkeeping surface any session may append to, so its commits enter `main...HEAD` without the unit touching any distribution channel — the original filter re-fails a finished unit on every unrelated log commit and re-opens the review loop. Required outcome unchanged: no `skills/`, `packages/`, `.claude-plugin/` or `template/` path may appear. Re-frozen as a replacement manifest with a fresh blob-bound receipt. | [#157](https://github.com/gtrabanco/agentic-workflow/issues/157) |

## Acceptance

1. `git ls-files .claude/` produces no output and exits 0 — the symlink is
   untracked. (command-verified)
2. `git check-ignore -v .claude/skills` exits 0 and names a `.gitignore` rule —
   local opt-in mounts can never be committed. (command-verified)
3. `grep -rn "symlink → ../skills" CLAUDE.md README.md README.es.md` produces
   no matches — the layout sections drop the symlink line in both languages.
   (command-verified)
4. `grep -c "ln -sfn ../skills .claude/skills" CLAUDE.md README.md
   README.es.md` returns ≥ 1 for each file, and `grep -c "no-skills" CLAUDE.md
   README.md README.es.md` returns ≥ 1 for each file — the dogfooding model
   (gitignored opt-in mount + per-session single-skill flags) is documented in
   EN and ES in the same change. (command-verified)
5. `grep -c "ln -sfn ../skills .claude/skills" .serena/memories/core.md`
   returns 1 and `grep -c "symlinks to" .serena/memories/core.md` returns 0 —
   the local memory matches the new model. (command-verified)
6. `grep -rn "claude/skills" scripts/ .github/ packages/agentic-workflow-schema/test
   packages/pi-agentic-workflow/test` produces no matches, and
   `node scripts/check-skill-context.mjs` exits 0 with its PASS line — no
   automation reference exists or breaks, context budgets hold. (command-verified)
7. `npx skills add . --list` exits 0 and lists the discoverable skills —
   skills.sh discovery intact. (command-verified)
8. `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` passes
   with 0 failing — the committed Pi-package mirror stays byte-identical.
   (command-verified)
9. `git diff --name-only main...HEAD | grep -vE
   '^(\.gitignore$|CLAUDE\.md$|README\.md$|README\.es\.md$|\.serena/|\.claude/skills$|docs/fix/)'`
   produces no output — no distribution-channel file (`skills/`, `packages/`,
   `.claude-plugin/`, `template/`) is touched by this branch. (command-verified)

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction, the root
      cause, the regression scope, and the rollback path — none blank, none
      `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Phases

Execution ledger — `execute-phase --fix 157` runs **all remaining phases by
default** and ticks tasks here; an explicit phase argument (`--fix 157 P1`)
runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

Phase-lint results at drafting time:

```text
P1 Untracked .claude/skills mount ...... PASS (8/8) · fingerprint P1:config/infra:3:Untracked .claude/skills mount
P2 Dogfooding model documentation ...... PASS (8/8) · fingerprint P2:docs:3:Dogfooding model documentation
```

### P1 — Untracked `.claude/skills` mount

Layer: `config/infra`. Target: git index + `.gitignore`. Done-when:
`git ls-files .claude/` → no output AND `git check-ignore -v .claude/skills` →
exit 0.

- [x] Drop the index entry with `git rm --cached .claude/skills` (the
      working-tree symlink stays for the implementer; fresh clones get no
      mount) — run from the fix branch, never on `main`.
- [x] Add a `.claude/skills` rule to `.gitignore`, grouped with the existing
      `.claude/pre-execution-gates/` entry, so a local opt-in mount can never
      be committed accidentally.
- [x] Reword the `.gitignore` comment block (`.gitignore:17-19`) that calls
      the mount "tracked … template artifact" so the comment matches the
      post-fix state (`grep -n "template artifact" .gitignore` → no matches).

### P2 — Dogfooding model documentation

Layer: `docs`. Done-when: `grep -rn "symlink → ../skills" CLAUDE.md README.md
README.es.md` → no matches AND `grep -c "ln -sfn ../skills .claude/skills"
CLAUDE.md README.md README.es.md` → ≥ 1 each.

- [x] `CLAUDE.md`: drop the `.claude/skills` line from the Repository layout
      block and add a short note under the block stating the dogfooding model —
      repo sessions consume the workflow from the installed release (Pi
      package / installed plugin), the working copy is inert by default, and
      authoring sessions opt in with the gitignored mount
      (`ln -sfn ../skills .claude/skills`) or per-session single-skill flags
      (e.g. `pi --no-skills --skill skills/<name>/SKILL.md`).
- [x] `README.md` + `README.es.md`: drop the layout line and add the same note
      to both language siblings in this change (bilingual rule — one commit
      carries the EN and ES edits together).
- [x] `.serena/memories/core.md`: replace the "`.claude/skills` symlinks to
      `../skills`…" bullet with the installed-release + opt-in-mount model
      (untracked local memory — see Decisions #6).

### P3 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #157`
      (body amended post-open to carry `Closes #157` — fold F8, trail in
      progress.md Execution receipt v4; forge closing link verified)
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #<n>` and push

## Testing

No application code changes: verification is git-metadata and
documentation-presence checking (ACCEPTANCE AC1–AC9, all re-runnable in
seconds). The defect is a repository-state property, so the validators are
git commands (`git ls-files`, `git check-ignore`, diff-scope filter) plus the
existing project gates (context budgets, skills discovery, package parity).
No new tests are added — there is no runtime surface to unit-test, and AC6–AC9
already exercise the regression-risk surfaces (automation, discovery, parity).

## Rollback

Single `git revert` of the untrack commit re-tracks `.claude/skills` and
restores the previous always-on behavior; alternatively
`ln -sfn ../skills .claude/skills` restores it locally without touching
history. Data cleanup: none. Preserved: everything — the change set contains
no data, no artifacts, and no migration.

## Status

`done`

## Impact

- Layers: `config/infra` (git index, `.gitignore`) and `docs` (`CLAUDE.md`,
  `README.md`, `README.es.md`, `.serena/memories/core.md`). This repo has no
  schema/db, domain, api or ui layer.
- Modules/files: `.claude/skills` (index entry only), `.gitignore`,
  `CLAUDE.md`, `README.md`, `README.es.md`, `.serena/memories/core.md`,
  `docs/fix/README.md` (index row).
- Blast radius: repo-local. Consumers install from root `skills/` (skills.sh)
  or the Pi package bundle; neither reads `.claude/skills` (PE-004, PE-005,
  PE-006). The only behavior change outside this checkout is that fresh clones
  no longer carry a live mount — the issue's intended outcome.
- Detection lead time: immediate — the next session opened in a fresh clone
  activates no workflow skills (intended default); an authoring session that
  needs the working copy follows the documented opt-in command. Silent-failure
  probe: re-run AC1 + AC2 (`git ls-files .claude/` must stay empty).

## Rules that must never be violated

- Root `skills/` is untouched (issue acceptance): skills.sh discovery and the
  byte-parity mirror keep passing (AC7, AC8).
- Bilingual rule: `README.md` + `README.es.md` change in the SAME commit
  (`CLAUDE.md` → Working rules).
- Docs language is English; commits and artifacts in English
  (`CLAUDE.md` → Working rules).
- Stack/architecture agnostic phrasing in the shared docs — the note names the
  affected surface factually (this repo's own layout + one example flag) and
  introduces no stack dependency into `skills/` or `template/`.
- One PR per unit, always against `main`; never commit to `main` directly
  (`CLAUDE.md` → Working rules).
- No forge writes from this unit: the Pi-npm link limitation found in the
  issue's Related finding is routed out of scope, never filed by this fix.

## Operational risks

n/a — no scheduled jobs, queues, caches, schema, external adapters, or
concurrency surfaces exist in this repository (docs + skills distribution
only). The only operational surface is git itself, covered by AC1, AC2 and
Rollback.

## Security risks

Positive side effect only: a local, uncommitted `.claude/skills` mount
(potentially holding WIP or locally modified skills) can no longer be
committed accidentally — the ignore rule enforces the boundary (O2). No auth,
secrets, PII, webhooks, or rate limits are touched.

## Compliance touchpoints

n/a — no domain or compliance rules apply to this repository's git metadata
and docs.

## Affected docs

- `CLAUDE.md` — layout section + dogfooding model → AC3, AC4.
- `README.md` / `README.es.md` — layout section + dogfooding model, EN + ES in
  the same change → AC3, AC4.
- `.serena/memories/core.md` — memory bullet → AC5.
- `docs/fix/README.md` — index row added at draft time (this commit), flipped
  to `done` in Hardening & PR.
- Consumer tutorial docs deliberately unchanged (see Out of scope).

## Observability

The repository has no logs, metrics, or alerts. Health probe after the fix:
AC1 + AC2 (untracked + ignored) and AC6 (automation green). Silent failure
mode: the symlink being re-tracked by a deliberate `git add -f .claude/skills`
— detectable by re-running `git ls-files .claude/` (must stay empty); the
ignore rule makes accidental re-adding impossible, and a force-add is visible
in review.

## Cross-issue notes

- #156 (stable per-release ref/tag): unrelated surface (forge tagging); no
  dependency in either direction.
- #154 (settings pickers at scale): package UI work; no file overlap.
- #152 (bilingual sibling drift check): would automate the discipline this fix
  performs manually (README pair same change); no conflict — if it lands
  first, its check simply guards O4.
- #149 / roadmap unit 29 `bounded-implementation-discovery` (`planned`):
  touches `execute-phase` internals; this fix touches no skill — no overlap.
- NRS staleness: `docs/workflow/REPOSITORY_STATE.md` F006 ("the only open
  implementation issues are #146 and #149") no longer matches the forge
  (checked 2026-09-02: #152, #154, #156, #157 open; no open PRs). Not a
  contradiction with this plan's facts; ledger corrections belong to
  `resolve-repository-state`, never to this SPEC.
- Open PRs: none (checked 2026-09-02).

## Effort

XS — ≤ 1 h, one commit: one index drop, two `.gitignore` edits, four doc
files, one index row. No test, build, or bundle churn.

## Decisions made during drafting

1. `git rm --cached` (not `git rm`): the implementer keeps a working local
   mount while the repo state becomes inert; fresh clones get nothing. Both
   satisfy the issue's `git ls-files` criterion; `--cached` avoids breaking
   the implementer's own authoring session mid-fix.
2. The issue's "full diagnosis" citation is stale (PE-008): the root cause
   here stands only on repository evidence, never on the uncommitted research
   doc.
3. The dogfooding note lives in the layout sections (where the symlink line
   lived) rather than in a new doc: the issue requires the layout sections to
   carry it, and a separate doc would multiply maintenance for a two-sentence
   model.
4. Skill prose keeps its six `.claude/skills/…` canonical references (issue
   acceptance forbids touching `skills/`); they resolve in authoring sessions
   through the opt-in mount documented by P2. The known Pi-npm limitation of
   those links is the issue's Related finding and stays out of scope.
5. AC4/AC5 anchor on the exact opt-in command (`ln -sfn ../skills
   .claude/skills`) and the language-neutral flag string (`no-skills`) so
   "model documented" is mechanically checkable in all four files in both
   languages.
6. `.serena/memories/core.md` is untracked local memory (`.gitignore:15`
   ignores `.serena`; `git ls-files .serena/` is empty): the P2 edit and its
   AC5 validation happen on the working checkout and intentionally do not
   travel through the PR — the issue's criterion is about this checkout's
   agent memory, which is per-machine by design.
