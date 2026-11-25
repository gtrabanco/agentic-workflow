---
type: fix
scope: medium
ac-hash: e994bd3d0875a0d0bb350fa933069e7d89e79aa932118479f7d6a320d1c57833
roadmap_summary: Issue [#706](https://github.com/gtrabanco/agentic-workflow/issues/706) (M): five instruction-chain gaps let sessions hand-append to the journal — the LOGS.md header, the log-session description, the local aggregate door, and the fixture-identity leak path now agree on one writer.
---

# fix/706-log-write-path-fix

> One-line: make every instruction a session can read agree that the fragment
> carrier's writer and the CI aggregator own `docs/LOGS.md` — and close the
> local doors that let a session publish a journal change by hand.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
external-verify.md | trimmable
review-findings.md | trimmable
```

## Issue

`#706` — tracked issue in the project's forge. The PR closes it via
`Closes #706`. Roadmap row `706 | log-write-path-fix`. The unit lives under
`docs/fix/` because it is applied through the owner's local fix-lane workflow
(`## Log` L2), the same home units 436/667/701/703 took.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. `S1` is the operator's order; `S2`–`S10` quote the
issue's own words, which that order adopts as the work.

**S1 — the order: apply #706 to this repository, inline.**
> Apply to this repository: issue #706

**S2 — verify every evidence claim before planning; report what fails.**
> **Verify every evidence claim below first.** Each has a reproduction command (read-only). The forensic sources are git, `scripts/log-immutability.mjs`, and the pi transcripts — note that many transcripts live **only** in `~/.pi-web/archived-sessions/` (347 files); many directories under `~/.pi/agent/sessions/` are empty (12+ sampled). Report any claim that does not reproduce back on this issue before planning; do not drop it silently.

**S3 — review the candidates; where the repository docs are silent, ask, never invent.**
> **Review the candidate solutions; do not adopt them as given.** They are one diagnosis's proposals. Where the repository documentation already answers a question, cite that answer; where it does not, the decision is the owner's.
>
> **Never invent behaviour the repository does not document** (AGENTS.md → Inviolable rules `IR10` — a fact the tree, the docs and a prior owner decision do not evidence is asked, never guessed). Two decisions here are explicitly **not** answered by repo docs today and must be asked, not invented: (a) whether a *local* `journal aggregate` run that commits with the `journal-bot` committer is sanctioned at all (the gate judges identity only; the workflow docs only describe the merge-to-main job); (b) what wording replaces the owner's local workflow prompt §7 (that prompt lives outside this repository — see P1).

**S4 — P1: the owner's §7 stops offering a manual append.**
> **P1 — the owner's local workflow prompt §7 says "(auto log-session flow *or manual append*)"**. […] This instruction ranks above AGENTS.md and the skill body, and it contradicts the gate.
>
> Candidate: owner edits §7 to the fragment-only wording (no manual-append clause); the issue records it so the fix SPEC can evidence the owner decision.

Owner decision (D3, 2026-11-24): the replacement wording is
> docs/LOGS.md: the session entry is written through `journal write` as a fragment when `.agentic-workflow/journal/` exists; never hand-append it.

The owner applies it to the local prompt, which lives outside this repository;
this unit records the decision and quotes it here.

**S5 — P2: the log-session description and line 9 state both doors.**
> **P2 — `skills/log-session/SKILL.md` frontmatter description (and line 9) say "Append a structured entry to the project's session log (`docs/LOGS.md`)" without the carrier condition.** […] The body (`:119-122`, `:144-151`) is correct, so description and body disagree, and agents acting on the listing append.
>
> Candidate: reword the description/line 9 to state both doors ("appends … or, with the fragment carrier, writes a fragment — never `docs/LOGS.md`"), keeping body and `docs/workflow/SKILLS.md` in sync.

**S6 — P3: the LOGS.md header leads with the fragment rule.**
> **P3 — `docs/LOGS.md` header, paragraph 1 says "`/log-session` appends the narrative one"; the fragment rule only appears in paragraph 2.** […] a reader that stops at paragraph 1 gets the forbidden instruction, well above the gate's own contract.
>
> Candidate: lead with the fragment rule (or make paragraph 1 conditional), paragraph 2 keeps the no-carrier case.

The header edit is a rewrite of published bytes, which `log-immutability`
refuses by design (PE-002). Owner decision (D1, 2026-11-24): land it under an
explicit one-time owner exception; the gate stays untouched and its
`log-rewritten` verdict over this branch is the authorized exception.

**S7 — P4: a local `journal aggregate` run is refused; a local journal push is refused.**
> **P4 — `journal aggregate` runs locally without filter, without refusal, and each session improvises a different consequence.** […] Whether a local run at all — with any identity — is sanctioned is **not documented** → ask the owner (obligation 3).
>
> Candidate: either the CLI refuses a local run unless an explicit owner-decided flag is passed, or the docs prescribe one exact local recipe (identity + no-filter handling); both need an owner decision first.

Owner decision (D2, 2026-11-24): the **product** CLI refuses every non-CI run,
with no local exception; and this **project** adds a local-push guard that
refuses any push changing `docs/LOGS.md` unless it comes from the GitHub Action
and its PR. The product guard is generic (`CI`); the project guard is this
repository's only.

**S8 — P5: the fixture-identity leak path is identified and closed.**
> **P5 — a fixture identity `t <t@example.test>` is present in published history on `docs/LOGS.md` commits, and it recurred after a prior repair.** […] The leak *path* (how a session shell acquires the test identity) is not answered anywhere → ask/investigate, do not assume.
>
> Candidate: find and close the env/config leak (a session running the hook tests inherits the identity), and record an owner decision for how already-published fixture-identity commits are treated (leave + record vs. documented exception).

The tree answers the path: identity-less fixture spawns / failed fixture
resolution writing shared config (#529 decisions; `git-config-writes.mjs`
header), and the `-c`-only gate plus `push-identity-check` close it. This unit
records the evidence and the current published state; it never rewrites
published history.

**S9 — the verification contract the fix must leave green.**
> - `docs/LOGS.md` is only ever extended by the closed aggregator identity (the contract `scripts/log-immutability.mjs` already enforces) — no session, at push time or earlier, needs to hand-append.
> - Every instruction a session can read agrees on one rule: with `.agentic-workflow/journal/` present the entry is written by `journal write` as a fragment; the aggregator is the only writer of `docs/LOGS.md`. That means the owner's local workflow §7, the `log-session` skill description, and the `docs/LOGS.md` header all say the same thing (the skill body already does).
> - A local `journal aggregate` run is either refused or governed by one documented, owner-decided recipe — never an improvised per-session variant (identity adoption, foreign-fragment pulls, parked backup branches).
> - No commit authored in this repository's sessions carries a test/fixture identity; the leak path of `t <t@example.test>` is closed and the recurrence recorded.

**S10 — rollback: revert the commits, never rewrite history.**
> All changes are documentation wording, one CLI guard and test-side identity hygiene; revert the PR (or revert the single commit per problem — they are independent). The gate itself is untouched, so rolling back restores the previous state exactly; no data migration. The already-published history (fixture-identity commits, old hand-appends) is never rewritten by this work — #539 keeps it out of judgement by design.

## Acceptance criteria

1. **S2** — every issue evidence claim is re-verified and every non-reproducing claim is recorded with its observed value. Check: the `## Evidence` table in `## Log` names each repro and the `## Known pre-existing issues` section carries the drift; `rg -n 'does not reproduce|drifted' docs/fix/706-log-write-path-fix/SPEC.md` matches.
2. **S3** — each of the five candidates is recorded as adopted or rejected with its reason, and the three owner decisions the issue reserves are quoted. Check: `rg -n 'D1|D2|D3' docs/fix/706-log-write-path-fix/decisions.md` names them; `rg -n 'adopted|rejected' docs/fix/706-log-write-path-fix/decisions.md` covers P1–P5.
3. **S4** — the SPEC quotes the fragment-only §7 wording and records it as owner-side. Check: `rg -n 'never hand-append it' docs/fix/706-log-write-path-fix/SPEC.md` matches; no repository edit claims to have changed the local prompt.
4. **S5** — `skills/log-session/SKILL.md`'s frontmatter description states both doors, the body still owns the rule, and `docs/workflow/SKILLS.md` stays in sync. Check: `rg -n '\.agentic-workflow/journal/' skills/log-session/SKILL.md` matches inside the frontmatter; `bun scripts/skill-lint.mjs` exits 0; `bun scripts/check-skill-context.mjs` exits 0.
5. **S6** — the `docs/LOGS.md` header leads with the fragment rule and keeps the no-carrier append rule after it. Check: `sed -n '1,20p' docs/LOGS.md | rg -n 'Fragment rule|Append-only rule'` lists the fragment rule first; the owner exception is recorded in `decisions.md` and the `## Log`.
6. **S7** — the product `journal aggregate` refuses a non-CI run before moving a byte and still aggregates in CI; the project `log-immutability` refuses a local bot-identity push that changes `docs/LOGS.md` and allows the GitHub Action's push. Check: `bun test packages/agentic-workflow/test/journal.test.mjs` exits 0; `bun test scripts/log-immutability.test.mjs` exits 0.
7. **S8** — the fixture-identity leak path is identified with its source, the current unpublished range carries none, and the repository-wide checks pass. Check: `bun scripts/git-config-writes.mjs` exits 0; `bun test scripts/push-identity-check.test.mjs` exits 0; `git log origin/main..HEAD --format='%ae|%ce' | rg 't@example\.test'` matches nothing.
8. **S9** — every instruction surface agrees and the append-only grammar is untouched. Check: the three wording surfaces (`docs/LOGS.md`, `skills/log-session/SKILL.md`, `docs/workflow/SKILLS.md`) all name the fragment door; `bun scripts/docs-generate.mjs --check` exits 0.
9. **S10** — the change is revertible per problem and rewrites no published history. Check: `git log --oneline main..HEAD` lists the independent commits; `git log --all --format='%ae' | rg 't@example\.test'` still finds only the historical refs/tags, and none of this branch's commits carries it.

## Impact

- **The product CLI** — `journal aggregate` gains a CI-only precondition in
  `packages/agentic-workflow/bin/agentic-workflow.mjs` and a documented
  `CI=true` requirement for the documented `post-receive` hook. The GitHub
  workflow already sets `CI`, so it needs no edit.
- **The product docs** — `packages/agentic-workflow/README.md` and
  `template/.agentic-workflow/journal.md` must stop claiming the local and CI
  runs are identical without the CI context.
- **The project gate** — `scripts/log-immutability.mjs` gains the
  `log-local-push` rule and its suite; the pre-push hook and `local-gate` read
  it automatically.
- **The skill listing** — the `log-session` frontmatter description is a
  context-budgeted surface; a growth re-pins `SKILL_CONTEXT_BUDGETS.json`.
- **The journal** — the header rewrite is a one-time owner exception; the gate
  itself is not changed, so every later push is still byte-prefix strict.

## Surfaces

- `skills/log-session`
- `docs`
- `packages/agentic-workflow`
- `scripts`
- `template`

## Retirements

Strictly additive: no surface is renamed or deleted. The only prose the unit
supersedes is the `docs/LOGS.md` header order and the `log-session` description,
both updated in place. The product's `journal aggregate` contract is not
retired; it gains a precondition.

## Non-goals

- No history rewrite: the fixture-identity commits already in tags/old refs are
  recorded, never rewritten (`S10`).
- No gate weakening: `log-immutability` keeps its byte-prefix check; the P3
  header lands under the owner exception, not a new allowance.
- No local aggregate exception: the product refuses every non-CI run (`D2`).
- No forge-specific product rule: the product guard uses `CI`, not
  `GITHUB_ACTIONS`; only this repository's project guard names the GitHub Action.
- No second writer and no second grammar: the fragment writer and aggregator
  remain the owners.

## Risk tier

- **Tier** — `standard` · **Task Size** — `{understood: true, contained_risk: "named", resumable_from_diff: true}`
- **Named high-risk item** — none — not a high-tier unit. The planned paths touch
  the crate CLI and the project gate, both covered by their sibling suites; the
  classifier re-derives the final tier at P8.

## Future

- A generic post-receive/CI recipe for non-GitHub forges that sets `CI=true` is
  documented in `template/.agentic-workflow/journal.md` by this unit; a second
  forge's wiring is a new unit.

## Future cost

- The project local-push guard requires any future journal change to arrive
  through the GitHub Action and its PR; a local `journal-aggregate-*` branch is
  refused by `log-local-push`.
- The product CI-only guard requires the documented post-receive hook to keep
  `CI=true`; a future wiring that forgets it fails closed with a named refusal.

## Applicable tests

- `bun test packages/agentic-workflow/test/journal.test.mjs`
- `bun test scripts/log-immutability.test.mjs`
- `bun test scripts/push-identity-check.test.mjs`
- `bun test scripts/git-config-writes.test.mjs`
- `bun test scripts/skill-lint.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `bun scripts/lint-changeset.mjs`
- `bun scripts/docs-generate.mjs --check`
- `bun scripts/local-gate.mjs --no-bail`

## Known pre-existing issues

- **Issue step 3 does not reproduce as written** — the pair
  `t <t@example.test>` is not only in
  `template/.agentic-workflow/hooks/tests/test-git-identity-check.sh`: 23 files
  carry it, including ten package suites that pass it with `-c` per invocation.
  `does-not-affect`: the `-c` forms are the sanctioned convention; the gate and
  the `push-identity-check` suite pin the unsafe form.
- **The issue's published-history claim has moved** — `origin/main` now carries
  0 commits with `t@example.test` (the owner's earlier force-push repair removed
  them); the tags (`v5.0.0-canary.20261112.1`, …) still reach them.
  `does-not-affect`: this unit records the state and rewrites nothing.
- **P3 cannot coexist with `log-immutability`'s PASS verdict** — the byte-prefix
  check refuses any header edit (proven at byte 19). The owner chose the
  one-time exception (D1); the gate remains strict and the authorized
  `log-rewritten` is reported in `## Log`, not hidden.
- **The owner's §7 lives outside this repository** — the SPEC quotes the
  replacement; applying it is the owner's action (`S4`).

## Tasks

- P1 — Cut this unit doc and its planning ledgers — the decision record, the
  known issues, the planning evidence and the obligations ledger — and register
  the roadmap row through the writer (validator: `bun
  packages/agentic-workflow/bin/agentic-workflow.mjs scaffold-contract authoring
  docs/fix/706-log-write-path-fix` exits 0 with `verdict: SCAFFOLD OK`)
  (Implements: S1, S2, S3, S4, S9)

- P2 — Make the product `journal aggregate` refuse every non-CI run before the
  first byte moves, and document the `CI=true` requirement for the documented
  post-receive hook (validator: `bun test
  packages/agentic-workflow/test/journal.test.mjs` exits 0)
  (Implements: S7, S9)
  - Relevant files: packages/agentic-workflow/src/journal/aggregate.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/test/journal.test.mjs, packages/agentic-workflow/README.md, template/.agentic-workflow/journal.md

- P3 — Add the project-only `log-local-push` rule: a local push that changes
  `docs/LOGS.md` is refused even under the bot identity; the GitHub Action's
  push is allowed (validator: `bun test scripts/log-immutability.test.mjs` exits
  0)
  (Implements: S7, S9)
  - Relevant files: scripts/log-immutability.mjs, scripts/log-immutability.test.mjs

- P4 — State both doors in the `log-session` frontmatter description and keep
  the body and `docs/workflow/SKILLS.md` in sync (validator: `bun
  scripts/skill-lint.mjs` exits 0 and `bun scripts/check-skill-context.mjs`
  exits 0)
  (Implements: S5, S9)
  - Relevant files: skills/log-session/SKILL.md, docs/workflow/SKILLS.md

- P5 — Lead the `docs/LOGS.md` header with the fragment rule and record the
  owner exception (validator: `sed -n '1,20p' docs/LOGS.md | rg -n 'Fragment rule|Append-only rule'` matches 2 with `Fragment rule` first)
  (Implements: S6, S9)
  - Relevant files: docs/LOGS.md, docs/fix/706-log-write-path-fix/decisions.md, docs/fix/706-log-write-path-fix/SPEC.md

- P6 — Record the fixture-identity leak path and its closure with the
  repository-wide checks (validator: `bun scripts/git-config-writes.mjs` exits 0
  and `bun test scripts/push-identity-check.test.mjs` exits 0)
  (Implements: S8, S10)
  - Relevant files: docs/fix/706-log-write-path-fix/SPEC.md, docs/fix/706-log-write-path-fix/known-issues.md

- P7 — Ship the state through the owners: roadmap row, changeset, docs
  projection, and the session fragment (validator: `bun
  scripts/docs-generate.mjs --check` exits 0 and `bun scripts/lint-changeset.mjs`
  exits 0)
  (Implements: S1, S9)
  - Relevant files: docs/ROADMAP.md, .changeset/706-log-write-path-fix.md, docs/generated, .agentic-workflow/journal

- P8 — Run the declared verification commands in the foreground and report
  every result, including the authorized `log-rewritten` (validator: `bun scripts/local-gate.mjs --no-bail` exits 0 with every step green — the range step resolves its base to the pushed branch tip once the branch is published (#539), so a plain run carries no range violation — AND `bun scripts/log-immutability.mjs --base "$(git merge-base origin/main HEAD)"` exits 1 with exactly `log-rewritten` and `log-hand-appended` on `39cecced4`, the owner exception (D1))
  (Implements: S9, S10)
  - Relevant files: docs/fix/706-log-write-path-fix/SPEC.md

### Planning evidence

The ledger lives in `planning-evidence.md` (§1 shape owned by
`skills/pre-execution-review/references/LEDGERS.md`), because this is an M unit.

### Obligations

The ledger lives in `planning-obligations.md` (§2 shape owned by the same
reference), because this is an M unit. Every row is `planned` at cut and flips
to `verified` only on its foreground validator (or an evidenced `n/a`).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-24, operator's order, verbatim:
  ```
  Apply to this repository: issue #706
  ```
- **L2** — 2026-11-24, the issue, verbatim in `## Specs` (`S2`–`S10`), with the
  candidate solutions reviewed rather than adopted.
- **L3** — 2026-11-24, the three owner decisions before code: P3 one-time owner
  exception (D1), P4 product CI-only + project local-push guard (D2), P1
  fragment-only wording (D3). The questions were asked under `IR10`; no
  behaviour was invented.
- **L4** — 2026-11-24, evidence verification at `2780f79a7`: step 1 reproduced
  (`aggregator:24 non-aggregator:176`); step 2 reproduced in `--all` but
  `origin/main` now carries 0 fixture identities after the owner's earlier
  rewrite; step 3 does not reproduce (23 files, not one); step 4 `PASS`; step 5
  drifted (34 sessions / 14 appending / 198 archived vs 36 / 12); steps 6–7
  reproduced; step 8 reproduced (`2026-11-16 11:53:42`).
- **D1** — 2026-11-24, P3: the header reorder lands under the owner's explicit
  one-time exception; `scripts/log-immutability.mjs` is not changed and its
  `log-rewritten` verdict over this branch is authorized, not repaired.
- **D2** — 2026-11-24, P4: the product `journal aggregate` refuses every
  non-CI run (`CI`), with no local flag; this repository adds a project-only
  `log-local-push` guard for `docs/LOGS.md` that only the GitHub Action's push
  may pass.
- **D3** — 2026-11-24, P1: the replacement §7 wording is the fragment-only
  sentence quoted in `S4`; the owner applies it outside this repository.
- **P1** — 2026-11-24, ledgers frozen: this SPEC, `decisions.md`,
  `known-issues.md`, `planning-evidence.md`, `planning-obligations.md`.
- **E1** — baseline at the cut head `2780f79a7`: `bun scripts/log-immutability.mjs`
  · exit 0 · `0 violations · base ed260303a · range 2 commits · verdict: PASS`;
  `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s)`; `bun
  scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 33 skills`.
- **E2** — the P3 contradiction, measured: `logShapeViolations(HEAD's
  docs/LOGS.md, the same bytes with only the first header paragraph reworded)`
  · `[{ code: "log-rewritten", detail: "… first difference at byte 19" }]`.
- **E3** — the P3 header landed under the owner exception (D1):
  `bun scripts/log-immutability.mjs` · exit 1 · `log-rewritten — docs/LOGS.md:
  not a byte-prefix extension of the baseline — first difference at byte 19`
  plus `log-hand-appended — docs/LOGS.md: touched by non-aggregator commit
  39cecced4 "docs(logs): lead the header with the fragment rule"` · the final
  run reads `2 violations · base 2780f79a7 · range 14 commits · verdict: FAIL`.
  Both are the same authorized header commit (`39cecced4`), not defects: the
  gate is untouched and every later push is still byte-prefix strict.
- **P2** — 2026-11-24, the product guard and its tests: `a2a62a77b` (the CI-only
  refusal, the `post-receive` `CI=true` recipe and the README) and `5d31a8f23`
  (the aggregator comment kept host-neutral for `journal.surfaces` AC9).
- **P3** — 2026-11-24, the project guard and its tests: `945b86a29`
  (`log-local-push` for a local push that changes `docs/LOGS.md` under the bot
  identity).
- **P4** — 2026-11-24, the skill description: `557bc5c74`.
- **P5** — 2026-11-24, the journal header: `39cecced4`, under D1.
- **P6** — 2026-11-24, the fixture-identity closure record: `1753ecfb3`.
- **P7** — 2026-11-24, the state surfaces: `ab701bc8f` (changeset, roadmap row
  through the writer, generated projection) and `6b96e2c86` (the template
  journal header states the fragment door for consumer projects).
- **P8** — 2026-11-24, verification: the runs below; the only red is the
  authorized `log-rewritten` (D1).
- **E5** — targeted verification, all foreground: `bun test
  packages/agentic-workflow/test/journal.test.mjs` · exit 0 · 43 pass; `bun test
  scripts/log-immutability.test.mjs` · exit 0 · 25 pass; `bun test
  scripts/push-identity-check.test.mjs` · exit 0 · 20 pass; `bun test
  scripts/git-config-writes.test.mjs` · exit 0 · 10 pass; `bun test
  scripts/skill-lint.test.mjs` · exit 0 · 20 pass; `bun scripts/skill-lint.mjs`
  · exit 0 · 0 findings; `bun scripts/check-skill-context.mjs` · exit 0 · PASS;
  `bun scripts/lint-changeset.mjs` · exit 0; `bun scripts/docs-generate.mjs
  --check` · exit 0; `scaffold-contract authoring` · exit 0 · SCAFFOLD OK;
  `phase-lint` · exit 0 · PASS; `journal aggregate --check` · exit 0 · checked
  53.
- **E6** — the full gate at `eefb47df3`: `bun scripts/local-gate.mjs --no-bail` ·
  exit 1 · 20 steps · one failed step, `log-immutability`, carrying the two
  violations of the same authorized header commit (`log-rewritten` and
  `log-hand-appended` on `39cecced4`; D1). An earlier run also caught
  `worktree-guard` on another session's stale
  `feat-719-nan-embedding-default-index-tool` worktree; that worktree was
  removed externally and the final run is clean of it (K6). The first run also
  caught the aggregator comment's forge word (`journal.surfaces` AC9);
  `5d31a8f23` removed it, and the rerun's crate suite is green. No other red.
- **E7** — the state owners: `roadmap fixrow` receipt `82de4412 → 857d499c`;
  `docs-generate` · `Files: 2 written · 0 deleted · 1 unchanged`; `docs-generate
  --check` · PASS; `lint-changeset` · ok.
- **E8** — the session entry: `journal write --kind narrative` wrote
  `.agentic-workflow/journal/20261124T232327Z-fix-706-logs-write-path-narrative-local.md`
  (8 commits, 18 files); `journal aggregate --check` · exit 0 · checked 53 · no
  refusals. The entry is a fragment, never a hand append.
- **E4** — the P5 closure, measured: `bun scripts/git-config-writes.mjs` · exit
  0 · `394 carriers scanned · 0 findings · verdict: PASS`; `bun test
  scripts/push-identity-check.test.mjs` · exit 0 · 20 pass / 0 fail (the LEAK
  fixture at `:94-115` is the unpublished refusal, and `:197` is the published
  skip); `git log origin/main..HEAD --format='%ae|%ce' | rg
  't@example\.test'` · no match; `git log --all --format='%ae' | rg -c
  '^t@example\.test$'` · 99 historical commits, all reachable only from the
  release tags/old refs, never rewritten by this unit.
- **L3** — 2026-11-25, the correction request, verbatim:
  ```
  Apply to this repository: triage and fix those that deserve to fix but understand the context before fix and check you haven't broke another different thing, if you have done, start the loop again until you fixed full symbol/related stuff
  ```
- **F1** — 2026-11-25, the external-verify correction batch
  (`external-verify.md`, base `2780f79a7` · head `c73786662`, 5 blockers, one
  batch per §9): B1 — O11's validator named the unit id while the committed
  fragment carries the branch slug, so the row now matches the fragment's path
  (`ls .agentic-workflow/journal/*fix-706-logs-write-path*`) and keeps its
  lint-exit-0 half; B2 — P8's validator now names the reproducing pair (the
  full gate green on a pushed branch — #539 — plus the authorized pair under
  the pinned merge-base) and `E6`'s correction rides an appended line, never an
  edit, because `## Log` is append-only; B3–B5 —
  `packages/agentic-workflow/src/journal/aggregate.mjs`,
  `packages/agentic-workflow/bin/agentic-workflow.mjs` and
  `template/.github/workflows/agentic-workflow-journal.yml.example` state
  their CI context instead of the pre-#706 invocation parity (red at
  `5af85b28b`, green at `6d92ac2e7`, pinned by the new `journal.surfaces`
  case). Advisories 1–5 triaged, none folded: A1/A2 would add a second
  unauthorized `docs/LOGS.md` write beyond D1's one-time exception, A3 is
  another unit's frozen receipt, A4 sits behind the ledgers' cut-time freeze,
  and A5 is the issue's verbatim quote.
- **E9** — 2026-11-25, the batch's foreground runs: `bun test
  packages/agentic-workflow/test/journal.surfaces.test.mjs` · exit 0 · 14 pass
  (red first: exit 1 at the crate assertion, `5af85b28b`; green after
  `6d92ac2e7`); `bun test packages/agentic-workflow/test/journal.test.mjs` ·
  exit 0 · 43 pass; `bun test
  packages/agentic-workflow/test/journal.write.test.mjs` · exit 0 · 34 pass;
  `bun scripts/log-immutability.mjs --base "$(git merge-base origin/main
  HEAD)"` · exit 1 · exactly `log-rewritten` (byte 19) + `log-hand-appended`
  (`39cecced4`) · `2 violations · base 2780f79a7 · range 18 commits`;
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs journal aggregate
  --check` · exit 0 · `checked 54 · refusals 0`; O11's repaired validator ·
  `ls .agentic-workflow/journal/*fix-706-logs-write-path*` exits 0 naming both
  unit fragments (`20261124T232327Z-…` and this batch's `20261125T012408Z-…`)
  — justifies: any of the three wiring surfaces a consumer copies → each names
  the CI condition, so a copied recipe runs instead of being refused for a
  context its own doc omitted; differential in `mktemp -d` exports of
  `c73786662` vs this head · `journal aggregate --check` and the local
  aggregate refusal byte-identical in stdout, stderr and exit; `phase-lint` ·
  PASS · `scaffold-contract authoring` · `ACCEPTANCE MATCH`; `docs-generate
  --check` · PASS; `lint-changeset` · ok; `normative-drift` · 24 pass;
  `unit-doc-contract` · 21 pass; `test-obligation-tags` · 0 findings;
  `skill-lint` · 0 findings; `check-skill-context` · PASS 33 skills.

## Next

Owner external verification of branch `fix/706-logs-write-path`; no push. The
only expected red is the authorized `log-rewritten` from the P3 header (D1);
every other declared check is green. The owner applies the §7 sentence outside
this repository (D3).

## References

- Issue [#706](https://github.com/gtrabanco/agentic-workflow/issues/706)
- `scripts/log-immutability.mjs` — the project write-path gate
- `packages/agentic-workflow/src/journal/aggregate.mjs` — the product aggregator
- `docs/fix/529-journal-merge-identity/decisions.md` — the fixture-identity leak path
- `docs/workflow/DOMAIN_SEPARATION.md` — the product/project split D2 and D5 rest on

## Branch

`fix/706-logs-write-path`

## Depends on

None.

## Regression scope

`docs/LOGS.md`, `skills/log-session/SKILL.md`, `docs/workflow/SKILLS.md`,
`packages/agentic-workflow/src/journal/aggregate.mjs`,
`packages/agentic-workflow/bin/agentic-workflow.mjs`,
`packages/agentic-workflow/README.md`, `scripts/log-immutability.mjs`,
`template/.agentic-workflow/journal.md`.
