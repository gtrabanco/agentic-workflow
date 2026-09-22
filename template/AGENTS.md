# AGENTS.md

> **This is the project's single agent guide.** The scaffold writes it here and
> nothing else: an agent guide duplicated under two names drifts, and the copy
> nobody reads is the one that gets edited. Older Claude Code releases read
> `CLAUDE.md` instead — `/init-workspace` removes that file only with your
> explicit consent, after folding anything unique in it into this one.

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
| Feature design — capability & integration closure | `docs/CAPABILITIES.md` *(the capability inventory: roles + cross-cutting subsystems; extended whenever a feature introduces one)* |
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
| Frozen repository knowledge | `docs/workflow/REPOSITORY_STATE.md` *(written by discovery/resolution; consumed by workflow roles)* |
| Architectural constraints | `docs/architecture/ARCHITECTURAL_INVARIANTS.md` *(optional; explicit rules that architectural changes must preserve)* |
| Generated developer docs | *(deprecated — generate-docs skill removed)* |

# Docs site *(optional — uncomment and fill for a docs website that the project manages manually)*

<!--
- format: starlight | docusaurus | markdown
- content-dir: src/content/docs/
- build: npx astro check   # or `none`
- map: npm run docs:graph  # a script emitting a nodes[]/edges[] JSON via
                           # deterministic tooling (dependency-cruiser, madge,
                           # TypeDoc, tree-sitter, LSP…); or `none`
-->

---

## Workflow conventions (the skills read this)

The single source of truth for what every agentic-workflow skill does first and
always honors — **referenced** by the skills instead of restated in each one.

**Discovery (always first).** Before acting, read: this guide + the **documentation
map** above, the **roadmap** (`docs/features/ROADMAP.md`), and the template(s) or
recent artifacts for the task at hand. Never assume paths or formats; if a doc is
missing, say so and fall back to these conventions rather than guessing.

**Normalized Repository State.** When `docs/workflow/REPOSITORY_STATE.md` exists,
consume its frozen, evidence-backed facts and accepted decisions before
rediscovering them. Keep facts, planned work, documentation, and inference
separate. A missing fact may be inspected directly; conflicting evidence becomes
a contradiction for `/resolve-repository-state`, never a silent overwrite.

**Architectural invariants.** When the documentation map declares
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` (or an equivalent path), classify
each applicable rule as preserved, violated, introduced, or changed before
designing, planning, implementing, reviewing, or auditing a change. A violation
or new/changed rule requires an explicit architectural decision; a feature SPEC,
implementation, or passing test cannot silently authorize it. If no invariant
document exists, record that no project invariants are declared and continue.

**Forge (issue/PR tracker):** `<GitHub (gh) | GitLab (glab) | other CLI>` — the
CLI the skills use for issues and PRs. Skill examples are written with `gh`; when
this project declares a different forge, run the equivalent command with its CLI.
The auto-close convention (`Closes #N` in the PR/MR body) must hold either way.

**Forge bodies are Markdown, not shell — never hand-escape them.** An issue, PR,
or comment body renders as Markdown: backticks, `*`, `_`, `#`, `|` are
formatting, **not** shell syntax, so **never put a `\` before them**. A stray
`\` renders literally (`` \`code\` `` instead of `` `code` ``) — the most common
forge-formatting bug. Always **write the body to a file** (plain Markdown, real
backticks, zero backslashes) and pass **`--body-file <path>`**
(`gh issue create --body-file`, `gh pr create --body-file`,
`gh issue comment --body-file`, or the forge's equivalent) — **never** an inline
`--body "…"` or a quoted `<<'EOF'` heredoc, both of which mangle backticks or
preserve the stray `\`. A bare non-Markdown one-liner (e.g. `Closes #12`) may
stay inline. Verify after: `gh issue view <n> --json body` shows backticks
rendering, no literal `` \` ``.

**Notation — forge numbers vs workflow numbers.** Two independent number spaces
run side by side in this workflow and must never be confused:

- **`#N` is a forge number** — a GitHub/GitLab issue or PR. In a forge, issues
  and PRs share one sequence, so `#N` is always exactly one object, never two.
  When the distinction matters, write **`issue #N`** or **`PR #N`**, or link it.
- **Feature numbers carry no `#`.** Write **`feature 12`** (or plain `12` inside
  a roadmap/feature context) — never `#12`. A roadmap row number is a workflow
  identifier; the forge has its own object at that number.
- **Fix units are forge-backed.** A fix is named by the issue that tracks it —
  **`fix #157`**, folder `docs/fix/157-<topic>/`. So `fix #52` and `feature 52`
  are two different things and the noun is what separates them.
- **Ambiguity is a defect, not a style choice.** A sentence that mixes both
  spaces (`merging #12 unblocks 05 and 07`) gets rewritten with the nouns
  (`merging issue #12 unblocks features 05 and 07`). When a feature and an issue
  share a number, the noun is mandatory.

**Git workflow:** `<branches | worktrees>` — how parallel work is handled.
**`branches`** (default): plain feature/fix branches via `git switch -c`, **one
active unit at a time**, sequential — slower, but the working tree is always the
unit you're on. **`worktrees`**: parallel units in separate checkouts — only if
your agent/tooling manages worktrees. Every skill that creates a branch honors
this line; with `branches` declared, no skill may create a worktree.

**Agent safety hooks:** `<Claude Code | Cursor | Copilot | OpenCode | none>`.
When enabled, repository adapters call `.agentic-workflow/hooks/guard-command.sh`
before shell/read tools. Direct environment dumps, `.env` reads, and merge
commands are blocked. Automated merge is not available by default — the lane's
conductor (`unit-lane`) orchestrates the pipeline but does not auto-merge.
Never grant an agent-wide or session-persistent merge permission. Hooks are
defense-in-depth — forge branch protection/rulesets remain required.

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

**Adaptive lane (unit-driven workflow — feature 61).** Every NEW unit (feature
or fix) produces exactly one `SPEC.md` under `docs/features/<NN>-<slug>/` with
13 mandatory sections (Objective, Why, User outcome, Acceptance criteria,
Non-goals, Future cost, Applicable tests, Known pre-existing issues, Tasks,
Evidence, Progress log, Next, References). The unit's path is decided by a triage
pass against a closed catalog (research, design, plan, implement, tests,
evidence, review, docs, release). The lane conductor (`/unit-lane`) orchestrates;
`execute-phase` runs each step as an atomic gate/commit. A diff-size guard
(`scripts/diff-guard.mjs`) expels units that exceed their budget back to triage.
Evidence rows document what was run, exit status, and verified-by. The progress
log uses dated entries (`YYYY-MM-DD HH:MM`). Commit format: `type(scope):
description` (conventional commits). Roadmap rows follow `idea → defined →
planned → in-progress → done`.

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

## Performance commands *(optional — filled by `init-workspace`; read by `review-perf`)*

When declared, the workflow's performance review **runs** these and cites real
numbers instead of estimating from the diff. Use `none` explicitly for a slot
the project doesn't have; delete the block only if none apply.

```
- bench: <command | none>            # e.g. vitest bench, bun run bench.ts
- profile: <command | none>          # e.g. node --cpu-prof <entry>
- complexity-lint: <command | none>  # e.g. the linter's complexity ruleset
- noise-band: ±5%                    # deltas inside the band are not findings
```

---

## Architecture

This project's architecture is documented in `docs/architecture/ARCHITECTURE.md`.
The workflow is **architecture-agnostic** — it does not assume any particular
pattern (layered, hexagonal, clean, modular monolith, MVC, …). Record *your*
chosen pattern, its layers/modules, and the **dependency-direction rules** that
must never be violated in that doc. Put long-lived cross-cutting rules in
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` when applicable; the skills will
respect both documents.

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

Features produce one `SPEC.md` (from `docs/features/_TEMPLATE/SPEC.md`),
registered in `docs/features/ROADMAP.md`. The lane flow:

1. **Unit doc** — create `docs/features/<NN>-<slug>/SPEC.md` from the template
2. **Triage** — the lane conductor (`/unit-lane` / `workflow-status`) returns a
   deterministic ordered list of steps (research, design, plan, implement,
   tests, evidence, review, docs, release — some skipped by triage)
3. **Catalog steps** — each step runs as an atomic gate/commit via
   `execute-phase` (diff-size guard bites when the budget is exceeded → re-triage)
4. **Evidence** — verify each acceptance criterion: what was run, exit status/
   digest, observed output, verified-by
5. **Review** — independent review pass; findings classified (fix-now /
   replan-in-unit / decision-required / proposal / ignore)
6. **Release** — version bumps, changelog (M/L features); skipped for XS/S
7. **PR** — open with `Closes #N` (absorbed issues) and flip roadmap row to
   `done`

Phases are labelled **`P1, P2, …`** ("phases") everywhere — in the unit
SPEC.md's Tasks section, evidence rows, and commits — never `S1`/"Steps". The
label is `execute-phase`'s argument (`execute-phase NN P2`), so it must stay
uniform.

**One step = one session.** Never execute two catalog steps in one conversation
on a non-frontier model — models degrade over long horizons, and a fresh session
per step is what preserves the cheap-execution guarantee. With `/loop`, this is
already how the batch shape re-invokes per step; without it, re-invoke
`execute-phase` by hand for each step in a fresh conversation.

**Review findings** persist to `docs/features/<NN>-<slug>/review-findings.md`
(fixed schema `| id | file:line | axis | severity | class | route | folded |`,
`folded` starting `no`); `execute-phase`'s fold cycle ticks each folded row
`folded: yes`.

## Fix workflow

Every NEW fix produces one `SPEC.md` under `docs/fix/<N>-<topic>/` (from
`docs/fix/_TEMPLATE/SPEC.md`), registered in `docs/fix/README.md`. The flow:

1. **Unit doc** — create `docs/fix/<N>-<topic>/SPEC.md` from the template
2. **Triage** — the lane conductor returns a lightweight step list
   (typically: implement, evidence)
3. **Catalog steps** — each step runs as an atomic gate/commit via `execute-phase`
4. **Evidence** — verify the fix against each acceptance criterion
5. **Review** — independent review pass
6. **PR** — open with `Closes #N`; the fix's tracked issue auto-closes

**Review findings** persist to `docs/fix/<N>-<topic>/review-findings.md` (same
schema as feature units).

After merge: remove the entry from `docs/fix/README.md`.

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

**Context hygiene rule:** end of a catalog step → `/log-session` then a NEW
conversation, never compact — compaction re-reads the whole transcript with
the current session model, right when the context is most expensive to
re-read; a fresh conversation is ~free because the unit SPEC.md's Evidence
and Progress log sections plus the session log already are the persistent
memory. Compact only mid-step, for unpersisted state you can't afford to
lose, and prefer committing WIP + updating the unit's Progress log instead.
Details: `docs/workflow/FEATURE_WORKFLOW.md` → *Context hygiene & cost*.

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
