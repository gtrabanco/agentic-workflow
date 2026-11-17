---
type: feature
scope: large
roadmap_summary: Issue [#470](https://github.com/gtrabanco/agentic-workflow/issues/470) (M): a content guard layer in the deterministic collection path — sanitizer, config-gated author-provenance policy and fencing over third-party forge content before a model sees it; `CONTENT_GUARD_REASONS` published by the schema package and a discipline test that fails an unfiltered ingestion seam. Applied inline per the owner's local workflow on `feat/470-content-guard-layer` (2026-11-17); hidden-content sanitizer + author policy + fence live in `packages/agentic-workflow/src/content-guard.mjs`, wired at the two collection seams that carry forge text into a model-visible envelope
---

# 470 — content-guard-layer

> Sanitize, gate by author provenance, and fence every piece of third-party forge
> content the deterministic collection layer ingests — before any model sees it.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#470` — a content guard layer in the deterministic collection path. The PR must
close it via `Closes #470` in the body.

## Specs

**S1 — the owner's turn text: apply issue #470 to this repository, inline.**
> Apply to this repository: issue #470

**S2 — the goal: sanitizer + author-provenance policy before any model sees forge content.**
> A **content guard layer** in the deterministic collection path: every piece of third-party content the workflow reads from the forge — issue bodies, issue/PR comments, review comments, PR titles and descriptions, code comments in changed files — passes a sanitizer and an author-provenance policy **before** any model sees it. Untrusted content is filtered, fenced, and reported; it never reaches the agent as raw instruction-bearing text.

**S3 — guards live in deterministic code, at the collection seam, never in model discipline.**
> **Guards live in deterministic code, never in model discipline.** The filter runs in the collection layer (where `collectIssues` already lives in the sensors; the same seam for PR/review collection). "Ignore your author filter" arriving in a comment is text the filter already processed — it cannot retroactively disable itself. Same philosophy as `path-policy` (the model can never allow what policy denies) and #444's discipline test.

**S4 — author provenance policy, config-gated: trusted roles only by default, everything else excluded and declared.**
> **Author provenance policy (config-gated).** Reads `authorAssociation` (GitHub: OWNER / MEMBER / COLLABORATOR vs CONTRIBUTOR / FIRST_TIME_CONTRIBUTOR / NONE). Default policy: only trusted roles are ingested as readable content; content from other roles is **excluded and declared** (a `degraded[]`-style entry naming issue/comment and role) — never silently dropped, never silently included. Configurable allow/deny lists of logins and stricter/looser role sets via the unified config (#427).

**S5 — hidden-content sanitizer: strip and report, never silently.**
> **Hidden-content sanitizer.** Before ingestion: strip and report HTML comments (`<!-- -->`), invisible Unicode (zero-width, bidi controls, tag characters, variation selectors used to smuggle text), and homoglyph-normalized instruction-lookalikes where detectable. Anything removed is counted and reported per source — removal is never silent, so an operator can audit what a third party hid.

**S6 — fencing, not just filtering: content arrives as bounded, labeled data.**
> **Fencing, not just filtering.** Content that passes the policy is delivered to the model **as data, bounded and labeled**: it arrives inside a declared envelope marking it third-party content, never interleaved with the workflow's own instructions. An instruction inside a fenced comment is content to report, not an order to follow.

**S7 — the declared vocabulary lives in the schema package.**
> **Declared vocabulary.** `CONTENT_GUARD_REASONS` in the schema package — the sibling of `PATH_GUARD_REASONS` (per the normative-surfaces rule: a schema-export owned surface, `must-name: yes`).

**S8 — fail-closed: unconfigured is strictest, a guard failure excludes and declares.**
> **Fail-closed.** Unconfigured → the strictest default (trusted-roles-only). A guard failure (policy unreadable, sanitizer error) → the content is excluded and declared, never ingested raw.

**S9 — the discipline test: no producer consumes unfiltered third-party content.**
> **Discipline test (hard rule, #444 pattern).** A suite bans any gate, receipt, or verdict producer from consuming unfiltered third-party content; the sanitized path is the only ingestion path the code exposes.

**S10 — no silent exclusions and no silent inclusions; every guard decision is reported.**
> No silent exclusions and no silent inclusions — every guard decision is reported.

**S11 — skills stay stack-agnostic; the seam lives in the package/crate layers and the sensors' collection modules.**
> Skills stay stack-agnostic: no forge-specific handling in `skills/`; the seam lives in the package/crate layers and the sensors' collection modules.

**S12 — surface reduction, not a security claim: the residual risk is documented and the runtime permission model stays the backstop.**
> Surface reduction, not a security claim: the residual risk (a trusted account compromised, or semantics-only injection in visible text) is documented in the unit doc, and the runtime permission model stays the backstop.

**S13 — acceptance: strictest default with no config, and owner-authored content byte-identical to today.**
> With no config, the guard layer is active with the strictest default policy (trusted roles only; hidden content stripped) — and the workflow's own owner-authored content flows byte-identically to today for this repository's current usage.

**S14 — acceptance: the vocabulary declared, inventoried, version-bumped in the same change.**
> `CONTENT_GUARD_REASONS` declared in the schema package, wired into the normative-surfaces inventory, version bump in the same change.

**S15 — acceptance: root suites, affected package suites, version-parity gate.**
> Root suites + affected package suites pass; version-parity gate covers touched packages.

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words.
S1 is the owner's turn text verbatim; S2–S15 quote the tracked issue's own
sections verbatim at the revision this unit was cut from (the issue is the
authority, the turn text picks the verb).

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

**Consumers of the new surface**

- `scripts/batch-scheduler.mjs` — `collectIssues()` is the planner's forge
  collection seam: it reads issue `title`/`body` into `normalizeIssues()` and
  those strings reach the `batch-plan@3` envelope the model reads. It is now a
  guard seam (S3).
- `packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` —
  `readForgeState()` collects open issues and open PRs; the issue **titles** are
  emitted in the sensor envelope (`urgent`, `design_candidates`), so they are a
  model-visible ingestion seam. It is now a guard seam (S3).
- `packages/agentic-workflow-schema` — publishes `CONTENT_GUARD_REASONS` and the
  `contentGuard` config section; the crate consumes both (S7, S4).

**What the guard consumes from elsewhere**

- The unified config (#427, closed): the `contentGuard` section resolved by
  `createConfigApi` over project-over-global with shipped defaults (S4).
- The forge's `authorAssociation` per issue/PR. Verified against the pinned `gh`
  2.46.0 (PE-002): `gh issue list --json` has **no** `authorAssociation` field,
  while the REST issues endpoint carries `author_association` and
  `gh api --paginate` pages it — one collection path for both seams.

**What stops being true when this lands**

- The claim that a `scripts/` producer may read a forge `title`/`body` field
  directly: the discipline suite pins the declared seams to the guard (S9).
- `batch-plan@3`'s degradations gain guard codes; a plan over an untrusted or
  unreadable-author issue declares the exclusion instead of silently using the
  body (S10).

**What to ask before touching something live on the other side**

- None: no config key is required for the layer to be active (S13), and no
  unconfigured project changes behaviour on owner-authored content.

## Retirements

Strictly additive: nothing is retired. The computed surface inventory of the
change (the anti-divergence receipt) is `E5` in `## Log`, produced by
`bun scripts/residual-classify.mjs --inventory --base <base-rev>`.

- No existing vocabulary value is removed or renamed; `PATH_GUARD_REASONS` stays
  the policy sibling it always was.
- No existing collection call is deleted: `collectIssues` and `readForgeState`
  keep their names, signatures and degradation vocabularies; the guard is
  inserted inside them.
- `ENVELOPE`/`batch-plan@3` gain `detail`-level guard entries; no field is
  removed, so no consumer rewrite is owed.

## Non-goals

- **A complete solution to prompt injection** — it does not exist. Semantics-only
  injection in visible trusted-role text stays out of the filter and belongs to
  the review passes (S12).
- **`npx`, sandbox or permission changes**: `path-policy` and the session's own
  permission model remain separate and authoritative.
- **Rate limiting or forge abuse prevention** — unrelated threat class.
- **A collector for every content kind S2 names.** The layer's API accepts every
  kind, but the deterministic seams that exist today carry issue titles, issue
  bodies and PR titles. Issue/PR comments, review comments and changed-file code
  comments reach a model through the model's own `gh`/file reads (skill prose),
  not through a collection module — intercepting those needs a new deterministic
  collector, which is a separate unit. The gap is declared in `## Future` and in
  the residual note, never implied away (S10, S12).
- **Rewriting visible text.** Homoglyph detection reports and strips only a
  token that mixes scripts *and* normalizes to an instruction keyword; it never
  re-writes a word to its ASCII twin, because a mutation nobody asked for is a
  regression of every downstream byte comparison (S13).

## Risk tier

Computed at cut, never chosen — `runner ceremony tier classify` over the planned
paths:

- **Tier** — `standard` · **Task Size** — `understood: true`, `contained_risk: contained`, `resumable_from_diff: true` (`ceremony: unit-doc`, `verification: gates`)
- **Named high-risk item** — none — `signals: []` (`reason_kind: executable-content`, 6 escalating paths)
- **Verdict receipt** — `E1` in `## Log` (contract `risk-tier-verdict@1`, verbatim above)

## Future

- **Kind-complete collection for comments and code comments.** A deterministic
  collector for issue/PR comments, review comments and comment spans in changed
  files, routed through `guardForgeContent` — needs a diff/comment reader this
  repository does not have today (recorded 2026-11-17, status: `open`).
  Consumer of the guard's already-accepted `CONTENT_SOURCES` kinds that have no
  producer yet.

## Future cost

- Every new deterministic collection path that reads forge text must route
  through `guardForgeContent` and declare itself in
  `scripts/content-guard-discipline.test.mjs`'s seam table, or the suite fails.
  Binds: whoever adds a sensor/collector (S3, S9).
- A looser `contentGuard` policy (a wider `trustedRoles`, an `allowLogins` entry)
  is a security decision the operator owns; changing a default requires the
  config-doc row and this unit's residual note to move with it. Binds: the owner
  and any config-section editor (S4).

## Applicable tests

- `bun test packages/agentic-workflow-schema/test/content-guard.test.mjs` — the
  published vocabulary, the section descriptor, the tighten-only merge.
- `bun test packages/agentic-workflow/test/content-guard.test.mjs` — sanitizer,
  fence, policy resolution, guard pipeline, association collector.
- `bun test packages/agentic-workflow/test/workflow-status.test.mjs` — the
  sensor's previous behaviour pinned (title emitted for a trusted author,
  excluded-and-declared for an unknown one).
- `bun test scripts/batch-scheduler.test.mjs` — the planner's previous
  behaviour pinned plus the injected-payload reproducer.
- `bun test scripts/content-guard-discipline.test.mjs` — the discipline suite
  (S9).
- `node scripts/run-root-suite.mjs` — the whole root gate (S15).

## Known pre-existing issues

- `gh 2.46.0` (pinned by the environment, not by this repo) has no
  `authorAssociation` JSON field on `issue list`/`pr list` — **does-not-affect**:
  the layer reads the REST issues endpoint, verified in PE-002.
- The repo's own machine markers (`<!-- audit-pr:merge-ready … -->`,
  `<!-- review-change:… -->`) are HTML comments and therefore *hidden content* by
  the sanitizer's definition — **does-not-affect**: those parsers
  (`scripts/audit-pr-gate.mjs`, `scripts/review-receipt.mjs`) read machine
  markers, never model-visible prose, and are deliberately outside the guard's
  seams. Recorded here so a later unit does not "fix" the marker grammar.

## Acceptance criteria

One observable criterion per requirement; each names the check that proves it.
The section is frozen from here (`ac-hash`).

- **AC1 (S1, S2)** — the layer exists as one deterministic module
  (`packages/agentic-workflow/src/content-guard.mjs`) exporting the sanitizer,
  the policy resolver, the fence and the single ingestion function; every forge
  string the two seams deliver is the guarded value.
  *Proved by:* `bun test packages/agentic-workflow/test/content-guard.test.mjs`
  exits 0 with the sanitizer/fence/pipeline cases, **and**
  `rg -c 'guardForgeContent' scripts/batch-scheduler.mjs packages/agentic-workflow/src/runner/sensors/workflow-status.mjs`
  matches `2` (one per seam).
- **AC2 (S3)** — the guard runs inside the collection layer, before the value is
  stored or emitted: a payload injected in a fixture's `title`/`body` is already
  stripped in `collectIssues()`'s return value.
  *Proved by:* the payload case in `scripts/batch-scheduler.test.mjs`
  (`collectIssues()` output carries no hidden byte) exits 0.
- **AC3 (S4)** — with no config the policy is the strictest default
  (`trustedRoles = OWNER, MEMBER, COLLABORATOR`, empty allow/deny lists); an
  `OWNER` flows through, a `CONTRIBUTOR`/`NONE` is excluded with a declared entry
  naming the source and the role, `allowLogins` admits a named login and
  `denyLogins` refuses one regardless of role.
  *Proved by:* the policy table in
  `packages/agentic-workflow/test/content-guard.test.mjs` exits 0.
- **AC4 (S5)** — HTML comments (including an unterminated one), zero-width,
  bidi-control, tag and variation-selector characters, control characters and a
  mixed-script token that normalizes to an instruction keyword are removed, each
  counted by kind and reported per source; clean content comes out byte-identical.
  *Proved by:* the sanitizer table in
  `packages/agentic-workflow/test/content-guard.test.mjs` exits 0 — same input
  bytes in, same bytes out for the clean case.
- **AC5 (S6)** — allowed content is delivered inside a declared fence carrying
  source, id, author and association; content cannot close its own fence (an
  injected terminator is neutralized and counted), so the delivered text has
  exactly one open and one close marker.
  *Proved by:* the fence cases in
  `packages/agentic-workflow/test/content-guard.test.mjs` exits 0.
- **AC6 (S7, S14)** — `CONTENT_GUARD_REASONS` is published by
  `packages/agentic-workflow-schema/src/content-guard.ts`, exported from the
  package index, and registered in the `normative-surfaces@1` inventory as a
  `schema-export:` row with `must-name: yes`.
  *Proved by:* `bun test scripts/normative-drift.test.mjs` exits 0, **and**
  `bun run --cwd packages/agentic-workflow-schema test` exits 0.
- **AC7 (S8)** — a malformed or unreadable policy resolves to the strictest
  default with a declared `malformed-config`/`missing-config` degradation; an
  unknown/absent author association is excluded with reason `unknown-author`,
  never ingested.
  *Proved by:* the fail-closed cases in
  `packages/agentic-workflow/test/content-guard.test.mjs` exits 0.
- **AC8 (S9)** — a discipline suite fails when a declared seam does not route
  through the guard, and fails when a forge `title`/`body` field is read in a
  seam outside the guard call.
  *Proved by:* `bun test scripts/content-guard-discipline.test.mjs` exits 0,
  including its two injected-disagreement cases (red under an injected tree).
- **AC9 (S10)** — every guard decision is reported: the seam's degradations name
  each excluded source and role, and each removal count, so an operator can audit
  what a third party hid.
  *Proved by:* the degradations assertions in `scripts/batch-scheduler.test.mjs`
  and `packages/agentic-workflow/test/workflow-status.test.mjs` exit 0.
- **AC10 (S11)** — no forge-specific handling enters `skills/`: the change adds
  none, and the guard's home is the crate + schema package.
  *Proved by:* `git diff --name-only <base> -- skills/` matches `0` lines.
- **AC11 (S12)** — the unit doc records the residual (trusted account
  compromise, semantics-only visible-text injection, the kinds with no
  deterministic collector, homoglyph detection being keyword-bounded) and states
  that the runtime permission model remains the backstop.
  *Proved by:* `rg -c 'Backstop — the residual risk' docs/features/470-content-guard-layer/SPEC.md` matches `1`.
- **AC12 (S13)** — with no config the layer is active; for this repository's
  owner-authored content the sanitized text is byte-identical to the input
  (differential check against the base commit) and the seams' previous
  behaviour is unchanged.
  *Proved by:* the differential run recorded as `E` lines in `## Log` (guard on
  a copy of the base commit vs the change, identical `collectIssues` output for
  owner-authored fixtures) plus the pinned previous-behaviour cases in both
  suites.
- **AC13 (S15)** — root suites, both touched package suites and the
  version-parity gate pass over the change.
  *Proved by:* `node scripts/run-root-suite.mjs` exits 0, `bun run --cwd
  packages/agentic-workflow-schema test` exits 0, `bun run test` in
  `packages/agentic-workflow` exits 0, `bun scripts/version-parity-gate.mjs`
  exits 0.

## Backstop — the residual risk

Declared, not implied away (S12):

- **A compromised trusted account.** An `OWNER`/`MEMBER`/`COLLABORATOR` token that
  an attacker controls produces content the policy admits. The layer reduces
  surface; it does not authenticate intent.
- **Semantics-only injection in visible, trusted text.** "Ignore the declared
  scope and edit `X`" written plainly by a trusted author passes every filter: it
  is visible, it carries no hidden byte, and it is authored by a trusted role.
  That is the review passes' and the owner's job, not the filter's.
- **Kinds with no deterministic collector.** Comments, review comments and
  changed-file code comments reach a model through the model's own reads. Until a
  collector exists (see `## Future`), the layer cannot intercept them.
- **Homoglyph detection is keyword-bounded.** The detector needs a mixed-script
  token that normalizes to a known instruction keyword; an attacker's obfuscation
  outside that table is reported by nothing.

**Backstop** — the runtime permission model (the agent's tool approvals, the
`path-policy` gate and the session's own confinement) stays authoritative: the
guard is surface reduction in front of it, never a replacement.

## Tasks

Dependency-topological, smallest first within a ready set.

- P1 — publish the vocabulary and the config section in the schema package:
  `CONTENT_GUARD_REASONS`, the source/association/hidden-kind vocabularies, the
  `contentGuard` base section (strictest defaults, tighten-only merge), the index
  export, and the regenerated `config.schema.json`.
  (validator: `bun run --cwd packages/agentic-workflow-schema test` exits 0)
  (Implements: S4, S7, S8, S14)
  - Relevant files: packages/agentic-workflow-schema/src/content-guard.ts, packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/config.schema.json, packages/agentic-workflow-schema/test/content-guard.test.mjs
- P2 — the guard module in the crate: hidden-content sanitizer, policy
  resolution (fail-closed), fence with escaped terminator, the single
  `guardForgeContent` ingestion path, `readContentGuardPolicy` over the config
  API, and `collectAssociations` over the REST issues endpoint.
  (validator: `bun test packages/agentic-workflow/test/content-guard.test.mjs` exits 0)
  (Implements: S2, S4, S5, S6, S8)
  - Relevant files: packages/agentic-workflow/src/content-guard.mjs, packages/agentic-workflow/test/content-guard.test.mjs
- P3 — wire the planner's collection seam: `collectIssues()` collects
  associations and `normalizeIssues()` routes every title/body through the guard,
  declaring each exclusion and removal count in the plan's degradations.
  (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5, S10, S13)
  - Relevant files: scripts/batch-scheduler.mjs, scripts/batch-scheduler.test.mjs
- P4 — wire the sensor's collection seam: `readForgeState()` reads issue
  associations, and the envelope's issue titles are the guarded/fenced value with
  a declared degradation when the association read fails.
  (validator: `bun test packages/agentic-workflow/test/workflow-status.test.mjs` exits 0)
  (Implements: S2, S3, S4, S6, S10, S13)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/workflow-status.mjs, packages/agentic-workflow/test/workflow-status.test.mjs, scripts/workflow-status-sensor.test.mjs
- P5 — the discipline suite: the declared seam table, the static and behavioural
  checks, and the two injected-disagreement fixtures.
  (validator: `bun test scripts/content-guard-discipline.test.mjs` exits 0)
  (Implements: S9, S11)
  - Relevant files: scripts/content-guard-discipline.test.mjs
- P6 — docs and state: the normative-surfaces row, the config doc row, the crate
  README section, the changeset, the unit doc evidence/log, and the session entry.
  (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S7, S14, S12)
  - Relevant files: AGENTS.md, docs/workflow/CONFIG.md, packages/agentic-workflow/README.md, packages/agentic-workflow-schema/README.md, .changeset/470-content-guard-layer.md, docs/features/470-content-guard-layer/SPEC.md, docs/LOGS.md
- P7 — verification: the whole root gate, both package suites, the version-parity
  gate and the differential check.
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S12, S13, S15)
  - Relevant files: packages/agentic-workflow-schema/test/content-guard.test.mjs, packages/agentic-workflow/test/content-guard.test.mjs, scripts/content-guard-discipline.test.mjs, scripts/batch-scheduler.test.mjs

### Planning evidence

Frozen in the unit folder's `planning-evidence.md` (M/L home; this section names
it, never duplicates it).

### Obligations

Frozen in the unit folder's `planning-obligations.md` (M/L home; this section
names it, never duplicates it).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the owner's turn text, verbatim:
  ```
  Apply to this repository: issue #470
  ```
- **L2** — 2026-11-17, the tracked issue as written (authority for S2–S15),
  verbatim from `gh issue view 470 --json body`: goal, the six design bullets,
  the four non-negotiables, the acceptance criteria and the non-goals quoted in
  `## Specs`.
- **D1** — 2026-11-17, cut decision: the unit is a **feature** (`feat/470-…`,
  roadmap Features row 470), so its home is `docs/features/470-content-guard-layer/`
  — the owner's "unit dir `docs/fix/<issue>-<topic>/`" rule names the fix kind;
  the feature kind's equivalent home is the features folder (`docs/AGENTS.md`
  layout, roadmap row kind `feature`).
- **D2** — 2026-11-17, cut decision (S2 scope): the deterministic seams that
  carry forge text into a model-visible value today are `collectIssues()`
  (planner) and `readForgeState()` (sensor). Comment/code-comment kinds have no
  deterministic collector; recorded in `## Non-goals` + `## Future` + the residual
  section instead of shipping an unconsumed API surface.
- **D3** — 2026-11-17, cut decision (S5 scope): homoglyph handling is
  strip-and-report for a **mixed-script token that normalizes to an instruction
  keyword**; no visible word is rewritten, because a mutation nobody asked for
  would break the byte-identical acceptance (S13).
- **D4** — 2026-11-17, cut decision (S4 mechanism): the association is read from
  the REST issues endpoint (`gh api --paginate repos/{o}/{r}/issues`) because the
  pinned `gh` 2.46.0 has no `authorAssociation` JSON field on `issue list` —
  verified live, PE-002.

## Next

P1 — publish the vocabulary and the config section in the schema package.

## References

- Issue [#470](https://github.com/gtrabanco/agentic-workflow/issues/470) — the
  authority for `## Specs`; `Closes #470`.
- Roadmap row 470 (`docs/ROADMAP.md`, Features table) — `defined`, promoted
  2026-11-15, hard blocker #427 closed.
- Siblings the design copies: `packages/agentic-workflow/src/path-policy.mjs`
  (`PATH_GUARD_REASONS` + tighten-only resolution), the unified config
  (`docs/workflow/CONFIG.md`), the #444 discipline-test pattern.
