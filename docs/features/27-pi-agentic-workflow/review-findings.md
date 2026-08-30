| id | file:line | axis | severity | class | route | folded |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | packages/pi-agentic-workflow/src/routing/dispatch.ts:128 | correctness + verify | high | fix-now | fold into current phase — restore the snapshot thinking level whenever the turn applied a model (`(turn.applied.thinking \|\| turn.applied.model) && !turn.userChangedThinking`); AC7 "restores both" + AC8 equality fail on a `{model}`-only route because Pi recomputes thinking inside `setModel` (`pi-coding-agent/dist/core/agent-session.js:1206,1339-1351`); reviewer probe against the shipped `dist/`: `'medium' !== 'high'` | yes |
| F2 | packages/pi-agentic-workflow/test/helpers/session.mjs:72-82 | tests | med | fix-now | fold into current phase — make the double Pi-faithful (`setModel` re-derives + emits `thinking_level_select`, per `agent-session.js:1206,1304`), add the model-only AC8 case, assert the settle sequence (not just the `setThinkingLevel` log), and add a `model_select` for the *applied* model arriving while the turn is in flight; two lifecycle mutants survive the current suite (own-switch arm removed → 45/45 pass; thinking restored before model → 45/45 pass) | yes |
| F3 | packages/pi-agentic-workflow/src/routing/dispatch.ts:242 | spec-drift + correctness | med | fix-now | fold into current phase — dispatch the name Pi resolves, not the bundle directory: Pi looks `/skill:<x>` up by frontmatter `name` with a directory fallback (`core/skills.js:243-245`) and passes an unknown key through unexpanded (`core/agent-session.js:960-963`), so `/skill:<dir>` silently sends literal text for any skill where `name !== dir`; latent today (all 34 bundled skills aligned — verified); fold must flip `test/alias-coverage.test.mjs:115-130` and the `/skill:<dir>` wording in SPEC.md:495-505 / TASKS.md:36, citing this Pi evidence (the assertion encodes a factually wrong assumption about Pi, it is not being relaxed to pass) | yes |
| F4 | packages/pi-agentic-workflow/src/settings/console.ts:269-278 | correctness + security | high | fix-now | fold into current phase — `clean()` elides every inherit-only route and the `"stop"` policy from the draft, so an explicit `inherit` override or an explicit `stop` chosen by the operator is dropped while the other scope declares a value, and the console still reports "saved"; reviewer probe: project file written `"{}"`, effective route still `{"model":"openai/gpt-5.2","thinking":"high"}`; effective `onUnavailableRoute` still `inherit` after saving `stop` (fail-open on the fail-closed policy); AC10 unmet on both paths | yes |
| F5 | packages/pi-agentic-workflow/README.md:126-133 | brand + docs | med | fix-now | fold into current phase — 4 of the 5 quoted refusal strings exist nowhere in `src/` (`grep -c` = 0); real templates are `dispatch.ts:138,145,157,190,212`; TASKS.md:60 claims the table is "keyed to the exact refusal messages the code emits"; fix both siblings in the same commit (EN `README.md:126-133` + ES `README.es.md:130-139`) per the bilingual hard rule | yes |
| F6 | packages/pi-agentic-workflow/README.md:108-112 | docs | low | fix-now | fold with F1 — "The model and thinking level you had before it are restored" is AC8, which F1 shows is not guaranteed for a model-only route; becomes true once F1 folds, otherwise qualify the sentence in both languages (`README.es.md:112-117`) | yes |
| F7 | packages/pi-agentic-workflow/src/config/load.ts:51-57 | security | low | fix-now | fold into current phase — `readIfExists` collapses "cannot read" (EACCES/EISDIR) into "absent", so a present-but-unreadable config routes on `inherit` instead of refusing, contradicting this module's own rule at lines 14-18; `src/settings/store.ts:13-20` already distinguishes ENOENT from other errors on the same file — align the loader and record it as an `invalid-config` refusal | yes |
| F8 | packages/pi-agentic-workflow/src/routing/catalogue.ts:44 | code | low | fix-now | fold into current phase — the two scanners disagree on the default for a missing `user-invocable` key: runtime `value !== "false"` (callable) vs build-time `value === "true"` (not callable, `scripts/bundle-skills.mjs:60`); latent today (all 35 skills declare the key — verified) but it is the "what is callable" boundary the "two scanners, pinned" decision (decisions.md) relies on | yes |
| F9 | packages/pi-agentic-workflow/src/settings/view.ts:30 | code | low | fix-now | fold into current phase — `total` is computed and never read; same sweep: unused `catalogue` binding at `src/extension/index.ts:78` and unused type import `ModelRef` at `src/settings/console.ts:15` (`npx tsc --noUnusedLocals --noUnusedParameters` → 3 × TS6133) | yes |
| F10 | packages/pi-agentic-workflow/src/settings/console.ts:19 | code | low | fix-now | fold into current phase — `SettingsUi` is declared verbatim twice (`src/routing/types.ts:48-53` and here; AGENTS.md "Don't repeat yourself"); `SettingsHandler.loaded` (`src/extension/factory.ts:36,96`) is computed on every console open and never consumed — `runSettingsConsole` re-reads with its own loader | yes |

## Fold receipt — 2026-08-29

All ten rows were fix-now and all ten were repaired in-unit; no row was
reclassified, postponed or traded off. Gate: `cd packages/pi-agentic-workflow &&
npm test` → exit 0, **106 pass / 0 fail** (was 94; +12 tests written for these
repairs, all of them red before the fix).

| Row | Repaired in | What the fold had to get right |
|---|---|---|
| F1 | `src/routing/dispatch.ts` `settle()` | the level is restored whenever the turn *touched* the session, not only when the route named one |
| F2 | `test/helpers/session.mjs` | the double now performs Pi's `setModel` thinking re-derivation and no-op guard; the lifecycle is asserted as an ordered sequence |
| F3 | `src/routing/dispatch.ts` + `test/alias-coverage.test.mjs` | the wire value is the frontmatter name; the fixture that pinned the directory was flipped against Pi's `_expandSkillCommand`, not relaxed |
| F4 | `src/settings/console.ts` `clean()` | elision is by emptiness, never by comparison with a shipped default |
| F5 | both `README*` troubleshooting tables | every quoted fragment now comes from the source that builds it, and a test reads the tables back against `src/` |
| F6 | both READMEs | prose re-verified against `settle()` after F1; the model-switch moves the level, and says so |
| F7 | `src/config/load.ts` | unreadable ≠ absent: a read failure on a path that exists becomes a problem, and AC12's invalid-config refusal |
| F8 | `src/routing/catalogue.ts` | `user-invocable` must say `true`, matching CLAUDE.md and the bundler; a fixture now pins what absence means |
| F9 | `src/settings/view.ts`, `src/extension/index.ts`, `src/settings/console.ts` | the computed count is used; no dead binding, no dead type import |
| F10 | `src/settings/console.ts`, `src/extension/factory.ts` | one `SettingsUi` declaration (in `routing/types.ts`), and the console reads its own config instead of receiving a stale copy |

Mutation re-check after the fold: the two mutants the review proved surviving
(drop the own-switch discriminator; restore thinking before the model) are now
**killed**, and five new rules added by this fold are each killed too — F4 policy
elision, F4 inherit-only elision, F7 unreadable-collapses-to-absent, F8
missing-key-defaults-public, F9 ignored computed count. 21 mutants run across the
unit, 21 killed.

Still open, unchanged: the live model-backed routed turn (manual checklist items
1–6 in the review table) — the provider usage limit that blocked it is not
resolved by this fold.

## Pass 2 — receipt, and what the fold left open

Pass 2 ran on `8d97689d` in a context that did not write the fold: **REVIEW-FAIL**,
10 pass-1 rows verified repaired, 8 new rows. Folded in `9bdb2cd5`: N-1 (adapter
coverage), N-2 (`inFlight()` given a consumer, unused-symbol flags enabled), N-3
(clamped level), N-4 (operator release of the latch), N-5 (tally is now
`npm run mutation`, 21/21 accounted, 0 survived), N-6 (stale doc counts), N-7
(`dist/` untracked, `prepare` builds it).

**Not folded, with the reason** (pass 2's N-8 batch — six rules its own mutants
showed the suite cannot see): the no-prior-model restore branch, a duplicate name
reported *and* registered, the frontmatter scanner's closing `---`, the read-only
summary's `unavailable:` line, `saveConfig` writing the draft before `clean()`, and
a thinking-only route touching the model. Each is a one-line assertion away; none
changes shipped behaviour, and the unit's phase budget is spent — they go to
`known-issues.md` with the pass-2 mutant ids so the next change to those files
picks them up rather than re-deriving them.

Pass 3 is the owner's call: the branch HEAD now differs from what pass 2 saw.
