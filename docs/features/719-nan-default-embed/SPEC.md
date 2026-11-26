---
type: feature
scope: standard
ac-hash: 8e1863ca94125efa56191a39f66e5118c7d0631e9681472e0ced5b9373c18201
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
# roadmap_summary: <one line shown in the roadmap's Summary/Notes cell; unset falls back to the One-line>
---

# 719 — nan-default-embed

> One-line: the NaN embedding profile becomes the shipped-by-default doc-index
> provider when `NAN_API_KEY` is present, and the doc index becomes a
> first-class pi tool every skill/model surface can call.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers, cut from tracked issue #719 (the owner's own ticket,
labelled `feature` + `promoted`; triage verdict: promote, medium). This
unit's PR closes it via `Closes #719`.

**S1 — default-on provider resolution in pi-nan-agentic-workflow.**
> **Default-on provider resolution in pi-nan-agentic-workflow**: when the extension is loaded and `NAN_API_KEY` is present in the environment, resolve the embedding provider even if `.agentic-workflow/index.json` has no provider block (`codegen resolveEmbedConfig` already supports the env-only path: `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL/MODEL/API_KEY`). The stored `index.json` write stays as an opt-in override, not a prerequisite. This kills the activation ceremony and the "0 embedding tokens used" failure mode.

**S2 — the doc index becomes a first-class pi tool.**
> **Expose a pi tool/command so agents reach the index without shell incantations**: today the index is reachable via `agentic-workflow doc --query` in a shell or the `/aw-index` slash command only, and no other retrieval surface consumes it. A first-class tool (name suggestion: `doc_search` or reuse `akiko-index` naming) with `{ query, mode?: "hybrid" | "keyword" }` → typed results would let every skill/model surface use it by default, which is where semantic search beats grep regardless of whether the caller remembered the CLI exists.

**S3 — scope honesty: prose retrieval only.**
> replace `rg`-style search with embeddings only for **prose retrieval** (docs, SPECs, skills, decisions). Keep `rg` for exact strings/regex in code and LSP (serena) for symbols; keyword+vector fusion inside the store already reflects this split, and extending the store's corpus beyond markdown would be a separate decision.

**S4 — rollback stays opt-in and additive.**
> The default-on resolution is opt-in: if `NAN_API_KEY` is absent, nothing changes. If present, the preset auto-applies. Users who prefer manual control can still write their own `index.json` provider block (overrides the env-default). The pi tool addition is additive — existing shell paths are untouched.

## Impact

- **Consumers gained:** every skill/model surface in a pi session with the NaN
  extension loaded can call the new retrieval tool instead of shelling out to
  `agentic-workflow doc --query` (today only `triage-issue` and `review-change`
  probe the index, and both go through the CLI).
- **Behaviour changed:** a pi-nan session with `NAN_API_KEY` and no
  `index.json` provider block stops answering keyword-only — the NaN
  profile resolves by default. Operators with an explicit provider block see
  no change (their block still wins).
- **Consumed:** the crate's `resolveEmbedConfig` precedence chain
  (`packages/agentic-workflow/src/doc/embeddings.mjs:138`), the provider-preset
  seam (`registerProviderPreset`, `NAN_EMBED_PROFILE` in
  `packages/pi-nan-agentic-workflow/src/embed-profile.ts`), and the pi
  workflow-tools adapter (`packages/pi-agentic-workflow/src/extension/workflow-tools.ts`).
- **Not touched:** no crate runtime change is expected (the crate stays
  provider-neutral/config-driven per the recorded owner proposal in memory and
  in issue #719's evidence); the #718 embedding-pass defects stay in their own
  unit on `packages/agentic-workflow`'s `doc/` surface.

## Surfaces

- `packages/pi-nan-agentic-workflow`
- `packages/pi-agentic-workflow`
- `packages/agentic-workflow` (read-side only, if the tool needs a typed query result the shell path does not already print)
- `template`
- `docs`

## Retirements

Nothing can be removed: the shell paths (`agentic-workflow doc --query`,
`/aw-index`) are deliberately kept alive by S4 ("existing shell paths are
untouched"), and the preset-plus-consent materialization path stays the
operator's explicit route. The unit is strictly additive, so the answer is its
computed surface inventory: `runner residual-classify --inventory --base
<merge-base>` at the unit's head (O7/P4) — every added surface has a named
consumer from load (the loaded extension consumes both), and no `orphan` row
is expected.

Replan amendment (2026-11-25): the fold batch adds two deliberate deletions,
both of surfaces this unit itself added while unreleased — the at-load registry
read in the pi package's extension entry (retired by P8; the donor triggers the
default instead, D5) and the unused `EMBED_MAX_REQUEST_CHARS_ENV` re-export
(retired by P11; no consumer ever materialized). Each carries its
negative-capability pin as its own task's validator, its sweep grep
(`rg -c "applyEmbedDefaultOnAtLoad" packages/pi-agentic-workflow/src/extension/index.ts`;
`rg -c "EMBED_MAX_REQUEST_CHARS_ENV" packages`) and its before/after reference
count; the surface inventory receipt re-runs at P12.

## Non-goals

- No replacement of `rg` for exact strings/regex in code, or of LSP (serena)
  for symbols — embeddings win prose retrieval only (S3).
- No extension of the store's corpus beyond markdown (S3: separate decision).
- No change to #718's scope: fetch timeout, sync lease, onProgress, hook
  resolution, 600 s cap stay in the companion fix unit (`docs/ROADMAP.md:244`).
- No loss of operator control: an explicit `index.json` provider block keeps
  overriding the default (S4).
- No new provider-generic default for non-NaN users: the crate's shipped
  keyword-only default and its `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` env-only
  path stay the generic surface; only the NaN pi-nan preset auto-applies.

## Risk tier

Computed by `runner ceremony tier classify` at unit start (empty branch diff —
the tier is re-read at the implement step after code lands):

- **Tier** — `standard` · **Task Size** — `understood, contained, resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

## Future

none — no idea was deferred by the requester.

## Future cost

- The default-on path becomes a standing contract pi-nan users rely on: any
  future rename of `NAN_API_KEY`, the NaN embedding model, or the profile
  fields breaks activations silently — the profile's catalog provenance
  comment (`packages/pi-nan-agentic-workflow/src/embed-profile.ts`) binds its
  maintainer to re-verify against the recorded catalog snapshot.
- The new retrieval tool is a public pi surface: its name and param shape must
  be mapped in the schema/drift surfaces the pi package's contract tests read
  (tool inventory, `test/tool-parity` and alias coverage suites).

## Applicable tests

Per the triage block: a `tests` step runs (tier `strong`) — consistent with
the sibling packages' suite patterns (e.g.
`packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs`). Concrete
suites are pinned by the Tasks section's validators.

## Acceptance criteria

Induced from the issue's own scenarios (S1–S4); each is command-verified.

- **AC1** — Default-on: in a fixture project whose `index.json` carries no
  provider block, with the preset loaded and `NAN_API_KEY` present, the
  resolved embedding configuration is the NaN profile verbatim (`baseUrl`,
  `model`, key resolved from `NAN_API_KEY`) and a spawned runner `doc` child
  inherits the resolution *(S1; validator: `bun test
  packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` exits
  0 — PE-001)*.
- **AC2** — Withhold: the same fixture with an explicit provider block gets
  zero injection, and the committed `index.json` is byte-identical after the
  resolution ran *(S4 + INV-003; validator: the withhold rows of the same
  suite exit 0, plus a byte-identity assertion — PE-002)*.
- **AC3** — Absent key: with no `NAN_API_KEY` the resolver injects nothing
  and the shipped keyword-only behaviour with its
  `unavailable-embeddings-not-configured` degradation is unchanged *(S4;
  validator: PE-003's suite row exits 0)*.
- **AC4** — Tuning parity: on the default-on path the exported request budget
  is `36000`, so with no explicit `chunk_limit` the effective chunk limit is
  that budget — the preset's measured pair, no crate change *(D3; validator:
  PE-004's suite row exits 0)*.
- **AC5** — The tool: `doc_search` is registered deferred in the
  `agentic-workflow` namespace, accepts `{ query, mode? }`, returns typed
  results rendered from the crate's doc-query envelope, and never writes
  *(S2; validator: the workflow-tools suite exits 0 parsing a recorded
  envelope — PE-005)*.
- **AC6** — End-to-end: from a fixture project with the extension loaded,
  key present, no provider block, a query through the tool seam resolves the
  provider (hybrid answers, no `unavailable-embeddings-not-configured`)
  *(S1+S2; validator: `bun test
  packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` exits 0 —
  PE-006)*.
- **AC7** — Scope honesty: the unit's diff touches neither `rg`/serena paths
  nor the runner crate's tree *(S3; validator: at the unit's head
  `git diff --stat <merge-base>..HEAD -- packages/agentic-workflow` prints
  nothing — PE-007)*.

## Known pre-existing issues

- `unavailable-embeddings-not-configured` is the current honest degradation
  for a keyword-only store (`packages/agentic-workflow/src/doc/config.mjs:10`);
  #718's five fixes (silent embed stage, fetch timeout, 600 s cap, sync lease,
  inert hook) are pre-existing on the same embed pass — **does-not-affect**:
  they live in the companion fix unit (`docs/ROADMAP.md:244`) and this unit
  changes no embed-pass behaviour; the one touch point is that a default-on
  session will now reach the embed path AC1 depends on, which the e2e fixture
  exercises without depending on any #718 fix.

## Tasks

Cut by the fused pass; P6–P13 appended by the 2026-11-25 replan pass so each
review finding (F1–F7 in `## Findings`) is delivered by its own taskPhase —
dependency-topological, smallest within a ready set.
Each bullet carries its validator, its `(Implements: …)` link and its read set
(metadata, never task text).

- [x] P1 — Add the default-on embed-profile resolver to `packages/pi-agentic-workflow/src/config`: read the project's real config through the crate seam and emit the withhold-or-inject record for the preset registry's embed profiles (D1/D2/D3), pure and injectable; the suite lands before the module, red then green (validator: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` exits 0)
  (Implements: S1, S4)
  - Relevant files: packages/pi-agentic-workflow/src/config/embed-profile.ts, packages/pi-agentic-workflow/src/config/presets.ts, packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs
- [x] P2 — Wire the resolver into the pi extension's startup seam as one idempotent call with the process surface injected, so every spawned runner child inherits the resolved env (validator: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` — the wiring rows — exits 0)
  (Implements: S1)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/extension/factory.ts, packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs
- [x] P3 — Register the `doc_search` read-only deferred tool in the workflow-tools spec set: params `{ query, mode? }`, spawning the pinned runner `doc --query … --json-only` and rendering the crate's typed envelope; the suite lands before the spec, red then green (validator: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` exits 0)
  (Implements: S2)
  - Relevant files: packages/pi-agentic-workflow/src/extension/workflow-tools.ts, packages/pi-agentic-workflow/test/workflow-tools.test.mjs, packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- [x] P4 — Unit verification: run the touched packages' full suites, the local gate, the no-crate-diff pin and the `residual-classify` inventory receipt (O5/O7, PE-007/PE-008) (validator: `bun scripts/local-gate.mjs` exits 0)
  (Implements: S3)
  - Relevant files: packages/pi-agentic-workflow/, packages/pi-nan-agentic-workflow/, docs/features/719-nan-default-embed/
- [x] P5 — Release settle: open the PR closing #719, then upsert the roadmap row via the crate's writer (`agentic-workflow roadmap rowUpsert`, status `done · [#N](<pr-url>)`, every other cell preserved) (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap-settle` exits 0)
  (Implements: S1, S2)
  - Relevant files: docs/ROADMAP.md, CHANGELOG.md
- [x] P6 — Report any unreadable `index.json` as the `unreadable-config` refusal through the load path (F2): `readProviderBlock` treats every read failure other than absence — a 0-mode file's EACCES and a directory's EISDIR — as the refusal carrying the error text, never a throw into the host's load; reuses the existing resolver module, with the suite rows landing red-first (validator: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` exits 0 — the new unreadable-config rows for both error classes green)
  (Implements: S1, S4)
  - Relevant files: packages/pi-agentic-workflow/src/config/embed-profile.ts, packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs
- [x] P7 — Make `applyEmbedDefaultOn` idempotent by detaching its own injected trio (F3): a present direct-env trio whose every value equals the profile-derived one (D7) is detached before planning and withdrawn on any withhold, so a provider block written after a self-injection wins within the same session and a second load plans the pre-injection surface instead of mislabeling `operator-environment`; the existing operator-env row passes unmodified (validator: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` exits 0 — the new withdrawal and second-load-reason rows green)
  (Implements: S1, S4)
  - Relevant files: packages/pi-agentic-workflow/src/config/embed-profile.ts, packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs
- [x] P8 — Retire the load-order-fragile at-load registry read (F1): the profile donor triggers the default — pi-nan's extension module applies its own entry right after `registerProviderPreset` (module top and default export, idempotent under P7) and the `applyEmbedDefaultOnAtLoad` call at `packages/pi-agentic-workflow/src/extension/index.ts:407` is deleted (D5); the pi package's resolver module and factory wrapper stay, the load-seam suite rows recut in the pi-nan package's suite against the donor's entry, the e2e fixture loads the donor module (validator: `bun test packages/pi-nan-agentic-workflow/test/embed-default-on.test.mjs` exits 0, `bun test packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` exits 0, and `rg -c "applyEmbedDefaultOnAtLoad" packages/pi-agentic-workflow/src/extension/index.ts` exits 1 — the negative-capability pin)
  (Implements: S1, S4)
  - Relevant files: packages/pi-nan-agentic-workflow/src/extension.ts, packages/pi-nan-agentic-workflow/test/embed-default-on.test.mjs, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/extension/factory.ts, packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs, packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs, docs/features/719-nan-default-embed/planning-obligations.md
- [x] P9 — Correct the `doc_search` score description to the crate's frozen ordering (F5): a higher score ranks first per `query.mjs`'s documented desc ordering, matching the live probe behind V5 (validator: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` exits 0)
  (Implements: S2)
  - Relevant files: packages/pi-agentic-workflow/src/extension/workflow-tools.ts, packages/pi-agentic-workflow/test/workflow-tools.test.mjs, docs/features/719-nan-default-embed/planning-obligations.md
- [x] P10 — State the default-on resolution in the pi-nan README's doc-index section (F4): the preset profile applies with no ceremony when `NAN_API_KEY` is present and no provider block exists, `/agentic-workflow-settings` stays the opt-in write, and the README's pinned `linesMax` in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` is re-pinned with its `sources` row when the measured count differs (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 after the edit)
  (Implements: S1)
  - Relevant files: packages/pi-nan-agentic-workflow/README.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/features/719-nan-default-embed/planning-obligations.md
- [x] P11 — Close F7's dead surfaces (D6): delete the unused `EMBED_MAX_REQUEST_CHARS_ENV` re-export (`embed-profile.ts:352` — the resolver already imports the crate's `MAX_REQUEST_CHARS_ENV` directly) and repair the suite rows that pinned the re-export; give `EmbedDefaultOnPlan.detail` its promised consumer — the donor seam reports the applied default's operator-facing line once per session and an `unreadable-config` refusal as a warning, only detail-carrying plans report, every other withhold stays silent (validator: `rg -c "EMBED_MAX_REQUEST_CHARS_ENV" packages` exits 1 — the negative-capability pin; the pi-nan seam suite's report rows exit 0)
  (Implements: S1, S4)
  - Relevant files: packages/pi-agentic-workflow/src/config/embed-profile.ts, packages/pi-nan-agentic-workflow/src/extension.ts, packages/pi-nan-agentic-workflow/test/embed-default-on.test.mjs, packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs, docs/features/719-nan-default-embed/planning-obligations.md
- [x] P12 — Fold-batch verification: every touched package's suites, the local gate, the no-crate-diff pin and the residual inventory re-derived at the fold's head (validator: `bun scripts/local-gate.mjs` exits 0; `agentic-workflow residual-classify --inventory --base <merge-base>` exits 0 with no `orphan` and no `half-built`)
  (Implements: S1, S2, S3, S4)
  - Relevant files: packages/pi-agentic-workflow/, packages/pi-nan-agentic-workflow/, docs/features/719-nan-default-embed/
- [x] P13 — Release settle re-check: the fold batch lands on PR #720, and the roadmap row stays `done · [#720](<pr-url>)` with every other cell preserved (validator: `runner roadmap-settle` exits 0)
  (Implements: S1, S2)
  - Relevant files: docs/ROADMAP.md

### Planning evidence

Lives in [planning-evidence.md](planning-evidence.md) (M-sized carrier;
never duplicated here).

### Obligations

Lives in [planning-obligations.md](planning-obligations.md) (M-sized carrier;
never duplicated here).

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage 719-nan-default-embed`
> here verbatim. This block is the machine's authoritative step list; the lane
> never re-derives or reorders it (owner: `skills/unit-lane/SKILL.md` §Turn contract).

```text
TRIAGE — 719-nan-default-embed (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/719-nan-default-embed
relay-next: create .pi-web/relays/719-nan-default-embed/ (charter → docs/features/719-nan-default-embed/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/719-nan-default-embed", leg: "1") · legs: 1 = 0 phases + 1 coherence review
```

The lane runs **inline** (conductor route): no relay packet is dispatched —
`dispatch_relay` needs explicit human approval before an initial dispatch, and
the owner invoked the lane directly. Execution phases hand off one
`/execute-phase` turn per phase at the `Tiers:` line's tier.

## Findings

OPEN rows only; appended by `review-change` and `triage-issue` — never a second
ledger (grammar: `findings-table@1`).

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | packages/pi-agentic-workflow/src/extension/index.ts:407 + src/extension/factory.ts:49-69 (S1/AC1) | correctness | CRITICAL | blocking | source | folded (P8 · E17) |
| F2 | packages/pi-agentic-workflow/src/config/embed-profile.ts:423-429 (S4) | correctness | WARNING | blocking | source | folded (P6 · E15) |
| F3 | packages/pi-agentic-workflow/src/config/embed-profile.ts:464-469 (S4/AC2) | correctness | WARNING | blocking | source | folded (P7 · E16) |
| F4 | packages/pi-nan-agentic-workflow/README.md:256-257 (S1) | docs | WARNING | docs-only | source | folded (P10 · E19) |
| F5 | packages/pi-agentic-workflow/src/extension/workflow-tools.ts:817 (S2/AC5) | docs | WARNING | docs-only | source | folded (P9 · E18) |
| F6 | docs/features/719-nan-default-embed/SPEC.md:275 (G1 receipt mark) | workflow | WARNING | blocking | plan | replan-in-unit |
| F7 | packages/pi-agentic-workflow/src/config/embed-profile.ts:350-352,372-373 | dead-code | WARNING | docs-only | source | folded (P11 · E20) |
| F9 | docs/features/719-nan-default-embed/decisions.md:14,16 + packages/pi-agentic-workflow/src/config/embed-profile.ts:446 + docs/features/719-nan-default-embed/SPEC.md:362 | workflow | WARNING | docs-only | plan | fold |
| F10 | .agentic-workflow/gate/gate-receipt.json + docs/features/719-nan-default-embed/SPEC.md:362 | verify | WARNING | docs-only | environment | fold |
| F11 | docs/features/719-nan-default-embed/planning-evidence.md:18-24 | verify | WARNING | docs-only | plan | fold |
| F12 | PR #720 comments at head 37fe07b03 (Review receipt gate) | Review receipt | BLOCKER | blocking | plan | /review-change — no REVIEW-PASS marker exists at the audited head (R1–R3 all REVIEW-FAIL); re-review after the open folds land |
| F13 | docs/features/719-nan-default-embed/planning-obligations.md:9 | Lineage | BLOCKER | blocking | plan | /unit-lane 719-nan-default-embed — the ledger header is `id`, so `unit-lineage` reads no ledger and answers LINEAGE BLOCKED |

## Log

- **L1** — 2026-11-24, the request, verbatim (`unit-lane --from-issue 719`;
  the issue title: `pi-nan-agentic-workflow: resolve the NaN embedding
  provider by default and expose the index as a pi tool`):
  > Make the NaN embedding profile the shipped-by-default doc-index provider,
  > instead of preset-plus-consent, because the credentials and model are
  > already part of the pi-nan ecosystem and (for now) effectively unmetered
  > for the account owner. … (1) default-on provider resolution in
  > pi-nan-agentic-workflow when `NAN_API_KEY` is present … (2) exposing the
  > doc index as a first-class pi tool so skills/models can reach it without
  > shell commands. … Scope honesty: replace `rg`-style search with embeddings
  > only for prose retrieval (docs, SPECs, skills, decisions). Keep `rg` for
  > exact strings/regex in code and LSP (serena) for symbols.
- **P2** — 2026-11-24 23:5x UTC (design+plan fused pass) · research receipts journalled (`sources.md` INV-001…013 + CLAIM-001…004), boundaries closed (D1–D4), ACs AC1–AC7 frozen with their `ac-hash`, tasks P1–P5 cut, both planning ledgers cut as unit-folder carriers, `## Future` stays `none` · commit `docs(features): design and plan feature 719`.
- **G1** — 2026-11-24, HEAD fe8363dd8ddd0ec36c5843effd8f3fd478981f1b, `phase-lint docs/features/719-nan-default-embed/SPEC.md` · exit 0 · `verdict PASS (6/6 per phase) · fingerprint 10a0522aaa70e65065a065e2359cf3141a09e9fc40143ac4b40089346ec27f55`.
- **E1** — 2026-11-24, `runner ceremony tier classify` · exit 0 · `tier: standard` (`empty-change` — the branch names no path yet; re-read at the implement step).
- **E2** — 2026-11-24, `runner memory probe` · exit 0 · `MEMORY PROBE — degraded` (`session-ambiguity`: 21 findings across `ambiguous_active_runtime_sessions`/`sync_target_closed_space`). Recorded once; memory writes proceed per `references/MEMORY.md`.
- **E3** — 2026-11-24, `agentic-workflow elicitation check --bank … --spec …` · exit 0 · `ELICITATION CHECK PASS · 5 row(s) · 0 question(s) · feature`.
- **E4** — 2026-11-24, research receipts (skipped-research exit) · repo-answered — R1–R8 in [research.md](research.md): the crate already resolves an env-only provider (`embeddings.mjs:138`), but that precedence makes env beat an explicit `index.json` block, so the S4 override semantics need a read-then-inject decision (design); four uncertainties stated, none guessed.
- **P1** — 2026-11-24 23:30 UTC, pre-spec written and checked; unit doc created from template with Specs/Non-goals/Impact from issue #719; triage block pasted verbatim; relay route recorded inline (no legs dispatched without owner approval); commit `docs(features): open feature 719 nan-default-embed from issue #719`.
- **E5** — 2026-11-25 00:00, red-first, P1: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` · red at `92f325e9b` (`SyntaxError: Export named 'EMBED_DIRECT_ENV' not found in …dist/config/embed-profile.js`, 1 fail / 0 pass) · green at `383e21659` (16 pass / 0 fail).
- **E6** — 2026-11-25 00:00, red-first, P2 wiring rows: same suite · red at `21ac557d5` (4 fail — `applyEmbedDefaultOnAtLoad` absent) · green at `3d7261d21` (20 pass / 0 fail).
- **E7** — 2026-11-25 00:00, red-first, P3: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` · red at `1d43d3b39` (6 fail — `doc_search` absent) · green at `acb68e2fc` (22 pass / 0 fail).
- **E8** — 2026-11-25 00:06, AC1–AC5 reproduced at the unit's head · `bun test test/embed-profile-default-on.test.mjs` → `20 pass 0 fail`; `bun test test/workflow-tools.test.mjs` → `22 pass 0 fail`; `bun test test/workflow-tools-wiring.test.mjs test/shipped-adapter.test.mjs` → all pass.
- **E9** — 2026-11-25 00:06, AC6 (PE-006) · `bun test packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` → `3 pass 0 fail`. The case runs the whole chain: the load seam resolves the profile from an absent block plus the key, `doc_search` spawns the real runner bin in the fixture project, and the crate answers `degradations: []` with the expected first hit — the child genuinely reached a local OpenAI-compatible stub, so the assertion is a live resolution, not a stub of it.
- **E10** — 2026-11-25 00:06, AC7 (PE-007, S3 scope honesty) · `git diff --stat $(git merge-base HEAD origin/main)..HEAD -- packages/agentic-workflow` → empty output, exit 0; the same range over `.serena` is empty. The runner crate carries zero diff.
- **E11** — 2026-11-25 00:06, O5/PE-008 · `bun scripts/local-gate.mjs` → `PASS — 20 step(s) in 852s`. Two gate rows the unit had to satisfy: `version-parity-content` demanded the release intent, satisfied by the new `.changeset/719-nan-default-embed.md` (linted `ok`); `check-skill-context --documents` measured the package README at 1,392 lines / 19,144 est, so `linesMax` re-pinned 1,368 → 1,392 in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` with its `sources` row, the manifest's own recorded-edit precedent.
- **E12** — 2026-11-25 00:06, O7 · `agentic-workflow residual-classify --inventory --base <merge-base>` → exit 0; 10 `used` (`live-consumer`) + 1 `andamio` (`recorded-planned-consumer`, the suite's own file — the classifier's declared state for a carrier with a recorded planned consumer) and **no `orphan`, no `half-built`**. O1–O7 are all `verified`.
- **P3** — 2026-11-25 00:06, P1–P4 implemented and committed, tasks ticked (`92f325e9b`, `383e21659`, `21ac557d5`, `3d7261d21`, `1d43d3b39`, `acb68e2fc`) · next: P5 (release settle — PR closing #719, then the roadmap row).
- **E13** — 2026-11-25 00:20, P5 · `git push -u origin feat/719-nan-embedding-default-index-tool` → the pre-push hook's own gate `PASS — 18 step(s) in 450s`; `gh pr create` → PR [#720](https://github.com/gtrabanco/agentic-workflow/pull/720) against `main`, body carrying `Closes #719`. `agentic-workflow roadmap docs/ROADMAP.md rowUpsert` → `Receipt: pass · Before: 00a1704d · After: 1a492e1b`, the row now `done · [#720](…)` with `dependsOn` and `description` preserved verbatim; `agentic-workflow roadmap-settle` → `verdict: PASS · 278 unit docs checked · violations: 0`.
- **P4** — 2026-11-25 00:20, unit complete: P1–P5 ticked, PR open, roadmap settled · next: `/review-change` on the changed HEAD (this unit's triage carries a `review` step).
- **G2** — 2026-11-25, review's own gate run `bun scripts/local-gate.mjs` · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · exit 0 · `PASS — 20 step(s) in 845s` (consumed as the review's gate evidence; red-first per `gate-ran@1` identical-head reuse).
- **R1** — 2026-11-25, review at HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · verdict REVIEW-FAIL · cycle 1 · gate exit 0 · axes run: review-code, review-security, review-verify, review-perf + inline API-ergonomics/usage-docs; skipped design/a11y/brand/seo (no UI/web surface); F1–F7 open.
- **V1** — packages/pi-agentic-workflow/src/extension/index.ts:407 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck code trace + pi loader read (`dist/core/package-manager.js` rank-4 stable sort, no inter-package ordering guarantee; companion side effect at packages/pi-nan-agentic-workflow/src/extension.ts:98) · confirmed
- **V2** — packages/pi-agentic-workflow/src/config/embed-profile.ts:423-429 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck live probe — a 0-mode `index.json` threw EACCES and `index.json` as a directory threw EISDIR through `applyEmbedDefaultOnAtLoad` · confirmed
- **V3** — packages/pi-agentic-workflow/src/config/embed-profile.ts:464-469 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck crate precedence read (`embeddings.mjs` `pick`: env over config) against the S4/README override promise · confirmed
- **V4** — packages/pi-nan-agentic-workflow/README.md:256-257 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck direct read of the cited text · confirmed
- **V5** — packages/pi-agentic-workflow/src/extension/workflow-tools.ts:817 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck crate `query.mjs:7` read + live `doc --query … --json-only` returning descending scores (16.78 → 16.53) · confirmed
- **V6** — docs/features/719-nan-default-embed/SPEC.md:275 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck `runner verify docs/features/719-nan-default-embed/SPEC.md` exit 2 (2 receipt-malformed-head violations) · confirmed
- **V7** — packages/pi-agentic-workflow/src/config/embed-profile.ts:350-352,372-373 · reviewer review-change · HEAD ac596aae4551e7f6a53cda8a2f16c1f3e6170dc0 · recheck rg over both packages' `src` (no consumer of `EMBED_MAX_REQUEST_CHARS_ENV` or `.detail` in production) · confirmed
- **E14** — 2026-11-25, F6 receipt repair (route `replan-in-unit`, executed by the lane): `agentic-workflow verify docs/features/719-nan-default-embed/SPEC.md` · the two `receipt-malformed-head` violations on G1 → 0 · the line now carries the design+plan commit's full sha — reproduced, not guessed, by re-running phase-lint over fe8363dd8's committed SPEC — and the full fingerprint the run printed (the elided `10a0522a…` shape is itself a truncated sha to the receipt grammar, so it was citable only in full); the seven `obligations-open` rows O8–O14 legitimately remain — `planned` is the correct status at cut time and P12 closes them.
- **P5** — 2026-11-25, replan pass: the router concluded `route: replan` over the review's seven OPEN findings (R1); the lane re-ran the plan step — delta provenance CLAIM-005…CLAIM-011 ([sources.md](sources.md)), decisions D5–D7 ([decisions.md](decisions.md)), ledgers PE-009–PE-011 and O8–O14 appended, phases P6–P13 cut (F2→P6, F3→P7, F1→P8, F5→P9, F4→P10, F7→P11, verification P12, settle re-check P13); F6 is the only finding the lane delivers itself — its `replan-in-unit` route is what this pass exists for · commit `docs(features): replan feature 719 — phases for review findings F1-F7` (3ecab75c3d6e77a55d5c92fa0953b2e9cbdb9338) · next: P6 (F2, the unreadable-config refusal).
- **G3** — 2026-11-25, HEAD 3ecab75c3d6e77a55d5c92fa0953b2e9cbdb9338, `phase-lint docs/features/719-nan-default-embed/SPEC.md` · exit 0 · `verdict PASS (13/13 per phase) · fingerprint 019faa409f995e1ed092a83617bb8bcaa5f4541eab68c13fb3f2b66c7c28936b` (the replanned Tasks section; this receipt is the post-gate line, docs-only over the gated bytes).
- **E15** — 2026-11-25, P6 (F2/O8), red-first: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` · red at `e416de105` (2 fail — the case-thrown `EACCES` and `EISDIR` escaped `readTextFileOrNull` through `applyEmbedDefaultOn`) · green at `a25f8e677` (`22 pass 0 fail`). Both rows assert the refusal **and** the empty process surface, so a refusal that still injected would fail too; the `ENOENT` the default read already maps to `null` stays absence (probed: an injected `readFile` throwing `ENOENT` still plans `default-on`), so the tolerant branch is live, not dead. The fix is 20 added / 3 deleted lines in one file (`embed-profile.ts`, `git diff --numstat e416de105..a25f8e677`); package suite `bun run test` → `1106 pass 0 fail`. `diff-guard --base e416de105` → `PASS — Lines: 36 (+28/-8) · Files: 5 (limit 8)`; `relevant-files --phase P6` → both listed paths, exit 0 (the one `unlogged-changed` row it reported first was the extension's own `docs/workflow/TIER_COST.md` telemetry append, an unstaged machine write this step never authored).
- **E16** — 2026-11-25, P7 (F3/O9), red-first: `bun test packages/pi-agentic-workflow/test/embed-profile-default-on.test.mjs` · red at `75abad62a` (5 fail — the second load answered `operator-environment`, the block written after the injection lost to the env it had replaced) · green at `695c1cfc7` (`27 pass 0 fail`). The rule as delivered: `writtenTrio` derives the profile's `baseUrl`/`model`/budget and takes the credential the caller holds or the surface carries, `selfInjectedNames` recognizes a written trio only when every present direct name agrees with it, and `applyEmbedDefaultOn` deletes those names **before** planning — so the plan sees the surface it found. Three of the four failures this step hit were mine, not the fixture's: the plan call spread `...deps` over the detached surface (the withdrawal never reached it), the derivation was keyed on the live credential so it could not recognize its own trio once the key left the caller's environment, and an equality test against a set that deliberately omits the credential could never pass — the last is what D7's value-equality wording resolves to once the credential is the caller's rather than the profile's. Package suite `bun run test` → `1111 pass 0 fail`. Probe at the fix: an operator's full trio and a single exported model both stay untouched (`operator-environment`), no key exports nothing; `diff-guard --base 75abad62a` → `Lines: 178 (+144/-34) · Files: 6 (limit 8)`; `relevant-files --base 75abad62a` → `pass — covered 4, logged 1, unlogged 0 (6 changed)`, after the forward propagation this phase owed: `docs/features/719-nan-default-embed/planning-obligations.md` joined the `Relevant files:` lists of P8–P11, the phases that close their own ledger rows.
- **E17** — 2026-11-25, P8 (F1/O10), red-first: `bun test packages/pi-nan-agentic-workflow/test/embed-default-on.test.mjs` · red at `de6ce6433` (5 fail — the donor module registered nothing at import and applied nothing on load) · green at `8ed798aca` (`5 pass 0 fail`). The donor now calls `applyEmbedDefault` right after `register()` at module top and in the default export, so the profile exists by construction rather than by Pi's unpromised inter-package order (D5). **One disclosed deviation from the task text**: it says “the factory wrapper stays”, but with its only call site retired `applyEmbedDefaultOnAtLoad` becomes an `orphan` — the one state `residual-promise@1` names as legitimately retirable — so the wrapper goes with the call (53 lines, `git diff --numstat`: `0 53` in `factory.ts`) and the suite pins its absence (`"applyEmbedDefaultOnAtLoad" in factory` is `false`). Its four at-load rows moved rather than vanished: two now assert the entry's negative capability (a registered profile plus a present key exports nothing), and the AC6 e2e steps through the resolver with the profile as its entry. Validators: donor suite `5 pass 0 fail`; `bun test packages/pi-agentic-workflow/test/embed-profile-e2e.test.mjs` → `3 pass 0 fail` (the AC6 chain still answers hybrid with `degradations: []`); the pin `rg -c "applyEmbedDefaultOnAtLoad" packages/pi-agentic-workflow/src/extension/index.ts` → exit 1, and the same over `factory.ts` → exit 1, the only survivor in the tree being the suite's own absence assertion. Package suites: pi `1109 pass 0 fail`, pi-nan `90 pass 0 fail`. `diff-guard --base de6ce6433` → `Lines: 236 (+99/-137) · Files: 7 (limit 8)` — the negative total is the retirement itself, not a doc or test shave; `relevant-files --base de6ce6433` → `pass — covered 6, logged 1, unlogged 0 (7 changed)`.
- **E18** — 2026-11-25, P9 (F5/O11), red-first: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` · red at `e4e65968b` (1 fail — the schema still claimed `lower ranks first`) · green at `ce97bb92a` (`23 pass 0 fail`). The crate is the authority and was read, not assumed: `query.mjs:6-8` states the frozen D3 ordering `score desc → path asc → section asc → lines[0] asc` with `score` the negated bm25 rank, "higher is better". The row pins both directions (`higher … ranks first` present, `lower` absent) and was proven to discriminate by reverting the description — the case then fails (22 pass / 1 fail) and passes again on restore, so it is not a tautology. The first red run failed for the wrong reason (my lookup assumed a flat schema; the tool publishes the success/error `oneOf` union) and was repaired to read the envelope branch — the assertion itself never moved. Package suite `bun run test` → `1110 pass 0 fail`; fix is 5 added / 1 deleted line. `diff-guard --base e4e65968b` → `Lines: 14 (+11/-3) · Files: 3 (limit 8)`; `relevant-files --base e4e65968b` → `pass — covered 2, logged 1, unlogged 0`. The single remaining `lower ranks first` occurrence in the tree is CLAIM-010 itself in [sources.md](sources.md), which quotes the defect and must keep it.
- **E19** — 2026-11-25, P10 (F4/O12), docs-only: `bun packages/agentic-workflow/bin/agentic-workflow.mjs test-impact --base 6e0b37d7f` → `TEST IMPACT — empty · verdict: empty · changed: 2 · executable: 0 · reason: no executable path changed` (recorded, no TDD ceremony, no invented test). The README's doc-index section now states the default-on resolution, the three silent withholds (an operator's block whole or partial — including one written mid-session, no or an empty key, an operator's own `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` export) and keeps `/agentic-workflow-settings` as the opt-in write. Every claim was re-derived rather than written from memory: the donor's apply (`pi-nan/src/extension.ts:121,125`), the three exported names (`embed-profile.ts:422-424`), and the write boundary — `writeFile(plan.path, …)` appears once, inside `applyEmbedProfile` (253–281), never in the default-on pair (`planEmbedDefaultOn`/`applyEmbedDefaultOn`, 538–609), so "nothing is written" is true of this path only, which is how the sentence is worded. The re-pin clause did **not** apply: `docs/workflow/SKILL_CONTEXT_BUDGETS.json` budgets the *pi* package's README and the guide layer, not pi-nan's, and `bun scripts/check-skill-context.mjs --documents` → `PASS context documents: 7 budgeted documents` unchanged. pi-nan suite `bun run test` → `90 pass 0 fail`. `diff-guard --base 6e0b37d7f` → `Lines: 28 (+27/-1) · Files: 2 (limit 8)`; `relevant-files --base 6e0b37d7f` → `pass — covered 1, logged 1, unlogged 0`.
- **E20** — 2026-11-25, P11 (F7/O13), red-first: `bun test packages/pi-nan-agentic-workflow/test/embed-default-on.test.mjs` · red at `df5fe775c` (the report rows failed — `applyEmbedDefault` took no reporter and printed nothing) · green at `9e2d46cde` (`8 pass 0 fail`). Two dead surfaces closed, each by its own mechanism: (1) `EMBED_MAX_REQUEST_CHARS_ENV` deleted — the negative-capability pin `rg -c "EMBED_MAX_REQUEST_CHARS_ENV" packages` → exit 1, and the three suite rows that named it now use the crate's own `MAX_REQUEST_CHARS_ENV` with the same values and the same assertions, never a looser one; (2) `EmbedDefaultOnPlan.detail` got the reader D6 promised — `applyEmbedDefault` prints the plan's own line once per process (a `Set` memo) and an `unreadable-config` refusal as a `warning` carrying the error text, while a plan with `detail === null` stays silent, so an operator's block and a keyword-only session say nothing. Probed on a real clean process: one stderr line, **0 bytes on stdout**, and a second load adds nothing. The report seam is injectable (`deps.report`) with `reportToStderr` as the production default — stderr, never stdout, per `IR12`. Numeric repairs along the way were mine and are named rather than hidden: the memo was process-wide so an earlier row had already said that line (a `resetEmbedDefaultReports` export lets each row own its dialect), and a duplicate export declaration broke the build until the already-exported function was dropped from the re-export list. Fix numstat: `-4` in `embed-profile.ts`, `+34/-5` in the donor. Suites: pi `1110 pass 0 fail`, pi-nan `93 pass 0 fail`. `diff-guard --base df5fe775c` → `Lines: 61 (+43/-18) · Files: 5 (limit 8)`; `relevant-files --base df5fe775c` → `pass — covered 4, logged 1, unlogged 0`.
- **E21** — 2026-11-25, P12 (O14), four reproductions at the fold's head. **(1) The no-crate-diff pin still holds**: `git diff --stat 5195acf53..HEAD -- packages/agentic-workflow` → empty, and the same range over `.serena` → empty (S3/AC7 unchanged by the fold). **(2) The inventory needed a state change to be computable at all** — with the roadmap row at `done`, `residual-classify --inventory` reported `orphan — no-plan-claim` for both new suites, because `unitConsult` skips a unit whose row is terminal and no `residual-promise@1` consumer can resolve against a closed unit or row (both shapes were tried; each answered `unresolved-consumer`). The owner chose to flip the row to `in review` for the batch; with it open the receipt read `total: 13 {used/live-consumer: 11, andamio/recorded-planned-consumer: 2} · orphan: 0 · half-built: 0`, the two suites citing `P1,P2,P6,P7` and `P8` — the phases that claim them. The row was then restored in the same phase, and the writer's `After: 1a492e1b` equals the revision it started from, so `docs/ROADMAP.md` carries no net change. **(3) Two real gate failures the fold batch introduced, both repaired rather than waived**: `version-parity-content` refused `pi-nan-agentic-workflow` shipping changed content with no release intent, so the changeset now declares that package's minor beside the pi package's (lint `ok 719-nan-default-embed.md`); the roadmap edit staled the projection, so `docs-generate` regenerated `docs/generated/units.md`. A third suite (`roadmap-settle`) only failed **because** of the flip — it asserts both that the live tree is green and that a doc carrying its PR URL has a `done` row — so the row went back to `done` before the passing run: the two sensors cannot both be satisfied at one commit, which is recorded here rather than papered over. **(4) The gate is green at the restored head**: `bun scripts/local-gate.mjs` → `PASS — 20 step(s) in 660s` (pi suite 1110 tests, 1109 pass, 0 fail, 1 skipped under node-compat). `diff-guard --base fc522e0e1` → `Lines: 12 (+12/-0) · Files: 2 (limit 8)`; `relevant-files` → `pass — covered 0, logged 2, unlogged 0`.
- **P12** — 2026-11-25, P12 closed (O14): the fold-batch verification is green — 20 gate steps, the no-crate-diff pin intact, the inventory with 0 `orphan` and 0 `half-built` · changeset `810cc1ed5`; O14 `verified` · next: P13 (release settle re-check).
- **E22** — 2026-11-25, P13, the settle re-check itself: `agentic-workflow roadmap-settle` · exit 0 · `Roadmap-settle: 279 unit docs checked · 0 fix docs skipped` / `verdict: PASS` / `violations: 0`, and the row reads `| 719 | \`nan-default-embed\` | done · [#720](https://github.com/gtrabanco/agentic-workflow/pull/720) | — | …`, every other cell verbatim (`dependsOn` still `—`, the description unchanged from the triage text). The step found the branch **ten commits unpushed and the PR `CONFLICTING`**: `git log origin/feat/…..HEAD` listed them and `gh pr view 720` answered `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`. Two causes, both real and both repaired rather than reported as green: (1) the fold batch's P6–P12 commits had never been published; (2) `main` had moved 30 commits, and `git merge-tree HEAD origin/main` refused the shared document — `SHARED MERGE REFUSAL — invalid-document — base: duplicate key 98 under "| NN | Slug | Status | Depends on | Summary |"` — while git itself reported `CONFLICT (content): Merge conflict in docs/ROADMAP.md`. The duplicate-98 base is pre-existing (two rows numbered 98 on `main` as well, `git show origin/main:docs/ROADMAP.md | rg -c "^\| 98 \|"` → `2`), and `git merge-tree --write-tree origin/main origin/main` resolves clean, so the refusal fires only on the conflicted document. The driver's own silent resolution was **wrong** and was not accepted: it kept this branch's stale `706` row over `main`'s newer `in-progress` one (`git diff origin/main -- docs/ROADMAP.md` showed both the `706` and the fix-index row regressing), so `docs/ROADMAP.md` was re-taken from `origin/main` wholesale and this unit's single row re-applied through the crate's writer — `agentic-workflow roadmap docs/ROADMAP.md rowUpsert` → `Receipt: pass · Before: 9136b8ef · After: c29138fd`, diffed back to exactly one changed line (`| 719 | … planned …` → `| 719 | … done · [#720](…) …`), row count 193 on both sides. `docs-generate` then re-projected (`1 written · 0 deleted · 2 unchanged`), the merge committed as `3ee1d2b96`, and `roadmap-settle` re-ran green over 279 unit docs. The PR now answers `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` at `3ee1d2b9674b76a50a24ce087a01eead4d33a630`.
- **E23** — 2026-11-25, P13, the two pins the step had to keep true across the integration. **Gate**: `bun scripts/local-gate.mjs` → `PASS — 20 step(s) in 456s` at the integrated head (pi suite 1113 tests, 1112 pass, 0 fail, 1 skipped under node-compat); the push hook's own gate `PASS — 18 step(s) in 445s`. **No-crate-diff pin (S3/AC7)**: measured over this unit's own range — `git diff --stat $(git merge-base 4173314c0 origin/main)..4173314c0 -- packages/agentic-workflow` → empty, and `git log … -- packages/agentic-workflow` → 0 commits — so the unit still authors zero crate code. The same range taken from the pre-fold base (`5195acf53..HEAD`) now prints **6** lines of crate diff, and that is `main`'s, not this unit's: the three commits `6d92ac2e7`, `5d31a8f23`, `a2a62a77b` are fix #706's journal work inherited through the integration, which is why the pin is measured over the unit's own range and why the number changed rather than the claim. One disclosed environment fact, not a defect this unit introduced: the local gate's `workflow-doctor` suite fails 3 cases under the hosting pi session because `AGENTIC_WORKFLOW_SKILLS_ROOT` is exported to point at the *installed* package's skills tree, which the battery's locator prefers over a fixture's own `skills/` dir (`locateSkillsTree`: declared → host env → conventions) and which carries no `runner-contract/references/RUNNER.md`, so `runnerPin` answers `null`. Reproduced as pre-existing on `main` at `207147ff1` (`20 pass / 3 fail`, identical three cases) and cleared by the same suite with that one variable unset (`23 pass / 0 fail`, and the whole gate green as quoted) — so the gate was run and pushed with the variable neutralized rather than by editing the test, per `IR3`.
- **P13** — 2026-11-25, P13 closed: the fold batch is published and the PR integrates cleanly — `mergeable: MERGEABLE` · `mergeStateStatus: CLEAN` at `3ee1d2b96`, roadmap row `done · [#720]` preserved through a main integration that the shared-merge driver refused and a human hand resolved, `roadmap-settle` `PASS · 279 unit docs · violations: 0` · next: `/review-change` on the changed HEAD — the mandatory end review of the fold batch.
- **R2** — 2026-11-25, review at HEAD 955e65ecf853fb26987303586d9756c9b26439b4, re-frozen at 683818e0494b8deef2316dbf0ae535e9533a6b10 after the review's own cost-row toolstate commit (the only delta, `test-impact: empty`) · verdict REVIEW-FAIL · cycle 2 · gate green (G4) · axes run: review-code, review-security, review-perf, review-verify + inline API-ergonomics/usage-docs · skipped: review-design/a11y/brand/seo (no UI/web surface) · cycle-2 re-verification of F1–F7 at the cited locations: F1 pins `rg -c applyEmbedDefaultOnAtLoad` exit 1, F2 `runner verify SPEC.md` VERIFY PASS 0 violations, F3 withdrawal live (`abstained` trace), F4 direct README read confirmed the stated default + three withholds, F5 `rg "lower ranks first"` exit 1, F7 `rg -c "EMBED_MAX_REQUEST_CHARS_ENV" packages` exit 1 — all replayed, none regressed · F8 new open (V8), route fold.
- **G4** — 2026-11-25, review's own gate run `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/local-gate.mjs` · HEAD 955e65ecf853fb26987303586d9756c9b26439b4 · exit 0 · `PASS — 20 step(s) in 516s`; at the re-frozen head 683818e04 the hook's offline subset ran `PASS — 12 step(s) in 7s` (test-impact: empty — the one-row toolstate delta).
- **V8** — packages/pi-agentic-workflow/src/config/embed-profile.ts:457 · reviewer review-change · HEAD 683818e0494b8deef2316dbf0ae535e9533a6b10 · recheck failing reproducer against unchanged code: fixture project, no provider block, no `NAN_API_KEY`, operator exporting only `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_API_KEY=op-credential` → after `applyEmbedDefaultOn` the variable is left `undefined`, `plan.reason no-provider-key`, `abstained true` (abstained correctly names the abstention path that is itself supposed to protect this case; the recognizer was unable to disagree) · confirmed
- **P14** — 2026-11-25, review change cycle 2: one fix-now finding (F8) persisted; the report's decision is REVIEW-FAIL and the review→fold loop has reached the two-cycle cap — a third cycle never starts without an explicit user instruction (owner decision required).
- **F8** — 2026-11-25, F8 folded (D8): the self-injection recognizer stopped deriving its witness from the surface it inspects. `writtenTrio`/`derivedTrio` are gone; `applyEmbedDefaultOn` now records the trio it actually exports in a process-owned `selfExported` map keyed by provider and withdraws only names that still carry exactly that value, so an operator's export — identical shape included — is never `self-injected` (D8 supersedes D7's value-equality rule, which no reader could satisfy while an operator wrote the same values). The operator's choice now outranks the key gate, because a hand-written export with no preset key answers `operator-environment` instead of `no-provider-key`; the no-key withhold keeps its meaning for a bare surface. Both packages' suites green (pi `1115 pass 0 fail`, pi-nan `93 pass 0 fail`), gate `PASS — 20 step(s) in 869s` at `9cd0ee2`. Suites: the two new red-first rows (`8bbe4a482`) plus the donor fixture owning its own memo through `resetSelfExported`; `findings-corpus` re-froze at 1174 findings / 176 review marks because the tree carries the new row and this cycle's `R2`.
- **D8** — 2026-11-25, decision (fold): defect identity is authorship, not value shape — the resolver remembers the trio it exported (`selfExported`), and the withdrawal reads that record; value equality is kept only as the guard that the operator has not since edited a name the resolver wrote. Scope `unit-only`.
- **G5** — 2026-11-25, review's own gate run `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun scripts/local-gate.mjs` · HEAD 93dd4aefe7f314d37ef53f6a25992e0b50f68c45 · exit 0 · `PASS — 20 step(s) in 635s` (the review's `GATE-RAN` mark; no identical-head green mark existed to consume — G4 is at 955e65ecf and the F8 entry's `9cd0ee2` resolves to 0 of 14,253 objects).
- **R3** — 2026-11-25, review at HEAD 93dd4aefe7f314d37ef53f6a25992e0b50f68c45 · verdict REVIEW-FAIL · cycle 3 — started on the owner's explicit instruction (P14's two-cycle-cap note; P13 named this end review as the fold batch's next step) · gate exit 0 (G5) · axes run: review-code, review-security, review-verify, review-perf + inline API-ergonomics/usage-docs, each isolated (the classifier and debt transform likewise) · skipped: review-design/a11y/brand/seo (no UI/web surface) · cycle-≥2 re-verification: F1–F7 replayed at their cited locations (F1 `rg -c applyEmbedDefaultOnAtLoad` exit 1 in index.ts and factory.ts, F2 `runner verify SPEC.md` VERIFY PASS 0 violations, F3/F8 withdrawal rows 27 pass — the operator-credential rows live in the same suite, F4 direct README read confirmed the default statement, F5 `rg "lower ranks first"` exit 1, F7 `rg -c "EMBED_MAX_REQUEST_CHARS_ENV" packages` exit 1) — all hold, none regressed · F9–F11 new open (V9–V11), route fold.
- **V9** — docs/features/719-nan-default-embed/decisions.md:14,16 · reviewer review-change · HEAD 93dd4aefe7f314d37ef53f6a25992e0b50f68c45 · recheck direct read: D5 still says "idempotent per D7" and D7 still asserts self-injection identity as "every value equals what this profile derives" with no supersession mark; `embed-profile.ts:446`'s docstring cites "(D7)" for the authorship mechanism D8 replaced; the F8 `## Log` entry carries no `swept:` declaration (FOLDING.md §sweep-declaration@1: "A fold that changes a token/claim-shaped surface and emits no declaration is a `workflow` finding at review") · confirmed
- **V10** — .agentic-workflow/gate/gate-receipt.json · reviewer review-change · HEAD 93dd4aefe7f314d37ef53f6a25992e0b50f68c45 · recheck command output: `env -u AGENTIC_WORKFLOW_SKILLS_ROOT bun packages/agentic-workflow/bin/agentic-workflow.mjs gate-receipt verify` → `GATE RECEIPT — status: missing · verdict: fail` (exit 3); `.agentic-workflow/gate/` absent; the fold's gate citation `9cd0ee2` matches none of `git rev-list --all`'s 14,253 objects · confirmed
- **V11** — docs/features/719-nan-default-embed/planning-evidence.md:18-24 · reviewer review-change · HEAD 93dd4aefe7f314d37ef53f6a25992e0b50f68c45 · recheck direct read: PE-009/PE-010/PE-011 carry `planned` while their confirming evidence landed in E16/E17/E20 (PE-001…PE-008 were all flipped) — and PE-009's value-equality claim was itself superseded by D8, so its close is `superseded`, never a plain `confirmed` flip · confirmed

## Next

All thirteen phases are closed; the fold batch is published and PR [#720](https://github.com/gtrabanco/agentic-workflow/pull/720) integrates cleanly (`MERGEABLE` / `CLEAN`).

Hand off the mandatory end review of the fold batch:
`→ Next: /review-change on the changed HEAD`

## References

- Tracked issue #719 (closes via `Closes #719`).
- PR: https://github.com/gtrabanco/agentic-workflow/pull/720
- Companion fix #718 (`docs/ROADMAP.md:244`) — the embed-pass defects, parallel-safe.
- Pre-spec: `docs/pre-spec/2026-11-24-719-nan-default-embed.md`.
- Memory (Engram topic `aw-index-partial-embeddings`, project `sosfelinosbasti`;
  topic `nan-embeddings-usage-debug`, project `agentic-workflow`): the live
  evidence behind the issue and the recorded owner proposal (preset ships the
  profile; the runner crate stays provider-neutral/config-driven).
