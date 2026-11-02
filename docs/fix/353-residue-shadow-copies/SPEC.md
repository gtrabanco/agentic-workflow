# fix/353-residue-shadow-copies

## Issue

`#353` — tracked issue. The PR closes it via `Closes #353`.

## Specs

**S1 — the duplicate/obsolete rule lives in `review-code`, not `review-change`.**
> Quizás es excesivo añadirlo en review-change porque ya hace demasiadas cosas pero es que tiene mucho sentido en review-code, en una review de código es algo habitual antes de mergear una PR, un programador experto detectaría estos errores tanto de documentación como de código y pediría cambios antes de aprobar una PR con este tipo de defectos. Además el implementador puede fallar en este sentido perfectamente.

**S2 — both classes are covered: duplicated and obsolete.**
> Se trata tanto de código duplicado como obsoleto.

**S3 — the project declares its version-support policy in `AGENTS.md`; this repo supports none.**
> Luego el autor del proyecto decidirá vía su AGENTS.md como quiere hacer el soporte de versiones viejas, en nuestro caso en el AGENTS.md debe estar escrito que no queremos mantener soporte de versiones viejas ya que pineamos las dependencias todas en la misma versión y tenemos mecanismos para ello.

**S4 — the product-wide sweep must carry the same two cases.**
> Si product-audit no detecta este tipo de defectos, review-code tampoco y unit-lane no trata de evitarlos es que no se implementó bien este cambio para eliminar código y documentación de forma segura.

## Impact

`review-code`'s checklist is read by `review-change` and `product-audit` (both compose the
pass) and pinned by `scripts/residue-dimensions.test.mjs`. `product-audit`'s residue
dimensions are read by its audit route and pinned by the same suite. The repo's
`AGENTS.md` is the agent guide every session loads and the `normative-surfaces@1`
inventory's host; `template/AGENTS.md` is copied into every target project by
`init-workspace`, so the row added there is the contract a project author fills.
The determinism boundary: this unit changes the **rule the reviewer applies**, never
the detector (`#352` owns `agentic-workflow shadow`).

## Retirements

None — nothing is superseded. The added clauses narrow two existing checklist items
and one existing dimension bullet; no line is removed and no contract is replaced.
Why nothing can be removed: the residue surfaces are the ones `#340` just shipped
and this unit extends their scope rather than rewriting them.

## Non-goals

- No new review axis, no new skill, no change to `review-change`'s composition.
- No change to the `#340` decision table, severity scale, or two-way unused-code routing.
- No deterministic detector in this unit (`#352`).
- No rewrite of `docs/CAPABILITIES.md` or of any project that already forked scripts.

## Future

None.

## Future cost

- Every project bootstrapped from `template/AGENTS.md` must fill the compatibility row;
  a blank row is an open question at `init-workspace` time, not an assumed `none`.
  Binds `init-workspace` and the review pack that reads the row.

## Applicable tests

`node --test scripts/residue-dimensions.test.mjs` — the discipline suite that pins every
`#340`/`#353` surface. No test is weakened; five pins are added.

## Known pre-existing issues

- `#352` — skills cite `bun scripts/<x>.mjs` for files target projects do not have; the
  convention that produced the observed shadow copies. `affects` this unit's rationale,
  `does-not-affect` its deliverable (this unit writes the reviewer's rule, not the runner).
- `#319` — the in-flight location-index unit owns `docs/ROADMAP.md`'s relocation; this unit
  only appends a `## Fixes` row. `does-not-affect`.

## Tasks

- P1 — add the five discipline pins for the shadow-copy, prose-citation, obsolete-by-mechanism, product-audit and policy surfaces, and run them red against the live tree (validator: `node --test scripts/residue-dimensions.test.mjs` exits non-zero, every new pin failing on its missing prose) (Implements: S1, S2, S3, S4)
  Relevant files: scripts/residue-dimensions.test.mjs
- P2 — extend `review-code`'s checklist: shadow copy of a pinned/published artifact is duplication, a prose citation is not a consumer, an obsolete-by-mechanism surface is `fix-now (delete)`, decided by the project's `AGENTS.md` compatibility policy (validator: `node --test scripts/residue-dimensions.test.mjs` exits 0) (Implements: S1, S2)
  Relevant files: skills/review-code/SKILL.md
- P3 — carry both cases in `product-audit`'s existing residue dimensions, no new dimension (validator: `node --test scripts/residue-dimensions.test.mjs` exits 0) (Implements: S4)
  Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md
- P4 — declare the no-backward-compatibility policy in the repo's `AGENTS.md` and add the declaration row to `template/AGENTS.md` (validator: `node --test scripts/residue-dimensions.test.mjs` exits 0) (Implements: S3)
  Relevant files: AGENTS.md, template/AGENTS.md
- P5 — changeset intent file plus the full gate sweep (validator: `bun scripts/check-skill-context.mjs` exits 0 and `scripts/normative-drift.test.mjs` exits 0) (Implements: S1, S2, S3, S4)
  Relevant files: .changeset, docs/ROADMAP.md

### Planning evidence

| id | claim | source | certainty |
|---|---|---|---|
| PE-001 | `#340` shipped residue detection in all four owners, pinned by a discipline suite | `git log -S 'Duplication is a deletion candidate'` → `db72144b`; `scripts/residue-dimensions.test.mjs` | confirmed |
| PE-002 | `review-code`'s duplication item is intra-repo ("a changed block does not re-implement an existing helper") | `skills/review-code/SKILL.md:37` | confirmed |
| PE-003 | `product-audit`'s unused-code rule tests "nothing consumes it" and its duplication rule names copied prose blocks | `skills/product-audit/references/AUDIT_DIMENSIONS.md:14-16` | confirmed |
| PE-004 | A target project forked 13 runtime scripts and cited them from its own seeded `AGENTS.md`, so a textual consumer search finds them alive | `~/projects/webs/scripts/*.mjs` (staged), `~/projects/webs/AGENTS.md:442` | confirmed |
| PE-005 | Neither the repo guide nor the template declares any version-support policy | `grep -rn -i 'backward\|version support' AGENTS.md template/AGENTS.md` → no policy hit | confirmed |
| PE-006 | The `ask-dont-infer@1` owner block constrains `review-code`'s wording, not its content | `scripts/residue-dimensions.test.mjs` §6 (`STAGE_REFS`, `REFERENCE_WINDOW`) | confirmed |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | S1/S2 | a pre-merge code review classifies a shadow copy and an obsolete surface, whichever implementer wrote them | P2 | P2 | skills/review-code | `node --test scripts/residue-dimensions.test.mjs` | exit 0 | verified |
| OB-2 | S4 | the product-wide sweep carries the same two cases without a new dimension | P3 | P3 | skills/product-audit | same | exit 0 | verified |
| OB-3 | S3 | the policy the reviewer cites exists in this repo and in every bootstrapped project | P4 | P4 | AGENTS.md + template | same | exit 0 | verified |
| OB-4 | #340 | no existing pin is weakened and no `#340` surface is rewritten | P1–P5 | P1 | scripts/residue-dimensions.test.mjs | same | exit 0, suite green | verified |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-01, owner request, verbatim: the four `S#` quotes above.
- **D1** — 2026-11-01, owner directive: the rule belongs to `review-code`; `review-change` already composes too much, and the compatibility policy is declared by each project's `AGENTS.md`.
- **E1** — 2026-11-01, `node --test scripts/residue-dimensions.test.mjs` · exit 1 · four new pins failing on missing prose (red-first).
- **E2** — 2026-11-01, `node --test scripts/residue-dimensions.test.mjs` · exit 0 · 29 tests pass after P2–P4.
- **G1** — 2026-11-01, `bun scripts/check-skill-context.mjs` · exit 0 · every budget within its ceiling.
- **G2** — 2026-11-01, `node --test scripts/normative-drift.test.mjs` · exit 0.
- **G3** — 2026-11-01, `node scripts/run-root-suite.mjs` · exit 0 · 1289 pass, 0 fail (the review's gate run; the residue suite 29/29, `bun scripts/check-skill-context.mjs` exit 0 and `normative-drift` 20/20 re-ran green in the same pass).
- **R1** — 2026-11-01, review-change · HEAD `729271b3e1a332fce2c42d0505d60e9f4b9639e2` · REVIEW-PASS · cycle 1 · gate exit 0 · 0 fix-now rows (3 low report-notes; 1 candidate refuted — missing `## Acceptance criteria` is the #308 spec-by-reference shape, pinned by `scripts/unit-doc-contract.test.mjs:195-211`).

## Next

Open the PR and run `/review-change` at its HEAD.

## References

- `#353` — this fix's tracked issue.
- `#340` (`db72144b`) — the residue-detection feature this unit extends.
- `#352` — the distributable runner; owns the deterministic shadow-script detector.
