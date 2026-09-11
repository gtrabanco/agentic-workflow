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

## 2026-09-09 — repair batch over review receipt rp-38-20260909-005 (artifactRevisionId: 38-6821d835490b)

**Decision:** One evidence-bounded repair batch over findings F21/F22/F23 (all
stage `spec`, class `product` — the owning stage, per the receipt's routing to
design-feature). No receipt text touched; no severity edited; no forge issue
opened to hold an obligation; no scope added, removed, or redirected. New SPEC
artifactRevisionId `38-6821d835490b` = first 12 hex of sha256(SPEC.md) at this
write — POLICY §7 manual pairing (no runtime rotates the revision id).

**Per-finding classes and edits:**

- **F21 (closure completion):** the timed-out-forge degradation was declared in
  three places but no check produced the case — severed network makes `gh` fail
  fast, so A:4 never exercised a stall. **A:21 added**: fixture-repo test with a
  `gh` shim that accepts and never terminates → exit 0 within the forge timeout,
  `unavailable-forge-timeout` in `detail`. A:4 gained a scope note (fail-fast
  case only, cross-reference A:21); sweep row 10 re-pointed from A:4 to A:21;
  Product decision 6 now states forge calls run under a bounded wall-clock
  timeout (implementation constant) so the code is reachable; decision evidence
  row added (`decision`, verified at implementation by the A:21 fixture).
- **F22 (closure completion):** sweep rows 3 (no interactive prompts) and 6
  (stdout/stderr separation) pointed at A:3, whose check is a mutation-only
  grep and carries neither claim. **A:22 added** (grep proves no
  readline/createInterface/stdin-read/prompt-library call) and **A:23 added**
  (stdout alone parses as one valid JSON document; the A:4 offline fixture
  asserts diagnostics land on stderr); sweep rows 3 and 6 re-pointed.
- **F23 (closure completion + mechanical):** the half's "schema package is
  already an existing dependency" claim was false at the resolution-mechanism
  level — the repo provides no bare-specifier resolution for `scripts/`
  (re-verified live: no root package.json, `node_modules/@gtrabanco` empty,
  `dist/` gitignored), and the established mechanism
  (`scripts/schema-runtime.mjs`) loads the built local package by explicit path
  with a named fail-fast precondition and deliberately no published-package
  fallback. Product decision 2 and Tooling corrected to that mechanism (the
  original decision's reviewed intent — only the schema package, no new
  packages — is unchanged; no root package.json or dependency install is
  proposed, so reviewed scope is untouched); in-scope item 1 aligned. **A:8**
  rewritten: grep for the `./schema-runtime.mjs` loader import + forbid the
  bare-specifier import (which could never resolve). **A:11** rewritten into
  two cases: built-dist import exits 0; `dist/` hidden → the loader's named
  precondition error, never a bare `ERR_MODULE_NOT_FOUND`. New evidence row
  pins the live mechanism (`proven`, re-verified 2026-09-09).

**Why autonomous (no user question):** every edit preserves reviewed product
intent — the vocabulary, scope, roles, and user outcomes are unchanged; F23's
correction adopts the repository's own documented precedent rather than
introducing a new surface (the alternative, adding a root package.json +
dependency install, would have been scope growth and would have stopped for a
bounded question). Grounding is the evidence rows added with this batch, not
memory.

Spec-lint product boxes re-run mechanically after the write: all pass — 13
sweep rows (11 in-scope / 2 out / 0 deferred), 23 runnable + 1 `read-verified`
criteria (A:1–A:23 contiguous), 13 integration rows, in-scope items 1–12 →
A:1–A:23 with sweep rows 2/3/6/10 resolved by A:20/A:22/A:23/A:21. Readiness
preflight `stage: spec`: READY-FOR-REVIEW.

## 2026-09-09 — engineering planning batch (artifactRevisionId: 38-plan-1)

`plan-feature` scoped route after the Product-review gate passed (receipt
`rp-38-20260909-006`, snapshot `02c17f26…`, zero open material findings). The
Product half was not touched. Engineering decisions E-38-1…E-38-8 (also in
SPEC `### Decisions to confirm`):

**E-38-1 — Envelope self-validation is a diagnostic, never a gate.** The
script runs `validateEnvelope` before printing; a mismatch prints a stderr
diagnostic and still emits the envelope with exit 0 (fail-open). Rationale:
A:20 restricts the fatal class to invalid invocation; the degradation posture
(A:4/A:19/A:21) keeps drivers unblocked; envelope correctness is A:2's
fixture suite's job. Evidence: `src/index.ts` `validateEnvelope` export
(planning-evidence PE-002).

**E-38-2 — Skill bump level: minor (3.2.1 → 3.3.0).** The slimming rewords
the skill's process (assembly → script call + interpretation); the external
contract — argv parity, envelope shape, human report layout (non-goal §8) —
is unchanged. Evidence: PE-015/PE-016/PE-017.

**E-38-3 — Discipline pins re-target from prose-presence to script-behavior
form.** Pins that lose their prose home when SENSOR_CORE.md slims
(bounded-delivery 6a heading + SKILL.md routing pin; workflow-status-pre-
execution step-8 rule source; pre-execution-quality label-override pin) move
to asserting the script's behavior — the mechanical rules' single home
becomes the script. Never weakened: every pin keeps its asserted behavior or
gains the stronger form (O26). Evidence: PE-007.

**E-38-4 — `--version` prints the schema package's version.** No root
`package.json` exists; the version that matters is the one whose vocabulary
the script emits from (`packages/agentic-workflow-schema/package.json`).
Evidence: PE-001/PE-008.

**E-38-5 — Forge timeout + unknown-flag exit code are implementation
constants pinned red-first.** Values fixed at implementation; tests pin the
behavior (bounded latency; non-zero + stderr usage), matching the repo CLI
convention (live 2026-09-09: ledger-provenance exit 2, check-skill-context
exit 1). Evidence: PE-006.

**E-38-6 — Fix #179 overlap declared disjoint and sequenced.** #179
(pending) amends the sensor 6a vocabulary after its dependency gate opens
(features 31/32 merged) and touches surfaces outside 38's file list; from
this unit on it amends the script + PRE_EXECUTION.md together. Not blocking.
Evidence: PE-011.

**E-38-7 — Scripts/ distribution gap recorded, not blocking.** The pi bundle
copies skill trees only; the slimmed skill references a root script that an
installed release lacks. Tracked in known-issues.md → issue #198; in-repo
dogfooding unaffected. Evidence: PE-009.

**E-38-8 — Step 6a receipt sensing shells out to the snapshot verifier.**
`node scripts/pre-execution-snapshot.mjs verify --stage <spec|plan> --unit
<id> [--parent <64-hex> for plan-stage features]`, structured verdict mapped
through the label table; unresolvable revisions fail open → unflagged.
Evidence: PE-005.

Phase cut: 4 phases (P1 script core, P2 failure contract, P3 skill slimming,
P4 qualification) — under the ~5 split threshold, one layer each, zero open
decisions. Stage-2 architectural classification: `n/a` (no project-invariants
document exists — NRS F010); workflow invariants (read-only, labels-only, no
decision logic, vocabulary unchanged, no dependency) are carried as
obligations O3/O7/O12/O13/O8/O11 and preserved by design. Readiness preflight
`stage: plan`: READY-FOR-REVIEW (artifactRevisionId `38-plan-1`, planning
evidence PE-001…PE-017, obligations O1…O26, zero unknowns).

## 2026-09-10 — operator-approved scope amendment: fold fix #209 into 38 (artifactRevisionId: 2bee477ba469)

**What:** Fix #209 (release policy — no majors until #176 merges) folded into
feature 38's scope: `CLAUDE.md`'s versioning guidance gains the freeze rule
(A:25 / AC-24 / O28); implemented pre-execution in this amendment commit
(E-38-9). Feature 38's own bump (E-38-2, 3.2.1 → 3.3.0 minor) already complies.

**Why:** Operator instruction to include the version-policy line within 38's
deliverables; the policy directly governs how this feature versions itself.

**New SPEC artifactRevisionId:** `2bee477ba469` = first 12 hex of
sha256(SPEC.md) at this write — POLICY §7 manual pairing. Readiness preflight
`stage: plan`: READY-FOR-REVIEW (delta, bounded per the operator ruling).

---

## 2026-09-09 — operator-authorized consolidated unblock batch (artifactRevisionId: 38-c51c1416f9bf)

**Operator instruction (2026-09-09, this session):** the design↔review and
plan↔review loops do not converge (38: six spec cycles + first plan review;
45: seven spec cycles — reported with researched fix directions in forge issue
[#205](https://github.com/gtrabanco/agentic-workflow/issues/205)). The operator
directed one consolidated repair batch over the four open plan-review findings
F25–F28 followed by a **bounded delta re-review** — the exception recorded in
issue #205's "Immediate operator unblock", not a change to the review contract
(the durable fix lands through the issue, design-side).

**Per-finding resolutions (all mechanical or closure completion; no reviewed
product intent changed):**

- **F25 (plan, P9):** A-17/A-20 behavior and pins moved into the same phase —
  the pins are red-first inside P1 (pin task before the implementation task)
  and P2 re-asserts them unchanged; P2 keeps `--help`/`--version` (genuinely
  red at P2 start). SPEC P1/P2 phase paragraphs, TASKS, PLAN, testing ladder
  updated consistently. Task counts unchanged (8/8).
- **F26 (product, L4):** criterion **A:24** added — `references/ENVELOPE_CORE.md`
  slimmed: script-backed reference present (`grep -c 'scripts/workflow-status.mjs'`
  ≥ 1) AND assembly self-check prose gone (`grep -cE 'self-check before
  printing'` → 0; the script owns the self-check per E-38-1). ACCEPTANCE row
  A-24 frozen; spec-lint counts 24 runnable + mapping box item 7 → A:24. The
  F12 resolution form (extend the acceptance set) — no new product choice:
  the criterion mirrors A:9's shape on a surface the SPEC already names.
- **F27 (plan, L5):** dev scenario `sensor:envelope-mismatch` added (forced
  mismatch via a stub schema build swapped through the explicit-path loader,
  PE-001) + P1 red-first mismatch pin + obligation **O27** (P1, suite
  validator). E-38-1's contract is now enforced: a gating implementation
  fails the pin.
- **F28 (product, info):** A:7/A-07's forbidden set scoped to forge request
  field lists — documenting the labels-only invariant in a source comment can
  no longer flip the check; the invariant itself unchanged (in-scope item 6 +
  A-RV).

**Operator ruling for this unit's remaining reviews (bounded):** delta review
over the changed surfaces + the findings' resolution evidence; a finding
blocks only if it names a user-visible outcome the frozen acceptance manifest
misses or a contract violation — `low`/`info` process findings are recorded,
advisory, never cycle-restarting. This ruling is the temporary local form of
issue #205's proposed materiality bar and is superseded by it once landed.

New SPEC artifactRevisionId `38-c51c1416f9bf` = first 12 hex of
sha256(SPEC.md) at this write — POLICY §7 manual pairing. Readiness preflight
`stage: plan`: READY-FOR-REVIEW (delta, bounded per the operator ruling).

## 2026-09-11 — operator-directed consolidated repair batch over rp-38-20260909-010 F31–F34 + open F24 (artifactRevisionId: 5eb9724bb44f)

**Operator instruction (2026-09-11, this session):** one consolidated repair
batch over the four open plan-review findings F31–F34 plus the open info row
F24 — the same consolidated form the operator authorized for F25–F28 (issue
#205 "Immediate operator unblock"); the plan-side repairs are mechanical
re-alignments that restore prior frozen/found forms, no reviewed product intent
changed. New SPEC artifactRevisionId `5eb9724bb44f` = first 12 hex of
sha256(SPEC.md) at final write — POLICY §7 manual pairing; the id is recorded
here and in progress.md, never inline in SPEC.md (the convention receipts
rp-001…rp-009 verified).

**F31 identity repair (POLICY §7 pairing, claimed beside recomputed):** the
fold batch (32bb6434) recorded SPEC artifactRevisionId `2bee477ba469` as
"first 12 hex of sha256(SPEC.md) at this write" and stamped it inside the
Design status block. Recomputation does not support it: sha256(SPEC.md) at
32bb6434/1ce0bfae/HEAD-before-batch = `2e0ab6084f21…` — a recorded value no
recomputation supports is a defect in the artifact that recorded it (POLICY
§7), and an id inside the hashed file can never pair with its own hash.
Repair (mechanical, intent-preserving): the in-file stamp is removed from the
Design status block; the revision lineage lives only in decisions.md and
progress.md; the old id `2bee477ba469` stays recorded above as history (never
rewritten), with this entry carrying the recomputed value beside it. F31's
lineage route stands unchanged: /review-spec 38 bounded delta re-review first;
the plan receipt is then re-derived over the new snapshot — never re-copied
digests.

**Per-finding resolutions:**
- **F24 (spec, info, open since rp-006; mechanical):** A:10's check text now
  carries the version source (the schema package's version, per E-38-4) that
  sweep row 13's gloss and the frozen AC-10 outcome cell already name.
- **F32 (plan, low; mechanical):** ACCEPTANCE AC-07 + obligations O7
  re-aligned to SPEC A:7's F28-scoped grep (forge request field lists) — the
  ed7aae98 regression to the unscoped `\b(body|comment)` form is reverted to
  the scoped `\-\-json[^|]*(body|comment)` form the governing criterion
  carries; the labels-only invariant itself unchanged.
- **F33 (plan, medium; closure completion):** O25 (bilingual-sync, P4), O26
  (no-weakening pins, P3), O27 (envelope-mismatch diagnostic-not-gate, P1 —
  F27's frozen resolution) restored verbatim from the parent 2e34445b ledger;
  the dangling (O26) citations at PLAN.md:112 / TASKS.md:193 resolve again;
  O24 is covered by its rename O-RV (same obligation, AC-RV, P4).
- **F34 (plan, low; mechanical):** testing.md's sensor:envelope-mismatch
  inventory row re-pointed P2 → P1 (ladder row 1, TASKS P1 pins and the SPEC
  scenario table now agree).
- **F29 stays open, advisory** (operator materiality bar): its fold path is
  implementer guidance (all forge reads on explicit `--json` field lists);
  no SPEC edit — re-litigating the F28 tradeoff would be a product change.

Readiness preflight `stage: spec`: READY-FOR-REVIEW (delta over the changed
surfaces + the findings' resolution evidence, per the operator ruling in the
2026-09-09 entry). Route: /review-spec 38 → /review-plan 38 → /execute-phase 38.

## 2026-09-11 — operator ruling: fold the advisory plan-review batch F35–F41

The operator directed a mechanical fold of rp-38-20260911-012's seven
advisory/info findings (F35/F36/F37/F41 low advisory, F38/F39/F40 info —
material open: 0) into the planned artifacts before execution, as one batch.
Rulings within the batch:

1. **No re-scaffold.** The unit is `planned`; the fold is repair-in-response on
   the existing plan set (the review-flow's "replan the batch" route). The
   roadmap row, the phase structure (8/8/7/9 task counts) and all four phase
   fingerprints are untouched.
2. **F37 takes the shim route, not the Design-scoping route.** The reviewer's
   fold path offered "add the shim variants" or "scope the Design sentence".
   Scoping would weaken the declared failure contract (technical goal 3:
   declared failure, never improvised — a missing `gh` binary is a real,
   common state) and would be a product-side change; the shim route keeps the
   declared contract intact and closes the scenario gap. No product change.
3. **AC-09's validator cell is re-formed** (F36) against `git diff main...HEAD`
   + a pinned baseline count — same pre-execution fold class as F32's AC-07
   re-alignment (rp-010 repair batch), not an execution-time manifest edit.
4. **Handoff id `a33f09373308`** = first 12 hex of sha256(SPEC.md) at the
   batch's final bytes, recorded beside the recomputed source revision per
   POLICY §7 pairing; the bound artifactRevisionId remains the RS3(b) default
   (the commit that lands these bytes), re-derived by the reviewer — never
   copied.

Consequence: the newest plan receipt (rp-012) binds pre-batch bytes → stale
for the folded set → bounded delta re-review required: /review-plan 38 (the
spec receipt rp-011 stays current — the `spec-product-v1` projection excludes
the Engineering half, verified `digestMatches: true` post-write), then
/execute-phase 38.

## 2026-09-11 — P1 phase-cut reconciliation (SPEC P1 vs PLAN/TASKS P2 bullet placement)

**What:** P1 delivered the SENSOR_CORE steps 1–9 happy path (git/forge
collection, urgency labels-only scan, roadmap + fix-index parsing, transitive
dependency closure, readiness + step-6a receipt sensing, phase progress, review
marks, fix-now fold projection, envelope assembly) as the SPEC `#### P1`
definition mandates — “`scripts/workflow-status.mjs` exists and executes
SENSOR_CORE steps 1–9 into one schema-valid Envelope v2 on stdout”. P1's frozen
done-when (schema-validity, field-presence, read-only, idempotence,
roadmap-mapping, labels-only, flag-contract, envelope-mismatch) is therefore
green at the P1 commit.

**Why:** the PLAN.md/TASKS.md P2 checklist groups the same step 1–9 bullets
under P2, while the SPEC P1 prose + done-when and the obligations ledger
(P1-owned O1/O3/O8/O10/O11/O17/O20/O22/O23/O27) and `testing.md` ladder row 1
place the happy path's pins in P1. The SPEC phase definition governs: P1's gate
can only be green if the happy path ships in P1.

**Resolution (mechanical, intent-preserving, no criterion/task/scope change):**
P1 owns the happy path; P2 owns the declared-failure contract (crash-recovery
verdict mapping, namespaced degradation codes + bounded timeout,
`--last-envelope` no-progress guard + fail-open hint, forge/git shim scenarios)
and re-asserts every P1 pin unchanged. The overlap is checklist placement only —
every acceptance criterion still has exactly one implementing phase as the
obligations ledger records. Recorded here per the execute-phase hard rule
(“Plan conflict: update TASKS.md/PLAN.md and record why in decisions.md”).

**P1 gate:** `node --test scripts/workflow-status-sensor.test.mjs` → exit 0
(19/19 P1 pins); `node --test scripts/*.test.mjs` → 226/227, the single failure
pre-existing on `main` (`check-skill-context` route ceilings — known-issues
B-04).

## 2026-09-11 — P3 slimming: command prose vs semantic anchors (O26), and the budget re-basis

**What:** `skills/workflow-status/SKILL.md` (3.2.1 → 3.3.0) slims to
run-the-script / read-the-JSON / interpret-`next.recommended`; the assembly
sequence is gone and the turn contract now names the script.
`references/SENSOR_CORE.md` replaces the git/forge command prose (the old steps
1–2) with the script invocation, keeping the numbered semantic blocks the script
implements (steps 3–9 including 6a, the review-mark currency rule, and the
fix-now fold projection) plus the `sensor-fields@1` grammar block.
`references/ENVELOPE_CORE.md` names `scripts/workflow-status.mjs` as the
deterministic producer and drops the assembly `self-check before printing`
heading (the script owns the `validateEnvelope` self-check).

**Why the semantic anchors stay (TASKS P3 task 4 reconciliation):** three root
suites read that prose as the *contract under test* —
`workflow-status-pre-execution.test.mjs` reads step 8 and applies its currency
rule to a real git fixture; `pre-execution-quality.test.mjs` reads step 6a's
label-override rule and the verify recipe; `bounded-delivery-loops.test.mjs`
reads the 6a heading. Re-pointing them to a grep of the script (as P3 task 4
sketched) would **weaken** those assertions — the explicit thing O26 forbids —
because a grep proves a string exists, not that the rule survives a real review
turn. Keeping the prose contract *and* the script that implements it keeps every
pin green and gains the stronger form where it applies: `bounded-delivery-loops`
now asserts **both** the 6a semantics and the script's verifier invocation. No
acceptance criterion, task, or scope changed.

**Budget re-basis (known-issues B-04):** `node scripts/check-skill-context.mjs`
was red repo-wide on `main` — 15 route ceilings below the tool's own
`measured × 1.10` bound (`execute-phase:*`, `review-change:*`, predating this
unit; growth from features 29/30/31). P3 applied the tool's prescribed
remediation: every over-ceiling route raised to `ceil(measured × 1.10)` and the
`workflow-status` entry added at its measured values, with the growth source
named in `SKILL_CONTEXT_BUDGETS.json` `policy.declared`. A:14 now exits 0.

**P3 gate:** `node scripts/check-skill-context.mjs` → exit 0 (39 skills / 22
routes); `node --test scripts/bounded-delivery-loops.test.mjs
scripts/pre-execution-quality.test.mjs scripts/workflow-status-pre-execution.test.mjs
scripts/normative-drift.test.mjs` → exit 0 (87/87).

## 2026-09-11 — P4 close-out: the roadmap status edge is `done`, not `in-progress`

TASKS P4's PR task wrote "update roadmap row to `in-progress · [PR #<n>](<pr-url>)`",
but the roadmap's own status legend assigns the PR-open edge to **`done`**
("`done` — built and its PR open … Set by the PR-open step"), and `in-progress`
is set by `execute-phase` P1 (already applied). The plan-task wording is a
mechanical slip; the sanctioned write is `done · [#<pr>](<pr-url>)`. Recorded
per the execute-phase plan-conflict rule; no criterion or scope changed.
