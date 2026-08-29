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

## 2026-08-29 — engineering half (scaffold)

- **D-E1 — One unit, six phases.** Plan cut to six single-layer phases (P1
  bundling, P2 config engine, P3 routed execution, P4 settings console, P5
  READMEs, P6 hardening & PR). Hard split rule evaluated: a split would move
  S4/S12 (console + docs) to a new chained unit — a product re-scope the
  scaffold cannot perform (product half frozen; D-P12 pins one unit). Every
  phase passes the eight-box lint with local-only verification, satisfying the
  rule's intent; recorded here rather than silently exceeding.
- **D-E2 — Test stack mirrors the schema package:** TypeScript + `tsc` +
  `tsconfig.test.json` + `node --test`; `npm test` = compile then run (NRS F005
  precedent).
- **D-E3 — Bundled skills are committed build copies** with the parity test as
  the drift guard; no skill prose is ever edited inside the package.
- **D-E4 — Settings console declares layer `ui`** (interactive console surface);
  dispatch-only command handlers declare `api`.
- **D-E5 — Strict config validation:** present-but-invalid = refuse (S10);
  only *missing* files resolve to the default. Locked by tests.
- **D-E6 — READMEs written in P5**, after all behavior exists, so documented
  sections describe built features.
- **D-E7 — Hint acknowledgement state in a dedicated file**
  (`~/.pi/agent/pi-agentic-workflow-state.json`), never inside the user's
  config file.

## Open questions

none — dispatch mechanism (sendUserMessage, per the product design's cited
example) and all engineering decisions above are resolved before P1; residual
risks (Pi API drift, skill drift) are pinned by peerDependency + parity test.
