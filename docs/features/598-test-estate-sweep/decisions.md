# Decisions — 598-test-estate-sweep

Owner decisions taken at cut, plus the `path-protection-records@1` rows the
path-protection policy requires for the protected paths this unit edits. A record
is a justification for a change to a test file, never an approval.

- **D1 — the unit home is `docs/features/598-test-estate-sweep/`.** The issue is
  labelled `fix-next`, but its roadmap row (`docs/ROADMAP.md:181`) already links
  `features/598-test-estate-sweep/SPEC.md`, and that table's hand-owned cells are
  passed through by the emitter. Landing the doc under `docs/fix/` would leave
  the row pointing at nothing and would need a hand edit the emitter owns — so
  the folder follows the row (`PE-009`).
- **D2 — the estate inventory is a mode of `test-obligation-tags`, not a new
  command.** That module already owns "which surface does a suite declare, what
  obligation does it assert, what does it cost, and what does the sweep decide"
  (`--list`, `--json`, `--vocabulary`, `--sweep`). A second command reading the
  same tags would be a second reader of one declaration — the duplication
  `AGENTS.md` forbids — and a new CLI surface would owe rows in the router, the
  crate README and `RUNNER.md` that add nothing (`PE-003`).
- **D3 — a package suite's obligation class is `undeclared`.** #596's tag
  grammar is authored beside a root suite and its gate scopes `scripts/`. The tag
  is a semantic claim; 227 claims authored in one sweep would be fabrication.
  The inventory therefore reads a package suite's protected surface from its own
  imports (deterministic, resolvable) and records the obligation class as
  `undeclared`, which is the honest state and is itself evidence (`PE-002`).
  Extending the tag gate to package suites is #596's published surface, a
  decision for its owner, not a side effect of this application unit.
- **D4 — speed is reduced at the runner, never in an assertion.** The estate's
  verdicts may delete on a recorded ground, but no surviving suite is relaxed;
  the cost work is dispatch, pooling and duplicated builds (`S5`).
- **D5 — a delta inside the measured variance is reported as noise.** The host is
  shared and its load average is recorded beside every measurement; a change
  smaller than the spread between two runs of the same class is not a saving and
  is never claimed as one (`PE-010`).

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/test-obligation-tags.test.mjs | P2 | 2026-11-26 | execute-phase | New cases only: the estate mode's discovery counts, the tag-versus-undeclared reading, the cost parse from a fixture log, the `unmeasured` fallback, the four verdicts including the one-survivor rule, and the `--estate --json` agreement with the table. No existing case is relaxed, narrowed, skipped or deleted, and the default gate's four refusal cases are untouched.
```
