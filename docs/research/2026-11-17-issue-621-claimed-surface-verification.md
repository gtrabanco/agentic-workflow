# Issue #621 — batch-scheduler claimed-surface verification: evidence, fix plan and re-test protocol

Date: 2026-11-17 · Branch under review: `fix-621-batch-scheduler-surface-verification` at `2f76ee8b` · Fix PR: [#622](https://github.com/gtrabanco/agentic-workflow/pull/622) · Fix commit: `803dc8b4`

This note is the evidence carrier for the owner-directed review of issue #621. It
records (1) how the review was conducted, (2) the findings with file-and-line
evidence, (3) the test report of every run performed, (4) the scientific and
bibliographic context, (5) the ordered plan to land the fix correctly, and (6)
the protocol to re-test the scheduler once that plan is implemented. No code was
changed in this pass — the issue was re-defined and this note is its evidence.

## 1. Method

1. Read issue #621, PR #622 and the full diff of commit `803dc8b4` against its
   parent (`git show 803dc8b4`, `git show 803dc8b4^:scripts/batch-scheduler.mjs`).
2. Empirical replication: throwaway branches + local worktrees were created
   (`feat/616-surface-probe`, `feat/59999-surface-check`) and the scheduler was
   run pre-fix (a worktree checked out at `803dc8b4^`) and post-fix with
   `--no-state` (pure read, writes nothing). All throwaway artifacts were
   removed afterwards (`git worktree remove … --force`, `git branch -D`).
3. Synthetic probe against the exported pure planner `buildBatchPlan` (see §6.3)
   for the parent-surface case, which the live tree could not isolate.
4. Suites re-run at `2f76ee8b`: `bun test scripts/batch-scheduler.test.mjs`
   (87 pass / 0 fail), `cd packages/agentic-workflow-schema && bun run test`
   (907 pass / 0 fail), `bun scripts/check-skill-context.mjs --routes` (PASS,
   14 routes).
5. Literature: the repository's own merge-gates sweep
   ([papers-sweep-2026-11-06-merge-gates.md](papers-sweep-2026-11-06-merge-gates.md))
   plus external sources (§4).

## 2. Findings

### F1 — The issue's "local worktrees were not detected" claim is inaccurate

The pre-fix code already crossed local branches with real worktrees:
`collectLaunchEvidence` ran `git worktree list --porcelain` and filled
`slot.worktree` per branch (`803dc8b4^`, lines 393–405), and `staleClaimReason`
already used the missing-worktree case for the deleted-worktree scenario (issue
#509, S8). Launch evidence came from **local** `refs/heads`; the forge only
supplies PR state. Empirically: with pre-fix script + local branch
`feat/616-surface-probe` + worktree, the plan already reported the branch as
in-flight and its lanes occupied. The only post-fix delta is the `[worktree]`
tag in the evidence string (`scripts/batch-scheduler.mjs:493–505`) — a
diagnostic label, not a new detection capability. The genuinely new part of the
fix is `claimed_surface` (the issue's second problem), which was real.

### F2 — Contract violation: a new core field without the version bump

`packages/agentic-workflow-schema/src/batch-plan.ts` states in its header:
"**Core is closed.** … anything a consumer needs beyond it is a **version
bump**" (lines 10–15) and over the constant: "adding or changing a core field
bumps this" (lines 26–28). The #509 note in the same file records the precedent:
finding-code additions were "vocabulary only — no field is added, so the version
stays put" (lines 41–47), and fix/460's Decision D1 left it in writing that "a
field addition without a version bump would violate the same contract". The fix
adds the `claimed_surface` key inside the closed `issues[]` key set
(`batch-plan.ts:78,153,340`) while `BATCH_PLAN_VERSION` stays `3`
(`batch-plan.ts:28`). By the documented rule this is `batch-plan@4`. The
version-history line of `skills/batch-scheduler/references/PLAN.md` (lines 8–11)
was not updated either.

### F3 — Parent-surface false positive (demonstrated)

`surfaceKeyFor(file)` maps a real file to a two-level key
(`scripts/batch-scheduler.mjs:578–591`): `skills/alpha/SKILL.md` →
`skills/alpha`. `surfaceKey(token)` (line 758) accepts the bare parent `skills`.
The parent→children expansion (`children`/`expand`, lines 1113–1130) fires only
when **another row in the same run** declares the child surface. Probe result
(§6.3): an issue declaring `skills` whose branch rewrites
`skills/alpha/SKILL.md`, with no sibling declaring `skills/alpha`, yields
`claimed_surface: ["skills"]` — the plan reports as *unverified* a surface the
branch diff does cover.

### F4 — Signal-to-noise: three conflated causes, most rows flagged

`claimed_surface` merges three causes without distinguishing them — no branch,
merged branch, or a diff that could not be computed
(`skills/batch-scheduler/references/PLAN.md:85`). A failed `git diff` is silently
treated as "no files" (`scripts/batch-scheduler.mjs:432`:
`if (diff.status !== 0) continue;`) instead of a declared degradation. In a live
`--no-state` run at `2f76ee8b`, the `claimed surfaces` summary line flagged **8
of ~9 launchable issues**, mostly the no-branch case, which carries no actionable
signal — for an issue without a branch there is nothing to verify. The useful
case (partial coverage by an existing branch) drowns.

### F5 — The fix branch name cannot be associated with its issue (accepted as-is)

The branch is `fix-621-batch-scheduler-surface-verification` — no slash — while
the scheduler's own `BRANCH_RE = /^(?:fix|feat)\/(\d+)-/`
(`scripts/batch-scheduler.mjs:362`) and the repo convention (`fix/<n>-<slug>`)
require one. Consequence: the freshly fixed scheduler cannot verify its own fix
—the live run reports #621 with all three surfaces unverified although the
branch diff covers them. **Owner decision 2026-11-17: the branch name stays as
is; no rename.** Recorded here so the follow-up unit does not "fix" it.

### F6 — Process gaps in the original issue and PR

The original issue body was written after the fix (it lists "Archivos
modificados" and "87 tests pas"), so it read as a retrospective report rather
than a specification; it was in Spanish while the fix template asks for English;
it omitted the template's required fields (Surfaces, Acceptance criteria,
Severity, Detected in); and PR #622 carries no `Closes #621`. The issue body was
re-defined on 2026-11-17 accordingly (English, template-shaped, defining the
*remaining* work). The unit doc (`docs/fix/621-…/SPEC.md`) and the roadmap row
do not exist yet — they belong to the follow-up unit's triage, not to this
evidence pass.

### F7 — Minor code notes

- The validator accepts `claimed_surface` as `string | string[]`
  (`batch-plan.ts:153,358–366`) but the only producer (`claimedSurfaceMap`,
  `batch-scheduler.mjs:1162–1170`) always emits an array; in a closed contract
  the string branch is dead surface.
- `surfaceKeyFor` has a subsumed condition: the `parts.length === 1` arm for
  `scripts/docs/template/.github` returns the same value as the following arm
  (`batch-scheduler.mjs:578–591`).
- The `[worktree]` tag is computed inside the per-branch loop with a
  loop-invariant value (`batch-scheduler.mjs:503`).

## 3. Test report (2026-11-17)

| # | What | Command | Result |
|---|---|---|---|
| T1 | Scheduler suite at `2f76ee8b` | `bun test scripts/batch-scheduler.test.mjs` | 87 pass / 0 fail (~1.1s) |
| T2 | Schema package suite at `2f76ee8b` | `cd packages/agentic-workflow-schema && bun run test` | 907 pass / 0 fail (~4.8s) |
| T3 | Context budgets | `bun scripts/check-skill-context.mjs --routes` | PASS, 14 routes |
| T4 | Pre-fix live behaviour | throwaway branch+worktree `feat/616-surface-probe`, `bun <803dc8b4^>/scripts/batch-scheduler.mjs --no-state` | branch already detected in-flight pre-fix (refutes the issue's problem 1) |
| T5 | Post-fix live behaviour | `bun scripts/batch-scheduler.mjs --no-state` with the same throwaway branch | `occupied_by: "branch feat/616-surface-probe [worktree]"` — the tag is the only delta |
| T6 | Parent-surface probe | synthetic `buildBatchPlan` call (script in §6.3) | `#10 lane=skills claimed_surface=["skills"]` — false positive reproduced |
| T7 | Live noise measurement | `bun scripts/batch-scheduler.mjs --no-state`, `claimed surfaces` line | 8 of ~9 launchable issues flagged |
| T8 | Cleanup | `git worktree remove … --force` ×3, `git branch -D feat/616-surface-probe feat/59999-surface-check` | tree restored, `git worktree list` clean |

All throwaway artifacts were removed; no repository file was modified in this
evidence pass apart from this note.

## 4. Science and bibliography

**Already adopted by this repository**
([papers-sweep-2026-11-06-merge-gates.md](papers-sweep-2026-11-06-merge-gates.md)):
the 2026-11-06 sweep applied the "conflicts move earlier" direction — Brun,
Holmes, Ernst & Notkin (**Crystal**, ESEC/FSE 2011): proactive detection of
collaboration conflicts; Julia et al. (ICSE 2019, 744 repositories): conflicts
are predictable before the merge; Borba et al. (IST 2020): conflict predictors
are near-deterministic plan-step checks; Brindescu et al. (ICSE 2020): plan-time
compatibility over audit-time detection. `claimed_surface` is a legitimate
materialization of that direction: verifying declared surfaces against the real
diff **before** launching parallel lanes is Crystal's early-warning move adapted
to an issue work graph. The same sweep fixes the boundary (Gmerge, Zhang et al.
2022: LLM conflict resolution at 64.6% accuracy → conflicts stay executor work).

**What the literature adds that the design must respect**

1. **File-overlap prediction has high recall but mediocre precision.** Accioly
   et al. (MSR 2013): precision 57.99% / recall 82.67% for edit-based conflict
   predictors. Julia et al. (ICSE 2019): precision 0.48–0.63, recall 0.68–0.83
   (Random Forest, per language). The value of an overlap signal is *ranking and
   early warning*, never certification. F4's noise is therefore the design defect
   to repair — and the issue's own wording ("a merge conflict is possible") is
   the right claim strength.
2. **Confidence erosion under false alarms.** The speculative-merge literature
   (Owhadi-Kareshk et al. 2021; the Saarland merge-life-cycle dissertation, do
   Vale) argues explicitly that users stop trusting prediction tools when false
   positives accumulate — recall of *conflicting* scenarios is preferred even at
   precision cost. Supporting this, `claimed_surface` should prefer the
   partial-coverage signal and stop reporting the no-branch case as data.
3. **Semantic conflicts without textual overlap remain undetectable** — the
   known Crystal-era limit; `claimed_surface` does not claim to cover it and
   should not.
4. **Traceability of declarations to artifacts** is the classical frame
   (IEEE 830 → ISO/IEC/IEEE 29148: every requirement verifiable; Fagan 1976:
   inspection against the artifact, not against memory). `claimed_surface` is in
   substance an automated traceability check between what an issue declares and
   what its branch produces; F2 is the same discipline applied to the contract
   that carries it.
5. **Spec-driven development, modern practice** (GitHub Spec Kit): the
   *as-specified vs as-implemented* gap is the central pain of agentic flows
   (spec-kit discussion #1686 asks for a KPI on it). #621 attacks the gap at the
   right site — plan-time, deterministic, no decision model, consistent with the
   #444/#449 substrate decisions.

**Similar projects**: Spec Kit closes the gap with per-phase checklists and
cross-artifact analysis; this repository closes it with a versioned envelope +
closed-core validator, which is the stronger carrier — provided the version bump
rule (F2) is honored.

## 5. Fix plan (ordered, for the follow-up unit)

Each step names its validator. Nothing here has been implemented yet.

1. **Bump the envelope to `batch-plan@4`.**
   `packages/agentic-workflow-schema/src/batch-plan.ts`: `BATCH_PLAN_VERSION`,
   `BATCH_PLAN_SCHEMA`, the doc-comment header, the validator message (line 283),
   and the compiled `batch-plan.schema.json` via the package's generator.
   `skills/batch-scheduler/references/PLAN.md`: grammar heading, `contract /
   version / schema` row (line 70) and the version-history line (lines 8–11).
   Changeset becomes `minor` for the schema package.
   (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
2. **Type `claimed_surface` as `string[]` only** and drop the dead string arm
   (F7). Closed contract: one shape, one producer.
   (validator: schema suite exits 0; `rg -n "claimed_surface" packages/agentic-workflow-schema/src` shows one type)
3. **Discriminate the cause or restrict emission.** Preferred per §4.2: emit
   `claimed_surface` only when a branch exists and coverage is partial; for a
   no-branch issue emit nothing (there is nothing to verify). If the owner wants
   the no-branch case kept, add a cause discriminator field — that is another
   core-field addition and rides the same `@4` bump. A failed `git diff`
   (`batch-scheduler.mjs:432`) must produce a declared `degraded[]` entry, never
   silent "no files".
   (validator: new scheduler-suite cases — partial-coverage keeps the field, no-branch drops it, diff-failure degrades)
4. **Fix the parent-surface false positive** (F3): a declared parent surface is
   verified when any actual file key resolves under it (e.g. `actual.has(s) ||
   actualKeys.some((k) => k.startsWith(`${s}/`))`), independent of sibling
   declarations.
   (validator: the §6.3 probe prints no `claimed_surface` for the probe input)
5. **Update the human summary** so the `claimed surfaces` line only lists what
   remains actionable after step 3.
   (validator: `bun test scripts/batch-scheduler.test.mjs` exits 0 including the summary cases)
6. **Documentation currency in the same PR**: `PLAN.md`, `SKILL.md`,
   `docs/generated` projection (`bun scripts/docs-generate.mjs`), and the unit
   doc `docs/fix/621-…/SPEC.md` + roadmap row at triage. The PR that closes this
   issue carries `Closes #621`.
   (validator: `bun scripts/docs-generate.mjs --check` exits 0)

Non-goals for the follow-up unit: renaming the branch (owner decision, F5);
semantic-conflict detection (§4.3); any launcher/orchestrator behaviour (the
planner never launches, #449 non-goal).

## 6. Re-test protocol (run after re-implementing §5)

### 6.1 Static and suites

```bash
rg -n "BATCH_PLAN_VERSION = 4|batch-plan@4" packages/agentic-workflow-schema/src/batch-plan.ts   # bump present
cd packages/agentic-workflow-schema && bun run test                                              # schema suite green
bun test scripts/batch-scheduler.test.mjs                                                        # scheduler suite green
bun scripts/check-skill-context.mjs --routes                                                     # budgets PASS
bun scripts/docs-generate.mjs --check                                                            # projection clean
```

### 6.2 Live workgraph experiments (throwaway artifacts, remove afterwards)

```bash
# 1. A branch whose diff covers only part of what its issue declares.
git worktree add .worktrees/probe-partial -b feat/616-surface-probe
bun scripts/batch-scheduler.mjs --no-state
#   expect: #616 rows carry claimed_surface ONLY for the declared surfaces the
#   diff does not cover (docs, scripts) — the covered ones must not appear.

# 2. A branch + worktree for an issue with an open PR (in-flight tagging).
#   expect: occupied_by / evidence strings carry the [worktree] tag exactly as
#   the pre-existing behaviour does (regression guard).

# 3. An issue with no branch at all.
#   expect: no claimed_surface on its rows (or the typed cause marker if the
#   owner chose the discriminator variant), and no degradation invented.

# cleanup — always:
git worktree remove .worktrees/probe-partial --force && git branch -D feat/616-surface-probe
git worktree list   # must show no probe entries
```

### 6.3 Synthetic probe (deterministic, no git needed)

Save as `/tmp/probe-parent-surface.mjs`, run `bun /tmp/probe-parent-surface.mjs`
from the repository root, delete the file afterwards:

```js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildBatchPlan } from "<repo-root>/scripts/batch-scheduler.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "probe-"));
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "ROADMAP.md"), "# Roadmap\n\n## Features\n\n| # | Title | Status | Notes |\n|---|---|---|---|\n");
const issues = [{ number: 10, title: "Parent surface issue", state: "OPEN", labels: [],
  body: "## Where\n\n- `skills`", author_association: "OWNER", blockedBy: [] }];
const launchEvidence = new Map([
  [10, { branches: [{ name: "feat/10-parent", merged: true }], pr: null, worktree: null,
         files: ["skills/alpha/SKILL.md"] }],
]);
const plan = buildBatchPlan({ issues, root, head: "HEAD", launchEvidence });
for (const b of plan.batches) for (const l of b.lanes) for (const i of l.issues)
  console.log(`#${i.number} lane=${l.surface} claimed_surface=${JSON.stringify(i.claimed_surface)}`);
fs.rmSync(root, { recursive: true, force: true });
```

- **Before** the fix (observed 2026-11-17): `#10 lane=skills claimed_surface=["skills"]`.
- **After** the fix (expected): `#10 lane=skills claimed_surface=undefined`.

### 6.4 Contract regression guard

Feed an envelope carrying `claimed_surface` but stamped `batch-plan@3` to
`validateBatchPlan` after the bump — it must refuse (version mismatch), proving
the closed-core rule is enforced and not just renamed.

## 7. Owner decisions recorded (2026-11-17)

- The branch `fix-621-batch-scheduler-surface-verification` **stays** as named;
  no rename (F5).
- The issue #621 body was re-defined in English, template-shaped, covering the
  *remaining* work of this unit; implementation is deferred to the follow-up
  lane — nothing was implemented in this pass.
- This note is the evidence carrier for that re-definition.

## References

- Issue [#621](https://github.com/gtrabanco/agentic-workflow/issues/621) · PR [#622](https://github.com/gtrabanco/agentic-workflow/pull/622) · commit `803dc8b4`
- [docs/fix/460-batch-scheduler-verification/SPEC.md](../fix/460-batch-scheduler-verification/SPEC.md) — the same sensor's prior unit (D1 records the version-bump precedent)
- [docs/research/papers-sweep-2026-11-06-merge-gates.md](papers-sweep-2026-11-06-merge-gates.md) — the adopted merge-gate direction and its boundary
- External: Accioly et al., MSR 2013; Julia et al., ICSE 2019; Borba et al., IST 2020; Brun et al., ESEC/FSE 2011 (Crystal); Brindescu et al., ICSE 2020; Zhang et al., 2022 (Gmerge); ISO/IEC/IEEE 29148; Fagan, IEEE TSE 1976; GitHub Spec Kit and its discussion #1686
