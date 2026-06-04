---
name: design-feature
user-invocable: true
argument-hint: <feature idea>
description: >
  Interactively design a feature from a raw description, evaluating everything a
  complete SPEC needs and proactively asking about the gaps before any code is
  written. The "agentic interview" entry point: surfaces assumptions, proposes
  defaults, flags conflicts with the project's architecture/docs, optionally
  opens a tracking issue, then produces the SPEC via plan-feature. Triggers:
  "help me create a feature", "I have an idea, guide me", "design a feature with
  me", "I want to build X, ask me what you need".
---

# Design Feature

Turn a rough idea into a well-scoped, architecture-respecting feature through a
focused interview. Optimizes for catching unknowns *before* implementation.

## When to use

- The user has a description or idea but no issue and no SPEC, and wants help
  thinking it through.
- Triggered by requests to be proactive / "ask me what you need".

## Step 0 — Discover the project (always first)

Read the agent guide and its **documentation map**, the architecture doc, the
domain/style docs relevant to the idea's area, the SPEC template, and the
roadmap. Goal: ask only what the project does **not** already answer, and ground
every question in the project's real constraints (layering, domain/i18n/SEO/a11y
rules, runtime/platform limits, naming conventions).

## Process

1. **Restate understanding.** Summarize the idea in one short paragraph — the
   problem it solves and for whom. Get a yes/adjust before going deeper.
2. **Interview to fill the SPEC.** Work through the dimensions below in small
   batched rounds (use the question tool; group related questions; offer a
   recommended default each). Skip anything the docs already settle.
   - **Problem & goal** — what changes for the user; success signal.
   - **Scope** — explicitly what is OUT of scope.
   - **Architecture impact** — layers touched, new entities/ports, use-cases,
     adapters; honor the dependency rules.
   - **Data** — schema/migrations, source of truth, cache/consistency.
   - **Cross-cutting** — i18n, SEO, a11y, domain rules, security, per the docs
     map. Call out which apply.
   - **Dev scenarios** — happy path **and** failure modes (empty/degraded state,
     races, outages) and how to reproduce each locally.
   - **Acceptance criteria** — objective, verifiable conditions for done.
   - **Dependencies & risks** — other features, external services, unknowns.
   - **Non-goals / future work** — deferred to issues, not built early.
3. **Be proactive, not passive.** Volunteer assumptions and risks the user
   didn't mention; flag conflicts with existing architecture or docs; propose the
   smallest version that delivers the value.
4. **Traceability.** Offer to open a tracking issue (from the feature issue
   template); if created, the PR will `Closes #n`.
5. **Produce the SPEC.** Once dimensions are answered, write the filled SPEC and
   delegate the remaining artifacts + roadmap registration to `plan-feature`.
6. **Hand off.** Next step is `execute-phase`.

## Interview discipline

- One topic per round; don't interrogate. 3–6 batched questions max, then
  synthesize.
- Always offer a recommended default so the user can move fast.
- Don't ask what the SPEC template, architecture doc, or roadmap already answers.
- Stop once the SPEC can be filled without guesses; capture residual unknowns as
  open questions in `decisions.md` rather than blocking.

## Guardrails

- No code, no branch, no dependencies — design only.
- Smallest-shippable mindset; defer extras to issues.
- Respect and cite the project's architecture and style rules in your reasoning.
- Artifacts in the project's docs language (this repo: **English**).

## Relationship to other skills

- `feature-from-issue` — use instead when an issue already exists.
- `plan-feature` — scaffolds the artifacts once the interview yields a SPEC.
- `execute-phase` — executes the phases afterward.

## Done when

- The interview resolved every SPEC dimension (or logged it as an open
  question), a filled SPEC + artifacts exist, and the user knows the next step.
