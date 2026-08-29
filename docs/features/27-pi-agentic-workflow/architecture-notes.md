# architecture-notes — 27-pi-agentic-workflow

## Layers

- Everything lives in the new self-contained `packages/pi-agentic-workflow/`
  (second package precedent: `packages/agentic-workflow-schema/`). No Pi core,
  no schema package, no `skills/` source edits — bundled skills are build
  copies with a parity test as the drift guard.
- Layer mapping used by the phase-lint (a plugin's surface is all extension
  code, so layers classify the *kind* of work):
  `config/infra` = manifest/build/bundling (P1) · `domain` = pure config
  load/merge/validate (P2) · `api` = command registration, dispatch guards,
  routing lifecycle (P3) · `ui` = the interactive settings console (P4) ·
  `docs` = package READMEs (P5) · `hardening` + close-out chain (P6).

## Config surface

- Global `~/.pi/agent/pi-agentic-workflow.json` + project
  `.pi/pi-agentic-workflow.json` (project **over** global, per-key). Dedicated
  files only — Pi has no supported plugin settings namespace, so nothing is
  ever written into Pi `settings.json` (D-P4).
- Route shape: `{ model: "inherit" | "provider/modelId", thinking: level |
  "inherit" }`; `onUnavailableRoute: "stop" | "inherit"`; shipped default
  `inherit`. Present-but-invalid config refuses; only *missing* files default.
- Hint acknowledgement state: `~/.pi/agent/pi-agentic-workflow-state.json` —
  state is never mixed into the user's config file (D-E7).

## Lifecycle / binding impact

- Command state machine: `idle → routing → dispatched → settled → restored`;
  busy / in-flight / invalid-config input never leaves `idle`.
- Routing binds per invocation: snapshot model + thinking → `setModel` /
  `setThinkingLevel` → dispatch (`sendUserMessage` mechanism, per the product
  design) → restore after `agent_settled`, guarded against clobbering an
  explicit user model change (S14).
- Skills bind by bytes: `skills/` (repo) → bundled copies, asserted identical
  by `skill-parity`; a merged skill fix flows into the next bundle and a stale
  copy fails the build.

## Preflight

- NRS consumed (frozen ledger `2025-08-22-nrs-regen`; repository inspection
  confirmed the invariants document is absent at HEAD).
- Invariant classification: `n/a: no project invariants declared`
  (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent).
- AD-002 bilingual same-change (P5) · AD-004 one PR against `main` · AD-007
  schema package untouched (regression gate in P6) — all preserved.
