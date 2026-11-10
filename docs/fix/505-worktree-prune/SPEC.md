---
type: fix
scope: small
ac-hash: dfc54f073221d635a4979039a48f3aeb9c6f8d4428f02beed5c8b6d5ec97c45a
---

# fix/505-worktree-prune

> The documented worktree recipe lands working trees inside `.git/worktrees/`,
> git's private worktree-administration namespace, where any `git worktree
> prune` deletes the container recursively — exit 0, no warning, uncommitted
> work destroyed. The recipe moves to `<repo>/.worktrees/<flat-unit-name>`
> (gitignored, inside the project tree so Serena and MCP integrations keep
> working), the guard's legal home moves with it, and the guard gains the
> finding that closes its blind spot on the lethal layout.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#505` — tracked issue in the project's forge. The PR must close it via
`Closes #505` in the body (the commit carries the footer).

## Specs

**S1 — the apply request.**
> "Apply to this repository: issue #505"

**S2 — AGENTS.md prescribes the safe home and forbids the admin namespace.**
> "- **AC1** — `AGENTS.md` "Worktree creation" prescribes `<repo>/.worktrees/<flat-unit-name>` and explicitly forbids `.git/worktrees/` as a working-tree location, keeping the Serena/MCP rationale intact and stating the prune-destruction mechanism beside the rule."

**S3 — the guard's default home moves to `.worktrees`.**
> "- **AC2** — `scripts/worktree-guard.mjs` default `--home` becomes `<repo>/.worktrees`, and the temp+`move` step is documented with a same-filesystem requirement (or dropped if the new layout no longer needs it)."

**S4 — the guard gains the finding that closes its blind spot.**
> "- **AC3** — `scripts/worktree-guard.mjs` gains a `FINDING` for any worktree whose path starts with `<repo>/.git/worktrees/` — the blind spot closes, so the layout cannot be certified legal again. Red-first sibling tests in `scripts/worktree-guard.test.mjs` covering the nested-container case, the basename-collision case, and `.worktrees/` as clean."

**S5 — the gate stays green under the new default home.**
> "- **AC4** — `bun scripts/local-gate.mjs --skip-network` passes with the new default home, and `worktree-guard` reports `0 finding(s)` on a tree whose units live under `.worktrees/`."

**S6 — the reproducer passes against the new recipe.**
> "- **AC5** — The reproducer above, run against a repo prepared by the *new* documented recipe, leaves `precious.txt` on disk after `git worktree prune`."

**S7 — the proven workaround is the design.**
> "Working tree **inside the repository but outside git's admin namespace**: `<repo>/.worktrees/<flat-name>` (gitignored, no nested slash in the leaf).
>
> Verified in an isolated repo: `git worktree prune` → exit 0, **both trees and their uncommitted files intact**, zero `prunable` entries, zero basename collisions. This keeps what `AGENTS.md` actually wanted — the path stays inside the project tree, so Serena and MCP integrations do not see a foreign project — without occupying git's private directory. `OUTSIDE` in the guard is report-only and never blocks, so moving the default home does not turn the gate red."

**S8 — the domain boundary holds.**
> "Per the domain-separation rule (owner decision 2026-11-07), no project rule is pushed into a product surface here. One candidate is deliberately left out of scope and recorded as such: a product-side warning against `.git/worktrees` as a home. It is a real gap for target projects that opt into `worktrees`, but it is an owner decision, not a default of this fix."

## Impact

Callers of the changed surfaces: `scripts/local-gate.mjs`'s `worktree-guard`
step spawns the guard with no `--home`, so it inherits the new default; the
step's outcome on this tree is unchanged (the two live unit worktrees already
sit under `.worktrees/`, flat, since the 2026-11-09 recovery). Consumers of
`AGENTS.md`: every future session that creates a worktree — the recipe gets
simpler (one `git worktree add`, no temp+`move` dance, no container pre-create)
and the `.git/worktrees` path becomes forbidden instead of mandatory. Prose that
stops being true: `AGENTS.md`'s "Worktree creation" and "Worktree removal"
sections, and the `worktree-audit` row of `docs/workflow/GATE_INVENTORY.md`
(its description names the finding classes). Nothing else: the historical
records (`docs/fix/493-*`, `docs/LOGS.md`, older unit docs) keep their
`.git/worktrees` mentions — they describe what happened, not what to do.

## Retirements

- The two-step temp+`move` recipe (AGENTS.md step 4) — replaced by a single
  `git worktree add <repo>/.worktrees/<flat-name>`; no temp path, no `move`,
  no container pre-create, no cross-device failure mode.
- The `.git/worktrees` legal home — replaced by `<repo>/.worktrees` in the
  guard default and the guide.
- Evidence: `rg -c 'worktree move' AGENTS.md` → 0 after the rewrite;
  `rg -c '\.git/worktrees' AGENTS.md scripts/worktree-guard.mjs` → 0 matches
  outside the new forbidden-location finding and the mechanism explanation.

## Non-goals

- No product-surface change: `skills/`, `template/` and `packages/` stay
  untouched (S8 — the product-side warning against `.git/worktrees` homes is
  an owner decision, deliberately out of scope).
- No migration of existing worktrees: both live unit worktrees are already at
  `.worktrees/<flat-name>`; nothing relocates.
- No auto-repair in `--prune` for the new finding: relocating a live checkout
  underneath a running session is the collateral-damage class this unit
  closes, so the guard reports and suggests, never moves or removes.
- Findings discovered during implementation never expand scope beyond the
  regression boundary below.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

`bun scripts/ceremony.mjs tier classify --base main` at cut: `empty-change`
fail-closed to `standard` (no paths changed yet); the verdict is re-run on the
implemented diff at verification (E-line below) and both runs agree on
`standard`.

## Future

- **2026-11-10, open** — "a product-side warning against `.git/worktrees` as a home. It is a real gap for target projects that opt into `worktrees`, but it is an owner decision, not a default of this fix." (issue #508 candidate; needs an owner decision, never a default of this unit.)

## Future cost

- The guard's legal home and the guide's recipe must move together: a future
  change to either `scripts/worktree-guard.mjs`'s default or `AGENTS.md`'s
  Worktree creation section updates both in the same PR (the suite's
  default-home case pins the guard half).

## Applicable tests

- `bun test scripts/worktree-guard.test.mjs` — the guard's sibling suite, extended red-first with the nested-container, basename-collision, default-home and `.worktrees/`-clean cases (S4, S3).
- `node scripts/run-root-suite.mjs --bail` / the local gate — the root suite set, including the extended suite (S5).

## Known pre-existing issues

- The two live worktrees at `.worktrees/feat-269-efficient-context-targeting`
  and `.worktrees/fix-437-review-loop-followup` are on branches whose merge
  state the guard reports independently of this unit — does-not-affect (the
  STALE check is unchanged; the local-gate run at verification shows the
  pre-existing verdict, if any, verbatim).

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — The unit is applied through the owner's local workflow: ledgers
  frozen at cut (this document), no repo review/fold machinery ran, the
  deterministic gates only. Check: `git log --oneline main..HEAD` shows the
  unit's own conventional commits and this SPEC predates the first code commit
  (`git log --follow docs/fix/505-worktree-prune/SPEC.md`).
- **AC-S2** — AGENTS.md's Worktree creation section prescribes
  `<repo>/.worktrees/<flat-unit-name>`, explicitly forbids `.git/worktrees/` as
  a working-tree location, keeps the Serena/MCP rationale, and states the
  prune-destruction mechanism beside the rule. Check: `rg -n '\.worktrees/'
  AGENTS.md` matches the prescribed recipe; `rg -n '\.git/worktrees' AGENTS.md`
  matches only the forbidden-location rule and the mechanism explanation; `rg
  -c 'worktree move' AGENTS.md` exits 1 (0 matches).
- **AC-S3** — The guard's default `--home` is `<repo>/.worktrees` and the
  header/usage text says so; the temp+`move` step is dropped from the recipe it
  documents. Check: the default-home and `.worktrees/`-clean cases in
  `scripts/worktree-guard.test.mjs` pass (`bun test
  scripts/worktree-guard.test.mjs` exits 0).
- **AC-S4** — The guard emits a blocking finding for every worktree under
  `<repo>/.git/worktrees/` (nested-container case and basename-collision case),
  and `--prune` never removes or moves one. Check: the red runs at base are
  recorded in this Log before the green commit; the nested-container and
  basename-collision cases in `scripts/worktree-guard.test.mjs` pass.
- **AC-S5** — The gate is green with the new default home. Check: `node
  scripts/worktree-guard.mjs` exits 0 with `0 finding(s)` on this tree;
  `bun scripts/local-gate.mjs --skip-network` exits 0.
- **AC-S6** — The issue's reproducer, run in scratch against a repo prepared by
  the *new* documented recipe, leaves `precious.txt` on disk after `git
  worktree prune` (exit 0). Check: the P3 scratch run recorded in this Log.
- **AC-S7** — The workaround's design constraints hold in the shipped layout:
  worktrees at `<repo>/.worktrees/<flat-name>` survive prune with uncommitted
  files intact, zero `prunable` entries, zero basename collisions; `OUTSIDE`
  stays report-only. Check: the P3 scratch proof plus the suite's
  `.worktrees/`-clean and outside-home cases.
- **AC-S8** — No product surface changed. Check: `git diff --stat main..HEAD --
  skills/ template/ packages/` is empty.

## Tasks

- P1 — RED corpus: extend `scripts/worktree-guard.test.mjs` with the nested-container finding case, the basename-collision case, the default-home case and the `.worktrees/`-clean case; run at base and observe the new cases red (validator: `bun test scripts/worktree-guard.test.mjs` exits non-zero with the new cases failing before the implementation commit)
  (Implements: S1, S4)
  Relevant files: scripts/worktree-guard.test.mjs
- P2 — guard implementation: default home `<repo>/.worktrees`, the new `ADMIN_NAMESPACE` finding for worktrees under `<repo>/.git/worktrees/` (report + suggest, never auto-moved), header/usage text updated (validator: `bun test scripts/worktree-guard.test.mjs` exits 0)
  (Implements: S3, S4)
  Relevant files: scripts/worktree-guard.mjs
- P3 — scratch proofs: differential base-vs-head guard output on a fixture repo (only the declared differences), and the issue's reproducer re-run against the new recipe (validator: `diff` in `mktemp -d` shows only the declared differences; the scratch reproducer leaves `precious.txt` on disk, exit 0)
  (Implements: S1, S6)
- P4 — guide rewrite: AGENTS.md Worktree creation/removal sections prescribe `<repo>/.worktrees/<flat-unit-name>`, forbid `.git/worktrees/`, keep the Serena/MCP rationale, state the prune mechanism, drop the temp+`move` recipe; GATE_INVENTORY `worktree-audit` row description gains the new finding class (validator: `rg -c 'worktree move' AGENTS.md` exits 1 (0 matches), `rg -n '\.git/worktrees' AGENTS.md` matches only the forbidden-location rule and the mechanism explanation)
  (Implements: S2, S3)
  Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md
- P5 — indexes, projection and verification: ROADMAP `## Fixes` row, `docs/generated` projection re-rendered by its emitter, session log entry, obligations closed with foreground evidence, local gate (validator: `bun scripts/docs-generate.mjs --check` exits 0; `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S1, S5)
  Relevant files: docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | the guard's legal home defaults to `<repo>/.git/worktrees` and `AGENTS.md` prescribes exactly that location — the two live surfaces that codify the trap | `scripts/worktree-guard.mjs` (`const legalHome = home ?? path.join(root, ".git", "worktrees")`), `AGENTS.md` § Worktree creation step 4 | current | O2, O4 |
| PE-002 | issue-forensics, live-reproduced 2026-11-10 | `git worktree prune` deletes working trees under `.git/worktrees/` recursively, exit 0, no warning; the two-step temp+`move` recipe reliably produces the lethal layout and additionally leaves stale admin dirs (the temp entries) behind | the RED scratch run recorded as E1 (prune exit 0, both trees and `precious.txt` destroyed, `aw505-t1/t2` stale admin leftovers) | current | O1, O5 |
| PE-003 | measured at P3 | the proven workaround holds: a repo whose worktrees live at `<repo>/.worktrees/<flat-name>` survives `git worktree prune` with uncommitted files intact, zero `prunable` entries, zero basename collisions | the scratch reproducer run against the new recipe (E-line at P3) | measured 2026-11-10 | O5 |
| PE-004 | repository | the guard's `OUTSIDE` line is report-only (`reports`, never `findings`), so moving the default home cannot turn a legal `.worktrees` layout red | `scripts/worktree-guard.mjs` (`audit()` pushes `OUTSIDE` to `reports`) | current | O2, O4 |
| PE-005 | repository | no product surface carries the trap: `.git/worktrees` has zero matches under `skills/`, `template/` and `packages/` | `rg -l '\.git/worktrees' skills/ template/ packages/` → no matches (issue #505's own sweep, re-run at cut) | current | S8, Non-goals |
| PE-006 | repository | no machine surface pins the AGENTS.md Worktree sections: no test or drift gate references them | `rg -n 'Worktree' scripts/*.test.mjs` → only `worktree-guard.test.mjs`'s own helper names | current | O1, O6 |
| PE-007 | measured at E1 | `git worktree move` into a nested `.git/worktrees/<a>/<b>` path does not rename the admin dir cleanly — the temp registrations survive as stale admin dirs — so dropping the `move` step removes a second defect, not just a step | the E1 scratch layout (`.git/worktrees/aw505-t1`, `aw505-t2` left behind after both moves) | measured 2026-11-10 | O1 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2, S7 | AGENTS.md prescribes `<repo>/.worktrees/<flat-unit-name>`, explicitly forbids `.git/worktrees/` as a working-tree location, keeps the Serena/MCP rationale, and states the prune-destruction mechanism beside the rule (PE-002); the two-step recipe and its `move` step are gone (PE-007) | P4 | P4 | AGENTS.md | `rg -c 'worktree move' AGENTS.md` exits 1 (0 matches); `rg -n '\.worktrees/' AGENTS.md` matches the prescribed recipe; the prune-destruction sentence is present beside the rule | the E line with both rg exits and the mechanism sentence | planned |
| O2 | S3, S7 | the guard's default `--home` is `<repo>/.worktrees` (PE-001, PE-004): a worktree there is inside the legal home (no OUTSIDE report), a worktree elsewhere stays report-only, and the header/usage text says the new default | P2 | P2 | scripts/worktree-guard.mjs | `bun test scripts/worktree-guard.test.mjs` exits 0 including the default-home case and the `.worktrees/`-clean case | the E line with the suite exit and the case names | planned |
| O3 | S4 | the guard emits a blocking `ADMIN_NAMESPACE` finding for every worktree whose path starts with `<repo>/.git/worktrees/` — the nested-container case and the basename-collision case both flag — and `--prune` never removes or moves such a worktree (S Non-goals: relocating a live checkout is the collateral class) | P2 | P1, P2 | scripts/worktree-guard.mjs, scripts/worktree-guard.test.mjs | `bun test scripts/worktree-guard.test.mjs` exits 0 with the nested-container and basename-collision cases asserting the finding and the `--prune` SKIP; the red runs at base are recorded before the green commit | the E lines naming the red runs (command + exit + failing cases) and the green run | planned |
| O4 | S5 | the gate is green with the new default home: `worktree-guard` reports `0 finding(s)` on this tree (both unit worktrees under `.worktrees/`) and the local gate's offline subset passes | P5 | P5 | scripts/local-gate.mjs (worktree-guard step) | `node scripts/worktree-guard.mjs` exits 0 with `0 finding(s)`; `bun scripts/local-gate.mjs --skip-network` exits 0 | the G line with the gate exit and the guard verdict line | planned |
| O5 | S6 | the issue's reproducer, run against a repo prepared by the *new* documented recipe, leaves `precious.txt` on disk after `git worktree prune` with exit 0 (PE-003) | P3 | P3 | the documented recipe (AGENTS.md after P4) | scratch run in `mktemp -d`: new recipe (`git worktree add .worktrees/fix-493-x`) → `precious.txt` → `git worktree prune` (exit 0) → `ls .worktrees/fix-493-x/precious.txt` — the file survives | the E line with the scratch commands and the surviving file | planned |
| O6 | S1 | previously-working behaviour does not regress: the guard's existing finding classes (CORRUPTED, PRUNABLE, OUTSIDE, DETACHED, STALE), `--prune` semantics, `--json` and usage errors are byte-identical (differential vs the base commit on a fixture repo: only the declared differences — the new finding, the new default-home reports — differ) | P3 | P3 | scripts/worktree-guard.mjs | the differential run in `mktemp -d` comparing base-commit output vs head output on the fixture repo: `diff` shows only the declared differences; `bun test scripts/worktree-guard.test.mjs` exits 0 (all pre-existing cases unchanged) | the E line with the diff summary | planned |
| O7 | S1 | documentation and state ship in the same change: ROADMAP `## Fixes` row, `docs/generated` projection re-rendered by its emitter (never hand-written), GATE_INVENTORY row description, session log entry, and the completed obligations ledger | P5 | P5 | docs/ROADMAP.md, docs/generated/*, docs/workflow/GATE_INVENTORY.md, docs/LOGS.md | `bun scripts/docs-generate.mjs --check` exits 0 after the emitter run | the E line with the check exit | planned |

## Path protection

The plan declares the protected set this unit authors (the frozen suite is
edited with `justification` rows, never a quiet relaxation). The records live
in this folder's [`decisions.md`](decisions.md).

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
not-created | scripts/worktree-guard.test.mjs | the guard's own sibling suite: P1 extends it with the nested-container, basename-collision, default-home and .worktrees-clean cases — every pre-existing case keeps its exact assertions
```

## Triaged steps

> The owner's apply workflow (§5) substitutes its ledger freeze for the lane's
> plan step; the Tasks section above is the authoritative step list for this
> inline unit. `bun scripts/unit-route.mjs 505-worktree-prune` resolves this
> unit's route from this ledger (execute — a known unit with no open row).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-10, the request, verbatim:
  ```
  Apply to this repository: issue #505
  ```
- **E1** — 2026-11-10, the issue's reproducer against the *current* documented recipe (two-step temp+`move` into `.git/worktrees/`), scratch `mktemp -d` · exit 0 for `git worktree prune` · RED confirmed: both working trees destroyed (`prunable`, containers `feat/` and `fix/` deleted recursively), `precious.txt` gone, stale admin dirs `aw505-t1`/`aw505-t2` left behind; branches survive.
- **P1** — 2026-11-10, ledger freeze (this document + ROADMAP row) before the first line of code.

## Next

P1 — the RED corpus commit (extended sibling suite, observed failing at base).

## References

- Issue [#505](https://github.com/gtrabanco/agentic-workflow/issues/505) — the PR closes it via `Closes #505`.
- Issue [#476](https://github.com/gtrabanco/agentic-workflow/issues/476) — the worktree-guard's origin (`.changeset/476-runtime-hygiene.md`).
- `docs/workflow/GATE_INVENTORY.md` — the `worktree-audit` row.
- 2026-11-09 recovery of worktrees #269/#437 (`docs/LOGS.md`) — the incident that motivated the issue.

## Branch

`fix/505-worktree-prune`

## Depends on

Independent.

## Regression scope

- The guard's existing finding classes and `--prune` semantics — `bun test scripts/worktree-guard.test.mjs` (every pre-existing case unchanged) plus the P3 differential.
- The local gate's `worktree-guard` step on this tree — `node scripts/worktree-guard.mjs` exits 0.
