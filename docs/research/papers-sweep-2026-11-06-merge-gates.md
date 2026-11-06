# Papers sweep addendum — 2026-11-06 (merge gates, agentic PRs, merge conflicts)

Focused sweep requested 2026-11-06 during the audit-pr review of the ODD/OpenSpec/RPI
comparison. Scope: literature on merge gating, merge decisions for agent-authored PRs,
and merge-conflict prediction/resolution — the surfaces the `[audit-pr]` phase decisions
touch. The main sweep remains [papers-sweep-2026-11-02.md](papers-sweep-2026-11-02.md).

## Verdict table

| Source | Title (short) | Verdict | Lands on |
|---|---|---|---|
| [arXiv 2605.22534](https://arxiv.org/html/2605.22534v1) | Why Are Agentic Pull Requests Merged or Rejected? | **APPLY (evidence)** | merge-decision policy: outcome labels are not a quality signal; typed MERGE-READY receipt + never-auto-merge rule |
| [arXiv 2601.15195](https://arxiv.org/pdf/2601.15195) | Where Do AI Coding Agents Fail? (AIDev-pop, 33k PRs) | **APPLY (taxonomy)** | failure-class vocabulary for the review-loop corpus metric (issue #437) and audit-pr's false-negative measurement |
| [arXiv 2606.13175](https://arxiv.org/abs/2606.13175) | The End of Code Review (merge-workflow sections) | **APPLY (addendum to existing REFERENCE entry)** | merge-gate redesign + the *accountability gap* of automated approvals → human merge decision stays |
| Brindescu, Ahmed, Leano & Sarma, ICSE 2020 ([PDF](https://web.engr.oregonstate.edu/~sarmaa/wp-content/uploads/2020/08/paper15.pdf)) | Planning for Untangling: predicting merge-conflict difficulty | **APPLY (direction)** | move the merge-order check earlier (plan-time compatibility), not audit-time only |
| Julia et al., ICSE 2019 ([PDF](https://people.ece.ubc.ca/mjulia/publications/Predicting_Merge_Conflicts_in_Collaborative_Software_Development_2019.pdf)) | Predicting Merge Conflicts in Collaborative Software Development (744 repos) | **APPLY (direction)** | same as above — conflicts are predictable before the merge |
| Borba et al., IST 2020 ([PDF](https://pauloborba.cin.ufpe.br/publication/2020understanding_predictive_factors_for_merge_conflicts/2020ISTPredictiveFactorsForMergeConflicts.pdf)) | Predictive factors for merge conflicts | **APPLY (inputs)** | conflict predictors (cross-cutting concurrent edits, branch size, sub-projects) are near-deterministic plan-step checks |
| Brun, Holmes, Ernst & Notkin, ESEC/FSE 2011 | Crystal — proactive detection of collaboration conflicts | **APPLY (direction)** | early-detection precedent for the plan-time merge check |
| Shen et al., OOPSLA 2019 | InteliMerge — refactoring-aware merging | **REFERENCE** | refactoring-aware merge handling context; no direct adoption |
| [Zhang et al., 2022 (Yale/Piskac)](https://www.cs.yale.edu/homes/piskac/papers/2022ZhangETALmerge.pdf) | Gmerge — LLM resolution of semantic merge conflicts | **APPLY (boundary)** | LLM conflict resolution at 64.6% accuracy → conflicts stay executor work with typed blockers, never auto-resolved at the gate |
| [arXiv 2605.16646](https://arxiv.org/html/2605.16646v1) | LLM-based vs search-based merge-conflict resolution | **REFERENCE** | same boundary; confirms no paradigm is safe enough to auto-resolve |
| [arXiv 2510.10290](https://arxiv.org/abs/2510.10290) | Grounded AI for code review (enterprise pipelines) | **CANDIDATE — not evaluated** | resource-efficient routed review; possible #201/#414 relative |
| Aðalsteinsson et al., ESEM 2025 | Rethinking code review workflows with LLM assistance | **CANDIDATE — not evaluated** | candidate input for the review phase; evaluate before adoption |
| Hilton et al., ASE 2016 | Usage, costs and benefits of CI in open-source | **CANDIDATE — not evaluated** | CI-gate economics context (publish-gate profile decisions, #436) |
| Beller et al., ICSE 2017 | Oops, my tests broke! (Travis build failures, flaky builds) | **CANDIDATE — not evaluated** | gate false-positive caution; supports the offline push-gate subset |
| Khomh et al., EMSE | Do faster releases improve software quality? | **CANDIDATE — not evaluated** | release-cadence gate trade-offs |

## The decisions this evidence shaped (recorded in #307)

1. **Merge outcome ≠ quality signal** (2605.22534): 33.1% of rejected agentic PRs had no
   observable decision rationale and only 35.7% reflected real agentic failures; 15.4%
   of *merged* PRs needed reviewer involvement afterwards. The workflow therefore gates
   merges on **SHA-bound typed receipts**, never on the merge outcome alone.
2. **Never-auto-merge has a scientific base** (2606.13175): the merge gate can be
   agent-in-the-loop, but *automated approval leaves an accountability gap when a change
   causes harm* — the named human decision-maker stays (owner rule, #307 merge-gate design
   note). Revision possible only when the corpus demonstrates complete gate coverage.
3. **Conflicts move earlier** (ICSE 2019 / Brindescu ICSE 2020 / Brun 2011): merge-conflict
   prediction is feasible mid-development, so the `git merge-tree` check graduated from
   audit-only to a **plan-time compatibility check** (recorded as #307 design note 10),
   with the audit-time check remaining as the fail-closed terminal.
4. **Conflicts resolve at the executor, never at the gate** (Gmerge 64.6% accuracy;
   2605.16646): no paradigm is reliable enough to auto-resolve; the gate emits a typed
   blocker and the executor drives (with review), per the repair-batch design.

## Attribution note

Decisions above live in #307 design notes (issues, not committed surfaces). Per
`ATTRIBUTION.md` policy, the `evidence only` rows for arXiv 2605.22534, 2601.15195 and
the merge-conflict cluster were appended in the same PR as this addendum; any surface
that later *adopts* these mechanisms appends its own row. Corpus-taxonomy adoption
(#437's classifier keys) will cite 2601.15195 explicitly.

*Automated written using AI.*
