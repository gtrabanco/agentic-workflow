## Adversarial merge

**Merge contract (single source).** Collect all N reviewers' classified
findings tables — each already in the reviewer contract's fixed format above
(a `provenance` note records which reviewer/source produced each row) — and:

- **Dedupe by `file:line` + axis** (two genuinely different findings on the
  same line, different axis, stay separate). Identical findings from multiple
  reviewers collapse into **one** row.
- Annotate each merged row with a `Reviewers n/N` column — how many of the N
  flagged it — as a confidence signal.
- **Inclusion threshold = ≥1 reviewer.** A finding any single reviewer raised
  enters classification normally; there is no majority/quorum gate to include a
  finding — a real defect only one sharp reviewer caught must not be dropped.
- **Forbidden — never**, while merging: dropping a finding, downgrading its
  severity, reclassifying it, or re-litigating whether it's real. The merge
  step's only job is fusion; disputing a finding's validity happens later, in
  the normal triage steps (2–10) that consume the merged table — never during
  the merge itself.
- **Externally-produced reviews** (not spawned by this run) are accepted into
  the merge **only if they already arrive in the reviewer contract's fixed
  table format**. Normalizing free prose into that format is the contributing
  conversation's job, not the merge step's — it converts to the table first.
- The merged table then flows through the unchanged steps 2–10 above, producing
  the same fixed-format report + `Decision: PASS | FAIL`.

**`--merge` mode.** `/review-change --merge` is the direct entry point for the
merge contract above — it starts **at the fusion step**, skipping the N-reviewer
spawn: pass it N pasted findings tables (each already in the reviewer
contract's fixed format), and it runs the merge contract, then the unchanged
steps 2–10, to the same fixed report ending `Decision: PASS | FAIL`. This is
how a manual orchestrator — one that ran the N reviewer conversations by hand
via the Portability paste blocks — hands the results back to this skill for
fusion, without re-authoring the dedupe/threshold/forbidden rules itself: the
mode consumes the single merge contract above, never a second copy of it.

**Cadence — once per unit.** The adversarial run (spawn or `--merge`) happens
**once per unit, at the mandatory terminal `review-change`** (the pass before
`Hardening & PR` — see *Review checkpoint & finishing a unit* in
`execute-phase`), where the recommendation checklist above is evaluated. The
one stated exception, not a cadence of its own: a phase touching a sensitive
surface (auth, payments, destructive migrations, secrets, CI config) may earn
an **early** adversarial pass scoped to just that phase's diff — still a
single extra event, not a recurring checkpoint. **Boundary with `#77`** (the general review-checkpoint cadence redesign):
this section owns *where* the adversarial mode runs (the terminal review, plus
the sensitive-phase exception); `#77` owns the general every-N-phases
checkpoint interval — neither issue's change edits the other's sentences.
