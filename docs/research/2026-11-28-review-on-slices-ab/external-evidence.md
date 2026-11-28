# External evidence — what exists and what does not (2026-11-28)

The question: has anyone published an A/B of slice-wise (incremental,
task-boundary) LLM review against monolithic (whole-PR/whole-branch) review,
and does the effect track reviewer-model strength? Search method: arXiv API
full-record fetches (2608.09290, 2510.10290, 2508.11034), two large public
benchmark write-ups fetched in full (IronBee, MacroscopeBench), plus several
targeted web searches (Tavily). Nothing found runs the exact A/B; the nearest
evidence is itemized below. All external pages were fetched live on 2026-11-28
(UTC); quotes are verbatim, with the caveat that pages are untargeted snapshots.

## 1. OpenCodeReview — arXiv 2608.09290 (Abstract API, live)

Newer abstract text (read from the API on 2026-11-28; supersedes the older
v1 abstract quoted in #753's evidence comment where it differs): the system
injects determinism at three pipeline points — Rule-Guided Dispatch
(deterministic file/criteria selection), Grounded File Review ("file-level
parallel SubAgents balance context coherence against efficiency and recover
cross-file dependencies on demand"), and an Independent Reflection filter
whose reflector "sees only the diff, not the agent's tool-augmented
exploration". On AACR-Bench (200 real PRs, 10 languages, 1,505 expert-verified
comments) it "outperforms mainstream coding agents".

Reading for the WHEN axis: the paper supports **file-level parallel review
agents** (the slice-granularity half of the hypothesis) and **deterministic
first-stage dispatch** (what row 97's classifier already gives us), but never
varies cadence or model strength — it designs a pipeline, not an A/B. #753's
own 2026-11-28 correction (the 2.17× SEM-F1 / 5–15× token claim belongs to the
whole pipeline, not to fragment-vs-monolithic review) is confirmed by the
newer abstract text.

## 2. Grounded AI for Code Review — arXiv 2510.10290 (Abstract API, live)

Production system pairing static-analysis findings with AST-guided context
extraction and a single-GPU quantized serving stack, on safety-oriented C/C++
standards. Sub-minute median first feedback (59.8 s); "a small internal survey
(n=8) provides directional signals of reduced triage effort and moderate
perceived grounding, with participants reporting fewer human review
iterations". Reading: confirms the **small-unit/anchored** end of the spectrum
supports review quality, in a narrow domain with n=8 signal — supporting the
slice component, silent on cadence. Already evaluated for #753 on 2026-11-28
(issue comment 7237543777); unchanged by this session.

## 3. IronBee, "The Honest Raw LLM Code Review Benchmark" (blog, fetched live)

21 raw models × up to 3 effort levels × 3 passes = 7,980 reviews over
Martian's Code Review Bench (50 real PRs, 173 curated goldens, 158 in the core
profile); judged by a calibrated three-model panel; cost and speed per
configuration. The gradient this session reproduced per-arm appears there per-effort:

> More thinking buys recall and costs precision. At their highest level, 13 of
> 18 models find significantly more issues and 11 are significantly less
> precise.

> The gaps at the top are within the noise. [..] The tools write fewer
> findings and find fewer issues.

Directly relevant to the strong-model extrapolation question: strength and
reported effort move **recall/precision trade, not the review unit** — every
configuration reviews the PR whole; the experiment never varies granularity.
So the public benchmark record cannot answer the slices-vs-mono question, only
ours does. Also useful: their pass-to-pass stability numbers (a configuration's
F2 spans a median 2.6 points across passes) justify our 2-run protocol and the
"best of 2 runs" reading used in the results table.

Caveats they publish that apply to us too: "a false positive is not always
wrong" (13 of 48 sampled FPs were real issues the golden list lacked), "public
data [..] models may have seen them in training" (our patch trees are the
repo's own, older than the models' cutoffs for the units' content but not
guaranteed), "small slices" (n=2 units here), and LLM judges (we scored by
file/defect matching to the repo's own human-verified ledger instead, which
sidesteps the judge-model concern at the cost of matching granularity).

## 4. MacroscopeBench (vendor benchmark, fetched live)

12,000+ validated bugs from 1,500+ repositories, 14 languages; a model
"is asked whether an AI code reviewer would have caught each defect at the
commit that introduced it"; scored on recall/precision/signal-to-noise/cost by
two independent LLM judges, three runs. Their published all-bug snapshot:

| Model (vision) | Score | Recall | Precision | S/N | Cost/review |
|---|---|---|---|---|---|
| GPT-6 Astra, max effort | 78.0 | 67.8% | 91.7% | 6.26:1 | $7.87 |
| GLM 5.3, max effort | 77.4 | 76.4% | 78.4% | 2.24:1 | $3.86 |
| DeepSeek V4.1 Flash, max effort | 72.0 | **83.1%** (best) | 63.5% (worst of leaders) | — | $0.75 |

Relevant published facts adopted into this session's analysis: (a) **recall
and precision pull in opposite directions** ("The model with the best
known-bug recall (DeepSeek V4.1 Flash, 83.1%) has the worst precision of the
leaders") — exactly the deepseek slice-union explosion we measured (129–205
raw findings/run vs the mono call's 66, with a classification pass as the
designed consumer); (b) **"Effort level matters more than model family"** (their
high-vs-low Opus 5 swing exceeds several inter-vendor gaps); (c) it is a
vendor benchmark and "almost every AI code review benchmark you can find in
2026 was published by a vendor who won it" — their own disclosed caveat, kept
attached. None of their board varies the review unit: per-commit at *benchmark
construction*, PR-whole per model run.

## 5. The Impact of LLMs on Code Review Process — arXiv 2508.11034 (Abstract API, live)

25,473 PRs / 9,254 GitHub projects; GPT-assisted PRs: median resolution time
>60% shorter (9 h vs 23 h), review time −33%, waiting-before-acceptance −87%.
Reading: macro evidence that earlier LLM contact with the change helps
**timelines** — phase-level, no cadence control, no strength axis; heuristic
labeling; not a granularity A/B.

## 6. Adjacent but not evidence for the WHEN axis

- LLM code-review tooling commentary (Semgrep 2026, Codacy 2026 cost pieces):
  per-push re-review churn and per-change cost economics, vendor-adjacent, no
  controlled granularity comparison.
- Community threads on AI-PR review overload (ITK discourse): no measurement.
- "Bigger pull requests are easier" (IronBee finding; large PRs score higher
  because they carry more, more visible, goldens): a benchmark artifact of
  scoring density per PR, not of review quality per defect — worth remembering
  when someone reads a PR-size leaderboard as prescribing monolithic review.

## Conclusion for #753

The external record supports: (a) small-unit/anchored review predictably pays
(2510.10290; OpenCodeReview's file-level agents); (b) early/front-loaded LLM
review shortens timelines strongly (2508.11034) and is preferred by
practitioner evidence when familiarity/severity conditions hold (ESEM 2025,
already on the issue); (c) strength/effort gradient is a
recall-vs-precision trade on a **fixed review unit** (IronBee, Macroscope) —
nobody published strength×granularity, so the mono-saturation gradient this
session measured (mono 3/10 → 9/10 recall as strength rises; slices monotone
≥ mono) is new, directional, and small-n (2 units, 2 models per tier).
