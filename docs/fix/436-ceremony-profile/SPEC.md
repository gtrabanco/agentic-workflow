---
type: feature
scope: medium
roadmap_summary: >-
  `ceremony-profile@1` — a versioned machine-readable block owned by the project
  charter declares which ceremony pieces the project pays; the dispatch/catalog
  path checks it in code and skips undeclared pieces with recorded receipts;
  anti-gaming is enforced in code (narrow-only, fail-closed).
---

# fix/436-ceremony-profile

> Applied with the owner's local unpublished workflow: ledgers frozen here (§5),
> RED tests before implementation (§2/§6), no lane machinery runs on this
> surgery (§4). The tier verdict is computed (`bun scripts/ceremony.mjs tier
> classify`, recorded in `## Risk tier`).

## Issue

`#436` — [NEW FEATURE: ceremony-profile@1 — piecewise ceremony adoption enforced by code, with an anti-gaming guard](https://github.com/gtrabanco/agentic-workflow/issues/436). The PR closes it via `Closes #436`.

## Specs

Requirements, each numbered `S#`, quoting the requester's words verbatim. S1 is
the session request; S2–S7 are quoted verbatim from issue #436's
`## Expected behaviour`, which S1 applies to this repository.

**S1 — Apply issue #436 to this repository.**
> Apply to this repository: issue #436

**S2 — Versioned machine-readable profile block, charter-owned (issue §Expected behaviour 1).**
> The profile block is a normative-surface grammar (registered in `normative-surfaces@1`, consistent with the repo's machine surfaces) written at charter time (blocked by the charter issue).

**S3 — Dispatcher/catalog check: skip with a recorded receipt, never emit, never error (issue §Expected behaviour 2).**
> `scripts/catalog.json` already carries the steps and `budget_tier`; the dispatcher/catalog check extends it: a step whose target surface is not declared by the profile is **skipped with a recorded receipt**, never emitted as a hand-off, never an error.

**S4 — Skill prose degrades gracefully; absence is a valid, recorded route (issue §Expected behaviour 3).**
> Skill prose degrades gracefully the same way (the receipt pattern of `n/a — reason` already in the SPEC template generalizes): a skill may reference a sibling pass conditionally on the profile, and its absence is a valid, recorded route — not a hard failure.

**S5 — Anti-gaming is code, not discipline (issue §Expected behaviour 4).**
> **Anti-gaming is code, not discipline**: the profile cannot be read by the model at run-time to expand ceremony ("now it decides we do the full review"); only the declared profile + the computed risk tier (feature 97) decide. The full adopter rides the machine gate; the minimal adopter pays its chosen slice and nothing else.

**S6 — One surface, piecewise, for project kinds beyond code (issue §Expected behaviour 5).**
> **Project kinds beyond code**: the same profile decides ceremony for prose-only projects (skill/docs authors) and scientific-document projects — one surface, piecewise; examples recorded in the profile rows (e.g. `docs-step`, `captures`, `a11y-pass`, `seo-pass`, `review-passes[]`, `publish-gate`, `test-policy`).

**S7 — Pruning by declared consumer (issue §Expected behaviour 6).**
> **Pruning by declared consumer** (the #307 rule, reversed): every ceremony element may exist because a charter answer or a tier pays it; elements neither names list as retire candidates at the next audit.

Issue `## Non-goals`, adopted as constraints (never requirements to implement):
> No softening of the #307 non-negotiables (external verifier, document verifier, curated AC/Evidence, Engram persistence).
> No runtime ceremony negotiation by the model.

## Acceptance criteria

One observable, testable criterion per requirement (frozen at cut; each names
the check that proves it):

- **AC1 (S2)** — `packages/agentic-workflow-schema` publishes the
  `ceremony-profile@1` contract: a contract id, closed piece/adoption/surface
  vocabularies, and a deterministic parser; the package suite proves it
  (`cd packages/agentic-workflow-schema && bun run test` exits 0).
- **AC2 (S2)** — the grammar is registered as a normative surface
  (`normative-surfaces@1` row in `AGENTS.md`) and the machine surface passes
  its gate (`bun test scripts/normative-drift.test.mjs` exits 0).
- **AC3 (S3)** — the catalog declares the step↔piece map and `unit-route.mjs
  --triage` moves a profile-discarded step out of `Steps` into `Skipped` with a
  recorded receipt, exit 0 (`bun test scripts/ceremony-profile.test.mjs`
  exits 0, case "discarded step is skipped with a receipt").
- **AC4 (S3)** — with no profile declared anywhere, `--triage` output is
  byte-identical to the pre-change behavior (differential check, §6; test case
  "no profile keeps today's block").
- **AC5 (S4)** — the consuming skill prose (unit-lane steps, execute-phase
  preflight) records a profile discard as `n/a — ceremony-profile@1: <piece>
  discarded by project charter`, a valid route and not an error (skill-lint
  and context budgets pass; prose pinned by test).
- **AC6 (S5)** — anti-gaming is enforced in code: a profile can only narrow
  (a `paid` declaration on a step the catalog already skips yields a
  no-expansion refusal receipt), the gate-bearing steps (`evidence`, `plan`,
  `implement`, `review`) are never profile-discardable, and a malformed block
  fails closed with a named diagnostic, exit 2 (test cases in
  `scripts/ceremony-profile.test.mjs`).
- **AC7 (S6)** — a minimal adopter fixture (prose-only project: every
  discardable piece discarded) triages without any error from a discarded
  piece — every omission is a receipt, exit 0 (test case "minimal adopter runs
  without errors").
- **AC8 (S7)** — the declared profile is machine-readable by deterministic
  code (the published consts + the router's receipts), which is the substrate
  the next audit's prune sweep reads; `review-passes` surfaces derive from the
  published `PASS_NAMES` vocabulary (schema test pins the derivation).

## Impact

- **Surfaces changed:** `packages/agentic-workflow-schema/src/ceremony-profile.ts` (new),
  `packages/agentic-workflow-schema/src/index.ts` (export),
  `packages/agentic-workflow-schema/README.md` (grammar block),
  `scripts/catalog.json` (`ceremonyProfile` declaration),
  `scripts/unit-route.mjs` (the dispatcher/catalog check),
  `scripts/ceremony-profile.test.mjs` (new),
  `AGENTS.md` (normative-surfaces rows),
  `skills/init-workspace/SKILL.md` + `references/BOOTSTRAP_WRITE.md` (profile authoring at charter time),
  `skills/unit-lane/references/STEPS.md` (receipt pattern),
  `skills/execute-phase/SKILL.md` (receipt pattern),
  `skills/product-audit/references/AUDIT_DIMENSIONS.md` (piece-name tie-in),
  `scripts/vocabulary-parity.test.mjs` (parity pin for the new vocabularies).
- **Callers:** `unit-route.mjs --triage` consumers (unit-lane, workflow-status sensor, relay
  legs) — additive only: the fixed line-prefix parsers read named lines, so a
  new `Profile:` line is invisible to them (the #434 fused-annotation pattern).
  The `--json` answer gains a `profile` key only when a profile is declared.
- **Existing consumers:** `product-audit`'s profile-aware scope (#440) already
  consumes a *declared* profile conditionally and runs every dimension when
  none is declared — preserved byte-for-byte (obligation O11).
- **Roadmap:** row 436's Summary cell updates through the unit doc's
  `roadmap_summary:` override via the deterministic sync — never hand-edited;
  the status cell is hand-owned (the status machine) and stays with the owner.

## Retirements

None — this unit only adds. Nothing it supersedes exists: no profile grammar,
no profile reader, and no profile prose are in-tree (`rg -c 'ceremony-profile'
— only #440's prose mentions and the roadmap row; all remain true: they
reference this contract by name and are satisfied by it). The empty answer's
reason: the change is purely additive substrate.

## Non-goals

- No softening of the #307 non-negotiables (external verifier, document
  verifier, curated AC/Evidence, Engram persistence).
- No runtime ceremony negotiation by the model; no model-readable profile
  expansion path.
- No JSON Schema artifact for the profile (decision D9: it is a fenced-text
  grammar validated by the parser; the published consts are the machine
  surface — the `doc-provenance` precedent carries its artifact because it is
  an orchestration payload, the profile is charter prose read at dispatch).
- No triage-issue/router-side integration beyond the catalog check (that is
  roadmap row 441's declared scope: "one ceremony-profile integration").
- No audit-side retire-candidate listing (S7's consumer is the next audit —
  this unit ships the machine-readable substrate it reads; obligation O10
  records the boundary).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood / contained / resumable`
- **Named high-risk item** — `none — not a high-tier unit`
- Verdict source: `bun scripts/ceremony.mjs tier classify --paths …` run
  2026-11-11 (recorded in `## Log`).

## Future

- **open — 2026-11-11** — piecewise ceremony for scientific-document projects
  (issue example) may want per-piece model tiers, not just paid/discarded;
  deferred until a real adopter asks.

## Future cost

- The `review-passes` surface set must stay aligned with `PASS_NAMES`
  (schema test pins the derivation; adding a review pass is a
  schema-const + parity-pin change in one PR).
- `scripts/catalog.json`'s `ceremonyProfile` declaration must keep its
  `stepPieces` map consistent with the piece vocabulary (router test pins it).

## Applicable tests

`packages/agentic-workflow-schema/test/ceremony-profile.test.mjs` (new corpus),
`scripts/ceremony-profile.test.mjs` (new corpus), `scripts/catalog.test.mjs`,
`scripts/vocabulary-parity.test.mjs`, `scripts/normative-drift.test.mjs`,
`scripts/product-audit-rescope.test.mjs` (consumer preserved),
`packages/agentic-workflow-schema` full suite.

## Known pre-existing issues

- `docs/ROADMAP.md` has no row for delivered-as-fix feature 440 (observed
  2026-11-11; `rg '^\| 440' docs/ROADMAP.md` → 0) — does-not-affect this unit
  (row 436 exists; 440's row lifecycle is the Fixes-table removal rule).
- `tsc` is not on `PATH` in this environment; the schema build runs through
  `bunx tsc` — affects the local commands only, not the change.

## Tasks

- P1 — RED: add `packages/agentic-workflow-schema/test/ceremony-profile.test.mjs` pinning the
  `ceremony-profile@1` contract (closed vocabularies, parser refusals,
  narrow-only resolution, `PASS_NAMES` derivation) and observe it fail on the
  missing module (validator: `cd packages/agentic-workflow-schema && bun run test` exits 1
  at the red commit) (Implements: S2, S5, S6, S7)
  Relevant files: packages/agentic-workflow-schema/test/ceremony-profile.test.mjs
- P2 — GREEN: implement `src/ceremony-profile.ts` (contract id, vocabularies,
  block parser, resolver) and export it from `src/index.ts`; suite green
  (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S2, S5, S6, S7)
  Relevant files: packages/agentic-workflow-schema/src/ceremony-profile.ts, packages/agentic-workflow-schema/src/index.ts
- P3 — RED then GREEN: add `scripts/catalog.json`'s `ceremonyProfile`
  declaration and the dispatcher/catalog check in `scripts/unit-route.mjs`
  (charter block read, skip-with-receipt, no-expansion refusal, fail-closed
  malformed, additive `Profile:` line + `--json` `profile` key), corpus
  `scripts/ceremony-profile.test.mjs` observed red first
  (validator: `bun test scripts/ceremony-profile.test.mjs` exits 0; differential:
  no-profile output byte-identical) (Implements: S3, S5, S6)
  Relevant files: scripts/catalog.json, scripts/unit-route.mjs, scripts/ceremony-profile.test.mjs
- P4 — Skill prose: `init-workspace` authors the block at charter time;
  `unit-lane` steps + `execute-phase` preflight record the profile receipt as
  a valid route; `product-audit` dimension tie-in names the piece
  (validator: `bun scripts/skill-lint.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs --routes` exits 0)
  (Implements: S2, S4, S6)
  Relevant files: skills/init-workspace/SKILL.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/unit-lane/references/STEPS.md, skills/execute-phase/SKILL.md, skills/product-audit/references/AUDIT_DIMENSIONS.md
- P5 — Registration + docs: `normative-surfaces@1` rows, vocabulary-parity
  pins, schema README grammar block, changeset, `roadmap_summary` sync via the
  emitter, `docs/LOGS.md` entry (validator: `bun test scripts/normative-drift.test.mjs`
  exits 0; `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S3, S4, S5, S6, S7)
  Relevant files: AGENTS.md, scripts/vocabulary-parity.test.mjs, packages/agentic-workflow-schema/README.md, .changeset/, docs/LOGS.md

### Planning evidence

M-sized unit: the ledger lives in [`planning-evidence.md`](planning-evidence.md)
beside this doc (never both).

### Obligations

M-sized unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) beside this doc.

## Triaged steps

> Pasted verbatim from `bun scripts/unit-route.mjs --triage 436-ceremony-profile`
> (2026-11-11; the machine's authoritative step list; the lane never re-derives
> it). The owner's local workflow (§4/§5) substitutes for the lane: the ledger
> freeze above is the plan, research/design/plan are consumed by it, and no
> Relay legs are dispatched on this surgery.

```text
TRIAGE — 436-ceremony-profile (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
Fused: design + plan — one investigate→orient→ask→decide pass, carriers separated (activity-fusion@1)
relay: bootstrap-needed — no packet at .pi-web/relays/436-ceremony-profile
relay-next: create .pi-web/relays/436-ceremony-profile/ (charter → docs/fix/436-ceremony-profile/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/436-ceremony-profile", leg: "1") · legs: 6 = 5 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-11, the request, verbatim:
  ```
  Apply to this repository: issue #436
  ```
- **E1** — 2026-11-11, `bun scripts/ceremony.mjs tier classify --paths …` · exit 0 · tier `standard`, no high-risk signals, task size understood/contained/resumable.
- **E2** — 2026-11-11, frozen-failure corpus search (`rg` across docs/*/planning-*.md, review-findings, external-verify for profile/ceremony failures) · exit 0 · no reproducer found — the corpus is empty; the regression corpus is the differential (no-profile behavior byte-identical).
- **E3** — 2026-11-11, `bun scripts/unit-route.mjs --triage 436-ceremony-profile` · exit 0 · 9 steps, `Skipped: none`, budget strong, fused design+plan (pasted under `## Triaged steps`).
- **E4** — 2026-11-11, `bun scripts/docs-generate.mjs --check` baseline · exit 1 (`docs/generated/units.md: stale`) with the unit folder removed → exit 0 (PASS) — the projection is at its fixed point at base; the drift is caused solely by this unit's own new folder and closes with the P5 regeneration.

## Next

Run the triage paste, then P1 (RED).

## References

- Issue [#436](https://github.com/gtrabanco/agentic-workflow/issues/436) (roadmap row 436, status `idea`)
- #435 (charter — CLOSED, the profile's author; the hard blocker is resolved)
- #440 (consumer precedent: profile-aware scope, consumption-side)
- #441 (router-side ceremony-profile integration — explicitly out of scope here)
- #307 (ODD-hybrid direction; non-negotiables preserved)
- `docs/research/papers-sweep-2026-11-02.md` (token-decision evidence cited by the issue)

## Branch

`feat/436-ceremony-profile-1`

## Depends on

None open — #435 (hard) is merged; #359/#307 are soft and non-blocking.

## Regression scope

- `--triage` with no profile declared: byte-identical block + `--json` answer
  (test: `scripts/ceremony-profile.test.mjs`, differential cases).
- Catalog-only behavior (no profile): `scripts/catalog.test.mjs` stays green.
- `product-audit` profile-aware scope (#440): every dimension runs when no
  profile is declared (`scripts/product-audit-rescope.test.mjs` stays green).
- Schema package: existing suites (`test/*.test.mjs`) stay green.
