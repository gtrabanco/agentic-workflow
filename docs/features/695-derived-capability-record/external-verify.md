# 695 — derived-capability-record · external verify

First receipt for this unit: no prior `EXTERNAL VERIFY` block existed in the unit
dir, no review verdict is recorded, and no corrections have landed since any
prior receipt — **full verdict, once** (2026-11-24).

EXTERNAL VERIFY — base: 15bcab21 · head: 51f7a129
Blockers: 1 —
1. `docs/features/695-derived-capability-record/SPEC.md:149` — the Retirements
   row claims the snapshot-mirror parity claim ("the record mirrors the
   snapshot's `capabilities[]`") is retired with no-consumer evidence
   `rg -c 'impliedHarness' packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` → 0.
   Observed: **3** (`test/catalog-parity.test.mjs:187,222,223` — `impliedHarness`
   and its parity test survive unchanged from base). The suite itself is not
   lying — the snapshot was corrected (D5), so the mirror parity passes and my
   own snapshot↔record agreement probe reports 0 mismatches — but the unit doc
   asserts a retirement that did not happen, and a future verify would read this
   row as a stale-claim hook. Reproducer: `rg -c 'impliedHarness'
   packages/pi-nan-agentic-workflow/test/catalog-parity.test.mjs` → 3 (base: the
   claim does not exist; the row is change-caused). Smallest action: re-cut the
   row (the mirror parity is retained/re-anchored, not retired), or actually
   retire the three mirror tests if the owner decides IR6 deletion instead —
   route to `/aw-local-apply`.
Advisories: 2 —
1. `packages/pi-nan-agentic-workflow/README.md` fleet table still describes
   `deepseek-v4-flash` as "JSON mode + `json_schema` (no tools)" while the
   record, the snapshot and the provider attest `Tool calling` — pre-existing at
   base (disclosed in this unit doc, 51f7a1291); advisory, owner-scheduled docs repair.
2. `packages/pi-nan-agentic-workflow/package.json:4` description rewrite swapped
   the em-dash for its `\u2014` escape — encoding-only retouch, no semantic
   effect; cosmetic.
Sibling sweep: clean apart from blocker 1 — `RECORDED_FACTS` survives only in
the unit's own ledgers and the generator's historical comment (both describe the
retirement, neither asserts the old truth); "not documented" survives only as
the `unmeasured` column mapping in `test/model-facts.test.mjs` (correct);
`docs/ROADMAP.md`/`docs/LOGS.md` "hand-transcribed" mentions are historical
narrative, not live truth claims.
Completeness: S1–S13 resolved — every `S#` maps to a P-task with a validator
re-run green here (`S1`→P7, `S2`/`S6`→P4, `S3`/`S7`/`S8`→P2–P3, `S4`/`S9`→P5,
`S5`→P2, `S10`/`S12`→P6, `S11` non-goals policed by O11/O12 validators,
`S13`→P8/P5); no open ids. All 16 obligation rows `verified`; O1, O2, O4, O5,
O6, O7, O10, O11, O12, O13, O15, O16 re-run green in this verify; O8's
`--check` exit-0 re-run, its moved-cell exit-1 half probed off-tree; O9/O3
within the green suite; O14's gate evidenced by `G4` (three later commits touch
only this unit's docs; `docs-generate --check`, journal aggregate and `verify@1`
re-run green here after them).
Independent probes beyond the change's own tests: (a) scratch (`mktemp -d`)
`--check` on an unmodified copy → exit 0 · `--write` → exit 0, byte-identical to
the committed artifact, pin kept 1.6.1 · moved-cell `--check` → exit 1 naming
the cells; scratch removed, live tree never touched by the writer (base
`--check` runs hit the live tree read-only); (b) a base-vs-head differential
over all 11 routed models × OFF/ON × five eligibility shapes: OFF and refusal
cases byte-identical, ON diffs are exactly the disclosed `context_window`
1000000→1048576 cells plus the four paid models flipping
`tool-harness-unmeasured → phases-batched` at 4 phases — **0 unexplained
differences**, matching `E9`. Added probes issued as commands:
`bun run test` (packages/pi-nan-agentic-workflow) → exit 0, 85 pass / 0 fail,
check line `identical — …matches @gtrabanco/pi-nan-provider@1.6.1`;
`bun scripts/docs-generate.mjs --check` → PASS, roadmap unchanged;
`bun scripts/lint-changeset.mjs` → ok; snapshot↔record agreement → 0 mismatches.
Spot check: `bun run test` (packages/pi-nan-agentic-workflow) → match (reproduces
`E8`'s reported 85/0 and the identical check line verbatim).
Verdict: NEEDS-DECISION (blocker 1 — the Retirements row's no-consumer count
does not reproduce; the code and behavior are green and verified)

Correction batch (2026-11-24, per the correction bounds): blocker 1 re-cut —
the Retirements table now names one retirement; the snapshot-mirror parity is
recorded as retained with its live count 3 (validator O17, `E` line in the
unit doc's Log). Advisory 1 repaired inside the same batch — the same defect
class in the same symbol: the `deepseek-v4-flash` row's "(no tools)" clause and
the tool-calling paragraph's "only on the four rungs" scope, both refuted by
the snapshot and provider facts, and the latter further by the quality
profile's rung 1 being `kimi-k3.1-pro` (validator O18). Advisory 2 restored —
the manifest description again carries the base's literal em dash (validator
O19). Recheck result: every touched validator green in the foreground
(unit doc Log E17–E19); no blocked bug remains. The batch touched docs and one
manifest string only; no command path introduced or modified by the change was
run against the live tree.
