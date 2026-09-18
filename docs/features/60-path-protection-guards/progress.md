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
