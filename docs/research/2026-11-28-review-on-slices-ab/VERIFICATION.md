# Reproduction & verification notes

Everything needed to rebuild the experiment against this repository (or a
unit-of-the-month re-run), plus the honest defects found in the instrument
itself. Ground truth: the two units' committed cycle-1 ledgers; the
instrument: [harness/](harness/) with the packed per-call outputs
(`harness/out/*.json`, 112 records).

## Byte reconstruction of the change sites

Review contexts were built by `harness/build-contexts.mjs` from these
revisions (all reachable from `origin/main`):

| Unit | Review base | Review tip | Delta scope reproduced |
|---|---|---|---|
| fix/258 (`docs/fix/258-harden-needs-input-contracts/`) | design base `8a6417a2b` | reviewed head `d7c8b8341` | 11 files, +328/−11 — matches the ledger's own scope line |
| fix/224 (`docs/fix/224-deterministic-replan-routing/`) | branch fork `b5358666` | reviewed head `0e35b189` | 98 files, +2329/−146 — matches the U2 cycle-1 scope line. The PR #225 head lives on rewritten (unreachable-from-main) history: do **not** trust its recorded base without this reconstruction step. |

Caveat honestly recorded: the fork of fix/224 is provable only as "the newest
ancestor of the tip that is also an ancestor of origin/main" — the true
(original-history) fork base is not reachable, so the reconstruction can be a
*superset* of the exact review-time delta, never a jackpot cut. Same caveat
applies to unit 258's tail. Every scope statement above was verified against
the reconstructed bases, never taken from the ledgers' prose.

For each changed file the rendered context = unified diff (base→tip) + the
file's post-change content at the tip, truncated where the context-budget
notes below say. The review prompt named this repository's own review axes
(code, workflow, usage-docs, spec-drift, security, perf, brand) and required
evidence-backed defects only — it never leaked the ground truth, the
ground-truth ids, or either ledger's contents. Both arms received
byte-identical material; they differ only in scope.

## Which defects are countable per arm — and the instrument's limits

Recall scoring (harness/score.mjs) matches a reported finding's target file
against the ground-truth finding's cited files (exact/suffix/prefix after path
normalization; a leading dot in `.claude/`-style paths is never stripped — the
session's first draft matcher had that bug and every committed number here is
recomputed with the fixed matcher). Instrument notes that shape the
"countable" sets, before any arm comparison:

- **fix/258, ceiling 8**: all eight ledger ids reach reportable form through
  this material. U1-F3's strongest form is a SPEC↔skill-prose contradiction
  (the two halves live in different slices); the slices arm hit it via
  manuscript-adjacent slices, the mono arm via its evidence-row half, so it
  costs both arms equally. U1-F8 (unit-doc bullet grammar) is a mechanized
  class (`scripts/phase-lint.mjs` — its own cycle-3 PASS row exists on the
  ledger) that prose review reproduces only partially.
- **fix/224, ceiling 9**: F4/F5 are stale-sentence defects whose implicated
  prose sits outside the changed diff (the reference pages describing the new
  `next.suggested` behavior). A content-reader arm cannot see them; that is an
  instrument limit, not an arm property — they are excluded from the ceiling
  (11 recorded ids − 2). F21/F22 are process-row classes (gate/ledger receipt
  states), unreachable from change-site material for any arm. U2-F1 (the
  registry manifest row) needed the read-anchor move below.
- **The read-anchor move**: one slice included the *unchanged*
  `.claude-plugin/plugin.json` as rendered context next to the budgets and
  release-notes diffs that contribute registry-relevant rows. The F1 catch
  then landed in both strong-model slice arms. Without an anchor (mono, or a
  slice set without the anchor) the class stayed blind. Recorded as a
  design requirement, not a hazard: any executor-side slice plan must include
  shared surfaces as check-anchors, never as free riders.

## The instrument's own defects (found and fixed during the run)

1. **qwen3.6/gemma4 are reasoning-first on the nan chat API.** Without
   `enable_thinking:false` they spend the entire completion budget on hidden
   reasoning and return empty `content` (deterministic at temperature 0 +
   fixed seed; reproduced twice on probes). All weak-tier results ran with the
   toggle off. glm5.3-flash and deepseek-v4-flash need no toggle.
2. **Runaway reasoning degenerated 2/68 weak-tier calls** (qwen3.6 on the same
   big slice twice; unrecoverable; recorded as zero-yield, so every slices-arm
   number is a floor). Truncated-JSON responses were salvage-by-prefix decoded
   where a complete object boundary is recoverable (3 strong-tier calls; the
   raw records carry `truncated: true`, nothing was silently repaired).
3. **Context truncation budget** (declared in
   `harness/build-contexts.mjs::contentCap`, a design choice, not a hidden
   bias): CHANGELOG 1200 bytes (they are large tables; the diff carries the
   defect), reference pages ≤9000, mirrored skill copies 4000, fixtures ≤400,
   everything else 12000, plus a "diff-only" rule for any file whose rendered
   content would otherwise exceed the call window. A re-run must re-declare
   these caps.
4. **The prefix-suffix matcher and dedup.** Scoring never deduplicates: two
   reports naming one GT id count as one hit; extra distinct findings stay in
   the raw counts (the precision-debt numbers). The fixed matcher never strips
   a leading dot — `.claude-plugin/plugin.json` matches only itself.

## How to re-run

```bash
# prerequisites: bun, NAN_API_KEY in the environment, this repository cloned
cd docs/research/2026-11-28-review-on-slices-ab/harness
bun build-contexts.mjs <REPO_ROOT>          # writes ctx/<U?> — deterministic
OUT_DIR=harness/out bun run-reviews.mjs      # appends out-<call-id>.json records
# (record dir for the session's run: harness/out/)
OUT_DIR=<records-dir> bun score.mjs          # reproduces results/arm-summary.md
```

Three probe calls per model (max_tokens 16) settle whether the model reasons
first (see note 1) before spending a review budget. Deterministic parts:
context construction and scoring. Non-deterministic parts: the model outputs
(temperature 0 + seed still vary upstream); the pass-to-pass spread measured
here (±1 id on most cells) matches the published stability figures in
external-evidence.md.
