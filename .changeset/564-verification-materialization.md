---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(materialize): declared boundaries become recorded outcomes (issue #564)

`agentic-workflow materialize` is the last mile the workflow can own after the
engineering interview: the interview records, per boundary, whether it is
enforced by a machine or **by prose only** — and a boundary that lives in a
reviewer's memory is not a boundary. The service materializes the *decision*,
never the verification: the rule's content is always the adopting team's
(`adapt, don't ship`), so the project names the mechanism and the workflow
records it.

Four operations. `plan` prints one row per declared boundary plus the feature map
and the artifact-capture driver, with a residual for every item that has no
outcome. `check` is the declaration-enforcement check: a `prose-only` charter
entry with no recorded outcome, an invariant section with no `Enforcement` bullet,
a scaffolded rule the tree does not carry, or a declared feature map that is
absent or still templated is one typed finding from a published vocabulary, each
carrying a `finding-route@1`-shaped route. `apply` is the only writer and needs
an explicit consent per batch: it records each outcome in the target's
boundary-enforcement record (the `boundary-enforcement@1` columns below) and flips a scaffolded boundary's charter
answer to `machine: <mechanism>`; a `no` writes nothing and leaves one residual
per item, and an absent consent is a refusal. `evidence` closes the
artifact-evidence half: a criterion naming `artifact: screenshot|video|state-snapshot`
must record `digest: sha256:<hex>` and the project-declared driver command, and
fails closed with a `manual:` label when no driver is declared.

The schema package publishes the three closed vocabularies (outcomes, finding
codes, artifact kinds), the crate mirrors them with a parity pin, and the runner
crate's README carries the `materialization@1` field contract.

`init-workspace` gains the materialization round as a reference and a write-step
invocation, the template ships `template/docs/workflow/FEATURE_MAP.md` and
`template/docs/workflow/BOUNDARY_ENFORCEMENT.md`, the charter gains the `Evidence driver`
slot with its interview row, the invariants template gains the `Enforcement`
bullet, `verification-contract` owns the artifact-evidence convention, the
lane's docs step owns the feature map's update duty, and `audit-docs` runs the
check as check 17.
