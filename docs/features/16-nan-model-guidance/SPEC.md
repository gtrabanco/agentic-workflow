# 16 — nan-model-guidance

> Feature specification. Size S — this SPEC is the only planning artifact;
> implement with `execute-phase 16` in a single pass.

## Goal

Correct the repo's NaN Builders / OpenAI-compatible provider guidance against
that provider's own API reference (a self-contained `LLMs.txt` document, dated
2026-07-11), which contradicted or was missing several facts the README's
"Running on NaN.builders" section asserted as if uniform across models. Fold
the corrections into the README (EN/ES), give `orchestration-envelope` a
structured-outputs shortcut for forcing the machine envelope where the
provider supports it, give `ship-roadmap` a concurrency guardrail for
provider-side parallel-request limits, and add a tool-calling smoke test to
`GOLDEN_FIXTURE.md` as a model precondition for the executor path.

## Branch

`feat/16-nan-model-guidance`

## Size

`S` — doc corrections in two files (README EN/ES) plus one guidance addition
each to two already-shipped skills (`orchestration-envelope`, `ship-roadmap`)
and one procedural addition to `GOLDEN_FIXTURE.md` (EN/ES); no new skill, no
contract change, single pass.

## Dependencies

None. Builds on features 04 (`running-economically`, model-tier docs), 10
(`envelope-orchestrator-only`, the driver-injected envelope + repair loop)
and 12 (`golden-fixture-procedure`), all merged; touches only their
documentation, not their contracts.

---

## Product half

### Context

The README's NaN.builders section (added by feature 04 and extended since)
claimed a per-request "Thinking toggle and effort control (Minimal → Max),
which maps 1:1 onto this workflow's tiers" across the whole model catalog.
The provider's own API reference shows this is false: reasoning control is
**per-model** (a graduated `reasoning_effort` field on one model, a boolean
thinking toggle on two others, no control at all on a fourth), tool calling
is validated on only one model (another documents tool calling in an XML
format incompatible with the OpenAI `tools` schema agent harnesses send),
GLM-5.2 does not appear in the provider's own `/v1/models` catalog, and the
API enforces per-key concurrency/rate limits the ladder guidance never
mentioned. Left uncorrected, following the README's routing table risks
silently degrading the executor path onto a model whose tool calling was
never validated, and burning capped quota on a model that cannot turn
reasoning off.

### Business goals

n/a — internal operating-documentation correction; no external product
surface.

### Scope

#### In scope

- Replace the false "1:1 effort mapping" claim in `README.md`/`README.es.md`
  with a per-model reasoning-control matrix and an explicit `effort:` mapping
  rule.
- Demote the model with unvalidated/XML-format tool calling out of the
  agentic-execution ladder; keep it for non-agentic (single-shot,
  non-tool-calling) roles only, gated on a smoke test.
- Add a catalog-verification caveat (`GET /v1/models`) ahead of routing to a
  model the provider's public reference doesn't list.
- Document the provider's per-key operational limits (requests/min, max
  concurrent requests, tokens/min) and cap `ship-roadmap`'s parallel-executor
  guidance accordingly.
- Document a structured-outputs shortcut for the driver-injected machine
  envelope (`orchestration-envelope`, `ORCHESTRATION.md`) on providers/models
  that support strict JSON-schema response formats, alongside the existing
  repair loop.
- Add a tool-calling smoke test to `GOLDEN_FIXTURE.md` as a precondition
  before trusting an unvalidated model in the executor path.
- Correct the DeepSeek monthly-quota figure in memory (500M tok/mo, not 1B).

#### Out of scope / non-goals

- No new skill, no `model-routing.yml` tier change (no Claude tier moved),
  no change to the envelope schema or the npm package.
- No automation of the tool-calling smoke test (stays manual, like the rest
  of `GOLDEN_FIXTURE.md` — feature 12's stated scope boundary).
- No claims about providers other than the one whose reference was read;
  the wording stays provider-generic where the guidance is general
  (`orchestration-envelope`, `ship-roadmap`) and provider-named only in the
  README's dedicated NaN.builders section.

### Capability closure

No entities, capabilities, or roles are introduced — this is a documentation
and guidance correction to existing, already-shipped surfaces. n/a: doc-only
change, no data model or user-facing capability.

### Acceptance criteria

- `grep -n "maps 1:1 onto this workflow's tiers" README.md README.es.md`
  returns nothing (the false claim is removed).
- `grep -n "reasoning-control\|reasoning_effort\|enable_thinking" README.md`
  returns the per-model matrix.
- `grep -n "tool.calling\|tool-calling" docs/workflow/GOLDEN_FIXTURE.md`
  returns the new smoke-test section.
- `grep -n "concurrency\|concurrent" skills/ship-roadmap/SKILL.md` returns
  the Portability guardrail.
- `grep -n "structured.outputs\|json_schema" skills/orchestration-envelope/SKILL.md docs/workflow/ORCHESTRATION.md`
  returns the shortcut section in both.
- `npx skills add . --list` still discovers all skills (read-verified).
- ES siblings updated in the same change (read-verified — reciprocal
  language-switcher links intact, content matches EN).

### Tooling

None beyond skills already installed in this repo (`bump-skill` for the
version/changelog bookkeeping on the two touched skills).

### Product decisions

- **Treat the provider's own API reference as ground truth over the README's
  prior prose** where the two conflict — the reference is dated and
  primary-sourced; the README's claim predates it and was never verified
  against it. (Decided 2026-07-12, in conversation.)
- **Keep the guidance provider-generic in skill bodies**, naming the provider
  only in the README's dedicated section — consistent with the repo's
  stack/architecture-agnostic rule in `CLAUDE.md`.

## Design status

`designed`

---

## Engineering half

### Technical goals

Keep every correction traceable to the primary source (the provider's API
reference) and additive to already-shipped contracts — no skill's turn
contract, output shape, or `model:`/`effort:` tier changes; only its
`## Portability` / operating-guidance prose gains a new paragraph.

### Architecture impact

None — this repo has no application architecture; the "impact" is purely
documentation-layer (`README.md`/`.es.md`, `docs/workflow/*.md`) plus two
non-contract SKILL.md sections (`## Portability` on `ship-roadmap`, the
driver system-prompt-snippet section on `orchestration-envelope`).

### Design

- **README NaN.builders section**: insert a "Reasoning control per model"
  table right after the quota-aware routing rule, keyed by control mechanism
  (`reasoning_effort` string enum vs. `enable_thinking` boolean vs.
  uncontrollable) and mapped onto this workflow's `effort:` vocabulary
  (`low`/`medium`/`high`/`xhigh`/`max`). Add a "tool calling validated on one
  model only" callout immediately after, cross-referencing the golden-fixture
  smoke test. Add a catalog-verification blockquote ahead of the two-profile
  paragraph. Extend the per-model pros/cons table's "Avoid for" column
  instead of adding new rows (keeps the table's existing shape). Add an
  operational-limits paragraph after the pros/cons table, before the
  audio/retrieval/image-models disclaimer.
- **`orchestration-envelope`/`ORCHESTRATION.md`**: append a blockquote/note
  directly under the existing repair-loop steps (not a new top-level
  section) describing the structured-outputs shortcut — force the
  envelope-only turn's `response_format` to the package's
  `envelope.schema.json` when the provider/model supports strict JSON
  schema; repair loop remains the fallback; explicit warning against setting
  a response format on working turns (would suppress prose/tool use).
- **`ship-roadmap` Portability**: append one bullet to the existing
  `model:`/`effort:`-free guidance list — cap parallel subagent/headless
  fan-out at the provider's documented per-key concurrent-request limit,
  back off on 429 rather than retry at full fan-out.
- **`GOLDEN_FIXTURE.md`**: insert a new `## Tool-calling smoke test (model
  precondition)` section between "The procedure" and "Fixed pass criteria" —
  a minimal request/response contract (one trivial tool, check
  `finish_reason: tool_calls` + parseable `arguments`) an operator runs once
  per unvalidated model before trusting it on the executor path; failing
  models are still usable for non-agentic roles.

All four surfaces keep provider names generic except the README's own
NaN.builders section, per the stack-agnostic rule in `CLAUDE.md`.

### Decisions to confirm

None outstanding — both product and engineering decisions above were
confirmed in conversation before implementation.

### Testing requirements

Documentation-only change: verification is `grep`-checkable acceptance
criteria (above) plus a read-through cross-check that ES siblings match EN
content and that no provider name leaked into a skill body outside the
already-provider-named README section. No automated test suite applies.

### Dev scenarios

n/a — no runtime behavior, no dev-scenario harness applicable to a
documentation/guidance correction.

### Phases

- [x] **P1 — apply the corrections.** README EN/ES reasoning-control matrix,
  execution-ladder demotion, GLM-5.2 catalog caveat, operational-limits box;
  `orchestration-envelope` + `ORCHESTRATION.md` EN/ES structured-outputs
  shortcut; `ship-roadmap` Portability concurrency guardrail;
  `GOLDEN_FIXTURE.md` EN/ES tool-calling smoke test; `bump-skill` for
  `orchestration-envelope` (1.1.1 → 1.2.0, minor) and `ship-roadmap` (2.2.0 →
  2.2.1, patch) with CHANGELOG EN/ES rows.
- [x] **P2 — Hardening & PR.** Verify `npx skills add . --list` still
  discovers every skill; verify no conflict markers or stray provider names
  outside the README section; register this SPEC in
  `docs/features/ROADMAP.md`; open the branch's PR against `main` with
  `Closes:` omitted (no source issue — this unit originated from a
  read-the-gist-and-report request, not a tracked issue) and flip the
  roadmap row to `done`.

### Deploy & rollback

n/a — documentation change, ships by merging; no migration, no flag, no
rollback path beyond reverting the PR.

### Open questions / risks

- **Risk:** the provider's API reference is a third-party document, not
  independently verified against a live `/v1/models` call — the README now
  says so explicitly (the catalog-verification caveat) rather than asserting
  the catalog as fact. Accepted: the alternative (repeating the prior
  unverified "1:1" claim) was strictly worse.
- **Open question:** whether GLM-5.2 is actually reachable via the
  documented API is left to the reader to verify per-key — not resolved
  here, and not blocking (the guidance degrades gracefully either way).

### Deliverables

- Updated `README.md` / `README.es.md` NaN.builders section.
- `skills/orchestration-envelope/SKILL.md` 1.2.0 + matching
  `docs/workflow/ORCHESTRATION.md` / `.es.md` notes.
- `skills/ship-roadmap/SKILL.md` 2.2.1.
- Updated `docs/workflow/GOLDEN_FIXTURE.md` / `.es.md`.
- `CHANGELOG.md` / `CHANGELOG.es.md` rows for both bumped skills plus a
  release-log entry.
- This SPEC + its `docs/features/ROADMAP.md` row.

### Post-merge next feature

None queued — this unit was opportunistic (triggered by reading an external
reference doc), not part of the U1–U11 backlog chain. Next feature picks up
from `docs/features/ROADMAP.md`'s open items, if any, or a fresh
`/plan-feature` interview.
