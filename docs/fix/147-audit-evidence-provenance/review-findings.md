# Review findings — fix/147-audit-evidence-provenance

Fix-now fold ledger. `audit-pr` blockers are fix-now by definition (merge is
gated on them); `execute-phase`'s fold cycle / `fold-findings` is the only step
that flips `folded` to `yes`.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | docs/fix/147-audit-evidence-provenance/SPEC.md:459 | Docs | high | fix-now | execute-phase | yes |
| F2 | docs/fix/147-audit-evidence-provenance/SPEC.md:177 | Docs | high | fix-now | execute-phase | yes |

## Evidence notes

- **F1** — `## Status` still carries the raw template legend
  `` `pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge) ``
  (byte-identical to `docs/fix/_TEMPLATE/SPEC.md`). Every other fix SPEC resolves it
  (`docs/fix/119-…/SPEC.md`, `docs/fix/117-…/SPEC.md`, `docs/fix/100-…/SPEC.md` → `done`);
  the correct value here is `done` per `docs/fix/README.md:17` and this unit's
  `progress.md` terminal close-out.
- **F2** — the four `### Spec-lint` boxes at SPEC.md:177, :180, :181, :183 are unticked,
  while all four pass on evidence: placeholder grep `grep -nE '<(topic|n|task|command|expected)'`
  → no match; `### Out of scope` carries 4 concrete bullets; every AC row is command-validated
  (`ACCEPTANCE.md` — "read-verified rows: none"); phase-lint PASS (8/8) recorded for P1–P4.
  Sibling units tick these boxes (`docs/fix/119-…/SPEC.md:3-9`, `docs/fix/134-…/SPEC.md`).
  One row covers the block.
