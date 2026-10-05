# Suggested commands
- Skill discovery: `npx skills add . --list`
- Skill context budgets: `node scripts/check-skill-context.mjs`
- Schema test/typecheck: `cd packages/agentic-workflow-schema && npm test`
- Schema build only: `cd packages/agentic-workflow-schema && npm run build`
- Package contents: `cd packages/agentic-workflow-schema && npm pack --dry-run`
- Frozen acceptance fingerprint: `git hash-object docs/features/<unit>/ACCEPTANCE.md`
- Branch cleanliness/current remote: `git status --porcelain`; after fetch, `git status -sb`
- Current PR identity: `gh pr view --json number,state,headRefOid,url`
- Check Serena memory graph references from repo root: `serena memories check`.