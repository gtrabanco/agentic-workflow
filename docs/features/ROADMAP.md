# Feature roadmap

Lightweight, always-current index of the feature sequence. One short
entry per feature.

Detailed specs are written **just-in-time**: only the feature in
progress — and at most a rough sketch of the next one — gets a full
`SPEC.md`. Downstream entries here are deliberately a single paragraph
and will be expanded when their turn comes. Writing detailed specs for
distant features is avoided on purpose: they go stale as upstream
features change their assumptions.

This file is the single source of truth for feature **numbering and
ordering**. If a feature is renamed or resequenced, update it here
first.

## Status legend

- `done` — merged to `main`
- `in-review` — PR open, not yet merged
- `next` — spec ready, implementation not started
- `planned` — sketched here only, no spec yet

## Spec status

- `n/a` — feature already implemented; its docs are historical
- `drafted` — a full feature doc exists
- `stub` — only the paragraph in this file exists

---

## Sequence

### 01 — project-foundation

// TOBE DONE

---

## Dependency graph

```
01 
```

---

## Conventions

- Each feature lives in `docs/features/NN-<slug>/`.
- The feature doc is `SPEC.md`. Features 01–02 used `<slug>.md`
  historically; 03 onward standardize on `SPEC.md` (see
  `_TEMPLATE/SPEC.md`).
- Planning artifacts — `PLAN.md`, `TASKS.md`, `decisions.md`,
  `progress.md`, `known-issues.md`, `testing.md`,
  `architecture-notes.md` — are generated in planning mode from the
  `SPEC.md`, per the feature workflow in `CLAUDE.md`.
- One feature = one branch (`feat/<slug>`) = one PR = one merge
  commit. Conventional commits, one isolated commit per phase.

### Numbering history & frozen artifacts

Feature numbers have been **resequenced** as features were inserted —
most notably, the i18n-and-currency platform took slot **08**, bumping
checkout from `08` → **`10`** (and shifting brand/marketing/blog by the
same offset). Each affected entry above records its own renumbering
trail.

Two classes of document reference these numbers, and they are treated
differently **on purpose**:

- **Live cross-cutting reference docs** — `docs/architecture/*`,
  `docs/domain/*`, `docs/backend/*`, `docs/infrastructure/*`,
  `docs/business/*`, `docs/frontend/*`. These are kept **current**: a
  reader consults them to understand the system as it is *now*, so stale
  numbers there are corrected (e.g. the "feature 08 (checkout)" →
  "feature 10" pass done alongside the feature 10 SPEC).

- **Frozen per-feature planning artifacts** — the `SPEC.md`, `PLAN.md`,
  `TASKS.md`, `decisions.md`, `known-issues.md`, etc. of features that
  are already merged or in progress (e.g. `04-provider-sync-runtime`,
  `07-public-catalog-pages`). These are **point-in-time records** of what
  was known and decided when that feature was built. Some still say
  "feature 08 (checkout)" using the pre-insertion numbering. **They are
  deliberately NOT rewritten**, because:

  1. Rewriting a delivered feature's planning record would falsify the
     historical decision trail (who decided what, against which
     assumptions, when) — the same reason `manual_overrides` are
     soft-deleted, not erased.
  2. The risk of a stale number there is low and bounded: this ROADMAP is
     the single authoritative resolver for numbering, so any reader who
     hits an old "feature 08 (checkout)" reference can map it here.
  3. Touching frozen artifacts to chase renames is unbounded churn for no
     functional benefit.

  When in doubt about what a number means, **this file wins**. To map an
  old number: checkout `08`→`10`; brand `09`→`11`; marketing `10`→`12`;
  blog `11`→`13` (see each entry's renumbering note for the exact trail).
