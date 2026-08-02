## Phase 1 — Find (no refactor)

**Assume the diff is WRONG — your job is to prove it does not work.** Scan the
scope adversarially and record every finding across these axes. Fix nothing; the
classification in Phase 2 decides what matters.

| # | Axis | Looks for |
|---|---|---|
| 1 | **Bug / correctness** | Logic errors, wrong edge-case handling, races, unhandled rejections, imprecise numeric handling |
| 2 | **Architecture violation** | Broken dependency direction, business logic in the wrong layer, abstraction bypass, cross-layer shortcut (per the architecture doc) |
| 3 | **Overengineering / premature optimization** | Unnecessary abstractions, single-caller indirection, speculative generality, micro-opt without a measured bottleneck |
| 4 | **Removable / dead code** | Unused exports, unreachable branches, commented-out blocks, obsolete files — **see exception below** |
| 5 | **Security / cybersecurity** | Secrets in code, injection, missing authz, unsafe deserialization, PII exposure, weak crypto, SSRF, over-broad CORS, leaking errors |
| 6 | **Platform / runtime incompatibility** | APIs unavailable on the target runtime, unsupported in-memory state assumptions, runtime-incompatible deps, blocking external calls in the request path |
| 7 | **Bundle-size risk** | Heavy/duplicate deps, accidental large imports, non-tree-shakeable patterns |
| 8 | **Tests — failing/weak** | Flaky/over-mocked/snapshot-heavy tests, tests asserting nothing meaningful |
| 9 | **Tests — missing** | Uncovered branches, new use-cases/adapters without tests, SPEC dev-scenario failure modes not exercised |
| 10 | **Project-rule violations** | Whatever the project's docs mandate (e.g. domain value-object rules, no hardcoded UI strings, don't hide user-facing limitations, naming conventions) |

### Dead-code exception (important)

Do **not** flag code as removable if it is **intentionally staged for an
in-progress or planned feature**. Before reporting axis 4, cross-check the
roadmap, feature SPECs/`TASKS.md`, and `known-issues.md`: if the code is wired
into a planned phase or another feature, classify it *intentional / in-progress*,
not dead. When unsure, mark it **verify** and ask — never assert "dead" on a
guess.

### Finding format

Each finding: a stable id (`F-1`, `F-2`, …), `file:line`, axis, a one-line
description, and the **evidence** (the code/why it qualifies). No remedy code yet.
