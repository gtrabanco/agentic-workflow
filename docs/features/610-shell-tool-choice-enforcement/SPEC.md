---
type: feature
scope: medium
roadmap_summary: Issue [#610](https://github.com/gtrabanco/agentic-workflow/issues/610) (M): shell-tool choice enforced at command time — a pi `tool_call` carrier blocks or rewrites `grep`-as-search to `rg` and `node`-as-default to `bun` (the sanctioned node forms pass untouched), availability comes from the doctor's own resolver, one shared allowlist feeds both the carrier and `scripts/invocation-drift.mjs` with a parity pin, and the `invocation-drift` GATE_INVENTORY row is re-declared to what it actually checks while the carrier claims its own row.
---

# 610 — shell-tool-choice-enforcement

> One-line: the `rg`-before-`grep` / `bun`-before-`node` convention stops being
> prose read once and becomes an interception at command time, with one shared
> allowlist and a parity pin so the gate and the carrier cannot drift apart.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

The owner's request is issue [#610](https://github.com/gtrabanco/agentic-workflow/issues/610)
`## In scope`, one requirement per bullet, quoted verbatim. The issue's
`## Acceptance criteria` (`AC1`–`AC7`) are its own acceptance list and are quoted
in `## Acceptance criteria` below; they are the criteria, not additional
requirements. The issue's `## Out of scope` bullets are quoted in `## Non-goals`.

**S1 — The domain-separation exception is recorded.**
> **Owner decision recorded**: this repo's tool-choice convention is allowed to ship an enforcement carrier in the host package (pi-agentic-workflow) — the domain-separation exception this issue is.

**S2 — Availability is detected once, through the doctor's resolver.**
> **Programmatic detection once**: the tool doctor (`#537`) already reports installed tools; the interception layer reads availability from there (or the same resolver), never from a second probe.

**S3 — One interception carrier, at the tool call.**
> **One interception carrier** — either:
>   - a pi extension `tool_call` hook on Bash that (a) rewrites or blocks `grep`-as-search → `rg` with the reason surfaced to the model, (b) warns or blocks `node scripts/…` / `node -e` first-invocations when `bun` is on PATH — whitelisting the forms `scripts/invocation-drift.mjs` already sanctions (`node --test scripts/<file>.test.mjs`, `node scripts/run-root-suite.mjs`, bootstrap-allowed literals), the same allowlist both layers read; **or**
>   - session-scoped PATH shims installed by `setup-env` (`grep`→`rg` delegate, `node`→`bun` delegate with logging), making the fallback the safe default.
>   One carrier first, not both; the second is the recorded fallback if the first proves noisy.

**S4 — Spawn provenance, decided here, routed to #611 when planning routes it there.**
> **Spawn provenance (decided here)**: the runner's feedback/journal output distinguishes "spawn of the pi package's own dependency" from "agent invocation resolved through the closed set" — one line of provenance in the runner's existing feedback channel, no new surface. This kills the ambiguous `node bin …` diagnosis class without touching the runtime convention. If triage during planning routes it to #611's observability scope instead, this issue drops it and cites that.

**S5 — The prose homes do not multiply.**
> **Prose stays once**: the AGENTS.md §Runtime convention sentence and the #269 rg-first convention remain the only prose homes; the carrier cites them, never restates them (repetition-names-its-owner rule).

**S6 — One allowlist, one parity pin.**
> **Parity pin**: a test pins the whitelist against `invocation-drift.mjs`'s sanctioned set so the two cannot drift (#555's runner-set parity pattern).

**S7 — The gate inventory tells the truth.**
> **Honest re-declaration**: the `invocation-drift` GATE_INVENTORY row's checkability restated to what it actually checks (prose pin = 2) once the behavior carrier exists and claims its own row.

## Acceptance criteria

Frozen at cut. The issue's own list is quoted first (its words, its ids), then one
criterion per `S#` with the check that proves it — the anchors a review
dismantles one by one.

The issue's `## Acceptance criteria`, verbatim:

> - AC1 — With the carrier active, a session command `grep -n 'x' file` is rewritten or blocked with an `rg`-equivalent named in the reason; `node packages/agentic-workflow/bin/agentic-workflow.mjs …` is warned/blocked when bun is on PATH; every sanctioned node form passes untouched (allowlist parity test green).
> - AC2 — The allowlist is read from one source shared with `scripts/invocation-drift.mjs`; editing one moves both (parity test, #555 pattern).
> - AC3 — The carrier is off by default or owner-configurable per the package's config policy (`docs/workflow/CONFIG.md`: intentional tunable, section owned, schema first, docs + changeset shipped).
> - AC4 — A recorded session (before/after) shows the drift rate against a flash-family model dropping to zero violations without human correction.
> - AC5 — `invocation-drift`'s GATE_INVENTORY row states its real checkability; the carrier owns its own row with the whitelist grammar it actually enforces.
> - AC6 — No regression: the node compatibility gate (`node scripts/run-root-suite.mjs`, `node --test` fallback) stays green and unpunished.
> - AC7 — **Vehicle rollout**: the carrier's own delivery names its dogfooding step — a canary cut + `pi install` refresh (or the `AGENTIC_WORKFLOW_RUNNER` arming from #611) must be recorded in the unit's evidence before AC4's before/after session is captured; a merged-but-unreinstalled carrier is not AC4 evidence.

Per requirement:

- **AC-S1** — The unit doc records the exception as an owner decision (`D` line)
  and the carrier's own README section names it as the shipped surface, citing
  `docs/workflow/DOMAIN_SEPARATION.md` for the rule instead of restating it.
  Check: `rg -c 'domain-separation exception' packages/pi-agentic-workflow/README.md`
  matches 1 and `rg -c 'DOMAIN_SEPARATION\.md' packages/pi-agentic-workflow/README.md`
  matches 1.
- **AC-S2** — The carrier's availability answer comes from the doctor's own
  resolver (`findOnPath` in `packages/agentic-workflow/src/doctor/probes.mjs`);
  no second `PATH` probe exists anywhere in the carrier's path. Check:
  `rg -n 'from "../doctor/probes.mjs"' packages/agentic-workflow/src/tool-choice/availability.mjs`
  matches 1, and `rg -c 'process\.env\.PATH' packages/pi-agentic-workflow/src` matches 0.
- **AC-S3** — With the carrier active and `rg` on PATH, `grep -n 'x' file` is
  blocked with `rg -n 'x' file` named in the reason, and `node -e …` /
  `node packages/agentic-workflow/bin/agentic-workflow.mjs …` are blocked with
  the `bun` form named when `bun` is on PATH; with `rg` (or `bun`) absent the
  same command passes untouched, and a pipe-fed filter (`… | grep -v x`) is not
  search and passes. Check: `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs`
  exits 0.
- **AC-S4** — The spawn-provenance bullet is routed to #611's observability
  scope: the unit doc records the routing as a `D` line and names its
  replacement owner, and the carrier/runner gain no provenance surface. Check:
  `rg -n 'Spawn provenance is routed' docs/features/610-shell-tool-choice-enforcement/planning-obligations.md`
  matches 1, and `rg -c 'spawn-provenance' packages` matches 0.
- **AC-S5** — No prose surface restates the rule: the carrier's reason strings
  and the package README point at the owner (`AGENTS.md` §Runtime convention,
  `docs/workflow/GATE_INVENTORY.md`) rather than re-declaring "bun before node".
  Check: `node --test scripts/residue-dimensions.test.mjs` exits 0.
- **AC-S6** — The allowlist lives once in
  `packages/agentic-workflow/src/tool-choice/policy.mjs`; the drift gate imports
  it and the carrier classifies with it, and the parity suite refuses a
  divergence in either direction. Check: `bun test scripts/tool-choice-parity.test.mjs`
  exits 0.
- **AC-S7** — `docs/workflow/GATE_INVENTORY.md` carries the restated
  `invocation-drift` row (checkability 2, statement = what it checks) and the
  carrier's own row claiming the whitelist grammar. Check:
  `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`, and
  `bun test scripts/prose-gate-inventory.test.mjs` exits 0.
- **AC-AC3** — The key is a declared, optional, owner-configurable tunable
  (`pi.toolChoice`), schema-first, documented and changeset-carried. Check:
  `bun test packages/pi-agentic-workflow/test/config-extension.test.mjs` exits 0
  and `rg -n 'toolChoice' docs/workflow/CONFIG.md` matches 1.
- **AC-AC4** — The before/after evidence is a recorded pair of sessions in a
  scratch project (flash-family model, the same search task) with the carrier
  off and on, plus the replay of the measured drift corpus from the issue's own
  session audit. Check: the pair's recorded command lists show ≥1 `grep`/`node`
  default violation before and 0 after, recorded as `E` lines.
- **AC-AC6** — `node scripts/run-root-suite.mjs` and
  `node --test scripts/<file>.test.mjs` are sanctioned forms and stay
  unpunished: the carrier's suite proves both pass untouched, and the root gate
  is green. Check: `node scripts/run-root-suite.mjs` exits 0.
- **AC-AC7** — The delivery names its dogfooding step and records the arming
  used before the AC4 capture (a canary build of this worktree's extension armed
  into a scratch workspace). The published canary cut and `pi install` refresh
  are the owner's post-merge step and are recorded as such, never claimed. Check:
  the unit doc's `D`/`E` lines carry the arming and the capture order.

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `packages/agentic-workflow/src/tool-choice/policy.mjs` (new) | S6: the one allowlist and the pure classifier both layers read | the drift gate, the carrier, their suites |
| `packages/agentic-workflow/test/tool-choice.policy.test.mjs` (new) | S6: the classifier's cases, including the measured drift corpus | the crate suite (`bun run test`) |
| `packages/pi-agentic-workflow/src/guards/tool-choice.ts` (new) | S2/S3: the carrier decision — availability in, decision out, no Pi import | the extension's `tool_call` handler; its suite |
| `packages/pi-agentic-workflow/src/extension/index.ts` | S3: one branch in the existing `tool_call` handler | every bash call of a session running this package |
| `packages/pi-agentic-workflow/src/config/{types,defaults,schema,merge}.ts` + `agentic-workflow.config.json` | AC3: `pi.toolChoice`, optional, schema-first | `agentic-workflow config`, the settings console |
| `packages/pi-agentic-workflow/README.md` | S1/S3: the shipped surface and its opt-out | package readers |
| `scripts/invocation-drift.mjs` | S6: its allowlist moves to the shared module and is imported back | its own suite; every push |
| `scripts/tool-choice-parity.test.mjs` (new) | S6: the parity pin, #555's pattern | the root gate |
| `docs/workflow/GATE_INVENTORY.md` | S7: the restated row and the carrier's own row | `prose-gate-inventory`, every audit |
| `AGENTS.md` | S7: one `normative-surfaces@1` row for the whitelist grammar | `normative-drift`, `prose-gate-inventory` |
| `docs/workflow/CONFIG.md` | AC3: the section's row and its values | config readers |
| `.changeset/610-shell-tool-choice.md` | the release intent for the behaviour change | the release train |

Sweep at plan time: `rg -n 'bun before|rg before|tool-choice|tool choice' AGENTS.md skills/
docs/workflow packages/*/README.md` shows the rule's prose homes are `AGENTS.md`
§Runtime convention, the two executor skills' per-turn box and the
`invocation-drift` gate row — none of them is edited to restate anything, and
the carrier's strings cite the owner. The `## Spawn provenance` route (S4) has no
code surface here: `rg -c 'spawn-provenance' packages` is 0 at the cut head.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `scripts`
- `docs`

## Retirements

Nothing is retired: the carrier is additive and the drift gate keeps every rule it
had (its allowlist changes home, not value). Inventory receipt:
`bun scripts/residual-classify.mjs --inventory --base <cut head>` — recorded in
`## Log`. One surface changes *meaning*, not existence: the `invocation-drift`
GATE_INVENTORY row is restated (S7) — a correction of a claim, never a removal,
and its checkability drops from 3 to 2 because its real check is a prose pin.

## Non-goals

The issue's `## Out of scope`, verbatim:

> - Uninstalling or hiding node — node compatibility is a shipping contract (CI runs `node scripts/run-root-suite.mjs`; the fallback is tested, never broken).
> - Changing the pin mechanics or the runner-contract (#555) — closed and correct.
> - Deciding the #444 permission-guard adoption here — that issue owns its own carrier decision; this issue only records that a bash-interception carrier is now *requested*.
> - Enforcing tool choice inside the workflow's own gates beyond what `invocation-drift.mjs` already does.

Plus, decided at cut:

- **No PATH shims.** S3 says one carrier first; the hook is the one shipped. The
  shim route stays the recorded fallback and is not built here.
- **The carrier reads only the tool call's own text.** A `grep` inside a
  program the agent executes (`bash scripts/x.sh`) is out of its reach; that
  boundary is stated, not silently assumed.
- **No provenance line in the runner.** S4 is routed to #611 (see `## Log` `D2`).
- **No second reset of the gate's other rules.** `usage-node`,
  `turn-box`, `guide-line` and `suite-carve-out` keep their behaviour and cases.

## Risk tier

Verdict copied from the crate's classifier over the planned paths
(`contract: risk-tier-verdict@1`), never written from memory:

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- **2026-11-17, open — the PATH-shim carrier.** The issue's second route
  ("session-scoped PATH shims installed by `setup-env`") stays unimplemented; it
  becomes the fallback if the hook proves noisy. Not implemented here.

## Future cost

- **The allowlist has one home.** A new sanctioned node form (or a new
  bootstrap script) lands in `packages/agentic-workflow/src/tool-choice/policy.mjs`
  and in neither consumer; the parity suite refuses a consumer that stops
  reading it. Binds whoever next adds a sanctioned form, and binds the
  `invocation-drift` gate.
- **`grep`-shaped detection is positional.** A future rule that wants to
  intercept pipe-fed filters has to move the classification in the policy
  module and the carrier's cases together. Binds the next carrier change.

## Applicable tests

- `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` — the
  classifier, the shared allowlist and the measured drift corpus.
- `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` — the
  carrier decisions, both modes, both unavailability postures.
- `bun test scripts/tool-choice-parity.test.mjs` — the parity pin.
- `bun test scripts/invocation-drift.test.mjs` — the gate's previous behaviour.
- `cd packages/pi-agentic-workflow && bun run test` — the package gate.
- `node scripts/run-root-suite.mjs` — the whole deterministic gate.

## Known pre-existing issues

- **The `tool_call` inbox is a queue, not a bus** — several guards can want the
  same call and only one block is returned. *Does not affect* this unit: the
  carrier sits before the receipt/shell guards and returns only its own decision.
- **`packages/pi-agentic-workflow/README.md` documents guards per feature, and
  the receipt/identity guards have no section** — *does not affect* this unit;
  the carrier gets its own section because it is shipped behaviour, and the
  existing gap is not reopened.
- **A model can call a *different* shell tool (a custom `bash`-like tool) and
  bypass the hook** — *does not affect* this unit: the hook keys on the host's
  `bash` tool, which is the one the workflow's skills invoke.
- **`dependency-pin-gate` is red at this head on registry drift, not on this
  unit**: `@gtrabanco/pi-agentic-workflow` pins `pi-extensible-workflows` at
  6.3.0 and the registry published 6.4.0 (`GATE REJECTION — dependency-pin-drift`).
  This unit changes no dependency, no pin and neither manifest —
  `git diff main -- packages/pi-agentic-workflow/package.json bun.lock` is empty —
  so the drift predates it; bumping the pin (+ the package version) is the
  dependants' declared unit, never a silent edit here. *Does not affect* this
  unit's behaviour or its verification: every other gate step is green.

## Tasks

- P1 — The crate's policy module: segment splitting that keeps each segment's
  operator, the grep-search/node-default classification, the sanctioned-form
  allowlist and the rg/bun forwarding (validator: `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` exits 0)
  (Implements: S2, S3, S6)
  - Relevant files: packages/agentic-workflow/src/tool-choice/policy.mjs, packages/agentic-workflow/test/tool-choice.policy.test.mjs
- P2 — The drift gate reads its allowlist from the shared module, behaviour
  unchanged (validator: `bun test scripts/invocation-drift.test.mjs` exits 0)
  (Implements: S6)
  - Relevant files: scripts/invocation-drift.mjs, scripts/invocation-drift.test.mjs
- P3 — The parity pin: the gate's set and the carrier's set must agree
  (validator: `bun test scripts/tool-choice-parity.test.mjs` exits 0)
  (Implements: S5, S6)
  - Relevant files: scripts/tool-choice-parity.test.mjs
- P4 — The carrier decision module: availability in, block/rewrite/pass out,
  reason strings that cite the owner (validator: `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` exits 0)
  (Implements: S2, S3, S5)
  - Relevant files: packages/pi-agentic-workflow/src/guards/tool-choice.ts, packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs
- P5 — The config key `pi.toolChoice`: schema, types, defaults, merge,
  committed descriptor, CONFIG.md row and the changeset (validator: `bun test packages/pi-agentic-workflow/test/config-extension.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: packages/pi-agentic-workflow/src/config/schema.ts, packages/pi-agentic-workflow/src/config/types.ts, packages/pi-agentic-workflow/src/config/defaults.ts, packages/pi-agentic-workflow/src/config/merge.ts, packages/pi-agentic-workflow/agentic-workflow.config.json, docs/workflow/CONFIG.md, .changeset/610-shell-tool-choice.md
- P6 — The wiring: one branch in the existing `tool_call` handler, config read
  once per session, availability from the doctor's resolver (validator: `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S2, S3)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts
- P7 — The declared surfaces: the restated `invocation-drift` row, the carrier's
  own row, the `normative-surfaces@1` row, the package README section, and the
  S4 routing record (validator: `bun scripts/prose-gate-inventory.mjs` prints `verdict: PASS`)
  (Implements: S1, S4, S5, S7)
  - Relevant files: docs/workflow/GATE_INVENTORY.md, AGENTS.md, packages/pi-agentic-workflow/README.md
- P8 — The dogfooding step and the before/after capture: name the rollout,
  arm a canary build of this worktree's extension in a scratch workspace, record
  the flash-family pair and the drift-corpus replay (validator: `rg -n 'AC4|before/after' docs/features/610-shell-tool-choice-enforcement/SPEC.md` matches)
  (Implements: S3)
- P9 — Verification: the package gates, the root gate and the docs projection
  fixed point (validator: `node scripts/run-root-suite.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7)

### Planning evidence

Frozen beside this document in [`planning-evidence.md`](planning-evidence.md) —
M/L shape, so the ledger lives in its own file and this section only names it.

### Obligations

Frozen beside this document in [`planning-obligations.md`](planning-obligations.md) —
the 9-column shape, ids `O1`–`O12`, every row `planned` at cut.

## Triaged steps

The owner's local workflow substitutes this document for the lane's plan step
(no `runner unit-route --triage` run on this unit's own surgery), so the step
list is the frozen task list above, in dependency-topological order:

1. P1 policy module (prerequisite for P2–P6)
2. P2 gate reads the shared allowlist
3. P3 parity pin
4. P4 carrier decision module
5. P5 config key and its committed descriptor
6. P6 extension wiring
7. P7 declared surfaces
8. P8 dogfooding step and before/after capture
9. P9 verification

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, issue [#610](https://github.com/gtrabanco/agentic-workflow/issues/610),
  verbatim (elided only where the body repeats its own measured session table and
  its `## Out of scope` list — quoted in full in `## Non-goals` — plus the
  automated-signature footer, marked `[…]`):
  ````
  ## Type

  - [x] Feature

  ## Goal

  Enforce shell-tool choice **programmatically at command time** — transpose the #555 runner pattern (programmatic detection, one prose home, parity pin) from the CLI runner to the agent's own bash tool choice: `rg` before `grep` for search, `bun` before `node` for manual invocation. Today this convention lives only in prose nothing re-orders mid-session, and the drift keeps recurring.

  ## Context (verified evidence)

  **The recurrence is measured, not anecdotal.** Issue #329 (closed 2026-11-03, fourth drift round, delivered as `docs/fix/329-runtime-invocation-drift/`, PR #380) fixed the 10 `usage: node` strings, the `bun test scripts/` false-green, and added the invocation-drift gate — but the delivered gate scans **committed tree literals** plus the AGENTS.md sentence "Tool choice is re-decided every turn". #329's own root-cause hypothesis 1 — *"prose read once at Step 0; nothing re-orders shell-tool choice at command time"* — was left standing.

  **Why the carrier never landed:** domain separation (owner decision 2026-11-07) keeps project-domain decisions out of the pi package unrequested — and "enforce rg/bun in the host's bash path" is exactly such a decision. This issue is the owner request. Without it, the fifth recurrence is a when, not an if.

  **External precedent (same problem, solved at the executor):** Anthropic's own `bash_command_validator_example.py` PreToolUse hook blocks `grep`/`find -name` with a redirect message; community hooks rewrite the command in place (`updatedInput`) — *"reliably neutralizes the footgun where the prompt rule did not"* (anthropics/claude-code#62016). Claude Code's system prompt alone ("NEVER invoke grep as a Bash command") was measured insufficient — the fix lives in the tool path, not the prompt. pi has the equivalent seam: the `tool_call` extension hook can block and `tool_call.input` is mutable in place (`docs/extensions.md`).

  ## In scope

  [quoted in full in `## Specs`, S1–S7]

  ## Out of scope

  [quoted in full in `## Non-goals`]

  ## Acceptance criteria

  [quoted in full in `## Acceptance criteria`]

  […]

  ````
- **D1** — 2026-11-17, S3's carrier: the `tool_call` hook is the one shipped
  carrier, not the PATH shim — the issue orders "one carrier first, not both",
  and the shim is the recorded fallback (`## Future`). Both postures are
  implemented inside the one hook (block is the default, rewrite is the declared
  alternative), so "rewritten or blocked" is a configuration answer, never a
  second carrier.
- **D2** — 2026-11-17, S4 routed to #611's observability scope, as the issue
  permits: #611 owns the "stale runtime/vehicle ≠ code bug" diagnosis class and
  the dogfooding vehicle, and a provenance line in the runner's feedback channel
  is exactly its observability surface. This unit ships no provenance code and
  cites #611 instead.
- **D3** — 2026-11-17, the default posture: `pi.toolChoice.enabled` defaults to
  `true` with `mode: "block"` — the issue's AC3 allows "off by default **or**
  owner-configurable", and default-off would need this repo to commit a config
  key the *installed* package's validator still refuses (unknown keys are
  refused), i.e. it would break the very sessions it exists to protect until a
  canary reinstall lands. The key stays optional and fully owner-configurable
  (`enabled`, `mode`), documented and changeset-carried.
- **D4** — 2026-11-17, the grep rule is **positional**: a segment that follows a
  pipe is a filter (`rg -v` reads stdin the same way) and passes untouched; a
  grep that is not pipe-fed and names a path operand or a recursion flag is
  search and is intercepted. The measured corpus (E1) is what makes this
  necessary: 18 of the 31 `grep` segments in the audited sessions are filters
  (`-v`/`-c` behind a pipe, or operand-less readers of stdin) and only 13 are
  search.
- **D5** — 2026-11-17, `node --test` and `node scripts/run-root-suite.mjs` are
  sanctioned forms (S3 says so, and AGENTS.md's runtime convention makes node the
  guaranteed fallback), so the carrier never touches them; the bootstrap pair is
  sanctioned because `setup-env.mjs` provisions bun.
- **D6** — 2026-11-17, the allowlist's home is the crate, not the schema package:
  the crate has no build step and both consumers already resolve it
  (`scripts/*.mjs` import crate `.mjs` directly; the pi package depends on
  `@gtrabanco/agentic-workflow`), so the gate reads committed source with no
  `dist/` dependency — the same reason `normative-drift` parses source.

- **E1** — 2026-11-17, the measured drift corpus extracted from the three audited
  authoring sessions (`~/.pi-web/archived-sessions/*01a1e8b0*|*01a1e91d*|*01a1e95e*.jsonl`,
  `message.content[].toolCall.arguments.command` for the `bash` tool) · exit 0 ·
  403 bash calls → **31 `grep` segments (13 search-shaped, 18 filters)** and
  **15 `node` segments, 0 sanctioned**; 33 de-duplicated segments frozen as
  `packages/agentic-workflow/test/fixtures/tool-choice-corpus.json`. Scratch
  script removed after the run.
- **D7** — 2026-11-17, three acceptance checks corrected before any status was
  flipped, because the frozen wording could not be satisfied as written: `AC-S1`
  and `AC-S2` named counts a multi-line match makes wrong, and `AC-S4` grepped
  the document that carried the check (a self-match). The corrected checks grep a
  *different* file than the one carrying the claim, and each was run before the
  flip (E15). No criterion changed meaning.
- **D8** — 2026-11-17, `test/default-inherit.test.mjs` updates its exhaustive
  `DEFAULT_CONFIG` literal with the new `toolChoice` key. The assertion stays
  exhaustive — the shipped default *did* change, and the test's job is to state
  it; nothing was relaxed or removed.
- **P1** — 2026-11-17, the crate policy module, the availability reading and the
  suite that fixes the corpus red → green · `aaa3ca12`.
- **E2** — 2026-11-17, `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs`
  at the cut head, before the module existed · exit 1 ·
  `Cannot find module '../src/tool-choice/policy.mjs'` (the frozen corpus was red
  first).
- **P2** — 2026-11-17, the drift gate imports the shared allowlist, its prose
  exemption derives from the same keys, and the parity suite pins the two layers
  · `aaa3ca12`.
- **E3** — 2026-11-17, `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs`
  · exit 0 · `20 pass, 0 fail` (`F1`–`F20`: the classifier, the forwarding
  tables, the corpus replay `8 + 7 + 18`, the availability reading and the type
  projection).
- **E4** — 2026-11-17, the gate's previous behaviour · exit 0 ·
  `bun test scripts/invocation-drift.test.mjs` → `13 pass, 0 fail`;
  `bun scripts/invocation-drift.mjs` → `verdict: PASS` (4 usage strings · 135
  skill files · 23 tutorial docs · 2 guides · 2 turn contracts, the same allow
  rows as the cut head).
- **E5** — 2026-11-17, `bun test scripts/tool-choice-parity.test.mjs` · exit 0 ·
  `4 pass, 0 fail` (`F28` identity of the shared map, `F29` the sanctioned-form
  subset with the root-suite leg as the declared widening, `F30` no re-declared
  literal in the gate, `F31` the gate's own scan still clean).
- **P3** — 2026-11-17, the carrier module, the `pi.toolChoice` section with its
  committed descriptor, and the wiring in the existing `tool_call` handler
  · `304429f9`.
- **E6** — 2026-11-17, the carrier suite against the **unwired** handler · exit 1
  · `F26` and `F27` red (`grep`/`node` calls passed through untouched), the
  module-level cases green.
- **E7** — 2026-11-17, `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs`
  after the wiring · exit 0 · `9 pass, 0 fail` (`F20`–`F28`).
- **E8** — 2026-11-17, `bun test packages/pi-agentic-workflow/test/config-extension.test.mjs`
  · exit 0 · `2 pass, 0 fail` — the descriptor was regenerated from the built
  module (`node -e` over `dist/config/extension.js`), never hand-edited — and
  `bun test test/config-extension.test.mjs test/config-schema-passes.test.mjs` →
  `12 pass, 0 fail`.
- **E9** — 2026-11-17, `cd packages/pi-agentic-workflow && bun run test` · exit 0
  · `965 pass, 0 fail` across 85 files.
- **E10** — 2026-11-17, `cd packages/agentic-workflow && bun run test` · exit 0 ·
  `1071 pass, 0 fail` across 58 files.
- **P4** — 2026-11-17, the declared surfaces: the restated `invocation-drift`
  row, the carrier's own row, the `normative-surfaces@1` row, the package README
  section, the unit doc with its ledgers and this roadmap registration
  · `6b3edea6`.
- **E11** — 2026-11-17, `bun scripts/prose-gate-inventory.mjs` · exit 0 ·
  `verdict: PASS` (the new row resolves, every `*-parity.test.mjs` suite is
  cited, every declared surface is claimed) and
  `bun test scripts/prose-gate-inventory.test.mjs` → `22 pass, 0 fail`.
- **E12** — 2026-11-17, `bun test scripts/normative-drift.test.mjs` · exit 0 ·
  `21 pass, 0 fail`.
- **E13** — 2026-11-17, the prose and structural gates · all exit 0 ·
  `node --test scripts/residue-dimensions.test.mjs` → `30 pass, 0 fail`;
  `bun scripts/red-first.mjs` → `verdict: PASS` (0 findings, 56 pairs);
  `bun test scripts/structural-sibling-pins.test.mjs` → `8 pass, 0 fail`;
  `bun scripts/skill-lint.mjs` → `verdict: PASS` (105 files, 0 findings).
- **E14** — 2026-11-17, `bun scripts/docs-generate.mjs --check` → `verdict: PASS`
  (3 files, 0 stale, roadmap unchanged) and `bun scripts/promise-coherence.mjs`
  → `verdict PASS` (`42 checked · 24 skipped`; the per-document run reports
  `0 checked · 9 skipped`, every skip named — this unit's validators are suite
  runners this pass never executes).
- **E15** — 2026-11-17, the acceptance checks · all as declared ·
  `rg -n 'from "../doctor/probes.mjs"' packages/agentic-workflow/src/tool-choice/availability.mjs`
  → 1 match; `rg -c 'process\.env\.PATH' packages/pi-agentic-workflow/src` → no
  match; `rg -c 'domain-separation exception' packages/pi-agentic-workflow/README.md`
  → 1; `rg -c 'DOMAIN_SEPARATION\.md' packages/pi-agentic-workflow/README.md` → 1;
  `rg -c 'spawn-provenance' packages` → no match; `rg -n 'toolChoice' docs/workflow/CONFIG.md`
  → 1 match.
- **D10** — 2026-11-17, the dogfooding vehicle for this unpublished delivery: a
  canary build of **this worktree's** extension
  (`packages/pi-agentic-workflow/dist/extension/index.js`, built by `bunx tsc`)
  armed through a scratch agent directory's `settings.json` — not a published
  canary. The host's installed canary (`@gtrabanco/pi-agentic-workflow@5.0.0-canary.20261117.2`)
  predates the carrier and registers the same tool names, so loading both is a
  tool conflict; the scratch agent dir keeps everything identical between the two
  runs except the carrier. The published canary cut + `pi install` refresh is the
  owner's post-merge step (`O14`).
- **E16** — 2026-11-17, the AC4 capture, in this order · exit 0 · scratch
  workspace `/tmp/aw610-ac4-*` (removed after the run), model
  `nan/deepseek-v4-flash`, one prompt per pair, `--no-skills --no-context-files
  --no-mcp`:
  * **before** (carrier absent) — `s1`: `grep -rn 'lighthouse' .` + `grep -rl 'harbor' .`
    in one call and `grep -rn 'harbor' . | grep -v '^./.git/'` in the next →
    **3 search commands, 3 `grep`, 0 `rg`**; `s3`: `node -p "require('./package.json').version" && node -v`
    → **1 `node`-as-default, 0 `bun`**.
  * **after** (the same extension, carrier armed) — `s2`: two `grep` calls
    **blocked** with `` `grep` as search is not the repo's tool choice (owner: AGENTS.md §Runtime convention; #269 owns the `rg`-first default). Equivalent: `rg -n 'lighthouse' . 2>/dev/null`. ``
    and the `(1 more in this command.)` variant, then the model re-ran both as
    `rg -n` / `rg -l` → **2 `rg` searches executed, 0 `grep`**, no human
    correction; `s4`: the `node -p` call **blocked** with
    `` `node` is the fallback runtime (owner: AGENTS.md §Runtime convention). Run: `bun -p "require('./package.json').version"`. The sanctioned forms — `node --test <paths>`, `node scripts/run-root-suite.mjs`, the bootstrap pair — stay untouched. ``
    and the model re-ran it as `bun -p`, leaving `node -v` untouched.
  * Drift rate: **before 4/4 commands chose the fallback tool; after 0/3 chosen
    (2 blocked attempts re-run with the preferred tool)**.
- **P9** — 2026-11-17, verification: the package gates, the root gate and the
  docs projection.
- **E17** — 2026-11-17, `node scripts/run-root-suite.mjs --jobs 1` · exit 0 ·
  `119/119 PASS`, the whole deterministic gate. Disclosed: two earlier runs on
  this box's load (average 9.0 on 6 CPUs, other sessions working) reddened two
  suites on **time**, never on assertion — `scripts/unit-route.test.mjs`
  (`F7 linear scan took 691ms, expected <500ms`) and
  `scripts/phase-lint.test.mjs` (120 s suite bound). Both are green alone and in
  the serialized run: `node --test scripts/unit-route.test.mjs` → `64 pass, 0
  fail` (`F7` 430 ms); `node --test scripts/phase-lint.test.mjs` → `162 pass,
  0 fail` (96 s). Neither suite is touched by this unit.

- **G1** — 2026-11-17, HEAD 2d3b48560aa72a02e764eb907bf25c23fa2a2f35, `bun scripts/dimension-regression.mjs --base 9de62e1c` · exit 1 · `evidence | none` → `finding — missing-reverification-evidence` (the range touches one review surface, `docs/workflow/GATE_INVENTORY.md`; the re-run after this line lands is the clean receipt — the 17 dimensions are unchanged at the base and at the head, so nothing was dropped).
- **E18** — 2026-11-17, `bun scripts/local-gate.mjs --jobs 2` · steps 1–12 PASS
  (`workspace-install`, `version-parity-content`, `docs-generated-projection`,
  `log-immutability`, `secret-scan`, `schema-build`, `temp-hygiene`, `tmp-gc`,
  `worktree-guard`, `root-suite`, `journal-carrier-check`, `rigidity-review`),
  then **`dependency-pin-gate` FAIL on pre-existing registry drift**
  (`pi-extensible-workflows` pinned 6.3.0, 6.4.0 published — no manifest in this
  unit touches it, recorded under `## Known pre-existing issues`). The
  fail-fast stopped steps 14–19; `pi-node-compat` was run on its own —
  `cd packages/pi-agentic-workflow && bun run test:node` → `964 pass, 0 fail, 1
  skipped` (the deleted-skill skip), the node compatibility leg green and
  unpunished.

## Next

The owner's external verify. Then the PR (`Closes #610`), then the published
canary cut + `pi install` refresh that puts the carrier into the owner's own
sessions (`O14`).

## References

Issue [#610](https://github.com/gtrabanco/agentic-workflow/issues/610); the
transposed pattern is #555's (`skills/runner-contract/references/RUNNER.md`
`runner-set@1`); the prose home is `AGENTS.md` §Runtime convention (#269 owns the
`rg`-first default); the prior drift rounds are `docs/fix/329-runtime-invocation-drift/`;
the routed scope is #611. `Closes #610` goes in the PR body.
