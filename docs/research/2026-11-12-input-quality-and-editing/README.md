# Input quality & the editing stack — session report (2026-11-12)

Owner-directed research session answering five connected questions: (1) what science
exists on good initial prompts for software development, (2) whether powerful models
still need guards, (3) how alternative harnesses turn a vague prompt into a good one,
(4) whether regeneration is cheaper than refactoring with LLMs, and (5) where LSP-style
structure-aware editing fits against diffs and whole-file regeneration. The full paper
verdicts live in [papers-sweep.md](papers-sweep.md); this file records the narrative,
the decisions taken, and where each one landed.

Sources fetched live during the session: arXiv API queries, the gentle-ai and
gentle-shell READMEs, Kumoss's README, the DeepSeek Harness landing page, and the
Cloudflare OS repository (the landing page os.cloudflare.app is client-rendered; the
owner supplied the GitHub repo, which is the source used here).

## The questions and the answers

1. **Is there science on good prompts for software development?** Yes — and the
   adaptive-elicitation idea the owner proposed is no longer a science gap: a 2026
   arXiv cluster (six papers, see the sweep) gives it a measured design. Key result:
   a checklist-first template beats a free interview on quality *and* tokens
   (2605.20149), and elicitation only helps when the questions are behavior-changing
   (CONTRA, 2610.01769) and the elicitor is a different model family than the
   implementer (2610.22382 — same-model elicitation measured **negative**).
2. **Do powerful models still need guards?** Yes. Governance Decay (2606.22528:
   constraint violations 0→19–59% post-compaction), LSCBench (2610.14766: frontier
   agents 73–91% functional but 16–25% functional *and* secure), Gmerge (64.6%
   conflict resolution), Refute-or-Promote (2604.19049: cross-family critics catch
   correlated blind spots). The problem is system complexity, not model capability.
   Cloudflare OS independently corroborates: it ships an entire security framework
   (Gatekeepers) precisely because non-technical users plus agents need guardrails
   regardless of model power.
3. **What do other harnesses do with vague initial prompts?** Nobody ships the
   adaptive user-level/domain interview. Three dominant patterns: (a) verbatim-spec
   protection (gentle-ai ODD — measured: paraphrased handoffs failed 13/26, spec
   passed by reference accepted first round, gentle-shell#1718); (b) organization
   standards gathered as context (Kumoss — policy-as-code; Cloudflare preloaded
   company knowledge); (c) templates plus sandboxed blast radius (Cloudflare OS
   Blueprints + Gatekeepers). DeepSeek Harness publishes no mechanism in this space.
4. **Is regeneration cheaper than refactoring with LLMs?** Confirmed, with one
   inversion. Whole-file direct generation beats iterative diff-editing on every
   measured metric (2609.05779) and whole-file verbatim context beats compressors and
   retrievers at equal token budget (2610.21073) — but the two categories where
   localized diff-editing still wins are exactly **refactoring and error-handling
   fixes**, and on long files block-level diffs match accuracy at −30% cost
   (2604.27296). Regeneration is cheaper in reliability and engineering time; diffs
   of blocks are cheaper in tokens on long files. Whole-project rewrite-vs-refactor
   has no direct paper found — the Cloudflare gadget-level claim remains a product
   philosophy, not a measured result in the literature found.
5. **Where does LSP (Serena-style) fit?** It is an orthogonal axis, not a third rung
   of the ranking: LSP answers *where and with what context*, diff-vs-regeneration
   answers *how to write the change*. Map-based representations save 17–39% tokens
   when localization is the bottleneck, but gains narrow when the decisive step is
   patch authoring (2611.07286); fault-localization methods can cost more tokens than
   they save during repair (2610.25826); frontier agents localize 98.2–99.9% of
   faults from source alone, so tool-assisted localization value grows with repo
   size and shrinks with task size (2610.36015).

## The composed stack the evidence supports

```
1. Localization        LSP/call-graph/AST when the repo is large and the symbol
                       dispersed; rg + read when the task is small
2. Context             whole files verbatim for the files being edited — never
                       compress the lines that will be touched
3. Writing             regenerate the file for new behavior; block-level localized
                       edit for refactoring/error-handling; block diffs as the
                       long-file fallback
4. Preservation        "change the minimum necessary" — measured: excess edit
                       distance 0.195→0.131, added complexity −26.6%, Pass@1 +2.3
5. Verification        gates + the differential baseline check make the larger
                       regeneration diff auditable mechanically
```

Every step already has a home in this workflow (Serena feature 67, the per-phase
`Relevant files:` lists, the tier system's one-shot/passive vs repair split, the
#363/#437 differential check) except step 4 — recorded as a candidate amendment on
#307 (extension of design note 6, rides the future repair-mode slice).

## Harness survey (why nobody has the interview)

| Harness | Mechanism for vague prompts |
|---|---|
| gentle-ai / gentle-shell (ODD) | Spec verbatim in one recoverable feature doc + resumability sizing; clarifies only real decisions |
| Kumoss (InditexTech, IaC) | The organization is the interview: deployed infra + IaC repo + governance standards as context; policies as code; high-impact changes lock for admin review; all prompts traced |
| DeepSeek Harness | "Everything is a plugin" (Cordis); no visible initial-prompt guidance mechanism |
| Cloudflare OS (v2) | Blueprints (whole-app templates — the vague prompt lands on a skeleton), preloaded company knowledge, Gatekeepers (capability-based access, async HITL with simulated outcomes so the agent never stalls on approval); explicit goal: non-technical users can "go nuts" safely — the sandbox makes vagueness *safe* even when the result is mediocre. Their thesis is the inverse of the interview: **reduce the cost of being wrong instead of the probability** (every user runs a private copy; a wrong gadget is regenerated, not repaired) — it maps onto one-shot/passive tiers, not repo-level work. Built on Pi (`pi-agent-core` credited); their contribution policy states the same thesis this repo is built on ("AI made writing code easy; the hard part is reviewing it, keeping quality and coherence") |

## Decisions taken this session (owner-approved)

| Decision | Rationale | Landed on |
|---|---|---|
| File **#526 — evidence-backed elicitation layer** (triaged `promoted`, native `blocked-by` #441) | The clarification cluster has no owner; #441's `one-shot` verdict is its consumer; implementation gated on #307 kernel slices + golden fixture per the repo's one-mechanism and dogfooding rules | Issue #526, roadmap row 526 |
| File **#527 — README evidence rationale** (triaged `postponed`, dated un-postpone trigger: before the next stable cut) | A docs unit against committed sources only; the README must state shipped behavior, so it waits for #307's headline slices | Issue #527, roadmap row 527 |
| Record the **preservation instruction** on #307 (comment extending design note 6) instead of editing fold-findings/execute-phase wording now | fold-findings is slated for retirement post-#307; wording applied now would be re-based and thrown away — no-rework rule | #307 comment |
| Register the preservation-instruction, regeneration and LSP clusters as **evidence-only** ATTRIBUTION rows | Nothing is adopted yet; the ledger policy prefers a row over silence | ATTRIBUTION.md, this sweep |
| Defer all implementation: elicitation layer, repair wording, one-shot regeneration philosophy, LSP-tier cost mapping, executor verbatim/block-diff guidance | Un-mechanism rule (#307 note 1), mid-refactor rebase cost (#434 in flight, #436 planned), TDAD lesson (deliver context, not procedure — elicitation can hurt), golden-fixture-before-dogfooding | The "post" column of the session's now/post split |

## Execution record (2026-11-12)

- Issues created: [#526](https://github.com/gtrabanco/agentic-workflow/issues/526)
  (elicitation layer), [#527](https://github.com/gtrabanco/agentic-workflow/issues/527)
  (README rationale). Both triaged with evidence-grounded comments;
  #526 carries the native `blocked-by` → #441 (GraphQL `addBlockedBy`).
- Roadmap: feature rows 526 and 527 appended; missing open-issue rows added for
  #471 and #514; row 494 linked to its implementation issue #504.
- ATTRIBUTION.md: 17 evidence-only paper rows + 3 `studied` project rows appended.
- Roadmap rows for all other open issues verified present (#521, #487, #470, #424,
  #352, #295, #444, #441, #438, #436, #437, #434, #307/row 83, #504/row 494).

## Known pre-existing reds at push time (not caused by this batch)

The pre-push gate failed at push time on two suites; both reproduce on `main`
before this batch and neither references a file it touched:

1. `roadmap-settle` — the fix/521 doc carries PR #523's URL but roadmap row #521
   still reads `in-progress` (the `done · #523` settlement is the close-out of that
   unit, still open on the forge). Owned by #521's close-out.
2. `prose-gate-inventory` — `multiple-homes` on `GATE_INVENTORY.md` caused by the
   three active in-progress worktrees (`.worktrees/feat-352-*`, `.worktrees/feat-438-*`,
   `.worktrees/feat-514-*`) each carrying their own copy. Environmental: resolves
   when those units merge and their worktrees are removed. Not a committed-surface
   defect.

The push therefore used the hook's documented escape
(`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`) with this note as the recorded why, per the
unit-420 precedent. The gate's docs-bearing steps that this batch *can* affect were
run and passed: `docs-generate --check` (projection current, verdict PASS),
`residue-dimensions` (29 pass), and the crate suite (659 pass).

## Attribution note

Per `ATTRIBUTION.md` policy, the `evidence only` rows for every paper in
[papers-sweep.md](papers-sweep.md) and the `studied` rows for cloudflare-os, kumoss
and deepseek-harness were appended in the same change that committed this folder.
Any surface that later *adopts* one of these mechanisms appends its own row.
