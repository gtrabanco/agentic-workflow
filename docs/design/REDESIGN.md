# Skills v2 — redesign design doc

> Status: **draft for review**. Pin this down before touching any skill. Captures
> the target architecture for consolidating entry points, automating the middle of
> the workflow, and adding manager-grade, platform-adaptive quality gates.

## 1. Goals

Produce a workflow that yields **highly maintainable, performant, understandable**
software while respecting the project's architecture and dev principles — and that
**adapts to any software** (web, mobile, console/CLI, library/SDK, backend/infra).
Concretely:

- **Consolidate entry points** — one door to plan a feature (idea / issue / slug).
- **Automate the middle** — review runs itself every couple of phases; each skill
  offers the next step; gates still pause for human review (not fire-and-forget).
- **Manager-grade quality gates** — context-aware review, a PR merge gate, and a
  periodic full-product audit.
- **Platform-adaptive** — every review/audit decides which axes apply by reading
  the project (no accessibility/SEO/brand for a CLI or infra code).

This is **not** strictly "fewer skills": it consolidates the *planning entry* (3
menu items → 1) but adds two audit skills. The win is fewer **decisions** for the
user, more **automation**, and higher **quality coverage**.

## 2. Composition pattern: router + internal skills (decided)

The planning family uses a **router + internal** pattern instead of one fat skill
or three cross-referencing skills. Rationale (cost analysis):

- A skill's `description` is always in context (cheap, fixed). Its **body loads
  only on invocation** (the real token cost).
- **One fat merged skill** loads *all* branches every time (worst tokens; model
  wades through irrelevant content).
- **Separate user skills** load one focused body, but show 3 menu items and risk a
  wrong-pick double-load (invoke A → it redirects to B → two bodies loaded).
- **Router + internal** (chosen): one menu item; the router (small body) detects
  input and invokes exactly the right **internal** skill (focused body) — so e.g.
  the long *interview* body is never loaded when scaffolding from a slug. Forceable
  flags skip the router's reasoning entirely.

Internal skills set `user-invocable: false` (installed and model-invocable, hidden
from the `/` menu). They are NOT marked `metadata.internal` (that would hide them
from install; the router needs them installed).

## 3. Target skill set

| Skill | Status | User-invocable | Role |
|---|---|---|---|
| `init-workspace` | **modified** | yes | Scaffold + detect platform + **suggest the companion review skills** the project needs |
| `plan-feature` | **router** | yes | Detect input (idea / `#N` / slug‑or‑SPEC) → route to the right internal skill; forceable flags; owns roadmap registration |
| `plan-feature-interview` | **new (was design-feature)** | no | Proactive interview to fill a SPEC from a raw idea |
| `plan-feature-from-issue` | **new (was feature-from-issue)** | no | Issue → scoped SPEC, confirm it's a feature, translate, wire `Closes #N` |
| `plan-feature-scaffold` | **new** | no | Fill the SPEC + generate the planning artifacts + register in roadmap |
| `triage-issue` | unchanged | yes | Classify issue → route to plan-feature / plan-fix / defer / wontfix |
| `plan-fix` | **renamed (was draft-fix-spec)** | yes | Draft the fix SPEC, stop for review (symmetric with plan-feature) |
| `execute-phase` | **modified** | yes | Implement phase / single-pass / fix; **auto-review every 2 phases** |
| `review-implementation` | unchanged | yes | Find → classify decision table (the findings engine) |
| `review-change` | **new** | yes | **Platform-adaptive review orchestrator**: composes `review-implementation` + the applicable external skills |
| `audit-pr` | **new** | yes | PR-level merge gate |
| `audit-docs` | unchanged | yes | Doc ↔ roadmap ↔ code ↔ fix-index coherence |
| `product-audit` | **new** | yes | Periodic / product-ready full-spectrum audit + roadmap/issue proposals |

Counts: **10 user-facing** entries (planning collapses 3 → 1) + **3 internal** = 13
files. The menu is *simpler* even though the file count grows.

> Open question: `review-implementation` and `review-change` overlap. We keep both
> (don't break current skills): `review-implementation` is the findings engine;
> `review-change` orchestrates it + externals. We could later make
> `review-implementation` internal-only. **Decision needed** (see §11).

## 4. `plan-feature` (router)

**Input detection** (in priority order):

1. A flag forces the mode (skips reasoning): `--interview`, `--from-issue <N>`,
   `--scaffold <slug>`.
2. An issue number / issue URL → `plan-feature-from-issue`.
3. A filled SPEC or an existing roadmap slug → `plan-feature-scaffold`.
4. A raw idea / vague description → `plan-feature-interview`.
5. Ambiguous → ask one question, then route.

The router's body stays tiny: detect → invoke the internal skill → on return,
ensure roadmap registration and print the next step (`execute-phase NN P1`). The
internal skills do the heavy lifting and never appear in the `/` menu.

**"Take the next feature from the roadmap"** (the gap you spotted): `plan-feature`
with no args, or `plan-feature --next`, reads `ROADMAP.md`, picks the next
`planned` entry, and routes to scaffold (or interview if it's a thin line).

## 5. Fix flow (clarified)

Today's `draft-fix-spec` + `execute-phase --fix` confused you. New shape mirrors
the feature flow exactly:

```
feature:   plan-feature  → execute-phase
fix:       plan-fix      → execute-phase --fix
```

- `plan-fix <issue>` — architect-drafts the fix SPEC, registers it in the fix
  index, commits on the fix branch, **stops for review**.
- `execute-phase --fix` — implements from the existing SPEC (already deduped: it
  reuses a SPEC if present).

Same two-step rhythm as features; one obvious name pair (`plan-*` → `execute-*`).

## 6. `review-change` + the platform applicability matrix (adaptive core)

`review-change` reviews the current change by (a) running `review-implementation`
(bugs / architecture / security / dead code / perf / tests / project-rules →
classified table) and (b) invoking **only the applicable** external skills, then
synthesizing one report.

It decides applicability by **reading the project** (the CLAUDE.md doc map: does
`docs/frontend/` exist? is it web? a CLI? a library? infra?) and the change's
footprint (which files/areas it touches):

| Axis / external skill | Web | Mobile | Console/CLI | Lib/SDK | Backend/Infra |
|---|---|---|---|---|---|
| `code-review`, `security-review`, `verify`, `tech-debt`, architecture, perf | ✓ | ✓ | ✓ | ✓ | ✓ |
| `design-review` (UI) | ✓ | ✓ | TUI only | ✗ | ✗ |
| `accessibility-review` | ✓ | ✓ | rare | ✗ | ✗ |
| `brand-review` | ✓ | ✓ | output text | ✗ | ✗ |
| SEO | ✓ | ✗ | ✗ | ✗ | ✗ |
| API-ergonomics / usage docs | if API | if API | flags/help | ✓✓ | ✓ |

The external skills are **not bundled** — `init-workspace` suggests installing the
ones the project needs (§9). If a needed skill isn't installed, `review-change`
notes the gap and does its best inline, rather than failing.

Output: one synthesized, classified report (fix-now / postpone / ignore /
intentional-tradeoff) across all applicable axes, with the **manual-verification
checklist** explicit so the dev knows exactly what to eyeball.

## 7. `audit-pr` (PR merge gate)

A pre-merge gate over the whole PR (not just the diff): SPEC acceptance criteria
met, **all phases complete**, docs updated per the doc map, `Closes #N` present,
tests added, CI green, branch off `main` and independently mergeable, and the
`review-change` axes clean (or consciously deferred). Verdict: **merge-ready** or a
list of **blockers**. The manager's "can this ship?" check.

## 8. `product-audit` (periodic / product-ready full audit)

Run every few features or when the product is "done". Full-spectrum, platform-
adaptive health check:

- All `review-change` axes across the codebase (not just a diff).
- UX / UI / SEO / accessibility / brand — for the parts that have them.
- Cybersecurity sweep (secrets, authz, dependency risk).
- **Process & docs**: incomplete phases, open issues, **solvable known-issues**,
  documentation completeness, missing/optimizable workflow docs.
- **Accumulated suggestions** mined from feature docs (`decisions.md`,
  `known-issues.md`, `architecture-notes.md`) → **proposed roadmap features** and
  **issues to file**.
- Output: a prioritized report + concrete proposals (roadmap entries, issues,
  fixes), severity-ranked. The "CTO health check."

**Never auto-fixes.** The user decides what to plan and whether to proceed. It
**recommends opening issues** for the bugs/errors it finds, and **recommends
adding or removing roadmap features** when something does — or no longer does —
make sense. Action stays a human decision.

## 9. `init-workspace` change

After detecting the platform, `init-workspace` proposes installing the **companion
review skills** the audit/review skills will use internally — only the relevant
ones:

- Always: `code-review`, `security-review`, `verify`, `tech-debt`.
- If UI (web/mobile/TUI): `design-review`, `accessibility-review`, `brand-review`.
- If web: `web-perf`, an SEO skill.
- Never suggests UI/SEO skills for a CLI / library / infra project.

It records which are expected in the project's CLAUDE.md so `review-change` /
`product-audit` know what to compose.

## 10. `execute-phase` automation

- After **every 2 phases**, auto-invoke `review-change` on the work so far.
  - **Clean** → offer to proceed to the next phase.
  - **Findings** → present the fixes **and** explicitly list what needs **manual
    verification**, so the dev has zero doubt about what to check by hand before
    continuing.
- Still pauses at each gate (one phase at a time, human in the loop). The
  automation removes the "invoke each step" friction, not the review.

## 11. Cost & quality summary

- **Tokens**: router keeps planning invocations lean (only the needed internal
  body loads). `review-change` only invokes applicable externals (no wasted
  passes). `product-audit` is heavy by design — it's run rarely.
- **Latency**: forceable flags (`--from-issue`, `--interview`, `--scaffold`,
  `--next`) skip router reasoning when the user already knows.
- **Quality**: every change gets the right reviews for its platform; the PR gate
  and product audit catch process/coverage gaps a per-change review can't.

## 12. Build phases (proposed)

1. **Planning family** → router `plan-feature` + 3 internals (port design-feature /
   feature-from-issue; new scaffold); `--next` from roadmap. Update docs/menus.
2. **Fix clarity** → rename `draft-fix-spec` → `plan-fix`; align docs to the
   `plan-* → execute-*` symmetry.
3. **`review-change`** + the platform matrix; compose `review-implementation` +
   externals.
4. **`audit-pr`**.
5. **`product-audit`**.
6. **Automation** → `execute-phase` every-2-phases review; `init-workspace`
   companion-skill suggestions.

Each phase: build → verify (`npx skills add . --list`, frontmatter valid, English,
no stack leak) → commit → (push) → your review.

## 13. Decisions (resolved)

- **D1 — pattern**: router + internal skills (pattern C) for the planning family. ✅
- **D2 — review skills**: keep **both**. `review-implementation` stays the
  findings engine; `review-change` composes it + the applicable external skills. ✅
- **D3 — naming**: confirmed — `plan-fix` (was draft-fix-spec); `review-change`
  (new); internal dirs `plan-feature-interview` / `plan-feature-from-issue` /
  `plan-feature-scaffold`. ✅
- **D4 — `product-audit`**: report + proposals only, **never auto-fixes**; the user
  decides what to plan/proceed; it **recommends issues** for bugs found and
  **roadmap add/remove** when something does/doesn't make sense. ✅

## 14. Cross-cutting requirements

- **Model + effort on every skill.** Each `SKILL.md` carries `model:` *and*
  `effort:` (low/medium/high/xhigh/max). The current 9 are set per the README
  table (opus+high for planning/judgement/review; sonnet+medium for execution).
  New skills get both — the heavy auditors lean high/max: `product-audit` → max,
  `audit-pr` / `review-change` → high.
- **Docs sync on completion.** When the build finishes, update **all**
  documentation to the new skill set: `README.md` + `README.es.md`,
  `docs/workflow/*` (SKILLS, FEATURE_WORKFLOW, ISSUE_WORKFLOW, REVIEW_AND_CLASSIFY,
  REPLICATE, PORTABLE_PROMPT), `CLAUDE.md`, and the **Notion** mirror.
```
