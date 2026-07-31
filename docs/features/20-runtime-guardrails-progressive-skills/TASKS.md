# 20 — runtime-guardrails-progressive-skills · TASKS

## P1 — Command guard

- [x] Add the canonical normalized command/path policy.
      Check: `test -x template/.agentic-workflow/hooks/guard-command.sh`.
- [x] Add thin Claude Code, Cursor, Copilot, and OpenCode adapters.
      Check: `find template -path '*agentic-workflow*' -o -path '*opencode*' | grep -q guard`.
- [x] Add opt-in platform configuration examples.
      Check: `grep -rq "guard-command" template/.claude template/.cursor template/.github`.
- [x] Cover safe export assignments, environment dumps, `.env` reads, and direct merges.
      Check: `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh`.
  Done-when: `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` → exit 0.

## P2 — Fullauto policy

- [x] Make standalone `audit-pr` verdict/comment-only and remove inherited merge authorization.
      Check: `grep -q "never merges" skills/audit-pr/SKILL.md`.
- [x] Make the active `ship-roadmap --fullauto` audit stage the sole automated merge authority.
      Check: `grep -q "sole automated merge authority" skills/ship-roadmap/SKILL.md`.
- [x] Require transient wrapper cleanup and a SHA-bound PR automerge comment.
      Check: `grep -q "agentic-workflow:automerge" skills/ship-roadmap/SKILL.md`.
- [x] Add bootstrap and upgrade interview steps for detected safety-hook adapters.
      Check: `grep -q "Agent safety hooks" skills/init-workspace/SKILL.md`.
- [x] Bump changed skill versions and synchronize both changelogs/readmes.
      Check: `git diff --check`.
  Done-when: `grep -q "sole automated merge authority" skills/ship-roadmap/SKILL.md` → exit 0.

## P3 — Context distribution

- [x] Add `skills.sh.json` groups without claiming runtime behavior.
      Check: `node -e "JSON.parse(require('fs').readFileSync('skills.sh.json'))"`.
- [x] Add Claude marketplace metadata with the existing plugin as its source.
      Check: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json'))"`.
- [x] Add conservative manual/model invocation metadata to safe standalone skills.
      Check: `grep -rq "disable-model-invocation\|opencode/autoinvoke" skills`.
- [x] Add the deterministic context/reference checker and committed budgets.
      Check: `node scripts/check-skill-context.mjs --manifest-only`.
  Done-when: `node scripts/check-skill-context.mjs --manifest-only` → exit 0.

## P4 — Progressive loading

- [x] Segment `execute-phase` into a compact universal core and conditional resources.
      Check: `node scripts/check-skill-context.mjs --skill execute-phase`.
- [x] Segment `ship-roadmap` by founding, continuation, merge, and report routes.
      Check: `node scripts/check-skill-context.mjs --skill ship-roadmap`.
- [x] Segment `workflow-status` around its deterministic sensor procedure.
      Check: `node scripts/check-skill-context.mjs --skill workflow-status`.
- [x] Segment `review-change` and `audit-pr` route-specific detail.
      Check: `node scripts/check-skill-context.mjs --skill review-change --skill audit-pr`.
- [x] Segment `triage-issue`, `design-feature`, and `init-workspace` route-specific detail.
      Check: `node scripts/check-skill-context.mjs --skill triage-issue --skill design-feature --skill init-workspace`.
- [x] Preserve fixed outputs, one-hop references, and small-model load instructions.
      Check: `node scripts/check-skill-context.mjs`.
- [x] Bump every changed skill and synchronize bilingual version surfaces.
      Check: `git diff --check`.
  Done-when: `node scripts/check-skill-context.mjs` → exit 0.

## P5 — Hardening & PR

- [x] Run both hook fixtures and record results in `testing.md`.
- [x] Run the complete context/reference checker and record before/after metrics.
- [x] Parse manifests and run `npx skills add . --list`.
- [x] Run and record the golden fixture for changed executor-path contracts.
- [x] Synchronize English/Spanish workflow guidance and feature artifacts.
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat.
- [x] Update the roadmap row to `done · [#<pr>](<pr-url>)`.
- [x] Commit `docs: link PR #<n>` and push.
  Done-when: `npx skills add . --list` → exit 0.
