# 13 — init-workspace-upgrade-mode

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`.
>
> **One SPEC, two halves.** The Product half was written from issue
> [#20](https://github.com/gtrabanco/agentic-workflow/issues/20) via
> `plan-feature-from-issue` (capability closure satisfied, `## Design status:
> designed`); the Engineering half by `plan-feature-scaffold`.

## Goal

Give `init-workspace` an **upgrade mode**: on a repo that already has the
agentic-workflow scaffold, detect what the *current* template adds that the
project's substrate is missing (new `CLAUDE.md` blocks, new conventions, new
roadmap statuses), read `docs/workflow/MIGRATION.md`, and propose **only the
new blocks** through a short, discovery-defaulted interview — **never clobbering
an existing decision**. Today, updating the installed skills migrates nothing on
the substrate side: `product-audit` *detects* drift but never fixes it, and
plain `init-workspace` is bootstrap-oriented (its existing-repo branch asks
merge/adapt/abort but has no notion of what is *new since the project's
version*). This closes that gap and documents the "after you update the skills,
migrate the substrate" path.

## Branch

`feat/13-init-workspace-upgrade-mode`

## Size

`M` — two phases. Single concern (skill wording + workflow docs), but large
enough for a phased plan: the new mode is a substantive addition to
`skills/init-workspace/SKILL.md`, plus a bilingual documented recommendation and
a hardening pass over the mode's failure edges. Not split further: the plan is
2 phases (≤ ~5), each touches one concern, and every design decision is resolved
in this SPEC / `decisions.md` — the mandatory-split triggers do not fire.

## Dependencies

Hard (named by issue #20 — "run AFTER U3/U4/U5 are merged, it migrates their
blocks"):

- **06** `design-feature` (U3) — `done`, merged (#24).
- **07** `roadmap-status-machine` (U4) — `done`, merged (#25). Its five-state
  roadmap column is one of the substrate blocks upgrade mode migrates.
- **08** `phase-economics` (U5) — `done`, merged (#26).

All three are merged, so the feature is startable. Soft: the blocks it diffs
also originate in features 01 (`Docs site`) and 02 (`Performance commands`),
both merged. No unmet dependency.

---

## Product half

Written by `plan-feature-from-issue` from issue #20.

### Context

`init-workspace` (v2.0.0) bootstraps a project's substrate: it fetches
`template/`, adapts `CLAUDE.md` + the `docs/` map + `.github/` templates by
interview, and offers to install the skills. Its Step 0 already detects an
existing `CLAUDE.md`/`docs/`/`.github/` and asks **merge / adapt-in-place /
abort** — but that branch is bootstrap-shaped: it has no model of *what the
current template contains that the project's older scaffold does not*.

Meanwhile the workflow evolves. Features 01–12 each added substrate the template
now carries but an existing install pre-dates: the `Docs site` block (01), the
`Performance commands` block (02), the five-state roadmap status machine (07),
the removal of the per-skill machine envelope (10), and so on. When a project
runs `npx skills add …` to update the *behavior* (the skills), **nothing
migrates the *substrate*** (its `CLAUDE.md`/docs). `product-audit` flags the
drift ("your roadmap has three statuses, the current one has five") but its
contract is proposes-only — it never writes the fix. The gap was confirmed in
the 2026-07-09 design session (issue #20, U10). U10 is deliberately late: it
migrates blocks earlier units introduce, so doing it sooner means redoing it.

### Business goals

Keep the "way of working" upgradeable, not just installable. A team that adopted
the workflow at feature 03 and updates their skills at feature 13 must be able to
bring their substrate forward without hand-diffing the template — otherwise the
skills reference blocks (`Docs site`, five-state roadmap) their `CLAUDE.md` never
grew, and the workflow silently degrades. Internal/tooling feature — no external
business surface.

### Scope

#### In scope

- A new **upgrade mode** in `skills/init-workspace/SKILL.md`, entered when Step 0
  finds an **existing agentic-workflow scaffold** (not a bare/foreign repo):
  - **Diff** the project's `CLAUDE.md` + `docs/` substrate against the **current**
    `template/` — detect blocks/conventions the template has and the project
    lacks (e.g. `Docs site`, `Performance commands`, the five-state roadmap
    legend, `Git workflow` line, any block a later feature added).
  - **Read `docs/workflow/MIGRATION.md`** to enrich the diff with the human
    rationale/notes for each new block (what changed, why, what to migrate).
  - **Propose only the new blocks** via a **short interview** — one batched round,
    each proposal carrying a **discovery-based default** (same detection
    `init-workspace` already does: Starlight → `Docs site` default, Biome →
    complexity-lint default, etc.). The user accepts/edits/skips per block.
  - **Never clobber an existing decision** — upgrade mode only **adds** blocks the
    project lacks and **fills** blocks left as raw placeholders; it never rewrites
    a block the project already tailored, and never deletes.
- A **documented recommendation** (bilingual, per docs-language rule) in
  `README.md` + `README.es.md` **and** `docs/workflow/MIGRATION.md`: after
  updating the skills in an existing project → read `MIGRATION.md` → run
  `init-workspace` (upgrade mode) to migrate the substrate → optionally
  `product-audit` to see which newly-available capabilities apply to the code.
- Version/bookkeeping via `bump-skill` (init-workspace bump + both CHANGELOGs +
  both README skill tables).

#### Out of scope / non-goals

- **Rewriting or deleting existing, tailored blocks** — upgrade mode is additive
  only. A block the project already filled is never touched. (Owner: none — a
  genuine re-tailor is a fresh `init-workspace` adapt run the user asks for.)
- **Auto-applying anything without a yes** — every proposed block is confirmed,
  same guardrail as bootstrap mode. (Owner: this feature's guardrails.)
- **Migrating the *skills* / behavior** — that is `npx skills add …` +
  `PORTABLE_PROMPT.md`; upgrade mode migrates the **substrate** (docs) only.
- **Fixing code-level drift** — which review axes/skills now apply to the
  codebase is `product-audit`'s proposes-only job, not this. Upgrade mode points
  at it, does not do it.
- **A `template/` mirror of upgrade-mode logic** — the logic lives in the skill;
  `template/` only receives the new documented recommendation where the workflow
  docs are mirrored (n/a — `README`/`MIGRATION` are repo-level, not templated).
- **CI enforcement** — none; this is skill wording + docs, consistent with the
  repo's "no application build" verification model.

### Capability closure

The feature introduces no runtime entities (this repo ships skills + docs, no
app). The migrated unit is a **substrate block** (a `CLAUDE.md`/docs section the
current template carries). Closure is filled against that, with honest `n/a` for
inapplicable CRUD.

```markdown
Entity: substrate block (a template CLAUDE.md/docs section the project may lack)
- [x] Create (propose + add a missing block) — UI entry: init-workspace upgrade-mode
      interview (one batched round, discovery-defaulted) · API: n/a (skill, no API surface)
      · test: `grep` the upgrade-mode "propose only missing blocks" contract in SKILL.md
      (P1 acceptance) + golden-style manual read
- [x] Read/list (detect which blocks are missing) — UI: upgrade-mode report
      ("blocks the current template adds that your substrate lacks: …", sourced from
      the template diff + MIGRATION.md) · API: n/a · test: `grep` the "diff project
      substrate against current template + read MIGRATION.md" contract in SKILL.md
- [x] Update — n/a: upgrade mode is additive; it fills raw placeholders and adds
      missing blocks, but NEVER rewrites a block the project already tailored
      (never-clobber guardrail — this is the primary invariant, tested by P2 hardening)
- [x] Delete — n/a: upgrade mode never removes a block or convention
- [x] State transitions — n/a: a block is present or absent; there is no lifecycle

Capability: run init-workspace on an already-scaffolded repo (upgrade)
- [x] Visible entry point: `init-workspace` (or `init-workspace <dir>`) — Step 0
      detects the existing scaffold and branches into upgrade mode instead of bootstrap
- [x] Who may execute it (ACL): n/a — local developer tool, no auth/roles; whoever
      runs the agent runs it (same as bootstrap mode)

Role / permission: n/a — no roles introduced (local tooling)
```

### Acceptance criteria

Command-checkable where possible (run from repo root; `[✓]` = must pass):

- `grep -qi "upgrade mode" skills/init-workspace/SKILL.md` — the mode exists.
- `grep -qi "MIGRATION.md" skills/init-workspace/SKILL.md` — the mode reads it.
- Upgrade mode's SKILL.md text states all four: **diff against current template**,
  **read MIGRATION.md**, **propose only missing blocks (discovery-defaulted, short
  interview)**, **never clobber existing decisions** — `read-verified` against the
  new section.
- `grep -q "init-workspace" README.md && grep -q "init-workspace" README.es.md` —
  the documented recommendation is present in both READMEs.
- The recommendation names the ordered path **update skills → read MIGRATION.md →
  init-workspace (upgrade) → optional product-audit** in `README.md`,
  `README.es.md`, and `docs/workflow/MIGRATION.md` — `read-verified`.
- `grep -q "^name: init-workspace" skills/init-workspace/SKILL.md` and its
  `version:` is bumped above `2.0.0`; a matching row exists in `CHANGELOG.md` and
  `CHANGELOG.es.md` — `read-verified` (produced by `bump-skill`).
- Never-clobber hardening: SKILL.md states the no-drift, missing-`MIGRATION.md`,
  and conflicting-existing-decision edges explicitly — `read-verified` (P2).
- PR body contains `Closes #20`.

### Tooling

- **`bump-skill`** (internal repo skill) — mandatory after the `init-workspace`
  edit: bumps `version:`, writes CHANGELOG rows (EN/ES) and README skill-table
  rows (EN/ES). Not optional in this repo.
- No MCP servers apply. `init-workspace` is not on the golden-fixture
  executor-path list (`execute-phase`, `plan-*`, `design-feature`, `review-*`),
  so `GOLDEN_FIXTURE.md` is **not** a required gate here — a manual read of the
  new mode against a toy "existing scaffold missing the Docs site block" case is
  the informal check.

### Product decisions

- **Additive-only, never clobber** (chosen). Upgrade mode adds missing blocks and
  fills raw placeholders; it never rewrites a tailored block. Rationale: an
  upgrade must be safe to run on a heavily-customized substrate; a re-tailor is a
  separate, explicitly-requested bootstrap-style run.
- **Detect scaffold ⇒ upgrade, else bootstrap** (chosen). The mode is selected by
  Step 0 detection (existing agentic-workflow scaffold present), not a flag —
  keeps one door, matching the skill's "adaptive counterpart to a raw copy"
  framing. A `--upgrade` override may be added later if detection proves
  ambiguous (deferred, see `decisions.md`).

## Design status

`designed` — capability closure complete (filled rows + explicit `n/a` with
reasons); acceptance criteria emitted as commands where checkable. Written from
issue #20 by `plan-feature-from-issue`.

---

## Engineering half

Written by `plan-feature-scaffold`.

### Technical goals

- Add a **second mode** to `init-workspace` without forking the skill: Step 0
  detection routes an existing-scaffold repo into an **upgrade** branch that
  reuses the same discovery + interview machinery, scoped to *only the missing
  blocks*.
- Keep the change **wording-only** — no new tooling, no code, no CI. The skill is
  a `SKILL.md`; the deliverable is precise, weak-model-proof instructions plus
  the documented recommendation.
- Preserve every existing guardrail (never overwrite without consent; honest
  placeholders; don't touch the default branch) and add one invariant:
  **additive-only, never clobber a tailored block**.

### Architecture impact

- Touches only `skills/init-workspace/SKILL.md` (behavior spec) and repo-level
  docs (`README.md`, `README.es.md`, `docs/workflow/MIGRATION.md`) + the
  `bump-skill` bookkeeping targets (`CHANGELOG*.md`, README skill tables).
- **No `template/` change** — the upgrade logic lives in the skill, and the
  documented recommendation targets repo-level READMEs + workflow MIGRATION,
  which are not part of the exported `template/` scaffold. Invariant:
  **docs/wording-only; stack/architecture-agnostic phrasing** (no product, stack,
  or framework references leak into the skill).
- Version invariant: any `SKILL.md` edit ⇒ `bump-skill` in the same PR (repo
  rule). Bump tier: **minor** — additive, backward-compatible capability (a new
  mode; bootstrap behavior byte-unchanged).

### Design

**Mode selection (Step 0).** Extend the existing existing-scaffold detection:
when the target already contains an **agentic-workflow scaffold** — heuristic:
`CLAUDE.md` present *and* a `docs/features/ROADMAP.md` or `docs/workflow/`
(workflow markers) — offer **upgrade** as the default action alongside the
existing merge/adapt/abort. A bare repo, or a repo with a foreign `CLAUDE.md`
and no workflow markers, stays in **bootstrap**.

**Upgrade process (new section in the skill body):**

1. **Locate the current template.** Fetch the current `template/` (same
   `npx degit gtrabanco/agentic-workflow/template` into a temp dir; SSH/local-path
   variant for a private source — reuse the bootstrap note verbatim).
2. **Diff the substrate.** Compare the project's `CLAUDE.md` (and the `docs/`
   blocks the map references) against the temp template. Produce a list of
   **blocks/conventions present in the template, absent (or still a raw
   placeholder) in the project** — e.g. `Docs site`, `Performance commands`,
   `Git workflow` line, the five-state roadmap `Status legend`. This is the
   Read/list surface.
3. **Read `docs/workflow/MIGRATION.md`.** For each missing block, pull the dated
   migration note's rationale so the proposal explains *why* the block exists and
   *what* it migrates. If `MIGRATION.md` is absent (older install), proceed on the
   template diff alone and note that rationale was unavailable.
4. **Propose only the missing blocks — short interview.** One batched round; each
   item = the block + a **discovery-based default** (reuse bootstrap's detection:
   `astro.config` + Starlight ⇒ `Docs site` default; Biome ⇒ complexity-lint slot;
   remote URL ⇒ forge; etc.) + the `MIGRATION.md` rationale. The user
   accepts/edits/skips per block. **Never re-ask what the project already
   answered** — a filled block is skipped, not re-interviewed.
5. **Write additively.** Insert accepted blocks; fill raw placeholders with
   confirmed values. **Never rewrite a block the project already tailored; never
   delete.** Leave honest placeholders where the user skipped. List residuals.
6. **Report + hand off.** Summarize blocks added/filled/skipped and print the
   recommendation tail (`product-audit` to see which new *capabilities* apply).

**Documented recommendation (README EN/ES + MIGRATION.md):** a short "Updating an
existing install" note stating the ordered path: `npx skills add …` (behavior) →
read `docs/workflow/MIGRATION.md` → `init-workspace` upgrade (substrate) →
optional `product-audit` (which new capabilities apply to the code).

### Decisions to confirm

All resolved (see `decisions.md`): mode-by-detection vs. flag (detection, with a
deferred `--upgrade` escape hatch); additive-only semantics; bump tier = minor;
no `template/` change; `MIGRATION.md`-absent fallback = proceed on diff + note.

### Testing requirements

Docs/wording feature in a repo with **no application build** — "green" is the
repo's doc-coherence bar, not a test suite. Verification layers:

- **Command-checkable acceptance** (the `grep`s in Acceptance criteria) — run
  locally; each is a phase task, not prose.
- **`read-verified`** — the four-part upgrade contract, the never-clobber
  invariant, the bilingual recommendation wording, and the `bump-skill` output
  are confirmed by reading, labelled `read-verified` in `testing.md`.
- **Coherence gate** — `audit-docs` after the change: roadmap ↔ folder ↔ docs
  links resolve; no stack/real-project reference leaked; naming conventions held.
- **Informal manual read** — walk the new mode against a toy "existing scaffold
  missing the `Docs site` block" case (not a committed fixture); confirm it
  proposes only that block, defaults from discovery, and clobbers nothing.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `init:upgrade-happy` | scaffold present, missing `Docs site` block | Step 0 detects scaffold → upgrade → proposes only the missing block |
| `init:no-drift` | scaffold already current | diff finds nothing → report "substrate current, nothing to migrate" |
| `init:no-migration` | old install, no `docs/workflow/MIGRATION.md` | diff-only proposal + note that rationale was unavailable |
| `init:tailored-block` | project already customized a block the template also changed | never-clobber: the tailored block is left untouched, listed as residual |
| `init:bootstrap-unchanged` | bare/foreign repo | detection routes to bootstrap; upgrade never engages |

Prose scenarios (no runnable dev harness in this repo) — each reached by the
existing Step 0 detection branch driven with a hand-made toy target dir.

### Phases

`P1, P2` — see `PLAN.md`. `P1` = upgrade mode in the skill body (and commits the
planning artifacts). `P2` = documented recommendation + hardening (the failure
edges above) + `bump-skill` + PR. `P2` is the hardening phase.

### Deploy & rollback

n/a — merging is enough. No migration, flag, or config. Rollback = revert the PR
(docs-only).

### Open questions / risks

- **Detection false-negative** (a real scaffold not recognized) → user falls back
  to bootstrap merge/adapt, no data loss. Mitigated by a broad marker heuristic;
  a `--upgrade` override is the deferred escape hatch (`decisions.md`).
- **`MIGRATION.md` drift** — if a block lacks a migration note, the proposal loses
  its rationale but still surfaces the block (diff-sourced). Acceptable.

### Deliverables

- `skills/init-workspace/SKILL.md` — upgrade mode + never-clobber invariant
  (minor bump).
- `README.md`, `README.es.md`, `docs/workflow/MIGRATION.md` — the documented
  "updating an existing install" recommendation.
- `CHANGELOG.md`, `CHANGELOG.es.md`, both README skill tables — via `bump-skill`.
- `docs/features/13-init-workspace-upgrade-mode/` — this planning set.
- Roadmap row 13 → `done · [#PR]` on PR open.

### Post-merge next feature

**U11 / issue #21** — "Final docs batch" (model tables, pipeline diagrams,
SKILLS.md counts, MIGRATION) — deliberately last, after this substrate-migration
unit. See `docs/features/ROADMAP.md`.
