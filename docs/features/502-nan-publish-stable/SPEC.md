---
type: feature
scope: medium
ac-hash: ed93693c790f16ec05da097ef51666f6afdc993bdc01708e09cd90e2745d70ab
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
current claim): `docs/workflow/PACKAGES.md` "re-registering the then-three
packages' records" (the 2026-10-28 consolidation fact), `docs/audits/
1-2026-11-08.md` ("never shipped in the three packages" — a frozen audit
record), CHANGELOG history rows, and `docs/ROADMAP.md` row 40's historical
narration. The count they carry was true when written; rewriting frozen
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
  `npm-version-gate.test.mjs` comment narration, the roadmap row's status
  move to `done`, and the docs projection regeneration (validator:
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
  "all three packages" — true on 2026-11-02, PACKAGES.md "then-three", the
  frozen audit record) is the enumerated exception in `## Retirements`.
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

## Next

P2 — the RED commit (reproducer + four-package pins), observed failing before
any workflow byte changes.

## References

- Issue [#502](https://github.com/gtrabanco/agentic-workflow/issues/502) — the PR closes it via `Closes #502`.
- #388 / PR #499 — the companion package this unit publishes (merged).
- #481 — soft dep; its availability-wait hook covers four jobs after this lands.
- Roadmap row 502 (`nan-publish-stable`), `docs/workflow/PACKAGES.md`, `docs/workflow/FEATURE_WORKFLOW.md`.
