---
type: feature
scope: large
---

# 65 — doc-toolchain

> One-line: Markdown stays the single source of truth — half A a deterministic
> `doc` CLI (section read, section-splice edit, derived structure index, TypeBox
> validation), half B a per-project retrieval index (FTS5 → hybrid) behind ONE
> entry point; both experimental and disposable, neither ever a decision
> authority.
>
> **Split (D6): this unit ships half B (+ AC4); half A re-homes to the
> follow-up unit `71-doc-cli`.**

## Objective

Ship issue #192's experimental doc toolchain in two workstreams under one label,
home `packages/agentic-workflow` (the runner crate of feature 61):

1. **Half A — the `doc` CLI**: section-level `read`, a remark-AST `edit` that
   rewrites Markdown in place deterministically, and `doc index` regenerating a
   derived JSON structure index (stable section IDs, parsed frontmatter, skill
   triggers, phase mapping, dependencies) with TypeBox schema validation and a
   lossless roundtrip golden test.
2. **Half B — the retrieval index**: one programmatic entry point
   (`--sync | --query | --status | --rebuild`) over one gitignored SQLite store,
   FTS5 keyword first, then `+ sqlite-vec` hybrid embeddings behind the same
   envelope contract, freshness by invariant (manifest hash + HEAD checked every
   query, inline incremental sync), consent-installed git hooks as fast paths,
   and a declared degradation matrix.

**Sequencing record (U1 → D6, decided 2026-10-01): split.** This unit (row 65)
delivers half B — the entry point, the P1 keyword core, the judge-gated hybrid,
the P3 wiring and the transversal discipline tests — plus AC4 (no build step,
transversal: this unit grows skills text in P7 and must never write
`skills/**/SKILL.md` either). Half A's AC1–AC3 and AC5–AC6 re-home to the
follow-up unit **`71-doc-cli`** (roadmap row + unit doc created at this unit's
**plan** step; the criteria of D8 bind it; `#192` closes there). The halves
share D5's stable section-ID function, so the follow-up is additive, never a
rewrite — retrieval never waits on the AST half (the issue's sequencing note,
answered rather than silently interleaved).

## Why

Agent loops today re-derive repository knowledge through grep/sed round trips
and load whole documents where one section would do. The issue's research
settled the representation question against 20 years of industry precedent
(DITA/DocBook/headless CMS converged back to Markdown authoring; structured JSON
costs only +1–6% bytes on this repo's own files), so the win comes from
**selection** — an index plus section-level loading — not from changing the
source format. `SKILL_CONTEXT_BUDGETS.json` is the existing proof of the
MD-source + JSON-derived pattern in this repo.

Half B additionally owns the "vectors = future opt-in" the 2026-09-13
consolidation deferred *without* an issue ("derived FTS5/sqlite index → #192;
vector embeddings: deferred"): agents cannot answer "have we seen this finding
before?" when the prior unit phrased it differently, and grep needs the exact
words. A disposable per-project cache over git needs no server and no sync —
same commit ⇒ equivalent index, `git pull` self-heals on the next query.

## User outcome

- A plain-language query through the entry point returns the prior finding,
  decision, spec or session-log entry **even when keywords differ** (hybrid
  mode), with fewer files read and fewer tokens loaded per discovery pass.
- `doc read --file <path> --section <id|title>` loads only the section an agent
  needs instead of a whole skill or SPEC.
- Nothing to remember: a missing index is built on first contact, a stale one is
  repaired on the next query, a broken one is `--rebuild`; with no API key the
  store answers keyword-only with a declared degradation; with no index at all
  every skill still completes over grep.
- Markdown is still what humans and git review — the `.db` and the JSON index
  are derived output nobody has to open.

## Acceptance criteria

Scenario-induced from issue #192; grouped as the issue groups them. Each is
command-verified where a command can verify it, and the Evidence section carries
one row per AC.

### Half A — doc toolchain

> **Split record (D6, 2026-10-01):** AC1–AC3 and AC5–AC6 re-home to the
> follow-up unit `71-doc-cli` — the text below stays verbatim as that unit's
> source. This unit owns AC4 (transversal — kept here) and AC7–AC27.

1. **Roundtrip is lossless.** MD → AST → MD is byte-identical on unchanged
   input, proven against the golden fixtures and every `skills/**` doc; the
   allowed normalizations are listed explicitly in the test. Verified by the
   roundtrip suite exiting 0.
2. **Index regeneration is deterministic.** Two `doc index` runs over an
   unchanged corpus produce byte-identical output — stable section IDs, no
   timestamps. Verified by a diff of two runs (empty diff).
3. **Measured savings demo.** A second `review-change`-style pass loads only the
   relevant sections (receipts ledger + index) instead of a whole `SKILL.md`;
   the token/byte delta is recorded in Evidence.
4. **No build step.** `SKILL.md` files are never generated or rewritten by this
   toolchain: pi loads skills natively, no drift surface is created. Verified by
   a grep asserting no generator writes into `skills/**/SKILL.md`.
5. **Schemas validated in CI.** Frontmatter and structured artifacts
   (SPEC, receipts) validate against TypeBox (TypeCompiler) schemas in the test
   suite. Verified by the suite exiting 0 with a deliberately invalid fixture
   rejected.
6. **Ship experimental.** The toolchain is documented as experimental, and any
   published pi-package surface is marked alpha/experimental. Verified by grep
   of the documented label.

### Half B — retrieval index, P1 keyword core

7. **First creation.** In a repo without an index, the entry point's `--sync`
   exits 0, creates `.agentic-workflow/index/index.db`, `--status` reports
   `files > 0, chunks > 0`, and `git status --porcelain` stays empty (the `.db`
   is gitignored).
8. **Query = envelope.** `--query "<term>" --json-only` prints exactly one JSON
   document to stdout (`results[]` with `path + section + lines + score`,
   `degradations[]`); diagnostics go to stderr; exit 0.
9. **Freshness invariant (the pull case).** After a `git pull`/merge or a hand
   edit that fires no hook, a query for content introduced by that change
   returns it in the same pass and the stored manifest (hashes + HEAD) is
   updated — fixture-verified.
10. **Incremental by hash.** Changing 1 of N files makes `--sync` report
    `files_scanned=N, files_changed=1` without reprocessing the rest.
11. **Deletions.** After removing a file and syncing, a query for its content
    returns no results (no orphan chunks).
12. **Determinism.** Two `--sync` runs over an identical corpus produce an
    identical manifest byte-for-byte; the same query returns the same ranking
    (no timestamps, stable ordering).
13. **Offline.** P1 is fully functional with no network and no API key.
14. **Session-log retrieval.** A query over `docs/LOGS.md` entries with a
    structured filter (date range or touched-file path) returns the matching
    entries with `path + lines` and their metadata — fixture-verified (its
    semantic half belongs to AC15's judge fixture).

### Half B — P2 hybrid (judge-gated)

15. **Judge fixture (ship/no-ship).** With a document whose wording shares no
    query terms (query: "transient failure handling"; doc: "backoff policy for
    retryable errors"), `--mode hybrid` returns it top-3 while `--mode keyword`
    does not — the measured delta is recorded as Evidence; **no delta ⇒ P2 does
    not ship**.
16. **Embedding incrementalism.** Changing one file re-embeds only that file's
    chunks — asserted via mock API call counts; unchanged chunks are untouched.
17. **No key / provider down ⇒ degrade, not break.** Exit 0,
    `degradations: ["unavailable-embeddings-<cause>"]`, keyword mode still
    answers, hybrid degrades to keyword with the cause declared.
18. **Model mismatch fails closed.** If the configured embedding model differs
    from the one that produced the store, queries return a declared
    `embeddings-model-mismatch` degradation, never cross-model rankings.
19. **Cost bound.** A warm `--sync` (no changes) on an MB-scale corpus finishes
    ≤ 1s and makes **0** API calls.

### Half B — P3 wiring, consent, hooks

20. **Dedup in a real flow.** A fixture containing a finding already persisted
    by an earlier unit is surfaced by the discovery step of `triage-issue` /
    `review-change` through the entry point, and Evidence records files-read
    with vs without the index (the savings delta).
21. **Grep fallback holds.** With the index absent (not built / no key), the
    same skill turn completes via grep alone; the turn-contract box stays
    accurate and `bun scripts/check-skill-context.mjs` stays green.
22. **Consent.** `init-workspace` installs the index scaffold and git hooks only
    after an explicit yes (existing ask-first contract, tested in the style of
    `template/.agentic-workflow/hooks/tests/`).
23. **Hook freshness.** `post-merge`, `post-checkout`, `post-rewrite` invoke
    `--sync --quiet` with exit 0 (hook tests).
24. **Ships to target projects.** After `init-workspace` in a temp dir, the
    entry point runs (runner-crate subcommand per feature 61).

### Transversal

25. **Single entry point, mechanically enforced.** A static test asserts
    `index.db`/index-store paths are referenced only from the entry point, its
    config, `.gitignore`, and docs — no skill, hook, or doc tool opens the store.
26. **Never authority, mechanically enforced.** A discipline test asserts the
    entry point appears only inside the allowlisted discovery steps of
    `triage-issue` + `review-change` (and its own surfaces), and that **no**
    `Decision:`/gate/receipt producer invokes it.
27. **Runtime dual.** The same invocation under `bun` and under `node` produces
    the identical envelope (existing node-compat CI).

## Non-goals

- **JSON as source of truth** for docs/skills — rejected by the issue's prior
  research (git diff/review legibility, LLM authoring ergonomics, the Agent
  Skills standard, roundtrip lossiness).
- **Migrating or regenerating existing docs** — additive tooling only.
- **The docs web UI itself** — it owns its own feature; this unit only
  guarantees the index feed.
- **Server or managed vector DBs** (pgvector, Qdrant, Chroma) — rejected
  2026-09-28 for a local MB-scale corpus; revisit only as the documented P4
  opt-in. No cloud/team-synced store ships here.
- **Any memory protocol** — no sessions, judgments, decay, curation, or sync.
  Engram (#262) owns cross-session agent memory; git already shares team memory.
  This index is a disposable cache over git, deliberately not "our own Engram
  for docs".
- **The index as gate/decision authority** — gates, receipts, normative
  surfaces and exhaustive audits stay on grep/LSP/scripts (discipline-tested).
- **Replacing Serena (symbols) or grep (exhaustive/contract-grade sweeps)** —
  the index is the missing third capability (retrieval by meaning).
- **Committing the `.db`** — gitignored build output, always regenerated.
- **A query-time cross-encoder rerank model behind a provider API** — out of
  scope (D9): one more network call, key and degradation path per query that
  the issue never asked for, and AC15 only needs hybrid to beat keyword.
  Revisit as a documented P4 opt-in beside the server vector DBs.
- Findings discovered during implementation never widen this unit; they are
  recorded and routed to their owner.

## Future cost

| Rule | Binds |
|---|---|
| The `.db` stays gitignored and regenerated — never committed, never hand-edited | anyone touching `.gitignore` or tempted to ship an index artifact |
| Nothing but the entry point opens the store (AC25's static test) | whoever adds a script, hook or skill that "just reads the index" |
| The index is never a decision authority (AC26's discipline test) | whoever wires discovery into `triage-issue`/`review-change` — gates and receipts stay on grep/LSP/scripts |
| The embedding model is config-pinned; a mismatch fails closed, never ranks across models (AC18) | anyone bumping the pinned model — the store must be `--rebuild`ed in the same change |
| `log-session` owns the `docs/LOGS.md` entry shape; the index consumes it as-is | any change to the entry heading/metadata — a coordination point with this unit, never an index-side edit |
| Skills keep loading with **no build step** (AC4) | anyone tempted to generate `SKILL.md` or add a docs build |
| Experimental/alpha labelling persists until promotion is earned by measured context/token savings on a real flow | whoever would publish or advertise this toolchain |
| P3's discovery wording grows `triage-issue`/`review-change` context budgets | the next author of either skill — a ceiling re-basis ships with the growth, reason declared |
| Every touched `SKILL.md` owes a `bump-skill` version bump + `CHANGELOG.md` row | this unit's docs/release steps and every later edit |

## Applicable tests

- Root suite `node --test scripts/*.test.mjs` (baseline 599/0 at unit start,
  incl. `normative-drift`, `check-skill-context`, `unit-route`, `phase-lint`,
  `golden-fixture`) — must stay green.
- `bun scripts/check-skill-context.mjs` (context budgets + reference
  reachability) — green after any skill wording growth.
- New contract/lifecycle suites for the index, red-first (envelope shape, hash
  incrementalism, deletions, determinism, degradation paths, the two discipline
  tests: single entry point, never-authority) and the roundtrip golden suite for
  half A — house style `node --test` so they ride the root gate.
- Crate suites `bun run test` and `bun run test:node` in
  `packages/agentic-workflow` (the node-compat half is AC27's runtime-dual
  surface).
- Hook tests in the style of `template/.agentic-workflow/hooks/tests/` (AC23)
  and the init-workspace consent test (AC22).

The `tests` triage step therefore runs rather than being skipped.

## Known pre-existing issues

- **Runner crate exists** (feature 61, `packages/agentic-workflow`, bin
  `agentic-workflow`, router with `unit-doc`/`roadmap`/`changelog`/`budgets`/
  `manifest` subcommands) — **affects** this unit positively: it is the decided
  entry-point home, so the retrieval CLI lands as a sibling subcommand and the
  issue's `bun scripts/index-docs.mjs --sync` prototype spelling is superseded
  by the vehicle rule (the issue itself records the supersession).
- **`packages/agentic-workflow` declares "No dependencies" and
  `engines.node >= 18`** — **affects**: P1's FTS5 store must resolve under both
  runtimes without a native dependency install; SQLite availability per runtime
  is the research step's open question (row R…), and a decision to add a
  dependency is a design decision recorded before any code is written —
  **resolved by design: D7 (engines `node >= 24`, bun primary) + D8 (library
  policy: TypeBox in, remark out); the engines/README edit lands in implement/
  docs, never silently.**
- **`.gitignore` has no `.agentic-workflow/index/` entry yet** — **affects**:
  AC7 asserts `git status` stays empty after first sync; the implement step adds
  the ignore line before that assertion can pass.
- **Gate baseline at unit start (2026-10-01):** `node --test scripts/*.test.mjs`
  = **599 pass / 0 fail**; `bun scripts/check-skill-context.mjs` = **PASS
  (28 skills)**; schema package `dist/` present — **does-not-affect** (green
  baseline; a red one would be recorded here first, never discovered mid-flight).
- **`B-01 scripts/ distribution gap`** (superseded by feature 61's
  runtime-scripts-in-crate decision) — **does-not-affect**: the entry point is
  distributed with the crate, which `init-workspace` already ships.
- **#198 per-skill package layout** (declined/superseded) — **does-not-affect**:
  scripts-in-skill-folders is no longer the vehicle.
- **Engram #262** (cross-session memory) — **does-not-affect**: boundary only —
  conversational recall stays there, corpus retrieval here; nothing in #262
  blocks this unit.
- **`docs/LOGS.md` entry shape is owned by `log-session`** (skill +
  `template/docs/LOGS.md`) — **does-not-affect**: consumed as-is, its heading
  fields become queryable metadata; a future format change is a coordination
  point, never an index-side edit.
- **`scripts/check-skill-context.mjs` route/ceiling discipline** — **affects**
  P3 only: wiring discovery wording into `triage-issue`/`review-change` may
  require declared ceiling re-bases (Future cost row above).

### Research uncertainties (stated, never guessed — the design step resolves them)

- **U1 — split vs sequence (half A vs half B).** The issue explicitly leaves
  “split into two units vs sequence inside one” to the lane. Research makes no
  call: design/plan surfaces it as one focused question with concrete options.
  → **resolved: D6 — split; half B here, half A → follow-up `71-doc-cli`.**
- **U2 — runtime floor vs `node:sqlite`.** Both `node:sqlite` (≥ 22.5,
  still experimental) and `bun:sqlite` provide FTS5 here (R3), but the packages
  declare `engines.node >= 18` while CI pins v22.23.1. Options — raise the
  engine floor, ship a declared `unavailable-sqlite-<runtime>` degradation, or
  vendor — are a design decision, recorded before any code.
  → **resolved: D7 — engines `node >= 24`, bun primary, degradation kept.**
- **U3 — dependency posture.** The crate is zero-dependency by charter (R1), so
  remark/unified + TypeBox (half A) and `sqlite-vec` (half B's native extension)
  each break that claim; vendoring is this repo's measured alternative
  (`AGENTS.md`: provenance header mandatory). The trade is recorded in design,
  not assumed here.
  → **resolved: D8 — TypeBox pinned in, remark out, library criteria recorded.**
- **U4 — `sqlite-vec` loadability** under bun and under node is unverified (no
  extension was loaded in R3); a visible gap. P2 ships only on AC15's judge
  fixture regardless, so the gap bounds effort, not correctness.
  → **resolved: D9 — probe loadability at plan; JS-cosine fallback; AC15 gates.**
  → **probe run 2026-10-01: loadable under node 24.21.0 and bun 1.4.3 (G1)** — D9's `sqlite-vec` branch selected; AC15 still gates the ship.
- **U5 — embedding provider/key defaults and provisioning** for target projects
  remain the issue's open question — ask-first at design, config-pinned,
  degrade-to-keyword when absent.
  → **resolved: D10 — config file + env-var names + pi-style env precedence.**
- **U6 — crate README drift (observed).** `packages/agentic-workflow/README.md`
  still says “Current producers: none yet … feature 42 is the next candidate to
  add the first crate subcommand” while its bin already exposes five
  subcommands — **does-not-affect** this unit (route to `audit-docs`; never fixed
  inside this unit).

## Tasks

Phase set re-cut at plan (2026-10-01) to this unit's 22 kept ACs (AC4 +
AC7–AC27) after the D6 split. Research, design and plan ran as catalog steps
(rows R1–R8, D1–D10, G1–G4 below); docs and release stay catalog steps,
deliberately not cut as phases. Ordered smallest-first, one phase = one commit,
P10 is the verification tail.

- P1 — Runtime floor and ignored store (D7's booked consequences): `.node-version` set to `v24.21.0`, crate `engines` set to `node >= 24` with `bun >= 1.4` kept, the `.agentic-workflow/index/` ignore rule added before AC7 can assert a clean `git status`, and FTS5 re-verified on both declared runtimes. (validator: `grep -q '.agentic-workflow/index/' .gitignore && node -e "const{DatabaseSync}=require('node:sqlite');new DatabaseSync(':memory:').exec('create virtual table t using fts5(doc)')" && bun -e "const{Database}=require('bun:sqlite');new Database(':memory:').exec('create virtual table t using fts5(doc)')"` exits 0)
  - Relevant files: ./.node-version, ./.gitignore, packages/agentic-workflow/package.json
- P2 — `doc` entry point grammar and envelope contract (D2/D3/D8): the retrieval branch under `agentic-workflow doc` (`--sync` / `--query` / `--status` / `--rebuild`), the `--json-only` envelope `{ok, command, results[], degradations[], store}` with its frozen ordering, the closed degradation vocabulary, the exit codes `0`/`1`/`2`, and TypeBox validation of the envelope. (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src, packages/agentic-workflow/test, packages/agentic-workflow/package.json
- P3 — Store, config, and canonical manifest: the gitignored `.agentic-workflow/index/index.db`, the committed `.agentic-workflow/index.json` that defaults when absent, and the manifest export (sorted keys, per-file sha256 plus git HEAD, no timestamps) that AC12's byte-for-byte assertion runs over. (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test, .agentic-workflow/index.json, ./.gitignore
- P4 — Incremental sync engine: hash-based change detection reporting `files_scanned` and `files_changed`, deletion reaping so no orphan chunk survives, and the freshness invariant (manifest hash plus git HEAD checked on every query, with an inline sync before answering). (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test
- P5 — Keyword query core: FTS5 search behind `--query --json-only`, the `path + section + lines + score + meta` result rows in the frozen order, `--status`, offline answering with no network and no key (AC13), and the structured session-log filter over date ranges and touched-file paths (AC14). (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test, docs/LOGS.md
- P6 — Embeddings write path: provider config with pi-style precedence (`CLI > env > config > default`, D10), float32-LE vectors behind a format tag and a pinned model column, re-embedding only the chunks of a changed file asserted by mock API call count (AC16), and the model-mismatch check that fails closed instead of ranking across models (AC18). (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test, packages/agentic-workflow/package.json, .agentic-workflow/index.json
- P7 — Hybrid query behind the judge gate: RRF fusion over the FTS5 and vector top-K, the keyword-only degradation when no key exists and the provider-down degradation with its cause declared (AC17), the AC15 judge-fixture delta (hybrid top-3 versus keyword; no delta ⇒ P2 does not ship), and the AC19 warm-sync cost bound of at most 1s with zero API calls. (validator: `cd packages/agentic-workflow && bun run test` exits 0 with the AC15 delta row present in Evidence)
  - Relevant files: packages/agentic-workflow/src, packages/agentic-workflow/test
- P8 — Discovery wiring and consent: the allowlisted discovery wording in `triage-issue` and `review-change` with their declared context-ceiling re-bases (AC20, AC21), `init-workspace`'s ask-first consent block for the index scaffold and git hooks (AC22), and the three git hooks invoking `--sync --quiet` with their hook tests (AC23). (validator: `bun scripts/check-skill-context.mjs && cd packages/agentic-workflow && bun run test` exits 0)
  - Relevant files: skills/triage-issue/SKILL.md, skills/review-change/SKILL.md, skills/init-workspace/SKILL.md, template/.agentic-workflow/hooks, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- P9 — Transversal discipline suites: the static single-entry-point test over `index.db` paths (AC25), the never-authority discipline test over the discovery allowlist (AC26), the no-build-step assertion that no generator writes into `skills/**/SKILL.md` (AC4), and the temp-dir `init-workspace` run proving the entry point ships to target projects (AC24), all in `scripts/` so they ride the root gate. (validator: `node --test scripts/*.test.mjs` exits 0)
  - Relevant files: scripts/, packages/agentic-workflow/bin/agentic-workflow.mjs, template/
- P10 — Verification at head: the full root gate, both crate runtimes (`bun run test` and `bun run test:node`), context budgets, and the diff guard over every implement phase, with one Evidence row per kept AC. (validator: `node --test scripts/*.test.mjs && cd packages/agentic-workflow && bun run test && bun run test:node` exits 0)

AC→task map (22 kept): AC4→P9, AC7→P1+P3, AC8→P2+P5, AC9→P4, AC10→P4,
AC11→P4, AC12→P3, AC13→P5, AC14→P5, AC15→P7, AC16→P6, AC17→P2+P7, AC18→P6,
AC19→P7, AC20→P8, AC21→P8, AC22→P8, AC23→P8, AC24→P9, AC25→P9, AC26→P9,
AC27→P10. Research/design/plan are complete catalog steps, not phases; docs and
release run after P10 as catalog steps.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | `sed -n '1,45p' packages/agentic-workflow/bin/agentic-workflow.mjs` · `head -40 packages/agentic-workflow/README.md` | 0 · 0 | subcommand router (`unit-doc`/`roadmap`/`changelog`/`budgets`/`manifest`), fixed receipt blocks, `EDIT REFUSAL` exit 2; crate charter: “Private, zero dependencies, no build step” | main agent |
| R2 | `sed -n '1,45p' scripts/workflow-status.mjs` · `grep -n 'export function validateEnvelope\|export function parseEnvelope' packages/agentic-workflow-schema/src/index.ts` | 0 · 0 | the envelope producer pattern: JSON on stdout, diagnostics on stderr, schema runtime loaded from the built `dist/` with a named precondition; `validateEnvelope`/`parseEnvelope` are exported for AC8 | main agent |
| R3 | `node -e "import('node:sqlite')…fts5"` · `bun -e "…bun:sqlite…fts5"` · `node --version` · `cat .node-version` | 0 · 0 | node v24.21.0: `node:sqlite` + FTS5 **OK**; bun 1.4.3: `bun:sqlite` + FTS5 **OK**; CI pins node **v22.23.1**, both packages declare `engines.node >= 18` | main agent |
| R4 | `git ls-files .agentic-workflow` · `cat .gitignore` · `grep -rln 'fts5\|index\.db' scripts packages/*/src packages/*/bin` | 0 | only `.agentic-workflow/tmp/.gitkeep` tracked and **no** `.agentic-workflow/` ignore rule → AC7 needs a `.gitignore` line; no SQLite/index code exists anywhere yet | main agent |
| R5 | `grep -n '^## ' docs/LOGS.md \| head -3` | 0 | `## <ISO timestamp> — <branch> — manual\|auto (+optional suffix)` — timestamp, branch and mode are the queryable header fields; heading shape is stable at unit scale | main agent |
| R6 | `ls packages/agentic-workflow/src/edit` · `grep -rn 'remark\|unified' --include=package.json packages package.json` · `grep -A8 '"dependencies"' packages/agentic-workflow-schema/package.json` | 0 | half A prior art: `UnitDoc.setSection`/`evidence_addRow`/`progress_logEntry` already do structured section ops with receipts; **no** remark/unified anywhere; schema package's only dep surface is devDep `ajv 8.20.0` + `typescript` | main agent |
| R7 | `node --test scripts/*.test.mjs` (baseline, before any edit) · `bun scripts/check-skill-context.mjs` | 0 · 0 | 599 pass / 0 fail · `PASS context budgets: 28 skills` | main agent |
| R8 | `ls template/.agentic-workflow/hooks` · `ls template/.agentic-workflow/hooks/tests` | 0 | consent-installed hook precedent exists (`adapters/`, `turn-contract.sh`, `fullauto-merge.sh`, `tests/`) — the style AC22/AC23 reuse | main agent |
| D1 | design closure — entities/roles/expectations swept against AC1–AC27. Entities: the `agentic-workflow` bin router, the new `doc` entry point and its ops, `.agentic-workflow/index/index.db` (+ `-wal`/`-shm`), `.agentic-workflow/index.json` config, manifest, section chunks/stable IDs, the degradation list, `triage-issue`/`review-change` discovery steps, `init-workspace` consent, the three git hooks, `docs/LOGS.md`. Roles: querying agent (consumer), project owner (consent + config), maintainer/CI (gates, the two discipline tests), git (hook triggers), `log-session` (log-shape owner, consumed as-is). Expectations accepted: plain-language query, `--mode keyword\|hybrid`, `--json-only`, section by id or title, auto-build/repair on first contact. Expectations rejected: servers/managed vector DBs, committed `.db`, index-as-authority, memory semantics, JSON as source, any write outside `doc edit` | recorded | closure is answer-independent and fixed now; the five open decisions it does not settle are posed to the user, never inferred | main agent |
| D2 | entry point shape — ONE crate subcommand `agentic-workflow doc` owns both halves: half A positional ops `read` / `edit` / `index`, half B retrieval as the issue's flag spellings `--sync` / `--query` / `--status` / `--rebuild` (first token after `doc` starting with `-` selects retrieval, otherwise a doc op — one grammar branch, no aliases, AC spellings stay verbatim) | recorded | single command ⇒ AC25's "only the entry point opens the store" holds structurally (AC24's `init-workspace` surface runs the same bin); `doc edit` reuses the crate's path-policy refusal (exit 2) like every other edit service; `--json-only` ⇒ exactly one JSON doc on stdout, diagnostics on stderr (AC8) | main agent |
| D3 | envelope + degradation contract — stdout under `--json-only`: one canonical JSON doc `{ok, command, results[], degradations[], store}`, `results[]` rows `{path, section, lines, score, meta}`; ordering `score desc → path asc → section asc → lines[0] asc`; **no timestamps anywhere** (AC2/AC12). Exit codes: `0` success *including degraded* (AC17), `1` usage/IO, `2` path refusal (crate convention). `degradations[]` is a **closed** vocabulary frozen in code and asserted by test: `unavailable-sqlite-<runtime>`, `unavailable-embeddings-not-configured`, `unavailable-embeddings-<cause>`, `embeddings-model-mismatch` (AC18) — an unknown value fails the test, never ships | recorded | AC8/AC17/AC18 become mechanically checkable; the closed list keeps the degradation matrix (issue's) enumerable | main agent |
| D4 | store + config + determinism surface — store `.agentic-workflow/index/index.db` (AC7) under an ignore rule `.agentic-workflow/index/` that the implement step adds to `.gitignore` first; config `.agentic-workflow/index.json` is the **committed** surface (shipped by `init-workspace`, defaults when absent — never a hard failure); manifest = db table **plus a canonical JSON export** (sorted keys, per-file sha256 + git HEAD, no timestamps) — AC12's byte-for-byte assertion runs over that export, not SQLite file bytes, so the AC is honestly verifiable; freshness = manifest hash + HEAD checked on **every** query, stale ⇒ inline incremental sync before answering (AC9); vectors stored as float32-LE BLOBs behind a format tag + pinned model column (AC18 fails closed) | recorded | keeps the `.db` disposable build output; separates the committed decision surface (config) from the regenerated cache; makes determinism a property of an exported artifact, not of SQLite page layout | main agent |
| D5 | chunking + stable IDs — a chunk is one ATX-heading-delimited section found by a **fence-aware** scanner (a `#` inside a fenced code block is never a heading); id = `<relative-path>#<slug of the heading path>` with `-2` style dedupe, derived only from content (no timestamps, no mtimes) ⇒ AC2's run-to-run byte identity; 1-based inclusive `lines` recorded per chunk (AC8 `lines`); frontmatter parsed once per file into chunk metadata, skill chunks carry their `triggers` for `doc index`; half A's structure index and half B's chunks consume **one shared id function**, so both halves cannot drift | recorded | answers the research's chunking/section-ID question; shared id function makes a later half A/B split (U1) additive instead of a rewrite | main agent |
| D6 | **U1 — split (user answer 2026-10-01: "follow recommended").** This unit (row 65) delivers half B: entry point, P1 keyword core, P2 judge-gated hybrid, P3 wiring, transversal AC25–AC27, plus AC4 (no build step). Half A's AC1–AC3 + AC5–AC6 re-home to the follow-up unit **`71-doc-cli`** (roadmap row + unit doc created at **plan**, the AC text above kept verbatim as its source; `#192` closes there). Why split: the diff guard's default 400 lines / 8 files per implement step against 27 ACs (feature 69 breached with 7), the halves are independently valuable and independently risky (AC15 can stop half B at P1 without dragging half A), and one unit = one PR | recorded | the issue's own "split vs sequence" note answered, not inferred; plan re-cuts the P-phases to this unit's 22 ACs (AC4 + AC7–AC27) | main agent |
| D7 | **U2 — runtime floor (user: "node >= 24 but Bun 1.4 preferred and main it is Bun").** `packages/agentic-workflow` engines → `node >= 24`, `bun >= 1.4`; bun stays the primary runtime (repo convention: bun-first manual invocation, `AGENTIC_WORKFLOW_RUNTIME` override), node is the supported floor and the AC27 CI dual. Consequences booked for implement: `.node-version` `v22.23.1 → v24.x` (locally verified v24.21.0) so CI runs the declared floor, and `node:sqlite`/`bun:sqlite` + FTS5 re-verified on those exact versions as the first implement action; the declared `unavailable-sqlite-<runtime>` degradation stays as the belt for any runtime without FTS5 | recorded | U2 closed before any code — a floor CI does not run is a lie the dual-runtime AC27 cannot carry | main agent |
| D8 | **U3 — dependency posture + library policy (user criteria, recorded verbatim):** adopt stable & maintained libraries (no release younger than 3 days; "not maintained" only when maintenance is genuinely unnecessary); prefer the fewest possible dependencies; never a library that is trivially done natively (left-pad class); never complexity that is not needed; take the lazy path whenever a library meets those prerequisites. Applied: **`typebox` adopted** — exact-pinned (the `1.3.7` already in this repo's tree, far older than 3 days), zero transitive deps, carries AC5's schema authority and the index envelope's validation (D3). **`remark`/`unified` not adopted** — half B never re-prints Markdown (edits splice), so heading/frontmatter scanning is the bounded native class and D5's fence-aware scanner stands; the re-trigger is the golden corpus itself: if the scanner cannot pass every `skills/**` + `docs/**` doc, reconsider read-only `remark-parse` (no stringify) under these same criteria, in whichever unit hits it. `sqlite-vec` → D9 | recorded | the crate README claim moves from "zero dependencies" to "one pinned pure-JS dependency, no native deps, no build step" (docs step); vendoring stays the fallback, never the default | main agent |
| D9 | **P2 hybrid backend (user: probe first; noted that providers expose rerank + embedding models — scope question answered in Spanish, on the record).** Sequence: at plan, a loadability probe runs `sqlite-vec` under bun **and** node (research U4's gap); loadable + D8 criteria ⇒ `sqlite-vec`; anything else ⇒ pure-JS cosine rerank over the FTS5 top-K (float32-LE BLOBs, no extension). Either path must pass AC15's judge fixture — **no delta ⇒ P2 does not ship** either way. **Provider-side cross-encoder rerank at query time = out of scope**, recorded in Non-goals (future P4-class opt-in) | recorded | U4's unverified loadability becomes a plan-time gate instead of a mid-implementation surprise; the rerank doubt is answered on the record, never silently dropped | main agent |
| D10 | **U5 — provider/key configuration (user: config JSON + whatever env the user wants + direct env vars as pi does).** Surface: `.agentic-workflow/index.json` (D4) names the provider — OpenAI-compatible `baseUrl` + `model` + **the env-var names to read** (any names the user chooses) — and the entry point also honours direct environment variables in pi's style. Precedence: CLI flag > environment variable > config file > default. Absent everywhere ⇒ keyword-only with `unavailable-embeddings-not-configured` (AC17), never a hard failure; the model stays config-pinned, mismatch fails closed (AC18) | recorded | no key implied and no vendor default (the two rejected options); a team can pin a different provider per project without code changes | main agent |
| G1 | D9 plan-time loadability probe — the **D9 probe (G1)** one-liner block below | 0 | node 24.21.0 and bun 1.4.3 each print `[{"rowid":1,"distance":0}]` for the `vec0` kNN query → **loadable under both runtimes** ⇒ D9 selects `sqlite-vec` (AC15 still gates the ship) | main agent |
| G2 | D8 library criteria — the **dependency probe (G2)** block below | 0 | in-tree `typebox` `1.3.7` (published 2026-07-23, 0 transitive deps); `sqlite-vec` `0.1.9` (published 2026-03-31, `MIT OR Apache`, 5 platform `optionalDependencies`) → both pass D8 (older than 3 days, fewest deps, not natively trivial) | main agent |
| G3 | prior-decisions contradiction sweep — the **sweep command (G3)** block below | 0 | 8 candidate hits, all `compatible`, 0 `contradicts` → table under `## Prior-decisions contradiction sweep` | main agent |
| G4 | `bun scripts/phase-lint.mjs docs/features/65-doc-toolchain/SPEC.md` | 0 | verdict PASS over P1–P10 (block under `## Plan gate (phase-lint)`) | main agent |
| P1 | `grep -q '.agentic-workflow/index/' .gitignore && node -e "…fts5"` · `bun -e "…fts5"` · `bun scripts/diff-guard.mjs --base HEAD~1 --unit 65` | 0 · 0 · 0 | node v24.21.0 + bun 1.4.3 both create an FTS5 virtual table (validator exit 0); ignore rule added; engines `node >=24` · `.node-version` `v24.21.0`; guard PASS 7 lines / 3 files | main agent |
| P2 | `bun run test` · `node --test` · red run (`bun test test/doc.envelope.test.mjs` before src existed) | 0 · 0 · 1 | crate 130 pass / 0 fail (bun) and 131 pass / 0 fail (node); 38 new P2 tests ran **red first** (module not found) before implementation; guard BREACH exception recorded in Progress log | main agent |

**D9 probe (G1)** — one re-runnable line, the plan-time gate D9 prescribes:

```text
d=$(mktemp -d) && cd "$d" && printf '{"name":"probe"}' > package.json && npm i sqlite-vec@0.1.9 --silent && node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(':memory:',{allowExtension:true});db.loadExtension('$d/node_modules/sqlite-vec-linux-x64/vec0.so');db.exec('create virtual table v using vec0(embedding float[3])');db.prepare('insert into v(rowid,embedding) values(?,?)').run(1n,'[1,2,3]');console.log(JSON.stringify(db.prepare('select rowid,distance from v where embedding match ? and k=1').all('[1,2,3]')))" && bun -e "const{Database}=require('bun:sqlite');const db=new Database(':memory:');db.loadExtension('$d/node_modules/sqlite-vec-linux-x64/vec0.so');db.exec('create virtual table v using vec0(embedding float[3])');db.prepare('insert into v(rowid,embedding) values(?,?)').run(1n,'[1,2,3]');console.log(JSON.stringify(db.prepare('select rowid,distance from v where embedding match ? and k=1').all('[1,2,3]')))"
```

**Dependency probe (G2)**:

```text
node -e "Promise.all(['typebox','sqlite-vec'].map(n=>fetch('https://registry.npmjs.org/'+n).then(r=>r.json()))).then(([t,s])=>console.log('typebox-1.3.7',t.time['1.3.7'],'transitive-deps',Object.keys(t.versions['1.3.7'].dependencies||{}).length,'; sqlite-vec-0.1.9',s.time['0.1.9'],s.license,'optional-platforms',Object.keys(s.versions['0.1.9'].optionalDependencies||{}).length))" && node -p "require('./packages/pi-agentic-workflow/node_modules/typebox/package.json').version"
```

**Sweep command (G3)** — deterministic keyword match over the candidate sources:

```text
grep -n "producers land as subcommands" docs/features/60-path-protection-guards/decisions.md && grep -n "exact version" AGENTS.md && grep -n "Vendored third-party code" AGENTS.md && grep -n "Root suites pass" AGENTS.md && grep -n "Runtime convention" AGENTS.md && grep -n "Never change a test" /home/agent/AGENTS.md && grep -n "F007 " docs/workflow/REPOSITORY_STATE.md && grep -n "U3 — dependency posture" docs/features/65-doc-toolchain/SPEC.md
```

## Prior-decisions contradiction sweep

Run at plan (2026-10-01) over the lane's candidate sources — this repo's
`AGENTS.md`, the operator `AGENTS.md`, the frozen Normalized Repository State,
the architectural-invariants contract, and `decisions.md` files — with
deterministic keyword matching (G3). Fixed shape, advisory only: a `contradicts`
hit against a frozen NRS fact routes to `resolve-repository-state`, any other
`contradicts` surfaces a `NEEDS-DECISION`; a miss never blocks a clean plan and
this sweep issues no verdict of its own. **8 candidate hits, all `compatible`,
0 `contradicts`.**

| claim | prior decision | source path | relation |
|---|---|---|---|
| The entry point is one `agentic-workflow doc` subcommand of the runner crate | “Producer vehicle rule: producers land as subcommands of `packages/agentic-workflow` (crate exists since row 37)” | `docs/features/60-path-protection-guards/decisions.md:37` | `compatible` |
| The crate gains two pinned dependencies (`typebox@1.3.7`, `sqlite-vec@0.1.9`) | “Every `dependencies`/`devDependencies` entry in both packages uses an **exact version** (no `^`, `~`, or major-only ranges)” | `AGENTS.md:377` | `compatible` |
| The libraries are installed, not copied into the tree | “Vendored third-party code carries its provenance … Vendoring is a real alternative to adding a dependency and it is weighed as one” | `AGENTS.md:57` | `compatible` |
| Tests are written red-first, every gate stays green, and no test is edited to make it pass | “Never change a test to pass it” / “Do tests before implementation with the expected behaviour and features” | `/home/agent/AGENTS.md:4` | `compatible` |
| Row 65 flips `defined → planned`; row 71 is created `defined` | F007 “Roadmap rows 01-27 are done. Feature 28 is planned from #146; feature 29 is planned from #149 and depends on 28.” (frozen) | `docs/workflow/REPOSITORY_STATE.md:28` | `compatible` |
| The gate stays the root suite plus the touched-package suites; the new discipline suites live in `scripts/` so they ride it | “Root suites pass: `node --test scripts/*.test.mjs`” | `AGENTS.md:253` | `compatible` |
| AC27's dual-runtime envelope rides bun-first manual invocation with the node fallback (the existing node-compat CI) | “Runtime convention (two scopes, one override): `AGENTIC_WORKFLOW_RUNTIME=bun\|node` … manual invocation of repo scripts runs bun-first, with the same command under node as the guaranteed fallback” | `AGENTS.md:266` | `compatible` |
| The crate README dependency claim is rewritten from the manifest at the docs step (TypeBox plus optional `sqlite-vec`) | D8 “the crate README claim moves from 'zero dependencies' to 'one pinned pure-JS dependency, no native deps, no build step'”; D9 “loadable + D8 criteria ⇒ `sqlite-vec`” | `docs/features/65-doc-toolchain/SPEC.md:356` | `compatible` |

Two documented misses, never blocking: `docs/workflow/WORKFLOW_INVARIANTS.md`
carries the generic evaluation contract with no project-specific rule this plan
touches, and this repo has no `docs/architecture/ARCHITECTURAL_INVARIANTS.md`.
The last row is the closest call and is surfaced rather than buried: D8's “no
native deps” sentence and D9's probe-conditional `sqlite-vec` are read together
— D9 post-dates D8's sentence and conditions `sqlite-vec` on exactly this probe
(G1, passed), and the docs step writes the README claim from the actual
manifest. If the owner reads D8's sentence as a blanket ban on a native
extension, that is a `NEEDS-DECISION` before the P6/P7 vector phases.

## Plan gate (phase-lint)

`bun scripts/phase-lint.mjs docs/features/65-doc-toolchain/SPEC.md`, exit 0:

```text
P1 Phase-lint: PASS (6/6) · fingerprint P1:unit-doc:1:runtime-floor-and-ignored-store-d7-s-booked-consequences
P2 Phase-lint: PASS (6/6) · fingerprint P2:unit-doc:1:doc-entry-point-grammar-and-envelope-contract-d2-d3-d8
P3 Phase-lint: PASS (6/6) · fingerprint P3:unit-doc:1:store-config-and-canonical-manifest
P4 Phase-lint: PASS (6/6) · fingerprint P4:unit-doc:1:incremental-sync-engine
P5 Phase-lint: PASS (6/6) · fingerprint P5:unit-doc:1:keyword-query-core
P6 Phase-lint: PASS (6/6) · fingerprint P6:unit-doc:1:embeddings-write-path
P7 Phase-lint: PASS (6/6) · fingerprint P7:unit-doc:1:hybrid-query-behind-judge-gate
P8 Phase-lint: PASS (6/6) · fingerprint P8:unit-doc:1:discovery-wiring-and-consent
P9 Phase-lint: PASS (6/6) · fingerprint P9:unit-doc:1:transversal-discipline-suites
P10 Phase-lint: PASS (6/6) · fingerprint P10:unit-doc:1:verification-at-head
verdict PASS
fingerprint: e026a3ed1d32e5d08e389d55f4484830c3db61360168585533fd5f54ca2ee53b
```

## Triaged steps

```text
TRIAGE — 65-doc-toolchain (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Skipped: none
Budget: strong
```

(`bun scripts/unit-route.mjs --triage 65-doc-toolchain`, exit 0 — this block is
the authoritative step list; the model never re-derives, reorders or invents
steps. The bare token `65` is ambiguous — it matches this folder and
`docs/fix/65-fold-findings-skill`, so the router exits 2 and prints no route;
the full slug is the correct token.)

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

2026-10-01 00:19 — unit doc created from `docs/features/_TEMPLATE/SPEC.md` for issue #192 (27 ACs carried from the issue, phase set P1–P13 lint-clean); roadmap row 65 flipped `idea → defined`; triage run on the full slug (bare `65` is ambiguous with `docs/fix/65-fold-findings-skill`) and its block pasted verbatim above; baseline gates green (root suite 599/0, `check-skill-context` PASS 28 skills, `phase-lint` verdict PASS) → working tree — next: research step (P1)

2026-10-01 00:24 — research step done (rows R1–R8): entry-point home confirmed (crate router, zero-dep charter), envelope-producer + `validateEnvelope` reuse for AC8, SQLite/FTS5 verified on **both** runtimes (node v24.21.0 + bun 1.4.3) against an `engines.node >= 18` floor, no `.agentic-workflow/` ignore rule yet (AC7 needs one), no remark/unified anywhere, session-log header fields stable; six uncertainties U1–U6 stated, none resolved → evidence: R rows above — next: design step (P2)

2026-10-01 00:33 — design step, answer-independent half done (rows D1–D5): design closure recorded (entities/roles/expectations vs AC1–AC27), single `doc` entry-point shape fixed (AC25 holds structurally), envelope + closed degradation vocabulary + exit codes fixed, store/config/manifest determinism surface fixed (AC12 runs over a canonical manifest export), fence-aware chunking + shared stable-ID function fixed; five decisions left open on purpose (D6: U1 split, U2 floor, U3 deps, P2 vector backend, U5 provider) and posed to the user with concrete options → evidence: D1–D5 — next: record D6–D10 from the answers, run `phase-lint`, commit the design step, proceed to plan (P3)

2026-10-01 00:47 — design step complete (rows D6–D10): all five user answers recorded — **U1 split** (half B + AC4 stay here, AC1–AC3/AC5–AC6 → follow-up `71-doc-cli`, created at plan), **U2** engines `node >= 24` + bun primary (`.node-version` bump booked for implement), **U3** library criteria recorded verbatim + TypeBox in / remark out, **P2** probe-first with JS-cosine fallback and provider-side rerank ruled out of scope (Non-goals), **U5** config-file + pi-style env precedence (CLI > env > config > default); U1–U5 marked resolved in Research uncertainties → evidence: `grep -c "^| D"` = 10 · `phase-lint` verdict PASS — next: plan step (P3): re-cut phases to the 22 kept ACs, create row/unit `71-doc-cli`, book D7 consequences and the D9 probe as plan-time gate

2026-10-01 — plan step (P3) complete: **Tasks re-cut** to the 22 kept ACs (AC4 + AC7–AC27) as P1–P10, smallest-first, one commit per phase, every AC mapped to a phase with a per-phase validator (docs and release stay catalog steps, deliberately not cut); roadmap row 65 flipped `defined → planned`; **roadmap row 71 `doc-cli` + unit doc created** (`docs/features/71-doc-cli/SPEC.md`: AC1–AC3/AC5–AC6 verbatim, triage block pasted, rough cut P1–P11 lint-clean, `Depends on: 65`, status `defined`); **D9 plan-time gate run** — `sqlite-vec` loadable under node 24.21.0 **and** bun 1.4.3 (G1), D8's criteria re-checked against the registry (G2); **prior-decisions contradiction sweep** — 8 candidate hits, all `compatible`, 0 `contradicts` (G3); `phase-lint` verdict PASS over P1–P10 (G4) → evidence: G1–G4 + the sweep table — next: implement step, P1 via `/execute-phase 65 P1`

2026-10-01 — implement P1 (D7's booked consequences): `.node-version` `v22.23.1 → v24.21.0`, crate `engines.node` `>=18 → >=24` (bun `>=1.4` kept), `.gitignore` rule `.agentic-workflow/index/` added before AC7 can assert a clean `git status`; FTS5 re-verified on **both** declared runtimes (node v24.21.0, bun 1.4.3 — validator exit 0); diff guard PASS (7 lines / 3 files, base = pre-phase ref; the `main`-based guard BREACHes at 767 lines only because it sweeps the not-yet-reviewed research/design/plan doc commits) → 7b2b6c16 — next: P2 via `/execute-phase 65 P2`

2026-10-01 — implement P2 (entry-point grammar + envelope contract, D2/D3/D8): red-first suite `test/doc.envelope.test.mjs` (38 tests) written and run red (`Cannot find module '../src/doc/grammar.mjs'`) before implementation; then `src/doc/grammar.mjs` (retrieval flag grammar, positional branch refused → unit 71), `src/doc/envelope.mjs` (canonical envelope `{ok, command, results[], degradations[], store}` in frozen key order, closed degradation vocabulary enforced at construction, TypeBox 1.3.7 validation — crate's first pinned dependency, bun.lock committed), `src/doc/retrieval.mjs` (P3–P5 op seam), `doc` case in the bin router (exit 0 success incl. degraded · 1 usage · single JSON doc under `--json-only`); gates: `bun run test` 130/0, `node --test` 131/0 → 1c00f78a — next: P3

2026-10-01 — **diff-guard exception, P2** (recorded per SKILL.md step 4): guard BREACH at 457 lines > 400 / 8 files = limit, base = pre-phase ref. Real count, no gaming: ~250 lines are the red-first test suite the phase demands and shrinking the diff by deleting tests/comments is forbidden. No honest split exists — grammar, envelope, bin wiring and the dependency adoption are one contract unit per plan P2, and a re-triage returns the same step list. Exception recorded; the phase stands. Next phases keep the test file growth in mind and split naturally (P3's manifest/config tests are separate from P4's sync-engine tests).

## Next

Implement step — `/execute-phase 65 P1` (runtime floor, `.gitignore` rule,
dual-runtime FTS5 re-verification), then P2…P10 in order; a conducted lane turn
runs the same phases as catalog steps. Roadmap row 65 is `planned`; row 71
`doc-cli` stays `defined` and waits for this unit to merge.

## Path protection (plan declaration)

The unit's test files, declared for the path-protection gate. Tests are authored
red-first per phase (the operator rule "do tests before implementation"), so the
regime stays pre-freeze for the whole unit — every protected modification
carries a per-phase `justification` record in `decisions.md`, never a silent edit.

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | packages/agentic-workflow/test/doc.*.test.mjs | the crate suites the phases author red-first (P2 envelope/grammar, P3 store/config/manifest, P4 sync, P5 query, P6 embeddings, P7 hybrid)
created | scripts/doc-*.test.mjs | the P9 transversal discipline suites (single entry point, never-authority, no build step) so they ride the root gate
not-created | fixtures/ trees for the crate suites | every suite builds its throwaway trees in-process (temp dirs + fixture strings), so a committed fixtures tree would duplicate state and drift (D-60-4 evaluate-and-justify)
```

## References

- Issue [#192](https://github.com/gtrabanco/agentic-workflow/issues/192) — the
  source of the ACs, non-goals, phases (P1 keyword → P2 hybrid → P3 wiring → P4
  documented non-goal) and the TypeBox rationale; `Closes #192` belongs to the
  follow-up `71-doc-cli` merge (D6) — this unit must not close it.
- Roadmap row 65 `doc-toolchain` (`docs/features/ROADMAP.md`) — status
  `idea → defined` at creation, `defined → planned` by this plan step.
- Roadmap row 71 `doc-cli` + `docs/features/71-doc-cli/SPEC.md` — the D6
  follow-up unit (half A), created by this plan step with `Depends on: 65`.
- Feature 61 / `packages/agentic-workflow` — the decided entry-point vehicle
  (roadmap row 61, `docs/features/61-adaptive-unit-lane/`).
- Feature 69 / issue #270 — "the hybrid retrieval index is #192's" (parked
  judging scope lands here).
- Engram #262 — boundary counterpart (memory vs corpus retrieval).
- `docs/workflow/LANE_FLOW.md`, `docs/workflow/FEATURE_WORKFLOW.md` — lane
  contract this unit runs under.
- `docs/workflow/GOLDEN_FIXTURE.md` — smoke-test procedure owed if this unit
  edits an executor-path skill (P3 wiring does).
