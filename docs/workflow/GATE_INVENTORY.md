# Gate inventory — which gates survive compaction, and how each is carried

> One table, one owner, machine-checked: every gate the workflow runs names its
> enforcement carrier. `scripts/prose-gate-inventory.mjs` fails the root suite
> when a carrier stops resolving, when a gate suite enters the tree uncited, when
> a `normative-surfaces@1` id is claimed by no row, or when a top-tier gate is
> left in prose. The issue that owns this surface is
> [#359](https://github.com/gtrabanco/agentic-workflow/issues/359).

## Why this exists

arXiv [2606.22528](https://arxiv.org/abs/2606.22528) (Governance Decay) measures
that context compaction **silently erases prose constraints**: measured
constraint-violation rates rise from 0% to 19–59% post-compaction depending on the
model. This repository compacts long `execute-phase` and `fold-findings` runs, so
a gate enforced only by skill prose can disappear mid-run while the run continues
as if the gate never existed. Before this inventory there was no maintained
answer to *which gates are script-pinned and which are prose-only* — every answer
was a fresh reading of the tree.

## The rule

A gate is inventoried once, and its row says how it is enforced:

| Carrier | What it means | What the row must resolve |
|---|---|---|
| `script` | a root suite or the local gate re-runs it on every push | the pinned suite and a token inside it |
| `cli` | a deterministic check exists, but its inputs are per-run, so no fixed head assertion is possible | the check script and the identifier that names the rule |
| `prose` | only prose states it | the file, the section, and the sentence |

**The ranking is arithmetic, never a judgment.** Each row carries `safety`,
`recurrence` and `checkability`, each 1–3. The validator recomputes the tier:
carrier `script` is terminal; otherwise `safety × recurrence ≥ 6` with
`checkability: 3` derives `migrate`, and every other row keeps its carrier. A
`migrate` row may not survive at the head — this unit wired the top tier, so the
shipped table carries zero `migrate` rows and the validator refuses one.

A row that stays records why, from the closed vocabulary:

- `judgment-needed` — the check needs a per-run input (a diff base, a unit id) or
  the property itself is a judgment that no assertion can decide.
- `low-recurrence` — the mistake is real but rare enough that prose is the right
  cost (`recurrence: 1`).
- `host-owned` — the evidence lives outside the repository (a forge label, a
  pushed ref), so an offline suite cannot decide it.

**Post-compaction resilience.** A prose gate that stays prose names a `rederive`
pointer — a durable file and section an executor re-reads after a compaction,
never only in the conversation. The pointer is resolved by the validator, so a
renamed or deleted section fails the root suite instead of quietly becoming a
rule nobody can find again. The guide, the policy references and the skills stay
the homes of the prose; this table is the index that makes them enumerable.

## The inventory

```text
prose-gate-inventory@1
# gate-suites: scripts/*-discipline.test.mjs + scripts/*-contract.test.mjs + scripts/*-quality.test.mjs + scripts/*-parity.test.mjs
# surface-seed: AGENTS.md#normative-surfaces@1
gate-id | statement | carrier | file | section | token | surfaces | safety | recurrence | checkability | tier | stay-reason | rederive
authoring-lint | SKILL.md frontmatter, body and budget rules | script | scripts/skill-lint.test.mjs | - | the shipped skills tree passes the sweep (S12, O11) | skill-declared-arguments,closing-hand-offs | 2 | 3 | 3 | script | - | -
normative-surface-grammar | every normative surface declares a grammar the drift gate resolves | script | scripts/normative-drift.test.mjs | - | AC15 scope: every normative surface that orders an agent action has a fixed grammar | skill-declared-arguments,closing-hand-offs,gate-rejection-vocabulary,preflight-gate-traces,pre-execution-gate-trace,sensor-labels,sweep-declaration-grammar,snapshot-commands,ledger-ownership-map,ledger-review-mark-shape,ledger-finding-mark-shape,ledger-gate-ran-mark,tier-cost-ledger,sensor-envelope-fields,continuation-refusal-vocabulary,ask-dont-infer-rule,turn-contract-fields,turn-contract-transitions,turn-contract-receipt,open-questions-block,path-protection-contract,spec-requirement-ids,task-spec-links,log-kind-vocabulary,findings-carrier,findings-severity-ladder,findings-impact,path-protection-reasons,risk-tier-vocabulary,risk-tier-signals,risk-tier-reasons,size-tier-vocabulary,risk-tier-verdict,passive-record,adversarial-verdict-vocabulary,adversarial-reflector-vocabulary,adversarial-stability-vocabulary,adversarial-verdict-grammar,test-impact-verdict,projection-seam-vocabulary,projection-op-vocabulary,projection-selector-vocabulary,projection-hash-vocabulary,guard-verdict-vocabulary,guard-rejection-reason-vocabulary,projection-manifest-grammar,guard-verdict-grammar,journal-fragment-grammar,journal-entry-contract,journal-driver-contract | 3 | 3 | 3 | script | - | -
rendered-facts | a prose restatement of a machine value is recomputed, never trusted | script | scripts/normative-drift.test.mjs | - | machine → text: every value of the must-name vocabularies is ordered by a surface | - | 2 | 2 | 3 | script | - | -
guide-layer-budget | the always-loaded guide and its references stay inside declared ceilings | script | scripts/check-skill-context.test.mjs | - | PASS context checker: | - | 2 | 2 | 3 | script | - | -
guide-layer-one-home | a rule moved out of the guide is not restated in it | script | scripts/guide-split.test.mjs | - | no non-trivial line is stated in both the core and a reference (S7) | - | 2 | 2 | 3 | script | - | -
workflow-docs-index | every docs/workflow page is indexed and data files are not | script | scripts/workflow-docs-index.test.mjs | - | the docs/workflow index covers the directory exactly | - | 2 | 2 | 3 | script | - | -
ledger-ownership-map | one writer per ledger column set plus a declared annotator | script | scripts/ledger-ownership.test.mjs | - | the map and both templates declare one owner and the annotator per ledger | ledger-ownership-map | 3 | 3 | 3 | script | - | -
one-findings-carrier | a unit directory carries one findings carrier, never two | script | scripts/ledger-ownership.test.mjs | - | a unit carries one findings carrier | findings-carrier | 2 | 3 | 3 | script | - | -
normalizer-order | mutating normalizers run before the freeze, check-only after | script | scripts/pre-execution-quality.test.mjs | - | normalizer inventory: one home, and every entry names its side of the freeze | - | 3 | 2 | 3 | script | - | -
planning-ledger-shape | the two planning ledgers keep one table each and the closed row shapes | script | scripts/pre-execution-quality.test.mjs | - | ledgerTableFault | - | 3 | 3 | 3 | script | - | -
authoring-conventions | machine surfaces are alphabetical, narrative surfaces follow flow order | script | scripts/pre-execution-quality.test.mjs | - | plugin skills stay alphabetical | - | 1 | 2 | 3 | script | - | -
one-owner-rule | every repetition names its owner and is refused outside it | script | scripts/residue-dimensions.test.mjs | - | zero restatements: no rule-name occurrence outside the owner lacks an owner pointer (S10) | ask-dont-infer-rule | 2 | 2 | 3 | script | - | -
review-loop-termination | the review-to-fold loop is bounded and refuses past the cap | script | scripts/review-loop-discipline.test.mjs | - | stop-review-loop-cap | - | 3 | 3 | 3 | script | - | -
continuation-preconditions | a continuation's preconditions are checkable at emit time | script | scripts/continuation-discipline.test.mjs | - | the emitted /workflow-status continuation parses, checks, and advances next.recommended | turn-contract-transitions | 2 | 2 | 3 | script | - | -
design-stage-contract | design and plan carry investigate, orient, ask, decide in order | script | scripts/knowledge-honesty-contract.test.mjs | - | design and plan state the same four stages, in the same order | ask-dont-infer-rule | 3 | 3 | 3 | script | - | -
scaffold-parity | the exported scaffold carries its repo twin's unit-doc sections | script | scripts/scaffold-parity.test.mjs | - | every exported unit-doc template carries its repo twin's sections, in order | spec-requirement-ids,task-spec-links,log-kind-vocabulary,findings-carrier | 2 | 2 | 3 | script | - | -
unit-doc-contract | the unit doc's section sequence and grammar rows are one contract | script | scripts/unit-doc-contract.test.mjs | - | the owner constant is the 14-section contract, Impact between AC and Non-goals | spec-requirement-ids,task-spec-links | 2 | 3 | 3 | script | - | -
published-vocabulary-parity | published vocabularies have one canonical set and a parity pin | script | scripts/vocabulary-parity.test.mjs | - | the schema package publishes every canonical set, non-empty | risk-tier-vocabulary,risk-tier-signals,risk-tier-reasons,size-tier-vocabulary,continuation-refusal-vocabulary,adversarial-verdict-vocabulary,adversarial-reflector-vocabulary,adversarial-stability-vocabulary,projection-seam-vocabulary,projection-op-vocabulary,projection-selector-vocabulary,projection-hash-vocabulary,guard-verdict-vocabulary,guard-rejection-reason-vocabulary | 2 | 2 | 3 | script | - | -
invocation-drift | tool choice is bun-before-node and rg-before-grep, re-decided at turn | script | scripts/invocation-drift.test.mjs | - | the guide sentence is required in both guides (S1) | - | 2 | 3 | 3 | script | - | -
structural-sibling-pins | heading readers and carrier echoes go through the shared reader | script | scripts/structural-sibling-pins.test.mjs | - | every inline `## `-heading search lives in an allowlisted reader, with a reason | - | 2 | 2 | 3 | script | - | -
model-memory-provenance | a journaled claim's provenance is repository, version-pinned doc, owner answer or model memory — and a `model memory` claim never carries `confirmed` | prose | skills/unit-lane/references/DESIGN.md | Provenance — model memory is never tier-0 | never `confirmed`, and never tier-0 | - | 2 | 3 | 2 | prose | judgment-needed | skills/unit-lane/references/DESIGN.md#Provenance — model memory is never tier-0
red-first-ordering | a new script's suite lands red before its implementation | script | scripts/red-first.test.mjs | - | a suite-only commit before the implementation passes (O2) | - | 2 | 3 | 3 | script | - | -
retrieval-toolchain | the retrieval store has one entry point and is never authority | script | scripts/doc-discipline.test.mjs | - | no skill, hook, schema, or script outside the allowlist opens the store | - | 2 | 1 | 3 | script | - | -
docs-language | no committed translated surface survives a push | script | scripts/doc-discipline.test.mjs | - | no committed .es.md sibling survives the head | - | 2 | 3 | 3 | script | - | -
activation-mount | the working-copy activation mount is never committed | script | scripts/doc-discipline.test.mjs | - | the working-copy activation mount is never committed | - | 2 | 3 | 3 | script | - | -
self-inventory | the inventory itself is a gate: rows, carriers and ranking re-check | script | scripts/prose-gate-inventory.test.mjs | - | the repository's own inventory parses and every carrier resolves | - | 3 | 2 | 3 | script | - | -
docs-projection-current | the committed generated projection matches its sources on every push | script | scripts/docs-generate.test.mjs | - | the committed generated tree is stale | - | 2 | 3 | 3 | script | - | -
relay-status-grammar | the Relay baton carries the closed state set and its leg, phase and evidence cursors | script | scripts/relay-packet.test.mjs | - | a baton whose state is outside the closed set | relay-status-grammar | 2 | 3 | 3 | script | - | -
phase-lint-rules | the eight phase grammar rules, refused at the first breach | cli | scripts/phase-lint.mjs | - | lintPlan | - | 2 | 3 | 2 | cli | judgment-needed | skills/phase-contract/SKILL.md#-
diff-guard-unit-size | a unit's aggregate diff stays inside the declared bound | cli | scripts/diff-guard.mjs | - | formatBreach | - | 2 | 2 | 2 | cli | judgment-needed | skills/execute-phase/references/FOLDING.md#-
test-impact-verdict | the test set is derived from the touched symbols | cli | scripts/test-impact.mjs | - | TEST IMPACT — | test-impact-verdict | 2 | 2 | 2 | cli | judgment-needed | skills/execute-phase/references/TEST_IMPACT.md#-
promise-coherence-claims | every executable claim in a document reproduces | cli | scripts/promise-coherence.mjs | - | CLAIM_KINDS | - | 3 | 3 | 2 | cli | judgment-needed | skills/execute-phase/references/FOLDING.md#-
sweep-declarations | a fold declares its survivor sweep and the gate re-runs it | cli | scripts/promise-coherence.mjs | - | sweep-mismatch | sweep-declaration-grammar | 2 | 2 | 2 | cli | judgment-needed | skills/execute-phase/references/FOLDING.md#-
unit-route-triage | a unit's step list is derived, never chosen | cli | scripts/unit-route.mjs | - | --triage | - | 2 | 2 | 2 | cli | judgment-needed | skills/unit-lane/SKILL.md#-
pre-execution-snapshot | the planning ledgers are bound into a snapshot and re-verified | cli | scripts/pre-execution-snapshot.mjs | - | parseWordingOnlyDeterminations | snapshot-commands | 3 | 3 | 2 | cli | judgment-needed | skills/pre-execution-review/references/SNAPSHOT.md#-
commit-format | commit subjects are conventional at the reviewed head | cli | scripts/ceremony/docs.mjs | - | CONVENTIONAL_RE | - | 2 | 3 | 2 | cli | judgment-needed | skills/execute-phase/references/FOLDING.md#-
roadmap-row-settlement | a landed unit's roadmap row is settled through the writer | cli | scripts/roadmap-settle.mjs | - | pr-url-unsettled | - | 2 | 2 | 2 | cli | judgment-needed | skills/audit-docs/SKILL.md#-
session-close-entry | the session log entry shape is rendered mechanically | cli | scripts/session-close.mjs | - | renderEntry | - | 1 | 2 | 2 | cli | judgment-needed | skills/log-session/SKILL.md#-
union-never-majority | findings are a union; no quorum or threshold exists | prose | skills/pre-execution-review/references/POLICY.md | 2. Findings | Union, never majority. | - | 3 | 3 | 1 | prose | judgment-needed | skills/pre-execution-review/references/POLICY.md#2. Findings
dismissal-counter-evidence | a finding closes as dismissed only with counter-evidence | prose | skills/pre-execution-review/references/POLICY.md | 2. Findings | Dismissal needs counter-evidence | - | 3 | 2 | 1 | prose | judgment-needed | skills/pre-execution-review/references/POLICY.md#2. Findings
single-findings-set | the first review emits one complete unioned findings set | prose | skills/pre-execution-review/references/POLICY.md | 3. Repair | The first review emits one complete unioned findings set | - | 2 | 2 | 1 | prose | judgment-needed | skills/pre-execution-review/references/POLICY.md#3. Repair
clean-context-reviewer | a turn that wrote the artifact may not issue its verdict | prose | skills/pre-execution-review/references/POLICY.md | 1. Independence | A turn that wrote or edited the artifact may not issue its verdict | - | 3 | 1 | 1 | prose | judgment-needed | skills/pre-execution-review/references/POLICY.md#1. Independence
force-push-owner-only | only the owner rewrites published history | prose | AGENTS.md | Working rules | never run `git push --force` | - | 3 | 1 | 1 | prose | host-owned | AGENTS.md#Working rules
human-revision-needed-hold | the label blocks all work until a human removes it | prose | AGENTS.md | Working rules | `human-revision-needed` blocks development | - | 3 | 1 | 2 | prose | host-owned | AGENTS.md#Working rules
one-pr-per-unit | one PR per unit against main; never stacked | prose | AGENTS.md | Working rules | One PR per unit of work, always against `main` | - | 2 | 2 | 1 | prose | host-owned | AGENTS.md#Working rules
vendored-provenance | vendored code keeps source, author, version and license | prose | AGENTS.md | Working rules | source URL, the author, | - | 2 | 1 | 2 | prose | low-recurrence | AGENTS.md#Working rules
stack-agnostic | no product, stack or framework reference enters skills or docs | prose | AGENTS.md | Working rules | Stack/architecture agnostic | - | 2 | 2 | 1 | prose | judgment-needed | AGENTS.md#Working rules
no-backward-compat | a superseded surface is deleted, never kept alive | prose | AGENTS.md | Working rules | No backward-compatibility support | - | 2 | 2 | 1 | prose | judgment-needed | AGENTS.md#Working rules
ask-dont-infer | what no source settles is asked, never invented | prose | skills/unit-lane/references/DESIGN.md | The all-stages no-assumption rule (`ask-dont-infer@1`, #340) | propose options; the user decides | ask-dont-infer-rule | 3 | 3 | 1 | prose | judgment-needed | skills/unit-lane/references/DESIGN.md#The all-stages no-assumption rule (`ask-dont-infer@1`, #340)
tests-never-weakened | a failing test is repaired by changing the code it judges | prose | AGENTS.md | Working rules | never by relaxing, deleting or skipping | - | 3 | 3 | 1 | prose | judgment-needed | AGENTS.md#Working rules
documentation-currency | the README of a changed surface ships with the change | prose | AGENTS.md | Working rules | Documentation currency ships with the unit | - | 2 | 3 | 1 | prose | judgment-needed | AGENTS.md#Working rules
```

## Triage log — what this unit moved

The rows above are the shipped state. The ranking put three carriers in the top
tier (`safety × recurrence ≥ 6` with `checkability: 3`) and they moved into
existing families rather than into a new script of their own:

| Gate | Was | Now | Family |
|---|---|---|---|
| `docs-language` | `cli` — `check-docs-language` existed and only its fixture ran it | `script` — the suite asserts it over the head | documentation ceremony |
| `activation-mount` | `prose` — the guide stated the rule, `.gitignore` enforced the accident | `script` — the suite reads the index | documentation discipline |
| `one-findings-carrier` | `prose` — the ledger stated it and no reader could tell | `script` — the suite walks every unit directory | ledger ownership |

Every other row keeps its carrier with the reason recorded in `stay-reason`. The
alternative — migrating everything — was rejected because a judgment property
with a per-run input does not become checkable by writing a script around it; the
row records that instead of pretending.

## Limits — what this table does not claim

- It does not claim a `script` carrier is complete coverage of the rule. It
  claims the named pin reproduces; a pin that checks one sentence of a rule is
  what it is, and the `statement` cell says which gate it belongs to.
- It does not replace `normative-surfaces@1`: a surface's grammar stays the drift
  gate's job, and the `surfaces` cell only records which ids that row's gate
  enforces.
- It does not own the rules. Every row points at the file and section that does;
  moving a rule is moving its owner, and the row follows in the same change.

## Where it is consumed

`scripts/prose-gate-inventory.mjs` runs in the root suite through
`scripts/prose-gate-inventory.test.mjs`, so every push re-derives the table.
`execute-phase` and `fold-findings` executors read it after a compaction to learn
which gates still bind and how they are carried; #227's deterministic unit-doc
verifier reads it as the enumerated gate set, and #174's state contract can only
carry gates that are enumerable here.
