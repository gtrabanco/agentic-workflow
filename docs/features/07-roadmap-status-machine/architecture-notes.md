# 07 — roadmap-status-machine · architecture-notes

Layer impact, ownership, and the compose/hand-off boundaries this feature relies
on. Docs/skills-only change — the roadmap vocabulary and the skills are the
product.

## The state machine (single source of truth)

```
idea ──▶ defined ──▶ planned ──▶ in-progress ──▶ done
```

The **roadmap status column** is ground truth. Skills READ it; each skill WRITES
only its owned transition. `done`'s "merge state lives in the forge" rule is
unchanged (the only status whose full truth is not in the roadmap).

## Transition ownership (no double-writers)

| Edge | Owning skill | Trigger |
|---|---|---|
| create row @ `idea` | human / any skill adding the row | wishlist entry |
| `idea → defined` | `design-feature`, `plan-feature-from-issue` | stamp `## Design status: designed` |
| `defined → planned` | `plan-feature-scaffold` | register full artifact set |
| `planned → in-progress` | `execute-phase` (P1) | branch open |
| `in-progress → done` | `execute-phase` (PR-open step) | PR opened |

Every other skill (`workflow-status`, `plan-feature` router, `ship-roadmap` when
sensing) is a **reader**. `ship-roadmap` writes transitions only *through* the
owning skills it composes in-turn (design→plan), never directly.

## Reader contracts

- **`workflow-status`** — parses all five; `startable_now` = status ≥ `defined` ∧
  deps met; `idea` → `design_candidates`; envelope gains `design_candidates`
  (additive; U7-safe).
- **`execute-phase`** — dependency gate adds an own-status precondition:
  `< planned` STOPS with a redirect (`idea→/design-feature`, `defined→/plan-feature`).
  `--force` is user-only; the autopilot is forbidden from it (unchanged).
- **`plan-feature`** — redirect gate reads roadmap status first; SPEC `## Design
  status` marker is the legacy fallback for pre-U4 `planned` rows.

## Compose / hand-off boundaries (the ≥-tier rule)

- `plan-feature` **hands off** to `design-feature` (never composes below its
  tier) — unchanged.
- `plan-feature-from-issue` composing `design-feature` for a thin issue stays
  bound by the ≥-tier rule (this planning run: opus — compose allowed).
- `ship-roadmap`'s **JIT design** composes design→plan in-turn within its already-
  documented founding ≥-tier rule (both opus/high). No new boundary introduced.

## Backward compatibility

Legacy `planned` rows with a complete SPEC product half are treated as
`defined`+`planned` (no redirect), keyed on the retained SPEC `## Design status`
marker. Documented in `docs/workflow/MIGRATION.md`. No runtime migration; the
automated substrate upgrade is U10 (#20).

## Stack-agnostic

No product/stack/framework/ORM/runtime reference enters any skill or shared doc.
Status names and skill names only — generic phrasing throughout.
