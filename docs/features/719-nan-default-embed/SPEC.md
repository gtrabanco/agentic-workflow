---
type: feature
scope: standard
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
operator's explicit route. A strictly additive unit — the surface inventory
receipt is recorded at plan time via
`runner residual-classify --inventory --base <rev>`.

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
suites are pinned at the plan step.

## Known pre-existing issues

- `unavailable-embeddings-not-configured` is the current honest degradation
  for a keyword-only store (`packages/agentic-workflow/src/doc/config.mjs:10`);
  #718's fixes (silent embed stage, fetch timeout, 600 s cap, sync lease,
  inert hook) are pre-existing on the same embed pass — recorded `affects`
  only if this unit needs a sync during acceptance runs, else
  `does-not-affect` (they live in the companion unit).

## Tasks

Cut at the plan step from the triage block — this section stays
`n/a — tasks are cut at plan` until then.

### Planning evidence

For M/L: `planning-evidence.md` in the unit folder — named here, never
duplicated. Cut at the plan step.

### Obligations

For M/L: `planning-obligations.md` in the unit folder — named here, never
duplicated. Cut at the plan step.

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
- **E1** — 2026-11-24, `runner ceremony tier classify` · exit 0 · `tier: standard` (`empty-change` — the branch names no path yet; re-read at the implement step).
- **E2** — 2026-11-24, `runner memory probe` · exit 0 · `MEMORY PROBE — degraded` (`session-ambiguity`: 21 findings across `ambiguous_active_runtime_sessions`/`sync_target_closed_space`). Recorded once; memory writes proceed per `references/MEMORY.md`.
- **E3** — 2026-11-24, `agentic-workflow elicitation check --bank … --spec …` · exit 0 · `ELICITATION CHECK PASS · 5 row(s) · 0 question(s) · feature`.
- **E4** — 2026-11-24, research receipts (skipped-research exit) · repo-answered — R1–R8 in [research.md](research.md): the crate already resolves an env-only provider (`embeddings.mjs:138`), but that precedence makes env beat an explicit `index.json` block, so the S4 override semantics need a read-then-inject decision (design); four uncertainties stated, none guessed.
- **P1** — 2026-11-24 23:30 UTC, pre-spec written and checked; unit doc created from template with Specs/Non-goals/Impact from issue #719; triage block pasted verbatim; relay route recorded inline (no legs dispatched without owner approval); commit `docs(features): open feature 719 nan-default-embed from issue #719`.

## Next

Run the fused design+plan pass (activity-fusion@1) over the four uncertainties
in [research.md](research.md).

## References

- Tracked issue #719 (closes via `Closes #719`).
- Companion fix #718 (`docs/ROADMAP.md:244`) — the embed-pass defects, parallel-safe.
- Pre-spec: `docs/pre-spec/2026-11-24-719-nan-default-embed.md`.
- Memory (Engram topic `aw-index-partial-embeddings`, project `sosfelinosbasti`;
  topic `nan-embeddings-usage-debug`, project `agentic-workflow`): the live
  evidence behind the issue and the recorded owner proposal (preset ships the
  profile; the runner crate stays provider-neutral/config-driven).
