# Decisions — 75 pi-package-version-gate

Dated rows; one decision per row. Recorded per the unit-lane design step
(gap interview): the issue (#292) already answers the expensive-to-undo gaps
(scope = PR CI gate, trigger set, degradation policy, fix message), so no
form-turn was needed; the remaining cheap choices are recorded here as
assumptions correctable by the user.

- **2026-10-15 D1 — Gate home is `root-suite.yml`, not a new workflow file.**
  Why: root-suite already runs on every `pull_request` with `fetch-depth: 0`
  (full history the content gate's three-dot diff needs), so the gate rides the
  existing PR surface; a new workflow file would duplicate setup for no
  isolation gain. Assumption: two new jobs in that file (content step +
  `dependency-pin-gate` job) are discoverable enough.

- **2026-10-15 D2 — One script, two modes (`--content` offline, `--pins`
  registry) instead of two scripts.** Why: both halves answer the same question
  ("does the package's shipped content match its version?"), share the package
  reading and semver comparison, and the ACs allow the registry check as a
  *separate job*, not a separate codebase. `--pins` takes an injectable fetcher
  so the suite stays offline-deterministic.

- **2026-10-15 D3 — `publish-pi-package.yml` `paths` unchanged.** Why: the gate
  forces every content change to bump the package version, so the merged commit
  always touches `packages/pi-agentic-workflow/**` and the existing paths filter
  fires. Adding `skills/**` to `paths` would be redundant; the publish-side
  exact-membership gate (`npm-version-gate.mjs`) already handles re-runs.

- **2026-10-15 D4 — Release content: schema pin 4.5.0 → 4.6.0, package
  0.19.1 → 0.20.0 (minor).** Why: the stranded skills (unit-lane 1.3.0→1.5.0
  line, audit-pr 5.5.0/5.6.0, pre-execution-review 2.7.0, `bump-skill`
  directory) are new backward-compatible capability — minor, not patch; and the
  pin bump ships #289's lineage fix to Pi consumers. No major (no breaking
  change; the #176 freeze binds skills' own semver, and the package follows
  minor here regardless).

- **2026-10-15 D5 — Non-exact dependency specs and `peerDependencies` are
  skipped by `--pins` with a notice, not failed.** Why: peer ranges are by
  nature non-exact (repo convention keeps `peerDependencies` ranges); failing
  on them would make the gate permanently red. The repo's exact-pin rule for
  `dependencies` is separately enforced by the Pi package's own
  lockfile-policy test — no new authority invented here.

- **2026-10-15 D6 — Registry unreachability is a degraded pass (exit 0 with a
  `::warning::`), never a failure.** Why: AC3 names the registry job
  "clearly-degraded-when-unreachable"; failing CI on a network blip would make
  every PR red for reasons no commit caused.

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/version-parity-gate.mjs | P1 | 2026-10-15 | execute-phase | AC1/AC2 deliverable: the new gate script itself is the protected-path test-file surface this unit creates and iterates on
justification | scripts/version-parity-gate.test.mjs | P2 | 2026-10-15 | execute-phase | AC3 deliverable: the offline deterministic suite pinning the gate's matrix is a new test file by design
justification | .github/workflows/root-suite.yml | P3 | 2026-10-15 | execute-phase | AC1/AC3 wiring: the gate rides the existing PR-triggered root-suite workflow as its publish surface
justification | packages/pi-agentic-workflow/package.json,packages/pi-agentic-workflow/bun.lock | P4 | 2026-10-15 | execute-phase | AC4: repair the live drift — schema pin 4.5.0→4.6.0 and the package version bump the gate enforces
justification | CHANGELOG.md | P4 | 2026-10-15 | execute-phase | AC1/AC5: the companion row the gate itself demands for the 0.20.0 bump
```
