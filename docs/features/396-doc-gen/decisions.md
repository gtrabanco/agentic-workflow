# 396 — doc-gen · decisions

The unit's durable decision ledger (`decisions` truth class; writer
`docs/features/396-doc-gen/SPEC.md` `## Log` `D` lines for the narrative record,
this file for the protected-path records the checkpoint gate reads).

## Protected-path records

`scripts/docs-generate.test.mjs` is a `**/*.test.*` path, a frozen class in the
packaged default policy. It is **created** here, empty-before, so no frozen
assertion is edited: the justification is the red-first rule's own ordering
(`AGENTS.md` §Working rules), which requires the suite to land alone and be
observed failing before the implementation exists.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/docs-generate.test.mjs | P1 | 2026-11-04 | execute-phase | the suite is new — the frozen corpus of issue #396 S2–S7, cut red-first against the absent generator; nothing existing is modified
justification | scripts/workflow-status-sensor.test.mjs | P14 | 2026-11-04 | execute-phase | one case is appended for S9 (the declared-cycle case that reproduces the live stack overflow); no existing assertion is edited, relaxed or removed
justification | scripts/local-gate.test.mjs | P17 | 2026-11-05 | execute-phase | one case is appended for S10 (a step must not inherit GIT_DIR); no existing assertion is edited, relaxed or removed
```

## Decisions

- **D1 — the unit doc is re-cut at cut time.** The doc committed at `15d23a3c`
  carried no `type`/`scope` frontmatter, marked obligations `verified` with no
  validator run behind them, put obligation rows under `### Planning evidence`,
  and had no `## Acceptance criteria`. Re-cut before any code per the governing
  instruction §5; the earlier evidence lines are re-run and their new outputs
  recorded, never silently dropped.
- **D2 — the repository's review machinery does not run on this change.** The
  governing instruction §4 forbids `review-change`, `audit-pr` and the fold cycle
  on a local, unpublished workflow change; the owner is the external verifier.
  The deterministic gates (root suite, lints, phase-lint) always run.
- **D3 — generator home: `scripts/docs-generate.mjs`, not a crate subcommand.**
  The crate is the published channel, and row 91 (`#352`) owns moving ceremony
  operations into it. The script needs only `node:` builtins plus the crate's
  committed index readers, so it relocates when that migration decides its module
  boundary.
- **D4 — projection directory.** `<content-dir>/generated/` when the project
  declares a content dir, otherwise `docs/generated/`. Authored pages and
  generated pages never collide, and a format change deletes the previous
  format's pages as orphans. Deletion is confined to that directory.
- **D5 — an undeclared format degrades, an unrecognised one refuses.** S4 orders
  the markdown fallback for *no* declaration, reported and non-failing. A format
  the project explicitly named but the generator cannot honor is a refusal
  (exit 2, nothing written), because emitting markdown for `format: asciidoc`
  would be the silent failure S4 forbids.
- **D6 — no CHANGELOG row; the release note is the changeset.** The changelog
  tables are the release script's surface (`docs/workflow/PACKAGES.md`), so this
  unit writes no version it does not own. `.changeset/396-doc-gen.md` is the
  release note and `version-parity-gate --content` is its receipt.
- **D7 — the pre-existing guide overrun is repaired here, not reported and left
  red.** `AGENTS.md` measured 6884 against its declared 6881 ceiling on `main`;
  the root gate (and the two suites reading the manifest) cannot be green while it
  stands, so `O11` would be unverifiable. Three sentences were tightened inside
  the unchanged ceiling — no rule, owner link or pinned phrase removed.
- **D9 — S9 is added at the owner's instruction, inside this unit.** Verbatim:
  "arreglalo en esta unidad, no hace falta una nueva pr para ese fix". The sensor
  failure had been recorded as pre-existing and routed elsewhere; the owner
  ordered it repaired here, so the unit gains `S9`, tasks `P14`–`P16` and
  obligations `O12`/`O13` rather than a second PR. Two defects are repaired: the
  missing cycle guard in `dependencyBuildOrder` (the walk marked a node after
  recursing, so A→B→A never terminated) and the roadmap cell that declared it —
  row 98 (`done`) depended on row 100 (`idea`), which cannot be a hard
  dependency; row 100 keeps its true direction, `98 (done)`.
- **D10 — S10 clears the blocker that stopped the push.** The `pre-push` hook
  runs the local gate; every step inherited the hook's `GIT_DIR`, so the crate
  suite's `git init <fixture>` re-initialized the caller's repository and its
  commits moved the branch pointer (the checkout was clobbered on 2026-11-05 and
  restored from the reflog before continuing). Fixed at the entry points, not in
  the fixtures: `scripts/git-env.mjs` owns the scrub set and both
  `scripts/local-gate.mjs` and `scripts/run-root-suite.mjs` use it. The branch is
  then integrated with a plain merge (journal resolved as a timestamp-ordered
  union) and pushed as a fast-forward — no commit is rewritten, no force-push.
