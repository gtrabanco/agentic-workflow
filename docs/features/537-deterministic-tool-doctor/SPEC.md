---
type: feature
scope: large
roadmap_summary: `agentic-workflow doctor` + `setup` — one read-only checker over 14 documented tool surfaces with real evidence (path, version, version pair, health, config state), a closed install-route vocabulary, and a consent-gated wizard that only asks where a write or a real decision exists. Closes the silent-degradation gap (un-armed shared-merge drivers, missing `pre-push` hook, a stale engram server) and gives `setup-env.mjs` and `init-workspace` one envelope to consume
---

# 537 — deterministic-tool-doctor

> One deterministic doctor + setup wizard in the `agentic-workflow` bin: a
> read-only checker that observes every tool surface with real evidence, and a
> consent-gated wizard that only asks where a write or a real decision exists.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#537` — tracked issue in the project's forge. The PR must close it via
`Closes #537` in the body.

## Specs

**S1 — the owner's turn text: apply issue #537.**
> Apply to this repository: issue #537

**S2 — one deterministic doctor + setup wizard as subcommands of the existing bin.**
> This feature delivers **one deterministic doctor + setup wizard** as subcommands of the existing `agentic-workflow` bin: a read-only checker that observes every tool surface with real evidence (path, version, version pairs, health probes, config state), and a consent-gated wizard that only asks where a write or a real decision exists.

**S3 — the delimitation rule decides generic vs pi-specific vs instruct-only.**
> **Delimitation rule (from the spike):** generic = observable without a live agent session (files, binaries, HTTP endpoints, `git config`, hooks); pi-specific = session semantics (engram store ownership, caller binding) or maintainer-curated pairing knowledge; instruct-only = operator shell / host package manager.

**S4 — the checker's surfaces and their evidence.**
> **Checker (`doctor@1` module in the crate, twin of `resources/detect.mjs`: read-only, injectable probes, own contract id):** node/bun (+`.bun-version` pair), rg (gap today), git identity, gh auth, serena (binary + `.serena/project.yml` language_servers + `project.local.yml`), engram binary + served-version pair via `GET /health` (the 2026-11-13 gap), pi `settings.json` companion pin, agent-adapter MCP config scan (read-only, never overwrite), git hooks + shared-merge-driver arming.

**S5 — a closed install-route vocabulary.**
> **Closed `install-route` vocabulary** in the schema package or as crate `schema-export` consts (precedent: `PATH_GUARD_REASONS` in `crate/src/path-policy.mjs`).

**S6 — the wizard layer: one move per check row, ask-first, feedback tiers.**
> **Wizard layer:** each check row maps to one move of a closed vocabulary (report-only / ask-consent-write / instruct-only / residual — same shape as `capability-inventory@1`); ask-first contract per `init-workspace`'s existing rules (one decision per question, nothing written without an explicit yes, second run is a no-op, instruct-only carries the exact command and is re-verified afterwards); feedback follows #424's tiers.

**S7 — one checker, two carriers.**
> **One checker, two carriers:** this repo's `setup-env.mjs` and `init-workspace` consume the same doctor envelope; the carrier mapping is owned by `GATE_INVENTORY.md`.

**S8 — the README tool inventory, validated rather than duplicated.**
> **README tool inventory**: the README documents every default third-party tool (what, why, required/optional, how detected, alternative); the doctor validates the documented inventory rather than duplicating it (docs-driven applied to tools).

**S9 — the acceptance the change must satisfy.**
> - From a clean target project with the skills installed, `bunx @gtrabanco/agentic-workflow@<train-version> doctor` (or the pre-#352 equivalent) emits the fixed envelope with real evidence for every in-scope surface, and a healthy + consented setup produces **no** remediation advisory at all.
> - The wizard never writes without an explicit consent answer, never overwrites an operator's existing declaration, re-verifies instruct-only items with the same checker, and its second run is a proven no-op.
> - Every new vocabulary (check status, install route, wizard move) is a named normative surface bound by the drift gate; every new script ships its sibling suite red-first.
> - Un-armed hooks/drivers, tool absences and version-pair mismatches are each detected with evidence, never silently.

**S10 — out of scope.**
> - Sustitutibility of third-party tools by user preference (memory provider, search, LSP alternatives) — deferred via the unified config policy (#427's four questions); recorded as a future decision when there are more users.
> - Session-level diagnostics (engram `mem_doctor`, caller binding) — they stay owned by the pi extension; the doctor reports them as session-level checks with a pointer.
> - PI WEB daemon inspection/repair — repo rule forbids touching the hosting daemon.
> - Any ceremony or sensor migration — owned by #352.

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words.
S1 is the owner's turn text verbatim; S2–S10 quote the tracked issue's own
sections verbatim at the pinned revision (the issue is the request's referent,
so its words are the request's words — nothing is paraphrased).

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

What the change touches beyond the new module:

- **The bin's surface is shared.** `packages/agentic-workflow/test/cli.surface.test.mjs`
  pins the bin's usage line to the crate README token for token and demands one
  Commands row per dispatched subcommand, so `doctor` and `setup` enter all
  three places in the same change.
- **`scripts/setup-env.mjs` is a shipped contract.** Its `--check` output and
  exit codes are pinned by `scripts/setup-env.test.mjs`; the carrier route is an
  added mode, and the existing mode's bytes must not move (differential check).
- **`skills/init-workspace` is a consumption surface**, not a second detector:
  its discovery step names the envelope and stops re-deriving per-tool state.
- **Two normative tables change**: `AGENTS.md`'s `normative-surfaces@1` gains the
  four new surfaces, `docs/workflow/GATE_INVENTORY.md` gains the carrier rows —
  and the guide's `machineLines` budget re-pin follows, since that gate refuses
  an un-re-pinned machine block.
- **`docs/ROADMAP.md` row 537** moves out of `idea` through the crate's writer,
  and `docs/generated/**` is re-rendered by its emitter, never by hand.
- **What stops being true**: the research note's "gaps the spike surfaced"
  become checked surfaces; `setup-env.mjs`'s hardcoded engram/bun/serena routes
  stay where they are (the doctor names routes from the documented inventory and
  never runs a package manager), so no prose about those routes is retired here.

## Retirements

Strictly additive: nothing is retired. The surfaces this unit adds and their
named consumers (the anti-divergence inventory, so each added surface has a
consumer rather than an orphan):

| added surface | named consumer |
|---|---|
| `src/doctor/*.mjs` (checker + wizard) | the bin's `doctor` and `setup` subcommands |
| the `doctor@1` envelope | `scripts/setup-env.mjs --doctor`, `skills/init-workspace` discovery step |
| `DOCTOR_CHECK_STATUSES` / `INSTALL_ROUTES` / `WIZARD_MOVES` | the drift gate's `normative-surfaces@1` rows |
| `tool-inventory@1` (crate README block) | the checker's own inventory parser (the doctor refuses when the doc and the probes disagree) |
| `COMPANION_PAIRINGS` (crate) | the `gentle-engram` check's curated pair |

`rg -c 'retire' <this change>` is 0 by construction: no name is removed.

## Non-goals

- Substitutibility of third-party tools by user preference (S10) — no new config
  key, so the unified-config four questions are not opened by this unit.
- Session-level diagnostics and engram ownership (S10): the doctor reports the
  pointer, the pi extension keeps owning the decision.
- PI WEB daemon inspection or repair (S10).
- Ceremony, sensor or skill migration (S10).
- The wizard never installs a package: the closed vocabulary names the route and
  the exact command; running a host package manager stays an operator action
  (S3's `instruct-only`). This is the deliberate boundary the 2026-11-13 spike
  drew and it keeps the wizard's write surface file-scoped.

## Risk tier

- **Tier** — `standard` · **Task Size** — `large` (the issue's own size; the
  work is new read-only code plus a consent-gated writer, no schema change)
- **Named high-risk item** — none — not a high-tier unit. The one mutating path
  (the wizard's delegated installers) is bound by explicit consent, a recorded
  ledger row, and a re-verify with the same checker, and it is exercised in
  scratch fixtures before the live tree.

## Future

none

## Future cost

- **The `tool-inventory@1` block is a contract.** Whoever adds or removes a
  checked surface updates the crate README row and the probe registry in the
  same change; the suite refuses either half alone. Binds: future doctor work.
- **The companion↔core pairing table is maintainer-owned.** A `gentle-engram`
  release that needs a different `engram` core updates
  `COMPANION_PAIRINGS` in the same release; the check reports a mismatch as an
  advisory, never a failure, so a stale row is visible rather than blocking.
  Binds: the release that bumps either side.
- **The check-status, install-route and wizard-move vocabularies are published.**
  A new value enters the source const, the normative-surface row already covers
  it, and no second list may restate it. Binds: future doctor work.

## Applicable tests

- `packages/agentic-workflow/test/doctor.checks.test.mjs` — the checker's
  contract with injected probes: every status, the version-pair mismatch, the
  applicability rule, the advisory rule, the exit mapping.
- `packages/agentic-workflow/test/doctor.inventory.test.mjs` — the documented
  inventory and the probes agree in both directions, and a drift refuses.
- `packages/agentic-workflow/test/doctor.cli.test.mjs` — the bin's surface: the
  `doctor` envelope, its exit codes, and that it writes nothing.
- `packages/agentic-workflow/test/doctor.wizard.test.mjs` — consent, the
  no-overwrite rule, the delegated installer, the second run's no-op, and the
  re-verify.
- `scripts/setup-env.test.mjs` — the carrier mode plus the unchanged `--check`.

## Known pre-existing issues

- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` declares `AGENTS.md`
  `machineLines: 137`. Adding rows to `normative-surfaces@1` changes that
  number; the re-pin is part of this change with its source recorded, exactly
  the procedure the manifest declares. Affects: yes (it is this unit's write).
- `scripts/local-gate.mjs`'s shared-document merge drivers are unarmed in a
  fresh worktree (`git config merge.agentic-shared-*.driver` unset here); that
  is the degradation this unit detects, not a defect it introduces. Affects:
  no — the doctor reports it, nothing in this unit arms it silently.
- The engram server on this machine answers on `127.0.0.1:7437` with version
  3.7.1 while the binary is 3.7.1: the pair agrees today. Affects: no — it is
  the evidence that the pair check reports `ok` on a healthy host (PE-006).

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers froze in this document's folder before the first line of
  code, and the work arrives as conventional commits against `main`.
  Check: `ls docs/features/537-deterministic-tool-doctor/` lists `SPEC.md`,
  `planning-evidence.md` and `planning-obligations.md`; `git log --oneline
  origin/main..HEAD` shows the unit's own conventional commits.
- **AC-S2** — `agentic-workflow doctor` is one read-only subcommand of the
  existing bin that prints the fixed `doctor@1` envelope (with `--json`, the
  same envelope as JSON), carries real evidence per row (path, version,
  version pair, health, config state) and writes nothing, and `agentic-workflow
  setup` is the consent-gated wizard over the same envelope.
  Check: `bun test test/doctor.cli.test.mjs` exits 0 (envelope shape and
  contract id, one row per documented surface, the fixture tree byte-identical
  after `doctor`) and `bun test test/doctor.wizard.test.mjs` exits 0.
- **AC-S3** — Every surface the issue lists is a check with its own evidence,
  and the delimitation rule is enforced in code: a surface that needs a live
  session (engram ownership) or maintainer knowledge (the companion pair) is
  reported with a pointer, and an install is `instruct-only` — the doctor never
  runs a package manager.
  Check: `bun test test/doctor.checks.test.mjs` exits 0 (all fourteen
  documented surfaces, the pi-specific rows carrying a pointer, no installer
  invocation in any path).
- **AC-S4** — The checker is `doctor@1`, read-only, with injectable probes: no
  test touches the host's real binaries, HTTP endpoints or git config.
  Check: `bun test test/doctor.checks.test.mjs test/doctor.inventory.test.mjs`
  exits 0 with every case driven through injected `ops`.
- **AC-S5** — The three new vocabularies are published as crate
  `schema-export` constants and each is a named `normative-surfaces@1` row the
  drift gate resolves; no prose keeps a second copy.
  Check: `bun test scripts/normative-drift.test.mjs` exits 0 and
  `rg -n 'DOCTOR_CHECK_STATUSES|INSTALL_ROUTES|WIZARD_MOVES'
  packages/agentic-workflow/src/doctor/vocabulary.mjs` matches 3.
- **AC-S6** — The wizard's moves are the closed four; nothing is written without
  an explicit yes (a non-interactive run without `--yes` writes nothing and
  says so), an existing declaration is never overwritten, an instruct-only item
  carries its exact command and is re-verified with the same checker, and the
  second run is a proven no-op.
  Check: `bun test test/doctor.wizard.test.mjs` exits 0 (consent refusal,
  no-overwrite, re-verify, second-run no-op, and the ledger row written once).
- **AC-S7** — One checker, two carriers: `scripts/setup-env.mjs --doctor`
  prints the same envelope it prints nowhere else, `init-workspace`'s discovery
  step names the envelope as its tool evidence, and `GATE_INVENTORY.md` owns the
  carrier rows.
  Check: `bun test scripts/setup-env.test.mjs` exits 0 (the carrier mode plus
  the unchanged `--check`), `rg -n 'agentic-workflow doctor' skills/init-workspace`
  matches ≥1, and `rg -n 'doctor@1' docs/workflow/GATE_INVENTORY.md` matches ≥1.
- **AC-S8** — The crate README's `tool-inventory@1` block is the single
  declaration of every default third-party tool (what, why, required/optional,
  how detected, alternative, route); the doctor reads it and refuses when the
  documented inventory and the probes disagree in either direction.
  Check: `bun test test/doctor.inventory.test.mjs` exits 0 (both directions and
  the injected-drift refusal).
- **AC-S9** — A healthy host produces zero advisories, and the defect the
  2026-11-13 incident proved — a served `engram` version that disagrees with the
  binary — is a `mismatch` carrying both versions.
  Check: `bun test test/doctor.checks.test.mjs` exits 0 (the healthy case
  asserts `advisories: 0` and `verdict: pass`; the pair case asserts `3.7.1` vs
  `3.6.0` both named).
- **AC-S10** — Un-armed hooks and shared-merge drivers are detected with
  evidence, never silently, and their applicability is decided from the
  project's own declarations (`.gitattributes`, the presence of the installer
  scripts) rather than assumed.
  Check: `bun test test/doctor.checks.test.mjs` exits 0 (the declared-but-unarmed
  cases report `unarmed` with the driver names; the undeclared case reports
  `not-applicable` with no advisory).

## Tasks

- P1 — Freeze this unit doc, its two planning ledgers and the acceptance
  criteria before the implementation lands (validator:
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/537-deterministic-tool-doctor/SPEC.md`
  exits 0 with a PASS verdict)
  (Implements: S1)
  - Relevant files: docs/features/537-deterministic-tool-doctor/SPEC.md,
    docs/features/537-deterministic-tool-doctor/planning-evidence.md,
    docs/features/537-deterministic-tool-doctor/planning-obligations.md
- P2 — RED corpus first: the four `doctor.*.test.mjs` suites land as checks
  observed failing on the pre-change tree, and the red run is recorded in
  `## Log` before any module exists (validator: `bun test test/doctor.checks.test.mjs
  test/doctor.inventory.test.mjs test/doctor.wizard.test.mjs test/doctor.cli.test.mjs`
  exits 0 only after P3–P5, and the red run's failure is recorded as an `E`
  line)
  (Implements: S2, S4, S9)
  - Relevant files: packages/agentic-workflow/test/doctor.checks.test.mjs,
    packages/agentic-workflow/test/doctor.inventory.test.mjs,
    packages/agentic-workflow/test/doctor.wizard.test.mjs,
    packages/agentic-workflow/test/doctor.cli.test.mjs
- P3 — The vocabulary and the documented inventory: `vocabulary.mjs` publishes
  the three closed sets plus the contract id and the curated companion pair;
  `inventory.mjs` parses the crate README's `tool-inventory@1` block and
  refuses a document that disagrees with the probe registry (validator:
  `bun test test/doctor.inventory.test.mjs` exits 0)
  (Implements: S5, S8)
  - Relevant files: packages/agentic-workflow/src/doctor/vocabulary.mjs,
    packages/agentic-workflow/src/doctor/inventory.mjs,
    packages/agentic-workflow/README.md
- P4 — The checker: the fourteen surface probes with injectable ops, the pure
  evaluators, the applicability rule, the advisory rule and the envelope
  (validator: `bun test test/doctor.checks.test.mjs` exits 0)
  (Implements: S2, S3, S4, S9, S10)
  - Relevant files: packages/agentic-workflow/src/doctor/checks.mjs,
    packages/agentic-workflow/src/doctor/probes.mjs,
    packages/agentic-workflow/src/doctor/doctor.mjs
- P5 — The wizard plus the bin wiring: the four moves, the consent contract,
  the delegated installer, the re-verify, the `doctor`/`setup` subcommands and
  the usage line (validator: `bun test test/doctor.cli.test.mjs
  test/doctor.wizard.test.mjs` exits 0)
  (Implements: S2, S6)
  - Relevant files: packages/agentic-workflow/src/doctor/wizard.mjs,
    packages/agentic-workflow/bin/agentic-workflow.mjs,
    packages/agentic-workflow/README.md
- P6 — Differential check: the same corpus (the `doctor`/`setup` argv matrix and
  `scripts/setup-env.mjs --check`/`--doctor`) driven against a copy of the base
  commit and against this change in `mktemp -d`, with every difference declared
  (validator: the harness diff contains only the declared additions — the two
  subcommands, the carrier mode — and `scripts/setup-env.mjs --check` output is
  byte-identical to the base, so the harness exits 0 with zero undeclared line)
  (Implements: S2, S7)
- P7 — The carriers: `scripts/setup-env.mjs --doctor [--json]` consumes the
  same module, the `init-workspace` discovery step names the envelope instead of
  re-deriving per-tool state, and `GATE_INVENTORY.md` owns the carrier rows
  (validator: `bun test scripts/setup-env.test.mjs` exits 0 and
  `rg -n 'doctor@1' docs/workflow/GATE_INVENTORY.md` matches ≥1)
  (Implements: S7)
  - Relevant files: scripts/setup-env.mjs, scripts/setup-env.test.mjs,
    skills/init-workspace/SKILL.md,
    skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md,
    docs/workflow/GATE_INVENTORY.md
- P8 — The normative surfaces and the declared docs: four
  `normative-surfaces@1` rows, the guide's `machineLines` re-pin with its
  source, the crate README's `doctor`/`setup` sections and the
  `doctor-envelope@1` block, the root README's tool pointer,
  `docs/workflow/SETUP.md`, and the changeset intent (validator:
  `bun test scripts/normative-drift.test.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S5, S8, S9)
  - Relevant files: AGENTS.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json,
    README.md, docs/workflow/SETUP.md,
    .changeset/537-deterministic-tool-doctor.md
- P9 — Repository state and verification: the roadmap row moves through the
  crate's writer, the projection is re-rendered, the session entry is appended,
  and every declared gate runs in the foreground (validator:
  `bun scripts/local-gate.mjs` exits 0, `bun scripts/docs-generate.mjs --check`
  exits 0 and `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/features/537-deterministic-tool-doctor/SPEC.md` exits 0)
  (Implements: S1, S9)
  - Relevant files: docs/ROADMAP.md, docs/generated/, docs/LOGS.md

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line, and `phase-lint` refuses a bullet
with no link, a link to an undeclared id, and a base requirement no bullet
implements.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

M/L unit: the ledger is frozen beside this document as
[`planning-evidence.md`](planning-evidence.md) (`PE-001`…`PE-014`), never
embedded here.

### Obligations

M/L unit: the ledger is frozen beside this document as
[`planning-obligations.md`](planning-obligations.md) (`O1`…`O22`), never
embedded here. Every row is `verified` before the handoff.

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery. The declared deterministic gates (tests, lints) run in the foreground.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the owner's request, verbatim:
  ```
  Apply to this repository: issue #537
  ```
- **L2** — 2026-11-14, the tracked issue's goal and acceptance, verbatim (body
  as filed; labels `promoted`, `feature`; blocked-by #352 and #424, both closed):
  ```
  This feature delivers **one deterministic doctor + setup wizard** as subcommands of the existing `agentic-workflow` bin: a read-only checker that observes every tool surface with real evidence (path, version, version pairs, health probes, config state), and a consent-gated wizard that only asks where a write or a real decision exists.
  ```
- **E1** — 2026-11-14, the RED corpus (P2), `bun test test/doctor.checks.test.mjs
  test/doctor.inventory.test.mjs test/doctor.cli.test.mjs
  test/doctor.wizard.test.mjs` · exit 1 · `0 pass / 9 fail / 3 errors`, every
  failure `Cannot find module '../src/doctor/*.mjs'` (commit `61cef010`).
- **E2** — 2026-11-14, the crate suite after the corpus calibration (fixture
  fidelity: rows carry no leading pipe, the fake's closures see a removed path,
  the advisory carries its command) · `bun run --cwd packages/agentic-workflow
  test` · exit 0 · `794 pass / 0 fail / 46 files` (208.77s standalone).
- **E3** — 2026-11-14, the differential harness (P6) in `mktemp -d`, base
  `origin/main` vs this change over ten argv cases · exit 0 · `7/10 identical ·
  differing: usage line (no command), doctor, setup (no consent)` — each one a
  declared delta: the usage line gains `doctor|setup`, and the base tree refuses
  both with `EDIT REFUSAL — Unknown service: <name>` (exit 2) where the change
  answers the envelope (exit 0). `setup-env --check`, `setup-env --nope`,
  `phase-lint`, `verify`, `resolve-passes`, `journal aggregate --check` and
  `diff-guard` are byte-identical.
- **E4** — 2026-11-14, the surface gates · `bun test --timeout=10000
  scripts/normative-drift.test.mjs` exit 0 (21 pass) and `bun test
  --timeout=10000 scripts/prose-gate-inventory.test.mjs` exit 0 (22 pass).
- **E5** — 2026-11-14, the budgets · `bun scripts/check-skill-context.mjs
  --documents` PASS (AGENTS.md 705 lines / 142 machine / 563 prose / 12,204 est)
  and `bun scripts/check-skill-context.mjs` PASS (30 skills);
  `bun scripts/skill-lint.mjs` PASS (0 findings).
- **E6** — 2026-11-14, the carriers · `bun test --timeout=10000
  scripts/setup-env.test.mjs` exit 0 (78 pass, including the `--doctor` envelope
  and the `--check`/`--doctor` refusal).
- **E7** — 2026-11-14, repository state · `bun scripts/docs-generate.mjs --check`
  PASS (3 files, 0 stale; roadmap unchanged) and `bun scripts/lint-changeset.mjs`
  exit 0 (`ok 537-deterministic-tool-doctor.md`).
- **E8** — 2026-11-14, the projection pin · `node --test
  --test-timeout=10000 test/projection.test.mjs` in `packages/pi-agentic-workflow`
  exit 0 (19 pass) — `CRATE_COMMANDS` follows the crate's dispatch, as its own
  comment requires.
- **P1** — 2026-11-14 12:00, the unit doc, both ledgers and the acceptance
  criteria frozen · `065af558`.
- **P2** — 2026-11-14 12:20, the four suites landed red (see E1) · `61cef010`.
- **P3** — 2026-11-14 13:05, the vocabularies, the inventory parser and the
  documented `tool-inventory@1` block · `d950ad29`.
- **P4** — 2026-11-14 13:05, the fourteen probes, the evaluators and the
  `doctor@1` envelope (same commit as P3).
- **P5** — 2026-11-14 13:40, the wizard and the bin wiring (`doctor`, `setup`) ·
  `439f3fe9`.
- **P6** — 2026-11-14 14:10, the differential harness (see E3) — no undeclared
  difference.
- **P7** — 2026-11-14 14:30, the two carriers (`setup-env --doctor`,
  `init-workspace`'s discovery step) and the gate-inventory carrier row ·
  `315b831e`.
- **P8** — 2026-11-14 15:00, the five normative rows, the two budget re-pins, the
  SETUP/README currency and the changeset · `763a2fb6`.
- **P9** — 2026-11-14 15:20, the roadmap row through the crate's writer and the
  rendered projection · `20663752`; the projection's `CRATE_COMMANDS` follows the
  crate's dispatch · `c65530c8`.
- **G1** — 2026-11-14, `bun scripts/local-gate.mjs` · HEAD 95974c214ca68394e9ee2ee5939de373c6f7996f · exit 0 · `PASS — 19 step(s) in 331s`: workspace install, schema build, the crate
  suite under bun and node (794 pass / 0 fail each), the root gate (113 suites),
  version-parity-content, the docs projection, the journal carrier lint, log
  immutability, secret scan, temp hygiene, worktree guard, rigidity review, the
  two node-compat legs, and the dependency pins. HEAD is the changeset/fragment
  commit at the time of the run — it carried the integration of `origin/main`
  (6f3bb8a0) that made the branch's diff the unit's own, and the only commit that
  follows it is this prose receipt: disclosed, never implied.
- **E9** — 2026-11-14, the startup regression the first two gate runs exposed ·
  three root suites (`ceremony-passive`, `ceremony-unit-plan`,
  `ceremony-findings-ledger`) crossed their 10s per-test budget while spawning
  the bin dozens of times: importing the doctor modules at the top cost ~60ms
  per spawn. Measured after `0bc76a6c`'s lazy load: worktree 442–536ms vs base
  426–498ms over four runs each (within noise), and the same gate passes.
- **P10** — 2026-11-14 16:40, the doctor family loaded on demand (`0bc76a6c`),
  and G1 green at the head before it.
- **D1** — 2026-11-14, the two corpus calibrations recorded in E2 are fixture
  fidelity, not relaxed assertions: the block's rows never had a leading pipe,
  the fake's `readText`/`exists`/`listDir` close over their own maps (overriding
  the map alone changes nothing), and an advisory that recommends a command
  carries it. Every assertion the RED commit made still holds.

## Next

G1 — the full local gate at this head, then the external verdict.

## References

- Issue [#537](https://github.com/gtrabanco/agentic-workflow/issues/537) — the
  tracked issue; the PR closes it via `Closes #537`.
- `docs/research/2026-11-13-tool-doctor-inventory.md` (`fbbf336e`) — the spike
  whose thirteen rows, delimitation rule and four gaps this unit implements.
- `docs/ROADMAP.md` row 537.
- Feature 61 (`packages/agentic-workflow`) — the crate the subcommands join.
- Feature 66 (`memory probe`, issue #538) — the pi-specific half this unit
  reports a pointer to and never duplicates.
- Issue #424 — the feedback tiers the wizard adopts.

## Branch

`feat/537-new-feature-deterministic-tool-doctor-and-setup`

## Depends on

none — #352 (crate + versioned bin contract) and #424 (feedback tiers) are both
merged, so the doctor lands as subcommands of the existing bin.

## Regression scope

| scenario | verify with |
|---|---|
| every existing bin subcommand keeps its argv, receipt and exit codes | `bun test` in `packages/agentic-workflow` exits 0 with the pre-existing suites unchanged |
| `scripts/setup-env.mjs --check` output, exit codes and refusal rows are byte-identical to the base commit | the differential harness in `mktemp -d` reports zero difference for `--check` |
| `scripts/setup-env.mjs`'s install path is untouched (this unit adds a read-only mode) | `bun test scripts/setup-env.test.mjs` exits 0 with the pre-existing cases unchanged |
| `init-workspace` keeps loading exactly its declared reference set | `rg -n 'references/' skills/init-workspace/SKILL.md` names only the six allowlisted paths |
| the drift gate, the context budgets and the docs projection stay green | `bun scripts/local-gate.mjs` exits 0 |
