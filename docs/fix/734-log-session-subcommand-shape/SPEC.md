---
type: fix
scope: small
ac-hash: a6f6fccb3f4f15b116eab9eadfd8f48e78a75bcbf9ebe7f200196a316afcaf72
roadmap_summary: Issue [#734](https://github.com/gtrabanco/agentic-workflow/issues/734) (S): the `/log-session` hand-off rendered `"subcommand"` as the service **and** its operation in one spaced string (`"journal write"`), and the runner door forwards that field as one argv token, so the crate resolved a service with a space and refused — the directive now renders the service alone with the operation in `args`, the two-field shape is pinned in `runner-mapping@1`, and an executable case runs the rendered call against the crate in a fixture.
---

# fix/734-log-session-subcommand-shape

> One-line: the machine hand-off `/log-session` builds is now a call the machine it
> names can execute — service in `subcommand`, operation first in `args` — and a
> case proves it by running the rendered bytes against the crate.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
```

## Issue

[#734](https://github.com/gtrabanco/agentic-workflow/issues/734) — a `/log-session`
hand-off that names a tool cannot be executed by that tool. The PR closes it via
`Closes #734`. Applied through the owner's local, unpublished workflow: the
ledgers below are frozen at cut, the change is worked inline, and the owner is
the external verifier (`## Log` L2, D1).

**Starting state, disclosed.** The branch `fix/734-log-session-subcommand-shape`
already carried commit `a494681e5` ("use contract-conforming subcommand shape in
log-session hand-off") when this unit was cut, plus two defects that commit
introduced: a hand version bump on two of the four packages (breaking the one
train) and a hand-written, malformed `CHANGELOG.md` row. The unit completes the
fix with the ledgers it never had (`## Log` L4, D3) and repairs that state; it
neither hides the ordering nor rewrites the commit.

## Specs

`S1` is the operator's order; `S2`–`S11` quote the issue's own words, which that
order adopts as the work.

**S1 — the order: apply #734 to this repository, inline.**
> Apply to this repository: issue #734

**S2 — the defect: the hand-off ships service and operation as one token.**
> The `/log-session` extension hand-off renders an `agentic_workflow_run` call whose `subcommand` field carries **service and operation in one string** (`"journal write"`), but the runner door forwards `subcommand` as **one argv token**, so the crate resolves a service literally named `journal write` and refuses: `Unknown service: journal write`. The machine-recorded hand-off that a deferred tool is ordered to execute verbatim is not executable by the tool it names — the same class of machine-to-molecule seam #678 fixed for the `execute(params, cwd)` signature, one layer up.

**S3 — the verified state table the issue files.**
> | Fact | Evidence |
> | --- | --- |
> | The log-session hand-off renders service+operation in one `subcommand` string | `log-session-invocation.js:297` → `agentic_workflow_run { "subcommand": "journal write", "args": ["--kind", "narrative", …] }` |
> | The runner door forwards `subcommand` as a single token | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` (compiled `dist/extension/workflow-tools.js:608`): `doSpawn(await launchRequest(cwd, [subcommand, ...forwarded], …))` |
> | The crate resolves that token as the service name and refuses | live call `tools.agentic_workflow_run({ "subcommand": "journal write", … })` in this session → stderr `EDIT REFUSAL — Unknown service: journal write — this install is @gtrabanco/agentic-workflow@5.0.0-canary.20261125.1 … Did you mean: journal-corpus, journal?` (exit 2) |
> | The contract-conforming form works first-try | same session: `{ "subcommand": "journal", "args": ["write", "--kind", "narrative", …] }` → exit 0, fragment `20261126T205310Z-…-narrative-…md` written (2025 bytes) |
> | The session-close door has the same shape | `log-session-invocation.js:310` renders `"subcommand": "… close"` (writer command + op in one string) |
> | `runner-mapping@1` does not pin the two-field shape | the block says "`runner <subcommand>` is the `agentic_workflow_run` tool" and defers arity to the door; it never states `subcommand` = service only, ops live in `args` |

**S4 — the reproduction and its expected result.**
> 1. Open a project with the fragment carrier opted in (`.agentic-workflow/journal/`).
> 2. Run `/log-session`; the extension renders `agentic_workflow_run { "subcommand": "journal write", … }`.
> 3. Execute exactly that call through the deferred tool.
> 4. Observed: exit 2, `Unknown service: journal write`. Expected: exit 0, a new fragment.

**S5 — the recommended route: the emitter learns the door's contract.**
> - **(a) Recommended — the emitter learns the door's contract.** `log-session-invocation` renders `"subcommand": "journal"` with `"args": ["write", …]` (and `"subcommand": "session-close"`, `"args": ["close"]`). The machine hand-off then speaks the contract of the machine that must execute it, and no second call shape is created. Verified in this session that (a) works end-to-end (exit 0 above).

**S6 — the rejected route: the door learns the shorthand.**
> - **(b) The door learns the emitter's shorthand.** `agentic_workflow_run` splits a spaced `subcommand` on its first space. Rejected here because it creates **two valid forms for the same call forever** — a surface ambiguity the repo's IR11 (one owner per vocabulary) exists to prevent.

**S7 — side effect to check: the attribution seam and telemetry consumers.**
> - The attribution seam (`onRunnerCommand(subcommand, args)`, `workflow-tools.ts:603`) and any timeline/telemetry consumer that records `subcommand` as one string would see a different token on path (a) — check `unitFromCommand`/`phaseFromCommand` matching and the session-telemetry sample shape.

**S8 — side effect to check: every other surface that shows a call body.**
> - Every other skill's `runner-mapping@1` citations and any prose that shows `agentic_workflow_run` bodies (log-session, log-session-command test, README sections) would need the same sweep in one PR.

**S9 — side effect to check: version skew between the installed pi and the skills train.**
> - Version skew is live today: the installed pi canary (5.0.0-canary.20261121.x/25.x) vs. the skills train — whatever lands must either ship both sides in one release or tolerate the old emitter, and that trade is the maintainer's call.

**S10 — the pin the issue asks for.**
> - #678's suite (`receipt-guard`, deferred-tools ordering tests) is the natural home for a pin: render the invocation and execute it against the crate in a fixture (the golden-fixture pattern), so this seam can never drift silently again.

**S11 — the decision the issue reserves for the owner.**
> Decision requested from the maintainer: **is (a) wanted?** (a) is the recommendation because it eliminates the ambiguity instead of encoding it in the door; (b) is viable only if the two-forms cost is accepted. Triage should verify the evidence table, run the side-effect sweep, and a decision on implementation belongs to the owner before anything is planned — happy to hand the reproduction transcript or draft the SPEC when the route is chosen.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it. Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256.

- **AC-S1** — the order is applied inline against these ledgers: `git log
  --oneline main..HEAD` carries this unit's conventional commits only, and no
  review pack, fold cycle or self-granted gate exception ran (`## Log` L2/D1).
- **AC-S2, AC-S3** — the defect closes on both render sites: the directive
  renders `"subcommand": "journal"` with `"args": ["write", …]` and
  `"subcommand": "session-close"` with `"args": ["close"]`, never a spaced
  service+operation. Check: `bun test
  packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0
  with the two shape cases green, and `rg -n '"subcommand": "(?:journal write|session-close close)"'
  packages/pi-agentic-workflow/src` matches nothing.
- **AC-S4** — the issue's reproduction now ends in `exit 0` and a fragment: the
  rendered call is parsed out of the directive and executed against the crate in
  a fragment-carrier fixture, and exactly one fragment lands. Check: the
  executable case in the same suite; the base bytes are red with `Unknown
  service: journal write` (`## Log` E3, E6).
- **AC-S5** — the implemented route is (a): the emitter renders the door's
  contract; no new call shape exists. Check: the two shape cases plus
  `git diff f1b04a3a9 -- packages/pi-agentic-workflow/src/log-session-invocation.ts`
  touching only the two rendered templates.
- **AC-S6** — route (b) is not encoded: the door still forwards `subcommand` as
  one token. Check: `git diff f1b04a3a9 -- packages/pi-agentic-workflow/src/extension/workflow-tools.ts`
  is empty and `rg -n 'subcommand[^\\n]*\\.split\\(' packages/pi-agentic-workflow/src`
  matches nothing.
- **AC-S7** — the attribution seam is unchanged in effect: `journal` and
  `session-close` are neither a `UNIT_COMMANDS` member nor a `PHASE_LABELS`
  member, so the token the seam hears attributes nothing either way. Check:
  `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs`
  exits 0 and `rg -n '"journal write"' packages/pi-agentic-workflow/src`
  matches nothing.
- **AC-S8** — the sweep is done in one change: no render surface composes a
  spaced `subcommand`, the contract pins the shape where a session reads it, and
  the package README states it. Check:
  `rg -n '"subcommand": "(?:journal write|session-close close)' packages/*/src skills template`
  matches nothing (the render surface; the unit doc and the journal quote the
  defect as history, never as a call), and
  `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs`
  exits 0 with the shape case green.
- **AC-S9** — one release carries both sides: the emitter and the door live in
  `@gtrabanco/pi-agentic-workflow`, and the crate's only edit is its
  cross-package test pin, so the changeset declares both packages and the train
  stays aligned. Check: `bun scripts/version-parity-gate.mjs --content` exits 0
  and every `packages/*/package.json` reads `4.10.1`.
- **AC-S10** — the pin exists and is executable: the rendered invocation is run
  against the crate in a fixture, so the seam cannot drift silently. Check: the
  executable case is green now and red on `f1b04a3a9`'s bytes (`## Log` E3).
- **AC-S11** — the owner's decision is recorded and the implemented route is the
  one the issue recommends. Check: `decisions.md` D1 names route (a), and no
  surface implements (b) (AC-S6).

## Impact

- **`packages/pi-agentic-workflow/src/log-session-invocation.ts`** — the two
  rendered call bodies (the write at `:377`, the close at `:392`). Every session
  that runs `/log-session` reads these bytes; the crate executes them.
- **`skills/runner-contract/references/RUNNER.md`** — the `runner-mapping@1`
  block gains the shape rule. It is the block's one owner: the bundler splices it
  into every staged `SKILL.md` that cites the symbolic form, so the injected
  advice and this file cannot disagree.
- **`packages/pi-agentic-workflow/README.md`** — the `/log-session` code door's
  section states the shape the directive hands over.
- **The suites** — `packages/pi-agentic-workflow/test/log-session-invocation.test.mjs`
  gains the executable pin (the seam's only mechanical guard) and
  `packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` gains the
  contract-shape case; every pre-existing assertion stays. The crate's
  `packages/agentic-workflow/test/journal.write.test.mjs` carried a cross-package
  pin on the literal spaced phrase (`/journal write/`) — the phrase the fix
  removes — so the pin is re-bound to both halves of the door's shape, a
  stronger assertion, never a relaxed one (D8).
- **State** — the unit doc and ledgers, the `## Fixes` row through the crate's
  writer, the regenerated projection, the changeset, the journal fragment.
- **Ask before touching:** nothing live. The installed canary emits the old
  shape until the next pi release ships this package; the crate is unchanged, so
  an old emitter plus a new crate fails the same way it always did and a new
  emitter plus an old crate is already the working form (`## Log` E2).

## Surfaces

- `packages/pi-agentic-workflow`
- `skills/runner-contract`
- `docs`

## Retirements

Nothing is removed. The shorthand `"subcommand": "journal write"` retires as a
rendering — it was never a valid call, only a refused one. Its absence is
counted, not promised: `rg -c '"journal write"' packages/pi-agentic-workflow/src`
→ `0`, and the executable case would turn red the day it returns.

## Non-goals

- No split of a spaced `subcommand` in the door (S6, IR11).
- No crate behaviour change: the editor's service/op grammar (`journal write`,
  `session-close close`) is the CLI's argv contract and is untouched; only the
  tool-call body that must speak it changes (S9). The crate's one edit is its
  cross-package test pin, declared by the changeset.
- No migration for an installed canary still emitting the old shape (S9): the
  next pi release ships both sides from one package.
- No new gate, no new config key.

## Risk tier

Computed, never chosen — `bun packages/agentic-workflow/bin/agentic-workflow.mjs
ceremony tier classify --paths <the unit's paths>`, verbatim:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "3 path(s) carry executable content: packages/pi-agentic-workflow/src/log-session-invocation.ts, packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs",
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

## Future cost

- A third rendered call body in the emitter costs one more parse-and-execute
  case: the pin reads the directive, so a call shape that does not match the
  door's contract fails the suite instead of a session.
- The block's ceiling (`RUNNER_MAPPING_ESTIMATE_MAX = 132` est) is measured, not
  assumed: the shape rule is worded inside it (`## Log` E8). A further rule is a
  contract change and re-measures the ceiling with its reason.

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` —
  the executable pin (write and close call shapes).
- `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` —
  the block's shape rule, its byte parity and its ceiling.
- `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` —
  the seam the issue asks to check.
- `bun run --cwd packages/pi-agentic-workflow test` — the package gate (bundle,
  `tsc`, the whole suite).
- `bun scripts/version-parity-gate.mjs --content`, `bun scripts/lint-changeset.mjs
  .changeset/734-log-session-subcommand-shape.md`, `bun scripts/docs-generate.mjs
  --check`, `bun scripts/check-skill-context.mjs` — the state gates.
- `bun scripts/run-root-suite.mjs` — the root gate.

## Known pre-existing issues

- **The installed canary emits the old shape** — `does-not-affect` this unit's
  acceptance: the change ships from this package's next release and the crate's
  grammar already accepts the new form (E2). The temporary skew is S9's trade,
  and the owner's call.
- **`docs/LOGS.md` is written by the merge-time aggregator, never locally** —
  `does-not-affect`: this unit writes a journal fragment, which is the sanctioned
  local writer.

## Tasks

- P1 — cut this unit doc, its embedded ledgers and the decisions record
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/734-log-session-subcommand-shape/SPEC.md --no-git` exits 0)
  (Implements: S1, S11)
  - Relevant files: docs/fix/734-log-session-subcommand-shape/SPEC.md, docs/fix/734-log-session-subcommand-shape/decisions.md
- P2 — repair the state the prior commit broke: the two hand version bumps and
  the hand `CHANGELOG.md` row leave, the changeset is the one release intent
  (validator: `bun scripts/version-parity-gate.mjs --content` exits 0 and `git diff f1b04a3a9 -- packages/*/package.json CHANGELOG.md` is empty)
  (Implements: S9)
  - Relevant files: packages/agentic-workflow/package.json, packages/pi-agentic-workflow/package.json, CHANGELOG.md, .changeset/734-log-session-subcommand-shape.md
- P3 — RED: the executable pin (parse the rendered call, execute it against the
  crate in a fixture) and the contract-shape case land and are observed failing
  against the cut base (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits non-zero in the `f1b04a3a9` scratch copy, naming the rendered call)
  (Implements: S4, S10)
  - Relevant files: packages/pi-agentic-workflow/test/log-session-invocation.test.mjs, packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs
- P4 — GREEN: the emitter's two call bodies speak the door's contract, the
  `runner-mapping@1` block pins the shape, and the package README states it
  (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0 and `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0)
  (Implements: S2, S3, S5, S8)
  - Relevant files: packages/pi-agentic-workflow/src/log-session-invocation.ts, skills/runner-contract/references/RUNNER.md, packages/pi-agentic-workflow/README.md
- P5 — state: the `## Fixes` row through the crate's writer, the regenerated
  projection, the session entry as a narrative journal fragment (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1)
  - Relevant files: docs/ROADMAP.md, docs/generated/, .agentic-workflow/journal/
- P6 — verification: the package suite under both runtimes, the side-effect
  sweep and the root gate; every obligation row closed (validator: `bun run --cwd packages/pi-agentic-workflow test` exits 0)
  (Implements: S7, S9, S11)
  - Relevant files: docs/fix/734-log-session-subcommand-shape/SPEC.md

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order (owner: `skills/pre-execution-review/references/LEDGERS.md`). Measured at
the cut head `a494681e5` (base `f1b04a3a9`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | committed-source | The runner door forwards `subcommand` as one argv token and every `args` entry as its own token, so a spaced service name can never resolve | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:767` (`launchRequest(cwd, [subcommand, ...forwarded], …)`) | read 2026-11-27 (this session) | O1, O2, O3; AC-S2, AC-S6 |
| PE-002 | committed-source | The crate resolves the first argv token as the service (`Unknown service: <token>` names it) and the editor's `journal` service takes `write` as its first operation, while `session-close` is a runner subcommand whose first argument is `render` or `close` | `packages/agentic-workflow/bin/agentic-workflow.mjs:1433` (`case "journal"`), `:2149` (the refusal), `packages/agentic-workflow/src/session-close/index.mjs:382` | read 2026-11-27 (this session) | O1, O2; AC-S4 |
| PE-003 | measured-run | The issue's reproducer is live-shaped at this crate: one spaced token exits 2 with `EDIT REFUSAL — Unknown service: journal write`, the contract-conforming call exits 0 and writes one fragment | `/tmp/aw734probe` (this session), crate `bin/agentic-workflow.mjs` | measured 2026-11-27 (this session) | O1, O2; AC-S4 |
| PE-004 | committed-source | The emitter renders exactly two call bodies — the narrative write and the close — and both are the sites the issue names | `packages/pi-agentic-workflow/src/log-session-invocation.ts:377`, `:392` | read 2026-11-27 (this session) | O1, O2, O5; AC-S5 |
| PE-005 | committed-source | The attribution seam sees the new token and attributes nothing: `journal` is not a `UNIT_COMMANDS` member and neither token is a `PHASE_LABELS` member, so `unitFromCommand`/`phaseFromCommand` answer `null` before and after | `packages/pi-agentic-workflow/src/session-telemetry.ts:204` (`phaseFromCommand`), `:361` (`UNIT_COMMANDS`), `:372` (`unitFromCommand`) | read 2026-11-27 (this session) | O4; AC-S7 |
| PE-006 | committed-source | `runner-mapping@1` states the tool, the discovery path and the outside-pi pointer, and pinned no arity rule at the cut; the block's declared ceiling is 132 est against 120 measured before the rule and 125 after it, so the rule fits without re-pinning | `skills/runner-contract/references/RUNNER.md:128`; `packages/pi-agentic-workflow/scripts/bundle-skills.mjs:66` (`RUNNER_MAPPING_ESTIMATE_MAX`) | measured 2026-11-27 (this session) | O5; AC-S8 |
| PE-007 | measured-run | The emitter suite is `17 pass / 0 fail` at the cut head and the base commit renders the spaced form | `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs`; `git show f1b04a3a9:packages/pi-agentic-workflow/src/log-session-invocation.ts` | measured 2026-11-27 (this session) | O1, O6; AC-S10 |
| PE-008 | committed-source | The pin's natural home is the emitter's suite: the wiring suite (`workflow-tools-wiring.test.mjs`) drives registered tool specs and never imports `composeDirective`, so the rendered bytes can only be produced where the emitter lives | `packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` (imports `composeDirective`), `packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` | read 2026-11-27 (this session) | O6; AC-S10 |
| PE-009 | committed-source | The prior commit's hand version bump breaks the one train: two of four packages read `4.10.2` while the schema and the NaN preset read `4.10.1`, and the tree's own parity gate rejects the pair | `packages/*/package.json`; `bun scripts/version-parity-gate.mjs --content` → `VERDICT: FAIL` | measured 2026-11-27 (this session) | O7; AC-S9 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the 9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`. Every row is `planned` at
cut time and `verified` only against a foreground validator run.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S3, S5 · PE-001, PE-002, PE-003, PE-004 · AC-S2, AC-S4 | The write call the directive renders is executable by the tool it names: parsing the call and running `[subcommand, ...args]` against the crate in a fragment-carrier fixture exits 0 and lands exactly one fragment | P4 | P4 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0 (case `the rendered journal call is the one the crate accepts`) | `E` line naming the case, and the base-commit red run | planned |
| O2 | S3, S5 · PE-001, PE-002, PE-004 · AC-S2 | The close call is the same two-field shape — `subcommand` `session-close`, `args` `["close"]` — and reaches the crate's own writer instead of an Unknown-service refusal | P4 | P4 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0 (case `the rendered close call is the service alone, and the crate answers it`) | `E` line naming the case and the writer's own answer | planned |
| O3 | S6, S11 · PE-001 · AC-S6 | No second call shape exists: the door still forwards `subcommand` as one token and no code splits it on a space, so the vocabulary keeps one owner | P2 | P2 | direct application (this session) | `git diff f1b04a3a9 -- packages/pi-agentic-workflow/src/extension/workflow-tools.ts` is empty and `rg -n 'subcommand[^\n]*\.split\(' packages/pi-agentic-workflow/src` matches nothing | `E` line with both commands and their answers | planned |
| O4 | S7 · PE-005 · AC-S7 | The attribution seam's behaviour is unchanged: the token the seam now hears is neither unit- nor phase-attributing, and no consumer reads a spaced `subcommand` | P6 | P6 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0 | `E` line with the suite verdict and the `rg '"journal write"'` count (`0`) | planned |
| O5 | S8 · PE-004, PE-006 · AC-S8 | The shape is pinned once where a session reads it and swept in one change: no render surface composes a spaced `subcommand`, the `runner-mapping@1` block states the rule, and the package README repeats it as the package's own door | P4 | P4 | direct application (this session) | `rg -n '"subcommand": "(?:journal write\|session-close close)' packages/*/src skills template` matches nothing; `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 | `E` line with the sweep and the suite verdict; the writers the issue names (emitter, README, RUNNER.md, log-session skill, log-session-command test) are the sweep's checklist | planned |
| O6 | S10 · PE-007, PE-008 · AC-S10 | The seam cannot drift silently: the executable case exists beside the emitter and is red on the base bytes (`Unknown service: journal write`) | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 1 in the `f1b04a3a9` scratch copy and exits 0 here | `E` lines with both runs | planned |
| O7 | S9 · PE-009 · AC-S9 | One release carries both sides and the train stays aligned: the changeset declares the emitter's package and the crate whose cross-package pin it repairs, and every package reads one version | P2 | P2 | direct application (this session) | `bun scripts/version-parity-gate.mjs --content` exits 0; `rg -n '"version"' packages/*/package.json` matches four `4.10.1` | `E` line with both answers | planned |
| O8 | S1, S11 · AC-S1, AC-S11 | The unit ships as one inline application with a frozen ledger, and the owner's route decision is recorded: (a) implemented, (b) named and rejected | P1 | P1 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/734-log-session-subcommand-shape/SPEC.md --no-git` exits 0 | `E` line with the verify verdict; `decisions.md` D1 | planned |
| O9 | S1, S2, S3, S4, S5, S7, S8, S9, S10 · AC-S1 | The whole gate passes with the change in place, under the package suite and the root suite | P6 | P6 | direct application (this session) | `bun run --cwd packages/pi-agentic-workflow test` exits 0 and `bun scripts/local-gate.mjs` exits 0 | `G` lines with both verdicts and the counts | planned |

## Path protection

The two suites this unit appends to are protected paths (`**/*.test.*`, `freeze:
true`), so the modification carries its justification record in this folder's
[`decisions.md`](decisions.md) (D5). Both are *expansions*: no pre-existing
assertion is deleted, relaxed or narrowed.

```text
path-protection-plan@1
freeze-after: P3
kind | path | justification
not-created | packages/pi-agentic-workflow/test/log-session-invocation.test.mjs | the emitter's own frozen corpus: P3 appends the executable pin and keeps every pre-existing case byte-identical
not-created | packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs | the block's frozen corpus: P3 appends the shape case beside the byte-parity cases
```

## Triaged steps

n/a — applied inline per the owner's workflow (§4): the §5 ledger freeze
substitutes for the lane's plan step, and no repo review, audit, fold or
settlement machinery runs on this surgery. The `## Tasks` section is the
authoritative step list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-27, the owner's order, verbatim:
  ```
  Apply to this repository: issue #734
  ```
- **L2** — 2026-11-27, the governing workflow for this application, verbatim (the part that binds the procedure):
  ```
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```
- **L4** — 2026-11-27, the state this unit was cut over, verbatim from `git log --oneline main..HEAD` and `git status`:
  ```
  a494681e5 fix(pi-agentic-workflow): use contract-conforming subcommand shape in log-session hand-off
   M CHANGELOG.md
  ```
  The commit changed the two rendered call bodies, edited the two S7 assertions, bumped two of four packages to `4.10.2` and added a malformed `CHANGELOG.md` row (uncommitted). The unit had no `docs/fix/734-…` carrier, no ledgers and no verification. D3 records the repair; the ordering is disclosed, never rewritten.
- **E1** — 2026-11-27, `git show f1b04a3a9:packages/pi-agentic-workflow/src/log-session-invocation.ts | rg -n 'subcommand'` · exit 0 · the base renders `"subcommand": "journal write"` and `"subcommand": "session-close close"`.
- **E2** — 2026-11-27, the issue's reproducer, run in `/tmp/aw734probe` (a `mktemp` git fixture with `.agentic-workflow/journal/`) · `"journal write"` → exit 2 · `EDIT REFUSAL — Unknown service: journal write … Did you mean: journal-corpus, journal?`; `journal write` → exit 0 · `{"ok":true,"name":"20261127T000950Z-test-branch-narrative-s1.md",…}`.
- **E3** — 2026-11-27, the close half, in `/tmp/aw734probe2` · `session-close close` → exit 1 · `session-close: no session log at /tmp/aw734probe2/docs/LOGS.md`; `"session-close close"` → exit 2 · `Unknown service: session-close close`.
- **E4** — 2026-11-27, the cut head's baseline · `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exit 0 · `17 pass / 0 fail`.
- **E5** — 2026-11-27, `bun scripts/version-parity-gate.mjs --content` at the cut head · exit 1 · `VERDICT: FAIL` — `@gtrabanco/pi-agentic-workflow` is bumped to `4.10.2` but its companion row is absent (the malformed hand edit).
- **E6** — 2026-11-27, the frozen-failure corpus against the cut base in `/tmp/aw734-base` (`git archive f1b04a3a9`, the modified suites copied in, `tsc` built, bundle staged) · exit 1 · **22 pass / 4 fail**: `the rendered journal call is the one the crate accepts` (`expected "journal", actual "journal write"`), `S7: the directive names the tool the extension spawns…`, `S7: a crate-route close is handed to the same tool…`, and `M7 — the block pins the call shape…`.
- **E7** — 2026-11-27, the same two suites at the change · exit 0 · **26 pass / 0 fail**.
- **E8** — 2026-11-27, the block's measure · `bytes 497 · est 125` against the declared ceiling `132`; `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 with `M5` green.
- **E9** — 2026-11-27, `bun scripts/skill-lint.mjs` · `0 finding(s) · verdict: PASS`; `bun scripts/check-skill-context.mjs` · `PASS context budgets: 33 skills`; `bun scripts/runner-launcher-drift.mjs` · `bare-launcher: 0 · citations: 86 · verdict: PASS`.
- **E10** — 2026-11-27, `bun test scripts/normative-drift.test.mjs` · **24 pass / 0 fail**; `bun test scripts/prose-gate-inventory.test.mjs` · **22 pass / 0 fail**.
- **E11** — 2026-11-27, `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` · **6 pass / 0 fail**; `rg -n '"journal write"' packages/pi-agentic-workflow/src` · exit 1 (no consumer reads the spaced name).
- **E12** — 2026-11-27, `bun scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS`; `bun scripts/lint-changeset.mjs .changeset/734-log-session-subcommand-shape.md` · `ok`.
- **E13** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap fixrow docs/ROADMAP.md '<json>'` · `Receipt: pass` (before `7be3c5a2`, after `405a46e7`); `bun scripts/docs-generate.mjs` · `1 written · 2 unchanged · Roadmap: docs/ROADMAP.md — updated · verdict: PASS`.
- **E14** — 2026-11-27, the side-effect sweep · `rg -n '"subcommand": "(?:journal write|session-close close)' packages/*/src skills template` · exit 1 (no render surface composes a spaced subcommand); `rg -n 'subcommand[^\n]*\.split\(' packages/pi-agentic-workflow/src` · exit 1; `git diff f1b04a3a9 -- packages/pi-agentic-workflow/src/extension/workflow-tools.ts` · empty (the door never learns the shorthand).
- **E15** — 2026-11-27, `bun test packages/agentic-workflow/test/journal.write.test.mjs` · exit 1 · `the extension's invocation record names the same writer` — the crate's cross-package pin still asserted the literal spaced phrase the fix removes.
- **D8** — 2026-11-27, that pin is re-bound, never relaxed: it now requires `"subcommand": "journal"` **and** `"args": ["write"` in the emitter's source, so a regression to a spaced service fails two assertions instead of one (IR3's repair direction: the code is judged, the intent is kept).
- **P1** — 2026-11-27, unit doc, embedded ledgers, decisions record cut.
- **P2** — 2026-11-27, state repaired (versions reverted, malformed CHANGELOG row removed, changeset re-scoped to the touched package) · `6260ae9db`.
- **P3** — 2026-11-27, the executable pin and the contract-shape case appended; the base copy observed red · `a83beb307`.
- **P4** — 2026-11-27, the contract rule, the README sentence and the emitter's own comment · `71ceb836d`.
- **P5** — 2026-11-27, the `## Fixes` row through the crate's writer, the projection regenerated, the journal fragment written.
- **P6** — 2026-11-27, verification: the package suite, the side-effect sweep, the root gate.
- **D1** — 2026-11-27, owner decision (the order adopts the issue's recommendation): route **(a)** — the emitter learns the door's contract. (b) is rejected because it would keep two valid forms of one call (S6, IR11).
- **D2** — 2026-11-27, the pin's home is the emitter's suite, not `workflow-tools-wiring.test.mjs` (S10's suggestion is verified, not assumed): the wiring suite drives registered tool specs and never imports `composeDirective` (PE-008).
- **D3** — 2026-11-27, state repair of the prior commit: the two hand `package.json` bumps and the hand `CHANGELOG.md` row leave, because a valid `.changeset/*.md` is the sanctioned release intent and `release.mjs apply` owns both the versions and the companion rows at cut time (`docs/workflow/PACKAGES.md` §Version bumps). The crate is not touched, so it declares nothing.
- **D4** — 2026-11-27, the `runner-mapping@1` rule is worded inside the block's declared ceiling rather than re-pinned: measured 120 est before, the rule fits the 132-est ceiling (PE-006, E8).
- **D5** — 2026-11-27, path protection: the two suite edits are expansions (append-only assertions); no pre-existing case is deleted, relaxed or narrowed.
- **D7** — 2026-11-27, AC-S8's sweep is scoped to the render surface (`packages/*/src`, `skills`, `template`) after the first wording could only be satisfied by deleting the unit doc's own quote of the issue; `ac-hash` recomputed (decisions.md D7).

## Next

Owner verdict on the delivered diff: the obligations ledger is closed and the
gates are green; the merge is the owner's step. After merge, the next pi release
carries both sides (S9), and the fix row leaves `docs/ROADMAP.md`.

## References

- Issue [#734](https://github.com/gtrabanco/agentic-workflow/issues/734) — the work order this unit applies; the PR closes it via `Closes #734`.
- Issue [#678](https://github.com/gtrabanco/agentic-workflow/issues/678) — the same seam class one layer down (the tool's `execute` signature), whose suite shape this unit's pin follows.
- Issue [#696](https://github.com/gtrabanco/agentic-workflow/issues/696) — the `runner-mapping@1` block's owner and injector, the surface this unit's rule extends.
- Issue [#710](https://github.com/gtrabanco/agentic-workflow/issues/710) — the same directive's launcher defect; its suite is where the call's shape now lives.

## Branch

`fix/734-log-session-subcommand-shape` (the branch this unit is applied on).

## Depends on

Empty — independent.

## Regression scope

| scenario | check |
|---|---|
| a project without the fragment carrier still gets the append target and no call body | `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0 (the append-branch cases) |
| a project shipping its own writer script keeps using it and never composes a tool call for the entry | the same suite exits 0 (`S5: a project that ships its own writer script keeps using it`) |
| the directive still names the tool, the session and the resolved path | the same suite exits 0 (`S7: the directive names the tool the extension spawns…`, `composeDirective names the resolved target…`) |
| the injected block stays byte-equal to its owner and inside its ceiling | `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` exits 0 |
| the door's forwarding is untouched | `git diff f1b04a3a9 -- packages/pi-agentic-workflow/src/extension/workflow-tools.ts` is empty |
| attribution still lands for the unit commands it always did | `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0 |
