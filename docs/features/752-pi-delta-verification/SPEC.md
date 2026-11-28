---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and scope).
type: feature
scope: medium
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
roadmap_summary: pi 1.6.1→1.7.0 delta — decision-model classifiers reach pi, re-pin baseline, adopt diagnostics/blockedKind
---

# 752 — pi-delta-verification

> One-line: pi 1.6.1→1.7.0 delta — decision-model classifiers reach pi (#444's trigger), re-pin the baseline, adopt headless diagnostics/blockedKind.

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
between the quote markers.

**S1 — Verify delta against both packages.**
> Delta verification — the #694 method over 1.6.1+1.7.0 for both pi packages: two‑leg `tsc --noEmit` against pi 1.7.0; re‑read the event matrix (no new events published in 1.6.1–1.7.0); REPLACE the dated `Also verified against Pi …` README entry with one dated entry for 1.7.0 (the verified‑baseline test forbids a second entry; peer floor `>=1.1.0` unchanged).

**S2 — Adopt headless diagnostics.**
> Adopt: headless `diagnostics` (1.7.0 fix) — print/JSON/RPC modes no longer swallow an invalid `models.json`: `createAgentSessionServices()` returns the error as a warning in `diagnostics` (previously it surfaced as `Model \"...\" not found` / `No API key found`). The sensor/headless surfaces (workflow‑status envelope, the orchestration‑envelope drivers) and the future tool‑doctor host dimension can read config health deterministically.

**S3 — Adopt ctx.ui blockedKind.**
> Adopt: `ctx.ui` `blockedKind` (1.6.1) — `select()`/`confirm()`/`input()` dialogs can report OSC 7501 program status kind (`\"permission\"`, …), so an approval dialog a program‑status terminal renders as a permission request. Candidate consumer: the consent/ASK surface of #654's seam hooks.

**S4 — Cache-preservation re-measure (deferred).**
> Cache‑preservation re‑measure note for the #631 tier‑cost corpus and #632's `cache_posture` vocabulary owners.

**S5 — Route `after_provider_response` HTTP 4xx/5xx visibility.**
> Rate‑limit visibility the #495 pacing surfaces may consume — route separately from delta verification.

**S6 — Probe `--agent-dir <dir>` + OSC 7577.**
> A probe candidate for tool‑doctor's host‑dimension unit.

## Acceptance criteria

Frozen at cut, one criterion per `S#`, each naming the check that proves it.
`S1` is the umbrella request, so its criterion is the conjunction of the rest.

- **AC-S1** — The delta is verified against Pi 1.7.0 for both Pi packages: the
  peer-floor leg (`1.1.0`) and the `latest` leg (`1.7.0`) compile
  `packages/pi-agentic-workflow/src/` with `tsc --noEmit`, the companion
  package compiles, the event catalogue is re-read (41 `pi.on` overloads, an
  event name set identical to 1.6.1), and the README carries exactly one dated
  verified baseline naming `Pi 1.7.0 (2026-11-28)` at or above the manifest
  floor. Proved by: `bun scripts/local-gate.mjs --only pi-compat-guard --jobs 1`
  exits 0, `bun run --cwd packages/pi-nan-agentic-workflow build` exits 0,
  `bun test packages/pi-agentic-workflow/test/verified-baseline.test.mjs` exits
  0, and `bun test
  packages/pi-agentic-workflow/test/event-reliability-matrix.test.mjs` exits 0.
- **AC-S2** — A malformed `models.json` is reported by the headless host and the
  surface that owns `models.json` says so: the 1.7.0 print-mode run prints
  `Warning: models.json error: Invalid models.json schema` where 1.6.1 prints
  only `No API key found`, and the NaN preset README's `models.json` section
  carries the diagnostics sentence. Proved by: the differential run recorded as
  an `E` line, and `rg -c 'diagnostics'
  packages/pi-nan-agentic-workflow/README.md` matches at least 1.
- **AC-S3** — The dialogs this package opens report the blocked program status
  kind they actually wait for: the `SettingsUi` seam carries an optional
  `blockedKind`, `richUi` forwards it as `ExtensionUIDialogOptions.blockedKind`,
  the console's "add another?" confirm declares `question`, and the
  write-approval confirms declare `permission` — while the `1.1.0`/`1.4.0`
  typings still compile. Proved by: `bun test
  packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` exits 0 and `bun
  test packages/pi-agentic-workflow/test/settings-console.test.mjs` exits 0.
- **AC-S4/S5/S6** — The three routed capabilities (cache-preservation
  re-measure, `after_provider_response` error visibility, `--agent-dir` / OSC
  7577 probe) are recorded in `decisions.md` with their owner issue and are not
  implemented here. Proved by: `rg -c '#631|#632|#495|#705'
  docs/features/752-pi-delta-verification/decisions.md` matches at least 4 and
  `rg -n 'cacheWarming|cache_warming|after_provider_response|agent-dir'
  packages/*/src` exits 1.

## Impact

- `packages/pi-agentic-workflow/README.md` — the `## Notes` verified baseline is
  a machine-read claim (`verified-baseline.test.mjs` fails on a second claim, a
  baseline below the floor, or a floor sentence that disagrees with the
  manifest), so the re-pin is an edit there and nowhere else.
- `docs/workflow/CONFIG.md` — the `pi-event-reliability@1` matrix's `source`
  directive names the host release the catalogue was read from; the registered
  event set does not move.
- `packages/pi-agentic-workflow/src/routing/types.ts`, `src/extension/index.ts`,
  `src/settings/console.ts` — the dialog seam gains an optional blocked kind and
  the adapter forwards it; the peer floor (`>=1.1.0`) predates the option, so it
  crosses as a declared type seam, never a second implementation.
- `packages/pi-nan-agentic-workflow/README.md` — its `models.json` section owns
  the compatibility channel, so it is where the headless diagnostics reach a
  reader; the package's source is untouched.
- Readers of `pi-compat-guard`: both legs compile `src/`, so neither may start
  failing because of the new option.

## Surfaces

The batch scheduler's lane keys this unit occupies, one per line.

- `packages/pi-agentic-workflow`
- `packages/pi-nan-agentic-workflow`
- `docs/workflow/CONFIG.md`

## Retirements

None — this unit is additive: it adopts new capabilities and re-pins version references.

## Non-goals

- No implementation of SystemOne materiality judging (#444's downstream half).
- No change to the `after_provider_response` HTTP 4xx/5xx route — deferred.
- No cache-preservation re-measure implementation — deferred.

## Risk tier

The unit's ceremony is proportional to risk, and the tier is **computed, never chosen**: `runner ceremony tier classify` reads the change's paths and contents and emits `passive | standard | high` (owner: `skills/execute-phase/references/risk-tiers.md`, block `risk-tier-verdict@1`).

- **`standard`** — the ceremony this document describes.

**Task Size = Understood + Contained risk + Resumable-from-diff.**

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true}`
- **Named high-risk item** — `none — not a high-tier unit`

The tier is `standard` by hand for this local workflow only: the operator's
instruction substitutes a direct application for the lane's machinery, so the
classifier's verdict is not re-run here. The change touches a published
package's user-facing dialogs and a machine-read README claim, so the
repository's deterministic gates run in full.

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a date and a status: `open`, `planned`, or `discarded <YYYY-MM-DD>`.

- #444 (decision-substrate) — when activated, these classifiers are the trigger substrate (open, 2026-11-28)
- #614 (SystemOne substrate) — the "compatible endpoint" this delta reaches (open, 2026-11-28)
- #631 (tier-cost cache hit rate) — cache-preservation re-measure (open, 2026-11-28)
- #632 (model-aware phase batching) — `cache_posture` vocabulary (open, 2026-11-28)
- #705 (tool-doctor) — `diagnostics` probe and `--agent-dir` probe consumers (open, 2026-11-28)

## Future cost

Standing obligations this unit imposes on future work.

- The README's `Also verified against Pi` entry must stay single — no second dated entry allowed (verified-baseline test).
- The `diagnostics` adoption must be consumed by at least one of: workflow-status envelope, orchestration-envelope drivers, or tool-doctor host dimension.

## Applicable tests

The tests this unit will run (triage-decided).

- `bun test packages/pi-agentic-workflow/test/*`
- `bun test packages/agentic-workflow/test/*`
- `bun scripts/run-root-suite.mjs` (node-compatible subset)
- `tsc --noEmit` for both packages
- `runner unit-route --triage 752 --json` (triage sanity)
- Verified-baseline test (README entry uniqueness)

## Known pre-existing issues

- **#694** — the predecessor delta verification unit (same README entry pattern, merged). Affects: this unit must follow #694 in order to avoid conflicting with the same README entry.
- **#705** — tool-doctor check unit (related consumer for `diagnostics`). Does not affect: this unit operates independently on the version adoption.
- **#654** — guard-layer unit (related consumer for `blockedKind`). Does not affect: this unit adopts the capability; #654 consumes it.

## Tasks

P1…P7, dependency-topological first, smallest within a ready set. The frozen
row set lives in `planning-obligations.md`; each task names the obligations it
closes.

- P1 — Re-read the event matrix and re-pin its `source` citation to the verified
  host, leaving every row where it is
  (validator: `bun test packages/pi-agentic-workflow/test/event-reliability-matrix.test.mjs`
  exits 0) (Implements: S1) — closes `O4`, `O5`.
  - Relevant files: docs/workflow/CONFIG.md
- P2 — Replace the dated `Also verified against Pi …` README entry with the one
  dated 1.7.0 record
  (validator: `bun test packages/pi-agentic-workflow/test/verified-baseline.test.mjs`
  exits 0) (Implements: S1) — closes `O3`.
  - Relevant files: packages/pi-agentic-workflow/README.md
- P3 — Adopt headless `diagnostics`: record the invalid-`models.json`
  reproducer (1.6.1 silent, 1.7.0 warning) and document the behavior where
  `models.json` is owned
  (validator: `rg -c 'diagnostics' packages/pi-nan-agentic-workflow/README.md`
  matches at least 1) (Implements: S2) — closes `O6`, `O7`.
  - Relevant files: packages/pi-nan-agentic-workflow/README.md,
    packages/pi-agentic-workflow/README.md
- P4 — Adopt `ctx.ui` `blockedKind`: carry the kind through the settings seam
  and declare it on the dialogs whose intent the host default gets wrong
  (validator: `bun test packages/pi-agentic-workflow/test/settings-console.test.mjs`
  exits 0) (Implements: S3) — closes `O8`, `O9`.
  - Relevant files: packages/pi-agentic-workflow/src/routing/types.ts,
    packages/pi-agentic-workflow/src/extension/index.ts,
    packages/pi-agentic-workflow/src/settings/console.ts
- P5 — Record the three routed capabilities in `decisions.md` and implement none
  of them
  (validator: `rg -c '#631|#632|#495|#705' docs/features/752-pi-delta-verification/decisions.md`
  matches at least 4) (Implements: S4, S5, S6) — closes `O11`.
  - Relevant files: docs/features/752-pi-delta-verification/decisions.md
- P6 — Repository state: the roadmap row through the roadmap writer, the
  changeset, and the session journal fragment through `journal write`
  (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap
  read docs/ROADMAP.md --nn 752` reports a row that is no longer `idea`)
  (Implements: S1) — closes `O13`.
  - Relevant files: docs/ROADMAP.md, .changeset/, .agentic-workflow/journal/
- P7 — Verification: the two-leg `tsc --noEmit`, the companion package's
  compile, the full local gate, and the ledger closure
  (validator: `bun scripts/local-gate.mjs --jobs auto` exits 0 and the
  obligations table carries zero non-`verified` rows) (Implements: S1, S2, S3)
  — closes `O1`, `O2`, `O10`, `O12`, `O14`.
  - Relevant files: docs/features/752-pi-delta-verification/

## Triaged steps

```text
TRIAGE — 752 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/752-pi-delta-verification
relay-seam: ask (relay.seam; absent = ask) — the question stays open
relay-next: create .pi-web/relays/752-pi-delta-verification/ (charter → docs/features/752-pi-delta-verification/SPEC.md) · ASK the owner: relay legs, or inline `/execute-phase 752-pi-delta-verification P1` · STOP for the answer · on "relay" set `State: Active` in .pi-web/relays/752-pi-delta-verification/status.md then dispatch_relay(packet: ".pi-web/relays/752-pi-delta-verification", leg: "1") as the final action · legs: 8 = 7 phases + 1 coherence review
```

The relay question this block leaves open is answered by the operator's own
instruction for this local workflow: work inline, one direct application, no
relay leg and none of the review machinery. The step list above is still the
machine's, and the plan below keeps its shape.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind token from the closed set.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-28, the request, verbatim:
  ```
  pi 1.6.1→1.7.0 delta — decision-model classifiers reach pi (#444's trigger), re-pin the baseline, adopt headless diagnostics/blockedKind
  ```
- **L2** — 2026-11-28, issue #752's in-scope items and the capabilities it routes
  away, quoted verbatim as `S2`–`S6` above.
- **D1** — 2026-11-28, the unit is applied **inline**: one direct application, no
  relay leg, no `review-change`, no `audit-pr`, no fold cycle, no self-granted
  gate exception; only the repository's deterministic gates run. The triage
  block's open relay question is answered by this instruction. Authority: L1's
  local workflow. Row: `decisions.md` D1.
- **D2** — 2026-11-28, the headless `diagnostics` capability is adopted as a
  **verified host behavior plus documentation**, never as new code: no package in
  this repository creates an agent session (`rg -n
  'createAgentSessionServices|createAgentSession\(' packages/*/src` → no match),
  so there is no in-tree call site that could read the warning, and inventing a
  session runtime to have one would be a second implementation of the host's job.
  Authority: S2 + `PE-008`. Row: `decisions.md` D2.
- **D3** — 2026-11-28, the adopted claim rests on a **differential reproducer**
  and not on the changelog: the same scratch `PI_CODING_AGENT_DIR` holding
  `contextWindow: "32000"` prints the schema warning at 1.7.0 and nothing at
  1.6.1. Authority: S2 + `PE-009`. Rows: `decisions.md` D3, `O7`.
- **D4** — 2026-11-28, the console states its **own** blocked kind instead of
  inheriting the host default: `question` for every prompt, `permission`
  explicitly on the four dialogs that authorize a write or destroy a draft.
  `Add another?` is the one prompt the host's `confirm()` default would have
  reported as a permission request; the peer floor's typings predate the option,
  so it crosses as a declared type seam. Authority: S3 + `PE-006`, `PE-007`.
  Row: `decisions.md` D4.
- **D5** — 2026-11-28, the event matrix's `source` is re-pinned to
  `@earendil-works/pi-coding-agent@1.7.0` and its pi.dev clause records what this
  session checked (every one of the 41 event names present) instead of a
  page-revision claim it could not re-verify; no row moves because the catalogues
  of 1.6.1 and 1.7.0 are identical. Authority: S1 + `PE-002`, `PE-004`.
  Row: `decisions.md` D5.
- **D6** — 2026-11-28, the README records `Pi 1.7.0 (2026-11-28)` — the host the
  two-leg run was made against — and the peer floor stays `>=1.1.0`; the 1.6.1
  entry is replaced, never appended. Authority: S1 + `PE-001`, `PE-003`.
  Row: `decisions.md` D6.
- **D7** — 2026-11-28, the three capabilities the issue routes away
  (cache-preservation re-measure → #631/#632, `after_provider_response` HTTP error
  visibility → #495, `--agent-dir` / OSC 7577 → #705) are recorded and **not**
  implemented here. Authority: S4, S5, S6. Rows: `decisions.md` D7–D9, `O11`.
- **E1** — 2026-11-28, the frozen-failure corpus for `S1`, the event catalogue:
  `rg -o 'on\(event: "[a-z_]+"' ~/.bun/install/cache/@earendil-works/pi-coding-agent@{1.6.1,1.7.0}@@@1/dist/core/extensions/types.d.ts`
  · `41` / `41` extracted names, and the sorted name sets `diff` to nothing — the
  delta publishes no new event, so no matrix row can move.
- **E2** — 2026-11-28, `cd packages/pi-agentic-workflow && bun test
  test/event-reliability-matrix.test.mjs test/verified-baseline.test.mjs` · exit 0
  · `9 pass / 0 fail across 2 files` at the re-pinned citation and baseline.
- **E3** — 2026-11-28, the baseline and the routed-capability recordings, read
  back: `rg -c 'Also verified against Pi 1\.7\.0 \(2026-11-28\)'
  packages/pi-agentic-workflow/README.md` → `1`; `rg -c 'diagnostics'
  packages/pi-nan-agentic-workflow/README.md` → `1`; `rg -c
  '#631|#632|#495|#705' docs/features/752-pi-delta-verification/decisions.md` →
  `4`; `rg -c
  'cacheWarming|cache_warming|after_provider_response|agent-dir'
  packages/*/src` → no match (exit 1).
- **E4** — 2026-11-28, the frozen-failure reproducer for `S2`, run in a scratch
  `mktemp -d` with `{ "providers": { "nan": { "models": [ { "id": "x",
  "contextWindow": "32000" } ] } } }` as `models.json`, never against the live
  tree:
  - `PI_CODING_AGENT_DIR=<tmp> pi -p "say ok"` (1.7.0) → prints
    `Warning: models.json error: Invalid models.json schema:` /
    `- providers.nan.models.0.contextWindow: must be number`, then
    `No API key found for the selected model.`
  - `PI_CODING_AGENT_DIR=<tmp> bun ~/.bun/install/cache/@earendil-works/pi-coding-agent@1.6.1@@@1/dist/bundle/cli.js -p "say ok"`
    → prints only `Warning: No models available…` and `No API key found for the
    selected model.` — the swallowed-error shape the release fixed.
- **E5** — 2026-11-28, the new `S3` corpus, red before the implementation and
  green after:
  `bun test test/shipped-adapter.test.mjs` · exit 1 with `(fail) the dialog seam
  forwards the blocked kind the host renders (issue #752)` before the adapter
  change, exit 0 with `31 pass / 0 fail` after;
  `bun test test/settings-console.test.mjs` · exit 1 with `(fail) the console
  declares the blocked kind of every dialog that can wait (issue #752)` before
  the console change, exit 0 with `72 pass / 0 fail` after.
- **E6** — 2026-11-28, the untouched dialog flows:
  `bun test test/paged-select.test.mjs` · exit 0 · `8 pass / 0 fail` — the
  paging wrapper still drives `select(title, options)` per page.
- **E7** — 2026-11-28, the package suite at the change:
  `cd packages/pi-agentic-workflow && bun run test` · exit 0 · `1182 pass / 0
  fail across 99 files` (the four `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` variables
  unset, the pre-existing issue recorded above).
- **E8** — 2026-11-28, the companion package:
  `bun run --cwd packages/pi-nan-agentic-workflow build` · exit 0 · `tsc` clean.
- **G1** — 2026-11-28, the two-leg compile:
  `bun scripts/local-gate.mjs --only pi-compat-guard --jobs 1` · exit 0 ·
  `pi leg 1.1.0: tsc --noEmit clean`, `pi leg latest: tsc --noEmit clean`
  (`latest` = 1.7.0), `local-gate: PASS — 1 step(s) in 23s`.
- **P1** — 2026-11-28, the planning freeze: this unit doc cut with the frozen
  `## Acceptance criteria`, `planning-evidence.md` (11 rows) and
  `planning-obligations.md` (14 rows) beside it, since the unit is `medium`.
- **P2** — 2026-11-28, P1 (event matrix re-read and re-pin), P2 (README
  baseline), P3 (headless `diagnostics`), P4 (`blockedKind`), P5 (routed
  capabilities) and P6 (repository state) applied; see the commits in the
  handoff.

## Next

Run P1: re-read the event matrix and re-pin its `source` citation to Pi 1.7.0.

## References

- Issue: [#752](https://github.com/gtrabanco/agentic-workflow/issues/752)
- Roadmap: row 752
- #694 — predecessor delta verification (same README entry pattern)
- #444 — decision-substrate (trigger that fired)
- #705 — tool-doctor (diagnostics consumer)
- #654 — guard-layer (blockedKind consumer)
- #631 — tier-cost cache hit rate (cache preservation consumer)
- #632 — model-aware phase batching (cache posture consumer)
- #495 — pacing surfaces (after_provider_response consumer)