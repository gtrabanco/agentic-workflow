# Migration notes

## 2026-07-10 — `review-change` gains opt-in `--adversarial N`

**Additive, non-breaking.** `review-change` adds an opt-in `--adversarial N`
flag: N independent, context-clean, diff-only, adversarial reviewers run in
parallel (Claude Code subagents / headless invocations / sequential
fresh-conversation fallback), and their findings are merged and deduped by
`file:line`+axis into the same one decision table the skill already produced,
with a `Reviewers n/N` confidence column and an inclusion threshold of ≥1
reviewer (no quorum). **No flag → nothing changes** — the default single-reviewer
path is byte-for-byte the same as before this capability existed. The mode is
also **auto-recommended (never forced)** in `review-change`'s own output when
a change is `L` or sensitive-flagged, and `ship-roadmap`'s unattended REVIEW
stage now **enables `--adversarial 2` as a hard floor** for `L`/sensitive
features — a policy deliberately distinct from (and not aligned with) that
interactive recommendation, since an unattended run has no human to exercise
skip judgment. Nothing to migrate: no flag removed, no output shape changed,
no action required to keep existing usage working. See
`docs/workflow/REVIEW_AND_CLASSIFY.md` for the practical how/when.

## 2026-07-10 — the machine envelope moves to the orchestration layer

**Breaking change to 14 skills' output contract.** Every user-facing skill
except `workflow-status` — `audit-docs, audit-pr, bump-skill, design-feature,
execute-phase, generate-docs, init-workspace, log-session, plan-feature,
plan-fix, product-audit, review-change, ship-roadmap, triage-issue` — no
longer ends its turn with the `## Machine envelope` fenced JSON block. The
turn-contract box requiring that emission is also removed, and every closing
`→ Next:` block is now the genuine last output of the turn.

**Why.** The envelope's only consumer is an external driver/orchestrator; in
interactive chat the trailing JSON was noise, and weak models — which drop
end-of-document duties by the workflow's own stated reasoning for
front-loading turn contracts — were penalized for omitting a duty a static
`SKILL.md` instruction could never actually enforce or recover from.
Enforcement now sits at the layer that reads the envelope: a driver can
detect a missing envelope and re-ask, something a skill body cannot do for
itself.

**What changed:**

- The `## Machine envelope` section and its turn-contract line are deleted
  from the 14 skills listed above (MAJOR bump each — see `CHANGELOG.md`).
- **`workflow-status` is unchanged** — emitting the envelope inline *is* its
  function (`--json-only` is meaningless without it); it keeps the section.
- **`orchestration-envelope`** (internal, `user-invocable: false`) is now the
  contract's sole home: it gains the canonical **driver-injected
  system-prompt snippet** (verbatim, fenced) and documents the **repair
  loop** (`parseEnvelope()` fails → re-invoke the same session with `Emit
  only the machine envelope for the turn above.`; one retry, then a
  driver-level `FAILED`). Minor bump.
- `docs/workflow/ORCHESTRATION.md` and `docs/workflow/PORTABLE_PROMPT.md`
  mirror the snippet + repair-loop protocol for driver authors.
- The envelope **JSON schema and the `@gtrabanco/agentic-workflow-schema`
  npm package are unchanged** — `parseEnvelope()` and existing drivers keep
  working; only *who* injects the requirement changed, not the schema
  consumers parse.

**Action needed for existing drivers.** A driver that relied on every skill
emitting the envelope unprompted must now inject the canonical system-prompt
snippet (from `orchestration-envelope`) into its invocations, and implement
the repair loop for a turn that comes back without a valid envelope.
`workflow-status` needs neither change — it still emits inline. Drivers that
already inject their own system prompt lose nothing by adding this snippet;
drivers with no prompt-injection mechanism should add one before upgrading
past this point.

## 2026-07-09 — roadmap status becomes the pipeline's state machine

**Non-breaking, backward-compatible.** The roadmap `Status` column is now the
pipeline's single ground-truth state machine — `idea → defined → planned →
in-progress → done` — and the primary gate signal every sensor/executor reads
(`workflow-status`, `execute-phase`'s dependency gate, `plan-feature`'s
redirect gate). Previously only `planned / in-progress / done` existed, which
conflated a thin wishlist row with a fully-planned, execution-ready unit. The
SPEC-local `## Design status` marker (introduced by the `design-feature`
split above) is **retained** as the SPEC-local record and as the legacy-compat
fallback described below — it is not removed.

**Legacy-compat rule.** A roadmap row from before this change — a plain
`planned` status with no `idea`/`defined` history — whose `SPEC.md` product
half is complete (`## Design status: designed`, capability closure filled) is
treated as **`defined`+`planned`**: it is fully executable, no redirect fires,
and no relabelling is required. A legacy `planned` row whose SPEC has no
completed product half (or no SPEC at all) is treated as `idea` and redirected
to `/design-feature <slug>` on its next `execute-phase`/`plan-feature`
invocation.

**Action needed:** none. Existing rows keep working under the equivalence rule
above. Projects that want the explicit five-state history on old rows may
relabel them by hand, but nothing requires it.

## 2026-07-09 — `plan-feature` 2.0.0: product definition splits into `design-feature`

**Breaking change to `plan-feature`'s contract.** Product definition (the
raw-idea interview, and the new **capability-closure** checklist that forces
every entity/capability/role a feature introduces to its full surface — CRUD +
state transitions + UI + API + test, or an explicit design-time `n/a`) moved
out of `plan-feature` into a new user-facing skill, **`design-feature`**.
`plan-feature` is now **engineering-planning only**.

**What changed:**

- **New skill `design-feature`** (v1.0.0, `user-invocable: true`). Folds in the
  raw-idea interview, walks capability closure, writes the SPEC's **product
  half**, and stamps `## Design status: designed`. Trigger phrases "add
  feature" / "add a feature" / "new feature" now land here, not on
  `plan-feature`.
- **`plan-feature` gains a redirect gate, no bypass flag.** Given a feature
  whose SPEC is missing, or whose `## Design status` isn't `designed`, or whose
  Capability closure section is empty, `plan-feature` **STOPS** and prints
  `run /design-feature <slug>` instead of planning it. There is no flag to
  skip this — an undesigned feature is never engineering-planned.
- **The internal raw-idea-interview step that used to live inside
  `plan-feature`'s routing is retired** and deleted from the skill set; its
  logic now lives in `design-feature` (see above). `plan-feature`'s
  `--interview` flag no longer exists — pass a raw idea straight to
  `design-feature` instead.
- **`docs/features/_TEMPLATE/SPEC.md`** is now **one SPEC in two halves**: a
  **Product half** (`design-feature` writes: Context, Business goals, Scope,
  Capability closure → Acceptance criteria, Tooling, Product decisions,
  `## Design status`) and an **Engineering half** (`plan-feature-scaffold`
  writes: Technical goals, Architecture impact, Design, Decisions to confirm,
  Testing requirements, Dev scenarios, Phases, Deploy & rollback,
  Deliverables). No separate `DESIGN.md` — this was a deliberate rejection to
  avoid two documents drifting apart.
- **`plan-feature-from-issue`** now writes the SPEC's product half and must
  satisfy capability closure — a thin issue is hand-off to `design-feature`,
  not a shortcut around the gate.

**Command muscle-memory:**

| Old | New |
|---|---|
| `plan-feature "<idea>"` / `--interview` | `design-feature "<idea>"`, then `plan-feature <slug>` once `## Design status: designed` |
| `plan-feature <slug>` (undesigned) | `plan-feature <slug>` now **stops and redirects** to `design-feature <slug>` — run that first |
| `plan-feature <slug>` (already designed) | unchanged — routes straight to engineering-half scaffolding |
| `plan-feature <N>` / `--from-issue N` | unchanged entry point; internally it now writes the product half and satisfies capability closure before scaffolding |

**Action needed:**

- If you had muscle memory for `plan-feature "<idea>" --interview`, switch to
  `design-feature "<idea>"` — `plan-feature` will refuse the old flag pattern
  (it no longer routes an interview).
- If a project has features whose `SPEC.md` predates this change (single-half
  layout, no `## Design status`), they read as "undesigned" under the new gate
  the next time `plan-feature` is invoked on them. Run `design-feature <slug>`
  once to backfill the Product half sections (Capability closure can be
  written retroactively from the existing Acceptance criteria) before
  continuing to plan or execute — see `docs/features/_TEMPLATE/SPEC.md` for
  the exact section layout to backfill against.
- Re-run `bump-skill` bookkeeping is already reflected in `CHANGELOG.md` /
  `CHANGELOG.es.md` and the README skills + model tables for this change.

## 2026-07-04 — v3: the default branch becomes model-agnostic

**Breaking change to how you install this workflow** (not to any skill's
behavior). Before v3, `npx skills add gtrabanco/agentic-workflow` (no `#ref`)
installed the opinionated distribution: every skill pinned its own
`model:`/`effort:` frontmatter (Opus/high for judgment skills, Sonnet/medium
for mechanical ones, etc. — see the README's "Recommended model & effort"
table). A separate `#inheritance` branch, auto-synced by CI, stripped those
two lines from every skill so it could be installed model-agnostic instead.

**v3 flips which branch is the default:**

| Ref | Before v3 | From v3 |
|---|---|---|
| *(none)* — `npx skills add gtrabanco/agentic-workflow` | opinionated, per-skill Claude tiers pinned | **model-agnostic** — no skill pins a tier; each inherits the host session's model/effort |
| `#claude` | did not exist | **new** — the opinionated, per-skill-tuned distribution that used to be the default; a frozen snapshot of pre-v3 `main`, kept current by CI from `docs/workflow/model-routing.yml` |
| `#inheritance` | model-agnostic (stripped from `main` by CI) | **unchanged in content**, now force-pushed as an exact mirror of the (already model-agnostic) default branch — kept only as a stable alias for anyone who pinned it before v3 |

**Why:** using this workflow shouldn't lock a project into one AI vendor's
model lineup. The discipline (docs, SPECs, phases, review, the merge gate) is
the product; which model executes it shouldn't be a hidden default. Moving
the responsibility of picking the right model to the user, with `#claude`
still available for anyone who wants Claude's tiers hand-tuned per skill,
reduces that lock-in cost without removing the option.

**Action needed:**

- **On Claude Code and relying on the default install's per-skill tiers?**
  Re-install with `#claude`: `npx skills add gtrabanco/agentic-workflow#claude`.
  Nothing else changes — same skills, same behavior, just the tiers you had
  before v3.
- **Already pinned `#inheritance`?** Nothing to do. It still resolves, with
  identical content to what it always had (now it's simply also what `main`
  serves by default).
- **On any other agent, or happy choosing the model yourself?** Nothing to
  do — the plain install command already gives you this branch.
- **Maintaining a fork or a similar split for your own project?** See
  `.github/workflows/sync-derived-branches.yml` for the CI pattern (mirror +
  frontmatter-injection-from-config), and `docs/workflow/model-routing.yml`
  for the per-skill tier source of truth.

No skill's instructions, checklists, or output contracts changed in this
release (see the per-skill patch-bump rows dated 2026-07-04 in
[`CHANGELOG.md`](../../CHANGELOG.md) — mechanical frontmatter/description
changes only). This is a distribution-model change, not a behavior change.

## 2026-07-04 — `audit-pr` 2.0.0: opt-in auto-merge

`audit-pr`'s contract changed from an unconditional **"never merges"** to
**"never merges by default"**. Nothing changes for existing setups — without the
opt-in it behaves exactly as before (read-only verdict, the human merges). What's
new:

- The verdict header now always prints the **PR's full URL** (not just `#N`).
- If the project's docs declare an auto-merge policy (e.g. `merge: auto` /
  `merge: fullauto` in the Workflow conventions or `SHIP_DECISIONS.md`), **or**
  the user explicitly instructs it in the conversation, a MERGE-READY verdict
  proceeds to merge — but only after a fail-closed pre-merge checklist: clean
  tree, nothing unpushed/unpulled, remote head == audited SHA, fresh green CI on
  that SHA, no sensitive/destructive diff. Anything pending → it does **not**
  merge; it routes commit+push, waits for CI, and requires a fresh re-audit.

**Action needed:** none, unless you *want* auto-merge — then write the policy
into your project's Workflow conventions. If your project's docs quote the old
"never merges, never edits" phrasing, update it to "never edits; merges only
under a documented auto-merge policy".

---

# Migration — upgrading to the v2 skill set

If you installed these skills **before the v2 redesign** (the 9-skill set), this
page is the upgrade path. Three skills were **renamed**, so a plain re-install
updates the kept skills and adds the new ones — but it leaves the three old folders
behind. The `skills` CLI never deletes skills that vanished from the source, so you
remove those three yourself.

> New install? Ignore this page — just follow [REPLICATE.md](REPLICATE.md).

## TL;DR

```sh
# 1. Re-add: updates the 6 kept skills in place and installs the 8 new ones.
npx skills add gtrabanco/agentic-workflow
#   Private repo? Use the SSH URL (the shorthand can fail under bunx):
#   npx skills add git@github.com:gtrabanco/agentic-workflow.git

# 2. Remove the three renamed skills (the CLI won't prune them for you):
npx skills remove design-feature draft-fix-spec feature-from-issue -y

# 3. Verify:
npx skills list
```

That's it. The commands above also work with `--global` (if you installed globally)
and `--agent <name>` (to target a specific agent).

## What changed

The 9 user-facing skills became **13** at that upgrade (9 user-facing + 4
internal) — **14 today**, with the later addition of the `ship-roadmap`
autopilot (10 user-facing + 4 internal). Nothing was lost — three planning
entry points **collapsed into one router**, one skill was **renamed for
symmetry**, and four **new** quality/automation skills were added.

| Status | Skill | Action on upgrade |
|---|---|---|
| 🔴 **Removed** (renamed away) | `design-feature` | **Delete.** Its job moved into the `plan-feature` router (idea path); the engine is the internal `plan-feature-interview`. |
| 🔴 **Removed** (renamed away) | `feature-from-issue` | **Delete.** Its job moved into the `plan-feature` router (issue path); the engine is the internal `plan-feature-from-issue`. |
| 🔴 **Removed** (renamed) | `draft-fix-spec` | **Delete.** Renamed to `plan-fix`. |
| 🟡 **Kept** (same name) | `plan-feature` | Updates in place — **but its meaning changed**: it used to scaffold only; it is now the **router** (it detects idea / issue / scoped slug and dispatches). The old scaffolding step is now the internal `plan-feature-scaffold`. |
| 🟡 **Kept** (same name) | `execute-phase` | Updates in place. Now hands off to `review-change` every 2 phases (review checkpoint). |
| 🟡 **Kept** (same name) | `init-workspace` | Updates in place. Now also suggests the platform's companion review skills. |
| 🟡 **Kept** (same name) | `review-implementation` | Updates in place. Now also the engine that `review-change` composes. |
| 🟡 **Kept** (same name) | `audit-docs` | Updates in place. |
| 🟡 **Kept** (same name) | `triage-issue` | Updates in place. Now routes fix-now → `plan-fix`, promote → `plan-feature`. |
| 🟢 **New** | `plan-fix` | Installed by the re-add. The fix-flow counterpart of `plan-feature`. |
| 🟢 **New** | `review-change` | Installed. Platform-adaptive review orchestrator. |
| 🟢 **New** | `audit-pr` | Installed. PR-level merge gate. |
| 🟢 **New** | `product-audit` | Installed. Periodic product-wide health check. |
| 🟢 **New** (internal) | `plan-feature-interview`, `plan-feature-from-issue`, `plan-feature-scaffold` | Installed but hidden from the menu — only the `plan-feature` router invokes them. |

## Command muscle-memory

Your old commands map cleanly onto the router:

| Old | New |
|---|---|
| `/design-feature "<idea>"` | `/plan-feature "<idea>"` (router detects the idea → interview) |
| `/feature-from-issue <N>` | `/plan-feature <N>` (router detects the issue → scoped SPEC) |
| `/draft-fix-spec <N>` | `/plan-fix <N>` |
| `/plan-feature <slug>` (old scaffold) | `/plan-feature <slug>` — **unchanged**; the router detects the scoped slug and scaffolds |

So in practice: anywhere you used to reach for `design-feature` or
`feature-from-issue`, just call `plan-feature` and let it route; `draft-fix-spec`
becomes `plan-fix`.

## If `skills remove` isn't available

`npx skills remove` is the supported way to delete an installed skill. As a
fallback, delete the folders directly from your agent's skills directory — for
Claude Code that's the project's `.claude/skills/` (or `~/.claude/skills/` if you
installed `--global`):

```sh
rm -rf .claude/skills/design-feature \
       .claude/skills/draft-fix-spec \
       .claude/skills/feature-from-issue
```

## Verify the result

After upgrading you should see **14 skills** (10 in the `/` menu + 4 internal), and
**none** of the three removed names:

```sh
npx skills list
# expect: init-workspace, plan-feature, plan-fix, execute-phase,
#         review-change, audit-pr, audit-docs,
#         product-audit, triage-issue, ship-roadmap
#         (+ the 4 internal steps: 3 plan-feature-* + review-implementation)
# expect: NO design-feature, draft-fix-spec, feature-from-issue
```

If the docs in a project you set up earlier still reference the old names, re-run
`init-workspace` (or `audit-docs`) to bring that project's `docs/workflow/` copy in
line with the v2 set.
