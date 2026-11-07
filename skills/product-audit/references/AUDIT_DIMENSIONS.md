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

When the project declares a **ceremony profile**, a dimension (or a
profile-declared producer, such as the per-language dead-code linters) the
profile does not declare is recorded `n/a — not declared by the project's
ceremony profile` instead of swept — one-shot/organic repos do not pay
full-audit ceremony. No profile is declared → every applicable dimension runs.
The profile grammar itself is #436's; this skill only consumes it and never
invents profile slots or waives a verification contract.

| Dimension | What it sweeps product-wide | Producer (pre-pass) | Applies to |
|---|---|---|---|
| **Correctness & architecture** | Bugs, layer/boundary violations, dead code, overengineering, drift from the architecture doc | none — the repo-wide bug hunt is this skill's exclusive model surface | all |
| **Security & cybersecurity** | Secrets in repo, authz gaps, input validation, dependency / supply-chain risk | `dependency-advisories` (already a local-gate step) receipt-quoted; pin/posture checks when the profile declares them (#436 scorecard-family slot) — the rest (repo-wide security research) is model | all |
| **Performance** | Hotspots, complexity, N+1s, bundle/asset weight (web), resource leaks | a profiler only when the project's profile declares one (#436) — receipt-quoted; otherwise none | all |
| **Tests** | Coverage of critical paths, missing/!flaky tests, untested failure modes | the project's declared test/coverage gate receipt when one exists; otherwise none | all |
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
| **Installed tooling** | Installed skills + connected MCP servers vs. the project's applicable axes and roadmap features — unregistered-but-useful items, and tooling that would change a feature's scope | none — the agent's own inventory (stated plainly when it cannot be enumerated) | all |

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
