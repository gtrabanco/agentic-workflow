## The frozen planning ledgers

Three tables carry a unit from planning to delivery. Each has exactly one writer
per column set, one home, and one lifecycle. They are artifacts, not notes: a
Plan snapshot binds them, and `execute-phase` may not invent a substitute.

| Ledger | Home | Written by | Read by |
|---|---|---|---|
| Planning evidence | `planning-evidence.md` (M/L) · `### Planning evidence` inside the SPEC (XS/S) | the authoring planner | `review-plan`, then the phase slice for `execute-phase` |
| Obligations | `planning-obligations.md` (M/L) · `### Obligations` inside the SPEC (XS/S) | the authoring planner, then the phase owner for `status` | `review-plan`, `execute-phase`, `fold-findings`, `audit-pr` |
| Findings | `planning-findings.md` (one per unit, both stages) | reviewers append; only the stage's author resolves | the author skill, `review-plan` on re-review, `audit-pr` |

XS/S embeds both tables in the SPEC to stay within the size's artifact budget;
the Plan snapshot then binds them through the whole-SPEC row (kind `spec`), and
the `planning-evidence` / `obligations` snapshot rows are `absent`, not forged.
M/L freeze the separate files and bind them with their own rows. Never both.

### 1. Planning evidence

Row shape — the base row, the closed `authority-kind` / `freshness` vocabularies,
the prefixed stable `id`, and the `affected-decision-or-obligation` Plan-stage
extension with its full column order — is owned by the `evidence-grounding`
reference `ROWS.md` (§ "Plan-stage table — one declared extension"): one
definition, no second copy. This ledger owns only the lifecycle rules and uses
markdown headings, nothing else. Ids are stable (`PE-001`, `PE-002`, …): an
obligation or finding cites a row by id, so renumbering the table is a replan,
not a formatting edit.

Rules specific to this ledger:

- Every Engineering claim in the SPEC's Engineering half, `PLAN.md`, or a fix
  SPEC resolves to a row here. A claim with no row is not evidence-based, it is
  a guess wearing a heading.
- Raw search output, discarded hypotheses, and conversational history are
  excluded; the table is an argument index a reviewer can audit in one read.
- An assumption about a model's or service's behaviour that was never sampled is
  `unknown` with an owner — `ASSUMPTION-UNVERIFIED` is what the row *means*, and
  the row must stay visible in the artifact rather than becoming a citation.
- `review-plan` reads the whole table; `execute-phase` reads only the rows whose
  `affected-decision-or-obligation` names its frozen phase.

### 2. Obligations

One row per normative behaviour, applicable compatibility invariant, affected use
case, and required failure state — created when the Engineering half is cut, and
frozen from then on except for `status`:

```text
obligation-id | authority-source | affected-use-case-or-invariant | phase |
task | implementation-owner | validator | required-evidence | status
```

| Column | Contract |
|---|---|
| `obligation-id` | stable, unique in the unit (`O1`, `O2`, … or `AC-<name>` when it mirrors a frozen criterion). Renaming an id is a replan, not an edit |
| `authority-source` | the SPEC/acceptance/criterion or ledger row that *requires* it — never the implementation |
| `phase` / `task` | exactly one phase and one task; a row needing two phases means the phase cut is wrong |
| `implementation-owner` | the skill/role that performs it (usually `execute-phase`) |
| `validator` | the command or check that proves it, copied from `ACCEPTANCE.md` or the phase's done-when |
| `required-evidence` | what must be recorded where (test name, receipt line, ledger row) |
| `status` | `planned \| in-progress \| verified \| n/a \| deferred` |

Status lifecycle and its hard edges:

- Before the unit ships, every row is `verified`. `planned`, `in-progress`,
  blank, or partial status blocks completion — as does any row deferred to a
  follow-up issue.
- `verified` requires the named validator to have run and its evidence to be
  recorded where `required-evidence` says. An assertion of intent is not a
  status change.
- `n/a` needs evidence in the row (a `path:line`, ledger row, or cited contract)
  and may never contradict the SPEC's scope section. `n/a` without evidence is
  an open obligation.
- `deferred` exists only in a ledger the user has amended: deferring work out of
  the unit requires a governing-SPEC amendment first, and no route may open a
  forge issue to hold it.
- One behaviour appearing twice is a defect: merge the rows in a replan, do not
  silently drop one.

### 3. Findings

`planning-findings.md` is one stage-aware table. Reviewers append rows; nobody
edits a reviewed artifact to make a row disappear, and no reviewer mutates the
authority it approved.

```text
finding-id | stage | severity | class | snapshot-digest | claim | evidence |
status | resolution-evidence | resolving-artifact-revision
```

- `stage` is `spec` or `plan`; `severity` and `class` use the receipt
  vocabularies (`info|low|medium|high|critical`,
  `product|plan|source|environment|runtime`). `info` is the only immaterial one.
- `finding-id` is stable across cycles: a repeated finding keeps its id and gains
  a second resolution row, which is exactly what makes the no-progress and
  `CONVERGENCE-ANOMALY` rules computable.
- `status` is `open | resolved | dismissed`. `dismissed` requires
  counter-evidence that falsifies the finding ([POLICY.md](POLICY.md) §2); the
  evidence goes in `resolution-evidence`, not in chat.
- The author resolves a row through its own route: `design-feature` for
  `class: product`, `plan-feature` / `plan-fix` for `class: plan`, and the
  candidate loop (`review-change` → `fold-findings`) only for
  `class: source | environment | runtime`.
- `resolving-artifact-revision` is the `artifactRevisionId` of the write that
  closed the row — the link that lets a re-review prove the snapshot actually
  changed.
- A `PASS` may not coexist with an open material/unverified row in this table for
  the bound snapshot. `audit-pr` reads it; the merge authority stays
  `audit-pr`'s alone.

## Durable ledger write ownership (the map)

The one-owner rule, stated once so every skill and template can cite it here:
**a durable ledger has exactly one writer per column set, plus at most one
declared mechanical annotator, which may append only the token its own row
names.** Nobody else writes a row — not a reviewer, not a later phase, not a
script. So `fold-findings` flips only the `folded:` flag `triage-issue` gives it,
and `scripts/ledger-provenance.mjs` appends only the marker it really emits:
line 288's `· fold <sha>` (or `· ticked <sha>` on a row that scores 1) plus the
`· REOPENED P20 — provenance unproven` note of line 293 when a tick has no
matching annotation — never a `yes` of its own.

`scripts/ledger-ownership.test.mjs` reads the block below as the single source of
truth for the seven AC16 truth classes and the projections in
`docs/features/_TEMPLATE/LEDGERS.md` and `docs/fix/_TEMPLATE/LEDGERS.md` as its
copies. It fails closed on a missing or malformed block, an owner-less row, drift
in either direction, a token the annotator cannot produce, and any non-test script
under `scripts/` or `packages/<name>/scripts/` whose write or append target names a
durable ledger its row does not name it for. Cells carry bare values: ` · ` joins
ledgers, ` + ` joins owners, an owner is `<skill>:<column-set>` (the literal
`human-owner` marks the person, the only authority for an amendment), and a `#`
line is a directive. A script that writes only generated artifacts names no ledger
and is out of scope; a copy or shell rewrite stays the reviewer's job.

```text
ledger-ownership@1
truth-class | ledger | owner | annotator | annotator-token | validator
review-findings | docs/features/<NN>-<slug>/review-findings.md · docs/fix/<issue>-<topic>/review-findings.md | review-change:finding-rows + audit-pr:audit-rows + triage-issue:triage-rows + fold-findings:folded-flag | scripts/ledger-provenance.mjs | · fold <sha> + · ticked <sha> + · REOPENED P<n> | node --test scripts/ledger-provenance.test.mjs
planning-findings | docs/features/<NN>-<slug>/planning-findings.md · docs/fix/<issue>-<topic>/planning-findings.md | review-spec:spec-stage-rows + review-plan:plan-stage-rows + design-feature:product-class-resolutions + plan-feature:plan-class-resolutions + plan-fix:fix-plan-class-resolutions + fold-findings:source-class-resolutions | none | none | node --test scripts/pre-execution-quality.test.mjs
progress | docs/features/<NN>-<slug>/progress.md · docs/fix/<issue>-<topic>/progress.md | plan-feature-scaffold:create + execute-phase:phase-entries + review-spec:product-receipt + review-plan:plan-receipt | none | none | node --test scripts/pre-execution-sensor.test.mjs
known-issues | docs/features/<NN>-<slug>/known-issues.md · docs/fix/<issue>-<topic>/known-issues.md | plan-feature-scaffold:create + execute-phase:blocker-entries-and-status | none | none | node --test scripts/ledger-ownership.test.mjs
decisions | docs/features/<NN>-<slug>/decisions.md · docs/fix/<issue>-<topic>/decisions.md | plan-feature-scaffold:create + design-feature:product-decisions + plan-feature:engineering-decisions + execute-phase:phase-decisions + human-owner:ratified-verdicts | none | none | node --test scripts/ledger-ownership.test.mjs
roadmap | docs/features/ROADMAP.md · docs/fix/README.md | design-feature:idea-or-defined-row + plan-feature-scaffold:planned-row + plan-fix:fix-index-row + execute-phase:status-and-pr-link + ship-roadmap:founding-and-flip + audit-docs:low-risk-row-repair | none | none | node --test scripts/bounded-delivery-loops.test.mjs
acceptance-manifest | docs/features/<NN>-<slug>/ACCEPTANCE.md · docs/fix/<issue>-<topic>/ACCEPTANCE.md | plan-feature-scaffold:feature-freeze + plan-fix:fix-freeze + human-owner:approved-amendment | none | none | git hash-object docs/features/<NN>-<slug>/ACCEPTANCE.md
# no-script-writer: SPEC.md · PLAN.md · TASKS.md · CHECKLIST.md · testing.md · architecture-notes.md · planning-evidence.md · planning-obligations.md
```

`SPEC.md`, `PLAN.md`, `TASKS.md`, `testing.md` and `architecture-notes.md` are
durable unit records, but not ledgers with a row lifecycle of their own: their
writers are the phases that already order them (`plan-feature-scaffold` creates
them, `execute-phase` ticks and appends), so the directive line keeps any script
away from them instead of forking the table above. Same for the two frozen
planning ledgers at the top of this file.
