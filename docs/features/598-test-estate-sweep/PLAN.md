# #598 — Test-estate sweep: per-suite verdicts + measured speedup

## Origin

Issue [#598](https://github.com/gtrabanco/agentic-workflow/issues/598).

## What's wrong

Two owner observations (2026-11-16), both about the repo's own test estate:

1. **Volume**: "Tengo la sensación que probamos demasiadas cosas" — ~114 root suites carry no recorded justification per suite. The criteria and evidence standard now exist (#595, #596), but applying them to the **current** tree is its own unit and should not wait for the tag surface to be designed and shipped.
2. **Cost**: "No podemos esperar 7 minutos para hacer un git push." The pre-push hook runs the gate's offline subset, and the root suite dominates it: measured on a 6-CPU host, a single suite takes 23–35 s alone and 67 s beside competing suites (phase-lint, LOGS.md evidence), the root-suite step crosses the runner's 120 s bound under the worker pool, and `--bail` then kills in-flight suites (unit 487's session reproduced it twice). A targeted push runs the full gate; the wall-clock per change class that #364 demanded was never measured.

The science for both halves is already gathered (TDAD arXiv 2603.17973: running irrelevant tests per change increases regressions AND cost; Inozemtseva & Holmes 2014: coverage ≠ effectiveness; Zhang & Mesbah 2015: obligations = value; Elbaum et al.: prioritize by expected fault-detection value; Rothermel et al. 1998/2004: never delete on line-coverage evidence alone).

## Expected behaviour

1. **Per-suite inventory + verdict.** For every root suite (and both packages' suites): the surface(s) it protects, the obligation class (#596's vocabulary, applied early — one line beside the suite), and a verdict per owner rule: keep / merge / delete, with evidence. Expected deletion classes, from the criteria:
   - tests asserting surfaces that no longer exist (dead-surface — the gentle-ai #4120 analog: their sweep found 78 dead clusters incl. ~20 orphan test helpers, i.e. tests deleted and helpers left behind);
   - obligation-level duplicates (same asserted behavior on the same surface — keep **one** survivor per owner rule 2026-11-16; merge or delete the rest);
   - cost-over-risk tests (asserting constants/strings the risk-based standard does not justify; e.g. verifying a literal heading string vs verifying a complex calculation).
2. **Deletion discipline on the sweep itself**: every deletion cites its ground and evidence in the unit doc; deletions land as their own commits; nothing is deleted to make a red suite green; the boundary deletion ≠ weakening (TESTS.md) applies. Deletion on this unit requires the plan to mark each deletion (execute-phase's planned-deletion authority, #597).
3. **Speed work — measured, not vibes.** The wall-clock per change class (docs-only / script change / package change) is measured **before and after** this unit (#364's point 4, owner-requested inclusion). Then, in impact order:
   - the slowest suites get a per-suite wall-clock budget and a reduction pass (merge redundant fixtures, share setup, remove repeated full-tree rebuilds where a fixture suffices);
   - the pre-push offline subset gets a budget: the hook must return in a bounded time on a typical push, with the measured before/after recorded;
   - runner-level wins first (already bun-first; pool sizing, suite isolation costs) before any test is touched — speed must never come from weakening or deleting a needed guard.
4. **The speed/deletion link is explicit**: deleting obligation-duplicates also speeds the suite, but a test that must stay does not get relaxed for speed — its cost is reduced (fixtures, parallelism, budgets), never its assertions.
5. **Record the baseline** so future units compare: per-suite cost table committed (or emitted) as part of the unit's evidence; the #596 sweep and the tag gate inherit it.

## Where

- Every root suite touched by a verdict (`scripts/*.test.mjs`, both `packages/*/test`)
- `scripts/local-gate.mjs` / `scripts/run-root-suite.mjs` — budgets, pool tuning, measured timings
- `docs/workflow/GATE_INVENTORY.md` — the budget rows
- The unit doc's Evidence — inventory, verdicts, deletion grounds, before/after wall-clock
- `.changeset/`, roadmap row (new unit), budget manifests

## Non-goals

- No weakening, emptying, or skipping of assertions for speed — cost reduction changes how a test runs, never what it proves.
- No deletion without the evidence standard (dead-surface / obligation-duplicate / cost-over-risk) recorded per deletion.
- No exhaustive mutation sweep — selective kill-rate only where a merge/delete verdict is contested.
- No decision-model dependency; the substrate's future role stays recorded in #444.
- No new skill surface — this unit applies existing criteria to this repository (a dogfooding application unit of #595/#596's standards).