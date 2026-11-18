---
type: fix
scope: small
roadmap_summary: Issue [#618](https://github.com/gtrabanco/agentic-workflow/issues/618) (L, fix-now 2026-11-18): the Layer 1 git identity guard read `git config <key>` — one positional, no value — as an implicit `set` write, so every identity check a model ran naturally was refused (headless: blocked outright). `findGitConfigWrites` now derives a write only from two or more positionals or an explicit verb, the tokenizer stops reading heredoc bodies and backtick spans as the command bash runs, and the sibling `-c`-only gate shares the same positional rule. SPEC: [SPEC](fix/618-git-identity-read-parser/SPEC.md)
---

# fix/618-git-identity-read-parser

> Fix specification — applied through the owner's local, unpublished workflow:
> the ledgers below are frozen at cut, the change is worked inline, and the owner
> is the external verifier.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#618` — [ISSUE: git identity guard blocks bare identity reads — one-positional config parsed as an implicit set](https://github.com/gtrabanco/agentic-workflow/issues/618).
The PR closes it via `Closes #618`.

## Specs

**S1 — A bare read is classified as an implicit `set` write.**
> The agent-side git identity guard (Layer 1, `packages/pi-agentic-workflow/src/guards/git-identity.ts`, issue #514) classifies a **bare read** — `git config` with a single positional key and no value — as an **implicit `set` write**.

**S2 — Exactly one positional is a read and passes.**
> - `git config <key>` with **exactly one positional** is a read and passes — equal footing with the `--show-origin --get-all` form the refusal text itself recommends as the diagnostic (today a bare read is refused while the recommended form passes, an inconsistency inside one message).

**S3 — Two or more positionals stay the implicit `set` write.**
> - `git config <key> <value>` (two or more positionals) stays the implicit `set` write it is today.

**S4 — Explicit verbs and scope flags keep their classification.**
> - Explicit verbs (`set`, `--add`, `--replace-all`, the destructive set) and every scope flag keep their current classification unchanged.

**S5 — Precision only: no assertion weakened, no write coverage lost.**
> - No assertion is weakened or skipped; the write-detection corpus from #514's suite must pass unchanged — the defect is precision on reads, never recall on writes.

**S6 — The filed reproducer.**
> - `findGitConfigWrites("git config user.name")` returns `[{ verb: "set", key: "user.name", scope: "local" }]` — git treats this as a read.
> - `decideGitConfigCall` on the same string returns `action: "ask"` (headless: `block`).

**S7 — The live capture: the tokenizer reads data as the command.**
> **Live capture while filing this very issue (2026-11-17):** the first `gh issue create` attempt was blocked by this same guard. The body text — carried in the same compound bash command via a heredoc — quotes the reproduction command as markdown prose. The tokenizer's statement split treats the `;` inside backtick code spans as shell separators and does not recognize heredoc bodies as non-executed text, so prose mentioning the commands was parsed as three writes and the whole `gh issue create` was refused. Same read-vs-write root cause, plus a boundary observation for triage to fold here or split: what counts as "the command a model asked bash to run" needs a stated answer for heredoc bodies and backtick code spans (the module doc's own boundary list — script, `!` command, indirection — does not name either).

**S8 — The sibling reader is audited in the same change.**
> - **Sibling surface to audit in the same change**: `scripts/git-config-writes.mjs` — the guard's header declares it "a second reader of the same shell shape … not a copy", but the positional-classification bias may be shared; verify it (and its suite) rather than assume.

**S9 — The refusal text's own recommendation pins the expected behaviour.**
> - **Irony that pins the expected behaviour**: `reasonFor`'s own `REPAIR` list recommends `git config --show-origin --get-all user.name` *because* it is safe — while the equally safe bare read is refused.

**S10 — Tests first, then the positional parser; the heredoc item folds only if it is that parser.**
> Tests first, red on the current tree: a corpus of bare reads (identity keys, quoted variants, compound commands) asserting no write is derived, alongside the existing write corpus staying green (two-positional implicit set, `--add`, `--unset`, `--global`, `--file`, `-c`). Then the parser: `!explicit && positional.length === 1` → not a write; `positional.length >= 2` → implicit `set`, exactly as today. The heredoc/backtick boundary observation is triaged separately — fold here only if the fix is the same parser change.

**S11 — Out of scope.**
> - **Layer 2** (pre-commit hook, push-range identity check) — commit-time evaluation reads resolved identities, not command lines; unaffected.
> - **The `ask`/`block` mode policy itself** — a separate decision; this issue only stops reads from reaching it.
> - **Re-litigating #514's write coverage** — unchanged and untouched.

## Impact

Cut at plan time. Every surface this unit reads or writes, and what changes on it:

| Surface | Why it changes | Its consumers |
|---|---|---|
| `packages/pi-agentic-workflow/src/guards/git-identity.ts` | S2/S3/S4: the implicit-legacy branch derives a write only from two or more positionals; S7: `tokenizeCommand` tells the command from the data it carries (newline separators, heredoc bodies, backtick substitution) and the module's boundary paragraph names both | the `tool_call` handler's bash branch (`src/extension/index.ts`); the sibling suite |
| `packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` | S1–S7, S9: the frozen read corpus, the heredoc/backtick corpus and the headless wiring case, beside the #514 write corpus untouched | the pi package test run (`bun run test`) |
| `scripts/git-config-writes.mjs` | S8: `classifyInvocation` stops calling a one-positional `git config <key>` a write; every explicit-verb, option and argv-array row is unchanged | the root gate; `scripts/git-config-writes.test.mjs` |
| `scripts/git-config-writes.cases.txt` | S8: `read` rows for the bare read forms (the corpus is the contract, not the suite's prose) | `scripts/git-config-writes.test.mjs` |
| `packages/pi-agentic-workflow/README.md` | S2/S7: the guard's shipped description must not promise the removed over-blocking, and it is the package's declared surface for the guard (one sentence each for the read rule and the heredoc boundary) | every package reader |
| `docs/ROADMAP.md` `## Fixes` row | this unit's registration (status cell hand-owned; the summary cell is the emitter's, from this doc's `roadmap_summary:`) | the roadmap readers |
| `.changeset/618-git-identity-read-parser.md` | the pi package's behaviour change ships its release intent (`patch`) | the release |
| `docs/fix/618-git-identity-read-parser/SPEC.md` | this unit doc | the external verify |

Sweep at plan time: `rg -n 'git config|identity guard' packages/pi-agentic-workflow/README.md
skills/ template/` names two prose homes — the package README's guard description
and the module header itself. `rg -c 'findGitConfigWrites|classifyInvocation'
--glob '!**/dist/**'` names exactly two readers, both in scope here; no skill
states the positional rule, so no skill prose changes.

## Surfaces

- `packages/pi-agentic-workflow`
- `scripts`
- `docs`

## Retirements

Nothing is retired. The change narrows one branch's condition and replaces one
tokenizer's data handling: no exported name, command, flag, config key or doc
section is superseded. `git config <key>` stops being reported as a write (S2)
and a heredoc body stops being tokenized as a command (S7) — both are
classifications this unit removes, and both keep their replacement: the read
passes, the write outside the body still asks.

## Non-goals

- **No `ask`/`block` policy change** (S11). A read never reaches `questionFor`; a
  write keeps asking, and a headless session still blocks instead of asking.
- **No Layer 2 change** (S11). The pre-commit hook and the push-range check read
  resolved identities, not command lines.
- **No widening of the write class.** `git config <key> --get` is *not* a read in
  git — it sets the literal value `--get`, exactly like the inverted
  `git config <key> --unset` trap the guard's own reason documents — so two
  positionals stay a write (S3, `PE-002`).
- **No heredoc body that a shell will execute.** A heredoc piped into an
  interpreter (`bash <<'EOF' … EOF`) carries commands the guard does not see;
  that boundary is stated in the module header and stays Layer 2's (S7's stated
  answer, `O9`).
- **No second shell parser.** `scripts/git-config-writes.mjs` keeps its own
  reader (different question, different input: repository source text, not a
  command line); only the positional rule is aligned (S8).
- **No README rewrite beyond the guard's own sentences.** The package README
  gains the read rule and the heredoc boundary where it already describes the
  guard; no other section is reopened.

## Risk tier

Verdict copied verbatim from `agentic-workflow ceremony tier classify` over the
planned paths (`contract: risk-tier-verdict@1`):

- **Tier** — `standard` · **Task Size** — understood / contained / resumable-from-diff
- **Named high-risk item** — none — not a high-tier unit (`signals: []`)
- **Reason** — `executable-content`: 2 planned paths carry executable content

## Future

none

## Future cost

- **The positional rule has two homes and one meaning.** A future `git config`
  form lands in both readers (`findGitConfigWrites`, `classifyInvocation`) with a
  corpus row each, because the module header binds them to one shell shape. Binds
  whoever next teaches either reader a new verb.
- **A stated boundary is a test.** The heredoc/backtick sentences in the module
  header are pinned by the suite's boundary cases (`O8`, `O9`); moving the
  boundary means moving its case in the same change.

## Applicable tests

- `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` — the
  frozen read corpus, the heredoc/backtick corpus, the headless wiring case, and
  the whole #514 write corpus unchanged.
- `bun test scripts/git-config-writes.test.mjs` — the sibling reader's corpus,
  the repository-compliance case included.
- `cd packages/pi-agentic-workflow && bun run test` — the package gate (bundle,
  `tsc`, every suite).
- `node scripts/run-root-suite.mjs` — the deterministic root gate.
- `bun scripts/docs-generate.mjs --check` — the projection is a fixed point.

## Known pre-existing issues

- **The tokenizer treats a newline as part of a word**, so a multi-line command
  without `;` was never split into statements and a write on its own line went
  unseen (`PE-006`) — *affects* this unit: S7's "what counts as the command a
  model asked bash to run" includes it, and the fix that makes a heredoc body
  data makes the line boundary explicit; recorded as `D3`.
- **A command substitution inside a double-quoted string is not parsed**
  (`echo "$(git config …)"` is one quoted token, `PE-008`) — *does not affect*
  this unit: S7 names heredoc bodies and backtick spans, and the `$( )` recall
  gap is a separate unit's decision. This unit only stops that shape's heredoc
  *body* from being read as commands.
- **`git config --file <path>` under a variable is judged outside scratch**
  (`--file $cfg` resolves literally, observed while probing) — *does not affect*
  this unit: the variable-indirection boundary is stated and unchanged.

## Acceptance criteria

- **AC-S1** — A bare read derives no write: `findGitConfigWrites` answers `[]` for
  an identity key with one positional, so nothing reaches the consent question
  and `decideGitConfigCall` answers `allow`. Check: `bun test
  packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case
  `R1`).
- **AC-S2** — `git config <key>` with exactly one positional passes in both
  postures — interactive asks nothing, headless returns `block: false` — for
  identity keys, quoted keys, a scope flag, a `--file`, a `--type=`, and a
  compound command ending in three reads. Check: the same suite exits 0 (cases
  `R2`–`R6`), plus the shipped-wiring case `R9`.
- **AC-S3** — Two or more positionals remain the implicit `set` write, including
  three positionals and an empty value, and `git config <key> --get`/
  `git config <key> --unset` stay writes (they set the literal value). Check: the
  same suite exits 0 (cases `W1`–`W4`).
- **AC-S4** — Every explicit verb (`set`, `--add`, `--replace-all`, `--unset`,
  `--unset-all`, `unset`, `unset-all`, `remove-section`, `rename-section`,
  `edit`) and every scope flag write keeps its classification and its reason.
  Check: the cut-head write corpus in the same suite passes unchanged.
- **AC-S5** — The #514 write corpus is not weakened: no assertion removed,
  skipped or narrowed, and the cut-head suite's 22 cases still pass. Check:
  `git diff 63c50421 -- packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`
  shows additions only, and the suite exits 0 with 22 + N pass.
- **AC-S6** — The filed reproducer inverts: `findGitConfigWrites("git config
  user.name")` is `[]` and `decideGitConfigCall("git config user.name")` is
  `allow`. Check: cases `R1`/`R2` of the same suite.
- **AC-S7** — A heredoc body is data: the live-capture shape (`gh issue create
  --body … <<'EOF' … EOF`, quoted, bare and `<<-` delimiters, nested in `$(…)`
  inside a quoted argument) derives no write, while a write outside the body —
  on its own line, or after the terminator — still asks. Check: cases
  `H1`–`H6` and `H8` of the same suite.
- **AC-S8** — The sibling reader shares the rule: `classifyInvocation` answers
  `read` for one positional and `write` for two or more, the corpus carries both
  rows, and this repository stays compliant. Check: `bun test
  scripts/git-config-writes.test.mjs` exits 0.
- **AC-S9** — The refusal text and the passing form agree: the bare read passes
  and the recommended `--show-origin --get-all` form passes, both asserted in one
  case. Check: case `R7` of the guard suite.
- **AC-S10** — Tests precede the implementation: the frozen corpus is observed
  red at the cut head before the parser changes, and the parser change is exactly
  `!explicit && positional.length === 1` → no write / `>= 2` → implicit `set`.
  Check: the `E` lines naming both runs.
- **AC-S11** — Out of scope stays out: Layer 2, the `ask`/`block` policy and the
  #514 write corpus are untouched. Check: `git diff 63c50421 --stat` names no
  `template/.agentic-workflow/hooks/`, `scripts/push-identity-check.mjs` or
  policy file.

## Tasks

- P1 — Freeze the read, heredoc and backtick reproducers as failing cases in the
  guard suite, with the cut-head write corpus left byte-identical
  (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 1 at the cut head with the new cases red)
  (Implements: S1, S2, S6, S7, S9, S10)
  - Relevant files: packages/pi-agentic-workflow/test/git-identity-guard.test.mjs
- P2 — Derive a write from 2+ positionals in `findGitConfigWrites`, keeping
  every explicit verb's classification (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0)
  (Implements: S2, S3, S4, S6)
  - Relevant files: packages/pi-agentic-workflow/src/guards/git-identity.ts
- P3 — Make the tokenizer tell the command from the data it carries (newline
  separators, heredoc bodies, backtick substitution) and state the two boundaries
  in the module header (validator: `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 and `rg -n 'heredoc body' packages/pi-agentic-workflow/src/guards/git-identity.ts` matches 1)
  (Implements: S7)
  - Relevant files: packages/pi-agentic-workflow/src/guards/git-identity.ts
- P4 — Freeze the sibling reader's one-positional cases as failing corpus rows
  (validator: `bun test scripts/git-config-writes.test.mjs` exits 1 at the cut head with the new `read` rows red)
  (Implements: S8)
  - Relevant files: scripts/git-config-writes.cases.txt, scripts/git-config-writes.test.mjs
- P5 — Apply the same positional rule to `classifyInvocation` (validator:
  `bun test scripts/git-config-writes.test.mjs` exits 0, this repository compliant)
  (Implements: S8)
  - Relevant files: scripts/git-config-writes.mjs
- P6 — Ship the declared docs with the change: the package README's guard
  sentences, the release intent, the roadmap status cell and this unit doc's
  `## Log` (validator: `bun scripts/docs-generate.mjs --check` exits 0 and
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/618-git-identity-read-parser/SPEC.md` reports `verdict PASS`)
  (Implements: S2, S7)
  - Relevant files: packages/pi-agentic-workflow/README.md, .changeset/618-git-identity-read-parser.md, docs/ROADMAP.md, docs/fix/618-git-identity-read-parser/SPEC.md
- P7 — Verification: the package gate, the root gate, the docs projection and the
  base-copy differential (validator: `node scripts/run-root-suite.mjs` exits 0 and `cd packages/pi-agentic-workflow && bun run test` exits 0)
  (Implements: S5, S11)

### Planning evidence

One row per Engineering claim the change rests on, in the ledger's closed column
order (owner: `skills/pre-execution-review/references/LEDGERS.md`). Measured at
the cut head `63c50421`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | measured-run | The reproducer fires exactly as filed at the cut head: `findGitConfigWrites("git config user.name")` → `[{"verb":"set","key":"user.name","scope":"local"}]` and `decideGitConfigCall` → `ask`; the same for `user.email`, `commit.gpgsign` and both quoted spellings | `/tmp` probe driving the cut head's `dist/guards/git-identity.js` | measured 2026-11-18 (this session) | O1, O2, O6; AC-S1, AC-S2, AC-S6 |
| PE-002 | measured-run | Git's own grammar: `git config --file <f> user.name` prints the value (exit 0; exit 1 when unset); `user.name --get` and `user.name --unset` **set the literal value** (the inverted-form trap); `user.name A B` writes `A`; `user.name ""` writes an empty value — so one positional is a read and every two-positional form is a write | `git config --file /tmp/aw618-gc*.gitconfig …` probes run against real git this session, `--get-all` after each | measured 2026-11-18 (this session) | O3, O4; S3's "two or more"; the `--get` non-goal |
| PE-003 | committed-source | The root cause is the implicit-legacy branch: `const explicit = …; const verbName = explicit ? head : "set"; const keySlot = explicit ? 0 : …` emits a write for a single positional regardless of arity | `packages/pi-agentic-workflow/src/guards/git-identity.ts:302-308` | read 2026-11-18 (this session) | O1; S2's parser shape |
| PE-004 | committed-source | The sibling reader shares the bias: `if (isKeyShaped(word)) { return writeResult(words, index, word); }` answers `write` for a key-shaped positional without counting the positionals (a bare read is `user.name`), and its own corpus carries no bare-read row — so the gate would fire on a read in a test carrier | `scripts/git-config-writes.mjs:277-278`; `scripts/git-config-writes.cases.txt` (no one-positional row) | read 2026-11-18 (this session) | O10; S8 |
| PE-005 | measured-run | The regression baseline: the guard suite is 22 cases green and the sibling suite 9 green at the cut head | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` → `22 pass, 0 fail`; `bun test scripts/git-config-writes.test.mjs` → `9 pass, 0 fail` | measured 2026-11-18 (this session) | O5, O11; AC-S5 |
| PE-006 | measured-run | `SEPARATORS` declares `"\n"` but the tokenizer's loop only splits on `;`, `\|`, `&`; a newline falls through to `word += char`, so `tokenizeCommand("a\nb")` yields one statement and `cd /repo` + a newline + a `git config` write yields no standalone `git` token | `packages/pi-agentic-workflow/src/guards/git-identity.ts:102,204-225`; `/tmp` probe printing `tokenizeCommand` output | measured 2026-11-18 (this session) | O7; S7's statement split; D3 |
| PE-007 | measured-run | A heredoc body is tokenized as command text today: the opener's delimiter token absorbs the following newline (`"<<EOF\n##"`), and a `;` inside the body splits a statement, so a body line `git config user.email t@x; git config commit.gpgsign false` derives two writes at the cut head | `/tmp` probe over the cut head's `dist/guards/git-identity.js` with a `gh issue create --body-file - <<'EOF' … EOF` command | measured 2026-11-18 (this session) | O6, O7; S7's fold |
| PE-008 | measured-run | A command substitution inside a double-quoted argument is one quoted token — `tokenizeCommand('echo "$(git config user.email t@x)"')` finds no `git` word — because `(` is literal inside a quote and backticks are not quote characters at all; the live capture's `--body "$(cat <<'EOF' …)"` shape consequently hides both the heredoc and the body from the parser's `git` detection | the same probe's `tokenizeCommand` output | measured 2026-11-18 (this session) | O6; D2; the stated boundary |
| PE-009 | committed-source | The refusal text recommends the read form it already passes (`git config --show-origin --get-all user.name` in `REPAIR`) while refusing the equally safe bare read — the inconsistency S9 pins | `packages/pi-agentic-workflow/src/guards/git-identity.ts:320-324,338-349` | read 2026-11-18 (this session) | O1; AC-S9 |
| PE-010 | committed-source | The guard's shipped prose is the package README's guard paragraph plus the module header's boundary paragraph; no skill states the positional rule | `rg -n 'identity guard\|git config' packages/pi-agentic-workflow/README.md skills/` | read 2026-11-18 (this session) | O9, O12; the README task |

### Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state, in the 9-column shape owned by
`skills/pre-execution-review/references/LEDGERS.md`. IDs `O1`–`O13`; every row is
`planned` at cut time and `verified` only against a foreground validator run.

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 · S2 · S6 · S9 · PE-001/PE-003/PE-009 · AC-S1 | A bare identity read derives no write: `findGitConfigWrites("git config user.name")` is `[]` and `decideGitConfigCall` answers `allow`, so the read never reaches the consent question | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (case `R1`) | `E` line naming `R1` and its `[]`/`allow` assertion | verified — E5 line (44 pass: `R1` derives `[]` and answers `allow` in both postures) |
| O2 | S2 · S10 · PE-001 · AC-S2 · AC-S9 | One positional passes in both postures for the identity keys, the quoted spellings, a scope flag, `--file`, `--type=` and a compound command ending in three reads — and the recommended `--show-origin --get-all` form passes in the same case | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `R2`–`R7`) | `E` line naming `R2`–`R7` and the posture each asserts | verified — E5 line (`R2`–`R7` green: identity keys, quoted spellings, scope flags, `--file`, `--type=`, the compound three-read command and the recommended diagnostic) |
| O3 | S3 · PE-002 · AC-S3 | Two or more positionals are still the implicit `set` write, an empty value included, and `git config <key> --get` / `--unset` stay writes because git sets the literal value | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `W1`–`W4`) | `E` line naming `W1`–`W4` | verified — E5 line (`W1`–`W4` green: two positionals, three positionals, an empty value and the post-key flag) |
| O4 | S4 · AC-S4 | Every explicit verb and every scope-flag write keeps its classification and its reason text | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (the cut-head write corpus, unchanged) | `E` line with the run's pass count and `0 fail` | verified — E5 line (the cut-head explicit-verb and scope write cases pass unchanged) |
| O5 | S5 · PE-005 · AC-S5 | The #514 write corpus is untouched: no assertion deleted, skipped or narrowed, and its 22 cut-head cases still pass | P2 | P2 | direct application (this session) | `git diff 63c50421 -- packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` shows additions only | `E` line with the diff's removal count (0) | verified — E9 line (`git diff 63c50421` on both test files: 0 removed assertion lines; the 22 cut-head cases green) |
| O6 | S7 · PE-007/PE-008 · AC-S7 | A heredoc body is data: the live-capture shapes (quoted, bare and `<<-` delimiters, nested in `$(…)` inside a quoted argument) derive no write, and a `<<` with no terminator stays ordinary text | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `H1`–`H4`, `H8`) | `E` line naming `H1`–`H4`/`H8` | verified — E5 line (`H1`–`H4`, `H8` green) |
| O7 | S7 · PE-006 · AC-S7 | A write the shell will actually run is still judged: on its own line inside a multi-line command, and after a heredoc terminator | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `H5`, `H6`) | `E` line naming `H5`/`H6` | verified — E5 line (`H5`, `H6` green) |
| O8 | S7 · PE-008 · AC-S7 | Backtick command substitution is parsed as a command where the tokenizer sees it (outside a quoted string), so a write inside one asks; inside a quoted string it stays data, as the header states | P3 | P3 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `B1`–`B2`) | `E` line naming `B1`/`B2` | verified — E5 line (`B1`, `B2` green) |
| O9 | S7 · S10 · PE-010 · AC-S7 | The module header states the heredoc and backtick boundaries, closing the gap S7 names (the boundary list named only script, `!` command and indirection) | P3 | P3 | direct application (this session) | `rg -n 'heredoc piped into an interpreter' packages/pi-agentic-workflow/src/guards/git-identity.ts` matches 1 and `rg -n 'backtick span is' packages/pi-agentic-workflow/src/guards/git-identity.ts` matches 2 | `E` line with both commands and their match counts | verified — E11 line (1 match and 2 matches) |
| O10 | S8 · PE-004 · AC-S8 | The sibling reader answers `read` for one positional and keeps every write row: the corpus carries both, and this repository stays compliant | P5 | P5 | direct application (this session) | `bun test scripts/git-config-writes.test.mjs` exits 0 | `E` line with the pass count and the compliance case | verified — E7 line (10 pass, 0 fail; the repository-compliance case green) |
| O11 | S2 · S7 · AC-S2/AC-S7 | The shipped `tool_call` wiring follows the module: a headless bare read passes untouched, a headless heredoc-body prose call passes, and a headless write still blocks naming the repair | P2 | P2 | direct application (this session) | `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` exits 0 (cases `R9`, `H7`, the cut-head write wiring case) | `E` line naming `R9`/`H7` | verified — E5 line (`R9` and `H7` green beside the cut-head write wiring case) |
| O12 | S2 · S7 · PE-010 | The package README's guard description states the read rule and the heredoc boundary, so the shipped prose matches the behaviour | P6 | P6 | direct application (this session) | `rg -n 'one positional' packages/pi-agentic-workflow/README.md` matches 1 and `rg -n 'heredoc body is data' packages/pi-agentic-workflow/README.md` matches 1 | `E` line with both commands and their matches | verified — E12 line (1 match and 1 match) |
| O13 | S5 · S11 · AC-S11 | The whole gate passes with the change in place, the projection is a fixed point, and the out-of-scope surfaces are untouched | P7 | P7 | direct application (this session) | `node scripts/run-root-suite.mjs` exits 0 and `cd packages/pi-agentic-workflow && bun run test` exits 0 | `E` lines with both verdicts and the diff stat | verified — E8/E9/E10 lines (package 987 pass, root gate exit 0, projection PASS) |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-18, the issue, verbatim:
  ````
  ## Type

  - [x] Fix
  - [ ] Feature
  - [ ] Chore / docs / infra (no behaviour change)

  ## What's broken

  The agent-side git identity guard (Layer 1, `packages/pi-agentic-workflow/src/guards/git-identity.ts`, issue #514) classifies a **bare read** — `git config` with a single positional key and no value — as an **implicit `set` write**. In real git, one positional prints the value (a read, exit 1 when unset); the implicit-set legacy form requires two positionals (`git config user.name "Name"`). Every agent that checks the identity the natural way therefore triggers the guard, and in headless contexts (`ask` degrades to `block`) the whole bash tool call fails. The blast radius is every session of every consumer, model-independent: it is a parser defect, not a model behaviour. The guard's own failure history (three identity leaks in nine days, #514) makes write detection critical — the fix must tighten the parser's *precision* without touching its write coverage.

  ## Detected in

  Session `01a1ea29-9619-7202-8356-0ba9357512b3` (worktree `feat/554-new-feature-move-the-template-hook-scripts-into`, 2026-11-17): the agent ran a compound command ending in three reads (`git config user.name`, `git config user.email`, `git config commit.gpgsign`) and the guard blocked the entire command with *"Not approved: rewrites the identity or signing configuration…"*. The owner reports repeated firings across sessions after the Serena system-prompt removal fix, which had already eliminated one trigger source; this is the remaining structural one.

  ## Reproduction steps

  Reproduced against the module directly (2026-11-17):

  - `findGitConfigWrites("git config user.name")` returns `[{ verb: "set", key: "user.name", scope: "local" }]` — git treats this as a read.
  - `decideGitConfigCall` on the same string returns `action: "ask"` (headless: `block`).
  - The read forms that pass today are only the flagged ones: `git config --show-origin --get-all user.name` correctly derives no write.

  1. In any session (headless amplifies: `ask` becomes `block`), run a bare identity read, or a compound command containing one.
  2. Observe the guard refuse the whole call as a write.

  **Live capture while filing this very issue (2026-11-17):** the first `gh issue create` attempt was blocked by this same guard. The body text — carried in the same compound bash command via a heredoc — quotes the reproduction command as markdown prose. The tokenizer's statement split treats the `;` inside backtick code spans as shell separators and does not recognize heredoc bodies as non-executed text, so prose mentioning the commands was parsed as three writes and the whole `gh issue create` was refused. Same read-vs-write root cause, plus a boundary observation for triage to fold here or split: what counts as "the command a model asked bash to run" needs a stated answer for heredoc bodies and backtick code spans (the module doc's own boundary list — script, `!` command, indirection — does not name either).

  ## Expected behaviour

  - `git config <key>` with **exactly one positional** is a read and passes — equal footing with the `--show-origin --get-all` form the refusal text itself recommends as the diagnostic (today a bare read is refused while the recommended form passes, an inconsistency inside one message).
  - `git config <key> <value>` (two or more positionals) stays the implicit `set` write it is today.
  - Explicit verbs (`set`, `--add`, `--replace-all`, the destructive set) and every scope flag keep their current classification unchanged.
  - No assertion is weakened or skipped; the write-detection corpus from #514's suite must pass unchanged — the defect is precision on reads, never recall on writes.

  ## Evidence (verified, 2026-11-17)

  - **Root cause location**: `findGitConfigWrites`, the implicit-legacy branch — `const explicit = DESTRUCTIVE_VERBS.has(head) || WRITE_VERBS.has(head); const verbName = explicit ? head : "set"; const keySlot = explicit ? 1 : 0;` — a single positional lands in key slot 0 and is emitted as `verb: "set"` regardless of positional count.
  - **The mode amplification**: `questionFor` → `decideGitConfigCall` returns `ask` (interactive) or `block` (headless, no `ctx.hasUI`), so each false positive is a failed tool call in spawned/unattended sessions, not a question.
  - **Sibling surface to audit in the same change**: `scripts/git-config-writes.mjs` — the guard's header declares it "a second reader of the same shell shape … not a copy", but the positional-classification bias may be shared; verify it (and its suite) rather than assume.
  - **Irony that pins the expected behaviour**: `reasonFor`'s own `REPAIR` list recommends `git config --show-origin --get-all user.name` *because* it is safe — while the equally safe bare read is refused.

  ## Proposed fix direction (triage decides the final shape)

  Tests first, red on the current tree: a corpus of bare reads (identity keys, quoted variants, compound commands) asserting no write is derived, alongside the existing write corpus staying green (two-positional implicit set, `--add`, `--unset`, `--global`, `--file`, `-c`). Then the parser: `!explicit && positional.length === 1` → not a write; `positional.length >= 2` → implicit `set`, exactly as today. The heredoc/backtick boundary observation is triaged separately — fold here only if the fix is the same parser change.

  ## Out of scope

  - **Layer 2** (pre-commit hook, push-range identity check) — commit-time evaluation reads resolved identities, not command lines; unaffected.
  - **The `ask`/`block` mode policy itself** — a separate decision; this issue only stops reads from reaching it.
  - **Re-litigating #514's write coverage** — unchanged and untouched.
  ````
- **D1** — 2026-11-18, the cut: this change is applied inline through the owner's
  local workflow, so this document is the frozen plan (SPEC + embedded
  `### Planning evidence` / `### Obligations`, `small` scope) and no lane
  machinery runs on the repository's own surgery.
- **D2** — 2026-11-18, S2's positional rule outranks S4's "every scope flag keeps
  its current classification" for the *read* case: `git config --global user.name`
  prints the value in git (`PE-002`), so a scope-flagged invocation with exactly
  one positional passes. What S4 preserves is the classification of every
  scope-flag *write* — the scope it records and the escalation that makes it ask.
  Recorded rather than silently resolved, because the two requirements read
  against each other on that one form.
- **D3** — 2026-11-18, S7 folds here (S10's condition met: the same parser). The
  positional rule is one branch of `findGitConfigWrites`; the heredoc and backtick
  failures are the statement split inside `tokenizeCommand`, the function that
  produces the very statements `findGitConfigWrites` classifies — one parser, one
  defect family (text that is not the command read as the command). The fold adds
  three rules the header states: a newline separates statements, a heredoc body is
  data, a backtick span is a command. `PE-006`–`PE-008` measure each at the cut
  head.
- **D4** — 2026-11-18, the heredoc rule's own guard: a `<<` is only a heredoc when
  a later line is exactly its delimiter. With no terminator bash itself fails the
  command (`unexpected EOF`), so reading that text as ordinary words loses no
  execution — and it keeps `echo "a << b"` from swallowing the rest of a command.
- **D5** — 2026-11-18, the boundary this unit states and does not cross: a heredoc
  piped into an interpreter (`bash <<'EOF' … EOF`), a command substitution inside
  a double-quoted string, and an invocation built by variable indirection are
  command text the guard does not see; Layer 2 covers the identity consequences.
  The module header names all four.
- **E1** — 2026-11-18, the cut-head baselines:
  `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs` · exit 0
  · `22 pass, 0 fail`; `bun test scripts/git-config-writes.test.mjs` · exit 0 ·
  `9 pass, 0 fail`.
- **E2** — 2026-11-18, the frozen-failure corpus observed red at the cut head:
  a `/tmp` probe over `dist/guards/git-identity.js` printed
  `findGitConfigWrites("git config user.name")` → `[{verb:"set",key:"user.name",scope:"local"}]`,
  `decideGitConfigCall` → `ask` (headless `block`) for `user.name`, `user.email`,
  `commit.gpgsign`, the quoted spellings and the compound three-read command.
  Scratch removed after the run.
- **P1** — 2026-11-18, the 21 read, heredoc, newline and backtick cases frozen as
  failing tests (`R1`–`R7`, `W1`–`W4`, `H1`–`H8`, `B1`, `B2`, `R9`, `H7`) with the
  cut-head write corpus untouched · `c7775671`.
- **E3** — 2026-11-18, `bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs`
  at `c7775671` · exit 1 · `44 tests: 29 pass, 15 fail` — the read cases and the
  heredoc/newline/backtick cases red, the write cases green.
- **P2** — 2026-11-18, `findGitConfigWrites` derives a write from 2+ positionals
  and reads options only where git reads them (past the key a flag-shaped word is
  the value) · `b5a40345`.
- **E4** — 2026-11-18, the same suite at `b5a40345` · exit 1 · `44 tests: 37 pass,
  7 fail` — every `R`/`W` case green; the S7 corpus still red, pending P3.
- **P3** — 2026-11-18, `tokenizeCommand` learns the statement boundary (newline),
  the heredoc body (data, skipped whole) and the backtick span (its own command),
  and the module header states both boundaries · `e8c9d0ae`.
- **E5** — 2026-11-18, the same suite at `e8c9d0ae` · exit 0 · `44 pass, 0 fail`
  (22 cut-head cases unchanged + 22 new).
- **P4** — 2026-11-18, the sibling gate's corpus frozen red: 10 `read` rows for
  the one-positional forms and 2 `write` rows pinning that a post-key flag is the
  value git writes · `d4e50afb`.
- **E6** — 2026-11-18, `bun test scripts/git-config-writes.test.mjs` at `d4e50afb`
  · exit 1 · `10 tests: 8 pass, 2 fail` (the corpus case and the new arity case
  red, every pre-existing case green).
- **P5** — 2026-11-18, `classifyInvocation` answers `read` for one positional, and
  `scanSource` bounds an invocation by its own bracket scope so an argv array's
  trailing call arguments are never read as values · `fc24404d`.
- **E7** — 2026-11-18, `bun test scripts/git-config-writes.test.mjs` at `fc24404d`
  · exit 0 · `10 pass, 0 fail`, the repository-compliance case included.
- **P6** — 2026-11-18, the package README's guard table and paragraph, this doc
  and the release intent (`patch`) · this commit.
- **E8** — 2026-11-18, `cd packages/pi-agentic-workflow && bun run test` · exit 0 ·
  `987 pass, 0 fail` across 85 files (bundle, `tsc`, every suite).
- **E9** — 2026-11-18, the write-corpus invariant and the whole root gate ·
  `git diff 63c50421 -- packages/pi-agentic-workflow/test/git-identity-guard.test.mjs scripts/git-config-writes.test.mjs scripts/git-config-writes.cases.txt`
  → **0** removed lines; `node scripts/run-root-suite.mjs` → exit 0 (every suite
  PASS). Disclosed: the **first** root-gate run carried one red on the untouched
  `scripts/unit-route.test.mjs` `#291 F7` timing assertion (`803ms` against its
  `500ms` ceiling) while the box was under load; standalone it is `1 pass, 0 fail`
  twice, and the following full run is green. Not this change's path.
- **E10** — 2026-11-18, `bun scripts/docs-generate.mjs --check` · exit 0 · `3
  files checked · 0 stale · 0 orphaned`, roadmap unchanged, `verdict: PASS`.
- **E11** — 2026-11-18, `rg -n 'heredoc piped into an interpreter'
  packages/pi-agentic-workflow/src/guards/git-identity.ts` → 1 match;
  `rg -n 'backtick span is' packages/pi-agentic-workflow/src/guards/git-identity.ts`
  → 2 matches (the header paragraph and the tokenizer's own comment).
- **E12** — 2026-11-18, `rg -n 'one positional' packages/pi-agentic-workflow/README.md`
  → 1 match (the guard table row); `rg -n 'heredoc body is data' packages/pi-agentic-workflow/README.md`
  → 1 match (the new paragraph).
- **E13** — 2026-11-18, the differential (§6): a 61-command corpus judged on the
  cut head's `git show 63c50421:…/git-identity.ts` (compiled in `/tmp`, resolving
  the package's own `node_modules` through a symlink) and on the change, three
  readings each (ask, block, derived writes) · **40 identical · 21 differing**:
  18 are the asked-for precision (13 bare/scope/`--file`/`--type=` reads, the
  compound three-read command, three heredoc bodies, and the one row whose only
  delta is the removed write record), 3 are S7's recall fold (`cd …` + a write on
  the next line, a write after a heredoc terminator, a write inside a backtick
  span — all previously unseen). No unasked difference. Scratch removed after the
  run. Disclosed: the *published* guard blocked this very session's first attempt
  to run the differential, in a heredoc body — the defect, live.
- **E14** — 2026-11-18, the sibling gate's differential: a `/tmp` fixture tree
  (two carrier suites under a scratch `scripts/` and a scratch
  `packages/demo/test/`) scanned by the cut head's script and by the change ·
  `7 findings → 4`, the three dropped rows being the one-positional reads and
  every write still found; the repository's own tree is byte-identical both ways
  (`343 carriers scanned, 0 findings`, `verdict: PASS`). Scratch removed after
  the run.
- **P7** — 2026-11-18, verification (E5, E7–E14).
- **E15** — 2026-11-18, the root gate's receipt and the load-sensitive reds it
  needed two attempts to escape: `node scripts/run-root-suite.mjs --jobs 2` →
  exit 0, **122/122 PASS**. The default 4-worker run on this box failed twice,
  each time on the same two untouched suites and on nothing else —
  `scripts/phase-lint.test.mjs` hit the 120s per-suite wall (standalone:
  `node --test scripts/phase-lint.test.mjs` → `162 pass, 0 fail`, 66s) and
  `scripts/unit-route.test.mjs`'s `#291 F7` timing assertion measured 568–803ms
  against its 500ms ceiling (standalone `1 pass, 0 fail`, twice). Load average
  6.4–8.1 on 6 CPUs during the runs; neither suite reads a file this change
  touches. The serialized receipt is the green one.

## Next

The implementation slices P1–P7, then the owner's external verify.

## References

Issue [#618](https://github.com/gtrabanco/agentic-workflow/issues/618); roadmap
row `git-identity-read-parser`. The #514 unit
(`docs/fix/…`/PR [#520](https://github.com/gtrabanco/agentic-workflow/pull/520))
owns the guard this unit repairs, and its suite is the write corpus S5 protects.

## Branch

`fix/618-git-identity-bare-identity`

## Depends on

none

## Regression scope

| Scenario | Verifier |
|---|---|
| A two-positional identity write still asks, and still blocks headless | `git-identity-guard.test.mjs` cut-head cases + `W1`–`W4` |
| Every explicit verb (`set`, `--add`, `--replace-all`, `--unset*`, `remove-section`, `rename-section`, `edit`) still asks | `git-identity-guard.test.mjs` cut-head case (unchanged) |
| Scope escalation (`--global`, `--system`, `--worktree`) and a non-scratch `--file` write still ask; a scratch `--file` write still passes | `git-identity-guard.test.mjs` cut-head case (unchanged) |
| The allow list, the consent lifecycle and the shipped wiring keep their behaviour | `git-identity-guard.test.mjs` cut-head cases (unchanged) + `R9`/`H7` |
| The `-c`-only gate still fails a test carrier that writes config, and this repository stays compliant | `scripts/git-config-writes.test.mjs` cut-head cases + the new corpus rows |
| The root gate, the package gate and the docs projection stay green | `node scripts/run-root-suite.mjs`, `bun run test`, `bun scripts/docs-generate.mjs --check` |
