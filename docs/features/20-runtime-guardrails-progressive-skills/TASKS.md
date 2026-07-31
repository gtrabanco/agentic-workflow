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
      Check: `grep -q "sole automated merge authority" skills/ship-roadmap/references/AUDIT_AND_MERGE.md`.
- [x] Require transient wrapper cleanup and a SHA-bound PR automerge comment.
      Check: `grep -q "agentic-workflow:automerge" skills/ship-roadmap/references/AUDIT_AND_MERGE.md`.
- [x] Add bootstrap and upgrade interview steps for detected safety-hook adapters.
      Check: `grep -q "Agent safety hooks" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`.
- [x] Bump changed skill versions and synchronize both changelogs/readmes.
      Check: `git diff --check origin/main...HEAD`.
  Done-when: `grep -q "sole automated merge authority" skills/ship-roadmap/references/AUDIT_AND_MERGE.md` → exit 0.

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
      Check: `git diff --check origin/main...HEAD`.
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

## P6 — Fullauto authority boundary

- [x] Replace caller-controlled fullauto authorization, decision-file, and base inputs with forge-verifiable PR/head/audit evidence; fail closed when that evidence is unavailable.
      Covers: F7–F11, F20, F23, F32, F34, F37, F41.
- [x] Reject interpreter-wrapped direct merge commands and prove the guard denies each wrapper form.
      Covers: reopened F4.
- [x] Synchronize the `audit-pr` and `ship-roadmap` contracts with the enforced authority boundary.
      Covers: F16–F17.
- [x] Add negative fixtures proving unauthorized, stale, foreign-base, failed-CI, and duplicate-comment paths never invoke the fake merge command.
      Check: `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh`.
  Done-when: command-guard and fullauto fixtures reject every unsafe authority path and exit 0.

## P7 — Adapter and context-guard closure

- [x] Use OpenCode's plugin-context worktree and cover the runtime event shape.
      Covers: F42.
- [x] Reject nested files/directories below `references/` and add a regression fixture.
      Covers: F43.
- [x] Cover `--manifest-only` and a bare `--skill` in the context-checker CLI fixture.
      Covers: F44.
- [x] Reconfirm progressive-route contracts after the checker changes.
      Covers: F18.
  Done-when: `bash template/.agentic-workflow/hooks/tests/test-opencode-guard.sh` and `node scripts/check-skill-context.test.mjs` exit 0.

## P8 — Hardening & PR

- [x] Isolate the 28 unrelated tracked `skills/*` modifications before assessing the feature tree.
      Covers: F38. Resolved: tree is clean and synced with `origin/feat/20-...` (0/0); the only `skills/*` paths differing from `origin/main` belong to the feature's nine skills — no unrelated modifications remain to isolate.
- [x] After user confirmation, reword `8c4eec6` to the scoped conventional-commit format and push with `--force-with-lease`.
      Covers: F39. Resolved: the scoped reword `39dc7a9 docs(20): link PR #116` (same tree and parent as `8c4eec6`) is on the branch and pushed; `8c4eec6` remains only as the dangling pre-reword object.
- [x] Run the hook fixtures, context checker and its tests, manifest parsing, `npx skills add . --list`, and `git diff --check` on the synchronized branch.
- [ ] Run `/review-change --adversarial 3`; fold any remaining fix-now findings, then run `/audit-pr`.
      Covers: F40.
  Done-when: the pushed branch has a clean tree, an adversarial PASS, and an audit-pr merge-ready verdict.
