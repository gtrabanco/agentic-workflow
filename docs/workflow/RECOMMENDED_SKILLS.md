# Recommended skills — agnostic software quality & architecture

This shortlist is deliberately **stack-agnostic**: skills that help you *program
well with agents* and raise **software quality and architecture** on **any**
project — regardless of language, framework, or infrastructure. They support and
sharpen our workflow skills.

> **Out of scope on purpose:** stack/infra/service skills (your platform,
> framework, ORM, runtime, and service/tool packs…). Install those simply
> because they match your stack — they make you faster on *that* stack, but they
> are **not** cross-cutting quality recommendations. See the bottom section.

## Two axes of applicability

- **Universal** — apply to *every* project: CLI, library, daemon, service, web,
  mobile.
- **Conditional by the project's *nature*** (not its stack) — apply based on what
  the project **is**. The litmus, generalized from the design example: *"a design
  skill is great when there's something to design — useless for a terminal
  program (unless it's a TUI/`ink` app, and even then usually overkill)."* Ask
  **"is there actually an artifact of this kind to produce?"** before installing.

---

## Universal — install on every serious project

### A. Agentic discipline (program *well* with agents)

| Skill | Why | Pairs with (ours) |
|---|---|---|
| `karpathy-guidelines` | Reduces the classic agent failure modes: overcomplication, non-surgical edits, unstated assumptions, vague success criteria. Highest-leverage "code well with an agent" skill. | everything |
| `skill-creator` (anthropic) | Author/maintain skills so your agentic toolkit stays healthy and consistent. | all of ours |
| `consolidate-memory` (anthropic) | Periodic memory hygiene so the agent's long-term notes stay true. | long-running projects |

### B. Code quality & correctness

| Skill | Why | Pairs with (ours) |
|---|---|---|
| `code-review` | Correctness bugs + simplification over the diff. | `review-implementation` (adds the classification it lacks) |
| `simplify` | Reuse / simplification / efficiency / altitude cleanups — quality only, no bug hunt. | `review-implementation` |
| `security-review` | Security pass on the changes. | `review-implementation` security axis |
| `verify` | Run the thing and confirm real behavior — not just that tests pass. | `execute-phase` Stage 4 |
| `ghost-scan-secrets` | Scan for leaked secrets/credentials in any codebase. | pre-commit "no secrets" |

### C. Architecture & engineering practice

| Skill | Why | Pairs with (ours) |
|---|---|---|
| `engineering:architecture` | Architecture guidance & decisions. | `plan-feature`, `review-implementation` (arch axis) |
| `engineering:system-design` | System design for non-trivial features. | `plan-feature`, `plan-feature-interview` |
| `engineering:testing-strategy` | What to test, at which layer, how much. | `review-implementation` test axes, `execute-phase` testing |
| `engineering:tech-debt` | Identify & manage debt deliberately. | `triage-issue`, `audit-docs` |
| `engineering:debug` | Systematic debugging methodology. | any bug work |
| `engineering:documentation` | Documentation practice. | `plan-feature`, `audit-docs` |
| `doc-coauthoring` (anthropic) | Structured long-form docs: specs, proposals, decision docs. | `plan-feature`, `plan-feature-interview` |

> **Architecture-pattern skill:** keep one that encodes *your* chosen pattern
> (ports-and-adapters, clean architecture, layered, MVC…). The pattern is
> agnostic; the skill records the decision. Keep one architecture-pattern skill
> per project — replace its content per project, keep the idea.

---

## Conditional — by what the project *is* (not its stack)

| Skill(s) | Install when the project… | Skip when… |
|---|---|---|
| `design-review`, `ux-audit`, `ux-extract`, `ux-compare`, `design-system`, `frontend-design` | …has a **user-facing UI** to design (web app, marketing site, desktop GUI) | …is a CLI, library, daemon, or pure backend/service — *unless* it's a TUI/`ink` app with real layout, and even then usually overkill |
| `web-perf` | …ships a **web** frontend with Core Web Vitals to defend | …is non-web |
| `claude-api` | …**calls the Claude API / builds on the Anthropic SDK** | …has no LLM features |
| `docx`, `pptx`, `xlsx`, `pdf`, `brand-guidelines`, `canvas-design` (anthropic) | …**produces those artifacts as deliverables** (reports, decks, brand) | …your output is source code |

**Decision rule:** the skill's capability is irrelevant if the artifact isn't
there. No UI → no design skills. No web → no web-perf. No LLM calls → no
claude-api. No documents to ship → no office skills.

---

## How these reinforce our workflow skills

- **Plan** — `engineering:system-design` + `doc-coauthoring` sharpen
  `plan-feature` (the router covering the idea, issue, and scoped-slug entry paths).
- **Review** — `code-review` + `simplify` + `security-review` feed
  `review-implementation`'s findings; ours adds the **classification** they lack.
- **Decide / debt** — `engineering:tech-debt` ↔ `triage-issue`;
  `audit-docs` keeps the doc set honest.
- **Agentic hygiene** — `karpathy-guidelines` (every task) + `skill-creator`
  (maintain the toolkit) + `consolidate-memory` (keep memory true).

---

## Out of scope here — stack / infrastructure / service skills

Your platform/runtime skills, framework skills, ORM/database skills,
language-specific skills, and the `*:*` service/tool packs (payments, chat,
docs, source control…).

Install these **iff** they match your stack and services. They raise your speed
*on that stack* — for this repo they're the right call; for a Go CLI or a Rust
library they're noise. They are not part of the agnostic quality recommendation.

---

## TL;DR

On **any** project, install the **Universal** set (agentic discipline + code
quality + architecture). Add a **Conditional** skill only when the project has
that kind of artifact (UI, web perf, LLM, documents). Treat **stack/infra** skills
as a separate, obvious axis — match them to your stack, not to "quality." Few
high-signal skills beat many.
