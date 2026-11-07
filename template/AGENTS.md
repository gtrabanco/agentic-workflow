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
| New feature / planning / sequencing | `docs/ROADMAP.md` (§ Features), `docs/features/_TEMPLATE/SPEC.md` |
| Feature design — capability & integration closure | `docs/CAPABILITIES.md` *(the capability inventory: roles + cross-cutting subsystems; extended whenever a feature introduces one)* |
| A fix | `docs/fix/_TEMPLATE/SPEC.md`, `docs/ROADMAP.md` (§ Fixes) |
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
| Project identity, deployment, license & policies | the **Project charter** section (below) — written by `/init-workspace`, read before any design or plan |
| Acceptance criteria & review passes per surface | `docs/workflow/VERIFICATION_CRITERIA.md` *(the project's criteria catalogue; extended only with a recorded decision)* |
| Cross-session memory | Engram, the workflow's memory substrate *(ask-first: provisioned by `/init-workspace` on a non-pi host, or by the pi package's `memory.engram` consent; the save/recall protocol is `unit-lane`'s `references/MEMORY.md`)* |
| Frozen repository knowledge | `docs/workflow/REPOSITORY_STATE.md` *(written by discovery/resolution; consumed by workflow roles)* |
| Architectural constraints | `docs/architecture/ARCHITECTURAL_INVARIANTS.md` *(optional; explicit rules that architectural changes must preserve)* |
| LSP navigation & diagnostics | Serena *(optional: installed via `/init-workspace`; provides symbol lookup, diagnostics, and rename; document verification stays a deterministic script's job)* |

## Project charter

> **Written by `/init-workspace` — never guessed by an agent.** The charter is
> this project's own answer to *what this project is and how it wants to be
> worked on*, captured at bootstrap in two layers. It exists because a workflow
> that consents to every byte it writes but never asks *what the project is*
> leaves every agent to assume product identity, platform, deployment, and
> policy — the exact failure `ask-dont-infer` exists to prevent.

**Content rule (evidence-bound).** The charter records **decisions, policies
and commands — never derivable-from-code description** (arXiv 2602.11988:
repository-overview context files cost tokens with no success gain while
instructions work). A sentence the reader
could reconstruct by listing the directories does not belong here. Each answer is positioned and sized per the documentation map above —
the charter stays this section plus the registered docs, never one monolithic
document.

**Identity layer — filled at bootstrap, blocking.** `/init-workspace` asks
these before writing any substrate byte; the workflow may not guess them, and
an unanswered one halts the run through the fail-closed open-question flow
(cheap-to-undo answers may be recorded as dated assumptions instead — but
these five are expensive to undo, so they are answered or the run stops):

- **Project kind:** `<web app | desktop | library | CLI | docs | infra repo>`
- **Who uses it and why:** `<the users and the job the project does for them>`
- **Deployment & serving:** `<where it is deployed and how it is served, or "not deployed">`
- **License:** `<the project's license>`
- **Ceremony profile seed:** `<the project's chosen ceremony profile — recorded here conceptually; the profile's machine grammar is the piecewise-ceremony contract's>`

**Domain layer — open-with-defaults.** Asked once at bootstrap; an unanswered
item is recorded as a **dated assumption** (`assumed <YYYY-MM-DD> — <value>;
surfaced and re-confirmed by the first unit that needs it`), never re-asked at
every bootstrap, never a silent default:

- **Tests & gate policy:** `<what must be green before a commit; the gate commands>`
- **Dependency policy:** `<selection criteria; third-party license respect>`
- **Documentation policy:** `<generated vs authored, serving, audit cadence, captures>`
- **Required tooling:** `<tools every session must have available>`
- **Data / PII:** `<what data the project handles and its handling rules, or "none">`
- **i18n:** `<locales and the translation policy, or "none">`

**Verification-criteria catalogue.** What "done" means *at this project*,
beyond the workflow's generic baseline — per-surface acceptance criteria,
which review passes apply per surface type, framework-specific gate commands,
docs coverage, captures, manual-check rows — lives in
[`docs/workflow/VERIFICATION_CRITERIA.md`](docs/workflow/VERIFICATION_CRITERIA.md)
with its provenance per criterion. Triage and execution consume the catalogue
and never invent acceptance criteria silently.

## Docs site *(optional)*

Delete this section when the project does not manage a documentation website.
Fill the slots in place; nothing here is commented out, so a copy of this file
stays readable as it was written.

The `format` slot is the project's declared output format, and it is what the
documentation generator renders — never a hand-written page:

```
- format: starlight        # one of: markdown | md | mdx | starlight | docusaurus | html | latex | tex
- content-dir: src/content/docs/
- build: npx astro check   # or `none`
- map: npm run docs:graph  # a script emitting a nodes[]/edges[] JSON via
                           # deterministic tooling (dependency-cruiser, madge,
                           # TypeDoc, tree-sitter, LSP…); or `none`
```

`bun scripts/docs-generate.mjs` writes the projection into
`<content-dir>/generated/` (`docs/generated/` without a content dir), and
`bun scripts/docs-generate.mjs --check` is the drift receipt a verification
gate can call. A project that declares no format gets markdown **and a
reported degradation**; the generator never guesses a format silently.

---

## Workflow conventions (the skills read this)

The single source of truth for what every agentic-workflow skill does first and
always honors — **referenced** by the skills instead of restated in each one.

**Discovery (always first).** Before acting, read: this guide + the **documentation
map** above, the **roadmap** (`docs/ROADMAP.md` — its `## Features` and `## Fixes`
tables), and the template(s) or
recent artifacts for the task at hand. Never assume paths or formats; if a doc is
missing, say so and fall back to these conventions rather than guessing.

**Shell-tool discipline (re-decided every turn).**
Manual invocation runs `bun` before `node` and search runs `rg` before `grep`;
both stay legitimate as the documented fallback when the preferred tool is
absent — check availability once per session, never assume it. Retarget the two
pairs to this project's preferred tools when they differ.

**Documentation currency.** A unit that changes a shipped surface documents it
in the same change: every README (or equivalent entry page) that describes that
surface — project README, package or module README, the docs-site page declared
above — now describes what actually shipped, and the prose it supersedes is
deleted rather than left standing beside the new text. `rg -n '<the retired
claim>' <the file>` returning nothing is the retirement's evidence. This is a
required part of the docs step, not a follow-up: the step's checklist is owned
by the lane's `docs` step reference, and `audit-docs` re-checks it afterwards.

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
Batch independent questions into a single turn; ask one question first only
when its answer changes the others. Choices the user delegates ("decide for
me") and cheap-to-change defaults are recorded with their reason (the unit
folder's `decisions.md`), never left silent. Ideas the user defers ("down the
road I'd like…") go to the unit doc's `## Future` — never implemented without a
new explicit request. Installing a missing tool always requires explicit
consent.

**Open-question ledger (the unit folder's `decisions.md`).** The unit's
`decisions.md` is the single append-only ledger of that conversation — the one
file that owns it, never a parallel copy in a chat, a PR comment, or another
ledger. It carries exactly two typed entries, newest last, never edited in
place:

```text
open-questions@1
id | date | type | question | blocks | search-receipt | options | route
example Q1 | 2026-10-19 | open-question | <the decision being asked> | <why nothing proceeds without it> | <where the repository was searched: file:line, grep, unit folder, prior units> | <2–3 options, each with its trade-off; `none` when the answer is free-form> | <design | unit-lane>
example D1 | 2026-10-19 | decision | Q1 | human-owner | <where the human's answer is recorded: chat paste, issue comment> | <what was chosen> | <what was discarded and why>
```

The `open-question` row records the question **and the evidence behind it**:
the tier-0 provenance search receipt (`<path:line>` hits, the greps run, the
prior units of the same area — a "not found" without it is a defect), the
options researched when the gap was external, and the `route` back to the stage
that owns the fact (`design` for scope/architecture, `unit-lane` for plan-owned
facts). The `decision` row reads the same columns per type: `question` carries
the id it closes, `blocks` the authority (`human-owner`), `search-receipt`
where the human's answer is recorded — a chat paste, an issue comment;
validated non-`none`, so a decision without a receipt fails closed — `options`
what was chosen, and `route` what was discarded. A dismissed option stays
dismissed.

Rules the ledger enforces:

- **Only a user decision closes an open question.** More research, a new
  option, or a discussion before deciding is a legitimate answer: it appends a
  new `open-question` row and the loop continues. It is never a licence to
  infer.
- **A resumed session re-reads, never re-asks.** The pending `open-question`
  rows are the questions; do not ask them again — read them and continue from
  the first one still open.
- **Append-only.** A superseded entry gets a new row that names it; nothing is
  rewritten or deleted, so the chain stays auditable.
- **Composes with the existing uses, never forks them.** The same file also
  carries the `Decide for me` records, the path-protection
  `path-protection-records@1` block, and the planning ledgers — one file, one
  owner, several typed blocks side by side.
- **Halt, do not ask.** The consumed block is printed by the deterministic
  dispatcher (`scripts/needs-input.mjs`), so a malformed ledger fails closed
  instead of silently dropping a question.

**Adaptive lane (unit-driven workflow).** Every NEW unit (feature
or fix) produces exactly one `SPEC.md` under `docs/features/<NN>-<slug>/`, in one
of two accepted shapes. The **`spec-by-reference` shape** (the template's shape)
has 11 sections: `Specs` (numbered `S#`, each quoting the
requester's own words verbatim; a correction appends under its own id like
`S1a`), Impact, Non-goals, Future cost, Applicable tests, Known pre-existing
issues, `Tasks` (each bullet linked to the `S#` it delivers), `Findings` (OPEN
rows only), `Log` (append-only: `L1` is the request verbatim, and later lines
carry one of the `L`/`E`/`G`/`F`/`D`/`P` kinds), Next, References. The
**legacy shape** has 14 sections (Objective, Why, User outcome, Acceptance
criteria, Impact, Non-goals, Future cost, Applicable tests, Known pre-existing
issues, Tasks, Evidence, Progress log, Next, References) and a unit written in it
is never rewritten to migrate. `## Specs` replaces the four prose sections
because a requirement that quotes the requester is its objective, why, outcome
and acceptance criterion at once. The unit's path is decided by a triage
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

## Serena setup *(optional — filled by `init-workspace`; read by `review-change`)*

Serena is an opt-in LSP-powered navigation and diagnostics tool. When
provisioned via `/init-workspace`, it writes `.serena/project.yml`, registers
the MCP server, configures trust, and runs the health check.

**Symbol indexing is automatic on first setup** — `init-workspace` runs
`serena project index` during provisioning so the symbol cache is pre-built.
During normal usage Serena refreshes the index itself when files change.
**No git hooks or pre-commit triggers are needed.**

In rare cases where symbols disappear or diagnostics behave inconsistently,
run `serena project index` from the project root to rebuild the cache:

```sh
serena project index
```

LSP evidence (diagnostics, symbol lookups) is consumed by the workflow's review
axes as optional navigation aid — document verification (schema rules, required
sections, column counts) stays a deterministic script's job regardless.

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

- **Backward compatibility — `<declare: none | N-1 minor | …>`:** `<one line>
  saying what the project keeps alive and the mechanism that makes an old
  surface unnecessary — a project that declares `none` deletes a superseded
  surface in the change that supersedes it, and a copy of a published artifact
  (script, schema, helper, prose block) is never a compatibility shim>`. The
  review pack reads this line to decide whether an obsolete surface is deleted
  or kept; a blank line is an open question, never an assumed `none`.
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
registered in the `## Features` table of `docs/ROADMAP.md`. The lane flow:

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

**Review findings** persist to the unit's findings carrier: the unit doc's
`## Findings` section for a unit written in the `spec-by-reference` shape
(OPEN rows only — a folded row leaves the table and becomes a `## Log` line),
or `docs/features/<NN>-<slug>/review-findings.md` for a legacy unit (fixed
schema `| id | file:line | axis | severity | class | route | folded |`,
`folded` starting `no`). Probe the doc first and write to exactly one carrier;
never both.

## Fix workflow

Every NEW fix produces one `SPEC.md` under `docs/fix/<N>-<topic>/` (from
`docs/fix/_TEMPLATE/SPEC.md`), registered in the `## Fixes` table of
`docs/ROADMAP.md`. The flow:

1. **Unit doc** — create `docs/fix/<N>-<topic>/SPEC.md` from the template
2. **Triage** — the lane conductor returns a lightweight step list
   (typically: implement, evidence)
3. **Catalog steps** — each step runs as an atomic gate/commit via `execute-phase`
4. **Evidence** — verify the fix against each acceptance criterion
5. **Review** — independent review pass
6. **PR** — open with `Closes #N`; the fix's tracked issue auto-closes

**Review findings** persist to the same carrier rule as feature units — the unit
doc's `## Findings` for a `spec-by-reference` unit, `review-findings.md` for a
legacy one.

After merge: remove the row from `## Fixes` in `docs/ROADMAP.md`.

---

## Session log

`docs/LOGS.md` is an append-only journal of working sessions — the *why* and the
*what-next* that git history doesn't record. Two ways it's written, both
optional:

- **`/log-session`** (manual, rich) — summary, decisions, next step. Run it
  before `/clear` or before closing for the day. This works on every platform and
  is the fallback the workflow assumes.
- **A platform adapter** (automatic, free) — when your agent platform supports
  hooks, `/init-workspace` detects it and names the adapter in this line: append a
  mechanical entry on `/clear` and exit, and opt in to re-injecting the last entry
  when a session resumes. Declare the adapter you actually use, or delete this
  bullet and write a **manual log** — the scaffold never hard-wires one platform's
  directory, and a project without hooks is a supported project.

**Context hygiene rule:** end of a catalog step → `/log-session` then a NEW
conversation, never compact — compaction re-reads the whole transcript with
the current session model, right when the context is most expensive to
re-read; a fresh conversation is ~free because the unit SPEC.md's Evidence
and Progress log sections plus the session log already are the persistent
memory. Compact only mid-step, for unpersisted state you can't afford to
lose, and prefer committing WIP + updating the unit's Progress log instead.
Details: `docs/workflow/FEATURE_WORKFLOW.md` → *Context hygiene & cost*.

**Optional fragment carrier (opt-in, off by default):**
concurrent journal appends are the log's recurring merge conflict; the
fragment carrier removes it by construction. With `.agentic-workflow/journal/`
present, every writer produces one fragment file per entry and a
merge-to-main step (`agentic-workflow journal aggregate`, forge-free) is the
only writer of `docs/LOGS.md`. The naming grammar has one owner —
`journal-fragment-grammar@1` in `@gtrabanco/agentic-workflow`'s README; never
hand-roll it. Install is consent-gated via `/init-workspace`; without the
directory, direct append is the behaviour. Full contract:
`.agentic-workflow/journal.md`.

**The two memory surfaces are a recorded split, not a duplication.**
`docs/LOGS.md` (this section) is the journal that **travels with git** — written
for people, read by anyone who clones the repo. Engram holds the **local,
unit-keyed recall**: the lane saves each unit's goal, numbered acceptance
criteria, Evidence outcomes and discoveries under `unit/<NN-slug>/doc` at its
boundaries, so a fresh session recalls them without re-reading the docs.
Neither mirrors the other. Engram is required substrate but never a hard
dependency: the probe verdict, or a missed save, is recorded in the unit doc and
work continues. Two ceilings to respect — its recall is **keyword-bound** (a
miss is not evidence that nothing was saved), and the committed docs stay
authoritative over any memory record.

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
