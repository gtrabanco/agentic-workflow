---
name: plan-feature
user-invocable: true
version: 3.3.0
argument-hint: <NN-slug | #N> | --from-issue N | --scaffold <slug> | --next
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Engineering-planning router for an already-designed feature. Given a feature
  whose SPEC product half is not marked `designed`, STOPS and redirects to
  `/design-feature <slug>` — no bypass flag. Given a designed feature, a GitHub
  issue #N (issue → scoped product half, satisfying capability closure), or an
  already-scoped slug/SPEC (straight to engineering-half scaffolding), routes
  to the right internal step, then ensures the roadmap entry and prints the
  next step. Force a path with flags to skip detection; `--next` plans the
  next `defined` feature from the roadmap. On Claude Code and want hand-tuned per-skill model/effort tiers? Install the `#claude` branch instead (`npx skills add gtrabanco/agentic-workflow#claude`) — see the README. This branch is model-agnostic: the skill inherits whatever model and effort your agent session is already using.
  Triggers: "plan a
  feature", "plan the feature from issue N", "plan the next roadmap feature",
  "scaffold feature NN", "create SPEC and TASKS for NN".
---

# Plan Feature (router)

The engineering-planning door for a feature whose product definition already
exists. Routes to a focused internal step so only the work you need runs (no
fat single skill). **Docs only — no code, no branch.** Product definition
(raw-idea interview, capability closure) is `design-feature`'s job, not this
one — see the redirect gate below.

## Turn contract — verify before ending the turn

```
✓ The redirect gate ran FIRST, before any SPEC edit: undesigned input → STOP,
  print the fixed `/design-feature <slug>` block, do nothing else this turn
✓ Designed input only: engineering half filled, artifacts written, and the
  roadmap entry registered (number, order, deps verified)
✓ If `plan-feature-scaffold` ran this turn: the roadmap row was re-read
  AFTER the write and literally reads `planned` — a dropped `defined→planned`
  write fails this box; do not end the turn until it's fixed
✓ The dependency & blocker check was RUN and its result decides which closing block is printed
✓ Artifact language: explicit user instruction > the project's declared docs language > English. The CONVERSATION language never decides — a Spanish prompt still produces English PRs/issues/commits/SPECs unless one of the first two says otherwise
✓ The closing `→ Next:` block is printed as the ABSOLUTE last output
```

About to end the turn with any box unchecked? The turn is NOT done — complete
the missing box first (weak models drop end-of-document duties; this list is
first on purpose).

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then read
what THIS skill needs: the **roadmap** (`docs/features/ROADMAP.md`), so routing
and roadmap registration match the project's real layout.

## Redirect gate (always, before routing)

Before any other step, resolve the target slug/issue and read **the roadmap
status** (`docs/features/ROADMAP.md` → the five-state machine
`idea/defined/planned/in-progress/done`) — the **primary** gate signal. The
SPEC's `## Design status` marker is the SPEC-local record and the
**legacy-compat fallback** only (see step 6 below), never the primary check:

1. **Roadmap row status `defined`** → proceed to Routing below (the product
   half is designed; the engineering half still needs scaffolding).
2. **Roadmap row status `planned`** (SPEC + artifacts already present) →
   **STOP**. Never invoke `plan-feature-scaffold` — re-scaffolding an
   already-planned feature is the re-plan-loop bug this gate exists to close.
   Print exactly:

   ```
   → Next: /execute-phase <NN> P1 — this feature is already planned; start
     implementation, don't re-plan it.
   ```
3. **Roadmap row status `in-progress`** → **STOP**. Print exactly:

   ```
   → Next: /execute-phase <NN> <next-phase> — this feature is already being
     implemented; resume the current phase, don't re-plan it.
   ```
4. **Roadmap row status `done`** → **STOP**. Print exactly:

   ```
   → Next: nothing — <NN>-<slug> already shipped (roadmap status `done`).
   ```
5. **Roadmap row status `idea`, or no row at all** → **STOP**. Print exactly:

   ```
   → Next: /design-feature <slug> — this feature has no completed product design yet
     (capability closure not done). Design it first; then re-run /plan-feature <slug>.
   ```

   No bypass flag exists for this gate — an undesigned feature is never
   planned by this skill, under any flag or instruction.
6. **Legacy compat.** A roadmap row still reading a plain `planned` with no
   five-state history (predates this repo's roadmap-status-machine feature):
   fall back to the SPEC marker — `## Design status: designed` and Capability
   closure filled → treat as `defined`+`planned`, STOP per step 2 above (a
   legacy `planned` row is still already-planned — hand off to
   `/execute-phase`, never re-scaffold). Marker missing/`not designed`/closure
   empty → treat as `idea`, STOP per step 5. See `docs/workflow/MIGRATION.md`.
7. **A raw idea with no slug at all** (nothing to check) → the same STOP
   applies: print the block above pointing at `/design-feature "<idea>"`
   instead of a slug.

## Routing

Once the gate passes, pick the mode — first match wins:

1. **Flag forces it** (skip detection): `--from-issue <N>`, `--scaffold <slug>`,
   `--next`.
2. **Issue** — an issue number or issue URL → `plan-feature-from-issue`.
3. **Scoped** — an existing, designed roadmap slug or a filled `SPEC.md` →
   `plan-feature-scaffold`.
4. **`--next` / no input** — read the roadmap, take the next `defined` entry
   (the units that still need engineering planning — a `planned` row is
   already scaffolded); apply the redirect gate to it, then scaffold.
5. **Ambiguous** — ask one question, then route.

### Example (routing)

| You run | Detected | Routes to | Then |
|---|---|---|---|
| `plan-feature 14-csv-export` (not designed) | undesigned slug | — | STOP → `/design-feature 14-csv-export` |
| `plan-feature 131` | issue #131 | `plan-feature-from-issue` → `plan-feature-scaffold` | PR carries `Closes #131` |
| `plan-feature 14-csv-export` (designed, `defined`) | designed slug | `plan-feature-scaffold` | `execute-phase 14 P1` |
| `plan-feature 14-csv-export` (already `planned`) | already-planned slug | — | STOP → `/execute-phase 14 P1` (no re-scaffold) |
| `plan-feature --next` | next `defined` roadmap entry | gate, then scaffold | `execute-phase NN P1` |

## Process

1. **Redirect gate** per above — always first.
2. **Route** per above. The from-issue internal produces a **filled, sized SPEC
   product half**; then invoke `plan-feature-scaffold`, which fills the
   engineering half and scales the artifacts to the SPEC's size (XS/S →
   SPEC-only; M/L → full set) and registers the roadmap. The already-designed
   scoped path runs `plan-feature-scaffold` directly.
3. **Confirm roadmap.** Verify the feature is registered in
   `docs/features/ROADMAP.md` with the right number, ordering, and dependencies;
   if any of the three is missing or wrong, fix the entry now — never leave
   registration for later.
4. **Dependency & blocker check (always, before recommending execution).**
   - Walk the feature's `Depends on:` closure (transitively): every dependency
     must be `done` **and merged**. Any unmet → the closing block recommends
     building the deepest unmet dependency first, NOT this feature.
   - Check the fix index + open issues (forge CLI) for fix-now items touching
     the same modules this SPEC names. Any hit → the closing block recommends
     `/plan-fix <n>` before execution ("building on a known defect bakes it in").
   - Planning itself never blocks on either — the SPEC/artifacts are still
     written; only the **recommended next step** changes.
5. **Print the next step** per the check above (see Done when).

## Guardrails

- Docs only — no code, no branch (that is `execute-phase`).
- **Never plan an undesigned feature** — the redirect gate has no bypass flag,
  ever. Do not add one, even if asked; point at `/design-feature` instead.
- Don't re-ask what a flag, the issue, or the docs already settle.
- Surface conflicts (numbering clashes, dependency cycles, scope overlap) before
  writing, not after.
- Otherwise per the project's **Workflow conventions** (docs-language).

## Normalized Repository State

When `docs/workflow/REPOSITORY_STATE.md` exists, plan from its frozen facts and
decisions. An absent fact may be inspected; a conflict is a resolver
contradiction, never a rewrite. Planned work and documentation are not
implementation evidence. A present ledger whose status is `draft`,
`contradicted`, or `resolved` stops planning and routes to discovery or
resolution first. If no ledger exists, inspect the repository directly and
record `n/a: no normalized repository state`; NRS is optional.

## Architectural invariants

Discover the optional project invariant document declared in the documentation
map (normally `docs/architecture/ARCHITECTURAL_INVARIANTS.md`). If absent,
record `n/a: no project invariants declared` and continue. For every applicable
rule, cite its ID and repository evidence and classify the planned change as
`preserves`, `violates`, `introduces`, or `changes`. Only `preserves` may reach
scaffolding. A violation, new rule, or changed rule stops for an explicit
architectural decision through the project's declared authority; never convert
it into an engineering task or infer approval from the SPEC. Use frozen NRS
facts when available, but repository inspection remains authoritative.

## Internal steps (not user-invocable)

- `plan-feature-from-issue` — issue → scoped SPEC product half, `Closes #N`.
- `plan-feature-scaffold` — SPEC → engineering half + full artifact set +
  roadmap entry.

These run **within this same conversation** (that's what "composing" means) —
on any agent, just follow their `SKILL.md` inline as the routed step. The
raw-idea interview that used to be an internal step of this router is retired
— see `docs/workflow/MIGRATION.md`; that logic now lives in `design-feature`,
a user-facing skill in its own right (product definition is its own pipeline
stage, not an internal routing detail of this one).

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context. The
  internal steps above are the exception — they run inline, in this one.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  planning is judgment work — run it on your **strongest** model. The
  execution it hands off to may run cheaper.

## Relationship to other skills

- **Redirects to** `design-feature` when the redirect gate stops on an
  undesigned feature — never composed in-turn (planning-class, ≥-tier hand-off).
- `triage-issue` routes here to promote an issue to a feature (still subject to
  the redirect gate if the promoted issue is undesigned).
- `execute-phase` executes the phases afterward (`audit-docs` audits anytime).

## Done when

- The redirect gate ran, and if it stopped, nothing else in this turn touched
  the SPEC.
- Designed input only: a planned feature with its full artifact set exists and
  is roadmap-registered — **and the roadmap row was re-read after the write and
  literally reads `planned`** (never assumed from having run the write step).
- The dependency & blocker check ran, and **the closing `→ Next:` block matches
  its result** — clean:

  ```
  → Next: /execute-phase <NN> P1 — start phase 1 (M/L, phased)
    · XS/S feature → /execute-phase <NN> (single-pass)
    · adjust scope first → re-run /design-feature <slug>   · audit the planning docs → /audit-docs
  ```

  already-planned feature (redirect gate stopped, never re-scaffolded):

  ```
  → Next: /execute-phase <NN> P1 — this feature is already planned; start
    implementation, don't re-plan it.
  ```

  undesigned feature (redirect gate stopped):

  ```
  → Next: /design-feature <slug> — this feature has no completed product design yet
    (capability closure not done). Design it first; then re-run /plan-feature <slug>.
  ```

  unmet dependency and/or blocking fix-now issue:

  ```
  → Next: /plan-feature <deepest-unmet-dep> (or /execute-phase <dep> …) — build the
    dependency chain first: <chain, deepest → NN>
    · blocking fix-now issue #<n> in the same area → /plan-fix <n> before executing
    · proceed anyway → /execute-phase <NN> P1 --force (the gate logs the override)
  ```
