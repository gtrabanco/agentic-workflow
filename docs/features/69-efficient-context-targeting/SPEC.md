---
type: feature
scope: large
---

# 69 — efficient-context-targeting

> One-line: ripgrep-first search under an explicit gitignore contract (with a
> user-scoped ask-first bootstrap) plus per-phase `Relevant files` in the unit
> doc — target the context, not the repo. Issue #269, no JEV, ships ahead of #192.

## Objective

Ship the two quick wins of the 2026-09-29 system-one/JEV evaluation's Idea 2
that need no JEV and no embeddings (owner decision: "adopt everything relevant
that does not need JEV; `Relevant files` is **urgent**"):

- **P1 — ripgrep-first search.** `rg` becomes the default tool wherever we mean
  "grep" (agent turns, skill wording, script guidance), under an explicit
  **gitignore contract** (traversal honors `.gitignore`; a human-named path is
  always searched; `--no-ignore` only on an explicit human request), plus a
  user-scoped, ask-first, never-root bootstrap installer for `rg`.
- **P2 — per-phase `Relevant files`.** The unit doc's `Tasks` section gains a
  `Relevant files:` sub-section per phase, written at plan time, consumed by
  `execute-phase` and `review-change`, and forward-propagated when a phase
  discovers files relevant to later phases — so plan → execute → review stops
  re-reading the whole project.

One feature, two phases, one goal: **target the context, not the repo.**

## Why

Two evidence-backed gaps, both verified 2026-09-29 (full record:
`.agentic-workflow/tmp/system-one-evaluation-2026-09-29.md`):

- **Real incident:** an agent edited skills inside `node_modules`-installed
  copies because searches did not ignore `.gitignore` rules. ripgrep's default
  traversal closes this whole class of error with zero custom logic.
- **Measured on this repo (5 runs each):** scoped searches at parity
  (grep 132 ms / 95 ms vs rg 161 ms / 113 ms); broad sweep **grep 379 ms vs
  rg 109 ms — 3.5× faster**, and the gap grows with repo size.
- **Verified ripgrep 15.2 behavior** (this repo + a `git init` fixture):
  traversal respects `.gitignore`, explicit path arguments bypass it (a
  gitignored bundle dir and a gitignored `docs/` were both searched when named
  on the command line) — exactly the required contract.
- **#194 records `review-change` as the highest recurring token consumer**, and
  every unit still surveys the repo at execute time because nothing tells it
  which files the phase touches: per-phase file lists cut re-reads at the source.

## User outcome

- An agent searching a project with `rg` never silently walks `node_modules`,
  `dist` or gitignored bundles — but a path the human names is always searched,
  including directories the human chose to gitignore. On a machine without
  `rg`, the same instruction block completes through `grep` and says so.
- A maintainer can provision `rg` for a fresh machine by asking one consented,
  user-scoped installer (never `sudo`), landing in `~/.local/bin` or
  `.agentic-workflow/bin/` + the template's gitignore entry.
- Planning a unit records, per phase, the files that phase touches; execution
  and review start from that bounded set instead of a repo survey, and a file
  that is *not* listed is still always editable (logged in the Progress log).

## Acceptance criteria

1. **Gitignore contract, three legs, fixture-verified.** In a committed
   fixture repo: (a) default `rg` traversal skips a gitignored directory;
   (b) naming that directory on the command line returns its hits; (c) the only
   documented way to see ignored content is `--no-ignore` / `-u` on an explicit
   human request. Verified by a test asserting all three legs.
2. **Declared grep fallback.** With `rg` absent from `PATH`, the same search
   instruction block completes using `grep` and the wording states the fallback
   (`command -v rg` → else `grep`). Verified by running the block with an
   rg-free `PATH`.
3. **Ask-first, never-root installer.** The bootstrap (a) skips entirely when
   `rg` is already installed, (b) refuses to run as root or through `sudo`, (c)
   explains the reason and asks before installing and records the consent,
   (d) uses user-scoped package managers only (brew, `cargo install`, bun/npm
   global user prefix, pipx, scoop), (e) otherwise downloads a pinned binary to
   `~/.local/bin` when that is writable and on `$PATH`, and (f) otherwise lands
   in `.agentic-workflow/bin/` plus the gitignore entry the `init-workspace`
   template provides. Verified by tests with a fake `HOME`.
4. **Adoption surface.** Every skill/reference file in this repo whose wording
   instructs an agent to "grep" is rg-first with the fallback and the override
   rule (the pinned inventory — ~10 files — is listed in Evidence);
   `bun scripts/check-skill-context.mjs` is green; `bump-skill` ran for every
   touched skill; CHANGELOG rows exist for each.
5. **Contract-grade sweeps stay exhaustive.** Where this repo instructs an
   exhaustive/normative sweep, the instruction declares `rg --no-ignore` (or
   `grep`) so gitignored build output cannot hide matches — evidence: on the
   fixture, default `rg` misses `dist/index.d.ts` (11 vs 12 hits) while the
   declared sweep finds it. Scripts that **parse** their output keep their
   current tool for byte-stable receipts.
6. **P2 format owner.** `phase-contract` owns the `Relevant files:` sub-section
   grammar and `phase-lint` accepts a unit doc that carries it (fail-closed
   unchanged when it is absent). Verified by a test over a fixture plan.
7. **P2 bounded read set.** A fixture shows the plan step writing the
   sub-sections, `execute-phase` reading the listed files plus one-hop step
   references instead of surveying the repo, and `review-change` using the
   unit's lists as its read set *around* the git diff (git still owns the
   review scope).
8. **Never-authority discipline.** A mechanical test proves a file that is not
   listed may still be edited and that doing so is logged in the Progress log —
   a file not listed is never "out of scope".
9. **Forward propagation.** When a phase discovers files relevant to later
   phases, it appends them to those phases' sub-sections at phase close;
   documented in the owning skill and covered wherever the check is mechanical.
10. **Measured delta recorded as Evidence.** Files-read / tokens for one
    plan → execute → review cycle **with** vs **without** the sub-section
    (same bar as #192's savings AC).

## Non-goals

- **JEV / system-one decisions** — parked by the owner (evaluation record).
- **Embeddings and the retrieval index** — #192; this unit must ship and
  deliver measurable savings *before* it, and is not gated by it.
- **Graph layer** (co-change / markdown-link / LSP-reference graphs) — #192's
  amplification, not here.
- **The install wizard command itself** (`init`/`setup` in the runner crate /
  AWL) — future runner work; only the reusable bootstrap lands here.
- **Model routing / tier selection** — #201.
- **Changing scripts that parse their own output** — receipt byte-stability
  wins; only instruction wording and exhaustive sweep declarations move.
- **Editing template shell hooks to require `rg`** — POSIX `sh` hooks keep
  `grep` (they parse; `rg` is not POSIX).

## Future cost

| Rule | Binds |
|---|---|
| rg-first is the default wording for any future skill/doc instruction that means "search the repo"; `grep` only where POSIX shell or parsed receipts require it | every later skill edit — enforced by the rg-first wording discipline test added here |
| Every contract-grade exhaustive sweep declares `rg --no-ignore` (or `grep`) | anyone writing a sweep whose misses would hide gitignored build output |
| The unit doc's per-phase `Relevant files:` is written at plan time, read by execute/review, forward-propagated at phase close; its grammar changes only through `phase-contract` | the lane's plan / execute / review steps; `phase-lint` is the mechanical gate |
| Never-authority: a file not listed is never out of scope; executors may always add one, logging it in the Progress log | every executor and reviewer — enforced by the discipline test |
| The bootstrap installer never uses `sudo`/root and always asks first, user-scoped only | `init-workspace` and any future wizard / shared provisioning with #219 |

## Applicable tests

- Repository: `node --test scripts/*.test.mjs` (includes the new ripgrep
  contract fixture test, installer test, `phase-lint` `Relevant files` test and
  rg-first wording discipline test).
- `bun scripts/check-skill-context.mjs` (context budgets after skill edits).
- `bun scripts/phase-lint.mjs <fixture-plan>` for the P2 format acceptance.
- `packages/agentic-workflow` + `packages/pi-agentic-workflow`:
  `bun run test` and `bun run test:node` — only if a package file is touched.

## Known pre-existing issues

- `rg` is not POSIX and is absent on machines that never installed it —
  **does-not-affect** (AC2's declared fallback is the contract).
- pi ships `rg` at `~/.pi/agent/bin/rg`; other agents/platforms may not —
  **does-not-affect** (detection via `command -v rg`, fallback declared).
- Template shell hooks (`template/.agentic-workflow/hooks/*.sh`) call `grep`
  for parsed output — **does-not-affect** (kept deliberately; POSIX `sh` cannot
  assume `rg`).
- The Engram server on :7437 rejected writes (version mismatch 0.1.0 → 2.2.1)
  on 2026-09-29 — **does-not-affect** (this unit depends on no Engram write).
- #219 (shared ask-first provisioning) and #218 (evidence-bound findings) are
  still open ideas — **does-not-affect** (soft cross-links; this unit ships its
  own bootstrap and its own discipline test).
- **Phase-lint grammar vs the lane's unit-doc task format (research R4):**
  `scripts/phase-lint.mjs` answers `BLOCKED: no-phases` (exit 1) on every unit
  doc written by the current plan step, while `execute-phase` PREFLIGHT says to
  STOP on any exit 1 whenever `## Tasks` exists — so the pre-flight gate as
  written would block every implement step. **affects** this unit: P2 changes
  that exact format, and AC6 pins what phase-lint must accept. Owner is
  `phase-contract`; the resolution is a design/plan decision recorded here,
  never an implied scope widen.
- **`rg` is present twice on this machine** (`~/.pi/agent/bin/rg`, `/usr/bin/rg`)
  — **affects** only the shape of the AC2 test (it must construct an rg-free
  `PATH` that still contains `grep`), not the contract itself.
- **Upstream ripgrep docs do not state the explicit-path bypass** (they document
  default ignore-respect and `--no-ignore`, not the command-line-path override)
  — **does-not-affect** (the bypass is locally verified, R1, and becomes an
  executable fixture assertion in AC1 rather than a citation).
- **No committed metering tool for “files-read / tokens”** (AC10) exists yet —
  **affects** evidence collection only: the plan step must name the meter
  (byte/line counts over the recorded read set) or the AC is reported as a
  measured-approximation row; never guessed.

## Tasks

Tests come first in every phase (never change a test to pass it):

- P1 — Tests-first for P1: ripgrep contract fixture (three legs), the rg-absent
  grep-fallback run, and the installer behaviors (fake `HOME`, root refusal,
  consent record, `~/.local/bin` → `.agentic-workflow/bin` fallback) — red
  against code that does not exist yet.
- P2 — Implement the rg-first wording contract over the pinned adoption surface
  (skill/reference files + script guidance): default `rg`, declared `grep`
  fallback, `--no-ignore` only on explicit human request.
- P3 — Implement the contract-grade sweep declarations (`rg --no-ignore` or
  `grep`) where exhaustive sweeps are instructed; leave parsing scripts on
  their current tool.
- P4 — Implement the ask-first, user-scoped, never-root bootstrap installer and
  its `init-workspace` wiring (including the `.agentic-workflow/bin/` gitignore
  entry in the template); P1 tests green.
- P5 — Tests-first for P2: `phase-lint` accepts the `Relevant files:`
  sub-section, and the never-authority discipline test (non-listed file editable
  + logged) — red first.
- P6 — Implement the `Relevant files:` grammar in `phase-contract` and make the
  plan step write it from its own discovery.
- P7 — Implement `execute-phase`'s bounded read set (listed files + one-hop
  references) and the forward-propagation append at phase close.
- P8 — Implement `review-change` consuming the unit's lists as its read set
  around the diff, findings carrying their affected files; P5 tests green.
- P9 — Evidence: run every AC and record its row, plus the measured delta
  (files-read / tokens with vs without the sub-section) for AC10.
- P10 — Docs & release: `bump-skill` per touched skill, CHANGELOG rows, package
  version bumps where a package was touched, roadmap/status update.

## Evidence

Triaged steps (verbatim, authoritative):

```
TRIAGE — 69 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Skipped: none
Budget: strong
```

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| 1 | pending | | | |
| 2 | pending | | | |
| 3 | pending | | | |
| 4 | pending | | | |
| 5 | pending | | | |
| 6 | pending | | | |
| 7 | pending | | | |
| 8 | pending | | | |
| 9 | pending | | | |
| 10 | pending | | | |
| R1 | fresh `git init` fixture + `rg 15.2.0` (local), `rg --no-ignore`, `grep -r` (research) | 0 | default traversal skipped gitignored `bundled/` (1 hit: `src/index.ts`); explicit `rg TARGET bundled/` → `bundled/dist/index.d.ts:1`; `--no-ignore` → 2 hits; `grep -r` → 2 hits (no ignore awareness) | main agent |
| R2 | upstream docs: `github.com/BurntSushi/ripgrep` (README) + `ripgrep.dev/docs/guide/` (research) | 0 | "By default, ripgrep will respect gitignore rules"; `--no-ignore` disables `.gitignore`/`.ignore`/`.rgignore` — matches the local fixture | main agent |
| R3 | `grep -rln "grep" skills --include=*.md` (research) | 0 | 10 files carry "grep" (8 with a standalone `grep` instruction site, 10 total occurrences); +6 non-hook sites in `template/`/`docs/`/`README`, 2 non-test scripts (`check-changelog-row.mjs`, `phase-lint.mjs`) | main agent |
| R4 | `bun scripts/phase-lint.mjs` on this SPEC and on `62-pi-native-conductor/SPEC.md` (research) | 1 | `verdict BLOCKED: no-phases` for both — the linter's grammar needs `### P<n> — Title` + `Layer:` + checkboxes + `Done-when:`, the lane's plan step emits `P1 — <task> (validator: …)` bullets | main agent |
| R5 | `env PATH=/usr/bin:/bin sh -c 'command -v rg'` (research) | 0 | `rg` resolves at `/usr/bin/rg` **and** `~/.pi/agent/bin/rg` — an rg-absent test must build a stub `PATH` holding `grep` only, not drop one directory | main agent |
| R6 | `skills/init-workspace/references/SERENA.md` §"Tool install is a different step" (research) | 0 | existing ask-first contract: offer install (preferred tool, fallback) or record a residual — the rg bootstrap must reuse it, not invent a second consent pattern; install half tracked by #219 | main agent |

## Progress log

- 2026-09-29 15:18 — unit doc created from `docs/features/_TEMPLATE/SPEC.md`
  for issue #269 (P1 ripgrep-first, P2 per-phase `Relevant files`) → branch
  `feat/69-efficient-context-targeting` — next: triage
- 2026-09-29 15:20 — triage ran (`bun scripts/unit-route.mjs --triage 69`, exit
  0): steps research, design, plan, implement, tests, evidence, review, docs,
  release — skipped: none, budget strong; block pasted verbatim above; roadmap
  row 69 registered as `defined` — next: research
- 2026-09-29 15:42 — research step: verified the rg three-leg contract in a
  fresh fixture + 2 upstream citations, pinned the adoption surface (10 skill
  files / 6 doc sites / 2 scripts), found the phase-lint ↔ unit-doc grammar
  contradiction (R4, routed to `phase-contract`), the double-`rg` PATH trap (R5)
  and the existing ask-first install contract (R6); rows R1–R6 above, gaps
  recorded in Known pre-existing issues → evidence rows R1–R6 — next: design

## Next

Execute the **design** step (`skills/unit-lane/references/DESIGN.md`): freeze
the rg-first wording contract, the installer flow and the `Relevant files:`
format (owner `phase-contract`), resolving the R4 grammar contradiction in the
unit doc before any plan is cut.

## References

- Issue [#269](https://github.com/gtrabanco/agentic-workflow/issues/269) — the
  tracked feature issue; `Closes #269` on the PR.
- Roadmap row 69, `docs/features/ROADMAP.md`.
- `.agentic-workflow/tmp/system-one-evaluation-2026-09-29.md` — owner
  dispositions (2026-09-29), measured ripgrep numbers, verified `rg` contract,
  graph-feasibility notes.
- `docs/LOGS.md` (2026-09-29) — the evaluation session that created #269, #270
  and amplified #192 / #219 / #201.
- #192 (doc toolchain + retrieval index) — later retrieval wiring; this unit
  ships ahead of it and must not be gated by it.
- #194 (folded into feature 61) — review-change is the highest recurring token
  consumer; the P2 saving targets it.
- #218 (evidence-bound findings) + #219 (shared provisioning) — soft cross-links.
- Feature 61 (runner crate `packages/agentic-workflow`) — home of the lane's
  runtime scripts; #219's shared provisioning pattern.
- `skills/phase-contract/SKILL.md` — owner of the phase format; the `Relevant
  files:` grammar lands there.
