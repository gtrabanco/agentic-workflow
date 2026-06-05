# Changelog

Skills are versioned **independently**: each `skills/<name>/SKILL.md` carries its
own `version:` (semver) in frontmatter and bumps on its own cadence. This file
records those bumps, grouped by release date, newest first.

> The `skills` CLI installs from this repo and pins what a consumer installed by
> content hash in their `skills-lock.json`; `npx skills update` moves a skill to
> the latest version published here. The per-skill `version:` is the human- and
> agent-readable source of truth (the CLI ignores unknown frontmatter keys).

## Versioning policy (per skill)

- **major** — a breaking change to how you invoke or rely on the skill: a rename,
  a removed/renamed flag, a changed contract or output shape, or a moved
  responsibility. Consumers must read the migration note.
- **minor** — new capability or option that is backward compatible (a new flag, an
  added section, a new routing case).
- **patch** — wording, examples, clarifications, internal tidy-ups; no behavior
  change.

Renames are **major** and ship with a migration note — see
[`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

---

## 2026-06-05 — first versioned release (all skills `1.0.0`)

Formal versioning starts here. Every skill is stamped `1.0.0`; from now on each
evolves independently under the policy above. The earlier consolidation from the
9-skill set to this 13-skill set (the `plan-feature` router, `plan-fix`,
`review-change`, `audit-pr`, `product-audit`, and the internal `plan-feature-*`
steps) **predates** formal versioning; consumers upgrading from that older install
follow [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

**User-facing (9):**

- `init-workspace` `1.0.0` — adapt the doc scaffold to a project; suggest companion review skills.
- `plan-feature` `1.0.0` — planning router (idea / issue / scoped slug / `--next`).
- `plan-fix` `1.0.0` — architect-draft a scoped fix SPEC; stop for review.
- `execute-phase` `1.0.0` — implement a phase / single-pass / `--fix`; auto-review every 2 phases.
- `review-change` `1.0.0` — platform-adaptive review orchestrator → one classified table + manual checks.
- `audit-pr` `1.0.0` — PR-level merge gate → merge-ready or blockers.
- `product-audit` `1.0.0` — periodic product-wide health check → issue + roadmap proposals.
- `audit-docs` `1.0.0` — docs ↔ roadmap ↔ code ↔ fix-index coherence.
- `triage-issue` `1.0.0` — classify an issue by verifying its trigger against the code.

**Internal (4, `user-invocable: false`):**

- `review-implementation` `1.0.0` — the findings engine + classification rubric `review-change` and the audit skills compose.
- `plan-feature-interview` `1.0.0` — interview a raw idea into a SPEC.
- `plan-feature-from-issue` `1.0.0` — issue → scoped SPEC with `Closes #N`.
- `plan-feature-scaffold` `1.0.0` — SPEC → full planning artifact set + roadmap entry.
