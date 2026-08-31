## Snapshot, falsification, and Engineering checks

Order is fixed: build the snapshot, falsify, check the ledger, then check the
plan. Nothing here writes to a reviewed artifact.

### 1. Build the Plan snapshot (exact bytes, one revision)

```bash
git rev-parse HEAD                       # sourceRevision — one value for the whole review
```

Construct `PreExecutionArtifactSnapshot v1` with `stage: plan` over the bytes just
read. The authoritative validator is `@gtrabanco/agentic-workflow-schema`'s
`validatePreExecutionArtifactSnapshotV1`; the JSON Schema is a structural
projection. Where the package is unavailable, record the fields by hand and state
`validated: manual`.

| Field | Value for this stage |
|---|---|
| `stage` / `unitKind` | `plan`; `feature` or `fix` read from the roadmap row, never inferred from which files exist |
| `unitId` | roadmap unit id (`28-…`) or `fix-<N>` |
| `sourceRevision` / `artifactRevisionId` | the revision read above; the planner's current revision id from its handoff |
| `artifacts` | one row per **applicable** artifact, `selector: whole-file`, normalized path, byte length, lowercase SHA-256 digest |
| `parentSpecSnapshotDigest` | **required** — the Product snapshot digest recorded by the newest current `SPEC-REVIEW-PASS` receipt |
| `contexts` | each authority actually consulted, `present` + digest or `absent` + `null` |

Feature rows (`kind` → path), each `whole-file`:

`spec` → `SPEC.md` · `acceptance` → `ACCEPTANCE.md` ·
`planning-evidence` → `planning-evidence.md` · `obligations` →
`planning-obligations.md` · `plan` → `PLAN.md` · `tasks` → `TASKS.md` ·
`testing` → `testing.md` · `decisions` → `decisions.md` ·
`architecture-notes` → `architecture-notes.md`

Fix rows: `spec` → the fix SPEC · `acceptance` → `ACCEPTANCE.md` ·
`tasks` → `TASKS.md` · `testing` → `testing.md` · `decisions` →
`decisions.md`, plus the two ledgers where the fix unit froze them. A fix unit has
**no** Product half and no fake one (D6): no `spec-product-v1` row, no invented
actors/roles section, no borrowed Product receipt. Its
`parentSpecSnapshotDigest` is the fix SPEC's own snapshot digest, stated plainly
rather than pretending a Product review happened.

XS/S units embed both planning tables in the SPEC, so the `planning-evidence` and
`obligations` rows are `absent` (`null` digest) — their bytes are already bound by
the `spec` row. Never point those rows at a file that does not exist and never
split the SPEC to manufacture them; symmetrically, an M/L unit that embedded its
tables is a finding. Either way `review-plan` reads the **whole** table
(`execute-phase` later receives a phase slice).

Then digest with the package's canonical entry
(`canonicalizePreExecutionArtifactSnapshot` →
`digestPreExecutionArtifactSnapshot`) and paste it. Every verdict is bound to
that digest; a Plan-only byte change invalidates only Plan PASS, while a Product
byte/context/revision/source change invalidates this receipt **and** its parent
lineage.

### 2. Clean-context falsification prompt

```text
FALSIFICATION — <unitId> plan @ <sourceRevision short>
- Name 3 Engineering claims a hostile reader could call invented rather than
  evidenced: <PE-id / path:line pointer or "none found">
- Name a SPEC obligation this plan cannot deliver, and where it silently died:
  <obligation-id or "none">
- Name one phase whose deliverable could be accepted while its validator
  passes for the wrong reason: <phase or "none">
- If every phase shipped exactly as written, what would still be broken, and is
  that in scope? <row>
- Which failure state has no scenario, or a scenario no validator runs? <row or "none">
- Verdict stance before checking: <CONFIRMED-GAPS | NO-CONFIRMED-GAPS>
```

Try to break the plan, not to summarize it. A confirmed gap is a finding; an
unevidenced suspicion is not.

### 3. Ledger checks (before the plan checks)

| # | Check | PASS only if |
|---|---|---|
| L1 | Parent current | a `SPEC-REVIEW-PASS` receipt exists whose snapshot digest equals `parentSpecSnapshotDigest`, its `artifactRevisionId` matches the handoff, and the Product bytes/contexts have not moved since |
| L2 | Evidence integrity | every Engineering claim resolves to a `planning-evidence` row that is `current` + `proven`/`decision`; every `unknown` names an owner and next evidence; no `drifted`/`stale` row survives; assumptions about unsampled model/service behaviour are `unknown`, not citations |
| L3 | Obligation completeness | one row per normative behaviour, applicable compatibility invariant, affected use case, and required failure state — none missing, none duplicated, ids stable |
| L4 | Obligation mapping | each row names exactly one phase, one task, an `implementation-owner`, a `validator` copied from `ACCEPTANCE.md`/the phase done-when, and `required-evidence`; no blank status; no `deferred` without a user-amended governing SPEC |
| L5 | Scenario ↔ validator ↔ phase closure | each failure category the SPEC names has a scenario, each scenario points at the phase and validator that exercise it, and each validator can actually fail (a validator that passes on no-op is a finding) |
| L6 | Findings ledger honest | previously opened `planning-findings.md` rows are `open`/`resolved`/`dismissed` with resolution evidence; no `dismissed` row lacks falsifying counter-evidence; no open material row is being carried into execution |

L1 failing is not a Plan defect: report the route (`review-spec` first) and stop
rather than reviewing an unparented or orphaned plan — a Product byte/context move
invalidates this receipt and its whole descendant lineage.

### 4. Assemble findings

One row per finding in the receipt's `findings` array: stable `id`, `severity`
(`info | low | medium | high | critical`), `class` (`product | plan | source |
environment | runtime`), `claim` with its section/row pointer, `evidenceRefs`
(≥ 1 — a finding without evidence is a hunch and gets dropped), `verification`,
`resolution: open` on emission. Material = anything above `info`; a PASS may not
carry an open or unverified material row. A Product-rooted finding found here
keeps `class: product`: the class routes the repair, it is not a record of who
noticed what.
