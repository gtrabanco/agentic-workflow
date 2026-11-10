---
type: fix
scope: xs
---

# fix/269-external-verify-findings

> One-line: fold every fixable finding of the 2026-11-10 `EXTERNAL VERIFY`
> receipt on PR #506 (the docs-only park of issue #269) — B1's declared-twice
> prose/machine contradiction on the issue, advisories A1–A3's stale surfaces —
> with A4 recorded as an evidenced `n/a`.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#269` — the target issue of every finding. The batch rides PR #506 and does
**not** close #269 (D3): the issue stays OPEN and parked behind its native
blocked-by #434; the PR keeps `Refs #269, #434`.

## Specs

**S1 — apply the request to this repository.**
> "Apply to this repository: fix all fixable findings"

**S2 — fold the blocker B1: the issue's dependency prose agrees with the machine.**
> (B1) forge prose: issue gtrabanco/agentic-workflow#269, body → "## Dependencies — triage update 2026-11-07", bullet 1 ("Related (soft) — #434, after it") — no file:line; the surface is the issue body.
> Reproducer: gh issue view 269 --json body → bullet classifies #434 as Related (soft), while gh api graphql blockedBy(269) → [{number:434, state:OPEN}]. The prose half of the declared-twice rule ("declared twice and must agree", AGENTS.md) now contradicts the machine relation; ISSUE_WORKFLOW §Relationships sends triage to that prose, so the hard blocker is under-ranked on the surface humans plan from. Smallest action (/aw-local-apply): flip bullet 1 to native blocked-by #434 — optionally also add #434 to the primary ## Dependencies section.
> [elided: base-vs-head paragraph — receipt `.agentic-workflow/journal/20261110T202600Z-feat-269-efficient-context-targeting-narrative-local.md`]

**S3 — fold advisory A1: row 80's depends-on cell carries the native blocker.**
> (A1) docs/ROADMAP.md:101 (row 80), depends-on cell "— (soft: 65, merged)" — omits the new native 434 blocker. Advisory: the same row's description carries "#269 is now natively blocked-by #434", batch-scheduler takes hard blockers from the forge relation as authoritative (scripts/batch-scheduler.mjs:13), and row 174 is precedent for a description-carried blocker with a "—" cell.

**S4 — fold advisory A2: the primary `## Dependencies` section lists #434.**
> (A2) issue #269, primary "## Dependencies" section — lists no #434 at all. Advisory: incomplete rather than contradicting (it asserts nothing false; the machine relation gates merges regardless); same smallest action as B1 if the owner wants the section complete.

**S5 — fold advisory A3: the three statements invalidated by the feat/69 deletion are corrected, dated.**
> (A3) PR #506 body ("The stale origin/feat/69... branch is left untouched, as ordered"), issue #269 scope comment ("stays untouched"), docs/ROADMAP.md:101 withdrawn clause ("The stale branch feat/69... carries this issue's number") — three dated statements made false only by the owner-ordered feat/69 deletion executed during this verification run, not by the change (at head-before-run all three were true). Why advisory: misattributing session-side mutation to the change fails the stability check.

**S6 — advisory A4 is recorded, never repaired.**
> (A4) environment: the owner-ordered push ran the pre-push hook — tmp-gc removed 3 /tmp/differential-baseline-* dirs (declared sweep; possibly another session's scratch, disclosed) and worktree-guard REPORTs this worktree at .worktrees/ outside the legal .git/worktrees home (pre-existing layout; gate verdict PASS).

**S7 — inline application; the deterministic gates are the only gates that run.**
> "Work inline — never run this repo's own machinery on its own surgery. No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always. **Live-tree guard**: code introduced by this change … is never executed against the live repository or a shared worktree until verified — mutating paths run only in scratch (§3). An accidental side effect is disclosed, cleaned, and reported in the handoff — never hidden, never doubled."

**S8 — documentation and state ship in the same change, through the owning surfaces.**
> "- Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events;
> - Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead;
> - `docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff;
> - The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection."

## Impact

- Forge prose (not repo bytes; recorded as Log `E` lines): issue #269's body
  gains the two dependency edits (S2/S4) and one dated correcting comment (S5);
  PR #506's body gets the superseding sentence and a dated corrections
  paragraph (S5).
- `docs/ROADMAP.md` row 80: the depends-on cell via `rowUpsert` (S3 — PE-002:
  the writer replaces the whole row, so slug/status/description are re-emitted
  byte-identical) and one same-line note via `annotate` (S5 — PE-001). The
  row's long description is otherwise untouched (regression pin).
- `docs/ROADMAP.md` `## Fixes`: this unit's registration row (S8 — PE-005: no
  CLI writer exists for that table; direct insert is the precedent of
  `263c40a8` and `2392be68`).
- `docs/generated/**`: re-rendered by `bun scripts/docs-generate.mjs` (S8) —
  the projection reads roadmap status cells and every digit-led
  `docs/fix/*/SPEC.md` (PE-009 pattern), so this unit doc and the Fixes row
  move rendered bytes.
- `docs/passive/2026-11-10-park-269-verify-findings.md`: the tier's readback,
  written by `ceremony passive add` (the carrier's only writer).
- `.agentic-workflow/journal/`: this session's narrative fragment (`journal
  write`) — the legal session door (PE-006).
- `docs/LOGS.md`: **untouched** — S8's manual-append door fails the push gate
  for a non-aggregator identity (PE-006, D4); the fragment door carries the
  record instead.
- The 2026-11-10 `EXTERNAL VERIFY` receipt fragment is immutable history: this
  batch is recorded here, the receipt is not edited — the next verify runs as a
  delta against it.

## Retirements

- The prose classification `Related (soft) — #434` on issue #269 — replaced by
  the blocked-by wording (S2); pin:
  `gh issue view 269 --json body --jq .body | rg -c 'Related \(soft\) — #434'`
  → 0 (was 1, E1).
- The PR #506 sentence `left untouched, as ordered` — superseded by the dated
  sentence (S5); pin: `gh pr view 506 --json body --jq .body | rg -c 'left untouched, as ordered'`
  → 0 (was 1, E4).
- The scope comment's `stays untouched` claim — retired as a standing claim by
  the dated correcting comment (the comment bytes remain dated history);
  pin: the correcting comment exists (`… contains("Branch note superseded") …` → 1).
- Row 80's present-tense `carries this issue's number` — the bytes remain as
  the withdrawn historical clause; its standing is dated by the annotate note
  (pin in O4), never rewritten in place.
- Nothing else can be removed: this batch only adds corrections — no helper,
  token, script or contract is superseded (`rg -c` over the surfaces above is
  the whole negative set).

## Non-goals

- No repo code, skill, script, template or schema bytes change.
- No rescue of `origin/feat/69-efficient-context-targeting` content (deleted on
  owner order; the local backup ref `refs/backup/feat-69-efficient-context-targeting`
  is not a product surface).
- No closing of #269, no push, no `review-change`/`audit-pr`/fold cycle (S7).
- No repair of A4's environment facts (O6 `n/a`).
- No edit of the `EXTERNAL VERIFY` receipt fragment; no `docs/LOGS.md` hand
  append (PE-006).

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify` over the change's own
paths; copied verbatim, never written from memory (E5):

- **Tier** — `passive` · **Task Size** — `understood: true`,
  `contained_risk: "contained"`, `resumable_from_diff: true`,
  `ceremony: none`, `verification: readback` · **signals** — `[]`
- **Reason** — `every changed path is documentation, an image or prose: no
  executable effect` (`reason_kind: no-executable-effect`).
- **Named high-risk item** — none — not a high-tier unit.

The `passive` contract's "no unit doc ceremony" and this command's §5 unit-doc
cut are both honoured by keeping the passive record as the change's readback
*and* cutting the ledgers the owner's workflow orders: D2 records the
precedence decision (the fix/500 precedent does exactly this), and the
deterministic gates below prove the coexistence breaks nothing. Final
classification over the complete path list is re-run at close (E5) and its
paths line is the one recorded here.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves it.

- **AC-S1 (S1)** — the request is applied on this branch and handed to the
  owner as a diff with closed ledgers — proved by the handoff block (diff
  summary, obligations state, verification block, failed/skipped checks) and by
  `git diff --stat e5933aef...HEAD` naming this unit's surfaces.
- **AC-S2 (S2)** — the issue's prose agrees with the machine — proved by
  `gh issue view 269 --json body --jq .body | rg -c '\*\*Blocked-by \(native, hard\) — #434, after it\*\*'`
  matching 1 **and** `gh issue view 269 --json body --jq .body | rg -c 'Related \(soft\) — #434'`
  exiting 1 (zero remaining) (E1 RED → E6 GREEN).
- **AC-S3 (S3)** — the row-80 cell carries the hard blocker without losing the
  soft fact — proved by
  `rg -c '434 \(hard, open\) · 65 \(soft, merged\)' docs/ROADMAP.md` matching 1
  (E3 RED → E7 GREEN) and `bun scripts/roadmap-settle.mjs` exiting 0.
- **AC-S4 (S4)** — the primary `## Dependencies` section lists #434 — proved by
  `gh issue view 269 --json body --jq .body | rg -c '^- #434 — native blocked-by'`
  matching 1 (E2 RED → E6 GREEN).
- **AC-S5 (S5)** — all three dated corrections exist — proved by the row note
  matching 1 (E7), by `gh pr view 506 --json body --jq .body | rg -c 'deleted on owner order on 2026-11-10'`
  matching 1 (E8), and by
  `gh issue view 269 --json comments --jq '[.comments[] | select(.body | contains("Branch note superseded"))] | length'`
  matching 1 (E8).
- **AC-S6 (S6)** — A4 is an evidenced `n/a`, never a silent drop — proved by
  `rg -c '^\| O6 \|.*\| n/a:' docs/fix/269-external-verify-findings/SPEC.md`
  matching 1, the row citing the receipt's A4 line, and no command in this unit
  touching `/tmp` for repair.
- **AC-S7 (S7)** — no review machinery ran and the deterministic gates did —
  proved by zero `R`/`F` lines
  (`rg -c '^\- \*\*[RF][0-9]+\*\*' docs/fix/269-external-verify-findings/SPEC.md`
  exits 1) and by the `## Log` `G` lines, one per gate run with its exit code.
- **AC-S8 (S8)** — the indexes and declared surfaces ship in the change through
  their writers — proved by
  `rg -c 'issues/269\) \| external-verify-findings' docs/ROADMAP.md` matching 1,
  `bun scripts/docs-generate.mjs --check` exiting 0 after the emitter's own
  re-render, the session fragment under `.agentic-workflow/journal/`, and
  `git diff e5933aef...HEAD -- docs/LOGS.md` producing no output (the
  aggregator's file untouched, D4).

## Future

none

## Future cost

none

## Applicable tests

- `bun test scripts/roadmap-settle.test.mjs scripts/roadmap-moved.test.mjs` —
  the roadmap suites over the touched row (15 pass / 0 fail, unchanged).
- `bun scripts/docs-generate.mjs --check` — the projection after the emitter's
  re-render (0 stale).
- `bun scripts/phase-lint.mjs docs/fix/269-external-verify-findings/SPEC.md`,
  `bun scripts/unit-route.mjs --triage 269-external-verify-findings`,
  `bun scripts/roadmap-settle.mjs`, `bun scripts/promise-coherence.mjs` — the
  unit-doc readers over this doc (each exits 0).
- `bun scripts/local-gate.mjs` — the offline gate over the whole change (test
  impact expected `empty`: prose only; the derivation is recorded as a G-line).

## Known pre-existing issues

- This worktree sits at `.worktrees/feat-269-efficient-context-targeting`,
  outside the legal `.git/worktrees` home — `worktree-guard` REPORTs it on
  every run with verdict PASS. **does-not-affect** this unit (pre-existing
  layout, disclosed in the receipt's A4).
- `origin/main` is 4 commits ahead of the branch's merge-base — **does-not-affect**:
  none of them touches `docs/ROADMAP.md`, so row 80 has no integration conflict;
  the post-merge projection re-render is the owner's integration step if main
  gains units.
- The `/tmp/differential-baseline-*` removals (A4) — **does-not-affect**: they
  are outside the repo and outside this change's surfaces (O6 `n/a`).

## Tasks

- P1 — Cut this unit doc: the verbatim `S#`s, the acceptance criteria, both embedded planning ledgers (incl. A4's `n/a` row), the `## Fixes` row, and the pasted triage block (validator: `bun scripts/unit-route.mjs --triage 269-external-verify-findings` exits 0 and `rg -c '^\| O[0-9]' docs/fix/269-external-verify-findings/SPEC.md` matches 8)
  (Implements: S1, S6, S8)
  Relevant files: docs/fix/269-external-verify-findings/SPEC.md, docs/ROADMAP.md
- P2 — RED: the frozen-failure corpus — the four pre-fix reproducer assertions (B1, A2, A1, A3) run against the unfixed surfaces and recorded as `E` lines with their exit codes (validator: `rg -c '^\- \*\*E[1-4]\*\*' docs/fix/269-external-verify-findings/SPEC.md` matches 4)
  (Implements: S2, S3, S4, S5)
- P3 — GREEN: the issue body's two dependency edits through `gh issue edit --body-file` (scratch-diffed first) (validator: `gh issue view 269 --json body --jq .body | rg -c '\*\*Blocked-by \(native, hard\) — #434, after it\*\*'` matches 1 and `gh issue view 269 --json body --jq .body | rg -c '^- #434 — native blocked-by'` matches 1)
  (Implements: S2, S4)
- P4 — GREEN: row 80's cell via `roadmap rowUpsert` (all cells re-emitted byte-identical) plus the dated `annotate` note — both rehearsed on a `mktemp -d` copy first (validator: `rg -c '434 \(hard, open\) · 65 \(soft, merged\)' docs/ROADMAP.md` matches 1 and `rg -c 'deleted on owner order \(tip da76ab97' docs/ROADMAP.md` matches 1)
  (Implements: S3, S5)
  Relevant files: docs/ROADMAP.md
- P5 — The forge halves of A3 — PR #506's superseding sentence + dated corrections paragraph, and the dated correcting comment on #269 — then the verification sweep and close: RED→GREEN re-runs (E6–E8), final tier classify + passive record, projection re-render, the unit-doc readers, the offline gate, the session fragment, and the ledger flip on every foreground-run validator (validator: `gh pr view 506 --json body --jq .body | rg -c 'deleted on owner order on 2026-11-10'` matches 1 and `gh issue view 269 --json comments --jq '[.comments[] | select(.body | contains("Branch note superseded"))] | length'` matches 1 and `bun scripts/local-gate.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | `roadmap annotate(nn, note)` appends `— <note>` to the row's description cell on the same physical line (a newline in a cell would terminate the row — the 2026-11-09 unit-227 damage) and emits `EDIT roadmap.annotate … Schema: roadmap-table@1 · Receipt: pass`; it throws when the row is absent | `packages/agentic-workflow/src/edit/Roadmap.mjs:243-285` | current | O4, P4 |
| PE-002 | repository | `rowUpsert` replaces the whole row — omitted cells become `""` — so slug, status and description must be passed through re-emitted; row 80's round-trip through this exact shape was proven byte-identical by the verify run's scratch proof (`cmp` clean, `Before: 744d4289 · After: ea35b42b`) | `packages/agentic-workflow/src/edit/Roadmap.mjs:59-100`; receipt `20261110T202600Z-…md` scratch proof | current | O3, P4 |
| PE-003 | sampled 2026-11-10 | `gh` 2.46.0 (2025-01-13) supports `gh issue edit <n> --body-file <file>` and `gh pr edit <n> --body-file <file>` (`-` reads stdin) — sampled from `--help`, never assumed from training | `gh issue edit --help`, `gh pr edit --help`, `gh version` | current | O1, O2, O5, P3, P5 |
| PE-004 | observed forge 2026-11-10 | issue #269's native blocked-by #434 was added `2026-11-10T17:35:27Z` (`blocked_by_added` REST timeline event — after the park fragment 17:34:03 and PR #506 17:34:43), so the change's own session created it and the base had no machine relation; batch-scheduler treats native `blocked-by` as the authoritative hard blocker | `gh api repos/gtrabanco/agentic-workflow/issues/269/timeline`; `scripts/batch-scheduler.mjs:13,116-131` | current | O1, B1's base side |
| PE-005 | repository — precedent | the `## Fixes` table has no CLI writer: `rowUpsert` is the features writer keyed on the `| NN |` header (RELEASE.md:37 says so explicitly), and fix rows were inserted directly in `263c40a8` (493) and `2392be68` (500), each alongside its unit's cut — so the direct insert is the house path, not a hand-edit defect (S8's "where one exists" clause is unmet) | `skills/unit-lane/references/RELEASE.md:37`; `git show 263c40a8`; `git show 2392be68` | current | O7, D5 |
| PE-006 | repository | once the fragment carrier is opted in, a non-aggregator commit touching `docs/LOGS.md` fails the push gate (byte-prefix + entry-block + identity rules), while carrier additions (fragments) are legal for anyone — so the session record goes through `journal write` and LOGS stays untouched | `scripts/log-immutability.mjs:1-60` | current | O7, D4 |
| PE-007 | measured 2026-11-10 | `bun scripts/ceremony.mjs tier classify` over this change's prose paths returns `tier: passive` (`reason_kind: no-executable-effect`, `signals: []`, `task_size.ceremony: none`, `verification: readback`) — a prose-only batch cannot flip the verdict, and the final run over the complete path list is recorded at close (E5) | `bun scripts/ceremony.mjs tier classify --paths …` | current | Risk tier section, D2 |
| PE-008 | measured 2026-11-10 (RED) | pre-fix state of every finding's reproducer: R1 `Blocked-by (native, hard)` count 0 (exit 1) while `Related (soft) — #434` counts 1; R2 `^- #434 — native blocked-by` count 0 (exit 1); R3 `434 (hard, open)` count 0 (exit 1); R4 row-note 0 (exit 1), PR sentence `left untouched, as ordered` count 1 (post-count 0, exit 1), correcting comment length 0 | the E1–E4 foreground runs | current | O1, O2, O3, O4, O5 — the §2 corpus RED half |
| PE-009 | repository | the units projection reads every digit-led `docs/fix/*/SPEC.md` plus the roadmap status cells, so this unit doc and its Fixes row move rendered bytes — the emitter must re-render, never a hand edit | `scripts/docs-generate.mjs` (`unitDirs`, `statusBySlug` sections) | current | O7 |
| PE-010 | observed 2026-11-10 (state) | §0 resolution state: no verdict newer than the 2026-11-10 receipt; PR #506 open with 0 reviews/0 comments; tree = head `e5933aef` + the receipt fragment only; no unit dir and no obligations ledger existed for this work (row 80 = `idea`, LANE_FLOW.md:12 "No unit folder yet") | journal listing, `gh pr view 506`, `git status --porcelain`, `docs/workflow/LANE_FLOW.md:12` | current | D1, D2 — the binding this batch answers |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | issue #269's dependency prose agrees with the machine: bullet 1 of `## Dependencies — triage update 2026-11-07` declares `Blocked-by (native, hard) — #434` with dated provenance, and the retired `Related (soft) — #434` spelling is gone from the body | P3 | the issue body's dependency edits | local-apply (this session) | `gh issue view 269 --json body --jq .body \| rg -c '\*\*Blocked-by \(native, hard\) — #434, after it\*\*'` matches 1 and `gh issue view 269 --json body --jq .body \| rg -c 'Related \(soft\) — #434'` exits 1 | Log `E` lines: E1 (RED: 0/exit 1, old spelling 1) and E6 (GREEN: 1, old spelling 0) | verified |
| O2 | S4 | the primary `## Dependencies` section names #434 as a native blocked-by, so the section a triage reads first is complete | P3 | the issue body's dependency edits | local-apply (this session) | `gh issue view 269 --json body --jq .body \| rg -c '^- #434 — native blocked-by'` matches 1 | Log `E` lines: E2 (RED: 0/exit 1), E6 (GREEN: 1) | verified |
| O3 | S3 | row 80's depends-on cell carries the hard blocker without losing the soft fact — exactly `434 (hard, open) · 65 (soft, merged)` — and the description cell's original bytes are preserved apart from the appended note | P4 | the rowUpsert + annotate pair | local-apply (this session) | `rg -c '434 \(hard, open\) · 65 \(soft, merged\)' docs/ROADMAP.md` matches 1 and `bun scripts/roadmap-settle.mjs` exits 0 | Log `E` lines: E3 (RED: 0/exit 1), E7 (GREEN: 1 + settle exit 0); the annotate receipt line (`EDIT roadmap.annotate … pass`) | verified |
| O4 | S5 | the row's withdrawn stale-branch clause gets its dated note — one `annotate` append naming the deletion, the backup ref, and the historical standing of the clause | P4 | the rowUpsert + annotate pair | local-apply (this session) | `rg -c 'deleted on owner order \(tip da76ab97' docs/ROADMAP.md` matches 1 | Log `E` lines: E4 (RED: 0/exit 1), E7 (GREEN: 1) | verified |
| O5 | S5 | the forge halves are corrected and dated: PR #506's body supersedes the untouched-branch sentence and carries the corrections paragraph; #269 carries one dated correcting comment | P5 | the PR body edit and the correcting comment | local-apply (this session) | `gh pr view 506 --json body --jq .body \| rg -c 'deleted on owner order on 2026-11-10'` matches 1 and `gh issue view 269 --json comments --jq '[.comments[] \| select(.body \| contains("Branch note superseded"))] \| length'` matches 1 | Log `E` lines: E4 (RED: PR post-count 0, comment 0), E8 (GREEN: 1 and 1) | verified |
| O6 | S6 | A4 is recorded, never repaired: an evidenced `n/a` — the `/tmp` sweep removals are environment paths outside the repo (recreated as live scratch by concurrent sessions) and the worktree location is the pre-existing layout | P1 | the A4 n/a row | local-apply (this session) | `rg -c '^\| O6 \|.*\| n/a:' docs/fix/269-external-verify-findings/SPEC.md` matches 1 | the row's own citation of the receipt's A4 line plus Log `E10`: `ls /tmp/differential-baseline-*` · exit 0 · present (concurrent sessions' live scratch, recreated after every sweep — not this change's bytes, nothing in repo bytes to repair (receipt A4 + Log E10) | n/a: environment paths outside the repo — concurrent sessions' live scratch, nothing in repo bytes to repair (receipt A4, Log E10) |
| O7 | S8 | the indexes and declared surfaces ship through their writers: the Fixes row is present, the projection is re-rendered by the emitter and `--check` is green, `docs/LOGS.md` is untouched, and the session record is a carrier fragment | P5 | the sweep and close | local-apply (this session) | `rg -c 'issues/269\) \| external-verify-findings' docs/ROADMAP.md` matches 1 and `bun scripts/docs-generate.mjs --check` exits 0 | Log `E` lines: the row count, the post-render `--check` exit, and `git diff e5933aef...HEAD -- docs/LOGS.md` producing no output; the fragment's name | verified |
| O8 | S1, S7 | inline discipline holds: no review machinery runs on this change (zero `R`/`F` lines in this doc), the mutating paths of the change run scratch-first, and the deterministic gates run green with their exit codes | P5 | the sweep and close | local-apply (this session) | `rg -c '^\- \*\*[RF][0-9]+\*\*' docs/fix/269-external-verify-findings/SPEC.md` exits 1 | Log `G` lines, one per gate run, each carrying its exit code; the scratch-receipt `cmp` line for the roadmap ops | verified |

## Triaged steps

Verbatim from `bun scripts/unit-route.mjs --triage 269-external-verify-findings`
after the doc was cut:

```text
TRIAGE — 269-external-verify-findings (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/269-external-verify-findings
relay-next: create .pi-web/relays/269-external-verify-findings/ (charter → docs/fix/269-external-verify-findings/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/269-external-verify-findings", leg: "1") · legs: 7 = 6 phases + 1 coherence review
```

The lane runs inline (the owner's apply workflow): no Relay packet is cut for
this unit, the review step is the owner's external verification (S7), and this
block never reorders the frozen task list.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-10, the request, verbatim:
  ```
  Apply to this repository: fix all fixable findings
  ```
  Context: the "findings" are the latest `EXTERNAL VERIFY` block for this
  branch — `.agentic-workflow/journal/20261110T202600Z-feat-269-efficient-context-targeting-narrative-local.md`
  (base `15c152a1` · head `e5933aef`, 1 blocker + 4 advisories) — quoted as
  S2–S6; S7/S8 quote this command's §4/§7 clauses.
- **D1** — 2026-11-10, owner request + recorded assumptions: "findings" =
  that receipt's B1 and A1–A4 (no newer verdict exists — no later receipt, PR
  #506 0 reviews/0 comments); "fixable" = restorable in repo/forge bytes within
  this workflow's bounds; anything else is an evidenced `n/a`, never silence.
- **D2** — 2026-11-10, precedence (prompt over template): the tier verdict is
  `passive`, whose contract says "this unit doc is not created at all", while
  this command's §5 orders the unit doc + ledgers unconditionally — both are
  honoured (passive record + unit doc), the fix/500 precedent recorded the same
  tension (its PE-004/D2), and the gates prove the coexistence breaks nothing.
- **D3** — 2026-11-10, no `Closes #269`: the issue is parked behind its native
  blocked-by #434 with six missing-scope items still open — closing it on this
  correction batch would ship a lie; PR #506 keeps `Refs #269, #434` and the
  template's Closes convention yields to the park state.
- **D4** — 2026-11-10, session record door: §7's "manual append" to
  `docs/LOGS.md` would fail the push gate for a non-aggregator identity
  (PE-006), so the record goes through `journal write` — the legal carrier
  door — and `docs/LOGS.md` stays byte-untouched.
- **D5** — 2026-11-10, the `## Fixes` row is inserted directly: no CLI writer
  exists for that table (PE-005), S8's "where one exists" clause is unmet, and
  both precedent commits did the same beside their unit's cut.
- **E1** — 2026-11-10, `gh issue view 269 --json body --jq .body | rg -c '\*\*Blocked-by \(native, hard\) — #434\*\*'` · exit 1 · 0 matches; companion `rg -c 'Related \(soft\) — #434'` · exit 0 · 1 match (RED — B1 defect present).
- **E2** — 2026-11-10, `gh issue view 269 --json body --jq .body | rg -c '^- #434 — native blocked-by'` · exit 1 · 0 matches (RED — A2 defect present).
- **E3** — 2026-11-10, `rg -c '434 \(hard, open\)' docs/ROADMAP.md` · exit 1 · 0 matches (RED — A1 defect present).
- **E4** — 2026-11-10, A3 triad RED: `rg -c 'deleted on owner order' docs/ROADMAP.md` · exit 1 · 0; `gh pr view 506 --json body --jq .body | rg -c 'deleted on owner order on 2026-11-10'` · exit 1 · 0 (old sentence `left untouched, as ordered` · exit 0 · 1); correcting comment length · 0.
- **D6** — 2026-11-10, pin-pattern correction: E1's pattern `\*\*Blocked-by \(native, hard\) — #434\*\*` was itself wrong — the bold span ends `#434, after it**`, never `#434**` — caught by the fixture pins before any live edit; the O1/AC-S2/P3 validator cells now carry the corrected `\*\*Blocked-by \(native, hard\) — #434, after it\*\*` (the built-body fixture proves it matches 1 post-fix and 0 pre-fix).
- **E1a** — 2026-11-10, corrected-pattern re-run on the still-unfixed body: `gh issue view 269 --json body --jq .body | rg -c '\*\*Blocked-by \(native, hard\) — #434, after it\*\*'` · exit 1 · 0 matches (RED genuine — E1's exit was real, its pattern could never have gone green).
- **E5** — 2026-11-10, final tier classify over the complete path list (`docs/ROADMAP.md,docs/fix/269-external-verify-findings/SPEC.md,docs/generated/units.md`) · exit 0 · `tier: passive` (`reason_kind: no-executable-effect`, `signals: []`, `ceremony: none`, `verification: readback`) — recorded verbatim in Risk tier (PE-007).
- **E6** — 2026-11-10, issue-body GREEN (post-fix): `rg -c '\*\*Blocked-by \(native, hard\) — #434, after it\*\*'` · exit 0 · 1; retired `rg -c 'Related \(soft\) — #434'` · exit 1 · 0; primary `rg -c '^- #434 — native blocked-by'` · exit 0 · 1 (O1/O2).
- **E7** — 2026-11-10, roadmap GREEN: cell `rg -c '434 \(hard, open\) · 65 \(soft, merged\)' docs/ROADMAP.md` · exit 0 · 1; note `rg -c 'deleted on owner order \(tip da76ab97'` · exit 0 · 1; receipts `EDIT roadmap.rowUpsert … pass` (`Before: fec5a576 · After: dc2f5757`) and `EDIT roadmap.annotate … pass` (`Before: dc2f5757 · After: c70a4f14`) — the hashes are byte-identical to the scratch fixture's, the live operation reproduced the rehearsal exactly (O3/O4).
- **E8** — 2026-11-10, forge A3 GREEN: PR body `deleted on owner order on 2026-11-10` · exit 0 · 1, retired `left untouched, as ordered` · exit 1 · 0, corrections paragraph · exit 0 · 1; correcting comment `contains("Branch note superseded")` · 1. Disclosed: `gh pr edit 506 --body-file` failed twice with `GraphQL: Projects (classic) is being deprecated … (repository.pullRequest.projectCards)` · exit 1 · body unchanged — applied through `gh api -X PATCH repos/gtrabanco/agentic-workflow/pulls/506 -f body=@<same fixture-diffed file>` · exit 0; same bytes, no second edit (O5).
- **E9** — 2026-11-10, fixture evidence (§3): the scratch roadmap run differed from the live file by exactly the row-80 line pair, `description preserved + note appended exactly: true`, slug/status unchanged; the built bodies differed by exactly two hunks each (issue: +1 bullet, 1 bullet replaced; PR: 1 sentence, +1 paragraph) and every post-fix pin was green on the built bodies before any live apply.
- **E10** — 2026-11-10, O6 environment re-check: `ls /tmp/differential-baseline-*` · exit 0 · present (`differential-baseline-44pTo6/…`) — concurrent sessions recreate them (G2's declared tmp-gc sweep removed 9, fresh ones were back afterwards) → strengthens the `n/a`: outside repo bytes, actively owned elsewhere, nothing here to repair; O6's cells amended accordingly (D7).
- **E11** — 2026-11-10, reader reds repaired in the doc, never in the checks: phase-lint first run `BLOCKED — box 7: task 1 carries a manual/external gate outside the hardening phase` (old P5's `gh pr` — position-scoped rule) → P5+P6 merged into the single final phase; promise-coherence first run `BLOCKED: validator-mismatch` — P2's count claim observed 16 (the word `RED` appears in 16 lines) → count pinned to `^\- \*\*E[1-4]\*\*` (the four RED lines), O6 observed 0 while still `planned` (pre-flip), passive surface `docs/passive/2026-11-10-park-269-verify-findings.md` `absent` → record created via `ceremony passive add`; `unit-doc 269-external-verify-findings validate` refused `ENOENT docs/features/…` (the op resolves the features home only) → fix docs verified by `roadmap check` (G4); `gh …` validators are reader-allowlist skips — foreground runs (E6/E8) carry their evidence, the skips stay disclosed.
- **D7** — 2026-11-10, O6's `required-evidence` amended before the flip: the planned `exit 2 (absent)` claim was not what the command produced (E10: exit 0, present) — the evidence cell now records the observation and why it strengthens the `n/a`; the validator cell (the row-pattern pin) is unchanged, and the ledger's freeze-except-status rule is not bent: this is a cut-time correction of a false claim, logged here rather than silently rewritten.
- **G1** — 2026-11-10, `bun scripts/docs-generate.mjs` + `bun scripts/docs-generate.mjs --check` · exit 0 · render `Files: 1 written · 0 deleted · 2 unchanged / verdict: PASS`; check `3 checked · 0 missing · 0 stale · 0 orphaned / verdict: PASS`; Fixes row present (`rg -c 'issues/269\) \| external-verify-findings' docs/ROADMAP.md` · 1). HEAD e5933aef842fce36cc6d5e6ea951998f5662d3e5.
- **G2** — 2026-11-10, `bun scripts/local-gate.mjs` · exit 0 · `local-gate: PASS — 17 step(s) in 165s`, 604 pass / 0 fail (30 suite files); disclosed: its declared tmp-gc sweep removed 9 `/tmp/differential-baseline-*` dirs (concurrent scratch, E10) and worktree-guard REPORTs this checkout's pre-existing `.worktrees/` location — verdict PASS both. HEAD e5933aef842fce36cc6d5e6ea951998f5662d3e5.
- **G3** — 2026-11-10, `bun test scripts/roadmap-settle.test.mjs scripts/roadmap-moved.test.mjs` · exit 0 · 15 pass / 0 fail (the suites over the touched row). HEAD e5933aef842fce36cc6d5e6ea951998f5662d3e5.
- **G4** — 2026-11-10, unit-doc readers: `bun scripts/phase-lint.mjs docs/fix/269-external-verify-findings/SPEC.md` · exit 0 · all five phases `PASS (6/6)`, fingerprint `462a3188e66b99af34ffd5683801c2da1b7a13730b2dad668bcd67fb2d2044cc` (P5 final-phase exemption); `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap check docs/fix/269-external-verify-findings/SPEC.md` · exit 0 · `verdict: PASS / violations: 0` (doc ↔ Fixes row); `bun scripts/roadmap-settle.mjs` · exit 0 · `178 unit docs checked · verdict: PASS / violations: 0` (E7). HEAD e5933aef842fce36cc6d5e6ea951998f5662d3e5.
- **G5** — 2026-11-10, `bun scripts/test-impact.mjs --base e5933aef` · exit 0 · `verdict: empty` (changed 2 · executable 0 · “no executable path changed — record this verdict, run no TDD ceremony, invent no test”) — recorded per the gate's own contract; the local gate ran its full 17-step graph anyway (G2). HEAD e5933aef842fce36cc6d5e6ea951998f5662d3e5.
- **G6** — 2026-11-10, carrier close: `git diff e5933aef...HEAD -- docs/LOGS.md` · exit 0 · no output (the aggregator's file untouched, D4); `agentic-workflow journal aggregate --check --json` · exit 0 · `ok: true, checked: 56, refusals: []`; fragments present — the park record `20261110T173403Z-…`, the verify receipt `20261110T202600Z-…` (C2 `97683332`), this batch's record `20261110T220312Z-…` (O7). HEAD 97683332a3f3a166195348a9170e33a5638d402b.
- **P1** — 2026-11-10 21:57–22:03, the batch: unit doc + frozen ledgers + Fixes row + re-rendered projection + passive record + the fixture-first roadmap/forge corrections · `10972b74`; verify receipt persisted · `97683332`.
- **G7** — 2026-11-10, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/269-external-verify-findings/SPEC.md` · exit 0 · `VERIFY PASS` (verify@1: sections, obligations-closure, provenance-stamp, receipt-marks, log-kinds, cited-paths, cited-gates — 0 violations; every `G` line carries its `HEAD`, every row closed: 7 `verified` + O6's reasoned `n/a:`). HEAD 97683332a3f3a166195348a9170e33a5638d402b.

## Next

Hand the diff to the owner (§8): diff summary, obligations state, verification
block, docs state, every failed/skipped/pending check — the owner is the
external verifier; this batch claims nothing until their verdict. Then the
owner's merge call on PR #506; the next external verify of this unit runs as a
**delta** against the 2026-11-10 receipt.

## References

- Receipt under correction: `.agentic-workflow/journal/20261110T202600Z-feat-269-efficient-context-targeting-narrative-local.md`
- PR [#506](https://github.com/gtrabanco/agentic-workflow/pull/506) (park of #269 — carries this batch)
- Issues [#269](https://github.com/gtrabanco/agentic-workflow/issues/269) (target), [#434](https://github.com/gtrabanco/agentic-workflow/issues/434) (native blocker)
- Precedent: `docs/fix/500-declare-docs-site-block/SPEC.md` (same workflow, passive tier + unit doc)

## Branch

`feat/269-efficient-context-targeting` — the correction batch rides the park
branch's open PR (D3); no separate `fix/269-*` branch and no stacked PR.

## Depends on

none

## Regression scope

- Row 80's description beyond the two intended mutations (the cell change and
  the one appended note) — verified by the scratch rehearsal byte-diff (the
  fixture run must show exactly those two deltas) and by
  `bun test scripts/roadmap-settle.test.mjs scripts/roadmap-moved.test.mjs`
  exiting 0 (15 pass / 0 fail, the suite that keeps the live tree green).
- The issue body's other sections — verified by the scratch `diff` of the body
  file before `--body-file` is applied: only the two dependency edits may
  appear.
- The projection — verified by `bun scripts/docs-generate.mjs --check` exiting
  0 after the emitter's own re-render, with no hand-written generated byte.
- The push gate's own rules — verified by `bun scripts/log-immutability.mjs`
  and `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate --check`
  staying green (fragment added, LOGS untouched).
