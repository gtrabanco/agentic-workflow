# 13 — init-workspace-upgrade-mode · known-issues

Deferred items — each linked to (or destined for) an issue. Deferred work is
**not** implemented inline.

## Deferred

- **`--upgrade` override flag** — upgrade mode is entered by detection (D1). If
  detection false-negatives are reported in practice, add an explicit
  `--upgrade` override. Not built here; no issue opened yet (open one only if a
  false-negative is observed).
- **Per-block auto-migration without interview** — upgrade mode always proposes
  (never silently applies), matching the skill's "never install/overwrite without
  a yes" guardrail. A future "non-interactive upgrade" for CI/unattended runs
  would be a separate feature, not a shortcut here.

## Not an issue (by design)

- **`MIGRATION.md`-absent thin rationale** — accepted (D5), not a defect: the
  diff still surfaces every missing block.
