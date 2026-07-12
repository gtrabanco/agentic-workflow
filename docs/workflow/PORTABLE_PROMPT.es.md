# Prompt portable — instalar el sistema de skills del flujo de trabajo agéntico

> 🇬🇧 [English version](PORTABLE_PROMPT.md)

Pega el prompt de abajo en Claude Code (o cualquier agente de programación
capaz) **desde la raíz del repositorio destino**. Regenera el flujo de
trabajo agéntico — **11 skills orientadas al usuario + 3 pasos internos**
(menos `init-workspace`, que este mismo prompt reemplaza como el bootstrap)
— **adaptadas a la** arquitectura, documentación, y convenciones **de ese
proyecto**, en lugar de copiar textualmente los detalles de este
repositorio.

Usa esto cuando quieras que las skills se ajusten a un proyecto nuevo. Para
una copia determinista e idéntica en su lugar, instálalas con la CLI
`skills`: `npx skills add gtrabanco/agentic-workflow` (ver `REPLICATE.es.md`).

> **Nota sobre el idioma del prompt:** el bloque de abajo se deja
> deliberadamente **sin traducir** — es un prompt literal, pensado para
> pegarse tal cual en un agente; traducirlo cambiaría lo que el agente
> ejecuta. Pégalo textualmente sin importar el idioma en el que trabajes.

---

````text
You are setting up an agentic feature/issue workflow as reusable Claude skills in
THIS repository. Do not assume this project matches any other — discover its
conventions and adapt.

## 0. Safety
- Never work on the default branch (main/master). Create a dedicated branch
  (e.g. `chore/agentic-workflow-skills`) or an isolated git worktree first.
- If the working tree has uncommitted changes, do not disturb them: use a
  worktree off the default branch.

## 1. Discover the project (read before writing anything)
Find and read whatever exists; record the real paths and rules:
- The agent guide at the repo root: `CLAUDE.md` and/or `AGENTS.md`.
  Extract: the documentation map, the feature workflow, branch/PR rules, the
  pre-commit checklist, the docs language, and the verification gate commands
  (type-check / test / build — whatever the project uses, e.g.
  npm/pnpm/yarn/cargo/go/make equivalents).
- The architecture doc and layering rules.
- The feature system: a SPEC template (e.g. `docs/features/_TEMPLATE/SPEC.md`),
  the roadmap (e.g. `docs/features/ROADMAP.md`), and 1–2 recent feature folders
  to learn the exact artifact set used.
- The fix system: a fix index (e.g. `docs/fix/README.md`) and fix SPEC template.
- `.github/ISSUE_TEMPLATE/` and `.github/PULL_REQUEST_TEMPLATE.md`.
- The **forge** (issue/PR tracker + CLI): detect it from the remote URL
  (github.com → `gh`, gitlab → `glab`, else ask) and write the skills' forge
  commands with the detected CLI. The `Closes #N` auto-close convention must hold.
- Naming conventions, money/i18n/SEO/a11y/security rules, and runtime limits.
If something doesn't exist, note it; the skills must degrade gracefully and say
so at runtime rather than assuming a path.

## 2. Create the skills under `.claude/skills/<name>/SKILL.md`
Each file: YAML frontmatter (`name`, `user-invocable`, a trigger-rich
`description`, and a pre-set `model`/`effort`) + a body with `When to use`,
`Step 0 — Discover the project (always first)`, `Process`, `Guardrails`,
`Relationship to other skills`, `Done when`. Make every skill discover-first and
reference THIS project's real paths/commands/language.

**Design**
1. `design-feature` — product definition. Fold in a raw-idea interview
   (proactively ask, small batched rounds, recommended defaults) when starting
   from zero, then walk the **capability-closure** checklist: for each entity
   introduced/touched, CRUD + state transitions, each with a UI entry point +
   API surface + test, or an explicit `n/a: <reason>`; for each capability, its
   entry point + who may execute it; for each role, where it's
   assigned/revoked/viewed. The filled rows become the acceptance criteria.
   Estimate the feature's **size** (`XS/S/M/L`); offer to open a tracking
   issue. Writes the SPEC's **product half** and stamps `## Design status:
   designed`. Upserts on re-run (never destroys recorded decisions).

**Plan**
2. `plan-feature` — the ROUTER and the only engineering-planning entry in the
   menu. Given an undesigned feature (no `## Design status: designed`),
   **STOP and redirect** to `/design-feature <slug>` (no bypass flag). Given a
   designed feature, an issue `#N`, a scoped slug/SPEC, or `--next` (next
   roadmap item), dispatch to the right internal step below, then ensure the
   roadmap entry and print the next step: `execute-phase NN P1` (M/L and
   XS/S alike — XS/S phases live in the SPEC).
3. `plan-fix` — architect-draft a tightly-scoped fix SPEC from an issue, register
   it in the fix index, commit on a fix branch, and STOP for review.

**Internal planning steps** (`user-invocable: false` — invoked only by the router)
4. `plan-feature-from-issue` — convert a feature-request issue into a scoped,
   **sized** SPEC product half (confirm it's a feature, not a bug/debt; translate
   to docs language; map to roadmap; close gaps by asking, or hand a thin issue
   to `design-feature`; wire `Closes #N`; satisfy capability closure).
5. `plan-feature-scaffold` — fill the **engineering half** + scaffold planning
   artifacts **scaled to the size**: XS/S → SPEC-only (no ceremony), with
   **≥ 2 phases in the SPEC** (`P1` implementation, final
   `P2 — Hardening & PR` = the close-out); M/L → the full set, whose plan
   always ends in a **hardening phase** (edge cases + the SPEC's failure
   modes). Register in the roadmap.
   Docs only; no code, no branch.

**Execute**
6. `execute-phase` — implement one phase per invocation: of a feature
   (default), of a small `XS/S` feature, or of a fix (`--fix`) — XS/S and fix
   phases live in the SPEC's `## Phases` (their final phase is always
   `Hardening & PR`, the close-out); a legacy SPEC without `## Phases` runs
   end-to-end in one pass. Branch safety; on P1 commit the planning
   artifacts separately before any code. **Tests-first** on core/domain and
   orchestration work (the SPEC's dev scenarios are the test list, red → green).
   The project's verification gate before every commit — **never commit red**
   (unfixable-in-scope failures → known-issues + stop). When reality contradicts
   the plan, update TASKS/PLAN and record why — never silently diverge. Per-phase
   doc discipline; hand off to `review-change` every 2 phases AND for the
   **mandatory** end review (suggest it rather than composing it, so it runs at its
   own model/effort). A finished unit (the final `Hardening & PR` phase for
   XS/S and fixes, a feature's final phase, or a legacy single pass)
   **always opens its PR** (never branch-only) and **flips to `done` at PR-open**
   (built, not merged — merge state lives in the forge). Print the next step.

**Review & audit** (change → PR → product)
7. `review-implementation` (`user-invocable: false` — the engine `review-change`
   composes) — two-phase review of a change. Phase 1 FIND (no
   refactor) across: bugs, architecture violations, removable/dead code (EXCEPT
   code intentionally staged for an in-progress/planned feature — cross-check
   roadmap/SPEC/known-issues), security/cybersecurity, platform/runtime
   incompatibilities, overengineering & premature optimization, bundle-size
   risk, and tests (failing AND missing). Phase 2 CLASSIFY each finding as
   fix-now / postpone / ignore / intentional-tradeoff in a decision table with
   WHY, implementation risk, long-term impact, and a premature-optimization flag.
   Findings only — never refactor.
8. `review-change` — platform-adaptive orchestrator, **mandatory before every
   merge**: run only the reviews that apply to this project + change (compose
   `review-implementation` + the project's companion review skills), check **SPEC
   drift** (diff vs. the governing SPEC's scope and acceptance criteria — nothing
   contradicted, silently exceeded, or left untouched), and synthesize ONE classified
   table + an explicit manual-verification checklist. Run **every non-fix-now finding
   through `triage-issue`** (compose in-turn — equal tier) so each gets a destination
   (issue / documented decision / justified drop), never silently lost. Findings only;
   print the next step (`audit-pr`).
9. `audit-pr` — PR-level merge gate: SPEC acceptance met, all phases complete,
   docs updated (**never merge with pending docs**), `Closes #N`, the issue/fix-index
   entry still tracked (removed only after merge), tests, CI green, branch
   independently mergeable, and the review axes clean → merge-ready or a list of
   blockers. `done` ≠ merge-ready (a `done` unit can still have an open PR). Never
   merges or edits.
10. `product-audit` — periodic product-wide health check across every applicable
   axis + process/docs/roadmap coherence; mine feature docs → propose issues +
   roadmap add/remove. Never auto-fixes; the user decides.
11. `audit-docs` — audit docs ↔ roadmap ↔ code ↔ fix index for drift; produce a
   severity-ranked report; fix only low-risk items on request.

**Decide**
12. `triage-issue` — classify an issue (fix-now / promote-to-feature / postpone /
   wontfix). Parse the issue's own "when to fix"/trigger and VERIFY it against the
   current code (grep counts, thresholds, repro). Route, or leave open with a
   dated re-confirmation comment. Never implement deferred work inline. Accept
   several issue numbers in one batch (independent verdicts, one summary table).

**Autopilot**
13. `ship-roadmap` — end-to-end conductor driven by /loop. ONE upfront interview
   (product/scale/lifespan; features — elicit and build the complete roadmap if
   absent; stack — use or recommend; architecture — use or recommend PROPORTIONAL
   to the app, never defaulting to a named pattern; quality bars; ops; forge;
   autonomy and budget), then founds the substrate if missing, writes the
   roadmap, and loops: plan (compose plan-feature in-turn) → execute (one
   cheap-tier subagent per phase following execute-phase) → review (compose
   review-change) → PR → merge gate (compose audit-pr) → next feature. Default:
   opens PRs, the human merges; --fullauto merges MERGE-READY PRs under
   non-negotiable, fail-closed safety floors (never red, fresh verdict SHA,
   sensitive-area and destructive-change pauses, no protection bypass). Run
   policy lives in a committed decision record; an untracked run log carries
   iteration state. Ends with a final report: per-feature outcomes, issues to
   open (with reopening triggers), discovered feature proposals, manual
   verification checklist, product-audit cadence. The conductor's tier must be
   >= every skill it composes; the product-audit skill is always a hand-off.

Compose with (do not duplicate) the project's own companion review skills
(`/code-review`, `/security-review`, `/verify`, and any design/a11y/brand/perf/SEO
skills) — `review-change` and `product-audit` invoke only the applicable ones. If
a needed one is absent, note the gap rather than failing.

## 2b. The envelope is a driver-injected contract, not a per-skill duty

Every user-facing skill except `workflow-status` stays clean for humans: no
trailing JSON block, no turn-contract line about emitting one. The envelope
requirement lives at the orchestration layer instead — a driver that wants
machine-parseable turns injects this system-prompt snippet into every
headless invocation:

```text
Every turn you produce MUST end with exactly one fenced ```json block matching
the orchestration envelope schema (all top-level keys present; values only
from verified command output). Emit nothing after it.
```

If a turn comes back without a valid envelope, the driver's repair loop
re-invokes the same session with `Emit only the machine envelope for the turn
above.` (one attempt; a second failure is a driver-level `FAILED`, surfaced to
a human) — see `docs/workflow/ORCHESTRATION.md` for the full protocol.
`workflow-status` is the one skill that keeps emitting the envelope inline
(emitting it is its function), so it needs neither the snippet nor the repair
loop.

## 3. Write a `docs/workflow/` copy
Create
`docs/workflow/{README,FEATURE_WORKFLOW,ISSUE_WORKFLOW,SKILLS,REVIEW_AND_CLASSIFY,REPLICATE}.md`
documenting the end-to-end feature flow, the issue flow, the skill reference, the
review/audit flow, and how to replicate — all using THIS project's real paths,
gate commands, and rules.

## 4. Respect the project throughout
Honor the architecture, style guides, and all existing documentation. Use the
project's docs language for every artifact. Keep changes docs-only in this setup
task. Do not add dependencies.

## 5. Finish
Run the project's verification gate if you touched anything it covers, commit on
the dedicated branch in the project's commit style, and open a PR against the
default branch summarizing the skill system. Then stop and report what you
created and how to use it.
````

---

## Notas

- El prompt es intencionalmente **impulsado por el descubrimiento**: le
  pide al agente que aprenda las reglas de cada proyecto en lugar de
  codificar las de este repositorio. Eso es lo que te permite "trabajar de
  la misma forma" en todas partes mientras sigues respetando la
  arquitectura de cada proyecto.
- Después de que se ejecute, impulsa las features con `plan-feature` (el
  router) y los fixes con `plan-fix`, ejecuta con `execute-phase`, revisa
  con `review-change`, aplica la puerta al PR con `audit-pr`, y clasifica
  issues con `triage-issue` — exactamente como se documenta en
  `docs/workflow/`.
