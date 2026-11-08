---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
"@gtrabanco/pi-agentic-workflow": patch
"audit-docs": patch
"audit-pr": patch
"init-workspace": patch
"log-session": patch
"orchestration-envelope": patch
"product-audit": patch
"review-a11y": patch
"review-brand": patch
"review-change": patch
"review-code": patch
"review-design": patch
"review-implementation": patch
"review-perf": patch
"review-security": patch
"review-seo": patch
"review-verify": patch
"workflow-status": patch
---

docs(audit-1): deduplicate the portability and finder-contract prose; carry the fix-lane feature rows

Product-audit 1 repairs: the workflow's portability preamble and no-slash-menu
fallback move to one owner (`orchestration-envelope/references/PORTABILITY.md`)
and the internal review pack's `## Scope` + `## Materiality bar` move to one
owner (`review-implementation/references/FINDER_CONTRACT.md`) — the fourteen
carrier skills cite them instead of copying them. The eighteen `done` feature
rows whose units ran through the fix lane are marked `carried by fix #N`, and
the roadmap index names the fix-lane carrier as its second explicit escape
hatch.
