# 435 — project charter · decisions

Append-only. One `D#` per decision taken while applying the owner's local
workflow (S1: "Apply to this repository: issue #435") to issue #435's promoted
feature unit.

## D1 — Carrier: unit doc + planning ledgers, not the passive readback (2026-11-07)

`bun scripts/ceremony.mjs tier classify --paths <planned paths>` at the cut head
(`e1d94057`) computes **`passive`** (verdict copied verbatim into the unit doc's
Risk tier section). The passive tier's default carrier is `docs/passive/<id>.md`
with **no unit doc** (`docs/fix/_TEMPLATE/SPEC.md` §Risk tier). The owner's
standing local workflow for this change — the frozen request S1 names it —
explicitly orders the other carrier: "Freeze the planning ledgers before the
first line of code … When it does not exist, create the unit doc from
`docs/fix/_TEMPLATE/SPEC.md`", and instruction precedence puts the explicit
prompt instruction above the repo documents. The unit doc + ledgers are
therefore cut (M-size → `planning-evidence.md` / `planning-obligations.md`
beside it), no `ceremony passive add` record is written for the same scope (the
two carriers are mutually exclusive, never both), and the computed verdict is
recorded, never hidden. Verification consequence unchanged either way: the
deterministic gate is the whole verification.

## D2 — This repository's own `AGENTS.md` is not rewritten into a charter (2026-11-07)

The unit ships the charter capability (template + `init-workspace` +
`audit-docs`). This repo's own guide predates the charter, already carries its
identity in the guide's own shape (stack-agnostic identity in §Identity-adjacent
prose, the deep-references table as its map), and the unit's Non-goals exclude
the re-cut — expanding scope to rewrite the guide would drag the
`#357` evidence rider and the documents-budget ceiling into a unit the issue
scoped to `init-workspace` first, template guidance second. The repo adopting
its own charter later is a separate, owner-routed change.

## D3 — Criteria catalogue is its own registered doc, not a charter paragraph (2026-11-07)

The verification-criteria catalogue (S9, S10) lands as
`template/docs/workflow/VERIFICATION_CRITERIA.md` with its own documentation-map
row, not as a paragraph inside `template/AGENTS.md`'s charter section. Reasons:
(a) S4's evidence-bound content rule (arXiv 2605.10039) orders content positioned
and sized per the documentation map, never one monolithic document — a
tabular, growing catalogue does not belong inline in the guide; (b) S6 requires
registered docs (map rows) so tier-0 provenance searches reach it — a map row
achieves that; (c) `audit-docs`' computed check (S12) can scan one declared path
mechanically. The charter section in the guide stays the identity layer + the
pointers, exactly the reachability surface.

## D4 — Home is `docs/fix/435-project-charter/` despite the `feature` label (2026-11-07)

The owner's workflow names `docs/fix/<issue>-<topic>/` as the unit home and the
repo holds ~12 precedents of issue-born feature units delivered exactly there
(roadmap rows 85, 88, 90, 92, 94, 95, 97, 98, 106: "Delivered as the fix unit
`docs/fix/<issue>-<topic>/`"). No question was needed: the state resolves the
sub-decision. The roadmap registration is a `## Fixes` row (the active-fixes
table), matching the folder's home.
