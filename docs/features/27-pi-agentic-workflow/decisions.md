# 27 — pi-agentic-workflow — decisions

Dated product decisions. Upsert only; never rewrite or delete a prior row.

## 2026-03-27 — design interview

- **Command surface:** native Pi slash commands from a Pi plugin/package, not Pi core and not a shell CLI.
- **Identity:** feature `27-pi-agentic-workflow`; npm `@gtrabanco/pi-agentic-workflow`; folder `packages/pi-agentic-workflow/`; branch `feat/27-pi-agentic-workflow`.
- **Install:** self-contained. `pi install npm:@gtrabanco/pi-agentic-workflow` provides canonical skills, aliases, and configuration helpers.
- **Unavailable model:** stop and explain by default; `onUnavailableRoute` may be set to `inherit`.
- **Config storage:** dedicated JSON files (global `~/.pi/agent/pi-agentic-workflow.json`, project `.pi/pi-agentic-workflow.json`) because Pi has no supported plugin block in `settings.json`. Console configuration via `/agentic-workflow-settings` is required.
- **Route shape:** one default route plus optional per-command overrides.
- **Lifecycle:** snapshot then restore model and thinking after `agent_settled`; do not restore over an explicit user model change.
- **First run:** effective default is `inherit`; show a one-time persisted hint pointing at JSON and `/agentic-workflow-settings`.
- **Coverage:** friendly aliases for every `user-invocable: true` skill plus `/agentic-workflow-settings`; internals stay bundled without aliases except `metadata.internal: true`, which is excluded.
- **Skills:** canonical and unchanged. Pi-specific behavior lives in the extension and config layer.
- **Success targets:** one-install aliases; argument forwarding; JSON + settings command; invocation-scoped routing with restore; fail-closed unavailable routes; inherit plus one-time hint; byte-identical bundled skills.
- **Size:** M.
- **Traceability:** roadmap only; no GitHub issue.
