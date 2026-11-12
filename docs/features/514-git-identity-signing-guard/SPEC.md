---
type: feature
scope: large
roadmap_summary: Issue [#514](https://github.com/gtrabanco/agentic-workflow/issues/514) (L): two-layer git identity & signing guard — a pi agent config-write guard over both `git config` syntaxes, an opt-in pre-commit hook and a push-range local-gate step that verify the resolved author/committer against a per-project approved profile, the `-c`-only convention for test suites pinned by a repo-wide gate, and a hardening annex applied by no default.
---

# 514 — git-identity-signing-guard

> One-line: stop agents, hooks and test suites from rewriting commit attribution; verify the resolved identity before a commit lands and before a push publishes.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Apply issue #514 to this repository.**
> Apply to this repository: issue #514

Every requirement below is quoted verbatim from the issue body S1 names
(`gh issue view 514`); the issue is the requester's own artifact, so its words are
frozen here rather than restated.

**S2 — Agent-side config-write guard (Layer 1).**
> The pi extension blocks or asks (persisted consent) on model-generated identity/signing `git config` writes in both modern and legacy syntaxes, including `--global`/`--system`/`--file` routes; read-only and `-c` invocations pass; a config override can allow named writes without disabling the guard; non-identity git operations always pass.

**S3 — Fail-fast commit verification (Layer 2, hook).**
> The pre-commit hook fails a commit whose resolved author/committer identity is not in the project's approved profile (or whose signing key is absent while `commit.gpgsign=true`), printing the correct repair commands; it never repairs or rewrites anything itself.

**S4 — Fail-fast push-range verification (Layer 2, gate).**
> The local-gate gains a push-range authorship step that fails before publication on misattributed commits.

**S5 — Per-project approved profile, corporate case included.**
> Per-project approved-identity profiles express the corporate case: specific name, surname, email, cert or SSH signing key per project.

**S6 — Hardening annex, consent-only application.**
> The hardening annex ships as readable docs; `init-workspace` applies nothing from it without explicit consent.

**S7 — No test suite writes git configuration.**
> No test suite writes git configuration anywhere (the `-c` convention is pinned by a repo-wide gate, following the `log-immutability.test.mjs` precedent).

**S8 — Red-first suites for every new script and hook.**
> Red-first suites land for every new script/hook (repo rule: red commit observed before green).

**S9 — Companion fix carried in this unit.**
> **Companion fix (separate unit, this repo)**: migrate the five suites that write identity via `git config` (`scripts/doc-discipline.test.mjs`, `packages/agentic-workflow/test/doc.*.test.mjs`) to per-invocation `-c` identity (precedent: `log-immutability.test.mjs`) and extend the `git-env.mjs` GIT_DIR scrub to per-file/package-suite entry points.

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words. A
correction is its own line with its own id (`S1a`) — never a rewrite of the line
it corrects.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

- **Consumers of the identity contract**: the pi extension
  (`packages/pi-agentic-workflow/src/extension/index.ts`), the template
  pre-commit hook (`template/.agentic-workflow/hooks/git-identity-check.sh`) and
  the push-range step (`scripts/local-gate.mjs`) all read the **one** base
  section `gitIdentity` in `.pi/agentic-workflow.json`. A second copy of the
  profile anywhere is the defect the unit exists to prevent.
- **What stops being true**: the prose that says only `guard-command.sh` guards
  commands (`template/.agentic-workflow/hooks/README.md`), the CONFIG.md section
  table without `gitIdentity`, and every test suite's ambient-identity fixture
  (they now pass `-c`).
- **What this unit consumes**: `scrubGitLocator` (`scripts/git-env.mjs`), the
  unified-config descriptors (`packages/agentic-workflow-schema/src/config.ts`),
  the `tool_call` seam (`receiptGuard` precedent), the state-file pattern
  (`routing/state.ts`), `.pi/pi-agentic-workflow.json`'s lint-visible neighbours.
- **Asked before touching**: this repo's own `.pi/agentic-workflow.json` is a
  live operator file — the unit adds it with `enforce: "push"` because the
  issue's premise is that the leak happened **here**; a project that copies
  `template/` gets no file and no enforcement.
- **Also consumed**: `docs/workflow/GATE_INVENTORY.md` (the new carriers),
  `docs/workflow/CONFIG.md` (the section row), `docs/ROADMAP.md` (the unit row).

## Retirements

- The five-plus suites' `git config user.*` writes: `rg -n '"config", "user\.|"config", "commit\.gpgsign"' scripts packages --glob '*.test.mjs'` → 0 after the migration. Replacement: per-invocation `-c`.
- `scripts/doc-discipline.test.mjs`'s and `packages/agentic-workflow/test/doc.*.test.mjs`'s fixture identity helpers stop writing config; their commits carry `-c` on the invocation.
- No other surface is retired: the unit adds carriers, it does not rename one.

## Non-goals

Per issue #514 §Out of scope, frozen unchanged:

- **Env-var identity pinning as a default** (`GIT_CONFIG_COUNT`…).
- **Automatic repair or overwrite of identity/signkey values** — ever, including
  by any setup helper this unit ships.
- **Rewriting published history** to fix the 139 misattributed commits.
- **Blocking `git config` wholesale** — hermetic fixtures, the docs-generated
  merge driver and legitimate setup flows keep working.
- **A blanket pi permission gate**: the identity guard is first-party, scoped to
  identity/signing, and does not become a general permission system.
- Blog articles expanding the hardening guidance.

## Risk tier

- **Tier** — `standard` · **Task Size** — `large` (cross-package: schema, crate
  script, pi package, template hook, docs).

  The tier is computed by `bun scripts/ceremony.mjs tier classify`; the verdict
  recorded here was derived from the change's path set (config schema + pi
  package + template hook + root scripts, no sensitive-path write). The named
  high-risk item is therefore `none — not a high-tier unit`.
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

- Every future test suite must pass identity with `-c`; the gate
  (`scripts/git-config-writes.test.mjs`) fails a suite that writes config. Binds
  every contributor and every agent.
- Every future carrier that reads or writes identity reads `gitIdentity`; a
  second profile copy is a defect. Binds the hooks, the gate and the extension.

## Applicable tests

- `bun test scripts/git-config-writes.test.mjs`
- `bun test scripts/push-identity-check.test.mjs`
- `bun test scripts/identity-hook-parity.test.mjs` (the bash hook vs the node
  checker over one corpus)
- `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh`
- `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`
- `node scripts/run-root-suite.mjs` (the whole tree, including the migrated
  suites and `scripts/red-first.test.mjs`)

## Known pre-existing issues

- `commit.gpgsign=true` is set globally in the operator environment; the root
  suite already neutralizes it (`scripts/run-root-suite.mjs`). Does not affect
  this unit: the hook's key-presence check is exercised on fixtures with signing
  off and on a fixture with a signing key configured.
- The 139 historical misattributed commits on `origin/main` are **not** a gate
  failure for this unit: the push-range check reads the push range, never
  published history. Does not affect this unit (Non-goals).

## Tasks

- P1 — freeze the identity contract in the unified config: add the `gitIdentity`
  base section (enforce switch, approved profile, agent-guard mode + allow list),
  regenerate `config.schema.json`, add the CONFIG.md row
  (validator: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0)
  (Implements: S5)
  - Relevant files: packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/config.schema.json, docs/workflow/CONFIG.md
- P2 — a repo-wide gate that refuses any test carrier writing git configuration
  (validator: `bun test scripts/git-config-writes.test.mjs` exits 0)
  (Implements: S7)
  - Relevant files: scripts/git-config-writes.mjs, scripts/git-config-writes.test.mjs
- P3 — migrate every flagged suite to per-invocation `-c` identity
  (validator: `bun test scripts/git-config-writes.test.mjs` exits 0 and `node scripts/run-root-suite.mjs --bail` exits 0)
  (Implements: S7, S9)
  - Relevant files: scripts/*.test.mjs, packages/agentic-workflow/test/*.test.mjs
- P4 — the push-range authorship check and its local-gate step
  (validator: `bun test scripts/push-identity-check.test.mjs` exits 0)
  (Implements: S4)
  - Relevant files: scripts/push-identity-check.mjs, scripts/push-identity-check.test.mjs, scripts/local-gate.mjs
- P5 — the opt-in pre-commit hook and its shell suite
  (validator: `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh` exits 0)
  (Implements: S3)
  - Relevant files: template/.agentic-workflow/hooks/git-identity-check.sh, template/.agentic-workflow/hooks/tests/test-git-identity-check.sh
- P6 — one corpus, two implementations: the bash hook and the node checker must
  return the same verdict for the same repository
  (validator: `bun test scripts/identity-hook-parity.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: scripts/identity-hook-parity.test.mjs
- P7 — the pi agent guard: both `git config` syntaxes, scope routes, read-only
  and `-c` pass-through, persisted consent, the allow-list override, non-identity
  pass-through, wired into `tool_call`
  (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0)
  (Implements: S2)
  - Relevant files: packages/pi-agentic-workflow/src/guards/git-identity.ts, packages/pi-agentic-workflow/src/guards/git-identity-consent.ts, packages/pi-agentic-workflow/src/extension/index.ts
- P8 — the GIT_DIR scrub reaches the per-file and package-suite entry points
  (validator: `bun test scripts/git-env.test.mjs` exits 0)
  (Implements: S9)
  - Relevant files: scripts/test-preload.mjs, ./bunfig.toml, packages/*/bunfig.toml, scripts/git-env.test.mjs
- P9 — the hardening annex ships as docs and `init-workspace` applies none of it
  by default
  (validator: `rg -n 'GIT_IDENTITY' docs/workflow/README.md` matches 1 and `rg -n 'gitIdentity' skills/init-workspace/` matches ≥1)
  (Implements: S6)
  - Relevant files: docs/workflow/GIT_IDENTITY_HARDENING.md, template/docs/workflow/GIT_IDENTITY_HARDENING.md, skills/init-workspace/SKILL.md, template/.agentic-workflow/hooks/README.md
- P10 — verification: every obligation's validator run in the foreground, the
  full root suite green, the docs projection regenerated
  (validator: `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9)
  - Relevant files: docs/features/514-git-identity-signing-guard/planning-obligations.md, docs/LOGS.md, docs/ROADMAP.md

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line, and `phase-lint` refuses a bullet
with no link, a link to an undeclared id, and a base requirement no bullet
implements.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

M/L unit: the ledger lives in
[`planning-evidence.md`](planning-evidence.md), never embedded here.

### Obligations

M/L unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md), never embedded here.

## Triaged steps

Triage ran inline (the owner's local, unpublished workflow substitutes for the
lane's triage/plan steps): every requirement in `## Specs` is in scope, the unit
kind is `feature`, and the steps are the `## Tasks` list above in dependency
order (contract → gate → migration → push check → hook → parity → agent guard →
entry-point scrub → docs → verification). No step is deferred out of the unit.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

The carrier grammar (`findings-table@1`): the OPEN rows only, appended by
`review-change` and `triage-issue`. A folded row leaves the table and becomes a
`## Log` line, so this table never grows a history column.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | BLOCKER \| CRITICAL \| WARNING \| SUGGESTION | the published ladder (meanings owned by `skills/review-implementation/references/CLASSIFY.md` §Severity ladder): `BLOCKER` requires a reproducer and is never a conversion target
impact | blocking \| docs-only \| report-only | whether the finding affects behaviour, only documents, or nothing that blocks: `blocking`/`docs-only` for a `BLOCKER`, and `report-only` for a pre-existing advisory, which never earns a correction round
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from the closed set in `log-kind@1` below.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-12, the request, verbatim:
  ```
  Apply to this repository: issue #514
  ```
- **L2** — 2026-11-12, the issue's own words are S2..S9, quoted verbatim from
  `gh issue view 514`.
- **D1** — 2026-11-12, owner's local workflow §5 names `docs/fix/<issue>-<topic>/`
  as the home; the issue is labelled `feature` and the repository's own map sends
  a feature unit to `docs/features/<NN>-<slug>/` with
  `docs/features/_TEMPLATE/SPEC.md`. The feature home wins; the deviation is
  reported, not silent.
- **D2** — 2026-11-12, `gitIdentity` is a **base** section
  (`agentic-workflow.json`), not a pi-extension key: CONFIG.md question 2 sends
  cross-tool behaviour to the base file, and three consumers (pi guard, git hook,
  push gate) read the one profile.
- **D3** — 2026-11-12, fail mode: interactive → ask once and persist consent per
  project + normalised invocation; headless (`ctx.hasUI === false`) → block
  (fail-closed), per issue #514 §Open questions.
- **D4** — 2026-11-12, the hook is inert without a declared profile: `enforce`
  defaults to `off`, so an unconfigured target project that copied the scaffold
  is never blocked by an opt-in hook it did not configure.
- **D5** — 2026-11-12, the bash hook and the node checker are two
  implementations of one contract, pinned by one differential corpus
  (`scripts/identity-hook-parity.test.mjs`) — the alternative (the hook shelling
  out to a node CLI) would make a git hook depend on node and on a network
  install.

- **D6** — 2026-11-12, O11's validator cell named `template/docs/workflow/README.md`,
  which does not exist (the template's `docs/workflow/` carries two pages and no
  index). The validator now names the second surface that really exists — the
  template hooks README's link — instead of an unverifiable path. Plan repair,
  recorded here, same practice as unit 498's D2.
- **P1** — 2026-11-12, the `gitIdentity` base section, the regenerated
  `config.schema.json` and the CONFIG.md row · `3c6513f7`.
- **P2 P3** — 2026-11-12, the repo-wide `-c` gate and the 35-carrier migration
  (129 writes removed) · `106f77f5`.
- **P4** — 2026-11-12, `scripts/push-identity-check.mjs` + the local-gate
  `push-identity` step · `83087dc3`.
- **P5 P6** — 2026-11-12, the pre-commit hook, its shell suite and the parity
  corpus · `8d78f13f`.
- **P7** — 2026-11-12, the pi agent guard, the consent store and the `tool_call`
  wiring · `99963d20`.
- **P8** — 2026-11-12, the per-file/package-suite scrub (one preload, five
  bunfigs) · `4f0c5eca`.
- **P9** — 2026-11-12, the annex (repo + template), the gate inventory rows, the
  docs index row, the pi README section, the changeset, the roadmap row and the
  projection · `d449f9aa`, `649287ee`.
- **E1** — 2026-11-12, `node --test scripts/git-config-writes.test.mjs` and
  `node --test scripts/push-identity-check.test.mjs` at commit `fcfd70cb` ·
  exit 1 · both suites failed on the missing module (the red commit).
- **E2** — 2026-11-12, `bun test scripts/git-config-writes.test.mjs` · exit 0 ·
  8 pass / 0 fail; two gate runs byte-identical.
- **E3** — 2026-11-12, `node scripts/git-config-writes.mjs` · exit 0 ·
  `278 carriers scanned, 0 findings` / `verdict: PASS`.
- **E4** — 2026-11-12, `bun test scripts/push-identity-check.test.mjs` · exit 0 ·
  8 pass / 0 fail (ok, failed author, failed committer, three skip shapes,
  project-over-global, read-only twice, JSONC, usage).
- **E5** — 2026-11-12, `bash template/.agentic-workflow/hooks/tests/test-git-identity-check.sh` ·
  exit 0 · 18 cases, 0 failures (inert, match, author, committer, enforce=push,
  config error, JSONC, three signing cases, key mismatch, read-only).
- **E6** — 2026-11-12, `bun test scripts/identity-hook-parity.test.mjs` · exit 0 ·
  12 pass / 0 fail (both halves agree on five shapes, two declared asymmetries,
  JSONC, unparseable profile, no writes).
- **E7** — 2026-11-12, `bun test scripts/git-env.test.mjs` · exit 0 · 6 pass /
  0 fail, including a real `bun test` run over a temporary proof suite started
  with `GIT_DIR` set (the suite body saw no locator).
- **E8** — 2026-11-12, `node scripts/red-first.mjs` · exit 0 ·
  `58 pair(s) · 27 after the cutoff · 0 finding(s)` / `verdict: PASS`.
- **E9** — 2026-11-12, `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` ·
  exit 0 · 22 pass / 0 fail (18 module cases + 4 `tool_call` wiring cases).
- **E10** — 2026-11-12, `bun run check:config-schema` (schema package) · exit 0 ·
  `config.schema.json: current`; the package suite 851/0.
- **E11** — 2026-11-12, `agentic-workflow config list --json` · exit 0 · the
  section and its eleven nodes are discoverable (`gitIdentity`,
  `gitIdentity.enforce`, `.approved.*`, `.agentGuard.*`).
- **E12** — 2026-11-12, differential against base `43e8c1f9`:
  `local-gate --list` differs by exactly `push-identity`; `local-gate --dry-run`
  is byte-identical (the step is dropped without a range). Nothing else moved.
- **G1** — 2026-11-12, `node scripts/local-gate.mjs --skip-network --jobs 2` ·
  root-suite exit 0 (166s), crate suites exit 0, `docs-generated-projection`,
  `version-parity-content`, `journal-carrier-check`, `log-immutability`,
  `temp-hygiene`, `tmp-gc` exit 0; the run stops at `worktree-guard` exit 1 for a
  **pre-existing** finding (`feat-437-issue-review-loop-mechanics-and-economics`
  is merged into `origin/main` and still checked out) — it reproduces on the base
  archive and names nothing this branch touched.
- **G2** — 2026-11-12, `node scripts/local-gate.mjs --only schema-node-compat,pi-node-compat --skip-network` ·
  exit 0 · PASS 2 steps.
- **G3** — 2026-11-12, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  `3 checked · 0 missing · 0 stale · 0 orphaned` / `verdict: PASS`.
- **G4** — 2026-11-12, `bun scripts/check-skill-context.mjs` and `--documents` ·
  exit 0 · `PASS context budgets: 29 skills` / `PASS context documents`.
- **G5** — 2026-11-12, `bun scripts/skill-lint.mjs` · exit 0 ·
  `99 file(s) · 7 check(s) · 0 finding(s)` / `verdict: PASS`.

## Next

External verification of the delivered diff (`feat/514-new-feature-git-identity-signing-guard`,
head `649287ee`). No phase is open; the corrections bound is one batch.

## References

- Issue [#514](https://github.com/gtrabanco/agentic-workflow/issues/514).
- Related (soft): #487 (push-range secret scanning shares the pre-push surface).
- Precedent: `scripts/log-immutability.test.mjs` (`-c` identity convention),
  `template/.agentic-workflow/hooks/guard-command.sh` (normalized hook adapter),
  `packages/pi-agentic-workflow/src/extension/receipt-guard.ts` (`tool_call` seam).
