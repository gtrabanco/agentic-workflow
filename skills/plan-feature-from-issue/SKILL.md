---
name: plan-feature-from-issue
user-invocable: false
version: 1.1.0
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal step of plan-feature: turn a feature-request issue into a scoped,
  sized, roadmap-mapped SPEC with Closes #N traceability.
---

# Plan Feature — From Issue (internal)

Convert a feature-request issue into the project's planning artifacts, keeping a
clean issue → SPEC → PR(Closes #n) trace.

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
4. **Close gaps proactively.** Compare the issue against what a complete SPEC
   needs (goals, scope in/out, architecture impact, data/schema,
   i18n/SEO/a11y/pricing per the docs map, a UI design reference when the feature
   has a UI surface, dev scenarios incl. failure modes, acceptance, dependencies,
   risks). For each genuine gap you can't safely default, ask the user (batch
   related questions; never ask what the issue or docs already answer).
5. **Size it.** Estimate `XS / S / M / L` (scale defined in the SPEC template)
   and record it in the SPEC. XS/S → the SPEC is the only planning artifact
   (single-pass execution); M/L → full artifact set. If L, propose splitting.
6. **Produce the SPEC.** Fill the SPEC; the `plan-feature` router then runs
   `plan-feature-scaffold` for the rest of the artifact set + roadmap registration.
7. **Wire traceability.** Record `#N` in the SPEC; the PR body must include
   `Closes #N` so the issue closes on merge.
8. **Hand off.** Next step is `execute-phase`.

## Guardrails

- Don't silently expand scope beyond the issue — surface additions as proposals.
- Don't open the feature branch or write code here.
- Keep the `Closes #N` link; an issue-born feature must close it.
- Otherwise honor the project's **Workflow conventions** (branch/PR, docs-language).

## Relationship to other skills

- `triage-issue` — decides bug vs feature vs defer; call it if unsure.
- `plan-fix` — the fix-side sibling for bug/debt issues.
- Sibling of `plan-feature-interview` (idea path); the `plan-feature` router picks
  between them by input.
- `plan-feature-scaffold` — scaffolds the artifacts once the SPEC is filled.
- `execute-phase` — executes the phases; its PR carries `Closes #N`.

## Done when

- A filled SPEC + planning artifacts exist, roadmap-registered.
- `#N` is recorded and the PR plan includes `Closes #N`.
- Scope gaps were resolved with the user, not assumed.
