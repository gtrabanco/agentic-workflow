# External verify — fix/284-unattended-durability

2026-11-09 · first receipt for this unit (no prior `EXTERNAL VERIFY` block →
full verdict, once). Tree clean at `f2dea4ee`, branch `feat/284-unattended-durability`.
Base bound to `1fa39fe1` (= merge-base with `origin/main`, the SPEC's own base).
Verifier environment note: the worktree had no `node_modules`; a fresh
`bun install --frozen-lockfile` (2.02s, no lockfile change) and `bun run build`
were required before any validator could run. No declared validator was skipped.
No mutation path of this change ran against the live tree: the SIGKILL
reproducer and its rendered supervisor script execute only inside
`mkdtempSync(tmpdir())` scratch (`test/conductor-crash-resume.test.mjs:24,68`),
verified by reading the fixture before running it.

EXTERNAL VERIFY — base: 1fa39fe1 · head: f2dea4ee
Blockers: 0
Advisories: 3 —
A1 · docs/fix/284-unattended-durability/SPEC.md (P11 validator claim): the task
states `rg -c 'docs/fix/284-unattended-durability' docs/ROADMAP.md` matches 2;
observed **1** (roadmap row 102 uses the full path, the fix-index row 183 links
`fix/284-unattended-durability/SPEC.md` relatively). The substance holds — both
rows exist and point at the unit — but the claimed validator outcome does not
reproduce; smallest action: correct the claimed count to 1 (or make row 183's
link use the full path) in the next doc-touching batch.
A2 · docs/fix/284-unattended-durability/planning-obligations.md (O4 prose cell):
"a throwing run writes neither" — actual behavior, pinned by
`conductor-loop-resume.test.mjs` L7, is that a throwing run writes `run/start`
and **no `run/stop`** (the start row is what makes the death detectable). The
protected invariant (exactly one `run/stop` per exit; no `run/stop` on death)
is implemented and green; only the ledger wording drifts. Smallest action:
reword to "writes no `run/stop`".
A3 · docs/ROADMAP.md:102: the row retains the historical parenthetical
"verified today: zero `resume|RESUMABLE|reconcile|crash` matches" — false at
head (the change adds all four), superseded in the same cell by the dated
2026-11-09 carry note. Reads as current to a skimming reader; smallest action:
mark it "at pickup:" in the next doc-touching batch.
Sibling sweep: clean apart from A3 — `formatLogLine`/`formatDate` removed from
`loop.ts` have no surviving mention anywhere; no surface still asserts the
run-log grammar is a closed set; the only `advance-run` readers remain the
config default, its two tests and the new prose (matches PE-007).
Completeness: S1–S11 all resolved — S1–S6, S9–S11 via tasks P1–P15 whose
validators re-ran green here (six conductor suites 55 pass / 0 fail;
`scripts/pi-durable-spike.test.mjs` 5 pass / 1 skip without the substrate;
`bun run build` exit 0; `bun scripts/version-parity-gate.mjs --content --base
1fa39fe1` VERDICT: PASS; `bun scripts/docs-generate.mjs --check` PASS; manifest
diff vs base empty; `skills/` diff empty; `gh pr list --head
feat/284-unattended-durability --state open` → PR #485); S7/S8 as recorded
dispositions (D2, PE-005, PE-006). Obligations O1–O16 all `verified`, every
validator re-run green here; O12's `n/a` is evidenced (E8/G3/G4).
Spot check: `bun test test/conductor-crash-resume.test.mjs` → match (reported
2 pass / 0 fail, observed 2 pass / 0 fail). Divergence disclosed: `bun run test`
in the package reported 746 pass / 2 fail (G4) — observed here 748 pass / 0
fail; the two "live" workflow-tools cases the receipt called environmental pass
in this environment, a favorable divergence, not a change defect (they pass at
head).
Verdict: VERIFIED
