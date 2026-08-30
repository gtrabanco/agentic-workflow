## Redirect gate (always, before routing)

Before any other step, resolve the target slug/issue. An issue input
(`--from-issue <N>` or issue URL/number) resolves and validates the issue
identity only; it does not invoke `plan-feature-from-issue` here. The parent
must consume the [planning preflight](<../../planning-preflight/SKILL.md>) and
confirm that planning may write before composing that internal writer. The
internal step supplies the feature slug for the later roadmap gate. For other
inputs, read **the roadmap status** (`docs/features/ROADMAP.md` → the five-state machine
`idea/defined/planned/in-progress/done`) — the **primary** gate signal. The
SPEC's `## Design status` marker is the SPEC-local record and the
**legacy-compat fallback** only (see step 6 below), never the primary check:

1. **Roadmap row status `defined`** → proceed to Routing below (the product
   half is designed; the engineering half still needs scaffolding).
2. **Roadmap row status `planned`** (SPEC + artifacts already present) →
   **STOP**. Never invoke `plan-feature-scaffold` — re-scaffolding an
   already-planned feature is the re-plan-loop bug this gate exists to close.
   Print exactly:

   ```
   → Next: /execute-phase <NN> — this feature is already planned; execute every
     remaining phase, don't re-plan it.
     · explicit atomic mode → /execute-phase <NN> P1
   ```
3. **Roadmap row status `in-progress`** → **STOP**. Print exactly:

   ```
   → Next: /execute-phase <NN> <next-phase> — this feature is already being
     implemented; resume the current phase, don't re-plan it.
   ```
4. **Roadmap row status `done`** → **STOP**. Print exactly:

   ```
   → Next: nothing — <NN>-<slug> already shipped (roadmap status `done`).
   ```
5. **Roadmap row status `idea`, or no row at all** → **STOP**. Print exactly:

   ```
   → Next: /design-feature <slug> — this feature has no completed product design yet
     (capability closure not done). Design it first; then re-run /plan-feature <slug>.
   ```

   No bypass flag exists for this gate — an undesigned feature is never
   planned by this skill, under any flag or instruction.
6. **Legacy compat.** A roadmap row still reading a plain `planned` with no
   five-state history (predates this repo's roadmap-status-machine feature):
   fall back to the SPEC marker — `## Design status: designed` and Capability
   closure filled → treat as `defined`+`planned`, STOP per step 2 above (a
   legacy `planned` row is still already-planned — hand off to
   `/execute-phase`, never re-scaffold). Marker missing/`not designed`/closure
   empty → treat as `idea`, STOP per step 5. See `docs/workflow/MIGRATION.md`.
7. **A raw idea with no slug at all** (nothing to check) → the same STOP
   applies: print the block above pointing at `/design-feature "<idea>"`
   instead of a slug.

## Product-review gate (after the redirect gate, before Routing)

The redirect gate proves the Product half was **designed**; this proves it was
**independently reviewed** and unchanged since. Run it before any write on every
planning route. Issue input has no slug yet: evaluate it on the slug
`plan-feature-from-issue` produces, just before `plan-feature-scaffold` would run.

1. Read the newest `## Pre-execution review receipt v1 — spec` block in the unit's
   `progress.md`; none → fail closed.
2. Recompute the SPEC-stage snapshot from the bytes on disk now — exactly one
   artifact row (`kind: spec`, `selector: spec-product-v1`) plus the current
   `artifactRevisionId` — digested with the schema package's canonical entry (no
   package: record `validated: manual` and compare the stored digest line by line).
3. Accept only when all hold: contract `agentic-workflow/
   pre-execution-review-receipt@1`, `stage: spec`, verdict `spec-review-pass`,
   `snapshotDigest` equals step 2, zero open or unverified material findings,
   `contextClean: true`, and under `authorExclusion: enforced` reviewer ≠ author.
4. Refuse, never silently: **missing** · **stale** (digest or `artifactRevisionId`
   differs — any Product write, context change, or mutate-and-revert) ·
   **wrong-stage** (a `plan` receipt) · **substitute** (candidate `ReviewReceipt v1`
   or staged `VerificationReceipt v1`: different contracts, never interchangeable) ·
   **self-approved** (reused identity under enforced exclusion, or `contextClean:
   false`) · **author-readiness** (`READY-FOR-REVIEW` licenses a review request, it
   is not one).

Fail closed — print exactly, then touch nothing else this turn:

```
PRODUCT-REVIEW GATE — <NN>-<slug> BLOCKED (<missing|stale|wrong-stage|substitute|self-approved|author-readiness>)
Expected: current spec-review-pass receipt bound to snapshot <digest>
Actual:   <receipt state>

→ Next: /review-spec <NN>-<slug> — the Product half needs a current independent
    review before engineering planning can start
  · a product choice is genuinely open → /design-feature <NN>-<slug> "<question>"
  · no bypass flag exists for this gate
```

A stale receipt is never "refreshed" by editing the block — only a new review of a
new snapshot produces one, and `--force` is not a `plan-feature` flag.

## Routing

Once the gate passes, pick the mode — first match wins:

1. **Flag forces it** (skip detection): `--scaffold <slug>`, `--next`.
2. **Issue input** — `--from-issue <N>`, an issue URL, or a bare numeric argument
   `<N>` (for example, `131`) selects the issue-derived route; detection itself
   does not compose `plan-feature-from-issue`. The parent route owns the
   [planning preflight](<../../planning-preflight/SKILL.md>) consumption and must
   confirm that planning may write before it composes `plan-feature-from-issue`,
   then `plan-feature-scaffold`.
3. **Scoped** — an existing, designed roadmap slug or a filled `SPEC.md` →
   `plan-feature-scaffold`.
4. **`--next` / no input** — read the roadmap, take the next `defined` entry
   (the units that still need engineering planning — a `planned` row is
   already scaffolded); apply the redirect gate to it, then scaffold.
5. **Ambiguous** — ask one question, then route.

### Example (routing)

| You run | Detected | Routes to | Then |
|---|---|---|---|
| `plan-feature 14-csv-export` (not designed) | undesigned slug | — | STOP → `/design-feature 14-csv-export` |
| `plan-feature 14-csv-export` (designed, no current spec review) | unreviewed Product half | — | STOP → `/review-spec 14-csv-export` |
| `plan-feature 131` | issue #131 | `plan-feature-from-issue` (stops at the Product-review gate) | `/review-spec` → re-run `plan-feature 131` |
| `plan-feature 14-csv-export` (designed + reviewed) | designed slug | `plan-feature-scaffold` | `execute-phase 14 P1` |
| `plan-feature 14-csv-export` (already `planned`) | already-planned slug | — | STOP → `/execute-phase 14 P1` (no re-scaffold) |
| `plan-feature --next` | next `defined` roadmap entry | gate, then scaffold | `execute-phase NN P1` |
