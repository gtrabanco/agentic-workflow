## Pre-execution receipt sensing (step 6a)

Roadmap status says what exists; only a receipt bound to the current bytes says
whether the unit may be executed. Sense it like every other signal — read the file,
recompute the digest, never trust the prose sitting around the block.

### What is read

For every unit whose resolved status is `defined`, `planned` or `in-progress`:

1. The newest `## Pre-execution review receipt v1 — spec` and `… — plan` block in the
   unit's `progress.md` (no `progress.md`, or no block for that stage → `missing`).
2. The `snapshot` line — the `sha256:` digest the receipt binds — and each bound
   artifact's current bytes: re-derive the digest with the recipe owner's verify
   mode — `node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan> --unit
   <id> [--parent <64-hex>]` (`pre-execution-review` owns the recipe; a feature plan
   check needs the Product digest it descended from, a fix check binds no parent).
   Read `structural.reasonCode` and `structural.changedPaths` out of the JSON — they
   name the dimension that stopped being true, which is what the sensor labels
   `stale`. A snapshot digest is a canonical
   SHA-256 over the snapshot object, so `git hash-object` is never a substitute: it
   stays correct only for the frozen `ACCEPTANCE.md` manifest blob.
3. The verdict, the reviewed `unit`, the stage, and the author fields
   (`reviewer` and `authorId` — the receipt's `Reviewer:` / `Author:` lines — and
   `authorExclusion`).

### One label per stage, and the command it recommends

| Label | Evidence | Recommended |
|---|---|---|
| `current` | stage PASS verdict **and** recomputed digest = bound digest | spec: `/plan-feature <slug>` · plan: `/execute-phase <NN>` |
| `missing` | no receipt block for the stage | `defined` → `/review-spec <slug>` · planned/in-progress → `/review-plan <NN>` |
| `stale` | bound digest differs, or a bound context row moved | re-run **that stage's** review |
| `wrong-stage` | the only PASS belongs to the other stage | the stage that is missing — never the stage that passed |
| `substitute` | prose verdict, legacy block, or internal attestation stands where a receipt should be | that stage's review, and report the substitute as a blocker detail |
| `self-approved` | the author of the artifact recorded the PASS | that stage's review in a clean context |
| `author-readiness` | an authoring readiness result sits where a verdict should be | that stage's review — readiness never licenses execution |
| `legacy` | `planned`/`in-progress` unit with no ledgers and no receipt (predates feature 28) | the adoption route below |

A stale receipt re-runs the **review**, not the authoring skill: the artifacts may be
exactly right and simply need re-judging in a clean context. A missing verdict block,
or a verdict outside the stage's fixed set, is `missing` with the reason recorded —
never a guess in the recommended direction.

### Envelope projection

- A unit that is otherwise startable but lacks a current PASS for the stage it is
  about to enter becomes a `gate` blocker (`scope: unit`, detail names stage +
  label). `startable_now` keeps only units whose next command is genuinely runnable,
  so `next.recommended` never points a human at `execute-phase` on an unreviewed plan.
- `detail.pre_execution[]` gains one row per sensed unit: `{unit, stage, label,
  verdict, boundDigest, observedDigest, recommended, reason}` — `verdict`/`reason`
  are `null` when absent, `observedDigest` is always the digest computed **now**.
  `detail` is opaque to the envelope schema, so no field outside it changes.
- Nothing is inferred from the *absence* of a block: an unreadable artifact is
  `missing` with the failure in `reason`, never a carried-forward claim from the
  receipt itself.

### Legacy units

A `planned`/`in-progress` unit with no ledgers and no receipt predates the gate; it
reports as `legacy`, which is a different fact from `missing` ("never reviewed") and
routes the human differently. `pre-execution-review` owns the adoption rule —
construct the ledgers, never coerce old evidence, keep frozen acceptance and every
past commit byte-identical, and resume only on a current `PLAN-REVIEW-PASS`. This
sensor only reports the label and the command; it never edits a unit to make the
label disappear, and it files nothing.
