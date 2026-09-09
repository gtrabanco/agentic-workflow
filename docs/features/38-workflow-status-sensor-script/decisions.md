# 38 — decisions

> Decisions and open questions for feature 38. Each entry is dated and records
> what was decided and why. New entries are appended on every re-design
> (upsert) — never rewritten.

## 2026-08-30 — initial product design (artifactRevisionId: 38-0a1b2c3d4e5f)

**Decision:** Use Node.js for the sensor script language.
**Rationale:** Consistent with existing `scripts/*.mjs` convention in the repository.
No transpilation, no bundler. Direct ES module imports.
**Evidence:** all existing scripts in `scripts/` use `.mjs` with ES modules.

**Decision:** No new dependencies beyond the schema package.
**Rationale:** Keeps the script lightweight and avoids unnecessary pull-in of packages.
The schema package (`@gtrabanco/agentic-workflow-schema` v3.4.0) is already an
existing dependency (NRS F002).
**Evidence:** schema package already published and on `main`.

**Decision:** Output goes to stdout only, no file output, no color formatting.
**Rationale:** Consistent with existing CLI tools in the repo and enables piping
by consumers without intermediate files.
**Evidence:** existing scripts/ convention and repo CLI patterns.

**Decision:** Offline degradation uses machine-readable codes in `detail`.
**Rationale:** Consumers can distinguish "genuinely missing data" from
"transiently unavailable" without guessing.
**Evidence:** design assumption from issue #185.

**Open questions:** None. All rubric slots resolved by issue #185 body.
**Deferred decisions:** See `SPEC.md → Deferred decisions` section (degradation code vocabulary, `--output <path>`).
## 2026-09-09 — repair batch over review receipt rp-38-20260909-001 (artifactRevisionId: 38-73192450f7b4)

**Decision:** One evidence-bounded repair batch over findings F1–F11 (all
`class: product`); no receipt text touched; no severity edited; no forge issue
opened to hold an obligation. New SPEC artifactRevisionId
`38-73192450f7b4` = first 12 hex of sha256(SPEC.md) at this write — POLICY §7
manual pairing (no runtime rotates the revision id; the mutate-and-revert
guarantee rides this manual handoff, same as the 2026-08-30 authoring turn).

**Repair classes used:**
- Mechanical, intent-preserving (reviewed product intent unchanged): F4 (A:3
  check rewritten — the old grep banned reading labels, unsatisfiable together
  with A:7; the read-only invariant itself is unchanged, the check now greps for
  mutation calls only), F5 (spec-lint mechanical counts recomputed against the
  tables they lint — in-scope 11 / out-of-scope 2 / deferred 0; 16 runnable
  criteria + 1 `read-verified`; 13 integration rows = 8 filled resolutions +
  5 explicit `n/a:`), F6 (sweep rows 5/13 `deferred` → `in-scope`, pointer A:10 —
  in-scope item 10 already carried this work, the rows were mislabelled), F9
  (A:5's contradictory "modulo volatile timestamps" carve-out removed — Envelope
  v2 has no timestamp field, so the byte-identical check is verbatim and
  satisfiable; duplicate A:14/A:15 merged into one criterion), F10 (Delete row's
  blank test cell filled with an objective grep), F11 (Context wording: SKILL.md
  + **8** reference files; the 780-line total was already correct).
- Closure completion (new/refreshed evidence at `current` freshness): F1
  (in-scope item 2 re-scoped to the published SENSOR_CORE steps **1–9** —
  steps 8 *pending quality gates* and 9 *fix-now fold ledger* are envelope
  producers the old "steps 1–7" claim silently omitted; evidence row 1 refreshed
  against `SENSOR_CORE.md`), F2 (schema-package facts refreshed against the live
  package: v3.4.0 → **v4.1.1** in Tooling + evidence rows 2 and 4; new evidence
  row proving the package exports the Envelope v2 vocabulary live —
  `Envelope`, `validateEnvelope`, `parseEnvelope`, `decideWorkflowAction` in
  `src/index.ts`), F3 (integration closure completed to 13/13 — added explicit
  rows for File/media storage, Feature flags, Billing/payments, each
  `n/a:` with a reason, per the inventory's own floor-row guidance), F8 (the two
  surfaces issue #185 names that the SPEC excluded by silence are now named:
  `references/ENVELOPE_CORE.md` folded into in-scope item 7's slimming, and
  `docs/workflow/ORCHESTRATION.md` driver wiring added as in-scope item 12 +
  criterion A:16 — both were already implied by reviewed business goal 3 and the
  issue's affected-surfaces list; scope re-entered the inventory pass with this
  dated note, not widened beyond it).
- Routed to the human (class-3 product change, not repaired here): F7 (exact
  degradation-code vocabulary). Live evidence gathered: schema package v4.1.1
  declares **no** code vocabulary — `Envelope.detail` is `unknown`
  (schema-unconstrained, "documented per skill") — and no repo surface defines
  one (new Product evidence row). The deferred decision's decide-by is corrected
  from "Implementation phase" to "Human design owner"; a bounded question with a
  recommended default is being put to the human this turn. The answer folds into
  `Product decisions` and rotates the revision again before `/review-spec`.

**Note (drift, not silently edited):** NRS `F002` still freezes the schema
package at 3.4.0 with 554/554 passing; the live package is 4.1.1. Live-vs-frozen
conflict recorded in Product evidence row 2 as a contradiction candidate — only
`/resolve-repository-state` may update frozen facts.

## 2026-09-09 — repair batch over open findings F12 + F14 (artifactRevisionId: 38-e820dfebe700)

**Decision:** One repair batch over the two open findings from review receipt
rp-38-20260909-002; no receipt text touched; no severity edited; no forge issue
opened to hold an obligation. New SPEC artifactRevisionId `38-e820dfebe700` =
first 12 hex of sha256(SPEC.md) at this write — POLICY §7 manual pairing (same
as both prior turns).

**F12 (class: product, medium):** in-scope item 10's flag pass-through mapped to
no acceptance criterion. Resolved by **extending the acceptance set** (the
instruction's primary path, human-selected over re-scoping) with three criteria
after four bounded questions to the human design owner (ask_user 2026-09-09):

- **q1 script-computes:** the script computes the hint diff + no-progress guard
  itself. The skill's turn contract makes the guard mandatory whenever
  `--last-envelope` is supplied; leaving it model-side would keep exactly the
  prose-computation feature 38 exists to eliminate.
- **q2 no-op:** `--json-only` accepted, byte-identical output — the script always
  prints only the envelope; the flag exists purely for argv parity between
  script and skill.
- **q3 fail-open:** unreadable/malformed hint → machine-readable
  `unavailable-hint-<cause>` note, exit 0. Rationale explained to the human and
  accepted: the sensor is the lowest link in the automation chain — it must keep
  returning usable output on bad caller input; fail-closed would crash drivers
  on input that is the caller's bug, and the recomputed state is correct either
  way (consistent with Product decision 4's degradation behavior).
- **q4 workflow_observations:** hint results append to the array
  `references/ENVELOPE_FIELDS.md` documents; `detail` is schema-unconstrained
  (v4.1.1), so no schema-package change.

Folded into: in-scope item 10 (concretized), Product decision 7 (new), evidence
rows 11–12 (new), acceptance criteria A:17–A:19 (new), spec-lint mapping box
corrected to A:1–A:19.

**F14 (class: product, low):** Product evidence row 8 ("Slug is free") was
stale — the folder now exists holding this unit's artifacts. Row refreshed to
the current fact (folder exists, contents listed, re-verified 2026-09-09); the
authoring-time check retained as history only — mechanical.

## 2026-09-09 — repair batch over open findings F15 + F16 (artifactRevisionId: 38-d04b301f28d6)

**Decision:** One repair batch over the two open findings from review receipt
rp-38-20260909-003 (CONVERGENCE-ANOMALY printed and routed to owning stage
`product` / `design-feature`, per POLICY §4, recorded in the receipt); no
receipt text touched; no severity edited; no forge issue opened to hold an
obligation. New SPEC artifactRevisionId `38-d04b301f28d6` = first 12 hex of
sha256(SPEC.md) at this write — POLICY §7 manual pairing (same as every prior
turn).

**Root cause (shared):** both findings are acceptance-criteria greps written
against string-presence instead of the property they claim to verify. Both
`class: product`, spec stage; both repaired as **mechanical,
intent-preserving** — reviewed product intent unchanged, so no bounded question
was needed:

- **F15 (A:7):** the old forbidden-string grep banned `title`, which the
  published SENSOR_CORE step 3 mandates (`urgent.issues[].title`, emitted from
  the step-2 `gh issue list` output; the envelope example carries it too). The
  rewritten check bans `body`/`comment` only (the script never fetches or reads
  them) and adds a positive labels-path check (`grep -cE 'labels'` ≥ 1). The
  labels-only *scanning* invariant — in-scope item 6, A:3's note, and the
  `read-verified` criterion — is untouched: carrying an already-fetched title
  through to the envelope is output, not a scan.
- **F16 (A:8):** the old two-stage grep (`workflow-status` → `schema`) could
  never count a genuine import — the package name
  `@gtrabanco/agentic-workflow-schema` does not contain `workflow-status` —
  while a stray comment containing both strings passed with no import at all.
  Replaced with a direct import grep on the real package name. The claim
  "imports the schema package's Envelope v2 vocabulary" is unchanged.

No new evidence rows required (the SENSOR_CORE/envelope/package facts were
already cited in the findings' evidence cells and re-verified 2026-09-09).
Spec-lint product boxes re-run: all pass, counts unchanged (13 sweep rows —
11 in-scope / 2 out / 0 deferred; 19 runnable + 1 `read-verified` criteria;
13 integration rows; items 1–12 → A:1–A:19). Readiness preflight `stage: spec`:
READY-FOR-REVIEW.

## 2026-09-09 — repair batch over open findings F17 + F18 + F19 + F20 (artifactRevisionId: 38-626571011339)

**Decision:** One evidence-bounded repair batch over the four open findings from
review receipt rp-38-20260909-004 (third re-review cycle; POLICY §4's
CONVERGENCE-ANOMALY was printed by the reviewer and routed to owning stage
`product` / `design-feature`, which is this turn). No receipt text touched; no
severity edited; no forge issue opened to hold an obligation. New SPEC
artifactRevisionId `38-626571011339` = first 12 hex of sha256(SPEC.md) at this
write — POLICY §7 manual pairing (same as every prior turn).

**Method change this batch (design-owner instruction):** every acceptance-check
command was run against live reality before being written — the runnable checks
were executed at this revision (`node scripts/check-skill-context.mjs` → exit 0,
39 skills PASS; process-substitution `diff <(…) <(…)` → empty; GNU grep `-E`
`\b` word-boundary form → match; `git diff` of the schema package → empty; the
sensor script itself is still absent, so script-targeting greps/diffs were
form-validated), and the two check *forms* with no runnable subject were
verified against live controls (below). This closes the shared root cause of
F15/F16/F20: acceptance greps and commands written against string-presence or
assumed runtime behavior instead of executed reality.

**Root cause (shared):** the reviewer's four findings trace to one authoring
bias — criteria and closure wording stated *aspirationally* (what should be
true) rather than as commands run against the repository's actual runtime and
files. All four `class: product`, spec stage; repaired as **mechanical,
intent-preserving** plus one **closure completion** — reviewed product intent
unchanged, so no bounded question was needed:

- **F17 (A:20, closure completion):** sweep row 2's fatal-exit expectation
  pointed at an aspirational A:4 parenthetical. Given reviewed Product decision
  6 (namespaced degradation vocabulary incl. `unavailable-git-missing`),
  environmental failures are *not* fatal — they degrade with exit 0. The
  sensor's only fatal class is **invalid invocation** (an unknown flag is a
  usage error). New criterion A:20 (unknown flag → non-zero exit + usage
  diagnostic on stderr), check form verified against the repo's own CLI
  convention (live: `ledger-provenance.mjs` unknown flag → usage + exit 2;
  `check-skill-context.mjs` → exit 1). Sweep row 2 stays in-scope, re-pointed
  to A:20, its stale "like missing git" example corrected against the reviewed
  decision.
- **F18 (mechanical):** sweep row 8's "(modulo volatile timestamps)" aligned to
  A:5's operative strictness (byte-identical verbatim — no volatile fields by
  construction; F9 removed the carve-out from the criterion, the row still
  echoed it).
- **F19 (mechanical + provenance evidence row):** §2's preamble now states the
  provenance — `docs/CAPABILITIES.md` is the unfilled template `init-workspace`
  seeds (placeholder `Exists` cells, template-only roles row); the 13 walked
  subsystems are the template's fixed floor set, each integration row
  self-grounded with project-specific reasons. The spec-lint roles box now
  says the 3 roles are derived from the sensor's consumer set, not inventory
  rows. New evidence row pins the template state (re-verified live 2026-09-09).
- **F20 (mechanical):** A:11's check rewritten to the working form
  `node -e "import('./scripts/workflow-status.mjs')"` — the `./` prefix is
  mandatory (control-verified live on Node v24.19.0: bare `scripts/...`
  specifier → `ERR_MODULE_NOT_FOUND`; `./`-prefixed → exit 0); the legacy
  `--experimental-specifier-resolution=node` flag neither fixed nor affected
  the failure on this runtime and is dropped. The criterion's claim ("no
  external dependencies beyond the schema package") is unchanged.

**Seeding proposal (user confirmation pending, not executed):** seed
`docs/CAPABILITIES.md` from the template with the project's real subsystems
and roles — the file's own header assigns seeding to `init-workspace`, so the
proposal rides the next `init-workspace` (or a dedicated ask); upsert-safe and
outside this SPEC's scope. The 13-row floor set walked in §2 remains valid
until then.

Spec-lint product boxes re-run mechanically (greps pasted below): all pass —
counts unchanged (13 sweep rows: 11 in-scope / 2 out / 0 deferred; 20 runnable
+ 1 `read-verified` criteria; 13 integration rows; items 1–12 → A:1–A:19,
A:20 from sweep row 2). Readiness preflight `stage: spec`: READY-FOR-REVIEW.
