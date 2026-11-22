---
type: feature
scope: high
roadmap_summary: Issue [#537](https://github.com/gtrabanco/agentic-workflow/issues/537) (M): one deterministic `doctor` + setup wizard as subcommands of the runner crate — a read-only checker that observes every tool surface with real evidence (path, version, version pairs, health probes, config state), and a consent-gated wizard that only asks where a write or a real decision exists. Blocked by #352 (crate migration) and #424 (feedback tiers).
---

# features/98-deterministic-tool-doctor

> One-line: one deterministic `doctor` + setup wizard as subcommands of the runner
> crate — read-only evidence collection, consent-gated wizard, closed-vocabulary
> moves. Blocked by #352 (crate migration) and #424 (feedback tiers).

## Issue

[#537](https://github.com/gtrabanco/agentic-workflow/issues/537) —
deterministic tool doctor and setup wizard in the agentic-workflow CLI

## Why

The workflow's third-party tool setup is prose-driven prose work: `init-workspace`
narrates detection and permission asks per tool (serena, engram, rg, gh, hooks),
`setup-env.mjs` hardcodes provision routes, and several setup-state surfaces
degrade silently months later (un-armed shared-merge drivers, missing `pre-push`
hook, a stale engram server serving an old store version from a deleted binary
inode — the 2026-11-13 incident).
