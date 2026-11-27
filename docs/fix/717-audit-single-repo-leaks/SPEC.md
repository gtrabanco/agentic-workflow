---
type: fix
scope: medium
ac-hash: e34222fca4cce4d2067b033936b16563344a8798baae0080c9246fd200bf3757
roadmap_summary: Issue [#717](https://github.com/gtrabanco/agentic-workflow/issues/717) (M): the single-repo-leak census — every CLI subcommand declares whether it resolves a project path or a product path, the read-only ones are run once against a foreign-tree fixture, and the three confirmed leaks are repaired by naming the product fact they were silently assuming.
---

# fix/717-audit-single-repo-leaks

> One-line: a shipped command may read a project-owned path from the project and
> a product-owned path from the installed package — never a product path from the
> project root — and the class stops recurring one issue at a time because every
> subcommand now declares which of the two it does and the foreign-tree run is a
> standing check.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
census.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
```

## Issue

`#717` — tracked issue in the project's forge. The PR closes it via `Closes #717`.
The unit lives under `docs/fix/` because it is applied through the owner's local
workflow (`## Log` L2), the same home units 701/703/706/710/716 took. Family: the
#716/#717 defect class — a distributable surface that silently assumes this
repository's tree (`#716` fixed the scheduler's vocabulary; this unit is the
sweep of the rest).

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. `S1` is the operator's order; `S2`–`S12` quote the
issue's own words, which that order adopts as the work.

**S1 — the order: apply #717 to this repository, inline.**
> Apply to this repository: issue #717

**S2 — the class and the audit that this unit is.**
> #716 established one instance of the same defect class: `batch-scheduler`'s surface vocabulary is hardcoded to this repository's own tree layout. This issue asks for a **systematic audit** of the rest of the distributable surface for the same class of leak — single-repo assumptions in code that ships to every consumer project — and a defensible classification of each occurrence.

**S3 — the test every occurrence answers.**
> The test for every occurrence: **is the consumer able to satisfy or declare this path, and was it documented as a product requirement?** If the path only exists inside the product's own repo and nothing declares it to consumers — it is a leak.

**S4 — the closed classification vocabulary.**
> Static reading is my own; the audit should re-verify each and assign it one of: confirmed-defect / construction-only / declared-convention / intentional.

**S5 — candidate 1, the phase-lint layer table, and the decision it is owed.**
> The docstring calls it "the frozen target-file → layer prefix table (SPEC §Design, box-2)". Any consumer task target under the consumer's own source tree (`src/**`, `app/`, `lib/`, …) returns `null`, and `box2` (line 507) returns `{ ambiguous: token }` → `verdict BLOCKED: unparseable`.
>
> The audit should decide: is the phase-block grammar a supported consumer surface? If yes, the table is a live foreign-tree blocker; if the unit-doc grammar is the single supported shape, the table is product-construction-only and the narrow `LAYERS` enum question disappears with it. Either way the *frozen* word deserves a decision, not an accident.

**S6 — candidate 2, the obligation-tag estate.**
> `discoverEstate` (line 451) walks `packages/<name>/test/**` as one of its estate legs. On a consumer with no `packages/` directory the leg silently contributes zero rows. … Result: the obligation-tag estate is **incomplete on foreign trees with no degradation named**. The audit should check what the command reports in that shape (empty estate? partial gate pass?) and whether a silent partial is a false PASS by the crate's own fail-closed standards.

**S7 — candidate 3, the dimension-regression guard.**
> These paths resolve inside the product repo. Consumers receive the skills through the pi package or local installs (e.g. `.agents/skills/…`), so on a consumer the guard either never triggers (no changed path matches) or fails to read `DIMENSIONS_REL`. This one may well be **construction-only by design** — the dimension vocabulary is arguably the product's own invariant — but the audit should record whether that scope restriction is documented (a consumer running the command gets what: error, empty, or silent pass?) rather than incidental.

**S8 — candidate 4, the citation grammar.**
> Across skills' SKILL.md files and reference docs, ownership is cited as `owner: skills/<name>/references/…` (e.g. triage-issue's `ISSUE_PROCESS.md`, phase-contract, orchestration-envelope). Inside the product repo those resolve literally. For a consumer the same file lives inside the installed package or the harness's skill directory — never at `skills/…` of the project root. … This is the **documentation-scope** face of the leak: the audit should decide whether the citation grammar needs a documented consumer-side resolution rule (e.g. "owner paths are repo-relative to the installed package, never the consumer tree").

**S9 — candidate 5, the template that promised what the sensor refused.**
> The seeded template tells every consumer to write "the **project's** lane key", while the producer (`surfaceKey`, #716) only accepts this repo's own vocabulary. A consumer that writes its real lane key per the template gets `surface-unknown`. This is a product-surface contradiction (template vs sensor) that a vocabulary fix must close together — worth its own line in #716's resolution so the fixer doesn't patch the code and leave the template lying.

**S10 — candidate 6, the standing criterion this unit must leave behind.**
> A useful audit deliverable is a **standing criterion** (maybe a lint/audit pass) that flags shipped code deriving behavior from this repo's own layout, so the class stops recurring one issue at a time.

**S11 — the audit shape, its litmus shapes, and its non-repair route.**
> 1. Inventory the distributable surface: `packages/agentic-workflow/src/**` (sensors, commands, ceremony, doc, edit, relay), `packages/agentic-workflow-schema/src/**`, `packages/pi-agentic-workflow/**`, `template/**`, and the skills as consumed from a consumer side.
> 2. For each occurrence of a path/layout assumption, classify with the test above: **declared convention / construction-only (documented) / construction-only (undocumented) / defect**.
> 3. Findings tables include the reproduction method: the two litmus shapes are (a) a unit doc with consumer-tree targets and real layer declarations, (b) an estate/sensor run against a foreign tree with no `packages/`, no `skills/`, no `template/`.
> 4. Fix or file each defect separately; this issue is the census, not the repair.

**S12 — the triage verdict and the route the owner recorded.**
> **VERDICT: fix-now (M)**
>
> This is a follow-up audit for the same defect class as #716: single-repo path/layout assumptions leaked into the distributable surface (code, not convention). The audit must classify every occurrence as: declared convention / construction-only (documented) / construction-only (undocumented) / defect.
>
> **Route:** `/unit-lane --fix 717` (depends on #716 — the vocabulary fix from #716 establishes the pattern the audit sweeps against)

> medium (systematic but the preliminary sweep found 6 candidates; no observed consumer failure yet — all are potential or construction-only)

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the order is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and `rg -n 'review-change|audit-pr' docs/fix/717-audit-single-repo-leaks/` matches only the workflow text quoted in `## Log` L2 and the decisions that record the exemption.
2. **S2 — the inventory is the whole shipped CLI, not a sample.** `bun test scripts/single-repo-leaks.test.mjs` exits 0 with the case `S2: every subcommand the CLI publishes declares its path-resolution class`, which reads `runner help --json` and the help registry and refuses a command with no declaration or a declaration outside the closed set.
3. **S3 — the test is mechanized on a foreign tree.** `bun test scripts/single-repo-leaks.test.mjs` exits 0 with the case `S3: a read-only command on a foreign tree names no product-internal path`, which builds the fixture consumer tree (`src/**`, no `packages/`, no root `skills/`, no `template/`) and refuses any occurrence of a product-only path in a read-only command's stdout or stderr.
4. **S4 — every candidate carries one classification from the closed set.** `bun test scripts/single-repo-leaks.test.mjs` exits 0 with the case `S4: the census classifies all six candidates with a reproducer`, which parses `census.md` and requires one row per candidate, each with a value from `declared-convention | construction-only (documented) | construction-only (undocumented) | defect | intentional` and a backticked reproducer command.
5. **S5 — the phase-lint decision is recorded and the refusal names its cause.** `bun test scripts/phase-lint.test.mjs` exits 0 with the case `S5: an unmapped target fails closed by name, citing the grammar scope`, asserting `verdict BLOCKED: layer-unknown` plus the offending token for a foreign-tree target, while `verdict BLOCKED: unparseable` keeps its other causes; `docs/fix/717-audit-single-repo-leaks/decisions.md` carries the `D` row that resolves S5's open question.
6. **S6 — test-obligation-tags answers on a consumer tree and never passes an empty estate.** `bun test scripts/test-obligation-tags.test.mjs` exits 0 with the cases `S6: the vocabulary resolves from the installed schema package, not the project root` and `S6: an estate with no suite refuses instead of passing`, the latter asserting `verdict: FAIL` with `estate-empty` on a root that carries no suite.
7. **S7 — dimension-regression names an absent carrier.** `bun test scripts/dimension-regression.test.mjs` exits 0 with the case `S7: an absent carrier is named instead of compared`, asserting a `carrier | … absent` line and a `carrier-missing` refusal when the range touches a review surface and `DIMENSIONS_REL` does not resolve.
8. **S8 — the citation grammar has one documented consumer-side rule.** `rg -c 'repo-relative to the installed' skills/orchestration-envelope/references/PORTABILITY.md` matches at least 1, and `bun scripts/skill-lint.mjs` exits 0 with the census citing that owner row.
9. **S9 — the template/sensor contradiction is closed and recorded as closed.** `rg -n "the project's lane key" template/docs/features/_TEMPLATE/SPEC.md` matches, and the census's candidate row cites the #716 commit that closed it; no template edit is made in this unit.
10. **S10 — the standing criterion runs as a repo gate over the live tree.** `bun scripts/single-repo-leaks.mjs` exits 0 on this checkout and prints the `single-repo-leaks@1` receipt with zero findings; `docs/workflow/GATE_INVENTORY.md` carries the row `single-repo-leaks` whose pinned token resolves in that suite.
11. **S11 — the litmus reproducers pass inside the suite.** `bun test scripts/single-repo-leaks.test.mjs` exits 0 with the cases `S11 (a): a consumer-tree unit doc lints in the unit-doc grammar` and `S11 (b): the foreign-tree estate run names its legs instead of reporting a silent zero`, both building the fixture tree in `mktemp`.
12. **S12 — the change is additive and the repository's own answers do not move.** The differential against the base commit (`mktemp -d` copies, both runs) shows no unrequested stdout/stderr/exit difference for the commands this unit does not repair, recorded as an `E` line; `git diff --name-only main...HEAD` touches this unit's declared paths only, with no envelope version bump and no deleted test.

## Impact

Four shipped surfaces, the CLI's own grammar, and the prose that documents them.

- **`packages/agentic-workflow/src/runner/help.mjs`** — every one of the 77
  `HELP_REGISTRY` entries gains a `resolution` cell (`project | product | host`)
  so adding a subcommand requires declaring which root it resolves against. This
  is the S10 standing criterion's declaration half, and it is the reason the
  class cannot regrow silently.
- **`packages/agentic-workflow/src/single-repo-leaks/index.mjs`** (new) — the
  census producer: it reads the registry, runs the read-only `project` rows
  against `--root`, and reports the `single-repo-leaks@1` receipt.
- **`packages/agentic-workflow/src/runner/sensors/phase-lint.mjs`** — a task
  target the shipped prefix table cannot map stops being a bare `unparseable`;
  it fails closed as `layer-unknown`, naming the token and the documented scope.
- **`packages/agentic-workflow/src/test-obligation-tags/index.mjs`** — the
  obligation vocabulary is imported from the schema package (the dependency both
  entry points resolve) instead of read from a repo-relative source file; the
  tag-grammar owner doc is `n/a — product-internal` when absent; an estate that
  discovers no suite refuses `estate-empty` instead of passing.
- **`packages/agentic-workflow/src/dimension-regression/index.mjs`** — the
  report names an absent carrier, and a range that touches a review surface on a
  tree without `DIMENSIONS_REL` refuses `carrier-missing` instead of comparing
  zero dimensions.
- **Prose**: the new dimension + sweep section in
  `skills/product-audit/references/AUDIT_DIMENSIONS.md`, the `single-repo-leaks`
  gate row, the `single-repo-leaks` normative-surface row in `AGENTS.md`, the
  crate README's tool inventory, one consumer-side citation rule in
  `skills/orchestration-envelope/references/PORTABILITY.md`, and the census.
- **Named high-risk item (verbatim from the tier verdict)**: `"1 path(s) touch a
  named high-risk surface: destructive (packages/agentic-workflow/src/runner/cli.mjs
  · ../workflow-doctor/index.mjs · (module-level))"` — the new subcommand is
  registered in that dispatch table, so the registration is reviewed by the
  owner's external verification, which is this unit's review step (`D2`).

What to ask before touching: none open — the six candidates' questions are
resolved by the recorded decisions (`decisions.md`, `D1`–`D6`).

## Surfaces

- `packages/agentic-workflow`
- `skills/product-audit`
- `skills/phase-contract`
- `skills/orchestration-envelope`
- `skills/runner-contract`
- `scripts`
- `docs`
- `AGENTS.md`

## Retirements

Nothing is retired. The unit is strictly additive on every executable surface:
one new module, one new launcher, one new suite, one new field on each existing
registry entry, one new subcommand, one new gate row and one new dimension
section. The three repairs change a refusal's *name* and a resolution *source*,
never a token a consumer already reads: `unparseable` keeps its other causes,
`verdict: PASS` keeps its shape, `not-applicable` keeps its meaning.

The compiled surface inventory is the anti-divergence receipt:
`runner residual-classify --inventory --base <rev>` over the change reports each
added surface with the state the plan decides for it (`## Log` E-row). The one
surface that lands without a consumer yet — the `resolution` cell on the
`host`-class rows — is consumed by the census producer, so no `residual-promise`
row is needed.

## Non-goals

- **Not a rewrite of any command's behaviour beyond the three named repairs.**
  Every other `project`-class command is measured, not changed; a new finding
  routes to the owner, never into this unit (`## Log` D5).
- **Not a per-occurrence corpus of path literals.** The census's classification
  is per *surface* (one row per candidate) plus the per-command declaration; a
  lexical allowlist of every literal in `packages/*/src` would be 458 rows of
  prose citations and would measure nothing the declaration does not (`D3`).
- **Not a config section for the phase-lint layer map.** S5's recorded decision:
  the unit-doc grammar is the single supported consumer shape, so the phase-block
  grammar is product-construction-only and the `LAYERS` enum question disappears
  with it (`D4`).
- **Not a consumer-side `test-obligation-tags` estate redesign.** The command's
  suite estate is product-construction-only; the repair makes it refuse by name
  instead of passing silently, and the discovery redesign is recorded as a
  proposal for the owner (`known-issues.md` K2).
- **No network read, no forge write.** The census runs local commands; nothing
  opens an issue.

## Risk tier

Copied verbatim from `runner ceremony tier classify` at the cut head (the
command's own output, `## Log` E1).

- **Tier** — `high` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true}`
- **Named high-risk item** — `"1 path(s) touch a named high-risk surface: destructive (packages/agentic-workflow/src/runner/cli.mjs · ../workflow-doctor/index.mjs · (module-level))"` — quoted again in `## Impact`.
- **Why `high`, from the verdict (`## Log` E1)** — `reason_kind: named-high-risk`; the single signal is the CLI dispatch table, which this unit extends with one subcommand. The verdict's ceremony (`unit-doc+review-change`) is replaced by the owner's external verification (`D2`), per the governing workflow (`## Log` L2 §4).

## Future

- **2026-12-24 (#717 §"Suggested audit shape" 4) — "Fix or file each defect
  separately".** The two repairs this unit does not make are filed as
  owner-facing proposals in `known-issues.md` (K1: the phase-lint declared layer
  map; K2: the consumer estate discovery). Status: `planned` — the owner decides
  whether each becomes its own unit.

## Future cost

- **A new CLI subcommand must declare its `resolution` cell.** Binds: whoever
  adds the subcommand — the help registry and the conformance suite refuse a
  missing or unknown value, so the declaration is not optional.
- **A repaired command's refusal text is a contract.** Binds: this repository —
  `layer-unknown`, `estate-empty` and `carrier-missing` are named findings that
  a test pins, so a later reword is a deliberate change with its test.
- **The census is a snapshot of one head.** Binds: the next audit — the table
  records the base revision it was measured at, and a re-run is the way to
  refresh it, never an in-place edit of the classification.

## Applicable tests

- `bun test scripts/single-repo-leaks.test.mjs` — the standing criterion: the
  declaration, the foreign-tree run, the census's classification, the two litmus
  shapes.
- `bun test scripts/phase-lint.test.mjs` — S5's named refusal.
- `bun test scripts/test-obligation-tags.test.mjs` — S6's two cases.
- `bun test scripts/dimension-regression.test.mjs` — S7's carrier naming.
- `bun scripts/local-gate.mjs` — the repository gate, at handoff.

## Known pre-existing issues

- **K1 — the phase-lint layer map is still this repository's tree.** The `D4`
  decision makes the scope explicit and the refusal named; a project that wants
  the phase-block grammar's cross-layer check would need the declared map. Does
  not affect this unit's criteria (S5 is the decision plus the named refusal).
- **K2 — the obligation-tag estate still discovers only `scripts/` and
  `packages/*/test/`.** `affects` S6 only in that an empty estate now refuses;
  the leg redesign is the owner's call.
- **K3 — `docs/audits/2-2026-11-16.md` F2 attributes all five report-only
  advisory rows to undici.** Pre-existing at the base commit; `does-not-affect`
  this unit (no advisory work here).
- **K4 — the roadmap row for `#716` still reads `pending` although the issue is
  closed.** Pre-existing at the base commit; `does-not-affect` this unit (the
  row is another unit's settle work, recorded so the census's index read is
  honest).

## Tasks

- P1 — Cut the unit doc, the two ledgers, the decision record, the known-issues record and the census's skeleton, and freeze the acceptance criteria (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/717-audit-single-repo-leaks/SPEC.md --no-git` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12)
  - Relevant files: docs/fix/717-audit-single-repo-leaks/SPEC.md, docs/fix/717-audit-single-repo-leaks/planning-evidence.md, docs/fix/717-audit-single-repo-leaks/planning-obligations.md, docs/fix/717-audit-single-repo-leaks/decisions.md, docs/fix/717-audit-single-repo-leaks/known-issues.md, docs/fix/717-audit-single-repo-leaks/census.md
- P2 — RED: the conformance suite lands alone and is observed failing on the leaks it judges (validator: `bun test scripts/single-repo-leaks.test.mjs` exits 1 on the named cases, recorded as an `E` line)
  (Implements: S2, S3, S4, S10, S11)
  - Relevant files: scripts/single-repo-leaks.test.mjs
- P3 — The declaration and the producer: every subcommand declares its `resolution`, and `runner single-repo-leaks` prints the receipt over `--root` (validator: `bun test scripts/single-repo-leaks.test.mjs` exits 0)
  (Implements: S2, S3, S10)
  - Relevant files: packages/agentic-workflow/src/runner/help.mjs, packages/agentic-workflow/src/single-repo-leaks/index.mjs, scripts/single-repo-leaks.mjs, packages/agentic-workflow/src/runner/cli.mjs, packages/agentic-workflow/README.md
- P4 — phase-lint fails closed by name on an unmapped target, citing the grammar scope (validator: `bun test scripts/phase-lint.test.mjs` exits 0)
  (Implements: S5)
  - Relevant files: packages/agentic-workflow/src/runner/sensors/phase-lint.mjs, scripts/phase-lint.test.mjs, skills/phase-contract/SKILL.md
- P5 — test-obligation-tags resolves the product's facts from the product and refuses an empty estate (validator: `bun test scripts/test-obligation-tags.test.mjs` exits 0)
  (Implements: S6)
  - Relevant files: packages/agentic-workflow/src/test-obligation-tags/index.mjs, scripts/test-obligation-tags.test.mjs
- P6 — dimension-regression names an absent carrier instead of comparing zero dimensions (validator: `bun test scripts/dimension-regression.test.mjs` exits 0)
  (Implements: S7)
  - Relevant files: packages/agentic-workflow/src/dimension-regression/index.mjs, scripts/dimension-regression.test.mjs
- P7 — The census: every candidate classified from the closed set with its reproducer, its litmus receipt and its route (validator: `bun test scripts/single-repo-leaks.test.mjs` exits 0 with the `S4` case green)
  (Implements: S3, S4, S5, S6, S7, S8, S9, S11)
  - Relevant files: docs/fix/717-audit-single-repo-leaks/census.md, skills/orchestration-envelope/references/PORTABILITY.md
- P8 — Docs currency: the dimension section, the gate row, the normative-surface row, the README rows (validator: `bun scripts/skill-lint.mjs` exits 0 and `bun scripts/prose-gate-inventory.mjs` exits 0)
  (Implements: S8, S10)
  - Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md, docs/workflow/GATE_INVENTORY.md, AGENTS.md, packages/agentic-workflow/README.md, skills/orchestration-envelope/references/PORTABILITY.md, skills/runner-contract/references/RUNNER.md
- P9 — State: the roadmap row read (hand-owned), the changeset and the session journal fragment (validator: `bun scripts/docs-generate.mjs --check` exits 0 and `bun scripts/lint-changeset.mjs .changeset/717-audit-single-repo-leaks.md` exits 0)
  (Implements: S1, S12)
  - Relevant files: docs/ROADMAP.md, .changeset/717-audit-single-repo-leaks.md, .agentic-workflow/journal/
- P10 — Verification: the frozen corpus green, the differential against the base commit, the obligations ledger closed (validator: `bun scripts/local-gate.mjs` exits 0 and every obligations row reads `verified`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12)
  - Relevant files: docs/fix/717-audit-single-repo-leaks/planning-obligations.md, docs/fix/717-audit-single-repo-leaks/SPEC.md

## Triaged steps

`runner unit-route --triage 717` at the cut head, verbatim:

```text
TRIAGE — 717 (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/717-single-repo-leaks
relay-seam: ask (relay.seam; absent = ask) — the question stays open
relay-next: create .pi-web/relays/717-single-repo-leaks/ (charter → docs/fix/717-audit-single-repo-leaks/SPEC.md) · ASK the owner: relay legs, or inline `/execute-phase 717-single-repo-leaks P1` · STOP for the answer · on "relay" set `State: Active` in .pi-web/relays/717-single-repo-leaks/status.md then dispatch_relay(packet: ".pi-web/relays/717-single-repo-leaks", leg: "1") as the final action · legs: 11 = 10 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | packages/agentic-workflow/src/single-repo-leaks/index.mjs:174-182 | correctness | WARNING | blocking | source | fold |
| F2 | packages/agentic-workflow/src/single-repo-leaks/index.mjs:230 | security | WARNING | blocking | source | fold |
| F3 | packages/agentic-workflow/src/single-repo-leaks/index.mjs:276 | correctness | WARNING | blocking | source | fold |
| F4 | packages/agentic-workflow/src/test-obligation-tags/index.mjs:29 | spec-drift | WARNING | documents | source | fold |
| F5 | S12 / docs/fix/717-audit-single-repo-leaks/SPEC.md (Surfaces+P3-P10 relevant files omit `packages/agentic-workflow/bin/agentic-workflow.mjs`) | spec-drift | WARNING | documents | plan | fold |

## Log

- **L1** — 2026-12-24, the operator's order, verbatim:
  ```
  Apply to this repository: issue #717
  ```
- **L3** — 2026-12-24, the intent resolved from state before any action: the branch `feat/717-audit-single-repo-leaks` is cut from `67133da45` with zero commits ahead of `main`, the dependency #716 is `CLOSED` (2026-11-26), the roadmap row reads `pending`, no unit dir existed and no verdict or `EXTERNAL VERIFY` block was on disk → **continue** at the first incomplete phase, which is §5's ledger cut. The triage seam's relay question is answered by the operator's own order (`L2` §4, "Work inline"): inline, no packet, no dispatch.
- **E1** — 2026-12-24, `bun packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify --paths "<the 25 planned paths>"` · exit 0 · `tier: high`, `reason_kind: named-high-risk`, one signal (`packages/agentic-workflow/src/runner/cli.mjs` · destructive) — copied verbatim into `## Risk tier`.
- **P1** — 2026-12-24, the unit doc, both ledgers, the decision record, the known-issues record and the census's skeleton are cut; the acceptance section is frozen before the first line of code. Commit `c1dc7bd5d`.
- **E2** — 2026-12-24, `bun test scripts/single-repo-leaks.test.mjs` at the suite-only commit `b1d775b50` · exit 1 · 0 pass / 1 error: the suite cannot import `packages/agentic-workflow/src/single-repo-leaks/index.mjs` — the frozen corpus lands alone and is observed failing on the behaviour it judges (the producer and the declaration did not exist).
- **P2** — 2026-12-24, the frozen-failure corpus lands alone. Commit `b1d775b50`.
- **P3** — 2026-12-24, the declaration and the producer: all 78 `HELP_REGISTRY` entries carry a `resolution` cell (67 `project`, 7 `product`, 4 `host`), 13 of them declare a `probe`, `runner single-repo-leaks` prints the receipt over a fixture it builds, and the CLI's usage banner plus its unknown-service refusal name the `runner-contract` skill instead of a product path. Commit `ac17787dc`.
- **P4** — 2026-12-24, `phase-lint` fails an unmappable task target as `layer-unknown` naming the token and the documented grammar scope, and the `phase-contract` skill states which shape is the consumer's.
- **P5** — 2026-12-24, `test-obligation-tags` imports the published obligation set from the schema package, reports the tag-grammar owner doc `n/a — product-internal` on a tree that does not carry it, and refuses `estate-empty`.
- **P6** — 2026-12-24, `dimension-regression` names an absent carrier and refuses `carrier-missing` instead of comparing zero dimensions.
- **P4/P5/P6** — 2026-12-24, the three repairs and their suite cases. Commit `804a36ca6`.
- **E3** — 2026-12-24, `bun test scripts/single-repo-leaks.test.mjs` · exit 0 · 11 pass / 0 fail — the cases: `S2: every subcommand the CLI publishes declares its path-resolution class`, `S2: a registry entry without a declaration or with an unknown one is refused by name`, `S3: a read-only command on a foreign tree names no product-internal path`, `S3: the leak rule measures resolution, not wording`, `S4: the census classifies all six candidates with a reproducer`, `S10: the producer prints the receipt with zero findings and refuses a missing root`, `S10: an undeclared command fails the producer`, `S11 (a): a consumer-tree unit doc lints in the unit-doc grammar`, `S11 (b): the foreign-tree estate run names its legs instead of reporting a silent zero`, `S7: a carrier absent from the measured tree is named, never compared as zero`, `S10: the census contract is published and the suite declares its own surface`.
- **E4** — 2026-12-24, `bun scripts/single-repo-leaks.mjs` · exit 0 · `declared | 78 subcommand(s) · project 67 · product 7 · host 4`, `probe | 13 read-only project command(s) executed · 13 declared`, `verdict PASS`.
- **E5** — 2026-12-24, `bun test scripts/phase-lint.test.mjs` · exit 0 · 164 pass / 0 fail — `S5: an unmapped target fails closed by name, citing the grammar scope` and `S5: the untokenizable class keeps unparseable, so the new reason is not a rename` are the two cases this unit adds (the corpus grew two cases: the named refusal and the regression that `unparseable` keeps its other causes; four pre-existing cases that asserted `unparseable` on an unmappable target now assert the named code — `D7`).
- **E6** — 2026-12-24, `bun test scripts/test-obligation-tags.test.mjs` · exit 0 · 24 pass / 0 fail, both new cases among them: `S6: the vocabulary resolves from the installed schema package, not the project root` and `S6: an estate with no suite refuses instead of passing`.
- **E7** — 2026-12-24, `bun test scripts/dimension-regression.test.mjs` · exit 0 · 12 pass / 0 fail, the new case `S7: an absent carrier is named instead of compared` among them.
- **E8** — 2026-12-24, the litmus on the consumer fixture (`src/**`, no `packages/`, no root `skills/`): `phase-lint docs/features/49-ledger/PLAN.md` → exit 1, `P1 box-2: task 1 target \`src/pages/ledger.ts\` belongs to no layer …` + `verdict BLOCKED: layer-unknown`; `phase-lint docs/fix/49-ledger/SPEC.md` → exit 0, `PASS (6/6)` + `verdict PASS`; `test-obligation-tags --root <fixture>` → exit 1, `estate-empty … verdict: FAIL`; `dimension-regression --root <fixture> --base HEAD` → `carrier | skills/product-audit/references/AUDIT_DIMENSIONS.md absent`, `verdict | not-applicable`.
- **E9** — 2026-12-24, the package and root suites this change touches: crate `cli.help` 18/0, `cli.surface` 12/0, `runner.dispatch` 7/0 (each +0 fail); root `prose-gate-inventory` 22/0, `check-skill-context` 1/0, `guide-split` 17/0, `residue-dimensions` 30/0, `structural-sibling-pins` 8/0, `cli-coverage` 8/0, `invocation-drift` 13/0, `restatement-sweep` 10/0, `gate-producer-drift` 10/0, `normative-drift` 24/0.
- **E10** — 2026-12-24, the linters and emitters: `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s)`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 33 skills`; `--routes` · exit 0 · `PASS route budgets: 14 routes`; `--documents` · exit 0 · `PASS context documents: 7 budgeted documents`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs prose-gate-inventory` · exit 0 · `verdict: PASS`; `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`; `bun scripts/lint-changeset.mjs .changeset/717-audit-single-repo-leaks.md` · exit 0 · `ok`.
- **E11** — 2026-12-24, the differential against the base commit `67133da45` (two `git archive` copies under `mktemp -d`, both `bun install --frozen-lockfile`, same commands, same cwd shape): `restatement-sweep` and `unit-route 716` are byte-identical on stdout, stderr and exit; `prose-gate-inventory` differs on one line only — a resolved anchor moves `phase-lint.mjs:887` → `:897` because the module grew (the receipt prints a location, not a result); `test-obligation-tags` differs on one line only — `147 suite(s)` → `148`, the suite this unit adds. Both differences are the change itself, and nothing else moved.
- **P7** — 2026-12-24, the census: six candidates classified from the closed set with their reproducers, the sweep result and the two litmus receipts. Commit `d61628e82`.
- **P8** — 2026-12-24, docs currency: the audit dimension and its sweep section, the gate row, the normative-surface row, the three budget re-bases with their declared growth sources, the crate README rows and the citation rule. Commit `d61628e82`.
- **P9** — 2026-12-24, state: the changeset, the journal fragment written through `journal write`, and the roadmap row read — it already exists with its hand-owned `pending` cell, which the emitter never rewrites (a fix row is removed after its merge, never re-derived), so no hand edit was made. Commit `d61628e82`.
- **E12** — 2026-12-24, `bun scripts/local-gate.mjs --jobs auto` (first run) · exit 1 · bailed at `root-suite`: `scripts/dimension-regression.test.mjs` refused the live table because its `FROZEN` pin did not carry the new dimension. That pin is the maintenance the suite's own docstring prescribes ("adding a dimension means extending it here in the same change"), so it now names `Distributable-surface scope` last; no assertion was relaxed.
- **E13** — 2026-12-24, `runner dimension-regression --base 67133da45` (the same run as `bun packages/agentic-workflow/bin/agentic-workflow.mjs dimension-regression --base 67133da45`) · before the record: `20 dimensions` at the base, `21` at the head, `refused` on `missing-reverification-evidence`; this line is the record, and the re-run after it reports the same 20 → 21 with `clean` (`E14`).
- **E14** — 2026-12-24, `bun scripts/local-gate.mjs --only "workspace-install,schema-build,root-suite,version-parity-content,docs-generated-projection,skill-context-budgets,journal-carrier-check,log-immutability,secret-scan,temp-hygiene,tmp-gc,worktree-guard,rigidity-review,dimension-regression,schema-node-compat,pi-compat-guard,dependency-pin-gate,machine-ledger-commit,dependency-advisories" --jobs 2` · exit 0 · `local-gate: PASS — 17 step(s) in 349s` (`root-suite` 148 suites, `dependency-advisories` `found 0 vulnerabilities`, `pi-compat-guard` both legs `tsc --noEmit clean`). Three steps stay red for pre-existing, environment-dependent causes reproduced at the base commit `67133da45`: `crate-suite-bun`/`crate-suite-node` (3 + 6 doc/embedding cases, identical names at both commits — K6) and `pi-node-compat` (11 failing embedding-profile cases at the base, 6 at the head — K7). Two earlier gate runs were red on this unit's own drift and were repaired, not excused: the dimension suite's `FROZEN` pin (E12) and the unit folder's slug against the roadmap row (renamed to `docs/fix/717-audit-single-repo-leaks/`, the row's own topic).
- **P11** — 2026-12-24, the branch reached the forge: the pre-push hook was red on the pre-existing `crate-suite-bun` cause (K6), so the push used the hook's own documented hatch (`AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`) with the reason recorded in PR [#742](https://github.com/gtrabanco/agentic-workflow/pull/742)'s body — never an undocumented `--no-verify` — and the PR was opened against `main`.
- **P10** — 2026-12-24, verification: the frozen corpus green (E3, E5–E7), the declaration and the probe green (E4), the linters and emitters green (E10), the differential explained line by line (E11), and the gate's 17 non-environment steps green with the three pre-existing reds named (E14, K6, K7). The obligation ledger is closed: 14 of 14 rows `verified`. Commit `a9b7ff453`.
- **L2** — 2026-12-24, the operator's governing workflow for this application, verbatim (the part that binds the procedure):
  ```
  ## 0. Resolve the intent from state before acting

  Print the resolution **before** any action — the state decides the sequence, the words only pick the verb:

  - **continue** → the next incomplete phase from the unit doc (`P<n>` unticked);
  - **fix findings / repair** → read the unit dir's latest `EXTERNAL VERIFY` block (or last review verdict) and run one correction batch on its blockers, per correction history (§9);
  - **re-verify** → hand off to `/aw-local-review` on the current head;
  - plain prose → infer the closest of the three; state contradicts the intent → stop and report it with evidence.
  ...
  4. Work inline — never run this repo's own machinery on its own surgery

  No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.
  ```
- **L4** — 2026-11-27, the correction batch's request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
- **P12** — 2026-11-27, the correction batch on the `EXTERNAL VERIFY` receipt (`external-verify.md`, 2 blockers + 9 advisories), triaged and applied: **B1** settled in `cb82d34b9` through `runner roadmap fixrow` with the revision CAS — the base-pre-existing blank line inside `### Active` came out first because it ended the writer's row scan before row 717 (never a hand row edit; the removal also closes the duplicate-row trap for rows 716…654), and `docs/generated/units.md` was re-rendered by the emitter; **B2** declared `skills/runner-contract/references/RUNNER.md` in `## Surfaces` and P8's relevant files — the row is gate-forced by `runner.resolve.test.mjs` and was simply undeclared. Advisory triage: A1 corrected by E16, A2's owed E-row added as E15, A3 and A4 fixed in `1cac437da` (A3's first wording grew the `execute-phase:unit-loop` route over its zero-headroom ceiling and was re-trimmed to no growth — routes re-checked green), A5–A8 no-change (frozen merged-unit history at base; base-proven environment), A9 no-change (the `2026-12-24` prose pattern pre-exists at base — the inherited row-717 notes carry it — and journal fragments are append-only carriers).
- **E15** — 2026-11-27, `bun packages/agentic-workflow/bin/agentic-workflow.mjs residual-classify --inventory --base 67133da45` · exit 0 · `residual-classify-inventory@1`, 19 rows, every surface `used`/`live-consumer` — the `## Retirements` E-row this citation owed (receipt A2).
- **E16** — 2026-11-27, the differential re-run after the batch (fresh `git archive` of `67133da45` under `mktemp`, own `bun install --frozen-lockfile`, the same four commands): `restatement-sweep` (exit 0 both) and `unit-route 716` (exit 1 both) byte-identical on stdout and stderr; `prose-gate-inventory` differs on exactly four lines — tally `92 row(s) · script 64` → `93 · 65`, the added `single-repo-leaks` row, anchors `scripts/dimension-regression.test.mjs:140` → `:143` and `…/phase-lint.mjs:887` → `:897`; `test-obligation-tags` differs only `147` → `148` suites. This corrects E11's "one line only" narration for `prose-gate-inventory` (receipt A1): four lines, every one this change's own — and the batch itself moved nothing beyond them.
- **G1** — 2026-11-27, HEAD 0a6f3133ef6487134dab9545aac2e5cb995683e5 (the batch's working tree over that head), `bun scripts/run-root-suite.mjs` · exit 0 · `148` suites PASS (the receipt's state was 147 PASS with `roadmap-settle` red under B1).
- **G2** — 2026-11-27, HEAD 0a6f3133ef6487134dab9545aac2e5cb995683e5 (the batch's working tree over that head), `bun scripts/local-gate.mjs --only "workspace-install,schema-build,root-suite,version-parity-content,docs-generated-projection,skill-context-budgets,journal-carrier-check,log-immutability,secret-scan,temp-hygiene,tmp-gc,worktree-guard,rigidity-review,dimension-regression,schema-node-compat,pi-compat-guard,dependency-pin-gate,machine-ledger-commit,dependency-advisories" --jobs 2` · exit 0 · `local-gate: PASS — 17 step(s) in 321s` — every step green, `schema-node-compat` and `pi-compat-guard` ran in-graph this time (B1's red is gone).
- **F1** — 2026-11-27, folded receipt **B1** (`roadmap-settle pr-url-unsettled`) in `cb82d34b9`: row 717 now reads `done · [#742](https://github.com/gtrabanco/agentic-workflow/pull/742)`, written by `roadmap fixrow --expect <revision>`. Verified: `bun test scripts/roadmap-settle.test.mjs` → 10 pass / 0 fail; `bun scripts/docs-generate.mjs --check` → PASS after the emitter re-render.
- **F2** — 2026-11-27, folded receipt **B2** (AC12's undeclared path) in this record commit: `## Surfaces` and P8 now declare `skills/runner-contract/references/RUNNER.md`. Verified: `git diff --name-only 67133da45...HEAD | rg runner-contract` resolves to a declared path, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/717-audit-single-repo-leaks/SPEC.md --no-git` exits 0.
- **R1** — 2026-11-27, review-change at HEAD 4e44054149fd6d7764c7098ac783928924698a5e (reviewed bytes; the forge tip moved to 1e47a52c4 before receipt time with a journal-only delta, foreign-only per fix/286) · verdict REVIEW-FAIL · cycle 1 · gate exit 0 (`G3`)
- **G3** — 2026-11-27, HEAD 1e47a52c40ca170750f39e539f2bc023918f4b73, `bun scripts/local-gate.mjs --only workspace-install,schema-build,root-suite,version-parity-content,docs-generated-projection,skill-context-budgets,journal-carrier-check,log-immutability,secret-scan,temp-hygiene,tmp-gc,worktree-guard,rigidity-review,dimension-regression,schema-node-compat,pi-compat-guard,dependency-pin-gate,machine-ledger-commit,dependency-advisories --jobs 2` (via the producer `runner gate-receipt run`) · exit 0 · `local-gate: PASS — 17 step(s) in 400s` · manifest 85d3861287c98fa29ab82b5da664164d90ed7d9ab746e6cb72ecc538dcf64be4 — the run first red on this unit's own drift (the findings-corpus count pin lacked the cycle's new rows, repaired first, never relaxed: `findings` 1179→1184, `reviewMarks` 184→185) and again on the pre-existing environment reds (K6/K7), excluded exactly as E14/G2's declared green set excludes them
- **V1** — packages/agentic-workflow/src/single-repo-leaks/index.mjs:174-182 · reviewer review-change · HEAD 4e44054149fd6d7764c7098ac783928924698a5e · recheck behavioral reproducer: `census` with a nonexistent bin → `probed 1, findings [], verdict PASS` (a probe that never ran is scored executed-and-clean; `result.error` and `status: null` are unread; only `timedOut` is named) · confirmed
- **V2** — packages/agentic-workflow/src/single-repo-leaks/index.mjs:230 · reviewer review-change · HEAD 4e44054149fd6d7764c7098ac783928924698a5e · recheck behavioral reproducer: `bun packages/agentic-workflow/bin/agentic-workflow.mjs single-repo-leaks --root README.md` → `probe | 13 read-only project command(s) executed`, `verdict PASS`, exit 0 (a `--root` that exists but is not a directory is never validated; `fs.existsSync` is the only gate) · confirmed
- **V3** — packages/agentic-workflow/src/single-repo-leaks/index.mjs:276 · reviewer review-change · HEAD 4e44054149fd6d7764c7098ac783928924698a5e · recheck behavioral reproducer: the two entry routes pass different `productRoot` (`main()` uses `context.root ?? PACKAGE_ROOT`, the scripts caller passes the repo root) — a leaky probe output yields 1 finding via the repo root, 0 via the crate root (PASS); and `packages/agentic-workflow/template` does not exist, so the shipped bin route silently builds its fixture without the template scaffold · confirmed
- **V4** — packages/agentic-workflow/src/test-obligation-tags/index.mjs:29 · reviewer review-change · HEAD 4e44054149fd6d7764c7098ac783928924698a5e · recheck direct read: the module header still says the tag vocabulary is `TEST_OBLIGATION_KINDS`, read from committed source, while the same change makes the gate read it from the installed schema package (line 21) — one of the two header claims the unit's docs-currency step missed · confirmed
- **V5** — docs/fix/717-audit-single-repo-leaks/SPEC.md §Surfaces/P3 · reviewer review-change · HEAD 4e44054149fd6d7764c7098ac783928924698a5e · recheck direct read: `git diff --name-only 67133da45...4e4405414` carries `packages/agentic-workflow/bin/agentic-workflow.mjs` (the usage-banner pin wording and the unknown-service refusal, P3's C4 work) and no `Relevant files`, `## Impact` row or `## Surfaces` entry declares it · confirmed

## Next

The owner's external verification: read the diff, the census and the obligations
ledger, and give the verdict. Nothing else is pending on this branch.

## References

- **PR** [#742](https://github.com/gtrabanco/agentic-workflow/pull/742) — this
  unit's delivery (base `main`; the head is this PR's own branch head, 33 files, +1874/−66).
- Issue [#717](https://github.com/gtrabanco/agentic-workflow/issues/717) — the
  request this unit applies, quoted verbatim in `## Specs`.
- `docs/fix/716-batch-scheduler-surface-vocab/` — the sibling unit of the same
  class; its vocabulary resolver is the pattern S10's declaration reuses.
- `docs/fix/597-scope-manifest/` (issue #553) — the precedent the S6 repair
  follows: the installed package is the dependency, the repo-relative path is
  not.
- `docs/fix/717-audit-single-repo-leaks/census.md` — the census itself.

## Branch

`feat/717-audit-single-repo-leaks`

## Depends on

Empty — `#716` is merged, so this unit's dependency is satisfied.

## Regression scope

| scenario | verifier |
|---|---|
| `phase-lint`'s other fail-closed causes (`missing-plan`, `no-phases`, a missing/out-of-enum `Layer:`, a lint failure) keep their verdicts | `bun test scripts/phase-lint.test.mjs` — the pre-existing cases |
| a valid plan still prints one `PASS (8/8)` line per phase, a unit doc one `PASS (6/6)`, and both keep their fingerprints | `bun test scripts/phase-lint.test.mjs` — the `VALID_PLAN`/unit-doc cases |
| `test-obligation-tags` on this checkout still passes its own gate and its vocabulary parity | `bun scripts/test-obligation-tags.mjs` exits 0, and `bun packages/agentic-workflow/bin/agentic-workflow.mjs test-obligation-tags --vocabulary` exits 0 |
| `dimension-regression` still answers `not-applicable` for a range that touches no review surface, and `clean`/`refused` for a range that does | `bun test scripts/dimension-regression.test.mjs` — the pre-existing cases |
| every subcommand keeps its dispatch: `help --json` lists all 78 (77 + this unit's), and each name still resolves | `bun test packages/agentic-workflow/test/cli.help.test.mjs` and `test/cli.surface.test.mjs` |
| the audit dimension's seven existing sweeps keep their sections and the new one is additive | `bun scripts/product-audit-surplus.test.mjs` and `bun test scripts/single-repo-leaks.test.mjs` |
