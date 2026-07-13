# 17 — finding-severity-routing · architecture-notes

Layer impact, ownership, and contract surfaces. No application runtime — the
"architecture" is the **skill-boundary graph** + the machine-envelope contract.

## Ownership map (one owner per edge)

| Surface | Owner (writes) | Readers | Files |
|---|---|---|---|
| `review-findings.md` ledger — create + append rows | `review-change`, `audit-pr` | `execute-phase`, `workflow-status` | `docs/**/<unit>/review-findings.md` |
| ledger `folded: no → yes` (sole state transition) | `execute-phase` fold cycle | `workflow-status` | same |
| `findings.fix_now[]` structured item (stateless projection) | `workflow-status` | orchestrator / driver / human | `skills/workflow-status/SKILL.md` |
| `suggested_tier` derivation (mechanical) | `workflow-status` | — | same |
| `EnvelopeFixNowFinding` type + JSON schema | schema package (mirrors `workflow-status`) | `validateEnvelope()` | `packages/agentic-workflow-schema/src/index.ts`, `.../envelope.schema.json` |

## Ledger artifact

- Location: `docs/features/<NN>-<slug>/review-findings.md` (features);
  `docs/fix/<n>-<topic>/review-findings.md` (fixes).
- Fixed schema: `| id | file:line | axis | severity | class | route | folded |`.
- `id` stable per finding (`F1, F2, …`); rows never deleted (`folded: yes` is
  terminal — the ledger ships with the merged unit as its audit record, like
  `known-issues.md`).
- Fix-now only; non-fix-now stays with `triage-issue` (`known-issues.md` / issue /
  `decisions.md`) — two distinct lifecycles kept apart (D1).

## Envelope contract change (breaking)

- **Before:** `EnvelopeFixNowFinding = {ref, title, file?}`
  (`src/index.ts:90`, `envelope.schema.json:84`).
- **After:** `{id, file, axis, severity, class, route, suggested_tier}`.
- This is a **breaking item-shape change** → schema package version bump +
  `validateEnvelope()` field-check update + tests, **same PR** (repo Verification
  rule). `next.tier` and every other envelope field are untouched.
- No known external consumer today (the envelope is driver-internal), but the
  version bump signals the break regardless.

## `suggested_tier` derivation (fixed, mechanical — no judgement)

```
strong  IF severity == high
        OR axis ∈ {security, correctness, logic, architecture, design, concurrency}
cheap   otherwise
```

Reuses `next.tier`'s `strong`/`cheap` vocabulary (`skills/workflow-status/SKILL.md`
:305-319). Conservative by CLAUDE.md's `≥` rule (over-power harmless, under-power
is the regression). Lives as a checklist in `workflow-status/SKILL.md`.

## Reuse, not new mechanism

- Dedupe: `review-change`'s existing `file:line`+axis merge rule (`SKILL.md`
  :225-227).
- Fold tick: one new box in `execute-phase`'s existing fold-cycle checklist
  (`SKILL.md:404-424`) — no new section, no new lifecycle.
- Read-only surfacing: same pattern as `open_prs[].ci` / `pending_triage[].title`
  (`workflow-status` surfaces an artifact a writer owns).

## Invariants (must hold across all phases)

1. `workflow-status` writes nothing — read-only, no judgement, no repair.
2. `next.tier` behaviour unchanged (single tier for the homogeneous next command).
3. Non-fix-now findings are not persisted to this ledger.
4. `folded: no → yes` is the only transition, owned only by `execute-phase`.
