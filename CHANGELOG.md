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

> **⚠️ Breaking change (v3, 2026-07-04):** the default branch (`main`) is now
> **model-agnostic** — no skill carries `model:`/`effort:` frontmatter; every
> skill inherits whatever model and effort your agent session is already
> using. **If you're on Claude Code and want the hand-tuned, per-skill
> Opus/Sonnet + effort tiers this project shipped by default before v3,
> install the `#claude` branch instead** (`...#claude` below) — the plain
> install command no longer gives you those tiers. `#inheritance` still
> works, kept as an exact alias of the (now model-agnostic) default branch.
> See [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

```sh
# Latest (tracks the repo's default branch — model-agnostic, inherits your
# session's model/effort):
npx skills add gtrabanco/agentic-workflow

# On Claude Code and want the Claude-optimized, hand-tuned per-skill tiers?
npx skills add gtrabanco/agentic-workflow#claude

# Already pinned #inheritance before v3? Still works, unchanged:
npx skills add gtrabanco/agentic-workflow#inheritance

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

### Companion npm packages

#### [`@gtrabanco/agentic-workflow-schema`](packages/agentic-workflow-schema/)
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.1 | 2026-07-05 | patch | `validateEnvelope()` now checks every enum/type the JSON Schema declares (`unit.type`, `pr.state`/`.ci`, `gates.verification`, `blockers[].kind`/`.scope`, array-item types) — previously looser than `envelope.schema.json`, so a malformed value like `blockers[].scope: "planet"` passed silently. Tests added for the structural-validation-failure path through `parseEnvelope()` and CRLF fences. CI (`publish-schema.yml`) migrated to Bun for install/test (`bun install --frozen-lockfile`; `package-lock.json` dropped, `bun.lock` is the sole lockfile) — npm is kept only for the final `npm publish --provenance` step. `LICENSE` added inside the package directory (npm's auto-include only picks up a LICENSE from the published package's own folder). README's JSON-Schema import example fixed to work on the declared `engines.node: ">=18"` (was Node 20.10+/22-only). |
| 1.0.0 | 2026-07-05 | — | First published release. Types, JSON Schema, and `parseEnvelope()`/`validateEnvelope()`/`isTerminal()`/`isRunHalt()` for the agentic-workflow machine envelope. |

### Session

#### `log-session`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.4.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. The logged next step rides the envelope so an orchestrator can resume from the journal. |
| 1.4.0 | 2026-07-04 | minor | `main` no longer carries `model:`/`effort:` frontmatter (moved to `docs/workflow/model-routing.yml`, source of truth for the `#claude` branch); step 7b now points at that file instead of frontmatter that no longer exists on `main`; description's non-Claude guidance replaced with a pointer to `#claude`. |
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
| 1.5.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. Lint gains a 5th rule: user-facing skills must carry the `## Machine envelope` section. |
| 1.3.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 1.3.0 | 2026-07-03 | minor | Lint also checks the new `## Turn contract` section on user-facing skills. |
| 1.2.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.2.0 | 2026-07-02 | minor | Lint now also checks that user-facing skills carry the `## Portability` section; added its own Portability note. |
| 1.1.0 | 2026-06-27 | minor | Lint step flags edited skills missing a `→ Next:` block or using `S1`/"Step" phase labels (warns, never auto-fixes) |
| 1.0.0 | 2026-06-19 | — | New repo-maintenance skill. After editing a SKILL.md, bumps `version:`, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates the skills and model tables in README.md + README.es.md |

### User-facing

#### `generate-docs`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.0 | 2026-07-05 | — | New skill: incremental, diff-driven developer docs into the target project's docs site through a discovered adapter (declaration → Starlight → Docusaurus → plain-markdown fallback; NOT-CONFIGURED → NEEDS_INPUT, never guesses). Fixed page shape + provenance frontmatter (`generated-by`/`source-unit`/`updated`), knowledge map from a project-declared deterministic command only (model never infers edges), opt-in `--review` export of `review-change` reports, verify step (docs build or link check). Never scaffolds a site, never edits source, never commits. |

#### `workflow-status`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.2.0 | 2026-07-09 | minor | Reads the roadmap's five-state machine (`idea / defined / planned / in-progress / done`): a new classification step splits units into `design_candidates` (`idea` rows, next `/design-feature`) vs `startable_now` (status ≥ `defined`, deps met, next command matched to the exact status); new top-level `design_candidates` envelope field alongside `startable_now`/`blocked_units`; legacy plain-`planned` rows with a complete SPEC product half treated as `defined`+`planned` per `MIGRATION.md`. Human summary gains a design-candidates line. |
| 1.1.1 | 2026-07-05 | patch | Review fold on 1.1.0's crash recovery (unreleased): multi-branch envelope-state precedence made explicit (`AMBIGUOUS` > `RESUMABLE` > `CLEAN`, worst wins); the unpushed-commits check now guards for no-upstream branches (the exact mid-crash never-pushed case) instead of erroring on `git log @{u}..`; the example envelope's `detail` now shows the `crash_recovery` key the prose already required. |
| 1.1.0 | 2026-07-05 | minor | Crash recovery: every invocation classifies interrupted turns from ground truth (dirty/unpushed unit branches, phase-ledger vs commits) into a closed verdict — `CLEAN`→OK, `RESUMABLE`→CONTINUE with the resume command, `AMBIGUOUS`→NEEDS_INPUT with options — in a fixed `CRASH RECOVERY` sub-block. New `--last-envelope <json|path>` hint (paste-in-message fallback documented): diffed against recomputed state, never authoritative. No envelope-schema change — existing states only. |
| 1.0.0 | 2026-07-05 | — | New read-only sensor for programmatic orchestration: full feature/fix dependency tree (transitive, met/unmet), startable-now units with build orders, open PRs + audit state, findings pending triage, product-audit recommendation — all in one machine envelope. |

#### `ship-roadmap`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.10.0 | 2026-07-05 | minor | Driver-neutral autopilot: `/loop`, an external orchestrator (envelope-routed), or manual re-invocation are first-class equivalent drivers; EXECUTE runs without subagents via one headless invocation per phase; every iteration ending states WHY (normal one-stage stop vs the exact cap hit). Plus the machine envelope (banner ↔ state mapping). |
| 1.9.0 | 2026-07-04 | minor | Sweep issues + subagent PRs + triage comments use `--body-file` (Markdown), never inline `--body`/heredoc; guardrail added. |
| 1.8.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 1.8.0 | 2026-07-04 | minor | Issue sweep after the last feature: inventory open issues + the run's documented residue (known-issues, trade-offs, postponed findings), triage everything, ship fix-now issues through the same stages — `SHIP: COMPLETE` requires the sweep; clean close-out check (no stage ends with a dirty tree or unpushed commits); AUDIT prints the PR URL next to the verdict. |
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
| 1.15.0 | 2026-07-09 | minor | Dependency gate gains an **own-status precondition**, checked after the dependency closure is met and still before any edit: a unit whose roadmap row is `idea` STOPs and redirects to `/design-feature <slug>`; `defined` STOPs and redirects to `/plan-feature <slug>`; `planned`+ proceeds. `--force` skips the STOP (never the check), recorded in `decisions.md`, same rule as the dependency gate. Legacy plain-`planned` rows with a complete SPEC product half are treated as `defined`+`planned` (no redirect) per `MIGRATION.md`. Machine envelope: `BLOCKED` now also covers the own-status gate, `blockers[]` kind `own-status`. |
| 1.14.1 | 2026-07-09 | patch | Portability's model invariant extended: "never review with a weaker model — and prefer a different model **family** than the writer's" (same-family instances share training blind spots; cross-family decorrelates errors). Wording-only. |
| 1.14.0 | 2026-07-05 | minor | The every-2-phases review checkpoint is now a **recommendation, not a blocking stop**: the closing block recommends `/review-change` with "continue to the next phase" as a listed alternative, and the envelope keeps `state: CONTINUE` at checkpoints (advisory) — `READY_FOR_REVIEW` is reserved for the finished unit. The **end-of-unit review stays mandatory** (feeds `audit-pr`), and the dependency gate is unchanged (still blocks, still requires `--force` to override). `review-change` 1.10.1 cross-references updated. |
| 1.13.1 | 2026-07-05 | patch | "Resuming an interrupted phase" stated as an explicit contract: on entry to a branch with prior work for the requested phase, reconcile `TASKS.md` ticks against evidence and continue from the first unticked task (idempotent re-entry — what `workflow-status`'s `RESUMABLE` verdict relies on); a ledger with no unique next task → stop and report, never guess. Behavior was already Step-0 practice; now it is written. |
| 1.13.0 | 2026-07-05 | minor | Unit close-out hand-off gains a `/generate-docs` alternative — printed only when the project's documentation map declares a `Docs site` block; generated pages ride the unit's PR. |
| 1.12.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. The dependency-gate stop and review checkpoints are now machine-readable (BLOCKED/READY_FOR_REVIEW); batch section gains the external-driver alternative to `/loop`. |
| 1.11.0 | 2026-07-04 | minor | PR/issue bodies passed with `--body-file` (Markdown file), never inline `--body`/heredoc — fixes literal `\`-escaped backticks in generated issues/PRs; turn-contract box 4 + Issue policy rule; commands updated. |
| 1.10.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 1.10.0 | 2026-07-04 | minor | Clean-tree turn-contract box (`git status --porcelain` pasted before ending; docs count); two-regime push policy (after the PR exists, every commit pushes immediately); explicit fold cycle for review/audit findings (gate → commit → push → clean tree, or the fold didn't happen); docs must ride the phase commit. |
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

#### `design-feature`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.1.0 | 2026-07-09 | minor | Now **sets** the roadmap row status, not just reads it: stamping `## Design status: designed` sets the feature's roadmap row to `defined` (the `idea → defined` transition this skill owns) — added at `idea` first if the row didn't exist. `NEEDS_INPUT` leaves both the marker and the row unchanged. Turn contract and Done when gained the matching boxes. |
| 1.0.0 | 2026-07-09 | — | New skill: product definition, split out of `plan-feature`. Folds in the raw-idea interview and walks a fixed **capability-closure** checklist (per entity: CRUD + state transitions, each with UI + API + test, or explicit `n/a: <reason>`; per capability: entry point + ACL; per role: assigned/revoked/viewed) into the SPEC's Product half + Acceptance criteria, stamping `## Design status: designed`. Upserts on re-run (never destroys `decisions.md`); bare `<slug>` reviews and asks, `<slug> "<instruction>"` applies directly. |

#### `plan-feature`
| Version | Date | Type | What changed |
|---|---|---|---|
| 2.1.0 | 2026-07-09 | minor | Redirect gate now keys on the **roadmap status** (the five-state machine) as the primary signal — status `defined`+ proceeds, `idea`/absent STOPs — instead of the SPEC `## Design status` marker. The marker is retained as the **legacy-compat fallback** only, for a pre-migration roadmap row still reading a plain `planned` with no five-state history. See `docs/workflow/MIGRATION.md`. |
| 2.0.0 | 2026-07-09 | major | **Breaking:** product definition (raw-idea interview + capability closure) moves to the new `design-feature` skill. `plan-feature` is engineering-planning only, drops the `--interview` flag and the internal `plan-feature-interview` step (deleted), and gains a **redirect gate with no bypass flag**: an undesigned feature (no `SPEC.md`, `## Design status` not `designed`, or empty Capability closure) STOPS and points at `/design-feature <slug>`. Migration note in `docs/workflow/MIGRATION.md`. |
| 1.6.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. BLOCKED carries the unmet dependency chain and build order. |
| 1.5.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
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
| 1.4.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. |
| 1.3.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
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
| 1.11.0 | 2026-07-09 | minor | Turn contract gains a mandatory context-clean box: the mandatory end-of-unit review must run in a conversation that did NOT implement the change — if it did, STOP and hand off to a fresh one. "When to use" reworded to state the requirement in prose (the pre-existing Portability section already points to feature 04's cross-family model-preference line; unchanged here). |
| 1.10.2 | 2026-07-09 | patch | Portability's model invariant extended: "never review with a weaker model — and prefer a different model **family** than the writer's" (same-family instances share training blind spots; cross-family decorrelates errors). Wording-only. |
| 1.10.1 | 2026-07-05 | patch | Cross-references updated for `execute-phase` 1.14.0: the every-2-phases hand-off is now described as a recommended, skippable checkpoint; the mandatory-before-merge end review is unchanged. |
| 1.10.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. fix-now findings and filed issue numbers ride the envelope; recurring SPEC drift sets the product-audit recommendation flag. |
| 1.9.0 | 2026-07-04 | minor | Guardrail: forge bodies filed via triage-issue are Markdown — don't pre-escape finding text; bodies go through `--body-file`, never inline. |
| 1.8.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 1.8.0 | 2026-07-04 | minor | Workflow-discipline check also verifies git hygiene: a dirty tree (docs included) or commits unpushed to an open PR are fix-now `workflow` findings; the fold route says commit AND push before re-review. |
| 1.7.0 | 2026-07-03 | minor | Mechanical workflow-discipline check at every review (axis `workflow`): commit format, phase labels, per-phase docs, no default-branch commits, artifact language. |
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
| 2.1.0 | 2026-07-05 | minor | On MERGE-READY, posts a dated, SHA-bound **comment on the PR itself** (`gh pr comment --body-file`, idempotent by HTML marker; never a commit-message tag; nothing posted on BLOCKED). Plus the machine envelope (MERGE_READY/MERGED/NEEDS_FIXES/BLOCKED states, verdict + manual checks in `detail`). |
| 2.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 2.0.0 | 2026-07-04 | major | Contract change: opt-in auto-merge — with a documented policy (or explicit user instruction) a MERGE-READY PR is merged after a fail-closed pre-merge checklist (clean tree, nothing unpushed/unpulled, fresh green CI on the audited SHA); anything pending → commit+push, wait for CI, re-audit — never merge on a stale verdict. Verdict header now always prints the PR's full URL. Default behavior unchanged: without the opt-in it still never merges. |
| 1.5.0 | 2026-07-03 | minor | Traceability gate also blocks on a done row missing its linked PR reference. |
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
| 1.7.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. HALT state for critical, stop-the-world findings. |
| 1.6.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 1.6.0 | 2026-07-03 | minor | Explicit Workflow discipline dimension — composes audit-docs checks 1-13 mechanically; never assumes a rule held. |
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
| 1.7.0 | 2026-07-05 | minor | New check 13 — generated-docs provenance (only when a `Docs site` block is declared): pages carrying `generated-by: agentic-workflow/generate-docs` whose `source-unit` no longer exists are orphans (MEDIUM); pages whose unit merged after their `updated` date with commits on their subject paths are stale (LOW). Workflow-discipline block renumbered to 10–14. |
| 1.6.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. |
| 1.5.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| 1.5.0 | 2026-07-03 | minor | Workflow-discipline checks 10-13 (mechanical commands, not inference): phase naming, per-phase doc discipline, branch/PR discipline vs the forge, commit format + dependency closures. |
| 1.4.0 | 2026-07-03 | minor | New check 9: PR-link integrity on `done` rows — every done roadmap/fix-index row carries `done · [#<pr>](url)`; a done with no findable PR is high severity. product-audit inherits it by composing this skill. |
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
| 1.8.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. Per-issue verdicts ride `detail.verdicts`. |
| 1.7.0 | 2026-07-04 | minor | Dated issue comments posted with `gh issue comment --body-file` (Markdown), never inline `--body` — fixes literal `\`-escaped backticks in comments. |
| 1.6.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
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
| 1.8.0 | 2026-07-05 | minor | Interview gains a **Performance tooling** round: per-slot detection checklist (complexity lint / benchmark harness / profiler — TS/JS adapter examples: Biome complexity group or sonarjs+unicorn, vitest bench / mitata / tinybench, `node --cpu-prof` / 0x / `bun --inspect`), user-confirmed installation, and registration in the template's new `Performance commands` block so `review-perf` can measure instead of guess. |
| 1.7.0 | 2026-07-05 | minor | Interview gains a **Docs site** round: record the project's docs website (format/content-dir/build/map commands) in the template's new `Docs site` block so `generate-docs` can write into it; leave it commented out when there is none. Never scaffolds the website. |
| 1.6.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. |
| 1.5.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
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
| `orchestration-envelope` | 1.0.0 | 2026-07-05 | — | New internal contract: the machine-envelope JSON schema (11 states, fixed keys, last-fenced-json parse rule) every user-facing skill emits as its absolute last output. |
| `review-implementation` | 1.1.0 | 2026-07-09 | minor | Phase 1 ("Find") stance is now adversarial by default: "assume the diff is WRONG — your job is to prove it does not work." The axis table and the Phase 2 classification rubric are unchanged. |
| | 1.0.3 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.2 | 2026-07-02 | patch | Companion-review reference now points at the internal review pack (`review-*`) |
| | 1.0.1 | 2026-06-09 | patch | Description shortened 96 → 36 words (always-loaded context); body unchanged |
| | 1.0.0 | 2026-06-05 | — | The findings engine + classification rubric `review-change` composes |
| `plan-feature-interview` | — | 2026-07-09 | removed | **Retired.** Its raw-idea-interview logic moved into the new user-facing `design-feature` skill (product definition is now its own pipeline stage, not an internal `plan-feature` routing detail). `skills/plan-feature-interview/` deleted. See `docs/workflow/MIGRATION.md`. |
| | 1.2.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.2.0 | 2026-07-02 | minor | Fixed completion report returned to the router (dimensions resolved, open questions, tracking issue) |
| 1.1.0 | 2026-06-09 | minor | Estimates size `XS/S/M/L`; asks for a UI design reference on UI features |
| | 1.0.0 | 2026-06-05 | — | Interview a raw idea into a SPEC |
| `plan-feature-from-issue` | 1.4.0 | 2026-07-09 | minor | Now **sets** the roadmap row to `defined` in the same edit that stamps `## Design status: designed` (added at `idea` first if the row didn't exist) — the `idea → defined` transition, performed here when this skill satisfies closure directly rather than handing off to `design-feature`. |
| | 1.3.0 | 2026-07-09 | minor | Now writes the SPEC's **product half** (two-halves convention) and must satisfy **capability closure** before handing off — a thin issue without enough to fill it is handed to `design-feature` (composed in-turn only at ≥ its tier) rather than faking `## Design status: designed`. |
| | 1.2.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.2.0 | 2026-07-02 | minor | Fixed completion report returned to the router (verdict, gaps closed, Closes #N wired) |
| 1.1.0 | 2026-06-09 | minor | Produces a **sized** scoped SPEC with `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → scoped SPEC |
| `plan-feature-scaffold` | 1.6.0 | 2026-07-09 | minor | "Register in the roadmap" now **sets** the row's status to `planned` (the `defined → planned` transition this skill owns) alongside number/ordering/dependencies — an already-`defined` row is promoted; a wholly new row (already-scoped SPEC with no prior entry) is added directly at `planned`. |
| | 1.5.0 | 2026-07-09 | minor | Fills only the SPEC's **engineering half** now — the product half (goal, context, scope, capability closure) is written by `design-feature` / `plan-feature-from-issue` and verified `designed` before this skill ever runs; it stops rather than editing an undesigned or missing product half. |
| | 1.4.0 | 2026-07-04 | minor | Generated TASKS.md close-out task now says `gh pr create --body-file <path>` (Markdown file), never inline `--body`/heredoc — so executors don't emit literal `\`-escaped backticks in the PR body. |
| `plan-feature-scaffold` | 1.3.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.3.0 | 2026-07-03 | minor | Generated TASKS.md final phase ends with literal close-out tasks: open PR + print URL in chat, link the roadmap row, commit & push the link. |
| 1.2.0 | 2026-07-02 | minor | Fixed completion report (artifacts written, roadmap registration, phase count, open questions) |
| 1.1.1 | 2026-06-27 | patch | Phase naming pinned to `P1, P2, …` ("phases") across PLAN/TASKS/progress — never `S1`/"Steps" |
| | 1.1.0 | 2026-06-09 | minor | Scales artifacts to size — XS/S → SPEC-only; M/L → full set ending in a hardening phase |
| | 1.0.0 | 2026-06-05 | — | SPEC → full planning artifact set + roadmap entry |

| `review-code` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: correctness + simplification checklist pass (fixed findings table + PASS|FAIL) |
| `review-security` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: security checklist pass (secrets, injection, authn/authz, PII, deps) |
| `review-verify` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: run-it verification — gate + real behavior executed, manual items listed |
| `review-debt` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: tech-debt inventory, every finding with a re-trigger condition |
| `review-design` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: UI/UX checklist vs the project's design doc (states, reuse, responsive) |
| `review-a11y` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: accessibility checklist (semantics, keyboard, focus, contrast, ARIA) |
| `review-brand` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: brand & copy checklist (voice, glossary, honest claims) |
| `review-perf` | 1.1.0 | 2026-07-05 | minor | Measured evidence: when the project's agent guide declares a `Performance commands` block and the diff touches benchmarked paths, the declared bench command is RUN on base and change and both numbers are cited (`<cmd> → base <x> / change <y> (<±z%>)`); regressions beyond the noise band (declared, else ±5%) are major; a failing bench command is itself a finding. No declared commands → explicit `n/a — no declared perf commands` + a minor adopt-tooling finding when the diff adds algorithmic code on growable input. |
| | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: performance checklist (N+1s, complexity, leaks, asset weight) |
| `review-seo` | 1.0.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch). |
| | 1.0.0 | 2026-07-02 | — | Internal review pack: SEO checklist (metadata, canonical, indexability, structured data) |
---

## Release log (chronological, newest first)

- **2026-07-09 — roadmap status becomes the pipeline's state machine (P1–P3 so
  far).** The roadmap `Status` column is promoted to a five-state machine
  (`idea → defined → planned → in-progress → done`), rewritten in
  `docs/features/ROADMAP.md` and `template/docs/features/ROADMAP.md` with a
  transition diagram and owning skill per edge; legacy-compat rule
  (plain `planned` + complete SPEC product half = `defined`+`planned`) added
  to `docs/workflow/MIGRATION.md`. `workflow-status` 1.2.0 reads the machine
  and classifies `idea` rows as `design_candidates` instead of
  `startable_now`; `execute-phase` 1.15.0 gains an own-status precondition in
  its dependency gate, redirecting a sub-`planned` unit to `/design-feature`
  or `/plan-feature`. The authoring skills now **set** the statuses:
  `design-feature` 1.1.0 and `plan-feature-from-issue` 1.4.0 write `idea →
  defined` when they stamp `## Design status: designed`; `plan-feature-scaffold`
  1.6.0 writes `defined → planned` when it registers the full artifact set;
  `plan-feature` 2.1.0's redirect gate now keys on the roadmap status first,
  with the SPEC marker retained as the legacy-compat fallback. Feature
  `07-roadmap-status-machine` (backlog U4, closes #14) — in progress.

- **2026-07-09 — product definition splits into `design-feature`.** New
  user-facing skill `design-feature` 1.0.0 owns product definition: folds in
  the raw-idea interview, walks a fixed **capability-closure** checklist (per
  entity → CRUD + state transitions + UI + API + test, or explicit `n/a`; per
  capability → entry point + ACL; per role → assigned/revoked/viewed) into
  exhaustive acceptance criteria, and writes the SPEC's **product half**
  (`docs/features/_TEMPLATE/SPEC.md` is now one SPEC in two halves). `plan-feature`
  2.0.0 (**major**, breaking) becomes engineering-planning only: it drops the
  `--interview` flag, gains a **redirect gate with no bypass flag** (undesigned
  feature → STOP → `/design-feature <slug>`), and the internal
  `plan-feature-interview` step is deleted. `plan-feature-from-issue` 1.3.0 and
  `plan-feature-scaffold` 1.5.0 align to the two-halves convention. Migration
  note in `docs/workflow/MIGRATION.md`. Feature `06-design-feature`
  (backlog U3, closes #13).

- **2026-07-09 — adversarial context-clean review.** Hardens the mandatory
  end-of-unit review against the context-sharing failure mode where the
  conversation that wrote a change also reviews it: `review-implementation`
  1.1.0's Phase 1 stance is now adversarial by default ("assume the diff is
  WRONG — prove it does not work"), and `review-change` 1.11.0 gains a
  mandatory turn-contract box requiring the end review to run in a
  conversation that did not implement the change (STOP and hand off
  otherwise). References feature `04-running-economically`'s cross-family
  model-preference line rather than restating it. Feature
  `05-adversarial-context-clean-review`.

- **2026-07-05 — orchestrator crash recovery.** External drivers (REST-only
  Node/opencode servers included) get a safe restart path: `workflow-status`
  1.1.0 classifies interrupted turns from ground truth into
  `CLEAN | RESUMABLE | AMBIGUOUS` (mapped onto existing envelope states — no
  schema release needed) with an optional never-authoritative
  `--last-envelope` hint; `execute-phase` 1.13.1 states idempotent phase
  re-entry as an explicit contract; `docs/workflow/ORCHESTRATION.md` gains
  the Driver restart protocol (append-only envelope journal → sensor →
  route). Feature `03-orchestrator-crash-recovery`.

- **2026-07-05 — measured performance review.** Perf findings graduate from
  "plausible" to "measured": `init-workspace` 1.8.0 interviews for the
  stack's performance tooling (complexity lint, benchmark harness, profiler —
  TS/JS adapter examples named, generic contract for everything else) and
  registers the commands in the template's new `Performance commands` block;
  `review-perf` 1.1.0 runs the declared bench on base and change and cites
  both numbers, with an explicit noise band and an explicit
  `n/a — no declared perf commands` when nothing is declared. Feature
  `02-measured-perf-review`.

- **2026-07-05 — `generate-docs`: the workflow now produces developer
  documentation, not just process artifacts.** New user-facing skill that
  turns a unit's diff into how-to guides on the project's own docs site
  (adapter-discovered; Starlight MDX is the reference, plain markdown the
  fallback), renders a knowledge/call map from a project-declared
  deterministic command (the model never infers graph edges), and can export
  `review-change` reports as pages (`--review`, opt-in). Drift-proofing ships
  with it: `execute-phase` 1.13.0 recommends `/generate-docs` at unit
  close-out when a `Docs site` block is declared, `audit-docs` 1.7.0 detects
  orphan/stale generated pages via provenance frontmatter, and
  `init-workspace` 1.7.0 interviews for the declaration. Feature
  `01-generate-docs`.

- **2026-07-05 — `@gtrabanco/agentic-workflow-schema` 1.0.1: review fixes
  before anyone builds on 1.0.0.** A `review-change` pass on the freshly
  published package found the hand-rolled `validateEnvelope()` was strictly
  weaker than `envelope.schema.json` (missing enum/type checks — a value
  like `blockers[].scope: "planet"` passed silently), plus packaging/CI
  debt: two committed lockfiles with only npm wired into CI, a devDependency
  range that didn't actually pin despite its commit message saying so, a
  missing in-package `LICENSE`, and a README example incompatible with the
  package's own declared `engines.node`. Fixed all of it rather than
  shipping known gaps: full enum/type validation now matches the JSON
  Schema exactly (with tests through the public `parseEnvelope()` API, not
  just the internal validator); CI migrated to Bun for install/test
  (`bun.lock` is now the sole lockfile; npm is kept only for the
  provenance-attested `publish` step); `LICENSE` added inside the package
  directory; README fixed to work on Node 18. Issues #5, #6, #7 closed by
  this fix.

- **2026-07-05 — programmatic orchestration: the machine envelope.** The
  workflow becomes drivable from OUTSIDE any agent — the vendor-neutral
  replacement for Claude Code's `/loop` and subagents. Every user-facing skill
  now ends with a fixed JSON **machine envelope** (11 states, unit/phase/pr/
  findings/blockers/dependencies/next + model-tier hint; schema in the new
  internal `orchestration-envelope` skill); a driver parses it and picks the
  next command and model per step (`docs/workflow/ORCHESTRATION.md` — state
  machine, driver skeleton, subagent replacement). New **`workflow-status`**
  sensor skill: full feature/fix dependency tree, startable-now units with
  build orders, pending fixes/triage, audit states. `audit-pr` 2.1.0 also
  posts a dated, SHA-bound **MERGE-READY comment on the PR** (never a
  commit-message tag). `ship-roadmap` 1.10.0 goes driver-neutral and states
  WHY every iteration ends. 12 skills bumped minor + 2 new skills. The
  contract also ships as the **`@gtrabanco/agentic-workflow-schema`** npm
  package (types + JSON Schema + `parseEnvelope()`), auto-published by CI
  (`publish-schema.yml`) whenever its version bumps — the schema and the
  package change in the same PR, always.

- **2026-07-04 — forge bodies are Markdown, not shell.** Field evidence
  (gtrabanco/webs#198): generated issues/PRs/comments arrived with literal
  `` \`code\` `` — the agent hand-escaped backticks, then passed the body through
  a quoted heredoc / single quotes where the `\` survives into the rendered
  Markdown. Fixed at the source across every skill that writes to the forge:
  the body is written to a file and passed with **`--body-file`**, never an
  inline `--body "…"`/heredoc, with a post-create verification. `execute-phase`
  1.11.0 (PRs + `--fix` issues + turn-contract box), `triage-issue` 1.7.0
  (dated comments), `ship-roadmap` 1.9.0 (sweep issues + guardrail),
  `review-change` 1.9.0 (don't pre-escape finding text), `plan-feature-scaffold`
  1.4.0 (generated TASKS close-out task). The rule is also seeded into the
  template's Workflow conventions (`template/CLAUDE.md`) so every adopting
  project inherits it. Worse on some agents than others — hence the explicit,
  checklist-style rule.
- **2026-07-04 — v3: the default branch becomes model-agnostic.** Breaking
  distribution change. `main` (default install, no `#ref`) is now what used
  to be `#inheritance`: no skill carries `model:`/`effort:` frontmatter, so
  every skill inherits the host agent session's model and effort. The
  previous opinionated, hand-tuned-per-skill distribution moves to a new
  **`#claude`** branch (a frozen snapshot of the pre-v3 `main`, kept current
  by CI from `docs/workflow/model-routing.yml`, the new source of truth for
  its tiers). `#inheritance` keeps working, force-pushed as an exact mirror
  of `main` on every push (`.github/workflows/sync-derived-branches.yml`,
  replacing `sync-inheritance.yml`). Rationale: using this workflow shouldn't
  lock a project into one vendor's model lineup — the user picks the model,
  the skills apply the discipline. All 25 skills bumped (patch, mechanical:
  frontmatter moved + non-Claude description guidance replaced with a
  `#claude` pointer); `bump-skill` 1.4.0 (minor: step 7b now maintains
  `model-routing.yml` instead of frontmatter that no longer exists on
  `main`). See `docs/workflow/MIGRATION.md` for the full upgrade note.

- **2026-07-04 — close-out discipline + issue continuity.** Field evidence:
  runs left review-finding fixes uncommitted/unpushed (found after merge), end-of-unit
  docs sitting dirty, no PR link in the chat, and `ship-roadmap` stopping at the last
  feature while issues stayed open. Fixes: `execute-phase` 1.10.0 (clean-tree
  turn-contract box, push-immediately-after-commit once the PR exists, explicit
  review/audit fold cycle); `review-change` 1.8.0 (dirty tree / unpushed commits =
  fix-now `workflow` findings); `audit-pr` **2.0.0** (verdict always carries the full
  PR URL; opt-in auto-merge — documented policy + fail-closed pre-merge checklist,
  pending work → push, wait for CI, re-audit); `ship-roadmap` 1.8.0 (issue sweep after
  the last feature — inventory + triage of open issues and documented residue, fix-now
  shipped through the same stages, `SHIP: COMPLETE` requires it; per-stage clean
  close-out check).

- **2026-07-03 (5) — the detectors audit the discipline.** The executor skills
  enforce the workflow's rules at write time; now the detector skills verify
  they actually held, mechanically (run the command, never infer — what a
  frontier model assumes, an open model must be told): `audit-docs` 1.5.0 gains
  workflow-discipline checks 10-13 (phase naming, per-phase docs, branch/PR
  discipline vs the forge, commit format + dependency closures);
  `product-audit` 1.6.0 gets an explicit Workflow-discipline dimension
  composing them; `review-change` 1.7.0 runs a mechanical discipline check at
  every checkpoint (axis `workflow`); `audit-pr` 1.5.0 blocks on a done row
  missing its PR link.

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
