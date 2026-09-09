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