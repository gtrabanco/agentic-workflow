| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | docs/fix/166-pi-0850-baseline-refresh/progress.md:31-36 + docs/fix/166-pi-0850-baseline-refresh/pr-body.md:40 | spec-drift | med | fix-now | fold (source) | DISPUTED: user disposition explicitly states "NOT folded; accepted as manual post-merge verification" (2026-09-05). The user will execute the three interactive smoke observations on a pi 0.85.x runtime after merge and report; a failed observation is raised separately. |
| VF-1 | progress.md:31-36 · pr-body.md:40 · reviewer review-change · HEAD f909e8b7d392835ae6bd580ab1479719d9a95853 · recheck direct read: `grep -c "outcome:" docs/fix/166-pi-0850-baseline-refresh/progress.md` → 0 across all six `- SMOKE` rows, while ACCEPTANCE.md AC2 / SPEC O6 (SPEC.md:188) require each row to name its `outcome: pass`/`outcome: fail`; rows :33-35 cite static code inspection (dispatch.ts line refs, "no structural changes"), not executed observations; pr-body.md:40 asserts "all 6 smoke observations recorded with `outcome: pass`" — false statement about the record it ships | spec-drift | confirmed | finding-mark | n/a | n/a |
| F2 | docs/fix/166-pi-0850-baseline-refresh/progress.md:31-32 + docs/fix/166-pi-0850-baseline-refresh/pr-body.md:31 | code | med | fix-now | fold (source) | yes |
| VF-2 | progress.md:31-32 · pr-body.md:31 · reviewer review-change · HEAD f909e8b7d392835ae6bd580ab1479719d9a95853 · recheck direct read + disk count: progress.md:31 says "39 declared" with its own breakdown summing to 37 (19+17+1); `ls packages/pi-agentic-workflow/skills | wc -l` → 37 dirs and 37 SKILL.md files; docs/workflow/SKILLS.md:7 records 19 user-facing + 17 internal; progress.md:32 and pr-body.md:31 repeat "39" | code | confirmed | finding-mark | n/a | n/a |

REVIEW-RAN · 2026-09-05T08:29:53Z · review-change · head f909e8b7d392835ae6bd580ab1479719d9a95853

DISPOSITION (user decision 2026-09-05) — F1: NOT folded; accepted as manual post-merge verification (user executes the three interactive smoke observations on a pi 0.85.x runtime after merge and reports; a failed observation is raised separately). F2: folded at be7ba208.

REVIEW-RAN · 2026-09-05T~09:0xZ · review-change · head be7ba208a4cfed52bd7098d5063aa3f35190c69d
