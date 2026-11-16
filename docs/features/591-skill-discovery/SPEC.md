---
type: feature
scope: medium
roadmap_summary: Issue [#591](https://github.com/gtrabanco/agentic-workflow/issues/591) (M): init-workspace skill discovery — trusted-registry search the owner names, a deterministic mechanical screen (`runner skills discover`, the seven `skill-lint` checks plus provenance), per-candidate owner consent that can never install an excluded candidate, and lifecycle registration in the guide's "Optional review extras" note (`review-extras@1`) with a decay report (`runner skills inventory`) product-audit's Installed tooling dimension consumes
---

# 591 — skill-discovery

> One consented skill-discovery route for `init-workspace`: the owner names the
> registries, a deterministic screen runs before any consent, and a registration
> note with a decay report keeps an installed extra from rotting silently.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#591` — tracked issue in the project's forge. The PR must close it via
`Closes #591` in the body.

## Specs

**S1 — the owner's turn text: apply issue #591.**
> Apply to this repository: issue #591

**S2 — the discovery route: consented, read-only by default, search only the registries the owner names.**
> 1. **Discovery route (consented, read-only by default).** After the charter round, offer: search the trusted registries the owner names (candidates: autoskills.sh, skills.sh, GitHub) using the declared project kind + criteria catalogue as query terms. Search is read-only; nothing is fetched into the project without the following gates.

**S3 — mechanical screening before any consent, with the report as the receipt.**
> 2. **Mechanical screening before any consent.** Run `scripts/skill-lint.mjs --root` against each candidate's tree — the seven checks (hidden HTML comments, XML/HTML in frontmatter description, invisible codepoints, unpinned external URLs, credential/exfiltration-shaped instructions, Windows-style backslash paths, dated currency claims) — plus provenance basics (source URL, author, version, license). A candidate failing any check is reported and excluded; the report is the receipt.

**S4 — per-candidate owner consent; a `no` installs nothing and is never re-asked.**
> 3. **Per-candidate owner consent.** Present each surviving candidate with: what it reviews, what surface type it targets, its lint receipt, its provenance line. Install is opt-in per candidate (`npx skills add` or the declared installer); a `no` installs nothing. Never bulk-install; never re-ask declined candidates within the same bootstrap.

**S5 — lifecycle registration (anti-rot): source, version pin, install date, covered axis.**
> 4. **Lifecycle registration (anti-rot).** Every installed external skill is recorded in the "Optional review extras" note with its source, version pin, install date, and what axis it covers — the same line product-audit's **Installed tooling** dimension inventories every run, so decayed/unpinned/unmaintained skills surface as audit findings instead of rotting silently.

**S6 — the unit's non-goals: no auto-install, no new lint check, no trust-model change, no quality verdict.**
> - No auto-install, no agent-initiated network fetch without consent (the consent gates and the path-protection contract keep their authority).
> - No new lint checks invented here — `skill-lint`'s seven are the screen; extensions go through `skill-lint`'s own owner (issue #357's surface).
> - No trust-model change to `npx skills add` distribution of this repo's own skills.
> - No quality judgment beyond the mechanical screen: "lint-clean" is not "good"; the owner decides value.

**S7 — the acceptance the change must satisfy.**
> - [ ] The discovery route runs on a bootstrap scratch copy (golden-fixture rule) and produces: candidate list, per-candidate lint receipts, per-candidate consent records — nothing installed without an explicit yes.
> - [ ] A candidate carrying a hidden instruction (HTML comment / invisible Unicode) is excluded by the screen with the finding cited.
> - [ ] Every installed skill lands in the "Optional review extras" note with source + pin + date + axis; the Installed tooling dimension of a later product-audit surfaces it (round-trip verified once).
> - [ ] Declining every candidate leaves the bootstrap byte-identical apart from the guide's registration note (no stray files, no partial installs).
> - [ ] `check-skill-context` green; root suites green; changeset per repo rule.
> - [ ] The adopting PR appends/confirms its `ATTRIBUTION.md` adoption rows (documentation close-out, same PR).

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words.
S1 is the owner's turn text verbatim; S2–S7 quote the tracked issue's own
sections verbatim at the revision this unit was cut from (the issue is the
request's referent, so its words are the request's words). The acceptance
checkboxes are quoted as filed and are not `## Log` marks.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

What the change touches beyond its own files:

- **The seven checks get one owner.** They live today in
  `scripts/skill-lint.mjs`, which a target project never has: the skills ship as
  prose and the crate is the only code a project installs. The engine moves into
  the crate (`packages/agentic-workflow/src/skills/screen.mjs`) and `scripts/skill-lint.mjs`
  becomes its thin CLI — same argv, same block, same exit codes, because the screen cannot
  have two copies of a rule's meaning.
- **`scripts/skill-lint.mjs` is a shipped repo contract**: its block is pinned by
  `scripts/skill-lint.test.mjs` and its verdict is quoted by `skill-lint`'s turn
  contract, so the rewire is differentially checked against a base-commit copy.
- **The runner's surface is shared**: the bin's usage line, the crate README's
  usage line and its Commands rows are one surface
  (`packages/agentic-workflow/test/cli.surface.test.mjs`), and
  `skills/runner-contract/references/RUNNER.md`
  enumerates the subcommand set.
- **`skills/init-workspace` is a consumption surface**: its discovery step gains
  the route and its write step 15 gains the registration, so two skills and one
  template change (`template/AGENTS.md` seeds the note).
- **`skills/product-audit`'s Installed tooling dimension** stops reading the note
  by eye and consumes the inventory command.
- **Two normative tables change**: `AGENTS.md`'s `normative-surfaces@1` gains the
  new vocabularies and grammars and its `machineLines` budget is re-pinned, and
  `docs/workflow/GATE_INVENTORY.md` gains the carrier row.
- **What stops being true**: `scripts/skill-lint.mjs` stops owning the seven
  patterns; the `skill-lint` reference keeps the *meaning* of each check and
  gains a pointer to the engine instead of naming a sibling script's internals.

## Retirements

Strictly additive; nothing is retired. The surfaces this unit adds, each with its
named consumer (the anti-divergence inventory, so no added surface is an orphan):

| added surface | named consumer |
|---|---|
| `packages/agentic-workflow/src/skills/screen.mjs` (the seven checks) | `scripts/skill-lint.mjs`, `packages/agentic-workflow/src/skills/discovery.mjs` |
| `packages/agentic-workflow/src/skills/discovery.mjs` (`skill-discovery@1`) | `runner skills discover`, the `init-workspace` discovery route |
| `packages/agentic-workflow/src/skills/register.mjs` (`review-extras@1`) | `runner skills register`, `runner skills inventory`, `product-audit`'s Installed tooling dimension |
| `SKILL_SCREEN_VERDICTS` / `SKILL_CONSENT_ANSWERS` / `SKILL_EXTRA_STATES` | the drift gate's `normative-surfaces@1` rows |
| the `runner skills` subcommand | the bin's dispatch table, the crate README's Commands row |

The move of the seven patterns is not a retirement: `scripts/skill-lint.mjs`
keeps its ids, its names, its block and its exit codes — the bytes move, the
surface does not.

## Non-goals

- Auto-install, or an agent-initiated network fetch without consent (S6). The
  screener is offline by contract: it reads a candidate manifest and a tree, and
  the install command is text a human (or a consented agent) runs.
- New lint checks: `skill-lint`'s seven are the screen (S6); an eighth check is
  `skills/skill-lint/references/CHECKS.md`'s decision, never this unit's.
- Any trust-model change to `npx skills add` (S6).
- Any quality verdict beyond the mechanical screen (S6): `lint-clean` is not
  `good`, and the inventory's `stale` state is a decay signal, not a judgement.
- A registry client: the route searches with the tool the owner names; this unit
  ships no scraper, no API key, no rate-limit policy.

## Risk tier

- **Tier** — `standard` · **Task Size** — `medium` (new read-only code plus one
  consent-gated writer; no schema-package change, no breaking surface)
- **Named high-risk item** — none — not a high-tier unit. The one mutating path
  (`runner skills register`) writes a single project document, refuses before any
  byte moves, and every mutating case runs on a `mkdtemp` fixture.

## Future

none

## Future cost

- **The seven checks have one home.** Whoever adds an eighth check adds it to the
  engine and to `skills/skill-lint/references/CHECKS.md` in the same change; the
  screen's suite refuses a check id with no fixture. Binds: `skill-lint` work.
- **`review-extras@1` is a published grammar.** A new column is a grammar change
  in the crate README and the inventories that read it, never a hand edit of a
  project's note. Binds: anything that registers an external skill.
- **The install command is never executed by the workflow.** A future unit that
  wants a delegated installer owns the consent contract and the re-verify, the
  way `doctor`'s `setup` does. Binds: future discovery work.

## Applicable tests

- `packages/agentic-workflow/test/skills.screen.test.mjs` — the seven checks on
  fixtures (hidden comment, invisible codepoint, and each ablation), the tree
  walk, and the shipped-tree clean pin.
- `packages/agentic-workflow/test/skills.discovery.test.mjs` — the candidate
  envelope: provenance gaps, exclusions with their cited finding, consent that
  cannot install an excluded candidate, the install command as text.
- `packages/agentic-workflow/test/skills.register.test.mjs` — the
  `review-extras@1` block: create-on-absent, append, duplicate refusal, the
  inventory's four states, and the no-write-on-decline invariant.
- `packages/agentic-workflow/test/skills.cli.test.mjs` — the bin's surface, the
  exit codes, read-only behaviour of `discover`/`inventory` and the single write
  of `register`, all against `--root` scratch trees.
- `scripts/skill-lint.test.mjs` — the unchanged block (the differential pin).

## Known pre-existing issues

- The seven checks were reachable only from this repository
  (`scripts/skill-lint.mjs`); a target project installs the crate and the skill
  prose, so the screen had no carrier. Affects: yes — this unit is the carrier,
  and the move is why `scripts/skill-lint.mjs` changes at all.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` pins `AGENTS.md`'s `machineLines`
  exactly and the guide sits at its line ceiling at the cut, so the new
  `normative-surfaces@1` rows force a re-pin. Affects: yes — the re-pin ships
  here with its growth source, through the `budgets` CLI.
- `skills/init-workspace` carries a per-skill context ceiling; the route's prose
  is bounded by it and the re-pin (if needed) names its growth source. Affects:
  yes, and it is checked by `bun scripts/check-skill-context.mjs`.
- The gate's network step `dependency-pin-gate` reports upstream drift on a pin
  this unit does not touch (`@gtrabanco/pi-agentic-workflow` →
  `pi-extensible-workflows` `6.3.0 → 6.4.0`); `git diff origin/main --
  packages/pi-agentic-workflow/package.json` is empty, so the drift predates this
  change and owns its own `fix(deps)` PR. Affects: no — nothing in this unit
  selects, pins or bumps that dependency.
- No suite pins `skills/runner-contract/references/RUNNER.md`'s subcommand table
  against `RUNNER_COMMANDS`; the table is hand-maintained. Affects: no — this
  unit adds one row and verifies it by reading, the mechanical pin is #558's
  O27 territory.

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers froze in this document's folder before the first line of code,
  and the work arrives as conventional commits on the unit branch.
  Check: `ls docs/features/591-skill-discovery/` lists `SPEC.md`,
  `planning-evidence.md` and `planning-obligations.md`.
- **AC-S2** — `runner skills discover` is the route's deterministic half: it
  reads a candidate manifest, screens each candidate's tree, prints the candidate
  list with per-candidate lint receipts and per-candidate consent records, and
  installs nothing — the install command is printed as text and no network call,
  no `skills add`, no file write happens.
  Check: `cd packages/agentic-workflow && bun test test/skills.discovery.test.mjs`
  exits 0 with the read-only and install-command-as-text cases.
- **AC-S3** — A candidate whose tree carries a hidden instruction (an HTML
  comment with prose, or an invisible codepoint) is `excluded`, and the envelope
  cites the finding's id, path and line; a candidate missing any provenance
  field (source, author, version, license) is `excluded` as well.
  Check: `cd packages/agentic-workflow && bun test test/skills.discovery.test.mjs`
  exits 0 with the hidden-instruction and provenance cases.
- **AC-S4** — Consent is per candidate and can never bypass the screen: a
  consented candidate that failed the screen is `blocked` (exit 1) and its
  install command is not printed; a declined candidate is `skip` and installs
  nothing; the consent record is a row in the envelope, never a file.
  Check: `cd packages/agentic-workflow && bun test test/skills.discovery.test.mjs`
  exits 0 with the blocked/skip cases and the no-write assertion.
- **AC-S5** — An installed extra lands in the guide's "Optional review extras"
  note as one `review-extras@1` row carrying source, pin, install date and axis,
  and `runner skills inventory` reads it back with a closed state — `ok`,
  `unpinned`, `stale` or `incomplete` — so a later product-audit surfaces decay.
  Check: `cd packages/agentic-workflow && bun test test/skills.register.test.mjs`
  exits 0 with the register→inventory round trip and the four states.
- **AC-S6** — The non-goals hold in code: `discover` and `inventory` write
  nothing (the fixture tree is byte-identical after a run), no installer is
  spawned, no network module is imported, and the screen is exactly `skill-lint`'s
  seven checks — no eighth check exists.
  Check: `cd packages/agentic-workflow && bun test test/skills.cli.test.mjs`
  exits 0, and `rg -c 'id: "SL-0' packages/agentic-workflow/src/skills/screen.mjs`
  matches 7.
- **AC-S7** — The issue's acceptance block is satisfied and evidenced: the route
  ran on a bootstrap scratch copy (fixtures + one scratch project), the decline
  case leaves the tree byte-identical, `check-skill-context` and the root suites
  are green, the changeset ships, and `ATTRIBUTION.md` carries the adoption rows
  this unit confirms.
  Check: `bun scripts/check-skill-context.mjs` exits 0,
  `bun scripts/lint-changeset.mjs .changeset/591-skill-discovery.md` exits 0 and
  `rg -c '#591' docs/research/ATTRIBUTION.md` matches ≥1.

## Tasks

P1…P8 with stable ids, dependency-topological order first.

- P1 — Freeze this unit doc, its two planning ledgers and the acceptance
  criteria before the implementation lands (validator:
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/591-skill-discovery/SPEC.md`
  exits 0 with a PASS verdict)
  (Implements: S1)
  - Relevant files: docs/features/591-skill-discovery/SPEC.md,
    docs/features/591-skill-discovery/planning-evidence.md,
    docs/features/591-skill-discovery/planning-obligations.md
- P2 — RED corpus first: the four `skills.*.test.mjs` suites land as checks
  observed failing on the pre-change tree, and the red run is recorded as an `E`
  line before any module exists (validator: `cd packages/agentic-workflow && bun
  test test/skills.screen.test.mjs test/skills.discovery.test.mjs
  test/skills.register.test.mjs test/skills.cli.test.mjs` exits 1 on the missing
  modules at the red commit and 0 after P3–P6)
  (Implements: S3, S7)
  - Relevant files: packages/agentic-workflow/test/skills.screen.test.mjs,
    packages/agentic-workflow/test/skills.discovery.test.mjs,
    packages/agentic-workflow/test/skills.register.test.mjs,
    packages/agentic-workflow/test/skills.cli.test.mjs
- P3 — The screen engine moves into the crate and `scripts/skill-lint.mjs`
  becomes its thin CLI, byte-identically (validator:
  `bun scripts/skill-lint.mjs` exits 0 and `bun test scripts/skill-lint.test.mjs`
  exits 0 with the unchanged block and the unchanged fixtures)
  (Implements: S3, S6)
  - Relevant files: packages/agentic-workflow/src/skills/screen.mjs,
    scripts/skill-lint.mjs
- P4 — The discovery evaluation: candidate manifest parsing, the provenance
  screen, the seven-check screen per candidate, per-candidate consent, the
  blocked/skip/install decisions and the fixed `skill-discovery@1` block
  (validator: `cd packages/agentic-workflow && bun test
  test/skills.discovery.test.mjs` exits 0)
  (Implements: S2, S3, S4, S6)
  - Relevant files: packages/agentic-workflow/src/skills/discovery.mjs
- P5 — Registration and decay: the `review-extras@1` block's parse, its
  append-and-seed path, the duplicate refusal, plus the inventory's four states
  and the decline-leaves-no-byte invariant (validator:
  `cd packages/agentic-workflow && bun test test/skills.register.test.mjs`
  exits 0)
  (Implements: S5, S6)
  - Relevant files: packages/agentic-workflow/src/skills/register.mjs
- P6 — The `skills` subcommand: `discover`, `register`, `inventory`, the exit
  contract, the dispatch table, the bin's usage line and the crate README's
  Commands row (validator: `cd packages/agentic-workflow && bun test
  packages/agentic-workflow/test/skills.cli.test.mjs
  packages/agentic-workflow/test/cli.surface.test.mjs` exits 0)
  (Implements: S2, S4, S5)
  - Relevant files: packages/agentic-workflow/src/runner/skills.mjs,
    packages/agentic-workflow/src/runner/cli.mjs,
    packages/agentic-workflow/bin/agentic-workflow.mjs,
    packages/agentic-workflow/README.md
- P7 — The consuming surfaces: the `init-workspace` discovery route, bootstrap
  write step 15's registration, `product-audit`'s Installed tooling dimension and
  the template guide's seeded note (validator: `rg -c 'skills discover'
  skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` matches ≥1 and
  `bun scripts/check-skill-context.mjs` exits 0)
  (Implements: S2, S4, S5, S6)
  - Relevant files: skills/init-workspace/SKILL.md,
    skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md,
    skills/init-workspace/references/BOOTSTRAP_WRITE.md,
    skills/product-audit/SKILL.md, template/AGENTS.md
- P8 — Differential check on the moved checks: `scripts/skill-lint.mjs` driven
  against a base-commit copy and against this change over the same corpus
  (`mktemp -d`), with every byte and exit identical (validator:
  `bun test scripts/skill-lint.test.mjs` exits 0 and the base-vs-change diff of
  `bun scripts/skill-lint.mjs` output is empty — zero differing line)
  (Implements: S3, S6)
- P9 — Docs and repository state: the crate README blocks, the drift gate's rows,
  the `machineLines` re-pin with its growth source, the changeset, the
  `ATTRIBUTION.md` confirmation, the roadmap row and the generated projection —
  each through its deterministic writer (validator:
  `bun test scripts/normative-drift.test.mjs` exits 0,
  `bun scripts/check-skill-context.mjs --documents` exits 0 and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S7)
  - Relevant files: packages/agentic-workflow/README.md, AGENTS.md,
    docs/workflow/SKILL_CONTEXT_BUDGETS.json,
    docs/workflow/GATE_INVENTORY.md, .changeset/591-skill-discovery.md,
    docs/research/ATTRIBUTION.md, docs/ROADMAP.md, docs/generated/
- P10 — Verification and session state: every obligation's validator runs in the
  foreground, the ledger closes, and the session entry is appended (validator:
  `bun scripts/local-gate.mjs` exits 0 and
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/features/591-skill-discovery/SPEC.md` exits 0)
  (Implements: S7)
  - Relevant files: docs/features/591-skill-discovery/planning-obligations.md,
    docs/LOGS.md
- P11 — The correction batch on this unit's 2026-11-16 `EXTERNAL VERIFY` receipt
  (blockers B1–B5): the candidate screen takes every skill file in the tree
  wherever it lives and excludes a tree that yields none, unreadable discovery
  inputs are refusals, the skill-lint reference and skill name the crate engine
  as the pattern carrier, and E4's receipt command reproduces its reported
  output (validator: `cd packages/agentic-workflow && bun test
  test/skills.screen.test.mjs test/skills.discovery.test.mjs
  test/skills.register.test.mjs test/skills.cli.test.mjs
  test/cli.surface.test.mjs` exits 0, `bun scripts/skill-lint.mjs` exits 0 and
  `rg -n 'carries the patterns|patterns live in .scripts/skill-lint'
  skills/skill-lint/` exits 1 with no match)
  (Implements: S1)
  - Relevant files: packages/agentic-workflow/src/skills/screen.mjs,
    packages/agentic-workflow/src/skills/discovery.mjs,
    packages/agentic-workflow/src/runner/skills.mjs, skills/skill-lint/SKILL.md,
    skills/skill-lint/references/CHECKS.md,
    docs/features/591-skill-discovery/SPEC.md

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

M unit: the ledger is frozen beside this document as
[`planning-evidence.md`](planning-evidence.md) (`PE-001`…`PE-012`), never
embedded here.

### Obligations

M unit: the ledger is frozen beside this document as
[`planning-obligations.md`](planning-obligations.md) (`O1`…`O14`), never
embedded here. Every row is `verified` before the handoff.

## Triaged steps

n/a — applied inline per the owner's instruction (S1): the ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery. The declared deterministic gates (tests, lints) run in the foreground.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-16, the owner's request, verbatim:
  ```
  Apply to this repository: issue #591
  ```
- **L2** — 2026-11-16, the tracked issue's proposed fix, non-goals and acceptance,
  verbatim (body as filed; labels `promoted`, `feature`):
  ```
  1. **Discovery route (consented, read-only by default).** After the charter round, offer: search the trusted registries the owner names (candidates: autoskills.sh, skills.sh, GitHub) using the declared project kind + criteria catalogue as query terms. Search is read-only; nothing is fetched into the project without the following gates.
  ```
- **P1** — 2026-11-16, this unit doc, its two planning ledgers and the acceptance
  criteria frozen before the first line of code · `3f9fb62e`.
- **E1** — 2026-11-16, the RED corpus (P2) · `cd packages/agentic-workflow && bun
  test test/skills.screen.test.mjs test/skills.discovery.test.mjs
  test/skills.register.test.mjs test/skills.cli.test.mjs` · exit 1 · `0 pass / 12
  fail / 3 errors`, every error `Cannot find module '../src/skills/*.mjs'`
  (commit `8d1658a8`).
- **P2** — 2026-11-16, the seven checks moved into the crate
  (`packages/agentic-workflow/src/skills/screen.mjs`) and `scripts/skill-lint.mjs`
  rewired as their thin CLI
  · `5a5ea5a1`.
- **E2** — 2026-11-16, the moved engine against its shipped corpus · `bun test
  scripts/skill-lint.test.mjs` · exit 0 · `20 pass / 0 fail`.
- **E3** — 2026-11-16, the differential check (P8): `bun scripts/skill-lint.mjs`
  and `git archive origin/main`'s copy of it, driven in `mktemp -d` over a dirty
  fixture tree and over the shipped tree · exit 1 and exit 0 on both sides, and
  `diff` empty both ways — zero differing line.
- **E4** — 2026-11-16, the discovery corpus green · `cd packages/agentic-workflow
  && bun test test/skills.screen.test.mjs test/skills.discovery.test.mjs
  test/skills.register.test.mjs
  test/skills.cli.test.mjs
  test/cli.surface.test.mjs`
  · exit 0 · `42 pass / 0 fail`.
- **P3** — 2026-11-16, the discovery envelope, the registration ledger, the
  `skills` subcommand and its three documented surfaces · `762026a2`.
- **E5** — 2026-11-16, the crate suite · `bun run test` in
  `packages/agentic-workflow` · exit 1 first (`973 pass / 1 fail`: the
  dispatch-table exhaustive pin did not know `skills`) and exit 0 after that pin
  named the new command, which the gate's `crate-suite-bun` and `crate-suite-node`
  steps then confirmed.
- **E6** — 2026-11-16, the round trip of S5/S7 on a scratch project (the template
  guide copied into `mktemp -d`): `skills discover` printed `framework-review —
  install … consent yes` and left the guide byte-identical; `skills register`
  answered `changed appended`; `skills inventory --as-of 2026-11-16` read the row
  back `framework-review — ok … axis review-design`; a second copy run through
  `discover` with no consent answers stayed byte-identical.
- **D1** — 2026-11-16, owner-facing decision recorded by the design, not a
  question asked: the install line is the documented source form
  `npx skills add <source>` with the pin as its own envelope cell, because a
  version-suffix syntax is unverified in this tree (PE-010) and the workflow never
  runs the command.
- **D2** — 2026-11-16, housekeeping disclosed rather than hidden: `journal
  aggregate` was run once by mistake and consumed the 24 pending fragments other
  sessions had left in this worktree's carrier. The run was reverted with `git
  restore docs/LOGS.md .agentic-workflow/journal/` — `docs/LOGS.md` and every
  fragment are byte-identical to the pre-run tree (`bun scripts/log-immutability.mjs`
  exit 0 afterwards) — and this session leaves one unaggregated fragment, so
  aggregation stays the owner's merge step.
- **E7** — 2026-11-16, the context budgets · `bun scripts/check-skill-context.mjs`
  · exit 0 · `PASS context budgets: 30 skills`; `bun
  scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents:
  4 budgeted documents` (AGENTS.md 718 lines / 155 machine / 563 prose / 12,793
  est; GATE_INVENTORY.md 168 / 73 / 95 / 6,547).
- **E8** — 2026-11-16, the normative surfaces and the gate inventory · `bun test
  scripts/normative-drift.test.mjs` exit 0 (`21 pass`), `bun
  scripts/prose-gate-inventory.mjs` exit 0 (`verdict: PASS`), `bun test
  scripts/ledger-ownership.test.mjs` exit 0 (`14 pass`), `bun
  scripts/invocation-drift.mjs` exit 0 (`verdict: PASS`).
- **E9** — 2026-11-16, the release and repository-state surfaces · `bun
  scripts/lint-changeset.mjs .changeset/591-skill-discovery.md` exit 0
  (`ok 591-skill-discovery.md`), `bun scripts/docs-generate.mjs --check` exit 0
  (`verdict: PASS`), `rg -c '#591' docs/research/ATTRIBUTION.md` → `2`.
- **P4** — 2026-11-16, the branch pushed and the pull request opened: `git push`
  ran the pre-push hook (the offline gate, `PASS — 16 step(s) in 636s`) and PR
  #594 was created against `main` with `Closes #591`. Roadmap row 591 carries the
  PR URL in its status cell (`in-progress · [#594](…)`), written by `roadmap
  rowUpsert`; this document deliberately cites no PR URL while the PR is open,
  because `pr-url-unsettled` reads a doc-side URL as a claim the row is `done`.
  The row's slug is the emitter's folder-derived `skill-discovery` — the
  issue-side name `skill-discovery-init` made `docs-generate` append a second row
  591, which the writer's duplicate-key collapse removed.
- **G1** — 2026-11-16, the offline gate at HEAD f7fc4227245336321982f0a6b09080e767285c7a ·
  `bun scripts/local-gate.mjs --skip-network --no-bail --jobs auto` · exit 0 ·
  `PASS — 15 step(s) in 745s`. The four network steps were skipped by the flag; the earlier full run's
  `dependency-pin-gate` reported the pre-existing upstream drift this document's
  `## Known pre-existing issues` records. A first run of the same gate went red
  on `root-suite` with `scripts/red-first.test.mjs`'s shipped-history case timing
  out at its declared 30 s budget; the walk measures 8.7–9.1 s warm at idle and
  13.2 s on a clone of the base commit, so that red was the load-marginal class
  `scripts/test-timeout-allowlist.json` documents, not a content difference — the
  same gate then passed on the same tree.
- **G3** — 2026-11-16, the offline gate re-run over the receipt commit at HEAD 82a3c1651acdf7419039c200069602a17f9641cf ·
  `bun scripts/local-gate.mjs --skip-network --no-bail --jobs auto` · exit 0 ·
  `PASS — 15 step(s) in 875s` (the same 15 offline steps; the four network steps
  skipped by the flag again).
- **G2** — 2026-11-16, the document verifier at HEAD f7fc4227245336321982f0a6b09080e767285c7a ·
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/features/591-skill-discovery/SPEC.md` · exit 2 first, refusing exactly
  `receipt-malformed-head` on this document's two `G` lines (a gate receipt
  without the 40-hex head it ran against) · repaired by citing that head on each
  receipt's own first line, after which the verifier exits 0.
- **G4** — 2026-11-16, the offline gate over the correction batch (P11) at HEAD
  `4e70662bf189fba113854f53c19c4f35e266379c` · `bun scripts/local-gate.mjs
  --skip-network --no-bail --jobs auto` · exit 0 · `PASS — 15 step(s) in 622s`.
  A first run of the same gate went red on `root-suite` without the failing
  suite's name surviving the output tail; `node scripts/run-root-suite.mjs`
  standalone then exited 0 across 114 suites and the identical gate re-run
  passed 15/15 — the load-marginal class G1 records, no content difference.
  The four network steps were skipped by the flag, as in G1/G3.
- **L3** — 2026-11-16, the owner's correction request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
  The `EXTERNAL VERIFY` receipt of the same date named blockers B1–B5; all five
  triaged fix-worthy. `O2`/`O10`'s stated outcomes did not hold at `a1bacb72`
  (the red corpus) and were re-verified by E11 before their `verified` status
  stands at this commit.
- **E10** — 2026-11-16, the correction corpus RED (B1/B2) · `cd
  packages/agentic-workflow && bun test test/skills.discovery.test.mjs
  test/skills.cli.test.mjs` · exit 1 · `22 pass / 5 fail`, every failure one of
  the receipt's five reproducers (root-layout `SKILL.md`, `.claude/skills`
  layout, no-skill-file tree, missing and non-JSON `--candidates`) · commit
  `a1bacb72`, the suite alone.
- **E11** — 2026-11-16, the fix green · the two red suites `27 pass / 0 fail`,
  the five-skill corpus `47 pass / 0 fail`, the crate suite `bun run test`
  exit 0 (`979 pass / 0 fail`), and the base-vs-head differential of
  `bun scripts/skill-lint.mjs` over dirty, clean and usage fixtures byte-empty
  with exits 1/0/2 — the shared engine's CLI path unchanged · commit
  `c21f9246`. The scratch replay of the receipt probes: root and `.claude`
  layouts `blocked` with `FINDING SL-01 … SKILL.md:<line>` and no install line
  (exit 1), both bad inputs `SKILLS REFUSAL —` exit 2 with no stack, a hollow
  tree `reason no-skill-files`.
- **E12** — 2026-11-16, B5 repaired: E4's command corrected to the five
  `test/…` path forms (its reported `42 pass / 0 fail` was right, its printed
  command was not — the two `packages/agentic-workflow/test/…` filters matched
  nothing from that cwd and dropped two suites). The corrected command ran at
  head `09821263` before the corpus grew · exit 0 · `42 pass / 0 fail`, and
  after the fix corpus · exit 0 · `47 pass / 0 fail`.
- **E13** — 2026-11-16, the sibling-truth repair (B3/B4) and its validators ·
  `bun scripts/skill-lint.mjs` exit 0 (`103 file(s) · 7 check(s) · 0 finding(s)`),
  `bun scripts/check-skill-context.mjs` exit 0 (`PASS context budgets: 30
  skills`), `rg -n 'carries the patterns|patterns live in .scripts/skill-lint'
  skills/skill-lint/` exit 1 with no match — no shipped surface still names
  `scripts/skill-lint.mjs` as the pattern home.

## Next

````text
→ Next: the owner's external verification of this diff — no review-change, no
  audit-pr and no fold cycle ran on this change (§4 of the working rules)
  · on a blocker → one correction batch → one recheck limited to those blockers
````

## References

- Issue [#591](https://github.com/gtrabanco/agentic-workflow/issues/591) — the
  feature proposal this unit applies (`Closes #591`).
- `docs/ROADMAP.md` row 591 — the worklist entry.
- Pull request #594 — `Closes #591`; its URL lives in the roadmap row's status
  cell, never here while the PR is open (`pr-url-unsettled`).
- `docs/research/ATTRIBUTION.md` — the Voyager/SAGE and self-evolving-agent
  rows this unit confirms.
- `skills/skill-lint/references/CHECKS.md` — the owner of each check's meaning.
