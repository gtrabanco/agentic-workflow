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
| 1.3.0 | 2026-07-03 | minor | Artifact-language precedence box added to the turn contract. |
| 1.2.0 | 2026-07-03 | minor | Turn contract at the top (entry actually APPENDED with accurate git facts; no past entry edited; → Next: printed last). |
| 1.1.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.1.0 | 2026-07-02 | minor | Added the Portability section (no hooks → this skill is the only journal writer); `/clear` references generalized to any agent's context reset. |
| 1.0.1 | 2026-06-27 | patch | Closing normalized to the canonical `→ Next:` recommendation block |
| 1.0.0 | 2026-06-19 | — | New session-journal skill. Appends a structured entry to `docs/LOGS.md` (summary, files, decisions + why, next step) on demand; `model: sonnet` (cheap by design). Ships with free, opt-in `template/.claude/` hooks: SessionEnd mechanical capture + SessionStart marker, and an opt-in SessionStart context-restore — all model-free |

### Repo maintenance

#### `bump-skill`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.3.0 | 2026-07-03 | minor | Lint also checks the new `## Turn contract` section on user-facing skills. |
| 1.2.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.2.0 | 2026-07-02 | minor | Lint now also checks that user-facing skills carry the `## Portability` section; added its own Portability note. |
| 1.1.0 | 2026-06-27 | minor | Lint step flags edited skills missing a `→ Next:` block or using `S1`/"Step" phase labels (warns, never auto-fixes) |
| 1.0.0 | 2026-06-19 | — | New repo-maintenance skill. After editing a SKILL.md, bumps `version:`, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates the skills and model tables in README.md + README.es.md |

### User-facing

#### `ship-roadmap`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.7.0 | 2026-07-03 | minor | PR stage is not complete until the roadmap row carries its linked PR number and the URL is printed in the iteration output. |
| 1.6.0 | 2026-07-03 | minor | Artifact-language precedence box added to the turn contract. |
| 1.5.0 | 2026-07-03 | minor | Turn contract at the top (exactly one stage advanced + one run-log line; floors honored; → Next:/banner printed last). |
| 1.4.0 | 2026-07-03 | minor | SELECT is now a fixed priority list: blocking fix-now fixes first, then in-progress stages, then features with a transitively-merged dependency closure (inconsistent statuses → SHIP: STOPPED); the autopilot never passes --force. |
| 1.3.0 | 2026-07-02 | minor | Interview Round 5 locks the project's Git workflow (branches default / worktrees); model-equivalence note. |
| 1.2.0 | 2026-07-02 | minor | Added the Portability section: manual equivalents for `/loop`, subagents, the slash menu, and model routing on non-Claude-Code agents. |
| 1.1.1 | 2026-06-27 | patch | Per-iteration and final-report closings use the canonical `→ Next:` shape; phase-naming consistency (`P1, P2, …`) |
| 1.1.0 | 2026-06-19 | minor | Done-at-PR-open alignment: `done` flip rides the PR-stage commit; `SHIP: COMPLETE` requires PRs **merged** (not just `done`); dependents unblock on **merge**; REVIEW triages every non-fix-now finding |
| 1.0.0 | 2026-06-10 | — | New autopilot. One upfront interview → founds the project → ships the roadmap feature-by-feature via `/loop` (plan → execute → review → PR → audit). Default human-merge; `--fullauto` dual-keyed with fail-closed safety floors; committed decision record + untracked run log |

#### `execute-phase`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.9.0 | 2026-07-03 | minor | PR close-out made explicit: print the PR URL in the chat (not every agent shows open PRs) and record `done · #<pr>` (linked) on the roadmap/fix-index row via a `docs: link PR` commit — a done row without its PR link is an unfinished unit. |
| 1.8.0 | 2026-07-03 | minor | Artifact-language precedence pinned (explicit user instruction > declared docs language > English; conversation language never decides) — turn-contract box + Issue-policy rule. |
| 1.7.0 | 2026-07-03 | minor | Turn contract at the top: branch check, gate, commit sha, push+PR (with mandatory body) actually RUN and pasted — a turn ending without them is failed; push happens exactly once, at the PR step. |
| 1.6.0 | 2026-07-03 | minor | Dependency gate: transitive `Depends on:` closure must be MERGED before any work — fixed BLOCKED block with the unmet chain and build order; new `--force` flag skips the stop (never the check) and logs the override in decisions.md. |
| 1.5.1 | 2026-07-02 | patch | Two conditional phrasings made deterministic (translate-if-not-English; verify-then-create the fix issue). |
| 1.5.0 | 2026-07-02 | minor | Fixed Allowed/Forbidden lists and a "pass only if" phase-completion gate checklist (explicit minimum doc set); honors the declared Git workflow (branches default — never worktrees unless declared); model-equivalence note. |
| 1.4.0 | 2026-07-02 | minor | Added the Portability section; generic fallbacks inline for the review hand-off and a manual alternative to `/loop` batch execution. |
| 1.3.1 | 2026-06-27 | patch | Phases pinned to `P1, P2, …` (never `S1`/"Steps"; normalize a handed-in plan); review hand-off blocks reshaped to the canonical `→ Next:` form |
| 1.3.0 | 2026-06-19 | minor | A finished unit (single-pass, `--fix`, final phase) **always opens its PR** + **flips to `done` at PR-open** (built, not merged); end `review-change` hand-off now **mandatory**; fix-index entry kept until merge; next step printed in every mode |
| 1.2.0 | 2026-06-09 | minor | Tests-first on core/orchestration phases; P1 commits planning artifacts separately; never-commit-red protocol (unfixable → `known-issues.md` + stop); plan-divergence rule; `progress.md` continuity |
| 1.1.2 | 2026-06-09 | patch | `/loop` batch-execution pattern documented |
| 1.1.1 | 2026-06-05 | patch | `allowed-tools` added + imperative commit/PR commands (skill now actually commits) |
| 1.1.0 | 2026-06-05 | minor | Every-2-phases review changed from in-turn auto-run to **hand-off** (runs at its own tier) |
| 1.0.0 | 2026-06-05 | — | First versioned release |

#### `plan-feature`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.5.0 | 2026-07-03 | minor | Artifact-language precedence box added to the turn contract. |
| 1.4.0 | 2026-07-03 | minor | Turn contract at the top (artifacts + roadmap registered; dependency check decides the closing block; → Next: printed last). |
| 1.3.0 | 2026-07-03 | minor | Dependency & blocker check after planning: unmet (transitive) deps or fix-now issues in the same area change the closing → Next: block to recommend the dependency chain / plan-fix first. |
| 1.2.2 | 2026-07-02 | patch | Roadmap confirmation made deterministic: verify number/order/deps and fix the entry immediately if wrong. |
| 1.2.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.2.0 | 2026-07-02 | minor | Added the Portability section; internal-step composition defined generically as running inline in the same conversation. |
| 1.1.1 | 2026-06-27 | patch | Closing normalized to the canonical `→ Next:` recommendation block |
| 1.1.0 | 2026-06-09 | minor | Sizes every feature `XS/S/M/L`; routes small ones to the single-pass path; prints the right next step |
| 1.0.1 | 2026-06-05 | patch | `effort medium → high` (its in-turn planning steps need it) |
| 1.0.0 | 2026-06-05 | — | First versioned release — the planning router (idea / issue / scoped slug / `--next`) |

#### `plan-fix`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.3.0 | 2026-07-03 | minor | Artifact-language precedence pinned in the turn contract and Hard rules. |
| 1.2.0 | 2026-07-03 | minor | Turn contract at the top (SPEC committed on the fix branch with sha pasted, not pushed; hand-off printed; → Next: last). |
| 1.1.2 | 2026-07-02 | patch | Rollback names the data cleanup or states "none"; L-effort escalation is a rule (propose via plan-feature; the user decides), not a "consider". |
| 1.1.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.1.0 | 2026-07-02 | minor | Added the Portability section with the standard non-Claude-Code fallbacks. |
| 1.0.3 | 2026-06-27 | patch | Hand-off normalized to the canonical `→ Next:` recommendation block |
| 1.0.2 | 2026-06-19 | patch | Added `## Done when` — every skill ends by printing the next step |
| 1.0.1 | 2026-06-09 | patch | Forge-agnostic phrasing ("forge CLI per Workflow conventions") |
| 1.0.0 | 2026-06-05 | — | First versioned release — architect-draft a scoped fix SPEC, stop for review |

#### `review-change`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.6.0 | 2026-07-03 | minor | Turn contract at the top (fixed-format report + PASS|FAIL + every finding routed + → Next: printed last). |
| 1.5.0 | 2026-07-02 | minor | Composes the workflow's own internal review pack (`review-*`) — external skills are now optional extras, never dependencies; fixed "Return exactly" output contract ending in PASS|FAIL; model-equivalence note in the description. |
| 1.4.0 | 2026-07-02 | minor | Added the Portability section; "compose in-turn" defined generically as running within the same conversation. |
| 1.3.0 | 2026-06-27 | minor | Recommends `product-audit` when SPEC drift **recurs** across units (not a single finding); closing uses the canonical `→ Next:` block |
| 1.2.0 | 2026-06-19 | minor | **Mandatory before every merge**; routes **every non-fix-now finding through `triage-issue`** (issue / documented decision / justified drop), never silently lost; prints next step |
| 1.1.0 | 2026-06-09 | minor | SPEC-drift check (diff vs. the governing SPEC's scope + acceptance criteria) |
| 1.0.1 | 2026-06-05 | patch | Wording: `execute-phase` "hands off to" it |
| 1.0.0 | 2026-06-05 | — | First versioned release — platform-adaptive review orchestrator |

#### `audit-pr`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.4.0 | 2026-07-03 | minor | Turn contract at the top (fixed verdict block; nothing merged/edited; → Next: printed last). |
| 1.3.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.3.0 | 2026-07-02 | minor | Added the Portability section with the standard non-Claude-Code fallbacks. |
| 1.2.0 | 2026-06-27 | minor | After-merge `→ Next:` block — MERGE-READY points the user at the next unit (`plan-feature --next` / `triage-issue`) so a finished feature never dead-ends at the merge |
| 1.1.0 | 2026-06-19 | minor | Merge gate strengthened: **never merge with pending docs**; issue/fix-index entry must still be tracked (removed only after merge); `done` ≠ merge-ready; states next step |
| 1.0.3 | 2026-06-09 | patch | Forge-agnostic phrasing |
| 1.0.2 | 2026-06-05 | patch | Reverted `context: fork` (CLI suppressed the skill's output) |
| 1.0.1 | 2026-06-05 | patch | Added `context: fork` (later reverted) |
| 1.0.0 | 2026-06-05 | — | First versioned release — PR-level merge gate |

#### `product-audit`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.5.0 | 2026-07-03 | minor | Turn contract at the top (full fixed-format report; report-only; → Next: printed last). |
| 1.4.0 | 2026-07-02 | minor | Sweeps every axis via the internal review pack (no external skill dependencies); model-equivalence note in the description. |
| 1.3.0 | 2026-07-02 | minor | Added the Portability section; the ultracode tip now states the sequential fallback for agents without it. |
| 1.2.2 | 2026-06-27 | patch | Closing normalized to the canonical `→ Next:` recommendation block |
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
| 1.3.0 | 2026-07-03 | minor | Turn contract at the top (fixed report + PASS|FAIL; no unrequested rewrites; → Next: printed last). |
| 1.2.0 | 2026-07-02 | minor | Fixed report format (findings table + checks-run count + PASS|FAIL decision); model-equivalence note. |
| 1.1.0 | 2026-07-02 | minor | Added the Portability section with the standard non-Claude-Code fallbacks. |
| 1.0.5 | 2026-06-27 | patch | Closing normalized to the canonical `→ Next:` recommendation block |
| 1.0.4 | 2026-06-19 | patch | Prints an explicit next step |
| 1.0.3 | 2026-06-09 | patch | Forge-agnostic phrasing |
| 1.0.2 | 2026-06-05 | patch | Reverted `context: fork` |
| 1.0.1 | 2026-06-05 | patch | Added `context: fork` (later reverted) |
| 1.0.0 | 2026-06-05 | — | First versioned release — docs ↔ roadmap ↔ code ↔ fix-index coherence |

#### `triage-issue`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.6.0 | 2026-07-03 | minor | Artifact-language precedence box added to the turn contract (issue comments included). |
| 1.5.0 | 2026-07-03 | minor | Turn contract at the top (per-issue fixed verdict; nothing deferred implemented; → Next: printed last). |
| 1.4.0 | 2026-07-02 | minor | Fixed per-issue verdict format (trigger / checked / evidence / VERDICT / action); model-equivalence note. |
| 1.3.0 | 2026-07-02 | minor | Added the Portability section with the standard non-Claude-Code fallbacks. |
| 1.2.0 | 2026-06-27 | minor | Recommends `product-audit` when the **same inconsistency recurs** across issues; per-verdict closing uses the canonical `→ Next:` block |
| 1.1.1 | 2026-06-19 | patch | Prints an explicit next step per verdict |
| 1.1.0 | 2026-06-09 | minor | Batch triage (`triage-issue 12 14 17`) — independent verdicts, one summary table |
| 1.0.0 | 2026-06-05 | — | First versioned release — classify an issue by verifying its trigger against the code |

#### `init-workspace`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.5.0 | 2026-07-03 | minor | Artifact-language precedence box added to the turn contract; template's Docs language rule now states the precedence. |
| 1.4.0 | 2026-07-03 | minor | Turn contract at the top (scaffold written or decision asked; nothing installed without a yes; → Next: printed last). |
| 1.3.0 | 2026-07-02 | minor | Interview asks the project's Git workflow (branches default / worktrees); reviews declared self-contained — external review skills become optional extras; model-equivalence note. |
| 1.2.0 | 2026-07-02 | minor | Added the Portability section (hooks offer skipped on non-Claude-Code agents, `log-session` noted as the manual alternative). |
| 1.1.2 | 2026-06-27 | patch | Closing normalized to the canonical `→ Next:` recommendation block |
| 1.1.1 | 2026-06-19 | patch | `## Done when` prints the explicit next step |
| 1.1.0 | 2026-06-09 | minor | Detects the **forge** from the remote URL and records it; suggests the platform's companion review skills |
| 1.0.0 | 2026-06-05 | — | First versioned release — adapt the doc scaffold to a project |

### Internal (`user-invocable: false`)

| Skill | Version | Date | Type | What changed |
|---|---|---|---|---|
| `review-implementation` | 1.0.2 | 2026-07-02 | patch | Companion-review reference now points at the internal review pack (`review-*`) |
| | 1.0.1 | 2026-06-09 | patch | Description shortened 96 → 36 words (always-loaded context); body unchanged |
| | 1.0.0 | 2026-06-05 | — | The findings engine + classification rubric `review-change` composes |
| `plan-feature-interview` | 1.2.0 | 2026-07-02 | minor | Fixed completion report returned to the router (dimensions resolved, open questions, tracking issue) |
| 1.1.0 | 2026-06-09 | minor | Estimates size `XS/S/M/L`; asks for a UI design reference on UI features |
| | 1.0.0 | 2026-06-05 | — | Interview a raw idea into a SPEC |
| `plan-feature-from-issue` | 1.2.0 | 2026-07-02 | minor | Fixed completion report returned to the router (verdict, gaps closed, Closes #N wired) |
| 1.1.0 | 2026-06-09 | minor | Produces a **sized** scoped SPEC with `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → scoped SPEC |
| `plan-feature-scaffold` | 1.3.0 | 2026-07-03 | minor | Generated TASKS.md final phase ends with literal close-out tasks: open PR + print URL in chat, link the roadmap row, commit & push the link. |
| 1.2.0 | 2026-07-02 | minor | Fixed completion report (artifacts written, roadmap registration, phase count, open questions) |
| 1.1.1 | 2026-06-27 | patch | Phase naming pinned to `P1, P2, …` ("phases") across PLAN/TASKS/progress — never `S1`/"Steps" |
| | 1.1.0 | 2026-06-09 | minor | Scales artifacts to size — XS/S → SPEC-only; M/L → full set ending in a hardening phase |
| | 1.0.0 | 2026-06-05 | — | SPEC → full planning artifact set + roadmap entry |

| `review-code` | 1.0.0 | 2026-07-02 | — | Internal review pack: correctness + simplification checklist pass (fixed findings table + PASS|FAIL) |
| `review-security` | 1.0.0 | 2026-07-02 | — | Internal review pack: security checklist pass (secrets, injection, authn/authz, PII, deps) |
| `review-verify` | 1.0.0 | 2026-07-02 | — | Internal review pack: run-it verification — gate + real behavior executed, manual items listed |
| `review-debt` | 1.0.0 | 2026-07-02 | — | Internal review pack: tech-debt inventory, every finding with a re-trigger condition |
| `review-design` | 1.0.0 | 2026-07-02 | — | Internal review pack: UI/UX checklist vs the project's design doc (states, reuse, responsive) |
| `review-a11y` | 1.0.0 | 2026-07-02 | — | Internal review pack: accessibility checklist (semantics, keyboard, focus, contrast, ARIA) |
| `review-brand` | 1.0.0 | 2026-07-02 | — | Internal review pack: brand & copy checklist (voice, glossary, honest claims) |
| `review-perf` | 1.0.0 | 2026-07-02 | — | Internal review pack: performance checklist (N+1s, complexity, leaks, asset weight) |
| `review-seo` | 1.0.0 | 2026-07-02 | — | Internal review pack: SEO checklist (metadata, canonical, indexability, structured data) |
---

## Release log (chronological, newest first)

- **2026-07-03 (4) — explicit PR close-out.** Field evidence (Hermes runs left
  roadmap rows as bare `done` while Claude runs produced `done · #51`): opening
  the PR now has a spelled-out close-out — **print the PR URL in the chat**
  (not every agent shows open PRs) and **link the roadmap/fix-index row**
  (`done · [#<pr>](url)` via a `docs: link PR` commit). Generated TASKS.md ends
  with these as literal ticked tasks. execute-phase 1.9.0,
  plan-feature-scaffold 1.3.0, ship-roadmap 1.7.0.

- **2026-07-03 (3) — artifact-language precedence.** Open models writing PRs and
  issues in the conversation's language (Spanish prompt → Spanish PR) is now
  blocked by a pinned precedence, stated in the turn contracts of every
  artifact-writing skill: **explicit user instruction > the project's declared
  docs language > English — the conversation language never decides.** Bumps:
  execute-phase 1.8.0, plan-fix 1.3.0, plan-feature 1.5.0, triage-issue 1.6.0,
  ship-roadmap 1.6.0, log-session 1.3.0, init-workspace 1.5.0; the template's
  Docs-language rule now states the precedence.

- **2026-07-03 (2) — turn contracts (weak-model reliability).** Field testing on
  open models surfaced dropped end-of-turn duties: implemented-but-uncommitted
  work, PRs not opened or opened without a body, work on the default branch,
  missing closing blocks. Every user-facing skill now OPENS with a
  **`## Turn contract`** — the boxes each invocation must tick before the turn
  may end; `execute-phase` 1.7.0's is the strictest (branch check → gate →
  commit sha → push+PR with mandatory body, all actually RUN and pasted; push
  exactly once, at the PR step). New CLAUDE.md authoring rule + bump-skill lint.
  Minor bumps: execute-phase 1.7.0, review-change 1.6.0, audit-pr 1.4.0,
  product-audit 1.5.0, audit-docs 1.3.0, triage-issue 1.5.0, plan-feature 1.4.0,
  plan-fix 1.2.0, init-workspace 1.4.0, log-session 1.2.0, ship-roadmap 1.5.0,
  bump-skill 1.3.0.

- **2026-07-03 — dependency safety.** `execute-phase` 1.6.0 gains a hard
  **dependency gate**: the transitive `Depends on:` closure must be merged
  before any work starts — unmet chains print a fixed BLOCKED block with the
  build order, and the new `--force` flag overrides the stop (logged in
  `decisions.md`, never silent). `ship-roadmap` 1.4.0's SELECT becomes a fixed
  priority list (blocking fix-now fixes → in-progress stages → features with a
  transitively-merged closure; inconsistent roadmap statuses stop the run;
  `--force` is forbidden to the autopilot). `plan-feature` 1.3.0 checks deps and
  blocking fix-now issues after planning and routes the closing block to the
  dependency chain / `plan-fix` first.

- **2026-07-02 — strict, model-agnostic workflow + own review pack.** Three new
  `CLAUDE.md` authoring rules: **checklists over heuristics + fixed output
  contracts** (every verdict ends in PASS|FAIL / MERGE-READY|BLOCKED; Allowed/
  Forbidden lists bound scope; "if needed" is banned), **self-contained reviews**
  (the new 9-skill internal pack `review-code/-security/-verify/-debt/-design/
  -a11y/-brand/-perf/-seo` covers every axis — external skills are optional
  extras, never dependencies), and a **model-equivalence contract** (Claude tiers
  stay the defaults; the README maps them to generic capability classes and every
  user-facing description says to edit `model:`/`effort:` for non-Claude models).
  Projects now also declare their **Git workflow** (branches default — one active
  unit, no worktrees — or worktrees) in the template, the `init-workspace`
  interview and `ship-roadmap` Round 5. Bumps: `execute-phase` 1.5.0,
  `review-change` 1.5.0, `product-audit` 1.4.0, `init-workspace` 1.3.0,
  `triage-issue` 1.4.0, `audit-docs` 1.2.0, `ship-roadmap` 1.3.0; description
  patches: `plan-feature` 1.2.1, `plan-fix` 1.1.1, `audit-pr` 1.3.1,
  `log-session` 1.1.1, `bump-skill` 1.2.1; 9 new internal skills at 1.0.0.

- **2026-07-02 — portability hardening (agents beyond Claude Code).** New
  `CLAUDE.md` authoring rule: every user-facing skill carries a
  **`## Portability (agents other than Claude Code)`** section — the workflow is
  the contract, Claude Code features (slash menu, per-skill `model:`/`effort:`,
  `/loop`, subagents, hooks) are conveniences with explicit generic fallbacks
  (no slash menu → follow the target `SKILL.md` in a fresh conversation; no model
  tiers → strongest model for planning/review/audit, cheaper for execution, never
  review with a weaker model than wrote the change; no `/loop`/subagents → manual
  re-invocation guided by the closing `→ Next:` block). Claude Code-specific
  references in skill bodies are now paired inline with their generic equivalent.
  Minor bumps across the set: `execute-phase` 1.4.0, `review-change` 1.4.0,
  `ship-roadmap` 1.2.0, `log-session` 1.1.0, `product-audit` 1.3.0,
  `plan-feature` 1.2.0, `plan-fix` 1.1.0, `audit-pr` 1.3.0, `audit-docs` 1.1.0,
  `triage-issue` 1.3.0, `init-workspace` 1.2.0; `bump-skill` 1.2.0 lints the new
  rule.

- **2026-06-27 — workflow hardening (canonical next-step + phase naming).** Two
  repo-wide authoring rules added to `CLAUDE.md` and applied across the set:
  (1) every skill closes with a **canonical `→ Next:` block** (one recommended
  command + open `·` alternatives) — finishing a unit points at the next unit
  (`plan-feature --next` / a named issue), and a **recurring** inconsistency routes to
  `product-audit`; (2) plan phases are always **`P1, P2, …` ("phases"), never
  `S1`/"Steps"**. New routing: `audit-pr` after-merge next-unit block (1.2.0);
  `review-change` (1.3.0) and `triage-issue` (1.2.0) recommend `product-audit` only on
  *recurring* drift; `bump-skill` (1.1.0) lints both rules. Naming/closing patches:
  `execute-phase` 1.3.1, `plan-feature-scaffold` 1.1.1, `plan-feature` 1.1.1,
  `plan-fix` 1.0.3, `product-audit` 1.2.2, `audit-docs` 1.0.5, `init-workspace` 1.1.2,
  `log-session` 1.0.1, `ship-roadmap` 1.1.1. Both SPEC templates + `template/CLAUDE.md`
  carry the phase-naming convention. Set unchanged at 16 skills.
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
