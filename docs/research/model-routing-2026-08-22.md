# Model Routing for Agentic Workflow Skills — 2026-08-22

## Executive recommendation

For this workflow, the best practical architecture is not one universal model. It is a three-plane router:

1. **Throughput:** NaN Qwen3.6 for repository discovery, documentation, status, decomposition, and other high-volume work.
2. **Implementation:** NaN DeepSeek V4 Flash for `execute-phase` and `fold-findings` when the work is already well specified.
3. **Independent judgment:** NaN MiMo 2.5 for a first review by a different model family; OpenCode Go GLM-5.3 or Kimi K3 for difficult planning, product judgment, final audits, and disputed findings.

When a frontier subscription is active, use GPT-5.6 Sol or Claude Opus 5 selectively for design/planning, `product-audit`, `audit-pr`, `ship-roadmap`, and arbitration—not as the default implementation engine. Claude Pro is the cheaper occasional frontier subscription at its published price; ChatGPT Plus already includes the relevant Codex model family, while ChatGPT Pro primarily buys substantially more allowance. Exact included agentic quotas are not published as fixed task counts, so the usage dashboard remains authoritative.

The central conclusion is deliberately conservative: **the NaN models can form a strong, economical workflow, but the available official evidence does not establish that recursive prompting, RLM-style orchestration, or model routing makes them generally equivalent to GPT-5.6 Sol or Claude Opus 5 in high-judgment planning and review.** Orchestration can improve coverage, context handling, and verification; it cannot reliably manufacture missing judgment, calibration, or tool-use competence.

## Evidence policy and scope

This report uses vendor documentation, official model cards, official pricing pages, and the repository's own skill contracts. Vendor benchmark numbers are reported as **owner-reported evidence**, not as independent proof. No score is treated as directly comparable unless the task version, harness, reasoning effort, sampling, context, and execution environment match.

Availability and commercial terms are a snapshot as of **2026-08-22**. Provider dashboards, `/models`, `/model`, and usage/reset indicators are the operational source of truth when they conflict with a static document.

## Current access and economics

| Service | Verified access and limits | Practical implication |
|---|---|---|
| **NaN Member** | [NaN](https://nan.builders/) advertises `nan_member` at **€70/month VAT included**. Its [model catalogue](https://nan.builders/docs/models) lists Qwen3.6 35B-A3B FP8 with 256K context as unmetered, DeepSeek V4 Flash with 1M context and 2B tokens/month, and MiMo 2.5 with 1M context and 1B tokens/month. The [API documentation](https://nan.builders/docs) states 60 requests/minute, five concurrent requests, and 1.5M tokens/minute per model. | Use Qwen for volume. Reserve DeepSeek and MiMo quotas for implementation and independent review. A token quota is not a quality guarantee, and long-context availability does not establish reliable long-context retrieval. |
| **OpenCode Go** | The official [Go plan](https://opencode.ai/docs/go/) costs **$5 for the first month and $10/month thereafter**. Global value caps are $12 per rolling five hours, $30/week, and $60/month. Per-model monthly value caps also apply. The listed catalogue includes GLM-5.3, Kimi K3, Qwen3.8 Max, Qwen3.7/3.6 Plus, DeepSeek V4 Pro/Flash, MiMo2.5/Pro, GPT-5.6 Luna, and a limited-time Ox Alpha Free entry. | Excellent as an inexpensive judgment/diversity layer. Do not interpret the displayed request estimates as guaranteed requests: OpenCode says they are derived from unusually cache-heavy observed prompts. Clean-context workflow calls can consume allowance differently. |
| **ChatGPT / Codex** | The official [ChatGPT pricing page](https://chatgpt.com/pricing/) prices Pro at **$100/month for 5× Plus usage or $200/month for 20× Plus usage**. The [GPT-5.6 availability note](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt/) lists Codex Sol, Terra, and Luna for Plus, Pro, Business, and Enterprise; Free/Go receive Terra. The [Pro help page](https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro) describes higher access, while exact agentic task counts vary with model, context, and task. [OpenCode's provider documentation](https://opencode.ai/docs/providers) supports OpenAI OAuth with ChatGPT Plus/Pro. | Plus is sufficient for model-family access; buy Pro only when the observed allowance is the bottleneck. Sol should be spent on consequential judgment, Terra on normal planning/review, and Luna on high-volume work only when NaN is unavailable or a different implementation family is useful. |
| **Claude Pro / Claude Code** | [Claude Pro](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan) is **$20/month or $200/year**, provides at least five times the free-plan usage per session, and shares usage between Claude and Claude Code. The [Claude Code usage guide](https://support.claude.com/en/articles/14552983-models-usage-and-limits-in-claude-code) documents rolling five-hour and weekly limits rather than fixed task counts. [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) is the default across plans; [Opus 5](https://www.anthropic.com/news/claude-opus-5) is Anthropic's strongest model on Pro and the default on Max. Fable 5 is [pay-as-you-go from the start on Pro](https://support.claude.com/en/articles/15424964-claude-fable-5-on-your-plan). | Claude Pro is the most economical occasional route to a frontier planner/reviewer, but its allowance is workload-dependent. Use Claude Code natively: [OpenCode states](https://opencode.ai/docs/providers) that Anthropic prohibits third-party plugins from using Claude Pro/Max authentication. |

### OpenCode Go limits that matter for routing

The [official Go table](https://opencode.ai/docs/go/) currently estimates the following requests for five hours/week/month and lists the per-model monthly value cap:

| Model | Estimated requests: 5h / week / month | Per-model monthly cap | Recommended use |
|---|---:|---:|---|
| GLM-5.3 | 220 / 540 / 1,080 | $15 | Default Go planner, adjudicator, and final reviewer |
| Kimi K3 | 110 / 250 / 490 | $15 | Hard-plan second opinion and adversarial audit |
| Qwen3.8 Max | 160 / 400 / 810 | $15 | Experimental alternate planner; evidence is thinner |
| DeepSeek V4 Flash | 7,600 / 18,900 / 37,800 | $30 | Cheap execution fallback when NaN is unavailable |
| MiMo2.5 | 30,100 / 75,200 / 150,400 | $60 | Cheap diverse review and routine work |
| GPT-5.6 Luna | 2,050 / 5,100 / 10,250 | $15 | Fast implementation or independent low-cost pass |
| Qwen3.7 Plus | 4,300 / 10,800 / 21,600 | $60 | General throughput alternative |
| Qwen3.6 Plus | 3,300 / 8,200 / 16,300 | $60 | General throughput alternative; not proven identical to NaN's open 35B-A3B checkpoint |
| Ox Alpha Free | Not published | Not published | Non-critical experiments only |

These are **estimates, not quotas expressed as request counts**. OpenCode defines the limits in dollar value and explains that the estimates assume very large, highly cached inputs. Model revisions and upstream serving configurations are not disclosed in enough detail to equate every provider alias with an open checkpoint.

## What the official model evidence supports

### Qwen3.6 35B-A3B

The official [Qwen3.6-35B-A3B model card](https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/main/README.md) describes 35B total parameters, approximately 3B active parameters, native 262K context, and extension to approximately 1M. Owner-reported results include 73.4 on SWE-bench Verified, 67.2 on multilingual SWE-bench, 49.5 on SWE-bench Pro, 51.5 on Terminal-Bench 2.0, 28.7 on SkillsBench, 29.4 on NL2Repo, and 25.9 on DeepPlanning.

This is strong evidence for a very economical coding and repository-work model. It is weaker evidence for making Qwen the sole high-stakes planner: DeepPlanning and repository-generation results trail its patch-completion result, and the card documents different harnesses, edited subsets, large output budgets, and in some cases internal tooling. SWE-bench uses Qwen's own bash/file scaffold; SkillsBench excludes API-dependent tasks; NL2Repo comparisons use Claude Code for other models. NaN also documents a serving sampling configuration that is not necessarily the benchmark configuration.

**Best fit:** discovery, inventory, decomposition, documentation, status, routine verification, and plan scaffolding. Require another model for consequential design closure or final audit.

### DeepSeek-V4-Flash-0731

The official [DeepSeek-V4-Flash-0731 model card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731) reports 82.7 on Terminal-Bench 2.1, 54.2 on NL2Repo, 76.7 on CyberGym, 54.4 on DeepSWE, 70.3 on Toolathlon, 25.2 on ALE, and 25.1 on Automation. The card reports multiple reasoning-effort modes and very large output budgets for high/max effort.

Those results support DeepSeek as the strongest NaN candidate for executing a well-specified engineering plan. They do not prove parity with frontier judgment: the same card's Opus 4.8 comparison is higher on most listed agentic tasks, and DeepSeek's minimal evaluation harness is described as forthcoming. Max effort may also consume quota quickly.

There is a material identity caveat: NaN calls its endpoint **DeepSeek V4 Flash**, describes 284B total/21B active parameters, and does not identify it as the 0731 checkpoint. That is insufficient evidence to claim exact equivalence to the official 0731 model card. Treat the card as family-level evidence until NaN publishes the checkpoint/revision and serving harness.

**Best fit:** `execute-phase`, difficult repairs, and `fold-findings`, normally at high effort; use max only where ambiguity justifies the cost.

### MiMo 2.5

The official [MiMo-V2.5 model card](https://huggingface.co/XiaomiMiMo/MiMo-V2.5) describes 310B total/15B active parameters, 1M context, and native multimodality. Xiaomi's [official launch page](https://mimo.xiaomi.com/mimo-v2-5) and model-card benchmark asset report 71.8 on MiMo Coding Bench, 62.3 on Claw-Eval Text, 65.8 on Terminal-Bench 2.0, and 56.1 on SWE-bench Pro.

MiMo's value here is primarily **independence from the Qwen and DeepSeek families**, not a demonstrated advantage at code review. The official material does not provide enough common-harness detail to rank it confidently against GLM, Kimi, GPT, or Claude. The model card also warns that its tokenizer/configuration was updated after initial release and that the old configuration degrades performance; a gateway's exact revision is therefore operationally important and currently unverified.

**Best fit:** independent review after DeepSeek execution, triage, multimodal product inspection, and a second opinion before escalating.

### GLM-5.3 and Kimi K3 on OpenCode Go

Z.ai's [GLM-5.3 announcement](https://z.ai/blog/glm-5.3) reports 88.2 on Terminal-Bench 2.1, 28.3 on Terminal-Bench 3.0, 66.9 on DeepSWE 1.1, 58.0 on NL2Repo, 73.0 on Toolathlon, 48.2 on Automation, and 28.5 on ALE. Moonshot's official [Kimi K3 model card](https://huggingface.co/moonshotai/Kimi-K3) describes 2.8T total/104B active parameters and 1M context, and reports 67.5 on DeepSWE, 88.3 on Terminal-Bench 2.1, 72.9 on Kimi Code Bench, 76.5 on Toolathlon, 94.5 on MCPMark, and 30.8 on Automation.

Both are plausible high-judgment Go choices. GLM is the pragmatic default because the Go allowance estimates more than twice as many requests as Kimi at the same per-model monthly cap. Kimi is the better scarce second opinion when a plan or audit deserves model-family diversity. This is an economic routing decision, not proof that GLM is intrinsically superior.

Both vendors use owner-selected configurations, reasoning effort, timeouts, contexts, and some internal benchmarks. The official pages themselves document harness-specific settings. The scores should not be numerically merged with Qwen's Terminal-Bench 2.0, GLM's Terminal-Bench 3.0, or another vendor's private coding suite.

### GPT-5.6 and Claude 5 families

OpenAI's [GPT-5.6 announcement](https://openai.com/index/gpt-5-6/) positions Sol as the strongest coding/reasoning model, Terra as the balanced model, and Luna as the high-volume model. OpenAI explicitly presents a useful division of labor: Sol resolves uncertainty and plans; Luna executes well-specified changes. The official [API model documentation](https://developers.openai.com/api/docs/models) lists 1.05M context and prices of $5/$30 per million input/output tokens for Sol, $2/$12 for Terra, and $0.20/$1.20 for Luna. Owner-reported benchmark claims and third-party-index references favor Sol, but they remain vendor launch evidence with offline cost/latency assumptions.

Anthropic's [Opus 5 announcement](https://www.anthropic.com/news/claude-opus-5) positions it as the strongest model for judgment, verification, and difficult agentic work, while [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) is the lower-cost default. Anthropic's own Claude Code guidance recommends planning with Opus and executing with Sonnet, including an `opusplan` routing mode. The evidence is again owner-reported and includes internal evaluations and selected customer reports.

**Best fit:** Sol or Opus for ambiguous architecture, product decisions, final audit, and disagreement arbitration; Terra or Sonnet for normal planning/review; Luna or Sonnet for execution only when they offer useful diversity or NaN is unavailable.

## Actionable routing table

| Workflow role | Default with NaN + OpenCode Go | NaN-only fallback | When ChatGPT/Codex is active | When Claude Code is active | Escalation rule |
|---|---|---|---|---|---|
| `discovery/init` | Qwen3.6 gathers evidence; GLM-5.3 closes complex initialization decisions | Qwen3.6; DeepSeek checks ambiguous repository-state conclusions | Terra for complex initialization | Sonnet 5; Opus only for uncertain architecture | Escalate when repository state, consent, or target contract is ambiguous |
| `design/planning` | GLM-5.3 max primary; Kimi K3 adversarial pass on consequential plans | DeepSeek max primary; Qwen challenges omissions | Sol xhigh/max; use Terra for routine plans | Opus 5 high/max | Do not let Qwen alone freeze a high-risk plan; use a second family before implementation |
| `execute-phase` | DeepSeek high; Qwen for mechanical substeps | DeepSeek high | Terra or Luna only when useful; preserve Sol allowance | Sonnet 5 | Tests and frozen contracts override model confidence; max effort only for genuine ambiguity |
| `review-change` and `review-*` pack | MiMo 2.5 reviews DeepSeek work; GLM-5.3 synthesizes code/security/implementation findings. Qwen handles mechanical docs/status/a11y/SEO checks | MiMo independent review; Qwen mechanical axes; DeepSeek adjudicates only if it did not author the change | Terra routine; Sol adjudicates security, architecture, or disputed blockers | Sonnet routine; Opus adjudicates critical findings | Reviewer should be a different family from author. Require reproducible evidence for blockers |
| `product-audit` | GLM-5.3 primary plus Kimi or MiMo dissent pass | DeepSeek max plus MiMo dissent; human/product-owner sign-off | Sol max | Opus 5 max | Never rely on completion benchmarks as evidence of product judgment |
| `audit-pr` | GLM-5.3 or Kimi K3, chosen to differ from the implementation model | MiMo first pass plus Qwen/DeepSeek evidence check | Sol xhigh/max | Opus 5 high/max | Final audit must inspect the actual candidate diff and verification results, not prior summaries |
| `triage/fold` | MiMo or Qwen triages routine findings; DeepSeek performs folds; GLM handles contested classification | MiMo/Qwen triage; DeepSeek fold | Terra triage/fold; Sol only for disputes | Sonnet triage/fold; Opus only for disputes | Separate finding classification from repair; rerun review after the fold |
| `docs/status` | Qwen3.6 | Qwen3.6 | Luna or Terra only if NaN unavailable | Sonnet only if NaN unavailable | Keep work read-only where the skill contract is read-only; verify status from repository evidence |
| `ship-roadmap` | GLM-5.3 conductor; route children to Qwen/DeepSeek/MiMo | DeepSeek max conductor with Qwen evidence and MiMo audit | Sol max conductor | Opus 5 max conductor | Frontier model should coordinate and arbitrate, not spend its allowance on every mechanical child task |

## Subscription scenarios

### 1. NaN only

Use **Qwen → DeepSeek → MiMo** as the default pipeline: Qwen discovers and structures, DeepSeek plans/implements, MiMo reviews. This is the lowest-friction configuration and can handle most ordinary repository work. For security-sensitive, architectural, or release-critical decisions, use two independent passes and retain human sign-off. The official evidence does not support claiming frontier parity for those decisions.

### 2. NaN + OpenCode Go — recommended steady state

Use NaN for volume and Go for judgment. Make GLM-5.3 the default planner/adjudicator, Kimi K3 the scarce adversarial reviewer, DeepSeek the executor, MiMo the independent reviewer, and Qwen the discovery/docs worker. At $10/month after the introductory month, Go is unusually useful even if it is renewed only during active development periods.

Do not consume Go's limited expensive-model buckets on routine implementation. Its value is avoiding a bad plan, catching a consequential defect, or resolving disagreement. Keep actual usage records because the published request counts assume cache patterns that may not match clean-context skill calls.

### 3. NaN + ChatGPT/Codex

If Codex Plus allowance is sufficient, **do not buy Pro merely for model access**: Plus already lists Sol, Terra, and Luna. Use Sol for plan closure, `product-audit`, `audit-pr`, and `ship-roadmap`; Terra for normal planning/review; keep NaN DeepSeek for execution and Qwen for volume. Buy Pro only after the dashboard shows that agentic allowance—not poor routing—is the real constraint.

OpenCode's supported ChatGPT OAuth can consolidate access, but the effective limits still belong to the OpenAI subscription. Avoid using the same GPT family for planning, implementation, and review when a NaN or Go model can provide a genuinely independent pass.

### 4. NaN + Claude Pro / Claude Code

Use native Claude Code. Apply Anthropic's own practical split: **Opus 5 plans and adjudicates; Sonnet 5 executes and performs routine review**. In this workflow, separate clean-context skill calls are preferable to an opaque automatic handoff when audit independence matters. Continue using NaN for routine volume so Claude's shared rolling and weekly limits remain available for high-value judgment.

At the published $20 monthly price, Claude Pro is the most pragmatic intermittent frontier subscription. Its disadvantage is quota uncertainty and shared Claude/Claude Code usage. Fable 5 is not part of Pro's included allowance, so it is not a sensible default router target.

### 5. Both frontier subscriptions active

Choose one frontier family as the primary planner and the other as the final independent auditor; do not duplicate every phase. A good release-critical pattern is Opus plan → DeepSeek/Sonnet execute → Sol audit, or Sol plan → DeepSeek execute → Opus audit. The second premium subscription is justified only when independent judgment or sustained allowance has measurable value.

## Strongest counterarguments and failure modes

1. **A frontier conductor plus cheap workers may still fail.** A weak executor can silently misapply a strong plan, while a strong reviewer can miss defects hidden by poor repository exploration. Every handoff must carry explicit artifacts and verification evidence.
2. **Benchmarks are not review benchmarks.** SWE-bench and terminal tasks mainly measure successful completion. They do not directly measure false-positive rate, calibrated severity, specification fidelity, or whether a reviewer finds subtle regressions.
3. **Cross-vendor score comparisons are often invalid.** Terminal-Bench 2.0, 2.1, and 3.0 are different; vendors use different harnesses, tool scaffolds, context/output limits, effort settings, seeds, timeouts, and edited task sets. Several cited suites are internal or have unreleased harnesses.
4. **Gateway aliases may not identify checkpoints.** NaN's DeepSeek specification does not establish that it is `DeepSeek-V4-Flash-0731`; OpenCode's “Qwen3.6 Plus” is not proven identical to Qwen's open 35B-A3B card. Quantization, tokenizer revision, system prompt, tool parser, and serving stack can materially change behavior.
5. **Unlimited tokens can be expensive in rework.** Qwen's unmetered access makes it ideal for breadth, but repeated low-confidence cycles can cost more human time than one strong planner call. Routing should optimize accepted outcomes and rework, not token price alone.
6. **Model diversity is not automatically wisdom.** A second family can add false positives or stylistic disagreement. Findings should require file/line evidence, reproduction, contract impact, and a clear disposition.
7. **Long context is not reliable recall.** A 1M-token window does not demonstrate that a model will notice the decisive invariant. Repository exploration and focused context construction remain necessary.
8. **Provider behavior changes.** Models, caps, safety systems, and fallbacks can change without preserving old benchmark behavior. Revalidate after meaningful provider/model updates.
9. **RLM/recursive prompting has a ceiling.** It can search, split context, and recheck work, but extra recursion can also amplify an incorrect premise and spend quota. Stop conditions must be tied to tests, contracts, and verified findings rather than self-reported confidence.

## Facts that could not be verified from primary sources

- That NaN's `deepseek-v4-flash` endpoint is exactly the official `DeepSeek-V4-Flash-0731` checkpoint.
- The precise tokenizer/config revision, system prompt, tool parser, output cap, cache behavior, and upstream serving revision for each NaN or OpenCode alias.
- A guaranteed number of usable OpenCode Go requests for this workflow; the official request figures are estimates based on observed caching patterns.
- The identity, owner, context, release, and capability of Ox Alpha Free. OpenCode's own [model data page](https://opencode.ai/data/unknown/ox-alpha) marks these fields unknown.
- Exact fixed Codex task/message quotas included with ChatGPT Plus or Pro, or an exact Opus 5 task quota on Claude Pro. Both depend on workload and rolling limits.
- A current official, common-harness quality comparison for Qwen3.8 Max against GLM-5.3, Kimi K3, GPT-5.6, and Claude 5.
- Any same-harness test showing that one of these models is best for this repository's `review-change`, `audit-pr`, `product-audit`, or planning contracts.

## Recommended local validation

Before freezing the router, run three to five representative tasks per role with clean contexts and fixed artifacts. Record:

- contract compliance and valid workflow receipts;
- accepted defects found and review false positives;
- implementation regressions and required rework;
- test/lint/typecheck pass rate;
- wall time, tokens/value allowance, and human intervention;
- agreement with a blinded final adjudication.

Change a route only when it wins repeatedly on **accepted outcome per unit of cost**, not because of one vendor benchmark or one impressive run. Keep the specification, tests, and repository state as the authority. A model's clean exit or confident narrative is not proof that the workflow succeeded.

## Bottom line

The recommended day-to-day stack is:

> **Qwen3.6 for breadth → GLM-5.3 for difficult plans → DeepSeek V4 Flash for execution → MiMo 2.5 for independent review → GLM/Kimi or an active frontier model for final adjudication.**

When paying for a frontier subscription, spend it where judgment compounds: planning, product audit, final PR audit, roadmap conduction, and resolving contested findings. Claude Pro is the pragmatic occasional purchase; ChatGPT Plus may already provide enough Codex access; ChatGPT Pro is an allowance upgrade whose value should be demonstrated by actual usage. None of these routes removes the need for deterministic checks, independent review, or a local evaluation set.

## Official access verification addendum — 2026-08-22

This addendum supersedes the commercial-access and quota statements above wherever they conflict. It uses only current first-party documentation and the providers' own model-list endpoints. A model exposed by an endpoint is not necessarily a documented, stable entitlement; the product model picker, `/models`, account dashboard, and reset indicators remain the operational source of truth.

### OpenCode Zen free models, distinct from Go

OpenCode Zen is pay-as-you-go, but its current [Zen documentation](https://opencode.ai/docs/zen) explicitly prices these models at zero and describes them as limited-time free access:

| Documented free Zen model | Model ID | Material condition |
|---|---|---|
| Big Pickle | `opencode/big-pickle` | Stealth model; collected data may be used to improve it during the free period |
| Ox Alpha Free | `opencode/x-preview-f-free` | Stealth model; documented as zero retention and not used for training |
| MiMo-V2.5 Free | `opencode/mimo-v2.5-free` | Limited-time feedback period; collected data may be used to improve it |
| Hy3 Free | `opencode/hy3-free` | Limited-time feedback period; collected data may be used to improve it |
| Nemotron 3 Ultra Free | `opencode/nemotron-3-ultra-free` | Trial only; NVIDIA logs use and says not to submit personal or confidential data |
| Nemotron 3.5 Lightning Free | `opencode/nemotron-3.5-lightning-free` | Trial only; NVIDIA logs use and says not to submit personal or confidential data |
| Muse Spark 1.2 Contributor Free | `opencode/muse-spark-1.2-contributor-free` | Prompts and completions may train future Meta models |

The official [`GET /zen/v1/models`](https://opencode.ai/zen/v1/models) endpoint also exposed `deepseek-v4-flash-free` and `laguna-s-2.1-free` when checked on 2026-08-22. However, the same-day Zen pricing, free-model, and privacy sections did **not** list either ID. Therefore this report treats them as discoverable but undocumented previews, not stable verified free entitlements. Check `/models` immediately before routing work to them and do not send confidential code until OpenCode publishes their data terms.

No fixed free-request or token allowance is published for the documented Zen free models. “Free” establishes a zero token price, not guaranteed capacity, latency, permanence, or a particular rate limit. Zen's documentation also says its free offers are temporary.

### OpenCode Go: current documented catalogue and limits

The [official Go documentation](https://opencode.ai/docs/go/) lists the following current catalogue: Grok 4.5; GPT-5.6 Luna; GLM-5.3, 5.2, and 5.1; Kimi K3, K2.7 Code, and K2.6; MiMo-V2.5 and MiMo-V2.5-Pro; MiniMax M3 and M2.7; Muse Spark 1.2 Contributor in permitted regions; Qwen3.8 Max, Qwen3.7 Max/Plus, and Qwen3.6 Plus; DeepSeek V4 Pro, Flash, and Flash Vision Exp; Hy3; and limited-time Ox Alpha Free.

Go costs $5 for the first month and $10/month thereafter. Its plan-wide rolling limits are **$12 per five hours, $30 per week, and $60 per month**. These are value limits, not request quotas. OpenCode's complete same-day estimates are:

| Model | Estimated requests: 5h / week / month |
|---|---:|
| Grok 4.5 | 120 / 300 / 600 |
| GPT-5.6 Luna | 2,050 / 5,100 / 10,250 |
| GLM-5.3 | 220 / 540 / 1,080 |
| GLM-5.2 or GLM-5.1 | 880 / 2,150 / 4,300 |
| Kimi K3 | 110 / 250 / 490 |
| Kimi K2.7 Code | 1,350 / 3,380 / 6,750 |
| Kimi K2.6 | 1,150 / 2,880 / 5,750 |
| MiMo-V2.5 | 30,100 / 75,200 / 150,400 |
| MiMo-V2.5-Pro | 3,250 / 8,150 / 16,300 |
| MiniMax M3 | 3,200 / 8,000 / 16,000 |
| MiniMax M2.7 | 3,400 / 8,500 / 17,000 |
| Muse Spark 1.2 Contributor | 45,300 / 113,300 / 226,600 |
| Qwen3.8 Max | 160 / 400 / 810 |
| Qwen3.7 Max | 340 / 840 / 1,690 |
| Qwen3.7 Plus | 4,300 / 10,800 / 21,600 |
| Qwen3.6 Plus | 3,300 / 8,200 / 16,300 |
| DeepSeek V4 Pro | 1,050 / 2,600 / 5,200 |
| DeepSeek V4 Flash | 7,600 / 18,900 / 37,800 |
| DeepSeek V4 Flash Vision Exp | 3,800 / 9,450 / 18,900 |
| Hy3 | 4,300 / 10,750 / 21,500 |
| Ox Alpha Free | Not estimated |

The same official table applies model-specific monthly value buckets as well: $15 for Grok 4.5, GPT-5.6 Luna, GLM-5.3, Kimi K3, MiMo-V2.5-Pro, Qwen3.8 Max, DeepSeek V4 Pro, and DeepSeek V4 Flash Vision Exp; $30 for DeepSeek V4 Flash; and $60 for GLM-5.2/5.1, Kimi K2.7 Code/K2.6, MiMo-V2.5, MiniMax M3/M2.7, Muse Spark 1.2 Contributor, Qwen3.7 Max/Plus, Qwen3.6 Plus, and Hy3. Ox Alpha Free has no published value bucket.

The estimates assume OpenCode's observed, highly cached request shapes, so clean-context agentic-workflow calls may yield materially fewer requests. The official [`GET /zen/go/v1/models`](https://opencode.ai/zen/go/v1/models) endpoint exposes some additional legacy or preview aliases that are absent from the documented current catalogue and estimate table. Their presence alone is not evidence that Go guarantees them. OpenCode explicitly says the catalogue and limits may change and recommends `/models` plus the console for current access and usage.

### NaN: models and conflicting DeepSeek quota

NaN's current [API reference](https://nan.builders/docs/api) publishes these chat models for every inference member: `deepseek-v4-flash`, `mimo-v2.5`, `qwen3.6`, and `gemma4`. `glm5.2` is also served but requires the separate GLM 5.2 premium tier. The [model catalogue](https://nan.builders/docs/models) documents 60 requests/minute, five concurrent requests, and these model details:

| NaN model | Public allowance / status |
|---|---|
| Qwen3.6 35B-A3B FP8 | Cluster model; no token counter according to NaN's [membership FAQ](https://nan.builders/); 256K context |
| Gemma4 26B-A4B FP8 | Cluster model; no token counter according to the [membership FAQ](https://nan.builders/); 256K context |
| MiMo-V2.5 310B-A15B FP8 | 1.0B tokens/member/month; 1M context |
| DeepSeek V4 Flash | **Conflicting official figures:** model catalogue says 2B tokens/member/month, while the API reference and membership page say 500M/month; 1M context |
| GLM 5.2 premium | 3,000M tokens per billing period plus 400M per rolling four hours; 500K context; separate premium membership |

The DeepSeek quota cannot be resolved from public first-party sources as of this snapshot. The report must not claim either 500M or 2B as guaranteed. Use the authenticated NaN dashboard or obtain written support confirmation for the specific account and billing period. MiMo's 1B figure is consistent across the inspected official sources. NaN's public docs do not identify the exact upstream checkpoints, tokenizer revisions, or serving prompts behind these aliases.

### Claude subscription access for agentic coding

Anthropic's current official position is:

- [Claude Pro](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan) costs $20/month in the US, includes Claude Code, and has workload-dependent five-hour plus weekly limits shared across models. It does not include Claude API usage.
- [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) is available on every plan and is the default for Free and Pro.
- [Opus 5](https://www.anthropic.com/news/claude-opus-5) is Anthropic's strongest model on Pro and the default on Max. Claude Code's [model configuration](https://support.claude.com/en/articles/11940350-claude-code-model-configuration) lists both `claude-opus-5` and `claude-sonnet-5`, but `/model` is the account-level source of truth.
- Anthropic's own [Claude Code usage guide](https://support.claude.com/en/articles/14552983-models-usage-and-limits-in-claude-code) recommends Sonnet for most coding, Opus for difficult cross-cutting refactors, debugging, and architecture, and the `opusplan` pattern to plan with Opus and execute with Sonnet.
- Opus 5 and Sonnet 5 support 1M context on paid plans. In Claude Code, Pro users must enable usage credits to use the 1M Opus context, according to Anthropic's [context-window guidance](https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans).

Anthropic does not publish a fixed number of Claude Code tasks included in Pro: task length, context, model choice, five-hour windows, weekly limits, and discretionary capacity controls all matter. [Fable 5 should not be treated as included Pro capacity](https://support.claude.com/en/articles/15424964-claude-fable-5-on-your-plan); since 2026-07-20 it runs on separately billed usage credits from the start for Pro users.

### ChatGPT subscription access for agentic coding

OpenAI distinguishes standard ChatGPT conversations from Codex:

| Plan | Standard ChatGPT | Codex / ChatGPT Work |
|---|---|---|
| Free or ChatGPT Go | GPT-5.6 Luna in ChatGPT; no Sol | GPT-5.6 Terra with limited access |
| ChatGPT Plus ($20/month) | GPT-5.6 Sol at medium/high effort; no Extra High or Sol Pro | GPT-5.6 Sol, Terra, and Luna; `max` is available in Codex |
| ChatGPT Pro $100 / $200 | Sol medium/high/Extra High plus Sol Pro | GPT-5.6 Sol, Terra, and Luna with higher allowance; the Pro tiers provide 5x or 20x Plus usage respectively |

Sources: OpenAI's current [GPT-5.6 availability article](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt/), [ChatGPT Plus article](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus), [Pro-tier article](https://help.openai.com/en/articles/9793128-what-is-chatgpt-pro), and [Codex pricing/limits page](https://chatgpt.com/codex/pricing/).

The current Codex page displays broad estimated ranges rather than guaranteed task counts, says local messages and cloud tasks share a five-hour window, and warns that weekly limits may also apply. The dashboard and `/status` are authoritative. Sol Pro is documented for standard ChatGPT Pro reasoning; OpenAI's Codex access table lists Sol, Terra, and Luna, so this report does **not** claim that Sol Pro is selectable in Codex.

### Corrections and unresolved uncertainty

- The earlier wording that NaN DeepSeek has a verified 2B monthly allowance is too strong because NaN's own API and membership pages still state 500M. The authenticated account allowance must decide.
- Zen free access is not the same product as Go. Go subscribers can continue with free models after reaching Go limits, but free-model availability is temporary and no fixed allowance is published.
- `deepseek-v4-flash-free` and `laguna-s-2.1-free` were present in Zen's official model endpoint but absent from its current pricing and policy prose. Treat them as undocumented previews.
- OpenCode and NaN model endpoints do not prove checkpoint identity, quantization beyond what NaN explicitly documents, stable availability, or equivalence to owner-reported model-card benchmarks.
- Subscription inclusions do not include API credits unless the provider explicitly says so: Claude Pro excludes Claude API usage, and ChatGPT subscriptions do not include OpenAI API usage.

## Correction — NaN inference privacy

NaN must not be grouped with OpenCode Zen's feedback, trial, or training-data
caveats. NaN's current [official privacy policy](https://www.nan.builders/privacy)
states that the inference cluster stores zero logs of prompts or model
responses, processes inference in the European Union, does not use user code to
train models, and retains only server metrics needed for cluster maintenance.
The same policy records administrative data required to operate the service,
including waitlist email, membership details, and billing information. The
accurate short form is therefore **no inference-data collection**, not “no
records of any kind.”

The user has additionally clarified that NaN complies with the European AI Act.
Treat that as the provider's compliance statement. The public privacy page
supports the inference-privacy and EU-processing claims above but does not itself
provide an independent legal certification or use the phrase “AI Act.”
