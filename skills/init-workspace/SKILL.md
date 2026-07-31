---
name: init-workspace
user-invocable: true
version: 2.6.0
argument-hint: <target-dir>
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Bootstrap a project's way of working: fetch the agentic-workflow documentation
  scaffold (template/) and adapt it to THIS project by interview — fill the
  CLAUDE.md documentation map, gate commands and architecture, prune doc folders
  that don't apply, keep the SPEC/feature/fix and GitHub templates — then offer to
  install the skills. The adaptive counterpart to a raw `npx degit` copy. On a repo
  that already has the scaffold, detects it and switches to **upgrade mode**: diffs
  the project's substrate against the current template, reads
  `docs/workflow/MIGRATION.md`, and proposes only the blocks the project is
  missing — never clobbering a tailored one. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers:
  "set up the agentic workflow here", "init-workspace", "scaffold this project's
  docs", "adapt the workflow template to this repo", "bootstrap the way of working",
  "upgrade my scaffold", "migrate my substrate to the current template", "bring my
  CLAUDE.md up to date with the template".
---

# Init Workspace

Turn an empty or existing repo into one that works with the agentic workflow:
copy the generic scaffold, then **tailor it to this project** instead of leaving
raw placeholders.

## Turn contract — verify before ending the turn

```
✓ The adapted scaffold and repository-state ledger are written (or the merge/abort decision was asked) and remaining placeholders are listed
✓ Nothing was installed or overwritten without an explicit yes
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## When to use

- Setting up a repo to use these skills and you want the documentation substrate
  (`CLAUDE.md` + `docs/` map + templates) adapted to the project, not just copied.
- Prefer this over a static `npx degit gtrabanco/agentic-workflow/template` when you
  want the gate commands, architecture, and doc domains filled in by interview.

## Step 0 — Discover the project (always first)

Inspect the target dir (`[target-dir]`, default cwd) before touching anything:

- Existing `CLAUDE.md` / `AGENTS.md` / `docs/` / `.github/`? If so, **do not
  clobber** — check first whether it's an **agentic-workflow scaffold**
  (marker: `CLAUDE.md` present *and* either `docs/features/ROADMAP.md` or a
  `docs/workflow/` dir). If both markers are present, offer **upgrade** as the
  default action, alongside merge / adapt-in-place / abort — see **Upgrade
  mode** below. If `CLAUDE.md`/`docs/` exist but the markers are absent (a
  foreign scaffold), stay in bootstrap and ask merge / adapt in place / abort
  as before.
- Detect the stack from manifests (`package.json`, `pyproject.toml`, `go.mod`,
  `Cargo.toml`, `Gemfile`, …) to *propose* gate commands and naming conventions.
- Note the git state (is it a repo, what's the default branch, and the **remote
  URL → forge**: github.com → GitHub/`gh`, gitlab → GitLab/`glab`, else ask).

## Process

1. **Preflight.** Confirm the target dir and the discovery findings. If scaffold
   files already exist, get an explicit decision before overwriting.
2. **Fetch the template.** `npx degit gtrabanco/agentic-workflow/template <dir>`
   (into the target if empty, else a temp dir to merge from). **`degit` can't read
   a private repo — it fails, or in `--mode=git` silently leaves an empty dir; for
   a private source, `git clone` via SSH and copy the `template/` subtree instead.**
3. **Interview to adapt** — small batched rounds, each with a recommended default
   drawn from Step 0; skip whatever discovery already answers:
   - **Project** — name + one-line purpose.
   - **Gate** — dev / build / test commands and the verification gate (proposed
     from the detected stack; confirm).
   - **Forge** — issue/PR tracker + CLI (proposed from the remote URL; confirm)
     → recorded in the Workflow conventions **Forge** line.
   - **Git workflow** — how parallel work is handled: **branches** (default —
     one active unit at a time, sequential, plain `git switch -c`) or
     **worktrees** (parallel units in separate checkouts; only if the user's
     agent/tooling manages them). Recorded in the Workflow conventions
     **Git workflow** line; every skill that creates branches honors it.
   - **Docs language.**
   - **Architecture** — pattern, layers/modules, and dependency-direction rules
     (stay architecture-agnostic; record the user's choice in `ARCHITECTURE.md`).
   - **Doc domains** — which of `providers/ brand/ domain/ business/
     infrastructure/ legal/ frontend/` apply. **Delete the folders that don't**
     (e.g. `frontend/` for a non-UI project).
   - **Capability inventory** (`docs/CAPABILITIES.md` — the substrate
     `design-feature`'s Integration closure walks). Seed it from discovery,
     not raw placeholders: on an existing codebase, propose the roles and the
     `yes|no|partial` state of each template subsystem row (auth, ACL,
     navigation, notifications, search, audit, settings, jobs, storage, i18n,
     flags, billing, public API) from what the code actually shows; on an
     empty repo, walk the same fixed rows with the user (`no` is a valid,
     load-bearing answer). Delete rows that can never apply to this product;
     confirm the result in one round — never leave the file as the raw
     template.
   - **Performance tooling** — detect what the stack offers, one slot at a
     time (fixed checklist, first match per slot; record `none` explicitly
     when nothing fits — never leave the slot undiscussed):
     - *Static complexity lint*: Biome present → enable its `complexity`
       group (incl. `noExcessiveCognitiveComplexity`); ESLint present →
       suggest `eslint-plugin-sonarjs` + `eslint-plugin-unicorn`; neither →
       ask for the stack's equivalent or record `none`.
     - *Benchmark harness*: Vitest → `vitest bench`; Bun runtime → `mitata`;
       Node → `tinybench`/`mitata`; other stacks → ask for the project's
       benchmark command or record `none`.
     - *Profiler*: Node → `node --cpu-prof` (zero-dependency default) or `0x`
       via the project's package runner; Bun → `bun --inspect` CPU profiling;
       other → ask or record `none`.
     (The named tools are the TS/JS **adapter examples**; the contract is the
     generic block below.) Offer installation — **the user confirms each
     dependency; never install silently** — and register the outcome in the
     template's `Performance commands` block next to the verification gate,
     so `review-perf` can measure instead of guess.
   - **Docs site** — does the project have (or want) a developer docs website
     the `generate-docs` skill can write into? If yes, fill the template's
     `Docs site` block in `CLAUDE.md` (format: starlight/docusaurus/markdown,
     content dir, build command, optional knowledge-map command — proposed
     from discovery: an `astro.config.*` + `@astrojs/starlight` dependency
     means Starlight). If no, leave the block commented out — `generate-docs`
     then reports NOT-CONFIGURED instead of guessing. Never scaffold the
     website itself.
   - **Naming conventions** and **MCP servers**, if any.
4. **Write the adapted scaffold.** Fill the `CLAUDE.md` placeholders (commands,
   the documentation map rows, architecture); keep `AGENTS.md`, the
   `features/_TEMPLATE` + `ROADMAP`, the `fix/_TEMPLATE` + `README`, and the
   `.github/` templates; prune unused doc folders and map rows. Leave honest
   placeholders where the user hasn't decided — never invent values.
5. **Seed Normalized Repository State.** Copy
   `template/docs/workflow/REPOSITORY_STATE.md` to
   `docs/workflow/REPOSITORY_STATE.md` when it is absent. If the target already
   has one, leave it unchanged and report that discovery should refresh it.
   Explain that discovery freezes evidence before planning and only
   `resolve-repository-state` updates frozen facts.
6. **Offer architectural invariants.** Keep
   `docs/architecture/ARCHITECTURAL_INVARIANTS.md` from the template only when
   the project has long-lived architectural constraints. Explain that it is
   optional: an absent document means no project invariants are declared, not
   that the scaffold failed. If retained, add its documentation-map row and
   name the project's explicit architectural-decision authority.
7. **Offer the workflow skills.** Propose installing them:
   `npx skills add gtrabanco/agentic-workflow` (note the SSH/local-path variant if
   the source is private). Don't install without a yes.
8. **State that reviews are self-contained; offer optional extras.** The
   workflow ships its **own internal review pack** (`review-code`,
   `review-security`, `review-verify`, `review-debt`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — it installs
   with the skills and covers every review axis, so **no external review skill
   is required on any agent**. If the user wants platform-specific extras (a
   framework skill, a stack-specific security skill), record them in `CLAUDE.md`
   under a short "Optional review extras" note so `review-change` and
   `product-audit` run them **in addition** — never as a dependency. Don't
   install anything without a yes.
9. **Seed the urgency labels (feature 15, injection-safe urgency).** Create the
   two capability-gated GitHub labels `triage-issue` owns and applies
   (`skills/triage-issue/SKILL.md` is the sole owner of the name/color
   vocabulary — this step only seeds it, never redefines it):
   `gh label create urgent --color B60205 --description "Evaluate for
   interrupt-now — reaches the pause-vs-finish judge"` and
   `gh label create fix-next --color D93F0B --description "Head of the fix
   queue — never interrupts the in-flight unit"`. Create-if-missing: an
   "already exists" error from `gh label create` is treated as success, not a
   failure. Requires the forge remote/auth Step 0 already detected — if the
   forge is unavailable or the user declines forge setup, skip this step and
   list the two labels as a residual for the user to create manually later
   (never fail the whole scaffold on it).
10. **Report.** List what was created, which placeholders still need human input,
   the companion skills recorded/installed, the urgency labels seeded (or
   skipped, with reason), and the next step: `discover-repository-state` →
   `design-feature` → `plan-feature` → `execute-phase`.

## Upgrade mode

Entered when Step 0 finds an existing **agentic-workflow scaffold** (not a
bare or foreign repo). Bootstrap mode (the Process section above) never
engages here — upgrade mode reuses the same discovery + interview machinery,
scoped to **only the blocks the current template has that this project
lacks**. Seven ordered steps:

1. **Locate the current template.** Fetch the current `template/` the same
   way bootstrap does — `npx degit gtrabanco/agentic-workflow/template <temp-dir>`
   (always into a temp dir here, never into the target); the SSH/local-path
   variant applies verbatim for a private source.
2. **Diff the substrate.** Compare the project's `CLAUDE.md` (and the `docs/`
   blocks its documentation map references) against the fetched template.
   Produce the list of blocks/conventions the template carries that this
   project's substrate lacks, or still holds as a raw, unfilled placeholder —
   e.g. a `Docs site` block, a `Performance commands` block, a `Git workflow`
   line, the five-state roadmap `Status legend`, the capability inventory
   (`docs/CAPABILITIES.md` + its documentation-map row), the optional
   architectural-invariants document
   (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` + its documentation-map
   row), or the Normalized
   Repository State ledger (`docs/workflow/REPOSITORY_STATE.md`). This is the
   diff-against-current-template contract; it is the only source of *what's
   new*. (A missing `docs/CAPABILITIES.md` is proposed with the same
   discovery-seeded defaults bootstrap's interview uses — never as the raw
   template. A missing repository-state ledger is proposed from the template
   without overwriting any existing ledger.)
3. **Read `docs/workflow/MIGRATION.md`.** For each missing block, pull its
   dated migration note so the proposal explains *why* the block exists and
   *what* it migrates. If `MIGRATION.md` is absent, proceed on the template
   diff alone and say so in the report — never block on a missing note.
4. **Propose only the missing blocks — one short, batched interview round.**
   Each item is the block, a discovery-based default (the same detection
   bootstrap mode already runs — e.g. `astro.config.*` + Starlight ⇒ `Docs
   site` default, Biome ⇒ the complexity-lint slot, the remote URL ⇒ forge),
   and the `MIGRATION.md` rationale when available. The user accepts, edits,
   or skips each block. **Never re-ask what the project already answered** —
   a block that's already filled is skipped, not re-interviewed.
5. **Write additively.** Insert accepted blocks, including a missing
   `docs/workflow/REPOSITORY_STATE.md`; fill raw, still-placeholder
   blocks with the confirmed values. **Never rewrite a block the project has
   already tailored, and never delete anything** — a tailored block the
   template also changed is left untouched and listed as a residual, not
   silently updated. Leave honest placeholders where the user skipped.
6. **Seed missing urgency labels, additively (feature 15).** Independent of
   the `CLAUDE.md`/`docs/` block diff above (this is forge-repo state, not a
   doc block): check whether the target repo already has the `urgent` and
   `fix-next` labels (`gh label list`); create whichever is missing with the
   same `gh label create` calls bootstrap mode uses (see Process step 9) —
   never touch a label that already exists (additive-only, same never-clobber
   rule as the doc blocks; a pre-existing `urgent`/`fix-next` label the
   project recolored or redescribed is left exactly as-is).
7. **Report + hand off.** Summarize blocks added, filled, and skipped
   (residuals), the urgency labels seeded (or already present), then print the
   recommendation to run `product-audit` next to see which newly-available
   *capabilities* apply to the code (upgrade mode migrates the substrate only,
   never the code).

**Failure edges — handle each explicitly, never silently:**

- **No drift.** The diff (step 2) finds nothing missing or placeholder-only →
  skip the interview entirely and report **"substrate current, nothing to
  migrate"**. Never fabricate a block to propose just to have something to
  show.
- **`MIGRATION.md` absent.** An older install may predate this file → proceed
  on the template diff alone (step 3 already covers this) and say so plainly
  in the proposal and the final report: rationale was unavailable, the block
  list is still complete.
- **A block the project already tailored.** If the current template also
  changed a block the project customized, **do not merge, diff-patch, or
  overwrite it** — leave it exactly as the project has it and list it as a
  residual in the report (step 5's never-clobber invariant). The user decides
  separately, via an explicit bootstrap adapt-in-place run, whether to
  re-tailor it.
- **Bootstrap stays unchanged on a bare or foreign repo.** If Step 0's
  scaffold markers (`CLAUDE.md` + `docs/features/ROADMAP.md` or
  `docs/workflow/`) are absent — no repo, an empty repo, or a `CLAUDE.md`
  that isn't this workflow's — upgrade mode never engages; the existing
  bootstrap Process (merge/adapt/abort) runs exactly as before this mode was
  added.

## Guardrails

- **Never overwrite an existing `CLAUDE.md` or `docs/` without explicit consent.**
- **Additive-only, never clobber (upgrade mode).** Upgrade mode only adds
  blocks the project lacks and fills raw placeholders — it never rewrites or
  deletes a block the project already tailored, even if the current template
  changed that block too. A genuine re-tailor is a separate, explicitly
  requested bootstrap adapt-in-place run, never something upgrade mode does
  on its own. **The urgency label seeding is additive-only the same way:**
  create a missing `urgent`/`fix-next` label, never touch one that already
  exists (name, color, or description a project already customized).
- **Never redefine the urgency label vocabulary here.** `skills/triage-issue
  /SKILL.md` is the sole owner of the `urgent`/`fix-next` names, colors, and
  apply rules — this skill only seeds those two labels into the repo; it never
  invents a third label or changes what the two mean.
- Docs-only scaffolding; no app code, no dependencies installed unprompted.
- Architecture-agnostic: record the project's pattern, don't impose one.
- Honest placeholders over invented specifics; flag what's left to fill.
- Honor the project's **Workflow conventions** once present; on an existing repo,
  don't work on its default branch and never commit/push unless asked.

## Normalized Repository State

Seed `docs/workflow/REPOSITORY_STATE.md` from the template. Explain that
discovery freezes evidence before planning and only the resolver updates facts.

## Architectural invariants

Offer `docs/architecture/ARCHITECTURAL_INVARIANTS.md` as an optional project
contract for long-lived architectural rules. Its entries must name a stable ID,
repository evidence, and the authority that can change the rule. Do not infer a
rule from the implementation or a feature SPEC. A project without this document
remains compatible; record `n/a: no project invariants declared` in later
workflow artifacts rather than creating one silently.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  the interview and adaptation are judgment work — run them on your
  **strongest** model.
- **No Claude Code hooks** — the template's `.claude/` auto-logging hooks are
  Claude Code-specific; on other agents skip that offer and note that
  `log-session` is the manual alternative.

## Relationship to other skills

- `npx degit gtrabanco/agentic-workflow/template` — the static copy this skill
  adapts. Use that when you want the raw scaffold and will fill it yourself.
- `docs/workflow/PORTABLE_PROMPT.md` — regenerates the **skills** adapted to a
  project (behavior). This skill adapts the **substrate** (docs). Complementary.
- After init: `discover-repository-state` → `design-feature` → `plan-feature` →
  `execute-phase`; run `audit-docs` to confirm the scaffold is coherent.

## Done when

- A tailored `CLAUDE.md` + `docs/` scaffold + `.github/` templates exist in the
  target, unused folders pruned, residual placeholders flagged, the platform's
  companion review skills are recorded (and offered), and the `urgent`/
  `fix-next` labels are seeded (scaffold) or additively reconciled (upgrade) —
  or explicitly listed as a residual when the forge was unavailable.
- **The closing `→ Next:` block is printed** (plus the offer to install the skills):

  ```
  → Next: /discover-repository-state — freeze repository evidence before planning
    · raw idea → /design-feature "<idea>" after discovery
    · next roadmap entry → /plan-feature --next after discovery
    · confirm the scaffold is coherent → /audit-docs
  ```
