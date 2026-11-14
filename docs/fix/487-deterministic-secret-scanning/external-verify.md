# External verify — fix/487-deterministic-secret-scanning

Full verdict (no prior receipt existed for this unit), dated 2026-11-14. Base
`origin/main` = merge-base; head = the branch tip. Read-only run: no commit, no
push, no branch, no forge call; the only file written is this receipt.

```text
EXTERNAL VERIFY — base: f7e5dbbab56a28ade9c4c17d3f5b52a1ffe0fafb · head: a73a33a4eaba820f08f94851cbcca806924fe4a2
Blockers: 1 — scripts/secret-scan.mjs:115 (`ASSIGNMENT`, consumed at :257): an unquoted credential assignment is never a finding. Reproducer (mktemp scratch, removed after): seed commit, then `API_TOKEN=<mixed 32-hex payload>` committed to `.env` (any high-entropy mixed payload reproduces it), `node scripts/secret-scan.mjs --root <scratch> --base <seed>` → exit 0 · `secret-scan: 0 finding(s)` · `verdict: PASS`; the same payload quoted (`API_TOKEN="…"`) → exit 1 · `FINDING .env:1 — credential-assignment`. Base-vs-head: `git cat-file -e f7e5dbba:scripts/secret-scan.mjs` → fatal, the capability is new so the miss is change-caused; S1/AC1 claim "a secret-shaped value added anywhere in the push range's tracked text paths is a finding" over "credential shapes with high-entropy payloads", and the canonical dotenv/ini/YAML/docs-example form the issue names as the leak path (`API_TOKEN=<32 hex>`, `password: <payload>`, `export AWS_SECRET_ACCESS_KEY=…`) passes green while the quoted twin of the same payload fails. Smallest action: make the quote optional in `ASSIGNMENT` and keep the existing `payloadFault` floor, adding one unquoted positive case — or declare the quote bound in the SPEC if it is deliberate; route to /aw-local-apply.
Advisories: 5 — (1) scripts/secret-scan.mjs:383 `resolveRange`: when HEAD already equals `@{upstream}` the default range is empty — `secret-scan — 0 added line(s) scanned · verdict: PASS` in any synced checkout, reproduced in a plain `git clone` of this branch (untracking the upstream makes the same run scan 1,664 lines); the push path is unaffected (the remote-tracking ref is stale during a push, and a first push resolves `origin/main`), the zero is disclosed on the report line and no stated claim is falsified, but a local-gate run between pushes (and a CI run if checkout configures tracking — not verified here, dispatching CI is a forge mutation) judges nothing; smallest action: skip a candidate whose merge-base equals HEAD and continue to `origin/main`, else the tree. (2) scripts/secret-scan.mjs:524/:542 — `--all --base <rev>` drops the explicit `--base` and exits as if it were given; the chosen mode is disclosed on the report line (`whole tree at HEAD`) and `--all` is documented as "not a range", so it is contradictory input rather than a silent pass; a usage refusal (exit 2, as `--jobs 0` does) would match the fail-closed convention. (3) scripts/secret-scan.mjs:357 — a tracked file that cannot be read is counted in `skipped` and labelled "binary skipped", and tree-mode `scanned` counts files it never read (`1,977 tracked file(s) scanned · 18 binary skipped`); the tree-level fail-closed contract (exit 2 on an unreadable tree) holds, so this is a label/attribution gap only. (4) skills/batch-scheduler/references/PLAN.md:133 — the live skill example still carries the pre-change intake slug `fix/487-secret-scan-gate` for #487, whose roadmap row this change rewrote to `deterministic-secret-scanning`; present at base, illustrative JSON, asserts no status. (5) docs/fix/487-deterministic-secret-scanning/SPEC.md:308,:311 — the repo's `verify` sensor refuses this unit doc (`VERIFY REFUSAL — 2 violation(s) · receipt-malformed-head: receipt line without a HEAD sha` on G3 and G4, exit 2); the same class fires on 186 of 202 unit docs at this head, including untouched ones, so it is base-present steady state rather than change-caused; smallest action: give G3/G4 a `HEAD <40-hex>` citation.
Sibling sweep: clean on live surfaces — every old-truth mention is quoted or dated history (the SPEC's verbatim issue quote at :267, this unit's dated P9 note, `docs/LOGS.md:6593` and `docs/research/2026-11-12…/README.md:108`, both pre-existing and outside this branch's diff) or a synthetic fixture (`scripts/batch-scheduler.test.mjs:1595`); the survivors worth naming are advisory 4 (PLAN.md:133) only. Both step-id pin suites, the GATE_INVENTORY row, the `machineLines` 70 → 71 re-pin and the generated projection carry the new step with no stale count, no stale slug and no surface still asserting that nothing scans the push range.
Completeness: S1–S12 resolved — P1 `unit-route --triage` exit 0; P2 red reproduced at 60dfe5c0 (`node --test scripts/secret-scan.test.mjs` → exit 1, `ERR_MODULE_NOT_FOUND`); P3 25 pass/0 fail; P4 75 pass/0 fail; P5 23 pass/0 fail + `check-skill-context --documents` PASS (166/71/95/6,218); P6 `docs-generate --check` PASS + `version-parity-gate --content` PASS; P7 `run-root-suite` exit 0 (113 PASS); P8's fragment present in the diff (`session-close close` not executed — mutating; its read-only substitutes, `journal-carrier-check` and `log-immutability`, PASS in the gate run). Obligations O1–O15 all `verified`, every stated validator re-ran green here. open ids: none.
Spot check: `node scripts/run-root-suite.mjs` → match (exit 0 · `root gate: 113 suite(s) · 4 worker(s)` · 113 PASS, equal to the reported E11/G2 output).
Verdict: NEEDS-DECISION (1)
```

## 2026-11-14 — correction batch applied (owner-directed), receipt appended

Owner order, verbatim (logged at L4): "Apply to this repository: triage and fix
those that deserve to fix but understand the context before fix and check you
haven't broke another different thing, if you have done, start the loop again
until you fixed full symbol/related stuff".

- **Blocker 1 folded** — red corpus alone at `8c067ab6` (25 pass / 4 fail,
  exit 1, scratch clone) → rule at `79264b34` (bare payloads, identifier-tail
  key names) → the false positive that widening opened answered at the rule at
  `d0b5fa8f` (path-shaped payload refused; allowlist back to its single shipped
  entry, D6). Green: `secret-scan` 30/0, `local-gate`+`release-workflows` 75/0,
  whole-tree PASS, branch range PASS.
- **Advisories 1–4 folded** — `79264b34` (in-sync range fall-through, D7;
  `--all`+`--base` mutual exclusion; binary/unreadable split) and `a24e6c48`
  (PLAN.md slug, changeset wording). Verified at E19/E20/E21.
- **Advisory 5 dispositioned, not folded** — the G3/G4 `verify` citations are
  recorded in the unit log (F6) instead of edited into the lines, because
  `log-kind@1` forbids editing an earlier line; the refusal is base-present
  (186 of 202 unit docs at this head) and stays disclosed.
- **Loop-1 regression disclosed (E17)** — the widened boundary flagged
  `scripts/golden-fixture.test.mjs:203`, and the allowlist entry shipped to
  answer it failed the gate fixture sandbox's clean-tree case (74 pass / 1
  fail). The answer moved to the rule; the sandbox case is green again (75/0).

This receipt is now the delta anchor: the next verification re-checks the six
findings above, the E17 regression, and the re-run of O2/O4/O10/O15.
- **Loop-2 (S3/S4) folded too** — the batch's own docs commit introduced three
  regressions, all caught by re-running the declared checks and folded at
  `d3f1c4ee` (pi package declared for the `skills/` edit; `batch-scheduler`'s
  reference ceiling re-based to ceil(2201 × 1.10) = 2422 with the growth source
  named; this receipt's literal reproducer made a placeholder because the fixed
  rule now flags it). Evidence at E22; full recheck at G5 (root suite 113/113,
  gate set PASS, scans PASS).
