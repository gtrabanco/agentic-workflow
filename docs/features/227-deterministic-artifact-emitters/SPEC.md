---
type: feature
scope: small
---

# 227 — deterministic-artifact-emitters

> One-line: the document verifier cross-checks a unit doc's claims against the tree — a root-relative path citation must exist and a gate citation must be published — the last live piece of issue #227 after its producer halves were retired by the issue's own re-scopes.

## Specs

The request arrived in two turns; both are quoted verbatim below. The state
resolution that picked the verb is recorded as `D1` in `## Log`.

**S1 — Apply the issue's remaining live scope: the verifier's tree cross-checks.**
> Apply to this repository: issue #227

**S2 — Deliver the change as one pull request against `main`.**
> Create the PR

## Impact

- Consumers: the lane's plan step reads the verifier as the writer self-verification carrier; the crate suite pins the published `docs/fix/201-operator-approved-pass-routing/SPEC.md` verdict, which must not move.
- What stops being true: a unit doc citing a root-relative path that the tree does not hold, or a gate id that nothing publishes, now refuses (`exit 2`) where it previously passed — the drift class issue #227's 2026-11-03 re-scope names ("referenced paths exist, cited gates are the published ones").
- Sanctioned output delta on a clean doc: the `verify@1` receipt's `checks` array gains `cited-paths` and `cited-gates`. Nothing else on stdout/stderr may change for a previously passing doc.
- Closed published docs are not re-verified by any gate, so no CI surface turns red; the refusal bites when a doc is verified at write time.

## Retirements

None — this unit only appends checks to the verifier's closed violation-code
vocabulary (the module's own rule: new checks append codes, never rename). No
surface, token, helper or narrative is superseded, so there is nothing to
remove: `rg -c "cited-path-missing|cited-gate-unknown" packages/agentic-workflow/src` → 0 at the cut head, both codes are new names.

## Non-goals

- The retired producer emitters stay retired: the obligation-ledger skeleton emitter (replaced by the unit-doc template, re-cut by feature 79) and the roadmap-row composer (folded into the ceremony CLI, fix #338 / #352) — per the issue's 2026-11-03 re-scope and 2026-11-07 deprecation record.
- No schema-package change: the two new codes live on the verifier, no published vocabulary moves, so no version bump or mirror edit.
- No new inventory row: these are verifier checks, not workflow gates; `docs/workflow/GATE_INVENTORY.md` is read, never extended.
- No LSP: the verifier stays a deterministic script (the issue's verified constraint, 2026-09-24).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood: true, contained_risk: contained, resumable_from_diff: true (ceremony: unit-doc, verification: gates)`
- **Named high-risk item** — none — not a high-tier unit
- Verdict (copied verbatim from `bun scripts/ceremony.mjs tier classify --paths packages/agentic-workflow/src/verify/Verify.mjs packages/agentic-workflow/bin/agentic-workflow.mjs packages/agentic-workflow/test/verify.test.mjs packages/agentic-workflow/README.md`, run 2026-11-09): `risk-tier-verdict@1` — tier `standard`, reason `1 path(s) carry executable content: packages/agentic-workflow/src/verify/Verify.mjs`, reason_kind `executable-content`, signals `[]`.

## Future

none

## Future cost

- The verifier's violation-code vocabulary grows by append only — a renamed code is a defect (module header rule, carried forward).
- A new published-gate source must be added to the CLI's resolver in `packages/agentic-workflow/bin/agentic-workflow.mjs`, never hard-coded inside the module — the module takes `gateKnown` injected.

## Applicable tests

`bun test packages/agentic-workflow/test/verify.test.mjs` (extends the existing verifier suite), the crate suite `cd packages/agentic-workflow && bun run test`, and the differential pin: `verify` on `docs/fix/201-operator-approved-pass-routing/SPEC.md` keeps its verdict.

## Known pre-existing issues

none

## Tasks

- P1 — freeze the planning ledgers (this unit doc, embedded `### Planning evidence` + `### Obligations`, every row `planned`) and render the generated projection (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1)
- P2 — RED: extend `packages/agentic-workflow/test/verify.test.mjs` with the frozen-failure corpus — stale path citation refused, unpublished gate citation refused, skip semantics, CLI wiring — observed failing at the pre-implementation head (validator: `bun test packages/agentic-workflow/test/verify.test.mjs` exits non-zero on the new cases only)
  (Implements: S1)
- P3 — implement the two cross-checks in `packages/agentic-workflow/src/verify/Verify.mjs` (closed citation grammar, injected `pathExists`/`rootHasDir`/`gateKnown`) and wire the CLI's repo resolvers in `packages/agentic-workflow/bin/agentic-workflow.mjs` (validator: `bun test packages/agentic-workflow/test/verify.test.mjs` exits 0)
  (Implements: S1)
- P4 — crate README documents the closed citation grammar and the skip semantics (validator: `rg -c "cited-path-missing" packages/agentic-workflow/README.md` matches 1)
  (Implements: S1)
- P5 — verification: crate suite, differential against the base commit, the pinned 201 verdict, the rendered projection (validator: `cd packages/agentic-workflow && bun run test` exits 0)
  (Implements: S1)
- P6 — open the PR against `main`, settle roadmap row 53 through the writer, append the session log (validator: `gh pr list --head feat/227-deterministic-artifact-emitters --state open --json url` matches 1)
  (Implements: S2)

### Planning evidence

One row per Engineering claim the change rests on (column order owned by
`skills/pre-execution-review/references/LEDGERS.md` §1). Sampled at the cut
head `6f5d5453`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | issue #227's remaining live scope after the 2026-11-03 re-scope and the 2026-11-07 deprecation record is exactly the two tree cross-checks ("referenced paths exist, cited gates are the published ones"); the producer halves are retired | the issue's dated comments, fetched 2026-11-09 via `gh issue view 227` | current | O1, O2 |
| PE-002 | known | the verifier already injects repo-touching predicates (`headExists` wired by the CLI, `null` → the sha-resolution check reports skipped), so the cross-checks follow the established dependency-injection design | `packages/agentic-workflow/src/verify/Verify.mjs` header comment, read at the cut head | current | O1, O4 |
| PE-003 | known | the published gate sources in this repository are the inventory's `gate-id` column and audit-pr's `GATE_NAMES`; published docs also cite skills and script stems as gates, so the resolver must accept tree-resolvable names of those kinds too | `docs/workflow/GATE_INVENTORY.md` (prose-gate-inventory@1), `scripts/audit-pr-gate.mjs` (`GATE_NAMES`, 13 names), sampled spans of `docs/fix/201-operator-approved-pass-routing/SPEC.md` | current | O2, O4 |
| PE-004 | known | the citation shapes published unit docs actually carry are root-relative paths (with optional `:line` suffixes), brace-expansion shorthand, context-relative fragments and commands; only the root-relative path form is a decidable claim for a verifier | `rg -o` sample over `docs/fix/201-operator-approved-pass-routing/SPEC.md` (42 spans containing a slash) | current | O1 |
| PE-005 | known | `docs/generated/units.md` is a committed projection of the unit dirs; a new unit dir must be rendered by the generator, never hand-added | the `2f2210ba` diff stat (`docs/generated/units.md` +2) and the repository guide's normalizer inventory | current | O6 |
| PE-006 | known | a PR changing a package's shipped content declares its release intent in a valid `.changeset/*.md` naming the package (the release applies it) — the version-parity gate refuses an unchanged version with no changeset; the two direct-to-`main` verifier commits (`c74ce777`, `2f2210ba`) carried none because they were owner-applied batches, not PR units | `scripts/version-parity-gate.mjs --content` rejection observed 2026-11-09 at `38e7c548`; the `.changeset/260-subagent-first-execution.md` shape | current | O8 |

### Obligations

One row per normative behaviour, compatibility invariant and required failure
state (nine-column shape owned by `skills/pre-execution-review/references/LEDGERS.md`
§2). Every row `planned` at cut; `verified` only with its validator run in the
foreground and the evidence recorded where `required-evidence` says.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 (re-scope 2026-11-03: "referenced paths exist") | a unit doc citing a root-relative path the tree does not hold is refused with `cited-path-missing`; context-relative shorthand and brace expansion are not claims | P3 | P3 | `packages/agentic-workflow/src/verify/Verify.mjs` | `bun test packages/agentic-workflow/test/verify.test.mjs` exits 0 with the `cited-path-missing` cases | `E` line in `## Log` (`E4`) | verified |
| O2 | S1 (re-scope 2026-11-03: "cited gates are the published ones") | a unit doc citing an unpublished id as a gate is refused with `cited-gate-unknown`; inventory ids, `GATE_NAMES`, existing skills and script stems resolve | P3 | P3 | `packages/agentic-workflow/src/verify/Verify.mjs` | `bun test packages/agentic-workflow/test/verify.test.mjs` exits 0 with the `cited-gate-unknown` cases | `E` line in `## Log` (`E4`) | verified |
| O3 | S1 (compatibility invariant) | existing verdicts are unchanged: every pre-existing suite case and the published 201 doc keep their verdict; the only clean-doc output delta is the `checks` array gaining `cited-paths`/`cited-gates` | P5 | P5 | `packages/agentic-workflow/test/verify.test.mjs` | `cd packages/agentic-workflow && bun run test` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/201-operator-approved-pass-routing/SPEC.md` exits 0 | `E`/`G` lines in `## Log` (`E5`, `G2`) | verified |
| O4 | S1 (re-scope: read-only verifier, injectable repo context) | the CLI wires the cross-checks to the containing repo — root via git, paths via the walked tree, published gates from the three published sources — and `--no-git` skips them | P3 | P3 | `packages/agentic-workflow/bin/agentic-workflow.mjs` | `bun test packages/agentic-workflow/test/verify.test.mjs` exits 0 with the CLI wiring cases | `E` line in `## Log` (`E4`) | verified |
| O5 | S1 (documentation currency) | the crate README documents the closed citation grammar, the two codes and the skip semantics | P4 | P4 | `packages/agentic-workflow/README.md` | `rg -c "cited-path-missing" packages/agentic-workflow/README.md` matches 1 | `E` line in `## Log` (`E7`) | verified |
| O6 | S1 (generated projection) | adding this unit dir re-renders `docs/generated/units.md` through the generator | P1 | P1 | `scripts/docs-generate.mjs` | `bun scripts/docs-generate.mjs --check` exits 0 | `G` line in `## Log` (`G1`) | verified |
| O7 | S2 | one PR against `main` from `feat/227-deterministic-artifact-emitters`, conventional commits, body naming the interpretation | P6 | P6 | the session (`gh`) | `gh pr list --head feat/227-deterministic-artifact-emitters --state open --json url` matches 1 | `E` line in `## Log` (`E8`) | verified |
| O8 | S1 (the version-parity gate's rejection at `38e7c548` — re-cut 2026-11-09, see `## Log` `D2`) | a PR changing the crate's shipped content declares the bump intent in a valid `.changeset/*.md` naming `@gtrabanco/agentic-workflow` | P6 | P6 | `.changeset/227-deterministic-artifact-emitters.md` | `node scripts/version-parity-gate.mjs --content` exits 0 | `G` line in `## Log` (`G3`) | verified |

## Triaged steps

> Pasted verbatim from `bun scripts/unit-route.mjs --triage 227-deterministic-artifact-emitters`
(run 2026-11-09, `E2`). The two trailing `relay:` lines are session machinery the
local inline workflow does not use, so they are recorded here but not acted on:

```text
TRIAGE — 227-deterministic-artifact-emitters (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: release: small scope
Budget: strong
```

Execution follows the local apply workflow (`## Log` `L1`): the planning ledgers
above are the plan step, and review stays with the owner as the external
verifier.

## Acceptance criteria

One observable, testable criterion per requirement. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | the verifier refuses, with the typed codes `cited-path-missing` and `cited-gate-unknown`, a unit doc whose root-relative path citation is absent from the tree or whose gate citation resolves to nothing published, while every previously passing doc keeps its verdict | `bun test packages/agentic-workflow/test/verify.test.mjs` exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/201-operator-approved-pass-routing/SPEC.md` exits 0 |
| S2 | the change is delivered as one open PR against `main` from `feat/227-deterministic-artifact-emitters` with conventional commits | `gh pr list --head feat/227-deterministic-artifact-emitters --state open --json url` matches 1 |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #227
  ```
  followed by the nine-step local workflow (verbatim intent, frozen-failure
  corpus first, fixtures before the real tree, work inline without the repo's
  own review machinery, freeze the planning ledgers, test-first slices,
  documentation via surfaces, writer's verification and hand-off, correction
  bounds).
- **L2** — 2026-11-09, the follow-up, verbatim:
  ```
  Create the PR
  ```
- **D1** — 2026-11-09, state resolution (the workflow's step 0): the issue's
  remaining live scope after its own 2026-11-03 re-scope and 2026-11-07
  deprecation record is the verifier's tree cross-checks; the verifier itself
  shipped in PR #467 (`c74ce777`) and the producer halves are retired. The
  resolution was reported as a `mismatch` with three options; the owner's
  "Create the PR" selected delivering the residual cross-checks as one PR.
  The retired producer emitters stay retired.
- **D2** — 2026-11-09, ledger re-cut forced by the gate: the pre-push local gate rejected `version-parity-content` at `38e7c548` — a PR changing the crate's shipped content must declare the bump intent in a changeset (the release applies it). This disproves `PE-006` as first sampled (the no-changeset precedent was the owner's direct-to-`main` batches, not a PR rule); `PE-006` is corrected and `O8` added. The changeset `.changeset/227-deterministic-artifact-emitters.md` (minor, `@gtrabanco/agentic-workflow`) is the repair.
- **E1** — 2026-11-09, `bun scripts/ceremony.mjs tier classify --paths packages/agentic-workflow/src/verify/Verify.mjs packages/agentic-workflow/bin/agentic-workflow.mjs packages/agentic-workflow/test/verify.test.mjs packages/agentic-workflow/README.md` · exit 0 · tier `standard`, signals `[]`.
- **E2** — 2026-11-09, `bun scripts/unit-route.mjs --triage 227-deterministic-artifact-emitters` · exit 0 · steps `research, design, plan, implement, tests, evidence, review, docs`; relay lines recorded, not acted on.
- **P1** — 2026-11-09, planning ledgers frozen (Planning evidence `PE-001…PE-006`, Obligations `O1…O7`, all `planned`) and the generated projection re-rendered · commit `7886ecc5`.
- **E3** — 2026-11-09 (RED, at `4b5b4ff5`), `bun test packages/agentic-workflow/test/verify.test.mjs` · exit 1 · 17 pass / 3 fail — exactly the stale-path, unpublished-gate and CLI-wiring refusal cases; every pre-existing case still passes.
- **P2** — 2026-11-09, the two cross-checks implemented in `packages/agentic-workflow/src/verify/Verify.mjs` (closed claim grammar, injected `pathExists`/`rootHasDir`/`gateKnown`), CLI repo resolvers wired in `packages/agentic-workflow/bin/agentic-workflow.mjs`, README row updated · commit `38e7c548`.
- **E4** — 2026-11-09 (GREEN, at `38e7c548`), `bun test packages/agentic-workflow/test/verify.test.mjs` · exit 0 · 20 pass / 0 fail (bun) and `node --test test/verify.test.mjs` · exit 0.
- **E5** — 2026-11-09, `cd packages/agentic-workflow && bun run test` · exit 0 · 542 pass / 0 fail (28 files); `bun run test:node` · exit 0.
- **E6** — 2026-11-09, differential vs the base commit `7886ecc5` (throwaway `git archive` copy under `/tmp`, removed after): `verify` on a clean doc, a section-missing doc and the published 201 doc — with and without repo context — byte-identical stdout/stderr/exit against the base binary; the only sanctioned delta on a clean doc is the receipt's `checks` array gaining `cited-paths`/`cited-gates`.
- **E7** — 2026-11-09, `rg -c "cited-path-missing" packages/agentic-workflow/README.md` · matches 1.
- **D2** — 2026-11-09, ledger re-cut forced by the gate: the pre-push local gate rejected `version-parity-content` at `38e7c548` — a PR changing the crate's shipped content must declare the bump intent in a changeset (the release applies it). This disproves `PE-006` as first sampled (the no-changeset precedent was the owner's direct-to-`main` batches, not a PR rule); `PE-006` is corrected and `O8` added. The changeset `.changeset/227-deterministic-artifact-emitters.md` (minor, `@gtrabanco/agentic-workflow`) is the repair.
- **P3** — 2026-11-09, the release intent committed and the parity gate re-run green · commit `46bca783`.
- **G1** — 2026-11-09, gate runs at HEAD 46bca783728770cfa3a088bc6a7aa59981d6e77a — `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS · 0 missing · 0 stale · 0 orphaned`.
- **G2** — 2026-11-09, gate runs at HEAD 46bca783728770cfa3a088bc6a7aa59981d6e77a — `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/201-operator-approved-pass-routing/SPEC.md` · exit 0 · `VERIFY PASS`, `checks` include `cited-paths` and `cited-gates`; and the two refusal classes demonstrated live on disposable docs (removed after the run): a stale `scripts/…` citation → `cited-path-missing` exit 2, an unpublished `` `…` gate `` citation → `cited-gate-unknown` exit 2.
- **G3** — 2026-11-09, gate runs at HEAD 46bca783728770cfa3a088bc6a7aa59981d6e77a — `node scripts/version-parity-gate.mjs --content` · exit 0.
- **E8** — 2026-11-09, `gh pr create --base main --head feat/227-deterministic-artifact-emitters` · PR [#472](https://github.com/gtrabanco/agentic-workflow/pull/472) opened (`gh pr list --head feat/227-deterministic-artifact-emitters --state open --json url` matches 1); the pre-push hook's documented escape hatch (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`) was used for the initial branch push and recorded in the PR body — the full local gate's only reds were #468's pre-existing in-flight red-first pair on `main` (implementation lands via open PR #469) and this unit's own pending roadmap settle, closed by this settle batch.
- **P4** — 2026-11-09, the settle batch: roadmap row 227 written via the crate's `roadmap rowUpsert` (issue-keyed, the 396 precedent; receipt `roadmap-table@1` pass), row 53 annotated with the settlement, PR URL recorded above, this log appended.

## Next

The owner's external verdict on PR [#472](https://github.com/gtrabanco/agentic-workflow/pull/472) — this session is not the verifier. Note for the owner: the root gate stays red on `scripts/log-immutability.test.mjs` until #469 merges (pre-existing on `main`, not this unit's).

## References

- Issue [#227](https://github.com/gtrabanco/agentic-workflow/issues/227) — this unit (closed by PR [#472](https://github.com/gtrabanco/agentic-workflow/pull/472))
- Roadmap rows 227 (this unit, issue-keyed) and 53 (retired producer halves, annotated)
- PR [#467](https://github.com/gtrabanco/agentic-workflow/pull/467) — where the verifier itself landed (#260)
