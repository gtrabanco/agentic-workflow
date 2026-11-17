---
type: fix
scope: small
ac-hash: 5a2adb6652fbb8183cfeb41be500194e086fd3f561625e86db6eeec1990f000e
roadmap_summary: Issue [#606](https://github.com/gtrabanco/agentic-workflow/issues/606) (S): the #567 shell write guard judged every literal redirect operand by containment, so the virtual device sinks — `/dev/null` above all, plus `/dev/zero`, `/dev/full`, `/dev/stdin`, `/dev/stdout`, `/dev/stderr`, `/dev/tty` and `/dev/fd/*` — resolved outside the project root by construction and fired the approval prompt in a UI session (3-minute auto-cancel) or blocked the call headless on nearly every command ending in `2>/dev/null`. `decideShellWrite` now skips the named device set on the lexical absolute path, before the fail-closed resolution the `/dev/std*` symlinks into `/proc/self/fd/…` would trip, and a real durable out-of-root target in the same command still blocks. SPEC: [SPEC](fix/606-shell-guard-device-sinks/SPEC.md)
---

# fix/606-shell-guard-device-sinks

> Fix specification — one single unit document. Applied through the owner's
> local, unpublished workflow: the ledgers below are frozen at cut, the change
> is worked inline, and the owner is the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#606` — [Shell write guard false-positives on device sinks (`/dev/null`, `/dev/stdout`, `/dev/stderr`)](https://github.com/gtrabanco/agentic-workflow/issues/606).
The PR closes it via `Closes #606`.

## Specs

**S1 — Device sinks never earn the containment verdict.**
> Writes to virtual device sinks are discarded or routed to streams the session already owns — never durable storage — so the containment verdict must skip them: no prompt in a UI session, no block headless. A real out-of-root durable target in the same command still blocks.

**S2 — The carve-out is the named device set, matched before resolution.**
> A device-sink carve-out in `decideShellWrite` (skip before resolution — `/dev/std*` resolve through `/proc/self/fd/…` and resolve weirdly): `/dev/null`, `/dev/zero`, `/dev/full`, `/dev/stdin`, `/dev/stdout`, `/dev/stderr`, `/dev/tty`, `/dev/fd/*`.

The issue's `## Reproduction` block is the frozen-failure corpus (one case per
command), not a third requirement; its three commands are cases
`F1`–`F3` of the suite.

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `packages/pi-agentic-workflow/src/guards/shell-path.ts` | S1/S2: `decideShellWrite` skips a named device sink on the lexical absolute path, before `resolveTarget` — one internal predicate beside the verdict, no export added | the `tool_call` handler's bash branch; the sibling suite |
| `packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` | S1/S2: the three reproducers plus the named-set, the mixed-command and the precedence cases, driving both the pure module and the shipped handler | the pi package test run (`bun run test`) |
| `skills/orchestration-envelope/references/TURN_CONTRACT.md` (the #567 runtime-enforcement paragraph, line 188) | S1/S2: the guard's only declared prose gains the carve-out, so the contract stops implying that a device sink is a durable out-of-root target | every orchestration reader, the path-protection checkpoint |
| `docs/ROADMAP.md` `## Fixes` row | this unit's registration, owner-managed | the roadmap readers |
| `.changeset/606-shell-guard-device-sinks.md` | the pi package's behaviour change ships its release intent (`patch`) | the release |
| `docs/fix/606-shell-guard-device-sinks/SPEC.md` | this unit doc | the review and the audit |

Sweep at plan time: `rg -n 'device sink|/dev/null' skills/ packages/pi-agentic-workflow/src
packages/pi-agentic-workflow/README.md` names no prose that currently promises a
device sink is judged by containment — the contract's sentence is the one that
must gain the exception, and the README's path-protection section describes the
Tier 2 `write`/`edit` guard only (never the #567 shell surface — recorded below).

## Surfaces

- `packages/pi-agentic-workflow`
- `skills/orchestration-envelope`
- `docs`

## Retirements

Nothing is retired. The carve-out adds one module-internal predicate and one
`continue` in the existing target loop: no exported name, command, flag, config
key or doc section is superseded, and the literal operands keep flowing out of
`analyzeShellWrite` unchanged. Pin: `rg -c 'DEVICE_SINKS' packages/pi-agentic-workflow/src`
is 0 at the cut head (`b25ef8a9`) and 2 after the change (the declaration and
its one caller) — an added internal token, never a second public surface.
Inventory receipt: `bun scripts/residual-classify.mjs --inventory --base b25ef8a9`
is the diff-derived manifest, recorded in `## Log`.

## Non-goals

- **No analyzer change.** `analyzeShellWrite` keeps reporting `/dev/null` as the
  literal operand the command wrote; S2 puts the carve-out in `decideShellWrite`.
  The analysis layer answers "what the text exposes", the verdict answers "is it
  a durable target" — merging the two would hide the operand from every future
  consumer.
- **No wider special-file carve-out.** Only the set S2 names is skipped. A write
  to `/dev/random`, `/dev/shm/…` or an arbitrary character device still gets the
  containment verdict; widening the set is a new ask, not an implication.
- **No change to the rest of the verdict.** The temp-root carve-out, the in-root
  Tier 2 hand-off, the headless block / interactive ask posture and the
  dynamic-target boundary keep their order and behaviour.
- **No README repair.** The path-protection section predates #567 and never
  described the shell surface; it is recorded as a known pre-existing gap, not
  reopened here.

## Risk tier

Verdict copied verbatim from `agentic-workflow ceremony tier classify` over the
planned paths (`contract: risk-tier-verdict@1`):

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit (`signals: []`)
- **Reason** — `executable-content`: 2 planned paths carry executable content

## Future

none

## Future cost

- **The device set has one home.** A sink added later lands in `DEVICE_SINKS`
  (or the `/dev/fd/` prefix) and in the suite's named-set case in the same
  change; the analyzer's literal reporting stays untouched. Binds whoever next
  adds a sink to the carve-out.

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` —
  the three reproducers, the named set, the mixed command and every pre-existing
  guard case.
- `node scripts/run-root-suite.mjs` — the whole deterministic gate.
- `bun scripts/docs-generate.mjs --check` — the projection is a fixed point.

## Known pre-existing issues

- **`packages/pi-agentic-workflow/README.md`'s path-protection section still
  describes only the structured `write`/`edit` guard** (#567 shipped its
  statement in the turn contract, never here) — *does not affect* this unit:
  the shell surface's declared prose is the contract paragraph, which this
  change updates; the README gap is a separate unit's decision.
- **`/dev/stdin`, `/dev/stdout` and `/dev/stderr` are symlinks into
  `/proc/self/fd/…` that the fail-closed resolver cannot canonicalize for a
  non-tty caller** — *affects* this unit: it is why S2 orders the skip before
  resolution, and it is the failure the `F3` case pins (`PE-003`).

## Acceptance criteria

- **AC-S1** — A command whose only write targets are device sinks passes both
  postures: headless returns `block: false` and an interactive session asks no
  question. A command that also carries a durable out-of-root target still
  blocks headless and still asks interactively once, naming the durable path,
  never a sink. Check: `cd packages/pi-agentic-workflow && bun test
  test/shell-write-guard.test.mjs` exits 0 (cases `F1`, `F2`, `F3`, `F4`, `F5`).
- **AC-S2** — Every sink named by S2 is skipped, `/dev/fd/<n>` included, and the
  skip happens before resolution: the injected `resolveTarget` is never called
  for a device sink, so the `/proc/self/fd/…` resolution cannot block. A path
  that merely starts with a sink's name (`/dev/nullx`) or a relative `dev/null`
  is still judged, and `analyzeShellWrite` still reports the operand. Check:
  `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs`
  exits 0 (cases `F6`, `F7`, `F8`).

## Tasks

- P1 — Freeze the device-sink reproducers as failing cases in the shell write
  guard suite (validator: `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 1 on the new cases at the cut head)
  (Implements: S1, S2)
  - Relevant files: packages/pi-agentic-workflow/test/shell-write-guard.test.mjs
- P2 — Skip the named device set on the lexical absolute path before the target
  is resolved, inside `decideShellWrite` (validator: `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 with every case green)
  (Implements: S1, S2)
  - Relevant files: packages/pi-agentic-workflow/src/guards/shell-path.ts
- P3 — State the device-sink carve-out on the guard's declared contract surface
  (validator: `rg -n 'device sink' skills/orchestration-envelope/references/TURN_CONTRACT.md` matches 1)
  (Implements: S1, S2)
  - Relevant files: skills/orchestration-envelope/references/TURN_CONTRACT.md
- P4 — Verification: the package suite, the root gate and the docs projection
  fixed point (validator: `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2)

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order (owner: `skills/pre-execution-review/references/LEDGERS.md`). Measured at
the cut head `b25ef8a9`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | The three reproducers fire exactly as the issue states at the cut head: headless `bun run build > /dev/null 2>&1` blocks with `"/dev/null" resolves outside the project root`, interactive asks once, and `> /dev/stdout 2>/dev/stderr` blocks with `could not be resolved (ENOENT: /proc/self/fd/1)` | `/tmp` probe driving the cut head's `dist/guards/shell-path.js` with the suite's injected deps | measured 2026-11-17 (this session) | O1–O5; AC-S1 |
| PE-002 | committed-source | `analyzeShellWrite` pushes every literal redirect operand whose text looks path-like (`/` present), so a device sink reaches `decideShellWrite`'s containment loop exactly like a durable path; `2>&1` never does, because `&1` fails `looksLikePath` | `packages/pi-agentic-workflow/src/guards/shell-path.ts:82-100,204,216` | read 2026-11-17 (this session) | O1, O6; D1 |
| PE-003 | measured-run | `/dev/stdin`, `/dev/stdout` and `/dev/stderr` are symlinks to `/proc/self/fd/0-2`, `/dev/fd` is a symlink to `/proc/self/fd`, and `/dev/null`, `/dev/zero`, `/dev/full`, `/dev/tty` are character devices — so the fail-closed resolver, not containment, is what refuses the `std*` forms | `readlink /dev/stdout` → `/proc/self/fd/1`; `stat -c '%t:%T' /dev/null` → `1:3` (char), same for zero/full and `5:0` for tty | measured 2026-11-17 (this session) | O5, O6; S2's "before resolution" |
| PE-004 | measured-run | A device sink is never durable storage: `printf 'xxxxxxxx' > /dev/null` leaves the node at size 0 | `printf 'xxxxxxxx' > /dev/null; stat -c %s /dev/null` → `0` | measured 2026-11-17 (this session) | O1; S1's premise |
| PE-005 | committed-source | `decideShellWrite` resolves each target first and judges containment after, so a skip placed after resolution cannot fix `/dev/std*`; the skip must sit between the lexical absolute path and `resolveTarget` | `packages/pi-agentic-workflow/src/guards/shell-path.ts:391-402` | read 2026-11-17 (this session) | O5; D2 |
| PE-006 | measured-run | The suite carries 21 cases at the cut head and they all pass — the regression baseline this change must leave green | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` → `21 pass, 0 fail` | measured 2026-11-17 (this session) | O7 |
| PE-007 | committed-source | The shell guard's only declared prose is the #567 paragraph in the turn contract (one match); the package README's path-protection section describes the Tier 2 structured-tool guard and names no shell surface | `rg -n 'shell-bound writes' skills/orchestration-envelope/references/TURN_CONTRACT.md` → 1 match at line 188; `rg -c 'The Tier 2 preventive guard blocks' packages/pi-agentic-workflow/README.md` → 1 | read 2026-11-17 (this session) | O8; the README known-issue row |
| PE-008 | committed-source | The extension's `resolveTarget` is `resolveRealTarget` (fail-closed on resolution errors) and the handler passes `interactive: ctx.hasUI === true`, so a headless session blocks an unresolvable target instead of asking — the posture the mixed-command case re-asserts | `packages/pi-agentic-workflow/src/extension/index.ts:223-250,531-548` | read 2026-11-17 (this session) | O1, O3, O5 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the 9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`. IDs `O1`–`O9`; every row is
`planned` at cut time and `verified` only against a foreground validator run.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 · AC-S1 · PE-001/PE-004/PE-008 | Headless, a command whose only write targets are device sinks does not block — the issue's `bun run build > /dev/null 2>&1` reproducer | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (case `F1`, headless) | `E` line naming `F1` and its assertion | verified — E3 line (30 pass, 0 fail; `F1` and its shipped-layer twin `F9` green) |
| O2 | S1 · AC-S1 · PE-001 | Interactive, a command whose only write targets are device sinks asks no question — the `> /dev/null 2>&1` and `> /dev/stdout 2>/dev/stderr` reproducers, the live prompt the issue reports | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (cases `F2`, `F3`: zero `confirm` calls) | `E` line naming `F2`/`F3` and the prompt count | verified — E3 line (30 pass; `F2`/`F3` assert zero prompts) |
| O3 | S1 · AC-S1 · PE-008 | A real durable out-of-root target in the same command still blocks headless and still asks once interactively, and the reason names the durable path, never the sink | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (cases `F4`, `F5`) | `E` line naming `F4`/`F5` | verified — E3 line (`F4` blocks naming `/home/person/durable.md`; `F5` one prompt) |
| O4 | S2 · AC-S2 | Every sink S2 names is skipped: `/dev/null`, `/dev/zero`, `/dev/full`, `/dev/stdin`, `/dev/stdout`, `/dev/stderr`, `/dev/tty` and `/dev/fd/<n>` | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (case `F6` over the eight names) | `E` line naming `F6` and the eight names | verified — E3 line (`F6` covers all eight) |
| O5 | S2 · AC-S2 · PE-003/PE-005 | The skip runs before resolution: the injected `resolveTarget` is never called for a device sink, so `/dev/std*`'s `/proc/self/fd/…` form cannot block | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (case `F7`: resolver call count 0 and a throw-on-call resolver still passes) | `E` line naming `F7` | verified — E3 line (`F7`: 0 resolver calls, throwing resolver unreached) |
| O6 | S2 · AC-S2 · PE-002 · D3 | The carve-out is exact, never a prefix on the raw text: a relative `dev/null`, the bare `/dev/fd` and `/dev/nullx` are still judged, a spelling that lexically resolves to a named sink (`/dev/null/`, `//dev/null`) is that sink under D3 rather than a lookalike, and `analyzeShellWrite` still reports the operand | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (case `F8`) | `E` line naming `F8` | verified — E3 line (`F8`: three non-sink forms still block, analysis unchanged) + E10 line (F8 pin: normalized sink spellings skip before resolution) |
| O7 | regression scope · PE-006 | Every pre-existing guard behaviour is unchanged: the 21 cut-head cases (containment, temp carve-out, Tier 2, tilde, script scan, receipt/git ordering) still pass | P4 | P4 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` exits 0 (all cut-head cases present, unchanged) | `E` line with the run's pass count and `0 fail` | verified — E3 line (30 pass = 21 cut-head + 9 new) |
| O8 | S1 · S2 · PE-007 | The guard's declared contract surface states the carve-out, so the contract stops implying a device sink is a durable out-of-root target | P3 | P3 | direct application (this session) | `rg -n 'device sink' skills/orchestration-envelope/references/TURN_CONTRACT.md` matches 1 | `E` line with the command and its match | verified — E4 line (1 match at TURN_CONTRACT.md:188) |
| O9 | S1 · S2 | The whole deterministic gate passes with the change in place, and the docs projection is a fixed point | P4 | P4 | direct application (this session) | `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0 | `E` lines with both verdicts | verified — E7/E8 lines (root gate 116/116 exit 0, `--jobs 1`; projection + docs checks exit 0) |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the issue, verbatim (elided only where the body repeats
  its own reproduction and fix sketch — both quoted in full in `## Specs` and
  `## Applicable tests` — and its automated-signature footer, marked `[…]`):
  ````
  ## Summary

  The shell write guard (issue #567's surface) treats virtual device sinks as durable out-of-root write targets and prompts (or blocks headless) on every command that silences its output. In a UI session this fires the `path protection` approval prompt with a 3-minute auto-cancel; in headless it blocks the call outright.

  ## Reproduction

  From a session rooted at a worktree (any root works — device nodes never live under a project):

  ```text
  bun run build > /dev/null 2>&1
  → path protection: "/dev/null" resolves outside the project root (...). Allow this bash write?

  gh pr view 604 --json body -q .body > body.md 2>/dev/null
  → prompt for "/dev/null" even though the durable target (body.md) is in-root

  bun run build > /dev/stdout 2>/dev/stderr
  → two prompts: "/dev/stdout" and "/dev/stderr"
  ```

  Observed live in the `feat-590-product-audit-extensibility` sessions, where nearly every bash call ends in `2>/dev/null` — the guard made ordinary investigation unusable.

  ## Root cause

  `analyzeShellWrite` correctly exposes `/dev/null` (etc.) as literal redirect operands, and `decideShellWrite` judges every target by containment. Device sinks resolve outside any project root by construction, so containment always fails. `2>&1`-style fd duplicates already pass (`looksLikePath` filters `&1`); the device paths are the remaining false-positive class.

  ## Expected

  Writes to virtual device sinks are discarded or routed to streams the session already owns — never durable storage — so the containment verdict must skip them: no prompt in a UI session, no block headless. A real out-of-root durable target in the same command still blocks.

  ## Fix sketch

  A device-sink carve-out in `decideShellWrite` (skip before resolution — `/dev/std*` resolve through `/proc/self/fd/…` and resolve weirdly): `/dev/null`, `/dev/zero`, `/dev/full`, `/dev/stdin`, `/dev/stdout`, `/dev/stderr`, `/dev/tty`, `/dev/fd/*`.

  ## Dependencies

  None.

  […]
  ````
- **D1** — 2026-11-17, S2's placement: the carve-out lives in `decideShellWrite`,
  not in `analyzeShellWrite`, so the analysis layer keeps reporting the literal
  operand it exposes (`PE-002`) and the verdict owns the durability judgement.
- **D2** — 2026-11-17, S2's ordering: the match runs on the lexical absolute
  path, before `resolveTarget`. The `std*` names are `/proc/self/fd/…` symlinks
  the fail-closed resolver refuses (`PE-003`, `PE-005`), so a post-resolution
  skip could not repair the issue's third reproducer.
- **D3** — 2026-11-17, the matching rule: the named set plus the `/dev/fd/`
  prefix, compared for exact equality after the lexical `resolve` — no prefix,
  glob or basename matching, so `/dev/nullx` and a relative `dev/null` stay
  judged (O6).
- **E1** — 2026-11-17, the frozen-failure corpus at the cut head, observed red
  before any implementation: a `/tmp` probe over the shipped `decideShellWrite`
  printed `bun run build > /dev/null 2>&1` → `block:true` headless and 1 prompt
  interactive, `> /dev/stdout 2>/dev/stderr` → `block:true`
  (`could not be resolved (ENOENT: /proc/self/fd/1)`), `/dev/tty`, `/dev/zero`
  and `/dev/fd/3` → 1 prompt each, and `> /dev/null 2>/home/person/durable.md` →
  2 prompts (the sink's included). Scratch removed after the run.
- **P1** — 2026-11-17, the nine reproducer cases frozen as failing tests (`F1`–`F9`),
  with the cut-head suite as the regression baseline · `a2a3eb14`.
- **E2** — 2026-11-17, `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs`
  at `a2a3eb14` · exit 1 · `30 tests: 22 pass, 8 fail` — the eight new cases red,
  `F8` (the exactness invariant) already green.
- **P2** — 2026-11-17, `decideShellWrite` skips the named device set on the
  lexically normalized absolute path before `resolveTarget`, the contract
  paragraph states the carve-out, and the release intent lands · `c5231663`.
- **E3** — 2026-11-17, `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs`
  at `c5231663` · exit 0 · `30 pass, 0 fail` (21 cut-head cases unchanged + the
  nine new ones).
- **E4** — 2026-11-17, `rg -n 'device sink' skills/orchestration-envelope/references/TURN_CONTRACT.md`
  · exit 0 · 1 match (`TURN_CONTRACT.md:188`).
- **E5** — 2026-11-17, the differential: the same 12-command corpus judged on
  the base `b25ef8a9` copy (`bun build` of the checked-out source) and on the
  change, three readings each (`block` headless, `block` interactive, prompt
  count) · exit 0 · the only differing rows are the four carrying a device sink
  (`> /dev/null 2>&1` `true`→`false`, the `gh … > body.md 2>/dev/null` row
  `true`→`false`, the `/dev/stdout`/`/dev/stderr` row `true`→`false`, the mixed
  row 2 prompts→1); the eight other rows are byte-identical, and the mixed row
  still blocks naming the durable target. Scratch removed after the run.
- **E6** — 2026-11-17, `cd packages/pi-agentic-workflow && bun run test` ·
  exit 0 · `956 pass, 0 fail` across 84 files (the package gate: bundle, `tsc`,
  every suite).
- **E7** — 2026-11-17, `node scripts/run-root-suite.mjs --jobs 1` · exit 0 ·
  `116/116 PASS`. Disclosed: the default 4-worker run hit a **suite timeout on
  the untouched `scripts/phase-lint.test.mjs`** (120 s bound) under this box's
  concurrent load (load average 9.6 on 6 CPUs); the same suite standalone is
  `node --test scripts/phase-lint.test.mjs` → exit 0, `162 pass`, 72–89 s, and
  `bun test scripts/phase-lint.test.mjs` → exit 0, `162 pass`, 49 s. The
  serialized gate run is the green receipt.
- **E8** — 2026-11-17, the docs and prose checks · all exit 0 ·
  `bun scripts/docs-generate.mjs --check` → `PASS` (3 files, 0 stale, roadmap
  unchanged); `bun scripts/skill-lint.mjs` → `PASS` (104 files, 0 findings);
  `bun scripts/promise-coherence.mjs` → `PASS` (42 checked · 23 skipped);
  `bun scripts/check-skill-context.mjs` → `PASS context budgets: 30 skills`
  (`TURN_CONTRACT.md` estimate 3016 ≤ 3020, trimmed to fit the declared ceiling
  rather than raising it); `agentic-workflow phase-lint
  docs/fix/606-shell-guard-device-sinks/SPEC.md` → `verdict PASS`.
- **E9** — 2026-11-17, `bun scripts/residual-classify.mjs --inventory --base b25ef8a9`
  · exit 0 · `rows: []` — the carve-out adds no manifest surface, matching
  `## Retirements`.
- **D4** — 2026-11-17, external-verify A1 reconciliation (correction batch 1): O6's
  use-case text named "a trailing-slash form … still judged", which no validator
  covered and which contradicts D3 — `path.resolve` normalizes the spelling before
  the exact-equality compare, and bash itself refuses `> /dev/null/` (`Is a
  directory`). The guard's behaviour is kept (D3-correct; `//dev/null` is a working
  discard redirect S1 says must pass), the O6 text now states the tested forms plus
  the normalization clause, and F8 gains the pin for it.
- **E10** — 2026-11-17, correction batch 1 for external-verify A1 · red before the
  edit: the O6 claim check (`bun /tmp/aw606-fix/redcheck.mjs docs/fix/606-shell-guard-device-sinks/SPEC.md`)
  → exit 1 (`O6 still asserts the trailing-slash form is judged`), with the probe
  showing `/dev/null/` and `//dev/null` → `block:false`, 0 resolver calls at head
  while the base copy judges both · green after: the same check → exit 0,
  `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` → exit 0 ·
  `30 pass, 0 fail` (F8 pin), `cd packages/pi-agentic-workflow && bun run test` →
  exit 0 · `956 pass, 0 fail`, `bun scripts/test-impact.mjs --base 34211721` →
  `targeted`, `node scripts/run-root-suite.mjs` → exit 0 · `116/116 PASS`,
  `phase-lint docs/fix/606-shell-guard-device-sinks/SPEC.md` → `verdict PASS`,
  `bun scripts/docs-generate.mjs --check` → PASS, `bun scripts/promise-coherence.mjs`
  → PASS (42 checked · 23 skipped).

## Next

The owner's external verify, then the merge.

## References

Issue [#606](https://github.com/gtrabanco/agentic-workflow/issues/606); PR
[#608](https://github.com/gtrabanco/agentic-workflow/pull/608) (`Closes #606`).
The #567 unit (`docs/fix/567-path-protection-bypass/`) owns the guard this unit
repairs.

## Branch

`fix/606-shell-guard-device-sinks`

## Depends on

none

## Regression scope

| Scenario | Verifier |
|---|---|
| A durable out-of-root redirect still blocks headless and still asks with UI | `shell-write-guard.test.mjs` cut-head cases + `F4`/`F5` |
| An existing protected in-root target still hands off to Tier 2 | `shell-write-guard.test.mjs` cut-head case |
| OS-temp scratch still passes, and an unresolvable durable target still fails closed | `shell-write-guard.test.mjs` cut-head cases |
| Tilde expansion, script scanning and the read-only/dynamic boundary are unchanged | `shell-write-guard.test.mjs` cut-head cases |
| The receipt and git-identity guards still lead for their own cases | `shell-write-guard.test.mjs` cut-head end-to-end case |