### Model routing

| Stage | Tier | Mechanism |
|---|---|---|
| Interview, founding, roadmap creation | opus/high | this skill's frontmatter; composes `init-workspace` (equal tier), answers pre-fed |
| Recovery, routing, logging | opus/high | in-turn (tiny token volume; a subagent would add cost, not save it) |
| JIT feature design (mid-run `idea`/`defined` unit) | opus/high | compose `design-feature` + `plan-feature-scaffold` in-turn (equal tier, deriving only from `SHIP_DECISIONS.md` — no new questions) |
| JIT feature planning | opus/high | compose `plan-feature` in-turn (its internals are opus/high–medium: ≥ holds) |
| Product review (REVIEW-SPEC) | opus/high | `review-spec` in a **clean context** (fresh subagent or outside headless call) — never the turn that wrote the product half; tier equals or exceeds the author's, so the ≥ rule holds |
| Plan review (REVIEW-PLAN) | opus/high | `review-plan` in a **clean context**, same rule; it judges the plan the previous stage froze |
| Phase execution, single-pass, fixes | **cheap worker** | fresh context per phase following `execute-phase`; Claude branch maps this role to `sonnet`, portable drivers use their validated worker tier |
| Final review/correction loop | opus/high | compose the manual path `/fold-findings`, then re-run `/review-change`; it reuses a current exact-SHA receipt or reviews context-clean, and routes unresolved findings to `triage-issue --prioritize-now` |
| Merge gate | opus/high | compose `audit-pr` in-turn (the highest-stakes automated verdict; must share one turn with the floor checks) |
| Forge/git mechanics | — | Bash tool calls; no model judgment involved |
| Final-report evidence gathering | haiku (optional) | fan-out subagents for grep-shaped per-feature log collection when ultracode is on; synthesis stays opus |
| `product-audit` | opus/max | **never composed, never imitated by a subagent** — its effort (max) exceeds the conductor's (high) and a subagent override cannot carry `effort: max`. Hand-off only: the report prescribes when to run it. |
