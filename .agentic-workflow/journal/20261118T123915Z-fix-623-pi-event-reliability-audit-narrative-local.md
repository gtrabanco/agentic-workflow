## 2026-11-18T12:38:47Z — fix/623-pi-event-reliability-audit — manual
- **Commits:** 9 (`bbfbeb00…84f4f68c`)
- **Files:** 25 files
- **Summary:** fix/623: apply settled-run boundary + publish PR
- **Decisions:** Boundary shifted from session_shutdown to agent_settled — telemetry sample emits at agent_settled (JSONL: one line per run; ledger: one row per session upserted), journal entry at first boundary reached, AG_WF_PHASE cleared at session_start; no PR judged its own surgery — PR opened externally as #629; first-write-wins on journal (log-immutability gate forbids rewritable blocks); upsert race in ledger sink declared not locked; ## Acceptance criteria section grammar mismatch reported as separate issue; phase-lint suite timeout pre-existing load artifact
- **Next:** Owner review of PR #629 (https://github.com/gtrabanco/agentic-workflow/pull/629); decide on ## Acceptance criteria section-grammar mismatch issue (recommended: open separate issue with reproducer); optional: extend pi-event-reliability@1 matrix to include events nobody listens to (session_before_compact, resources_discover, agent_before_settle)
