# Decisions — feature/552-template-secret-scan

- **D1 — the runner is a consent-gated `pre-push` hook** (`secret-scan.sh`,
  the `git-identity-check.sh` pattern), with the manual invocation documented in
  the hooks README as the second door. S4 offers three routes; the hook is the
  only one that is a barrier rather than a discipline — the leak path #487 names
  is a token riding a prose-only push, which is exactly the push nobody
  remembers to scan by hand. The rejected routes: **a sibling crate bin**
  (`path-guard`'s pattern) would make every target project's push depend on
  `bunx`/`npx` resolving a published version, i.e. network in a `pre-push` hook
  and a version pin the scaffold does not otherwise carry; **manual invocation
  only** is documentation, not a gate, and leaves the defect #487 removed. The
  hook never installs itself: `init-workspace` asks, and a refusal is recorded
  as a residual (PE-004, PE-011).

- **D2 — this repository's `local-gate` step switches to the shared
  implementation in this unit.** S5 and AC13 forbid two implementations, and
  staging the switch in a follow-up would leave exactly the drift window the
  issue warns about ("single-source must not land as two copies"). The step
  keeps its id, its `tests: false` marker (a prose-only push is the leak path),
  its empty `DEPS` row and its CI wiring; only `argv[1]` re-points and one
  `--allowlist` flag joins the argv (S10).

- **D3 — the module moves; nothing is copied and no shim survives.**
  `scripts/secret-scan.mjs` becomes `template/.agentic-workflow/hooks/secret-scan.mjs`.
  A re-export shim under `scripts/` would be a second entry point that has to be
  kept honest by hand, and this repository ships no backward-compatibility
  surface (AGENTS.md "No backward-compatibility support").

- **D4 — the scanned root is the caller's working-tree top** (`git rev-parse
  --show-toplevel`), with `--root` as the override. The shipped default was the
  module's parent directory, which after the move is `.agentic-workflow/hooks`
  and would have scanned almost nothing; `cwd` alone is not enough either, since
  `git ls-files` from a subdirectory lists only that subdirectory's files — a
  silent narrowing of a fail-closed gate. A pre-push hook already runs at the
  working tree's top (PE-003), so both doors agree without a flag.

- **D5 — the allowlist is project configuration, not implementation.** Default
  `.agentic-workflow/hooks/secret-scan-allowlist.json` under the scanned root
  (the `hooks/guard-allow.txt` pattern), `--allowlist <rel>` as the override, and
  the shipped template carries no such file — absent means it allows nothing
  (S6, S15). This repository keeps `scripts/secret-scan-allowlist.json` byte for
  byte (S10) and hands the path to the step, because moving the file would
  change the one artifact the issue freezes.

- **D6 — the corpus stays in `scripts/`.** `scripts/secret-scan.test.mjs` is the
  gate inventory's declared carrier for the `secret-scan` row and the root
  suite's discovery pattern; moving it into `template/` would remove the scan
  from this repository's CI (the root suite globs `scripts/*.test.mjs`) and leave
  the inventory pointing at nothing. The template gets its own test in its own
  convention — a shell suite that proves the entry point from a scaffold copy,
  i.e. what a target project can actually run — so both facts are tested without
  a second implementation and without a second corpus.

- **D7 — the rigidity audit registers the moved module with two of its three
  rules.** `rigidity-review.mjs` refuses `origin/main` in a guard and declares
  `scripts/published-refs.mjs` as its home; the template cannot import a
  repository script (S3) and #487's range fallback is frozen (S10). The
  inventory row therefore audits `hardcoded-temp-fallback` and
  `hardcoded-forge-cli`, and the exemption is recorded in the unit doc's
  `## Future cost` with its re-trigger (#554's crate migration), rather than left
  as an undocumented hole.

- **D8 — the renderer and the writers own the artifacts that have one.**
  `## Acceptance criteria` is written by `ceremony acceptance update-criteria`,
  `docs/generated/**` by `scripts/docs-generate.mjs`, the session entry by
  `journal write`, and the roadmap table by the same emitter with the hand-owned
  cells left alone. Only the prose no surface owns (the ledgers, the README
  section, the MIGRATION boundary, the changeset) is hand-written.

- **D9 — domain separation: owner-requested dual landing.** The scanner is a
  *project-domain* gate (#487 built it for this repository) becoming a *product*
  surface because the owner asked (issue #552, 2026-11-14, requirement quoted
  verbatim in S2). Classification test and exception list:
  `docs/workflow/DOMAIN_SEPARATION.md`. The project half stays project — the
  `local-gate` step, this repository's allowlist entries and the unit record —
  so the exception is recorded per surface in the unit doc, not as a blanket.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/secret-scan.test.mjs | P2 | 2026-11-14 | execute-phase | the moved implementation's corpus: its two path constants and the allowlist fixture follow the module, and the new cases (project default, override, never-narrowing root, single-source pins, runner forwarding) join it. No pre-existing assertion is deleted, relaxed or narrowed — the #487 cases keep their claims (S10, S13, S14)
justification | scripts/local-gate.test.mjs | P2 | 2026-11-14 | execute-phase | the step's staged checkout must stage the shipped file at its new relative path, or the gate-level refusal case would test a file the step no longer runs; its two refusal assertions are untouched (S5, S10)
justification | template/.agentic-workflow/hooks/tests/test-secret-scan.sh | P2 | 2026-11-14 | execute-phase | the new template suite: a hook-test carrier under `scripts/git-config-writes.mjs`'s walk, passing every fixture identity with `git -c` and writing no git configuration (S7, S14)
```
