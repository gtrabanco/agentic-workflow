# known-issues — 28-evidence-grounded-spec-plan-review

No unresolved product or engineering decision blocks implementation.

## Known boundaries to preserve

1. **Out-of-band causal history** — content plus `artifactRevisionId` prevents
   resurrection only when every authoring write rotates the id. A direct edit
   and revert outside the authoring/runtime protocol is not observable from
   final bytes alone; documentation must not claim otherwise.
2. **Same-model reviewers** — clean context reduces authoring contamination but
   does not create model-family independence. Outputs must state the actual
   diversity used.
3. **JSON Schema authority** — structural projections cannot express all
   lineage, stage, digest, identity, and PASS semantics. Package runtime
   validators remain authoritative.
4. **Legacy evidence** — older planned/in-progress units have no compatible
   pre-execution receipt. They must be freshly reviewed; migration cannot
   coerce historical prose or candidate receipts.
5. **Context pressure** — broad skill changes risk oversized entrypoints. Move
   shared detail to progressive references/internal ownership and enforce the
   existing budget, without hiding mandatory rules from the selected route.
6. **Pi bundle sequencing** — feature 27 / PR #150 is merged and provides the
   canonical-to-Pi bundling/parity gate this feature must satisfy. Revalidate
   the bundle command at execution time and never hand-edit packaged copies.
7. **Effect size unknown** — this design should prevent categories of wrong
   work, but latency/token/rework improvement is unknown until canaries run.
8. **Cycle-count gaming** — a low cycle count is not evidence of quality when a
   reviewer is weak or findings are discarded. Union/counter-evidence rules and
   complete obligation closure remain authoritative; the second-cycle threshold
   is qualification evidence, never a PASS shortcut.
9. **Receipt authority is contractual at the skill layer:** a `spec-review-pass`
   receipt is validated for shape, stage and snapshot binding by the rules in
   `skills/review-spec/references/OUTPUT.md`; nothing in this repository can
   cryptographically attest that the turn which produced it was clean, only
   that it declared and evidenced the required context. Independence claims in
   an OUTPUT must therefore name the actual model and context used
   (`AC-REVIEW-002`).
10. **Ledger naming is a convention, not a schema constraint:** the snapshot
    binds `planning-evidence` and `obligations` by path and digest, so a unit that
    mis-names those files still validates. The skill contracts own the names
    (`planning-evidence.md`, `planning-obligations.md`, `planning-findings.md`, and
    the XS/S embedded headings per D20); `review-plan`'s L3–L6 checks are what
    catch a unit that invented a fourth home.
11. **Routing is enforced by contract text, not by a runtime validator:** the P4
    fixtures model the published decision tables (sensor labels, executor admission,
    autopilot order, fold routing) and pin them to the exact sentences that carry
    them, but nothing at runtime recomputes a `detail.pre_execution[]` row — the
    envelope keeps `detail` opaque by design, so a driver cannot schema-validate those
    rows. P5's canary runs the routes for real; a mismatch there is a defect in the
    tables, not in the fixtures.
14. **The pre-execution review gate cannot gate the unit that develops the
    reviewed skills (self-hosting):** `review-spec`, `review-plan` and
    `pre-execution-review` are repo text, not installed commands — no global
    skill, no pi command — so the receipts the gate demands are producible only
    by this unit's own in-development process. Unit 28 proceeds P6–P8 under
    owner decision D32 (2026-09-01); the gate text is unchanged, and its first
    non-circular exercise is feature 29's post-merge dogfood (per SPEC
    Post-merge, which also requires unit 29's missing `planning-obligations.md`
    to be built first — RS10). Closure: the skills shipped (item 12's publish
    precondition) **and** one consuming unit reviewed through them.
12. **The merge-time Pi release depends on an npm account record, not on this
    repository:** `publish-pi-package.yml` publishes whenever
    `LOCAL != PUBLISHED` (an equality-based skip, so it does **not** verify
    "newer than the registry"), and its own header records that the npm Trusted
    Publisher record for `@gtrabanco/pi-agentic-workflow` is still pending — so any
    version past `0.1.0` fails the publish step with `npm error 403 … OIDC
    permission denied`. AC10's release row and P8's PR step are therefore only
    satisfiable once that record exists on npm; a green merge with a red publish job
    is not a shipped package, and no ledger may claim otherwise.
13. **Obligation-cell pipes are unchecked:** the `M/L` ledgers are nine-column
    text tables with no parser between the writer and `review-plan`, so a cell that
    quotes a closed `|`-separated vocabulary (the `SPEC-REVIEW-PASS |
    SPEC-REVIEW-FAIL | NEEDS-DESIGN` set) silently shifts every later column of
    that row and still validates as bytes. Found as RS4 on rows O3/O4 of this unit.
    The contract's vocabularies are quoted with commas inside ledger cells; a strict
    column-count check over `planning-obligations.md` is the mechanical guard this
    boundary is still missing.

15. **The canary baseline is irrecoverable, so no savings or regression claim
    exists in either direction (measured note of #146's flow-integrity
    amendment).** The amendment requires the pre-amendment workflow baseline to be
    recorded before P1 lands; P1 landed on 2026-08-31, and the workflow it would
    have measured has not existed since. The canary rows therefore carry observed
    post-change fields or the sanctioned `not yet measured`, and every document
    that mentions effect must keep known-issue 7's wording ("effect size unknown
    until canaries run"). Adopting F1–F6 does not revive the baseline; the honest
    ceiling is that this unit can show its gates fire, never that they pay.
16. **Delegated qualification runs inherit the skill's own write contract, which
    points at real ledgers (F35).** A read-only-in-intent subagent given a toy
    target still follows `review-spec`'s instruction to create `planning-findings.md`
    and append a receipt to `progress.md`; told in prose alone to stay out of the
    repository, it wrote inside it and committed to the delivery branch. **P12 closed
    the part this unit owns (2026-09-01):** delegated work now has a named sandbox and
    the boundary is the contract's own text rather than an instruction beside it —
    `skills/evidence-grounding/references/DELEGATION.md` §"The sandbox" states in the
    role itself that a run which qualifies, probes or rehearses a skill writes only that
    copy's **toy ledgers**, that a run gathering evidence for a real unit writes exactly
    one real file (`delegated-evidence.md`) and commits nothing, and that a launch
    satisfying neither rule does not launch. That artifact is declared on the ownership
    map's `no-script-writer` directive (`LEDGERS.md:145`), so no script may write it
    either, and the map still carries exactly seven truth classes: it is a versioned
    artifact, not a ledger row. **Residual, stated rather than claimed away:** the fix
    is normative text a model obeys, plus a scan that only reaches scripts — nothing at
    runtime physically stops a delegate that ignores its contract from writing a real
    ledger, and no phase un-writes what earlier probes already committed. A probe still
    launches against a tree that can tolerate being written; the sandbox rule says which
    tree, not that enforcement is mechanical.
17. **An external memory-sync process commits into the delivery branch (not this
    unit's write).** Before P9 started, `336e0cfb chore: engram sync` landed on
    `feat/28-evidence-grounded-spec-plan-review` and put `.engram/manifest.json`
    plus a 213 KB `gzip`'d chunk under version control. Nothing in the unit asked
    for it, no skill owns it, and no gate of this repository wrote it — it is the
    same shape as finding F2 (an undeclared writer reaching a durable surface), only
    outside the ledger set the P9 map covers. Two consequences the owner decides,
    not the executor: **PR #155 must not merge with a binary memory blob in its
    diff** (`git rm -r --cached .engram` + a `.gitignore` rule, which is the
    repo-wide hygiene call already tabled as a proposal in `decisions.md`), and any
    later sync commit landing mid-loop must be identified before a phase commit so
    the phase sha stays single-concern. Recorded here rather than fixed silently:
    `.gitignore` is outside every phase of this unit, and an un-merge of someone
    else's tooling state is a repository decision.
    **Disposition applied 2026-09-02 (P16 fold, D47):** the fix this item itself
    names was applied — `.engram/manifest.json` and the chunk are untracked
    (`git rm -r --cached`) and `.gitignore` now excludes `.engram/`, so **PR #155
    carries no binary memory blob** (`git diff --name-only origin/main...HEAD`
    lists no `.engram` path). What remains, deliberately: the commit `336e0cfb`
    stays in branch history — rewriting a published branch to hide a third
    party's write is a larger repository decision than this unit owns — and the
    second consequence (identify a mid-loop sync commit before a phase commit so
    the phase sha stays single-concern) is now a standing loop duty, not a closed
    one, because any later sync lands the same way.

18. **Two restatements P14's inventory found stay unpinned (the internal-step count).**
    `docs/workflow/SKILLS.md:7` prints `**20 user-facing skills**` and
    `**17 internal steps**`. Only the first is a rendered fact the gate may pin:
    `rendered-facts@1` binds it to `count:user-facing`, which recomputes from
    `user-invocable: true` in each skill's frontmatter (20 of 39). The second has no
    machine predicate — 19 skills are not user-invocable, `bump-skill` is excluded from
    the distribution the same sentence describes, and "internal step" is an editorial
    category, not a frontmatter field — so pinning `17` would have meant inventing a
    rule and then calling the number evidence. Per the `rendered-facts@1` preamble the
    gap is recorded here rather than closed silently. **Re-trigger:** the first phase
    that declares an internal-step predicate in the machine surface (a frontmatter field
    or an inventoried table) pins `pattern:\*\*(\d+) internal steps\*\*` in
    `rendered-facts@1` and deletes this item; until then a change to that count is a
    docs-review finding, not a gate failure.

19. **AC15's `artifact` and `ledger-row shape` clauses are grammar-checked, not token
    checked (O15's residual).** P14's inventory lists
    `ledger-ownership-map` and `ledger-review-mark-shape` with `machine: n/a`: the gate
    proves both versioned blocks parse, that their cells exist, and that no other block
    re-declares a `type` column the gate vocabulary owns, but it cannot resolve their
    cells against a published vocabulary, because none publishes them — the ledger
    column sets are owned by `skills/pre-execution-review/references/LEDGERS.md` and
    validated by `scripts/ledger-ownership.test.mjs` (AC16), and
    `PRE_EXECUTION_ARTIFACT_KINDS` is named by no fixed-output block anywhere. Same for
    the row shape an executor writes into `delegated-evidence.md`. **Re-trigger:** when
    a schema surface publishes the ledger column sets or the artifact-kind prose grammar
    exists (P17's schema-side work is the likely host), add the `machine` cell to those
    inventory rows, and O15 flips to `verified` only when
    `node --test scripts/normative-drift.test.mjs` refuses a doctored column set.

20. **A close-out's own completion ticks move a bound path after the head its review
    mark names (F38's residue, found by doing it).** D47 made a `REVIEW-RAN` mark current
    by ancestry over the artifact set `SNAPSHOT.md` binds, which fixed the unobtainable
    equality rule F38 reported: the commit that carries a mark no longer invalidates it.
    It cannot fix the terminal phase, because that phase's remaining bookkeeping — the
    `REVIEW-RAN` row's own consequences — lives in `TASKS.md` (the boxes the review closes)
    and `planning-obligations.md` (O12, whose required evidence *is* the receipt). Both are
    bound paths, so the commit that honestly records a PASS is the commit that makes the
    mark read aged by one revision. This unit chose honesty about the order over a second
    mechanism: everything a review does not decide is written before the reviewed head, and
    only the receipt's own consequences follow it (D48). **Re-trigger:** the first phase
    that moves phase-completion ticks out of the bound set — a separate unbound
    completion ledger, or a bound-path list that names candidate bytes rather than unit
    records — deletes this item, and until then any unit whose close-out mints its own
    review evidence inherits the same one-revision residue.
21. **Nothing checks that a unit's decision ids are unique, and this unit proves it:**
    `decisions.md` carries two rows numbered **D44** — P14's
    `the drift gate parses committed source` (`d2d75696`) and P15's `keeps its FAIL row and
    withholds its own gate sentence` (`5a2754c0`) — so a bare citation of "D44"
    (`progress.md:968`, `planning-obligations.md:153`, both meaning P15's) resolves to two
    owners. No script parses `decisions.md` for identifiers: `ledger-ownership` binds who
    may write the file, `normative-drift` binds the vocabularies that have machine
    surfaces, and a decision id has neither, so the collision is invisible to every gate in
    this repository and surfaced only when a phase needed the next free id. Neither
    published row is renumbered (an id is how other commits cite a decision, and repointing
    one silently is worse than the ambiguity), which is why D48 is numbered D48 rather than
    D44-D47 re-used. **Re-trigger:** the first phase that adds a uniqueness assertion over
    `^\*\*D<n>` in a unit's `decisions.md` (the natural home is the ledger-ownership suite,
    which already resolves per-file writers) deletes this item and then renumbers the
    duplicate with its citations in one reviewed change.

22. **A fold that lands in a merge commit cannot carry a provenance token.**
    `scripts/ledger-provenance.mjs` lists a commit's files with
    `git show --pretty= --name-only <sha>`, which prints **nothing** for a merge: git
    omits the diff against all parents unless `--diff-merges`/`-m` is asked for. F22
    (roadmap row 28 conflicts with `origin/main`) is closed exactly that way — the
    conflict resolution lives inside merge commit `81c241d7` — so naming that sha as
    `· fold 81c241d` made `--check` answer `cited-unverified` and then FAIL the whole
    ledger, while the annotator's own recovery bound F22 to `0feaaf64`, a commit that
    merely *mentions* F22 in its message and touches `SPEC.md`/`TASKS.md` instead. Both
    answers are wrong: one refuses true provenance, the other invents false provenance.
    **Chosen for this unit:** F22's row stays `folded: no` with the reason written in the
    row, and its token binds to the commit that carries the roadmap row forward (box 8),
    which is a real commit that changes the cited surface and verifies.
    **Re-trigger:** the first change that teaches the provenance lister to read a merge
    against its first parent (or `--combined`) deletes this item, and until then any
    conflict-resolution fold must either name a non-merge commit or stay open like this
    one does.
