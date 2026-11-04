# Decisions — local-first-gate

> **Provenance / convention deviation.** This folder has no issue-numbered slug
> and no row in the roadmap's `## Fixes` table, because every fix in this
> repository is expected to carry a tracked forge issue and none exists for this
> change: the repository owner requested it directly in-session. The folder
> exists to hold the `path-protection-records@1` justification the policy
> requires before a frozen test may be modified or added. File the issue, rename
> the folder to `<issue>-local-first-gate`, and add the index row to close the
> gap.
>
> **Landing note.** The owner directed this change onto the already-open PR
> [#404](https://github.com/gtrabanco/agentic-workflow/pull/404)
> (`fix/release-notes-rendering`), which carries a release-notes fix as well. The
> repository rule is one unit per pull request; this is the owner's recorded
> exception, taken on the branch the work was in, not a precedent for mixing
> units.

## D1 — The gate runs locally first; the remote workflow is manual only

**Decision.** `scripts/local-gate.mjs` is the gate. It runs, in one ordered
list, every check `.github/workflows/root-suite.yml` used to run in five jobs —
workspace install, schema build, the crate suites on both runtimes, the root
suites, the content half of the version-parity gate, both node-compat legs,
`pi-compat-guard`, the dependency-pin gate and the advisory pass. It stops at
the first failing step (`--no-bail` runs the list and reports every red), and
the workflow is `workflow_dispatch` **only**: it runs the same script, so the
command a contributor runs before pushing is the command CI runs.

**Why.** The remote gate fired on every push and every pull request, spending
runner minutes on a tree the author could have checked for free. A budget is not
the only cost: the feedback loop is minutes long, and a red that a local run
would have caught at the first step arrives after the other four jobs have
already run. Local-first moves the common case off the meter without weakening
the gate, because the workflow executes the same script rather than a second
transcription of it.

**Pre-merge remote check.** A branch that cannot be run locally — a contributor's
pull request, a checkout that lacks the toolchain — is checked by dispatching the
same workflow on that branch: `gh workflow run root-suite.yml --ref <branch>`.
This is why the workflow was kept rather than deleted. A fork's branch is not a
ref in this repository, so a fork PR is still checked by checking it out and
running the gate locally; that limit is real and not papered over.

## D2 — The `pre-push` hook runs the offline subset

**Decision.** `bun scripts/local-gate.mjs --install-hook` writes
`.git/hooks/pre-push`, which runs the gate with `--skip-network`. The full list,
network steps included, is the pre-merge run. `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1`
bypasses the hook and prints why it did; using it is a decision to record in the
PR, never a quiet habit.

**Why.** Four steps read the npm registry or install a third-party tarball
(`pi-compat-guard`). A checkout whose registry is unreachable or rate-limited
must not block a push over a fact no commit changed — the same
degraded-not-failed contract the pin gate already follows. The steps that depend
on the changed tree are all offline, so the hook still refuses a red push.

## D3 — The compatibility guard's first leg is the declared floor, read from the manifest

**Decision.** `pi-compat-guard` type-checks `src/` against two versions of
`@earendil-works/pi-coding-agent`: the **first compatible** one — the lower bound
of the `peerDependencies` range in
`packages/pi-agentic-workflow/package.json` — and `latest`. The floor is parsed
from the manifest at run time (`peerFloor()`), never typed into the gate. A peer
spec with no lower bound is a hard failure of the step, not a silent fallback.

**Why the first and not the last.** A range with no ceiling (`>=x.y.z`) is
satisfied by `latest`, so "last compatible" is already the second leg. The
ceiling leg cannot see a source file calling an API that only exists above the
floor, and that defect breaks exactly the consumers the manifest promised to
serve; the floor leg is the only leg that can see it. Testing both ends is the
whole guard — testing one end proves compatibility with a version nobody may
have.

**Why read instead of type.** The gate carried `0.99.1` while the manifest had
risen to `>=1.1.0`: a stale literal tested a version the package no longer
claims, and nothing failed, because the literal and the manifest were two copies
of one fact. The manifest is now the only owner; the README's floor sentence and
`packages/pi-agentic-workflow/test/verified-baseline.test.mjs` already read the
same entry, so the three cannot drift apart without a test saying so.

## D4 — Frozen tests: the trigger contract, the advisory carrier, and the new suite

The workflow's trigger is pinned by tests, and removing the push/PR triggers is
a deliberate contract change, not a relaxation: `release-workflows.test.mjs` now
pins the manual-only trigger and asserts that every former job survives as a step
of `scripts/local-gate.mjs` (so no check can silently disappear with the job
that carried it). `dependency-advisory-pass.test.mjs` asserted that the
`dependency-pin-gate` job carries the advisory pass; it now asserts the workflow
runs the local gate and the gate carries the pass with its report-only contract.
No assertion is deleted without a replacement that binds the same fact, and no
case is skipped.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/local-gate.test.mjs | P1 | 2026-11-04 | execute-phase | New sibling suite for scripts/local-gate.mjs, required by the repository rule that a new script ships its suite. It pins the step table (one row per former remote check), fail-fast, --dry-run selection and the pre-push installer; it never invokes a heavy step.
justification | scripts/release-workflows.test.mjs | P2 | 2026-11-04 | execute-phase | The root gate's trigger contract changes from every-push to manual-only (D1). The two trigger cases are replaced by stronger ones: the workflow carries no push/pull_request trigger, it runs scripts/local-gate.mjs rather than a second transcription, and every former job survives as a named step in that script. Nothing is relaxed or removed.
justification | scripts/dependency-advisory-pass.test.mjs | P3 | 2026-11-04 | execute-phase | The advisory pass moves from the dependency-pin-gate job body into scripts/local-gate.mjs (D1). The case still binds the two facts it bound before — the gate runs the pass, and the pass is report-only — through the new owner of the step list.
```
