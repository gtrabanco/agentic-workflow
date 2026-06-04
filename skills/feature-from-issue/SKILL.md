---
name: feature-from-issue
user-invocable: true
argument-hint: <issue-number>
description: >
  Turn a GitHub issue that requests a FEATURE into a planned, roadmap-registered
  feature. The feature-side analogue of draft-fix-spec (which handles fixes).
  Reads the issue, confirms it is a feature (not a bug/tech-debt), translates and
  scopes it, maps it to the roadmap, proactively resolves gaps, then drives
  plan-feature to produce the artifacts — with Closes #n traceability. Triggers:
  "build a feature from issue N", "turn issue N into a feature", "plan the
  feature requested in #N", "execute-phase --issue N" when N is a feature.
---

# Feature From Issue

Convert a feature-request issue into the project's planning artifacts, keeping a
clean issue → SPEC → PR(Closes #n) trace.

## When to use

- A tracker issue describes new product capability and you want it planned
  properly rather than hacked in.

If the issue is a **bug or tech-debt**, stop and route it: `triage-issue` to
classify, then `draft-fix-spec` + `execute-phase --fix`. This skill is for
genuine features only.

## Step 0 — Discover the project (always first)

Read the agent guide (`CLAUDE.md`/`AGENTS.md`) and its documentation map, the
feature SPEC template, the roadmap, and the issue/PR templates
(`.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`) so the SPEC
mirrors the fields reviewers expect. Then read the issue:

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
   i18n/SEO/a11y/pricing per the docs map, dev scenarios incl. failure modes,
   acceptance, dependencies, risks). For each genuine gap you can't safely
   default, ask the user (batch related questions; never ask what the issue or
   docs already answer).
5. **Produce the SPEC and artifacts.** Fill the SPEC, then delegate the rest of
   the artifact set and roadmap registration to `plan-feature`.
6. **Wire traceability.** Record `#N` in the SPEC; the PR body must include
   `Closes #N` so the issue closes on merge.
7. **Hand off.** Next step is `execute-phase`.

## Guardrails

- Don't silently expand scope beyond the issue — surface additions as proposals.
- Don't open the feature branch or write code here.
- Keep the `Closes #N` link; an issue-born feature must close it.
- All artifacts in the project's docs language, regardless of the issue's.
- One independently-mergeable PR per feature against the default branch.

## Relationship to other skills

- `triage-issue` — decides bug vs feature vs defer; call it if unsure.
- `draft-fix-spec` — the fix-side sibling for bug/debt issues.
- `plan-feature` — scaffolds the artifacts once the SPEC is filled (delegated to).
- `execute-phase` — executes the phases; its PR carries `Closes #N`.

## Done when

- A filled SPEC + planning artifacts exist, roadmap-registered.
- `#N` is recorded and the PR plan includes `Closes #N`.
- Scope gaps were resolved with the user, not assumed.
