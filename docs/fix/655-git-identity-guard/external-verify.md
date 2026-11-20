# External verify — fix/655-git-identity-guard

## 2026-11-20 — delta verdict (corrections B3, A3 folded; B1 folded at earlier head)

```text
EXTERNAL VERIFY — base: c5fb2ba58 · head: 1105e813d
Blockers: 0
Advisories: 0 (the previous 6: A1 resolved by P5's journal-fragment correction; A2 vacuous discriminator still vacuous but the underlying claim verified by direct inspection; A3 folded by 01165e38c; A4/A5/A6 unchanged but remain advisory-class)
Sibling sweep: clean — the stale comment (B3) is now qualified at extension/index.ts:565; the stale schema json (B1) is regenerated; no surviving mentions of the pre-change truth in non-655 surfaces
Completeness: S1-S5 resolved (P1-P6 validators re-run green here: verify exit 0, phase-lint PASS 6/6, ceremony acceptance read AC1-AC6 met)
Spot check: bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs → match (55 pass, 0 fail)
Verdict: VERIFIED
```

Delta since last receipt (head 85a242f90 → 1105e813d): four commits landed:
- `dd270a705` qualified the wiring comment at extension/index.ts:565 (B3 resolved)
- `01165e38c` mirrored the per-mode headless rule in template docs (A3 resolved)
- `a19d2e1ac` docs edit about pinning a head sha
- `1105e813d` this receipt itself

Root suite: 135 PASS, 0 FAIL · Package suite: 1031 pass, 0 fail · normative-drift: 23 pass · docs-generate --check: PASS · schema check: current

## 2026-11-20 — full verdict (no prior `EXTERNAL VERIFY` receipt existed)

```text
EXTERNAL VERIFY — base: c5fb2ba58 · head: 4c5641886
Blockers: 3
- B1 packages/agentic-workflow-schema/config.schema.json:101 (paired with src/config.ts:254) — the committed generated projection still says "a headless session is denied" while the source description it mirrors was rewritten to "refused in every mode except `allow`". Reproducer: `bun test packages/agentic-workflow-schema/test/config-schema-artifact.test.mjs` → 1 fail ("the committed config.schema.json is exactly the generated projection"); `cd packages/agentic-workflow-schema && bun run check:config-schema` → "config.schema.json is stale" (exit 1); `bun run test` in the package → 949 pass, 1 fail (AGENTS.md's schema-touched rule is red). Base-vs-head: base copy (git archive c5fb2ba58 → mktemp, built there) runs the same suite → 2 pass, 0 fail; the committed json is byte-identical to base (untouched) while src/config.ts:253→254 changed, so the drift is change-caused and fires only on this pair. Also makes O11's `verified` row non-reproducing for the published artifact. Smallest action: regenerate with `bun run generate:config-schema` in packages/agentic-workflow-schema — /aw-local-apply.
- B2 docs/fix/655-git-identity-guard/SPEC.md:199 (AC-S6 check) and SPEC.md:278 (O12 validator) — both cite `bun scripts/version-parity-gate.mjs` exiting 0. Reproducer: `bun scripts/version-parity-gate.mjs` → exit 2, usage (`--content | --pins | --package` required). Base-vs-head: the script (unchanged by this unit) has always required a mode flag; the citations are new unit-doc text (base has no SPEC), so the declared validator never reproduces as written — O12 fails "verified with a validator that re-runs green here"; the substantive gate result does reproduce with the flag E9 actually recorded: `bun scripts/version-parity-gate.mjs --content` → exit 0, `VERDICT: PASS`. Smallest action: append `--content` to both citations — /aw-local-apply.
- B3 packages/pi-agentic-workflow/src/extension/index.ts:565 — the wiring call-site comment asserts "A session with no UI cannot ask, so it blocks" unconditionally; this change made the rule "headless blocks in every mode except `allow`" (S4) and rewrote that claim at git-identity.ts:16, CONFIG.md:138, README.md:612 and config.ts:254, but this sibling survived. Reproducer: head build, headless `{mode:"allow"}` → `{block:false}` (independent probe; writer's M4 agrees) vs the comment's unconditional "so it blocks". Base-vs-head: base build in mktemp — headless `allow`/`deny`/`ask` all `block=true`, interactive `deny` `block=false, asks=1`, so the comment matched behavior at base and went stale with this change; the comment is byte-identical at base and head. Smallest action: qualify the comment (e.g. "blocks in every mode except `allow`", or scope it to `ask`) — /aw-local-apply.
Advisories: 6
- A1 docs/fix/655-git-identity-guard/SPEC.md:234 (P5) — task text names "the session entry in `docs/LOGS.md`", but .agentic-workflow/journal.md:5 makes the merge aggregator the only writer of LOGS.md and D6 chose the narrative fragment; the entry shipped as .agentic-workflow/journal/20261120T132843Z-fix-655-git-identity-guard-narrative-local.md. Why advisory: the session entry exists in the sanctioned carrier and P5's validator (docs-generate --check) re-runs green; only the task prose names the wrong file.
- A2 docs/fix/655-git-identity-guard/SPEC.md:82 (Retirements) — `rg -c 'mode === "allow" ? "allow"' …` → 0 is vacuous: the identical command on the base file also returns 0 (the regex's ` ? ` never matches the literal ` ? ` in source), so it cannot evidence "the inline ternary is gone". Why advisory: the underlying claim is true by direct inspection — exactly one occurrence at head (git-identity.ts:502, inside `dispositionFor`) versus one at base (line 477, inside `decideGitConfigCall`) — but the stated discriminator can never fail.
- A3 template/docs/workflow/GIT_IDENTITY_HARDENING.md:53 — kept the pre-change guard comment while its repo sibling (docs/workflow/GIT_IDENTITY_HARDENING.md:52-55) gained the per-mode headless/allow clauses; identical at base, diverged here. Why advisory: the template text asserts nothing false (it omits the new clause rather than stating the old truth), and AC-S6's four named surfaces are all updated.
- A4 packages/pi-agentic-workflow/README.md:588-615 — the rewritten background paragraphs drop qualifiers: scope "on the repository this package ships from" and quantifier "every one of them", and the allow-list parenthetical "(the allow list covers local, non-destructive writes only — a removal or a shared file still asks)" condensed. Why advisory: prose, no binding rule's modality flipped — "local, non-destructive" scope survives the rewrite and no conditional became absolute.
- A5 packages/pi-agentic-workflow/test/git-identity-guard.test.mjs:452 (commit df514c82e) — M2's assertion was edited after the red corpus (`/--local/` → `/--show-origin --get-all user\.name/`). Why advisory: the `/--local/` expectation never held for that input at base or head (`reasonFor` untouched by the unit); the invariant M2 pins (deny refusal keeps the write's own repair text and names `guard.gitIdentity.mode`) is unchanged, independently probed, and the ground is recorded in the commit message — disclosed for the IR3 record, not a masked defect.
- A6 docs/fix/655-git-identity-guard/SPEC.md:192 — the criterion is labeled `AC-S6` although the Specs section defines S1-S5 only (no S6). Why advisory: naming cosmetic; doc currency is carried by P4/O10-O12 and the ceremony read reports all six criteria `met`.
Sibling sweep: list — two surviving mentions of the pre-change truth, both raised as blockers: config.schema.json:101 (B1) and extension/index.ts:565 (B3); docs/fix/626-config-guards-ux's "asks (headless blocks)" mentions checked and still true for the default `ask` posture; template hardening comment stale-but-true (A3); no "mode inert"/"never reads options.mode" survivors outside the 655 unit's historical base-state quotes.
Completeness: S1-S5 resolved (P1-P6 validators re-run green here; ceremony acceptance read reports AC1-AC6 `met`; obligations O1-O13 all rows `verified`, O1-O10 and O13 reproduced green) | open ids: O11 (blocked by B1), O12 (blocked by B2)
Spot check: bun test packages/pi-agentic-workflow/test/git-identity-guard.test.mjs → match (55 pass, 0 fail — exactly E4)
Verdict: NEEDS-DECISION (3 open blockers)
```

Verification note: the first `node scripts/run-root-suite.mjs --jobs 4` attempt was
run concurrently with the package suite and exited 1 with its failing line lost to
truncation; the clean re-run alone matched E10 (135 suites PASS, exit 0). An
independent probe (48 checks over S1-S5 wording, incl. the deny-hang clause with a
never-resolving `confirm`) and a 702-row base-vs-head `decideGitConfigCall`
differential (0 deltas, superset of E3's decision column) were run in `mktemp`
scratch and removed after.

**Correction batch — 2026-11-20 (one batch, per §9):** B1 folded by the owner's
concurrent `2e1feac3c` and rechecked green in the foreground (`check:config-schema`
`current`, fixed-point `2 pass, 0 fail`, schema suite `950 pass, 0 fail`). B2, A1 and
A2 were applied by this session and landed inside the owner's later `85a242f90` — that
commit's message records only its own G4 gate line, so this receipt discloses that it
also carried this worktree's in-flight SPEC repairs: both citations now read
`version-parity-gate.mjs --content` and answer `VERDICT: PASS`, P5 names the journal
fragment as the carrier (the aggregator alone writes `docs/LOGS.md`), the Retirements
discriminator is live (`rg -c 'mode === "allow"' …git-identity.ts` → `1`), and `ac-hash`
was plan-repaired through `sectionText` to `12240e8e1d6d0179c01066a2e6073379a806d20e19a2652dc9bc43eafee935a8`.
B3 landed at `dd270a705`, A3 at `01165e38c`; A4/A5/A6 declined with the grounds above.
Recheck (unit Log E15): SPEC `verify` exit 0 · `phase-lint` PASS 6/6 · acceptance
AC1–AC6 `met` · pi suite `1031 pass, 0 fail` · impact set 4/4 `0 fail` ·
`docs-generate --check` PASS · `worktree-guard` 0 findings · `run-root-suite` exit 0,
135 PASS — with one earlier `phase-lint.test.mjs` `SUITE TIMEOUT` under parallel load,
disclosed: solo `162 pass` in 26 s. Next: delta external verify at the new head.
