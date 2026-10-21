## The frozen planning ledgers

Three tables carry a unit from planning to delivery. Each has exactly one writer
per column set, one home, and one lifecycle. They are artifacts, not notes: a
Plan snapshot binds them, and `execute-phase` may not invent a substitute.

| Ledger | Home | Written by | Read by |
|---|---|---|---|
| Planning evidence | `### Planning evidence` inside the unit doc (XS/S) · separate file (M/L) | `unit-lane:planning-evidence` | `execute-phase`, `fold-findings`, `audit-pr` |
| Obligations | `### Obligations` inside the unit doc (XS/S) · separate file (M/L) | `unit-lane:obligations` | `execute-phase`, `fold-findings`, `audit-pr` |
| Findings | `review-findings.md` (one per unit, both stages) | reviewers append; only the stage's author resolves | `execute-phase` on re-review, `audit-pr` |

XS/S embeds both tables in the SPEC to stay within the size's artifact budget;
the Plan snapshot then binds them through the whole-SPEC row (kind `spec`), and
the `planning-evidence` / `obligations` snapshot rows are `absent`, not forged.
M/L freeze the separate files and bind them with their own rows. Never both.

### 1. Planning evidence

Row shape — the base row, the closed `authority-kind` / `freshness` vocabularies,
the prefixed stable `id`, and the `affected-decision-or-obligation` Plan-stage
extension with its full column order — is owned by the unit-lane's planning
reference: one definition, no second copy. This ledger owns only the lifecycle
rules and uses markdown headings, nothing else. Ids are stable (`PE-001`, `PE-002`, …): an
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
- `execute-phase` reads only the rows whose `affected-decision-or-obligation`
names its frozen phase; the unit-lane plans the table before `execute-phase` runs.

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
| `validator` | the command or check that proves it, copied from the acceptance artifact (`ACCEPTANCE.md` for legacy (pre-feature 61) units; `sed -n '/^## Acceptance criteria/,/^## /p' <unit>/SPEC.md \| git hash-object --stdin` for post-feature 61) or the phase's done-when |