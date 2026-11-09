---
type: feature
scope: medium
---

# fix/410-projection-pipeline

> The pack-time projection: `bundle-skills.mjs` stops being byte-copy and becomes
> a transform that removes or pointerizes declared prose sections from the pi
> bundle, driven by a repo-internal manifest — with the parity contract redefined
> from byte-identity to declared projection. One source (`skills/`), two products
> (standalone full, pi projected).

## Issue

`#410` — tracked issue in the project's forge. The PR must close it via
`Closes #410` in the body.

Roadmap row: **109 `pi-bundle-stripper`**. The issue is the request; the roadmap
row is the index entry. The issue's triage update (2026-11-07) absorbs #411
(phase 2), #412 (phase 3) and #414 (phase 4); those phases freeze their own
ledger rows at their own cuts — this unit doc carries phase 1 (the issue body's
In scope) plus the two in-same-PR cleanup items the issue itself demands.

The unit was cut locally, under the owner's direct-application workflow for
changes to this repository itself, without the lane's own review machinery.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — The request.**
> Apply to this repository: issue #410

**S2 — Goal.**
> The pack-time projection: `bundle-skills.mjs` stops being byte-copy and becomes a transform that removes or pointerizes declared prose sections from the pi bundle, driven by a repo-internal manifest — with the parity contract redefined from byte-identity to *declared projection*. One source (`skills/`), two products (standalone full, pi projected).

**S3 — Business value.**
> The token-savings layer: pi agents stop carrying prose that deterministic code enforces, while standalone installs keep the full skill. The manifest is the auditable record of every substitution.

**S4 — Strip transform over the #407 locator.**
> Strip transform consuming the section-locator core (#407): ops `remove` (section / except-child / line-in-scope) and `pointerize` (replace body with a one-line pointer naming the enforcing command).

**S5 — Repo-internal, hash-bound manifest.**
> Projection manifest in `packages/pi-agentic-workflow/` (outside `files:` — never ships), hash-bound per removed range.

**S6 — Deterministic CI checks.**
> Deterministic CI checks: every rule resolves exactly 1 section; hash matches (differ → re-verify fail); 0 matches → `stale-rule` fail; every `remove` names an enforcing command that exists in the crate; golden snapshot of the stripped bundle; context budgets on the stripped copy; untouched bytes identical.

**S7 — Parity contract redefined.**
> Redefine `test/skill-parity.test.mjs` from byte-identity to declared-projection validation (filter spec drives the test).

**S8 — Golden fixture on the stripped copy.**
> Golden fixture runs against the stripped copy too.

**S9 — EMPTY manifest at ship.**
> Ships with an EMPTY manifest (no behavior change) — first entries land with the pi-guards issue.

**S10 — Out of scope.**
> Real manifest entries / prose removal (pi-guards issue); `prereq` op wiring (own issue — grammar may land here, execution does not); runtime code; source-tree `skills/` edits beyond pointer lines where ops demand them.

**S11 — AC: empty-manifest no-op.**
> Bundle with empty manifest is byte-identical to today's output (no-op proven by golden).

**S12 — AC: one synthetic entry end-to-end.**
> One synthetic manifest entry end-to-end: source untouched, stripped copy correct, CI green; tampered hash or ambiguous selector fails the gate with distinct codes.

**S13 — AC: no-entry degradation.**
> `unavailable`/degradation: skills with no manifest entry are untouched — always.

**S14 — Dependency: manifest grammar.**
> #406 (manifest grammar + hash binding)

**S15 — Dependency: section-locator core.**
> #407 (section-locator + splicer)

**S16 — The header contract is deliberately rewritten.**
> The `bundle-skills.mjs` header contract ("Nothing here edits skill prose") is deliberately rewritten in this unit — the SPEC must record the decision.

**S17 — Roadmap rendered-facts cleanup.**
> Rendered-facts cleanup: roadmap prose claiming "remark AST edit" vs shipped string-splicing — fix in the same PR.

**S18 — Absorbed phases.**
> Absorbs: #411 (phase 2), #412 (phase 3), #414 (phase 4) — see the merged-scope comment, 2026-11-07.

**S19 — Procedure (assumption, marked).**
The quoted local direct-application workflow delivered with the request (its §0–§9) governs this surgery: verbatim intent, ledgers before code, test-first slices, inline work with no self-review, foreground verification, the owner as external verifier.

## Impact

Beyond its own lines, this change touches:

- **`packages/pi-agentic-workflow/scripts/bundle-skills.mjs`** — gains the
  transform step after the copy. Its header contract changes (S16). The staged
  bundle stays gitignored build output, wiped on rebuild.
- **`packages/pi-agentic-workflow/test/skill-parity.test.mjs`** — its central
  byte-identity assertion is redefined, not weakened: byte-identity survives for
  every file without a manifest rule (S13), and becomes recomputed-projection
  for files with rules (S7).
- **The gate** — `pi-node-compat` runs this package's suite (`bundle:skills` +
  `tsc` + tests), so the projection checks are gate-enforced with no workflow
  edit.
- **Consumers of the bundle** — none today: the manifest ships EMPTY (S9), so
  the packed tarball is byte-identical to today's. First entries land with the
  pi-guards phase.
- **`docs/ROADMAP.md` row 65** — prose correction only (S17).
- **The `skills/` source tree is never edited by this unit** (S10): the
  transform reads the canonical tree and writes only the staged copy.

## Retirements

- **The unconditional byte-identity contract in `test/skill-parity.test.mjs`**
  ("every bundled file is byte-identical to its skills/ source") is retired in
  favor of declared-projection validation. Replacement: the same suite keeps
  byte-identity for files without rules and asserts `applyProjection(source) ==
  bundle` for files with rules. Negative-capability pin at cut:
  `rg -c 'every bundled file is byte-identical' packages/pi-agentic-workflow/test/skill-parity.test.mjs`
  → 0 after P4, with the replacement test carrying the guarantee.
- Nothing else is retired: no surface, helper, token or narrative dies here.

## Non-goals

- Real manifest entries / prose removal (the pi-guards phase's job) — the
  manifest ships with `rules: []` (S9, S10).
- `prereq` op execution — the grammar carries it; the stripper refuses it with a
  declared code (S10, O6).
- Runtime code, pi extension changes, source-tree `skills/` edits.
- The absorbed phases 2–4 (#411, #412, #414) — separate cuts in this unit's
  lane (S18).

## Risk tier

Computed, never chosen (`bun scripts/ceremony.mjs tier classify --paths …` over
the unit's declared paths, at the cut head):

```text
$tier-classify@1
"tier": "high"
"reason": "1 path(s) touch a named high-risk surface: destructive (packages/pi-agentic-workflow/test/skill-parity.test.mjs · node:fs · rmSync)"
"task_size": { "understood": true, "contained_risk": "named", "resumable_from_diff": true }
```

- **Tier** — `high` · **Task Size** — understood · contained risk (named) ·
  resumable from diff
- **Named high-risk item** — `destructive (packages/pi-agentic-workflow/test/skill-parity.test.mjs · node:fs · rmSync)`

The signal is pre-existing: the suite already imports `rmSync` at the cut head
(`skill-parity.test.mjs:11`) for tmpdir fixture cleanup, so touching the file at
all re-triggers it; the suite never removes anything outside its own
`mkdtemp` fixtures. The verdict's ceremony cell names `review-change`, which the
owner's direct-application workflow (S19, §4) substitutes with the foreground
verification hand-off — instruction precedence: the explicit prompt wins over
the repo's ceremony docs, and the substitution is recorded here rather than
silently taken.

## Future

- **2026-11-08** — `open` — the issue's triage update: phase 2 (diff-guard
  extraction, #411), phase 3 (pi wiring + first manifest entries, #412), phase 4
  (prereq injection, #414) land in this unit's lane after phase 1.

## Future cost

- Every future manifest entry binds its removed range by hash: any source edit
  under a ruled section changes the hash and the gate fails until the entry is
  re-verified. This is the intended friction — the manifest is the audit record.
- `test/skill-parity.test.mjs` is now manifest-driven: a manifest grammar change
  in the schema package is a same-PR change here (version-parity gate holds).

## Applicable tests

- `packages/pi-agentic-workflow/test/projection.test.mjs` (new, red-first)
- `packages/pi-agentic-workflow/test/skill-parity.test.mjs` (redefined)
- `packages/pi-agentic-workflow/test/bundle-lifecycle.test.mjs` (existing
  behavior holds: wipe-on-rebuild, clean, source untouched)
- `scripts/golden-fixture.test.mjs`, `scripts/normative-drift.test.mjs` (root
  gate; no new normative surface without its registration)

## Known pre-existing issues

- **`docs/ROADMAP.md` row 65 claims "remark AST edit"** for the doc toolchain,
  while #407/#366 shipped AST-located byte-offset splice. Observed at the cut
  head (`6f5d5453`). **Affects** this unit: S17 repairs it in the same PR.
- **`scripts/check-skill-context.mjs` is hardcoded to the repo `skills/` root**,
  so the stripped-copy budget check reimplements the same `ceil(bytes/4)`
  measure instead of invoking it. Observed at the cut head. **Does not affect**
  this unit's behavior; a root option is the pi-guards phase's concern if it
  wants gate-level budgets on the staged copy.
- **`scripts/log-immutability.test.mjs` is red at `main` (`6f5d5453`)**: the
  suite landed on `main` without the `scripts/log-immutability.mjs` module it
  imports — the implementation sits unmerged on `feat/468-log-immutability-guard`
  (`9b873e03`). Reproduced in a pristine base checkout (`git archive 6f5d5453`),
  so it is not this change's doing. **Affects** this unit's gate receipt only:
  the root-suite step bails there, so the root suites were re-run without that
  file (91/91 PASS, exit 0) and the scripted `local-gate` command as a whole
does not exit 0 on `main` today for this reason. **Does not affect** this
  unit's shipped behavior.

## Tasks

- P1 — RED suite for the projection module on a toy fixture tree, observed
  failing on the missing module (validator: `bun test packages/pi-agentic-workflow/test/projection.test.mjs` exits 1 at the red commit and exits 0 once P2 lands)
  (Implements: S4, S6, S12)
  Relevant files: packages/pi-agentic-workflow/test/projection.test.mjs
- P2 — Projection module: load + validate the manifest through the schema
  package, apply `remove` (section / except-child / line-in-scope) and
  `pointerize` over the #407 locator, verify hashes, resolve enforcement
  commands, emit the distinct failure codes; observed green over the P1 commit
  (validator: `bun test packages/pi-agentic-workflow/test/projection.test.mjs` exits 0)
  (Implements: S4, S6, S12)
  Relevant files: packages/pi-agentic-workflow/scripts/projection.mjs
- P3 — Wire the transform into `bundle-skills.mjs`, ship the EMPTY
  `projection-manifest.json` outside `files:`, rewrite the header contract
  (S16), differential no-op proof against the base commit
  (validator: `bun test packages/pi-agentic-workflow/test/bundle-lifecycle.test.mjs` exits 0 and the differential table in the `## Log` `E` line shows zero output deltas)
  (Implements: S2, S5, S9, S16)
  Relevant files: packages/pi-agentic-workflow/scripts/bundle-skills.mjs, packages/pi-agentic-workflow/projection-manifest.json
- P4 — Redefine `test/skill-parity.test.mjs` to declared-projection validation
  driven by the manifest; add the context-budget check on the stripped copy
  (validator: `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs` exits 0)
  (Implements: S7, S13)
  Relevant files: packages/pi-agentic-workflow/test/skill-parity.test.mjs
- P5 — Committed golden fixture of the stripped copy end-to-end: toy tree +
  manifest + expected stripped bytes, byte-compared
  (validator: `bun test packages/pi-agentic-workflow/test/projection.test.mjs` exits 0)
  (Implements: S8, S11)
  Relevant files: packages/pi-agentic-workflow/test/fixtures/projection-golden/
- P6 — Documentation, release intent and verification: pi package README,
  changeset, roadmap prose cleanup (S17), full local gate
  (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S3, S17)
  Relevant files: packages/pi-agentic-workflow/README.md, docs/ROADMAP.md, .changeset/410-projection-pipeline.md

### Planning evidence

The ledger lives in `planning-evidence.md` beside this doc (M/L sizing rule).

### Obligations

The ledger lives in `planning-obligations.md` beside this doc (M/L sizing rule).

## Triaged steps

This change is applied locally by the owner's direct-application workflow (no
lane, no `review-change`, no `audit-pr` on this unit), so the step list is the
task list above; the deterministic routers still judge the document.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #410
  ```
- **L2** — 2026-11-08, the issue body and triage update as they were written
  (frozen request; see S2–S18 for the verbatim cells, cut from
  `gh issue view 410` at head `6f5d5453`).
- **D1** — 2026-11-08, S16 (the issue's own "Open questions / risks" row): the
  `bundle-skills.mjs` header contract "Nothing here edits skill prose" is
  deliberately rewritten — the new contract states the manifest-driven
  transform that edits the staged copy only, never the source tree. Recorded
  in the header at `packages/pi-agentic-workflow/scripts/bundle-skills.mjs:1-13`.
- **D2** — 2026-11-08, pointerize removed-bytes boundary pinned: a `pointerize`
  binds the section body — everything after the heading line's newline, blank
  separator included — and its replacement preserves the body's trailing
  newline shape. `except` entries are child heading paths relative to the
  removed section. Pinned by `test/projection.test.mjs` and the golden fixture.
- **L3** — 2026-11-08, S8 reading recorded: "golden fixture runs against the
  stripped copy too" is delivered as (a) the committed projection golden
  fixture (toy source + manifest + expected stripped bytes, byte-compared —
  O11) and (b) the repo's own `scripts/golden-fixture.test.mjs` suite passing
  on the tree that carries the projection pipeline (G1). The empty manifest
  makes the second a no-op delta today; the first real manifest entry re-drives
  both without shape changes.
- **E1** — 2026-11-08, `bun test packages/pi-agentic-workflow/test/projection.test.mjs`
  · exit 1 at the red commit (`37112245`, module missing), exit 0 after P2 —
  18 pass / 0 fail; `node --test` same file · 18 pass / 0 fail.
- **E2** — 2026-11-08, `bun run --cwd packages/pi-agentic-workflow test` ·
  exit 0 · 667 pass / 0 fail (post-parity).
- **E3** — 2026-11-08, `bun run --cwd packages/pi-agentic-workflow test:node` ·
  exit 0 · 667 pass / 0 fail (post-parity).
- **E4** — 2026-11-08, differential check (§6 of the direct-application
  workflow): `bundle-skills.mjs` run at base `6f5d5453` (in a scratch `git
  archive` tree) and at this change — `diff -r` of the two staged bundles:
  byte-identical (28 skills, 94 files, projected 0). Zero unasked deltas.
- **E5** — 2026-11-08, `npm pack --dry-run --json` in `packages/pi-agentic-workflow`
  · exit 0 · 185 packed files, zero matches for `projection-manifest` or the
  projection script (O12).
- **E6** — 2026-11-08, `rg -c 'Nothing here edits skill prose' packages/pi-agentic-workflow/scripts/bundle-skills.mjs`
  · 0 matches (O8). `rg -c 'remark AST edit' docs/ROADMAP.md` · 0 matches (O13).
- **E7** — 2026-11-08, `bun scripts/check-skill-context.mjs` · PASS (29 skills);
  `--documents` · PASS (4 budgeted documents); `--routes` · PASS (14 routes);
  `npx skills add . --list` · all skills discovered.
- **D3** — 2026-11-09, the pre-push hook refused the push at the root-suite
  step because of the pre-existing `log-immutability` red (see Known
  pre-existing issues) — unrelated to this push range. The hook's own contract
  declares the escape hatch `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` with "record
  why in the PR": used once for this push, reason recorded here and in the PR
  body. The gate evidence stands as recorded in G1/G2 (91/91 excluding the
  pre-existing red; every other gate step exit 0).
- **P1** — 2026-11-08, red suite for the projection transform · commit `37112245`.
- **P2** — 2026-11-08, projection module + bundle wiring + EMPTY manifest +
  golden fixture · commit `9d672ab0`.
- **P3** — 2026-11-08, parity suite redefined to declared projection · commit
  `a852c180`.
- **G1** — 2026-11-09, HEAD `99c2f3c7`: `node scripts/run-root-suite.mjs --bail <91
  suites> (every `scripts/*.test.mjs` except the pre-existing red
  `log-immutability`) · exit 0 · 91/91 PASS (see Known pre-existing issues).
- **G2** — 2026-11-08 (head `a852c180`; the only later commits are docs and the
  unit log), `bun scripts/local-gate.mjs --skip-network` · workspace
  install, schema build, crate suites (bun+node), version parity, docs
  projection, journal carrier, schema/pi node-compat: all exit 0; the root-suite
  step bails at the pre-existing `log-immutability` red only (G1 records the
  91/91 exclusion run, re-run at HEAD `99c2f3c7`).
- **D1** — 2026-11-09, external-verify advisory A1: O15's required-evidence
  cell described the log-imm red as current at merge-base `f24b726f` but
  `origin/main` now carries the fix (PR #469 merged `log-immutability.mjs`;
  `bun test` 18/0 exit 0). Updated O15's evidence cell to record that the
  red is base-resolved at main while the branch tree is still based on
  `f24b726f` (pre-#469 merge), so the gate bails identically here. Advisory
  A2: the branch behind main (one `skills/log-session/SKILL.md` delta from
  #468); merge-tree confirms clean merge onto `origin/main` — integrate main
  before PR merge. Advisory A3: no projection-suite case covers the plain
  `{heading}` selector form; added `projection: remove honors a plain heading
  selector (not path) — A3 coverage` test case, hash-verified against the
  toy fixture's `Enforced section`; `bun test projection.test.mjs` 19/0 exit 0
  (was 18/0).

## Next

Deliver P1–P6 on `feat/410-projection-pipeline`, then hand the diff to the
owner as external verifier (§8 of the direct-application workflow).

## References

- Issue `#410` (this PR closes it), roadmap row **109 `pi-bundle-stripper`**.
- Dependencies: `docs/features/105-projection-manifest-vocabulary/` (#406,
  merged), `docs/fix/407-section-locator-core/` (#407, merged).
- Absorbed rows: roadmap **110** (#411), **111** (#412), **113** (#414).

## Branch

`feat/410-projection-pipeline`

## Depends on

None — both dependencies (#406, #407) are closed and landed on `main`.

## Regression scope

- The standalone `skills/` source tree: never edited by the projection
  (verified by the byte-identity assertions that survive in the parity suite).
- The bundled tarball with the EMPTY manifest: byte-identical to today's output
  (O7's golden no-op + the differential run against the base commit).
- Existing bundle lifecycle guarantees: wipe-on-rebuild, `--clean`, source
  untouched (`test/bundle-lifecycle.test.mjs`, unchanged assertions).
- The crate and schema packages: untouched by this unit.
