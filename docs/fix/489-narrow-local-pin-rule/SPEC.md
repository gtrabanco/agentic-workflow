---
type: fix
scope: xs
---

# fix/489-narrow-local-pin-rule

> The local-sibling half of `version-parity-gate.mjs --pins` stops failing a pin
> that is merely *behind* its sibling's local version — a state the unified
> train cannot produce and the registry half already owns — and keeps failing
> the one case it uniquely owns: a pin *ahead* of it, naming a version the
> registry never published.

## Issue

`#489` — tracked issue in the project's forge. The PR must close it via
`Closes #489` in the body (the commit carries the footer).

## Specs

**S1 — the rule narrows to the direction that is uniquely its own.**
> "So the local rule should fail only that: a pin strictly **ahead** of the sibling's local version. A pin behind it becomes a notice (the registry rule owns it, and the offline run degrades rather than inventing a verdict from a missing answer)."

**S2 — the implementation.**
> "`scripts/version-parity-gate.mjs`: the local rule fails only `semverGt(pin, localVersion)`; a behind pin is a notice naming the owner of that case."

**S3 — documentation currency, same PR.**
> "The script header's `--pins` block and the `docs/workflow/PACKAGES.md` "Version bumps" paragraph state the narrowed rule (documentation currency, same PR)."

**S4 — the superseded contract cases move with it.**
> "`scripts/version-parity-gate.test.mjs`: the two cases that pin the old behind-is-a-violation contract are superseded with the new one, plus a case for the ahead pin with the registry unreachable."

**S5 — no widening into the wiring defect.**
> "The default wiring: `--pins` resolves to `PACKAGE_DIR` (the Pi package) when `--package` is absent, while the header says every package is checked, and `scripts/local-gate.mjs` runs it flagless. Reported on issue #484 as F1; it is a separate unit and this one does not widen into it."

**S6 — the acceptance.**
> "- A pin strictly ahead of the sibling's local version fails, with or without the registry answering.
> - A pin equal to it passes (unchanged), and a pin behind it passes the local half while the registry half still rejects it when reachable.
> - Every existing case that does not encode the superseded semantics keeps passing."

## Impact

- `scripts/version-parity-gate.mjs` — `evaluatePins`'s local branch (line 568),
  the `--pins` block of its header (lines 26-39) and nothing else. The registry
  rule above it (line 549) is untouched, so a behind pin still fails the gate
  while the registry answers; only the offline answer changes from `violation`
  to `notice` + `degraded`.
- `docs/workflow/PACKAGES.md` — the "Version bumps" paragraph's local-pin
  sentence (lines 56-60), which currently promises the behind case as a
  rejection.
- `scripts/version-parity-gate.test.mjs` — two cases encode the superseded
  contract (`:570`, `:590`) and are superseded with the new one; the ahead case
  gains the registry-unreachable variant S4 asks for.
- **`scripts/pin-watch.mjs` shares the evaluator** (`import { evaluatePins }`,
  line 78) — the watch cannot disagree with the gate by design, so the rule
  narrows there too: a sibling pin that lags becomes a report notice (surfaced
  through `collectDrift`'s notices, which the report prints) and only a pin
  ahead is a filed drift. Its bump plan gains the matching target rule
  (`localVersion ?? latest`): for a local-sibling finding the local version is
  the only one that will exist, while `latest` pointed at a version the pin was
  already past. D1 records this as a plan amendment the cut got wrong (PE-007).
- `scripts/local-gate.mjs`'s `dependency-pin-gate` step consumes the same
  evaluator; its shape does not change. Nothing in the crate, the schema package
  or the skills reads this predicate.
- No package version bump and no changeset: `scripts/` is outside the
  version-parity content trigger set (`contentTriggerPrefixes`), verified as
  PE-006.

## Retirements

This unit **supersedes a contract**, so the superseded surface is named here
rather than discovered at review:

- The behind-pin rejection, `spec !== localVersion` → `semverGt(spec, localVersion)`.
  Its two pinned cases retire with it: `pins: crate bumped in the same PR
  without the pin fails offline — the same-PR coupling is enforced`
  (`scripts/version-parity-gate.test.mjs:570`) and `pins: registry unreachable +
  pin != local version still fails (the local check is offline-deterministic)`
  (`:590`). Their replacement cases carry the new contract in the same file.
  This is the owner's decision recorded in S1/S4 — not a test relaxed to make an
  implementation pass: the assertion changes with the rule it asserts.
- The header sentence "a pin behind it recreates the post-publish red window"
  and its mirror in `PACKAGES.md` — deleted, not reworded into a second truth.
- The watch's lagging-pin case, `drift: a pin on a local sibling that lags its
  package is a finding naming the local version`
  (`scripts/pin-watch.test.mjs`), replaced by the mirror pair: a lagging pin is a
  notice (not drift) and a leading pin is the drift with its bump target. The
  watch's docstring sentence stating the mirror gains the direction it now
  mirrors. D1 records why this was not visible at the cut.

## Non-goals

- The `--pins` default wiring (`PACKAGE_DIR` vs every package): S5 keeps it out;
  it needs its own unit and this diff must not touch `runPins`/`main()`.
- Third-party pins — the registry rule and its degraded contract are untouched.
- Re-deciding whether the watch should keep reporting a lagging sibling pin at
  all: it keeps reporting it, as a notice, because the mirror rule is the repo's
  stated invariant and a silent watch is worse than a noisy one. Turning the
  notice into silence would be a new spec.

## Risk tier

Computed by `bun scripts/ceremony.mjs tier classify --paths …` over this unit's
declared paths at the cut; copied verbatim, never written from memory.

- **Cut verdict** — `standard` (`reason_kind: executable-content` — 2 paths
  carry executable content: `scripts/version-parity-gate.mjs`,
  `scripts/version-parity-gate.test.mjs`) · **Task Size** — `understood: true`,
  `contained_risk: contained`, `resumable_from_diff: true`,
  `ceremony: unit-doc`, `verification: gates` · **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit

## Acceptance criteria

- **AC1 (S1, S2)** — a pin strictly ahead of the sibling's local version is a
  violation, both when the registry answers and when it throws — proven by
  `bun test scripts/version-parity-gate.test.mjs` exiting 0, including the new
  "ahead, registry unreachable" case.
- **AC2 (S1, S2)** — a pin behind the local version is **not** a violation from
  the local half (it is a notice naming the registry rule as its owner), while
  the registry half still rejects it whenever the registry answers — proven by
  the same suite's behind-with-registry case (violation) and
  behind-without-registry case (notice + degraded, no violation).
- **AC3 (S2)** — the local branch compares with `semverGt` only, so the
  direction is the contract — `rg -c 'semverGt\(spec, localVersion\)'
  scripts/version-parity-gate.mjs` matches 1 and the retired `spec !==
  localVersion` comparison is gone (`rg -c 'spec !== localVersion' …` matches 0).
- **AC4 (S3)** — both prose surfaces state the narrowed rule and neither still
  promises a behind-pin rejection: `rg -c 'ahead of the local version'
  scripts/version-parity-gate.mjs` matches 1 and the same count in
  `docs/workflow/PACKAGES.md` matches 1.
- **AC5 (S4)** — the two superseded cases are replaced (not deleted) and the new
  ones pass; the rest of the file is unchanged: `git diff
  origin/main...HEAD -- scripts/version-parity-gate.test.mjs` shows two replaced
  `test(` headers plus the additions.
- **AC6 (S5)** — the diff never touches the wiring: `git diff --stat
  origin/main...HEAD` names only the declared paths (the cut's four plus
  `scripts/pin-watch.mjs` and `scripts/pin-watch.test.mjs`, which D1 adds).
- **AC7 (D1)** — the watch mirrors the narrowed rule: a lagging sibling pin is a
  notice, a leading one is a drift and its bump plan targets the local version —
  proven by `bun test scripts/pin-watch.test.mjs` exiting 0.

## Future

none — nothing was deferred. The wiring defect lives on issue #484 as F1, which
is a separate tracked finding, not a deferred row of this unit.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| The local half of `--pins` is a *direction* rule (ahead only). A future rule that wants "behind" back belongs to the registry half, which owns reachability and degradation | future gate work |
| A `--pins` semantics change updates the header block, the `PACKAGES.md` paragraph and the two superseded test cases together — the three are one surface | future gate work |

## Applicable tests

`scripts/version-parity-gate.test.mjs` — the frozen-failure corpus: the two
superseded cases, the new ahead/behind cases (registry answering and throwing),
and every untouched case in the file · `scripts/pin-watch.test.mjs` — the
mirror's two replaced cases (lagging = notice, leading = drift + bump target) ·
`scripts/local-gate.test.mjs` unchanged, as the step that consumes the gate.
`bun scripts/test-impact.mjs --base origin/main` derives exactly the first two.

## Known pre-existing issues

- **`version-parity-gate --pins` defaults to `PACKAGE_DIR` (the Pi package)**
  while its header says every package under `packages/` is checked, and
  `scripts/local-gate.mjs` runs it flagless. **does-not-affect** this unit's
  contract (S5 keeps the wiring out); it is issue #484's F1 and stays open.
- **A stale, dirty worktree other than this one** (`feat-427-…`, merged into
  `origin/main`) makes `scripts/worktree-guard.mjs` red — reproduced from the
  primary checkout, **does-not-affect** this unit, not repaired here.
- **`node` is installed via `fnm` but absent from the non-interactive `PATH`** —
  **affects** the verification runs only; every leg is run with
  `/home/agent/.local/share/fnm/node-versions/v26.13.0/installation/bin` on
  `PATH`.

## Tasks

- P1 — Cut the unit doc, both planning ledgers and the `## Fixes` row (validator: `bun scripts/unit-route.mjs --triage 489-narrow-local-pin-rule` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6)
- P2 — RED: supersede the two old-contract cases and add the ahead/behind pair (validator: `bun test scripts/version-parity-gate.test.mjs` exits 1 on the new cases, before P3)
  (Implements: S4)
  Relevant files: scripts/version-parity-gate.test.mjs
- P3 — GREEN: the local rule fails only `semverGt(pin, localVersion)` (validator: `bun test scripts/version-parity-gate.test.mjs` exits 0)
  (Implements: S1, S2)
  Relevant files: scripts/version-parity-gate.mjs
- P4 — Docs: the header's `--pins` block and the `PACKAGES.md` paragraph (validator: `rg -c 'ahead of the local version' scripts/version-parity-gate.mjs docs/workflow/PACKAGES.md` matches 1 each)
  (Implements: S3)
- P5 — Verification: the suite under both runtimes, the root suite, the gate (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | the unified train bumps **every** package to one version and then rewrites **every** exact local pin to it, so a train-produced tree can never carry a pin behind its sibling | `scripts/release.mjs:965` (`setPackageVersion` over `packages`), `:775` `rewriteLocalPins` called at `:971` | current | O2, O3 |
| PE-002 | repository | the registry rule runs **before** the local rule and already rejects a pin behind the published latest, so the behind case is owned there | `scripts/version-parity-gate.mjs:546-562` (comment + `semverGt(latest, spec)` branch with `continue`) | current | O2, O4 |
| PE-003 | repository | the local rule's only uniquely-owned case is a pin ahead of the local version — a version the registry never published | `scripts/version-parity-gate.mjs:561-583`; the two existing cases that encode the wider contract (`scripts/version-parity-gate.test.mjs:570`, `:590`) | current | O1, O2 |
| PE-004 | repository | a registry that cannot be answered is a degraded pass, never a failure — so an offline behind pin must not invent a violation | `scripts/version-parity-gate.mjs` header ("A registry that cannot be reached is a clearly-degraded pass … exit 0") | current | O3 |
| PE-005 | repository | the two superseded cases assert the retired contract and are the only ones that do | `scripts/version-parity-gate.test.mjs:570` (`crate bumped in the same PR without the pin fails offline`), `:590` (`registry unreachable + pin != local version still fails`) | current | O5 |
| PE-006 | repository | `scripts/` is outside the version-parity content trigger set, so this change owes no package bump and no changeset | `scripts/version-parity-gate.mjs:76-88` (`contentTriggerPrefixes`/`packageDirs` — only `packages/**` + `skills/`) | current | O7 |
| PE-007 | repository | ~~`pin-watch.mjs` keeps its own local comparison, so narrowing this gate does not reach the watch~~ — **wrong, corrected by PE-008 and D1** | asserted at the cut from the watch's prose; the import was not read | superseded 2026-11-09 | Non-goals, O9 |
| PE-008 | repository | `pin-watch.mjs` **imports the gate's evaluator** (`import { evaluatePins } from "./version-parity-gate.mjs"`, line 78) and delegates every exact pin to it, so the mirror invariant ("the watch cannot disagree with the gate") makes the narrowing reach the watch and its lagging-pin case | `scripts/pin-watch.mjs:78`, `:230` (`evaluatePins(...)` call), `:104` (the lagging-pin test); `bun test scripts/pin-watch.test.mjs` → 1 fail / 54 pass when the gate narrowed alone (E5) | current | O9, O10 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1, S2 | a pin strictly ahead of the sibling's local version is rejected — the version no install can satisfy | P1 | P3 | execute-phase | `bun test scripts/version-parity-gate.test.mjs` exits 0 with the ahead cases green (registry answering and throwing) | the E line naming both ahead cases | verified |
| O2 | S1, S2 | a pin behind the local version is not rejected by the local half; it becomes a notice that names the registry rule as owner | P1 | P3 | execute-phase | `bun test scripts/version-parity-gate.test.mjs` exits 0 with the behind-offline case asserting a notice and zero violations | the E line for the behind cases | verified |
| O3 | S1, PE-004 | an unreachable registry degrades and never invents a verdict: the offline run reports `degraded` and no violation for a behind pin | P1 | P3 | execute-phase | `bun test scripts/version-parity-gate.test.mjs` exits 0 with `degraded.length === 1` and `violations.length === 0` on that case | the E line for the degraded case | verified |
| O4 | S1, PE-002 | the registry rule keeps owning "behind": with the registry answering, the same behind pin is still a violation naming the published version | P1 | P3 | execute-phase | `bun test scripts/version-parity-gate.test.mjs` exits 0 with the behind-with-registry case matching `/registry published/` | the E line for the unchanged registry cases | verified |
| O5 | S4, PE-005 | the two superseded cases are replaced, not deleted, and the rest of the file's cases keep passing | P1 | P2 | execute-phase | `bun test scripts/version-parity-gate.test.mjs` exits 0 with the same case count plus the additions | the E line with the pass count before and after | verified |
| O6 | S3 | both prose surfaces state the narrowed rule and neither promises a behind-pin rejection | P1 | P4 | execute-phase | `rg -c 'ahead of the local version' scripts/version-parity-gate.mjs docs/workflow/PACKAGES.md` matches 1 each | the E line with both counts | verified |
| O7 | S5, PE-006 | the change ships without a package bump or changeset and touches no wiring | P1 | P5 | execute-phase | `git diff --stat origin/main...HEAD` names exactly the four declared paths and `bun scripts/version-parity-gate.mjs --content --base origin/main` exits 0 | the stat and the content-gate verdict in the E lines | verified |
| O8 | S6 | every case that does not encode the superseded semantics keeps passing, under both runtimes | P1 | P5 | execute-phase | `bun test scripts/version-parity-gate.test.mjs` and `node --test scripts/version-parity-gate.test.mjs` both exit 0; `bun scripts/run-root-suite.mjs` exits 0 | the two suite runs + the root-suite line | verified |
| O9 | S1, PE-008 | the watch mirrors the gate: a lagging sibling pin is a notice, a leading one is the drift | P1 | P3 | execute-phase | `bun test scripts/pin-watch.test.mjs` exits 0 with both mirror cases green | the E line for the pin-watch pair | verified |
| O10 | S1, PE-008 | the watch's bump plan targets the local version, never a registry version the pin is already past | P1 | P3 | execute-phase | `bun test scripts/pin-watch.test.mjs` exits 0 with the bump-plan assertion (`0.9.9 -> 0.5.0`) | the same E line | verified |

## Triaged steps

Verbatim from `bun scripts/unit-route.mjs --triage 489-narrow-local-pin-rule`
after the doc was cut:

```
TRIAGE — 489-narrow-local-pin-rule (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/489-narrow-local-pin-rule
```

The lane runs inline (owner's apply workflow): no Relay packet is cut for this
unit and the `relay-next` addendum is not acted on; the review step is the
owner's external verification.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the issue, verbatim:
  ```
  The local-sibling half of `scripts/version-parity-gate.mjs --pins` fails any exact pin whose target is a sibling under `packages/` unless it equals that sibling's local version — the "behind" case included.

  That case is no longer reachable from the pipeline, and it duplicates a rule we already own:
  - release.mjs apply sets every package to the train version and rewrites every exact local pin to it, so a train-produced tree can never hold a pin behind its sibling.
  - A pin behind is already caught by the registry half (registry latest > pin → rejection) while the registry answers at all.
  - What the local half uniquely owns is the opposite direction: a pin ahead of the local version — a version the registry has never published, which no npm install can satisfy.

  So the local rule should fail only that: a pin strictly ahead of the sibling's local version. A pin behind it becomes a notice (the registry rule owns it, and the offline run degrades rather than inventing a verdict from a missing answer).
  ```
- **L2** — 2026-11-09, owner instruction, verbatim: "B" — the option chosen from the three offered on issue #484's review (A: keep + fix the wiring; B: narrow the local rule to the forward direction; C: drop it). It authorizes this unit and nothing else.

- **P1** — 2026-11-09, the unit doc, both planning ledgers (every obligation row `planned` at cut), the roadmap Fixes row and the regenerated units projection · `d3d67863`.
- **P2** — 2026-11-09, RED: the two behind-is-a-violation cases superseded, the ahead case rewritten and the registry-unreachable variant added · `042bd4d6`.
- **P3** — 2026-11-09, GREEN: the evaluator's local branch narrowed to `semverGt`, both prose surfaces rewritten, and the watch cascade (mirror cases + notice propagation + bump target) · `b29cde0e`.
- **E1** — 2026-11-09, `bun test scripts/version-parity-gate.test.mjs` at `042bd4d6` (tests landed, evaluator untouched) · 49 pass / **4 fail** — exactly the four new cases (O5's red half).
- **E2** — 2026-11-09, `bun test scripts/version-parity-gate.test.mjs` at `b29cde0e` · **53 pass / 0 fail** (O1, O2, O3, O4).
- **E3** — 2026-11-09, `node --test scripts/version-parity-gate.test.mjs scripts/pin-watch.test.mjs` · **108 pass / 0 fail** — the node fallback leg agrees with bun (O8).
- **E4** — 2026-11-09, `rg -c 'semverGt\(spec, localVersion\)' scripts/version-parity-gate.mjs` matches 1; `rg -c 'spec !== localVersion' scripts/version-parity-gate.mjs` matches 0; `rg -c 'ahead of the local version' scripts/version-parity-gate.mjs docs/workflow/PACKAGES.md` matches 1 each (AC3, AC4, O6).
- **E5** — 2026-11-09, `bun test scripts/pin-watch.test.mjs` with the gate narrowed and the watch untouched · 54 pass / **1 fail** — `drift: a pin on a local sibling that lags its package is a finding naming the local version`: the cascade the cut's PE-007 missed (O9, D1).
- **E6** — 2026-11-09, `bun test scripts/pin-watch.test.mjs` after the mirror cases · **55 pass / 0 fail**, including the lagging-is-a-notice case and the leading-is-drift case asserting the bump plan `0.9.9 -> 0.5.0` (O9, O10).
- **E7** — 2026-11-09, `bun scripts/test-impact.mjs --base origin/main` · `verdict: targeted` · suites: `scripts/pin-watch.test.mjs`, `scripts/version-parity-gate.test.mjs` — the repo's own derived impact set is the two suites this unit moves (O8).
- **D1** — 2026-11-09, plan amendment (the cut was wrong): PE-007 claimed `pin-watch.mjs` kept its own comparison; it imports the gate's `evaluatePins` (`scripts/pin-watch.mjs:78`) and the repo's stated invariant is that the watch cannot disagree with the gate. So the narrowing necessarily reaches the watch and its lagging-pin case, which is why `scripts/pin-watch.mjs` and `scripts/pin-watch.test.mjs` join the declared paths (O9, O10, AC7). Recorded instead of quietly widening the diff; S5 is untouched — the wiring (`--pins`'s default package) is still out.
- **D2** — 2026-11-09, decision inside the cascade: the watch keeps *reporting* a lagging sibling pin, as a notice the report prints (`collectDrift` now forwards the evaluator's notices), rather than going silent — the gate owns the verdict, the watch owns the visibility. Its bump plan targets `localVersion ?? latest`: for a local sibling the local version is the only one that will exist, and the old `latest` target pointed at a version the pin was already past (a bug the ahead case now makes reachable on its own).
- **G1** — 2026-11-09, `bun scripts/run-root-suite.mjs` · **exit 0 · 97/97 suites PASS**.
- **G2** — 2026-11-09, `node scripts/run-root-suite.mjs` · **exit 0 · 97/97 suites PASS** — both runtimes agree.
- **G3** — 2026-11-09, an intermediate per-file sweep reddened `scripts/red-first.test.mjs` and two `workflow-status-sensor` cases: bun's **default 5 s** per-test budget, not the change — `scripts/run-root-suite.mjs` budgets 60 s for exactly that reason (`:125-141`). Re-run with `--timeout=60000`: red-first 9 pass / 0 fail, workflow-status-sensor 78 pass / 0 fail, and `bun scripts/red-first.mjs` alone reports `48 pair(s) · 0 finding(s) · verdict: PASS`. Disclosed rather than explained away.
- **E8** — 2026-11-09, `bun scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow` · exit 0 · `VERDICT: PASS` with both sibling pins as local-version notices; `bun scripts/version-parity-gate.mjs --content --base origin/main` · exit 0 · `VERDICT: PASS` (no package bump and no changeset owed — O7).
- **G4** — 2026-11-09, the gate's offline steps with `node` on `PATH`: `node scripts/local-gate.mjs --only version-parity-content,docs-generated-projection,journal-carrier-check,log-immutability,temp-hygiene,tmp-gc,dependency-pin-gate` · **PASS — 7 step(s)**, and `docs-generate --check` exit 0 after regenerating the units projection · `roadmap-settle` `verdict: PASS`, 0 violations · `phase-lint` `verdict PASS` (5/5) · `promise-coherence` `verdict PASS` · `journal aggregate --check` `{"ok":true}` · `roadmap check` `verdict: PASS`.
- **D3** — 2026-11-09, note for the handoff: `--pins --package packages/agentic-workflow` is RED **on this branch** because `typebox` is still `1.4.5` here — that is issue #484's drift, fixed on its own branch, not a regression of this unit.

- **P4** — 2026-11-09, the watch's mirror cases landed in their own commit (`2618320c`) — P3's line above lists them inside `b29cde0e`, which staged only the implementation and the prose; the cases were left unstaged and are committed here. The green runs already exercised these exact bytes (the working tree carried them), so no run is invalidated, but the split is recorded rather than glossed.
- **D4** — 2026-11-09, disclosure: `efab6335` (`chore(spec): spec change`) is **not this session's commit**. It appeared between `b29cde0e` and the ledger close, authored with the repository identity, carrying exactly this unit's SPEC amendment (`35 insertions, 14 deletions`) — an external process in this environment auto-committed the file. The content is the intended amendment (verified by diff against the surrounding commits), so nothing was lost or altered; it is disclosed because an unattributed commit in a unit's own history is exactly the kind of side effect that must never be silent.

## Next

The unit is verified on both runtimes and handed back for the owner's external
verdict; nothing is pushed and no PR is open. Open elsewhere, deliberately: the
`--pins` default wiring (issue #484's F1).

## References

Issue [#489](https://github.com/gtrabanco/agentic-workflow/issues/489) · the
review that produced it, issue
[#484](https://github.com/gtrabanco/agentic-workflow/issues/484) (finding F1
stays open there) · the gate's own tutorial paragraph in
[`docs/workflow/PACKAGES.md`](../workflow/PACKAGES.md) (Version bumps).

## Branch

`fix/489-narrow-local-pin-rule`

## Depends on

none — independent of #484 (that unit only bumps a pin).

## Regression scope

| Scenario | Verified by |
|---|---|
| A third-party pin behind the registry still fails, and degrades when the registry is unreachable | `scripts/version-parity-gate.test.mjs` — the registry-only cases (`a dependency with no local sibling keeps the registry-only rule`, the degraded pass) |
| A pin equal to the sibling's local version still passes with its offline notice | the unchanged `pin equal to the local version passes even when the registry is behind` case |
| The live tree still passes the pins gate for every package it reads | `bun scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow` exits 0 |
| `pin-watch` still files a drift for a behind pin (a different surface, unchanged) | `bun test scripts/pin-watch.test.mjs` exits 0 |
| The local gate's `dependency-pin-gate` step is unaffected in shape | `bun test scripts/local-gate.test.mjs` exits 0 |
