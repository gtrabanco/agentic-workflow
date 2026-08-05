## Adversarial recommendation checklist (default review)

Adversarial multi-reviewer review (`--adversarial N`) is **opt-in — Default
OFF.** The default route loads only this short checklist; the full
roles/spawn contract (`ADVERSARIAL_SETUP.md`) loads only for
`--adversarial N`, and the table-fusion contract (`ADVERSARIAL_SYNTHESIS.md`)
only for `--adversarial N` / `--synthesize`.

**Recommend `--adversarial 2` if ANY box ticks** (this skill surfaces the
recommendation in its report / `→ Next:` block but proceeds single-reviewer
unless the user opts in):

- ✓ the change is `L`
- ✓ the change touches a sensitive surface (auth, payments, destructive
  migrations, secrets, CI config)
- ✓ the reviewing model is **not the strongest model available in the fleet**,
  or is weaker than the model that authored the diff
- ✓ only one model family is available **and** the change is `≥ M`

The model condition is a documented rule of thumb, **surfaced as a report line
only — never auto-detection.** An agent cannot reliably introspect its own
model identity, so this skill never tries; it states the condition in prose
and lets the human (or the orchestrator that knows which model is running)
judge it.

**N ladder (fixed).** `N=2` is the default (the `ship-roadmap` floor). Bump to
`N=3` when either holds: the change has a security/auth surface, or all
available reviewers share one model family (the third reviewer buys back some
of the decorrelation a single family can't provide). `N>3` is **explicitly
discouraged** — with the ≥1 inclusion threshold in the synthesis contract,
reviewers beyond 3 mostly add dedupe work at merge time, not new findings.
