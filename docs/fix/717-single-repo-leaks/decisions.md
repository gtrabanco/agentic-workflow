# 717 — single-repo-leaks · decisions

One row per unit decision: what was decided, the authority it rests on, and what
it forecloses. `unit-only` rows stay here; a `cross-unit` row names the ONE
permanent owner doc it was promoted to (issue #650) and never restates it.

## D1 — the census's closed classification vocabulary

**Decision.** An occurrence is classified with exactly one value from:
`declared-convention`, `construction-only (documented)`, `construction-only
(undocumented)`, `defect`, `intentional`. This is the union of `S4`'s four
(`confirmed-defect / construction-only / declared-convention / intentional`)
and `S11`'s four (`declared convention / construction-only (documented) /
construction-only (undocumented) / defect`), mapped 1:1: `confirmed-defect` =
`defect`; `construction-only` splits on the documented/undocumented axis,
which is exactly the distinction `S3`'s test turns on.

**Authority.** `S4` and `S11`, both quoted in `## Specs`.

**Scope.** `unit-only` — the vocabulary is the census's, and the census lives in
this unit folder.

## D2 — the review step is the owner's external verification

**Decision.** `review-change`, `audit-pr` and the fold cycle are not run on this
change. The tier verdict's ceremony (`unit-doc+review-change`) is satisfied by
the owner reading the diff and the evidence, per §4 of the governing workflow
quoted in `## Log` L2. The tier stays `high` and its named high-risk item is
quoted in `## Impact`; nothing about the tier is lowered or waived.

**Authority.** The operator's governing workflow, `## Log` L2 §4.

**Scope.** `unit-only`.

## D3 — the standing criterion is behavioural, not lexical

**Decision.** The recurrence check is (a) a required `resolution` declaration
per CLI subcommand, in `help.mjs` — the one machine home of the CLI grammar —
and (b) a foreign-tree fixture run of the read-only `project`-class commands.
A per-literal corpus of path strings is **not** built.

**Authority.** `S10` asks for a standing criterion; the measurement in
`planning-evidence.md` PE-009 shows a lexical scan cannot separate a resolved
path from a prose citation (458 raw hits, 138 after comment stripping, dominated
by citations and by segment-wise `path.join` calls). A declaration plus a
behavioural run measures the thing `S3`'s test names — whether a consumer can
satisfy the path — and it fails on a new leak instead of on a new wording.

**Forecloses.** A future unit cannot add a subcommand without declaring which
root it resolves against; it can still add one that *lies* about the value, and
only the fixture run narrows that.

**Scope.** `unit-only`.

## D4 — S5's open question: the unit-doc grammar is the single supported consumer shape

**Decision.** The phase-block grammar (`### P<n> — …` + a separate `Layer:`
line) and its target→layer prefix table are **product-construction-only**. The
unit-doc grammar — the shape all four unit-doc templates seed and every unit doc
in this tree uses — is the supported consumer shape, and it never reads the
table (`PE-002`). The scoped restriction is written where the grammar's rules
are owned (`skills/phase-contract/SKILL.md`), and the refusal it produces stops
being a bare `unparseable`: an unmappable target is `layer-unknown` and names
the token. No config section, no `LAYERS` enum move.

**Authority.** `S5` itself asks this exact question and authorizes either
answer; `PE-001`/`PE-002` measure the two grammars' behaviour; `PE-010` records
that `unparseable`'s other causes are documented and stay.

**Forecloses.** A consumer that writes the legacy phase-block grammar keeps
failing closed — now with a reason a reader can act on. A declared layer map
stays available as a future unit (`known-issues.md` K1), never as an
undocumented assumption.

**Scope.** `unit-only`.

## D5 — findings found while censusing route to the owner, not into this unit

**Decision.** A candidate the census classifies `defect` is repaired here only
when the repair is one contained correction on the same class; every other
finding becomes a row in `known-issues.md` with its re-trigger condition and is
handed to the owner. No new forge issue is opened by this unit.

**Authority.** `S11` §4 ("Fix or file each defect separately") plus the
governing workflow's correction bound (§9: a new finding goes to the owner).

**Scope.** `unit-only`.

## D6 — the three repairs ride in this unit

**Decision.** The three confirmed defects (`phase-lint`'s unnamed cause,
`test-obligation-tags`' product-relative vocabulary, `dimension-regression`'s
silent zero-dimension comparison) are repaired here rather than filed as three
follow-up issues, because each is a single fact at the wrong root and the census
is not done while its own findings are still open.

**Authority.** `S11` §4 ("fix **or** file") and `S12`'s `fix-now (M)` verdict.

**Scope.** `unit-only`.
