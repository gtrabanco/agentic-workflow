# Known issues — 37-phase-lint-script

Deferred items linked to/destined for issues; never inline scope changes.

- `--json` / machine-readable output mode: deferred to feature 38/42 (SPEC
  Deferred decisions row 2; PD2). No issue opened — tracked by roadmap rows.
- Rule-4 heuristics (`→` chains, enumerated cases, created-file counting) are
  deterministic approximations of "one deliverable"; the corpus pins their
  exact behavior. If a real plan is misjudged, the fix is a corpus-pinned
  refinement of the heuristic, never a plan rewrite by the linter.
