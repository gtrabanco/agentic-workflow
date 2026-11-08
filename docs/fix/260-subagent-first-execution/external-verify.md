# External verify — fix/260-subagent-first-execution

Date: 2026-11-08 · base `dde38321` (`origin/main`) · head `86bfa163` · first receipt
for this unit (no prior `EXTERNAL VERIFY` block anywhere in the unit dir → full
verdict, once). Tree clean at run time; free-text intent: none (full target).
Disclosures: `bun scripts/local-gate.mjs` was re-run end-to-end here (exit 0,
`PASS — 13 step(s) in 205s`; tree clean afterwards — its generator steps write
only gitignored build output); the change's own mutation-capable paths
(`resources admit --record-dir`, `resources check`) ran only against
`mktemp -d` scratch receipts, and the AC7 differential ran against `git archive`
copies of base and head in `mktemp -d` scratch with symlinked `node_modules`
(both removed after) — `verify`, `resources detect` and `resources bound` are
print-only; `bun install` (AC2) ran as declared (exit 0, no changes). No
live-tree mutation, no commit, no branch, no forge mutation — this receipt file
is the only write.

```
EXTERNAL VERIFY — base: dde38321 · head: 86bfa163
Blockers: 4 —
  1. packages/agentic-workflow/README.md:27 (+ the Commands table, README.md:24-50) · reproducer: `rg -n "usage: agentic-workflow <" packages/agentic-workflow/README.md packages/agentic-workflow/bin/agentic-workflow.mjs` → README prints `<…|journal|resolve-passes>` while the bin prints `<…|journal|resolve-passes|verify|resources>`, and the README's Commands table has no row for `verify` or `resources` (`rg -n '^\| `(verify|resources)' packages/agentic-workflow/README.md` → 0 matches) · base-vs-head: at `dde38321` the two usage lines are byte-identical (`git show dde38321:` of both files), and the README is untouched by this diff (`git diff --name-only 5999ea9d..HEAD` has no `packages/agentic-workflow/README.md`) — the bin's usage was rewritten here and its sibling copy kept the old truth (F51/F53 class; #201's precedent added its README row when it added `resolve-passes`); stability: fires only on this README↔bin pair, quiet on the bin itself and every other usage copy · smallest action: add `|verify|resources` to the README usage line and one Commands row per new subcommand → /aw-local-apply
  2. docs/fix/260-subagent-first-execution/SPEC.md:228 (AC1, echoed by P6's validator at SPEC.md:277) · reproducer: `rg -n "never executes|orchestrate" skills/unit-lane/SKILL.md skills/execute-phase/SKILL.md` → 2 matches in unit-lane (:215,:220), **0 matches in execute-phase/SKILL.md** (only the capitalised `Orchestrate` at :155) → the AC's own "≥1 match each" fails, so P6's "AC1 rg anchors match" does not re-run green · base-vs-head: both files at `dde38321` score 0 on the same pattern and the SPEC itself is absent at base (new claim in this diff); the content AC1 asks for does exist (execute-phase:150-161 carries the brief + verify-by-running contract) — only the declared anchor cannot match; stability: fires only on this anchor pair · smallest action: re-point the anchor at the shipped prose (e.g. `Orchestrate path|non-executing`) or carry the phrase in execute-phase's paragraph → /aw-local-apply
  3. docs/fix/260-subagent-first-execution/planning-obligations.md:10 (O1, status `verified — E4`) · reproducer: O1's stated validator `rg -n "never executes" skills/unit-lane/SKILL.md skills/execute-phase/SKILL.md` → 0 matches, exit 1 — the phrase appears in neither file in any committed revision (`git log -S "never executes" -- skills/unit-lane/SKILL.md skills/execute-phase/SKILL.md` → empty) — so the row's "≥1 match each" outcome does not reproduce at head · base-vs-head: the row and the prose are new in this diff (no counterpart at `dde38321`); obligations-closure rule: a `verified` whose stated outcome no longer reproduces is a blocker naming the id · smallest action: re-word O1's validator cell to an anchor that reproduces here and re-stamp its evidence cell → /aw-local-apply
  4. packages/agentic-workflow/bin/agentic-workflow.mjs:518-519 (+ :566, comment :500) · reproducer: `bun packages/agentic-workflow/bin/agentic-workflow.mjs resources bound --task t --cmd "node x.js" --json` → accepted, exit 0, prints the two plain systemd lines with no JSON and no diagnostic — `--json` is silently ignored with success on this subcommand, while the parser comment claims "the receipt is always JSON" (false for `bound`; `detect`/`admit`/`check` honor the flag because their output is always JSON) · base-vs-head: `resources` does not exist at `dde38321` (new surface), so the defect is change-caused by construction; stability: fires only through the new `bound` path · smallest action: refuse `--json` for `bound` (or emit a JSON receipt for it) and correct the comment → /aw-local-apply
Advisories: 4 —
  1. packages/agentic-workflow/src/resources/admit.mjs:40,:113 — a malformed `--expect` requirement (unit outside `GB|MB|KB`, e.g. `"999 TB"`, or an unknown `requirements` key) throws a plain Error past the CLI's `ResourcesError` catch (bin:594) → stack trace, exit 1 instead of a `RESOURCES REFUSAL` exit 2. Advisory: out-of-domain input — the grammar is documented as `<n> GB|MB|KB` and the module header declares a malformed expect a caller bug; the in-domain over-cap path refuses correctly (exit 2, receipt names requirement vs cap).
  2. packages/agentic-workflow/bin/agentic-workflow.mjs:515 — the shared flag parser accepts every subcommand's value flags anywhere (`resources detect --task x` → exit 0, flag dropped). Advisory: cross-subcommand invocation is out-of-domain per the per-subcommand usage strings, and every flag on its own subcommand's path is honored (except blocker 4's `--json` on `bound`).
  3. docs/fix/260-subagent-first-execution/planning-evidence.md:11 (PE-004) — "the runner crate has no `verify` and no `resources` subcommand today", freshness `current`: false at head. Advisory: provenance-anchored cut-time evidence (its source names base `HEAD 203a9875`), a planning-time record rather than an operational surface.
  4. docs/fix/260-subagent-first-execution/planning-evidence.md:14 (PE-007) — "the strict config validator roots are exactly `default, …, passes`", freshness `current`: this very unit added `subagents`, so the enumeration is now incomplete. Advisory: same cut-time ledger nature; the citation `schema.ts:43-57` still points at the roots list — the freshness label could be dated to the cut.
Sibling sweep: list — blocker 1 is the only operational surface still teaching the pre-change truth; advisories 3-4 are cut-time ledger rows. Everything else clean: `rg -c "one manual .?/execute-phase" docs/ROADMAP.md` → 0 and row 68's absorbed-gap prose is byte-identical to base, framed "the topology change is the fix … resolve it by design", with the status cell re-cut by the emitter to `in-progress · carried by fix #260` and the `## Fixes` row `#260 · done · #467` present; no surviving "init-workspace does not offer the `subagents` key" claim outside the SPEC's verbatim S11 quote and historical LOGS entries (BOOTSTRAP_WRITE:91 and UPGRADE:100 both match); the pi package README documents piew 6.3.0 + the disable knob and `package.json`'s `pi.extensions` registers only `./node_modules/pi-extensible-workflows/dist/subagents/index.js` (engine/starter/trajectory absent, install exits 0); `docs/fix/README.md` defers the fix index to ROADMAP's `## Fixes` table (row present); `docs/CAPABILITIES.md` enumerates no crate subcommands (no prior unit added rows either); no surviving "crate has no verify subcommand" claim outside the provenance-anchored PE-004.
Completeness: S1–S11 all resolve to tasks carrying `(Implements: S#)` with validators that re-ran green here — AC2 pin/install/extensions, AC3 detect envelope + forced-low `serial`, AC4 admit refusals/anti-retry (exit 2 each), AC5 pi suite 648 pass, AC6 verify PASS on the 201 doc + fixture suites (12 pass: missing section, unclosed obligations, fabricated/future receipt), AC7 differential SAME ×4 (modulo the `journal name` clock second) + gate exit 0, AC8 Engram observation 2577 present (`mem_context` shows the unit-boundary record), AC9 roadmap check PASS 0 violations + changeset + conventional commits + PR #467 open (base `main`), AC10 resources suite 27 pass + foreground within/over/unmeasurable/bound-killed/unknown-trial/pid, AC11 bootstrap rg ≥1 each + budgets PASS; P1 triage exit 0; O2–O10, O13–O17 each re-ran green (red-first SHAs b3322a6c/3718268b/98bef6b2/71e501a8/41609259 all ancestors; skill-lint PASS; budgets PASS 29 skills / 14 routes); recorded dispositions: S11 edge 1 `open` (Future, receipt-neutrality — O17 reproduces) and S11 edge 3 (process on PR #467) — | open ids: S2, S3 (via P6's AC1 anchor, blocker 2, and O1, blocker 3).
Spot check: `bun test packages/agentic-workflow/test/resources.test.mjs` → match (exit 0 · 27 pass · 0 fail, equals the reported P14/O15 "27 pass"; the unit's other reported figures also matched on re-run: verify 12 pass, pi 648 pass, `local-gate` PASS 13 steps, budgets PASS 29/14, roadmap check PASS 0 violations).
Verdict: NEEDS-DECISION (4 open blockers: packages/agentic-workflow/README.md:27 · docs/fix/260-subagent-first-execution/SPEC.md:228 · docs/fix/260-subagent-first-execution/planning-obligations.md:10 · packages/agentic-workflow/bin/agentic-workflow.mjs:518)
```

No fix beyond naming the blocker and the smallest action; corrections belong to
`/aw-local-apply` under its own correction bounds (one batch → one blockers-only
recheck → a second only if the same blocker persists → `Needs your decision`).

## Addendum — correction batch (2026-11-08, owner order; the block above stays verbatim)

Owner request, verbatim: "Verify the findings are legit, if they are legit
undestand full the context of the finding, undestand why it is failing, make a
plan and check how to fix it, make sure the fix doesnt break another thing if
it beaks another thing just make some workaround to fix and avoid break a
context (symbol) of anything by full fixing."

All four blockers were re-verified against the tree before any edit (each
reproduced), then repaired in one batch; every reproducer is now a test.

| finding | root cause (understood, not guessed) | repair | re-check at head |
|---|---|---|---|
| Blocker 1 · `packages/agentic-workflow/README.md:27` | the bin's usage string was rewritten when `verify`/`resources` landed and the README — the command surface's owner — was never updated; no test compared them | README usage line + one Commands row per subcommand (contract ids, refusal vocabulary, the `bound` `--json` rule), pi README's resource bullet gains `check`/`bound`, and a parity suite pins the two surfaces | `bun test test/cli.surface.test.mjs` → 2 pass; the usage lines are byte-identical; 2 new rows |
| Blocker 2 · `SPEC.md:228` (AC1) | the anchor named `never executes`, a phrase the prose never carried (`git log -S` → empty); `execute-phase` writes "**Orchestrate path**", both skills write "never by trusting the summary". Written from intent, never run at cut time | AC1 re-pointed at the shipped sentences; **no skill prose edited** — no budget moved, no wording contorted to satisfy a registry string | `rg -ni "orchestrate mode\|orchestrate path"` → 1 each; `rg -n "never by trusting"` → 1 each |
| Blocker 3 · `planning-obligations.md:10` (O1) | same mis-specified anchor, recorded `verified` from an unrun grep | O1's validator re-pointed to the two shipped anchors; evidence re-stamped (E4 + E15, the foreground re-run) | both anchors → 1 match each; budgets PASS 29 |
| Blocker 4 · `bin/agentic-workflow.mjs:518` | the shared `--json` branch accepted the flag for every subcommand; `bound` prints the shell envelope, so the flag was swallowed by a "the receipt is always JSON" comment that was false | `bound` refuses `--json` with `RESOURCES REFUSAL` exit 2 (no invented JSON contract); the comment now names detect/admit/check | `resources bound … --json` → exit 2, nothing on stdout |
| Advisory 1 · `src/resources/admit.mjs:40` | admit's shape errors were plain `Error`, so the CLI's `ResourcesError` mapping let them escape as a Bun stack trace | the shape throws are typed `ResourcesError` (reused, no new class); the module contract still throws, the CLI boundary refuses | `admit --expect '{"…":"999 TB"}'` → exit 2 `RESOURCES REFUSAL`; CLI test covers 5 shapes |
| Advisories 3-4 · `planning-evidence.md:11,14` | cut-time rows labelled `current` describe the pre-change state | freshness dated `at cut (base 203a9875)` / `at cut (this unit adds subagents)` | 2 dated rows |

Advisory 2 (the shared parser accepts another subcommand's value flags) is left
as accepted behaviour: it is out-of-domain input, accepts more rather than
misreporting, and refusing it would break the documented caps reuse.

Evidence: red `e3bb8dfe` (5 reproducers failing) → green `a1465075`; crate
suite 534 pass · 0 fail; differential vs `git archive 86bfa163` SAME on
`resources detect/admit/bound`, `verify`, `resolve-passes` after normalizing the
live `MemAvailable` reading and the echoed tree path; `verify` on this SPEC →
VERIFY PASS; `roadmap check` → 0 violations; `skill-lint` PASS; budgets PASS.

Delta state for the next run: the four blockers above are closed at head; the
new surface is the parity suite (`test/cli.surface.test.mjs`) and obligation
O18 (README/CLI surface parity, `verified`).
