---
type: feature
scope: medium
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
- **Roadmap:** row 436's status and summary note were written through the
  crate's receipted writers (`rowUpsert`/`annotate`, commit `465d5e00`) —
  never a raw hand edit; the deterministic sync keeps the row verbatim, so no
  override applies (the unit is fix-kind while the row sits in the Features
  table, and this unit declares no `roadmap_summary:` — external-verify B3);
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
  at the red commit)
  (Implements: S2, S5, S6, S7)
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
  no-profile output byte-identical)
  (Implements: S3, S5, S6)
  Relevant files: scripts/catalog.json, scripts/unit-route.mjs, scripts/ceremony-profile.test.mjs
- P4 — Skill prose: `init-workspace` authors the block at charter time;
  `unit-lane` steps + `execute-phase` preflight record the profile receipt as
  a valid route; `product-audit` dimension tie-in names the piece
  (validator: `bun scripts/skill-lint.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs --routes` exits 0)
  (Implements: S2, S4, S6)
  Relevant files: skills/init-workspace/SKILL.md, skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/unit-lane/references/STEPS.md, skills/execute-phase/SKILL.md, skills/product-audit/references/AUDIT_DIMENSIONS.md
- P5 — Registration + docs: `normative-surfaces@1` rows, vocabulary-parity
  pins, schema README grammar block, changeset, roadmap row via the crate's
  writers, projection via the emitter, `docs/LOGS.md` entry (validator: `bun test scripts/normative-drift.test.mjs`
  exits 0; `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7)
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
- **E5** — 2026-11-11, `bun test scripts/ceremony-profile.test.mjs` · exit 1 on the unmodified router (red corpus observed) · commit `f9d09b86`; green after the router check: 8 pass / 0 fail.
- **E6** — 2026-11-11, differential (§6): `bun scripts/unit-route.mjs --triage 436-ceremony-profile` and route mode on a git-archive base copy (`768aaab6`) vs the change · stdout and stderr byte-identical both modes; `scripts/catalog.test.mjs` 16 pass / 0 fail.
- **E7** — 2026-11-11, `cd packages/agentic-workflow-schema && bun test test/*.test.mjs` · 849 pass / 0 fail (final run, includes the 13-case ceremony-profile corpus and the derivation pin).
- **E8** — 2026-11-11, `bun scripts/skill-lint.mjs` · 0 findings · verdict PASS; `bun scripts/check-skill-context.mjs` · PASS 29 skills; `--routes` · PASS 14 routes (after the declared execute-phase re-basis); `--documents` · PASS 4 documents (after the AGENTS.md machineLines re-pin to 133).
- **E9** — 2026-11-11, `bun test scripts/product-audit-rescope.test.mjs` · 16 pass / 0 fail — the #440 consumer contract preserved (O11).
- **E10** — 2026-11-11, `bun test scripts/normative-drift.test.mjs` · 21 pass / 0 fail (four new inventory rows resolve); `bun scripts/prose-gate-inventory.mjs` · verdict PASS (the gate-inventory row claims the new surfaces).
- **G1** — 2026-11-11, `bun scripts/local-gate.mjs --jobs 4` · exit 0 · **PASS — 17/17 steps** (after four gate-found repairs, all committed: the unfenced changeset frontmatter `445b099d`, the AGENTS.md machineLines re-pin `c81c6864`, the gate-inventory claims + literal export order `53da6b07`, the lineage/sensor sandbox import graphs `d333cda1`).
- **P1** — 2026-11-11, ledgers frozen (SPEC + planning-evidence + planning-obligations + decisions) · `827670be`.
- **P2** — 2026-11-11, schema contract red `f1dd440f` → green `768aaab6` (+ corpus completion `13cf2528`).
- **P3** — 2026-11-11, dispatcher/catalog check red `f9d09b86` → green `91b9614b` (runtime module, catalog declaration, router receipts, no-expansion refusals, fail-closed block).
- **P4** — 2026-11-11, skill prose: charter authoring, receipt routes, audit tie-in, execute-phase route re-basis · `a53fa7e5`.
- **P5** — 2026-11-11, registration + docs: normative-surface rows, README grammar block, parity pins, gate-inventory claims, changeset, roadmap row via `rowUpsert`/`annotate`, projection regenerated · `465d5e00`.
- **P6** — 2026-11-11, gate-found repairs: fenced changeset `445b099d`, machineLines re-pin `c81c6864`, registration gate-resolvability `53da6b07`, sandbox import graphs `d333cda1`.
- **P7** — 2026-11-11, owner directed the PR: branch pushed (`origin/feat/436-ceremony-profile-1` at `679e4e4c`), [PR #515](https://github.com/gtrabanco/agentic-workflow/pull/515) opened against `main` (`Closes #436`).
- **E11** — 2026-11-11, correction batch #1 red corpus (external-verify B1/B4): `cd packages/agentic-workflow-schema && bun run test` at `7d7fa096` · exit 1 · **849 pass / 1 fail** — `AssertionError: published refusal empty-block is unreachable — no input produces it`; the AC5 prose pin's failure mode proven on a stripped `mktemp` copy of the two skill files (receipt sentence removed → both assertions fail, exit 1); green after `bf7fe5c9`: 850 pass / 0 fail.
- **E12** — 2026-11-11, green after `bf7fe5c9`: `bun run test` (schema) 850/0 · `bun test scripts/ceremony-profile.test.mjs` 9/0 · `scripts/vocabulary-parity.test.mjs` 21/0 · `scripts/normative-drift.test.mjs` 21/0 · `scripts/catalog.test.mjs` 16/0 · `rg '"empty-block"' packages/agentic-workflow-schema/src scripts/ceremony-profile.mjs` → 0 (full symbol: both published copies + dead `sawLine` branch).
- **E13** — 2026-11-11, O7's required-evidence quote (advisory A2 closed): `skills/init-workspace/references/BOOTSTRAP_WRITE.md:24-31` reads verbatim “The ceremony-profile seed lands there too as the machine-readable block the dispatcher checks in code (issue #436)”; `skills/execute-phase/SKILL.md` reads “record the step in Evidence as `n/a — <the receipt verbatim>`”.
- **E14** — 2026-11-11, §6 differential vs pre-batch head `1830d326` (git-archive + built dist in `mktemp -d`, removed after): no-profile `--triage`/`--json` on 440 → stdout/stderr/JSON **byte-identical**; profiled probes per guide — bare marker exit 0 “Profile: 0 applied, 0 refused”, malformed exit 2 `CEREMONY PROFILE ERROR`, docs-discard exit 0 with the skip receipt — identical exit and output at both trees; the `empty-block` retirement is observationally silent.
- **E15** — 2026-11-11, O2's refusal case names, each produced by its corpus input in the new reachability case: `bad-contract-id`, `malformed-line`, `unknown-piece`, `duplicate-piece`, `unknown-adoption`, `unknown-review-surface`, `empty-review-passes` — 7/7 published values reachable, `empty-block` retired (`rg` → 0), README's named refusal set == the export (7, `rg -c 'empty-block' README` → 0).
- **E16** — 2026-11-11, B2/B3 reproducers closed: `rg 'Implements: S1\b' SPEC.md` → 1; `rg 'roadmap_summary' SPEC.md` → only the amended Impact sentence (no frontmatter, no task claim); the old Impact phrase → 0; O2/O12 rows 9 cells each; `normative-drift` 21/0 and `docs-generate --check` PASS after the frontmatter drop. **Retraction:** B3's receipt sub-claim “`rowUpsert` … exists nowhere in the tree” was wrong — the evidence line was corrupted by an accidental `rg -r` (replace) flag; `rowUpsert` exists (`packages/agentic-workflow/src/edit/Roadmap.mjs:133`) and P5's log line stands unchanged (recorded in the receipt's addendum).
- **E17** — 2026-11-11, advisory dispositions (correction batch #1): **A1** not fixed — pre-existing at base, allowlisted at 30s in `scripts/test-timeout-allowlist.json`, gate-green; **A2** closed (E13); **A3** not fixed — the roadmap cell is curated/hand-owned and the only writers append (`annotate`) or re-emit whole rows (`rowUpsert`); rewriting quoted issue prose is the owner's call — reported, not done.
- **G2** — 2026-11-11, `bun scripts/local-gate.mjs --jobs 4` · exit 0 · **PASS — 17/17 steps** at the correction head (`d12938bc`), working tree clean before and after; O6/O7 validators re-run: `skill-lint` PASS, `check-skill-context` PASS 29 skills / 14 routes / 4 documents, `red-first` PASS.
- **E18** — 2026-11-11, in-batch loop #2 (same symbol as B2): `bun scripts/phase-lint.mjs docs/fix/436-ceremony-profile/SPEC.md` was BLOCKED **at the pre-batch head too** (`task-link-missing: P1/P3` + `spec-unlinked: S1`) — `IMPLEMENTS_LINK` (`scripts/unit-doc-phases.mjs:33`) anchors a whole trimmed line, so P1/P3's inline links never registered (B2's grep read text, not the parser). The two links are reflowed onto their own lines — words unchanged, P2/P4/P5 already conformed; `spec-unlinked: S1` cleared by B2's P5 annotation; phase-lint now `verdict PASS` (exit 0), fingerprint unchanged `b7bbd57b…`.
- **G3** — 2026-11-11, final gate at the batch tip `f36b35e4`: the first attempt reported `local-gate: FAILED at root-suite` — **transient, not reproduced**: `bun scripts/run-root-suite.mjs --jobs 4` standalone · exit 0 · 104/104 PASS (every suite), then `bun scripts/local-gate.mjs --jobs 4` re-run · exit 0 · **PASS — 17/17 steps** in 216s, working tree clean after both runs. Disclosed rather than hidden; no suite change was made between the attempts.

## Next

Correction batch #1 applied against `external-verify.md` (4/4 blockers fixed; A2 closed opportunistically; A1/A3 triaged not-fixed with reasons in E17). Owner **delta** external verification: re-check the four blockers' reproducers at the correction head — the receipt's dated addendum retracts one B3 sub-claim — plus the §9 recheck evidence (E11–E17, G2). No self-approval. Then push/PR #515 update as the owner directs.

## References

- Issue [#436](https://github.com/gtrabanco/agentic-workflow/issues/436) (roadmap row 436) — closed by [PR #515](https://github.com/gtrabanco/agentic-workflow/pull/515)
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
