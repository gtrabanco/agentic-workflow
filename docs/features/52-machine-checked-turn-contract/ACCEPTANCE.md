# Acceptance manifest v1 — 52-machine-checked-turn-contract

Status: frozen

Frozen 2026-09-16 by `plan-feature-scaffold` from the SPEC's acceptance
criteria AC1–AC14. One stable ID per SPEC criterion; validators copied from
the criteria. Modifying this manifest during execution requires a
user-approved SPEC amendment.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | `--help` exits 0 and prints usage naming both flags | `node packages/agentic-workflow/bin/turn-contract.mjs --help` → exit 0, usage names `--finished` and `--help` |
| AC2 | Engine suite green: clean feature branch (≥ 1 commit ahead of default, clean tree) → stdout exactly `TURN-CONTRACT ok`, exit 0; invocation from a subdirectory; no-tree-mutation assertion | `node --test packages/agentic-workflow/test/` → exit 0 |
| AC3 | Engine suite case: dirty tree in the fixture → stdout exactly `TURN-CONTRACT fail box5: dirty-tree`, exit 1 | `node --test packages/agentic-workflow/test/` (dirty-tree case) → exit 0 |
| AC4 | Engine suite cases: default branch → `TURN-CONTRACT fail box1: branch-default`, exit 1; not a git repo → `TURN-CONTRACT fail box1: not-a-repo`, exit 1; no own commits → `TURN-CONTRACT fail box3: no-commits`, exit 1 | `node --test packages/agentic-workflow/test/` (box1/box3 cases) → exit 0 |
| AC5 | Engine suite cases for box4: `--finished` with no open PR → `TURN-CONTRACT fail box4: pr-not-open`, exit 1; gh unreachable → `TURN-CONTRACT fail box4: pr-unreachable`, exit 1; PR head mismatch → `TURN-CONTRACT fail box4: pr-head-mismatch`, exit 1; stubbed open PR with head == local HEAD → box4 passes | `node --test packages/agentic-workflow/test/` (box4 cases) → exit 0 |
| AC6 | Unknown flag → usage on stderr, exit 2 | `node packages/agentic-workflow/bin/turn-contract.mjs --nope` → exit 2, usage on stderr |
| AC7 | Parity suite green: the same fixture-repo matrix through both engines asserts byte-identical stdout lines and exit codes | `node --test packages/agentic-workflow/test/` (parity file) → exit 0 |
| AC8 | Grammar conformance: both engines' outputs match the fenced `turn-contract-receipt@1` block in `TURN_CONTRACT.md`; the `CLAUDE.md` normative-surfaces row is present; normative-drift stays green | `node --test scripts/turn-contract-grammar.test.mjs` → exit 0; `node --test scripts/normative-drift.test.mjs` → exit 0 |
| AC9 | `TURN_CONTRACT.md` carries the machine-check profile: boxes 1–5 demonstrated by pasting the receipt; prose recitation of boxes 1–5 not required when the verifier ran; the fallback is stated; boxes 6–11 requirements unchanged | read-verified: the four profile clauses checked against `skills/orchestration-envelope/references/TURN_CONTRACT.md` |
| AC10 | Sensor suite passes; the envelope carries the `next` fields and the profile's echo rule maps the `→ Next:` block from `next.recommended` + `next.alternatives` | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0; read-verified: echo rule in `TURN_CONTRACT.md` maps both fields |
| AC11 | Context budgets pass; pi mirror byte-identical | `bun scripts/check-skill-context.mjs` → exit 0; `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0 |
| AC12 | The shim needs only bash + git + gh — no node/bun/npm/npx token in the file | `grep -nE 'node\|bun\|npm\|npx' template/.agentic-workflow/hooks/turn-contract.sh` → no matches |
| AC13 | Hook test passes (house bash-test pattern) | `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` → exit 0 |
| AC14 | `ORCHESTRATION.md` and `FEATURE_WORKFLOW.md` each carry exactly one pointer to the machine profile; the grammar is restated nowhere else | read-verified: one pointer per file; `grep -rn "TURN-CONTRACT ok" docs/ skills/ --include="*.md"` → only `TURN_CONTRACT.md` (+ this unit's own records) |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The receipt grammar is the behavioral contract: an engine output that diverges from the fenced block is an engine defect, never a grammar edit.
- The verifier stays read-only: any suite that observes a tree/index/config mutation is a defect, never a fixture artifact.

## Commands

- `node packages/agentic-workflow/bin/turn-contract.mjs [--finished|--help]` (bun-first convention: `bun packages/agentic-workflow/bin/turn-contract.mjs …`)
- `node --test packages/agentic-workflow/test/`
- `node --test scripts/turn-contract-grammar.test.mjs`
- `node --test scripts/normative-drift.test.mjs`
- `node --test scripts/workflow-status-sensor.test.mjs`
- `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh`
- `bash template/.agentic-workflow/hooks/turn-contract.sh [--finished|--help]`
- `bun scripts/check-skill-context.mjs`
- `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
- `npm run bundle:skills` (in `packages/pi-agentic-workflow`)
