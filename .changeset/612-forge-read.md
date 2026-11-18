---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
"triage-issue": patch
"runner-contract": patch
"audit-pr": patch
"execute-phase": patch
---

feat(forge-read): close the forge-read bypass — one guarded route, one pin, one shim

Every content-bearing forge read the workflow orders now goes through #470's
guard, and the raw form stops being sanctioned prose.

- **`runner forge-read <issue|pr> <n> [--comments] [--reviews] [--json]`** reads
  one issue or pull request over REST (one transport for the detail, the threads
  and the PR's reviews, because `author_association` is what the author policy
  consumes and `gh … view --json` does not expose it), hands every content field
  to `guardForgeContent`, and prints the fenced delivery — a `stripped:` line per
  removals kind, a named line per exclusion, the metadata the caller needs
  unfenced. An unreachable forge refuses by class instead of reporting an empty
  answer. New contract `forge-read@1`; no schema vocabulary changes.
- **The prose re-point**: ten shipped pages in `skills/`, `template/` and the
  workspace tutorial stop naming a content-bearing `gh … view --json body`, and
  cite `runner forge-read` instead. Write-path and metadata-only `gh` forms stay
  sanctioned.
- **`scripts/forge-read-drift.mjs`**, the sanctioned-forms pin: it reads the
  shipped prose with the crate's own classifier and fails on a content-bearing raw
  read, on a field list it cannot read, on `gh api` in prose, on an exemption
  without a reason, on a runner contract that stops naming the subcommand, and on
  a ban with no sanctioned citation. The sanctioned spelling comes from
  `RUNNER.md`'s subcommand table.
- **The ad-hoc read shim**: `runner forge-read shim install --dir <dir>` writes a
  ten-line `gh` trampoline that answers a content-bearing `view` with the guarded
  delivery and proxies everything else untouched. Arming is explicit; the unarmed
  residual (and three more) are declared in the unit SPEC, not hidden.
- **`content-guard-discipline` gains R5**: a producer that reads a forge REST
  payload outside the guarded route fails the gate by name.
