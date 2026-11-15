# External verify — unit 537 (deterministic-tool-doctor)

EXTERNAL VERIFY — 2026-11-15 — base: 6f3bb8a0b8bbffb5827374ba8a1eb1f3f140629c · head: 1c6f67f2012bb5dca8336c1189b185820508e05b
Blockers: 5
- B1 — docs/features/537-deterministic-tool-doctor/SPEC.md:199-201 (AC-S2), :225
  (AC-S6), :262 (P2) and :293-295 (P5); planning-obligations.md:16-17 (O1, O2) and
  :30-34 (O15–O19) — the declared package-scoped commands do not exit 0 as written.
  Reproducer: `cd packages/agentic-workflow && bun test test/doctor.cli.test.mjs`
  → exit 1 (1–2 tests `timed out after 5000ms`, counts vary with load);
  `bun test test/doctor.wizard.test.mjs` → exit 1 (3–4 timeouts); the four-suite
  plain run → exit 1 (34 pass / 4 fail). Each test spawns the real bin ~2.7s
  (host probes: `serena --version` seconds on a cold interpreter, `gh auth
  status`, engram `/health`), so every multi-spawn case crosses bun's 5s default.
  Base-vs-head: the four suites and `src/doctor/` are absent at base
  (`git ls-tree origin/main -- packages/agentic-workflow/test/doctor.cli.test.mjs`
  → empty); pre-existing spawn-heavy suites pass plain (provision.cli 13/13,
  section.cli 12/12, resources 30/30), so the reproducer is quiet on untouched
  code. Green side: the package suite `bun run --cwd packages/agentic-workflow
  test` (`--timeout=30000`) → 794 pass / 0 fail / 46 files, matching E2, and the
  full gate re-ran exit 0 at the final head. Smallest action: give the
  multi-spawn tests an in-test budget (precedent `test/doc.structure.test.mjs`
  `{ timeout: … }`) or re-declare the AC/ledger checks with the suite's
  `--timeout=30000`, then re-run them.
- B2 — scripts/setup-env.mjs:66 — surviving old-truth usage line (sibling class).
  ` *   node scripts/setup-env.mjs [--check]` still asserts the pre-change
  surface while the same file's header (:10-18, added by this change) and its
  three refusal messages (:608, :612, :616) document `--doctor [--json]`.
  Reproducer: `sed -n '64,67p' scripts/setup-env.mjs` vs
  `git show origin/main:scripts/setup-env.mjs | rg -n 'Usage' -A1`. Base-vs-head:
  at base both narrations agree on `[--check]`; at head they contradict inside
  one file — change-caused. Smallest action: update :66 to
  `[--check | --doctor [--json]]`.
- B3 — SPEC.md:394 (E3), :423 (P6), :489 (regression-scope row) — the recorded
  differential receipt claims `setup-env --nope` / "refusal rows" byte-identical
  to base; at head the refusal stderr differs. Reproducer (scratch, both sides
  `git archive`d into `mktemp -d`): `node scripts/setup-env.mjs --nope` → base
  stderr `usage: node scripts/setup-env.mjs [--check]`, head
  `usage: node scripts/setup-env.mjs [--check | --doctor [--json]]` (stdout empty
  both, exit 2 both); `--check` itself is byte-identical stdout, stderr and exit
  (1 on this host). Base-vs-head: the message changed in `315b831e` (P7, after
  E3 was recorded at 14:10) and the receipt was never refreshed, so E3/P6's
  stated outcome no longer reproduces at head. Smallest action: refresh the
  differential at head and amend E3, P6 and the regression row to declare the
  usage-line delta (byte-identity holds for `--check`).
- B4 — SPEC.md:232 (AC-S7) — declared check `rg -n 'agentic-workflow doctor'
  skills/init-workspace` matches ≥1. Reproducer: the command → exit 1, 0
  matches; the phrase exists only in docs/workflow/SETUP.md:17,36, while
  init-workspace carries `bunx @gtrabanco/agentic-workflow@<pin> doctor --json`
  (skills/init-workspace/SKILL.md:88-89,
  skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md:5-6). Base-vs-head:
  check and target are both new in this change; the need (the skill names the
  envelope) is met, the literal check is not. Smallest action: aim the check at
  the phrase the skill carries (`doctor --json`) or use the literal
  `agentic-workflow doctor` in one init-workspace mention.
- B5 — SPEC.md:211 (AC-S4) and planning-obligations.md:18 (O3, status
  `verified`) — absolute claims contradicted by the unit's own corpus:
  "no test touches the host's real binaries, HTTP endpoints or git config" /
  "no suite reads the host's real binaries … a machine without any tool still
  runs the whole corpus". Contradicted by
  packages/agentic-workflow/test/doctor.cli.test.mjs:6 ("The probes are the real
  ones"), test/doctor.wizard.test.mjs:22 and :67-161 (real bin spawns; all six
  cases skip when git is absent), src/doctor/probes.mjs:97-105 (`gh auth status`
  — host binary plus network), :113-119 (engram `/health` HTTP) and :74 (host
  PATH binaries). Base-vs-head: all four surfaces are new; the contradiction is
  internal to head (the AC's own Check over checks+inventory is green).
  Smallest action: re-scope AC-S4 and O3 to the contract suites (checks +
  inventory, injected `ops`) and state that the two CLI boundary suites run
  real probes against `--root` scratch trees, as their headers already do;
  qualify the machine-without-tools consequence (the wizard skips without git).
Advisories: 2
- SPEC.md:175 — Known pre-existing issues still says
  `SKILL_CONTEXT_BUDGETS.json` declares `machineLines: 137` in the present
  tense; this change's own re-pin set it to 142 (measured green here: AGENTS.md
  705 lines / 142 machine / 563 prose / 12,204 est). The paragraph does flag the
  re-pin as this unit's write, so intent is clear — the sentence reads stale.
- SPEC.md:116 — "`rg -c 'retire' <this change>` is 0 by construction" returns 4
  when run over the whole diff (all four hits inside this SPEC's own
  Retirements prose, :116 included); scoped to product surfaces
  (`git diff origin/main...HEAD -- packages scripts skills template .changeset
  README.md AGENTS.md docs/workflow docs/generated docs/ROADMAP.md | rg -ci
  retire`) it is 0, so the intent — no name removed — holds; the snippet is
  self-referential as written.
Sibling sweep: list — B2 (scripts/setup-env.mjs:66) is the one surviving
old-truth mention. Clean elsewhere: the bin usage line and the crate README
(`cli.surface.test` green), the projection's `CRATE_COMMANDS`, the
`SKILL_CONTEXT_BUDGETS.json` re-pins (AGENTS 142, GATE_INVENTORY 72 — measured
green), GATE_INVENTORY's `tool-doctor-carrier` row plus the five normative rows
(normative-drift 21 pass, prose-gate-inventory 22 pass), ROADMAP row 537
(docs-generate PASS), the init-workspace six-path reference allowlist
untouched, SETUP.md updated in step; `docs/research/2026-11-13-tool-doctor-inventory.md:55`
("rg is assumed, never checked") is a dated spike record, not a current-truth
claim.
Completeness: S1–S10 all resolve to tasks carrying `(Implements: S#)`
(phase-lint PASS, 9/9 tasks, 6/6 each) | open ids: P2, P5 (validators, B1), P6
(evidence E3, B3), AC-S4 and AC-S7 checks (B5, B4), obligations O1, O2,
O15–O19 (B1) and O3's claim text (B5); O4–O14 and O20–O22 re-ran green here —
checks+inventory 26 pass plain, setup-env 78 pass, drift 21, prose-gate 22,
docs-generate PASS, lint-changeset `ok 537-deterministic-tool-doctor.md`,
`verify` PASS, phase-lint PASS, red-first proven (tests at `61cef010` with
`src/doctor/` absent), local-gate exit 0 (crate suite 794 pass / 0 fail / 46
files) at both heads observed.
Spot check: `bun test --timeout=10000 scripts/setup-env.test.mjs` → 78 pass /
0 fail / exit 0 — match with E6.
Verdict: NEEDS-DECISION (5 open blockers — B1 declared per-file checks fail
under the plain `bun test` invocation, B2 stale usage line, B3 stale
differential receipt, B4 AC-S7 rg check 0 matches, B5 AC-S4/O3 claims
contradicted by the corpus)

Receipt note: written by the external-verify session into this file only — no
commit, no push, no branch, no forge mutation, no code edit; the corrections
belong to `/aw-local-apply`. Conduct: every mutating path the change introduces
(the wizard's delegated installers) was exercised only by the suite's `mktemp -d`
fixtures and never against the live tree; the verifier's own `doctor`/`setup`
runs used `--root <scratch>` and left both the scratch tree and `git status`
byte-identical, and `setup-env --check`/`--doctor` ran from `git archive`
copies in scratch. The declared gate `bun scripts/local-gate.mjs` (P9's
validator) ran against the live tree as the repo's own pre-existing command and
exited 0 twice, leaving no tracked mutation. State note: head moved mid-run —
`07fdef01` (bound at session start) → `1c6f67f2` (another session's docs-only
journal-fragment commit, 2026-11-15 10:12:26 UTC); the delta is one file,
`.agentic-workflow/journal/…narrative-01a1dc55….md`, which touches none of the
verified surfaces, and the full gate was re-run at the final head (exit 0).
