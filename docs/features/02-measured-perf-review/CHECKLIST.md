# 02 — measured-perf-review — Completion checklist (single-pass)

- [x] No schema/migrations — n/a (docs-only repo)
- [x] Core layer imports — n/a (markdown skills, no code layers)
- [x] `init-workspace` 1.8.0: Performance tooling interview round added
      (per-slot fixed checklist; TS/JS tools marked as adapter examples;
      user-confirmed installation; registers the `Performance commands` block)
- [x] `review-perf` 1.1.0: measured-evidence item (run declared bench on base
      + change, cite both numbers, noise band ±5% default, failing command is
      a finding) + explicit `n/a — no declared perf commands` wording + minor
      adopt-tooling finding; report contract otherwise unchanged
      (`PASS | FAIL` decision untouched — callers need no changes)
- [x] `template/CLAUDE.md`: `Performance commands` block next to the
      verification gate (bench / profile / complexity-lint / noise-band)
- [x] Stack-agnostic rule: tool names appear only in init-workspace's marked
      adapter list and the template block's examples — verified by grep
      (see PR evidence)
- [x] Gate green: `npx skills add . --list` exit 0
- [x] CHANGELOG.md + CHANGELOG.es.md rows (init-workspace 1.8.0, review-perf
      1.1.0) + release-log entries; README tables unchanged (no new
      user-facing skill, counts stay)
- [x] User-facing limitations disclosed: benchmark noise on laptops mitigated
      by the noise band (SPEC risk R1)
- [x] No new dependencies

Decisions not in the SPEC: none — D1 (run only when declared AND relevant)
and D2 (user-confirmed installs) implemented as specified.

Version note: `init-workspace` jumps 1.6.0 → 1.8.0 on this branch because
1.7.0 is taken by feature 01's PR #8 (Docs site round). Merge #8 first; the
CHANGELOG row orders resolve on rebase if needed.
