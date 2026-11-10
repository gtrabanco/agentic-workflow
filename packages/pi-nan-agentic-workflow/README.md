# @gtrabanco/pi-nan-agentic-workflow

> The optional NaN.builders preset for [`@gtrabanco/pi-agentic-workflow`](../pi-agentic-workflow/) —
> the provider profile, its four cost-posture ladders, and the quota-tier
> routing policy, in one small independently versioned package (issue #388).

The main pi package ships **provider-neutral**: with only it installed,
`recommendedModels: true` is a documented no-op and every command routes on
your session's model. Installing this companion next to it — with **no config
change** — restores NaN-aware routing: the built-in `nan` profiles appear in
the resolution chain (listed in `/agentic-workflow-settings`, protected by the
built-in-not-editable rule), and the ladders below apply.

**Flexible, but opinionated by default.** Every choice on this page is a config
key you can override. With nothing configured, the preset routes everything
through the **`economy`** posture: the ladder tuned to deliver a reasonable
quality on most tasks while living almost entirely inside the free monthly
allowances. If you want something else, say so once in config — the nearest
instruction wins, and nothing in the preset fights you.

## Install

```sh
# From a Pi session (the main package is a prerequisite):
pi install @gtrabanco/pi-nan-agentic-workflow
```

The package is pure data plus one registration entry: on load it registers the
preset into the main package's provider-preset seam. Nothing else changes.

## Choosing a posture

The preset ships four **named profiles** — four answers to "how much should
model quality cost me?". Select one (or a fallback list) with the generic
`presetProfile` config key, which the main package documents:

```json
{ "presetProfile": "economy" }
```

An **ordered array** is the interesting one: first entry = most preferred. When
a profile's route is unusable, the next entry is probed — so a list rides down
the catalog as capacity runs out:

```json
{ "presetProfile": ["quality", "balanced", "economy", "no-credits-continue-working"] }
```

- Profile names are `quality`, `balanced`, `economy`,
  `no-credits-continue-working`; the bare chain entry `nan` always resolves
  the preset's default (`economy`), and each named entry travels as
  `nan.<profile>` in the chain.
- Unknown names are skipped; if a selection names nothing the catalog carries,
  the default posture is used — a typo never silently drops NaN out of the
  chain.
- **Your own profiles win.** Declare a profile under the same chain name in
  `profiles` (e.g. `"nan.economy"`) and your definition replaces the preset's
  entirely; add it to `profileOrder` and it takes precedence like any user
  profile (feature 63). Want a hand-tuned ladder? It composes.
- `tierRouting` still applies (see below): it is the opt-out for the
  preset's tier policy, independent of which posture is selected.
- `tierRouting: false` restores the selected profile's exact published ladder —
  no silent quality regression for users who disable routing.

**When you are out of credits** (balance zero, quotas drained), the
`no-credits-continue-working` posture keeps the workflow alive on the models
that never consume credits: the two unlimited cluster models, plus the flash
tier while its monthly allowances hold — because an unused free allowance is
yours whether or not you have credits. The honest options when that posture's
verdicts also thin out:

1. **Buy the smallest pack** — 1,000 credits for €24.70 is roughly 1.6–1.9
   billion tokens on the flash tier; a subscription month (7,000 credits) is
   more than the flash allowances can burn through in typical agentic work.
2. **Wait for the billing reset** — every quota resets with each billing
   period; the unlimited cluster models are not affected by the wait.
3. Keep working in `no-credits-continue-working` meanwhile — judgment-heavy
   verdicts defer to a human, mechanical work continues uninterrupted.

## Plans, credits, and what actually costs money

All chatting models draw from one pool of credits (NaN Cloud,
[sign-up via this referral link](https://cloud.nan.builders/r/7GK06FX8); full
catalog: [nan.builders/docs/models](https://nan.builders/docs/models)). The
billing model, in one paragraph:

- **Subscriptions** renew each billing period: €70 → 7,000 credits/month,
  €200 → 20,000 credits/month. **Credit packs** are one-off purchases —
  1,000 cr (€24.70), 5,000 cr (€116.85), 25,000 cr (€550.05), the 5% member
  discount already applied; custom top-ups €5–1,000. Pack credits do not
  renew; all credits expire 6 months after purchase. Auto-recharge is off by
  default.
- **Free allowances reset each billing period** and are consumed before a
  single credit is touched. Combined they give the flash tier roughly
  **6.5 billion tokens/month for free** on the flash ladders — which is why the
  default posture rarely burns credits at all.
- **Credits pay for**: any flash-tier overflow beyond an allowance, the
  premium `glm5.3`, and the four paid "larger" models from token one.
- **Rate limits per key**: 60 requests/min; concurrency 7 simultaneous
  (base plan) / 10 (premium) across all models, with per-model caps of
  7/10 (`glm5.3`, `glm5.3-flash`, `deepseek-v4-flash`, `qwen3.8-flash`) and 5
  (`mimo-v2.6-flash`, `qwen3.6`, `gemma4`); 1.5M tokens/min for the latter
  tier of models where a tpm cap applies. `glm5.3` additionally caps at
  400M tokens per rolling 4-hour window — a heavy coding-agent run reaches
  that first, so the ladders below keep premium rungs for judgment slots and
  never for volume.

### The fleet

Tariffs are credits per 1M tokens *after* the free allowance (November 2026
tariff table). `typical` is the provider's published blended figure — treat it
as an order of magnitude, not a quote.

| Model | Size | Context | Billing | In / cached / out credits per 1M | Typical |
|---|---|---|---|---|---|
| **glm5.3** | ~753B MoE | 1M | premium plan required · 3B free/mo · 400M/4h rolling | 49 / 1.05 / 154 | 11.5 cr |
| **kimi-k3.1-pro** | Moonshot frontier (external) | 1M | paid · ZDR | 100 / 10 / 500 (+100 cache write) | 19.9 cr |
| **qwen3.8-max** | 2.4T-class Qwen (external) | 1M | paid · ZDR | 100 / 12.5 / 300 | 20.2 cr |
| **deepseek-v4-pro** | DeepSeek large (external) | 1M | paid · ZDR | 66 / 2.2 / 198 | 7.7 cr |
| **hy4** | Tencent Hunyuan 4 (external) | 1M | paid · ZDR | 41.7 / 2.1 / 125 | 5.5 cr |
| **deepseek-v4-flash** | 305B MoE | 1M | 3B free/mo · ZDR · JSON mode + `json_schema` (no tools) | 10.5 / 0.21 / 42 | 1.1 cr |
| **glm5.3-flash** | 320B (18B active) · MIT | 1M | 2B free/mo · ZDR | 5.25 / 1.05 / 17.5 | 1.4 cr |
| **qwen3.8-flash** | 125B (6B active) · qwen license | 1M | 500M free/mo · ZDR · XML tools | 7.5 / 0.8 / 23.5 | 1.9 cr |
| **mimo-v2.6-flash** | Xiaomi omni-modal (external) | 1M | 1B free/mo · ZDR | 7 / 0.14 / 14 | 0.6 cr |
| **qwen3.6** | 35B (3B active) — previous generation | 262K | unlimited cluster model | 0 | 0 |
| **gemma4** | 26B (4B active) | 262K | unlimited cluster model | 0 | 0 |

**Tool calling is OpenAI-`tools`-native only on `glm5.3`, `glm5.3-flash`,
`deepseek-v4-flash` and `mimo-v2.6-flash`.** `qwen3.6`, `qwen3.8-flash` and
`gemma4` document tool calling in XML format — fine for single-shot text
work, not for the executor path's OpenAI-tools harness unless the harness is
XML-aware. The executor rungs therefore stay on the four function-calling
models. Run the tool-calling smoke test in
[`docs/workflow/GOLDEN_FIXTURE.md`](../../docs/workflow/GOLDEN_FIXTURE.md)
before promoting any model into that path.

**Reasoning control per model** (per the API reference — verified against the
November docs, superseding the older "cannot be turned off" notes):

| Model | Off switch (`none`) | Other values |
|---|---|---|
| **glm5.3** · **glm5.3-flash** | not possible — GLM always reasons; `none` applies as `minimal` | `minimal`–`max`; higher reasons longer |
| **deepseek-v4-flash** | off, no reasoning tokens | `minimal`–`max` are hints, not caps; a lower effort usually reasons less |
| **qwen3.8-flash** | off, no reasoning tokens (reasoning is on by default) | `minimal`–`max` steer depth (hints); a `thinking_budget` (1–32768) is a hard cap |
| **mimo-v2.6-flash** | off, no reasoning tokens | `low`–`max`; `minimal` applies as `low` |
| **qwen3.6** · **gemma4** | off (`minimal` also turns it off) | Chat Completions values cap the reasoning phase: 2,048 / 8,192 / 16,384 / 32,768 tokens |

Reasoning traces arrive in `message.reasoning_content`. Cap any agentic loop's
`max_tokens` with headroom, stream long outputs, and note that a reasoning-only
stream is closed by the platform (a `finish_reason: "length"` on an empty
delta, not billed) if a model plans without converging.

## The preferred ladders

The four postures side by side, per task class. Rungs are ordered: the router
probes down the chain and the first usable rung serves the command; profiles
differ in how eagerly they spend credits and in how far a judgment rung is
allowed to stretch.

| Task | Skills | Quality | Balanced | Economy | No-credits |
|---|---|---|---|---|---|
| **Merge gates** | `audit-pr`, `product-audit` (thinking high) | 1. **glm5.3** → 2. **kimi-k3.1-pro** → 3. **deepseek-v4-flash** → defer | 1. **glm5.3-flash** → 2. **mimo-v2.6-flash** → 3. **deepseek-v4-pro** → defer | 1. **mimo-v2.6-flash** → 2. **glm5.3-flash** → 3. **deepseek-v4-flash** → defer | 1. **mimo-v2.6-flash** → 2. **glm5.3-flash** → 3. **deepseek-v4-flash** → 4. **qwen3.6** (re-checked verdicts only) → defer to the human |
| **Product definition** | `unit-lane` design step (thinking high) | 1. **glm5.3** → 2. **kimi-k3.1-pro** → 3. **mimo-v2.6-flash** | 1. **mimo-v2.6-flash** → 2. **glm5.3-flash** → 3. **deepseek-v4-pro** | 1. **mimo-v2.6-flash** → 2. **glm5.3-flash** | 1. **mimo-v2.6-flash** → 2. **glm5.3-flash** → 3. **deepseek-v4-flash** |
| **Planning / triage** | `review-change` (thinking high), `triage-issue`, `init-workspace`, `advance` | 1. **glm5.3-flash** → 2. **glm5.3** → 3. **deepseek-v4-flash** | 1. **glm5.3-flash** → 2. **deepseek-v4-flash** → 3. **deepseek-v4-pro** | 1. **glm5.3-flash** → 2. **mimo-v2.6-flash** | 1. **glm5.3-flash** → 2. **deepseek-v4-flash** → 3. **qwen3.8-flash** |
| **Execution / mechanical** | `execute-phase`, `fold-findings`, `discover-repository-state`, `resolve-repository-state` | 1. **kimi-k3.1-pro** → 2. **glm5.3** → 3. **deepseek-v4-flash** | 1. **deepseek-v4-flash** → 2. **glm5.3-flash** → 3. **mimo-v2.6-flash** | 1. **glm5.3-flash** → 2. **mimo-v2.6-flash** → 3. **deepseek-v4-flash** | 1. **deepseek-v4-flash** → 2. **glm5.3-flash** → 3. **qwen3.8-flash** → 4. **qwen3.6** |
| **Cheap** | `log-session`, `workflow-status` (tier-routed — see below) | 1. **qwen3.6** → 2. **qwen3.8-flash** | 1. **qwen3.6** → 2. **gemma4** → 3. **qwen3.8-flash** | 1. **qwen3.6** → 2. **gemma4** | 1. **qwen3.6** → 2. **gemma4** |

**Why these picks** (independent evidence first, vendor claims flagged):

- `glm5.3-flash` is the fleet's best credit-per-quality workhorse with
  independent verification: it matches `glm5.3` on Terminal-Bench 2.1 (84.3 vs
  84-ish) and on real-world agentic work (GDPval-AA Elo within the margin of
  error), at roughly a tenth of the cost per task. Cache-heavy agent loops
  (an executor is exactly that) reach the cluster minimum, ~4.4 credits/1M at
  a 60% cache hit rate; MIT-licensed, NaN-hosted GPUs.
- `kimi-k3.1-pro` posts the strongest *independently measured* agentic coding
  numbers in the fleet (67% Terminal-Bench 4.0 per Artificial Analysis;
  GDPval-AA 1,846 Elo, third overall) — which is why it leads the quality
  posture's executor row despite being the most expensive model here (500
  credits/1M output, plus the fleet's only cache-write fee). Cost-no-object is
  the posture's contract.
- `glm5.3` remains the long-horizon specialist (open-source SOTA on
  Terminal-Bench 3.0, the fleet's best CyberGym score) and needs the premium
  plan; its always-on reasoning and 400M/4h rolling window make it a judgment
  rung, never a volume rung.
- `deepseek-v4-pro`'s vendor claims are the least independently replicated of
  the large tier: NIST measured 74.0 on SWE-bench Verified against the
  claimed 80.6, an independent Terminal-Bench run scored 54.68 against the
  claimed 87.9, and its Artificial Analysis Intelligence Index sits one point
  above `deepseek-v4-flash`. It stays in the ladders only as an escalation
  rung (balanced) — never as a recommendation to start from, and never in the
  cost-minimal posture.
- `mimo-v2.6-flash` is the cheapest model in real blended use (0.6 typical,
  ~1,666M tokens per 1,000 credits, its reasoning is now fully switchable)
  and a different model family from the executors, which is what makes it
  valuable as the independent reviewer rung. Its caveat: it is served as an
  external provider (not NaN's own GPUs), caps at 5 concurrent requests, and
  independent agent-suite results are mixed where vendor ones are strong.
- `qwen3.8-max`: an elite exam-style reasoner (GPQA 92+) that is *not* a
  top-tier coding agent (DeepSWE 56.6, mid-pack agentic rank). At 20.2
  credits/1M it wins no task class in this workflow, so no ladder routes to
  it; documented here so its absence is a decision, not an oversight.
- `hy4`: the cheapest of the large tier (181M tokens per 1,000 credits) and
  the long-document specialist, but with only vendor-run evidence at this
  time and a 64K output cap. Treat it as a candidate for long-document passes
  pending a golden-fixture smoke run, not a default rung.
- `qwen3.6` and `gemma4` cost no credits under any plan and never burn out —
  they are the zero-credit floor every ladder's mechanical row stands on
  (`qwen3.6`'s OpenAI-`tools` smoke pass is recorded in
  [`GOLDEN_FIXTURE.md`](../../docs/workflow/GOLDEN_FIXTURE.md); set reasoning
  off with `none` so a log line pays zero thinking tokens). They are previous
  generation (the provider itself recommends `deepseek-v4-flash` to start
  from), so they stay off the executor layer except as the last rung in the
  no-credits posture, where their output is only ever *re-checked* reasoning.

**`unit-lane` spans two rows — pick by the strongest step its triage returns,**
not by the skill's name. The lane runs its judgment steps (triage, design,
plan, evidence, review, close-out) in one session, so the model must cover the
highest-class step it will reach; execution phases hand off to `execute-phase`
one turn each at the phase's tier. A lane whose triage includes `design` reads
the Product definition row; a lane of triage → plan with no `design` reads
Planning / triage.

**Folding `review-change`/`audit-pr` findings** routes through the standalone
`fold-findings` skill (falling back to `execute-phase`'s embedded fold cycle
where a separate invocation isn't available), and follows the row rule of
thumb: a routine/mechanical finding fixes on the Execution row; a subtle
finding (logic, security, architecture) fixes on the ladder of the review that
found it. The fixing model is never weaker than the one that wrote the
original code — otherwise the fix itself needs re-catching on re-review.

**Adversarial review (`review-change --adversarial N` / `--synthesize`):**
reviewers never weaker than the model that authored the diff, and never the
author's own family. The fleet carries five families across the four postures
(GLM, DeepSeek, Moonshot, Xiaomi, Qwen), so decorrelated reviewer pairs are a
routing decision, not a purchase: e.g. under Balanced, a
`deepseek-v4-flash`-authored change reviews on `mimo-v2.6-flash` +
`glm5.3-flash`; under Quality, add `glm5.3` or `kimi-k3.1-pro` as a third.
Fan-out caps at ≤3–4 concurrent (mimo caps at 5 by itself; an agentic loop
spends one request per tool round-trip, so parallel agents hit 60 rpm
quickly).

## Tier routing (amendment 1, re-cut for the tariff model)

The November tariffs changed what "saving" means: the flash tier's free
allowances are large enough that executor-class work on them is effectively
free, while the unlimited cluster models are too small and too
XML-tool-bound for the executor path. The tier policy therefore demotes only
the mechanical, one-way passes:

- **Demoted under routing-on (default): `log-session`, `workflow-status`,
  `audit-docs`** — and spawned task classes classified non-strength-sensitive
  (`summarization`, `triage`, `mechanical-logging`, `catalog-step`,
  `conduction`). These ride the zero-credit chain: `nan/qwen3.6` first, then
  `nan/gemma4` — models that cost no credits under any plan and never run out.
- **Everything else runs its profile's ladder verbatim** — judgment slots
  (`audit-pr`, `product-audit`, `review-change`, `unit-lane`) and executor
  phases included; their rungs live inside the free allowances by design.
- **Opt-out, two levels.** Global: `"tierRouting": false` (or
  `{"enabled": false}`). Per skill: `{"skills": {"log-session": false}}`. With
  the opt-out applied, the affected routes match the profile's published
  ladder exactly.
- **Tier changes are one-line data edits.** The billing map (`NAN_MODELS`)
  carries the tariff facts; when the provider changes allowances or prices,
  edit it and re-cut the ladders beside it.

Example `tierRouting` in `agentic-workflow.json`:

```json
{ "tierRouting": { "enabled": true, "skills": { "audit-docs": false } } }
```

## Verify your catalog first

Run `GET /v1/models` with your own key and route only to models it actually
returns; the exact set depends on your plan (premium for `glm5.3`) and the
current catalog. The community-voted cluster changes quarterly.

Whisper, Kokoro, Rerank, Qwen3 Embedding and Flux 2 Klein are NaN's hosted
audio/retrieval/image models — this workflow never routes to them. Model
strength above is framed by benchmark evidence with provenance named
(independent where it exists, vendor-run marked as such) — re-check against a
current leaderboard before pinning; this landscape moves fast.
