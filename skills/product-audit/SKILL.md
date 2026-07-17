---
name: product-audit
user-invocable: true
version: 2.0.0
argument-hint: <path-or-area> (optional — defaults to the whole product)
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
  On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "audit the product", "full health check", "are we product-ready",
  "product-audit", "what's the state of the codebase", "CTO review", "tech-debt
  and roadmap sweep".
---

# Product Audit

The **CTO health check**: run every few features, before a release, or when the
product is "done", to answer *"where do we actually stand, and what should we do
next?"* across the entire product. **Read-only and recommend-only — it never
fixes, opens issues, or edits the roadmap. It proposes; the human decides.**

## Turn contract — verify before ending the turn

```
✓ The full PRODUCT AUDIT report was printed in the fixed output format (health by dimension, ranked findings, four proposal streams)
✓ Nothing was fixed, filed, or changed — report only
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

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
> `effort: ultracode`). On agents without it, run the audit as-is: sequential
> passes over each dimension — only wall-clock changes, never coverage.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the roadmap, the fix index, the feature folder layout, and
the verification gate. From the map decide the product's nature (web / mobile /
console / library / backend / infra) and which axes apply — the same applicability
logic `review-change` uses, applied product-wide. Note any optional platform
review skills the project installed (extras, never requirements — the internal
pack covers every axis).

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
| **Workflow discipline** | The workflow's own rules held: branch/PR discipline, `done · #<pr>` links, phase naming (`P1…`), per-phase docs, commit format, dependency closures, artifact language — **run `audit-docs` checks 1–13 mechanically** (compose it); never assume a rule held because it "should". **Scope-export recurrence:** across the most recent units (merged or in-flight), each with a non-empty `## Amendments` descope log or a descope-classified born issue (`audit-pr`'s scope-bleed gate) counts as one scope-exporting unit — **≥ 2 consecutive** such units is a planning-quality finding ("features cut too big for real capacity"), routed to the atomicity/split rules (**#64**), not re-litigated as a per-unit defect | all |
| **Roadmap coherence** | Stale/obsolete/superseded features, missing dependencies, gaps & opportunities | all |
| **Installed tooling** | Installed skills + connected MCP servers vs. the project's applicable axes and roadmap features — unregistered-but-useful items, and tooling that would change a feature's scope | all |

Skip inapplicable axes (no a11y/SEO/brand for a CLI/library/infra product) and
**say which you skipped and why**. Every axis is covered by the workflow's own
internal review pack (`review-code`, `review-security`, `review-verify`,
`review-debt`, `review-design`, `review-a11y`, `review-brand`, `review-perf`,
`review-seo`) — installed with the workflow, so an applicable axis can never be
"missing". Platform skills the project installed run as optional extras on top.

## Process

1. **Map & decide axes** — Step 0; mark each dimension applicable / n-a.
2. **Sweep code & axes** — run the applicable axes across the codebase: compose
   `review-implementation` plus the internal review pack's applicable passes
   (each returns its fixed-format table + PASS|FAIL), and any optional installed
   extras. Classify findings (severity + fix-now / postpone / tradeoff).
3. **Audit process & docs** — incomplete phases (`progress.md`/`TASKS.md`), aging
   open issues, **solvable known-issues** (trigger now met), doc-map completeness
   (compose `audit-docs`), and missing/optimizable workflow docs.
4. **Mine accumulated suggestions** — read every feature folder's `decisions.md`,
   `known-issues.md`, and `architecture-notes.md`; extract deferred items, open
   questions, and recorded debt. Cluster duplicates across features.
5. **Sweep installed tooling** — (a) inventory the installed skills and
   connected MCP servers available to the agent; (b) cross-reference each
   against the applicable review axes and the roadmap features; (c) classify
   each as **register** (useful, not yet named in the project's `CLAUDE.md`),
   **re-design** (would change a feature's definition/scope), or
   **not-relevant**; (d) dedupe against what `CLAUDE.md` already registers —
   only unregistered/relevant items survive into proposals. If the agent
   cannot enumerate its installed skills / connected MCPs, say so plainly
   (no silent caps) rather than inventing an inventory.
6. **Synthesize proposals** — turn findings + mined items into four concrete,
   deduped, severity-ranked streams:
   - **Issues to open** — bugs, debt, security/perf items worth tracking.
   - **Roadmap: add** — features/capabilities the evidence now justifies.
   - **Roadmap: remove or revise** — features that are obsolete, superseded, or no
     longer make sense.
   - **Tooling: register or re-design** — unregistered-but-useful tooling to add
     to `CLAUDE.md`, or a discovered skill/MCP that would rescope a feature.
7. **Report** — the format below. Recommend; do not act.

## Output format

```
PRODUCT AUDIT — <product> (scope: <whole product | area>)
Coverage: <dimensions run | sampled vs. exhaustive>

Health by dimension:
  <dimension> .......... ✓ healthy | ⚠ concerns | ✗ at risk | n-a (why)
  ...
  Installed tooling ....... ✓ | ⚠ | ✗ | n-a

Top findings (severity-ranked):
  [SEV] <dimension> — <finding> — evidence: <file:line | metric | doc> — class: <fix-now|postpone|tradeoff>
  ...
  [example — scope-export recurrence] Workflow discipline — <N> consecutive
    units exported scope via `## Amendments`/descope issues — features are
    being cut too big for real capacity — evidence: <unit list + amendments/
    issues> — class: postpone — route: #64 (atomicity/split rules)

Proposals — the user decides which to act on:

  Issues to open:
    - <title> [sev] — <why> — route: triage-issue / plan-fix — evidence: <…>
  Roadmap — add:
    - <feature> — <rationale & opportunity> — route: plan-feature
  Roadmap — remove / revise:
    - <feature> — <why it no longer fits> — route: triage-issue / roadmap edit
  Tooling — register / re-design:
    - <skill|MCP> — register in CLAUDE.md (Optional review extras): <why> — route: user edits CLAUDE.md
    - <skill|MCP> — would change <feature> scope: <why> — route: /design-feature <slug>

Manual-verification checklist (what automation can't confirm):
  - <item> …

→ Next: /triage-issue <the proposed issues> — classify them in one batch
  · accepted bug/debt → /plan-fix   · accepted capability → /plan-feature
  · nothing to act on → record the verdict and move on
```

Lead with the honest one-line health verdict (e.g. "shippable with 2 high-sev
security items to track first").

## Guardrails

- **Never auto-fixes, never opens issues, never edits the roadmap.** Output is a
  report + proposals; **every action is the user's decision.** When the user
  accepts, route: `triage-issue` files/classifies, `plan-feature` adds roadmap
  work, `plan-fix` scopes a concrete fix.
- **Never registers tooling or edits `CLAUDE.md`.** The tooling sweep proposes a
  skill/MCP to register, but the user (or a routed `design-feature` run)
  performs the edit; a scope-affecting discovery routes to
  `/design-feature <slug>`, which the user approves.
- Platform-adaptive: run only applicable axes; always list what you skipped and why.
- **No silent caps.** If you sampled, prioritized, or time-boxed a dimension, say
  so — never present partial coverage as exhaustive.
- Severity-ranked and deduped: cluster the same issue found via multiple axes or
  multiple feature docs into one proposal.
- Honor the project's **Workflow conventions** (docs-language, evidence): every
  finding/proposal cites a `file:line`/metric/doc/issue source; mark uncertainties *verify*.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — this is the widest, highest-stakes
  sweep in the workflow: run it on your **strongest** model at its deepest
  setting, as its own dedicated run — never squeezed into another task's
  context.
- **No `ultracode`/subagents** — sweep the dimensions sequentially (see the
  tip above); state coverage honestly either way.

## Relationship to other skills

```
product-audit (whole product, all axes, periodic)
   ├─ composes review-change axes (codebase-wide) + audit-docs (doc coherence)
   ├─ mines feature docs (decisions / known-issues / architecture-notes)
   ├─ sweeps installed skills / connected MCP servers (product-wide, periodic)
   └─ proposes ─┬─ Issues to open ........ ▶ triage-issue / plan-fix
                ├─ Roadmap: add .......... ▶ plan-feature
                ├─ Roadmap: remove/revise  ▶ triage-issue / roadmap edit   (user decides)
                └─ Tooling: register/re-design ▶ user edits CLAUDE.md / design-feature
```

- Broader than `review-change` (one change) and `audit-pr` (one PR); subsumes
  `audit-docs`'s coherence check as one of its dimensions.
- Hands nothing off automatically — it recommends, and the planning/fix/triage
  skills execute only when the user chooses to.

## Done when

- Every applicable dimension has a health verdict backed by cited evidence, and the
  skipped or sampled ones are stated.
- A severity-ranked findings list plus four proposal streams (issues to open,
  roadmap add, roadmap remove/revise, tooling register/re-design) exist, deduped
  and each routed.
- Nothing was fixed, filed, or changed — the report is the deliverable; the user
  decides what to act on.
- The **closing `→ Next:` block is printed** — typically a batch `/triage-issue` for
  the proposed issues, then `/plan-feature` / `/plan-fix` for the accepted work.
