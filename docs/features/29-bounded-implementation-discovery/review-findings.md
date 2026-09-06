# review-findings — 29-bounded-implementation-discovery

Candidate review ran on 2026-09-05 (review-change, cycle 1, head f038d22901d854ce3ebe85ff3450e62ceea94254). Single-reviewer run with the documented inline fallback: per-pass subagent isolation was unavailable (model-API credit failure), so the four applicable passes (code, security, verify, perf) ran sequentially in one context per the Isolation rule's inline fallback.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/implementation-discovery/SKILL.md:2-11 + .claude-plugin/plugin.json:20-57 + README.md:56,190,649-660 | code (machine-surface registration) | med | fix-now | fold into current unit (source owner): give the skill one sanctioned registration shape — add `./skills/implementation-discovery` to `plugin.json` (sorted; it must ship to target installs because `execute-phase` links it on the pre-write route) or set `metadata.internal: true` — then reconcile README.md:56's "37 discoverable" cell and the README.md:649-660 uninstall roster, and re-run the installability/parity gates | yes |
| VF-1 | skills/implementation-discovery/SKILL.md:2-11 · reviewer review-change · HEAD f038d22901d854ce3ebe85ff3450e62ceea94254 · recheck direct frontmatter read (no `metadata.internal` key) + plugin.json array membership check (`./skills/implementation-discovery` absent; 37 entries; byte-unchanged from merge base) + `npx skills add . --list` reproducer: merge base 42bb38e7 → "Found 37 skills", head f038d229 → "Found 38 skills" | code | confirmed | finding-mark | n/a | n/a |

| REVIEW-RAN | HEAD f038d22901d854ce3ebe85ff3450e62ceea94254 | n/a | n/a | review-mark | n/a | n/a |


## Cycle 2 review — 2026-09-05 (source owner)

review-change cycle 2 ran on the exact candidate at HEAD 7a7cfca3 (clean workspace after stashing concurrent batch). F1 re-verified at its cited location: gone (plugin.json entry present, README count reconciled, uninstall roster updated). 0 new fix-now findings. REPLY-PASS.

## Fold — 2026-09-05 (source owner, fix-now F1)

F1 folded into this unit: registered `./skills/implementation-discovery` in
`.claude-plugin/plugin.json` (alphabetical, between `generate-docs` and
`init-workspace`; 37 → 38 entries) so it ships to target installs — the
`execute-phase` pre-write route links it by relative path, so `metadata.internal`
(wrong shape) would break that link. Reconciled the bilingual count cells
(EN `README.md`, ES `README.es.md`: 38/37 → 39 source · 38 discoverable) and both
uninstall rosters (added `implementation-discovery`). Re-ran the gates:
`npx skills add . --list` → "Found 38 skills"; `check-skill-context` →
"PASS context budgets: 39 skills"; `implementation-discovery.test` 23/23;
`pre-execution-quality.test` 63/63; `normative-drift` 16/16; `bounded-delivery`
1/1; `ledger-ownership` 18/18; pi `alias-coverage` 14/14. Context `--routes --json`
fails at clean HEAD too (pre-existing route-budget ceiling drift for
plan-feature:scaffold/plan-fix:issue/review-spec/review-plan) — not attributable
to this fold.
