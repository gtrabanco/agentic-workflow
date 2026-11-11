---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(269): target the context — read-set tool + ask-first `rg` bootstrap

The remaining scope of issue #269 lands: `scripts/relevant-files.mjs` (the
per-phase `Relevant files:` read set and its never-authority discipline check —
a changed file that is neither listed in any phase's list nor logged in the
unit doc exits 1 naming it); `execute-phase` reads a phase's read set instead of
surveying the repo and forward-propagates files it discovers to later phases'
sub-sections at phase close; `review-change` consumes the unit's lists as its
read set around the diff (git still owns the review scope); `triage-issue`
verification starts from the affected-file set. The runner crate gains
`agentic-workflow provision rg` — the ask-first, never-root ripgrep bootstrap:
skips when installed, asks and records consent, installs through user-scoped
managers only (brew, cargo, npm, bun, pipx, scoop), else downloads the pinned
ripgrep 15.2.0 binary digest-verified to `~/.local/bin` or
`.agentic-workflow/bin/` plus the gitignore entry. The SPEC templates' example
`Relevant files:` line adopts the parser's declared dash marker.
