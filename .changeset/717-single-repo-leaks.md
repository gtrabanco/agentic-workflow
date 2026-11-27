---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(cli): the single-repo-leak census — every subcommand declares the root it resolves against (issue #717)

A shipped command may read a project-owned path from the project and a
product-owned path from the installed package, never a product path from the
project root. That distinction was applied per file, so the class — a
repo-relative reading that degrades silently on a foreign tree — regrew one
issue at a time: #716 fixed the batch scheduler's vocabulary, and the census
that followed found four more surfaces.

`single-repo-leaks` makes the question unavoidable and measure it: every
`HELP_REGISTRY` entry carries a `resolution` cell (`project`, `product`,
`host`), a missing or unknown cell is refused, and the read-only `project` rows
are executed once against a consumer-shaped fixture built from the template. A
path token a command prints that resolves in the product tree and not in the
fixture is the finding, so the check fails on the next leak rather than on the
next audit. The receipt is `single-repo-leaks@1`, quoted by the product-audit
dimension that owns the sweep.

Three confirmed leaks are repaired by naming the fact they were assuming:
`test-obligation-tags` imports the published obligation set from the schema
package instead of reading `packages/agentic-workflow-schema/src/vocabularies.ts`
under the measured root (the #553 rule), and refuses `estate-empty` instead of
passing an estate with no suite; `dimension-regression` names an absent carrier
and refuses `carrier-missing` instead of comparing zero dimensions;
`phase-lint` fails an unmappable task target as `layer-unknown`, naming the
token and the documented scope — the unit-doc grammar is the supported consumer
shape, and the plan grammar's prefix table is this repository's own tree. The
CLI's usage banner and its unknown-service refusal name the `runner-contract`
skill instead of a `skills/…` path a consumer cannot resolve.
