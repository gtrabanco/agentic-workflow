---
type: fix
scope: small
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

## Tasks

- P1 — cut this unit doc, its frozen planning ledgers and the path-protection
  record (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/655-git-identity-guard/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: docs/fix/655-git-identity-guard/SPEC.md, docs/fix/655-git-identity-guard/decisions.md
- P2 — RED: add the disposition cases to the guard suite and observe them
  failing against the cut head's `dist/` (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits non-zero, naming the new cases)
  (Implements: S1, S2, S4, S5)
  - Relevant files: packages/pi-agentic-workflow/test/git-identity-guard.test.mjs
- P3 — GREEN: one disposition function decides per write;
  `applyGitIdentityGuard` consumes it for `deny`/`allow`/`ask` and keeps the
  headless refusal (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)
  - Relevant files: packages/pi-agentic-workflow/src/guards/git-identity.ts
- P4 — documentation currency: the `guard-reference@1` row, the package README's
  verdict table and two-key paragraph, the schema's `gitIdentity` description,
  and the release intent (validator: `rg -n 'except `allow`' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md packages/agentic-workflow-schema/src/config.ts` matches 3)
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
| O1 | S1 · S4 · PE-001, PE-002 · AC-S1 | Under `deny` an identity write is refused with no dialog at all — `host.confirm` is never called, the verdict is `{block:true}`, and the reason carries the write's teaching text plus the configured disposition, so an operator reading it knows no prompt was skipped by accident | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `M1`, `M2`) | `E` line naming `M1`/`M2` | planned |
| O2 | S2 · S4 · PE-001, PE-002 · AC-S2 | Under `allow` the guard stands down — no dialog, `{block:false}`, nothing remembered — and that holds in a headless session too, which is the one mode where the missing-UI refusal must not fire | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `M3`, `M4`) | `E` line naming `M3`/`M4` | planned |
| O3 | S3 · PE-002, PE-005 · AC-S3 | Under `ask` every cut-head behaviour survives byte for byte: a headless session blocks naming why it cannot ask, an interactive approval is asked once and remembered, and a refusal persists nothing | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (the cut-head consent cases: `a headless session blocks instead of asking, and says why`, `an interactive approval is remembered and never asked twice`, `a refused prompt blocks the write`) | `E` line with the run's pass count and `0 fail` | planned |
| O4 | S5 · PE-002, PE-007 · AC-S5 | One home: `decideGitConfigCall` and `applyGitIdentityGuard` answer from the same disposition for the same write set, so a corpus of commands × modes agrees — `allow` → passes and never asks, `block` → blocked and never asks, `ask` → asks only when the host can | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case `M5`) | `E` line naming `M5` and the corpus size | planned |
| O5 | S1 · S4 · PE-001 · AC-S1, AC-S4 | A stored consent never overrides `deny`: a project that switches to `deny` blocks a key it approved earlier, because the disposition is the project's posture and the store answers only the `ask` question | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case `M6`) | `E` line naming `M6` | planned |
| O6 | S1, S2 · PE-001 · AC-S1, AC-S2 | A write that needs no consent under the allow-list, the scratch `--file` rule or the non-identity rule never reaches the disposition: `deny`/`allow` change nothing about what is asked — only how an asking write is answered | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `M7`) | `E` line naming `M7` | planned |
| O7 | S1, S2 · PE-003 · AC-S1, AC-S2 | The shipped `tool_call` path honours the disposition read from the project's base config file: `.pi/agentic-workflow.json` carrying `guard.gitIdentity.mode: "deny"` blocks with a confirm double that would answer yes, and `"allow"` passes — neither calls the dialog | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `W1`, `W2`) | `E` line naming `W1`/`W2` | planned |
| O8 | S5 · PE-004 · AC-S5 | `guardOptions` keeps resolving the mode from `guard.gitIdentity` and keeps refusing a value the published vocabulary does not carry, so a typo still falls back to the shipped `ask` | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (the cut-head case `issue #626: the disposition is resolved from guard, and a retired mode is inert`) | `E` line naming the #626 case | planned |
| O9 | S3 · PE-005 · AC-S3 | No pre-existing assertion is deleted, relaxed or narrowed: the suite's 46 cut-head cases still pass, and the diff of the test file adds assertions only | P2 | P2 | direct application (this session) | `git diff c5fb2ba58 -- packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` shows no removed assertion line, and the suite exits 0 | `E` line with the removal count (0) and the final pass count | planned |
| O10 | S1, S2, S3 · PE-006 · AC-S1, AC-S2, AC-S3 | The three dispositions are documented where an operator configures them: the `guard-reference@1` table row states the headless rule per mode, the package README's verdict table and two-key paragraph name what `deny`/`allow` do, and `CONFIG.md` §Guards stays the one home of the mode semantics | P4 | P4 | direct application (this session) | `rg -n 'except `allow`' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md packages/agentic-workflow-schema/src/config.ts` matches 3 | `E` line with the command and its three matches | planned |
| O11 | S1, S2 · PE-006 · AC-S1, AC-S2 | The published schema description tells the truth in all three modes: `gitIdentity`'s description no longer claims headless is always denied, so a `config` reader and the runtime agree | P4 | P4 | direct application (this session) | `bun scripts/normative-drift.test.mjs` exits 0 | `E` line with the drift verdict | planned |
| O12 | S1, S2, S3, S4, S5 · AC-S5 | Repository state ships in the same change: the unit doc with its closed ledger, the `## Fixes` row written through the crate's writer (never a hand edit), the re-emitted projection, the release intent declaring the touched packages, and the session entry | P5 | P5 | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/version-parity-gate.mjs` exits 0 | `E` line with both verdicts | planned |
| O13 | S1, S2, S3, S4, S5 · PE-005 · AC-S1, AC-S2, AC-S3, AC-S4, AC-S5 | The whole gate passes with the change in place, under the package suite and the root suite | P6 | P6 | direct application (this session) | `node scripts/run-root-suite.mjs` exits 0 and `cd packages/pi-agentic-workflow && bun run test` exits 0 | `E` lines with both verdicts and the test counts | planned |

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

## Next

P1 is cut; P2 (the red suite) is the next action.

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
