# 443 — doc index auto-hybrid · external verification

Dated, verbatim receipts of each external-verify run. The latest block is what
makes the next run a delta verdict.

```text
EXTERNAL VERIFY — base: 1fa39fe137e1265e5fcb239bfd8e24803e99a112 · head: 19c0f93b75aa9172cebe046dec1bd8d541747a7d
Run: 2026-11-09 · full verdict (no prior EXTERNAL VERIFY block existed for this unit) · read-only run: no commit, no push, no branch, no forge mutation; the mutating `doc --sync` path was executed only in a removed mktemp -d scratch clone with the provider credential unset.

Blockers: 1
1. packages/pi-agentic-workflow/test/alias-coverage.test.mjs:350 ("AC15: the README command table is the catalogue") — caused by packages/pi-agentic-workflow/README.md:60-68 (the new "code doors" table adds `/advance`, `/aw-index` and a second `/log-session` row; the pin's regex sweeps every `| \`/cmd\` |` row and deepEqual-fails against the catalogue).
   Reproducer: cd packages/pi-agentic-workflow && bun test test/alias-coverage.test.mjs → head: 15 pass / 1 fail (exit 1); base clone at 1fa39fe1 (mktemp scratch, removed after): 16 pass / 0 fail.
   Stability: reproduces only with this change's README rows — not on adjacent untouched code, so it is a blocker, not an advisory. Full `bun run test`: head 718 pass / 1 fail (exit 1) — this red is change-caused and post-dates E4 (the README table landed in 7e97260b, after E4 was recorded at 591a2806), and the gate could not observe it (node-absent environment), so the final head was never pi-suite-verified.
   Smallest action: stop the code-doors rows from matching the pin's row pattern (or except them in the pin as an expansion with a path-protection record) and re-run the suite; route to /aw-local-apply — the implementer owns the correction.

Advisories: 3
1. docs/fix/443-doc-index-auto-hybrid/SPEC.md AC-S8 (and planning-obligations.md O17) state the changeset "names the three packages"; .changeset/443-doc-index-auto-hybrid.md names two (@gtrabanco/agentic-workflow, @gtrabanco/pi-agentic-workflow). The schema package is untouched and bun scripts/version-parity-gate.mjs --content → VERDICT: PASS with the two-package changeset, so the artifact is right and the unit-doc check wording is wrong (and that clause was never executed into the Log). Advisory: no observable defect; the doc's own validator cannot pass as written.
2. Recorded-evidence drift: E-base/E4's "2 pre-existing conductor-sensor.test.mjs AC3 failures" do not reproduce at base or head in this checkout (7/7 green in both); PR #486's AC-S5 row reports "9 pass" for aw-index-command.test.mjs, which has 8. The recorded pi-suite numbers are unreliable — consistent with blocker 1 (E4 predates the P6 README edit). The load-bearing greens were re-run directly here and hold: crate test/doc 237/0, aw-index-command 8/0, doc-discipline 21/0, normative-drift 21/0, check-skill-context PASS (29 skills), path-guard pass — justified, version-parity VERDICT: PASS.
3. docs/LOGS.md:4740 — a dated historical journal entry asserting the pre-fix root cause ("CLI defaults to keyword mode…"). History in the immutable log, not a normative claim; noted, not actionable.

Sibling sweep: clean — retired token `mode = "keyword"` → 0 matches in packages/; `rg -- '--mode' skills/` → no match; crate README grammar, pi README, root README, CAPABILITIES.md, docs/generated/units.md and the roadmap rows all carry the new truth; only the historical LOGS.md entry of advisory 3 mentions the old behavior.

Completeness: S1→P1/P6/P7, S2→P2/P3, S3→P2/P4, S4→P2/P3, S5→P2/P5/P6, S6→P7 (recorded disposition D7: owner post-merge backfill, evidenced n/a), S7→P7 (AC-S7 check green), S8→P3/P5/P6 (changeset clause → advisory 1), S9→P2/P3/P4/P5/P7, S10→P1–P4/P6 — no S# silently dropped. Obligations O1–O21 re-verified green here or re-run green via the suites above; O22 evidenced n/a. O18's "verified" no longer reproduces at the final head (the pi-suite red of blocker 1) — named there.

Spot check: bun test scripts/doc-discipline.test.mjs + bun test scripts/normative-drift.test.mjs → 21 + 21 = 42 pass, matches E10's recorded "42 pass" (match). E5's path-guard re-run: verdict/offenders match (`PATH-GUARD pass — justified`, offenders none); checked: 27 vs recorded 36 explained by the P6/P7 docs being uncommitted at recording time. E4's recorded pi-suite output is contradicted by the observed run (717/2 reported vs 718/1 observed with a change-caused red) — that is blocker 1; the reported pi-suite numbers are untrusted until re-recorded.

Verdict: NEEDS-DECISION (1 — packages/pi-agentic-workflow/test/alias-coverage.test.mjs:350 vs packages/pi-agentic-workflow/README.md:60-68)
```

## Recheck after correction batch (2026-11-09)

Request, verbatim: `Apply to this repository: fix Blockers & Advisorie 1 & Advisorie 2 if they are confirmed` — all three confirmed, one correction batch applied, recheck limited to those rows per §9.

- **Blocker 1 — FIXED.** RED observed before the edit (`bun test test/alias-coverage.test.mjs` → 15 pass / 1 fail); the pin expands to the exact documented surface (catalogue ∪ {advance, aw-index}, duplicates collapsed) with a `path-protection-records@1` justification row (phase P7) in `decisions.md`. Observed GREEN: `bun test test/alias-coverage.test.mjs` · exit 0 · 16 pass / 0 fail; full `bun run test` · exit 0 · **719 pass / 0 fail**; `path-guard --phase P7` · exit 0 · `PATH-GUARD pass — justified`, offenders none.
- **Advisory 1 — CORRECTED.** AC-S8 and O17 now state the two touched packages with the reason (schema untouched, parity gate PASS); the changeset artifact is unchanged.
- **Advisory 2 — CORRECTED.** The Known-pre-existing-issues bullet is annotated (environment-dependent, does not reproduce at base or head here); PR #486's AC-S5 cell corrected (8 pass) and a dated verification update appended to the PR body.
- **Advisory 3** — not named by the request; untouched.

Recheck verdict: **the 2026-11-09 blockers list is clear** — re-run the external verify for the fresh receipt; a delta verdict on blocker 1 + the delta diff is sufficient.
