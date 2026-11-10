# @gtrabanco/pi-nan-agentic-workflow

> The optional NaN.builders preset for [`@gtrabanco/pi-agentic-workflow`](../pi-agentic-workflow/) —
> the provider profile, the per-skill model ladder, and the quota-tier routing
> policy, in one small independently versioned package (issue #388).

The main pi package ships **provider-neutral**: with only it installed,
`recommendedModels: true` is a documented no-op and every command routes on
your session's model. Installing this companion next to it — with **no config
change** — restores NaN-aware routing: the built-in `nan` profile appears in
the resolution chain (listed in `/agentic-workflow-settings`, protected by the
built-in-not-editable rule), and the ladders below apply.

## Install

```sh
# From a Pi session (the main package is a prerequisite):
pi install @gtrabanco/pi-nan-agentic-workflow
```

The package is pure data plus one registration entry: on load it registers the
preset into the main package's provider-preset seam. Nothing else changes.

## Quota-tier routing (amendment 1)

Every model declares its quota tier as data (`src/preset.ts` → `NAN_MODELS`);
ladders derive their order from tier + task class, never from a hand-ordered
array. The policy:

- **Unlimited-first for low-stakes work.** Summarization, mechanical logging,
  triage-style passes and cheap catalog steps default to `qwen3.6`-first (the
  unlimited cluster tier), with `gemma4` as the only other unlimited rung.
- **The limited tier is reserved for strength-sensitive skills** — the output
  quality is load-bearing there. The current classification, visible per skill:
  `audit-pr`, `product-audit`, `review-change`, `unit-lane` (keep the published
  limited-first ladders below, thinking `high`).
- **Spawned work follows the same policy** (subagents, child sessions, conductor
  continuations): the task-class catalog (`TASK_CLASSES`) classifies
  `review-axis`, `audit-verdict`, `planning` as strength-sensitive;
  `summarization`, `triage`, `mechanical-logging`, `catalog-step`, `conduction`
  as unlimited-eligible.
- **Opt-out, two levels.** Global: `"tierRouting": false` (or
  `{"enabled": false}`). Per skill: `{"skills": {"log-session": false}}`. With
  the opt-out on, every ladder matches the published order below exactly — no
  silent quality regression.
- **Tier changes are one-line data edits.** `qwen3.6` unlimited is "for now":
  when the provider changes its quota structure, edit `NAN_MODELS` and every
  ladder follows.

Example `tierRouting` in `agentic-workflow.json`:

```json
{ "tierRouting": { "enabled": true, "skills": { "review-change": false } } }
```

## The NaN fleet guidance

### Running on [NaN.builders](https://cloud.nan.builders/r/7GK06FX8)

[NaN Cloud](https://cloud.nan.builders/r/7GK06FX8) serves the open-weight
frontier ([full catalog](https://nan.builders/docs/models): glm5.3 ~753B MoE ·
glm5.3-flash 320B (18B active) · deepseek-v4-flash 305B · mimo-v2.6-flash
(omnimodal, 1M ctx) · mimo-v2.5 310B · qwen3.8-flash 125B (6B active) ·
gemma4 26B (4B active) · qwen3.6 35B (3B active)) behind an OpenAI-compatible
API (`https://api.nan.builders/v1`).
Reasoning control is **per-model, not a uniform dial** — see the matrix below
for how each model maps onto this workflow's `effort:` tiers. Sign up via
[this referral link](https://cloud.nan.builders/r/7GK06FX8).

**Two tiers, not one primary.** `glm5.3` is the premium model: it requires the
**GLM 5.3 premium membership**, carries a 3,000M-token allowance per billing
period, and is capped at 400M tokens per rolling 4 hours (the cap a heavy
coding-agent run reaches first). Without that membership it is unavailable, so
the picks below split into a premium column and a basic-plan ladder.

> **Verify your catalog first.** Run `GET /v1/models` with your own key and
> route only to models it actually returns; the exact set depends on your plan
> and the current catalog.

**Quota-aware routing rule.** Monthly allowances per member:
**deepseek-v4-flash** 3B, **glm5.3-flash** 2B, **mimo-v2.5** and
**mimo-v2.6-flash** 1.0B each, **qwen3.8-flash** 500M tokens, **glm5.3** 3,000M
per billing period plus the 400M rolling-4h window. **qwen3.6** and **gemma4**
are the two *cluster models* and carry **no token counter**: neither has a quota
row in [the catalog](https://nan.builders/docs/models), the membership FAQ's
answer to "Is it really unlimited tokens?" is "On the cluster models, no
counter", and the `nan_member` tier lists "No token counter on the cluster
models". So on this plan they — not deepseek — are the default for high-volume
non-judgment work. "Unlimited" is still bounded by the per-key limits below
(60 rpm, 1.5M tpm per model, 5 concurrent requests per model). Reserve the 1M-context budgets for
long-context work and merge-gating verdicts; push re-checkable and mechanical
volume onto the cheaper models.

**Reasoning control per model** (per the API reference) — map this workflow's
`effort:` values through this matrix instead of assuming a shared dial:

| Model | Control | Default | `effort:` mapping |
|---|---|---|---|
| **glm5.3** | `reasoning_effort: low\|medium\|high\|max` — fully controllable | reasoning on | `low`/`medium`/`high`/`max` → literal |
| **glm5.3-flash** | `reasoning_effort: low\|medium\|high\|max` — fully controllable | reasoning on | `low`/`medium`/`high`/`max` → literal |
| **deepseek-v4-flash** | `reasoning_effort` is accepted but has **no effect** — the model chooses its depth per request | adaptive | no mapping: the value is ignored |
| **qwen3.6** | `reasoning_config` (`none\|minimal\|low\|medium\|high\|max`) | on, 16,384-token budget | `none`/`minimal` → thinking off; `low`/`medium`/`high`/`max` → 2,048 / 8,192 / 16,384 / 32,768 tokens |
| **gemma4** | `reasoning_config` (`none\|minimal\|low\|medium\|high\|max`) | on, 16,384-token budget | same as qwen3.6 |
| **mimo-v2.5** | depth accepted but not adjustable — reasoning always on | on | no mapping: every request pays reasoning tokens; leave `max_tokens` headroom (docs: ≥300) |
| **mimo-v2.6-flash** | depth accepted but not adjustable — reasoning always on | on | no mapping: same as mimo-v2.5 — leave `max_tokens` headroom (docs: ≥300) |
| **qwen3.8-flash** | depth accepted but not adjustable — reasoning on by default | on | no mapping |

Reasoning traces arrive separately as `message.reasoning_content`. A stream
that produces only reasoning for a long stretch is closed by the platform (a
`finish_reason: "length"` on an empty delta, billed as estimated/false), so a
model that plans without converging is cut rather than left to burn its budget.

**Tool calling is OpenAI-`tools`-native only on `glm5.3`, `glm5.3-flash`,
`deepseek-v4-flash`, `mimo-v2.5` and `mimo-v2.6-flash`.** `qwen3.6`, `qwen3.8-flash` and `gemma4`
document tool calling in **XML format**, not the OpenAI `tools` schema agent
harnesses send. The executor path (`execute-phase`, anything that reads/edits
files through tools) therefore defaults to `deepseek-v4-flash` (the catalog's
recommended start) or `glm5.3-flash`; `qwen3.6` is previous-generation, kept so
configurations naming it keep working. Run the tool-calling smoke test in
[`docs/workflow/GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md) before
promoting any model into that path.

**Preference ladders per task** (2–3 deep on the basic plan; the premium column
requires the GLM 5.3 membership — without it, use the basic-plan ladder):

| Task | Skills | Premium (`glm5.3`) | Basic-plan ladder | Never here |
|---|---|---|---|---|
| **Merge gates** | `audit-pr`, `product-audit` | glm5.3, High (Max for `product-audit`) | 1. **mimo-v2.6-flash** (reasoning always on; current Xiaomi generation — supersedes mimo-v2.5) → 2. **deepseek-v4-flash** (floor) → else **defer to the human** | qwen3.6, qwen3.8-flash, gemma4 |
| **Product definition** | `unit-lane` catalog step (`design`) | glm5.3, High | 1. **mimo-v2.6-flash** (reasoning always on; a different family from the executor adds independence; supersedes mimo-v2.5) → 2. **deepseek-v4-flash** → 3. **glm5.3-flash** (only for XS/S or derivative features — cheaper, still function-calling) | gemma4; qwen3.6/qwen3.8-flash for agentic runs (XML tools) |
| **Planning / routing / triage** | `unit-lane`, `init-workspace`, `triage-issue`, `review-change` | glm5.3, High | 1. **glm5.3-flash** → 2. **deepseek-v4-flash** → 3. **qwen3.8-flash** (quota-saver) | — |
| **Execution / mechanical** | `execute-phase`, `audit-docs`, `skill-lint`, `workflow-status` | deepseek-v4-flash | 1. **deepseek-v4-flash** → 2. **glm5.3-flash** → 3. **qwen3.8-flash** (only through an XML-aware harness) | mimo-v2.5 / mimo-v2.6-flash (reasoning can't be turned off — burns the capped budget) |
| **Cheap** | `log-session`, evidence gathering | **qwen3.6** — glm5.3's 400M/4h window and deepseek's 3B are both wasted on a log line | 1. **qwen3.6** (no token counter → unlimited; set `reasoning_config: none` so the append pays zero thinking tokens; its OpenAI-`tools` smoke is recorded in [`GOLDEN_FIXTURE.md`](docs/workflow/GOLDEN_FIXTURE.md)) → 2. **qwen3.8-flash** (500M/mo cap) → 3. **deepseek-v4-flash** (only where the harness can't reach qwen3.6) | mimo-v2.5, mimo-v2.6-flash (reasoning can't be turned off) |
| **Folding `review-change`/`audit-pr` findings** | `fold-findings` (primary); `execute-phase`'s embedded fold cycle (in-context/portability fallback) | per finding (see below) | **routine/mechanical** finding (style, missing test stub, stale doc) → same as Execution/mechanical; **subtle** finding (logic, security, architecture) → bump to the tier that found it (Merge-gates or Planning/routing ladder, whichever review ran) | — |
| **Adversarial review (`review-change --adversarial N` / `--synthesize`)** | `review-change` | glm5.3 × N, High | reviewers never weaker than the model that authored the diff; worked example: a deepseek-v4-flash-authored change → `--adversarial 2` with **mimo-v2.6-flash** + **glm5.3-flash** — two families neither of which is the executor, free decorrelation already sitting in this fleet; the orchestrating/merge conversation runs per the Planning/routing ladder | a reviewer weaker than the authoring model |

**`unit-lane` spans two rows — pick by the strongest step its triage returns,**
not by the skill's name. The lane runs its judgment steps (triage, design,
plan, evidence, review, close-out) in one session, so the model must cover the
highest-class step it will reach; execution phases hand off to `execute-phase`
one turn each at the phase's catalog tier. A lane whose triage
includes `design` is product definition → **mimo-v2.6-flash** first,
deepseek-v4-flash second; a lane of triage → plan with no
`design` is planning/execution → **glm5.3-flash** first, **deepseek-v4-flash**
second. deepseek is not categorically "better" or "worse" than mimo here — it is
the right pick for the volume steps (3B/mo, adaptive reasoning) and the wrong
pick for `design`, where mimo's always-on reasoning and a family other than the
executor's are exactly what the founding-assumptions step is paying for.

The folding row routes through the standalone `fold-findings` skill, falling
back to `execute-phase`'s embedded fold cycle only where a separate
invocation isn't available; it supersedes the old single-model "Alternates"
line. Rule of thumb: the fixing model
is never weaker than the one that wrote the original code, and never weaker
than the finding's subtlety warrants — otherwise the fix itself needs
re-catching on re-review, wasting a cycle.

**Why the adversarial row pays for itself on this fleet specifically:** the
mode's recommendation checklist fires whenever the reviewing model isn't the
fleet's strongest or is weaker than the author — on the basic-plan ladder that
is the common case (deepseek-v4-flash and glm5.3-flash execute most units).
Because the fleet already has several distinct model families, spawning `N=2`
reviewers from families other than the author's is close to free decorrelation,
not an extra purchase — the quota was already reserved for Merge-gates-class
work.

**Why the lane's `design` step sits in the merge-gate class, not the cheap tier:**
its output — the SPEC's product half plus capability closure — is the
**founding assumptions** the rest of the flow builds on, so an error there
compounds through plan → execute → review, the same blast radius as a
merge-gate verdict. mimo-v2.6-flash's always-on reasoning is the right spend for it
(few invocations, high leverage) — unlike mechanical volume, where the same
always-on reasoning burns quota for no benefit. glm5.3-flash is acceptable as
rung 2, and only for XS/S or derivative features: the raw-idea interview keeps a
human in the loop, and the lane's `plan` step re-checks the capability closure
downstream (the same re-checked-reasoning caveat below). As with every model
choice here, sanity-check availability against `GET /v1/models` before pinning.

**`qwen3.6`/`qwen3.8-flash` reasoning caveat, stated explicitly:** acceptable
only for **re-checked** reasoning (planning/routing/triage output that review or
audit verifies downstream) — never a merge-gating verdict (3B active parameters
on qwen3.6, 6B on qwen3.8-flash → a plausible-but-shallow audit is worse than
none). On the basic plan, once the mimo-v2.6-flash + deepseek-v4-flash quota
is spent,
no strong reasoner remains → defer to the human, wait for the quota reset, or
upgrade to the GLM 5.3 membership.

**Per-model pros/cons:**

| Model | Size | Context | Basic-plan quota | Good for | Avoid for |
|---|---|---|---|---|---|
| **glm5.3** | ~753B MoE | 1M ctx | Requires the GLM 5.3 premium membership (3,000M/billing period, 400M/rolling 4h); not on the basic plan | Every judgment slot, when available | — |
| **glm5.3-flash** | 320B total · 18B active | 1M ctx | 2B tok/member/mo | Planning/routing/triage and execution; OpenAI-style function calling; multimodal | Merge-gating verdicts (smaller family) |
| **deepseek-v4-flash** | 305B MoE (Vision-Exp) | 1M ctx | 3B tok/member/mo | Default agentic executor: OpenAI-style function calling, image input; planning/routing/triage and cheap volume | Any verdict that gates a merge |
| **mimo-v2.6-flash** | parameter count not published (omnimodal successor to the 310B V2.5) | 1M ctx | 1.0B tok/member/mo | Merge gates, long-context and multimodal (image/audio) work; OpenAI-style function calling; a different family from the executors, so it adds reviewer independence | Mechanical/low-effort volume — reasoning can't be turned off, so every cheap task burns the capped budget |
| **mimo-v2.5** | 310B total · 15B active | 1M ctx | 1.0B tok/member/mo | Previous generation: kept so existing configurations keep working; long-context work | Superseded by mimo-v2.6-flash for every judgment slot; mechanical/low-effort volume — reasoning can't be turned off |
| **qwen3.8-flash** | 125B total · 6B active | 262K ctx | 500M tok/member/mo | Cheap/mechanical volume; quota-saver; non-agentic steps (XML tool calling) | Agentic tool loops through an OpenAI-`tools` harness; merge-gating verdicts |
| **qwen3.6** | 35B total · 3B active | 262K ctx | no token counter (cluster model → unlimited) | Unlimited cheap volume: `log-session`, evidence gathering (`reasoning_config: none`); previous generation kept so existing configurations keep working; non-agentic steps (XML tool calling) | New agentic executor work; merge-gating verdicts; reviewing code it wrote itself |
| **gemma4** | 26B total · 4B active | 262K ctx | no token counter (cluster model → unlimited) | Small non-agentic tier (single-shot text/vision); the other no-counter model for pure text volume | Any judgment call; agentic tool loops (XML-format tool calling — no recorded smoke pass in this repo) |

**Operational limits per API key** (from the API reference): 60 requests/min,
1.5M tokens/min per chat model for deepseek-v4-flash, mimo-v2.5,
mimo-v2.6-flash, qwen3.6 and gemma4, and **7 simultaneous requests per key on
the basic plan (10 on premium)** across all models — with a per-model cap of 5
for qwen3.6, gemma4, mimo-v2.5 and mimo-v2.6-flash. Cap any subagent/review
fan-out (the `review-change` pack) at ≤5
concurrent — 3–4 in practice, leaving headroom for the conductor — and remember
an agentic loop spends one request per tool round-trip, so several agents in
parallel hit 60 rpm quickly.

Whisper, Kokoro, Rerank, Qwen3 Embedding and Flux 2 Klein are NaN's hosted
audio/retrieval/image models — this workflow never routes to them (its own
document retrieval index, when configured, calls a generic OpenAI-compatible
embeddings endpoint, not this catalog). Model strength above
is framed by active-params + role, not benchmark numbers — sanity-check
against a current leaderboard before pinning; this landscape moves fast.
