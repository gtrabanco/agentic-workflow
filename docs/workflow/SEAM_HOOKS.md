# Workflow seam hooks — project-declared checks at the workflow's own lifecycle points

A target project declares commands (checks, formatters, notify scripts) that run
at declared workflow seams — `pre:commit`, `session:start`, `phase:end`, … — and
the pi extension executes them deterministically: **no LLM in the hook**. The
developer declares checks once; every lane run obeys them. The config form is
the Claude Code `hooks.json` shape, so existing declarations port.

> The machine contract — the exact config grammar, the event compatibility
> table, the execution and refusal rules — is owned by
> [`@gtrabanco/pi-agentic-workflow`'s README](../../packages/pi-agentic-workflow/README.md#workflow-seam-hooks-optional-consent-gated--issue-413).
> This page is the workflow-level view: what the feature is for, what it
> guarantees, and how a project adopts it. The seam vocabulary itself
> (`PROJECTION_SEAMS`) is a closed set published by the schema package
> (issue #406); growing it is a schema-const change, never a config trick.

## What it is for

Git hooks cover git's seams; the workflow has seams git never sees — the
executor's phase boundary, the lane's unit boundary, the session lifecycle. A
project that wants "every unit's implementation phase ends with the format
check green, and the lane commits only when it is" declares that once and every
agent run obeys it, without the model having to remember or re-derive it.

## The two consent gates (off by default)

Nothing runs until both are open, and each is explicit:

1. **Project consent** — `/init-workspace` writes the project's entry into the
   global consent store after the operator's explicit yes. No entry, no
   execution — ever, even with hooks declared.
2. **Opt-in per seam** — every matcher group in the hook config sets
   `"enabled": true`. Declaring a hook is not consent.

Both gates are proven off-by-default by the package's test suite.

## Execution guarantees

- **No shell** — commands spawn as argv with `shell: false`; shell
  metacharacters are refused `config-invalid` before any process exists, so
  nothing is ever interpolated.
- **Bounded** — output is capped per stream with a truncation marker; every
  hook has a hard timeout.
- **Fail-closed** — a failing check blocks at the seam, and the teaching
  message quotes the declared requirement as declared (never paraphrased).
- **Degradation is declared** — a broken hook config announces itself once and
  then behaves as a no-op; it never passes silently and never throws into the
  session.
- **Auto commit/push are never defaults** — they exist only as explicit
  per-seam flags on `phase:end`/`unit:end`, valid nowhere else.

## Adopting it

1. Run `/init-workspace` and answer yes to the seam-hooks consent question.
2. Declare your checks in `.pi/hooks.json` — see the package README for the
   config form, the seam table, and the auto-commit flags.

## Where it sits in the projection chain

Feature 105 (issue #406) published the closed seam and verdict vocabularies;
this dispatcher (feature 112, issue #413) is the first consumer that *executes*
at seams. The stripper (#410), the pi guards (#412) and the prereq injection
(#414) are the other consumers; none may grow the vocabulary by prose.

## Non-goals

- Writing or editing a project's hook config or consent entry is
  `init-workspace`'s consent flow only (the consent marker) and the developer's
  (the config) — the dispatcher never writes either.
- Internal guards are issue #412; `prereq` injection is issue #414.
