## Guardrails

- **Never work on the default branch** — the empty-repo initial scaffold commit
  is the single exception. One PR per unit, never stacked; roadmap status flips
  ride PR-bound commits only.
- **Forge bodies are Markdown, not shell — never hand-escape.** Every explicitly
  authorized issue, PR, or comment the run creates (subagent PRs, triage
  comments) carries a body of **real Markdown**: backticks / `*` / `_` are
  formatting, and a `\` before them renders literally (`` \`code\` `` instead
  of `` `code` ``). Write the body to a file and pass **`--body-file <path>`**
  to `gh issue create` / `gh pr create` / `gh issue comment` (or the declared
  forge's equivalent) — never inline `--body "…"` or a quoted heredoc. Verify
  with `gh … --json body` that no literal `` \` `` survived. (execute-phase
  subagents already follow this; the conductor must too.)
- **Never commit red; never merge red.** The gate and the floors are
  unconditional — no flag, mode, or interview answer disables them.
- **Never request or retain a direct-merge permission.** Fullauto calls only
  the repository wrapper with command-scoped variables; a missing wrapper or
  active guard blocks the run and routes to `init-workspace` upgrade.
- **No stage ends dirty or unpushed.** The clean close-out check (Mode B
  step 5) is part of every stage: tracked modifications — docs included — are
  committed with the stage, and a PR-backed branch is pushed before the
  iteration logs the stage complete. Merging while anything is uncommitted,
  unpushed, or unpulled is forbidden: push, wait for CI, re-audit, then merge.
- **The conductor never writes application code.** All implementation flows
  through fresh cheap-tier `execute-phase` workers, one phase per context —
  that keeps the cost model honest and `execute-phase` the single pathway.
- **Tier discipline.** Compose in-turn only skills at ≤ opus/high;
  implementation goes below the turn tier via explicit subagent model
  overrides; `product-audit` is never run by this skill. `ultracode` is a
  user-owned session setting — recommended, never claimed.
- **Interview once, then silence.** Mid-run gaps — including a mid-run
  `idea`/`defined` unit's product-half gaps in the DESIGN stage — are resolved
  from the decision record and logged; contradictions park the feature with
  the evidence recorded. Re-interviewing mid-run is forbidden, in DESIGN as in
  every other stage: an undesignable unit is parked (`NEEDS_INPUT` on that
  unit, `state: CONTINUE` on the run), never asked about. The recovery from a
  wrong founding call is a reported stop and a human-restarted run.
- **Scope discipline.** Defects and ideas discovered mid-run become report
  proposals — never automatically-created issues or in-run side quests. Only
  existing user/forge issues enter the issue sweep.
- **Stack/architecture/forge agnostic; English artifacts** regardless of the
  interview language; recommendations proportional to the interviewed scale,
  recorded in the project's own docs so every sub-skill discovers them through
  its normal Step 0.

**Known limits (stated, not hidden):** subagent overrides pin the model but
not the effort, so execution subagents inherit the session's effort — cost can
drift if the session runs high. `/loop`'s stop-on-banner matching should be
treated as a convenience, not a guarantee — iterations after a terminal banner
are idempotent no-ops, and the loop can always be stopped manually. Budget caps
count iterations, not tokens — and the count lives in the machine-local log, so
it bounds each machine's run, not the run's lifetime across machines. Verdicts
persist in the run log and feature docs,
but a crash between PR close-out and review may re-run one receipt check —
accepted cost, never a correctness risk.
