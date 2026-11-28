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
usage: bunx @gtrabanco/agentic-workflow@<pin> <unit-doc|roadmap|changelog|budgets|manifest|config|doc|section|relay|memory|log|journal|resolve-passes|runner|verify|charter|materialize|resources|provision|doctor|setup|unit-route|flow|phase-lint|diff-guard|workflow-status|pre-execution-snapshot|needs-input|substrate|ledger-provenance|quality-metrics|forge-read|ceremony|skills|setup-env|test-route|prose-gate-inventory|retention-debt|test-obligation-tags|decision-promotion|dimension-regression|journal-corpus|coverage-gap|repository-state|residual-classify|restatement-sweep|batch-scheduler|delivery-conditions|promise-coherence|skill-context|dependency-advisory-pass|unit-lineage|audit-pr-gate|adversarial-verdict|gate-receipt|review-receipt|repair-receipt|scope-manifest|review-state|differential-baseline|correction-budget|findings-corpus|session-close|test-impact|shared-merge|docs-generated-merge|docs-generate|roadmap-settle|relevant-files|help|scaffold-contract|elicitation|guard-command|turn-contract|git-identity-check|fullauto-merge|telemetry|workflow-doctor|single-repo-leaks> [--debug|--profile] ...
```

`<pin>` is the exact version `skills/runner-contract/references/RUNNER.md`
carries; the scope-less `agentic-workflow` npm name is a `0.0.0` placeholder, so
`npx agentic-workflow` never launches this crate.

Every operation prints one fixed receipt block (with `--json` the same receipt
as JSON). A refused operation exits **2** with `EDIT REFUSAL — <reason>` **before
writing anything**.

| Command | What it does |
|---|---|
| `unit-doc <NN-slug> <op>` | Typed unit-document service: `create`, `setSection`, `evidence`, `progress`, `validate`, `provenance` — schema-checked, unknown sections refused. `provenance` is the stamp's write point (issue #462): it writes the document's `doc-provenance@1` block (or refreshes it in place, byte-identically, at a re-cut) with the writer's own manifest versions and the carrier format derived from the document's section set; creation emits the same stamp, no other operation touches it, and a document whose sections satisfy neither accepted carrier is refused before anything is written |
| `roadmap <op>` | Roadmap writer over the shared-document driver (below): `rowUpsert` and `annotate` take a table path — `annotate` appends its note inside the row's description cell on the same physical line, never across a line break, because a newline ends the row and a renderer turns the tail into a malformed extra row — `roadmap read <table> [--nn <n>]` answers the revision the CAS loop carries back as `expected`, `roadmap fixrow <table> <json>` writes a `## Fixes` row keyed by the issue number in its `[#N](url)` cell (the link passed in explicitly — the writer never invents one), and `roadmap check <unit-doc> [--roadmap <f>] [--index <f>] [--json]` returns named violation codes (0 clean · 1 violations · 2 usage). A write carrying the revision it read (`--expect <hash>` on `rowUpsert`/`annotate`/`fixrow`, or the `expected` JSON field on `rowUpsert`/`fixrow`) refuses with `stale-read` naming both revisions when the table moved since the read |
| `changelog [file] <json>` | Appends a changelog row through the writer (defaults to `./CHANGELOG.md`) |
| `budgets [file] <json>` | Re-bases one context-budget ceiling with its growth source; a ceiling shrinkage without a growth source is refused. The route's own shape decides the live keys: a route carrying `routeEstimateMax`/`routeLinesMax` (the shape the `--routes` checker reads) rebases with those keys — passing `estimateMax`/`linesMax` against it refuses loudly (issue #498 finding 2: a rebase that answers `ok` while writing a key no reader consumes); the legacy scalar shape keeps working |
| `manifest [plugin.json] <op>` | `skillAdd` / `skillRemove` on the plugin manifest — the alphabetical machine-surface registration |
| `config <get\|set\|list\|show\|validate\|init\|reset\|default\|schema> [path] [value] [--scope global\|project\|resolved\|both] [--project <dir>] [--global-dir <dir>] [--category feature\|pi] [--sanitize] [--no-warn-unknown] [--json]` | The **unified config CLI** (issue #427, issue #740): reads and writes the base `agentic-workflow` stem and every discovered extension stem (`pi-agentic-workflow` for the pi package). A file is located as `<stem>.json`, `<stem>.jsonc` or `<stem>.json5` — the first existing wins silently, a write stays in the file that exists, and a new file is created as `<stem>.json5`. Every file is JSON5 (comments, trailing commas, identifier keys, single quotes and the ES5 escapes, hex and leading/trailing-dot numbers, `Infinity`/`NaN`), with `parseJsonc` as the acceptance boundary on both runtimes and a strict end-of-input check; the writer is standard JSON, so a non-finite value is refused instead of becoming `null`. The CLI validates against the registered schema before every write and never coerces. `get` reads the effective value (default scope: project), `list` prints every node with its type/category/default, `show` prints the resolved config, `validate` reports unknown keys and invalid values by path (`--sanitize` writes the file back with both dropped, `--no-warn-unknown` silences only the unknown-key class), `init` writes a commented template and refuses to overwrite, `reset` removes a section or a leaf, `default` materializes every declared option explicitly (its shipped default plus an English comment) into every file of the requested scopes, keeping the operator's values, dropping keys the schema no longer declares and copying an existing file to `<file>.bak-<timestamp>` first (`--no-backup` skips only the copy; `--scope` defaults to `both`), and `schema` prints the composed JSON Schema. A refusal exits 2 with `CONFIG REFUSAL — <reason>` before any byte moves. Extension discovery reads `config-extension@1` descriptors named from a package's `package.json` (`agenticWorkflow.config`) or dropped into `config-extensions/` (any of the three extensions, one per stem); it never executes extension code. The human guide is `docs/workflow/CONFIG.md` |
| `doc (--sync \| --query <term> \| --status \| --rebuild) [--json-only]` | The **retrieval index** (feature 65, hardened by issue #443): one gitignored SQLite store under `.agentic-workflow/index/`, freshness checked on every query. `--query` resolves its mode **at query time** (see the `doc` section below): hybrid when a provider is configured and the store holds chunks embedded under the pinned model, keyword with the declared cause otherwise; an explicit `--mode keyword\|hybrid` always wins. `--sync` chunks incrementally and then embeds the pending chunks with pacing, a bounded request timeout, retry and a store lease, so a stalled socket aborts and two concurrent runs never pay twice. Degradations are declared, never silent: `unavailable-embeddings-not-configured` (also on a `--sync` that had pending chunks and no key), `unavailable-embeddings-not-indexed`, `unavailable-embeddings-lease-held`, `embeddings-model-mismatch`, `unavailable-embeddings-provider-down`, and — when the provider refuses a request instead of being unreachable — `embeddings-request-rejected` with the provider's status/body in the additive `store.rejected` record, the rejected chunks left pending and the rest embedded. `--rebuild` re-chunks from scratch and embeds in the same pass. `--status` reads the store (path, files, chunks, pending) and never syncs. Discovery only: no gate reads it. The pi package's native `/aw-index` command runs the same sync, sizes its spawn cap from `--status`' pending count, and prints its report. **Experimental.** |
| `doc read \| edit \| index` | The **doc CLI** (issue #366, half A of #192): section-level reads and splices over the #407 locator plus a derived structure index. `doc read --file <path\|-> [--section <id\|title>] [--json]` prints the located section's original bytes (no `--section` → the whole file; the reference is a D5 id `path#slug`, its bare slug, or the exact heading title — a path-qualified id needs a real document path, so with `--file -` the title or the bare slug is the reference); `doc edit --file <path> --section <id\|title> (--replacement <path\|-> \| --set <text\|-> \| --append <text\|->) [--dry-run] [--json]` splices one body source over the located section in place — `--replacement` names a file, `--set`/`--append` carry their text inline (stdin with `-`), exactly one is legal, and `--append` places its block after the section's own bytes; every byte outside the range is the source's own, and a selector resolving to nothing or to several sections is refused (`DOC REFUSAL — NO_MATCH\|AMBIGUOUS_MATCH\|BAD_SELECTOR`, exit 2, before any write); `doc index [--out <path>] [--json]` regenerates the derived JSON structure document (stable section IDs through 65's shared D5 function, parsed frontmatter, skill triggers, unit-doc phase mapping previous/current/next, dependencies) validated against TypeBox schemas — content only, so two runs over an unchanged corpus are byte-identical, and `--out` is where a project decides to keep it. It never opens the retrieval store and is **experimental** until promotion is earned (issue #192's constraint). |
| `section <locate|remove|replace> --file <path\|-> --selector <json> [--replacement <path\|->] [--write] [--json]` | The **section locator** (issue #407): one Markdown document parsed with `mdast-util-from-markdown`, section bounds from node positions (a fenced `##`-like line is never a heading), and a byte-offset splice of the original string. Selectors: heading title, depth-aware heading path, heading regex, and line-in-scope exact/regex. `locate` prints the range receipt, `remove`/`replace` print the transformed document (or persist it with `--write`), `--json` emits one receipt, a selector resolving to 0 or >1 sections refuses with exit 2 (`SECTION REFUSAL — <code>`), a malformed invocation is exit 1 |
| `charter <state\|land\|check> --guide <path> [--answers <path\|->] [--bank <path>] [--json]` | The **engineering interview's deterministic half** (unit 556): the interview itself is prose because the answers are a conversation, but *where an answer lands* and *whether a question earned its place* are checked. `state` reports every `- **Key:** value` slot in the guide's `## Project charter` section as `filled` or `placeholder` (a slot whose value is still one `<…>` placeholder, or a list whose every entry carries one, is a placeholder — a documented shape is not an answer), so the round asks only what the project has not declared. `land` writes the payload's `answers` into placeholder slots, records a `defaults` entry as `assumed <date> — <value>` (a defaults payload without `date` is refused: an assumption is never undated), reports a slot the project already filled as `kept` and never rewrites its bytes, and leaves an unanswerable slot `unanswered`. `check` is the bank's own check: the `interview-bank@1` block's declared cells must equal the question table's header, every row must cite a bibliography `source`, state the two behaviours its answers `toggles`, state the `applies-when` condition that earns it, and land in a slot the guide carries; the guide must carry the `Architectural boundaries` slot and its value must be one `<boundary> → machine: <mechanism>` or `<boundary> → prose-only` entry per boundary. Exit 0 pass (write done / check passed) · 1 check blocked · 2 refusal, `EDIT REFUSAL — <reason>` on stderr before any byte moves. No clock, no network, no git: two runs over the same bytes produce the same bytes |
| `elicitation check --bank <path> --spec <path> [--json]` | The **pre-spec's own check** (feature 526, Layer 0 of the input path): a checklist before it is an interview. The `elicitation-checklist@1` block declares the bank's cells and the question table after it must carry exactly those cells, so a column cannot arrive unannounced; every row needs two `answer → behaviour` clauses (a row that toggles one behaviour is not a question), an `applies-when` condition, a `default` — or a stated `none — <why>`, which is what makes an expensive row askable and a cheap one assumable — and a `source`. The `pre-spec@1` artifact is then checked against that bank: its id is the file's own name, its shape is one of the published request families, every row applicable to that shape is present and no row names a field the bank does not declare, each provenance carries the receipt it demands (`repository` → a `path:line` or a grep, `answer` → the `Q<n>` it answers, `assumption` → `assumed <YYYY-MM-DD> — <the row's default>`, `unknown` → the question it became), at most one question is open at a time, and a run that asked declares both model families — equal families require a `same-family: <why>` line, which is reported rather than silently accepted. The question block's columns are imported from the `needs-input` reader that owns the `open-questions@1` grammar, never restated. Read-only: exit 0 `ELICITATION CHECK PASS` · 1 `ELICITATION CHECK BLOCKED` with one finding per refusal · 2 `EDIT REFUSAL — <reason>` for a usage or unreadable-file refusal. It validates the artifact, never a transition: nothing here approves, blocks or gates a route |
| `memory probe [--json]` | The six-check memory-substrate health sensor (below) — writes nothing, always exits 0 |
| `relay <check\|budget\|tiers\|obligations> <unit> [--repo <dir>] [--packet <dir>]` | The **Relay packet checker** (unit 82): the lane's offline half of pi-web's Relay contract. `check` validates the three documents pi-web dispatches (pointer-shaped charter, baton with a closed state, leg and phase cursor, one log entry per leg); `budget` measures the leg handover against the manifest's `relays` ceiling; `tiers` reads each leg's tier from the catalog; `obligations` verifies the unit's ledger is closed. Read-only, stdout is one fixed block ending in `verdict: PASS\|FAIL`, exit 0 pass · 1 fail · 2 usage. One owner for the grammar — `src/relay/Packet.mjs` — which `scripts/relay-packet.mjs` also runs, so both entry points print the identical block |
| `materialize plan\|check\|apply\|evidence --guide <path> [--record <path>] [--invariants <path>] [--feature-map <path>] [--feature-map-declared] [--unit <path>] [--outcomes <path\|->] [--date <YYYY-MM-DD>] [--root <dir>] [--json]` | The **verification-materialization service** (unit 557, issue #564): the interview records a per-boundary `machine: <mechanism>` or `prose-only` answer, and this service is the last mile the product owns — it materializes the *decision*, never the verification. `plan` prints one row per declared boundary plus the feature map and the artifact-capture driver, and a residual for every item without an outcome (`enforced` · `recorded-issue` · `declined` · `pending` · `seeded`/`missing` · `declared`/`undeclared`), exit 0 with `verdict: COMPLETE\|PENDING`. `check` is the declaration-enforcement check: a boundary declared in the charter or in `ARCHITECTURAL_INVARIANTS.md` with no named enforcement mechanism, a scaffolded rule the tree does not carry, or a declared feature map that is absent or still templated is one typed finding from the published vocabulary, each carrying a `finding-route@1`-shaped route (exit 0 pass · 1 blocked). `apply` is the only writer and needs an explicit `consent: "yes"` in its payload: it records each outcome in `docs/workflow/BOUNDARY_ENFORCEMENT.md` and flips a scaffolded boundary's charter answer to `machine: <mechanism>`, writes nothing when a consent is absent or the answer is `"no"` (one residual per item), and blocks the whole batch when a scaffold names a rule file the tree lacks. `evidence` closes the artifact-evidence half: a criterion naming `artifact: screenshot\|video\|state-snapshot` must record `digest: sha256:<hex>` and the project's declared driver command in its evidence carrier, and fails closed with `manual: <AC>` when no driver is declared (exit 0 pass · 1 blocked). Read-only except `apply`; no clock (the landing date is the payload's), no network, no git — two runs over the same bytes produce the same bytes. The shapes are `materialization@1` below |
| `log render --facts <path\|-> [--raw]` | The **journal entry renderer** (feature 394): reads a frozen `log-facts@1` payload (`timestamp`, `branch`, `reason`, `commits{count,range}`, `files[]`) and prints the `docs/LOGS.md` block the pi extension writes at session shutdown. JSON on stdout (`--raw` for the entry alone, so `diff` needs no parsing); exit 0 rendered, exit 2 refused with `LOG REFUSAL — <reason>`. Pure: no clock, no git, no session, so a test or a CI job regenerates and byte-diffs an entry. One owner for the shape — `src/log/render.mjs` — which the extension imports and the parity suite compares against `template/.claude/hooks/log-session-end.sh` |
| `journal aggregate [--dir <root>] [--journal-dir <p>] [--log <p>] [--check] [--json]` | The **merge-to-main aggregator** (issue #405) and, with `--check`, the carrier's **validate-only lint** (issue #452 S3): appends the pending fragments under `.agentic-workflow/journal/` to `docs/LOGS.md` newest-first (ties: branch, kind, session ascending), deletes the consumed fragments, consumes already-present bytes without appending (a crash between append and delete re-runs as a no-op), keeps only the newest fragment of an entry slot and names each superseded one in the receipt (issue #675), and refuses anything ambiguous before the first byte moves — exit 2, `JOURNAL REFUSAL — <reason>`. `--check` moves no byte and lists *every* non-conforming entry — a bad name or body, and an entry slot that is not one entry plus its declared corrections, with every file named — (exit 0 conforming · 2 otherwise), so the local gate's offline subset can run it on every push. A non-CI run is refused before the first byte moves (issue #706): the aggregator is the merge-to-main job, and a local run would consume every pending fragment; `--check` stays local because it moves no byte. Forge-free by contract (AC5): the example GitHub workflow sets `CI` automatically, and the documented `post-receive` hook runs the same command with `CI=true` |
| `journal write --kind <mechanical\|narrative> [fields] [--session <id>]` | The **programmatic fragment writer** (issue #452): the caller supplies prose fields (`--summary`, `--decisions`, `--next`, `--title`) or a rendered block (`--content -`), or `--facts <path\|->` for the mechanical kind, and the CLI computes the UTC second, the branch, the session slug, the block bytes and the fragment name, self-validates the name and lands the file with an exclusive create. A caller never composes a filename (`--name` does not exist), a foreign kind or a bad body is exit 2 `JOURNAL REFUSAL — <reason>` before any byte lands, a collision is refused, never overwritten, and a second fragment of one kind from an explicit `--session` whose conversation already landed one is refused as already registered (issue #468) — one entry per conversation per kind, so the auto-log's mechanical entry and `/log-session`'s narrative one coexist. The write grammar below is `journal-write-grammar@1` |
| `journal name --kind <mechanical\|narrative> [--dir <root>] [--branch <b>] [--session <id>]` | Prints the deterministic fragment name for a writer to use — the grammar below, computed, never hand-rolled. Writes nothing; a missing `--kind` is exit 2 |
| `journal headless --workflow <w> --run-id <id> --actor <a> (--summary <t> \| --block <path\|->) [fields]` | The **headless run's writer** (issue #471): a CI-driven session has no operator, so it declares what it did (`--issue`, `--summary`, `--decisions`, `--next`, `--files`, or a rendered `--block`) plus the identifiers it carries (`--workflow`, `--run-id`, `--actor`), and this operation composes the fragment through the same owners `journal write` does — the session slot carries `gha-<run-id>` and the heading label names the workflow, the run and the actor, so a CI entry is distinguishable from an operator's inside `journal-fragment-grammar@1`'s own fields. One entry per run: a second invocation for the same run id answers `already-present` and writes nothing, so a re-run never duplicates the entry. An absent carrier, an incomplete provenance, an invalid run id or issue, a prose+block pair and a collision are exit 2 `JOURNAL REFUSAL — <reason>` before any byte lands. The distributable action in `journal/` is its adapter (`journal-headless-grammar@1` below) |
| `resolve-passes [--global <path>] [--project <path>] [--command <name>]` | The **spawned-pass model resolution** (issue #201): reads the two routing config files (project wins per entry and per key; both optional) and prints the `resolve-passes@1` JSON table for every published pass name — `model`, `thinking`, `source`, `spawn` (`pinned \| auto \| inline`) and `reason` — with the fail-closed chain applied in code: `passes.<name>` → `passes.default` → the configured cheap tier (`commands.execute-phase`) → the inline floor at the orchestrator's model, recorded, never silent. A malformed selected route refuses before any output: exit 2, `PASSES REFUSAL — <reason>`. Read-only: it writes nothing |
| `runner resolve [--json] [<subcommand> [args...]]` | The **programmatic runner choice** (issue #555): answers which launcher runs this package at its own pin — the closed set `bunx` → `npx --yes` → `pnpm dlx`, each gated by the runtime floors this manifest declares (`engines.bun`, `engines.node`), with `AGENTIC_WORKFLOW_RUNNER` first and a caller's installed bin second. JSON prints `source`, `program`, `argv` and the per-candidate `attempts`; with none of the set, exit 2 `RUNNER REFUSAL —` names every candidate it tried. Read-only and offline: it installs nothing and prompts nothing |
| `verify <unit-doc-path> [--no-git]` | The **document verifier** (issue #260, non-negotiable 2 — the writer's sibling, a deterministic script and never LSP): checks a unit doc against the mirrored unit-doc schema constants — required sections and their order, obligations-ledger closure, the `doc-provenance@1` stamp (well-formed, a generation this package publishes, and in parity with the carrier the document actually carries: `provenance-invalid`, `provenance-unpublished`, `provenance-newer-than-reader`, `provenance-format-mismatch`, `provenance-grammar-mismatch` — an absent stamp is a degradation, never a violation), receipt marks (`REVIEW-RAN`/`GATE-RAN` whose head sha the repository holds and whose date is not in the future) and `## Log` kind tokens. Also the tree cross-checks (issue #227's 2026-11-03 re-scope residual): a root-relative path citation (`dir/…/file.ext`, optional `:line` suffix) must exist in the repository (`cited-path-missing`), and a `` `id` gate `` citation must resolve to something published — the gate inventory's ids, audit-pr's `GATE_NAMES`, an existing skill or script stem (`cited-gate-unknown`). Context-relative shorthand, brace expansion, commands, branch names and fenced verbatim quotes are not claims, so they are never checked; with no repo context (`--no-git`) both cross-checks are skipped and stay out of the receipt's `checks`. Fails closed: exit 0 prints the `verify@1` receipt, exit 2 prints `VERIFY REFUSAL —` naming every violation. Read-only; the writing half stays `unit-doc` |
| `resources <detect\|admit\|check\|bound> [flags]` | The **trial-envelope layer** (issue #260 S6): `detect` prints the `resources-detect@1` host envelope (memory total/available, cgroup limit, cores/threads, derived parallelism); `admit` refuses an un-decidable brief (no `expected_duration`/`requirements`) or a requirement over the cap/envelope with a `resources-admit@1` receipt, admits a fitting bounded trial, and blocks an identical re-run after a recorded bound-kill; `check` reads a recorded trial's receipt and prints the check-in verdict with data (`resources-check@1`: within/over the estimate, unmeasurable, bound-killed), `--pid` adding the live state and cumulative CPU; `bound` prints the S6 layer-A `systemd-run --user --scope` trial envelope plus its after-exit `systemctl show` receipt read. `--json` where the output is a receipt (detect, admit, check) — `bound` prints shell lines and refuses it. `admit --record-dir` is the one writer (the receipt it records) |
| `provision rg [--yes] [--dir <root>] [--json]` | The **ask-first `rg` bootstrap** (issue #269's remaining P1 scope): skips entirely when `rg` is on PATH; otherwise asks before installing (a non-interactive run without `--yes` is a `refused-consent` refusal, never a silent install) and records consent in `<root>/.agentic-workflow/provision-log.jsonl`; installs through user-scoped managers only — brew, cargo, npm, bun, pipx, scoop, in that order, **no sudo/root ever** (a root process is refused before anything runs); with no manager it downloads the pinned ripgrep 15.2.0 binary, verifies the embedded sha256 before any byte lands, and lands it in `~/.local/bin` when writable and on `$PATH`, else `<root>/.agentic-workflow/bin/` plus the `.gitignore` entry. Receipt `provision-rg@1`: `installed \| already-installed \| refused-*`, exit 0 success · 1 refusal · 2 usage. One owner — `src/provision/rg.mjs` — injectable, so tests cover the whole contract without a real manager or download |
| `provision permissions [--scope project\|global] [--write] [--dir <root>] [--json]` | The **guard-plugin policy projection** (issue #654): reads the resolved `pi.guardPlugins` section and renders the operator-level permission layer's policy document — the documented baseline plus the project's declarations in last-match-wins order, with each declared rule's reason kept as the comment above it. `--write` creates the policy file only when it does not exist and refuses an existing one with the block printed for a hand merge (two writers on one policy file is how a policy becomes unknown); without it the block is printed and nothing is touched. A collision (two declarations disagreeing on one rule) is refused by name instead of silently picking one. Receipt `provision-permissions@1`: `rendered \| written \| refused`, exit 0 printed/written · 2 refusal or usage. One owner — `src/provision/permissions.mjs` — injectable, so tests cover the whole contract without a real session |
| `ceremony <object> <op> [flags...]` | The **closed ceremony CLI** (fix #338's registry, distributable since issue #352): `workspace`, `docs`, `findings`, `ledger`, `unit`, `plan`, `tier`, `passive`, `progress`, `evidence`, `acceptance`, `delta`, `refutation`, `fusion`, `review`, `commit`, `roadmap`, `pr` — the whole map, one registry, JSON on stdout, and the uniform exit contract (0 success · 1 usage error · 2 ceremonial block). An object or operation outside the registry is a JSON usage error, never an invented shell command. `pr` is the only operation family that reaches outside the process (`gh`), and its absence is a declared degradation — `gh-missing` and `gh-unauthenticated` are ceremonial blocks (exit 2), any other `gh` failure is a `gh-error` usage error (exit 1), and no path invents an API call. `unit`/`plan` delegate their routing and linting to the same bin's `unit-route` and `phase-lint`, and a write never touches a legacy side ledger — a `folded: yes` row moves to the unit doc's `## Log`. `findings` keeps the carrier's own shape (issue #702): a write splices the `findings-table@1` table inside its section, so the report-only prose beside it survives; a fold appends the `F` line under the id it closed; `append --id` writes the id the caller names and refuses a used one (`duplicate-finding-id`); and a carrier parsed in another grammar, a superseded six-column table or a unit carrying both the doc table and a legacy side ledger is a typed defect (`wrong-carrier-grammar` · `superseded-grammar` · `dual-findings-carrier`) instead of a silent read — the grammars have one owner, `src/runner/findings-carrier.mjs` |
| `skills <discover\|register\|inventory> [flags]` | The **skill-discovery route's machine half** (issue #591): `discover` screens a candidates manifest — the eight `skill-lint` checks plus provenance (source, author, version, license) — and prints the `skill-discovery@1` envelope with a row per candidate, its per-candidate lint receipt and its consent record; a consented candidate that failed the screen is `blocked` and names no install command. `register` appends the one `review-extras@1` row the owner consented to into the guide's "Optional review extras" note (creating the note when absent, refusing a duplicate name or an incomplete row before any byte moves), and `inventory` reads the note back with a decay state per row — `ok`, `unpinned`, `stale`, `incomplete` — which is what `product-audit`'s Installed tooling dimension reports. Offline by contract: no fetch, no installer, and `register` is the only write |
| `phase-lint <plan-path>` | The **phase linter** (feature 91, moved out of the repository's `scripts/`): reads one unit doc's `## Tasks` phase bullets and prints `P<n> Phase-lint: PASS (6/6) · fingerprint …` per phase plus the `verdict` and `fingerprint` lines; a failing rule prints `P<n> box-<k>: <finding>`. Fail-closed codes: `missing-plan`, `no-phases`, `unparseable` (an unreadable file or a missing/out-of-enum `Layer:`), `layer-unknown` (a task target the shipped prefix table cannot map — the plan grammar is this repository's own shape, so the token is named and the unit-doc grammar stays the supported consumer shape), `lint-blocked`. Exit 0 pass · 1 blocked or usage (a second path argument is a usage error, stderr, exit 1). Read-only |
| `diff-guard --base <ref> [--max-lines <n>] [--max-files <n>] [--json]` | The **diff-size guard**: measures `git diff --numstat <ref>..HEAD` against the ceiling and prints `DIFF-GUARD PASS — …` or `DIFF-GUARD BREACH — …` with the anti-gaming note (`DIFF-GUARD ERROR — …`, exit 2, for a usage or unknown ref). Exit 0 pass · 1 breach · 2 usage. Deterministic: no timestamps, no hashes |
| `workflow-status [--compact] [--rag] [--help] [--version]` | The **workflow sensor** (feature 91): the strict Envelope v2 result the drivers consume — repository state, the two roadmap tables, open findings, the fix queue, tier and continuation — validated against the pinned schema package before it is printed. Exit 0 a validated envelope · 1 a fatal read. Read-only, offline except the bounded `gh` forge reads |
| `pre-execution-snapshot <build\|verify\|contract\|claims> [flags]` | The **pre-execution snapshot** (feature 91): `build` writes the `pre-execution-snapshot@1` receipt for a stage (content-bound digests of the bound paths, plus a parent digest for a feature plan stage), `verify` re-derives a receipt's bound digest and reports drift, `contract` prints the published contract constants, and `claims` (issue #634) projects that same `changedPaths` attribution onto a unit's claim ledger, marking a row `stale (P<n> · <sha>)` whose cited bytes moved after a recorded phase — `--write` lands the mark, `--check` answers exit 1, and it reports rather than gates (`claim-staleness@1` below). `--root` re-points the sensed repository. Exit 0 ok · 1 a real error (named, never a stack trace in the receipt), or `--check` with a stale claim · 2 a `claims` usage error or a unit with no claim ledger |
| `needs-input <unit-dir> [--workspace <dir>] [--json]` | The **open-question sensor** (feature 91): reads the unit's `decisions.md` `open-questions@1` ledger and prints the block (`open-questions@1`, open count, entries, route back) or the refusal naming the defective row. The third route (issue #644) is the one it **verifies**: a row routed `init-workspace:<class>` claims no document in the workspace owns its fact, so the dispatcher reads the substrate census and refuses the claim (`substrate-present`) when the surface exists — the scaffold route cannot become a way around an owner. `--workspace` re-points that census; without it, the nearest ancestor carrying a guide or a git directory. Exit 0 answered · 1 refused · 2 usage. Read-only |
| `substrate check --workspace <dir> [--guide AGENTS.md] [--json]` | The **substrate coverage gate** (issue #644): one row per substrate class — `architecture`, `decision-records`, `api-posture`, `documentation-map` — each `present`, `declined` (a dated row in the guide's `substrate-declines@1` block, written only on an explicit yes) or `absent`, plus the summary and verdict. `init-workspace` runs it on both routes: an `absent` class is a refused install, or the recorded decline. Exit 0 nothing absent · 1 one or more absent · 2 refusal or usage. Read-only |
| `ledger-provenance <ledger-or-unit-doc> [--json] [--check] [--annotate]` | The **fold-queue recount** (feature 91): reads a `## Findings` table (or a legacy `review-findings.md`) and proves each `folded: yes` row cites a commit that is reachable and whose subject claims that row. `--check` runs the same walk read-only and exits 1 on any row needing a repair, naming the rows by cause; `--annotate` is the one writer. Exit 0 clean · 1 repair needed · 2 usage |
| `quality-metrics [--window <days>] [--until <instant>] [--repo <dir>] [--out <path>]` | The **project-quality sensor** (feature 558, issue #565): the DORA four keys plus the reversion ratio over a trailing window (default 90 days), printed as the `quality-metrics@1` document the schema package publishes — six metric rows, every row carrying a `measured`/`derived`/`unavailable` label, and a metric that cannot be computed naming its cause instead of reporting a zero. `--until` pins the window's end so a report is reproducible; `--out` is the only byte it may write. Read-only: every git and forge call is a read, the forge dimension is bounded, and an unreadable forge or a history that truncates the window degrades the affected rows in `degraded`. Exit 0 a validated document · 2 a refusal (bad flag or value, nothing measured) · 1 an unexpected failure. The metric definitions are `quality-metrics@1` below |
| `telemetry reconstruct <stats\|samples\|write> [flags]` | The **manual telemetry reconciliation** (issue #624): rebuilds the session records Pi's own transcripts preserve when `session_shutdown` never fired (pi-web keeps a session alive between prompts), and merges the missing ones into the stores the live sink writes. Discovery walks both store layouts — the flat `.jsonl` file beside the session directory and the old nested `<run>/session.jsonl` one (#638) — and excludes the spawned subagents in both (artifact file name, or the transcript's own `subagent-` `session_info` mark); the old layout never persisted an operator transcript, so its unmarked transcripts are the only ones it can contribute. `stats [--by-model] [--by-date] [--project <path>]` prints the `telemetry-reconstruct@1` totals plus the requested breakdowns; `samples [--jsonl <path>] [--project <path>]` prints one JSON line per record (or dumps them to the named file); `write [--jsonl <path>] [--ledger <path>]` appends only the sessions a destination does not already carry — keyed by the session id after `pi:session=`/`pi:reconstruct=`, so a forced second run adds nothing. The record keeps `unit`, `phase`, `version`, `changed_paths` and `tool_ms` null (a transcript cannot answer them, and the reconstruction never attributes a unit); the ledger row is the documented projection with `0` in its two count cells and is skipped by `scripts/tier-cost.mjs` rather than refusing the ledger. Manual only: no session event reads a transcript. Read-only toward anything it is not told to write; exit 0 answered · 2 refused (`RECONSTRUCT REFUSAL —`, nothing written) |

| `forge-read <issue\|pr> <number> [--comments] [--reviews] [--json]` | The **guarded forge read** (issue #612): the one route that may return third-party forge text. It performs the read over REST (`gh api`, one transport for issues, PRs, comments and reviews), hands every field that can carry third-party text to the content guard, and prints the fenced delivery — one block per admitted field with its stripping declared beneath it, one line per exclusion, and the metadata the caller needs (state, labels, head sha, draft, merged, mergeable) on its own line. `--comments` adds the conversation thread, `--reviews` the PR's reviews and inline review comments, `--json` prints the `forge-read@1` envelope instead of the rendered form. An unreachable forge refuses by class (`unavailable-forge-missing-cli`, `-timeout`, `-auth`, `-no-network`) and prints no envelope: a read that could not reach the forge is not an empty answer. The guard's semantics are #470's (`contentGuard`, `CONTENT_GUARD_REASONS`) and are consumed as published · exit 0 read and delivered · 2 a refusal or a usage error |
| `unit-route <unit\|issue> [--triage <unit> [--json]]` | The **unit router** (feature 91, moved out of the repository's `scripts/`): reads one unit doc's own ledger and prints the `UNIT ROUTE —` block — `status`, `route`, `next`, the open row ids, the bounded read set, `review-cycles`, `ledger-size` and a `fingerprint` — or, with `--triage <unit> --json`, the closed nine-step plan block derived from the bundled catalog (`src/runner/catalog.json`). Read-only, offline, dependency-free beyond the pinned schema package; exit 0 answered · 1 usage · 2 triage refusal. The project it senses is the worktree enclosing the caller's working directory, so it runs from any sub-directory of the project |
| `flow <unit> [--stop-after plan] [--yes] [--retriage] [--record] [--json]` | The **deterministic lane driver** (issue #669): reads machine state only — the closed catalog through `unit-route --triage`, the router's own route, and the unit doc's `## Tasks`, `## Risk tier` and `## Log` through their one readers — and prints the `FLOW —` block: the one next step, its command, the bounded read set (the step's reference plus the unit's state pointers) and the turn-contract receipt. A planned unit implements directly (`--retriage` is the only path back to planning); a `high`-tier unit stops after its plan unless the owner typed `--yes` (which lands as a human-owner `D` row in the unit's `decisions.md`); an explicit `--stop-after plan` always stops and prints the `APPROVAL —` block, which is what `/draft` runs. `--record` writes the composed session mode into the unit's `decisions.md` (the unit doc is never written by a script). Read-only otherwise · exit 0 a decision (a halt included) · 1 usage or unknown unit · 2 a refusal (an unknown step name and a non-`plan` stop point included — the v1 explicit stop is the plan) |

| `relevant-files <unit-doc> [--phase P<k>\|all] \| [--changed <a,b> \| --base <ref>]` | The **phase read-set resolver and its discipline** (issue #269, in the CLI since unit 553): `--phase` prints the unit doc's per-phase `Relevant files:` union, one path per line (`all` unions every phase), and the default mode checks a changed set (`--changed a,b` or `--base <ref>`) against those lists plus the document's own citations outside `## Tasks` — a changed file that is neither listed nor logged exits 1 naming it, a unit doc with no list at all answers `read-set: absent` and passes (the executor's prose owns the fallback), and a malformed read set is reported, never silently dropped. Read-only: it reads the document and the git range and writes nothing · exit 0 pass · 1 discipline fail · 2 usage |
| `scaffold-contract <check\|authoring> [<unit-doc>] [--workspace <dir>] [--json]` | The **scaffold contract that travels** (issue #701): `check` compares a project's exported unit-doc templates (`docs/features/_TEMPLATE/SPEC.md`, `docs/fix/_TEMPLATE/SPEC.md`) against the section contract the installed release publishes, one `SURFACE … — MATCH\|MISMATCH\|ABSENT` row each and one `MISMATCH` line per disagreement, so a template that drifted after install, upgrade or a local edit is named instead of discovered by an audit rejection; a workspace carrying no template answers `SCAFFOLD ABSENT`, never a pass it did not measure. `authoring` runs the same check on a staged unit doc at emission — missing, duplicate, out-of-order and wrong-level sections through the schema package's own selector vocabulary, plus the `ac-hash` frontmatter promise the templates make and never ship a section for. The contract is read from its owner (`UNIT_DOC_SECTION_SHAPES`, `resolveUnitDocShape`, `selectSpecProduct`) and the acceptance section's bytes from `sectionText`, so there is no second copy to drift. Read-only and offline · exit 0 clean · 1 a mismatch or defect · 2 refusal or usage |
| `help [<subcommand>] [--json]` | The **CLI's own grammar** (issue #603): a bare `help` prints the subcommand index grouped by family, `help <sub>` prints one subcommand's usage, its closed `ops` and its `flags`, and `--json` prints the same facts as machine data (`{subcommands:[{name,family,summary,ops,flags,usage}]}`), with `help <sub> --json` answering the same envelope carrying just that one row. Every subcommand answers `--help`/`-h` with the identical block, and a usage-class failure names the legal candidates plus one `agentic-workflow help <sub>` pointer. The registry it renders from (`src/runner/help.mjs`) is pinned against this table in both directions by `test/cli.surface.test.mjs`, so a new subcommand cannot ship without its help row. Read-only, offline · exit 0 always |
| `roadmap-settle [--root <dir>] [--json]` | The **roadmap done-settle gate** (issue #316, in the CLI since unit 553): offline, it checks the inverse invariant the writer and the router only enforce on the write path — a unit doc that carries a PR URL must have its index row reading `done · [#N](<same url>)`. The comparison is the crate's own `checkUnitDoc`, so this command carries no second copy of the grammar; codes are the published `ROADMAP_CHECK_CODES` (`row-missing`, `slug-mismatch`, `pr-url-unsettled`). A fix doc with no active row is counted as a skip, never silenced. Read-only · exit 0 PASS · 1 violations · 2 usage or no roadmap at `--root` |
| `docs-generate [--root <dir>] [--check \| --dry-run]` | The **generated documentation projection** (feature 396, in the CLI since unit 553): it reads the repository's own artifacts — the unit docs, the roadmap rows and the shipped code surface — and renders them into the format the guide's `Docs site` block declares (`md`, `mdx`, `html`, `latex`; no block degrades to markdown and says so, an unknown value refuses). It also syncs the roadmap's two tables: a feature folder without a row gains one, a hand-owned cell passes through untouched, and a unit doc's `roadmap_summary:` overrides its summary cell. `--check` is the drift receipt (missing/stale/orphaned pages plus a stale roadmap, exit 1), `--dry-run` the plan, and the write mode is the only one that moves a byte. Deterministic: no clock, no absolute path, two runs byte-identical — generated pages live under `<content-dir>/generated/` and are never authored by hand |
| `docs-generated-merge [--install [--repo <dir>]] \| <base> <ours> <theirs> [marker-size] [path]` | The **generated-projection merge driver** (fix #420, in the CLI since unit 553): `.gitattributes`-armed checkouts resolve a conflicting projection the honest way — the incoming side, byte for byte, because a projection is a function of a tree and neither side is the merged tree's. A path outside the declared projection or the roadmap index refuses closed (exit 1, the conflict left in place); `--install` writes the two `merge.<driver>` keys, naming the package's own runnable entry (`bin/docs-generated-merge.mjs`) unless the caller passes its own |
| `shared-merge [--install [--repo <dir>]] \| <class> <base> <ours> <theirs> [marker-size] [path]` | The **shared-document merge driver** (issue #498, moved into the crate by #630 and registered here by #553): one file-class registry (`roadmap`, `budgets`, `repo-state`, `logs`, `telemetry`) decides how two branches' concurrent writes to a shared document merge — a row union, a key union, or a fail-closed conflict for the classes whose truth cannot be unioned. `--install` arms every declared class in a checkout. The mechanics are `src/writer/shared-merge.mjs`'s and `bin/shared-merge.mjs` is the same module's sibling entry, so a project that ships no `scripts/` tree can arm a driver |
| `test-impact --base <rev> [--paths <p>…] [--references <file>]` | The **test impact set** (issue #356, in the CLI since unit 553): the tests a change can affect, unioned from four static sources — the identifiers it touches resolved to the committed suites that reference them, a suite naming the changed path, the suite beside the changed file, and the caller's own LSP references — never a guess and never the whole gate standing in for one. A prose-only change answers `verdict: empty` and invents no test; a project whose tests follow other conventions answers `no candidate test file matched` and falls back to its own gate. Deterministic, read-only (one `mktemp` scratch file it removes), offline · exit 0 a verdict printed · 1 a refusal |
| `session-close render \| close` | The **mechanical half of ending a session** (issue #182, in the CLI since unit 553): `render` computes every fact a model used to re-derive by hand (branch, timestamp, commit count and range, files touched) and prints the entry for the sanctioned writer to apply — it writes nothing; `close` refuses unless the log was appended to but not rewritten, commits it alone, then commits the pending machine-owned ledger class (`telemetry commit`'s own module, issue #727) and names whatever is still uncommitted. It never runs `git add -A`, because committing a concurrent conversation's half-finished work is the hazard the entry exists to prevent. Exit 0 clean · 2 leftovers · 1 refused. The pi session handler resolves this command when a project ships no `scripts/` tree, which is what ends its `writer: "absent"` degradation |
| `telemetry commit [--class <id>…] [--zone <zone>] [--subject <s>] [--repo <dir>] [--dry-run] [--json]` | The **machine-owned ledger's one commit** (issue #727): the class the `machine-ledger-commit@1` block declares (`skills/pre-execution-review/references/LEDGERS.md`) commits by machinery, outside any session's lifetime — `git commit -- <paths>`, never `git add -A`, behind a lock beside the index, with the subject the changed class declares. `auto` rows are the ones the machinery also writes (the telemetry ledger, the session log, the journal fragments); a held lock answers `locked` rather than blocking a teardown, and `clean` commits nothing at all. The pi extension spawns it at its teardown, `session-close close` and `telemetry reconstruct write` call the same module after their own write, and the local gate's `machine-ledger-commit` prelude runs it before dispatching any step, so a push carries the ledger committed. stdout is the `machine-ledger-commit@1` envelope · exit 0 committed/clean/locked/not-a-repository · 1 the commit failed · 2 usage |
| `findings-corpus [--repo <dir>] [--json] [--min-recurrence <n>] [--threshold <n>]` | The **retrospective findings corpus** (issue #437, in the CLI since unit 553): it joins the unit docs' `## Findings` and `## Log` marks into one corpus so a recurring finding class can be attributed to the phase that should have caught it — the reader `coverage-gap` and `dimension-regression` build on, never a second parser. Read-only · exit 0 answered · 1 a defective ledger · 2 usage |
| `correction-budget --unit <unit-dir> [--rounds-spent <n>] [--repo <dir>] [--json]` | The **correction budget as a measurement** (issue #437, in the CLI since unit 553): the review→fold loop's stopping condition stops being prose — `batch-size` is the measured median of folded findings per fold commit, `budget` is `ceil(open fix-now ÷ batch-size)` clamped to a bounded range, and a finding below the materiality floor is classified as `nimio` (listed for a dated note, never a round). An exhausted budget prints the typed `NEEDS-YOUR-DECISION` instead of granting another round. Read-only · exit 0 the budget holds · 1 spent or no findings ledger · 2 usage |
| `differential-baseline --base <rev> [--repo <dir>] [--json]` | The **differential baseline** (issue #301, in the CLI since unit 553): it materializes the base revision in a detached worktree and runs the declared validators against it, so "the behaviour changed" is measured against a real copy instead of argued from a memory of `main`. The worktree is removed on every exit; a validator that cannot run is a reported skip, never a pass. Read-only toward the delivered tree · exit 0 measured · 1 a refusal · 2 usage |
| `review-state record\|mark\|check\|show --unit <slug> [--path <p>] [--status reviewed\|skipped] [--reason <r>] [--base <ref>] [--head <ref>] [--reset]` | The **review-state ledger** (feature 32, in the CLI since unit 553): the per-unit record of which review axes ran, at which head, with which evidence — `record` derives the unit's axes at a head, `mark` records one axis' status with its evidence, `check` answers whether the closure is complete, and `show` prints the state. It never approves a change; it answers what is on record, so a reviewer cannot claim an axis nobody ran. Exit 0 answered · 1 refused · 2 usage |
| `scope-manifest sign\|verify --base <ref> [--head <sha>] [--root <repo>]` | The **scope manifest** (feature 25, in the CLI since unit 553): `sign` emits the digest-bound manifest of the paths a change actually affects (sorted, with each file's blob digest and one scope digest), and `verify` re-derives it at a recorded head, so a review that approved one scope cannot be reused for another. Read-only · exit 0 signed or verified · 1 mismatch · 2 usage |
| `review-receipt <emit\|verify\|post> [flags] [--root <repo>] [--dry-run]` | The **review receipt** (feature 25, in the CLI since unit 553): `emit` renders the SHA-bound receipt body a review pass publishes, `verify` checks an existing receipt against the reviewed diff at a head, and `post` posts it to the pull request — the one path a merge gate reads, so a `REVIEW-VERDICT: PASS` that nobody signed never satisfies it. Read-only except `post`, which is idempotent · exit 0 receipt emitted or verified · 1 refused · 2 usage |
| `gate-receipt run\|verify [--root <dir>] [--gate <path>] [--receipt <path>] [--log <path>]` | The **gate receipt** (fix #338, in the CLI since unit 553): `run` executes the project's gate, records the exit code, the duration, the log and the digest-bound manifest of the paths the gate read, and writes the envelope; `verify` re-derives that manifest at the current head and judges the receipt `pass`/`stale`/`invalid`/`missing`. A receipt that cannot be re-derived is a blocker, never an assumption. `run` writes the two files it names; `verify` is read-only · exit 0 pass · 1 fail or stale · 2 usage. Since issue #728 `run` is the producer the lane calls: a step owner runs its verification gate **as** this command, so the green run and the receipt are one event (owner: `skills/pre-execution-review/references/LEDGERS.md` §The producer) |
| `repair-receipt <emit\|verify> [flags]` | The **repair receipt** (issue #698): the fold's `REPAIR-RECEIPT`, machine-consumable. `emit` derives the typed `fold-findings:repair` marker from the repository at HEAD — delta class (`ceremony`/`docs-only`), scope digest, acceptance hash, gate evidence digest and the open `BLOCKER`/`CRITICAL` count — encodes the route the facts support (`RE-REVIEW-SKIPPED`/`RE-REVIEW-OPTIONAL`/`RE-REVIEW-REQUIRED`/`REPLAN-ROUTE`/`PRODUCT-ROUTE`), posts it idempotently and commits nothing; `verify` re-derives every claim at a head and answers whether the head is merge currency, fail-closed on any mismatch. The merge gate and `review-receipt verify` consume it before the `/review-change` route, so a repaired, gate-green, acceptance-stable head is not re-reviewed over its own bookkeeping. Exit 0 currency · 3 absent · 4 not current · 1 refused · 2 usage |
| `adversarial-verdict --record <path> --diff <ref>` | The **adversarial pass's checker** (issue #358, in the CLI since unit 553): it reads a `review-change --adversarial N` pass record and the reviewed diff and refuses every row that breaks the contract — a `kill` without falsifying evidence, a finding the pass raised itself without its own reproducer, a reflector row without `keep\|drop` and a reason, a reproducer that also fires on untouched adjacent code. The three closed sets are read from the published schema package, so an unexported token can never be accepted. Read-only · exit 0 the record may persist · 1 refused · 2 usage |
| `audit-pr-gate <evaluate\|hygiene\|comment> [flags]` | The **merge gate** (feature 25, in the CLI since unit 553): `evaluate` reads the review receipt, the gate receipt and the hygiene facts and prints the merge verdict as JSON — `MERGE-READY` (exit 0) or `BLOCKED` (exit 2) with one blocker per gate that is not a pass, each carrying its own outcome and reason — `gate <name> failed`, `gate <name> unevaluatable: <why>`, `gate <name> skipped` — and the route that repairs it. A gate the caller never supplied was not evaluated, so it answers `unevaluatable: not-evaluated`, never a content failure the checkout did not observe (issue #702); the `gates` report in the same document carries every gate's outcome and reason, and a caller's `--gates-json` value outside `pass \| fail \| skipped \| unevaluatable` is a usage error rather than a classification. `hygiene` reads the terminal state (clean tree, pushed branch, non-draft PR) and `--apply` runs only the mechanical repairs; `comment` posts the verdict's SHA-bound marker once — `merge-ready` or `blocked` — and confirms it landed. The freshness rule is delegated to the `gate-receipt` command — one implementation, never a second copy here — a judged missing/stale receipt is a `fail` naming the judge's own status, and a judge that cannot be read is `unevaluatable: judge-unreadable`. `comment` is the only writer · exit 0 ready · 2 blocked · 1 a refusal |
| `unit-lineage --unit <slug> [--root <dir>] [--json]` | The **lane-era lineage gate** (issue #305, in the CLI since unit 553): it re-derives a unit's triage block from the facts — the Steps line, the obligations ledger, the receipts — instead of pinning substrings, so a reason that no longer follows from the evidence is `BLOCKED` with the re-triage route. An absent or open obligations ledger blocks too. It spawns the router's triage and the receipt verifier from this package's bin, never from a `scripts/` copy in the project it judges. Read-only · exit 0 pass · 1 blocked · 2 usage |
| `dependency-advisory-pass [--root <dir>] [--json]` | The **dependency advisory scan** (feature 67, in the CLI since unit 553): it reads the project's own lockfile and every `packages/*` manifest and reports the pins that drifted from what the registry publishes — an exact pin behind its target is drift, a newer major outside a partial pin's range is a notice, and a fetch failure degrades with a visible notice instead of inventing a verdict. The semver comparison and the lock reader are `src/dependency/`'s, shared with this repository's own version-parity gate, so the two can never disagree. Read-only and offline except the bounded registry reads · exit 0 clean or degraded · 1 drift · 2 usage |
| `skill-context [<skill>…] [--manifest-only] [--routes] [--documents] [--json]` | The **context-budget sweep** (issue #471, in the CLI since unit 553): it measures every skill's `SKILL.md` and its references against the ceilings the project's manifest declares (`ceil(UTF-8 bytes / 4)`, never a provider billing estimate) and reports each failure by its path, so a skill that outgrew its budget is a red gate instead of a review-time surprise. `--routes` reads the route ceilings, `--documents` the always-loaded guide layer, `--manifest-only` validates the manifest itself. Read-only and offline · exit 0 PASS · 1 a failure · 2 usage |
| `promise-coherence [<path>…] [--json]` | The **promise-coherence pass** (issue #305, in the CLI since unit 553): every "measured at the head" claim in the prose it reads is re-measured against the bytes it names — a size the ceiling rests on, a count a contract states, a `file:line` citation — and a claim that no longer reproduces blocks. The report validators it may re-run are an allowlist of read-only verdicts, in both citation forms (`scripts/<name>.mjs` and `runner <command>`); anything else stays a disclosed skip, never a silent pass. Read-only and offline · exit 0 coherent · 1 a claim failed · 2 usage |
| `batch-scheduler [--root <dir>] [--issues-file <json>] [--state <path>|--no-state] [--remote <url>] [--mark-launched <n>] [--json-only]` | The **deterministic batch planner** (feature 88, in the CLI since unit 553): it reads the live work graph — the roadmap tables, the open issues, their declared surfaces and dependencies — and emits the fixed `batch-plan@4` envelope: which issues can run together now, which are blocked and by what, which unit is really in flight, which pairs would rewrite the same file and which lane each occupies. Order-respecting and collision-free by construction, with `--infer-surfaces` reading a body's declared surfaces when a forge read is unavailable. Lane keys come from the project's own surface vocabulary — the shipped roots, plus `batchScheduler.surfaces` in the project config, else the project's own directories — so a tree that is not this repository's layout still plans in parallel lanes (issue #716; owner: `skills/batch-scheduler/references/PLAN.md` § The surface vocabulary). Read-only except its recorded launch state · exit 0 a plan · 1 a fatal read · 2 usage |
| `test-route (--check <path> \| --list) [--map <path>] [--root <dir>]` | The **bounded gate planner** (issue #318, in the CLI since unit 553): it answers "which suites does THIS path need?" from the project's committed route map, never from inference. Fail-closed is the whole safety property — an unmatched path, an unreadable map, a route naming a suite that does not exist, or a glob selecting nothing all answer the FULL suite, so fewer tests than the full gate is reachable only through a matched, committed route. `--map` names a map the project keeps elsewhere. Read-only · exit 0 a plan was printed · 1 a usage error or an unreadable map |
| `prose-gate-inventory [--repo <dir>]` | The **gate-inventory reader** (issue #441, in the CLI since unit 553): it parses the project's `docs/workflow/GATE_INVENTORY.md` into its carriers, reasons, tiers and priorities, and refuses a row whose declared token is not in the file it names — a carrier the tree no longer holds is a red inventory, never a stale promise. `product-audit`'s coverage join reads it through this command. Read-only · exit 0 PASS · 1 a missing token or malformed row · 2 usage |
| `coverage-gap [<dir> \| --repo <dir>]` | The **forward-looking coverage join** (issue #590, in the CLI since unit 553): it crosses the three already-committed carriers — the declared verification criteria, the detectors the gate inventory names, and the unit-doc finding corpus — and emits one typed receipt with three gap classes and no judgement: `criterion-uncovered`, `class-uncovered`, `detector-idle`. Whether a gap matters and where it routes is the audit's decision, not this join's. Read-only · exit 0 a receipt · 1 a refusal · 2 usage |
| `decision-promotion [--root <dir>] [--json]` | The **decision-promotion sweep** (issue #650, in the CLI since unit 553): a decision recorded in a unit's `decisions.md` declares its scope, and a `cross-unit` row must name the permanent owner doc it was promoted to — a cross-unit decision with no owner is a finding, never a buried note. Read-only · exit 0 clean · 1 a finding · 2 usage |
| `dimension-regression [--base <ref>] [--root <dir>] [--remote <name>]` | The **dimension-regression gate** (issue #590, in the CLI since unit 553): a change that touches a review surface must record a `runner dimension-regression` run in a changed unit doc's log — otherwise the dimension the audit rests on was silently skipped for that range. A range touching no review surface is `not-applicable`, never a pass. Read-only · exit 0 clean or not-applicable · 1 a finding · 2 usage |
| `journal-corpus [<dir> \| --repo <dir>] [--recurrence <n>]` | The **journal corpus reader** (issue #616, in the CLI since unit 553): it joins the session journal's entries into the corpus `product-audit`'s journal dimension reads, with the closed shapes it publishes, and validates the carrier's own grammar before it counts anything. Read-only · exit 0 a receipt · 1 a defective entry · 2 usage |
| `workflow-doctor <mine\|battery\|bundle\|route\|publish> [--root <dir>] [--skills-root <dir>] [--json]` | The **ceremony-failure doctor** (issue #703): one user-initiated pass over the project's own durable record. `mine` joins the journal and the unit docs' `## Log` into one stable row per ceremony event; `battery` carries the tool doctor's `doctor@1` envelope as-is beside the runner version and the pin read inside the **located** skills tree — resolved declared-over-discovered (`--skills-root`, then the host's `AGENTIC_WORKFLOW_SKILLS_ROOT`, then the documented install dirs `.agents/skills` and `.claude/skills`, the authoring/source `skills/` tree last; no tree found is the named `skills-absent` degradation that says how to declare one) — beside the ceremony profile/tier; `bundle` validates a triage file against the closed discard/report rubric and renders the anonymized bundle; `route` matches each report class against the guarded forge read and proposes an existing issue or a new one; `publish` is the only write, consent-gated by `--yes`. Read-only apart from `publish` · exit 0 a receipt · 1 a required input or the forge is unavailable · 2 a usage or contract refusal |
| `repository-state [<snapshot>] [--ttl-days <n>] [--today <YYYY-MM-DD>] [--json]` | The **Normalized Repository State reader** (feature 18, in the CLI since unit 553): it reads the frozen state document and answers what is frozen, what a contradiction is, and which facts a later decision may not silently move — `discover-repository-state` writes it, `resolve-repository-state` alone may replace it, and everything else reads it through this command. Read-only · exit 0 answered · 1 a contradiction · 2 usage |
| `residual-classify <surface> [--root <dir>] \| --receipt <surface> --date <YYYY-MM-DD> \| --inventory --base <rev>` | The **residual classifier** (issue #340, in the CLI since unit 553): an added surface is classified by what actually consumes it — `used` (live consumer, with the consuming line named), `andamio` (a recorded planned-consumer promise), `orphan`, or `half-built` — so a retirement is legitimate only in the `orphan` state. `--inventory --base <rev>` prints one row per added surface of a change, the anti-divergence receipt a plan decides. Read-only · exit 0 classified · 1 a refusal · 2 usage |
| `delivery-conditions --close-check <issue> \| --sweep [--issues-file <json>] [--repo <owner/name>] [--root <dir>] [--limit <n>] [--json]` | The **delivery-condition carrier** (issue #704): a condition that gates delivery names an issue the machine re-checks, and this is the machine. `--close-check <n>` is the guard you run before writing a close: a coverage claim (`closed as covered by #N`) against an issue that is still OPEN is refused as `covered-by-open`, and the refusal names the route — deliver the cover, or keep the issue open with a native `blocked-by` link. `--sweep` is the scheduled backstop: it reads the issue corpus (bodies **and** comments — #301's reopen condition lived in a comment) plus the roadmap's `## Fixes` rows, extracts the five families (`covered-by`, `reopen-when`, `proceeds-when`, `waits-for`, `retire-when`), judges each against the cited issues' states and reports the ones whose follow-up came due. Report-only: it writes nothing, mutates no forge state, and prints no third-party text. `--issues-file` reads a cached `[{number, state, body, comments}]` array offline, which is what makes a run deterministic; an unreadable cache is exit 2, an unreachable forge is a named `DEGRADED unavailable-forge-…` line with exit 1. The block is `delivery-conditions@1` below · exit 0 PASS · 1 VIOLATION or UNRESOLVED · 2 usage |
| `single-repo-leaks [--root <dir>] [--json]` | The **single-repo-leak census** (issue #717, in the CLI since this unit): every subcommand declares the root it resolves a path against (`project`, `product`, `host`) in the help registry, and the read-only `project` rows are run once against a consumer-shaped fixture — a path token that resolves in the product tree and not in the fixture is the leak this class is about, so a new surface cannot assume this repository's layout silently. Read-only · exit 0 clean · 1 a finding · 2 usage |
| `restatement-sweep [--repo <dir>] [--json]` | The **restatement sweep** (issue #646, in the CLI since unit 553): it reads the seeded restatement corpus and reports every place a rule is worded a second time outside its owner, so duplication is detected by a gate instead of by a reviewer's memory. Read-only · exit 0 clean · 1 a restatement · 2 usage |
| `test-obligation-tags [--root <dir>] [--sweep] [--json]` | The **test-obligation tag gate** (issue #596, in the CLI since unit 553): every root suite declares the surface it protects and the obligation kinds its assertions cover, at its head; a suite that declares nothing, declares a half shape, names an unknown kind or protects a path the tree no longer has is refused. `--sweep` clusters the tags by surface and ranks them by measured cost per obligation. Read-only · exit 0 PASS · 1 a refusal · 2 usage |
| `retention-debt [--root <dir>] [--json]` | The **document-retention debt sensor** (issue #651, in the CLI since unit 553): it reads the settlement predicate and reports every proved-merged unit still carrying the full carrier past its threshold, plus the rows it puts out of scope, instead of dropping them. The producer `product-audit`'s retention dimension consumes. Read-only · exit 0 a receipt · 1 a refusal · 2 usage |
| `setup-env [--check] [--root <dir>]` | The **authoring toolchain provisoner** (issue #424's setup contract, in the CLI since unit 553): it checks the tools the workflow's gate needs (bun, node, rg, git…) and, with an explicit yes, installs them through user-scoped managers — never `sudo`. `--check` is the read-only answer a session calls once to learn which tools are present and which are the documented fallbacks. In this repository the same module is still reachable as `scripts/setup-env.mjs`, which is the bootstrap form a machine without bun runs (it is the one command that cannot require the CLI to exist) |
| `fullauto-merge --pr <number> --run-id <id> [--method merge\|squash\|rebase] [--remote <name>] [--forge <name>]` | The **automated merge wrapper** (forge-agnostic since issue #546, in the CLI since unit 554), the one path that merges without a human and therefore the one that needs every precondition: a clean synchronized tree, a PR/MR based on the forge's default branch whose head is the audited SHA, a green check rollup (or `AGENTIC_WORKFLOW_LOCAL_GATE_SHA` matching that SHA), a `<!-- audit-pr:merge-ready sha=… -->` comment, and `merge: fullauto` in the head's own `docs/features/SHIP_DECISIONS.md` read with `git show`. It pins the head at merge time where the CLI can express it (`gh --match-head-commit`, `glab --sha`) and re-reads it where it cannot (gitea). Writes one transient marker under the git common directory, removed on every exit, and posts an idempotent audit comment. Never creates a persistent permission, needs no `jq` · exit 0 merged or already merged · 1 refused · 2 usage |
| `git-identity-check [--root <dir>]` | **Layer 2's commit half of the identity guard** (issue #514 S3, in the CLI since unit 554): it refuses a commit whose resolved author or committer is not the project's approved identity in `.pi/agentic-workflow.{json,jsonc,json5}` → `gitIdentity` (project over the global file of the same stem), and — while `commit.gpgsign` is true — whose signing key is absent, of the wrong format, or not the approved one. The profile's declared scope decides: the `commit*` values run this check, the `push*` values leave the commit alone. It reads and prints; it never repairs, rewrites or retries, and it suggests the correct `--unset` form rather than the inverted one that once set the literal value `--unset`. Inert without a declared profile · exit 0 may commit · 1 refused · 2 usage |
| `turn-contract [--finished] [--remote <name>] [--forge <name>]` | The **turn contract's mechanical verifier** (feature 52, in the CLI since unit 554): box1 an agent inside a git repository off its default branch, box2 the unit document at HEAD for a unit-shaped branch (plus `scripts/phase-lint.mjs` when the unit carries a `TASKS.md`), box3 at least one own commit, box4 (`--finished`) a pushed branch with an open pull request whose head is local HEAD, box5 a clean tree not ahead of its upstream. The forge is a fact about the checked remote, so box4 asks `--forge`/`--remote` (default `origin`) instead of naming `gh`; an invalid `--forge` is a usage error, never a verdict. Prints `TURN-CONTRACT ok` or `TURN-CONTRACT fail box<N>: <code>` · exit 0 pass · 1 fail · 2 usage. Read-only: its reads are lock-free, so not even `.git/index` is rewritten |
| `guard-command [--command <text>] [--path <text>] [--allowlist <file>] [--payload] [--format plain\|copilot\|json]` | The **safety hooks' one decision** (unit 554), moved out of the template shell scripts so a target project installs shims instead of rules: the per-project literal allowlist, the merge families of every forge the workflow can drive, environment-variable disclosure and `.env` reads. `--payload` reads a platform hook payload from stdin; `--format` names the platform seam — `plain` (silent pass, refusals on stderr, exit 2), `copilot` (its `{continue, stopReason}` document, exit 0) or `json` (the normalized `[command, path]` an adapter formats itself). Read-only: it decides and writes nothing · exit 0 pass · 2 blocked, unusable payload or usage |
| `telemetry merge-install [--repo <dir>]` | The **telemetry merge driver's installation gate** (issue #630): appends the two `.gitattributes` registry lines the `telemetry` class needs (`docs/workflow/TIER_COST.md` and `.pi/.telemetry/sessions.jsonl`, both `merge=agentic-shared-telemetry`) — additively, so a line already claiming the path is left alone — and arms `merge.agentic-shared-telemetry.driver` in the checkout's git config, naming the project's `scripts/shared-doc-merge.mjs` when it replicated the workflow, else this package's `bin/shared-merge.mjs`. Idempotent: a second run answers `unchanged`. Prints the `telemetry-merge-install@1` receipt on stdout; exit 0 answered · 2 refused (`MERGE-INSTALL REFUSAL —`, nothing written: not a checkout, or no runnable driver entry). `telemetry reconstruct write` arms the same key as part of its reconciliation (config only, never the tracked declaration) and reports it as `merge_driver` |
| `doctor [--check <id>] [--json] [--root <dir>]` | The **tool doctor** (issue #537): one read-only check per documented tool surface, printing the fixed `doctor@1` envelope — the host, one row per surface with its real evidence (resolved path, version, version pair, health probe, config state), the derived move, and the summary/verdict. Exit 0 when no required surface is broken · 1 when one is. A missing optional tool is an advisory that never fails the run. `--root` re-points the project it observes, and `--check <id>` prints one documented row instead of the full inventory (an id the inventory does not document is a refusal, never an empty envelope — issue #705). It writes nothing, and it never runs a package manager: an install is text an operator pastes. The documented inventory it validates is `tool-inventory@1` below, and a documented row without a probe (or a probe without a documented row) is a `DOCTOR REFUSAL`, exit 2 |
| `setup [--yes <ids>] [--dry-run] [--json] [--root <dir>]` | The **consent-gated setup wizard** (issue #537) over the same envelope. Each row maps to one move: `report-only` (healthy), `ask-consent-write` (the project's own installer repairs it), `instruct-only` (the exact operator command is printed) and `residual` (another owner decides). Nothing is written without an explicit yes — a non-interactive run without `--yes` prints the plan, writes nothing and says so; each applied action is recorded once in `.agentic-workflow/provision-log.jsonl`, then the same checker re-reads the envelope so a repaired row leaves the plan. The second run is a no-op. Exit 0 clean · 1 an applied action failed · 2 usage |

Two sibling binaries ship in the same package and are invoked by the skills:

| Binary | What it does |
|---|---|
| `bin/path-guard.mjs` | Tier 1 path-protection gate (feature 60): `path-guard --unit <unit-dir> --phase <P<n>> [--base <ref>]`, read-only and offline, printing `PATH-GUARD <pass\|fail> — <code>` · exit 0 pass, 1 fail, 2 usage |
| `bin/turn-contract.mjs` | Verifies the canonical turn contract's mechanical boxes: prints `TURN-CONTRACT ok` or `TURN-CONTRACT fail box<N>: <code>`; `--finished` also requires the pushed branch with its open pull request |
| `bin/shared-merge.mjs` | The shared-document merge driver's crate entry (issue #630): the same argv form as `scripts/shared-doc-merge.mjs` (`<class> %O %A %B %L %P`, or `--install`). `.gitattributes`-armed checkouts use it when the project ships no `scripts/` tree |

## `substrate` — the substrate coverage gate (issue #644)

The no-assumption rule tells a lane to halt when a fact has no evidence. It could
not tell *why* there was none: a question the owning document has not answered
yet belongs to `design`, while a question the workspace has **no document
scaffolded to own** belongs to `/init-workspace`. One census answers that for
both consumers — the dispatcher verifies a `init-workspace:<class>` route against
it, and this command is the gate `init-workspace` runs on both of its routes.

Each class is read from the surface the engineering interview already declares as
its home, never guessed: the architecture document, the guide's documentation
map, and the charter's `Decision records` and `API posture` slots (through the
crate's own slot reader, so "a documented shape is not an answer" has one
implementation). A class the project consciously leaves unhomed carries a dated
row in the guide's `substrate-declines@1` block and reports `declined` — written
only after an explicit yes, never by silence.

```text
substrate-coverage@1
# produced-by: `agentic-workflow substrate check --workspace <dir> [--guide AGENTS.md] [--json]
# classes:     schema-export:SUBSTRATE_CLASSES
# exit:        0 nothing absent | 1 one or more absent | 2 refusal or usage error
header:      substrate-coverage@1
fields:      Workspace: <absolute path>
             - <class> · <present | declined | absent> · <the surface it read, or the decline row id>
             Summary: <n> classes · <n> present · <n> declined · <n> absent
             Verdict: complete | gap
fail-block:  SUBSTRATE REFUSAL — substrate-coverage@1
             Workspace: <absolute path>
             Reason: <unknown-class | malformed-declines | duplicate-class>
             Where: <path:line>
state:       present | declined | absent
```

## `doctor` — the tool doctor and the documented inventory (issue #537)

The third-party tools the workflow depends on used to be discovered by prose:
`init-workspace` narrated a per-tool detection step, `scripts/setup-env.mjs`
hardcoded each provisioning route, and several setup-state surfaces degraded
silently months later (an un-armed shared-merge driver, a missing `pre-push`
hook, a memory server still serving from a binary that had been replaced).
`doctor` is the deterministic half: one read-only check per documented surface,
its real evidence, and a derived move.

The delimitation rule decides what a generic checker may claim: **generic** is
anything observable without a live agent session (files, binaries, HTTP
endpoints, `git config`, hooks); **pi-specific** is session semantics (memory
store ownership, caller binding) and maintainer-curated pairing knowledge, which
the row reports with a pointer and never decides; **instruct-only** is what
belongs to the operator's shell or the host's package manager, which the doctor
prints and never runs. `not-applicable` is the fourth answer — a project that
does not declare a surface has no defect there.

### The envelope

```text
doctor-envelope@1
contract   "doctor@1"
host       platform · arch · node · root
inventory  source (packages/agentic-workflow/README.md) · rows (the documented
           population) · check (the id `--check` narrowed to, or null)
row        id · requirement (required|optional) · route (INSTALL_ROUTES) ·
           status (DOCTOR_CHECK_STATUSES) · move (WIZARD_MOVES) ·
           evidence{} · advisory|null · instruction|null · action|null
summary    ok · missing · mismatch · unarmed · unreachable · n/a · advisories
verdict    pass | attention
exitCode   0 no required surface broken · 1 otherwise
```

The human block is fixed: `DOCTOR — tool doctor (doctor@1) · <n> surfaces`, one
`<LABEL>  <id>  <detail>` line per row (`ok`, `MISS`, `MISMATCH`, `UNARMED`,
`UNREACHABLE`, `N/A`), then the `SUMMARY —` tally and the `VERDICT:` line. The
move is derived, never declared a second time: `ok`/`not-applicable` is
`report-only`, a row carrying an `action` is `ask-consent-write`, a row carrying
an `instruction` is `instruct-only`, and a row with neither is `residual`.

### The `relay` row — capability, never a dispatch

The lane composes Relay legs when PI WEB is present, and before issue #705 the
operator learned a leg could not dispatch only at the hand-off. The row answers
it up front, and the delimitation rule splits the answer: the session marker
(`PI_WEB_SESSION`), the session-daemon endpoint PI WEB itself resolves and the
`@jmfederico/pi-relay` package as Pi's settings declare it are **generic**
readings a plain process can take; the `pi-web:session-dispatch:v1` bridge is a
**session** event, so the evidence names the protocol and its owner
(`observable: false`) instead of claiming a probe, and nothing here dispatches,
connects or spawns. `agentic-workflow doctor --check relay` prints that one row:
with no PI WEB session it is `not-applicable` and states the per-phase hand-off
the lane keeps; a marker with no answering daemon is `unreachable`; an
unregistered package is `missing` with the shipped path and the documented local
install, and an install that is the wrong half is refused in words —
`@jmfederico/pi-relay` is `private: true` and only dispatches through PI WEB's
bridge, so npm is never the route.

### The documented inventory

This block is the **single declaration** of the tools: the code owns only the
probes, keyed by the same ids. `doctor` reads it and refuses when the document
and the probes disagree in either direction — a documented tool nobody checks is
the defect this block exists to prevent. Requirement, detection and install route are
documented facts; the move is behaviour and stays in code.

```text
tool-inventory@1
id | what | why | requirement | detected-by | alternative | install-route
node | the JavaScript runtime the CLI runs on | everything here is JavaScript; the crate declares an engine floor | required | `node --version` against `engines.node` (`>=24`) | none — the CLI is JavaScript | instruct-only
bun | the preferred package manager and script runner | faster installs and test runs; the root suite runs under either runtime | optional | `bun --version` against the committed `.bun-version` pin | node, the guaranteed fallback | binary
rg | ripgrep, the first search tool | the workflow searches with rg before grep and must never assume it is installed | optional | `rg --version` on PATH | `grep`, the documented fallback | binary
git | the version-control CLI | every unit commits, and a commit needs an author identity | required | `git --version`, then `git config --get user.name` and `user.email` | none | instruct-only
gh | the forge CLI | issues, pull requests and labels are read and written through it | optional | `gh --version`, then `gh auth status` | the forge's web interface, by hand | instruct-only
serena | the language-server manager | symbol-level reads and diagnostics for the executor | optional | `serena --version`, the `language_servers` list in `.serena/project.yml`, `.serena/project.local.yml` | the editor's own LSP, read by hand | pip-uv
engram-binary | the core memory binary | the memory substrate's server is this binary | optional | `ENGRAM_BIN` first, then `engram --version` on PATH | no memory substrate; `memory probe` reports the degradation | brew
engram-server | the running memory server | a server started from an older binary keeps serving after an upgrade — the 2026-11-13 incident | optional | `GET $ENGRAM_URL/health` (default `http://127.0.0.1:7437`) version compared with the binary's | point `ENGRAM_URL` at a server you manage | instruct-only
gentle-engram | the Pi companion package | the memory tools reach Engram through it, over the server, with no MCP registration | optional | the `packages` pin in Pi's `settings.json` plus the installed package version, against the curated pair | none — it is the MCP-free path | npm
pi | the agent host | the workflow's skills and commands run inside it | optional | `pi --version` and the agent directory | another supported adapter | instruct-only
relay | the Relay dispatch capability — PI WEB's session marker, its session daemon and the `@jmfederico/pi-relay` package with its two skills | the lane composes Relay legs when PI WEB is present, and without this row the operator learns a leg cannot dispatch only at the hand-off | optional | `PI_WEB_SESSION`, the daemon endpoint PI WEB resolves (`PI_WEB_SESSIOND_SOCKET`, else `<PI_WEB_DATA_DIR>/sessiond.sock`), and the `@jmfederico/pi-relay` declaration in Pi's `packages` with its `pi.skills` carrying `relay` and `relay-runner` | the per-phase hand-off `→ Next: /execute-phase <NN-slug> P<k>` (owner: `skills/unit-lane/references/RELAY.md` §Degradation) | instruct-only
dogfooding-vehicle | the authoring checkout's own vehicle — the working tree this session runs instead of the installed release | a merged-but-unreleased unit is invisible to an installed release, and that confusion has produced false bug reports | optional | the `AGENTIC_WORKFLOW_RUNNER` override, the installed pi package version and the newest canary tag (`git tag --list "*canary*"`) | the installed release, at the cost of dogfooding the checkout | instruct-only
agent-adapters | the detected agent adapters' config | the scaffold installs per-adapter safety config; the doctor only observes it | optional | a read-only scan of each adapter's MCP or settings file | none — an undetected adapter is scaffolded by `init-workspace` | instruct-only
git-hooks | the project's git hooks | the local gate's offline subset runs before a push | optional | `git rev-parse --git-path hooks` and the files there | run the gate by hand before pushing | instruct-only
merge-drivers | the shared-document merge drivers | `.gitattributes` declares semantic merges, and an un-armed driver silently falls back to a textual merge | optional | `merge.<driver>.driver` for every driver `.gitattributes` names | text merges, resolved by hand | instruct-only
skills-cli | the skills CLI manifest | an authoring tree publishes and lists its skills through it | optional | `skills.sh.json` at the project root | authoring-only; a consuming project needs none | instruct-only
config-files | the project config files | the schema moves and a written file does not, so a new option stays invisible and a removed key lingers | optional | each existing `.pi/<file>` key set against the registered schema, using `config default`'s own plan | run `agentic-workflow config default` by hand | instruct-only
```

The routes are the published `INSTALL_ROUTES`: a package manager (`npm`, `bun`,
`pip-uv`, `brew`), the project's own `binary` download, or `instruct-only`. No
row of this table is a promise that the CLI installs anything.

## `workflow-doctor` — the ceremony-failure doctor (issue #703)

One user-initiated pass over the project's own durable record: `mine` joins the
session journal and the unit docs' `## Log` into one stable row per ceremony
event, `battery` carries the tool doctor's `doctor@1` envelope as-is beside the
runner version/pin, the installed skill set and the ceremony profile/tier,
`bundle` validates the model's triage against the skill's closed rubric and
renders one anonymized receipt, `route` matches each report class against the
guarded forge read, and `publish` is the only write (consent-gated by `--yes`).
The command decides nothing: the markers are shapes a machine already owns, the
rubric is data in `skills/agentic-workflow-doctor/references/RUBRIC.md`, and a
class outside it is refused by name.

Exit: 0 a receipt · 1 a required input or the forge is unavailable · 2 a usage
or contract refusal (`WORKFLOW-DOCTOR REFUSAL — <token>: <sentence>` on stderr,
no receipt on stdout). Read-only except `publish`; no clock, no network (the
route reaches the forge only through `forge-read`'s guarded transport).

```text
workflow-doctor-mine@1
field | shape | what it holds
contract | workflow-doctor-mine@1 | the receipt's id
carrier | journal · fragments · units | every carrier read, with its path and whether it is present
row | W<n> · kind · unit · token · handle · anchor · detail | one ceremony event: the stable id, the closed marker kind, the unit slug, the `## Log` token (null for a journal or aggregate row), the redaction handle the bundle prints, the repository-relative anchor, and a one-line detail
group | kind · count · rows | one group per marker kind, in the published order; the counts add up to the receipt's row count
budget | folds · cycles | the correction-budget thresholds the two aggregate kinds apply
totals | rows · units | the receipt's own counts
verdict | clean · rows <n> | `clean` is a real answer over a carrier that exists, never an absent one; no carrier at all is the `insufficient-input` refusal (exit 1)
```

```text
workflow-doctor-battery@1
field | shape | what it holds
contract | workflow-doctor-battery@1 | the receipt's id
runner | version · pin · pinMatch | the crate's own version beside the launcher pin read inside the located skills tree — `match`/`mismatch`/`unknown`, never assumed
skills | source · path · count · invocable · names | the installed skill set, located declared-over-discovered: `declared` (`--skills-root`), `host` (`AGENTIC_WORKFLOW_SKILLS_ROOT`, the pi package publishes its mounted tree there at session start), then the documented install dirs `.agents/skills` and `.claude/skills`, and the authoring/source `skills/` tree last — no project-root layout is assumed (#716/#717's defect class); `path` is project-relative when the tree is inside the project, absolute when the host mounts it elsewhere, and `source: null` means no tree was found
skills-absent | degradation | no candidate tree exists; the detail names the declare routes (`--skills-root <dir>`, the env key) and every probed location — the honest absence, never a fabricated zero
ceremony | guide · adoption · reviewPasses · unit · tier | the guide's `ceremony-profile@1` block through its reader and the named unit's recorded tier through `recordedTier`
receipts | state · reason | `n/a` until the typed receipt carriers land (#698): naming the absence is the honest cell
```

```text
workflow-doctor-bundle@1
field | shape | what it holds
contract | workflow-doctor-bundle@1 | the receipt's id
header | runner version/pin/match · skills count/invocable · doctor verdict/summary · ceremony profile/tier | the allowlisted battery cells (issue #698's bundle field list); each reads `n/a — no battery receipt attached` when none is given
class | class · verdict · reason · defect · occurrences · evidence | a report class: the slug, `report`, the closed reason, the one-sentence defect shape, the corpus count and its `unit:<slug> <handle>` anchors
discarded | class · reason · occurrences | a discard: counted, never filed, and citing no row — the asymmetry the rubric declares
unclassified | <n> | the rows no report class claims, counted instead of guessed
redactions | <n> | the e-mail and path replacements the profile applied to the model-authored fields
```

```text
workflow-doctor-route@1
field | shape | what it holds
contract | workflow-doctor-route@1 | the receipt's id
candidate | <n> | every candidate read, sorted; a candidate the forge reports as absent is a named degradation, never a silent skip
class | class · action · issue · score · matched | one line per report class: `existing-issue` with the issue number and the tokens that matched, or `new-issue`
degradation | issue · code · detail | a candidate the forge could not answer for, named with its refusal class
consent | the consent line | filing needs an explicit yes; the line names the `publish` invocation that performs it
```

## `setup` — the consent-gated wizard (issue #537)

`setup` is the mutating half, and it is deliberately small: it asks only where a
write or a real decision exists. Every row keeps its move, and the four moves
are exhaustive — there is no fifth path a repair can take.

- **`ask-consent-write`** — the repair is the *project's own* installer, never a
  second implementation of it: `scripts/shared-doc-merge.mjs --install` for the
  shared-document drivers, `scripts/docs-generated-merge.mjs --install` for the
  projection, `scripts/local-gate.mjs --install-hook` for the pre-push hook. The
  wizard runs it only after an explicit yes (`--yes <id>` or the terminal
  question), records the consent once in `.agentic-workflow/provision-log.jsonl`,
  and then re-reads the envelope with the same checker — a repaired row leaves
  the plan, so a second run is a no-op.
- **`instruct-only`** — the exact command, printed. A package manager is never
  run for the operator.
- **`residual`** — the doctor names it and stops: a curated companion↔core pair
  is a maintainer decision, and a session-level fact (memory store ownership)
  belongs to the pi extension.
- **`report-only`** — nothing to do; the row is printed for the record.

## CLI feedback — the three tiers (issue #424)

One channel reports progress for every subcommand: `src/feedback/index.mjs`. The
tiers are cumulative, the flags are consumed by the bin before any command's own
grammar runs, and every line goes to **stderr** — stdout and the envelope stay the
machine receipt, so a consumer that parses stdout is unaffected by any flag. The
rule and its authoring contract are owned by
[`docs/workflow/FEEDBACK.md`](../../docs/workflow/FEEDBACK.md); this section owns
only the crate surface.

```text
feedback-tiers@1
tier | flag | what it prints
regular | none | `feedback: start` once the run passes the threshold (or at its first long-running stage), `feedback: stage`, `feedback: progress <done>/<total> (<pct>%)` with a remaining estimate, `feedback: done … · <duration>`
debug | --debug | one `feedback: progress` line per unit of work (unthrottled, carrying the unit's own detail), each stage's own cost, and the command's provider/detail lines
profile | --profile | the debug lines plus `FEEDBACK PROFILE — <subject> · total <duration>`, one row per stage with its milliseconds and share, and the named bottleneck (a single `run` row when the command declares no stages)
```

`--profile` outranks `--debug`. `--quiet` mutes the regular tier, which is what
`doc --sync --quiet` owes its hook consumers; an explicitly requested diagnostic
tier still speaks. The module exports `FEEDBACK_TIERS` (the published vocabulary
the guide's normative row binds), `createFeedback`, `parseFeedbackArgs`,
`formatDuration` and the `NO_FEEDBACK` no-op — an embedded caller and a suite pass
no channel and see no change.

The universal attachment costs a subcommand nothing: the bin registers one
threshold timer and one exit hook, so a command that adds no stage still reports
"started" (once it is still working at the threshold) and "took this long".
A command that spends real time in stages wraps them in
`feedback.stage(name, fn)` and reports per-unit progress through
`onProgress`-style callbacks the engine exposes (`syncIndex` is the first).

## `doc` — the retrieval index (feature 65, hardened by issue #443)

One gitignored SQLite store under `.agentic-workflow/index/` (committed decisions:
`.agentic-workflow/index.json`), a git-tracked corpus of `*.md` files, FTS5 for
keyword search and float32 vectors for the semantic half. The shape a consumer
targets is this block; the code that owns it is `src/doc/`.

```text
doc-retrieval@1
command | shape | what it orders
sync | doc --sync [--quiet] [--json-only] | incremental chunking of the tracked corpus, then one embeddings pass over the chunks that have no vector
query | doc --query <term> [--since <ISO>] [--until <ISO>] [--file <path>] [--mode keyword|hybrid] [--json-only] | freshness-synced read; an absent --mode is resolved at query time, an explicit one always wins
mode-resolution | absent --mode ⇒ hybrid when a provider is configured AND the store holds chunks embedded under the pinned model; otherwise keyword with the declared cause | a partially embedded store runs hybrid (keyword carries the remainder); no new degradation value exists
query-calls | exactly one provider call per hybrid query (the query embedding) | the read path never embeds: the inline freshness sync chunks, it never calls the provider
pacing | index.json provider.pacing {batchSize, requestsPerMinute, maxAttempts, baseDelayMs, maxDelayMs, fetchTimeoutMs} · AGENTIC_WORKFLOW_DOC_EMBEDDINGS_<PARAM> · defaults 32 · 60 · 3 · 1000 · 60000 · 30000 | one request carries at most batchSize texts; request starts are paced; a non-positive or unparseable value is refused at config load by name (issue #541 — before it, only the resolution refused it)
timeout | provider.pacing.fetchTimeoutMs · AGENTIC_WORKFLOW_DOC_EMBEDDINGS_FETCH_TIMEOUT_MS · default 30000 ms | every provider call carries `AbortSignal.timeout(fetchTimeoutMs)` (issue #718 S3): a socket that accepts a request and never answers aborts instead of holding the pass open forever. The abort is a status-less error, so the retry ladder owns it like any network fault — a query's single provider call is bounded by the same knob
lease | the store's `doc_lease` row (one owner token + heartbeat) · TTL = fetchTimeoutMs × maxAttempts + 60 s | one embed pass owns the store's pending set (issue #718 S5): the row is taken atomically **before** the pending rows are read, heartbeated per request and released when the pass ends, so concurrent `doc --sync` runs are idempotent on the rows *and* on the provider bill. A pass that finds a live lease embeds nothing and declares `unavailable-embeddings-lease-held`; a lease whose heartbeat exceeds the TTL was left by a dead pass and is taken over
provider-block | index.json provider {baseUrl, model, envVar, chunk_limit, max_request_chars, pacing} · `null`/absent = keyword-only | the whole block is the crate's schema (issue #541): `baseUrl`/`model`/`envVar` are non-empty strings when present, `chunk_limit` and `max_request_chars` are positive integers with `chunk_limit` at or below the budget, and every present pacing knob is a positive integer — each refusal names the key and the value it read. `validateIndexConfigObject(root, body)` in `src/doc/config.mjs` is that same judgment applied to a **candidate** body, so a writer outside the crate (a companion package materializing a provider preset's embed profile) validates against one implementation instead of keeping a second copy: `loadConfig` delegates to it, containment (F36/F37) included
retry | 429 · 5xx · 408 · network errors are retryable with bounded exponential backoff, honouring Retry-After; any other 4xx is a rejection | the run survives a rate limit instead of aborting the pass
rejection | a non-rate-limit 4xx ends that batch's future, never the pass: the rejected chunks stay pending, the rest embed, the envelope declares `embeddings-request-rejected` and its additive `store.rejected` carries the provider's status and body excerpt (`{count, failures[{status, message}], chunks, omitted}`), and the human `doc` path prints `doc: rejection:` / `doc: skipped:` lines on stderr | the backfill cannot be poisoned by one request the provider refuses (fix #540); a retryable failure whose ladder is exhausted still declares `unavailable-embeddings-provider-down`, because that provider really is down
resume | the store's own `embedding is null` predicate | a run killed part-way re-runs only the remainder; nothing already embedded is re-sent
pin | meta.emb_model written by the first landed batch (and by a zero-pending pass) | a partial pass can never leave an unpinned, mixed store
sync-report | store.{path, present, files, chunks, pending, model, lastSync{files_scanned, files_changed, files_deleted, embedded}} | `pending` and `model` are additive inside the open `store` record — the top-level key order and the degradation vocabulary are frozen. A `--sync` that had pending chunks and no provider key declares `unavailable-embeddings-not-configured` (issue #718 S6); a warm one stays silent
status | doc --status [--json-only] | the store's record only — path, presence, files, chunks and the pending count (issue #718 S4) — never syncing. `pending` is the crate's one stat (`embeddingStats`), which is what the pi package's `/aw-index` derives its spawn cap from instead of a second SQLite reader
degradations | unavailable-embeddings-not-configured · unavailable-embeddings-not-indexed · unavailable-embeddings-provider-down · embeddings-request-rejected · embeddings-model-mismatch · chunk-too-large (+ the open `unavailable-embeddings-<cause>` family) | a closed vocabulary, published by the schema package (`DOC_DEGRADATIONS`, `packages/agentic-workflow-schema/src/doc-envelope.ts`) and pinned to `envelope.mjs` by `test/doc.degradations.test.mjs`; an unknown value is refused at construction. `unavailable-` means the layer is missing or unreachable — `embeddings-request-rejected` says the provider answered and refused the *request*. The `unavailable-embeddings-<cause>` family is documented as open by design, so a cause joins it without a published value: `unavailable-embeddings-lease-held` (another pass owns the store right now, issue #718 S5) is a member of that family, never a `DOC_DEGRADATIONS` entry
chunk-limit | index.json provider.chunk_limit (positive integer) · default: the request budget when a provider is configured, `0 = unlimited` on the keyword-only path | chunk bodies exceeding the limit are automatically truncated (never skipped) to fit — the chunk stays searchable under its heading and line range; a sync that shortened at least one chunk declares `chunk-too-large`. The limit is part of the chunking contract: it is recorded in the store and a changed value re-chunks every stored file on the next `--sync` (no `--rebuild` needed), so raising or lowering it retro-applies
request-budget | index.json provider.max_request_chars (positive integer) · AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_REQUEST_CHARS · default 90000 (≈22.5K tokens at 4 chars/token) | the most text one embed request may carry: the pass flushes before the budget is crossed, and a chunk larger than it is sent as a single-text request (so it is the only chunk a refusal costs). A `provider.chunk_limit` above the budget is refused at config load — a chunk that large could never be sent in one request
rebuild | doc --rebuild [--json-only] | discards the store and resyncs from scratch **and embeds the pending chunks in the same pass**; its envelope reports `pending`, `model` and `embedded`, and declares `unavailable-embeddings-not-configured` when no provider is configured | a rebuild never leaves a keyword-only store unstated (fix #540), so it is the one step an operator needs after a model or limit change
store-share | index.json store.share {enabled: bool, base_dir?: string} · default disabled (local `.agentic-workflow/index/`) | when enabled the store lives in a user-level `<base>/agentic-workflow/<repoId>/` directory (one dedicated store file) where `<repoId>` is the repo's commit-object SHA (`git rev-parse HEAD^{commit}`) and `<base>` is `base_dir` or the XDG data dir — worktrees of the same repo share one index; the F36/F37 containment check is skipped in this mode only
excludes | index.json index.excludes (array of path prefixes, or null) · defaults `.agentic-workflow/` + `node_modules/` | tracked files under any exclusion prefix leave the corpus (the journal fragments and vendored trees are never indexed); an explicit array replaces the defaults entirely, `null` restores them
```

**A query never pays write cost.** Vectors catch up on the next explicit sync —
a freshness hook, `/aw-index`, or `doc --sync` — and until then the hybrid pass
ranks over the chunks that do have vectors while keyword answers the rest.

## `doc archive` / `doc restore` — the retention write path (issue #651)

The `doc` verb also carries the one write path of document retention: a merged
unit's process artifacts move into a gitignored archive, its carrier settles to
`unit-doc@3`, and `restore` puts the artifacts back. The vocabulary, the
procedure and the four versioned blocks live in
[`docs/workflow/RETENTION.md`](../../docs/workflow/RETENTION.md); this section is
the CLI's half.

```
agentic-workflow doc archive [--dry-run] [--unit <id>] [--all-eligible] [--json]
agentic-workflow doc restore --unit <id> [--json]
```

- **A target is required.** A bare `archive` is a usage error (exit 1): the
  irreversible half is never the default, and it never sweeps the tree because
  nobody named it. `--dry-run` alone prints the whole report, including the
  `unstamped`/`older-format` documents that are out of scope forever.
- **The config gates the trim step only.** `docRetention.mode: "keep-all"` (the
  shipped default) refuses the write with `mode-keep-all` and still reports the
  plan; it never invalidates a document.
- **A refusal exits 2** with `DOC REFUSAL — <published reason>` and moves no
  byte. The reasons are the schema package's `RETENTION_STATES` plus
  `unknown-unit`, `unclassified-file`, `mode-keep-all`, `archive-not-ignored`,
  `archive-exists` and `archive-missing`.
- **The archive binds bytes.** `<archiveDir>/<unit>/manifest.json` carries
  `doc-retention-archive@1` with one `sha256:<64 hex>` per archived file;
  `restore` re-hashes every file before the first write and refuses
  `content-hash-mismatch`, `target-conflict` or `archive-incomplete`. The
  directory must be gitignored (`archive-not-ignored`), and local pruning is
  off unless `archiveRetentionDays` names a window.
- **The seam hook** (`docRetention.seamHook`) runs after the local archive is
  durable; a non-zero exit is a reported degradation, never a lost record.
- `--json` prints the receipt (`doc-retention-archive-receipt@1`); without it the
  run prints one line per unit (`unit · state · trim …`, `archived · …`,
  `refused · … · <reason>`) and the plan's summary.

## `journal` — the session-log fragment carrier (issue #405)

One file per journal entry under `.agentic-workflow/journal/`, written by the
session instead of a direct `docs/LOGS.md` append; one forge-free aggregator
that runs in CI on merge to `main` (a local run is refused, issue #706),
appends the fragments newest-first, deletes them and bot-commits (the commit
belongs to the wiring, not to this CLI). The
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
entry-slot | (session-slug, kind) | the grammar's unit: one entry per conversation per kind (issue #468 S3). The timestamp and the branch do not distinguish an entry slot, and "local" is not a conversation — every unflagged write on one machine shares it, so it never collides. A slot is one entry plus the corrections that declare it (the `errata` row): the carrier lint refuses any other multi-fragment slot, naming every file; the aggregator consumes it newest-first
fragment-content | one entry block | mechanical: exactly log render's bytes; narrative: one "## "-headed entry; always newline-terminated, never CR; a correcting narrative entry carries exactly one `Supersedes` cell (the `errata` row)
errata | - **Supersedes:** <fragment-name> | a stale entry is corrected, never rewritten (issue #676): the correction is a NEW fragment whose block names the fragment it corrects. A slot read newest-first must chain — every fragment but the oldest names the one immediately older than it, and the oldest (the entry being corrected) names nothing. The writer's `--supersedes` is the only producer; the lint refuses a slot that is not that chain, a correction that skips its immediate predecessor, and a fragment naming two predecessors
aggregate | journal aggregate [--dir <root>] [--journal-dir <p>] [--log <p>] | appends the pending fragments to the journal at its end, newest-first (ties: branch, kind, session, ascending), deletes the consumed fragments, consumes already-present bytes without appending, and keeps only the newest fragment of an entry slot — the older ones are consumed without appending and named in the receipt's `superseded` row with the fragment that superseded them, so a duplicate never appends twice and the decision never depends on byte coincidence (issue #675); refuses anything ambiguous with exit 2 "JOURNAL REFUSAL — <reason>" before the first byte moves, refuses every non-CI run with the same refusal (issue #706), and keeps `--check` local because it moves no byte; a zero-byte .gitkeep is the ONE declared placeholder — skipped, never consumed, because git cannot track an empty directory and an opted-in carrier is empty between aggregations (the opt-in must outlive a full aggregation)
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
already-registered | explicit `--session` whose conversation already holds a fragment **of that kind** (issue #468) | exit 2 refusal before any byte — one entry per conversation per kind: the auto-log writes the mechanical entry and `/log-session` the narrative one for the same session, so the two kinds coexist and the second entry of one kind is the duplicate. The shared identity `local` (no `--session`, or an explicit `--session local`) is not a conversation and never fires; a fragment this conversation and kind already hold is rewritten, never refused, and the computed name itself stays the collision refusal above. The refusal names the slot's newest fragment and routes to `--supersedes` (row below) — a stale entry is corrected, never duplicated
supersedes | --supersedes <fragment-name> | the sanctioned errata path (issue #676): correcting a stale entry instead of rewriting it. Narrative only — a mechanical fragment's bytes are log render's — with an explicit conversation `--session`; the named fragment must be that slot's newest fragment and still in the carrier, and the write-time second must be newer than it. The writer lands a NEW fragment whose block carries the `Supersedes` cell (the fragment grammar's `errata` row), the receipt names the corrected fragment, and `--content` must declare the same link the flag names
carrier-absent | exit 2 · no directory is ever created | the carrier's presence is the opt-in, so a write into a project without it is refused instead of opting the project in
refusal | exit 2 "JOURNAL REFUSAL — <reason>" | an unknown flag, a foreign kind, a bad body, a collision, an already-registered conversation (per kind), an errata target outside the entry slot or a correction link the flag did not declare — before any byte lands
carrier-check | journal aggregate --check | validate-only: every non-conforming name/body in the carrier listed, plus every entry slot (`(session-slug, kind)`, the fragment grammar's own unit) that is not one entry plus its declared corrections — every file named — with no byte moved, exit 0 conforming / 2 otherwise
```

The read side and the write side share one predicate
(`fragmentFault` in `src/journal/fragment.mjs`), so the carrier lint, the close
and the writer cannot disagree about what a conforming fragment is. The
narrative block itself — heading, `Commits`, `Files`, `Summary`, `Decisions`,
`Next` — has one owner, `src/journal/block.mjs`, which
`scripts/session-close.mjs` also runs.

### The headless run — a declaration in, the same fragment out (issue #471)

A CI-driven session has no operator, so `log-session` never runs. The headless
writer takes the run's declaration and the identifiers it carries, and composes
the fragment with the same owners the interactive writer uses — no second name,
no second renderer, no model:

```text
journal-headless-grammar@1
kind | shape | what it orders
declaration | journal headless --workflow <w> --run-id <id> --actor <a> (--summary <t> | --block <path|->) [--issue <n>] [--decisions <t>] [--next <t>] [--files <a,b>] [--base <ref>] | one CI run's declaration: what the run did and how it identifies itself — never a filename, a session slug or a rendered heading
provenance | session slug gha-<run-id> · label "headless <workflow> run <run-id> by <actor> [for #<issue>]" | the run's context rides the fragment grammar's own fields: the run id is the session (so a re-run is the same identity) and the label is the block's own free-text cell — no new field, kind or metadata line
run-id | 1-60 characters of [A-Za-z0-9._-] | the id has to survive the fragment name's alphabet unchanged, so an id the name could not carry is refused instead of approximated
one-entry-per-run | already-present · exit 0 · no write | the second invocation for one run id reports the existing fragment — or, once the aggregator consumed it, the journal entry the run already has — a re-run never duplicates the entry and never fails the job
declaration-cells | summary · decisions · next · files | rendered by renderEntryBlock into the narrative block's own cells; a cell's line breaks collapse to one space so a declaration can never become a second block line; --files replaces the git-derived cell when the run's range is unavailable
block | --block <path|-> | a caller that already rendered its block supplies it instead; the shared predicate validates it and the writer refuses a name/heading contradiction
carrier-absent | exit 2 · nothing created | the carrier's presence is the opt-in (the row above), so a headless run never opts a project in
refusal | exit 2 "JOURNAL REFUSAL — <reason>" | an unknown flag, an incomplete provenance, an invalid run id or issue, a prose+block pair, a collision — before any byte lands
producer | journal/action.yml → journal/headless.mjs → this operation | the distributable action is an adapter over these flags: it maps the run's environment, passes the receipt through as its outputs and composes nothing itself
```

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

## Shared documents — the writer driver (issue #498)

One write path for the documents several concurrent sessions and PRs write and
overwrite (`docs/ROADMAP.md`, the budgets manifest, `REPOSITORY_STATE.md`): a
**key-based splice** — the caller declares the byte ranges it changes and every
other byte is carried through untouched, so a foreign-byte rewrite or a dropped
line is unrepresentable — with optional **CAS**: a write carrying the revision
it read refuses with a named `stale-read` rejection instead of last-write-wins
(the unit-32 F19 failure class). The roadmap writers (`rowUpsert`, `annotate`,
`fixRowUpsert`) are built on it; `runWriterConformance(writer, { root })` is the
shared suite every writer-driver instance passes before it ships, and that a
driver rewriting foreign bytes, dropping lines, or accepting a stale read fails.

```text
writer-driver-contract@1
kind | shape | what it orders
read | read(path) -> { ok, op, path, revision, bytes } | the read half of the CAS loop; revision is the full SHA-256 the caller passes back as expected
write | write({ path, expected?, apply }) -> receipt | the write half; apply(content) returns { ok, edits: [{ start, end, replacement }] } declaring its ranges — never the whole content — or its own { ok: false, reason, detail }
refusal | { ok: false, reason, ... } | a value, never a throw (predictable failure); answered BEFORE the first byte moves, the document byte-identical after, no staging file left
vocabulary | WRITER_REFUSAL_REASONS | the closed refusal set: stale-read, missing-file, unreadable, invalid-document
CAS | expected !== undefined | the write refuses stale-read naming BOTH revisions (expected, actual) when the file moved since the read; without expected the write is a splice, byte-behavior unchanged from the pre-driver writers
receipt | { ok, op, path, before, after, expected?, edits, changed } | typed; before/after are full SHA-256, after is always the read-back digest
atomicity | staging file + rename | the write lands atomically in the document's own directory; a refused write leaves no staging file behind
conformance | runWriterConformance(writer, { root }) | the single shared suite: typed receipts, lossless splice (read-back equals the independently computed splice of the declared edits), stale-read refusal before mutation, missing-file refusal, applier-refusal passthrough — a violating writer fails it
guarantee | no foreign bytes · no dropped lines · no silent loss · no network, no git | pure Node; the applier never supplies whole content, the driver never touches bytes outside the declared ranges
```

**Authoring a writer** (the documented path): build over `readShared` /
`writeShared` (`src/writer/driver.mjs`), keep your applier's refusals as
values, and run your instance through `runWriterConformance` in your suite (a
violating writer must fail it — the shipped fixtures prove the harness catches
a foreign-byte rewriter, a line dropper and a stale-read acceptor). The merge
semantics the file-class git drivers run (`unionTableRows`, `unionAppendOnly`,
`structuralJsonMerge`, `src/writer/merges.mjs`) are pure functions over strings
— the git mechanics live beside them in `src/writer/shared-merge.mjs`, never a
second grammar (issue #630 moved them here from `scripts/` so the CLI can arm a
driver in a project that ships no `scripts/` tree; the root
`scripts/shared-doc-merge.mjs` and `bin/shared-merge.mjs` are its two entries).

**The shared-document classes** (issue #498, plus issue #630's `telemetry` class).
`.gitattributes` names each path once and `merge.agentic-shared-<class>.driver`
arms it; the semantics of that class are that class's contract:

| class | what it unions | what is a real conflict |
|---|---|---|
| `roadmap` | table rows by key (numeric first cell, `[#N]` link) | both sides changing the same row differently |
| `budgets` | JSON leaves by key | the same leaf set differently on both sides |
| `repo-state` | nothing — frozen facts are resolver-only | any concurrent change |
| `logs` | journal entries by heading identity | the same heading with different bodies, or a side that is not an append-only extension of the base |
| `telemetry` | ledger rows by their `source` cell, JSONL lines by canonical identity | a side that is not an append-only extension of the base |

**The telemetry class is append-only** (issue #630). `docs/workflow/TIER_COST.md`
and the JSONL sample store (`.pi/.telemetry/sessions.jsonl` by default) grow by an
atomic `O_APPEND` per row/line, so their merge computes the union and **appends
the delta to `%A`** — it never stages and renames, and it never rewrites a
committed row or line: a side that is not an append-only extension of the base,
or a union that would not extend ours, refuses closed (no marker, exit 1, the
file left as `ours`). `telemetryRowKey` keys the table side by each row's `source`
cell and `unionAppendOnly` keys the JSONL side by each line's canonical JSON, so a
row/line both branches appended lands once. The class acts on tracked paths only:
this repository gitignores `.pi/.telemetry/` (#504), so the JSONL half is live in a
project that carries its telemetry corpus in git. `agentic-workflow telemetry
merge-install` installs it retroactively on both halves.

## Third-party content — the guard layer (issue #470)

Forge text is untrusted by construction: anybody who can comment can write it, and
a model reading it cannot tell the workflow's instructions from an attacker's.
`src/content-guard.mjs` is the deterministic layer that sits in the collection
path, never in model discipline — the same stance as `path-policy.mjs`, where a
model can never allow what policy denies.

One ingestion function, `guardForgeContent({ source, id, author, association,
text, policy })`, returns either an admitted payload (`text` sanitized, `fenced`
as bounded third-party data) or an exclusion with no content at all. It sanitizes
first (HTML comments including unterminated ones, zero-width, bidi controls, tag
characters, variation selectors, control characters, and a mixed-script token that
spells an instruction), then decides on the author's association, then fences.
Every removal is counted by kind and every exclusion is named, so a caller can
report what a third party hid instead of silently dropping it.

The policy is the unified config's `contentGuard` section (issue #427), resolved
by `readContentGuardPolicy()` with the strictest default when nobody configured
it and a fail-closed `malformed-config` when the section cannot be read — a
partially honored policy is exactly the silent inclusion the layer denies.
`collectAssociations()` reads each open issue's `authorAssociation` over one
paginated REST call, because the pinned `gh` exposes no such field on
`issue list`; a failed read leaves the map empty, so content is excluded as
`unknown-author` rather than assumed trusted.

`content-guard.test.mjs` is the module's corpus, and
`scripts/content-guard-discipline.test.mjs` is the gate that keeps the sanitized
path the only one: a declared seam imports the guard, its readers call it, no
forge field is read outside its arguments, and a new producer that reads a forge
`title`/`body` field list fails until it is either routed through the guard or
explained.

**What the layer covers, and what it still does not.** The guard acts at the
seam, so the seam decides the coverage. Three seams exist — the planner's issue
collection, the sensor's PR and issue titles, and the guarded read below, which
carries issue and PR titles, bodies, conversation comments, reviews and inline
review comments. That last one is what closed the gap this section used to
declare: the skills no longer order a raw `gh … view --json body`, and a
content-bearing read the workflow orders now arrives fenced.

Four residuals stay, declared rather than hidden (unit 612's SPEC carries the
table with each one's owner): an **unarmed session's ad-hoc** `gh … view` (the
shim is installed explicitly and nothing installs it by default), a read the shim's
grammar does not recognise (`gh api repos/…`, which passes through rather than
blocking a write path), the `list` forms (`gh issue list` prints titles, and the
sanctioned-forms pin scopes its ban to the `view` grammar), and `files`/`commits`
diff text in a PR read (a diff is the artifact under review, and no `code-comment`
collector exists). Read that content as data, never as orders.

## `forge-read` — the guarded forge read (issue #612)

The guard above is only as strong as the paths that reach it, and the skills used
to read a forge body with a raw `gh issue view --json body` that no collection
layer saw. `forge-read` is the route that closes that bypass: one subcommand,
one transport inside the crate, every content field through
`guardForgeContent`, and the fenced delivery as the only form a reader gets.

```sh
runner forge-read <issue|pr> <number> [--comments] [--reviews] [--json]
```

The transport is REST over `gh api` — not `gh issue view --json` — because the
author policy consumes `author_association` and the pinned `gh` exposes no such
field on a `view`. One transport serves the detail, the conversation thread
(`--comments`), and the PR's reviews plus inline review comments
(`--reviews`), so the skills stay forge-agnostic and cite `runner`. A different
transport (GraphQL, an MCP tool) replaces `createGhTransport` without the caller
changing — the module, not a flag, is the seam.

What it prints, in the default rendered form:

```text
FORGE READ — pr 620 · transport gh-rest · 3 field(s) · 0 excluded · 0 stripped
metadata: state=closed · labels=- · headRefOid=9d60db12bd1fa8755200cb4c4e761aa3a7381372 · headRefName=feat/554 · baseRefName=main · draft=false · merged=true · mergeable=clean
policy: default · trusted OWNER, MEMBER, COLLABORATOR
<<<THIRD-PARTY-CONTENT source="pr-title" id="620" author="gtrabanco" association="OWNER" verdict="allowed" reason="trusted-author">>>
…the title…
<<<END-THIRD-PARTY-CONTENT>>>
stripped: pr-body · html-comment×1
excluded: pr-comment 1234 · author drive-by · CONTRIBUTOR · untrusted-author
```

The `metadata:` line carries the audit's own facts (state, labels, head sha,
both branch names, draft, merged, mergeable) — non-content, so it is not fenced.
Every content field is fenced and labelled with the source, the id, the author,
the association and the verdict; a field whose hidden material was removed says
`reason="hidden-content-stripped"` and gains a `stripped:` line naming each kind
and its count; an excluded author is a named line with no content at all. Read
the fences, never around them: content cannot close its own fence (`<<<` inside
the text is neutralised and counted).

`--json` prints the `forge-read@1` envelope instead: `contract`, `target`,
`number`, `transport`, `url`, `metadata`, `policy`, one `fields` row per piece
of forge text (`source`, `id`, `author`, `association`, `verdict`, `reason`,
`matchedBy`, `removals`, `removedChars`, `escaped`, `fenced`), a `summary` and
the `degradations`. A field carries `fenced` and never a bare `text`: the
envelope has no unfenced door.

An unreachable forge refuses with its class — `unavailable-forge-missing-cli`,
`-timeout`, `-auth`, `-no-network` (the same words `quality-metrics` degrades
by) — and prints no envelope, because a read that could not reach the forge is
not an empty answer. Exit 0 read and delivered · 2 a refusal or a usage error.

### The ad-hoc read shim

A read the model types itself never passes the subcommand, so the route also
ships a session-scoped `gh` trampoline:

```sh
runner forge-read shim install --dir <directory on the session PATH> [--gh <real gh>] [--runner <command>]
runner forge-read shim check --dir <directory>
```

The generated script is ten shell lines. A `case` on the two targets (generated
from the classifier's own list) lets a `view` through to the classifier and sends
everything else — writes, `gh api`, `gh auth`, any other verb — straight to the
real binary with its streams and exit code intact, so a write path pays nothing
for the guard. Inside the `view`, `shim exec` runs the same `classifyForgeArgs`
the subcommand and the pin run: a content read is answered by the guarded
delivery, a metadata-only read is proxied. An unrecognised form passes through —
blocking it would break a write path to protect nothing — and that residual is
declared in the unit SPEC, not hidden.

Arming is explicit and nothing in this repository arms it by default (that
step is issue #611's, beside `AGENTIC_WORKFLOW_RUNNER`): with the shim unarmed, an
ad-hoc `gh … view` in a session still reads the forge raw, which is the first
residual above.

### The sanctioned-forms pin

`scripts/forge-read-drift.mjs` keeps the prose honest: it reads the shipped
Markdown (`skills/`, `template/`, `docs/workflow/`) with the same classifier and
fails on a content-bearing raw read, on a `--json` list it cannot read, on
`gh api` in prose (the transport lives here), on an exemption with no reason, on
a runner contract that stops naming the subcommand, and on a ban with no
sanctioned citation left. The sanctioned spelling comes from
`skills/runner-contract/references/RUNNER.md`'s subcommand table, never a second
copy.

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

Six checks, fixed order. `ok` requires all six; any failure makes the whole
verdict `degraded` and names the failing checks:

| check | source | bound |
|---|---|---|
| `http-health` | `GET http://127.0.0.1:7437/health`, body `status` must be `ok` | 4 s |
| `mcp-runner` | one JSON-RPC `initialize` to `engram mcp --tools=agent` | 4 s |
| `binary-version` | `engram --version` | 4 s |
| `sync-staleness` | `engram sync --status`, `Pending import` must be 0 | 10 s |
| `session-ambiguity` | `engram doctor --json --check` on `ambiguous_active_runtime_sessions` + `sync_target_closed_space`, every non-`ok` answer reported | 10 s |
| `instance-id` | `engram instance-id` — the capability the memory tools hard-require (issue #566 B2); `ENGRAM_URL` set → remote authoritative, the local binary is not judged | 4 s |

The checks are independent, so they run together: the probe costs the slowest
bound (10 s), never the sum of six (36 s). Whole-probe ceiling: 30 s, which is
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

## `quality-metrics` — the project-quality sensor (feature 558, issue #565)

`workflow-status` measures workflow *state*. This measures workflow *quality*:
the DORA four keys — change-failure rate, lead time for change, and their two
companions — plus the reversion ratio, computed from git history and forge data
over a trailing window and printed as one validated document.

Three things it will not do: it never advises, never gates and never fixes. It
reports, and interpretation is the caller's.

**Read-only.** Every `git` and `gh` call is a read. `--out <path>` is the only
byte the command may write, and it writes exactly the bytes stdout carried.
**One project.** `--repo <dir>` scopes every reader — git, forge and corpus — to
the directory it names: the forge reads run inside it, so one document never
carries two projects' rows.
**Bounded.** Each git call has a 15 s bound, the three forge reads share one 30 s
budget with a 10 s per-call cap, and the first-commit read is a bounded sample
(see *Why a sample* below). **Fail closed.** A metric that cannot be computed is
`unavailable` with a `reason`, and that reason also appears in `degraded`; a
metric whose sources answered but whose denominator is empty carries a
`no-<observation>` reason. Neither is ever a zero.

### The window

The document measures `[until − days, until]`. `days` defaults to 90 and is the
`--window` flag; `until` is the flag of the same name, defaulting to the run's
instant, so a report is reproducible when the caller pins it. A report is
therefore auditable: the window that produced a number travels inside it.

### The metric definitions — the one home

| Metric | Formula | Unit | Confidence |
|---|---|---|---|
| `reversion_ratio` | revert commits ÷ total commits in the window | ratio (0..1) | `derived` — the revert identification is a message heuristic |
| `change_failure_rate` | deploys merged in the window that a revert names ÷ deploys merged in the window | ratio (0..1) | `derived` — the linkage is a heuristic and cannot see a deploy merged by hand |
| `lead_time_for_change` | median of first commit → merge over the sampled merged pulls inside the window | hours | `measured`, demoted to `derived` when the sample is truncated |
| `pr_volume` | pulls opened inside the window, with merged carried beside it | count | `measured`, demoted to `derived` when the created read hits its cap |
| `review_latency` | median of pull opened → first submitted review over the in-window pulls that carry a review | hours | `measured`, demoted to `derived` when the created read hits its cap |
| `escaped_defects` | open rows of the unit-doc findings corpus, with the document count beside it | count | `measured` — or `unavailable` when there is no corpus |

Median, not mean: one pull that sat open for a month should not move the
number a team acts on. Hours are rounded to two decimals and ratios to four, so
the same sources and the same window produce byte-identical bytes.

**The two revert heuristics.** A commit is a revert when `git revert` wrote it:
its subject starts `Revert "`, or its body carries `This reverts commit <oid>.`
The second form is also where the target oid comes from.
Its **false-positive shape**: a hand-written subject that literally starts
`Revert "` but reverts nothing, which inflates the ratio. Its
**false-negative shape**: a revert committed with a custom message, folded into
another change, or squashed into a merge, which deflates it. The two readings of
"% of commits reverted" are both reported rather than conflated: this ratio
counts the *revert commits* (needing no linkage), and the *reverted deploys* are
`change_failure_rate`'s numerator.

**Why a sample.** `gh pr list --json commits` builds a GraphQL query whose
`authors` connection explodes past GitHub's 500,000-node ceiling at roughly 100
pulls (measured: 40 answers, 100 fails), so the first-commit read asks for the
25 most recent merged pulls and the row says so when that is fewer than the
window's deploys. The deploy read and the created read ask for up to 1,000 rows
each, and **every row resting on a capped read drops to `derived`**: a subset is
never reported as a measurement, and the detail line names which read was
capped and at what.

**The escaped-defect slot is a slot.** It reports the open rows of the
findings corpus — the unit docs' `## Findings` tables and the legacy
`review-findings.md` ledgers, read through the fold queue's own parsers — and
says `unavailable` when a project carries no corpus. The corpus has no
per-row timestamp, so the window does not apply to it, and the row says that
too. Read it as an **upper bound**: a migrated unit's `## Findings` table only
carries rows nobody folded, but a legacy ledger can still show `folded: no` on
a unit that merged long ago, so on a mature project the number counts ledger
debt beside live escapes. The row's `detail` names that reading instead of
implying a defect count.

### The degradation codes

| Code | Cause |
|---|---|
| `unavailable-forge-missing-cli` | `gh` is not on PATH |
| `unavailable-forge-timeout` | a forge read exceeded its bound, or the dimension's budget was spent |
| `unavailable-forge-auth` | the forge answered an authentication failure |
| `unavailable-forge-no-network` | the forge read failed for any other reason |
| `unavailable-forge-malformed-answer` | the forge answered something that is not the expected JSON list |
| `unavailable-history-not-a-repository` | the path is not a git worktree (or `git` is absent) |
| `unavailable-history-unreadable` | a git read failed after the repository was found |
| `unavailable-history-shallow` | the clone is shallow **and** its oldest commit is inside the window, so the window's commit count is a subset |
| `unavailable-findings-corpus` | the project carries neither `docs/features/` nor `docs/fix/` unit documents |

A shallow clone whose history still reaches past `since` is **not** degraded:
coverage is asked of the history, not of the flag. And the zero-observation
reasons (`no-commits-in-window`, `no-deploys-in-window`, `no-pulls-in-window`,
`no-reviews-in-window`) are answers about the window, not failures — they are
never listed in `degraded`.

### The document — `quality-metrics@1`

The contract id is `agentic-workflow/quality-metrics`, the version is 1, and the
schema package publishes the validator (`validateQualityMetrics`) and the
draft-07 projection (`quality-metrics.schema.json`). The core is closed: an
unknown key anywhere is refused, and the two vocabularies (`QUALITY_METRIC_NAMES`,
`QUALITY_CONFIDENCES`) are the sets a consumer switches on.

```text
quality-metrics@1
field | shape | what it orders
contract | agentic-workflow/quality-metrics | the document's identity
version | 1 | the core version; a field change bumps it
schema | quality-metrics@1 | the token a reader dispatches on
source_revision | <7-40 hex> or null | the commit the report is anchored on; null when the history is unreadable
window.days | integer 1..3650 | the trailing day count the report measured
window.since | UTC instant | the window's opening instant, exactly `days` before its end
window.until | UTC instant | the window's closing instant
degraded | array of unavailable-<source>-<cause> | every source failure behind the unusable rows, deduplicated and sorted
metrics.<name> | one row per published metric name | the six rows; the name set is closed
row.confidence | measured \| derived \| unavailable | how far the value may be trusted, and never decoration
row.value | number or null | the measurement; null exactly when the row is unavailable
row.unit | ratio \| hours \| count | fixed by the metric, never chosen by a producer
row.reason | string or null | the declared cause: a code from `degraded`, or a no-<observation> code; null when measured
row.detail | 1..512 characters | the heuristic, the sample and the denominator in one readable line
row.components | closed per metric | the counts the value was computed from (see the definitions table)
```

## `materialize` — declared boundaries become recorded outcomes (unit 557, issue #564)

The engineering interview records, per boundary, whether it is enforced by a
machine or by prose only. A `prose-only` answer is honest and it is also the
defect: a boundary that lives in a reviewer's memory is not a boundary. This
service owns the last mile the product can own — it materializes the **decision**:

- the **rule content** is always the adopting team's (a lint rule set, a
  dependency-analysis config, a CI job): the workflow proposes, the project
  names the mechanism, and `apply` records it. Nothing stack-specific ships here;
- the **record** is the workflow's: `docs/workflow/BOUNDARY_ENFORCEMENT.md` holds
  one row per declared boundary, so the same prose-only answer cannot reappear
  quietly in the next session;
- the **check** is deterministic: a boundary declared with no enforcement
  mechanism is a typed finding with a route that resolves it, and a capture
  criterion with no digest fails closed instead of passing on prose.

```text
materialization@1
row | shape | what it orders
contract | agentic-workflow/materialization | the receipt's identity
operation | plan \| check \| apply \| evidence | which half of the round ran
item.kind | boundary \| feature-map \| evidence-driver | the three things a bootstrap materializes
item.status | enforced \| recorded-issue \| declined \| pending \| seeded \| missing \| declared \| undeclared | what the plan found; only `enforced`, `recorded-issue`, `declined`, `seeded` and `declared` are answers
residual.item | the item the round still owes | one row per unanswered item, never a silent omission
finding.code | MATERIALIZATION_FINDING_CODES | the closed set the schema package publishes: `boundary-declared-unenforced`, `boundary-artifact-missing`, `feature-map-missing`, `feature-map-shape`, `evidence-driver-missing`, `artifact-evidence-missing`
finding.route | <a finding-route@1 hand-off> — <the concrete target> | the single-input verb plus what resolves it (`continue — init-workspace`, `fix — <path>`); never bespoke prose
outcome | MATERIALIZATION_OUTCOMES | the three routes a prose-only boundary may take: `scaffold` (the project's rule file lands in the tree), `issue` (filed on the target forge), `declined` (the team said no, with its reason)
record.column | boundary \| enforcement \| outcome \| artifact \| recorded | the record document's one row per boundary; `artifact` is the rule path or the forge reference, `—` for a declined row
map.column | flow \| what-exists \| how-a-user-reaches-it \| evidence \| status | the feature map's one row per user-facing flow
criterion.id | AC-<n> | the acceptance criterion an artifact-evidence row signs
criterion.artifact | artifact: screenshot \| video \| state-snapshot | ARTIFACT_EVIDENCE_KINDS: the capture shapes a criterion may demand
evidence.digest | digest: sha256:<8-64 hex> | the artifact digest the evidence carrier records
evidence.driver | the guide's `Evidence driver` slot value | the project-declared capture command the evidence carrier must name
```

The document stamps are the writer's: the record carries `boundary-enforcement@1`
and the map `feature-map@1` as their first fenced line, so a reader knows which
columns the file was written for. Their columns are the two `record.column` /
`map.column` rows above — one home, never a second copy in the template.
## `skills` — discovery, consent and lifecycle (issue #591)

`init-workspace` offers, after the charter round, to search the trusted
registries the owner names. The search is a conversation and the install is the
owner's yes; the gate between them is this command, and it is offline by
contract — it reads a manifest and a tree, spawns no installer, fetches nothing,
and writes nothing except the one registration row the owner consented to.

```text
agentic-workflow skills discover --candidates <path|-> [--consent <path|->] [--root <dir>] [--json]
agentic-workflow skills register --guide <path> --name <n> --source <s> --pin <p> [--installed <YYYY-MM-DD>] --axis <a> [--json]
agentic-workflow skills inventory --guide <path> [--as-of <YYYY-MM-DD>] [--max-age-days <n>] [--json]
```

`--candidates` is `{ "candidates": [{ name, source, author, version, license, tree }] }`:
`name` and `tree` are required, the other four are the provenance the screen
checks. `--consent` is `{ "consent": { "<candidate>": "yes" | "no" } }` — the
owner's per-candidate answer, `pending` when absent. A `yes` on a candidate that
failed the screen is **blocked**: the candidate is never installable, and no
install command is printed for it. The install command is text
(`npx skills add <source>`); the workflow never runs it.

`register` appends one row to the guide's "Optional review extras" note,
creating the note and its block when the guide carries neither, and refusing a
duplicate name or an incomplete row before any byte moves. `inventory` reads the
note back with a decay state per row, so a later `product-audit` reports a
rotting extra instead of walking past it. Exit: `discover` 0 consistent · 1 a
consented candidate blocked; `register` 0 written · 2 refusal; `inventory` 0
every row `ok` · 1 a decay state. Every refusal is exit 2 with
`SKILLS REFUSAL — <reason>` on stderr.

### The discovery envelope — `skill-discovery@1`

The engine is `src/skills/screen.mjs` (the eight `skill-lint` checks, one owner)
plus `src/skills/discovery.mjs` (provenance, consent, decision). The block below
is the whole report; `--json` prints the same fields as JSON.

```text
skill-discovery@1
field | shape | what it orders
header | `skill-discovery@1 — <n> candidate(s) · screened <a> · excluded <b> · consented <c>` | the run's identity and its counts
candidate | `CANDIDATE <name> — <install|skip|blocked> · screen <screened|excluded> · provenance <complete|incomplete> · consent <pending|yes|no>` | one row per candidate, in manifest order
cells | `source … · pin … · author … · license … · tree …` | the candidate's declared provenance, echoed
reason | `reason <provenance-incomplete|screen-failed|tree-unreadable|no-skill-files> — …` | why a candidate is excluded; the missing cells are named for a provenance gap, and `no-skill-files` is a tree that yielded no skill file to screen
finding | `FINDING <SL-0n> <name> <path>:<line> — <detail>` | the screen's receipt, one line per finding, from the same engine `scripts/skill-lint.mjs` runs
install | `install: npx skills add <source>` | text only, and only for a consented candidate the screen passed
summary | `summary: candidates … · screened … · excluded … · installed-counts …` | the tally the verdict reads
verdict | `pass` \| `blocked` | `blocked` exactly when a consented candidate was excluded
```

### The registration ledger — `review-extras@1`

One row per installed external skill, inside the guide's "Optional review
extras" note. The columns are frozen: a new column is a grammar change, not a
hand edit of somebody's guide.

```text
review-extras@1
column | shape | what it holds
name | kebab-case skill name | the installed skill, and the key a duplicate is refused on
source | the registry or repository it came from | provenance, so a stale copy can be traced
pin | the version it is pinned to | a `latest`/`unpinned`/`main` value is the `unpinned` decay state
installed | YYYY-MM-DD | the install date; a real calendar day, and the age the `stale` state measures
axis | a review axis name | what the skill covers, so `product-audit` can tell it apart from the workflow's own pack
```

## `delivery-conditions` — the block a sweep prints (issue #704)

The command's machine receipt is one fixed block, byte-stable for a given
corpus: no clock, no path, no hash, and no third-party text — issue numbers,
condition kinds, verdicts, fixed sentences and degradation codes only. That last
property is what keeps the sweep outside the content guard's sanitizer: it reads
forge text to locate a phrase and a citation, and delivers none of it.

The five condition families and the four per-condition verdicts are the schema
package's published consts (`DELIVERY_CONDITION_KINDS`,
`DELIVERY_CONDITION_VERDICTS`); the finding and refusal codes are
`DELIVERY_CONDITION_FINDINGS` / `DELIVERY_CONDITION_REFUSALS`. The three report
verdicts are this block's own closed set. The phrasings the sweep recognises, and
the rule each family's `stalled` state implements, are owned by the issue
process (`skills/triage-issue/references/ISSUE_PROCESS.md` § Delivery conditions,
block `delivery-condition@1`) — this block states the output, never the rule.

```text
delivery-conditions@1
line | shape | what it holds
header | delivery-conditions@1 <mode> | the mode that produced the block: `sweep`, or `close-check #<n>`
corpus | corpus issues=<n> text-units=<n> conditions=<n> findings=<n> advisories=<n> unjudged=<n> truncated=<yes\|no> | the counted corpus: one text unit per body, comment or roadmap row read; `unjudged` counts the carried conditions whose citation could not be read; `truncated` says the read hit its limit
condition | CONDITION #<issue> · <kind> · cites #<n>[,#<n>] · <verdict> · via <body\|comment\|roadmap> | one extracted condition, the rows that need action first: `stalled`, then `unresolved`, `pending`, `satisfied`
finding | FINDING <code> · #<issue> · <detail> | a condition whose follow-up came due or a settled row covered by an open issue: the run fails
refusal | REFUSAL <code> · #<issue> · <detail> | the close-time guard's verdict, carrying the route that repairs it
advisory | ADVISORY <code> · #<issue> · <detail> | an uncarried condition (a phrase naming no issue): printed, never fatal, never silent
degraded | DEGRADED <code> | a source that could not be read (`unavailable-forge-…`, `unavailable-roadmap-…`, `corpus-truncated-at-limit`); the verdict never reads as a clean corpus
verdict | verdict <PASS\|VIOLATION\|UNRESOLVED> | `PASS` alone exits 0; `VIOLATION` is a finding or a refusal; `UNRESOLVED` is a corpus or citation the machine could not read
```

## Claim staleness (`claims`)

A claim ledger states what each row rests on and cites the bytes that prove it.
Those bytes move: a later phase rewrites the file a `CLAIM`/`INV` row points at,
and the row keeps asserting its `certainty` while its citation rots. The
`pre-execution-snapshot claims` op projects the sensor's own `changedPaths`
attribution (`changedBoundPaths`, the same reader `verify` reports drift
through) onto those rows and marks the ones whose citation moved.

```bash
runner pre-execution-snapshot claims --unit <NN-slug|fix-N> [--dir <artifact-dir>] \
  [--write] [--check] [--root <repo-root>]
```

The phase map comes from the unit doc's `## Log`: a `P<n>` line records the
phase and the commit it produced, and the projection tries the shas that line
carries in the order it lists them, using the first git can resolve (the corpus
puts the phase's own commit first and ancillary ones — a red-first test commit, a
settle commit — after it; an earlier checkpoint can only read `stale` where the
phase's own commit reads `fresh`, never the reverse). A claim is `stale` when a
cited path differs between one of those recorded revisions and the worktree.

**It reports; it does not gate.** The default run exits 0 whatever the rows say,
`--check` exits 1 when a row came back `stale` for a caller that chooses to
honour it, and no surface in this repository consumes the code: the blocking
policy is deliberately undecided until a real case decides it (the unit's `D2`).
`--write` lands the mark in the ledger, and it is idempotent — a second run is
byte-identical, because the column is detected rather than appended twice. Only
the CLAIM/INV tables and only the rows the projection answered are rewritten;
prose, other tables and escaped pipes are preserved byte for byte.

**Three no-signal states, never a false `fresh`:** a row citing nothing
`git ls-files` can see at a revision is `no-citation`; a unit recording no `P<n>`
phase leaves every row `unverified: no-recorded-phase`; a recorded revision git
cannot resolve answers `unverified: unresolvable-revision (P<n>)`.

Exit 0 reported · 1 `--check` with a stale row · 2 a usage error or a unit with
no claim ledger (the refusal names the absent `sources.md`). Read-only without
`--write`.

```text
claim-staleness@1
line | shape | what it holds
contract | claim-staleness@1 | the envelope's identity
unit | unit \| <NN-slug\|fix-N> | the unit whose claim ledger was projected
row.column | row \| state \| mark \| moved-paths | one line per CLAIM/INV row, in document order
row.state | fresh \| stale \| no-citation \| unverified-no-phase \| unverified-unresolvable-revision | the closed set; `fresh` means compared and nothing moved
row.mark | stale (P<n> · <sha>) \| fresh \| no-citation \| unverified: no-recorded-phase \| unverified: unresolvable-revision (P<n>) | the cell `--write` lands in the ledger's appended `staleness` column; `<sha>` is the 12-hex prefix of the phase's revision
row.moved-paths | <comma-separated repo paths> \| — | every cited path that moved after some recorded phase
summary | <n> rows · <s> stale · <f> fresh · <c> no-citation · <u> unverified | the counts, derived from the rows rather than tabulated twice
```
