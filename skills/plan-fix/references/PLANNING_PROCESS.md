## Planning process

1. **Ingest all inputs.** Each token must be a numeric issue resolved by
   `gh issue view <n> --json title,body,labels,number,author,createdAt,comments`
   (use the declared forge equivalent). Any failure stops the whole set. Translate
   issue text to the artifact language; ask only on material ambiguity. Derive a
   kebab-case topic (≤40 chars, no leading verb) from the primary issue title.
2. **Read the docs map.** Read `CLAUDE.md`, then relevant mapped docs; every SPEC
   claim cites a path/section.
3. **Locate affected code.** Name per issue the layers, modules/files, ports,
   adapters, and entities.
4. **Cross-check work.** List open issues and PRs; classify overlaps as
   prerequisite, parallel, absorbable, or unrelated. Record dependencies and
   Cross-issue notes.
5. **Resolve one vs. many issues before drafting.** One issue proceeds as the
   primary. For multiple issues, all four boxes must pass:

   - same defect class in the same cited files/surfaces;
   - one fix naturally covers all in the same commits;
   - no issue needs a design decision the others do not;
   - no conflicting severity/route in their triage verdicts.

   All pass → one unit whose primary is the lowest number; every issue retains
   separate acceptance criteria, the fix index names all, and the PR later uses
   one `Closes #<n>` line per issue. Print exactly:

   ```text
   MULTI-ISSUE MERGE — #<primary> (+#<n2>, #<n3>, …)
   Shared-root-cause checklist: ALL 4 boxes ticked
     ✓ same defect class/files: <paths>
     ✓ one fix covers all in the same commits
     ✓ no issue needs a design decision the others don't
     ✓ no conflicting severities/routes in triage verdicts
   Unit: docs/fix/<primary>-<topic>/SPEC.md
   Issues merged: #<primary> (primary), #<n2>, #<n3>, …
   PR will carry: Closes #<primary>
                 Closes #<n2>
                 Closes #<n3>
   ```

   Any box fails → write nothing, name each failing pair, print exactly, and end:

   ```text
   MULTI-ISSUE REFUSAL — cannot merge #<a>, #<b>[, …]
   Failing box(es):
     #<a> vs #<b>: <failing box name> — <one-line evidence>
     [repeat per failing pair]
   No SPEC written. Plan these separately:
     /plan-fix <a>
     /plan-fix <b>
     ...
   ```

   Invalid/unknown token → print exactly and end without partial work:

   ```text
   Usage: plan-fix <issue-number> [<issue-number> …]
   Invalid token: "<token>" — not a number, or not an issue in this repo.
   ```

6. **Define scope.** Include only the smallest change closing every unit issue.
   Route each adjacent problem elsewhere; never absorb hypothetical improvement.
7. **Analyze risk:** blast radius, detection lead time, operations (jobs, queues,
   cache, schema, external adapters), security (auth, secrets, PII, webhooks,
   limits), compliance (`n/a` when none), and migration/backward compatibility.
8. **Acceptance/tests.** Make every criterion objective and map it to unit,
   integration, contract, architecture, or justified manual verification. Name
   regression-risk tests; keep merged-issue criteria identifiable.
9. **Observability.** Name the log/metric/alert proving health and silent failure.
10. **Affected docs.** Add an acceptance criterion for every mapped doc update.
11. **Rollback.** Give one command/PR-revert flow, data cleanup (or `none`), and
    what is preserved/lost.
12. **Effort.** XS ≤1h/1 commit; S ≤4h/1 commit; M ≤1 day/multi-commit; L >1 day
    → propose `plan-feature`; the user decides.
13. **Phases.** Emit at least one `P1..Pn` implementation phase plus final
    `P(n+1) — Hardening & PR` (always ≥2 total). Each task is independently
    checkable without judgment; each phase has zero open design decisions, one
    layer/concern, and a local gate. Copy the template's final tasks literally.
    Run the canonical eight-box Phase-lint (owned by the [phase contract](<../../phase-contract/SKILL.md>)) on every implementation phase; re-cut or split any FAIL.
14. **Self-review.** All template/extra sections filled; claims cited; no scope
    creep; out-of-scope work routed; acceptance checkboxes independently
    verifiable; phase rules satisfied; template Spec-lint fully ticked; no
    placeholders; artifact language correct.
15. **Commit locally.** Run `git branch --show-current`. From the default branch,
    create `fix/<primary>-<topic>`; from another working branch, stop and ask.
    Stage the SPEC and `docs/fix/README.md`; commit
    `docs(fix): draft SPEC for #<primary>[+#<n2>+…] — <topic>`. Never push or
    open a PR. Print branch, sha, and the entrypoint's hand-off block.
