# External verify — fix/452-journal-fragment-validation

Receipts for the owner's external verification. Read-only pass: no commit, no
push, no forge mutation, no code edit; every mutating probe ran in `mktemp -d`
scratch, removed after.

## 2026-11-08 — full verdict (no prior receipt for this unit)

```text
EXTERNAL VERIFY — base: c7258644 · head: 2d980397
Blockers: 1 — B1 docs/fix/452-journal-fragment-validation/planning-obligations.md:39 (O26) + SPEC.md:460 (E8)
              reproducer: `rg -c '^\| 452 \|' docs/ROADMAP.md` → no output, exit 1 (0 matches) at the head,
              at the cut 95cde38a and at the base c7258644, because the row reads `| [#452](url) |` (docs/ROADMAP.md:168).
              E8 records "→ 1". The row's substance reproduces (row present, `bun scripts/roadmap-settle.mjs` PASS),
              but a `verified` row whose stated outcome does not reproduce is a blocker by the closure rule.
              Smallest action: point the validator at the row's real anchor (`^\| \[#452\]`) and re-record the count.
Advisories: 6 —
              A1 template/.agentic-workflow/journal.md:96 still names only `journal name` as the writer's path
                 (no `journal-write-grammar@1` / `journal write` pointer); the statement stays true, so it is
                 currency, not a lie. file:line: template/.agentic-workflow/journal.md:96
              A2 planning-obligations.md:31 (O18) describes "the fragment block gains the write and check rows";
                 the tree publishes a separate `journal-write-grammar@1` block and leaves the fragment block
                 unchanged. Substance verified (normative-drift 21 pass, surfaces 11 pass); the cell wording is wrong.
              A3 O20 (planning-obligations.md:33) asserts "no gate exception", while SPEC.md:445 (D5) records the
                 push used `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` on the pre-existing root-suite red (disclosed in
                 PR #459's "Gate status"). Disclosure exists; the row's own wording contradicts it, and the hatch
                 is the "self-granted gate exception" S12 forbids — owner decision, nothing to code.
              A4 D4/O20 claim the base export reproduces the root suite "identically": the two ceiling suites fail
                 identically in kind (same three AGENTS.md failures, +1 line at the head), but a plain
                 `git archive` export also reds the git-dependent suites (no `.git`), so only the ceiling pair compares.
              A5 `journal write` in a project without a carrier creates `.agentic-workflow/journal/` (observed in
                 scratch) — the writer flips the documented opt-in. Not forbidden by any claim; named for the owner.
              A6 PR #459's compact verification list reads `check-skill-context … exit 0` (true for the skills mode);
                 the `--documents` mode exits 1. The "Gate status" paragraph above it explains that red, so this is
                 a readability defect, not a false claim.
Sibling sweep: clean except A1 — no surviving "compute the name … save the entry bytes unchanged" (skill, extension
              directive, tests assert its absence); template journal.md:96 (A1) and the pi README's `journal name`
              bullet describe only the read-only naming service, which the unit explicitly keeps.
Completeness: S1–S18 all resolved — S1,S2→P5/P7/P11/P12; S3→P6/P7/P10/P15; S4,S4a→P9; S5→P8; S6→P6; S7→P7,P11–P15;
              S8→P18; S9→P1/P7; S10→P2/P3/P9; S11→P2/P18; S12→P18; S13→P1; S14→P2/P3/P4/P8; S15→P14,P16,P17,P18;
              S16→P18; S17→P1; S18→P18. Obligations O1–O27: all re-run green here except O26's numeric half (B1).
Spot check: bun test packages/agentic-workflow/test/journal.write.test.mjs → 14 pass / 0 fail (reported 14 pass) → match
Verdict: NEEDS-DECISION (B1)
```

Observed this pass (head `2d980397`, base `c7258644` exported to `mktemp -d`):

- `bun test packages/agentic-workflow/test/journal.write.test.mjs` → 14 pass 0 fail; `journal.test.mjs` → 26 pass;
  `journal.surfaces.test.mjs` → 11 pass at the head, **10 pass 1 fail at the base export** naming
  `20261108T121830Z-main-manual-narrative-local.md` (reachable only with the schema `dist` beside it — the export's
  own codec case needs that build, which is why a bare export also reds it).
- `bun test scripts/session-close.test.mjs` → 30 pass; `scripts/local-gate.test.mjs` → 41 pass;
  `scripts/release-workflows.test.mjs` → 24 pass; `scripts/normative-drift.test.mjs` → 21 pass;
  `bun run test` in `packages/agentic-workflow` → 467 pass 0 fail; `packages/pi-agentic-workflow` → 610 pass 0 fail.
- `scripts/skill-lint.mjs` PASS · `check-skill-context.mjs` (skills) PASS · `--documents`: no machine-table failure
  (AGENTS.md 116, GATE_INVENTORY.md 58) while the three ceilings fail at **both** ends (base 573/9639/458 > 477/9462/370,
  head 574/9664/458) · `prose-gate-inventory.mjs` PASS resolving `journal-carrier-check` at `scripts/local-gate.mjs:229` ·
  `roadmap-settle.mjs` PASS · `docs-generate.mjs --check` PASS · `phase-lint` PASS (`c04741e6…`) ·
  `unit-route 452-…` → `close-out` · `lint-changeset` ok · `journal aggregate --check` on this carrier → `checked 4, refusals 0`.
- Root suite at the head: exactly two reds, `check-skill-context` and `guide-split`, both on the pre-existing AGENTS.md
  ceilings (D4); the same two reds at the base export.
- Scratch probes (head export, throwaway repos): `journal write` field/stdin/mechanical writes land one conforming
  fragment and round-trip through `parseFragmentName`; the mechanical bytes equal `log render --raw` byte for byte;
  `--kind manual`, a non-`## ` body, `--name`, a contradicting heading and a collision are each exit 2
  `JOURNAL REFUSAL` with the target's bytes intact; `--check` lists two faults, exits 2 and moves no byte; `--check`
  with no carrier or only `.gitkeep` exits 0; `session-close close` refuses a malformed added fragment before staging
  (exit 1, nothing added, no commit) and commits a conforming one alone (exit 0).
- Differential against the base export: `session-close render` manual/auto/minimal, a bad `--base`, a missing
  `--summary` → byte-identical stdout/stderr/exit; `journal name` narrative/mechanical/bad-kind → identical;
  `journal aggregate` receipts, resulting `docs/LOGS.md` bytes and carrier cleanup → identical; `log render` refusal
  identical. The only intended difference is the router's refusal text now enumerating `aggregate`, `write` or `name`
  (same exit 2).

State note: the head advanced during this pass (`7d3a4ae8` → `2d980397`, three docs-only commits: PR open, row settle,
projection re-render, session entry). The code surface was verified at `7d3a4ae8`; the delta was re-checked
(roadmap-settle, docs-generate `--check`, phase-lint, changeset, carrier check, unit-route).
