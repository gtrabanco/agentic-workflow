# Migration notes

> 🇪🇸 [Versión en español](MIGRATION.es.md)

## 2026-09-03 — the review→fold loop is bounded (two cycles, materiality floor)

**Breaking contract; `review-change` 3.0.0, `loop-review-fold` 4.0.0.**

The infinite review/fold loop observed on units #28 and #157 is closed
structurally — four independent bounds, none of them a relaxation of a real
gate:

- **`low` findings no longer block or persist.** Only `high`/`med` fix-now rows
  reach the fold ledger and can produce `REVIEW-FAIL`. A `low` finding is a
  report-only note (the finders' "minor findings never block" rule, now intact
  through classification). If you scripted against "any fix-now row open =
  fail", read the severities now.
- **Workspace state is a precondition.** A dirty tree or a branch ahead of its
  remote stops the review as `REVIEW BLOCKED — workspace state` **before any
  pass runs** — it is no longer a persisted `workflow` finding, and
  `review-change` commits its own findings ledger append (pushed with an open
  PR) so a review never leaves the dirt it would next be judged against. On
  `REVIEW-PASS` with an open PR no ledger write happens: the SHA-bound receipt
  is the durable record.
- **Folded rows are re-verified, not re-reported.** A re-review reads the fold
  ledger first, states its cycle number, and re-checks every `folded: yes` row
  at its cited location; a re-report is legitimate only as `regression of <id>`
  or `DISPUTED`.
- **Two review→fold cycles per unit, hard cap.** `loop-review-fold` counts
  cycles unit-level (family-agnostic) from `REVIEW-RAN` marks and receipts. A
  third cycle never starts — the residue routes to `triage-issue
  --prioritize-now` or the user with the `CONVERGENCE-ANOMALY` diagnosis.

No flags changed. Skills that consumed `review-change`'s decision need no
change; only consumers that assumed every persisted row can block must now
filter on severity. Planning-review findings keep their resolution map (which
`review-spec`/`review-plan` 1.4.0 now print verbatim): `product` →
`design-feature`, `plan` → `plan-feature`/`plan-fix`, `source` → the executor's
fold — `fold-findings` never repairs a planning artifact.

## 2026-08-30 — every route now refuses to start work on an unreviewed plan

**Breaking routing; `workflow-status` 3.0.0, `execute-phase` 4.0.0,
`ship-roadmap` 5.0.0, `loop-review-fold` 3.0.0, `audit-pr` 5.0.0,
`review-change` 2.12.0, `review-implementation` 1.5.0, internal
`pre-execution-review` 1.1.0.**

The gate is no longer only at the authoring hop — it is at the *starting* hop:

- **Recommendations are evidence-staged.** `workflow-status` reads each unit's
  receipt block, recomputes its digest, and labels the stage
  `current | missing | stale | wrong-stage | substitute | self-approved |
  author-readiness | legacy`. A unit without a current PASS for the stage it is about
  to enter leaves `startable_now` and becomes a `gate` blocker naming the review it
  still needs (`detail.pre_execution[]` carries the rows). If you consumed
  `next.recommended` as "status → command", consume it as "status + receipt →
  command".
- **`execute-phase` fails closed.** Between the own-status gate and the acceptance
  manifest sits the pre-execution review gate: no edit on a missing, stale, or
  wrong-stage `PLAN-REVIEW-PASS` (fix units: their own receipt). `--force` does not
  reach this gate — it overrides ordering stops, not a reviewer's verdict. Drivers
  that passed `--force` to get past a planning stop must now run `/review-plan <NN>`.
- **The autopilot has two more stages:** DESIGN → REVIEW-SPEC → PLAN → REVIEW-PLAN →
  EXECUTE → PR → REVIEW → AUDIT, with both reviews in a clean context. `NEEDS-DESIGN`
  parks the unit for the human rather than guessing a product answer; merge policy is
  unchanged.
- **Findings carry an owning stage.** `review-change` reports `plan`- and
  `product`-owned findings with their owner, and `loop-review-fold` refuses to fold
  them: they return to the authoring skill plus a re-review. A second local cycle
  emits `CONVERGENCE-ANOMALY` before editing again.
- **`audit-pr` checks the lineage survived the build**: current plan receipt (+ parent
  spec receipt), all obligation rows `verified`/`n/a`, no open planning finding. A
  `deferred` row without a user-amended governing SPEC blocks. It remains the only
  emitter of `MERGE-READY`.
- **Legacy units adopt, they are not exempt.** `planned`/`in-progress` units from
  before feature 28 get the two ledgers built from their current artifacts and then a
  real `/review-plan`; nothing old is rewritten, no frozen acceptance is touched, and
  execution resumes only on the new PASS. `legacy` ("predates the gate") and `missing`
  ("never reviewed") are reported differently on purpose.
- **Nothing files an issue to close a planning gap** on any of these routes, and an
  obligation cannot be deferred to a follow-up issue unless the user amends the
  governing SPEC first.

## 2026-08-30 — designed is no longer the same as reviewed

**Breaking hand-offs and routing; `design-feature` 3.1.0, `plan-feature` 5.0.0,
`plan-feature-scaffold` 2.0.0, `plan-fix` 3.0.0, `plan-feature-from-issue` 2.0.0,
`review-spec` 1.1.0, and the new `review-plan` 1.0.0 with the internal
`evidence-grounding` 1.1.0 and `pre-execution-review` 1.0.0.** Product authoring and product verdicts now have
different owners. `design-feature` closes its Product half at a deterministic
`READY-FOR-REVIEW` preflight and hands off to `/review-spec <slug>`; it no
longer sends work straight to `plan-feature`. `plan-feature` adds a
Product-review gate after the redirect gate and fails closed with
`PRODUCT-REVIEW GATE … BLOCKED` when the receipt is `missing`, `stale`,
`wrong-stage`, a `substitute` (candidate or verification receipt), `self-approved`,
or present only as `author-readiness`. `plan-feature-from-issue` — name kept for
compatibility — now stops after the Product half instead of exporting an issue
straight into scaffolding.

**Migration.** Nothing on disk is invalidated: an existing `designed` SPEC simply
has no review yet, which is the honest state. Run `/review-spec <slug>` on any
unit you intend to plan; a SPEC written before this change will usually fail
`C2`/`C9` (claims without evidence rows, decisions without a named owner) and
come back as `SPEC-REVIEW-FAIL` for one batched repair in `design-feature`.
Evidence rows are the new expectation: one per material Product claim, with
`authority-kind`, source and location, the revision observed, and a freshness
verdict — an unsampled model capability is `ASSUMPTION-UNVERIFIED`, never a
repository citation. If you drive `plan-feature-from-issue` programmatically,
expect it to stop before the Engineering half; call `plan-feature <slug>` after
the review passes. Direct consumers that asserted the old terminal hand-off must
now assert `/review-spec`.

**Planning gains the same hop on the Engineering side.** Scaffolding and `plan-fix`
now freeze two ledgers with the plan — `planning-evidence.md` +
`planning-obligations.md` for M/L units, `### Planning evidence` + `### Obligations`
embedded in the SPEC for XS/S and fix units — and hand off to `/review-plan <NN>`
(fix: `/review-plan fix-<N>`) instead of `/execute-phase`. `review-plan` sweeps those
ledgers (L1–L6) and the fixed Engineering checks (P1–P12, plus F1–F4 for fixes) in a
context that did not cut the phases, and only its current `PLAN-REVIEW-PASS` lets
`execute-phase` edit anything. A planned unit with no review is a normal, honest
state: run `/review-plan <NN>`. A unit whose obligation rows are blank, `deferred`,
or exported to a follow-up issue fails the review rather than the release; deferring
one requires amending the governing SPEC first. Consumers that asserted
`plan-feature`'s old `/execute-phase` hand-off now assert `/review-plan`, and the
shared review-cycle rules (independence, unioned findings, counter-evidence-only
dismissal, no-progress, the `CONVERGENCE-ANOMALY` report) moved to the internal
`pre-execution-review` owner, so read them there instead of per-skill.

## 2026-08-21 — hybrid machine results and deterministic snapshots

**Breaking driver contract; `@gtrabanco/agentic-workflow-schema` 3.0.0,
`orchestration-envelope` 2.0.1, and `workflow-status` 2.0.0.** The full Envelope v2 is no longer the
requested result for every headless working skill. `workflow-status` retains
it as its stable sensor output; other driven skills use the smaller
SkillOutcome v1. The driver owns deterministic state compilation through
WorkflowSnapshot v1, rather than asking a model to restate repository facts.

**Migration.** Update direct sensor consumers from root `design_candidates`
to `detail.design_candidates`. Replace copied driver prompt text with
`renderOutputInstruction(skill)` and replace ad hoc extraction with
`parseTurn({skill, text, context})`. Keep exactly one same-session repair
using `Emit only the machine result for the turn above.`; the second failure
is driver-level FAILED. `ship-roadmap` remains a native-banner conductor; the
package profiles apply to the worker and sensor skills it invokes. Compile
snapshots from the documents and repository facts already read by the driver,
and route explicit contradictions to
`resolve-repository-state`. Existing sensor-only consumers can keep
`parseEnvelope()` initially, but should move to `parseEnvelopeV2Strict()`
before depending on v2 extensions. The three named compatibility repairs are
diagnostic migration support, not a generic prose parser.

## 2026-08-14 — `loop-review-fold` is a simple review/fold router

**Breaking contract; `loop-review-fold` 2.0.0.** The old bounded conductor
contract and its `--max-cycles` / `--adversarial` loop flags are removed. The
skill now reads persisted evidence and selects exactly one first action:
current `REVIEW-PASS` → stop; a previous review with an open ledger queue →
`fold-findings`; otherwise → `review-change`. A successful fold is followed by
review on the changed HEAD.

Unresolved findings no longer become opaque terminal loop states. Route them to
`triage-issue --prioritize-now <unit> F<k> [F<j> …]`, which must attempt every
named correction immediately. If the smallest correct correction is too large,
the triage route re-runs `plan-feature` or `plan-fix`, appends explicit `P<n>`
phases, and asks the user to execute those phases manually before resuming the
loop. `triage-issue` 2.6.0 adds this review-finding mode.

**Migration.** Replace calls that pass `--max-cycles` or `--adversarial`; the
loop no longer accepts them. Update drivers to persist and expose the current
review receipt and `review-findings.md`. After a fold that cannot close every
row, invoke `triage-issue --prioritize-now` for every remaining finding, follow
the returned plan route, run the new phases manually, and then re-run
`loop-review-fold` on the new HEAD. Do not treat a loop stop with unresolved
findings as merge-ready.

## 2026-08-09 — target-only execution becomes a bounded whole-unit loop

**Breaking default; feature 22, not an extension of feature 21.**
`execute-phase <NN>` and `execute-phase --fix <n>` now execute every remaining
phase, using a fresh worker context and bounded repair attempts per phase. To
retain the previous one-phase behavior, pass the phase explicitly:
`execute-phase <NN> P1` or `execute-phase --fix <n> P1`.

Planning now emits a frozen `ACCEPTANCE.md`. `plan-fix` may group compatible
capability bundles or homogeneous mechanical batches without requiring a shared
root cause/file/severity. Final review should use `loop-review-fold`, which
defaults to two correction cycles and stops on repeated state or required human
input. Discovered independent work is a proposal; no execution, review, or fold
path creates an issue unless the user explicitly requests it.

**Migration.** Update `execute-phase`, the planner/review/fold skills, and the
workspace scaffold together; run `init-workspace` upgrade mode to add the
acceptance templates. Existing units without an acceptance manifest use the
committed SPEC blob as a legacy frozen finish line. Drivers should replace
per-phase default calls with one target-only call, or keep explicit `P<n>` calls
when they intentionally own the phase loop.

## 2026-08-05 — `review-change` posts a SHA-bound receipt; `audit-pr` consumes it

**Feature 21 (workflow-contract-consolidation).** `review-change` 2.10.0 now
ends a clean mandatory final review by posting one idempotent SHA-bound PR
comment carrying `<!-- review-change:pass sha=<40-hex> contract=v1 -->` and
the fixed receipt body (via `--body-file`, never committed to the branch).
`audit-pr` 4.3.0 consumes that receipt as the review evidence instead of
re-reviewing the diff: a current marker is acknowledged, an absent or stale one
is a blocker routed to `/review-change`, and audit never composes a review.
The merge gates narrow to the SPEC's audit-only set (the `Tests` gate and the
acceptance-criteria diff-remapping are replaced by the receipt's fields).

**Migration.** Update the skills **together** — `review-change` and
`audit-pr` must move as one pair. An old `review-change` (no receipt) leaves
`audit-pr` 4.3.0 blocked with no marker at the head: re-run the final review so
the current head carries a receipt before auditing. Do not mix versions: a
receipt posted by 2.10.0 is voided by any later commit, and a pre-receipt
`review-change` has no marker to consume. No merge-authority change — audit-pr
still never merges.

## 2026-07-31 — automated merge moves exclusively to `ship-roadmap --fullauto`


**Breaking.** `audit-pr` 4.0.0 no longer merges under a documented project
policy or a standalone instruction. It always returns a SHA-bound verdict and
posts the existing MERGE-READY comment. `ship-roadmap` 3.0.0 is now the sole
automated merge authority: only an active `--continue --fullauto` invocation
with `merge: fullauto` in `SHIP_DECISIONS.md` may call the repository's
transient wrapper. Direct merge commands remain blocked, and the wrapper logs a
successful automerge with an idempotent PR comment.

**Migration.** Update the skills, then run `init-workspace` in upgrade mode and
accept the safety adapter for the agent that actually runs in the repository.
Do not carry forward agent/session-level `gh pr merge` permissions or a generic
`.automerge` file. Standalone `audit-pr` calls now hand the URL to the human;
existing fullauto drivers must preserve the flag on every iteration and let the
skill invoke `.agentic-workflow/hooks/fullauto-merge.sh`.

## 2026-07-31 — `product-audit` becomes explicit-invocation-only

**Breaking invocation change.** `product-audit` 3.0.0 declares manual-only
activation on Claude Code and disables OpenCode autoinvocation. Its
`/product-audit [path-or-area]` contract is unchanged. Drivers and skills already hand it to the
human because its maximum-effort product sweep must never be composed; they need
no routing change. Natural-language users must now invoke the named skill
explicitly.

## Upgrade path from a pre-2026-07-09 install

The 2026-07-09/07-10 backlog (11 units) landed two **majors** plus several
additive changes. If your install predates this backlog, follow this ordered
path once — the dated notes below remain the detailed record of each step,
this section is just the map.

1. **`plan-feature` 2.0.0 — product definition splits into `design-feature`.**
   The raw-idea interview and the capability-closure checklist moved out of
   `plan-feature` into a new skill, `design-feature`. `plan-feature` is now
   engineering-planning only and **refuses to plan an undesigned feature** (no
   bypass flag) — it redirects to `/design-feature <slug>` instead. Any feature
   whose `SPEC.md` predates this split reads as "undesigned" the next time
   `plan-feature`/`execute-phase` touches it; run `design-feature <slug>` once
   to backfill the product half. See [the dated note](#2026-07-09--plan-feature-200-product-definition-splits-into-design-feature)
   below for the full command muscle-memory table.
2. **The machine envelope moves to the orchestration layer.** 14 user-facing
   skills (every one except `workflow-status`) stopped emitting the trailing
   `## Machine envelope` JSON block unprompted. Interactive use is unaffected;
   a driver/orchestrator now injects the canonical system-prompt snippet from
   `orchestration-envelope` and implements the repair loop itself. See
   [the dated note](#2026-07-10--the-machine-envelope-moves-to-the-orchestration-layer)
   below for what a driver needs to change.
3. **Update the skills, then the substrate.** `npx skills update` (or a fresh
   `npx skills add …`) only ever refreshes skill *behavior*. Run
   **`init-workspace`** afterward — it now detects an existing scaffold and
   enters **upgrade mode**, proposing only the `template/` blocks your project
   is missing (roadmap five-state machine, `--adversarial` review, etc.) —
   never rewriting a block you've already tailored.
4. **Optionally run `product-audit`** to see which newly-available
   *capabilities* — not just docs blocks — now apply to your code.

Everything below this point is the dated, detailed record — read a specific
entry when the summary above isn't enough context to act.

## 2026-07-19 — capability inventory, integration closure & expectation sweep

**What changed.** `design-feature` 2.3.0 attacks the implicit-requirements gap
("add a blog" must imply the ACL permission, the dashboard link, the auth
requirement) with three additions:

- **`docs/CAPABILITIES.md` — the capability inventory** (new template file +
  documentation-map row): the maintained list of the project's roles and
  cross-cutting subsystems (auth, ACL, navigation, notifications, search,
  audit, settings, …). Seeded by `init-workspace` (bootstrap interview or
  upgrade mode), extended additively by `execute-phase` when a phase
  introduces a subsystem/role/permission, freshness-checked by
  `product-audit`.
- **Integration closure** — the SPEC template's `### Capability closure` now
  carries three fixed checklists: the existing entity closure, a new
  integration closure (one resolved row per inventory subsystem — none
  skipped), and a role matrix (every inventory role explicitly
  `allowed`/`denied` per capability). Three new Spec-lint product boxes
  enforce them.
- **`### Expectation sweep`** — a new SPEC section: ≥ 10 (M/L) / ≥ 5 (XS/S)
  domain expectations a human would assume implicitly, each forced to
  in-scope / out-of-scope / deferred.

**Migration.** Additive — nothing breaks. Legacy SPECs without the new
sections stay valid until the next `design-feature <slug>` upsert, which
backfills them (same retrofit path as the original closure rule; `audit-pr`'s
closure-integrity gate keeps treating legacy SPECs as a dated warning, never a
blocker). To adopt: `npx skills update`, then run `init-workspace` (upgrade
mode proposes `docs/CAPABILITIES.md` seeded from discovery) — or copy
`template/docs/CAPABILITIES.md` and fill it by hand.

## 2026-07-10 — `init-workspace` gains an upgrade mode for existing scaffolds

**Additive, non-breaking.** `init-workspace` gains a second mode: on a repo
Step 0 recognizes as an existing agentic-workflow scaffold (marker:
`CLAUDE.md` + `docs/features/ROADMAP.md` or `docs/workflow/`), it now offers
**upgrade** alongside the existing merge/adapt/abort choices. Upgrade mode
fetches the current `template/`, diffs the project's `CLAUDE.md`/`docs/`
substrate against it, reads this file (`MIGRATION.md`) for the rationale
behind each missing block, and proposes **only the blocks the project
lacks** through one short, discovery-defaulted interview — never rewriting a
block the project has already tailored, and never deleting anything.
Bootstrap mode (a bare or foreign repo) is byte-for-byte unchanged.

**Why.** Updating the skills (`npx skills add …` / `npx skills update`) only
ever refreshed *behavior*. Nothing migrated a project's *substrate* — the
`Docs site` block (feature 01), `Performance commands` (02), the five-state
roadmap status machine (07), and every other block a later feature added to
`template/` stayed absent from projects that adopted the workflow earlier.
`product-audit` could detect that drift but never fix it (proposes-only).
Upgrade mode closes that gap.

**Action needed for existing installs.** After updating the skills, run
`init-workspace` once — it now detects your existing scaffold and proposes
the blocks you're missing instead of re-bootstrapping. See the "Updating an
existing install" section in `README.md` / `README.es.md` for the full
ordered path (update skills → read this file → `init-workspace` upgrade →
optional `product-audit`). Nothing is applied without confirmation; skipping
the run leaves your substrate exactly as it is today — no regression, just
missing the newer blocks until you opt in.

## 2026-07-10 — `review-change` gains opt-in `--adversarial N`

**Additive, non-breaking.** `review-change` adds an opt-in `--adversarial N`
flag: N independent, context-clean, diff-only, adversarial reviewers run in
parallel (Claude Code subagents / headless invocations / sequential
fresh-conversation fallback), and their findings are merged and deduped by
`file:line`+axis into the same one decision table the skill already produced,
with a `Reviewers n/N` confidence column and an inclusion threshold of ≥1
reviewer (no quorum). **No flag → nothing changes** — the default single-reviewer
path is byte-for-byte the same as before this capability existed. The mode is
also **auto-recommended (never forced)** in `review-change`'s own output when
a change is `L` or sensitive-flagged, and `ship-roadmap`'s unattended REVIEW
stage now **enables `--adversarial 2` as a hard floor** for `L`/sensitive
features — a policy deliberately distinct from (and not aligned with) that
interactive recommendation, since an unattended run has no human to exercise
skip judgment. Nothing to migrate: no flag removed, no output shape changed,
no action required to keep existing usage working. See
`docs/workflow/REVIEW_AND_CLASSIFY.md` for the practical how/when.

## 2026-07-10 — the machine envelope moves to the orchestration layer

**Breaking change to 14 skills' output contract.** Every user-facing skill
except `workflow-status` — `audit-docs, audit-pr, bump-skill, design-feature,
execute-phase, generate-docs, init-workspace, log-session, plan-feature,
plan-fix, product-audit, review-change, ship-roadmap, triage-issue` — no
longer ends its turn with the `## Machine envelope` fenced JSON block. The
turn-contract box requiring that emission is also removed, and every closing
`→ Next:` block is now the genuine last output of the turn.

**Why.** The envelope's only consumer is an external driver/orchestrator; in
interactive chat the trailing JSON was noise, and weak models — which drop
end-of-document duties by the workflow's own stated reasoning for
front-loading turn contracts — were penalized for omitting a duty a static
`SKILL.md` instruction could never actually enforce or recover from.
Enforcement now sits at the layer that reads the envelope: a driver can
detect a missing envelope and re-ask, something a skill body cannot do for
itself.

**What changed:**

- The `## Machine envelope` section and its turn-contract line are deleted
  from the 14 skills listed above (MAJOR bump each — see `CHANGELOG.md`).
- **`workflow-status` is unchanged** — emitting the envelope inline *is* its
  function (`--json-only` is meaningless without it); it keeps the section.
- **`orchestration-envelope`** (internal, `user-invocable: false`) is now the
  contract's sole home: it gains the canonical **driver-injected
  system-prompt snippet** (verbatim, fenced) and documents the **repair
  loop** (`parseEnvelope()` fails → re-invoke the same session with `Emit
  only the machine envelope for the turn above.`; one retry, then a
  driver-level `FAILED`). Minor bump.
- `docs/workflow/ORCHESTRATION.md` and `docs/workflow/PORTABLE_PROMPT.md`
  mirror the snippet + repair-loop protocol for driver authors.
- The envelope **JSON schema and the `@gtrabanco/agentic-workflow-schema`
  npm package are unchanged** — `parseEnvelope()` and existing drivers keep
  working; only *who* injects the requirement changed, not the schema
  consumers parse.

**Action needed for existing drivers.** A driver that relied on every skill
emitting the envelope unprompted must now inject the canonical system-prompt
snippet (from `orchestration-envelope`) into its invocations, and implement
the repair loop for a turn that comes back without a valid envelope.
`workflow-status` needs neither change — it still emits inline. Drivers that
already inject their own system prompt lose nothing by adding this snippet;
drivers with no prompt-injection mechanism should add one before upgrading
past this point.

## 2026-07-09 — roadmap status becomes the pipeline's state machine

**Non-breaking, backward-compatible.** The roadmap `Status` column is now the
pipeline's single ground-truth state machine — `idea → defined → planned →
in-progress → done` — and the primary gate signal every sensor/executor reads
(`workflow-status`, `execute-phase`'s dependency gate, `plan-feature`'s
redirect gate). Previously only `planned / in-progress / done` existed, which
conflated a thin wishlist row with a fully-planned, execution-ready unit. The
SPEC-local `## Design status` marker (introduced by the `design-feature`
split above) is **retained** as the SPEC-local record and as the legacy-compat
fallback described below — it is not removed.

**Legacy-compat rule.** A roadmap row from before this change — a plain
`planned` status with no `idea`/`defined` history — whose `SPEC.md` product
half is complete (`## Design status: designed`, capability closure filled) is
treated as **`defined`+`planned`**: it is fully executable, no redirect fires,
and no relabelling is required. A legacy `planned` row whose SPEC has no
completed product half (or no SPEC at all) is treated as `idea` and redirected
to `/design-feature <slug>` on its next `execute-phase`/`plan-feature`
invocation.

**Action needed:** none. Existing rows keep working under the equivalence rule
above. Projects that want the explicit five-state history on old rows may
relabel them by hand, but nothing requires it.

> **Superseded by fix [#51](https://github.com/gtrabanco/agentic-workflow/issues/51)
> (2026-07-12).** "No redirect fires" above describes `plan-feature`'s gate as
> it existed on this date, which let a `defined`+`planned`-equivalent row fall
> through to `plan-feature-scaffold` and re-scaffold it. Fix #51 closed that
> re-plan loop: the gate now treats *any* `planned`-equivalent row — legacy or
> five-state-native — as already-planned and **STOPS**, handing off to
> `/execute-phase` instead. A legacy `planned`+designed row is therefore still
> "fully executable" (no redirect to `/design-feature`), but is no longer
> silently re-scaffolded. See `skills/plan-feature/SKILL.md`'s redirect gate
> for the current behavior.

## 2026-07-09 — `plan-feature` 2.0.0: product definition splits into `design-feature`

**Breaking change to `plan-feature`'s contract.** Product definition (the
raw-idea interview, and the new **capability-closure** checklist that forces
every entity/capability/role a feature introduces to its full surface — CRUD +
state transitions + UI + API + test, or an explicit design-time `n/a`) moved
out of `plan-feature` into a new user-facing skill, **`design-feature`**.
`plan-feature` is now **engineering-planning only**.

**What changed:**

- **New skill `design-feature`** (v1.0.0, `user-invocable: true`). Folds in the
  raw-idea interview, walks capability closure, writes the SPEC's **product
  half**, and stamps `## Design status: designed`. Trigger phrases "add
  feature" / "add a feature" / "new feature" now land here, not on
  `plan-feature`.
- **`plan-feature` gains a redirect gate, no bypass flag.** Given a feature
  whose SPEC is missing, or whose `## Design status` isn't `designed`, or whose
  Capability closure section is empty, `plan-feature` **STOPS** and prints
  `run /design-feature <slug>` instead of planning it. There is no flag to
  skip this — an undesigned feature is never engineering-planned.
- **The internal raw-idea-interview step that used to live inside
  `plan-feature`'s routing is retired** and deleted from the skill set; its
  logic now lives in `design-feature` (see above). `plan-feature`'s
  `--interview` flag no longer exists — pass a raw idea straight to
  `design-feature` instead.
- **`docs/features/_TEMPLATE/SPEC.md`** is now **one SPEC in two halves**: a
  **Product half** (`design-feature` writes: Context, Business goals, Scope,
  Capability closure → Acceptance criteria, Tooling, Product decisions,
  `## Design status`) and an **Engineering half** (`plan-feature-scaffold`
  writes: Technical goals, Architecture impact, Design, Decisions to confirm,
  Testing requirements, Dev scenarios, Phases, Deploy & rollback,
  Deliverables). No separate `DESIGN.md` — this was a deliberate rejection to
  avoid two documents drifting apart.
- **`plan-feature-from-issue`** now writes the SPEC's product half and must
  satisfy capability closure — a thin issue is hand-off to `design-feature`,
  not a shortcut around the gate.

**Command muscle-memory:**

| Old | New |
|---|---|
| `plan-feature "<idea>"` / `--interview` | `design-feature "<idea>"`, then `plan-feature <slug>` once `## Design status: designed` |
| `plan-feature <slug>` (undesigned) | `plan-feature <slug>` now **stops and redirects** to `design-feature <slug>` — run that first |
| `plan-feature <slug>` (already designed) | unchanged — routes straight to engineering-half scaffolding |
| `plan-feature <N>` / `--from-issue N` | unchanged entry point; internally it now writes the product half and satisfies capability closure before scaffolding |

**Action needed:**

- If you had muscle memory for `plan-feature "<idea>" --interview`, switch to
  `design-feature "<idea>"` — `plan-feature` will refuse the old flag pattern
  (it no longer routes an interview).
- If a project has features whose `SPEC.md` predates this change (single-half
  layout, no `## Design status`), they read as "undesigned" under the new gate
  the next time `plan-feature` is invoked on them. Run `design-feature <slug>`
  once to backfill the Product half sections (Capability closure can be
  written retroactively from the existing Acceptance criteria) before
  continuing to plan or execute — see `docs/features/_TEMPLATE/SPEC.md` for
  the exact section layout to backfill against.
- Re-run `bump-skill` bookkeeping is already reflected in `CHANGELOG.md` /
  `CHANGELOG.es.md` and the README skills + model tables for this change.

## 2026-07-04 — v3: the default branch becomes model-agnostic

**Breaking change to how you install this workflow** (not to any skill's
behavior). Before v3, `npx skills add gtrabanco/agentic-workflow` (no `#ref`)
installed the opinionated distribution: every skill pinned its own
`model:`/`effort:` frontmatter (Opus/high for judgment skills, Sonnet/medium
for mechanical ones, etc. — see the README's "Recommended model & effort"
table). A separate `#inheritance` branch, auto-synced by CI, stripped those
two lines from every skill so it could be installed model-agnostic instead.

**v3 flips which branch is the default:**

| Ref | Before v3 | From v3 |
|---|---|---|
| *(none)* — `npx skills add gtrabanco/agentic-workflow` | opinionated, per-skill Claude tiers pinned | **model-agnostic** — no skill pins a tier; each inherits the host session's model/effort |
| `#claude` | did not exist | **new** — the opinionated, per-skill-tuned distribution that used to be the default; a frozen snapshot of pre-v3 `main`, kept current by CI from `docs/workflow/model-routing.yml` |
| `#inheritance` | model-agnostic (stripped from `main` by CI) | **unchanged in content**, now force-pushed as an exact mirror of the (already model-agnostic) default branch — kept only as a stable alias for anyone who pinned it before v3 |

**Why:** using this workflow shouldn't lock a project into one AI vendor's
model lineup. The discipline (docs, SPECs, phases, review, the merge gate) is
the product; which model executes it shouldn't be a hidden default. Moving
the responsibility of picking the right model to the user, with `#claude`
still available for anyone who wants Claude's tiers hand-tuned per skill,
reduces that lock-in cost without removing the option.

**Action needed:**

- **On Claude Code and relying on the default install's per-skill tiers?**
  Re-install with `#claude`: `npx skills add gtrabanco/agentic-workflow#claude`.
  Nothing else changes — same skills, same behavior, just the tiers you had
  before v3.
- **Already pinned `#inheritance`?** Nothing to do. It still resolves, with
  identical content to what it always had (now it's simply also what `main`
  serves by default).
- **On any other agent, or happy choosing the model yourself?** Nothing to
  do — the plain install command already gives you this branch.
- **Maintaining a fork or a similar split for your own project?** See
  `.github/workflows/sync-derived-branches.yml` for the CI pattern (mirror +
  frontmatter-injection-from-config), and `docs/workflow/model-routing.yml`
  for the per-skill tier source of truth.

No skill's instructions, checklists, or output contracts changed in this
release (see the per-skill patch-bump rows dated 2026-07-04 in
[`CHANGELOG.md`](../../CHANGELOG.md) — mechanical frontmatter/description
changes only). This is a distribution-model change, not a behavior change.

## 2026-07-04 — `audit-pr` 2.0.0: opt-in auto-merge

> Historical note, superseded by `audit-pr` 4.0.0 and `ship-roadmap` 3.0.0
> (2026-07-31): standalone `audit-pr` never merges now; fullauto uses only the
> transient repository wrapper.

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
| 🟡 **Kept** (same name) | `execute-phase` | Updates in place. Now hands off to `review-change` at trigger-based review checkpoints (see `#77`). |
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
