# External verification — feature/654-guard-layer

Date: 2026-11-20

```text
EXTERNAL VERIFY — base: 8fc204abb · head: 6421b39e7
Blockers: 2 —
  (B1) packages/agentic-workflow/bin/agentic-workflow.mjs:1146-1159 — `provision
  permissions` reads `pi.guardPlugins` through `api.get("resolved", …)`, the one scope
  that never validates (`api.mjs:158-164` has no issue check), and its catch maps
  UNKNOWN/NOT_FOUND to "nothing is declared, so the baseline stands alone" — so explicit
  declarations are dropped with success. Reproducer A (mktemp -d): `git init`; declare
  `guardPlugins` in `.pi/pi-agentic-workflow.json` (`no-dotenv` deny `**/.env`, `ask-rm`
  ask `*rm -rf*`); `PI_CODING_AGENT_DIR=$HOME/.pi/agent`; `bun packages/agentic-workflow/
  bin/agentic-workflow.mjs provision permissions --scope project --write` → exit 0,
  stderr 0 bytes, and the written `.pi/extensions/pi-permission-system/config.json`
  contains zero declared rules (`rg -c '\*\*/\.env' file` → exit 1) while its own header
  claims "Generated from the guards declared in `.pi/pi-agentic-workflow.json`"; the same
  state answers `config get pi.guardPlugins` with a loud CONFIG REFUSAL, exit 2. Reproducer
  B (facet of the same root): descriptor discoverable + malformed verdict → exit 0 silent
  baseline, while `config get pi.guardPlugins --scope project` refuses exit 2 ("expected
  one of allow, deny, ask") — the bin's own `INVALID → refuse` branch (1152-1157) is
  unreachable through `get("resolved")`, so the authored loud path never fires.
  Base-vs-head: at base the tool does not exist (`PROVISION REFUSAL — unknown tool
  "permissions"`, exit 2, re-observed in an origin/main scratch in mktemp); the loud
  sibling (`config get …` exit 2) behaves identically at both sides; the silent success
  exists only at head. Realism: discovery scans only `<project>/node_modules` and
  `<project>/config-extensions/` (`discovery.mjs:43-48,66-95`), while every documented
  install route (`pi install npm:@gtrabanco/pi-agentic-workflow` → `~/.pi/agent/npm` or
  `<project>/.pi/npm`) lands elsewhere — the reference repo itself cannot resolve `pi.*`
  (`config get pi.phaseBatching` refuses here, same at base). Positive control: descriptor
  present (drop-in at the code path, or `node_modules/@gtrabanco/pi-agentic-workflow`) →
  declarations render correctly, so the defect is scoped to the resolution failure being
  swallowed. Names O12 (validator green, stated outcome "renders … every deterministic
  declaration" fails on the documented path), S6 bullet 3, S9 bullet 4. Stability: the
  reproducer fires only on this new command; unrelated commands unaffected. Smallest
  action: when the section's file exists but cannot be resolved, or fails validation,
  refuse with exit 2 naming the cause (mirror `config get --scope project`); keep the
  silent baseline only for "no declaration at all" — /aw-local-apply.
  (B2) docs/workflow/CONFIG.md:320 — the event-reliability matrix `tool_call` row still
  lists "shell write guard" among index.ts's listeners. Reproducer:
  `rg -c 'shell write guard' packages/pi-agentic-workflow/src/extension/index.ts` → exit 1
  (absent) at head vs `git show origin/main:packages/pi-agentic-workflow/src/extension/
  index.ts | rg -c decideShellWrite` → 2 (present) at base; the row was true at base and
  false at head — change-caused by the P6 retirement, and the change edited this very file
  (pi row, pathProtection row, Guard plugins) but missed the cell. The pinning suite
  `bun test packages/pi-agentic-workflow/test/event-reliability-matrix.test.mjs` → 6 pass
  (it checks cells only for non-emptiness, so the stale cell is unpinned). Smallest action:
  drop "shell write guard" from the cell (add the new guard-plugin registration while
  there) — /aw-local-apply.
Advisories: 3 —
  (A1) docs/features/654-guard-layer/SPEC.md:119 (AC-10) — the declared check
  `rg -ci 'systemone\|model-judge\|openai\|anthropic' packages/` as sourced matches only
  the pipe-joined literal (vacuous: it would still exit 1 if systemone appeared
  everywhere); as rendered/intended (alternation) it exits 0 at head AND at base (41
  pre-existing files, 42 at head; the delta is the new test's ctx double copied from
  base's own fixture pattern). Substance independently re-probed clean: `rg -ci 'systemone'`
  / `rg -ci 'model-judge'` / `rg -c 'from "@gotgenes'` → exit 1, plugin-core.ts carries no
  provider name, `git diff origin/main...HEAD -- packages/*/package.json` empty on
  dependencies. Advisory because the mis-scoped check fails at base too.
  (A2) docs/workflow/CONFIG.md:312 — the session_start row omits the guard-plugin
  registration the change added to index.ts's session_start listener; incompleteness of a
  live table, not an assertion of old truth (every listener it names still exists).
  (A3) docs/workflow/CONFIG.md:420-422 — documents the descriptor drop-in at
  `<project>/.agentic-workflow/config-extensions/` while discovery reads
  `<project>/config-extensions/` (reproducer: descriptor at the documented path → not
  discovered; at the code path → discovered, declarations render). Pre-existing at base
  (the text and `discovery.mjs` are both untouched by this diff), but it is the documented
  escape hatch for B1's discovery gap — fix together, /aw-local-apply.
Sibling sweep: list — B2 (CONFIG.md:320) and A2 (CONFIG.md:312) as above; quoted/dated
  history considered and excluded: docs/ROADMAP.md:269 (issue #606's own quoted summary),
  docs/fix/560|567|606/** and docs/LOGS.md (closed units' frozen records),
  test/permission-layer.test.mjs (the retirement pin, asserts absence); live surfaces
  otherwise clean — `decideShellWrite|analyzeShellWrite|shell-bound writes|shell write
  guard|SHELL_TEMP_ROOTS|shell-write-guard` over skills/, template/, .github/, scripts/,
  packages/*/src, packages/*/bin → exit 1; pi README and PERMISSIONS.md narrate the
  retirement in correct past tense.
Completeness: S1–S11 resolved (tasks P1–P9, validators re-run green: phase-lint PASS
  fingerprint d4770795f4bc…, new suites 9/6/12/11/9 pass, package suites 944/1021/1333
  pass, root gate 130 PASS EXIT=0, normative-drift 22 pass, budgets 30 skills + 6 documents
  PASS, docs-generate 3/0 PASS, obligation-tags 130/0, lint-changeset ok); obligations
  O1–O22 verified re-run green, O23 evidenced n/a (PE-006: `ls ~/.pi/agent/npm/node_modules/
  @gotgenes` → exit 2; promptTimeoutMs matches 2 and 2) | open ids: none (behavioral claim
  failures on S6-b3/S9-b4/O12 carried by B1, not missing tasks).
Spot check: bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
  docs/features/654-guard-layer/SPEC.md → match (exit 0 · verdict PASS · fingerprint
  d4770795f4bc6810… equals E1's recorded d4770795f4bc…).
Verdict: NEEDS-DECISION (B1, B2)
```

## Addendum — 2026-11-20 · correction batch (S1)

One batch folded all five findings (the request is recorded verbatim at the unit's `## Log` **L2**):

- **B1** folded at `683bba129` — one shared `refusePermissions` arm replaces the silent catch across three states (registered section failing validation, declarations under an unregistered `pi` section, unreadable JSONC scope file); the silent baseline now requires genuine absence. Corpus red at `8f5cd8b37` (provision suite 10 pass / 2 fail → green 12 pass / 0 fail).
- **B2 + A2** folded at `683bba129` — the event matrix's `tool_call` row drops the retired `shell write guard` and its `session_start` row names the guard-plugin registration; pin red at `8f5cd8b37` (permission-layer 9 pass / 1 fail → green, with the matrix suite 16 pass / 0 fail).
- **A1** folded — AC-10's check rescoped to the seam modules (`guard-plugin.ts`, `plugin-core.ts`): the alternation now exits 1 for a reason (observed) instead of failing on pre-existing model-routing content that exists at base and head alike.
- **A3** folded — the drop-in doc path corrects to `<project>/config-extensions/`, the path `discovery.mjs` reads; probe: a descriptor at the documented path renders the declared rules (exit 0).

**Recheck limited to the blockers (§9):** B1's two reproducers → refused exit 2 (provision suite 12 pass / 0 fail); B2's reproducer → `rg -c 'shell write guard' docs/workflow/CONFIG.md` → exit 1 (pin green). Full battery on the batch's head: root gate 130 suites PASS exit 0 · schema 944 / 0 · pi 1022 / 0 · crate 1336 / 0 · normative-drift 22 / 0 · budgets 30 skills + 6 documents PASS · docs-generate 3 / 0 PASS · obligation-tags 130 / 0 PASS · phase-lint PASS (fingerprint `d4770795f4bc…`) · changeset lint ok. Declared-command differential (old `6421b39e7` vs batch head, nine states in `mktemp -d`): zero unexpected stdout/stderr/exit differences — only the two asked-for flips (declaring-but-unregistered 0→2, invalid-and-discovered 0→2). Ledger: `O12` amended under a recorded amendment-log entry; 22 `verified` + `O23` `n/a`, no status moved.

### Post-batch note — 2026-11-20 · `verify` diligence (outside the G1–G8 battery)

`agentic-workflow verify` (read-only extra) reported **28 violations** on the batch head — every flagged construct pre-existing (the batch removed no heading, Log line, G-line, PE row or O23 cell; flagged bytes are present at `6421b39e7`). Folded in-batch and recorded at the unit's `## Log` **F6**: added the missing `## References` (without it the doc fell to the legacy shape default — 14 section violations; the section is the 11th `spec-by-reference` requirement, promised by the feature template, absent since the freeze `346ad2c4`), conformed `O23`'s status cell to the closed `n/a: <reason>` grammar (value/reason/evidence unchanged, amendment logged), and re-pinned three own-prose retired-path citations to `git show 346ad2c4:…` (precedent: unit 224).

Re-run: **10 violations — reported to the owner, not fixed here.** (a) `receipt-malformed-head` ×8: G1–G8 carry no `HEAD <40-hex>` — the gate-ran grammar demands one while the log grammar says "a correction never edits an earlier line"; the truthful run head is `4d6524a3` (last commit before the close bookkeeping). (b) `cited-path-missing` ×2: the `shell-path.ts` spans inside `S4`/`S6`'s verbatim `spec-requirement@1` blockquotes — quote format the grammar mandates; only a verifier exemption (its own comment already treats fenced Log quotes as "evidence, not a claim of the quoting doc") or an owner ruling can clear them. A future `verify` run expects exactly these 10 until then.
