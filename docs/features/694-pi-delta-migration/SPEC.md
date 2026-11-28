---
type: feature
scope: large
ac-hash: f8426b35a70348ddbf642b971296989d2ccd0391795c8db4de5a8bc8edfbf2ef
roadmap_summary: Issue [#694](https://github.com/gtrabanco/agentic-workflow/issues/694) (L): the Pi 1.2→1.6 host delta — the settings picker's reimplemented subsequence filter is retired for the host's public `fuzzyFilter` (provider-`/` constraint kept as a pre-filter), both Pi packages ship a versioned `CHANGELOG.md` behind `pi.changelogPath` (written by the release cut, never by hand), the settings overlay reports blocked program status, the NaN preset documents the `models.json` `$schema`/`compat.*` channel, and the README baseline is re-pinned to the verified 1.6.1 host with the event matrix's source citation corrected.
---

# 694 — pi-delta-migration

> One-line: the Pi host delta is closed by deleting our copy of a host utility and
> adopting the release-train surfaces that fit existing uses, with the verified
> baseline re-pinned to the host the packages were actually checked against.

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
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
```

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.
`S1` is the operator's request; `S2`–`S7` quote issue #694's own text, which `S1`
incorporates by reference.

**S1 — Apply issue #694 to this repository.**
> Apply to this repository: issue #694

**S2 — Retire the picker filter reimplementation.**
> 1. **Filter reimplementation retirement (owner-ordered priority).**
>    `packages/pi-agentic-workflow/src/settings/picker.ts:19-22` records a
>    decision from the 0.99.x era: *"confirmed `@earendil-works/pi-coding-agent`'s
>    `fuzzyFilter` is internal, so the package carries its own
>    subsequence/slash-aware `filterReferences`"*. That was true for the
>    **pi-coding-agent** surface only; the host's public fuzzy utilities live in
>    **`@earendil-works/pi-tui`** — a package we already import as a peer — and
>    were verified live against pi-tui **1.6.0**:
>
>    ```js
>    import { fuzzyFilter, fuzzyMatch } from "@earendil-works/pi-tui";
>    fuzzyFilter(["nan/glm5.3","nan/glm5.3-flash","nan/deepseek-v4-flash","anthropic/claude-opus-5-5"], "flash", r=>r)
>    // → ["nan/glm5.3-flash","nan/deepseek-v4-flash"]  (case-insensitive, best-match order)
>    fuzzyMatch("opus","anthropic/claude-opus-5-5") // → { matches: true, score: -32.6 }
>    ```
>
>    Semantic deltas to resolve with an owner decision (the current contract is
>    OB-2/OB-3 in the picker's docs):
>
>    | Behavior | ours (`filterReferences`) | host (`fuzzyFilter`) |
>    |---|---|---|
>    | Case sensitivity | case-sensitive (`charCodeAt`) | case-insensitive |
>    | Trailing `/` token | provider-segment prefix constraint (`nan/` matches provider `nan` only) | none — slash is just a token separator; a bare model id containing `nan` would also match |
>    | Result order | input order preserved (stable for `initial` preselection, OB-3) | sorted by match quality |
>    | Match class | pure subsequence | subsequence + scoring, contiguous-occurrence bonus, alphanumeric-swap retry |
>
>    Plan: migrate the picker's narrowing to `fuzzyFilter`, keeping the
>    trailing-`/` provider constraint as a pre-filter predicate on the
>    provider segment (or dropping that feature if the owner prefers the
>    simpler contract), re-pin OB-2/OB-3 if ordering changes, and delete
>    `filterReferences`/`isSubsequence`/`matchesToken` — no compatibility shim
>    (IR6). The `test/picker-filter.test.mjs` corpus is rewritten for the new
>    expected behavior **before** the swap (tests-first; IR3 does not apply —
>    this is a deliberate contract change, ordered by the owner, and the
>    behavioral deltas are declared above).

**S3 — Adopt `pi.changelogPath`.**
> 2. **Adopt `pi.changelogPath` (1.5.0).** Neither package ships a `CHANGELOG.md`
>    nor declares the key, so *Extension Updates* shows nothing for them. Add a
>    versioned changelog to both packages plus `"pi": { "changelogPath":
>    "./CHANGELOG.md" }`.

**S4 — Adopt `blocked` for the settings picker overlay.**
> 3. **Adopt `blocked: true` for the settings picker overlay (1.5.1).**
>    `richUi()` opens the picker via `base.custom(..., { overlay: true })`; also
>    pass `blocked` so pi reports blocked program status (OSC 7501) while the
>    settings console waits for input.

**S5 — models.json guidance for the NaN preset.**
> 4. **models.json guidance.** Document (and optionally emit) for the NaN
>    preset: published `$schema` keys (1.2.0) for editor validation, and the
>    `compat.*` compatibility keys (1.5.0/1.5.1 — `supportsMessageThreads`,
>    `requiresToolsWithToolHistory`, `promptCacheKeyMode`,
>    `requiresNonNullAssistantContent`) as the sanctioned channel beside the
>    known `max_completion_tokens` workaround (NaN provider issue #34), in case
>    the gateway starts requiring one of them.

**S6 — Delta verification and baseline re-pin.**
> 5. **Delta verification and baseline re-pin.** Run the two-leg
>    `tsc --noEmit` (floor + `latest`→1.6.0), re-verify the runtime-relevant
>    breaking changes below against the installed host, and **replace** the
>    single dated `Also verified against Pi …` entry in README Notes with the
>    1.6.0 record (the `verified-baseline.test.mjs` contract requires exactly
>    one entry — replace, never append).

**S7 — The issue's acceptance criteria, verbatim.**
> - [ ] `filterReferences` deleted; picker narrowing runs on `fuzzyFilter` with
>       the owner-decided treatment of the trailing-`/` constraint and result
>       ordering; the rewritten corpus is red before the swap and green after
> - [ ] `pi.changelogPath` wired and changelogs present in both packages
> - [ ] Picker overlay passes `blocked: true`
> - [ ] models.json guidance ( `$schema` + `compat.*`) documented in the NaN
>       preset README docs with the issue-#34 workaround cross-reference
> - [ ] README Notes baseline replaced with a dated 1.6.0 entry; `verified-baseline.test.mjs`
>       green; the matrix `source` citation updated if the catalogue changed
> - [ ] State-flow backend runtime dispatch verified against 1.6.0 concurrency
>       semantics, with the outcome recorded in the unit doc

## Acceptance criteria

Frozen at cut. `S1` is the umbrella request, so its criterion is the conjunction
of the rest. Each criterion names the check that proves it.

- **AC-S1** — The five in-scope items land in one change, each proved by its own
  criterion below, with the repository's deterministic gates green. Proved by:
  every criterion `AC-S2`…`AC-S7` holds in the same handoff.
- **AC-S2** — The picker's narrowing is the host's public `fuzzyFilter`; the
  in-package filter and both of its helpers are gone, the trailing-`/` provider
  constraint survives as a pre-filter predicate, and the rewritten corpus was
  observed red before the swap and green after. Proved by:
  `rg -n 'filterReferences|isSubsequence|matchesToken' packages/pi-agentic-workflow/src` → no
  match, and `bun test packages/pi-agentic-workflow/test/picker-filter.test.mjs`
  exits 0.
- **AC-S3** — Both Pi packages ship a versioned `CHANGELOG.md`, declare
  `pi.changelogPath: "./CHANGELOG.md"`, list the file in `files`, and the release
  cut writes the newest section (never a hand edit). Proved by:
  `bun test packages/pi-agentic-workflow/test/changelog-path.test.mjs` exits 0 and
  `bun test scripts/release.test.mjs` exits 0.
- **AC-S4** — The settings picker overlay passes the host's `blocked` option with
  the verified shape, so a host that supports it reports blocked program status
  while the console waits. Proved by:
  `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` exits 0.
- **AC-S5** — The NaN preset README documents the `models.json` `$schema` key and
  the four `compat.*` keys in force at the verified host, beside the recorded
  `max_completion_tokens` workaround. Proved by:
  `rg -c 'models.schema.json|supportsMessageThreads|requiresToolsWithToolHistory|promptCacheKeyMode|requiresNonNullAssistantContent' packages/pi-nan-agentic-workflow/README.md` → ≥ 5.
- **AC-S6** — The README carries exactly one dated verified baseline at the host
  the two-leg `tsc --noEmit` was run against, and the event matrix's `source`
  citation names that same host version. Proved by:
  `bun test packages/pi-agentic-workflow/test/verified-baseline.test.mjs` exits 0 and
  `bun test packages/pi-agentic-workflow/test/event-reliability-matrix.test.mjs` exits 0.
- **AC-S7** — The state-flow backend's `sendUserMessage` dispatch is checked
  against the host's concurrency semantics (a run start counts as busy), and the
  outcome — change needed or not — is recorded in `## Log`. Proved by:
  the `D`-line decision in `decisions.md` plus the `E`-line evidence run in `## Log`.

## Impact

- `packages/pi-agentic-workflow/src/settings/picker.ts` — the narrowing function
  changes identity (`filterReferences` → `narrowReferences`), so every comment
  that names the old contract (`OB-2`) is re-pinned in the same change. Its only
  consumer is `createPickerComponent` in the same file.
- `packages/pi-agentic-workflow/test/picker-filter.test.mjs` — the corpus is
  rewritten for the new expected behaviour before the swap. `IR3` does not apply:
  the owner ordered the contract change in issue #694 and declared the deltas.
- `packages/pi-agentic-workflow/src/extension/index.ts` — `richUi()`'s overlay
  options gain `blocked`. The peer floor stays `>=1.1.0`, whose typings predate
  the option, so the option crosses the boundary as a declared, cast seam
  (verified: `PE-004`, `PE-005`); a host that predates 1.5.1 ignores it.
- The READMEs of both Pi packages — user-facing prose, and the pi package's
  `## Notes` verified baseline is a machine-read claim (`verified-baseline.test.mjs`).
- `scripts/release.mjs` — the cut becomes the single writer of each package's
  changelog section, beside the root companion row it already writes. A hand edit
  of a package changelog is a defect this unit's test refuses.
- `docs/workflow/CONFIG.md` — the `pi-event-reliability@1` matrix's `source`
  directive names the host version the catalogue was read from; the registered
  event set does not move.
- Readers of `bun scripts/local-gate.mjs`'s `pi-compat-guard` step: both legs
  (`1.1.0` floor + `latest`) compile `src/` against types this unit reads
  through a cast, so neither leg may start failing.
- Forge trail — the PR closes `#694`.

## Surfaces

- packages/pi-agentic-workflow
- packages/pi-nan-agentic-workflow
- scripts
- docs

## Retirements

| retired claim / pin | replacement | negative-capability evidence |
|---|---|---|
| `filterReferences`, `isSubsequence`, `matchesToken` (`src/settings/picker.ts`) | the host's `fuzzyFilter` behind `narrowReferences` | `rg -n 'filterReferences\|isSubsequence\|matchesToken' packages/pi-agentic-workflow` → 0 after P3 (the historical names survive only in frozen closed-unit records and `docs/LOGS.md`, which are history, never a live contract) |
| the module comment's PE-004 claim ("pi-coding-agent's `fuzzyFilter` is internal") | the verified fact: the public fuzzy utilities live in `@earendil-works/pi-tui`, exported since 1.1.0 | the comment is rewritten in the same edit; `rg -c 'PE-004' packages/pi-agentic-workflow/src/settings/picker.ts` → 0 (no match — re-scoped to the retired module by external-verify A1: the two whole-`src` hits are untouched, different-unit citations) |
| README `Also verified against Pi 1.5.0 (2026-11-02)` | the dated record for the host this unit verified (S6) | `rg -c '1\.5\.0' packages/pi-agentic-workflow/README.md` → 0 after P6 (the 1.5.0 record survives only in the frozen `CHANGELOG.md` release note, which is history) |
| the event matrix's `source` citation naming `@1.5.2` and a 37-event catalogue | the verified host version and the machine-derived catalogue count | `rg -n 'pi-coding-agent@1\.5\.2\|37-event' docs/workflow/CONFIG.md` → 0 after P6 |

Nothing is deleted that still has a consumer: `PI`-free helper names are internal
(`isSubsequence`/`matchesToken` were never exported) and `filterReferences`' only
caller is the component in its own module.

## Non-goals

Quoted from the issue, verbatim:

> - Raising the peer floor (`>=1.1.0` stays valid — no breaking in the range
>   touches the surface we use).
> - Upgrading `pi-extensible-workflows` (6.4.0 is still the latest published
>   release; pin unchanged).
> - Any pi-web-only API (`AgentSessionRuntime.takeUnreportedDiagnostics()`,
>   1.6.0) — SDK host surface, not ours.
> - Changing the currency of `docs/workflow/CONFIG.md`'s event matrix beyond the
>   `source` citation bump if the catalogue count is still 37 in 1.6.0 (verified
>   in-scope item 5 reports it).

Plus, declared by this unit: no workspace-lock pin bump (the two fixes that would
have needed one are resolved without it — verified in `PE-004`/`PE-005`), no
`pi-nan-provider` upgrade, and no second changelog writer.

## Risk tier

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true}`
- **Named high-risk item** — none — not a high-tier unit.

The tier is `standard` by hand for this local workflow only: the operator's
instruction (§4) substitutes a direct application for the lane's machinery, so
the classifier's `ceremony tier classify` verdict is not re-run here. The change
touches a published package's user-facing picker and its release writer, so the
repository's deterministic gates run in full.

## Future

none

## Future cost

- **A new host release is a re-verification unit.** `pi-compat-guard`'s `latest`
  leg is a moving tripwire, not a pin: a breaking Pi release reddens this repo
  first, and the reaction is a unit like this one — never a pin bump alone.
- **The package changelog is written by the cut.** Whoever changes
  `scripts/release.mjs apply` must keep writing the package section beside the
  root companion row; `changelog-path.test.mjs` fails the moment a manifest
  version and the shipped changelog's newest section disagree.
- **The picker's ordering is the host's.** A future pi-tui that changes
  `fuzzyFilter`'s scoring changes what the picker shows first; the corpus asserts
  match sets and best-match properties, never exact score values, so a scoring
  change is visible as a behaviour decision, not a silent test edit.

## Applicable tests

- `cd packages/pi-agentic-workflow && bun run test` — the package suite
  (picker filtering, the component, the shipped adapter, the baseline reader,
  the matrix reader, the new changelog-path reader).
- `cd packages/pi-nan-agentic-workflow && bun run test` — the companion package
  suite (the README is its only surface this unit touches).
- `bun test scripts/release.test.mjs` — the cut's changelog writer.
- `bun scripts/local-gate.mjs --only pi-compat-guard --jobs 1` — the two-leg
  `tsc --noEmit` (network; the frozen-failure instrument of S6).
- `node scripts/run-root-suite.mjs` — the root suites, including
  `scripts/docs-generate`'s projection check.

## Known pre-existing issues

- **Six `pi-agentic-workflow` tests fail on this machine while
  `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` is exported** — they assert the *absent*
  embedding-key defaults (`#719 AC6`, `default-on: an absent provider block…`,
  `default-on: an index.json carrying no provider key…`, `withhold: without the
  key variable…`, `withhold: an empty key variable…`, `tuning: the default-on
  path exports the preset's measured pair…`). Measured this session: 6 fail with
  the variables set, 1159 pass with them unset. **Does not affect** this unit —
  the failing surface is the embed-profile default, untouched here; the suites
  are run with the variables unset, the same way the repository's own gate logs
  record it.

## Tasks

P1…P7, dependency-topological first, smallest within a ready set.

- P1 — Cut this unit doc and freeze both planning ledgers beside it
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-doc 694-pi-delta-migration validate` exits 0)
  (Implements: S1)
  - Relevant files: docs/features/694-pi-delta-migration/
- P2 — Rewrite the picker filter corpus for the new contract and observe it red
  against the un-swapped source
  (validator: `bun test packages/pi-agentic-workflow/test/picker-filter.test.mjs` exits 1 before P3, 0 after)
  (Implements: S2, S7)
  - Relevant files: packages/pi-agentic-workflow/test/picker-filter.test.mjs
- P3 — Swap the picker's narrowing to the host `fuzzyFilter` behind
  `narrowReferences` (provider `/` pre-filter kept) and delete the three helpers
  (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0 with the
  embedding variables unset)
  (Implements: S2, S7)
  - Relevant files: packages/pi-agentic-workflow/src/settings/picker.ts
- P4 — Ship a versioned `CHANGELOG.md` in both packages behind
  `pi.changelogPath`, and make the release cut its single writer
  (validator: `bun test packages/pi-agentic-workflow/test/changelog-path.test.mjs`
  and `bun test scripts/release.test.mjs` exit 0)
  (Implements: S3, S7)
  - Relevant files: packages/pi-agentic-workflow/{package.json,CHANGELOG.md}, packages/pi-nan-agentic-workflow/{package.json,CHANGELOG.md}, scripts/release.mjs, packages/pi-agentic-workflow/test/changelog-path.test.mjs
- P5 — Pass the host's `blocked` option from the settings overlay and pin it
  (validator: `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` exits 0)
  (Implements: S4, S7)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- P6 — Re-pin the verified baseline, correct the event matrix's source citation,
  document the `models.json` channel and the picker's new search contract
  (validator: `bun test packages/pi-agentic-workflow/test/verified-baseline.test.mjs`
  and `bun test packages/pi-agentic-workflow/test/event-reliability-matrix.test.mjs`
  exit 0)
  (Implements: S5, S6, S7)
  - Relevant files: packages/pi-agentic-workflow/README.md, packages/pi-nan-agentic-workflow/README.md, docs/workflow/CONFIG.md
- P7 — Verification: the two-leg `tsc --noEmit`, the three package/root suites, the
  roadmap row through the emitter, the changeset and the session journal fragment
  (validator: `bun scripts/local-gate.mjs --skip-network --jobs auto` exits 0,
  and `bun scripts/local-gate.mjs --only pi-compat-guard --jobs 1` exits 0)
  (Implements: S1, S6, S7)
  - Relevant files: docs/ROADMAP.md, .changeset/, scripts/local-gate.mjs

### Planning evidence

Frozen at cut in `planning-evidence.md` (M/L shape) — never embedded here.

### Obligations

Frozen at cut in `planning-obligations.md` (M/L shape) — never embedded here.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-27, the operator's request, verbatim:
  ```
  Apply to this repository: issue #694
  ```
  inside the operator's local, unpublished workflow for changing
  agentic-workflow itself (intent resolved from state; frozen-failure corpus
  first; fixtures before the real tree; work inline — no `review-change`, no
  `audit-pr`, no fold cycle; the deterministic gates always).
- **L2** — 2026-11-27, issue #694's in-scope items and acceptance criteria,
  quoted verbatim as `S2`–`S7` above (the request `S1` incorporates it by
  reference).
- **D1** — 2026-11-27, the trailing-`/` provider constraint **stays**, as the
  issue's own Plan orders first; the alternative ("dropping that feature if the
  owner prefers the simpler contract") needs an owner preference that no evidence
  states, so the conservative reading is taken. Authority: S2.
- **D2** — 2026-11-27, `blocked` is passed as the host's verified object shape
  (`{ kind, message }`), not the `blocked: true` the issue's shorthand writes: the
  installed 1.6.1 typings declare `blocked?: { kind: NonNullable<ProgramStatus["kind"]>; message: string }`
  (`dist/core/extensions/types.d.ts:148-161`), and a boolean cannot compile.
  Authority: S4 + `PE-004`.
- **D3** — 2026-11-27, the option crosses the call boundary as a declared cast
  seam, so the peer floor (`>=1.1.0`, whose typings predate it) keeps compiling.
  Authority: S4 + `PE-005` + the Non-goals' floor sentence.
- **D4** — 2026-11-27, the verified baseline records **1.6.1** (2026-11-27), the
  host actually installed and type-checked, not the `1.6.0` literal the issue
  predicted: the 1.6.0 delta is contained in 1.6.1, `verified-baseline.test.mjs`
  requires one entry at or above the floor, and recording an unverified literal
  would falsify the claim. Authority: S6 + `PE-003`.
- **D5** — 2026-11-27, the event matrix's `source` citation is corrected to the
  verified host and to the catalogue count the machine derives (**41** `pi.on`
  overloads), not the `37` it carried: the event *set* is unchanged across
  1.5.2→1.6.1, so no matrix row moves. Authority: S6 (out-of-scope's condition
  "if the catalogue count is still 37" is not met — it never was). Authority:
  `PE-008`.
- **D6** — 2026-11-27, the package changelog's single writer is the release cut
  (`scripts/release.mjs apply`), beside the root companion row it already writes;
  a hand-written package changelog would be a second writer for one fact.
  Authority: S3 + `PE-007` + AGENTS.md §Repository indexes (emitters, never hand
  edits).
- **E1** — 2026-11-27, the suite baseline, measured before any edit:
  `cd packages/pi-agentic-workflow && bun run test` · exit 1 · `6 tests failed`,
  every one of them the embed-profile default-on case this session's
  `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` variables invert (the pre-existing issue
  recorded above).
- **E2** — 2026-11-27, the same command with those four variables unset (the
  repository's own gate logs' form) · exit 0 · `1159 pass, 0 fail`.
- **E3** — 2026-11-27, the frozen-failure reproducer of S2, at the red commit
  `05dc25e0d`: `bun test test/picker-filter.test.mjs` · exit 1 ·
  `Export named 'narrowReferences' not found in module …dist/settings/picker.js`
  — the rewritten corpus fails on the contract the swap introduces, never on a
  description of the old one.
- **E4** — 2026-11-27, the same corpus at the implementation commit `2c2eafa30` ·
  exit 0 · `9 pass`, and the whole package suite `1162 pass, 0 fail` (the seven
  retired cases became nine: the provider-constraint, the case-insensitive and
  the offered-order cases are new).
- **E5** — 2026-11-27, the S3 frozen-failure reproducer, at the red commit
  `8b09ae249`: `bun test packages/pi-agentic-workflow/test/changelog-path.test.mjs`
  · exit 1 · `6 fail` (both packages declare no `pi.changelogPath` and ship no
  changelog), and `bun test scripts/release.test.mjs` · exit 1 · `3 fail` (the
  cut writes no package section, and does not refuse an escaping path).
- **E6** — 2026-11-27, after the implementation commit `943e7bc02` · both exit 0 ·
  `changelog-path 7 pass`, `release 83 pass`.
- **E7** — 2026-11-27, the S4 frozen-failure reproducer, at the red commit
  `89b8427b5`: `bun test test/shipped-adapter.test.mjs` · exit 1 · `1 fail` (the
  overlay passes `overlay: true` and no `blocked`).
- **E8** — 2026-11-27, after the implementation commit `65774c59b` · exit 0 ·
  `shipped-adapter 30 pass`, the whole package suite `1170 pass, 0 fail`.
- **E9** — 2026-11-27, the differential check on `scripts/release.mjs`, run
  against a `git archive` copy of the base commit `0623612ed` (`mktemp -d`, both
  sides installed from the workspace lock, then removed): on a fixture whose
  packages declare no `pi.changelogPath`, `plan` and `apply` are byte-identical
  on stdout, stderr, exit code and every resulting file; on the same fixture
  with the key declared, `apply` differs only by the intended bytes — one extra
  report line and the new `CHANGELOG.md` — and nothing else moved.
- **E10** — 2026-11-27, `rg -n 'filterReferences|isSubsequence|matchesToken'
  packages/pi-agentic-workflow/src` · exit 1 · no match (the three names are
  gone from the shipped source, no shim behind them).
- **E11** — 2026-11-27, `rg -c 'models\.schema\.json|supportsMessageThreads|requiresToolsWithToolHistory|promptCacheKeyMode|requiresNonNullAssistantContent'
  packages/pi-nan-agentic-workflow/README.md` · exit 0 · `7` (the `$schema` URL
  and each of the four `compat.*` keys are named).
- **E12** — 2026-11-27, `rg -n 'pi-coding-agent@1\.5\.2|37-event' docs/workflow/CONFIG.md`
  · exit 1 · no match (the stale citation is replaced, not duplicated), and the
  browser's own count `rg -o 'on\(event: "[a-z_]+"' <installed>/dist/core/extensions/types.d.ts | wc -l`
  · `41` — the number the corrected citation states.
- **E13** — 2026-11-27, the pinned type-check legs the issue's item 5 asks for,
  each in its own `mktemp -d` copy of `src/` installed from the registry:
  `tsc --noEmit` against `pi-coding-agent@1.6.0` + `pi-tui@1.6.0` · exit 0, and
  against `1.6.1` + `1.6.1` · exit 0.
- **E14** — 2026-11-27, the S6 instrument, `bun scripts/local-gate.mjs --only
  pi-compat-guard --jobs 1` · exit 0 · `pi leg 1.1.0: tsc --noEmit clean`,
  `pi leg latest: tsc --noEmit clean` (the registry's `latest` is 1.7.0 today —
  the moving tripwire, recorded rather than assumed).
- **E15** — 2026-11-27, the state-flow backend's dispatch, checked against the
  installed host (S7's last bullet): `pi.sendUserMessage(…, { expandPromptTemplates: true })`
  dispatches an extension command instead of starting a turn, and its two call
  sites are not inside a streaming run — `stateFlow.start` runs from a command
  handler (`src/routing/dispatch.ts:394`) and `stateFlow.settle` from the
  `agent_settled` handler, where the host documents "`ctx.isIdle()` is true"
  (`docs/extensions.md` § `agent_settled`, and its own `pi.sendUserMessage`
  command-dispatch example). **Outcome: no change needed, nothing swallowed** —
  the 1.2.0 busy-on-run-start window is entered by a run, and neither call site
  opens one.
- **E16** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  unit-doc 694-pi-delta-migration validate` · exit 0 · `{"ok": true,
  "violations": []}`; the real changelogs round-trip through the shared
  `splitSections` reader byte-identically (1 section each, head `[4.10.1]`).
- **G1** — 2026-11-27, `node scripts/run-root-suite.mjs` · **exit 1** twice, and
  both reds are this unit's own, recorded rather than excused: the first named
  `packages/pi-agentic-workflow/README.md: lines 1421 > 1415` (the new prose
  overran the declared document budget), the second named
  `scripts/structural-sibling-pins.test.mjs` pin A (the changelog writer carried
  a fence-blind `^## ` heading search). Both were repaired in the change it
  judges — the README tightened and its budget re-pinned with a source note, the
  writer moved onto the shared `splitSections` reader — never by relaxing a
  check.
- **G2** — 2026-11-27, `bun scripts/local-gate.mjs --skip-network --jobs auto` ·
  exit 0 · `local-gate: PASS — 16 step(s) in 819s` (root suite, both crate
  suites under both runtimes, schema build, the pi and pi-node compat steps,
  docs-generated projection, secret scan, context budgets, version parity).
- **G3** — 2026-11-27, the same gate re-run at the closing head (`5d770cfc6`),
  after the two reds G1 records were repaired · exit 0 ·
  `local-gate: PASS — 16 step(s) in 796s` — this is the receipt the handoff
  stands on; G1 is kept because a red gate is never erased from the record.
- **E17** — 2026-11-27, `bun scripts/version-parity-gate.mjs --pins` · exit 0 ·
  `VERDICT: PASS`, every exact pin equal to its local package version (this
  unit moves no pin, so the train is untouched).
- **P1** — 2026-11-27 21:5x, the unit doc, both planning ledgers and the
  decision record frozen before the first line of code · `00f04cc73`.
- **P2** — 2026-11-27 22:0x, the picker corpus rewritten for the new contract
  and observed red · `05dc25e0d`.
- **P3** — 2026-11-27 22:1x, the narrowing swapped onto the host filter and the
  three in-package helpers deleted · `2c2eafa30`.
- **P4** — 2026-11-27 22:2x, the changelog surface: red corpus `8b09ae249`, then
  both packages' `CHANGELOG.md` behind `pi.changelogPath` and the cut as their
  single writer · `943e7bc02`.
- **P5** — 2026-11-27 22:3x, the overlay's blocked status: red `89b8427b5`, then
  the option through one declared cast · `65774c59b`.
- **P6** — 2026-11-27 22:4x, the baseline re-pin, the search-contract prose, the
  NaN `models.json` channel and the matrix citation · `9570b8260`.
- **E18** — 2026-11-27, the branch pushed and the PR opened against `main`:
  [PR #750](https://github.com/gtrabanco/agentic-workflow/pull/750) · the push's
  pre-push gate ran the offline subset · `local-gate: PASS — 18 step(s) in 831s`.
  The first push attempt failed in that same hook because this session exports
  `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`, which inverts the six embed-profile cases
  recorded under `## Known pre-existing issues`; the hook was re-run with those
  four variables unset and passed — the environment, not the change.
- **P7** — 2026-11-27 22:5x, the roadmap row through the emitter plus the
  release intent · `22a106fcf`; the verification recorded above (E13, E14, G2)
  and this closing record land together.
- **L3** — 2026-11-28, the operator's correction request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
  applied as one correction batch over the 2026-11-28 `EXTERNAL VERIFY`
  receipt ([`external-verify.md`](external-verify.md), blockers B1–B2; the
  batch also folds advisories A1–A2, with A3–A5 triaged no-fix in the handoff).
- **D7** — 2026-11-28, the state-flow dispatch needs **no change** — the
  outcome of S7's last bullet, now recorded as the `D`-line decision AC-S7 and
  O14 name as half of their proof (external-verify B1): `pi.sendUserMessage`
  dispatches an extension command instead of starting a turn, and neither call
  site opens a run, so the 1.2.0 busy-on-run-start window is never entered by
  the dispatch — nothing swallowed. Mirrors `decisions.md` D7. Authority: S7
  bullet 6 + `PE-017` + `E15`, `E19`.
- **E19** — 2026-11-28, O14's validator re-run in the correction batch, now
  `D`-grounded: `rg -n 'sendUserMessage' packages/pi-agentic-workflow/src/extension/index.ts`
  · exit 0 · the dispatch at `:215`/`:216`
  (``pi.sendUserMessage(`/${STATE_FLOW_START_COMMAND}`, { expandPromptTemplates: true })``)
  plus the passthrough at `:518`; the installed host's concurrency text
  (`~/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md:336`)
  · “Pi counts as busy while a run starts, including the compaction check and
  `before_agent_start`, so messages sent meanwhile go into the starting run.”
  and its `agent_settled` example (`:691`) · “`ctx.isIdle()` is true; runs
  requested here start after all settled handlers finish.” — outcome per
  **D7**: no change needed, nothing swallowed. Obligation O14 flipped back to
  `verified` on this run.
- **E20** — 2026-11-28, the Retirements row's negative evidence, corrected
  (external-verify A1): `rg -c 'PE-004' packages/pi-agentic-workflow/src/settings/picker.ts`
  · exit 1 · no match — the retired module carries no PE-004 claim; the two
  whole-`src` hits the receipt counted are untouched, different-unit citations
  (`extension/index.ts:98`, `hooks/runner.ts:20`).
- **G4** — 2026-11-28, the B2 recheck in the correction batch: `roadmap rowUpsert`
  settled row 694 to `done · [#750](https://github.com/gtrabanco/agentic-workflow/pull/750)`
  (receipt before `a70491a9` → after `67a32ecd`, byte-identical to the
  `mktemp -d` fixture's splice), `bun scripts/docs-generate.mjs` re-synced
  `docs/generated/units.md` (`verdict: PASS`), and `bun scripts/roadmap-settle.mjs`
  · exit 0 · `289 unit docs checked · verdict: PASS · violations: 0`.
- **G5** — 2026-11-28, the correction batch's gate (the P7 validator that was
  red at the receipt's head): `env -u AGENTIC_WORKFLOW_DOC_EMBEDDINGS_* bun scripts/local-gate.mjs --skip-network --jobs auto`
  · exit 0 · `local-gate: PASS — 16 step(s) in 588s` — root-suite green with
  `roadmap-settle` inside it, both crate suites, schema and pi compat steps,
  projection, budgets, secret scan and version parity.

- **R1** — 2026-11-28, review at HEAD 90d163fb89f7b075ad6a82a4e5956c9d78281d84 · verdict REVIEW-FAIL · cycle 1 · gate exit 0 (G6) · axes run: review-code, review-security, review-verify, review-perf, review-brand; skipped design/a11y (no new UI/TUI surface — the picker change reuses the existing component) and review-seo (no web surface) · F1 open; SUGGESTION rows (perf bench, gate receipt, README:1409 parenthetical) carried in the report, never persisted.
- **V1** — packages/pi-nan-agentic-workflow/CHANGELOG.md:10 · reviewer review-change · HEAD 90d163fb89f7b075ad6a82a4e5956c9d78281d84 · recheck direct read — the shipped sentence reads "…train; no content change its own post-4.10.0 changes ride the pending changesets at the next cut." with the em dash its sibling rows carry missing, and the garble seeded from the source companion row at `CHANGELOG.md:86` (sibling `CHANGELOG.md:92` reads "no content change — its own"); materializable reproducer: `rg -c 'no content change its own' packages/pi-nan-agentic-workflow/CHANGELOG.md CHANGELOG.md` exits 0 with 2 hits · confirmed
- **G6** — 2026-11-28, review's own gate run produced by `runner gate-receipt run`
  (`scripts/local-gate.mjs`, full 20-step gate) · HEAD 90d163fb89f7b075ad6a82a4e5956c9d78281d84 ·
  exit 0 · `local-gate: PASS — 20 step(s) in 462s` · receipt `gate-receipt@1` verdict `pass`
  (20 checks pass at `.agentic-workflow/gate/gate-receipt.json`; an identical-run RED
  preceded — root-suite red at `scripts/findings-corpus.test.mjs:208` on the corpus pins
  this append itself raises — its pins were raised +1/+1 with the delta documented in
  the same file, the mechanism the corpus gate's own comment endorses, never relaxed)
  · manifest f22f28fdf67a04836e1a42c9e2a8679eeaf4e2a4f9c5afb1ada44f5243cd8b6f
- **F1** — 2026-11-28, F1 folded: the fold repaired the single writer and
the seeded copy together: the source companion row (`CHANGELOG.md:86`) carries the em
dash its sibling row (`:92`) always had, and the shipped copy
(`packages/pi-nan-agentic-workflow/CHANGELOG.md:10`) — re-seeded from that row — reads
coherently; the cut writer (`scripts/release.mjs` `escapeCell` + `summaryFor`) delivers
the repaired summary from here on. Sweep: the stale form now survives only in this
doc's `V1` quote and in `external-verify.md`'s A5 quote (both history, never a claim).
  swept: /no content change its own post-4\.10\.0/ → expected 2 in docs/**/*.md

## Next

Correction batch applied over the 2026-11-28 `EXTERNAL VERIFY` receipt
(blockers B1–B2 fixed, advisories A1–A2 folded, A3–A5 triaged no-fix with
grounds in the handoff) and its recheck is green: G4 (the settle) and G5 (the
full offline gate). Next: the delta external-verify on this batch's head —
re-check B1/B2 and one spot check. Nothing here claims done until that verdict.

## References

- Issue [#694](https://github.com/gtrabanco/agentic-workflow/issues/694) — the
  request (`S1`). [PR #750](https://github.com/gtrabanco/agentic-workflow/pull/750)
  closes it via `Closes #694`.
- `docs/fix/370-pi-150-compat-reverification/` — the previous re-verification
  unit; its `PE-004` recorded that 1.5.0 overlays ignored `blocked`, which 1.5.1
  changed (verified here as `PE-004`).
