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

> **⚠️ Cambio incompatible (v3, 2026-07-04):** la rama por defecto (`main`)
> ahora es **agnóstica de modelo** — ninguna skill lleva frontmatter
> `model:`/`effort:`; cada skill hereda el modelo y el effort que ya use tu
> sesión de agente. **Si usas Claude Code y quieres los tiers Opus/Sonnet +
> effort ajustados por skill que este proyecto traía por defecto antes de v3,
> instala la rama `#claude`** (`...#claude` abajo) — el comando de
> instalación normal ya no te da esos tiers. `#inheritance` sigue funcionando,
> mantenida como alias exacto de la rama por defecto (ahora agnóstica de
> modelo). Ver [`docs/workflow/MIGRATION.md`](docs/workflow/MIGRATION.md).

```sh
# Última (sigue la rama por defecto del repo — agnóstica de modelo, hereda el
# modelo/effort de tu sesión):
npx skills add gtrabanco/agentic-workflow

# ¿Usas Claude Code y quieres los tiers optimizados y ajustados por skill?
npx skills add gtrabanco/agentic-workflow#claude

# ¿Ya tenías fijado #inheritance antes de v3? Sigue funcionando, sin cambios:
npx skills add gtrabanco/agentic-workflow#inheritance

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

### Paquetes npm complementarios

#### [`@gtrabanco/agentic-workflow-schema`](packages/agentic-workflow-schema/)
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.0.1 | 2026-07-05 | parche | `validateEnvelope()` ahora comprueba todos los enums/tipos que declara el JSON Schema (`unit.type`, `pr.state`/`.ci`, `gates.verification`, `blockers[].kind`/`.scope`, tipos de los elementos de arrays) — antes era más laxo que `envelope.schema.json`, así que un valor malformado como `blockers[].scope: "planet"` pasaba en silencio. Tests añadidos para la ruta de fallo de validación estructural a través de `parseEnvelope()` y para fences con CRLF. La CI (`publish-schema.yml`) migró a Bun para instalar/testear (`bun install --frozen-lockfile`; se elimina `package-lock.json`, `bun.lock` es el único lockfile) — npm se mantiene solo para el paso final `npm publish --provenance`. Se añadió `LICENSE` dentro del directorio del paquete (el auto-include de npm solo recoge una LICENSE de la propia carpeta del paquete publicado). El ejemplo de importación del JSON Schema en el README se corrigió para funcionar en el `engines.node: ">=18"` declarado (antes solo funcionaba en Node 20.10+/22). |
| 1.0.0 | 2026-07-05 | — | Primer release publicado. Tipos, JSON Schema y `parseEnvelope()`/`validateEnvelope()`/`isTerminal()`/`isRunHalt()` para el envelope máquina de agentic-workflow. |

### Sesión

#### `log-session`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación (snippet de system-prompt inyectado por el driver + bucle de reparación); `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.4.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. El siguiente paso registrado viaja en el envelope para que un orquestador retome desde el journal. |
| 1.4.0 | 2026-07-04 | menor | `main` ya no lleva frontmatter `model:`/`effort:` (trasladado a `docs/workflow/model-routing.yml`, fuente de verdad de la rama `#claude`); el paso 7b ahora apunta a ese archivo en vez de a un frontmatter que ya no existe en `main`; la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.3.0 | 2026-07-03 | menor | Casilla de precedencia de idioma de artefactos añadida al contrato de turno. |
| 1.2.0 | 2026-07-03 | menor | Contrato de turno al inicio (entrada realmente AÑADIDA con datos git exactos; ninguna entrada pasada editada; → Next: impreso al final). |
| 1.1.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| 1.1.0 | 2026-07-02 | minor | Añadida la sección Portability (sin hooks → esta skill es el único escritor del journal); referencias a `/clear` generalizadas al reset de contexto de cualquier agente. |
| 1.0.1 | 2026-06-27 | parche | Cierre normalizado al bloque canónico `→ Next:` |
| 1.0.0 | 2026-06-19 | — | Nueva skill de diario de sesión. Añade una entrada estructurada a `docs/LOGS.md` (resumen, archivos, decisiones + por qué, siguiente paso) bajo demanda; `model: sonnet` (barato por diseño). Incluye hooks gratuitos y opt-in en `template/.claude/`: captura mecánica en SessionEnd + marcador en SessionStart, y restauración de contexto opt-in en SessionStart — todos sin modelo |

### De cara al usuario

#### `generate-docs`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.0.0 | 2026-07-05 | — | Skill nueva: documentación de desarrollador incremental, guiada por diff, escrita en el sitio de docs del propio proyecto mediante un adaptador descubierto (declaración → Starlight → Docusaurus → fallback markdown; NOT-CONFIGURED → NEEDS_INPUT, nunca adivina). Forma de página fija + frontmatter de procedencia (`generated-by`/`source-unit`/`updated`), mapa de conocimiento solo desde un comando determinista declarado por el proyecto (el modelo nunca infiere aristas), export opt-in `--review` de informes de `review-change`, paso de verificación (build de docs o chequeo de enlaces). Nunca crea el sitio, nunca edita código, nunca commitea. |

#### `workflow-status`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.5.1 | 2026-07-12 | parche | Precisión de redacción en la guarda de no-progreso (hallazgo de revisión en la PR del fix #51): la nota ahora nombra el estancamiento como **sospechoso**, no como una escritura perdida confirmada — la guarda no puede distinguir, solo con el envelope, si el comando recomendado se ejecutó y su escritura se perdió, o si nunca se ejecutó. Sin cambio de comportamiento. |
| 1.5.0 | 2026-07-12 | menor | Fix #51: guarda de no-progreso sobre el hint `--last-envelope` de recuperación de caídas — cuando el `next.recommended` del hint apuntaba a `/plan-feature <slug>`/`/design-feature <slug>` y esta ejecución sigue clasificando a esa misma unidad en el mismo estado previo al avance (`defined`/`idea`), emite una nota en `workflow_observations` nombrando la sospecha de escritura de estado perdida, en vez de repetir silenciosamente la misma recomendación. El invariante de solo-lectura no cambia; la recomendación en sí no se ve afectada. |
| 1.4.0 | 2026-07-12 | menor | Endurecimiento en tiempo de emisión (#52): comprobaciones del contrato de turno para que `next.recommended` sea no-vacío y esté correctamente escalonado, `design_candidates[].next` enrute siempre a `/design-feature`, `recommendations.product_audit`/`next.tier` provengan de las nuevas comprobaciones/tabla mecánicas, y el envelope se emita en cada invocación (incluidos los seguimientos en la misma sesión) tras autocomprobarse contra el esquema empaquetado. Se añaden recordatorios de forma del envelope (`enum` de `blockers[].scope`, incompatibilidad run/OK, `dependencies.unmet` como array de strings) y una tabla fija comando→nivel en `## Machine envelope`. El paso 4 del proceso mapea un estado de roadmap desconocido a `idea` por defecto (p. ej. `scheduled → idea`, referencia cruzada a `#51`); el paso 10 (product-audit) se reescribe como lista mecánica de dos condiciones sin excepción inventada. Un nuevo paso del proceso muestra el backlog de issues abiertos sin triar como `detail.untriaged_issues: {count, oldest_open}` (sin cambio de esquema — `detail` es de forma libre). |
| 1.3.0 | 2026-07-11 | menor | Nuevo campo de envelope `detail.urgent`: issues abiertos con las etiquetas `urgent`/`fix-next` (leídas solo del objeto JSON `labels`, nunca del título/cuerpo/comentarios) junto a los hechos de interrumpibilidad de la unidad en curso (fase, sucio/limpio, tareas hasta el próximo límite de commit) — reutilizados del reconcile existente de progreso de fase/recuperación de caídas, sin nuevas llamadas a git. Solo presencia, reporta hechos, nunca decide pausa-vs-terminar. |
| 1.2.0 | 2026-07-09 | menor | Lee la máquina de estados de cinco valores del roadmap (`idea / defined / planned / in-progress / done`): un nuevo paso de clasificación separa las unidades en `design_candidates` (filas `idea`, siguiente `/design-feature`) frente a `startable_now` (estado ≥ `defined`, dependencias cumplidas, comando siguiente según el estado exacto); nuevo campo de envelope de nivel superior `design_candidates` junto a `startable_now`/`blocked_units`; las filas legacy en `planned` plano con la mitad de producto del SPEC completa se tratan como `defined`+`planned` según `MIGRATION.md`. El resumen humano gana una línea de candidatos a diseño. |
| 1.1.1 | 2026-07-05 | parche | Fold de revisión sobre la recuperación de caídas de 1.1.0 (sin publicar): precedencia explícita del estado del envelope con varias ramas (`AMBIGUOUS` > `RESUMABLE` > `CLEAN`, gana el peor); la comprobación de commits sin push ahora protege el caso sin upstream (justamente el caso de crash-nunca-pusheado) en vez de fallar en `git log @{u}..`; el envelope de ejemplo ya muestra en `detail` la clave `crash_recovery` que la prosa ya exigía. |
| 1.1.0 | 2026-07-05 | menor | Recuperación de caídas: cada invocación clasifica los turnos interrumpidos desde la verdad del sustrato (ramas de unidad sucias/sin push, libro de fases vs commits) en un veredicto cerrado — `CLEAN`→OK, `RESUMABLE`→CONTINUE con el comando de reanudación, `AMBIGUOUS`→NEEDS_INPUT con opciones — en un sub-bloque `CRASH RECOVERY` fijo. Nuevo hint `--last-envelope <json|ruta>` (con fallback de pegarlo en el mensaje documentado): se contrasta con el estado recalculado, nunca es autoritativo. Sin cambio en el esquema del envelope — solo estados existentes. |
| 1.0.0 | 2026-07-05 | — | Nuevo sensor de solo lectura para orquestación programática: árbol de dependencias completo de features/fixes (transitivo, cumplido/incumplido), unidades arrancables con orden de construcción, PRs abiertas + estado de auditoría, hallazgos pendientes de triaje, recomendación de product-audit — todo en un envelope máquina. |

#### `ship-roadmap`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.2.1 | 2026-07-13 | parche | Portability gana una barrera de concurrencia del provider: limita los subagentes/ejecutores headless paralelos al límite documentado de peticiones paralelas por API key del provider (dejando un hueco para el conductor), y reduce el paralelismo ante un 429 en vez de reintentar a fan-out completo. Solo guía — sin cambio de etapas ni de contrato. |
| 2.2.0 | 2026-07-11 | menor | SELECT gana una nueva prioridad principal: lee primero `detail.urgent` de `workflow-status` (solo etiquetas) — un issue `fix-next` abierto salta a la cabeza de la cola (sin interrumpir); un issue `urgent` abierto corre la rúbrica canónica de pausa-vs-terminar en `docs/workflow/ORCHESTRATION.md` (referenciada, nunca duplicada) contra los hechos de interrumpibilidad de la unidad en curso, `INTERRUPT_NOW` la aparca, `FINISH_FIRST` encola el fix para la siguiente iteración. Lista de prioridades renumerada. |
| 2.1.0 | 2026-07-10 | menor | Etapa REVIEW: para features `L`/marcadas como sensibles, cada invocación de `review-change` (checkpoint o revisión final) ahora corre con `--adversarial 2` — un piso obligatorio, no supervisado, deliberadamente **no** alineado con el checkpoint interactivo advisory de `review-change`. XS/S/M no sensible sin cambios (revisor único). |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación (snippet de system-prompt inyectado por el driver + bucle de reparación, ver `orchestration-envelope`); `workflow-status` sigue siendo el único emisor en línea. La prosa del bucle de driver se reescribe para referenciar el envelope inyectado de forma genérica. Ver `docs/workflow/MIGRATION.md`. |
| 1.11.0 | 2026-07-09 | menor | Cumple con la máquina de estados del roadmap en vez de eximirse: la fundación se documenta como **diseño en lote** (las rondas 2–4 de la entrevista son las respuestas de definición de producto), así que la fundación escribe las filas de las features en `idea` (la feature 01, scaffoldeada por la fundación, aterriza directamente en `planned`). Nueva etapa **DESIGN**: una unidad `idea`/`defined` en mitad del run recibe diseño JIT componiendo `design-feature` + `plan-feature-scaffold` en el mismo turno, **derivado estrictamente del registro bloqueado `SHIP_DECISIONS.md` — sin preguntas nuevas** — promoviendo `idea → defined → planned` antes de PLAN. No diseñable desde el registro → se aparca (`blockers[]` tipo `undesignable`, `needs_input` registra el vacío), `state` se mantiene en `CONTINUE` (un aparcado por unidad, no una parada del run); SELECT pasa a la siguiente unidad arrancable. Tablas de secuencia de etapas, enrutado de modelos y condiciones de parada actualizadas para incluir DESIGN. |
| 1.10.0 | 2026-07-05 | menor | Autopilot neutral de driver: `/loop`, un orquestador externo (enrutado por envelope) o la re-invocación manual son drivers equivalentes de primera clase; EXECUTE funciona sin subagentes con una invocación headless por fase; cada fin de iteración dice POR QUÉ (parada normal de una etapa vs el tope exacto alcanzado). Más el envelope máquina (mapeo banner ↔ state). |
| 1.9.0 | 2026-07-04 | minor | Las issues del barrido + PRs de subagentes + comentarios de triaje usan `--body-file` (Markdown), nunca `--body`/heredoc inline; guardrail añadido. |
| 1.8.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.8.0 | 2026-07-04 | menor | Barrido de issues tras la última feature: inventaría issues abiertas + el residuo documentado del propio run (known-issues, trade-offs, hallazgos pospuestos), lo triagea todo y entrega las issues fix-now por las mismas etapas — `SHIP: COMPLETE` exige el barrido; check de cierre limpio (ninguna etapa termina con árbol sucio o commits sin push); AUDIT imprime la URL del PR junto al veredicto. |
| 1.7.0 | 2026-07-03 | menor | La etapa PR no está completa hasta que la fila del roadmap lleva su número de PR enlazado y la URL se imprime en la salida de la iteración. |
| 1.6.0 | 2026-07-03 | menor | Casilla de precedencia de idioma de artefactos añadida al contrato de turno. |
| 1.5.0 | 2026-07-03 | menor | Contrato de turno al inicio (exactamente una etapa avanzada + una línea de run-log; suelos respetados; → Next:/banner impreso al final). |
| 1.4.0 | 2026-07-03 | menor | SELECT es ahora una lista de prioridad fija: primero fixes fix-now bloqueantes, luego etapas en curso, luego features con el cierre de dependencias fusionado transitivamente (estados inconsistentes → SHIP: STOPPED); el autopilot nunca pasa --force. |
| 1.3.0 | 2026-07-02 | menor | La Ronda 5 de la entrevista fija el workflow de git del proyecto (branches por defecto / worktrees); nota de equivalencia de modelos. |
| 1.2.0 | 2026-07-02 | minor | Añadida la sección Portability: equivalentes manuales de `/loop`, subagentes, el menú slash y el enrutado de modelos en agentes distintos de Claude Code. |
| 1.1.1 | 2026-06-27 | parche | El cierre por iteración y el del informe final usan la forma canónica `→ Next:`; consistencia de nombrado de fases (`P1, P2, …`) |
| 1.1.0 | 2026-06-19 | menor | Alineado a done-al-abrir-PR: el flip a `done` viaja en el commit de la fase PR; `SHIP: COMPLETE` exige los PRs **mergeados** (no solo `done`); los dependientes se desbloquean al **merge**; REVIEW triagea cada hallazgo no-fix-now |
| 1.0.0 | 2026-06-10 | — | Nuevo autopilot. Una entrevista inicial → funda el proyecto → entrega el roadmap feature a feature vía `/loop` (plan → execute → review → PR → audit). Merge humano por defecto; `--fullauto` con doble llave y suelos de seguridad fail-closed; registro de decisiones commiteado + log de run sin trackear |

#### `execute-phase`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.1.0 | 2026-07-11 | menor | Fix #35: las unidades de pase único (features XS/S y fixes) ahora son **por fases** — cuando el SPEC lleva `## Phases` (emitido por `plan-fix` 2.1.0 / `plan-feature-scaffold` 1.8.0), se ejecuta **una fase por invocación** (`[P<k>]` opcional, por defecto la primera fase con tareas sin marcar), marcando los checkboxes del SPEC como ledger de ejecución; la fase final `Hardening & PR` ejecuta la cadena de cierre (flip de estado, push, PR, commit del enlace, push) en su propia invocación — la cadena que los modelos débiles truncaban al final del turno de implementación. Un SPEC sin `## Phases` ejecuta el pase único legacy sin cambios (el fallback que mantiene esto como menor). Las dos cabeceras "this is the last step" reescritas a la forma de fase final. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación (snippet de system-prompt inyectado por el driver + bucle de reparación, ver `orchestration-envelope`); `workflow-status` sigue siendo el único emisor en línea. La descripción del orquestador externo en la ejecución por lotes ahora referencia el envelope inyectado de forma genérica en vez de una emisión inline. Ver `docs/workflow/MIGRATION.md`. |
| 1.16.0 | 2026-07-10 | menor | Nueva regla **una fase = una sesión**, colocada justo antes de la sección de ejecución por lotes: nunca ejecutar dos fases en una misma conversación con un modelo no-frontera — el patrón por lotes de `/loop` ya limpia y reinvoca por fase; esta es la regla que aplica, emparejada con el fallback manual de reinvocación ya existente en Portability. |
| 1.15.0 | 2026-07-09 | menor | El gate de dependencias gana una **precondición de estado propio**, comprobada tras cumplir el cierre de dependencias y aún antes de cualquier edición: una unidad cuya fila del roadmap sea `idea` PARA y redirige a `/design-feature <slug>`; `defined` PARA y redirige a `/plan-feature <slug>`; `planned`+ continúa. `--force` salta la PARADA (nunca la comprobación), registrado en `decisions.md`, misma regla que el gate de dependencias. Las filas legacy en `planned` plano con la mitad de producto del SPEC completa se tratan como `defined`+`planned` (sin redirección) según `MIGRATION.md`. Envelope máquina: `BLOCKED` ahora también cubre el gate de estado propio, `blockers[]` tipo `own-status`. |
| 1.14.1 | 2026-07-09 | parche | El invariante de modelo en Portability se extiende: "nunca revises con un modelo más débil — y prefiere una familia de modelo distinta a la del autor" (instancias de la misma familia comparten puntos ciegos de entrenamiento; una familia cruzada descorrelaciona errores). Solo redacción. |
| 1.14.0 | 2026-07-05 | menor | El checkpoint de revisión cada 2 fases es ahora una **recomendación, no una parada obligatoria**: el bloque de cierre recomienda `/review-change` con "continuar a la siguiente fase" como alternativa listada, y el envelope mantiene `state: CONTINUE` en los checkpoints (consultivo) — `READY_FOR_REVIEW` queda reservado a la unidad terminada. La **revisión de fin de unidad sigue siendo obligatoria** (alimenta `audit-pr`), y el gate de dependencias no cambia (sigue bloqueando y exigiendo `--force`). Referencias cruzadas de `review-change` 1.10.1 actualizadas. |
| 1.13.1 | 2026-07-05 | parche | "Reanudar una fase interrumpida" enunciado como contrato explícito: al entrar en una rama con trabajo previo de la fase pedida, reconciliar los ticks de `TASKS.md` contra la evidencia y continuar desde la primera tarea sin marcar (reentrada idempotente — de la que depende el veredicto `RESUMABLE` de `workflow-status`); un libro sin siguiente tarea única → parar e informar, nunca adivinar. El comportamiento ya era práctica del Step 0; ahora está escrito. |
| 1.13.0 | 2026-07-05 | menor | El hand-off de cierre de unidad gana una alternativa `/generate-docs` — impresa solo cuando el mapa de documentación del proyecto declara un bloque `Docs site`; las páginas generadas viajan en el PR de la unidad. |
| 1.12.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. La parada del gate de dependencias y los checkpoints de revisión son ahora legibles por máquina (BLOCKED/READY_FOR_REVIEW); la sección batch gana la alternativa de driver externo a `/loop`. |
| 1.11.0 | 2026-07-04 | minor | Los cuerpos de PR/issue se pasan con `--body-file` (fichero Markdown), nunca `--body`/heredoc inline — arregla los backticks escapados con `\` literales en issues/PRs generados; casilla 4 del contrato de turno + regla en Issue policy; comandos actualizados. |
| 1.10.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.10.0 | 2026-07-04 | menor | Casilla de árbol limpio en el contrato de turno (`git status --porcelain` pegado antes de terminar; las docs cuentan); política de push en dos regímenes (con el PR abierto, cada commit se pushea inmediatamente); ciclo explícito para plegar hallazgos de review/audit (gate → commit → push → árbol limpio, o el plegado no ocurrió); las docs viajan en el commit de la fase. |
| 1.9.0 | 2026-07-03 | menor | Cierre de PR explícito: imprimir la URL del PR en el chat (no todos los agentes muestran PRs abiertas) y registrar `done · #<pr>` (enlazado) en la fila del roadmap/índice de fixes con un commit `docs: link PR` — una fila done sin su enlace de PR es una unidad sin terminar. |
| 1.8.0 | 2026-07-03 | menor | Precedencia de idioma de artefactos fijada (instrucción explícita del usuario > idioma de docs declarado > inglés; el idioma de la conversación nunca decide) — casilla en el contrato de turno + regla en Issue policy. |
| 1.7.0 | 2026-07-03 | menor | Contrato de turno al inicio: check de rama, gate, sha del commit, push+PR (con cuerpo obligatorio) realmente EJECUTADOS y pegados — un turno que termina sin ellos es fallido; el push ocurre exactamente una vez, en el paso del PR. |
| 1.6.0 | 2026-07-03 | menor | Gate de dependencias: el cierre transitivo de `Depends on:` debe estar FUSIONADO antes de trabajar — bloque BLOCKED fijo con la cadena no cumplida y el orden de construcción; nuevo flag `--force` que salta la parada (nunca el check) y registra el override en decisions.md. |
| 1.5.1 | 2026-07-02 | parche | Dos formulaciones condicionales hechas deterministas (traducir-si-no-es-inglés; verificar-y-crear el issue del fix). |
| 1.5.0 | 2026-07-02 | menor | Listas fijas Allowed/Forbidden y checklist de cierre de fase "pass only if" (set mínimo de docs explícito); respeta el workflow de git declarado (branches por defecto — nunca worktrees salvo declaración); nota de equivalencia de modelos. |
| 1.4.0 | 2026-07-02 | minor | Añadida la sección Portability; fallbacks genéricos inline para el hand-off de revisión y alternativa manual a la ejecución por lotes con `/loop`. |
| 1.3.1 | 2026-06-27 | parche | Fases fijadas a `P1, P2, …` (nunca `S1`/"Steps"; normaliza un plan recibido); los bloques de hand-off de revisión se reescriben a la forma canónica `→ Next:` |
| 1.3.0 | 2026-06-19 | menor | Una unidad terminada (single-pass, `--fix`, fase final) **siempre abre su PR** + **pasa a `done` al abrir PR** (construida, no mergeada); el hand-off final a `review-change` ahora es **obligatorio**; la entrada del fix-index se mantiene hasta el merge; imprime el siguiente paso en todos los modos |
| 1.2.0 | 2026-06-09 | menor | Tests primero en fases core/orquestación; P1 commitea los artefactos de planificación aparte; protocolo nunca-commitear-en-rojo (irreparable → `known-issues.md` + parar); regla de divergencia de plan; continuidad por `progress.md` |
| 1.1.2 | 2026-06-09 | parche | Patrón de ejecución por lotes con `/loop` documentado |
| 1.1.1 | 2026-06-05 | parche | `allowed-tools` añadido + comandos de commit/PR imperativos (la skill ahora sí commitea) |
| 1.1.0 | 2026-06-05 | menor | La revisión cada 2 fases pasa de auto-ejecución en turno a **hand-off** (corre en su propio tier) |
| 1.0.0 | 2026-06-05 | — | Primer release versionado |

#### `design-feature`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. También se elimina una referencia colgante a la sección borrada (un puntero cruzado en `NEEDS_INPUT`). Ver `docs/workflow/MIGRATION.md`. |
| 1.1.0 | 2026-07-09 | menor | Ahora **escribe** el estado de la fila del roadmap, no solo lo lee: sellar `## Design status: designed` pone la fila del roadmap de esta feature en `defined` (la transición `idea → defined` que esta skill posee) — añadida en `idea` primero si la fila no existía. `NEEDS_INPUT` deja tanto el marcador como la fila sin cambios. El contrato de turno y "Listo cuando" ganan las casillas correspondientes. |
| 1.0.0 | 2026-07-09 | — | Nueva skill: definición de producto, separada de `plan-feature`. Incorpora la entrevista de idea en crudo y recorre un checklist fijo de **cierre de capacidades** (por entidad: CRUD + transiciones de estado, cada una con UI + API + test, o `n/a: <razón>` explícito; por capacidad: punto de entrada + ACL; por rol: asignado/revocado/visto dónde) hacia la mitad de producto del SPEC + criterios de aceptación, sellando `## Design status: designed`. Hace upsert al reejecutarse (nunca destruye `decisions.md`); `<slug>` sin más revisa y pregunta, `<slug> "<instrucción>"` aplica directamente. |

#### `plan-feature`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 3.1.0 | 2026-07-12 | menor | Fix #51: la rama "`defined` o superior → continuar" de la puerta de redirección ahora es específica por estado — solo `defined` continúa a Routing; `planned` (SPEC + artefactos presentes) **PARA** y remite a `/execute-phase <NN> P1` en vez de re-generar el andamiaje; `in-progress` PARA para reanudar la fase actual; `done` PARA como ya entregado. `--next` ahora apunta a la siguiente entrada **`defined`** (antes `planned`, que ya está con andamiaje). El contrato de turno y "Done when" ganan una casilla que exige releer y confirmar la escritura `defined→planned` antes de terminar el turno. |
| 3.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 2.1.0 | 2026-07-09 | menor | La puerta de redirección ahora se basa en el **estado del roadmap** (la máquina de cinco estados) como señal primaria — estado `defined`+ continúa, `idea`/ausente PARA — en vez del marcador `## Design status` del SPEC. El marcador se conserva solo como **fallback de compatibilidad legacy**, para una fila del roadmap previa a la migración que aún lee un `planned` plano sin historial de cinco estados. Ver `docs/workflow/MIGRATION.md`. |
| 2.0.0 | 2026-07-09 | mayor | **Cambio incompatible:** la definición de producto (entrevista de idea en crudo + cierre de capacidades) se traslada a la nueva skill `design-feature`. `plan-feature` ahora es solo planificación de ingeniería, elimina el flag `--interview` y el paso interno `plan-feature-interview` (borrado), y añade una **puerta de redirección sin flag de bypass**: una feature sin diseñar (sin `SPEC.md`, `## Design status` no `designed`, o Cierre de capacidades vacío) PARA y señala `/design-feature <slug>`. Nota de migración en `docs/workflow/MIGRATION.md`. |
| 1.6.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. BLOCKED lleva la cadena de dependencias incumplida y el orden de construcción. |
| 1.5.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.5.0 | 2026-07-03 | menor | Casilla de precedencia de idioma de artefactos añadida al contrato de turno. |
| 1.4.0 | 2026-07-03 | menor | Contrato de turno al inicio (artefactos + roadmap registrado; el check de dependencias decide el bloque de cierre; → Next: impreso al final). |
| 1.3.0 | 2026-07-03 | menor | Check de dependencias y bloqueantes tras planificar: deps (transitivas) sin cumplir o issues fix-now en la misma área cambian el bloque de cierre → Next: para recomendar primero la cadena de dependencias / plan-fix. |
| 1.2.2 | 2026-07-02 | parche | La confirmación del roadmap se hace determinista: verificar número/orden/deps y corregir la entrada de inmediato si está mal. |
| 1.2.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| 1.2.0 | 2026-07-02 | minor | Añadida la sección Portability; la composición de pasos internos definida genéricamente como ejecución inline en la misma conversación. |
| 1.1.1 | 2026-06-27 | parche | Cierre normalizado al bloque canónico `→ Next:` |
| 1.1.0 | 2026-06-09 | menor | Dimensiona cada feature `XS/S/M/L`; enruta las pequeñas a la vía single-pass; imprime el siguiente paso correcto |
| 1.0.1 | 2026-06-05 | parche | `effort medium → high` (sus pasos de planificación en turno lo necesitan) |
| 1.0.0 | 2026-06-05 | — | Primer release — el router de planificación (idea / issue / slug acotado / `--next`) |

#### `plan-fix`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.1.0 | 2026-07-11 | menor | Fix #35: todo SPEC de fix lleva ahora un ledger de ejecución `## Phases` — **siempre ≥ 2 fases**: `P1..Pn` de implementación (cada fase cortada por la checklist de ejecutabilidad-barata) + la final `P(n+1) — Hardening & PR` con las tareas de cierre literales de la plantilla, nunca parafraseadas. Nuevo paso 12 del algoritmo (self-review y hand-off actualizados); el hand-off ahora apunta a `execute-phase --fix <n>` ejecutando `P1`. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.4.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. |
| 1.3.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.3.0 | 2026-07-03 | menor | Precedencia de idioma de artefactos fijada en el contrato de turno y las Hard rules. |
| 1.2.0 | 2026-07-03 | menor | Contrato de turno al inicio (SPEC commiteado en la rama fix con sha pegado, sin push; hand-off impreso; → Next: al final). |
| 1.1.2 | 2026-07-02 | parche | El rollback nombra la limpieza de datos o declara "none"; la escalada en esfuerzo L es regla (proponer vía plan-feature; decide el usuario), no un "consider". |
| 1.1.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| 1.1.0 | 2026-07-02 | minor | Añadida la sección Portability con los fallbacks estándar para agentes distintos de Claude Code. |
| 1.0.3 | 2026-06-27 | parche | Hand-off normalizado al bloque canónico `→ Next:` |
| 1.0.2 | 2026-06-19 | parche | Añadido `## Done when` — toda skill termina imprimiendo el siguiente paso |
| 1.0.1 | 2026-06-09 | parche | Redacción forge-agnóstica ("forge CLI per Workflow conventions") |
| 1.0.0 | 2026-06-05 | — | Primer release — redacta un SPEC de fix acotado como arquitecto, para para revisión |

#### `review-change`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.2.0 | 2026-07-13 | menor | Nuevo paso de persistencia (paso de proceso 9): los hallazgos fix-now ahora se anexan al **ledger de fold fix-now** de la unidad, `review-findings.md` (esquema fijo `\| id \| file:line \| axis \| severity \| class \| route \| folded \|`, `folded` empieza en `no`), deduplicado por `file:line`+axis, en una unidad no mergeada — una unidad mergeada no recibe escritura. El bloque `→ Next:` y la sección Routing ahora mencionan el ledger para hallazgos fix-now. Los hallazgos no-fix-now no se ven afectados. Parte de la feature 17 (`finding-severity-routing`). |
| 2.1.1 | 2026-07-10 | parche | Aclarada la semántica de N: distingue "el flag `--adversarial` no se pasó en absoluto" (modo de un solo revisor, sin mensaje) de "`--adversarial` se pasó sin un N válido" (sin número, o un número `< 2` — error de uso, cae al modo de un solo revisor). Corrige una contradicción con la decisión D1 de `decisions.md`, que exigía el error de uso tanto para N ausente como para N<2. Sin cambio de comportamiento en la ruta por defecto sin flag. |
| 2.1.0 | 2026-07-10 | menor | Nuevo modo opt-in `--adversarial N`: N revisores independientes, context-clean, solo-diff y adversariales corren en paralelo (subagentes de Claude Code / invocaciones headless / conversaciones nuevas secuenciales), hallazgos fusionados y deduplicados por `file:line`+eje en la misma tabla de decisión existente con una columna de confianza `Reviewers n/N`, umbral de inclusión ≥1 (sin quórum). Por defecto DESACTIVADO; auto-recomendado (nunca forzado) para cambios `L`/marcados como sensibles. La ruta por defecto sin flag no cambia. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.11.0 | 2026-07-09 | menor | El turn contract gana una casilla obligatoria de contexto limpio: la revisión final obligatoria de fin de unidad debe correr en una conversación que NO implementó el cambio — si lo hizo, PARAR y hacer hand-off a una nueva. "When to use" reescrito para exponer el requisito en prosa (la sección Portability ya existente referencia la línea de preferencia de familia de modelo cruzada de la feature 04; sin cambios aquí). |
| 1.10.2 | 2026-07-09 | parche | El invariante de modelo en Portability se extiende: "nunca revises con un modelo más débil — y prefiere una familia de modelo distinta a la del autor" (instancias de la misma familia comparten puntos ciegos de entrenamiento; una familia cruzada descorrelaciona errores). Solo redacción. |
| 1.10.1 | 2026-07-05 | parche | Referencias cruzadas actualizadas para `execute-phase` 1.14.0: el hand-off cada 2 fases se describe ahora como checkpoint recomendado y omitible; la revisión final obligatoria antes del merge no cambia. |
| 1.10.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. Los hallazgos fix-now y los números de issue creados viajan en el envelope; la deriva de SPEC recurrente activa el flag de recomendación de product-audit. |
| 1.9.0 | 2026-07-04 | minor | Guardrail: los cuerpos del forge creados vía triage-issue son Markdown — no pre-escapes el texto de los hallazgos; los cuerpos van por `--body-file`, nunca inline. |
| 1.8.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.8.0 | 2026-07-04 | menor | El check de disciplina del workflow también verifica la higiene git: un árbol sucio (docs incluidas) o commits sin push a un PR abierto son hallazgos `workflow` fix-now; la ruta de plegado dice commit Y push antes de re-revisar. |
| 1.7.0 | 2026-07-03 | menor | Check mecánico de disciplina del workflow en cada revisión (eje `workflow`): formato de commits, etiquetas de fase, docs por fase, sin commits en la rama por defecto, idioma de artefactos. |
| 1.6.0 | 2026-07-03 | menor | Contrato de turno al inicio (informe en formato fijo + PASS|FAIL + todo hallazgo enrutado + → Next: impreso al final). |
| 1.5.0 | 2026-07-02 | menor | Compone el pack de revisión interno propio (`review-*`) — las skills externas pasan a extras opcionales, nunca dependencias; contrato de salida fijo "Return exactly" que termina en PASS|FAIL; nota de equivalencia de modelos en la descripción. |
| 1.4.0 | 2026-07-02 | minor | Añadida la sección Portability; "componer in-turn" definido genéricamente como ejecutar dentro de la misma conversación. |
| 1.3.0 | 2026-06-27 | menor | Recomienda `product-audit` cuando la deriva del SPEC **se repite** entre unidades (no un hallazgo aislado); el cierre usa el bloque canónico `→ Next:` |
| 1.2.0 | 2026-06-19 | menor | **Obligatorio antes de cada merge**; enruta **cada hallazgo no-fix-now por `triage-issue`** (issue / decisión documentada / descarte justificado), nunca se pierde en silencio; imprime el siguiente paso |
| 1.1.0 | 2026-06-09 | menor | Comprobación de deriva del SPEC (diff vs. alcance + criterios de aceptación del SPEC) |
| 1.0.1 | 2026-06-05 | parche | Redacción: `execute-phase` "hace hand-off a" él |
| 1.0.0 | 2026-06-05 | — | Primer release — orquestador de revisión adaptativo a la plataforma |

#### `audit-pr`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 3.1.0 | 2026-07-13 | menor | Nuevo paso de proceso 5 (solo en veredicto BLOCKED): cada blocker se persiste en el **mismo** ledger de fold fix-now `review-findings.md` que escribe `review-change` (D4 — un solo ledger para el ciclo de fold), severidad `high` (un blocker bloquea el merge por definición), deduplicado por `file:line`+axis, sin escritura en una unidad mergeada. Pasos de proceso restantes renumerados (6→8). Parte de la feature 17 (`finding-severity-routing`). |
| 3.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 2.1.0 | 2026-07-05 | menor | Con MERGE-READY, publica un **comentario datado y ligado al SHA en el propio PR** (`gh pr comment --body-file`, idempotente por marcador HTML; nunca una etiqueta en el mensaje de commit; nada se publica en BLOCKED). Más el envelope máquina (estados MERGE_READY/MERGED/NEEDS_FIXES/BLOCKED, veredicto + checks manuales en `detail`). |
| 2.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 2.0.0 | 2026-07-04 | mayor | Cambio de contrato: auto-merge opt-in — con una política documentada (o instrucción explícita del usuario) fusiona un PR MERGE-READY tras un checklist pre-merge fail-closed (árbol limpio, nada sin push/pull, CI verde fresco sobre el SHA auditado); algo pendiente → commit+push, esperar CI, re-auditar — nunca fusionar con un veredicto obsoleto. La cabecera del veredicto imprime siempre la URL completa del PR. Sin el opt-in el comportamiento no cambia: sigue sin fusionar. |
| 1.5.0 | 2026-07-03 | menor | El gate de Traceability también bloquea si la fila done no lleva su referencia de PR enlazada. |
| 1.4.0 | 2026-07-03 | menor | Contrato de turno al inicio (bloque de veredicto fijo; nada fusionado/editado; → Next: impreso al final). |
| 1.3.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| 1.3.0 | 2026-07-02 | minor | Añadida la sección Portability con los fallbacks estándar para agentes distintos de Claude Code. |
| 1.2.0 | 2026-06-27 | menor | Bloque `→ Next:` post-merge — MERGE-READY apunta a la siguiente unidad (`plan-feature --next` / `triage-issue`) para que una feature terminada no muera en el merge |
| 1.1.0 | 2026-06-19 | menor | Gate de fusión reforzado: **nunca fusionar con docs pendientes**; la entrada issue/fix-index debe seguir trackeada (se retira solo tras el merge); `done` ≠ listo-para-fusionar; indica el siguiente paso |
| 1.0.3 | 2026-06-09 | parche | Redacción forge-agnóstica |
| 1.0.2 | 2026-06-05 | parche | Revertido `context: fork` (el CLI suprimía la salida de la skill) |
| 1.0.1 | 2026-06-05 | parche | Añadido `context: fork` (luego revertido) |
| 1.0.0 | 2026-06-05 | — | Primer release — gate de fusión a nivel de PR |

#### `product-audit`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.8.0 | 2026-07-10 | menor | Nueva dimensión "Installed tooling" + paso de proceso: inventaría las skills instaladas y los servidores MCP conectados, los cruza contra los ejes de revisión aplicables y el roadmap, y añade un cuarto flujo de propuestas ("Tooling: register / re-design") — registrar una herramienta útil no registrada en `CLAUDE.md`, o enrutar un descubrimiento que cambia el alcance a `/design-feature`. Solo propone; nunca registra ni edita `CLAUDE.md`. Se añade `detail.proposed_tooling` al envelope máquina (aditivo). |
| 1.7.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. Estado HALT para hallazgos críticos que paran todo. |
| 1.6.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.6.0 | 2026-07-03 | menor | Dimensión explícita de disciplina del workflow — compone los checks 1-13 de audit-docs mecánicamente; nunca asume que una regla se cumplió. |
| 1.5.0 | 2026-07-03 | menor | Contrato de turno al inicio (informe completo en formato fijo; solo informe; → Next: impreso al final). |
| 1.4.0 | 2026-07-02 | menor | Barre todos los ejes con el pack de revisión interno (sin dependencias de skills externas); nota de equivalencia de modelos en la descripción. |
| 1.3.0 | 2026-07-02 | minor | Añadida la sección Portability; el tip de ultracode ahora indica el fallback secuencial para agentes sin él. |
| 1.2.2 | 2026-06-27 | parche | Cierre normalizado al bloque canónico `→ Next:` |
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
| 2.0.1 | 2026-07-11 | parche | Añadido el `argument-hint: "[--fix]"` que faltaba en el frontmatter (el modo `--fix` existía en el cuerpo pero era invisible en los menús de los agentes) — parte de #43, la referencia de invocación y argumentos en `docs/workflow/SKILLS.md`. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.7.0 | 2026-07-05 | menor | Nuevo check 13 — procedencia de docs generadas (solo cuando hay bloque `Docs site` declarado): las páginas con `generated-by: agentic-workflow/generate-docs` cuya `source-unit` ya no existe son huérfanas (MEDIA); las páginas cuya unidad mergeó después de su fecha `updated` con commits en sus rutas son obsoletas (BAJA). Bloque de disciplina del workflow renumerado a 10–14. |
| 1.6.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. |
| 1.5.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.5.0 | 2026-07-03 | menor | Checks de disciplina del workflow 10-13 (comandos mecánicos, no inferencia): nombrado de fases, disciplina de docs por fase, disciplina de rama/PR contra el forge, formato de commits + cierres de dependencias. |
| 1.4.0 | 2026-07-03 | menor | Nuevo check 9: integridad de enlaces de PR en filas `done` — toda fila done del roadmap/índice lleva `done · [#<pr>](url)`; un done sin PR localizable es severidad alta. product-audit lo hereda al componer esta skill. |
| 1.3.0 | 2026-07-03 | menor | Contrato de turno al inicio (informe fijo + PASS|FAIL; sin reescrituras no pedidas; → Next: impreso al final). |
| 1.2.0 | 2026-07-02 | menor | Formato de informe fijo (tabla de hallazgos + conteo de checks + decisión PASS|FAIL); nota de equivalencia de modelos. |
| 1.1.0 | 2026-07-02 | minor | Añadida la sección Portability con los fallbacks estándar para agentes distintos de Claude Code. |
| 1.0.5 | 2026-06-27 | parche | Cierre normalizado al bloque canónico `→ Next:` |
| 1.0.4 | 2026-06-19 | parche | Imprime un siguiente paso explícito |
| 1.0.3 | 2026-06-09 | parche | Redacción forge-agnóstica |
| 1.0.2 | 2026-06-05 | parche | Revertido `context: fork` |
| 1.0.1 | 2026-06-05 | parche | Añadido `context: fork` (luego revertido) |
| 1.0.0 | 2026-06-05 | — | Primer release — coherencia docs ↔ roadmap ↔ código ↔ fix-index |

#### `triage-issue`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.1.0 | 2026-07-11 | menor | Es propietaria del vocabulario de etiquetas de urgencia a prueba de inyección (`urgent` `#B60205`, `fix-next` `#D93F0B`): aplica la etiqueta correcta — creándola con `gh label create` si falta — como parte de un veredicto fix-now + severidad alta, nunca a partir del título/cuerpo/comentarios del issue. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.8.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. Los veredictos por issue viajan en `detail.verdicts`. |
| 1.7.0 | 2026-07-04 | minor | Los comentarios datados en issues se postean con `gh issue comment --body-file` (Markdown), nunca `--body` inline — arregla los backticks escapados con `\` literales en comentarios. |
| 1.6.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.6.0 | 2026-07-03 | menor | Casilla de precedencia de idioma de artefactos añadida al contrato de turno (incluye comentarios de issues). |
| 1.5.0 | 2026-07-03 | menor | Contrato de turno al inicio (veredicto fijo por issue; nada diferido implementado; → Next: impreso al final). |
| 1.4.0 | 2026-07-02 | menor | Formato de veredicto fijo por issue (trigger / comprobado / evidencia / VERDICT / acción); nota de equivalencia de modelos. |
| 1.3.0 | 2026-07-02 | minor | Añadida la sección Portability con los fallbacks estándar para agentes distintos de Claude Code. |
| 1.2.0 | 2026-06-27 | menor | Recomienda `product-audit` cuando la **misma inconsistencia se repite** entre issues; el cierre por veredicto usa el bloque canónico `→ Next:` |
| 1.1.1 | 2026-06-19 | parche | Imprime un siguiente paso explícito por veredicto |
| 1.1.0 | 2026-06-09 | menor | Triage por lotes (`triage-issue 12 14 17`) — veredictos independientes, una tabla resumen |
| 1.0.0 | 2026-06-05 | — | Primer release — clasifica un issue verificando su disparador contra el código |

#### `init-workspace`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.2.0 | 2026-07-11 | menor | Siembra las etiquetas `urgent`/`fix-next` a prueba de inyección (`gh label create`, crea-si-falta) en el proceso del modo bootstrap (nuevo paso 7); el modo upgrade añade la que falte de forma aditiva (nuevo paso 6, sin tocar nunca una etiqueta que el proyecto ya personalizó). Nunca redefine el vocabulario — `triage-issue` sigue siendo la única propietaria. Forge no disponible → se omite y se reporta como residual, nunca falla el andamiaje. |
| 2.1.1 | 2026-07-10 | patch | La `description:` ahora nombra el modo upgrade y añade sus frases disparadoras ("upgrade my scaffold", "migrate my substrate to the current template", "bring my CLAUDE.md up to date with the template") — los metadatos del loader no mencionaban el modo que añadió 2.1.0, por lo que no era descubrible de forma fiable mediante lenguaje natural. Sin cambio de comportamiento. |
| 2.1.0 | 2026-07-10 | menor | Añade un **modo upgrade**: en un repo que el Step 0 reconoce como andamiaje agentic-workflow existente, ahora se ofrece upgrade junto a merge/adapt/abort — compara el sustrato con el `template/` actual, lee `docs/workflow/MIGRATION.md`, propone solo los bloques que faltan mediante una entrevista corta con valores por defecto de descubrimiento, y nunca reescribe un bloque personalizado (aditivo, nunca sobrescribe). Refuerza los cuatro casos límite (sin deriva, `MIGRATION.md` ausente, bloque personalizado, bootstrap sin cambios). El modo bootstrap queda igual. Ver `docs/workflow/MIGRATION.md`. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.8.0 | 2026-07-05 | menor | La entrevista gana una ronda de **Tooling de rendimiento**: checklist de detección por slot (lint de complejidad / harness de benchmarks / profiler — ejemplos del adaptador TS/JS: grupo complexity de Biome o sonarjs+unicorn, vitest bench / mitata / tinybench, `node --cpu-prof` / 0x / `bun --inspect`), instalación confirmada por el usuario y registro en el nuevo bloque `Performance commands` de la plantilla para que `review-perf` mida en vez de estimar. |
| 1.7.0 | 2026-07-05 | menor | La entrevista gana una ronda **Docs site**: registra el sitio de docs del proyecto (formato/directorio de contenido/comandos de build y mapa) en el nuevo bloque `Docs site` de la plantilla para que `generate-docs` pueda escribir en él; se deja comentado cuando no hay sitio. Nunca crea el sitio web. |
| 1.6.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. |
| 1.5.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| 1.5.0 | 2026-07-03 | menor | Casilla de precedencia de idioma de artefactos añadida al contrato de turno; la regla Docs language de la plantilla enuncia ahora la precedencia. |
| 1.4.0 | 2026-07-03 | menor | Contrato de turno al inicio (scaffold escrito o decisión preguntada; nada instalado sin un sí; → Next: impreso al final). |
| 1.3.0 | 2026-07-02 | menor | La entrevista pregunta el workflow de git del proyecto (branches por defecto / worktrees); las revisiones se declaran autocontenidas — las skills externas pasan a extras opcionales; nota de equivalencia de modelos. |
| 1.2.0 | 2026-07-02 | minor | Añadida la sección Portability (la oferta de hooks se omite en agentes distintos de Claude Code; `log-session` como alternativa manual). |
| 1.1.2 | 2026-06-27 | parche | Cierre normalizado al bloque canónico `→ Next:` |
| 1.1.1 | 2026-06-19 | parche | `## Done when` imprime el siguiente paso explícito |
| 1.1.0 | 2026-06-09 | menor | Detecta el **forge** desde la URL del remoto y lo registra; sugiere las skills de revisión complementarias de la plataforma |
| 1.0.0 | 2026-06-05 | — | Primer release — adapta el scaffold de docs a un proyecto |

### Internas (`user-invocable: false`)

| Skill | Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|---|
| `bump-skill` | 2.1.0 | 2026-07-11 | menor | Fix #40: reclasificada como `user-invocable: false` — la skill es mantenimiento del propio repo `agentic-workflow` y su entrada de menú `/bump-skill` era ruido para el ~99% de quienes consumen el paquete sin autorar sus `SKILL.md`. Sin cambio de comportamiento; se sigue ejecutando vía la herramienta Skill o siguiendo `SKILL.md` directamente. Su tabla por skill se traslada de "Mantenimiento del repo" a esta sección Interna. |
| | 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Además se retira la regla de lint "Machine envelope", ya obsoleta (exigía que toda skill de cara al usuario llevara la sección — ya no es cierto). Ver `docs/workflow/MIGRATION.md`. |
| | 1.5.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. El lint gana una 5ª regla: las skills de cara al usuario deben llevar la sección `## Machine envelope`. |
| | 1.3.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| | 1.3.0 | 2026-07-03 | menor | El lint comprueba también la nueva sección `## Turn contract` en las skills de cara al usuario. |
| | 1.2.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| | 1.2.0 | 2026-07-02 | minor | El lint ahora comprueba también que las skills de cara al usuario llevan la sección `## Portability`; añadida su propia nota de Portability. |
| | 1.1.0 | 2026-06-27 | menor | Paso de lint que marca las skills editadas sin bloque `→ Next:` o con etiquetas de fase `S1`/"Step" (avisa, nunca corrige solo) |
| | 1.0.0 | 2026-06-19 | — | Nueva skill de mantenimiento del repo. Tras editar un SKILL.md, sube la `version:`, añade filas en CHANGELOG.md + CHANGELOG.es.md y actualiza las tablas de skills y modelos en README.md + README.es.md |
| `orchestration-envelope` | 1.2.0 | 2026-07-13 | menor | Atajo de structured outputs para drivers: cuando el provider/modelo soporta structured outputs estrictos (`response_format: json_schema` + `strict`), el turno de solo-envelope (el prompt de reparación, o un turno final dedicado a "emite el envelope") puede pasar el `envelope.schema.json` del paquete npm como response format para que la respuesta valide por construcción. El bucle de reparación queda como fallback para modelos sin la funcionalidad; los turnos de trabajo nunca llevan response format (forzaría toda la salida a JSON y suprimiría la prosa/el uso de tools). Esquema sin cambios — no se necesita release del paquete. |
| | 1.1.1 | 2026-07-10 | parche | Fix #33: la descripción del frontmatter y la sección de apertura aún enunciaban el contrato previo a la feature 10 ("toda skill de cara al usuario imprime el envelope") POR ENCIMA de la corrección de la feature 10 — reescritas de cabeza al contrato vigente (esquema + regla de parseo último-json-cercado como núcleo; emisión = `workflow-status` siempre, el resto de skills solo bajo el snippet inyectado por el driver, nada en sesiones interactivas). La misma frase obsoleta corregida en `packages/agentic-workflow-schema/README.md`, `package.json`, `src/index.ts` y `envelope.schema.json` (solo texto de descripción/comentario/metadatos, sin cambio de forma del esquema ni de comportamiento, sin release del paquete). |
| | 1.1.0 | 2026-07-10 | menor | Nueva sección `## Driver system-prompt snippet + repair loop`: el snippet canónico de system-prompt inyectado por el driver (verbatim, cercado) y el protocolo de bucle de reparación (fallo de parseo → reinvocar con "Emit only the machine envelope for the turn above.", un reintento, luego FAILED del driver) — el requisito del envelope se traslada aquí desde los contratos de turno por skill de las 14 skills de cara al usuario. |
| | 1.0.0 | 2026-07-05 | — | Nuevo contrato interno: el esquema JSON del envelope máquina (11 estados, claves fijas, regla de parseo último-json-cercado) que toda skill de cara al usuario emite como su salida final absoluta. |
| `review-implementation` | 1.1.0 | 2026-07-09 | menor | La postura de la Fase 1 ("Find") ahora es adversarial por defecto: "asume que el diff está MAL — tu trabajo es probar que no funciona". La tabla de ejes y la rúbrica de clasificación de la Fase 2 no cambian. |
| | 1.0.3 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.2 | 2026-07-02 | parche | La referencia a revisiones companion ahora apunta al pack de revisión interno (`review-*`) |
| | 1.0.1 | 2026-06-09 | parche | Descripción acortada 96 → 36 palabras (contexto siempre cargado); cuerpo sin cambios |
| | 1.0.0 | 2026-06-05 | — | El motor de hallazgos + rúbrica de clasificación que compone `review-change` |
| `plan-feature-interview` | — | 2026-07-09 | eliminada | **Retirada.** Su lógica de entrevista de idea en crudo se trasladó a la nueva skill de cara al usuario `design-feature` (la definición de producto es ahora su propia etapa del pipeline, no un detalle interno de enrutado de `plan-feature`). `skills/plan-feature-interview/` borrado. Ver `docs/workflow/MIGRATION.md`. |
| | 1.2.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo devuelto al router (dimensiones resueltas, preguntas abiertas, issue de tracking) |
| 1.1.0 | 2026-06-09 | menor | Estima el tamaño `XS/S/M/L`; pide una referencia de diseño UI en features con UI |
| | 1.0.0 | 2026-06-05 | — | Entrevista una idea en crudo hasta un SPEC |
| `plan-feature-from-issue` | 1.4.0 | 2026-07-09 | menor | Ahora **escribe** la fila del roadmap a `defined` en la misma edición que sella `## Design status: designed` (añadida en `idea` primero si la fila no existía) — la transición `idea → defined`, realizada aquí cuando esta skill satisface el cierre directamente en vez de entregar a `design-feature`. |
| | 1.3.0 | 2026-07-09 | menor | Ahora escribe la **mitad de producto** del SPEC (convención de dos mitades) y debe satisfacer el **cierre de capacidades** antes de entregar — un issue delgado sin suficiente contenido para completarlo se entrega a `design-feature` (compuesta en el mismo turno solo si es de tier ≥) en vez de simular `## Design status: designed`. |
| | 1.2.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo devuelto al router (veredicto, huecos cerrados, Closes #N enlazado) |
| 1.1.0 | 2026-06-09 | menor | Produce un SPEC acotado **dimensionado** con `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → SPEC acotado |
| `plan-feature-scaffold` | 1.9.0 | 2026-07-12 | menor | Fix #51: tras la escritura `defined → planned` del roadmap, relee la fila y confirma que dice literalmente `planned`; reaplica la edición si no coincide, en vez de asumir que la escritura se realizó. "Done when" gana la afirmación equivalente de relectura-y-confirmación. |
| `plan-feature-scaffold` | 1.8.0 | 2026-07-11 | menor | Fix #35: XS/S sigue siendo solo-SPEC, pero su `### Phases` debe listar **≥ 2 fases con tareas checkbox** — `P1` implementación + la final `P2 — Hardening & PR` con las tareas de cierre literales copiadas de la plantilla de fix; el informe fijo de finalización siempre indica el número de fases (la variante `| single-pass` desaparece). |
| `plan-feature-scaffold` | 1.7.0 | 2026-07-10 | menor | El corte de fases ahora es un **gate obligatorio**, no consultivo: una feature M/L DEBE dividirse en features encadenadas por `Depends on:` cuando supera ~5 fases, una fase toca más de una capa/asunto, o una fase requiere una decisión de diseño sin resolver, y cada fase emitida debe superar una checklist de cuatro casillas de ejecutabilidad-barata (comprobable sin juicio · cero decisiones abiertas · un solo asunto · el gate corre localmente). La generación de `TASKS.md`/`testing.md` ahora emite los criterios de aceptación comprobables por comando como el comando ejecutable, no como prosa. |
| | 1.6.0 | 2026-07-09 | menor | "Registrar en el roadmap" ahora **escribe** el estado de la fila a `planned` (la transición `defined → planned` que esta skill posee) junto con número/orden/dependencias — una fila ya `defined` se promueve; una fila totalmente nueva (SPEC ya delimitado sin entrada previa) se añade directamente en `planned`. |
| | 1.5.0 | 2026-07-09 | menor | Ahora completa solo la **mitad de ingeniería** del SPEC — la mitad de producto (objetivo, contexto, alcance, cierre de capacidades) la escribe `design-feature` / `plan-feature-from-issue` y se verifica `designed` antes de que esta skill se ejecute; para en vez de editar una mitad de producto sin diseñar o ausente. |
| | 1.4.0 | 2026-07-04 | menor | La tarea de cierre del TASKS.md generado ahora dice `gh pr create --body-file <path>` (fichero Markdown), nunca `--body`/heredoc inline — para que los ejecutores no emitan backticks escapados con `\` literales en el cuerpo del PR. |
| `plan-feature-scaffold` | 1.3.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.3.0 | 2026-07-03 | menor | La fase final del TASKS.md generado termina con tareas literales de cierre: abrir PR + imprimir URL en el chat, enlazar la fila del roadmap, commitear y pushear el enlace. |
| 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo (artefactos escritos, registro en roadmap, nº de fases, preguntas abiertas) |
| 1.1.1 | 2026-06-27 | parche | Nombrado de fases fijado a `P1, P2, …` ("fases") en PLAN/TASKS/progress — nunca `S1`/"Steps" |
| | 1.1.0 | 2026-06-09 | menor | Escala los artefactos al tamaño — XS/S → solo SPEC; M/L → set completo que acaba en fase de hardening |
| | 1.0.0 | 2026-06-05 | — | SPEC → set completo de artefactos de planificación + entrada de roadmap |

| `review-code` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: pasada de checklist de corrección + simplificación (tabla de hallazgos fija + PASS|FAIL) |
| `review-security` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: pasada de checklist de seguridad (secretos, inyección, authn/authz, PII, dependencias) |
| `review-verify` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: verificación ejecutando de verdad — gate + comportamiento real, ítems manuales listados |
| `review-debt` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: inventario de deuda técnica, cada hallazgo con condición de re-disparo |
| `review-design` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist UI/UX contra el doc de diseño del proyecto (estados, reutilización, responsive) |
| `review-a11y` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist de accesibilidad (semántica, teclado, foco, contraste, ARIA) |
| `review-brand` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist de marca y copy (voz, glosario, claims honestos) |
| `review-perf` | 1.1.0 | 2026-07-05 | menor | Evidencia medida: cuando la guía del proyecto declara un bloque `Performance commands` y el diff toca rutas con benchmarks, el comando bench declarado se EJECUTA en base y cambio y se citan ambos números (`<cmd> → base <x> / change <y> (<±z%>)`); las regresiones más allá de la banda de ruido (declarada, si no ±5%) son mayores; un comando bench que falla es en sí un hallazgo. Sin comandos declarados → `n/a — no declared perf commands` explícito + hallazgo menor de adoptar tooling cuando el diff añade código algorítmico sobre input que crece. |
| | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist de rendimiento (N+1, complejidad, fugas, peso de assets) |
| `review-seo` | 1.0.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist SEO (metadatos, canonical, indexabilidad, datos estructurados) |
---

## Registro cronológico (más reciente primero)

- **2026-07-13 — finding-severity-routing P1–P2 (feature 17).** Bump MENOR
  para `review-change` (2.2.0): nuevo paso de persistencia que escribe los
  hallazgos fix-now en un nuevo ledger de fold fix-now por unidad,
  `review-findings.md` (esquema fijo, `folded` empieza en `no`, deduplicado
  por `file:line`+axis, sin escritura en una unidad mergeada). Bump MENOR
  para `audit-pr` (3.1.0): los blockers de un veredicto BLOCKED se persisten
  en el **mismo** ledger (D4 — una sola lista para el ciclo de fold),
  severidad `high`, mismas reglas de dedupe/gate — `execute-phase`,
  `workflow-status` + paquete de esquema en fases posteriores.

- **2026-07-13 — guía operativa consciente del provider (feature 16,
  inferencia compatible con OpenAI, NaN Builders).** Bump MENOR para
  `orchestration-envelope` (1.2.0): los drivers pueden forzar el envelope
  máquina mediante structured outputs estrictos (`response_format:
  json_schema`) en el turno de solo-envelope cuando el provider lo soporta,
  con el bucle de reparación como fallback. Bump PARCHE para `ship-roadmap`
  (2.2.1): barrera de Portability que limita los ejecutores paralelos al
  límite de concurrencia por key del provider. Además, actualizaciones solo
  de docs: la sección NaN.builders del README sustituye el claim incorrecto
  del "dial uniforme de esfuerzo" por una matriz de control de razonamiento
  por modelo, degrada a Gemma4 de la escalera de ejecución agéntica (tool
  calling en formato XML, sin validar para harnesses estilo OpenAI), añade
  una advertencia de verificación de catálogo para GLM-5.2 y los límites de
  rate/concurrencia por key; `GOLDEN_FIXTURE.md` gana un smoke test de tool
  calling como precondición de modelo para el camino ejecutor.
- **2026-07-12 — romper el bucle de re-planificación de plan-feature (fix
  #51).** Bumps MENORES para `plan-feature` (3.1.0), `plan-feature-scaffold`
  (1.9.0) y `workflow-status` (1.5.0, luego un PARCHE el mismo día a 1.5.1): la
  puerta de redirección ahora cortocircuita en `planned`/`in-progress`/`done`
  (remite a `/execute-phase`, nunca re-genera el andamiaje) en vez de
  continuar con "defined o superior"; `--next` apunta a la siguiente entrada
  `defined`; `plan-feature-scaffold` relee la fila del roadmap tras su
  escritura `defined → planned` y reaplica si no coincide; `workflow-status`
  añade una guarda de no-progreso de solo lectura que señala un hint
  `/plan-feature`/`/design-feature` estancado vía `workflow_observations` en
  vez de repetirlo silenciosamente — el parche 1.5.1 ajustó la redacción de
  esa nota para decir estancamiento "sospechoso" en vez de afirmar que el
  comando recomendado se ejecutó (hallazgo de review-change en la PR).
- **2026-07-12 — endurecimiento en tiempo de emisión del envelope de
  workflow-status (fix #52).** Bump MENOR para `workflow-status` (1.4.0):
  comprobaciones del contrato de turno para un `next.recommended` no-vacío y
  correctamente escalonado, recordatorios de forma del envelope y una tabla
  comando→nivel, un disparador mecánico (a prueba de excepciones) para
  `product_audit`, un mapeo por defecto de estado de roadmap desconocido a
  `idea`, y un nuevo campo de backlog `detail.untriaged_issues`. Corrige dos
  defectos reproducidos (recomendaciones no accionables, envelopes inválidos
  contra el esquema) sin ningún cambio de esquema/paquete.
- **2026-07-11 — siembra de etiquetas de urgencia (feature 15, #42, P4).**
  Bump MENOR para `init-workspace` (2.2.0): el modo bootstrap siembra las
  etiquetas `urgent`/`fix-next` con `gh label create` (crea-si-falta); el
  modo upgrade añade la que falte de forma aditiva, sin tocar nunca una
  etiqueta que el proyecto ya personalizó. El vocabulario sigue siendo
  propiedad de `triage-issue`; forge no disponible → se omite y se reporta
  como residual, nunca falla el andamiaje.
- **2026-07-11 — juez pausa-vs-terminar + cableado en SELECT (feature 15,
  #42, P3).** Nueva sección canónica `## Urgency: the pause-vs-finish
  micro-judge` en `docs/workflow/ORCHESTRATION.md` (doc, sin `bump-skill`):
  cortocircuito determinista (límite de commit / a un checkbox del cierre /
  bypass de `fix-next`) antes de un juez de tier barato, contexto limpio y
  sin herramientas, con salida binaria cerrada `FINISH_FIRST |
  INTERRUPT_NOW`, bucle de reparación de esquema, rúbrica-como-system-prompt
  y valor por defecto a prueba de fallos `FINISH_FIRST`. Bump MENOR para
  `ship-roadmap` (2.2.0): SELECT lee primero `detail.urgent` —
  `fix-next` → cabeza de la cola, `urgent` → corre la rúbrica referenciada
  (nunca duplicada) de `ORCHESTRATION.md` contra la unidad en curso.
- **2026-07-11 — campo de envelope de urgencia + interrumpibilidad (feature
  15, #42, P2).** Bump MENOR para `workflow-status` (1.3.0): nuevo campo de
  envelope `detail.urgent` que lista los issues abiertos con `urgent`/
  `fix-next` — leído solo del objeto JSON `labels`, nunca del título/cuerpo/
  comentarios — junto a los hechos de interrumpibilidad de la unidad en curso
  (fase, sucio/limpio, tareas hasta el próximo límite de commit). Solo
  presencia, reporta hechos, nunca decide pausa-vs-terminar (eso sigue siendo
  el juez acotado del consumidor).
- **2026-07-11 — vocabulario de etiquetas de urgencia a prueba de inyección
  (feature 15, #42, P1).** Bump MENOR para `triage-issue` (2.1.0): es
  propietaria y aplica dos etiquetas de GitHub protegidas por permiso —
  `urgent` (`#B60205`, evaluar para interrumpir ahora) y `fix-next`
  (`#D93F0B`, cabeza de la cola de fixes, nunca interrumpe) — solo en un
  veredicto fix-now + severidad alta, creando la etiqueta con `gh label
  create` si el repo no la tiene. La urgencia se deriva exclusivamente del
  veredicto que alcanza esta skill, nunca del título/cuerpo/comentarios del
  issue (la invariante de seguridad frente a inyección que esta feature
  establece).
- **2026-07-11 — bump-skill reclasificada como interna (fix #40).** Bump
  MENOR para `bump-skill` (2.1.0): `user-invocable: false` y eliminada del
  array `skills` de `.claude-plugin/plugin.json` — la skill es mantenimiento
  del propio repo `agentic-workflow`, así que su entrada de menú
  `/bump-skill` era ruido para el ~99% de quienes solo consumen el paquete.
  Sin cambio de comportamiento; se sigue ejecutando vía la herramienta Skill.
  Conteos de skills reconciliados en `README.md`, `README.es.md` y
  `docs/workflow/SKILLS.md` (15 de cara al usuario + 13 internas → 14 + 14).
  Cierra #40.
- **2026-07-11 — cierre por fases para unidades de pase único (fix #35).**
  Bumps MENORES de `plan-fix` (2.1.0), `plan-feature-scaffold` (1.8.0) y
  `execute-phase` (2.1.0): todo SPEC de fix y de feature XS/S lleva ahora un
  ledger `## Phases` (≥ 2 fases; la final es siempre `Hardening & PR` con
  tareas de cierre literales), y `execute-phase` lo consume una fase por
  invocación, de modo que la cadena de cierre (push → PR → commit del enlace
  → push) corre en un turno fresco que los modelos débiles no pueden truncar.
  Los SPECs legacy sin `## Phases` conservan el flujo de pase único
  (retrocompatible). Ambas plantillas de SPEC (repo + `template/`)
  pre-escriben la fase final; docs del workflow y el SPEC de juguete del
  golden fixture actualizados a la forma de 2 fases. Cierra #35.
- **2026-07-10 — modo upgrade de init-workspace (feature 13).** Bump MENOR
  para `init-workspace` (2.1.0): un repo que el Step 0 reconoce como
  andamiaje agentic-workflow existente obtiene ahora una opción **upgrade**
  junto a merge/adapt/abort — compara el sustrato con el `template/` actual,
  lee `docs/workflow/MIGRATION.md`, propone solo los bloques que faltan
  mediante una entrevista corta con valores por defecto de descubrimiento,
  nunca reescribe un bloque personalizado. Cuatro casos límite reforzados
  explícitamente (sin deriva, `MIGRATION.md` ausente, bloque personalizado,
  bootstrap sin cambios). Modo bootstrap sin cambios. Se añade la
  recomendación documentada "actualizar una instalación existente" en
  `README.md`, `README.es.md` y `docs/workflow/MIGRATION.md`. Cierra #20.
- **2026-07-10 — modo adversarial multi-revisor (feature 11).** Bump MENOR para
  `review-change` (nuevo `--adversarial N` opt-in: N revisores paralelos,
  context-clean y adversariales, fusionados/deduplicados por `file:line`+eje,
  inclusión ≥1, por defecto DESACTIVADO, auto-recomendado para `L`/sensibles) y
  `ship-roadmap` (su etapa REVIEW no supervisada ahora activa `--adversarial 2`
  como piso obligatorio para features `L`/sensibles, deliberadamente no
  alineado con el advisory interactivo). `docs/workflow/REVIEW_AND_CLASSIFY.md`
  documenta el modo; sin cambios en `review-implementation`, el schema ni el
  paquete npm. Seguimiento PARCHE para `review-change` (2.1.1): corrige una
  contradicción de redacción con la decisión D1 — un `--adversarial` sin N
  ahora indica el error de uso y cae al modo de un solo revisor, igual que
  `N < 2`.
- **2026-07-10 — el envelope se traslada a la capa de orquestación (feature 10).**
  Bump MAYOR para las 14 skills de cara al usuario que llevaban una sección
  `## Machine envelope` (`audit-docs, audit-pr, bump-skill, design-feature,
  execute-phase, generate-docs, init-workspace, log-session, plan-feature,
  plan-fix, product-audit, review-change, ship-roadmap, triage-issue`): la
  sección y su cláusula de emisión en el contrato de turno desaparecen — todo
  turno termina limpio para el lector humano, en el bloque de cierre
  `→ Next:`. `workflow-status` no cambia (sigue siendo el único emisor en
  línea — emitirlo es su función). El nuevo hogar del contrato es
  `orchestration-envelope` (bump menor: añade el snippet canónico de
  system-prompt inyectado por el driver + el protocolo de bucle de
  reparación), reflejado en `docs/workflow/ORCHESTRATION.md` y
  `docs/workflow/PORTABLE_PROMPT.md`. Ver `docs/workflow/MIGRATION.md`.
- **2026-07-10 — barrido de tooling instalado en product-audit (feature 09).**
  `product-audit` 1.8.0 añade una dimensión "Installed tooling": inventaría las
  skills instaladas y los servidores MCP conectados, los cruza contra los ejes
  de revisión aplicables y el roadmap, y propone registrar tooling útil no
  registrado en `CLAUDE.md` o enrutar un descubrimiento que cambia el alcance a
  `/design-feature` — solo propone, nunca registra ni edita `CLAUDE.md`.

- **2026-07-10 — economía del corte de fases: gate obligatorio de división +
  checklist de ejecutabilidad-barata + criterios como comandos +
  una-fase-una-sesión (P1–P2 de la feature 08).** `plan-feature-scaffold`
  1.7.0 sustituye el "considera dividir" opcional por un disparador de
  división obligatorio (>~5 fases, una fase multi-capa/asunto, o una decisión
  de diseño sin resolver) y una checklist de cuatro casillas de
  ejecutabilidad-barata por fase, y ahora emite los criterios de aceptación
  comprobables por comando como comandos ejecutables en
  `TASKS.md`/`testing.md` en lugar de prosa. Ambas plantillas de SPEC
  (`docs/features/_TEMPLATE/SPEC.md` + el espejo en `template/`) llevan la
  misma regla de división obligatoria y la convención de criterios-como-comandos.
  `execute-phase` 1.16.0 y `docs/workflow/FEATURE_WORKFLOW.md` (+ la sección
  Feature workflow de `template/CLAUDE.md`, en lugar de un espejo inexistente
  en `template/`) declaran la regla **una fase = una sesión** para modelos
  ejecutores no-frontera.

- **2026-07-09 — el estado del roadmap se convierte en la máquina de estados
  del pipeline (P1–P4 hasta ahora).** La columna `Status` del roadmap se
  promueve a una máquina de cinco estados (`idea → defined → planned →
  in-progress → done`), reescrita en `docs/features/ROADMAP.md` y
  `template/docs/features/ROADMAP.md` con un diagrama de transición y la
  skill propietaria de cada arista; regla de compatibilidad legacy (`planned`
  plano + mitad de producto del SPEC completa = `defined`+`planned`) añadida
  a `docs/workflow/MIGRATION.md`. `workflow-status` 1.2.0 lee la máquina y
  clasifica las filas `idea` como `design_candidates` en vez de
  `startable_now`; `execute-phase` 1.15.0 gana una precondición de estado
  propio en su gate de dependencias, que redirige una unidad por debajo de
  `planned` a `/design-feature` o `/plan-feature`. Las skills de autoría ahora
  **escriben** los estados: `design-feature` 1.1.0 y `plan-feature-from-issue`
  1.4.0 escriben `idea → defined` al sellar `## Design status: designed`;
  `plan-feature-scaffold` 1.6.0 escribe `defined → planned` al registrar el
  conjunto completo de artefactos; la puerta de redirección de `plan-feature`
  2.1.0 ahora se basa primero en el estado del roadmap, con el marcador del
  SPEC conservado como fallback de compatibilidad legacy. `ship-roadmap`
  1.11.0 cumple con la máquina en vez de eximirse: la fundación se documenta
  como diseño en lote (escribe las filas de las features en `idea`, salvo la
  feature 01 scaffoldeada por la fundación que aterriza en `planned`); una
  nueva etapa DESIGN diseña JIT una unidad `idea`/`defined` en mitad del run
  estrictamente desde el registro bloqueado `SHIP_DECISIONS.md` — sin
  preguntas nuevas — promoviéndola a `planned` antes de PLAN; las unidades no
  diseñables se aparcan (`state: CONTINUE`, el run sigue), nunca se adivinan
  ni se vuelven a preguntar. Feature `07-roadmap-status-machine` (backlog U4,
  cierra #14) — en curso.

- **2026-07-09 — la definición de producto se separa en `design-feature`.**
  Nueva skill de cara al usuario `design-feature` 1.0.0 asume la definición de
  producto: incorpora la entrevista de idea en crudo, recorre un checklist fijo
  de **cierre de capacidades** (por entidad → CRUD + transiciones de estado +
  UI + API + test, o `n/a` explícito; por capacidad → punto de entrada + ACL;
  por rol → asignado/revocado/visto) hacia criterios de aceptación exhaustivos,
  y escribe la **mitad de producto** del SPEC (`docs/features/_TEMPLATE/SPEC.md`
  es ahora un único SPEC en dos mitades). `plan-feature` 2.0.0 (**mayor**,
  incompatible) pasa a ser solo planificación de ingeniería: elimina el flag
  `--interview`, añade una **puerta de redirección sin flag de bypass**
  (feature sin diseñar → PARA → `/design-feature <slug>`), y se borra el paso
  interno `plan-feature-interview`. `plan-feature-from-issue` 1.3.0 y
  `plan-feature-scaffold` 1.5.0 se alinean a la convención de dos mitades. Nota
  de migración en `docs/workflow/MIGRATION.md`. Feature `06-design-feature`
  (backlog U3, cierra #13).

- **2026-07-09 — revisión adversarial con contexto limpio.** Endurece la
  revisión final obligatoria de fin de unidad contra el fallo de compartir
  contexto, donde la conversación que escribió un cambio también lo revisa:
  la postura de la Fase 1 de `review-implementation` 1.1.0 ahora es
  adversarial por defecto ("asume que el diff está MAL — prueba que no
  funciona"), y `review-change` 1.11.0 gana una casilla obligatoria en su
  turn contract que exige que la revisión final corra en una conversación
  que no implementó el cambio (si lo hizo, PARAR y hacer hand-off). Referencia
  la línea de preferencia de familia de modelo cruzada de la feature
  `04-running-economically` en lugar de repetirla. Feature
  `05-adversarial-context-clean-review`.

- **2026-07-05 — recuperación de caídas del orquestador.** Los drivers
  externos (incluidos servidores Node/opencode solo-REST) ganan una ruta de
  reinicio segura: `workflow-status` 1.1.0 clasifica los turnos
  interrumpidos desde la verdad del sustrato en `CLEAN | RESUMABLE |
  AMBIGUOUS` (mapeado a estados existentes del envelope — sin release del
  esquema) con un hint `--last-envelope` opcional y nunca autoritativo;
  `execute-phase` 1.13.1 enuncia la reentrada idempotente de fase como
  contrato explícito; `docs/workflow/ORCHESTRATION.md` gana el protocolo de
  reinicio del driver (journal de envelopes append-only → sensor → enrutar).
  Feature `03-orchestrator-crash-recovery`.

- **2026-07-05 — revisión de rendimiento medida.** Los hallazgos de
  rendimiento pasan de "plausibles" a "medidos": `init-workspace` 1.8.0
  entrevista por el tooling de rendimiento del stack (lint de complejidad,
  harness de benchmarks, profiler — ejemplos TS/JS nombrados, contrato
  genérico para el resto) y registra los comandos en el nuevo bloque
  `Performance commands` de la plantilla; `review-perf` 1.1.0 ejecuta el
  bench declarado en base y cambio y cita ambos números, con banda de ruido
  explícita y un `n/a — no declared perf commands` explícito cuando no hay
  nada declarado. Feature `02-measured-perf-review`.

- **2026-07-05 — `generate-docs`: el workflow ahora produce documentación de
  desarrollador, no solo artefactos de proceso.** Skill nueva de cara al
  usuario que convierte el diff de una unidad en guías how-to en el sitio de
  docs del propio proyecto (adaptador descubierto; Starlight MDX como
  referencia, markdown plano como fallback), renderiza un mapa de
  conocimiento/llamadas desde un comando determinista declarado por el
  proyecto (el modelo nunca infiere aristas) y puede exportar informes de
  `review-change` como páginas (`--review`, opt-in). La protección anti-drift
  llega con ella: `execute-phase` 1.13.0 recomienda `/generate-docs` al
  cierre de unidad cuando hay bloque `Docs site` declarado, `audit-docs`
  1.7.0 detecta páginas generadas huérfanas/obsoletas por su frontmatter de
  procedencia, e `init-workspace` 1.7.0 pregunta por la declaración en la
  entrevista. Feature `01-generate-docs`.

- **2026-07-05 — `@gtrabanco/agentic-workflow-schema` 1.0.1: arreglos de
  review antes de que nadie construya sobre 1.0.0.** Una pasada de
  `review-change` sobre el paquete recién publicado encontró que el
  `validateEnvelope()` hecho a mano era estrictamente más laxo que
  `envelope.schema.json` (le faltaban checks de enum/tipo — un valor como
  `blockers[].scope: "planet"` pasaba en silencio), además de deuda de
  empaquetado/CI: dos lockfiles commiteados con solo npm cableado en la CI,
  un rango de devDependency que no fijaba nada de verdad pese a que su
  mensaje de commit decía lo contrario, una `LICENSE` ausente dentro del
  paquete, y un ejemplo del README incompatible con el propio
  `engines.node` declarado. Se arregló todo en vez de publicar con huecos
  conocidos: la validación de enum/tipo ahora coincide exactamente con el
  JSON Schema (con tests a través de la API pública `parseEnvelope()`, no
  solo del validador interno); la CI migró a Bun para instalar/testear
  (`bun.lock` es ahora el único lockfile; npm se mantiene solo para el paso
  de `publish` con provenance); se añadió `LICENSE` dentro del directorio
  del paquete; el README se arregló para funcionar en Node 18. Cierra las
  issues #5, #6, #7.

- **2026-07-05 — orquestación programática: el envelope máquina.** El workflow
  pasa a poder dirigirse desde FUERA de cualquier agente — la sustitución
  neutral de proveedor del `/loop` y los subagentes de Claude Code. Toda skill
  de cara al usuario termina ahora con un **envelope máquina** JSON fijo (11
  estados, unit/phase/pr/findings/blockers/dependencies/next + pista de tier
  de modelo; esquema en la nueva skill interna `orchestration-envelope`); un
  driver lo parsea y elige el siguiente comando y modelo por paso
  (`docs/workflow/ORCHESTRATION.md` — máquina de estados, esqueleto de driver,
  sustitución de subagentes). Nueva skill sensor **`workflow-status`**: árbol
  de dependencias completo de features/fixes, unidades arrancables con orden
  de construcción, fixes/triaje pendientes, estados de auditoría. `audit-pr`
  2.1.0 además publica un **comentario MERGE-READY datado y ligado al SHA en
  el PR** (nunca una etiqueta en el mensaje de commit). `ship-roadmap` 1.10.0
  se vuelve neutral de driver y dice POR QUÉ termina cada iteración. 12 skills
  con bump menor + 2 skills nuevas. El contrato también se distribuye como el
  paquete npm **`@gtrabanco/agentic-workflow-schema`** (tipos + JSON Schema +
  `parseEnvelope()`), publicado automáticamente por CI (`publish-schema.yml`)
  cuando su versión sube — el esquema y el paquete cambian en la misma PR,
  siempre.

- **2026-07-04 — los cuerpos del forge son Markdown, no shell.** Evidencia de
  campo (gtrabanco/webs#198): issues/PRs/comentarios generados llegaban con
  `` \`code\` `` literal — el agente escapaba los backticks a mano y luego pasaba
  el cuerpo por un heredoc entre comillas / comillas simples, donde el `\`
  sobrevive hasta el Markdown renderizado. Arreglado en la fuente en cada skill
  que escribe en el forge: el cuerpo se escribe a un fichero y se pasa con
  **`--body-file`**, nunca un `--body "…"`/heredoc inline, con verificación tras
  crear. `execute-phase` 1.11.0 (PRs + issues de `--fix` + casilla del contrato
  de turno), `triage-issue` 1.7.0 (comentarios datados), `ship-roadmap` 1.9.0
  (issues del barrido + guardrail), `review-change` 1.9.0 (no pre-escapar el
  texto de los hallazgos), `plan-feature-scaffold` 1.4.0 (tarea de cierre del
  TASKS generado). La regla también se siembra en las Workflow conventions de la
  plantilla (`template/CLAUDE.md`) para que todo proyecto que la adopte la
  herede. Peor en unos agentes que en otros — de ahí la regla explícita en
  formato checklist.
- **2026-07-04 — v3: la rama por defecto pasa a ser agnóstica de modelo.**
  Cambio incompatible de distribución. `main` (instalación por defecto, sin
  `#ref`) es ahora lo que antes era `#inheritance`: ninguna skill lleva
  frontmatter `model:`/`effort:`, así que cada skill hereda el modelo y el
  effort de la sesión del agente anfitrión. La distribución opinionada
  anterior, ajustada a mano por skill, se traslada a una nueva rama
  **`#claude`** (una instantánea congelada del `main` pre-v3, mantenida al
  día por la CI desde `docs/workflow/model-routing.yml`, la nueva fuente de
  verdad de sus tiers). `#inheritance` sigue funcionando, con force-push como
  espejo exacto de `main` en cada push
  (`.github/workflows/sync-derived-branches.yml`, sustituyendo a
  `sync-inheritance.yml`). Motivo: usar este workflow no debería atar un
  proyecto al catálogo de modelos de un único proveedor — el usuario elige el
  modelo, las skills aplican la disciplina. Las 25 skills recibieron un bump
  (parche, mecánico: frontmatter trasladado + la guía sobre modelos no-Claude
  en la descripción sustituida por un puntero a `#claude`); `bump-skill`
  1.4.0 (menor: el paso 7b ahora mantiene `model-routing.yml` en vez de un
  frontmatter que ya no existe en `main`). Ver `docs/workflow/MIGRATION.md`
  para la nota de actualización completa.

- **2026-07-04 — disciplina de cierre + continuidad con issues.** Evidencia de
  campo: runs que dejaban fixes de hallazgos sin commitear/pushear (descubiertos
  tras el merge), docs de fin de unidad sucias, sin enlace del PR en el chat, y
  `ship-roadmap` parándose en la última feature con issues abiertas. Arreglos:
  `execute-phase` 1.10.0 (casilla de árbol limpio, push inmediato tras cada commit
  con PR abierto, ciclo explícito de plegado de hallazgos); `review-change` 1.8.0
  (árbol sucio / commits sin push = hallazgos `workflow` fix-now); `audit-pr`
  **2.0.0** (el veredicto lleva siempre la URL completa del PR; auto-merge opt-in —
  política documentada + checklist pre-merge fail-closed, trabajo pendiente → push,
  esperar CI, re-auditar); `ship-roadmap` 1.8.0 (barrido de issues tras la última
  feature — inventario + triaje de issues abiertas y residuo documentado, fix-now
  entregadas por las mismas etapas, `SHIP: COMPLETE` lo exige; check de cierre
  limpio por etapa).

- **2026-07-03 (5) — los detectores auditan la disciplina.** Las skills
  ejecutoras imponen las reglas del workflow al escribir; ahora las detectoras
  verifican que de verdad se cumplieron, mecánicamente (ejecuta el comando,
  nunca infieras — lo que un modelo frontier asume, a un modelo abierto hay que
  decírselo): `audit-docs` 1.5.0 gana los checks de disciplina 10-13 (nombrado
  de fases, docs por fase, disciplina de rama/PR contra el forge, formato de
  commits + cierres de dependencias); `product-audit` 1.6.0 estrena la
  dimensión explícita de disciplina del workflow componiéndolos;
  `review-change` 1.7.0 corre un check mecánico de disciplina en cada
  checkpoint (eje `workflow`); `audit-pr` 1.5.0 bloquea si una fila done no
  lleva su enlace de PR.

- **2026-07-03 (4) — cierre de PR explícito.** Evidencia de campo (runs de
  Hermes dejaban filas del roadmap como `done` a secas mientras Claude producía
  `done · #51`): abrir el PR tiene ahora un cierre deletreado — **imprimir la
  URL del PR en el chat** (no todos los agentes muestran PRs abiertas) y
  **enlazar la fila del roadmap/índice** (`done · [#<pr>](url)` con un commit
  `docs: link PR`). El TASKS.md generado termina con estas tareas literales.
  execute-phase 1.9.0, plan-feature-scaffold 1.3.0, ship-roadmap 1.7.0.

- **2026-07-03 (3) — precedencia de idioma de artefactos.** Que los modelos
  abiertos escriban PRs e issues en el idioma de la conversación (prompt en
  español → PR en español) queda bloqueado por una precedencia fijada en los
  contratos de turno de toda skill que escribe artefactos: **instrucción
  explícita del usuario > idioma de docs declarado del proyecto > inglés — el
  idioma de la conversación nunca decide.** Bumps: execute-phase 1.8.0,
  plan-fix 1.3.0, plan-feature 1.5.0, triage-issue 1.6.0, ship-roadmap 1.6.0,
  log-session 1.3.0, init-workspace 1.5.0; la regla Docs language de la
  plantilla enuncia ahora la precedencia.

- **2026-07-03 (2) — contratos de turno (fiabilidad en modelos débiles).** Las
  pruebas de campo con modelos abiertos destaparon deberes de fin de turno
  omitidos: trabajo implementado sin commitear, PRs sin abrir o sin cuerpo,
  trabajo en la rama por defecto, bloques de cierre ausentes. Toda skill de cara
  al usuario ABRE ahora con un **`## Turn contract`** — las casillas que cada
  invocación debe marcar antes de poder terminar el turno; el de `execute-phase`
  1.7.0 es el más estricto (check de rama → gate → sha del commit → push+PR con
  cuerpo obligatorio, todo realmente EJECUTADO y pegado; push exactamente una
  vez, en el paso del PR). Nueva regla de autoría en CLAUDE.md + lint en
  bump-skill. Bumps menores: execute-phase 1.7.0, review-change 1.6.0, audit-pr
  1.4.0, product-audit 1.5.0, audit-docs 1.3.0, triage-issue 1.5.0, plan-feature
  1.4.0, plan-fix 1.2.0, init-workspace 1.4.0, log-session 1.2.0, ship-roadmap
  1.5.0, bump-skill 1.3.0.

- **2026-07-03 — seguridad de dependencias.** `execute-phase` 1.6.0 gana un
  **gate de dependencias** duro: el cierre transitivo de `Depends on:` debe
  estar fusionado antes de empezar — las cadenas sin cumplir imprimen un bloque
  BLOCKED fijo con el orden de construcción, y el nuevo flag `--force` salta la
  parada (registrado en `decisions.md`, nunca silencioso). El SELECT de
  `ship-roadmap` 1.4.0 pasa a lista de prioridad fija (fixes fix-now
  bloqueantes → etapas en curso → features con cierre fusionado transitivamente;
  estados de roadmap inconsistentes detienen el run; `--force` prohibido para el
  autopilot). `plan-feature` 1.3.0 comprueba deps e issues fix-now bloqueantes
  tras planificar y enruta el bloque de cierre a la cadena de dependencias /
  `plan-fix` primero.

- **2026-07-02 — workflow estricto y agnóstico del modelo + pack de revisión propio.**
  Tres reglas de autoría nuevas en `CLAUDE.md`: **checklists sobre heurísticas +
  contratos de salida fijos** (todo veredicto termina en PASS|FAIL /
  MERGE-READY|BLOCKED; listas Allowed/Forbidden acotan el alcance; "if needed"
  queda prohibido), **revisiones autocontenidas** (el nuevo pack interno de 9
  skills `review-code/-security/-verify/-debt/-design/-a11y/-brand/-perf/-seo`
  cubre todos los ejes — las skills externas son extras opcionales, nunca
  dependencias) y un **contrato de equivalencia de modelos** (los tiers de Claude
  siguen siendo los defaults; el README los mapea a clases de capacidad genéricas
  y toda descripción de cara al usuario indica editar `model:`/`effort:` para
  modelos no-Claude). Los proyectos además declaran su **workflow de git**
  (branches por defecto — una unidad activa, sin worktrees — o worktrees) en la
  plantilla, la entrevista de `init-workspace` y la Ronda 5 de `ship-roadmap`.
  Bumps: `execute-phase` 1.5.0, `review-change` 1.5.0, `product-audit` 1.4.0,
  `init-workspace` 1.3.0, `triage-issue` 1.4.0, `audit-docs` 1.2.0,
  `ship-roadmap` 1.3.0; parches de descripción: `plan-feature` 1.2.1, `plan-fix`
  1.1.1, `audit-pr` 1.3.1, `log-session` 1.1.1, `bump-skill` 1.2.1; 9 skills
  internas nuevas en 1.0.0.

- **2026-07-02 — hardening de portabilidad (agentes más allá de Claude Code).**
  Nueva regla de autoría en `CLAUDE.md`: toda skill de cara al usuario lleva una
  sección **`## Portability (agents other than Claude Code)`** — el workflow es el
  contrato; las features de Claude Code (menú slash, `model:`/`effort:` por skill,
  `/loop`, subagentes, hooks) son conveniencias con fallbacks genéricos explícitos
  (sin menú slash → seguir el `SKILL.md` objetivo en una conversación nueva; sin
  tiers de modelo → el modelo más fuerte para planificar/revisar/auditar, uno más
  barato para ejecutar, y nunca revisar con un modelo más débil que el que escribió
  el cambio; sin `/loop`/subagentes → re-invocación manual guiada por el bloque de
  cierre `→ Next:`). Las referencias específicas de Claude Code en los cuerpos van
  ahora emparejadas inline con su equivalente genérico. Bumps menores en todo el
  conjunto: `execute-phase` 1.4.0, `review-change` 1.4.0, `ship-roadmap` 1.2.0,
  `log-session` 1.1.0, `product-audit` 1.3.0, `plan-feature` 1.2.0, `plan-fix`
  1.1.0, `audit-pr` 1.3.0, `audit-docs` 1.1.0, `triage-issue` 1.3.0,
  `init-workspace` 1.2.0; `bump-skill` 1.2.0 lintea la nueva regla.

- **2026-06-27 — hardening del workflow (next-step canónico + nombrado de fases).**
  Dos reglas de autoría a nivel de repo añadidas a `CLAUDE.md` y aplicadas a todo el
  conjunto: (1) toda skill cierra con un **bloque canónico `→ Next:`** (un comando
  recomendado + alternativas abiertas `·`) — al terminar una unidad apunta a la
  siguiente (`plan-feature --next` / un issue concreto), y una inconsistencia
  **recurrente** enruta a `product-audit`; (2) las fases del plan siempre son
  **`P1, P2, …` ("fases"), nunca `S1`/"Steps"**. Routing nuevo: bloque post-merge de
  `audit-pr` (1.2.0); `review-change` (1.3.0) y `triage-issue` (1.2.0) recomiendan
  `product-audit` solo ante deriva *recurrente*; `bump-skill` (1.1.0) lintea ambas
  reglas. Parches de nombrado/cierre: `execute-phase` 1.3.1, `plan-feature-scaffold`
  1.1.1, `plan-feature` 1.1.1, `plan-fix` 1.0.3, `product-audit` 1.2.2, `audit-docs`
  1.0.5, `init-workspace` 1.1.2, `log-session` 1.0.1, `ship-roadmap` 1.1.1. Ambas
  plantillas SPEC + `template/CLAUDE.md` llevan la convención de nombrado. Conjunto sin
  cambios en 16 skills.
- **2026-06-19 — `log-session` 1.0.0.** Nueva skill de diario de sesión (`docs/LOGS.md`) + hooks gratuitos y opt-in en `template/.claude/` (captura mecánica en SessionEnd, marcador en SessionStart, restauración de contexto opt-in — todos sin modelo). Conjunto → 16 skills (12 de cara al usuario + 4 internas).
- **2026-06-19 — `bump-skill` 1.0.0.** Nueva skill de mantenimiento del repo: tras editar un SKILL.md, sube la `version:`, añade filas en CHANGELOG.md + CHANGELOG.es.md y actualiza README.md + README.es.md. Eliminado `docs/features/ROADMAP.md` huérfano (contenido ficticio de e-commerce, vocabulario antiguo).
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
