---
name: workflow-status
user-invocable: true
version: 1.0.0
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
argument-hint: "[--json-only]"
description: >
  Read-only sensor for orchestrating the workflow programmatically: computes the
  full state of the project — every feature and fix with its dependency closure
  (met/unmet), pending fixes, open/merged PRs and their audit state, findings
  awaiting triage, what is startable right now and in which build order, and
  whether a product-audit is due — and emits it as one machine envelope (fixed
  JSON). The sensor an external driver calls between steps instead of relying on
  ship-roadmap's conductor. Never edits anything. Triggers: "workflow status",
  "what can I build next", "dependency tree of the roadmap", "pending fixes",
  "state of the run", "workflow-status".
---

# Workflow Status (the orchestrator's sensor)

One read-only pass over the project that answers, in a single fixed JSON
envelope: **what exists, what is blocked on what, what is startable right now,
and what the recommended next command is.** Built for external orchestrators
(see `docs/workflow/ORCHESTRATION.md`) but equally useful to a human asking
"where do we stand?".

## Turn contract — verify before ending the turn

```
✓ Every claim comes from a RUN command or a READ file (git/forge output, roadmap,
  fix index, feature folders) — nothing inferred from memory
✓ Nothing was edited, committed, pushed, or created — read-only, always
✓ The human-readable summary is printed, then the machine envelope (fenced
  ```json — see ## Machine envelope) is the ABSOLUTE last output
```

With `--json-only`, skip the human-readable summary: print the envelope alone.

## When to use

- Between orchestration steps: an external driver runs it to decide the next
  command and model tier without parsing prose.
- Before picking work manually: "what can I start right now?"
- **Not** for judging quality (that's `review-change`/`audit-pr`) or product
  health (that's `product-audit`) — this skill reports state, it never judges.

## Step 0 — Discover the project (always first)

Per the agent guide's **Workflow conventions** + **documentation map**, then
read what THIS skill needs: `docs/features/ROADMAP.md`, the fix index
(`docs/fix/README.md`), every in-flight feature folder's `TASKS.md` +
`progress.md` + `known-issues.md`, and `docs/features/SHIP_DECISIONS.md` if a
ship-roadmap run exists.

## Process (fixed sequence — run the commands, don't infer)

1. **Git state.** `git branch --show-current`, `git status --porcelain`,
   `git fetch` + `git status -sb`. A dirty tree or unpushed branch is reported
   as-is (a `workflow`-kind observation in `detail`), never cleaned up.
2. **Forge state.** List open + recently merged PRs and open issues with the
   declared forge CLI (examples use `gh`):
   `gh pr list --state open --json number,title,headRefName,url,statusCheckRollup`,
   `gh pr list --state merged --limit 20 --json number,headRefName`,
   `gh issue list --state open --json number,title,labels`.
3. **Roadmap + fix index.** Parse every row: id, slug, status
   (planned / in-progress / done), depends-on, linked PR.
4. **Compute the dependency tree.** For every non-merged unit, build the
   **transitive** depends-on closure and mark each edge met (dep's PR merged)
   or unmet — same rule as execute-phase's dependency gate: `done`-with-open-PR
   is NOT met. Detect inconsistencies (a "merged" row whose own deps aren't
   merged; cycles) and report them as `substrate` blockers.
5. **Phase progress.** For each in-progress feature, read `TASKS.md`: current
   phase, total phases, per-phase checkbox completion.
6. **Pending quality gates.** For each unit with commits: has the mandatory
   `review-change` for its current state run (review report present in the
   feature folder)? Has `audit-pr` a MERGE-READY bound to the PR's current
   head SHA (look for the audit comment marker on the PR)? Derive
   `review_pending` / `audit_pending` / `merge_ready` per unit.
7. **Findings awaiting a destination.** Scan the in-flight folders'
   `known-issues.md` for entries with no linked issue, and open issues labeled
   or titled as postponed findings. Count + list them.
8. **Product-audit recommendation.** Recommend when ≥3 features merged since
   the last `SHIP_REPORT`/product-audit artifact, or when the same drift kind
   appears in ≥2 units' docs. State the reason; never run it.
9. **Report.** Print a short human summary (table: unit | status | deps unmet |
   PR | next gate), then the envelope. With `--json-only`, envelope only.

## Machine envelope

Schema and placement per the installed `orchestration-envelope` skill. This
skill emits `state: OK` always (it is a sensor — even a broken substrate is
*reported*, as `blockers` with `kind: substrate`, while the envelope itself
stays OK), fills `next` with the single best command for the project right
now, and carries the full tree in `detail`:

```json
{
  "skill": "workflow-status",
  "state": "OK",
  "summary": "2 features merged, 07 in-progress at P2/4 awaiting review, 05 startable, fix #43 pending triage.",
  "unit": {"type": "none", "id": null, "issue": null, "branch": "main"},
  "phase": {"current": null, "total": null, "completed": null},
  "pr": {"number": null, "url": null, "state": "none", "head_sha": null, "merge_ready": null, "ci": null},
  "gates": {"verification": null, "review_pending": null, "audit_pending": null},
  "findings": {"fix_now": [], "issues_filed": [], "untriaged": 2, "decisions_recorded": 0},
  "blockers": [],
  "dependencies": {"unmet": [], "build_order": []},
  "recommendations": {"product_audit": false, "reason": null},
  "needs_input": null,
  "next": {"recommended": "/review-change", "alternatives": ["/plan-feature 05"], "tier": "strong"},
  "detail": {
    "features": [
      {"id": "07-csv-export", "status": "in-progress", "deps": ["01"], "deps_unmet": [],
       "phase": {"current": "P2", "total": 4}, "pr": null,
       "review_pending": true, "audit_pending": null, "merge_ready": null}
    ],
    "fixes": [
      {"id": "43-null-crash", "issue": 43, "status": "planned", "deps_unmet": [], "pr": null}
    ],
    "startable_now": ["05-auth", "fix-43"],
    "blocked_units": {"09-billing": {"unmet": ["05-auth"], "build_order": ["05-auth", "09-billing"]}},
    "open_prs": [{"number": 13, "unit": "07-csv-export", "ci": "green", "merge_ready": false}],
    "pending_triage": [{"source": "docs/features/07-csv-export/known-issues.md", "title": "empty-file edge"}],
    "workflow_observations": ["branch feat/07-csv-export is 1 commit ahead of origin"]
  }
}
```

`startable_now`, `blocked_units` (with build orders) and `pending_triage` are
the keys an orchestrator routes on; every id in them must appear fully in
`features`/`fixes`.

## Guardrails

- **Read-only, always.** No commit, push, issue, comment, label, or file edit —
  not even fixing an obviously stale roadmap row (report it as a blocker of
  kind `substrate` instead; `audit-docs` is the fixer).
- Evidence discipline per the project's **Workflow conventions**: every status
  comes from a command's output or a file's content; unverifiable → `null` +
  a `workflow_observations` note, never a guess.
- Forge unavailable → still report the git/docs view, with a `blockers` entry
  `{"kind": "substrate", "id": "forge", "scope": "run"}` so the orchestrator
  knows PR-dependent states are unknown.

## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. This
skill has no Claude Code dependency at all — it is the piece that lets ANY
driver (a shell loop, a CI job, another agent) orchestrate the workflow:

- **No slash-command menu** — open this `SKILL.md` and follow it literally in
  a fresh conversation, or invoke it headless (see
  `docs/workflow/ORCHESTRATION.md` for per-agent invocation patterns).
- **No per-skill `model:`/`effort:`** — this is mechanical reading and
  counting: a **cheap** tier is enough; never spend a strong model here.

## Relationship to other skills

- The **sensor** counterpart to `ship-roadmap`'s conductor: an external
  orchestrator calls `workflow-status` → routes on the envelope → invokes
  `plan-feature` / `execute-phase` / `review-change` / `audit-pr` /
  `triage-issue` directly, choosing the model per step — the same loop without
  the in-agent autopilot.
- Read-only sibling of `audit-docs` (which judges coherence and can fix) and
  `product-audit` (which judges health): this one only reports state.
- Schema owner: `orchestration-envelope` (internal).

## Done when

- Every roadmap/fix row, open PR, and in-flight folder was actually read, the
  dependency closures are computed transitively, and inconsistencies are
  reported (never repaired).
- The human summary (unless `--json-only`) and the envelope — with `detail`
  carrying features, fixes, startable_now, blocked_units, open_prs and
  pending_triage — are printed, envelope last.
- Nothing was modified anywhere.

→ Next: the envelope's `next.recommended` command — it is computed from the
  actual state, so it IS the recommendation
  · a human overview → read the printed table
  · orchestrating programmatically → parse the last fenced json block
