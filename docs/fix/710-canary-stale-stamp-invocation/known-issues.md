# 710 — canary-stale-stamp-invocation · known pre-existing issues

- **The registry's `latest` is `4.10.0` while the tree's manifests and the runner
  pin read `4.10.1`** (`npm view @gtrabanco/agentic-workflow version` → `4.10.0`).
  `affects` this unit's evidence only: the exact-version form is probed at
  `4.10.0`, the version a reader can actually fetch today, and the *next cut* is
  what publishes `4.10.1`. The pin is not edited here — `release.mjs apply` owns
  it and the cut moves it.
- **The published `4.10.0` bin does not dispatch every subcommand the skills
  cite** (`npx --yes @gtrabanco/agentic-workflow@4.10.0 journal` → exit 2,
  `EDIT REFUSAL — Unknown service: journal`; `unit-doc`, `roadmap` and `memory`
  do dispatch). `does-not-affect`: this is the case `RUNNER.md` §"When the pin is
  older than the command" already specifies — a refused run that names the two
  repairs — and this unit neither changes that contract nor re-cuts a release.
- **`bun test` can report `0 pass 0 fail` on a few suites that pass under
  `node --test`.** `does-not-affect`: every suite this unit adds or touches is run
  under both invocations in the verification block, and a suite that reports zero
  cases under one runtime is named there rather than counted as green.
- **`docs/workflow/REPOSITORY_STATE.md` F003 states 30 `SKILL.md` entrypoints
  while the tree carries 31.** `does-not-affect`: the frozen state is a receipt
  of what was measured at its own revision and is excluded from this unit's sweep
  with that role named (`PE-017`); re-freezing it is `resolve-repository-state`'s
  job, not this fix's.
- **`--version` on the canary channel is rejected by design** (D-40-3).
  `does-not-affect`: this unit's suite drives `publish-stage` with `--date` only.
