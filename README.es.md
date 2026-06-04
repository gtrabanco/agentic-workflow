# Agentic Workflow Skills

> 🇬🇧 [English version](README.md)

Un conjunto reutilizable de **skills para agentes** que ejecutan un flujo de
trabajo disciplinado y dirigido por documentación para construir software con
agentes — desde una idea o issue hasta un cambio revisado, clasificado y listo
para fusionar. Las skills son **adaptativas al proyecto**: descubren y obedecen
en tiempo de ejecución la guía, la arquitectura, el roadmap y las guías de estilo
de cada repositorio, así que el mismo flujo funciona en cualquier stack.

Son Markdown plano (ficheros `SKILL.md`), así que funcionan con **cualquier
agente** que lea skills — Claude Code, Cursor, Codex, OpenCode, Cline y
[más de 70](https://skills.sh) — instaladas con la CLI
[`skills`](https://github.com/vercel-labs/skills) (ver
[Instalación](#instalación)).

> Los ejemplos en `docs/` son genéricos e ilustrativos; las skills en sí
> son agnósticas del stack y de la arquitectura.

## Qué incluye

```
skills/                  las 8 skills (un SKILL.md cada una) — la fuente instalable
.claude/skills           symlink → ../skills, para que este repo las use en Claude Code
template/                 el scaffold de documentación exportable (el sustrato que leen las skills)
docs/workflow/           el tutorial completo (flujo de feature, de issue, referencia, replicación)
docs/features/_TEMPLATE  plantilla de SPEC de feature + ROADMAP (los artefactos que generan las skills)
docs/fix/                plantilla de SPEC de fix + índice
.github/                 plantillas de issue + PR que el flujo espera
```

Las skills son el **comportamiento**; `template/` es el **sustrato** que leen (un
`CLAUDE.md` genérico + mapa de documentación, plantillas de SPEC/feature/fix y
plantillas de GitHub). Genera la forma de trabajo de un proyecto nuevo con
`npx degit gtrabanco/agentic-skills/template mi-proyecto` — ver
[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md).

## Las skills

### Planificación y creación
| Skill | Qué hace |
|---|---|
| `design-feature` | Entrevista interactiva desde una idea en crudo; pregunta proactivamente para rellenar el SPEC |
| `feature-from-issue` | Convierte un issue de petición de feature en un SPEC acotado (enlaza `Closes #N`) |
| `plan-feature` | Genera el SPEC + el conjunto completo de artefactos de planificación; lo registra en el roadmap (solo docs) |

### Decisión y revisión
| Skill | Qué hace |
|---|---|
| `triage-issue` | Clasifica un issue (fix-now / promote / postpone / wontfix) **verificando su disparador contra el código** |
| `review-implementation` | Revisión en dos fases (encontrar → clasificar) que termina en una tabla de decisión: fix-now / postpone / ignore / intentional-tradeoff |
| `audit-docs` | Audita docs ↔ roadmap ↔ código ↔ índice de fixes en busca de desviaciones |

### Ejecución (se componen con las anteriores)
`execute-phase` (una fase, una feature pequeña de una pasada, o un fix con
`--fix`), `draft-fix-spec` (redacta un SPEC de fix desde un issue).

Las skills complementarias para UI/UX y calidad específica del lenguaje (diseño,
ux, tipado…) **no van incluidas** — son específicas del dominio, así que se
instalan por proyecto. Ver `docs/workflow/RECOMMENDED_SKILLS.md` para saber
cuáles aplican y cuándo.

## Modelo y esfuerzo recomendados

Cada skill **fija su modelo** en el frontmatter (tabla abajo) usando un alias de
tier flotante (`opus`/`sonnet`/`haiku`) que se auto-actualiza a la última versión —
así no caduca. El override aplica solo durante el turno de esa skill; tu modelo de
sesión vuelve después. **Tú mandas:** para cambiar el modelo de una skill, edita su
línea `model:` (o pon `model: inherit` para seguir tu sesión). El esfuerzo lo
decides en cada ejecución.

| Skill | Tier de modelo | Esfuerzo | Por qué |
|---|---|---|---|
| `design-feature` | Opus | alto | entrevista abierta + juicio de diseño |
| `feature-from-issue` | Opus | alto | clasificar, traducir, acotar, mapear al roadmap |
| `draft-fix-spec` | Opus | alto | scoping de arquitecto + análisis de riesgo |
| `triage-issue` | Opus | alto | verificar disparadores contra el código; decisión con criterio |
| `review-implementation` | Opus | alto | revisión profunda multi-eje + clasificación |
| `plan-feature` | Opus | medio | generación estructurada de artefactos desde un SPEC ya acotado |
| `audit-docs` | Sonnet | medio | comprobaciones cruzadas mayormente mecánicas (Opus para auditorías profundas) |
| `execute-phase` | Sonnet | medio | implementación mecánica según el SPEC — una fase o de una pasada (Opus si la lógica es sutil) |

> Regla general: **planificar, decidir y revisar → Opus, esfuerzo alto**;
> **ejecución mecánica → Sonnet, medio** (sube a Opus si la lógica es sutil).

## Cómo usarlas

Tutorial completo en **[`docs/workflow/`](docs/workflow/README.md)**. En resumen:

### Construir una feature
```
/design-feature   "<tu idea>"          # o  /feature-from-issue <N>
        → entrevista / análisis del issue → rellena el SPEC
/plan-feature                          # genera SPEC + PLAN + TASKS + … + entrada en el roadmap
/execute-phase <NN> <fase>          # implementa una fase cada vez, verificada por el gate, un commit cada una
/review-implementation                 # hallazgos + tabla de decisión clasificada (sin refactor)
/code-review · /security-review · /verify
gh pr create --base main               # "Closes #N" si vino de un issue
```
Ver **[`docs/workflow/FEATURE_WORKFLOW.md`](docs/workflow/FEATURE_WORKFLOW.md)**.

### Gestionar un issue
```
/triage-issue <N>
   → lee el disparador "cuándo arreglar" del issue, lo verifica contra el código actual
   → fix-now → draft-fix-spec → execute-phase --fix
     promote → feature-from-issue
     postpone → comentario con fecha, dejar abierto (sin trabajo inline)
     wontfix → proponer cierre
```
Ver **[`docs/workflow/ISSUE_WORKFLOW.md`](docs/workflow/ISSUE_WORKFLOW.md)**.

### Revisar y clasificar una rama
```
/review-implementation                 # por defecto el diff actual vs main; pasa una ruta para acotar
```
Ver **[`docs/workflow/REVIEW_AND_CLASSIFY.md`](docs/workflow/REVIEW_AND_CLASSIFY.md)**.

## Principios fundamentales

1. **Las docs dirigen el trabajo** — cada skill lee primero la guía del proyecto,
   el mapa de docs, la arquitectura, el roadmap y las guías de estilo, y los respeta.
2. **Planificar antes de programar** — las features obtienen un SPEC + artefactos
   antes de escribir una sola línea.
3. **Una fase cada vez** — cada una verificada y commiteada por separado.
4. **Un PR por unidad, contra la rama por defecto** — nunca sobre `main`, nunca apilados.
5. **Evidencia sobre reflejo** — el triage verifica disparadores; el trabajo
   diferido se rastrea, no se mete inline.
6. **Gate antes del commit** — type-check + tests + build en verde.

## Instalación

Usa la CLI [`skills`](https://github.com/vercel-labs/skills) — lee los ficheros
`SKILL.md` directamente de este repo y los instala en el agente que uses
(autodetecta Claude Code, Cursor, Codex, OpenCode, Cline y
[más de 70](https://skills.sh)).

```sh
# Desde la raíz del repositorio DESTINO — instala las 8 skills:
npx skills add gtrabanco/agentic-skills

# Elige skills concretas, o un agente concreto:
npx skills add gtrabanco/agentic-skills --skill plan-feature --skill triage-issue
npx skills add gtrabanco/agentic-skills --agent claude-code --agent cursor

# Instala para el usuario actual (global) en vez de para el proyecto actual:
npx skills add gtrabanco/agentic-skills --global

# Gestiónalas después:
npx skills list
npx skills update
npx skills remove plan-feature
```

Sin publicar en npm, sin registro, sin paso de build — `skills` clona el repo y
copia (o enlaza con symlink) las carpetas de skills en el sitio correcto para
cada agente. Las skills **descubren el proyecto destino en tiempo de ejecución**
(guía del agente, mapa de documentación, arquitectura, roadmap, índice de fixes),
así que funcionan de inmediato sin configuración por repo.

¿Prefieres las skills **regeneradas y reajustadas** a las convenciones de otro
proyecto en lugar de copiadas literalmente? Mira el
**[prompt portable](docs/workflow/PORTABLE_PROMPT.md)** adaptativo. Todos los
detalles y la guía de "qué método cuándo" están en
**[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md)**.

## Skills complementarias recomendadas

`docs/workflow/RECOMMENDED_SKILLS.md` lista las skills de calidad y arquitectura
**agnósticas del stack** que merece la pena tener (p. ej. `karpathy-guidelines`,
`code-review`, `security-review`, `simplify`, `skill-creator`, el conjunto
`engineering:*`) y —crucialmente— cuáles **omitir** según el proyecto (p. ej.
skills de diseño para un programa de terminal, `claude-api` si no hay features
con LLM).
