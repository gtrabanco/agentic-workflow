# Tooling — the host, the toolchain and the CLI itself

These commands answer questions about the machine the workflow runs on and about
the CLI's own surface. They are the ones to reach for when something *works
elsewhere* and does not work here.

**Flag spelling is not here.** It is `agentic-workflow help <subcommand>`.

## Diagnose before improvising

- **`doctor`** — one read-only check per documented tool surface, printing the
  `doctor@1` envelope: a row per surface with its real evidence, the derived
  move, and the verdict. Exit 0 means no required surface is broken. **Run it
  before concluding a tool is missing** — an impression that `rg` is absent is a
  guess, and the doctor is the measurement.
- **`setup`** — the consent-gated wizard over the same envelope. It writes
  nothing without an explicit yes, and a non-interactive run prints the plan and
  says so. It never runs a package manager: an install route is **text**.
- **`setup-env`** — the authoring toolchain check, with `--check` as the read-only
  answer. This is the one command that must work on a machine where the CLI is
  not yet installed, which is why it also ships as a bare script in the project.

## The CLI's own surface

- **`help`** — the grammar. A bare `help` prints the index by family;
  `help <sub>` prints one subcommand's usage, ops and flags; `help --json` prints
  machine data, and `help <sub> --json` answers the same envelope with just that
  row. **This is the owner of every flag spelling in the crate**, and the
  reason this skill does not restate any.
- **`runner`** — answers which launcher runs this package at its own pin (the
  closed set, the per-candidate attempts, and which one won). Read-only and
  offline: it installs nothing and prompts nothing.
- **`config`** — reads and writes the base config and every discovered extension
  file, validating against the registered schema before every write and never
  coercing. `validate` reports unknown keys by path; `default` materializes every
  declared option with its shipped default and an English comment, keeping the
  operator's values.

## The version question

A command that behaves differently than you expect is usually a **pin** question
before it is a bug question. `runner` answers which launcher and version runs;
the doctor answers whether the tool is the one you think. Check both before
reporting a defect — and when the answer really is a stale install, name the pin
and the repair rather than working around the behaviour.

## The rule

Never install, upgrade or reconfigure a tool to get past a check without asking.
`setup` exists precisely so that the act of changing the machine is a decision
someone made, recorded, rather than a side effect of a debugging session.
