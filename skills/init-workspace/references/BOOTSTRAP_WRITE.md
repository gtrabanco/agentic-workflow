## Write and verify the bootstrap

4. **Write the adapted scaffold.** Fill the `CLAUDE.md` placeholders (commands,
   the documentation map rows, architecture); keep `AGENTS.md`, the
   `features/_TEMPLATE` + `ROADMAP`, the `fix/_TEMPLATE` + `README`, and the
   `.github/` templates; keep `.agentic-workflow/hooks/` and activate only the
   adapters explicitly accepted in the interview; prune unused doc folders and
   map rows. Leave honest placeholders where the user hasn't decided — never
   invent values.
5. **Seed Normalized Repository State.** Copy
   `template/docs/workflow/REPOSITORY_STATE.md` to
   `docs/workflow/REPOSITORY_STATE.md` when it is absent. If the target already
   has one, leave it unchanged and report that discovery should refresh it.
   Explain that discovery freezes evidence before planning and only
   `resolve-repository-state` updates frozen facts.
6. **Offer architectural invariants.** Keep
   `docs/architecture/ARCHITECTURAL_INVARIANTS.md` from the template only when
   the project has long-lived architectural constraints. Explain that it is
   optional: an absent document means no project invariants are declared, not
   that the scaffold failed. If retained, add its documentation-map row and
   name the project's explicit architectural-decision authority.
7. **Install accepted agent safety hooks.** Keep the canonical policy and
   fullauto wrapper at `.agentic-workflow/hooks/`. For each accepted platform,
   activate only its repository config/example as documented in the hook pack.
   Run `bash .agentic-workflow/hooks/tests/test-command-guard.sh`; missing `jq`,
   an unknown payload, or an existing customized hook file becomes a residual,
   never a silent overwrite. Direct merges remain blocked; do not create a
   `.automerge` exception.
8. **Offer the workflow skills.** Propose installing them:
   `npx skills add gtrabanco/agentic-workflow` (note the SSH/local-path variant if
   the source is private). Don't install without a yes.
9. **State that reviews are self-contained; offer optional extras.** The
   workflow ships its **own internal review pack** (`review-code`,
   `review-security`, `review-verify`, `review-debt`, `review-design`,
   `review-a11y`, `review-brand`, `review-perf`, `review-seo`) — it installs
   with the skills and covers every review axis, so **no external review skill
   is required on any agent**. If the user wants platform-specific extras (a
   framework skill, a stack-specific security skill), record them in `CLAUDE.md`
   under a short "Optional review extras" note so `review-change` and
   `product-audit` run them **in addition** — never as a dependency. Don't
   install anything without a yes.
10. **Seed the urgency labels (feature 15, injection-safe urgency).** Create the
   two capability-gated GitHub labels `triage-issue` owns and applies
   (`skills/triage-issue/SKILL.md` is the sole owner of the name/color
   vocabulary — this step only seeds it, never redefines it):
   `gh label create urgent --color B60205 --description "Evaluate for
   interrupt-now — reaches the pause-vs-finish judge"` and
   `gh label create fix-next --color D93F0B --description "Head of the fix
   queue — never interrupts the in-flight unit"`. Create-if-missing: an
   "already exists" error from `gh label create` is treated as success, not a
   failure. Requires the forge remote/auth Step 0 already detected — if the
   forge is unavailable or the user declines forge setup, skip this step and
   list the two labels as a residual for the user to create manually later
   (never fail the whole scaffold on it).
11. **Report.** List what was created, which placeholders still need human input,
   the companion skills recorded/installed, the urgency labels seeded (or
   skipped, with reason), and the next step: `discover-repository-state` →
   `design-feature` → `plan-feature` → `execute-phase`.
