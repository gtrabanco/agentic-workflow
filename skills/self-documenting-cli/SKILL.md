---
name: self-documenting-cli
user-invocable: false
version: 5.0.0-canary.20261125.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  The universal CLI's usage layer: which subcommand family solves which problem,
  and the recipes that chain them. Point at `runner help` for grammar —
  this skill carries the conduct rule and the recipes, never a restated flag.
---

# Self-documenting CLI (the usage layer)

The universal CLI (`@gtrabanco/agentic-workflow`) ships 73 subcommands behind one
pin. Its **grammar** has exactly one owner: `runner help`. This skill
owns the other half — *when to reach for which family, in what order* — because
that is the part a model gets wrong repeatedly and the part no flag list answers.

## The conduct rule (read this before guessing)

**Before guessing a flag, query the CLI's own help.** A guessed flag does not
fail quietly and it does not fail memorably: it produces a refusal the next
session must re-derive. `runner help <subcommand>` costs one command
and answers with the subcommand's usage, its closed `ops` and its `flags`.

- A bare `runner help` prints the index grouped by family.
- `runner help --json` prints the same facts as machine data.
- Every subcommand answers `--help` and `-h` with the identical block.

Never cite a flag from memory. Never read the crate README to learn a signature
— the README explains *what a command is for*, and `help` tells you *how to
spell it*. When the two ever disagree, `help` is the machine's answer and the
README is the defect.

## Which family solves which problem

| You are… | Reach for | Recipe |
|---|---|---|
| writing a document through a typed, schema-checked receipt | the **editing** family — `unit-doc`, `roadmap`, `section`, `doc read/edit`, `verify` | [references/editing.md](references/editing.md) |
| reading state without changing anything | the **sensor** family — `workflow-status`, `phase-lint`, `needs-input`, `test-impact`, `coverage-gap` | [references/sensors.md](references/sensors.md) |
| deciding whether an action is allowed | the **guard** family — `guard-command`, `diff-guard`, `git-identity-check` | [references/sensors.md](references/sensors.md) |
| moving a delivery unit through its own state machine | the **lane** family — `unit-route`, `ceremony`, `relay`, `audit-pr-gate`, `gate-receipt` | [references/lane.md](references/lane.md) |
| reading or writing a pull request, issue or review | the **forge** family — `forge-read`, `fullauto-merge`, `turn-contract` | [references/forge.md](references/forge.md) |
| searching the documentation corpus or the session journal | the **knowledge** family — `doc`, `journal`, `findings-corpus`, `repository-state` | [references/knowledge.md](references/knowledge.md) |
| fixing the host, the toolchain or the CLI itself | the **tooling** family — `doctor`, `setup`, `setup-env`, `runner`, `config`, `help` | [references/tooling.md](references/tooling.md) |

## The one rule that binds all of them

Every command in this crate follows two conventions, and a session that knows
them stops fighting the CLI:

- **A refusal is exit 2 and names its repair.** `EDIT REFUSAL — <reason>`, a
  sensor's own prefix, or a ceremony JSON error — each carries the legal
  candidates where the subcommand is a closed registry, and one
  `runner help <sub>` pointer. Exit 1 is a usage error; exit 0 is an
  answer, including a sensor that says "degraded". **A degraded answer is not a
  failure** — it is a fact to report.
- **Success receipts are byte-stable.** A command's stdout on success is a
  contract other things read. If you need machine data, ask for `--json`; never
  parse the human receipt.

## Portability

This skill carries no host-specific behaviour and no project stack. It teaches
the CLI's own shape, which is the same in every project the workflow runs in.
