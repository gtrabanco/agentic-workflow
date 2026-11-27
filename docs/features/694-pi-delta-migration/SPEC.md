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
| the module comment's PE-004 claim ("pi-coding-agent's `fuzzyFilter` is internal") | the verified fact: the public fuzzy utilities live in `@earendil-works/pi-tui`, exported since 1.1.0 | the comment is rewritten in the same edit; `rg -c 'PE-004' packages/pi-agentic-workflow/src` → 0 |
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

## Next

P2: rewrite the picker filter corpus for the new contract and observe it red.

## References

- Issue [#694](https://github.com/gtrabanco/agentic-workflow/issues/694) — the
  request (`S1`). This unit's PR closes it.
- `docs/fix/370-pi-150-compat-reverification/` — the previous re-verification
  unit; its `PE-004` recorded that 1.5.0 overlays ignored `blocked`, which 1.5.1
  changed (verified here as `PE-004`).
