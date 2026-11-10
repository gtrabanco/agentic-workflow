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
- **AC-S2** — `scripts/docs-generated-merge.mjs` resuelve conflictos en `docs/ROADMAP.md` regenerando desde las unit docs. Check: crear un fixture con conflicto en ROADMAP.md, correr el driver, verificar que el resultado es la regeneración correcta
- **AC-S3** — `init-workspace` crea `.gitattributes` y arma el merge driver en bootstrap y upgrade. Check: un repo limpio → `init-workspace .` → `.gitattributes` existe con las líneas correctas; `git config --get merge.docs-generated.driver` → no vacío
- **AC-S4** — `template/.gitattributes` existe y tiene las líneas del merge driver. Check: `cat template/.gitattributes` contiene `docs/ROADMAP.md merge=docs-generated` y `docs/generated/** merge=docs-generated`
- **AC-S5** — El campo `roadmap_summary:` es opcional en el SPEC template: si no se provee, se deriva del `One-line:`. Check: `cat template/docs/fix/_TEMPLATE/SPEC.md` | `cat template/docs/features/_TEMPLATE/SPEC.md` contienen el campo `roadmap_summary:`; `bun scripts/docs-generate.mjs` no falla si falta
- **AC-S6** — `bun scripts/docs-generated-merge.mjs --install` funciona en un repositorio limpio. Check: `bun scripts/docs-generated-merge.mjs --install` → exit 0; `git config --get merge.docs-generated.driver` → no vacío; `git config --get merge.docs-generated.name` → contiene "docs-generated"
- **AC-S7** — `bun scripts/local-gate.mjs --skip-network` pasa con ambos paths cubiertos. Check: `bun scripts/local-gate.mjs --skip-network --json` → `docs-generated-projection` → PASS

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
- P5 — actualizar el gate (`scripts/local-gate.mjs`) para que `docs-generated-projection` cubra ambos paths (validator: `bun scripts/local-gate.mjs --skip-network` → PASS)
  (Implements: S7)
  Relevant files: scripts/local-gate.mjs

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | El merge driver para `docs/generated/` existe y es funcional pero no está instalado por defecto | `scripts/docs-generated-merge.mjs` existe; `.gitattributes` no se copia con el template | current | O1 |
| PE-002 | repository | `docs/ROADMAP.md` es el único archivo que genera conflictos de merge frecuentes (aparte de `docs/generated/`) | git history: #269 vs #505 chocaron en ROADMAP.md y docs/generated/ | current | O2 |
| PE-003 | repository | Las columnas NN, Slug, Status, Depends on se pueden derivar de las unit docs; Summary necesita un campo adicional | `scripts/docs-generate.mjs` ya lee NN, Slug de los directorios; Status de `## Status`; Depends on de `## Depends on` | current | O3 |
| PE-004 | repository | El campo `roadmap_summary:` es opcional: si no existe, se puede derivar del `One-line:` o dejar vacío | El SPEC template ya tiene `> One-line:` en ambos templates (features y fixes) | current | O4 |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1 | El emitter genera ROADMAP.md desde las unit docs sin texto manual que choque | P1 | P1 | scripts/docs-generate.mjs | `bun scripts/docs-generate.mjs --check` → PASS; `docs/ROADMAP.md` existe y es válido | the E line with the check exit and the file existence | planned |
| O2 | S2 | El merge driver resuelve conflictos en ROADMAP.md regenerando desde las unit docs | P2 | P2 | scripts/docs-generated-merge.mjs | fixture con conflicto → driver resuelve → resultado coincide con regeneración | the E line with the fixture test exit and the comparison | planned |
| O3 | S3 | init-workspace instala `.gitattributes` y el merge driver en bootstrap y upgrade | P3 | P3 | init-workspace | repo limpio → `.gitattributes` existe; `git config --get merge.docs-generated.driver` → no vacío | the E line with the config check | planned |
| O4 | S5 | El campo `roadmap_summary:` es opcional y se deriva del `One-line:` si falta | P4 | P4 | SPEC template | template contiene el campo; `bun scripts/docs-generate.mjs` no falla si falta | the E line with the generate check | planned |

## Triaged steps

> TODO: triage este fix para decidir si se corta en una sola unidad o se divide en fases (P1, P2, P3 como unidades separadas).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — (pending, se llena en triage)

## Next

P1 — extend `docs-generate.mjs` para generar la página `roadmap`.

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