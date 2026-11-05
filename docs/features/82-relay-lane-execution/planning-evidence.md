# Planning evidence — unit 82 (relay-lane-execution)

M/L unit: this file is the planning-evidence ledger (sizing rule,
`skills/unit-lane/references/PLAN.md`). Row shape and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md` §1; ids are stable
(`PE-nnn`) and renumbering is a replan.

Evidence was read from the shipped pi-web Relay package and this repository's
own code, never from prose restatements. The package path is the operator's
installed copy (`@jmfederico/pi-web`), which is not vendored here — every row
that cites it says so, and the assertions the unit depends on are re-stated as
this repository's own tests where a test is possible.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | pi-web validates a packet on disk: exactly `charter.md`, `status.md`, `log.md`, each a non-empty UTF-8 regular file ≤ 262,144 bytes, resolved through `realpath` and jailed inside the target workspace | repository (pi-web package) | `@jmfederico/pi-web` `dist/pi-packages/relays/relayDispatch.js:6-22,47-70` | installed copy, read 2026-11-05 | O4, O5, O19 | current | proven | — |
| PE-002 | `dispatch_relay(packet, leg, cwd?, model?, thinkingLevel?)` accepts a per-leg `model` and `thinkingLevel`; `leg` is a **string** matching `^[a-zA-Z0-9][a-zA-Z0-9._-]{0,31}$`; a relative `packet` resolves inside `cwd`; both overrides are omitted when the human did not instruct otherwise | repository (pi-web package) | `.../relays/extensions/index.js:6-31`; `.../relays/relayIdentity.js:24-30`; `.../relays/skills/relay-runner/SKILL.md` §Preparation and dispatch | installed copy, read 2026-11-05 | O2, O10, O11 | current | proven | — |
| PE-003 | The packet is `charter.md` (goal) + `status.md` (baton: state, last/next leg, location, progress, gaps, checks, review state, pointers, blockers) + `log.md` (history), with `decisions.md` optional; the state vocabulary is `Draft — awaiting approval`, `Active`, `Complete`, `Needs help` | repository (pi-web package) | `.../relays/skills/relay-runner/SKILL.md` §Packet | installed copy, read 2026-11-05 | O1, O3, O9 | current | proven | — |
| PE-004 | A host without the session-dispatch bridge throws before dispatching: `Relay dispatch requires PI WEB's session dispatch bridge. Update PI WEB and restart the session daemon when safe; no session was dispatched.` | repository (pi-web package) | `.../relays/extensions/index.js:59` | installed copy, read 2026-11-05 | O14 | current | proven | — |
| PE-005 | `.pi-web/` is gitignored here, so a packet never enters a delivery commit | repository | `.gitignore` (first block, `.pi-web/`) | `main` @ caee2502 | O16 | current | proven | — |
| PE-006 | `scripts/catalog.json` is the single `budget_tier` source and `--triage` already prints per-step tiers (#291 AC4), but **nothing selects a model from it**: no consumer of `budget_tier` outside `unit-route.mjs`/`catalog.test.mjs` exists | repository | `scripts/unit-route.mjs:664-684`; `scripts/catalog.json`; `rg -l 'budget_tier'` → catalog, router, test | `main` @ caee2502 | O2, O8 | current | proven | — |
| PE-007 | The `REVIEW-VERDICT` output contract is owned by `skills/unit-lane/references/REVIEW.md` §Fixed output contract (`REVIEW-VERDICT: PASS \| FAIL` + three `-` lines) and no script parses it today | repository | `skills/unit-lane/references/REVIEW.md`; `rg -l 'REVIEW-VERDICT' scripts/` → only `scripts/lane-era-lineage.test.mjs` (a mention pin) | `main` @ caee2502 | O11, O12 | current | proven | — |
| PE-008 | A new `references/*.md` must be linked from its `SKILL.md` (else `unreachable reference`), must start with a heading, and re-bases every route that loads it; budgets are owned by `docs/workflow/SKILL_CONTEXT_BUDGETS.json` | repository | `scripts/check-skill-context.mjs:286-310,350-410`; manifest `defaults`/`routes` | `main` @ caee2502 | O7, O18 | current | proven | — |
| PE-009 | `PI_WEB_SESSION=1` is inherited by every process spawned inside a PI WEB session, including the bash tool and subsessions — the only deterministic, offline-readable pi-web presence marker | environment (this session's contract) | PI WEB session environment addendum (`PI_WEB_SESSION`, `PI_WEB_SESSIOND_SOCKET`, `PI_WEB_DATA_DIR`) | observed 2026-11-05 | O1, O14 | current | proven | — |
| PE-010 | A new `scripts/<x>.mjs` + suite must land as a red commit and then a green one; `scripts/red-first.mjs` enforces the ordering for pairs introduced after its own cutoff | repository | `scripts/red-first.mjs:1-30`; `AGENTS.md` §Working rules (new script ships its sibling suite) | `main` @ caee2502 | O19, P2, P3 | current | proven | — |
| PE-011 | Any `skills/**` change must bump the Pi package version or ship a valid `.changeset/*.md`, plus a CHANGELOG companion row, or the content gate is red | repository | `scripts/version-parity-gate.mjs:1-60`; `AGENTS.md` §Packages | `main` @ caee2502 | O18, P6 | current | proven | — |
| PE-012 | No `.es.md` sibling exists and none may be created: bilingualism is retired permanently (owner decision 2026-10-27, issue #232) | user | `AGENTS.md` §Working rules (English-only, permanent); `find . -name '*.es.md'` → 0 | `main` @ caee2502 | O18 | current | proven | — |
| PE-013 | The router cannot probe `dispatch_relay` availability: the tool belongs to the model's session, not to this process. The only honest deterministic signals are the pi-web session marker (PE-009) and the packet's own on-disk state, and the per-phase `/execute-phase <NN> P<k>` hand-off must stay printed in every case | repository + decision | `scripts/unit-route.mjs:958-1000` (execute route); `.../relays/extensions/index.js:44-63` | `main` @ caee2502 | O1, O14 | current | decision | owner adopted: hint + fallback, never a probe |
| PE-014 | The leg-handover ceiling is **not** a sampled number: no live packet exists at cut, so the ceiling is derived from the pointer-only shape (charter + baton) and must be re-measured the first time a real packet is checked | unknown | no live packet at cut; `bun scripts/relay-packet.mjs budget <unit>` is the measurement | at cut | O20 | unknown | ASSUMPTION-UNVERIFIED | owner: re-base from the first real packet's `measured` line; the checker fails closed above the declared ceiling |

## Prior-decisions contradiction sweep (plan stage)

Candidate sources checked: `docs/features/73-lane-closeout-handoffs/decisions.md`
(D1: `implement` tier `cheap`), `docs/features/76-lane-product-route/` (product
route), `docs/features/61-adaptive-unit-lane/SPEC.md` (catalog ownership),
`AGENTS.md` (one owner per rule, no compatibility shims), and the architectural
invariants (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`). No Normalized
Repository State artifact is installed (`find docs -iname '*normalized*'` → the
feature-18 folder only) and this unit has no legacy `## Design status`.

| claim | prior decision | source path | relation |
|---|---|---|---|
| the leg tier is read from `scripts/catalog.json`, never a second table | #291 AC4 / unit 73 D1: one tier source, `implement` = `cheap` | `docs/features/73-lane-closeout-handoffs/decisions.md:3`; `scripts/unit-route.mjs:664-684` | compatible |
| the pre-PR coherence gate emits no receipt | unit 73 D1: the lane's review emits no receipt, because a receipt needs an open PR | `docs/features/73-lane-closeout-handoffs/SPEC.md:138` | compatible |
| the router keeps printing one phase + tier and never a bare whole-unit command | #291 AC3/AC4 (unit 73 P3) | `docs/features/73-lane-closeout-handoffs/SPEC.md:121` | compatible |
| relay is an enhancement, never a hard dependency | `AGENTS.md`: no compatibility shims, one version at a time; the lane's close-out ladder is unchanged | `AGENTS.md` §Working rules | compatible |
| the packet never becomes a second home for project rules | pi-web relay skill: "It is not a plan, task list, or another home for project rules" | `.../relays/skills/relay-runner/SKILL.md` §Packet | compatible |

No `contradicts` hit needs `resolve-repository-state` or a `NEEDS-DECISION`.
