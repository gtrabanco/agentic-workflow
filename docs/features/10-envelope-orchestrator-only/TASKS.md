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

- [ ] For each of the 14, delete the `## Machine envelope` section, the
      turn-contract envelope box line(s), and any "then the machine envelope"
      clause in the closing block:
      `audit-docs, audit-pr, bump-skill, design-feature, execute-phase,
      generate-docs, init-workspace, log-session, plan-feature, plan-fix,
      product-audit, review-change, ship-roadmap, triage-issue`.
- [ ] Do not touch `workflow-status` or `orchestration-envelope`.
- [ ] Verify (expect NO output / exit 1):
      ```sh
      grep -l "## Machine envelope" \
        skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md
      grep -il "machine envelope" \
        skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md
      ```
- [ ] Verify sensor intact (expect exit 0):
      ```sh
      grep -q "## Machine envelope" skills/workflow-status/SKILL.md
      ```
- [ ] Commit `feat(skills)!: drop the machine envelope from user-facing skills (keep workflow-status)`.

## P3 — Release metadata

- [ ] Run `bump-skill` for the 14 stripped skills (MAJOR each; CHANGELOG.md +
      CHANGELOG.es.md rows; both README skill/model tables refreshed).
- [ ] Add the `docs/workflow/MIGRATION.md` entry for feature 10.
- [ ] Verify:
      ```sh
      grep -qi "envelope" docs/workflow/MIGRATION.md
      grep -c "envelope" CHANGELOG.md   # >= 1
      ```
- [ ] read-verified: each stripped skill's `version:` major digit incremented;
      mirrored in both CHANGELOGs and both README tables.
- [ ] Commit `chore(release): major bump — envelope removed from skills`.

## P4 — Hardening + PR

- [ ] Dangling-ref sweep (AC10) — no stripped skill or workflow doc points at a
      removed `## Machine envelope` section:
      ```sh
      grep -rin "machine envelope" skills/ docs/workflow/ | grep -v "skills/workflow-status/" | grep -v "orchestration-envelope"
      # inspect any hits; the only legitimate references are the migration note + orchestration layer
      ```
- [ ] Schema package untouched (expect NO output):
      ```sh
      git diff --name-only origin/main...HEAD | grep '^packages/agentic-workflow-schema/'
      ```
- [ ] Discovery intact:
      ```sh
      npx skills add . --list
      ```
- [ ] Re-run every P1/P2/P3 verify command; all green.
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown
      file, real backticks, never inline `--body`/heredoc; body includes
      `Closes #17`) and PRINT THE PR URL in the chat.
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`.
- [ ] commit `docs: link PR #<n>` and push.
