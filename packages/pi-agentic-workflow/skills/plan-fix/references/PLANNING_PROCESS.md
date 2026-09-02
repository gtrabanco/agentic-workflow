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
   primary. Multiple issues may form one unit through either supported mode:

   - **Capability bundle** — different symptoms/root causes jointly prevent one
     user-visible or operational outcome (for example, login succeeds end to
     end). They may touch different layers or the same file repeatedly.
   - **Homogeneous mechanical batch** — the same low-risk transformation is
     repeated across independent surfaces (for example, CSS token replacement,
     documentation correction, or one API rename).

   Evaluate the set as one atomic delivery boundary, not every pair by file
   coincidence. All five boxes must pass:

   Select the mode by first match: (1) different corrections jointly unblock
   one named end-to-end outcome → `capability bundle`; (2) otherwise, the same
   literal low-risk transformation repeats on every member → `homogeneous
   mechanical batch`; (3) otherwise → split. Different files/layers never turn
   an end-to-end capability bundle into a mechanical batch.

   - one sentence names the shared outcome **or** the repeated mechanical rule;
   - one verification plan proves every issue's separate acceptance criteria;
   - the set can ship and roll back together without leaving a partial state;
   - no conflicting dependency, release order, product/architecture decision,
     permission/schema migration, or triage route requires isolation;
   - aggregate work fits one reviewable fix PR (XS/S/M); an L bundle is promoted
     to one feature rather than fragmented into fixes.

   Shared files, one root cause, and equal severities are useful evidence but
   are **not requirements**. A security-critical member raises the whole unit's
   verification/routing floor instead of forcing a separate PR when the atomic
   boundary still holds.

   All pass → one unit whose primary is the lowest number; every issue retains
   separate acceptance criteria and manifest IDs, the fix index names all, and
   the PR later uses one `Closes #<n>` line per issue. Print exactly:

   ```text
   MULTI-ISSUE MERGE — #<primary> + #<n2> + #<n3>
   Atomic-delivery mode: <capability bundle|homogeneous mechanical batch>
   Checklist: ALL 5 boxes ticked
     ✓ shared outcome/rule: <one sentence>
     ✓ one verification plan covers every issue: <commands/checks>
     ✓ one release + rollback boundary: <evidence>
     ✓ no isolation conflict: <evidence>
     ✓ aggregate size: <XS|S|M>
   Unit: docs/fix/<primary>-<topic>/SPEC.md
   Issues merged: #<primary> (primary) + #<n2> + #<n3>
   PR will carry: Closes #<primary>
                 Closes #<n2>
   Closes #<n3>
   ```

   Replace the placeholders with every actual issue number before printing;
   use ` + ` between all members and never print a literal ellipsis.

   Any box fails → write nothing. Partition the input into the **fewest maximal
   compatible groups** that do pass (singletons only when no bundle exists),
   cite the set-level boundary that prevents their combination, print exactly,
   and end:

   ```text
   MULTI-ISSUE SPLIT — the full set is not one atomic delivery unit
   Boundary: <failing box> — <one-line repository/issue evidence>
   No SPEC written. Recommended maximal groups:
     /plan-fix <a> <b> <c> — <shared outcome/rule + verifier>
     /plan-fix <d> <e> — <shared outcome/rule + verifier>
     [/plan-fix <f> — singleton only because <reason>]
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

## Mode grammar (versioned — read by `scripts/normative-drift.test.mjs`)

`plan-fix` takes no flag of its own; the hand-off flag below belongs to the skill
it routes to. `route` must be a skill that exists and `flag` must appear in that
skill's `argument-hint:` — the rule `plan-mode-routes@1` states for `plan-feature`,
applied here.

```text
fix-mode-routes@1
# owner: plan-fix
mode | flag | route
issue-set-planned | n/a | review-plan
after-plan-pass | --fix | execute-phase
```
