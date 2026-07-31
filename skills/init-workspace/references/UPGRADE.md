## Upgrade mode

Entered when Step 0 finds an existing **agentic-workflow scaffold** (not a
bare or foreign repo). Bootstrap mode (the Process section above) never
engages here — upgrade mode reuses the same discovery + interview machinery,
scoped to **only the blocks the current template has that this project
lacks**. Seven ordered steps:

1. **Locate the current template.** Fetch the current `template/` the same
   way bootstrap does — `npx degit gtrabanco/agentic-workflow/template <temp-dir>`
   (always into a temp dir here, never into the target); the SSH/local-path
   variant applies verbatim for a private source.
2. **Diff the substrate.** Compare the project's `CLAUDE.md` (and the `docs/`
   blocks its documentation map references) against the fetched template.
   Produce the list of blocks/conventions the template carries that this
   project's substrate lacks, or still holds as a raw, unfilled placeholder —
   e.g. a `Docs site` block, a `Performance commands` block, a `Git workflow`
   line, the five-state roadmap `Status legend`, the capability inventory
   (`docs/CAPABILITIES.md` + its documentation-map row), the optional
   architectural-invariants document
   (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` + its documentation-map
   row), the portable command-guard pack and detected platform adapter, or the Normalized
   Repository State ledger (`docs/workflow/REPOSITORY_STATE.md`). This is the
   diff-against-current-template contract; it is the only source of *what's
   new*. (A missing `docs/CAPABILITIES.md` is proposed with the same
   discovery-seeded defaults bootstrap's interview uses — never as the raw
   template. A missing repository-state ledger is proposed from the template
   without overwriting any existing ledger.)
3. **Read `docs/workflow/MIGRATION.md`.** For each missing block, pull its
   dated migration note so the proposal explains *why* the block exists and
   *what* it migrates. If `MIGRATION.md` is absent, proceed on the template
   diff alone and say so in the report — never block on a missing note.
4. **Propose only the missing blocks — one short, batched interview round.**
   Each item is the block, a discovery-based default (the same detection
   bootstrap mode already runs — e.g. `astro.config.*` + Starlight ⇒ `Docs
   site` default, Biome ⇒ the complexity-lint slot, the remote URL ⇒ forge),
   and the `MIGRATION.md` rationale when available. The user accepts, edits,
   or skips each block. **Never re-ask what the project already answered** —
   a block that's already filled is skipped, not re-interviewed.
5. **Write additively.** Insert accepted blocks, including a missing
   `docs/workflow/REPOSITORY_STATE.md`; fill raw, still-placeholder
   blocks with the confirmed values. **Never rewrite a block the project has
   already tailored, and never delete anything** — a tailored block the
   template also changed is left untouched and listed as a residual, not
   silently updated. For hooks, add the canonical pack when absent and activate
   a platform adapter only after an explicit yes; never replace an existing
   platform hook config. Leave honest placeholders where the user skipped.
6. **Seed missing urgency labels, additively (feature 15).** Independent of
   the `CLAUDE.md`/`docs/` block diff above (this is forge-repo state, not a
   doc block): check whether the target repo already has the `urgent` and
   `fix-next` labels (`gh label list`); create whichever is missing with the
   same `gh label create` calls bootstrap mode uses (see Process step 9) —
   never touch a label that already exists (additive-only, same never-clobber
   rule as the doc blocks; a pre-existing `urgent`/`fix-next` label the
   project recolored or redescribed is left exactly as-is).
7. **Report + hand off.** Summarize blocks added, filled, and skipped
   (residuals), the urgency labels seeded (or already present), then print the
   recommendation to run `product-audit` next to see which newly-available
   *capabilities* apply to the code (upgrade mode migrates the substrate only,
   never the code).

**Failure edges — handle each explicitly, never silently:**

- **No drift.** The diff (step 2) finds nothing missing or placeholder-only →
  skip the interview entirely and report **"substrate current, nothing to
  migrate"**. Never fabricate a block to propose just to have something to
  show.
- **`MIGRATION.md` absent.** An older install may predate this file → proceed
  on the template diff alone (step 3 already covers this) and say so plainly
  in the proposal and the final report: rationale was unavailable, the block
  list is still complete.
- **A block the project already tailored.** If the current template also
  changed a block the project customized, **do not merge, diff-patch, or
  overwrite it** — leave it exactly as the project has it and list it as a
  residual in the report (step 5's never-clobber invariant). The user decides
  separately, via an explicit bootstrap adapt-in-place run, whether to
  re-tailor it.
- **Bootstrap stays unchanged on a bare or foreign repo.** If Step 0's
  scaffold markers (`CLAUDE.md` + `docs/features/ROADMAP.md` or
  `docs/workflow/`) are absent — no repo, an empty repo, or a `CLAUDE.md`
  that isn't this workflow's — upgrade mode never engages; the existing
  bootstrap Process (merge/adapt/abort) runs exactly as before this mode was
  added.
