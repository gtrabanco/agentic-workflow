---
type: fix
scope: medium
---

# fix/429-log-session-command

> The `/log-session` extension command — the invocation becomes a fact the
> harness holds, never a claim the model makes. Applied inline per the owner's
> governing request (S13–S21 below); this command substitutes for the lane's
> plan step, so the ledgers are cut here and frozen at the cut.

## Issue

[#429](https://github.com/gtrabanco/agentic-workflow/issues/429) — WORKFLOW FIX:
`/log-session` dispatches prose, not code — extension command with invocation
marking and close-time detection. Roadmap row 429 (`log-session-command`). The
PR closes it with `Closes #429` in the body.

## Specs

**S1 — What is missing is the anchoring of the invocation itself.**
> The mechanical half is already code (`session-close.mjs`, `journal name`, `autoLogSession`); what is missing is anchoring the **invocation** itself in code, so "I ran /log-session" is a fact the harness holds, never a claim the model makes.

**S2 — `/log-session` becomes an extension command, and the handler marks the invocation.**
> `/log-session` becomes an extension command in `@gtrabanco/pi-agentic-workflow` (`pi.registerCommand`, the registrar wrapper already exists at `src/extension/index.ts` `toRegistrar`)
> 1. **Invocation marking** — the handler records that it was invoked this session (a marker next to the existing `.pi/.session-<id>.start` one, or equivalent).

**S3 — The mechanical facts and the target are computed by code; the model keeps only the prose.**
> 2. **Mechanical facts computed by code** — the handler runs `session-close.mjs render` (or its crate equivalent), resolves the carrier routing, and computes the fragment name via `journal name` when the carrier exists; the model's only job is the inherently-prose part (Summary/Decisions/Next), delivered as a directive with the exact target path + name already resolved.

**S4 — Close-time detection names the miss instead of letting it pass silently.**
> 3. **Close-time detection** — `session-close.mjs close` (or the wiring's `agent_settled`) names "invoked but no entry written" instead of letting the miss pass silently.

**S5 — The skill stays, and both doors share one writer path.**
> 4. **The skill stays** — `SKILL.md` remains the prose contract for agents without the extension; the command and the skill share the same writer scripts, so there is one behaviour, two doors.

**S6 — Acceptance criterion 1: the marker is written by the handler.**
> 1. Invoking `/log-session` in a pi session with the extension loads produces an invocation marker written by the command handler, not by the model.

**S7 — Acceptance criterion 2: the facts are the writer's own bytes.**
> 2. The rendered entry's mechanical facts (branch, commits, files, target path) come from the handler's own script run; a test proves the handler output is byte-identical to `session-close.mjs render` for the same facts (the #394 parity discipline).

**S8 — Acceptance criterion 3: the carrier routing resolves a conforming name, or the journal append.**
> 3. With the fragment carrier present (#405), the handler resolves a conforming fragment name via `journal name` and the directive names that exact path; without it, the directive names the `docs/LOGS.md` append.

**S9 — Acceptance criterion 4: a missing entry is never silence.**
> 4. Ending a session with an invocation marker but no written entry surfaces a named, non-silent signal (close refusal or sensor line) — never silence.

**S10 — Acceptance criterion 5: the two doors do not diverge.**
> 5. The skill command `/skill:log-session` and the extension command do not diverge: one shared writer path, pinned by test.

**S11 — Out of scope, and the dependencies that must not block this unit.**
> - The mechanical entry automation itself — that is `autoLogSession: mechanical` (#394, shipped; activation gated by the running-daemon window recorded in `docs/fix/405-journal-fragments/SPEC.md` D8).
> - The general prose→code classification of all skills — #408's territory; this issue ships one proven instance.
> - Any change to the entry shape or the journal's writers' split (feature 66 D2 holds).
> - **Feature 394 (done)** — `session-close.mjs render`, `log-facts@1`, the marker store, and the parity discipline this command reuses.
> - **#405 (open, soft)** — fragment-mode routing already exists in the scripts this command drives; the command composes with it whenever the carrier is present, and must not block on it.

**S12 — The owner's note that frames this unit as the pilot instance.**
> **this is unlikely to be the only case.** … Suggested path: let #408's inventory classify all 14 commands, with this issue's fix as the pilot instance for the "command-level invocation anchoring" class; `unit-lane` flagged here as the owner's prime suspect.

**S13 — The intent is resolved from state, and quoted verbatim (the owner's application protocol, §0–§1).**
> Print the resolution **before** any action — the state decides the sequence, the words only pick the verb … Outcome contract for any mismatch with reality — four outputs only, never an ad-hoc branch: `proceed` (state supports the intent), `empty` (intended action has zero matching rows — run nothing, record the search receipt, that counts as done), `ambiguous` (two continuations possible — ask **one** question), `mismatch` (state contradicts the intent — report state + evidence, ask). Never guess. … Number the request as `S1..Sn`, quoting my words **verbatim** — exact strings, error messages, examples. Never summarize, never add a requirement I did not ask for, mark assumptions as assumptions. Every later decision cites its `S#`.

**S14 — The frozen-failure corpus is RED before anything (§2).**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S15 — Fixtures before the real tree, and the live-tree guard (§3, §4).**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change. … **Live-tree guard**: code introduced by this change (commands, hooks, emitters, scripts with side effects) is never executed against the live repository or a shared worktree until verified — mutating paths run only in scratch (§3).

**S16 — No self-machinery on this change (§4).**
> **Work inline — never run this repo's own machinery on its own surgery** … No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: the §5 ledger freeze **is** the plan; implement against it, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.

**S17 — The ledgers are cut here, in the repo's own shapes, and frozen at the cut (§5).**
> This command substitutes for the lane's plan step, so it writes the planning ledgers in the repo's own shapes — row contracts owned by `skills/pre-execution-review/references/LEDGERS.md`, mirrored in `docs/fix/_TEMPLATE/SPEC.md`. A change applied without them is a legacy unit with no ledgers, and the repo's reviews and audits refuse it until they are constructed — so cut them here, never retrofit them later … **Obligations** — one row per normative behaviour, compatibility invariant, affected use case, and required failure, in the 9-column shape … **Planning evidence** — one row per Engineering claim the change rests on … **Acceptance criteria** — the unit doc's `## Acceptance criteria` section is frozen with one observable, testable criterion per `S#`, each naming the check that proves it … Task order is **dependency-topological first, smallest within a ready set**.

**S18 — Test-first, differential, and model memory is never a source (§6).**
> One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else. … **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it. … **Model memory is never a source**: any claim of the shape "tool/flag/syntax/API v behaves like X" carried from training is `inferred` at best — verify against the version the project pins (lockfile, manifest, action SHAs, current docs of that version) before it guides code. One fetch; record the source in the affected PE row. … Work-unit commits of ~400 authored changed lines (additions+deletions), Conventional Commit messages, tests and docs alongside behavior.

**S19 — Documentation and repository state ship in the same change (§7).**
> Ship the docs **in the same change** — never deferred: Unit doc: evidence rows appended in the declared shapes; obligations statuses flipped **only** on foreground-run validators (§8); `## Log` lines for events; Repository indexes: roadmap row, fix-index row — updated via the deterministic emitters/CLI where one exists, never hand-edited prose; a hand edit is a defect — report it instead; `docs/LOGS.md`: the session entry is appended (auto log-session flow or manual append) before the final handoff; The declared docs surface the change touches: README currency, guides, generated projections — run the renderer, never hand-write a projection.

**S20 — Verification is run in the foreground and handed off without self-approval (§8).**
> Close the obligations ledger first: every row flips to `verified` only with its validator actually run in the foreground and the evidence recorded where its `required-evidence` cell says — or an evidenced `n/a` (cite `path:line`, a ledger row, or a contract). A `planned`, `in-progress`, blank, or `deferred` row blocks the handoff — name the open ids; never defer out of the unit … Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, the §7 documentation state, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict. A checkbox or a passing suite grants nothing by itself.

**S21 — Correction bounds are hard (§9).**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers (re-running the touched obligation rows' validators and flipping their statuses back) → a second pass only if the **same** blocker still fails → then one `Needs your decision` result naming the open blockers. **A new finding never earns another cycle** — it goes to me, and the turn ends.

## Impact

What this change touches beyond its own lines:

- `packages/pi-agentic-workflow/src/extension/factory.ts` — the catalogue loop
  currently registers one dispatch-bound command per `user-invocable` skill. The
  `log-session` name changes registration owner: same catalogue entry, same
  command name, a code handler behind it instead of the bare `/skill:<name>`
  dispatch. Nothing else in the loop moves.
- Pi's own command resolution — the reason the loop must hand the name over
  instead of also registering: `pi.registerCommand` keeps duplicates and suffixes
  them (`/log-session:1`, `/log-session:2`) — verified against the installed
  `@earendil-works/pi-coding-agent` 1.5.0 (`dist/core/extensions/runner.js`
  `resolveRegisteredCommands`), the version this unit is developed against; the
  package's peer floor is `>=1.1.0` (PE-002).
- `packages/pi-agentic-workflow/src/extension/index.ts` — `agent_settled` gains
  the "invoked but no entry written" check, and `toInvocationContext` gains the
  session id the invocation record is keyed by.
- `packages/pi-agentic-workflow/src/routing/types.ts` — `InvocationContext` gains
  one optional read-only field (`sessionId`); every existing producer keeps
  compiling because the field is optional and read defensively.
- Consumers that must not change behaviour: `test/alias-coverage.test.mjs`,
  `test/argument-forwarding.test.mjs`, `test/shipped-adapter.test.mjs`,
  `test/folded-description.test.mjs`, the settings console's route list (it reads
  `catalogue.commands`, which keeps `log-session`, so a configured route for it
  is still not a typo), `scripts/workflow-status.mjs` and the conductor (they
  name skills, not handlers), `scripts/session-close.mjs` (driven, never edited),
  `packages/agentic-workflow`'s journal grammars (imported, never re-declared).
- Mentions that stop being true when this lands: the issue's "**It ran** — today
  unverifiable: nothing marks that the skill was invoked"; roadmap row 429's
  `idea` status; the fix-index's `none in flight` row.
- `skills/log-session/SKILL.md` — the prose door gains the two-door statement and
  the "these values are computed for you when the extension is loaded" pointer;
  its Process steps, Turn contract and guardrails stay the owner of the
  procedure (the code directive carries values, never procedure).
- `.gitignore` — the invocation marker needs its own narrow rule, beside
  `.pi/.session-*.start`.
- `docs/generated/**` — re-rendered by the renderer, never by hand.

## Retirements

Nothing is deleted by this unit, and the reason is a rule, not an omission:

- The **prose-only dispatch behind `/log-session`** is retired as the extension
  door's implementation (replaced by the code handler); the prose door itself is
  kept deliberately by S5 ("The skill stays"), so `readCatalogue` still lists the
  command and `/skill:log-session` still reaches the same `SKILL.md`. Evidence
  that no second surface is left behind: `rg -c 'registerCommand'
  packages/pi-agentic-workflow/src/extension/factory.ts` → 3 (the catalogue loop,
  the advance command, the settings pair) before and after — no new registration
  site is added, the loop's handler for one name is delegated.
- The **unverifiable invocation** ("nothing marks that the skill was invoked")
  retires: the invocation record is its replacement, owned by
  `log-session-invocation@1` in this package.
- The **#394 session-start marker** (`.pi/.session-<id>.start`) is *not* retired
  and not reused: it bounds the mechanical entry; this record marks the
  invocation. Two records, two owners, one directory (the issue names it: "a
  marker next to the existing … one").

## Non-goals

- Not `autoLogSession`'s mechanical entry automation (#394, shipped) and not its
  activation window (`docs/fix/405-journal-fragments/SPEC.md` D8) — S11.
- Not the general prose→code classification of all 14 workflow commands (#408),
  and not `unit-lane` — this unit ships one proven instance for that taxonomy
  (S11, S12).
- No change to the journal entry shape, to `log-facts@1`, to
  `journal-fragment-grammar@1`, to `journal-entry@1`, or to the two-writer split
  (feature 66 D2) — S11. The narrative entry stays the script's and the skill's
  bytes; the handler reads them, never re-renders them.
- No writer of `docs/LOGS.md` or of a fragment file inside the extension: the
  ownership map allows exactly one non-test script to rewrite a durable ledger
  and the session log is written by its sanctioned writers. The handler computes,
  records and directs; the prose lands through the existing writers.
- No shipping of `scripts/session-close.mjs` to target projects (the gap
  `## Known pre-existing issues` records); no new CLI, no new script, no new
  package dependency.
- No `session-close.mjs close` behaviour change: the issue's "close refusal"
  alternative is implemented as the wiring's `agent_settled` half, which is the
  door that exists in every project (S4 names either).

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify` over this unit's declared
paths at the cut; copied verbatim, never written from memory.

- **Tier** — `standard` · **Task Size** — `understood: true`, `contained_risk: contained`, `resumable_from_diff: true`, `ceremony: unit-doc`, `verification: gates` (15 declared paths → size tier `large`, so the two planning ledgers are separate files beside this doc — never both)
- **Named high-risk item** — `none — not a high-tier unit`

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it. Added on the owner's explicit instruction (§5 of the governing request);
this unit otherwise carries the `spec-by-reference` shape, where `## Specs` is
the frozen requirement text and `## Log` its receipts.

| id | criterion — what a reader can observe | the check that proves it |
|---|---|---|
| AC-S1 | The harness, not a model, holds "this session invoked `/log-session`": a record file exists immediately after the handler returns, with no turn executed. | `bun test packages/pi-agentic-workflow/test/log-session-command.test.mjs` — the case "the record exists before any model turn ran" passes |
| AC-S2 | `/log-session` is registered exactly once as an extension command and its handler is the code one; the catalogue entry survives. | the same suite's "one command named `log-session`, and it is the code handler" case + `bun test packages/pi-agentic-workflow/test/alias-coverage.test.mjs` exits 0 with `log-session` still in the catalogue |
| AC-S3 | The directive's facts block is `session-close.mjs render --kind auto`'s own stdout, byte for byte, in the same repository. | the same suite's parity case, which runs the script in a `mktemp -d` fixture and compares bytes |
| AC-S4 | With `.agentic-workflow/journal/` present the directive names a fragment path whose name equals the crate CLI's answer for the same facts; without it, the directive names the `docs/LOGS.md` append. | the same suite's two carrier cases + the CLI parity case running `bin/agentic-workflow.mjs journal name --kind narrative` |
| AC-S5 | A settled turn with an invocation record and no entry produces one non-silent named notice; an entry present removes the record and stays silent; an unreadable record is named, never dropped. | the same suite's detection cases + `cd packages/pi-agentic-workflow && bun run test` exits 0 |
| AC-S6/AC-S7/AC-S8/AC-S9/AC-S10 | The issue's own five criteria are carried by the rows of `planning-obligations.md` named in their `affected-use-case-or-invariant` cell (O2/O3, O4, O5, O7/O8, O9/O10, O6) and each flips to `verified` only on its validator. | `planning-obligations.md` — every row `verified` with its validator's observed run in this doc's `## Log` |
| AC-S11 | Nothing out of scope moved: `session-close.mjs`, the crate's four journal modules and `skills/log-session/SKILL.md`'s Process/Turn-contract rules are byte-identical or carry only the two-door statement, and no entry shape changed. | `git diff --stat main…HEAD -- scripts/session-close.mjs packages/agentic-workflow/src/log packages/agentic-workflow/src/journal` → empty; the SKILL.md diff names only the two-door rows |
| AC-S12 | The pilot instance is recorded where #408's inventory will read it: this unit's `## Future` and `## Future cost` rows name the class and its first instance. | `sed -n '/^## Future/,/^## Future cost/p' docs/fix/429-log-session-command/SPEC.md` shows the rows; `bun scripts/phase-lint.mjs docs/fix/429-log-session-command/SPEC.md` exits 0 |
| AC-S13 | The resolution was printed before the first action, and every later decision cites an `S#`. | this doc's `## Specs` (verbatim quotes) and the `authority-source` column of every obligation row |
| AC-S14 | The suites land RED on the missing mechanism, then GREEN, both observed in the foreground, recorded as `E` rows naming both SHAs. | `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exit non-zero at the red commit, 0 at the green one — the `## Log` E rows |
| AC-S15 | No new mechanic ran against the live tree: every fixture case runs in `mktemp -d`, and the only live-tree commands run are read-only gates. | the suites' own fixture roots (`log-session-*` tmpdirs, removed in `after`); `git status --porcelain` names no scratch path |
| AC-S16 | No `review-change`/`audit-pr`/fold run appears in the receipts; the repo's deterministic gates do. | this doc's `## Log` — only `E`/`G` lines naming commands, no review-cycle `R` rows |
| AC-S17 | The two ledgers exist in the repo's own shapes, cut before the first line of code, with every obligation row `planned` at the cut and one phase + one task per row. | `bun test scripts/ledger-ownership.test.mjs` exits 0; `bun scripts/phase-lint.mjs docs/fix/429-log-session-command/SPEC.md` exits 0 |
| AC-S18 | One RED test per requested rule and one per existing command sharing the changed code; the differential against the base commit is recorded; no claim rests on model memory (every pi-behaviour row cites the installed version's source). | `bun test packages/pi-agentic-workflow/test/log-session-command.test.mjs` names the unchanged-dispatch case for the other 12 commands; the `## Log` differential E rows; `planning-evidence.md` cites source paths, never "known" |
| AC-S19 | SKILL.md, the package README, the roadmap row, the fix-index row, the changeset, the `.gitignore` rule and the regenerated projections ship in this change. | `bun scripts/lint-changeset.mjs` exits 0, `bun scripts/version-parity-gate.mjs --content --base main` exits 0, `bun scripts/docs-generate.mjs --check` exits 0 |
| AC-S20 | Every obligation row is `verified` on a foreground run or an evidenced `n/a`; the handoff reports commands with observed results and claims nothing. | `planning-obligations.md` status column; the handoff's verification block |
| AC-S21 | After the owner's verdict: at most one correction batch + one recheck of the same blockers; a new finding is reported, not cycled. | the `## Log` correction rows of the next turn |

## Future

- 2026-11-07, **ship the writer scripts to target projects** (`open`) —
  `scripts/session-close.mjs` is named by the shipped `log-session` skill and by
  this command's directive, and exists only in this repository. `init-workspace`
  copies `template/`, which carries no `scripts/` tree. Owner decision at triage
  of that unit: ship the script, or move its render/close half into
  `@gtrabanco/agentic-workflow`'s CLI (row 91, the ceremony-runner migration).
- 2026-11-07, **the second door of the close refusal** (`open`) —
  `session-close.mjs close` could read the invocation record and refuse while a
  session that invoked `/log-session` left no entry. Deferred: it is the repo
  script's door (absent in target projects) and the `agent_settled` half already
  satisfies S9's "never silence".
- 2026-11-07, **the class this instance belongs to** (`open`) — the same
  anchoring for the other prose-dispatched commands, `unit-lane` first (S12);
  #408's inventory classifies, this unit is the pilot instance.

## Future cost

- A command name this package owns in code stays out of the catalogue's dispatch
  binding: the table in `packages/pi-agentic-workflow/src/extension/factory.ts`
  is the one place a name moves from prose dispatch to a code handler, and its
  test names the pair (binding: any future code-anchored command; owner: this
  unit's O3).
- Any journal writer added later must key off the invocation record's contract id
  and never re-render the entry's bytes (binding: `log-session` writers; owner:
  S11's split and O5).

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs`
- `bun test packages/pi-agentic-workflow/test/log-session-command.test.mjs`
- the whole package suite: `cd packages/pi-agentic-workflow && bun run test`
- the root gate: `node scripts/run-root-suite.mjs` (and the bun leg per file for
  the suites this touches: `scripts/ledger-ownership.test.mjs`,
  `scripts/normative-drift.test.mjs`, `scripts/red-first.test.mjs`,
  `scripts/session-close.test.mjs`, `scripts/skill-lint.test.mjs`,
  `scripts/check-skill-context.test.mjs`, `scripts/docs-generate.test.mjs`,
  `scripts/invocation-drift.test.mjs`)
- the repo lints this change owes: `bun scripts/skill-lint.mjs`,
  `bun scripts/check-skill-context.mjs`, `bun scripts/docs-generate.mjs --check`

## Known pre-existing issues

- **`scripts/session-close.mjs` is not shipped to target projects.** The template
  scaffold carries no `scripts/` tree (`find template -name '*.mjs'` → 0 files),
  while `skills/log-session/SKILL.md` names the script in its Turn contract and
  steps 4–5 — so the prose door already points at a command that only exists in
  this repository. `affects` this unit: the handler runs that script, so the
  mechanical-facts half degrades to a *named* absence outside this repo (O11).
  Its fix is a substrate issue of its own (a `## Future` row below), not a fork
  in this unit's behaviour.
- **Two narrative entry shapes coexist** — `scripts/session-close.mjs`'s
  `renderEntry` (`- **Commits:** n (range)`, comma-joined files) and the crate's
  `renderEntryBlock` narrative branch (`- **Summary:**` first, `` `range` ``
  un-parenthesised, space-joined files). `affects` this unit only as a reason:
  the handler renders nothing itself (S11 freezes the shape split), so it cannot
  pick a side, and the parity criterion is stated against the writer the skill
  already names (S7).
- **#405 D8's activation window** (`autoLogSession` is `{}` — off — in this
  project until the released package and a daemon restart). `does-not-affect`
  this unit: the invocation record is keyed by the session id the command context
  already carries and is written on invocation, not at `session_start`.
- **`docs/LOGS.md` is not strictly chronological** (fix/405's declared known
  issue). `does-not-affect` this unit: it orders no journal rows.

## Tasks

- P1 — Freeze the unit doc and its two planning ledgers (validator: `bun scripts/phase-lint.mjs docs/fix/429-log-session-command/SPEC.md` exits 0)
  (Implements: S13, S17)
  Relevant files: docs/fix/429-log-session-command/SPEC.md, docs/fix/429-log-session-command/planning-obligations.md, docs/fix/429-log-session-command/planning-evidence.md
- P2 — Land the Pi-free core suite red on the missing module (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits non-zero naming `Cannot find module` for `dist/log-session-invocation.js`)
  (Implements: S14, S18, S1, S3, S4, S8)
  Relevant files: packages/pi-agentic-workflow/test/log-session-invocation.test.mjs
- P3 — Implement the invocation core: record store, carrier routing, writer run, satisfaction, directive (validator: `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S8, S15)
  Relevant files: packages/pi-agentic-workflow/src/log-session-invocation.ts
- P4 — Register the code command and the settled-turn check (validator: `bun test packages/pi-agentic-workflow/test/log-session-command.test.mjs` exits 0)
  (Implements: S2, S5, S6, S9, S10, S18)
  Relevant files: packages/pi-agentic-workflow/src/extension/log-session-command.ts, packages/pi-agentic-workflow/src/extension/factory.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/routing/types.ts, packages/pi-agentic-workflow/test/log-session-command.test.mjs
- P5 — Pin the two parities and the shared writer path against the real writers (validator: `bun test packages/pi-agentic-workflow/test/log-session-command.test.mjs` exits 0 with the `session-close.mjs render` byte-comparison case named)
  (Implements: S3, S5, S7, S10)
  Relevant files: packages/pi-agentic-workflow/test/log-session-command.test.mjs
- P6 — Land the substrate state and docs: the marker ignore rule, the two-door prose, the README surface, the roadmap row through the CLI, the fix-index row, the release intent (validator: `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S19, S5, S12)
  Relevant files: .gitignore, skills/log-session/SKILL.md, packages/pi-agentic-workflow/README.md, docs/ROADMAP.md, .changeset/429-log-session-command.md
- P7 — Re-render the projections and close the ledgers on foreground runs (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S19, S20, S16)
  Relevant files: docs/generated/units.md, docs/fix/429-log-session-command/planning-obligations.md
- P8 — Run the declared verification set in the foreground and hand the diff over with its ledger state (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S11, S16, S20, S21)
  Relevant files: docs/fix/429-log-session-command/SPEC.md

### Planning evidence

One row per Engineering claim this change rests on. This unit's size tier is
`large` (15 declared paths), so the ledger is the separate file
[`planning-evidence.md`](planning-evidence.md) — named here, never restated:
this section carries no table (the `never both` rule of
`skills/pre-execution-review/references/LEDGERS.md`).

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the nine-column shape. The ledger is the separate
file [`planning-obligations.md`](planning-obligations.md) — cut frozen at
`planned`, closed only on foreground-run validators; this section names it and
carries no table (the `never both` rule).

## Triaged steps

> The owner's governing request (S16) substitutes for the lane's plan step, so
> `bun scripts/unit-route.mjs --triage 429-log-session-command` was not run: the
> task list above is the plan, frozen before the first line of code, cut from the
> issue's own order (record → compute → direct → detect → docs → verify). The
> machine route at the cut was `plan-from-issue` for `429` (`next:
> /unit-lane --from-issue 429`), which is exactly the step this request replaces;
> recorded so no later reader mistakes the omission for an oversight.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — (L) 2026-11-07, owner request verbatim: "Apply to this repository: issue #429" + the ten-step inline-application protocol, frozen as S13–S21 above; the issue's own words are S1–S12.
- **P1** — 2026-11-07, ledgers cut at `e1d94057` (main tip at the cut): unit doc + `planning-obligations.md` (O1–O17, all `planned`) + `planning-evidence.md` (PE-001–PE-015).
- **E1** — 2026-11-07, `bun test packages/pi-agentic-workflow/test/log-session-invocation.test.mjs` · exit 1 · `Cannot find module '../dist/log-session-invocation.js'` (the frozen corpus, observed before `d84c85bd` landed).
- **E2** — 2026-11-07, the same command at `7bfb4415` · exit 0 · `13 pass 0 fail` — the red/green pair O1 names (red `d84c85bd`, green `7bfb4415`).
- **E3** — 2026-11-07, `bun test packages/pi-agentic-workflow/test/log-session-command.test.mjs` · exit 1 · `Cannot find module '../dist/extension/log-session-command.js'` (observed before `5ad8b327`).
- **E4** — 2026-11-07, the same command at `7a7fb97b` · exit 0 · `12 pass 0 fail` — O2, O3, O4, O6, O8, O9, O13's cases (the O4 case was re-cut once: its first form compared two independent writer runs and lost a clock race under the whole-suite run — the replacement compares the writer's bytes through the handler and the fact cells across runs, and the case name is unchanged).
- **G1** — 2026-11-07, `bun scripts/phase-lint.mjs docs/fix/429-log-session-command/SPEC.md` · exit 0 · `verdict PASS`, 8 phases `PASS (6/6)`, fingerprint `1e84ef99…34fe7f` (O16).
- **G2** — 2026-11-07, `bun scripts/ledger-ownership.test.mjs` · exit 0 · `14 pass 0 fail`; `bun scripts/pre-execution-quality.test.mjs` · exit 0 (O16).
- **G3** — 2026-11-07, `cd packages/pi-agentic-workflow && bun run test` · exit 0 · `555 pass 0 fail` across 48 files (530 before this unit; O3, O4, O6, O9, O10's pins included).
- **E5** — 2026-11-07, per-file runs of every validator the ledger names, all exit 0: `alias-coverage` 15 · `skill-parity` 7 · `argument-forwarding` 6 · `shipped-adapter` 16 · `scripts/session-close.test.mjs` 28 · `packages/agentic-workflow/test/journal.test.mjs` 24 · `normative-drift` 21 · `red-first` 9 · `index-document` 9 · `doc-discipline` 21 · `roadmap-moved` 7 · `unit-route` 64 · `residue-dimensions` 29 · `structural-sibling-pins` 8 (O3–O6, O9, O10, O14, O16).
- **E6** — differential, 2026-11-07: `git archive main|HEAD` exported to `mktemp -d`, both copies run against one fixture repository — `session-close.mjs render --kind auto` byte-identical (`## <stamp>Z — test-branch — auto` / `- **Commits:** 0` / `- **Files:** —`, exit 0 both) and its `--help` block identical; `git diff --name-only main…HEAD -- packages/agentic-workflow` → 0 lines, so `journal name`'s source is the same file (its own run at head: exit 0, `.agentic-workflow/journal/20261107T021222Z-test-branch-narrative-429.md`; the archived copy exits 1 in both trees because an export carries no `node_modules` — an artifact of the harness, not a difference). `unit-route.mjs 429` differs as declared: `plan-from-issue`/`pending` before, `execute`/`in-progress` with `ledger-size: 33452 bytes` after (O10, O15).
- **G4** — 2026-11-07, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 0 file(s)`; `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 28 skills` (`log-session` main-est 2766 against its declared 2800; the cut base read 2655 — the two-door section was re-cut once to stay inside the ceiling, no ceiling was moved and no other skill's budget was touched); `--documents` · exit 0 (O14).
- **G5** — 2026-11-07, `bun scripts/lint-changeset.mjs .changeset/429-log-session-command.md` · exit 0 · `ok`. The whole-directory run exits 1 on a **pre-existing** defect: `374-pluggable-session-journal.md` cites `.agentic-workflow/journal-store/entries.db`, a gitignored runtime artifact that is not in the tree — reproduced identically in the `main` worktree, so it is not this unit's failure and this unit did not touch it (disclosed, O14).
- **G6** — 2026-11-07, `bun scripts/version-parity-gate.mjs --content --base main` · exit 0 · `VERDICT: PASS` (changeset route for `@gtrabanco/pi-agentic-workflow`; the crate and the schema package report `no-triggered-change`); `bun scripts/invocation-drift.mjs` · exit 0 · `verdict PASS` (O14).
- **G7** — 2026-11-07, `bun scripts/docs-generate.mjs` · exit 0 · `Files: 1 written · 0 deleted · 2 unchanged`, then `--check` · exit 0 · `verdict PASS` — `docs/generated/units.md` is the renderer's output, never hand-written (O15).
- **E7** — 2026-11-07, `git check-ignore -v .pi/.session-x.log-session` · exit 0 · `.gitignore:37` naming the new rule; `git check-ignore .pi/pi-agentic-workflow.json` · exit 1 (the tracked config stays tracked); `bun scripts/roadmap-settle.mjs` · exit 0 · `146 unit docs checked · violations: 0` (O14).
- **E8** — 2026-11-07, the indexes moved through their deterministic surfaces: `agentic-workflow roadmap docs/ROADMAP.md rowUpsert {nn:429,status:in-progress,…}` → receipt `before ca030136 → after 7ad192d9`, ok true, and `git diff main…HEAD -- docs/ROADMAP.md` shows only the status cell of row 429. The `## Fixes` active row has **no writer** (`index-document.mjs` exports readers only; `scripts/ceremony.mjs` lists `roadmap` as a deferred module), so that row is a hand edit — reported here as the defect the owner's rule names, and recorded in `## Future` as the emitter's absence.
- **P2** — 2026-11-07, implementation slices: `d84c85bd` red corpus · `7bfb4415` the Pi-free core · `5ad8b327` red code-door corpus · `7a7fb97b` the door and the settled turn · `9edc2a49` substrate state and docs. Scratch: every fixture ran under `mktemp -d /tmp/…`; `ls -d /tmp/log-session-*` after the suites → 0 directories, and `git status --porcelain` names no scratch path (O13).
- **G8** — 2026-11-07, `node scripts/run-root-suite.mjs --jobs 3` · exit 0 · every suite `PASS`. The first attempt at the default one-worker-per-CPU pool aborted with `ENOSPC: no space left on device, mkdtemp '/tmp/unit-route-…'` — the machine's `/tmp` sits on a 1,048,576-inode tmpfs at 88% inodes used, with 850 stale `unit-route-*`/`paw-*`/`normative-drift-*` fixture directories left by earlier suite runs (none of this unit's own fixtures leaked). Those stale directories were removed and the gate re-ran green; the underlying inode pressure is environmental and is reported, not smoothed (O17).
- **E9** — 2026-11-07, one pre-existing blocker found by this unit's own journal write and **reported, not repaired**: `.agentic-workflow/journal/20261107T001707Z-direction-review-odd-hybrid-design-notes-manual.md` (committed on `main` by `9b27fab9`, another session's log entry) carries `manual` where the grammar requires `mechanical|narrative`, so `agentic-workflow journal aggregate` refuses the whole carrier — `JOURNAL REFUSAL — unparseable fragment name …`, exit 2 — and merge-to-main aggregation is blocked for every branch, this one included. Reproduced against the committed tree, not caused by this change; its bytes belong to another session's entry, so this unit leaves them alone (the carrier's own rule is that a deletion is a lost entry). This unit's fragment was written, verified append-only by `session-close.mjs close` (exit 0, `fragments: 1`, `clean: true`, commit `03ce18df`) and is conforming: the name parses with `parseFragmentName`, the bytes are newline-terminated and CR-free.
- **E10** — 2026-11-07, the repair D1 ran, observed: `git mv` of the malformed fragment — `git hash-object` before and after the rename is `0de3f888dc678914e9aea1ac7a62fb09609a021b` (the entry's bytes are untouched, only its name moved into the grammar's slots) — then every carrier file answers `parseFragmentName` non-null. `bun scripts/local-gate.mjs --only crate-suite-bun` · exit 0 · `388 tests, 0 fail`; `--only crate-suite-node` · exit 0; `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` · exit 0 · `11 pass 0 fail`. Aggregation was verified **in scratch only** (`cp -a` of the tree to `mktemp -d`, then `agentic-workflow journal aggregate` → exit 0, `appended`/`removed` = all 5 fragments newest-first, carrier left holding `.gitkeep`, re-run exit 0 with `fragments: 0`) — the command rewrites the journal and deletes fragments, so it never ran against this worktree; `git status --porcelain` after it names only the staged rename. Scratch removed.
- **D1** — (D) Owner decision 2026-11-07, asked as one decision with three options after the `pre-push` gate blocked the push: **repair the carrier on this branch, then push and open the PR** (`repair-then-pr`). Authority: the owner's answer to `push-decision`. Scope note: this is the one file outside #429's declared set that this branch touches, on the owner's explicit order; the entry's content is another session's and was not edited, and `pi-compat-guard` (pre-existing at `main`, a network step the hook skips) was left for its own unit.
- **P4** — 2026-11-07, `f506ae89` (the carrier-name repair) pushed; **PR #448** opened against `main` with `Closes #429` — https://github.com/gtrabanco/agentic-workflow/pull/448. The push ran the installed `pre-push` hook, which executed the offline local gate and passed (no `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE` was used, so no exception was taken).
- **E11** — 2026-11-07, the row settle after PR open, observed: `roadmap rowUpsert` (the crate CLI) on row 429 → receipt `before fbd9a536 · after e0f0b371 · ok true`, status now `done · [#448](…)` with slug/deps/description re-emitted from `findRow`; the `## Fixes` active row carries the same settle (hand edit — that table has no writer, disclosed in `E8`). `bun scripts/roadmap-settle.mjs` · exit 0 · `violations: 0`; `bun scripts/docs-generate.mjs --check` · exit 0; `node scripts/unit-route.mjs 429` · route `close-out`, status `done`.
- **E12** — 2026-11-07, the forge state after the PR opened, observed: `gh api repos/…/pulls/448` → `mergeable: true`, `mergeable_state: clean` (11 commits, 18 files, +2038/−3, not draft); GraphQL `closingIssuesReferences` resolves to **#429 (OPEN)**, so the issue auto-closes on merge. The manual gate was dispatched for the branch (`gh workflow run root-suite.yml --ref fix/429-log-session-extension` → run `42366568913`) and **concluded `failure` in 10 s at the first step: `local-gate: FAILED at pi-compat-guard`** — the same pre-existing fault `E10`/`D1` names: `src/auto-log-session.ts(32,31)`, `src/extension/auto-log-session-wiring.ts(24,72)`, `(25,32)`, `(26,29)` answer `TS2307 Cannot find module '@gtrabanco/agentic-workflow/src/…'`, and this unit's `src/log-session-invocation.ts(36,43)` is one more line of that same already-failing class, on the same specifier the shipped files import. Proven at `main` in a clean `git archive main` export (4 errors, exit 1) — the step is red before this branch exists, and because the gate is fail-fast the other 11 steps (including `crate-suite-bun`/`crate-suite-node`/`root-suite`, all green locally: 388 tests ×2, 87 suites) never ran on that CI job. **Consequence for the merge decision: PR #448 cannot read green in CI until `pi-compat-guard`'s crate-resolution defect is repaired in its own unit** — it was reported as an option in the owner's decision and deliberately not touched here. `gh pr checks 448` before the dispatch: `no checks reported` (CI is manual-only).
- **E13** — 2026-11-07, **new finding, reported not cycled** (`gh api repos/…/contents/.agentic-workflow/journal?ref=<ref>`): the same malformed fragment is being repaired on **two sibling open PRs at once**, with a *different* target name than this branch's. `main` still carries `20261107T001707Z-direction-review-odd-hybrid-design-notes-manual.md`; `feat/432-model-memory-tier-0` (PR #447) and `feat/435-project-charter` (PR #446) both renamed it to `20261107T001707Z-main-narrative-local.md`; this branch (`f506ae89`, PR #448) renamed it to `20261107T001707Z-main-narrative-direction-review-odd-hybrid-design-notes.md`. Rename/rename with the **same** target merges as a no-op; with **different** targets the second merge is a conflict a human must resolve. The owner's decision on `repair-then-pr` covered making this branch green, not choosing which of the three repairs ships, so nothing further was changed here: the one-line fix if asked is to re-slot this rename onto `…-main-narrative-local.md` (bytes untouched, blob `0de3f888` either way), which makes all three merges order-independent.
- **V1** — 2026-11-07, O1–O17: every row's validator ran in the foreground in the runs above and each row flipped `planned → verified`; no row was deferred out of the unit and no status was granted without its command.
- **P3** — 2026-11-07, one declared-path correction, recorded rather than silent: the change landed **16** paths, not the 15 the `## Risk tier` row declared — `docs/generated/units.md` joined, written by `scripts/docs-generate.mjs` (O15) and never hand-edited. The tier is unchanged by it (`bun scripts/ceremony.mjs tier classify --base main` at head reports `standard` / `executable-content`, and the size tier was already `large`), and no obligation row was added or dropped for it.

## Next

The owner's external verdict on PR #448, then the merge (merge authority stays
with the owner — feature 20). On a verdict of blockers: one correction batch
limited to them, then one recheck of the same rows (§9).

## References

- PR: https://github.com/gtrabanco/agentic-workflow/pull/448

- Issue [#429](https://github.com/gtrabanco/agentic-workflow/issues/429); roadmap
  row 429; the owner's note on the same issue naming #408 and `unit-lane`.
- `docs/features/394-auto-log-session/` (the marker store, `log-facts@1`, the
  parity discipline this command reuses),
  `docs/fix/405-journal-fragments/` (the carrier and its grammar),
  `docs/fix/383-measured-acceptance/` (the `registerCommand` precedent),
  `docs/fix/374-pluggable-session-journal/` (the driver contract).
- `skills/pre-execution-review/references/LEDGERS.md` (row contracts),
  `skills/log-session/SKILL.md` (the prose door).

## Branch

`fix/429-log-session-extension`

## Depends on

None. `394` (merged) and `405` (its scripts and grammar, already on `main`) are
prerequisites that shipped; #405's open status is a soft order relation only, and
this unit must not block on it (S11).

## Regression scope

| scenario | verified by |
|---|---|
| Every other `user-invocable` skill still dispatches `/skill:<name>` with its arguments verbatim, on the routed model, with the busy/in-flight guards intact | `bun test packages/pi-agentic-workflow/test/argument-forwarding.test.mjs` and `test/alias-coverage.test.mjs` exit 0 with no assertion edited |
| `/log-session` remains a configured-route target: the settings console and the typo report still know the name | `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` and `test/dispatch-refusals.test.mjs` exit 0 |
| `scripts/session-close.mjs` render/close behaviour and its entry bytes are untouched | `bun test scripts/session-close.test.mjs` exits 0 (28 tests) and `git diff main…HEAD -- scripts/session-close.mjs` is empty |
| The #394 mechanical writer, the carrier and the fragment grammar are untouched | `bun test packages/pi-agentic-workflow/test/auto-log-session.test.mjs test/auto-log-session-wiring.test.mjs test/auto-log-session-parity.test.mjs` exit 0; `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0 |
| `docs/LOGS.md` and the fragment carrier gain no writer inside the extension | the new suites' case "no journal byte moved by the handler" and `bun test scripts/ledger-ownership.test.mjs` exit 0 |
| The `.pi/` directory keeps its tracked configuration file while the new per-session record stays ignored | `git check-ignore -v .pi/.session-x.log-session` exits 0 and `git check-ignore .pi/pi-agentic-workflow.json` exits 1 |
