# Tests step

## Purpose

Run and verify the tests the triage determined are applicable. Test execution
rides the executor's phases (each phase's `validator:` runs the project's
gate); when the tests step is the turn's own boundary, it hands off like
implement does — one `/execute-phase <NN-slug> P<k> (tier: <tier>)` turn,
never inline.

## Inputs

- The unit's Applicable tests section (filled by triage)
- The project's test runner command from Workflow conventions
- The change's **test impact set** — the tests it can affect, derived before the
  first run (owner: `skills/execute-phase/references/TEST_IMPACT.md`; this
  repository's implementation is `bun scripts/test-impact.mjs --base <rev>`)

## Fixed output contract

Each test run is recorded in the Evidence section:

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| T1 | <test command> | exit_code | summary ≤2 lines | <model> |

## Checklist (pass only if)

- [ ] All applicable tests ran (the project's gate command executed)
- [ ] The run's set came from the impact block, and an `empty` verdict is
      recorded as the evidence for a prose-only change — never a silent skip
- [ ] Every test passed — no test was weakened to pass
- [ ] Results recorded in the Evidence section with command, exit, output
- [ ] If no tests step for this unit: `n/a — no tests step for this unit`
- [ ] A new script+suite pair this unit introduces landed red-first: the
      suite committed alone and observed failing (the red commit), the
      implementation committed after, observed green
- [ ] A suite this unit adds or touches declares its obligation tag, and every
      surface it protects still exists (see § Obligation tags)

## Forbidden

- Never weaken a test to pass
- Never silence test failures
- Never skip a test that the triage catalog demands
- Do not add tests the triage did not request (scope creep)

## Red-first commits

A new script+suite pair lands red-first: the suite commits alone, observed
failing on the missing module or the failing assertion (the red commit), the
implementation commits after, observed green. The unit doc's `## Log`
records both runs as `E` lines naming both commit SHAs — the evidence names
the commits, never just the runs.

## Obligation tags

The owner of the `test-obligation-tag@1` grammar, and the only place it is
stated. A suite answers two questions beside its first line: **which surface
it protects** and **what obligations its assertions cover there**. That
declaration is what lets the project answer "which tests justify their cost?"
without falling back on line coverage, which measures at roughly zero
correlation with fault detection once suite size is controlled.

One annotation line per suite, beside the suite and never in a central
registry — a registry rots away from what it describes, and an orphaned suite
keeps passing while nothing notices. Consumed by the project's obligation-tag
gate (this repository's implementation: `bun scripts/test-obligation-tags.mjs`)
and by the audit's test-surplus sweep, which reads the tag as its dead-surface
evidence.

```text
test-obligation-tag@1
kind | shape | what it orders
tag | // test-obligation: protects=<path>[,<path>…] obligations=<kind>[,<kind>…] | one line per suite at the suite head — line 1, or line 2 after a shebang, before the docblock — naming the surface the suite protects and the obligations its assertions cover there
protects | a repository-relative path, or a directory path | the surface the suite exists for; a path because only a path lets "the surface is gone" be resolved by a gate, so a rename moves its tags in the same change
obligations | one or more of the values below, comma-separated | what the assertions cover on that surface: a suite naming none is a suite whose cost nothing justifies
kind contract | the observable behaviour contract | a documented input produces the documented output, and the assertion is on that pair rather than on an internal step
kind failure-path | the required failure state | the miss is refused by name and nothing is silently defaulted: a refusal, an exit code, a fail-closed default
kind boundary | the edge of an input, size or time domain | empty, zero, one, the declared maximum, the off-by-one, a timeout — the domain's ends, not its middle
kind distribution-contract | a surface that ships bytes | package contents, prompt text, a generated projection, a published schema — legitimate even where the assertion looks redundant with a sibling, because a distributed byte is not covered by another module's behaviour
kind fixture-support | a shared fixture or helper | the suite exists for the fixture other suites read, so its obligation is that the fixture stays correct, never a product behaviour
kind convention | a repository convention no runtime enforces | naming, ordering, placement, registration — the rule a review would otherwise re-derive every unit
deletion | delete is not weaken | a test disappears when its protected surface is gone, when another suite carries the same protected surface and the same obligation set (obligation-level duplication, read from the assertions — never from line coverage), or when its measured cost exceeds the risk it covers; weakening a test so it passes is never this rule, and § Forbidden already refuses it
```

The deletion rule is the reason the tag exists: without it, "the surface is
gone, so the test goes" has to be re-derived at every audit, and a cost-driven
deletion without obligation evidence is how coverage-based minimisation
silently loses fault detection. A stale tag — a protected path that no longer
exists — is a gate refusal, not a note.
