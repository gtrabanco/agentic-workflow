---
"init-workspace": minor
"@gtrabanco/pi-agentic-workflow": minor
---

Guide minimalism: an always-loaded inviolable-rules section with a per-row materialization state, and the reduction pass under it

- AGENTS.md gains '## Inviolable rules' (14 laws, each with its owner pointer and
  its state) and loses the prose the doctrine orders out of the always-loaded
  file, pinning the laws table exactly (blockLines in the budgets manifest).
- The target-project guide's doctrine lands in docs/workflow/SKILL_AUTHORING.md,
  template/AGENTS.md ('## Hard rules' becomes '## Inviolable rules' with a state
  per rule) and init-workspace's interview.
- scripts/inviolable-rules.mjs: the gate that resolves every row's owner and
  state against the tree and the one gate inventory.
