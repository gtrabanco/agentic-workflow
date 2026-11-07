# fix/366-doc-cli · external verification receipts

One receipt per external verification run, newest last. A run with no
correction since the previous receipt is a delta verdict over the blockers
listed there plus the delta diff.

## 2026-11-07 — full verdict (no prior receipt)

```text
EXTERNAL VERIFY — base: b8b1d814 · head: 946037e0
Blockers: 3
  1. packages/agentic-workflow/src/doc/docops.mjs:38-43 — the D5 id path is built from the locator's
     rendered title (section-locator.mjs:208 `nodeText(node).trim()`, whose own contract at :68 says
     markup is never part of a title), while chunks.mjs:157-166 slugs the RAW heading line; for a
     heading carrying inline links/HTML the two halves emit different ids.
       reproducer: node packages/agentic-workflow/bin/agentic-workflow.mjs doc read --file README.md \
                     --section "$(scanChunks(README.md,'README.md').find(x=>x.section.includes('NaN.builders')).id)"
                   → DOC REFUSAL — NO_MATCH, exit 2
       scale: 24 retrieval chunk ids over 6 of 1015 tracked *.md (CHANGELOG.md 3, README.md 1,
              docs/fix/224-deterministic-replan-routing/progress.md 1, docs/fix/338-closed-ceremony-cli/SPEC.md 13,
              docs/fix/383-measured-acceptance/SPEC.md 5, skills/triage-issue/references/ISSUE_PROCESS.md 1)
       base-vs-head: at base the positional branch refused by name (exit 1) — no `doc read`, no index, so the
              drift class does not exist at base; head emits both id schemes for the same heading
              (chunk `README.md#…-running-on-nan-builders-https-cloud-nan-builders-r-7gk06fx8` vs index/read
              `README.md#…-running-on-nan-builders`). Falsifies O7's stated outcome and S5/D5's
              "both halves import the same exports so they cannot drift".
  2. packages/agentic-workflow/src/doc/structure.mjs:34 (PHASE_RE) — a second, disagreeing copy of the phase
     grammar owned by skills/phase-contract/SKILL.md §"The two grammars" and mechanized at
     scripts/unit-doc-phases.mjs:23 (UNIT_DOC_BULLET: bullet, tick OPTIONAL). The index requires the tick,
     so the template's own row shape `- P1 — <task>` (docs/features/_TEMPLATE/SPEC.md:119,
     docs/fix/_TEMPLATE/SPEC.md:130) never parses.
       reproducer: a unit doc with `- P1 — …`, `- [x] P2 — …`, `- P3 — …` → buildDocIndex returns
                   phases:[{id:"P2",status:"complete"}], previous/current/next = null/null/null
                   (an OPEN phase reads as "nothing current"), while bun scripts/phase-lint.mjs on the same
                   bytes reports P1 (PASS) and P2/P3 as phases.
       scale: 45 unit docs in-tree → the index sees phases in 12, the owner grammar in 39, 27 missed entirely
       base-vs-head: no index existed at base; `phase-lint` was and remains the only phase parser.
              Falsifies O9's stated outcome and S5's "phase mapping"; D4's premise ("the checkbox grammar is
              the repo's frozen artifact") is a sampling error — the tick is state, never a second shape.
  3. packages/agentic-workflow/src/doc/grammar.mjs:39-86 (parseDocopArgs) +
     bin/agentic-workflow.mjs runDocOpPositional + src/doc/structure.mjs:170-180 — `--out` is silently
     ignored with success (the named blocker class, not a cosmetic gap).
       reproducers: `doc index --out /tmp/idx.json --json` → exit 0, 1,824,723 B of JSON on stdout, artifact
                    NOT written, stderr empty (README documents `doc index [--out <path>] [--json]`);
                    `doc read --file <doc> --out /tmp/read.json` → exit 0, flag accepted and ignored
                    (README documents no `--out` for read, and `index --file` IS refused, so the reverse
                    check is missing); `doc edit … --out /tmp/edit.json` → exit 0, ignored.
       base-vs-head: none of these flags existed at base (positional branch refused, exit 1).
Advisories: 5
  1. packages/agentic-workflow-schema/test/verification-preflight.test.mjs:104,122 — two 50 ms timing bounds
     (F99). `bun scripts/local-gate.mjs --skip-network` exits 1 at head here: run 1 = 2 fails (95.87 ms /
     111.52 ms), run 2 = 1 fail (55.68 ms), standalone = 8/8 pass. The package is byte-identical at base
     (`git diff --quiet origin/main HEAD -- packages/agentic-workflow-schema` → clean) → pre-existing and
     load-sensitive, not change-caused. Consequence: G1's "PASS — 8 steps in 186s" receipt does not
     reproduce on this machine; the seven other steps are green in both runs.
  2. bin/agentic-workflow.mjs:220-223 — `DOC REFUSAL — NO_MATCH` is followed by `doc: doc: no section
     matches …`: docRefuse adds a prefix the docops messages already carry.
  3. src/doc/docops.mjs:80-93 — `doc read --file - --section <full D5 id>` cannot match: relativeDocPath("-")
     resolves against the cwd, not the piped document (title and bare slug still resolve).
  4. test/doc.roundtrip.test.mjs:100-124 — O12's wording is "reassembly of located sections plus
     inter-section gaps"; the test drives per-section no-op splices. The bar is met over 106 docs / 536+
     sections, only the method differs.
  5. planning-evidence.md PE-011 / decisions.md D4 cite the checkbox row as the corpus's frozen shape;
     27 of 45 in-tree unit docs never used it (measured). Root premise of blocker 2, listed for the record.
Sibling sweep: clean — `rg -n 'ship with unit 71'` matches nothing under packages/agentic-workflow/{src,bin,README.md};
  the surviving mentions are the unit's own ledgers/SPEC (the retirement record) and docs/LOGS.md (journal
  history), neither asserting the old behaviour. `rg 'positional doc'` finds no other live surface.
Completeness: S2–S8 resolved (P1–P8, validators re-run green here); S1/S9/S10 carry a dated recorded
  disposition (roadmap row 71 note 2026-11-06 + O15) rather than an `(Implements:)` line. Obligations:
  O1–O6, O8, O10–O17 verified and reproducing (O13's bytes reproduce exactly: 12,740 / 2,055 / 678 /
  1,768 / 21,390); O7 → blocker 1, O9 → blocker 2.
Spot check: bun test packages/agentic-workflow/test/doc.docops.test.mjs → 28 pass / 0 fail (match, E2)
Verdict: NEEDS-DECISION (B1, B2, B3)
```

### State disclosure

- **The head moved mid-verification.** The target bound as `ef63162d`; at 20:15:31Z a `docs(log)` commit
  `946037e0` appended six lines to `docs/LOGS.md` (written by another actor in this workspace — this session
  ran no commit, no push and no forge mutation). The delta is that file only (`git diff --stat ef63162d
  946037e0` → `docs/LOGS.md | 6 ++++++`), so every figure above holds at both heads. `946037e0` is not
  pushed; PR [#453](https://github.com/gtrabanco/agentic-workflow/pull/453) is OPEN on
  `feat/366-doc-cli` at head `ef63162d`.
- **One file was written by this verification:** this receipt (§4 of the verify contract). No code, ledger,
  doc or forge surface was touched, no branch, commit or PR was created.

### Commands run

```text
cd packages/agentic-workflow && bun run test                                   → 434 pass / 0 fail
cd packages/agentic-workflow && node --test                                   → 435 pass / 0 fail
bun scripts/local-gate.mjs --skip-network (run 1)                             → exit 1 · schema-node-compat (2 timing fails)
bun scripts/local-gate.mjs --skip-network (run 2)                             → exit 1 · schema-node-compat (1 timing fail)
cd packages/agentic-workflow-schema && node --test test/verification-preflight.test.mjs → 8 pass / 0 fail
bun test packages/agentic-workflow/test/doc.docops.test.mjs                    → 28 pass / 0 fail
rg -c 'export function slugify' packages/agentic-workflow/src/doc/chunks.mjs    → 1
rg -c '366-doc-cli' docs/ROADMAP.md                                           → 1
bun scripts/lint-changeset.mjs .changeset/366-doc-cli.md                      → ok 366-doc-cli.md
rg -ci 'experimental' packages/agentic-workflow/README.md                     → 2
rg 'ship with unit 71' packages/agentic-workflow/{src,bin,README.md}          → no match
git diff --quiet origin/main HEAD -- packages/agentic-workflow-schema         → identical
retrieval differential (base b8b1d814 vs head, scratch clones): doc --query / doc --status → identical
```
