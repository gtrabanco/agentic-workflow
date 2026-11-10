# External verify — fix/484-chore-deps-pin-drift

Receipts for the owner's external verification. Read-only pass: no commit, no
push, no branch, no forge mutation, no code edit; every mutating probe ran in
`mktemp -d` scratch (none was needed — the change introduces no command). The
only live-tree provisioning was the repo's own declared install step
(`bun install --frozen-lockfile`, the workspace-install step) — gitignored
`node_modules` only, tracked tree clean before and after every run.

## 2026-11-09 — full verdict (no prior receipt for this unit)

State bound: unit dir `docs/fix/484-chore-deps-pin-drift/` (`SPEC.md`, all
eight obligation rows `verified`) · base ref `origin/main` `2a28f038a246d35ba159037620ebe337a56e57ed`
· head `d61a1b9788aeb6a2a72dc119421acc88c9604bc8` (branch up to date with its
remote, working tree clean) · no `EXTERNAL VERIFY` block anywhere for this
unit and no `external-verify.md` beside the SPEC → full verdict, once.
Corrections after the unit's own hand-off (commit `7cbc7c11`, the node-runtime
re-verify) were already folded into the SPEC's evidence before this pass; no
correction landed after the last recorded receipt because no receipt existed.

```text
EXTERNAL VERIFY — base: 2a28f038 · head: d61a1b97
Blockers: 0 —
Advisories: 2 — (1) docs/fix/484-chore-deps-pin-drift/SPEC.md:52 (Impact) names a "docs/LOGS.md session entry" but the branch diff carries only .agentic-workflow/journal/ fragments; LOGS.md is populated by aggregation, not by this PR — prose overstates one impact, wording fix only (pre-existing doc convention, does-not-affect the deliverable). (2) scripts/version-parity-gate.mjs:672 + scripts/local-gate.mjs:309 — the --pins default checks the Pi package only while the script header and docs/workflow/PACKAGES.md say every package under packages/ is checked, so a crate-only pin drift passes the wired gate; reproduced at head and present at base (unit finding F1, deliberately out of scope) — needs its own unit.
Sibling sweep: clean — every surviving "1.4.5" mention is a historical ledger sampled at its own cut (docs/fix/374-pluggable-session-journal/planning-evidence.md:18, docs/fix/366-doc-cli/planning-evidence.md:22, docs/LOGS.md history) or a verbatim quote of the issue/E-lines; PE-008 is struck through and marked superseded by PE-009; no prose states the crate's typebox version outside those carriers.
Completeness: S1–S6 all resolved — S1/S5→P2, S2/S4→P3, S3/S6→P2+P5, each with its (Implements: S#) validator re-run green here; all eight obligation rows (O1–O8) verified with validators that re-ran green (O1 O2 O3 O4 O5 O6 O7 O8).
Spot check: bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow → match (exit 0, "exact pins checked: 2", VERDICT: PASS — identical to E5); corroborated by the crate suite re-run end-to-end at head: 586 pass / 0 fail under bun (102s) and 586 pass / 0 fail under node --test (73s), byte-agreeing with E12/E13, and bun install --frozen-lockfile exit 0 (163 packages).
Verdict: VERIFIED
```

Claim-by-claim (observed 2026-11-09, head `d61a1b97` unless stated):

- **AC1/O1/O2 (S1)** — `bun scripts/pin-watch.mjs --check` → exit 0, `VERDICT: PASS`, no `drift:` line, 10 pins checked, registry confirms latest `1.4.6` via real `npm view`; `bun scripts/version-parity-gate.mjs --pins --package packages/agentic-workflow` → exit 0, `VERDICT: PASS` (exact pins checked: 2).
- **AC2/O4/O7 (S2, S4)** — `bun scripts/lint-changeset.mjs .changeset/484-typebox-pin-bump.md` → exit 0, `ok 484-typebox-pin-bump.md`; `bun scripts/version-parity-gate.mjs --content --base origin/main` → exit 0, `VERDICT: PASS`, changeset-intent route declared. The changeset body names the 1.4.5→1.4.6 surface change (`Schema.Pointer`/`Schema.Resolve` namespace re-exports, `Indices`→`Fragments` + `EncodeFragment`/`DecodeFragment`, `_pathing` removed, the engine's namespace-import rewrite) and states the crate reaches none of it.
- **AC3/O3 (S3)** — `git diff --stat origin/main...HEAD` names exactly the nine declared paths (three journal fragments, the changeset, `bun.lock`, `docs/ROADMAP.md`, the unit SPEC, `docs/generated/units.md`, the crate `package.json`); `git diff origin/main...HEAD -- bun.lock` touches only the `typebox` entries.
- **AC5/O5 (S5)** — `rg -c '"typebox": "1.4.6"' packages/agentic-workflow/package.json` = 1; `rg -c 'typebox@1\.4\.6' bun.lock` = 1; `bun install --frozen-lockfile` → exit 0.
- **AC6/O8 (S6)** — `git log -1 --format=%B a7c9beb9 | rg -c 'Closes #484'` = 1.
- **O6** — crate suite at head: 586/586 under bun, 586/586 under `node --test` (node v26.13.0 on PATH); the three base failures of E3 were the missing runner (PE-009), no new failure.
- **P1/P5 validators** — `bun scripts/unit-route.mjs --triage 484-chore-deps-pin-drift` → exit 0 (same triage as recorded); `bun scripts/docs-generate.mjs --check` → exit 0, PASS; `bun scripts/roadmap-settle.mjs` → exit 0, `verdict: PASS`, violations: 0.
