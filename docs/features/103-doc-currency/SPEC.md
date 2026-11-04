# 103 — doc-currency

> One-line: the READMEs are repaired against what the tree actually ships, and documentation currency becomes a guide rule, a required docs step and an audit check.

## Specs

**S1 — The project and package READMEs need attention against what has been delivered.**
> "Llevamos varias features entregadas y no sé si estamos actualizando el README.md con la nueva documentación me encuentro features como embeddings y otras cosas hechas que ni si quiera sabía que ya las habíamos entregado, los README.md de los paquetes y del proyecto necesitan un poco de atención y ver que cosas hay que actualizar."

**S1a — Scope correction: the repair is complete — fix what is wrong *and* add what is missing.**
> Answer to "¿Qué alcance de reparación quieres para los README?": **"completo"** — "Corrige lo obsoleto/incorrecto Y añade lo que falta: runner crate + doc CLI/embeddings, fila de /unit-lane, ejemplos con skills retiradas, links, conteos."

**S2 — If nothing was being documented and obsolete documentation was not being deleted, the guide must say how.**
> "Si no hemos ido documentando y borrando documentación obsoleta, hay que añadir en el AGENTS.md como hacerlo"

**S3 — …and it has to be a required step of the project.**
> "…y añadirlo como paso requerido en el proyecto."

**S4 — One change carries the README repair, the AGENTS rule and the required step.**
> "Reparar el README, regla en AGENTS + paso requerido."

**S5 — A separate issue owns the automation: a forced documentation task, rendered in the format the project declared at initialization.**
> "Y crear una issue para incluir reglas que obliguen a crear una tarea que sea documentar lo que se ha hecho y automatizar la documentación también en formato md, mdx, html, latex o lo que el usuario haya decidido al inicializar el proyecto, pero hay que documentar el código y features realizadas."

**S6 — The step is prose: a guide rule, an explicit checklist and an audit check — no new script.**
> Answer to "¿Cómo de obligatorio debe ser el nuevo paso de documentación?": **"prosa"** — "Regla en AGENTS.md (y su gemelo en template/AGENTS.md), checklist explícito en el paso `docs` (unit-lane/execute-phase) y check nº15 en audit-docs. Sin script nuevo."

## Impact

- **Consumes:** the root `README.md` (the install and discovery surface every reader starts at), the three package READMEs (npm-facing), `AGENTS.md` (loaded in full by every session — the guide-layer ceilings absorb 4 lines / 70 est: 388/393 lines, 297/302 prose, 6865/6881 estimate, measured with `bun scripts/check-skill-context.mjs --documents`), `template/AGENTS.md` (the exported scaffold — `init-workspace` upgrade mode offers the new block additively, and `scripts/scaffold-guide.test.mjs` T6 forbids dated repository internals inside it, which the block carries none of), `docs/workflow/SKILLS.md` (narrative axis rows).
- **Consumed by:** `skills/audit-docs/SKILL.md`'s fixed report contract, which `scripts/review-loop-discipline.test.mjs` (IS-2) pins — the count moves with the skill, under the recorded justification + owner approval in this unit's `decisions.md`; the version-parity gate, which the three package READMEs and `skills/**` trigger (satisfied by `.changeset/103-doc-currency.md`).
- **Stops being true:** `packages/agentic-workflow` has "no producers"; the repo ships two packages; `plan-feature` is an installable/routable skill; each skill versions independently; the fix index lives in `docs/fix/README.md`; `progress.md` is the executor's handoff; `audit-docs` runs 14 checks.
- **Asks before touching something live:** nothing outside this repository's own surfaces — no published artifact is republished here, the changeset defers every version decision to `scripts/release.mjs`, and the frozen test edit is the one protected write (recorded, approved).

## Retirements

Every retired surface with its negative-capability pin (`rg` → no match, exit 1 — each run recorded in `## Log`):

| Retired surface | Replacement | Pin |
|---|---|---|
| `Current producers: none yet` (+ the "feature 42 is the next candidate" line) | the `## Commands` reference table in `packages/agentic-workflow/README.md` | `rg -c "Current producers: none yet" packages/agentic-workflow/README.md` → no match |
| `plan-feature` / `plan-fix` as live names in install, route and Hermes examples | `unit-lane` in every example; `plan-feature-interview` kept only where it cleans an old lockfile | `rg -n -- "-s plan-feature\|--skill plan-feature\|remove plan-feature$" README.md` → no match |
| `two companion npm packages` (guide layout, tutorial index) | "three companion npm packages", the third named | `rg -c "two companion npm packages" AGENTS.md docs/workflow/README.md` → no match |
| `Each skill is versioned independently` / `evolves independently` | one train version (D-40-14) in `README.md` and the `CHANGELOG.md` header | `rg -c "evolves independently\|versioned independently" README.md CHANGELOG.md` → no match |
| `docs/fix/ … + index README` in the layout | "the active-fixes index lives in docs/ROADMAP.md" | `rg -c "fix SPEC template \+ index README" README.md` → no match |
| `compact handoff via progress.md` | the unit doc's own `## Tasks` and `## Log` | `rg -c "via \`progress.md\`" README.md` → no match |
| the second, identical `log-session` row under `### Session` | one row under `### Document` plus a pointer | `rg -n "^\| \`log-session\`" README.md` → exactly one match |
| `Check (1-14)` / `Checks run: <n>/14` | `Check (1-15)` / `<n>/15` in the skill **and** its pin | `rg -c "Check \(1-14\)\|<n>/14" skills/audit-docs/SKILL.md scripts/review-loop-discipline.test.mjs` → no match |

## Non-goals

- **No documentation generation.** Rendering anything into `md`/`mdx`/`html`/`latex`, and forcing a documentation task per unit, is issue [#396](https://github.com/gtrabanco/agentic-workflow/issues/396) (S5's issue half) — this unit lands the rule and the check, never the generator.
- **No new script and no new gate** (S6): the step is prose plus existing suites.
- **No repair of `audit-docs`' checks 10 and 11**, which still name pre-lane artifacts — recorded below as a known pre-existing issue, `does-not-affect`.
- **No model-guidance refresh** of the root README's NaN section (feature 64's surface) — out of scope.
- **No skill rename, no new menu entry, no frontmatter change** beyond `audit-docs`' description axis line.

## Risk tier

Verdict copied verbatim from `bun scripts/ceremony.mjs tier classify` at the change's own diff (the tier is the classifier's, never this document's):

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "3 path(s) carry executable content: docs/features/103-doc-currency/, docs/passive/, scripts/review-loop-discipline.test.mjs",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": []
}
```

(The `docs/passive/` path in `reason` is the carrier this unit cut while the diff was prose-only; the moment the report-contract pin entered the diff the classifier moved the unit to `standard`, and the passive carrier was deleted rather than kept beside a unit doc.)

- **Tier** — `standard` · **Task Size** — `{ understood: true, contained_risk: contained, resumable_from_diff: true, ceremony: unit-doc, verification: gates }`
- **Named high-risk item** — `none — not a high-tier unit` (`signals: []`)

## Future

- 2026-11-04 — "automatizar la documentación también en formato md, mdx, html, latex o lo que el usuario haya decidido al inicializar el proyecto, pero hay que documentar el código y features realizadas" — **planned** (issue [#396](https://github.com/gtrabanco/agentic-workflow/issues/396)).

## Future cost

| Rule | Binds |
|---|---|
| A unit that changes a shipped surface updates the README that describes it and deletes what it supersedes, in the same PR | every future unit; owner `AGENTS.md` §Working rules, checklist `skills/unit-lane/references/DOCS.md`, audit `audit-docs` check 15 |
| The report-contract count is a pinned contract that follows `audit-docs` | whoever adds check 16: move `Check (1-N)` + `<n>/N` in the skill **and** `scripts/review-loop-discipline.test.mjs`, with a fresh `justification` + `approval` record |
| The three package READMEs are version-parity triggers | every package-touching PR ships a `.changeset/*.md` or a bump + CHANGELOG row |

## Applicable tests

- `node scripts/run-root-suite.mjs` exits 0 (the repository gate — 1513 tests)
- `bun scripts/skill-lint.mjs` → `verdict: PASS`
- `bun scripts/check-skill-context.mjs` and `… --documents` → both `PASS`
- `node scripts/version-parity-gate.mjs --content` → `VERDICT: PASS`
- `node scripts/lint-changeset.mjs .changeset/103-doc-currency.md` → `ok`
- `node --test scripts/review-loop-discipline.test.mjs` exits 0 (the moved pin)

## Known pre-existing issues

- `audit-docs` checks 10 and 11 still grep `docs/features/*/{PLAN,TASKS,progress}.md` — pre-lane artifacts a lane-era unit never writes, so they can report a false HIGH against a current unit. **does-not-affect** this unit: it adds check 15 and moves the report-contract pin; it neither renumbers nor re-points the legacy checks (a separate repair, routed to `triage-issue` if pursued).
- The root README's NaN catalog guidance dates from feature 64 (July 2026 catalog). **does-not-affect** — model guidance is outside S1's repair scope.

## Tasks

- P1 — Repair the README surfaces against the tree: the root `README.md` (third package + `scripts/` in the layout, the `doc` retrieval index paragraph, the `### Design & plan` row for `unit-lane`, the `/unit-lane` flow, every retired `plan-feature`/`plan-fix` example, the `pre-execution-review` uninstall entry, the fix-index pointer, the train-version line, the deduplicated `log-session`, the `progress.md` handoff and the embeddings sentence), `packages/agentic-workflow/README.md` (the command reference replacing "none yet", plus the two guard binaries), `packages/pi-agentic-workflow/README.md` (route examples), `packages/agentic-workflow-schema/README.md` (broken SPEC link), `docs/workflow/README.md` and `docs/workflow/SKILLS.md` (package count and axis rows), `CHANGELOG.md`'s header claim (validator: `rg -n 'three companion npm packages' README.md AGENTS.md` prints 2 matches)
  (Implements: S1, S1a)
  Relevant files: README.md, CHANGELOG.md, packages/agentic-workflow/README.md, packages/pi-agentic-workflow/README.md, packages/agentic-workflow-schema/README.md, docs/workflow/README.md, docs/workflow/SKILLS.md, AGENTS.md
- P2 — State the documentation-currency rule where it binds: the guide's Working rules with its owner links, and the same rule in the exported substrate `template/AGENTS.md` (validator: `bun scripts/check-skill-context.mjs --documents` exits 0)
  (Implements: S2)
  Relevant files: AGENTS.md, template/AGENTS.md
- P3 — Make it required and audited: the lane's `docs` step checklist and output contract, `audit-docs` check 15 + the report contract's `Check (1-15)` / `<n>/15` + its description axis, and the suite's pinned count moved with its `justification` + `approval` record (validator: `node --test scripts/review-loop-discipline.test.mjs` exits 0)
  (Implements: S3, S6)
  Relevant files: skills/unit-lane/references/DOCS.md, skills/audit-docs/SKILL.md, scripts/review-loop-discipline.test.mjs, docs/features/103-doc-currency/decisions.md
- P4 — Ship the release intent declaring the three packages and the two touched skills (validator: `node scripts/lint-changeset.mjs .changeset/103-doc-currency.md` exits 0)
  (Implements: S4)
  Relevant files: .changeset/103-doc-currency.md
- P5 — Cut the automation issue S5 asks for and record it as this unit's deferred item (validator: `gh issue view 396 --repo gtrabanco/agentic-workflow --json number -q .number` → 396)
  (Implements: S5)
- P6 — Run the repository's deterministic gate over the whole change (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S1a, S2, S3, S4, S5, S6)
- P7 — Index the unit on the roadmap and open its PR against `main` (validator: `gh pr list --head feat/103-doc-currency --json number -q '.[0].number'` → the PR number)
  (Implements: S4)

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
```

### Planning evidence

| id | claim | source | certainty |
|---|---|---|---|
| PE-001 | The layout listed two packages while `packages/` ships three — `@gtrabanco/agentic-workflow` was named in no README | `README.md:30` (before), `packages/*/package.json` → three manifests | confirmed |
| PE-002 | The runner crate's README said "Current producers: none yet" while its own router declared seven subcommands | `packages/agentic-workflow/README.md:17` (before) vs `packages/agentic-workflow/bin/agentic-workflow.mjs:120` | confirmed |
| PE-003 | Nothing required README currency: the lane's `docs` step listed no README surface, and `audit-docs` had 14 checks with none comparing a README to what shipped | `skills/unit-lane/references/DOCS.md` and `skills/audit-docs/SKILL.md` (before) | confirmed |
| PE-004 | `plan-feature` and `plan-fix` are not published skills, yet three install/route examples named them | `ls skills/` (absent) vs `README.md:492,501,658` (before) | confirmed |
| PE-005 | The report contract is pinned outside the skill, so a new check cannot land without moving the pin | `scripts/review-loop-discipline.test.mjs:547-551` (before) | confirmed |
| PE-006 | Moving that pin with a growing check is the established practice, not a weakened assertion | `CHANGELOG.md` 2.1.0 row: feature 32 P3 moved `1-13` → `1-14`, "No check was added or removed" | confirmed |
| PE-007 | A frozen test needs a justification *and* an owner approval row; the same shape was used the same day for the same reason | `docs/fix/361-finding-severity-ladder/decisions.md:15-16` (`scripts/skill-lint.test.mjs`, count pin 7 → 8) | confirmed |
| PE-008 | The guide-layer ceilings absorb the rule without a re-basis | `bun scripts/check-skill-context.mjs --documents` → 388/393 lines, 297/302 prose, 6865/6881 estimate | confirmed |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| OB-1 | S1, S1a | a reader running an install/uninstall or route example gets a command that exists | P1 | P1 | README.md + package READMEs | `rg -n -- "-s plan-feature\|--skill plan-feature\|remove plan-feature$" README.md` → no match | exit 1 recorded in `## Log` | verified |
| OB-2 | S2 | every session loading the guide, and every bootstrapped project, sees the rule | P2 | P2 | AGENTS.md + template/AGENTS.md | `bun scripts/check-skill-context.mjs --documents` → `PASS context documents: 3 budgeted documents` | exit 0 recorded in `## Log` | verified |
| OB-3 | S3, S6 | a docs step cannot close without the README check, and the audit report carries it | P3 | P3 | unit-lane `references/DOCS.md` + `audit-docs` | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 | exit 0 recorded in `## Log` | verified |
| OB-4 | S3 | the frozen test is modified only with a justification **and** an owner approval, and the checkpoint gate proves it | P3 | P3 | `docs/features/103-doc-currency/decisions.md` | `node packages/agentic-workflow/bin/path-guard.mjs --unit docs/features/103-doc-currency --phase P3 --base origin/main` → `PATH-GUARD pass` | `PATH-GUARD pass` recorded in `## Log` | verified |
| OB-5 | S4 | the version-parity gate stays green for all three packages and the two skills | P4 | P4 | `.changeset/103-doc-currency.md` | `node scripts/version-parity-gate.mjs --content` → `VERDICT: PASS` | exit 0 recorded in `## Log` | verified |
| OB-6 | S1–S6 | the repository gate is green over the whole change | P6 | P6 | root suite | `node scripts/run-root-suite.mjs` → exit 0 | exit 0 recorded in `## Log` | verified |

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-04, the request, verbatim:
  ```
  Llevamos varias features entregadas y no sé si estamos actualizando el README.md con la nueva documentación me encuentro features como embeddings y otras cosas hechas que ni si quiera sabía que ya las habíamos entregado, los README.md de los paquetes y del proyecto necesitan un poco de atención y ver que cosas hay que actualizar.

  Si no hemos ido documentando y borrando documentación obsoleta, hay que añadir en el AGENTS.md como hacerlo y añadirlo como paso requerido en el proyecto.
  ```
- **L2** — 2026-11-04, the scope answer, verbatim: `"alcance: completo"`; the structure answer, verbatim: `"Reparar el README, regla en AGENTS + paso requerido. Y crear una issue para incluir reglas que obliguen a crear una tarea que sea documentar lo que se ha hecho y automatizar la documentación también en formato md, mdx, html, latex o lo que el usuario haya decidido al inicializar el proyecto, pero hay que documentar el código y features realizadas."`; the obligation answer, verbatim: `"fuerza: prosa"`.
- **L3** — 2026-11-04, owner decision: the path-protection gate refused the frozen-test edit; the owner was asked and answered verbatim `"Apruebo editar el test"` — both rows recorded in `docs/features/103-doc-currency/decisions.md`.
- **E1** — 2026-11-04, `rg -c "Current producers: none yet" packages/agentic-workflow/README.md` (and the same pin per retired claim: the `plan-feature` examples, `two companion npm packages`, `evolves independently`, `fix SPEC template + index README`, `via \`progress.md\``, `Check (1-14)`) · exit 1 · no match anywhere (the `Retirements` table's eight pins).
- **E2** — 2026-11-04, `rg -n 'three companion npm packages' README.md AGENTS.md` · exit 0 · 2 matches (P1's validator).
- **E3** — 2026-11-04, `gh issue view 396 --repo gtrabanco/agentic-workflow --json number -q .number` · exit 0 · `396` (P5's validator).
- **G1** — 2026-11-04, `bun scripts/skill-lint.mjs` · exit 0 · `verdict: PASS` (90 files, 0 findings).
- **G2** — 2026-11-04, `bun scripts/check-skill-context.mjs --documents` · exit 0 · `PASS context documents: 3 budgeted documents` (AGENTS.md 388/393 lines, 297/302 prose, 6865/6881 estimate); the skills half also `PASS` (audit-docs 2348/2800 est, 184/240 lines).
- **G3** — 2026-11-04, `node --test scripts/review-loop-discipline.test.mjs` · exit 0 · pass 1, fail 0 (the moved pin, judged against the skill's new contract).
- **G4** — 2026-11-04, `node packages/agentic-workflow/bin/path-guard.mjs --unit docs/features/103-doc-currency --phase P3 --base origin/main` · exit 0 · `PATH-GUARD pass — justified`, offenders: none (OB-4).
- **G5** — 2026-11-04, `bun scripts/phase-lint.mjs docs/features/103-doc-currency/SPEC.md` · exit 0 · `verdict PASS`, all seven phases 6/6.
- **G6** — 2026-11-04, `node scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS` (three packages via the changeset intent).
- **G7** — 2026-11-04, `node scripts/lint-changeset.mjs .changeset/103-doc-currency.md` · exit 0 · `ok`.
- **G8** — 2026-11-04, `node scripts/run-root-suite.mjs` · exit 0 · 1513 tests, 1512 pass, 0 fail, 1 pre-existing skip.
- **P1** — 2026-11-04 01:31, the four README surfaces, the two narrative rows and the CHANGELOG header repaired against the tree; the release intent cut · `a3830a94`.
- **P2** — 2026-11-04 01:32, the guide rule and its scaffold twin, the required docs step, `audit-docs` check 15 with its report-contract pin moved under the recorded justification + owner approval, the unit doc and roadmap row 103 · `4afd3a9f`.

- **P3** — 2026-11-04 01:35, pushed `feat/103-doc-currency` and opened [PR #397](https://github.com/gtrabanco/agentic-workflow/pull/397) against `main`; roadmap row 103 linked · branch head `4c243fae`.

## Next

Context-clean `/review-change` in a conversation that did not implement this change, then `/audit-pr` (the review must not run here).

## References

- Roadmap row [`103 doc-currency`](../ROADMAP.md) (added by P7).
- Issue [#396](https://github.com/gtrabanco/agentic-workflow/issues/396) — the automation half this unit defers (S5, `## Future`).
- `docs/features/103-doc-currency/decisions.md` — the `path-protection-records@1` justification + approval, and decisions D1–D3.
- Owner surfaces: `AGENTS.md` §Working rules, `skills/unit-lane/references/DOCS.md`, `skills/audit-docs/SKILL.md` check 15, `skills/execute-phase/references/risk-tiers.md`.
