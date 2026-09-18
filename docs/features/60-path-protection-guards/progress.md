# Progress — 60-path-protection-guards

Ledger of stage receipts and gate traces for this unit. One receipt per review.

## Pre-execution review receipts

### spec — 2026-09-18

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-60-1 · Snapshot: e48019513667407db008d313039d7a6a1800708ced1d8582ea9aa9a313b53dae · Verdict: spec-review-fail
- Unit: 60-path-protection-guards · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 8c52eef5a5186d4061cef639005c74e8433028d5 · Artifact revision: 8c52eef5a5186d4061cef639005c74e8433028d5
- Reviewer: review-spec (fresh context, manual route) · Session: 01a0b355-127d-7302-a9d2-cf324f5c14a4 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T07:05:00Z/2026-09-18T07:10:30Z · Findings: 3 (material open: 3)
```

Notes:
- `artifactRevisionId` was left to the builder's derived default — no explicit author
  handoff id was carried into this manual review turn. The design turn left
  `SPEC.md` / `decisions.md` untracked, and an untracked bound artifact can never
  re-derive `structural.fresh: true` (the sensor names it
  `stale-artifact-content`), so the reviewer committed the author's already-written
  bytes unchanged at `8c52eef5` (message `docs(features): design 60
  path-protection-guards product half`; `SPEC.md`, `decisions.md`, and the row-60
  `ROADMAP.md` hunk; no byte edited). The receipt then pins that commit for both
  `sourceRevision` and `artifactRevisionId`. This is a process observation, not a
  Product finding.
- Snapshot built by `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit
  60-path-protection-guards` (canonical serializer over the in-repo
  `packages/agentic-workflow-schema/dist`, rebuilt this turn because `dist/` is
  gitignored generator output). It bound one artifact: `spec`
  (`docs/features/60-path-protection-guards/SPEC.md`, selector `spec-product-v1`,
  22425 bytes, sha256 `ba7f20b4a9d8482cb17a7c4210fa6049b5d7da97a38a25fc770d9ba233b9616b`),
  and three contexts: `project-guide` present (`CLAUDE.md`,
  `f5c8e1428d27e96c4831cd6929b02cf45a14e4506e23bc12b89a0bd7eaea6b00`),
  `normalized-repository-state` present (`docs/workflow/REPOSITORY_STATE.md`,
  `e1b81e29138706dde46416cf93cfb0cb3a0605af384401f7d48a5e4ebb10d492`),
  `architectural-invariants` absent
  (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
  Roadmap row 60 is routing data and is deliberately unbound.
- Governing issue #220 was consulted live via `gh` (OPEN; title and body match the
  Tier 1/Tier 2 split, the shipped defaults, the escape hatch, and the non-goals
  the SPEC records). The builder's fixed context set carries no `governing-issue`
  row, so the forge evidence is recorded here rather than in the snapshot.
- Findings for this snapshot: `planning-findings.md` (`SPEC60-F1`…`SPEC60-F3`).
- Self-check: `bun scripts/pre-execution-snapshot.mjs verify --stage spec --unit
  60-path-protection-guards --dir docs/features/60-path-protection-guards
  --unit-kind feature` → `structural.fresh: true`, `current: false` (the persisted
  verdict is a FAIL), exit 4 — the verdict itself is the emit result.
- No reviewed artifact was modified by this review: `SPEC.md`, `decisions.md`, and
  the `ROADMAP.md` row-60 bytes are exactly as the design turn wrote them.

### spec — 2026-09-18 (re-review, revision 2)

```text
## Pre-execution review receipt v1 — spec
- Review: SPEC-REVIEW-60-2 · Snapshot: 12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e · Verdict: spec-review-pass
- Unit: 60-path-protection-guards · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 7e9f6f543719ded87d9da03385b7ba99bd2ab93d · Artifact revision: 7e9f6f543719ded87d9da03385b7ba99bd2ab93d
- Reviewer: review-spec (fresh context, manual route) · Session: 01a0b3a3-6bb6-7302-a9d2-cf3e68fd6ff7 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T08:30:27Z/2026-09-18T08:35:12Z · Findings: 0 (material open: 0)
```

Notes:
- Snapshot built by `bun scripts/pre-execution-snapshot.mjs build --stage spec --unit
  60-path-protection-guards` over the revision-2 bytes. It bound one artifact: `spec`
  (`docs/features/60-path-protection-guards/SPEC.md`, selector `spec-product-v1`,
  24443 bytes, sha256
  `50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`), and three
  contexts: `project-guide` present (`CLAUDE.md`,
  `f5c8e1428d27e96c4831cd6929b02cf45a14e4506e23bc12b89a0bd7eaea6b00`),
  `normalized-repository-state` present (`docs/workflow/REPOSITORY_STATE.md`,
  `e1b81e29138706dde46416cf93cfb0cb3a0605af384401f7d48a5e4ebb10d492`),
  `architectural-invariants` absent
  (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
- `artifactRevisionId` is the builder's content-derived identity
  (`contentRevision` over the bound paths): the repair commit `7e9f6f54` is the newest
  commit touching `SPEC.md`; `44732c8b` only appended the resolution evidence to
  `planning-findings.md`, which is not a bound path. No author handoff id was carried
  into this manual review turn, so the manual mutate-and-revert guarantee rests on the
  bound digest: any later edit to `SPEC.md` rotates the identity and makes this receipt
  `stale-artifact-content`.
- Governing issue #220 was re-read live via `gh` (OPEN; the body still matches the
  Tier 1/Tier 2 split, defaults, escape hatch, and non-goals). The builder's fixed
  context set carries no `governing-issue` row, so forge evidence is recorded here
  rather than in the snapshot. Roadmap row 60 reads `defined` (routing data, unbound).
- Falsification (clean context, before the checks): three decisions a hostile reader
  could call invented — the policy-config-as-protected addition (D4 / D-60-7), the
  tighten-only intersection rule (D2 / D-60-5 / PE-14), the plan-declared freeze point
  (D1 / D-60-3) — all recorded with authority and rationale, none unrecorded. The one
  product promise with only indirect coverage is the plan's per-test justification: AC1
  and AC6 exercise the phase × path-class matrix and the create-vs-modify freeze effect,
  while the plan-declaration grammar that encodes "every test justified" is an explicit
  engineering deferral (Deferred decisions row 1 → `plan-feature`), so it is a deferral,
  not an unverified promise; the bullet's headline (plan-declared test set + freeze
  point) does map to AC1/AC6. No role is left unspecified — the five derived roles ×
  four capabilities are fully filled. Falsifier for the half: it would be wrong if the
  `decisions` ledger's `human-owner:ratified-verdicts` / `execute-phase:phase-decisions`
  column sets or the `finding-mark@1` single-writer rule did not exist, or if pi
  `tool_call` could not block — all three re-verified true (`LEDGERS.md`
  `ledger-ownership@1` + "The durable finding mark"; pi `docs/extensions.md` §tool_call).
  Stance before the checks: NO-CONFIRMED-GAPS.
- Checks (14/14):
  - C1 pass — `SPEC.md:93-114` each in-scope item names an observable result; AC1–AC10.
  - C2 pass — `SPEC.md:242-253` five derived roles × four capabilities, no blank cell.
  - C3 pass — `SPEC.md:154-196` three entities resolve CRUD + transitions, each `n/a` reason-stated.
  - C4 pass — `SPEC.md:112-114,168-170,185-187` absent/malformed config, unmatched record, and auto-approval are the failure/empty states and each resolves; no size/concurrency surface exists for a glob policy.
  - C5 pass — `SPEC.md:118-134` eight out-of-scope bullets, each naming an owner or a non-goal.
  - C6 pass — `SPEC.md:142-149` derived inventory (recorded because `docs/CAPABILITIES.md` is unseeded, verified placeholders) has one row per item at `SPEC.md:200-236`, none skipped.
  - C7 pass — `SPEC.md:259-273` 15 rows (≥ 10 for M), every row in-scope with a pointer.
  - C8 pass — AC1–AC10 are objective; AC8 labels its read-verified clause; in-scope bullets map to criteria (`SPEC.md:362-364`).
  - C9 pass — no two sections assert incompatible behaviour, counts, or ownership (the repaired D5/entity/integration-closure triad is consistent).
  - C10 pass — existing-surface claims re-verified at HEAD: `scripts/phase-lint.mjs` and roadmap row 37 `done`; `template/.agentic-workflow/hooks/{guard-command.sh,README.md,adapters/}`; `packages/agentic-workflow`; `packages/pi-agentic-workflow`; `docs/CAPABILITIES.md` template placeholders; `docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent; pi `tool_call` blocking documented.
  - C11 pass — every product-stage evidence row in `decisions.md` uses the closed `authority-kind`/`freshness` vocabularies (`ROWS.md` § Closed vocabularies) and is `current`/`not-applicable` with no `drifted`/`stale` row; `unknown` rows: none.
  - C12 pass — `Deferred decisions` holds two rows with decide-by triggers: the grammar is an explicitly engineering-owned detail correctly routed to `plan-feature`, and the review-surface coupling is trigger-bound to feature 42; no unresolved product choice is deferred to engineering.
  - C13 pass — the Product half names vehicles inherited from the roadmap row and the issue (crate subcommand, pi extension, hooks home) but pre-fills no phases, tasks, or validators; the Engineering half is empty.
  - C14 pass — no current-unit obligation is exported; per-test justification, freeze point, fallback, and approval all stay inside this unit's scope.
- Repair verification (SPEC60-F1…F3, all `class: product`, previously `spec-review-fail`):
  F1 — the record home is now the unit's `decisions` ledger under the sanctioned
  `human-owner:ratified-verdicts` (owner) / `execute-phase:phase-decisions` (agent)
  column sets (`SPEC.md:174-179,218-222,337`), matching `LEDGERS.md`
  `ledger-ownership@1`; the `finding-mark@1` single-writer rule is cited only as the
  rejected surface. F2 — all evidence rows normalized (verified by value census:
  authority-kind ∈ {document, forge, repository, user}; freshness ∈ {current,
  not-applicable}; status ∈ {proven, decision}). F3 — AC10 freezes the tighten-only
  intersection, expectation 15 points at it (`SPEC.md:310-318,273`), and the spec-lint
  mapping adds it (`SPEC.md:363`). No repaired claim contradicted.
- Non-blocking observation (not a findings row): Expectation-sweep row 1 cites AC2 for
  "the checkpoint wiring" while the checkpoint-wiring criterion is AC8 (`SPEC.md:259`
  vs `:303-306`). AC8 exists and covers the expectation (and itself cross-references
  AC2), so no check fails; the pointer text is a cosmetic cross-reference imprecision.
- Self-check: `bun scripts/pre-execution-snapshot.mjs verify --stage spec --unit
  60-path-protection-guards --dir docs/features/60-path-protection-guards
  --unit-kind feature` → `structural.fresh: true`, `current: true`, exit 0.
- No reviewed artifact was modified: `SPEC.md`, `decisions.md`, and the `ROADMAP.md`
  row-60 bytes are unchanged; only this receipt ledger was appended.

### plan — 2026-09-18

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-60-1 · Snapshot: 40626cd083e620763d791c8b1408d248c610a67846b380242836a14e5c1b0ad8 · Verdict: plan-review-fail
- Unit: 60-path-protection-guards · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e · Parent Product receipt: SPEC-REVIEW-60-2
- Source revision: 6dddba5d27ed104f38385f4a48d4cbc69ed0cbf8 · Artifact revision: 6dddba5d27ed104f38385f4a48d4cbc69ed0cbf8
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (2026-09-18 authoring turn)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T08:55:00Z/2026-09-18T09:05:00Z · Findings: 8 (material open: 8)
- Ledgers read: planning-evidence 22 rows · obligations 17 rows (verified-capable: 15)
- Prior plan receipt (re-review only): none — first cycle
```

Notes:
- Snapshot built by `bun scripts/pre-execution-snapshot.mjs build --stage plan --unit
  60-path-protection-guards --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e` at one revision
  (`git rev-parse HEAD` = `6dddba5d…`, tree clean; `contentRevision` over the bound paths
  resolves to the same commit). It bound nine artifact rows whole-file — `spec` `SPEC.md`
  (46600 B), `acceptance` `ACCEPTANCE.md` (4577 B), `planning-evidence` (8860 B),
  `obligations` (7169 B), `plan` `PLAN.md` (12637 B), `tasks` `TASKS.md` (9777 B),
  `testing` (3608 B), `decisions` (16180 B), `architecture-notes` (3952 B) — and the three
  contexts `project-guide` present, `normalized-repository-state` present,
  `architectural-invariants` absent (NRS F010). Digest `40626cd0…0ad8` pasted above.
- Parent lineage confirmed by recomputation, never by prose: building the spec-stage
  snapshot at the Product receipt's own revision
  (`build --stage spec --unit 60-path-protection-guards --source-revision
  7e9f6f543719ded87d9da03385b7ba99bd2ab93d --artifact-revision
  7e9f6f543719ded87d9da03385b7ba99bd2ab93d`) reproduces exactly
  `12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`, the Snapshot the
  `SPEC-REVIEW-60-2` receipt records. The bound Product projection is still 24443 B
  sha256 `50b33e5d…920e` and the three contexts are unchanged, so the parent is current
  and only the Engineering half moved.
- `- Artifact revision:` binds the snapshot builder's canonical content-derived value
  (`6dddba5d…`), not the planner's handoff label `60-plan-1` (`PLAN.md:8-9`, `SPEC.md:388`).
  The label is recorded here beside the recomputed value per `POLICY.md` §7; the receipt
  field carries the derived value so a consumer's plain `verify --stage plan` matches, per
  the feature 55 (`docs/features/55-executable-golden-fixture/progress.md:155-166`) and
  feature 37 precedents.
- Falsification before the checks (fresh context): CONFIRMED-GAPS. The three strongest
  unsupported claims are the P3 normative-surface machine vocabulary (PLAN60-F2), the
  template-seed parity attributed to AC-09 (PLAN60-F5), and the Tier 2 guard's
  justification-record source (PLAN60-F6). No obligation is silently dropped; the gaps
  are a missing drift-gate task, an unenforced second pin, an unobservable checkpoint,
  and an under-specified Tier 2 condition.
- Findings for this snapshot: `planning-findings.md` (`PLAN60-F1`…`PLAN60-F8`).
- Self-check: see the JSON answer pasted beside the verdict block (POLICY §8, reviewer is
  consumer zero): `structural.fresh: true`, `current: false`, exit 4 — the persisted
  verdict is a FAIL, which is the emit result.
- No reviewed plan artifact was modified: `SPEC.md`, `ACCEPTANCE.md`, `PLAN.md`,
  `TASKS.md`, `testing.md`, `decisions.md`, `architecture-notes.md`, the two ledgers, and
  the `ROADMAP.md` row-60 bytes are byte-identical to the reviewed snapshot; only this
  receipt ledger and `planning-findings.md` were appended.

### plan — 2026-09-18 (re-review, revision 2)

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-60-2 · Snapshot: 4fd9b2e12fb702d91265774201366aa833ff4aeed58295ef3f02d464b5d41989 · Verdict: plan-review-fail
- Unit: 60-path-protection-guards · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e · Parent Product receipt: SPEC-REVIEW-60-2
- Source revision: 513e8c171fe2fc14ea987a1f419b72c9e7d2285f · Artifact revision: 513e8c171fe2fc14ea987a1f419b72c9e7d2285f
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (2026-09-18 authoring + PLAN60-F1…F8 repair turn)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T14:20:00Z/2026-09-18T14:36:00Z · Findings: 2 (material open: 2)
- Ledgers read: planning-evidence 26 rows · obligations 18 rows (verified-capable: 16)
- Prior plan receipt (re-review only): PLAN-REVIEW-60-1 @ 40626cd083e620763d791c8b1408d248c610a67846b380242836a14e5c1b0ad8
```

Notes:
- Snapshot built by the recipe owner at one revision: `bun scripts/pre-execution-snapshot.mjs
  build --stage plan --unit 60-path-protection-guards --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`. It bound nine
  artifact rows whole-file — `spec` `SPEC.md` (49317 B), `acceptance`
  `ACCEPTANCE.md` (5343 B), `planning-evidence` (11407 B), `obligations` (8321 B),
  `plan` `PLAN.md` (14573 B), `tasks` `TASKS.md` (11517 B), `testing` (4347 B),
  `decisions` (19567 B), `architecture-notes` (4411 B) — and three contexts
  `project-guide` present (`CLAUDE.md`, `f5c8e142…`),
  `normalized-repository-state` present (`docs/workflow/REPOSITORY_STATE.md`,
  `e1b81e29…`), `architectural-invariants` absent
  (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
  Digest `4fd9b2e1…1989` pasted above.
- `- Artifact revision:` binds the snapshot builder's canonical content-derived value
  (`513e8c17…`, the newest commit that touched a bound path), not the planner's
  handoff label `60-plan-2` (`PLAN.md:8-9`, `SPEC.md:388`). The label is recorded
  here beside the recomputed value per `POLICY.md` §7; the receipt field carries the
  derived value so a consumer's plain `verify --stage plan` matches (feature 55/59
  precedent).
- **L1 parent currency — current, by the decisive recomputation (POLICY §7).** The
  prior receipt `SPEC-REVIEW-60-2` binds Product snapshot `12121bff…1682e` at source
  revision `7e9f6f54` (Product projection `spec-product-v1`, 24443 B, sha256
  `50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`; contexts
  `project-guide` `f5c8e142…`, `normalized-repository-state` `e1b81e29…`,
  `architectural-invariants` absent). The coarse `verify --stage spec` answers
  `current: false`, `structural.fresh: false`, `reasonCode: stale-source-revision`,
  `changedPaths: [SPEC.md]`, exit 4 — the **expected consequence** of the sanctioned
  Engineering-half commit `513e8c17` that repaired PLAN60-F1…F8, which moved the SPEC
  file outside the Product selector (feature 59's identical reading). The decisive
  recomputation per POLICY §7: the pinned Product selector re-derived from current
  bytes is byte-identical (24443 B, sha256 `50b33e5d…920e`, equal to the recorded pin,
  claimed beside recomputed) and all three context rows are unmoved, so the parent
  state is **current**; only the revision field rotated. Never repaired by
  re-copying the digest. `audit-pr`'s lineage gate reads the same dimension.
- **L2 evidence integrity — pass.** 26 rows PE-001…PE-026, every one `current` +
  `proven` (none `drifted`/`stale`; no `unknown`). Load-bearing rows re-verified
  first-hand this turn: PE-001 (`package.json` no `bin`/`scripts`; `bin/turn-contract.mjs`
  precedent), PE-002 (`scripts/phase-lint.mjs:232-237` `layerForTarget`),
  PE-004 (`skills/execute-phase/references/PREFLIGHT.md:154` phase-lint guard),
  PE-005 (`POLICY.md:185-199` `gate-rejection-vocabulary@1`, four types),
  PE-007 (`CLAUDE.md:314` `normative-surfaces@1`), PE-009
  (`src/extension/index.ts:163-165`), PE-011 (`schema.ts:14` `ROOT_KEYS`), PE-016
  (`adapters/normalize-hook-payload.sh` carries only command/path), PE-021
  (REPOSITORY_STATE `frozen`, F010), PE-022 (roadmap row 37 `done`, row 60
  `planned`), PE-023 (`node --test packages/agentic-workflow` → exit 1
  MODULE_NOT_FOUND at this revision while `bun test packages/agentic-workflow/test/`
  and `node --test packages/agentic-workflow/test/*.test.mjs` → 56 pass both ways),
  PE-024 (`publishedConstArrays` reads a frozen `export const NAME = [...]`; the
  must-name closed set is the fixed four), PE-025 (pi `docs/extensions.md` §tool_call:
  `event.toolName`, `event.input.path`, `ctx.cwd`), PE-026 (`phase-lint.mjs:680-703`
  fingerprint form).
- **L3 obligation completeness — pass.** 18 rows O1…O18 covering every normative
  behaviour (AC-01…AC-10), the read-only/vocabulary/no-auto-approval/unavailable-gate
  invariants, the three scenario pins, and the split template-seed (O15) / pi-mirror
  (O18) parity pins; ids stable, none duplicated.
- **L4 obligation mapping — pass.** Every row names exactly one phase and one task,
  `execute-phase` as implementation owner, a validator copied from `ACCEPTANCE.md` or
  the phase done-when, and required evidence; no blank status; no `deferred` row.
- **L5 scenario ↔ validator ↔ phase closure — pass for the scenarios that exist.**
  testing.md's nine rows each map to a phase and a validator; the validators can fail
  (the P1 pins are explicit sub-cases). The gap this review found is not a ledger-row
  mismatch but a promised gate with no task at all (PLAN60-F9, below).
- **L6 findings ledger — pass.** `SPEC60-F1…F3` and `PLAN60-F1…F8` are all `resolved`
  with resolution evidence; no `dismissed` row; no open material row carried in.
- **P1 Architecture — pass.** Surfaces named with `path:line` evidence rows;
  invariant classification present (`n/a` — NRS F010, no project invariants doc).
- **P2 Dependency closure — pass.** Hard dependency feature 37 `done` (PR #212); soft
  feature 42 `idea`, nothing depends on it; no phase builds an unwritten unit's work.
- **P3 Compatibility — pass.** The pi `pathProtection` key is optional and additive to
  the strict `ROOT_KEYS`; an existing config without it stays valid; the policy file is
  additive and the gate is read-only.
- **P4 Security — pass.** No secrets/PII; input validation is bounded (256 KiB policy,
  10 000 changed paths); the parsers fail closed; the guard blocks writes.
- **P5 Migration — pass.** The policy is additive (a repo without it runs on the
  shipped defaults and reports the degradation); no data migration; the roadmap row is
  updated by the standard close-out.
- **P6 Recovery — pass.** Phases commit per phase with `progress.md` receipts; the gate
  is stateless and idempotent (the `two-runs` pin).
- **P7 Rollback — pass.** Standard revert; no persisted state; the new files are
  additive.
- **P8 Operability — finding (PLAN60-F10).** The gate surface is observable
  (`PATH-GUARD` block, degradation line), but the release mechanic is unscheduled.
- **P9 Phase atomicity and order — pass.** `node scripts/phase-lint.mjs
  docs/features/60-path-protection-guards/PLAN.md` → `verdict PASS`, exit 0; the five
  recorded fingerprints match exactly (`P1:config/infra:7:tier-1-path-gate` …
  `P5:hardening:7:hardening-pr`) and the whole-set digest is
  `c4a9e11a3b8fad370b0212ce3d97f796957e9d8eaaf1a63c1d75f14082d63dc4`, identical to
  the progress record. Order P1→P5; last phase is hardening/PR.
- **P10 Validators — finding (PLAN60-F9, PLAN60-F10).** Every phase's done-when is a
  runnable command, and the crate-suite forms are the runnable `bun test
  packages/agentic-workflow/test/` form with the Node 24 glob fallback (verified this
  turn: 56 pass both ways; the directory positional still fails). But the close-out
  gate the SPEC promises has no task, and no validator covers the release mechanic.
- **P11 Scenario coverage — finding (PLAN60-F9).** Empty/oversize/invalid/concurrent
  states are covered; the final phase's own protected-change failure state is the one
  named state with no scenario or validator.
- **P12 Source evidence — pass.** The plan's file/symbol claims match the repository at
  `sourceRevision` (the PE rows above, re-verified line-exact); the dependency/status
  claims (row 37 `done`, row 60 `planned`, issue #220 open) hold live.
- **Falsification (fresh context, before the checks): CONFIRMED-GAPS.** The claims a
  hostile reader could call invented — the drift gate's acceptance of a
  `schema-export:`-published vocabulary, the `--base` committed-range checkpoint, and
  the pi `tool_call` record source — all re-derived true this turn (PE-024/PE-025,
  `publishedConstArrays`, the pi docs). The confirmed gap is coverage, not invention:
  the close-out gate that PLAN60-F3's repair deferred to P5 has no P5 task, so a
  protected edit to a frozen test during the hardening phase would never be gated.
- **CONVERGENCE-ANOMALY** (POLICY §4 — this FAIL opens the second plan
  repair/re-review cycle; reported before any further edit, routed, never a stop):

  ```text
  CONVERGENCE-ANOMALY — 60-path-protection-guards plan
  - Finding ids: repeated: none / new: PLAN60-F9, PLAN60-F10
  - Snapshots: 40626cd083e620763d791c8b1408d248c610a67846b380242836a14e5c1b0ad8 → 4fd9b2e12fb702d91265774201366aa833ff4aeed58295ef3f02d464b5d41989 (artifactRevisionId 6dddba5d → 513e8c17)
  - Missed: the P5 close-out `path-guard` task for the final phase's committed range (the residual of the PLAN60-F3 repair) and the same-PR version-bump/CHANGELOG sweep for the touched skills and the pi package
  - Owning stage: plan
  - Why the prior repair failed: the PLAN60-F1…F8 batch moved the checkpoint to the committed range and asserted the final phase is checked by the close-out gate, but never added that gate as a P5 task, and no finding covered release mechanics
  - Route to owner: plan-feature (one batch: add the P5 close-out gate task + its validator, and the version-bump/CHANGELOG tasks), then /review-plan 60-path-protection-guards
  ```
- Findings for this snapshot: `planning-findings.md` (`PLAN60-F9`, `PLAN60-F10`).
- Self-check (`write-then-report`, POLICY §8) — `bun scripts/pre-execution-snapshot.mjs
  verify --stage plan --unit 60-path-protection-guards --dir
  docs/features/60-path-protection-guards --unit-kind feature --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`:

```json
{
  "current": false,
  "stage": "plan",
  "unit": "60-path-protection-guards",
  "receipt": {
    "id": "PLAN-REVIEW-60-2",
    "verdict": "plan-review-fail",
    "snapshot": "4fd9b2e12fb702d91265774201366aa833ff4aeed58295ef3f02d464b5d41989",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "4fd9b2e12fb702d91265774201366aa833ff4aeed58295ef3f02d464b5d41989",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

  `digestMatches: true` + `structural.fresh: true` means the mark landed; `current: false`
  (exit 4) is the sanctioned answer for a persisted non-PASS verdict — the verdict itself
  is the emit result.
- No reviewed plan artifact was modified: `git status --porcelain` shows only this
  receipt in `progress.md` and the `PLAN60-F9`/`PLAN60-F10` rows in
  `planning-findings.md`.

### plan — 2026-09-18 (re-review, revision 3)

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-60-3 · Snapshot: 7f66d179b929ca7cc2279843c4ce28f9c1e24d496f5134acbcd0767c15fb5047 · Verdict: plan-review-fail
- Unit: 60-path-protection-guards · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e · Parent Product receipt: SPEC-REVIEW-60-2
- Source revision: 812035ec31a16720f6c466d7dbb96a719aec9463 · Artifact revision: 812035ec31a16720f6c466d7dbb96a719aec9463
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (2026-09-18 authoring + two repair turns)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T15:20:00Z/2026-09-18T15:55:00Z · Findings: 2 (material open: 2)
- Ledgers read: planning-evidence 28 rows · obligations 21 rows (verified-capable: 19)
- Prior plan receipt (re-review only): PLAN-REVIEW-60-2 @ 4fd9b2e12fb702d91265774201366aa833ff4aeed58295ef3f02d464b5d41989
```

Notes:
- Snapshot built by the recipe owner at one revision: `bun scripts/pre-execution-snapshot.mjs
  build --stage plan --unit 60-path-protection-guards --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`. It bound nine
  artifact rows whole-file — `spec` `SPEC.md` (49723 B), `acceptance` `ACCEPTANCE.md`
  (5343 B), `planning-evidence` (12723 B), `obligations` (9663 B), `plan` `PLAN.md`
  (15950 B), `tasks` `TASKS.md` (12784 B), `testing` (4706 B), `decisions` (21278 B),
  `architecture-notes` (4810 B) — and three contexts `project-guide` present
  (`CLAUDE.md`, `f5c8e142…`), `normalized-repository-state` present
  (`docs/workflow/REPOSITORY_STATE.md`, `e1b81e29…`), `architectural-invariants` absent
  (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
  Digest `7f66d179…5047` pasted above. Live `HEAD` is `76dd53cc`; the builder's
  `contentRevision` over the bound paths resolves to `812035ec` (`76dd53cc` only appended
  the PLAN60-F9/F10 resolution to `planning-findings.md`, which is not a bound path), so
  both revision fields carry `812035ec`. The planner's handoff label `60-plan-3`
  (`PLAN.md:8-9`) is recorded here beside the recomputed value per `POLICY.md` §7; the
  receipt field carries the derived value so a consumer's plain `verify --stage plan`
  matches (feature 55/59 precedent).
- **L1 parent currency — current, by the decisive recomputation (POLICY §7).** Building
  the spec-stage snapshot at the Product receipt's own revision (`build --stage spec
  --unit 60-path-protection-guards --source-revision
  7e9f6f543719ded87d9da03385b7ba99bd2ab93d --artifact-revision
  7e9f6f543719ded87d9da03385b7ba99bd2ab93d`) reproduces exactly
  `12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`, the snapshot the
  `SPEC-REVIEW-60-2` receipt records. The pinned Product projection re-derived from the
  current `SPEC.md` bytes is byte-identical (24 443 B, sha256
  `50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`) and all three
  context rows are unmoved, so the parent is **current**; only the revision field rotated
  (the coarse `verify --stage spec` answers `stale-source-revision`, the expected
  consequence of the sanctioned Engineering-half commits `513e8c17`/`812035ec`, which move
  `SPEC.md` outside the Product selector — feature 55/59's identical reading).
- **L2 evidence integrity — finding (PLAN60-F11).** 28 rows PE-001…PE-028, every one
  `current` + `proven` (none `drifted`/`stale`; no `unknown`); load-bearing rows
  re-verified first-hand this turn (PE-002 `phase-lint.mjs:232-237`, PE-023
  `bun test packages/agentic-workflow/test/` → 56 pass / `node --test
  packages/agentic-workflow/test/*.test.mjs` → 56 pass while the directory positional
  fails, PE-024 the fixed four-value must-name set at `normative-drift.test.mjs:894-896`,
  PE-025 pi `docs/extensions.md` §tool_call, PE-028 `SPEC.md:591`). The gap is not a stale
  row but an unsourced one: the shipped-default `test-file` class's `**/*.spec.*` glob
  (`SPEC.md:460`) resolves to no evidence row and no decision.
- **L3 obligation completeness — finding (PLAN60-F12).** 21 rows O1…O21, ids stable,
  none duplicated; the missing row is the `undeclared-test` failure state.
- **L4 obligation mapping — pass.** Every row names exactly one phase and one task,
  `execute-phase` as implementation owner, a validator copied from `ACCEPTANCE.md` or the
  phase done-when, and required evidence; no blank status; no `deferred` row.
- **L5 scenario ↔ validator ↔ phase closure — finding (PLAN60-F12).** `testing.md`'s nine
  scenario rows each map to a phase and a validator, and the P1 pins can fail; the gap is
  the `undeclared-test` failure state, which has no scenario and no validator anywhere.
- **L6 findings ledger — pass.** `SPEC60-F1…F3` and `PLAN60-F1…F10` are all `resolved`
  with resolution evidence; no `dismissed` row; no open material row carried in. The
  PLAN60-F9/F10 repairs are verified in place this turn (P5 task 7 + done-when name the
  close-out gate; P5 tasks 2–3 name the release sweep; O19/O20/O21 present).
- **P1 Architecture — pass.** Surfaces named with `path:line` evidence rows and the
  invariant classification is present (`n/a` — NRS F010, no project invariants doc).
- **P2 Dependency closure — pass.** Hard dependency feature 37 `done` (PR #212); soft
  feature 42 `idea`, nothing depends on it; issue #220 OPEN and matching live
  (`gh issue view 220` 2026-09-18); no phase builds unwritten work.
- **P3 Compatibility — pass.** The pi `pathProtection` key is optional/additive to the
  strict `ROOT_KEYS`; an existing config without it stays valid; the policy file is
  additive and the gate is read-only; the crate is private and unshipped (known-issue
  B-01 discloses the installed-skill gap).
- **P4 Security — pass.** No secrets/PII; input validation is bounded (256 KiB policy,
  10 000 changed paths); the parsers fail closed; the guard blocks writes, never reads.
- **P5 Migration — pass.** The policy is additive (a repo without it runs on the shipped
  defaults and reports the degradation); no data migration; the roadmap row is standard
  close-out; no `.es.md` sync exists under the English-only interim.
- **P6 Recovery — pass.** Per-phase commits with `progress.md` receipts; the gate is
  stateless and idempotent (the `two-runs` pin); no phase leaves the tree mid-write.
- **P7 Rollback — pass.** Standard revert; no persisted state; every new file additive.
- **P8 Operability — pass.** The `PATH-GUARD` block and degradation line surface the
  behaviour, and the same-PR release sweep is now scheduled (P5 tasks 2–3, O20/O21).
- **P9 Phase atomicity and order — pass.** `node scripts/phase-lint.mjs
  docs/features/60-path-protection-guards/PLAN.md` → `verdict PASS`, exit 0; the five
  fingerprints match exactly (`P1:config/infra:7:tier-1-path-gate` …
  `P5:hardening:10:hardening-pr`) and the whole-set digest is
  `381019477bdf277c455ec78b11d05c10a01542db75161a4f737a0fb9add85e0a`, identical to the
  progress record. Order P1→P5; the last phase is hardening/PR.
- **P10 Validators — pass, with the P11 caveat.** Every phase's done-when is a runnable
  command with an expected outcome; the crate-suite form is the runnable `bun test
  packages/agentic-workflow/test/` (56 pass, verified this turn) with the Node 24 glob
  fallback; no validator was weakened or re-scoped. The `undeclared-test` branch is the
  one behaviour no validator reaches (PLAN60-F12).
- **P11 Scenario coverage — finding (PLAN60-F12).** Empty/oversize/invalid/concurrent and
  the freeze boundary are covered; the `undeclared-test` failure state is the one named
  failure state with no scenario or validator.
- **P12 Source evidence — pass.** The plan's file/symbol claims match the repository at
  the revision (spot-verified: `phase-lint.mjs:232-237`/`:680-703`, `PREFLIGHT.md:154`,
  `POLICY.md:185-199`, `TURN_CONTRACT.md:78`, `CLAUDE.md:314`, `extension/index.ts:163-165`,
  `schema.ts:14`, `types.ts:44,72`, `merge.ts:26-49`, `ledger-ownership.test.mjs:421-439`,
  `verification-contract/SKILL.md:83`, and the pi `tool_call` docs); the dependency/status
  claims (row 37 `done`, row 60 `planned`, issue #220 open) hold live.
- **Falsification (fresh context, before the checks): CONFIRMED-GAPS.** Three Engineering
  claims a hostile reader could call invented — the shipped-default `**/*.spec.*` glob
  (no Product decision, no evidence row — confirmed gap), the Tier 2 record source
  (re-derived true: PE-025 pi docs + `ctx.cwd`), and the `path-guard` drift-gate
  `schema-export:` route (re-derived true: the mechanism `publishedConstArrays` reads a
  frozen `export const` and the 4a check runs after the whole model is built). One SPEC
  behaviour this plan does not verify: the `undeclared-test` failure state. The phase whose
  deliverable could be accepted while its validator passes for the wrong reason is P1 (the
  declaration-enforcement branch). If every phase shipped exactly as written, the shipped
  defaults would still protect a `*.spec.` family the Product never decided, and a
  regression in the undeclared-create branch would be invisible.
- Findings for this snapshot: `planning-findings.md` (`PLAN60-F11`, `PLAN60-F12`).
- No reviewed plan artifact was modified: `SPEC.md`, `ACCEPTANCE.md`, `PLAN.md`,
  `TASKS.md`, `testing.md`, `decisions.md`, `architecture-notes.md`, the two ledgers and
  the `ROADMAP.md` row-60 bytes are byte-identical to the reviewed snapshot; only this
  receipt ledger and `planning-findings.md` were appended (`git status --porcelain` shows
  exactly those two files).
- Non-blocking observations (not findings rows): (a) `SPEC.md:30` declares branch
  `feat/60-path-protection-guards` while the working branch is
  `feat/220-path-protection-guards` (issue-number convention) — routing data, referenced by
  no phase, and `execute-phase` box 1 only requires a non-default branch; (b) the record
  grammar's `phase` column implies the evaluator scopes `unmatched-record` to the evaluated
  phase, but the SPEC's prose (`SPEC.md:531-537`) does not say so — worth stating
  explicitly in P1, not a confirmed defect.
- **CONVERGENCE-ANOMALY** (POLICY §4 — this FAIL would open a third plan repair/re-review
  cycle; reported and routed before any further edit, never a stop):

  ```text
  CONVERGENCE-ANOMALY — 60-path-protection-guards plan
  - Finding ids: repeated: none / new: PLAN60-F11, PLAN60-F12
  - Snapshots: 4fd9b2e12fb702d91265774201366aa833ff4aeed58295ef3f02d464b5d41989 → 7f66d179b929ca7cc2279843c4ce28f9c1e24d496f5134acbcd0767c15fb5047 (artifactRevisionId 513e8c17 → 812035ec)
  - Missed: the shipped-default `test-file` class's `**/*.spec.*` glob was never traced back to the Product's D4 set, and the closed reason vocabulary's `undeclared-test` branch was never given a scenario, obligation, or validator
  - Owning stage: plan
  - Why the prior repair failed: the PLAN60-F9/F10 batch repaired the close-out gate and the release sweep but did not audit the shipped-default glob set against the Product decisions or enumerate the reason codes' verification coverage
  - Route to owner: plan-feature (one batch: align the shipped `test-file` globs with D4 and add the `undeclared-test` obligation + P1 case), then /review-plan 60-path-protection-guards
  ```
- Self-check (`write-then-report`, POLICY §8) — `bun scripts/pre-execution-snapshot.mjs
  verify --stage plan --unit 60-path-protection-guards --dir
  docs/features/60-path-protection-guards --unit-kind feature --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`:

<!-- SELF_CHECK_JSON -->

```json
{
  "current": false,
  "stage": "plan",
  "unit": "60-path-protection-guards",
  "receipt": {
    "id": "PLAN-REVIEW-60-3",
    "verdict": "plan-review-fail",
    "snapshot": "7f66d179b929ca7cc2279843c4ce28f9c1e24d496f5134acbcd0767c15fb5047",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "7f66d179b929ca7cc2279843c4ce28f9c1e24d496f5134acbcd0767c15fb5047",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

  `digestMatches: true` + `structural.fresh: true` means the mark landed; `current: false`
  (exit 4) is the sanctioned answer for a persisted non-PASS verdict — the verdict itself
  is the emit result.

### plan — 2026-09-18 (re-review, revision 4)

```text
## Pre-execution review receipt v1 — plan
- Review: PLAN-REVIEW-60-4 · Snapshot: 194049b4941cb009a6981452dc2dd5e4ef3e3d5648aed0b716df0175c61432f6 · Verdict: plan-review-pass
- Unit: 60-path-protection-guards · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e · Parent Product receipt: SPEC-REVIEW-60-2
- Source revision: f901532493ca96cb293704352ce4af73150ff5c7 · Artifact revision: f901532493ca96cb293704352ce4af73150ff5c7
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (2026-09-18 authoring + three repair turns)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T16:55:00Z/2026-09-18T17:10:32Z · Findings: 1 (material open: 0 — PLAN60-F12 low advisory, non-material under the operator materiality bar, E-60-18)
- Ledgers read: planning-evidence 29 rows · obligations 21 rows (verified-capable: 19)
- Prior plan receipt (re-review only): PLAN-REVIEW-60-3 @ 7f66d179b929ca7cc2279843c4ce28f9c1e24d496f5134acbcd0767c15fb5047
```

Notes:
- Snapshot built by the recipe owner at one revision: `bun scripts/pre-execution-snapshot.mjs
  build --stage plan --unit 60-path-protection-guards --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`. It bound nine
  artifact rows whole-file — `spec` `SPEC.md` (49708 B, `9c9f785e…c477`), `acceptance`
  `ACCEPTANCE.md` (5343 B, `291fbe73…5f98`), `planning-evidence` (13393 B, `d5d8560b…d763`),
  `obligations` (9663 B, `01ced719…ae00`), `plan` `PLAN.md` (15950 B, `5941dc20…bc61`),
  `tasks` `TASKS.md` (12784 B, `a5de27f5…1315`), `testing` (4706 B, `9353c20e…98a3`),
  `decisions` (23429 B, `7a211070…5651`), `architecture-notes` (4810 B, `d83c3d91…77a6`) —
  and three contexts `project-guide` present (`CLAUDE.md`, `f5c8e142…`),
  `normalized-repository-state` present (`docs/workflow/REPOSITORY_STATE.md`, `e1b81e29…`),
  `architectural-invariants` absent (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not
  exist — NRS F010). Digest `194049b4…32f6` pasted above.
- `- Artifact revision:` binds the snapshot builder's canonical content-derived value
  (`f9015324…`, the newest commit that touched a bound path). Live `HEAD` is `13252001`; the
  builder's `contentRevision` over the bound paths resolves to `f9015324` (`13252001` only
  appended the PLAN60-F11/F12 resolution to `planning-findings.md` and this receipt ledger,
  neither a bound path). The planner's handoff label `60-plan-3` (`PLAN.md:9`, `SPEC.md:388`)
  is recorded here beside the recomputed value per `POLICY.md` §7; the receipt field carries
  the derived value so a consumer's plain `verify --stage plan` matches (feature 55/59
  precedent). The label was not re-coined for the third repair batch — see the non-blocking
  observation below.
- **L1 parent currency — current, by the decisive recomputation (POLICY §7).** Building the
  spec-stage snapshot at the Product receipt's own revision (`build --stage spec --unit
  60-path-protection-guards --source-revision 7e9f6f543719ded87d9da03385b7ba99bd2ab93d
  --artifact-revision 7e9f6f543719ded87d9da03385b7ba99bd2ab93d`) reproduces exactly
  `12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`, the Snapshot the
  `SPEC-REVIEW-60-2` receipt records. The pinned Product projection re-derived from the
  current `SPEC.md` bytes is byte-identical (24 443 B, sha256
  `50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`) and all three context
  rows are unmoved, so the parent is **current**; only the revision field rotated (the third
  repair batch moved the SPEC file outside the Product selector — the sanctioned
  Engineering-half commit `f9015324`, feature 55/59's identical reading). Never repaired by
  re-copying the digest.
- **L2 evidence integrity — pass.** 29 rows PE-001…PE-029, every one `current` + `proven`
  (none `drifted`/`stale`; no `unknown`). PE-029 was added by the third repair batch and
  sources the shipped-default glob correction (D4 / AC-01 / issue #220's four families).
  Load-bearing rows re-verified first-hand this turn: PE-001 (`package.json` no
  `bin`/`scripts`; `bin/turn-contract.mjs` precedent), PE-002/PE-026 (`phase-lint.mjs`
  `layerForTarget` + fingerprint form — the linter re-run below matches), PE-004
  (`PREFLIGHT.md:154`), PE-005 (`POLICY.md:188` `gate-rejection-vocabulary@1`, four types +
  prose "closed set of four" at `:173`), PE-009 (`src/extension/index.ts:163-165`), PE-011
  (`schema.ts:14` `ROOT_KEYS`), PE-016 (`normalize-hook-payload.sh` carries only
  command/path), PE-020 (`ledger-ownership.test.mjs:421-439` scans only `scripts/` and
  `packages/<name>/scripts/`), PE-021 (NRS `frozen`, F010), PE-022 (roadmap row 37 `done`,
  row 60 `planned`), PE-025 (pi `docs/extensions.md` §tool_call), PE-028 (`SPEC.md:591`),
  PE-029 (`SPEC.md:336` D4, `:277-280` AC-01).
- **L3 obligation completeness — pass, with the recorded advisory (PLAN60-F12).** 21 rows
  O1…O21, ids stable, none duplicated; every acceptance criterion AC-01…AC-10 has its row
  (O1…O10) plus the read-only/vocabulary/no-auto-approval/unavailable-gate invariants, the
  three scenario pins, the split template-seed (O15) / pi-mirror (O18) parity pins, the P5
  close-out gate (O19), and the same-PR release sweep (O20/O21). The `undeclared-test`
  failure state keeps no obligation row — the residual coverage gap recorded as PLAN60-F12,
  `low`, advisory under the operator materiality bar (E-60-18). It does not name a
  user-visible outcome the frozen acceptance manifest misses (AC-01…AC-10 name no
  `undeclared-test` criterion), so it is non-blocking under the bar.
- **L4 obligation mapping — pass.** Every row names exactly one phase and one task,
  `execute-phase` as implementation owner, a validator copied from `ACCEPTANCE.md` or the
  phase done-when, and required evidence; no blank status; no `deferred` row.
- **L5 scenario ↔ validator ↔ phase closure — pass, with the recorded advisory.**
  `testing.md`'s nine scenario rows each map to a phase and a validator, and the P1 pins can
  fail (explicit sub-cases). The `undeclared-test` failure state remains the one named reason
  with no scenario and no validator — PLAN60-F12, advisory/non-material.
- **L6 findings ledger — pass.** `SPEC60-F1…F3` and `PLAN60-F1…F11` are all `resolved` with
  resolution evidence; no `dismissed` row lacks counter-evidence; the single open row is
  `PLAN60-F12` (`low`, `plan`, advisory under the operator materiality bar with its fold path
  named), so no open **material** row is carried into execution. The F11 repair is verified
  in place this turn: the Engineering-invented `**/*.spec.*` glob is gone (repo-wide grep
  matches only this ledger's own claim text, the repair records, and this ledger's notes).
- **P1 Architecture — pass.** Affected surfaces are named with `path:line` evidence rows;
  the invariant classification is present (`n/a` — NRS F010, no project invariants doc).
- **P2 Dependency closure — pass.** Hard dependency feature 37 `done` (PR #212); soft feature
  42 `idea`, nothing depends on it; issue #220 OPEN and matching; no phase builds unwritten
  work.
- **P3 Compatibility — pass.** The pi `pathProtection` key is optional/additive to the strict
  `ROOT_KEYS`; an existing config without it stays valid; the policy file is additive and the
  gate is read-only; the private crate is unshipped (known-issue B-01 discloses the gap).
- **P4 Security — pass.** No secrets/PII; input validation is bounded (256 KiB policy, 10 000
  changed paths); the parsers fail closed; the guard blocks writes, never reads.
- **P5 Migration — pass.** The policy is additive (a repo without it runs on the shipped
  defaults and reports the degradation); no data migration; the roadmap row is standard
  close-out; no `.es.md` sync exists under the English-only interim.
- **P6 Recovery — pass.** Per-phase commits with `progress.md` receipts; the gate is stateless
  and idempotent (the `two-runs` pin); no phase leaves the tree mid-write.
- **P7 Rollback — pass.** Standard revert; no persisted state; every new file additive.
- **P8 Operability — pass.** The `PATH-GUARD` block and degradation line surface the
  behaviour; the same-PR release sweep is scheduled (P5 tasks 2–3, O20/O21).
- **P9 Phase atomicity and order — pass.** `node scripts/phase-lint.mjs
  docs/features/60-path-protection-guards/PLAN.md` → `verdict PASS`, exit 0; the five recorded
  fingerprints match exactly (`P1:config/infra:7:tier-1-path-gate` …
  `P5:hardening:10:hardening-pr`) and the whole-set digest is
  `381019477bdf277c455ec78b11d05c10a01542db75161a4f737a0fb9add85e0a`, identical to the
  repair record. The third repair batch kept every phase's task count and layer (PE-026), so
  the fingerprints and digest are unchanged. Order P1→P5; the last phase is hardening/PR.
- **P10 Validators — pass.** Every phase's done-when is a runnable command with an expected
  outcome, and the crate-suite forms are the runnable `bun test packages/agentic-workflow/test/`
  form with the Node 24 glob fallback; no validator was weakened, skipped, or re-scoped. The
  `undeclared-test` branch stays the one behaviour no validator reaches (PLAN60-F12, advisory).
- **P11 Scenario coverage — pass, with the recorded advisory.** Empty/oversize/invalid/
  concurrent, the freeze boundary, and the committed-range checkpoint are covered; the
  `undeclared-test` failure state keeps no scenario (PLAN60-F12, advisory/non-material).
- **P12 Source evidence — pass.** The plan's file/symbol claims match the repository at the
  revision (spot-verified above); the dependency/status claims hold live. The F11 correction
  removes the only invented glob.
- **Falsification (fresh context, before the checks): CONFIRMED-GAPS (advisory class only, and
  now closed except the recorded advisory).** Three Engineering claims a hostile reader could
  call invented — the `schema-export:` publication mechanism (re-derived true: PE-024, a
  frozen `export const` array is what the reader parses), the pi `tool_call` record source
  (`ctx.cwd` + unit decision ledgers — re-derived true: PE-025), and the `--base`
  committed-range checkpoint (re-derived true: Design + E-60-12). The shipped-default
  `**/*.spec.*` glob that the prior review confirmed as an invented family is **gone** (F11
  resolved). The one SPEC behaviour this plan still does not verify is the `undeclared-test`
  failure state (PLAN60-F12). The phase whose deliverable could be accepted while its
  validator passes for the wrong reason is P1's declaration-enforcement branch — the same
  advisory gap. If every phase shipped exactly as written, the only residual would be that
  untested branch, in scope and recorded, with its fold path named.
- **CONVERGENCE (POLICY §4).** This is the fourth plan review and the re-review of the third
  repair batch. The second and third cycles' `CONVERGENCE-ANOMALY` blocks were printed and
  routed by `PLAN-REVIEW-60-2` and `PLAN-REVIEW-60-3` before each edit; this re-review is not a
  blind repeat — the snapshot changed by design in response to the persisted `plan-review-fail`
  (`7f66d179…5047` → `194049b4…32f6`, `artifactRevisionId` `812035ec` → `f9015324`), and the
  two findings it carried are now either `resolved` (F11) or recorded advisory (F12). No new
  material finding and no repeated material finding; the cycle converges to PASS rather than
  opening a fourth repair cycle.
- Non-blocking observations (not findings rows): (a) the plan's handoff label `60-plan-3`
  (`PLAN.md:9`, `SPEC.md:388`) was not re-coined for the third repair batch — the parenthetical
  still enumerates only the F1…F8 and F9…F10 batches — while the canonical content-derived
  identity (`f9015324`) is bound by this receipt and by the snapshot builder, so the staleness
  is cosmetic (`POLICY.md` §7 pairing convention, same class the prior receipts recorded);
  (b) the SPEC Engineering-half `### Deliverables` list names `scripts/normative-drift.test.mjs`
  beside `CLAUDE.md`, but the plan's approach publishes the vocabulary through an existing
  `schema-export:` reader (PE-024) and schedules no drift-gate code edit — an info-level
  summary inaccuracy that weakens no validator.
- Findings for this snapshot: `planning-findings.md` — no new row; `PLAN60-F12` stays `open`,
  `low`, advisory (E-60-18), bound by this receipt.
- Self-check (`write-then-report`, POLICY §8) — `bun scripts/pre-execution-snapshot.mjs
  verify --stage plan --unit 60-path-protection-guards --dir
  docs/features/60-path-protection-guards --unit-kind feature --parent
  12121bffc93596850673d031a53afe79586816c6ba23a952906959e485e1682e`:

```json
{
  "current": true,
  "stage": "plan",
  "unit": "60-path-protection-guards",
  "receipt": {
    "id": "PLAN-REVIEW-60-4",
    "verdict": "plan-review-pass",
    "snapshot": "194049b4941cb009a6981452dc2dd5e4ef3e3d5648aed0b716df0175c61432f6",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "194049b4941cb009a6981452dc2dd5e4ef3e3d5648aed0b716df0175c61432f6",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

  `digestMatches: true` + `structural.fresh: true` + `current: true` (exit 0) means the mark
  landed and execution may bind this receipt for this exact snapshot.

- No reviewed plan artifact was modified: `git status --porcelain` shows only this receipt in
  `progress.md` (and the no-op review note in `planning-findings.md`); `SPEC.md`,
  `ACCEPTANCE.md`, `PLAN.md`, `TASKS.md`, `testing.md`, `decisions.md`, `architecture-notes.md`,
  the two ledgers, and the `ROADMAP.md` row-60 bytes are byte-identical to the reviewed
  snapshot.

## Acceptance receipt v1

- Manifest: docs/features/60-path-protection-guards/ACCEPTANCE.md · Blob: aceb3d52402506214bbc85060508a9414323ddca · Status: frozen · Verified: 2026-09-18 (recomputed at the PLAN60-F1…F8 repair, which materialized the runnable crate-suite invocation `bun test packages/agentic-workflow/test/` with its Node 24 glob fallback and enriched AC-08's read-verified validator; the assertions are unchanged — E-60-10; recomputed before every phase and final review per `verification-contract`)

## Plan repair — PLAN60-F1…F8 (2026-09-18)

One batch, plan owner, no phase appended: all eight rows are plan-class authoring
defects in the plan's own artifacts, so they are repaired in place and the ledger
rows resolved at `10dfb0ec` (feature 55's PF-55-01…04 precedent). No Product byte
changed — the `spec-product-v1` projection stays 24443 B, sha256
`50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`, so
`SPEC-REVIEW-60-2` stays current and the plan's parent snapshot stays
`12121bff…1682e`.

| Finding | Repair |
|---|---|
| PLAN60-F1 | Every crate-suite validator is the runnable `bun test packages/agentic-workflow/test/` form with the Node 24 glob fallback (PLAN/TASKS/ACCEPTANCE/obligations/testing/SPEC Engineering half); E-60-10, PE-023. |
| PLAN60-F2 | `PATH_GUARD_REASONS` is published by a `schema-export:` normative-surface row; the `block:path-protection@1` row keeps the machine with `must-name: no`; E-60-11, PE-024; verified by a drift-gate simulation. |
| PLAN60-F3 | The checkpoint runs over the just-closed phase's recorded committed range with `--base` (base-ref record in the phase handoff; close-out checks the final range); a committed-range scenario/pin added; E-60-12. |
| PLAN60-F4 | O15 split into O15 (P2 template seed) + O18 (P4 pi mirror); one phase and one task per row. |
| PLAN60-F5 | P2's done-when is a byte-diff command against the crate's `serializeShippedPolicy()`; O15 and the plan declaration name it; E-60-14. |
| PLAN60-F6 | Tier 2 reads the unit decision ledgers resolved from `ctx.cwd`; a matching `justification` permits the write; the positive case is in P4's suite; E-60-13, PE-025. |
| PLAN60-F7 | `path-guard:empty-diff` and `path-guard:two-runs` are named P1 tasks and done-when pins. |
| PLAN60-F8 | P3 edits POLICY §8's prose count together with the rejection-type row. |

No newly discovered need was added: the batch stays inside the eight rows. The
phase fingerprints are unchanged (`P1:config/infra:7:tier-1-path-gate` …
`P5:hardening:7:hardening-pr`, digest `c4a9e11a3b8fad370b0212ce3d97f796957e9d8eaaf1a63c1d75f14082d63dc4`)
because task counts and layers are unchanged (PE-026).

## Plan repair — PLAN60-F9…F10 (2026-09-18)

Second plan-repair batch, same shape as the first: two plan-class authoring
defects in the plan's own artifacts, repaired in place at one revision, no phase
appended. No Product byte changed — the `spec-product-v1` projection stays
24443 B, sha256
`50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`, so
`SPEC-REVIEW-60-2` stays current and the plan's parent snapshot stays
`12121bff…1682e` (the SPEC Engineering half moved only).

| Finding | Repair |
|---|---|
| PLAN60-F9 | P5 gains the close-out path gate: record P5's base ref, run `path-guard --unit docs/features/60-path-protection-guards --phase P5 --base <P5 base ref>` → exit 0 with the `PATH-GUARD` block; the invocation is in the P5 done-when; a fail stops the close-out before the PR (no `--force`). E-60-15, PE-028, O19; the SPEC Phases P5 bullet and done-when now name it. |
| PLAN60-F10 | P5 gains the same-PR release sweep: the six touched skills bump **minor** via `bump-skill` (each with its CHANGELOG row) and the pi package bumps to `0.11.0` with its Companion npm packages CHANGELOG row, before the Pi mirror re-bundle. E-60-16, PE-027, O20/O21; `architecture-notes.md` names the scheduled mechanic. |

No newly discovered need was added: the batch stays inside the two rows. P5 goes
from 7 to 10 tasks (the final close-out's budget ceiling), so its fingerprint
moves to `P5:hardening:10:hardening-pr` and the whole-set digest to
`381019477bdf277c455ec78b11d05c10a01542db75161a4f737a0fb9add85e0a` (P1–P4
fingerprints unchanged; PE-026). The plan declaration's `freeze-after: P4` is
unchanged — P5 creates no test file — and the frozen `ACCEPTANCE.md` blob
(`aceb3d52…`) is untouched because the close-out gate is a phase-done-when
validator (O19), not a new acceptance criterion.

Stage 2 planning preflight (re-run because the engineering plan changed):

```text
Preflight: NRS consumed · invariant classification: n/a (no project invariants declared)
```

The Normalized Repository State is `frozen` and records no project
architectural-invariants document (NRS F010; D-60-11, PE-021), so no invariant
can be violated, introduced, or changed by this repair.

## Plan repair — PLAN60-F11…F12 (2026-09-18)

Third plan-repair batch, same shape as the two before it: the two `class: plan`
findings of `PLAN-REVIEW-60-3` are handled by the plan owner in one batch over
the whole set, no phase appended. Operator instruction for the batch:
`drop **/*.spec.*; F12 recorded advisory`. The first finding is repaired in
place; the second is **recorded as an advisory** under the operator's
materiality bar (feature 38's open-advisory precedent) and is not repaired.
No Product byte changed — the `spec-product-v1` projection stays 24443 B, sha256
`50b33e5d944690097c947811cd97e106962e2a00a3d83bcd1a9b8ac4c9af920e`, so
`SPEC-REVIEW-60-2` stays current and the plan's parent snapshot stays
`12121bff…1682e` (the SPEC Engineering half moved only).

| Finding | Disposition |
|---|---|
| PLAN60-F11 | The canonical shipped-default `test-file` class drops the Engineering-invented `**/*.spec.*` glob and protects `**/*.test.*` alone, so `SHIPPED_PATH_POLICY` (E-60-1) projects D4 / AC-01 / issue #220's four default glob families exactly. E-60-17, PE-029. The Product projection is byte-identical, no acceptance criterion or obligation changes (AC-01 and D4 already enumerate the four families without a spec variant), and the template seed and pi mirror inherit the correction through O15/O18. |
| PLAN60-F12 | Recorded as an advisory, not repaired: the `undeclared-test` failure reason stays a declared Product behaviour (`SPEC.md:515`, `:547`) closed in the reason vocabulary (O12), but it keeps no obligation row, dev scenario, or P1 validator. The ledger row stays `open` with its fold path named, and it does not restart a plan cycle. E-60-18 (operator materiality bar, 2026-09-18). |

No newly discovered need was added: the batch stays inside the two rows. No
phase task, layer, or count changed, so every phase fingerprint and the
whole-set digest are unchanged
(`P1:config/infra:7:tier-1-path-gate` … `P5:hardening:10:hardening-pr`, digest
`381019477bdf277c455ec78b11d05c10a01542db75161a4f737a0fb9add85e0a`; PE-026),
and the frozen `ACCEPTANCE.md` blob (`aceb3d52…`) is untouched.

Stage 2 planning preflight (re-run because the engineering plan changed):

```text
Preflight: NRS consumed · invariant classification: n/a (no project invariants declared)
```

The Normalized Repository State is `frozen` and records no project
architectural-invariants document (NRS F010; D-60-11, PE-021), so no invariant
can be violated, introduced, or changed by this repair.

## P1 — 2026-09-18
- Done: crate policy module `packages/agentic-workflow/src/path-policy.mjs` (shipped defaults, policy/declaration/record parsers, pure evaluator, closed `PATH_GUARD_REASONS`/`DEGRADATION_CODES`), the read-only gate CLI `packages/agentic-workflow/bin/path-guard.mjs`, the engine suite, and the repo-root discipline suite; 7/7 P1 tasks ticked.
- Remains: none in P1.
- Gotchas: escape records are scoped to the checkpoint phase (E-60-19); the `undeclared-test` branch now has P1 coverage (engine test `a declared create passes pre-freeze; an undeclared create is undeclared-test`), which the PLAN60-F12 advisory fold path allows to ride this receipt. The preflight checkpoint step is wired in P3, so no gate ran over P1's own range yet; P5's close-out gate covers the final range.
- Files: packages/agentic-workflow/src/path-policy.mjs, packages/agentic-workflow/bin/path-guard.mjs, packages/agentic-workflow/test/path-guard.engine.test.mjs, scripts/path-protection.test.mjs, docs/features/60-path-protection-guards/{TASKS.md,testing.md,known-issues.md,decisions.md,progress.md}
- Base ref: 91cb3c31084bb6e98b2d9ce1bc51a069e9c99149
- Next: P2 — Template policy ship

## Unit-loop receipt — P1
- Commit: aadf2502 · Gate: `bun test packages/agentic-workflow/test/ && node --test scripts/path-protection.test.mjs` (exit 0) · Acceptance blob: aceb3d52402506214bbc85060508a9414323ddca
- Next: P2 · Attempts: 1

## P2 — 2026-09-18
- Done: shipped the path-protection policy as the install seed `template/.agentic-workflow/path-policy.json` (byte-identical to the crate's `serializeShippedPolicy()`), its doc page `template/.agentic-workflow/path-protection.md`, the hooks README path-protection section, and the install/upgrade seeding instructions in `skills/init-workspace/references/{BOOTSTRAP_WRITE,UPGRADE}.md`; 6/6 P2 tasks ticked.
- Remains: none in P2.
- Gotchas: the seed is generated from the crate module, so regenerate it (do not hand-edit) if the default ever changes. The AC-09 check and the P2 done-when seed diff both pass; the AC-07 validator's directory grep needs `-r`, but the intent (`grep -rnE 'tests/\*\*|e2e/\*\*' skills/` → no match) holds.
- Files: template/.agentic-workflow/{path-policy.json,path-protection.md,hooks/README.md}, skills/init-workspace/references/{BOOTSTRAP_WRITE.md,UPGRADE.md}, docs/features/60-path-protection-guards/{TASKS.md,testing.md,progress.md}
- Base ref: aadf250285ca4bf7270914f6a1b7f0e4f031b7d8
- Next: P3 — Checkpoint contract adoption

## Unit-loop receipt — P2
- Commit: pending · Gate: `diff <(node -e "import('./packages/agentic-workflow/src/path-policy.mjs').then(m=>process.stdout.write(m.serializeShippedPolicy()))") template/.agentic-workflow/path-policy.json` (empty) + `grep -c 'path-policy' skills/init-workspace/references/*.md` (3/3) · Acceptance blob: aceb3d52402506214bbc85060508a9414323ddca
- Next: P3 · Attempts: 1
