---
type: fix
scope: small
ac-hash: cee488dde4abdb65be396cf7ca1a8274d72c790e5b9538ca4f3e776e4175d552
roadmap_summary: Issue [#571](https://github.com/gtrabanco/agentic-workflow/issues/571): the documented `node scripts/run-root-suite.mjs` dispatched the contract suites against whatever gitignored `packages/agentic-workflow-schema/dist/` sat on disk, so a stale build turned them red with semantic-looking assertions — the runner now brings that build up to date before it dispatches (one stderr line, nothing when `dist/` is fresh), says so and runs on when the package manager is absent, and stops with the compiler's own output when the package does not build.
---

# fix/571-root-suite-stale-dist

> Fix specification — one single unit document. Applied through the owner's local
> unpublished workflow (§5 ledger freeze substitutes for the lane's plan step); no
> repo review/fold machinery runs on this change. XS/S sizing: the two planning
> ledgers are embedded below, never a sibling file.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#571` — "run-root-suite.mjs reports false semantic reds against a stale schema
dist". The PR closes it via `Closes #571`.

## Specs

Requirements numbered `S#`, quoting the requester's words verbatim. `S1` is the
owner's apply instruction; `S2`–`S6` are the issue's own sentences, in the order
they appear.

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #571

**S2 — The documented verification command reads a `dist/` it did not build.**
> The documented verification command `node scripts/run-root-suite.mjs` runs schema-contract tests against whatever `packages/agentic-workflow-schema/dist/` sits on disk.

**S3 — Nothing guards the stale-module case.**
> `dist/` is a gitignored build output; `scripts/schema-runtime.mjs` names the *missing-module* precondition (fresh-clone failure) but nothing guards the *stale-module* case.

**S4 — The defect is the shape of the red, not the red.**
> the standalone runner path (what the AGENTS.md "Verification" section cites) reports false semantic reds that look exactly like a broken contract change.

**S5 — One mechanism, chosen at the design step.**
> Either rebuild the schema package before the suites in `run-root-suite.mjs`, or give `schema-runtime.mjs` a named stale-module precondition (e.g. compare a committed marker against the built output and fail with "run bun run build", mirroring the existing missing-module message). One mechanism, red-first suite, sibling `.test.mjs`.

**S6 — The gate path is already safe and must stay that way.**
> The local gate orders `schema-build` before the suites, so the gate path is safe

## Impact

- `scripts/run-root-suite.mjs` — the runner. Gains the `dist/` predicate, the
  build seam and the dispatch wiring: it brings
  `packages/agentic-workflow-schema/dist/` up to date **before** the pool
  starts, so no suite can import a build of another source set. The header,
  the `PASS`/`FAIL`/`KILLED` lines, the exit status and the worker pool are
  untouched; the new reporting is one `root gate:` line on stderr (stdout stays
  the machine receipt it already was).
- `scripts/run-root-suite.test.mjs` — the sibling suite: one case per predicate
  verdict on a throwaway `dist/`+`src/` tree, one per dispatch decision, and the
  wire assertion on the real runner's stderr.
- `AGENTS.md` — `## Verification`'s "Root suites pass" bullet describes what the
  command guarantees; one clause is added there and, because the guide's
  `linesMax` is fully spent (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`), the same
  bullet is re-wrapped rather than grown.
- `packages/agentic-workflow-schema` — **read only**. Neither the package's
  `build` script nor its `tsconfig.json` moves; the change reuses the declared
  script through the workspace's own package manager instead of carrying a
  second copy of what "the build" means.
- `scripts/local-gate.mjs` and `scripts/schema-runtime.mjs` — **unchanged**
  (S5: one mechanism). The gate already orders `schema-build` before
  `root-suite`, and the loader's missing-module message keeps its contract.
- Repository state: the roadmap `## Fixes` row's status and rendered summary,
  the regenerated projection and the session journal entry ship in this change.

## Retirements

Strictly additive — no surface is retired, removed or renamed. Nothing to
inventory: the diff adds one exported predicate, one build seam, one decision
function and their cases to a file that already exists.

## Non-goals

- **The per-file path.** `bun test scripts/<file>.test.mjs` run directly still
  reads whatever `dist/` is on disk. S5 asks for one mechanism in one entry
  point; a stale refusal added to `schema-runtime.mjs` was the *other* branch of
  that choice, and shipping both would be two mechanisms answering one ask.
- **Detecting staleness by content.** The predicate compares the trees it can
  see (output files present, source mtimes newer than the build's). A build
  stamp written by the build itself is the deterministic content answer, and it
  costs a second writer inside a package this unit does not own; recorded as
  `## Future`.
- **Rebuilding the crate's build.** `packages/agentic-workflow` already rebuilds
  the schema package in its own `test` scripts; nothing here duplicates that.
- **A `--no-build` flag.** A flag exists only for a caller that has a reason to
  read a mismatch; the design has none.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood / contained / resumable
- **Named high-risk item** — none — not a high-tier unit

Verdict `risk-tier-verdict@1` for the change's executable path,
`bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--paths scripts/run-root-suite.mjs`: `1 path(s) carry executable content`,
`signals: []`.

## Future

- **2026-11-16 — a build stamp instead of mtimes** (`open`). The schema package's
  `build` script could write `dist/.build-stamp.json` (digest of `src/` +
  `tsconfig.json`), which makes "is this build current?" a content question
  instead of an mtime one and would let a per-file run refuse a stale `dist/`
  without the runner. Deferred: it needs a writer inside the schema package and
  its own unit.

## Future cost

- Adding a step to the schema package's `build` script is now visible to the
  root gate: the runner runs the *declared* script, so a verification step added
  there runs before every root-suite dispatch. It binds whoever edits
  `packages/agentic-workflow-schema/package.json`'s `build`.
- Anything that makes the schema package slower to compile is paid once per
  root-suite invocation on a stale tree, never on a fresh one. It binds the same
  editors.

## Applicable tests

- `scripts/run-root-suite.test.mjs` — the predicate cases (throwaway trees), the
  dispatch-decision cases (injected seam), and the wire case on the real runner.
- `scripts/local-gate.test.mjs` — the step graph, unchanged by this unit and run
  as the differential's other half.
- The root suite as a whole (`bun scripts/run-root-suite.mjs`) is the integration
  proof: it is the command the change repairs.

## Known pre-existing issues

- `packages/agentic-workflow-schema/dist/` is absent in a fresh worktree and
  `bun install` does not build it. **Does not affect** this unit: the predicate
  reports `missing` and the runner builds it — the exact case the fix exists for.
  Provisioning stays `node scripts/setup-env.mjs`'s job.
- The crate's own suites read the same `dist/` and rebuild it in their
  `test` scripts. **Does not affect** this unit: that path already repairs
  itself, which is the precedent this unit follows for the root runner.

## Acceptance criteria

- **AC-S1** — The unit is frozen before the implementation lands: the ledgers,
  the criteria and the tasks are in this document at the first code commit, the
  work arrives as conventional commits, and the red test commit precedes the
  implementation commit. Check:
  `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/571-root-suite-stale-dist/SPEC.md` prints `verdict PASS` and exits 0,
  and `bun scripts/red-first.mjs` prints `verdict: PASS` with
  `scripts/run-root-suite.mjs` in neither finding nor the suite absent from the
  `after the cutoff` set.
- **AC-S2** — A dispatch never hands the suites a `dist/` built from another
  source set: when `dist/` is missing, incomplete or older than `src/`, the
  runner rebuilds it before the pool starts and names the rebuild on stderr;
  when it is current, it dispatches without building. Check:
  `bun test scripts/run-root-suite.test.mjs` exits 0 (the predicate cases and
  the dispatch-decision cases) plus the foreground stale-tree reproducer
  recorded in `## Log`.
- **AC-S3** — The four `dist/` states are decidable from the tree: a missing
  entry, a source without its emitted `.js`, an output older than its sources,
  and a current build each report their own verdict. Check:
  `bun test scripts/run-root-suite.test.mjs` exits 0 (one case per verdict).
- **AC-S4** — What a contributor reads changes from a semantic-looking red to a
  statement of what happened: a rebuilt tree prints one `root gate:` line on
  stderr and stdout keeps its exact shape; a tree whose package manager is
  absent prints why and dispatches unchanged; a schema package that does not
  compile stops the run with the compiler's own output and a non-zero exit, and
  no suite runs against the previous build. Check:
  `bun test scripts/run-root-suite.test.mjs` exits 0 (the decision cases and the
  wire case), and the foreground runs recorded in `## Log`.
- **AC-S5** — Exactly one mechanism: `scripts/schema-runtime.mjs` and
  `scripts/local-gate.mjs` are byte-identical to the base commit. Check:
  `git diff --stat 44a20ab6 -- scripts/schema-runtime.mjs scripts/local-gate.mjs`
  prints nothing.
- **AC-S6** — The gate path stays safe and stays the same command: the runner
  issues no build on a tree the gate already built, and the gate's own step
  graph is untouched. Check: `bun scripts/local-gate.mjs` exits 0 with
  `schema-build` preceding `root-suite`, and the fresh-tree case in
  `scripts/run-root-suite.test.mjs` asserts zero spawned builds.

## Tasks

- P1 — Freeze this unit doc with its embedded ledgers and the acceptance
  criteria, before the first implementation line (validator:
  `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/fix/571-root-suite-stale-dist/SPEC.md` prints `verdict PASS` and exits 0)
  (Implements: S1, S5)
  - Relevant files: docs/fix/571-root-suite-stale-dist/SPEC.md
- P2 — Land the red corpus alone: one case per `dist/` verdict, one per dispatch
  decision, and the wire case on the real runner, observed failing on the
  pre-change module (validator:
  `bun test scripts/run-root-suite.test.mjs` exits 1 before P3 and 0 after, with
  both runs recorded in `## Log`)
  (Implements: S2, S3, S4, S5)
  - Relevant files: scripts/run-root-suite.test.mjs
- P3 — Implement the predicate, the build seam and the dispatch wiring in the
  runner (validator: `bun test scripts/run-root-suite.test.mjs` exits 0 with
  0 fail)
  (Implements: S2, S3, S4, S5)
  - Relevant files: scripts/run-root-suite.mjs
- P4 — Differential: drive the touched command from a base-commit copy and from
  this change in `mktemp -d`, declaring every output difference (validator:
  `diff -u /tmp/aw571-base.txt /tmp/aw571-change.txt` exits 1 listing only the
  one new `root gate:` stderr line, with no stdout line and no exit-status line
  in the diff)
  (Implements: S2, S4, S6)
- P5 — Documentation and repository state in the same change: the `## Verification`
  clause inside the guide's line ceiling, the roadmap row's status and rendered
  summary, the regenerated projection and the journal entry (validator:
  `bun scripts/check-skill-context.mjs --documents` exits 0 and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S4)
  - Relevant files: AGENTS.md, docs/ROADMAP.md, docs/generated/
- P6 — Verification: the deterministic gates in the foreground, every obligation
  closed (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The defect is real and was observed: a stale `dist/` produced 6 red assertions in `scripts/triage-rescope.test.mjs` (`TRIAGE_VERDICTS is a published const array`, `TRIAGE_CRITERIA_PROVENANCE is not iterable`), green after `bun run build` | issue [#571](https://github.com/gtrabanco/agentic-workflow/issues/571) body (`Checked:` line) + `docs/audits/2-2026-11-16.md` F4 | read 2026-11-16 (this session) | O1, O6; the whole change |
| PE-002 | committed-source | The runner dispatches each suite with `cwd: REPO_ROOT` and `process.execPath`, and does nothing about `dist/` before the pool starts; the suites that assert machine semantics import the built package through `scripts/schema-runtime.mjs`, whose only guard is a module-scope `existsSync` on `dist/index.js` | `scripts/run-root-suite.mjs` (`spawnReal`), `scripts/schema-runtime.mjs:44-56` at `44a20ab6` | read 2026-11-16 (this session) | O1, O4, O6 |
| PE-003 | committed-source | The gate already orders the build before the suites: `DEPS["root-suite"] = ["workspace-install", "schema-build"]` and the `schema-build` step runs `bun run build` in the package directory — so only the standalone path is unguarded | `scripts/local-gate.mjs:191-199`, `:388` at `44a20ab6` | read 2026-11-16 (this session) | O7; S6; `## Non-goals` |
| PE-004 | committed-source | The repository already repairs the build at a test entry point: both crate scripts run the schema package's build first (`bun run --cwd ../agentic-workflow-schema build && …`) — the mechanism S5 leaves to the design step has a precedent in the tree | `packages/agentic-workflow/package.json` `scripts.test` / `scripts.test:node` | read 2026-11-16 (this session) | O1; D1 |
| PE-005 | committed-source | The build the runner must run is the package's declared script, not a copy of it: `build: "tsc"`, resolved by the manager that runs the script | `packages/agentic-workflow-schema/package.json` `scripts.build`, `tsconfig.json` (`include: ["src"]`) | read 2026-11-16 (this session) | O1, O2; D2 |
| PE-006 | measured-baseline | A rebuild is cheap enough to be unconditional in principle but the gate's own pool makes it unsafe there: the full `tsc` build measured **0.45 s** wall in this worktree, while `scripts/run-root-suite.test.mjs` spawns the real runner 6 times inside the gate's concurrent worker pool — an unconditional rebuild would rewrite `dist/` under suites that import it | this session: `time bun run --cwd packages/agentic-workflow-schema build`; `rg -n "spawnSync\(process.execPath, \[SCRIPT" scripts/run-root-suite.test.mjs` | run 2026-11-16 (this session) | O2, O4; D3 |
| PE-007 | measured-baseline | `tsc` (non-incremental, this package's config) rewrites every emitted file on every run: after `touch src/batch-plan.ts` + a rebuild, `dist/vocabularies.js` — a file whose content did not change — took the new mtime. So a just-built tree is never reported stale by an mtime comparison | this session: `stat -c '%y %n' dist/*.js` before and after the rebuild | run 2026-11-16 (this session) | O2; D3 |
| PE-008 | measured-baseline | `spawnSync` distinguishes "the binary does not exist" from "it ran and failed": a missing executable resolves `status: null, error.code: "ENOENT"`, while a ran-and-failed command resolves `status: 2, error: undefined` — the two states O5 and O6 need | this session: `spawnSync("definitely-not-a-package-manager-xyz", …)` and `spawnSync("bash", ["-c","exit 2"])` | run 2026-11-16 (this session) | O5, O6 |
| PE-009 | measured-baseline | The reproduction is faithful: building `dist/` from `6e9e9e45~1` (the commit before `TRIAGE_VERDICTS` landed) with `HEAD`'s `src/` in place makes the audit's exact failure reappear — `node scripts/run-root-suite.mjs scripts/triage-rescope.test.mjs` exits 1 with `TRIAGE_VERDICTS is not iterable` | this session: `git archive HEAD | tar -x` in `/tmp`, then a build of `6e9e9e45~1`'s `src/` | run 2026-11-16 (this session) | O1, O6 |
| PE-010 | committed-source | The guide's ceiling is spent exactly: `AGENTS.md` measures 708 lines against `linesMax: 708`, so the documentation clause must fit the existing bullet rather than add a line | `bun scripts/check-skill-context.mjs --documents` (708 lines / 563 prose / 12,349 est) + `docs/workflow/SKILL_CONTEXT_BUDGETS.json` `documents.files["AGENTS.md"]` | run 2026-11-16 (this session) | O8; P5 |
| PE-011 | committed-source | Only two callers exist: `scripts/local-gate.mjs`'s `root-suite` step and the guide's prose. No script parses the runner's stdout, so a new line on stderr changes no consumer | `rg -n "run-root-suite" --glob '!docs/**' --glob '!*.test.mjs'` → `local-gate.mjs`, this runner, `test-route.mjs` (a comment), `invocation-drift.mjs` (literal pins) | read 2026-11-16 (this session) | O4, O7 |
| PE-012 | committed-source | `tsc` is not on `PATH` in this repository; the build resolves from the package's own `node_modules/.bin/tsc`, present in every provisioned workspace layout (`bun install --frozen-lockfile` creates it here), which is why the runner runs the declared script through a manager instead of spawning a compiler path | `ls packages/agentic-workflow-schema/node_modules/.bin/tsc`; `npm run build` and `bun run build` both produced `dist/` in this worktree | run 2026-11-16 (this session) | O1, O5; D2 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S5 | a root-suite dispatch never hands the contract suites a `dist/` built from another source set: when the build is missing, incomplete or older than `src/`, the runner rebuilds it before the pool starts | P3 | P3 | direct application (this session) | `bun test scripts/run-root-suite.test.mjs` exits 0 (the dispatch-decision cases) and the stale-tree reproducer run in scratch exits 0 with the rebuild line on stderr | E line in SPEC `## Log` | planned |
| O2 | S3 | the four `dist/` states are decidable from the tree alone: missing entry, a source without its emitted `.js`, an output older than its sources, and a current build | P3 | P3 | direct application (this session) | `bun test scripts/run-root-suite.test.mjs` exits 0 (one case per verdict, on throwaway trees) | E line in SPEC `## Log` | planned |
| O3 | S5 | exactly one mechanism lands: `scripts/schema-runtime.mjs` and `scripts/local-gate.mjs` are untouched by this unit | P3 | P3 | direct application (this session) | `git diff --stat 44a20ab6 -- scripts/schema-runtime.mjs scripts/local-gate.mjs` prints nothing (exit 0, empty) | E line in SPEC `## Log` | planned |
| O4 | S2, S4 | a current build is never rebuilt and never reported: on a fresh tree the runner spawns no build and says nothing about the schema, and its stdout keeps the exact `root gate:` header plus `PASS`/`FAIL`/`KILLED` lines | P4 | P4 | direct application (this session) | the differential comparison in `mktemp -d` lists only the declared stderr delta, with stdout and exit status identical, and `bun test scripts/run-root-suite.test.mjs` exits 0 (the fresh-tree case asserts zero spawned builds) | E line in SPEC `## Log` | planned |
| O5 | S4 | a dispatch that cannot rebuild keeps the previous behaviour and says so: an absent package manager prints one line naming the manual command and the suites still run | P3 | P3 | direct application (this session) | `bun test scripts/run-root-suite.test.mjs` exits 0 (the unavailable-manager case) | E line in SPEC `## Log` | planned |
| O6 | S4, S2 | a schema package that does not compile stops the run: the compiler's own output is printed and the exit is non-zero, so no suite reports contract results from the previous build | P3 | P3 | direct application (this session) | `bun test scripts/run-root-suite.test.mjs` exits 0 (the failed-build case) and the scratch tree with a type error exits 1 naming the compiler error | E line in SPEC `## Log` | planned |
| O7 | S6 | the gate path is unchanged: the runner issues no build on the tree `schema-build` just produced, and `local-gate`'s step graph still orders `schema-build` before `root-suite` | P6 | P6 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 and `git diff --stat 44a20ab6 -- scripts/local-gate.mjs` prints nothing | G line in SPEC `## Log` | planned |
| O8 | S1, S4 | documentation and repository state ship in the same change: the `## Verification` clause fits the guide's line ceiling, the roadmap row carries its status and rendered summary, the projection is fresh and the journal entry is written | P5 | P5 | direct application (this session) | `bun scripts/check-skill-context.mjs --documents` exits 0, `bun scripts/docs-generate.mjs --check` exits 0, `bun scripts/roadmap-settle.mjs` exits 0 | E line in SPEC `## Log` | planned |
| O9 | S1 | the red corpus precedes the implementation and both runs are observable: the suite fails on the pre-change module and passes after it | P2 | P2 | direct application (this session) | `bun test scripts/run-root-suite.test.mjs` exits 1 at the red commit and 0 at the implementation commit, and `bun scripts/red-first.mjs` prints `verdict: PASS` | E line in SPEC `## Log` naming both commits | planned |

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the request, verbatim:
  ```
  Apply to this repository: issue #571
  ```
- **L2** — 2026-11-16, the issue, verbatim:
  ```
  Origin: product audit 2, finding F4
  (docs/audits/2-2026-11-16.md)

  Checked: observed 2026-11-16 — `node scripts/run-root-suite.mjs` → 113 PASS / 1 FAIL, exit 1, with 6 red assertions in `scripts/triage-rescope.test.mjs` naming `TRIAGE_VERDICTS is a published const array` / `TRIAGE_CRITERIA_PROVENANCE is not iterable`; `packages/agentic-workflow-schema/dist/vocabularies.js` had zero `TRIAGE_VERDICTS` matches; after `bun run build` in the schema package the same suite is 20/20 green; `scripts/schema-runtime.mjs` read (guards missing dist, not stale dist).

  ## Evidence

  The documented verification command `node scripts/run-root-suite.mjs` runs schema-contract tests against whatever `packages/agentic-workflow-schema/dist/` sits on disk. `dist/` is a gitignored build output; `scripts/schema-runtime.mjs` names the *missing-module* precondition (fresh-clone failure) but nothing guards the *stale-module* case. The local gate orders `schema-build` before the suites, so the gate path is safe — but the standalone runner path (what the AGENTS.md "Verification" section cites) reports false semantic reds that look exactly like a broken contract change.

  ## Fix (mechanism is the design step's call)

  Either rebuild the schema package before the suites in `run-root-suite.mjs`, or give `schema-runtime.mjs` a named stale-module precondition (e.g. compare a committed marker against the built output and fail with "run bun run build", mirroring the existing missing-module message). One mechanism, red-first suite, sibling `.test.mjs`.
  ```

## Next

The owner's external verdict on the diff: `scripts/run-root-suite.mjs`, its
sibling suite, the guide clause and this document. After it: the PR, the
roadmap row's `done · [#N](<url>)` settle and the merge.

## References

Issue [#571](https://github.com/gtrabanco/agentic-workflow/issues/571); its
origin is finding F4 of [product audit 2](../../audits/2-2026-11-16.md). The gate
this unit leaves untouched is
[local-first gate](../local-first-gate/SPEC.md), and the build it repairs is
declared in `packages/agentic-workflow-schema/package.json`.

## Branch

`fix/571-false-semantic-reds`

## Depends on

none.

## Regression scope

| Scenario | How it is verified |
|---|---|
| the gate's `root-suite` step still runs every suite and forwards the first failing status | `bun scripts/local-gate.mjs` exits 0; `bun test scripts/run-root-suite.test.mjs` exits 0 (the pool cases, untouched) |
| the runner's stdout contract (header, `PASS`, `FAIL`, `KILLED`, verbatim exit) is unchanged | the existing end-to-end cases in `scripts/run-root-suite.test.mjs` assert the same lines and exit statuses |
| a `--suite-timeout`, `--suite-mem-cap`, `--jobs`, `--bail` invocation behaves exactly as before | the bound cases in `scripts/run-root-suite.test.mjs` exit 0 unchanged |
| an unprovisioned tree (no `node_modules`) still runs the suites it can | the unavailable-manager case asserts the dispatch continues and the line names the manual command |
| `scripts/schema-runtime.mjs`'s missing-module message is untouched | `git diff --stat 44a20ab6 -- scripts/schema-runtime.mjs` prints nothing |
