---
type: feature
scope: medium
roadmap_summary: Issue [#564](https://github.com/gtrabanco/agentic-workflow/issues/564) (M): init-workspace verification materialization — declared boundaries become project-local enforcement, feature map, evidence-capture driver
---

# 557 — verification-materialization

> One-line: give `init-workspace` a materialization step that converts charter/interview answers about verification into project-local artifacts — scaffolded config/code or filed issues on the target forge.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Boundary-enforcement scaffolding.**
> "for each declared architectural boundary whose enforcement answer is \"prose only\", propose the machine rule for the detected stack (dependency-cruiser/lint-import/tsconfig-paths–shaped, agnostic by detection) — written to the target repo on consent, or filed as an issue/feature on the target forge on preference."

**S2 — Feature-map scaffold.**
> "docs/workflow/FEATURE_MAP.md in `template/` — per user-facing flow: what exists, how a user reaches it, what evidence demonstrates it — seeded from `discover-repository-state` evidence, maintained by the lane's docs step."

**S3 — Evidence-capture convention.**
> "unit-doc acceptance criteria may name artifact evidence (screenshot/video/state-snapshot digest) captured via a driver the project declares (one charter answer names the driver command; the workflow records and invokes it, never ships one)."

**S4 — Declaration-enforcement check.**
> "a boundary declared in `ARCHITECTURAL_INVARIANTS.md`/charter with no named enforcement mechanism becomes a finding (routed via the existing review-design / audit-docs finding vocabulary) — a declared-but-unenforced boundary is exactly the \"lives in reviewer memory\" defect the mapped talk warns about."

**S5 — Outcome-as-issues option.**
> "every materialization item can instead land as a well-formed issue on the target forge (when the team wants to build it themselves), using the target's own conventions."

**S6 — Bootstrap consent gate.**
> "A bootstrap whose interview records a prose-only boundary ends with either that boundary's machine rule present in the target repo (consented) or a filed target-forge issue proposing it — never silently prose-only."

**S7 — Feature-map template.**
> "The feature-map template ships in `template/`, is seeded on bootstrap, and the lane's docs step documents its update duty."

**S8 — Evidence driver contract.**
> "An acceptance criterion naming artifact evidence records the artifact digest in the Evidence row and names the project-declared driver command; with no driver declared, the criterion fails closed with an explicit `manual:` label instead."

**S9 — Unenforced boundary finding.**
> "A declared boundary with no enforcement named produces a typed finding (not prose), route resolvable per the finding-route vocabulary."

**S10 — Consent gates.**
> "Every consent gate holds: no file written and no forge issue filed without explicit yes; both refusals record residuals."

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 (S1) | A `prose-only` boundary settles as `scaffold` (the project's rule file in the tree, the charter answer flipped to `machine: <mechanism>`), `issue` (a forge reference recorded) or `declined` (with its reason) — and a scaffold whose artifact is absent blocks the batch, so no answer stays silently prose-only | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the consented-scaffold, filed-issue, declined and missing-artifact cases) |
| AC-2 (S2) | `template/docs/workflow/FEATURE_MAP.md` ships with its declared columns, and the discovery step seeds one row per user-facing flow from evidence | `rg -c '^feature-map@1$' template/docs/workflow/FEATURE_MAP.md` matches 1, and `rg -c 'User-facing flows' skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` matches 1 |
| AC-3 (S3) | The project declares its capture driver in one charter answer, and a criterion naming `artifact: screenshot\|video\|state-snapshot` records its digest with that command | `rg -c '^- \*\*Evidence driver:\*\*' template/AGENTS.md` matches 1, and `bun test packages/agentic-workflow/test/materialize.test.mjs` (the `a criterion naming a capture records its digest and the declared driver command` case) |
| AC-4 (S4) | A boundary declared with no named enforcement — in the charter slot or in an `ARCHITECTURAL_INVARIANTS.md` section — is a typed finding, never prose | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the `a prose-only boundary with no recorded outcome is a typed finding…`, `an invariant section that names no enforcement is a finding` and `a fenced example … is never read as a declaration` cases) |
| AC-5 (S5) | Every materialization item can land as a forge issue instead: the reference is recorded, the charter answer is untouched, and a project with no forge degrades to scaffold-or-decline rather than failing the run | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the `a filed issue is recorded and leaves the charter answer untouched` case) |
| AC-6 (S6) | A bootstrap whose interview records a prose-only boundary ends with the rule in the target or a filed issue: the plan names it as a residual and the check blocks on it | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the CLI `MATERIALIZE PLAN … verdict: PENDING` and `MATERIALIZE CHECK BLOCKED` cases) |
| AC-7 (S7) | The feature map is seeded on bootstrap and the lane's docs step documents its update duty, so a changed flow cannot land with a stale map | `rg -c 'FEATURE_MAP.md' skills/unit-lane/references/DOCS.md` matches 2 |
| AC-8 (S8) | A capture criterion records `digest: sha256:<hex>` plus the declared driver command in its evidence carrier (the `## Evidence` table or the `## Log` `E` lines); with no driver declared it fails closed with `manual: <AC>` and exit 1 | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the four artifact-evidence cases and the evidence CLI case) |
| AC-9 (S9) | The unenforced-boundary finding is typed from a published vocabulary and its route matches `finding-route@1` (a single-input verb plus its concrete target), never bespoke prose | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the `every finding code the check can emit is in the published set` and route assertion cases), and `bun test scripts/normative-drift.test.mjs` exits 0 |
| AC-10 (S10) | Every consent gate holds: no file written and no forge issue filed without an explicit yes, an absent consent is a refusal with nothing written, and a refusal records one residual per item | `bun test packages/agentic-workflow/test/materialize.test.mjs` (the `apply without an explicit consent is refused before any byte moves`, `a declined consent writes nothing and records one residual per item` and CLI refusal cases) |

## Impact

- `init-workspace` skill: gains the materialization round as a reference
  (`skills/init-workspace/references/MATERIALIZATION.md`) and its write-step
  invocation; the reference
  allowlist grows from seven paths to eight, and the entrypoint states the new
  duty.
- `template/`: two new documents (`template/docs/workflow/FEATURE_MAP.md`,
  `template/docs/workflow/BOUNDARY_ENFORCEMENT.md`), the charter's `Evidence driver` slot,
  two documentation-map rows, and the `Enforcement` bullet in the invariants
  shape.
- `review-change` / `audit-docs`: `audit-docs` gains check 17 (the
  declaration-enforcement check) and its report count moves to 17; the finding
  vocabulary is the crate's published set, so `review-change`'s axes consume it
  without a second definition.
- `verification-contract` owns the artifact-evidence convention; `unit-lane`'s
  docs step owns the feature map's update duty.
- Schema package: three closed vocabularies (`MATERIALIZATION_OUTCOMES`,
  `MATERIALIZATION_FINDING_CODES`, `ARTIFACT_EVIDENCE_KINDS`), re-exported from
  the package index.
- Runner crate: the `materialize` subcommand (four operations), its README row
  and its `materialization@1` field contract; the pi package's `CRATE_COMMANDS`
  gains the command.
- Consumes answers from `engineering-interview` (556) — the `Architectural
  boundaries` slot and the new `Evidence driver` slot.
- Target projects: gain the actual boundary record, a seeded feature map, and a
  deterministic answer to "is this boundary enforced?" instead of a sentence in
  a reviewer's memory.
- **Named high-risk item (`ceremony tier classify`, PE-016):**
  `packages/agentic-workflow/bin/agentic-workflow.mjs` — the crate's bin sits on
  a **destructive** import graph the classifier already carried before this
  unit; the new case only dispatches a service whose single writer is
  consent-gated and refuses before any byte moves.

## Retirements

None — this unit retires no surface. It is strictly additive, so its answer is the
computed inventory instead of a retirement list
(`bun scripts/residual-classify.mjs --inventory --base main`), and every added
surface is bound to a claim this unit records:

```text
residual-classify-inventory@1 — base main
surface                                                kind  state    reason
packages/agentic-workflow/test/materialize.test.mjs     file  andamio  recorded-planned-consumer
```

The module, the templates and the skill surfaces the change adds have live
consumers (the suite imports the module, the bin dispatches it, the write step
cites the reference), so they classify as `used` and never reach the list above.
`andamio` is the correct state for a new suite file: the plan claims it (P1) and
its consuming unit is this one, recorded in `decisions.md`'s
`residual-promise@1` block. No row is `orphan`, so there is nothing legitimately
retirable, and the later sweep reclaims nothing.

## Non-goals

- Shipping any verification implementation in this repo's product (always target-local)
- The interview itself (556 owns it)
- Forge-agnostic issue filing on target projects that have no forge (degrades to scaffold-only)

## Risk tier

`high` — verdict copied verbatim from
`node packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
--base main` (PE-016):

- **`passive`** — documentation, images, comments, prose with no executable
  effect. This unit doc is **not created at all**: the readback lives in
  `docs/passive/<id>.md` (block `passive-record@1`: id, tier, paths, readback,
  gate), and the project's deterministic gate is the whole verification.
- **`standard`** — the ceremony this document describes.
- **`high`** — this document **plus** the named high-risk item from the
  verdict's `signals[]`, quoted in `## Impact`, plus the full review pass.

**Task Size = Understood + Contained risk + Resumable-from-diff.** File counts
never decide.

- **Tier** — `high` · **Task Size** — `standard`
- **Named high-risk item** — `packages/agentic-workflow/bin/agentic-workflow.mjs` · `destructive` (pre-existing import graph; the new case dispatches a consent-gated service)

## Future

forge-agnostic issue filing for GitLab/SVN/etc. when the target has no GitHub-like forge.

## Future cost

Finding vocabulary reuse must not stretch `finding-route@1` semantics.

## Applicable tests

The crate's suite (the service's contract, the CLI receipts and the refusals),
the schema package's vocabulary suite, the root suite's vocabulary-parity and
drift gates, and the budget/gate-inventory checks the new surfaces move:

- `bun test packages/agentic-workflow/test/materialize.test.mjs`
- `bun test packages/agentic-workflow-schema/test/materialization.test.mjs`
- `bun test scripts/vocabulary-parity.test.mjs`
- `bun test scripts/normative-drift.test.mjs`
- `bun scripts/prose-gate-inventory.mjs`, `bun scripts/skill-lint.mjs`,
  `bun scripts/check-skill-context.mjs` and `--documents`

## Known pre-existing issues

none

## Tasks

- [x] P1 — Cut the service's contract red in `packages/agentic-workflow/test/materialize.test.mjs`: the four operations, the closed sets, the consent gate, the idempotent second apply and the fail-closed evidence check (validator: `bun test packages/agentic-workflow/test/materialize.test.mjs` exits 0)
  (Implements: S1, S3, S4, S5, S8, S9, S10)
  - Relevant files: packages/agentic-workflow/test/materialize.test.mjs
- [x] P2 — Implement the four operations and the CLI dispatch in `packages/agentic-workflow/src/materialize/materialize.mjs` — `plan`, `check`, `apply` (the only writer, consent-gated) and `evidence` — and dispatch them from `packages/agentic-workflow/bin/agentic-workflow.mjs` (validator: `bun test packages/agentic-workflow/test/materialize.test.mjs` exits 0)
  (Implements: S1, S3, S4, S5, S6, S8, S9, S10)
  - Relevant files: packages/agentic-workflow/src/materialize/materialize.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md
- [x] P3 — Publish the three closed vocabularies in `packages/agentic-workflow-schema/src/vocabularies.ts` and pin the crate's mirror to them (validator: `bun test packages/agentic-workflow-schema/test/materialization.test.mjs` exits 0 and `bun test scripts/vocabulary-parity.test.mjs` exits 0)
  (Implements: S1, S3, S4)
  - Relevant files: packages/agentic-workflow-schema/src/vocabularies.ts, packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/test/materialization.test.mjs, scripts/vocabulary-parity.test.mjs
- [x] P4 — Ship the templates: the feature map, the boundary record, the charter's `Evidence driver` slot with its bank row, and the invariants enforcement bullet (validator: `bun test packages/agentic-workflow/test/materialize.test.mjs` exits 0 with the shipped-template cases)
  (Implements: S2, S3, S4, S7)
  - Relevant files: template/docs/workflow/FEATURE_MAP.md, template/docs/workflow/BOUNDARY_ENFORCEMENT.md, template/AGENTS.md, template/docs/architecture/ARCHITECTURAL_INVARIANTS.md, skills/init-workspace/references/ENGINEERING_INTERVIEW.md
- [x] P5 — Wire the round into `init-workspace`: its reference, the landing step's call, the discovery inputs and the entrypoint citation (validator: `rg -c 'runner materialize apply' skills/init-workspace/references/BOOTSTRAP_WRITE.md` matches 1 and `rg -c 'MATERIALIZATION.md' skills/init-workspace/SKILL.md` matches 2)
  (Implements: S6)
  - Relevant files: skills/init-workspace/references/MATERIALIZATION.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md, skills/init-workspace/SKILL.md
- [x] P6 — Give the convention and the duty their owners: the artifact-evidence clause in `verification-contract`, the feature-map duty in the lane's docs step (validator: `rg -c 'FEATURE_MAP.md' skills/unit-lane/references/DOCS.md` matches 2)
  (Implements: S2, S3, S7, S8)
  - Relevant files: skills/verification-contract/SKILL.md, skills/unit-lane/references/DOCS.md
- [x] P7 — Run the check from the audit that reads declarations: `audit-docs` check 17 and its report count (validator: `rg -c '^17\. \*\*Declared-but-unenforced' skills/audit-docs/SKILL.md` matches 1)
  (Implements: S4, S9)
  - Relevant files: skills/audit-docs/SKILL.md
- [x] P8 — Declare the machine surfaces and re-pin what they spend: the four `normative-surfaces@1` rows, the gate-inventory row, and the two budgeted documents (validator: `bun test scripts/normative-drift.test.mjs` exits 0, `bun scripts/prose-gate-inventory.mjs` exits 0 and `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S1, S3, S4)
  - Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json
- **P9** — Verify the unit: ledgers closed, projection current, unit doc valid, repository gate green (validator: `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10)
  - Relevant files: docs/features/557-verification-materialization/SPEC.md, docs/features/557-verification-materialization/planning-obligations.md, docs/LOGS.md

### Planning evidence

The ledger is frozen beside this document in
[`planning-evidence.md`](planning-evidence.md) (PE-001…PE-017) — this unit is M,
so the tables live in their own files, never embedded here.

### Obligations

The ledger is frozen beside this document in
[`planning-obligations.md`](planning-obligations.md) (O1…O21, every row
`verified` before hand-off) — this unit is M, so the tables live in their own
files, never embedded here.

## Triaged steps

> Awaiting `unit-route` execution after lane triage.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-15, the request (GitHub issue #564):
  ```
  NEW FEATURE: init-workspace verification materialization — declared boundaries become project-local enforcement, feature map, evidence-capture driver
  ```
- **L2** — 2026-11-16, the owner's local-workflow request, verbatim:
  ```
  Apply to this repository: issue #564
  ```
  (the state resolved the intent as **continue**: the unit was already promoted,
  its hard blocker #563 is closed, and the next incomplete phase was the plan).
- **D2** — 2026-11-16, the local-workflow substitution (`decisions.md` D2): no
  `review-change`, no `audit-pr`, no fold cycle on this surgery; the frozen
  ledgers are the plan, the deterministic gates run always, and the owner is the
  external verifier of the handed-over diff.
- **D3** — 2026-11-16, the mechanism is the project's, never the workflow's:
  `apply` refuses a `scaffold` without a `mechanism` string, so nothing
  stack-specific ships and no stack is named in the skills.
- **D4** — 2026-11-16, `audit-docs` (not `review-design`, which is UI-scoped) carries
  the unenforced-boundary finding as check 17.
- **D5** — 2026-11-16, two shipped pins follow their source with their property
  unchanged: the template's charter-slot count 21 → 22 (the `Evidence driver`
  slot) and the interview bank's row count 16 → 17 with its area totals (VER-03).
- **E1** — 2026-11-16, `bun test packages/agentic-workflow/test/materialize.test.mjs` · exit 1 · `Cannot find module '../src/materialize/materialize.mjs'` — the red commit `67b941d4` carries the suite alone.
- **P1** — 2026-11-16, the service's contract cut red over fixtures only (the live tree was never a mutating target) · `67b941d4`.
- **E2** — 2026-11-16, `bun test packages/agentic-workflow/test/materialize.test.mjs` · exit 0 · `40 pass / 0 fail` (the four operations, the consent gate, the idempotent second apply, the fail-closed evidence check and six CLI cases).
- **P2** — 2026-11-16, the four operations, the CLI dispatch (module loaded on demand), the crate README row and its `materialization@1` contract · `06860bef`.
- **E3** — 2026-11-16, `bun test packages/agentic-workflow-schema/test/materialization.test.mjs` · exit 0 · `4 pass / 0 fail`; `bun test scripts/vocabulary-parity.test.mjs` · exit 0 · `23 pass / 0 fail` (the crate's mirror equals the published consts).
- **P3** — 2026-11-16, the three vocabularies published, the crate mirror pinned, `materialize` added to the pi package's `CRATE_COMMANDS` · `06860bef`.
- **P4** — 2026-11-16, the feature map, the boundary record, the charter slot with its bank row, and the invariants enforcement bullet · `caa586a1`.
- **P5** — 2026-11-16, the materialization round as a reference, the write-step invocation, the discovery inputs and the entrypoint citation · `bee19504`.
- **P6** — 2026-11-16, the artifact-evidence clause in `verification-contract` and the feature map's duty in the lane's docs step · `bee19504`.
- **P7** — 2026-11-16, `audit-docs` check 17 with the report count · `caa586a1` (the skill) and `bee19504`.
- **P8** — 2026-11-16, the four normative rows, the gate-inventory row and the two rebased documents · `2a0cd5bd`.
- **E4** — 2026-11-16, the reader counts each obligation's validator states: `rg -c '^feature-map@1$' template/docs/workflow/FEATURE_MAP.md` = 1 · `rg -c '^boundary-enforcement@1$' template/docs/workflow/BOUNDARY_ENFORCEMENT.md` = 1 · `rg -c '^- \*\*Evidence driver:\*\*' template/AGENTS.md` = 1 · `rg -c '^\| VER-03 \|' skills/init-workspace/references/ENGINEERING_INTERVIEW.md` = 1 · `rg -c '^- Enforcement: ' template/docs/architecture/ARCHITECTURAL_INVARIANTS.md` = 1 · `rg -c 'runner materialize apply' skills/init-workspace/references/BOOTSTRAP_WRITE.md` = 1 · `rg -c 'MATERIALIZATION.md' skills/init-workspace/SKILL.md` = 2 · `rg -c 'FEATURE_MAP.md' skills/unit-lane/references/DOCS.md` = 2 · `rg -c 'artifact: screenshot' skills/verification-contract/SKILL.md` = 1 · `rg -c '^17\. \*\*Declared-but-unenforced' skills/audit-docs/SKILL.md` = 1.
- **E5** — 2026-11-16, `bun test scripts/normative-drift.test.mjs` · exit 0 · `21 pass / 0 fail` (the four rows resolve in the inventory); `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS` (every new surface is cited by a gate row).
- **E6** — 2026-11-16, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 104 file(s)`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 30 skills`; `--documents` · exit 0 · `PASS context documents: 4`; `--routes` · exit 0 · `PASS route budgets: 14 routes`.
- **E7** — 2026-11-16, `bun test scripts/review-loop-discipline.test.mjs` · exit 0 · `PASS` (the audit-docs contract at 17 checks, the 22 charter slots).
- **E8** — 2026-11-16, `bun test --timeout=10000 test/` in `packages/agentic-workflow` · exit 0 · `975 pass / 0 fail` (the crate suite, including the two bank pins this unit moved).
- **G1** — 2026-11-16, `bun scripts/local-gate.mjs --skip-network --jobs 2 --no-bail` · exit 0 · `local-gate: PASS — 15 step(s) in 853s` (root-suite 262s, crate bun 414s / node 130s, schema 15s, pi 31s) — run over the working tree on top of `67b941d40309c5934a1f04a50fd8d423dcf8e929` (the red commit), where the slices landed. HEAD 67b941d40309c5934a1f04a50fd8d423dcf8e929
- **E10** — 2026-11-16, `bun scripts/docs-generate.mjs --check` · exit 0 · `3 files checked · 0 missing · 0 stale · 0 orphaned`, `roadmap unchanged`.
- **G2** — 2026-11-16, `bun scripts/local-gate.mjs --skip-network --jobs 2 --no-bail` · exit 0 · `local-gate: PASS — 15 step(s) in 744s` (root-suite 167s, crate node 186s, schema 23s, pi 48s) — the full gate again at the committed head `7dd4447e68ec71f1f21a233d2f1eae5bf6275f31`, after the unit doc, the ledgers and the journal fragment landed. HEAD 7dd4447e68ec71f1f21a233d2f1eae5bf6275f31
- **E9** — 2026-11-16, `node packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/557-verification-materialization/SPEC.md` · exit 0 (the closed ledgers, the receipts and the tree citations); `node scripts/promise-coherence.mjs docs/features/557-verification-materialization/SPEC.md` · exit 0 · `verdict PASS`.
- **P9** — 2026-11-16, the unit verified: ledgers closed, projection current, unit doc valid, repository gate green.
 — valid feature proposal. Hard dependency on 556 (engineering interview) is correct: materialization consumes the interview's enforcement answers. Well-structured with clear consent gates and stack-agnostic design.

## Next

Run `/unit-lane 557-verification-materialization` to begin the design phase (after 556).

## References

- Depends on: #563 (engineering interview, hard)
- Extends: #435 (charter layers 1-2), mapped talk points 2, 3, 4
- D6 — 2026-11-16, the L2-P9 block above was first appended dated 2026-11-17, a day ahead of the session's UTC date (2026-11-16) and therefore a future-dated evidence line, which is exactly the receipt-fabrication tell `verify` exists to catch. The dates are corrected in place before any review of this unit and recorded here rather than silently: the commands, the exit codes and the outputs those lines name are the runs of this session. This is the one edit the block takes.
