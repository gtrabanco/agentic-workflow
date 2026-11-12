# External verify — fix/481-post-publish-availability-gate

```
EXTERNAL VERIFY — base: 675f06c4 · head: a5983c1b  (2026-11-12)
Blockers: 0
Advisories: 1 — docs/features/502-nan-publish-stable/SPEC.md:74,148,469 — the landed unit doc
  still counts the availability-wait hook's coverage as "four jobs, not three"; the hook this
  unit ships covers five (D1 adds nan-publish). Historical record in a frozen unit doc, and the
  binding is satisfied as a superset — no living surface asserts the old truth. No action owed.
Sibling sweep: clean — the change is additive (nothing removed or rewritten); greps for the
  availability gate's mentions (GATE_INVENTORY.md, test-route-map.json, changeset, ROADMAP row,
  generated projection, SKILL_CONTEXT_BUDGETS.json re-pin) all assert the new truth.
Completeness: S1–S7 all resolved — each maps to a P-task with (Implements: S#) whose validator
  re-ran green here (unit-route --triage exit 0; both suites green; red-first PASS; docs-generate
  --check PASS; prose-gate-inventory PASS; O13 rg probes reproduced). Obligations O1–O13 all
  `verified` with validators that re-ran green here.
Spot check: bun test scripts/npm-availability-wait.test.mjs → 17 pass / 0 fail → match (E3).
Verdict: VERIFIED
```

Commands observed this run (head a5983c1b):

- `bun test scripts/npm-availability-wait.test.mjs` → exit 0 · 17 pass / 0 fail
- `bun test scripts/release-workflows.test.mjs` → exit 0 · 26 pass / 0 fail
- `bun test scripts/npm-version-gate.test.mjs` → exit 0 · 14 pass / 0 fail (regression scope)
- `bun scripts/unit-route.mjs --triage 481-npm-availability-wait` → exit 0
- `bun scripts/red-first.mjs` → exit 0 · `0 finding(s)` · `verdict: PASS` (red `92c55aa6` precedes green `fec35709`)
- `bun scripts/prose-gate-inventory.mjs` → exit 0 · `verdict: PASS` (`npm-availability-gate` row resolves)
- `bun scripts/docs-generate.mjs --check` → exit 0 · `verdict: PASS`
- `bun scripts/check-skill-context.mjs --documents` → exit 0 · `PASS context documents: 4`
- `rg -c "node:child_process|execSync|spawnSync" scripts/npm-availability-wait.mjs` → exit 1 (0 matches)
- `rg -c "npm-availability-wait" .github/workflows/publish.yml` → 5
- `rg -c "https://registry" scripts/npm-availability-wait.test.mjs` → exit 1 (0 matches — no live network)
- publish.yml YAML parse: 7 jobs; 5 `Wait for npm tarball availability` steps, each placed
  after the publish step and before the tag/pre-release (`cut-prerelease`) or the canary
  dist-tag write (`schema/crate/pi/nan-publish`), under the same `if:` guard as the publish.

No mutation path was exercised against the live tree: the gate script performs fetch/read only
(no child_process, no writes); the suite ran with injected network/clock; no branch, commit,
push or forge mutation was made. This receipt is the only file this verification wrote.

Correction batch (2026-11-12, owner-directed apply):
- **A1 folded** — the advisory's three mentions in
  `docs/features/502-nan-publish-stable/SPEC.md` (Soft dep bullet, Future cost bind, References
  line) moved to the landed five-job currency, with an `F4` row in 502's `## Log` recording the
  fold and a `F1` row in this unit's `## Log`; this receipt stays append-only. The surrounding
  "four"-family mentions were triaged and left as-is: this SPEC's S7 quotes the issue verbatim;
  `scripts/npm-version-gate.test.mjs`'s "all four publish jobs" names the four stable-publish
  jobs, all of which call the gate (fixture-true); `docs/CAPABILITIES.md` counts packages, not
  jobs. Post-fold re-check: `bun scripts/docs-generate.mjs --check` exit 0,
  `bun scripts/check-skill-context.mjs --documents` exit 0, `rg -c "four jobs"
  docs/features/502-nan-publish-stable/SPEC.md` exit 1 (0 matches).
