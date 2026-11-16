---
type: fix
scope: xs
roadmap_summary: Issue [#568](https://github.com/gtrabanco/agentic-workflow/issues/568): the doctor's fixed human block breaks on `UNREACHABLE` rows — `renderDoctor` padded the status label with `padEnd(12)`, so the 11-character `UNREACHABLE` label left a single space before the row id and its line stopped matching the labelled-line separation, dropping every unreachable row from the block's per-row count (the publication gate's `12 !== 14`, twice). The label column keeps its 12 width for the shorter labels and gains a minimum two-space gutter after the label itself. SPEC: [SPEC](fix/568-doctor-unreachable-gutter/SPEC.md)
---

# fix/568-doctor-unreachable-gutter

> The doctor's fixed human block (issue #537 S4) renders every row's status
> label through `padEnd(12)`. The `UNREACHABLE` label is 11 characters, so only
> one space separates it from the row id — the fixed block's labelled-line
> separation (two or more spaces) breaks exactly when a surface is unhealthy in
> the way the doctor exists to report. The fix guarantees a minimum two-space
> gutter after the label while keeping the 12-column for the shorter labels.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#568` — the publication gate (`cut-prerelease`) failed twice on
`the human block is the fixed one: header, one labelled line per row, verdict`
(`12 !== 14`), rerun and re-failed: runs
[43777103829](https://github.com/gtrabanco/agentic-workflow/actions/runs/43777103829)
and [43778064685](https://github.com/gtrabanco/agentic-workflow/actions/runs/43778064685).
The PR closes it via `Closes #568`.

## Specs

**S1 — the failing report, verbatim.**
> "El CI de publicación falló:
> 1 tests failed:
> (fail) the human block is the fixed one: header, one labelled line per row, verdict [116.95ms]
> 834 pass / 1 fail — Ran 835 tests across 47 files.
> Volví a lanzarlo y volvió a fallar."

**S2 — the fix, verbatim.**
> "Guarantee a minimum two-space gutter after the label while keeping the
> 12-column for shorter labels."

**S3 — the reproduction, verbatim.**
> "Stub `gh` whose `auth status` exits 1 + `ENGRAM_URL` on a dead port → two
> `UNREACHABLE gh` lines with a single space."

## Impact

- `packages/agentic-workflow/src/doctor/doctor.mjs` — `renderDoctor`'s one row
  line. No envelope field, no vocabulary, no probe changes; the `--json`
  envelope is byte-identical.
- Consumers: the CLI's human block only; the JSON consumers never see it.
- Why CI only: on the GitHub runner `gh` is installed but unauthenticated and
  no Engram server answers — exactly two `UNREACHABLE` rows, so the labelled
  count dropped 14 → 12. Locally both surfaces answer `ok`, so the defect was
  invisible.

## Retirements

none — strictly a one-line rendering repair; nothing is superseded.

## Non-goals

- No change to `STATUS_LABELS`, the statuses, the summary line or the verdict.
- No widening of the test's separation rule — the test is the contract; the
  code was wrong.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

## Future

none

## Future cost

- A future label longer than 10 characters lands in the same one-space trap
  only if someone replaces the minimum-gutter expression with a bare
  `padEnd` — the suite's fixed-block case catches it the moment an
  environment yields such a row, and `test/doctor.checks.test.mjs` pins the
  renderer directly.

## Applicable tests

- `packages/agentic-workflow/test/doctor.checks.test.mjs` — the
  environment-independent pin this unit adds: the renderer is driven over one
  row per published status, so the gutter rule is exercised on every host
  (PE-005).
- `packages/agentic-workflow/test/doctor.cli.test.mjs` — the failing case
  itself ("the human block is the fixed one"), which is red on the CI runner's
  environments (PE-002) and green after the fix.
- `packages/agentic-workflow/test/doctor.inventory.test.mjs` — the probes' and
  the inventory drift's regression suite.

## Known pre-existing issues

none observed on this unit's surfaces.

## Acceptance criteria

- **AC-S1** — The fixed block's labelled-line separation holds for every
  published status label, `UNREACHABLE` included, in an environment-free case.
  Check: `cd packages/agentic-workflow && bun test test/doctor.checks.test.mjs`
  exits 0, and the same suite over base `src/doctor/doctor.mjs` exits 1 on the
  `unreachable` row.
- **AC-S2** — The 12-column survives for the shorter labels while the
  `UNREACHABLE` label gains the minimum gutter. Check: the base-vs-change
  differential of `doctor --json` is byte-identical and its stdout `diff`
  reports exactly the two `UNREACHABLE` lines.
- **AC-S3** — The reproduction named by S3 yields one labelled line per
  surface: `14` at the change, `12` at base (the CI red). Check: the scratch
  stub-`gh` run in `## Log` E6/E7.

## Tasks

- P1 — Reproduce the CI red locally: stub `gh` + dead `ENGRAM_URL`, observe
  the two single-space `UNREACHABLE` lines and the `12 !== 14` failure at
  base. (Implements: S1, S3)
  (validator: the scratch reproduction renders `12` labelled lines at base)
  - Relevant files: packages/agentic-workflow/src/doctor/doctor.mjs
- P2 — Fix `renderDoctor`'s row line: minimum two-space gutter after the
  label, 12-column kept for the shorter labels, and an environment-independent
  case that renders one row per published status. (Implements: S2)
  (validator: `cd packages/agentic-workflow && bun test test/doctor.checks.test.mjs` exits 0)
  - Relevant files: packages/agentic-workflow/src/doctor/doctor.mjs, packages/agentic-workflow/test/doctor.checks.test.mjs
- P3 — Indexes, release intent and verification: the changeset, the ROADMAP
  `## Fixes` row through `fixrow`, the projection re-rendered by its emitter,
  the session log, the suite and the local gate.
  (validator: `bun scripts/lint-changeset.mjs` exits 0; `bun scripts/docs-generate.mjs --check` exits 0)
  - Relevant files: .changeset/568-doctor-unreachable-gutter.md, docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md

### Planning evidence

One row per Engineering claim the change rests on. Embedded here: XS unit
(shape owned by `skills/pre-execution-review/references/LEDGERS.md`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | committed-source | `renderDoctor` built each row as `${label.padEnd(12)}${row.id.padEnd(16)}…` and `STATUS_LABELS.unreachable` is `UNREACHABLE` (11 characters), so that label leaves exactly one space before the row id — the fixed block's labelled-line separation is `\s{2,}`, so the line stops matching | `packages/agentic-workflow/src/doctor/doctor.mjs:118` at base `811ff65a` | read 2026-11-16 at `811ff65a` | S1, S2; O1, O2 |
| PE-002 | committed-source | The fixed-block case filters row lines with `/^(ok\|MISS\|MISMATCH\|UNARMED\|UNREACHABLE\|N\/A)\s{2,}/` and asserts that count equals `CHECK_PROBES.length`, so any label that breaks the two-space separation silently drops out of the count instead of failing on its own line | `packages/agentic-workflow/test/doctor.cli.test.mjs:110-114` at base `811ff65a` | read 2026-11-16 at `811ff65a` | S1, S2; O2 |
| PE-003 | ci-log | The publication gate failed twice with `12 !== 14` on `the human block is the fixed one`, rerun and re-failed — the same assertion, so the red is deterministic on the runner and absent locally | runs [43777103829](https://github.com/gtrabanco/agentic-workflow/actions/runs/43777103829), [43778064685](https://github.com/gtrabanco/agentic-workflow/actions/runs/43778064685) (`gh run view 43778064685 --log-failed`) | read 2026-11-16 | S1; O2, O3 |
| PE-004 | measured-probe | A CI-shaped host yields exactly two `UNREACHABLE` rows — `gh` installed but unauthenticated, `engram-server` with no server — so the same bytes render `12` labelled lines at base and `14` after the fix; the gutter is the whole difference | this session's scratch reproduction (§`## Log` E6, E7), base and change over the same stub | run 2026-11-16 at `811ff65a` | S1, S3; O2, O3 |
| PE-005 | committed-source | No test referenced `renderDoctor`, so the rule had no environment-independent pin: the suite passed locally because no row was `UNREACHABLE` there, and only the runner's environment exercised the broken label | `rg -n 'renderDoctor' packages/agentic-workflow/test/` → 0 matches at base `811ff65a` | read 2026-11-16 at `811ff65a` | S2; O1, O3 |
| PE-006 | committed-source | `renderDoctor` is only the human block; `--json` prints the envelope, and the header, summary and verdict lines derive from fields the gutter never touches — so the envelope is byte-identical and only `UNREACHABLE` row lines can differ | `packages/agentic-workflow/src/doctor/doctor.mjs:112-131`; `bin/agentic-workflow.mjs` (`doctor` dispatch) | read 2026-11-16 at `811ff65a` | S2; O4 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S3 | Every published status label keeps at least two spaces before its row id — the 11-character `UNREACHABLE` included — deterministically, without depending on the host's health | P2 | P2 | direct application (this session) | `cd packages/agentic-workflow && bun test test/doctor.checks.test.mjs` exits 0 (the `two-space gutter after every published label` case renders one row per `DOCTOR_CHECK_STATUSES` value and matches `/^(ok\|MISS\|MISMATCH\|UNARMED\|UNREACHABLE\|N\/A)\s{2,}\S/`) | `E` line in SPEC `## Log` naming the run and the case | verified (E8 green · E6 red at base) |
| O2 | S1, S3 | The frozen failure: in a CI-shaped environment (unauthenticated `gh`, no Engram server) the fixed block carries one labelled line per surface — `14`, where base yields `12` | P1 | P1 | direct application (this session) | the §`## Log` E7 reproduction (stub `gh` + dead `ENGRAM_URL`) prints `14` lines matching the labelled-line grammar, against `12` at base (E6) | `E` lines in SPEC `## Log` naming both counts | verified (E6 = 12 at base · E7 = 14 at change) |
| O3 | S1, S2 | Red-first: the new case fails on the base implementation with the specific missing-gutter assertion, and passes only with the fix | P2 | P2 | direct application (this session) | `bun test test/doctor.checks.test.mjs` over base `src/doctor/doctor.mjs` in a `/tmp` copy exits 1 with `unreachable: at least two spaces before the row id` (actual `UNREACHABLE surface-unreachable-`) | `E` line in SPEC `## Log` naming the base run and its assertion | verified (E6) |
| O4 | S2 | Compatibility invariant: the `--json` envelope and the block's header, summary and verdict are byte-identical, and the shorter labels keep the 12-column — only `UNREACHABLE` row lines may differ | P2 | P2 | direct application (this session) | the differential of `doctor` and `doctor --json` at base vs change: `diff` reports exactly the two `UNREACHABLE` stdout lines and nothing for `--json` | `E` line in SPEC `## Log` naming the differential | verified (E7) |
| O5 | S1, S2 | No previous behaviour regresses in the package: the crate suite, the doctor CLI cases and the renderer's siblings stay green | P3 | P3 | direct application (this session) | `cd packages/agentic-workflow && bun run test` exits 0 | `G` line in SPEC `## Log` naming the suite and its totals | verified (E9) |

## Triaged steps

n/a — no `unit-route --triage` block is pasted: this unit was applied through
the owner's local workflow, which substitutes the frozen planning ledgers above
for the lane's plan step and does not run the lane machinery on the
repository's own surgery. Recorded consequence, not a hidden gap:
`bun scripts/unit-lineage.mjs --unit 568-doctor-unreachable-gutter` is BLOCKED
("no pasted `## Triaged steps` block with Steps/Skipped/Budget lines") because
that script is `audit-pr` gate 1's runtime for lane-era units, and `audit-pr`
is not run in this flow. `agentic-workflow verify` — the same unit doc's own
reader — passes on all seven of its checks.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the request, verbatim:
  ```
  El CI de publicación falló: 1 tests failed: (fail) the human block is the fixed one: header, one labelled line per row, verdict. Volví a lanzarlo y volvió a fallar.
  ```
- **E1** — 2026-11-16, at base (`811ff65a`), the CI-environment reproduction
  in `/tmp` (stub `gh` with `auth status` exit 1, `ENGRAM_URL=http://127.0.0.1:1`)
  · two `UNREACHABLE` row lines with a single space before the id
  (`UNREACHABLE gh`, `UNREACHABLE engram-server`), and
  `bun test test/doctor.cli.test.mjs` · exit 1 · `12 !== 14` at line 114 —
  the CI red, reproduced.
- **E2** — 2026-11-16, same reproduction after the fix · the two
  `UNREACHABLE` lines carry two spaces (`UNREACHABLE  gh`) ·
  `bun test test/doctor.cli.test.mjs test/doctor.checks.test.mjs test/doctor.inventory.test.mjs`
  · exit 0 · `32 pass · 0 fail`.
- **E3** — 2026-11-16, `cd packages/agentic-workflow && bun run test` at the
  fix · exit 0 · `835 pass · 0 fail · 47 files` (the same totals the red CI
  run reported).
- **E4** — 2026-11-16, the CI runs cross-checked: `gh run view 43778064685
  --log-failed` names `##[error]12 !== 14` at
  `packages/agentic-workflow/test/doctor.cli.test.mjs:114` — the labelled-line
  count, matching the rendered defect.
- **E5** — 2026-11-16, the release intent and the index rows:
  `bun scripts/lint-changeset.mjs` · exit 0; `roadmap fixrow` wrote the
  `## Fixes` row; `bun scripts/docs-generate.mjs --check` · exit 0 · `0 stale`.
- **E6** — 2026-11-16, red-first, in a `/tmp` copy of the base commit
  (`811ff65a`) with the new case added: `bun test test/doctor.checks.test.mjs`
  · exit 1 · `20 pass · 1 fail`, the failure being
  `unreachable: at least two spaces before the row id`, actual
  `UNREACHABLE surface-unreachable-` — the frozen failure, on the base
  implementation.
- **E7** — 2026-11-16, the differential in `/tmp` over one scratch project, stub
  `gh` (`auth status` exit 1) + `ENGRAM_URL=http://127.0.0.1:1`, base
  (`811ff65a`) vs the change: `doctor` stdout `diff` reports exactly the two
  `UNREACHABLE` lines (`UNREACHABLE gh` → `UNREACHABLE  gh`, same for
  `engram-server`), the labelled-line count is `12` at base and `14` at the
  change, and `doctor --json` is byte-identical.
- **E8** — 2026-11-16, the new case in the change:
  `cd packages/agentic-workflow && bun test test/doctor.checks.test.mjs` ·
  exit 0 · `21 pass · 0 fail`.
- **E9** — 2026-11-16, the package suite at the change:
  `cd packages/agentic-workflow && bun run test` · exit 0 · `836 pass · 0 fail`
  across `47 files` (the red CI run reported `834 pass · 1 fail` of `835`; the
  new case is the 836th).
- **L2** — 2026-11-16 (this session), the planning ledgers were cut in the XS
  home — `### Planning evidence` (PE-001…PE-006) and `### Obligations`
  (O1…O5). **Recorded deviation:** the rendering change was already present,
  uncommitted and untested, from the preceding session, so the freeze did not
  precede the first line of code as the workflow orders. It was cut before
  any commit, before the red run and before any evidence claimed above; the
  deviation is recorded here rather than hidden.
- **L3** — 2026-11-16, the work-unit commits: `29da095c` the red case alone
  (tree red at that commit, E6) and `7ebec46c` the fix that turns it green.

## Next

Hand the diff to the owner as the external verifier; the row leaves
`## Fixes` only after the PR merges. Re-run the publication cut after merge.
The declaring note: `docs/LOGS.md` receives this session's entry through its
carrier — the narrative fragment is written by `journal write` and the
aggregator (`.github/workflows/agentic-workflow-journal.yml`) is the only
writer of that file.

## References

- Issue [#568](https://github.com/gtrabanco/agentic-workflow/issues/568) — `Closes #568`.
- Issue [#537](https://github.com/gtrabanco/agentic-workflow/issues/537) — the
  doctor's surface contract the fixed block belongs to.
- `packages/agentic-workflow/README.md` — the `tool-inventory@1` block, the
  documented surfaces the block prints one line per.

## Branch

`fix/568-doctor-unreachable-gutter`

## Depends on

none

## Regression scope

| Scenario | Verified by |
|---|---|
| Every status label keeps at least two spaces before the row id, on any host | `test/doctor.checks.test.mjs` (E8) |
| The same rule holds in a CI-shaped environment | the stub-`gh` reproduction, `14` vs `12` (E6, E7) |
| The `--json` envelope, the header, the summary and the verdict are untouched | base-vs-change differential: `--json` byte-identical (E7) |
| The probes and the evaluators are untouched | `test/doctor.checks.test.mjs`, `test/doctor.inventory.test.mjs` |
| The package suite stays green | `bun run test` (E9) |
