# External verify — fix/521-fix-config

Receipts for the owner's external verification. Read-only pass: no commit, no
push, no branch, no forge mutation, no code edit — the only live-tree write is
this receipt. The change introduces no command or script (the diff touches no
`scripts/` path), so no unproven mutation path had to be isolated; every
base-vs-head probe (compiled `parseConfigFile` differential, clean-clone gate)
ran in `mktemp -d` scratch, removed after. Test runs only rebuild gitignored
outputs (`dist/`, the staged skill bundle); the tracked tree was clean before
and after.

## 2026-11-12 — full verdict (no prior receipt for this unit)

State bound: unit dir `docs/fix/521-fix-config/` (`SPEC.md`, embedded planning
ledgers, all fourteen obligation rows) · base ref `origin/main` =
merge-base `43e8c1f9` · head `12775367` (branch `fix/521-fix-config`,
working tree clean) · no `EXTERNAL VERIFY` block anywhere for this unit and no
`external-verify.md` beside the SPEC → full verdict, once. (Note on AC-S1's
`ls` check: its intent is that the XS/S ledgers are embedded — no
`planning-*.md` siblings; this protocol-mandated receipt is not a ledger.)

```text
EXTERNAL VERIFY — base: 43e8c1f9 · head: 12775367
Blockers: 6 — (1) docs/fix/521-fix-config/SPEC.md:320 (O10 row) — obligations closure: `verified` outcome no longer reproduces — validator `rg -n 'plain JSON' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` → 0 matches (row and E6 require 2), and the row's obligation text ("a save does not preserve comments") now contradicts O14/AC-S7 in the same ledger; base-vs-head: SPEC absent at base, outcome held at E6 (mid-branch) and broke when this branch's own commit 39317033 rewrote both guides to say a save KEEPS comments (CONFIG.md:29-31) — change-caused, cannot reproduce at base; smallest action: re-scope O10's text+validator to the landed contract or record a dated supersession by O14. (2) SPEC.md:123-125 — sibling sweep (F51/F53 class): Non-goals still asserts "No comment-preserving writer. The settings console keeps writing `JSON.stringify(file, null, 2)`" — reproducer `rg -n 'JSON.stringify\(file, null, 2\)' packages/pi-agentic-workflow/src/settings/console.ts` → 0 matches (save is console.ts:726 `applyConfigEdits`), K1–K7 green prove the writer landed (P7/90c066a9); base-vs-head: mention written at cut (true then), falsified by this branch's P7 while console.ts/CONFIG.md/README/O14/AC-S7 all moved — the siblings kept lying; smallest action: rewrite the Non-goals bullet to the landed scope. (3) SPEC.md:87-91 — sibling sweep: Impact says CONFIG.md and the README "gain" the consequence "the settings console rewrites the extension file as plain JSON, so comments are not preserved by a save" — reproducer `rg -n 'not preserved|plain JSON' docs/workflow/CONFIG.md packages/pi-agentic-workflow/README.md` → 0 matches; CONFIG.md:29-31 states the opposite ("a save keeps your comments"); base-vs-head: guides rewritten by this branch's 39317033, Impact never updated; smallest action: rewrite the two Impact bullets to the landed save contract. (4) SPEC.md:162-165 — sibling sweep: Future cost still says "A comment … survives until the next settings-console save, which rewrites plain JSON. Whoever writes the comment-preserving editor owns making that sentence in `CONFIG.md` obsolete." — false at head: the save preserves bytes (console.ts:726) and the editor landed inside this unit (P7), CONFIG.md already updated; base-vs-head: same 39317033/90c066a9 batch; smallest action: replace the bullet with the real future cost (or delete it). (5) SPEC.md:129-131 — sibling sweep: Non-goals "No new dependency" — reproducer `rg -n '"jsonc-parser"' packages/pi-agentic-workflow/package.json` → :65 (exact pin 3.3.1, bun.lock +3, changeset minor) — the unit introduced exactly one new dependency after this non-goal was frozen; base-vs-head: base package.json has three deps, head four; smallest action: re-scope the bullet (parser swap adds none; the console writer adds the pinned jsonc-parser per D9). (6) SPEC.md:126 — sibling sweep: Non-goals "No `Bun.JSONC.parse` fast path (D1) and no second parser in this package" contradicts AC-S2 (SPEC.md:190) and the head code — reproducer `rg -n 'native.parse|parseJsonc\(text\)' packages/pi-agentic-workflow/src/config/schema.ts` → :765 (native first reader) and :771 (strict boundary), J8 pins the consultation; D1's cut-time wording survived this branch's own S5a/P6 correction (owner L3 → D5: native first, strict boundary never moves), and Retirements SPEC.md:105-110 keeps the same pre-D5 framing; base-vs-head: SPEC absent at base, the native reader landed in this branch; smallest action: update Non-goals/Retirements to D5's landed shape.
Advisories: 2 — (1) scripts/prose-gate-inventory.test.mjs:112,124,127 — the primary checkout's root-suite red `multiple-homes` naming the three `.worktrees/*/docs/workflow/GATE_INVENTORY.md` copies: why advisory — the diff adds no GATE_INVENTORY.md, `git archive HEAD` into mktemp scratch runs the same suite at 21 pass/0 fail, and the full gate passes 17/17 in a clean clone; disclosed as E7, environment (sibling worktrees of other units), present regardless of base or head. (2) .changeset/fix-521-fix-config-feat-settings-keep-the-operator-s-comments-when-the-console-saves-521.md:3 — release intent now carries only the console capability; the JSONC-parse fix that is the issue's subject lost its own changeset when 39317033 deleted `fix-521-fix-config-feat-parse-pi-agentic-workflow-json-as-jsonc-521.md`, so #521's user-facing parse fix appears in no changeset: why advisory — `bun scripts/lint-changeset.mjs` exits 0, the entry makes no false claim, it is an omission/scope choice for the owner, not a lying surface.
Sibling sweep: blocked only where listed as blockers 1-6 (all inside the unit SPEC: Impact 87-91, Non-goals 123-131, Future cost 162-165, O10 320); clean everywhere else — docs/workflow/CONFIG.md and the package README state the landed save contract, docs/ROADMAP.md's #521 row is current, no surviving claim anywhere that the extension file is read with JSON.parse (outside the SPEC's verbatim issue quotes → 0 matches), src/hooks/config.ts:162 JSON.parse is the declared out-of-scope sibling, and the SPEC Log D3/E6 lines plus the journal fragment's D3 narrative are dated history superseded by later dated entries (L3/D9/P7), not current-state surfaces.
Completeness: S1–S7 and S5a all resolved — P1..P7 each carry (Implements: S#) and every validator re-ran green here: `bun scripts/phase-lint.mjs docs/fix/521-fix-config/SPEC.md` PASS (7 phases), `bun test test/config-jsonc.test.mjs` 8/8 bun + 7 pass/1 declared-skip node, compiled base-vs-head differential in mktemp (only the three declared deltas; head bun ≡ head node, 0 differing lines), `bun scripts/lint-changeset.mjs` exit 0, `bun scripts/docs-generate.mjs --check` PASS (3 checked, 0 stale), `rg -c '#521' docs/ROADMAP.md` = 1, `bun test test/settings-console-jsonc.test.mjs` 7/7 both runtimes, `bun run test` 820/0 (76 files) + `test:node` 819/0+1 skip, `bun scripts/local-gate.mjs --jobs 2` PASS 17/17 in a clean clone; obligations O1–O9 and O11–O14 re-verified, O10 open as blocker 1 · open ids: none on S#.
Spot check: cd packages/pi-agentic-workflow && bun run test → match (820 pass / 0 fail / 76 files — identical to E13's reported output).
Verdict: NEEDS-DECISION (SPEC.md:320 O10 · SPEC.md:87-91 · SPEC.md:123-125 · SPEC.md:126 · SPEC.md:129-131 · SPEC.md:162-165)
```

Claim-by-claim (observed 2026-11-12, head `12775367` unless stated):

- **AC-S1 (S1)** — `ls docs/fix/521-fix-config/` → `SPEC.md` (+ this receipt);
  `git log --oneline 43e8c1f9..HEAD` → 16 conventional commits
  (`feat(settings)`, `test(521)`, `docs(521)`), single author, no AI/co-author
  trailers.
- **AC-S2/O4 (S2, S5a)** — `rg -n 'JSON.parse' packages/pi-agentic-workflow/src/config/schema.ts`
  → exit 1 (0 matches); `rg -n 'parseJsonc\(text\)'` → 1 (schema.ts:771);
  `bun test test/config-jsonc.test.mjs` → 8 pass (`J7` green, `J8` executed);
  `node --test test/config-jsonc.test.mjs` → 7 pass, 1 skipped (`J8`, declared).
- **AC-S3/O1–O3 (S3)** — `J1`/`J3` in the same green runs: a `//`-commented
  file parses, `loadConfig` answers ok with the base file's `memory.engram`
  consent read.
- **AC-S4/O6/O7 (S4)** — `J5`/`J6` + the `AC12` cases in
  `bun test test/config-merge.test.mjs test/config-schema-stateflow.test.mjs test/model-profiles.test.mjs`
  → 69 pass / 0 fail (matches PE-010/O5's floor exactly).
- **AC-S5/O5 (S5)** — `J4` byte-identical base-vs-change in the differential;
  the 69-pass targeted run above; whole package `bun run test` → 820 pass / 0
  fail / 76 files, `bun run test:node` → 819 pass / 0 fail / 1 skipped.
- **O9/O13 (differential, re-run independently)** — base `schema.ts` from
  `git show 43e8c1f9:` compiled beside head with the package's own `tsc` in
  `mktemp -d`, one 19-case corpus run under bun and node: base→head changes
  are only the three declared deltas (five JSONC files flip invalid→parsed;
  seven failures gain `line <n>:<col>`; two non-object roots gain the
  `invalid JSON: ` prefix), five cases byte-identical; head bun ≡ head node on
  **0 lines**, base bun ≠ base node (runtime-specific `JSON.parse` wording) —
  reproduces S5a's whole point.
- **AC-S6/O11 (S6)** — `bun scripts/lint-changeset.mjs` → exit 0 (the `521`
  entry at `minor`, see advisory 2); `bun scripts/docs-generate.mjs --check` →
  PASS (3 checked, 0 stale, roadmap unchanged); `rg -c '#521' docs/ROADMAP.md`
  → 1; `bun scripts/roadmap-settle.mjs` → PASS (189 docs, 0 violations).
- **AC-S7/O14 (S7)** — `bun test test/settings-console-jsonc.test.mjs` → 7 pass
  (`K1`–`K7`), `node --test` same → 7 pass; the console sink is an in-memory
  mock (`test/settings-console-jsonc.test.mjs:76`), no live config touched.
- **O12 (gates)** — `bun scripts/local-gate.mjs --jobs 2` in a clean
  `git clone` scratch of head → `PASS — 17 step(s)`, every step exit 0, no
  skipped step (workspace install + network steps included); the primary
  checkout's one red is advisory 1 (E7's environment finding).
- **Red-first** — `node scripts/red-first.mjs` → PASS, 0 findings (56 pairs);
  the new suites are added files only — the diff modifies no existing test.
- **Spot check** — `cd packages/pi-agentic-workflow && bun run test` →
  820 pass / 0 fail / 76 files, byte-for-byte the outcome E13 reports.

Corrections belong to `/aw-local-apply` (one batch → one blockers-only
recheck): the six blockers are all text/ledger repairs in
`docs/fix/521-fix-config/SPEC.md` — no code change is implied by this verdict.
