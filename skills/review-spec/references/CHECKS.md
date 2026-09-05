## Snapshot, prompt, and Product checks

Run in this order: build the snapshot, then falsify, then check. Nothing below
writes to the reviewed artifact.

### 1. Build the snapshot (exact bytes, one revision)

```bash
git rev-parse HEAD                       # sourceRevision — one value for the whole review
```

Construct `PreExecutionArtifactSnapshot v1` (`agentic-workflow/
pre-execution-artifact-snapshot@1`) over the bytes just read. The authoritative
validator is `@gtrabanco/agentic-workflow-schema`'s
`validatePreExecutionArtifactSnapshotV1`; the generated JSON Schema is a
structural projection, never the authority. Where that package is unavailable,
record the same fields by hand and state `validated: manual` in the receipt note.

A SPEC-stage snapshot is deliberately narrow:

| Field | Value for this stage |
|---|---|
| `stage` | `spec` |
| `unitKind` | `feature` (a `fix` unit is refused here — no Product half) |
| `unitId` | the roadmap unit id, e.g. `28-evidence-grounded-spec-plan-review` |
| `sourceRevision` | the exact revision read above |
| `artifactRevisionId` | the author's current revision id from the handoff |
| `artifacts` | **exactly one row**: `kind: spec`, `path` normalized repo-relative, `selector: spec-product-v1`, `byteLength`, lowercase SHA-256 `digest` |
| `parentSpecSnapshotDigest` | `null` — a SPEC snapshot roots its own lineage |
| `contexts` | each authoritative source actually consulted: `governing-issue`, `normalized-repository-state`, `architectural-invariants`, `dependency-unit`, `project-guide` — `present` with its exact digest, or `absent` with `null`. The roadmap row is read as routing data and deliberately unbound: the shared `ROADMAP.md` ledger moves for reasons this unit never reviewed (other units' rows, the status machine's own sanctioned writes) |

`spec-product-v1` selects the title, `## Goal`, `## Branch`, `## Size`,
`## Dependencies`, the whole Product half, and `## Design status` — never the
empty or future Engineering half, so planning writes cannot invalidate this
review by themselves. Contexts are all-or-nothing on purpose: "I did not look"
is not representable, so an unread authority must appear as `absent` and is then
visible to whoever reads the receipt.

Ordering is normative, not cosmetic: artifact rows sort by UTF-8 path bytes,
context rows by `kind` then `identifier`, and each `(kind, identifier)` context
appears once. Duplicate kinds, out-of-order rows, or extra artifact rows are
contract failures, not style.

Then build the snapshot with the recipe owner —
`pre-execution-review`'s [`SKILL.md`](<../../pre-execution-review/SKILL.md>) →
SNAPSHOT reference: `node scripts/pre-execution-snapshot.mjs build --stage spec
--unit <unitId>` (canonical serializer: sorted keys, context rows ordered by kind
then identifier, UTF-8, lowercase SHA-256). The digest is stdout's first line, so
this recipe writes no file; `--json` is in-repository only. Paste the digest it
prints. Every verdict below is bound to that digest, and a refused build
(partial binding) ends this turn in the refusal form [`OUTPUT.md`](OUTPUT.md) fixes —
`Snapshot: refused` beside the builder's own code, never a hand-computed substitute.

### 2. Clean-context falsification prompt

Read the snapshot's Product bytes as if the document were adversarial, then
answer, in writing, before checking anything:

```text
FALSIFICATION — <unitId> @ <sourceRevision short>
- Name 3 specific product decisions in this half that a hostile reader could
  call invented rather than recorded: <section/row pointers or "none found">
- Name the user outcome the SPEC promises that has no observable check: <row>
- Name one role the matrix leaves unspecified for a capability it does list:
  <row or "none">
- What would have to be true in the repository for this half to be wrong, and is
  it true? <evidence pointer>
- Verdict stance before checking: <CONFIRMED-GAPS | NO-CONFIRMED-GAPS>
```

The point is to try to break the document, not to summarize it. A gap this pass
confirms is a finding; a suspicion it cannot evidence is not.

### 3. Product checks (fixed list — one row each, in order)

| # | Check | PASS only if |
|---|---|---|
| C1 | Outcome ownership | the user outcome each in-scope item produces is stated and observable, not "improve X" |
| C2 | Actors and roles | every actor that can trigger or be affected is named, and the role matrix covers every inventory role per capability with no unlisted role |
| C3 | Entity closure | every entity introduced or touched resolves CRUD + state transitions to UI/API/test or an explicit `n/a: <reason>`; zero blank rows |
| C4 | Limits and failure states | size/failure/empty/concurrency limits are stated or explicitly out of scope; each named failure state has a resolution |
| C5 | Scope and non-goals | every out-of-scope bullet names an owner or a non-goal; nothing is excluded by silence |
| C6 | Integration closure | one resolved row per subsystem of the derived capability inventory; none skipped; the inventory is recorded when `docs/CAPABILITIES.md` is absent |
| C7 | Expectation sweep | ≥ 10 rows (M/L) / ≥ 5 (XS/S), each forced to in-scope/out-of-scope/deferred with a pointer |
| C8 | Acceptance objectivity | every criterion is objective and labelled command-verified or read-verified, and every in-scope bullet maps to ≥ 1 criterion |
| C9 | Internal contradiction | no two sections of the half assert incompatible behaviour, counts, or ownership |
| C10 | Repository contradiction | the half's claims about existing surfaces match what is in the repository now (cited `path:line`, roadmap row, or frozen ledger fact) |
| C11 | Evidence integrity | material claims resolve to `proven`/`decision` rows that are `current`; every `unknown` names an owner and next evidence; no `drifted`/`stale` row survives |
| C12 | Open product choices | `Deferred decisions` is `none`, or each open item is genuinely product-owned and flagged for the human |
| C13 | Engineering leakage | the Product half pre-fills no architecture, phases, tasks, or validators (that is the Plan stage's authority) |
| C14 | Obligation containment | no current-unit obligation is exported to a future issue or "later" — the unit's own scope carries it |

Every row gets exactly one result: `pass`, `finding`, or `n/a: <reason>`. `n/a`
requires a reason that does not contradict scope (an accessibility row is `n/a`
when no UI exists; "skipped because large" is not `n/a`).

### 4. Assemble findings

Each finding is one row of the receipt's `findings` array: stable `id`,
`severity` (`info | low | medium | high | critical`), `class` (`product | plan |
source | environment | runtime`), `claim` (what is wrong, with the section
pointer), `evidenceRefs` (≥ 1 — a finding without evidence is a hunch and gets
dropped), `verification` (`verified | unverified`), `resolution` (`open` on
emission). Material = anything above `info`; a `PASS` may not carry an open or
unverified material row.
