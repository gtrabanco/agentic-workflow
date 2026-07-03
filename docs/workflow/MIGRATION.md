# Migration notes

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
