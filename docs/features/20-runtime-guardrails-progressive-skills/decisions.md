# 20 — runtime-guardrails-progressive-skills · decisions

## Resolved

- D1 — one feature and one PR, with five mechanically separated phases, per the user's explicit request.
- D2 — block direct merge commands unconditionally; do not create a persistent `.automerge` exemption.
- D3 — `ship-roadmap --fullauto` calls a dedicated transient wrapper only after a fresh MERGE-READY audit; standalone `audit-pr` never merges.
- D4 — the wrapper posts an idempotent PR comment instead of growing a repository log.
- D5 — keep universal safety and turn-contract rules in each main skill; move only conditional routes and reference material.
- D6 — use one-hop supporting resources and fail context checks on nested/missing references.
- D7 — `skills.sh.json` is discovery presentation metadata only; it does not affect runtime loading or caching.
- D8 — caches may reduce billing/latency but cannot reclaim context-window capacity, so no cache-specific skill rule is added.
- D9 — the fullauto wrapper accepts only a PR number and run ID; it derives the current head/default base from the forge and requires a SHA-bound audit comment plus the decision file fetched at that head. Missing forge evidence fails closed, including projects with no reported checks.

## Phase-lint

Every phase names one deliverable, declares one layer, has at most eight tasks,
contains no unresolved decision or runtime scope mutation, and ends with a local
command gate. P5 contains only hardening and the literal close-out chain.

## Open questions

none
