# External verify — feature/591-skill-discovery

2026-11-16 · **full verdict** (no prior `EXTERNAL VERIFY` receipt existed for this
unit) · read-only run: no commit, no push, no branch, no forge mutation; every
mutating probe ran on `mktemp -d` scratch copies, never on the live tree. The
head moved during the run (a concurrent session committed the journal fragment
`09821263` on top of `545b4d5d`); the final head was re-bound and every
gate-bearing command below ran at it.

```text
EXTERNAL VERIFY — base: 888aacebb39c2d64976f496e7e57a78d602c04fc · head: 098212636739dff16cf1daef85d067f90c7350a2
Blockers: 5 — B1 packages/agentic-workflow/src/skills/screen.mjs:118 (with discovery.mjs:134-136): candidate tree without <tree>/skills/ (root SKILL.md or .claude/skills layout, both installer-recognized) screens as `screened` with 0 files and installs on a `yes` — base: the route module is absent at origin/main; stability: quiet on <tree>/skills/ trees (in-domain probe excludes correctly) · B2 packages/agentic-workflow/src/runner/skills.mjs:84-93: missing or non-JSON --candidates exits 1 with a raw stack instead of the documented refusal exit 2 (`SKILLS REFUSAL`) — base: command absent at origin/main, register/inventory in the same file map the same input to exit 2 · B3 skills/skill-lint/references/CHECKS.md:4-5: "the script carries the patterns" is false after the move — base: true (patterns were inline in scripts/skill-lint.mjs) · B4 skills/skill-lint/SKILL.md:95: guardrail "the patterns live in `scripts/skill-lint.mjs`" is false after the move, and the unit SPEC's Impact promises this reference "gains a pointer to the engine" — skills/skill-lint/ is untouched by the diff — base: true · B5 docs/features/591-skill-discovery/SPEC.md:397: E4's reported command does not reproduce E4's reported output (spot-check mismatch), so every reported receipt in this unit is untrusted until the command text is corrected
Advisories: 4 — A1 docs/research/ATTRIBUTION.md:44-45: present-tense "seven mechanized checks in `scripts/skill-lint.mjs`" in historical #357 rows (the CLI still runs them; historical ledger, not a current contract) · A2 packages/agentic-workflow/src/skills/discovery.mjs:173: consent keys naming an absent candidate are silently dropped — fail-closed (never installs), so advisory · A3 packages/agentic-workflow/src/skills/discovery.mjs:143: unreadable tree + incomplete provenance reports only `provenance-incomplete`; no claim requires both reasons on one row · A4 node scripts/setup-env.mjs --check FAILS on missing .serena/cache — fresh-worktree local state, environmental, not change-caused
Sibling sweep: skills/skill-lint/references/CHECKS.md:4-5 and skills/skill-lint/SKILL.md:95 survive asserting the pre-move pattern home (blockers B3/B4); docs/research/ATTRIBUTION.md:44-45 advisory (A1) — every other sibling checked clean: bin usage line, RUNNER_COMMANDS table + dispatch test, crate README usage/Commands rows and both grammars, RUNNER.md row, AGENTS.md normative-surfaces rows, GATE_INVENTORY surfaces cell, product-audit Installed tooling dimension, ROADMAP row 591, template note, budgets manifest re-pins, discovery/register vocabularies
Completeness: S1-S7 resolved — every S# has tasks carrying (Implements: S#) and every declared validator re-ran green here (phase-lint PASS, the four skills suites + cli.surface, skill-lint suite 20/0, differential byte-identical, budgets PASS ×2, normative-drift 21/0, changeset ok, docs-generate PASS, ATTRIBUTION ≥2, verify exit 0, local-gate PASS) | open ids: none — B1/B5 are claim-coverage failures inside green validators, not unresolved S#s
Spot check: cd packages/agentic-workflow && bun test test/skills.screen.test.mjs test/skills.discovery.test.mjs packages/agentic-workflow/test/skills.register.test.mjs test/skills.cli.test.mjs packages/agentic-workflow/test/cli.surface.test.mjs → mismatch — observed 30 pass / 3 files, reported (E4) 42 pass / 5 files: the two `packages/agentic-workflow/…` filters match no file from that cwd, so the receipt's command as printed never ran the register and cli.surface suites; under consistent relative paths the same five suites give 42 pass / 0 fail
Verdict: NEEDS-DECISION (B1, B2, B3, B4, B5)
```

## Blockers — reproducer and smallest action (route to `/aw-local-apply`)

| id | file:line | reproducer (scratch only) | base vs head | smallest action |
|---|---|---|---|---|
| B1 | `packages/agentic-workflow/src/skills/screen.mjs:118`, `packages/agentic-workflow/src/skills/discovery.mjs:134-136` | candidate checkout with `SKILL.md` at the tree root (or under `.claude/skills/`) carrying `<!-- prose instruction -->`, manifest `tree` = that checkout, consent `yes` → `CANDIDATE … — install · screen screened`, `install: npx skills add …`, exit 0, `--json` shows `screen.files: 0`; an existing empty directory likewise reads `screened` | `git show origin/main:packages/agentic-workflow/src/skills/discovery.mjs` → absent; the route and its `screened` receipt are new here. Stability: quiet when `<tree>/skills/` exists (probe: hidden comment under `skills/` → `excluded`, `FINDING SL-01 …:7`, `blocked`, exit 1). The installer whose text the route prints accepts root/`.claude/skills`/`.agents/skills` layouts, so AC-S3 and O2 fail as written on realistic input | a screen that scanned 0 files must not yield `screened` (exclude with a named reason), and/or the walk covers the installer-recognized skill locations |
| B2 | `packages/agentic-workflow/src/runner/skills.mjs:84-93` | `agentic-workflow skills discover --candidates /missing.json` → raw ENOENT stack, exit 1; `--candidates` on `{ not json` → raw SyntaxError stack, exit 1 | command absent at base; the same file's `register`/`inventory` map a missing file to `SKILLS REFUSAL` exit 2, and a parseable-but-wrong manifest already maps to a refusal inside `discover` — exit 1 also collides with discover's documented "consented candidate blocked" | wrap `discover`'s input read/JSON.parse in the same `SkillDiscoveryRefusal` mapping the sibling verbs use |
| B3 | `skills/skill-lint/references/CHECKS.md:4-5` | read "the script carries the patterns" against `head:scripts/skill-lint.mjs` (patterns are gone; engine is `packages/agentic-workflow/src/skills/screen.mjs`) | true at base, false at head | name the crate engine as pattern carrier, the script as this repo's CLI |
| B4 | `skills/skill-lint/SKILL.md:95` | guardrail sends an editor to `scripts/skill-lint.mjs` for patterns that no longer live there; SPEC Impact promises this reference "gains a pointer to the engine" and the diff never touches `skills/skill-lint/` | true at base, false at head | rewrite the clause to point at the engine (delivering the promised pointer) |
| B5 | `docs/features/591-skill-discovery/SPEC.md:397` | re-run E4's command verbatim → 30 pass / 3 files vs reported 42 pass / 5 files | receipt added by this diff; base has no such line | correct E4's command to consistent relative paths and re-run (42 pass / 0 fail observed under corrected invocation) |

## Verdict evidence (commands re-run here)

- `bun scripts/local-gate.mjs --skip-network --no-bail --jobs auto` → exit 0 ·
  `PASS — 15 step(s) in 846s` at head `09821263` (the four network steps skipped
  by flag, as G1/G3 recorded; the pre-existing `dependency-pin-gate` drift is the
  unit's disclosed known issue).
- `cd packages/agentic-workflow && bun run test` → exit 0 · 974 pass / 0 fail.
- `bun test scripts/skill-lint.test.mjs` → exit 0 · 20 pass; differential (base
  copy from `origin/main` vs head copy, `mktemp -d`, dirty + clean + usage
  corpus) → identical stdout/stderr, exits 1/0/2, zero differing line.
- The four skills suites + `cli.surface` under consistent paths → 42 pass / 0 fail.
- `bun scripts/check-skill-context.mjs` and `--documents` → exit 0 (PASS ×2).
- `bun test scripts/normative-drift.test.mjs` 21/0 · `bun scripts/prose-gate-inventory.mjs`
  PASS · `bun test scripts/ledger-ownership.test.mjs` 14/0 · `bun scripts/invocation-drift.mjs` PASS.
- `bun scripts/lint-changeset.mjs .changeset/591-skill-discovery.md` ok ·
  `bun scripts/docs-generate.mjs --check` PASS · `rg -c '#591' docs/research/ATTRIBUTION.md` → 2.
- `phase-lint docs/features/591-skill-discovery/SPEC.md` PASS (fingerprint
  `d8db688d…`) · `verify docs/features/591-skill-discovery/SPEC.md` exit 0.
- Own probes (not the writer's tests): hidden-comment exclusion with cited
  `path:line` and `blocked` exit 1; provenance exclusion; read-only digest
  unchanged across `discover`; decline-all byte-identical; register create/append
  + duplicate and incomplete refusals with bytes unchanged; inventory four states
  (`ok`/`unpinned`/`stale`/`incomplete`), `attention` exit 1, deterministic
  `--json`; unknown flag / no verb → exit 2; no spawn or network import in
  `src/skills/`. PR #594 open against `main`.

Corrections belong to `/aw-local-apply` (one blockers-only batch → one recheck).
This receipt is left uncommitted — the run had no commit permission.
