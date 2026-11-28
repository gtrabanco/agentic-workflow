# Review-on-slices A/B — measured on the units the issue cites (2026-11-28)

Owner-directed research session answering one directional question for
[issue #753](https://github.com/gtrabanco/agentic-workflow/issues/753)
(review-on-slices / `review_due`): **does reviewing pending change slices at
task boundaries beat one monolithic review of the accumulated branch, and does
the advantage survive as reviewer-model strength grows?** #753's acceptance
sketch demands "a measured A/B or a shadow verdict before enforcement"; this
session ran the first measurement. The counts live in
[results/arm-summary.md](results/arm-summary.md), the per-call table in
[results/all-calls.csv](results/all-calls.csv), the reusable harness in
[harness/](harness/), reproduction and salvage notes in
[VERIFICATION.md](VERIFICATION.md), and the external-record reading in
[external-evidence.md](external-evidence.md).

## What was run

Two ground-truth units — the two the issue itself cites as its evidence
carriers — each reviewed under both arms, on identical material: the unified
diff of every changed file **plus** the rendered post-change content of the
slice's files, reconstructed byte-for-byte from the real PR parents (see
VERIFICATION.md for the revisions; the fix/224 PR head sits on rewritten
history and its recorded base does not reproduce the recorded scope — the
reconstructed base does):

| Unit | Ground truth | Review-countable defect sources | Slices |
|---|---|---|---|
| fix/258-harden-needs-input-contracts | its cycle-1 defect ledger (F1–F8, each with a machine-verified finding mark on the branch) | 8 | 5 |
| fix/224-deterministic-replan-routing | its cycle-1 defect ledger (25 scored rows; the review-countable subset is 9 — VERIFICATION.md) | 9 | 10 |

- **mono arm**: one review call over the whole accumulated branch delta.
- **slices arm**: one focused review call per task-boundary slice (the slice's
  files as diff + tip content), findings unioned.

Four models spanning the strength axis, temperature 0 with fixed seeds and one
strict-JSON finding contract for both arms, 2 runs per (arm, model, unit):
weak/unlimited tier **nan/qwen3.6** and **nan/gemma4**, strong-flash tier
**nan/glm5.3-flash** and **nan/deepseek-v4-flash** (strong tier on fix/224
only). **112 review calls**. Cost: the weak tier is unbilled; the strong tier
costs ≈2.2 nan credits of a 1,182.8 remaining balance, inside the owner's
25-credit authorization.

## Results — defect-source recall (best of 2 runs; full table in results/)

| Model | fix/258 mono → slices | fix/224 mono → slices |
|---|---|---|
| qwen3.6 | 5/8 → **7/8** | 3/9 → **6/9** |
| gemma4 | 4/8 → **6/8** (7/8 cross-run union, including the only catch of U1-F1 anywhere in the grid) | 3/9 → **8/9** |
| glm5.3-flash | — | 7/9 → **8/9** |
| deepseek-v4-flash | — | 8/9 → **9/9** (every file-matchable id) |

The three structural facts behind the table:

1. **Slices ≥ mono in all 6 (unit × model) combinations, and no
   monolithic-only catchable defect missed by slices was observed.** The
   advantage shrinks monotonically with reviewer strength and never inverts.
2. **Where the monolithic arm degrades is its shape, not the model.** At
   fix/224's review scope (~618 KB rendered delta, 91–99% of a small model's
   window) both weak models collapsed into 2–5 shallow, partially mistaken or
   repeated findings; slices (12–150 KB per call) sit outside that regime
   entirely. That is the same coverage-collapse class behind unit-258's twelve
   documented correction cycles — the defect that motivated #753.
3. **Slice granularity produces catches mono cannot structurally produce.**
   fix/258-F1 (a budgets manifest re-based *below* its own declared
   `ceil(measured × 1.10)` rule) was caught by exactly one call in the whole
   grid — a gemma4 budgets-slice review of the hunk where the defect had just
   been written. fix/224-F19's truncated route ceilings and fix/224-F3's glued
   CHANGELOG pipes were caught (by both models) out of the budgets and
   release-notes slices for the same reason.

## Where slices do not help (honest limits, feeding the design)

- **Registry/parity classes belong to gates.** fix/224-F1 (`.claude-plugin`
  skills array missing the new skill) was never surfaced by any mono call at
  any strength; slices surfaced it only after giving one slice the unmodified
  registry manifest as a read anchor. The final defense for that class is its
  deterministic parity check; the anchor trick complements it, never
  substitutes.
- **Out-of-diff claims are a delta-reader's job.** fix/224-F4/F5 (reference
  pages describing emitted behavior the new code contradicts, where the stale
  sentence sits outside the changed diff) were unreachable for a
  content-reviewer arm at any strength. `review-change`'s delta surface catches
  them; review-due owns only the WHEN axis, not the pack's depth (row 97).
- **Recall buys precision debt.** deepseek's slice unions return 129–205 raw
  findings per run vs the mono call's 66 — the published IronBee gradient
  (more strength/effort buys recall, spends precision) reproduces per-arm
  here. The designed consumer of that extra yield is the classification pack
  `review-change` already runs; extra rows land in the severity/class table,
  not in noise.

## The deterministic integration contract (recorded for #753's design phase)

Fail-closed consumption of the frozen contract in
[#566](https://github.com/gtrabanco/agentic-workflow/issues/566) (B3's clauses
are quoted verbatim at design time; the `under_budget` pending sentence, B3-3,
stays banned on every committed surface):

- **The WHEN axis only.** Depth stays whatever the unit's risk tier declares
  (row 97's surface). Review-on-slices creates no gate authority and no second
  review mechanism.
- **`review_due` is computed, never inferred.** A new subcommand in the row-97
  ceremony CLI family (`ceremony review-due <unit>`), typed verdict + closed
  reason vocabulary schema-published in `agentic-workflow-schema`, pinned in
  `normative-surfaces@1`, consumed by `execute-phase`, read by the
  `workflow-status` sensor. An unavailable or failed assessment never starts
  or lowers a review (clause 2: the degradation is named and recorded, never a
  preflight transition); a task boundary on its own neither authorizes nor
  advances a review (clause 1); review starts only on a true `review_due`
  verdict or an explicit user ask.
- **Tier→cadence mapping, fixed in config.** The triage the owner described
  ("triage first, so the spend matches the benefit") is the deterministic read
  that already exists — the row-97 classifier — plus a fixed mapping table,
  cut at plan time, never judged per-run:

  | Risk tier (deterministic, row 97) | Review cadence | Measured support from this A/B |
  |---|---|---|
  | **high** | progressive review-due: the pending slice goes to review at each task boundary | slices win at every strength, widest on the weak unlimited models (+2 to +5 defect sources over mono); mid-execution catches (the F1 class) keep the end-of-change gate smaller |
  | **standard** | on demand: the user asks, or the boundary explicitly selects the lenses; otherwise one review pass at the close | strong reviewers nearly saturate mono (glm picked 7/9 across 11 surgical findings; deepseek reached 8/9 in a single 66-finding call); slicing there is spend without priced return |
  | **passive** | none | unchanged, already owner-recorded |

- **Model strength is the second axis, already owned by the #388 amendment**
  (tier-aware quota routing). The weak unlimited models are the ones that
  profit most from slicing exactly because they degrade worst on the whole
  accumulated branch; strong models keep the mono pass on standard tier and
  still gain at high.
- **Enforcement only after shadow verdicts.** The A/B of record runs against
  the already-shipped correction-budget baseline
  (`min(200, changed/2)`, recorded in the unit-258 fix history from
  arXiv 2603.00539), never against the unbounded twelve-cycle strawman. The
  harness in this folder is the reusable instrument for that A/B.
- **Mechanical parity stays mechanized** (plugin registry, budget ceilings,
  bilingual pair presence — the classes every reviewer arm here struggled
  with). Those checks ship as gates; review-due neither replaces them nor
  waits for them.

## External evidence — no one has published this exact A/B

Full reading in [external-evidence.md](external-evidence.md). Summary: the
granularity half of the hypothesis has external support (arXiv 2510.10290 —
anchored small-unit review improves recall proxies, n=8 directional; ESEM 2025
— early AI-led review preferred, conditional on severity and familiarity), and
the large public review benchmarks (IronBee's 21-model/7,980-review study,
MacroscopeBench's 12k-bug board) publish the strength/effort gradient this
session reproduced per-arm — but they all run their reviews on a **fixed
review unit** (PR-whole), so no public result isolates strength×granularity.
The mono-saturation gradient measured here (mono recall 3/9 → 9/9 as strength
rises; slices monotone ≥ mono) is new, directional, and small-n (2 units,
2 models per tier) — which is exactly why the contract above keeps enforcement
behind shadow verdicts.

## Where things landed

- This folder: report, external-reading, harness, per-call results.
- A PR carrying the folder **refs but does not close** #753; the integration
  itself stays un-started, per the owner's instruction.
- ATTRIBUTION.md rows for the external sources used land in the same PR.
