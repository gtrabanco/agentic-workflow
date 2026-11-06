---
type: fix
scope: medium
---

# fix/384-capability-risk-detection

> Fix specification — one single unit document in the re-cut `spec-by-reference`
> shape, cut from `docs/fix/_TEMPLATE/SPEC.md`. Size: **M** — the planning
> ledgers live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate). The frozen
> request is **L1** in `## Log`; every requirement below quotes the issue's own
> words verbatim.

## Issue

`#384` — fix: capability-based risk detection and the passive carrier CLI (360c
of #360). The PR closes it via `Closes #384`.

## Specs

Requirements numbered `S#`, quoting the issue's own words verbatim. A later
correction is its own id (`S1a`, …) and never rewrites the line it corrects.

**S1 — What this unit is, and what it replaces.**
> Split from [#360](https://github.com/gtrabanco/agentic-workflow/issues/360) by owner decisions
> `D360-1`, `D360-3` and `D360-5` (2026-11-03). `360a` ships the classifier with a content list;
> this unit replaces its weakest half and gives the `passive` tier somewhere to write.

**S2 — The owner's objection to an operation-name list.**
> entonces necesitamos otro enfoque? Es posible en lugar de una lista?

**S3 — The chosen shape: capability, not spelling.**
> The chosen shape is to detect what a file **can do** — its imports and its effects — rather than
> matching names, so an unlisted synchronous delete in a language the table does not cover is caught
> by its capability, not missed by its spelling.

**S4 — The hard constraint: no guard may paralise ordinary work.**
> los guards no pueden paralizar el trabajo tampoco y habría que verificar que no introducimos
> ningún bug. La última vez que metimos guards no se podía hacer ni un fold-findings, ni
> log-session

**S5 — The analyser informs a tier, never blocks a command.**
> So: the analyser **informs a tier, never blocks a command**. `fold-findings`, `log-session` and every
> other executor route keep running untouched; the worst outcome of a false positive is extra ceremony.

**S6 — The passive carrier and its only writer.**
> `docs/passive/<id>.md` is the passive unit's record (grammar `passive-record@1` in
> `skills/execute-phase/references/risk-tiers.md`). The owner's rule:
>
> > la búsqueda (usando ripgrep?), edición, borrado, añadir o cualquier otra tarea exige cli si es un
> > fichero "estándar" parte de la ceremonia

**S7 — Written by the CLI, never by hand, so two passive units cannot collide.**
> So the file is written by `ceremony passive add|read|list` — never `echo`, `sed -i` or a hand edit —
> which is what keeps two passive units from colliding.

**S8 — Scope: the two mechanics and the frozen corpus that precedes them.**
> - `apply`-side capability detection: per language family in the repo (`mjs`, `ts`, `sh`, `py`), the
>   imports a file declares and the effects they enable.
> - `ceremony passive add|read|list` over a repo-relative path, JSON on stdout, the CLI's exit
>   contract unchanged.
> - A frozen failure corpus **written before the implementation**, the way #360 did it: each mechanic
>   gets a reproducer that fails at the base commit and passes at head.

**S9 — Non-goals.**
> - No blocking gate. No command may refuse to run because of a tier or a capability verdict.
> - No change to `detail.risk_tier` / `detail.size_tier`'s published shape beyond the reason codes the
>   new analysis needs.
> - No measurement (that is #383).

**S10 — The open question the design step must settle.**
> Whether the analyser is a parser (real import graph per language) or a bounded heuristic (import
> names + call names from a published capability table). The owner's "no bug, no blocking" constraint
> pushes toward the heuristic; the "not a list again" objection pushes toward the parser. This is the
> first decision of the design step.

## Resolution of S10 (the one decision this unit takes)

`D1` in [`decisions.md`](decisions.md): a **bounded syntactic analyser per language
family** — imports and invocations extracted per family, resolved through a
published capability catalogue, with relative imports followed one module graph
deep. Neither horn of the issue's question is taken whole, and neither is
free-floating:

- **Not a real parser.** `scripts/risk-tiers.mjs` is pinned to `node:` +
  schema-source imports only (`scripts/risk-tier-classifier.test.mjs` `F6b`),
  the ceremony CLI is dependency-free (`scripts/ceremony/lib.mjs`), and
  `#352`'s crate is not built — an AST parser means adding a dependency to a
  module two callers already import. That is a bigger change than this unit, and
  `D360-3` already records the owner's shape: "one mini-analyser per language
  family in the repo (`mjs`, `ts`, `sh`, `py`)".
- **Not the old list.** The operation-name regex is deleted, not extended: the
  removal spellings move into a capability catalogue keyed by **provider**
  (`node:fs/promises` *can* remove entries), the analysis resolves a file's own
  imports and bindings against it (alias, namespace and destructured `require`
  included), follows a relative import into the declaring module, and covers
  `sh` and `py` families the table never had.
- **Fail closed upward** is what keeps a bounded analyser safe: everything it
  cannot resolve raises a tier, never lowers one, so the worst outcome of a
  false positive is the extra ceremony S5 accepts, and a false *passive* is
  impossible by construction.

## Impact

Callers and consumers of what this unit ships:

| Surface | Why it changes | What consumes it |
|---|---|---|
| `scripts/capabilities.mjs` (new) | the capability analyser — pure, `node:`-free, one catalogue | `scripts/risk-tiers.mjs`, the root suites |
| `scripts/risk-tiers.mjs` | the `destructive` signal delegates to the analyser; the operation-name regex retires; `classifyTier` accepts a resolver | `scripts/ceremony/tier.mjs`, `scripts/workflow-status.mjs`, the classifier suite |
| `scripts/ceremony/tier.mjs` | supplies the repo-rooted resolver so both callers classify identically | `ceremony tier classify` |
| `scripts/workflow-status.mjs` | same resolver, same answer (S3, O12) | the sensor's `detail.risk_tier` |
| `scripts/ceremony/passive.mjs` (new) + `scripts/ceremony.mjs` | the carrier's only writer (S6, S7) — `passive add\|read\|list` in the closed registry | `skills/execute-phase/references/risk-tiers.md`, `skills/unit-lane/SKILL.md`, any driver |
| `skills/execute-phase/references/risk-tiers.md` | the passive carrier section names the CLI as its only writer and the capability layer as the `destructive` rule's home | the executor, the lane, `risk-tier-ceremony.test.mjs` |
| `skills/unit-lane/SKILL.md` | the passive route names the CLI instead of "write the record" | every lane run |
| `docs/ROADMAP.md` | row 97 records 360c as delivered; the `## Fixes` table gains this unit's row | `audit-docs`, `workflow-status`, `docs-generate` |
| `docs/passive/` | the carrier's home; absent at the cut head, created by the first `add` | the writer, the reader, the templates that already name it |
| `scripts/risk-tier-classifier.test.mjs` | one frozen pin corrected, on the record: `F6b` now states the dependency rule it always meant (`node:` **or** repository-relative, multi-line included) because the classifier delegates to `scripts/capabilities.mjs`; every verdict expectation is untouched (`decisions.md` D5) | the root suite |
| `scripts/workflow-status-sensor.test.mjs` | the sandbox mirror of the sensor's import graph gains the analyser module, so its two "no built runtime" cases still fail for the reason they assert; no assertion changes (`decisions.md` D5b) | the root suite |

**Named high-risk item** (the unit's own computed verdict at cut, recomputed at
head in `## Log`): the corpus files carry real removal fixtures — see
`## Risk tier`.

Live on the other side: the published vocabularies
(`packages/agentic-workflow-schema/src/vocabularies.ts`) and the envelope's
`detail.risk_tier` shape are **not** touched (S9); a new capability token that
wanted to be published would bind three surfaces at once and is deliberately not
introduced here (the capability ids are the analyser's internal evidence and
reach the verdict only inside `reason`).

## Retirements

What this unit removes:

- **`DESTRUCTIVE_CONTENT`'s operation-name list** in `scripts/risk-tiers.mjs` —
  the JS member spellings (`rmSync|rmdirSync|unlinkSync|purge|purgeDir`) leave
  the regex and are replaced by the capability catalogue in
  `scripts/capabilities.mjs`. The regex's non-JS residue (shell `rm -rf`, SQL
  `delete from`/`truncate`/`drop table`, `git push --force`) is **kept** — it is
  the embedded-statement layer, since a script that embeds a shell command or a
  SQL statement is executing something a runtime will run. Negative pin:
  `rg -n 'rmSync\|\|unlinkSync' scripts/risk-tiers.mjs` matches 0 after the
  change, and `node --test scripts/risk-tier-classifier.test.mjs` still carries
  every 360 frozen fixture green.
- Nothing else is retired: the carrier's grammar (`passive-record@1`), the
  templates that name it, the CLI's exit contract and the published tier
  vocabularies all stay byte-identical, and no consumer of `next.tier` or
  `findings.fix_now[].suggested_tier` changes meaning.

## Non-goals

- **No blocking gate, no blocking guard** (S4, S5, S9): no command refuses to run
  because of a tier or a capability verdict. The only new refusals are the
  carrier's own write contract — a colliding id and a non-`passive` scope — which
  are the passive ceremony refusing to record a false claim, never an executor
  route being stopped.
- **No published shape change** (S9): `RISK_TIER_KINDS`, `RISK_TIER_SIGNAL_KINDS`,
  `RISK_TIER_REASONS`, `SIZE_TIER_KINDS` and the envelope's `detail.risk_tier`
  object keep every token and field. No new reason code was needed: `destructive`
  stays a named high-risk signal and the capability evidence travels in `reason`.
- **No measurement** (S9): the per-tier cost instrument is #383's.
- **Not a full parser** (S10 → D1): no dependency, no AST, no cross-file call
  graph beyond a relative import's declarations.
- Nothing is asked of the forge: no label, milestone or issue is created.

## Risk tier

Computed, never chosen. At cut (over the planned path list, whose files do not
exist yet) the answer was `standard`; at head the same command over the real diff
answers:

```json
{"tier": "high", "reason_kind": "named-high-risk",
 "reason": "1 path(s) touch a named high-risk surface: destructive (scripts/capabilities.test.mjs · rm)",
 "task_size": {"understood": true, "contained_risk": "named", "resumable_from_diff": true,
               "ceremony": "unit-doc+review-change", "verification": "review-change"}}
```

`high` because the frozen corpus carries real removal calls — which is exactly
what a corpus of removals looks like, and the analyser reports it honestly rather
than being formatted around. Per the tier contract the named item is quoted here:

- **Tier** — `high` · **Task Size** — `named`
- **Named high-risk item** — `destructive` · `scripts/capabilities.test.mjs` · `rm`

The owner's local workflow for this change substitutes direct application plus the
deterministic gates for the `review-change`/`audit-pr` pass — an explicit
instruction from the owner, recorded here rather than presented as a decision this
unit took about itself. Nothing that could lower the computed tier was done to the
tree: no fixture was reformatted, no assertion relaxed.

## Future

- `open` — 2026-11-06, the one deliberate bound of D1: a destructive capability
  reached through an **unresolved** relative import (a target the caller's
  resolver cannot read, or a depth beyond the bound) does not raise the tier. It
  is recorded here rather than guessed at: the analysis reports
  `unresolved: true` for that module and the verdict stays at `standard`. A
  future unit that needs it adds a repo-index-backed resolver, with its own
  frozen corpus.
- `open` — 2026-11-06, `sh`/`py` have **no files in this repository** today
  (fixture-only families, per S8's explicit list). When the first real `.py` or
  `.sh` lands, its first classification is the corpus's next fixture — the
  language table is only as good as the fixtures behind it.

## Future cost

- The capability catalogue is now the `destructive` signal's **one home**. Any
  future removal spelling (a new provider, a new language family) is a catalogue
  row plus its fixture — never a regex in `scripts/risk-tiers.mjs`, which owns no
  removal spelling at all after this unit. Binds any unit touching
  `scripts/capabilities.mjs`.
- `classifyTier(files, { resolve })` is a function of `path → contents` **plus**
  the modules reachable through the caller's resolver. Both repo callers must
  pass the same rooted resolver or their answers may diverge; binds any new
  caller of the classifier.
- `ceremony passive add` is the carrier's only writer (S6, S7). A future surface
  that writes `docs/passive/**` reopens that rule with the owner; binds the
  CLI's future modules and any `init-workspace` scaffold addition.

## Applicable tests

- `scripts/capabilities.test.mjs` — the new analyser's frozen corpus (mechanic A
  reproducers, the language matrix, fail-closed cases, the transitive case).
- `scripts/risk-tier-classifier.test.mjs` — the 360 corpus stays green: every
  verdict expectation is unchanged, and only `F6b`'s dependency rule is corrected
  (`decisions.md` D5). The capability-integration cases live in
  `scripts/capabilities.test.mjs` (`F15`/`F16`) — beside the fixtures they are
  about, so the frozen corpus is never edited to make an integration pass.
- `scripts/ceremony-passive.test.mjs` — the new `passive` module: write, collide,
  refuse a non-passive scope, read back, list, and the exit contract.
- `scripts/risk-tier-ceremony.test.mjs`, `scripts/ceremony.test.mjs`,
  `scripts/workflow-status-sensor.test.mjs`, `scripts/vocabulary-parity.test.mjs`,
  `scripts/normative-drift.test.mjs` — the pre-existing pins that must not move.
- `bun scripts/run-root-suite.mjs` — the whole root suite.

## Known pre-existing issues

- **`docs/ROADMAP.md`'s `## Fixes` row for #360 reads `in-progress`** and row 97
  describes the passive carrier without a writer. *affects* this unit: P4 updates
  both (row 97 records 360c; the `## Fixes` table gains #384's row).
- **No `.py` file and no `.sh` file outside `template/`** at the cut head.
  *affects* this unit's evidence, not its code: the `py`/`sh` families are pinned
  by fixtures (S8 names them), and `## Future` records the standing condition.
- **The root suite needs the schema package's `dist/`.** *does-not-affect*: it is
  built at the cut head and the unit changes nothing under `packages/`.

## Tasks

- P1 — The capability analyser: `scripts/capabilities.mjs` extracts, per language
  family (`js`, `py`, `sh`), the imports a file declares and the invocations it
  makes, resolves them through a provider→capability catalogue (alias,
  namespace and destructured `require` included), follows a relative import into
  the declaring module through an injected resolver, and reports the destructive
  capability it reaches — fail closed upward throughout (validator:
  `node --test scripts/capabilities.test.mjs` exits 0)
  (Implements: S2, S3, S8, S10)
  Relevant files: scripts/capabilities.mjs, scripts/capabilities.test.mjs
- P2 — Bind the capability layer into the tier: `scripts/risk-tiers.mjs` deletes
  the operation-name regex, delegates the `destructive` signal to the analyser,
  and accepts the resolver `classifyTier` needs; `scripts/ceremony/tier.mjs` and
  `scripts/workflow-status.mjs` pass the same repo-rooted resolver, and the two
  frozen pins the new import touches are corrected on the record (validator:
  `node --test scripts/risk-tier-classifier.test.mjs` exits 0 and
  `node --test scripts/workflow-status-sensor.test.mjs` exits 0)
  (Implements: S1, S3, S9)
  Relevant files: scripts/risk-tiers.mjs, scripts/ceremony/tier.mjs, scripts/workflow-status.mjs, scripts/risk-tier-classifier.test.mjs
- P3 — The passive carrier's writer: `scripts/ceremony/passive.mjs` + the
  `passive` registry entry — `add` records `docs/passive/<id>.md` in the
  `passive-record@1` five-field shape after proving the scope's computed tier is
  `passive` (refusing a colliding id and a non-passive scope), `read` parses one
  record, `list` enumerates them; JSON on stdout, exit contract 0/1/2 unchanged
  (validator: `node --test scripts/ceremony-passive.test.mjs` exits 0)
  (Implements: S6, S7, S8)
  Relevant files: scripts/ceremony/passive.mjs, scripts/ceremony.mjs, scripts/ceremony-passive.test.mjs
- P4 — Documentation currency: `risk-tiers.md` names the CLI as the carrier's
  only writer and the catalogue as the `destructive` rule's home, the lane's
  passive route cites the CLI, `docs/ROADMAP.md` gains this unit's `## Fixes` row
  and row 97 records 360c (validator: `node --test scripts/risk-tier-ceremony.test.mjs`
  exits 0 and `node scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S6)
  Relevant files: skills/execute-phase/references/risk-tiers.md, skills/unit-lane/SKILL.md, docs/ROADMAP.md, docs/fix/384-capability-risk-detection/SPEC.md
- P5 — Verify: every obligation row closed with its validator run, the
  differential against a copy of the base commit recorded, and the whole gate
  green (validator: `bun scripts/local-gate.mjs --skip-network` exits 0 and
  `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S4, S5, S9)
  Relevant files: docs/fix/384-capability-risk-detection/planning-obligations.md, docs/ROADMAP.md

### Planning evidence

The ledger lives beside this doc as [`planning-evidence.md`](planning-evidence.md)
(M size: separate file, never both).

### Obligations

The ledger lives beside this doc as
[`planning-obligations.md`](planning-obligations.md) (M size: separate file,
never both).

## Triaged steps

Verbatim stdout of
`env -u PI_WEB_SESSION bun scripts/unit-route.mjs --triage 384-capability-risk-detection`,
run once the unit doc existed:

```text
TRIAGE — 384-capability-risk-detection (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: unavailable — dispatch_relay requires PI WEB's session dispatch bridge
```

The `review` step is the one deviation the owner's instruction records: this
change is applied directly and the deterministic gates are the verification, so
no `review-change`/`audit-pr` run exists for it. Nothing else in the block is
re-ordered or re-derived.

## Acceptance criteria

One observable criterion per `S#`, each naming the check that proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 | The unit replaces the operation-name list and gives the passive tier a writer: the regex's JS spellings are gone from `risk-tiers.mjs` and `docs/passive/` gains a writer (S1) | `rg -n 'rmSync\|unlinkSync' scripts/risk-tiers.mjs` matches 0; `node scripts/ceremony.mjs passive list` exits 0 |
| AC-2 | The `destructive` signal is no longer decided by a list of operation names: the catalogue is keyed by provider and the analysis resolves the file's own imports (S2) | `node --test scripts/capabilities.test.mjs` — the alias/namespace/destructured-`require` cases pass, and the catalogue is `PROVIDERS`, not a call-name regex |
| AC-3 | What a file *can do* decides: imports and effects per language family, and a removal spelling the table never carried is caught by its capability (S3) | `node --test scripts/capabilities.test.mjs` — the `js`/`py`/`sh` matrix and its `F15`/`F16` integration cases, which name `destructive` through the classifier; `node --test scripts/risk-tier-classifier.test.mjs` exits 0 with every 360 fixture verdict unchanged |
| AC-4 | Nothing is blocked: `fold-findings`/`log-session` and every executor route keep running, and no command refuses because of a tier or capability verdict (S4) | `node --test scripts/ceremony-passive.test.mjs` — the module adds no tier check to any other object; `node --test scripts/ceremony.test.mjs` exits 0; `rg -n 'risk_tier\|classifyTier' skills/fold-findings/SKILL.md skills/log-session/SKILL.md` matches 0 |
| AC-5 | The analyser informs the tier and never commands: the verdict is read, and a false positive costs ceremony only (S5) | `node --test scripts/risk-tier-classifier.test.mjs` — every pre-existing 360 fixture keeps its verdict; the new ones only *raise* a tier |
| AC-6 | `docs/passive/<id>.md` is written by the CLI and by nothing else: `add` writes the `passive-record@1` five-field shape and refuses a collision (S6) | `node --test scripts/ceremony-passive.test.mjs` — the write/round-trip/collision cases; `scripts/risk-tier-ceremony.test.mjs` `C5b` parses the written record back to exactly its five fields |
| AC-7 | `ceremony passive add\|read\|list` never needs `echo`/`sed -i`/a hand edit, and two passive units cannot collide (S7) | `node --test scripts/ceremony-passive.test.mjs` — `add` then `read` round-trips without any file hand-written by the suite, and a second `add` on the same id exits 2 with `record-exists` |
| AC-8 | Scope: both mechanics ship with a frozen corpus that fails at the base commit and passes at head, over `mjs`/`ts`/`sh`/`py` (S8) | `CAPABILITY_BASE=<base-tree> node --test scripts/capabilities.test.mjs` exits 0 (the base probe asserts the miss) and the head run exits 0; the `js`/`py`/`sh` matrix is in the suite |
| AC-9 | The non-goals hold: no blocking gate, no published-shape change, no measurement claimed (S9) | `git diff <base> -- packages/agentic-workflow-schema/src/vocabularies.ts` is empty; `node --test scripts/vocabulary-parity.test.mjs` exits 0; no command in `scripts/` gains a tier refusal outside `passive add`'s own write contract |
| AC-10 | S10 is settled by a recorded decision with its authority, not by an unstated guess (S10) | `rg -n '^\| D1 \|' docs/fix/384-capability-risk-detection/decisions.md` matches 1 and `rg -n 'D1' docs/fix/384-capability-risk-detection/SPEC.md` matches the resolution section |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-06, the request, verbatim:
  ```
  Apply to this repository: issue #384
  ```
- **L2** — 2026-11-06, the issue, verbatim: field-for-field text of
  [#384](https://github.com/gtrabanco/agentic-workflow/issues/384) as quoted in
  `## Specs` (`S1`…`S10`); the issue's own words are the requirement text and
  are not restated here.
- **D1** — 2026-11-06, S10 settled by [`decisions.md`](decisions.md) `D1`: a
  bounded syntactic analyser per language family, on two authorities — `D360-3`'s
  recorded owner shape ("one mini-analyser per language family") and the pinned
  dependency rule that excludes an AST parser from the classifier path (`D2`
  keeps its capability ids internal; `D3` states the carrier's refusal boundary).
- **E1** — 2026-11-06, `node --test scripts/capabilities.test.mjs` at `8f07802a`
  (the corpus commit, no analyser) · 14 tests, `pass 0`, `fail 14` (O1, O2, O3,
  O4, O5, O16 red).
- **E2** — 2026-11-06, `CAPABILITY_BASE=/tmp/base-384 node --test
  scripts/capabilities.test.mjs` against a throwaway worktree of the base commit
  `91a7f39` · exit 0 · 14/14 pass: the base tree has no analyser
  (`ERR_MODULE_NOT_FOUND`) and its classifier misses **8 of 9** reproducers — the
  ninth is the literal `rm -rf` the old name list already carried (O2).
- **E3** — 2026-11-06, `node --test scripts/capabilities.test.mjs` at `49a3c92d`
  · exit 0 · 14/14 pass (O1, O3, O4, O5, O16).
- **E4** — 2026-11-06, `node --test scripts/risk-tier-classifier.test.mjs` after
  the delegation · exit 0 · 13/13 pass: every 360 fixture keeps its verdict
  (`passive`/`standard`/`high`, the guarded cleanup, the SQL and shell
  spellings), and `F6b` is the one corrected case (`decisions.md` D5) (O5, O7,
  O16).
- **E5** — 2026-11-06, `node --test scripts/ceremony-passive.test.mjs` at
  `7b83ec67` (the corpus commit, no module) · 9 tests, `pass 0`, `fail 9` (O8, O9,
  O10, O11 red).
- **E6** — 2026-11-06, `node --test scripts/ceremony-passive.test.mjs` and
  `node --test scripts/risk-tier-ceremony.test.mjs` at `474df374` · exit 0 ·
  9/9 and 16/16: `add` writes the five-field record, a taken id is exit 2
  `record-exists`, a non-passive scope is exit 2 `not-passive` +
  `route: standard-ceremony`, `--tier` is `unknown-flag`, `list` is sorted and
  reports a malformed record, `read` round-trips, and `C5b` parses the written
  record back to exactly the grammar's five fields (O8, O9, O10, O11).
- **F1** — 2026-11-06, **found by this unit's own differential, folded in it**:
  `ceremony tier classify --base main` reported an uncommitted
  `.github/workflows/root-suite.yml` as `github/workflows/root-suite.yml` and
  classified the change `standard` where it owed `high` — `scopePaths()` read a
  trimmed porcelain listing, so the first dirty entry lost its leading status
  column. Red at `210865d9` (`C1d` fails), folded at `2bef883c` (the listing asks
  for the `-b` header the way the sensor already did); verified by
  `node --test scripts/risk-tier-ceremony.test.mjs` · 16/16 and by re-running the
  fixture, which now prints the whole path (`decisions.md` D6).
- **E7** — 2026-11-06, the **differential**, base copy `/tmp/base-384` (`91a7f39`,
  its gitignored `dist/` copied in) vs head, same fixture repository: `tier
  classify --paths` (prose, executable, publish path, prose named for deletion),
  `tier read`, `workspace clean-check`, `unit read`, `findings read`,
  `docs check`, `plan` and an unknown object are **byte-identical** (stdout and
  exit) at both heads. The only differences are the ones this unit asks for: the
  registry listing gains `passive`, `ceremony passive list` answers where the base
  said `unknown-object`, and the three capability reproducers
  (`node:fs/promises` `unlink`, `shutil.rmtree`, `find -delete`) move `standard`
  → `high` with the capability named (O15, O17).
- **E8** — 2026-11-06, the sensor's own differential on the same fixture:
  `node scripts/workflow-status.mjs` prints a byte-identical
  `detail.risk_tier` / `detail.size_tier` / `next.tier` block at both heads, and
  the two callers agree on a transitive fixture — `ceremony tier classify
  --paths scripts/maintenance.mjs` and the sensor both answer `high`
  (`destructive`), each through its own repo-rooted resolver (O12, O15).
- **E9** — 2026-11-06, `node --test scripts/vocabulary-parity.test.mjs` and
  `node --test scripts/normative-drift.test.mjs` · exit 0; `git diff main..HEAD --
  packages/agentic-workflow-schema/src/vocabularies.ts` is **0 lines**: the
  published tier vocabularies and the envelope's detail shape do not move (O7).
- **E10** — 2026-11-06, `rg -c 'rmSync|unlinkSync|rmdirSync' scripts/risk-tiers.mjs`
  matches **0** and `rg -c 'risk_tier|classifyTier|ceremony tier'
  skills/fold-findings/SKILL.md skills/log-session/SKILL.md` matches **0**: the
  operation-name spellings are gone from the classifier and no executor route
  gained a tier check (O6, O16).
- **E11** — 2026-11-06, `rg -c '384-capability-risk-detection' docs/ROADMAP.md`
  matches **2** (row 97 and this unit's `## Fixes` row) and
  `node scripts/docs-generate.mjs --check` · exit 0 · `0 missing · 0 stale · 0
  orphaned` (O14).
- **E12** — 2026-11-06, `bun scripts/check-skill-context.mjs`, `--routes` and
  `--documents` · exit 0 · `PASS context budgets: 28 skills`, `PASS route
  budgets: 14 routes`, `PASS context documents: 4 budgeted documents` (O13).
- **G1** — 2026-11-06, `bun scripts/local-gate.mjs --skip-network` · exit 0 ·
  `local-gate: PASS — 8 step(s) in 102s` (the four network steps skipped by the
  flag, not by a failure); `node scripts/run-root-suite.mjs` within it · exit 0 ·
  **87 suites PASS, 0 FAIL** (85 before this unit + the two new suites) (O13).

## Next

External verification by the owner: read the diff, the two ledgers and the `## Log`
runs, then decide. Every obligation row is `verified` against a run recorded here;
nothing is merged and no review pass was run on this change (the owner's own
instruction for this unit).

## References

- Issue [#384](https://github.com/gtrabanco/agentic-workflow/issues/384) — this
  unit (`360c`). The PR closes it via `Closes #384`.
- Parent unit `docs/fix/360-risk-tiered-ceremony/` (`360a`) — the classifier, the
  tier vocabulary, the carrier's grammar; `decisions.md` `D360-3`/`D360-5` are the
  authority this unit implements.
- Roadmap row 97 (`risk-tiered-ceremony`), direction row 83 (#307).
- Sibling split: [#383](https://github.com/gtrabanco/agentic-workflow/issues/383)
  (`360b`, measured acceptance) — untouched here (S9).

## Branch

`fix/384-capability-risk-detection`

## Depends on

`360-risk-tiered-ceremony` — merged; this unit extends its classifier and its
carrier. No other unit must merge first.

## Regression scope

| Scenario | Verification |
|---|---|
| every 360 classifier fixture keeps its verdict (`passive`/`standard`/`high`, the guarded-cleanup rule, SQL and shell spellings) | `node --test scripts/risk-tier-classifier.test.mjs` exits 0 with no expectation edited |
| `ceremony tier classify\|read\|plan` keeps its JSON shape and exit codes | `node --test scripts/risk-tier-ceremony.test.mjs` exits 0; the base-vs-head differential is byte-identical except the new resolver's verdicts |
| the sensor's `detail.risk_tier` keeps its keys and its `next.tier` stands apart | `node --test scripts/workflow-status-sensor.test.mjs` exits 0 |
| the closed ceremony CLI's registry, exit contract (0/1/2) and `unknown-object` refusal survive the new object | `node --test scripts/ceremony.test.mjs` exits 0 |
| the published vocabularies keep every token | `node --test scripts/vocabulary-parity.test.mjs` exits 0 |
| the normative inventory refuses drift exactly as before, `passive-record@1` included | `node --test scripts/normative-drift.test.mjs` exits 0 |
| the passive record's on-disk shape stays the five declared fields | `node --test scripts/risk-tier-ceremony.test.mjs` exits 0 (`C5`, `C5a`, `C5b`) |
| the skill context budgets still pass with the new prose | `bun scripts/check-skill-context.mjs` and `--documents` exit 0 |
