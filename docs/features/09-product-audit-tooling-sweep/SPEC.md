# 09 — product-audit-tooling-sweep

> Feature specification. This is the **feature doc** read at the start
> of the workflow (`CLAUDE.md` → Feature workflow). Fill every section.
> Detailed phase tasks live in `PLAN.md` / `TASKS.md`, generated in
> planning mode from this spec.
>
> **One SPEC, two halves.** `design-feature`/`plan-feature-from-issue` write the
> **Product half** (product definition, capability closure, acceptance criteria)
> and stamp `## Design status`. `plan-feature` refuses to plan a feature not
> marked `designed`, then writes the **Engineering half** (architecture, design,
> phases, testing). One file, two owners, no drift.

## Goal

Give `product-audit` an **installed-tooling sweep**: as one dimension of the
product-wide health check, inventory the **installed skills** and **connected
MCP servers**, cross them against the project's applicable review axes and its
roadmap features, and turn the result into **proposals** — register the useful
ones in the project's `CLAUDE.md` (so `review-change` and `execute-phase` can
use them at zero discovery cost), and flag any discovered skill/MCP that would
change a feature's definition or scope (routing that feature to
`/design-feature <slug>`). Consistent with `product-audit`'s standing contract,
it **proposes only — never auto-registers, never edits `CLAUDE.md` or a SPEC.**
This is U6 of the 2026-07-09 backlog
([#16](https://github.com/gtrabanco/agentic-workflow/issues/16)).

## Branch

`feat/09-product-audit-tooling-sweep`

## Size

`S` — no new skill; a single new **dimension + process step + proposal stream**
added to `skills/product-audit/SKILL.md` (inventory installed skills / connected
MCPs, cross-reference against axes + roadmap, propose registration or re-design),
its output format and guardrails extended to match, plus full `bump-skill`
bookkeeping (version bump + CHANGELOG EN/ES + README EN/ES skill tables).
**Single-pass** execution (`execute-phase 09`, no phase split) — the change is
concentrated in one skill file plus mechanical bookkeeping, touches one concern
(product-audit's dimension set), and carries no unresolved design decision.

## Dependencies

**No hard dependencies.** Soft pairing with **`06-design-feature`**
([#13](https://github.com/gtrabanco/agentic-workflow/issues/13),
[PR #24](https://github.com/gtrabanco/agentic-workflow/pull/24) — **merged**
2026-07-09): `design-feature` owns the **per-feature** tooling discovery (its
Step "Per-feature tooling notes" explicitly defers the **global** sweep to
`product-audit`), and this feature builds that global counterpart. Because 06 is
merged, nothing gates this feature's start; the roadmap `Depends on` column is
`—`. The fix index (`docs/fix/`) is empty and no open fix-now issue touches
`product-audit` — the other open issues are the remaining backlog units
(#17–#21), none of which this feature depends on.

---

## Product half

Written by `plan-feature-from-issue` from issue
[#16](https://github.com/gtrabanco/agentic-workflow/issues/16). Complete —
`## Design status` below reads `designed`.

### Context

The workflow's placement decision for tooling discovery (taken 2026-07-09, U3 +
U6): **heavy discovery of installed skills / connected MCP servers lives in
exactly two places** — `design-feature` (per feature, at design time) and
`product-audit` (product-wide, periodically). The execution-path skills
(`plan-feature`, `execute-phase`, `review-change`) only **read** what is already
registered in the project's `CLAUDE.md`; analysing newly-installed tooling
mid-feature is too heavy for that path and would cost discovery on every run.

`design-feature` already implements its half (per-feature `## Tooling` notes,
and it explicitly points the *global* sweep at `product-audit`). `product-audit`,
however, has no tooling dimension today: its dimension table stops at
"Roadmap coherence", so a newly-installed review skill or a newly-connected MCP
that would strengthen the project's review axes — or change what a roadmap
feature should be — goes unnoticed until someone manually spots it. This feature
closes that gap by making the installed-tooling inventory a first-class audit
dimension whose output feeds `product-audit`'s existing proposal machinery.

### Business goals

n/a — internal workflow-quality feature (no external product surface). The
outcome it serves: the project's *registered* tooling stays in sync with what is
actually installed/connected, so the zero-discovery-cost execution path
(`review-change`, `execute-phase` reading `CLAUDE.md`) keeps benefiting from
tooling the operator added after the last audit — without paying discovery on
every run.

### Scope

#### In scope

- **New audit dimension** in `product-audit` — **"Installed tooling"** (applies
  to all product types): inventory the installed skills and connected MCP
  servers available to the agent, and cross-reference each against (a) the
  project's **applicable review axes** and (b) its **roadmap features**.
- **New process step** wiring the sweep into `product-audit`'s Process: build
  the inventory, classify each item as *useful-to-register* / *scope-affecting*
  / *not-relevant*, and dedupe against what the project's `CLAUDE.md` already
  registers (only unregistered, relevant tooling becomes a proposal).
- **New proposal stream** — **"Tooling to register / re-design"** — added to the
  three existing streams (Issues to open, Roadmap add, Roadmap remove/revise):
  - *register* — a useful skill/MCP not yet named in the project's `CLAUDE.md`
    → propose adding it under a "Tooling notes / Optional review extras"
    heading, so `review-change`/`execute-phase` use it at zero discovery cost;
  - *re-design* — a discovered skill/MCP that would change a feature's
    definition or scope → propose routing that feature to
    `/design-feature <slug>` (the user approves; per 06's re-entry rules).
- **Output-format + guardrail updates** so the tooling dimension has a health
  line, the new proposal stream appears in the report block, and the
  never-auto-apply guardrail explicitly covers tooling registration.
- **`bump-skill` bookkeeping** — minor version bump of `product-audit`, a
  CHANGELOG row in `CHANGELOG.md` **and** `CHANGELOG.es.md`, and the skill-table
  entries in `README.md` **and** `README.es.md` updated to match.

#### Out of scope / non-goals

- **Auto-registering tooling or editing any `CLAUDE.md`/SPEC** —
  `product-audit` proposes only; the user (or a routed `design-feature` run)
  performs the edit. (Owner: the user / `design-feature`.)
- **Adding discovery to the execution path** (`plan-feature`, `execute-phase`,
  `review-change`) — the placement decision keeps those read-only over the
  already-registered tooling. (Owner: unchanged — those skills stay as-is.)
- **Adding a "Tooling notes / Optional review extras" section to
  `template/CLAUDE.md`** — the proposal *names* that target location, but
  `product-audit` does not own `template/`; whether the scaffold grows a stub
  anchor is a separate `template` change, not this feature. (Owner: a future
  `template`/`init-workspace` change.)
- **Changing `design-feature`'s per-feature tooling discovery** — it already
  implements its half and defers the global sweep here; no edit needed.
  (Owner: `06-design-feature`, done.)

### Capability closure

This feature introduces **no product entity, role, or user-facing UI/API
surface** — it is a behavioural change to one authoring skill (`product-audit`).
Every closure row is therefore `n/a` with a reason; the verifiable conditions
live in Acceptance criteria below as command checks against the edited
`SKILL.md`.

```markdown
For EACH entity this feature introduces or touches:
- [ ] Create — n/a: no product entity; the change is a new audit dimension + proposal stream in one skill's SKILL.md
- [ ] Read/list — n/a: the "inventory" is the agent's installed-skill/MCP list read at audit time, not a persisted entity with a listing surface
- [ ] Update — n/a: no entity to update; product-audit proposes edits, the user/design-feature applies them
- [ ] Delete — n/a: no entity to delete
- [ ] State transitions — n/a: no entity lifecycle

For EACH capability (action a user can take):
- [ ] Visible entry point: the existing `/product-audit` invocation — the sweep runs as one of its dimensions, no new command
- [ ] Who may execute it (ACL): n/a — same actor who runs product-audit today; no new permission

For EACH role / permission:
- [ ] Assigned/Revoked/Viewed: n/a — no roles in a docs/skill repository
```

### Acceptance criteria

Command-checkable (run from repo root; each must exit `0` / print the expected
match). Genuinely judgement-only criteria are labelled `read-verified`.

- **New dimension present** — the "Installed tooling" row exists in
  product-audit's dimension table:
  `grep -qi "Installed tooling" skills/product-audit/SKILL.md`
- **Sweep wired into Process** — a process step inventories installed skills /
  connected MCPs:
  `grep -qiE "installed skill|MCP server" skills/product-audit/SKILL.md`
- **New proposal stream present** — a register / re-design proposal stream is in
  the output format:
  `grep -qiE "register|re-design|design-feature" skills/product-audit/SKILL.md`
- **Never-auto-apply preserved** — the guardrail still forbids acting; the
  tooling sweep proposes only:
  `grep -qi "Never auto-fixes" skills/product-audit/SKILL.md`
- **Version bumped** — `product-audit` is above `1.7.0`:
  `grep -qE "^version: 1\.(8|9|[1-9][0-9])\." skills/product-audit/SKILL.md`
- **Changelog rows (EN+ES)** — both changelogs mention the tooling sweep:
  `grep -qi "product-audit" CHANGELOG.md && grep -qi "product-audit" CHANGELOG.es.md`
- **README skill tables consistent (EN+ES)** — the `product-audit` version in
  both READMEs matches the bumped `SKILL.md` version (`read-verified` via
  `bump-skill`, which is the mechanical enforcer of this).
- **Placement invariant held** (`read-verified`) — no discovery/inventory logic
  was added to `plan-feature`, `execute-phase`, or `review-change`; those remain
  read-only over registered tooling. Spot check:
  `! grep -qiE "connected MCP server|installed skill" skills/execute-phase/SKILL.md skills/review-change/SKILL.md`
- **Proposal routing correct** (`read-verified`) — *register* proposals point at
  the project's `CLAUDE.md`; *re-design* proposals route to
  `/design-feature <slug>` (the user approves), consistent with 06's re-entry
  rules.

### Tooling

n/a for building this feature — it is a Markdown edit to one `SKILL.md` plus
`bump-skill` bookkeeping (the repo's own maintenance skill). (The feature's
*subject* is tooling discovery, but no external skill/MCP is needed to author
it.)

### Product decisions

- **Proposes, never registers** (decided, from `product-audit`'s standing
  contract + the issue): the sweep emits proposals; the user or a routed
  `design-feature` run performs any `CLAUDE.md`/SPEC edit. Rationale: keeps
  `product-audit`'s "never auto-fixes, never edits" invariant intact and the
  human in the loop.
- **Discovery lives only in `design-feature` (per feature) and `product-audit`
  (product-wide)** (decided 2026-07-09, placement decision in the issue): the
  execution path stays read-only over registered tooling. Rationale: analysing
  new tooling mid-feature is too heavy for the hot path and would re-pay
  discovery on every run.

## Design status

`designed` — capability closure complete (every row filled or explicitly `n/a`
with a reason), acceptance criteria emitted as runnable commands. `plan-feature`
may plan the engineering half.

---

## Engineering half

Written by `plan-feature-scaffold`, product half above is `designed`.

### Technical goals

Add one self-contained dimension to `product-audit` that a weak executor can
implement by pattern-matching the skill's existing dimension/process/output
structure — no change to any other skill, and no violation of the
"proposes-only" and "discovery-only-in-two-places" invariants.

### Architecture impact

- **Single-skill change.** Only `skills/product-audit/SKILL.md` gains behaviour;
  `plan-feature`, `execute-phase`, and `review-change` are **untouched**
  (placement invariant — the execution path stays read-only over registered
  tooling). Cross-references to `design-feature` are prose only (no coupling).
- **Invariant to hold:** `product-audit` remains **read-only and
  recommend-only** — the new dimension must not add any write/registration
  action; it feeds the existing proposal streams. The turn-contract box
  "Nothing was fixed, filed, or changed — report only" stays true.
- **No machine-envelope schema change required.** The new proposals ride the
  existing `detail.proposed_issues` / `detail.proposed_features` shape (or a
  sibling `proposed_tooling` key if cleaner); confirm against
  `orchestration-envelope` during execution and keep additive-only — no field
  removed, no type changed.

### Design

Concrete edits to `skills/product-audit/SKILL.md` (all additive):

1. **Dimension table** (after the "Roadmap coherence" row) — add:

   | **Installed tooling** | Installed skills + connected MCP servers vs. the project's applicable axes and roadmap features — unregistered-but-useful items, and tooling that would change a feature's scope | all |

2. **Process** — add a step (after "Mine accumulated suggestions", before
   "Synthesize proposals"): *Sweep installed tooling* — (a) inventory the
   installed skills and connected MCP servers available to the agent; (b)
   cross-reference each against the applicable review axes and the roadmap
   features; (c) classify each as **register** (useful, not yet in the
   project's `CLAUDE.md`), **re-design** (would change a feature's
   definition/scope), or **not-relevant**; (d) dedupe against what `CLAUDE.md`
   already registers — only unregistered/relevant items survive into proposals.

3. **Output format** — add a fourth proposal stream to the report block:

   ```
   Tooling — register / re-design:
     - <skill|MCP> — register in CLAUDE.md (Optional review extras): <why> — route: user edits CLAUDE.md
     - <skill|MCP> — would change <feature> scope: <why> — route: /design-feature <slug>
   ```

   and a health line `Installed tooling ....... ✓ | ⚠ | ✗ | n-a` under
   "Health by dimension".

4. **Guardrails** — extend the never-auto-apply bullet so it explicitly names
   tooling registration: `product-audit` proposes tooling to register but never
   edits `CLAUDE.md`; a scope-affecting discovery routes to `design-feature`,
   which the user approves.

5. **`bump-skill`** — run it after the edit: bump `product-audit`'s `version:`
   (minor — additive capability), add the CHANGELOG rows (EN + ES), update the
   README skill tables (EN + ES).

The agent must inventory tooling **honestly**: if it cannot enumerate installed
skills / connected MCPs in its runtime, it says so (per the existing "No silent
caps" guardrail) rather than inventing an inventory.

### Decisions to confirm

None open — both product decisions above are settled (proposes-only;
discovery-only-in-two-places). No engineering decision is deferred to execution.

### Testing requirements

Documentation/skill change — no code test layer. Verification is the Acceptance
criteria command block above, run against the edited `SKILL.md` and the
changelogs/READMEs, plus the repo's standing "green" checks:
`npx skills add . --list` still discovers `product-audit`, Markdown is
well-formed, and no stack/real-project reference leaked into the skill. The
placement invariant is verified by the negative `grep` in Acceptance criteria
(no discovery logic added to the execution-path skills).

### Dev scenarios

n/a — this feature adds no runtime behaviour with reproducible failure modes; it
is a skill-instruction edit. The relevant "degraded state" (the agent cannot
enumerate installed tooling) is handled by the honest-inventory instruction in
Design §5 and the existing "No silent caps" guardrail, and is checked by
`read-verified` inspection, not a dev harness.

### Phases

**Single-pass (size S)** — executed with `execute-phase 09` (no `P1/P2` split).
The one pass: apply the five additive edits in Design (dimension row, process
step, output-format stream + health line, guardrail), run `bump-skill`
(version + CHANGELOG EN/ES + README EN/ES), verify the Acceptance-criteria
command block passes, then open the PR carrying `Closes #16`. Opening the PR is
the final step of the pass, not a separate phase.

### Deploy & rollback

n/a — merging the PR is the entire deployment; rollback is `git revert` of the
single doc PR. No migration, flag, or config change.

### Open questions / risks

- **Runtime inventory availability** (low): some agents cannot enumerate their
  installed skills / connected MCPs. Mitigated by the honest-inventory
  instruction (Design §5) + the existing "No silent caps" guardrail — the sweep
  reports what it could and couldn't see; it never fabricates.
- **Envelope shape** (low, DEFERRED to execution): confirm whether the tooling
  proposals reuse `detail.proposed_features`/`proposed_issues` or add a
  `proposed_tooling` sibling; keep the change additive per
  `orchestration-envelope`.

### Deliverables

- Edited `skills/product-audit/SKILL.md` (new dimension, process step,
  output-format stream + health line, guardrail; version bumped).
- `CHANGELOG.md` + `CHANGELOG.es.md` rows.
- Updated skill tables in `README.md` + `README.es.md`.
- This SPEC (the only planning artifact for an S feature).
- PR against `main` carrying `Closes #16`.

### Post-merge next feature

Per the backlog order (U6 → U7 when the driver is ready → U8/U9 → U10 → U11):
the next unit is **U7 — remove the JSON envelope from skills**
([#17](https://github.com/gtrabanco/agentic-workflow/issues/17)), gated on the
opencode driver adopting the repair loop first. If U7 is not yet unblocked, U8
([#18](https://github.com/gtrabanco/agentic-workflow/issues/18), `--adversarial
N`) or U9 ([#19](https://github.com/gtrabanco/agentic-workflow/issues/19),
golden-fixture procedure) are the next startable units. See
`docs/features/ROADMAP.md`.
