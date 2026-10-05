# review-findings — fix/286-affecting-path-receipt-binding

Mark and finding shapes are owned by `skills/pre-execution-review/references/LEDGERS.md`
(`review-mark@1` / `finding-mark@1` — cited, not re-declared).

Axes run at HEAD `2d222a88` (post review-finding fold): code/correctness (the
judge is pure and shared by both consumers — no drift surface; the marker regex
keeps its strictness and the scope attribute is hex-validated at parse **and**
at the body builder), security (scope values are 64-hex validated before they
touch marker bytes — one review finding folded at 2d222a88; git invocations are
spawnSync argv arrays, no shell interpolation; the non-affecting class list is
a closed, fail-closed vocabulary), perf (one extra `git diff --name-only` per
stale-by-sha check — negligible), verify (all gates re-run live: repo 626/0,
budgets PASS), a11y/brand/seo — n/a (no UI or user-facing copy).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 2d222a88bd7c3e5d9c17402b00dcd90b29bdbd14 | n/a | n/a | review-mark | n/a | n/a |
| F1 | scripts/review-receipt.mjs (renderReceiptBody) | security | med | fix-now | fold into current phase (source: validate the scope value 64-hex at the body builder, red test) · fold 2d222a88 | yes |
