# 20 — runtime-guardrails-progressive-skills

## Goal

Add deterministic runtime tripwires for secret disclosure and merges, make
`ship-roadmap --fullauto` the only automated merge authority, and reduce the
activation cost of the largest skills without weakening their small-model
contracts.

## Branch

`feat/20-runtime-guardrails-progressive-skills`

## Size

`L` — template adapters, workflow policy, distribution metadata, context
tooling, and progressive skill resources change together.

## Dependencies

None. The feature consumes the existing `ship-roadmap`, `audit-pr`,
`init-workspace`, and skill-distribution contracts.

## Product half

### Context

Prompt-only prohibitions are advisory: small models can still disclose an
environment or invoke a merge command. The existing OpenCode configuration is
also external to a repository and its permission choices may outlive the
workflow invocation that needed them. Separately, several common skills cost
5–13k tokens immediately after activation, before repository context is read.

### Business goals

Make dangerous actions fail deterministically at the agent boundary, keep
fullauto authorization invocation-scoped and auditable, and preserve the
workflow's behavior on small models with materially less mandatory context.

### Scope

#### In scope

- A portable, opt-in guard pack for Claude Code, Cursor, Copilot, and OpenCode.
- Blocking obvious environment dumps, direct `.env` reads, and direct merge
  commands with one canonical policy and thin platform adapters.
- A fullauto merge wrapper used only by `ship-roadmap --fullauto`, with
  fail-closed checks, transient state cleanup, and an idempotent PR audit comment.
- An `init-workspace` interview and upgrade path for installing detected hooks.
- Progressive supporting resources for oversized skills, starting with
  `execute-phase` and every currently over-budget workflow skill.
- A machine-checkable context budget, `skills.sh.json` groups, and Claude
  marketplace metadata.
- Conservative manual/model invocation metadata where it cannot break composed
  workflow calls.

#### Out of scope / non-goals

- Treating local hooks as a security sandbox or replacement for forge rulesets.
- Editing a user's VPS OpenCode configuration or installing hooks without consent.
- Encrypting secrets, replacing a secret manager, or blocking legitimate
  `export NAME=value` assignments.
- Adding more user-facing skills or relying on prompt-cache billing to recover
  context already loaded.

### Capability closure

#### Capability: project guard installation

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | `init-workspace` interview | copy detected adapter + canonical policy | hook fixture installs into a scratch tree |
| Read/list | in-scope | report installed/residual adapters | detect existing platform files | adapter inventory test |
| Update | in-scope | upgrade proposal | additive merge, never clobber | existing-file fixture |
| Delete | n/a: uninstall is an explicit project-maintainer action | n/a | n/a | n/a |
| State transitions | offered → installed or skipped | interview result | filesystem evidence | report assertion |

Role matrix:

| Role | Permission |
|---|---|
| Project maintainer | allowed: accepts and configures hook installation |
| Agent runtime | denied: cannot silently install or disable the guard |

#### Capability: guarded command execution

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | n/a: commands are intercepted, not stored | n/a | hook input | n/a |
| Read/list | in-scope | stable denial reason | normalized command/path input | allow/block matrix |
| Update | n/a: no persistent command state | n/a | n/a | n/a |
| Delete | n/a: no persistent command state | n/a | n/a | n/a |
| State transitions | proposed → allowed or blocked | hook result | exit/permission result | adapter contract tests |

Role matrix:

| Role | Permission |
|---|---|
| Project maintainer | allowed: can change the committed policy explicitly |
| Agent runtime | denied: cannot directly dump secrets or merge |

#### Capability: fullauto merge

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | `ship-roadmap --fullauto` decision | transient attempt marker | marker exists only inside wrapper fixture |
| Read/list | in-scope | PR comment + iteration log | `gh pr view` / comment marker | idempotency fixture |
| Update | n/a: each merge attempt is immutable and SHA-bound | n/a | n/a | n/a |
| Delete | in-scope | no user action | `trap` removes transient marker | success/failure cleanup fixtures |
| State transitions | audited → merging → merged/commented or failed/cleaned | iteration report | wrapper exit states | fake-`gh` integration test |

Role matrix:

| Role | Permission |
|---|---|
| Project maintainer | allowed: chooses `merge: fullauto` and invokes the flag |
| Agent runtime | denied: standalone/manual `audit-pr` never merges |

#### Capability: progressive skill loading

| Operation | Resolution | UI | Command/API | Test |
|---|---|---|---|---|
| Create | in-scope | skill activation | conditional resource reads | resource-link lint |
| Read/list | in-scope | route table in main skill | one-level references | context budget report |
| Update | in-scope | version/changelog contract | `bump-skill` bookkeeping | parity checks |
| Delete | n/a: contracts are relocated, not removed | n/a | n/a | content-preservation review |
| State transitions | inactive → core loaded → route resource loaded | skill instructions | agent file reads | golden fixture |

Role matrix:

| Role | Permission |
|---|---|
| Project maintainer | allowed: authors and budgets skill resources |
| Agent runtime | allowed: loads only the resource required by the active route |

### Integration closure

Derived inventory because this repository has no root `docs/CAPABILITIES.md`.

| Subsystem | Resolution | Acceptance |
|---|---|---|
| Skills | in-scope: policies and progressive resources | AC 5–7 |
| Template/scaffold | in-scope: portable hook pack and init integration | AC 1–4 |
| Distribution manifests | in-scope: skills.sh and Claude marketplace | AC 8 |
| Documentation/changelogs | in-scope: bilingual user guidance and version history | AC 9 |
| Schema package | n/a: orchestration envelope shape is unchanged | n/a |
| CI/verification | in-scope: hook, context, discovery, and golden checks | AC 10 |

### Expectation sweep

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Direct `gh pr merge` is blocked | in-scope | AC 1 |
| 2 | Legitimate exports still work | in-scope | AC 2 |
| 3 | Obvious env dumps and `.env` reads are blocked | in-scope | AC 2 |
| 4 | Hook installation is opt-in and platform-aware | in-scope | AC 3 |
| 5 | Fullauto permission cannot leak to a manual run | in-scope | AC 4 |
| 6 | Auto-merged PRs have durable evidence | in-scope | AC 4 |
| 7 | `execute-phase` is no longer the most expensive mandatory body | in-scope | AC 5 |
| 8 | Oversized skills load route-specific detail on demand | in-scope | AC 6 |
| 9 | Context budgets regress mechanically | in-scope | AC 7 |
| 10 | Distribution surfaces advertise useful groups | in-scope | AC 8 |
| 11 | Small models preserve fixed contracts | in-scope | AC 10 |
| 12 | Hooks are documented as defense-in-depth | in-scope | AC 9 |

### Acceptance criteria

1. `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` exits 0 and includes direct merge denials.
2. `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` exits 0 and includes env-dump, `.env`, and safe-assignment cases.
3. `grep -q "Agent safety hooks" skills/init-workspace/SKILL.md` exits 0.
4. `bash template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh` exits 0 and proves marker cleanup plus a single idempotent PR comment.
5. `node scripts/check-skill-context.mjs --skill execute-phase` exits 0 with the main `SKILL.md` below its hard budget.
6. `node scripts/check-skill-context.mjs` exits 0 for every budgeted skill and every reference is reachable in one hop.
7. `grep -q "Context budget" docs/workflow/SKILLS.md` exits 0.
8. `node -e "JSON.parse(require('fs').readFileSync('skills.sh.json')); JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json'))"` exits 0.
9. `grep -q "defense-in-depth" README.md && grep -q "defensa en profundidad" README.es.md` exits 0.
10. `npx skills add . --list` exits 0 and the executor-path golden fixture is recorded for the changed contracts.

### Tooling

`bump-skill`, shell fixtures with fake platform payloads and fake `gh`, the
context-budget checker, `npx skills add . --list`, and the weakest available
tool-capable model for the golden fixture.

### Product decisions

- D1: deliver the complete change as one feature/PR, per the user's explicit request.
- D2: direct merge commands stay blocked; fullauto uses a dedicated wrapper rather than a persistent allow marker.
- D3: `audit-pr` is a verdict/comment gate and never owns merge authorization; only the active `ship-roadmap --fullauto` stage may call the wrapper.
- D4: hooks are defense-in-depth. GitHub rulesets/branch protection remain the security boundary.
- D5: progressive files are one hop from `SKILL.md`; universal guardrails stay in the main file, route detail moves behind explicit conditional reads.
- D6: prompt caching is not a context-reduction mechanism because cached input still occupies the context window.

### Deferred decisions

none

### Spec-lint (mechanical — presence checks only)

PASS: no placeholders; non-goals, capability/integration closure, role matrices,
twelve resolved expectations, runnable acceptance criteria, failure scenarios,
and five phase-linted phases are present.

## Design status

designed

## Engineering half

### Technical goals

Provide a canonical command/path policy with thin adapters; isolate merge
execution behind one fail-closed wrapper; expose distribution metadata; and
make skill context size enforceable while retaining fixed weak-model contracts.

### Architecture impact

This repository declares no root architecture or invariant documents. Record:
`n/a: no project architecture map` and `n/a: no project invariants declared`.
The deep module boundary is `.agentic-workflow/hooks/`: adapters normalize
platform payloads, while policy and fullauto execution remain platform-neutral.

### Design

The command guard accepts a normalized command and optional file path, returning
a stable allow/block result. Platform adapters only extract fields and translate
the result into their hook protocol. Direct merge commands never gain an allow
exception. The fullauto wrapper validates an active call, PR/head/default-base,
creates a namespaced marker under the git common directory, installs cleanup
before invoking `gh`, merges once, posts an idempotent SHA-bound comment, and
removes the marker on every exit.

Skills use a compact routing core plus `references/*.md` resources. The main file
names exactly when each resource must be read, and references do not reference
other references. A Node checker uses deterministic token/line proxies and link
validation; it fails new oversized main files.

### Decisions to confirm

none

### Testing requirements

Use fake commands and temporary git repositories for policy/wrapper integration;
JSON-parse all manifests; validate reference reachability and budgets; run skill
discovery; then run the executor-path golden fixture with the weakest available
tool-capable model.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| direct merge | small model invokes `gh pr merge` | deterministic hook denial |
| export assignment | build needs `export NODE_ENV=test` | allowed non-disclosing assignment |
| environment dump | agent invokes `export`, `env`, or `printenv` | disclosure denial |
| manual run after fullauto | later standalone `audit-pr` is invoked | no merge path exists |
| wrapper crash | `gh pr merge` fails | trap removes transient marker |
| repeated comment | retry after successful merge | marker makes comment idempotent |
| small-model execute | feature phase activation | core plus only route-specific resources |
| invalid resource | reference renamed or nested | context checker fails closed |

### Phases

- P1 — Command guard
  Layer: config/infra. Done-when: `bash template/.agentic-workflow/hooks/tests/test-command-guard.sh` → exit 0.
- P2 — Fullauto policy
  Layer: docs. Done-when: `grep -q "sole automated merge authority" skills/ship-roadmap/SKILL.md` → exit 0.
- P3 — Context distribution
  Layer: config/infra. Done-when: `node scripts/check-skill-context.mjs --manifest-only` → exit 0.
- P4 — Progressive loading
  Layer: docs. Done-when: `node scripts/check-skill-context.mjs` → exit 0.
- P5 — Hardening & PR
  Layer: hardening. Done-when: `npx skills add . --list` → exit 0.

### Deploy & rollback

No runtime deployment. Revert the PR. Hook installation remains opt-in, so
existing repositories are unchanged until they accept the upgrade proposal.

### Open questions / risks

Hook payloads vary by agent version; adapters therefore have fixtures and fail
closed only for commands they can normalize. Shell hooks cannot be a hostile-code
sandbox, so forge-side branch protection remains required.

### Deliverables

Portable hook pack, fullauto wrapper/comment protocol, init/audit/ship policy,
progressive resources, context checker, distribution manifests, bilingual docs,
version history, tests, and golden evidence.

### Post-merge next feature

none
