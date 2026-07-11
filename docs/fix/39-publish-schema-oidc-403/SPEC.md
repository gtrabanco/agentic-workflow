# fix/39-publish-schema-oidc-403

> Fix specification. The SPEC alone is the source of truth; its
> `## Phases` section is the execution ledger.

## Goal

`publish-schema.yml` has never auto-published: **4/4 push-triggered runs and
the manual `workflow_dispatch` runs fail at `npm publish` with `E403 … OIDC
permission denied for this action`**. The registry is stuck at `1.0.0` while
the package's `package.json` is already at `1.0.1`, so every eligible run tries
to publish and is rejected. The **root cause is an npm-registry-side Trusted
Publisher configuration** that is missing or does not match what CI presents —
**this cannot be repaired from git**. What this fix ships in-repo is
**diagnosability**: the run log and the workflow header must turn an opaque 403
into an actionable "verify the Trusted Publisher config, then re-run" pointer,
so this failure is self-serve next time instead of requiring a fresh log dive.
The authorization repair itself is a manual, owner-only npm.js step captured
here as a manual acceptance criterion.

## Issue

`#39` — GitHub issue. The PR must close it via `Closes #39` in the body.

## Branch

`fix/39-publish-schema-oidc-403`

## Depends on

None (independent). **Blocks #38** — the schema package stuck at `1.0.0` on the
registry cannot be republished (its `1.0.1`/`1.0.2` bump) until this
authorization is resolved. This fix does not perform #38's version bump; it
unblocks the publish path #38 needs.

## Root cause

npm Trusted Publishing (OIDC) authorization is denied by the **npm registry**,
not by GitHub. Evidence in the issue: npm signs the provenance statement and
publishes it to the transparency log (the Sigstore/Fulcio OIDC exchange
succeeds) **before** the registry rejects the `PUT` with
`403 … OIDC permission denied for this action`. That signature — provenance
signs, then the publish `PUT` is denied — means the GitHub OIDC token is valid
but the **npm-side Trusted Publisher record for
`@gtrabanco/agentic-workflow-schema` is absent or mismatched** (org, repo,
workflow filename, or an environment-name mismatch). The workflow header
(`.github/workflows/publish-schema.yml`) already documents the required
one-time manual setup on npmjs.com; it was either never completed after the
manual `1.0.0` publish, or one field does not match what CI presents.

Where the defect is **not**: the `on.push.paths` trigger is already correctly
scoped (`packages/agentic-workflow-schema/**` + the workflow file). The
build+test gate passes every run. The version-skip guard is correct
(`local=1.0.1`, `published=1.0.0` → `publish=true`). The defect is entirely in
publish authorization.

## Detected in

User conversation, 2026-07-11. The user first suspected an over-broad push
trigger; reading the failed run's logs (`gh run view --log-failed`, run
`29127256684`, 2026-07-10) surfaced the real cause — the npm Trusted Publisher
OIDC rejection above. See issue #39.

## Scope

### In scope

The **smallest in-repo change that makes this failure diagnosable** — one file,
`.github/workflows/publish-schema.yml`:

1. A `## Troubleshooting` note in the workflow **header comment** mapping the
   exact `E403 … OIDC permission denied` symptom → cause (Trusted Publisher
   config missing/mismatched) → the fields to verify on npmjs.com → the
   `gh run view --log-failed` diagnostic → the `gh workflow run
   publish-schema.yml` re-run.
2. An `if: failure()` diagnostic step on the `publish` job that echoes the same
   pointer into the **run log**, so a future 403 is actionable without opening
   the source file.

### Out of scope

- **The npm.js Trusted Publisher configuration change itself** — manual,
  owner-only, not a git artifact. Tracked here as a manual acceptance
  criterion; it is the actual authorization repair.
- **#38's version bump** (`1.0.1` → `1.0.2` and its wording) — belongs to
  [issue #38](https://github.com/gtrabanco/agentic-workflow/issues/38); this
  fix only unblocks the publish path it depends on.
- **`.node-version`, `registry-url`, npm/Bun versions, or any other workflow
  step** — all currently reach the publish step successfully; changing them
  would be unrelated churn.

## Acceptance

Objective conditions. Git-side criteria are checkable by the implementer;
manual criteria are owner-only (no npm registry access from CI or the agent)
and must be recorded as required manual verification.

- [ ] **[git]** `.github/workflows/publish-schema.yml` header contains a
      `Troubleshooting` note that names the `E403 … OIDC permission denied`
      symptom, the Trusted Publisher fields to verify (provider GitHub Actions,
      org/user `gtrabanco`, repo `agentic-workflow`, workflow filename
      `publish-schema.yml`, environment name blank), and the re-run command.
- [ ] **[git]** The `publish` job has an `if: failure()` step that echoes the
      troubleshooting pointer to the run log; YAML is valid
      (`gh workflow view publish-schema.yml` / a local YAML lint parses it).
- [ ] **[git]** The workflow still triggers only on
      `packages/agentic-workflow-schema/**` and the workflow file (trigger
      scope unchanged — this fix does not touch `on:`).
- [ ] **[manual · owner]** On npmjs.com →
      `@gtrabanco/agentic-workflow-schema` → Settings → Trusted Publisher, the
      GitHub Actions record exists and matches exactly: org/user `gtrabanco`,
      repo `agentic-workflow`, workflow filename `publish-schema.yml`,
      environment name blank.
- [ ] **[manual · owner]** After the config is fixed, a re-run
      (`gh workflow run publish-schema.yml`, or the merge-triggered run — see
      Operational risks) publishes successfully and
      `npm view @gtrabanco/agentic-workflow-schema version` returns `1.0.1`
      (currently `1.0.0`).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**.

### P1 — Make the 403 self-serve in the workflow

- [ ] In `.github/workflows/publish-schema.yml`, extend the header comment with
      a `Troubleshooting` block: symptom `npm error 403 … OIDC permission
      denied for this action`; cause = Trusted Publisher record on npm is
      missing or a field mismatches; the exact fields to verify (provider
      GitHub Actions, org/user `gtrabanco`, repo `agentic-workflow`, workflow
      filename `publish-schema.yml`, environment name blank); the
      `gh run view --log-failed` diagnostic; the `gh workflow run
      publish-schema.yml` re-run. (Independently checkable: the block names the
      symptom string and all five Trusted Publisher fields.)
- [ ] Add a diagnostic step to the `publish` job guarded by `if: failure()`
      that echoes a one-line pointer ("publish failed — if E403 OIDC, verify
      the npm Trusted Publisher config; see this file's header") to the run
      log. (Independently checkable: the step exists, is guarded by
      `if: failure()`, and does not change the `on:` trigger or the publish
      command.)
- [ ] Verify YAML validity: the file parses (`gh workflow view
      publish-schema.yml` after push, or a local YAML parse before) and the
      `on.push.paths` block is byte-for-byte unchanged from `main`.

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #39`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #39` and push

## Impact

- **Layers touched:** CI/release automation only
  (`.github/workflows/publish-schema.yml`). No skill, doc-map, template, or
  package source changes.
- **Modules/files:** `.github/workflows/publish-schema.yml` (single file).
- **Blast radius:** dev/release-tooling only. The edit cannot corrupt data or
  regress the published package; worst case a malformed YAML disables the
  workflow, caught by the YAML-validity acceptance criterion before merge.
- **Detection lead time:** immediate — a bad workflow surfaces on the next run
  in the Actions tab; the whole point of this fix is to shorten that lead time
  for the 403 specifically.

## Rules that must never be violated

- **Stack/architecture-agnostic skills & shared docs** — untouched here; this
  fix edits only a repo-specific CI workflow (the schema package is this repo's
  own tooling, explicitly allowed by CLAUDE.md's Verification section).
- **One PR per unit of work, base `main`; never work on `main`.**
- **Docs language English** — the workflow comment stays English.
- **Trigger scope preserved** — the fix must not alter `on.push.paths`; the
  issue is explicit that the trigger is already correct.
- **No secret introduced** — Trusted Publishing is tokenless by design; this
  fix must not add an `NPM_TOKEN` secret or any auth workaround (that would
  defeat provenance and re-introduce a rotating credential).

## Operational risks

- **Merge-triggered publish.** `on.push.paths` includes the workflow file
  itself, so **merging this PR to `main` triggers a publish run**. Sequencing
  matters: if the owner completes the npm.js Trusted Publisher fix **before**
  merge, the merge-triggered run publishes `1.0.1` and self-verifies the fix;
  if not, that run 403s again — harmless (no partial publish; npm rejects the
  whole `PUT`) and now emits the clearer diagnostic. **Recommended order:** fix
  the npm config first, then merge.
- **No partial-publish hazard.** A 403 rejects the registry `PUT` atomically;
  no half-published version or orphaned tag results. The provenance statement
  already written to the transparency log on prior failed runs is inert
  (attestation without a matching published artifact) and needs no cleanup.
- **Concurrency:** single job, no queue/cache/schema interaction.

## Security risks

- **OIDC / no long-lived secret:** the fix preserves tokenless Trusted
  Publishing — no `NPM_TOKEN` added, `id-token: write` unchanged. The
  diagnostic step only echoes a static pointer string; it must not print the
  OIDC token, `GITHUB_TOKEN`, or any registry response body (avoid dumping full
  `npm publish` output that could contain a token exchange payload).
- **Least privilege:** `permissions:` block unchanged (`contents: read`,
  `id-token: write`). No new permission is required for an `echo`-only step.
- No PII, webhooks, or rate-limited surfaces involved.

## Compliance touchpoints

n/a — no data retention, regional, or consumer-protection rules touched.

## Affected docs

- `.github/workflows/publish-schema.yml` header comment — updated in P1 (the
  workflow's own documentation is the doc surface here; there is no separate
  publishing runbook, and adding one would exceed the smallest change set).
- `docs/fix/README.md` — register this fix (status `pending`), per the fix
  index convention. Acceptance: the fix row exists.

## Observability

- **Confirms the fix is live:** a `publish-schema.yml` run whose
  `Publish to npm` step is green, followed by
  `npm view @gtrabanco/agentic-workflow-schema version` → `1.0.1`.
- **Confirms diagnosability shipped:** a failing run now shows the
  `if: failure()` pointer line in its log (visible on any subsequent 403 until
  the npm config is fixed).
- **Degrades silently if:** the Trusted Publisher config is fixed but later
  drifts (e.g. workflow file renamed, environment added) — the same 403 returns
  and, thanks to this fix, the run log states exactly what to re-verify.

## Cross-issue notes

- **#38** — `@gtrabanco/agentic-workflow-schema` never published past `1.0.0`.
  Classified **blocked-by-this**: #38's republish cannot reach npm until this
  authorization is fixed. Decision: keep #38 open; this fix unblocks it, does
  not absorb it. Recommend running #38's bump/publish immediately after the
  first successful `1.0.1` publish confirms the path works.
- **#37** (Spanish tutorial siblings) — unrelated. No dependency.
- No open PRs.

## Effort

**XS** — one file, comment + a 3–4 line `if: failure()` step, ≤ 1h. The
authorization repair is a manual npm.js action (owner-only, not a git task) and
is not counted in the T-shirt; it is the operational gate that actually closes
#39.

## Decisions made during drafting

- **No new publishing runbook doc.** The workflow header already documents the
  one-time setup; consolidating diagnosis + re-run there (plus the run-log
  pointer) is the smallest change. A standalone `docs/workflow/PUBLISHING.md`
  was considered and rejected as scope creep for an XS fix — re-question if the
  owner wants a discoverable runbook independent of the workflow file.
- **Diagnostic step echoes a static pointer only** (no registry-response dump),
  to avoid leaking any token/exchange payload into logs.
- **Slug** `publish-schema-oidc-403` chosen (noun phrase, ≤ 40 chars) over a
  verb-led name, per the topic-slug convention.

## Testing

No unit/integration layer applies — this is a CI-workflow edit. Verification is
(a) **static**: YAML parses and `on.push.paths` is unchanged (architecture-level
check, done in P1); (b) **manual/operational**: the owner completes the npm.js
config and a re-run publishes `1.0.1` (the manual acceptance criteria). Prefer
confirming via a real `workflow_dispatch` re-run over any mock.

## Rollback

`git revert` the fix PR (single-file, comment + echo step — trivially
reversible). No data-side cleanup: the change adds no state, publishes nothing
by itself, and touches no registry record. The npm.js Trusted Publisher config,
being manual and external, is unaffected by a git revert.

## Status

`pending`
