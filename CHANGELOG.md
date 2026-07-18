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
| 1.0.2 | 2026-07-12 | patch | Republish only — carries the current README (the #44 envelope field-by-field reference, closed/open `state` routing table, and dynamic-workflow orchestration guide, merged in commit `0087dc6` at `1.0.1`) to npm. That README expansion landed on `main` *after* npm's `1.0.1` was published earlier the same day, so it was stranded unpublished; `publish-schema.yml` republishes only on a version bump. No code, `src/`, `dist/`, or `envelope.schema.json` change. The #33 wording rewrites already shipped in `1.0.1` (verified against the published tarball). |
| 1.0.1 | 2026-07-05 | patch | `validateEnvelope()` now checks every enum/type the JSON Schema declares (`unit.type`, `pr.state`/`.ci`, `gates.verification`, `blockers[].kind`/`.scope`, array-item types) — previously looser than `envelope.schema.json`, so a malformed value like `blockers[].scope: "planet"` passed silently. Tests added for the structural-validation-failure path through `parseEnvelope()` and CRLF fences. CI (`publish-schema.yml`) migrated to Bun for install/test (`bun install --frozen-lockfile`; `package-lock.json` dropped, `bun.lock` is the sole lockfile) — npm is kept only for the final `npm publish --provenance` step. `LICENSE` added inside the package directory (npm's auto-include only picks up a LICENSE from the published package's own folder). README's JSON-Schema import example fixed to work on the declared `engines.node: ">=18"` (was Node 20.10+/22-only). |
| 1.0.0 | 2026-07-05 | — | First published release. Types, JSON Schema, and `parseEnvelope()`/`validateEnvelope()`/`isTerminal()`/`isRunHalt()` for the agentic-workflow machine envelope. |

### Session

#### `log-session`
| Version | Date | Type | What changed |
|---|---|---|---|
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer (driver-injected system-prompt snippet + repair loop); `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
| 1.4.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. The logged next step rides the envelope so an orchestrator can resume from the journal. |
| 1.4.0 | 2026-07-04 | minor | `main` no longer carries `model:`/`effort:` frontmatter (moved to `docs/workflow/model-routing.yml`, source of truth for the `#claude` branch); step 7b now points at that file instead of frontmatter that no longer exists on `main`; description's non-Claude guidance replaced with a pointer to `#claude`. |
| 1.3.0 | 2026-07-03 | minor | Artifact-language precedence box added to the turn contract. |
| 1.2.0 | 2026-07-03 | minor | Turn contract at the top (entry actually APPENDED with accurate git facts; no past entry edited; → Next: printed last). |
| 1.1.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| 1.1.0 | 2026-07-02 | minor | Added the Portability section (no hooks → this skill is the only journal writer); `/clear` references generalized to any agent's context reset. |
| 1.0.1 | 2026-06-27 | patch | Closing normalized to the canonical `→ Next:` recommendation block |
| 1.0.0 | 2026-06-19 | — | New session-journal skill. Appends a structured entry to `docs/LOGS.md` (summary, files, decisions + why, next step) on demand; `model: sonnet` (cheap by design). Ships with free, opt-in `template/.claude/` hooks: SessionEnd mechanical capture + SessionStart marker, and an opt-in SessionStart context-restore — all model-free |

### User-facing

#### `generate-docs`
| Version | Date | Type | What changed |
|---|---|---|---|
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
| 1.0.0 | 2026-07-05 | — | New skill: incremental, diff-driven developer docs into the target project's docs site through a discovered adapter (declaration → Starlight → Docusaurus → plain-markdown fallback; NOT-CONFIGURED → NEEDS_INPUT, never guesses). Fixed page shape + provenance frontmatter (`generated-by`/`source-unit`/`updated`), knowledge map from a project-declared deterministic command only (model never infers edges), opt-in `--review` export of `review-change` reports, verify step (docs build or link check). Never scaffolds a site, never edits source, never commits. |

#### `workflow-status`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.6.1 | 2026-07-14 | patch | Step 11 (untriaged-issue backlog) reworded: the `postponed`/`promoted`/`wontfix` disposition label (owned by `triage-issue`, triage+-permission-gated, unforgeable) is now stated as the **authoritative** triaged signal; the `VERDICT:` comment is kept as an explicit **legacy fallback** for issues triaged before the label existed, with an accepted-residual note (a spoofed comment can still under-count the backlog — no privilege/injection impact, `detail.urgent` untouched). No field-shape change — `detail.untriaged_issues: {count, oldest_open}` is unchanged. Part of fix `#54`. |
| 1.6.0 | 2026-07-13 | minor | New process step 9 (renumbers 9→14 to 10→14): reads each in-flight unit's `review-findings.md` fold ledger and emits its `folded: no` rows as structured `findings.fix_now[]` items `{id, file, axis, severity, class, route, suggested_tier}`, `suggested_tier` derived by a fixed table (severity `high` OR a subtle axis → `strong`; else `cheap`). `next.tier` unchanged. Step 8's "review report present" check now also accepts the ledger's presence as evidence `review-change` ran. Envelope example updated with a populated `fix_now` item. Schema package mirrored (major bump, breaking item-shape change) same PR. Part of feature 17 (`finding-severity-routing`). |
| 1.5.1 | 2026-07-12 | patch | No-progress guard wording precision (review finding on fix #51's PR): the note now names the stall as **suspected**, not a confirmed dropped write — the guard cannot tell from the envelope alone whether the recommended command ran and its write was dropped, or never ran at all. No behavior change. |
| 1.5.0 | 2026-07-12 | minor | Fix #51: no-progress guard on the `--last-envelope` crash-recovery hint — when the hint's `next.recommended` targeted `/plan-feature <slug>`/`/design-feature <slug>` and this run still classifies that same unit at the same pre-advance status (`defined`/`idea`), emit a `workflow_observations` note naming the suspected dropped status write instead of silently repeating the recommendation. Read-only invariant unchanged; the recommendation itself is unaffected. |
| 1.4.0 | 2026-07-12 | minor | Emit-time hardening (#52): turn-contract assertions that `next.recommended` is non-bare and correctly staged, `design_candidates[].next` always routes to `/design-feature`, `recommendations.product_audit`/`next.tier` come from the new mechanical checks/map, and the envelope is emitted on every invocation (incl. same-session follow-ups) after a self-check against the bundled schema. Envelope shape reminders (`blockers[].scope` enum, run/OK incompatibility, `dependencies.unmet` array-of-strings) and a fixed command→tier map added to `## Machine envelope`. Process step 4 maps an unknown roadmap status to `idea` by default (e.g. `scheduled → idea`, cross-ref `#51`); step 10 (product-audit) rewritten as a mechanical two-condition checklist with no invented exception. New Process step surfaces the untriaged open-issue backlog as `detail.untriaged_issues: {count, oldest_open}` (no schema change — `detail` is free-form). |
| 1.3.0 | 2026-07-11 | minor | New `detail.urgent` envelope field: open issues carrying the `urgent`/`fix-next` labels (read only from the JSON `labels` object, never title/body/comment) alongside the in-flight unit's interruptibility facts (phase, dirty/clean, tasks left to the next commit boundary) — reused from the existing phase-progress/crash-recovery reconcile, no new git calls. Presence-only, reports facts, never decides pause-vs-finish. |
| 1.2.0 | 2026-07-09 | minor | Reads the roadmap's five-state machine (`idea / defined / planned / in-progress / done`): a new classification step splits units into `design_candidates` (`idea` rows, next `/design-feature`) vs `startable_now` (status ≥ `defined`, deps met, next command matched to the exact status); new top-level `design_candidates` envelope field alongside `startable_now`/`blocked_units`; legacy plain-`planned` rows with a complete SPEC product half treated as `defined`+`planned` per `MIGRATION.md`. Human summary gains a design-candidates line. |
| 1.1.1 | 2026-07-05 | patch | Review fold on 1.1.0's crash recovery (unreleased): multi-branch envelope-state precedence made explicit (`AMBIGUOUS` > `RESUMABLE` > `CLEAN`, worst wins); the unpushed-commits check now guards for no-upstream branches (the exact mid-crash never-pushed case) instead of erroring on `git log @{u}..`; the example envelope's `detail` now shows the `crash_recovery` key the prose already required. |
| 1.1.0 | 2026-07-05 | minor | Crash recovery: every invocation classifies interrupted turns from ground truth (dirty/unpushed unit branches, phase-ledger vs commits) into a closed verdict — `CLEAN`→OK, `RESUMABLE`→CONTINUE with the resume command, `AMBIGUOUS`→NEEDS_INPUT with options — in a fixed `CRASH RECOVERY` sub-block. New `--last-envelope <json|path>` hint (paste-in-message fallback documented): diffed against recomputed state, never authoritative. No envelope-schema change — existing states only. |
| 1.0.0 | 2026-07-05 | — | New read-only sensor for programmatic orchestration: full feature/fix dependency tree (transitive, met/unmet), startable-now units with build orders, open PRs + audit state, findings pending triage, product-audit recommendation — all in one machine envelope. |

#### `ship-roadmap`
| Version | Date | Type | What changed |
|---|---|---|---|
| 2.2.1 | 2026-07-13 | patch | Portability gains a provider-concurrency guardrail: cap parallel subagents/headless executors at the provider's documented parallel-request limit per API key (leaving a slot for the conductor), and reduce parallelism on a 429 instead of retrying at full fan-out. Guidance only — no stage or contract change. |
| 2.2.0 | 2026-07-11 | minor | SELECT gains a new top priority: reads `workflow-status`'s `detail.urgent` (labels-only) first — an open `fix-next` issue jumps to head of queue (no interrupt); an open `urgent` issue runs the canonical pause-vs-finish rubric in `docs/workflow/ORCHESTRATION.md` (referenced, never forked) against the in-flight unit's interruptibility facts, `INTERRUPT_NOW` parking it, `FINISH_FIRST` queuing the fix for next iteration. Priority list renumbered. |
| 2.1.0 | 2026-07-10 | minor | REVIEW stage: for `L`/sensitive-flagged features, every `review-change` invocation (checkpoint or end review) now runs with `--adversarial 2` — a hard floor, unattended, deliberately **not** aligned with `review-change`'s own interactive advisory checkpoint. XS/S/non-sensitive-M unchanged (single-reviewer). |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer (driver-injected system-prompt snippet + repair loop, see `orchestration-envelope`); `workflow-status` remains the sole inline emitter. Driver-loop prose rephrased to reference the driver-injected envelope generically. See `docs/workflow/MIGRATION.md`. |
| 1.11.0 | 2026-07-09 | minor | Complies with the roadmap status machine instead of exempting itself: founding is documented as **batch design** (interview rounds 2–4 are the product-definition answers), so founding writes feature rows at `idea` (the founding-scaffolded feature 01 lands directly at `planned`). New **DESIGN** stage: a mid-run `idea`/`defined` unit gets JIT design composing `design-feature` + `plan-feature-scaffold` in-turn, **derived strictly from the locked `SHIP_DECISIONS.md` record — no new questions** — promoting `idea → defined → planned` before PLAN. Undesignable-from-record → parked (`blockers[]` kind `undesignable`, `needs_input` records the gap), `state` stays `CONTINUE` (a per-unit park, not a run halt); SELECT moves to the next startable unit. Stage sequence, model routing, and stop-conditions tables updated to include DESIGN. |
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
| 2.5.1 | 2026-07-18 | patch | Fix #66: clarified the descope guard's amendment-backfill step — after creating the follow-up issue and linking it in the issue body, explicitly edit the `## Amendments` row to replace the `#<n>` placeholder with the real issue number and commit that edit; a row still reading the literal placeholder fails `audit-pr`'s symmetric unlinked-row check. |
| 2.5.0 | 2026-07-17 | minor | Fix #66: new **descope guard** in the Issue policy — before creating any issue, classify it discovered-work (file freely) vs. descope (overlaps a SPEC acceptance criterion/phase task not fully delivered); a descope STOPs before the issue is created, requiring a user-approved, dated `## Amendments` entry first (canonical row format defined once here). New Forbidden-list entry and turn-contract box asserting the guard ran on every issue created in the turn. |
| 2.4.1 | 2026-07-17 | patch | Fix #81: the Phase-lint pre-flight guard (added in 2.4.0) gains an explicit legacy-SPEC carve-out — a SPEC with no `## Phases` section skips the guard entirely (no lint, no STOP) and falls through to the pre-existing legacy single-pass flow, restoring fix #64's own backward-compatibility promise. |
| 2.4.0 | 2026-07-17 | minor | Fix #64: new **phase-lint pre-flight guard**, run after the dependency/own-status gates and before any edit — the target phase must pass the canonical 8-box phase-lint (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint") or execute-phase STOPs with a fixed block naming the failed boxes and recommending re-cut via `/plan-feature`/`/plan-fix`; `--force` skips the STOP, never the check, logged in `decisions.md`/`progress.md`. Wired into the Turn contract and Hard rules. |
| 2.3.0 | 2026-07-17 | minor | Fix #65: the fold-cycle section ("Folding review / audit findings") now names the new standalone `/fold-findings` skill as the preferred, independently-invocable path (frozen classification + forbidden list, own turn/tier); the section's own checklist is retained as the in-context / portability fallback. |
| 2.2.0 | 2026-07-13 | minor | The fold-cycle checklist ("Folding review / audit findings") gains a box: each folded finding's row in the unit's `review-findings.md` ledger flips `folded: no → yes` — the one and only ledger state transition, owned solely by this fold cycle. The ledger is optional (a unit with no fix-now findings has none). Part of feature 17 (`finding-severity-routing`). |
| 2.1.0 | 2026-07-11 | minor | Fix #35: single-pass units (XS/S features and fixes) are now **phased** — when the SPEC carries `## Phases` (emitted by `plan-fix` 2.1.0 / `plan-feature-scaffold` 1.8.0), run **one phase per invocation** (`[P<k>]` optional, defaults to the first phase with an unticked task), ticking the SPEC's checkboxes as the execution ledger; the final `Hardening & PR` phase runs the close-out chain (status flip, push, PR, link commit, push) in its own invocation — the chain weak models kept truncating at the tail of the implementation turn. A SPEC without `## Phases` runs the legacy single pass unchanged (the fallback that keeps this minor). Both "this is the last step" step headers reworded to the final-phase shape. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer (driver-injected system-prompt snippet + repair loop, see `orchestration-envelope`); `workflow-status` remains the sole inline emitter. The `/loop` batch-execution external-orchestrator description now references the driver-injected envelope generically instead of an inline emission. See `docs/workflow/MIGRATION.md`. |
| 1.16.0 | 2026-07-10 | minor | New **one phase = one session** rule, stated right before the Batch-execution section: never execute two phases in one conversation on a non-frontier model — the `/loop` batch shape already clears and re-invokes per phase; this is the rule it enforces, paired with the existing manual-re-invoke Portability fallback. |
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
| 2.1.0 | 2026-07-17 | minor | Upsert semantics section now cross-references `audit-pr`'s closure-integrity gate: a legacy SPEC's dated `design-debt` warning is the retrofit trigger, and re-running this skill fills only the missing closure rows via the same upsert-never-destroy path. Part of #78. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. Also removed a dangling self-reference to the deleted section (a `NEEDS_INPUT` cross-pointer). See `docs/workflow/MIGRATION.md`. |
| 1.1.0 | 2026-07-09 | minor | Now **sets** the roadmap row status, not just reads it: stamping `## Design status: designed` sets the feature's roadmap row to `defined` (the `idea → defined` transition this skill owns) — added at `idea` first if the row didn't exist. `NEEDS_INPUT` leaves both the marker and the row unchanged. Turn contract and Done when gained the matching boxes. |
| 1.0.0 | 2026-07-09 | — | New skill: product definition, split out of `plan-feature`. Folds in the raw-idea interview and walks a fixed **capability-closure** checklist (per entity: CRUD + state transitions, each with UI + API + test, or explicit `n/a: <reason>`; per capability: entry point + ACL; per role: assigned/revoked/viewed) into the SPEC's Product half + Acceptance criteria, stamping `## Design status: designed`. Upserts on re-run (never destroys `decisions.md`); bare `<slug>` reviews and asks, `<slug> "<instruction>"` applies directly. |

#### `plan-feature`
| Version | Date | Type | What changed |
|---|---|---|---|
| 3.1.0 | 2026-07-12 | minor | Fix #51: the redirect gate's "`defined` or higher → proceed" branch is now status-specific — only `defined` proceeds to Routing; `planned` (SPEC + artifacts present) **STOPS** and hands off to `/execute-phase <NN> P1` instead of re-scaffolding; `in-progress` STOPS to resume the current phase; `done` STOPS as already-shipped. `--next` now targets the next **`defined`** entry (was `planned`, which is already scaffolded). Turn contract + Done when gained a box asserting a `defined→planned` write was re-read and confirmed before the turn ends. |
| 3.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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
| 2.3.0 | 2026-07-17 | minor | Fix #80: `plan-fix` now accepts multiple issue numbers with fully defined semantics — a fixed 4-box shared-root-cause checklist decides whether they merge into ONE unit (primary = lowest issue number, `Closes #<n>` per issue) or the skill refuses with a verbatim split (`plan these separately`). Single-number invocation unchanged. `argument-hint`, `## Input`, `## Output`, and `## Hand-off` updated to match. |
| 2.2.0 | 2026-07-17 | minor | Fix #64: Algorithm step 12 (Phases) now requires every implementation phase to pass the canonical 8-box phase-lint (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — the authoritative copy) before it is emitted — any FAIL means re-cut or split, never emit unticked. Step 13 (Self-review) gained the matching all-8-boxes assertion. |
| 2.1.0 | 2026-07-11 | minor | Fix #35: every fix SPEC now carries a `## Phases` execution ledger — **always ≥ 2 phases**: `P1..Pn` implementation (each phase cut by the cheap-executability checklist) + final `P(n+1) — Hardening & PR` with the template's literal close-out tasks, never paraphrased. New algorithm step 12 (self-review and hand-off updated); hand-off now points to `execute-phase --fix <n>` executing `P1`. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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
| 2.3.0 | 2026-07-17 | minor | Fix #65: the `Decision: FAIL` `→ Next:` block now recommends the new standalone `/fold-findings` skill (frozen classification, forbidden list closing the known-issues-dump/downgrade/test-loosening/suppression escape hatches) as the fold path, replacing the inline "fold the fix-now findings" prose line; the multi-line fixed shape and the `/audit-pr`/non-fix-now/product-audit sub-bullets are unchanged. |
| 2.2.1 | 2026-07-17 | patch | Step 11's `→ Next:` block now branches explicitly on `Decision`: a `FAIL` block recommends folding the fix-now findings (gate green, commit + push, re-run `/review-change`) with `/audit-pr` demoted to a table-clean sub-bullet, a `PASS` block keeps `/audit-pr — merge gate`; the `/product-audit` recurrence condition is now an explicit yes/no checkbox, and the block must render as multiple literal lines, never `·`-joined prose. Fixes #63 — weak models (observed: qwen3.6-thinking) were copying the old single static template verbatim, recommending the merge gate even on `FAIL`. |
| 2.2.0 | 2026-07-13 | minor | New persist step (process step 9): fix-now findings now append to the unit's fix-now fold ledger `review-findings.md` (fixed schema `\| id \| file:line \| axis \| severity \| class \| route \| folded \|`, `folded` starts `no`), deduped by `file:line`+axis, on an unmerged unit — a merged unit gets no write. `→ Next:` and the Routing section now mention the ledger for fix-now findings. Non-fix-now findings unaffected. Part of feature 17 (`finding-severity-routing`). |
| 2.1.1 | 2026-07-10 | patch | Clarified the N-semantics wording: distinguishes "`--adversarial` flag not passed at all" (single-reviewer, no message) from "`--adversarial` passed without a valid N" (no number, or `< 2` — usage error, falls back to single-reviewer). Fixes a contradiction with `decisions.md` D1, which required the usage error on both the missing-N and N<2 cases. No behavior change to the default no-flag path. |
| 2.1.0 | 2026-07-10 | minor | New opt-in `--adversarial N` mode: N independent, context-clean, diff-only, adversarial reviewers run in parallel (Claude Code subagents / headless invocations / sequential fresh conversations), findings merged and deduped by `file:line`+axis into the existing decision table with a `Reviewers n/N` confidence column, inclusion threshold ≥1 (no quorum). Default OFF; auto-recommended (never forced) for `L`/sensitive-flagged changes. Default no-flag path unchanged. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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

#### `fold-findings`
| Version | Date | Type | What changed |
|---|---|---|---|
| 1.0.0 | 2026-07-17 | — | New skill (fix #65): repairs `review-change`/`audit-pr` fix-now findings one at a time — frozen classification (never reclassifies; a genuine objection produces `DISPUTED` → `/triage-issue`), a fixed forbidden list (no known-issues dump, no `decisions.md` tradeoff note, no test loosening/skipping, no lint-suppression-as-fix, no `TODO` stub, no ticking `folded: yes` without a diff), and a fixed per-finding `FOLDED <sha> \| DISPUTED <reason> \| BLOCKED <missing input>` output contract ending in a `Folded: n/m · Disputed: k · Blocked: j` tally. `execute-phase`'s embedded fold-cycle checklist remains the in-context/portability fallback. |

#### `audit-pr`
| Version | Date | Type | What changed |
|---|---|---|---|
| 3.3.0 | 2026-07-17 | minor | New **scope integrity (descope)** gate in the merge-readiness contract: lists issues born since branch divergence that reference the unit; each must have its acceptance criterion still met **or** a matching, user-approved, dated `## Amendments` entry (keyed off the same log `execute-phase`'s descope guard writes) — else BLOCKER; applies to feature and fix PRs alike, passes trivially when nothing was exported. Turn contract gained a matching box; closing `→ Next:` routes a scope-bleed blocker to the amendment-or-triage decision. Part of #66. |
| 3.2.0 | 2026-07-17 | minor | New **closure integrity** gate in the merge-readiness contract: grep the governing feature SPEC for a `Capability closure` heading (any level); a present block with a blank row or an unmapped non-`n/a` row is a blocker, `n/a: <reason>` passes, absent block yields a dated `design-debt: closure absent, SPEC predates the rule` warning (never a blocker) — fix-governed PRs are always n/a. The warning doubles as the retrofit trigger, routed to `/design-feature <slug>` in the closing block. Turn contract gained a matching box. Part of #78. |
| 3.1.1 | 2026-07-13 | patch | Guardrails cross-reference fix: the MERGE-READY comment now correctly cites Process step 6 (was still pointing at the pre-3.1.0 step 5 after the fold-ledger step renumbering). |
| 3.1.0 | 2026-07-13 | minor | New process step 5 (BLOCKED verdict only): every blocker persists to the **same** fix-now fold ledger `review-findings.md` that `review-change` writes (D4 — one ledger for the fold cycle), severity `high` (a blocker gates the merge by definition), deduped by `file:line`+axis, no write on a merged unit. Remaining process steps renumbered (6→8). Part of feature 17 (`finding-severity-routing`). |
| 3.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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
| 2.1.0 | 2026-07-17 | minor | New **scope-export recurrence** signal in the Workflow discipline dimension: ≥ 2 consecutive recent units each with a non-empty `## Amendments` descope log or a descope-classified born issue (`audit-pr`'s scope-bleed gate) is a planning-quality finding ("features cut too big for real capacity"), routed to the atomicity/split rules (#64). Output format gained a worked example under Top findings. Part of #66. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
| 1.8.0 | 2026-07-10 | minor | New "Installed tooling" dimension + process step: inventories installed skills and connected MCP servers, cross-references them against the applicable review axes and the roadmap, and adds a fourth proposal stream ("Tooling: register / re-design") — register a useful unregistered tool in `CLAUDE.md`, or route a scope-affecting discovery to `/design-feature`. Proposes only; never registers or edits `CLAUDE.md`. `detail.proposed_tooling` added to the machine envelope (additive). |
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
| 2.0.1 | 2026-07-11 | patch | Added the missing `argument-hint: "[--fix]"` frontmatter (the `--fix` mode existed in the body but was invisible in agents' slash menus) — part of #43, the invocation & arguments reference in `docs/workflow/SKILLS.md`. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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
| 2.3.0 | 2026-07-18 | minor | Adds open-unit awareness (consumer-side complement of `#66`): a scope-membership check runs before classification (enumerate open units → both-sides-quoted issue↔SPEC/phase comparison) and a fifth verdict `fix-in-unit <unit>` resolves member issues on the open unit's own branch — fold into its `review-findings.md` ledger (provenance-marked `triage #<n> <date>` row) or its current/next phase, an incremental replan (`design-feature`/`plan-feature`/a SPEC `## Amendments` entry), or a scope-bleed restore. Non-member issues route byte-for-byte unchanged. Fixes `#86`+`#87`. |
| 2.2.0 | 2026-07-14 | minor | Owns a second label vocabulary — terminal-disposition labels (`postponed` `#BFD4F2`, `promoted` `#C2E0C6`, `wontfix`): applies the matching label — creating it via `gh label create` if missing — as part of a `postpone`/`promote`/`wontfix` verdict, mirroring the urgency-label mechanics. Closes the untriaged-detection spoof gap from `#54` by giving `workflow-status` an unforgeable, triage+-permission-gated triaged signal instead of trusting `VERDICT:` comment text alone. |
| 2.1.0 | 2026-07-11 | minor | Owns the injection-safe urgency label vocabulary (`urgent` `#B60205`, `fix-next` `#D93F0B`): applies the correct label — creating it via `gh label create` if missing — as part of a fix-now + high-severity verdict, never from issue title/body/comment text. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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
| 2.2.0 | 2026-07-11 | minor | Seeds the injection-safe `urgent`/`fix-next` labels (`gh label create`, create-if-missing) in bootstrap mode's Process (new step 7); upgrade mode adds whichever is missing additively (new step 6, never touching a label the project already customized). Never redefines the vocabulary — `triage-issue` stays the sole owner. Forge unavailable → skip and report as a residual, never fail the scaffold. |
| 2.1.1 | 2026-07-10 | patch | `description:` now names upgrade mode and adds its trigger phrases ("upgrade my scaffold", "migrate my substrate to the current template", "bring my CLAUDE.md up to date with the template") — the loader metadata was silent about the mode 2.1.0 added, so it wasn't reliably discoverable by natural-language request. No behavior change. |
| 2.1.0 | 2026-07-10 | minor | Adds an **upgrade mode**: on a repo Step 0 recognizes as an existing agentic-workflow scaffold, offers upgrade alongside merge/adapt/abort — diffs the substrate against the current `template/`, reads `docs/workflow/MIGRATION.md`, proposes only the missing blocks via a short discovery-defaulted interview, and never rewrites a tailored block (additive-only, never-clobber). Hardens the four failure edges (no-drift, `MIGRATION.md`-absent, tailored-block, bootstrap-unchanged). Bootstrap mode is byte-for-byte unchanged. See `docs/workflow/MIGRATION.md`. |
| 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. See `docs/workflow/MIGRATION.md`. |
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
| `bump-skill` | 2.1.0 | 2026-07-11 | minor | Fix #40: reclassified `user-invocable: false` — the skill is repo-maintenance for `agentic-workflow` itself and its `/bump-skill` menu entry was pure noise for the ~99% of consumers who don't author this pack's `SKILL.md` files. Behavior unchanged; still run via the Skill tool or by following `SKILL.md` directly. Per-skill table moved from "Repo maintenance" (User-facing-adjacent) to this Internal section. |
| | 2.0.0 | 2026-07-10 | major | **Breaking:** dropped the `## Machine envelope` section and its turn-contract emission clause — the envelope contract moved to the orchestration layer; `workflow-status` remains the sole inline emitter. Also retired the now-obsolete "Machine envelope" lint rule (it required every user-facing skill to carry the section — no longer true). See `docs/workflow/MIGRATION.md`. |
| | 1.5.0 | 2026-07-05 | minor | Machine envelope: every invocation now ends with a fixed JSON block (state, unit, phase, pr, findings, blockers, dependencies, next + model-tier hint) for programmatic orchestration — schema in the internal `orchestration-envelope` skill, protocol in `docs/workflow/ORCHESTRATION.md`. Lint gains a 5th rule: user-facing skills must carry the `## Machine envelope` section. |
| | 1.3.1 | 2026-07-04 | patch | No behavior change: this skill's `model:`/`effort:` frontmatter moved to `docs/workflow/model-routing.yml` (used only to build the `#claude` branch); the description's non-Claude guidance was replaced with a pointer to `#claude`. |
| | 1.3.0 | 2026-07-03 | minor | Lint also checks the new `## Turn contract` section on user-facing skills. |
| | 1.2.1 | 2026-07-02 | patch | Model-equivalence note in the description (edit model:/effort: for non-Claude / free-inference models). |
| | 1.2.0 | 2026-07-02 | minor | Lint now also checks that user-facing skills carry the `## Portability` section; added its own Portability note. |
| | 1.1.0 | 2026-06-27 | minor | Lint step flags edited skills missing a `→ Next:` block or using `S1`/"Step" phase labels (warns, never auto-fixes) |
| | 1.0.0 | 2026-06-19 | — | New repo-maintenance skill. After editing a SKILL.md, bumps `version:`, adds rows to CHANGELOG.md + CHANGELOG.es.md, and updates the skills and model tables in README.md + README.es.md |
| `orchestration-envelope` | 1.2.0 | 2026-07-13 | minor | Structured-outputs shortcut for drivers: when the provider/model supports strict structured outputs (`response_format: json_schema` + `strict`), the envelope-only turn (the repair prompt, or a dedicated final "emit the envelope" turn) may pass the npm package's `envelope.schema.json` as the response format so the reply validates by construction. The repair loop stays as the fallback for models without the feature; working turns never get a response format (it would force the whole output to JSON and suppress prose/tool use). Schema unchanged — no package release needed. |
| | 1.1.1 | 2026-07-10 | patch | Fix #33: the frontmatter description and opening section still stated the pre-feature-10 contract ("every user-facing skill prints the envelope") ABOVE the feature-10 correction — rewritten head-first to the current contract (schema + last-fenced-json parse rule as the core; emission = `workflow-status` always, other skills only under the driver-injected snippet, nothing in interactive sessions). Same stale sentence fixed in `packages/agentic-workflow-schema/README.md`, `package.json`, `src/index.ts`, and `envelope.schema.json` (description/comment/metadata text only, no schema-shape or code-behavior change, no package release needed). |
| | 1.1.0 | 2026-07-10 | minor | New `## Driver system-prompt snippet + repair loop` section: the canonical driver-injected system-prompt snippet (verbatim, fenced) and the repair-loop protocol (parse-fail → re-invoke with "Emit only the machine envelope for the turn above.", one retry, then driver-level FAILED) — the envelope requirement moved here from the 14 user-facing skills' per-skill turn contracts. |
| | 1.0.0 | 2026-07-05 | — | New internal contract: the machine-envelope JSON schema (11 states, fixed keys, last-fenced-json parse rule) every user-facing skill emits as its absolute last output. |
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
| `plan-feature-scaffold` | 1.10.0 | 2026-07-17 | minor | Fix #64: the per-phase checklist (§ "Scale the artifacts") gains a mandatory emit-time **Phase-lint** step — before emitting the phase list, every phase must pass the canonical 8-box phase-lint (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — the authoritative copy); any FAIL is re-cut or split via the existing mandatory-split rule, never emitted. |
| `plan-feature-scaffold` | 1.9.0 | 2026-07-12 | minor | Fix #51: after the `defined → planned` roadmap write, re-read the row and confirm it literally reads `planned`; re-apply the edit on mismatch instead of assuming the write landed. Done when gained the matching re-read-and-confirmed assertion. |
| `plan-feature-scaffold` | 1.8.0 | 2026-07-11 | minor | Fix #35: XS/S stays SPEC-only, but the SPEC's `### Phases` must list **≥ 2 phases with checkbox tasks** — `P1` implementation + final `P2 — Hardening & PR` carrying the literal close-out tasks copied from the fix template; the fixed completion report always states the phase count (the `| single-pass` variant is gone). |
| `plan-feature-scaffold` | 1.7.0 | 2026-07-10 | minor | Phase-cutting is now a **hard gate**, not advisory: an M/L feature MUST split into `Depends on:`-chained features on >~5 phases, a multi-layer/concern phase, or an unresolved design decision, and every emitted phase must pass a four-box cheap-executability checklist (independently checkable · zero open decisions · one concern · gate runs locally). `TASKS.md`/`testing.md` generation now emits command-checkable acceptance criteria as the runnable command, not prose. |
| | 1.6.0 | 2026-07-09 | minor | "Register in the roadmap" now **sets** the row's status to `planned` (the `defined → planned` transition this skill owns) alongside number/ordering/dependencies — an already-`defined` row is promoted; a wholly new row (already-scoped SPEC with no prior entry) is added directly at `planned`. |
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

- **2026-07-18 — triage open-unit awareness (fix 86+87).** MINOR bump for
  `triage-issue` (2.3.0): new scope-membership check before classification and
  a fifth verdict `fix-in-unit <unit>` that resolves an issue already
  belonging to an open unit on that unit's own branch — fold into its
  `review-findings.md` ledger or current/next phase, an incremental replan, or
  a scope-bleed restore — instead of fragmenting scope into a new standalone
  unit. Consumer-side complement of fix 66.

- **2026-07-18 — scope-bleed-guardrail review fold (fix 66).** PATCH bump for
  `execute-phase` (2.5.1): clarified the descope guard's amendment-backfill
  step — after the follow-up issue exists and is linked, the `## Amendments`
  row's `#<n>` placeholder is explicitly replaced with the real issue number
  and the edit committed, so it never fails `audit-pr`'s symmetric unlinked-
  row check. Found and fixed during `review-change` on PR #88.

- **2026-07-17 — scope-bleed-guardrail (fix 66).** MINOR bump for
  `execute-phase` (2.5.0): new descope guard — before creating any issue,
  classify it discovered-work (file freely) or descope (overlaps an unmet
  SPEC acceptance criterion/phase task); a descope STOPs before the issue is
  created, requiring a user-approved, dated `## Amendments` entry first
  (canonical row format defined once here). MINOR bump for `audit-pr`
  (3.3.0): new scope integrity (descope) gate in the merge-readiness
  contract — issues born since branch divergence that reference the unit
  must have their criterion still met or a matching `## Amendments` entry,
  else BLOCKER; feature and fix PRs alike. MINOR bump for `product-audit`
  (2.1.0): new scope-export recurrence signal — ≥ 2 consecutive units
  exporting scope is a planning-quality finding routed to the atomicity/split
  rules (#64). Guardrail #4 (`workflow-status` envelope exposure) deferred to
  #79.

- **2026-07-17 — audit-pr-closure-integrity (fix 78).** MINOR bump for
  `audit-pr` (3.2.0): new closure-integrity gate in the merge-readiness
  contract — a purely mechanical check (grep for a `Capability closure`
  heading, any level) that a feature SPEC's capability closure was actually
  taken and recorded; blocker
  on a blank/unmapped row, `n/a: <reason>` passes, absent block yields a
  dated `design-debt` warning (never a blocker) that doubles as the retrofit
  trigger. Fix-governed PRs are always n/a. MINOR bump for `design-feature`
  (2.1.0): upsert semantics section cross-references the retrofit trigger —
  a re-run fills only the missing closure rows.

- **2026-07-17 — plan-fix-multi-issue-semantics (fix 80).** MINOR bump for
  `plan-fix` (2.3.0): `/plan-fix <n> [<n2> …]` now has fully defined
  multi-issue semantics — a fixed 4-box shared-root-cause checklist decides
  whether multiple issues merge into ONE unit (primary = lowest issue
  number, `Closes #<n>` per issue) or the skill refuses with a verbatim
  split output. Single-number invocation is byte-for-byte unchanged.

- **2026-07-17 — legacy-spec-phase-lint-carveout (fix 81).** PATCH bump for
  `execute-phase` (2.4.1): the Phase-lint pre-flight guard added by fix 64
  had no carve-out for legacy SPECs without a `## Phases` section, so it
  wrongly STOPped on the pre-existing legacy single-pass flow. Added an
  explicit, unconditional skip — checked before the lint step runs — so a
  SPEC with no `## Phases` section falls straight through to the legacy
  flow, restoring fix 64's own backward-compatibility promise.

- **2026-07-17 — phase-atomicity-lint (fix 64).** Turns the "one layer/concern,
  zero open decisions" phase-atomicity prose into a canonical, judgment-free
  8-box phase-lint block, authored once in `docs/fix/_TEMPLATE/SPEC.md`
  `## Phases` (authoritative copy) and quoted verbatim in
  `docs/features/_TEMPLATE/SPEC.md` `### Phases`. MINOR bumps for
  `plan-feature-scaffold` (1.10.0) and `plan-fix` (2.2.0): both emitters now
  require every phase to pass the 8-box lint before it is emitted, re-cutting
  or splitting on FAIL. MINOR bump for `execute-phase` (2.4.0): new
  pre-flight phase-lint guard, run after the dependency/own-status gates and
  before any edit — a FAIL STOPs with a fixed block naming the failed boxes
  and recommending re-cut; `--force` skips the STOP, never the check, logged
  in `decisions.md`/`progress.md`.

- **2026-07-17 — fold-findings-skill (fix 65).** New skill `fold-findings`
  (1.0.0): standalone, independently-invocable repair cycle for
  `review-change`/`audit-pr` fix-now findings — frozen classification, a
  fixed forbidden list closing the known-issues-dump/severity-downgrade/
  test-loosening/suppression escape hatches, and a fixed per-finding
  `FOLDED | DISPUTED | BLOCKED` output contract. MINOR bumps for
  `review-change` (2.3.0: `Decision: FAIL` recommends `/fold-findings`) and
  `execute-phase` (2.3.0: fold-cycle section names it as the preferred path,
  inline checklist kept as fallback). Registered in `model-routing.yml`
  (`opus`/`high`) and `docs/workflow/SKILLS.md` + `SKILLS.es.md`.

- **2026-07-17 — next-block-verdict-branching (fix 63).** PATCH bump for
  `review-change` (2.2.1): step 11's `→ Next:` block now branches explicitly
  on `Decision` — a `FAIL` block leads with folding the fix-now findings
  (gate green, commit + push, re-run `/review-change`), demoting `/audit-pr`
  to a table-clean-gated sub-bullet; a `PASS` block keeps
  `/audit-pr — merge gate`. The `/product-audit` recurrence condition is now
  an explicit yes/no checkbox, and the block must render as multiple literal
  lines, never `·`-joined prose — restores the "checklists over heuristics;
  fixed output formats" contract that a weak model (observed:
  qwen3.6-thinking) was silently violating by copying the old single static
  template verbatim even on `FAIL`.

- **2026-07-14 — triage-disposition-labels P1–P2 (fix 54).** MINOR bump for
  `triage-issue` (2.2.0): owns and applies the terminal-disposition labels
  `postponed`/`promoted`/`wontfix` on their matching verdict, mirroring the
  existing urgency-label mechanics. PATCH bump for `workflow-status` (1.6.1):
  step 11 reworded so that disposition label is the authoritative
  untriaged-check signal, with the `VERDICT:` comment kept as an explicit
  legacy fallback (accepted residual noted) — closes the `#54` untriaged-
  detection spoof gap (comment-text-only trust).

- **2026-07-13 — finding-severity-routing P1–P4 (feature 17).** MINOR bump for
  `review-change` (2.2.0): new persist step writes fix-now findings to a new
  per-unit fix-now fold ledger `review-findings.md` (fixed schema, `folded`
  starts `no`, deduped by `file:line`+axis, no write on a merged unit). MINOR
  bump for `audit-pr` (3.1.0): BLOCKED-verdict blockers persist to the **same**
  ledger (D4 — one list for the fold cycle), severity `high`, same dedupe/gate
  rules. MINOR bump for `execute-phase` (2.2.0): the fold-cycle checklist
  gains a box flipping each folded finding's ledger row `folded: no → yes`.
  MINOR bump for `workflow-status` (1.6.0): reads the ledger and emits
  `findings.fix_now[]` items with a derived `suggested_tier`; `next.tier`
  unchanged. MAJOR bump for `@gtrabanco/agentic-workflow-schema` (2.0.0):
  `EnvelopeFixNowFinding` replaced (`{ref, title, file?}` →
  `{id, file, axis, severity, class, route, suggested_tier}`), types +
  `envelope.schema.json` + tests updated — the remaining phase is P5
  Hardening & PR. PATCH follow-up for `audit-pr` (3.1.1): fixed a stale
  Guardrails cross-reference to Process step 5 left over from the 3.1.0
  renumbering (now correctly cites step 6).

- **2026-07-13 — provider-aware operating guidance (feature 16, NaN
  Builders/OpenAI-compatible inference).** MINOR bump for
  `orchestration-envelope` (1.2.0): drivers may force the machine envelope
  via strict structured outputs (`response_format: json_schema`) on the
  envelope-only turn where the provider supports it, with the repair loop as
  fallback. PATCH bump for `ship-roadmap` (2.2.1): Portability guardrail
  capping parallel executors at the provider's per-key concurrency limit.
  Plus doc-only updates: the README NaN.builders section replaces the
  incorrect "uniform effort dial" claim with a per-model reasoning-control
  matrix, demotes Gemma4 from the agentic execution ladder (XML-format tool
  calling, unvalidated for OpenAI-style harnesses), adds a
  catalog-verification caveat for GLM-5.2 and per-key rate/concurrency
  limits; `GOLDEN_FIXTURE.md` gains a tool-calling smoke test as a model
  precondition for the executor path.
- **2026-07-12 — break the plan-feature replan loop (fix #51).** MINOR bumps
  for `plan-feature` (3.1.0), `plan-feature-scaffold` (1.9.0), and
  `workflow-status` (1.5.0, then a same-day PATCH to 1.5.1): the redirect gate
  now short-circuits on `planned`/`in-progress`/`done` (hand off to
  `/execute-phase`, never re-scaffold) instead of falling through "defined or
  higher"; `--next` retargets to the next `defined` entry;
  `plan-feature-scaffold` re-reads the roadmap row after its `defined →
  planned` write and re-applies on mismatch; `workflow-status` adds a
  read-only no-progress guard that flags a stalled
  `/plan-feature`/`/design-feature` hint via `workflow_observations` instead
  of silently repeating it — the 1.5.1 patch tightened that note's wording to
  say "suspected" stall rather than asserting the recommended command ran
  (review-change finding on the PR).
- **2026-07-12 — workflow-status envelope emit-time hardening (fix #52).**
  MINOR bump for `workflow-status` (1.4.0): turn-contract assertions for a
  non-bare/correctly-staged `next.recommended`, envelope shape reminders and
  a command→tier map, a mechanical (exception-proof) `product_audit`
  trigger, an unknown-roadmap-status → `idea` default mapping, and a new
  `detail.untriaged_issues` backlog field. Fixes two reproduced defects
  (non-actionable recommendations, schema-invalid envelopes) without any
  schema/package change.
- **2026-07-11 — urgency label seeding (feature 15, #42, P4).** MINOR bump
  for `init-workspace` (2.2.0): bootstrap mode seeds the `urgent`/`fix-next`
  labels via `gh label create` (create-if-missing); upgrade mode adds
  whichever is missing additively, never touching a label the project
  already customized. Vocabulary stays owned by `triage-issue`; forge
  unavailable → skipped and reported as a residual, never a scaffold
  failure.
- **2026-07-11 — pause-vs-finish judge + SELECT wiring (feature 15, #42,
  P3).** New canonical `## Urgency: the pause-vs-finish micro-judge` section
  in `docs/workflow/ORCHESTRATION.md` (doc, no `bump-skill`): deterministic
  short-circuit (commit boundary / one-checkbox-from-close / `fix-next`
  bypass) before a cheap-tier, clean-context, tool-less judge with
  closed-binary `FINISH_FIRST | INTERRUPT_NOW` output, schema repair loop,
  rubric-as-system-prompt, and a fail-safe `FINISH_FIRST` default. MINOR bump
  for `ship-roadmap` (2.2.0): SELECT reads `detail.urgent` first —
  `fix-next` → head of queue, `urgent` → runs the referenced (never forked)
  `ORCHESTRATION.md` rubric against the in-flight unit.
- **2026-07-11 — urgency + interruptibility envelope field (feature 15, #42,
  P2).** MINOR bump for `workflow-status` (1.3.0): new `detail.urgent`
  envelope field lists open issues carrying `urgent`/`fix-next` — read only
  from the JSON `labels` object, never title/body/comment — alongside the
  in-flight unit's interruptibility facts (phase, dirty/clean, tasks left to
  the next commit boundary). Presence-only, reports facts, never decides
  pause-vs-finish (that stays the consumer's bounded judge).
- **2026-07-11 — injection-safe urgency label vocabulary (feature 15, #42,
  P1).** MINOR bump for `triage-issue` (2.1.0): owns and applies two
  capability-gated GitHub labels — `urgent` (`#B60205`, evaluate for
  interrupt-now) and `fix-next` (`#D93F0B`, head of the fix queue, never
  interrupts) — on a fix-now + high-severity verdict only, creating the label
  via `gh label create` if the repo lacks it. Urgency is derived exclusively
  from the verdict this skill reaches, never from issue title/body/comment
  text (the injection-safety invariant this feature exists to establish).
- **2026-07-11 — bump-skill reclassified internal (fix #40).** MINOR bump for
  `bump-skill` (2.1.0): `user-invocable: false` and dropped from
  `.claude-plugin/plugin.json`'s `skills` array — the skill is
  repo-maintenance for `agentic-workflow` itself, so its `/bump-skill` menu
  entry was noise for the ~99% of consumers who don't author this pack's
  `SKILL.md` files. No behavior change; still run via the Skill tool. Skill
  counts reconciled across `README.md`, `README.es.md`, and
  `docs/workflow/SKILLS.md` (15 user-facing + 13 internal → 14 + 14). Closes
  #40.
- **2026-07-11 — phased close-out for single-pass units (fix #35).** MINOR
  bumps for `plan-fix` (2.1.0), `plan-feature-scaffold` (1.8.0), and
  `execute-phase` (2.1.0): every fix SPEC and XS/S feature SPEC now carries a
  `## Phases` execution ledger (≥ 2 phases; the final one is always
  `Hardening & PR` with literal close-out tasks), and `execute-phase` consumes
  it one phase per invocation so the close-out chain (push → PR → link commit
  → push) runs in a fresh turn weak models cannot truncate. Legacy SPECs
  without `## Phases` keep the single-pass flow (backward-compatible). Both
  SPEC templates (repo + `template/`) pre-write the final phase; workflow docs
  and the golden-fixture toy SPEC updated to the 2-phase shape. Closes #35.
- **2026-07-10 — init-workspace upgrade mode (feature 13).** MINOR bump for
  `init-workspace` (2.1.0): a repo Step 0 recognizes as an existing
  agentic-workflow scaffold now gets an **upgrade** option alongside
  merge/adapt/abort — diff the substrate against the current `template/`,
  read `docs/workflow/MIGRATION.md`, propose only the missing blocks via a
  short discovery-defaulted interview, never rewrite a tailored block. Four
  failure edges hardened explicitly (no-drift, `MIGRATION.md`-absent,
  tailored-block, bootstrap-unchanged). Bootstrap mode unchanged. Documented
  "updating an existing install" recommendation added to `README.md`,
  `README.es.md`, and `docs/workflow/MIGRATION.md`. Closes #20.
- **2026-07-10 — adversarial multi-reviewer mode (feature 11).** MINOR bump
  for `review-change` (new opt-in `--adversarial N`: N parallel context-clean
  adversarial reviewers, merged/deduped by `file:line`+axis, inclusion ≥1,
  default OFF, auto-recommended for `L`/sensitive) and `ship-roadmap` (its
  unattended REVIEW stage now enables `--adversarial 2` as a hard floor for
  `L`/sensitive features, deliberately not aligned with the interactive
  advisory). `docs/workflow/REVIEW_AND_CLASSIFY.md` documents the mode; no
  change to `review-implementation`, the schema, or the npm package. Follow-up
  PATCH for `review-change` (2.1.1): fixed a wording contradiction with
  `decisions.md` D1 — a bare `--adversarial` with no N now states the usage
  error and falls back to single-reviewer, same as `N < 2`.
- **2026-07-10 — envelope moves to the orchestration layer (feature 10).**
  MAJOR bump for the 14 user-facing skills that carried a `## Machine
  envelope` section (`audit-docs, audit-pr, bump-skill, design-feature,
  execute-phase, generate-docs, init-workspace, log-session, plan-feature,
  plan-fix, product-audit, review-change, ship-roadmap, triage-issue`): the
  section and its turn-contract emission clause are gone — every turn ends
  cleanly for human readers, at the closing `→ Next:` block. `workflow-status`
  is unchanged (still the sole inline emitter — emitting it is its function).
  The contract's new home is `orchestration-envelope` (minor bump: adds the
  canonical driver-injected system-prompt snippet + repair-loop protocol),
  mirrored in `docs/workflow/ORCHESTRATION.md` and
  `docs/workflow/PORTABLE_PROMPT.md`. See `docs/workflow/MIGRATION.md`.
- **2026-07-10 — product-audit installed-tooling sweep (feature 09).**
  `product-audit` 1.8.0 adds an "Installed tooling" dimension: inventories
  installed skills and connected MCP servers, cross-references them against
  the applicable review axes and the roadmap, and proposes registering useful
  unregistered tooling in `CLAUDE.md` or routing a scope-affecting discovery to
  `/design-feature` — proposes only, never registers or edits `CLAUDE.md`.

- **2026-07-10 — phase-cutting economics: hard split rule + cheap-executability
  checklist + criteria-as-commands + one-phase-one-session (P1–P2 of feature
  08).** `plan-feature-scaffold` 1.7.0 replaces the soft "consider splitting"
  with a mandatory split trigger (>~5 phases, multi-layer/concern phase, or an
  unresolved design decision) and a four-box per-phase cheap-executability
  checklist, and now emits command-checkable acceptance criteria as runnable
  commands in `TASKS.md`/`testing.md` instead of prose. Both SPEC templates
  (`docs/features/_TEMPLATE/SPEC.md` + `template/` mirror) carry the same hard
  split rule and criteria-as-commands convention. `execute-phase` 1.16.0 and
  `docs/workflow/FEATURE_WORKFLOW.md` (+ `template/CLAUDE.md`'s Feature
  workflow section, standing in for a nonexistent `template/` mirror) state the
  **one phase = one session** rule for non-frontier executor models.

- **2026-07-09 — roadmap status becomes the pipeline's state machine (P1–P4 so
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
  with the SPEC marker retained as the legacy-compat fallback. `ship-roadmap`
  1.11.0 complies with the machine rather than exempting itself: founding is
  documented as batch design (writes feature rows at `idea`, except the
  founding-scaffolded feature 01 which lands at `planned`); a new DESIGN
  stage JIT-designs a mid-run `idea`/`defined` unit strictly from the locked
  `SHIP_DECISIONS.md` record — no new questions — promoting it to `planned`
  before PLAN; undesignable units are parked (`state: CONTINUE`, run keeps
  going), never guessed or re-asked. Feature `07-roadmap-status-machine`
  (backlog U4, closes #14) — in progress.

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
