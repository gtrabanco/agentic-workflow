## Envelope fields and example

**No-progress guard note (`workflow_observations`, requires `--last-envelope`,
see the crash-recovery checklist above)** — when the hint's `next.recommended`
targeted `/plan-feature <slug>` or `/design-feature <slug>` and this run still
classifies that same unit at the same pre-advance status, append a note of the
exact shape:
`"<slug> still 'defined' after the hint's /plan-feature <slug> recommendation — suspected dropped defined→planned write (see #51)"`
(swap `defined`/`/plan-feature` for `idea`/`/design-feature` on the design
side). The recommendation itself is unaffected — this only adds visibility.

```json
{
  "skill": "workflow-status",
  "state": "OK",
  "summary": "2 features merged, 07 in-progress at P2/4 awaiting review, 05 startable, fix #43 pending triage, 08 needs design.",
  "unit": {"type": "none", "id": null, "issue": null, "branch": "main"},
  "phase": {"current": null, "total": null, "completed": null},
  "pr": {"number": null, "url": null, "state": "none", "head_sha": null, "merge_ready": null, "ci": null},
  "gates": {"verification": null, "review_pending": null, "audit_pending": null},
  "findings": {"fix_now": [{"id": "F1", "file": "src/export/handler.ts:88", "axis": "security", "severity": "high", "class": "fix-now", "route": "fold into phase", "suggested_tier": "strong"}], "issues_filed": [], "untriaged": 2, "decisions_recorded": 0},
  "blockers": [],
  "dependencies": {"unmet": [], "build_order": []},
  "recommendations": {"product_audit": false, "reason": null},
  "needs_input": null,
  "next": {"recommended": "/review-change", "alternatives": ["/plan-feature 05"], "tier": "strong",
           "suggested": [{"command": "/review-change", "trigger": "accumulation: 420 changed lines since last-reviewed sha", "source_skill": "execute-phase"}]},
  "detail": {
    "design_candidates": [{"id": "08-billing-webhooks", "status": "idea", "next": "/design-feature 08-billing-webhooks"}],
    "features": [
      {"id": "07-csv-export", "status": "in-progress", "deps": ["01"], "deps_unmet": [],
       "phase": {"current": "P2", "total": 4}, "pr": null,
       "review_pending": true, "audit_pending": null, "merge_ready": null,
       "review": {"last_checkpoint_sha": "a1b2c3d", "unreviewed_diff": {"lines": 420, "files": 9},
                   "terminal_done": false, "adversarial": {"ran": null, "n": null}},
       "closure": {"state": "present"}, "issues_born": {"n": 0, "with_descope_amendment": 0}},
      {"id": "05-auth", "status": "defined", "deps": [], "deps_unmet": [],
       "phase": {"current": null, "total": null}, "pr": null,
       "review_pending": null, "audit_pending": null, "merge_ready": null,
       "review": {"last_checkpoint_sha": null, "unreviewed_diff": {"lines": null, "files": null},
                   "terminal_done": false, "adversarial": {"ran": null, "n": null}},
       "closure": {"state": "absent-legacy"}, "issues_born": {"n": 0, "with_descope_amendment": 0}}
    ],
    "fixes": [
      {"id": "43-null-crash", "issue": 43, "status": "planned", "deps_unmet": [], "pr": null,
       "review": {"last_checkpoint_sha": null, "unreviewed_diff": {"lines": null, "files": null},
                   "terminal_done": false, "adversarial": {"ran": null, "n": null}},
       "closure": {"state": "n/a"}, "issues_born": {"n": 0, "with_descope_amendment": 0}}
    ],
    "startable_now": ["05-auth", "fix-43"],
    "blocked_units": {"09-billing": {"unmet": ["05-auth"], "build_order": ["05-auth", "09-billing"]}},
    "open_prs": [{"number": 13, "unit": "07-csv-export", "ci": "green", "merge_ready": false}],
    "pending_triage": [{"source": "docs/features/07-csv-export/known-issues.md", "title": "empty-file edge"}],
    "untriaged_issues": {"count": 3, "oldest_open": [21, 33, 40]},
    "workflow_observations": ["branch feat/07-csv-export is 1 commit ahead of origin"],
    "urgent": {
      "issues": [{"number": 51, "title": "prod webhook signature check bypassed", "label": "urgent"}],
      "interruptibility": {"unit": "07-csv-export", "phase": "P2", "dirty": true, "tasks_from_boundary": 2}
    },
    "crash_recovery": {
      "verdict": "CLEAN",
      "branches": [
        {"branch": "feat/07-csv-export", "evidence": "1 commit ahead of origin; ledger coherent", "verdict": "CLEAN", "resume_command": null}
      ]
    }
  }
}
```

`detail.startable_now`, `detail.blocked_units` (with build orders),
`detail.design_candidates`, and `detail.pending_triage` are the keys an
orchestrator routes on; every id in `startable_now`/`blocked_units` must appear
fully in `features`/`fixes` — an `idea` unit appears ONLY in
`design_candidates` (and `detail.features`), never in `startable_now`, since
it has no deps-met check to pass (design precedes dependency startability).
`05-auth` above illustrates `defined` (not yet `planned`): startable, next
`/plan-feature`, phase fields null (no planning artifacts yet).
