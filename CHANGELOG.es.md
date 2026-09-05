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
| 4.0.0 | 2026-09-04 | mayor | **Eliminación de vocabulario (feature 161):** la skill retirada `loop-review-fold` se elimina del contrato de máquina publicado — la unión `WorkflowIntent` y `WORKFLOW_INTENTS` ya no la listan, su fila en `WORKFLOW_TRANSITION_TABLE` y cada entrada `allowed` se borran, su perfil de capacidad y el manejo en `nextIntent`/`parseNativeTurn` se eliminan, y el enum de intents de `skill-outcome.schema.json` ya no la anuncia. Rompe para cualquier ABI que aún enrute o valide el intent retirado `loop-review-fold`; ejecutar `npm run build` / `bun run test` para regenerar. |
| 3.5.0 | 2026-08-30 | menor | **Contratos de evidencia pre-ejecución** (feature 28, #146): `PreExecutionArtifactSnapshot v1` y `PreExecutionReviewReceipt v1` se publican como contratos de cable ligados al contenido detrás del validador autoritativo de snapshots (`validatePreExecutionArtifactSnapshotV1`), el validador independiente de buena formación de receipts (`validatePreExecutionReviewReceiptV1`) y la única entrada que bendice un veredicto (`validatePreExecutionReceiptAgainstSnapshot`, que liga frescura de etapa/política/digest-del-snapshot, exclusión de autor, topología de padres y coherencia PASS/hallazgos-materiales), más canonizadores, digests (`canonicalize*/digest*PreExecution*`) y el predicado de frescura `comparePreExecutionReceiptToSnapshot` con códigos de motivo cerrados; cada entrada de pre-ejecución —constructor, canonizadores, resúmenes, bendición y frescura— responde de forma síncrona, el único estilo de llamada que implica el constructor síncrono de AC2. Una definición interna canónica (`src/pre-execution-contract.ts`) respalda ambos contratos; los dos archivos `pre-execution-*.schema.json` son proyecciones Draft-07 generadas **no autoritativas** con verificación de deriva, que llevan las reglas proyectables (matriz veredicto/etapa, topología de padres, filas de padres únicas) y revelan las solo-runtime en `$comment`. El serializador canónico compartido se muda a `src/canonical-json.ts` (un walker para las familias candidate, verification y pre-execution; el comportamiento legacy de hojas de 3.3.0 sigue siendo idéntico byte a byte, y el mensaje `D14` de presupuesto excedido de la familia de verificación se conserva). Extensión aditiva del decisor: `review-spec` y `review-plan` entran en el vocabulario de intents, la tabla de transiciones y los perfiles de capacidad (ambos `reviewer`/`critical`/solo-lectura) sin cambiar el significado de ningún intent existente. |
| 3.4.0 | 2026-08-27 | menor | **Contratos de verificación por etapas** (feature 26, #139, PR #145): `VerificationPlan v1` y `VerificationReceipt v1` se publican como contratos de cable detrás de exactamente **dos** entradas públicas autoritativas de validación (`validateVerificationPlanV1`, `validateVerificationReceiptAgainstPlan`) más el predicado de frescura `compareVerificationReceiptToCurrent`; una definición interna canónica (`src/verification-contract.ts`) respalda ambas, y los dos archivos `verification-*.schema.json` son proyecciones Draft-07 generadas **no autoritativas** con verificación de deriva. Añade los límites D14 de capacidad/bytes/tiempo (128 comandos, 64 argumentos por comando, presupuestos por etapa, gate p95 de 100 ms) y la forma D16 de diagnósticos acotados y redactados, una suite bilingüe de documentación de 24 casos y un script de calificación. Release aditivo: los cinco esquemas de contratos preexistentes son idénticos byte a byte a los de 3.3.0 **y** las exportaciones `canonicalize*`/`digest*` anteriores a feature 26 mantienen un comportamiento idéntico — la negativa nombrada `unsupported leaf` que se añadió al endurecer el núcleo canónico compartido queda acotada a los canonizadores de verificación de feature 26, de modo que una hoja `function`, `symbol`, `undefined`, `bigint` o un número no finito se sigue serializando exactamente como en 3.3.0 en la vía legacy (fijado con vectores dorados capturados de la compilación de merge-base). |
| 3.3.0 | 2026-08-23 | menor | Núcleo canónico de vinculación de contenido: `canonicalizeCandidateSnapshot()` y `canonicalizeReviewReceipt()` (hallazgos ordenados por orden de bytes de `id`), `digestCandidateSnapshot()` / `digestReviewReceipt()` (SHA-256 sobre bytes canónicos), `computeAcceptanceFingerprint()` sobre las filas ordenadas `{id, blobSha256}` y `compareReceiptToCurrentSnapshot()` con los cinco códigos de frescura D1, más `STALE_REASON_CODES` y `CANONICAL_VECTORS` congelados. Las secciones bilingües del README incluyen la advertencia de que validez no es corrección; 19 pruebas nuevas fijan determinismo, forma canónica y frescura. |
| 3.2.0 | 2026-08-22 | menor | Documenta el decisor de transiciones de workflow para drivers: la guía de `decideWorkflowAction` con el ejemplo de elisión segura, el ejemplo de fallback obligatorio y la lista de puntos de sensor, espejado en ambos idiomas del README (feature 24, P4). |
| 3.1.0 | 2026-08-22 | menor | Perfiles de capacidad: los vocabularios cerrados se publican como arrays congelados de solo lectura con uniones derivadas, `WorkflowSkillProfile` gana un objeto opcional `capabilities` (rol, clase de razonamiento, efectos máximos, fuentes de contexto, evidencia requerida), los 12 perfiles integrados se llenan desde la tabla auditada, y un consumidor consciente de capacidades debe cerrar fallando cuando no esté. Cierra #136. |
| 3.0.0 | 2026-08-21 | mayor | **Contrato de driver incompatible:** añade parseo estricto de Envelope v2, SkillOutcome v1 compacto, WorkflowSnapshot v1 determinista, validadores públicos, perfiles, diagnósticos de compatibilidad y los tres JSON Schema publicados. `workflow-status` conserva Envelope v2; las skills de trabajo conducidas pasan al resultado compacto. Ver `docs/workflow/MIGRATION.es.md`. |
| 1.0.2 | 2026-07-12 | parche | Solo republish — lleva el README actual (la referencia campo a campo del envelope de #44, la tabla de ruteo de `state` cerrado/abierto y la guía de orquestación de workflows dinámicos, fusionados en el commit `0087dc6` en `1.0.1`) a npm. Esa ampliación del README llegó a `main` *después* de que npm publicara `1.0.1` el mismo día, así que quedó sin publicar; `publish-schema.yml` solo republish cuando sube la versión. Sin cambios de código, `src/`, `dist/` ni `envelope.schema.json`. Las reescrituras de redacción de #33 ya estaban en `1.0.1` (verificado contra el tarball publicado). |
| 1.0.1 | 2026-07-05 | parche | `validateEnvelope()` ahora comprueba todos los enums/tipos que declara el JSON Schema (`unit.type`, `pr.state`/`.ci`, `gates.verification`, `blockers[].kind`/`.scope`, tipos de los elementos de arrays) — antes era más laxo que `envelope.schema.json`, así que un valor malformado como `blockers[].scope: "planet"` pasaba en silencio. Tests añadidos para la ruta de fallo de validación estructural a través de `parseEnvelope()` y para fences con CRLF. La CI (`publish-schema.yml`) migró a Bun para instalar/testear (`bun install --frozen-lockfile`; se elimina `package-lock.json`, `bun.lock` es el único lockfile) — npm se mantiene solo para el paso final `npm publish --provenance`. Se añadió `LICENSE` dentro del directorio del paquete (el auto-include de npm solo recoge una LICENSE de la propia carpeta del paquete publicado). El ejemplo de importación del JSON Schema en el README se corrigió para funcionar en el `engines.node: ">=18"` declarado (antes solo funcionaba en Node 20.10+/22). |
| 1.0.0 | 2026-07-05 | — | Primer release publicado. Tipos, JSON Schema y `parseEnvelope()`/`validateEnvelope()`/`isTerminal()`/`isRunHalt()` para el envelope máquina de agentic-workflow. |

#### [`@gtrabanco/pi-agentic-workflow`](packages/pi-agentic-workflow/)
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 0.4.2 | 2026-09-05 | parche | **Parsear descripciones YAML plegadas/literales en el catálogo de comandos** (fix #165): `readSkillMeta()` ahora lee los escalares de bloque `description:` de YAML, de modo que cada slash command de las skills incluidas registra su descripción plegada real en lugar del literal `">"`; un fixture de regresión fija la descripción parseada de una skill real a su texto de frontmatter. |
| 0.4.1 | 2026-09-04 | parche | **Actualizar nota de línea base verificada a pi 0.85.0** (fix #166): actualiza la nota de línea base del README de 0.84.3 a 0.85.0 con la fecha 2026-09-04; añade `@earendil-works/pi-server@0.85.0` como devDependency para cubrir la cadena de re-exportación eager de pi 0.85.0 (`main` → `experimental/server` → `@earendil-works/pi-server`); vuelve a ejecutar todo el conjunto verde (134/134) en 0.85.0.
| 0.4.0 | 2026-09-04 | menor | **Publica el re-empaquetado de skills de fix-161 que 0.3.0 dejó sin publicar** (PR #163 se fusionó sin subir la versión, así que el gate de publicación saltó y npm se quedó en 0.3.0): re-empaqueta las 12 skills actualizadas y retira `loop-review-fold` de la lista de comandos (38 skills incluidas; el paquete de esquemas pasó a 4.0.0 en la misma PR por la misma eliminación de vocabulario), con `review-change` 3.2.1 (renumeración de pasos del proceso tras reordenar la pasada de verificación) y las actualizaciones de research-gate/hallazgos firmados en el pack de revisión (`review-code`, `review-implementation`, `review-spec`, `review-plan`, `triage-issue`, `ship-roadmap`, `fold-findings`, `plan-feature-scaffold`, `plan-fix`, `pre-execution-review`, `verification-contract`). Sin cambios de código del paquete — el bump existe solo para que la CI publique el re-empaquetado ya fusionado. |
| 0.3.0 | 2026-09-03 | menor | **Bucle revisión→fold acotado** (fix #159, dogfood de #158): re-empaqueta las 16 skills que acotan el bucle revisión/fold — `review-change` 3.0.0 (hallazgos low solo-informe, estado del workspace = precondición `REVIEW BLOCKED`, re-verificación de filas plegadas, commit del añadido al ledger), `loop-review-fold` 4.0.0 (tope de dos ciclos), `review-implementation` 1.6.0, `review-spec`/`review-plan` 1.4.0 (mapa clase→resolvedor), `log-session` 2.1.0 (palabras de estado verificadas contra el forge), `verification-contract` 1.1.0 (estabilidad del validador), `evidence-grounding` 1.5.0 (disciplina de afirmaciones) y la barra de materialidad del pack de revisión de 9 skills. |
| 0.1.0 | 2026-08-30 | — | Primer release (feature 27, PR #150): un `pi install npm:@gtrabanco/pi-agentic-workflow` incluye las skills canónicas byte a byte, registra un slash command amigable por cada skill pública (la lista se lee de las skills incluidas al arrancar), añade `/agentic-workflow-settings` y un enrutado opcional de modelo/thinking por comando — config JSON global + de proyecto, rutas no disponibles fallan cerradas, restauración de la sesión en un comando y un aviso de configuración solo la primera vez. Se publica con `publish-pi-package.yml` (npm Trusted Publishing, el mismo patrón que el paquete de esquemas). El paquete se gestiona con bun como el paquete de esquemas: `bun.lock` es el único lockfile y `test/lockfile-policy.test.mjs` rechaza un `package-lock.json` resucitado. |
| 0.2.0 | 2026-08-31 | minor | **Revisión evidenciada de SPEC/Plan** (feature 28, #146): añade `review-spec` y `review-plan` como puertas públicas separadas con validaciones progresivas de evidencia/listo, snapshots exactos de Product/Plan, revisiones causales de autoría, evidencia-planning compacta y registro de obligaciones, reparación de hallazgos en lote único, diagnóstico de convergencia en segundo ciclo, enrutamiento de causa-raíz hacia atrás y paridad canónica con Pi. Skill pre-execution-review con ruta de adopción legacy, ledger planning-obligations, receta de digest SNAPSHOT, script bundle pre-execution-snapshot. Todas las skills incluidas y probadas; 39 skills en total. Actualiza paquete de esquemas a 3.5.0 (contratos de evidencia pre-ejecución, feature 28) y paquete Pi a 0.2.0. |

### Sesión

#### `log-session`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.1.0 | 2026-09-03 | menor | Las palabras de estado (`merged`, `closed`, `approved`) se verifican contra el forge en el mismo turno (`gh pr view <N> --json state,mergedAt`) antes de escribirse — un log que registra un estado que el forge contradice es un registro falso que la siguiente revisión debe perseguir (fix #159, la afirmación falsa de "merged" del F14 de fix #157). |
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

#### `discover-repository-state`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.2.1 | 2026-08-30 | parche | La pista de próxima acción para `planned` dice ya que planificado no es ejecutable: `/execute-phase` solo mientras el `PLAN-REVIEW-PASS` de la unidad esté vigente, si no `/review-plan`. |
| 1.2.0 | 2026-08-09 | menor | Enruta el trabajo listo para implementar a `execute-phase` solo-con-objetivo, evitando que el nuevo default de unidad completa vuelva accidentalmente a `P1` explícita. |
| 1.1.2 | 2026-07-31 | parche | Enruta un snapshot contradicho a `resolve-repository-state` antes de recomendar la planificación. |
| 1.1.1 | 2026-07-31 | parche | Elimina el argumento `--refresh` no declarado y aclara que discovery conserva separada cada categoría del ledger. |
| 1.1.0 | 2026-07-31 | minor | Conserva el estado `contradicted` del snapshot cuando discovery registra un conflicto en vez de congelar contradicciones sin resolver. |
| 1.0.0 | 2026-07-30 | — | Nueva skill: descubre hechos respaldados por evidencia y congela el Estado Normalizado del Repositorio sin hacer recomendaciones. |

#### `resolve-repository-state`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.2.1 | 2026-08-30 | parche | La pista de implementación interrumpida queda condicionada al mismo `PLAN-REVIEW-PASS` vigente. |
| 1.2.0 | 2026-08-09 | menor | Reanuda la implementación interrumpida mediante `execute-phase` solo-con-objetivo; la selección de fase explícita sigue disponible para el usuario. |
| 1.1.1 | 2026-07-31 | parche | Enruta los resultados `needs-input` hacia la evidencia o decisión pendiente en vez de recomendar la planificación. |
| 1.1.0 | 2026-07-31 | minor | Se detiene sin congelar cuando una contradicción necesita input humano, manteniendo el snapshot contradicho hasta recibir evidencia o una decisión. |
| 1.0.0 | 2026-07-30 | — | Nueva skill: único escritor para resolver contradicciones explícitas y publicar el siguiente snapshot congelado. |

#### `generate-docs`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 2.0.1 | 2026-08-02 | parche | Divide el descubrimiento de adaptador, la generación y los slots del adaptador en rutas explícitas de un salto y acorta prosa repetida de activación sin cambiar los contratos de páginas, mapa, exportación de review ni verificación. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Ver `docs/workflow/MIGRATION.md`. |
| 1.0.0 | 2026-07-05 | — | Skill nueva: documentación de desarrollador incremental, guiada por diff, escrita en el sitio de docs del propio proyecto mediante un adaptador descubierto (declaración → Starlight → Docusaurus → fallback markdown; NOT-CONFIGURED → NEEDS_INPUT, nunca adivina). Forma de página fija + frontmatter de procedencia (`generated-by`/`source-unit`/`updated`), mapa de conocimiento solo desde un comando determinista declarado por el proyecto (el modelo nunca infiere aristas), export opt-in `--review` de informes de `review-change`, paso de verificación (build de docs o chequeo de enlaces). Nunca crea el sitio, nunca edita código, nunca commitea. |

#### `workflow-status`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 3.1.0 | 2026-09-01 | menor | **La revisión obligatoria ahora se prueba, no se infiere.** El paso 8 liga `review_pending` a la **marca durable de revisión** de la unidad —la fila `REVIEW-RAN` de su ledger `review-findings.md`, cuya forma y escritor define `LEDGERS.md` de `pre-execution-review`— leída en el head actual de la unidad: una marca que dejó un commit más antiguo está obsoleta y nunca prueba nada. Se borra la regla que sustituía (la presencia del ledger, con cualquier fila, probaba que `review-change` corrió): una reseña sin hallazgos no escribe filas de hallazgo, así que la presencia llamaba no revisada a una unidad limpia y podía llamar revisada a una que nadie revisó. `PRE_EXECUTION.md` enuncia la misma clave. Etiquetas, anulaciones y el sobre no cambian; una unidad cuyo ledger precede a la marca queda como revisión pendiente hasta que corra una. Validador: `scripts/workflow-status-pre-execution.test.mjs` (AC20/O20). |
| 3.0.3 | 2026-09-01 | parche | Reparación del lote RS: el paso pre-ejecución del sensor nombra el `--parent` que necesita la comprobación de plan de una unidad **feature** y la excepción para las unidades **fix**, y lee `structural.reasonCode` + `structural.changedPaths` del JSON de `verify`, de modo que el paso que etiqueta un recibo como `stale` puede nombrar qué archivo vinculado se movió en lugar de reportar siempre `missing-receipt-snapshot` (hallazgos RS13, RS14; D29, D30). Etiquetas, anulaciones y el sobre no cambian. |
| 3.0.2 | 2026-08-31 | parche | Reparación del pliegue (F16): el paso de lectura de recibos del sensor nombra los campos de autor reales (`reviewer` + `authorId` en las líneas `Reviewer:`/`Author:` del recibo, y `authorExclusion`) en lugar de los fantasma `reviewedBy`/`authorExcluded`. Sin cambio de etiquetas ni del envelope. |
| 3.0.1 | 2026-08-31 | parche | Reparación del pliegue (F1): la cláusula de receta del paso 6a re-deriva el digest ligado con el modo verify del dueño de la receta (`node scripts/pre-execution-snapshot.mjs verify --stage <spec\|plan> --unit <id>`) en lugar de `git hash-object`, que las autoridades de la misma rama definen como nunca sustituto de un digest de snapshot. Sin cambio de etiquetas, de la anulación del paso 6 ni del envelope. |
| 3.0.0 | 2026-08-30 | mayor | **Recomendación que rompe:** el enrutado por solo-estado pasa a enrutado por evidencia. El nuevo paso 6a lee el bloque de recibo de pre-ejecución de la unidad, recalcula el digest ligado con `git hash-object` y etiqueta el escalón `current | missing | stale | wrong-stage | substitute | self-approved | author-readiness | legacy`; la etiqueta anula la orden del paso 6, así que una unidad sin un PASS vigente para el escalón que va a atacar sale de `startable_now` y pasa a un bloqueador `gate` que nombra la revisión que falta, con una fila `detail.pre_execution[]` por unidad. Sigue de solo lectura: no archiva ni edita nada. |
| 2.0.0 | 2026-08-21 | mayor | **Contrato de sensor incompatible:** mueve las candidatas a diseño de la extensión raíz antes documentada a `detail.design_candidates`, la única ubicación Envelope v2 estricta. Los drivers deben usar la ruta de parser/migración del paquete v3. Ver `docs/workflow/MIGRATION.es.md`. |
| 1.10.0 | 2026-08-09 | menor | Las recomendaciones de unidades planificadas ahora emiten `execute-phase` solo-con-objetivo, conservando la ruta por defecto de todas las fases restantes para humanos y drivers externos. |
| 1.9.0 | 2026-07-31 | menor | Carga progresiva: el cuerpo de activación es ahora una ruta compacta del sensor de solo lectura; secuencia de comandos, recuperación de caídas, campos del envelope, guardrails y portabilidad viven en recursos de un salto con orden obligatorio. |
| 1.7.0 | 2026-07-19 | menor | Fix #79: cuatro nuevos pasos de proceso (10-13) añaden a cada entrada `detail.features[]`/`detail.fixes[]` señales por-unidad `review` (`last_checkpoint_sha`, `unreviewed_diff`, `terminal_done` reutilizado del cómputo existente de `review_pending`, `adversarial: {ran, n}` — honestamente `null` salvo evidencia real, nunca adivinado), `closure.state` (reutilizando el propio grep de `audit-pr`), e `issues_born: {n, with_descope_amendment}` (reutilizando la detección de scope-bleed de `audit-pr`, ampliada por #79/#89) — opaco al esquema, sin cambio de paquete (mismo precedente que `detail.urgent`). Nuevo `next.suggested[]` de nivel superior (`{command, trigger, source_skill}`, opcional) muestra los triggers disparados de `execute-phase`/`review-change`/`audit-pr`/`fold-findings`, cada uno citando la condición de su propia skill dueña — solo consultivo, nunca reemplaza `next.recommended`/`next.tier`. Reflejado en `packages/agentic-workflow-schema` 2.1.0 (misma PR). |
| 1.6.1 | 2026-07-14 | parche | El paso 11 (backlog de issues sin triar) se reescribe: la etiqueta de disposición `postponed`/`promoted`/`wontfix` (propiedad de `triage-issue`, protegida por permiso triage+, imposible de falsificar) pasa a ser la señal de triado **autoritativa**; el comentario `VERDICT:` se mantiene como **fallback heredado** explícito para issues triados antes de que existiera la etiqueta, con una nota de residual aceptado (un comentario falseado todavía puede infra-contar el backlog — sin impacto de privilegios/inyección, `detail.urgent` intacto). Sin cambio de forma — `detail.untriaged_issues: {count, oldest_open}` no cambia. Parte del fix `#54`. |
| 1.6.0 | 2026-07-13 | menor | Nuevo paso de proceso 9 (renumera 9→14 a 10→14): lee el ledger de fold fix-now `review-findings.md` de cada unidad en curso y emite sus filas `folded: no` como items estructurados `findings.fix_now[]` `{id, file, axis, severity, class, route, suggested_tier}`, `suggested_tier` derivado por una tabla fija (severidad `high` O un axis sutil → `strong`; si no, `cheap`). `next.tier` sin cambios. El chequeo "review report present" del paso 8 ahora también acepta la presencia del ledger como evidencia de que `review-change` corrió. Ejemplo de envelope actualizado con un item `fix_now` poblado. Paquete de esquema reflejado (bump mayor, cambio de forma incompatible) en la misma PR. Parte de la feature 17 (`finding-severity-routing`). |
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
| 5.1.0 | 2026-09-04 | menor | **Re-mapeo de la review del autopilot (fix #161, P3a):** la etapa REVIEW compone el camino manual review→fold `/fold-findings`, y luego un nuevo `/review-change`, en lugar del router retirado `loop-review-fold`; reutiliza un recibo exact-SHA vigente o revisa en contexto limpio, y enruta los hallazgos no resueltos a `triage-issue --prioritize-now`. `ADVANCE.md` y `MODEL_ROUTING.md` nombran el camino manual. |
| 5.0.0 | 2026-08-30 | mayor | **Orden de etapas que rompe:** el autopiloto avanza DISEÑO → REVIEW-SPEC → PLAN → REVIEW-PLAN → EJECUCIÓN → PR → REVISIÓN → AUDITORÍA, y una unidad `planned` solo llega a EJECUCIÓN cuando un `PLAN-REVIEW-PASS` vigente está ligado a sus bytes (unidades de fix: plan-fix → REVIEW-PLAN → EJECUCIÓN `--fix`). Ambas etapas de revisión corren en contexto limpio al nivel enrutado; `NEEDS-DESIGN` o una elección de producto no respondible aparca la unidad para el humano en lugar de adivinar, y ninguna etapa entre PLAN y EJECUCIÓN crea un issue de forja ni aplaza una obligación. La política de fusión no cambia — el humano, o el envoltorio `--fullauto` tras sus suelos registrados, sigue siendo dueño de la fusión. |
| 4.0.2 | 2026-08-21 | parche | Aclara que el conductor conserva su contrato de turno nativo `SHIP:`/`→ Next:`; los perfiles de resultado máquina del paquete se aplican a las skills worker y sensor que invoca. |
| 4.0.1 | 2026-08-09 | parche | Sin cambio de comportamiento: comprime activación, gates de descubrimiento, selección de rutas, relaciones y cierre para reducir contexto repetido. |
| 4.0.0 | 2026-08-09 | mayor | **Cambio incompatible:** EXECUTE recorre las fases restantes de cada unidad con contextos de worker baratos y limpios; REVIEW es una única etapa acotada `loop-review-fold`; el residuo del barrido queda como propuestas en vez de crear backlog. Ver `docs/workflow/MIGRATION.es.md`. |
| 3.2.0 | 2026-07-31 | menor | Fullauto ahora invoca el wrapper solo con identificadores de PR y ejecución; el wrapper deriva y verifica desde el forge el head, la base por defecto, la evidencia de auditoría ligada al SHA y la decisión fijada al head, sin confiar en entradas controladas por el invocador. |
| 3.1.1 | 2026-07-31 | parche | Enruta una fundación de repositorio existente invocada con `--fullauto` por la política de auditoría y merge, manteniendo las rutas de founding por defecto y greenfield sin recursos de auditoría. |
| 3.1.0 | 2026-07-31 | menor | La carga progresiva separa fundación, recuperación/selección de continuación, avance de etapa, política de runtime/merge, informe terminal, guardrails y portabilidad en rutas explícitas de un salto; el cuerpo principal conserva el contrato de turno y la selección de ruta. |
| 3.0.0 | 2026-07-31 | mayor | **Cambio incompatible:** `--fullauto` es ahora la única autoridad de merge automatizado y debe usar el wrapper transitorio fail-closed del repositorio tras un veredicto fresco de `audit-pr`; los comandos directos de merge siguen bloqueados, el estado del intento se limpia en cada salida y cada automerge correcto queda registrado mediante un comentario idempotente de PR ligado al SHA. |
| 2.3.0 | 2026-07-18 | menor | Etapa REVIEW: la cadencia del checkpoint para features `L`/marcadas como sensibles ahora se dispara con los tres triggers nombrados de `execute-phase` (límite de capa / acumulación / sensibilidad, referenciados desde `#77` en vez de repetidos) en lugar de un conteo fijo de "cada 2 fases", que se había recalibrado mal ~3x tras el lint de atomicidad de #64 que redujo el tamaño de fase. El piso obligatorio `--adversarial 2` y la falta de alineación con la cadencia advisory propia de `review-change` no cambian. Cierra #93. |
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
| 4.2.0 | 2026-09-04 | menor | **Re-mapeo del hand-off (fix #161, P3a):** los hand-offs de unit-loop y close-out recomiendan el camino manual `/fold-findings` → nuevo `/review-change` en lugar del router retirado `loop-review-fold`; `/audit-pr` sigue siendo la puerta de merge. `BATCH_AND_PORTABILITY.md`, `UNIT_LOOP.md`, `FOLDING.md` y `CLOSEOUT.md` nombran el camino manual. |
| 4.1.0 | 2026-09-03 | menor | `FOLDING.md` incorpora el espejo de inmutabilidad de tests (fix #161): el fold nunca edita la expectativa de un test existente para ajustarse al comportamiento — una reparación de setup mantiene las aserciones al menos tan fuertes y nunca toca expectativas. |
| 4.0.2 | 2026-09-01 | parche | Reparación del lote RS: la cláusula de verificación de la puerta pre-ejecución incluye el `--parent` que exige el plan de una unidad feature y declara que la unidad fix lo omite porque no vincula ninguno; la línea `Actual:` del bloque `PRE-EXECUTION GATE … BLOCKED` se rellena con `structural.reasonCode` + `structural.changedPaths` — la pregunta que hace el bloque («qué archivo vinculado cambió») ya la responde la herramienta (hallazgos RS3(c), RS13, RS14). |
| 4.0.1 | 2026-08-31 | parche | Reparación del pliegue (F1): la cláusula de detección de la puerta pre-ejecución re-deriva el digest con el modo verify del dueño de la receta en lugar de `git hash-object` (nunca sustituto de un digest de snapshot). Orden de la puerta, estados de fallo cerrado y semántica de `--force` sin cambios. |
| 4.0.0 | 2026-08-30 | mayor | **Preflight que rompe:** una nueva puerta de revisión pre-ejecución se sitúa entre la puerta de estado propio y el manifiesto de aceptación, y falla cerrado antes de cualquier edición ante un `PLAN-REVIEW-PASS` ausente, caducado o de escalón equivocado (unidades de fix: sobre su propio recibo). `--force` nunca cubrió esta puerta y tampoco ahora: anula paradas de orden que el humano puede reordenar, no un veredicto que solo un revisor independiente puede producir; refrescar, re-hashear o sustituir un recibo es falsificación, no recuperación. Las unidades `planned`/`in-progress` heredadas se adoptan con la regla común de adopción. El hueco inmediatamente después de la puerta y antes de la primera escritura queda reservado para el descubrimiento acotado de implementación de la funcionalidad 29. La guarda de descope trata ahora una fila del libro de obligaciones igual que un criterio de aceptación. |
| 3.0.1 | 2026-08-09 | parche | Sin cambio de comportamiento: comprime dispatch, presupuesto de contexto, carga progresiva, portabilidad, relaciones y cierre. |
| 3.0.0 | 2026-08-09 | mayor | **Cambio incompatible por defecto:** una invocación solo-con-objetivo de feature/fix ejecuta todas las fases restantes con un recibo de worker limpio por fase, reparaciones acotadas, aceptación congelada y sin reviews intermedias; `P<n>` explícito conserva la forma de una fase. Los hallazgos independientes son propuestas, nunca issues creados automáticamente. Ver `docs/workflow/MIGRATION.es.md`. |
| 2.13.2 | 2026-08-05 | parche | Divide el monolito `WORKFLOWS.md` en recursos de workflow por modo (feature, small/phased, fix, legacy) cargados exactamente uno a la vez, divide `ISSUE_POLICY.md` en tres recursos de política cargados de forma independiente (`FORGE_BODY.md`, `DESCOPE.md`, `OPPORTUNISTIC_FINDING.md`) elegidos según la situación, y añade un recibo de dependencia versionado con una ruta rápida de huella local fail-closed. Conserva el comportamiento: cada casilla universal de seguridad de ejecución permanece residente en el contrato de turno compacto, cada una mapeada read-verified a su recurso dueño único, y cada ruta de ejecución sigue pasando con resultados observables sin cambios. |
| 2.13.1 | 2026-08-02 | parche | Mueve el esquema fijo de handoff de `progress.md` tras una ruta explícita de un salto, conservando todos sus campos y reglas de cierre mientras reduce el contexto de activación directa. |
| 2.13.0 | 2026-07-31 | menor | La carga progresiva reduce la estimación de activación de la skill más usada de unos 13k a 3k: las reglas universales de turno/handoff quedan en `SKILL.md`, mientras preflight, gates de ejecución, política de issues, workflows de modo, closeout/folding y portabilidad por lotes cargan solo cuando hacen falta. |
| 2.12.0 | 2026-07-31 | menor | Añade una puerta de invariantes arquitectónicas antes de editar con clasificación basada en evidencia, parada para decisión explícita y compatibilidad NRS opcional. |
| 2.11.2 | 2026-07-31 | parche | Mueve la guía NRS debajo de las reglas de Branch para que los formatos de rama y las restricciones del workflow mantengan su alcance en la sección Branch. |
| 2.11.1 | 2026-07-31 | parche | Exige un snapshot congelado del estado del repositorio antes de implementar y enruta el estado ausente o no congelado a discovery o resolución. |
| 2.11.0 | 2026-07-31 | menor | Consume hechos congelados del Estado Normalizado del Repositorio antes de implementar, inspecciona directamente solo hechos ausentes y enruta evidencia contradictoria a `resolve-repository-state`. |
| 2.10.0 | 2026-07-30 | menor | Issue #111: añade una única política determinista `Autofix` / `Opportunistic Fix` / `Create Issue`, evaluación explícita aprobado/fallido por fila, comprobación de límites numéricos y un registro de ejecución en `decisions.md`; la configuración queda para el futuro hasta contar con un esquema verificable por máquina. |
| 2.9.0 | 2026-07-30 | menor | Borrador inicial de política para la issue #111; sustituido antes de la publicación por el contrato determinista de fuente única de 2.10.0. |
| 2.8.0 | 2026-07-19 | menor | La casilla de docs de la puerta de cierre de fase ahora incluye `docs/CAPABILITIES.md`: una fase que introduce un nuevo subsistema transversal, rol o permiso añade su fila al inventario de capacidades (aditivo, nunca reescribe filas existentes; n/a explícito cuando el proyecto no tiene fichero de inventario). |
| 2.7.0 | 2026-07-19 | menor | Endurecimiento para modelos pequeños: nueva regla dura de **presupuesto de contexto** (≤ 10 lecturas de fichero completo por fase más allá de los docs propios de la unidad; lecturas dirigidas ≤ 50 líneas y greps no cuentan; conjunto mínimo fijo del Paso 0; resume-no-retengas) y nuevo **registro de handoff de fase** — `progress.md` gana un esquema fijo de entrada por fase (`Done / Remains / Gotchas / Files / Next`), creado junto al SPEC en P1 para unidades XS/S por fases y `--fix`; la fase siguiente arranca en conversación nueva y lee solo `SPEC.md` + su sección de `TASKS.md` + `progress.md`. El atajo de relectura en misma sesión se elimina (una fase = una conversación nueva); la casilla de docs de la puerta de cierre nombra el esquema. |
| 2.6.0 | 2026-07-18 | menor | Fix #77: sustituye la cadencia fija de checkpoint de revisión cada 2 fases por tres disparadores mecánicos — **límite de capa** (la siguiente fase declara un `Layer:` distinto), **acumulación** (`git diff --stat <baseline>..HEAD` > 400 líneas u > 8 ficheros desde el marcador última-revisión), y **sensibilidad** (fase de auth/pagos/migración destructiva/secretos/CI) — más la especificación del marcador `Last reviewed: <sha>` en `progress.md` (único escritor `execute-phase`, respaldo `git merge-base` si está ausente). La revisión final obligatoria y la cadencia adversarial de `review-change` no cambian. |
| 2.5.2 | 2026-07-18 | parche | Fix #76: el hand-off obligatorio de revisión de fin de unidad ahora anota cuándo `review-change` recomienda `--adversarial N` en esa revisión terminal — solo redacción, la cadencia del checkpoint cada 2 fases no cambia. |
| 2.5.1 | 2026-07-18 | parche | Fix #66: se aclaró el paso de retro-relleno de la enmienda en la guardia de descope — tras crear el issue de seguimiento y enlazarlo en el cuerpo del issue, editar explícitamente la fila `## Amendments` para sustituir el marcador `#<n>` por el número real del issue y commitear ese cambio; una fila que aún lea el marcador literal falla la comprobación simétrica de fila sin enlazar de `audit-pr`. |
| 2.5.0 | 2026-07-17 | menor | Fix #66: nueva **guardia de descope** en la Política de issues — antes de crear cualquier issue, se clasifica como trabajo descubierto (se archiva libremente) o descope (solapa un criterio de aceptación/tarea de la SPEC no entregado del todo); un descope PARA antes de crear el issue, exigiendo primero una entrada `## Amendments` fechada y aprobada por el usuario (formato de fila canónico definido una sola vez aquí). Nueva entrada en la lista de prohibiciones y casilla del contrato de turno que exige que la guardia se aplicase a cada issue creado en el turno. |
| 2.4.1 | 2026-07-17 | parche | Fix #81: el guardia de pre-vuelo de lint de fase (añadido en 2.4.0) gana una salvedad explícita para SPECs legacy — un SPEC sin sección `## Phases` omite el guardia por completo (sin lint, sin DETENCIÓN) y cae directamente al flujo legacy de paso único preexistente, restaurando la promesa de retrocompatibilidad de la propia fix #64. |
| 2.4.0 | 2026-07-17 | menor | Fix #64: nuevo **guardia de pre-vuelo de lint de fase**, ejecutado tras las puertas de dependencias/estado propio y antes de cualquier edición — la fase objetivo debe pasar el lint canónico de 8 casillas (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint") o execute-phase se DETIENE con un bloque fijo que nombra las casillas fallidas y recomienda recortar de nuevo vía `/plan-feature`/`/plan-fix`; `--force` omite la DETENCIÓN, nunca la comprobación, registrado en `decisions.md`/`progress.md`. Integrado en el contrato de turno y las reglas duras. |
| 2.3.0 | 2026-07-17 | menor | Fix #65: la sección del ciclo de fold ("Folding review / audit findings") ahora nombra la nueva skill independiente `/fold-findings` como la vía preferida e invocable por sí sola (clasificación congelada + lista de prohibiciones, turno/nivel propio); la checklist de esta sección se mantiene como fallback en contexto / de portabilidad. |
| 2.2.0 | 2026-07-13 | menor | La checklist del ciclo de fold ("Folding review / audit findings") gana una casilla: la fila de cada hallazgo folded en el ledger `review-findings.md` de la unidad pasa `folded: no → yes` — la única transición de estado del ledger, propiedad exclusiva de este ciclo de fold. El ledger es opcional (una unidad sin hallazgos fix-now no tiene uno). Parte de la feature 17 (`finding-severity-routing`). |
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
| 3.2.0 | 2026-09-03 | menor | **Compuerta de investigación** (fix #161): un pase de investigación obligatorio y fail-closed corre en el pase de evidencia antes de emitir la mitad de producto — al menos dos fuentes externas obtenidas por red sobre el dominio de la capacidad, cada una citada como fila de evidencia (URL + fecha de acceso); cobertura de qué es y qué no es la capacidad más la expectativa del usuario sobre ella; la descomposición implícita de casos de cada expectativa enunciada (valores y límites, estados de interacción, modo degradado, validación/filtrado/parsing de backend, rutas de usuario alternativas); sin conexión o sin respuesta → `NEEDS-EVIDENCE`, nunca una suposición; la semántica de la plataforma se verifica contra documentación autoritativa antes de que un test la codifique. El antiguo guardrail de sin-investigación-de-mercado pasa a frontera: la investigación de mercado/competencia queda fuera; la compuerta de investigación de dominio es la única investigación externa de esta skill. Techo principal y dos techos de ruta re-basados, este texto como fuente nombrada del crecimiento. |
| 3.1.0 | 2026-08-30 | menor | `references/REPAIR.md` delega ahora las reglas de repetición y segundo ciclo al dueño común `pre-execution-review` y conserva solo el detalle de etapa de producto (qué causa raíz lleva un fallo del medio de producto), así que la política de convergencia tiene un único hogar.
| 3.0.0 | 2026-08-30 | mayor | **Entrega que rompe:** la mitad de producto diseñada cierra en `READY-FOR-REVIEW` y entrega a `/review-spec <slug>`, no a `/plan-feature`. Consume los pases de `evidence-grounding` (inventario → evidencia → borrador → preparación), congela una fila de evidencia por afirmación material y rota `artifactRevisionId` en cada escritura, incluida una reversión; incorpora `references/REPAIR.md`: un lote con causa raíz común sobre todo el conjunto de hallazgos de `SPEC-REVIEW-FAIL`, tres clases de reparación nombradas y un segundo ciclo reportado como `CONVERGENCE-ANOMALY`. El diseño no tiene autoridad de revisión.
| 2.6.0 | 2026-07-31 | menor | La carga progresiva separa las rutas de solo-estado, entrevista/cierre de idea nueva, escritura/upsert, ejemplo de upsert y portabilidad, manteniendo los gates universales de seguridad en el entrypoint. |
| 2.5.0 | 2026-07-31 | menor | Clasifica invariantes arquitectónicas opcionales del proyecto con evidencia del repositorio y detiene el diseño para una decisión arquitectónica explícita cuando una regla se viola, introduce o cambia. |
| 2.4.1 | 2026-07-31 | parche | Mueve la guía NRS debajo de los bullets de Guardrails para que los guardrails mantengan su alcance de sección previsto. |
| 2.3.0 | 2026-07-19 | menor | Cierre de requisitos implícitos: el cierre de capacidades pasa a tres checklists fijas — cierre de entidades (sin cambios), nuevo **cierre de integración** (una fila resuelta por subsistema del inventario de capacidades del proyecto, `docs/CAPABILITIES.md` — ninguno omitido; sin inventario → deriva uno y ofrece sembrar el fichero) y una **matriz de roles** (cada rol del inventario explícitamente permitido/denegado por capacidad) — más un nuevo paso y sección del SPEC de **barrido de expectativas** (≥ 10 M/L / ≥ 5 XS/S expectativas de dominio que un humano asumiría implícitamente, cada una forzada a in-scope/out-of-scope/deferred). Tres nuevas casillas de producto del Spec-lint, casillas equivalentes en el contrato de turno y guardarraíles; el Paso 0 lee el inventario. |
| 2.2.0 | 2026-07-19 | menor | Endurecimiento de la entrevista para modelos pequeños: **una pregunta por turno, nunca en lote**; una **rúbrica de vaguedad** fija de seis huecos (usuarios/roles afectados · estados de error y borde · forma de los datos · límites y umbrales · fuera de alcance · criterios de éxito — cada uno relleno o `n/a` explícito); regla de pregunta obligatoria (un requisito sin criterio de aceptación verificable es automáticamente la siguiente pregunta); técnica de reformular-como-medible; las respuestas "decidir más tarde" aterrizan en la nueva sección `### Deferred decisions` del SPEC; escalada estructural (≥ 3 huecos vacíos → `NEEDS_INPUT`, nunca adivinar). Sellar `designed` ahora exige las nuevas **casillas de producto del Spec-lint** de la plantilla de SPEC (comprobaciones mecánicas de presencia — resultados pegados, fail-closed). |
| 2.1.0 | 2026-07-17 | menor | La sección de semántica de upsert ahora referencia cruzadamente la puerta de integridad de cierre de `audit-pr`: el warning datado `design-debt` de una SPEC legacy es el disparador de retrofit, y reejecutar esta skill rellena solo las filas de cierre faltantes por el mismo camino de upsert-nunca-destruye. Parte de #78. |
| 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. También se elimina una referencia colgante a la sección borrada (un puntero cruzado en `NEEDS_INPUT`). Ver `docs/workflow/MIGRATION.md`. |
| 1.1.0 | 2026-07-09 | menor | Ahora **escribe** el estado de la fila del roadmap, no solo lo lee: sellar `## Design status: designed` pone la fila del roadmap de esta feature en `defined` (la transición `idea → defined` que esta skill posee) — añadida en `idea` primero si la fila no existía. `NEEDS_INPUT` deja tanto el marcador como la fila sin cambios. El contrato de turno y "Listo cuando" ganan las casillas correspondientes. |
| 1.0.0 | 2026-07-09 | — | Nueva skill: definición de producto, separada de `plan-feature`. Incorpora la entrevista de idea en crudo y recorre un checklist fijo de **cierre de capacidades** (por entidad: CRUD + transiciones de estado, cada una con UI + API + test, o `n/a: <razón>` explícito; por capacidad: punto de entrada + ACL; por rol: asignado/revocado/visto dónde) hacia la mitad de producto del SPEC + criterios de aceptación, sellando `## Design status: designed`. Hace upsert al reejecutarse (nunca destruye `decisions.md`); `<slug>` sin más revisa y pregunta, `<slug> "<instrucción>"` aplica directamente. |

#### `plan-feature`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 5.0.0 | 2026-08-30 | mayor | **Entrega que rompe:** una unidad recién planificada cierra en `→ Next: /review-plan <NN>` en lugar de `/execute-phase <NN>`. El planeado lleva además los libros congelados y el resultado de preparación `stage: plan` a su entrega y dice sin rodeos que una unidad planificada no es ejecutable: esta habilidad nunca revisa el plan que acaba de escribir.
| 4.0.0 | 2026-08-30 | mayor | **Puerta que rompe:** el planeado ejecuta ahora una puerta de revisión de producto tras la puerta de redirección. Ninguna ruta genera artefactos salvo que un recibo `spec-review-pass` vigente enlace el snapshot de etapa SPEC recalculado; `missing`, `stale`, `wrong-stage`, `substitute` (recibos de candidato/verificación), `self-approved` y `author-readiness` fallan cerrados con el bloque fijo `PRODUCT-REVIEW GATE … BLOCKED` y la entrega a `/review-spec`. No existe bandera de evasión.
| 3.5.1 | 2026-08-10 | parche | Hace que los hand-offs por dependencias bloqueantes enumeren la cadena completa, de la más profunda a la final, en lugar de dejar un placeholder sin expandir. |
| 3.5.0 | 2026-08-09 | menor | Los hand-offs limpios y ya-planificados recomiendan ahora `execute-phase` solo-con-objetivo para entregar la unidad completa y dejan `P1` explícita únicamente como alternativa atómica. |
| 3.4.0 | 2026-08-04 | menor | Añade los contratos internos de un salto planning preflight y phase contract (rutas 2-3 de carga progresiva) y fija un único contexto de planificación inmutable — un snapshot del roadmap más payload opcional de issue — reutilizado entre internals compuestas, nunca re-consultado a mitad de plan. |
| 3.3.2 | 2026-08-03 | parche | Hace explícito el contrato de routing derivado de issues: después de que `PLANNING_GATES.md` permita planificar, compone `plan-feature-from-issue` y después `plan-feature-scaffold`, en ese orden. |
| 3.3.1 | 2026-08-02 | parche | Enruta la detección de estado y los gates de repositorio/invariantes mediante dos referencias explícitas de un salto y recorta metadatos de activación; el comportamiento de planificación y los handoffs fijos no cambian. |
| 3.3.0 | 2026-07-31 | menor | Evalúa invariantes arquitectónicas opcionales antes del scaffolding y restaura la compatibilidad con repositorios sin ledger de Estado Normalizado del Repositorio. |
| 3.2.2 | 2026-07-31 | parche | Mueve la puerta de planificación NRS debajo de los bullets de Guardrails para que los guardrails mantengan su alcance de sección previsto. |
| 3.2.1 | 2026-07-31 | parche | Exige un snapshot congelado del estado del repositorio antes de planificar y enruta el estado ausente o no congelado a discovery o resolución. |
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
| 3.1.0 | 2026-09-03 | menor | **Investigación y traza de referencias** (fix #161): la investigación en etapa de plan es condicional — solo cuando una pregunta acotada (ROWS.md Q1–Q5) no puede responderse con evidencia del repositorio; exactamente un pase web congela lo que devuelve como filas de evidencia (URL + fecha de acceso); lo que el repositorio responde nunca se vuelve a buscar. La traza de referencias es obligatoria: el código afectado se localiza por búsqueda de símbolos/referencias (LSP/serena cuando está disponible, grep si no) y el blast radius se deriva de esa búsqueda, nunca de la memoria del modelo. Techos de ruta `plan-fix:issue` re-basados, este texto como fuente nombrada del crecimiento. |
| 3.0.1 | 2026-08-31 | parche | Reparación del pliegue (F12+F13): los libros incrustados del SPEC de fix usan los rótulos canónicos `### Planning evidence` / `### Obligations` y la tabla de evidencia adopta el orden único de columnas de ROWS.md. La generación, las filas de fix y la entrega no cambian. |
| 3.0.0 | 2026-08-30 | mayor | **Entrega que rompe:** el SPEC de fix congela con él `## Planning evidence` y `## Obligations` (reproducción, causa raíz, alcance de regresión, rollback, invariante afectada — una fila cada uno) y entrega a `/review-plan fix-<n>`; `/execute-phase --fix` sigue al PLAN-REVIEW-PASS. La unidad de fix mantiene su propia autoridad y nunca fabrica un medio de producto para satisfacer una comprobación de producto.
| 2.7.0 | 2026-08-10 | menor | Hace que el hand-off conserve explícitamente el alcance completo de una unidad multi-issue (`#primary + #n2 + …`) manteniendo el comando ejecutable ligado al issue primario. |
| 2.6.1 | 2026-08-09 | parche | Sin cambio de comportamiento: comprime input/output, hard rules, carga progresiva, portabilidad y criterios de cierre, preservando agrupación multi-issue y contratos. |
| 2.6.0 | 2026-08-09 | menor | Acepta bloques de capacidad compatibles y lotes mecánicos homogéneos usando comprobaciones de resultado, verificación, aislamiento, release/rollback y tamaño agregado; compartir ficheros/causa raíz/severidad deja de ser una puerta, y los conjuntos fallidos devuelven el mínimo número de grupos compatibles máximos. Emite `ACCEPTANCE.md` congelado. |
| 2.5.0 | 2026-08-04 | menor | Consume el planning preflight compartido (lectura del estado normalizado del repositorio + una única clasificación arquitectónica final) y el phase contract (phase-lint canónico de 8 casillas + fingerprint de fase) antes de redactar y emitir un SPEC de fix; prosa comprimida para que la ruta se mantenga bajo su presupuesto base. |
| 2.4.1 | 2026-08-02 | parche | Mueve la validación/planificación y los contratos detallados del SPEC a rutas explícitas de un salto y comprime la prosa explicativa conservando todas las reglas fijas multi-issue, de fases, commit y handoff. |
| 2.4.0 | 2026-07-19 | menor | La auto-revisión (paso 14) ahora ejecuta también el nuevo `### Spec-lint` de la plantilla de fix — comprobaciones mecánicas de presencia (sin placeholders, fuera-de-alcance no vacío, cada criterio de aceptación un comando ejecutable o etiquetado `read-verified`) — antes del commit del borrador. |
| 2.3.0 | 2026-07-17 | menor | Fix #80: `plan-fix` ahora acepta varios números de issue con semántica plenamente definida — una checklist fija de 4 casillas de causa-raíz-compartida decide si se fusionan en UNA unidad (primaria = número de issue más bajo, `Closes #<n>` por issue) o si la skill se niega con una división verbatim (`plan these separately`). La invocación de un solo número queda sin cambios. `argument-hint`, `## Input`, `## Output` y `## Hand-off` actualizados en consonancia. |
| 2.2.0 | 2026-07-17 | menor | Fix #64: el paso 12 del algoritmo (Phases) ahora exige que toda fase de implementación pase el lint canónico de 8 casillas (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — la copia autoritativa) antes de emitirse — cualquier FAIL implica recortar o dividir la fase, nunca emitirla sin marcar. El paso 13 (Self-review) gana la afirmación equivalente de las 8 casillas. |
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

#### `review-spec`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.5.0 | 2026-09-04 | menor | Redirección por retiro (fix #161, P3a): la ruta de fold `source`/`environment`/`runtime` nombra la vía manual `/fold-findings` y luego re-ejecutar `/review-change` en lugar del router retirado `loop-review-fold`. |
| 1.4.0 | 2026-09-03 | menor | Las rutas de FAIL llevan el **mapa de resolución**: la celda `class` del hallazgo nombra a su resolvedor y solo a ese — `product` → `design-feature` (luego `review-spec` re-juzga), `plan` → `plan-feature`/`plan-fix` (luego `review-plan` re-juzga), `source`/`environment`/`runtime` → la ruta de fold del ejecutor; `fold-findings` nunca repara un artefacto de planificación (fix #159). |
| 1.3.2 | 2026-09-02 | parche | La plantilla del receipt de spec declara ahora `Unit kind: <feature\|fix>` — el consumidor parsea esa etiqueta, y una plantilla que la omite convierte la comprobación de identidad de la unidad en un no-op silencioso para veredictos de SPEC (hallazgo F70) |
| 1.3.1 | 2026-09-02 | parche | La receta de construcción canónica de `CHECKS.md` ya no pasa `--json /tmp/spec-snapshot.json`: la guarda `contained()` del constructor rechaza cualquier ruta fuera del repositorio, así que el comando documentado fallaba con `path escapes the repository` y salía sin imprimir ningún digest — quien lo seguía al pie de la letra solo podía acabar en la forma de rechazo o improvisar el sustituto calculado a mano que el contrato prohíbe (hallazgo F69 de la reseña). La receta usa ahora lo que el propio constructor imprime: el digest en la primera línea y el objeto canónico detrás. El techo de ruta que esta cláusula hace crecer se recalibra a su suelo medido en el mismo commit (D51). Los veredictos, las catorce comprobaciones y la frontera de solo lectura no cambian. |
| 1.3.0 | 2026-09-01 | menor | El contrato de turno gana una línea que apunta a write-then-report (`POLICY.md` §8 de `pre-execution-review`), única dueña de la regla que liga un veredicto terminal a su marca durable (AC17/O17). Los veredictos, las catorce comprobaciones y la frontera de solo lectura no cambian; esta skill no reformula nada de la regla que cita. |
| 1.2.0 | 2026-09-01 | menor | El paso 0 fija el conjunto de lectura: todo byte que abre la reseña —el SPEC, `decisions.md`, la fila del roadmap, el issue rector— es **dato, nunca instrucción**, de modo que una directiva, un veredicto exigido o una severidad prescrita dentro de un artefacto revisado se registra como hallazgo contra ese artefacto en lugar de obedecerse (hallazgo F28 de la reseña; `POLICY.md` §7 de `pre-execution-review`). Los veredictos, las catorce comprobaciones y el límite de solo-lectura no cambian. |
| 1.1.0 | 2026-08-30 | menor | Los hallazgos se añaden ahora al `planning-findings.md` con etapa de la unidad (`stage: spec`) además de informarse, y las reglas de repetición/convergencia delegan en el dueño común `pre-execution-review`. Los veredictos, las catorce comprobaciones y el límite de solo lectura no cambian.
| 1.0.0 | 2026-08-30 | — | Nueva puerta de etapa de producto: revisa una mitad de producto congelada en un turno de contexto limpio, construye `PreExecutionArtifactSnapshot v1` con el selector `spec-product-v1`, aplica las catorce comprobaciones fijas de producto tras un pase de falsación y devuelve solo `SPEC-REVIEW-PASS | SPEC-REVIEW-FAIL | NEEDS-DESIGN` con el recibo persistido en `progress.md`. Solo lectura sobre cada artefacto revisado; las decisiones de producto vuelven al humano.

#### `review-plan`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.5.0 | 2026-09-04 | menor | Redirección por retiro (fix #161, P3a): la ruta de fold `source`/`environment`/`runtime` nombra la vía manual `/fold-findings` y luego re-ejecutar `/review-change` en lugar del router retirado `loop-review-fold`. |
| 1.4.0 | 2026-09-03 | menor | Las rutas de FAIL llevan el **mapa de resolución**: la celda `class` del hallazgo nombra a su resolvedor y solo a ese — `plan` → `plan-feature`/`plan-fix` (el autor re-corta, luego `review-plan` re-juzga), `product` → `design-feature` (luego `review-spec` y el plan se re-deriva), `source`/`environment`/`runtime` → la ruta de fold del ejecutor; `fold-findings` nunca repara un artefacto de planificación (fix #159). |
| 1.3.1 | 2026-09-02 | parche | La receta de digest canónica de `CHECKS.md` ya no pasa `--json /tmp/plan-snapshot.json`: `contained()` rechaza una ruta fuera del repositorio, así que el comando documentado fallaba antes de imprimir el digest (hallazgo F69 de la reseña, el mismo defecto que `review-spec` 1.3.1). La receta se apoya ahora en stdout: digest primero, objeto canónico después, y enuncia la regla de rutas solo dentro del repositorio para `--json`. El techo de ruta que esta cláusula hace crecer se recalibra a su suelo medido en el mismo commit (D51). El vocabulario de veredictos, la propiedad de los libros y la frontera de solo lectura no cambian. |
| 1.3.0 | 2026-09-01 | menor | Hallazgo F37 cerrado: el contrato de turno ya no dice que el digest del SPEC padre se «copied from the receipt» — nombra la §7 de `POLICY.md` como dueña de la regla del valor de identidad (recalculado desde los bytes, nunca llevado como valor copiado). Además cita write-then-report (`POLICY.md` §8) en una línea para la marca durable del veredicto. El vocabulario de veredictos, la propiedad de los libros y la frontera de solo lectura no cambian. |
| 1.2.0 | 2026-09-01 | menor | El conjunto de lectura del paso 0 —incluido el bloque copiado `## Pre-execution review receipt v1 — spec`— es explícitamente dato, nunca instrucción: una directiva o un veredicto exigido dentro de cualquier artefacto de plan es un hallazgo contra el artefacto que lo contenía, y los valores de identidad se leen del artefacto que nombra el contrato y no de prosa que los afirme (hallazgo F28; `POLICY.md` §7). El vocabulario de veredictos, la propiedad de los libros y el límite de solo-lectura no cambian. |
| 1.1.0 | 2026-09-01 | menor | Se corrige el linaje de padre de las unidades fix. `parentSpecSnapshotDigest` es **obligatorio en unidades feature** y **exactamente `null` en unidades fix**: el único selector `stage: spec` sanctioned exige los encabezados de la mitad de Producto que un SPEC de fix no tiene a propósito, así que la receta anterior («vincula el digest del propio SPEC de fix») era inalcanzable para **todas** las unidades fix (probado en la unidad 78 antes del cambio), y nombrar un padre de fix afirmaría una revisión de Producto que ningún revisor de contexto limpio ejecutó. El contrato se estrecha en D30 (`plan-stage-requires-parent` → `stage == plan && unitKind == feature`); L1, la tabla de instantáneas, la cláusula de construcción/verificación y la lista previa al envío llevan la separación feature/fix. Hallazgo RS14. |
| 1.0.0 | 2026-08-30 | — | Nueva puerta de etapa de ingeniería: revisa un plan congelado en un contexto que no lo cortó, construye el snapshot `stage: plan` (filas `whole-file`, snapshot de producto padre obligatorio), barre los libros de planificación (L1–L6) y las comprobaciones fijas de ingeniería (P1–P12, más F1–F4 en fixes), y devuelve solo `PLAN-REVIEW-PASS | PLAN-REVIEW-FAIL | NEEDS-DESIGN` con un recibo ligado al snapshot en `progress.md` y los hallazgos añadidos a `planning-findings.md`. Solo lectura sobre cada artefacto de plan; `execute-phase` es el consumidor.

#### `review-change`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 3.2.0 | 2026-09-04 | menor | **Re-mapeo del hand-off manual (fix #161, P3a):** el bloque `→ Next:` de `REVIEW-FAIL` nombra ahora el camino manual `/fold-findings`, y luego un nuevo `/review-change` sobre el HEAD cambiado, en lugar del router retirado `/loop-review-fold <unit>` (un driver exterior programático puede ejecutar la misma secuencia). `REVIEW_PROCESS.md` gana el tope de dos ciclos (`LOOP CAP REACHED`): un tercer ciclo nunca arranca sin una instrucción explícita del usuario, y el residuo se enruta a `triage-issue --prioritize-now`. La sección de relaciones ya no nombra el router retirado. |
| 3.2.1 | 2026-09-04 | parche | Fix de fold (F7): corregidas las referencias cruzadas de paso de proceso de `review-change` tras insertar el paso de verificación como paso 6 — `review-implementation` ahora es el paso 8 (antes 7), `review-debt` el paso 9 (antes 8), la fusión en el paso 7 (antes 6), y la regla de aislamiento nombra ahora el pase de verificación (paso 6). Consecuencia: los cuatro techos de ruta de `review-change` se re-basan a `ceil(medido × 1.10)` (`adversarial` 17415, `default-backend`/`default-web` 15597, `synthesize` 16111) tras crecer el SKILL.md con la mención del pase de verificación. |
| 3.1.0 | 2026-09-03 | menor | **Verificación antes de persistir (fix #161):** la revisión re-verifica cada hallazgo candidato en un contexto aislado contra los bytes del head revisado antes de la síntesis — una afirmación de código/comportamiento solo confirma con un reproductor que falla (test rojo primero, código sin cambios) o salida de comando reproducible, una de documentación/redacción con lectura directa, una de doc-faltante con la ruta de usuario sin documentar — y lo marca `confirmed` o `refuted`. Solo los candidatos confirmados se persisten; el informe gana una sección `Refuted`. La firma durable por hallazgo `finding-mark@1` (ids `VF-`, escritor único `review-change`, excluida de la cola de fold/sensor/anotador) se declara en `pre-execution-review/references/LEDGERS.md`. |
| 3.0.0 | 2026-09-03 | mayor | **Cambio de contrato: bucle acotado (fix #159):** los hallazgos `low` son notas de solo-informe — nunca se persisten en el ledger de fold ni bloquean; el suelo de materialidad de los finders sobrevive ahora a la clasificación y a la decisión, y solo las filas fix-now `high`/`med` se persisten y pueden provocar `REVIEW-FAIL`. El estado del workspace (árbol sucio, adelantado/retrasado frente al remoto) es una **precondición, no un hallazgo**: la revisión para con `REVIEW BLOCKED — workspace state` antes de ejecutar cualquier pase. Las re-revisiones leen primero el ledger de fold, declaran el número de ciclo, re-verifican cada fila `folded: yes` en su localización citada (un re-informe solo es legítimo como `regression of <id>` o `DISPUTED`) y un ciclo ≥ 2 que produzca un fix-now nuevo añade el informe `CONVERGENCE-ANOMALY`. La revisión **hace commit de su propio añadido al ledger** (`docs(<unit>): persist review findings F<n>–F<m>`, con push si hay PR abierta) para no dejar sucio el árbol que la siguiente revisión juzgará; con `REVIEW-PASS` y PR abierta no hay escritura en el ledger — el receipt ligado al SHA es el registro durable. Ver `docs/workflow/MIGRATION.md`. |
| 2.12.0 | 2026-08-30 | menor | El bloque de entrega `REVIEW-FAIL` ganó dos líneas de dueño: los hallazgos de dueño `plan` van a `/plan-feature <unidad>` + `/review-plan <unidad>`, los de dueño `product` van a `/design-feature <unidad>` + `/review-spec <unidad>`. Una cola local de código sigue plegándose aquí; el esquema del libro de plegado, los veredictos y el límite de solo lectura no cambian. |
| 2.11.5 | 2026-08-11 | parche | Congela el commit revisado y exige que el `headRefOid` de la PR coincida antes de publicar un recibo REVIEW-PASS; si el head de la PR cambia, se re-revisa en vez de publicar un recibo irresoluble. |
| 2.11.3 | 2026-08-10 | parche | Hace que el recibo PR verificado sea una precondición del informe de revisión, evitando que el bloque fijo termine el turno antes de publicar y releer el recibo. |
| 2.11.4 | 2026-08-10 | parche | Exige que los hand-offs REVIEW-FAIL y NEEDS-DECISION enumeren todos los IDs de findings afectados, en lugar de nombrar solo uno genérico o el primero. |
| 2.11.2 | 2026-08-10 | parche | Hace explícito y fail-closed el cierre del recibo final de PR antes de que la review pueda recomendar `audit-pr`; aclara que el bloque fijo del informe no termina el turno. |
| 2.11.1 | 2026-08-09 | parche | Sin cambio de comportamiento: comprime introducción, aislamiento, guardrails de rutas, relaciones y cierre, preservando aplicabilidad y contrato de solo lectura. |
| 2.11.0 | 2026-08-09 | menor | Verifica el blob de aceptación congelado antes de la review y recomienda `loop-review-fold` acotado ante fallo, preservando su contrato de solo lectura y recibo ligado al SHA exacto. |
| 2.10.0 | 2026-08-05 | menor | Decisión del informe en tres estados D10 `REVIEW-PASS | REVIEW-FAIL | NEEDS-DECISION` (nunca MERGE-READY). La revisión final obligatoria publica un recibo `REVIEW-PASS` idempotente y ligado al SHA exacto como comentario de PR mediante un archivo Markdown temporal `--body-file` (cuerpo fijo: marcador `<!-- review-change:pass sha=… contract=v1 -->`, SHA de head, alcance/ejes, cobertura de aceptación, invariantes, cero hallazgos abiertos, nº de propuestas, verificaciones manuales; D6 — nunca se commitea a la rama, gana el marcador coincidente más nuevo, un commit posterior lo vuelve obsoleto). `REVIEW-FAIL` persiste los hallazgos en el ledger de fold y no publica recibo; `NEEDS-DECISION` bloquea sin crear una issue. Los checkpoints previos al PR conservan el marcador de `progress.md` y no publican recibo (D7). Nueva suite de fixtures de recibo fake-forge (`scripts/review-receipt.test.mjs`). |
| 2.9.1 | 2026-07-31 | parche | Hace que `--merge` sea autocontenido cargando el proceso de revisión y el setup adversarial antes del merge adversarial, para fusionar las tablas suministradas bajo el mismo contrato de revisión. |
| 2.9.0 | 2026-07-31 | menor | La carga progresiva separa el proceso de review por defecto, persistencia/decisión, setup/merge adversarial, salida/guardrails y portabilidad; el aislamiento y el contrato de turno permanecen en el cuerpo de activación. |
| 2.8.0 | 2026-07-31 | menor | Revisa explícitamente invariantes arquitectónicas opcionales del proyecto con evidencia del repositorio e informa violaciones, introducciones o cambios no documentados como hallazgos de arquitectura. |
| 2.7.1 | 2026-07-31 | parche | Mueve la guía de revisión NRS debajo de los bullets de Guardrails para que los guardrails mantengan su alcance de sección previsto. |
| 2.7.0 | 2026-07-31 | menor | Usa hechos NRS congelados como contexto de evidencia de solo lectura y propone contradicciones sin redefinir hechos, aceptar decisiones ni tratar documentación como evidencia de implementación. |
| 2.6.0 | 2026-07-19 | menor | Endurecimiento para modelos pequeños: nueva **regla de aislamiento (por defecto)** — `review-implementation` y cada pasada aplicable del pack corren con contexto limpio (subagente / invocación headless / conversación nueva, los mismos tres niveles que `--adversarial`), reciben solo el alcance + su propia checklist + los docs que nombra su Paso 0 (≤ 10 lecturas completas de ficheros fuera del diff por pasada), y devuelven SOLO su tabla fija + PASS\|FAIL; el orquestador retiene tablas, nunca fuentes; la composición en el mismo turno queda como fallback inline documentado. La comprobación de deriva del SPEC ahora es **estructural**: tabla de cobertura por criterio (criterio → evidencia → cumplido/incumplido/intocado) más mapeo de cada hunk del diff a un criterio — hallazgos para criterios reclamados incumplidos y hunks mapeados a `none`. |
| 2.5.0 | 2026-07-19 | menor | El Routing ahora enuncia las comprobaciones de anulación hacia fix-now de `review-implementation` 1.2.0 (arreglo barato / defecto dentro de alcance → siempre fix-now, nunca un escape a postpone/known-issue/tradeoff) y añade la ruta `replan-in-unit` para un fix-now dentro de alcance demasiado grande (conserva su clase fix-now + su fila en el ledger; el usuario confirma las nuevas fase(s) del SPEC y `execute-phase` en la misma rama lo pliega); el bloque `→ Next:` de `Decision: FAIL` gana el sub-punto condicional correspondiente. |
| 2.4.1 | 2026-07-18 | parche | Fix #77: reformula las dos referencias cruzadas a la cadencia de `execute-phase` ("When to use" y "Relationship to other skills") desde el intervalo retirado de cada 2 fases hacia la nueva cadencia basada en disparadores (límite de capa/acumulación/sensibilidad); la sección adversarial "Cadence — once per unit" y su nota de límite con `#77` no cambian. |
| 2.4.0 | 2026-07-18 | menor | Fix #76: hace que `--adversarial N` sea usable por flotas de modelos débiles orquestadas a mano — checklist de recomendación de 4 casillas (sustituye el disparador L/sensible únicamente, añade una condición "revisor no es el más fuerte/es más débil que el autor" expuesta como línea de informe, nunca auto-detectada), escalera fija de N (2 por defecto, 3 en seguridad/familia única, >3 desaconsejado), roles de revisor asignados por índice (R1 corrección, R2 seguridad, R3 cobertura de SPEC) con la guarda de rol-como-prioridad-no-alcance, contratos de revisor/merge de fuente única, un nuevo modo de fusión `--merge` con lista de prohibiciones, plantillas de bloques para pegar en Portability, y un ancla de cadencia una-vez-por-unidad (límite explícito con `#77`). |
| 2.3.0 | 2026-07-17 | menor | Fix #65: el bloque `→ Next:` de `Decision: FAIL` ahora recomienda la nueva skill independiente `/fold-findings` (clasificación congelada, lista de prohibiciones que cierra las válvulas de escape de volcado-a-known-issues/downgrade/aflojar-tests/supresión) como la vía de fold, en lugar de la línea de prosa inline "fold the fix-now findings"; la forma fija multilínea y los sub-bullets de `/audit-pr`/no-fix-now/product-audit no cambian. |
| 2.2.1 | 2026-07-17 | parche | El bloque `→ Next:` del paso 11 ahora se ramifica explícitamente según `Decision`: un bloque `FAIL` recomienda foldear los hallazgos fix-now (gate en verde, commit + push, re-ejecutar `/review-change`) con `/audit-pr` degradado a sub-bullet condicionado a la tabla limpia; un bloque `PASS` mantiene `/audit-pr — merge gate`. La condición de recurrencia de `/product-audit` ahora es una casilla explícita sí/no, y el bloque debe emitirse como líneas literales múltiples, nunca como prosa unida con `·`. Corrige el issue #63 — modelos débiles (observado: qwen3.6-thinking) copiaban la plantilla estática única anterior de forma literal, recomendando el merge gate incluso en `FAIL`. |
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

#### `fold-findings`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.3.0 | 2026-09-03 | menor | `FOLD_POLICY.md` prohíbe editar la expectativa de un test existente para ajustarse al comportamiento (fix #161): una reparación de setup mantiene las aserciones al menos tan fuertes y nunca toca expectativas; el contrato de inmutabilidad de tests es dueño de la única vía de enmienda. |
| 1.2.2 | 2026-08-10 | parche | Exige que los hand-offs según resultado enumeren todos los IDs de findings afectados y su ruta. |
| 1.2.1 | 2026-08-09 | parche | Sin cambio de comportamiento: comprime descubrimiento de cola, guardrails, portabilidad, relaciones y cierre; permanecen veredictos/tally y reglas de fold congeladas. |
| 1.2.0 | 2026-08-09 | menor | Repara la cola seleccionada en lotes atómicos compatibles, conservando un veredicto y registro de evidencia por hallazgo; las disputas se detienen para decisión del usuario y ninguna ruta de fold crea issues automáticamente. |
| 1.1.1 | 2026-08-02 | parche | Separa la política congelada del procedimiento por hallazgo tras rutas obligatorias de un salto y acorta metadatos de activación; clasificaciones, prohibiciones, veredictos y conducta de commit/push no cambian. |
| 1.1.0 | 2026-07-19 | menor | Dos adiciones: (1) **reconstrucción del ledger** — invocada tras un `VERDICT: BLOCKED` de `audit-pr` con el ledger ausente o sin filas para algún blocker, la skill añade ella misma las filas que faltan a partir del propio veredicto (esquema fijo, `class: fix-now`, dedupe por `file:line`+eje, con commit) y continúa; terminar con "no hay hallazgos" mientras un veredicto BLOCKED lista blockers es una violación del contrato. (2) Nuevo veredicto por hallazgo **`REPLAN`** para filas `replan-in-unit` (y cualquier hallazgo cuyo arreglo mínimo correcto resulte demasiado grande para plegarse en un commit): nunca se implementa en línea ni se degrada — se traspasa a fase(s) del SPEC confirmadas por el usuario + `execute-phase` en la misma rama; el total gana un campo opcional `· Replan: r` (omitido cuando es 0). |
| 1.0.0 | 2026-07-17 | — | Nueva skill (fix #65): repara uno por uno los hallazgos fix-now de `review-change`/`audit-pr` — clasificación congelada (nunca reclasifica; una objeción genuina produce `DISPUTED` → `/triage-issue`), una lista de prohibiciones fija (nada de volcado a known-issues, nota de tradeoff en `decisions.md`, aflojar/saltar tests, supresión de lint como arreglo, stub `TODO`, ni marcar `folded: yes` sin un diff), y un contrato de salida fijo por hallazgo `FOLDED <sha> \| DISPUTED <razón> \| BLOCKED <input faltante>` que termina en un total `Folded: n/m · Disputed: k · Blocked: j`. La checklist del ciclo de fold embebida en `execute-phase` se mantiene como fallback en contexto/portabilidad. |

#### `loop-review-fold`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 4.0.0 | 2026-09-03 | mayor | **Tope de ciclos (fix #159):** el loop ejecuta como máximo **dos** ciclos revisión→fold por unidad, contados a nivel de unidad y sin importar la familia a partir de las marcas `REVIEW-RAN` del ledger y los receipts del forge — las familias de hallazgos nuevas no reinician el contador. Un tercer ciclo nunca arranca aquí: parar con `TRIAGE-REQUIRED`, nombrar cada hallazgo abierto y entregar el diagnóstico de convergencia a `/triage-issue --prioritize-now` o al usuario. Una unidad que necesita un tercer ciclo tiene un defecto de planificación o de causa raíz, no un déficit de revisión. Ver `docs/workflow/MIGRATION.md`. |
| 3.0.0 | 2026-08-30 | mayor | **Enrutado que rompe:** el bucle divide la cola abierta por escalón dueño antes de plegar. Las filas `source`/`environment`/`runtime` se pliegan como antes; una fila de dueño `plan` detiene el bucle con `BLOCKED` y entrega a `/plan-feature` + `/review-plan`, una de dueño `product` a `/design-feature` + `/review-spec`: plegar repara el candidato, nunca la autoridad que lo describe, y esa fila no puede enviarse a `triage-issue` para que desaparezca. Entrar en un segundo ciclo local exige ahora el diagnóstico `CONVERGENCE-ANOMALY` antes de cualquier edición adicional, y la salida fija ganó la línea `Owned elsewhere:`. El bucle no archiva nada. |
| 2.0.0 | 2026-08-14 | mayor | **Cambio incompatible:** sustituye el conductor acotado y sus flags eliminados por un router simple basado en estado persistido entre `review-change` y `fold-findings`; los hallazgos no resueltos pasan a `triage-issue --prioritize-now` y el trabajo grande se convierte en fases `plan-feature`/`plan-fix` confirmadas por el usuario. |
| 1.1.0 | 2026-08-11 | menor | Añade la selección de la primera acción: reanuda una cola fix-now abierta con `fold-findings` antes de una review nueva; si no, reutiliza PASS o empieza por review. |
| 1.0.4 | 2026-08-11 | parche | Añade metadatos de activación y una protección explícita para ejecutar sobre el target, evitando confundir la invocación con autoría o inspección de la skill. |
| 1.0.3 | 2026-08-11 | parche | Elimina prosa redundante de composición y relaciones entre skills para centrar el punto de entrada en el loop del PR objetivo. |
| 1.0.2 | 2026-08-10 | parche | Exige que las rutas no terminales de review/fold repitan todos los IDs de findings afectados en la recomendación de siguiente paso. |
| 1.0.1 | 2026-08-09 | parche | Hace que el turno falle de forma cerrada ante casillas de contrato sin marcar y explicita los fallbacks de portabilidad para agentes que no usan Claude Code. |
| 1.0.0 | 2026-08-09 | — | Nuevo conductor final acotado de review/corrección: reutiliza recibos al SHA exacto, alterna review de solo lectura y fold por lotes en contextos limpios solo para HEADs distintos, permite dos ciclos por defecto y se detiene al aprobar, requerir decisión, bloquearse, no progresar o agotar presupuesto. Nunca fusiona ni crea issues. |

#### `audit-pr`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 5.0.3 | 2026-09-02 | parche | El paso 1 de la puerta de linaje se reescribe para que sus tres reglas sean tres frases: la cláusula del recibo padre dice ahora qué debe recalcular, y la regla de artefactos congelados (archivos nuevos permitidos, ediciones a un artefacto ligado no) queda fuera del paréntesis del comando de verificación en lugar de quedar atrapada dentro (hallazgo F63 de la reseña). Los dos techos de ruta de `audit-pr` que esta reescritura hace crecer se elevan a su suelo medido en el mismo commit (D52). Veredictos y las demás puertas no cambian. |
| 5.0.2 | 2026-09-01 | parche | Reparación del lote RS: la puerta de linaje aguas arriba nombra el argumento `--parent` que exige el digest de Producto del recibo de plan, registra que una unidad fix no vincula ninguno y apunta a `structural.reasonCode` / `changedPaths` para la dimensión que derivó (hallazgo RS14). Veredictos y las demás puertas no cambian. |
| 5.0.1 | 2026-08-31 | parche | Reparación del pliegue (F1): la puerta de linaje aguas arriba nombra la receta `scripts/pre-execution-snapshot.mjs verify --stage plan` en lugar de `git hash-object` (nunca sustituto de un digest de snapshot). Bloqueos, cierre de obligaciones y autoridad MERGE-READY sin cambios. |
| 5.0.0 | 2026-08-30 | mayor | **Puerta de fusión que rompe:** MERGE-READY exige además que la autoridad aguas arriba sobrevivió a la construcción — el digest del snapshot del recibo de plan sigue recomputándose (y el recibo de spec que nombra como padre está vigente), cada fila de obligación es `verified` o un `n/a` explícito, y ningún hallazgo de planificación queda abierto para el snapshot ligado. Una fila `deferred` sin enmienda del usuario bloquea; exportar una obligación a un issue posterior nunca despeja la puerta. `audit-pr` sigue siendo el único emisor de `MERGE-READY` y nunca fusiona. |
| 4.3.1 | 2026-08-11 | parche | Obtiene `headRefOid` junto con los comentarios de la PR y acepta un recibo REVIEW-PASS solo en ese snapshot exacto; cualquier diferencia de SHA es obsoleta y se enruta a una revisión nueva. |
| 4.3.0 | 2026-08-05 | menor | **Consume el recibo de revisión de `review-change`** en lugar de re-revisar el diff (feature 21): el Paso 1 obtiene los comentarios del PR y toma el marcador `<!-- review-change:pass sha=<40-hex> contract=v1 -->` más nuevo; un recibo vigente se reconoce como la evidencia de revisión, uno ausente/obsoleto es un bloqueante enrutado a `/review-change` (nunca se re-revisa aquí). Las puertas de merge se estrechan al conjunto solo-auditoría del SPEC — se retira la puerta `Tests` (calidad de pruebas) y el re-mapeo de criterios de aceptación por diff (sustituido por el campo de cobertura de aceptación del recibo); la puerta de Invariantes arquitectónicas ahora refleja el resultado del recibo en lugar de reclasificar. Pasos de proceso renumerados; el comentario MERGE-READY cita el recibo consumido. Requiere un `review-change` que publique el recibo ligado al SHA; las versiones antiguas de `review-change` dejan a audit-pr bloqueado sin recibo en el head. |
| 4.2.0 | 2026-07-31 | menor | Sincroniza el contrato consumidor de merge con la frontera de autoridad fullauto verificable desde el forge; las auditorías standalone siguen limitadas a veredicto/comentario. |
| 4.1.0 | 2026-07-31 | menor | La carga progresiva mueve gates de merge, checks de cierre/descope, proceso de auditoría, veredicto fijo, enrutamiento/guardrails y portabilidad detrás de una ruta de auditoría obligatoria de un salto; la propiedad del merge permanece en el entrypoint. |
| 4.0.0 | 2026-07-31 | mayor | **Cambio incompatible:** elimina el auto-merge standalone o autorizado por una política documental. La skill queda estrictamente limitada a veredicto/comentario y nunca fusiona; solo una etapa AUDIT activa de `ship-roadmap --fullauto` puede consumir su resultado MERGE-READY ligado al SHA e invocar el wrapper transitorio. |
| 3.6.0 | 2026-07-31 | menor | Añade la preservación de invariantes arquitectónicas como puerta explícita de aptitud de merge basada en evidencia y una ruta n-a para proyectos que no declaran ninguna. |
| 3.5.1 | 2026-07-31 | parche | Mueve la guía de auditoría NRS debajo de los bullets de Guardrails para que los guardrails mantengan su alcance de sección previsto. |
| 3.5.0 | 2026-07-31 | menor | Audita contra hechos NRS congelados en modo solo lectura y reporta conflictos como contradicciones que solo `resolve-repository-state` puede resolver. |
| 3.4.0 | 2026-07-19 | menor | Amplía la detección de la puerta de **integridad de alcance (descope)** a dos vías: la coincidencia de texto slug/número de issue existente, más una nueva vía que enumera cualquier issue **enlazado desde una fila de `## Amendments`** en la SPEC que gobierna, sin importar su propio título/cuerpo — cierra el hueco de cobertura donde un issue descoped con título genérico/sin mención del slug era invisible para la puerta. La guardia de descope en tiempo de creación de `execute-phase` sigue siendo el control primario; esta puerta sigue siendo un backstop. Arregla #89. |
| 3.3.0 | 2026-07-17 | menor | Nueva puerta de **integridad de alcance (descope)** en el contrato de merge-readiness: lista los issues nacidos desde que la rama divergió que hacen referencia a la unidad; cada uno debe tener su criterio de aceptación aún cumplido **o** una entrada `## Amendments` correspondiente, fechada y aprobada por el usuario (con la misma bitácora que escribe la guardia de descope de `execute-phase`) — si no, BLOQUEANTE; aplica tanto a PRs de feature como de fix, y pasa trivialmente cuando no se exportó nada. El contrato de turno gana la casilla correspondiente; el bloque de cierre `→ Next:` enruta un bloqueante de scope-bleed a la decisión de enmienda o triage. Parte de #66. |
| 3.2.0 | 2026-07-17 | menor | Nueva puerta de **integridad de cierre** en el contrato de merge-readiness: grep sobre la SPEC de feature que gobierna en busca de un encabezado `Capability closure` (a cualquier nivel); un bloque presente con una fila en blanco o una fila no-`n/a` sin mapear es bloqueante, `n/a: <razón>` pasa, un bloque ausente produce un warning datado `design-debt: closure absent, SPEC predates the rule` (nunca bloqueante) — los PRs gobernados por fix son siempre n/a. El warning es a la vez el disparador de retrofit, enrutado a `/design-feature <slug>` en el bloque de cierre. El contrato de turno gana la casilla correspondiente. Parte de #78. |
| 3.1.1 | 2026-07-13 | parche | Corrección de referencia cruzada en Guardrails: el comentario MERGE-READY ahora cita correctamente el paso de proceso 6 (seguía apuntando al paso 5 previo a la renumeración de 3.1.0). |
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
| 3.1.0 | 2026-08-27 | menor | Cierra #147: todo barrido obedece la **puerta de procedencia de evidencia** fija (el forge declarado por el proyecto es autoritativo para el estado vivo de issues y pull-request, los métricos de comandos atan su directorio de trabajo o blanco, los inventarios se recalculan del árbol actual, cada captura lleva su frescura y los conflictos se resuelven en un orden declarado — exactamente un fallback por dominio) y todo informe publica la nueva sección `## Delta vs audit <prior-id>` frente a la auditoría previa más reciente de alcance equivalente (`New` / `Unchanged` / `Resolved`, mapeados como `F<k> <- audit <prior-id> F<j>`, `none — <why no equivalent-scope prior exists>` si no hay previa). Repetir la misma fecha sigue permitido con un motivo explícito; la identidad de hallazgos sigue siendo `F1, F2, …` — el linaje nunca crea slugs globales. |
| 3.0.3 | 2026-08-10 | parche | Exige que el hand-off de auditoría enumere el conjunto completo de findings antes de agrupar el triage. |
| 3.0.2 | 2026-08-03 | parche | Carga la matriz de aplicabilidad de dimensiones antes de seleccionar las dimensiones de revisión, para que el Paso 0 no decida ejes incompletos antes de la lista autoritativa. |
| 3.0.1 | 2026-08-02 | parche | Mueve las dimensiones de auditoría y el barrido de nueve pasos tras rutas obligatorias de un salto y elimina prosa repetida de activación manteniendo intactos el informe fijo persistido y el contrato solo-recomendación. |
| 3.0.0 | 2026-07-31 | mayor | **Cambio incompatible de invocación:** este barrido costoso y solo de recomendación pasa a ser manual-only en Claude Code y OpenCode (`disable-model-invocation: true`, `opencode/autoinvoke: false`). La invocación explícita `/product-audit` no cambia; orquestadores y otras skills deben mantenerla como hand-off humano. |
| 2.3.0 | 2026-07-19 | menor | Cada ejecución queda ahora **persistida**: el informe se escribe y commitea como `docs/audits/<id>-<YYYY-MM-DD>.md` con un id de auditoría incremental (la única mutación de la skill). Los hallazgos llevan una única secuencia `F1, F2, …` ordenada por severidad (nunca letras por dimensión), las propuestas citan sus hallazgos de origen (`from: F<k>`), todos los flujos de propuestas — incluidos los de roadmap — están siempre presentes (`none — <why>` cuando están vacíos), y el bloque de cierre enruta a `triage-issue <id> F<k>` (sugiere el triaje, nunca lo ejecuta). |
| 2.2.0 | 2026-07-19 | menor | La dimensión Proceso y docs gana **frescura del inventario de capacidades**: contrasta `docs/CAPABILITIES.md` con el código (roles/permisos/subsistemas presentes en uno pero no en el otro son un hallazgo); un fichero de inventario ausente produce una propuesta de sembrarlo, nunca un auto-arreglo. |
| 2.1.0 | 2026-07-17 | menor | Nueva señal de **recurrencia de exportación de alcance** en la dimensión Disciplina de workflow: ≥ 2 unidades recientes consecutivas, cada una con una bitácora `## Amendments` de descope no vacía o un issue nacido clasificado como descope (puerta de scope-bleed de `audit-pr`), es un hallazgo de calidad de planificación ("features recortadas demasiado grandes para la capacidad real"), enrutado a las reglas de atomicidad/división (#64). El formato de salida gana un ejemplo trabajado bajo Top findings. Parte de #66. |
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
| 2.7.0 | 2026-09-04 | menor | Redirección por retiro (fix #161, P3a): el proceso de hallazgos de revisión re-ejecuta `/review-change` sobre un HEAD cambiado (vía `/fold-findings` primero) en lugar del router retirado `/loop-review-fold`. |
| 2.6.0 | 2026-08-14 | menor | Añade el modo de hallazgos de review `--prioritize-now <unit> F<k> …`: intenta arreglar inmediatamente cada hallazgo no resuelto o lleva el trabajo grande a `plan-feature`/`plan-fix`, nuevas fases `P<n>` y ejecución manual del usuario. |
| 2.5.1 | 2026-08-10 | parche | Hace que los hand-offs de triage por lotes asignen a cada issue/finding su propio comando concreto siguiente. |
| 2.5.0 | 2026-07-31 | menor | La carga progresiva selecciona primero issue del forge frente a hallazgo de auditoría persistido y después carga el detalle de propiedad de etiquetas y ledger de fold solo para los veredictos que lo necesitan. |
| 2.4.0 | 2026-07-19 | menor | Nuevo **modo hallazgo-de-auditoría** (`triage-issue <audit-id> F<k> …`): tría hallazgos de un informe persistido de `product-audit` — re-verifica el hallazgo contra el código actual, deduplica contra issues existentes, abre el issue de GitHub solo con un veredicto fix-now/postpone/promote (el cuerpo cita `Origin: product audit <id>, finding F<k>`), y marca el hallazgo como triado en el fichero de auditoría con una nota datada `↳ triaged`. Las invocaciones por número de issue no cambian. |
| 2.3.0 | 2026-07-18 | menor | Añade conciencia de unidad abierta (complemento del lado consumidor de `#66`): un chequeo de pertenencia de alcance se ejecuta antes de clasificar (enumerar unidades abiertas → comparación issue↔SPEC/fase citando ambos lados) y un quinto veredicto `fix-in-unit <unit>` resuelve los issues miembros en la propia rama de la unidad abierta — fold en su ledger `review-findings.md` (fila con marca de procedencia `triage #<n> <fecha>`) o en su fase actual/siguiente, un replan incremental (`design-feature`/`plan-feature`/una entrada `## Amendments` en el SPEC), o una restauración de scope-bleed. Los issues sin unidad se enrutan sin cambios, byte a byte. Corrige `#86`+`#87`. |
| 2.2.0 | 2026-07-14 | menor | Es propietaria de un segundo vocabulario de etiquetas — etiquetas de disposición terminal (`postponed` `#BFD4F2`, `promoted` `#C2E0C6`, `wontfix`): aplica la etiqueta correspondiente — creándola con `gh label create` si falta — como parte de un veredicto `postpone`/`promote`/`wontfix`, replicando la mecánica de las etiquetas de urgencia. Cierra el hueco de detección de no-triados falseable del issue `#54` dando a `workflow-status` una señal de triado inequívoca y protegida por permiso triage+, en vez de confiar solo en el texto del comentario `VERDICT:`. |
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
| 2.8.0 | 2026-07-31 | menor | La carga progresiva convierte bootstrap y upgrade aditivo en rutas mutuamente excluyentes y carga portabilidad del vendor solo para la primitiva ausente detectada; los gates universales de no-sobrescritura/consentimiento quedan en el entrypoint. |
| 2.7.0 | 2026-07-31 | menor | Añade una entrevista de hooks de seguridad del agente y una ruta de upgrade aditiva para Claude Code, Cursor, Copilot y OpenCode; los adaptadores aceptados se instalan de forma explícita, ejecutan el fixture canónico del guard y nunca sobrescriben una configuración de hooks personalizada. |
| 2.6.0 | 2026-07-31 | menor | Ofrece el documento opcional de invariantes arquitectónicas durante bootstrap y upgrade sin crear un requisito para repositorios existentes. |
| 2.5.2 | 2026-07-31 | parche | Mueve la guía bootstrap NRS debajo de los bullets de Guardrails para que los guardrails mantengan su alcance de sección previsto. |
| 2.5.1 | 2026-07-31 | parche | Enruta un proyecto recién configurado por discovery del estado del repositorio antes del diseño, la planificación o la ejecución. |
| 2.5.0 | 2026-07-31 | minor | Añade un paso explícito de proceso en bootstrap y upgrade para sembrar `docs/workflow/REPOSITORY_STATE.md` desde la plantilla sin sobrescribir un ledger existente. |
| 2.3.0 | 2026-07-19 | menor | La entrevista de bootstrap gana un paso de **inventario de capacidades**: siembra `docs/CAPABILITIES.md` desde el descubrimiento (roles + `yes\|no\|partial` por fila de subsistema de la plantilla propuestos desde el código; en un repo vacío las filas fijas se recorren con el usuario), podando filas que nunca aplican — nunca se deja como plantilla en bruto. El diff de plantilla del modo upgrade nombra el inventario y lo propone con los mismos valores sembrados por descubrimiento. |
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

| `pre-execution-review` | 1.0.0 | 2026-08-30 | — | Nueva dueña interna del ciclo de revisión pre-ejecución y de los libros de planificación: independencia de contexto limpio, exclusión del autor y etiquetas de diversidad veraces, hallazgos unidos con rechazo solo contra evidencia y sin cuórum, crítica/síntesis/arbitraje acotados, la regla de no-progreso, el informe `CONVERGENCE-ANOMALY` campo por campo y la definición única de las tablas de evidencia, obligaciones y hallazgos (hogares, estados, escritores). No emite veredicto ni escribe artefacto.
| `plan-feature-scaffold` | 2.0.0 | 2026-08-30 | mayor | **Juego de artefactos y entrega que rompen:** el esqueleto congela los dos libros de planificación mientras corta fases — `planning-evidence.md` + `planning-obligations.md` en M/L, `### Planning evidence` / `### Obligations` incrustados en XS/S —, ejecuta la preverificación `stage: plan` antes de informar, rota `artifactRevisionId` y devuelve una unidad cuyo siguiente paso es `/review-plan`, nunca `/execute-phase`. No se cortan fases hasta que cada obligación tenga fase y validador que pueda fallar.
| `evidence-grounding` | 1.1.0 | 2026-08-30 | menor | Las casillas `stage: plan` citan al dueño común de libros para las formas de tabla y apuntan la regla de no-progreso del ciclo de revisión a `pre-execution-review`; los vocabularios emitidos no cambian y sigue sin poder emitir un PASS de revisión.
### Internas (`user-invocable: false`)

| Skill | Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|---|
| `evidence-grounding` | 1.6.0 | 2026-09-03 | menor | **Pase web** (fix #161): cuando la evidencia del repositorio no puede responder una pregunta acotada — y siempre en etapa de diseño, donde la compuerta de investigación de `design-feature` la hace obligatoria — se obtienen fuentes externas y cada una se congela como fila de evidencia (URL + fecha de acceso); sin conexión o sin respuesta devuelve `NEEDS-EVIDENCE`, nunca una cita inventada. ROWS.md acepta documentación externa obtenida por red como `source-and-location` (URL + fecha de acceso). |
| `plan-feature-scaffold` | 2.2.0 | 2026-09-03 | menor | **Investigación y traza de referencias** (fix #161): investigación web condicional (solo cuando una pregunta acotada de ROWS.md no se responde con evidencia del repositorio — exactamente un pase web antes de emitir fases) más una traza de referencias obligatoria: el código afectado se localiza por búsqueda de símbolos/referencias (LSP/serena cuando está disponible, grep si no), el blast radius se deriva de esa búsqueda, nunca de la memoria del modelo. Techos de ruta `plan-feature:scaffold` re-basados, este texto como fuente nombrada del crecimiento. |
| `review-code` | 1.2.0 | 2026-09-03 | menor | **Traza de referencias** (fix #161): nueva casilla de checklist — todo símbolo/API cambiado recibió una búsqueda de referencias; los llamadores sin actualizar son hallazgos. |
| `review-seo` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-perf` | 1.2.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-brand` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-a11y` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-design` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-verify` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-security` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `review-code` | 1.1.0 | 2026-09-03 | menor | **Barra de materialidad** (fix #159): reportar una fila solo cuando el resultado de un usuario competente cambia o se viola una regla que el proyecto declara explícitamente — citando la regla violada; los typos de comentarios/puntuación, la deriva de formato, la preferencia de estilo sin regla citada y la robustez hipotética más allá de los escenarios nombrados por el SPEC no son hallazgos; una tabla vacía con `Decision: PASS` es el resultado esperado de un cambio bien formado — nunca rellenar la tabla. |
| `evidence-grounding` | 1.5.0 | 2026-09-03 | menor | **Disciplina de afirmaciones** (fix #159): una afirmación prospectiva enunciada como hecho presente es una sobreafirmación — la prosa de SPEC, plan y acceptance solo afirma lo que es cierto al momento de redactar, o nombra el paso posterior exacto que la hace verdad con su fase propietaria y su validador; "el PR cierra la issue", "merged", "CI en verde" escritos antes de que el forge lo diga son registros falsos que las revisiones deben perseguir. |
| `verification-contract` | 1.2.1 | 2026-09-04 | parche | Sin cambio de comportamiento (fix #161, P3a): la descripción `Consumed by` elimina el `loop-review-fold` retirado. |
| `verification-contract` | 1.2.0 | 2026-09-03 | menor | **Inmutabilidad de tests** (fix #161): un test, una vez escrito, es inmutable — el ejecutor arregla código hasta verde, nunca el test; la única enmienda legítima es una **codificación errónea comprobada de la semántica externa** citada de documentación autoritativa, presentada como hallazgo más una enmienda de SPEC; la regla research-before-encode (la semántica de la plataforma se verifica antes de que un test la codifique); añadir tests más fuertes sigue permitido, editar expectativas nunca. |
| `verification-contract` | 1.1.0 | 2026-09-03 | menor | **Estabilidad del validador** (fix #159): un validador nunca debe depender de una superficie que otros actores del workflow mutan — el diff de la rama entero, el log de sesión, las entradas de progreso, los ledgers de revisión o el estado del forge — porque cualquier commit fuera de la unidad re-falla un criterio congelado sobre una unidad terminada y re-abre su bucle de revisión; los validadores basados en diff enumeran las rutas de la unidad o excluyen explícitamente las superficies mutadas por el workflow. |
| `review-implementation` | 1.7.0 | 2026-09-04 | menor | Redirección por retiro (fix #161, P3a): la ruta de fold `source`/`environment`/`runtime` nombra la vía manual `/fold-findings` y luego re-ejecutar `/review-change` en lugar del router retirado `loop-review-fold`. |
| `review-implementation` | 1.6.0 | 2026-09-03 | menor | Suelo de severidad en la clasificación (fix #159): un hallazgo `low` (gusto, cosmética, micro-optimización sin necesidad medida) **nunca se persiste ni bloquea** — se lleva como nota del informe y el ledger de fold nunca lo ve; un defecto real etiquetado erróneamente como `low` se re-escala a `med` como mínimo (degradar un defecto real a `low` para desbloquear una revisión es en sí mismo un defecto de revisión); solo los hallazgos `high`/`med` pasan la puerta de la unidad actual. |
| `pre-execution-review` | 1.7.0 | 2026-09-04 | menor | Redirección por retiro (fix #161, P3a): la lista de unión pre-ejecución elimina el router retirado `loop-review-fold`. |
| `pre-execution-review` | 1.6.0 | 2026-09-03 | menor | `LEDGERS.md` declara la **marca durable de hallazgo**: una firma `finding-mark@1` por hallazgo en las columnas ya existentes del ledger `review-findings.md` (ids `VF-`, ruta `confirmed | refuted`, método de re-verificación + referencia al reproductor, contraevidencia para un candidato refutado, nunca fila/tarea de fold/trigger de re-revisión), escritor único `review-change`; el mapa de propiedad y ambas proyecciones de plantilla añaden `review-change:finding-mark`. No emite veredicto ni escribe artefacto (fix #161). |
| `pre-execution-review` | 1.5.0 | 2026-09-01 | menor | `LEDGERS.md` declara la **marca durable de revisión**: una fila `review-mark@1` de `review-findings.md` en las columnas ya existentes de ese ledger, con `file:line` atado al commit contra el que se dictó el veredicto y cada celda restante en `n/a` porque la fila no reporta hallazgo — lo que además la mantiene fuera de la proyección fix-now, fuera de `fold-findings` y fuera del patrón de filas `F<n>` del anotador, mientras el dedupe `file:line`+axis del ledger admite exactamente una marca por estado reseñado. El mapa de propiedad y ambas proyecciones de plantilla añaden `review-change:review-mark`; la §8 sigue siendo dueña de *cuándo* un acto terminal marca, y una marca sigue sin decir nada sobre aprobar. No emite veredicto ni escribe artefacto (AC20/O20; `workflow-status` 3.1.0). |
| `evidence-grounding` | 1.4.0 | 2026-09-02 | menor | Plegado del hallazgo F40/F41 (pierna de ejecutor débil): el paso 2 dice ahora a quien lee que **él** es el delegado cuando no escribió el artefacto — los pasos 1, 3 y 4 no son su turno, y `references/DELEGATION.md` le rige sea cual sea el nombre de la invitación — y la celda `Invoked by` de `DELEGATION.md` lo dice en una cláusula. La caja 1 de `READINESS.md` deja de reproducir la lista de encabezados de Product en prosa: nombra `SPEC_PRODUCT_REQUIRED_HEADINGS` como su dueño y FALLA donde el selector canónico rechace estos bytes, por limpio que el bloque se lea a un humano. |
| `evidence-grounding` | 1.3.0 | 2026-09-01 | menor | Nuevo `references/DELEGATION.md`: el contrato de rol delegado y solo-lectura para la adquisición extensa de evidencia, conservada como un artefacto versionado por unidad (`delegated-evidence.md`) con `revision` positiva, el resultado fijo `done / partial / blocked`, los siete campos de la fuente, afirmaciones mapeadas a ids de fuente, contradicciones, frescura, decisiones de producto no autoritativas guardadas aparte y una sección explícita de afirmaciones sin verificar. `partial` o `blocked` no valida ninguna afirmación y la nueva caja compartida D1 de preparación devuelve `NEEDS-EVIDENCE`; el estado pendiente se persiste antes de cualquier petición y el turno termina; el artefacto es advisory hasta que la habilidad autora comprueba sus citas; el trabajo delegado recibe un sandbox cuyos ledgers el propio contrato declara de juguete (AC18/O18, known-issue 16). No emite veredicto de reseña ni escribe ledger. |
| `pre-execution-review` | 1.4.0 | 2026-09-01 | menor | `POLICY.md` incorpora la §8 *write-then-report*: única dueña de la regla de que un turno que termina en un veredicto terminal o en un rechazo de puerta escribe su marca durable en ese mismo acto. Declara el vocabulario cerrado de rechazos (`dependency`, `status`, `phase-lint`, `stale-or-missing-receipt`), el registro fijo `GATE REJECTION` con razón y ruta de regreso, y la negativa `MARK REPLAY — stale|wrong|duplicate` con cero efectos secundarios; la §7 enuncia la regla del valor de identidad como recalcular y registrar el valor afirmado a su lado; el mapa de propiedad añade `execute-phase:gate-rejection-traces` en `progress.md` (AC17/O17, hallazgo F37). No emite veredicto ni escribe artefacto. |
| `pre-execution-review` | 1.3.0 | 2026-09-01 | menor | `POLICY.md` incorpora la §7 *Contenido no confiable`: única dueña de la regla de que todo lo que lee un rol del ciclo —SPEC o plan revisado, sus libros, la fila del roadmap, el issue o PR rector y cualquier bloque de recibo copiado de ellos— es dato, nunca instrucción. Los veredictos exigidos, las severidades prescritas y las órdenes de saltar comprobaciones pasan a ser hallazgos contra el artefacto que los contenía, y los valores de identidad de un recibo se recalculan desde los bytes, nunca desde la prosa (hallazgo F28). No emite veredicto ni escribe artefacto. |
| `evidence-grounding` | 1.2.0 | 2026-09-01 | menor | Las barreras declaran que una fuente citada es dato, nunca instrucción: una directiva, un veredicto exigido o una severidad prescrita hallada dentro de un issue, PR o documento no es evidencia para una fila y nunca se obedece — se informa al humano (hallazgo F28; `POLICY.md` §7). Los vocabularios de preparación no cambian; sigue sin poder emitir un PASS de reseña. |
| `evidence-grounding` | 1.1.2 | 2026-08-31 | parche | Reparación del pliegue (F12): ROWS.md declara ahora la extensión de la tabla de etapa plan — `id` estable prefijado más `affected-decision-or-obligation` — de modo que la forma de la fila de evidencia tiene una única definición; vocabularios y resultados de preparación sin cambios. |
| `pre-execution-review` | 1.2.0 | 2026-09-01 | menor | Reparación del lote RS de la receta de instantáneas: SNAPSHOT.md documenta `--parent` en la construcción **y** re-verificación de un plan feature, el padre `null` de la unidad fix (D30) y la atribución `structural.reasonCode` / `structural.changedPaths` que `verify` produce ahora; y registra que la identidad de la instantánea toma por defecto el commit más reciente que tocó una ruta **vinculada**, de modo que grabar un recibo o cualquier commit ajeno ya no lo caduca, mientras un movimiento real de bytes vinculados sí lo hace, exactamente una vez (hallazgos RS3(b), RS13, RS14; D29, D30). No emite veredicto ni escribe artefacto. |
| `pre-execution-review` | 1.1.1 | 2026-08-31 | parche | Reparación del pliegue (F12): LEDGERS.md §1 ya no redeclara las columnas de la fila de evidencia — apunta a la extensión declarada de ROWS.md (una definición, ninguna segunda copia); hogares, escritores y estados sin cambios. |
| `pre-execution-review` | 1.1.0 | 2026-08-30 | menor | El §5 nombra ahora todas las rutas del conjunto pre-ejecución que nunca pueden crear un issue de forja ni aplazar una obligación sin una enmienda del usuario, añade que el PASS de un escalón vecino nunca otorga autoridad de ejecución, y el §6 pasa a ser el único dueño de la adopción heredada (construir, nunca forzar; artefactos congelados byte a byte; reanudar solo con un `PLAN-REVIEW-PASS` vigente; informar `legacy` distinto de `missing`). |
| `plan-feature-scaffold` | 2.1.0 | 2026-08-30 | menor | El paso de congelación declara sin rodeos que ninguna obligación se descarga al cortar fases: ninguna fase puede planificarse contra un issue futuro, el esqueleto no crea ninguno, y `deferred` solo existe después de que el usuario enmiende el SPEC rector. |
| `evidence-grounding` | 1.1.1 | 2026-08-30 | parche | Aclarado que una fila de expectativa puede leer `deferred` solo tras una enmienda del usuario al SPEC rector, nunca un issue que esta habilidad archivó. |
| review-implementation | 1.5.0 | 2026-08-30 | menor | Cada hallazgo lleva ahora un escalón dueño (`product | plan | source | environment | runtime`, definido por `pre-execution-review`) en su celda `Route` — la clase dice qué hacer, el dueño dice qué artefacto cambiar — y las filas `fix-now` de dueño `plan`/`product` no son plegables y deben citar el artefacto al que apuntan. |
| `evidence-grounding` | 1.0.0 | 2026-08-30 | — | Nueva dueña interna de la autoría basada en evidencia: la fila fija afirmación/autoridad/evidencia/frescura/desconocido, los vocabularios cerrados de `authority-kind` y `freshness`, los pases ordenados inventario → evidencia → borrador → corte → preparación, la preverificación determinista `READY-FOR-REVIEW | NEEDS-EVIDENCE | NEEDS-DESIGN | NEEDS-REPLAN`, la rotación de `artifactRevisionId` (revertir es escribir) y la regla de no-progreso de «nueva pregunta nombrada o nueva evidencia». Nunca emite un veredicto de revisión.
| `orchestration-envelope` | 2.0.2 | 2026-08-22 | parche |
| `plan-feature-from-issue` | 2.0.0 | 2026-08-30 | mayor | **Entrega que rompe:** reducida a la mitad de producto. Diseña y prepara un SPEC derivado de issue y se detiene en la puerta de revisión de producto, entregando a `/review-spec`: sin mitad de ingeniería, sin fases, sin escribir `defined → planned` y sin componer `plan-feature-scaffold` en el mismo turno. El nombre se mantiene por compatibilidad.
 Restaura la distribución mediante el `skills add` predeterminado al retirar los metadatos erróneos de exclusión del descubrimiento, para que los consumidores instalen el contrato de turno canónico requerido por `design-feature`, `execute-phase` y `review-change`. |
| `orchestration-envelope` | 2.0.1 | 2026-08-21 | parche | Aclara que `ship-roadmap` es un conductor con banner nativo fuera de los perfiles de resultado máquina de workers/sensors, y alinea la guía de perfiles y drivers. |
| `orchestration-envelope` | 2.0.0 | 2026-08-21 | mayor | **Contrato de driver incompatible:** sustituye el prompt duplicado del envelope completo por perfiles de salida del paquete, SkillOutcome v1 compacto, snapshots deterministas, compatibilidad nombrada y una reparación genérica acotada de resultado máquina. Ver `docs/workflow/MIGRATION.es.md`. |
| `orchestration-envelope` | 1.5.1 | 2026-08-09 | parche | Sin cambio de comportamiento: comprime emisión, reglas de campos, repair loop, sincronización de paquete, relaciones y NRS preservando esquema y protocolo del driver. |
| `verification-contract` | 1.0.1 | 2026-08-09 | parche | Registra esta dependencia de ejecución para su distribución y la mantiene fuera del menú invocable por el usuario, de modo que el `skills add` normal instala el contrato consumido por planificadores, ejecutores, revisores y loops. |
| `planning-preflight` | 1.1.1 | 2026-08-09 | parche | Registra esta dependencia de ejecución para su distribución y la mantiene fuera del menú invocable por el usuario. |
| `phase-contract` | 1.0.1 | 2026-08-09 | parche | Registra esta dependencia de ejecución para su distribución y la mantiene fuera del menú invocable por el usuario. |
| `verification-contract` | 1.0.0 | 2026-08-09 | — | Nuevo contrato interno: congela un `ACCEPTANCE.md` compacto por unidad, liga la evidencia de ejecución/review a su blob, define estados de validación y prohíbe debilitar tests o aceptación para fabricar verde. |
| `orchestration-envelope` | 1.5.0 | 2026-08-09 | menor | El contrato canónico de turno lleva el blob de aceptación congelado y prohíbe crear issues automáticamente para propuestas independientes, habilitando drivers acotados de unidad completa y review/fold sin cambiar el esquema JSON. |
| `plan-feature-scaffold` | 1.14.0 | 2026-08-09 | menor | Emite el manifiesto de aceptación congelado para cualquier tamaño de feature y entrega por defecto todas las fases restantes a la ejecución solo-con-objetivo. |
| `phase-contract` | 1.0.0 | 2026-08-04 | — | Nuevo contrato interno: propietario canónico del phase-lint de ocho cajas, con salida fija `PASS (8/8)`/`BLOCKED — casilla <n>` y el fingerprint de fase normalizado (`P<n>:<layer>:<n-tasks>:<title-deliverable>`). |
| `planning-preflight` | 1.0.0 | 2026-08-04 | — | Nuevo contrato interno: único consumidor del estado normalizado del repositorio y único propietario de la única clasificación arquitectónica final de un plan completo, con línea de resultado preflight fija. |
| `plan-feature-scaffold` | 1.13.0 | 2026-08-04 | menor | Consume el planning preflight (lectura NRS + una única clasificación arquitectónica final) y el phase contract (phase-lint de 8 casillas + fingerprint de fase) en lugar de duplicar reglas de invariantes y lint. |
| `plan-feature-from-issue` | 1.7.0 | 2026-08-04 | menor | La sección de invariantes arquitectónicas ahora consume el planning preflight para la lectura del estado normalizado del repositorio y la única clasificación arquitectónica final. |
| `bump-skill` | 2.3.2 | 2026-08-02 | parche | Separa el descubrimiento/lint de cambios de la sincronización de versión/documentación y condensa ambas referencias sin cambiar semver, lint de siete reglas, changelogs bilingües, READMEs, routing ni migraciones. |
| `plan-feature-scaffold` | 1.12.1 | 2026-08-02 | parche | Mueve el procedimiento completo de scaffold a un recurso obligatorio de un salto y comprime prosa repetida de fases conservando todas las reglas de mitad de producto, artefactos, lint, relectura de roadmap e informe fijo. |
| `review-implementation` | 1.3.1 | 2026-08-02 | parche | Separa el hallazgo adversarial de la clasificación/routing en dos recursos secuenciales obligatorios; ejes, límites de override, clases y comportamiento de solo lectura no cambian. |
| `orchestration-envelope` | 1.4.1 | 2026-07-31 | parche | Mueve la guía NRS de drivers debajo de los bullets de relación para que esos bullets mantengan su alcance de sección previsto. |
| `bump-skill` | 2.3.1 | 2026-07-18 | patch | Seguimiento de `review-change` sobre #74/PR #96: se corrigieron las referencias al conteo de reglas del lint §2b ("dos" → "siete" invariantes de autoría de `CLAUDE.md`, en consonancia con "las 7 reglas de autoría" del Turn contract) y se ancló el grep de la regla 7 (exclusión de descubrimiento) al bloque de frontmatter únicamente (región extraída con `awk` entre las dos primeras líneas `---`), de modo que ya no puede satisfacerse con la propia prosa de la regla que menciona `metadata.internal: true` en vez de una clave real de frontmatter. |
| `bump-skill` | 2.3.0 | 2026-07-18 | menor | Fix #74: `bump-skill` lleva ahora `metadata.internal: true` — el mecanismo propio de la CLI `skills` (verificado en `dist/cli.mjs` 1.5.16/1.5.19) que impide que `npx skills add . --list` descubra u ofrezca skills internas del repo, a diferencia de `user-invocable`/`plugin.json`, que solo rigen el menú posinstalación. El lint de §2b gana una 7ª regla que exige lo mismo para cualquier futura skill interna del repo (conjunción: `user-invocable: false` Y ausente de `plugin.json`). |
| | 2.2.0 | 2026-07-18 | menor | Fix #71/#72/#73: el lint de §2b gana dos comprobaciones de superficies máquina — paridad con `plugin.json` (toda skill `user-invocable: true` tiene su entrada en el array) y orden alfabético de las superficies máquina (array `skills` de `plugin.json` + claves de `model-routing.yml`) — la misma clase de deriva que dejó a `fold-findings` instalarse sin registrar. |
| | 2.1.0 | 2026-07-11 | menor | Fix #40: reclasificada como `user-invocable: false` — la skill es mantenimiento del propio repo `agentic-workflow` y su entrada de menú `/bump-skill` era ruido para el ~99% de quienes consumen el paquete sin autorar sus `SKILL.md`. Sin cambio de comportamiento; se sigue ejecutando vía la herramienta Skill o siguiendo `SKILL.md` directamente. Su tabla por skill se traslada de "Mantenimiento del repo" a esta sección Interna. |
| | 2.0.0 | 2026-07-10 | mayor | **Cambio incompatible:** se elimina la sección `## Machine envelope` y su cláusula de emisión en el contrato de turno — el contrato del envelope se traslada a la capa de orquestación; `workflow-status` sigue siendo el único emisor en línea. Además se retira la regla de lint "Machine envelope", ya obsoleta (exigía que toda skill de cara al usuario llevara la sección — ya no es cierto). Ver `docs/workflow/MIGRATION.md`. |
| | 1.5.0 | 2026-07-05 | menor | Envelope máquina: cada invocación termina ahora con un bloque JSON fijo (state, unit, phase, pr, findings, blockers, dependencies, next + pista de tier de modelo) para orquestación programática — esquema en la skill interna `orchestration-envelope`, protocolo en `docs/workflow/ORCHESTRATION.md`. El lint gana una 5ª regla: las skills de cara al usuario deben llevar la sección `## Machine envelope`. |
| | 1.3.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`); la guía sobre modelos no-Claude en la descripción se sustituyó por un puntero a `#claude`. |
| | 1.3.0 | 2026-07-03 | menor | El lint comprueba también la nueva sección `## Turn contract` en las skills de cara al usuario. |
| | 1.2.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| | 1.2.0 | 2026-07-02 | minor | El lint ahora comprueba también que las skills de cara al usuario llevan la sección `## Portability`; añadida su propia nota de Portability. |
| | 1.1.0 | 2026-06-27 | menor | Paso de lint que marca las skills editadas sin bloque `→ Next:` o con etiquetas de fase `S1`/"Step" (avisa, nunca corrige solo) |
| | 1.0.0 | 2026-06-19 | — | Nueva skill de mantenimiento del repo. Tras editar un SKILL.md, sube la `version:`, añade filas en CHANGELOG.md + CHANGELOG.es.md y actualiza las tablas de skills y modelos en README.md + README.es.md |
| `orchestration-envelope` | 1.4.0 | 2026-07-31 | menor | Los drivers llaman a `discover-repository-state` antes de planificar, pasan la referencia del ledger NRS congelado y enrutan contradicciones a `resolve-repository-state` sin reemplazar snapshots silenciosamente. |
| | 1.3.0 | 2026-07-19 | menor | Fix #79: `next.suggested[]` (opcional, `{command, trigger, source_skill}[]`) añadido al snippet canónico del esquema + una regla de campo — sugerencias atribuidas a un trigger que emite `workflow-status`, con fuente única desde la condición propia de cada skill dueña, solo consultivas (nunca reemplazan `next.recommended`/`next.tier`). Reflejado en `packages/agentic-workflow-schema` 2.1.0. |
| | 1.2.0 | 2026-07-13 | menor | Atajo de structured outputs para drivers: cuando el provider/modelo soporta structured outputs estrictos (`response_format: json_schema` + `strict`), el turno de solo-envelope (el prompt de reparación, o un turno final dedicado a "emite el envelope") puede pasar el `envelope.schema.json` del paquete npm como response format para que la respuesta valide por construcción. El bucle de reparación queda como fallback para modelos sin la funcionalidad; los turnos de trabajo nunca llevan response format (forzaría toda la salida a JSON y suprimiría la prosa/el uso de tools). Esquema sin cambios — no se necesita release del paquete. |
| | 1.1.1 | 2026-07-10 | parche | Fix #33: la descripción del frontmatter y la sección de apertura aún enunciaban el contrato previo a la feature 10 ("toda skill de cara al usuario imprime el envelope") POR ENCIMA de la corrección de la feature 10 — reescritas de cabeza al contrato vigente (esquema + regla de parseo último-json-cercado como núcleo; emisión = `workflow-status` siempre, el resto de skills solo bajo el snippet inyectado por el driver, nada en sesiones interactivas). La misma frase obsoleta corregida en `packages/agentic-workflow-schema/README.md`, `package.json`, `src/index.ts` y `envelope.schema.json` (solo texto de descripción/comentario/metadatos, sin cambio de forma del esquema ni de comportamiento, sin release del paquete). |
| | 1.1.0 | 2026-07-10 | menor | Nueva sección `## Driver system-prompt snippet + repair loop`: el snippet canónico de system-prompt inyectado por el driver (verbatim, cercado) y el protocolo de bucle de reparación (fallo de parseo → reinvocar con "Emit only the machine envelope for the turn above.", un reintento, luego FAILED del driver) — el requisito del envelope se traslada aquí desde los contratos de turno por skill de las 14 skills de cara al usuario. |
| | 1.0.0 | 2026-07-05 | — | Nuevo contrato interno: el esquema JSON del envelope máquina (11 estados, claves fijas, regla de parseo último-json-cercado) que toda skill de cara al usuario emite como su salida final absoluta. |
| `review-implementation` | 1.3.0 | 2026-07-19 | menor | Nueva regla dura de **presupuesto de contexto** (el diff más ≤ 10 lecturas completas de ficheros fuera del diff; lecturas dirigidas ≤ 50 líneas y greps no cuentan; registra cada hallazgo como su fila de tabla de inmediato y suelta el contenido crudo), y la comprobación de arreglo-barato gana una cota fija — ≤ ~15 líneas cambiadas Y ≤ 2 ficheros Y sin cambio de API pública/esquema/diseño ni migración — sustituyendo el juicio de "unas pocas líneas". |
| `review-implementation` | 1.2.2 | 2026-07-19 | parche | Se corrige un encabezado ATX partido — el encabezado `###` de "Fix-now override checks" ocupaba dos líneas y se renderizaba como dos H3 separados; ahora es una sola línea de encabezado. Solo formato, sin cambio de comportamiento. |
| | 1.2.1 | 2026-07-19 | parche | Aclara el alcance de las comprobaciones de anulación hacia fix-now: solo condicionan `postpone`/`intentional-tradeoff` para un *defecto real confirmado* — `ignore` (falso positivo/negligible) se decide antes y nunca debió pasar por esta puerta. Solo redacción; sin cambio de comportamiento. |
| | 1.2.0 | 2026-07-19 | menor | La Fase 2 gana dos **comprobaciones de anulación hacia fix-now**, obligatorias antes de cualquier clase no-fix-now: un arreglo barato (unas pocas líneas de bajo riesgo que cuestan menos que rastrear un issue) o un defecto dentro de alcance (dentro del alcance del SPEC que gobierna la unidad) es siempre fix-now — postpone/known-issue/tradeoff no están disponibles para ellos. Un fix-now grande dentro de alcance nunca se degrada: nueva ruta `replan-in-unit` que añade fase(s) confirmadas por el usuario al ledger `## Phases` del SPEC de la unidad — antes de la fase final `Hardening & PR` si aún no se ejecutó; después de ella más una nueva fase final `Hardening & PR` si ya se ejecutó (un hardening completado nunca avala trabajo posterior) — ejecutadas en la misma rama. Se añade la guarda simétrica de no-desinflar. |
| | 1.1.0 | 2026-07-09 | menor | La postura de la Fase 1 ("Find") ahora es adversarial por defecto: "asume que el diff está MAL — tu trabajo es probar que no funciona". La tabla de ejes y la rúbrica de clasificación de la Fase 2 no cambian. |
| | 1.0.3 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.0.2 | 2026-07-02 | parche | La referencia a revisiones companion ahora apunta al pack de revisión interno (`review-*`) |
| | 1.0.1 | 2026-06-09 | parche | Descripción acortada 96 → 36 palabras (contexto siempre cargado); cuerpo sin cambios |
| | 1.0.0 | 2026-06-05 | — | El motor de hallazgos + rúbrica de clasificación que compone `review-change` |
| `plan-feature-interview` | — | 2026-07-09 | eliminada | **Retirada.** Su lógica de entrevista de idea en crudo se trasladó a la nueva skill de cara al usuario `design-feature` (la definición de producto es ahora su propia etapa del pipeline, no un detalle interno de enrutado de `plan-feature`). `skills/plan-feature-interview/` borrado. Ver `docs/workflow/MIGRATION.md`. |
| | 1.2.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo devuelto al router (dimensiones resueltas, preguntas abiertas, issue de tracking) |
| 1.1.0 | 2026-06-09 | menor | Estima el tamaño `XS/S/M/L`; pide una referencia de diseño UI en features con UI |
| | 1.0.0 | 2026-06-05 | — | Entrevista una idea en crudo hasta un SPEC |
| `plan-feature-from-issue` | 1.6.0 | 2026-07-31 | menor | Clasifica invariantes arquitectónicas opcionales del proyecto antes de sellar como diseñado una mitad de producto derivada de un issue, deteniéndose para una decisión arquitectónica explícita cuando es necesaria. |
| `plan-feature-from-issue` | 1.5.0 | 2026-07-19 | menor | El cierre de huecos (paso 4) ahora sondea la rúbrica de vaguedad fija de seis huecos de `design-feature`, pregunta **una cuestión por turno** con un valor por defecto recomendado (antes: agrupar preguntas relacionadas), y gana un umbral estructural de entrega: ≥ 3 huecos de la rúbrica irrellenables con el issue más las respuestas → entregar la feature a `design-feature`. |
| `plan-feature-from-issue` | 1.4.0 | 2026-07-09 | menor | Ahora **escribe** la fila del roadmap a `defined` en la misma edición que sella `## Design status: designed` (añadida en `idea` primero si la fila no existía) — la transición `idea → defined`, realizada aquí cuando esta skill satisface el cierre directamente en vez de entregar a `design-feature`. |
| | 1.3.0 | 2026-07-09 | menor | Ahora escribe la **mitad de producto** del SPEC (convención de dos mitades) y debe satisfacer el **cierre de capacidades** antes de entregar — un issue delgado sin suficiente contenido para completarlo se entrega a `design-feature` (compuesta en el mismo turno solo si es de tier ≥) en vez de simular `## Design status: designed`. |
| | 1.2.1 | 2026-07-04 | parche | Sin cambio de comportamiento: el frontmatter `model:`/`effort:` de esta skill se trasladó a `docs/workflow/model-routing.yml` (usado solo para construir la rama `#claude`). |
| | 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo devuelto al router (veredicto, huecos cerrados, Closes #N enlazado) |
| 1.1.0 | 2026-06-09 | menor | Produce un SPEC acotado **dimensionado** con `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → SPEC acotado |
| `plan-feature-scaffold` | 1.12.0 | 2026-07-31 | menor | Registra evidencia y clasificación de invariantes arquitectónicas opcionales en la mitad de ingeniería y se detiene en vez de emitir fases para una violación, introducción o cambio. |
| `plan-feature-scaffold` | 1.11.0 | 2026-07-19 | menor | Nuevo paso obligatorio de **Spec-lint** en tiempo de emisión (todas las casillas del nuevo `### Spec-lint` de la plantilla de SPEC — casillas de ingeniería más las de producto como comprobación de regresión; fail-closed, solo comprobaciones de presencia); el informe fijo de finalización ahora enuncia los resultados de Spec-lint/Phase-lint; `progress.md` se crea solo con la cabecera `Last reviewed: —` y se documenta como el fichero al que `execute-phase` añade sus entradas del esquema fijo de handoff. |
| `plan-feature-scaffold` | 1.10.0 | 2026-07-17 | menor | Fix #64: la checklist por fase (§ "Scale the artifacts") gana un paso obligatorio de **Phase-lint** en tiempo de emisión — antes de emitir la lista de fases, toda fase debe pasar el lint canónico de 8 casillas (`docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint" — la copia autoritativa); cualquier FAIL se recorta o divide vía la regla de división obligatoria existente, nunca se emite. |
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

- **2026-09-01 — la lectura delegada vuelve como artefacto, no como prosa.** La fase P12 de la feature 28 (AC18, obligación O18) convierte a `evidence-grounding` 1.3.0 en dueña del pase de evidencia delegado: la lectura extensa ocurre fuera del contexto de autoría, en un contexto fresco de solo lectura cuando el anfitrión lo ofrece o en una conversación nueva manual cuando no, y conserva lo leído en un artefacto versionado por unidad — `revision` positiva, `done / partial / blocked`, las preguntas, las fuentes con sus siete campos, afirmaciones mapeadas a ids de fuente, contradicciones, frescura, decisiones de producto guardadas aparte y afirmaciones sin verificar. Una corrida `partial` o `blocked` no valida nada y la nueva caja compartida D1 de preparación devuelve `NEEDS-EVIDENCE`; el estado pendiente se escribe antes de pedirle nada a nadie (la escritura pendiente es acto de la §8 de `POLICY.md`, ampliada en su dueño, no copiada en una consumidora); y el artefacto queda como advisory hasta que la habilidad autora comprueba sus citas. El mismo contrato cierra el known-issue 16 en voz alta: los ledgers de una corrida delegada son de juguete según el texto del propio rol, así que una prueba ya no puede obedecer a su skill y escribir ledgers reales. La limitación por capacidades sigue siendo auto-declarada y fuera de alcance — no se añadió vocabulario de permisos. Seis techos de ruta y el techo de referencias de `pre-execution-review` se recalibran a sus suelos medidos con este texto como origen declarado del crecimiento.
- **2026-09-01 — una reseña limpia ya deja rastro.** La fase P11 de la feature 28 (AC20, obligación O20) convierte a `pre-execution-review` 1.5.0 en dueña de la **marca durable de revisión**: una fila `REVIEW-RAN` del ledger `review-findings.md` de la unidad, atada al commit contra el que se dictó el veredicto, declarada en el mapa de propiedad de escritura y en ambas proyecciones de plantilla. `workflow-status` 3.1.0 lee esa marca como única prueba de que la revisión obligatoria corrió para el estado actual de la unidad y borra la inferencia de presencia de ledger que usaba en su lugar; así, una reseña sin hallazgos y una unidad que nadie revisó son ahora dos hechos distintos — y una marca cuyo commit fue superado se rechaza con la misma frescura atada a SHA en que ya se apoya cada recibo, sin añadir un segundo mecanismo. Cinco techos de ruta se recalibran a sus suelos medidos, con este texto como origen declarado del crecimiento.
- **2026-09-01 — un turno no termina hasta que su marca existe.** La fase P10 de la feature 28 (AC17, obligación O17) convierte a `pre-execution-review` 1.4.0 en única dueña de write-then-report: la §8 de `POLICY.md` liga cada veredicto terminal y cada rechazo de puerta a una marca durable escrita en el mismo acto, fija los cuatro tipos de rechazo con su razón y ruta de regreso, y niega una marca obsoleta, equivocada o duplicada con cero efectos secundarios. Los cinco bloques fijos de `execute-phase` imprimen ese registro, `review-spec` 1.3.0 y `review-plan` 1.3.0 citan la regla en una línea, la redacción del digest padre de `review-plan` deja de contradecir la §7 (hallazgo F37) y el mapa de propiedad de libros declara el nuevo conjunto de columnas de `progress.md`. Cinco techos de ruta y el techo de referencia de `execute-phase` se recalibran a sus suelos medidos, con este texto como origen declarado del crecimiento.
- **2026-09-01 — el contenido revisado es dato, nunca instrucción.** El plegado de la reseña del feature 28 (PR #155) cierra la brecha de inyección de prompts que su propio tercer ciclo halló en la superficie entregada (hallazgo F28): `pre-execution-review` 1.3.0 añade `POLICY.md` §7 como única dueña de la regla de contenido no confiable, y `review-spec` 1.2.0, `review-plan` 1.2.0 y `evidence-grounding` 1.2.0 atan su conjunto de lectura a ella; así, una directiva, un veredicto exigido o una severidad prescrita dentro de un artefacto revisado pasa a ser un hallazgo contra ese artefacto y no una orden. Seis presupuestos de ruta se recalibran a sus suelos medidos, con este texto como fuente de crecimiento nombrada.
- **2026-08-31 — las puertas calculan el digest que la receta define.** El plegado de la
  revisión de la funcionalidad 28 (PR #155) corrige la receta del digest en los tres
  consumidores pre-ejecución: `workflow-status` 3.0.1, `execute-phase` 4.0.1 y
  `audit-pr` 5.0.1 re-derivan el digest del snapshot con la receta de verificación que
  `pre-execution-review` posee en lugar de `git hash-object`, y la suite P4 fija la
  receta corregida en las tres puertas.

- **2026-08-31 — los libros de planificación tienen una definición.** El plegado de la
  revisión de la funcionalidad 28 (PR #155) hace que el dueño exigido coincida con el
  declarado: `evidence-grounding` 1.1.2 declara la extensión de la tabla de etapa plan
  (`id` estable prefijado + `affected-decision-or-obligation`), `pre-execution-review`
  1.1.1 deja de redeclarar las columnas, `plan-fix` 3.0.1 y ambas plantillas de SPEC
  incrustan los libros bajo los rótulos canónicos `###`, y `workflow-status` 3.0.2
  nombra los campos de autor reales del recibo.

- **2026-08-30 — el enrutado impone la autoridad.** La fase P4 de la funcionalidad 28
  conecta las dos puertas pre-ejecución a todas las rutas que pueden empezar trabajo:
  `workflow-status` 3.0.0 siente los recibos y anula las recomendaciones por solo-estado,
  `execute-phase` 4.0.0 falla cerrado ante un `PLAN-REVIEW-PASS` ausente, caducado o de
  escalón equivocado (la única puerta de preflight que `--force` no alcanza),
  `ship-roadmap` 5.0.0 avanza DISEÑO → REVIEW-SPEC → PLAN → REVIEW-PLAN → EJECUCIÓN,
  `review-change` 2.12.0 y `review-implementation` 1.5.0 clasifican los hallazgos por
  escalón dueño, `loop-review-fold` 3.0.0 se niega a plegar trabajo de dueño `plan` o
  `product` y diagnostica convergencia antes de una segunda edición local, y `audit-pr`
  5.0.0 bloquea la fusión cuya linaje aguas arriba o libro de obligaciones ya no está
  vigente. La adopción heredada tiene un único dueño (`pre-execution-review` 1.1.0) y
  ninguna ruta archiva un issue para despejar un hueco de planificación.

- **2026-08-30 — planificado no es ejecutable.** La fase P3 de la funcionalidad 28
  añade `review-plan` 1.0.0 y la interna `pre-execution-review` 1.0.0. El esqueleto
  y el planeado de fixes congelan ahora los libros de evidencia de planificación y de
  obligaciones junto al plan, ejecutan la preverificación `stage: plan` y entregan a
  una revisión de ingeniería independiente; `plan-feature` 5.0.0,
  `plan-feature-scaffold` 2.0.0 y `plan-fix` 3.0.0 se detienen en esa revisión en lugar
  de señalar `execute-phase`, y la dueña común da un solo hogar a independencia, unión,
  no-progreso y `CONVERGENCE-ANOMALY`.

- **2026-08-30 — diseñado no es revisado.** La fase P2 de la funcionalidad 28 añade
  `review-spec` 1.0.0 y la interna `evidence-grounding` 1.0.0: una mitad de producto
  congela ahora una fila de evidencia por afirmación material, pasa una preverificación
  determinista y se revisa en contexto limpio antes de planificar. `design-feature`
  3.0.0 y `plan-feature-from-issue` 2.0.0 se detienen en esa revisión en lugar de seguir
  a la planificación de ingeniería, y `plan-feature` 4.0.0 falla cerrado sin un recibo
  `spec-review-pass` vigente enlazado al snapshot exacto.

- **2026-08-27 — las auditorías deben probar su evidencia.** `product-audit`
  3.1.0 añade la puerta fija de procedencia de evidencia (autoridad del forge para el estado
  vivo, métricos acotados por alcance, inventarios recalculados, frescura de cada captura y un
  único orden de conflicto declarado) y la sección obligatoria `Delta vs audit <prior-id>`, para
  que dos auditorías de un mismo alcance no publiquen dos veces los mismos hechos falsos del
  producto.

- **2026-08-22 — restaurar el contrato de turno canónico.**
  `orchestration-envelope` 2.0.2 vuelve a ser descubrible mediante la ruta
  predeterminada de `skills add`, para que los entrypoints instalados del
  workflow puedan cargar su `TURN_CONTRACT.md` obligatorio mientras el contrato
  permanece fuera del menú invocable por el usuario.

- **2026-08-21 — contratos máquina híbridos.** El paquete de esquema 3.0.0
  separa el Envelope v2 estable de `workflow-status`, el SkillOutcome v1
  compacto y el WorkflowSnapshot v1 determinista. Los drivers reciben parseo
  estricto, diagnósticos de compatibilidad estrechos y un protocolo de una
  reparación acotada sin ampliar los prompts de skills de cara al usuario.

- **2026-08-14 — simplificar el loop review/fold.** `loop-review-fold` 2.0.0
  ahora elige `review-change` o `fold-findings` según la evidencia persistida y
  lleva los hallazgos no resueltos a `triage-issue --prioritize-now`; el trabajo
  grande se replantea en nuevas fases para que el usuario las ejecute manualmente.

- **2026-08-09 — distribuir contratos de ejecución.** La ruta normal de
  `skills add` ahora instala `phase-contract`, `planning-preflight` y
  `verification-contract` junto a los entrypoints que los consumen, manteniendo
  los tres fuera del menú invocable por el usuario.

- **2026-08-09 — loops acotados de entrega (feature 22).** Aceptación
  congelada, ejecución de unidad completa solo-con-objetivo con workers limpios
  por fase, agrupación compatible de fixes multi-issue, folds de hallazgos por
  lotes y gate final acotado `loop-review-fold`. Los hallazgos de
  ejecución/review ya no crean issues automáticamente; el trabajo independiente
  se informa como propuestas.

- **2026-08-05 — consolidación del contrato de ejecución (feature 21, P3).**
  `execute-phase` 2.13.2 divide su monolito `WORKFLOWS.md` en cuatro recursos de
  workflow por modo (feature, small/phased, fix, legacy) cargados exactamente uno
  a la vez, divide `ISSUE_POLICY.md` en tres recursos de política cargados de
  forma independiente (`FORGE_BODY.md`, `DESCOPE.md`, `OPPORTUNISTIC_FINDING.md`)
  y añade un recibo de dependencia versionado con una ruta rápida de huella local
  fail-closed. Las once casillas universales de seguridad de ejecución siguen
  residentes en el contrato de turno compacto, cada una mapeada read-verified a
  su recurso dueño único; conserva el comportamiento.

- **2026-08-04 — consolidación del contrato de planificación (feature 21, P2).**
  Los cuatro entrypoints de planificación (`plan-feature` 3.4.0, `plan-fix`
  2.5.0, `plan-feature-from-issue` 1.7.0, `plan-feature-scaffold` 1.13.0)
  consumen ahora dos contratos internos nuevos — `planning-preflight` 1.0.0
  (lectura del estado normalizado del repositorio + la única clasificación
  arquitectónica final) y `phase-contract` 1.0.0 (phase-lint canónico de ocho
  cajas + fingerprint de fase). Las plantillas feature/fix conservan un único
  puntero al phase-contract en lugar de cajas de lint duplicadas; las rutas de
  planificación llevan máximos de contexto reducidos commiteados.

- **2026-08-02 — contexto progresivo de skills más estricto.** Nueve
  entrypoints grandes enrutan ahora contratos detallados mediante referencias
  explícitas de un salto, se condensa prosa repetida y el límite universal baja
  de 4.200/360 a 2.800 tokens estimados/240 líneas sin excepciones de tamaño.
  Su activación directa combinada baja de 30.868 a 16.046 tokens estimados;
  todos los cambios, compatibles, reciben bumps de parche.

- **2026-07-31 — guardrails de runtime y fullauto ligado a la invocación.**
  `init-workspace` 2.7.0 instala el pack de guards de forma aditiva;
  `audit-pr` 4.0.0 queda limitado a veredicto/comentario; `ship-roadmap` 3.0.0
  es la única autoridad de merge automatizado y usa un wrapper transitorio
  fail-closed con comentario de auditoría ligado al SHA. Ver feature 20 y la
  nota de migración.
  `product-audit` 3.0.0 también pasa a requerir invocación explícita en los
  loaders compatibles para que su barrido amplio nunca se active por tanteo.
  Los minors de carga progresiva reducen ocho entrypoints sobredimensionados
  bajo presupuestos de contexto commiteados; `execute-phase` 2.13.0 baja de
  unos 13k a 3k tokens estimados de activación conservando sus contratos en
  recursos de un salto.

- **2026-07-31 — plegado del estado normalizado del repositorio.**
  `discover-repository-state` 1.1.0 conserva el estado `contradicted` del
  snapshot cuando discovery registra un conflicto en vez de congelar
  contradicciones sin resolver. `resolve-repository-state` 1.1.0 se detiene
  sin congelar cuando una contradicción necesita input humano.
  `init-workspace` 2.5.0 siembra el ledger de estado del repositorio como paso
  explícito de proceso en bootstrap y upgrade. `execute-phase` 2.11.0,
  `review-change` 2.7.0, `audit-pr` 3.5.0 y `orchestration-envelope` 1.4.0
  llevan el mismo contrato de consumo NRS de solo lectura y enrutamiento de
  contradicciones por implementación, review, auditoría y orquestación. La
  feature 19 de invariantes arquitectónicas añade el contrato opcional del
  proyecto y su puerta de evidencia/decisión explícita a `init-workspace`
  2.6.0, `design-feature` 2.5.0, `plan-feature` 3.3.0,
  `plan-feature-from-issue` 1.6.0, `plan-feature-scaffold` 1.12.0,
  `execute-phase` 2.12.0, `review-change` 2.8.0 y `audit-pr` 3.6.0.

- **2026-07-30 — política de hallazgos oportunistas.** `execute-phase` 2.10.0
  clasifica los hallazgos reales fuera de alcance descubiertos durante la
  implementación como `Autofix`, `Opportunistic Fix` o `Create Issue` usando
  una única política determinista. Cada decisión queda registrada en
  `decisions.md`; los fixes siguen siendo locales y de bajo riesgo, y la
  guardia de descope existente se ejecuta antes de poder crear un issue.
  Implementa #111.

- **2026-07-19 — auditorías de producto persistidas y direccionables.**
  `product-audit` 2.3.0 escribe cada ejecución en
  `docs/audits/<id>-<YYYY-MM-DD>.md` (id de auditoría incremental, secuencia
  única de hallazgos `F1, F2, …`, todos los flujos de propuestas siempre
  presentes) y `triage-issue` 2.4.0 gana el modo hallazgo-de-auditoría
  (`triage-issue <audit-id> F<k>`): verifica el hallazgo, abre el issue solo
  si procede y marca el hallazgo como triado en el fichero de auditoría.
- **2026-07-19 — cierre de requisitos implícitos.** Un pase coordinado para
  que "añade un blog" implique el permiso en el ACL, el enlace en el
  dashboard y el requisito de auth sin que nadie lo diga: nuevo inventario de
  capacidades `docs/CAPABILITIES.md` en la plantilla (+ fila en el mapa de
  documentación), **cierre de integración** + **matriz de roles** + **barrido
  de expectativas** en la plantilla de SPEC y `design-feature` 2.3.0, siembra
  del inventario en `init-workspace` 2.3.0, mantenimiento aditivo del
  inventario en `execute-phase` 2.8.0, y comprobación de frescura en
  `product-audit` 2.2.0. El
  `template/docs/features/_TEMPLATE/SPEC.md` exportable se resincroniza con
  la plantilla canónica de dos mitades. Nota de migración:
  `docs/workflow/MIGRATION.md` (2026-07-19).
- **2026-07-19 — pase de endurecimiento para modelos pequeños.** Un pase
  coordinado para que las skills corran con fiabilidad en modelos ejecutores
  pequeños/baratos (contexto modesto, sin caché de prompt): **presupuestos de
  contexto** explícitos (`execute-phase` 2.7.0, `review-implementation` 1.3.0,
  presupuesto por pasada en `review-change` 2.6.0); un **esquema fijo de
  handoff de fase** en `progress.md` con conversación nueva por fase
  (`execute-phase` 2.7.0, `plan-feature-scaffold` 1.11.0); una entrevista
  estructural con **rúbrica de vaguedad** — una pregunta por turno, ≥ 3 huecos
  vacíos escala — más la sección `### Deferred decisions` del SPEC
  (`design-feature` 2.2.0, `plan-feature-from-issue` 1.5.0); una puerta
  mecánica de presencia **Spec-lint** en ambas plantillas de SPEC
  (`design-feature` 2.2.0, `plan-feature-scaffold` 1.11.0, `plan-fix` 2.4.0);
  revisiones **aisladas por eje que devuelven solo tablas** por defecto y una
  comprobación estructural de deriva del SPEC por criterio (`review-change`
  2.6.0); una cota numérica fija para el arreglo-barato
  (`review-implementation` 1.3.0); categorías semilla de modos de fallo para
  los dev-scenarios en la plantilla de SPEC de feature; y guía en el README
  para ejecutar todo el flujo con una flota homogénea de modelos pequeños.

- **2026-07-19 — comprobaciones de anulación hacia fix-now + reconstrucción de blockers en fold-findings.**
  `review-implementation` 1.2.0 cierra los escapes de clasificación: un arreglo
  barato o un defecto dentro de alcance es siempre fix-now (comprobaciones
  obligatorias antes de cualquier clase no-fix-now), y un fix-now dentro de
  alcance demasiado grande se enruta a la nueva `replan-in-unit` (fase(s)
  confirmadas por el usuario añadidas al SPEC de la unidad, misma rama,
  re-añadiendo una fase final de hardening cuando la original ya se ejecutó)
  en vez de degradarse. `review-change` 2.5.0 refleja ambas en su Routing y en el
  bloque `→ Next:` de `FAIL`. `fold-findings` 1.1.0 reconstruye las filas de
  ledger ausentes desde un veredicto BLOCKED de `audit-pr` (nunca "no hay
  hallazgos" mientras se listan blockers) y añade el veredicto por hallazgo
  `REPLAN` + el campo opcional `· Replan: r` en el total.
  `review-implementation` 1.2.1 (parche) aclaró después el alcance de las
  comprobaciones de anulación: solo condicionan `postpone`/`intentional-tradeoff`
  para un defecto real confirmado, nunca `ignore`; 1.2.2 (parche) corrigió un
  encabezado ATX partido en la misma sección que se renderizaba como dos H3.
- **2026-07-19 — señales de driver en workflow-status + ampliación de la puerta de descope en audit-pr (fix 79+89).**
  Expone el lado sensor de la ronda de diseño del 2026-07-17 (#66/#76/#77/#78)
  en el envelope de `workflow-status`: señales por-unidad `review`/`closure`/
  `issues_born` bajo `detail`, opaco al esquema (sin cambio de paquete,
  precedente `detail.urgent`), más un nuevo `next.suggested[]` tipado,
  reflejado en `packages/agentic-workflow-schema` 2.1.0 (menor aditivo). Pliega
  el #89: la puerta de descope de `audit-pr` ahora también empareja un issue
  enlazado desde una fila `## Amendments`, cerrando el hueco de cobertura donde
  un issue descoped con título genérico se colaba pasando la detección basada
  solo en texto. Bumps MENORES: `workflow-status` (1.7.0),
  `orchestration-envelope` (1.3.0), `audit-pr` (3.4.0).
- **2026-07-18 — exclusión de bump-skill del descubrimiento (fix 74).**
  `bump-skill` es mantenimiento del propio repo `agentic-workflow`, pero
  `npx skills add . --list` seguía descubriéndola y ofreciéndola a cada
  consumidor — el fix #40 (`user-invocable: false` + retirada de
  `plugin.json`) solo rige el menú posinstalación, no el descubrimiento. Se
  estableció, a partir del código fuente de la propia CLI `skills`
  (`dist/cli.mjs`, verificado en 1.5.16 y 1.5.19), que `metadata.internal: true`
  es el mecanismo real de exclusión del descubrimiento — lo que deja sin
  efecto las opciones de reubicar o convertir en hook que el issue había
  dejado abiertas. Bump MENOR para `bump-skill` (2.3.0): se añade
  `metadata.internal: true` a su propio frontmatter, más una 7ª regla de lint
  en §2b que exige lo mismo para cualquier futura skill interna del repo.
  Seguimiento del mismo día vía `review-change`: bump PATCH (2.3.1) que
  corrigió la referencia de conteo obsoleta ("dos" → "siete" invariantes de
  autoría) y ancló el grep de la regla al bloque de frontmatter únicamente,
  de modo que ya no puede satisfacerse con la propia prosa descriptiva de la
  regla.

- **2026-07-18 — paridad de registro de skills (fix 71+72+73).** Se registra
  `fold-findings` en `.claude-plugin/plugin.json` (se instalaba bajo `General`
  en vez de `Agentic Workflow`); se restaura el orden alfabético completo de
  `docs/workflow/model-routing.yml`; se nombra `fold-findings` en la escalera
  de equivalencia no-Claude de ambos README (ruta principal, con el ciclo de
  incorporación de `execute-phase` como fallback) y se concilia el
  planteamiento de GLM-5.2 en el "plan de €200" con la sección de dos
  perfiles; se declara la convención de orden máquina-vs-narrativa en
  `CLAUDE.md`. Bump MENOR para `bump-skill` (2.2.0): dos nuevas reglas de
  lint en §2b (paridad con `plugin.json`, orden alfabético de superficies
  máquina) para que esta clase de deriva no pueda repetirse en silencio.

- **2026-07-18 — disparadores de cadencia del checkpoint de revisión (fix 77).**
  Bump MENOR para `execute-phase` (2.6.0): el checkpoint fijo cada 2 fases se
  sustituye por tres disparadores mecánicos — límite de capa, acumulación
  (umbrales de `git diff --stat`), y sensibilidad — más una especificación del
  marcador `Last reviewed: <sha>` en `progress.md`. Bump PARCHE para
  `review-change` (2.4.1): sus dos referencias cruzadas de cadencia se
  reformulan al modelo de disparadores; la cadencia adversarial
  una-vez-por-unidad no cambia. Paridad de docs de cadencia en
  `SKILLS`/`FEATURE_WORKFLOW`/`PORTABLE_PROMPT`/`MIGRATION`/README (EN+ES).

- **2026-07-18 — triggers de cadencia en ship-roadmap (fix 93).** Bump MENOR
  para `ship-roadmap` (2.3.0): la cadencia del checkpoint para features
  `L`/marcadas como sensibles en la etapa REVIEW ahora se dispara con los
  tres triggers nombrados de `execute-phase` (límite de capa / acumulación /
  sensibilidad, referenciados desde `#77` en vez de repetidos) en lugar del
  conteo fijo "cada 2 fases", que se había recalibrado mal ~3x tras el lint
  de atomicidad de #64 que redujo el tamaño de fase. El piso obligatorio
  `--adversarial 2` y la falta de alineación con la cadencia advisory propia
  de `review-change` no cambian.

- **2026-07-18 — usabilidad del modo adversarial en flotas débiles (fix 76).**
  Bump MENOR para `review-change` (2.4.0): el modo `--adversarial N` gana una
  checklist de recomendación de 4 casillas (condición de modelo, nunca
  auto-detectada), una escalera fija de N, roles de revisor asignados por
  índice con la guarda de rol-como-prioridad-no-alcance, contratos de
  revisor/merge de fuente única, un nuevo modo de fusión `--merge` con lista
  de prohibiciones, plantillas para pegar en Portability, y un ancla de
  cadencia una-vez-por-unidad. Bump PARCHE para `execute-phase` (2.5.2): el
  hand-off obligatorio de revisión de fin de unidad anota cuándo pasar
  `--adversarial N`. Más una fila de escalera adversarial de NaN en ambos
  READMEs.

- **2026-07-18 — conciencia de unidad abierta en triage (fix 86+87).**
  Bump MENOR para `triage-issue` (2.3.0): nuevo chequeo de pertenencia de
  alcance antes de clasificar y un quinto veredicto `fix-in-unit <unit>` que
  resuelve un issue que ya pertenece a una unidad abierta en la propia rama
  de esa unidad — fold en su ledger `review-findings.md` o en su fase
  actual/siguiente, un replan incremental, o una restauración de scope-bleed —
  en vez de fragmentar el alcance en una unidad nueva independiente.
  Complemento del lado consumidor del fix 66.

- **2026-07-18 — pliegue de revisión del scope-bleed-guardrail (fix 66).**
  Bump PARCHE para `execute-phase` (2.5.1): se aclaró el paso de retro-
  relleno de la enmienda en la guardia de descope — una vez que el issue de
  seguimiento existe y está enlazado, la fila `## Amendments` sustituye
  explícitamente el marcador `#<n>` por el número real del issue y ese
  cambio se commitea, de modo que nunca falla la comprobación simétrica de
  fila sin enlazar de `audit-pr`. Encontrado y corregido durante
  `review-change` en el PR #88.

- **2026-07-17 — scope-bleed-guardrail (fix 66).** Bump MENOR para
  `execute-phase` (2.5.0): nueva guardia de descope — antes de crear cualquier
  issue, se clasifica como trabajo descubierto (se archiva libremente) o
  descope (solapa un criterio de aceptación/tarea de la SPEC incumplido); un
  descope PARA antes de crear el issue, exigiendo primero una entrada
  `## Amendments` fechada y aprobada por el usuario (formato de fila canónico
  definido una sola vez aquí). Bump MENOR para `audit-pr` (3.3.0): nueva
  puerta de integridad de alcance (descope) en el contrato de merge-readiness
  — los issues nacidos desde que la rama divergió que hacen referencia a la
  unidad deben tener su criterio aún cumplido o una entrada `## Amendments`
  correspondiente, si no BLOQUEANTE; PRs de feature y de fix por igual. Bump
  MENOR para `product-audit` (2.1.0): nueva señal de recurrencia de
  exportación de alcance — ≥ 2 unidades consecutivas exportando alcance es un
  hallazgo de calidad de planificación enrutado a las reglas de
  atomicidad/división (#64). El guardarraíl #4 (exposición en el envelope de
  `workflow-status`) se pospone a #79.

- **2026-07-17 — audit-pr-closure-integrity (fix 78).** Bump MENOR para
  `audit-pr` (3.2.0): nueva puerta de integridad de cierre en el contrato de
  merge-readiness — un chequeo puramente mecánico (grep en busca de un
  encabezado `Capability closure`, a cualquier nivel) de que el cierre de
  capacidades de la SPEC de feature fue realmente tomado y registrado;
  bloqueante en una fila en blanco/sin
  mapear, `n/a: <razón>` pasa, un bloque ausente produce un warning datado
  `design-debt` (nunca bloqueante) que es a la vez el disparador de
  retrofit. Los PRs gobernados por fix son siempre n/a. Bump MENOR para
  `design-feature` (2.1.0): la sección de semántica de upsert referencia
  cruzadamente el disparador de retrofit — reejecutar rellena solo las
  filas de cierre faltantes.

- **2026-07-17 — plan-fix-multi-issue-semantics (fix 80).** Bump MENOR para
  `plan-fix` (2.3.0): `/plan-fix <n> [<n2> …]` ahora tiene semántica
  multi-issue plenamente definida — una checklist fija de 4 casillas de
  causa-raíz-compartida decide si varios issues se fusionan en UNA unidad
  (primaria = número de issue más bajo, `Closes #<n>` por issue) o si la
  skill se niega con una salida de división verbatim. La invocación de un
  solo número queda sin cambios, byte a byte.

- **2026-07-17 — legacy-spec-phase-lint-carveout (fix 81).** Bump PARCHE para
  `execute-phase` (2.4.1): el guardia de pre-vuelo de lint de fase añadido por
  la fix 64 no tenía salvedad para SPECs legacy sin sección `## Phases`, así
  que se DETENÍA indebidamente sobre el flujo legacy de paso único
  preexistente. Se añadió una omisión explícita e incondicional — comprobada
  antes de ejecutar el paso de lint — para que un SPEC sin sección
  `## Phases` caiga directamente al flujo legacy, restaurando la promesa de
  retrocompatibilidad de la propia fix 64.

- **2026-07-17 — phase-atomicity-lint (fix 64).** Convierte la prosis de
  atomicidad de fase ("un layer/concern, cero decisiones abiertas") en un
  bloque canónico de lint de 8 casillas, libre de juicio, redactado una sola
  vez en `docs/fix/_TEMPLATE/SPEC.md` `## Phases` (copia autoritativa) y
  citado literalmente en `docs/features/_TEMPLATE/SPEC.md` `### Phases`.
  Bumps MENORES para `plan-feature-scaffold` (1.10.0) y `plan-fix` (2.2.0):
  ambos emisores ahora exigen que toda fase pase el lint de 8 casillas antes
  de emitirse, recortando o dividiendo en caso de FAIL. Bump MENOR para
  `execute-phase` (2.4.0): nuevo guardia de pre-vuelo de lint de fase,
  ejecutado tras las puertas de dependencias/estado propio y antes de
  cualquier edición — un FAIL DETIENE el turno con un bloque fijo que nombra
  las casillas fallidas y recomienda recortar de nuevo; `--force` omite la
  DETENCIÓN, nunca la comprobación, registrado en
  `decisions.md`/`progress.md`.

- **2026-07-17 — fold-findings-skill (fix 65).** Nueva skill `fold-findings`
  (1.0.0): ciclo de reparación independiente e invocable por sí solo para los
  hallazgos fix-now de `review-change`/`audit-pr` — clasificación congelada,
  una lista de prohibiciones fija que cierra las válvulas de escape de
  volcado-a-known-issues/downgrade-de-severidad/aflojar-tests/supresión, y un
  contrato de salida fijo por hallazgo `FOLDED | DISPUTED | BLOCKED`. Bumps
  MENOR para `review-change` (2.3.0: `Decision: FAIL` recomienda
  `/fold-findings`) y `execute-phase` (2.3.0: la sección del ciclo de fold la
  nombra como vía preferida, la checklist inline se mantiene como fallback).
  Registrada en `model-routing.yml` (`opus`/`high`) y en
  `docs/workflow/SKILLS.md` + `SKILLS.es.md`.

- **2026-07-17 — next-block-verdict-branching (fix 63).** Bump PARCHE para
  `review-change` (2.2.1): el bloque `→ Next:` del paso 11 ahora se ramifica
  explícitamente según `Decision` — un bloque `FAIL` encabeza con foldear los
  hallazgos fix-now (gate en verde, commit + push, re-ejecutar
  `/review-change`), degradando `/audit-pr` a un sub-bullet condicionado a la
  tabla limpia; un bloque `PASS` mantiene `/audit-pr — merge gate`. La
  condición de recurrencia de `/product-audit` ahora es una casilla explícita
  sí/no, y el bloque debe emitirse como líneas literales múltiples, nunca
  como prosa unida con `·` — restaura el contrato "checklists sobre
  heurísticas; formatos de salida fijos" que un modelo débil (observado:
  qwen3.6-thinking) violaba silenciosamente al copiar la plantilla estática
  única anterior de forma literal incluso en `FAIL`.

- **2026-07-14 — triage-disposition-labels P1–P2 (fix 54).** Bump MENOR para
  `triage-issue` (2.2.0): es propietaria y aplica las etiquetas de disposición
  terminal `postponed`/`promoted`/`wontfix` según el veredicto
  correspondiente, replicando la mecánica ya existente de las etiquetas de
  urgencia. Bump PARCHE para `workflow-status` (1.6.1): el paso 11 se
  reescribe para que esa etiqueta sea la señal autoritativa de triado, con
  el comentario `VERDICT:` como fallback heredado explícito (residual
  aceptado anotado) — cierra el hueco de detección falseable del issue
  `#54` (confianza solo en el texto del comentario).

- **2026-07-13 — finding-severity-routing P1–P4 (feature 17).** Bump MENOR
  para `review-change` (2.2.0): nuevo paso de persistencia que escribe los
  hallazgos fix-now en un nuevo ledger de fold fix-now por unidad,
  `review-findings.md` (esquema fijo, `folded` empieza en `no`, deduplicado
  por `file:line`+axis, sin escritura en una unidad mergeada). Bump MENOR
  para `audit-pr` (3.1.0): los blockers de un veredicto BLOCKED se persisten
  en el **mismo** ledger (D4 — una sola lista para el ciclo de fold),
  severidad `high`, mismas reglas de dedupe/gate. Bump MENOR para
  `execute-phase` (2.2.0): la checklist del ciclo de fold gana una casilla
  que pasa `folded: no → yes` en la fila de cada hallazgo folded. Bump MENOR
  para `workflow-status` (1.6.0): lee el ledger y emite `findings.fix_now[]`
  con un `suggested_tier` derivado; `next.tier` sin cambios. Bump MAYOR para
  `@gtrabanco/agentic-workflow-schema` (2.0.0): `EnvelopeFixNowFinding`
  reemplazado (`{ref, title, file?}` →
  `{id, file, axis, severity, class, route, suggested_tier}`), tipos +
  `envelope.schema.json` + tests actualizados — la fase restante es P5
  Hardening & PR. Seguimiento PARCHE para `audit-pr` (3.1.1): corregida una
  referencia cruzada obsoleta en Guardrails al paso de proceso 5, residual de
  la renumeración de 3.1.0 (ahora cita correctamente el paso 6).

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
