## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. This skill
leans on them harder than any other — here is the manual equivalent of each:

- **No `/loop`** — two equivalent replacements, both vendor-neutral: (a) an
  **external orchestrator** loops `/ship-roadmap --continue` headless,
  injecting the envelope requirement (see `orchestration-envelope`) and
  routing on the resulting `state` (`"CONTINUE"` → re-invoke; full
  protocol + driver skeleton in `docs/workflow/ORCHESTRATION.md`); (b) manual
  re-invocation after each iteration. Iterations are
  stateless-by-reconstruction, so any driver is exactly equivalent; stop when
  the first line is a terminal `SHIP:` banner (envelope state OK / BLOCKED /
  FAILED / HALT). **Every iteration ending is announced** — "iteration
  complete (normal; re-invoke to continue)" vs a parked/terminal reason — so
  a stop is never ambiguous.
- **No subagents** — execute phases sequentially: for each phase, one **fresh
  headless invocation (or conversation) on a cheaper model** following the
  installed `execute-phase` SKILL.md for exactly one phase (same two autopilot
  overrides) — the external-driver pattern in `docs/workflow/ORCHESTRATION.md`
  does exactly this. The conductor stages (recover/plan/review/PR/audit) stay
  on your strongest model.
- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally in the conversation the routing table assigns it (in-turn = this
  conversation; subagent/hand-off = a fresh one).
- **No per-skill `model:`/`effort:`** — the `#claude` branch's routing table pins these tiers; here, pick tiers yourself:
  judgment stages on your **strongest** model, implementation on a cheaper one,
  and `product-audit` always as its own maximum-effort run.
- **Provider concurrency limits** — when spawning parallel subagents (or
  parallel headless invocations), cap concurrency at the provider's documented
  parallel-request limit per API key, leaving one slot free for the conductor
  (e.g. a provider allowing 5 concurrent requests → at most 3–4 parallel
  executors). An agentic loop spends one request per tool round-trip, so
  parallel executors also eat the per-minute request budget fast; on a 429,
  reduce parallelism before retrying rather than hammering the limit.
