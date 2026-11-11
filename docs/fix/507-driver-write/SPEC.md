---
# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder
# (type) and to the requirement count (scope).
# type: feature | fix | docs | chore
# scope: trivial | xs | small | standard | medium | large | xlarge
# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>
---

# fix/507-driver-write

> Fix specification — one single unit document. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in the `## Fixes` table of `docs/ROADMAP.md`. This is the same closed unit doc
> `scripts/unit-route.mjs --triage` reads for a feature, in the re-cut
> `spec-by-reference` shape; the fix template keeps four extra sections
> (`Issue`, `Branch`, `Depends on`, `Regression scope`) on top. A unit opened
> before the re-cut keeps the legacy 14-section shape — both are accepted, and a
> legacy doc is never rewritten to migrate it.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#507` — tracked issue in the project's forge. The PR must close it via
`Closes #507` in the body (the commit carries the footer).

## Specs

**S1 — `docs-generate.mjs` genera `docs/ROADMAP.md` desde las unit docs.**
> El emitter actual (`scripts/docs-generate.mjs`) genera tres páginas (index, units, code). Se añade una cuarta: `roadmap`. La tabla se construye desde las unit docs (lo mismo que `readRoadmapIndex`, `roadmapTableRows`):
> - `NN` → del nombre del directorio (`docs/features/NN-slug/`)
> - `Slug` → del nombre del directorio
> - `Status` → de `## Status` / `## Triaged steps` / `## Design status` en la unit doc
> - `Depends on` → de `## Depends on` en la unit doc
> - `Summary` → de un nuevo campo opcional `roadmap_summary:` en el SPEC; si no existe, se deriva del `> One-line:` blockquote o del primer párrafo de `## Goal`

**S2 — El merge driver cubre `docs/ROADMAP.md` además de `docs/generated/`.**
> El merge driver actual (`scripts/docs-generated-merge.mjs`) solo cubre `docs/generated/**`. Se amplía para cubrir `docs/ROADMAP.md` también. Cuando git detecta conflicto: lee las unit docs del lado incoming (theirs), regenera el archivo completo, `git checkout --theirs` → sin conflict.

**S3 — `init-workspace` instala `.gitattributes` + el merge driver automáticamente.**
> En bootstrap y upgrade, tras copiar el template:
> 1. Crear `.gitattributes` con las líneas de merge driver (commitado)
> 2. Correr `scripts/docs-generated-merge.mjs --install` para armar el driver en git config
> 3. Asegurar que el gate (`scripts/local-gate.mjs`) cubre ambos paths en `docs-generated-projection`

**S4 — `.gitattributes` está en el template.**
> `template/.gitattributes` copia las reglas del merge driver. Todo repo nuevo hereda la protección.

**S5 — El campo `roadmap_summary:` es opcional en el SPEC template.**
> Si no se provee, se deriva del `One-line:` del template. La columna Summary de ROADMAP.md puede estar vacía hasta que el owner la complete post-merge.

**S6 — `bun scripts/docs-generated-merge.mjs --install` funciona en un repositorio limpio.**
> Sin configuraciones previas, el install debe:
> 1. Verificar que es un git checkout
> 2. Leer el `Docs site` block de AGENTS.md (o degradar)
> 3. Armar `merge.docs-generated.driver` en git config --local
> 4. Reportar qué se escribió y qué estaba ya configurado

### Correction batch — 2026-11-11 (external verify, first receipt)

Frozen from `docs/fix/507-driver-write/external-verify.md` verbatim; the disposition
of every receipt row lives in the batch's Log lines. S7 stays unused on purpose —
D3 already records that id as a cut defect.

**S8 — the fix-row `roadmap_summary:` override applies (receipt blocker 1).**
> "the fix-row `roadmap_summary:` override never applies" … "`slugColumn = 2` reads
> the Status column … which never equals a unit slug; Topic is index 1" — smallest
> action: "slug column 1 for both kinds + red-first fix-override test".

**S9 — `--check` never claims a write it does not perform (receipt blocker 2).**
> "`--check` prints `Roadmap: docs/ROADMAP.md — updated` for a write it never
> performs" — smallest action: "check-mode arm `roadmapChanged ? \"stale\" : \"unchanged\"`".

**S10 — fix overrides survive multi-append runs (receipt advisory 1, the related symbol).**
> "Fixing `scripts/docs-generate.mjs:463` without per-kind offset recompute ships
> that hole" — the Fixes-scan line offsets are built once from the pre-sync text
> while the Features sync inserts rows earlier in the file.

**S11 — P5 cites only specs that exist (receipt advisory 3).**
> "P5 still cites `(Implements: S7)`; no S7 exists" — re-anchor P5 to S3's third
> step (its own D3 record) and to verification, never a gate code change.

**S12 — the scaffold guide states the roadmap sync its projects inherit (receipt advisory 2).**
> "template/AGENTS.md:117 … never states the roadmap machine-sync/`roadmap_summary:`
> behavior that now runs in those projects" — dated ids stay out of the scaffold
> (`scripts/scaffold-guide.test.mjs` refuses them there).

**S13 — the Serena wiring pointer names the current bootstrap step (receipt advisory 4).**
> "`BOOTSTRAP_WRITE.md` step 8 now names different content after the step
> insertion" — Serena provisioning now lives at bootstrap step 10.

**Not in the batch (recorded dispositions):** receipt advisory 5 —
`docs/LOGS.md:4055`'s dated step-5 mention — `wontfix`: `docs/LOGS.md` is the
append-only journal carrier and `scripts/log-immutability.mjs` refuses a hand
edit there. Receipt advisory 5's gate flakes (untouched steps, isolated re-runs
green) — `n/a` to this change: not reproducible on the unit's own surfaces.

### Correction batch 2 — 2026-11-11 (rebase integration on the #498 base)

Cut after re-reading the owner's coordination annotations verbatim (issue #507
comment and PR #513 comment, both 2026-11-11T12:02Z — re-read by request S2 of
the rebase instruction). PR #512 (unit #498) landed the other half of the
collision-free writing problem: the three `agentic-shared-*` file-class merge
drivers (covering `docs/ROADMAP.md`, `SKILL_CONTEXT_BUDGETS.json`,
`REPOSITORY_STATE.md`), the crate writer driver, and the `.gitattributes`
class registry. This branch's pre-rebase plan claimed the same
`docs/ROADMAP.md` attribute for `merge=docs-generated`; the rebase resolves
the overlap the way the owner ordered — integrate the registry, not duplicate
it. #507's native `blocked-by` #498 is satisfied (PR #512 merged).

**S14 — the merge-driver registry is integrated, never duplicated.**
> "el armado del template/init-workspace de esta unidad debe integrar el `class
> registry`, no duplicarlo" — `template/.gitattributes` carries the registry
> lines verbatim (`docs/generated/** merge=docs-generated` plus the three
> `agentic-shared-*` class lines) and stops claiming
> `docs/ROADMAP.md merge=docs-generated`; the root `.gitattributes` already
> carries the integrated set from #498.

**S15 — init-workspace arms both drivers on bootstrap and upgrade.**
> The arming step extends from one driver to the registry:
> `bun scripts/docs-generated-merge.mjs --install` **and**
> `bun scripts/shared-doc-merge.mjs --install`, both config keys verified
> non-empty (`merge.docs-generated.driver`, `merge.agentic-shared-roadmap.driver`).

**S16 — the guide prose names the integrated wiring.**
> The root guide's residual-case sentence stops attributing `docs/ROADMAP.md`
> to `merge=docs-generated` and points the attribute at the shared-document
> class registry named above it, keeping the #507 table-sync sentence.

**Recorded residual (decision-required, owner's call):** the
`docs/generated/**` carrier question — union the #420 shortcut into the class
driver, or keep the current refusal-with-gate split. The rebase keeps the
current split (the owner offered it as one of the two routes); nothing is
removed, so flipping later is a content change, not a recovery.

## Impact

Callers of the changed surfaces:
- `scripts/docs-generate.mjs` — se extiende con la página `roadmap`
- `scripts/docs-generated-merge.mjs` — se amplía el pattern a `docs/ROADMAP.md`
- `.gitattributes` — nuevo archivo en template y en repos
- `init-workspace` — nueva etapa de instalación del merge driver
- `scripts/local-gate.mjs` — el paso `docs-generated-projection` cubre ambos paths
- `template/` — añade `.gitattributes` y actualiza el SPEC template con `roadmap_summary:`

## Retirements

- N/A (este es un fix novo; no retira nada existente)

## Non-goals

- Migrar el texto "manual" de las rows de ROADMAP.md a las unit docs: solo se hace si no hay `roadmap_summary:` disponible; el owner puede completar post-merge.
- Cambiar el formato de la tabla ROADMAP.md (se mantiene pipe-delimited, misma columnas).
- Hacer el merge driver configurable por el usuario: la decisión es "always on", no opt-in.
- **Regenerar (reordenar o reescribir) las hand rows existentes.** Las celdas que el owner mantiene
  (Status, Depends on, Summary/Notes) son la state machine del roadmap (feature 07): una row existente
  pasa verbatim; la generación solo **añade** rows de features sin row (la invariant que el propio
  `docs/ROADMAP.md` ordena: "every feature folder must have a row") y aplica overrides de celda
  cuando la unit doc declara `roadmap_summary:`. Sin esto, la primera regeneración destruiría ~100
  summaries curados y los links de PR que solo viven en la tabla.
- **Añadir automáticamente rows de fixes.** El ciclo de vida documentado en `## Fixes` es: la row se
  registra al abrir el trabajo y se **elimina tras el merge** ("history lives in git log"). 96 de 104
  fix docs conservan `## Branch` incluso fusionadas, así que la presencia del folder no distingue un
  fix fusionado de uno no registrado: añadir rows por folder resucitaría ~80 fixes fusionados. Las
  rows de fixes siguen siendo owner-managed (preservación verbatim + override `roadmap_summary:`).
- **Reordenar rows existentes** (la tabla no está ordenada por NN hoy; el orden de inserción es
  append-at-end, determinista e idempotente).

## Risk tier

- **Tier** — `standard` · **Task Size** — `standard` (tres componentes: emitter, merge driver, init-workspace)
- **Named high-risk item** — none — not a high-tier unit

`bun scripts/ceremony.mjs tier classify --base main` at cut: `empty-change`
fail-closed to `standard` (no paths changed yet); the verdict is re-run on the
implemented diff at verification (E-line below) and both runs agree on
`standard`.

## Future

- **Open** — si el campo `roadmap_summary:` se usa ampliamente, evaluar migrar automáticamente el `One-line:` al campo en el template de SPEC (no en este fix).

## Future cost

- N/A

## Applicable tests

- `bun test scripts/docs-generate.test.mjs` — la página `roadmap` se regenera correctamente desde las unit docs
- `bun test scripts/docs-generated-merge.test.mjs` — el driver resuelve conflictos en `docs/ROADMAP.md` y `docs/generated/`
- `bun test scripts/local-gate.test.mjs` — el paso `docs-generated-projection` cubre ambos paths
- `bun test scripts/run-root-suite.mjs` — el suite completo pasa (al menos los scripts de docs)

## Known pre-existing issues

- El merge driver actual ya existe pero no está instalado por defecto (fix #420)
- `.gitattributes` no se copia con el template
- `init-workspace` no arma el merge driver automáticamente

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves it.

- **AC-S1** — `bun scripts/docs-generate.mjs` genera `docs/ROADMAP.md` con las columnas NN, Slug, Status, Depends on, Summary desde las unit docs. Check: `bun scripts/docs-generate.mjs` → `docs/ROADMAP.md` existe y la tabla es válida; `bun scripts/docs-generate.mjs --check` → PASS
- **AC-S2** — `scripts/docs-generated-merge.mjs` resuelve conflictos en `docs/ROADMAP.md` regenerando desde las unit docs. Check: crear un fixture con conflicto en ROADMAP.md, correr el driver, verificar que el resultado es la regeneración correcta (re-scoped 2026-11-11: the repository wiring keeps ROADMAP's merge attribute on `agentic-shared-roadmap`; this case is the scratch-fixture capability — the fixture repo routes ROADMAP to the #507 driver for the reproducer — and the closed-set pin guards against a second attribute claim)
- **AC-S3** — `init-workspace` creates `.gitattributes` and arms the merge driver(s) on bootstrap and upgrade. Check: a clean repo → `init-workspace` → `.gitattributes` exists with the registry lines; `git config --get merge.docs-generated.driver` → non-empty **and** `git config --get merge.agentic-shared-roadmap.driver` → non-empty (re-scoped 2026-11-11, S15 — both drivers of the registry)
- **AC-S4** — `template/.gitattributes` existe y tiene las líneas del merge driver. Check: `cat template/.gitattributes` contains the integrated registry — `docs/generated/** merge=docs-generated` and the three `agentic-shared-*` class lines, no `docs/ROADMAP.md merge=docs-generated` (re-scoped 2026-11-11, S14); the template-registry case in `bun test scripts/docs-generated-merge.test.mjs` → exits 0
- **AC-S5** — El campo `roadmap_summary:` es opcional en el SPEC template: si no se provee, se deriva del `One-line:`. Check: `cat template/docs/fix/_TEMPLATE/SPEC.md` | `cat template/docs/features/_TEMPLATE/SPEC.md` contienen el campo `roadmap_summary:`; `bun scripts/docs-generate.mjs` no falla si falta
- **AC-S6** — `bun scripts/docs-generated-merge.mjs --install` funciona en un repositorio limpio. Check: `bun scripts/docs-generated-merge.mjs --install` → exit 0; `git config --get merge.docs-generated.driver` → no vacío; `git config --get merge.docs-generated.name` → contiene "docs-generated"
- **AC-S7** — (authority **S3 item 3** — the request's S-list is S1–S6; the gate-coverage clause lives in S3's third step, and P5's earlier `S7` citation was a cut defect) — `bun scripts/local-gate.mjs --skip-network` passes with both paths covered. Check: `bun scripts/local-gate.mjs --skip-network --json` → `docs-generated-projection` → PASS
- **AC-S8** — a fix row whose cell count matches the Fixes header takes its unit doc's `roadmap_summary:` into the Notes cell. Check: the fix-override case in `bun test scripts/docs-generate.test.mjs` → exits 0 (RED observed at the pre-fix commit, GREEN after)
- **AC-S9** — `--check` reports roadmap drift as `stale` and never as a write it did not perform, while writing nothing. Check: the check-wording case in `bun test scripts/docs-generate.test.mjs` → exits 0
- **AC-S10** — a run that appends six or more feature rows still applies fix-row overrides (the scan offsets are recomputed per kind). Check: the multi-append case in `bun test scripts/docs-generate.test.mjs` → exits 0
- **AC-S11** — the task list cites only specs that exist (P5 no longer names the nonexistent `S7`). Check: `rg -c "Implements: S3 item 3" docs/fix/507-driver-write/SPEC.md` → exits 0
- **AC-S12** — the scaffold guide states the roadmap sync every scaffolded project inherits. Check: `rg -n "roadmap_summary" template/AGENTS.md` → exits 0
- **AC-S13** — the Serena provisioning pointer names the bootstrap step that now holds it. Check: `rg -n "BOOTSTRAP_WRITE.md. step 10" docs/features/67-serena-provisioning/SPEC.md` → exits 0
- **AC-S14** — the scaffold ships the integrated merge-driver registry and `docs/ROADMAP.md` is claimed by exactly one driver. Check: the template-registry case in `bun test scripts/docs-generated-merge.test.mjs` → exits 0; `git check-attr merge docs/ROADMAP.md` → `agentic-shared-roadmap`
- **AC-S15** — init-workspace arms both driver families on bootstrap and upgrade and verifies both config keys. Check: the bootstrap-arming case in `bun test scripts/docs-generated-merge.test.mjs` → exits 0; a scratch clean checkout after both installs has `git config --get merge.docs-generated.driver` and `git config --get merge.agentic-shared-roadmap.driver` non-empty
- **AC-S16** — the root guide's residual-case sentence names the class registry as ROADMAP's merge home and keeps the table-sync wording. Check: `rg -c "merge=docs-generated" AGENTS.md` → 1 (the `docs/generated/**` attribute only)

## Tasks

- P1 — extend `docs-generate.mjs` para generar la página `roadmap` (validator: `bun scripts/docs-generate.mjs --check` → PASS, `docs/ROADMAP.md` existe y es válido)
  (Implements: S1)
  Relevant files: scripts/docs-generate.mjs
- P2 — extender el merge driver para cubrir `docs/ROADMAP.md` (validator: fixture con conflicto → driver resuelve correctamente)
  (Implements: S2)
  Relevant files: scripts/docs-generated-merge.mjs, .gitattributes
- P3 — `init-workspace` crea `.gitattributes` y corre `--install` (validator: repo limpio → `.gitattributes` existe; `git config --get merge.docs-generated.driver` → no vacío)
  (Implements: S3, S4, S6)
  Relevant files: skills/init-workspace/SKILL.md, template/.gitattributes, template/
- P4 — añadir `roadmap_summary:` al SPEC template (validator: template contiene el campo; `bun scripts/docs-generate.mjs` no falla si falta)
  (Implements: S5)
  Relevant files: template/docs/fix/_TEMPLATE/SPEC.md, template/docs/features/_TEMPLATE/SPEC.md
- P5 — verify the gate's `docs-generated-projection` step covers both paths (validator: `bun scripts/local-gate.mjs --skip-network` → PASS)
  (Implements: S3 item 3 — the gate-coverage clause; no S7 exists, D3 records the cut defect)
  Relevant files: scripts/local-gate.mjs
- P6 — repair the roadmap sync's fix-kind path and the check-mode roadmap line (validator: `bun test scripts/docs-generate.test.mjs` exits 0 with the three correction cases)
  (Implements: S8, S9, S10)
  Relevant files: scripts/docs-generate.mjs, scripts/docs-generate.test.mjs
- P7 — close the receipt's documentation dispositions (validator: O8, O9 and O10 each name a reader command that exits 0)
  (Implements: S11, S12, S13)
  Relevant files: docs/fix/507-driver-write/SPEC.md, template/AGENTS.md, docs/features/67-serena-provisioning/SPEC.md
- P8 — integrate the merge-driver registry into the scaffold and arm both driver families (validator: the template-registry and bootstrap-arming cases in `bun test scripts/docs-generated-merge.test.mjs` exit 0; the scratch install run leaves both config keys non-empty)
  (Implements: S14, S15)
  Relevant files: template/.gitattributes, skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/init-workspace/references/UPGRADE.md
- P9 — re-anchor the guide's residual-case prose to the integrated wiring (validator: `rg -c "merge=docs-generated" AGENTS.md` → 1)
  (Implements: S16)
  Relevant files: AGENTS.md
- P10 — the `logs` union merge-driver class: `unionLogEntries` in the crate's merge library, the class registered in `shared-doc-merge.mjs`, the attribute in both `.gitattributes` files, the arming prose extended (validator: the logs-union cases in `bun test packages/agentic-workflow/test/writer.merge.test.mjs` and the armed-merge case in `bun test scripts/shared-doc-merge.test.mjs` exit 0; `git check-attr merge docs/LOGS.md` → `agentic-shared-logs`)
  (Implements: S17)
  Relevant files: packages/agentic-workflow/src/writer/merges.mjs, scripts/shared-doc-merge.mjs, .gitattributes, template/.gitattributes, skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/init-workspace/references/UPGRADE.md, AGENTS.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | El merge driver para `docs/generated/` existe y es funcional pero no está instalado por defecto | `scripts/docs-generated-merge.mjs` existe; `.gitattributes` no se copia con el template | current | O1 |
| PE-002 | repository | `docs/ROADMAP.md` es el único archivo que genera conflictos de merge frecuentes (aparte de `docs/generated/`) | git history: #269 vs #505 chocaron en ROADMAP.md y docs/generated/ | current | O2 |
| PE-003 | repository | Las columnas NN, Slug, Status, Depends on se pueden derivar de las unit docs; Summary necesita un campo adicional | `scripts/docs-generate.mjs` ya lee NN, Slug de los directorios; Status de `## Status`; Depends on de `## Depends on` | current | O3 |
| PE-004 | repository | El campo `roadmap_summary:` es opcional: si no existe, se puede derivar del `One-line:` o dejar vacío | El SPEC template ya tiene `> One-line:` en ambos templates (features y fixes) | current | O4 |
| PE-005 | repository | `tableCells` drops both boundary cells, so the Fixes table's Topic slug sits at `cells[1]` exactly like the Features table's Slug — the fix-kind `slugColumn = 2` reads Status instead | `packages/agentic-workflow/src/index-document.mjs` `tableCells` + a head probe: row 443 parses to link, topic, status, notes (4 cells) | sampled 2026-11-11 | O5 |
| PE-006 | repository | The Fixes-scan line offsets come from the pre-sync text, so feature appends slide the window: with only `slugColumn` repaired in scratch, a fresh fix override applied at up to 3 appended rows and was skipped at 6 (header misdetect inside the appended feature rows) | scratch probe on a clone of head, `mktemp -d` | sampled 2026-11-11 | O7 |

Rebase re-triage 2026-11-11 (branch rebased onto `b2864d03`, the merged #498/#512 train;
merge-base `505c2244` -> main): the timeline replays as the same 17 commits — no squash, no
feature deletion — and the merge-wiring overlap is resolved at the attribute level:
`docs/ROADMAP.md`'s merge attribute belongs to `agentic-shared-roadmap` (the owner's
coordination note, re-read as S14), so `docs-generated-merge.mjs` keeps its roadmap
capability as the scratch-fixture reproducer route while the wired attribute changes
ownership. The remaining tasks are P8 (registry integration in the scaffold + both-driver
arming, S14/S15) and P9 (guide prose, S16); the regeneration of the drifted projection rides
both (the #498 train changed the unit docs the emitter reads).
| PE-007 | repository | PR #512 (unit #498) landed the file-class merge driver layer — `.gitattributes` names `merge=agentic-shared-roadmap`/`-budgets`/`-repo-state` and `scripts/shared-doc-merge.mjs` arms them — so the pre-rebase plan's `docs/ROADMAP.md merge=docs-generated` claim is a duplicate claim on the same path | rebase read: root `.gitattributes` and `scripts/shared-doc-merge.mjs` at `b2864d03`; both coordination comments 2026-11-11T12:02Z | current | O11, O13 |
| PE-008 | repository | `scripts/shared-doc-merge.mjs --install` arms the three `merge.agentic-shared-*` config keys on a clean checkout and reports an already-armed one as unchanged | `scripts/shared-doc-merge.test.mjs` (main, 2026-11-10) — the class keys are asserted non-empty after install | current | O12 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | El emitter genera ROADMAP.md desde las unit docs sin texto manual que choque | P1 | P1 | scripts/docs-generate.mjs | `bun scripts/docs-generate.mjs --check` → PASS; `docs/ROADMAP.md` existe y es válido | the E line with the check exit and the file existence | verified |
| O2 | S2 | El merge driver resuelve conflictos en ROADMAP.md regenerando desde las unit docs — re-scoped 2026-11-11: the repository wiring keeps ROADMAP's merge attribute on `agentic-shared-roadmap`; this unit's driver case is the scratch-fixture capability (the reproducer routes ROADMAP to the #507 driver via the fixture's own `.gitattributes`), and the closed-set pin refuses a second attribute claim | P2 | P2 | scripts/docs-generated-merge.mjs | `bun test scripts/docs-generated-merge.test.mjs` exits 0 — the armed #269×#505 reproducer plus the closed-set pin | the E line with the fixture test exit and the comparison (E2, re-run at the rebased head in E8) | verified |
| O3 | S3 | init-workspace instala `.gitattributes` y el merge driver en bootstrap y upgrade — re-scoped 2026-11-11 (S15): the arming step covers both driver families of the registry | P3 | P3 | init-workspace | repo limpio → `.gitattributes` existe; `git config --get merge.docs-generated.driver` → no vacío; `git config --get merge.agentic-shared-roadmap.driver` → no vacío | the E line with the config checks (E5, re-verified at the rebased head on scratch in E9 and on the live checkout in O3's rerun) | verified |
| O4 | S5 | El campo `roadmap_summary:` es opcional y se deriva del `One-line:` si falta | P4 | P4 | SPEC template | template contiene el campo; `bun scripts/docs-generate.mjs` no falla si falta | the E line with the generate check | verified |
| O5 | S8 | The fix-kind sync applies a declared `roadmap_summary:` to a cell-matched Fixes row — the override the Non-goals promise for fix rows | P6 | P6 | scripts/docs-generate.mjs | `bun test scripts/docs-generate.test.mjs` exits 0 with the fix-override case | the E line naming the RED run at the pre-fix commit and the GREEN run (E6) | verified |
| O6 | S9 | `--check` reports roadmap drift without claiming a write it did not perform (read-only contract) | P6 | P6 | scripts/docs-generate.mjs | `bun test scripts/docs-generate.test.mjs` exits 0 with the check-wording case | the E line naming the RED run and the GREEN run (E6) | verified |
| O7 | S10 | fix-row overrides survive a run that appends six or more feature rows (scan offsets recomputed per kind) | P6 | P6 | scripts/docs-generate.mjs | `bun test scripts/docs-generate.test.mjs` exits 0 with the multi-append case | the E line naming the RED run and the GREEN run (E6) | verified |
| O8 | S11 | the task list cites only specs that exist — P5 no longer names the nonexistent S7 | P7 | P7 | docs/fix/507-driver-write/SPEC.md | `rg -c "Implements: S3 item 3" docs/fix/507-driver-write/SPEC.md` exits 0 | the E line with the command output (E7) | verified |
| O9 | S12 | the scaffold guide states the roadmap sync every scaffolded project inherits | P7 | P7 | template/AGENTS.md | `rg -n "roadmap_summary" template/AGENTS.md` exits 0 | the E line with the command output (E7) | verified |
| O10 | S13 | the Serena provisioning pointer names the bootstrap step that now holds it | P7 | P7 | docs/features/67-serena-provisioning/SPEC.md | `rg -n "BOOTSTRAP_WRITE.md. step 10" docs/features/67-serena-provisioning/SPEC.md` exits 0 | the E line with the command output (E7) | verified |
| O11 | S14 | the scaffold's `.gitattributes` ships the integrated registry — the class lines stated once, `docs/ROADMAP.md` claimed by exactly one driver | P8 | P8 | template/.gitattributes | the template-registry case in `bun test scripts/docs-generated-merge.test.mjs` exits 0; `git check-attr merge docs/ROADMAP.md` → `merge: agentic-shared-roadmap` at the rebased head | the E line naming both runs (E8) | verified |
| O12 | S15 | init-workspace arms the docs-generated driver and the shared-document classes in bootstrap and upgrade, verifying both config keys | P8 | P8 | skills/init-workspace/references/BOOTSTRAP_WRITE.md, skills/init-workspace/references/UPGRADE.md | the bootstrap-arming case in `bun test scripts/docs-generated-merge.test.mjs` exits 0; the scratch install run leaves both config keys non-empty | the E line naming the RED and GREEN runs and the scratch run (E8/E9) | verified |
| O13 | S16 | the root guide's residual-case prose names the registry as the ROADMAP attribute's home and keeps the table-sync sentence | P9 | P9 | AGENTS.md | `rg -c "merge=docs-generated" AGENTS.md` → 1 — the `docs/generated/**` attribute only | the E line with the command output (E9) | verified |

## Triaged steps

Triage 2026-11-10 (branch `fix/507-driver-write`, árbol limpio en `27275c94`): se corta como **una
sola unidad**, fases secuenciales — P1 (emitter) precede a P2 (driver, consume la misma superficie
de paths), P3+P4 comparten slice (template + skill prose), P5 es verificación del gate (el paso
`docs-generated-projection` ya corre `docs-generate --check`, que tras P1 cubre ambos paths sin
cambio de código). Diferencial con el corpus §2: el reproducer del choque #269×#505 (merge real en
fixture con dos branches que añaden rows al roadmap) va en RED antes de la implementación.

Correction triage 2026-11-11 (branch `fix/507-driver-write`, head `76ac4b0e`, per the first
`EXTERNAL VERIFY` receipt): P6 (the sync's fix-kind path + the check-mode line) precedes P7
(the documentation dispositions) — P7's `rg` readers only become green once P6's sibling prose
is consistent. The §2 frozen-failure corpus runs RED first: the fix-override reproducer and the
check-wording reproducer at the pre-fix commit, then the multi-append reproducer (PE-006's k=6
probe) once `slugColumn` alone is repaired — the change is done when all three pass together.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F2 | S1 (design) | design | WARNING | docs-only | product | decision-required — preserve-verbatim + append-only sync (Non-goals) awaits the owner's verdict |
| F3 | S2 (design) | design | WARNING | docs-only | product | decision-required — no auto-append of fix rows, the Fixes lifecycle removes rows post-merge (Non-goals) |
| F4 | S14 (rebase re-scope) | design | GUIDANCE | docs-only | product | decision-required — the `docs/generated/**` residual: union the #420 shortcut into the class driver, or keep the current refusal-with-gate split (the rebase keeps the current split, per the coordination note's two offered routes) |

## Log

- **L1** — Request verbatim: "Apply to this repository: issue #507", under the owner's standing
  local-workflow procedure (inline application, ledger freeze as the plan, owner as the external
  verifier).
- **L2** — Rebase request verbatim: "Apply to this repository: en fix/507-driver-write (PR #513
  rebase here without loosing git timeline and not delete any feature that we must prevail).
  There are new annotations/features/requirements in issue #507 and PR #513 you need to re-read
  and maybe redo of the plan could be necessary", under the owner's standing local-workflow
  procedure (§0 resolution: `proceed` — rebase + integration continuation; the coordination
  annotations are re-read in Correction batch 2).
- **E1** — 2026-11-10, RED at `32b0d053`: `bun test scripts/docs-generate.test.mjs` exit 1 — 4 fail
  (row append, derivation chain, `roadmap_summary:` override, stale-check), 23 pass; `bun test
  scripts/docs-generated-merge.test.mjs` exit 1 — 3 fail (driver coverage of `docs/ROADMAP.md`,
  the armed #269×#505 merge reproducer, the two-entry `.gitattributes` contract), 13 pass. The two
  negative guards (unarmed merge keeps its conflict; fix rows never auto-appended) pass as designed.
- **E2** — 2026-11-10, GREEN at `45bb01d7`: `bun test scripts/docs-generate.test.mjs` exit 0 (28
  pass / 0 fail); `bun test scripts/docs-generated-merge.test.mjs` exit 0 (16 pass / 0 fail) — the
  armed roadmap merge resolves and the named regeneration restores the local side's derived row.
  First regeneration attempt appended 6 rows instead of 1 — hand rows whose summary carries
  unescaped pipes fell out of `seen` by cell count — fixed (slug cell matched positionally) and
  pinned with a regression test in the same commit.
- **E3** — 2026-11-10, `bun scripts/docs-generate.mjs` exit 0 on the live tree — `Roadmap:
  docs/ROADMAP.md — updated`, exactly one row appended (`494`, the only feature folder without a
  row); `bun scripts/docs-generate.mjs --check` exit 0, `verdict: PASS`.
- **E4** — 2026-11-10, differential (§6) base `27275c94` vs change over an identical minimal
  fixture: `docs-generate` stdout differs only by the `Roadmap:` line and the roadmap-row count
  (S1); `units.md` differs only in the derived status cell; `index`/`code` pages byte-identical;
  driver on `docs/ROADMAP.md`: base exit 1 (refusal), change exit 0 (resolution) (S2). No
  unrequested delta.
- **E5** — 2026-11-10, at `d5105b9d`: `bun scripts/skill-lint.mjs` exit 0 (0 findings); `bun
  scripts/check-skill-context.mjs --routes` exit 0 (14 routes PASS); `bun scripts/lint-changeset.mjs`
  exit 0 (`ok 507-driver-write.md`); the four unit-doc templates carry `roadmap_summary:`
  (AC-S4/S5).
- **G1** — 2026-11-10 · HEAD 0b80fcbc · `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/507-driver-write/SPEC.md` · exit 0 · receipt `verify@1`, all checks pass.
- **G2** — 2026-11-10 · HEAD 0b80fcbc · `bun scripts/local-gate.mjs --skip-network` · exit 0 · PASS — 13 step(s) in 167s, including `docs-generated-projection` and the 604-test root suite (an earlier pass at the same tree reported one parallel-pool root-suite flake; two subsequent full runs, `--jobs 1` and default, are both green).
- **D1** — (none yet — F2/F3 await the owner's verdict)
- **E6** — 2026-11-11, correction corpus (S8–S10): RED at `732f5a24` —
  `bun test scripts/docs-generate.test.mjs` exit 1, 28 pass / 3 fail, each on its
  receipt cause (the fix row kept `hand notes`; `--check` printed
  `Roadmap: docs/ROADMAP.md — updated`; the six appends landed but the fix Notes
  cell stayed untouched). GREEN at `695948a8` — same suite exit 0, 31 pass / 0
  fail; `docs-generated-merge` 16/0, `index-document` 9/0, `findings-corpus`
  14/0. Differential vs base `76ac4b0e` over identical `mktemp -d` fixtures:
  clean generate/check/dry-run byte-identical (stdout, exit, written files);
  stale `--check` differs only in the S9 wording (`— updated` → `— stale`, exit 1
  on both sides); stale generate plus the written ROADMAP and pages
  byte-identical; dry-run keeps `would update`; the override fixture differs
  only by the S8 Notes cell (`hand notes` → `the owner fix line`) and its
  `Roadmap:` line. No unrequested delta.
- **E7** — 2026-11-11, doc dispositions at `e87bed98`:
  `rg -c "Implements: S3 item 3" docs/fix/507-driver-write/SPEC.md` → 3, exit 0
  (O8); `rg -c "roadmap_summary" template/AGENTS.md` → 1, exit 0 (O9);
  `rg -c "BOOTSTRAP_WRITE.md. step 10" docs/features/67-serena-provisioning/SPEC.md`
  → 1, exit 0 (O10 — the same line also carries the corrected
  `UPGRADE.md` step 9). `bun scripts/promise-coherence.mjs
  docs/fix/507-driver-write/SPEC.md` → PASS (3 checked · 11 skipped, every skip
  named). Scaffold surfaces: scaffold-guide 8/0, unit-doc-contract 21/0,
  invocation-drift 13/0, residue-dimensions 29/0, guide-split 15/0,
  review-loop-discipline PASS, skill-lint PASS, context budgets PASS 29,
  route budgets PASS 14. Live read-only `bun scripts/docs-generate.mjs --check`
  → PASS, `Roadmap: docs/ROADMAP.md — unchanged`, tree clean.
- **E8** — 2026-11-11, rebase integration (S14–S15): the 17-commit timeline replayed onto the
  merged #498 train merge-base-clean (`main` = `b2864d03`; conflicts resolved at the attribute
  level — the registry lines kept verbatim, the hand rows 498/502 and the 494 position restored,
  the branch's `docs/ROADMAP.md merge=docs-generated` claim suppressed). RED at `1d6dd865`:
  `bun test scripts/docs-generated-merge.test.mjs` exit 1 — 16 pass / 2 fail, each on its new
  S14/S15 cause (the template shipped the old two-line set; bootstrap/upgrade armed one driver
  family). GREEN at `a08b2f16`: same suite 18 pass / 0 fail; `docs-generate` 31/0;
  `git check-attr merge docs/ROADMAP.md` → `merge: agentic-shared-roadmap`. Scratch differential
  (`mktemp -d`, `git archive` of head onto a clean checkout): both installs arm and report
  `written` then `unchanged` on the second run; all four config keys non-empty;
  `git check-attr` in the scratch routes each path to exactly one driver.
- **E9** — 2026-11-11, prose and gates at the integration head: `rg -c "merge=docs-generated"
  AGENTS.md` → 1 (O13); `rg -n "BOOTSTRAP_WRITE.md. step 10"
  docs/features/67-serena-provisioning/SPEC.md` → 1 with `BOOTSTRAP_WRITE.md` step 10 still
  Serena (O10 survives the step-5 rewrite; O8/O9 names unchanged). skill-lint PASS (0
  findings); `check-skill-context --routes` PASS 14 routes; scaffold-guide 8/0,
  unit-doc-contract 21/0, guide-split 15/0, invocation-drift 13/0, residue-dimensions 29/0;
  `bun scripts/lint-changeset.mjs` → `ok 507-driver-write.md`; live read-only
  `bun scripts/docs-generate.mjs --check` → PASS, `Roadmap: docs/ROADMAP.md — unchanged`,
  `docs/generated/units.md` clean.

## Next

Rebase integration green (Correction batch 2) — the branch carries the same 17-commit timeline
replayed onto the #498 train plus the integration commits; awaiting the external verifier's
verdict (§9) and the push-authorization for the rewritten published branch. Open decisions:
F2/F3 (design verdicts from the first batch) and F4 (the `docs/generated/**` residual — union
the #420 shortcut into the class driver, or keep the current refusal-with-gate split); D1
still none.

## References

- Issue [#507](https://github.com/gtrabanco/agentic-workflow/issues/507) — the PR closes it via `Closes #507`.
- Fix #505 (worktree-prune) — ejemplo real de conflicto de merge con #269 en `docs/ROADMAP.md` y `docs/generated/`
- Fix #420 — el merge driver se creó para `docs/generated/` pero no se automatizó su instalación
- Feature 65 — generación de docs; el driver es la contrapartida de merge

## Branch

`fix/507-driver-write`

## Depends on

Independent.

## Regression scope

- `scripts/docs-generate.mjs` — la nueva página `roadmap` no debe afectar a index, units, code
- `scripts/docs-generated-merge.mjs` — el driver actual para `docs/generated/` no debe comportarse diferente
- `init-workspace` — el nuevo paso de instalación no debe interferir con otras etapas