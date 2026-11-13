# Papers sweep — 2026-11-12 (input quality, elicitation, regeneration vs editing, LSP)

Third literature sweep (first: 2026-09-15 token-economy audit; second: 2026-11-02;
addendum: 2026-11-06 merge gates). Scope: the input path of agentic development —
requirements elicitation, clarification-seeking, prompt structuring — and the editing
stack: diffs vs whole-file regeneration vs LSP/structure-aware editing. Every paper
fetched and abstract-read from arXiv the day of the session; harness sources fetched
from their repositories. Verdicts follow the established convention; nothing here is
adopted — this sweep is evidence-only (see the landing column).

## Verdict table

| arXiv / source | Title (short) | Verdict | Lands on |
|---|---|---|---|
| 2605.20149 | Less Back-and-Forth: Structured Prompting | **APPLY (design input #526)** | checklist-first pre-spec over free interview |
| 2610.01769 | CONTRA — behavior-changing questions | **APPLY (design input #526)** | question qualification mechanism |
| 2603.26233 | Ask or Assume? Uncertainty-aware clarification | **APPLY (design input #26)** | uncertainty-calibrated asking |
| 2610.22382 | Eliciting Specifications: when does clarification help? | **APPLY (design input #526, highest caution value)** | cross-model elicitor rule |
| 2606.20585 | Turning Intent into Specifications (SpecBench/Buddy) | **APPLY (design input #526)** | morphological dimensions × choices structure |
| 2610.13022 | Don't Guess, Just Ask (ReqClarifyBench) | **APPLY (benchmark reference #526)** | repo-level pre-coding clarification benchmark |
| 2609.36789 | GitHarness | **REFERENCE** | spec-by-reference corroboration (row 79) |
| 2610.10628 | Agent4RE (RE-E2E) | **REFERENCE** | elicitation-as-phase validation |
| 2609.05779 | Diffs vs. Whole Files | **APPLY (design input #441 one-shot; tier philosophy)** | regeneration vs localized edit split |
| 2610.21073 | Skip the Compressor | **APPLY (executor context guidance, post-stable)** | whole-file verbatim context |
| 2604.27296 | To Diff or Not to Diff? (BlockDiff/FuncDiff/AdaEdit) | **APPLY (executor context guidance, post-stable)** | block-level diffs for long files |
| 2611.07286 | How Should Agents See Code? | **APPLY (tier/LSP cost mapping, post-stable)** | representation workflows by task stage |
| 2610.25826 | From Finding to Fixing | **APPLY (tier/LSP cost mapping, post-stable)** | FL cost-vs-saving caution |
| 2610.36015 | Do Coding Agents Still Need a Debugger? | **APPLY (tier/LSP cost mapping, post-stable)** | localization saturation by task size |
| 2409.00921 | Typed Holes (Hazel) | **REFERENCE** | LSP contextualization foundation |
| 2510.22210 | LSPRAG | **REFERENCE** | LSP-retrieval beats similarity RAG |
| 2609.04061 | When Models Edit Too Much | **APPLY (preservation amendment, recorded on #307)** | repair-mode preservation instruction |

## Cluster 1 — requirements elicitation & clarification (2026)

### 2605.20149 — Less Back-and-Forth: A Comparative Study of Structured Prompting
Compares three prompt conditions across summarization/planning/explanation/coding on
three LLM systems with a unified rubric: raw prompts 5.67/8, clarifying-question
prompts 6.67/8, **checklist-improved prompts 7.50/8** — and the checklist condition
uses *fewer* average tokens than both others. Consequence for design: the template
does the structuring; the interview is selective and comes second. This is the
single paper that reshapes the "adaptive interview" idea into "checklist-first,
questions only where they change behavior".

### 2610.01769 — CONTRA: Discovering and Qualifying Behavior-Changing Questions
Training-free selective clarification: generate candidate questions, filter those
already resolved by the requirement, then qualify each remaining question by
generating programs under two plausible answers and checking for **stable behavioral
differences on shared inputs**. Only behavior-changing questions are asked. Highest
F1 on ClarifyCodeBench with all four coding agents evaluated. The qualification step
is mechanically computable — it fits the repo's governance-decay rule (compute, don't
prose-prescribe).

### 2603.26233 — Ask or Assume? Uncertainty-Aware Clarification-Seeking in Coding Agents
Underspecified variant of SWE-bench Verified; an uncertainty-aware multi-agent
scaffold that decouples underspecification detection from code execution achieves
**69.40% resolve**, significantly outperforming a standard single-agent setup and
closing the gap with agents on fully-specified instructions. The system exhibits
well-calibrated information-seeking: conserving queries on simple tasks, proactive
on complex ones.

### 2610.22382 — Eliciting Specifications: When Does Interactive Clarification Help?
Elicitation agent + simulated developer for Lean 4 spec generation, 189 tasks,
question budgets k=3 and k=10, same-model and cross-model configurations. The
same-model Claude Sonnet 4.6 pipeline has **negative strict pass@1 estimates at both
budgets** — elicitation is not a uniform accuracy booster. Sonnet 4.6→GPT-5.6 and
Sonnet 4.6→Gemini 3.8 Flash pipelines are positive; largest strict result 65.6%
(+6.3 points). Directly matches the repo's existing cross-family review rule and
extends it to elicitation: the asker must not share the implementer's family.

### 2606.20585 — Turning Intent into Specifications (SpecBench + Buddy)
Benchmark for intent→executable-specification translation with a bounded question
budget. Finds two extreme agent behaviors: entering implementation mode too quickly
while overestimating preference understanding, or exhausting the budget asking about
every ambiguity. Buddy follows classical morphological analysis: decompose intent
into a structured space of design dimensions × candidate choices, create simulated
users to evaluate choices, engage the real user only for remaining ambiguities.

### 2610.13022 — Don't Guess, Just Ask (ReqClarifyBench)
341 repository-level tasks (game, miniapp, web), each with vague user intent, a
human-validated requirement document and code-evaluation artifacts; LLM-based user
simulators with diverse personas from real conversations; six LLMs evaluated for
clarification effectiveness and its effect on subsequent generation. First benchmark
of pre-coding requirement clarification at repository level.

### 2609.36789 — GitHarness
Long-horizon collaboration where users complete, elicit, or shift requirements
mid-run; agents may carry obsolete information or turn local revisions into global
rewrites. Formulates dynamic-requirement collaboration as joint requirement tracking
and local update: requirement states + harness work states organized into a
branchable git-style version history; a trained Git Agent resolves changes and
restores a compatible state on a new branch. Evidence-only for this repo: row 79's
spec-by-reference already implements the local-update half (append a Log entry,
rewrite only the affected `S#`).

### 2610.10628 — Agent4RE (RE-E2E)
Self-refining multi-agent requirements-engineering system spanning elicitation →
generation, with RE-E2E built from human-written requirement specifications.
Consistently outperforms a domain-context-augmented prompting baseline by ~8%
(text metrics) across 8 LLMs; the two enhanced variants (autonomous self-refinement,
structured human feedback) reach the highest LLM-as-judge and human ratings.
Validates elicitation as a *phase* with a defined output artifact, not an ad-hoc
conversation.

## Cluster 2 — regeneration vs localized editing

### 2609.05779 — Diffs vs. Whole Files (Flutter/Dart)
Two code models (a 100M trained from scratch, a fine-tuned Qwen2.5-Coder-0.5B), both
regimes trained on a shared dataset, ~1,790 held-out tasks per model. Direct
whole-file generation **substantially outperforms iterative diff-based editing on
every metric measured** — compilation/static-analysis pass rate, bits-per-byte,
character-level similarity, blinded LLM-judge ratings of goal fulfillment,
correctness and code quality — and the gap persists after controlling for task
difficulty (matched-ID comparison) and restricting to code that compiles on both
sides. The inversion: diff-editing is competitive on short, spatially localized
edits, and its category-level wins concentrate in exactly two categories —
**refactoring and error-handling/edge-case fixes**. Task locality is the mechanism.

### 2610.21073 — Skip the Compressor: Coding Agents Fix More Issues When They Pick Whole Files
300 SWE-rebench issues, GPT-5.6 and Claude Opus 5, every context fitted to the same
per-issue token budget. Spending the budget on choosing which files to show
**verbatim** (CQ2-CARE) resolves 43.7%/46.7% of issues — +6.3 points over the best
of three compressors, +9.3/+12.7 over the best of three retrievers, and ahead of the
trained selectors SweRank (+0.7/+1.7) and SWE-Pruner (+2.0/+7.3). Mechanism: patching
needs the files that must change *and their code exactly as written*; compressors
alter text so fewer patches apply. Whole-file selection needs no compression model
and lets the model quote the code it edits.

### 2604.27296 — To Diff or Not to Diff? (BlockDiff / FuncDiff / AdaEdit)
Systematic study of diff formats: fragile offsets and fragmented hunks make
line-level diff generation highly unnatural for LLMs. Structure-aware formats
representing changes as block-level rewrites of syntactically coherent units
(control structures, functions) plus an adaptive strategy choosing between diff and
full code per case. AdaEdit with structure-aware diffs **matches the accuracy of
full-code generation while reducing latency and cost by over 30% on long-code
editing tasks**. The token-cost counterweight to regeneration on long files.

## Cluster 3 — LSP / structure-aware representations

### 2611.07286 — How Should Agents See Code? (Nov 2026)
Five map-based code-representation workflows (abstract syntax trees, call graphs,
module dependencies, documentation-enriched search, hybrid) against a raw-tool
baseline (Claude Code + Haiku 4.5) on LinuxFLBench (fault localization),
SWE-bench Pro (repo-level generation and repair), SWT-bench (test generation) and
SecBench (security patching). Results: representations are most useful as
**token-saving tools when localization is the bottleneck**; success gains narrow
when the decisive step is patch or test authoring. LinuxFLBench: recall@10
0.757–0.829 vs 0.717, tokens −25–39%. SWE-bench Pro: resolution ≈ baseline
(44.3–50.6% vs 49.0%), tokens −17–26%. SecBench: callgraph best patch resolution
(34.3% vs 28.9%), fewer tokens. SWT-bench: more tokens and longer latency.
**Benefits are task-dependent, not universal.**

### 2610.25826 — From Finding to Fixing: How Useful is Fault Localization for Agentic Repair?
Systematic empirical study: six FL methods on SWE-bench Verified and Defects4J with
three LLMs under a common repair framework; 16,248 repair trajectories analyzed.
FL methods do **not consistently improve repair success**; higher localization
accuracy does not consistently lead to larger repair gains. Accurate locations
reduce repair token use by up to 39.2%, but current FL methods often consume more
tokens than they save during repair. FL guides agents' early search (reach relevant
code sooner); bug-cause descriptions improve repair success beyond locations alone;
gold locations from a single reference patch do not capture the locations successful
repairs actually use.

### 2610.36015 — Do Coding Agents Still Need a Debugger?
610 seeded single-line faults across 144 solutions × five behavior-preserving
transformation recipes; agents (Sol 6.1, Luna 6, Qwen 3.8) localize with no,
optional, or encouraged debugger assistance. Without tools: **98.2–99.9% of faults
localized from source alone** (96.7–99.9% on transformed programs). Encouraged
debugger help removes 61–63% of the remaining errors at **14.7–27.0× the token
use**. With optional assistance the agents used the debugger in only 0.2–6.2% of
runs — they prefer executing the program over stepping through it, keeping most of
the benefit. At the frontier, tool-assisted localization is near-saturated on short
programs; its value grows with repository size.

### 2409.00921 — Statically Contextualizing LLMs with Typed Holes (Hazel)
"AIs need IDEs, too." The language server identifies the type and typing context of
the hole being filled — even in the presence of errors — enabling codebase-wide,
semantically-local (not lexically-local) contextualization in a token-efficient
manner; completions are iteratively refined via further dialog with the language
server. The theoretical foundation for LSP-guided generation and editing.

### 2510.22210 — LSPRAG
Off-the-shelf LSP servers as the retrieval backend for unit-test generation:
precise symbol definitions and references in real time, language-agnostic, minimal
per-language engineering. Compared to the best baselines, line coverage increased up
to **+174.55% (Go), +213.31% (Java), +31.57% (Python)**. LSP-guided retrieval beats
similarity-based RAG wherever symbol-precise context matters.

### 2609.04061 — When Models Edit Too Much: On the Fidelity of Minimal Code Edits
Over-editing evaluation on 400 BigCodeBench problems with injected AST-level
corruptions (known minimal patches). Over-editing is widespread among frontier LLMs
including GPT-5.5: high Pass@1 coexists with unnecessarily large edits and added
cognitive complexity. A **preservation instruction** substantially reduces it:
average excess Levenshtein distance 0.195 → 0.131, added cognitive complexity
−26.6%, Pass@1 +2.3 points. The gains do not simply follow from larger reasoning
budgets or larger models; RL gives the best out-of-domain edit-fidelity trade-off.
Edit fidelity is a distinct, measurable, learnable axis of repair quality.
**Landing:** recorded on #307 (comment extending design note 6) as a candidate
amendment for the future repair mode; applying it to today's fold-findings wording
would be re-based when the skill retires.

## Studied projects (harness survey, no adoption)

| Source | What was studied | Outcome |
|---|---|---|
| [gentle-ai / gentle-shell (ODD)](https://github.com/Gentleman-Programming/gentle-ai) | Spec-verbatim feature docs, resumability sizing, measured benchmark (gentle-shell#1718) | Already credited (ATTRIBUTION 2026-08 studied row; ODD direction in #307). No new adoption |
| [Cloudflare OS](https://github.com/cloudflare/cloudflare-os) (v2, early access) | Blueprints (whole-app templates), preloaded company knowledge, Gatekeepers (capability-based access; async human-in-the-loop with locally simulated outcomes), reduce-the-cost-of-error thesis; built on Pi (`pi-agent-core`) | `studied` — the blueprint pattern is already the template/scaffold half of init-workspace; nothing adopted; contribution-policy thesis independently corroborates this repo's |
| [Kumoss](https://github.com/InditexTech/kumoss) (InditexTech, IaC) | Organization-standards-as-context, policies as code (OPA), high-impact lock for admin review, full prompt tracing (OpenTelemetry + Arize Phoenix) | `studied` — domain adaptation via policy-as-code; nothing adopted |
| [DeepSeek Harness](https://www.deepseek.com/en/harness/) | Plugin architecture on Cordis, public preview | `studied` — no visible initial-prompt guidance mechanism; recorded to close the survey |

## What the evidence suggests (candidate changes, none applied here)

1. **Preservation instruction** in the repair path (2609.04061) — recorded on #307;
   lands with the repair-mode slice.
2. **Elicitation layer** (cluster 1) — filed as #526, gated on #307 kernel slices +
   #441's one-shot verdict + golden fixture.
3. **Executor context wording** (whole-file verbatim over the edited files;
   block-level diffs on long files — 2610.21073 + 2604.27296) — post-stable, with
   the measured token delta the repo requires before any prose change.
4. **LSP cost mapping by tier** (2611.07286 + 2610.25826 + 2610.36015) — feeds the
   ceremony-profile/tier work (#436 family) post-stable.

Nothing found that justifies changing a shipped rule today.
