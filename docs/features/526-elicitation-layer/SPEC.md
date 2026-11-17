---
type: feature
scope: medium
roadmap_summary: Issue [#526](https://github.com/gtrabanco/agentic-workflow/issues/526) (M, owner direction 2026-11-12 research): Layer 0 of the input path — a checklist-first `pre-spec@1` before triage (home `docs/pre-spec/`), behavior-changing questions only (CONTRA-style mechanical qualification), one focused question at a time through `open-questions@1`, a cross-family elicitor (same-model elicitation measured negative — arXiv 2610.22382); consumed by #441's `one-shot` verdict and the design step, and never a new gate. Evidence: [docs/research/2026-11-12-input-quality-and-editing/](research/2026-11-12-input-quality-and-editing/). **Applied in the owner's local order 2026-11-17:** unit doc [features/526-elicitation-layer](features/526-elicitation-layer/SPEC.md), `agentic-workflow elicitation check` in the crate, and `skills/unit-lane/references/ELICITATION.md` as the layer's one owner.
---

# 526 — evidence-backed elicitation

> One-line: turn a vague initial request into a structured `pre-spec@1` before the lane triages, using a checklist bank first and only the questions whose answers change behaviour.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Layer 0 of the input path.**
> "**Layer 0 of the workflow's input path**: convert a vague initial request into a structured pre-spec **before** the lane triages, with the cheapest reliable mechanism — a **checklist-first template** with **selective, behavior-changing clarification questions only**. This implements #307 Layer 1's principle ("unresolved uncertainty becomes one focused question") with an evidence-backed mechanism; it is not a second ask mechanism racing it."

**S2 — Checklist first.**
> "**Checklist-first** — a per-domain pre-spec template does the structuring; the interview is selective, never a fixed questionnaire."

**S3 — Question qualification.**
> "**Question qualification** — candidate questions kept only when two plausible answers imply stable behavioral differences (CONTRA-style; mechanically qualified where computable, per the governance-decay rule)."

**S4 — Uncertainty-calibrated asking.**
> "**Uncertainty-calibrated asking** — one focused question at a time, fail-closed to `open-questions@1`; simple work never earns questions."

**S5 — Cross-model elicitation.**
> "**Cross-model elicitation** — the elicitor and the implementing model are different families."

**S6 — Output, consumed and never a gate.**
> "**Output** — a structured pre-spec consumed by triage (one-shot eligibility) and the lane's design step; never a new gate."

**S7 — Non-goals.**
> "No universal interview; no ceremony for one-shot/passive work beyond eligibility checks." / "No regeneration philosophy here — that is #441's one-shot verdict design" / "No adoption of any surveyed harness's CLI or taxonomy"

**S8 — Contextual approval.**
> "A short affirmative reply ("yes", "go ahead", "eso mismo") is interpreted against the **immediately preceding proposal**: when the human unambiguously accepts a concrete implementation action they already understand, execute it within its agreed scope without asking again." / "**Confirming a preference alone does not authorize implementation.**" / "Genuinely unclear change intent still requires **one focused question**" / "Scope note — contextual approval never substitutes for provider-owned consent, exact-token authorization, or destructive-action permission"

## Acceptance criteria

- AC1 — S1, S6: a pre-spec precedes triage and is the layer's artifact; the shipped bank plus one real pre-spec pass the layer's own check. (check: `bun packages/agentic-workflow/bin/agentic-workflow.mjs elicitation check --bank skills/unit-lane/references/ELICITATION.md --spec docs/pre-spec/2026-11-17-526-elicitation-layer.md` exits 0 printing `ELICITATION CHECK PASS`)
- AC2 — S2: the checklist is a checklist, not a free interview — every bank row applicable to the pre-spec's declared shape must appear as a row, and a missing one is refused. (check: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0 with the case `a pre-spec missing an applicable checklist row is refused`)
- AC3 — S3: qualification is mechanical — a bank row whose `toggles` cell carries fewer than two `answer → behaviour` clauses is refused. (check: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0 with the case `a bank row with one toggled behaviour is refused`)
- AC4 — S4: calibration is enforced — at most one open question per pre-spec, `questions: none` needs its why, and a `default: none` row left `unknown` must be a question. (check: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0 with the cases `a second open question in one pre-spec is refused`, `questions: none without a why is refused`, `an unknown on a row that declares no default must be a question`)
- AC5 — S4: the question block is the published `open-questions@1` grammar, read through the crate's own owner rather than a copy — a header that differs from the published columns is refused. (check: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0 with the case `a question block whose header differs from the published columns is refused`, and `rg -c 'LEDGER_COLUMNS' packages/agentic-workflow/src/elicitation/prespec.mjs` matches 1)
- AC6 — S5: equal declared families are refused unless the degraded run is declared — `a declared same-family reason is accepted and reported` and `equal elicitor and implementer families are refused`. (check: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0 with both cases)
- AC7 — S6: triage's one-shot eligibility reads the pre-spec, and the layer adds no gate — the eligibility conditions keep their six rows and no gate row is coined for the layer's check. (check: `rg -c 'pre-spec' skills/triage-issue/references/ISSUE_PROCESS.md` matches 2, `rg -c '^\s+\d\. \*\*' skills/triage-issue/references/ISSUE_PROCESS.md` matches 6, and `rg -c '^\| elicitation[a-z-]* \|' docs/workflow/GATE_INVENTORY.md` prints 0)
- AC8 — S7: simple work earns nothing — a pre-spec whose applicable rows are all answered by the request or the repository asks no question and passes; and the layer coins no harness vocabulary (its shape vocabulary is four request families). (check: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0 with the case `a fully answered pre-spec asks nothing and passes`, and `rg -c '^\| shape \|' skills/unit-lane/references/ELICITATION.md` matches 1)
- AC9 — S8: the contextual-approval rule ships with its hard boundary — the reference carries the immediately-preceding-proposal rule and states that it waives no consent, authority or destructive-action stop. (check: `rg -c 'immediately preceding proposal' skills/unit-lane/references/ELICITATION.md` matches 1 and `rg -c "never waives" skills/unit-lane/references/ELICITATION.md` matches 1)
- AC10 — S1..S8: the layer is a declared normative surface read by the drift gate, and the lane stays inside its reference ceiling. (check: `bun test scripts/normative-drift.test.mjs` exits 0 with the `elicitation-checklist` and `pre-spec` rows resolving, and `bun scripts/check-skill-context.mjs --skill unit-lane` exits 0)

## Impact

- `skills/unit-lane/`: the lane's entry gains the pre-spec step and the reference link; `references/ELICITATION.md` is new and is the layer's single normative owner (bank cells, artifact grammar, calibration, family rule, output contract).
- `skills/triage-issue/references/ISSUE_PROCESS.md`: the `one-shot` classification reads the pre-spec instead of asserting "small and understood" — its six eligibility conditions are unchanged, and the pre-spec's `questions: none` is the evidence for the second.
- `packages/agentic-workflow/`: a new `elicitation` file service (`check`) with its bin dispatch, usage line and README row; `packages/pi-agentic-workflow/scripts/projection.mjs`'s `CRATE_COMMANDS` gains the command (its parity test compares it with the bin's dispatch list).
- `docs/pre-spec/`: the artifact's home, one file per request, mirroring `docs/passive/`'s `<YYYY-MM-DD>-<slug>.md` id convention. Its named consumers are this unit's own pre-spec, triage's one-shot eligibility and the design step's `## Specs` seed.
- `docs/workflow/LANE_FLOW.md`: the flow names Layer 0 before triage, so the tutorial is not one step behind the lane.
- Retires nothing: the ask mechanism stays `open-questions@1` and `needs-input` keeps its rows, its continuation and its routes — the layer produces the same block earlier in the path.
- Nothing stops being true: `DESIGN.md`'s batched ask keeps owning design-tier questions; the layer owns pre-triage intent questions and states that boundary.

## Surfaces

- `skills/unit-lane`
- `packages/agentic-workflow`
- `docs`

## Retirements

Strictly additive: this unit retires no surface, and says why nothing can be removed — the layer adds an earlier artifact to a path whose existing parts (the `open-questions@1` block, the ask stage's batching, `needs-input`'s continuation) all keep their consumers. Its added-surface inventory is the anti-divergence receipt, computed after the change lands (the tree has no base commit before it):

```text
bun scripts/residual-classify.mjs --inventory --base main
```

## Non-goals

- Lane-level design-tier elicitation (DESIGN.md's ask stage owns it)
- Any regeneration philosophy (the `one-shot` verdict's design owns it)
- Adopting a surveyed harness's CLI or taxonomy
- A model-family registry: the layer compares declared tokens, and says so

## Risk tier

**Tier** — `standard` · **Task Size** — `standard`
**Named high-risk item** — `none — not a high-tier unit`

## Future

none — the issue's own Execution record defers its LSP-tier, repair-mode and regeneration clusters to their owners, and this unit implements none of them.

## Future cost

The bank's rows are a contract: a later row must carry two behaviour-changing answers, a default (or a stated `none — <why>`), an ask condition and a source, and `elicitation check` refuses one that does not. A consumer that starts reading `pre-spec@1` inherits the column order this unit freezes; a new cell is a bank-contract change, not an edit.

## Applicable tests

- `bun test packages/agentic-workflow/test/elicitation.test.mjs` — the service's refusals, the shipped bank pass, the fixture-built pre-specs, the CLI boundary.
- `bun test packages/agentic-workflow/test/cli.surface.test.mjs` — the usage line and the Commands row stay in token parity.
- `bun test scripts/normative-drift.test.mjs` — the two new normative surfaces resolve.
- `bun scripts/skill-lint.mjs`, `bun scripts/check-skill-context.mjs --skill unit-lane`, `bun scripts/docs-generate.mjs --check` — the authoring, budget and projection gates the touched surfaces carry.
- `bun scripts/test-impact.mjs --base main` — the derived set this change can affect.

## Known pre-existing issues

- `docs/ROADMAP.md` rows 556–558 never name their own issues — issue #569, triaged fix-now; does-not-affect this unit (row 526 names issue #526, and the projection re-syncs summary cells from the unit docs).
- `scripts/worktree-guard.mjs` may report sibling sessions' worktrees as `STALE` — does-not-affect this unit: the finding names no path this change touches.

## Tasks

- [ ] P1 — Cut this unit's ledger freeze: SPEC S1–S8, AC1–AC10, the evidence ledger and the obligations ledger (validator: `rg -c '^\| O[0-9]+ \|' docs/features/526-elicitation-layer/planning-obligations.md` matches 16 and `rg -c '^\| PE-[0-9]{3} \|' docs/features/526-elicitation-layer/planning-evidence.md` matches 13)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: docs/features/526-elicitation-layer/SPEC.md, docs/features/526-elicitation-layer/planning-evidence.md, docs/features/526-elicitation-layer/planning-obligations.md
- [ ] P2 — Write the layer's normative owner: the checklist bank, the `pre-spec@1` artifact grammar, calibration, the family rule and the contextual-approval block (validator: `bun scripts/skill-lint.mjs` exits 0 and `rg -c '^\| (FEA|FIX|REF|DOC|DEP|PER|ANY)-[0-9]{2} \|' skills/unit-lane/references/ELICITATION.md` matches 16)
  (Implements: S1, S2, S3, S4, S5, S7, S8)
  - Relevant files: skills/unit-lane/references/ELICITATION.md
- [ ] P3 — Land the service's suite alone, observed red on the missing module (validator: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 1 with `Cannot find module`)
  (Implements: S1, S2, S3, S4, S5, S6)
  - Relevant files: packages/agentic-workflow/test/elicitation.test.mjs
- [ ] P4 — Implement the `elicitation` file service and its CLI surface (dispatch, usage line, README row, `CRATE_COMMANDS`) (validator: `bun test packages/agentic-workflow/test/elicitation.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
  - Relevant files: packages/agentic-workflow/src/elicitation/prespec.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/README.md, packages/pi-agentic-workflow/scripts/projection.mjs
- [ ] P5 — Wire the consumers: the lane's entry, triage's one-shot eligibility, the tutorial's flow, and the two normative-surface rows (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --skill unit-lane` exits 0)
  (Implements: S1, S6, S7)
  - Relevant files: skills/unit-lane/SKILL.md, skills/triage-issue/references/ISSUE_PROCESS.md, docs/workflow/LANE_FLOW.md, AGENTS.md
- [ ] P6 — Write this unit's own pre-spec and land the state: changeset, roadmap row, the session journal fragment (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs elicitation check --bank skills/unit-lane/references/ELICITATION.md --spec docs/pre-spec/2026-11-17-526-elicitation-layer.md` exits 0)
  (Implements: S1, S6)
  - Relevant files: docs/pre-spec/2026-11-17-526-elicitation-layer.md, .changeset, docs/ROADMAP.md
- [ ] P7 — Run the declared verification in the foreground, flip every obligation row and append the log (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/526-elicitation-layer/SPEC.md` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
  - Relevant files: docs/features/526-elicitation-layer/SPEC.md, docs/features/526-elicitation-layer/planning-obligations.md

## Triaged steps

```text
TRIAGE — 526-elicitation-layer (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: no packet in this session — the owner's local apply order runs the unit inline
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the request, verbatim (GitHub issue #526, owner-authored):
  ```
  NEW FEATURE: evidence-backed elicitation layer — pre-spec clarification (checklist-first, behavior-changing questions only, cross-model)
  ```
- **D1** — 2026-11-17, the layer lands as a reference of `unit-lane` rather than a skill of its own: the lane's first step is triage, and a separate skill would be a second entry point racing it (S1's "not a second ask mechanism racing it"). Its check is a crate file service (`elicitation`), the same shape unit 556 gave the engineering interview, because the lane runs in target projects that carry no `scripts/` tree (PE-001, PE-002).
- **D2** — 2026-11-17, the artifact's home is `docs/pre-spec/<YYYY-MM-DD>-<slug>.md`: a pre-unit request has no unit folder yet, and the id convention is `docs/passive/`'s, so no new naming rule is coined (PE-003).
- **D3** — 2026-11-17, the question block is not a new grammar: the check imports `LEDGER_COLUMNS` from the crate's `needs-input` reader, and a header that differs is refused, so the layer can never quietly diverge from the ask mechanism it feeds (PE-004).
- **D4** — 2026-11-17, no repair corpus exists for this unit: it is a new capability, not a fix, so §2 of the owner's local apply order has no reproducer set to extract. The red-first corpus is the service's own refusal cases (P3 lands them alone, observed red).
- **D5** — 2026-11-17, the layer decides *pre-triage intent* questions; `DESIGN.md`'s batched ask keeps owning design-tier questions. The boundary is stated in the reference so the two asks cannot be read as rivals (S1, S4).
- **P1** — 2026-11-17, froze this unit's SPEC (S1–S8, AC1–AC10), the evidence ledger (PE-001..PE-013) and the obligations ledger (O1–O16).

## Next

P2 — write `skills/unit-lane/references/ELICITATION.md` (the bank, the artifact grammar, calibration, the family rule, the contextual-approval block).

## References

- Issue: [#526](https://github.com/gtrabanco/agentic-workflow/issues/526) · roadmap row 526
- Evidence: `docs/research/2026-11-12-input-quality-and-editing/` (checklist-first, CONTRA, cross-model elicitation), `docs/research/ATTRIBUTION.md`
- Sibling mechanism: `skills/init-workspace/references/ENGINEERING_INTERVIEW.md` (the charter bank and its qualification rule), `docs/features/556-engineering-interview/`
- Consumed by: `skills/triage-issue/references/ISSUE_PROCESS.md` (`one-shot` eligibility), `skills/unit-lane/references/DESIGN.md` (`## Specs` seed)
