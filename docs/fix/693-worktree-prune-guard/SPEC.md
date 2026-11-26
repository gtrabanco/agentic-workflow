---
type: fix
scope: small
roadmap_summary: `git worktree prune` is now gated by `aw.worktreePrunePolicy` (`deny` default / `ask` / `allow`) in `scripts/worktree-prune-guard.mjs`, which `worktree-guard --prune` routes through so one policy governs the workflow's own prunes. Git offers no interception point for the builtin (an `alias.worktree` entry never runs, no `prune` hook exists), so the unit records the corrected mechanism instead of promising one: prune reclaims metadata for an already-absent registration and never touches a present tree outside git's admin namespace — inside `.git/worktrees/` it destroys a stray checkout, so `IR8` keeps trees out; `git gc` is the silent actor for registrations and `git worktree lock` is the prevention — stated in AGENTS.md and WORKTREES.md. SPEC: [SPEC](fix/693-worktree-prune-guard/SPEC.md)
---

# fix/693-worktree-prune-guard

> Issue #693 asks for a guard that intercepts `git worktree prune` directly,
> driven by `aw.worktreePrunePolicy` (`deny` default / `ask` / `allow`). Two of
> its proposed mechanisms (a git alias on `worktree`, a git hook on `prune`) do
> not exist in git, and its premise — that `prune` destroys a live worktree and
> its uncommitted work — holds only inside git's admin namespace: outside it a
> present tree is untouched, inside `.git/worktrees/` a stray checkout is
> destroyed (measured; corrected 2026-11-23 in the external-verify B1 batch).
> This unit ships the policy surface the issue specifies, against that
> corrected threat model: outside the namespace `git gc`'s automatic
> `worktree prune --expire` is the silent destructor and `git worktree lock` is
> the only mechanism in git that stops it; inside, `IR8` keeps worktrees out.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#693` — tracked issue in the project's forge. The PR must close it via
`Closes #693` in the body (the commit carries the footer).

## Specs

**S1 — the apply request.**
> "Apply to this repository: issue #693"

**S2 — the policy config surface.**
> "Crear un guard que intercepte `git worktree prune` directamente, basado en una política configurable en git:
>
> ```bash
> git config aw.worktreePrunePolicy ask|deny|allow
> ```"

**S3 — `deny` is the default.**
> "- **`deny`** (default): `prune` siempre se niega. Mensaje con \"remove manually with `git worktree remove <path>`\""

**S4 — `ask` prompts interactively.**
> "- **`ask`**: muestra un prompt interactivo (\"prune X worktrees? (y/N)\")"

**S5 — `allow` delegates unconstrained.**
> "- **`allow`**: ejecuta directamente sin restricciones"

**S6 — the exact `deny` message.**
> ```
> $ git worktree prune
> ERROR: git worktree prune is blocked by policy "deny".
> To remove a worktree manually: git worktree remove /path/to/worktree
> To change this policy: git config aw.worktreePrunePolicy ask|allow|deny
> ```

**S7 — the `ask` interaction.**
> ```
> $ git config aw.worktreePrunePolicy ask
> $ git worktree prune
> Prune 2 stale worktrees? [y/N]: y
> ```

**S8 — the pre-push guard keeps a narrower role.**
> "- El `worktree-guard` del pre-push puede mantenerse como capa adicional
> - Si el usuario cambia a `ask` o `allow`, el usuario acepta el riesgo"

**S9 — the guard reduces to the real leftover classes.**
> "- `worktree-guard` del push se reduce a: \"no hay worktrees `CORRUPTED`/`ADMIN_NAMESPACE`/`PRUNABLE`\" — lo que realmente debería hacer"

**S10 — the requester's own correction of the delivery order.**
> "I mean create the PR when finish the implementation, so continue with the command aw-local-apply"

**S11 — the mechanism put to the requester and the one delivered.**
> "lock: Confirm option A (lock-backed policy guard) as the mechanism for #693, and I implement it end to end and open the PR?"
>
> The question came back unanswered; the delivery proceeded under option A, the
> recommendation stated to the requester in the same turn and never contradicted.
> Recorded as a selected option, not as new words quoted — see `## Findings` F1.

## Premise correction (recorded, not silently dropped)

The issue's Problem section states that `git worktree prune`
"borra worktrees registrados sin confirmación" and that an accidental run
destroys "el worktree y su trabajo nocommiteado". Measured on git 2.47.3 (the
runtime this environment uses) — corrected on 2026-11-23 after the
external-verify B1 reproducer showed the first cut over-generalised:

- `git worktree prune` removes **administrative metadata only** for a
  registration whose *directory is already gone*: a present tree outside git's
  admin namespace — its uncommitted files included — is untouched by every
  policy. Inside `.git/worktrees/` the opposite holds: any entry that is not a
  valid registration (a checkout created or moved there) is deleted
  **recursively, with the live tree and its uncommitted work inside it**, exit
  0 and no warning (PE-007). What prevents that layout is `IR8`'s prohibition,
  never the policy layer.
- The real silent destructor is `git gc`, which calls
  `git worktree prune --expire 3.months.ago` (`gc.worktreePruneExpire`). A
  worktree on an unmounted share or a removable device looks "gone" and loses
  its metadata without anyone asking.
- `git worktree lock` is the one mechanism git provides that prevents it. A
  locked worktree survives prune.

So this unit ships the policy surface **and** reports the residual truth: the
wrapper binds the workflow's own prunes, locking is what stops a `gc`, and the
admin namespace stays a hard never because no policy reaches git's collateral
deletion there. A reader who expects "interception" gets an honest sentence
instead of a false promise.

Two mechanisms the issue proposes cannot be built and are not attempted:

- **A git alias on `worktree`** — aliases apply to non-builtin commands only;
  `git worktree` is a builtin, so `alias.worktree` never runs.
- **A git hook on `prune`** — no such hook exists among git's documented hooks,
  and a hand-placed `hooks/prune` is never consulted.

Both are recorded as retirements with their evidence.

## Impact

Callers: `scripts/worktree-guard.mjs` gains `--prune` delegation through the new
guard (it currently calls `git worktree prune` directly in its prune path);
`scripts/local-gate.mjs`'s `worktree-audit` step inherits whatever the guard
does. Consumers of `AGENTS.md` → "Worktree creation" read the corrected
mechanism sentence and the policy knob. `docs/workflow/WORKTREES.md` gains the
policy section and stops implying prune destroys live trees. The
`worktree-audit` row of `docs/workflow/GATE_INVENTORY.md` does not change: this
unit adds no gate step.

## Surfaces

- `scripts`
- `docs`

## Retirements

- **`alias.worktree` as an interception surface** — cannot work. Evidence:
  `git -c alias.worktree='!echo X' worktree list` executes the builtin and
  prints the list (the alias never runs). No file in this repository ever
  shipped such an alias.
- **A `prune` git hook as an interception surface** — does not exist. Evidence:
  `git help hooks` lists its hooks; none is `prune` or `worktree`. A file
  `hooks/prune` placed by hand is never consulted.
- **`scripts/worktree-guard.mjs`'s direct `git worktree prune` spawn** — replaced
  by a delegated call through the policy guard, so one policy governs every
  prune the workflow itself performs. Evidence after the change:
  `rg -c '"worktree", "prune"' scripts/worktree-guard.mjs` → no hits.

## Non-goals

- Not a `git`-level interception (impossible; see the premise correction).
- Not a change to the `ADMIN_NAMESPACE`, `CORRUPTED`, `PRUNABLE` or `STALE`
  finding vocabulary — #505 owns those and they stay.
- No new gate step; the policy guard is a script with a sibling suite.
- Not an install-time hook. Neither the alias nor the hook route is shipped, so
  no `.git/config` and no `hooks/` entry is written by this unit.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood + contained + resumable
- **Named high-risk item** — none — not a high-tier unit

The script mutates git's own state only when the policy allows it, runs behind a
candidate listing first, and is exercised exclusively in scratch repos until its
suite passes.

## Future

none

## Future cost

Every caller that prunes a worktree must go through `scripts/worktree-prune-guard.mjs`
— a direct `git worktree prune` bypasses the policy and is a defect to report,
not to repair silently. Binds the workflow's own scripts.

## Applicable tests

`bun test scripts/worktree-prune-guard.test.mjs` (red-first), plus the existing
sibling `bun test scripts/worktree-guard.test.mjs` for the delegated prune path.

## Known pre-existing issues

- `scripts/roadmap-settle.test.mjs`'s live-tree check failed on feature number
  98, which two rows claimed (the second re-registered issue #537 under a number
  whose topic cell reads `finding-severity-ladder`). **does-not-affect** — the
  row's bytes and the duplicate folder were identical to `origin/main`
  (measured: this branch's roadmap diff is only the #693 row), so the drift was
  the roadmap's to settle, not this unit's; the root gate reported it red here
  and on `main`'s tree alike. **Repaired 2026-11-26** by the owner's order:
  number 98 returned to `finding-severity-ladder`, the duplicate #537
  registration and its stub folder left the tree, and `runner roadmap-settle`
  passes on the live tree.
- `scripts/unit-doc-contract.test.mjs`'s `#462 …train version` case fails:
  `packages/agentic-workflow` is `4.10.1` while `packages/agentic-workflow-schema`
  is `4.10.0` (D-40-14). **does-not-affect** — this branch touches no
  `packages/` file, and the pristine `git archive origin/main` copy fails the
  same case (6 fails there); the train split is the pin watch's to repair, the
  same family as the `normative-drift` row below.
- `pi-node-compat` (local-gate's pi package step) fails at `bundle:skills`:
  `node_modules/@gtrabanco/agentic-workflow` resolves into the bun store at
  `4.10.0` while the workspace member is `4.10.1`, so the published copy
  predates `src/doc/section-locator.mjs`. **does-not-affect** — this branch
  touches no `packages/` or lockfile byte (`git diff --stat origin/main --
  packages/ bun.lock` is empty), and the split is the same D-40-14 train drift
  the pin watch owns; `crate-suite-bun`, `crate-suite-node` and
  `schema-node-compat` are green here.
- The pre-push `worktree-audit` step remains `in-progress` in the roadmap under
  #505. **does-not-affect** — this unit adds no step and touches no finding class.
- `scripts/normative-drift.test.mjs` reports 4 failures on `origin/main` itself
  (measured on an untouched `git archive` of `origin/main`: 20 pass / 4 fail,
  identical on this branch), rooted in `skills/runner-contract/references/RUNNER.md`
  pinning `@gtrabanco/agentic-workflow@4.10.0` while the package is `4.10.1`.
  **does-not-affect** — this unit touches neither the file nor the version pin;
  the drift is the pin watch's to repair.

## Acceptance criteria

- **AC1** — `git config aw.worktreePrunePolicy` accepts `deny`, `ask`, `allow`;
  an absent key and an unrecognised value both resolve to `deny`. Proved by
  `bun test scripts/worktree-prune-guard.test.mjs` asserting the resolved policy
  for `unset`/`deny`/`ask`/`allow`/garbage. (S2, S3)
- **AC2** — Under `deny`, a prune request exits 1 and prints the blocked message
  with a `git worktree remove /path/to/worktree` instruction and the policy-change
  hint, written once on stderr with stdout kept to header, listing and verdict.
  (S3, S6)
- **AC3** — Under `ask`, the guard writes the prompt
  `Prune <N> stale worktrees? [y/N]: ` to stderr after listing the candidates,
  proceeds only on `y`, and refuses — never hangs — when no answer can arrive
  (an ended stdin, a closed device, or `WORKTREE_PRUNE_GUARD_NO_TTY=1`).
  (S4, S7)
- **AC4** — Under `allow`, the guard delegates to `git worktree prune` and
  returns that command's exit status. (S5)
- **AC5** — The guard never targets a working tree: every path it would prune is
  listed before the policy decision (before the `ask` question and before the
  delegate runs), and a live worktree outside git's admin namespace survives a
  prune under `allow`. Inside `.git/worktrees/` git's own prune destroys a
  stray checkout — the measured limit, pinned as recorded and prevented by
  `IR8`, not by the policy. (S11)
- **AC6** — `scripts/worktree-guard.mjs` routes its prune through the guard and
  a `deny` policy makes its prune path refuse without touching git. (S8, S9)
- **AC7** — The documentation states the measured mechanism (prune reclaims
  metadata for absent registrations and never a present tree outside the admin
  namespace; inside `.git/worktrees/` a stray checkout is destroyed — the
  layout `IR8` forbids; `git gc` is the silent actor for registrations and
  `git worktree lock` is the prevention) and names neither the alias nor the
  hook as a protection. (S10, and the premise correction)

## Tasks

- P1 — Red-first suite `scripts/worktree-prune-guard.test.mjs`: policy
  resolution (absent/deny/ask/allow/garbage), the exact `deny` message, the `ask`
  prompt with count, `allow` delegation and exit passthrough, and the
  live-tree-survives assertion. Observed failing on the missing module.
  (validator: `bun test scripts/worktree-prune-guard.test.mjs` exits non-zero before the module exists)
  (Implements: S2, S3, S4, S5, S6, S7, S11)
  - Relevant files: scripts/worktree-prune-guard.test.mjs
- P2 — Implement `scripts/worktree-prune-guard.mjs`: policy read via
  `git config --get aw.worktreePrunePolicy`, prune candidate listing, the three
  policies, a `--json` envelope, and a non-interactive refusal when `ask` runs
  without a TTY.
  (validator: `bun test scripts/worktree-prune-guard.test.mjs` exits 0)
  (Implements: S2, S3, S4, S5, S6, S7)
  - Relevant files: scripts/worktree-prune-guard.mjs
- P3 — Delegate `scripts/worktree-guard.mjs`'s prune path through the guard,
  keeping its own output contract; extend its sibling suite for the `deny`
  refusal.
  (validator: `bun test scripts/worktree-guard.test.mjs` exits 0)
  (Implements: S8, S9)
  - Relevant files: scripts/worktree-guard.mjs, scripts/worktree-guard.test.mjs
- P4 — Documentation: `AGENTS.md` worktree section, `docs/workflow/WORKTREES.md`
  policy section, unit doc evidence rows, roadmap row.
  (validator: `rg -n 'alias\.worktree\|hooks/prune' AGENTS.md docs/workflow/WORKTREES.md | rg -v 'never runs\|no way to intercept\|no .prune. hook'` exits 1 — O7's negation-aware pipeline; the bare count this task first declared read the required negated mention as a hit, so the external-verify B4 swapped it for the owner's form)
  (Implements: S10, AC7)
  - Relevant files: AGENTS.md, docs/workflow/WORKTREES.md, docs/ROADMAP.md

### Planning evidence

```text
planning-evidence@1
id | authority-kind | claim | source | freshness | affected-decision-or-obligation
PE-001 | measured | `git worktree prune` reclaims admin metadata only for a registration whose directory is already gone: a live tree outside `.git/worktrees/` survives untouched, while an entry inside `.git/worktrees/` that is not a valid registration is removed recursively with the live tree (scope superseded by PE-007 after the 2026-11-23 external-verify B1 reproducer) | scratch repo on git 2.47.3: `git worktree add` + uncommitted file + `git worktree prune` → file intact under `.worktrees/`, destroyed in the admin namespace | 2026-11-23 | O5, O9, AC5, premise correction
PE-002 | documented | `git gc` calls `git worktree prune --expire 3.months.ago`; `gc.worktreePruneExpire` changes the grace period (`never` disables) | `git help config` § gc.worktreePruneExpire, git 2.47.3 | 2026-11-23 | O5, the corrected threat model
PE-003 | measured | A git alias on `worktree` never runs — `git worktree` is a builtin | `git -c alias.worktree='!echo X' worktree list` → printed the list, no `X`, exit 0 | 2026-11-23 | Retirement of the alias route
PE-004 | documented | No `prune`/`worktree` git hook exists | `git help hooks` (git 2.47.3): no hook named prune or worktree | 2026-11-23 | Retirement of the hook route
PE-005 | measured | `git worktree lock` makes a worktree survive prune | scratch repo: lock + `rm -rf` the dir + `git worktree prune` → the entry remains `locked` | 2026-11-23 | O5, the enforcement claim
PE-006 | measured | `git config --get <key>` exits 1 when the key is absent, 0 when set — the resolution basis | `git config --get aw.worktreePrunePolicy` in a fresh repo → exit 1, empty stdout | 2026-11-23 | O1
PE-007 | measured | a checkout under `.git/worktrees/` — created there by `worktree add`, or moved there from a temp path, with or without a container directory — is destroyed by a plain `git worktree prune` (exit 0, no warning), live tree and uncommitted file included; only a path that doubles as its own registration survives | scratch repos on git 2.47.3: add-into-container, temp+move with container, temp+move without container → `precious.txt` gone in all three; plus the guard-level `allow` run | 2026-11-23 | O5, O9, AC5, AC7, premise correction
PE-008 | measured | `spawnSync` without `input` closes the child's stdin (EOF reaches the child) and a `stdio[0]=inherit` child sees the parent's stdin state; a readline `question()` whose input ends without a line never settles unless the interface's close event resolves it | node/bun stdin probes in `mktemp` scratch (default-pipe child printed EOF; the pre-fix guard hung until its timeout killed it) | 2026-11-23 | O3, O6, B3
```

### Obligations

```text
obligations@1
obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
O1 | S2, S3, AC1 | an absent or unrecognised `aw.worktreePrunePolicy` resolves to `deny` — the closed default is the safe one | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the resolution case matches 5 | test names in the suite; the resolution assertions in the run output | verified
O2 | S3, S6, AC2 | `deny` refuses the prune with exit 1 and the exact blocked message, naming the manual-removal command and the policy-change hint | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the deny-message case matches 1 | the assertion text in the suite; the captured stderr in the run output; the one-copy case (the refusal never appears on stdout) | verified
O3 | S4, S7, AC3 | `ask` prints `Prune <N> stale worktrees? [y/N]: ` to stderr with the true candidate count, lists the candidates first, proceeds only on an affirmative answer, and refuses — never hangs — when no answer can arrive | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the ask cases match 5 | the prompt-with-count assertion, the y/n pair, the no-answer refusal and the ordering case in the run output | verified
O4 | S5, AC4 | `allow` delegates to `git worktree prune` and returns its exit status unchanged | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the allow case matches 1 | the delegation case and the exit-passthrough case (shim exit 7) in the run output | verified
O5 | S11, AC5, PE-001, PE-005, PE-007 | the guard never *targets* a working tree: its candidates are absent directories only, a live worktree outside `.git/worktrees/` survives a prune under every policy, and the measured limit inside it (git's own prune destroys the stray checkout) is pinned as recorded, never as a promise | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the tree-survival case and the admin-namespace boundary case each match 1 | the planted-file survival assertion and the stray-entry limit assertion in the run output | verified
O6 | S8, S9, AC6 | `worktree-guard`'s prune path goes through the policy guard, so one policy governs every workflow prune, a `deny` stops it without touching git, and under `ask` with no answer channel it refuses instead of hanging | P1 | P3 | execute-phase | `rg -c '"worktree", "prune"' scripts/worktree-guard.mjs` exits 1 and `bun test scripts/worktree-guard.test.mjs` exits 0 | the rg count (no hits), the delegated-path deny case and the ask-refusal case in the run output | verified
O7 | S10, AC7 | the docs state the measured mechanism, and every mention of the alias or hook route is a negation (naming it as impossible) — never a protection | P4 | P4 | execute-phase | `rg -n 'alias\.worktree\|hooks/prune' AGENTS.md docs/workflow/WORKTREES.md | rg -v 'never runs\|no way to intercept\|no .prune. hook'` exits 1 | the empty filtered output and the WORKTREES.md policy section | verified
O8 | n/a: no package consumes `aw.worktreePrunePolicy` — the key is a git config read by this repository's own scripts, not a unified-config feature key (docs/workflow/CONFIG.md governs package-level keys) | S2 | n/a | n/a | execute-phase | `rg -c 'worktreePrunePolicy' packages/` exits 1 | the empty package scan | n/a
O9 | AC7, IR8 (external verify B1) | the guide and the deep reference both state the measured destruction inside `.git/worktrees/` and the read-first trigger for the worktree doc | P4 | P4 | execute-phase | `rg -c 'uncommitted work inside it|read it before creating, moving or recovering' AGENTS.md docs/workflow/WORKTREES.md` exits 0 (AGENTS.md 2, WORKTREES.md 1) | the two restored AGENTS.md sentences, the WORKTREES.md warning, and the rg counts in the run output | verified
O10 | AC5 | every candidate is listed before the policy decision — before the `ask` question and before the delegate runs | P2 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the ordering case matches 1 | the ordering assertion (stdout carries `PRUNE ` before the prompt) in the run output | verified
```

## Triaged steps

```text
n/a — this unit was applied through the owner's local workflow, which
substitutes this document's Tasks for the `runner unit-route --triage` block.
No machine step list was produced.
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S11 | plan | SUGGESTION | docs-only | plan | product owner — the mechanism question returned no answer text; delivery proceeded on the stated recommendation (option A). Confirm or redirect at review |

## Log

- L1 — the issue text, verbatim: see `## Issue` and the `## Specs` block above.
- L2 — `request` — the requester's opening instruction for this session:
  "Apply to this repository: issue #693" (S1), followed by the local workflow
  procedure this unit follows.
- L3 — `request` — "Create the PR", then "I mean create the PR when finish the
  implementation, so continue with the command aw-local-apply" (S10).
- L4 — `decision` — the premise measured false and corrected in `## Premise
  correction`; the alias and hook routes retired with PE-003/PE-004.
- L5 — `evidence` — the scratch probes PE-001, PE-003, PE-005 and PE-006 run
  under `mktemp -d /tmp/wtred*`, removed after each run; nothing executed against
  the live tree.
- L6 — `gate` — `bun scripts/worktree-prune-guard.test.mjs` (11 pass),
  `bun scripts/worktree-guard.test.mjs` (16 pass), `bun scripts/findings-corpus.test.mjs`
  (15 pass), `check-skill-context --documents` PASS, `docs-generate --check` PASS,
  and a differential run of `worktree-guard` against `origin/main` whose only
  difference is the fixture path. The full local gate is green apart from
  `normative-drift`, which fails identically on `origin/main` (4 failures,
  measured) for the `RUNNER.md` 4.10.0/4.10.1 pin — recorded in
  `## Known pre-existing issues`.
- L7 — `decision` — the 2026-11-23 external-verify receipt (6 blockers) drives
  one correction batch: the premise re-scoped to the measured truth with the
  destruction warning restored in AGENTS.md and WORKTREES.md (B1), the seven
  surviving sibling mentions reconciled against it (B2), the `ask` path made
  refuse-never-hang in both the guard and its worktree-guard spawn (B3), P4's
  validator swapped to O7's negation-aware pipeline (B4), the S6/S7 verbatim
  texts printed (B5), and the candidate listing moved before the decision (B6).
  Advisories A1-A5 folded (exit passthrough, `NO-OP` verdict, single refusal
  copy, the S1 disposition in decisions.md D5, the AGENTS.md read-first
  trigger); A6 stays the pin watch's. O2-O7 reopened at cut; O9-O10 added.
- L8 — `evidence` — red at `fa6cb0789`: `bun test
  scripts/worktree-prune-guard.test.mjs` 9 pass / 7 fail (16), `bun test
  scripts/worktree-guard.test.mjs` 16 pass / 1 fail (17), the two hang cases
  bounded by their own timeouts; the O9 docs check and P4's declared validator
  were also observed red before this slice. One orphaned gate process from the
  red run was killed and disclosed, never hidden.
- L9 — `gate` — green at `9d54202e1`: worktree-prune-guard 16 pass / 0 fail and
  worktree-guard 17 pass / 0 fail, each under bun and under node; the
  pre-batch-vs-batch differential on `--prune` differs only in the S6 literal
  (asked for), stdout otherwise identical after path normalization.
- L10 — `gate` — after this batch: the standalone root suite (the CI
  invocation) runs its full dispatch at **138 pass / 3 fail** —
  `lint-changeset` (the batch's own changeset path cite) fixed and green; the
  three reds (`normative-drift`, `roadmap-settle` row 98, `unit-doc-contract`
  train pair) reproduce on a pristine `git archive origin/main` copy and are
  recorded under `## Known pre-existing issues` with their base evidence.
  `check-skill-context --documents` PASS, `docs-generate --check` PASS,
  `journal aggregate --check` ok, `log-immutability` and `journal-corpus` green
  in the gate run; `local-gate --skip-network --no-bail` stops its root-suite
  child (the step hard-wires `--bail`, local-gate.mjs:233) at the pre-existing
  normative-drift red, so the four skipped package steps were run by hand:
  crate-bun, crate-node and schema-node green, `pi-node-compat` red on the
  train-split store link (Known pre-existing issues).
