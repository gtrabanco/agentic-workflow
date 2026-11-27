---
type: fix
scope: small
roadmap_summary: Issue [#722](https://github.com/gtrabanco/agentic-workflow/issues/722) (S): the lane's Relay seam stops being an undefined state — with pi-web present and the packet unapproved, the conductor asks the owner (relay or inline) and stops, the degradation keeps its `relay: unavailable`-only meaning, and `relay.seam` (absent = `ask`) records the owner's preselected answer with the router as its runtime consumer.
ac-hash: 5d3e38afbb1c52016556dbb54cef70b1a75ed97b206c473646ff7b40178186f0
---

# fix/722-relay-seam-inline

> One-line: the "pi-web present, packet not yet approved" state gets one bound
> behavior — ask the owner (relay legs or inline) and stop for the answer — with
> the contract, the router's own addendum and a recorded owner default all
> saying the same thing, so the same release cannot deliver two different
> hand-offs depending on the model's judgment.

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
TASKS.md | trimmable · legacy carrier
PLAN.md | trimmable
progress.md | trimmable · legacy carrier
ACCEPTANCE.md | trimmable · legacy carrier
testing.md | trimmable
CHECKLIST.md | trimmable
BRIEF.md | trimmable
pr-body.md | trimmable
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
architecture-notes.md | kept
sources.md | kept
research.md | kept
```

## Issue

`#722` — tracked issue in the project's forge. The PR closes it via
`Closes #722`. Applied through the owner's local inline workflow: the §5 planning
ledgers are frozen in this document at cut, no `review-change`/`audit-pr`/fold
cycle runs on this change, and the only machinery this unit runs is the
repository's deterministic gate (owner instruction, `## Log` L2).

## Specs

The four acceptance criteria of issue #722, verbatim, in the order the issue
states them. The issue's "What's broken", "Expected behaviour" and "Root cause"
paragraphs are evidence for these asks, not additional requirements.

**S1 — Ask the owner and stop at the unapproved seam.**
> 1. When pi-web is present and the packet state is `bootstrap-needed` or `draft`, the lane conductor asks the owner and stops — it never degrades to the inline `/execute-phase` hand-off silently. (Red-first test can pin the skill/contract wording; behavior itself stays soft-by-design.)

**S2 — Degradation keeps its `unavailable`-only meaning.**
> 2. §Degradation keeps its current meaning: inline hand-off only where pi-web is absent (`relay: unavailable`).

**S3 — The owner's default is recorded in config, absent = `ask`.**
> 3. An optional config key records the owner's default at the seam (at minimum `ask` vs `inline`); absent key = `ask`. Note: an `auto` value cannot bypass pi-web's own `dispatch_relay` human-consent gate — do not promise it. (Owner stance recorded for #705/#669: rejected for the general case, accepted implicit consent for `/flow`.)

**S4 — Both sessions' outcomes are indistinguishable under the contract.**
> 4. Both sessions' outcomes become indistinguishable under the contract: the 719-class path is no longer reachable.

## Acceptance criteria

Frozen at the cut; the `ac-hash:` frontmatter line is this section's SHA-256.
One criterion per requirement, each naming the check that proves it.

1. **S1 — the mandated ask-and-stop at the seam.** `bun test scripts/relay-route.test.mjs` exits 0 with the `bootstrap-needed` and `draft` cases asserting the router's addendum carries the ask and the stop before any dispatch, and with the contract case asserting `RELAY.md` §Bootstrap and `SKILL.md` step 4 state the same mandate.
2. **S2 — degradation stays `relay: unavailable` only.** The same suite exits 0 with the case asserting an unavailable relay prints the per-phase fallback and no `relay-seam` line, and with the case asserting `RELAY.md` §Degradation says the pi-web-present/unapproved state is not a degradation.
3. **S3 — the config key, with the router as its runtime consumer.** `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 with the `relay` section (closed values `ask`/`inline`, shipped default `ask`, an unknown key and an unknown value refused), and `bun test scripts/relay-route.test.mjs` exits 0 with the case where a project's `relay.seam: inline` changes the printed default and still prints the ask and the stop.
4. **S4 — the 719-class path is unreachable.** The suite exits 0 with the case asserting no surface the conductor reads permits an inline hand-off while pi-web is present and the packet is unapproved, and `rg -n 'The lane runs inline|conductor route' skills/unit-lane/` matches 0.

## Impact

The fix touches the seam's three readers and one state surface; the design sweep
below is the whole blast radius, not a guess:

| Surface | Why it moves | What must stay true |
|---|---|---|
| `skills/unit-lane/references/RELAY.md` | the contract owner: §Bootstrap step 3 becomes a mandated ask-and-stop, §Degradation is scoped to `relay: unavailable`, and a new §The seam's default documents `relay.seam` | it remains the only owner of the ask wording; every other surface cites it (`IR11`) |
| `skills/unit-lane/SKILL.md` | step 4's hand-off paragraph is the conductor's other reading of the seam | it cites RELAY.md's §Bootstrap instead of restating the state table |
| `packages/agentic-workflow/src/runner/unit-route.mjs` | the addendum is what the 719-class session actually read: its `relay-next:` said `then dispatch_relay(...)` with no ask, and it becomes the runtime consumer of `relay.seam` (S3's "a key no runtime reads is not shipped") | the route, `next:`, rows, read-set and fingerprint stay byte-identical; the seam is an addendum line only, printed only when the question is live |
| `packages/agentic-workflow-schema/src/config.ts` | the config home: one `relay` section with `seam: ask | inline`, shipped default `ask`, plus the published vocabulary and its normalizer | no second copy of the values; `IR1` keeps `RELAY_SEAMS` the one owner |
| `docs/workflow/CONFIG.md` | the human guide's section list and table are the reader's map | the row says the key preselects the question and never bypasses `dispatch_relay`'s consent gate |
| `.pi/agentic-workflow.json` | the repository's own materialized config carries every declared option | written by `config default`, never by hand |
| `scripts/relay-route.test.mjs` | the existing suite already owns "the router's relay hint and its degradation" | the thirteen existing cases keep their assertions |
| `docs/ROADMAP.md` § Fixes | the unit's registration | the row is written by `runner roadmap row-upsert`, never hand-edited |

The issue's rollback note says "the router's addendum is untouched"; the state
detection is indeed correct and stays untouched, but the **instruction** in that
addendum is the surface the observed session read, and S1/S3 cannot be delivered
without it (S3 has no runtime consumer otherwise). The change is therefore
additive to the addendum, never a rewrite of its states.

## Surfaces

- `skills/unit-lane`
- `packages/agentic-workflow-schema`
- `packages/agentic-workflow`
- `scripts`
- `docs`

## Retirements

Strictly additive: no surface is retired, and no name is claimed twice. The
computed inventory (`runner residual-classify --inventory --base origin/main`)
is recorded in the `## Log` at P5; its rows are the new config section, the two
new published config exports and the new addendum line, each with its consumer.

## Non-goals

- Not an `auto` mode: S3 explicitly forbids promising a value that bypasses
  pi-web's own `dispatch_relay` consent gate.
- Not a change to the packet format, the baton grammar, the leg contract, or
  the coherence review.
- Not a change to `relay: active|complete|needs-help|unreadable` behavior.
- Not a rewrite of `RELAY.md`'s other sections; only §Bootstrap, §Degradation,
  the new §The seam's default, and the `## Forbidden` list move.
- Not a new gate step and not a new root suite: the existing
  `scripts/relay-route.test.mjs` suite and the schema package's config contract
  suite carry the red-first assertions.

## Risk tier

Computed, never chosen — `bun packages/agentic-workflow/bin/agentic-workflow.mjs
ceremony tier classify --paths 'skills/unit-lane/references/RELAY.md,skills/unit-lane/SKILL.md,packages/agentic-workflow-schema/src/config.ts,packages/agentic-workflow/src/runner/unit-route.mjs,scripts/relay-route.test.mjs,docs/workflow/CONFIG.md'`
returned, verbatim:

```text
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "3 path(s) carry executable content: packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow/src/runner/unit-route.mjs, scripts/relay-route.test.mjs",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": []
}
```

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "contained", resumable_from_diff: true, ceremony: "unit-doc", verification: "gates"}`
- **Named high-risk item** — none — not a high-tier unit.

## Future

none

## Future cost

- A later relay-seam value (were one ever asked for) enters through the same
  vocabulary and the same router reader; a second reader is a defect (`IR1`).
- Any new probe of "is pi-web here" keeps going through `pi-web.mjs`; the seam
  reader asks the config API, never a hand-parse of `.pi/`.

## Applicable tests

- `bun test scripts/relay-route.test.mjs` — the router's addendum, the
  degradation, the config default, and the contract prose.
- `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` —
  the `relay` section's values, default and refusals.

## Known pre-existing issues

- The 719-class session's invented policy ("The lane runs inline (conductor
  route)…") is recorded in `docs/features/719-nan-default-embed/SPEC.md`; its
  unit doc is historical evidence and is **not** edited by this unit
  (`does-not-affect`: no reader derives a route from that document).
- `docs/workflow/GOLDEN_FIXTURE.md` uses the words "conductor route" for the
  conductor's model tier in a dated run row; that is a different sense and is
  **not** touched (`does-not-affect`).

## Tasks

P1…P5, dependency-topological, smallest within a ready set.

- P1 — RED: add the seam cases to `scripts/relay-route.test.mjs` and the `relay` section cases to `packages/agentic-workflow-schema/test/config-contract.test.mjs`, commit them alone, and observe them failing on the missing section, the missing addendum mandate and the missing prose (validator: `bun test scripts/relay-route.test.mjs` exits 1 and `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 1, both recorded as `E` lines)
  (Implements: S1, S2, S3, S4)
  - Relevant files: scripts/relay-route.test.mjs, packages/agentic-workflow-schema/test/config-contract.test.mjs
- P2 — the `relay` section lands in the schema with one published vocabulary and the `ask` default (validator: `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow-schema/src/config.ts, packages/agentic-workflow-schema/config.schema.json
- P3 — the router reads the seam and its addendum mandates the ask-and-stop (validator: `bun test scripts/relay-route.test.mjs` exits 0)
  (Implements: S1, S3, S4)
  - Relevant files: packages/agentic-workflow/src/runner/unit-route.mjs
- P4 — the contract prose and the config guide ship the same behavior (validator: `bun test scripts/relay-route.test.mjs` exits 0 with the prose case AND `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S1, S2, S4)
  - Relevant files: skills/unit-lane/references/RELAY.md, skills/unit-lane/SKILL.md, docs/workflow/CONFIG.md
- P5 — state and docs: the materialized config, the fix row, the unit doc's evidence, the journal fragment and the generated projection (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/722-relay-seam-inline/SPEC.md` exits 0 AND `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4)
  - Relevant files: .pi/agentic-workflow.json, docs/ROADMAP.md, docs/generated/, .agentic-workflow/journal/

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Column order and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md` §1; this file is the S
carrier, so the embedded table below **is** the ledger.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known (read this session) | `RELAY.md` §Bootstrap states the approval as a condition only ("Human approval is required before any dispatch") and never a mandated ask-and-stop; §Degradation's body is written for the pi-web-absent branch alone | `skills/unit-lane/references/RELAY.md:107-127` (§Bootstrap steps 1–3), `:252-268` (§Degradation) | current | S1, S2, O1, O2, O3, O4 |
| PE-002 | known (read this session) | the router already distinguishes `bootstrap-needed` and `draft`, and its `next` string is the instruction the session reads verbatim: `create <packet>/ … then dispatch_relay(packet: …, leg: "1")` | `packages/agentic-workflow/src/runner/unit-route.mjs:587-629` (`relayAnswer`), `:631-642` (`relayLines`) | current | S1, S3, O1, O5 |
| PE-003 | known (read this session) | the router is a read-only addendum: the relay lines print after the fingerprint and the machine block is filtered out of every comparison; a relay line never changes a route, a command, a read-set or the fingerprint | `packages/agentic-workflow/src/runner/unit-route.mjs:1290-1315` (`print`); `scripts/relay-route.test.mjs` (`the hint is an addendum, the machine block is identical`) | current | S4, O5, O11 |
| PE-004 | known (read this session) | the base config registry is the single home of every feature section; a consumer reads it through `createConfigApi(...).get("resolved", path)`, exactly as `batchScheduler.surfaces` is read, so "absent" and "refused" mean the same to the CLI and the runtime | `packages/agentic-workflow-schema/src/config.ts:481-616` (`BASE_CONFIG_SECTIONS`), `packages/agentic-workflow/src/batch-scheduler/vocabulary.mjs:146-156` | current | S3, O6, O7, O8 |
| PE-005 | known (read this session) | a key with no runtime consumer is not shipped: the guide's config policy says "publish the consumer or keep the key out", and issue #626 retired a section for exactly that reason | `AGENTS.md` § Config policy for new features; `docs/workflow/CONFIG.md` § Migration from the pre-unified files (issue #626) | current | S3, O6, O9 |
| PE-006 | known (read this session) | a new base section requires the generated `config.schema.json` regenerated (a gate step checks it), the committed `.pi/agentic-workflow.json` re-materialized, and the CONFIG.md base list + Sections table updated | `packages/agentic-workflow-schema/package.json` (`check:config-schema`), `scripts/local-config-contract.test.mjs`, `docs/workflow/CONFIG.md:18-64` | current | S3, O10, O12 |
| PE-007 | known (read this session) | the committed `.pi/agentic-workflow.json` is materialized by `config default`, which preserves operator values, adds a new section's default with its comment, and backs the file up first | `packages/agentic-workflow/src/config/materialize.mjs`; `packages/agentic-workflow/test/config-materialize.test.mjs` | current | S3, O10 |
| PE-008 | known (read this session) | the fix unit's registration row is written by `runner roadmap row-upsert` (the fix arm calls `fixRowUpsert`), and `runner roadmap check` reads it back against the unit doc | `packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:63-99`; `docs/ROADMAP.md` § Fixes | current | O13 |
| PE-009 | known (read this session) | the generated projection (`docs/generated/units.md`) lists every unit folder and the gate runs `docs-generate --check` on every push, so a new unit doc requires a re-emission | `AGENTS.md` § Docs site; `packages/agentic-workflow/src/docs-generate/index.mjs:584-592` | current | O13 |
| PE-010 | known (read this session) | the session entry is a journal fragment: `.agentic-workflow/journal.md` declares the carrier and `docs/LOGS.md` is the aggregator's, never a session's | `.agentic-workflow/journal.md`; `scripts/log-immutability.mjs` header | current | O13 |
| PE-011 | known (read this session) | the router tests copy `scripts/fixtures/relay-route/` per case and set `PI_WEB_SESSION`/`UNIT_ROUTE_REPO`; the config API resolves the project file at `<root>/.pi/agentic-workflow.json` and the global one at `PI_CODING_AGENT_DIR`, so a case can pin both without touching this machine's `~/.pi` | `scripts/relay-route.test.mjs:33-60`; `packages/agentic-workflow/src/config/store.mjs:12-22` | current | O1, O7, O8, O11 |
| PE-012 | assumption (owner: this session) | pi-web's `dispatch_relay` asks the human itself; the lane's ask cannot and must not replace it, so `inline` preselects the lane's question and never the host's consent | issue #722 S3's parenthetical; `skills/unit-lane/references/RELAY.md` §A leg ("Never dispatch without the human's approval") | current | S3, O8 |

### Obligations

One row per normative behaviour, invariant, use case and required failure state.
Every row is `planned` at the cut and flips only on a foreground validator run
whose receipt lands where `required-evidence` says.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 · PE-001 · PE-002 | With pi-web present and the packet `bootstrap-needed`, the addendum the conductor reads orders the owner's answer before any dispatch and says to stop for it — the 719-class reading ("then dispatch") is no longer the only instruction | P3 | P3 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the case `pi-web present: bootstrap-needed mandates the ask and the stop` | `E` line naming the case and its exit | planned |
| O2 | S1 · PE-001 · PE-002 | With pi-web present and the packet `draft`, the addendum orders the same ask-and-stop, and leg 1 is seeded only after the owner's answer | P3 | P3 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the case `pi-web present: draft mandates the ask and the stop` | `E` line naming the case and its exit | planned |
| O3 | S1 · PE-001 | `RELAY.md` §Bootstrap carries the ask-and-stop as a required, numbered step that names both answers (relay legs, inline) and the recorded default; a condition is not enough | P4 | P4 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the contract case reading `RELAY.md` §Bootstrap for `ask`, `stop`, `relay.seam` and both answers | `E` line naming the case and its exit | planned |
| O4 | S1 · PE-001 | `skills/unit-lane/SKILL.md` step 4's hand-off paragraph names the ask-and-stop and cites `RELAY.md` §Bootstrap rather than restating a state table | P4 | P4 | direct application (this session) | the same contract case reads `SKILL.md` and matches its ask-and-stop pointer | `E` line naming the case and its exit | planned |
| O5 | S2 · S4 · PE-001 · PE-003 | The degradation keeps its `relay: unavailable`-only meaning: an unavailable relay prints the per-phase `/execute-phase` fallback and no `relay-seam` line, and a present-but-unapproved packet is explicitly *not* a degradation | P3 | P3 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the case `pi-web absent: degradation stays unavailable-only` and the contract case reading §Degradation for the present-unapproved exclusion | `E` line naming both cases | planned |
| O6 | S3 · PE-004 | The `relay` section exists with one closed vocabulary (`ask`, `inline`), the shipped default `ask`, and the section's own description stating it never bypasses the host's consent gate | P2 | P2 | direct application (this session) | `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 with the `relay section` case | `E` line naming the case and its exit | planned |
| O7 | S3 · PE-004 · PE-011 | Absent key = `ask`: a project with no `.pi/agentic-workflow.json` prints `relay-seam: ask`, and the schema resolves the same default | P2 | P2 | direct application (this session) | the schema case asserts `defaults.seam === "ask"` AND `bun test scripts/relay-route.test.mjs` exits 0 with the absent-key case | `E` line naming both | planned |
| O8 | S3 · PE-012 | `inline` preselects the question and never skips it: the same addendum still prints the ask and the stop, and the schema refuses an unknown value instead of coercing it | P2 | P2 | direct application (this session) | `bun test packages/agentic-workflow-schema/test/config-contract.test.mjs` exits 0 with the unknown-value refusal AND `bun test scripts/relay-route.test.mjs` exits 0 with the `inline` case | `E` line naming both | planned |
| O9 | S3 · PE-005 | The config key ships a runtime consumer: the router prints the resolved seam, so `inline` changes stdout and no unread key enters the schema | P3 | P3 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the case asserting `relay-seam: inline` under the project config | `E` line naming the case | planned |
| O10 | S3 · PE-006 · PE-007 | The declared section reaches its state surfaces: the generated `config.schema.json` carries `relay`, and the committed `.pi/agentic-workflow.json` materializes its default | P5 | P5 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs config validate --scope both` exits 0 AND `bun run --cwd packages/agentic-workflow-schema check:config-schema` exits 0 | `E` lines with both exits | planned |
| O11 | S4 · PE-003 | The seam is an addendum: the machine block (route, `next:`, rows, read-set, fingerprint) is byte-identical with and without pi-web and with either seam value | P3 | P3 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the existing `the hint is an addendum, the machine block is identical` and `the hint never changes the route or the read-set` cases | `E` line naming both cases | planned |
| O12 | S3 · PE-006 | `docs/workflow/CONFIG.md` names the key in the base list, the Sections table and its own seam note, and states `absent = ask` and the no-bypass rule | P4 | P4 | direct application (this session) | `bun test scripts/relay-route.test.mjs` exits 0 with the contract case reading `CONFIG.md` for `relay`, `seam`, `ask`, `inline` and `absent` | `E` line naming the case | planned |
| O13 | S1 · S2 · S3 · S4 · PE-008 · PE-009 · PE-010 | The state and docs surfaces ship with the change: the fix row registered, the unit doc's evidence current, the journal entry a fragment, and the projection re-emitted | P5 | P5 | direct application (this session) | `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/722-relay-seam-inline/SPEC.md` exits 0 AND `bun scripts/docs-generate.mjs --check` exits 0 AND `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check` exits 0 | `E` lines with the three outcomes | planned |
| O14 | S1 · S3 · S4 | Red-first and regression: the test commit precedes the implementation commit, the observed-red run is recorded, and every existing relay-route case keeps its assertion | P1 | P1 | direct application (this session) | `git log --oneline --reverse origin/main..HEAD` lists the RED commit before the implementation commits AND `bun test scripts/relay-route.test.mjs` exits 0 with the original thirteen cases named | `E` lines with the reversed list and the green run | planned |
| O15 | S1 · S2 · S3 · S4 | The whole gate is green in the foreground, and no command's stdout/stderr/exit changed for a reason this unit did not ask for | P5 | P5 | direct application (this session) | `bun scripts/local-gate.mjs` exits 0 AND `bun scripts/run-root-suite.mjs` exits 0 | `G` lines with both verdicts | planned |

## Triaged steps

> Pasted from `runner unit-route --triage 722-relay-seam-inline` after the unit
> doc existed; the machine's block is authoritative and the lane never
> re-derives it.

```text
TRIAGE — 722-relay-seam-inline (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/722-relay-seam-inline
relay-next: create .pi-web/relays/722-relay-seam-inline/ (charter → docs/fix/722-relay-seam-inline/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/722-relay-seam-inline", leg: "1") · legs: 6 = 5 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

Append-only; kinds are the closed set in `log-kind@1` (the template's).

- **L1** — 2026-11-24, the issue, verbatim:
  ```
  ### What's broken

  `unit-lane`'s Relay seam behaves **non-deterministically** at the "pi-web present, packet not yet approved" state: some sessions bootstrap the packet and ask the owner for approval (the designed flow), others silently degrade to inline `/execute-phase` hand-offs without creating a packet and without asking. The degradation path is only defined for *pi-web absent* (`RELAY.md` §Degradation), so an agent that reaches "pi-web present, unapproved" fills the undefined state with its own invented policy.

  ### Detected in

  - Observed: `feat/719-nan-default-embed` (2026-11-24) — the conductor recorded the router's `relay: bootstrap-needed` addendum in the unit doc, then authored its own policy (*"The lane runs inline (conductor route): no relay packet is dispatched — the owner invoked the lane directly"*) and degraded to inline `/execute-phase 719-nan-default-embed P1 (tier: cheap)`. No packet was created, no question was asked. The phrase "conductor route" appears in no skill, reference or doc — it is agent-invented.
  - Working contrast: `sosfelinosbasti` fix/334 — the conductor bootstrapped the packet (Leg 0), asked the owner ("Next: human approval → dispatch leg 1"), and after approval dispatched legs 1–6 to `Complete`. Same installed release, same skill wording, same repo config.

  ### Reproduction steps

  1. In a pi-web session (`PI_WEB_SESSION=1`), run `/unit-lane --from-issue <N>` on a feature whose triage yields execution phases.
  2. Observe the triage block: it correctly prints `relay: bootstrap-needed` + `relay-next:` (reproduced live: `agentic-workflow unit-route --triage 719-nan-default-embed` → `legs: 6 = 5 phases + 1 coherence review`).
  3. Watch what the conductor does after the plan step: §Bootstrap step 3 states only the approval *condition* ("Human approval is required before any dispatch") — nothing mandates *asking and stopping*, so the model decides.

  ### Expected behaviour

  Deterministic behavior at the seam: when pi-web is present and the packet is unapproved, the conductor **asks the owner** (relay or inline) **and stops for the answer**. Silent degradation to inline is permitted only when pi-web is genuinely absent (`relay: unavailable`). The ask must be a required step with a stop, not an optional courtesy — otherwise the same contract yields two different deliveries depending on the model's judgment (ask-don't-infer, IR10-adjacent).

  ### Actual behaviour

  Undefined state; observed outcomes diverge by session (see Detected in).

  ### Root cause (if known)

  - `skills/unit-lane/references/RELAY.md` §Bootstrap step 3 expresses consent as a condition, never as a mandated ask-and-stop step.
  - §Degradation covers only the pi-web-absent branch; the "pi-web present, packet `bootstrap-needed`/`draft`" state has no bound behavior in any skill surface.
  - No config key exists to express the owner's default preference (no `relay*` key anywhere in the config schema), so nothing can pin the behavior either way.

  ### Surfaces

  - `skills/unit-lane/references/RELAY.md` (§Bootstrap, §Degradation — the contract owner)
  - `skills/unit-lane/SKILL.md` (step 4 hand-off wording)
  - `packages/agentic-workflow/src/runner/unit-route.mjs` (router already correct: `relay: bootstrap-needed` / `draft` states exist)
  - `packages/agentic-workflow-schema/src/config.ts` (no relay key exists; optional config home for the owner default)

  ### Acceptance criteria

  1. When pi-web is present and the packet state is `bootstrap-needed` or `draft`, the lane conductor asks the owner and stops — it never degrades to the inline `/execute-phase` hand-off silently. (Red-first test can pin the skill/contract wording; behavior itself stays soft-by-design.)
  2. §Degradation keeps its current meaning: inline hand-off only where pi-web is absent (`relay: unavailable`).
  3. An optional config key records the owner's default at the seam (at minimum `ask` vs `inline`); absent key = `ask`. Note: an `auto` value cannot bypass pi-web's own `dispatch_relay` human-consent gate — do not promise it. (Owner stance recorded for #705/#669: rejected for the general case, accepted implicit consent for `/flow`.)
  4. Both sessions' outcomes become indistinguishable under the contract: the 719-class path is no longer reachable.

  ### Rollback strategy (if needed)

  Revert the RELAY.md/SKILL.md wording change and any config key in one commit; the router's addendum is untouched.

  ---

  Automated writed using a AI

  ## Surfaces

  scriptsBODY
  2>&1
  ```
- **L2** — 2026-11-27, the owner's instruction, verbatim (the local inline workflow this unit is applied under):
  ```
  Apply to this repository: issue #722

  This is a **local, unpublished** workflow for changing agentic-workflow itself. The failure it prevents: the workflow judging its own surgery (unit fix-258 burned 12 review→fold cycles that way). Follow this order, every step:
  ```
- **D1** — the seam's state-detection code is untouched; the observed failure's instruction surface is the router's `relay-next:` and the contract's §Bootstrap step 3, and both move. The config key's runtime consumer is the router (S3 + the "no unread key" policy), so the addendum is printed only while the question is live (`bootstrap-needed`, `draft`) and never for `active`, `complete`, `needs-help` or `unavailable`.

## Next

P1 — write the RED assertions and commit them alone.

## References

- issue [#722](https://github.com/gtrabanco/agentic-workflow/issues/722)
- `docs/ROADMAP.md` row 722 (the promoted feature row) and its `## Fixes` registration
- the 719-class evidence: `docs/features/719-nan-default-embed/SPEC.md`
- owner instruction notes on the rejected `auto` value: issues #705 and #669
- the seam's contract owner: `skills/unit-lane/references/RELAY.md`

## Branch

`feat/722-relay-seam-inline`

## Depends on

none

## Regression scope

| Scenario | Verification |
|---|---|
| A session without pi-web still gets the per-phase `/execute-phase <NN> P<k>` hand-off and the reason, byte for byte | `scripts/relay-route.test.mjs` case `router, pi-web absent: the per-phase fallback is printed and unchanged` |
| The relay addendum never changes a route, a command, a read-set or the fingerprint | `scripts/relay-route.test.mjs` cases `the hint is an addendum, the machine block is identical` and `the hint never changes the route or the read-set` |
| `relay: active|complete|needs-help|unreadable` keep their current lines and seed nothing new | the corresponding existing cases in `scripts/relay-route.test.mjs` |
| Every other base config section keeps its key, default and refusal | `packages/agentic-workflow-schema/test/config-contract.test.mjs` and `bun test packages/agentic-workflow/test/config-materialize.test.mjs` |
| The generated config schema stays in sync with the registry | `bun run --cwd packages/agentic-workflow-schema check:config-schema` |
