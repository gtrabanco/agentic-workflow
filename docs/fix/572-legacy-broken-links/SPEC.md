---
type: docs
scope: xs
---

# fix/572-legacy-broken-links

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#572` — tracked issue in the project's forge. The PR closes it via `Closes #572` in the body.

## Specs

**S1 — Repair the dead markdown links flagged by audit 1/2 F5.**
> `docs/features/27-pi-agentic-workflow/TASKS.md` → `README.es.md` (removed by the English-only decision); `docs/features/59-executable-continuations/progress.md` → `INTERVIEW.md` (deleted); `docs/features/38-workflow-status-sensor-script/review-findings.md` → `MIGRATION.es.md` (removed by the English-only decision). Repair via new correcting commits, never edit-in-place.

**S2 — Annotate the review-findings rows that reference retired bilingual siblings (`.es.md` files) removed by the English-only decision (2026-09-15), so the rows remain historically accurate but a reader can infer which target file was removed.**
> `docs/features/26-staged-verification-contracts/review-findings.md` rows referencing `README.es.md` and `CHANGELOG.es.md` paths (audit 1 F5 + audit 2 F5). Frozen historical records, so a repair is a new correcting commit, never an edit-in-place promise.

## Impact

- Frozen legacy unit docs (pre-lane, authored before the `unit-lane` / `fix-lane` templates existed). These are historical records: content must not be rewritten, only annotated.
- The fix annotations are additive (appended sections), so they do not alter any existing text, link, or table row.
- The `docs/fix/572-legacy-broken-links/` unit folder is new and does not affect existing units.
- The roadmap row for #572 will be updated (status flip only).

## Retirements

None. The fix is purely additive — dead-reference annotations are appended to the affected files. No surface is removed.

## Non-goals

- Do NOT edit existing content in-place (the frozen-record rule).
- Do NOT delete dead markdown links (that would alter the historical record).
- Do NOT create new bilingual `.es.md` files (the English-only decision is permanent).
- Do NOT audit every file in the repository — only the files explicitly flagged by audit 1 F5 and audit 2 F5.

## Risk tier

**`passive`** — documentation, comments, prose with no executable effect.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this fix

## Known pre-existing issues

none

## Tasks

- P1 — Add a "Dead references" section to `docs/features/27-pi-agentic-workflow/TASKS.md` annotating the broken `[Versión en español](README.es.md)` markdown link at line 62 and the text references to `README.es.md` at lines 58, 61, 71.
  (Implements: S1)
  - Relevant files: docs/features/27-pi-agentic-workflow/TASKS.md

- P2 — Add a "Dead references" section to `docs/features/59-executable-continuations/progress.md` annotating the broken `[interview](references/INTERVIEW.md)` markdown link at line 234 and the text references to `INTERVIEW.md` at lines 75, 234, 246.
  (Implements: S1)
  - Relevant files: docs/features/59-executable-continuations/progress.md

- P3 — Add a "Dead references" section to `docs/features/38-workflow-status-sensor-script/review-findings.md` annotating the broken `[Versión en español](MIGRATION.es.md)` and `[English version](MIGRATION.md)` references at VF-36 line 104 and the MIGRATION.es.md text reference at line 61.
  (Implements: S1)
  - Relevant files: docs/features/38-workflow-status-sensor-script/review-findings.md

- P4 — Add a "Dead references" section to `docs/features/26-staged-verification-contracts/review-findings.md` annotating all rows that reference now-deleted bilingual siblings (`README.es.md` at F55, F68, F78, F102-F105, F110; `CHANGELOG.es.md` at F90) with a note that they pointed to now-removed bilingual files (English-only decision 2026-09-15).
  (Implements: S2)
  - Relevant files: docs/features/26-staged-verification-contracts/review-findings.md

- P5 — Append a session log entry to `docs/LOGS.md` recording the fix.
  (Implements: S1, S2)

- P6 — Run deterministic gates: `node --test scripts/*.test.mjs` (root suite) and verify no regression.
  (Implements: S1, S2)

### Planning evidence

- PE-001 — TASKS.md line 62 contains a markdown link `[Versión en español](README.es.md)` that is a dead reference (the target file `packages/pi-agentic-workflow/README.es.md` was deleted by the English-only decision).
  authority-kind: direct-read
  claim: the markdown link is dead
  source: `rg '\]\(README\.es\.md\)' docs/features/27-pi-agentic-workflow/TASKS.md` at HEAD
  freshness: current
  affected-obligation: O1

- PE-002 — progress.md line 234 contains a markdown link `[interview](references/INTERVIEW.md)` that is a dead reference (the target file `skills/design-feature/references/INTERVIEW.md` was deleted by commit 4b2e0759).
  authority-kind: direct-read
  claim: the markdown link is dead
  source: `find . -name INTERVIEW.md` → 0 matches; `git log --diff-filter=D -- skills/design-feature/references/INTERVIEW.md` → deleted at 4b2e0759
  freshness: current
  affected-obligation: O1

- PE-003 — review-findings.md line 104 (VF-36) contains markdown links referencing `MIGRATION.es.md` (deleted) and `MIGRATION.md` (still exists) as quoted content.
  authority-kind: direct-read
  claim: the `.es.md` reference is dead
  source: `ls docs/workflow/MIGRATION.es.md` → file not found
  freshness: current
  affected-obligation: O1

- PE-004 — review-findings.md lines 55, 68, 78, 86, 89, 99, 105-108, 113 contain text references to `README.es.md` and `CHANGELOG.es.md` paths in the "Where" column of the findings table.
  authority-kind: direct-read
  claim: these are text references to now-deleted bilingual siblings
  source: `ls packages/pi-agentic-workflow/README.es.md` → file not found; `ls CHANGELOG.es.md` → file not found
  freshness: current
  affected-obligation: O2

### Obligations

obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
O1 | S1 | Every dead markdown link flagged by audit 1/2 F5 is annotated in its host file with a "Dead references" section explaining why the link is dead. | P1,P2,P3 | add-dead-annotation | execute-phase | grep -c "Dead references:" docs/features/27-pi-agentic-workflow/TASKS.md → ≥1 AND grep -c "Dead references:" docs/features/59-executable-continuations/progress.md → ≥1 AND grep -c "Dead references:" docs/features/38-workflow-status-sensor-script/review-findings.md → ≥1 | the section is appended at end of each file | verified
O2 | S2 | Every review-findings row referencing a now-deleted bilingual sibling (README.es.md, CHANGELOG.es.md) is annotated with a "Dead references" section explaining the deletion and pointing to the English-only decision. | P4 | add-dead-annotation | execute-phase | grep -c "Dead references:" docs/features/26-staged-verification-contracts/review-findings.md → ≥1 | the section is appended at end of the file | verified

## Triaged steps

> Paste the `## Triaged steps` block from `bunx @gtrabanco/agentic-workflow@4.10.0 unit-route --triage 572-legacy-broken-links` here verbatim.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-12-25, the issue, verbatim:
  ```
  Issue #572 (S, fix-now 2026-11-16): broken relative links in frozen (pre-lane) legacy unit docs — docs/features/27-pi-agentic-workflow/TASKS.md:58-62 → README.es.md (removed by the English-only decision), docs/features/59-executable-continuations/progress.md:75 → a moved INTERVIEW.md path, plus the rows audit 1 F5 flagged. Repair via new correcting commits, never edit-in-place. Origin: product audit 2 F5. Triaged fix-now (S); no existing unit absorbs this.
  ```
- **E1** — 2026-12-25, `node --test scripts/normative-drift.test.mjs` · exit 0 · 21 pass / 0 fail.
- **E2** — 2026-12-25, `grep -c "Dead references:" docs/features/27-pi-agentic-workflow/TASKS.md docs/features/59-executable-continuations/progress.md docs/features/38-workflow-status-sensor-script/review-findings.md docs/features/26-staged-verification-contracts/review-findings.md` · exit 0 · all four files have ≥1.
- **P1** — 2026-12-25 00:00, annotate dead references in frozen legacy unit docs · 83b822e5.
- **P2** — 2026-12-25 00:00, verify obligations: O1 (dead markdown links annotated in TASKS.md/progress.md/review-findings.md 38) and O2 (bilingual siblings annotated in review-findings.md 26) both verified · same commit.

## Next

Implement P1 through P5: add dead-reference annotations to each affected file, then append the session log entry to LOGS.md.

## References

Issue #572 (this unit). Product audit 2 F5 (origin finding). Product audit 1 F5 (original detection). English-only decision (2026-09-15) — removed all bilingual `.es.md` siblings.

## Branch

`fix/572-legacy-broken-links`

## Depends on

— (independent)

## Regression scope

n/a — no previously-working behaviour to break; the change is purely additive (appending sections to existing files).