# fix/166-pi-0850-baseline-refresh

> Fix specification. Copy of `docs/fix/_TEMPLATE/SPEC.md` filled per issue #166.
> Registered in `docs/fix/README.md` (`pending`). Fix unit — no Product half
> exists (D6); its authority is reproduction, root cause, regression scope, and
> rollback.

## Goal

`packages/pi-agentic-workflow/README.md` claims "Verified against Pi 0.84.3",
but pi 0.85.0 shipped 2026-09-04 and the repo's own test surface has already
drifted past the claim (the package's `bun.lock` resolves the dev peer to
0.84.4). The note is the package's only statement about which pi it works on,
so a stale note means every downstream install trusts a version that was never
the tested one. This fix re-verifies the package against pi 0.85.0 — suite
green with the 0.85.x peer, manual smoke on the interactive surfaces — and
refreshes the baseline note (EN + ES) with same-PR release bookkeeping (0.4.1).

## Issue

#166 — tracked issue in the project's forge. The PR must close it via
`Closes #166` in the body.

## Branch

`fix/166-pi-0850-baseline-refresh` (from `main` @ `9a915094`)

## Depends on

None.

## Root cause

The verified-baseline note is maintained by hand and nothing ties its refresh
to a pi release. It has not been touched since feature 27 first wrote it
(`git log -S "Verified against Pi" -- packages/pi-agentic-workflow/README.md`
→ `2bf91948`, the bilingual-READMEs commit), while the dev peer resolution in
`bun.lock` moved to 0.84.4 on its own. The claim therefore lags both the pi
release train (0.85.0, 2026-09-04) and the lockfile the repo actually tests
against (PE-001, PE-002). The release-automation gate proposed in #164 covers
package version bumps, not pi baseline refreshes — the gap stays open until a
future unit owns it.

## Detected in

Issue #166, opened 2026-09-04 the day pi 0.85.0 shipped; the drift was
observable in-repo before that: README says 0.84.3, `bun.lock:75` resolves
`@earendil-works/pi-coding-agent@0.84.4` (PE-001).

## Scope

### In scope

1. **Re-point the dev peer at 0.85.x and run the suite green** (P1):
   `bun update @earendil-works/pi-coding-agent` in the package, then
   `bun run test` — `tsc` compiles `src/extension/index.ts` against the
   0.85.x `.d.ts` including the compile-time drift guard
   `ThinkingLevelsMirrorMatchesPi`, and `node --test` runs the routing/
   config/adapter suites (PE-007, PE-008).
2. **Manual smoke on pi 0.85.x** (P2): install, package skills load, friendly
   command registration (19 user-facing skills per
   `docs/workflow/SKILLS.md` §"The skills"), one routed command set/clear,
   settings console round-trip, first-run hint — observations recorded in the
   unit `progress.md` (PE-010).
3. **Baseline note refresh EN + ES** (P3): `packages/pi-agentic-workflow/README.md`
   and `README.es.md` — one edit unit (bilingual pair, CLAUDE.md hard rule):
   version → 0.85.0, date → 2026-09-04, parenthetical aligned to the verified
   surface set (PE-005).
4. **Release bookkeeping** (P4): `version:` 0.4.0 → 0.4.1 in the package's
   `package.json` plus one row in the "Companion npm packages" table of
   `CHANGELOG.md` and `CHANGELOG.es.md` (CLAUDE.md §Packages; PE-010).
5. **Per-item verdicts** (P5): the PR description records pass/adapted/
   not-applicable for each of the issue's five in-scope delta-scan items
   (PE-010, PE-006).

### Out of scope

- **`ui_prompt_start` / `ui_prompt_end` settings-console UX** (distinguish
  agent work from `ctx.ui` waits): an opportunity noted in the issue, but the
  issue's Out of scope excludes adopting any pi feature not needed by the
  package's existing contract. Routed to a future feature entry; never
  inlined here (PE-011).
- **#165** (slash commands register with description `>`): same package,
  disjoint surface (command description parsing vs. baseline note); parallel
  fix, no merge-order constraint.
- **#164** (automated companion-package release bumps): its gate would enforce
  what this fix does by hand; until it lands, manual bookkeeping stands.
- **`agentic-workflow-schema`**: pi-agnostic, no pi peer (issue Out of scope).
- **Stale `docs/fix/README.md` rows for #157/#159/#161** (PRs #158/#160/#163
  are merged but the rows remain): adjacent index hygiene, routed to its own
  cleanup fix; this unit only adds its own row.
- **Adopting any other new pi feature** from the 0.84.3→0.85.0 delta.

### Planning evidence

The fix's own authority, without a Product half — one row per material claim.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: the note claims Pi 0.84.3 while `bun.lock` already resolves the dev peer to 0.84.4 — the claim is inconsistent with the repo's own test surface today | repository | `packages/pi-agentic-workflow/README.md:142`; `README.es.md:148`; `packages/pi-agentic-workflow/bun.lock:75` | 9a915094 | O12, AC2 | current | proven | — |
| PE-002 | Root cause: the baseline note is manually refreshed with no trigger tied to pi releases; last touched at feature 27 (`2bf91948`) and never since | repository | `git log -S "Verified against Pi" -- packages/pi-agentic-workflow/README.md` (single hit `2bf91948`) | 9a915094 | O12 | current | proven | — |
| PE-003 | Regression scope: the npm page and every downstream `pi install npm:@gtrabanco/pi-agentic-workflow` read the note as the package's only pi-compatibility claim; a silent pi-side break hits all installs at once | forge | https://github.com/gtrabanco/agentic-workflow/issues/166 (§Business value) | — | O7, AC3 | not-applicable | decision | — |
| PE-004 | Rollback path: one `git revert` of the fix PR restores note, lockfile, and version; if 0.4.1 already published, a follow-up patch bump republishes the prior claim; data cleanup none | derived | rule "single-PR revert + patch republish (publish CI skips same-version pushes)", inputs PE-001 + PE-012 | — | O7 | not-applicable | decision | — |
| PE-005 | Affected invariant/use case: the baseline note must only ever state what the package was actually verified against (README Notes section is the claim surface); publishing an untested claim breaks the note's trust contract | repository | `packages/pi-agentic-workflow/README.md` §Notes | 9a915094 | O7, AC3 | current | proven | — |
| PE-006 | pi 0.85.0 shipped 2026-09-04; the 0.84.3→0.85.0 delta relevant to the package's contract: persistent Claude thinking effort (Anthropic transports preserve per-turn effort, recover from signed-thinking mismatches), skills load when Bash is the only enabled tool (#8552), no `registerCommand`/extension-API changes; the `/thinking` selector rework shipped in 0.84.3 (already inside the old baseline), and `ui_prompt_start`/`ui_prompt_end` landed in 0.84.4 | document | https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/CHANGELOG.md (fetched 2026-09-04) | — | O2, O10, AC5 | current | proven | — |
| PE-007 | The dev peer is resolved by `bun.lock` (`@earendil-works/pi-coding-agent@0.84.4`) under a `*` peer range, so `bun update` re-resolves to the newest 0.85.x; npm registry serves 0.85.0 (`npm view` observed 2026-09-04) | repository | `packages/pi-agentic-workflow/bun.lock:75`; `packages/pi-agentic-workflow/package.json:52-54`; registry observation 2026-09-04 | 9a915094 | O1 | current | proven | — |
| PE-008 | The package suite is peer-sensitive: `tsc` compiles `src/extension/index.ts` against the peer's types — including the compile-time drift guard `ThinkingLevelsMirrorMatchesPi` over the thinking-level union — and the routing suites pin `setThinkingLevel` per-command set/restore semantics, the exact surface 0.85.0's persistent-thinking-effort feature touches | repository | `packages/pi-agentic-workflow/src/extension/index.ts:4-5,32-44`; `src/routing/dispatch.ts:111,273`; `test/restore-after-settle.test.mjs:143` | 9a915094 | O2, O3, AC1 | current | proven | — |
| PE-009 | CI publishes the package on merge when the version differs from the registry, running the test gate (`prepublishOnly`: build + test) — merging this PR ships the refreshed note to npm immediately, so AC1–AC5 must hold before merge | repository | `.github/workflows/publish-pi-package.yml` (version gate + bun test gate); `packages/pi-agentic-workflow/package.json` `prepublishOnly` | 9a915094 | O8, O9 | current | proven | — |
| PE-010 | The user directs: re-verify against 0.85.x (suite + manual smoke covering install, skills, command registration, routed set/clear, settings console, first-run hint), refresh the note with date, same-PR release bookkeeping, and a verdict per in-scope item in the PR description | forge | https://github.com/gtrabanco/agentic-workflow/issues/166 (§In scope item 5, §Acceptance criteria) | — | O4–O6, O8–O11 | not-applicable | decision | — |
| PE-011 | The `ui_prompt_start`/`ui_prompt_end` console UX opportunity is explicitly out of scope (adopt no pi feature not needed by the existing contract); it is routed to a future feature entry, not absorbed here | forge | https://github.com/gtrabanco/agentic-workflow/issues/166 (§Out of scope; §In scope item 4) | — | — | not-applicable | decision | — |
| PE-012 | Required failure state: the baseline note is never refreshed to a pi version the package suite does not pass or on which any manual smoke observation failed — if P1's suite is red on 0.85.x, or any P2 `- SMOKE` row records `outcome: fail`, the unit stops before P3 and the break is triaged as its own finding, never folded into later phases | document | `verification-contract` anti-gaming rules; `evidence-grounding` overclaim guardrail | — | O12 | not-applicable | decision | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | PE-007 | The dev peer resolves to pi 0.85.x in `bun.lock`/`node_modules` | P1 | 1 | execute-phase | `cd packages/pi-agentic-workflow && node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → starts with `0.85.` | command output in progress.md | planned |
| O2 | PE-006 + PE-008 | The package suite (tsc type contract incl. thinking-level drift guard + full test suite) is green with the 0.85.x peer | P1 | 2 | execute-phase | `cd packages/pi-agentic-workflow && bun run test` → exit 0 | exit code + test counts in progress.md | planned |
| O3 | PE-008 | The suite outcome and resolved peer version are recorded as the unit's verification evidence | P1 | 3 | execute-phase | `grep -c "^- VERIFY" docs/fix/166-pi-0850-baseline-refresh/progress.md` → ≥ 2 | progress.md rows | planned |
| O4 | PE-010 | Manual smoke part 1 on pi 0.85.x: install, package skills load, friendly command registration (19 user-facing) | P2 | 1 | execute-phase (manual) | AC2 validator → 6 | progress.md `- SMOKE` rows | planned |
| O5 | PE-010 | Manual smoke part 2 on pi 0.85.x: one routed command set/clear, settings console round-trip, first-run hint | P2 | 2 | execute-phase (manual) | AC2 validator → 6 | progress.md `- SMOKE` rows | planned |
| O6 | PE-010 | The six smoke observations are recorded with per-observation outcomes (`outcome: pass` / `outcome: fail`); every outcome must be pass — any `outcome: fail` row engages O12's stop-before-P3 | P2 | 3 | execute-phase | `grep -c "^- SMOKE" docs/fix/166-pi-0850-baseline-refresh/progress.md` → 6 | progress.md | planned |
| O7 | PE-003 + PE-005 | The baseline note reads 0.85.0 with the date in EN and ES (one bilingual edit unit); no stale 0.84.x claim remains in either README | P3 | 1 | execute-phase | AC3 validators → 0 stale / ≥ 1 hit each | grep output in progress.md | planned |
| O8 | PE-010 | Package version bumped 0.4.0 → 0.4.1 | P4 | 1 | execute-phase | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.4.1` | command output | planned |
| O9 | PE-010 | CHANGELOG.md + CHANGELOG.es.md companion-package tables carry the 0.4.1 row | P4 | 2 | execute-phase | `grep -c "| 0.4.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each | grep output | planned |
| O10 | PE-006 + PE-010 | The PR body records a verdict (pass/adapted/not applicable) for each of the issue's five in-scope delta-scan items | P5 | write-PR-body | execute-phase | `grep -c "^- VERDICT" docs/fix/166-pi-0850-baseline-refresh/pr-body.md` → 5 | pr-body.md | planned |
| O11 | PE-010 | The fix-index row flips to `done` (the index's backticked done-row convention, `#159`/`#161` siblings) with the PR link after the PR opens | P5 | close-out chain | execute-phase | AC6 validator → 1 match | docs/fix/README.md row | planned |
| O12 | PE-012 | Required failure state: a red suite on 0.85.x or any failed smoke observation stops the unit before the note is refreshed; the break is triaged as its own finding, never absorbed | P2 | 3 | execute-phase | read-verified: progress.md records any red suite outcome or `- SMOKE … outcome: fail` row, plus the stop-before-P3 decision, before P3 runs | progress.md note | planned |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command; the manual smoke's *record* is command-greppable (decision 3).

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement.

- [x] No template placeholders left — the `### P1` scaffold lines are replaced, not kept.
- [x] `### Out of scope` has ≥ 1 concrete bullet (six, each with its route).
- [x] Every `## Acceptance` criterion is a runnable command with an expected outcome.
- [x] Every phase passes the 8-box Phase-lint (close-out phase exempt per `skills/phase-contract/SKILL.md`; fix/161 precedent).
- [x] `### Planning evidence` has a `current` row for the reproduction (PE-001), the root cause (PE-002), the regression scope (PE-003), and the rollback path (PE-004) — none blank, none `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant, affected use case, and required failure state, each with a phase and a validator; no `deferred` row and none exported to a follow-up issue.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The package suite is green with pi 0.85.x as the resolved dev peer (type contract incl. the thinking-level drift guard + full test suite). | `cd packages/pi-agentic-workflow && bun run test` → exit 0; `node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` → starts with `0.85.` |
| AC2 | The manual smoke ran on pi 0.85.x and its six observations are recorded with per-observation outcomes (`outcome: pass` / `outcome: fail`); all six outcomes pass — any `outcome: fail` row engages O12's stop-before-P3 and the unit may not proceed to P3 or close. | `grep -c "^- SMOKE" docs/fix/166-pi-0850-baseline-refresh/progress.md` → 6 (each row names the observation + its outcome; a fail row is a required stop state, never a sanitizable detail) |
| AC3 | The baseline note reads 0.85.0 with the date in EN and ES; no stale 0.84.x claim remains in either README. | `grep -c "0\\.84" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → `0` and `0`; `grep -c "0\\.85\\.0" packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md` → ≥ 1 each |
| AC4 | Release bookkeeping complete: package at 0.4.1 and both changelog tables carry the row. | `node -p "require('./packages/pi-agentic-workflow/package.json').version"` → `0.4.1`; `grep -c "| 0.4.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each |
| AC5 | The PR body records a verdict (pass / adapted / not applicable) for each of the issue's five in-scope delta-scan items. | `grep -c "^- VERDICT" docs/fix/166-pi-0850-baseline-refresh/pr-body.md` → 5 |
| AC6 | The fix-index row is closed with the PR link after the PR opens, in the index's backticked done-row convention. | ``grep -cE "\\[#166\\]\\(https://github.com/gtrabanco/agentic-workflow/issues/166\\) \\| pi-0850-baseline-refresh \\| \`?done\`? · \\[#" docs/fix/README.md`` → 1 |

## Phases

Execution ledger — `execute-phase --fix 166` runs **all remaining phases by
default** and ticks tasks here; an explicit phase argument (e.g. `P2`) runs
exactly one phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below passes all 8 boxes (close-out phase exempt:
it carries only the literal close-out chain, fix/161 precedent). Results
recorded per phase.

### P1 — Re-point the dev peer at pi 0.85.x

Layer: `config/infra`. Done-when: `cd packages/pi-agentic-workflow && bun run
test` → exit 0 with the peer resolving to `0.85.x`.

- [x] Re-resolve the dev peer: `cd packages/pi-agentic-workflow && bun update @earendil-works/pi-coding-agent` → `node -p "require('./node_modules/@earendil-works/pi-coding-agent/package.json').version"` prints `0.85.x`; `bun.lock` records the new resolution (O1)
- [x] Run the package gate: `cd packages/pi-agentic-workflow && bun run test` → exit 0 (tsc type contract incl. `ThinkingLevelsMirrorMatchesPi` + `node --test test/*.test.mjs`); on red, O12 stops the unit before P3 (O2, O12)
- [x] Append the verification evidence as `- VERIFY` rows (resolved peer version, suite exit code, test counts) to `docs/fix/166-pi-0850-baseline-refresh/progress.md` (O3)

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:3:dev-peer-repoint-pi-0850`

### P2 — Manual smoke on pi 0.85.x

Layer: `hardening` (manual tasks — phase-contract rule 7's sanctioned home;
the P3 note edit depends on this outcome — O12 stops before P3 on a red suite
outcome or any failed smoke observation). Done-when: `grep -c "^- SMOKE"
docs/fix/166-pi-0850-baseline-refresh/progress.md` → 6.

- [ ] (manual) Install the package into a pi 0.85.x runtime; confirm package skills load and friendly commands register with correct names (19 user-facing skills, `docs/workflow/SKILLS.md` §"The skills") (O4)
- [ ] (manual) Run one routed command end-to-end (set + clear); open `/agentic-workflow-settings` and complete a round-trip; confirm the first-run hint (O5)
- [ ] Append the six observations as `- SMOKE` rows (each naming the observation and its `outcome: pass` / `outcome: fail`) to `progress.md`; any `outcome: fail` row stops the unit before P3 per O12 (O6, O12)

Phase-lint: PASS (8/8) · fingerprint `P2:hardening:3:manual-smoke-on-pi-0850`

### P3 — Refresh the verified-baseline note (EN + ES)

Layer: `docs`. Done-when: `grep -c "0\\.84"
packages/pi-agentic-workflow/README.md packages/pi-agentic-workflow/README.es.md`
→ `0` and `0`.

- [ ] Update the note in `README.md:142` and `README.es.md:148` as one bilingual edit: version → 0.85.0, date → 2026-09-04, parenthetical naming the verified surface set (install, package skills, friendly command registration, routed set/clear, settings console round-trip, `sendUserMessage` with prompt template expansion) (O7)

Phase-lint: PASS (8/8) · fingerprint `P3:docs:1:baseline-note-refresh-en-es`

### P4 — Release bookkeeping 0.4.1

Layer: `docs`. Done-when: `node -p
"require('./packages/pi-agentic-workflow/package.json').version"` → `0.4.1`;
`grep -c "| 0.4.1 |" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each.

- [ ] Bump `packages/pi-agentic-workflow/package.json` `version:` 0.4.0 → 0.4.1 (O8)
- [ ] Add the 0.4.1 row to the "Companion npm packages" table in `CHANGELOG.md` and its `CHANGELOG.es.md` sibling — one bilingual change (O9)

Phase-lint: PASS (8/8) · fingerprint `P4:docs:2:release-bookkeeping-041`

### P5 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Write the PR body file `docs/fix/166-pi-0850-baseline-refresh/pr-body.md` with the smoke evidence and one `- VERDICT` line per in-scope delta-scan item (5 total) (O10)
- [ ] Set the fix-index row status to `done` and commit the flip (the flip commit also stages `pr-body.md`) (O11)
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file docs/fix/166-pi-0850-baseline-refresh/pr-body.md` — body written as a Markdown file, real backticks, never inline `--body`/heredoc) and PRINT THE PR URL in the chat; the body includes `Closes #166`
- [ ] Update the fix-index row to `` `done` · [#<pr>](<pr-url>) `` — the index's backticked done-row convention (`#159`/`#161` siblings) (O11)
- [ ] Commit `docs: link PR #<n>` and push

## Rules that must never be violated

- The baseline note is never refreshed to a pi version the package suite does
  not pass or on which any manual smoke observation failed (PE-012;
  verification-contract anti-gaming).
- The EN and ES note edits ship in the same change — a diff touching only one
  side of the pair is incomplete (CLAUDE.md hard rule).
- No validator is weakened or skipped to manufacture green (verification-contract).
- Out-of-scope problems are routed (separate fix/roadmap entries), never
  absorbed into this unit's phases (PE-011).
- Never push or open the PR from the planning stage — that belongs to P5
  (`execute-phase --fix`).

## Impact

- **Layers** (per `docs/features/27-pi-agentic-workflow/`): package
  configuration/infra (lockfile, package version) and docs (READMEs,
  changelogs). No source module, port, adapter, or entity changes.
- **Files**: `packages/pi-agentic-workflow/bun.lock` (dev peer resolution),
  `packages/pi-agentic-workflow/README.md` + `README.es.md` (note),
  `packages/pi-agentic-workflow/package.json` (version),
  `CHANGELOG.md` + `CHANGELOG.es.md` (rows), `docs/fix/README.md` (index row),
  unit artifacts under `docs/fix/166-pi-0850-baseline-refresh/`.
- **Blast radius**: dev/test surface only (the lockfile's dev peer is not
  shipped — `files:` publishes `dist`, `skills`, manifests, READMEs) plus the
  published README claim on npm after merge. No runtime code path changes.
- **Detection lead time**: immediate — AC2's grep and AC1's suite catch a
  stale note or a red suite at execution time; post-merge, CI's publish gate
  re-runs build+test on every version bump.

## Operational risks

- **CI publish on merge** (PE-009): merging publishes 0.4.1 and the refreshed
  note to npm in the same push. Mitigation: P2 smoke and AC1 must hold before
  P5 opens the PR; the PR body carries the evidence.
- **Suite red or failed smoke on 0.85.x** (low probability): the fetched
  0.85.0 changelog lists no thinking-level enum change and no extension-API
  change (PE-006), and the drift guard is compile-time — but if the suite
  fails or any P2 smoke observation fails, O12 stops the unit before the note
  is touched; the break is triaged as its own finding.
- **`bun update` side effects**: re-resolving the peer may move transitive
  dev-only resolutions; the package suite (O2) is the gate that the new
  resolution set is sound.

## Security risks

n/a — no secrets, auth, PII, webhook, or rate-limit surface changes. The
manual smoke installs this repository's own package into a local pi runtime.

## Compliance touchpoints

n/a — stated explicitly per the fix contract.

## Affected docs

Every mapped doc update is an acceptance criterion: package `README.md` +
`README.es.md` baseline note (AC3), `CHANGELOG.md` + `CHANGELOG.es.md`
companion-package rows (AC4), `docs/fix/README.md` index row lifecycle
(AC6). No `docs/workflow/` or `docs/site/` content changes.

## Observability

- Green: `cd packages/pi-agentic-workflow && bun run test` → exit 0 with the
  0.85.x peer (AC1), and the CI publish gate re-running build+test on merge.
- Silent failure caught: AC2/AC3 greps fail closed while a stale 0.84.x claim
  remains; post-merge, the next baseline re-verification re-reads the note
  against the then-current pi (this unit's cadence precedent).

## Cross-issue notes

- **#164** (release-bump automation, open, enhancement): parallel. Its gate
  would mechanize package version bumps; this fix performs the bookkeeping
  manually per the issue's acceptance criteria. No dependency either way.
- **#165** (slash-command description `>`, open, bug): parallel, same package,
  disjoint surface (command registration descriptions vs. baseline note).
  The P2 smoke verifies command names, not descriptions, so no interaction.
- **#161's stale index rows** (#157/#159/#161 rows still in
  `docs/fix/README.md` though PRs #158/#160/#163 merged): adjacent hygiene
  problem, routed — this unit adds its own row and touches no other row.
- **`ui_prompt_start`/`ui_prompt_end` console UX**: future feature entry
  (PE-011); the issue's Out of scope excludes it here.

## Rollback

One `git revert` of the fix PR restores the note (0.84.3), the lockfile (0.84.4
dev peer), and the package version; data cleanup: none. If 0.4.1 is already
published, a follow-up patch bump (0.4.2) republishes the prior README bytes —
the publish workflow skips same-version pushes, so the bump is required for
npm to pick the revert up. Preserved: all history artifacts; lost: nothing
(the 0.85.x verification evidence stays recorded in the unit progress file).

## Testing

The package's own suite is the regression gate: `tsc` type-contract
compilation against the peer (including `ThinkingLevelsMirrorMatchesPi`) plus
the routing/config/adapter suites (`node --test test/*.test.mjs`), run with
the 0.85.x dev peer (integration-level doubles, no heavy mocking of pi
internals beyond the documented session behavior). The interactive surfaces
(install, TUI, console) are covered by the P2 manual smoke per the issue's
acceptance criteria.

## Effort

S — one working session: peer re-point + suite, one smoke pass, two doc edits,
bookkeeping rows, one PR.

## Decisions made during drafting

1. **Version bump is patch (0.4.1)**: the shipped delta is the README claim
   (published in the tarball's `files:`) plus dev-only lockfile changes; no
   API or behavior change. The issue requires the bump + changelog rows in
   the same PR regardless (PE-010).
2. **The smoke is a mid-sequence manual phase (P2, layer `hardening`)** rather
   than close-out filler: the P3 note edit depends on its outcome, and
   phase-contract rule 7's sanctioned home for manual verifications is a
   hardening-labeled phase. The final close-out phase stays the literal
   `Hardening & PR` chain.
3. **Smoke observations live in `progress.md` as `- SMOKE` rows and the PR
   body lives in the unit as `pr-body.md`**: both are command-greppable, so
   AC2 and AC5 are command-verified instead of unlabelled manual prose
   (spec-lint box 3).
4. **The issue's item-4 attribution is corrected in evidence**: the `/thinking`
   selector rework shipped in 0.84.3 (inside the old baseline), not 0.84.4;
   0.84.4's selector change was styling (active options marked while
   browsing). The coexistence verification stays in the smoke either way
   (PE-006).
5. **Stale fix-index rows for merged fixes are not repaired here** — routed
   (hard rule: track adjacent problems separately, never inline).

## Status

`pending`

(Removed from `docs/fix/README.md` only **after** the PR merges.)
