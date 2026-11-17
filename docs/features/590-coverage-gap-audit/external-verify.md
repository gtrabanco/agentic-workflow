# External verify — feature/590-coverage-gap-audit

2026-11-17 · **full verdict** — no prior `EXTERNAL VERIFY` block, `external-verify.md`
or review verdict exists for this unit (rg over `docs/` found receipts only for other
units), so this is the full verdict, once. Free-text intent `#604`
(<https://github.com/gtrabanco/agentic-workflow/pull/604>) is the owner's target
override: it selects this PR / this unit, waiving no check below.

**Binding.** unit dir `docs/features/590-coverage-gap-audit/` (SPEC.md + both planning
ledgers) · base `origin/main` → merge-base
`a370cc847a12b06f4147af8890c35d2a5650ca9e` · head
`0d5ce40767ff07978c6ad2f8df7efa874a33cab6` (10 branch commits). **Base ref moved
mid-run** (another session's fetch/pull: `a370cc84` → `3a5b76b4` → `b25ef8a9`); the
merge-base never moved, so the diff under verification is stable, and
`git merge-tree --write-tree origin/main HEAD` exits 0 (only the shared-roadmap driver
union `docs/ROADMAP.md`). PR #604 reports `mergeable: MERGEABLE`,
`mergeStateStatus: CLEAN`, `headRefOid` = this head.

```text
EXTERNAL VERIFY — base: a370cc847a12b06f4147af8890c35d2a5650ca9e · head: 0d5ce40767ff07978c6ad2f8df7efa874a33cab6
Blockers: 2 —
  B1 scripts/coverage-gap.mjs:336 and :338 (renderReceipt) vs docs/features/590-coverage-gap-audit/planning-obligations.md:14 (O2, status `verified`) and skills/product-audit/references/AUDIT_DIMENSIONS.md:114 (the registered `coverage-gap@1` grammar's `input` row) · reproducer: `D=$(mktemp -d) && git init -q "$D" && git -C "$D" -c user.name=v -c user.email=v@x commit -q --allow-empty -m i && mkdir -p "$D/docs/workflow" && cp template/docs/workflow/VERIFICATION_CRITERIA.md "$D/docs/workflow/" && bun scripts/coverage-gap.mjs --repo "$D"` → exit 0 with **two** `detectors |` lines (`detectors | 9 · gates 0 · passes 9 · consuming 0` then `detectors | gates absent · docs/workflow/GATE_INVENTORY.md`); O2 orders "one `detectors` line" and the grammar's `input` row orders "each line says present or absent with its path" — the first line is neither present-marked nor pathed (the present-case line has the same gap, and `corpus |` never prints a path at all) · base-vs-head: `git cat-file -e a370cc84:scripts/coverage-gap.mjs` → `exists on disk, but not in 'a370cc84'` — no emitter at base, so the defect cannot reproduce there · stability: quiet on every tree that carries an inventory (this repo's own dogfood run and the fixture's `seeded/`/`clean/` twins each print exactly one `detectors |` line) and quiet on every other script; the suite's absent-input cases assert the `catalogue |`/`corpus |` lines only, which is why `bun test scripts/coverage-gap.test.mjs` stays green (18/0) · smallest action: fold the absent marker into one detectors input line shaped like the other two carriers (`present|absent · <path> · …`) and pin the absent-inventory receipt shape in the suite → /aw-local-apply
  B2 skills/product-audit/references/AUDIT_DIMENSIONS.md:47 and :96–97, skills/product-audit/references/AUDIT_PROCESS.md:10 — the declared producer command `bun scripts/coverage-gap.mjs <repo>` does not run as printed · reproducer: `bun scripts/coverage-gap.mjs .` → `coverage-gap: unknown argument .` + `usage: coverage-gap.mjs [--repo <dir>]`, exit 2; `rg -c -- '--repo' skills/product-audit/references/AUDIT_DIMENSIONS.md skills/product-audit/references/AUDIT_PROCESS.md` → 0 matches (the working flag spelling appears nowhere in the reference), while the sibling command printed in the same section, `bun scripts/product-audit-gap-fixture.mjs <dir>`, takes its positional (exit 0), so nothing tells a reader the join differs; the unit's own E2 uses the working `--repo <dir>` form · base-vs-head: `git show a370cc84:<ref> | rg -c coverage-gap` → 0 in both references (and the script is absent at base), so the sentence and the parser are both change-caused and every producer pre-pass hits it · stability: quiet on flag-formed invocations, on the fixture line and on every other producer row in the reference · smallest action: print `bun scripts/coverage-gap.mjs --repo <dir>` at the three spots (or accept a positional) and re-run AC-3's prose-pin case → /aw-local-apply
Advisories: 4 —
  A1 docs/features/590-coverage-gap-audit/SPEC.md:118 (Impact, "What stops being true … (audit 2's recorded gap)"): `docs/audits/2-2026-11-16.md` records no such claim (`rg -n -i 'criteri|catalogue|charter|check 16' docs/audits/2-2026-11-16.md` → 0 relevant hits) — the claim actually lives at docs/research/2026-11-16-product-audit-extensibility.md:29 under its dated "Verified state at session time" heading. Why advisory: citation imprecision in Impact prose, no validator and no behavior depends on it, and the research note itself is a dated historical record this repo keeps as history (560 receipt precedent A5).
  A2 docs/features/590-coverage-gap-audit/SPEC.md ## Log (no `E` line, lines 296–320): the red-first rule (AGENTS.md) asks the Log to record both runs as `E` lines naming both SHAs; neither red commit (`de52a5c2`, `dd9b5901`) appears anywhere in the unit doc, `docs/LOGS.md` or the journal fragment. Why advisory: `bun scripts/red-first.mjs` → `PASS (56 pair(s) · 31 after the cutoff · 0 findings)`, and I re-observed both reds independently in `mktemp -d` scratch clones (`git checkout de52a5c2` → coverage-gap suite fails on the missing module; `git checkout dd9b5901` → dimension-regression suite fails) — the evidence exists, only its Log record is missing.
  A3 skills/product-audit/references/AUDIT_DIMENSIONS.md:137–146 vs skills/product-audit/SKILL.md:191: the new "Routes" list calls its three destinations "the `finding-route@1` hand-offs … no bespoke route is introduced", but that grammar orders `<verb> — <target>` from the closed set `continue | fix | review | audit | explain-state` and says "never a command invocation", while the three are a command (`agentic-workflow skills discover`), a skill (`/unit-lane`) and a doc path (`references/UPGRADE.md`) — the verb each gap's `route:` cell carries is left to the auditor's inference. Why advisory: the destinations are exactly the three the issue's own S3 text prescribes, the file already routes in destination terms (the Workflow discipline row), no gate fails and no output breaks — it is a shape/wording conflict, not a behavioral defect.
  A4 docs/features/590-coverage-gap-audit/planning-evidence.md:24 (PE-010, `freshness: current`): still reads `referenceEstimateMax 2743` for `AUDIT_DIMENSIONS.md`, while this change re-pinned it to 4179 (SKILL_CONTEXT_BUDGETS.json `referenceSources["issue #590 (coverage-gap audit)"]`, measured 3799 est). Why advisory: the ledger header states every `known` row is a sample taken at the cut (`e7df4b77`) and the ledger is frozen except `status`, and PE-010's own clause — "a reference-only growth re-bases `referenceEstimateMax` with a declared source" — is what shipped; no gate reads the number.
Sibling sweep: list — A1 (dated research note still asserts "no consumer in product-audit") and A4 (PE-010's cut-time ceiling) are the only surviving mentions; otherwise clean: `Audit process & docs` → 0 survivors, the `normative-surface-grammar` row's `surfaces` cell differs from base by exactly `coverage-gap-grammar` (column-7 diff), the budget pins' old values (`722`/`159`, `6734`/`74`, `2743`) survive only inside dated `sources` narratives and fix 440's Log (history), no dimension count is asserted anywhere but SPEC's own `17 head / 16 base`, `docs/workflow/SKILLS.md:134` and `README.md:131` product-audit rows stay true (they never enumerate dimensions), `docs/generated/code.md` gained all three new scripts, `docs/ROADMAP.md:176` `done · #604` matches FEATURE_WORKFLOW.md:213 ("PR opens, roadmap row → done"), both 2026-11-16 attribution rows flipped to `idea adapted` with #590 (`rg -c 'coverage-gap join'` → 2), RUNNER.md needs no row (crate launcher scope only) and CAPABILITIES' gates row names `local-gate.mjs` generically.
Completeness: S1–S12 resolved — every S# has a task carrying `(Implements: S#)` (P1–P7) whose validators re-run here (P2/P4's red validators reproduce red at their own red commits, green at head); S12 has its recorded disposition (D1: blocker #564 `CLOSED`, read from the forge — re-checked `gh issue view 564` → `CLOSED`). Obligations: O1, O3–O19 verified-green here; **O2 named — its stated outcome ("one `detectors` line") does not hold on the absent-inventory input (B1)** even though its validator exits 0.
Spot check: bun scripts/dimension-regression.mjs --base origin/main → match (reported G5 "exit 0 · verdict | clean · 17 dimensions head / 16 base · 5 review surfaces · evidence = this doc" reproduced exactly; only the printed base sha differs because origin/main advanced mid-run, b25ef8a at re-run)
Verdict: NEEDS-DECISION (open blockers: B1, B2)
```

## Declared verification commands re-run this run (command: observed)

- `bun test scripts/coverage-gap.test.mjs` → exit 0, **18 pass / 0 fail** (E1).
- `bun test scripts/dimension-regression.test.mjs` → exit 0, **10 pass / 0 fail** (E3).
- `bun test scripts/local-gate.test.mjs` → exit 0, **60 pass / 0 fail**;
  `bun test scripts/release-workflows.test.mjs` → exit 0, **26 pass / 0 fail** (E4).
- `bun test scripts/normative-drift.test.mjs` → exit 0, **21 pass / 0 fail**;
  `bun scripts/prose-gate-inventory.mjs` → `verdict: PASS`, 69 data rows, both new rows
  resolved (E5).
- `bun test scripts/ledger-ownership.test.mjs` → exit 0, **15 pass / 0 fail** (E6);
  `bun test scripts/product-audit-rescope.test.mjs` → **16 pass / 0 fail**;
  `bun test scripts/residue-dimensions.test.mjs` → **30 pass / 0 fail** (E7).
- `bun scripts/check-skill-context.mjs --documents` → exit 0, `AGENTS.md 723 / 160 /
  563 / 12987`, `GATE_INVENTORY.md 171 / 76 / 95 / 6899`; `--skill product-audit` →
  exit 0, `product-audit 3883 / 284 / 2 refs / 117` (G1; the per-reference `3799 est`
  line this mode does not print is corroborated by the manifest's own re-basis note).
- `bun scripts/lint-changeset.mjs .changeset/590-coverage-gap-audit.md` → `ok` (G3);
  `bun scripts/docs-generate.mjs --check` → `verdict: PASS`, 0 stale (G3);
  `bun scripts/run-root-suite.mjs` → **exit 0** (G2).
- `bun scripts/red-first.mjs` → `PASS`, 56 pairs / 31 after the cutoff / 0 findings.
- `bun scripts/version-parity-gate.mjs --content` → `VERDICT: PASS`.
- `bun scripts/product-audit-gap-fixture.mjs <mktemp>` → exit 0; `--repo <dir>/seeded`
  → `verdict | gaps 3` (one `criterion-uncovered`, one `class-uncovered`, one
  `detector-idle`), `--repo <dir>/clean` → `verdict | clean` (E2/AC-5).
- `bun scripts/coverage-gap.mjs --repo .` → `catalogue | absent`,
  `verdict | gaps 4` (workflow, docs, correctness, spec-drift) (E8).
- `bun scripts/dimension-regression.mjs --base origin/main` → exit 0 `verdict | clean`
  (G5); no `--base` → `not-applicable` exit 0; `--bogus` → usage exit 2;
  `--base` with no value → usage exit 2.
- `bun scripts/local-gate.mjs --only dimension-regression --push-base a370cc84 --jobs 1`
  → `local-gate: PASS — 1 step(s)`, exit 0; same with `--remote origin` (AC-8).
- `rg -c 'coverage-gap join' docs/research/ATTRIBUTION.md` → `2` (AC-13/O18);
  `rg -c '^- \*\*R' docs/features/590-coverage-gap-audit/SPEC.md` → no match / exit 1
  (`0`, O19); `rg -c 'from "\./findings-corpus\.mjs"' scripts/coverage-gap.mjs` → `1`
  (O4); `.agentic-workflow/journal/20261117T024208Z-…-narrative-local.md` committed
  (O17).

## Own probes (derived from the S# wording, not the writer's tests)

- **S4/S9 four vectors, fresh scratch clone** (`git clone` of this worktree into
  `mktemp -d`, commits made only there): drop `Coverage gaps` with no `D` line →
  `finding — dimension-dropped` + `finding — missing-reverification-evidence`,
  `verdict | refused`, exit 1; same drop plus a `D` line naming it → `verdict | clean`,
  exit 0; README-only range → `verdict | not-applicable`, exit 0 (surfaces 0); add a
  dimension with no recorded run → `refused`, exit 1.
- **S6 absent inputs**: empty git repo → `catalogue | absent · <path>`,
  `corpus | absent · no unit ledger was read`, three `n/a` edges,
  `verdict | insufficient-input`, exit 1 — never a vacuous `clean`.
- **S2 determinism**: two runs of `--repo <seeded>` byte-identical (`cmp` clean, digest
  prefix `8cd04894eb528216`) and **runtime-identical** (bun vs node output `cmp` clean);
  `node scripts/dimension-regression.mjs --base origin/main` and
  `node scripts/coverage-gap.mjs --repo .` both behave like the bun runs (node fallback).
- **S2 no judgment / S5 emission-only**: no severity, route or proposal logic in
  `scripts/coverage-gap.mjs` (only the header comment renounces it); neither new script
  calls `writeFileSync`/`rmSync`/`execSync`; the fixture writes only under its
  caller-supplied directory (the D4 `(SPEC.md, product-audit-gap-fixture.mjs)` pair in
  `ledger-ownership.test.mjs`, whose new negative case still blocks every other script);
  `### Emission-only` occurs once in the reference and cites 2310.01798 + 2605.09315.
- **Contract-text qualifier check**: the diff's only removed contract lines are
  AUDIT_PROCESS step 2's span (rewritten — `receipt-quoted`, `never re-run by the model`,
  `never re-derived by inspection`, `only the non-mechanizable remainder`, `with the
  evidence-provenance gate below` all survive verbatim) and step 4's heading (its body
  survives intact after `Then:`), plus the budget/GATE_INVENTORY re-pins (history kept,
  surfaces cell gained one id). No qualifier lost, no modality flipped.

## Disclosures

- **No live-tree mutation.** `git status --porcelain` was empty at binding and empty at
  close. The new gate step was executed against the live tree exactly twice
  (`local-gate --only dimension-regression --push-base …`, read-only flags) only after
  auditing `scripts/dimension-regression.mjs` for write APIs (none: `spawnSync git`
  + `readFileSync` only) and confirming `local-gate.mjs` writes only under `--json` /
  `--install-hook`, neither passed. The fixture (a writer) was run only in `mktemp -d`
  scratch, as were the base-side/red-side clones; every scratch directory and `/tmp`
  probe file created by this run was removed before close.
- **Environment**: `origin/main` advanced twice during the run (other sessions on this
  shared box); `git worktree list` and the branch head were re-read and unchanged, and
  no ref was written by this session.
- Corrections belong to `/aw-local-apply`: B1 (one detectors input line + the suite's
  absent-inventory shape case) and B2 (`--repo <dir>` in the three prose spots) are the
  smallest actions; this receipt asserts nothing about how they are applied.
