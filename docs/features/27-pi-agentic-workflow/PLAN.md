# PLAN — 27-pi-agentic-workflow

Phases only (`P1…P6`). Detail lives in `SPEC.md` (Design) and `TASKS.md`.
`P6` is the hardening phase; the PR is its final step, not a phase of its own.

## P1 — Package skeleton with byte-identical skill bundling
Layer: config/infra · manifest + build script + `skill-parity` test; branch opened,
planning artifacts committed, roadmap row confirmed `planned`.

## P2 — Routing config engine
Layer: domain · config schema/types, global + trust-gated project loaders,
project-over-global merge, default `inherit`, strict present-but-invalid refusal;
`config-merge` / `default-inherit` / `untrusted-project-config` suites.

## P3 — Routed command execution
Layer: api · per-public-skill alias registration, verbatim argument forwarding,
dispatch refusals (busy / in-flight / invalid config), snapshot → apply →
`agent_settled` restore with user-change guard, `onUnavailableRoute` stop/inherit,
one-time persisted first-run hint.

## P4 — Agentic-workflow settings console
Layer: ui · `/agentic-workflow-settings`: merged view (empty overrides render as
`inherit`), default route, per-command set/clear, `onUnavailableRoute`, scoped
global/project saves with untrusted-project refusal.

## P5 — Bilingual package READMEs
Layer: docs · `README.md` + `README.es.md` synchronized (D-E6: written after
behavior exists), reciprocal language-switcher links.

## P6 — Hardening & PR
Layer: hardening · dev-scenario sweep, full package gate + schema regression,
AC16 read-verify, pack listing check, pending-docs check, then the literal
close-out chain (PR open → roadmap `done` → commit + push).
