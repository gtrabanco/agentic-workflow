# Acceptance manifest v1 — fix-157-claude-skills-self-mount

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The `.claude/skills` symlink is untracked: the git index carries no `.claude/` entry. | `git ls-files .claude/` → no output, exit 0 |
| AC2 | Local opt-in mounts cannot be committed: the path is ignored by a `.gitignore` rule. | `git check-ignore -v .claude/skills` → exit 0, prints the matching rule |
| AC3 | The layout sections drop the symlink line in both languages. | `grep -rn "symlink → ../skills" CLAUDE.md README.md README.es.md` → no matches |
| AC4 | The dogfooding model is documented in the three layout docs, EN + ES in the same change: both opt-in routes named. | `grep -c "ln -sfn ../skills .claude/skills" CLAUDE.md README.md README.es.md` → ≥1 each; `grep -c "no-skills" CLAUDE.md README.md README.es.md` → ≥1 each |
| AC5 | `.serena/memories/core.md` matches the new model (untracked local memory, validated on the checkout). | `grep -c "ln -sfn ../skills .claude/skills" .serena/memories/core.md` → 1; `grep -c "symlinks to" .serena/memories/core.md` → 0 |
| AC6 | No script, test, or CI reference to `.claude/skills` exists or breaks; skill context budgets pass. | `grep -rn "claude/skills" scripts/ .github/ packages/agentic-workflow-schema/test packages/pi-agentic-workflow/test` → no matches; `node scripts/check-skill-context.mjs` → exit 0 (PASS line printed) |
| AC7 | skills.sh discovery intact: every discoverable skill still listed. | `npx skills add . --list` → exit 0 |
| AC8 | Pi package mirror byte-parity holds. | `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 0 failing |
| AC9 | No distribution-channel file touched by the branch (`skills/`, `packages/`, `.claude-plugin/`, `template/`). | `git diff --name-only main...HEAD \| grep -vE '^(\.gitignore$\|CLAUDE\.md$\|README\.md$\|README\.es\.md$\|\.serena/\|\.claude/skills$\|docs/LOGS\.md$\|docs/fix/)'` → no output |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `git ls-files .claude/`
- `git check-ignore -v .claude/skills`
- `grep -rn "symlink → ../skills" CLAUDE.md README.md README.es.md`
- `grep -c "ln -sfn ../skills .claude/skills" CLAUDE.md README.md README.es.md`
- `grep -c "no-skills" CLAUDE.md README.md README.es.md`
- `grep -c "ln -sfn ../skills .claude/skills" .serena/memories/core.md; grep -c "symlinks to" .serena/memories/core.md`
- `grep -rn "claude/skills" scripts/ .github/ packages/agentic-workflow-schema/test packages/pi-agentic-workflow/test`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
- `git diff --name-only main...HEAD | grep -vE '^(\.gitignore$|CLAUDE\.md$|README\.md$|README\.es\.md$|\.serena/|\.claude/skills$|docs/LOGS\.md$|docs/fix/)'`
