# 704 — prose-conditions-stall · external verification

```text
external-verify@1
EXTERNAL VERIFY — base: 15bcab21c4100f96c624bbffd4486cd0d521f969 · head: ff6fe658f8ceea094cbc1733e449350189900c01
date: 2026-12-24 (full verdict, once — no prior EXTERNAL VERIFY existed for this unit)
Blockers: 0
Advisories: 3
  1. SPEC.md ## Log G1 vs commit 80e1d7f93 — evidence precision. G1 states "the only
     delta after this head [5b33cdd2e] is this document's own evidence append", but that
     commit also added `scripts/vocabulary-parity.test.mjs` (+36, three #704 parity cases)
     and the `content-guard-discipline.test.mjs` EXEMPT row (+4) under a `docs(704)` type,
     i.e. after the last pinned gate run. Both additions re-ran green at head in this
     verification (vocabulary-parity + content-guard 46/0; both are additive cases, no
     existing assertion weakened), so nothing ships untested — the sentence and the commit
     type are the defect. Smallest action: amend the delta sentence to name the two
     test-file changes; the recorded runs above can stand as their green receipt.
  2. scripts/red-first.test.mjs "the shipped repository's history passes the gate (O4)"
     exceeds bun's 5s per-test default when the suite is invoked bare (`bun test
     scripts/red-first.test.mjs` → 1 fail at 5.01s; 9/0 with `--timeout 60000`). Not
     change-caused: allowlisted in scripts/test-timeout-allowlist.json as pre-existing at
     f349d7b5 (before this unit), the walk's cost grows with every landed unit. Advisory.
  3. The sweep's roadmap corpus is fail-closed on its absence: in a tree without
     docs/ROADMAP.md's `## Fixes` table the block prints `DEGRADED
     unavailable-roadmap-index-absent` and the verdict is UNRESOLVED (exit 1) — observed
     directly in this verification's probes. Declared behavior (never an empty corpus read
     as truth), and this repository always carries the table, but a target project without
     it gets a perpetually-red scheduled workflow. known-issues.md has no row for this
     specific degradation; a KI row naming it is the smallest action. Advisory.
Sibling sweep: clean — every `delivery-conditions`/`delivery-condition` mention tree-wide
  belongs to a surface the unit declared or its pinned tests; the one candidate outside
  them (skills/init-workspace/references/BOOTSTRAP_WRITE.md "covered by #498") is
  unrelated prose. No surviving old-truth assertion; no contract-text qualifier lost — the
  AGENTS.md/RUNNER.md/ISSUE_PROCESS.md/README changes are additive rows, and the ROADMAP
  row rewrite is the sanctioned `roadmap fixrow` settle.
Completeness: S1–S9 all resolved (P1–P9, each with an (Implements:) validator re-run green
  here; S7 row 5 answered by decisions.md D5 as AC7 requires; S8 proven by the diff stat —
  no migration, no reopen, no #441; S9 no prose-scanning gate added). All 20 obligation
  rows re-verified green at head.
Spot check: bun test scripts/delivery-conditions.test.mjs → 20 pass / 0 fail — match with
  SPEC ## Log E2 (20 pass, 0 fail).
Independent probes (own derivation, not the shipped suite — offline `--issues-file`
  fixtures in mktemp scratch, removed; no live-tree run, no forge call): open cover
  refused `covered-by-open` exit 1 naming the blocked-by route (S4); delivered cover
  exit 0 (S4); #301 Spanish comment carrier → `condition-stalled` (S2); all five families
  extracted (S5); uncarried → ADVISORY, never silent (O6); unknown citation → unjudged,
  UNRESOLVED exit 1; lookbehind blocks "uncovered by"; "proceed with" is not
  "proceeds when"; clause scope does not cross a sentence end; two runs over one corpus
  print identical bytes (O13); `help delivery-conditions` prints the registry block
  (exit 0); usage/missing-cache/unknown-flag → exit 2 never 127 (O18, AC1).
Declared validators re-run here: scripts/delivery-conditions 20/0 · schema package 953/0 ·
  crate package 83 suites PASS · normative-drift 24/0 · prose-gate-inventory 22/0 ·
  vocabulary-parity + content-guard-discipline 46/0 · test-obligation-tags +
  red-first included. The `bun scripts/local-gate.mjs` receipt stands at 5b33cdd2e (G1);
  the post-G1 delta is documentation plus advisory 1's two additive test blocks.
Verdict: VERIFIED
```
