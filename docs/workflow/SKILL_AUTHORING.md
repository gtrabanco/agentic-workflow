# Authoring a skill

> Deep reference for the guide's `## Deep references` index. These are the
> repository's authoring rules; `AGENTS.md` keeps only the pointer, so this file
> is read when a skill is authored or edited, never on every session.

## Authoring a skill

A skill is a folder `skills/<name>/SKILL.md` with YAML frontmatter + a body.

```yaml
---
name: <kebab-case-name>          # must match the directory name
user-invocable: true             # REQUIRED for it to appear in the agent's /command menu
version: <train>                 # the unified train version — stamped by `scripts/release.mjs apply` at cut time, never bumped by hand
description: >
  One paragraph with concrete trigger phrases so the agent knows when to load it.
---
```

Body sections every skill follows: `When to use`, `Step 0 — Discover the project
(always first)`, `Process`, `Guardrails`, `Relationship to other skills`,
`Done when`.

> **`user-invocable: true` is mandatory.** Without it, the skill is not offered
> in the slash-command menu in this environment. Always set it explicitly.

> **Always close with a `→ Next:` block.** Every skill ends its turn with a
> **visible recommendation block** — not a buried "Done when" bullet. The shape is
> the "review checkpoint" style: one **recommended** command on the `→ Next:` line,
> then the open alternatives as `·` sub-bullets, leaving the choice to the user
> (recommend, never dictate). Use this exact shape:
>
> ```
> → Next: /<recommended-command> — <one-line why>
>   · <alternative> → <when to pick it>
>   · <alternative> → <when to pick it>
> ```
>
> Two cases the block must cover when they apply: (a) **finishing a unit/feature** →
> point to the next concrete unit (`/plan-feature --next`, or a named issue/roadmap
> entry); (b) **recurring inconsistency** — when `review-change`/`triage-issue` see
> the *same* problem twice (e.g. SPEC drift on consecutive units) → recommend
> `/product-audit`. A terminal verdict still names what to do with it (merge,
> re-audit, triage). This is part of "Done when" for every skill.

> **Phases are `P1, P2, …` ("phases"); `S#` are requirement ids.** Two
> vocabularies, kept apart: a unit doc's `## Specs` numbers its requirements `S#`
> (issue #308), and `## Tasks` labels its implementation steps `P1, P2, …` — so a
> skill that produces or references a plan labels steps `P1, P2, …` and calls them
> *phases* (a Spanish or other-language UI may say "fases"/"pasos", but the
> committed artifacts and the labels stay `P1, P2, …`), never `S1`/`Step 1`. A
> requirement is never a phase and a phase is never a requirement: the `S#` is what
> a task links and a finding cites, the `P#` is the executor's argument. The label
> must be stable and uniform: a **phase label** is never written as `S1`/`S2`/"Step N"
> into a `PLAN.md`, `TASKS.md`, `progress.md`, SPEC, or roadmap — the `S#` that belongs
> in a SPEC is a `## Specs` requirement id, never a step in `## Tasks` (which is also
> where a task links the `S#` it delivers).

> **Checklists over heuristics; fixed output formats.** Skills are executed by
> models of any strength, not only frontier ones — write instructions a weaker
> model cannot misread: (a) heuristics become **checklists** ("pass only if: ✓ …"),
> every item independently checkable, n/a stated explicitly; (b) reports and
> verdicts carry a **fixed output contract** ("Return exactly: …" with the block
> quoted) ending in an unambiguous decision (`PASS | FAIL`,
> `MERGE-READY | BLOCKED`, a named verdict); (c) bound freedom with
> **Allowed / Forbidden lists** wherever a skill could "improve" beyond scope;
> (d) "if needed" is banned — name the minimum set to verify (docs, files,
> checks). Claude tiers stay the declared defaults (they set the reference bar),
> but every skill must run correctly on any agent and any model — see the README
> model-equivalence table.

> **Complete dynamic hand-offs.** When the invocation or artifact contains more
> than one issue, dependency, finding, or other target, the closing recommendation
> must name every actual ID once, in order, joined with ` + ` (for example,
> `#71 + #72 + #73`). A command may use the designated primary when its syntax
> requires one, but the full set must remain visible beside it. Never emit only
> the primary, a generic "act on the verdicts", or literal placeholders/ellipsis
> in a live hand-off.

> **Turn contract at the top.** Every user-facing skill opens with a
> `## Turn contract` section: the 2–6 boxes every invocation must tick before
> the turn may end (the deliverable in its fixed format; the closing `→ Next:`
> block printed **last**; for executors: git/forge commands actually **RUN**
> with sha/PR-URL pasted — describing an action is not performing it). Weaker
> models drop end-of-document duties, so the contract goes first, and every
> skill states that an about-to-end turn with an unchecked box is not done.

> **Self-contained reviews — never depend on external skills.** The review axes
> are covered by the repo's **own internal review pack**
> (`skills/review-*`: code, security, verify, debt, design, a11y, brand, perf,
> seo — each a fixed checklist returning a findings table + `PASS | FAIL`).
> `review-change` / `product-audit` compose the pack; platform skills a project
> installs are **optional extras run in addition, never dependencies** — a skill
> body must never require a Claude Code-bundled or third-party skill to function.

> **Every user-facing skill carries a `## Portability` section.** The skills
> install into 70+ agents via the `skills` CLI; Claude Code features (slash-command
> menu, per-skill `model:`/`effort:`, `/loop`, subagents, hooks, `ultracode`) are
> conveniences, **not the contract**. Every `user-invocable: true` skill includes a
> short `## Portability (agents other than Claude Code)` section stating the
> fallbacks that apply to it, drawn from these standards:
> *no slash menu* → open the target skill's `SKILL.md` and follow it literally in a
> fresh conversation; *no model tiers* → strongest model for planning/review/audit,
> cheaper for mechanical execution, and never review a change with a model weaker
> than the one that wrote it; *no `/loop`/subagents* → re-invoke manually and follow
> the closing `→ Next:` block. Tailor per skill (e.g. hooks for `log-session`,
> subagents for autopilot-level orchestration (deferred to roadmap row 62)). Additionally, whenever a skill body references a
> Claude Code-specific feature, pair it **inline** with the generic fallback — the
> instruction must be executable by an agent that has never heard of Claude Code.

> **One version: the unified train (D-40-14).** Skills carry the ecosystem
> version — the same number as the npm packages and the `vX.Y.Z` tag. It is
> stamped by code: `scripts/release.mjs apply` writes every `version:` line at
> cut time from the accumulated changesets, and the per-skill bump ledger
> (per-skill semver, per-skill CHANGELOG rows) is retired — the per-skill
> tables in [`CHANGELOG.md`](../../CHANGELOG.md) are a frozen archive. A change to a
> skill ships with a `.changeset/*.md` intent file (or the parity gate fails
> the PR); renames and other breaking surfaces still need a note in
> `docs/workflow/MIGRATION.md`.
>
> **Create the intent file by running code, not by hand:**
> `bun scripts/changeset-create.mjs` derives the affected packages and skills
> from the modified files, the semver from the conventional commit title
> (`feat` → minor, `fix` → patch, `!`/`BREAKING CHANGE` → major; `--level`
> overrides), and the file name PR-first (`<pr|branch>-<title>.md`) so names
> stay unique. One file per PR, as many entries as the change needs; it never
> overwrites. At cut time each change lands in the changelog's right section:
> the scoped key routes the row to that package's own table, skill entries
> ride the skills-content package's row named as `(skills: …)`, and a package
> bumped by the train with nothing declared says so explicitly.

> **Smoke-test wording changes to executor-path skills.** After editing
> `unit-lane`, `execute-phase`, or a `review-*` skill, run the
> manual procedure in
> [`docs/workflow/GOLDEN_FIXTURE.md`](GOLDEN_FIXTURE.md) — it
> drives a fixed toy fixture through the changed skill with the weakest model
> in your fleet to catch wording a frontier model absorbs silently but a weak
> model misreads.

### Hand off, don't compose across a model/effort boundary

No skill pins a tier: `model` and `effort` come from the invocation (the routed
command profile or the session), and a tier **cannot change mid-turn** — loading
another skill runs it at the caller's tier, never at its own. So a composer that
runs B in-turn silently under-powers B (or needlessly over-powers it).

**Rule (the test is ≥, not "same"):** before composing skill B in-turn, compare
tiers. Compose **only when the caller's tier is ≥ B's expected tier**. If B needs
a **higher** model or effort, **hand off** instead — print `run /<skill>` / the
next command and let it be invoked in a fresh turn at its own tier. Most of the
flow already hands off (`unit-lane` triages and hands its steps to
`execute-phase`; `triage-issue`/`review-change`/`audit-pr` route with suggestions;
`execute-phase` hands off to `/review-change` at its review checkpoint).

**Why ≥ and not "same":** composing at a *higher* tier over-powers B — harmless,
just costlier. Composing at a *lower* tier **under-powers** B — a real regression
(the bug we hit: a cheap-tier executor composing the review at its own tier). So a
skill may compose only what it synthesizes at or below its own tier:
`review-change` → `review-implementation` + companions; `product-audit` → its
sub-checks; the `unit-lane` conductor → its catalog steps. Everything else hands
off.
