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
instruction wins, and nothing in the preset fights you. One distinction worth
reading before you pick: the models are not all processed in the same place —
see [Data residency](#data-residency--what-runs-where) for what runs on the
EU cluster and the manual overrides that keep each posture EU-compliant.

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

**Where the numbers come from.** Every tariff, allowance and limit quoted on
this page restates the recorded snapshot at
[`catalog/nan-catalog-2026-11.jsonc`](catalog/nan-catalog-2026-11.jsonc) —
source URLs, capture date and the docs-vs-quote winner rule in its provenance
header. When the provider changes anything (prices, allowances, the catalog),
update that snapshot first; `test/catalog-parity.test.mjs` then fails on every
tier map, ladder and README row that disagrees, walking you through the rest.

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
| **hy4** | Tencent Hunyuan 4 (external) | 1M | paid · ZDR | 41.7 / 2.1 / 125.05 | 5.5 cr |
| **deepseek-v4-flash** | 305B MoE | 1M | 3B free/mo · ZDR · JSON mode + `json_schema` + OpenAI `tools` | 10.5 / 0.21 / 42 | 1.1 cr |
| **glm5.3-flash** | 320B (18B active) · MIT | 1M | 2B free/mo · ZDR | 5.25 / 1.05 / 17.5 | 1.4 cr |
| **qwen3.8-flash** | 125B (6B active) · qwen license | 1M | 500M free/mo · ZDR · XML tools | 7.5 / 0.8 / 23.5 | 1.9 cr |
| **mimo-v2.6-flash** | Xiaomi omni-modal (external) | 1M | 1B free/mo · ZDR | 7 / 0.14 / 14 | 0.6 cr |
| **qwen3.6** | 35B (3B active) — previous generation | 262K | unlimited cluster model | 0 | 0 |
| **gemma4** | 26B (4B active) | 262K | unlimited cluster model | 0 | 0 |

**Tool calling is OpenAI-`tools`-native on `glm5.3`, `glm5.3-flash`,
`deepseek-v4-flash` and `mimo-v2.6-flash` — and, per the provider's facts, on
the four paid external entries `kimi-k3.1-pro`, `qwen3.8-max`,
`deepseek-v4-pro` and `hy4`.** `qwen3.6`, `qwen3.8-flash` and
`gemma4` document tool calling in XML format — fine for single-shot text
work, not for the executor path's OpenAI-tools harness unless the harness is
XML-aware. Run the tool-calling smoke test in
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

## Phase batching — how much of a unit one context holds

The workflow always allowed running a whole unit in one context instead of one
phase per turn, and always left it to the operator. This package now carries the
model half of that decision as **data**, and one deterministic policy reads it.
It ships **off**: with the key off nothing is inspected and the answer is
today's posture, one phase per turn.

**The capability record.** One entry per billed model, **generated** from the
provider's exported model-facts catalog
(`@gtrabanco/pi-nan-provider`'s `NAN_MODEL_FACTS`, gtrabanco/pi-nan-provider#47)
— never transcribed here. `bun run derive:model-facts` writes
`src/model-capabilities.generated.ts`; `bun run check:model-facts` proves the
committed copy is what the pinned provider facts derive; `test/model-facts.test.mjs`
pins the table below and `test/catalog-parity.test.mjs` pins the record against
the recorded snapshot, so a provider change fails mechanically here first:

| Model | Context window | Tool harness | Cache posture | Phases per context |
|---|---|---|---|---|
| **glm5.3** | 1M | OpenAI `tools` | discounted | 4 |
| **glm5.3-flash** | 1M | OpenAI `tools` | discounted | 4 |
| **deepseek-v4-flash** | 1M | OpenAI `tools` | discounted | 4 |
| **mimo-v2.6-flash** | 1M | OpenAI `tools` | discounted | 4 |
| **kimi-k3.1-pro** | 1M | OpenAI `tools` | discounted | 4 |
| **qwen3.8-max** | 1M | OpenAI `tools` | discounted | 4 |
| **deepseek-v4-pro** | 1M | OpenAI `tools` | discounted | 4 |
| **hy4** | 1M | OpenAI `tools` | discounted | 4 |
| **qwen3.8-flash** | 1M | XML | discounted | 1 |
| **qwen3.6** | 262K | XML | not measured | 1 |
| **gemma4** | 262K | XML | not measured | 1 |

- **Tool harness** is the provider's `toolCalling` fact: `openai-tools` is the
  OpenAI `tools` harness the executor path drives, XML-only tool calling is fine
  for single-shot text work but not for that harness, and a model whose protocol
  nobody has stated says `unmeasured` — a value, never "probably fine".
- **Cache posture** crosses the provider's `cacheMode` with this package's own
  credit tariff: an automatic cache at a `cached` rate below the `input` rate is
  `discounted`, opt-in or unsupported caching bills the input rate (`flat`), and
  a model that states neither is `unmeasured`. The provider's `cost` pair is
  pinned to zero by NaN's credit pool, which is why the credit comparison uses
  the recorded tariff ([`catalog/`](catalog/nan-catalog-2026-11.jsonc)).
- **Phases per context** applies the preset's declared thresholds to those two
  facts: the executor harness plus a window at or above one million tokens
  reaches four, the smaller window reaches two, and a model without the harness
  batches nothing. The thresholds are **policy**, owned by
  `src/phase-batching.ts` — they are not provider data and never enter the
  generated file.
- **Every cell carries its provenance.** The generated file opens with the
  upstream source, author, the exact provider version those facts were first
  read from, and the license; each cell names the provider's own source id for
  the fact it came from. Regenerating at a newer provider release that moved no
  recorded cell rewrites nothing and keeps that pin, so an immaterial catalog
  change lights no package — only a cell that moved does.

**The policy.** A unit is eligible when its risk tier is `passive` or
`standard`, its size tier is `prose` or `small`, and it carries no Relay leg.
On an eligible unit the recommendation is the smallest of the model's ceiling
and the phases that remain; everything else answers one phase per turn, and says
which fact decided it — an unknown model, a `high` tier, a `large` unit, a Relay
leg, an XML-only or undocumented harness, an unmeasured cache, a `flat` one (a
cached read billed at the input rate saves nothing), or a single remaining
phase. **Every one of those is a fail-closed answer**: no fact, no batching.

```jsonc
// the `pi-agentic-workflow` config — the switch, OFF until you say otherwise
{ "phaseBatching": { "enabled": true } }
```

```sh
# what a whole unit would do on this session's model
/nan-phase-batching --risk-tier standard --size-tier small --phases 4
```

The command prints the typed document (`phase-batching@1`, owned by
`@gtrabanco/agentic-workflow-schema`) and nothing beside it — the decision, the
phase count, the reason, the record it read, and the eligibility it was given.
`--relay` marks a Relay leg in the flow, `--model provider/modelId` asks about a
model other than the session's, and a missing or out-of-vocabulary flag is
refused with the supported syntax instead of guessed.

**The gates do not move.** One phase is still one commit, the diff guard still
runs per phase, and the evidence rows are the same rows: batching changes who
runs where, never which gates run. The key also stays **off by default until the
tier-cost corpus (#631) shows, over at least three real units per tier, a
measured saving at equal first-review PASS parity** — the trigger is recorded in
`docs/workflow/CONFIG.md` beside the key, and flipping the default without that
evidence is the change the trigger forbids.

## The doc-index embedding profile

The agentic workflow's retrieval index embeds your project's markdown so a query
can rank semantically as well as by keyword. It reads one block for that — the
`provider` block of the committed `.agentic-workflow/index.json` — and nobody
wants to hand-derive it, so this package ships it.

**It applies by default.** With this package installed and `NAN_API_KEY` present,
loading the session resolves the profile below for the doc index with no
ceremony: no `/agentic-workflow-settings` visit, no `/aw-index` run, no
hand-written `index.json`. The three `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`
variables every runner child inherits are exported from the profile, so
`doc --sync` and `doc --query` — and the `doc_search` tool — resolve the provider
env-only. Nothing is written, and the committed file stays byte-identical.

Three things withhold it, and all three are silent because each one is a
supported state rather than a fault:

- **A provider block you wrote**, whole or partial, in
  `.agentic-workflow/index.json`. Yours is the instruction; the default never
  merges into it, and a block written mid-session wins for the rest of it.
- **No `NAN_API_KEY`**, or an empty one. Nothing changes and the index stays
  keyword-only.
- **Your own export of the `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*` variables**, which
  says you already chose a provider. A trio this package exported itself is
  recognised and withdrawn before the next decision, so it never masquerades as
  your choice.

To pin a value — a conservative pace, another `baseUrl` — write it. The settings
console is still the route that writes a block for you:
`/agentic-workflow-settings` → **`Doc index embedding profile`** shows the block,
per key, with where each value came from (the preset, you, or the engine's
default), and writes it after you say yes:

```jsonc
{
  "version": 1,
  "provider": {
    "baseUrl": "https://api.nan.builders/v1",
    "model": "qwen3-embedding",
    "envVar": "NAN_API_KEY",
    "chunk_limit": 6000,
    "pacing": { "batchSize": 6, "requestsPerMinute": 60 }
  }
}
```

| Value | Where it comes from |
|---|---|
| `baseUrl` | the catalog's `base_url` |
| `model` | **qwen3-embedding** — the catalog's embedding entry: `cost: 0`, 4,096 dimensions, `max_input` 32,768 tokens |
| `envVar` | **NAN_API_KEY** — the variable the same key your chat traffic uses is read from |
| `chunk_limit` | 6,000 characters, measured on this project's ~10.9K-chunk corpus (fix #540) |
| `pacing.batchSize` | 6 texts per request, measured with the same corpus |
| `pacing.requestsPerMinute` | the catalog's per-key request cap: 60 |

One request therefore carries at most 6 × 6,000 = 36,000 characters ≈ 9,000
tokens — a third of the model's 32,768-token input window, so even dense prose
cannot outgrow it. Embeddings bill no credits (`cost: 0`), which is why the pace
is not a spending decision. `maxAttempts` and the retry delays are left to the
engine's defaults on purpose: no NaN document defines them.

**The 60 rpm cap is per API key, and it is shared with your chat traffic.** This
is the one caveat worth reading: Open WebUI, another agent, a script — anything
using the same key spends from the same 60 requests per minute, and a paced
backfill at 60 rpm will collide with a busy chat session (the index retries the
throttled request, but it makes no progress while your chats saturate the key).
The shipped value matches the documented cap and this project's own backfill ran
under it; when you share the key with other tools, ship a conservative pace
instead by writing the value you want — any value you write always wins:

```jsonc
{ "provider": { "pacing": { "requestsPerMinute": 30 } } }
```

**Precedence is per key.** Materializing the profile fills only the keys your
`index.json` leaves absent; a value you (or your team) already wrote is never
rewritten, `pacing` included knob by knob. Re-applying is safe and idempotent,
and taking a later preset change for a key you already have means deleting that
key and applying again. Nothing is written at extension load, on a query, or by
a sync: your committed config changes only when you answer yes.

## Data residency — what runs where

**Not every model in the tables above processes under the same legal
roof.** The chat models split in two, and the split is the one marked in the
catalog:

- **Runs on the EU cluster.** `glm5.3`, `glm5.3-flash`, `deepseek-v4-flash`,
  `qwen3.8-flash`, `qwen3.6` and `gemma4` are served from the operator's own
  infrastructure — Helmcode S.L., Spain (platform policy supervised by the
  Spanish DPA, the AEPD), all of them ZDR: prompts and completions are not
  stored.
- **External provider — do not assume EU processing.** `mimo-v2.6-flash`,
  `kimi-k3.1-pro`, `qwen3.8-max`, `deepseek-v4-pro` and `hy4` are served by
  third-party providers. The catalog documents zero data retention for them,
  but it does not name the third parties or say where their GPUs sit. If EU
  processing is crucial for you (a regulatory duty, a data-processing
  agreement, a sector rule), treat these five as **not EU-compliant until you
  verify the serving route yourself** — and therefore as rungs to strip out of
  the ladders.

The preset ships no separate EU profiles — the flexible way to get them is the
mechanism that already exists: **a user-defined profile shadowing a preset
chain name wins over the preset entirely**. Paste the blocks below into your
`pi-agentic-workflow` config and every posture stays EU-only, whatever
`presetProfile` selects. Keep `tierRouting` exactly as you had it; it keeps routing the rest of the
chain (the `default` profile and anything not shadowed).

```json
{
  "profiles": {
    "nan.quality": {
      "default": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
      "commands": {
        "audit-pr": { "model": ["nan/glm5.3", "nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "product-audit": { "model": ["nan/glm5.3", "nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "unit-lane": { "model": ["nan/glm5.3", "nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "review-change": { "model": ["nan/glm5.3-flash", "nan/glm5.3", "nan/deepseek-v4-flash"], "thinking": "high" },
        "triage-issue": { "model": ["nan/glm5.3-flash", "nan/glm5.3", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "init-workspace": { "model": ["nan/glm5.3-flash", "nan/glm5.3", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "advance": { "model": ["nan/glm5.3-flash", "nan/glm5.3", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "execute-phase": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "fold-findings": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "discover-repository-state": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "resolve-repository-state": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "audit-docs": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "log-session": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "workflow-status": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" }
      }
    },
    "nan.balanced": {
      "default": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], "thinking": "inherit" },
      "commands": {
        "audit-pr": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/glm5.3"], "thinking": "high" },
        "product-audit": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/glm5.3"], "thinking": "high" },
        "unit-lane": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/glm5.3"], "thinking": "high" },
        "review-change": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "triage-issue": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "init-workspace": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "advance": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "execute-phase": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], "thinking": "inherit" },
        "fold-findings": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], "thinking": "inherit" },
        "discover-repository-state": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], "thinking": "inherit" },
        "resolve-repository-state": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash"], "thinking": "inherit" },
        "audit-docs": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "log-session": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "workflow-status": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" }
      }
    },
    "nan.economy": {
      "default": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
      "commands": {
        "audit-pr": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "product-audit": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "unit-lane": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "review-change": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "triage-issue": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "init-workspace": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "advance": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "inherit" },
        "audit-docs": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "log-session": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "workflow-status": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" }
      }
    },
    "nan.no-credits-continue-working": {
      "default": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash", "nan/qwen3.8-flash", "nan/qwen3.6"], "thinking": "inherit" },
      "commands": {
        "audit-pr": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/qwen3.6"], "thinking": "high" },
        "product-audit": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/qwen3.6"], "thinking": "high" },
        "unit-lane": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash"], "thinking": "high" },
        "triage-issue": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/qwen3.8-flash"], "thinking": "inherit" },
        "init-workspace": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/qwen3.8-flash"], "thinking": "inherit" },
        "advance": { "model": ["nan/glm5.3-flash", "nan/deepseek-v4-flash", "nan/qwen3.8-flash"], "thinking": "inherit" },
        "execute-phase": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash", "nan/qwen3.8-flash", "nan/qwen3.6"], "thinking": "inherit" },
        "fold-findings": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash", "nan/qwen3.8-flash", "nan/qwen3.6"], "thinking": "inherit" },
        "discover-repository-state": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash", "nan/qwen3.8-flash", "nan/qwen3.6"], "thinking": "inherit" },
        "resolve-repository-state": { "model": ["nan/deepseek-v4-flash", "nan/glm5.3-flash", "nan/qwen3.8-flash", "nan/qwen3.6"], "thinking": "inherit" },
        "audit-docs": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "log-session": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" },
        "workflow-status": { "model": ["nan/qwen3.6", "nan/gemma4"], "thinking": "inherit" }
      }
    }
  }
}
```

The blocks above are deliberately **complete**: a user-defined profile
replaces the preset's derivation wholesale — including tier routing, which no
longer applies to a shadowed chain name — so every command is spelled out,
with the mechanical rows pinned to the zero-credit EU chain by hand. Three
boundaries to know:

- **Spawned review passes are separate.** The per-pass model declarations
  (`passes` in the config, issue #201) route `review-change`'s spawned passes
  independently of the command ladder — if you pin EU routes for commands,
  pin the passes you actually use the same way.
- **Spawned task classes are not user-overridable today.** A low-stakes class
  (`summarization`, `triage`, `mechanical-logging`, `catalog-step`,
  `conduction`) already resolves to the zero-credit EU chain under tier routing
  — EU-safe on every posture. A strength-sensitive class (`review-axis`,
  `audit-verdict`, `planning`) resolves from the selected posture's published
  default ladder, which still contains external-provider rungs in `quality`
  and `balanced` (the `mimo-v2.6-flash` design rung) — that route is not
  reachable by either knob above. If EU-only spawned planning matters for you,
  it is a real gap: say so and it becomes a unit.
- **ZDR is not residency.** All ten models document zero data retention, which
  bounds what is kept — it says nothing about where the GPUs processing your
  prompts sit. The two claims live in different sections of the catalog on
  purpose.

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

Example `tierRouting` in the `agentic-workflow` config:

```json
{ "tierRouting": { "enabled": true, "skills": { "audit-docs": false } } }
```

## Sources — where these numbers come from

Every claim on this page traces to one of the surfaces below. Consult the
source, not this README, when a decision matters; the snapshot file
([`catalog/nan-catalog-2026-11.jsonc`](catalog/nan-catalog-2026-11.jsonc))
records what this page was built from and when.

### First-party (the provider)

| Source | Where it lives | What goes here |
|---|---|---|
| Model catalog, capabilities, reasoning matrix, rate limits | [nan.builders/docs/models](https://nan.builders/docs/models) | sizes, contexts, tool-calling format, the reasoning-control table, per-model concurrency/tpm, the rolling-4h window |
| Current per-model prices | [cloud.nan.builders/tokens](https://cloud.nan.builders/tokens) | the live credits-per-1M table the snapshot's November 2026 numbers came from |
| Free allowances, plans, packs | [cloud.nan.builders](https://cloud.nan.builders/r/7GK06FX8) (member panel) | monthly quotas per model, subscription pricing, pack pricing, billing-period resets |
| Community cost guide (cost-only, by @ntizar) | [nan.builders/es/model-guide](https://nan.builders/es/model-guide) | the blended `typical credits per 1M` figures and the cached/equilibrated/output scenario math |
| Operator identity & privacy | [nan.builders/privacy](https://nan.builders/privacy) | Helmcode S.L. (Spain), the AEPD-supervised policy behind the residency note |

### Independent evaluators (the evidence the picks are grounded on)

| Evaluator | Where it lives | What goes here |
|---|---|---|
| Artificial Analysis | [artificialanalysis.ai](https://artificialanalysis.ai) (per-model pages, e.g. [glm5.3-flash vs glm5.3](https://artificialanalysis.ai/models/comparisons/glm-5-3-flash-vs-glm-5-3), [mimo-v2.6-flash](https://artificialanalysis.ai/models/mimo-v2-6-flash)) | Intelligence Index, Terminal-Bench runs, GDPval-AA Elo, verbosity/speed, per-provider price tables |
| OpenRouter model pages | [openrouter.ai/z-ai/glm-5.3-flash](https://openrouter.ai/z-ai/glm-5.3-flash) | aggregated per-benchmark score tables (AA, Design Arena, Vals AI rows) in one place |
| Vals AI | [vals.ai](https://vals.ai) | the independent Terminal-Bench 2.1 run that put deepseek-v4-pro-0813 at 54.68 against the vendor's 87.9 |
| NIST CAISI replication | [danilchenko.dev/deepseek-v4-pro-review](https://www.danilchenko.dev/posts/deepseek-v4-pro-review) (collects the NIST CAISI evaluation) | the 74.0 vs 80.6 SWE-bench Verified gap behind keeping deepseek-v4-pro out of leading rungs |
| Provider-neutral trackers | [benchlm.ai](https://benchlm.ai), [benchable.ai](https://benchable.ai) | cross-model category tables with evidence-status labels; empty third-party sections are themselves signal |

### Vendor-run surfaces (cited only with that label)

| Vendor | Where it lives | What goes here |
|---|---|---|
| DeepSeek | [github.com/deepseek-ai/DeepSeek-V4-Flash-0731](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731) (model card), [morphllm.com/deepseek-v4](https://www.morphllm.com/deepseek-v4) (annotated) | agentic benchmark tables; the unreplicated harness behind the Pro claims |
| Z.ai | [z.ai/blog/glm-5.3](https://z.ai/blog/glm-5.3) | Terminal-Bench 3.0 / DeepSWE / CyberGym tables for the GLM family |
| Xiaomi | [mimo.mi.com/docs/en-US/news](https://mimo.mi.com/docs/en-US/news), [huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Flash-RL) | MiMo V2.6 launch tables |
| Tencent | [github.com/Tencent-Hunyuan/Hy4-preview](https://github.com/Tencent-Hunyuan/Hy4-preview) | the Hy4 benchmark appendix (vendor-run; the `hy4` caveat on this page) |
| Qwen | [evolink.ai/blog/qwen3-8-benchmark](https://evolink.ai/blog/qwen3-8-benchmark), [zenmux.ai/blog/qwen38-max-benchmarks-specs-pricing-api](https://zenmux.ai/blog/qwen38-max-benchmarks-specs-pricing-api) | qwen3.8-max official results and the vendor-vs-independent caveats |

### The reading rule

Independently verified beats vendor-reported; vendor-reported beats vibes —
and an empty third-party section is a finding, not a zero. Before pinning any
rung, re-check the current leaderboard: this landscape moves monthly, and the
community-voted cluster changes quarterly (`qwen3.6` unlimited is "for now",
the same as ever).

## models.json — the compatibility channel

This preset routes only through `models.json`, so the file is the first place to
look when a NaN model behaves differently from the same model on another
gateway. Two parts of that file are worth knowing before you reach for a code
change:

- **`$schema` — editor validation.** Add
  `"$schema": "https://pi.dev/schemas/models.schema.json"` at the top of the
  file: the published schema validates and completes every key below, so a typo
  shows up as you type instead of as a 400 at request time.
- **`compat.*` — the sanctioned per-model overrides.** Set them under the
  provider (all its models) or under one model; they exist because gateways
  differ in what they accept, not because the model is broken:

| Key | Type | Set it when |
|---|---|---|
| `supportsMessageThreads` | boolean | A gateway forwards Anthropic message threads, or rejects the `thread` field — on by default only for a base URL on `api.anthropic.com`. |
| `requiresToolsWithToolHistory` | boolean | The endpoint demands `"tools": []` once the conversation has tool calls, even when every tool is disabled (older proxies in front of Anthropic). |
| `promptCacheKeyMode` | `"auto"` \| `"enabled"` \| `"disabled"` | The endpoint needs `prompt_cache_key` sent (compatible proxy) or rejects it. |
| `requiresNonNullAssistantContent` | boolean | The endpoint wants `""` instead of `null` for a replayed assistant message that carried only tool calls. |

```json
{
  "$schema": "https://pi.dev/schemas/models.schema.json",
  "providers": {
    "nan": {
      "compat": { "requiresToolsWithToolHistory": true }
    }
  }
}
```

These keys are Pi's, not this preset's: the full meaning of each one (defaults,
which APIs they touch) is in Pi's own
[models configuration reference](https://pi.dev/docs/latest/models-configuration),
which ships with the installed host as `docs/models-configuration.md`.

**A typo is reported, not swallowed.** Since Pi 1.7.0 a schema error in
`models.json` comes back as a warning in the host's `diagnostics`, so print,
JSON and RPC runs name the offending field —
`Warning: models.json error: Invalid models.json schema: providers.nan.models.0.contextWindow: must be number`
— instead of only the misleading `Model "…" not found` / `No API key found`
a failed lookup produced before that release. A headless run that fails on a
model now tells the two causes apart.

**When a compatibility key is not enough.** A request the gateway rejects at the
protocol level is not a config problem, and the recorded
`max_completion_tokens` workaround — no `token` parameter on the request, the
limit left to the gateway — belongs there: it is a finding against the NaN
provider package (pi-nan-provider issue #34), tracked with that package, and
this preset never emits it. Report it where it lives rather than working around
it in `models.json`.

## Verify your catalog first

Run `GET /v1/models` with your own key and route only to models it actually
returns; the exact set depends on your plan (premium for `glm5.3`) and the
current catalog. The community-voted cluster changes quarterly.

Whisper, Kokoro, Rerank, Qwen3 Embedding and Flux 2 Klein are NaN's hosted
audio/retrieval/image models — this workflow never routes to them. Model
strength above is framed by benchmark evidence with provenance named
(independent where it exists, vendor-run marked as such) — re-check against a
current leaderboard before pinning; this landscape moves fast.
