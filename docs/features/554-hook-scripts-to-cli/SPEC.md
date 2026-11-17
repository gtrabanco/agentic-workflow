---
type: feature
scope: medium
---

# 554 — hook-scripts-to-cli

> One-line: the decision logic the scaffold's git hooks carry moves into the
> universal CLI (one module in `src/`, one subcommand in the bin), and every
> template hook becomes a zero-logic shim that resolves the CLI, execs it and
> forwards its exit code.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

The requester adopted issue #554 as the request ("Apply to this repository: issue
#554"), so `S1` is the turn's instruction and `S2`–`S16` quote the issue
verbatim: its Goal, its seven in-scope bullets, its five acceptance criteria and
the one out-of-scope constraint this unit must not violate.

**S1 — Apply the issue to this repository.**
> Apply to this repository: issue #554

**S2 — The owner requirement behind the issue.**
> Owner requirement, verbatim (2026-11-14): "los scripts de los hooks que se distribuyen en `template` también deben de estar en el cli universal."

**S3 — The goal: hook logic in the universal CLI, hooks as shims.**
> The hook scripts distributed in `template/.agentic-workflow/hooks/` must live in the universal CLI — the same one-implementation rule as #553 (module in `src/` importable by pi, subcommand in the bin spawnable by hooks and skills), with the template hooks reduced to consent-installed shims that resolve and exec the CLI.

**S4 — The hook decision logic moves into the crate.**
> The hook decision logic moves into the crate as subcommands/modules (pattern: sibling bins like `path-guard`/`turn-contract`, or new subcommands — triage decides the face)

**S5 — Template hooks become zero-logic shims.**
> Template hooks become zero-logic shims: resolve the CLI (the `index-sync.sh` pattern) and `exec` it, forwarding the exit code; consent/install flows in `init-workspace` keep their shape — only what the shims call changes

**S6 — `turn-contract.sh` delegates to the shipped engine.**
> `turn-contract.sh` delegates to the shipped `bin/turn-contract.mjs` (one implementation)

**S7 — pi deduplicates against the crate module.**
> pi deduplicates: `guards/git-identity.ts` imports the crate module instead of carrying a second implementation

**S8 — `lib/forge.sh` and `lib/temp.sh` become importable JS.**
> `lib/forge.sh` and `lib/temp.sh` logic becomes importable JS (forge resolution with fail-closed refusals; temp-dir resolution order), with the sh source layer removable

**S9 — The platform adapters keep their seam and delegate the decision.**
> Platform adapters (`copilot-guard.sh`, `normalize-hook-payload.sh`, `pre-tool-guard.sh`) keep their platform-specific payload normalization — they are the platform seam — and delegate the decision to the CLI

**S10 — The docs land in the same change.**
> Docs: hooks README, crate README, and the shipped skills' references updated in the same change

**S11 — One implementation per check.**
> One implementation per check: no sh/TS/JS triple remains — `turn-contract` and `git-identity` each have exactly one logic home in the crate

**S12 — A template hook file contains no decision logic.**
> A template hook file contains no decision logic: resolve + exec + forward exit, provable by reading any shim

**S13 — pi's guard imports the crate module and its suite stays green.**
> pi's git-identity guard imports the crate module and its suite stays green

**S14 — The template hook tests still pass and the crate suite is at or above baseline.**
> The template hook tests still pass, and the crate suite is at or above baseline; `bun scripts/run-root-suite.mjs` exit 0

**S15 — The degradation contract holds for every new shim.**
> `index-sync.sh`'s degradation contract (never fails a git operation, names the missing entry point) holds for every new shim

**S16 — The consent mechanics are out of scope and stay unchanged.**
> The consent mechanics themselves (which hooks an install offers, the identity `gitIdentity` offer, adapter activation) — unchanged

## Acceptance criteria

Each criterion is observable and names the check that proves it.

1. **S1** — `docs/features/554-hook-scripts-to-cli/` carries this document with
   `S1`–`S16` and the ledgers beside it, and the roadmap's 554 row links it:
   `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/554-hook-scripts-to-cli/SPEC.md`
   exits 0 · `rg -n 'features/554-hook-scripts-to-cli/SPEC.md' docs/ROADMAP.md` matches 1.
2. **S2/S3** — the four capabilities reachable from the CLI as subcommands, and
   no template hook contains the logic:
   `rg -n 'case "(turn-contract|guard-command|git-identity-check|fullauto-merge)":' -c packages/agentic-workflow/bin/agentic-workflow.mjs`
   matches 4 (one case label each, asserted by the shim suite).
3. **S4** — the decision logic is crate modules:
   `rg --files packages/agentic-workflow/src` lists
   `temp.mjs`, `forge.mjs`, `guard/command.mjs`, `guard/payload.mjs`, `guard/git-identity.mjs`,
   `turn-contract.mjs`, `fullauto-merge.mjs` — each with a sibling suite under
   `packages/agentic-workflow/test/`.
4. **S5** — the shims: every hook file this unit converted — the four shims and
   the three platform adapters — resolves `AGENTIC_WORKFLOW_BIN`/`command -v`,
   execs the CLI, and forwards the exit (`index-sync.sh` and `secret-scan.sh`
   predate the unit and keep their own contracts: a silent no-op and a runtime
   runner) — `bash template/.agentic-workflow/hooks/tests/test-hook-shims.sh`
   exits 0, its shim list naming exactly the converted files.
5. **S6** — one turn-contract engine: the shell shim and the crate engine produce
   byte-identical stdout and equal exit codes across the shared fixture matrix —
   `node --test packages/agentic-workflow/test/turn-contract.parity.test.mjs`
   exits 0.
6. **S7/S13** — pi imports the crate's profile normalizer and its suite is green:
   `rg -n 'from "@gtrabanco/agentic-workflow/src/guard/git-identity.mjs"' packages/pi-agentic-workflow/src/guards/git-identity.ts`
   matches 3 — the import and both re-exports, every reference resolving to the
   crate module · `bun run --cwd packages/pi-agentic-workflow test` exits 0.
7. **S8** — forge and temp resolution are importable modules with the documented
   refusal order — `node --test packages/agentic-workflow/test/forge.test.mjs packages/agentic-workflow/test/temp.test.mjs`
   exits 0.
8. **S9** — the three adapters carry no rule and no `jq`, and still block:
   `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` exits 0 ·
   `bash template/.agentic-workflow/hooks/tests/test-opencode-guard.sh` exits 0.
9. **S10** — `bun scripts/docs-generate.mjs --check` exits 0 and the three
   documentation surfaces the change owns (hooks README, crate README, the
   skills' references) name the shim shape.
10. **S11** — no shell file carries a decision rule:
    `rg -n 'grep -E|jq -|forge_detect|aw_tmpdir' template/.agentic-workflow/hooks -g '!**/tests/**'`
    matches 0.
11. **S12** — the shim rule is machine-pinned: each of the six hook scripts is
    `set -u` + resolve + exec, asserted by `tests/test-hook-shims.sh` case
    `shim-shape`.
12. **S14** — every template hook suite passes and the root gate is green:
    `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` exits 0 ·
    `node scripts/run-root-suite.mjs` exits 0.
13. **S15** — degradation: a hook whose CLI is absent names the missing entry
    point and exits with its declared code (`test-hook-shims.sh` cases
    `absent-cli-fail-closed` and `absent-cli-index-sync-noop`).
14. **S16** — the consent surfaces are byte-identical to the base commit for the
    offer list: `git diff <base> -- skills/init-workspace | rg '^-'` names no
    consent row (recorded in the unit doc's `## Log`).

## Impact

- **What stops being true:** the hooks' two sourced libraries (the `lib/` forge
  adapter and temp resolver) and the rule bodies of `turn-contract.sh`,
  `guard-command.sh`, `git-identity-check.sh`, `fullauto-merge.sh`,
  `adapters/normalize-hook-payload.sh` are deleted by the change. Their two shell
  suites (the `lib/forge` and `lib/temp` adapter suites) are retired with them and
  every case ports to the crate suites in the same commit — a rule that loses its
  test is not a move.
- **Consumers:** `skills/orchestration-envelope/references/TURN_CONTRACT.md`
  narrates the shim and the engine as two implementations and must be rewritten;
  `skills/init-workspace/{SKILL.md,references/BOOTSTRAP_WRITE.md}` install the
  shims (paths unchanged, prose about their content must match);
  `docs/workflow/GIT_IDENTITY_HARDENING.md` and its `template/` twin describe the
  hook; `scripts/rigidity-review.mjs`'s `INVENTORY` registers each hook shell file
  and fails an unregistered one; `scripts/git-config-writes.mjs` scans
  `template/.agentic-workflow/hooks/tests/*.sh` as test carriers;
  `scripts/push-identity-check.mjs` carries a second copy of the profile rule;
  `packages/pi-agentic-workflow/src/guards/git-identity.ts` carries a third.
- **Live surfaces never touched by this change's code before verification:**
  every new command is exercised in a throwaway repository or a `mktemp -d`
  fixture first; `fullauto-merge` and `git-identity-check` never run against this
  checkout during development (they mutate: a merge, a commit gate).
- **What this unit consumes:** the shipped `bin/turn-contract.mjs` engine, the
  crate's `feedback` channel, the schema package's `parseJsonc`.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `scripts`
- `template`
- `skills`
- `docs`

## Retirements

| Retired surface | Replacement / no-consumer evidence |
|---|---|
| the hooks' `lib/` forge adapter (the sourced shell library that named every forge binary) | the crate's `packages/agentic-workflow/src/forge.mjs`; `rg -c 'forge_detect' template` → 0 after the change |
| the hooks' `lib/` temp resolver (the sourced shell library that held the candidate order) | the crate's `packages/agentic-workflow/src/temp.mjs`; `rg -c 'aw_tmpdir' template` → 0 |
| the forge adapter's own shell suite | every case ports to `packages/agentic-workflow/test/forge.test.mjs` |
| the temp resolver's own shell suite | every case ports to `packages/agentic-workflow/test/temp.test.mjs` |
| the rule bodies of the five hook files (`guard-command`, `turn-contract`, `git-identity-check`, `fullauto-merge`, the payload normalizer) | the shim body (resolve + exec + forward) plus the crate modules; pinned by `packages/agentic-workflow/test/hook-shims.test.mjs` |

## Non-goals

- The consent mechanics (which hooks an install offers, the identity
  `gitIdentity` offer, adapter activation) — unchanged (`S16`).
- The seam-hook system (the `.pi` hooks-config dispatch) — untouched.
- `secret-scan.sh` / `secret-scan.mjs` (#552's shipped scanner) — already the
  runner-plus-module shape this unit generalizes; it is not moved again.
- Windows portability of the sh shims (#546's separate concern) — the shims stay
  Unix-only; the *logic* becomes portable because it is now JavaScript.
- Crate-wide subcommand unification (#553, #603) — this unit adds only the four
  subcommands the shims need.

## Risk tier

- **Tier** — `high` · **Task Size** — `L`
- **Named high-risk item** — `fullauto-merge` is the sole automated merge
  authority: its preconditions (clean synchronized tree, SHA-bound audit comment,
  `merge: fullauto` at the audited SHA, green rollup or fresh local gate) are
  security-relevant and are ported without a single relaxation; the port is
  proven against the existing 338-line shell corpus unchanged.

The verdict was produced by `runner ceremony tier classify` over this unit's
paths (recorded in `## Log` E1); a `high` tier adds the named item above to this
section and the full review pass.

## Future

- `idea` — collapse `bin/path-guard.mjs` / `bin/turn-contract.mjs` into the same
  subcommand dispatch this unit establishes, so the crate has one entry point
  (`bin/`) and one dispatch table (#553/#603 territory).
- `idea` — a Windows-native runner for the hooks (a `.cmd` twin of each shim)
  once #546's portability concern is scheduled.

## Future cost

- Every new git-hook capability is now two files: one crate module (+ its suite)
  and one shim line. A capability added to a shim instead of the crate fails
  `template/.agentic-workflow/hooks/tests/test-hook-shims.sh`.
- `scripts/rigidity-review.mjs`'s `INVENTORY` binds each hook shell file; a new
  shim needs its row (and `rules: RULES_ALL` only where it names no literal).
- The four new subcommands extend the crate README's usage line and Commands
  table, which `packages/agentic-workflow/test/cli.surface.test.mjs` pins
  token-for-token.

## Applicable tests

- `packages/agentic-workflow/test/hook-shims.test.mjs` (new — the shim corpus,
  absent-CLI degradation, the zero-logic pin)
- `packages/agentic-workflow/test/guard.command.test.mjs`,
  `guard.payload.test.mjs`, `forge.test.mjs`, `temp.test.mjs`,
  `git-identity.hook.test.mjs`, `fullauto-merge.test.mjs` (new — the moved rules)
- `packages/agentic-workflow/test/turn-contract.engine.test.mjs` and
  `turn-contract.parity.test.mjs` (carried — the engine and the shim must stay
  byte-identical, now over a shim that delegates)
- `scripts/identity-hook-parity.test.mjs` (carried — the two Layer-2 carriers)
- `scripts/push-identity-check.test.mjs`, `scripts/rigidity-review.test.mjs`,
  `scripts/git-config-writes.test.mjs` (carried — the consumers of the moved
  files)
- `template/.agentic-workflow/hooks/tests/test-turn-contract.sh`,
  `test-command-guard.sh`, `test-git-identity-check.sh`, `test-fullauto-merge.sh`,
  `test-index-sync.sh`, `test-opencode-guard.sh`, `test-init-workspace-contract.sh`
  (carried — the template corpus, now driving the shims)
- `packages/pi-agentic-workflow`'s suite (carried — the pi guard's own cases)

## Known pre-existing issues

- `scripts/local-gate.mjs`'s pre-push hook and the root suite both spawn the
  template hook suites today *not at all*: they are project-level tests run by
  hand or by a target project. `does-not-affect` this unit — the carried corpus is
  `scripts/identity-hook-parity.test.mjs` plus the suites this change runs in the
  foreground.
- `docs/fix/546-review-guards-flexibility-portability/` records that a Windows
  host cannot run the sh hooks at all. `does-not-affect` — out of scope above.

## Tasks

- P1 — freeze the ledgers, the acceptance criteria and the roadmap state
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/554-hook-scripts-to-cli/SPEC.md` exits 0)
  (Implements: S1)
  - Relevant files: docs/features/554-hook-scripts-to-cli/SPEC.md, docs/features/554-hook-scripts-to-cli/planning-evidence.md, docs/features/554-hook-scripts-to-cli/planning-obligations.md, docs/features/554-hook-scripts-to-cli/decisions.md, docs/ROADMAP.md
- P2 — land the crate's temp and forge modules with their red corpus first
  (validator: `node --test packages/agentic-workflow/test/temp.test.mjs packages/agentic-workflow/test/forge.test.mjs` exits 0)
  (Implements: S2, S8, S11)
  - Relevant files: packages/agentic-workflow/src/temp.mjs, packages/agentic-workflow/src/forge.mjs, packages/agentic-workflow/test/temp.test.mjs, packages/agentic-workflow/test/forge.test.mjs
- P3 — land the guard's command and payload decision in the crate, expose
  `guard-command`, and reduce the adapters to their format seam
  (validator: `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` exits 0)
  (Implements: S2, S3, S4, S5, S9, S11, S12)
  - Relevant files: packages/agentic-workflow/src/guard/command.mjs, packages/agentic-workflow/src/guard/payload.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, template/.agentic-workflow/hooks/guard-command.sh, template/.agentic-workflow/hooks/adapters/
- P4 — move the turn-contract engine and the identity check into the crate,
  reduce both shims, and delete the pi and `scripts/` duplicates
  (validator: `node --test packages/agentic-workflow/test/turn-contract.parity.test.mjs scripts/identity-hook-parity.test.mjs` exits 0)
  (Implements: S2, S6, S7, S11, S13)
  - Relevant files: packages/agentic-workflow/src/turn-contract.mjs, packages/agentic-workflow/src/guard/git-identity.mjs, packages/agentic-workflow/bin/turn-contract.mjs, template/.agentic-workflow/hooks/turn-contract.sh, template/.agentic-workflow/hooks/git-identity-check.sh, packages/pi-agentic-workflow/src/guards/git-identity.ts, scripts/push-identity-check.mjs
- P5 — move the automated-merge wrapper into the crate and reduce its shim
  (validator: `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh` exits 0)
  (Implements: S2, S4, S11, S12)
  - Relevant files: packages/agentic-workflow/src/fullauto-merge.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, template/.agentic-workflow/hooks/fullauto-merge.sh
- P6 — retire the shell libraries and their suites with every case ported,
  and pin the shim shape and its degradation
  (validator: `bash template/.agentic-workflow/hooks/tests/test-hook-shims.sh` exits 0)
  (Implements: S3, S5, S8, S11, S12, S15)
  - Relevant files: template/.agentic-workflow/hooks/lib/, template/.agentic-workflow/hooks/tests/test-hook-shims.sh, scripts/rigidity-review.mjs
- P7 — ship the documentation and the repository state, then run the whole
  corpus (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S10, S14, S15, S16)
  - Relevant files: template/.agentic-workflow/hooks/README.md, packages/agentic-workflow/README.md, skills/orchestration-envelope/references/TURN_CONTRACT.md, skills/init-workspace/SKILL.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, docs/workflow/GIT_IDENTITY_HARDENING.md, template/docs/workflow/GIT_IDENTITY_HARDENING.md, .changeset/554-hook-scripts-to-cli.md

### Planning evidence

Frozen at cut in the unit folder's
[`planning-evidence.md`](planning-evidence.md) — M/L-sized unit: the ledger is a
separate file, never both.

### Obligations

Frozen at cut in the unit folder's
[`planning-obligations.md`](planning-obligations.md) — M/L-sized unit: the ledger
is a separate file, never both.

## Triaged steps

`n/a — this unit is applied under the owner's local, unpublished workflow: the
frozen planning ledgers substitute for the lane's plan step, so no
`unit-route --triage` block exists for this cut.` The phase cut above is the
declared step list (P1–P7, dependency-topological, smallest ready task first).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Domain separation

The classification test (`docs/workflow/DOMAIN_SEPARATION.md`, authority:
AGENTS.md §Domain separation, classification test issue #435): *can the workflow
execute/declare/verify this with its own code and prose, knowing nothing about
this repository?*

| Surface | Domain | Evidence behind the classification |
|---|---|---|
| `packages/agentic-workflow/src/{temp,forge,fullauto-merge,turn-contract}.mjs`, `src/guard/*` | **product** | Each answers a question about a git checkout, a remote URL or a hook payload; none names this repository, its forge, its labels or its release train. |
| `template/.agentic-workflow/hooks/**` | **product** | The shims and the adapters are the scaffold a target project installs; their only project fact is the hook directory they live in. |
| `scripts/push-identity-check.mjs`, `scripts/identity-hook-parity.test.mjs` | **project** | The push-range checker is this repository's own gate carrier; it now *imports* the product module. The parity suite is the root gate's carrier. |
| `skills/orchestration-envelope/references/TURN_CONTRACT.md`, `skills/init-workspace/**` | **product** | They describe the shipped contract and its consent install. |
| This unit doc, its ledgers, `docs/ROADMAP.md`'s 554 row, `docs/LOGS.md` | **project** | The unit's own record; it never ships. |

## Log

- **L1** — 2026-11-17, the request, verbatim:
  ```
  Apply to this repository: issue #554
  ```
- **D1** — 2026-11-17, the cut's decisions are the engineering ones recorded in
  `decisions.md` (D1–D11); no owner decision was requested or taken in-session.
  The roadmap's 554 row moves `idea` → `in-progress` because execution started
  (the convention the lane applies); the owner's verdict may override it.
- **P1** — 2026-11-17, unit doc + `planning-evidence.md` (15 rows) +
  `planning-obligations.md` (19 rows, all `planned`) + `decisions.md` frozen
  · `2e160663`.
- **E1** — 2026-11-17, `node packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/554-hook-scripts-to-cli/SPEC.md` · exit 2 · at cut: the expected refusal (19 obligations `planned`, and the paths this unit is about to create do not exist yet).
- **E2** — 2026-11-17, `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0 missing · 0 stale · 0 orphaned` · `verdict: PASS` (the base half of the documentation differential).
- **E3** — 2026-11-17, `node scripts/setup-env.mjs` · exit 0 · schema `dist` built, pi `node_modules` installed (both gitignored build output a fresh worktree lacks).
- **P2** — 2026-11-17, the crate's temp + forge modules with their corpus: `temp.test.mjs` and `forge.test.mjs` landed first and were observed red on `ERR_MODULE_NOT_FOUND`, then green · `d7cff85a`.
- **E4** — 2026-11-17, `node --test packages/agentic-workflow/test/temp.test.mjs packages/agentic-workflow/test/forge.test.mjs` · exit 0 · `pass 22` (red first: `Cannot find module …/src/temp.mjs`).
- **P3** — 2026-11-17, the guard's decision and payload rule in the crate, the `guard-command` subcommand, and the three adapters reduced to their format seam · `d7cff85a`.
- **E5** — 2026-11-17, `node --test packages/agentic-workflow/test/guard.command.test.mjs packages/agentic-workflow/test/guard.payload.test.mjs` · exit 0 · `pass 74` (red first on the missing `src/guard/command.mjs`).
- **E6** — 2026-11-17, `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` · exit 0 · `PASS command guard: 8 allowed, 44 blocked, allowlist literal, adapters delegated`.
- **E7** — 2026-11-17, `bash template/.agentic-workflow/hooks/tests/test-opencode-guard.sh` · exit 0 · `PASS OpenCode guard: allow and block paths exercised`.
- **P4** — 2026-11-17, the turn-contract engine and the identity check into the crate, both shims reduced, the pi and `scripts/` duplicates deleted · `17e9fe76`.
- **E8** — 2026-11-17, `node --test packages/agentic-workflow/test/turn-contract.engine.test.mjs packages/agentic-workflow/test/turn-contract.parity.test.mjs packages/agentic-workflow/test/turn-contract.forge.test.mjs packages/agentic-workflow/test/git-identity.hook.test.mjs packages/agentic-workflow/test/cli.surface.test.mjs` · exit 0 · `pass 92`.
- **E9** — 2026-11-17, `node --test scripts/identity-hook-parity.test.mjs scripts/push-identity-check.test.mjs` · exit 0 · `pass 35` (the frozen 12-row corpus, both carriers on the crate module).
- **E10** — 2026-11-17, `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` · exit 0 · `PASS turn contract: 46 cases`.
- **E11** — 2026-11-17, `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh` · exit 0 · `31 case(s), 0 failure(s)`.
- **E12** — 2026-11-17, `bun run --cwd packages/pi-agentic-workflow test` · exit 0 · `956 pass / 0 fail`.
- **P5** — 2026-11-17, the automated merge wrapper in the crate, its shim reduced to resolve + exec · `6ad7f0ab`.
- **E13** — 2026-11-17, `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh` · exit 0 · `PASS fullauto merge: transient marker cleaned; PR comment idempotent`.
- **E14** — 2026-11-17, `node --test packages/agentic-workflow/test/fullauto-merge.test.mjs` · exit 0 · `pass 7`.
- **P6** — 2026-11-17, `lib/forge.sh`, `lib/temp.sh` and their two suites retired with every case ported, the shim shape pinned, and the audit re-homed.
- **E15** — 2026-11-17, `bash template/.agentic-workflow/hooks/tests/test-hook-shims.sh` · exit 0 · `23 case(s), 0 failure(s)`.
- **E16** — 2026-11-17, `node --test packages/agentic-workflow/test/hook-shims.test.mjs` · exit 0 · `pass 19`.
- **E17** — 2026-11-17, `bun scripts/rigidity-review.mjs` · exit 0 · `ok: 15 guard file(s), 3 rule(s)` · `homes: src/forge.mjs, src/temp.mjs`.
- **E18** — 2026-11-17, `rg --files template/.agentic-workflow/hooks/lib` · exit 1 with no output · `lib/` holds no file (the shell source layer is gone).
- **E19** — 2026-11-17, `rg -n 'grep -E|jq -|forge_detect|aw_tmpdir|origin/HEAD' template/.agentic-workflow/hooks --glob '!tests/**'` · exit 0 with **no match** · no hook file carries a rule.
- **P7** — 2026-11-17, documentation and repository state in the same change: the hooks README rewritten around the shim and its degradation table, the crate README's four new Commands rows, `TURN_CONTRACT.md` and `GIT_IDENTITY_HARDENING.md` rewritten, `MIGRATION.md` entry, changeset, roadmap state, generated projection and journal fragment.
- **E20** — 2026-11-17, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 30 skills` (the first cut was 3 estimate points over `TURN_CONTRACT.md`'s ceiling and the sentence was trimmed, never the budget re-based).
- **E21** — 2026-11-17, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 4 budgeted documents`.
- **E22** — 2026-11-17, `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0 missing · 0 stale` · `verdict: PASS`.
- **E23** — 2026-11-17, `node --test scripts/git-config-writes.test.mjs` · exit 0 · `pass 9` (the template suites this unit edited write no git configuration).
- **E24** — 2026-11-17, the base-vs-head differential on `guard-command`: the base hook (`git archive 9de62e1c`) and the head shim, run over 24 documented invocations (every allow and block family, the allowlist, the `.env` path rule, an empty command and the three usage errors) → **0 differences** in stdout, stderr and exit code. Harness in `mktemp -d`, removed after.
- **G1** — 2026-11-17, HEAD 4d1243aa, `node scripts/run-root-suite.mjs --jobs 1` · **exit 0** · `118/118 suite(s) PASS` (the serialized gate: one suite per process, no contention).
- **G2** — 2026-11-17, HEAD 4d1243aa, `node scripts/run-root-suite.mjs` (the default bounded pool) · exit 1, **disclosed**: under a load average of 5.7–7.2 on 6 CPUs two untouched suites broke — `scripts/phase-lint.test.mjs` on the 120 s suite bound and `scripts/unit-route.test.mjs` on its own `<500 ms` linear-scan assertion (suite 47.8 s). Neither file is in this diff; standalone `node --test scripts/unit-route.test.mjs` is `64/64 pass`, and the serialized gate above is green. Same class of load artifact unit 606 disclosed.
- **E27** — 2026-11-17, the pre-push local gate caught a defect this session's own handoff missed: `packages/agentic-workflow/test/turn-contract.forge.test.mjs` pointed the fixture's `HOME` at the checkout, and under `bun` (the gate's `crate-suite-bun`) the runtime writes its install cache under `$HOME` — so `.bun/install/cache/…` appeared inside the fixture repository and box5 rightly answered `dirty-tree`. The fixture now gets a home of its own, the case is green on both runtimes, and the crate suite under `bun` is `1212 pass / 0 fail`.
- **E26** — 2026-11-17, the ledger's two stale validator cells were corrected **during** verification, before either was claimed: O11's `--glob '!tests/**'` excluded nothing (rg matches its globs against the whole path), so it now reads `-g '!**/tests/**'` and answers 0; O17's claim named a word that occurs twice, so it now names `base-vs-head differential` and answers 1. The truthful answer did not change — the wording of the check did.
- **E25** — 2026-11-17, the base assertions against the head implementation (`/tmp` copy of the base suites, their `guard=`/`shim=`/`hook=`/`wrapper=` re-pointed at the head): `test-command-guard` PASS · `test-fullauto-merge` PASS · `test-turn-contract` 46 cases with **three declared deltas** (the glab/gt stubs answer a JSON document instead of the retired `--jq` line; the minimal-PATH case carries the CLI's runtime; `--help` names `turn-contract`) · `test-git-identity-check` 31 cases with **one declared delta** (the retired `jq` precondition, 2 of its cases). Every delta is the change this document declares; none is a silent regression.
- **F1** — 2026-11-17, external-verify blockers B1–B4 folded in one batch: the four declared checks that could not answer their own expectation were re-spelled, never weakened — criterion 2 now matches the bin's four `case "(…)":` labels (**4**), criterion 6 the import plus both re-exports (**3**), criterion 10 the corrected `-g '!**/tests/**'` (**0**, exit 1; E19's recorded "no match" stands as run and is superseded here, its bytes never rewritten), and O17's validator is anchored to `base-vs-head differential on` (**1**) with the row flipped planned → re-run → verified.
- **F2** — 2026-11-17, external-verify blocker B5 folded: the seven task bullets lost the bold markers the unit-doc grammar rejects, and S2, S3, S16 gained their `(Implements:)` links (P2/P3/P4/P5 carry S2, P3/P6 carry S3, P7 carries S16) — `agentic-workflow phase-lint` now answers `verdict PASS` (P1–P7, 6/6 each), where it answered `BLOCKED: no-phases` on the committed bytes and `spec-unlinked ×3` once only the bold markers were removed in a scratch copy.
- **F3** — 2026-11-17, external-verify blocker B6 folded: `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` no longer tells the discovery step to explain that shell adapters require `jq`; it names the CLI dependency the shims actually carry.
- **F4** — 2026-11-17, external-verify blocker B7 and advisory A3 folded: the textual-boundary attribution in `scripts/git-config-writes.mjs` and its test header now points at `packages/agentic-workflow/src/guard/command.mjs` (the shim declares no boundary), and the turn-contract parity comment says the two faces of the one implementation.
- **F5** — 2026-11-17, external-verify blocker B9 and advisories A4, A5 folded: the git-identity shim header states the exit codes its own body ships (1 for an absent CLI — code, README table and suites pin 1; 2 for unusable argv), criterion 4's every-file quantifier is scoped to the hooks this unit converted, and the consent-diff evidence AC14/O18 declare is recorded at E28.
- **E28** — 2026-11-17, O18/AC14's consent read in the foreground: `git diff 9de62e1c -- skills/init-workspace/SKILL.md` → **no removed line** (SKILL.md byte-identical to base); the directory-level removals are exactly the declared BOOTSTRAP_WRITE jq→CLI sentence rewrite (both numbered steps) plus this batch's BOOTSTRAP_DISCOVERY fix — **no consent row removed**.
- **E29** — 2026-11-17, the correction batch's recheck (the blockers only), every command in the foreground: criterion 2 `rg 'case "(turn-contract|guard-command|git-identity-check|fullauto-merge):"' -c …/bin/agentic-workflow.mjs` → **4** · criterion 6 `rg -c 'from …git-identity.mjs"' …/guards/git-identity.ts` → **3** · criterion 10 `rg … template/.agentic-workflow/hooks -g '!**/tests/**'` → **0 matches, exit 1** · O17 `rg -c 'base-vs-head differential on' SPEC.md` → **1** · `phase-lint SPEC.md` → **verdict PASS, exit 0** · `verify SPEC.md` → **exit 0, ok true** · B6/B7/B9 reproducers → 0 matches and the absent-CLI shim probe exits **1**, matching the header and README · 546's three re-scoped validators → `forge.test` **18/0**, `test-turn-contract` **46 cases**, `temp.test` **10/0**, `rigidity-review` **ok**, `test-git-identity-check` **31/0** (its rows verified at 546's E9).
- **G3** — 2026-11-17, HEAD 02dd2762, the batch's regression loop (S3): root gate `node scripts/run-root-suite.mjs --jobs 1` → **exit 0 · 118/118 PASS**; the default pool → 117/118 with only `scripts/unit-route.test.mjs` red under load 4.3–5.1 (standalone **64/64**, the disclosed G2 class, suite untouched); `bun scripts/local-gate.mjs --jobs 1` → steps **1–17 PASS** (root-suite, crate on both runtimes, projection, journal-carrier, log-immutability, secret-scan, temp-hygiene, worktree-guard, rigidity, node-compats, type-check), exit 1 at step 18/19 `dependency-pin-gate` — `pi-extensible-workflows` pin 6.3.0 vs registry 6.4.0, a surface this batch never touches (no package.json/lock in the diff), so the same rejection holds at base: registry drift, not change-caused · pi **956/0** · budgets **PASS ×2** · docs-generate **PASS** · skill-lint **PASS** · changeset lint **ok** · all eight template shell suites **green**.
- **E30** — 2026-11-17, the second pass on the same blocker (B4/O17): the moment F1 and E29 landed quoting the earlier anchor token, that anchor answered **3** — the E26 class, reproduced by the correction record itself. The validator now anchors on E24's distinguishing tail (the phrase followed by its `guard-command` citation), which no other line of this document satisfies, and answers **1** in the foreground; the record lines are kept as written, never rewritten.
- **E31** — 2026-11-17, the S3 loop caught this batch's own breakage: the open-finding row this receipt's carrier briefly put in `## Findings` (F6) lifted the tree's harvest count to 1154 against `scripts/findings-corpus.test.mjs`'s frozen 1153, so that suite failed its first run over the records commit. The row is removed — the findings table's writer contract belongs to `review-change`/`triage-issue`, never to an external verify — and B10's carrier is the receipt `external-verify.md` alone. Recheck: `node --test scripts/findings-corpus.test.mjs` → **14/14**; the default-pool root re-run then exited 1 only on `scripts/phase-lint.test.mjs`'s 120 s suite bound under load 8–10.8 (the G2 disclosed class, suite untouched, standalone **162/0**), and the serialized gate re-run over the records bytes → **exit 0 · 118/118**; `verify` and `phase-lint` re-run green with this line present.

## Next

`P2` — land `temp.mjs` and `forge.mjs` with their red corpus.

## References

- Issue [#554](https://github.com/gtrabanco/agentic-workflow/issues/554)
- Roadmap row 554 (`docs/ROADMAP.md` §Features)
- Siblings: [#553](https://github.com/gtrabanco/agentic-workflow/issues/553)
  (universal CLI coverage, postponed), [#552](https://github.com/gtrabanco/agentic-workflow/issues/552)
  (the shipped scanner that established the runner pattern),
  [#546](https://github.com/gtrabanco/agentic-workflow/issues/546) (forge
  flexibility and portability), [#514](https://github.com/gtrabanco/agentic-workflow/issues/514)
  (the identity guard), [#52](https://github.com/gtrabanco/agentic-workflow/issues/52)
  (the turn contract).
