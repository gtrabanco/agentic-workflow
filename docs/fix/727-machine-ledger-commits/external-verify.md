# 727 — machine-ledger-commits · external verification receipts

One dated `EXTERNAL VERIFY` block per run, verbatim as the verifier handed it
back. The latest block's head is the delta anchor the next verification reads.

- 2026-11-26 — first full verification (no prior receipt existed), head at
  `3979cb777`. **Owner verdict order after it: the S9 correction directive.**
  The correction batch is recorded in `SPEC.md`'s `## Log` and
  `planning-obligations.md` (O16–O21); this file stays pure receipts.

```
EXTERNAL VERIFY — base: 022769f8be96b441ec11ffede7ed85e2490e3997 · head: 3979cb7775c1a8edd55ddb8acdc09d9a6a722463
Blockers: 0
Advisories: 2
  1. scripts/unit-cycle.mjs:150 — the lane cycle's dirty-tree stop has no machine-ledger
     exemption; a pending auto-zone row (e.g. TIER_COST.md appended by a gate annotator
     mid-lane) stops the cycle where box 5 would now pass it. Not change-caused: unit-cycle
     refused any dirt identically at base (stability check held), and the change's declared
     exemption scope is review box 5 only — the surface is absent from the unit's Impact
     list. Smallest action: decide whether the policy class applies here too → route to
     /aw-local-apply or file as wontfix.
  2. P8's Relevant-files lists docs/workflow/CLI.md, which the diff never touches —
     the CLI rows covered by "the command is in the CLI surface" live in
     packages/agentic-workflow/README.md and src/runner/help.mjs (both updated). A stale
     planning-artifact row only; the parity suite and the crate README pin the real surface.
Sibling sweep: clean — `needs-triage` appears only in its owner surfaces (templates apply it at
  filing; LABELS.md defines the exit; no permanence claim survives anywhere), `TIER_COST.md`
  mentions all cite the ledger, and every `dirty-tree` text now carries the exemption where
  the policy declares it. No surviving old-truth mention.
Completeness: S1–S8 all resolved — S1 (P1 verify ok:true, O1 rg clean), S2 (P6, 5/0), S3 (P4,
  10/0), S4 (P7, 65/0), S5 (P5, 37/0), S6 (P8, 8/0), S7 (P8, 8/0), S8 (P2 red commit
  2dcebf5cb precedes 745efb153/131b4f773/6ae9352ad; red-first.mjs 0 findings). Obligations
  O1–O15 all reproduce green here. ac-hash recomputed = a6819e1c… ✓; docs-generate --check
  PASS; check-skill-context --documents 7 PASS / --routes 14 PASS.
Spot check: bun test packages/agentic-workflow/test/machine-ledger-commit.test.mjs → 10 pass/0 fail
  = reported E2 verbatim (E5 65/0 and E6 8/0 also matched). Reports are trusted.
Own probes (all in scratch, never the live tree):
  - telemetry commit --dry-run: white envelope `would-commit`, zero writes; --class telemetry
    commits only docs/workflow/TIER_COST.md under `chore(telemetry): machine ledger rows`;
    a foreign staged+worktree-modified file survives untouched (the #182 hazard, held);
    unknown class refused exit 2; clean class creates no commit (rev-list count unchanged).
  - turn-contract base-vs-head: pending TIER_COST row → base fail box5:dirty-tree, head ok;
    foreign ordinary-file dirty → both fail; both-dirty → both fail. Exemption exact.
  - local-gate prelude end-to-end in scratch clone at head: commits the ledger alone before
    anything runs, exit 0, `--only` selection works, `--dry-run` plans it and writes nothing.
Verdict: VERIFIED
```
