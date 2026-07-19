# Capability inventory

> The maintained list of this project's **cross-cutting subsystems** and
> **roles** — the substrate `design-feature`'s *Integration closure* walks so
> no feature ships without deciding how it touches auth, ACL, navigation, and
> the rest. A model cannot reliably *guess* which subsystems your project has,
> but it can *walk a list* — this file is that list.
>
> **Ownership & lifecycle:** seeded by `init-workspace` (from discovery +
> interview); **extended by `execute-phase`** whenever a phase introduces a new
> subsystem, role, or permission (additive, in the same commit as the code);
> freshness-checked by `product-audit` (inventory ↔ code drift is a Process &
> docs finding); **read by `design-feature`** for every feature's Integration
> closure. Keep every row honest — a subsystem marked `no` is as load-bearing
> as one marked `yes` (it tells the designer what does NOT exist yet).

## Roles

Every role/permission level the project has. `design-feature`'s role matrix
must list EVERY row here with an explicit `allowed`/`denied` per capability.

| Role | Description | Granted where |
|---|---|---|
| `<role>` | `<what it is for>` | `<where it is assigned>` |

## Cross-cutting subsystems

One row per subsystem. `Exists` is `yes | no | partial` — never blank. Delete
rows that can never apply to this product (e.g. `Billing` for an internal
tool) and add project-specific ones (the fixed set below is the floor, not the
ceiling).

| Subsystem | Exists | Surfaces / entry points | Notes |
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
