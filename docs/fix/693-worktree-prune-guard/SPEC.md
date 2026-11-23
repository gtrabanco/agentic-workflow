---
type: fix
scope: small
---

# fix/693-worktree-prune-guard

> Issue #693 asks for a guard that intercepts `git worktree prune` directly,
> driven by `aw.worktreePrunePolicy` (`deny` default / `ask` / `allow`). Two of
> its proposed mechanisms (a git alias on `worktree`, a git hook on `prune`) do
> not exist in git, and its premise — that `prune` destroys a live worktree and
> its uncommitted work — does not hold. This unit ships the policy surface the
> issue specifies, against a corrected threat model: `git gc`'s automatic
> `worktree prune --expire` is the silent destructor, and `git worktree lock` is
> the only mechanism in git that stops it.

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
runtime this environment uses), that is false:

- `git worktree prune` removes **administrative metadata only**, and only for a
  worktree whose *directory is already gone*. A present working tree, its
  uncommitted files included, is never touched — verified for a tree under
  `.worktrees/` and for the lethal `.git/worktrees/` layout alike.
- The real silent destructor is `git gc`, which calls
  `git worktree prune --expire 3.months.ago` (`gc.worktreePruneExpire`). A
  worktree on an unmounted share or a removable device looks "gone" and loses
  its metadata without anyone asking.
- `git worktree lock` is the one mechanism git provides that prevents it. A
  locked worktree survives prune.

So this unit ships the policy surface **and** reports the residual truth: the
wrapper binds the workflow's own prunes, and locking is what stops a `gc`. A
reader who expects "interception" gets an honest sentence instead of a false
promise.

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

- `git worktree prune` cannot destroy a live tree (measured). **does-not-affect**
  this unit's ability to ship a policy layer; **affects** the prose the unit
  writes, which states the corrected mechanism.
- The pre-push `worktree-audit` step remains `in-progress` in the roadmap under
  #505. **does-not-affect** — this unit adds no step and touches no finding class.

## Acceptance criteria

- **AC1** — `git config aw.worktreePrunePolicy` accepts `deny`, `ask`, `allow`;
  an absent key and an unrecognised value both resolve to `deny`. Proved by
  `bun test scripts/worktree-prune-guard.test.mjs` asserting the resolved policy
  for `unset`/`deny`/`ask`/`allow`/garbage. (S2, S3)
- **AC2** — Under `deny`, a prune request exits 1 and prints the blocked message
  with a `git worktree remove <path>` instruction and the policy-change hint.
  (S3, S6)
- **AC3** — Under `ask`, the guard writes the prompt
  `Prune <N> stale worktree(s)? [y/N]: ` to stderr and proceeds only on `y`.
  (S4, S7)
- **AC4** — Under `allow`, the guard delegates to `git worktree prune` and
  returns that command's exit status. (S5)
- **AC5** — The guard never removes a working tree: every path it would prune is
  listed before the policy decision, and a live worktree's uncommitted file
  survives a prune under `allow`. (S11)
- **AC6** — `scripts/worktree-guard.mjs` routes its prune through the guard and
  a `deny` policy makes its prune path refuse without touching git. (S8, S9)
- **AC7** — The documentation states the measured mechanism (prune reclaims
  metadata for absent directories; `git gc` is the silent actor;
  `git worktree lock` is the only prevention) and names neither the alias nor
  the hook as a protection. (S10, and the premise correction)

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
  (validator: `rg -c 'alias\.worktree|hooks/prune' AGENTS.md docs/workflow/WORKTREES.md` exits 1)
  (Implements: S10, AC7)
  - Relevant files: AGENTS.md, docs/workflow/WORKTREES.md, docs/ROADMAP.md

### Planning evidence

```text
planning-evidence@1
id | authority-kind | claim | source | freshness | affected-decision-or-obligation
PE-001 | measured | `git worktree prune` reclaims admin metadata only, and only for a worktree whose directory is already gone; a live tree and its uncommitted files are untouched | scratch repo on git 2.47.3: `git worktree add` + uncommitted file + `git worktree prune` → file intact, for both `.worktrees/` and `.git/worktrees/` layouts | 2026-11-23 | O5, AC5, premise correction
PE-002 | documented | `git gc` calls `git worktree prune --expire 3.months.ago`; `gc.worktreePruneExpire` changes the grace period (`never` disables) | `git help config` § gc.worktreePruneExpire, git 2.47.3 | 2026-11-23 | O5, the corrected threat model
PE-003 | measured | A git alias on `worktree` never runs — `git worktree` is a builtin | `git -c alias.worktree='!echo X' worktree list` → printed the list, no `X`, exit 0 | 2026-11-23 | Retirement of the alias route
PE-004 | documented | No `prune`/`worktree` git hook exists | `git help hooks` (git 2.47.3): no hook named prune or worktree | 2026-11-23 | Retirement of the hook route
PE-005 | measured | `git worktree lock` makes a worktree survive prune | scratch repo: lock + `rm -rf` the dir + `git worktree prune` → the entry remains `locked` | 2026-11-23 | O5, the enforcement claim
PE-006 | measured | `git config --get <key>` exits 1 when the key is absent, 0 when set — the resolution basis | `git config --get aw.worktreePrunePolicy` in a fresh repo → exit 1, empty stdout | 2026-11-23 | O1
```

### Obligations

```text
obligations@1
obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
O1 | S2, S3, AC1 | an absent or unrecognised `aw.worktreePrunePolicy` resolves to `deny` — the closed default is the safe one | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the resolution case matches 5 | test names in the suite; the resolution assertions in the run output | planned
O2 | S3, S6, AC2 | `deny` refuses the prune with exit 1 and the exact blocked message, naming the manual-removal command and the policy-change hint | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the deny-message case matches 1 | the assertion text in the suite; the captured stderr in the run output | planned
O3 | S4, S7, AC3 | `ask` prints `Prune <N> stale worktree(s)? [y/N]: ` to stderr with the true candidate count and proceeds only on an affirmative answer | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the ask cases match 2 | the prompt-with-count assertion and the y/n pair in the run output | planned
O4 | S5, AC4 | `allow` delegates to `git worktree prune` and returns its exit status unchanged | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the allow case matches 1 | the exit-status passthrough assertion in the run output | planned
O5 | S11, AC5, PE-001, PE-005 | the guard never removes a working tree; a live worktree's uncommitted file survives a prune under every policy | P1 | P2 | execute-phase | `bun test scripts/worktree-prune-guard.test.mjs` exits 0 and the live-tree case matches 1 | the planted-file survival assertion in the run output | planned
O6 | S8, S9, AC6 | `worktree-guard`'s prune path goes through the policy guard, so one policy governs every workflow prune and a `deny` stops it without touching git | P1 | P3 | execute-phase | `rg -c '"worktree", "prune"' scripts/worktree-guard.mjs` exits 1 and `bun test scripts/worktree-guard.test.mjs` exits 0 | the rg count (no hits) and the delegated-path case in the run output | planned
O7 | S10, AC7 | the docs state the measured mechanism and name neither the alias nor the hook as a protection | P4 | P4 | execute-phase | `rg -c 'alias\.worktree|hooks/prune' AGENTS.md docs/workflow/WORKTREES.md` exits 1 | the rg output (no hits) and the WORKTREES.md policy section | planned
O8 | n/a: no package consumes `aw.worktreePrunePolicy` — the key is a git config read by this repository's own scripts, not a unified-config feature key (docs/workflow/CONFIG.md governs package-level keys) | S2 | n/a | n/a | execute-phase | `rg -c 'worktreePrunePolicy' packages/` exits 1 | the empty package scan | n/a
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
