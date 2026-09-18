# Path-protection policy

A deterministic guard for the repository's protected paths. It moves the
"never change a test to pass it" rule (and the same rule for fixtures and the
policy itself) from prompt prose to shipped defaults an agent cannot silently
weaken.

`path-policy.json` beside this file is the policy the guard reads. It ships with
the scaffold as the defaults; a repository that never edits it still gets the
expected behaviour, and one that extends it gets a stricter guard. The
`path-protection-policy@1` schema is the document shape.

## Protected classes (shipped defaults)

| Class | Default globs | Freeze |
|---|---|---|
| `tests` | `tests/**` | yes |
| `e2e` | `e2e/**` | yes |
| `test-file` | `**/*.test.*` | yes |
| `fixtures` | `fixtures/**`, `**/fixtures/**` | yes |
| `policy-config` | `.agentic-workflow/path-policy.json` | no — protected at all times |

The five classes and their globs are data, not prose. Extend them in
`path-policy.json`; never inline a project path into a skill.

## Pre-freeze vs post-freeze

A freeze class resolves to `pre-freeze` or `post-freeze` from the plan's declared
`freeze-after` phase (the `path-protection-plan@1` block). The `policy-config`
class always resolves to the `always` row. The requirement for each operation is:

| State | create | modify | delete | rename |
|---|---|---|---|---|
| `pre-freeze` | none | justification | justification | justification |
| `post-freeze` | justification | approval | approval | approval |
| `always` | approval | approval | approval | approval |

Creating a new test pre-freeze is authoring, not modification: it needs no marker
when the plan's `created` rows cover it. Modifying or deleting an already-committed
test needs a justification, plus a recorded owner approval after the freeze.

## Tighten-only rule

An override may **only** add globs or raise a requirement. Removing a shipped
glob or lowering a requirement is ignored — the shipped protection stays in
force — and the attempted loosening is reported as a degradation. The defaults
can never be silently loosened.

## Degradation behaviour

An absent policy is `missing-config`; an unreadable, invalid, or oversized
(over 256 KiB) policy is `malformed-config`. Both fall back to the shipped
defaults and print a `DEGRADED` line, so the guard never fails open and never
disappears. A clean diff still exits 0.

## Escape hatch — never silent

A justified change is a row in the unit's `decisions.md`, under a
`path-protection-records@1` block:

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | <path or glob>[,<path or glob>] | <P<n>> | <YYYY-MM-DD> | execute-phase | <one-line justification>
approval | <path or glob>[,<path or glob>] | <P<n>> | <YYYY-MM-DD> | human-owner | <one-line justification>
```

A `justification` row (authority `execute-phase`) satisfies operations that
require a justification. An `approval` row (authority `human-owner`) satisfies
operations that require an approval and **additionally** requires a matching
justification row for the same path. There is no auto-approval authority: an
approval written by anyone but the owner is malformed, and the guard fails
closed. A record row whose paths match no changed path is `unmatched-record`.

The plan declares the protected paths it will create in the
`path-protection-plan@1` block (`freeze-after` plus `created` / `not-created` /
`ignored` rows, each justified). A created protected path no `created` row
covers is `undeclared-test`.

## Consumers

- **Tier 1 — the checkpoint gate** (`path-guard`, a producer-crate subcommand)
  runs at each phase checkpoint on the phase's committed range and prints a
  fixed `PATH-GUARD` block. It is read-only and offline.
- **Tier 2 — the pi preventive guard** blocks a `write` / `edit` tool call to an
  existing protected path with no matching justification record. Reads and
  new-file creates pass.
