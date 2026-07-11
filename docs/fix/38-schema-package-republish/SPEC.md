# fix/38-schema-package-republish

> Fix specification. The SPEC alone is the source of truth; its `## Phases`
> section is the execution ledger.

## Goal

A README documentation expansion for `@gtrabanco/agentic-workflow-schema` — the
envelope field-by-field reference, the closed/open `state` routing table, and
the dynamic-workflow orchestration guide (merged as [#44](https://github.com/gtrabanco/agentic-workflow/issues/44),
commit `0087dc6`) — is committed on `main` at version `1.0.1` but never reached
npm: the registry's `1.0.1` was published earlier the same day, before that
commit, and `publish-schema.yml` only republishes on a version bump. This fix
bumps the schema package to `1.0.2` so the auto-publish carries the current
README to npm, closing the "stranded docs, no release scheduled" gap #38
describes. It cannot wait for a regular feature cycle because npm consumers see
a materially thinner README until a bump ships, and no functional change is
scheduled to carry one.

## Issue

`#38` — GitHub issue. The PR must close it via `Closes #38` in the body.

## Branch

`fix/38-schema-package-republish`

## Depends on

None. Independent.

## Root cause

`.github/workflows/publish-schema.yml` publishes only when the package's
`package.json` `version` differs from the version on the npm registry (a "Skip
when the version is already published" step compares `local` vs `published`).
Docs-only commits to the package deliberately do **not** bump the version
("ships with the next release"). Commit `0087dc6` ("Closes #44", 2026-07-11
13:40) added a 122-line README reference/orchestration guide **at version
`1.0.1`**; npm's `1.0.1` was published at 11:24 the same day from a pre-`0087dc6`
tree. With no functional change following to carry a bump, the README expansion
is stranded on `main`, unpublished — the exact "docs improved, no version bump,
no next release scheduled" state #38 was filed about.

Note on #38's original framing: it also flagged the `1.0.1` `validateEnvelope`
fix and the #33 wording corrections as unpublished ("registry stuck at 1.0.0").
Both of those **did** reach npm when `1.0.1` published at 11:24 — verified
against the published tarball (`envelope.schema.json` and `package.json`
descriptions carry the reworded #33 text). The only residual unpublished delta
today is the #44 README expansion.

## Detected in

User conversation, 2026-07-11, during the `plan-fix` investigation of #38.
Verified by diffing the published tarball (`npm pack
@gtrabanco/agentic-workflow-schema@1.0.1`) against the local working tree:
`package.json`, `envelope.schema.json`, `LICENSE`, and `dist/` are byte-identical
to npm; only `README.md` differs (67 → 189 lines — the +122 from `0087dc6`).

## Scope

### In scope

- Bump `packages/agentic-workflow-schema/package.json` `version` `1.0.1` → `1.0.2`.
- Add a `1.0.2` row to the `@gtrabanco/agentic-workflow-schema` section of
  `CHANGELOG.md` documenting the republish (carries #44's README reference +
  orchestration guide to npm; notes the #33 wording already shipped in `1.0.1`).
- On merge to `main`, `publish-schema.yml` auto-publishes `1.0.2` (no manual npm
  steps — Trusted Publishing via OIDC, already configured and proven by `1.0.1`).

### Out of scope

- Correcting the historical `1.0.1` CHANGELOG row (it omits the #33 wording
  rewrites that in fact shipped in `1.0.1`) — a cosmetic history nit; the
  published tarball's content is already correct. File separately if desired;
  not needed to close #38.
- Any code, `envelope.schema.json`, `src/`, or `dist/` change — all already in
  sync with npm `1.0.1`; `0087dc6` touched only the README.
- The missing Spanish sibling for `docs/workflow/*.md` ([#37](https://github.com/gtrabanco/agentic-workflow/issues/37)) — unrelated.

## Acceptance

- `grep '"version": "1.0.2"' packages/agentic-workflow-schema/package.json` matches.
- `grep -E '^\| 1\.0\.2 \|' CHANGELOG.md` matches (a `1.0.2` row in the schema section).
- `cd packages/agentic-workflow-schema && bun run test` exits 0 (the publish gate — never publish red).
- **Post-merge (manual, CI publishes):** `npm view @gtrabanco/agentic-workflow-schema version` returns `1.0.2`.
- **Post-merge (manual):** the published `1.0.2` README contains the reference —
  `npm pack @gtrabanco/agentic-workflow-schema@1.0.2` then `grep -q 'The envelope, field by field'` in the extracted `README.md`.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here.

### P1 — Bump version + changelog

- [x] Set `version` to `1.0.2` in `packages/agentic-workflow-schema/package.json` — `package.json:3`
- [x] Add a `| 1.0.2 | <date> | patch | …` row to the `@gtrabanco/agentic-workflow-schema` section of `CHANGELOG.md` (date = execution date), stating it republishes the current README (#44 reference + orchestration guide) that was stranded at `1.0.1`, and that the #33 wording already shipped in `1.0.1` — `CHANGELOG.md:78` (row dated 2026-07-12)
- [x] Run the package gate: `cd packages/agentic-workflow-schema && bun run test` → exit 0 (paste output) — 13 pass / 0 fail, EXIT=0
- [x] Confirm no unintended package change: `git diff --stat` shows only `package.json` (version line) + `CHANGELOG.md` — confirmed (2 files)

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #38`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #38` and push

## Testing

`cd packages/agentic-workflow-schema && bun run test` — the existing unit suite,
which is also the publish gate. No new tests: this is a version/docs republish;
the README content was already reviewed and merged under #44, and no code path
changes. Confirmation that the fix is live is **post-merge and manual** (the
`npm view` + `npm pack` checks in Acceptance), because publishing happens in CI
on push to `main`, not in the PR.

## Rollback

Revert the bump PR on `main`. **npm publishes are immutable** — `1.0.2` cannot be
un-published (npm's unpublish window/policy); a bad republish is corrected
**forward** with `1.0.3`, never by unpublishing. Reverting the PR only stops
future auto-publish of that line; the `1.0.2` already on npm remains. No
data-side cleanup (docs-only artifact).

## Status

`pending`

---

## Impact

- **Layer:** release/packaging — `packages/agentic-workflow-schema/package.json`
  (version line only) and the repo `CHANGELOG.md`; triggers
  `.github/workflows/publish-schema.yml` on merge.
- **Modules/files:** `packages/agentic-workflow-schema/package.json`,
  `CHANGELOG.md`. The README being published (`packages/agentic-workflow-schema/README.md`)
  is **not** edited by this fix — it is the already-merged payload.
- **Blast radius:** dev-only / consumer-facing docs. Republishes documentation
  to npm; no runtime, API, or envelope-contract change. Worst case is a bad
  README on npm, corrected forward with `1.0.3`.
- **Detection lead time:** immediate — the `publish-schema.yml` run logs
  success/failure and `npm view` confirms the version flip within minutes of
  merge.

## Rules that must never be violated

- Docs language is English (this SPEC, the CHANGELOG row, the PR).
- One PR against `main`, off the `fix/38-schema-package-republish` branch; never
  commit on `main`.
- Never publish red — the workflow's `bun run test` gate must be green before the
  publish step runs.
- Semver honesty — `1.0.2` is a **patch**: backward-compatible, docs-only, no
  change to the envelope contract or the validator's behavior.

## Operational risks

- The publish job runs on push to `main` matching `packages/agentic-workflow-schema/**`.
  It relies on npm **Trusted Publishing (OIDC)** — no `NPM_TOKEN`. This is
  pre-existing infrastructure, already proven by the `1.0.1` publish; this fix
  introduces no change to it. If the npm-side Trusted Publisher record had
  regressed, the job would `403` at the publish step — surfaced by the run's
  own troubleshooting pointer, not silent.
- No scheduled-job, queue, cache-invalidation, schema-migration, or
  external-adapter interaction beyond the publish itself.

## Security risks

None introduced. No secrets (OIDC exchange, no stored token); README docs only;
no PII, no auth/webhook/rate-limit surface.

## Compliance touchpoints

n/a.

## Affected docs

- `CHANGELOG.md` — add the `1.0.2` row to the
  `@gtrabanco/agentic-workflow-schema` section (this is acceptance criterion 2).

No other doc changes: the package README is the payload being published, already
merged under #44; `docs/fix/README.md` is updated as part of the fix-flow
close-out, not as a content fix.

## Observability

- The `publish-schema.yml` run on `main`: its "Skip when the version is already
  published" step logs `local=1.0.2 published=1.0.1` and proceeds to publish
  (green run = published; provenance attestation attached on npm).
- `npm view @gtrabanco/agentic-workflow-schema version` flips `1.0.1` → `1.0.2`.
- If it degrades silently (job skipped or failed), the version stays `1.0.1` and
  the `npm pack` README check in Acceptance fails — the post-merge manual checks
  are the guard.

## Cross-issue notes

- [#44](https://github.com/gtrabanco/agentic-workflow/issues/44) (**CLOSED**) —
  its merged README expansion (`0087dc6`) is the payload this fix publishes.
  Not a blocker; this fix completes #44's delivery to npm.
- [#33](https://github.com/gtrabanco/agentic-workflow/issues/33) (**CLOSED**) —
  its wording already reached npm in `1.0.1` (verified in the published tarball);
  nothing to do.
- [#37](https://github.com/gtrabanco/agentic-workflow/issues/37) (open) —
  Spanish docs sibling; unrelated.
- No open PRs.

## Effort

**XS** — two-file edit (a version line + one CHANGELOG row), one commit, ≤ 1h;
CI performs the actual publish.

## Decisions made during drafting

1. **Bump target is `1.0.2`, not `1.0.3`.** Last published is `1.0.1`, so the
   next version is `1.0.2`. Docs-only and backward-compatible → semver **patch**.
2. **A version bump is the only mechanism that republishes.** Both the `push`
   trigger and `workflow_dispatch` hit the "Skip when the version is already
   published" guard when `local == registry`, and npm forbids republishing an
   existing version. So the bump is required, not cosmetic ceremony.
3. **The historical `1.0.1` CHANGELOG row is left untouched** (it omits the #33
   wording rewrites that shipped in `1.0.1`). The published tarball's content is
   already correct; rewriting changelog history is a separate cosmetic nit,
   recorded here so the implementer can re-question.
4. **No `dist/` rebuild or `src/` change** — `0087dc6` touched only `README.md`;
   `dist/`, `src/`, `envelope.schema.json`, and the rest of `package.json`
   already match npm `1.0.1`.
