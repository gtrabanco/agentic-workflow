---
name: plan-feature
user-invocable: true
version: 1.2.2
argument-hint: <idea | #N | NN-slug> | --interview | --from-issue N | --scaffold <slug> | --next
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  One entry point to plan a feature. Detects the input — a raw idea (interview), a
  GitHub issue #N (issue → scoped SPEC), or an already-scoped slug/SPEC (straight
  to scaffolding) — routes to the right internal step, then ensures the roadmap
  entry and prints the next step. Force a path with flags to skip detection;
  `--next` plans the next planned feature from the roadmap. Using a non-Claude / free-inference model? Edit model:/effort: in this frontmatter to your closest equivalent tier (see the README model-equivalence table).
  Triggers: "plan a
  feature", "plan the feature from issue N", "plan the next roadmap feature",
  "scaffold feature NN", "I have an idea, plan it", "create SPEC and TASKS for NN".
---

# Plan Feature (router)

One door to turn anything — an idea, an issue, or a scoped slug — into a planned,
roadmap-registered feature. Routes to a focused internal step so only the work you
need runs (no fat single skill). **Docs only — no code, no branch.**

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the **roadmap** (`docs/features/ROADMAP.md`), so routing
and roadmap registration match the project's real layout.

## Routing

Pick the mode — first match wins:

1. **Flag forces it** (skip detection): `--interview`, `--from-issue <N>`,
   `--scaffold <slug>`, `--next`.
2. **Issue** — an issue number or issue URL → `plan-feature-from-issue`.
3. **Scoped** — an existing roadmap slug or a filled `SPEC.md` → `plan-feature-scaffold`.
4. **Raw idea** — a vague description → `plan-feature-interview`.
5. **`--next` / no input** — read the roadmap, take the next `planned` entry; if
   it's a thin line → `plan-feature-interview`, if scoped → `plan-feature-scaffold`.
6. **Ambiguous** — ask one question, then route.

### Example (routing)

| You run | Detected | Routes to | Then |
|---|---|---|---|
| `plan-feature "add CSV export"` | raw idea | `plan-feature-interview` → `plan-feature-scaffold` | `execute-phase NN P1` |
| `plan-feature 131` | issue #131 | `plan-feature-from-issue` → `plan-feature-scaffold` | PR carries `Closes #131` |
| `plan-feature 14-csv-export` | scoped slug | `plan-feature-scaffold` | `execute-phase 14 P1` |
| `plan-feature --next` | next `planned` roadmap entry | scaffold (interview if thin) | `execute-phase NN P1` |

## Process

1. **Route** per above. The interview / from-issue internals produce a **filled,
   sized SPEC**; then invoke `plan-feature-scaffold`, which scales the artifacts
   to the SPEC's size (XS/S → SPEC-only; M/L → full set) and registers the
   roadmap. The scoped path runs `plan-feature-scaffold` directly.
2. **Confirm roadmap.** Verify the feature is registered in
   `docs/features/ROADMAP.md` with the right number, ordering, and dependencies;
   if any of the three is missing or wrong, fix the entry now — never leave
   registration for later.
3. **Print the next step:** `execute-phase <NN> P1` (M/L, phased) or
   `execute-phase <NN>` (XS/S, single-pass).

## Guardrails

- Docs only — no code, no branch (that is `execute-phase`).
- Don't re-ask what a flag, the issue, or the docs already settle.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise per the project's **Workflow conventions** (docs-language).

## Internal steps (not user-invocable)

- `plan-feature-interview` — interview a raw idea into a SPEC.
- `plan-feature-from-issue` — issue → scoped SPEC, `Closes #N`.
- `plan-feature-scaffold` — SPEC → full artifact set + roadmap entry.

These run **within this same conversation** (that's what "composing" means) —
on any agent, just follow their `SKILL.md` inline as the routed step.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context. The
  internal steps above are the exception — they run inline, in this one.
- **No per-skill `model:`/`effort:`** — the frontmatter tiers state intent:
  planning is judgment work — run it on your **strongest** model. The
  execution it hands off to may run cheaper.

## Relationship to other skills

- `triage-issue` routes here to promote an issue to a feature.
- `execute-phase` executes the phases afterward (`audit-docs` audits anytime).

## Done when

- A planned feature with its full artifact set exists and is roadmap-registered.
- **The closing `→ Next:` block is printed:**

  ```
  → Next: /execute-phase <NN> P1 — start phase 1 (M/L, phased)
    · XS/S feature → /execute-phase <NN> (single-pass)
    · adjust scope first → re-run /plan-feature   · audit the planning docs → /audit-docs
  ```
