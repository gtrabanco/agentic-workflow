---
type: fix
scope: medium
ac-hash: f66802b3e42807327ae9e4275b27097fe2f7ed4e
---

# fix/546-review-guards-flexibility-portability

> The guards this workflow ships (pre-commit identity, pre-push gate and
> push-range identity, the turn-contract verifier, the command guard and the
> automated-merge wrapper) encode one environment: one approved identity, one
> remote, one forge. A third-party fork, a second machine with its own signing
> key, a corporate `includeIf` layout, a GitLab/Gitea/Bitbucket host or a
> minimal toolchain has no legal path through them. This unit makes each guard
> declare the scope it enforces and degrade loudly instead of guessing, and adds
> a gate step that audits the guards for the hardcoded dependency coming back.
> Applied through the owner's local unpublished workflow (§5 ledger freeze
> substitutes for the lane's plan step); no repo review/fold machinery runs on
> this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#546` — "review guards for flexibility, portability and cross-environment
scenarios" (`bug`, `urgent`, `fix-next`, `pi-agentic-workflow`). The PR closes it
via `Closes #546` in the body.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. `S1` is
the owner's apply instruction; `S2`–`S10` are the issue's `## Acceptance
criteria` lines, in the order the issue states them.

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #546

**S2 — The push-range identity check gains a remote scope.**
> Add `enforce` scope to `gitIdentity`: `push` → push to any remote, `push-upstream` → only push to tracked upstream (default branch).

**S3 — The push-range check takes the remote being pushed to.**
> Add a `--remote` flag to `push-identity-check.mjs` so the pre-push hook can pass the remote being pushed to.

**S4 — The turn-contract verifier detects the forge.**
> Make `turn-contract.sh` detect the remote type (GitHub, GitLab, Gitea, Bitbucket) and use the appropriate CLI (`gh`, `glab`, `d2`, `hub`).

**S5 — The automated merge takes a remote and is forge-agnostic.**
> Add a `--remote` flag to `fullauto-merge.sh` with forge-agnostic merge semantics.

**S6 — The pre-push hook fails closed without a runtime.**
> Pre-push hook prints a clear error and exits non-zero if bun/node is unavailable (instead of silently skipping).

**S7 — Sign-off and per-machine signing keys become legal.**
> Add a `--no-signing` or `signingKey: ""` option to `gitIdentity.approved` so sign-off workflows are allowed.

**S8 — Temp directories are portable.**
> Handle Windows TMPDIR correctly in all hooks (use platform-specific temp directory).

**S9 — The flexibility gaps are documented where the guards live.**
> Document the flexibility gaps in `GIT_IDENTITY_HARDENING.md` and `template/.agentic-workflow/hooks/README.md`.

**S10 — A gate step audits the guards for hardcoded dependencies.**
> Add a `rigidity-review` gate step to the local gate that audits all guards for hardcoded forge/path dependencies.

## Impact

The callers and consumers of what changes:

- `scripts/push-identity-check.mjs` — the `push-identity` gate step
  (`scripts/local-gate.mjs`), the installed `pre-push` hook body, and
  `scripts/identity-hook-parity.test.mjs`, which holds the checker and the
  pre-commit hook to one corpus.
- `gitIdentity` schema (`packages/agentic-workflow-schema/src/config.ts` →
  `config.schema.json`) — read by `packages/pi-agentic-workflow`
  (`src/guards/git-identity.ts`, `src/config/*`), by
  `template/.agentic-workflow/hooks/git-identity-check.sh`, and by the two
  annexes plus `docs/workflow/CONFIG.md`.
- `template/.agentic-workflow/hooks/{turn-contract,fullauto-merge,guard-command}.sh`
  — documented by `template/.agentic-workflow/hooks/README.md`, by
  `skills/orchestration-envelope/references/TURN_CONTRACT.md` (the machine-check
  profile names the shim's tool requirements) and by the four hook suites under
  `template/.agentic-workflow/hooks/tests/`.
- The two new hook libraries (`hooks/lib/temp.sh`, `hooks/lib/forge.sh`) enter
  the scaffold: `template/.agentic-workflow/hooks/tests/test-init-workspace-contract.sh`
  enumerates the scaffold's hook files, and `scripts/git-config-writes.mjs` walks
  every shell test carrier under the hooks tree.
- The new gate step touches `scripts/local-gate.mjs` (`STEPS`, `DEPS`),
  `scripts/local-gate.test.mjs` and `docs/workflow/GATE_INVENTORY.md`.
- Mentions that stop being true: the annex's `enforce` example comment
  (`off | commit | push | commit-and-push`), `docs/workflow/CONFIG.md`'s config
  table row, `TURN_CONTRACT.md`'s "bash + git + gh" sentence, and the
  `fullauto-merge.sh` header's "Requires gh" contract.

**Named high-risk item** (from the computed risk tier below):
`template/.agentic-workflow/hooks/fullauto-merge.sh` · signal `destructive`
(named for its `rm`). This unit rewrites exactly that file's only `rm`: the
temp-file trap becomes the shared helper's, and both the trap and the helper are
exercised in the hook suite before the real tree is touched (§3 of the apply
order). The full review pass the tier normally adds is replaced by the owner's
external verification — the apply order forbids running this repository's review
machinery on its own surgery.

## Retirements

Strictly additive apart from these three, each replaced in the same change:

1. **`enforce` value set** — `off | commit | push | commit-and-push` gains
   `push-upstream` and `commit-and-push-upstream`; no value is removed
   (`rg -c 'commit-and-push' packages/agentic-workflow-schema/src/config.ts` → 1).
2. **The bash hooks' private temp fallback** — `"${TMPDIR:-/tmp}"` in
   `fullauto-merge.sh` retires into `hooks/lib/temp.sh`; the literal survives
   only in that helper (`rg -c 'TMPDIR' template/.agentic-workflow/hooks/*.sh` → 0).
3. **The bare `gh` calls in `turn-contract.sh` / `fullauto-merge.sh`** — the
   forge CLI name moves behind `hooks/lib/forge.sh`; the two callers no longer
   name a forge binary (`rg -c '\bgh (pr|api|repo)' template/.agentic-workflow/hooks/*.sh` → 0).

Neither annex, suite nor skill surface is deleted; the two annexes gain sections
instead.

## Non-goals

- No backwards-compatibility shim: a superseded literal is deleted where it
  lived, not kept alive beside its replacement.
- No Bitbucket implementation. Atlassian ships no official pull-request CLI
  (only third-party `bitbucket-cli`/`atlassian-cli` wrappers), so Bitbucket is
  **detected and refused with a message naming the REST route** — never a silent
  pass, never a guessed `bb`. `d2` and `hub` from S4 are deliberately not used:
  `hub` is a deprecated GitHub-only shim and `d2` is not any forge's CLI; Gitea's
  official CLI is `gt` (which replaced the archived `tea`).
- No new network call, no new runtime dependency: the shell hooks keep their
  tool set (`bash`, `git`, `jq`, one forge CLI when box 4 is asked for).
- No change to what the guards *decide* about an identity, a merge or a path —
  only to which environments they apply to and how they say "I cannot tell".
- No signing-policy relaxation by accident: the default stays the strict reading
  of the declared profile; the relaxed reading is an explicit declaration.

## Risk tier

Computed, never chosen — `node packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths <the planned file set>`:

- **Tier** — `high` · **Task Size** — understood / contained-risk `named` / resumable-from-diff
- **Named high-risk item** — `template/.agentic-workflow/hooks/fullauto-merge.sh` · `destructive` (`rm`)

```text
risk-tier-verdict@1
tier: high
reason_kind: named-high-risk
reason: 1 path(s) touch a named high-risk surface: destructive (template/.agentic-workflow/hooks/fullauto-merge.sh · rm)
signals: template/.agentic-workflow/hooks/fullauto-merge.sh · destructive
```

## Future

none

## Future cost

- The `hooks/lib/` directory is now a scaffold shipping surface: a new guard that
  needs a forge, a remote or a temp directory binds to it instead of re-deriving
  the fact. Binds: whoever adds a hook.
- `scripts/rigidity-review.mjs` carries a declared guard inventory: a new guard
  file must be registered there or the step fails. Binds: whoever adds or renames
  a guard.
- The forge matrix is a claim about three CLIs. Binds: whoever bumps the
  minimum supported `gh`/`glab`/`gt`.

## Applicable tests

| Suite | Covers |
|---|---|
| `bun test scripts/push-identity-check.test.mjs` | the remote scope, the fork case, the pre-existing range cases |
| `bun test scripts/identity-hook-parity.test.mjs` | the two identity carriers agreeing under the new scope values |
| `bun test scripts/local-gate.test.mjs` | the hook body's `--remote` passthrough and its fail-closed runtime branch |
| `bun test scripts/rigidity-review.test.mjs` | the new gate step's inventory, rules and refusals |
| `bun test scripts/prose-gate-inventory.test.mjs` | the new gate's inventory row resolves |
| `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh` | the commit half: scope values, signing policy, tool degradation |
| `bash template/.agentic-workflow/hooks/tests/test-temp-lib.sh` | the portable temp helper |
| `bash template/.agentic-workflow/hooks/tests/test-forge-adapter.sh` | forge detection and per-forge command dispatch |
| `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` | box1–box5 across forges and degradation states |
| `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh` | the merge wrapper across forges and temp resolution |
| `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` | forge-agnostic merge detection and the per-project allowlist |
| `node scripts/run-root-suite.mjs` | no existing suite regressed |

## Known pre-existing issues

- The hook shell suites are not wired into `node scripts/run-root-suite.mjs`; only
  `test-index-consent.sh` is reached (from `scripts/doc-discipline.test.mjs`) and
  `test-opencode-guard.sh` from `test-init-workspace-contract.sh`. **Affects**
  this unit's verification: every hook suite runs by hand in the foreground and
  is reported as such.
- `git-identity-check.sh` reports a missing `jq` as "not valid JSON/JSONC".
  **Affects** this unit: O19 repairs the message (the guard already failed
  closed; only its diagnosis lied).

## Tasks

- P1 — Freeze this unit doc, its two planning ledgers, the acceptance criteria and
  the decisions ledger before the first line of code; register the roadmap
  `## Fixes` row (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/546-review-guards-flexibility-portability/SPEC.md` prints `verdict: PASS` and exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/546-review-guards-flexibility-portability/SPEC.md,
    docs/fix/546-review-guards-flexibility-portability/planning-evidence.md,
    docs/fix/546-review-guards-flexibility-portability/planning-obligations.md,
    docs/fix/546-review-guards-flexibility-portability/decisions.md,
    docs/ROADMAP.md
- P2 — RED corpus first: the issue's scenario table lands as failing checks in
  the nine suites, observed red on the pre-change tree, before any implementation
  (validator: `bun test scripts/push-identity-check.test.mjs` and
  `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` and the
  three sibling hook suites exit non-zero at the red commit, recorded in `## Log`)
  (Implements: S2, S3, S4, S5, S6, S7, S8, S10)
  - Relevant files: scripts/push-identity-check.test.mjs,
    scripts/identity-hook-parity.test.mjs, scripts/local-gate.test.mjs,
    scripts/rigidity-review.test.mjs,
    template/.agentic-workflow/hooks/tests/test-git-identity-check.sh,
    template/.agentic-workflow/hooks/tests/test-temp-lib.sh,
    template/.agentic-workflow/hooks/tests/test-forge-adapter.sh,
    template/.agentic-workflow/hooks/tests/test-turn-contract.sh,
    template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh,
    template/.agentic-workflow/hooks/tests/test-command-guard.sh
- P3 — The vocabulary: `enforce` scope values and the signing policy in the
  schema, the generated `config.schema.json`, the pi package's mirror, and the
  config doc row (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0 and `bun run check:config-schema` prints `config.schema.json` in sync)
  (Implements: S2, S7)
  - Relevant files: packages/agentic-workflow-schema/src/config.ts,
    packages/agentic-workflow-schema/config.schema.json,
    packages/pi-agentic-workflow/src/guards/git-identity.ts,
    docs/workflow/CONFIG.md
- P4 — The push-range scope: `--remote`, the tracked-upstream resolution and the
  skipped verdict in `push-identity-check.mjs` (validator: `bun test scripts/push-identity-check.test.mjs` exits 0 and `bun test scripts/identity-hook-parity.test.mjs` exits 0)
  (Implements: S2, S3)
  - Relevant files: scripts/push-identity-check.mjs,
    scripts/push-identity-check.test.mjs,
    scripts/identity-hook-parity.test.mjs
- P5 — The pre-push hook: the pushed remote reaches the gate and a missing
  runtime fails closed (validator: `bun test scripts/local-gate.test.mjs` exits 0)
  (Implements: S3, S6)
  - Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs
- P6 — The commit half: scope values, the signing policy and the tool-missing
  diagnoses in `git-identity-check.sh` (validator: `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh` exits 0)
  (Implements: S2, S7)
  - Relevant files: template/.agentic-workflow/hooks/git-identity-check.sh,
    template/.agentic-workflow/hooks/tests/test-git-identity-check.sh
- P7 — The portable temp resolution: one helper, validated on a throwaway copy
  before the scaffold changes (validator: `bash template/.agentic-workflow/hooks/tests/test-temp-lib.sh` exits 0)
  (Implements: S8)
  - Relevant files: template/.agentic-workflow/hooks/lib/temp.sh,
    template/.agentic-workflow/hooks/tests/test-temp-lib.sh
- P8 — The forge adapter: detection from the remote URL, the CLI per forge and the
  fail-closed refusals, validated on a throwaway copy before the scaffold changes
  (validator: `bash template/.agentic-workflow/hooks/tests/test-forge-adapter.sh` exits 0)
  (Implements: S4)
  - Relevant files: template/.agentic-workflow/hooks/lib/forge.sh,
    template/.agentic-workflow/hooks/tests/test-forge-adapter.sh
- P9 — `turn-contract.sh` through the adapter: `--remote`, `--forge`, per-remote
  default branch, box 4 across the forge matrix and the degradation states
  (validator: `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` exits 0)
  (Implements: S4)
  - Relevant files: template/.agentic-workflow/hooks/turn-contract.sh,
    skills/orchestration-envelope/references/TURN_CONTRACT.md
- P10 — `fullauto-merge.sh` through the adapter: `--remote`, `--forge`, the
  normalized forge document, the merge dispatch and the temp helper
  (validator: `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh` exits 0)
  (Implements: S5, S8)
  - Relevant files: template/.agentic-workflow/hooks/fullauto-merge.sh
- P11 — `guard-command.sh`: the forge merge surface and the per-project allowlist
  (validator: `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` exits 0)
  (Implements: S1, S10)
  - Relevant files: template/.agentic-workflow/hooks/guard-command.sh,
    template/.agentic-workflow/hooks/guard-allow.txt,
    template/.agentic-workflow/hooks/tests/test-command-guard.sh
- P12 — The `rigidity-review` gate step, red-first, wired into the gate and the
  inventory (validator: `bun test scripts/rigidity-review.test.mjs` and `bun test scripts/local-gate.test.mjs` and `bun test scripts/prose-gate-inventory.test.mjs` exit 0, and `bun scripts/rigidity-review.mjs` prints `RIGIDITY-REVIEW — ok`)
  (Implements: S10)
  - Relevant files: scripts/rigidity-review.mjs, scripts/rigidity-review.test.mjs,
    scripts/local-gate.mjs, scripts/local-gate.test.mjs,
    docs/workflow/GATE_INVENTORY.md
- P13 — Documentation and close: both annexes, the hooks README, the turn-contract
  reference, the rendered projection, the session journal, the differential run,
  the closed obligations and the declared verification commands (validator:
  `node scripts/run-root-suite.mjs` exits 0 and the differential harness prints `UNDECLARED 0`, recorded in `## Log`)
  (Implements: S9, S1)
  - Relevant files: docs/workflow/GIT_IDENTITY_HARDENING.md,
    template/docs/workflow/GIT_IDENTITY_HARDENING.md,
    template/.agentic-workflow/hooks/README.md, docs/LOGS.md,
    docs/generated/

### Planning evidence

M/L unit: the ledger lives in
[`planning-evidence.md`](planning-evidence.md) (14 rows, `PE-001`–`PE-014`).

### Obligations

M/L unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) (20 rows, `O1`–`O20`).

## Acceptance criteria

The anchor every review reads. One observable criterion per `S#`, each naming
the check that proves it.

1. **S1** — the unit ships as one branch off `main` with this doc, its two
   ledgers and its decisions ledger frozen before the first line of code; proven
   by `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/546-review-guards-flexibility-portability/SPEC.md` → `verdict: PASS`.
2. **S2** — `gitIdentity.enforce` accepts `push-upstream` (and
   `commit-and-push-upstream`), `push` keeps meaning "any remote", and the
   pre-commit half refuses an unapproved commit under
   `commit-and-push-upstream`; proven by the schema suite accepting the new enum
   values and `scripts/identity-hook-parity.test.mjs` carrying the new rows.
3. **S3** — `push-identity-check.mjs --remote <name>` scopes the check: with
   `enforce: push-upstream`, a push whose remote is not the tracked upstream's
   remote prints `PUSH IDENTITY — skipped:` and exits 0 while the same range on
   the upstream remote prints `failed:` and exits 1; proven by
   `bun test scripts/push-identity-check.test.mjs`.
4. **S4** — `turn-contract.sh` resolves the forge from the remote URL and asks
   the right CLI (`gh` / `glab` / `gt`), refuses Bitbucket with a message naming
   the absent carrier, and refuses an undetectable forge naming `--forge`;
   proven by `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh`.
5. **S5** — `fullauto-merge.sh --remote <name>` merges through the forge the
   remote names, keeping the SHA-bound preconditions and the idempotent audit
   comment; proven by
   `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh`.
6. **S6** — the installed `pre-push` hook exits non-zero and prints a message
   naming both runtimes when neither `bun` nor `node` is on `PATH`, instead of
   reaching the end of the script and letting the push through; proven by the
   executed-hook case in `bun test scripts/local-gate.test.mjs`.
7. **S7** — `gitIdentity.approved` accepts `signing: "off"` (sign-off
   workflows), `signing: "allowed"` (the second machine with no key) and
   `signingKeys: [...]` (per-machine keys) while `signing: "required"` still
   refuses an unsigned commit; proven by
   `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh`.
8. **S8** — no hook carries a literal `/tmp` fallback (the one resolution lives
   in `hooks/lib/temp.sh` and reads `TMPDIR`, `TEMP`, `TMP` in that order);
   proven by `bash template/.agentic-workflow/hooks/tests/test-temp-lib.sh` and
   the `hardcoded-temp-fallback` rule of `bun scripts/rigidity-review.mjs`.
9. **S9** — both annex copies and `template/.agentic-workflow/hooks/README.md`
   carry the flexibility sections (scopes, signing policy, forge matrix, temp
   resolution, allowlist, degradation); proven by the `rg` anchors recorded in
   `## Log`.
10. **S10** — `rigidity-review` is a step of `bun scripts/local-gate.mjs`
    (listed by `--list`, present in `DEPS`), has a row in
    `docs/workflow/GATE_INVENTORY.md`, refuses a guard file left out of its
    inventory, and fails on a reintroduced hardcoded forge/temp/remote literal;
    proven by `bun test scripts/rigidity-review.test.mjs` and
    `bun test scripts/local-gate.test.mjs`.
11. **S1 (non-regression)** — every pre-existing case of the eight touched
    suites still passes and the differential run against the base commit shows
    no unrequested difference; proven by the suites plus the `UNDECLARED 0`
    differential harness output.

## Path protection

Every suite this unit touches is a protected path (`**/*.test.*` and
`tests/**`, `freeze: true`), so the freeze lands after P2 and each modification
carries its record in this folder's [`decisions.md`](decisions.md). Every record
is an *expansion*: no pre-existing assertion is deleted, relaxed or narrowed —
the only fixture plumbing a test may gain is what its new case needs.

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
created | scripts/push-identity-check.test.mjs | the identity guard's own corpus gains the remote-scope and fork cases (S2, S3); every pre-existing case keeps its assertions
created | scripts/identity-hook-parity.test.mjs | the two-carrier corpus gains the new scope values and the signing-policy rows (S2, S7)
created | scripts/local-gate.test.mjs | the hook body's remote passthrough and its fail-closed runtime branch (S3, S6)
created | scripts/rigidity-review.test.mjs | the new gate step's sibling suite, landed as its red commit before the module exists (S10)
created | template/.agentic-workflow/hooks/tests/test-git-identity-check.sh | the commit half's scope matrix, signing policy and tool diagnoses (S2, S6, S7)
created | template/.agentic-workflow/hooks/tests/test-temp-lib.sh | the portable temp helper's contract (S8)
created | template/.agentic-workflow/hooks/tests/test-forge-adapter.sh | forge detection and per-forge dispatch (S4)
created | template/.agentic-workflow/hooks/tests/test-turn-contract.sh | box 4 across the forge matrix and its degradation states (S4)
created | template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh | the merge wrapper across the forge matrix and temp resolution (S5, S8)
created | template/.agentic-workflow/hooks/tests/test-command-guard.sh | the forge merge surface and the allowlist (S1)
```

## Triaged steps

```text
triaged-steps@1
step | reason | basis
tests-first | every requirement has a frozen reproducer in a named suite | ACCEPTANCE items 2–11
implementation | one slice per guard surface, dependency order P3→P11 | ## Tasks
differential | every touched command is run against the base commit over one corpus | ACCEPTANCE item 11
docs-and-state | annexes, hooks README, projection, journal, obligation close | S9, §7
```

The machine's `unit-route --triage` cannot answer for this unit — the lane never
opened it (`unit not found`), which is exactly the substitution the apply order
performs: the step list above is this unit's authoritative steps, recorded at
freeze (D1).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the request, verbatim:
  ```
  Apply to this repository: issue #546
  ```
  The issue's `## Acceptance criteria` lines are quoted verbatim as `S2`–`S10`.
- **D1** — 2026-11-14, owner apply order §5 (the ledger freeze substitutes for
  the lane's plan step): the unit doc, the two ledgers and `decisions.md` are cut
  before implementation, and the `## Triaged steps` block is the unit's own
  declared step list because `unit-route --triage` has no registration for a lane
  that never opened this unit.
- **D2** — 2026-11-14, computed risk tier: `high` for the named `destructive`
  signal on `fullauto-merge.sh`; the tier's review pass is replaced by the
  owner's external verification (apply order §4 forbids this repository's review
  machinery on its own surgery).
- **P1** — 2026-11-14 13:05, ledgers frozen at `95af0547`; roadmap `## Fixes` row
  registered; `phase-lint` verdict PASS.

## Next

P2 — land the RED corpus of the issue's scenario table in the nine suites and
record the failing run.

## References

- Issue [#546](https://github.com/gtrabanco/agentic-workflow/issues/546)
- `docs/workflow/GIT_IDENTITY_HARDENING.md` (the identity annex this unit extends)
- `template/.agentic-workflow/hooks/README.md` (the hook contract this unit extends)
- `skills/orchestration-envelope/references/TURN_CONTRACT.md` (the machine-check profile)
- `docs/workflow/GATE_INVENTORY.md` (the gate carrier index)

## Branch

`fix/546-review-guards-flexibility-portability`

## Depends on

none

## Regression scope

| Scenario | Verified by |
|---|---|
| the approved identity is still refused when it is wrong (commit and push halves) | `bun test scripts/identity-hook-parity.test.mjs` |
| the push range still judges every never-published commit and still skips published ones (#539) | `bun test scripts/push-identity-check.test.mjs` |
| the `push-identity` gate step still runs on a real push with the proven base | `bun test scripts/local-gate.test.mjs` |
| `enforce: off` and an absent profile remain inert in every carrier | `bun test scripts/identity-hook-parity.test.mjs`, `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh` |
| turn-contract boxes 1–5 keep their codes, order and one-line stdout | `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` |
| fullauto-merge keeps its refusals (audit marker, `merge: fullauto`, clean tree, sync, green checks) and its idempotent comment | `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh` |
| the command guard still blocks direct merges, env disclosure and `.env` reads | `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` |
| the scaffold install contract still finds every hook file it enumerates | `bash template/.agentic-workflow/hooks/tests/test-init-workspace-contract.sh` |
| every root suite still passes | `node scripts/run-root-suite.mjs` |
