# External verify — fix/432-model-memory-tier-0

2026-11-07

```text
EXTERNAL VERIFY — base: e1d94057a9204b02f2d7597e015f3855279f9a1c · head: 3e02d85c20ad6aec8f950e32eaede58ed4afaa11
Blockers: 1 — docs/fix/432-model-memory-tier-0/SPEC.md:253 · reproducer: read SPEC.md:253 ("The owner's external verify of 821b5af5 + dacf767c …; on approval, open the PR closing #432") against SPEC.md:248 (D3: approval "Okey", no findings, "The PR was opened") and `gh pr list --head feat/432-model-memory-tier-0` → #447 OPEN — the template defines `## Next` as "the single next action", and the sentence names only already-completed actions · base-vs-head: SPEC.md does not exist at e1d94057; commit 7b4e38f1 added the D3 line three lines above the stale `## Next` in the same file while registering the PR-open state in ROADMAP.md and docs/generated/units.md — the state fix landed in three surfaces and its sibling section kept the old truth (F51/F53 class) · smallest action: rewrite `## Next` to the actual single next action (review/merge PR #447) — route to /aw-local-apply
Advisories: 5 — 1) docs/fix/432-model-memory-tier-0/SPEC.md:47: Impact claims "its orient tiers name model memory as never tier-0", but DESIGN.md's orient tiers (Stage 2, DESIGN.md:81-93) never mention model memory — the ceiling lives in §Provenance (DESIGN.md:48-61); imprecise diff description, the rule text itself ships and is suite-pinned · 2) docs/fix/432-model-memory-tier-0/SPEC.md:164 (PE-001) and the Known-issues bullet claim "86 root suites / 86 PASS"; scripts/ carries 87 *.test.mjs at base and head (identical set, no test file added), observed head run = 87 PASS / 0 FAIL — the count does not reproduce, the green/0-FAIL substance does · 3) docs/fix/432-model-memory-tier-0/SPEC.md:71-72: the Retirements search note says the DESIGN/PLAN journal tables are the only `certainty` carriers, but the literal `rg -n certainty skills/ docs/` matches 33 files; the normative vocabulary spelling (`confirmed / inferred / unknown`) is indeed only in DESIGN.md+PLAN.md and the rest are other units' frozen ledgers (base-present) · 4) docs/LOGS.md:4588: the session entry's `Next:` still reads pre-approval — a dated append-only journal snapshot written before approval; corrections there are new entries, never edits, so the next log-session entry supersedes it · 5) the old 4-column journal shape survives in other units' frozen historical docs (docs/features/66-engram-memory-substrate/sources.md:3, docs/fix/303-investigate-orient-ask/BRIEF.md:16, docs/features/103-doc-currency/SPEC.md:156 et al.) — base-present historical evidence, no live normative surface carries it
Sibling sweep: list — blocker SPEC.md:253; advisories LOGS.md:4588 and the frozen-ledger 4-column residue; SPEC.md:125's old fragment name is accurate history about main (the rename ships only on this branch), no leftover "No fix is in flight" placeholder, live surfaces (skills/, docs/workflow/, template/, packages/) carry only the new 5-column provenance grammar, and prose-gate-inventory + docs-generate --check both resolve the new row
Completeness: S1-S5 resolved — every S# has (Implements: S#) tasks whose validators re-ran green here (knowledge-honesty suite 15/0, prose-gate-inventory PASS, budgets PASS, rg checks), S3's scriptable slice disposed in ## Future dated 2026-11-07; obligations O1-O13 all verified with re-run validators; open ids: none
Spot check: bun test scripts/knowledge-honesty-contract.test.mjs → match (reported E2: 15 pass / 0 fail; observed: 15 pass / 0 fail; base copy in scratch: 9 pass / 0 fail, red commit 17c65d12: 9 pass / 6 fail)
Verdict: NEEDS-DECISION (docs/fix/432-model-memory-tier-0/SPEC.md:253)
```

## Correction batch — 2026-11-07 (implementer side, not a verdict)

Repaired in one batch against the receipt above; the owner's external verify of
the new head is still what closes the unit.

| item | route taken | observed |
|---|---|---|
| Blocker — stale `## Next` (`SPEC.md:253`) | rewritten to the single next action: the owner's verify of this batch, then merge PR #447 | `rg -n "on approval, open the PR"` → no match |
| Advisory 1 — Impact claimed the orient tiers name model memory | the claim was made true rather than deleted: DESIGN.md's Stage 2 **tier-0** row now excludes model memory (S1's own opening sentence lives at the tier that defines `tier-0`), and the Impact bullet names both the tier-0 row and § Provenance | `sed -n '81,93p' DESIGN.md \| rg -c "model memory"` → 1 |
| Advisory 2 — `PE-001` counted 86 root suites | corrected to 87 with the correction noted in the row; `scripts/` carries 87 `*.test.mjs` at base, pre-edit head and head | `rg -n "86 (root suites\|PASS)" SPEC.md` → no match |
| Advisory 3 — Retirements' search receipt did not reproduce | replaced with `rg -ln "confirmed / inferred / unknown" skills/ template/ packages/`, which returns exactly DESIGN.md + PLAN.md; the 33-file `certainty` hit set is other units' frozen records, excluded by construction | command reproduces the claim |
| Advisory 4 — stale `Next` at `docs/LOGS.md:4588` | a NEW carrier fragment (`.agentic-workflow/journal/20261107T113150Z-feat-432-model-memory-tier-0-narrative-local.md`) supersedes it; `docs/LOGS.md` untouched — the aggregator is its only writer while the carrier is opted in | `writeFragment` ok, `parseFragmentName` ok |
| Advisory 5 — other units' frozen 4-column design records | **declined** (D4): editing another unit's frozen record is falsification, not currency; no live surface carries the old shape | — |

A gate caught what the fixture set missed: the first `## Next` rewrite carried
PR #447's URL, and `scripts/roadmap-settle.test.mjs` refused it
(`pr-url-unsettled`). Repair routed through the same fixture first — the ROADMAP
Fixes row settles to the gate's own expected form `done · [#447](…)` and the
projection is regenerated by `bun scripts/docs-generate.mjs`.
