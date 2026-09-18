# testing — 60-path-protection-guards

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Policy model + evaluator (P1) | the `path-protection-policy@1` model parses, the shipped defaults resolve, `resolvePathPolicy` unions globs and takes the requirement maximum, and the two gap parsers fail closed | `bun test packages/agentic-workflow/test/` → exit 0 (Node 24 fallback: `node --test packages/agentic-workflow/test/*.test.mjs` → exit 0) |
| Tier 1 gate (P1) | the freeze × class × operation matrix (create / modify / delete / rename for the tests, e2e, test-file, fixtures, and policy-config classes), creation-versus-modification, justification / approval / unmatched-record / malformed-declaration, shipped-default fallback + degradation, the empty-diff / two-runs / committed-range pins, and the CLI exit codes with the fixed block | `bun test packages/agentic-workflow/test/ && node --test scripts/path-protection.test.mjs` → exit 0 (Node 24 fallback: `node --test packages/agentic-workflow/test/*.test.mjs && node --test scripts/path-protection.test.mjs` → exit 0) |
| Template ship (P2) | the template seed is byte-identical to the crate's `serializeShippedPolicy()` output; the doc page exists; the hooks README documents the guard; both `init-workspace` references seed it | `diff <(node -e "import('./packages/agentic-workflow/src/path-policy.mjs').then(m=>process.stdout.write(m.serializeShippedPolicy()))") template/.agentic-workflow/path-policy.json` → empty; `grep -c 'path-policy' skills/init-workspace/references/*.md` → at least 2 |
| Checkpoint contract (P3) | the `path-protection@1` grammar block resolves, the `path-protection` rejection type is in the closed vocabulary, and the `path-protection-contract` normative row is declared | `node --test scripts/normative-drift.test.mjs` → exit 0 |
| Budgets (P3) | every touched skill re-based via the declared `ceil(measured × 1.10)` rule with the growth source named | `node scripts/check-skill-context.mjs` → exit 0 |
| No project globs in skills (P3) | skills reference the mechanism, never project paths | `grep -nE 'tests/\*\*\|e2e/\*\*' skills/` → no output |
| Tier 2 pi guard (P4) | block/reason on an existing protected path, read passthrough, create passthrough, tighten honored, loosen rejected, cross-package default parity | `cd packages/pi-agentic-workflow && bun run test` → exit 0 |
| Qualification (P5) | the whole ladder green, the pi mirror byte-identical, the acceptance blob unchanged | `node --test scripts/*.test.mjs` + `bun test packages/agentic-workflow/test/` + the pi suite → exit 0; parity green |

## Mandatory scenario inventory

Each dev scenario from the SPEC resolves to the named phase's pins:

- **path-guard:empty-diff** — a clean tree yields `pass — clean`, exit 0 (P1).
- **path-guard:malformed-config** — an invalid policy yields the shipped
  defaults plus the `DEGRADED — malformed-config` line, exit 0 on a clean diff
  (P1).
- **path-guard:missing-approval** — a post-freeze modification with a
  justification only yields `fail — approval-required`, exit 1 (P1).
- **path-guard:unmatched-record** — an orphan record yields
  `fail — unmatched-record`, exit 1 (P1).
- **path-guard:freeze-boundary** — the phase ordinal at and one past
  `freeze-after` flips the requirement (P1).
- **path-guard:two-runs** — two consecutive runs produce byte-identical blocks
  with the tree unchanged (P1).
- **path-guard:committed-range** — a phase that committed a protected
  modification without a record is caught at the next checkpoint
  (`path-guard --phase P1 --base <pre-P1-ref>`) with
  `fail — protected-modification`, exit 1 (P1).
- **pi:read-passthrough** — a `read` call against a protected path is not
  blocked (P4).
- **pi:create-passthrough** — a `write` to a new protected file is not blocked
  (P4).

## Tooling

- bun-else-node runtime (repo convention, node-compat CI).
- Throwaway git fixture units per the existing
  `scripts/continuation-discipline.test.mjs` harness pattern; no network, no
  forge call in any suite.
- The gate CLI is the only spawn point (`git status` / `git diff`); the engine
  suite calls the pure evaluator directly.

## Execution evidence

`<recorded phase by phase at execution — see the unit progress log>`
