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
D3 (2026-11-11T00:32:24Z journal entry in `docs/LOGS.md`) already records that id as a cut defect.

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
> step (its own D3 (2026-11-11T00:32:24Z journal entry) record) and to verification, never a gate code change.

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
> lines verbatim (`docs/generated/** merge=docs-generated` plus the four
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

**S17 — the `logs` union merge-driver class (the #498 scope reinforcement, delivered here by owner order).**
> Issue #498, owner comment 2026-11-10T00:22 verbatim: "add a union merge driver for
> `docs/LOGS.md`. Not a replacement for the `journal-aggregate` workflow — the driver is a
> pure, stateless function git invokes inside a `git merge` … Driver behavior: union by entry
> identity (fragment-derived entry id/timestamp, already monotonic) — distinct entries both
> kept, ordered by timestamp; the same entry on both sides deduplicated; anything ambiguous
> (malformed entry boundary) exits nonzero and leaves a real conflict for the human/agent.
> Never silently resolved." The landed `SHARED_MERGE_CLASSES` shipped no `logs` class (the
> #498 SPEC's Non-goals S4 kept `docs/LOGS.md` out as "already collision-safe"), so the
> comment's absorption never shipped; the owner ordered it implemented here ("Pues
> implementalo", 2026-11-11) and re-verified issue #507 + PR #513 for anything else requested
> (session S2: the issue's seven body ACs are all covered by S1–S6, its one comment is the
> coordination note batch 2 applied, and PR #513 carries one comment and zero reviews —
> nothing further was requested).

**Recorded residual (decision-required, owner's call):** the
`docs/generated/**` carrier question — union the #420 shortcut into the class
driver, or keep the current refusal-with-gate split. The rebase keeps the
current split (the owner offered it as one of the two routes); nothing is
removed, so flipping later is a content change, not a recovery.

### Correction batch 3 — 2026-11-11 (external verify 16:10Z, owner-directed advisory triage)

The second `EXTERNAL VERIFY` receipt (`docs/fix/507-driver-write/external-verify.md`, base
`b2864d03` · head `468d9bf9`) closed **Blockers: 0 · Verdict: VERIFIED** with five advisories,
so the blocker batch is empty by state (§0: `proceed` — the triage targets are the five
advisories). Docs-only batch: no code, script or template bytes move. Frozen triage of the
receipt, each disposition this batch's scope:

| receipt advisory | disposition |
|---|---|
| 1 — the Risk tier section's `(E-line below)` names no tier evidence line | fix — P11 appends the tier evidence line |
| 2 — `D3` is cited from this doc but its record lives only in the journal | fix — P12 names the journal entry at every `D3` site in this doc |
| 3 — `docs/LOGS.md:4055`'s dated step-5 mention | wontfix — already dispositioned; the append-only carrier refuses the edit (`scripts/log-immutability.mjs`) |
| 4 — E10's "644" counts do not reproduce | fix by append — P13 appends the re-measurement (`log-kind@1`: corrections append, never edit); its queued-fragment half is n/a (tracked-fragment edits are aggregator-only, PE-013) |
| 5 — bare-clone `--skip-network` schema-build red + one pool flake | n/a — environment by design (`--skip-network` skips `workspace-install`); no repo surface deserves a change |

Out of triage scope: F2/F3/F4 stay `decision-required` (owner), and the receipt's disclosed
verification incident (live generate-mode execute, 0 bytes written) is a process note with
nothing to repair. The context reads (S2, rows PE-011–PE-014) additionally exposed two related
surfaces this batch owns (P14): AC-S4 and S14's prose tail still count the class registry as
three after S17 shipped the fourth, and the Planning evidence table carries a blank line that
splits it (introduced by this branch's batch-2 re-freeze, `aa8f888f`).

**S18 — the advisories that deserve a fix are fixed; the rest are dispositioned with reasons.**
> "triage and fix those that deserve to fix"

**S19 — every fix rests on sampled context, recorded as planning-evidence rows.**
> "understand the context before fix"

**S20 — the batch breaks nothing else; the deterministic gates and the docs differential
re-run green afterwards.**
> "check you haven't broke another different thing"

**S21 — the loop repeats until every surface mentioning what a fix changed is fixed too.**
> "if you have done, start the loop again until you fixed full symbol/related stuff"

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
- **AC-S4** — `template/.gitattributes` existe y tiene las líneas del merge driver. Check: `cat template/.gitattributes` contains the integrated registry — `docs/generated/** merge=docs-generated` and the four `agentic-shared-*` class lines, no `docs/ROADMAP.md merge=docs-generated` (re-scoped 2026-11-11, S14); the template-registry case in `bun test scripts/docs-generated-merge.test.mjs` → exits 0
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
- **AC-S17** — the `logs` class unions LOGS entries keyed by the exact heading line: distinct new entries both kept, ordered by normalized stamp; the same heading on both sides with the same bytes deduplicated; the same heading with different bodies surfaces a real conflict; a side that is not an append-only extension of the base refuses closed. Check: the logs-class cases in `bun test packages/agentic-workflow/test/writer.merge.test.mjs` and `bun test scripts/shared-doc-merge.test.mjs` → exit 0; the armed merge of two heterogeneous appends (date-only + full-ISO) resolves clean, exit 0
- **AC-S18** — the receipt advisories 1, 2 and 4 are repaired and their frozen-failure reproducers pass. Check: O15, O16 and O17's validators each reach their stated outcome (RED observed at the frozen-ledger head, recorded in the Triaged steps paragraph)
- **AC-S19** — every context claim this batch rests on is a sampled planning-evidence row. Check: `rg -c "^\| PE-01[1-4] \| " docs/fix/507-driver-write/SPEC.md` → matches 4
- **AC-S20** — nothing else broke. Check: `bun scripts/local-gate.mjs --skip-network` → `local-gate: PASS — 13 step(s)`; `bun scripts/docs-generate.mjs --check` → `verdict: PASS`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/507-driver-write/SPEC.md` → exit 0 (E14, G3)
- **AC-S21** — the sibling sweep over every fixed surface closes. Check: O20's two sweep checks at their stated post-repair outcomes (E13)

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
  (Implements: S3 item 3 — the gate-coverage clause; no S7 exists, D3 (2026-11-11T00:32:24Z journal entry) records the cut defect)
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
- P11 — append the tier evidence line the Risk tier section's pointer names (validator: `rg -c "^\- \*\*E11\*\*" docs/fix/507-driver-write/SPEC.md` → matches 1)
  (Implements: S18)
  Relevant files: docs/fix/507-driver-write/SPEC.md
- P12 — name the journal entry at every `D3` site in this doc (validator: `rg -c "D3 \(2026-11-11T00:32:24Z" docs/fix/507-driver-write/SPEC.md` → matches 3)
  (Implements: S18)
  Relevant files: docs/fix/507-driver-write/SPEC.md
- P13 — append the count re-measurement that supersedes E10's narration (validator: `rg -c "^\- \*\*E12\*\*" docs/fix/507-driver-write/SPEC.md` → matches 1)
  (Implements: S18)
  Relevant files: docs/fix/507-driver-write/SPEC.md
- P14 — freeze the context rows and repair the two related surfaces they exposed: the stale
  three-count in AC-S4 and S14's prose tail, and the blank line splitting the Planning
  evidence table (validator: `rg -c "^\| PE-01[1-4] \| " docs/fix/507-driver-write/SPEC.md` → matches 4)
  (Implements: S18, S19)
  Relevant files: docs/fix/507-driver-write/SPEC.md
- P15 — run the verification set and the deterministic gate at the fixed head (validator: O19 — gate PASS 13 steps, docs-generate --check PASS, verify@1 exit 0)
  (Implements: S20)
  Relevant files: scripts/local-gate.mjs, docs/fix/507-driver-write/SPEC.md
- P16 — run the sibling sweep over every fixed surface and close it (validator: O20's two sweep checks at their stated outcomes)
  (Implements: S21)
  Relevant files: docs/fix/507-driver-write/SPEC.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | El merge driver para `docs/generated/` existe y es funcional pero no está instalado por defecto | `scripts/docs-generated-merge.mjs` existe; `.gitattributes` no se copia con el template | current | O1 |
| PE-002 | repository | `docs/ROADMAP.md` es el único archivo que genera conflictos de merge frecuentes (aparte de `docs/generated/`) | git history: #269 vs #505 chocaron en ROADMAP.md y docs/generated/ | current | O2 |
| PE-003 | repository | Las columnas NN, Slug, Status, Depends on se pueden derivar de las unit docs; Summary necesita un campo adicional | `scripts/docs-generate.mjs` ya lee NN, Slug de los directorios; Status de `## Status`; Depends on de `## Depends on` | current | O3 |
| PE-004 | repository | El campo `roadmap_summary:` es opcional: si no existe, se puede derivar del `One-line:` o dejar vacío | El SPEC template ya tiene `> One-line:` en ambos templates (features y fixes) | current | O4 |
| PE-005 | repository | `tableCells` drops both boundary cells, so the Fixes table's Topic slug sits at `cells[1]` exactly like the Features table's Slug — the fix-kind `slugColumn = 2` reads Status instead | `packages/agentic-workflow/src/index-document.mjs` `tableCells` + a head probe: row 443 parses to link, topic, status, notes (4 cells) | sampled 2026-11-11 | O5 |
| PE-006 | repository | The Fixes-scan line offsets come from the pre-sync text, so feature appends slide the window: with only `slugColumn` repaired in scratch, a fresh fix override applied at up to 3 appended rows and was skipped at 6 (header misdetect inside the appended feature rows) | scratch probe on a clone of head, `mktemp -d` | sampled 2026-11-11 | O7 |
| PE-007 | repository | PR #512 (unit #498) landed the file-class merge driver layer — `.gitattributes` names `merge=agentic-shared-roadmap`/`-budgets`/`-repo-state` and `scripts/shared-doc-merge.mjs` arms them — so the pre-rebase plan's `docs/ROADMAP.md merge=docs-generated` claim is a duplicate claim on the same path | rebase read: root `.gitattributes` and `scripts/shared-doc-merge.mjs` at `b2864d03`; both coordination comments 2026-11-11T12:02Z | current | O11, O13 |
| PE-008 | repository | `scripts/shared-doc-merge.mjs --install` arms the three `merge.agentic-shared-*` config keys on a clean checkout and reports an already-armed one as unchanged | `scripts/shared-doc-merge.test.mjs` (main, 2026-11-10) — the class keys are asserted non-empty after install | current | O12 |
| PE-009 | repository | the landed class registry has no `logs` class and `docs/LOGS.md`'s entries are byte-shaped by `journal-entry` (`packages/agentic-workflow/src/journal/block.mjs` renders the `## <stamp> — <branch> — <label>` heading) — the writer half's shape exists even though a strict stamp grammar would not hold | `scripts/shared-doc-merge.mjs` (`SHARED_MERGE_CLASSES`), `src/journal/block.mjs`; issue #498 comment 2026-11-10T00:22 | current | O14 |
| PE-010 | repository | the real journal is heterogeneous: 850 headings, only 610 full ISO-second stamps; date-only and minute-precision shapes and 14 legitimately repeated exact headings exist — so the entry identity is the exact heading line, the merge holds both sides to the append-only prefix contract, and a strict stamp grammar would refuse the file the driver exists to protect | head probe on `docs/LOGS.md` (`rg "^## "` counts, 2026-11-11) + the scratch reproduction of the refusal | current | O14 |
| PE-011 | repository | the Risk-tier re-run claim reproduces on the implemented diff: `bun scripts/ceremony.mjs tier classify --base origin/main` returns `tier: standard`, and unit 505's identical claim carries its evidence line (`docs/fix/505-worktree-prune/SPEC.md` E8) — the correct shape for the dangling pointer | foreground run at the batch head + `git show` of 505's SPEC E8 | sampled 2026-11-11 | O15 |
| PE-012 | repository | the crate suite runs 645 pass / 0 fail in three configurations (live worktree at `468d9bf9`; scratch clones at `95a83020`, E10's recorded head, and `468d9bf9`) with byte-identical test trees (`git diff --stat 95a83020..HEAD -- packages/agentic-workflow/test scripts` → empty), so E10's "644" does not reproduce at its recorded head while its PASS verdict does | three foreground runs 2026-11-11 | sampled 2026-11-11 | O17 |
| PE-013 | repository | `scripts/log-immutability.mjs` refuses any non-aggregator commit that deletes or edits a tracked fragment, so the queued journal fragment's count narration cannot be repaired by this batch — journal narration corrections land as carrier additions or Log appends only | `scripts/log-immutability.mjs` header contract (fragment edit = aggregator identity) | sampled 2026-11-11 | O17, O18 |
| PE-014 | repository | `log-kind@1` makes the unit Log append-only — "a correction never edits an earlier line: it appends" — so advisory 4's fix must be an appended evidence line, never an E10 rewrite | `docs/fix/_TEMPLATE/SPEC.md` Log contract block | current | O17 |
Rebase re-triage 2026-11-11 (branch rebased onto `b2864d03`, the merged #498/#512 train;
merge-base `505c2244` -> main): the timeline replays as the same 17 commits — no squash, no
feature deletion — and the merge-wiring overlap is resolved at the attribute level:
`docs/ROADMAP.md`'s merge attribute belongs to `agentic-shared-roadmap` (the owner's
coordination note, re-read as S14), so `docs-generated-merge.mjs` keeps its roadmap
capability as the scratch-fixture reproducer route while the wired attribute changes
ownership. The remaining tasks are P8 (registry integration in the scaffold + both-driver
arming, S14/S15) and P9 (guide prose, S16); the regeneration of the drifted projection rides
both (the #498 train changed the unit docs the emitter reads).


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
| O14 | S17 | the registry's fifth path: `docs/LOGS.md` merges by entry identity — distinct new entries both kept, ordered by stamp; the same heading deduplicated; the same heading with different bodies is a conflict; a side that is not an append-only extension refuses closed; `.gitattributes` (root + template) and the arming carry it | P10 | P10 | packages/agentic-workflow/src/writer/merges.mjs (union), scripts/shared-doc-merge.mjs (class), .gitattributes, template/.gitattributes | `bun test packages/agentic-workflow/test/writer.merge.test.mjs` exits 0 with the logs-union cases; `bun test scripts/shared-doc-merge.test.mjs` exits 0 with the armed-merge cases; `git check-attr merge docs/LOGS.md` → `merge: agentic-shared-logs` | the E line naming the RED and GREEN runs and the scratch merge (E10) | verified |
| O15 | S18 | receipt advisory 1 — the Risk tier section's re-run claim carries its evidence line, so `(E-line below)` resolves | P1 | P11 | docs/fix/507-driver-write/SPEC.md | `rg -c "^\- \*\*E11\*\*" docs/fix/507-driver-write/SPEC.md` → matches 1 | the E11 line with its command, exit and output, plus the green corpus re-run (E11, E13) | verified |
| O16 | S18 | receipt advisory 2 — every `D3` citation in this doc names the journal entry that carries the record | P1 | P12 | docs/fix/507-driver-write/SPEC.md | `rg -c "D3 \(2026-11-11T00:32:24Z" docs/fix/507-driver-write/SPEC.md` → matches 3 | the green corpus re-run over the three repaired sites (E13) | verified |
| O17 | S18 | receipt advisory 4 — E10's count narration is superseded by an appended re-measurement, per `log-kind@1` (corrections append, never edit) | P1 | P13 | docs/fix/507-driver-write/SPEC.md | `rg -c "^\- \*\*E12\*\*" docs/fix/507-driver-write/SPEC.md` → matches 1 | the E12 line with the three re-measured runs (E12) | verified |
| O18 | S19 | the batch's context claims are sampled rows (PE-011–PE-014), never carried from memory | P1 | P14 | docs/fix/507-driver-write/SPEC.md | `rg -c "^\| PE-01[1-4] \| " docs/fix/507-driver-write/SPEC.md` → matches 4 | the PE-011–PE-014 rows, re-run in the verification block (E14) | verified |
| O19 | S20 | nothing else broke — the deterministic gate, the docs differential and the unit-doc contract re-run green after the batch | P2 | P15 | scripts/local-gate.mjs + the unit doc | `bun scripts/local-gate.mjs --skip-network` → `local-gate: PASS — 13 step(s)`; `bun scripts/docs-generate.mjs --check` → `verdict: PASS`; `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/507-driver-write/SPEC.md` → exit 0 | the gate line and the verification block with their exits (G3, E14) | verified |
| O20 | S21 | the sibling sweep over every fixed surface closes — no surviving stale class count outside the dated narrative, and the split Planning evidence table is one table again | P2 | P16 | docs/fix/507-driver-write/SPEC.md | `rg -c "the three .agentic-shared-.+ class lines" docs/fix/507-driver-write/SPEC.md` → matches 1; `rg -U -c "PE-006 \| repository[^\n]*\n\| PE-007" docs/fix/507-driver-write/SPEC.md` → matches 1 | the green sweep outputs (E13) | verified |

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

Correction triage 3 — 2026-11-11 (branch `fix/507-driver-write`, head `468d9bf9`, per the
16:10Z receipt and L4): docs-only batch, no script bytes move. The §2 frozen-failure corpus is
O15's, O16's and O17's frozen checks plus P14's two related-surface states; observed at the
frozen-ledger head before any fix — the E11 check → 0 matches (exit 1), the journal-anchored
`D3` check → 0 matches (exit 1), the E12 check → 0 matches (exit 1), the class-count check →
matches 2 (the same-line stale site plus the frozen cell; S14's stale tail is line-wrapped right
beside it), the table-adjacency check → 0 matches (exit 1). The batch is done when all five
turn to their stated outcomes together (P11–P14), then the gates and the sweep run (P15–P16).
S3 also surfaced one unstable gate red, recorded here as a new finding for the owner — outside
this batch's advisory set, so nobody fixes it in this unit: `pi-node-compat` declares only
`workspace-install` in `scripts/local-gate.mjs`'s step graph, so it can start while
`schema-build` is still writing the schema `dist/` (observed once at `205ca4fd`:
`bundle:skills` → `export 'GATE_CHECK_STATUSES' not found in './gate-receipt.js'`; green
isolated, green on the full re-run; every gate step byte-identical to the `468d9bf9` head the
external verify passed on, so not batch-caused).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F2 | S1 (design) | design | WARNING | docs-only | product | decided — ratified by the owner 2026-11-11 (D6): preserve-verbatim + append-only sync stands (Non-goals) |
| F3 | S2 (design) | design | WARNING | docs-only | product | decided — ratified by the owner 2026-11-11 (D7): no auto-append of fix rows; the Fixes lifecycle removes rows post-merge (Non-goals) |
| F4 | S14 (rebase re-scope) | design | GUIDANCE | docs-only | product | decided — owner chose the refusal-with-gate split 2026-11-11 (D8); the union route would be its own unit |

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
- **L3** — Delivery extension verbatim: "Pues implementarlo. Verifica también la issue #507
  porque igual está ahí el pedido también o en la propia PR #513 (por si hubiese algo más) y lo
  que sea que haya implementalo" and "La implementación hazla usando aw-local-apply" — the
  #498 scope-reinforcement LOGS class implemented under the standing local-apply procedure
  (S17/P10).
- **L4** — 2026-11-11, request verbatim: "Apply to this repository: triage and fix those that
  deserve to fix but understand the context before fix and check you haven't broke another
  different thing, if you have done, start the loop again until you fixed full symbol/related
  stuff", under the owner's standing local-workflow procedure (§0 resolution: `proceed` — the
  blocker batch on the 16:10Z receipt is empty by state; the five advisories are the triage
  targets; F2/F3/F4 remain the owner's decision-required rows).
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
- **E10** — 2026-11-11, the logs class (S17): RED at `13c80736` —
  `bun test packages/agentic-workflow/test/writer.merge.test.mjs` exit 1 (import error: the
  union does not exist), `bun test scripts/shared-doc-merge.test.mjs` exit 1 — 10 pass / 2 fail
  on the arming loop and the armed FF-5 merge, `bun test scripts/docs-generated-merge.test.mjs`
  exit 1 — 16 pass / 2 fail on the two closed-set pins. GREEN at `4805c27c`, re-cut at
  `33b3019f` (PE-010 surfaced the real journal's heterogeneous stamps in scratch: the first
  armed merge refused a real `## 2026-11-09 — … — manual` heading — 850 headings, 610 full
  ISO-second, date-only/minute shapes and 14 repeated exact headings — so the identity became
  the exact heading line and the contract the append-only prefix): crate merge suite 15/0,
  shared-doc-merge 12/0, docs-generated-merge 18/0, crate suite 644/0. Scratch differential at
  the delivered head (`mktemp -d` + `git archive`): `shared-doc-merge --install` arms four keys
  (`agentic-shared-logs — written`); a real merge of two branches appending a date-only and a
  full-ISO entry resolves clean (exit 0, both entries present). Deterministic gates at the
  delivered tree: `local-gate --skip-network` PASS 13 steps / 644 tests (version-parity green after
  the changeset declared `@gtrabanco/agentic-workflow` minor at `95a83020`),
  `check-skill-context --documents` PASS 4, changeset lint `ok`. verify@1 re-run at the ledger
  head → PASS.
- **E11** — 2026-11-11, `bun scripts/ceremony.mjs tier classify --base origin/main` · exit 0 ·
  `contract risk-tier-verdict@1 · tier: standard · reason_kind: executable-content (11 paths)` —
  the Risk tier section's `(E-line below)` resolves here; agrees with the cut run (S18/P11, O15).
- **E12** — 2026-11-11, count re-measurement superseding E10's narration (`log-kind@1`:
  corrections append, never edit — PE-014): `cd packages/agentic-workflow && bun run test` ·
  exit 0 · `645 pass / 0 fail` in three configurations — the live worktree at `468d9bf9`, and
  scratch clones at `95a83020` (E10's recorded head) and `468d9bf9` — with byte-identical test
  trees (`git diff --stat 95a83020..HEAD -- packages/agentic-workflow/test scripts` → empty), so
  E10's "644" does not reproduce at its recorded head while its PASS verdict and 13-step gate
  count do (S18/P13, O17).
- **E13** — 2026-11-11, the batch-3 frozen corpus re-run together at the fixed head (RED recorded
  at `3d5bb738` in the Correction triage 3 paragraph): the checks as frozen in O15, O16, O17 ·
  exit 0 · matches 1 / 3 / 1; O20's two sweep checks · exit 0 · matches 1 / 1 (the stale
  class-count sites reworded to four, the Planning evidence table is one table again);
  `bun scripts/promise-coherence.mjs docs/fix/507-driver-write/SPEC.md` · exit 0 · PASS (12
  checked · 20 skipped) (S18/S21, O15–O17, O20).
- **G3** — 2026-11-11 · HEAD 205ca4fd · `bun scripts/local-gate.mjs --skip-network` · exit 0 ·
  PASS — 13 step(s) in 166s (root-suite exit 0 · 103 suites, docs-generated-projection exit 0,
  crate 645/0). The first attempt at this head failed at `pi-node-compat` — the unstable build
  race recorded in the Correction triage 3 paragraph, green isolated and on this full re-run,
  not batch-caused; handed to the owner as a new finding (S3).
- **E14** — 2026-11-11, batch-3 close — O15–O20 flipped only after their foreground validators:
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/507-driver-write/SPEC.md`
  · exit 0 · `verify@1, all checks pass` (`ok: true`, no violations);
  `bun scripts/promise-coherence.mjs docs/fix/507-driver-write/SPEC.md` · exit 0 · PASS (12
  checked · 20 skipped); `bun scripts/docs-generate.mjs --check` · exit 0 · PASS — Roadmap
  unchanged (the batch's SPEC edits project nothing); the frozen `rg` checks re-run after the
  flips · exit 0 · matches 1 / 3 / 1, then 4, then 1 / 1 (O15–O18, O20). Gate: G3.
- **D6** — 2026-11-11, owner ratification of F2 (authority: owner verbatim, "Vale, seguimos tus
  recomendaciones"): the roadmap sync keeps preserve-verbatim + append-only — hand rows pass
  through byte for byte, generation appends only feature rows missing one, and a declared
  `roadmap_summary:` overrides its cell; whole-table regeneration stays rejected. Supersedes F2's
  "awaits the owner's verdict" and the note on D1; this unit's session decisions D2–D5 live in
  the 2026-11-11 journal entry (`docs/LOGS.md`).
- **D7** — 2026-11-11, owner ratification of F3 (same authority): fix rows stay owner-managed and
  are never auto-appended — the Fixes lifecycle registers at open and removes post-merge, and
  folder presence never resurrects a row; the Notes-cell `roadmap_summary:` override (S8) still
  applies. Supersedes F3's "awaits the owner's verdict".
- **D8** — 2026-11-11, owner decision on F4 (same authority): keep the refusal-with-gate split —
  `docs/generated/**` stays with the #420 projection driver, the class driver refuses it by name
  (`generated-projection`), and the gate's `docs-generated-projection` step stays the safety net;
  the union route is deferred and would be its own unit. Supersedes F4's decision-required route
  and batch 2's recorded residual.

## Next

Correction batch 3 applied (L4 advisory triage on the 16:10Z receipt: three repairs — the tier
E-line, the count re-measurement, the journal-anchored `D3` pointers — two dispositions, two
related surfaces; blockers stayed 0; the new gate-graph finding sits in the Correction triage 3
paragraph for the owner). The design calls are decided (D6–D8): the two ratified behaviors stand
and the `docs/generated/**` residual keeps the split. Awaiting: the external verifier's delta
re-verify of batch 3, the owner's push of `3d5bb738…9e382493`, and the owner's separate issue
for the gate-graph finding.

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