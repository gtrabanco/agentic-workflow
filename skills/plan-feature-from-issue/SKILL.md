---
name: plan-feature-from-issue
user-invocable: false
version: 1.7.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal step of plan-feature: turn a feature-request issue into a scoped,
  sized, roadmap-mapped SPEC **product half** (capability closure satisfied)
  with Closes #N traceability.
---

# Plan Feature — From Issue (internal)

Convert a feature-request issue into the project's planning artifacts, keeping a
clean issue → SPEC → PR(Closes #n) trace. Writes the SPEC's **product half**
(same two-halves convention `design-feature` uses) and must satisfy capability
closure before handing off — a thin issue does not get a shortcut around it.

## When to use

- The `plan-feature` router calls this when the input is a GitHub issue (or
  `--from-issue N`) that describes new product capability.

If the issue is a **bug or tech-debt**, stop and route it: `triage-issue` to
classify, then `plan-fix` + `execute-phase --fix`. This skill is for
genuine features only.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the feature SPEC template, the roadmap, and the issue/PR
templates (`.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`) so the
SPEC mirrors the fields reviewers expect. Then read the issue (forge CLI per the
project's Workflow conventions — examples use `gh`):

```sh
gh issue view <N> --json number,title,body,labels,state,comments
```

## Process

1. **Classify first.** Confirm it is a feature. Not a feature if it describes a
   defect, regression, duplicated code, perf debt, or carries a "when to
   fix / trigger" clause → hand to `triage-issue`. State the verdict explicitly.
2. **Normalize language.** If not in the project's docs language (this repo:
   **English**), translate before drafting any artifact.
3. **Map to the roadmap.** Assign the next number + slug. Identify dependencies
   and conflicts with existing features, coupling/migration risks, and whether
   it should instead extend an existing feature.
4. **Close product-half gaps proactively.** Compare the issue against what a
   complete SPEC **product half** needs (goals, scope in/out, business goals,
   i18n/SEO/a11y/pricing per the docs map, a UI design reference when the
   feature has a UI surface), probing the same fixed **vagueness rubric**
   `design-feature`'s interview uses: affected users/roles · error & edge
   states · data shape · boundaries & limits · out of scope · success
   criteria — each slot filled or explicit `n/a: <reason>`. For each genuine
   gap you can't safely default, ask the user **one question per turn, never
   batched**, each with a recommended default; never ask what the issue or
   docs already answer. **Structural hand-off threshold:** if ≥ 3 rubric
   slots remain unfillable from the issue plus the answers so far, stop and
   hand the feature to `design-feature` (the thin-issue rule below, now with
   a fixed trigger) instead of continuing to interview here.
5. **Satisfy capability closure.** Walk the same fixed checklist
   `design-feature` uses (per entity: CRUD + state transitions, each with UI +
   API + test, or explicit `n/a: <reason>`; per capability: entry point + ACL;
   per role: assigned/revoked/viewed where) into the SPEC's `## Capability
   closure` and `## Acceptance criteria`. **A thin issue that doesn't carry
   enough to fill it is not a shortcut around the gate** — hand it to
   `design-feature` (compose in-turn only at ≥ this skill's tier, per
   *Guardrails*; otherwise hand off with `run /design-feature <slug>` and stop
   here) rather than stamping `designed` on a hollow closure.
6. **Size it.** Estimate `XS / S / M / L` (scale defined in the SPEC template)
   and record it in the SPEC. XS/S → the SPEC is the only planning artifact
   (single-pass execution); M/L → full artifact set. If L, propose splitting.
7. **Produce the SPEC product half.** Fill it and stamp `## Design status:
   designed` once closure is complete; set the roadmap row (added at `idea`
   first if it didn't exist) to `defined` in the same edit — the same
   `idea → defined` transition `design-feature` owns, performed here when this
   skill is the one that satisfies closure. The `plan-feature` router then runs
   `plan-feature-scaffold` for the engineering half + `defined → planned`
   roadmap promotion.
8. **Wire traceability.** Record `#N` in the SPEC; the PR body must include
   `Closes #N` so the issue closes on merge.
9. **Hand off — return exactly** (fixed completion report, back to the router):

   ```
   ISSUE #<N> → SPEC <slug> — size: <XS|S|M|L>
   Verdict: feature (not bug/debt — else this would have routed to triage-issue)
   Gaps closed: <n> asked / <n> defaulted (logged)   Closure: designed | handed to design-feature
   Traceability: Closes #<N> wired
   → scaffold next (plan-feature-scaffold)
   ```

## Guardrails

- Don't silently expand scope beyond the issue — surface additions as proposals.
- Don't open the feature branch or write code here.
- Keep the `Closes #N` link; an issue-born feature must close it.
- **Never stamp `## Design status: designed` with a blank Capability closure
  row** — the same rule `design-feature` follows; a thin issue hands off
  instead of faking closure.
- **Composition tier.** Composing `design-feature` in-turn for a thin issue is
  allowed only when this skill is running at ≥ `design-feature`'s tier
  (planning-class — strongest model / highest effort); otherwise hand off
  (`run /design-feature <slug>`) rather than under-power it.
- Otherwise honor the project's **Workflow conventions** (branch/PR, docs-language).

## Architectural invariants

The [planning preflight](<../planning-preflight/SKILL.md>) owns the normalized
repository state read and the ONE final architectural classification for the
whole plan. Consume it here before writing the product half: for each applicable
invariant rule, cite its ID and repository evidence and classify the issue
proposal as `preserves`, `violates`, `introduces`, or `changes`. Only
`preserves` can be stamped `designed`; every other classification stops for an
explicit architectural decision through the project-declared authority — never
before the full plan exists, and never inferred from the issue body, SPEC, or
passing test.

## Relationship to other skills

- `triage-issue` — decides bug vs feature vs defer; call it if unsure.
- `plan-fix` — the fix-side sibling for bug/debt issues.
- `design-feature` — receives thin issues this skill cannot safely close
  capability closure for; both write the SPEC's product half in the same format.
- `plan-feature-scaffold` — fills the engineering half once the product half
  is designed.
- `execute-phase` — executes the phases; its PR carries `Closes #N`.

## Done when

- A filled SPEC product half + planning artifacts exist, roadmap-registered.
- Capability closure is satisfied (or the issue was handed off to
  `design-feature` instead of faking it) and `## Design status` is accurate.
- The roadmap row status is `defined` (added at `idea` first if new) whenever
  `## Design status: designed` was stamped — never `defined` on a hollow
  closure, never left at `idea` once `designed` is stamped.
- `#N` is recorded and the PR plan includes `Closes #N`.
- Scope gaps were resolved with the user, not assumed.
