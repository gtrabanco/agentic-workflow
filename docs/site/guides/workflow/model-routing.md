<!--
generated-by: agentic-workflow/generate-docs
source-unit: docs/workflow/model-routing.yml
updated: 2026-08-22
-->

> 🇪🇸 [Versión en español](model-routing.es.md)

# Route models and effort by workflow skill

## What this is

This guide maps every Agentic Workflow skill to a primary model, effort, and
fallback for five common subscription combinations. It is an operational
snapshot for **2026-08-22**, not a permanent leaderboard. Provider aliases,
free offers, quotas, serving revisions, and model behavior change: check the
account dashboard and `/models` before a long run. The frozen specification,
tests, current repository state, and review evidence remain authoritative; a
model's confident completion is not a workflow receipt.

## How to do it

1. Install the portable `#inheritance` branch when the host should choose the
   model, or `#claude` when Claude Code should apply the repository's canonical
   Opus/Sonnet tiers:

   ```sh
   npx skills add gtrabanco/agentic-workflow#inheritance
   npx skills add gtrabanco/agentic-workflow#claude
   ```

2. Select the model and effort for the **next skill turn** from the matrix
   below. Run each model boundary in a fresh context. A skill loaded from
   another skill inherits the caller's model and effort; it cannot upgrade
   itself mid-turn. Hand off, change model, then invoke the next skill.
3. Follow the normal workflow and its persisted artifacts:

   ```text
   design-feature → plan-feature → execute-phase
     → loop-review-fold → audit-pr → human merge
   ```

4. When a primary model is unavailable or its allowance is exhausted, restart
   the complete skill in a clean context with the listed fallback. Do not swap
   models halfway through one skill result. Skip a fallback when it is from the
   same family that authored the change and independent review is required.
5. Use `review-change --adversarial 2` for an `L` feature, a sensitive change,
   work produced by a weaker model, or a release gate without family diversity.
   Use three reviewers only for security-critical work or when all available
   reviewers are from one family.

### Effort vocabulary

| Effort | Portable meaning | Use |
|---|---|---|
| `low` | Reasoning off or minimal; one direct pass | Search-shaped evidence gathering and formatting |
| `medium` | Provider default reasoning; bounded tool loop | Mechanical implementation and deterministic checks |
| `high` | Reasoning/thinking enabled; explicit verification pass | Planning, review, triage, and subtle implementation |
| `max` | Highest available reasoning plus adversarial re-check | Architecture, security, product audit, and merge arbitration |

When a provider exposes only thinking on/off, map `high` and `max` to thinking
on. For `max`, add a separate clean-context challenge pass rather than merely
asking the same context to think longer.

### Model shorthand

| Plan | Shorthand |
|---|---|
| NaN | `Q36` = Qwen3.6; `DSF` = DeepSeek V4 Flash; `M25` = MiMo 2.5 |
| OpenCode Go | `G53` = GLM-5.3; `K3` = Kimi K3; `DSP` = DeepSeek V4 Pro; `K27` = Kimi K2.7 Code; `M25P` = MiMo 2.5 Pro; `Luna` = GPT-5.6 Luna |
| Zen free | `M25F` = MiMo-V2.5 Free; `Hy3F` = Hy3 Free; `N3UF` = Nemotron 3 Ultra Free; `OxF` = Ox Alpha Free |
| Claude | `O5` = Opus 5; `S5` = Sonnet 5 |
| ChatGPT/Codex | `Sol` = GPT-5.6 Sol; `Terra` = GPT-5.6 Terra; `Luna` = GPT-5.6 Luna |

An arrow means “fallback”, not an in-turn chain. A semicolon separates models
that have different roles inside an orchestrated skill. The Claude column
assumes Pro or Max; Free has Sonnet only and no included Opus fallback. The
ChatGPT column assumes Plus or Pro; Free/Go currently provides limited Terra
access in Codex, so use the Terra entry and accept that there is no included
frontier fallback.

### Automation boundary

The matrix is a routing recipe, not an automatic model switch inside the
workflow. `main`/`#inheritance` inherits the host's current model; the canonical
[`model-routing.yml`](../../../workflow/model-routing.yml) only supplies the
floating tiers for the `#claude` branch. To use `Q36 → M25 → DSF` or
`G53 → K27 → K3`, the outer driver (for example a Pi/OpenCode/AWL adapter) must
select the model for each fresh skill turn. Without such a driver, change the
model manually between the hand-offs printed by each skill.

### Default pipeline by subscription

| Available plans | Default workflow | Important limitation |
|---|---|---|
| NaN only | Q36 discovers/drafts → M25 challenges → DSF executes → M25 reviews → Q36 verifies evidence | Good for normal bounded work; human gate for sensitive planning and merge |
| OpenCode Go + Zen free | G53 plans → K27 or DSF executes → M25P reviews → K3/G53 audits; Zen-free handles public mechanical overflow | Preserve scarce K3/G53 allowance; do not send confidential code to training/logging free routes |
| Claude only | O5 designs/plans → S5 executes → O5 reviews/audits | Strong models, but planner/executor/reviewer remain one vendor family; add human review for sensitive work |
| ChatGPT only | Sol designs/plans → Terra executes → Sol reviews/audits; Luna handles mechanics | Plus is enough for model access; one-family correlation remains |
| NaN + OpenCode Go | Q36 discovers → G53/K3 plans → DSF executes → M25 reviews → G53/K3 audits | Recommended steady state: NaN buys throughput, Go buys judgment and arbitration |

### Where discovery and questioning happen

“Discovery” and “questioning” are existing workflow responsibilities, not
hidden prompts that need to be invented:

| Responsibility | Workflow skill | What it actually does |
|---|---|---|
| Repository discovery | `discover-repository-state` | Collects directly observed facts, separates facts from documentation/inference, and freezes or contradicts the repository-state snapshot. It does not recommend an implementation. |
| Workflow-state discovery | `workflow-status` | Read-only sensor for roadmap, dependencies, PRs, findings, and startable work. It reports state; it does not judge quality. |
| Product discovery | `design-feature` | Runs the raw-idea interview, capability/role closure, and expectation sweep before a feature can be marked `designed`. |
| Engineering questioning | `plan-feature` + `planning-preflight` | Tests scope, dependencies, invariants, size, and architectural classification before phases are frozen. |
| Code questioning | `review-change` | Composes the internal `review-*` pack, checks acceptance against the diff, classifies findings, and returns `REVIEW-PASS`, `REVIEW-FAIL`, or `NEEDS-DECISION`. |
| Adversarial questioning | `review-change --adversarial 2` or `3` | Runs isolated fresh reviewers with fixed correctness, security, and SPEC-coverage roles, then fuses their findings. It is a built-in route, not an external prompt. |
| Product-wide questioning | `product-audit` | Challenges code, process, documentation, roadmap, and tooling across the product. |
| Contradiction resolution | `resolve-repository-state` and `triage-issue` | Resolves contradictory repository facts or verifies whether an issue/finding is real and actionable. |

The phrase “Qwen discovers → MiMo questions” therefore means: use Qwen for
`discover-repository-state`/evidence gathering, then use MiMo in a separate
`design-feature`, planning challenge, or review turn. The planning challenge is
an operator recipe; the code review is directly supported by
`review-change --adversarial`. It is not one hidden skill called
`discover-and-question`. There is also no separate user-facing `review-plan`
skill today: an independent pre-execution plan challenge is a fresh model turn
over the SPEC/plan artifact, and its conclusions must be folded back into the
plan before `execute-phase`.

### Per-skill routing matrix

| Skill | Baseline | NaN only | OpenCode Go + Zen free | Claude only | ChatGPT only | NaN + OpenCode Go |
|---|---|---|---|---|---|---|
| `audit-docs` | medium | Q36/medium → M25/medium | M25P/medium → M25F/medium | S5/medium → O5/high | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `audit-pr` | high | M25/high + Q36/high; human gate → DSF/max if it was not the author | G53/max → K3/max → DSP/max | O5/max → S5/max + human gate | Sol/max → Terra/max + human gate | G53/max → K3/max → M25/high |
| `bump-skill` | medium | Q36/medium → DSF/medium | M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `design-feature` | high | M25/high + Q36/high → DSF/max; human closes high-risk design | K3/max → G53/max → DSP/max | O5/max → S5/max | Sol/max → Terra/max | K3/max → G53/max; Q36 gathers evidence |
| `discover-repository-state` | medium | Q36/medium → DSF/medium | M25P/medium → Luna/medium → M25F/medium | S5/medium → O5/high | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `execute-phase` | medium | DSF/high → Q36/medium for mechanical phases | K27/high → DSF/high → Luna/medium; M25F only for public mechanical work | S5/medium (high for subtle logic) → O5/high | Terra/medium (high for subtle logic) → Luna/medium | DSF/high → Q36/medium; Go models only when NaN is blocked |
| `fold-findings` | high | DSF/high → Q36/high for mechanical findings | DSP/high → G53/high → DSF/high | O5/high → S5/high | Sol/high → Terra/high | DSF/high → DSP/high; G53 for disputed findings |
| `generate-docs` | medium | Q36/medium → M25/medium | M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `init-workspace` | high | M25/high + Q36 evidence → DSF/max | G53/max → K3/max | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 gathers evidence → M25 challenge |
| `log-session` | medium | Q36/low → M25/low | M25F/low → Hy3F/low → Luna/low | S5/low | Luna/low → Terra/low | Q36/low → M25F/low for non-confidential logs |
| `loop-review-fold` | high | Q36/high conductor; DSF folds; M25 reviews | G53/high conductor; DSP/DSF folds; K3 or M25P reviews | O5/high conductor; S5 workers | Sol/high conductor; Terra workers | G53/high conductor; DSF folds; M25 reviews |
| `orchestration-envelope` | medium | Q36/medium → DSF/high | M25P/medium → Luna/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → DSF/high |
| `phase-contract` | caller, at least medium | Q36/medium → DSF/high | M25P/medium → Luna/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → DSF/high |
| `plan-feature` | high | Q36/high draft + M25/high challenge → DSF/max; human closes high-risk plans | G53/max → K3/max → DSP/max | O5/high (max for critical plans) → S5/max | Sol/high (max for critical plans) → Terra/max | G53/max → K3/max; Q36 prepares evidence |
| `plan-feature-from-issue` | high | Q36/high + M25/high → DSF/max | G53/high → K3/high → DSP/high | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 scopes issue evidence |
| `plan-feature-scaffold` | medium | Q36/high → DSF/high | DSP/high → G53/high → M25P/high | O5/high → S5/high | Sol/high → Terra/high | Q36/high → G53/high for `M/L` units |
| `plan-fix` | high | DSF/max + M25 challenge → Q36/high | G53/max → DSP/max → K3/max | O5/high (max for critical fixes) → S5/max | Sol/high (max for critical fixes) → Terra/max | G53/max; DSF supplies reproduction evidence → M25 challenge |
| `planning-preflight` | caller, high | M25/high + Q36 evidence → DSF/max | G53/max → K3/max → DSP/max | O5/high → S5/max | Sol/high → Terra/max | G53/max; Q36 supplies evidence → M25 challenge |
| `product-audit` | max | M25/max + DSF/max + Q36 evidence; product-owner gate | K3/max + G53/max → DSP/max; product-owner gate | O5/max → S5/max + product-owner gate | Sol/max → Terra/max + product-owner gate | K3/max + G53/max; M25 dissent; product-owner gate |
| `resolve-repository-state` | high | M25/high + Q36 evidence → DSF/max | G53/max → K3/max → DSP/max | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 supplies evidence → M25 challenge |
| `review-a11y` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium for public UI | S5/medium → O5/high | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-brand` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium for public copy | S5/medium → O5/high | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-change` | high | M25/high primary + Q36/high evidence check; human gate for sensitive work | G53/max → K3/max → M25P/high | O5/high (max for sensitive work) → S5/max + human gate | Sol/high (max for sensitive work) → Terra/max + human gate | M25/high independent pass; G53/max synthesis → K3/max |
| `review-code` | high | M25/high → Q36/high; DSF/max only when not author | G53/high → DSP/high → K3/high | O5/high → S5/high | Sol/high → Terra/high | M25/high → G53/high; skip author's family |
| `review-debt` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-design` | medium | M25/high → Q36/high | G53/high → K3/high → M25P/high | O5/high → S5/high | Sol/high → Terra/high | M25/high → G53/high |
| `review-implementation` | high | M25/high → Q36/high; DSF only when not author | G53/high → DSP/high → K3/high | O5/high → S5/high | Sol/high → Terra/high | M25/high → G53/high; skip author's family |
| `review-perf` | medium | M25/high → DSF/high when not author | DSP/high → G53/high → M25P/high | S5/high → O5/high | Terra/high → Sol/high | M25/high → G53/high |
| `review-security` | high | M25/max + Q36/max; mandatory human/security gate | G53/max + K3/max → DSP/max; no Zen-free fallback | O5/max → S5/max + human/security gate | Sol/max → Terra/max + human/security gate | G53/max + K3/max; M25 dissent; human/security gate |
| `review-seo` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium for public pages | S5/medium | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-verify` | medium | Q36/medium → M25/medium | Luna/medium → M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `ship-roadmap` | high | Q36/high conductor; DSF executes; M25 reviews; human owns gates | K3/max or G53/max conductor; K27/DSP workers; family-diverse reviews | O5/max conductor; S5 workers | Sol/max conductor; Terra workers | G53/max conductor; Q36 discovers; DSF executes; M25 reviews; K3 audits |
| `triage-issue` | high | M25/high + Q36 evidence → DSF/high | G53/high → DSP/high → K3/high | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 gathers evidence → M25 dissent |
| `verification-contract` | caller, at least medium | Q36/medium → DSF/high | M25P/medium → Luna/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → DSF/high |
| `workflow-status` | medium | Q36/low → M25/low | M25F/low → Luna/low → Hy3F/low | S5/low | Luna/low → Terra/low | Q36/low → M25/low |

### OpenCode Zen free-model policy

Zen's documented free models are temporary and have no fixed published token or
request allowance. Use them as overflow for public, reversible, low-risk work:

| Documented free model | Suitable use | Data caveat |
|---|---|---|
| MiMo-V2.5 Free | Docs, status, cheap independent pass | Feedback-period data may improve the model |
| Hy3 Free | Canary-tested mechanical work | Feedback-period data may improve the model |
| Nemotron 3 Ultra Free / 3.5 Lightning Free | Public experiments after a canary | NVIDIA logs use; no personal or confidential data |
| Ox Alpha Free | Non-critical experiments | Zero retention is documented, but model identity is undisclosed |
| Big Pickle | Public experiments only | Stealth model; collected data may improve it |
| Muse Spark 1.2 Contributor Free | Disposable public tasks only | Prompts and completions may train future Meta models |

- Prefer `M25F` for docs, status, evidence collection, and a cheap independent
  pass; prefer `Hy3F` or `N3UF` only after a local canary.
- `OxF` documents zero retention, but its owner and capabilities remain
  undisclosed. Do not make it a merge gate.
- Big Pickle and MiMo Free may use collected data for improvement; Nemotron
  trials log use; Muse Contributor may use prompts and completions for
  training. Do not send private repository code, credentials, customer data,
  unpublished vulnerabilities, or regulated data to those routes.
- `deepseek-v4-flash-free` and `laguna-s-2.1-free` appeared in Zen's official
  model endpoint on the snapshot date but had no documented quota or data
  policy. Treat them as previews, not fallbacks, until the prose documentation
  catches up.

Run a canonical contract canary before using Kimi K2.7 Code: verify that it
reads the complete skill, emits the required receipt, respects forbidden
actions, and follows the final hand-off. Keep it as an executor, not the
workflow conductor, until it passes repeatedly.

### NaN inference privacy

NaN is a different privacy case from the OpenCode Zen feedback/trial routes.
NaN's [official privacy policy](https://www.nan.builders/privacy) states that
the inference cluster stores zero logs of prompts or model responses, processes
inference in the European Union, does not use the user's code to train models,
and retains only server metrics needed for cluster maintenance. The same policy
does collect administrative data needed to operate the service, such as
waitlist email, membership details, and billing information. In this guide,
“no NaN data collection” means **no inference-data collection**, not that the
operator has no account or payment records.

NaN's operator also states compliance with the European AI Act. That is a
provider compliance statement; this guide does not turn it into an independent
legal certification. The privacy distinction applies only to NaN: the Zen-free
data caveats above remain in force for those separate OpenCode routes.

### When weak-model-only planning is forbidden

NaN and Zen-free models may still gather evidence, prototype, and implement
bounded phases in the cases below. They must not be the **only** models that
freeze the design, approve the plan, or authorize merge/deployment. Require at
least one frontier/judgment pass (`O5`, `Sol`, `K3`, or `G53`) and the named
human/domain owner where applicable:

- authentication, authorization, tenancy isolation, permissions, secrets,
  cryptography, payments, billing, or fraud controls;
- destructive or hard-to-reverse migrations, deletion, reconciliation, or
  changes to the source of truth for production data;
- public API/schema/protocol compatibility, cryptographic or machine contracts,
  and changes consumed by unknown external clients;
- concurrent/distributed state, leases, idempotency, exactly-once claims,
  recovery, deployment, networking, CI privileges, or supply-chain security;
- legal, safety, medical, financial, privacy, or regulated behavior where an
  incorrect requirement can harm people or create liability;
- an `L/XL` cross-cutting feature with unclear ownership, weak tests, no reliable
  oracle, unfamiliar infrastructure, or disagreement between independent
  models;
- a release-critical change whose rollback is slow, destructive, or untested.

Risk and ambiguity matter more than line count. A large generated-docs change
can be low risk; a one-line authorization bypass can be critical. If no strong
model or qualified human is available, stop at discovery/prototype: do not mark
the design `designed`, freeze acceptance, declare `REVIEW-PASS`, or merge.

### Cost optimization and subscription timing

A single premium **design month** can be a good strategy, with boundaries:

1. Use that month to produce capability-complete product specifications,
   architecture decisions, role/permission matrices, public contracts, risk
   registers, acceptance criteria, roadmap dependencies, and rollback plans.
2. Fully engineer only the next one or two units. Detailed file-level plans age
   quickly as `HEAD`, dependencies, provider behavior, and accepted designs
   change. Add assumptions and revalidation triggers to later roadmap entries.
3. During non-premium months, use NaN or Go to refresh each plan against current
   repository evidence just in time, split work into small phases, execute, and
   run deterministic gates before spending model judgment.
4. For a sensitive release, buy or reserve another premium month for
   `review-change`, `product-audit`, and `audit-pr`. Paying once to plan and then
   using only weak models to implement and self-approve creates an unsafe gap.

Additional levers:

- Keep OpenCode Go active during development-heavy months: its $10 recurring
  price is usually more valuable at planning/review boundaries than spending
  scarce premium context on implementation.
- Use `max` only for ambiguity, security, product-wide sweeps, or disputed
  findings. Use `medium/high` workers for `execute-phase`.
- Let tests, type-checking, builds, linters, and repository-state sensors fail
  first. Do not pay Opus/Sol to discover compiler errors.
- Complete implementation before the normal `review-change` checkpoint. Avoid
  expensive full review after every mechanical phase unless the phase is
  independently deployable or irreversible.
- Preserve clean reviewer contexts, but keep stable system/skill prefixes where
  the host supports prompt caching. Never trade review independence for cache
  savings.
- Measure accepted findings, false positives, rework, wall time, and allowance
  on three to five representative tasks. Optimize accepted outcomes per cost,
  not vendor benchmark rank or nominal free tokens.

### Plans, official sources, and referral links

- NaN official [model catalogue](https://nan.builders/docs/models), [API
  reference](https://nan.builders/docs/api), and [privacy
  policy](https://www.nan.builders/privacy). NaN does not log inference prompts
  or responses, does not train on user code, and processes inference in the EU;
  account and payment records are a separate administrative category. The
  official pages currently disagree on whether DeepSeek V4 Flash receives 500M
  or 2B monthly tokens; use the authenticated dashboard or support answer. Join through the maintainer's
  [NaN referral link](https://cloud.nan.builders/r/7GK06FX8).
- OpenCode [Zen free-model documentation](https://opencode.ai/docs/zen) and
  [Go limits](https://opencode.ai/docs/go/). Go's request counts are estimates
  based on value and observed caching, not guaranteed request quotas. Join
  through the maintainer's
  [OpenCode Go referral link](https://opencode.ai/go?ref=H9JGRCGJZT).
- Anthropic [Claude Pro](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan),
  [Opus 5](https://www.anthropic.com/news/claude-opus-5), and
  [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5) documentation.
- OpenAI [GPT-5.6 plan access](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt/)
  and [Codex pricing and limits](https://chatgpt.com/codex/pricing/). ChatGPT
  Plus already exposes Sol, Terra, and Luna in Codex; Pro primarily increases
  allowance. Sol Pro is not documented as a selectable Codex model.

## Where the pieces live

| Role | Path |
|---|---|
| Canonical Claude-branch tiers | [`docs/workflow/model-routing.yml`](../../../workflow/model-routing.yml) |
| Skill contracts and hand-offs | [`skills/`](../../../../skills/) |
| Skill invocation reference | [`docs/workflow/SKILLS.md`](../../../workflow/SKILLS.md) |
| Dated provider/model research | [`docs/research/model-routing-2026-08-22.md`](../../../research/model-routing-2026-08-22.md) |
| This operational guide | [`docs/site/guides/workflow/model-routing.md`](model-routing.md) |

## Related

- [Workflow skill reference](../../../workflow/SKILLS.md)
- [Canonical Claude model routing](../../../workflow/model-routing.yml)
- [Research snapshot and source notes](../../../research/model-routing-2026-08-22.md)
- [Spanish version](model-routing.es.md)
