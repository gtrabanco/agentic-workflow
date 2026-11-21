---
"@gtrabanco/agentic-workflow": minor
---

feat(tests): the test estate gets a measured per-suite verdict and a bounded push

`test-obligation-tags --estate` inventories every root suite and every package
suite — the surface each one protects, the obligation class it declares (or the
honest `undeclared` a package suite carries, because no tag declares one), its
measured cost from the gate's own `PASS <file> (N.Ns)` lines — and derives a
verdict from the three owner standards: a dead surface deletes, an
obligation-level duplicate merges into its cheapest measured survivor, and a
cost per obligation over the declared limit is a measurement the declared
at-most-five selection caps. A `delete` or `merge` needs an adjudication row
before it is applied.

The crate suite now runs its 77 files through the gate's bounded worker pool
instead of one process: `run-root-suite` gained `--dir`/`--cwd`/`--test-timeout`,
so a package's suite tree is the same instrument the root gate already uses. The
pre-push budget is declared once in code and recorded against per-class
measurements in `scripts/pre-push-budget.json`; a hook flag change that would
leave the receipt describing another command is refused by `local-gate`'s suite.
No test is weakened, and no guard is skipped to fit the budget.
