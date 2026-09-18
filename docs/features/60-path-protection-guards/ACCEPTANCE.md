# Acceptance manifest v1 — 60-path-protection-guards

Status: frozen

Frozen 2026-09-18 by `plan-feature-scaffold` from the SPEC's acceptance criteria
AC1…AC10. One stable ID per SPEC criterion; validators copied from the criteria.
The manifest is the implementation/review finish line, not a second
specification; the executor may strengthen coverage but never move it. A
validator must never gate on a surface another workflow actor mutates, so the
rows below read the unit's own files and its own suites.

| ID | Required outcome | Validator |
|---|---|---|
| AC-01 | Policy matrix fixtures green over the phase × path-class matrix, including create/modify/delete/rename rows for the `tests/**`, `e2e/**`, `*.test.*`, `fixtures/**` families and the policy config itself | `node --test packages/agentic-workflow` → exit 0 with the freeze × class × operation matrix cases green |
| AC-02 | Tier 1 gate: on a dirty protected path without a justification record the gate exits non-zero with a closed reason; with a justification (plus, post-freeze, a recorded approval) it exits 0 and the approval is verified against the changed paths | `node --test scripts/path-protection.test.mjs` → exit 0 including the pass/fail exit-code and closed-reason pins |
| AC-03 | Config fallback: with the config absent or malformed the gate applies the shipped defaults and emits a degradation report; zero-config behaviour is asserted by a fixture with no project config present | `node --test packages/agentic-workflow` → exit 0 including the `missing-config` and `malformed-config` fallback cases |
| AC-04 | Tier 2 prevention: the pi extension unit test proves an edit/write tool call against a frozen test file returns `{ block: true, reason }` with the reason naming the escape path; read-only tool calls are unaffected | `cd packages/pi-agentic-workflow && bun run test` → exit 0 including the block, reason, and read-passthrough cases |
| AC-05 | Escape hatch: a post-freeze protected change with a justification but no recorded owner approval fails the gate; adding the recorded approval makes the identical diff pass; no code path grants approval automatically | `node --test packages/agentic-workflow` → exit 0 including the `approval-required` and no-auto-approval negative cases |
| AC-06 | Creation ≠ modification: matrix fixtures prove pre-freeze test authoring (create) passes without a marker while modify/delete of already committed test files requires one | `node --test packages/agentic-workflow` → exit 0 including the create-versus-modify cases |
| AC-07 | No hardcoded project globs: `grep -nE 'tests/\*\*|e2e/\*\*'` over `skills/` returns no project-specific policy data inline; skills reference the policy mechanism only | `grep -nE 'tests/\*\*\|e2e/\*\*' skills/` → no output |
| AC-08 | Checkpoint wiring: the `execute-phase` preflight proves the Tier 1 gate runs at the phase fingerprint checkpoint and a gate fail blocks the phase | read-verified: the path-protection step text quoted in the phase handoff; command-verified by AC-02's gate suite |
| AC-09 | Template mirror: the shipped policy default and its doc page exist under `template/.agentic-workflow/` and the hooks README documents the guard | `test -f template/.agentic-workflow/path-policy.json && test -f template/.agentic-workflow/path-protection.md && grep -q 'path-protection' template/.agentic-workflow/hooks/README.md` → exit 0 |
| AC-10 | Tighten-only pi override: the pi extension unit test proves the effective policy is the shipped defaults intersected with any pi settings override — a tightening override is honored, a loosening override is rejected with the shipped protection still in force and the degradation report emitted | `cd packages/pi-agentic-workflow && bun run test` → exit 0 including the tighten-honored, loosen-rejected, and shipped-default-parity cases |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review
  and named manual checks remain required.

## Commands

- `node --test packages/agentic-workflow`
- `node --test scripts/path-protection.test.mjs`
- `cd packages/pi-agentic-workflow && bun run test`
- `grep -nE 'tests/\*\*|e2e/\*\*' skills/`
- `test -f template/.agentic-workflow/path-policy.json && test -f template/.agentic-workflow/path-protection.md && grep -q 'path-protection' template/.agentic-workflow/hooks/README.md`
