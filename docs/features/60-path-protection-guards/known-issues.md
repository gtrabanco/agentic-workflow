# known-issues — 60-path-protection-guards

## Tracked boundaries

- **B-01 — scripts/crate distribution gap (inherited from feature 59 B-01):**
  the pi package's `bundle:skills` copies skill trees only; the producer crate
  (`packages/agentic-workflow/`) and root `scripts/` do not travel with installed
  skills, so in a target project the Tier 1 gate is unavailable until feature 44
  (`per-skill-package-layout`, issue #198) lands. The checkpoint wiring
  discloses the missing gate and records it. The pi Tier 2 guard still prevents
  where the package is installed.

- **B-02 — shell-hook hosts get Tier 1 only:** `guard-command.sh` stays
  command-only because the normalized hook payload carries no write intent; a
  path check there would block reads of protected files too. Prevention on
  non-pi hosts is deliberately the checkpoint gate (Product half out-of-scope 3,
  E-60-6). Revisit only if a hook payload gains a normalized write-intent field.

- **B-03 — the reason vocabulary is a crate-module export, not a schema-package
  one:** `PATH_GUARD_REASONS` is published by a `schema-export:` normative row
  reading `packages/agentic-workflow/src/path-policy.mjs`, because the crate is
  the producer and the schema package owns envelope/verification contracts only
  (E-60-11). The closure is machine-checked by the crate module plus
  `scripts/path-protection.test.mjs` (O12); the `block:path-protection@1`
  grammar declares the block against the same vocabulary. No runtime cross-check
  exists between the crate's `SHIPPED_PATH_POLICY` and the schema package; the
  parity pins cover the template seed and the pi mirror instead (B-01).

- **B-04 — the gate does not police test content:** whether a test is good stays
  with `review-code` / `review-verify`; this unit guards the authorization to
  modify protected paths only (Product half out-of-scope 4). Not a gap.

- **B-05 — budget re-basis growth:** the P3 skill text additions grow the
  touched routes' measured context; the re-basis uses the declared
  `ceil(measured × 1.10)` rule with the growth source named. An unrelated
  over-ceiling route at execution is a pre-existing repo condition and is named
  in the phase handoff rather than widening this unit.
