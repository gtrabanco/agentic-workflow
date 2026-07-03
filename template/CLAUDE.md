# CLAUDE.md

> **This is a template.** Copy it to the root of your project and fill in the
> bracketed `<…>` placeholders. Delete sections that don't apply and add rows to
> the documentation map for your own domains. The structure is the contract the
> agentic workflow skills read at runtime — keep the map honest and they adapt to
> your project automatically.

Guidance for AI coding agents working in this repository.

**Always read the relevant documentation before changing code.**

---

## Documentation map

The single most important table: it tells an agent *which doc owns what*, so it
reads the right context before acting. Delete rows you don't have; add rows for
your domains.

| Task | Required docs |
|---|---|
| Any code change | `docs/architecture/ARCHITECTURE.md` |
| New feature / planning / sequencing | `docs/features/ROADMAP.md`, `docs/features/_TEMPLATE/SPEC.md` |
| A fix | `docs/fix/_TEMPLATE/SPEC.md`, `docs/fix/README.md` |
| Integrating an external provider | `docs/providers/<provider>.md` |
| SEO / metadata / structured data | `docs/frontend/SEO.md` *(optional)* |
| i18n / translations / locales | `docs/frontend/I18N.md` *(optional)* |
| Accessibility | `docs/frontend/ACCESSIBILITY.md` *(optional)* |
| Copy / UX messaging | `docs/frontend/COPYWRITING.md` *(optional)* |
| UI / visual system | `docs/frontend/DESIGN.md` *(optional)* |
| Brand identity / voice | `docs/brand/BRAND.md` |
| Domain / business rules | `docs/domain/*`, `docs/business/*` |
| Legal / compliance | `docs/legal/*` |
| Session journal / resuming work | `docs/LOGS.md` *(written by `/log-session` + the `.claude/` hooks)* |

---

## Workflow conventions (the skills read this)

The single source of truth for what every agentic-workflow skill does first and
always honors — **referenced** by the skills instead of restated in each one.

**Discovery (always first).** Before acting, read: this guide + the **documentation
map** above, the **roadmap** (`docs/features/ROADMAP.md`), and the template(s) or
recent artifacts for the task at hand. Never assume paths or formats; if a doc is
missing, say so and fall back to these conventions rather than guessing.

**Forge (issue/PR tracker):** `<GitHub (gh) | GitLab (glab) | other CLI>` — the
CLI the skills use for issues and PRs. Skill examples are written with `gh`; when
this project declares a different forge, run the equivalent command with its CLI.
The auto-close convention (`Closes #N` in the PR/MR body) must hold either way.

**Git workflow:** `<branches | worktrees>` — how parallel work is handled.
**`branches`** (default): plain feature/fix branches via `git switch -c`, **one
active unit at a time**, sequential — slower, but the working tree is always the
unit you're on. **`worktrees`**: parallel units in separate checkouts — only if
your agent/tooling manages worktrees. Every skill that creates a branch honors
this line; with `branches` declared, no skill may create a worktree.

**Hard rules (always honored).**
- **Branch & PR:** never work on `main`; one PR per unit against `main`; never
  stack — see [PR & branch workflow](#pr--branch-workflow).
- **Gate before commit:** the verification gate (type-check + tests + build) is
  green — see [Commands](#commands).
- **Docs language:** every committed artifact (issues, PRs, commits, SPECs,
  docs) in `<your docs language>`, whatever language the work was requested
  in. Precedence: an explicit instruction in the prompt > this line > English.
  **The conversation language never decides** — a request made in Spanish
  still produces artifacts in the declared language.
- **Evidence over reflex:** verify claims against the code (counts, repro,
  thresholds) and cite paths; don't assert from assumption.
- **Track, don't inline:** deferred work becomes a tracked issue / known-issue,
  never silently implemented.
- Plus this project's [Hard rules](#hard-rules) and [Architecture](#architecture)
  invariants.

**Question protocol (when a skill must ask the user to decide).** Only ask when the
answer materially changes the artifact — make routine choices silently and record
them. Each question states: **what** is being decided; its **scope** (files,
behavior, consumers affected); its **criticality** (critical / high / medium /
low); and each **option** with pros and cons separately, recommendation flagged.

---

## Commands

Fill in your project's real commands. The agentic workflow refers to the
**verification gate** generically; define it once here.

```bash
<dev command>        # run locally
<build command>      # production build
<test command>       # test suite

# Verification gate (must pass before every commit):
<type-check> && <test> && <build>
```

---

## Architecture

This project's architecture is documented in `docs/architecture/ARCHITECTURE.md`.
The workflow is **architecture-agnostic** — it does not assume any particular
pattern (layered, hexagonal, clean, modular monolith, MVC, …). Record *your*
chosen pattern, its layers/modules, and the **dependency-direction rules** that
must never be violated in that doc, and the skills will respect them.

State the invariants explicitly there (e.g. "module X must not import module Y",
"business logic stays out of the UI layer"). Reference them from SPECs.

---

## Hard rules

Generic, stack-independent guardrails. Add your own.

- **Dependencies:** justify every new dependency; prefer the platform/standard
  library; pin versions. Avoid redundant libraries that duplicate existing ones.
- **Honesty to the user:** never hide real limitations of the product (limits,
  reductions, restrictions). Disclose them in the UI/output.
- **Secrets:** never commit secrets; read them from the environment/secret store.
- **Docs language:** all committed artifacts in `<your docs language>`,
  regardless of the language the work was requested in.

---

## Testing philosophy

Prefer integration and architecture tests over heavy mocking and
snapshot-heavy testing. Test behavior, not implementation detail. State the
required test layer for a change in its SPEC.

---

## Naming conventions

| Type | Convention |
|---|---|
| Source files | `<e.g. kebab-case>` |
| Components / classes | `<e.g. PascalCase>` |
| Directories | `<e.g. kebab-case>` |

---

## Feature workflow

Features are planned before they are coded. Flow:

1. `SPEC.md` (from `docs/features/_TEMPLATE/SPEC.md`)
2. `PLAN.md`
3. `TASKS.md`
4. execution by phase (one phase per commit, gate-verified)
5. hardening
6. verification & review
7. PR

Phases are labelled **`P1, P2, …`** ("phases") everywhere — `PLAN.md`, `TASKS.md`,
`progress.md`, commits — never `S1`/"Steps". The label is `execute-phase`'s
argument (`execute-phase NN P2`), so it must stay uniform.

Start a new feature by copying `docs/features/_TEMPLATE/SPEC.md` to
`docs/features/<NN>-<slug>/SPEC.md` and registering it in
`docs/features/ROADMAP.md` (the source of truth for numbering, order, and
dependencies).

## Fix workflow

A fix is lighter than a feature: only a `SPEC.md` (from
`docs/fix/_TEMPLATE/SPEC.md`), registered in `docs/fix/README.md`, no planning
artifacts. Every fix has a tracked issue; its PR closes it.

---

## Session log

`docs/LOGS.md` is an append-only journal of working sessions — the *why* and the
*what-next* that git history doesn't record. Two ways it's written, both
optional:

- **`/log-session`** (manual, rich) — summary, decisions, next step. Run it
  before `/clear` or before closing for the day.
- **`.claude/` hooks** (automatic, free) — append a mechanical entry on `/clear`
  and exit; an opt-in hook re-injects the last entry to resume context. Copy
  `.claude/settings.json.example` to enable; see `.claude/README.md`.

---

## PR & branch workflow

- **One PR per unit of work, always against `main`.** Each PR must be
  independently mergeable: it passes the verification gate and delivers
  standalone value.
- **Never work on `main` directly.** Create a branch first
  (`feat/<NN>-<slug>` or `fix/<n>-<topic>`).
- **Never stack PRs.** A PR's base is always `main`. If a feature is too large,
  split it into independently shippable slices — never by internal phases.

## Commit format

```txt
feat(<area>): <summary>
fix(<area>): <summary>
chore(<area>): <summary>
```

---

## Skills

This project uses the agentic workflow skills
([`gtrabanco/agentic-workflow`](https://github.com/gtrabanco/agentic-workflow)),
installed with:

```sh
npx skills add gtrabanco/agentic-workflow
```

They discover this project's docs (the map above) at runtime and drive the
feature/issue workflow. When repeated searches or doc lookups recur, create a
project-specific skill to capture the knowledge instead of re-deriving it.

---

## MCP servers

List the MCP servers this project relies on and what each is for. Prefer their
documentation over ad-hoc web searches.

| Server | Purpose |
|---|---|
| `<name>` | `<what it provides>` |
