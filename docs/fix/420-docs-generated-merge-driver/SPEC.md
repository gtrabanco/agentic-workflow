---
type: fix
scope: small
---

# fix/420-docs-generated-merge-driver

> The generated projection is a function of the tree, so two regenerations never
> have a real line-level conflict: `.gitattributes` resolves `docs/generated/**`
> mechanically, and the local gate refuses a projection that no longer matches
> its sources before it is pushed.

## Issue

`#420` — tracked issue in the project's forge. The PR must close it via
`Closes #420` in the body.

The unit was cut from a review of PR
[#418](https://github.com/gtrabanco/agentic-workflow/pull/418): resolving that
PR's integration meant hand-merging three `docs/generated/` pages, and the
projection was already stale on `main` at the base commit — two symptoms of the
same missing carrier.

## Specs

**S1 — One `.gitattributes` entry.**
> `.gitattributes` — `docs/generated/** merge=docs-generated`.

**S2 — The driver answers the incoming side, byte for byte.**
> `scripts/docs-generated-merge.mjs` — the driver: answers the incoming side byte for byte (the same answer `git checkout --theirs` gives for a generated file, said once), fails closed outside the declared projection directory, and carries `--install` to arm a checkout (`git config merge.docs-generated.driver`).

**S3 — The staleness gate runs on every push.**
> `scripts/local-gate.mjs` — a `docs-generated-projection` step running `docs-generate --check`, offline and not test-gated, so a mechanically resolved projection that no longer matches its sources refuses **before** the push: the merge stops being where the projection's truth is decided.

**S4 — The guide and the inventory name the carrier.**
> `AGENTS.md` — the arming line beside `--install-hook`; `docs/workflow/GATE_INVENTORY.md` — the gate's carrier row.

**S5 — Red-first sibling suite.**
> Red-first sibling suite: the resolution, the fail-closed refusals, `--install` idempotence, a real `git merge` in a scratch repository, and the `.gitattributes`↔generator directory coupling.

**S6 — The defect this removes.**
> The defect: `docs/generated/**` is a generated projection committed to the tree, so two PRs that regenerate it conflict on bytes neither author wrote — the header line every regeneration rewrites is the same line for both sides. A line-level merge of two regenerations is never a real conflict, so the resolution is mechanical; whether the bytes are *right* is the generator's question, answered by the local gate's `docs-generated-projection` step.

## Impact

- **Consumers of the projection directory**: `scripts/docs-generate.mjs` owns it
  (`projectionDir`), the docs step of `unit-lane` requires its `--check` receipt,
  and `scripts/docs-generate.test.mjs` carries the live-tree check. None of them
  changes; the driver reads the directory **through** the generator instead of
  restating it, so a `content-dir` declaration moves all three at once.
- **The local gate's contract**: `STEPS` and `DEPS` in `scripts/local-gate.mjs`
  gain one step, and two suites pin that closed set
  (`scripts/local-gate.test.mjs`, `scripts/release-workflows.test.mjs`). Both
  edits are recorded in `decisions.md` as `path-protection-records@1`
  justifications: the sets grow by an id, nothing is relaxed.
- **Every contributor's checkout**: `.gitattributes` names a driver that git
  resolves from the checkout's own config, so an unarmed clone keeps today's
  conflict — by design, pinned by the suite's unarmed case — and the guide names
  the one command that arms it.
- **Not touched**: the generator, the projection's sources, any skill, any
  template, and the `Docs site` declaration.

## Retirements

None — the unit only adds a carrier. The reason it retires nothing: the surface
it answers (a hand-resolved `docs/generated/` conflict) has no artifact to
delete; the pre-existing habit of merging those three pages by hand is not a
file. `rg -c 'merge=docs-generated' --glob '!.gitattributes' .` → 0 before this
change, so there was no earlier carrier to supersede.

## Non-goals

- Making the projection a build artifact (deliberately committed: `--check`
  needs committed bytes to compare, and the repository has no build step).
- Limiting `.gitattributes`' scope beyond the projection: `docs/LOGS.md` is an
  append-only journal of *authored* entries and its conflicts are a different
  defect (roadmap row 114, fragments).
- Auto-regenerating on merge: a merge driver runs per file while the tree is
  mid-flight, so regeneration belongs to the step that owns the tree
  (`docs-generate`), never to the driver.
- Requiring the driver for a green gate: an unarmed checkout must still be able
  to push a correct projection.

## Risk tier

`bun scripts/ceremony.mjs tier classify` (computed, never chosen):

```json
"tier": "high",
"reason": "1 path(s) touch a named high-risk surface: publish (scripts/release-workflows.test.mjs)",
"reason_kind": "named-high-risk",
"signals": [{ "path": "scripts/release-workflows.test.mjs", "signal": "publish" }],
"task_size": { "contained_risk": "named", "ceremony": "unit-doc+review-change", "verification": "review-change" }
```

The tier is `high` for one reason and it is a *pin*, not a behaviour change: the
release-workflows suite pins the local gate's closed step-id set, and this unit
adds one id to it. The added step reads no secret, publishes nothing and calls
no network (`network: true` is absent), so the named signal is the pinned
contract surface rather than a publish path.

**Task Size = standard · Task Size = Contained + Resumable**

## Future

none

## Future cost

- The projection directory now has a second consumer (`.gitattributes`) that
  must move with a `content-dir` declaration. The suite pins the pair
  (`.gitattributes` ↔ `projectionDir`), so the cost is a red suite, not a silent
  disarm.

## Applicable tests

- `bun test scripts/docs-generated-merge.test.mjs` (S2, S5)
- `bun test scripts/local-gate.test.mjs` (S3)
- `bun test scripts/release-workflows.test.mjs` (S3)
- `bun test scripts/prose-gate-inventory.test.mjs` (S4)
- `bun scripts/run-root-suite.mjs` (S1–S6)

## Known pre-existing issues

- `docs/features/307-odd-hybrid-direction/SPEC.md` has no roadmap row, so
  `bun scripts/roadmap-settle.mjs` reports `row-missing` on the live tree —
  `does-not-affect` this unit: reproduced on `origin/main` before this branch's
  integration, and it names another unit.
- `scripts/pi-compat-guard` fails offline against the resolved peer range —
  `does-not-affect`: a network step, reproduced on the base commit by the
  section-locator unit (#407) before this change.

## Tasks

- [x] P1 — red-first suite for S2/S5: resolution, the three fail-closed refusals, `--install` idempotence and refusal, and a real `git merge` in a scratch repository (validator: `bun test scripts/docs-generated-merge.test.mjs` exits 1 on the missing module before the implementation, 0 after)
  (Implements: S2, S5)
  Relevant files: scripts/docs-generated-merge.test.mjs
- [x] P2 — green: the driver (`--install` arming, the resolution, the path guard) and its import guard so the suite can read `coveredPrefix`/`driverCommand` without running the program (validator: `bun test scripts/docs-generated-merge.test.mjs` exits 0)
  (Implements: S2)
  Relevant files: scripts/docs-generated-merge.mjs
- [x] P3 — the scratch-repository finding: git hands `%P` shell-quoted, so the driver unwraps it; the case is added to the suite (validator: `bun test scripts/docs-generated-merge.test.mjs` exits 0 with the quoted-path case green)
  (Implements: S2, S5)
  Relevant files: scripts/docs-generated-merge.mjs, scripts/docs-generated-merge.test.mjs
- [x] P4 — the gate wiring: the `docs-generated-projection` step plus its `DEPS` row, and the two pinned id sets (validator: `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` exits 0)
  (Implements: S3)
  Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs, scripts/release-workflows.test.mjs
- [x] P5 — `.gitattributes` plus the one-home pin: the suite refuses an entry that disagrees with `projectionDir` (validator: `bun test scripts/docs-generated-merge.test.mjs` exits 0 with the coupling case green)
  (Implements: S1)
  Relevant files: .gitattributes, scripts/docs-generated-merge.test.mjs
- [x] P6 — the guide's arming line, the inventory row, the roadmap row and the projection re-emit (validator: `bun scripts/prose-gate-inventory.mjs` exits 0 with `docs-projection-current` resolved; `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S4)
  Relevant files: AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/ROADMAP.md, docs/generated/
- [x] P7 — the repository gate: the step this unit adds must bite on a stale projection before it passes on a current one (validator: `bun scripts/local-gate.mjs --only docs-generated-projection --skip-network` exits 1 with `verdict: DRIFT` on the stale tree, 0 after the re-emit)
  (Implements: S3)
  Relevant files: scripts/local-gate.mjs
- [x] P8 — the full gate and the non-goal sweep (validator: `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
  Relevant files: all changed files

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The projection is committed and a live-tree `--check` exists, so staleness is detectable only because the bytes are in git | `scripts/docs-generate.test.mjs:393` (`the committed generated tree is stale`) | current | O1, O3 |
| PE-002 | known | The projection's directory is owned by one function, not by the driver | `scripts/docs-generate.mjs` → `projectionDir`, `parseDocsSiteBlock` | current | O2 |
| PE-003 | known | The repository carried no `.gitattributes`, so no merge driver existed for any path | `ls -a` at the cut head → no `.gitattributes`; `rg -c 'gitattributes' --glob '!node_modules'` → 0 | current | O1 |
| PE-004 | known | The root suite's live-tree check is a `tests` step of the gate, so a prose-only push skips it — the hole the stale-at-base projection fell through | `scripts/local-gate.mjs` `STEPS` (`root-suite` carries `tests: true`); `hookBody` passes `--push-base` | current | O3 |
| PE-005 | known | git hands a merge driver a shell-quoted `%P`, which a naive driver reads as part of the path | the suite's scratch-repository case at the first green run: `'docs/generated/index.md' is outside docs/generated/` | current | O4 |
| PE-006 | assumption | An unarmed checkout silently keeps the old behaviour instead of resolving by accident, because git only runs a driver it finds in the local config | basis: the suite's unarmed case (`without the install the same merge keeps its conflict`) | current | O5 |
| PE-007 | known | Two suites pin the gate's closed step-id set, so adding a step is a two-file contract change, not a local edit | `scripts/local-gate.test.mjs:62`; `scripts/release-workflows.test.mjs:335` | current | O6 |
| PE-008 | known | The collision is a property of *concurrent regeneration*, not of a changed count: every regeneration rewrites the same counts line, so any two PRs that each regenerate conflict. Measured on #419's integration — `git merge` of `88248ccf` into `b8f8e5f2` (base `caee2502`), driver unarmed and `rerere` disabled — **3 files, 4 hunks**, all on that line: `index.md` ×2 (the header and the `- 3 packages, 28 skills, 48 scripts` bullet), `units.md` ×1, `code.md` ×1; `docs/LOGS.md` and `docs/ROADMAP.md` did not conflict | merge reproduced in a detached worktree at `b8f8e5f2`; with the driver armed the same merge resolves all three (`git merge-tree --write-tree` exits 0) | current | O1 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 (P5) | a conflicted `docs/generated/*` path is resolved mechanically by git instead of by a human, and only that directory is | P5 | P5 | execute-phase | `bun test scripts/docs-generated-merge.test.mjs` exits 0 with the `.gitattributes` coupling case green | `.gitattributes` entry + the suite's coupling case | verified |
| O2 | S2, S5 (P2) | the driver answers the incoming bytes and never restates the projection directory | P2 | P2 | execute-phase | `bun test scripts/docs-generated-merge.test.mjs` exits 0 with `coveredPrefix(REPO)` equal to `projectionDir` | suite green (13 cases) | verified |
| O3 | S3 (P4, P7) | a projection that no longer matches its sources refuses before the push, on a prose-only range too | P7 | P4, P7 | execute-phase | `bun scripts/local-gate.mjs --only docs-generated-projection --skip-network` exits 1 with `verdict: DRIFT` on the stale tree and 0 after the re-emit | both gate runs in `## Log` | verified |
| O4 | S2 (P3) | a shell-quoted `%P` is recognized as the projection, never refused as a foreign path | P3 | P3 | execute-phase | `bun test scripts/docs-generated-merge.test.mjs` exits 0 with the quoted-path case green | the red scratch-repository run, then the green case | verified |
| O5 | S2 (P2) | an unarmed checkout keeps its conflict: the arming is what resolves it, never an accident | P2 | P2 | execute-phase | `bun test scripts/docs-generated-merge.test.mjs` exits 0 with the unarmed case asserting exit 1 and a marker | the unarmed case | verified |
| O6 | S3 (P4) | the gate's closed step-id set stays a closed set, extended by one id in both pins | P4 | P4 | execute-phase | `bun test scripts/local-gate.test.mjs scripts/release-workflows.test.mjs` exits 0 | both suites green + the `path-protection-records@1` rows in `decisions.md` | verified |
| O7 | S4 (P6) | the guide names the arming command and the inventory carries the gate's carrier row | P6 | P6 | execute-phase | `bun scripts/prose-gate-inventory.mjs` exits 0 with `docs-projection-current — script` resolved | the inventory run in `## Log` | verified |

## Triaged steps

```text
TRIAGE — 420-docs-generated-merge-driver (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

## Acceptance criteria

- [x] **S1** — `.gitattributes` carries exactly `docs/generated/** merge=docs-generated`, and the suite refuses any entry that disagrees with `projectionDir` (`bun test scripts/docs-generated-merge.test.mjs`).
- [x] **S2** — the driver writes the incoming bytes over the local side, exits 1 and leaves the conflict for a path outside the projection or an unreadable input, and `--install` writes `merge.docs-generated.name`/`.driver` idempotently (`bun test scripts/docs-generated-merge.test.mjs`).
- [x] **S3** — `bun scripts/local-gate.mjs --only docs-generated-projection --skip-network` exits 1 with `verdict: DRIFT` on a stale projection and 0 on a current one, and the step carries `tests: false` so a prose-only range still runs it (`bun test scripts/local-gate.test.mjs`).
- [x] **S4** — `AGENTS.md` names `bun scripts/docs-generated-merge.mjs --install` beside `--install-hook`, and `docs/workflow/GATE_INVENTORY.md` resolves the `docs-projection-current` row (`bun scripts/prose-gate-inventory.mjs`).
- [x] **S5** — the suite lands red before the implementation and green after (`bun scripts/red-first.mjs` → PASS, the two commits named in `## Log`).
- [x] **S6** — the driver is the only new carrier: the generator, the projection's sources and every skill are untouched (`git diff --name-only` names no `skills/`, no `docs/generated/**` source and no generator change).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-05, the issue, verbatim:
  ```
  The defect: `docs/generated/**` is a generated projection committed to the tree, so two PRs that regenerate it conflict on bytes neither author wrote — the header line every regeneration rewrites is the same line for both sides. A line-level merge of two regenerations is never a real conflict, so the resolution is mechanical; whether the bytes are *right* is the generator's question, answered by the local gate's `docs-generated-projection` step.
  ```
- **E1** — 2026-11-05, `bun test scripts/docs-generated-merge.test.mjs` · exit 1 · red commit `08102aa` — `Cannot find module './docs-generated-merge.mjs'`, 0 pass / 1 fail.
- **E2** — 2026-11-05, `bun test scripts/docs-generated-merge.test.mjs` · exit 1 · first green attempt, 11 pass / 1 fail: the scratch-repository merge reproduced `'docs/generated/index.md' is outside docs/generated/`.
- **F1** — 2026-11-05, folded: the driver unwraps git's shell-quoted `%P`; the quoted-path case pins it (justification recorded in `decisions.md`).
- **E3** — 2026-11-05, `bun test scripts/docs-generated-merge.test.mjs` · exit 0 · 13 pass / 0 fail.
- **G1** — 2026-11-05, `bun scripts/local-gate.mjs --only docs-generated-projection --skip-network` · exit 1 on the stale tree · `docs/generated/{code,index,units}.md: stale` → `verdict: DRIFT`.
- **G2** — 2026-11-05, `bun scripts/prose-gate-inventory.mjs` · exit 0 · 49 rows, `docs-projection-current — script · scripts/docs-generate.test.mjs:393`.
- **P1** — 2026-11-05, the suite landed alone and observed red on the missing module · `08102aa`.
- **P2** — 2026-11-05, the driver (`--install`, the resolution, the path guard, the import guard) and `.gitattributes` landed · `674648a`.
- **P3** — 2026-11-05, the quoted-`%P` case was added after the scratch-repository run exposed it; the driver unwraps git's quoting · `674648a`.
- **P4** — 2026-11-05, the `docs-generated-projection` step and its `DEPS` row; both pinned id sets extended by one id, justified in `decisions.md` · `674648a`.
- **P5** — 2026-11-05, `.gitattributes` carries one entry and the suite pins it against `projectionDir` · `674648a`.
- **P6** — 2026-11-05, the guide's arming line, the inventory row, the roadmap row and the projection re-emit (140 units · 49 scripts) · `674648a`.
- **P7** — 2026-11-05, the step bit on the stale tree before the re-emit and passed after it · G1, G3.
- **P8** — 2026-11-05, `bun scripts/run-root-suite.mjs` on `674648a` · exit 1 · every suite green except `roadmap-settle` (the pre-existing 307 row-missing recorded above).
- **G3** — 2026-11-05, `bun scripts/local-gate.mjs --only docs-generated-projection --skip-network` · exit 0 after `bun scripts/docs-generate.mjs` · `verdict: PASS`, 1 step in 0s.
- **E4** — 2026-11-05, `bun scripts/phase-lint.mjs docs/fix/420-docs-generated-merge-driver/SPEC.md` · exit 0 · `verdict PASS`, 8/8 phases; `bun scripts/unit-lineage.mjs --unit 420-docs-generated-merge-driver` · `LINEAGE OK — lane-era`, obligations closed (7).
- **E5** — 2026-11-05, `bun scripts/docs-generated-merge.mjs --install` on this checkout · exit 0 · `name — written`, `driver — written` (relocatable form).
- **E6** — 2026-11-05, `git merge 88248ccf` in a detached worktree at `b8f8e5f2` (the #419 integration), driver unarmed, `rerere` disabled · exit 1 · 3 files / 4 hunks, every one the shared counts line; with the driver armed, `git merge-tree --write-tree b8f8e5f2 88248ccf` exits 0 and resolves all three. The collision is systemic: two concurrent regenerations always rewrite that same line.

## Next

Regenerate the projection (`bun scripts/docs-generate.mjs`), then the full gate
and the owner's merge verdict on PR #418.

## References

- Issue: [#420](https://github.com/gtrabanco/agentic-workflow/issues/420)
- PR: https://github.com/gtrabanco/agentic-workflow/pull/418
- Directions: feature 396 (`docs-generate`), fix 319 (one index), roadmap row 114
  (why the journal is a different carrier)
- `docs/fix/420-docs-generated-merge-driver/decisions.md` — D1–D6 and the
  `path-protection-records@1` justifications

## Branch

`fix/359-prose-gate-inventory` — the unit rides PR #418's branch; a standalone
`fix/420-docs-generated-merge-driver` was the alternative the owner declined.

## Depends on

none — `.gitattributes` and the driver stand alone; the gate step needs only the
`docs-generate` generator that has shipped since feature 396.

## Regression scope

| Scenario | Verified by |
|---|---|
| An unarmed checkout's projection conflict still conflicts, never silently resolves | `bun test scripts/docs-generated-merge.test.mjs` — the unarmed case asserts exit 1 and a marker |
| A current projection still passes the projection step | `bun scripts/local-gate.mjs --only docs-generated-projection --skip-network` after the re-emit |
| The gate's other steps and their order are unchanged | `bun test scripts/local-gate.test.mjs` — the closed id list, the `DEPS` graph and the network/test markers |
| The generator keeps one owner for the directory | `bun test scripts/docs-generate.test.mjs` (unmodified) |
