## Audit dimensions (platform-adaptive — run only what applies)

### Deterministic-producer pre-pass (#440, the review-axis pattern of #359)

Every dimension starts at its deterministic producer's output where one exists
(the **Deterministic producer (pre-pass)** column): consume that receipt — the
command, its working target and the supporting output line, bound per the
evidence-provenance gate in `AUDIT_PROCESS.md` — **receipt-quoted** and
**never re-run by the model**; the model never re-derives a measured fact by inspection
(linting by eye, recounting advisories, re-grepping what a script already
emits). A producer that has not run yet is run once — running a deterministic
producer to obtain its receipt is not re-running it by inspection — and only
the **non-mechanizable remainder** of the dimension is model-swept.
(Pattern source: the review-axis pattern of #359.)

### Profile-aware scope (#436 — consumption-side)

When the project declares a **ceremony profile** (the machine-readable
`ceremony-profile@1` block in the guide's `## Project charter`), a dimension
(or a profile-declared producer, such as the per-language dead-code linters)
the profile does not declare is recorded `n/a — not declared by the project's
ceremony profile` instead of swept — one-shot/organic repos do not pay
full-audit ceremony. No profile is declared → every applicable dimension runs.
The `review-passes` surfaces the profile names are the same closed set this
skill's review-axes vocabulary publishes (`PASS_NAMES` minus `classify`); the
profile grammar itself is #436's; this skill only consumes it and never
invents profile slots or waives a verification contract.

| Dimension | What it sweeps product-wide | Producer (pre-pass) | Applies to |
|---|---|---|---|
| **Correctness & architecture** | Bugs, layer/boundary violations, dead code, overengineering, drift from the architecture doc | none — the repo-wide bug hunt is this skill's exclusive model surface | all |
| **Security & cybersecurity** | Secrets in repo, authz gaps, input validation, dependency / supply-chain risk | `dependency-advisories` (already a local-gate step) receipt-quoted; pin/posture checks when the profile declares them (#436 scorecard-family slot) — the rest (repo-wide security research) is model | all |
| **Performance** | Hotspots, complexity, N+1s, bundle/asset weight (web), resource leaks | a profiler only when the project's profile declares one (#436) — receipt-quoted; otherwise none | all |
| **Tests** | Coverage of critical paths, missing/!flaky tests, untested failure modes — and the **surplus** direction: tests that should not exist (§ Test-surplus sweep) | the project's declared test/coverage gate receipt when one exists; otherwise none | all |
| **UX / UI** | Design-system adherence, broken states, inconsistency | none — model sweep (the `review-design` pass) | web / mobile / TUI |
| **Accessibility** | a11y conformance for user-facing surfaces | none — model sweep (the `review-a11y` pass) | web / mobile |
| **SEO** | Indexability, metadata, structured data | none — model sweep (the `review-seo` pass) | web |
| **Brand / voice** | User-facing copy vs. the brand guide | none — model sweep (the `review-brand` pass) | surfaces with copy |
| **Tech debt** | Accumulated shortcuts, TODO/FIXME, stale abstractions | per-language dead-code linters when the profile declares them (#436 slot) — receipt-quoted; the accumulated-debt remainder is model | all |
| **Residue — duplication** | Duplicate content across code **and skill/docs prose** — a grammar block, checklist, table, contract or paragraph copied where a reference should carry it; the duplication check today diff-scoped in `review-code`, re-swept product-wide (see § Residue sweeps) | none — the diff-scoped `review-code` check is consumed where a diff exists; product-wide is model | all |
| **Residue — unused code** | Code — and skill prose, same rule — that nothing consumes, classified two ways per the classifier's rule (§ Residue sweeps): delivered-feature-without-consumer → bug finding; orphaned-by-requested-replacement/removal → deletion candidate; the dead-code check today diff-scoped in `review-code`, re-swept product-wide | per-language dead-code linters when the profile declares them (#436 slot) — receipt-quoted | all |
| **Residue — documentation** | Obsolete docs (they describe surfaces that no longer exist) and missing docs (a live **consumer-facing** surface with no consumer-facing doc — the document-or-don't-coin residue); composes `audit-docs` and never restates its axes (see § Residue sweeps) | `audit-docs` output — receipt-quoted, never restated (see § Residue sweeps) | all |
| **Process & docs** | Incomplete phases, aging open issues, **solvable known-issues**, doc completeness, missing/optimizable workflow docs, capability-inventory freshness (`docs/CAPABILITIES.md` ↔ code drift) | `audit-docs` mechanical checks — receipt-quoted | all |
| **Workflow discipline** | The workflow's own rules held: branch/PR discipline, `done · #<pr>` links, phase naming (`P1…`), per-phase docs, commit format, dependency closures, artifact language — **run `audit-docs` checks mechanically** (cite the count from `audit-docs`; never restated in the dimension table); never assume a rule held because it "should". **Scope-export recurrence:** across the most recent units (merged or in-flight), each with a non-empty `## Amendments` descope log or a descope-classified born issue (`audit-pr`'s scope-bleed gate) counts as one scope-exporting unit — **≥ 2 consecutive** such units is a planning-quality finding ("features cut too big for real capacity"), routed to the atomicity/split rules (**#64**), not re-litigated as a per-unit defect | `audit-docs` mechanical checks — receipt-quoted (already the contract of this row) | all |
| **Roadmap coherence** | Stale/obsolete/superseded features, missing dependencies, gaps & opportunities | `audit-docs` script-first index checks — receipt-quoted where they cover the row set; the gap/opportunity judgment is model | all |
| **Installed tooling** | Installed skills + connected MCP servers vs. the project's applicable axes and roadmap features — unregistered-but-useful items, and tooling that would change a feature's scope; every row the project registered in its `review-extras@1` note is reported with its decay state (`unpinned`, `stale`, `incomplete`), so an extra that rotted is a finding rather than a memory | `agentic-workflow skills inventory --guide AGENTS.md` — receipt-quoted for the registered set; the MCP half is the agent's own inventory, stated plainly when it cannot be enumerated | all |
| **Coverage gaps** | Declared verification criteria with no detector, admitted recurring finding classes with no preventive gate, and declared detectors consuming no criterion — the forward-looking half the findings corpus (#437) does not cover | `bun scripts/coverage-gap.mjs <repo>` receipt-quoted (`coverage-gap@1`, § Coverage-gap sweep) | all |
| **Journal signals** | The corrections a session had to make, the sessions each unit consumed (rework), and the findings its own reviewers refuted — cross-joined to the findings corpus, so a class the journal alone records still arrives with the corpus row it belongs to | `bun scripts/journal-corpus.mjs <repo>` receipt-quoted (`journal-corpus@1`, § Journal-signal sweep) | all |

Skip inapplicable axes (no a11y/SEO/brand for a CLI/library/infra product) and
**say which you skipped and why**. Every axis is covered by the workflow's own
internal review pack (`review-code`, `review-security`, `review-verify`,
`review-debt`, `review-design`, `review-a11y`, `review-brand`, `review-perf`,
`review-seo`) — installed with the workflow, so an applicable axis can never be
"missing". Platform skills the project installed run as optional extras on top.

## Residue sweeps (pass-only-if)

The three residue dimensions run product-wide across code **and skill/docs
prose** — "code" includes prose everywhere in this section (#340). A sampled
sweep states what it sampled, like every dimension. Findings route through the
classifier (`review-implementation`, `CLASSIFY.md`) like every other finding.
The orphan/deletion side reuses the four residual states of #438 —
**used / scaffold / half-built / orphan** — the vocabulary is owned there and
never restated or forked here.

**Duplicate content** — pass only if:

- ✓ every duplicated grammar block, checklist, table, contract or paragraph found is either a reference to a single owner or carries its declared reason for the copy
- ✓ a **shadow copy** — a file, script, schema, helper or prose block whose original lives in a pinned dependency or a published package — is a duplicate of that artifact, not a local convenience: one finding citing the copy, the artifact and its pin; vendoring is legitimate only with its provenance header and a recorded reason, never as a silent fork
- ✓ each confirmed duplicate is one finding citing both locations
- ✓ the same sweep run over the clean fixture twin (below) yields zero findings

**Unused code, two ways, never conflated** — pass only if:

- ✓ every unconsumed exported/defined symbol (or unreferenced prose block) is classified exactly one way: written as part of a delivered feature that **no functionality invokes** → **bug finding** (the feature was not implemented completely — the unit shipped half of what was asked); orphaned because a requested change **replaced or removed** that feature or part → **deletion candidate** (`fix-now (delete)`, not a bug)
- ✓ the classification cites what requested the original feature and what replaced it — classifier evidence, never the auditor's impression
- ✓ after any proposed deletion, **features-preserved-without-it** is verified: every requested feature still works without the removed code or prose — a deletion that breaks a requested feature is a finding, not a cleanup
- ✓ a **prose citation** (`AGENTS.md`, a skill file, a comment, a docs page) is not evidence of a consumer: the consumer test is executable or explicitly declared, and the citation is itself part of what the deletion removes — a surface the project's declared compatibility policy does not require keeping is `fix-now (delete)`, never "documented, therefore alive"

**Obsolete & missing documentation** — pass only if:

- ✓ every doc describing a surface that no longer exists is a finding (obsolete), citing the live-tree search that proves the surface gone
- ✓ every live **consumer-facing** surface with no consumer-facing doc is a finding (missing — the document-or-don't-coin residue); internal-only helpers are not findings
- ✓ `audit-docs`' own axes were run or their result cited — this sweep adds the residue cases, never restates the coherence checks

The seeded fixture (`scripts/product-audit-residue-fixture.mjs <dir>`, written
on demand outside the repository) carries one seed per residue class — a
duplicated grammar copy, an exported-but-unconsumed function, a doc naming a
removed surface, a live surface with no doc — plus a clean twin: the sweeps
must yield exactly one finding per seed on `seeded/` and zero on `clean/`.

## Coverage-gap sweep (pass-only-if)

The forward-looking half the findings corpus does not cover: #437 attributes what
already went wrong, this join asks what the project declared against what could
catch it. It consumes ONE deterministic receipt — `bun scripts/coverage-gap.mjs
<repo>` — quoted like every other producer and never re-derived by inspection.
The receipt crosses three committed carriers: the project's verification-criteria
catalogue (`docs/workflow/VERIFICATION_CRITERIA.md`; its shape and closed
provenance set are owned by `template/docs/workflow/VERIFICATION_CRITERIA.md` and
`audit-docs` check 16), the installed detectors (`docs/workflow/GATE_INVENTORY.md`
through its one reader, plus the review surfaces the guide's
`ceremony-profile@1` leaves paid — #436's consumption-side rule), and the corpus
(`scripts/findings-corpus.mjs`'s own `buildCorpus`, never a second parser). A
carrier the project does not carry is named in the receipt and its edge reads
`n/a` — never guessed.

### The receipt grammar (`coverage-gap@1`)

```text
coverage-gap@1
kind | shape | what it orders
receipt | coverage-gap@1 … | one fixed block: the three input lines, one line per edge, one line per gap, the verdict
input | catalogue · detectors · corpus | each line says present or absent: a file-backed carrier (catalogue, detectors) carries its path either way, the corpus carries what it read or why it read nothing — an absent carrier is named, never guessed
edge | criterion→detector | a criterion is covered when a backticked token in its `Source / authority` or `Notes` cell resolves to a gate id, a review pass, an existing path or a declared command
gap | criterion-uncovered | a criterion whose declared check resolves to nothing, or whose provenance sits outside the catalogue's closed set
gap | class-uncovered | an admitted recurring corpus class whose axis no detector names
gap | detector-idle | a declared gate-inventory row no criterion names (the reverse edge; the shipped review pack is the baseline and is never reported idle)
```

The script decides no severity and no route — it emits the gap, this dimension
judges it.

**Pass only if:**

- ✓ every `gap — <kind>` line the receipt carries became exactly one finding, and
  every finding cites that receipt line as its evidence
- ✓ a gap is a finding only when its surface is evidenced — a declared criterion or
  an admitted corpus class; a speculative "this might be uncovered" is not a
  finding and never enters the report
- ✓ the run over the seeded fixture (`bun scripts/product-audit-gap-fixture.mjs
  <dir>`) yields exactly one gap per class on `seeded/` and zero on its `clean/`
  twin
- ✓ the dimension is reported `n/a — no catalogue and no corpus` when the project
  carries neither, instead of a clean sweep of nothing

**Routes** — every gap finding's `route:` cell is the `finding-route@1` hand-off owned
by `SKILL.md` (`<verb> — <target>`, never a command invocation); the three
destinations below are what each gap class resolves to, and no bespoke route is
introduced here:

- a recommended external skill covers the gap → `agentic-workflow skills discover`
  (#591's route: trusted registries → the seven `skill-lint` checks → per-candidate
  owner consent), with the install and its registration as separate decisions
- an own skill or gate is warranted → a proposal: `/unit-lane` builds it under its
  gates, never this audit
- the criterion is obsolete or unverifiable → the init-workspace upgrade route
  (`references/UPGRADE.md`) re-triages the catalogue

### Evolution regression (anti-erosion)

A unit that adds or changes a review dimension, a review skill or an audit producer
re-verifies that the previously present dimensions still pass — the workflow-side
analogue of the residue sweeps' features-preserved-without-it check. The gate is
`scripts/dimension-regression.mjs`: over a push range it refuses a dropped
dimension with no recorded owner decision (`dimension-dropped`) and a review-surface
change with no recorded run (`missing-reverification-evidence`), and its sibling
suite re-asserts the frozen dimension set on every push. Unconstrained
self-evolution degrades previously acquired capabilities (arXiv 2605.09315), so a
dimension change is gated, never proposed.

### Emission-only

The sweep emits evidence; it never repairs what it finds. Improvement lands through
the owner's decision and `/unit-lane` with its gates, and an agent never self-edits
this reference or any workflow prose in response to its own findings (arXiv
2310.01798; 2605.09315).

## Journal-signal sweep (pass-only-if)

The retrospective corpus reads the findings ledgers and the coverage join reads the declared criteria; neither reads the **session journal** — `docs/LOGS.md` plus the pending `.agentic-workflow/journal/` fragments — which records the corrections a session had to make, the sessions a unit consumed and the findings its own reviewers refuted. Issue #616 is this sweep's source, and its research bounds it: whole-trace judging is neither affordable nor accurate enough (TRAIL, Who&When, When Agents go Astray), so the receipt carries **derived aggregates** and the model judges only the remainder — *why* a unit needed that many sessions, and which named agent-error class the evidence describes (a stale verdict, a sensor false positive, a premature phase tick, receipt-binding paralysis). The source ids above are the issue's, cited by reference; no measurement of theirs is restated here.

### The receipt grammar (`journal-corpus@1`)

```text
journal-corpus@1
kind | shape | what it orders
receipt | journal-corpus@1 … verdict | one fixed block: the two carrier lines, the totals, one line per signal, one line per attributed class, the join cardinality, the verdict
carrier | log <path> · entries <n> | absent · <path>, fragments <dir> · files <n> | absent · <dir> | each carrier says what it read or that it is absent; neither present is `insufficient-input`, never a clean sweep of nothing
row | correction | refuted | the two evidence kinds; every row carries its `file:line` and a 12-hex digest of its own bytes
correction | - **Correction…** | a correcting line, the journal's own append-only shape
refuted | <false positive, self-refuted, refuted, discarded> + F<n> | a line admitting a finding wrong that names a finding id
class | <axis>×<klass> | unjoined · reason <why> | a correction's class is the corpus row its own bytes resolve — a class is a join, never a lexical guess — and a correction that resolves to nothing is `unjoined`, counted and listed with its reason
dedup | one corpus row, N journal rows → one finding | a journal row that resolves onto a corpus row clusters with it into one finding citing both carriers — the audit's existing dedup rule, never a second row for the same defect
join | rows <n> · corpus-rows <j> · clusters <c> · unjoined <u> | the join cardinality the dedup rule below rests on
signal | corrections · class <class> · n <k> [· reason <why>] | the corrections count per class
signal | sessions · unit <u> · sessions <n> | entries recorded against one unit; two or more is rework by definition and the thrashing threshold is this dimension's call, never the parser's
signal | false-positive · <unit> <F<n>> · joined <provenance> | unjoined — <why> | one line per admitted false positive, cross-joined to its corpus row
attribute | <axis> × <klass> · n <k> · phase <p> · propose <destination> | a recurring joined class through the corpus's own `axis → phase` map; an axis the map does not know reads `phase unmapped · propose none`
verdict | clean | signals <n> | the receipt's own verdict: no row at all is clean
```

**Pass only if:**

- ✓ every `signal —` line became exactly one finding, citing that receipt line as its evidence — and a `sessions` cluster is one finding per unit, never one per session
- ✓ a journal row that resolves onto a corpus row is **one** finding citing both
  carriers (the corpus `provenance` and the journal `file:line`): the receipt's
  `join` line is the cardinality that clustering rests on, and a journal finding
  never duplicates a corpus finding as a second row
- ✓ an `unjoined` class or row is reported with the reason the receipt gives, and
  never folded into a named class the journal did not declare
- ✓ the model's remainder is exactly the non-mechanizable part: the named
  agent-error class and the `why` behind a rework cluster. The counts, the join
  and the phase are the receipt's, never re-derived by inspection
- ✓ the run over the seeded fixture (`bun scripts/product-audit-journal-fixture.mjs
  <dir>`) yields exactly one signal per class on `seeded/` and zero on its
  `clean/` twin
- ✓ the dimension is reported `n/a — no journal carrier` when the project carries
  neither `docs/LOGS.md` nor the fragment directory, instead of a clean sweep of
  nothing

**Routes** — every journal finding's `route:` cell is the `finding-route@1` hand-off owned by `SKILL.md`, and the destination is one of three: a recurring class with a named preventive gate routes to that gate's repair (`fix — <unit>`), a rework cluster with no cause named routes to the unit's own review (`review — <unit>`), and a class the journal records with no possible detector routes to a proposal (`audit — <audit id>`) — never a bespoke route, never an automatic fix. Journal signals are **emission only**: this audit proposes, and the owner decides.

## Test-surplus sweep (pass-only-if)

The Tests dimension asked one direction only — which tests are missing — so an
audit could complete without ever asking the other one: **which tests should not
exist**. A suite grows by accretion and nothing in the workflow asked for a test's
justification. The measured reason is not cosmetic: line coverage stops tracking
effectiveness once suite size is controlled (Inozemtseva & Holmes, ICSE 2014), a
test's value unit is the obligation it asserts rather than the lines it touches
(Zhang & Mesbah, ESEC/FSE 2015), and coverage-safe minimization still severely
compromises fault detection (Rothermel et al., 1998/2004). "It passes" and "it
covers lines" both fail to justify a test's existence. The citations are issue
#595's own; this reference restates none of their measurements.

A check with no evidence is not a finding. Three checks, three evidence standards:

```text
test-surplus@1
kind | shape | what it orders
check | dead-surface | a test (or suite) whose tagged or claimed protecting surface no longer exists: the evidence is the live-tree search that proves the surface gone, and the rule that decides a claimed consumer is the dead-code rule owned by § Residue sweeps — a prose citation is not evidence of a consumer — composed here by reference, never restated. The suite's own declaration of the surface it protects is its `test-obligation-tag@1` tag (owner: `skills/unit-lane/references/TESTS.md`), which the obligation-tag gate refuses when stale, so this check reads the declarations instead of re-deriving them
check | obligation-duplicate | two or more tests asserting the same behavioural obligation on the same surface: the evidence is the asserted behaviour read from the tests, never line coverage, because identical lines can carry different obligations and different lines can carry the same one
check | cost-over-value | a test whose execution and maintenance cost exceeds the behavioural risk it covers: the evidence is the risk the test covers plus the cost measured (wall-clock, fixture weight, maintenance churn), so intensity follows complexity and risk, never surface visibility
receipt | verified: no surplus tests | the Tests health line's content when the sweep found nothing; a sweep that found something carries its findings instead, so the row is a verification and never a reward for deletion
class | fix-now (delete) | the only class a surplus finding takes, and only with its check's evidence standard — the residue sweep's notation, not a second class vocabulary
route | finding-route@1 | the audit's published hand-off grammar; the executor is /fold-findings, the audit never deletes and never edits code
boundary | delete is not weaken | deleting a test with the evidence above is legal and is a separate, evidence-gated action; weakening a test so it passes never enters this sweep (owner: AGENTS.md § Working rules)
```

**Selective mutation kill-rate is a confirmation, never a sweep.** When an
obligation-level duplicate cluster is contested, a kill-rate measurement over that
cluster decides it. An exhaustive mutation sweep is never run for this check — its
cost is measured elsewhere and the receipt it produces is not this dimension's
authority.

**Pass only if:**

- ✓ every surplus finding cites its check and that check's evidence — a dead
  surface proven gone, an obligation shown to repeat, or a cost and a risk stated
- ✓ an obligation-level duplicate is decided on asserted behaviour alone; line
  coverage is never the argument, in either direction
- ✓ a `fix-now (delete)` row exists only where the evidence standard was met, and
  its executor is named, so the audit's own emission boundary holds
- ✓ the Tests health line carries its receipt — `verified: no surplus tests` on a
  clean sweep, the finding ids otherwise — because an audit that skipped the sweep
  cannot write the row
- ✓ the boundary is stated where the check is defined, so a deletion is never read
  as an exception to the red-first rule; a weakening proposal is not a finding of
  this sweep at all

This sweep changes a dimension, so the evolution-regression rule governs it:
`bun scripts/dimension-regression.mjs` re-verifies that the dimensions already
present still pass (see § Evolution regression (anti-erosion)).
