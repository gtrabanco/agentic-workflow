## Audit dimensions (platform-adaptive — run only what applies)

| Dimension | What it sweeps product-wide | Applies to |
|---|---|---|
| **Correctness & architecture** | Bugs, layer/boundary violations, dead code, overengineering, drift from the architecture doc | all |
| **Security & cybersecurity** | Secrets in repo, authz gaps, input validation, dependency / supply-chain risk | all |
| **Performance** | Hotspots, complexity, N+1s, bundle/asset weight (web), resource leaks | all |
| **Tests** | Coverage of critical paths, missing/!flaky tests, untested failure modes | all |
| **UX / UI** | Design-system adherence, broken states, inconsistency | web / mobile / TUI |
| **Accessibility** | a11y conformance for user-facing surfaces | web / mobile |
| **SEO** | Indexability, metadata, structured data | web |
| **Brand / voice** | User-facing copy vs. the brand guide | surfaces with copy |
| **Tech debt** | Accumulated shortcuts, TODO/FIXME, stale abstractions | all |
| **Process & docs** | Incomplete phases, aging open issues, **solvable known-issues**, doc completeness, missing/optimizable workflow docs, capability-inventory freshness (`docs/CAPABILITIES.md` ↔ code drift) | all |
| **Workflow discipline** | The workflow's own rules held: branch/PR discipline, `done · #<pr>` links, phase naming (`P1…`), per-phase docs, commit format, dependency closures, artifact language — **run `audit-docs` checks 1–13 mechanically** (compose it); never assume a rule held because it "should". **Scope-export recurrence:** across the most recent units (merged or in-flight), each with a non-empty `## Amendments` descope log or a descope-classified born issue (`audit-pr`'s scope-bleed gate) counts as one scope-exporting unit — **≥ 2 consecutive** such units is a planning-quality finding ("features cut too big for real capacity"), routed to the atomicity/split rules (**#64**), not re-litigated as a per-unit defect | all |
| **Roadmap coherence** | Stale/obsolete/superseded features, missing dependencies, gaps & opportunities | all |
| **Installed tooling** | Installed skills + connected MCP servers vs. the project's applicable axes and roadmap features — unregistered-but-useful items, and tooling that would change a feature's scope | all |

Skip inapplicable axes (no a11y/SEO/brand for a CLI/library/infra product) and
**say which you skipped and why**. Every axis is covered by the workflow's own
internal review pack (`review-code`, `review-security`, `review-verify`,
`review-debt`, `review-design`, `review-a11y`, `review-brand`, `review-perf`,
`review-seo`) — installed with the workflow, so an applicable axis can never be
"missing". Platform skills the project installed run as optional extras on top.
