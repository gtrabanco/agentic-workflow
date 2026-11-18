---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(audit): the session journal as a corpus carrier, and the Journal signals dimension (issue #616)

The workflow read every findings ledger and no journal. `docs/LOGS.md` and the
pending `.agentic-workflow/journal/` fragments recorded the corrections a session
had to make, the sessions each unit consumed and the findings reviewers refuted —
and none of it reached an audit, the findings corpus or the coverage-gap sweep.

`scripts/journal-corpus.mjs` is that carrier, deterministic and read-only. It
emits the `journal-corpus@1` receipt with three signals and decides none of them:
the corrections count per class, where a class is the corpus row the line's own
bytes resolve (an unresolved correction is `unjoined`, with its reason) and never
a lexical guess; the sessions each unit consumed, with no thrashing threshold
shipped; and the admitted false positives, cross-joined to the corpus row so one
finding cites both carriers. Every row carries its `file:line` and a digest of its
own bytes, the join is the corpus's own `buildCorpus`, and the phase a recurring
class should have been caught in comes from `phaseOfAxis`/`PHASE_DESTINATION` —
exported instead of copied. Neither carrier present is `insufficient-input`, never
a vacuous clean. `scripts/product-audit-journal-fixture.mjs` writes seeded/clean
twins, so the pass-only-if contract is demonstrated on a throwaway tree.

product-audit's `Journal signals` dimension consumes that receipt in its producer
pre-pass: the counts, the join cardinality and the phase are the receipt's, and
the model's remainder is exactly the named agent-error class and the why behind a
rework cluster. Every journal finding routes through the existing
`finding-route@1` hand-off, and a journal row resolving onto a corpus row is one
finding citing both carriers. The dimension joins the evolution gate's frozen set,
so a later change cannot drop it in silence.

The literature bounds the design and this release note repeats none of its
measurements: whole-trace judging is neither affordable nor accurate enough
(TRAIL, Who&When, When Agents go Astray), derived aggregates are the carrier
(What Resolve Rate Hides), error classes shift predictably across stages
(CodeTracer), and a finding must route to an actionable hand-off (AgentDebug).
