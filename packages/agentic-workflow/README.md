# `@gtrabanco/agentic-workflow`

Producer crate for the deterministic agentic-workflow scripts. Feature 37
created it as the vehicle the roadmap mandated (rows 37/38/42/45, declined 43):
the first producer feature creates the crate, later producers land their scripts
as subcommands of it.

- **Shipped via `@gtrabanco/pi-agentic-workflow` (the pi package), one pinned pure-JS dependency, no native deps, no build step.**
  Repository tooling runs with bun first and node as the guaranteed fallback
  (`AGENTS.md` §Verification); `typebox` is exact-pinned and carries the `doc`
  entry point's envelope validation. The retrieval store lives in a gitignored
  SQLite database under `.agentic-workflow/index/` — disposable build output,
  regenerated, never committed.
- **Scratch convention:** `.agentic-workflow/tmp/` at the repository root holds
  throwaway producer output. It is committed as a directory (`.gitkeep`) so the
  convention exists on a fresh clone.

The crate is the lane's **runner**: every deterministic file service, sensor and
guard the workflow needs ships as a subcommand here, so a skill or a target
project invokes one pinned CLI instead of a tree of loose scripts.

## Commands

```text
usage: agentic-workflow <unit-doc|roadmap|changelog|budgets|manifest|doc|memory> ...
```

Every operation prints one fixed receipt block (with `--json` the same receipt
as JSON). A refused operation exits **2** with `EDIT REFUSAL — <reason>` **before
writing anything**.

| Command | What it does |
|---|---|
| `unit-doc <NN-slug> <op>` | Typed unit-document service: `create`, `setSection`, `evidence`, `progress`, `validate` — schema-checked, unknown sections refused |
| `roadmap <op>` | Roadmap writer: `rowUpsert` and `annotate` take a table path, and `roadmap check <unit-doc> [--roadmap <f>] [--index <f>] [--json]` returns named violation codes (0 clean · 1 violations · 2 usage) |
| `changelog [file] <json>` | Appends a changelog row through the writer (defaults to `./CHANGELOG.md`) |
| `budgets [file] <json>` | Re-bases one context-budget ceiling with its growth source; a ceiling shrinkage without a growth source is refused |
| `manifest [plugin.json] <op>` | `skillAdd` / `skillRemove` on the plugin manifest — the alphabetical machine-surface registration |
| `doc (--sync \| --query <term> \| --status \| --rebuild) [--json-only]` | The **retrieval index** (feature 65): one gitignored SQLite store under `.agentic-workflow/index/`, freshness checked on every query, `--query` answering over FTS5 keyword search and — when `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL` / `_MODEL` / `_API_KEY` are set — a hybrid pass over stored vectors. Degradations are declared, never silent: `unavailable-embeddings-not-configured`, `unavailable-embeddings-not-indexed`, `embeddings-model-mismatch`, `unavailable-embeddings-provider-down`. Discovery only: no gate reads it. Positional doc ops (`read`/`edit`/`index`) ship with unit 71 and are refused by name until then |
| `memory probe [--json]` | The five-check memory-substrate health sensor (below) — writes nothing, always exits 0 |

Two sibling binaries ship in the same package and are invoked by the skills:

| Binary | What it does |
|---|---|
| `bin/path-guard.mjs` | Tier 1 path-protection gate (feature 60): `path-guard --unit <unit-dir> --phase <P<n>> [--base <ref>]`, read-only and offline, printing `PATH-GUARD <pass\|fail> — <code>` · exit 0 pass, 1 fail, 2 usage |
| `bin/turn-contract.mjs` | Verifies the canonical turn contract's mechanical boxes: prints `TURN-CONTRACT ok` or `TURN-CONTRACT fail box<N>: <code>`; `--finished` also requires the pushed branch with its open pull request |

## `memory probe` — bounded memory-substrate health (feature 66)

One command answers "can this session trust the Engram memory layer?" before
its first memory read. It writes nothing, issues no MCP tool call (only
`initialize`), and **always exits 0** — a `degraded` verdict is an answer to
record, never a failure that blocks a unit.

```sh
agentic-workflow memory probe         # human block
agentic-workflow memory probe --json  # memory-probe@1 verdict
```

Five checks, fixed order. `ok` requires all five; any failure makes the whole
verdict `degraded` and names the failing checks:

| check | source | bound |
|---|---|---|
| `http-health` | `GET http://127.0.0.1:7437/health`, body `status` must be `ok` | 4 s |
| `mcp-runner` | one JSON-RPC `initialize` to `engram mcp --tools=agent` | 4 s |
| `binary-version` | `engram --version` | 4 s |
| `sync-staleness` | `engram sync --status`, `Pending import` must be 0 | 10 s |
| `session-ambiguity` | `engram doctor --json --check` on `ambiguous_active_runtime_sessions` + `sync_target_closed_space`, every non-`ok` answer reported | 10 s |

The checks are independent, so they run together: the probe costs the slowest
bound (10 s), never the sum of five (32 s). Whole-probe ceiling: 30 s, which is
the backstop for a dependency that ignored its own bound. A bound hit fails that
check and degrades the verdict — never a hang.

Three rules are load-bearing and measured, not assumed:

- **Exit code is not a health signal.** `engram doctor` exits 0 while its JSON
  reports `status: "error"`, so every check parses the answer instead of
  trusting the status code.
- **A responding server that has not synced is not `ok`.** That is why
  `sync-staleness` is a check, and why an unreadable status (e.g. `ambiguous
  project` outside a repo) is a degradation rather than a pass.
- **One answer never hides another.** The session check asks both scoped
  `--check` ids and reports every non-`ok` finding. Stopping at the first would
  silence the sync-target signal permanently on a machine whose session
  attribution is ambiguous — which is the state this unit's own SPEC records.
- **`degraded` is reportable, not fatal.** The caller records the verdict in
  the unit's Evidence and keeps working.

The full `engram doctor --json` sweep is deliberately excluded: it costs 12–23 s
at this repository and the two scoped `--check` calls answer the same question
in under half a second each. `runProbe({ fetchImpl, runImpl, timeoutMs,
totalTimeoutMs })` takes its side effects by injection, so the suite drives
every degraded path with fakes and millisecond bounds — no network, no PATH, no
real engram process.
