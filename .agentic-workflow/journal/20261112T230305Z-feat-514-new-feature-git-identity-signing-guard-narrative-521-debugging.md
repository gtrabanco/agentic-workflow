## 2026-11-12T?? — feat/514-new-feature-git-identity-signing-guard — Debugging "Engram not registered — config file invalid" after issue #521

- **Commits:** 0 (investigation only)
- **Files:** none (debugging session)
- **Summary:** Diagnosed why Engram still fails with "config file invalid" after #521 was applied. Root cause: the installed canary (`5.0.0-canary.20261112.2`) predates #514 and does not recognize the `gitIdentity` section, so any worktree's `.pi/agentic-workflow.json` that declares it causes `loadConfig.ok=false`. Confirmed `Bun.JSONC.parse()` is the correct JSONC parser for `pi-agentic-workflow.json` (schema.ts line 730 uses `JSON.parse` — bug #521 fix). The config parse passes but section validation fails. Two additional blockers: no `memory.engram: true` consent in any config file, and the user had deleted the old engram binary before installing the new one.
- **Decisions:** (1) The config validation rejects unknown sections by design (D-E5 in AGENTS.md) — this is intentional, not a tolerance bug. (2) #521 (JSONC in schema.ts) is the real fix for the `JSON.parse` vs `parseJsonc` inconsistency. (3) The catch-22 (worktree config uses a section the installed canary doesn't know) is an order-of-publication problem: #514's config landed before #514's canary was published.
- **Next:** Issue #521 created and labeled `fix-next`. User will close #514, publish the canary, update the package, and retest.

