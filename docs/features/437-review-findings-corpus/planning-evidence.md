# Planning evidence — 437 review-findings-corpus

Frozen at the cut by the substituted plan step (row shape owned by
`skills/pre-execution-review/references/LEDGERS.md`; the column order is the
one `skills/unit-lane/references/PLAN.md` publishes). Ids are stable: an
obligation cites a row by id.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The corpus is already substantial and measurable: 1147 `F` rows and 701 `VF` marks across 56 legacy `review-findings.md` ledgers, with 162 `REVIEW-RAN` marks and 729 rows reading `folded: yes` | `rg -c '^\| F[0-9]+ \|' docs --glob 'review-findings.md'` summed → 1147; `VF-` rows → 701; `REVIEW-RAN` → 162; `\| yes \|` → 729 (measured at the cut, `2a28f038`) | current | O1, O2, O19 |
| PE-002 | known | The migrated carrier is published but unexercised: 61 unit docs carry a `## Findings` section, every one of them empty, and no migrated `R`/`V` `## Log` line exists | `rg -l '^## Findings' docs \| wc -l` → 61; rows summed over those sections → 0; `rg -c '\*\*R[0-9]+\*\*' docs --glob '*/SPEC.md'` → 0 | current | O1, O2 |
| PE-003 | known | The only machine-readable finding→commit link is the `· fold <sha>` annotation (optionally `(ticked <sha>)`): 373 rows carry it, 172 distinct commits, 99 rows carry both halves | rows matching `· fold [0-9a-f]{7,40}` → 373; distinct shas → 172; `· fold <sha> (ticked <sha>)` → 99 | current | O3, O10 |
| PE-004 | known | The legacy ledger severity cell is **not** the published ladder — it carries `critical, high, major, med, medium, minor, low` — while the migrated carrier uses `BLOCKER, CRITICAL, WARNING, SUGGESTION`; the corpus must keep the raw token and normalize a band | distinct severity cells over legacy rows → the seven tokens above; ladder owner `skills/review-implementation/references/CLASSIFY.md` §"Severity ladder and impact" | current | O2, O3, O7 |
| PE-005 | known | Cycles are recorded as prose in the legacy carrier (`Cycle <n> — reviewed head <sha>`) and as a `cycle <n>` cell in the published `review-mark@1` / `R`-line grammar, so findings-per-cycle is computable without a new field | `rg -n '^Cycle [0-9]+ —' docs --glob 'review-findings.md'` → matches in 40+ ledgers; grammar `skills/pre-execution-review/references/LEDGERS.md` §"The durable review mark" | current | O15 |
| PE-006 | known | CIVER's two halves are already recorded in this repo's own words — "a finding is genuine if a targeted repair resolves it and the review stays stable under unrelated changes" — so the filter implements a recorded verdict rather than a remembered paper | `docs/research/papers-sweep-2026-11-02.md:91-99`; `docs/fix/358-adversarial-kill-mandate/SPEC.md:296` | current | O3, O4 |
| PE-007 | known | Staleness already has a mechanism: `scripts/scope-manifest.mjs` exports `NON_AFFECTING_PATHS` (`docs/LOGS.md`), `NON_AFFECTING_DIRS` (`.engram/`, `.pi/`, `.serena/`), `isNonAffecting`, `changedPathsBetween` and `scopeDigestOf`, and `review-receipt.mjs`'s `judgeReceipt` consumes them | `scripts/scope-manifest.mjs:61-85,117-190`; `scripts/review-receipt.mjs:113-160` | current | O12, O13 |
| PE-008 | known | This repository declares **no formatter** (no Prettier, Biome or EditorConfig), so a formatting-only delta cannot be classified deterministically | `AGENTS.md` §Normalizer inventory, `formatter` row → `none declared` | current | O13, O14 |
| PE-009 | known | The unattended notes ledger already exists with the shape a `nimio` note needs (`# <unit> — Known issues / deferred`, `| # | Item | Why deferred | Re-trigger |`) and has an owner in the durable-ledger map | `docs/features/01-generate-docs/known-issues.md:1-5`; `skills/pre-execution-review/references/LEDGERS.md` `known-issues` row | current | O8, O9 |
| PE-010 | known | A new script must land as a red commit (suite alone, observed failing) before its implementation commit, so the two files cannot be authored and committed together | `AGENTS.md` §Working rules, "A new script ships its sibling suite — red commit before green"; `scripts/red-first.mjs` | current | O18, O20 |
| PE-011 | known | The repo's script exit convention is `0` pass / `1` verdict-or-block / `2` usage error, with the fixed block on stdout and diagnostics on stderr — the three new readers follow it rather than inventing one | `scripts/diff-guard.mjs:1-18`; `scripts/prose-gate-inventory.mjs:37-47` | current | O11, O12, O19 |
| PE-012 | known | Attribution's destination exists and is machine-checked: `docs/workflow/GATE_INVENTORY.md` parses a `prose-gate-inventory@1` block whose rows carry `gate-id`, `carrier`, `tier` and `stay-reason`, and its validator refuses an uncited gate suite | `docs/workflow/GATE_INVENTORY.md:57-70`; `scripts/prose-gate-inventory.mjs:1-47` | current | O5, O6 |
| PE-013 | known | The corpus arithmetic can be checked against a second, independent reading of the same bytes: per-ledger row counts from `rg` equal the reader's per-unit counts, and a unit whose count differs is a parse defect | the measurement in PE-001, reproducible with the same `rg` invocation at any head | current | O1, O19 |
| PE-014 | assumption | The ARW numerator/denominator this unit can compute deterministically is folded findings ÷ distinct code surfaces named by the unit's findings; whether that equals the owner's 0.28 historical baseline is **not** established, so the reader reports both and the unit records the reading instead of claiming the baseline reproduced | owner: this unit (P3); basis: the issue's binding note names the ratio but not the numerator's source; sampled when `bun scripts/findings-corpus.mjs` first runs | current | O16, O17 |

## Unknowns carried, not cited

- The CIVER paper itself (`arXiv 2610.36010`) is not fetched by this unit: the
  repo's own sweep record (PE-006) is the authority for the two halves, and the
  issue's wording is quoted in S3. No claim about the paper's internals beyond
  that wording is made anywhere in this change.
- Whether a `fold` commit's diff *equals* the targeted repair: the reader proves
  the commit touches the named path; it does not prove the hunk is the repair.
  Recorded as the gate's stated bound (see `decisions.md` §D3).
