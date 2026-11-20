# Adjudications — 598-test-estate-sweep

Every standard the estate inventory fires is a measurement; the ruling on it is
this file. One row per fired standard, in the emitter's own row shape:

```text
adjudication@1
suite | standard | what was read | verdict
```

`verdict` is `keep` or `delete`. A `delete` also names the commit that removed
the suite in `estate.md`'s log line. The rows below are everything
`bun scripts/test-obligation-tags.mjs --estate --cost <root-suite log>` fired on
the tree at cut: four obligation-level duplicates and the five selected
cost-over-risk rows (the declared at-most-five selection).

## Obligation-level duplicates

The detector compares the **declared** obligation set on an identical protected
surface. That is coarser than the assertions: two suites can declare
`contract,failure-path` on one module and assert entirely different behaviour.
Each row was read before it was ruled on, which is what
`skills/unit-lane/references/TESTS.md` § Deletion authority requires — the same
conclusion #596's sweep reached for the same clusters.

suite | standard | what was read | verdict
scripts/local-gate.test.mjs | obligation-duplicate | 60 top-level cases over `scripts/local-gate.mjs`: the step table, the env scrubbing, the hook body, the refusals. `scripts/dependency-gate.test.mjs`'s 12 cases assert the dependency receipt's fingerprint and its invalidation matrix — a different behaviour on the same module | keep
scripts/pre-execution-wording-only-manifest.test.mjs | obligation-duplicate | ATTACK / NEGATIVE / CONTROL over a rewritten `ACCEPTANCE.md` and the manifest that must refuse to certify it. `scripts/index-document.test.mjs` asserts the index document's four sections, its stub and the two parsers — a different behaviour on the same module | keep
scripts/unit-route.test.mjs | obligation-duplicate | the route table's decisions (replan, terminal, decision, plan owner, product hand-off). `scripts/lane-era-lineage.test.mjs` asserts the lane-era plan snapshot, the legacy acceptance manifest and the closure gate — a different behaviour on the same module | keep
scripts/workflow-status-compact.test.mjs | obligation-duplicate | the compact envelope: memo fingerprinting, the merged-row drop, the byte-identical repeat. `scripts/next-recommendations.test.mjs` asserts the hand-off wording rules (complete ids, no ellipsis, review-before-fold) — a different behaviour on the same module | keep

## Cost over risk (the selected five)

The declared selection rule ranks every `cost / obligation` row and takes at
most five, highest first. Read as the issue's third class — "asserting
constants/strings the risk-based standard does not justify" — none of them
qualifies: each asserts behavioural output through spawned fixtures, so the
cost is setup and process spawns, not a literal comparison. Their cost is the
reduction pass's business (`S4`), never a deletion ground.

suite | standard | what was read | verdict
scripts/phase-lint.test.mjs | cost-over-risk | 136 cases over the phase lint's rules; every case builds a plan fixture and spawns the lint, so the cost is per-case process startup. A deletion would remove rule coverage, not a constant assertion | keep
scripts/workflow-status-sensor.test.mjs | cost-over-risk | 81 cases over Envelope v2: the sensor's emission, every required key, the read-only proof and the degraded arms, each spawning the sensor against a fixture repo | keep
scripts/ceremony-findings-ledger.test.mjs | cost-over-risk | 19 cases over the findings/ledger appenders, each mutating a fixture carrier and reading it back; the module pair is one ceremony surface and the cases cover append, update, fold and delete separately | keep
scripts/ceremony-unit-plan.test.mjs | cost-over-risk | 18 cases over the unit-doc ceremony: create, read, update by section, and the ledger embeds; each writes a fixture unit folder | keep
scripts/next-step-ranking.test.mjs | cost-over-risk | the seven-level ranking ladder, one fixture git repository per case (init, add, commit); the cost is the per-case repository, which is the reduction pass's target, not an assertion worth deleting | keep
