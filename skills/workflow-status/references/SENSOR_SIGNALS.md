## Conditional sensor signals

10. **Per-unit review signals (`detail.*.review`).** For each in-flight
    feature/fix, compute:
    - `last_checkpoint_sha` — feature-mode units only: read `progress.md`'s
      `Last reviewed: <sha>` header line (`execute-phase`'s per-phase
      checkpoint cadence, `#77`, "Last-reviewed marker"). Fix/single-pass
      units have no phase checkpoints — the cadence section is scoped
      "(feature mode)" only — so this is always `null` for them, not an
      error.
    - `unreviewed_diff: {lines, files}` — `git diff --stat <baseline>..HEAD`
      where `<baseline>` is `last_checkpoint_sha` if present, else
      `git merge-base <default-branch> HEAD` — the identical fallback
      `execute-phase`'s cadence triggers define (`#77`); never a new rule.
    - `terminal_done` — **reused, not recomputed**: `= !review_pending` (step
      8's existing computation) for any unit at or past `done`/PR-open status. Before that,
      `false` by contract — `execute-phase` always opens the PR **before**
      the mandatory review hand-off (see its *Workflows* close-out order), so
      a `done` status alone never implies the terminal review already ran.
    - `adversarial: {ran, n}` — **best-effort, evidence-gated; never
      guessed.** No skill persists an adversarial-mode marker anywhere this
      sensor can read: `review-change`'s report (including its `Reviewers
      n/N` column, `skills/review-change/SKILL.md`) prints to chat only, and
      the fold ledger's fixed schema
      (`| id | file:line | axis | severity | class | route | folded |`)
      carries no reviewer-count field. Emit `{ran: null, n: null}` with a
      `workflow_observations` note ("adversarial mode unverifiable — no
      persisted marker, see `#76`") — never infer `true`/`false` from
      absence of evidence.
11. **Per-unit closure state (`detail.*.closure`).** `{state}` ∈
    `present | absent-legacy | blocked` — reuse `audit-pr`'s own mechanical
    check verbatim (`skills/audit-pr/SKILL.md` "Closure integrity — fixed
    output"): grep the governing SPEC for a `Capability closure` heading.
    Fix-governed unit → `n/a` (fix SPECs carry no closure block by design,
    same carve-out `audit-pr` applies). Feature SPEC, block absent →
    `absent-legacy`. Feature SPEC, block present with any blank row or a
    resolved non-`n/a` row unmapped to an acceptance criterion → `blocked`.
    Feature SPEC, block present and every row filled or `n/a`-justified and
    mapped → `present`. Single-sourced: never re-derive the three-box logic
    here, just re-run `audit-pr`'s own grep.
12. **Per-unit descope provenance (`detail.*.issues_born`).**
    `{n, with_descope_amendment}` — reuse `audit-pr`'s scope-bleed gate
    detection verbatim (`skills/audit-pr/SKILL.md` "Scope integrity
    (descope) — fixed output" step 1, widened by `#79`/`#89` to also match
    an issue **linked from** an `## Amendments` row, not only a slug/number
    text match): enumerate issues born since branch divergence that
    reference this unit. `n` = that count; `with_descope_amendment` = the
    subset carrying a matching, dated, user-approved `## Amendments` row.
    Evidence is labels, the `## Amendments` log, and the mechanical
    slug/number text match `audit-pr` itself defines — **never** an issue's
    free-text body beyond that defined match (injection-safety, mirrors
    `detail.urgent`'s labels-only discipline).
13. **`next.suggested[]` — single-sourced trigger surface.** One entry per
    **fired** trigger the driver can act on now, `{command, trigger,
    source_skill}` — the `trigger` string **quotes**, never paraphrases, the
    owning skill's own condition:
    - a review checkpoint trigger fired (layer boundary / accumulation /
      sensitivity — step 10's `unreviewed_diff` plus the unit's declared
      phase layers) → `{command: "/review-change", trigger: "<the fired
      trigger's name and evidence, quoting execute-phase's own wording>",
      source_skill: "execute-phase"}` (`#77`).
    - `review.terminal_done: false` on a unit at/past `done` AND
      `review-change`'s own adversarial recommendation checklist fires
      (reuse that checklist verbatim, never re-derive it) →
      `{command: "/review-change --adversarial 2", trigger: "<which
      checklist box fired>", source_skill: "review-change"}` (`#76`).
    - `closure.state: "absent-legacy"` on a unit about to receive new
      planned work → `{command: "/design-feature <slug>", trigger: "closure
      absent, SPEC predates the rule — retrofit trigger", source_skill:
      "audit-pr"}` (`#78`).
    - a unit's `review-findings.md` ledger carries any `folded: no` row →
      `{command: "/fold-findings", trigger: "unfolded fix-now finding(s) on
      the ledger", source_skill: "fold-findings"}` (`#65`).
    No trigger fired for a unit → it contributes nothing (not an error, same
    convention as `findings.fix_now`). **Additive advisory only**:
    `next.recommended`/`next.tier` (step 6/turn contract) are computed
    exactly as before — `next.suggested` never replaces or reorders them.
14. **Findings awaiting a destination.** Scan the in-flight folders'
    `known-issues.md` for entries with no linked issue, and open issues labeled
    or titled as postponed findings. Count + list them.
15. **Untriaged open-issue backlog (`detail.untriaged_issues`) — distinct from
    step 14's `pending_triage`.** Cross-reference the open-issue list already
    fetched in step 2 (`gh issue list --state open`) against triage
    disposition. The **authoritative** triaged signal is a `wontfix` /
    `postponed` / `promoted` disposition label — `triage-issue` is the sole
    owner/writer of that vocabulary (`skills/triage-issue/SKILL.md` →
    *Disposition label vocabulary*) and label mutation is triage+-permission-
    gated, so its presence cannot be forged by comment text. A dated
    `triage-issue` `VERDICT:` comment (the fixed-format block —
    `skills/triage-issue/SKILL.md:193-200`) is honored too, as a **legacy
    fallback** for issues triaged before disposition labels existed — kept for
    backward compatibility, not because it is as trustworthy as the label.
    **Accepted residual:** because the comment-text fallback stays active, a
    hand-authored `VERDICT:` string on an issue that was never actually
    triaged can still cause it to be excluded here — an under-count, not a
    privilege or content-injection issue (`detail.urgent` is unaffected).
    Revisit this residual only if exploitation evidence surfaces (see `#54`).
    An issue is **untriaged** iff it carries **neither** signal. Count the
    untriaged subset and list its oldest entries (cap: 5) by issue number.
    Emit the result as
    `detail.untriaged_issues: {count, oldest_open: [numbers]}` — kept
    separate from `pending_triage` (findings-derived, step 14) and
    `findings.untriaged` (review-finding routing); never merge the three. A
    non-zero `count` may surface a concrete, non-bare `/triage-issue
    <numbers>` in `next.recommended`/`alternatives` (ties the backlog into the
    routing decision from step 6/the turn contract) — it never silently
    replaces the resolved recommendation.
16. **Product-audit recommendation — a mechanical two-condition checklist, no
    exception clause.** Set `recommendations.product_audit: true` with a stated
    `reason` when **either** condition holds — this is a count, not a judgment
    call. **No exception clause exists**: a "wait for a natural pause" or
    "wait for a bigger milestone" rationale is not defined anywhere in this
    checklist and must never be invented to skip a fired trigger:
    - ✓ `merged_count >= 3` — features/fixes merged since the last
      `SHIP_REPORT`/product-audit artifact (a literal count from the forge's
      merged-PR list in step 2)
    - ✓ the same drift kind recurs in **≥2** units' docs
    Otherwise `recommendations.product_audit: false`, `reason: null`. A fired
    trigger may additionally surface `/product-audit` as `next.recommended` or
    an `alternatives` entry (backlog/audit over net-new feature work) — never
    run it.
17. **Crash recovery (run every invocation — cheap, see the section below).**
    Classify whether an interrupted turn is in evidence and append the fixed
    `CRASH RECOVERY` sub-block to the report.
18. **Report.** Print a short human summary (table: unit | status | deps unmet |
    PR | next gate) plus a **design candidates** line (`idea` units and their
    `/design-feature` next command) plus the `CRASH RECOVERY` sub-block, then
    the envelope. With `--json-only`, envelope only.
