# Capability inventory

> The maintained list of this project's **cross-cutting subsystems** and
> **roles** — the substrate the lane's `design` catalog step's *Integration
> closure* walks so no feature ships without deciding how it touches auth, ACL,
> navigation, and the rest. A model cannot reliably *guess* which subsystems
> your project has, but it can *walk a list* — this file is that list.
>
> **Candidate rows, not a floor.** Everything below is the starting candidate
> set for *any* project, and `init-workspace` evaluates it against this one
> instead of copying it. Per row, in this order: **delete** it when the project
> cannot carry that surface — no question is asked, and the run reports the row
> with the project-type evidence that justified the deletion; **infer** its state
> only from a cited repository path (a directory, a dependency, an entry point, a
> config key); **ask** what remains in one round, the existence question before
> any state question, the inferred proposal beside each. A row neither the
> repository nor you settle is written `unresolved — <question>` — never a
> guessed `no`, never this file's text.
>
> **Ownership & lifecycle:** seeded by `init-workspace` (from discovery +
> interview); **extended by `execute-phase`** whenever a phase introduces a new
> subsystem, role, or permission (additive, in the same commit as the code);
> freshness-checked by `product-audit` (inventory ↔ code drift is a Process &
> docs finding); **read by the `design` catalog step** for every feature's
> Integration closure. Keep every row honest — a subsystem marked `no` is as
> load-bearing as one marked `yes` (it tells the designer what does NOT exist
> yet).

## Roles

Every role/permission level the project has. The lane's `design` step role matrix
must list EVERY row here with an explicit `allowed`/`denied` per capability.
`Granted where` names the file or configuration that assigns the role; a role no
path grants is deleted, never invented, and a role nothing settles is asked.

| Role | Description | Granted where |
|---|---|---|
| `<role>` | `<what it is for>` | `<where it is assigned>` |

## Cross-cutting subsystems

One row per subsystem that survived the evaluation. `Exists` is
`yes | partial | no` — never blank, never a placeholder. `yes` and `partial` carry
the path that proves them; `no` carries the surface that was inspected and found
absent. Add project-specific subsystems beside the candidates below — the list is
a candidate set, not a ceiling.

| Subsystem | Exists | Surfaces / entry points | Evidence |
|---|---|---|---|
| Authentication | `<yes\|no\|partial>` | `<login page, session middleware, …>` | |
| ACL / permissions | `<yes\|no\|partial>` | `<permission registry, checks, …>` | |
| Navigation (menus, dashboard) | `<yes\|no\|partial>` | `<dashboard, sidebar, settings nav, …>` | |
| Notifications (email, push, in-app) | `<yes\|no\|partial>` | `<channels, templates, …>` | |
| Search | `<yes\|no\|partial>` | `<index, search UI, …>` | |
| Audit log / activity trail | `<yes\|no\|partial>` | `<log store, viewer, …>` | |
| Settings / preferences | `<yes\|no\|partial>` | `<settings pages, config store, …>` | |
| Background jobs / scheduling | `<yes\|no\|partial>` | `<queue, cron, workers, …>` | |
| File / media storage | `<yes\|no\|partial>` | `<upload flow, buckets, …>` | |
| i18n / localization | `<yes\|no\|partial>` | `<locale files, switcher, …>` | |
| Feature flags | `<yes\|no\|partial>` | `<flag store, …>` | |
| Billing / payments | `<yes\|no\|partial>` | `<provider, plans, webhooks, …>` | |
| Public API / integrations | `<yes\|no\|partial>` | `<API surface, webhooks, tokens, …>` | |
