---
type: fix
scope: small
ac-hash: 6cbeafd36383554c3fcb6a90643c85a9fe39f16ecfc390ed538dfa19ed1dd05b
roadmap_summary: Issue [#655](https://github.com/gtrabanco/agentic-workflow/issues/655) (S, high): the wired git identity guard never read its own disposition, so a configured `deny` still showed the approval dialog (and allowed the write when approved) and `allow` still asked — the mode was inert on the only path that runs. One disposition function now decides per write, `decideGitConfigCall` reads it instead of duplicating it, and a headless session blocks in every mode except `allow`. SPEC: [SPEC](fix/655-git-identity-guard/SPEC.md)
---

# fix/655-git-identity-guard

> Fix specification — applied through the owner's local, unpublished workflow
> (issue #655): the ledgers below are frozen at cut, the change is worked inline,
> and the owner is the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#655` — [ISSUE: git identity guard ignores guard.gitIdentity.mode — deny still prompts, allow still asks](https://github.com/gtrabanco/agentic-workflow/issues/655).
The PR closes it via `Closes #655`.

## Specs

**S1 — `deny` refuses without asking.**
> - `deny`: no dialog; the write is blocked with the reason; the 5-minute unanswered-dialog hang disappears for deny (there is no dialog to time out).

**S2 — `allow` stands the guard down.**
> - `allow`: no dialog; the write passes.

**S3 — `ask` (the default) is unchanged.**
> - `ask` (default): behavior unchanged; the consent store is still honored; headless still blocks.

**S4 — headless blocks in every mode except `allow`.**
> A headless session (no UI) keeps blocking in every mode except `allow`.

**S5 — one home for the disposition, and the resolution shape unchanged.**
> `guardOptions` continues to resolve the mode from `guard.gitIdentity` (#626/#636 shapes); suites updated (the dead-code path `decideGitConfigCall` is either wired or removed — one home, never two).

## Impact

- **What changes:** `applyGitIdentityGuard` — the only path the extension's
  `tool_call` handler calls — gains the disposition it was handed and never
  read. The decision is extracted once (`dispositionFor`) and consumed by both
  `decideGitConfigCall` (the pure projection: first write needing consent) and
  `applyGitIdentityGuard` (the consent lifecycle), so the two cannot disagree
  again — S5's "one home, never two".
- **Callers:** `packages/pi-agentic-workflow/src/extension/index.ts:561` is the
  only production caller, and it already passes
  `loaded.config.guard.gitIdentity` through `guardOptions`; no wiring change is
  required, which is precisely why the defect was invisible — the value arrived
  and was dropped one frame later.
- **Consumers of the docs:** `docs/workflow/CONFIG.md` (§Guards, the
  `guard-reference@1` table row), `packages/pi-agentic-workflow/README.md`
  (the verdict table and the two-key paragraph),
  `packages/agentic-workflow-schema/src/config.ts` (the `gitIdentity` guard
  description) and `docs/workflow/GIT_IDENTITY_HARDENING.md:52-55` all describe
  the three dispositions. The last three state headless behaviour that only
  becomes true with this change.
- **Ask before touching:** nothing live. Existing consents
  (`git-identity-consent.json`) are read under `ask` only, so a project that
  switches to `deny` blocks a previously approved key by configuration — the
  intended direction, and the reason `deny` outranks a stored approval.

## Surfaces

- `packages/pi-agentic-workflow`

## Retirements

Nothing is removed. `decideGitConfigCall` stays and is *wired* (S5's first
option): it is the pure projection a caller wants when it has no host, and
deleting it would leave `applyGitIdentityGuard` as the only home of a decision
it must also be able to answer without a host. The duplication that retires is
the *decision body*, not the function: the mode→action mapping moves out of
`decideGitConfigCall` into the shared `dispositionFor`.

`rg -c 'mode === "allow" ? "allow"' packages/pi-agentic-workflow/src/guards/git-identity.ts`
→ `0` after the change (the inline ternary is gone; the mapping lives in one
function).

## Non-goals

- The guard's parse (`findGitConfigWrites`), its reasons, its allow-list and its
  consent store are unchanged.
- `gitIdentity.enforce` (the commit/push half) and Layer 2 (the hook and the
  push-range check) are untouched.
- No new config key, no schema shape change: the disposition already exists and
  already resolves.

## Risk tier

Computed, never chosen — `bun packages/agentic-workflow/bin/agentic-workflow.mjs
ceremony tier classify --paths <the unit's paths>`, verbatim:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "1 path(s) carry executable content: packages/pi-agentic-workflow/src/guards/git-identity.ts",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": []
}
```

- **Tier** — `standard` · **Task Size** — `understood: true · contained · resumable-from-diff: true`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

none

## Future cost

- **A new guard with a question path must consume `dispositionFor`.** It binds
  the author of the next `apply*Guard`: a guard that reads `options.mode` with
  its own ternary re-opens exactly this defect (a shipped disposition the wired
  path ignores), and the parity case in `O4` is the shape that catches it.

## Applicable tests

- `packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` — the module's
  own suite (46 cases at cut) gains the disposition cases: `deny` (no dialog,
  blocked, reason), `allow` (no dialog, passes), headless under `allow`
  (passes) and under `deny` (blocked), the `decideGitConfigCall` ↔
  `applyGitIdentityGuard` parity corpus, and the two wired-path cases.
- No root `scripts/*.test.mjs` covers this module; the root gate still runs
  (verification task).

## Known pre-existing issues

- **#654's permission-layer adoption** (`packages/pi-agentic-workflow/src/guards/plugin-core.ts`,
  the retired shell write guard) — *does not affect* this unit: the identity
  guard stayed a first-party extension path after #654 (verified at the cut
  head: `extension/index.ts:561` still calls `applyGitIdentityGuard`), and this
  change touches only the disposition it consumes.
- **The 5-minute dialog hang** the issue names under `deny` — *affected, and
  removed by this unit for `deny`/`allow`*: it is the host's unanswered-prompt
  timeout, reachable only while a dialog exists; no new timeout is introduced
  here and `ask` keeps the host's own behaviour.
- **Stale worktree `.worktrees/feat-553-universal-cli`** (branch
  `feat/553-universal-cli` at the cut head, merged into `origin/main`, one
  untracked `docs/features/553-universal-cli/` folder) — *does not affect this
  unit*: it is a different lane's checkout, so `worktree-guard` reports its one
  `STALE` finding on every head of this branch. It is not removed here: deleting
  a worktree with uncommitted content is the owner's call, not a side effect of
  a guard fix (`IR8`).

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — `deny` refuses the write with no dialog at all and hands the model
  a teaching reason: for a local identity write, a `--global` write and a
  destructive `--unset`, the applied verdict is `{block:true}`, the injected
  `confirm` is never called, and the reason carries the write's own repair text
  plus the configured disposition. Check: `bun test
  packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 with
  `M1` and `M2` green.
- **AC-S2** — `allow` stands the guard down with no dialog and no recorded
  consent, interactive and headless alike. Check: the same run exits 0 with `M3`
  and `M4` green.
- **AC-S3** — `ask` (the default) behaves exactly as it did: a headless session
  blocks and says it cannot ask, an interactive approval is asked once and
  remembered, and a refusal persists nothing. Check: the same run exits 0 with
  the three cut-head consent cases green and `0 fail` over the whole suite
  (46 cut-head cases + the new ones).
- **AC-S4** — A headless session blocks in every mode except `allow`: `deny` and
  `ask` both answer `{block:true}`, `allow` answers `{block:false}`, and no
  dialog is attempted in any of them. Check: `M4` green, and the `deny` refusal
  under a headless host does not read as a missing-UI refusal.
- **AC-S5** — One home and unchanged resolution: `decideGitConfigCall` and
  `applyGitIdentityGuard` agree over a corpus of commands × the three modes
  (`M5`), `guardOptions` still resolves the mode from `guard.gitIdentity` and
  still refuses a value outside the published vocabulary (the cut-head #626
  case), and `decideGitConfigCall`'s own output is byte-identical to the cut
  head across the differential matrix. Check: the same run exits 0 with `M5` and
  the #626 case green, and the differential probe's `decision` column shows no
  delta (`## Log` `E` line).
- **AC-S6** — Documentation currency: the headless rule is stated per mode in
  the `guard-reference@1` row, the package README, the schema's `gitIdentity`
  description and the hardening guide, and the release intent declares both
  touched packages. Check:
  `rg -n 'in every mode except `allow`' docs/workflow/CONFIG.md
  packages/pi-agentic-workflow/README.md
  packages/agentic-workflow-schema/src/config.ts` matches 3 and
  `bun scripts/version-parity-gate.mjs` exits 0.

The coverage receipt the manifest reads (`ceremony acceptance read`): each row is
`criterion | check | exit | output`, and the run it cites is a `## Log` line.

| criterion | check | exit | output |
|---|---|---|---|
| AC1 | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` (E4) | 0 | `M1`, `M2` green — 3 asking writes refused with `asks: 0` and the disposition named |
| AC2 | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` (E4) | 0 | `M3`, `M4` green — passes with `asks: 0` and `remembered: []`, headless included |
| AC3 | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` (E4) | 0 | 55 pass, 0 fail — the three cut-head consent cases green |
| AC4 | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` (E4) | 0 | `M4` green — headless refused under `deny`/`ask`, passing under `allow` |
| AC5 | the differential probe over the cut head's build (E3) | 0 | 367 rows, 247 identical, every delta a disposition answer; the `decision` column has none |
| AC6 | `rg -n 'in every mode except `allow`' …` (E7) + `bun scripts/version-parity-gate.mjs --content` (E9) | 0 | 3 matches; `VERDICT: PASS` with both packages declared |

## Tasks

- P1 — cut this unit doc, its frozen planning ledgers and the path-protection
  record (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/655-git-identity-guard/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/655-git-identity-guard/SPEC.md, docs/fix/655-git-identity-guard/decisions.md
- P2 — RED: add the disposition cases to the guard suite and observe them
  failing against the cut head's `dist/` (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits non-zero, naming the new cases)
  (Implements: S1, S2, S4, S5)
  - Relevant files: packages/pi-agentic-workflow/test/git-identity-guard.test.mjs
- P3 — GREEN: one disposition function owns the mode mapping per write;
  `applyGitIdentityGuard` consumes it for `deny`/`allow`/`ask` and keeps the
  headless refusal (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: packages/pi-agentic-workflow/src/guards/git-identity.ts
- P4 — documentation currency: the `guard-reference@1` row, the package README's
  verdict table and two-key paragraph, the schema's `gitIdentity` description,
  and the release intent (validator: `rg -n 'in every mode except `allow`' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md packages/agentic-workflow-schema/src/config.ts` matches 3)
  (Implements: S1, S2, S3, S4)
  - Relevant files: docs/workflow/CONFIG.md, packages/pi-agentic-workflow/README.md, packages/agentic-workflow-schema/src/config.ts, .changeset/655-git-identity-guard.md
- P5 — state: the `## Fixes` row through the crate's writer, the generated
  projection re-emitted, the session entry in `docs/LOGS.md` (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/ROADMAP.md, docs/generated/, docs/LOGS.md
- P6 — verification: the package suite under both runtimes, the type-check and
  the root gate (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/655-git-identity-guard/SPEC.md

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order (owner: `skills/pre-execution-review/references/LEDGERS.md`). Measured at
the cut head `c5fb2ba58156053e539783c3442fe76c97239c39`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | The reproducer fires exactly as filed at the cut head: with a `host.confirm` double resolving `true`, `applyGitIdentityGuard("git config --global user.name Fixture", {mode:"deny"})` → `asks: 1, block: false`; `{mode:"allow"}` → `asks: 1, block: false`; `{mode:"ask"}` → `asks: 1, block: false`; headless `{mode:"allow"}` → `block: true` and headless `{mode:"deny"}` → `block: true` | `/tmp/aw655-probe-*` probe driving the cut head's `dist/guards/git-identity.js` | measured 2026-11-19 (this session) | O1, O2, O3, O5, O6; AC-S1, AC-S2, AC-S4 |
| PE-002 | committed-source | `applyGitIdentityGuard` never reads `options.mode`: its loop asks `questionFor`, then the consent store, then `host.confirm`, and returns `{block:false}` on approval regardless of the disposition; `decideGitConfigCall` is the only mode-aware body (`options.mode === "allow" ? "allow" : options.mode === "deny" ? "block" : "ask"`) | `packages/pi-agentic-workflow/src/guards/git-identity.ts:474-478,530-553` | read 2026-11-19 (this session) | O1, O2, O3, O4; S5 |
| PE-003 | committed-source | The wiring already hands the resolved disposition to the guard — `guardOptions(loaded.config.gitIdentity, ctx.cwd, scratchDirs(), loaded.config.guard.gitIdentity)` — so the value arrives correctly and is dropped inside the module; the wiring needs no change | `packages/pi-agentic-workflow/src/extension/index.ts:561-573` | read 2026-11-19 (this session) | O7; AC-S1, AC-S2 |
| PE-004 | committed-source | The disposition resolution is intact and unchanged by this unit: `normalizeGuard` reads `section[name].mode ?? section.default ?? "ask"` and `loadConfig` passes it as `normalizeGitIdentity(baseResolved.config.gitIdentity, baseResolved.config.guard)`; `guardOptions` then validates it against the published `GUARD_MODES` and falls back to `DEFAULT_AGENT_MODE` | `packages/agentic-workflow-schema/src/config.ts:277-288`; `packages/pi-agentic-workflow/src/config/load.ts:164`; `packages/pi-agentic-workflow/src/guards/git-identity.ts:96-110` | read 2026-11-19 (this session) | O8; AC-S5 |
| PE-005 | measured-run | The regression baseline at the cut head: the guard suite is `46 pass, 0 fail`, and `tsc` builds the package clean | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` → `46 pass, 0 fail`; `bun run build` in the package → exit 0 | measured 2026-11-19 (this session) | O9; AC-S3 |
| PE-006 | committed-source | The documented semantics already promise what the code does not do: `docs/workflow/CONFIG.md` §Guards states `deny` refuses without asking and `ask` denies when it cannot ask, the `guard-reference@1` row says "a session with no UI is denied", the package README's table says "asks (headless: blocks)", and the schema's `gitIdentity` description says "`ask` can really ask; a headless session is denied" — each is untrue for `allow` today and for `deny` in the interactive case | `docs/workflow/CONFIG.md:118-146`; `packages/pi-agentic-workflow/README.md:596-616`; `packages/agentic-workflow-schema/src/config.ts:253` | read 2026-11-19 (this session) | O10, O11; AC-S1, AC-S2, AC-S3 |
| PE-007 | measured-run | `decideGitConfigCall` has exactly one caller — the suite — and no production path reads it, so a fix that only wired it would change nothing observable; the disposition must live where the applier consumes it | `rg -n 'decideGitConfigCall' --glob '!node_modules' packages skills scripts` → the module, its suite and two closed unit docs | measured 2026-11-19 (this session) | O4; S5's "one home, never two" |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the 9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`. Every row is `planned` at
cut time and `verified` only against a foreground validator run.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 · S4 · PE-001, PE-002 · AC-S1 | Under `deny` an identity write is refused with no dialog at all — `host.confirm` is never called, the verdict is `{block:true}`, and the reason carries the write's teaching text plus the configured disposition, so an operator reading it knows no prompt was skipped by accident | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `M1`, `M2`) | `E` line naming `M1`/`M2` | verified — E4 line (`M1`/`M2` green: three asking writes refused with `asks: 0`, the reason naming `guard.gitIdentity.mode` and carrying the write's own `--show-origin` repair) |
| O2 | S2 · S4 · PE-001, PE-002 · AC-S2 | Under `allow` the guard stands down — no dialog, `{block:false}`, nothing remembered — and that holds in a headless session too, which is the one mode where the missing-UI refusal must not fire | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `M3`, `M4`) | `E` line naming `M3`/`M4` | verified — E4 line (`M3`/`M4` green: three asking writes pass with `asks: 0` and `remembered: []`, headless included) |
| O3 | S3 · PE-002, PE-005 · AC-S3 | Under `ask` every cut-head behaviour survives byte for byte: a headless session blocks naming why it cannot ask, an interactive approval is asked once and remembered, and a refusal persists nothing | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (the cut-head consent cases: `a headless session blocks instead of asking, and says why`, `an interactive approval is remembered and never asked twice`, `a refused prompt blocks the write`) | `E` line with the run's pass count and `0 fail` | verified — E4 line (55 pass, 0 fail: the three cut-head consent cases green) |
| O4 | S5 · PE-002, PE-007 · AC-S5 | One home: `decideGitConfigCall` and `applyGitIdentityGuard` answer from the same disposition for the same write set, so a corpus of commands × modes agrees — `allow` → passes and never asks, `block` → blocked and never asks, `ask` → asks only when the host can | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case `M5`) | `E` line naming `M5` and the corpus size | verified — E4 line (`M5` green: 13 commands × 3 modes × 12 host combinations, every row agreeing with `decideGitConfigCall`) |
| O5 | S1 · S4 · PE-001 · AC-S1, AC-S4 | A stored consent never overrides `deny`: a project that switches to `deny` blocks a key it approved earlier, because the disposition is the project's posture and the store answers only the `ask` question | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case `M6`) | `E` line naming `M6` | verified — E4 line (`M6` green: a stored approval leaves `deny` blocking) |
| O6 | S1, S2 · PE-001 · AC-S1, AC-S2 | A write that needs no consent under the allow-list, the scratch `--file` rule or the non-identity rule never reaches the disposition: `deny`/`allow` change nothing about what is asked — only how an asking write is answered | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `M7`) | `E` line naming `M7` | verified — E4 line (`M7` green: allow-listed, scratch `--file`, non-identity and read commands pass under `deny`) |
| O7 | S1, S2 · PE-003 · AC-S1, AC-S2 | The shipped `tool_call` path honours the disposition read from the project's base config file: `.pi/agentic-workflow.json` carrying `guard.gitIdentity.mode: "deny"` blocks with a confirm double that would answer yes, and `"allow"` passes — neither calls the dialog | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `W1`, `W2`) | `E` line naming `W1`/`W2` | verified — E4 line (`W1`/`W2` green: the project's `guard.gitIdentity.mode` from `.pi/agentic-workflow.json` decides, with `asked: 0` both ways) |
| O8 | S5 · PE-004 · AC-S5 | `guardOptions` keeps resolving the mode from `guard.gitIdentity` and keeps refusing a value the published vocabulary does not carry, so a typo still falls back to the shipped `ask` | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (the cut-head case `issue #626: the disposition is resolved from guard, and a retired mode is inert`) | `E` line naming the #626 case | verified — E4 line (the cut-head `issue #626: the disposition is resolved from guard…` case green) |
| O9 | S3 · PE-005 · AC-S3 | No pre-existing assertion is deleted, relaxed or narrowed: the suite's 46 cut-head cases still pass, and the diff of the test file adds assertions only | P2 | P2 | direct application (this session) | `git diff c5fb2ba58 -- packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` shows no removed assertion line, and the suite exits 0 | `E` line with the removal count (0) and the final pass count | verified — E6 line (2 removed lines, both inside the shared `wiredContext` helper: its signature gains `asked` and its `confirm` records; no assertion deleted, relaxed or narrowed) |
| O10 | S1, S2, S3 · PE-006 · AC-S6 | The three dispositions are documented where an operator configures them: the `guard-reference@1` table row states the headless rule per mode, the package README's verdict table and two-key paragraph name what `deny`/`allow` do, and `CONFIG.md` §Guards stays the one home of the mode semantics | P4 | P4 | direct application (this session) | `rg -n 'in every mode except `allow`' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md packages/agentic-workflow-schema/src/config.ts` matches 3 | `E` line with the command and its three matches | verified — E7 line (the three files match once each) |
| O11 | S1, S2 · PE-006 · AC-S6 | The published schema description tells the truth in all three modes: `gitIdentity`'s description no longer claims headless is always denied, so a `config` reader and the runtime agree | P4 | P4 | direct application (this session) | `bun test scripts/normative-drift.test.mjs` exits 0 | `E` line with the drift verdict | verified — E8 line (`23 pass, 0 fail`) |
| O12 | S1, S2, S3, S4, S5 · AC-S5, AC-S6 | Repository state ships in the same change: the unit doc with its closed ledger, the `## Fixes` row written through the crate's writer (never a hand edit), the re-emitted projection, the release intent declaring the touched packages, and the session entry | P5 | P5 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/version-parity-gate.mjs` exits 0 | `E` line with both verdicts | verified — E9 line (`docs-generate --check` PASS and `version-parity-gate --content` PASS, both changesets resolved) |
| O13 | S1, S2, S3, S4, S5 · PE-005 · AC-S1, AC-S2, AC-S3, AC-S4, AC-S5, AC-S6 | The whole gate passes with the change in place, under the package suite and the root suite | P6 | P6 | direct application (this session) | `node scripts/run-root-suite.mjs` exits 0 and `cd packages/pi-agentic-workflow && bun run test` exits 0 | `E` lines with both verdicts and the test counts | verified — E10/E4 lines (root suite exit 0, 135 suites PASS; package suite 1031 pass, 0 fail; the node leg 55 pass) |

## Path protection

The suite this unit appends to is a protected path (`**/*.test.*`, `freeze:
true`), so the modification carries its justification record in this folder's
[`decisions.md`](decisions.md). The record is an *expansion*: no pre-existing
assertion is deleted, relaxed or narrowed.

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
not-created | packages/pi-agentic-workflow/test/git-identity-guard.test.mjs | the guard's own frozen corpus: P2 appends the disposition cases (O1–O7) and keeps every pre-existing case byte-identical
```

## Triaged steps

n/a — applied inline per the owner's instruction (the workflow's §4): the §5
ledger freeze substitutes for the lane's plan step, and no repo review, audit,
fold or settlement machinery runs on this surgery. The `## Tasks` section above
is the authoritative step list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-19, the owner's request, verbatim:
  ```
  Apply to this repository: issue #655
  ```
- **L2** — 2026-11-19, the issue, verbatim:
  ```
  ## What's broken

  The only wired decision path for the agent-side git identity guard,
  `applyGitIdentityGuard` (`packages/pi-agentic-workflow/src/guards/git-identity.ts`,
  wired in `src/extension/index.ts`), never reads `options.mode`. The disposition
  #626 defined (PR #636: `allow` / `deny` / `ask`, resolved through
  `guardOptions(..., loaded.config.guard.gitIdentity)`) therefore has no effect at
  runtime: `mode: "deny"` still shows the approval dialog and lets the write
  through if approved; `mode: "allow"` still asks. `decideGitConfigCall` — the
  function that honors the mode — is dead code only its own test calls.

  ## Expected behaviour

  Per #626's documented semantics: `deny` refuses **without asking** (fail
  closed, teaching reason); `allow` stands down; `ask` keeps the current dialog
  path. A headless session (no UI) keeps blocking in every mode except `allow`.

  ## Acceptance criteria

  - `deny`: no dialog; the write is blocked with the reason; the 5-minute
    unanswered-dialog hang disappears for deny (there is no dialog to time out).
  - `allow`: no dialog; the write passes.
  - `ask` (default): behavior unchanged; the consent store is still honored;
    headless still blocks.
  - `guardOptions` continues to resolve the mode from `guard.gitIdentity`
    (#626/#636 shapes); suites updated (the dead-code path `decideGitConfigCall`
    is either wired or removed — one home, never two).
  ```

- **E1** — 2026-11-20, the frozen-failure reproducer at the cut head `c5fb2ba58`, a
  `/tmp` probe driving `dist/guards/git-identity.js` · exit 0 · `{mode:"deny",asks:1,block:false}`,
  `{mode:"allow",asks:1,block:false}`, `{mode:"ask",asks:1,block:false}`,
  `{mode:"allow",headless,block:true}` — the issue's reproduction fires exactly as filed.
- **P1** — 2026-11-20, this unit doc cut with its ledgers, the AC coverage table and
  the path-protection record · `9d02ca130`.
- **E2** — 2026-11-20, `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`
  at `fa6429a89` against the cut head's `dist/` · exit 1 · `47 pass, 8 fail` naming
  `M1`–`M6`, `W1`, `W2` (the red corpus).
- **P2** — 2026-11-20, the disposition cases appended to the frozen suite, observed red · `fa6429a89`.
- **E3** — 2026-11-20, the differential probe: the same script over the cut head's
  build (`tsc --outDir dist/_base` on `c5fb2ba58`'s source) and over the change,
  15 commands × 3 modes × 12 host combinations · exit 0 · 367 rows, **247 identical**,
  every delta a disposition answer (`deny` blocks with no dialog, `allow` passes with
  no dialog, headless `allow` passes), and the `decision` column identical across the
  whole matrix — `decideGitConfigCall` did not move. The scratch build was removed.
- **P3** — 2026-11-20, one `dispositionFor` owns the mode mapping; the applier consumes
  it and gains `deny`/`allow`, `ask` untouched · `0f582a507`.
- **E4** — 2026-11-20, `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`
  · exit 0 · `55 pass, 0 fail` — `M1`–`M7`, `W1`, `W2` green beside every cut-head case.
- **E5** — 2026-11-20, `bun run test` in `packages/pi-agentic-workflow` (`bundle:skills`,
  `tsc`, the whole suite) · exit 0 · `1031 pass, 0 fail` across 89 files; the node leg
  `node --test --test-timeout=10000 test/git-identity-guard.test.mjs` · exit 0 · 55 pass.
- **P4** — 2026-11-20, documentation currency and the release intent · `e3a9e1ac2`,
  plus the `M2` assertion correction the red corpus needed · `df514c82e`.
- **E6** — 2026-11-20, `git diff c5fb2ba58 -- packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`
  · 2 removed lines, both in the shared `wiredContext` helper (its signature gains
  `asked`, its `confirm` records) · 0 assertions deleted, relaxed or narrowed.
- **E7** — 2026-11-20, `rg -n 'in every mode except `allow`' docs/workflow/CONFIG.md
  packages/pi-agentic-workflow/README.md packages/agentic-workflow-schema/src/config.ts`
  · 3 matches (one per file).
- **E8** — 2026-11-20, `bun test scripts/normative-drift.test.mjs` · exit 0 · `23 pass, 0 fail`.
- **E9** — 2026-11-20, `bun scripts/docs-generate.mjs --check` · exit 0 · `files 3 checked,
  0 stale · verdict: PASS`; `bun scripts/version-parity-gate.mjs --content` · exit 0 ·
  `VERDICT: PASS` with both touched packages resolved through the changeset.
- **E10** — 2026-11-20, `node scripts/run-root-suite.mjs --jobs 4` · exit 0 · 135 suites
  `PASS`, 0 `FAIL` (the first run was red on `scripts/roadmap-settle.test.mjs`
  `slug-mismatch`, repaired by rewriting the row's topic through `roadmap fixrow` so it
  matches the folder, never by hand).
- **E11** — 2026-11-20, `bun scripts/check-skill-context.mjs --documents` · exit 0 ·
  `PASS context documents: 7 budgeted documents` — the package README's growth was paid
  for inside its own section, so its 1299-line ceiling still holds.
- **E12** — 2026-11-20, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/655-git-identity-guard/SPEC.md` · exit 0 · `P1`–`P6` `PASS (6/6)`, `verdict PASS`;
  `ceremony acceptance read --slug 655-git-identity-guard` reports all six criteria `met`.
- **P5** — 2026-11-20, registry state in the same change: the `## Fixes` row through
  `roadmap fixrow` (twice — the second write repaired the topic the live suite
  refused, `slug-mismatch`), the projection re-emitted by `docs-generate`, and the
  narrative journal fragment · `01ee9f85c`.
- **P6** — 2026-11-20, verification: `E5`–`E12` run in the foreground; no obligation
  left `planned`, and the AC coverage table reports all six criteria `met`.
- **G1** — 2026-11-20, HEAD 836f88c30cf0371a7d724ca6af50e2f6d5a14b9c ·
  `bun scripts/local-gate.mjs --skip-network --jobs 4` · exit 1 · 14 of 15 steps
  PASS (`schema-build`, `version-parity`,
  `docs-generated-projection`, `log-immutability` 0 violations over 7 commits,
  `root-suite` exit 0 in 132s, `journal-carrier-check`, `secret-scan` 0 findings,
  `temp-hygiene`, `tmp-gc`, `rigidity-review`, …) and one FAIL — `worktree-guard`,
  whose single finding is the pre-existing stale `feat-553-universal-cli`
  worktree recorded under `## Known pre-existing issues`, untouched by this unit.
  Four network steps were skipped by the flag.

## Next

The owner's external verify of `fix/655-git-identity-guard`: the diff summary, the
obligations ledger (13 rows, all `verified`), the verification block and the
differential receipt above. On the owner's verdict, push the branch and open the
single PR against `main` with `Closes #655`.

## References

- Issue: [#655](https://github.com/gtrabanco/agentic-workflow/issues/655)
- Relates to: [#626](https://github.com/gtrabanco/agentic-workflow/issues/626)
  (the disposition vocabulary and its documented semantics),
  [#514](https://github.com/gtrabanco/agentic-workflow/issues/514) (the guard
  itself) and [#618](https://github.com/gtrabanco/agentic-workflow/issues/618)
  (the read/heredoc parser this unit leaves alone)
- Owner: `packages/pi-agentic-workflow/src/guards/git-identity.ts` (the
  disposition), `docs/workflow/CONFIG.md` §Guards (the semantics)

## Branch

`fix/655-git-identity-guard`

## Depends on

None — #654 (the guard-layer adoption) is closed, and the wiring it landed left
`applyGitIdentityGuard` in place (`PE-003`).

## Regression scope

- **The `ask` lifecycle is untouched:** the three cut-head consent cases
  (headless refusal, remembered approval, refused prompt persisting nothing)
  must keep passing unchanged — `bun test
  packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0.
- **The write/read corpus is untouched:** every `findGitConfigWrites` and
  `decideGitConfigCall` case at the cut head (reads, heredocs, backticks,
  allow-list, scratch `--file`, scope flags) keeps its exact assertion.
- **Configuration still refuses a foreign mode:** a written `block` or an
  unknown value resolves to `ask` (`guardOptions`'s `GUARD_MODES` guard), and
  the `.pi/agentic-workflow.json` loader still reports an unknown key rather than
  silently honouring it.
- **No dialog appears where none appeared before:** a command with no write that
  needs consent returns `undefined` from the `tool_call` handler in every mode —
  `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` (the
  read-only and heredoc wiring cases) exits 0.
