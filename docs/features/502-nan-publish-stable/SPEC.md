---
type: feature
scope: medium
ac-hash: d2f2b3eca07d61eaf94d35a05bd3810ce8ce28ca41dd2004581f8a40a400e84b
---

# feat/502-nan-publish-stable

> One-line: `mode: publish` on `publish.yml` gains a `nan-publish` job so
> `@gtrabanco/pi-nan-agentic-workflow` reaches npm on the stable train — the
> pipeline currently bumps the companion's version and writes its CHANGELOG
> row on every stable cut, then never publishes it.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#502` — tracked issue in the project's forge. The PR must close it via
`Closes #502` in the body (the commit carries the footer).

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. A later correction is appended under its own id
(`S1a`, `S2a`, …) and never rewrites the id it corrects.

**S1 — the apply request.**
> "Apply to this repository: issue #502"

**S2 — mode: publish covers all four packages in dependency order.**
> "- [ ] `mode: publish` on the committed train publishes all four packages in dependency order; the companion appears in the plan output."

**S3 — the companion's own gate runs before its publish.**
> "- [ ] The companion's `bun run test` gate runs against the committed tree before its publish; a red suite blocks it."

**S4 — the exact-version gate skips a published version; a skipped job never moves the canary dist-tag.**
> "- [ ] The exact-version gate skips an already-published companion version; a skipped job never moves the `canary` dist-tag."

**S5 — a stable cut puts the companion on npm under `latest`.**
> "- [ ] A stable cut (`mode: cut`, channel: stable) ends with `@gtrabanco/pi-nan-agentic-workflow@<train>` on npm under `latest`, matching the other three packages."

**S6 — the three-package narration is gone from current-state prose.**
> "- [ ] The workflow header and `docs/workflow/PACKAGES.md` no longer claim three packages; no other prose restates the count."

**S7 — the Trusted Publisher record for the companion is documented.**
> "- [ ] The npm Trusted Publisher record for the companion points at `publish.yml` (documented; verified live on the first publish or noted in the unit doc)."

**S8 — the in-scope Trusted Publisher bullet.**
> "- Correct `needs:` placement in the dependency chain: the companion peer-depends on `@gtrabanco/pi-agentic-workflow`, so it publishes after `pi-publish` (or alongside, if install resolution provably stays workspace-local — decided in the unit doc, not assumed)."
>
> "- Update the workflow header (three packages → four) and the Trusted Publisher note; the fourth npm Trusted Publisher record must be registered on npmjs.com bound to `publish.yml` (operator action — called out in the unit doc)."

## Impact

- `.github/workflows/publish.yml` is a **high-risk CI surface** (tier verdict
  below): the job it gains runs on the release train's `mode: publish` and
  writes to the npm registry. Nothing in this unit runs any of its steps
  locally — the live-tree guard holds; the job's commands execute only in CI.
- Consumers of the pinned contract: `scripts/release-workflows.test.mjs` pins
  the publish.yml shape (job list, dist-tag count 3, npm-version-gate count 4,
  needs chain, least-privilege) — every count the change moves is updated in
  the same change, RED-first. `scripts/npm-version-gate.test.mjs` reads
  publish.yml and carries the "all three publish workflows" narration.
- The release train itself (`scripts/release.mjs`) needs **no change**: it
  already iterates every `packages/*` member, so the stable plan, the train
  bump, the CHANGELOG companion row and the canary `publish-plan` already
  cover the fourth package (PE-004). This unit is the publish-job gap only.
- Soft dep #481: its availability-wait hook will cover four jobs — out of
  scope here (the issue's own scoping); landing the fourth job first means
  #481 designs against the final shape once.

## Retirements

Every current-state narration claiming three packages or three publish jobs:

- `publish.yml` header: "the npm Trusted Publisher records for the three
  packages" → four, with the fourth record's operator action named.
  Replacement: the updated header.
- `docs/workflow/PACKAGES.md`: "its jobs chain schema → crate → the pi pair"
  → the chain gains the companion leg. Replacement: the updated sentence.
- `docs/workflow/FEATURE_WORKFLOW.md`: "every train release moves the three
  packages together" → four. Replacement: the updated sentence.
- `scripts/npm-version-gate.test.mjs` comments ("all three publish
  workflows") → the workflow/job wording that matches the four-job shape.

Historical records deliberately **kept** (they state a past count, not a
current claim): `publish.yml`'s dist-tag-incident comment ("on all three
packages" — true on 2026-11-02), `docs/audits/1-2026-11-08.md` ("never
shipped in the three packages" — a frozen audit record), CHANGELOG history
rows, and `docs/ROADMAP.md` row 40's historical narration. PACKAGES.md's
"re-registering the then-three packages' records" sentence was removed by
this unit — the guide-layer context ceiling allows no line growth and the
consolidation's re-registration history stays in the `publish.yml` header.
The count the kept records carry was true when written; rewriting frozen
history is not currency.

## Non-goals

- No changes to the canary path: `publish-plan`/`publish-stage` already cover
  the companion dynamically and stay as-is (issue scoping).
- No version-bump automation changes (#180 / row 40 owns the train).
- No post-publish availability gate work (#481) — out of scope even though it
  touches the same jobs.
- No package-surface change → **no changeset for this unit**: the parity
  gate's trigger set is `packages/**` + `skills/**`; this unit touches neither
  (evidence: O8). The pending `.changeset/388-extract-nan-vendor-coupling.md`
  already declares the companion and is consumed by the next stable train
  regardless of this unit.

## Risk tier

Computed, never chosen — `bun scripts/ceremony.mjs tier classify --paths
.github/workflows/publish.yml scripts/release-workflows.test.mjs
scripts/npm-version-gate.test.mjs docs/workflow/PACKAGES.md
docs/workflow/FEATURE_WORKFLOW.md docs/features/502-nan-publish-stable`:

- **Tier** — `high` · **Task Size** — `understood: true, contained_risk:
  "named", resumable_from_diff: true, ceremony: "unit-doc+review-change",
  verification: "review-change"`
- **Named high-risk item** — `{"path": ".github/workflows/publish.yml",
  "signal": "ci"}` — quoted from `signals[]`.

**Owner-route override (recorded, not silent):** the tier's `review-change`
ceremony is **not run** — the owner's local apply workflow for this unit
explicitly forbids running the repo's review machinery on its own surgery
("Work inline — never run this repo's own machinery on its own surgery"; the
frozen ledgers are the plan) and names the owner the external verifier. The
deterministic gates (the suites, the local gate) run in full; the verdict is
the owner's, at handoff.

## Future

none — nothing was deferred by the requester. The #481 availability-wait
extension is existing roadmap work (soft dep), not a deferred idea of this
unit.

## Future cost

- The fourth npm Trusted Publisher record must exist on npmjs.com **before
  the first stable/canary publish of the companion** — until then that
  publish fails E403/OIDC. Binds: the owner (one-time operator action).
- #481's availability-wait hook must cover four jobs, not three. Binds: the
  #481 unit.

## Applicable tests

`bun test scripts/release-workflows.test.mjs` (the pinned publish.yml
contract — extended RED-first), `bun test scripts/npm-version-gate.test.mjs`
(reads publish.yml), `bun test scripts/release.test.mjs` (release.mjs
untouched — regression guard), plus the local gate's root suite.

## Known pre-existing issues

- `docs/workflow/FEATURE_WORKFLOW.md` calls the publish jobs
  "push-triggered" — stale since the 2026-11-03 manual-only decision.
  **Does-not-affect** this unit: the line sits in prose this unit already
  edits for the count; the stale trigger wording is pre-existing drift this
  unit does not own (recorded, not repaired, to keep the diff on the declared
  surface).
- roadmap-settle's live-tree check is red at base: unit 494
  (`docs/features/494-telemetry-by-turn/SPEC.md`, added in `15c152a1` on
  `main`) has no ROADMAP row (`git show 27275c94:docs/ROADMAP.md` names no
  494 row). **Does-not-affect** this unit's row (502); it fails the root
  gate's `roadmap-settle` step independent of this change — disclosed, the
  owner's call, never repaired silently here.
- undici advisories (docs/audits/1-2026-11-08.md F2, owner decision: not
  reported). **Does-not-affect**: dev toolchain only.

## Tasks

- P1 — Cut the unit doc + ledgers (this file, `planning-evidence.md`,
  `planning-obligations.md`), register the roadmap row as `in-progress`, and
  regenerate the docs projection (validator: `bun scripts/docs-generate.mjs
  --check` exits 0)
  (Implements: S1)
  Relevant files: docs/features/502-nan-publish-stable/, docs/ROADMAP.md, docs/generated/units.md
- P2 — RED: extend `scripts/release-workflows.test.mjs` with the frozen-failure
  reproducer — every workspace package member has a stable publish job — and
  move the pinned counts/loops to the four-package shape (dist-tag 4,
  npm-version-gate 5, `nan-publish` in the mode:publish / promotion /
  least-privilege job sets, the nan needs chain); observe the suite red before
  any workflow byte changes (validator: `bun test scripts/release-workflows.test.mjs`
  exits non-zero, failing only on the new/extended assertions)
  (Implements: S2, S4, S8)
  Relevant files: scripts/release-workflows.test.mjs
- P3 — Implement the `nan-publish` job in `publish.yml` (mirror of the three
  existing publish jobs: gate → exact-version gate → publish `--provenance
  --tag latest` → canary dist-tag gated on the publish decision) chained
  `needs: [pi-publish]`, and update the workflow header to four packages +
  the Trusted Publisher note (validator: `bun test scripts/release-workflows.test.mjs`
  exits 0)
  (Implements: S2, S3, S4, S5, S6, S8)
  Relevant files: .github/workflows/publish.yml
- P4 — Docs currency in the same change: `docs/workflow/PACKAGES.md` chain
  line, `docs/workflow/FEATURE_WORKFLOW.md` count line, the
  `npm-version-gate.test.mjs` comment narration, the roadmap row registered
  `in-progress` (settled to `done` at closeout, when the PR opens — the
  settle rule pairs `done` with its PR link), and the docs projection
  regeneration (validator:
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S6, S7)
  Relevant files: docs/workflow/PACKAGES.md, docs/workflow/FEATURE_WORKFLOW.md, scripts/npm-version-gate.test.mjs, docs/ROADMAP.md, docs/generated/units.md
- P5 — Verify like a writer: run the touched suites, the differential against
  the base commit in scratch, the plan-output evidence, and the local gate;
  close the obligations ledger; append the session log; hand off (validator:
  `bun scripts/local-gate.mjs` exits 0 — every step green or an evidenced
  base-reproduced red disclosed)
  (Implements: S2, S3, S4, S5, S6, S7)

### Planning evidence

M/L unit — the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md) (frozen at cut), not embedded here.

### Obligations

M/L unit — the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md) (frozen at cut, `status`
the only live column), not embedded here.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — The unit is applied through the owner's local workflow: ledgers
  frozen at cut (this document + the two ledger files), no repo review/fold
  machinery ran on it, the deterministic gates only, and the owner is the
  external verifier. Check: `git log --oneline origin/main..HEAD` shows the
  unit's own conventional commits and this SPEC predates the first code
  commit (`git log --follow docs/features/502-nan-publish-stable/SPEC.md`).
- **AC-S2** — `mode: publish` on the committed train publishes all four
  packages in dependency order and the companion appears in the plan output.
  Check: `bun test scripts/release-workflows.test.mjs` exits 0 (the
  every-member-has-a-publish-job reproducer green) and
  `node scripts/release.mjs plan --channel stable` prints four `→` train
  lines including `@gtrabanco/pi-nan-agentic-workflow`.
- **AC-S3** — The companion's `bun run test` gate runs against the committed
  tree before its publish and a red suite blocks it. Check: the
  `nan-publish` job block carries the gate step (`bun test
  scripts/release-workflows.test.mjs` exits 0) and
  `(cd packages/pi-nan-agentic-workflow && bun run test)` exits 0.
- **AC-S4** — The exact-version gate skips an already-published companion
  version and a skipped job never moves the `canary` dist-tag. Check: the
  promotion-gating test covers `nan-publish` and the npm-version-gate call
  site count is 5 (`bun test scripts/release-workflows.test.mjs` exits 0).
- **AC-S5** — A stable cut ends with `@gtrabanco/pi-nan-agentic-workflow@<train>`
  on npm under `latest`. Check (structural, local): the `nan-publish` job
  carries `npm publish --access public --provenance --tag "latest"` and the
  gated canary dist-tag step (`bun test scripts/release-workflows.test.mjs`
  exits 0). The live registry state is confirmed on the next stable cut by
  the operator — never claimed from a local tree.
- **AC-S6** — The workflow header and `docs/workflow/PACKAGES.md` no longer
  claim three packages; no other current-state prose restates the count.
  Check: `rg -n -e "the three packages" -e "three publish"
  .github/workflows/publish.yml docs/workflow/PACKAGES.md
  docs/workflow/FEATURE_WORKFLOW.md scripts/npm-version-gate.test.mjs`
  exits 1 (0 matches); historical narration (the dist-tag-incident comment's
  "all three packages" — true on 2026-11-02, the frozen audit record) is the
  enumerated exception in `## Retirements`.
- **AC-S7** — The npm Trusted Publisher record for the companion is
  documented (unit doc + workflow header; live registration verified on the
  first publish or noted here). Check: `rg -c "Trusted Publisher"
  .github/workflows/publish.yml` ≥ 1 and `rg -c "Trusted Publisher"
  docs/features/502-nan-publish-stable/SPEC.md` ≥ 1.
- **AC-S8** — The `needs:` chain places the companion after `pi-publish`, the
  decision is recorded in this unit doc (not assumed), and the operator
  registration action is called out. Check: the needs-chain test asserts
  `needs: [pi-publish]` (`bun test scripts/release-workflows.test.mjs`
  exits 0) and SPEC `## Log` E2 records the workspace-local reasoning.

## Triaged steps

Inline application — the owner's local apply workflow substitutes for the
lane's plan step (its §5: "This command substitutes for the lane's plan
step"): the frozen ledgers above **are** the plan, the phases are P1–P5 as
cut, and no `unit-route` triage block is fabricated for the inline route.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-11, the request, verbatim:
  ```
  Apply to this repository: issue #502
  ```
- **D1** — 2026-11-11, owner route (the apply request's own workflow): inline
  application — no `review-change`, no `audit-pr`, no fold cycle on this
  change; the ledger freeze is the plan; the owner is the external verifier.
- **E1** — 2026-11-11, `bun scripts/ceremony.mjs tier classify --paths
  .github/workflows/publish.yml …` · exit 0 · tier `high`, signal `ci`
  (`.github/workflows/publish.yml`), ceremony `unit-doc+review-change` — the
  review-change half overridden by D1 and recorded above.
- **E2** — 2026-11-11, chain-position decision (S8): `needs: [pi-publish]`.
  Install resolution **is provably workspace-local** (members link each other
  from the folder — `docs/workflow/PACKAGES.md`; the cut job's own lock
  comment), so ordering is not required for installability — but the
  registry-resolved ordering is kept as the convention (PE-002): the
  companion peer-depends on `@gtrabanco/pi-agentic-workflow`, and the three
  existing jobs already enforce registry order; a fourth job that publishes
  alongside `pi-publish` would make the first-ever companion publish race its
  peer's tarball for no time saved (the job is minutes, not hours). Direct
  dependency named, not transitivity.
- **D2** — 2026-11-11, plan repairs at cut, ac-hash re-stamped twice:
  `ed9369…` (AC-S6's rg pattern made pipe-safe for table parsing — `rg -n -e
  "the three packages" -e "three publish"`) and `d2f2b3…` (its exception list
  updated when PACKAGES.md's historical "then-three" sentence was dropped —
  the guide-layer context ceiling allowed no line growth; see E11). Both
  repairs predate the first code commit; the ledger freeze is intact.
- **E3** — 2026-11-11, RED at `b6cdc271` (workflow untouched):
  `bun test scripts/release-workflows.test.mjs` · exit 1 · 18 pass / 7 fail —
  every failure a new/extended assertion; the reproducer names the frozen
  failure verbatim: "packages/pi-nan-agentic-workflow has no stable publish
  job — a stable cut would bump its version and never publish it".
- **E4** — 2026-11-11, GREEN at `8c0388e1`: `bun test
  scripts/release-workflows.test.mjs` · exit 0 · 25 pass; `bun test
  scripts/npm-version-gate.test.mjs` · exit 0 · 14 pass.
- **E5** — 2026-11-11, YAML parse of a scratch copy (`mktemp -d
  /tmp/aw502-…`, removed after): `yaml.parse` · exit 0 · 7 jobs
  (`suggest, cut, cut-prerelease, schema-publish, crate-publish,
  pi-publish, nan-publish`); `nan-publish` needs `["pi-publish"]`, mode-gated
  `if`, working-directory `packages/pi-nan-agentic-workflow`.
- **E6** — 2026-11-11, `(cd packages/pi-nan-agentic-workflow && bun run test)`
  · exit 0 · 29 pass / 0 fail (O2's second half — the gate the job runs is
  green on the committed tree).
- **E7** — 2026-11-11, differential (§6): base export `27275c94` into
  `mktemp -d /tmp/aw502-diff-…` (removed after) + the new test files →
  release-workflows 18 pass / 7 fail (exactly E3's intended reds — no
  unrequested difference), npm-version-gate 14 pass / 0 fail (comment-only
  changes).
- **E8** — 2026-11-11, `node scripts/release.mjs plan --channel stable` ·
  exit 0 · four train lines, companion included:
  `@gtrabanco/pi-nan-agentic-workflow: 4.10.0 → 5.0.0 (packages/pi-nan-agentic-workflow/)`.
- **E9** — 2026-11-11, `rg -n -e "the three packages" -e "three publish"
  .github/workflows/publish.yml docs/workflow/PACKAGES.md
  docs/workflow/FEATURE_WORKFLOW.md scripts/npm-version-gate.test.mjs` ·
  exit 1 (0 matches) (O5).
- **E10** — 2026-11-11, `bun scripts/version-parity-gate.mjs --content` ·
  exit 0 · "no change under packages/pi-nan-agentic-workflow/ — nothing to
  enforce" · VERDICT: PASS (O8 — no changeset owed).
- **E11** — 2026-11-11, `bun scripts/check-skill-context.mjs --documents` ·
  exit 0 · `docs/workflow/PACKAGES.md 101 lines / estimate 2381` — exactly
  at its ceiling (the first currency draft measured 103 / 2419 and was
  compressed; that red never reached a commit).
- **E12** — 2026-11-11, `bun scripts/docs-generate.mjs --check` · exit 0 ·
  "3 checked · 0 missing · 0 stale · 0 orphaned · verdict: PASS".
- **G1** — 2026-11-11, HEAD `8f2a8c7b`, `bun scripts/local-gate.mjs` ·
  exit 1 · FAILED at
  root-suite — the run's only red is `scripts/roadmap-settle.test.mjs`
  ("docs/features/494-telemetry-by-turn/SPEC.md:1 row-missing — no roadmap
  row for NN 494"); base-reproduced (the row is absent and the SPEC present
  at `27275c94`; the SPEC landed in `15c152a1` on `main`) — a pre-existing
  failure disclosed in Known pre-existing issues, never repaired here. Every
  other suite green (604 pass / 0 fail across the gate's per-file runs).
- **G2** — 2026-11-11, HEAD `8f2a8c7b`, `node scripts/run-root-suite.mjs` ·
  exit 1 · fail 1 =
  `scripts/roadmap-settle.test.mjs` only (G1's same pre-existing red).
- **P1** — 2026-11-11, unit doc + ledgers cut, roadmap row 502 registered
  `in-progress`, projection regenerated · `193704c3`.
- **P2** — 2026-11-11, RED commit: the four-package reproducer + moved
  counts/loops, observed failing (E3) before any workflow byte moved ·
  `b6cdc271`.
- **P3** — 2026-11-11, `nan-publish` job + header (four records, operator
  note, chain comment), observed green (E4, E5) · `8c0388e1`.
- **P4** — 2026-11-11, docs currency: PACKAGES.md chain line,
  FEATURE_WORKFLOW.md count line, gate-test comment narration · `8f2a8c7b`.
- **P5** — 2026-11-11, verification runs (E6–E12, G1–G2), obligations closed,
  session entry written through the journal writer as a pending fragment (the
  carrier's appends belong to the merge-to-main aggregator, issue #468) · this
  commit.
- **F1** — 2026-11-11, correction batch on the 2026-11-11 EXTERNAL VERIFY
  (NEEDS-DECISION, 1 blocker + 4 advisories). **B1 folded:** the close commit
  had hand-appended `docs/LOGS.md` and hand-deleted 62 pending fragments as a
  non-aggregator commit (63 `log-immutability` violations); the branch is
  local-only, so the close commit was re-cut — `d9463a0c` superseded by
  `30adaf36`, carrier bytes back at base, session entry re-landed as a pending
  fragment byte-identical to the appended block (`node
  scripts/log-immutability.mjs` · exit 0 · 0 violations · 63 before · 0 at
  base `27275c94`; `journal aggregate --check` · exit 0 · 63 fragments). **A1
  folded:** `scripts/unit-doc-contract.test.mjs`'s D-40-14 narration moved to
  the four-package truth with the companion's assertion added (21 pass / 0
  fail); `scripts/release.test.mjs`'s "all three packages" withdrawn as
  fixture-true (its fixture carries three packages — renaming would falsify
  the name). **A2 folded:** `docs/CAPABILITIES.md`'s public-API row now reads
  Four published npm packages and enumerates the companion (`npm view
  @gtrabanco/pi-nan-agentic-workflow dist-tags` → `latest: 4.10.0`; capabilities
  suites 31 pass / 0 fail). **A3 folded:** P4's roadmap step now states the
  the `in-progress` registration plus the closeout settlement. **A4 dispositioned:**
  unit 494's missing ROADMAP row stays main's disclosed pre-existing red, out
  of this unit's declared surface. Differential: unit-doc-contract 21, release
  70, capabilities 16, capability-inventory 15 — case lists identical base vs
  head.
- **G3** — 2026-11-11, HEAD (re-cut `30adaf36` + `d509ca1f`), `bun
  scripts/local-gate.mjs --no-bail` · exit 1 · every step green except
  root-suite: `log-immutability` PASS (0 violations — 63 at the superseded
  head, 0 at base), carrier/parity/docs/context/tmp-gc/worktree/install/
  schema/pin/advisories/compat/crate legs green; `node
  scripts/run-root-suite.mjs` standalone · exit 1 · 100 pass / 1 fail =
  roadmap-settle 494 (G1's base-reproduced, disclosed red — unchanged). The
  in-gate FAILs of red-first/run-root-suite/scope-manifest carry no test-level
  failure: root-suite runs fail-fast on inside the gate and the bail kills the
  suites still in flight behind that disclosed red (the base reproduces the
  cascade with other victims — ceremony-*, tmp-gc — plus check-skill-context's
  real 103/2419 red at committed `8f2a8c7b`, fixed by this head's compression).
  `node scripts/red-first.mjs` · exit 0 · 0 findings — the shipped history
  passes the gate.

## Next

The owner's external verdict on this diff (§8: "I am the external verifier").
Two operator actions ride with it: register the fourth npm Trusted Publisher
record (`@gtrabanco/pi-nan-agentic-workflow`, bound to `publish.yml`) before
the first publish, and decide the pre-existing roadmap-settle red (unit 494
has no ROADMAP row — disclosed, not repaired here).

## References

- Issue [#502](https://github.com/gtrabanco/agentic-workflow/issues/502) — the PR closes it via `Closes #502`.
- #388 / PR #499 — the companion package this unit publishes (merged).
- #481 — soft dep; its availability-wait hook covers four jobs after this lands.
- Roadmap row 502 (`nan-publish-stable`), `docs/workflow/PACKAGES.md`, `docs/workflow/FEATURE_WORKFLOW.md`.
