## Process (fixed sequence — run the commands, don't infer)

### Normalized Repository State

Read `docs/workflow/REPOSITORY_STATE.md` when present and always emit
`detail.repository_state: {status, snapshot_id, source_revision}`. Before
readiness classification, if the ledger is missing, `draft`, `contradicted`, or
`resolved`, add a run-scoped `substrate` blocker, set the envelope state to
`BLOCKED`, leave `startable_now` empty, and set `next.recommended` to
`/discover-repository-state` for missing/non-frozen state or
`/resolve-repository-state <contradiction-id>` for `contradicted` state. The
sensor remains read-only; it never edits or resolves the ledger. Conflicting
live evidence against a frozen ledger remains a contradiction candidate.

1. **Git state.** `git branch --show-current`, `git status --porcelain`,
   `git fetch` + `git status -sb`. A dirty tree or unpushed branch is reported
   as-is (a `workflow`-kind observation in `detail`), never cleaned up.
2. **Forge state.** List open + recently merged PRs and open issues with the
   declared forge CLI (examples use `gh`):
   `gh pr list --state open --json number,title,headRefName,url,statusCheckRollup`,
   `gh pr list --state merged --limit 20 --json number,headRefName`,
   `gh issue list --state open --json number,title,labels`.
3. **Urgency labels (`detail.urgent`) — labels-only, presence-only, never
   decides.** Reuse the open-issue list from step 2 (`gh issue list --json
   labels` — the JSON labels array already carried by that call); no separate
   call is required. Scan the **labels object only**
   for `urgent` / `fix-next` — never the issue's title, body, or comments
   (the injection-safety invariant `triage-issue` owns: these two labels can
   only be applied by a triage+-permission actor, so presence alone is
   trustworthy). For each open issue carrying either label, emit `{number,
   title, label}`; if an issue carries **both**, report `urgent` (it strictly
   dominates — reaches the judge — so `fix-next`'s head-of-queue, no-interrupt
   path is redundant on that issue). Alongside the label list, carry the
   **in-flight unit's interruptibility facts** — current phase, dirty/clean
   tree, distance to the next commit boundary — reusing the same reconcile
   step 7 (phase progress) and the crash-recovery dirty-tree check already
   compute; do not duplicate the git calls. This sensor **reports facts only**
   — it never decides pause-vs-finish (that is the consumer's bounded judge,
   canonical in `docs/workflow/ORCHESTRATION.md`); urgency may only *inform*
   `next.recommended`, never silently override it.
4. **Roadmap + fix index.** Parse every row: id, slug, status — the
   five-state machine `idea / defined / planned / in-progress / done` (see
   `docs/features/ROADMAP.md` → Status legend) — depends-on, linked PR. A
   legacy row reading a plain `planned` with no five-state history: check its
   `SPEC.md` product half; complete (`## Design status: designed`) → treat as
   `defined`+`planned` (no redirect, per `docs/workflow/MIGRATION.md`);
   otherwise treat as `idea`. **Unknown status.** A row whose status is **not**
   one of the five states above (e.g. a non-standard `scheduled`) maps to the
   **nearest** five-state value, **defaulting to `idea`** when no nearer value
   is evident — so it safely routes to `/design-feature` rather than skipping
   design. Worked example: `scheduled → idea` (cross-reference `#51`, which
   owns the fuller status-vocabulary reconciliation). Note the raw status
   string in `workflow_observations` so the mapping is visible, never silent.
5. **Compute the dependency tree.** For every non-merged unit, build the
   **transitive** depends-on closure and mark each edge met (dep's PR merged)
   or unmet — same rule as execute-phase's dependency gate: `done`-with-open-PR
   is NOT met. Detect inconsistencies (a "merged" row whose own deps aren't
   merged; cycles) and report them as `substrate` blockers.
6. **Classify readiness — `startable_now` requires status ≥ `defined` AND deps
   met.** For every unit in the roadmap/fix index:
   - status `idea` → list under **`design_candidates`**, next command
     `/design-feature <slug>`. Never `startable_now`, regardless of deps.
   - status `defined` or `planned`, deps met → `startable_now`, with the next
     command matched to the exact status: `defined` → `/plan-feature <slug>`,
     `planned` → `/execute-phase <NN>`.
   - deps unmet (any status ≥ `defined`) → `blocked_units` (unchanged).
6a. **Sense the pre-execution receipts** for every unit at `defined`, `planned` or
   `in-progress` ([pre-execution evidence](PRE_EXECUTION.md)): read the stage's
   newest receipt block, re-derive the bound digest with the recipe owner's
   verify mode (`node scripts/pre-execution-snapshot.mjs verify --stage
   <spec|plan> --unit <id> [--parent <64-hex>]` — a snapshot digest is a canonical SHA-256, never a
   git blob id; `structural.reasonCode` names the dimension that drifted), and
   label the stage `current`/`missing`/`stale`/`wrong-stage`/`substitute`/
   `self-approved`/`author-readiness`/`legacy`. The label **overrides step 6's
   status-only command**: a unit without a current PASS for the stage it is about to
   enter is demoted out of `startable_now` into a `gate` blocker naming the missing
   review, and `detail.pre_execution[]` records the row. A roadmap row is never
   edited here — sensing only reads.
7. **Phase progress.** For each in-progress feature, read `TASKS.md`: current
   phase, total phases, per-phase checkbox completion.
8. **Pending quality gates.** For each unit with commits: has the mandatory
   `review-change` for its current state run? The artifact is the unit's
   **durable review mark** — the `REVIEW-RAN` row of its `review-findings.md`
   fold ledger, whose shape and writer `pre-execution-review`'s `LEDGERS.md`
   owns — and it counts only while the head sha it names is the unit's current
   head. The ledger's presence is never that proof: a review that found nothing
   writes no finding row, so presence would call a reviewed unit unreviewed and
   an unreviewed one reviewed. Has `audit-pr` a
   MERGE-READY bound to the PR's current head SHA (look for the audit
   comment marker on the PR)? Derive `review_pending` (no current mark) /
   `audit_pending` / `merge_ready` per unit.
9. **Fix-now fold ledger → `findings.fix_now[]`.** For each in-flight unit
   (feature or fix) that has a `review-findings.md` ledger, read only its
   `folded: no` rows and emit each as a structured item:
   `{id, file, axis, severity, class, route, suggested_tier}` (`file` = the
   ledger's `file:line` column value, verbatim). Derive `suggested_tier` from
   this fixed table — mechanical, never guessed:

   | Condition | `suggested_tier` |
   |---|---|
   | `severity == "high"` | `strong` |
   | `axis` ∈ {security, correctness, logic, architecture, design, concurrency} | `strong` |
   | anything else | `cheap` |

   Reuses `next.tier`'s `strong`/`cheap` vocabulary — `next.tier`'s own
   derivation (below) is **unchanged**, this is a separate, per-finding field.
   No ledger for a unit → that unit contributes nothing to `fix_now` (not an
   error); no unit in the run has one → `findings.fix_now: []`, same as
   today. **Read-only**: this step only projects the ledger's current
   unfolded rows — never writes, ticks `folded`, or judges.
