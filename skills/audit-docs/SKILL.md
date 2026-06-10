---
name: audit-docs
user-invocable: true
version: 1.0.3
model: sonnet
effort: medium
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Audit cross-document coherence: docs ↔ roadmap ↔ code ↔ fix index ↔ issues.
  Finds drift — features in docs/ not in the roadmap (or vice versa), fix-index
  entries already merged/closed, broken documentation-map links, dependency
  cycles, artifacts in the wrong language, naming-convention violations — and
  reports them ranked by severity, fixing only low-risk items on request.
  Triggers: "check doc consistency", "are the docs in sync", "audit the docs",
  "doc coherence review", "did the docs drift", "validate the roadmap".
---

# Audit Docs

A read-first audit answering "do the docs still match reality?" Produces a
findings report; it does not silently rewrite docs.

## When to use

- Before a release or milestone, after merging several features/fixes, or
  whenever the doc set might have drifted from the code and issues.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the roadmap, the fix index + template, and the feature
folder layout — the map tells you which links and invariants to check.

## Checks

Run these and collect findings (cite paths/lines/issue numbers each):

1. **Roadmap ↔ feature folders.** Every `docs/features/<NN>-<slug>/` is in the
   roadmap, and every roadmap entry has a folder (or is explicitly "scheduled").
2. **Feature dependencies.** SPEC `Depends on` / `Branch` fields are valid; no
   dependency cycles; ordering is consistent with the roadmap.
3. **Fix index hygiene.** Every entry maps to an **open** issue and an unmerged
   branch; flag entries whose issue is closed or whose PR merged (should have
   been removed). Flag open fix branches missing from the index.
4. **Documentation-map links resolve.** Every file the map references exists;
   flag "scheduled, not yet authored" items so they aren't mistaken for drift.
5. **Broken intra-doc links.** Relative links/anchors point at real
   files/sections.
6. **Issue references.** Acceptance/known-issues lines referencing `#N` aren't
   pointing at long-closed issues without note.
7. **Language & naming conventions.** Artifacts in the project's docs language
   (this repo: **English**); file/dir naming matches conventions (e.g.
   kebab-case TS files, PascalCase components).
8. **Invariant tags.** If the project uses invariant/decision IDs (e.g.
   INV-/D-/KI-), spot-check that referenced IDs exist where claimed.

Adapt the list to what the project has; skip checks for absent structures and
say so.

## Process

1. Discover, then run the checks with `grep`, file reads, and the forge CLI
   (per Workflow conventions; examples use `gh`).
2. Produce a **findings report**: each item with severity (high = misleading or
   broken, low = cosmetic), evidence, and a proposed fix.
3. **Fix only on request.** With explicit `--fix` (or user go-ahead), apply the
   low-risk corrections (remove a merged fix-index row, fix a dead link, register
   a missing roadmap entry). Leave judgment calls to the user.

## Guardrails

- Read-first; never bulk-rewrite docs unprompted.
- Distinguish genuine drift from intentionally "scheduled/deferred" items —
  don't report deliberate tradeoffs as errors.
- Keep changes surgical and within docs; no code or behavior changes.

## Relationship to other skills

- Complements `plan-feature` (which *creates* the docs this audits) and
  `triage-issue` (which keeps the fix index honest).
- Run standalone anytime; no required predecessor.

## Done when

- A severity-ranked findings report exists, and any approved low-risk fixes are
  applied — with genuine deferrals left untouched and labeled as such.
