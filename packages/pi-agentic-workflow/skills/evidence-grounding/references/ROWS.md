## The evidence row contract

The row is the unit of grounding. One row per material claim or obligation,
columns in this exact order:

```text
claim-or-obligation | authority-kind | source-and-location | observed-revision |
freshness | status: proven|decision|unknown | owner-or-next-evidence
```

### Plan-stage table — one declared extension

The Plan-stage evidence table (`planning-evidence.md`, or the XS/S embed) is the
row above with exactly two changes, declared here and nowhere else: a prefixed
stable `id` column (`PE-001`, … — renumbering is a replan, not an edit) and one
extension column, `affected-decision-or-obligation` (the frozen decision,
obligation, or acceptance row the claim resolves), inserted after
`observed-revision`. Full Plan-stage header order:

```text
id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence
```

### Closed vocabularies

`authority-kind` — exactly one:

| Value | Means | Acceptable `source-and-location` |
|---|---|---|
| `repository` | observed in tracked source, config, or a generated artifact | `path:line` or `path` + symbol/test name |
| `document` | a project doc, template, SPEC, roadmap or fix-index row, or fetched external documentation | `path:section`, or the URL plus access date for a fetched source (`https://… (fetched YYYY-MM-DD)`) |
| `ledger` | a frozen Normalized Repository State fact/decision, or an accepted architectural decision | `REPOSITORY_STATE.md` row ID (`F0nn`/`AD-nnn`) |
| `forge` | an issue, PR, review, or CI record | absolute issue/PR URL |
| `user` | an explicit user decision recorded this unit or in `decisions.md` | dated `decisions.md` / SPEC `## Amendments` row |
| `derived` | a conclusion computed from rows above by a stated rule | the rule plus its input row ids |

`status` — exactly one:

- `proven` — the cited source was actually read and answers the claim.
- `decision` — a human/ledger authority fixed it; no further evidence exists or
  is needed. Cite the `user` or `ledger` row.
- `unknown` — not established. **Required:** `owner-or-next-evidence` names who
  closes it and what evidence would close it. An `unknown` may stay open only if
  the artifact states the consequence of it staying open.

`freshness` — exactly one:

- `current` — read at the revision the artifact will be bound to.
- `drifted` — the cited source changed after the row was written; re-read before
  readiness.
- `stale` — the cited source no longer exists or no longer says this.
- `not-applicable` — `status: decision` rows that cannot drift.

A `drifted` or `stale` row is not evidence. It must be re-acquired (step 2) or
demoted to `unknown` with an owner; carrying it into a draft is how a plausible
but false rationale gets written.

### Bounded question set

Ask these, in order, once per inventory item. This is the whole set — do not
grow it into an open-ended research brief.

1. What must be true for this claim/obligation to hold?
2. Which authority kind can prove it, and where does that authority live here?
3. What did I actually observe there (`source-and-location`, `observed-revision`)?
4. Does anything in the repository, roadmap, or ledger contradict it?
5. If it cannot be answered: who owns the unknown, and what single next read
   would answer it?

Questions 1–5 map onto the columns. A question already answered by a frozen
ledger row is not re-asked — cite the row.

### Where the rows are frozen

Rows survive compaction, so they must land in the artifact the reviewer reads —
never in chat history.

| Authoring stage | Frozen home | Bound by |
|---|---|---|
| Product half (`design-feature`, issue-derived design) | the SPEC's Product half plus `decisions.md` for non-obvious calls | the SPEC snapshot via `spec-product-v1` |
| Engineering half (`plan-feature*`, `plan-fix`) | `planning-evidence.md` for M/L units; `### Planning evidence` inside the SPEC for XS/S | the Plan snapshot (kind `planning-evidence`) |

Compaction rules: keep the conclusion row, drop raw search output, discarded
hypotheses, and narrative. One row per claim, no prose padding, no transcripts.
The table is an argument index, not a work log — a reviewer must be able to
audit each row against its `source-and-location` in one read.

### Fix units

A fix has no Product half (D6). Its rows cover: the reproduction, the root cause
with code evidence, the regression scope, the rollback path, and the affected
invariant or use case. Each remains a row with the same vocabulary — a missing
reproduction row is `unknown`, not "probably this".
