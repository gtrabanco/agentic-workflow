# `@gtrabanco/agentic-workflow`

Producer crate for the deterministic agentic-workflow scripts. Feature 37
created it as the vehicle the roadmap mandated (rows 37/38/42/45, declined 43):
the first producer feature creates the crate, later producers land their scripts
as subcommands of it.

- **Private, zero dependencies, no build step.** Repository tooling runs with
  bun first and node as the guaranteed fallback (`CLAUDE.md` §Verification).
- **Scratch convention:** `.agentic-workflow/tmp/` at the repository root holds
  throwaway producer output. It is committed as a directory (`.gitkeep`) so the
  convention exists on a fresh clone.

Current producers: none yet. `scripts/phase-lint.mjs` deliberately stays in the
repository's `scripts/` tree (feature 37 ED1); features 38 and 42 add the first
crate subcommands.
