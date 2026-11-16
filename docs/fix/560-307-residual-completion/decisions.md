# Decisions — fix/560-307-residual-completion

Owner decisions and process rulings this unit rests on. Appended-only: a later
correction is a new dated row, never an edit of the row it corrects.

- **D1 — 2026-11-16** — **D1 (tier-cost truth class) is settled, not amended.**
  The class already exists: `skills/pre-execution-review/references/LEDGERS.md:178`
  declares `tier-cost | docs/workflow/TIER_COST.md | pi-agentic-workflow:session-telemetry`,
  and `scripts/ledger-ownership.test.mjs:72-83,93-99` pins it as AC16's **eighth**
  class plus the exact file (never the whole `docs/workflow/` tree). It landed in
  `f4b23e60` (2026-11-03) with explicit user approval as AC16's third amendment;
  the `## Future` row that requested it (`docs/fix/383-measured-acceptance/SPEC.md:92`)
  was never settled, which is the residual gap. This unit settles that row and
  changes **no grammar**: the issue's "only admissible grammar change" is already
  in the tree. Evidence: PE-001, PE-002, E9, G4.
- **D2 — 2026-11-16** — **`gate-receipt@1` retired the review-local gate
  attestation.** The receipt entered with #409 / PR #491 (`d7b391b4`, publisher
  `78ac7c82`) and, in that same PR, replaced the place where `review-verify` and
  `audit-pr` used to claim the gate himself: `skills/review-verify/SKILL.md`'s
  "The project's verification gate ran in THIS review (type-check, tests, build
  per the project's declared commands) — paste exit status per command" and
  `skills/audit-pr/references/01_MERGE_GATES.md`'s plain "The project's gate
  passes …" row. Both now consume the content-bound receipt
  (`gate-receipt.mjs verify`; `missing`/`stale`/`invalid` routes to
  `gate-receipt.mjs run`, never a re-run from the review). Receipt-neutrality
  therefore held at entry: **one machine receipt in, one prose attestation out**.
  The `gate-ran@1` mark was **not** retired and must not be claimed: it is the
  unit's own `## Log` line (`GATE-RAN` · HEAD · commands · exit), a different
  carrier answering a different question (`skills/pre-execution-review/references/LEDGERS.md:253-260`).
  The `n/a` branch the issue offered is not needed: the retirement exists and is
  named. Evidence: PE-004, PE-005, E10.
- **D3 — 2026-11-16** — **Wall-clock stays gated.** Owner S4a (2026-11-03, quoted
  verbatim in #383 S4a) rules the session span false and the turn boundary
  honest; the issue's re-open condition — `model_ms`/`tool_ms` sampled across ≥3
  units per tier — is unmet because the ledger holds **0** rows (0 units on
  `passive`, `standard` and `high`, E3). Time therefore stays `model_ms`/`tool_ms`
  per turn and never becomes a span, a column or a gate. Evidence: PE-003, PE-009, E3.
- **D4 — 2026-11-16** — **The pre-sink historical half is permanently
  `insufficient-corpus`; the comparison runs forward-only.** An offline unit→commit
  mapping does exist — journal fragments carry the unit in the filename and a
  `Commits: <first>…<last>` range in the body (84 fragments in the carrier, E11) —
  but the comparison's currency is `tokens`, `turns`, `model_ms` and `tool_ms`,
  which only the metric sink records (`docs/workflow/TIER_COST.md:14-18`; #383 S7
  forbids a human- or model-typed value). The sink was born in `f4b23e60`, so no
  pre-sink unit can ever carry those cells: a mapping would yield only the
  derivable `changed_paths` and the tier the reader already re-resolves. The
  honest ruling is therefore the issue's second branch, recorded with its reason,
  and `#383`'s Future row 2 is settled accordingly. Evidence: PE-008, PE-009, E11.
- **D5 — 2026-11-16** — **This repository does not adopt `ceremony-profile@1`.**
  `AGENTS.md` carries no `## Project charter` section (`rg -c '^## Project charter'
  AGENTS.md` → 0) and no adoption block: its only `ceremony-profile@1` mention is
  the normative-surface registry row at `AGENTS.md:419`. Ceremony stays
  proportional by the **computed risk tiers** (roadmap row 97,
  `skills/execute-phase/references/risk-tiers.md`). Reasons: this repository's
  authoring path never routes through the profile reader (`unit-route`), so a
  block would change zero behaviour; an adoption block would be a new charter
  surface with no retired counterpart, against receipt-neutrality; and the
  mechanism's distribution target is a *target project* through `init-workspace`
  (`BOOTSTRAP_WRITE.md:24-26`). The absence is a valid, declared state — the
  parser answers `null` and every piece keeps the catalog default. Evidence:
  PE-010, PE-011, E8.
- **D6 — 2026-11-16** — **Roadmap row 436 settles to `done · [#515](https://github.com/gtrabanco/agentic-workflow/pull/515)`.**
  Issue #436 is `closed` (`2026-11-11T22:49:50Z`) and PR #515 is `merged`
  (`2026-11-11T22:49:48Z`); the row still read `planned` at cut. The status cell
  is the owner's to settle (the unit doc deferred it) and this decision does so.
  Only the status cell moves: the description cell's stale "No triage yet — …
  triage done — …" lead-in is fix #436's external-verify A3 advisory and stays
  byte-identical here (out of this unit's scope). Evidence: PE-012, PE-013, PE-019, E7.
- **D7 — 2026-11-16** — **Unit home is `docs/fix/560-307-residual-completion/` for
  a promoted feature issue.** The owner's local workflow §5 names this path
  explicitly, the branch is `fix/560-307-residual-completion`, prompt instructions
  outrank repo conventions, and in-repo precedent agrees (feature 436 delivered as
  `docs/fix/436-ceremony-profile/`, feature 500 as
  `docs/fix/500-declare-docs-site-block/`). The Features-table row 560 stays where
  it is and is settled through the crate's writer; the unit is carried by fix #560.
  Evidence: PE-012, PE-018.
- **D8 — 2026-11-16** — **A `passive` verdict and the workflow's unit-doc order
  coexist.** The classifier answers `passive` over this change's prose path set
  (`reason_kind: no-executable-effect`, E13), whose own contract says "no unit doc
  ceremony"; the owner's workflow §5 orders the unit doc and both planning ledgers.
  Instruction precedence resolves to cutting them, with the verdict recorded
  verbatim in `## Risk tier` and the readback in `## Log` — exactly the precedence
  fix #500 recorded (its `## Log` D2). No `docs/passive/` record is created beside
  it: one change, one carrier. Evidence: PE-017, PE-018.
- **D9 — 2026-11-16** — **Every index write goes through the crate's receipted
  writers** (`roadmap read` → `rowUpsert` / `fixrow`), never a hand edit: row 436's
  status, row 560's `in-progress · carried by fix #560`, and the `## Fixes` row.
  No `roadmap_summary:` override is declared: this is a fix-kind unit whose row
  lives in the Features table, so the emitter's kind-matched sync passes that cell
  through (fix #436's external-verify B3). Evidence: PE-012, PE-014.
- **D10 — 2026-11-16** — **D5's ruling has one home: this file.** The guide owns
  the normative-surface registry, never an adoption record, and fix 436's
  `decisions.md` stays the record of *that* unit's design; a second copy of this
  ruling would be the repetition the guide's ownership rule forbids. Evidence:
  PE-010; AGENTS.md §Working rules.
- **D11 — 2026-11-16** — **The session entry goes through the fragment door**
  (`journal write --kind narrative`), not a `docs/LOGS.md` append: with the
  fragment carrier opted in, `docs/LOGS.md`'s only legal writer is the merge
  aggregator, so a direct append would fail the push gate. Evidence: PE-016, E18.
- **D12 — 2026-11-16** — **The measurement is run, not rebuilt.**
  `scripts/tier-cost.mjs` is read and executed exactly as shipped: no column, no
  subcommand, no gate, no second tool; the honest output is the declared verdict
  (issue §Non-goals, #383 S7). Evidence: PE-003, PE-009, E3, E14.
