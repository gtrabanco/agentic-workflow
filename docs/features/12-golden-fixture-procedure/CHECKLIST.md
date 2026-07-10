# Checklist — 12 golden-fixture-procedure (single-pass)

- [x] Schema migration applied — n/a, no schema.
- [x] Core layer has no outer imports — n/a, docs-only change.
- [x] Orchestration idempotent + typed errors — n/a, no code.
- [x] Adapters implement ports — n/a, no code.
- [x] Tests pass — n/a, no code test layer (see Acceptance criteria run below).
- [x] Type-check/lint green — n/a, Markdown only.
- [x] UI strings localized — n/a, no UI.
- [x] Domain value-object rules respected — n/a, no domain code.
- [x] User-facing limitations disclosed — n/a, internal maintenance doc.
- [x] New deps pinned — n/a, no dependencies added.

## Acceptance criteria run (from SPEC.md)

All commands run from repo root against the working tree:

| # | Check | Result |
|---|-------|--------|
| 1 | `test -f docs/workflow/GOLDEN_FIXTURE.md` | PASS |
| 2 | `grep -qi "CSV export" docs/workflow/GOLDEN_FIXTURE.md` | PASS |
| 3 | `grep -qiE "weakest.*model\|Qwen3\.6\|Gemma4" docs/workflow/GOLDEN_FIXTURE.md` | PASS |
| 4 | `grep -qiE "Return exactly\|turn.contract\|PASS \| FAIL" docs/workflow/GOLDEN_FIXTURE.md` | PASS |
| 5 | `grep -qiE "\| *Date *\|" docs/workflow/GOLDEN_FIXTURE.md` | PASS |
| 6 | `grep -qi "GOLDEN_FIXTURE" docs/workflow/README.md` | PASS |
| 7 | `! ls docs/features/ \| grep -qiE "csv\|toy\|fixture"` | **literal FAIL, intent PASS — see note** |
| 8 | `! test -f template/docs/workflow/GOLDEN_FIXTURE.md` | PASS |
| 9 | Skills unchanged (`git diff --stat main -- skills/ template/` empty) | PASS (read-verified) |

### Note on criterion 7 (decision recorded here — single-pass has no `decisions.md`)

The literal command always fails for this unit: this feature's **own** folder
is `docs/features/12-golden-fixture-procedure/`, and `golden-fixture-procedure`
contains the substring `fixture` — the grep matches it regardless of whether a
*separate* stray toy-project tree exists. The invariant the criterion actually
protects — **no additional committed toy CSV-export/fixture folder** beyond
this feature's own planning folder — holds: `docs/features/` contains no
`csv`/`toy`-named folder and no second `fixture`-named folder. Verified by
inspection: `ls docs/features/` lists only the standing feature folders
(`01`–`12`) plus `_TEMPLATE` and `ROADMAP.md`; no toy/CSV/fixture-export
folder was added. Treating this criterion as satisfied by intent
(`read-verified`), not by the literal exit code, since the command as written
cannot distinguish "this feature's own name" from "a stray fixture folder."
