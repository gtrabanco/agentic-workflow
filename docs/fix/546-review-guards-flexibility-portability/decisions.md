# 546 — review-guards-flexibility-portability · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

Every suite this unit touches is a protected path (`**/*.test.*`, `tests/**`,
`freeze: true`). Every row below is an *expansion* — no pre-existing assertion is
deleted, relaxed or narrowed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/push-identity-check.test.mjs | P2 | 2026-11-14 | direct application (owner apply order §2) | the identity guard's frozen corpus gains the issue's remote-scope and fork cases; every pre-existing case keeps its exact assertions and the fixture helper only gains a tracked-upstream writer
justification | scripts/identity-hook-parity.test.mjs | P2 | 2026-11-14 | direct application (owner apply order §2) | the two-carrier corpus gains rows for the new scope values and for the signing policy, asserted as asymmetric where the split is deliberate
justification | scripts/local-gate.test.mjs | P2 | 2026-11-14 | direct application (owner apply order §2) | the generated `pre-push` hook gains two cases: the pushed remote reaches the step, and an absent runtime fails the push
justification | scripts/rigidity-review.test.mjs | P2 | 2026-11-14 | direct application (owner apply order §2) | the new gate step's sibling suite is created as the red commit, before the module exists; it writes only throwaway `mktemp -d` copies
justification | template/.agentic-workflow/hooks/tests/test-git-identity-check.sh | P2 | 2026-11-14 | direct application (owner apply order §2) | the commit half's corpus gains the scope matrix, the four signing-policy cases and the two tool-diagnosis cases; every pre-existing case keeps its assertions
justification | template/.agentic-workflow/hooks/tests/test-turn-contract.sh | P2 | 2026-11-14 | direct application (owner apply order §2) | box 4's corpus gains gitlab/gitea/bitbucket/unknown-forge/missing-CLI rows behind PATH stubs; the 31 pre-existing cases keep their assertions
justification | template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh | P2 | 2026-11-14 | direct application (owner apply order §2) | the merge wrapper's corpus gains the `--remote`/`--forge` rows and the temp-resolution case; every pre-existing case keeps its assertions
justification | template/.agentic-workflow/hooks/tests/test-command-guard.sh | P2 | 2026-11-14 | direct application (owner apply order §2) | the command guard's corpus gains the Gitea, GitLab-API and Bitbucket-API rows plus the allowlist rows; every pre-existing row keeps its verdict
justification | template/.agentic-workflow/hooks/tests/test-temp-lib.sh | P2 | 2026-11-14 | direct application (owner apply order §2) | the new helper's sibling suite is created as the red commit, before the helper exists
justification | template/.agentic-workflow/hooks/tests/test-forge-adapter.sh | P2 | 2026-11-14 | direct application (owner apply order §2) | the new adapter's sibling suite is created as the red commit, before the adapter exists
```

## Decisions

- **D1** (2026-11-14) — **The `## Triaged steps` block is this unit's own
  declared list.** `unit-route --triage` answers `TRIAGE ERROR — unit not found`
  for a lane that never opened this unit, and the apply order's §5 freeze
  substitutes for the lane's plan step. The step list is frozen in the SPEC at the
  cut rather than pasted from a machine that has no registration for this unit.

- **D2** (2026-11-14) — **The risk tier's review pass is replaced by the owner's
  external verification.** The computed tier is `high` (named `destructive`
  signal on `fullauto-merge.sh`). The apply order §4 forbids running this
  repository's review/fold machinery on the repository's own surgery (the
  `fix-258` failure: 12 review→fold cycles judging a change to the reviewer), so
  the tier's `review-change` ceremony is discharged by §8's handoff instead, and
  the `destructive` signal is answered by verifying the temp helper and the trap
  in a throwaway copy before the scaffold changes (P7, §3).

- **D3** (2026-11-14) — **The forge CLI vocabulary is `gh`, `glab`, `gt`.** S4
  names `gh`, `glab`, `d2`, `hub`; `hub` is a deprecated GitHub-only wrapper over
  the same API `gh` already speaks, and `d2` is not any forge's CLI. Gitea's
  official CLI is `gt`, which replaced the now-archived `tea` (PE-008). Naming a
  binary that does not exist would be a security illusion of the same kind the
  issue complains about in the command guard, so the adapter speaks the three
  that exist and refuses the rest.

- **D4** (2026-11-14) — **Bitbucket is detected and refused, not implemented.**
  Atlassian ships no official pull-request CLI (PE-010); the only `pr merge`
  carriers are third-party wrappers with their own auth models. The adapter
  therefore resolves `bitbucket` as a forge, refuses box 4 with a message naming
  the absent carrier and the REST route, and exits non-zero. A silent pass would
  be worse than the rigidity the issue reports.

- **D5** (2026-11-14) — **The signing policy is a declared field, not an empty
  string.** S7 offers "`--no-signing` **or** `signingKey: \"\"`"; the schema
  forbids the second by contract (`minLength: 1` on every declared fact, and an
  empty string in a config is indistinguishable from a typo). The `--no-signing`
  intent ships as `approved.signing: "required" | "allowed" | "off"`: `"off"`
  approves unsigned commits and refuses a signed one (the sign-off workflow),
  `"allowed"` is the default and permits a machine whose signing is on but whose
  key does not resolve (gpg selects by UID), `"required"` keeps today's strict
  key check. Per-machine keys are `approved.signingKeys: [...]`, matched as a
  union with the single `signingKey` when both are declared.

- **D6** (2026-11-14) — **`commit-and-push-upstream` ships beside
  `push-upstream`.** S2 asks only for `push-upstream`, but the enforcement
  vocabulary is a cross-product of the two halves (`off`, `commit`, `push`,
  `commit-and-push`); shipping one new scope without its combination would make
  "enforce commits *and* only the upstream push" unexpressible — the same rigidity
  in a new place. The pair is added together and both halves honour it.

- **D7** (2026-11-14) — **The command guard's per-project allowlist is a literal
  file, not a config key.** The guard runs on hosts where `jq` is not guaranteed
  (only the adapters require it), so reading the unified JSON config there would
  add a hard dependency to the one guard that has none. `.agentic-workflow/hooks/guard-allow.txt`
  holds one literal command fragment per line (`#` comments and blank lines
  skipped); a merge command matching a line literally is allowed, and an absent or
  unreadable file allows nothing. Fail-closed by construction.

- **D8** (2026-11-14) — **`rigidity-review`'s inventory is declared in the
  script.** The step audits a fixed list of guard carriers with three rules
  (`hardcoded-forge-cli`, `hardcoded-temp-fallback`, `hardcoded-remote`) plus a
  coverage rule: every shell file under the hooks tree and every guard script must
  be named by the inventory, so a new guard cannot enter unaudited. The inventory
  is a JS constant in the module (the `local-gate.mjs` `STEPS`/`DEPS` precedent),
  not a prose table a reader has to keep in sync.

- **D9** (2026-11-14) — **An absent `--remote` keeps the check.** `push-upstream`
  must not become a hole for a caller that forgets the flag: with no remote named,
  the checker cannot prove the push targets the upstream, so it enforces. Only an
  explicitly-named non-upstream remote skips the check, and the skip prints its
  reason.

- **D10** (2026-11-14) — **`hooks/lib/` is where a shared hook fact lives.**
  `temp.sh` and `forge.sh` are sourced by the hooks that need them, resolved
  relative to the hook's own directory (the `hook_dir` idiom
  `git-identity-check.sh` already uses), so a scaffold install needs no `PATH`
  entry. A hook whose library is missing fails closed with a message naming the
  file, never silently skips the check.
