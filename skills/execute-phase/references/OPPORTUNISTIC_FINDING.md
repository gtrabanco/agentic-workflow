## Opportunistic finding policy (run when implementation discovers work)

This policy applies to a **real, out-of-scope finding discovered while
implementing the current unit**: a lint warning, dead code, missing defensive
check, documentation defect, or similar work that the current phase did not
promise. A missing acceptance criterion or phase task is **not** a finding to
route: it remains in-scope work and must be delivered (or follows the descope
guard — see [descope guard](DESCOPE.md)).

**Current policy — one source of truth.** Use the complete policy below for
every target project. The target project's agent guide and docs may supply
evidence for a finding, but they do not override its thresholds, decision
order, actions, or decision-log fields. Do not combine local heuristics with
this policy. A configurable project override is future work: it needs a
versioned, machine-checkable schema before it can be introduced safely. Record
`source: workflow` in every decision row.

**Fallback policy — classify every finding in this order; the first matching
row wins.** Estimates are the smallest complete fix, including tests and docs.
Before assigning a decision, write a pass/fail result for every box in the
candidate row. Each row uses **its own** limits: never reuse an Autofix limit
for an Opportunistic Fix, or vice versa. A failed row cannot be selected; move
to the next row and record the failed box in `Why`.

| Decision | Pass only if every box is true | Action |
|---|---|---|
| **Autofix** | ✓ ≤15 changed lines; ✓ ≤2 files; ✓ every file is already modified in this phase; ✓ low implementation and regression risk; ✓ no public API, schema, migration, dependency, permission, architecture, or user-visible behavior change; ✓ the primary phase objective remains unchanged | Fix now in the current phase commit; run the normal verification gate. |
| **Opportunistic Fix** | ✓ ≤40 changed lines; ✓ ≤3 files; ✓ every file is already modified in this phase or directly covered by its test; ✓ directly supports the current phase's behavior or makes its touched code consistent; ✓ low implementation and regression risk; ✓ no public API, schema, migration, dependency, permission, or architecture change; ✓ no acceptance criterion is added, removed, or changed; ✓ the primary phase objective remains unchanged | Fix in the current phase commit; add or update the focused test when behavior is affected; run the normal verification gate. |
| **Create Issue** | Any Autofix or Opportunistic Fix box fails, the evidence is uncertain, the finding is independent of the current phase, or it needs product/risk judgment | Do not change code for the finding. Apply the descope guard before filing; then create a tracked issue and route it through `triage-issue`. |

**Numerical boundary check — run before the remaining boxes.** `≤` is
inclusive. An estimate of 16–40 lines and 1–3 files **fails Autofix size** and
**passes Opportunistic Fix size**. An estimate of more than 40 lines or more
than 3 files fails both fix decisions. At 0–15 lines and 1–2 files, check
Autofix first; if any non-size Autofix box fails, still check Opportunistic
Fix rather than creating an issue immediately.

**Decision ladder — follow literally.** If the estimate is 16–40 lines, never
write `Autofix`: write `Opportunistic Fix` only when every other Opportunistic
Fix box passes; otherwise write `Create Issue`. If the estimate is more than
40 lines, write `Create Issue`. Only a 0–15-line finding may be `Autofix`.

**Record before acting — no silent scope expansion.** For each finding append a
row to `decisions.md` (create `## Opportunistic finding decisions` and its
header if absent) before editing or filing:

```
| Date | Finding | Evidence | Estimate (lines/files) | Risk | Local files | Decision | Why | Policy source | Record |
|---|---|---|---|---|---|---|---|---|---|
| <YYYY-MM-DD> | <one line> | <file:line or command> | <n lines>/<n files> | <low/med/high> | <yes/no + paths> | <Autofix/Opportunistic Fix/Create Issue> | <failed/passed boxes> | <workflow> | <pending commit, commit sha, or issue #n> |
```

For `Create Issue`, write `pending issue` in `Record`, create the issue only
after the descope guard passes, then replace it with the real `issue #<n>` in
the same phase commit. If the decision is not deterministic from the evidence,
record `Create Issue — judgment required` and ask the user before filing or
changing code. This table is the execution log required for later review;
`known-issues.md` remains for blockers, not a substitute for this decision.
