<p align="center">
  <img src="docs/assets/logo.svg" alt="Logo de Agentic Workflow" width="120" height="120">
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=2Ai0NkTvoeM">
    <img src="https://img.youtube.com/vi/2Ai0NkTvoeM/mqdefault.jpg" alt="ship-roadmap creando una PR en un repositorio de ejemplo" width="280">
  </a>
  <br>
  <sub style="font-size: 0.75em;"><code>ship-roadmap</code> creando una PR de principio a fin en un repositorio de ejemplo — clic para ver</sub>
</p>

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

> ## ⚠️ Cambio incompatible (v3, 2026-07-04): la rama por defecto ahora es agnóstica de modelo
>
> `npx skills add gtrabanco/agentic-workflow` (sin `#ref`) instala ahora lo que
> antes era la variante **`#inheritance`**: ninguna skill lleva frontmatter
> `model:`/`effort:`, así que cada skill simplemente **hereda el modelo y el
> effort que ya esté usando tu sesión de agente**. El objetivo: usar este
> workflow nunca debería atarte al catálogo de modelos de un único proveedor —
> tú eliges el modelo, las skills solo aplican la disciplina.
>
> - **¿Usas Claude Code y quieres los niveles Opus/Sonnet + effort ajustados
>   por skill que este proyecto traía por defecto?** Instala la rama
>   **`#claude`**: `npx skills add gtrabanco/agentic-workflow#claude`.
> - **¿Ya tenías fijado `#inheritance`?** No hay que hacer nada — `#inheritance`
>   sigue funcionando, mantenida como alias exacto de la rama por defecto.
> - **Todo el resto** (cualquier otro agente, o si prefieres elegir tú los
>   niveles): el comando de instalación normal de abajo ya te da esta rama —
>   no hace falta nada más.
>
> Ver [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) para la
> justificación completa y las notas de actualización.

## Qué incluye

```
skills/                  las 28 skills (14 de cara al usuario + 14 internas) — la fuente instalable
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
`npx degit gtrabanco/agentic-workflow/template mi-proyecto` — ver
[`docs/workflow/REPLICATE.md`](docs/workflow/REPLICATE.md).

## Las skills

**14 skills de cara al usuario** (una entrada de menú cada una) + **14 internas**
que se componen por ti: los tres pasos de planificación del router `plan-feature`,
el motor de `review-change`, el contrato `orchestration-envelope`, y el **pack de revisión interno propio de 9 skills**
(`review-code`, `review-security`, `review-verify`, `review-debt`,
`review-design`, `review-a11y`, `review-brand`, `review-perf`, `review-seo`) —
así que **nunca se requiere una skill de revisión externa**, en ningún agente y
con ningún modelo. Un único camino disciplinado:
**plan → execute → review → audit → merge.**

### Configuración inicial

| Skill            | Qué hace                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Trae el scaffold `template/` y lo **adapta a tu proyecto** por entrevista (gate, mapa de docs, arquitectura); sugiere las skills de revisión complementarias que necesita tu plataforma; ofrece instalar las skills |

### Planificación

| Skill          | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plan-feature` | **Un único punto de entrada para planificar una feature.** Detecta la entrada — una idea en crudo (entrevista), un issue `#N` (issue → SPEC acotado) o un slug/SPEC ya acotado (directo al scaffolding) — enruta al paso correcto y registra la entrada en el roadmap. `--next` planifica el siguiente elemento del roadmap. **Dimensiona cada feature** (`XS/S/M/L`): las pequeñas van por la vía SPEC-only de una pasada — sin ceremonia de artefactos; las M/L llevan el set completo con fase de hardening obligatoria. |
| `plan-fix`     | El equivalente del flujo de fix: como arquitecto redacta un SPEC de fix acotado a partir de un issue, commitea en una rama de fix y **se detiene para revisión**.                                                                                                                                                                                                                                                                                                                                                           |

> Solo llamas a `plan-feature`; este compone los pasos internos
> `plan-feature-interview`, `plan-feature-from-issue` y `plan-feature-scaffold`
> (ocultos del menú).

### Ejecución

| Skill           | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute-phase` | Implementa una fase de una feature (por defecto), una feature pequeña `XS/S` de una pasada, o un fix (`--fix`). **Gate de dependencias primero**: el cierre transitivo de `Depends on:` debe estar fusionado, o se detiene con la cadena incumplida y el orden de construcción (`--force` lo salta, registrado). **Tests primero** en trabajo de dominio/orquestación, nunca commitea en rojo, verificada por el gate, un commit por fase; **recomienda un checkpoint de `review-change` cada 2 fases (omitible) y hace hand-off una vez al final (obligatorio)**. Una unidad terminada **siempre abre su PR, imprime la URL del PR en el chat y pasa a `done`** (construida, no mergeada); ningún turno acaba con el árbol sucio, y con el PR abierto cada commit se pushea inmediatamente. |

### Revisión y auditoría — _cambio → PR → producto_

| Skill           | Alcance         | Qué hace                                                                                                                                                                                                            |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review-change` | el **cambio**   | Ejecuta solo las revisiones que **aplican a tu plataforma** (código, seguridad, verify, diseño, a11y, marca, rendimiento, SEO) — adversariales por defecto, asumiendo que el diff está mal hasta probar lo contrario — y clasifica → una tabla de decisión + una checklist explícita de verificación manual; un árbol sucio o commits sin push en la rama del PR son hallazgos `workflow` fix-now. La revisión final obligatoria **debe correr en una conversación que no implementó el cambio** — si lo hizo, parar y hacer hand-off a una nueva |
| `audit-pr`      | el **PR**       | Gate de fusión: criterios de aceptación cumplidos, todas las fases hechas, docs/tests/CI en verde, `Closes #N`, ejes de revisión limpios → **listo para fusionar o una lista de bloqueantes**, siempre con la URL completa del PR; con MERGE-READY publica un comentario datado y ligado al SHA en el propio PR. Auto-merge opt-in: con una política documentada fusiona PRs MERGE-READY tras un checklist de limpieza fail-closed (algo pendiente → push, esperar CI, re-auditar) |
| `product-audit` | el **producto** | Chequeo de salud periódico de espectro completo; mina las docs de features → propone issues + altas/bajas en el roadmap (**nunca arregla automáticamente**)                                                         |
| `audit-docs`    | las **docs**    | Audita docs ↔ roadmap ↔ código ↔ índice de fixes en busca de desviaciones                                                                                                                                           |

> El motor de hallazgos de `review-change` es el `review-implementation` interno
> — la pasada de dos fases encontrar → clasificar que compone (y que reutilizan
> `audit-pr` / `product-audit`) — más el pack de revisión interno: una skill
> `review-*` por eje, cada una una checklist fija que devuelve una tabla de
> hallazgos + PASS|FAIL. Ninguna es entrada de menú; llegas a ellas a través de
> `review-change`.

### Decisión

| Skill          | Qué hace                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `triage-issue` | Clasifica un issue (fix-now / promote / postpone / wontfix) **verificando su disparador contra el código** |

### Documentación

| Skill           | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate-docs` | Convierte el diff de una unidad en **documentación de desarrollador en el sitio de docs del propio proyecto** — guías how-to incrementales mediante un adaptador descubierto (Starlight MDX de primera clase, markdown plano como fallback), un **mapa de conocimiento/llamadas** renderizado desde un comando determinista declarado por el proyecto (el modelo nunca infiere aristas) y export opt-in `--review` de informes de revisión. El frontmatter de procedencia permite a `audit-docs` cazar páginas huérfanas/obsoletas; nunca crea el sitio, nunca edita código. |

### Sesión

| Skill         | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `log-session` | Añade una entrada estructurada a `docs/LOGS.md` — qué hizo la sesión, archivos tocados, decisiones + _por qué_, y el siguiente paso — para que tú (o cualquiera) retome en frío. Ejecútala antes de `/clear` o de cerrar. El `template/` además trae **hooks gratuitos y opt-in** que añaden una entrada mecánica automáticamente en cada `/clear`/salida y pueden reinyectar la última entrada al arrancar. |
| `workflow-status` | **Sensor de solo lectura para orquestación programática.** Calcula el estado completo del proyecto — cada feature/fix con su cierre de dependencias transitivo (cumplido/incumplido), qué es arrancable ahora mismo y en qué orden de construcción, PRs abiertas + estado de auditoría, fixes pendientes y hallazgos a la espera de triaje — y lo emite como un envelope máquina JSON fijo. La pieza que un driver externo llama entre pasos (ver [Orquestación programática](#orquestación-programática)). Nunca edita nada. |

### Mantenimiento del repo

| Skill        | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bump-skill` | Tras editar una skill en este repo: sube la `version:` en el frontmatter del SKILL.md, añade filas en CHANGELOG.md + CHANGELOG.es.md y actualiza las tablas de skills y modelos en README.md + README.es.md. Además **lintea las reglas de autoría del repo** (toda skill cierra con un bloque `→ Next:`; las fases son `P1, P2, …`, nunca `S1`/"Steps"). Ejecutar antes de cada commit que toque una skill. |

### Autopilot — el flujo completo, de punta a punta

| Skill          | Qué hace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ship-roadmap` | **Construye la app entera desde el roadmap.** Una entrevista inicial (producto, features, stack, arquitectura — recomendada _proporcionalmente_, nunca por defecto a un patrón con nombre —, calidad, ops, autonomía, presupuesto), funda el proyecto si hace falta, crea o adopta el roadmap completo, y un bucle disparado por un driver (`/loop` en Claude Code, un orquestador externo o re-invocación manual — cada iteración dice por qué termina) lo entrega feature a feature a través de las skills de arriba — **sin más preguntas**. Tras la última feature sigue: un **barrido de issues** inventaría las issues abiertas más el residuo documentado del run (known-issues, trade-offs, hallazgos pospuestos), lo triagea todo y entrega las fix-now por las mismas etapas. Por defecto: abre PRs y tú fusionas; `--fullauto` fusiona los PRs MERGE-READY bajo suelos de seguridad innegociables. Termina con un informe final: issues a abrir, propuestas de features descubiertas, checks manuales, cadencia de product-audit. |

Cómo el autopilot ejecuta el flujo — una entrevista al entrar, PRs revisadas al
salir, y tú solo apareces para fusionar (ámbar):

```mermaid
flowchart LR
    I([Entrevista]):::tu --> RM[Roadmap] --> P[Planificar]
    P --> X[Ejecutar] --> RV[Revisar] --> PR[Abrir PR] --> A[Auditar] --> M([Fusionar]):::tu
    M -->|siguiente feature| P
    M -.->|roadmap completo| REP[Informe final]
    classDef tu fill:#f6c177,stroke:#8a5a00,color:#3a2406;
```

Es el mismo camino `planificar → ejecutar → revisar → auditar → fusionar` que
harías a mano — el autopilot solo te mueve a sus extremos. Con `--fullauto`,
`ship-roadmap` también se encarga de los merges, bajo suelos de seguridad
innegociables.

Los ejes de revisión son **autocontenidos**: el pack de revisión interno incluido
cubre código, seguridad, verify, deuda, diseño, a11y, marca, rendimiento y SEO en
cualquier agente. Los extras específicos de plataforma (una skill de framework, un
linter del stack) son opcionales — `review-change` y `product-audit` los ejecutan
**además**, nunca como dependencia. Ver `docs/workflow/RECOMMENDED_SKILLS.md`.

> **¿Actualizas desde una instalación anterior?** Mira
> [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md) — se renombraron tres
> skills, así que vuelve a añadirlas para actualizar + borra las tres carpetas
> antiguas.
>
> **Versionado.** Cada skill se versiona de forma independiente (`version:` en su
> frontmatter); los cambios se registran en [`CHANGELOG.md`](CHANGELOG.md).
> Actualiza con `npx skills update`.

## Modelo y esfuerzo recomendados

**Esta sección documenta la rama `#claude`** —
`npx skills add gtrabanco/agentic-workflow#claude`. La **rama por defecto**
(`main`, con alias `#inheritance`) no lleva nada de esto: cada skill
simplemente hereda el modelo y el effort que ya use tu sesión de agente, así
que no hay nada que configurar ni que pueda caducar.

En la rama `#claude`, cada skill **fija su modelo y su esfuerzo** en el
frontmatter (tabla abajo), tomados de
[`docs/workflow/model-routing.yml`](docs/workflow/model-routing.yml). El
modelo usa un alias de tier flotante (`opus`/`sonnet`/`haiku`) que se auto-actualiza
a la última versión — así no caduca. Ambos aplican solo durante el turno de esa
skill; tu modelo/esfuerzo de sesión vuelven después. **Tú mandas:** para cambiarlos,
edita `model-routing.yml` (la fuente que lee la CI para reconstruir la rama
`claude` — nunca edites el frontmatter de la rama `claude` directamente, se
sobrescribe con force-push en cada cambio a `main`).

**En agentes distintos de Claude Code, o en la rama por defecto**, estos tiers
no aplican — y está cubierto: toda skill de cara al usuario incluye una sección
**Portability** con fallbacks explícitos (sin menú slash → seguir el `SKILL.md`
objetivo en una conversación nueva; sin tiers de modelo → el modelo más fuerte
para planificar/revisar/auditar, uno más barato para ejecutar; sin
`/loop`/subagentes → re-invocación manual guiada por el bloque de cierre
`→ Next:` de cada skill). El workflow es el contrato; los tiers por skill son
una conveniencia de la rama `#claude`.

| Skill            | Tier de modelo | Esfuerzo | Por qué                                                                                                                                                                                                                     |
| ---------------- | -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init-workspace` | Opus           | alto     | bootstrap del proyecto guiado por entrevista + adaptación                                                                                                                                                                   |
| `plan-feature`   | Opus           | alto     | router + planificación: sus pasos internos de entrevista/scoping corren **en su turno**, así que el router debe llevar el effort (las skills compuestas heredan el effort del turno)                                        |
| `plan-fix`       | Opus           | alto     | scoping de arquitecto + análisis de riesgo                                                                                                                                                                                  |
| `execute-phase`  | Sonnet         | medio    | implementación mecánica según el SPEC — una fase o de una pasada (Opus si la lógica es sutil)                                                                                                                               |
| `review-change`  | Opus           | alto     | orquestación de revisión adaptativa a la plataforma + síntesis                                                                                                                                                              |
| `audit-pr`       | Opus           | alto     | juicio de aptitud de fusión de todo el PR                                                                                                                                                                                   |
| `product-audit`  | Opus           | máx      | barrido multi-eje de todo el producto + propuestas (effort máx para el barrido más amplio)                                                                                                                                  |
| `audit-docs`     | Sonnet         | medio    | comprobaciones cruzadas mayormente mecánicas (Opus para auditorías profundas)                                                                                                                                               |
| `triage-issue`   | Opus           | alto     | verificar disparadores contra el código; decisión con criterio                                                                                                                                                              |
| `log-session`    | Sonnet         | medio    | resumen estructurado, no criterio — deliberadamente el tier barato, nunca Opus (los hooks de `.claude/` hacen la captura mecánica gratis)                                                                                   |
| `workflow-status`| Sonnet         | medio    | lectura mecánica de estado + cálculo de cierres de dependencias — un sensor, nunca juicio                                                                                                  |
| `generate-docs`  | Sonnet         | medio    | resumen estructurado de un diff en páginas de guía; el grafo lo genera tooling, nunca lo infiere el modelo (Opus nunca es necesario)                                                       |
| `ship-roadmap`   | Opus           | alto     | el conductor del autopilot: compone en su turno las skills de planificación/revisión/auditoría (mismo tier) y delega la implementación a subagentes Sonnet — el juicio se mantiene fuerte, los tokens masivos salen baratos |

> Las 13 skills internas no se seleccionan directamente. Como se componen **dentro
> del turno del caller**, heredan su modelo/effort (el `model`/`effort` de una skill
> se fija al inicio del turno) — los valores de su frontmatter
> (`review-implementation`, `plan-feature-interview`, `plan-feature-from-issue`,
> `review-code`, `review-security` alto; `plan-feature-scaffold` y el resto del pack
> de revisión medio) son defaults para una ejecución directa, y por eso los
> orquestadores `plan-feature` y `review-change` llevan `high`.
>
> Regla general: **planificar, decidir, revisar y auditar → Opus** (alto, o máx para
> el barrido de todo el producto); **ejecución mecánica → Sonnet, medio** (sube a Opus
> si la lógica es sutil).

### Equivalencia de modelos (modelos no-Claude / de libre inferencia)

Los tiers de Claude de arriba (la rama `#claude`) marcan un listón de
referencia, pero nada en el workflow depende de ellos — las skills son
agnósticas del modelo por diseño (ese es justo el sentido de la rama por
defecto). Si estás en la rama por defecto, esta tabla es solo una guía mental
de qué "tipo" de modelo apuntar tú mismo a cada skill; si instalaste
`#claude` de todos modos y quieres cambiar sus tiers fijados por los de otro
proveedor, edita `docs/workflow/model-routing.yml`:

| Default Claude | Clase de capacidad | Úsalo para |
|---|---|---|
| Opus + `high`/`max` | **Razonamiento frontier** — el modelo más fuerte que tengas, con modo razonamiento/thinking activado | planificar, revisar, auditar, triage, el gate de fusión |
| Sonnet + `medium` | **Workhorse medio** — un buen modelo de código con ajustes por defecto | ejecución mecánica según SPEC, checks de docs, logs de sesión |
| Haiku | **Pequeño y barato** — cualquier modelo ligero y rápido | recolección opcional de evidencia tipo grep |

**Recomendaciones concretas** (open-weight, a **julio de 2026** — este panorama
se mueve rápido; contrástalo con un leaderboard actual antes de fijar nada):

- **Razonamiento frontier** (⇔ Opus + `high`/`max`): **DeepSeek V4** (lidera
  LiveCodeBench/Codeforces entre los abiertos), **Kimi K2.6** (el más fuerte en
  coding agéntico/a nivel de repo y tool use), **GLM-5.x / GLM-4.7 Thinking**,
  **Qwen3 235B-A22B** — en modo razonamiento/thinking. Equivalentes cerrados
  no-Claude: el tier de razonamiento superior de GPT / Gemini.
- **Workhorse medio** (⇔ Sonnet + `medium`): **DeepSeek V3.2** (la mejor
  relación calidad/precio vía API), **Qwen3-Coder / Qwen3 32B**, **GLM-5.1**, o
  cualquiera de los frontier con el modo razonamiento apagado.
- **Pequeño y barato** (⇔ Haiku): **Qwen3 4–14B**, **Mistral Small 3.1**,
  **Gemma 3 27B**, **Phi-4-mini** — corren en local, suficientes para trabajo
  tipo grep.

#### <img src="docs/assets/nan-cloud.svg" alt="Logo de NaN Cloud" width="20" height="19"> Ejecutar sobre [NaN.builders](https://cloud.nan.builders/r/7GK06FX8)

[NaN Cloud](https://cloud.nan.builders/r/7GK06FX8) sirve la frontera open-weight
([catálogo completo](https://nan.builders/docs/models): GLM-5.2 ~753B MoE ·
Mimo V2.5 310B · DeepSeek V4 Flash 284B · Qwen3.6 35B · Gemma4 26B) con toggle
de **Thinking** y control de **effort** por petición (Minimal → Max), que mapea
1:1 con los tiers de este workflow. Nuestros picks por skill:

| Skill | Modelo NaN | Thinking | Effort |
|---|---|---|---|
| `init-workspace`, `plan-feature`, `plan-fix`, `review-change`, `audit-pr`, `triage-issue` | **GLM-5.2** | on | High |
| `product-audit` | **GLM-5.2** | on | **Max** |
| `ship-roadmap` (conductor) | **GLM-5.2** | on | High |
| `execute-phase` (+ la ejecución de ship-roadmap), `audit-docs`, `bump-skill` | **Qwen3.6** | off | Medium |
| `log-session`, recolección de evidencia | **DeepSeek V4 Flash** | off | Low |

Alternativas: lógica de implementación sutil → sube `execute-phase` a
GLM-5.2/High; **Mimo V2.5** (familia distinta) revisando código escrito por
Qwen añade independencia del revisor; **Gemma4** vale para el tier pequeño.
Whisper, Kokoro, Rerank, Qwen3 Embedding y Flux 2 Klein son modelos de
audio/retrieval/imagen — el workflow no los usa. Regístrate con
[este enlace de referido](https://cloud.nan.builders/r/7GK06FX8).

**Si GLM-5.2 está caído — escalera de fallback:**

| # | Fallback | Config | Vale para | Nunca para |
|---|---|---|---|---|
| 1 | **Mimo V2.5** (310B, reasoning, 1M ctx) | Thinking on, High (Max para `product-audit`) | **todos** los huecos de GLM-5.2, incluidos `audit-pr` y `product-audit`; como revisor de familia cruzada incluso añade independencia | — |
| 2 | **Qwen3.6** (35B) | Thinking on, High | `plan-feature`, `plan-fix`, `init-workspace`, `triage-issue`, conductor de `ship-roadmap` — su salida la re-comprueban después revisión y auditoría | `audit-pr` · `product-audit` · revisar código que el propio Qwen3.6 escribió (el ≥ se cumple, la independencia no) |
| 3 | **DeepSeek V4 Flash** (284B·21B activos) | Thinking on, High | planificación/triage de último recurso si 1–2 caen | cualquier veredicto que gatee un merge |
| — | **Gemma4** (26B) | — | solo tier pequeño mecánico | juicio, jamás |

**Los dos veredictos que gatean merges solo corren con calidad de tier 1:**
`audit-pr` y `product-audit` pueden caer a **Mimo V2.5** (effort Max), pero
nunca más abajo — un barrido en un modelo medio devuelve un informe
*aparentemente completo pero superficial*, peor que ningún informe. ¿GLM-5.2
**y** Mimo V2.5 caídos a la vez? → pospón: el humano gatea el merge a mano y el
product-audit espera. Todo lo que ya corre en los tiers Qwen3.6/Flash no se ve
afectado por una caída de GLM-5.2.

**¿Ya estás en la rama por defecto (o en `#inheritance`)?** No hay nada que
quitar — es justo el punto. Cada skill ya **hereda el modelo y esfuerzo de tu
sesión**; el comando de instalación normal te da esto:

```sh
npx skills add gtrabanco/agentic-workflow
```

**¿Prefieres los tiers de Claude fijados por skill?** Instala `#claude` (ver
la nota de cambio incompatible cerca del principio de este README):

```sh
npx skills add gtrabanco/agentic-workflow#claude
```

`effort:` se mapea al presupuesto de razonamiento/thinking de tu modelo (`high` →
razonamiento máximo; `medium` → por defecto; sin ese control → respeta solo la
división fuerte/barato de arriba). Dos invariantes sobreviven a cualquier mapeo:
**nunca revises un cambio con un modelo más débil que el que lo escribió — y
prefiere una familia de modelo distinta a la del autor** (instancias de la
misma familia comparten puntos ciegos de entrenamiento; una familia cruzada
descorrelaciona errores), y **los veredictos de auditoría (el gate de fusión)
van al modelo más fuerte que tengas**. Espera que los modelos más débiles sigan
el workflow correctamente — las skills están escritas como checklists y
formatos de salida fijos — pero con un juicio menos profundo: la disciplina se
mantiene, el techo se mueve.

## Orquestación programática

Toda skill de cara al usuario termina con un **envelope máquina** — un bloque
JSON fijo y cercado (state, unit, phase, PR, findings, blockers, orden de
construcción de dependencias, siguiente comando recomendado + pista de tier de
modelo). Un driver externo — un bucle de shell, CI, tu propio programa — lo
parsea e invoca la siguiente skill con el modelo que tú elijas en cada paso.
Es la sustitución neutral de proveedor del `/loop` y los subagentes de Claude
Code: el mismo bucle que `ship-roadmap` ejecuta dentro del agente, alojado
fuera de cualquier agente. `workflow-status` es el sensor de solo lectura que
reporta el árbol de dependencias completo y qué es arrancable. Protocolo,
máquina de estados y esqueleto de driver:
**[`docs/workflow/ORCHESTRATION.md`](docs/workflow/ORCHESTRATION.md)**. Para
drivers JS/TS, **[`@gtrabanco/agentic-workflow-schema`](packages/agentic-workflow-schema/)**
(npm) trae los tipos, el JSON Schema y `parseEnvelope()` implementando el
contrato de parseo — publicado automáticamente por CI en cada cambio del esquema.

## Cómo usarlas

Tutorial completo en **[`docs/workflow/`](docs/workflow/README.md)**. En resumen:

### Construir una feature

```
/plan-feature "<tu idea>"     # o  /plan-feature <N> (issue)  ·  /plan-feature --next (siguiente elemento del roadmap)
        → el router detecta idea / issue / slug acotado → entrevista · análisis del issue · scaffold
        → rellena el SPEC + PLAN + TASKS + … y registra la entrada en el roadmap
/execute-phase <NN> <phase>     # una fase cada vez, verificada por el gate, un commit cada una
        → checkpoint de revisión recomendado cada 2 fases (obligatorio al final)
        → una unidad terminada siempre abre su PR + pasa a `done` (construida, no mergeada)
/review-change                  # obligatorio: revisiones aplicables, clasificadas; no-fix-now → triage-issue
/audit-pr                       # gate de fusión: listo o bloqueantes (nunca fusionar con docs pendientes)
        → el humano fusiona
```

Ver **[`docs/workflow/FEATURE_WORKFLOW.md`](docs/workflow/FEATURE_WORKFLOW.md)**.

### Gestionar un issue

```
/triage-issue <N>
   → lee el disparador "cuándo arreglar" del issue, lo verifica contra el código actual
   → fix-now  → plan-fix → execute-phase --fix
     promote  → plan-feature   (el router toma el issue → SPEC acotado)
     postpone → comentario con fecha, dejar abierto (sin trabajo inline)
     wontfix  → proponer cierre
```

Ver **[`docs/workflow/ISSUE_WORKFLOW.md`](docs/workflow/ISSUE_WORKFLOW.md)**.

### Revisar, auditar y clasificar

```
/review-change                  # ejecuta las revisiones correctas por plataforma + clasifica → una tabla + comprobaciones manuales
/audit-pr                       # ¿está ESTE PR listo para fusionar?  listo para fusionar o bloqueantes
/product-audit                  # ¿en qué punto está todo el producto?  issues + propuestas de roadmap
/audit-docs                     # ¿se han desviado las docs del código / roadmap?
```

Ver **[`docs/workflow/REVIEW_AND_CLASSIFY.md`](docs/workflow/REVIEW_AND_CLASSIFY.md)**.

### Construir la app entera (autopilot)

```
/ship-roadmap                   # UNA entrevista (producto, features, stack, arquitectura, autonomía, presupuesto)
        → funda el proyecto si hace falta, escribe el roadmap completo, fija la política del run
/loop /ship-roadmap --continue  # el bucle entrega el roadmap feature a feature (añade --fullauto para auto-fusionar)
        → plan → execute → review → PR → audit → (tu merge) → siguiente feature → … → informe final
```

Solo reapareces en los merges (por defecto) y en el informe final.

### Retomar entre sesiones

```
/log-session                    # antes de /clear o de cerrar: añade a docs/LOGS.md lo que hiciste + el siguiente paso
```

El `template/` trae hooks de Claude Code gratuitos y opt-in (`template/.claude/`)
que añaden una entrada mecánica automáticamente en cada `/clear` y salida, y
pueden reinyectar la última entrada al arrancar para retomar en frío — sin
modelo, sin coste de tokens en la captura.

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
# Desde la raíz del repositorio DESTINO — instala todas las skills.
# Rama por defecto: agnóstica de modelo, cada skill hereda el modelo y
# esfuerzo de TU sesión. ¿Usas Claude Code y quieres los tiers ajustados por
# skill que este proyecto traía por defecto antes de v3? Añade #claude — ver
# la nota de cambio incompatible más arriba.
npx skills add gtrabanco/agentic-workflow
npx skills add gtrabanco/agentic-workflow#claude          # tiers optimizados para Claude

# Elige skills concretas, o un agente concreto:
npx skills add gtrabanco/agentic-workflow --skill plan-feature --skill triage-issue
npx skills add gtrabanco/agentic-workflow --agent claude-code --agent cursor

# Instala para el usuario actual (global) en vez de para el proyecto actual:
npx skills add gtrabanco/agentic-workflow --global

# Gestiónalas después:
npx skills list
npx skills update
npx skills remove plan-feature

# ¿Ya tenías fijado #inheritance antes de v3? Sigue funcionando — se mantiene
# como alias exacto de la rama por defecto (ahora agnóstica de modelo):
npx skills add gtrabanco/agentic-workflow#inheritance

# Pinear una versión: instala desde un release etiquetado (o cualquier tag/rama) con #<ref>:
npx skills add gtrabanco/agentic-workflow#release-2026-07-02
#   …luego `npx skills experimental_install` restaura el conjunto exacto desde skills-lock.json.
#   Ver CHANGELOG.es.md → "Instalar y pinear una versión" para cómo funciona el pinning.
```

### Instalación en Hermes Agent (desktop y terminal)

Hermes solo escanea **`~/.hermes/skills/`** (su "source of truth") más los
`external_dirs` que añadas en `~/.hermes/config.yaml` — **no** escanea las
rutas de proyecto que la CLI `skills` escribe por defecto (`./.hermes/skills/`,
`./.agents/skills/`). Por eso un install de proyecto "no se detecta". La app de
escritorio y la terminal comparten el mismo mecanismo. Las subcarpetas de
categoría (`skills/devops/<skill>/`) son opcionales — las carpetas planas
`<skill>/SKILL.md` se detectan sin problema.

```sh
# Instalar (Hermes ignora model:/effort: de todas formas, así que la rama por
# defecto — agnóstica de modelo, hereda el de tu sesión de Hermes — es la
# elección correcta aquí, no #claude):
npx skills add gtrabanco/agentic-workflow --agent hermes-agent --global -y
#   → copia cada skill a ~/.hermes/skills/<skill>/  ✔ detectado por desktop y terminal

# Actualizar después — repite el add por agente, NO `skills update`:
npx skills add gtrabanco/agentic-workflow --agent hermes-agent --global -y
npx skills add gtrabanco/agentic-workflow#claude --agent claude-code --global -y   # si también instalas global para Claude Code
#   Por qué: el lockfile global guarda UN ref por nombre de skill (gana el último
#   install), así que un `skills update --global` a ciegas puede reapuntar la
#   copia de todos los agentes al mismo ref — repetir cada add refresca cada
#   copia desde su propio ref. Luego arranca una sesión NUEVA de Hermes (/reset
#   en terminal o reinicia la app) — las skills cargan al inicio de sesión;
#   --now invalida la caché de prompt (tokens extra).
```

Alternativa por proyecto: mantén el install local del proyecto y apunta Hermes
a él en `~/.hermes/config.yaml`:

```yaml
skills:
  external_dirs:
    - /ruta/a/tu-proyecto/.agents/skills
```

(En colisiones de nombre gana `~/.hermes/skills/`; los directorios inexistentes
se ignoran en silencio.) Elige el modelo de sesión según la
[tabla de equivalencia](#equivalencia-de-modelos-modelos-no-claude--de-libre-inferencia)
— en NaN.builders, según los picks de arriba.

**Invocación:** en Hermes, `/<nombre>` carga **bundles**, no skills
individuales — `/execute-phase` devuelve `error: not a quick/plugin/skill
command` aunque la skill aparezca como enabled. Tres vías que funcionan:

```sh
# 1. Una vez: crea un bundle → /workflow pasa a ser el punto de entrada slash
hermes bundles create workflow \
  -s init-workspace -s plan-feature -s plan-fix -s execute-phase \
  -s review-change -s audit-pr -s product-audit -s audit-docs \
  -s triage-issue -s log-session -s ship-roadmap \
  -d "agentic-workflow: plan → execute → review → audit → merge"
#    después, en cualquier sesión:  /workflow execute-phase --fix #243

# 2. Terminal: precarga skills para una sesión
hermes chat -s execute-phase

# 3. Cualquier sesión, sin setup: lenguaje natural — las skills se seleccionan
#    por descripción: "use the execute-phase skill to implement fix #243"
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

## Skills extra opcionales

El workflow no necesita **nada más allá de este repo** — el pack de revisión
interno cubre todos los ejes de revisión en cualquier agente.
`docs/workflow/RECOMMENDED_SKILLS.md` lista **extras opcionales** que pueden
afinar ejes concretos cuando tu agente los tiene (p. ej. `karpathy-guidelines`,
`simplify`, el conjunto `engineering:*`) y —crucialmente— cuáles **omitir** según
el proyecto (p. ej. skills de diseño para un programa de terminal, `claude-api`
si no hay features con LLM). Los extras se funden en las mismas tablas de
revisión; un extra ausente nunca es un hueco.

## Proyectos construidos con este workflow

| Proyecto                                                    | Notas                                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| [gtrabanco/ship-lab](https://github.com/gtrabanco/ship-lab) | CLI json2csv — construido de punta a punta con el autopilot `ship-roadmap` |
| [gtrabanco/bingo-ev](https://github.com/gtrabanco/bingo-ev) | Empezado con vibecoding, migrado al workflow cuando ya funcionaba          |
