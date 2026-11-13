---
type: fix
scope: small
ac-hash: e71d2943a2e2465886f948da16c3a92fd6962d239f6ed009d498909a3af620bd
roadmap_summary: Issue [#531](https://github.com/gtrabanco/agentic-workflow/issues/531): the Engram provisioning registered an MCP server beside the native `gentle-engram` package (duplicating `mem_*` and undermining native-only writes) and its `binary-missing` refusal named a companion install that cannot supply the core binary — the module now reads Pi's two `settings.json` scopes, skips with `native-active`/`external-server`, honours `ENGRAM_BIN`, and names all three resolution surfaces.
---

# fix/531-engram-native-skip-remote-surfaces

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change. XS/S sizing: the
> two planning ledgers are embedded below, never a sibling file.

## Issue

`#531` — "Engram MCP registration is redundant with the native gentle-engram
extension and reports a misleading install route". The PR closes it via
`Closes #531`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #531

**S2 — The native package already provides the tools; register nothing and say so once.**
> - When the native `gentle-engram` package is already installed, pi-agentic-workflow registers **nothing** (MCP registration would duplicate the native `mem_*` tools and undermine native-only agent writes) and says so once, informatively.

**S3 — The refusals separate the core binary from the Pi companion.**
> - The refusal messages distinguish the two install surfaces: the **core binary** (must be on `PATH` or named by `ENGRAM_BIN`) from the **Pi companion** (`pi install npm:gentle-engram@latest`).

**S3a — The consent instruction names the file the switch is read from.**
> fix the new finding

`memory` is a base-config section (`packages/agentic-workflow-schema/src/config.ts:241`,
merged by `src/config/load.ts:158` from `agentic-workflow.json`) and the
extension file's `ROOT_KEYS` (`src/config/schema.ts:39-53`) has no `memory` key,
so the previous instruction — `set "memory": { "engram": true } in
pi-agentic-workflow.json` — sent an operator to a file that refuses the key and
lands them on `config-invalid`. Same class as S3: every route a message names has
to work.

**S4 — A set `ENGRAM_URL` is a deliberate configuration, not a defect.**
> - A set `ENGRAM_URL` (externally managed or remote server) is reported as a deliberate configuration — no MCP registration (stdio MCP cannot use it), no `binary-missing` warning.

**S5 — Document the remote/external-server surface beside the consent switch.**
> - The remote/external-server usage (`ENGRAM_URL`, `ENGRAM_BIN`) is documented beside the consent switch.

**S6 — Native-package detection reads the files Pi reads, injected and testable.**
> - [ ] AC4 — Detection of the native package reads the same files Pi reads for packages (user `settings.json`) and is injected/testable like the existing binary/declaration lookups; no Pi session is needed in tests.

**S7 — The behaviours that stay correct keep their tests green.**
> - [ ] AC6 — Existing behaviours that remain correct keep their tests green: consent-first ordering, `already-declared`, `unsupported-host`, `registered` read-back.

## Impact

- `packages/pi-agentic-workflow/src/extension/engram.ts` — two new statuses
  (`native-active`, `external-server`), the two-scope `settings.json` package
  reader, the `ENGRAM_BIN` override in the binary lookup, and the rewritten
  `binary-missing` refusal. This is the module that owns every provisioning
  decision, so both new branches and the resolution change land here.
- `packages/pi-agentic-workflow/src/extension/index.ts` — the `session_start`
  listener is the module's only caller: it passes the two-scope package list and
  the session's `ENGRAM_URL`, and it decides the notification level, which is
  where "informatively" (S2) is observable.
- `packages/pi-agentic-workflow/test/engram-provision.test.mjs` — the pure
  contract: ordering, the readers, the messages, the `ENGRAM_BIN` override.
- `packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` — the shipped
  entry through Pi's double: the level the operator sees and the two-scope
  detection with real files, plus the env isolation the new `process.env` read
  makes necessary (the suite must not depend on whose shell ran it).
- `packages/pi-agentic-workflow/README.md` — the memory-substrate section: the
  three surfaces, the two new statuses, the remote route.
- Repository state: the roadmap `## Fixes` row, the rendered projection and the
  session journal entry ship in the same change.

Consumers of the changed surface: the extension's own `session_start` listener
and the two suites above; no other module imports `provisionEngram`,
`resolveEngramBinary` or the readers (`rg -n 'provisionEngram|resolveEngramBinary'
packages skills docs` reports only these). No config key changes and no schema
surface moves — the `memory` section keeps `{ engram: boolean }`.

## Retirements

- The `binary-missing` text `Install it with: <companion route>` retires: it
  named a route that cannot install the binary whose absence it reported. Its
  replacement is the three-surface refusal. No consumer referenced the string
  except the suite's `includes(ENGRAM_INSTALL_ROUTE)` assertion, which stays
  green because the companion route is still named — as one surface among three.
- The README's "This package can register Engram's MCP server … Install Engram
  with: `pi install npm:gentle-engram@latest`" framing retires: it presented the
  MCP registration as the way Pi gets memory and the companion as the install
  fix. Replaced by the three-surface table and the decision table's two new rows.
- The narrative "The install route is `pi install npm:gentle-engram@latest`"
  retires from the module header in favour of the three-surface statement.
- No export, file or helper is deleted: every superseded item is prose or a
  message string. `rg -c 'Install it with' packages/pi-agentic-workflow` → 0
  after this change.

## Non-goals

- No deregistration or cleanup of an operator's existing `mcpServers.engram`
  entry in an `mcp.json` Pi reads. S2's own remedy is the operator's (Engram's
  docs: an existing MCP entry stays active until it is removed manually), and
  rewriting an operator's MCP config is not this package's surface. The README
  states the removal step instead.
- No killer for orphaned `engram mcp` child processes. The issue's "Actual
  behaviour" observes them; no acceptance criterion asks for it, and the
  duplicate registration is what this unit removes.
- No config key for remote usage: `memory` keeps `{ engram: boolean }` and the
  remote surface stays Engram's own environment variables, per the issue's
  rollback strategy (a config key no runtime would read violates the config
  policy).
- No change to `skills/init-workspace/references/ENGRAM.md`. That surface
  provisions memory for **non-Pi** hosts, where no native extension exists; its
  own companion/binary conflation is reported to the owner rather than repaired
  here (it is a different host's contract and a different unit).
- No fix to the `not-consented` message's file name. It says
  `pi-agentic-workflow.json`, while `memory` is a base-config section
  (`packages/agentic-workflow-schema/src/config.ts:241`, read through
  `src/config/load.ts:158`) and is refused as an unknown key in the extension
  file (`ROOT_KEYS`, `src/config/schema.ts:39-53`). Recorded under `## Known
  pre-existing issues`; a separate unit owns it.
- No change to `ENGRAM_ARGS` (`mcp --tools=agent`), to the `registerMcpServer`
  path, or to the consent switch's shape.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --base main --paths
packages/pi-agentic-workflow/src/extension/engram.ts
packages/pi-agentic-workflow/src/extension/index.ts
packages/pi-agentic-workflow/test/engram-provision.test.mjs
packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
packages/pi-agentic-workflow/README.md
docs/fix/531-engram-native-skip-remote-surfaces/SPEC.md docs/ROADMAP.md
.changeset/531-engram-native-skip-remote.md`, at the cut head `72bf608d`):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: packages/pi-agentic-workflow/src/extension/engram.ts","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

One pure decision module plus its single caller: every new branch is reachable
without a Pi session, no network and no real binary, so `contained_risk` is the
truth this unit relies on.

## Future

none

## Future cost

- Every future provisioning status binds the notification level with it: a new
  `EngramStatus` that is informational rather than a defect must be added to the
  adapter's informational set, or it ships as a warning (owner: `src/extension/index.ts`).
- The native-package match stays a source-substring check
  (`isNativeEngramPackage`). A second Engram-native Pi package would hide behind
  that check; a rename of `gentle-engram` would silently stop matching. Both are
  detectable only against Engram's own release notes, not from this repository.
- Reading `<cwd>/.pi/settings.json` mirrors Pi's trust rule; if Pi ever reads a
  project settings file for untrusted projects, this reader must follow, and the
  same trust argument binds `declaredMcpServerPaths` beside it.

## Applicable tests

`bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` (the
corpus: red first per §2/§6), the package suite `bun run test` (tsc + every
consumer), and the root gate `bun scripts/local-gate.mjs` before handoff.

## Known pre-existing issues

- `packages/pi-agentic-workflow/src/extension/engram.ts:236-242` tells the
  operator to set `"memory": { "engram": true }` in `pi-agentic-workflow.json`.
  That is not where `memory` is read: it is a base-config section
  (`packages/agentic-workflow-schema/src/config.ts:241`, merged by
  `src/config/load.ts:158` from `agentic-workflow.json`), and the extension file
  refuses it as an unknown root key (`ROOT_KEYS`, `src/config/schema.ts:39-53`),
  which would make the config invalid. **Does not affect** this unit: the
  `not-consented` branch is untouched (S7 keeps it green) and the wrong file name
  is a separate defect with its own unit. Recorded here so the class is visible
  rather than silently skipped.
- `skills/init-workspace/references/ENGRAM.md:44` carries the same
  companion-versus-binary conflation for non-Pi hosts. **Does not affect** this
  unit: a different host's contract, reported to the owner in the handoff.
- The four pre-existing worktrees under `.worktrees/` are untouched by this
  unit; its tests write only under `mktemp -d` and its fixtures' own agent dirs.
- `scripts/roadmap-settle.test.mjs` is **red on `main` before this branch**: 2
  `pr-url-unsettled` violations in `docs/fix/521-fix-config/` (`SPEC.md` carries
  PR #523's URL while its `## Fixes` row still reads `in-progress`; PR #523
  merged 2026-11-12T20:32:41Z). **Does not affect** this unit: the red is
  reproduced at the base commit `72bf608d` in the primary checkout with the same
  two violations and no others, and this unit's own row/doc agree (E11, G1).
  The repair is one cell on another unit's row (settle it to
  `done · [#523](…)`, or delete the row — a merged fix leaves the index), which
  is the owner's to make: editing another unit's row is scope this unit does not
  own.
- `scripts/run-root-suite.test.mjs` is a suite that spawns other suites with
  timing bounds; it was observed red **once** under the gate's parallel load and
  green standalone (23 pass) in the same session, which is a pre-existing
  timing sensitivity in that suite, not this unit's surface. Recorded so the
  flake is not mistaken for a regression of this change.

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers are frozen in this document before the implementation lands,
  and the work arrives as conventional commits. Check: `ls
  docs/fix/531-engram-native-skip-remote-surfaces/` lists `SPEC.md` only (XS/S
  embeds the ledgers); `git log --oneline main..HEAD` shows the unit's own
  conventional commits.
- **AC-S2** — With the native `gentle-engram` package declared in Pi's
  `settings.json` packages and `memory.engram: true`, the package registers no
  MCP server, states one line that names the native extension and says nothing
  was written, and reports it at `info` level. Check: `bun test
  test/engram-provision.test.mjs` exits 0 (the native-active cases, including
  "registers nothing", the message wording and the ordering) and `bun test
  test/shipped-adapter.test.mjs` exits 0 (the shipped entry: zero
  `registerMcpServer` calls and a `notify` call whose kind is `info`).
- **AC-S3** — The `binary-missing` refusal names the core binary's resolution
  surfaces (`PATH`, `ENGRAM_BIN`) and `ENGRAM_URL` for a running server, and
  names the Pi companion install route separately; every route it names moves the
  operator forward, including `ENGRAM_BIN`, which the binary lookup honours.
  Check: `bun test test/engram-provision.test.mjs` exits 0 (`core binary`,
  `ENGRAM_BIN`, `ENGRAM_URL` and `ENGRAM_INSTALL_ROUTE` assertions, plus the
  override-resolution cases).
- **AC-S3a** — The `not-consented` instruction names the file the switch is
  actually read from (`agentic-workflow.json`, taken from the schema's published
  constant) and never the extension file, which refuses `memory` as an unknown
  key. Check: `bun test test/engram-provision.test.mjs` exits 0 (the `S3a` case
  asserts the base file name is present and `pi-agentic-workflow.json` absent).
- **AC-S4** — With `ENGRAM_URL` set to a non-blank value the package registers
  no MCP server and reports the external-server configuration instead of
  `binary-missing`; blank or whitespace-only values are unset, exactly as
  Engram's own extension treats them. Check: `bun test
  test/engram-provision.test.mjs` exits 0 (the external-server cases, blank
  handling, and the both-set ordering) and `bun test test/shipped-adapter.test.mjs`
  exits 0 (the shipped entry with `ENGRAM_URL` in the environment).
- **AC-S5** — The package README documents the three surfaces, both new
  statuses and the remote/external usage beside the consent switch, with the
  superseded prose deleted. Check: `rg -n 'native-active|external-server'
  packages/pi-agentic-workflow/README.md` matches ≥2, `rg -n 'ENGRAM_BIN|ENGRAM_URL'
  packages/pi-agentic-workflow/README.md` matches ≥2, and `rg -n 'Five rules'
  packages/pi-agentic-workflow/README.md` matches 0.
- **AC-S6** — Native detection reads the same `settings.json` files Pi reads —
  the user file always, `<cwd>/.pi/settings.json` only for a trusted project —
  from injected paths, with no Pi session in any test. Check: `bun test
  test/engram-provision.test.mjs` exits 0 (the `piSettingsPaths` and
  `readInstalledPackageSourcesFrom` cases, both scopes and both trust values) and
  `bun test test/shipped-adapter.test.mjs` exits 0 (a project-scope declaration
  is honoured when trusted and ignored when not).
- **AC-S7** — The behaviours that stay correct keep their tests green:
  consent-first ordering, `already-declared`, `unsupported-host` and the
  `registered` read-back, and no suite depends on the operator's environment
  (`ENGRAM_URL`, `PATH`). Check: `bun run test` in
  `packages/pi-agentic-workflow` exits 0 with the pre-existing cases unchanged,
  and the same suite exits 0 with `ENGRAM_URL` exported in the shell.

## Tasks

- P1 — Freeze this unit doc with its embedded planning ledgers and the
  acceptance criteria, before the implementation lands (validator:
  `bun scripts/phase-lint.mjs docs/fix/531-engram-native-skip-remote-surfaces/SPEC.md`
  prints `verdict: PASS` and exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/531-engram-native-skip-remote-surfaces/SPEC.md,
    docs/ROADMAP.md
- P2 — RED corpus first: the native-active / external-server / project-scope /
  `ENGRAM_BIN` / informational-level cases land as checks observed failing on the
  pre-change tree (validator: `bun test test/engram-provision.test.mjs
  test/shipped-adapter.test.mjs` exits 0 after P3–P4, and the corpus's own red run
  is recorded in `## Log` before the implementation commit)
  (Implements: S2, S3, S4, S6)
  - Relevant files: packages/pi-agentic-workflow/test/engram-provision.test.mjs,
    packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- P3 — The module: two-scope `piSettingsPaths` + `readInstalledPackageSourcesFrom`,
  the `ENGRAM_BIN` override in `resolveEngramBinary`, and the
  external-server sentence on the native-active report (validator:
  `bun test test/engram-provision.test.mjs` exits 0, 0 fail)
  (Implements: S2, S3, S4, S6)
  - Relevant files: packages/pi-agentic-workflow/src/extension/engram.ts
- P4 — The adapter: the two-scope package list, the session's `ENGRAM_URL`, and
  the informational level for the deliberate outcomes (validator:
  `bun test test/shipped-adapter.test.mjs` exits 0, 0 fail)
  (Implements: S2, S6, S7)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts,
    packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- P5 — Differential check: the same corpus driven through a copy of the base
  commit's module and through this change, in `mktemp -d`, with every
  stdout/status difference declared (validator: the harness diff `matches` only
  the declared deltas — two new statuses and their messages, the three-surface
  refusal, `ENGRAM_BIN` honoured — and carries no undeclared line)
  (Implements: S3, S4, S7)
- P6 — Documentation and repository state in the same change: the README's
  memory-substrate section, this unit doc, the roadmap `## Fixes` row (placement
  by hand — the emitter never appends a fix row — with the summary cell rendered
  from `roadmap_summary:`), the changeset intent and the rendered projection
  (validator: `bun scripts/lint-changeset.mjs` exits 0 and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S5, S1)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/ROADMAP.md,
    .changeset/531-engram-native-skip-remote.md, docs/generated/
- P7 — Verification: the package suite and the declared root gate in the
  foreground, every obligation closed (validator: `bun scripts/local-gate.mjs`
  exits 0)
  (Implements: S1, S7)

- P8 — Correction batch (the owner's review, L3): the consent refusal names
  the base config file the switch is read from, from the schema's published
  constant rather than a literal (validator: `bun test
  test/engram-provision.test.mjs` exits 0 with the `S3a` case, and
  `rg -n 'pi-agentic-workflow\.json' packages/pi-agentic-workflow/src/extension/engram.ts`
  matches 0)
  (Implements: S3a)
  - Relevant files: packages/pi-agentic-workflow/src/extension/engram.ts,
    packages/pi-agentic-workflow/test/engram-provision.test.mjs

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order. Every claim below was read in this session at the cut head `72bf608d`
(branch head `699ef42e`).

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | forge-issue | The defect is real and reproduced from the issue: an opted-in install with the native companion present gets `binary-missing` naming only the companion route, a duplicate MCP registration whenever the binary resolves, and no mention of `ENGRAM_URL`/`ENGRAM_BIN` anywhere in the package docs | issue [#531](https://github.com/gtrabanco/agentic-workflow/issues/531) body (What's broken / Expected behaviour / AC1–AC6) + `packages/pi-agentic-workflow/src/extension/engram.ts:286-292`, `README.md:575-610` at `72bf608d` | read 2026-11-13 (this session) | O1–O14; the whole change |
| PE-002 | version-pinned doc | Pi's package declarations are `settings.json` → `packages: (string \| { source })[]`, in two scopes: `<agentDir>/settings.json` always and `<cwd>/.pi/settings.json` only after project trust | installed `@earendil-works/pi-coding-agent@1.5.2`: `docs/settings.md:155`, `docs/packages.md` ("Personal installs are written to `~/.pi/agent/settings.json`… `--local` … `.pi/settings.json` … only after project trust"), `dist/core/settings-schema.js:118-130`, `dist/core/settings-manager.js:228-229` | read 2026-11-13 (this session) | O2, O3; D2 |
| PE-003 | version-pinned doc | The native Engram extension's own surfaces are `ENGRAM_URL` (an externally managed server), `ENGRAM_BIN` (binary override, resolved from `PATH`, absolute path allowed) and `ENGRAM_PORT`; absent, empty and whitespace-only values are all "unset"; the native `mem_*` tools use the HTTP path while MCP stays a separate stdio path that still needs a local binary | installed `gentle-engram@0.7.0` `README.md:831,835-837,345,912-913`, `index.ts:45,924` (`const ENGRAM_BIN = optionalEnvironmentValue(process.env.ENGRAM_BIN) ?? "engram"`) | read 2026-11-13 (this session) | O4, O5, O13; D3 |
| PE-004 | version-pinned doc | Engram's own Pi setup is native-only: "Engram MCP is not registered by Pi setup. An existing Pi MCP entry remains active until you manually remove it and restart/reload Pi; native-only agent writes are not guaranteed while it remains." | installed `gentle-engram@0.7.0` `README.md:345,327,851`; `mcp-template.json` is declared legacy | read 2026-11-13 (this session) | O1, O11; the README's removal step |
| PE-005 | committed-source | The module's contract is decided in one place and every branch is injected: statuses `registered \| not-consented \| config-invalid \| binary-missing \| already-declared \| unsupported-host`, decided in the order invalid → consent → binary → host → declared → register; no Pi import, no network, no real PATH | `src/extension/engram.ts:34-100` at `699ef42e`; `test/engram-provision.test.mjs` (imports `../dist/extension/engram.js`) | read 2026-11-13 (this session) | O1–O14 |
| PE-006 | committed-source | `memory.engram` is a **base-config** section, read from `agentic-workflow.json` and merged into the effective config; the extension file's `ROOT_KEYS` does not include `memory` | `packages/agentic-workflow-schema/src/config.ts:241`, `src/config/load.ts:158`, `src/config/schema.ts:39-53` | read 2026-11-13 (this session) | O11; the README wording; the known pre-existing issue |
| PE-007 | committed-source | The notification level is decided by one expression in the adapter, so "informatively" is an adapter fact, not a module fact: `ctx.ui.notify(report.message, report.status === "registered" ? "info" : "warning")` | `src/extension/index.ts:452-456` at `699ef42e` | read 2026-11-13 (this session) | O10, O12 |
| PE-008 | committed-source | The shipped-entry harness drives the real `session_start` listener with an isolated `agentDir`/`cwd` (a `mktemp -d` pair), captures `notify(message, kind)`, and already isolates `PATH` for the Engram cases; nothing isolates `ENGRAM_URL`, which this change makes a live input | `test/shipped-adapter.test.mjs:97-150` (`shippedEntry`), `:522-537` (`withFakeEngramOnPath`) | read 2026-11-13 (this session) | O10, O12, O14 |
| PE-009 | committed-tool | The roadmap emitter never **appends** a fix row (`syncTable`: the append branch runs for `kind === "feature"` only), so the `#531` row's placement is a hand edit — but it does own an existing row's last cell, overriding it with the unit doc's `roadmap_summary:`; that is exactly what this unit's run produced (`Roadmap: docs/ROADMAP.md — updated`, the Notes cell rendered from the frontmatter). The changeset and the projection have emitters of their own | `scripts/docs-generate.mjs:445-490` (`syncTable`), `:386-392` (`roadmapSummaryFor`), `docs/ROADMAP.md:1-30`; this unit's own `docs-generate` run | run 2026-11-13 (this session) | O13 |
| PE-010 | measured-baseline | The regression floor at the branch head `699ef42e` (after `bun run test`, which builds): **851 pass / 0 fail / 77 files** | this session's run of `bun run --cwd packages/pi-agentic-workflow test` | run 2026-11-13 (this session) | O9, O14; AC-S7 |
| PE-011 | committed-tool | `bun scripts/phase-lint.mjs` reads the unit-doc grammar (`P<n> — <task> (validator: …)` + `(Implements: …)` + optional `Relevant files:`), and `bun scripts/ceremony.mjs tier classify` is the only tier authority; both ran on this document at the cut head | `scripts/phase-lint.mjs` header, `scripts/ceremony/tier.mjs` | run 2026-11-13 (this session) | P1; Risk tier |
| PE-012 | unknown | No repository evidence says whether an operator's shell exports `ENGRAM_URL` while Pi runs; the only safe contract is Engram's own blankness rule plus a suite that pins the variable, so the corpus fixes it explicitly instead of depending on the shell | not sampled — no session env capture exists in this repository (`rg -n 'ENGRAM_URL' packages/`) | unverified 2026-11-13 (this session) | O5, O14 |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the ledger's 9-column order. Each row carries its
`S#` in `authority-source`, exactly one phase and one task, a backticked
validator with the outcome it must produce, and is `planned` at cut time.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | the native `gentle-engram` package present means no MCP registration: the report is `native-active`, names the native extension and says nothing was written | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the native-active cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (the native-active cases: 0 registrations, `gentle-engram` + `nothing was written` named) |
| O2 | S2, S6 | the package sources are read from Pi's own `settings.json` shape — plain strings and `{ source }` objects — and a missing or malformed file yields no sources | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (`readInstalledPackageSources` cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (`readInstalledPackageSources`: string and object entries, missing and malformed files yield none) |
| O3 | S6 | detection reads both scopes Pi reads — `<agentDir>/settings.json` always, `<cwd>/.pi/settings.json` only for a trusted project — so a project-scope declaration is honoured when trusted and invisible when not | P3, P4 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (`piSettingsPaths` + `readInstalledPackageSourcesFrom`, both trust values) and `bun test test/shipped-adapter.test.mjs` exits 0 (the project-scope case) | E line in SPEC `## Log` | verified — E2 and E4 lines in SPEC `## Log` (`piSettingsPaths` both trust values, the two-scope union, and the shipped entry's trusted/untrusted pair) |
| O4 | S3 | `resolveEngramBinary` honours `ENGRAM_BIN` (an absolute path or a bare name resolved on `PATH`) before scanning `PATH` for `engram`, so the route the refusal names actually works | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the `ENGRAM_BIN` cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (absolute path, bare name through PATH, fail-closed miss, blank-as-unset, and the registered command being the override) |
| O5 | S4 | a non-blank `ENGRAM_URL` reports `external-server` and registers nothing; blank and whitespace-only values count as unset, matching Engram's own rule | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the external-server and blank cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (external-server reports, nothing registered, blank stays unset) |
| O6 | S3 | the `binary-missing` refusal names the core binary's surfaces (`PATH`, `ENGRAM_BIN`), `ENGRAM_URL`, and the companion route separately, and keeps `nothing was written` | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the refusal-wording cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (`core binary`, `ENGRAM_BIN`, `ENGRAM_URL` and the companion route all asserted) |
| O7 | S2, S4 | the order is decided once and pinned: invalid → consent → native → external → binary → host → declared → register, so `native-active` outranks `external-server`, `already-declared` and the registration path | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the both-set and declared-with-native cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (both-set reports native-active; declared-with-native reports native-active; consent-first still first) |
| O8 | S4 | when the native package and `ENGRAM_URL` are both present the report still states the external-server fact, so the deliberate configuration is never hidden by the native branch | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the overlap message asserts `ENGRAM_URL`) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (the overlap message carries `served by the external Engram server`) |
| O9 | S7 | consent-first is unchanged: no `memory.engram` opt-in still answers `not-consented`, silently, registering nothing — including with the native package present and with `ENGRAM_URL` set | P3 | P3 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the consent-first cases) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (the consent-first cases unchanged, incl. native present and ENGRAM_URL set) |
| O10 | S2 | the deliberate outcomes reach the operator at `info` level and the defects stay `warning`; the opt-out stays silent | P4 | P4 | direct application (this session) | `bun test test/shipped-adapter.test.mjs` exits 0 (the kind assertion on native-active/external-server) | E line in SPEC `## Log` | verified — E2 line in SPEC `## Log` (the shipped entry: one `info` line for native-active, one for external-server, zero Engram warnings) |
| O11 | S5 | the package README documents the three surfaces, both new statuses and the remote/external usage beside the consent switch, and the superseded prose is deleted | P6 | P6 | direct application (this session) | `rg -n 'native-active\|external-server' packages/pi-agentic-workflow/README.md` matches ≥2, `rg -n 'ENGRAM_BIN\|ENGRAM_URL' packages/pi-agentic-workflow/README.md` matches ≥2, `rg -n 'Five rules' packages/pi-agentic-workflow/README.md` matches 0 | E line in SPEC `## Log` | verified — E9 line in SPEC `## Log` (statuses 2 · env 7 · `Five rules` 0) |
| O12 | S7 | `already-declared`, `unsupported-host` and the `registered` read-back keep their behaviour and their assertions | P4 | P4 | direct application (this session) | `bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` exits 0 with those cases unchanged | E line in SPEC `## Log` | verified — E4 line in SPEC `## Log` (863 pass / 0 fail; the pre-existing cases untouched) |
| O13 | S1 | repository state ships in the same change: the unit doc, the roadmap `## Fixes` row (placement by hand — the emitter never appends a fix row — with its summary cell rendered from this doc's `roadmap_summary:`), the changeset intent and the rendered projection | P6 | P6 | direct application (this session) | `bun scripts/lint-changeset.mjs` exits 0, `bun scripts/docs-generate.mjs --check` exits 0, `rg -n '#531' docs/ROADMAP.md` matches 1 | E line in SPEC `## Log` | verified — E7 and E8 lines in SPEC `## Log` (changeset ok, projection PASS, one `#531` row) |
| O14 | S7 | no suite depends on the operator's environment: the Engram adapter cases pin `ENGRAM_URL` and `PATH`, so a shell that exports either cannot flip the result | P4 | P4 | direct application (this session) | `bun test test/shipped-adapter.test.mjs` exits 0 with `ENGRAM_URL=http://127.0.0.1:7437` exported | E line in SPEC `## Log` | verified — E3 line in SPEC `## Log` (58 pass with ENGRAM_URL and ENGRAM_BIN exported) |
| O15 | S3, S4, S7 | the change differs from the base commit only in the declared deltas: two new statuses and their messages, the three-surface refusal, `ENGRAM_BIN` honoured — every other input produces the base's exact status and message | P5 | P5 | direct application (this session) | differential harness in `mktemp -d` (base module copy vs this change, identical corpus): the diff lists only declared deltas | E line in SPEC `## Log` with the diff summary | verified — E6 line in SPEC `## Log` (11 of 22 rows changed, all in the declared deltas; 11 identical) |
| O16 | S1, S7 | the declared deterministic gates are green before handoff | P7 | P7 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 | G line in SPEC `## Log` | verified — G1 line in SPEC `## Log` (15 steps pass; root-suite's single red is E11, reproduced at the base commit) |
| O17 | S3a | the consent refusal names `agentic-workflow.json` — the base config the switch is read from — and never `pi-agentic-workflow.json`, which refuses `memory` as an unknown key | P8 | P8 | direct application (this session) | `bun test test/engram-provision.test.mjs` exits 0 (the `S3a` case) and `rg -n 'pi-agentic-workflow\\.json' packages/pi-agentic-workflow/src/extension/engram.ts` matches 0 | E line in SPEC `## Log` | verified — E12 (red) and E13 (green: 59 pass, 0 matches) lines in SPEC `## Log` |

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-13, the request, verbatim:
  ```
  Apply to this repository: issue #531
  ```
- **L2** — 2026-11-13, the issue, verbatim (body as filed; labels `bug`,
  `needs-triage`):
  ```
  ## What's broken

  `pi-agentic-workflow`'s Engram provisioning (feature 66, D3) registers Engram as a session-scoped **MCP server** when `memory.engram` is consented, but the Engram substrate a modern Pi install actually uses is the **native `gentle-engram` Pi package**, which provides the `mem_*` tools directly over Engram's HTTP server and needs **no MCP registration at all**. The result on a real install (gentle-engram present, core binary built to `~/go/bin`, not on the session PATH):

  1. **The `binary-missing` refusal names a route that cannot fix it.** It says `Install it with: pi install npm:gentle-engram@latest` — that installs the Pi *companion* (which the operator already has), not the core `engram` binary whose absence triggered the refusal. Following the printed route reproduces the same warning forever. The message also never mentions `ENGRAM_BIN` (custom binary path) or `ENGRAM_URL` (already-running/remote server), which are the actual resolution surfaces the gentle-engram extension documents.
  2. **The MCP registration is redundant and conflicts with native-only writes.** Engram's own README states the Pi setup is native-only (`pi-engram init` never creates `mcpServers.engram`, warns that existing entries mean *"Pi-native agent writes are not guaranteed while this MCP path remains"*). pi-agentic-workflow re-registers the same 23 agent-profile tools through MCP next to the native `mem_*` tools, and stale `engram mcp --tools=agent` child processes accumulate across sessions (observed: 4 orphaned processes on one machine).
  3. **No remote-usage surface is recognized.** The only remote/external-server configuration Engram supports is `ENGRAM_URL` (MCP-over-HTTP does not exist in core — `POST /mcp` on `engram serve` is 404; MCP is stdio-only and always needs a local binary). When the operator has chosen the remote route via `ENGRAM_URL`, the package still reports `binary-missing` as a warning, treating a deliberate configuration as a defect.

  ## Detected in

  Live debugging session on 2026-11-13 against `@gtrabanco/pi-agentic-workflow@canary` with `gentle-engram@latest` (0.7.x) installed as a Pi package, core binary `engram` v3.7.1 at `/home/agent/go/bin/engram`, an external `engram serve` v3.6.0 already running on 127.0.0.1:7437 sharing the same instance identity.

  ## Reproduction steps

  1. Install gentle-engram as a Pi package (`settings.json` `packages`), set `memory.engram: true` in `agentic-workflow.json`, keep the core binary off PATH.
  2. Start/reload Pi. Observe: `pi-agentic-workflow: Engram not registered — no "engram" binary on PATH, so nothing was written. Install it with: pi install npm:gentle-engram@latest`
  3. Run `pi install npm:gentle-engram@latest` as instructed. Reload. The identical warning returns — the route installs the companion, not the core binary.
  4. Meanwhile the native extension also fails its provider init (`The Engram binary "engram" could not be found... point ENGRAM_BIN`), because the same core binary is the substrate for the native `mem_*` tools too.

  ## Expected behaviour

  - When the native `gentle-engram` package is already installed, pi-agentic-workflow registers **nothing** (MCP registration would duplicate the native `mem_*` tools and undermine native-only agent writes) and says so once, informatively.
  - The refusal messages distinguish the two install surfaces: the **core binary** (must be on `PATH` or named by `ENGRAM_BIN`) from the **Pi companion** (`pi install npm:gentle-engram@latest`).
  - A set `ENGRAM_URL` (externally managed or remote server) is reported as a deliberate configuration — no MCP registration (stdio MCP cannot use it), no `binary-missing` warning.
  - The remote/external-server usage (`ENGRAM_URL`, `ENGRAM_BIN`) is documented beside the consent switch.

  ## Actual behaviour

  `binary-missing` warning every session with a self-referential install route; duplicate MCP registration whenever the binary happens to be on PATH; orphaned `engram mcp` child processes; no mention of `ENGRAM_URL`/`ENGRAM_BIN` anywhere in the package's own docs.

  ## Root cause (if known)

  Feature 66 / D3 designed the MCP registration before the native-only model: at the time, connecting Pi to Engram meant registering `engram mcp` as an MCP server. gentle-engram has since moved to Pi-native `mem_*` tools over the HTTP server and explicitly asks setups not to keep an Engram MCP path (`mcp-template.json` is legacy). The provisioning contract in `packages/pi-agentic-workflow/src/extension/engram.ts` was never revisited, and its refusal text conflates the companion package with the core binary.

  ## Acceptance criteria

  - [ ] AC1 — With the native gentle-engram package present in Pi's `settings.json` packages and `memory.engram: true`, provisioning reports a single informative line and registers no MCP server (new status, e.g. `native-active`); writes stay native-only.
  - [ ] AC2 — With `ENGRAM_URL` set in the session environment, provisioning reports the external-server configuration and registers no MCP server (new status, e.g. `external-server`); `binary-missing` never fires for a deliberate remote choice.
  - [ ] AC3 — The `binary-missing` message names the **core binary** resolution surfaces (`PATH` / `ENGRAM_BIN`) and separately names the companion install route; following every route the message names moves the operator forward.
  - [ ] AC4 — Detection of the native package reads the same files Pi reads for packages (user `settings.json`) and is injected/testable like the existing binary/declaration lookups; no Pi session is needed in tests.
  - [ ] AC5 — The package README's situation table documents the new statuses and the remote usage (`ENGRAM_URL`, `ENGRAM_BIN`); superseded prose is deleted in the same PR (docs currency).
  - [ ] AC6 — Existing behaviours that remain correct keep their tests green: consent-first ordering, `already-declared`, `unsupported-host`, `registered` read-back.

  ## Rollback strategy (if known)

  Revert the single provisioning PR; the statuses are additive and no config schema changes (the `memory` section keeps `{ engram: boolean }` — a config key no runtime reads would violate the config policy, so remote usage stays on Engram's own documented env surface).

  ## Severity

  medium (functional but degraded)

  ## Depends on

  (none)
  ```
- **L3** — 2026-11-13, the owner's correction, verbatim:
  ```
  fix the new finding
  ```
- **D1** — 2026-11-13, the AC1/AC2 overlap is ordered, not guessed: the ACs are
  each unconditional, so with both the native package and `ENGRAM_URL` present
  they collide. `native-active` is reported (AC1's precondition is the stronger
  fact — the native extension is why nothing is registered) and the report states
  the external-server fact in the same line (AC2's "reported as a deliberate
  configuration"), pinned by a test. Owner may overrule in one line; the
  ordering is one `if` in `provisionEngram`.
- **D2** — 2026-11-13, detection reads the **two** scopes Pi reads
  (`<agentDir>/settings.json`, and `<cwd>/.pi/settings.json` only while the
  project is trusted), reusing the trust argument `declaredMcpServerPaths`
  already applies to `mcp.json`. Reading only the user file (the pre-existing
  branch state) satisfied AC4's "user `settings.json`" but left the AC1 defect
  in place for a project that installed the package with `pi install -l`.
- **D3** — 2026-11-13, `ENGRAM_BIN` becomes a real resolution surface of this
  package's binary lookup, not only a name in the message: AC3 requires that
  following every named route moves the operator forward, and Engram's own
  extension resolves `ENGRAM_BIN` whether it is a bare name or an absolute path.
- **D4** — 2026-11-13, the informative outcomes (`registered`, `native-active`,
  `external-server`) notify at `info` and the defects stay `warning`; "says so
  once, informatively" (S2) is an adapter fact, so it is pinned through the
  shipped entry rather than inferred from the module's message.
- **E1** — 2026-11-13, RED corpus before this session's implementation:
  `cd packages/pi-agentic-workflow && bun test test/engram-provision.test.mjs
  test/shipped-adapter.test.mjs` · exit 1 · 22 pass, 5 fail, 1 error — the module
  had no `piSettingsPaths`/`readInstalledPackageSourcesFrom`, and the adapter
  ignored the project `settings.json`, warned instead of informing, and resolved
  no binary through `ENGRAM_BIN`.
- **E2** — 2026-11-13, `cd packages/pi-agentic-workflow && bun test
  test/engram-provision.test.mjs test/shipped-adapter.test.mjs` · exit 0 ·
  58 pass, 0 fail.
- **E3** — 2026-11-13, `ENGRAM_URL=http://127.0.0.1:7437 ENGRAM_BIN=/nope/engram
  bun test test/engram-provision.test.mjs test/shipped-adapter.test.mjs` · exit 0
  · 58 pass, 0 fail — the operator's shell cannot flip the result.
- **E4** — 2026-11-13, `cd packages/pi-agentic-workflow && bun run test` · exit 0
  · 863 pass, 0 fail, 77 files (tsc built `dist/` first).
- **E5** — 2026-11-13, the same command at the inherited branch head `699ef42e`,
  before this session's additions · exit 0 · 851 pass, 0 fail, 77 files.
- **E6** — 2026-11-13, differential · exit 0 · 22 corpus rows (14 `provisionEngram`
  inputs, 8 `resolveEngramBinary` environments) driven through a copy of
  `main`'s module and this one in `mktemp -d`: 11 changed, 11 identical. The
  changed rows are the declared deltas only — the three-surface refusal, the two
  new statuses (incl. `native-and-binary`, the duplicate registration the issue
  reports), the leftover-declaration note, and `ENGRAM_BIN` honoured. No
  undeclared line.
- **E7** — 2026-11-13, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  `3 checked · 0 missing · 0 stale · 0 orphaned`, roadmap unchanged, `verdict: PASS`.
- **E8** — 2026-11-13, `bun scripts/lint-changeset.mjs` · exit 0 · `ok` for
  `531-engram-native-skip-remote.md` beside the other intents.
- **E9** — 2026-11-13, `rg -c 'native-active|external-server'
  packages/pi-agentic-workflow/README.md` → 2, `rg -c 'ENGRAM_BIN|ENGRAM_URL'` →
  7, `rg -c 'Five rules'` → 0 matches (the superseded count is gone).
- **E10** — 2026-11-13, `bun scripts/phase-lint.mjs
  docs/fix/531-engram-native-skip-remote-surfaces/SPEC.md` · exit 0 · 7 phases
  `PASS (6/6)`, `verdict PASS`, fingerprint `c852bae1…`.
- **E11** — 2026-11-13, `bun scripts/roadmap-settle.mjs` at the base commit
  `72bf608d` in the primary checkout · exit 1 · 2 `pr-url-unsettled` violations,
  both in `docs/fix/521-fix-config/` (PR #523 merged 2026-11-12, row still
  `in-progress`) — pre-existing, outside this unit's surface.
- **G1** — 2026-11-13, `bun scripts/local-gate.mjs --no-bail` · exit 1 · 17 steps
  · `FAILED root-suite`; 15 steps pass, `schema-node-compat` skipped as its
  dependent. The root suite's only deterministic red is E11's `roadmap-settle`
  suite, reproduced at the base commit with no other violation; the `.worktrees/`
  flake of `run-root-suite.test.mjs` under parallel load is recorded under
  `## Known pre-existing issues`.

- **G2** — 2026-11-13, `bun scripts/local-gate.mjs --no-bail` at `444040d5` · exit 1 ·
  `log-immutability` refused the session entry: this repository consumes a
  fragment carrier (`.agentic-workflow/journal/`), so a direct append to
  `docs/LOGS.md` is a `log-hand-appended` violation. Disclosed side effect: the
  append was written, then reverted byte-for-byte (`git restore`), and the entry
  was re-landed as a carrier fragment through the declared writer
  (`journal write --kind narrative`, `.agentic-workflow/journal/20261113T101826Z-…-narrative-local.md`).
  `docs/LOGS.md` is untouched by this unit's commits.
- **G3** — 2026-11-13, `bun scripts/local-gate.mjs --no-bail` at `907d6617` · exit 1
  · 16 steps pass, `schema-node-compat` skipped as `root-suite`'s dependent,
  `log-immutability` reads 0 violations over the 6-commit range. `root-suite`
  fails on E11's pre-existing `roadmap-settle` red; the three siblings the report
  also names (`red-first`, `run-root-suite`, `scope-manifest`) were killed
  in-flight by the runner's bail (`Bailed out after 1 failure`) and pass
  standalone (`bun test --timeout=10000 scripts/red-first.test.mjs` → 9 pass).

- **E12** — 2026-11-13, the correction's RED: `cd packages/pi-agentic-workflow &&
  bun test test/engram-provision.test.mjs` · exit 1 · 32 pass, 1 fail — the
  `S3a` case rejects the old instruction's `pi-agentic-workflow.json`.
- **E13** — 2026-11-13, after the fix: `bun test test/engram-provision.test.mjs
  test/shipped-adapter.test.mjs` · exit 0 · 59 pass, 0 fail; and
  `rg -n 'pi-agentic-workflow\.json' packages/pi-agentic-workflow/src/extension/engram.ts`
  · exit 1 · 0 matches (the wrong file name is gone from the module).
- **D5** — 2026-11-13, the consent instruction's file name comes from the
  schema's published `BASE_CONFIG_FILE`, not a literal: one owner for the file
  name, so a future rename cannot make the message lie again the way it did.
- **G4** — 2026-11-13, `bun scripts/local-gate.mjs --no-bail` at `0cb7a9fc` · exit 1
  · 16 steps pass (`log-immutability` 0 violations over 8 commits), `root-suite`
  red on E11's pre-existing `roadmap-settle` violation alone, the three in-flight
  siblings killed by the bail again.

- **G5** — 2026-11-13, `journal write --kind narrative` after the correction: the
  carrier's writer names each write from its own UTC second, and omitting
  `--session` leaves the identity `local`, which the contract declares "not a
  conversation" — so the one-entry-per-conversation rewrite never fired and the
  second write produced a duplicate rather than an update. Deleting the
  superseded fragment by hand is refused by this same gate
  (`fragment-hand-deleted — a deletion is a lost entry`), so the duplicate was
  discarded while still uncommitted and the carrier keeps the single committed
  entry. That entry's counts describe the session at the moment it was written
  (58 pass on the targeted corpus, 863 on the package suite); the correction
  batch's receipts are E12, E13 and G4 here, which supersede them.
## Next

Hand the diff to the owner as the external verifier. Every obligation is
`verified` on a foreground run, the package suite is green (E4), and the one
ordered ambiguity is D1. **The root gate is not green, and cannot be on this
branch**: its only deterministic red is E11's `roadmap-settle` violation in
`docs/fix/521-fix-config/` — another unit's stale row, reproduced at the base
commit `72bf608d`. Settling that row (`done · [#523](…)`, or deleting it) is the
owner's one-cell repair; re-running `bun scripts/local-gate.mjs` after it should
be the only remaining step to a full green.

## References

- Issue [#531](https://github.com/gtrabanco/agentic-workflow/issues/531) — the
  request (closes via `Closes #531`).
- Feature 66 (`docs/features/66-engram-memory-substrate/`) — the provisioning
  contract this unit revisits (D3 there).
- `docs/fix/521-fix-config/` — the precedent for this unit's own shape (the
  `config-invalid` branch of the same module).
- `skills/unit-lane/references/MEMORY.md` — the workflow-side memory protocol
  the module serves.

## Branch

`fix/531-engram-native-skip-remote-surfaces`

## Depends on

none

## Regression scope

| Scenario | Verified by |
|---|---|
| no `memory.engram` opt-in ⇒ `not-consented`, silent, nothing registered | `test/engram-provision.test.mjs` (consent-first cases) + the adapter's silence assertion |
| an unreadable/invalid config still outranks consent and reports `config-invalid` | `test/engram-provision.test.mjs` (the F5 cases unchanged) |
| an operator's `mcp.json` declaration is never shadowed (both scopes) | `test/engram-provision.test.mjs` (F6 cases) + `test/shipped-adapter.test.mjs` |
| a host without `registerMcpServer` degrades to `unsupported-host` | `test/engram-provision.test.mjs` |
| opted in, binary present, nothing native or external ⇒ `registered` with the exact argv | `test/engram-provision.test.mjs` + `test/shipped-adapter.test.mjs` |
| the whole package (routing, config, hooks, conductor) is untouched | `bun run test` in `packages/pi-agentic-workflow` (851 pass at the cut head) |
