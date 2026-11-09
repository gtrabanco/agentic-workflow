# `@gtrabanco/agentic-workflow`

Producer crate for the deterministic agentic-workflow scripts. Feature 37
created it as the vehicle the roadmap mandated (rows 37/38/42/45, declined 43):
the first producer feature creates the crate, later producers land their scripts
as subcommands of it.

- **Shipped via `@gtrabanco/pi-agentic-workflow` (the pi package), two pinned pure-JS dependencies, no native deps, no build step.**
  Repository tooling runs with bun first and node as the guaranteed fallback
  (`AGENTS.md` §Verification); `typebox` is exact-pinned and carries the `doc`
  entry point's envelope validation, and `mdast-util-from-markdown` is
  exact-pinned and carries the `section` locator's node positions. The retrieval
  store lives in a gitignored
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
usage: agentic-workflow <unit-doc|roadmap|changelog|budgets|manifest|doc|section|relay|memory|log|journal|resolve-passes|verify|resources> ...
```

Every operation prints one fixed receipt block (with `--json` the same receipt
as JSON). A refused operation exits **2** with `EDIT REFUSAL — <reason>` **before
writing anything**.

| Command | What it does |
|---|---|
| `unit-doc <NN-slug> <op>` | Typed unit-document service: `create`, `setSection`, `evidence`, `progress`, `validate` — schema-checked, unknown sections refused |
| `roadmap <op>` | Roadmap writer: `rowUpsert` and `annotate` take a table path — `annotate` appends its note inside the row's description cell on the same physical line, never across a line break, because a newline ends the row and a renderer turns the tail into a malformed extra row — and `roadmap check <unit-doc> [--roadmap <f>] [--index <f>] [--json]` returns named violation codes (0 clean · 1 violations · 2 usage) |
| `changelog [file] <json>` | Appends a changelog row through the writer (defaults to `./CHANGELOG.md`) |
| `budgets [file] <json>` | Re-bases one context-budget ceiling with its growth source; a ceiling shrinkage without a growth source is refused |
| `manifest [plugin.json] <op>` | `skillAdd` / `skillRemove` on the plugin manifest — the alphabetical machine-surface registration |
| `doc (--sync \| --query <term> \| --status \| --rebuild) [--json-only]` | The **retrieval index** (feature 65): one gitignored SQLite store under `.agentic-workflow/index/`, freshness checked on every query, `--query` answering over FTS5 keyword search and — when `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL` / `_MODEL` / `_API_KEY` are set — a hybrid pass over stored vectors. Degradations are declared, never silent: `unavailable-embeddings-not-configured`, `unavailable-embeddings-not-indexed`, `embeddings-model-mismatch`, `unavailable-embeddings-provider-down`. Discovery only: no gate reads it. **Experimental.** |
| `doc read \| edit \| index` | The **doc CLI** (issue #366, half A of #192): section-level reads and splices over the #407 locator plus a derived structure index. `doc read --file <path\|-> [--section <id\|title>] [--json]` prints the located section's original bytes (no `--section` → the whole file; the reference is a D5 id `path#slug`, its bare slug, or the exact heading title — a path-qualified id needs a real document path, so with `--file -` the title or the bare slug is the reference); `doc edit --file <path> --section <id\|title> (--replacement <path\|-> \| --set <text\|-> \| --append <text\|->) [--dry-run] [--json]` splices one body source over the located section in place — `--replacement` names a file, `--set`/`--append` carry their text inline (stdin with `-`), exactly one is legal, and `--append` places its block after the section's own bytes; every byte outside the range is the source's own, and a selector resolving to nothing or to several sections is refused (`DOC REFUSAL — NO_MATCH\|AMBIGUOUS_MATCH\|BAD_SELECTOR`, exit 2, before any write); `doc index [--out <path>] [--json]` regenerates the derived JSON structure document (stable section IDs through 65's shared D5 function, parsed frontmatter, skill triggers, unit-doc phase mapping previous/current/next, dependencies) validated against TypeBox schemas — content only, so two runs over an unchanged corpus are byte-identical, and `--out` is where a project decides to keep it. It never opens the retrieval store and is **experimental** until promotion is earned (issue #192's constraint). |
| `section <locate|remove|replace> --file <path\|-> --selector <json> [--replacement <path\|->] [--write] [--json]` | The **section locator** (issue #407): one Markdown document parsed with `mdast-util-from-markdown`, section bounds from node positions (a fenced `##`-like line is never a heading), and a byte-offset splice of the original string. Selectors: heading title, depth-aware heading path, heading regex, and line-in-scope exact/regex. `locate` prints the range receipt, `remove`/`replace` print the transformed document (or persist it with `--write`), `--json` emits one receipt, a selector resolving to 0 or >1 sections refuses with exit 2 (`SECTION REFUSAL — <code>`), a malformed invocation is exit 1 |
| `memory probe [--json]` | The five-check memory-substrate health sensor (below) — writes nothing, always exits 0 |
| `relay <check\|budget\|tiers\|obligations> <unit> [--repo <dir>] [--packet <dir>]` | The **Relay packet checker** (unit 82): the lane's offline half of pi-web's Relay contract. `check` validates the three documents pi-web dispatches (pointer-shaped charter, baton with a closed state, leg and phase cursor, one log entry per leg); `budget` measures the leg handover against the manifest's `relays` ceiling; `tiers` reads each leg's tier from the catalog; `obligations` verifies the unit's ledger is closed. Read-only, stdout is one fixed block ending in `verdict: PASS\|FAIL`, exit 0 pass · 1 fail · 2 usage. One owner for the grammar — `src/relay/Packet.mjs` — which `scripts/relay-packet.mjs` also runs, so both entry points print the identical block |
| `log render --facts <path\|-> [--raw]` | The **journal entry renderer** (feature 394): reads a frozen `log-facts@1` payload (`timestamp`, `branch`, `reason`, `commits{count,range}`, `files[]`) and prints the `docs/LOGS.md` block the pi extension writes at session shutdown. JSON on stdout (`--raw` for the entry alone, so `diff` needs no parsing); exit 0 rendered, exit 2 refused with `LOG REFUSAL — <reason>`. Pure: no clock, no git, no session, so a test or a CI job regenerates and byte-diffs an entry. One owner for the shape — `src/log/render.mjs` — which the extension imports and the parity suite compares against `template/.claude/hooks/log-session-end.sh` |
| `journal aggregate [--dir <root>] [--journal-dir <p>] [--log <p>] [--check] [--json]` | The **merge-to-main aggregator** (issue #405) and, with `--check`, the carrier's **validate-only lint** (issue #452 S3): appends the pending fragments under `.agentic-workflow/journal/` to `docs/LOGS.md` newest-first (ties: branch, kind, session ascending), deletes the consumed fragments, consumes already-present bytes without appending (a crash between append and delete re-runs as a no-op), and refuses anything ambiguous before the first byte moves — exit 2, `JOURNAL REFUSAL — <reason>`. `--check` moves no byte and lists *every* non-conforming entry (exit 0 conforming · 2 otherwise), so the local gate's offline subset can run it on every push. Forge-free by contract (AC5): the example GitHub workflow and the documented `post-receive` hook call this command unchanged |
| `journal write --kind <mechanical\|narrative> [fields] [--session <id>]` | The **programmatic fragment writer** (issue #452): the caller supplies prose fields (`--summary`, `--decisions`, `--next`, `--title`) or a rendered block (`--content -`), or `--facts <path\|->` for the mechanical kind, and the CLI computes the UTC second, the branch, the session slug, the block bytes and the fragment name, self-validates the name and lands the file with an exclusive create. A caller never composes a filename (`--name` does not exist), a foreign kind or a bad body is exit 2 `JOURNAL REFUSAL — <reason>` before any byte lands, and a collision is refused, never overwritten. The write grammar below is `journal-write-grammar@1` |
| `journal name --kind <mechanical\|narrative> [--dir <root>] [--branch <b>] [--session <id>]` | Prints the deterministic fragment name for a writer to use — the grammar below, computed, never hand-rolled. Writes nothing; a missing `--kind` is exit 2 |
| `resolve-passes [--global <path>] [--project <path>] [--command <name>]` | The **spawned-pass model resolution** (issue #201): reads the two routing config files (project wins per entry and per key; both optional) and prints the `resolve-passes@1` JSON table for every published pass name — `model`, `thinking`, `source`, `spawn` (`pinned \| auto \| inline`) and `reason` — with the fail-closed chain applied in code: `passes.<name>` → `passes.default` → the configured cheap tier (`commands.execute-phase`) → the inline floor at the orchestrator's model, recorded, never silent. A malformed selected route refuses before any output: exit 2, `PASSES REFUSAL — <reason>`. Read-only: it writes nothing |
| `verify <unit-doc-path> [--no-git]` | The **document verifier** (issue #260, non-negotiable 2 — the writer's sibling, a deterministic script and never LSP): checks a unit doc against the mirrored unit-doc schema constants — required sections and their order, obligations-ledger closure, receipt marks (`REVIEW-RAN`/`GATE-RAN` whose head sha the repository holds and whose date is not in the future) and `## Log` kind tokens. Also the tree cross-checks (issue #227's 2026-11-03 re-scope residual): a root-relative path citation (`dir/…/file.ext`, optional `:line` suffix) must exist in the repository (`cited-path-missing`), and a `` `id` gate `` citation must resolve to something published — the gate inventory's ids, audit-pr's `GATE_NAMES`, an existing skill or script stem (`cited-gate-unknown`). Context-relative shorthand, brace expansion, commands, branch names and fenced verbatim quotes are not claims, so they are never checked; with no repo context (`--no-git`) both cross-checks are skipped and stay out of the receipt's `checks`. Fails closed: exit 0 prints the `verify@1` receipt, exit 2 prints `VERIFY REFUSAL —` naming every violation. Read-only; the writing half stays `unit-doc` |
| `resources <detect\|admit\|check\|bound> [flags]` | The **trial-envelope layer** (issue #260 S6): `detect` prints the `resources-detect@1` host envelope (memory total/available, cgroup limit, cores/threads, derived parallelism); `admit` refuses an un-decidable brief (no `expected_duration`/`requirements`) or a requirement over the cap/envelope with a `resources-admit@1` receipt, admits a fitting bounded trial, and blocks an identical re-run after a recorded bound-kill; `check` reads a recorded trial's receipt and prints the check-in verdict with data (`resources-check@1`: within/over the estimate, unmeasurable, bound-killed), `--pid` adding the live state and cumulative CPU; `bound` prints the S6 layer-A `systemd-run --user --scope` trial envelope plus its after-exit `systemctl show` receipt read. `--json` where the output is a receipt (detect, admit, check) — `bound` prints shell lines and refuses it. `admit --record-dir` is the one writer (the receipt it records) |

Two sibling binaries ship in the same package and are invoked by the skills:

| Binary | What it does |
|---|---|
| `bin/path-guard.mjs` | Tier 1 path-protection gate (feature 60): `path-guard --unit <unit-dir> --phase <P<n>> [--base <ref>]`, read-only and offline, printing `PATH-GUARD <pass\|fail> — <code>` · exit 0 pass, 1 fail, 2 usage |
| `bin/turn-contract.mjs` | Verifies the canonical turn contract's mechanical boxes: prints `TURN-CONTRACT ok` or `TURN-CONTRACT fail box<N>: <code>`; `--finished` also requires the pushed branch with its open pull request |

## `journal` — the session-log fragment carrier (issue #405)

One file per journal entry under `.agentic-workflow/journal/`, written by the
session instead of a direct `docs/LOGS.md` append; one forge-free aggregator
that runs on merge to `main`, appends the fragments newest-first, deletes them
and bot-commits (the commit belongs to the wiring, not to this CLI). The
carrier directory's presence is the opt-in: without it every writer appends to
`docs/LOGS.md` exactly as before. The naming grammar is normative — every
consumer-facing prose surface names this block instead of restating it:

```text
journal-fragment-grammar@1
kind | shape | what it orders
fragment-name | <utc-second>-<branch-slug>-<kind>-<session-slug>.md | one journal entry per file; the name is the identity, parsed back, never free text
utc-second | YYYYMMDDTHHMMSSZ | the writer's clock at write time, UTC, second precision — a real date, validated on parse
branch-slug | the git branch, sanitized | runs of characters outside [A-Za-z0-9._-] become one "-", trimmed, capped at 64, empty falls back to "x"
kind | mechanical | narrative | mechanical = rendered from log-facts@1 by log render; narrative = written by /log-session
session-slug | the session id, sanitized | the same sanitizer; "local" when a writer has no session id
fragment-content | one entry block | mechanical: exactly log render's bytes; narrative: one "## "-headed entry; always newline-terminated, never CR
aggregate | journal aggregate [--dir <root>] [--journal-dir <p>] [--log <p>] | appends the pending fragments to the journal at its end, newest-first (ties: branch, kind, session, ascending), deletes the consumed fragments, consumes already-present bytes without appending; refuses anything ambiguous with exit 2 "JOURNAL REFUSAL — <reason>" before the first byte moves; a zero-byte .gitkeep is the ONE declared placeholder — skipped, never consumed, because git cannot track an empty directory and an opted-in carrier is empty between aggregations (the opt-in must outlive a full aggregation)
```

One owner: `src/journal/fragment.mjs` (naming, content) and
`src/journal/aggregate.mjs` (consumption). A collision — a target name that
already exists — is refused, never overwritten (two sessions on one branch
differ by session slug, so concurrent names cannot collide by construction).

### The writer — fields in, one conforming fragment out (issue #452)

A model may not compose a filename: the fragment's name is its identity, and a
model that types it bypasses the library. `journal write` takes the prose (or a
rendered block on stdin) and computes everything else:

```text
journal-write-grammar@1
kind | shape | what it orders
write | journal write --kind <mechanical|narrative> [--session <id>] [--journal-dir <p>] [--dir <root>] | the one writer both doors name; the caller supplies fields, never a name
narrative-fields | --summary <text> [--decisions <text>] [--next <text>] [--title <label>] | the prose cells; the block is rendered from them plus the session's git facts
narrative-stdin | --content <block|-> | the rendered block itself; "-" reads stdin so long prose keeps its own bytes
mechanical-facts | --facts <path|-> | a log-facts@1 payload; the bytes are exactly log render's
computed | utc second · branch via git · session slug · fragment name · block bytes | never supplied by the caller
timestamp-pin | --timestamp <iso> | pins the write-time second for a reproducer or a test; the clock is the default
self-check | parseFragmentName(name) before the write | a name the aggregator could not read is never written
collision | exclusive create · refusal | an existing target is refused, never overwritten
carrier-absent | exit 2 · no directory is ever created | the carrier's presence is the opt-in, so a write into a project without it is refused instead of opting the project in
refusal | exit 2 "JOURNAL REFUSAL — <reason>" | an unknown flag, a foreign kind, a bad body or a collision — before any byte lands
carrier-check | journal aggregate --check | validate-only: every non-conforming name/body in the carrier listed, no byte moved, exit 0 conforming / 2 otherwise
```

The read side and the write side share one predicate
(`fragmentFault` in `src/journal/fragment.mjs`), so the carrier lint, the close
and the writer cannot disagree about what a conforming fragment is. The
narrative block itself — heading, `Commits`, `Files`, `Summary`, `Decisions`,
`Next` — has one owner, `src/journal/block.mjs`, which
`scripts/session-close.mjs` also runs.

## Store drivers — where a journal entry lives (issue #374)

The journal's *storage* is pluggable; the Markdown file is the default
driver's render target, never its only option. A store driver owns a canonical
`journal-entry@1` stream (the type is owned by `@gtrabanco/agentic-workflow-schema`:
`src/journal.ts` + `journal-entry.schema.json`, runtime-mirrored in
`src/journal/entry.mjs`) behind three methods — `append(entry)`,
`query(predicate)`, `render(range)` — and every answer is `{ ok: true, … }` or
`{ ok: false, error }`: a refusal is a value, given before the first byte
moves, never a thrown error. The contract is normative — every prose surface
names this block instead of restating it:

```text
journal-driver-contract@1
kind | shape | what it orders
append | append(entry) -> { ok, target?, name? } | insert-only: an append never mutates, rewrites or reorders what is stored; a correction is a NEW correcting entry (owner decision D3, the journal's own "never an edit" rule)
query | query(predicate) -> { ok, entries } | the ONE predicate grammar: { dateRange: {from?, to?}, branch?, keyword? }, normalized by normalizePredicate, filtered by the shared matchesPredicate — never a per-driver re-parse
render | render(range) -> { ok, rendered } | the human journal blocks for a date range, through renderEntryBlock — the render target, not the storage
guarantee | insert-only · arrival-order monotonic · no silent loss · predictable failure | an append preserves arrival order (ids/offsets never go backwards); entry timestamps are NOT required monotonic; every metadata key survives a round trip; an invalid entry or an unusable store is a refusal before mutation
metadata-line | - **Metadata:** <json> | the Markdown transport's consumer-field carrier: ONE trailing line, key-sorted JSON, only when the entry carries metadata — a metadata-free entry renders without it, so the default path stays byte-identical
driver | markdown · sqlite | markdown = the committed docs/LOGS.md, carrier-composed (a fragment when .agentic-workflow/journal/ exists, the same O_APPEND append otherwise); sqlite = the reference store at .agentic-workflow/journal-store/entries.db, insert-only, reusing feature 65's runtime adapter
conformance | runDriverConformance(factory, { root }) | the single shared suite every driver passes before it ships — and a driver that strips metadata, mutates stored entries or accepts invalid entries fails it
selection | programmatic factory | no project-config key: a consumer selects a driver in code (the issue's open question 6 — no second configuration surface)
```

**Authoring a driver** (the documented path, AC7): implement the three methods
over your store; keep the four guarantees (insert-only, arrival-order
monotonic, no silent loss, predictable failure); render every human-readable
block through `renderEntryBlock` — never a hand-rolled grammar; run your
driver through `runDriverConformance` in your suite (a violating driver must
fail it — the shipped fixtures prove the harness catches a metadata stripper
and a stored-entry rewriter). Register nothing: the driver is a factory your
code calls. The shipped drivers (`src/journal/drivers/markdown.mjs`,
`src/journal/drivers/sqlite.mjs`) are the reference implementations; an
enterprise's Postgres+pgvector driver is the consumer's, not this package's.

## `section` — locate a Markdown range and splice it losslessly (issue #407)

One primitive for every section-splice surface: the document is parsed with
`mdast-util-from-markdown`, section bounds come from node positions — a fenced
`## `-like line is never a heading — and a mutation slices the original string,
so every byte outside the reported range is carried through untouched.

```sh
agentic-workflow section locate  --file spec.md --selector '"Objective"'
agentic-workflow section remove  --file spec.md --selector '["Specs","Retirements"]' --write
agentic-workflow section replace --file spec.md --selector '{"headingRegex":{"source":"^S\\d+ —"}}' \
  --replacement body.md --write
```

`locate` prints the range block; `remove`/`replace` print the transformed
document on stdout and persist it with `--write`; `--json` emits one receipt.
`--file -` reads the document from stdin, `--replacement -` reads the
replacement from stdin.

Selector forms (JSON): a title string, a path array (depth-aware), or an object
carrying `heading`, `path`, `headingRegex` (`{source, flags}`), or `line`
(exact string or `{source, flags}`, optionally scoped by `within`). A selector
resolving to zero or several sections refuses with exit 2
(`SECTION REFUSAL — <code>`, codes `NO_MATCH` and `AMBIGUOUS_MATCH`); a
malformed invocation is exit 1 and the caller decides the policy.

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
