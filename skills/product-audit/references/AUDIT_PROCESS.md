## Process

1. **Map & decide axes** — Step 0; mark each dimension applicable / n-a.
2. **Sweep code & axes** — run the applicable axes across the codebase: compose
   `review-implementation` plus the internal review pack's applicable passes
   (each returns its fixed-format table + PASS|FAIL), and any optional installed
   extras. Classify findings (severity + fix-now / postpone / tradeoff).
3. **Audit process & docs** — incomplete phases (`progress.md`/`TASKS.md`), aging
   open issues, **solvable known-issues** (trigger now met), doc-map completeness
   (compose `audit-docs`), missing/optimizable workflow docs, and **capability
   inventory freshness**: cross-check `docs/CAPABILITIES.md` against the code —
   roles, permissions, or cross-cutting subsystems present in the code but
   missing from the inventory (or vice versa) are a Process & docs finding
   (`design-feature`'s Integration closure is only as good as this file). If
   the project has no inventory file, propose seeding it from the template —
   a finding, never an auto-fix.
4. **Mine accumulated suggestions** — read every feature folder's `decisions.md`,
   `known-issues.md`, and `architecture-notes.md`; extract deferred items, open
   questions, and recorded debt. Cluster duplicates across features.
5. **Sweep installed tooling** — (a) inventory the installed skills and
   connected MCP servers available to the agent; (b) cross-reference each
   against the applicable review axes and the roadmap features; (c) classify
   each as **register** (useful, not yet named in the project's `CLAUDE.md`),
   **re-design** (would change a feature's definition/scope), or
   **not-relevant**; (d) dedupe against what `CLAUDE.md` already registers —
   only unregistered/relevant items survive into proposals. If the agent
   cannot enumerate its installed skills / connected MCPs, say so plainly
   (no silent caps) rather than inventing an inventory.
6. **Synthesize proposals** — turn findings + mined items into four concrete,
   deduped, severity-ranked streams:
   - **Issues to open** — bugs, debt, security/perf items worth tracking.
   - **Roadmap: add** — features/capabilities the evidence now justifies.
   - **Roadmap: remove or revise** — features that are obsolete, superseded, or no
     longer make sense.
   - **Tooling: register or re-design** — unregistered-but-useful tooling to add
     to `CLAUDE.md`, or a discovered skill/MCP that would rescope a feature.
7. **Number the findings.** Assign every finding in the severity-ranked list a
   sequential id `F1, F2, …` — **one single `F` sequence for the whole audit**,
   in ranked order, regardless of dimension. Never use a different letter per
   dimension or per severity; `F` is the only prefix. Proposals reference the
   finding ids they derive from (`from: F3, F7`).
8. **Persist the report** (the only mutation this skill makes):
   - Compute the audit id: `mkdir -p docs/audits`, then next id =
     highest `<n>` among existing `docs/audits/<n>-*.md` files + 1 (first audit
     → `1`). Plain incremental integer, no zero-padding.
   - Write the full report (the exact fixed format below) to
     `docs/audits/<id>-<YYYY-MM-DD>.md` (today's date).
   - Commit it on the current branch with
     `docs(audits): product audit <id> <YYYY-MM-DD>` (and push if the project's
     conventions push on commit). If the working tree carries unrelated
     uncommitted changes, stage **only** the report file.
9. **Report** — print the same report in chat. Recommend; do not act: filing
   the proposed issues is `triage-issue`'s job (suggest it, never run it).
