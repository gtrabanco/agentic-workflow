# Obligations — fix/356-test-targeting

> One row per normative behaviour, compatibility invariant, affected use case and
> required failure state. Frozen at cut except `status`. Every row flips to
> `verified` only after its validator ran in the foreground; the run is recorded
> in the unit doc's `## Log` (`E`/`G` lines) and summarised in the last cell.

## Ledger

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1, S7 (acceptance box 1) | a change whose paths are all prose (docs, `README.md`, a changeset note) yields an **empty** impact set: the verdict says so, it lists no suite, it invents no test — and the phase records the verdict instead of running the ceremony | P3 | P2, P3 | `scripts/test-impact.mjs` | `bun test scripts/test-impact.test.mjs` exits 0 with the docs-only case passing and `verdict: empty` / `suites (0)` in its captured block | the case name and its captured block, in the Log | planned |
| O2 | S2, S8 | the guide states the rule with its targeting half — a non-empty set derives its tests, an empty set records the verdict — and the verdict block is declared a normative surface with a fixed grammar | P4 | P4 | `AGENTS.md` | `rg -c 'test impact' AGENTS.md` matches at least 2, and `bun scripts/normative-drift.test.mjs` exits 0 with the `test-impact-verdict` row resolving `fenced:TEST IMPACT —` | both outputs, in the Log | planned |
| O3 | S3, S7 (acceptance box 2) | a code change surfaces the test files it can affect and **excludes** the unrelated ones — the set discriminates instead of answering "everything" | P3 | P2, P3 | `scripts/test-impact.mjs` | `bun test scripts/test-impact.test.mjs` exits 0 with the two-implementation fixture case passing (target suite listed, unrelated suite absent) | the case name, in the Log | planned |
| O4 | S3 | the executor's contract names the derived set as the source of the RED run's test names, so the failing-first evidence carries real test names | P4 | P2, P4 | `skills/execute-phase/references/TEST_IMPACT.md` + `skills/execute-phase/SKILL.md` | `rg -c 'targeted' skills/execute-phase/references/TEST_IMPACT.md skills/execute-phase/SKILL.md` matches at least 1 per file, and `bun scripts/check-skill-context.mjs` exits 0 | both counts and the budget run, in the Log | planned |
| O5 | S4, S7 (acceptance box 3) | with `rg` absent the hint degrades to `grep`, prints a `fallback:` line saying so, and returns the **same** suite set — a degraded tier never changes the answer | P3 | P2, P3 | `scripts/test-impact.mjs` | `bun test scripts/test-impact.test.mjs` exits 0 with the rg-absent case passing (`tier: grep`, the `fallback:` line present, the set equal to the `rg` run's) | the case name and the two blocks, in the Log | planned |
| O6 | S4 | the preferred tier is an input, never a client: `--references <file>` joins the LSP-resolved test files and states `tier: lsp`; an entry that does not exist is refused | P3 | P2, P3 | `scripts/test-impact.mjs` | `bun test scripts/test-impact.test.mjs` exits 0 with the lsp-input case and the missing-reference refusal case passing | the two case names, in the Log | planned |
| O7 | S4, S1 | the hint fails closed rather than wide: no path in scope, no matcher installed, and an unknown flag each exit 1 with a block naming the reason — never `verdict: empty` because it could not look | P3 | P2, P3 | `scripts/test-impact.mjs` | `bun test scripts/test-impact.test.mjs` exits 0 with the no-input, no-matcher and usage-error cases passing (each asserting exit 1) | the three case names, in the Log | planned |
| O8 | S5 | `verification-contract` states which layer runs which tests and that an empty impact set is a recorded verdict, not a missing receipt | P4 | P4 | `skills/verification-contract/SKILL.md` | `rg -c 'test impact' skills/verification-contract/SKILL.md` matches at least 1 | the count, in the Log | planned |
| O9 | S7 (acceptance box 4) | the deterministic gates stay green: the guide layer and every route inside its ceiling, the root suites, the route planner's own suite, and the changeset linter | P4, P5 | P4, P5 | repo | `bun scripts/check-skill-context.mjs` exits 0, `bun scripts/check-skill-context.mjs --routes` exits 0, `bun scripts/run-root-suite.mjs` exits 0 and `bun scripts/lint-changeset.mjs` exits 0 | the four runs, in the Log | planned |
| O10 | S6 | nothing outside the declared scope moves: no dependency, no lockfile change, no new graph infrastructure, and both package manifests untouched | P5 | P5 | repo | `git diff --stat c8b64d0b -- package.json packages/agentic-workflow/package.json packages/pi-agentic-workflow/package.json bun.lock` prints no file under the diff summary line | the command's empty output, in the Log | planned |
| O11 | S7 (acceptance box 2), S1 | the unit's own phase order runs the rule it ships: the fixture corpus commits first and observed failing, the implementation after it observed green, so the RED evidence names the targeted suite by name | P2 | P2, P3 | git history | `git log --diff-filter=A --format=%h -- scripts/test-impact.test.mjs scripts/test-impact.mjs` lists two distinct commits with the suite's first | the two SHAs, in the Log | planned |

## Verification

Every row flips to `verified` in the hand-off turn, with the run recorded as an
`E`/`G` line in the unit doc's `## Log` and the summary in the last cell above.
Rows still `planned` at hand-off block it.
