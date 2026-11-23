# External verify — 2026-11-22

Full verdict, once: no prior `EXTERNAL VERIFY` block or review verdict existed in
this unit dir (only `SPEC.md` + `decisions.md`), so this is the first receipt and
no delta applied. Read-only run — no commit, no push, no branch, no file edit
beyond this receipt, no forge mutation (`gh` used read-only for `pr view`).
Unproven mutation paths never ran against the live tree: the base-side
differential used `git archive origin/main` into a `mktemp -d` scratch with
symlinked `node_modules` and its own `tsc` build, and every behavioral probe ran
against scratch projects under `/tmp` (`mktemp`), all removed after the run.

EXTERNAL VERIFY — base: 3e0ec51d839d8eb9d26356e0f8ac5aefbba70a9f · head: a3d304a1386d3476afc70c339570d453820ec5da
Blockers: 1 — `docs/ROADMAP.md:231` × `docs/fix/690-telemetry-attr/SPEC.md:412`: `scripts/roadmap-settle.test.mjs`'s live-tree red carries a second, change-caused violation — `docs/fix/690-telemetry-attr/SPEC.md:412 pr-url-unsettled — doc carries its PR URL (Log); row status is 'in-progress' — expected 'done · [#692]'`. Reproducer: `bun test scripts/roadmap-settle.test.mjs` at head → exit 1, `violations: 2` (the assertion output names this unit's file). Base-vs-head: base tree (`git archive origin/main` in mktemp) → `violations: 1` (feature-98 only); at G5's own stated HEAD `3b644e90a` the SPEC carried 0 occurrences of `#692`; the URL entered at `a3d304a13` (0 → 2) with no settle re-run, and the push-time commits (`eef874a06`, `0e29e89bf`) carried 0, so the PR body's escape-hatch record was true when written. Sibling faces of the same root (one settle repairs all): `SPEC.md:196-214` asserts the red is "one violation, inherited from `main`" (false at head), and both journal fragments (`.agentic-workflow/journal/20261122T220653Z-…:6`, `20261122T223136Z-…:4-6`) narrate "one red from main / feature-98-only" (false at head). Smallest action: settle the 690 fix row's Status to `done · [#692]` — the value the gate itself expects — through the roadmap row writer, then re-run `bun test scripts/roadmap-settle.test.mjs` (expect only the feature-98 violation), which makes the known-issue paragraph and both journal narrations true again → /aw-local-apply.
Advisories: 6 — (1) `docs/fix/690-telemetry-attr/SPEC.md:401` (Log E5): reports `bun test test/session-telemetry.test.mjs test/telemetry-wiring.test.mjs` → `47 pass`; observed `46 pass, 0 fail, exit 0` (24 + 22 per file; G4's own `81 pass` for the four suites implies 46). Why advisory: text-only receipt count; every obligation validator re-runs green, the receipt's green direction reproduces, no status flips; the same garbled-receipt class graded advisory in the 509 receipt. Smallest action: append a dated erratum line (append-only log contract). (2) `SPEC.md:407` (Log G3): reports "those nine ran in the foreground · exit 0 · 145 pass"; the nine paths reproduce as `exit 0 · 153 pass, 0 fail` (bun skips the JSON fixture; 145 = the set minus skill-parity's 8). Why advisory: the verdict half matches exactly (`targeted`, 9 executable, 1 symbol, 9 suites, exit 0) and all nine suites are green; only the count is unreproducible. Smallest action: same erratum. (3) `SPEC.md:279-281` (O5/O6/O7 required-evidence): the three cells cite `## Log E4` (the shipped-adapter receipt, 29 pass) but the named assertions live in E5's run. Why advisory: each row's validator re-runs green here and the named assertions pass — closure holds on the validator; only the receipt pointer is wrong. Smallest action: repoint the three cells to `E5`. (4) `packages/pi-agentic-workflow/README.md:930`: "a sensor … is noted for the phase it sets" — the deferred `agentic_workflow_status` spawns `workflow-status --json-only` through `runSensor` with no attribution door (D3), so that path is never noted and sets no phase; the sentence holds only for a sensor dispatched through the runner door. Why advisory: the operative claim (produces no sample) is true and the non-unit probe confirms no row; one clause of new prose. Smallest action: qualify the example. (5) `docs/fix/690-telemetry-attr/decisions.md:36` (D3, same wording in the SPEC Log D3): "None of them runs a `UNIT_COMMANDS` subcommand" is literally false — the status tool's sensor spawns `workflow-status`, which is in `UNIT_COMMANDS` (PE-003 says so itself). Why advisory: the decision stands — the status tool takes no parameters (`additionalProperties: false`, no properties), so no invocation it runs can name a unit; only the rationale's wording contradicts the unit's own evidence. Smallest action: reword to "none runs a unit-scoped invocation". (6) `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:714-716`: the runnerRunSpec doc says a seam failure "is reported by its own owner", but the execute body's bare `catch` swallows a throwing `onRunnerCommand` and nothing reports it (the wiring's report covers sink failures, not seam throws). Why advisory: source-comment prose; the tested contract (the run survives, AC-S2) holds and S3 asks only for sink reporting. Smallest action: drop the clause.
Sibling sweep: list — the three blocker-1 faces above (known-issue "one violation", both journal fragments "one red from main"); otherwise clean: no surviving claim that sink failures are silent (`session-telemetry.ts:29` now states the opposite; the `catch {}` mentions are the frozen issue quote, PE-005 base-state evidence and test comments), no surviving `resolve(relative, root)` claim (PE-011/D7 are base-state records; `index.ts:504` documents the fix), no surviving single-door attribution claim in live docs (PE-001 and L2 are base-state/verbatim quote; the roadmap row says "had exactly one door" in past tense), `docs/workflow/TIER_COST.md` untouched, the README's pre-existing opening sentence now holds for both named doors (skill commands register through `toRegistrar`, factory.ts:179), and the PR body's escape-hatch record was accurate at push time.
Completeness: S1, S2, S3 resolved — P1–P5 all carry `(Implements: S#)` and their validators re-ran green here: attribution `6 pass/exit 0` (E3), wiring `22/0`, session `24/0`, shipped-adapter `29/0` (E4), `bun run test` `1055 pass / 91 files / exit 0` (E6), `docs-generate --check` PASS exit 0 (E7/G6); P1's red corpus is gate-validated by `red-first` inside the root suite. Obligations O1–O10: all `verified`, every validator re-runs green here (per the runs above plus `check-skill-context --documents` exit 0 with the README measuring exactly 1324/17944 — D8's exact-measurement claim ✓ — `check-skill-context` exit 0 · 30 skills, `test-obligation-tags --root .` exit 0 · 140 suites · 0 findings); no planned/in-progress/blank/deferred row; advisory 3 covers the three wrong E-pointers. Open ids: none.
Spot check: `bun run test` in `packages/pi-agentic-workflow` (Log E6) → match — observed exit 0 · 1055 pass · 0 fail · 91 files, equal to the reported output (E5 and G3 do not reproduce — advisories 1-2).
Verdict: NEEDS-DECISION (1 open blocker)

## Evidence detail

### Declared commands — `command: observed result`

| command | observed |
|---|---|
| `bun test test/telemetry-attribution.test.mjs` (package dir) | exit 0 · 6 pass · 0 fail (= E3) |
| `bun test test/session-telemetry.test.mjs test/telemetry-wiring.test.mjs` | exit 0 · **46** pass · 0 fail (E5 says 47 → advisory 1); per file 24 + 22 |
| `bun test test/shipped-adapter.test.mjs` | exit 0 · 29 pass · 0 fail (= E4) |
| `bun run test` (packages/pi-agentic-workflow) | exit 0 · 1055 pass · 0 fail · 91 files (= E6, spot check) |
| `bun scripts/docs-generate.mjs --check` | exit 0 · PASS · 3 files · 0 stale (= E7/G6) |
| `bun scripts/check-skill-context.mjs --documents` | exit 0 · PASS · 7 documents; README row `1324 / 17944` (exact re-pin ✓) |
| `bun scripts/check-skill-context.mjs` | exit 0 · PASS · 30 skills |
| `bun scripts/test-obligation-tags.mjs --root .` | exit 0 · 140 suites · 0 findings · PASS (= G6) |
| `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/690-telemetry-attr/SPEC.md` | exit 0 · PASS 6/6 for P1–P5 (= G1) |
| `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/690-telemetry-attr/SPEC.md` | exit 0 · `ok: true` · 7 checks · no violations (= G2) |
| `bun scripts/test-impact.mjs --base origin/main` | exit 0 · `targeted` · 9 executable · 1 symbol · 9 suites (verdict half of G3 ✓); the nine paths as one `bun test` → exit 0 · **153** pass · 0 fail (G3's 145 → advisory 2) |
| `bun scripts/run-root-suite.mjs` | exit 1 · 140 suites · 139 PASS · 1 FAIL `scripts/roadmap-settle.test.mjs` (= G5's counts); the FAIL message at head carries **two** violations → blocker 1 |
| `bun test scripts/roadmap-settle.test.mjs` (head) | exit 1 · `violations: 2` — feature-98 slug-mismatch + `docs/fix/690-telemetry-attr/SPEC.md:412 pr-url-unsettled` |
| same, base tree in mktemp scratch | `violations: 1` — feature-98 slug-mismatch only |
| `bun packages/agentic-workflow/bin/agentic-workflow.mjs diff-guard --base origin/main` | exit 1 · BREACH `1232 > 400 · 17 > 8` (G7 recorded 1210/15 at its stated HEAD `3b644e90a`; SHA-bound match at that sha — the three later docs commits are the delta) |
| `gh pr view 692` (read-only) | OPEN · MERGEABLE · CLEAN (journal "MERGEABLE/CLEAN" claim ✓) |

### Independent probes (derived from S1–S3 wording, not the shipped tests)

Head (`a3d304a13`) vs base (`3e0ec51d8`, built in mktemp scratch), same harness
(`/tmp` scratch projects, fake runner recording `argv` + `AG_WF_PHASE`, shipped
entry, own assertions):

| observable | base | head |
|---|---|---|
| runner spawn argv (real spawn path) | `["execute-phase","690","P2"]` | `["execute-phase","690","P2"]` |
| `AG_WF_PHASE` at spawn | untouched (inherited value) | `execute-phase` — seam ran before the spawn (O4/S2) |
| JSONL line at `<project>/.pi/.telemetry/sessions.jsonl` | absent | 1 line, `unit: 690-telemetry-attr`, `source: pi:session=…` (S1/O10) |
| `TIER_COST.md` row for the session | absent | present with `pi:session=` (S1) |
| refusing ledger → operator notify, 2 settle cycles | 0 (silent) | exactly 1, names `tier-cost-ledger` + the writer's reason, kind `warning` (S3/O5) |
| healthy sink alongside a refusing one | 2 samples (rule kept) | 2 samples (D5 preserved) |
| wiring with no channel → stderr default | 0 lines (silent) | 1 line across 2 cycles, sink + reason (O6) |
| non-unit subcommand (`roadmap read`) | no rows | no rows, run exit 0 (O3) |

Disclosure: the probe process inherited `AG_WF_PHASE=batch-scheduler` from this
session's environment; the base run left it untouched (no door), the head run
overwrote it with the subcommand's label — the head-side O4 claim is proven
regardless. `node` invocation of the probe was refused by the repo's invocation
guard (sanctioned runtime), so the probe ran under `bun`; no live-tree mutation
in any probe.

## Addendum — 2026-11-22 — correction batch (owner order)

Owner instruction, verbatim: "Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff"

Resolved as fix-findings against this receipt: 1 blocker + 6 advisories triaged; all 7 deserved the fix (each is a change-caused text/ledger/gate defect with a named smallest action), all folded in `41e5a389c` with the unit Log's `F1`–`F4` lines as the fold record. **Blockers: 1 → 0** — the verdict above stands as the pre-batch state; this batch awaits the owner's blockers-only recheck (§9).

- **Blocker 1 folded (F1)** — the 690 fix row's Status is now `done · [#692](https://github.com/gtrabanco/agentic-workflow/pull/692)` (written by `agentic-workflow roadmap fixrow` with `--expect` CAS after a `mktemp` rehearsal proved a partial payload empties Topic/Notes; the live diff is the Status cell only). Recheck: `bun scripts/roadmap-settle.mjs` → exit 1, `violations: 1` — feature-98 only, byte-identical to base; `bun scripts/run-root-suite.mjs` → 139 PASS / 1 FAIL, the pre-batch baseline, and the failing assertion now prints only the feature-98 slug-mismatch. `docs/generated/units.md` re-rendered by `bun scripts/docs-generate.mjs` (status cell only).
- **Advisories 1–2 folded (F2)** — superseding counts recorded in F2 (46 and 153, both exit 0); E5/G3 lines untouched per `log-kind@1` append-only.
- **Advisory 3 folded (F3)** — O5/O6/O7 required-evidence repointed to `E5`; validators re-ran green: `bun test test/telemetry-wiring.test.mjs` → 22/0 exit 0, `bun test test/session-telemetry.test.mjs` → 24/0 exit 0; statuses stay `verified`.
- **Advisories 4–6 folded (F4)** — README sentence fixed (sensor example dropped), `decisions.md` D3 reworded (the SPEC Log's D3 claim corrected by F4, append-only), runnerRunSpec comment clause dropped. The README edit moved the estimate (17944 → 17942), so `SKILL_CONTEXT_BUDGETS.json` was re-pinned to the exact re-measurement with the reason recorded (D8's rule).
- **S2 not-broken sweep (foreground)** — `bun run test` in `packages/pi-agentic-workflow` → exit 0 · 1055 pass / 91 files; test-impact nine suites → exit 0 · 153 pass / 0 fail; `docs-generate --check` → exit 0; `check-skill-context --documents` and `check-skill-context` → exit 0; `verify` → exit 0 `ok: true`; `phase-lint` → exit 0 PASS 6/6 (fingerprints unchanged); `test-obligation-tags --root .` → exit 0 · 140 suites · 0 findings; root suite baseline 139/1 unchanged (the one red is main's feature-98 row, untouched).
- **Disclosures** — the fixture rehearsal's empty-argument incident produced a junk `| undefined |` row only in the discarded `mktemp` copy (cleaned); no live-tree side effect beyond the declared writes. No obligation status changed; no `S#` reopens.
- **Concurrent-commit disclosure** — `fb847877a` (the apply session's own `docs(log):` commit, dated 22:31:38) landed on this branch mid-verification, after the receipt's `head:` pin `a3d304a13` was taken and before this batch's first commit; it adds one journal fragment file and nothing else, so every measurement above holds for both heads (the 509 receipt's mid-run-commit class).
