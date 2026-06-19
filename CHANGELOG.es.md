# Registro de cambios

> 🇬🇧 [English version](CHANGELOG.md)

Cada skill (`skills/<nombre>/SKILL.md`) lleva su **propia** `version:` en el
frontmatter y evoluciona de forma independiente. Las tablas por skill de abajo son
la fuente de verdad de **qué cambia entre cada versión**; al final hay un registro
cronológico condensado.

## Política de versionado (por skill)

| Salto | Cuándo |
|---|---|
| **mayor** | cambio que rompe cómo invocas o dependes de la skill — un renombrado, un flag eliminado/renombrado, un contrato o forma de salida cambiada. Lleva nota de migración. |
| **menor** | nueva capacidad retrocompatible — un flag nuevo, una sección añadida, un nuevo caso de enrutado. |
| **parche** | redacción, ejemplos, aclaraciones, limpieza interna; sin cambio de comportamiento. |

Los renombrados son **mayores** y llevan nota en
[`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

## Instalar y pinear una versión

```sh
# Última (sigue la rama por defecto del repo):
npx skills add gtrabanco/agentic-workflow

# Pinear a un release etiquetado (reproducible — recomendado para pinear):
npx skills add gtrabanco/agentic-workflow#release-2026-06-19

# Pinear a cualquier git ref (tag o rama) con el atajo #<ref>:
npx skills add gtrabanco/agentic-workflow#<tag-o-rama>

# Restaurar de forma reproducible desde el lockfile (pinea por hash de contenido):
npx skills experimental_install      # restaura exactamente lo que registra skills-lock.json
npx skills update                     # mueve las skills instaladas a lo último publicado aquí
```

Cómo funciona el pinning realmente, **verificado** contra el CLI `skills`:

- **La `version:` por skill es documentación**, no un selector del CLI — el CLI
  resuelve por repo + ruta + hash de contenido e **ignora el frontmatter** para
  resolver. Así que no pineas "execute-phase 1.2.0" directamente; pineas el **ref del
  repo** en el que esa skill tenía esa versión.
- **El atajo `#<ref>` funciona** (`owner/repo#<tag-o-rama>`) — confirmado. Un SHA de
  commit crudo sobre una URL git completa puede fallar al clonar, así que **prefiere
  tags**.
- **Los releases se etiquetan** `release-YYYY-MM-DD` (este repo). Pinea a un tag para
  congelar todo el conjunto de skills en un snapshot conocido; mapea el tag → versiones
  por skill con las tablas de abajo.
- **`skills-lock.json`** registra el `computedHash` de cada skill instalada;
  `npx skills experimental_install` restaura ese conjunto exacto en otra máquina/CI.
  Es el mecanismo de instalación reproducible incluso sin tag.

---

## Histórico de versiones por skill

### De cara al usuario

#### `ship-roadmap`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.1.0 | 2026-06-19 | menor | Alineado a done-al-abrir-PR: el flip a `done` viaja en el commit de la fase PR; `SHIP: COMPLETE` exige los PRs **mergeados** (no solo `done`); los dependientes se desbloquean al **merge**; REVIEW triagea cada hallazgo no-fix-now |
| 1.0.0 | 2026-06-10 | — | Nuevo autopilot. Una entrevista inicial → funda el proyecto → entrega el roadmap feature a feature vía `/loop` (plan → execute → review → PR → audit). Merge humano por defecto; `--fullauto` con doble llave y suelos de seguridad fail-closed; registro de decisiones commiteado + log de run sin trackear |

#### `execute-phase`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.3.0 | 2026-06-19 | menor | Una unidad terminada (single-pass, `--fix`, fase final) **siempre abre su PR** + **pasa a `done` al abrir PR** (construida, no mergeada); el hand-off final a `review-change` ahora es **obligatorio**; la entrada del fix-index se mantiene hasta el merge; imprime el siguiente paso en todos los modos |
| 1.2.0 | 2026-06-09 | menor | Tests primero en fases core/orquestación; P1 commitea los artefactos de planificación aparte; protocolo nunca-commitear-en-rojo (irreparable → `known-issues.md` + parar); regla de divergencia de plan; continuidad por `progress.md` |
| 1.1.2 | 2026-06-09 | parche | Patrón de ejecución por lotes con `/loop` documentado |
| 1.1.1 | 2026-06-05 | parche | `allowed-tools` añadido + comandos de commit/PR imperativos (la skill ahora sí commitea) |
| 1.1.0 | 2026-06-05 | menor | La revisión cada 2 fases pasa de auto-ejecución en turno a **hand-off** (corre en su propio tier) |
| 1.0.0 | 2026-06-05 | — | Primer release versionado |

#### `plan-feature`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.1.0 | 2026-06-09 | menor | Dimensiona cada feature `XS/S/M/L`; enruta las pequeñas a la vía single-pass; imprime el siguiente paso correcto |
| 1.0.1 | 2026-06-05 | parche | `effort medium → high` (sus pasos de planificación en turno lo necesitan) |
| 1.0.0 | 2026-06-05 | — | Primer release — el router de planificación (idea / issue / slug acotado / `--next`) |

#### `plan-fix`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.0.2 | 2026-06-19 | parche | Añadido `## Done when` — toda skill termina imprimiendo el siguiente paso |
| 1.0.1 | 2026-06-09 | parche | Redacción forge-agnóstica ("forge CLI per Workflow conventions") |
| 1.0.0 | 2026-06-05 | — | Primer release — redacta un SPEC de fix acotado como arquitecto, para para revisión |

#### `review-change`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.2.0 | 2026-06-19 | menor | **Obligatorio antes de cada merge**; enruta **cada hallazgo no-fix-now por `triage-issue`** (issue / decisión documentada / descarte justificado), nunca se pierde en silencio; imprime el siguiente paso |
| 1.1.0 | 2026-06-09 | menor | Comprobación de deriva del SPEC (diff vs. alcance + criterios de aceptación del SPEC) |
| 1.0.1 | 2026-06-05 | parche | Redacción: `execute-phase` "hace hand-off a" él |
| 1.0.0 | 2026-06-05 | — | Primer release — orquestador de revisión adaptativo a la plataforma |

#### `audit-pr`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.1.0 | 2026-06-19 | menor | Gate de fusión reforzado: **nunca fusionar con docs pendientes**; la entrada issue/fix-index debe seguir trackeada (se retira solo tras el merge); `done` ≠ listo-para-fusionar; indica el siguiente paso |
| 1.0.3 | 2026-06-09 | parche | Redacción forge-agnóstica |
| 1.0.2 | 2026-06-05 | parche | Revertido `context: fork` (el CLI suprimía la salida de la skill) |
| 1.0.1 | 2026-06-05 | parche | Añadido `context: fork` (luego revertido) |
| 1.0.0 | 2026-06-05 | — | Primer release — gate de fusión a nivel de PR |

#### `product-audit`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.2.1 | 2026-06-19 | parche | Imprime un siguiente paso explícito (batch `triage-issue` → `plan-feature`/`plan-fix`) |
| 1.2.0 | 2026-06-14 | menor | `model: fable → opus` (Fable ya no disponible; Opus a `effort: max` es el tier de barrido equivalente) |
| 1.1.0 | 2026-06-09 | menor | `model: opus[1m] → fable` (Fable 5 con contexto 1M nativo) — revertido luego en 1.2.0 |
| 1.0.3 | 2026-06-05 | parche | Revertido `context: fork` |
| 1.0.2 | 2026-06-05 | parche | `model: opus → opus[1m]` + `context: fork` |
| 1.0.1 | 2026-06-05 | parche | Tip provisional de `ultracode` (ajuste de sesión que activa el usuario) |
| 1.0.0 | 2026-06-05 | — | Primer release — chequeo de salud periódico de todo el producto |

#### `audit-docs`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.0.4 | 2026-06-19 | parche | Imprime un siguiente paso explícito |
| 1.0.3 | 2026-06-09 | parche | Redacción forge-agnóstica |
| 1.0.2 | 2026-06-05 | parche | Revertido `context: fork` |
| 1.0.1 | 2026-06-05 | parche | Añadido `context: fork` (luego revertido) |
| 1.0.0 | 2026-06-05 | — | Primer release — coherencia docs ↔ roadmap ↔ código ↔ fix-index |

#### `triage-issue`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.1.1 | 2026-06-19 | parche | Imprime un siguiente paso explícito por veredicto |
| 1.1.0 | 2026-06-09 | menor | Triage por lotes (`triage-issue 12 14 17`) — veredictos independientes, una tabla resumen |
| 1.0.0 | 2026-06-05 | — | Primer release — clasifica un issue verificando su disparador contra el código |

#### `init-workspace`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.1.1 | 2026-06-19 | parche | `## Done when` imprime el siguiente paso explícito |
| 1.1.0 | 2026-06-09 | menor | Detecta el **forge** desde la URL del remoto y lo registra; sugiere las skills de revisión complementarias de la plataforma |
| 1.0.0 | 2026-06-05 | — | Primer release — adapta el scaffold de docs a un proyecto |

### Internas (`user-invocable: false`)

| Skill | Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|---|
| `review-implementation` | 1.0.1 | 2026-06-09 | parche | Descripción acortada 96 → 36 palabras (contexto siempre cargado); cuerpo sin cambios |
| | 1.0.0 | 2026-06-05 | — | El motor de hallazgos + rúbrica de clasificación que compone `review-change` |
| `plan-feature-interview` | 1.1.0 | 2026-06-09 | menor | Estima el tamaño `XS/S/M/L`; pide una referencia de diseño UI en features con UI |
| | 1.0.0 | 2026-06-05 | — | Entrevista una idea en crudo hasta un SPEC |
| `plan-feature-from-issue` | 1.1.0 | 2026-06-09 | menor | Produce un SPEC acotado **dimensionado** con `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → SPEC acotado |
| `plan-feature-scaffold` | 1.1.0 | 2026-06-09 | menor | Escala los artefactos al tamaño — XS/S → solo SPEC; M/L → set completo que acaba en fase de hardening |
| | 1.0.0 | 2026-06-05 | — | SPEC → set completo de artefactos de planificación + entrada de roadmap |

---

## Registro cronológico (más reciente primero)

- **2026-06-19 — política de workflow.** Una unidad nunca acaba solo-en-rama y nada
  no-fix-now se pierde en silencio: las unidades terminadas **siempre abren el PR** y
  pasan a **`done` al abrir PR** (construida, no mergeada — el estado de merge vive en
  el forge); `review-change` es **obligatorio** antes de cada merge y enruta **cada
  hallazgo no-fix-now por `triage-issue`**; `audit-pr` **nunca fusiona con docs
  pendientes** y trata `done` ≠ listo-para-fusionar; los dependientes se desbloquean al
  **merge**, no al `done`. Nueva regla de autoría de repo (`CLAUDE.md`): **toda skill
  termina sugiriendo el siguiente paso**. Bumps: `execute-phase` 1.3.0, `review-change`
  1.2.0, `audit-pr` 1.1.0, `ship-roadmap` 1.1.0, `plan-fix` 1.0.2, `init-workspace`
  1.1.1, `audit-docs` 1.0.4, `product-audit` 1.2.1, `triage-issue` 1.1.1. Leyendas de
  roadmap **y** fix-index: `done` = *construido + PR abierta*; el estado `in-review`
  del fix-index se funde en `done`.
- **2026-06-14 — `product-audit` 1.2.0.** `model: fable → opus` (Fable no disponible).
- **2026-06-10 — `ship-roadmap` 1.0.0.** El autopilot de punta a punta (conjunto → 14 skills).
- **2026-06-09 — lote de calidad.** Dimensionado (`XS/S/M/L`), tests primero, deriva
  de SPEC, triage por lotes, forge-agnóstico, patrón `/loop` por lotes, sección de SPEC
  Deploy & rollback, Fable 5 para `product-audit`.
- **2026-06-05 — primer release versionado.** Todas las skills selladas a `1.0.0`; la
  consolidación previa de 9 → 13 skills es anterior al versionado formal (ver
  [`MIGRATION.md`](docs/workflow/MIGRATION.md)). El mismo día: composición → hand-off a
  través del límite de modelo/effort, router `plan-feature` → `high`, experimentos de
  aislamiento de contexto (añadidos y revertidos).
