# External verify — feature 526 · evidence-backed elicitation

Full verdict (no prior `EXTERNAL VERIFY` receipt existed for this unit). Every
declared command in the SPEC's acceptance criteria, tasks P1–P7, obligations
O1–O16 and log rows E1–E7 / G1–G9 was re-run in the foreground at the bound
head; S2–S5 and S6/S8 boundaries were additionally probed with fixtures derived
from the `S#` wording, built in `mktemp -d` scratch and removed after. The
change's own tests were never counted as evidence of correctness.

State note: the base was bound at `origin/main` = `b25ef8a999a6656d5765f53f50e39f16fd678889`
(the merge-base with the head) and moved mid-run to `8b51f3753d699f03cb3999cfcf4760b87b22f228`
(unit #590 / PR #604 merged concurrently). No surface this verdict reads was
touched by that movement except the three shared docs both units edited
(`AGENTS.md`, `docs/workflow/GATE_INVENTORY.md`,
`docs/workflow/SKILL_CONTEXT_BUDGETS.json`) — see Advisory 1 for the resulting
PR conflict and gate divergence.

```text
EXTERNAL VERIFY — base: b25ef8a999a6656d5765f53f50e39f16fd678889 · head: db2d01f3c1c3837ad1adcf1f36a31dc8d500c497
Blockers: 3 —
  1. docs/features/526-elicitation-layer/SPEC.md:54 (AC8) and :176 (E4) — reproducer: `rg -c '^shape \|' skills/unit-lane/references/ELICITATION.md` prints 2, the criterion declares "matches 1" and E4 records "= 1"; the count never printed 1 at any committed head (2 at 2ebb9a24, 24a0c367, 15a0490f and db2d01f3). The same AC sentence says the shape vocabulary is "four request families" while the bank ships six (`feature|fix|refactor|docs|dependency|performance`, prespec.mjs `REQUEST_SHAPES`, ELICITATION.md:46/167, and the unit's own P2 Log and changeset both say six; O4 planning-obligations.md:15 repeats "four"). Base-vs-head: all of these bytes are new in this change — no base counterpart — and the declared check fails deterministically. Smallest action: correct AC8's count and family number to what the tree prints (and E4/O4 to match), text only.
  2. docs/features/526-elicitation-layer/planning-obligations.md:20 (O9) — reproducer: `rg -c 'LEDGER_COLUMNS' packages/agentic-workflow/src/elicitation/prespec.mjs` prints 3, the row's required-evidence cell states "matches 1", status `verified`; SPEC AC5 and D6 record the corrected value 3 ("= 3 not 1") but the O9 cell was never updated, so the stated outcome has not reproduced since the implementation landed (3 at cbe4131c and every head after). Base-vs-head: file new in this change. Smallest action: correct the O9 required-evidence cell to matches 3, text only.
  3. skills/triage-issue/references/ISSUE_PROCESS.md:66–67 — reproducer: the `one-shot` eligibility condition 2 reads "the pre-spec cut before triage says `questions: none`, and no `open-questions@1` row is open"; at base (b25ef8a9) it read "nothing waits on the owner and no `open-questions@1` row is open". The condition "nothing waits on the owner" survives nowhere (repo-wide `rg` finds zero occurrences), and the artifact condition that replaced it is not equivalent: a pre-spec whose bank rows are all answered by request/repo/defaults says `questions: none` while a non-bank decision still waits on the owner — base disqualified that, head passes it. This is a lost qualifier on a binding eligibility rule, and it contradicts the same change's claim at SPEC.md:61 and in the changeset that "the six eligibility conditions are unchanged". Base-vs-head: `git diff origin/main..HEAD -- skills/triage-issue/references/ISSUE_PROCESS.md` shows the exact hunk; no other file carries the clause. Smallest action: restore the condition and name the pre-spec as its evidence form (keep both clauses), text only.
Advisories: 2 —
  1. scripts/worktree-guard.mjs (gate step 10/15) — G9's exact command `bun scripts/local-gate.mjs --skip-network --jobs 2 --no-bail` re-ran at head as 14/15, root-suite exit 0 in 176s, crate bun 238s / crate node 93s / schema node 7s / pi node 17s all exit 0, only `worktree-guard` FAIL on `FINDING .worktrees/feat-595-test-surplus-audit — STALE`. Advisory, not blocker: the guard is untouched by this diff, the finding names another session's worktree whose branch merged into origin/main only during this run (not in the bound base), and the reproducer fires on cross-session repo state this change never touches. Owning session removes the stale worktree. The same run's state note: PR #607 reports CONFLICTING against live main because units 526 and 590 both edited AGENTS.md / GATE_INVENTORY / SKILL_CONTEXT_BUDGETS — integration is the owner's stated `## Next`, not a change defect.
  2. docs/features/526-elicitation-layer/SPEC.md:61 (Impact), .changeset/526-evidence-backed-elicitation.md, .agentic-workflow/journal/20261117T094947Z-…-narrative-local.md — these narrate the triage wiring as reading the pre-spec "instead of asserting 'small and understood'", but the base text asserting "small and understood" is the intro at ISSUE_PROCESS.md:62 and it survives unchanged; what was actually rewritten is condition 2 (blocker 3). Prose mischaracterization on narrative surfaces → advisory; the binding-rule defect itself is blocker 3.
Sibling sweep: clean — no surviving mention anywhere asserts the removed truth (`nothing waits on the owner`: 0 hits repo-wide; triage SKILL.md and ISSUE_WORKFLOW.md only restate the generic "six eligibility conditions", still six; AGENTS.md and GATE_INVENTORY.md both list `elicitation-checklist`+`pre-spec` on the same drift row, no `| elicitation` gate row anywhere; bin usage line, README Commands row and CRATE_COMMANDS stay in token parity per cli.surface 3/0; docs/generated/units.md row matches the roadmap row per docs-generate --check 3/0). The four-vs-six and 1-vs-3 count contradictions are recorded under blockers 1–2, not as sibling lies.
Completeness: S1–S8 resolved (tasks P1–P7 all carry (Implements: S#) and every task validator re-ran green here: P1 counts 16/13, P2 skill-lint PASS + 16 bank rows, P3 red reproduced at af042f2a exit 1 `Cannot find module`, P4 suite 28/0, P5 normative-drift 21/0 + check-skill-context exit 0, P6 elicitation check exit 0, P7 verify ok:true + phase-lint PASS P1–P7 6/6); no S# carries a silent drop. Open ids: AC8's declared count and O9's required-evidence proof (blockers 1–2); obligations O1–O16 all `verified`, 15/16 re-run green, O9 the exception named above.
Spot check: bun packages/agentic-workflow/bin/agentic-workflow.mjs elicitation check --bank skills/unit-lane/references/ELICITATION.md --spec docs/pre-spec/2026-11-17-526-elicitation-layer.md → match (exit 0, `ELICITATION CHECK PASS — docs/pre-spec/2026-11-17-526-elicitation-layer.md · 5 row(s) · 0 question(s) · feature` plus the `- same-family:` line — byte-equal to Log E5's reported output)
Verdict: NEEDS-DECISION (B1 AC8 non-reproducing declared check, B2 O9 required-evidence mismatch, B3 lost qualifier on one-shot condition 2)
```

2026-11-17 — corrections above belong to `/aw-local-apply` under its correction
bounds; this receipt is what makes the next run a delta verdict.

## Addendum — 2026-11-17, correction batch on this receipt (one §9 cycle)

Owner order S1 ("triage and fix those that deserve to fix but understand the
context before fix and check you haven't broke another different thing …"):
**blockers 1–3 folded in one batch** — AC8/E4/O4's counts and family number
corrected to what the tree prints (2 / 2 / six), O9's import-proof cell corrected
to matches 3, one-shot condition 2 restored its `nothing waits on the owner`
clause with the pre-spec as its evidence form, and the Impact/changeset sentences
drop the "instead of asserting small and understood" mischaracterization.
Advisory 2: its two live halves folded; the dated journal fragment keeps its
record (append-only history — the correction is SPEC Log D12). Advisory 1: kept —
the stale `feat-595` worktree belongs to its owning session (removed by that
session mid-run; `worktree-guard` now reports 0 findings), and PR #607's
CONFLICTING state against the main that moved mid-run (`b25ef8a9` → `8b51f375`)
is the owner's integration step in the unit's `## Next`, never this batch's.

Recheck bounded to the blockers plus the touched obligation rows, then the full
offline gate: every reproducer green (R1 `^shape |` = 2 = corrected AC8 · R2
LEDGER_COLUMNS = 3 = corrected O9 · R3 restored clause at ISSUE_PROCESS.md:66,
`pre-spec` = 2, six eligibility rows = 6); O4 rows 16, O1/O15 2/1/1; `verify`
ok:true, `phase-lint` PASS (fingerprint unchanged `e2479e06…`), elicitation
28/0, normative-drift 21/0, skill-lint PASS, budgets PASS, docs-generate PASS,
prose-gate PASS, roadmap-settle 0, red-first 54/0, lint-changeset ok;
`bun scripts/local-gate.mjs --skip-network --jobs 2 --no-bail` → exit 0 ·
`PASS — 15 step(s) in 503s`. No collateral breakage found; loop ended after
iteration 1.

Status: 3/3 blockers fixed and re-verified in this cycle; awaiting the owner's
**delta verdict**. The verdict block above stays as the receipt of record
(append-only) until that run replaces it.
