# 726 — pi-package-defects · external verify

2026-11-27, full verdict, once: no prior `EXTERNAL VERIFY` block existed in this
unit dir (searched the tree before starting), so nothing here is a delta.
Read-only run: no commit, no push, no branch, no forge call, no tracked byte
changed (`git status --porcelain` → empty before and after); the package's own
`bun run test` regenerated only gitignored build output (`packages/pi-agentic-workflow/skills/`,
`dist/`), and every mutating-capable command the change touched
(`bundle-skills.mjs`) was exercised only through that declared test path, whose
fixtures stage into `mktemp -d`. Probes ran against `git archive` copies of both
commits in `/tmp`, removed after use.

State bound at the start: base `origin/main` = `f1b04a3a9`, head `8e6c4d4ad`.
A companion session committed `37f96b4f2` (a 6-line journal narrative fragment)
mid-run at 13:05 UTC; head is re-bound to `37f96b4f2` and every carrier-reading
check (`verify`, `docs-generate --check`, `skill-lint`, `journal aggregate --check`)
was re-run green at that head.

```text
EXTERNAL VERIFY — base: f1b04a3a9 · head: 37f96b4f2
Blockers: 7 — each: file:line, reproducer, base-vs-head evidence
  1. docs/fix/726-pi-package-defects/planning-obligations.md:22 (O12, status `verified`)
     reproducer: `rg -n '726-pi-package-defects.*in-progress' docs/ROADMAP.md` → exit 1, no output (the validator's AND half); `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/726-pi-package-defects/SPEC.md` → exit 0 (the other half).
     base-vs-head: the ledger is introduced by this branch (no unit dir at f1b04a3a); on every branch commit checked — including 0b1a73133, where the status cell really was `in-progress` (docs/ROADMAP.md:244) — the token `726-pi-package-defects` never occurs in docs/ROADMAP.md (the row names `pi-package-defects`), and it now reads `done · #736`; no `## Log` E line records the rg half (E13 records only `verify`).
     smallest action: re-cut O12's roadmap validator to a pattern that can match (or drop that AND half and record it `n/a` with the reason), then re-verify.
  2. packages/agentic-workflow/src/skills/discovery.mjs:9 — "every candidate is screened with the seven `skill-lint` checks"
     reproducer: `rg -n 'seven .?skill-lint. checks' packages/agentic-workflow/src/skills/discovery.mjs` → line 9; `bun scripts/skill-lint.mjs` at head prints `8 check(s)`.
     base-vs-head: same line at base, where SKILL_SCREEN_CHECKS was SL-01…SL-07 → true; at head the same engine (screen.mjs:27-37) publishes SL-01…SL-08 and discovery screens through it → false.
     smallest action: `seven` → `eight` on that line.
  3. packages/agentic-workflow/src/runner/skills.mjs:8 — "screen every candidate's tree with the seven `skill-lint` checks plus provenance"
     reproducer: `rg -n 'seven .?skill-lint. checks' packages/agentic-workflow/src/runner/skills.mjs` → line 8.
     base-vs-head: as blocker 2 — the line's claim was true at base (7 checks), false at head (8); untouched by the change.
     smallest action: `seven` → `eight` on that line.
  4. packages/agentic-workflow/README.md:66 — CLI table: `discover` screens "the seven `skill-lint` checks plus provenance"
     reproducer: `rg -n 'seven .?skill-lint. checks' packages/agentic-workflow/README.md` → lines 66 and 1043.
     base-vs-head: true at base, false at head; the change updated skill-lint's own narrations (CHECKS.md, SKILL.md, docs/workflow/SKILLS.md, product-audit's AUDIT_DIMENSIONS) but not this crate README.
     smallest action: `seven` → `eight` on line 66.
  5. packages/agentic-workflow/README.md:1043 — "The engine is `src/skills/screen.mjs` (the seven `skill-lint` checks, one owner)"
     reproducer: same rg as blocker 4 → line 1043.
     base-vs-head: as blocker 4.
     smallest action: `seven` → `eight` on line 1043 (documentation-currency rule ships with the unit).
  6. skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md:82 — "`skill-discovery@1` envelope — the seven `skill-lint` checks plus provenance"
     reproducer: `rg -n 'seven .?skill-lint. checks' skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` → line 82.
     base-vs-head: contract/instruction prose that was true at base (7 checks) and is false at head; the same count move was made in skill-lint's SKILL.md but not here.
     smallest action: `seven` → `eight` on line 82 (same line count, no budget re-pin needed).
  7. packages/agentic-workflow/test/skills.discovery.test.mjs:7 — suite header: "a per-candidate lint receipt drawn from the seven checks"
     reproducer: `rg -n 'the seven checks' packages/agentic-workflow/test/skills.discovery.test.mjs` → line 7; the suite itself pins no count and passes.
     base-vs-head: true at base, false at head; the sibling suite the change did edit (skills.screen.test.mjs) states eight, this one still states seven.
     smallest action: `seven` → `eight` on line 7.
     stability for blockers 2-7: each reproducer names only that line and stays quiet on the rest of the tree; all six lines were true at base and became false only because this change raised the published check set to eight.
Advisories: 6 — each: file:line, why advisory
  1. packages/agentic-workflow/test/doc.query.test.mjs:116,140,261 (+ test/doc.hybrid.test.mjs) — red in `local-gate --only crate-suite-bun` with actual `unavailable-embeddings-not-indexed` vs expected `unavailable-embeddings-not-configured`; green 47/47 with this session's `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_*`/`NAN_API_KEY`/`PI_PROVIDER` unset. Environment class (same family as the unit's documented embed-profile known issue), fires on code the diff never touches → not change-caused.
  2. packages/agentic-workflow/test/doc.structure.test.mjs — `crate-suite-node` reported `SUITE TIMEOUT (240.2s)` with zero assertion failures inside, exactly as the unit's `## Known pre-existing issues` documents for both prior gate runs; standalone here `node --test --test-timeout=30000` → exit 0, 19/19 in 87s. Load-sensitive bound, not change-caused; no bound raised.
  3. packages/pi-agentic-workflow/scripts/bundle-skills.mjs:136-146 (`isPlainScalar`) — a comment-led raw value (`argument-hint: #foo bar`) or a YAML-typed scalar (`null`, `true`) is left unquoted, so it stages as `null`/boolean rather than a string, while the unit's Impact prose promises any value "YAML cannot read as a plain or quoted string is rewritten". No shipped hint has such a shape, and base (no transform) ships the identical bytes → no regression, out-of-domain input. Smallest action: treat `#`-leading and YAML non-string scalars as non-plain, or narrow that prose sentence.
  4. packages/agentic-workflow/test/skills.screen.test.mjs:2 — "issue #591 S3: the seven `skill-lint` checks have one owner": a historical attribution of #591's claim, self-superseded two lines below ("the closed id set (exactly eight since issue #726's addendum, `SL-01`…`SL-08`)") → advisory, not an assertion of current truth.
  5. Validator wording, two spots: O5/AC6's literal `bun test test/skill-parity.test.mjs … exits 0` failed here until the package's own `bun run test` re-staged the gitignored bundle (staged 01:17 vs sources at HEAD) — the parity suite reads the staged copy, so the validator should name the staging pre-step or the package `test` script; O19's "`rg -c …` prints 0" prints nothing instead of `0` (ripgrep omits zero-count files) while the outcome — zero `seven checks` matches, ≥1 `SL-08` — does reproduce.
  6. Settled historical carriers still narrate seven: docs/features/591-skill-discovery/planning-obligations.md:13 (validator `matches 7`) and :231 "no eighth check exists", docs/fix/357-skill-lint-smells-supply-chain/SPEC.md:25,115,172, docs/features/514-git-identity-signing-guard/SPEC.md:362,406,538, docs/features/595-test-surplus-audit/external-verify.md:69, docs/fix/569-roadmap-rows-issue-links/SPEC.md:400, docs/fix/690-telemetry-attr/SPEC.md:406, docs/research/ATTRIBUTION.md:44 — records of their own time, not live surfaces; re-running unit 591's O1 validator now yields 8, noted for whoever re-verifies that unit.
Sibling sweep: list — six live siblings still assert the old truth and are blockers 2-7 (discovery.mjs:9, runner/skills.mjs:8, agentic-workflow/README.md:66 and :1043, init-workspace BOOTSTRAP_DISCOVERY.md:82, skills.discovery.test.mjs:7); every surface the change itself reworded agrees (skill-lint CHECKS.md/SKILL.md, screen.mjs and skill-lint.mjs headers, docs/workflow/SKILLS.md, product-audit AUDIT_DIMENSIONS.md:147, both suite pins → `8 check(s)`); retired truth is gone where it mattered — `rg -c 'node_modules/pi-extensible-workflows/dist/subagents/index.js' packages/pi-agentic-workflow/package.json` → 0, `rg -n '^argument-hint: \[' skills/*/SKILL.md` → no match, the old README disable instruction exists only in this unit's own Retirements prose and in settled unit docs (515/615 history); historical-only "seven"/`SL-01…SL-07` carriers are advisory 6.
Completeness: S1–S8 resolved — each `S#` carries `(Implements: S#)` tasks (P1–P9); P2–P6, P8 and P9 validators re-ran green here, P1/P7's red-first corpora are receipted red-then-green (E3, E15); obligations O1–O21 all re-ran green here (O1–O4 argument-hint 17/17, O5 parity+alias 24/0 after staging, O6–O9 subagents-provision, O10 serena 3/3, O11 README case, O13 fresh `pi --mode rpc --no-session --no-extensions --no-context-files --offline --skill …` over a temp agent dir: base skills → `skill:fold-findings` only, head skills → + `skill:agentic-workflow-doctor` + `skill:aw-doctor`, no `flow-seq-start`, O14 docs-generate/context/verify, O15 diff names no `sessiond`/`pi-web`, O16–O17 screen+lint 33/33, O18 `8 check(s)` + `verdict: PASS`, O19 zero/≥1 as substantively stated, O20 red commit `ca88dd76c` before engine `8f8a7a911` + both path-protection rows, O21) except O12 (blocker 1) | open ids: none, obligations defect: O12.
Spot check: `bun run test` in packages/pi-agentic-workflow (NAN_API_KEY/PI_PROVIDER/AGENTIC_WORKFLOW_DOC_EMBEDDINGS_* unset) → match — `1142 pass · 0 fail · 97 files · exit 0`, identical to the reported E5.
Verdict: NEEDS-DECISION (7 open blockers)
```

Own probes beyond the change's own tests (none of them the writer's): yaml@2.9.0
parse of `git archive` copies — base `bad=3` (`PARSE-FAIL agentic-workflow-doctor`,
`PARSE-FAIL aw-doctor`, `NON-STRING fold-findings ["finding-id …"]`) vs head
`bad=0`; fresh-runtime `get_commands` base/head differential (O13 above);
`skill-lint --root <mktemp>` over seven self-written fixtures → exactly two
`SL-08` findings (unquoted `[`, unquoted `{`), quoted/placeholder-led/plain
admitted, `allowed-tools` and a non-hint field not screened; `normalizeArgumentHint`
over twelve self-written shapes (advisory 3); `resolveSubagentsEntry()` against
the real dependency under this worktree's hoisted bun layout → `ok` with
`…/node_modules/.bun/pi-extensible-workflows@6.4.0+…/node_modules/pi-extensible-workflows/dist/subagents/index.js` (bun's store) while
`packages/pi-agentic-workflow/node_modules/pi-extensible-workflows` does not exist
(the base manifest's entry is void in this layout), and a failed provision
registers exactly one `session_start` warning naming
`pi-extensible-workflows/dist/subagents/index.js` plus the new disable line.

Corrections belong to `/aw-local-apply` (one batch → one blockers-only recheck →
a second only if the same blocker persists → `Needs your decision`). This receipt
is written, not committed — the verifier's no-commit limit stands.
