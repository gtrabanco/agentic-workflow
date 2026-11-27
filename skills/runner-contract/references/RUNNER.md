# The runner — one invocation, one pin, one closed set

> Owner of the runner's invocation contract (feature 91, issue #352; the closed
> set and the symbolic citation are issue #555's). Every skill that runs a
> deterministic workflow command cites this file for the **launcher** and the
> **version** and nothing else; the command itself it states with the symbolic
> form below.

## The invocation

Copy this line, replace `<subcommand>` with the command the skill names, and
append its arguments. The pin is stamped at release time by this repository's release tool;
`scripts/normative-drift.test.mjs` recomputes it against the crate's own
`package.json` and fails closed on a mismatch.

```text
runner-pin@1
# channel: stable
field | value
invocation | bunx @gtrabanco/agentic-workflow@4.10.1 <subcommand> [args...]
```

```text
runner-set@1
candidate | requires | invocation
bunx | bun >= the crate's engines.bun | bunx @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
npx | node >= the crate's engines.node | npx --yes @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
pnpm dlx | pnpm on PATH, and node >= its floor when node is present | pnpm dlx @gtrabanco/agentic-workflow@<pin> <subcommand> [args...]
```

The set is **closed and ordered**: the first candidate present and at or above
its floor launches the package, and a later one is a fallback only — never a
second launch, never a probe that guesses. The floors are the crate's own
`engines` (its manifest is the authority, the numbers are not restated here), and
a standalone `pnpm` ships its own runtime, so the node floor binds it only when a
node is present. `npx` carries `--yes` because a skill is non-interactive: the
install prompt would be a hang, not a question.

The same order is implemented **once**, in
`packages/agentic-workflow/src/runner/resolve.mjs`: `runner resolve` prints the answer a caller spawns, and
`packages/agentic-workflow/test/runner.resolve.test.mjs` refuses a drift between
this table and that module. A new candidate is one row here plus one entry there,
in the same change — the set is a contract, not a list of habits.

## What a skill cites

A skill that runs a runner command states it with the symbolic form and names
this contract beside it:

```text
runner <subcommand> [args...]
```

`runner` means "the first candidate in The invocation's closed set that is
eligible, at the pin above". A skill never spells a launcher and never restates
the order: the words live here, the choice lives in code, and the two cannot
drift apart.

The ban is enforced, not remembered (issue #710): `scripts/runner-launcher-drift.mjs`
reads the shipped pages under `skills/`, `template/` and `docs/workflow/`, and a
code context that spells the scope-less launcher — a fenced line, an inline span,
a line beginning with it — is a `bare-launcher` finding naming the file and the
line. What the spelling names is the CLI's own registry (`HELP_REGISTRY`) and
the form sanctioned here, so a subcommand added to the crate is covered the day
it lands and a contract that stops declaring this form fails the pin closed. The
scope-less npm name resolves to nothing — a `0.0.0` placeholder without a `bin`
— which is why the ban is absolute for an instruction and why the exact-version
spelling in **The invocation** (above) stays legal.

`<pin>` is read from this file — never restated, never guessed, never replaced by
`latest`. A skill that hard-codes a version re-opens the per-release maintenance
this contract exists to remove, and `scripts/normative-drift.test.mjs` fails
closed on a pin that drifts from the crate's own version.

## What the pin buys: one download, then a cache hit

The first run of a candidate downloads `@gtrabanco/agentic-workflow@<pin>`; every
run after it is a cache hit — `bunx` keeps its installs in Bun's global cache for
future use, `npx` installs a specifier's package into a folder of the npm cache,
and `pnpm dlx` reuses its own cached install. The exact pin is what makes that
cache correct rather than merely convenient: it names one immutable train, so
the behaviour a skill describes and the behaviour a caller gets are the same
release until a cut moves the pin and the package together. `latest` would let
the cache serve a contract nobody wrote; an exact pin cannot.

## The local and canary override

Testing a local build never touches the pin. Set the override in the
environment, in the same shape `AGENTIC_WORKFLOW_RUNTIME` uses:

```text
AGENTIC_WORKFLOW_RUNNER="bun /absolute/path/to/packages/agentic-workflow/bin/agentic-workflow.mjs"
```

- The value is one command, tokenised on whitespace, so the spaced form above is
  the legal form — and every consumer honours it: the crate's resolver, the
  distributable action in `journal/`, and the pi package. An empty value is the
  unset spelling.
- A skill or a test that finds `AGENTIC_WORKFLOW_RUNNER` set runs **that**
  command instead of the closed set, and says so in its output.
- Unset, the closed set decides. The repository's own suite sets it to the
  working tree's bin, which is how the crate is dogfooded before a cut.
- **This repository's authoring checkout arms the override by default**:
  `scripts/setup-env.mjs` writes a gitignored `.pi/vehicle.env` naming this
  checkout's bin, and the tool doctor's `dogfooding-vehicle` row reports the state
  (owner: `docs/workflow/SETUP.md` § The vehicle). This file stays the only home
  of the value's shape and of what honours it.
- A canary cut stages its version into this file for the duration of the publish,
  records the staged tree as the canary tag, and restores the worktree
  afterwards, so the committed pin always names a stable release. The skills
  installed at that tag therefore cite the canary they shipped with. A project
  that never upgrades keeps the pair (skills at vX, package at vX) coherent with
  zero maintenance: the pin is exact, so vX stays installable forever.

### When the pin is older than the command

An install at a branch ref (`#main`) can be ahead of the last canary cut: the
skills cite a service the pinned stable does not carry. The pin is exact and
immutable by contract, so the run is refused rather than silently resolved —
`EDIT REFUSAL — Unknown service: <name>` names the crate it ran and the two
repairs: install the canary tag at or after the service
(`npx skills add …#v<canary tag>`), or point `AGENTIC_WORKFLOW_RUNNER` at a crate
that carries it. The next canary cut makes the branch tree coherent again.

## In a pi session

```text
runner-mapping@1
field | value
in-pi | in a pi session `runner <subcommand>` is the `agentic_workflow_run` tool (or its typed twin), never a shell command — no `runner` executable; `subcommand` is the service alone, every later token an `args` entry
discovery | the tools are deferred: surface them with `tool_search` over the `agentic-workflow` namespace, or call one by name in codemode
outside-pi | outside pi, the launcher and pin come from `runner-contract/references/RUNNER.md`
```

This block is the mapping's one owner (issue #696). A pi session that never opens
this file still gets it: `packages/pi-agentic-workflow/scripts/bundle-skills.mjs`
injects it after the frontmatter of every staged `SKILL.md` that cites the
symbolic form, and the pi extension's bash seam answers a literal `runner …`
shell call with the same bytes. Nothing else owns the wording — an edit here
reaches the bundle at the next build, and a hand-edited copy fails its suite.

The shape row is why a call body composes the way it does (issue #734): the
tool's `subcommand` is one argv token, so it carries the service and nothing
else — `runner journal write --kind narrative` becomes `subcommand: "journal"`
with `args: ["write", "--kind", "narrative"]`. A spaced `"journal write"` is a
service the crate does not have, which is the refusal the row prevents.

Pi resolves the runner for you, so nothing here asks a session to pick one. The
crate ships as this package's own dependency and the extension spawns its bin
under the runtime that launched pi (`createRequire`, never a download); the
resolver above is the fallback for a tree where that dependency is missing. The
closed set exists for the standalone skills and for code without an installed
crate.

## Subcommands

One package, one bin. The editor services and the runtime commands share it;
the runner half is this table, and a name outside it is a usage error, never a
shell fallback.

| Subcommand | What it runs |
|---|---|
| `runner resolve` | the programmatic launcher answer — `source`, `program`, `argv` and every candidate it tried; exit 2 with `RUNNER REFUSAL —` when none of the set resolves |
| `workflow-status` | the workflow sensor — the Envelope v2 result the drivers consume |
| `phase-lint <plan-path>` | the phase linter over a unit doc's `## Tasks` |
| `diff-guard --base <ref>` | the diff-size guard |
| `pre-execution-snapshot <build\|verify\|contract>` | the pre-execution snapshot and its drift check |
| `needs-input <unit-dir> [--workspace <dir>]` | the open-question sensor — the third route (`init-workspace:<class>`) is verified against the workspace's substrate census before it is granted |
| `substrate check --workspace <dir> [--guide AGENTS.md] [--json]` | the substrate coverage gate — one row per class (`present`/`declined`/`absent`), the summary and the verdict |
| `ledger-provenance <ledger> [--check\|--annotate]` | the fold-queue recount |
| `quality-metrics [--window <days>] [--until <instant>] [--repo <dir>] [--out <path>]` | the project-quality sensor — the DORA four keys plus the reversion ratio as one `quality-metrics@1` document (definitions in the crate README) |
| `forge-read <issue\|pr> <number> [--comments] [--reviews] [--json]` | the guarded forge read — one issue or pull request, its threads on request, every content field through the content guard and printed as the fenced delivery (or as the `forge-read@1` envelope with `--json`); `forge-read shim <install\|check\|exec>` is the ad-hoc `gh` interceptor the same route drives |
| `unit-route <unit\|issue> [--triage <unit> [--json]]` | the unit router and the triage step list |
| `skills <discover\|register\|inventory> [flags]` | the skill-discovery route's machine half — the screen, the consented install decision and the registration/decay inventory (issue #591; grammars in the crate README) |
| `relevant-files <unit-doc> [--phase P<k>\|all] [--changed <a,b> \| --base <ref>]` | the phase read-set resolver and its changed-file discipline — the paths a phase must read, and the one failure it reports (issue #269) |
| `scaffold-contract <check\|authoring> [<unit-doc>] [--workspace <dir>] [--json]` | the scaffold contract that travels — a project's exported unit-doc templates compared with the installed release's section contract, and the same check on a staged unit doc at emission (issue #701) |
| `roadmap-settle [--root <dir>] [--json]` | the offline roadmap done-settle gate — a doc carrying a PR URL must have its row settled to `done` with the same link (issue #316) |
| `docs-generate [--root <dir>] [--check\|--dry-run]` | the generated documentation projection — the pages, plus the roadmap tables it keeps in sync, and the drift report `--check` prints |
| `docs-generated-merge [--install [--repo <dir>]] \| <base> <ours> <theirs> [marker-size] [path]` | the generated-projection merge driver — the incoming side, or a fail-closed refusal on a path it does not cover |
| `shared-merge [--install [--repo <dir>]] \| <class> <base> <ours> <theirs> [marker-size] [path]` | the shared-document merge drivers — one class registry for the roadmap, the budgets, the frozen repository state, the journal and the telemetry ledger |
| `test-impact --base <rev> [--paths <p>…] [--references <file>]` | the test impact set — the suites a change can affect, or `empty`, with the reason (issue #356) |
| `delivery-conditions --close-check <issue> \| --sweep [--issues-file <json>] [--repo <owner/name>] [--root <dir>] [--limit <n>] [--json]` | the delivery-condition carrier — the close-time guard that refuses covering an issue with one that is still open, and the sweep that re-judges every recorded condition against the issues it cites (issue #704; the report block is in the crate README) |
| `session-close render \| close` | the session's mechanical half — the entry's facts, the append-only proof and the alone-commit (issue #182) |
| `findings-corpus` | the retrospective findings corpus — the one join `coverage-gap` and `dimension-regression` build on (issue #437) |
| `correction-budget` | the correction budget as a measurement — batch size, bounded budget and the typed stop (issue #437) |
| `differential-baseline` | the differential baseline — the base revision materialized for a real comparison (issue #301) |
| `review-state` | the per-unit review-state ledger — which axes ran, at which head (feature 32) |
| `scope-manifest` | the digest-bound scope manifest — `sign` and `verify` (feature 25) |
| `review-receipt` | the SHA-bound review receipt — `emit`, `verify`, `post` (feature 25) |
| `repair-receipt <emit\|verify> [flags]` | the fold's typed repair receipt — `emit` derives and posts the encoded re-review route, `verify` re-derives every claim and answers merge currency (issue #698) |
| `gate-receipt` | the gate receipt — `run` records the gate's evidence, `verify` re-derives it (fix #338) |
| `adversarial-verdict` | the adversarial pass's checker over its record and the reviewed diff (issue #358) |
| `audit-pr-gate <evaluate\|hygiene\|comment> [flags]` | the merge gate — the verdict from the review receipt, the gate receipt and the terminal hygiene, plus its one idempotent marker writer |
| `unit-lineage --unit <slug> [--root <dir>] [--json]` | the lane-era lineage gate — the triage re-derived from the facts, `BLOCKED` when the reason no longer follows (issue #305) |
| `dependency-advisory-pass [--root <dir>] [--json]` | the dependency advisory scan — pins drifted from the registry, with a declared degradation when the registry cannot be read (feature 67) |
| `skill-context [<skill>…] [--routes] [--documents] [--manifest-only] [--json]` | the context-budget sweep — every skill and reference measured against its declared ceiling (issue #471) |
| `promise-coherence [<path>…] [--json]` | the promise-coherence pass — a "measured at the head" claim re-measured, never assumed (issue #305) |
| `batch-scheduler [--root <dir>] [--issues-file <json>] [--json-only]` | the batch planner — the parallel-execution batches as the `batch-plan@4` envelope (feature 88) |
| `test-route (--check <path> \| --list) [--map <path>]` | the bounded gate planner — which suites a changed path needs, or the full suite when it cannot prove less (issue #318) |
| `prose-gate-inventory [--root <dir>] [--json]` | the gate-inventory reader — the carriers, reasons, tiers and priorities the audit joins over (issue #441) |
| `coverage-gap [--root <dir>] [--json]` | the forward-looking coverage join — criterion, class and detector gaps as one typed receipt (issue #590) |
| `decision-promotion [--root <dir>] [--json]` | the decision-promotion sweep — a cross-unit decision that names no owner doc is a finding (issue #650) |
| `dimension-regression [--base <ref>] [--root <dir>] [--json]` | the dimension-regression gate — a review surface touched without a recorded run (issue #590) |
| `journal-corpus [--root <dir>] [--json]` | the journal corpus reader — the session journal joined into the audit's corpus (issue #616) |
| `repository-state [--root <dir>] [--json]` | the Normalized Repository State reader — what is frozen and what a contradiction is (feature 18) |
| `residual-classify <surface> [--inventory --base <rev>] [--root <dir>] [--json]` | the residual classifier — consumed, promised, orphan or half-built, with the consuming line named (issue #340) |
| `restatement-sweep [--root <dir>] [--json]` | the restatement sweep — a seeded rule worded a second time outside its owner (issue #646) |
| `workflow-doctor <mine\|battery\|bundle\|route\|publish> [--root <dir>] [--json]` | the ceremony-failure doctor — the project's own record mined, anonymized and routed upstream with consent (issue #703) |
| `test-obligation-tags [--root <dir>] [--sweep] [--json]` | the test-obligation tag gate — every suite declares what it protects and what it proves (issue #596) |
| `retention-debt [--root <dir>] [--json]` | the retention debt sensor — proved-merged units still carrying the full carrier (issue #651) |
| `setup-env [--check] [--root <dir>]` | the authoring toolchain check and its consent-gated install (the bootstrap form stays `scripts/setup-env.mjs`: it provisions bun, so it cannot require the CLI) |
| `ceremony <object> <op> [flags...]` | the closed ceremony CLI — `workspace`, `docs`, `findings`, `ledger`, `unit`, `plan`, `tier`, `passive`, `review`, `acceptance`, `refutation`, `fusion`, `delta`, `progress`, `evidence`, `commit`, `roadmap`, `pr` (see the crate README's ceremony row for the live object set) |
| `unit-doc`, `roadmap`, `changelog`, `budgets`, `manifest`, `config` (including `config default`, the materialization the console and `init-workspace` run — issue #600), `doc`, `section`, `relay`, `memory`, `log`, `journal`, `resolve-passes`, `verify`, `resources`, `provision` | the typed file services and the other guards (see the crate README) |

## Exit codes

Two contracts coexist and neither is negotiable:

- **Editor services and the runner's guards**: `0` success, `1` usage error,
  `2` refusal or ceremonial block — a refusal prints
  `EDIT REFUSAL — <reason>` (or the service's own `<SERVICE> REFUSAL —` line)
  **before** any byte moves.
- **The ceremony CLI**: `0` success with JSON on stdout, `1` usage error as
  JSON, `2` a ceremonial block. A sensor keeps its own published code
  (`needs-input`: `0` answered, `1` refused, `2` usage; `phase-lint`: `0` pass,
  `1` blocked or usage).

A caller reads the exit code and the fixed block; it never parses stderr to
decide what happened.
