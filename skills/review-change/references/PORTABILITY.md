## Portability (agents other than Claude Code)

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where this skill says `/<skill>`, open that
  skill's `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.
  "Compose in-turn" means the opposite: run that step within this same
  conversation, as part of this review.
- **Default-pass isolation** — the *Isolation rule* uses the same three spawn
  tiers as `--adversarial N` (subagents / headless / fresh conversations); an
  agent with none of them runs the documented inline fallback: sequential
  in-turn passes, each reduced to its findings table before the next starts.
- **No per-skill `model:`/`effort:`** — on the `#claude` branch the frontmatter pins these tiers; here, pick tiers yourself:
  this review needs your **strongest** model. Never review a change with a
  model weaker than the one that wrote it — and prefer a different model family
  than the writer's: same-family instances share training blind spots,
  cross-family decorrelates errors.
- **`--adversarial N` spawn tiers** — Claude Code subagents (tier 1) and
  headless invocation (tier 2) are conveniences; an agent with neither runs the
  tier-3 fallback of N **sequential fresh conversations**, each context-clean
  and diff-only, then fuses their findings by hand per the synthesis contract
  above — slower, never a reason to skip the mode. **One source, two
  wrappers:** the pro path invokes `--adversarial N` / `--synthesize` and this
  skill runs the contracts itself; a manual orchestrator without either flag
  pastes the two blocks below into fresh conversations by hand — both render
  the exact same reviewer/synthesis contract, never a second, drifting copy.

  **Reviewer-prompt paste block** (one per reviewer, in a fresh conversation;
  fills `<i>`/`<role name>`/`<scope>` from the fixed role set and N ladder
  above — this is the reviewer contract, quoted verbatim):

  ```
  ROLE: R<i> — <role name, from the fixed set above>
  SCOPE: <diff-only — the branch diff vs the default branch, or the passed path/glob>

  You are reviewer <i> of N in an adversarial multi-reviewer review. Assume the
  diff is wrong until proven otherwise. Your role orders where you look FIRST —
  it is an attention priority, not an exclusive scope: the full applicable
  finder checklists stay mandatory. Flag anything wrong, not only findings
  inside your role.

  Return exactly:
  | file:line | axis | Finding | Sev | Evidence |
  |---|---|---|---|---|
  <one row per finding — empty table if none>
  ```

  **Synthesis-prompt paste block** (one fresh conversation, after collecting
  all N reviewer tables above — this is the synthesis contract, quoted verbatim):

  ```
  You are fusing N independent adversarial review tables into one. Given the N
  pasted findings tables below (each already in the reviewer contract's fixed
  format):
  - Dedupe by file:line + axis; identical findings from multiple reviewers
    collapse into one row.
  - Add a `Reviewers n/N` column: how many of the N flagged it.
  - Inclusion threshold = ≥1 reviewer — a finding any single reviewer raised
    enters classification normally; no majority/quorum gate.
  - Forbidden — never: drop a finding, downgrade its severity, reclassify it,
    or re-litigate whether it's real. Fusion only — disputes happen in
    triage, not here.
  - Externally-produced reviews are accepted only if already in the fixed
    table format.

  <N pasted findings tables go here>

  Return the merged table, then continue through the rest of review-change's
  process to the fixed report ending `Decision: REVIEW-PASS | REVIEW-FAIL |
  NEEDS-DECISION`.
  ```
