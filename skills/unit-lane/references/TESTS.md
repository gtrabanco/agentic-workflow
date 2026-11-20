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
  first run (owner: `skills/execute-phase/references/TEST_IMPACT.md`; the
  command is `runner test-impact --base <rev>`)

## Fixed output contract

Each test run is recorded in the Evidence section:

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| T1 | `<test command>` — justifies: `<the obligation>` | exit_code | summary ≤2 lines | <model> |

A row that records a test this unit authored carries the justification line
§ The justification line owns, appended to its `What was run` cell. The five
columns are the published set (`EVIDENCE_COLUMNS` in the schema package), so the
clause rides a cell and never becomes a sixth column.

## Checklist (pass only if)

- [ ] All applicable tests ran (the project's gate command executed)
- [ ] The run's set came from the impact block, and an `empty` verdict is
      recorded as the evidence for a prose-only change — never a silent skip
- [ ] Every test passed — no test was weakened to pass
- [ ] Results recorded in the Evidence section with command, exit, output
- [ ] If no tests step for this unit: `n/a — no tests step for this unit`
- [ ] A new script+suite pair this unit introduces landed red-first — the
      obligation and the evidence shape are the guide's (`AGENTS.md` § Working
      rules), the mechanism is [TEST_IMPACT.md](../../execute-phase/references/TEST_IMPACT.md)'s;
      this cell cites both and adds nothing (§ Red-first commits is that same
      pointer, kept once)
- [ ] A suite this unit adds or touches declares its obligation tag, and every
      surface it protects still exists (see § Obligation tags)
- [ ] Every test this unit authored carries its justification line in the run's
      evidence row (§ The justification line) — a missing one is a finding
- [ ] A test this unit deletes was scheduled as a task or reached it as a
      `fix-now (delete)` row, and its evidence cites the ground
      (§ Deletion authority)

## Forbidden

- Never weaken a test to pass
- Never delete a test outside § Deletion authority, and never delete one to
  make a suite green — the evidence is the ground, never the convenience
- Never silence test failures
- Never skip a test that the triage catalog demands
- Do not add tests the triage did not request (scope creep)

## Red-first commits

Owned elsewhere, cited here: the obligation and the evidence shape are
`AGENTS.md` § Working rules (a suite lands alone, observed red, and the unit
doc's `## Log` records both runs as `E` lines naming **both commit SHAs**), and
the mechanism — how the test set is derived and what the RED evidence must name —
is [TEST_IMPACT.md](../../execute-phase/references/TEST_IMPACT.md)'s. No rule in
this file is a second wording of either.

## The justification line

A test this unit requests carries **one line** naming the independent obligation
it covers: the observable contract, the required failure path, or the boundary
edge that would go unguarded without it — the behavioural gap, never the
implementation under test. "It passes" and "a reference implementation would
also pass" are two different claims, and only this line separates them: a clause
that reads back the module it calls asserts that code exists, and one repeating
a sibling suite's obligation is the duplication the surplus sweep prices as cost
without value.

The line rides the run's evidence row, as § Fixed output contract places it:

```text
test-justification@1
kind | shape | what it orders
line | — justifies: <the independent obligation> | one clause after the row's command, so a reader learns what the pass bought without opening the suite
names | the observable contract, the required failure path, or the boundary edge | the behaviour a consumer depends on, stated as the pair (input or state → documented outcome), never as an internal step
never | the implementation under test, a sibling suite's obligation, or the assertion restated | the three shapes that make the clause worthless: the module named instead of its behaviour, an obligation another suite already covers, and the test's own mechanism narrated back
absent | fix-now | a test with no justification line is a review finding, never a silent pass — the class, the severity and the route belong to the classifier (`skills/review-implementation/references/CLASSIFY.md`), not to this block
```

The obligation values are the tag's (§ Obligation tags), so the clause and the
tag cannot disagree: a line naming an obligation its tag does not declare is the
same finding as a line that is missing.

## Deletion authority

The owner of `test-deletion-authority@1`, and the only place who-may-delete is
stated. § Obligation tags' `deletion` row says *when* a test may go; this section
says *who* executes it, so that "findings only, never edits code" and "never
weaken a test" cannot be read as a ban on an evidenced deletion — and so that an
evidenced one cannot be read as a licence for weakening.

```text
test-deletion-authority@1
kind | shape | what it orders
ground | dead-surface · obligation-duplicate · cost-over-value | exactly one ground per deletion, named in the row that records it; the ids and each one's evidence standard are the surplus checks' (owner: `skills/product-audit/references/AUDIT_DIMENSIONS.md` § Test-surplus sweep, the `test-surplus@1` block), cited here and never restated
scheduled | a deletion task in the unit's triaged step list | `execute-phase` may delete the test that task names, and only that one: the task is retirement-shaped (`skills/unit-lane/references/PLAN.md`'s retirements pane), its evidence row cites the ground and the evidence source, and the commit records what the deletion removed
fix-now | a finding row typed `fix-now (delete)` | `fold-findings` may delete the test the row names: the row already carries the finding's evidence, so the fold's commit and the row's `folded: yes` flip are the record, and the frozen classification is untouched — the fold executes what the row says and never reclassifies it
nobody-else | a findings-only surface | `product-audit` and every `review-*` emit the finding and never delete; test-impact targeting names the tests a change can affect and never removes one
boundary | delete ≠ weaken | deletion with the evidence above is a separate, evidence-gated action: never an exception to red-first, which governs new pairs, and never a way to turn a red suite green — a suite that goes red because a deletion removed a needed guard was a planning error, so it routes back to the owner instead of taking the rest of the guard with it
```

Two facts keep the authority from becoming a loophole. A deletion reaches the
branch only with the evidence its ground demands; an unsupported one is the
weakening § Forbidden already refuses, and the difference is the evidence, not
the intention. And a deletion is a task with a validator like any other: a plan
that schedules one without its ground fails the plan's own completeness rule,
while a fold that deletes without a `fix-now (delete)` row has reclassified a
finding, which the fold's contract forbids.

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
gate (this repository's implementation: `runner test-obligation-tags`)
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
deletion | delete is not weaken | a test disappears when its protected surface is gone, when another suite carries the same protected surface and the same obligation set (obligation-level duplication, read from the assertions — never from line coverage), or when its measured cost exceeds the risk it covers; weakening a test so it passes is never this rule, and § Forbidden already refuses it. Who may execute one, and what its evidence row must cite, is § Deletion authority's
```

The deletion rule is the reason the tag exists: without it, "the surface is
gone, so the test goes" has to be re-derived at every audit, and a cost-driven
deletion without obligation evidence is how coverage-based minimisation
silently loses fault detection. A stale tag — a protected path that no longer
exists — is a gate refusal, not a note.
