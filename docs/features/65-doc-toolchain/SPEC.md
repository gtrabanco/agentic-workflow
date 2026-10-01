---
type: feature
scope: large
---

# 65 — doc-toolchain

> One-line: Markdown stays the single source of truth — half A a deterministic
> `doc` CLI (section read, remark AST edit, derived structure index, TypeBox
> validation), half B a per-project retrieval index (FTS5 → hybrid) behind ONE
> entry point; both experimental and disposable, neither ever a decision
> authority.

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

Retrieval must not block on the AST-edit half: the plan step records the
split-vs-sequencing decision for the two halves (issue's sequencing note), never
silently interleaves them.

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
  dependency is a design decision recorded before any code is written.
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

## Tasks

Phase set cut for triage; the plan step re-cuts the final P-phase list with
per-phase layers/validators once design has fixed the shape.

- P1 — Research: map the runner crate's router and receipt conventions, the `workflow-status.mjs` envelope producer, SQLite availability under bun and under node, the `.gitignore`/config conventions, and the `docs/LOGS.md` entry heading fields. (validator: `bun scripts/unit-route.mjs --triage 65` exits 0 and rows R1+ exist in the Evidence section)
- P2 — Design: fix the single entry point's subcommand shape, the envelope and degradation contract, the store/config layout, section-boundary chunking with stable IDs, and the half A vs half B sequencing record. (validator: `grep -c "^| D" docs/features/65-doc-toolchain/SPEC.md` exits 0 with the design rows present)
- P3 — Plan: cut the final phase list with per-phase validators, map all 27 ACs to a phase, and run the lane's prior-decisions contradiction sweep. (validator: `bun scripts/phase-lint.mjs docs/features/65-doc-toolchain/SPEC.md` exits 0)
- P4 — Implement: retrieval P1 keyword core in the crate — entry point, envelope contract, manifest freshness, incremental sync, gitignored store and config. (validator: `bun run test` in `packages/agentic-workflow` exits 0)
- P5 — Implement: half A's `doc` CLI — section read, remark AST edit, derived structure index, TypeBox validation. (validator: `bun run test` in `packages/agentic-workflow` exits 0 with the roundtrip suite present)
- P6 — Implement: P2 hybrid behind the judge fixture — `sqlite-vec`, embeddings, RRF fusion. (validator: `bun run test` in `packages/agentic-workflow` exits 0 with the hybrid-vs-keyword delta row recorded)
- P7 — Implement: P3 wiring — discovery allowlist in `triage-issue`/`review-change`, `init-workspace` consent block, hooks, docs. (validator: `bun run test` in `packages/agentic-workflow` exits 0 and `bun scripts/check-skill-context.mjs` exits 0)
- P8 — Tests: full gate — root suite, crate suites under bun and under node, context budgets, the two discipline tests. (validator: `node --test scripts/*.test.mjs` exits 0)
- P9 — Evidence: one row per AC with the measured deltas and fixture outputs pasted. (validator: `grep -c "^| " docs/features/65-doc-toolchain/SPEC.md` exits 0 with 27+ rows)
- P10 — Review: run the review pack axes over the accumulated diff and classify every finding into the fixed decision table. (validator: `grep REVIEW-VERDICT docs/features/65-doc-toolchain/SPEC.md` exits 0)
- P11 — Docs: experimental labelling, workflow/replicate docs, consent docs, `CHANGELOG.md` rows, roadmap row update. (validator: `bun scripts/check-skill-context.mjs` exits 0 and `node scripts/check-changelog-row.mjs` exits 0)
- P12 — Release: package version bumps for the touched packages with their `CHANGELOG.md` rows, same PR. (validator: `bun scripts/npm-version-gate.mjs` exits 0)
- P13 — Verification: re-run every gate at head — root suite, both crate runtimes, context budgets, diff guard. (validator: `node --test scripts/*.test.mjs` exits 0)

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

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

## Next

Research step (P1) — the triaged block above is the authoritative step list.

## References

- Issue [#192](https://github.com/gtrabanco/agentic-workflow/issues/192) — the
  source of the ACs, non-goals, phases (P1 keyword → P2 hybrid → P3 wiring → P4
  documented non-goal) and the TypeBox rationale; `Closes #192` at merge.
- Roadmap row 65 `doc-toolchain` (`docs/features/ROADMAP.md`) — status
  `idea → defined` by this invocation.
- Feature 61 / `packages/agentic-workflow` — the decided entry-point vehicle
  (roadmap row 61, `docs/features/61-adaptive-unit-lane/`).
- Feature 69 / issue #270 — "the hybrid retrieval index is #192's" (parked
  judging scope lands here).
- Engram #262 — boundary counterpart (memory vs corpus retrieval).
- `docs/workflow/LANE_FLOW.md`, `docs/workflow/FEATURE_WORKFLOW.md` — lane
  contract this unit runs under.
- `docs/workflow/GOLDEN_FIXTURE.md` — smoke-test procedure owed if this unit
  edits an executor-path skill (P3 wiring does).
