# 10 — envelope-orchestrator-only · TASKS

Per-phase checklists the executor ticks off. Command-checkable criteria are
emitted as the command to run — verify by running it, not by judging prose.

> Gate reminder: **do not start P1 until the driver's repair loop is confirmed
> ready** (SPEC Dependencies).

## P1 — Orchestration home

- [x] Add the canonical driver system-prompt snippet (fenced, verbatim) to
      `skills/orchestration-envelope/SKILL.md`.
- [x] Document the repair loop in `docs/workflow/ORCHESTRATION.md`
      (parse-fail → re-invoke with `Emit only the machine envelope for the turn
      above.`; state rationale + retry bound).
- [x] Mirror the snippet into `docs/workflow/PORTABLE_PROMPT.md`.
- [x] Note `workflow-status` remains the inline emitter.
- [x] Verify:
      ```sh
      grep -qi "system-prompt snippet" skills/orchestration-envelope/SKILL.md
      grep -qi "repair loop" docs/workflow/ORCHESTRATION.md
      grep -qi "system-prompt snippet\|every turn MUST end" docs/workflow/PORTABLE_PROMPT.md
      ```
      all three green.
- [x] Commit `docs(orchestration): envelope contract + repair loop move to driver layer`.

## P2 — Strip the 14 skills

- [x] For each of the 14, delete the `## Machine envelope` section, the
      turn-contract envelope box line(s), and any "then the machine envelope"
      clause in the closing block:
      `audit-docs, audit-pr, bump-skill, design-feature, execute-phase,
      generate-docs, init-workspace, log-session, plan-feature, plan-fix,
      product-audit, review-change, ship-roadmap, triage-issue`.
- [x] Do not touch `workflow-status` or `orchestration-envelope`.
- [x] Additionally cleared residual `"machine envelope"` prose mentions found
      by the AC2 grep outside the section/box (bump-skill's now-obsolete lint
      bullet, design-feature's dangling self-reference, execute-phase's and
      ship-roadmap's driver-loop descriptions rephrased to avoid the literal
      phrase while keeping the meaning) — AC2 requires zero hits, not just the
      turn-contract line.
- [x] Verify (expect NO output / exit 1):
      ```sh
      grep -l "## Machine envelope" \
        skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md
      grep -il "machine envelope" \
        skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md
      ```
      both exit 1 (no output) — confirmed.
- [x] Verify sensor intact (expect exit 0):
      ```sh
      grep -q "## Machine envelope" skills/workflow-status/SKILL.md
      ```
      confirmed.
- [x] Discovery intact: `npx skills add . --list` — 56 skills listed, no
      malformed frontmatter.
- [x] Commit `feat(skills)!: drop the machine envelope from user-facing skills (keep workflow-status)`.

## P3 — Release metadata

- [x] Bumped the 14 stripped skills MAJOR each (audit-docs 1.7.0→2.0.0,
      audit-pr 2.1.0→3.0.0, bump-skill 1.5.0→2.0.0, design-feature
      1.1.0→2.0.0, execute-phase 1.16.0→2.0.0, generate-docs 1.0.0→2.0.0,
      init-workspace 1.8.0→2.0.0, log-session 1.4.0→2.0.0, plan-feature
      2.1.0→3.0.0, plan-fix 1.4.0→2.0.0, product-audit 1.8.0→2.0.0,
      review-change 1.11.0→2.0.0, ship-roadmap 1.11.0→2.0.0, triage-issue
      1.8.0→2.0.0) + `orchestration-envelope` MINOR (1.0.0→1.1.0, additive
      section) — rows added to CHANGELOG.md + CHANGELOG.es.md (newest-first,
      per skill), release-log entries in both, and the Programmatic
      orchestration section of README.md + README.es.md rewritten to describe
      driver-injection instead of inline emission. No model/effort tier
      changed, so `model-routing.yml` untouched.

      **Note:** ran this manually rather than via the `bump-skill` Skill tool
      invocation — the invoked skill loaded a stale globally-installed copy
      (`~/.claude/skills/bump-skill/SKILL.md`, predating this session's P2
      edits) still describing the old envelope-emission contract for itself.
      The actual repo file (`skills/bump-skill/SKILL.md`, committed in P2) is
      correct; the process below followed its real, current content.
- [x] Added the `docs/workflow/MIGRATION.md` entry for feature 10 (what was
      removed, from which 14 skills, `workflow-status` unchanged, the new
      `orchestration-envelope` home, action needed for existing drivers).
- [x] Verify:
      ```sh
      grep -qi "envelope" docs/workflow/MIGRATION.md   # exit 0 — confirmed
      grep -c "envelope" CHANGELOG.md                  # 47 — confirmed >= 1
      ```
- [x] read-verified: each stripped skill's `version:` major digit incremented
      (confirmed via `grep '^version:'` sweep); mirrored in both CHANGELOGs
      and both README tables (Programmatic orchestration section rewritten in
      both README.md and README.es.md).
- [x] Commit `chore(release): major bump — envelope removed from skills`.

## P4 — Hardening + PR

- [x] Dangling-ref sweep (AC10) — no stripped skill or workflow doc points at a
      removed `## Machine envelope` section:
      ```sh
      grep -rin "machine envelope" skills/ docs/workflow/ | grep -v "skills/workflow-status/" | grep -v "orchestration-envelope"
      ```
      Found and fixed one real dangling reference: `docs/workflow/ORCHESTRATION.md`'s
      opening paragraph claimed "every user-facing skill ends with a machine
      envelope" (true pre-feature-10, false now) — rewritten to describe the
      driver injecting the requirement instead. Re-ran: every remaining hit is
      legitimate (the repair-loop prompt's literal quoted text, the
      driver-facing definition, and the MIGRATION.md note).
- [x] Schema package untouched (expect NO output):
      ```sh
      git diff --name-only origin/main...HEAD | grep '^packages/agentic-workflow-schema/'
      ```
      confirmed — no output, exit 1.
- [x] Discovery intact:
      ```sh
      npx skills add . --list
      ```
      56 skills listed, exit 0.
- [x] Re-run every P1/P2/P3 verify command; all green (AC1–AC7 re-confirmed).
- [x] `workflow-status` still emits (`## Machine envelope` present, line 160).
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown
      file, real backticks, never inline `--body`/heredoc; body includes
      `Closes #17`) and PRINT THE PR URL in the chat.
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`.
- [ ] commit `docs: link PR #<n>` and push.
