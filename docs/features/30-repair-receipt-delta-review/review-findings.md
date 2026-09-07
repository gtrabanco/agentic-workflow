| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/fold-findings/SKILL.md:93; SPEC.md:593; ACCEPTANCE.md:19 | code | minor | fix-now | fold into P4 — correct "Five fields" to "Six fields" and add Branch to AC-01 field list | yes |
| F2 | skills/fold-findings/SKILL.md:180-198; docs/workflow/REVIEW_AND_CLASSIFY.md:95-99 | code | minor | fix-now | fold into P4 — add RE-REVIEW-SKIPPED row to closing-block decision table | yes |
| F3 | ACCEPTANCE.md:19; scripts/review-loop-discipline.test.mjs:260-263 | code | minor | fix-now | fold into P4 — fix AC-01 verbatim claim (FOLD_PROCESS.md has loose tokens only) | yes |
| VF-1 | 8f708e621abc6979c38f4c9e907c28e6b3f31859 · 2026-09-07 · code · F1 confirmed: "Five fields" text at SKILL.md:93 vs 6-line block verified; SPEC Design §1 and AC-01 field list both omit Branch | | | | | |
| VF-2 | 8f708e621abc6979c38f4c9e907c28e6b3f31859 · 2026-09-07 · code · F2 confirmed: table at SKILL.md:180-198 has 4 rows, no RE-REVIEW-SKIPPED row | | | | | |
| VF-3 | 8f708e621abc6979c38f4c9e907c28e6b3f31859 · 2026-09-07 · code · F3 confirmed: FOLD_PROCESS.md grep for verbatim block returns nothing; loose tokens only (/REPAIR-RECEIPT/, /all-repair-in-place/, /none/) | | | | | |
| REVIEW-RAN | HEAD 8f708e621abc6979c38f4c9e907c28e6b3f31859 · 2026-09-07 · review-change · axes: code, security, verify · verdict: REVIEW-FAIL · cycle: 1 | | | | | |