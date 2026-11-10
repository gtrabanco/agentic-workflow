---
type: fix
scope: xs
---

# fix/500-declare-docs-site-block

> One-line: `AGENTS.md` declares the `## Docs site` block the projection emitter
> reads, so `bun scripts/docs-generate.mjs --check` reports
> `Format: md (declared)` instead of the degraded note on every run.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#500` — tracked issue in the project's forge. The PR must close it via
`Closes #500` in the body.

## Specs

**S1 — apply the issue to this repository.**
> "Apply to this repository: issue #500"

**S2 — the guide declares its projection format.**
> "AGENTS.md carries a `## Docs site` section whose fenced block declares `- format: md` (the repository's actual, current projection format)."

**S3 — the emitter stops degrading and the projection stays byte-identical.**
> "`bun scripts/docs-generate.mjs --check` exits 0 with no `degraded` note and a byte-identical projection (`docs/generated/**` unchanged)."

**S4 — the documents context gate still passes.**
> "`bun scripts/check-skill-context.mjs --documents` still passes (the guide grew by a few lines)."

**S5 — no suite regresses: the derived affected set runs green.**
> "No suite regresses: the affected set derived by `bun scripts/test-impact.mjs --base main` runs green."

**S6 — inline application; the deterministic gates are the only gates that run.**
> "No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always."

**S7 — documentation and state ship in the same change, through the owning surfaces.**
> "- Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events;
> - Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead;
> - `docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff;
> - The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection."

## Impact

- `AGENTS.md` gains the `## Docs site` section the emitter's format discovery
  reads (landed with the prose commit `dedbab3a`, before this ledger cut —
  D3). The block's grammar is owned by the emitter, not restated here; the
  declaration selects the repository's actual projection format and nothing else.
- `docs/passive/2026-11-09-declare-docs-site.md` — the prose commit's
  `passive-record@1` readback, written by `ceremony passive add` (the carrier's
  only writer) with the same commit.
- `docs/fix/500-declare-docs-site-block/` (this doc) — the planning ledgers the
  reviews and audits read; embedded `### Planning evidence` / `### Obligations`
  per the XS/S sizing rule.
- `docs/ROADMAP.md` `## Fixes` gains the `#500` row — it is the fix index
  (issue #319) and feeds `inFlightUnitDocs` (a `done` row keeps this doc out of
  the in-flight claim sweep), `roadmap-settle`, and the units projection.
- `docs/generated/**` is re-rendered by `bun scripts/docs-generate.mjs` after
  the row and the unit doc land — the renderer is the only writer of a
  generated page (PE-009); the expected delta is the new unit's index rows and
  nothing else.
- `.agentic-workflow/journal/` gains this session's narrative fragment (P6);
  `docs/LOGS.md` is untouched — it has one legal writer once the carrier is
  opted in (D4, PE-008).
- No `packages/**`, no `skills/**`, no `scripts/**`, no test file changes — so
  no package version bump, no `.changeset/` intent (the content trigger set is
  `skills/` plus the package directory, PE-011 note in Future cost), and no
  schema mirror is owed.

## Retirements

Nothing can be removed. This change only *declares* a block the guide's own
substrate expects: the emitter's degraded path stays (it is the contract for a
project that declares nothing — feature 396's no-silent-failure rule), the
passive carrier stays (it is the prose commit's readback), and no existing
sentence, helper or fixture is superseded by the block. The retired *state* —
this repository's `Format: md — degraded (…)` advisory on every run — is not a
surface: it disappears because the declaration now exists, not because
something was deleted.

## Non-goals

- Changing the emitter, its discovery grammar, or the degraded path for
  undeclared projects (`scripts/docs-generate.mjs` is read, never edited).
- Re-rendering `origin/main`'s pre-existing projection drift, or integrating
  the 27 commits `origin/main` gained after this branch forked — both are the
  owner's integration step (Known pre-existing issues, D5).
- Running any repo review machinery on this change (S6).
- A README, template, or `init-workspace` change: the scaffold's `Docs site`
  block prompt and this repository's own block are separate copies by design
  (this guide's "Every repetition names its owner" rule points at the emitter
  for the grammar).

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify` over the branch's own
diff; copied verbatim, never written from memory (E6):

- **Tier** — `passive` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: none`, `verification: readback` · **signals** — `[]`
- **Reason** — `every changed path is documentation, an image or prose: no
  executable effect` (`reason_kind: no-executable-effect`; paths:
  `AGENTS.md`, `docs/passive/2026-11-09-declare-docs-site.md`).
- **Named high-risk item** — none — not a high-tier unit.

The `passive` contract's "no unit doc ceremony" and this workflow's §5 unit-doc
cut are both honoured by keeping the passive record as the prose commit's
readback *and* cutting the ledgers the owner's workflow orders: D2 records the
precedence decision, and the deterministic gates below prove the coexistence
breaks nothing.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves it.

- **AC-S1 (S1)** — the issue is applied on this branch and handed to the owner
  as a diff with closed ledgers — proved by the handoff block (diff summary,
  obligations state, verification block) and by
  `git diff --stat 5d778958...HEAD` naming this unit's surfaces.
- **AC-S2 (S2)** — the guide declares the block where the emitter reads it —
  proved by `rg -c '^## Docs site$' AGENTS.md` matching 1 and
  `rg -c '^- format: md$' AGENTS.md` matching 1.
- **AC-S3 (S3)** — no `degraded` note, exit 0, byte-identical projection —
  proved by `bun scripts/docs-generate.mjs --check` exiting 0 with
  `Format: md (declared)` and 0 stale files at head (E2), by the branch-point
  reproducer printing the degraded note (E1), and by
  `git diff --stat 5d778958 dedbab3a -- docs/generated` producing no output
  (E3).
- **AC-S4 (S4)** — the grown guide stays inside its budgets — proved by
  `bun scripts/check-skill-context.mjs --documents` exiting 0 with
  `PASS context documents: 4 budgeted documents` (E4).
- **AC-S5 (S5)** — the derived affected set runs green — proved by
  `bun scripts/test-impact.mjs --base main` exiting 0 with its 43 derived
  suites each exiting 0 under `bun test --timeout=60000` (G-line + E-line at
  close), with the branch-point derivation `empty` recorded beside it (E5).
- **AC-S6 (S6)** — no review machinery ran on this change and the
  deterministic gates did — proved by zero `R`/`F` lines in this doc
  (`rg -c '^\- \*\*[RF][0-9]+\*\*' docs/fix/500-declare-docs-site-block/SPEC.md`
  exits 1) and by the `## Log` `G` lines, one per gate run with its exit code.
- **AC-S7 (S7)** — the indexes and declared surfaces ship in the change —
  proved by `rg -c 'issues/500' docs/ROADMAP.md` matching 1, by
  `bun scripts/docs-generate.mjs --check` exiting 0 after the emitter's own
  re-render, by the narrative fragment under `.agentic-workflow/journal/`
  (validator in O8), and by `git diff 5d778958...HEAD -- docs/LOGS.md`
  producing no output (the aggregator's file untouched, D4).

## Future

none — nothing was deferred.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| The `## Docs site` block is the projection's live declaration: a future format change edits this block in the same change that changes the renderer's output, or `docs-generate --check` reports the drift | whoever changes the projection format |
| This repository's block and the scaffold's `Docs site` prompt in `template/` are separate copies with one grammar owner (the emitter) — a grammar change lands on both surfaces together | future template/emitter work |

## Applicable tests

n/a — no tests step for this fix

## Known pre-existing issues

- **`origin/main` moved 27 commits ahead of this branch after the fork** (PR
  [#499] merged at 15:36 UTC, head `83b3b384`), touching `AGENTS.md`
  ("three packages" → "four packages", two hunks far above this block),
  `docs/ROADMAP.md` (rows 427/388 settled), `docs/LOGS.md`, and the generated
  projection — **does-not-affect** this head's verification (the hunks do not
  overlap this change; `git diff HEAD origin/main -- AGENTS.md` shows no
  conflicting hunk at this block). The projection re-render after the merge is
  the owner's integration step (D5).
- **The projection is already stale at `origin/main`'s tip**: a scratch
  `docs-generate --check` of `83b3b384` exits 1 with `1 stale` — the rendered
  diff is 8 lines (rows 427/388 status cells settled without a re-render,
  E8) — **does-not-affect** this unit (this head's `--check` exits 0); it
  predates this branch and is disclosed rather than repaired here.

## Tasks

- P1 — Declare the `## Docs site` block in the guide (landed with the prose commit `dedbab3a`; D3 records the ordering) (validator: `rg -c '^## Docs site$' AGENTS.md` matches 1)
  (Implements: S1, S2)
- P2 — Cut this unit doc: the verbatim `S#`s, the acceptance criteria, both embedded planning ledgers, the `## Fixes` row, and the emitter's re-render of the projection (validator: `bun scripts/unit-route.mjs --triage 500-declare-docs-site-block` exits 0)
  (Implements: S1, S7)
- P3 — The frozen-failure corpus and the differential: the branch-point reproducer (degraded note — RED) against the change (declared — GREEN), each touched command run on both sides (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S3)
- P4 — The documents context gate with the grown guide (validator: `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S4)
- P5 — Verification sweep: the affected set derived by `--base main` under bun, the offline gate, the unit-doc readers (phase-lint, triage, roadmap-settle, promise-coherence, the unit-doc verifier), and the root suite (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S5, S6)
- P6 — The session entry through the fragment door, the ledger close (every status flipped on its foreground-run validator), and the handoff (validator: `ls .agentic-workflow/journal/*fix-500-declare-docs-site-block*narrative*` exits 0)
  (Implements: S6, S7)

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | Format discovery reads the guide's `## Docs site` fenced block; an absent block resolves to `degraded: "no \`Docs site\` block in AGENTS.md"` and the md emitter | `scripts/docs-generate.mjs:54` (`SITE_HEADING`), `:97-131` (`parseDocsSiteBlock`, `resolveFormat`) | current | O1, O2 |
| PE-002 | known | The heading must match exactly (`^## Docs site[ \t]*$`, fence-aware) or the section body is `null` and the block is not found — a near-heading degrades like an absent one | `scripts/unit-doc-phases.mjs:312-314` (`sectionText` heading regex); `scripts/docs-generate.mjs:97-104` (block read over `fencedBlock`) | current | O1 |
| PE-003 | known | Omitted slots are the documented defaults: no `content-dir` ⇒ projection at `docs/generated`; no `build`/`map` ⇒ no build step and no map script | `scripts/docs-generate.mjs:111-113` (slot parse), `:156-158` (`projectionDir` default) | current | O1, O6 |
| PE-004 | known | The classifier's verdict for this branch is `tier: passive` (`reason_kind: no-executable-effect`, `signals: []`, `task_size.ceremony: none`, `verification: readback`) over `AGENTS.md` + the passive record | `bun scripts/ceremony.mjs tier classify`, run 2026-11-10 (E6) | current | Risk tier section, D2 — the passive contract says "no unit doc", this workflow's §5 says cut one; D2 records the precedence |
| PE-005 | known | The reproducer at the branch point prints the degraded note: `Format: md — degraded (no \`Docs site\` block in AGENTS.md)` · 3 checked · 0 stale · exit 0 | scratch copy of `5d778958` (`git archive` into `mktemp -d`, removed after) — `bun scripts/docs-generate.mjs --check` (E1) | current | O2 — the §2 corpus RED half |
| PE-006 | known | At the moved `origin/main` (`83b3b384`) the projection is pre-existing stale: same scratch run exits 1 with `1 stale`, and the rendered diff is 8 lines (rows 427/388 status cells) | scratch copy of `origin/main` — `docs-generate --check` + byte diff (E8) | current | Known pre-existing issues; the post-merge re-render is the owner's integration step |
| PE-007 | known | `test-impact --base 5d778958` (the branch point) is `verdict: empty` — changed 2, executable 0; `--base main` at the moved head is `verdict: targeted` with 43 suites, because `origin/main` is 27 commits ahead and the two-dot diff carries its deltas | `bun scripts/test-impact.mjs --base 5d778958` and `--base main`, plus `git rev-list --count HEAD..origin/main` → 27 (E5) | current | O4, D5 — both derivations run and are recorded |
| PE-008 | known | Once the fragment carrier is opted in, `docs/LOGS.md` has exactly one legal writer (the merge aggregator) and a non-aggregator commit touching it fails the push gate; a fragment addition is legal for anyone | `scripts/log-immutability.mjs:1-60` (header contract); `skills/log-session/SKILL.md:119-138` (the two doors) | current | O8, D4 — the session entry goes through `journal write` |
| PE-009 | known | The units projection reads every digit-led `docs/fix/*/SPEC.md` plus the roadmap status cells, so this unit doc and its Fixes row change the rendered bytes — the emitter must re-render, never a hand edit | `scripts/docs-generate.mjs:185-196` (`unitDirs`), `:217-227` (`statusBySlug`) | current | O6 |
| PE-010 | known | State at the §0 resolution: `dedbab3a` touches only `AGENTS.md` and the passive record; PR #501 is open against `main`; no `docs/fix/500-*` directory, no Fixes row, no session entry existed | `git show --stat dedbab3a`; `gh pr view 501`; directory/table scans, 2026-11-10 | current | O7, D1 — the sequence this session inherits |
| PE-011 | known | A unit doc carrying its PR URL needs its index row settled `done · [#N](<same url>)` (exact URL, backtick-tolerant), and a slug mismatch is its own violation — so the row's status form is fixed by the crate, not chosen here | `packages/agentic-workflow/src/edit/Roadmap.mjs:212-244` (`checkUnitDoc`) | current | O6 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | the guide declares its projection format where the emitter reads it: a `## Docs site` section whose fenced block carries `- format: md`, exact heading, one block, no second declaration anywhere else in the guide | P1 | the Docs site declaration | direct application (this session) | `rg -c '^## Docs site$' AGENTS.md` matches 1 and `rg -c '^- format: md$' AGENTS.md` matches 1 | Log `E` line with both counts (AC-S2) | planned |
| O2 | S3 | the emitter reports the declaration instead of degrading: at head `--check` exits 0 with `Format: md (declared)` and 0 stale files; the branch-point reproducer printed the degraded note first (RED); the prose commit itself moved zero projection bytes | P3 | the reproducer differential | direct application (this session) | `bun scripts/docs-generate.mjs --check` exits 0 (`Format: md (declared)` · 0 stale · `verdict: PASS`) | Log `E` lines E1 (base, degraded), E2 (head, declared), E3 (empty `docs/generated` diff for `dedbab3a`) | planned |
| O3 | S4 | the grown guide stays inside the declared context budgets — every budgeted document within its ceiling | P4 | the documents budget gate | direct application (this session) | `bun scripts/check-skill-context.mjs --documents` exits 0 (`PASS context documents: 4 budgeted documents`) | Log `E` line with the exit code and the PASS tally (AC-S4) | planned |
| O4 | S5 | no suite regresses: the affected set derived by `bun scripts/test-impact.mjs --base main` runs green — 43 suites at the moved base, every one green under bun; the branch-point derivation (`empty`) is recorded beside it so the moved base is disclosed, never hidden | P5 | the affected-set verification | direct application (this session) | `bun scripts/test-impact.mjs --base main` exits 0 (verdict `targeted`, 43 suites) and each derived suite exits 0 under `bun test --timeout=60000` | Log `E` line with both verdicts and the suite tally; the 43-suite run's per-file result summary (AC-S5) | planned |
| O5 | S6 | inline discipline holds: no repo review machinery runs on this change (zero `R`/`F` lines in this doc), and the deterministic gates do run, green, each with its exit code | P5 | the gate sweep | direct application (this session) | `rg -c '^\- \*\*[RF][0-9]+\*\*' docs/fix/500-declare-docs-site-block/SPEC.md` exits 1 (zero review/fold marks) | Log `G` lines, one per gate run, each carrying its exit code (AC-S6) | planned |
| O6 | S7 | the repository indexes and declared surfaces ship in the change: the Fixes row settles `done · [#501](<same url>)` against this doc's PR URL, the projection is re-rendered by the emitter (never hand-written), and the guide's README/docs sweep finds no other surface to update | P2 | the Fixes row and the regenerated projection | direct application (this session) | `rg -c 'issues/500' docs/ROADMAP.md` matches 1 and `bun scripts/docs-generate.mjs --check` exits 0 | Log `E` lines: the row's settle form, the regen's byte summary, the post-regen `--check` exit (AC-S7) | planned |
| O7 | S1 | the unit's planning ledgers are cut in the repo's own shapes before verification: XS/S embedded tables, one obligation row per `S#` with exactly one phase and one task, one acceptance criterion per `S#`, and the doc passes every reader that judges it (triage, phase-lint, promise-coherence, the unit-doc verifier) | P2 | the unit-doc cut | direct application (this session) | `bun scripts/unit-route.mjs --triage 500-declare-docs-site-block` exits 0 and `bun scripts/phase-lint.mjs docs/fix/500-declare-docs-site-block/SPEC.md` exits 0 (`verdict PASS`) | Log `E` line for both readers plus the pasted `## Triaged steps` block (AC-S1, AC-S7) | planned |
| O8 | S7 | the session entry lands through the flow's legal door: a `journal write` narrative fragment under the opted-in carrier, with `docs/LOGS.md` untouched, and the tree clean at handoff | P6 | the session entry | direct application (this session) | `ls .agentic-workflow/journal/*fix-500-declare-docs-site-block*narrative*` exits 0 | Log `E` line naming the fragment file (AC-S7) | planned |

## Triaged steps

Verbatim from `bun scripts/unit-route.mjs --triage 500-declare-docs-site-block`
after the doc was cut:

```text
TRIAGE — 500-declare-docs-site-block (fix)
Steps: plan, implement, evidence, review, docs
Tiers: plan: cheap, implement: cheap, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, tests: tests n/a, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/500-declare-docs-site-block
relay-next: create .pi-web/relays/500-declare-docs-site-block/ (charter → docs/fix/500-declare-docs-site-block/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/500-declare-docs-site-block", leg: "1") · legs: 7 = 6 phases + 1 coherence review
```

The lane runs inline (the owner's apply workflow): no Relay packet is cut for
this unit, the review step is the owner's external verification (S6), and this
block never reorders the frozen task list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-10, the issue, verbatim:
  ```
  ### What's broken

  `bun scripts/docs-generate.mjs --check` prints `Format: md — degraded (no \`Docs site\` block in AGENTS.md)` on every run: the repository's own `AGENTS.md` never declared the `Docs site` block that `init-workspace` fills in target projects, so the emitter's format discovery degrades to markdown with a warning instead of reading a declaration. The output format happens to be markdown anyway, so the projection is correct — but the repository ships a substrate mechanism (`## Docs site`, feature 01) that its own guide does not exercise, and every gate run carries a warning that reads like a defect.

  ### Detected in

  2026-11-09, external verification of feature #388 (`docs/features/388-extract-nan-vendor-coupling/external-verify.md`): the only advisory recorded. Verified pre-existing at base — `origin/main`'s `AGENTS.md` carries no `Docs site` block either.

  ### Reproduction steps

  1. `bun scripts/docs-generate.mjs --check`
  2. Observe `Format: md — degraded (no \`Docs site\` block in AGENTS.md)` on stdout.

  ### Expected behaviour

  The guide declares its projection format in a `## Docs site` block (exact heading — `scripts/unit-doc-phases.mjs` `sectionText` matches `^## Docs site[ \t]*$`), and the emitter reports `Format: md` with no degraded note.

  ### Root cause (if known)

  The repo's own guide predates or skipped the `Docs site` write that `skills/init-workspace/` performs on target projects; the emitter's degraded path (feature 396's no-silent-failure rule) reports it forever after.

  ### Acceptance criteria

  1. `AGENTS.md` carries a `## Docs site` section whose fenced block declares `- format: md` (the repository's actual, current projection format).
  2. `bun scripts/docs-generate.mjs --check` exits 0 with no `degraded` note and a byte-identical projection (`docs/generated/**` unchanged).
  3. `bun scripts/check-skill-context.mjs --documents` still passes (the guide grew by a few lines).
  4. No suite regresses: the affected set derived by `bun scripts/test-impact.mjs --base main` runs green.

  ### Rollback strategy (if known)

  Revert the single `AGENTS.md` commit; the emitter falls back to the degraded markdown path, which is today's behavior.

  ### Severity

  low (cosmetic / docs)
  ```
- **L2** — 2026-11-10, the requester's order, verbatim: "Apply to this repository: issue #500"
- **D1** — 2026-11-10, §0 resolution from state before any action: **continue** — the implementation was already on this branch (`dedbab3a`, PR #501 open, passive record present) with the unit dir, the Fixes row and the session entry absent; the workflow's missing-unit-dir rule (§5) ordered the ledger cut here; `fix`/`re-verify` were excluded for the absence of any `EXTERNAL VERIFY` block or review verdict. Authority: the owner's local workflow, §0.
- **D2** — 2026-11-10, the `passive` tier's "no unit doc ceremony" contract (`skills/execute-phase/references/risk-tiers.md` §The passive carrier) and this workflow's §5 unit-doc order both apply; instruction precedence (explicit prompt instruction above the nearest guide) resolves to cutting this doc while the passive record stays the prose commit's readback — both carriers kept, gates run to prove the coexistence. Authority: the repo's instruction-precedence rule + the owner's workflow §5; PE-004.
- **D3** — 2026-11-10, ordering disclosure: the first line of the change (the `AGENTS.md` block) was committed as `dedbab3a` **before** this run's §5 ledger freeze — that is the state §0 resolved; the ledgers are cut now, never retrofitted later, and every status flip below runs its validator in the foreground at this head. Authority: state evidence PE-010.
- **D4** — 2026-11-10, the session entry goes through the fragment door (`agentic-workflow journal write --kind narrative`), not a `docs/LOGS.md` append: with the carrier opted in the log's only legal writer is the merge aggregator, so a direct append would fail the push gate; the fragment is the auto flow's own door. Authority: `scripts/log-immutability.mjs` header + the log-session skill's two-doors rule; PE-008.
- **D5** — 2026-11-10, base moved after the fork: `origin/main` is 27 commits ahead (PR #499), so `test-impact --base main` derives 43 suites from a two-dot diff that carries main-side deltas, while the branch-point derivation is `empty`. Both run and both record; no integration is taken here (published history is the owner's; the hunks do not conflict). Authority: `git rev-list --count HEAD..origin/main` → 27; PE-007.
- **E1** — 2026-11-10, corpus **RED** at the branch point: `bun scripts/docs-generate.mjs --check` in a `mktemp -d` scratch copy of `5d778958` (removed after) · exit 0 · `Format: md — degraded (no `Docs site` block in AGENTS.md)` · 3 checked · 0 stale · `verdict: PASS` — the issue's advisory, observed before this run's writes.
- **E2** — 2026-11-10, corpus **GREEN** at head: `bun scripts/docs-generate.mjs --check` · exit 0 · `Format: md (declared)` · 3 checked · 0 stale · `verdict: PASS` — no degraded note (AC-S3).
- **E3** — 2026-11-10, `git diff --stat 5d778958 dedbab3a -- docs/generated` · no output — the prose commit moved zero projection bytes (AC-S3).
- **E4** — 2026-11-10, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 4 budgeted documents` (guide 640 → 652 lines, inside the declared ceiling; AC-S4).
- **E5** — 2026-11-10, `bun scripts/test-impact.mjs --base 5d778958` · `verdict: empty` (changed 2, executable 0 — the prose-only change); `bun scripts/test-impact.mjs --base main` · `verdict: targeted` · 43 suites (the moved base, D5/PE-007).
- **E6** — 2026-11-10, `bun scripts/ceremony.mjs tier classify` · exit 0 · `tier: passive`, `reason_kind: no-executable-effect`, `signals: []`, `task_size: {understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: none, verification: readback}` — the verdict copied into the Risk tier section.
- **E7** — 2026-11-10, `bun scripts/roadmap-settle.mjs` (pre-cut baseline) · exit 0 · `174 unit docs checked · 0 violations · verdict: PASS`.
- **E8** — 2026-11-10, pre-existing projection drift at the moved `origin/main` (`83b3b384`): scratch `bun scripts/docs-generate.mjs --check` · exit 1 · `1 stale` (`docs/generated/units.md`) — rendered diff 8 lines, rows 427/388 status cells; disclosed, does-not-affect this head (E2).
- **E9** — 2026-11-10, `git diff 5d778958...HEAD -- AGENTS.md` · only the added `## Docs site` block — the guide's other content is untouched by this change.

## Next

The owner is the external verifier (§8): review this diff, the obligations
ledger state and the verification block in the handoff. PR
[#501](https://github.com/gtrabanco/agentic-workflow/pull/501) carries the
change (`Closes #500`); the post-merge projection re-render belongs to the
owner's integration step (Known pre-existing issues, D5).

## References

- Issue [#500](https://github.com/gtrabanco/agentic-workflow/issues/500) — the
  unit's request; its "Detected in" citation names feature 388's external
  verification (path quoted inside L1 only — that unit dir landed on this
  repository's main after this branch forked).
- PR: https://github.com/gtrabanco/agentic-workflow/pull/501 — the delivery of
  this unit.
- Feature 396 (`doc-gen`) — the emitter and the no-silent-failure degraded
  path this declaration satisfies; the guide's `## Docs site` substrate is
  feature 01's, filled by `init-workspace` in target projects.
- `docs/workflow/GATE_INVENTORY.md` — which carriers the deterministic gates
  named in P5 run on.

## Branch

`fix/500-declare-docs-site-block`

## Depends on

none

## Regression scope

| Scenario | Verified by |
|---|---|
| A project with no `Docs site` block still degrades to markdown with the warning (feature 396's contract) | `bun test scripts/docs-generate.test.mjs` exits 0 — the degraded-path corpus |
| A project declaring another format still selects its emitter (the declaration is honoured, not forced to md) | `bun test scripts/docs-generate.test.mjs` exits 0 — the format-selection cases |
| The guide's pre-existing content is untouched — only the block was added | `git diff 5d778958...HEAD -- AGENTS.md` shows only the added block (E9) |
| The fix-index row parses, settles, and the in-flight tracker stays correct (a `done` row keeps this doc out of the claim sweep) | `bun scripts/roadmap-settle.mjs` exits 0 (0 violations) and `bun scripts/docs-generate.mjs --check` exits 0 |
| `docs/LOGS.md` is byte-untouched by this session (aggregator-only) | `git diff 5d778958...HEAD -- docs/LOGS.md` prints nothing and `bun scripts/log-immutability.mjs` exits 0 |
| No suite regresses | the P5 sweep: the 43 derived suites plus the root suite, each exiting 0 (O4, O5) |
