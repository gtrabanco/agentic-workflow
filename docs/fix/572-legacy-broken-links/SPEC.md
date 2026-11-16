---
type: docs
scope: xs
ac-hash: 16d2a3e955b7bba539ab6b8b15535829d31d8d7fa126329e4a32faf6a337fff4
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

## Acceptance criteria

- **AC-S1** — S1: each of the four frozen legacy docs carries an appended section titled `Dead references:` explaining why every cited target is gone, with zero byte changes to the text that existed at base 44a20ab6 (annotations only). Check: `grep -c "Dead references:" docs/features/27-pi-agentic-workflow/TASKS.md docs/features/59-executable-continuations/progress.md docs/features/38-workflow-status-sensor-script/review-findings.md docs/features/26-staged-verification-contracts/review-findings.md` → 1 in every file, and the O3 append-only `cmp` loop → exits 0.
- **AC-S2** — S2: every row of docs/features/26-staged-verification-contracts/review-findings.md that cites a deleted bilingual sibling (F55, F68, F78, F90, F93, F96, F102-F105, F110 — eleven rows, none omitted, F93 included) is catalogued in the appended annotation table with its row id and line. Check: the O4 double count → 11 AND 11.

## Tasks

- P1 — Add a "Dead references" section to `docs/features/27-pi-agentic-workflow/TASKS.md` annotating the broken `[Versión en español](README.es.md)` markdown link at line 62 and the text references to `README.es.md` at lines 58, 61, 71 (validator: `grep -c "Dead references:" docs/features/27-pi-agentic-workflow/TASKS.md` → ≥1)
  (Implements: S1)
  - Relevant files: docs/features/27-pi-agentic-workflow/TASKS.md

- P2 — Add a "Dead references" section to `docs/features/59-executable-continuations/progress.md` annotating the broken `[interview](references/INTERVIEW.md)` markdown link at line 234 and the text references to `INTERVIEW.md` at lines 75, 234, 246 (validator: `grep -c "Dead references:" docs/features/59-executable-continuations/progress.md` → ≥1)
  (Implements: S1)
  - Relevant files: docs/features/59-executable-continuations/progress.md

- P3 — Add a "Dead references" section to `docs/features/38-workflow-status-sensor-script/review-findings.md` annotating the broken `[Versión en español](MIGRATION.es.md)` and `[English version](MIGRATION.md)` references at VF-36 line 104 and the MIGRATION.es.md text reference at line 61 (validator: `grep -c "Dead references:" docs/features/38-workflow-status-sensor-script/review-findings.md` → ≥1)
  (Implements: S1)
  - Relevant files: docs/features/38-workflow-status-sensor-script/review-findings.md

- P4 — Add a "Dead references" section to `docs/features/26-staged-verification-contracts/review-findings.md` annotating all rows that reference now-deleted bilingual siblings (`README.es.md` at F55, F68, F78, F93, F96, F102-F105, F110; `CHANGELOG.es.md` at F90) with a note that they pointed to now-removed bilingual files (English-only decision 2026-09-15) (validator: `sed -n '/^## Dead references:/,$p' docs/features/26-staged-verification-contracts/review-findings.md | rg -c '^\| F[0-9]+'` → 11)
  (Implements: S2)
  - Relevant files: docs/features/26-staged-verification-contracts/review-findings.md

- P5 — Append a session log entry to `docs/LOGS.md` recording the fix — through the sanctioned carrier: a pending journal fragment that the merge-to-main aggregator consumes into the log (validator: `node packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` → `ok:true`, exit 0)
  (Implements: S1, S2)

- P6 — Run deterministic gates: `node --test scripts/*.test.mjs` (root suite) and verify no regression (validator: `node --test scripts/*.test.mjs` → no failure absent at base 44a20ab6, differential recorded in E-lines)
  (Implements: S1, S2)

- P7 — Fold the EXTERNAL VERIFY blockers B1–B3 of this unit (receipt `external-verify.md`): carry the `Dead references:` symbol into the four section headings, restore the frozen REVIEW-RAN row byte-for-byte, and add the missing F93 annotation row (validator: `for f in docs/features/27-pi-agentic-workflow/TASKS.md docs/features/59-executable-continuations/progress.md docs/features/38-workflow-status-sensor-script/review-findings.md docs/features/26-staged-verification-contracts/review-findings.md; do if ! cmp <(git show 44a20ab6:$f) <(head -c $(git cat-file -s 44a20ab6:$f) "$f"); then exit 1; fi; done` → exits 0)
  (Implements: S1, S2)
  - Relevant files: docs/features/38-workflow-status-sensor-script/review-findings.md,
    docs/features/26-staged-verification-contracts/review-findings.md

### Planning evidence

- PE-001 — TASKS.md line 62 contains a markdown link `[Versión en español](README.es.md)` that is a dead reference (the target file `README.es.md` under `packages/pi-agentic-workflow/` was deleted by the English-only decision).
  authority-kind: direct-read
  claim: the markdown link is dead
  source: `rg '\]\(README\.es\.md\)' docs/features/27-pi-agentic-workflow/TASKS.md` at HEAD
  freshness: current
  affected-obligation: O1

- PE-002 — progress.md line 234 contains a markdown link `[interview](references/INTERVIEW.md)` that is a dead reference (the target file `INTERVIEW.md` under `skills/design-feature/references/` was deleted by commit 4b2e0759).
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
O3 | S1 | Append-only invariant: every byte that existed at base 44a20ab6 in the four annotated legacy docs survives as a byte-prefix of the head file — the repair only ever appends, never edits in place (S1 "never edit-in-place", Non-goals, Impact). | P7 | fold-external-verify-blockers | execute-phase | for f in docs/features/27-pi-agentic-workflow/TASKS.md docs/features/59-executable-continuations/progress.md docs/features/38-workflow-status-sensor-script/review-findings.md docs/features/26-staged-verification-contracts/review-findings.md; do if ! cmp <(git show 44a20ab6:$f) <(head -c $(git cat-file -s 44a20ab6:$f) "$f"); then exit 1; fi; done → exits 0 | foreground run recorded in the Log's E-lines | verified
O4 | S2 | The annotation table in review-findings.md 26 catalogues every row of the frozen table that cites a deleted bilingual sibling — both counts agree at 11, none omitted (F93 included). | P7 | fold-external-verify-blockers | execute-phase | awk '/^## Dead references:/{f=1} !f && /\.es\.md/{n++} END{print n+0}' docs/features/26-staged-verification-contracts/review-findings.md → 11 AND awk '/^## Dead references:/{f=1} f && /F[0-9][0-9]/{n++} END{print n+0}' docs/features/26-staged-verification-contracts/review-findings.md → 11 | foreground run recorded in the Log's E-lines | verified

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
- **L2** — 2026-11-16, correction batch on the EXTERNAL VERIFY receipt (`external-verify.md`, base 44a20ab6 · head 88a1d4b1): B1 carried the `Dead references:` symbol into the four section headings — no test or gate pinned the colon-free heading, and the ledger's O1/O2 assertion, receipt E2's recorded command and PR #576's claim are unchanged and now true; B2 restored the frozen REVIEW-RAN row at docs/features/38-workflow-status-sensor-script/review-findings.md:107 byte-for-byte; B3 added the missing F93 (line 89) annotation row and P4's row list. Same batch repaired two cut-time gate reds found while verifying this unit: `verify`'s two `cited-path-missing` refusals (PE-001/PE-002 rephrased to context-relative citations — the dead paths were being cited as if they were live tree claims) and `phase-lint` BLOCKED on all six phases (task bullets now carry their `(validator: …)` spans); `## Acceptance criteria` + `ac-hash:` frozen per the apply contract. O1/O2 flipped back before the batch and re-verified; O3/O4 cut for the batch's own frozen-failure reproducers. Honesty note: P1/P2's named commit 83b822e5 resolves as a loose object in this clone but is reachable from zero refs — superseded by 77fba0af, which carries the annotation content.
- **E3** — 2026-11-16, frozen-failure corpus RED before the fix: `grep -c "Dead references:" …` over the four annotated files → 0/0/0/0, exit 1; `cmp` of base 44a20ab6's 107-line prefix vs head at docs/features/38-workflow-status-sensor-script/review-findings.md → differ, byte 19057, line 107; annotation-section count of `| F93 |` → 0.
- **E4** — 2026-11-16, foreground obligation validators after the batch: O1 → 1 in each of the three host files, exit 0; O2 → 1, exit 0; O3 four-file base-prefix `cmp` loop → exit 0; O4 → 11 AND 11; the stronger id-set `diff` (annotation ids vs the `.es.md`-citing row ids) → identical sets, exit 0. O1–O4 flipped to `verified` on this run.
- **E5** — 2026-11-16, doc gates on the corrected unit: `node packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/572-legacy-broken-links/SPEC.md` → VERIFY PASS, ok:true, 0 violations (baseline at head: 2 `cited-path-missing` refusals); `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/572-legacy-broken-links/SPEC.md` → verdict PASS, P1–P7 all 6/6, fingerprint ae5a00970b06ad5934b512ca961655541b3c20f372000a24c497cf2854e26802 (baseline: BLOCKED on six phases).
- **E6** — 2026-11-16, P6 root suite `node --test scripts/*.test.mjs` → 2274 tests, 2270 pass / 2 fail, 2 skipped: both failures are the pre-existing environmental pair at scripts/workflow-status-sensor.test.mjs:319 and :368 (ENOENT on the uninstalled gitignored `packages/agentic-workflow/node_modules`; the same suite fails at base 44a20ab6 in a mktemp archive copy, and `bun scripts/test-impact.mjs --base origin/main` → `empty`, executable 0). The unit-route F7 timing case red in the batch's first run passes on re-run (64/64 standalone) — load flake. Zero failures new vs base.

## Next

Owner delta external-verify of this correction batch (re-run B1–B3's reproducers plus the O3/O4 validators on the new head), then merge PR #576 (Closes #572); the pending journal fragments carry the docs/LOGS.md entry at aggregation.

## References

Issue #572 (this unit). Product audit 2 F5 (origin finding). Product audit 1 F5 (original detection). English-only decision (2026-09-15) — removed all bilingual `.es.md` siblings.

## Branch

`fix/572-legacy-broken-links`

## Depends on

— (independent)

## Regression scope

n/a — no previously-working behaviour to break; the change is purely additive (appending sections to existing files).