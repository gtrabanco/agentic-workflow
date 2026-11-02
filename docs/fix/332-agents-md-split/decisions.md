# Decisions — fix/332-agents-md-split

The question ledger (`open-questions@1`, the grammar `scripts/needs-input.mjs`
reads), the resolutions this unit recorded, and the design-time defaults it took
instead of asking. Append-only: a superseded entry gets a new row naming it.

open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q1 | 2026-11-01 | open-question | Proceed with #332 while it carries `human-revision-needed` and its sequencing partner #319 is still open? | The label blocks all planning and implementation by the repository's own rule, and #319 edits the same file, so a parallel diff would collide | `gh api repos/…/issues/332` → labels `promoted` + `human-revision-needed`; `gh api repos/…/issues/319` → state `open`; `AGENTS.md` §Working rules; the 2026-10-30 issue comment "mientras esté puesto no se planifica ni se implementa nada, y solo tú puedes quitarlo" | A — the owner clears the label and lands #319 first, then this unit starts \| B — the owner waives the hold for this session and the waiver is recorded in the unit doc \| C — stop, state report only | unit-lane
Q2 | 2026-11-01 | open-question | Which scope is frozen for this unit: the issue body's relocation only, the body plus the owner's marked revision items, or the body plus the template defects only? | The body freezes "relocation, not a re-authoring" and puts machine-table moves out of scope, while the 2026-10-30 revision comment marks P1, P2, P4-P10 and T1-T7 as in-unit — two mutually exclusive requests, and `S1..Sn` cannot be cut from both | `gh api …/issues/332/comments` → the 2026-10-30 report and its plain-language twin, with the checkbox state of every item; the issue body §In scope / §Out of scope | A — body only, relocation plus index and parsers \| B — body plus the marked P1, P2, P4-P10 and T1-T7, with P3 pending \| C — body plus the template defects T1-T7 only | design
Q3 | 2026-11-01 | open-question | Which instruction-precedence ladder does the core guide state (revision item P3)? | Nothing in the tree orders prompt versus personal `~/AGENTS.md` versus project guide versus docs, and the line cannot be written without a choice | `rg -n 'precedence ladder' AGENTS.md README.md docs/workflow` → no hit; `docs/fix/agents-md-single-agent-guide/decisions.md` D1 settles one-guide-per-repo, not which file wins | A — prompt > nearest `AGENTS.md` > personal `~/AGENTS.md` > docs \| B — prompt > personal > project > docs \| deferred — its own issue later | design
D1 | 2026-11-01 | decision | Q1 | human-owner | `ask 8f12957a-bc81-4d13-a9b4-1389eb7ecfc2` answered `stop` that turn; the owner then removed the label and re-issued the work order (this unit's L1), and #319 closed — verified before the branch was cut: `gh api …/issues/332` → labels `promoted`; `gh api …/issues/319` → state `closed` | A — the prerequisites were met by the owner, so the unit starts on the default variant | B — no waiver was used: the hold was removed by its owner, which is the only route the rule allows |
D2 | 2026-11-01 | decision | Q2 | human-owner | `ask 8f12957a-…` answered `body-marked` — the frozen request is the issue body plus every revision item marked `[x]` (P1, P2, P4-P10, T1-T7), with P3 answered by D3 | B — body plus the marked revision items | A and C: discarded — the first leaves the marked template defects unrepaired and the second drops the five rule lines the owner asked for |
D3 | 2026-11-01 | decision | Q3 | human-owner | `ask 8f12957a-…` answered `A` | A — prompt > nearest `AGENTS.md` > personal `~/AGENTS.md` > docs | B: discarded — a personal guide outranking the repository's own guide would let a stale local file overrule the contract every session on this repo depends on |

## Assumptions

Cheap defaults taken instead of asking, dated and correctable:

- **A1 — 2026-11-01** — the three machine-table blocks stay in `AGENTS.md`. Source:
  the issue's own default ("they are the normative home of the gates … only the
  prose blocks move") and its open question leaving the move to review. Effect:
  `GUIDE_REL`, the `homes` scan, the `finding-mark` row, the `ask-dont-infer-rule`
  row and the turn-contract receipt row all stay untouched. Moving them instead
  buys 101 lines and still misses the criterion (A4) while re-pointing six pins.
- **A2 — 2026-11-01** — both reference docs live under `docs/workflow/`
  (`SKILL_AUTHORING.md`, `PACKAGES.md`). Source: the issue's "Decide at design
  time against the documentation map". `docs/workflow/README.md` already owns the
  pages index and `scripts/workflow-docs-index.test.mjs` fails closed on a file
  without a row, so the new docs are indexed by construction; `docs/reference/`
  would be a new top-level folder with no owner row. Correctable by moving two
  files plus their index rows.
- **A3 — 2026-11-01** — the copied template states its rule generically and names
  no dated internal id (`feature 61`, `issue #308`, `D-40-14`); the grammar block
  ids (`spec-requirement@1`, …) stay, because they are the contract, not a date.
  Source: S24's "Decide explicitly". Correctable per line, and a scaffold copied
  into an unrelated project cannot resolve `feature 61` anyway.
- **A4 — 2026-11-01** — S7's `AGENTS.md ≤ ~120 lines` is pinned as **prose core ≤
  120 lines** with the three machine blocks counted separately. Source: measured
  arithmetic in the SPEC's `## Impact` — the in-scope prose core alone is 142 lines
  before the new sections and the tables add 101, so no variant of the issue's own
  scope reaches 120. Reported to the owner as a deviation, never self-approved;
  shrinking rule semantics to hit the number is the defect class the no-shim rule
  exists to stop.
