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

### Sesión

#### `log-session`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.3.0 | 2026-07-03 | menor | Casilla de precedencia de idioma de artefactos añadida al contrato de turno. |
| 1.2.0 | 2026-07-03 | menor | Contrato de turno al inicio (entrada realmente AÑADIDA con datos git exactos; ninguna entrada pasada editada; → Next: impreso al final). |
| 1.1.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| 1.1.0 | 2026-07-02 | minor | Añadida la sección Portability (sin hooks → esta skill es el único escritor del journal); referencias a `/clear` generalizadas al reset de contexto de cualquier agente. |
| 1.0.1 | 2026-06-27 | parche | Cierre normalizado al bloque canónico `→ Next:` |
| 1.0.0 | 2026-06-19 | — | Nueva skill de diario de sesión. Añade una entrada estructurada a `docs/LOGS.md` (resumen, archivos, decisiones + por qué, siguiente paso) bajo demanda; `model: sonnet` (barato por diseño). Incluye hooks gratuitos y opt-in en `template/.claude/`: captura mecánica en SessionEnd + marcador en SessionStart, y restauración de contexto opt-in en SessionStart — todos sin modelo |

### Mantenimiento del repo

#### `bump-skill`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
| 1.3.0 | 2026-07-03 | menor | El lint comprueba también la nueva sección `## Turn contract` en las skills de cara al usuario. |
| 1.2.1 | 2026-07-02 | parche | Nota de equivalencia de modelos en la descripción (edita model:/effort: para modelos no-Claude / de libre inferencia). |
| 1.2.0 | 2026-07-02 | minor | El lint ahora comprueba también que las skills de cara al usuario llevan la sección `## Portability`; añadida su propia nota de Portability. |
| 1.1.0 | 2026-06-27 | menor | Paso de lint que marca las skills editadas sin bloque `→ Next:` o con etiquetas de fase `S1`/"Step" (avisa, nunca corrige solo) |
| 1.0.0 | 2026-06-19 | — | Nueva skill de mantenimiento del repo. Tras editar un SKILL.md, sube la `version:`, añade filas en CHANGELOG.md + CHANGELOG.es.md y actualiza las tablas de skills y modelos en README.md + README.es.md |

### De cara al usuario

#### `ship-roadmap`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
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

#### `plan-feature`
| Versión | Fecha | Tipo | Qué cambió |
|---|---|---|---|
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
| `review-implementation` | 1.0.2 | 2026-07-02 | parche | La referencia a revisiones companion ahora apunta al pack de revisión interno (`review-*`) |
| | 1.0.1 | 2026-06-09 | parche | Descripción acortada 96 → 36 palabras (contexto siempre cargado); cuerpo sin cambios |
| | 1.0.0 | 2026-06-05 | — | El motor de hallazgos + rúbrica de clasificación que compone `review-change` |
| `plan-feature-interview` | 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo devuelto al router (dimensiones resueltas, preguntas abiertas, issue de tracking) |
| 1.1.0 | 2026-06-09 | menor | Estima el tamaño `XS/S/M/L`; pide una referencia de diseño UI en features con UI |
| | 1.0.0 | 2026-06-05 | — | Entrevista una idea en crudo hasta un SPEC |
| `plan-feature-from-issue` | 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo devuelto al router (veredicto, huecos cerrados, Closes #N enlazado) |
| 1.1.0 | 2026-06-09 | menor | Produce un SPEC acotado **dimensionado** con `Closes #N` |
| | 1.0.0 | 2026-06-05 | — | Issue → SPEC acotado |
| `plan-feature-scaffold` | 1.3.0 | 2026-07-03 | menor | La fase final del TASKS.md generado termina con tareas literales de cierre: abrir PR + imprimir URL en el chat, enlazar la fila del roadmap, commitear y pushear el enlace. |
| 1.2.0 | 2026-07-02 | menor | Reporte de cierre fijo (artefactos escritos, registro en roadmap, nº de fases, preguntas abiertas) |
| 1.1.1 | 2026-06-27 | parche | Nombrado de fases fijado a `P1, P2, …` ("fases") en PLAN/TASKS/progress — nunca `S1`/"Steps" |
| | 1.1.0 | 2026-06-09 | menor | Escala los artefactos al tamaño — XS/S → solo SPEC; M/L → set completo que acaba en fase de hardening |
| | 1.0.0 | 2026-06-05 | — | SPEC → set completo de artefactos de planificación + entrada de roadmap |

| `review-code` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: pasada de checklist de corrección + simplificación (tabla de hallazgos fija + PASS|FAIL) |
| `review-security` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: pasada de checklist de seguridad (secretos, inyección, authn/authz, PII, dependencias) |
| `review-verify` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: verificación ejecutando de verdad — gate + comportamiento real, ítems manuales listados |
| `review-debt` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: inventario de deuda técnica, cada hallazgo con condición de re-disparo |
| `review-design` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist UI/UX contra el doc de diseño del proyecto (estados, reutilización, responsive) |
| `review-a11y` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist de accesibilidad (semántica, teclado, foco, contraste, ARIA) |
| `review-brand` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist de marca y copy (voz, glosario, claims honestos) |
| `review-perf` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist de rendimiento (N+1, complejidad, fugas, peso de assets) |
| `review-seo` | 1.0.0 | 2026-07-02 | — | Pack de revisión interno: checklist SEO (metadatos, canonical, indexabilidad, datos estructurados) |
---

## Registro cronológico (más reciente primero)

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
