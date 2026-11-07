# Decisions — fix/440-product-audit-rescope

Decision log for the post-freeze correction batch. The frozen decisions live in
the unit doc's `## Log` (`D`/`P` lines); this file carries the path-protection
records the correction batch requires and the decisions behind them. Append-only.

## Decision log

| ID | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D-440-1 | Fold the external verify's six blockers as one correction batch (2026-11-07): sweep the retired periodic cadence out of every live instruction surface — `skills/product-audit/SKILL.md` (the relationship diagram's `(product-wide, periodic)`), `skills/audit-pr/SKILL.md`, `skills/review-change/SKILL.md`, `docs/workflow/README.md` ×2, `docs/workflow/PORTABLE_PROMPT.md` — and mechanize the class with a literal sweep in the unit's own suite | Leave the mentions as recorded findings (rejected: the owner directed the repair — "Todos los findings parecen legítimos, arreglalos"); a semantic "does this line describe product-audit's cadence" parse (rejected: the drift gates of this repo read versioned grammar and fixed literals, never a sentence) | The blockers are one root cause — the F51/F53 class the unit's own retirement bullet promised to close and did not. A literal list of the exact retired-cadence claims fires on the six survivors and stays quiet on unrelated `periodic` usages (`audit-docs`' run cadence, `triage-issue`'s deferred-tradeoff re-confirmation, another skill's hygiene note), which is the stability property the verify command demands of a reproducer. |
| D-440-2 | Keep the three historical surfaces as advisories, unedited: `docs/workflow/MIGRATION.md` (dated install snapshot), `docs/design/REDESIGN.md` (dated design note), `docs/features/09-…/SPEC.md` (historical unit doc) — and name the exemption in the sweep's own source | Sweep them too (rejected: rewriting a dated record falsifies the history it carries, the same class as the frozen-receipts exemption the invocation-drift gate gives `docs/workflow/REPOSITORY_STATE.md`) | The rule retired by S4 is about the cadence a user is *ordered* to run; a snapshot stating what was installed on 2026-07-31 states no order. |
| D-440-3 | Qualify the unit doc's `## Retirements` route-cell bullet to the finding-line grammar instead of changing the proposal-stream route cells | Rewrite `SKILL.md`'s four proposal-stream `route:` cells to bare verbs (rejected: S6 keeps the proposals-only contract and the closing `→ Next:` block is the concrete invocation surface; a proposal's route cell names the command that files it — that is the stream's own shape since #355, never the finding-line grammar S5 re-scoped) | Advisory 4 of the verify: the bullet's literal `route: /triage-issue <id> F<k>` survives where it was always meant to survive; the text that claimed otherwise was the defect, not the bytes. |
| D-440-4 | Correct E10's recorded figures with an appended `E` line, never by editing E10 | Edit E10 in place (rejected: the `## Log` is append-only — a correction appends, it never rewrites a receipt) | Advisory 6 of the verify: `bun scripts/test-impact.mjs --base main` was run before the last commits landed, so its path/suite counts are stale; the verdict (`targeted`, exit 0) and O10's validator both reproduce. |

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/product-audit-rescope.test.mjs | P1 | 2026-11-07 | execute-phase | The external verify's six blockers share one root cause: the cadence retired in this unit survived as a live assertion on five sibling surfaces. P1 is the phase that owns this suite's pins, so the new sweep case lands here — a new discriminating case over the live tree, committed red before the prose fix and observed green after; no existing case is relaxed, deleted or narrowed.
approval | scripts/product-audit-rescope.test.mjs | P1 | 2026-11-07 | human-owner | Owner instruction 2026-11-07 (external-verify correction round), verbatim: "Todos los findings parecen legítimos, arreglalos" — an explicit, recorded owner order authorizing the protected-suite edit that mechanizes the blocker class the external verification reported.
justification | skills/product-audit/SKILL.md | P2 | 2026-11-07 | execute-phase | Blocker 1 (O1's stated outcome did not reproduce): the relationship diagram still reads `(product-wide, periodic)` two lines under the header that declares the cadence retired, and the unit doc's own retirement evidence (`rg -n "Periodically|periodic" skills/product-audit/`) contradicts it. The repair is the one adjective the trigger grammar already uses; no new behaviour, no vocabulary.
```
