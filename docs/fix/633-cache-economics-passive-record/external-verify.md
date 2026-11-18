# External verify — fix/633-cache-economics-passive-record

2026-11-18 · verifier run against the branch checkout at head `fb1eae45`, base `origin/main` @ `2a609bca` (merge-base; local `main` moved to `2dda53fe` after the base, three-dot diffs unaffected). No prior EXTERNAL VERIFY receipt existed for this unit (no `external-verify.md`, no LOGS entry, no PR review), so this is the full verdict, once.

```
EXTERNAL VERIFY — base: 2a609bca · head: fb1eae45
Blockers: 1 — B1: docs/fix/633-cache-economics-passive-record/SPEC.md:176 (and the recorded observation at :501) — AC-S3's declared check `rg -c 'https://' docs/fix/633-cache-economics-passive-record/SPEC.md` froze `20`; observed at head: `23`. Base-vs-head: the count measured 20 at the cut commit `1d8f8eb1`, then drifted +1 per later commit (21 at `cb984a4e`, 22 at `44673573`, 23 at head) as the unit's own Log lines and the rewritten `roadmap_summary:` appended URL-bearing lines — a `verified`/frozen outcome that no longer reproduces at the shipped head. Reproducer is bounded to this unit's own file (stability check quiet). Smallest action: re-derive the count at the shipped head and refresh AC-S3's frozen expectation through the writers (or replace the brittle total-URL count with the C-pointer count it actually proves) — route `/aw-local-apply`, never edit here.
Advisories: 3 — A1: docs/generated/units.md:211 — row 633's summary cell ends mid-sentence ("…become a") because the emitter projects only the first wrapped line of the `> One-line:` quote (scripts/docs-generate.mjs:201-228); identical artifact pre-exists on row 630 at base; generated and consistent (`docs-generate --check` PASS), cosmetic. A2: the root-suite wall-clock flake class (scripts/phase-lint.test.mjs killed by the 120s suite bound under the gate's parallel pool at this head, passing standalone and serially — disclosed in the implementer's receipt comment and the doc's Known pre-existing issues); my gate run at head was green. A3: `## Log` S10's letter says the session entry is appended to `docs/LOGS.md` before handoff; it ships as a journal fragment that `journal aggregate` folds at merge (D4) — `docs/LOGS.md` does not yet carry it at this head; established repo convention (fix/366 precedent), disclosed in the change.
Sibling sweep: clean — zero surviving mentions of the superseded row text ("Zero unit-doc ceremony": 0 hits tree-wide); both ROADMAP rows agree `done · [#637]`; no file outside the unit dir + ROADMAP + generated projection mentions the unit; `docs/passive` mechanism docs are generic, none assert the old carrier for 633.
Completeness: S1–S13 all resolved — S1–S8 → P1, S10 → P2+P3, S9/S11–S13 → P4, every (Implements: S#) present and every validator re-run green here except AC-S3's count check (B1); S4's carrier deviation closed by the dated D1 disposition (precedent verified at docs/fix/435-project-charter/decisions.md:7,20); obligations O1–O9 all `verified`, all reproduce except the AC-S3 count inside O2's evidence row (B1 names it).
Spot check: bun scripts/local-gate.mjs → PASS — 19 step(s) in 808s, exit 0 at head — match (reported G2: PASS — 19 step(s) in 902s at e8e4ec46; same step count and verdict).
Verdict: NEEDS-DECISION (B1)
```

## Command: observed result (all re-run by the verifier at head unless noted)

| Claim | Command | Observed |
|---|---|---|
| AC-S1 | `git diff --name-only main...HEAD` | 4 paths, SPEC.md listed — ok |
| AC-S2 · O1 | `rg -c '^- \*\*R[1-4]\*\* —' …/SPEC.md` | `4` — ok |
| AC-S3 · O2 | `rg -c '^- \*\*C[1-4]\*\* —' …/SPEC.md` | `4` — ok |
| AC-S3 · O2 | `rg -c 'https://' …/SPEC.md` | **`23` — mismatch against the frozen `20` (B1)** |
| AC-S4 · O3 | `git status --porcelain docs/passive` + `ls docs/passive` | empty porcelain; 3 files, none carrying 633 — ok |
| AC-S5/O4, AC-S6/O5, AC-S7/O6 | the three declared `git diff \| rg …` checks | zero out-of-set paths — ok |
| AC-S9 · O7 | `bun scripts/local-gate.mjs` | **PASS — 19 step(s) in 808s, exit 0 at `fb1eae45`** |
| AC-S10 · O8 | `roadmap check` / `docs-generate --check` / `journal aggregate --check` | PASS 0 violations / PASS 0·0·0 / `{"ok":true,"checked":81,"refusals":[]}` — ok |
| AC-S11 · O9a | `rg -c '\| (planned\|in-progress\|deferred) \|' …/SPEC.md` | 0 matches — ok |
| AC-S12 | `rg -c '^- \*\*(F\|V)[0-9]+\*\*' …/SPEC.md` | 0 matches — ok |
| AC-S13 · O9b | `gh pr view fix/633-cache-economics-passive-record --json url,state,baseRefName,body` | OPEN, base `main`, body carries `Closes #633` — ok |
| P1 validator | `agentic-workflow phase-lint …/SPEC.md` | verdict PASS, 4/4 phases — ok |
| E12 validator | `bun scripts/roadmap-settle.mjs` | PASS, 0 violations — ok |
| E2 re-run | `bun scripts/test-impact.mjs --base main` | verdict `empty`, executable 0 — ok |
| E3 re-run | `ceremony tier classify --paths …` | `tier: passive`, `reason_kind: no-executable-effect` — ok |
| E1 re-run | `gh issue view 633` | OPEN, label `documentation` — ok |

## Source probes (own probes, not the change's receipts)

- **C1** — platform.claude.com prompt-caching fetched 2026-11-18: 5-min-TTL write 1.25×, 1-hour write 2×, read 0.1× with per-model exceptions; default minimum lifetime 5 minutes; exceptions verbatim (0.025× Fable 5.2/Mythos 5.2/Fable 5.1/Mythos 5.1, 0.05× Opus 5.5/Sonnet 5.5). Every figure C1 states reproduces.
- **C2** — morphllm.com/prompt-caching fetched 2026-11-18: 30-turn worked example with 20k byte-identical prefix + 1,500/turn → 1,252,500 prompt tokens; measured table: Claude Code 182 messages ~100% (136,640 vs 677), qwen-code 131 messages 80% (75,072 vs 18,489); "30-turn agent session saving at 90% hits: 71%". All reproduce; the $0.459/$1.58 row sits beyond the extracted chunk and is arithmetically consistent with the confirmed 71%.
- **C3** — arXiv 2312.07104 abstract fetched 2026-11-18: "up to 6.4x higher throughput compared to state-of-the-art inference systems"; no production hit-rate figure. D2's divergence disclosure (issue's "52–74% hit rates, up to 5x" not in the source) is accurate.
- **C4** — cognition.ai/blog/dont-build-multi-agents fetched 2026-11-18: single-threaded linear agent; subagent "usually only tasked with answering a question, not writing any code". Reproduces.

## Verifier notes

- Read-only discipline held: no commit, no push, no branch, no forge write, no edit to reviewed bytes. The only tree writes were the gate's own gitignored `dist/` rebuild (its declared normal operation) and this receipt file (untracked).
- The carrier deviation from issue #633's AC-1/AC-3 is disclosed in four surfaces (Impact, D1, Next, PR body) and grounded in the owner's standing instruction + the verified 435-D1 precedent — not silently ignored, therefore not a blocker; it stays visible as the unit doc's "Open by design".
- Contract-text qualifier check: the diff touches no SKILL.md, skill reference, AGENTS.md or normative block — n/a. The ROADMAP row rewrite's dropped qualifier ("Zero unit-doc ceremony") is the disclosed carrier change itself, not a lost scope guard.
- S5 doctrine probe: R1–R4 are conversation-shape claims; the record explicitly preserves the turn contract's boxes, per-phase commits and gates; no contradicting rule found in `skills/orchestration-envelope/references/TURN_CONTRACT.md` or the risk-tier docs.

## Apply — correction batch 1 (2026-11-18)

Ordered by the owner against this receipt; one batch, §9 bounds, blockers only.

- **B1 — folded**: AC-S3's frozen total-URL count (froze `20`, observed `23`) replaced by the distinct-source count of the four canonical URLs (`rg -o … | sort -u | wc -l`, prints `4`, cannot drift as the append-only `## Log` grows) — commit `f88e2a47`. Unit doc: `D5` carries the fold disposition and the advisories' triage, `E6` a dated supersession note (never a silent rewrite), `E13` the recheck, `G3` the gate receipt.
- **A1 — not fixed here**: the emitter's `One-line:` projection truncates row 633's generated summary cell; pre-existing at base (row 630 shows the same artifact) and an emitter change is outside this unit's S6. Owner's call — a separate unit owns `scripts/docs-generate.mjs`'s summary chain.
- **A2 — no action**: pre-existing wall-clock flake class, recorded in the unit doc's `## Known pre-existing issues`.
- **A3 — no action**: disclosed journal-fragment convention (S10's letter vs D4).

Recheck after the batch (blockers only, run by the implementer — not a re-verify):
AC-S3's repaired check → `4`; the C-pointer count → `4`; the planned/in-progress/deferred
sweep → 0; the F/V-line sweep → 0; phase-lint PASS 4/4; roadmap check PASS 0;
roadmap-settle PASS 0; docs-generate --check PASS; journal aggregate --check ok;
test-impact `empty`; `bun scripts/local-gate.mjs` → PASS — 19 step(s) in 530s at
`f88e2a47` (`G3`). The verdict above stands as the owner's to re-adjudicate; this
addendum records the apply, not a new verdict.
