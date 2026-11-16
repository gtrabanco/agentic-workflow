
---

## Correction addendum — 2026-11-16 (local apply batch, correction bounds §9)

Batch head: `9bba62cd` (the fix slice; this addendum, the unit doc's evidence
lines and the session fragment land beside it in the docs commit).

- **Blocker O21 — fixed.** `planning-obligations.md:31` now runs `git log --oneline --reverse origin/main..HEAD -- …runner.resolve.test.mjs …src/runner/resolve.mjs` → exactly `eb961b9f` (red) then `4aae8a50` (green); status stays `verified`, re-run in the foreground (E24).
- **Advisory A1 — fixed.** `doctor/checks.mjs` renders the `rg` bootstrap from the resolver's own symbol (`renderInvocation(RUNNER_CANDIDATES[0], CRATE_VERSION, ["provision","rg","--yes"])`); RED observed first (E23), GREEN after (E24), and the differential shows only the intended `@4.10.0` delta (E25). Design kept bun-first — the doctor's bun row owns a missing bun — and the evaluator stays pure over evidence.
- **Advisory A2/A3 — fixed.** both old-shape citation comments re-pointed to the symbolic `runner` form; the class scans return 0 (E24).
- **Advisory A4 — dispositioned, not fixed here.** `docs/ROADMAP.md:169` quotes issue #553 verbatim and links `docs/features/553-universal-cli-coverage/SPEC.md`, absent at base (`git show origin/main:docs/ROADMAP.md` carries the same row) and at head — a reword would falsify a forge-issue quote and re-scope another open unit; route: #553 triage.
- **Recheck (bounded to the batch):** the touched suites (E24), the differential (E25) and the full `bun scripts/local-gate.mjs --jobs 1` → `PASS — 19 step(s)` at `9bba62cd` (E26; the first attempt red'd under concurrent-session load — both victims green standalone, no code change made for it). The verdict block above stands unedited; this addendum is the §9 record.
