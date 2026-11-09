# External verify — fix/468-log-immutability

Receipts for the owner's external verification. Read-only pass: no commit, no
push, no branch, no forge mutation, no code edit; every mutating probe ran in
`mktemp -d` scratch, removed after. The only live-tree provisioning was the
repo's own declared install step (`bun install --frozen-lockfile`, the
`workspace-install` gate step) — gitignored `node_modules` only, tree clean
before and after every run.

## 2026-11-09 — full verdict (no prior receipt for this unit)

State bound: unit dir `docs/fix/468-log-immutability/` (all four files, all
obligations `verified`) · base ref `origin/main` `dde38321`, change range the
merge-base `5ba1d670..a4692ad1` (13 commits, branch 1 ahead of its remote at
close) · no `EXTERNAL VERIFY` block anywhere for this unit and PR #469 carries
no review or comment → full verdict, once.

State note (mid-run movement): while this pass was running, a concurrent owner
session repaired this worktree's pre-existing corruption (the git internals
leaked into the checkout — the unit's known pre-existing issue) and committed
`a4692ad1` on the branch (parent `1a7573a1`; +1 carrier fragment, a legal
addition for anyone). The code delta between the run-time head and the final
head is empty (`git diff 1a7573a1 a4692ad1 -- scripts packages skills docs
template .changeset .github` → no output), so every evidence line below was
re-run at `a4692ad1` on the settled, clean tree after the movement; the gate's
own live run over the new commit's range is PASS.

```text
EXTERNAL VERIFY — base: dde38321 · head: a4692ad1
Blockers: 0 —
Advisories: 3 —
              A1 docs/fix/468-log-immutability/SPEC.md:86 (AC1) says the proof suite runs "(16 tests, including
                 the two uncommitted working-tree refusals)"; the head suite runs 18 — P8's two recorded
                 additions (the >1 MiB maxBuffer pin, the `.gitkeep` like-for-like pin, decisions.md) grew it,
                 and the doc's own E7 already records "18 pass". Why advisory: the acceptance validator itself
                 (exit 0) reproduces exactly; only the frozen parenthetical count is stale, no behavior involved.
                 Smallest action: reword AC1's count or drop it in the next owning edit.
              A2 packages/agentic-workflow/README.md:103 (the new `already-registered` grammar row) qualifies
                 the non-firing slug as "(local, no --session)", but write.mjs:160 also exempts an explicit
                 `--session local` (slug "local"): observed `journal write --session local` twice → exit 0, exit 0,
                 two fragments. Why advisory: for this input the behavior is byte-identical at the base commit
                 (no refusal existed there either), the carve-out is deliberate and documented at the branch
                 (write.mjs comment: an explicit `local` is indistinguishable from the fallback), and PE-004's
                 rationale (slug `local` identifies no conversation) covers it — but neither the row nor any
                 ledger records the explicit-`local` boundary, and no test pins it.
                 Smallest action: name the explicit-`local` carve-out in the row, or record a dated disposition.
              A3 template/.agentic-workflow/journal.md:101 — "One fragment per session per kind" survived the
                 change. Why advisory: the sentence never matched base behavior (the base writer let same-kind
                 duplicates land), the change moves it toward true for explicit sessions (same-kind duplicates
                 now refused), it links forward to the owner grammar that carries the full `already-registered`
                 row, and its only remaining gap is silence about the cross-kind refusal — an under-specification
                 of a pre-existing imprecise summary, not a mention asserting an old truth (the F51/F53 shape is
                 absent: no sentence the change rewrote survives anywhere else).
                 Smallest action: add "one entry per conversation (issue #468)" to the sentence when the
                 template's journal surface is next edited.
Sibling sweep: clean except A3 — every surface the change rewrote carries the update: both step-id pin suites
              (scripts/local-gate.test.mjs, scripts/release-workflows.test.mjs), docs/workflow/GATE_INVENTORY.md
              (+row) with its SKILL_CONTEXT_BUDGETS.json re-base, docs/generated/{code,units}.md (docs-generate
              --check PASS), docs/ROADMAP.md row, skills/log-session/SKILL.md step 4, packages/agentic-workflow/
              README.md (command row + grammar row), .changeset/468-log-immutability.md (both packages,
              version-parity-content PASS). The README's generic `refusal` row (README.md:105) omits the new
              reason, but it omits `carrier-absent` too — pre-existing structure with per-reason rows, not a
              survivor asserting the old truth.
Completeness: all resolved — S1→P2; S2→P3/P4 (red receipts E2, pin updates ordered by S2 itself); S3→P5/P6
              (red receipt E3); P1/P7/P8 cover the doc/projection/verification passes. Every validator re-ran
              green here; obligations O1–O11 all `verified`, every validator re-runs green (O1–O6 in the 18-pass
              gate suite — named cases present; O7 --list + local-gate suite; O8 pin suites 65 pass; O9/O10
              journal.write suite 19 pass; O11 root suite). No open ids, no dispositions needed.
Spot check: node scripts/run-root-suite.mjs → match (exit 0, 92/92 suites PASS at a4692ad1, vs recorded G1 "exit 0 · 92/92")
Verdict: VERIFIED
```

Evidence (each command re-run at the head above, `command: observed result`;
the behavior probes were run against source bytes identical at both heads):

- `bun test scripts/log-immutability.test.mjs` → exit 0 · 18 pass 0 fail (AC1; E7's recorded 18 reproduced).
- `node scripts/local-gate.mjs --list` → lists `log-immutability` (AC2/O7).
- `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` → exit 0 · 65 pass (AC2/O8).
- `bun test packages/agentic-workflow/test/journal.write.test.mjs` → exit 0 · 19 pass (AC3/O9/O10).
- `bun run test` in packages/agentic-workflow → 493 pass 0 fail; `bun run test:node` → 494 pass 0 fail (P6).
- `bun run test` in packages/pi-agentic-workflow (changeset declares it) → 640 pass 0 fail.
- `node scripts/docs-generate.mjs --check` → exit 0 · PASS (P7); `node scripts/version-parity-gate.mjs --content`
  → exit 0 · `bun scripts/check-skill-context.mjs` (+ `--documents`) → exit 0 · `bun scripts/skill-lint.mjs` →
  0 findings · `bun scripts/unit-route.mjs --triage 468-log-immutability` → exit 0 ·
  `bun scripts/phase-lint.mjs docs/fix/468-log-immutability/SPEC.md` → verdict PASS (G3).
- `node scripts/run-root-suite.mjs` → exit 0 · 92/92 suites PASS (G1, spot check).
- `bun scripts/local-gate.mjs --only log-immutability,journal-carrier-check,docs-generated-projection,
  version-parity-content` → exit 0 · `local-gate: PASS — 4 step(s)` (G2's recorded line reproduced verbatim).
- `node scripts/log-immutability.mjs` on the live tree at the final head → exit 0 · `verdict: PASS` over the
  range `1a7573a1..a4692ad1` (the concurrent repair commit) · the tree is clean throughout except this receipt.
- Independent behavior probes (scratch repos, the gate read-only by source inspection before it was run
  anywhere): the incident class (hand-append + fragment deletion in one commit) → exit 1 `log-hand-appended` +
  `fragment-hand-deleted`; aggregator append + consumption + anyone's fragment addition → exit 0; uncommitted
  fragment deletion → exit 1; no-heading and truncated appends → exit 1 `log-block-malformed`; middle insertion
  and history rewrite → exit 1 `log-rewritten`; unknown flag → exit 2 with usage. Writer: explicit `--session s1`
  twice → exit 2 `JOURNAL REFUSAL — already registered …`, one fragment on disk; two unflagged writes → both land
  (A2's `--session local` probe as recorded above). The gate imports `fragment.mjs` (node builtins only) and
  runs green with no install present, as its empty `DEPS` declares.
