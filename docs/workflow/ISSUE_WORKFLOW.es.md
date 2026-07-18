# Flujo de trabajo de issues (de extremo a extremo)

> 🇬🇧 [English version](ISSUE_WORKFLOW.md)

Qué le pasa a un issue desde el momento en que aterriza hasta una decisión
defendible y registrada. La skill central es `triage-issue`; los radios
enrutan hacia fix, feature, o aplazamiento. Varios issues se pueden triar en
un solo lote (`triage-issue 12 14 17`) — veredictos independientes, una sola
tabla resumen; cualquier fix resultante sigue recibiendo su propia rama y PR.

> Los comandos de forja de abajo usan `gh` (GitHub) — el ejemplo canónico.
> Las **convenciones del flujo de trabajo** del proyecto declaran su forja;
> en GitLab/Gitea ejecuta el equivalente de la CLI declarada.

## Etapa 0 — Leer el issue y el proyecto

`triage-issue` lee la guía del agente + el mapa de documentación, el índice
de fixes (`docs/fix/README.md`) y la plantilla de SPEC de fix, el roadmap, y
luego el propio issue en su totalidad (cuerpo, etiquetas, comentarios):

```sh
gh issue view <N> --json number,title,body,labels,state,comments
```

## Etapa 1 — Analizar el propio contrato del issue

Los issues bien formados en este repositorio llevan sus propios criterios de
decisión:

- **Severidad** (p. ej. low/perf, low/maintainability).
- Una cláusula de **"When to fix"** / **disparador** — a menudo basada en
  señales ("revisit at the pagination milestone", "when a 3rd consumer
  appears").
- **"Acceptance (when triggered)"** — cómo se ve "hecho" *si* se dispara.

Respeta ese contrato en lugar de actuar por reflejo.

## Etapa 2 — Verificar el disparador contra el código ACTUAL

Este es el paso que separa la evidencia de las corazonadas. Comprueba
realmente:

- Contar consumidores reales (`grep`) — ¿ya está realmente aquí el "tercer
  consumidor"?
- Comprobar un umbral — recuento de artículos/filas, latencia p95, tamaño de
  bundle.
- Reproducir un defecto reportado, o confirmar que ya está arreglado.

Cita la evidencia (rutas, recuentos, referencias de línea) en la decisión.

> Ejemplos ilustrativos:
> - Un issue de rendimiento (una query sin límite en un camino caliente) —
>   clasificado como `postpone` al archivarlo; se adelantó y se arregló una
>   vez juzgado como una consulta cacheable y segura.
> - Un helper duplicado entre dos módulos — el disparador es "un 3er
>   consumidor"; se verificó que solo existen 2 → se mantuvo diferido con un
>   comentario de **reconfirmación fechado**, nada implementado.

## Etapa 3 — Clasificar y enrutar

| Veredicto | Cuándo | Ruta |
|---|---|---|
| **fix-now** | Defecto, o el disparador se cumple | `plan-fix` → `execute-phase --fix`; añadir al índice de fixes |
| **fix-in-unit** | El issue ya pertenece a una unidad actualmente abierta (un chequeo de pertenencia de alcance se ejecuta antes de clasificar) | Se resuelve en la propia rama de esa unidad: fold en su ledger/fase (`/execute-phase <NN> P<k>` o `/fold-findings`), un replan incremental (`design-feature`/`plan-feature`/una entrada `## Amendments` en el SPEC), o una restauración de scope-bleed — nunca una unidad nueva independiente, nunca `/plan-fix` |
| **promote-to-feature** | Es realmente una capacidad nueva | `plan-feature <N>` (el router lleva el issue → SPEC acotado y **dimensionado**; las features pequeñas `XS/S` van solo con SPEC con ≥ 2 fases en el SPEC → `execute-phase <NN>`) |
| **postpone** | Válido pero el disparador no se cumple | Dejar abierto; publicar comentario de reconfirmación fechado; **no implementar sobre la marcha** |
| **wontfix** | Obsoleto o explícitamente acotado | Proponer cerrarlo con justificación |

Si la decisión depende de un juicio de producto/riesgo en lugar de
evidencia, presenta el veredicto + opciones y deja que el usuario decida
antes de actuar.

## Etapa 4 — El camino del fix (cuando es fix-now)

**Nota sobre unidad abierta.** Un veredicto `fix-in-unit` se salta por
completo este camino del fix — el issue se resuelve en la rama de la unidad
**ya abierta** (fold en su ledger/fase, o un replan incremental), nunca a
través de una rama `fix/<N>-<topic>` nueva. Todo lo que sigue aplica solo a
un `fix-now` genuino (ninguna unidad abierta reclama el issue).

`plan-fix` (persona de arquitecto senior) redacta
`docs/fix/<N>-<topic>/SPEC.md` a partir del issue, lo acota estrictamente,
expone bloqueadores/riesgos, lo registra en `docs/fix/README.md`, y confirma
(commit) en una rama de fix — luego **se detiene para revisión**. Después
`execute-phase --fix`:

1. Asegura que el issue de GitHub existe (lo crea vía `gh issue create` si
   falta).
2. Verifica/crea la rama `fix/<N>-<topic>` (nunca `main`).
3. Implementa el fix (el SPEC es el único artefacto de planificación — sin
   fases).
4. Ejecuta la puerta (chequeo de tipos, tests, build).
5. **Marca el fix como `done` y abre el PR con `Closes #N` (siempre — nunca
   solo-en-rama).** `done` significa construido, no fusionado.
6. **`/review-change` obligatorio** (los hallazgos que no son fix-now →
   `triage-issue`), luego `/audit-pr` como puerta de merge (nunca fusionar
   con docs pendientes).
7. **Solo después del merge:** elimina la entrada de
   `docs/fix/README.md` — nunca antes (no dejes de rastrear el issue antes
   de tiempo).

## Etapa 5 — Informar y mantener los docs coherentes

Sea cual sea el veredicto:

- Publica la decisión como un **comentario fechado en el issue** con la
  evidencia que comprobaste.
- **Aplicar la etiqueta forma parte del veredicto, no una confirmación
  aparte.** Un veredicto **fix-now + severidad alta** aplica la etiqueta de
  urgencia correspondiente (`urgent` / `fix-next`); un veredicto **postpone**
  / **promote** / **wontfix** aplica la etiqueta de disposición
  correspondiente (`postponed` / `promoted` / `wontfix`). Ambas son propiedad
  exclusiva de `triage-issue`, ambas quedan totalmente determinadas por el
  veredicto basado en evidencia recién alcanzado — nunca por un análisis del
  texto del issue — así que aplicarlas no necesita confirmación aparte.
- Si se convirtió en un fix activo → está en el índice de fixes; si se
  fusionó/cerró → elimina la fila obsoleta del índice.
- Cualquier **otro** cambio de estado en GitHub (cerrar, etiquetas no
  relacionadas) sigue necesitando confirmación cuando sea ambiguo.

Una ejecución periódica de `audit-docs` detecta filas del índice de fixes
cuyo issue ya se cerró, issues diferidos que silenciosamente se volvieron
accionables, y desviaciones similares.

## Ejemplo trabajado

```
/triage-issue  60
   → reads "trigger = 3rd consumer of the shared helper"
   → grep: only 2 modules import it  → trigger UNMET
   → verdict: postpone
   → gh issue comment 60  (dated re-confirmation, no code)
```
