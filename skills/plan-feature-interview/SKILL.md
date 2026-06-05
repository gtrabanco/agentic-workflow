---
name: plan-feature-interview
user-invocable: false
model: opus
effort: high
description: >
  Internal step of plan-feature. Interactively design a feature from a raw idea —
  evaluate everything a complete SPEC needs and proactively ask about the gaps,
  surfacing assumptions, proposing defaults, and flagging conflicts with the
  project's architecture/docs — then produce a filled SPEC. Invoked by the
  plan-feature router when the input is a vague idea (or `--interview`).
---

# Plan Feature — Interview (internal)

Turn a rough idea into a well-scoped, architecture-respecting feature through a
focused interview. Optimizes for catching unknowns *before* implementation.

## When to use

- The `plan-feature` router calls this when the input is a vague idea (or the user
  forces it with `--interview`) and wants help thinking it through before any code.

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
5. **Produce the SPEC.** Once dimensions are answered, write the filled SPEC. The
   `plan-feature` router then runs `plan-feature-scaffold` for the remaining
   artifacts + roadmap registration.
6. **Hand off.** Return to the router; the next step after scaffolding is
   `execute-phase`.

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

- Sibling of `plan-feature-from-issue` (issue path); the `plan-feature` router
  picks between them by input.
- `plan-feature-scaffold` — scaffolds the artifacts once the interview yields a SPEC.
- `execute-phase` — executes the phases afterward.

## Done when

- The interview resolved every SPEC dimension (or logged it as an open
  question), a filled SPEC + artifacts exist, and the user knows the next step.
