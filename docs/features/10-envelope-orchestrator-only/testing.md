# 10 — envelope-orchestrator-only · testing

Documentation/skills feature — no test code is added. "Green" is the repo's
Verification section (CLAUDE.md) plus the acceptance-criteria commands. Each is a
command the executor **runs**; only two rows are `read-verified`.

Layer: repo-verification (markdown well-formed, cross-refs resolve, no leaked
references, all skills discoverable).

| AC | What it proves | Command (run at repo root) | Pass |
|----|----------------|-----------------------------|------|
| AC1 | envelope section gone from all 14 | `grep -l "## Machine envelope" skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md` | no output (exit 1) |
| AC2 | turn-contract box gone from all 14 | `grep -il "machine envelope" skills/{audit-docs,audit-pr,bump-skill,design-feature,execute-phase,generate-docs,init-workspace,log-session,plan-feature,plan-fix,product-audit,review-change,ship-roadmap,triage-issue}/SKILL.md` | no output (exit 1) |
| AC3 | sensor keeps it | `grep -q "## Machine envelope" skills/workflow-status/SKILL.md` | exit 0 |
| AC4 | canonical snippet in orchestration layer | `grep -qi "system-prompt snippet" skills/orchestration-envelope/SKILL.md` | exit 0 |
| AC5 | repair loop documented | `grep -qi "repair loop" docs/workflow/ORCHESTRATION.md` | exit 0 |
| AC6 | migration note present | `grep -qi "envelope" docs/workflow/MIGRATION.md` | exit 0 |
| AC7 | major bumps + changelog | `grep -c "envelope" CHANGELOG.md` (`>= 1`) + read-verify version majors, es CHANGELOG, both READMEs | `read-verified` |
| AC8 | schema package frozen | `git diff --name-only origin/main...HEAD \| grep '^packages/agentic-workflow-schema/'` | no output (exit 1) |
| AC9 | discovery intact | `npx skills add . --list` | lists all skills |
| AC10 | no dangling refs | `grep -rin "machine envelope" skills/ docs/workflow/ \| grep -v workflow-status \| grep -v orchestration-envelope` | only the migration/orchestration entries remain (`read-verified`) |
