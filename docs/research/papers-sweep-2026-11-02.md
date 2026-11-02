# Papers sweep — 2026-11-02

Second literature sweep (first one: 2026-09-15 token-economy audit; review-loop
evidence: arXiv 2603.00539, incorporated via features 31/32/50). Focus: papers
published since mid-September 2026 plus important earlier-2026 papers the first
sweep missed. Each entry: verdict, evidence, and where it lands in this repo.

## Verdict table

| arXiv | Title (short) | Verdict | Lands on |
|---|---|---|---|
| 2610.34491 | Economics of reasoning effort | **APPLY** | model profiles (63/64), skill model/effort tiers |
| 2610.37255 | Your Policy Is Secretly a Harness | **APPLY (methodology)** | golden fixture, model-equivalence table, phase fingerprints |
| 2610.36010 | CIVER — causal-intervention review verification | **APPLY** | review-change reproducer rule, review-verify |
| 2608.09290 | OpenCodeReview — determinism-first review | **APPLY** | review pack dispatch, conductor (62) |
| 2606.13175 | The End of Code Review (position) | **REFERENCE** | audit-pr, adversarial review design |
| 2604.19049 | Refute-or-Promote — adversarial kill mandates | **APPLY** | `review-change --adversarial` |
| 2603.17973 | TDAD — impact analysis; TDD prompting paradox | **APPLY (highest priority)** | AGENTS.md TDD rule, execute-phase verification, feat 67/80 |
| 2604.05278 | Spec Kit Agents — grounding hooks per SDD phase | **APPLY** | unit-lane phases, pre-execution gates |
| 2607.01456 | From Anatomy to Smells — SKILL.md taxonomy | **APPLY** | `skill-lint` |
| 2601.10338 / 2604.02837 / 2602.06547 / 2602.14211 / 2604.06550 | Agent-skills security studies | **APPLY (lint-level)** | `skill-lint`, review-security, provenance rule |
| 2606.22528 | Governance Decay — compaction erases constraints | **APPLY** | prose-vs-script gate audit; long-run safety |
| 2610.02163 | AutoCompact — when to compact | **REFERENCE** | issue #174 design context |
| 2610.36405 | kw-bench — harness benchmark, "inertia" failure | **REFERENCE** | issue #174 scope, golden fixture direction |
| 2602.11988 | Evaluating AGENTS.md (harm study) | **APPLY (template guidance)** | init-workspace / template AGENTS.md guidance |
| 2601.20404 | AGENTS.md efficiency on real PRs | **REFERENCE (conflicts with 2602.11988)** | same |
| 2605.10039 | Instruction adherence factorial study | **REFERENCE** | context budgets, AGENTS.md authoring guidance |
| 2602.12430 | Agent Skills survey (v4) | **REFERENCE** | skills distribution thesis |
| 2610.14766 | LSCBench — agents pass tests, not security | **REFERENCE** | review-security justification |
| 2610.36623 | Batch-invariance kernel generation | **DISCARD** | — |
| 2610.31911 | LazyFlash — attention training efficiency | **DISCARD** | — |

## The five user-supplied papers

### 2610.34491 — What Effort Level Should I Choose? (KEEP — apply)
Measures counterfactual effect of reasoning-effort levels across proprietary and
open models: (1) higher effort frequently fails tasks lower effort solved;
(2) on tasks all levels solve, top effort costs up to 42× more; (3) effort
changes trajectory shape, not just token count; (4) start-low-escalate-on-
verified-failure matches or beats fixed top effort at lower cost.

Lands on: the skill `model:`/`effort:` tiers and the pi package's model routing
(features 63/64). Current doctrine "strongest model for planning/review, cheaper
for mechanical execution" survives — the paper strengthens it and adds a missing
piece: the escalation trigger should be a **verified failure** (our red gate /
failing reproducer), which the workflow already computes. Suggested unit: default
executor routes at low effort with escalation-on-red-gate instead of mid effort;
do not raise reviewer effort defaults on this paper (its caveat is that higher
effort is not instance-level better, which supports, not weakens, the ≥ rule).

### 2610.37255 — Your Policy Is Secretly a Harness (KEEP — methodology)
A trained policy carries its harness's preferences; deployed return = harness
ceiling − policy mismatch; comparing harnesses with a fixed model mixes the two
terms. Reordering observation fields left decisions unchanged yet dropped
success 85.0% → 19.2%. Harnesses a fixed-model comparison rejects can still
outperform after training under them.

Lands on: (1) SKILL.md wording and section order are performance-relevant
infrastructure — strengthens the phase fingerprint (phase-contract) and the
smoke-test rule in GOLDEN_FIXTURE.md; (2) evaluating the workflow with one fixed
model is methodologically unsound — the model-equivalence table and portability
claims should be checked on ≥2 models; (3) one-skill-per-phase migrations (row
33's sequencing) are the right shape for harness change. No code change by
itself; cite in GOLDEN_FIXTURE and the equivalence-table methodology.

### 2610.36405 — kw-bench (KEEP as reference; scope input for #174)
Harness benchmark on investigative knowledge work with deterministic grading.
Key failure mode of two lab harnesses away from their home model: "inertia" —
keeping many weak signals alive across a long session. Below the frontier, the
harness decides how far a model gets.

Lands on: issue #174 (SKILLSTATE). The paper is a caution for the state-flow v1:
naive trajectory discard destroys weak signals; our mitigation already exists —
durable external state (unit doc, ledgers, evidence rows) rather than in-context
state. Confirms the allowlist (execute-phase/fold-findings only) and the
non-goals (review/audit skills keep history). Also a candidate input for a
second golden-fixture family: an investigative fixture where state must be
carried, not just a deterministic build.

### 2610.36623 — Batch-invariant kernel generation (DISCARD)
GPU kernel agents; only transferable idea is "acceptance gates before
performance benchmarking", which the repo already does. No surface.

### 2610.31911 — LazyFlash (DISCARD)
Attention-backward training efficiency. No surface in a skills/docs/CLI repo.

## New papers the first sweep missed

### Review axis

**2610.36010 CIVER (Oct 2026).** Review findings verified via repair-oriented
perturbations: a finding is genuine if a targeted repair resolves it and the
review stays stable under unrelated changes (77% genuine-defect identification
on SWE-Review-Bench). Maps onto the existing failing-reproducer-before-persist
rule and the anti-invention rule: add the "stable under unrelated changes"
half — a finding whose reproducer also fires on untouched adjacent code is
misattributed. Candidate small addition to review-verify/fold contract.

**2608.09290 OpenCodeReview.** Determinism injected at three pipeline points —
rule-guided dispatch (deterministic file/criteria selection), grounded file
review (curated tool set, file-level parallel subagents), independent reflection
(reflector sees only the diff, not the explorer's notes) — beats Claude Code on
the same model 2.17× SEM-F1 at 5–15× fewer tokens. Directly supports the repo
direction (eliminate narration, deterministic producers, clean-context
receipts). Concrete borrow: an isolated verifier that sees only the diff and the
claim (no exploration transcript) as the final precision filter of
`--adversarial`; and deterministic dispatch of review axes per changed path
instead of model-chosen exploration.

**2606.13175 The End of Code Review (position).** Argues agent review supersedes
mandatory human review; mitigations it names: ensemble review across models and
calibrated abstention ("I don't know") instead of always-binary verdicts.
Directional only. Borrow: verdict vocabulary could carry an explicit abstain
path so a reviewer that cannot verify a criterion says so instead of guessing
(review-verify's manual checklist partially covers this).

**2604.19049 Refute-or-Promote.** Adversarial stage gates with kill mandates:
reviewers try to *disprove* each candidate; ~79–83% false-positive kill rate;
cross-family (different model family) critics catch correlated blind spots;
unanimity is a warning sign in both directions (documented FP and FN cases).
Maps onto `review-change --adversarial N`: reframe the adversarial pass from
"find more" to "kill candidates" (falsification mandate, per finding), and add
cross-model-family reviewing to the ≥-tier rule as an option.

### Execution / verification axis

**2603.17973 TDAD (highest-priority rule change).** Pre-change impact analysis
delivered as a skill (AST code–test graph) cut test regressions 6.08% → 1.82%
on SWE-bench Verified; the critical ablation: **TDD procedural instructions
without targeted context increased regressions to 9.94% — worse than
vanilla**; conclusion: surfacing contextual information outperforms prescribing
procedural workflows. This repo's root AGENTS.md says "Do tests before
implementation" and execute-phase requires RED evidence — the paper does not
refute TDD but shows the TDD rule needs its missing half: tell the agent *which*
tests the change can affect and require running those plus the suite. Feasible
via the already-shipped Serena/LSP provisioning (feature 67) or a lighter
rg-based impact hint; coordinate with feature 80 (efficient-context-targeting).
This is the one paper that should change a committed rule.

**2604.05278 Spec Kit Agents.** Adds read-only probing hooks before each SDD
phase and validation hooks after artifact authoring; improves judged quality
(+0.15 on a 1–5 composite, p<0.05) with 99.7–100% repository test
compatibility, and +1.7% on SWE-bench Lite. Validates unit-lane's shape; the
borrowable mechanism is small: each lane phase opens with a bounded read-only
probe receipt and closes with a validation hook against the live repo (most of
this already exists as gates; the delta is making the *probe* explicit and
read-only-by-construction).

### Context / state axis (feeds issue #174)

**2606.22528 Governance Decay.** Context compaction silently erases safety
constraints; measured constraint-violation rates rise from 0 to 19–59%
post-compaction depending on the model. Implication for a repo whose gates are
partly prose: any rule that lives only in skill text can vanish mid-run on a
long execute-phase. Reinforces D-31-6 (predicates in code) and motivates an
audit: enumerate gates that are prose-only vs script-enforced, and move the
safety-critical ones into deterministic scripts (the normalizer inventory and
discipline tests are the pattern). Pairs with the economics-of-effort paper:
compaction pressure grows with cheap high-effort long runs.

**2610.02163 AutoCompact (Oct 2026).** Learns when to compact; working-state
summary + recent turns. Reference for #174's design discussion; our durable
unit-doc state is the deterministic counterpart and needs no training.

### Skills ecosystem axis

**2607.01456 From Anatomy to Smells.** First systematic characterization of
SKILL.md as a software artifact: 13 higher-level / 44 lower-level semantic
components, 26 best practices, 26 "skill smells" (XML in frontmatter
description, backslash paths, missing examples, time-sensitive content,
security-hazard smells). Direct, cheap landing: extend `skill-lint` with the
smell checks that apply to this repo's conventions (skip smells that conflict
with the unified train / context budgets).

**2601.10338 Agent Skills in the Wild; 2604.02837 Towards Secure Agent Skills;
2602.06547; 2602.14211 (Skillject); 2604.06550 (SkillSieve).** Security
measurement of the skills ecosystem: 26.1% of 42,447 scanned skills carry ≥1
vulnerability (prompt injection, exfiltration, privilege escalation, supply
chain); hidden instructions live in HTML comments, invisible Unicode, and
frontmatter; skills inherit full agent permissions. This repo distributes its
skills via `npx skills add` — the trust question is real. Landing: (1) skill-lint
security checks (no HTML comments in SKILL.md, no XML tags in frontmatter
description, no invisible Unicode, external URLs pinned and justified — the
provenance rule already covers third-party code); (2) review-security of the
repo's own SKILL.md files as a one-off sweep.

**2602.12430 Agent Skills survey (v4).** Synthesis; confirms the abstraction the
repo bet on converged industry-wide. Reference only.

### AGENTS.md / instruction files axis

**2602.11988 Evaluating AGENTS.md** vs **2601.20404 impact-on-efficiency.**
Conflicting evidence: 2602.11988 (SWE-bench) finds context files do not improve
success and cost +20% tokens, with instructions well followed but repository
*overviews* unhelpful; 2601.20404 (real PRs) finds a root AGENTS.md associated
with reduced tokens and faster completion. Reconcilable: content type decides —
actionable commands/boundaries help; descriptive architecture essays cost.
Landing: the template's AGENTS.md guidance (init-workspace) should prescribe
"commands + boundaries, no derivable-from-code description", and the repo's own
AGENTS.md is already rule-dense (fine), but the guidance text in
init-workspace/REPLICATE should record this evidence.

**2605.10039 Instruction Adherence (factorial).** File size, instruction
position, multi-file split, and adjacent contradictions measurably move
adherence (1,650 sessions). Supports the existing context budgets and the
single-AGENTS.md policy; position near top matters. Reference for template
guidance.

**2610.14766 LSCBench.** Six frontier agents: 73.6–91.3% functional pass but
only 16.4–25.1% functional *and* secure when the spec never mentions security.
Citation support for keeping review-security non-optional on changed surfaces.

## Deletions / simplifications the evidence suggests

1. **Not deletions but rule fixes:** the TDD rule (TDAD) gains a targeting
   half; prose-only gates (governance decay) migrate to scripts per the
   existing normalizer pattern.
2. **Template AGENTS.md guidance:** drop any "describe your architecture"
   section from the scaffold the template installs — evidence says it costs
   tokens and adds nothing (2602.11988 + codersera summary of the same study).
3. **Adversarial review:** reframe `--adversarial` output from additive
   findings to kill/confirm verdicts per existing finding (2604.19049), which
   also reduces token spend — fewer findings, more verified ones.
4. Nothing found that justifies deleting a whole skill or package.

## Suggested order

1. TDAD-informed TDD-rule amendment (AGENTS.md + execute-phase verification
   wording) — small, evidence-backed, high regression payoff.
2. skill-lint security + smell checks (2607.01456 + 2601.10338) — mechanical.
3. Effort-tier default amendment for executor routes (2610.34491) — pi package
   profiles; needs dogfooding before flipping defaults.
4. Adversarial kill-mandate reframe (2604.19049 + 2608.09290 reflector) —
   review-change wording + conductor option.
5. Prose-gate → script audit (2606.22528) — continues D-31-6.
6. Issue #174 scope note: kw-bench inertia + governance decay as recorded
   constraints for the state-flow v1 design.
