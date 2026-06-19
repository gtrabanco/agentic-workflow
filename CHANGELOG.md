# Changelog

> 🇪🇸 [Versión en español](CHANGELOG.es.md)

Each skill (`skills/<name>/SKILL.md`) carries its **own** `version:` in frontmatter
and evolves independently. The per-skill tables below are the source of truth for
**what changed between each version**; a condensed chronological log follows.

## Versioning policy (per skill)

| Bump | When |
|---|---|
| **major** | breaking change to how you invoke or rely on the skill — a rename, a removed/renamed flag, a changed contract or output shape. Ships with a migration note. |
| **minor** | new backward-compatible capability — a new flag, an added section, a new routing case. |
| **patch** | wording, examples, clarifications, internal tidy-ups; no behavior change. |

Renames are **major** and ship with a note in
[`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

## Installing & pinning a version

```sh
# Latest (tracks the repo's default branch):
npx skills add gtrabanco/agentic-workflow

# Pin to a tagged release (reproducible — recommended for pinning):
npx skills add gtrabanco/agentic-workflow#release-2026-06-19

# Pin to any git ref (tag or branch) with the #<ref> shorthand:
npx skills add gtrabanco/agentic-workflow#<tag-or-branch>

# Reproducible restore from the lockfile (pins every skill by content hash):
npx skills experimental_install      # restores exactly what skills-lock.json records
npx skills update                     # move installed skills to the latest published here
```

How pinning actually works, verified against the `skills` CLI:

- **The per-skill `version:` is documentation**, not a CLI selector — the CLI
  resolves by repo + path + content hash and **ignores frontmatter** for resolution.
  So you don't pin "execute-phase 1.2.0" directly; you pin the **repo ref** at which
  that skill had that version.
- **`#<ref>` shorthand works** (`owner/repo#<tag-or-branch>`) — confirmed. A raw
  commit SHA on a full git URL can fail to clone, so **prefer tags**.
- **Releases are tagged** `release-YYYY-MM-DD` (this repo). Pin to a tag to freeze
  the whole skill set at a known snapshot; map the tag → per-skill versions using
  the tables below.
- **`skills-lock.json`** records each installed skill's `computedHash`;
  `npx skills experimental_install` restores that exact set on another machine/CI.
  This is the reproducible-install mechanism even without a tag.

---

## Per-skill version history

### Session

#### `log-session`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.0 | 2026-06-19 | — | New session-journal skill. Appends a structured entry to `docs/LOGS.md` (summary, files, decisions + why, next step) on demand; `model: sonnet` (cheap by design). Ships with free, opt-in `template/.claude/` hooks: SessionEnd mechanical capture + SessionStart marker, and an opt-in SessionStart context-restore — all model-free |

### Repo maintenance

#### `bump-skill`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.0 | 2026-06-19 | — | New repo-maintenance skill. After editing a SKILL.md, bumps `version:`, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates the skills and model tables in README.md + README.es.md |

### User-facing

#### `ship-roadmap`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.1.0 | 2026-06-19 | minor | Done-at-PR-open alignment: `done` flip rides the PR-stage commit; `SHIP: COMPLETE` requires PRs **merged** (not just `done`); dependents unblock on **merge**; REVIEW triages every non-fix-now finding |
| 1.0.0 | 2026-06-10 | — | New autopilot. One upfront interview → founds the project → ships the roadmap feature-by-feature via `/loop` (plan → execute → review → PR → audit). Default human-merge; `--fullauto` dual-keyed with fail-closed safety floors; committed decision record + untracked run log |

#### `execute-phase`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.3.0 | 2026-06-19 | minor | A finished unit (single-pass, `--fix`, final phase) **always opens its PR** + **flips to `done` at PR-open** (built, not merged); end `review-change` hand-off now **mandatory**; fix-index entry kept until merge; next step printed in every mode |
| 1.2.0 | 2026-06-09 | minor | Tests-first on core/orchestration phases; P1 commits planning artifacts separately; never-commit-red protocol (unfixable → `known-issues.md` + stop); plan-divergence rule; `progress.md` continuity |
| 1.1.2 | 2026-06-09 | patch | `/loop` batch-execution pattern documented |
| 1.1.1 | 2026-06-05 | patch | `allowed-tools` added + imperative commit/PR commands (skill now actually commits) |
| 1.1.0 | 2026-06-05 | minor | Every-2-phases review changed from in-turn auto-run to **hand-off** (runs at its own tier) |
| 1.0.0 | 2026-06-05 | — | First versioned release |

#### `plan-feature`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.1.0 | 2026-06-09 | minor | Sizes every feature `XS/S/M/L`; routes small ones to the single-pass path; prints the right next step |
| 1.0.1 | 2026-06-05 | patch | `effort medium → high` (its in-turn planning steps need it) |
| 1.0.0 | 2026-06-05 | — | First versioned release — the planning router (idea / issue / scoped slug / `--next`) |

#### `plan-fix`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.2 | 2026-06-19 | patch | Added `## Done when` — every skill ends by printing the next step |
| 1.0.1 | 2026-06-09 | patch | Forge-agnostic phrasing ("forge CLI per Workflow conventions") |
| 1.0.0 | 2026-06-05 | — | First versioned release — architect-draft a scoped fix SPEC, stop for review |

#### `review-change`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.2.0 | 2026-06-19 | minor | **Mandatory before every merge**; routes **every non-fix-now finding through `triage-issue`** (issue / documented decision / justified drop), never silently lost; prints next step |
| 1.1.0 | 2026-06-09 | minor | SPEC-drift check (diff vs. the governing SPEC's scope + acceptance criteria) |
| 1.0.1 | 2026-06-05 | patch | Wording: `execute-phase` "hands off to" it |
| 1.0.0 | 2026-06-05 | — | First versioned release — platform-adaptive review orchestrator |

#### `audit-pr`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.1.0 | 2026-06-19 | minor | Merge gate strengthened: **never merge with pending docs**; issue/fix-index entry must still be tracked (removed only after merge); `done` ≠ merge-ready; states next step |
| 1.0.3 | 2026-06-09 | patch | Forge-agnostic phrasing |
| 1.0.2 | 2026-06-05 | patch | Reverted `context: fork` (CLI suppressed the skill's output) |
| 1.0.1 | 2026-06-05 | patch | Added `context: fork` (later reverted) |
| 1.0.0 | 2026-06-05 | — | First versioned release — PR-level merge gate |

#### `product-audit`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.2.1 | 2026-06-19 | patch | Prints an explicit next step (batch `triage-issue` → `plan-feature`/`plan-fix`) |
| 1.2.0 | 2026-06-14 | minor | `model: fable → opus` (Fable no longer available; Opus at `effort: max` is the equivalent sweep tier) |
| 1.1.0 | 2026-06-09 | minor | `model: opus[1m] → fable` (Fable 5 native 1M context) — later reversed in 1.2.0 |
| 1.0.3 | 2026-06-05 | patch | Reverted `context: fork` |
| 1.0.2 | 2026-06-05 | patch | `model: opus → opus[1m]` + `context: fork` |
| 1.0.1 | 2026-06-05 | patch | Provisional `ultracode` tip (user-enabled session setting) |
| 1.0.0 | 2026-06-05 | — | First versioned release — periodic product-wide health check |

#### `audit-docs`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.4 | 2026-06-19 | patch | Prints an explicit next step |
| 1.0.3 | 2026-06-09 | patch | Forge-agnostic phrasing |
| 1.0.2 | 2026-06-05 | patch | Reverted `context: fork` |
| 1.0.1 | 2026-06-05 | patch | Added `context: fork` (later reverted) |
| 1.0.0 | 2026-06-05 | — | First versioned release — docs ↔ roadmap ↔ code ↔ fix-index coherence |

#### `triage-issue`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.1.1 | 2026-06-19 | patch | Prints an explicit next step per verdict |
| 1.1.0 | 2026-06-09 | minor | Batch triage (`triage-issue 12 14 17`) — independent verdicts, one summary table |
| 1.0.0 | 2026-06-05 | — | First versioned release — classify an issue by verifying its trigger against the code |

#### `init-workspace`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.1.1 | 2026-06-19 | patch | `## Done when` prints the explicit next step |
| 1.1.0 | 2026-06-09 | minor | Detects the **forge** from the remote URL and records it; suggests the platform's companion review skills |
| 1.0.0 | 2026-06-05 | — | First versioned release — adapt the doc scaffold to a project |

### Internal (`user-invocable: false`)

| Skill | Version | Date | Type | What changed |
|---|---|---|---|---|
| `review-implementation` | 1.0.1 | 2026-06-09 | patch | Description shortened 96 → 36 words (always-loaded context); body unchanged |
| | 1.0.0 | 2026-06-05 | — | The findings engine + classification rubric `review-change` composes |
| `plan-feature-interview` | 1.1.0 | 2026-06-09 | minor | Estimates size `XS/S/M/L`; asks for a UI design reference on UI features |
| | 1.0.0 | 2026-06-05 | — | Interview a raw idea into a SPEC |
| `plan-feature-from-issue` | 1.1.0 | 2026-06-09 | minor | Produces a **sized** scoped SPEC with `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → scoped SPEC |
| `plan-feature-scaffold` | 1.1.0 | 2026-06-09 | minor | Scales artifacts to size — XS/S → SPEC-only; M/L → full set ending in a hardening phase |
| | 1.0.0 | 2026-06-05 | — | SPEC → full planning artifact set + roadmap entry |

---

## Release log (chronological, newest first)

- **2026-06-19 — `log-session` 1.0.0.** New session-journal skill (`docs/LOGS.md`) + free, opt-in `template/.claude/` hooks (mechanical SessionEnd capture, SessionStart marker, opt-in context-restore — all model-free). Set count → 16 skills (12 user-facing + 4 internal).
- **2026-06-19 — `bump-skill` 1.0.0.** New repo-maintenance skill: after editing a SKILL.md, bumps `version:`, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates README.md + README.es.md. Deleted orphaned `docs/features/ROADMAP.md` (fictional e-commerce content, old vocabulary).
- **2026-06-19 — workflow policy.** A unit never ends branch-only and nothing
  non-fix-now is silently lost: finished units **always open the PR** and flip to
  **`done` at PR-open** (built, not merged — merge state lives in the forge);
  `review-change` is **mandatory** before every merge and routes **every non-fix-now
  finding through `triage-issue`**; `audit-pr` **never merges with pending docs** and
  treats `done` ≠ merge-ready; dependents unblock on **merge**, not `done`. New
  repo-wide authoring rule (`CLAUDE.md`): **every skill ends by suggesting the next
  step**. Bumped: `execute-phase` 1.3.0, `review-change` 1.2.0, `audit-pr` 1.1.0,
  `ship-roadmap` 1.1.0, `plan-fix` 1.0.2, `init-workspace` 1.1.1, `audit-docs` 1.0.4,
  `product-audit` 1.2.1, `triage-issue` 1.1.1. Roadmap **and** fix-index legends:
  `done` = *built + PR open*; the fix-index `in-review` status folds into `done`.
- **2026-06-14 — `product-audit` 1.2.0.** `model: fable → opus` (Fable unavailable).
- **2026-06-10 — `ship-roadmap` 1.0.0.** The end-to-end autopilot (set → 14 skills).
- **2026-06-09 — quality batch.** Sizing (`XS/S/M/L`), tests-first, SPEC-drift,
  batch triage, forge-agnostic, `/loop` batch pattern, Deploy & rollback SPEC
  section, Fable 5 for `product-audit`.
- **2026-06-05 — first versioned release.** Every skill stamped `1.0.0`; the earlier
  9-skill → 13-skill consolidation predates formal versioning (see
  [`MIGRATION.md`](docs/workflow/MIGRATION.md)). Same day: composition → hand-off
  across the model/effort boundary, `plan-feature` router → `high`, context-isolation
  experiments (added then reverted).
