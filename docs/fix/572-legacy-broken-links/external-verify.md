# External verify receipt — fix/572-legacy-broken-links

2026-11-16 — full verdict (no prior EXTERNAL VERIFY block existed for this unit).

```
EXTERNAL VERIFY — base: 44a20ab6 · head: 88a1d4b1
Blockers: 3 —
  B1 docs/fix/572-legacy-broken-links/SPEC.md (O1/O2 validator cells; Log E2) — reproducer: `grep -c "Dead references:" docs/features/27-pi-agentic-workflow/TASKS.md docs/features/59-executable-continuations/progress.md docs/features/38-workflow-status-sensor-script/review-findings.md docs/features/26-staged-verification-contracts/review-findings.md` → 0 / 0 / 0 / 0, exit 1; the appended heading is `## Dead references` (no colon), so both obligations' declared validators and receipt E2 ("exit 0 · all four ≥1", echoed in PR #576 "All four files contain ≥1 \"Dead references:\" section (verified)") are false at head. Base side: the sections do not exist at 44a20ab6 (0 by construction) — the "verified" status never reproduced. Smallest action: make validator and heading agree (validator greps `## Dead references`, or the heading carries the colon) and re-record E2.
  B2 docs/features/38-workflow-status-sensor-script/review-findings.md:107-108 — reproducer: `git show origin/main:docs/features/38-workflow-status-sensor-script/review-findings.md > b; head -107 <file> > h; cmp b h` → differ at byte 19057, line 107. Base line 107 was one REVIEW-RAN row ending `… (two-cycle-cap escape) | | | | | |`; head splits it into `… escape) |` plus a new `| | | | | |` line, so the frozen table renders an extra empty row. In-place edit of a frozen record, contradicting S1/S2 "never edit-in-place", SPEC Non-goals/Impact ("purely additive … alter no existing text"), and PR #576 ("No content edited in-place"). Base 44a20ab6 = intact row; head 88a1d4b1 = split. Smallest action: restore line 107's original bytes (rejoin the trailing cells; keep the appended section).
  B3 docs/features/26-staged-verification-contracts/review-findings.md:89 vs annotation table (:131-147) — reproducer: `rg -n "README.es.md" <file>` → line 89 (F93, "… + README.es.md sibling section") is a row referencing the deleted sibling but is absent from the annotation's row table (F55/F68/F78/F96/F102-F105/F110 listed; F90 for CHANGELOG). PE-004 names line 89; O2 binds "Every … row" and is marked `verified`. Base: no annotation existed (44a20ab6); the new surface silently drops F93. Smallest action: append the F93 (line 89) row to the annotation table inside the new section.
Advisories: 5 —
  A1 docs/features/27-pi-agentic-workflow/TASKS.md:84 (and docs/features/38-…/review-findings.md:116) — line 62's `[Versión en español](README.es.md)` and VF-36's quote sit inside inline code spans, so they are quoted snippets, not rendered links (only docs/features/59-…/progress.md:234's `[interview](references/…)` renders live, and it resolves relative to progress.md, never to skills/…). The annotation/PR call them "the broken markdown link" and say the counterpart "remains valid" — prose imprecision in new text; the substantive claim (target file deleted) is true. Why advisory: no rendering defect, direction of the fix unaffected.
  A2 docs/audits/1-2026-11-08.md:69 — "F5 — false positive; nothing to repair … zero real broken links in the live tree" survives while this unit repairs F5 (and progress.md:234 is in fact a real dead link, so that note is also partly wrong). Why advisory: the note is pre-existing at base 44a20ab6 — fires regardless of this change (stability check).
  A3 docs/LOGS.md (P5) — no LOGS.md entry; the work is carried by two pending journal fragments (.agentic-workflow/journal/20261225T000000Z-… and 20261116T011743Z-…), both narrating the same session (two entries at aggregation), and fragment 1 plus SPEC Log E1/E2/P1/P2 are dated 2026-12-25 while the commits are 2026-11-16; PR #576's "docs/LOGS.md — session log entry appended (via aggregator)" is not yet true. Why advisory: fragment carrier is the sanctioned deferred path (log-immutability blocked the direct append); date/duplication are record-accuracy only.
  A4 SPEC.md P6 — no receipt row for the declared root suite. My run: `node --test scripts/*.test.mjs` → 2274 tests, 2269 pass, 3 fail: unit-route F7 timing ("took 694ms, expected <500ms") passes 64/64 alone at head; 2× workflow-status-sensor fails on ENOENT packages/agentic-workflow/node_modules, and a base copy in mktemp scratch fails the same suite (unbuilt gitignored outputs). `bun scripts/test-impact.mjs --base origin/main` → verdict `empty`, executable 0. Why advisory: all three reds reproduce outside the change (environment/pre-existing), not change-caused.
  A5 docs/fix/572-legacy-broken-links/SPEC.md (## Next; Impact roadmap bullet) — `## Next` still orders "Implement P1 through P5" though P1–P4 landed, and Impact promises a #572 roadmap status flip that did not happen (docs/ROADMAP.md untouched, row `pending` at base and head; docs/generated/units.md gained the row and `bun scripts/docs-generate.mjs --check` → PASS 3 checked/0 stale). Why advisory: stale spec prose + unfulfilled future-tense claim, no defect caused.
Sibling sweep: 1 advisory — A2 (audit-1 F5 false-positive note still asserting "nothing to repair"); plus the in-file sibling inconsistency of the rewritten REVIEW-RAN row (B2 itself); repo-wide `\]\([^)]*\.es\.md\)` sweep finds only backtick-quoted or `<name>.es.md` template occurrences — no surviving live `.es.md` link.
Completeness: open — S1 (P1-P3, O1) and S2 (P4, O2) both resolve to tasks but their declared validators do not run green at head (B1), and O2's "every row" invariant has the counterexample F93 (B3); no disposition recorded for either. P5/P6 carried no obligation rows (see A3/A4).
Spot check: `grep -c "Dead references:" docs/features/27-pi-agentic-workflow/TASKS.md … (E2, SPEC Log)` → mismatch (recorded exit 0 / ≥1 each; observed exit 1 / 0 each) — per contract the unit's recorded evidence is treated as untrusted; this verdict rests on my own runs: normative-drift 21/0, pre-execution-quality 1 pass/1 skip, check-skill-context PASS 30 skills, structural-sibling-pins 8/0 (all matching PR #576's declared outputs), docs-generate --check PASS, test-impact empty, root suite as in A4.
Verdict: NEEDS-DECISION (B1, B2, B3)
```

Read-only run: no commit, no push, no branch, no forge mutation. This receipt file is uncommitted; corrections belong to `/aw-local-apply` (B1 validator/heading wording + E2 re-record; B2 restore line 107 bytes; B3 append F93 row), then a blockers-only delta recheck.

---

**2026-11-16 — correction batch addendum (factual record, not a verdict).** One batch
folded B1–B3 and two cut-time gate reds found while verifying (this doc's
`verify` cited-path refusals ×2, `phase-lint` BLOCKED ×6): B1 — the colon
carried into the four `## Dead references:` headings, leaving the O1/O2
assertion, E2's recorded command and PR #576's claim unchanged and true;
B2 — line 107 of docs/features/38-workflow-status-sensor-script/review-findings.md
restored byte-for-byte; B3 — the F93 (line 89) annotation row added. Reproducers
re-run green on the batch head (R1 → 1/1/1/1 exit 0; R2 → byte-identical prefix;
R3 → 1; O3 → exit 0; O4 → 11 AND 11), `verify` PASS 0 violations,
`phase-lint` PASS P1–P7, root suite 2270/2274 with only the two base-evidenced
environmental reds. Advisories triaged: A5's stale `## Next` fixed; A2 (audit-1
note) left as frozen pre-existing history; A1 left — its wording derives from
S1's verbatim issue text and amending it would contradict frozen PE-001; A3's
fragments left to the journal writer/aggregator (a third fragment now records
this batch); A4 has no code fix (environmental). Owner delta-verify re-runs
B1–B3's reproducers and the O3/O4 validators on the batch head.
