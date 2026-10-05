# Task completion gates
- Always inspect `git status --porcelain`; no tracked work may remain outside commits under review.
- For schema-package changes: `cd packages/agentic-workflow-schema && npm test`; also verify `npm pack --dry-run` when distribution/API surface changes.
- For skill/workflow changes: `node scripts/check-skill-context.mjs` and `npx skills add . --list`.
- Keep bilingual human-readable pairs synchronized in one change.
- Verify conventional commit format and pushed branch/PR HEAD before final review.
- Delivery-unit review recomputes the frozen acceptance blob and matches its progress receipt; manifest changes need explicit user-approved SPEC amendment and a fresh committed receipt.
- Final clean PR review must have an exact-HEAD `review-change:pass` comment before `audit-pr`.