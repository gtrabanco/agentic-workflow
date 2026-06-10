---
name: product-audit
user-invocable: true
version: 1.1.0
argument-hint: <path-or-area> (optional — defaults to the whole product)
model: fable
effort: max
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Periodic, product-wide health check — the CTO's "where do we actually stand?"
  Sweeps the WHOLE codebase (not a diff, not a PR) across every applicable axis —
  correctness, architecture, security/cybersecurity, performance, tests, UX/UI,
  accessibility, SEO, brand, tech debt — PLUS process & docs (incomplete phases,
  aging issues, solvable known-issues, doc/workflow completeness) and roadmap
  coherence. Mines accumulated suggestions from feature docs. Output: a
  severity-ranked report and concrete PROPOSALS — issues to open, roadmap features
  to add or remove. NEVER auto-fixes; the user decides what to act on.
  Triggers: "audit the product", "full health check", "are we product-ready",
  "product-audit", "what's the state of the codebase", "CTO review", "tech-debt
  and roadmap sweep".
---

# Product Audit

The **CTO health check**: run every few features, before a release, or when the
product is "done", to answer *"where do we actually stand, and what should we do
next?"* across the entire product. **Read-only and recommend-only — it never
fixes, opens issues, or edits the roadmap. It proposes; the human decides.**

## When to use

- Periodically (every few features) or at a product-ready milestone.
- When you want the broad, honest picture — quality, security, debt, docs, and
  roadmap — not the review of a single change (`review-change`) or PR (`audit-pr`).

This is the widest lens in the workflow. `review-change` audits a diff, `audit-pr`
a PR, `audit-docs` doc↔roadmap↔code coherence — `product-audit` audits the
**whole product across every dimension** and turns what it finds into proposals.

## Scope

The entire codebase and its process artifacts: source, tests, the docs tree, the
roadmap, the fix index, open issues, and every feature folder's planning docs.
Accept an optional path/area to focus a partial audit; state the scope and, if you
sample rather than exhaust a dimension, **say what you sampled** — never imply full
coverage you didn't do.

> **Tip (provisional).** For the broadest, deepest run, the *user* can turn on
> `ultracode` (`/effort ultracode` — a Claude Code session setting pairing xhigh
> effort with automatic multi-agent orchestration) so this sweep fans out across
> parallel subagents instead of one context window. It's a research-preview feature
> and a **session choice** — not something this skill declares (no skill can set
> `effort: ultracode`).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the roadmap, the fix index, the feature folder layout, and
the verification gate. From the map decide the product's nature (web / mobile /
console / library / backend / infra) and which axes apply — the same applicability
logic `review-change` uses, applied product-wide. Note which companion review
skills the project installed.

## Audit dimensions (platform-adaptive — run only what applies)

| Dimension | What it sweeps product-wide | Applies to |
|---|---|---|
| **Correctness & architecture** | Bugs, layer/boundary violations, dead code, overengineering, drift from the architecture doc | all |
| **Security & cybersecurity** | Secrets in repo, authz gaps, input validation, dependency / supply-chain risk | all |
| **Performance** | Hotspots, complexity, N+1s, bundle/asset weight (web), resource leaks | all |
| **Tests** | Coverage of critical paths, missing/!flaky tests, untested failure modes | all |
| **UX / UI** | Design-system adherence, broken states, inconsistency | web / mobile / TUI |
| **Accessibility** | a11y conformance for user-facing surfaces | web / mobile |
| **SEO** | Indexability, metadata, structured data | web |
| **Brand / voice** | User-facing copy vs. the brand guide | surfaces with copy |
| **Tech debt** | Accumulated shortcuts, TODO/FIXME, stale abstractions | all |
| **Process & docs** | Incomplete phases, aging open issues, **solvable known-issues**, doc completeness, missing/optimizable workflow docs | all |
| **Roadmap coherence** | Stale/obsolete/superseded features, missing dependencies, gaps & opportunities | all |

Skip inapplicable axes (no a11y/SEO/brand for a CLI/library/infra product) and
**say which you skipped and why**. Where an applicable companion skill isn't
installed, do a best-effort inline pass and note the gap.

## Process

1. **Map & decide axes** — Step 0; mark each dimension applicable / n-a.
2. **Sweep code & axes** — run the applicable `review-change` axes across the
   codebase (compose `review-implementation` + the installed externals), plus the
   security and performance sweeps. Classify findings (severity + fix-now /
   postpone / tradeoff).
3. **Audit process & docs** — incomplete phases (`progress.md`/`TASKS.md`), aging
   open issues, **solvable known-issues** (trigger now met), doc-map completeness
   (compose `audit-docs`), and missing/optimizable workflow docs.
4. **Mine accumulated suggestions** — read every feature folder's `decisions.md`,
   `known-issues.md`, and `architecture-notes.md`; extract deferred items, open
   questions, and recorded debt. Cluster duplicates across features.
5. **Synthesize proposals** — turn findings + mined items into three concrete,
   deduped, severity-ranked streams:
   - **Issues to open** — bugs, debt, security/perf items worth tracking.
   - **Roadmap: add** — features/capabilities the evidence now justifies.
   - **Roadmap: remove or revise** — features that are obsolete, superseded, or no
     longer make sense.
6. **Report** — the format below. Recommend; do not act.

## Output format

```
PRODUCT AUDIT — <product> (scope: <whole product | area>)
Coverage: <dimensions run | sampled vs. exhaustive>

Health by dimension:
  <dimension> .......... ✓ healthy | ⚠ concerns | ✗ at risk | n-a (why)
  ...

Top findings (severity-ranked):
  [SEV] <dimension> — <finding> — evidence: <file:line | metric | doc> — class: <fix-now|postpone|tradeoff>
  ...

Proposals — the user decides which to act on:

  Issues to open:
    - <title> [sev] — <why> — route: triage-issue / plan-fix — evidence: <…>
  Roadmap — add:
    - <feature> — <rationale & opportunity> — route: plan-feature
  Roadmap — remove / revise:
    - <feature> — <why it no longer fits> — route: triage-issue / roadmap edit

Manual-verification checklist (what automation can't confirm):
  - <item> …
```

Lead with the honest one-line health verdict (e.g. "shippable with 2 high-sev
security items to track first").

## Guardrails

- **Never auto-fixes, never opens issues, never edits the roadmap.** Output is a
  report + proposals; **every action is the user's decision.** When the user
  accepts, route: `triage-issue` files/classifies, `plan-feature` adds roadmap
  work, `plan-fix` scopes a concrete fix.
- Platform-adaptive: run only applicable axes; always list what you skipped and why.
- **No silent caps.** If you sampled, prioritized, or time-boxed a dimension, say
  so — never present partial coverage as exhaustive.
- Severity-ranked and deduped: cluster the same issue found via multiple axes or
  multiple feature docs into one proposal.
- Honor the project's **Workflow conventions** (docs-language, evidence): every
  finding/proposal cites a `file:line`/metric/doc/issue source; mark uncertainties *verify*.

## Relationship to other skills

```
product-audit (whole product, all axes, periodic)
   ├─ composes review-change axes (codebase-wide) + audit-docs (doc coherence)
   ├─ mines feature docs (decisions / known-issues / architecture-notes)
   └─ proposes ─┬─ Issues to open ........ ▶ triage-issue / plan-fix
                ├─ Roadmap: add .......... ▶ plan-feature
                └─ Roadmap: remove/revise  ▶ triage-issue / roadmap edit   (user decides)
```

- Broader than `review-change` (one change) and `audit-pr` (one PR); subsumes
  `audit-docs`'s coherence check as one of its dimensions.
- Hands nothing off automatically — it recommends, and the planning/fix/triage
  skills execute only when the user chooses to.

## Done when

- Every applicable dimension has a health verdict backed by cited evidence, and the
  skipped or sampled ones are stated.
- A severity-ranked findings list plus three proposal streams (issues to open,
  roadmap add, roadmap remove/revise) exist, deduped and each routed.
- Nothing was fixed, filed, or changed — the report is the deliverable; the user
  decides what to act on.
