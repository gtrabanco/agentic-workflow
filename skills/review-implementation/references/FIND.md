## Axis ownership — one concern, one pass

The internal review pack assigns **every review concern to exactly one owning
pass**. No pass rescans another's surface; the per-axis passes find, and
`review-implementation` (the scope/classification engine) verifies coverage and
classifies the synthesized table.

| Concern | Owning pass | Looks for |
|---|---|---|
| Bug / correctness | `review-code` | Logic errors, wrong edge-case handling, races, unhandled rejections, imprecise numeric handling |
| Simplification / dead code / duplication | `review-code` | Unused exports, unreachable branches, commented-out blocks, obsolete files, duplicate logic — **see exception below** |
| Overengineering | `review-code` | Unnecessary abstractions, single-caller indirection, speculative generality, micro-opt without a measured bottleneck |
| Architecture / runtime compatibility | `review-code` | Broken dependency direction, business logic in the wrong layer, abstraction bypass, cross-layer shortcut, runtime-incompatible deps, blocking calls in the request path |
| Project-rule violations | `review-code` | Whatever the project's docs mandate (e.g. domain value-object rules, no hardcoded UI strings, don't hide user-facing limitations, naming conventions) |
| Security / cybersecurity | `review-security` | Secrets in code, injection, missing authz, unsafe deserialization, PII exposure, weak crypto, SSRF, over-broad CORS, leaking errors, dependency security |
| Tests — failing/weak & missing | `review-verify` | Flaky/over-mocked/snapshot-heavy tests, uncovered branches, new use-cases/adapters without tests, SPEC dev-scenario failure modes not exercised |
| Performance / bundle-size | `review-perf` | Algorithmic/resource/performance evidence, heavy/duplicate deps, accidental large imports, non-tree-shakeable patterns |
| Design / a11y / brand / SEO | `review-design` / `review-a11y` / `review-brand` / `review-seo` | Only their named surfaces |
| Tech-debt triggers | `review-debt` | Transform of the synthesized table — every debt-character finding gains an explicit TRIGGER (a debt item without a trigger is itself a finding) |

### Dead-code exception (important)

Do **not** flag code as removable if it is **intentionally staged for an
in-progress or planned feature**. Before reporting the dead-code concern
(`review-code`), cross-check the roadmap, feature SPECs/`TASKS.md`, and
`known-issues.md`: if the code is wired into a planned phase or another
feature, classify it *intentional / in-progress*, not dead. When unsure, mark
it **verify** and ask — never assert "dead" on a guess.

### Coverage contract (consumed by `review-implementation`)

The classification engine verifies that every applicable axis for the declared
scope is represented in the synthesized findings table: an axis the change
touches with no table row is a **missing-axis finding** (axis `coverage`),
not a silent pass.
