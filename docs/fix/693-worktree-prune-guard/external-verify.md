# External verify — fix/693-worktree-prune-guard

2026-11-23 — full verdict: no prior `EXTERNAL VERIFY` block, no `review`
verdict and no earlier receipt existed for this unit (this file is the first),
so this is the full verdict, once. Every mutating probe ran in a `mktemp -d`
scratch repo; nothing was executed against the live tree or this worktree, and
no commit, branch, push or forge mutation was made.

```text
EXTERNAL VERIFY — base: 7c395d880650bf50aca3a71c18487a3cec17718c · head: 85e30bac4d8300b3e7bd43fb16d94ace575f9676
Blockers: 6
Advisories: 6
Sibling sweep: list (7 survivors, all asserting the pre-change claim — see below)
Completeness: S2–S9, S11 resolved (tasks P1–P3, validators re-ran green); open: S10 (B4), S1 (A4); O5's stated outcome falsified (B1)
Spot check: bun test scripts/worktree-prune-guard.test.mjs → match (11 pass / 0 fail, reported "11 pass"; bun test scripts/worktree-guard.test.mjs → 16 pass, reported "16 pass")
Verdict: NEEDS-DECISION (B1, B2, B3, B4, B5, B6)
```

## Blockers

**B1 — the premise correction is false for trees inside `.git/worktrees/`, and
the change deleted the true warning.** `docs/fix/693-worktree-prune-guard/SPEC.md:93`
(and `SPEC.md:250` PE-001, `decisions.md:21` D2,
`scripts/worktree-prune-guard.mjs:28-31`, `AC5` at `SPEC.md:207`, `O5` at
`SPEC.md:267`, `AGENTS.md:411-419`, `docs/workflow/WORKTREES.md:14-19`).
Reproducer (scratch): a live worktree at `<repo>/.git/worktrees/fix/493-x` with
an uncommitted `precious.txt`, plus one vanished worktree under `.worktrees/`
(so the guard sees a real candidate), `git config aw.worktreePrunePolicy allow`,
then `bun scripts/worktree-prune-guard.mjs --repo <scratch>` → exit 0,
`verdict: PRUNED`, **`precious.txt` destroyed**. Plain `git worktree prune`
destroys the same fixture in three recipes (direct `worktree add` into the
container; temp+move with a container; temp+move without one), exit 0, no
warning — measured on git 2.47.3. So "a present tree … is untouched", "no
policy value — `allow` included — can turn it into a remover" and O5's
"survives a prune under every policy" are false in the layout the workflow's own
`IR8` exists for; the guard's candidate list (absent directories only) cannot see
the tree git takes down as collateral. Base-vs-head: the destruction reproduces
at base too (base `scripts/worktree-guard.mjs --prune` on the same fixture also
destroys the live tree — measured), but base *said* so: base `AGENTS.md:413`
("which `git worktree prune` deletes recursively with the working tree and its
uncommitted work inside it") and base `docs/workflow/WORKTREES.md:14-17`
carried the warning. Head deleted both and added five absolute claims of the
opposite — the claim/reality mismatch is new at head. Smallest action: restore
(or correctly scope to trees outside the admin namespace) the destruction
warning in `AGENTS.md` and `docs/workflow/WORKTREES.md`, and correct PE-001,
D2, AC5, O5 and the guard header to the measured scope.

**B2 — sibling sweep: the rewrite landed in two surfaces while seven siblings
kept the pre-change claim.** `AGENTS.md:133` (IR8 row, "destroys it silently") ·
`docs/workflow/WORKTREES.md:116-117` (same file the change edited, 100 lines
below the rewritten block) · `docs/workflow/GATE_INVENTORY.md:107` ·
`scripts/worktree-guard.mjs:24-26` (header of a file this change edited) ·
`scripts/worktree-guard.mjs:250-252, 258` (comment + `ADMIN_NAMESPACE` detail) ·
`scripts/worktree-guard.test.mjs:233` · `docs/ROADMAP.md:271` (#505 row, now
opposite to the new #693 row at `:231`). Reproducer: `rg -n "deletes the
container recursively|destroys it silently|destroys recursively"` over the tree
→ the seven hits above; every one asserts what B1's probes measured as true,
i.e. the rewritten surfaces (B1) are the false side of the contradiction. F51/F53
class. Smallest action: one coherent mechanism statement across all of them —
the same correction B1 names.

**B3 — policy `ask` hangs forever without a readable answer, contradicting the
guard's own refusal claim.** `scripts/worktree-prune-guard.mjs:14-15` ("Without
an interactive terminal it refuses rather than hang"), `decisions.md:29` D3
("refuses only when nothing can answer"), the test name at
`scripts/worktree-prune-guard.test.mjs:174`; mechanism at
`scripts/worktree-prune-guard.mjs:136-149` (`canPrompt()` only refuses on
`WORKTREE_PRUNE_GUARD_NO_TTY=1`; `reader.question` never resolves on EOF) and
`scripts/worktree-guard.mjs:346` (gate spawned on pipes, never a TTY).
Reproducers (scratch, policy `ask`, one vanished worktree): (a) `bun
scripts/worktree-prune-guard.mjs --repo <scratch> </dev/null` → prompt printed,
never exits (timeout 8 s → 124); stdin closed → 124; (b) `bun
scripts/worktree-guard.mjs --repo <scratch> --prune` → 124 non-interactively
**and** from a real PTY with `y` typed — the typed answer never reaches the
gate, so `worktree-guard --prune` under `ask` hangs unconditionally. The suite's
only "refusal" case sets the env var, so the writer's test cannot see this.
Base-vs-head: base `worktree-guard --prune` on the same fixture completes
(exit 0, measured); no prompt existed at base. Smallest action: resolve the
prompt on readline close/stdin end (refuse), and make `worktree-guard`'s gate
spawn pass an answer channel through or refuse when none exists; add a suite
case with EOF stdin and no env var.

**B4 — completeness: S10's only task validator does not re-run green.**
`docs/fix/693-worktree-prune-guard/SPEC.md:241` — P4 declares
`rg -c 'alias\.worktree|hooks/prune' AGENTS.md docs/workflow/WORKTREES.md`
exits 1; observed `docs/workflow/WORKTREES.md:1`, **exit 0** (the negated
mention `WORKTREES.md:25`, which `AC7`/`O7` require). S10 therefore resolves to
no green validator. (O7's own negation-aware validator exits 1 green, and
`gh pr view` → #699 OPEN, so only the declared validator is wrong.) Smallest
action: replace P4's validator with O7's negation-aware pipeline, one line.

**B5 — the "exact" S6/S7 texts are not what the guard prints.**
`scripts/worktree-prune-guard.mjs:165` vs `SPEC.md:52` (S6): delivered
`To remove a worktree manually: git worktree remove <path>`, S6 quotes
`… git worktree remove /path/to/worktree`; `scripts/worktree-prune-guard.mjs:143`
vs `SPEC.md:60` (S7): delivered `Prune 2 stale worktree(s)? [y/N]: `, S7 quotes
`Prune 2 stale worktrees? [y/N]: `. Reproducer: one deny run and one ask run
(observed verbatim above). The suite pins the delivered forms (`REMOVE_HINT`,
`worktree\(s\)`) and `AC2`/`AC3` were reworded to match the code, so the
writer's tests cannot see the deviation. Base-vs-head: neither string exists at
base; the "exact"-worded claims are head-only and unmet. Smallest action: print
the quoted strings, or stop calling them exact.

**B6 — `AC5`'s first clause (listing before the decision) fails.**
`scripts/worktree-prune-guard.mjs:32` ("Every candidate is listed before the
policy decision so the operator sees what the decision is about") vs
`:143`/`:184`/`:200`. Reproducer (PTY, policy `ask`, two candidates, answer
`y`): the prompt line is emitted first and the `PRUNE <path>` lines only after
the answer; under `allow` the `git worktree prune` at `:184` runs before any
candidate line is printed at `:200`. Only `deny` lists before the outcome.
Base-vs-head: no listing/prompt flow exists at base; the clause is head-only and
fails. Smallest action: emit the candidate lines (stderr) before prompting and
before delegating.

## Advisories

- **A1** `scripts/worktree-prune-guard.mjs:184-186, 204` — `AC4`/`O4` claim the
  delegate's exit status is returned unchanged, but a failing prune exits `1`
  regardless of git's status, and no failing case exists in the suite (O4's
  "exit-status passthrough assertion" covers status 0 only). Not a blocker:
  no realistic failing `git worktree prune` could be triggered — git itself
  exits **0** while printing `error: failed to delete … Permission denied`
  (measured).
- **A2** `scripts/worktree-prune-guard.mjs:190` — `verdict: PRUNED` is printed
  when nothing was pruned (0 candidates: measured `0 candidate(s) … verdict:
  PRUNED`), and when git silently failed. New output, misleading label.
- **A3** `scripts/worktree-prune-guard.mjs:200, 203` — the deny message is
  written to stdout *and* stderr (header documents stdout as header + `PRUNE`
  + verdict only), and under `--json` the refusal text is absent from the
  envelope (stderr only) while `AC2` says it is printed.
- **A4** `SPEC.md:33` — `S1` carries no `(Implements: S1)` task and no recorded
  disposition. It is the session's meta-request (recorded at L2) and the unit
  body fulfils it (PR #699 OPEN against `main`), so the need was not dropped.
- **A5** `AGENTS.md:414-418` contract-text qualifier check — lost: "the **six**
  ordered steps" → "the ordered steps" (`docs/workflow/WORKTREES.md` still has
  6, verified) and the trigger clause "read it before creating, moving or
  recovering a worktree". Prose-level losses; the prohibition, the `IR8` cite
  and "follow its steps in order" survive. The destruction qualifier is a lost
  qualifier on a **binding** rule and is therefore counted as B1, not here.
- **A6** `scripts/normative-drift.test.mjs` — 4 failures on head, **identical**
  on an untouched `git archive origin/main` copy (20 pass / 4 fail both runs):
  pre-existing, matching the unit's `## Known pre-existing issues`, not this
  change's.

## Obligations / commands re-run here

`bun test scripts/worktree-prune-guard.test.mjs` → 11 pass / 0 fail (O1–O5) ·
`bun test scripts/worktree-guard.test.mjs` → 16 pass / 0 fail (O6) ·
`rg -c '"worktree", "prune"' scripts/worktree-guard.mjs` → exit 1 (O6) ·
`rg -n 'alias…hooks/prune' … | rg -v 'never runs…'` → exit 1 (O7) ·
`rg -c 'worktreePrunePolicy' packages/` → exit 1 (O8 n/a) ·
`bun scripts/docs-generate.mjs --check` → PASS ·
`bun scripts/check-skill-context.mjs --documents` → PASS ·
`bun test scripts/findings-corpus.test.mjs` → 15 pass (the 1164→1165 corpus
bump is the unit's own F1 row; the assertion's meaning is unchanged) ·
red-first proven: the suite at `e66a0fc4f` with the module absent → 0 pass /
11 fail, and the implementation commit follows it · base/head `worktree-guard
--prune` differential under `aw.worktreePrunePolicy allow` → identical after
fixture-path normalization (L6's claim holds).
