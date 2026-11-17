---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(tool-choice): enforce rg/bun at the tool call, not in prose

Issue #610. The `rg`-before-`grep` / `bun`-before-`node` convention was measured
drifting again two weeks after the fourth correction round: both preferred tools
were on `PATH` while the audited authoring sessions issued 15 `node`-as-default
and 13 `grep`-as-search commands. Prose read once does not survive a session.

* `packages/agentic-workflow/src/tool-choice/` — the policy: one allowlist (the
  sanctioned `node` forms, the bootstrap pair included) and one classifier that
  separates grep-as-search from a pipe filter, with forwarding tables built
  against rg 15's real flags (`-E` is an encoding there, `-r` a replacement).
  `scripts/invocation-drift.mjs` now imports that allowlist instead of keeping a
  copy, and `scripts/tool-choice-parity.test.mjs` refuses a divergence.
* `packages/pi-agentic-workflow` — the carrier: a `tool_call` branch that blocks
  or rewrites a default-tool `bash` command with the equivalent named in the
  reason, gated on the tool doctor's own resolver. New optional `pi.toolChoice`
  section (`enabled`, `mode: "block" | "rewrite"`), shipped on; acceptance is
  owner-configurable and the node compatibility legs stay unpunished.
* `docs/workflow/GATE_INVENTORY.md` — the `invocation-drift` row is restated to
  what it actually checks (checkability 2) and the carrier claims its own row
  with the whitelist grammar it enforces.
