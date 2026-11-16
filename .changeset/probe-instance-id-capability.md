---
"@gtrabanco/agentic-workflow": minor
---

memory probe: add the sixth, additive `instance-id` capability check (issue #566 B2) — presence and any version string passed `binary-version` while every core below `v2.0.0-rc.11` lacks the capability the memory tools hard-require; the probe now asks the effective runtime directly (`ENGRAM_URL` set → remote authoritative, local not judged; missing binary stays a degraded answer; an unmet capability fails naming `instance-id`).
