---
# type: fix | scope: medium | ac-hash: written after the ## Acceptance criteria section is frozen
---

# fix/443-doc-index-auto-hybrid

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change.

## Issue

`#443` — "doc index: auto-hybrid queries, sync-time embedding with backoff, and
/aw-index native command". The PR closes it via `Closes #443` in the body.

Lane: the triage comment of 2026-11-08 returned **fix-now (M)** and routed the
issue to `/unit-lane --fix 443` (`docs/ROADMAP.md` `## Features` row 443 stays
the feature-level registration; the carrier named by that triage and by the
session log of 2026-11-08 is this folder, per the roadmap rule "carried by fix
#N when the unit ran through the fix lane — its carrier is then
`docs/fix/<issue-number>-<topic>/`, never a feature folder").

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #443

**S2 — Auto-hybrid in the CLI (owner decision 1).**
> **Auto-hybrid in the CLI.** When the provider is configured AND the store has
> chunks embedded with the pinned model, `--query` runs hybrid; otherwise
> keyword with the declared degradation (`unavailable-embeddings-not-configured`
> / `unavailable-embeddings-provider-down` / `embeddings-model-mismatch` /
> `unavailable-embeddings-not-indexed`). An explicit `--mode` flag always wins.
> The calling skills (`triage-issue`, `review-change`) drop the flag entirely and
> stop reasoning about modes.

**S3 — `--sync` embeds pending chunks by default, with retry/backoff/pacing (owner decision 2).**
> **`--sync` embeds pending chunks by default** (when a provider is
> configured), with retry/backoff/pacing at the provider's rate limits. The
> consent-installed freshness hooks (post-merge/post-checkout/post-rewrite)
> inherit the fix; a warm store makes 0 API calls (AC19 bound unchanged).

**S4 — The query path stays read-only (owner decision 3).**
> **The query path stays read-only.** `ensureFresh`'s inline sync keeps chunking
> new/changed files (keyword finds them immediately) but never calls the
> embeddings API. Vectors catch up on the next explicit sync (hook, `/aw-index`,
> or `doc --sync`). A query never pays write latency or API cost.

**S5 — `/aw-index` is code, not a skill (owner decision 4).**
> **`/aw-index` is code, not a skill.** Native command registered by the pi
> package extension, same vehicle as `/advance` (feature 62,
> `conductor-command.ts` + `CommandRegistrar`): it runs a **progressive,
> idempotent** sync (resumable by pending chunks — never re-embeds what is
> already embedded) and prints a report: pending count, pinned model, last sync
> (`files_scanned/changed/deleted`, `embedded`), degradations. No `SKILL.md`, no
> argument-hint, no context budget, no `skills add` surface. Rebuild stays a
> manual `doc --rebuild` (out of the command).

**S6 — Backfill of the current store approved (owner decision 5).**
> **Backfill of the current store approved** (~2.6M embedding tokens, ~172 paced
> batches) once the retry fix lands.

**S7 — Open WebUI is out of scope (owner decision 6).**
> **Open WebUI is out of scope** (stuck `pending` files there are a
> container-side problem, not the runner's).

**S8 — Scope of changes.**
> - `packages/agentic-workflow/src/doc/`: mode resolution moves from grammar to
>   query time (runtime resolution, explicit flag wins); `embedPendingChunks`
>   gains retry/backoff/pacing and completes the pinned-model meta write; sync
>   path embeds by default when configured.
> - `packages/pi-agentic-workflow/src/extension/`: new native `aw-index` command
>   (spawn the runner crate, render the report).
> - `skills/triage-issue/SKILL.md`, `skills/review-change/SKILL.md`: drop the
>   mode flag from their retrieval-aid invocations.
> - Docs: crate README grammar block, the `docs`/`SKILLS.md` narrative rows (no
>   new skill row — it is not a skill), CHANGELOG via changeset.

**S9 — Acceptance (proposed).**
> - Auto-hybrid: with a configured provider and a fully-embedded store, a query
>   whose wording shares no terms with the target document returns it (the
>   feature-65 AC15 judge fixture holds through the new default path); each
>   degraded shape returns the exact declared degradation; explicit `--mode
>   keyword` still forces keyword.
> - Sync resilience: a mock provider that 429s every 20th batch still completes
>   the run; the final state is all-chunks-embedded with `meta.emb_model`
>   written; a second run makes 0 API calls (AC19).
> - Progressive/idempotent: killing a sync mid-run and re-running embeds only
>   the remainder; already-embedded chunks are never re-sent (asserted via mock
>   call count, AC16 unchanged).
> - `/aw-index`: registered by the extension without any SKILL.md; report
>   renders from the envelope's frozen fields only; safe when no store exists
>   (creates it via sync).
> - Offline re-wording: feature-65's AC13 is re-stated in the unit doc — with no
>   provider configured everything stays 100% offline; with one configured, a
>   query makes exactly 1 network call (query embedding, ~7 tokens) and still
>   degrades with the cause declared when the provider is down.

**S10 — Known constraints for the implementer.**
> - Pinned tests assert the `keyword` default (`grammar.mjs` + suites): this
>   change edits frozen tests — needs a `path-protection-plan@1` declaration and
>   `justification` rows, never a quiet relaxation.
> - The degradation vocabulary (D3) and the envelope shape are frozen: nothing
>   here adds a value to either.
> - Provider rate limits are configurable in practice: pacing parameters must
>   come from config/env, not hardcoded NaN numbers.

**Decision D1 (recorded at cut, cited by S2's implementation and O1–O4).** "The
store has chunks embedded with the pinned model" resolves to a five-branch probe
evaluated **after** `ensureFresh` (so the answer describes the store the query
actually reads), in this order: provider not configured → keyword +
`unavailable-embeddings-not-configured`; no pinned model (`meta.emb_model`
absent) → keyword + `unavailable-embeddings-not-indexed`; pinned model ≠
provider model → keyword + `embeddings-model-mismatch`; zero embedded rows →
keyword + `unavailable-embeddings-not-indexed`; any row embedded under a foreign
model → keyword + `embeddings-model-mismatch`; otherwise hybrid. A **partially**
embedded store is exactly S2's case ("has chunks embedded") and runs hybrid —
keyword covers the unembedded remainder, and the run is still degradation-free.
The three shapes S2 lists plus `unavailable-embeddings-provider-down` (S9's
offline re-wording) are the only degradations the auto path can declare.

**Decision D2 (recorded at cut, cited by O4 and O21).** "The mode flag leaves the
grammar" means the grammar stops *defaulting* `--mode` to `keyword`; the flag
itself stays (`[--mode keyword|hybrid]` in the usage line, S10's "explicit
`--mode keyword` still forces keyword", S2's "an explicit `--mode` flag always
wins"). `parseDocArgs` therefore answers `mode: undefined` when the flag is
absent, and `runDocOp` forwards the absence so `queryIndex` resolves at runtime.
An explicit `--mode keyword` is **not** a degradation (nothing was attempted);
an explicit `--mode hybrid` keeps the shipped degradation set unchanged.

**Decision D3 (recorded at cut, cited by O14 and the `/aw-index` report).** S5's
report needs the pending count and the pinned model, and S9 says the report
"renders from the envelope's frozen fields only". The frozen surface is the top
level key order (`ok,command,results,degradations,store`) plus the closed
degradation vocabulary; `store` is declared as an **open** record
(`Type.Record(Type.String(), Type.Unknown())`, `envelope.mjs`). The two values
are therefore added **inside `store`** on the `sync` command
(`store.pending`, `store.model`): no top-level key, no degradation value, and the
`lastSync` key set stays exactly the four it already publishes (pinned by
`doc.hybrid.test.mjs`). `store.pending` is the count of chunks still lacking a
vector **after** the pass (S5's progress signal), `store.model` the store's
pinned model (null when nothing is pinned).

**Decision D4 (recorded at cut, cited by O6 and O9).** The pacing parameters are
one config/env surface with declared defaults, read where the provider config is
read: `.agentic-workflow/index.json` `provider.pacing` =
`{batchSize, requestsPerMinute, maxAttempts, baseDelayMs, maxDelayMs}`, each
overridable by `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_<PARAM>` for an operator and by
the `cli` seam for a caller; defaults are the provider's published limits
(`batchSize: 32`, `requestsPerMinute: 60`, `maxAttempts: 3`,
`baseDelayMs: 1000`, `maxDelayMs: 60000`). A non-positive, non-integer or
unparseable value is a usage/IO error (exit 1 territory) naming the parameter —
never a silent NaN that would pace at zero. S10's "not hardcoded NaN numbers" is
read literally: every number the pacing loop uses is resolved once, validated,
and carried in the pacing object.

**Decision D5 (recorded at cut, cited by O5, O8 and O10).** "Resumable by pending
chunks" is the store's own `embedding is null` predicate: each successfully
returned batch commits its rows before the next request starts, so a killed run
loses at most one in-flight request and the re-run's pending set is exactly the
remainder. The pinned-model meta write moves to the **first landed batch** (and
still happens on a zero-pending pass), so a pass that exhausts its retries after
some batches keep a store whose pin names the model that produced the vectors —
the "38 % embedded, `meta.emb_model` never written" state cannot recur.

**Decision D6 (recorded at cut, cited by O12 and O13).** The native command
spawns the runner crate's own bin (`@gtrabanco/agentic-workflow/bin/agentic-workflow.mjs`,
resolved from the pi package's dependency — the vehicle `workflow-tools.ts`
already uses for the schema package's JSON) with `doc --sync --json-only` and
renders the report from that envelope. Rebuild is **not** reachable from the
command (S5's "out of the command"); the command never writes a byte itself.

**Decision D7 (recorded at cut, cited by O22 and `## Non-goals`).** S6's backfill
is an **owner operational step after merge**, not a code change: it needs the
live provider credential and spends ~2.6M embedding tokens. This unit never runs
it — §4's live-tree guard forbids the mutating path against the live repository,
and the repository's committed `.agentic-workflow/index.json` does configure a
live provider, so a `doc --sync` here would spend real money. The change makes
the backfill *possible*; O5/O8 measure that with a throttled mock.

## Impact

- **The retrieval CLI's contract:** `doc --query` without `--mode` changes from
  "always keyword, no degradation" to "auto, with the declared cause when
  hybrid is unavailable". Every current caller (the two skills' retrieval aid,
  a hook's `doc --sync`) reads the envelope and ignores `degradations[]`, so the
  change is additive for them — but the envelope's `degradations[]` is no longer
  empty on the default path, which is precisely what S2 asks for.
- **The store's write path:** `--sync` gains pacing, retry and an earlier meta
  pin. A store that today aborts on the first 429 and stays unpinned will instead
  complete; a partially embedded store stops being a terminal state.
- **The pi package's command surface:** one more native command name. Three
  suites pin the registered name set exactly (`alias-coverage.test.mjs` at
  three sites, `log-session-command.test.mjs` once) and are updated to the new
  exact set — an expansion of the pin, never a relaxation (S10, D2, O21).
- **Consumers of the sync envelope:** `store.pending`/`store.model` are additive
  inside the open record (D3); the quality gates that read `store.lastSync` keep
  the four-key set.
- **Nothing live is touched:** the repo's committed config names a live provider
  and `NAN_API_KEY` is present in the environment, so every mutating run in this
  unit happens in a `mktemp -d` scratch tree (§4 live-tree guard, PE-011).

## Retirements

- The grammar's `mode = "keyword"` default is retired; its replacement is
  runtime resolution in `query.mjs` (D2). No-consumer check on the retired token:
  `rg -n 'mode = "keyword"' packages/` → 0 after the change.
- The throwaway `embeddings provider <status>` string without a machine-readable
  status is retired by a `status` field on that error plus `retryable`, because
  the retry policy must branch on the status, never on message text.
- Nothing else is removed: the degradation vocabulary (S10) and the envelope's
  top-level shape stay exactly as published.

## Non-goals

- No rebuild from `/aw-index` (S5: "Rebuild stays a manual `doc --rebuild`").
- No backfill executed by this unit (S6 + D7: owner operational step).
- No Open WebUI work (S7).
- No new degradation value, no new top-level envelope key, no new skill, no
  `argument-hint`, no context-budget entry (S5, S10).
- No change to the chunker's version or to the canonical manifest export (the
  scanner produces identical chunks; only the write path's resilience changes).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

Verdict (`bun scripts/ceremony.mjs tier classify --paths …` over this unit's
production and test paths at the cut head):

```json
{"contract":"risk-tier-verdict@1","tier":"standard","reason":"1 path(s) carry executable content: packages/agentic-workflow/src/doc/grammar.mjs","reason_kind":"executable-content","task_size":{"understood":true,"contained_risk":"contained","resumable_from_diff":true,"ceremony":"unit-doc","verification":"gates"},"signals":[]}
```

## Future

none

## Future cost

- The pacing surface is now a committed decision surface
  (`provider.pacing` + five env overrides): changing a default is a contract
  change, and every element must keep a validated default so no loop can pace on
  NaN (D4).
- `store.pending`/`store.model` are additive now; a future consumer must not
  assume they exist on a `query`/`status` envelope — they are declared on
  `sync` only (D3).
- A partially embedded store stays a legal state (hybrid over the embedded
  subset). Anything that later claims "fully embedded" must read `store.pending`
  instead of `meta.emb_model`.

## Applicable tests

`cd packages/agentic-workflow && bun test test/doc` (the eleven retrieval
suites, red first per §2/§6), `cd packages/pi-agentic-workflow && bun run test`
(the extension suites, including the new `test/aw-index-command.test.mjs`),
`bun test scripts/doc-discipline.test.mjs` (the retrieval discipline pins),
`bun test scripts/normative-drift.test.mjs`, `bun scripts/check-skill-context.mjs`,
`bun packages/agentic-workflow/bin/path-guard.mjs --unit docs/fix/443-doc-index-auto-hybrid --phase P2`,
and the root gate (`bun scripts/local-gate.mjs`) before handoff.

## Known pre-existing issues

- `worktree-guard` reports three STALE worktrees: `feat-284-unattended-durability`,
  `feat-408-mechanization-inventory` (both other sessions' leftovers, dirty) and
  this unit's own branch **before its first commit**. Does-not-affect: this
  unit's changes — the third finding disappears once P1 commits, the two others
  are not this unit's to remove. Basis: `bun scripts/worktree-guard.mjs` at the
  cut head.
- `packages/pi-agentic-workflow` suite: 2 pre-existing failures in
  `conductor-sensor.test.mjs` AC3 ("valid envelope → ok with envelope" and
  "…with merge_ready"): the suite's `makeValidEnv()` fixture predates fields the
  schema package now requires, so `validateEnvelope` refuses it. Does-not-affect:
  this unit (no sensor or schema change); reproduced identically on the base
  tree — evidence in the Log (E-base).
- The worktree convention (`.git/worktrees/<dir>`) leaks the git-dir internals
  (`HEAD`, `index`, `logs/`, `refs/`, `commondir`, `gitdir`, `ORIG_HEAD` at the
  worktree root) as untracked junk. Does-not-affect: this unit's commits (every
  `git add` names paths explicitly); reported, not cleaned by this unit.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers are frozen at cut (this document, `planning-evidence.md`,
  `planning-obligations.md`, `decisions.md`), no repo review/fold machinery ran,
  and the work lands as work-unit conventional commits. Check:
  `git log --oneline main..HEAD` shows the unit's own conventional commits and
  `ls docs/fix/443-doc-index-auto-hybrid/` lists the four documents.
- **AC-S2** — With a configured provider and a store embedded under the pinned
  model, a query carrying no `--mode` runs the hybrid pass (the feature-65 AC15
  judge fixture: keyword alone returns nothing, auto returns `retry.md` first
  with `degradations: []`); each unavailable shape returns its exact declared
  degradation; an explicit `--mode` always wins. Check: the `S2` blocks of
  `doc.hybrid.test.mjs` exit 0.
- **AC-S3** — `--sync` embeds pending chunks by default and survives a 429 on
  every 20th batch: the final state is all-chunks-embedded with
  `meta.emb_model` written, and a second run makes 0 API calls. Check: the `S3`
  blocks of `doc.embeddings.test.mjs` exit 0.
- **AC-S4** — The query path is read-only: a stale store queried in hybrid mode
  makes exactly one provider call (the query embedding) and the newly chunked,
  unembedded rows stay unembedded. Check: the `S4` block of
  `doc.hybrid.test.mjs` exits 0.
- **AC-S5** — `/aw-index` is registered by the extension with no `SKILL.md`,
  renders pending count, pinned model, the four `lastSync` counts and the
  degradations from the sync envelope alone, and is safe with no store. Check:
  `cd packages/pi-agentic-workflow && bun test test/aw-index-command.test.mjs`
  exits 0 and `rg -l 'aw-index' skills/` → no match.
- **AC-S6** — The backfill is not run by this unit and is recorded as the
  owner's operational step with the reason. Check: `rg -n 'doc --sync' docs/fix/443-doc-index-auto-hybrid/SPEC.md`
  shows the D7 decision and `git status` shows no store mutation by this unit.
- **AC-S7** — Open WebUI stays out: no code, doc or test in the change names it
  beyond this declaration. Check: `rg -n 'open-webui|OpenWebUI' packages/ scripts/ skills/`
  → no match.
- **AC-S8** — The declared surfaces move together: the crate README grammar
  documents the auto default, the pacing surface and the two new `store` fields;
  the pi README carries the command; `skills/` carries no mode flag; the
  changeset names the three packages. Check:
  `bun scripts/check-skill-context.mjs` exits 0, `rg -n -- '--mode' skills/`
  → no match, and the changeset file lists the three package names.
- **AC-S9** — The four acceptance bullets hold as tests: auto-hybrid's degraded
  shapes, sync resilience, progressive/idempotent resume (mock call count), the
  `/aw-index` no-store case, and the offline re-wording (0 network calls with no
  provider; exactly 1 with one; provider down degrades with the cause). Check:
  the `S9` blocks of both suites exit 0.
- **AC-S10** — The three constraints hold: the frozen tests carry a
  `path-protection-plan@1` declaration plus `justification` rows and the guard
  passes; `DOC_COMMANDS`, the degradation vocabulary and the envelope key order
  are byte-identical; every pacing number resolves from config/env with a
  validated default. Check: `bun packages/agentic-workflow/bin/path-guard.mjs
  --unit docs/fix/443-doc-index-auto-hybrid --phase P2` prints
  `PATH-GUARD pass`, `doc.envelope.test.mjs` exits 0, and the pacing tests exit 0.

## Tasks

- P1 — Freeze the planning ledgers and register the unit: this document, the two
  M-size ledgers, `decisions.md` with the `path-protection-plan@1` declaration
  and the `path-protection-records@1` justification rows, and the roadmap
  `## Fixes` row (validator: `ls docs/fix/443-doc-index-auto-hybrid/` lists the
  four documents and `bun scripts/roadmap-settle.mjs` exits 0)
  (Implements: S1, S10)
  Relevant files: docs/fix/443-doc-index-auto-hybrid/, docs/ROADMAP.md
- P2 — RED corpus, committed alone and observed failing before any
  implementation: one failing test per S2–S5 rule plus the updated exact-set
  command pins (validator: `cd packages/agentic-workflow && bun test test/doc`
  and `cd packages/pi-agentic-workflow && bun test test/aw-index-command.test.mjs`
  exit non-zero on the new cases)
  (Implements: S2, S3, S4, S5, S9, S10)
  Relevant files: packages/agentic-workflow/test/doc.hybrid.test.mjs,
  packages/agentic-workflow/test/doc.embeddings.test.mjs,
  packages/pi-agentic-workflow/test/aw-index-command.test.mjs,
  packages/pi-agentic-workflow/test/alias-coverage.test.mjs,
  packages/pi-agentic-workflow/test/log-session-command.test.mjs
- P3 — Query-time mode resolution: grammar's `keyword` default removed (D2),
  the five-branch auto probe with its declared degradations (D1), `store.pending`
  / `store.model` on the sync envelope (D3) and `embeddingStats` (validator:
  `cd packages/agentic-workflow && bun test test/doc` exits 0)
  (Implements: S2, S4, S8, S9, S10)
  Relevant files: packages/agentic-workflow/src/doc/grammar.mjs,
  packages/agentic-workflow/src/doc/query.mjs,
  packages/agentic-workflow/src/doc/retrieval.mjs,
  packages/agentic-workflow/src/doc/embeddings.mjs,
  packages/agentic-workflow/src/doc/config.mjs
- P4 — Embeddings resilience: batch cap + pacing + retry/backoff/`Retry-After`
  with the validated pacing surface (D4), the first-landed-batch meta pin (D5),
  a machine-readable provider error status (validator:
  `cd packages/agentic-workflow && bun test test/doc` exits 0)
  (Implements: S3, S9, S10)
  Relevant files: packages/agentic-workflow/src/doc/embeddings.mjs,
  packages/agentic-workflow/src/doc/retrieval.mjs
- P5 — The native `/aw-index` command: the name constant, the module (spawn the
  runner crate, render from the envelope only, D6), registration beside
  `/advance` in `factory.ts`, and the exact-set pins (validator:
  `cd packages/pi-agentic-workflow && bun run test` exits 0 except the two
  pre-existing `conductor-sensor` failures)
  (Implements: S5, S8, S9)
  Relevant files: packages/pi-agentic-workflow/src/extension/aw-index-command.ts,
  packages/pi-agentic-workflow/src/extension/factory.ts,
  packages/pi-agentic-workflow/src/routing/types.ts,
  packages/pi-agentic-workflow/README.md
- P6 — Docs and state ship in the change: crate README grammar block (auto
  default, pacing surface, `store.pending`/`store.model`, the command's report),
  root README, `docs/CAPABILITIES.md`, `docs/workflow/SKILLS.md` currency (no new
  skill row — S5), roadmap `## Fixes` row status, changeset intent,
  `docs/LOGS.md` session entry (validator:
  `bun scripts/check-skill-context.mjs` exits 0 and
  `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S1, S5, S8, S10)
  Relevant files: packages/agentic-workflow/README.md, README.md,
  docs/CAPABILITIES.md, docs/workflow/SKILLS.md, docs/ROADMAP.md, .changeset/,
  docs/LOGS.md
- P7 — Verification: the declared gates in the foreground, the differential
  check base-vs-change on an identical fixture, the obligations ledger closed,
  the failed/skipped checks reported honestly (validator:
  `bun scripts/local-gate.mjs` exits 0, or the pre-existing reds named with
  base-vs-head evidence)
  (Implements: S1, S6, S7, S9)

### Planning evidence

M/L unit: the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md) — one row per Engineering claim.

### Obligations

M/L unit: the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md) — one row per normative
behaviour, compatibility invariant, affected use case, and required failure
state.

## Path protection

The plan declares the protected set this unit authors (S10: the frozen tests are
edited with `justification` rows, never a quiet relaxation). The records live in
this folder's [`decisions.md`](decisions.md).

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
created | packages/pi-agentic-workflow/test/aw-index-command.test.mjs | the new native command's suite; no existing suite owns /aw-index
not-created | packages/agentic-workflow/test/doc.embeddings.test.mjs | the resilience cases extend the write-path suite that owns embeddings
not-created | packages/agentic-workflow/test/doc.hybrid.test.mjs | the auto-mode and read-only cases extend the suite that owns mode/degradation semantics
```

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this surgery
(workflow §4).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #443
  ```
- **L2** — 2026-11-09, the issue, verbatim (title + the normative sections;
  full text in the forge):
  ```
  doc index: auto-hybrid queries, sync-time embedding with backoff, and /aw-index native command
  ## Background
  - The retrieval index (feature 65) embedded 3,442 of 8,941 chunks once
    (1,610,728 embedding tokens / 302 requests on 2026-11-06) and no query ever
    used the vectors again — zero embedding calls between indexing day and now.
  - Root causes, both verified in code:
    1. `doc --query` defaults to keyword (`src/doc/grammar.mjs` pins `mode =
       "keyword"`); no skill passes `--mode hybrid`, so the write path pays for
       vectors the read path never uses.
    2. `embedPendingChunks` (`src/doc/embeddings.mjs`) has no retry/backoff/pacing
       — one 429 aborts the whole pass, and the consent-installed hooks run
       `doc --sync --quiet ... || true`, swallowing the failure silently.
  ## Owner decisions (recorded 2026-11-07)   [quoted as S2–S7]
  ## Scope of changes                        [quoted as S8]
  ## Acceptance (proposed)                   [quoted as S9]
  ## Known constraints for the implementer   [quoted as S10]
  ## Dependencies
  | Related (soft) | #429 | Same vehicle (pi package native commands) … Not a blocker |
  No hard blockers: feature 65 (`doc` index, PR #282) is merged.
  ```
- **D1** — 2026-11-09, owner-workflow interpretation (authority: S2 + S9): the
  auto probe's five branches and the partial-store case. See Decision D1.
- **D2** — 2026-11-09, owner-workflow interpretation (authority: S2 + S10): the
  grammar stops *defaulting* the mode, it does not lose the flag. See Decision D2.
- **D3** — 2026-11-09, owner-workflow interpretation (authority: S5 + S9 + S10):
  `store.pending`/`store.model` are additive inside the open `store` record. See
  Decision D3.
- **D4** — 2026-11-09, owner-workflow interpretation (authority: S10): the pacing
  surface and its validated defaults. See Decision D4.
- **D5** — 2026-11-09, owner-workflow interpretation (authority: S3 + S5): the
  resume predicate and the first-landed-batch pin. See Decision D5.
- **D6** — 2026-11-09, owner-workflow interpretation (authority: S5): the command
  spawns the runner crate and renders from the envelope; no rebuild. See D6.
- **D7** — 2026-11-09, owner-workflow interpretation (authority: S6 + workflow
  §4): the backfill is the owner's post-merge operational step. See D7.
- **E-base** — 2026-11-09, baseline at the cut head (`1fa39fe1` plus the merge
  state of `feat/443-doc-index`, which carries no commit of its own):
  `cd packages/agentic-workflow && bun test test/doc` · exit 0 · 216 pass;
  `cd packages/pi-agentic-workflow && bun run test` · exit 1 · 709 pass / 2 fail
  (`conductor-sensor.test.mjs` AC3 ×2 — reproduced on the base tree);
  `bun scripts/worktree-guard.mjs` · exit 1 · 3 STALE findings (two other
  sessions' worktrees + this branch before its first commit);
  `bun scripts/ceremony.mjs tier classify` · `standard` ·
  `task_size.understood=true`.
- **P1** — 2026-11-09, planning ledgers frozen (this document, the two M-size
  ledgers and `decisions.md` with the path-protection plan + records) and the
  unit registered: the Features row moved to `in-progress · carried by fix #443`
  through the crate's `roadmap rowUpsert` writer, the `## Fixes` row added by
  hand because that four-column table has no emitter (unit 460's PE-007) ·
  commit `9d368ede`.
- **P2** — 2026-11-09, RED corpus committed alone, observed failing (E2) ·
  commit `0257894c`. The commit was **amended once, unpushed and
  agent-authored**, to include the two query-object pins and the two
  `doc.query` degradation pins the full-suite run exposed (the first pass had
  run only the two suites the change names); the amend is disclosed here rather
  than left implicit.
- **E2** — 2026-11-09, RED observed at `0257894c` with the implementation stashed
  (the base sources, the new tests): `bun test --timeout 30000 test/doc` · exit 1
  · 198 pass / 15 fail — the grammar default, the four auto-resolution
  degradations, the read-only query path, the two sync-envelope fields, the
  pacing import (`Export named 'resolvePacing' not found`) and the five
  grammar/degradation pins; `bun test test/aw-index-command.test.mjs` · exit 1 ·
  `Cannot find module '../dist/extension/aw-index-command.js'`.
- **P4** — 2026-11-09, embeddings resilience: pacing resolution, batch cap,
  retry/backoff/`Retry-After`, the first-landed-batch pin and `embeddingStats` ·
  commit `71df5627`. Committed **before** P3 because P3 consumes
  `embeddingStats` — dependency-topological order, per §5's task ordering.
- **P3** — 2026-11-09, query-time mode resolution, the declared auto
  degradations, the read-only query path and the sync envelope's
  `pending`/`model` · commit `b1f5dc4d`.
- **E3** — 2026-11-09, GREEN at `b1f5dc4d`: `cd packages/agentic-workflow && bun
  test --timeout 30000 test/doc.hybrid.test.mjs test/doc.embeddings.test.mjs` ·
  exit 0 · 49 pass. Full crate suite at the final head: `bun test --timeout
  30000 test/` · exit 1 · 569 pass / 3 fail — all three pre-existing and identical on the base
  clone (`box2 phase-lint green`, `the box2 phase-lint clause is read-only`, the
  `unit-doc create --json` CLI smoke), because the harness spawns `node`, which
  this environment does not have (E7).
- **P5** — 2026-11-09, the native `/aw-index` command (the name constant, the
  module, registration beside `/advance`, the four exact-set pins) · commit
  `591a2806`.
- **E4** — 2026-11-09, GREEN at `591a2806`: `cd packages/pi-agentic-workflow &&
  bun run test` · exit 1 · 717 pass / 2 fail — the same two pre-existing
  `conductor-sensor.test.mjs` AC3 failures as the base (709 pass / 2 fail), and
  8 new passing cases from `aw-index-command.test.mjs` plus the four expanded
  command-set pins.
- **E5** — 2026-11-09, `bun packages/agentic-workflow/bin/path-guard.mjs --unit
  docs/fix/443-doc-index-auto-hybrid --phase P2 --base 1fa39fe1` · exit 0 ·
  `PATH-GUARD pass — justified`, `checked: 36`, `DEGRADED — missing-config:
  shipped defaults in force` (the repository carries no committed
  `path-policy.json`, so the shipped policy applies).
- **E6** — 2026-11-09, differential (O19) in two `mktemp -d` scratch trees
  (removed after): the base commit's entry point vs the change, on identical
  fixtures, for `doc --sync/--status/--query/--query --mode keyword/--query
  --mode hybrid/--mode quantum/--rebuild`, `doc read` (whole file, a resolved
  section, `NO_MATCH`), `doc index` and `section locate`. Every run is
  byte-identical after normalizing the fixture root **except** the two declared
  deltas: `sync` gains `store.pending`/`store.model`, and the default `query`
  gains `degradations: ["unavailable-embeddings-not-configured"]`. Exit codes
  identical throughout.
- **E7** — 2026-11-09, root gate base vs head: `bun scripts/run-root-suite.mjs`
  · exit 1 on both · 16 failing suites on the base clone (`/tmp/aw443-base2` at
  `1fa39fe1`) and the **identical 16** on this head (`diff` of the two FAIL
  lists is empty). Cause is environmental: those harnesses spawn `node`
  (`execFileSync("node", …)`, e.g. `scripts/ceremony/testing.mjs:34`) and this
  container has no `node` binary (`which node` → nothing).
- **E8** — 2026-11-09, runtime legs: `cd packages/agentic-workflow && bun run
  test:node` · exit 1 · `Missing script to execute` (no `node` on PATH) —
  identical on the base clone; the same absence is why `schema-node-compat`,
  `pi-node-compat`, `crate-suite-node` and `pi-compat-guard` cannot pass here.
- **E9** — 2026-11-09, the touched-surface gates run alone: `bun
  scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS`
  (changeset route accepted for `@gtrabanco/pi-agentic-workflow`); `bun
  packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` ·
  exit 0 · `checked: 2, refusals: []`; `bun scripts/log-immutability.mjs` ·
  exit 0 · `0 violations`, base `1fa39fe1`; `bun scripts/temp-hygiene.mjs` ·
  exit 0 · `0 finding(s)`; `bun scripts/tmp-gc.mjs` · exit 0 · `0 candidate(s)`;
  `bun scripts/worktree-guard.mjs` · exit 0 · `0 finding(s)` (it failed at the
  cut only because this branch had no commit yet); `bun
  scripts/docs-generate.mjs --check` · exit 0 · `0 stale` after the renderer was
  run (`bun scripts/docs-generate.mjs` → `1 written`).
- **E10** — 2026-11-09, documentation gates: `bun scripts/check-skill-context.mjs`
  · exit 0 · `PASS context budgets: 29 skills`; `bun test --timeout 30000
  scripts/normative-drift.test.mjs scripts/doc-discipline.test.mjs` · exit 0 ·
  42 pass.
- **E11** — 2026-11-09, `rg -n -- '--mode (keyword|hybrid)' skills/` · exit 1 ·
  no match (the only `--mode` in `skills/` is `degit`'s `--mode=git` in
  `init-workspace`'s bootstrap reference, unrelated to the doc CLI). The calling
  skills needed no edit: they never passed the flag, which is exactly why the
  read path never used the vectors.
- **P6** — 2026-11-09, docs and state: the crate README's `doc` section (the
  `doc-retrieval@1` grammar block: mode resolution, pacing, retry, resume, pin,
  the sync report and the closed degradation set) and its command-table row, the
  pi README's code-door table + `The /aw-index command` section, the root
  README's retrieval paragraph, `docs/CAPABILITIES.md`'s Search row, the
  changeset intent, the regenerated `docs/generated/units.md` and the completed
  frozen pins · commit <this commit>.
- **G1** — 2026-11-09, final gate at this head: `bun scripts/local-gate.mjs
  --no-bail` · exit 1 · 17 steps: `workspace-install`, `schema-build` and
  `crate-suite-bun` (152 s) exit 0; every other step exits 1 **before running its
  check** because the gate invokes `node` and this container has no `node` binary
  (nine `local-gate: could not run node: Executable not found in $PATH: "node"`
  lines, then `exit 1 in 0s` for `version-parity-content`,
  `docs-generated-projection`, `log-immutability`, `temp-hygiene`, `tmp-gc`,
  `worktree-guard`, `journal-carrier-check`, `crate-suite-node`, `root-suite`,
  `pi-node-compat`), plus the three steps that need the registry
  (`dependency-pin-gate`, `dependency-advisories`, `pi-compat-guard`). Run
  directly under bun, each offline step passes: E9 and E10. The two node runtime
  legs cannot run here at all (E8), and the root suite's red set is identical to
  the base clone's (E7). O18 is therefore recorded as verified **with the
  pre-existing environment red shown on the base tree**, never as a green gate.

## Next

The handoff to the owner (external verifier): the diff summary, the obligations
ledger state, the verification block and every failed/skipped check. No PR is
opened and nothing is merged by this unit.

## References

- Issue [#443](https://github.com/gtrabanco/agentic-workflow/issues/443) — the
  request; the triage comment of 2026-11-08 returned fix-now (M).
- `docs/features/65-doc-toolchain/` — the retrieval index this unit repairs
  (AC13/AC15/AC16/AC19 are the fixtures it holds the new default path to).
- `docs/ROADMAP.md` — the `## Features` row 443 (now `carried by fix #443`) and
  the `## Fixes` row for this unit.
- `skills/pre-execution-review/references/LEDGERS.md` — the ledger row
  contracts the two sibling files follow.

## Branch

`feat/443-doc-index`

## Depends on

none — feature 65 (the `doc` index, PR #282) is merged; issue #429 (the same
native-command vehicle) is a soft relation only, and this unit does not need
it: `CommandRegistrar` and the `/advance` precedent are already shipped.

## Regression scope

- The untouched retrieval behaviors — the keyword query core, the structured
  log filters, the manifest/chunker determinism, the store containment rules,
  the positional `doc read|edit|index` branch — verified by the eleven existing
  suites (`cd packages/agentic-workflow && bun test test/doc`) plus the
  differential check against the base commit on an identical fixture (declared
  deltas only).
- The extension's other commands — routing, busy guard, settings console, the
  conductor — verified by `cd packages/pi-agentic-workflow && bun run test`
  (the two `conductor-sensor` failures are the pre-existing red named in
  `## Known pre-existing issues`, reproduced on the base tree).
- The envelope's published shape and the closed degradation vocabulary —
  verified by `doc.envelope.test.mjs`, which is not edited by this unit.
