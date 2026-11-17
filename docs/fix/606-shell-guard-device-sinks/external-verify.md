# External verify — fix/606-shell-guard-device-sinks

Date: 2026-11-17 · base `b25ef8a9` (merge-base with `origin/main` `8b51f375`) · head `34211721` · first receipt for this unit (no prior `EXTERNAL VERIFY` block or review verdict → full verdict, once). Read-only run: no `git commit`, `git push`, branch creation, forge mutation or code edit — the only file written is this receipt (uncommitted). The change introduces no command or flag; base-side proofs ran against a `git archive` copy of `b25ef8a9` in `mktemp -d` scratch (removed after the runs); the declared check-only commands (`docs-generate --check`, `residual-classify --inventory`) write nothing. Live tree byte-clean (`git status --short` empty) after the runs.

Declared verification commands, re-run at head (`command: observed result`):

- `cd packages/pi-agentic-workflow && bun run test` → exit 0 · `956 pass, 0 fail` · 84 files (matches E6).
- `bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs` → exit 0 · `30 pass, 0 fail` (matches E3; the O1–O7/AC-S1/AC-S2 validator).
- `node scripts/run-root-suite.mjs --jobs 1` → exit 0 · `116/116 PASS`, 0 FAIL (matches E7; run twice — the second run's exit code captured verbatim as `EXIT=0`).
- `bun scripts/docs-generate.mjs --check` → exit 0 · `PASS — 3 files, 0 stale, roadmap unchanged` (matches E8).
- `bun scripts/skill-lint.mjs` → `PASS (104 files, 0 findings)`; `bun scripts/promise-coherence.mjs` → `PASS (42 checked · 23 skipped)`; `bun scripts/check-skill-context.mjs` → `PASS context budgets: 30 skills`; `bun scripts/check-skill-context.mjs --documents` → `PASS context documents: 4`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/606-shell-guard-device-sinks/SPEC.md` → `verdict PASS` (all match E8).
- `rg -n 'device sink' skills/orchestration-envelope/references/TURN_CONTRACT.md` → exit 0 · 1 match at line 188 (O8/P3 validator).
- `rg -c 'DEVICE_SINKS' packages/pi-agentic-workflow/src` → `2` (the `## Retirements` pin); `bun scripts/residual-classify.mjs --inventory --base b25ef8a9` → exit 0 · `rows: []` (E9).

Own probes (derived from S1/S2 wording, not the writer's tests; the identical probe run against the head `dist` and a `git archive` copy of base `b25ef8a9` in scratch): sink-only commands (`bun run build > /dev/null 2>&1`, `echo hi >> /dev/null`, `gh … > body.md 2>/dev/null`, `> /dev/stdout 2>/dev/stderr`) — base `block:true` with prompts (1/1/1/3), head `block:false` with 0 prompts; all eight S2 names plus `/dev/fd/0|3|999` — base reaches the resolver, head makes 0 resolver calls on a throw-on-call resolver (skip precedes resolution); mixed `echo x > /dev/null 2>/home/person/durable.md` — base 2 prompts, head 1 prompt naming only the durable path (approve passes, decline blocks with the durable reason, headless blocks naming `/home/person/durable.md`, never the sink). Negatives byte-identical base vs head: `/dev/random`, `/dev/urandom`, `/dev/shm/f.log`, `/dev/loop0`, `/dev/ttyS0`, `/dev/core` all block; lookalikes `/dev/nullx`, `/dev/null.bak`, `/dev/fullx`, `/dev/fd`, `/dev/fdfoo`, `/dev/NULL`, `/dev/Stdout` all block with the resolver reached; relative `dev/null`/`./dev/null` resolve to `/work/repo/dev/null` and are judged; `2>&1` still never exposed as a target; `analyzeShellWrite` still reports the sink operand; `echo hi > $DEST` still passes. Stability: every non-sink row is identical at base and head — the only differing rows are the sink cases the change targets plus the two `path.resolve` normalization forms named in advisory A1.

Contract-text qualifier check (diff touches contract/instruction text): both rewritten surfaces are insertion-only. `TURN_CONTRACT.md:188` keeps both base sentences verbatim with one sentence added (`OLD-Sentence`/`ADDED-Sentence` check: 0 lost, 1 added); `shell-path.ts`'s header bullet keeps every base clause (`resolution errors block`, the scratch carve-out, `blocks headless`, the Tier 2 hand-off) with one inserted clause. No lost qualifier, no conditional→absolute or absolute→conditional flip.

Sibling sweep: clean (details in the block below).

Advisories A1–A3 below; none is a change-caused defect under realistic input.

```text
EXTERNAL VERIFY — base: b25ef8a9 · head: 34211721
Blockers: 0
Advisories: 3 —
  A1. docs/fix/606-shell-guard-device-sinks/SPEC.md:197 (O6 use-case text: "a trailing-slash form … still judged").
      Observed: at head `echo x > /dev/null/` never reaches `resolveTarget` (0 calls, `block:false`); the base copy
      judges and blocks it (`resolved:"/dev/null/"`) — `path.resolve` strips the trailing slash before D3's
      exact-equality compare (packages/pi-agentic-workflow/src/guards/shell-path.ts:315). `//dev/null` behaves the
      same (head skips, base judged) and is D3-consistent. Why advisory: O6's validator F8 re-runs green (30 pass,
      0 fail) and contains no trailing-slash case, and the input is out-of-domain — bash itself refuses it
      (`echo x > /dev/null/` → `Is a directory`, exit 1), so no write occurs. Smallest action: reconcile O6's
      use-case text with D3 (or cover the form in F8 and keep it judged) — route to `/aw-local-apply`.
  A2. packages/pi-agentic-workflow/src/extension/index.ts:602 — the structured write/edit guard refused this session's
      probe file under `/tmp` (`"…/probe.mjs" resolves outside the project root … write is blocked`) while the shell
      guard passes the same path as scratch. Why advisory: pre-existing at base — the diff touches only
      `guards/shell-path.ts`, the contract sentence and docs/tests.
  A3. packages/pi-agentic-workflow/README.md:615 — the Path protection section still describes only the Tier 2
      `write`/`edit` guard, never the #567/#606 shell surface. Why advisory: pre-existing at base and already
      recorded in the unit's `## Known pre-existing issues` as a separate unit's decision.
Sibling sweep: clean — the shell guard's only declared prose (skills/orchestration-envelope/references/TURN_CONTRACT.md:188) carries the carve-out in the same diff; `rg 'device sink|/dev/null|decideShellWrite|analyzeShellWrite'` over `skills/`, `docs/`, `packages/`, `template/`, `.github/` finds no surface still asserting the old containment truth (ROADMAP/changeset/journal narrate it in past tense as the bug; `docs/fix/567-path-protection-bypass/` and the LOGS #567 entry are historical records of their own sessions; the README makes no shell claim).
Completeness: S1, S2 resolved (P1–P4 each carry `(Implements: S1, S2)` with validators re-run green here; obligations O1–O9 all `verified` and reproduced — A1 is O6's prose caveat, advisory) · open ids: none
Spot check: bun test packages/pi-agentic-workflow/test/shell-write-guard.test.mjs → match
Verdict: VERIFIED
```

## Correction record — 2026-11-17

Correction batch 1 of the owner-directed "triage and fix" pass (§9 bounds — one
batch, findings only):

- **A1 — closed.** `SPEC.md` O6's use-case text reconciled with D3 (the tested
  forms + the normalization clause), F8 pinned the normalized sink spellings
  (`/dev/null/`, `//dev/null` skip before resolution), `D4`/`E10` record the
  red→green runs (claim check exit 1 → 0; shell suite 30 pass / 0 fail).
- **A2 — triaged no-fix.** Pre-existing at base and outside this unit's scope
  (`## Non-goals`: "No change to the rest of the verdict"); the scratch carve-out
  is documented as bash/mktemp-specific, so the write-tool posture is not
  change-caused here.
- **A3 — triaged no-fix.** Pre-existing and a recorded unit non-goal ("No
  README repair … not reopened here") — a separate unit's decision.

Post-batch gate: root suite `116/116 PASS` exit 0; pi package `956 pass, 0 fail`;
`phase-lint` verdict PASS; `docs-generate --check` PASS; `promise-coherence` PASS
(42 · 23). Delta verify pending — this receipt stays the pre-correction verdict.
