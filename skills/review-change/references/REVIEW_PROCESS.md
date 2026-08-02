## Process

1. **Findings engine.** No flag → run `review-implementation` once over the
   scope (isolated, per the *Isolation rule* above) → its classified decision
   table (fix-now / postpone / ignore / intentional-tradeoff), unchanged from
   before this mode existed. With
   `--adversarial N` → run the **adversarial multi-reviewer mode** below
   instead. With `--merge` → skip straight to that mode's fusion step (N
   findings tables pasted in, per the merge contract). Either way, everything
   from step 2 onward runs once, over the merged table, exactly as in the
   no-flag case.
2. **SPEC drift check (structural).** Locate the governing SPEC (feature or
   fix) and build a **per-criterion coverage table** — one row per acceptance
   criterion, no free-form comparison:

   ```
   | criterion | evidence (file:line or command run) | met | unmet | untouched |
   ```

   Then map each diff hunk to a criterion — or to `none`. Findings, axis
   `spec-drift`: (a) every criterion marked `unmet`/`untouched` that the unit
   claims delivered, and (b) every `none`-mapped hunk (work the SPEC never
   asked for — silent scope excess). Catching drift at a phase checkpoint is
   far cheaper than at the `audit-pr` merge gate. (No SPEC found → note it
   and skip.)
3. **Workflow-discipline check (mechanical, every review).** On the branch
   under review, verify and file findings under axis `workflow`:
   commits follow `<type>(<scope>): <summary>`; phase labels in touched
   planning docs are `P1, P2, …` (never `S1`/"Steps"); the phase's per-phase
   docs were updated (TASKS ticks, progress entry); no commit landed on the
   default branch; artifacts are in the project's declared docs language;
   **the tree is clean and the remote current** — run `git status --porcelain`
   (any tracked modification, code or docs, = a `workflow` finding: work is
   sitting outside the commits under review) and, when the branch has an open
   PR, `git fetch` + `git status -sb` (commits ahead of the remote = a
   `workflow` finding: the PR and CI are judging a stale branch). Both are
   **fix-now** — a review verdict on a branch whose real state isn't pushed
   is worthless. Run the greps/`git log`/`git status` — don't infer compliance.
4. **Applicable pack passes.** For each axis the matrix + footprint mark as
   relevant, run the workflow's own internal skill for it (`review-code`,
   `review-security`, `review-verify`, `review-debt`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — **isolated,
   per the *Isolation rule* above** (in-turn composition only as its stated
   inline fallback), each returning ONLY its fixed-format table + PASS|FAIL.
   **Skip the rest** and say which you skipped and why. The pack ships with the
   workflow, so an applicable pass can never be "missing".
5. **Optional extras.** If the project recorded additional platform review skills
   (stack-specific linters, framework skills) and they are installed, run them
   **in addition** — their findings merge into the same table. Never treat an
   absent extra as a gap; the pack already covered the axis.
6. **Synthesize.** Merge all findings into **one** decision table, deduped by
   `file:line`. Keep `review-implementation`'s columns (Sev, Class, WHY, impl risk,
   long-term impact, premature-opt?, route) and add an **Axis** column — plus a
   **`Reviewers n/N`** column when running in `--adversarial N` mode (omitted
   entirely in the default single-reviewer case).
7. **Manual-verification checklist.** List what automated review **cannot** confirm
   and a human must check — visual correctness, real-device/locale behavior, UX
   feel, perf under load, anything marked *verify*. Be explicit so the dev has zero
   doubt about what to eyeball.
8. **Triage everything not fixed now.** For **every** finding you don't route to
   `fix-now` (postpone / ignore / intentional-tradeoff), run it through
   `triage-issue` (compose in-turn — i.e. within this same conversation/run; equal
   tier) to decide and record its home: a
   tracked issue with a trigger, a documented decision (`decisions.md` / a comment),
   or a justified drop. **No non-fix-now finding may end without a destination** — the
   point is to never silently lose one, and to catch the few that actually deserve an
   issue or a doc note.
