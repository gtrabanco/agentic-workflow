## Portability (agents other than Claude Code)

Preamble + no-slash-menu fallback: owned by `skills/orchestration-envelope/references/PORTABILITY.md` — this section
keeps only its own fallbacks:
- **No per-skill `model:`/`effort:`** — no skill pins a tier; pick tiers yourself:
  the interview and adaptation are judgment work — run them on your
  **strongest** model.
- **No Claude Code hooks** — choose the Cursor, Copilot, or OpenCode adapter
  when available. If the agent exposes no pre-tool hook, report the safety hook
  as unavailable and keep forge rulesets as the hard boundary; `log-session`
  remains the manual logging alternative.
