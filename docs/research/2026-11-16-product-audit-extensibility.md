# Product-audit extensibility & adversarial review economics — session note (2026-11-16)

**Type:** owner-directed direction session · **Status:** direction recorded; two issues filed (#590, #591), attribution rows landed on main · **Companion artifacts:** `docs/research/ATTRIBUTION.md` (evidence-only rows 2026-11-16), issues [#590](https://github.com/gtrabanco/agentic-workflow/issues/590), [#591](https://github.com/gtrabanco/agentic-workflow/issues/591)

## How the session started — the adversarial question

The owner asked whether the papers corpus says adversarial reviews "pay off". Two verification passes produced the settled answer:

1. **The initial reading was inverted.** The "~79–83% FP" figure of arXiv [2604.19049](https://arxiv.org/abs/2604.19049) (Refute-or-Promote) means the kill-mandate mechanism **kills 79–83% of false positives** — a precision *win*, not a noise rate. Verified against issue #358's body and ROADMAP row 95.
2. **What does not pay is the *additive* adversarial** (find-more reviewers each paying full context to enumerate possibilities). What pays is the **kill-mandate shape**: verify-or-kill per candidate finding, diff-only reflector as precision filter (2608.09290), CIVER stability check — exactly what shipped via PR #399 (merged 2026-11-02, issue #358 closed completed).
3. **Cost asymmetry confirmed but bounded:** every extra adversarial reviewer pays its own clean context, so N reviewers cost ~N× context for verification the same pass could do. But cross-family coverage (different model families catch correlated blind spots) is a *recall* property a single reviewer cannot self-supply — so the trade is per-surface, not global.

OpenCodeReview's "2.17× SEM-F1 at 5–15× fewer tokens" was also re-attributed correctly during the session: it belongs to the whole determinism-first pipeline (dispatch + grounded review + reflector), not to parallel adversarial subagents.

## The product-audit requirement (owner direction)

Owner directive: **product-audit must be the best audit tool of the repository by a wide margin**, detecting drift, missing docs, security failures, code bugs, fixable ceremony faults, incomplete features, partially implemented code, undocumented gaps, outdated packages, duplicate/combinable/superseded issues, obsolescence and removable parts — plus project-type-specific axes (web: a11y/SEO/UX/design-system; desktop: equivalents; server: applied patterns, unvalidated endpoints; scientific: uncontrasted sources, bibliography; legal: law-in-force checks, jurisprudence).

Two structural conclusions from working that list:

- **Baseline vs additions.** A *universal minimum* exists (correctness, security, docs residue, process, roadmap, tooling, incomplete features) — it extrapolates because the abstract defect is the same ("assertion without support" covers a bad endpoint, a repealed legal citation and an uncontrasted source alike). Platform/domain axes are **declarative additions**, never skill edits: the product ships, so projects cannot edit it — extension must be a declared channel.
- **Generic vs non-generic, split precisely.** The review *quality standard* is 100% generic (evidence grounding, falsification, CIVER stability, receipts, closed severity ladder). The *coverage map* (what can go wrong on each surface) is NOT generic and must be project-fed — a gap detector that infers the map invents gaps and violates ask-dont-infer. The detector is a generic process over project-declared inputs.

## Verified state at session time

- #201 (passes config + resolve-passes) **shipped** — PR #464, merged 2026-11-08; cross-model-family pinning is live in `review-change`/ADVERSARIAL_SETUP.md.
- #260 subagent-first execution **shipped** — PR #467, merged 2026-11-09.
- `product-audit` was last touched 2026-11-08 19:03 UTC — **before both merges**. Its portability section still says "no per-skill model:/effort: — strongest model, no subagents, sequential": a frozen pre-#464/#467 posture, now an internal inconsistency to re-base (recorded, no issue yet).
- The verification-criteria catalogue (init-workspace charter) has **no consumer in product-audit** (rg: zero mentions) — the chain init-workspace asks → catalogue records → audit-docs check 16 measures coverage stopped one hop short of the audit.
- No scaffold-drift → re-run `init-workspace` upgrade finding class exists.
- Third-party skill discovery (autoskills.sh / skills.sh search) did not exist; the defensive tooling for it did — `scripts/skill-lint.mjs` (7 checks from the agent-skills security studies, scannable via `--root`/`--skill`).

## The self-improvement question — ruled emission-only

The owner floated: logs reveal flow/review/instruction failures → the system reinforces itself via AGENTS.md and docs edits. **Rejected as auto-editing, adopted as emission**, on measured grounds:

- LLMs Cannot Self-Correct (2310.01798) — loops without new evidence do not improve.
- Governance Decay (2606.22528) — prose constraints erode; adding ceremony prose makes it worse.
- **New evidence found this session: capability erosion in self-evolving LLM agents (arXiv [2605.09315](https://arxiv.org/abs/2605.09315))** — unconstrained self-evolution (workflow rewriting, skill replacement, memory updates) *measurably degrades previously acquired capabilities*. This converts the no-self-edit position from prudence to measurement, and motivates the evolution-regression gate: adding/changing a review dimension or skill re-verifies prior dimensions still pass.

The improvement loop therefore lands as: deterministic carriers **emit** evidence (corpus, receipts, findings) → owner decides → change enters via `/unit-lane` with its gates, like any unit. The system "improves itself" in the sense that the evidence→decision→unit loop exists — never in the sense that an agent rewrites its own constitution.

## The coverage-gap fitting — tried four homes, kept one

| Home tried | Verdict |
|---|---|
| Standalone `review-gaps` skill | Rejected — reviews the process, not a change or product; duplicates three existing deterministic carriers |
| init-workspace as owner | Only the bootstrap slice (recommend skills for detected surfaces); continuous detection is not its job |
| product-audit dimension | **Kept** — the audit-side consumer, pass-only-if like the residue sweeps |
| Log-mining + self-edit | Rejected (above) — emission-only instead |

What already existed and owns each half: `findings-corpus.mjs` (#437, shipped) owns the retrospective half (recurring class → phase of origin); `GATE_INVENTORY.md` + prose-gate-inventory (#359, shipped) owns the detector inventory; audit-docs check 16 owns criteria coverage measurement. The single genuinely missing piece was the **forward-looking join**: criteria × detectors × corpus → gap receipt. It is the requirements-traceability-matrix pattern (institutionalized in ISO 26262 / DO-178C) applied to the workflow's own review surface.

## Bibliography contrast (new, this session)

Validating the design: RTM practice (above); Voyager [2305.16291](https://arxiv.org/abs/2305.16291) + SAGE [2512.17102](https://arxiv.org/abs/2512.17102) — skill libraries compound when skills enter filtered by demonstrated value (the discovery pipeline's justification); the "skill library rot" essay — acquired skills need a lifecycle story, not just installation; Safety in Self-Evolving Agents ([2610.00093](https://arxiv.org/abs/2610.00093)) + substrate-stratified survey ([2610.02918](https://clawrxiv.io/abs/2610.02918)) — evolution surfaces (workflow rules, skill libraries) are exactly the substrate class requiring safety constraints, which is what consent gates + lint screening materialize.

Deferring design inputs: arXiv 2510.10290 (Grounded AI for code review — resource-efficient *routed* review = the pre-triage of review intensity) and Aðalsteinsson ESEM 2025 — both already flagged CANDIDATE-not-evaluated in the merge-gate sweep; the adversarial pre-triage unit waits on their evaluation.

## Overlap resolution with the slop-mapping issues

Issues #563/#564/#565 (filed 2026-11-15 from the "All Code Is Slop" mapping) already carry adjacent work. Resolution applied after owner confirmation of flight status:

- The coverage-gap join is the **audit-side consumer** of #564's declaration-enforcement check → #590 carries a native `blocked-by` #564 (GraphQL `addBlockedBy`, verified), not a duplicate.
- Skill discovery is a standalone issue (#591), not an amendment to #563 — #563 was already in flight near close.
- #565 (DORA quality sensor) untouched, complementary.
- Adversarial pre-triage deferred as a future unit pending the two candidate-paper evaluations; #444 (decision-substrate, postponed) receives a consumer comment only when #590 ships — targeting review intensity is a `choice` over the closed set `{adversarial, single-context, none}` under #444's signal-never-authority invariants.

## Landed this session

1. `docs/research/ATTRIBUTION.md` — four evidence-only rows (2605.09315; 2610.00093+2610.02918; 2305.16291+2512.17102; RTM practice), committed to main `550cd43f` (owner-directed inline batch), push verified on remote.
2. Issue [#590](https://github.com/gtrabanco/agentic-workflow/issues/590) — coverage-gap join (`coverage-gap@1` receipt) + review-gaps dimension + evolution-regression gate + emission-only principle; labels `feature`, `needs-triage`; native blocked-by #564.
3. Issue [#591](https://github.com/gtrabanco/agentic-workflow/issues/591) — skill discovery: trusted registries → mechanical screening (skill-lint + provenance) → per-candidate consent → lifecycle registration with anti-rot round-trip into the Installed tooling dimension; labels `feature`, `needs-triage`.

Both issues carry the reference-ledger close-out task (the adopting PR appends/confirms its `ATTRIBUTION.md` rows in the same PR — the #358 pattern).

## Still open (recorded, unfiled)

- Re-base product-audit's topology onto the post-#464/#467 runtime (stale "no subagents, sequential" posture; dispatch per dimension via orchestrator/passes).
- Scaffold-drift finding class: missing/aged scaffold blocks → route to init-workspace upgrade.
- Adversarial pre-triage unit (blocked on evaluating 2510.10290 + ESEM 2025).
- #444 consumer comment (blocked on #590 shipping).
