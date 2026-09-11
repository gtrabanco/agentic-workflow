# @gtrabanco/pi-agentic-workflow

> 🇬🇧 [English version](README.md)

Una sola instalación del método
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow) en
[Pi](https://github.com/badlogic/pi-mono): las skills canónicas, un comando por
cada una y, si quieres, modelo distinto por comando que devuelve tu sesión
después.

- **Skills canónicas, sin cambios.** El paquete trae los mismos archivos
  `SKILL.md` de este repositorio, byte a byte — sin bifurcación para Pi que se
  desincronice.
- **Comandos claros.** Escribes `/plan-feature --next`, no
  `/skill:plan-feature --next`.
- **Enrutamiento que puedes olvidar.** Por defecto no se configura nada: cada
  comando corre en el modelo que ya tenías.

## Instalación

```sh
pi install npm:@gtrabanco/pi-agentic-workflow
```

Reinicia Pi. `/agentic-workflow-settings` y los comandos de workflow quedan
disponibles en cualquier proyecto. Si antes copiaste las skills a mano a
`~/.pi/agent/skills`, borra esa copia: el paquete ya las aporta, y dos copias
significan dos versiones del mismo método.

## Comandos

Cada skill incluida cuyo frontmatter dice `user-invocable: true` obtiene un
comando con el mismo nombre. La lista se lee de las skills al arrancar, así que
añadir una skill añade su comando — no existe una tabla de alias que mantener.
Las skills internas que componen una skill pública (los pasos de revisión, el
preflight de planificación, el contrato del envelope) viajan en el paquete pero
no reciben comando propio — los componen los de arriba:

| Comando | Para qué lo usas |
| --- | --- |
| `/audit-docs` | Comprobar que docs, roadmap, código y el índice de fixes coinciden. |
| `/audit-pr` | La puerta de merge: ¿está este PR listo? |
| `/design-feature` | Convertir una idea suelta en un SPEC diseñado. |
| `/discover-repository-state` | Congelar hechos verificados del repositorio. |
| `/execute-phase` | Implementar las fases restantes de una unidad planificada. |
| `/fold-findings` | Reparar los hallazgos «fix-now» persistidos. |
| `/generate-docs` | Generar guías incrementales basadas en el diff. |
| `/init-workspace` | Adaptar el andamiaje del workflow a un repositorio. |
| `/log-session` | Añadir una entrada de sesión estructurada a `docs/LOGS.md`. |
| `/plan-feature` | Dirigir el trabajo diseñado a planificación y roadmap. |
| `/plan-fix` | Redactar un SPEC de fix por fases desde uno o varios issues. |
| `/product-audit` | Auditar la superficie del producto, no solo el diff. |
| `/resolve-repository-state` | Resolver una contradicción en hechos congelados. |
| `/review-change` | Revisar un cambio con los ejes que apliquen. |
| `/review-plan` | Revisar un plan congelado en un contexto limpio. |
| `/review-spec` | Revisar un SPEC diseñado en un contexto limpio. |
| `/ship-roadmap` | Encontrar o continuar un roadmap, una etapa por ejecución. |
| `/triage-issue` | Verificar un issue o hallazgo contra el código actual. |
| `/workflow-status` | Estado de solo lectura del repositorio y el roadmap. |

Los argumentos se reenvían tal cual: `/execute-phase P3 --fix` llega a la skill
como `P3 --fix`.

## Enrutamiento por modelo

Dos archivos JSON, ambos opcionales:

| Alcance | Ruta | Se lee cuando |
| --- | --- | --- |
| Global | `~/.pi/agent/pi-agentic-workflow.json` | siempre |
| Proyecto | `<repo>/.pi/pi-agentic-workflow.json` | el proyecto es de confianza |

```json
{
  "default": { "model": "anthropic/claude-opus-4-5", "thinking": "high" },
  "commands": {
    "plan-feature": { "model": ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"], "thinking": "medium" },
    "review-change": { "thinking": "max" }
  },
  "onUnavailableRoute": "stop",
  "onSettle": "keep"
}
```

Cada valor se toma del primer sitio que lo declara: **comando en proyecto →
comando global → ruta por defecto resuelta → defecto del paquete**. `review-change`
de arriba usa el modelo del default con thinking `max`; todo lo demás corre con lo
que ya tuviera la sesión, porque la ruta por defecto del paquete es
`{"model": "inherit", "thinking": "inherit"}`.

- `model` puede ser `provider/modelId` — la referencia exacta que muestra
  `/model` — `"inherit"`, o un **array** ordenado de 1–4 referencias (una cadena
  de respaldo). Para una cadena, el dispatch prueba cada referencia en orden y
  aplica la primera que se resuelve y tiene credenciales, sin tocar la sesión
  mientras prueba; cuando todas las entradas son inservibles el comando se
  detiene (o, con `onUnavailableRoute` en `inherit`, avisa y corre con el modelo
  actual), nombrando cada candidato y por qué se saltó. `plan-feature` de arriba
  prueba `anthropic/claude-sonnet-4-5` primero y luego `openai/gpt-5.2`.
- `thinking` es uno de `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`,
  o `"inherit"`.
- `` `onSettle` `` es uno de `"keep"` (el default) o `"restore"` — ver
  [Tu sesión después de un comando](#tu-sesión-después-de-un-comando).
- Claves desconocidas, `null` y referencias mal formadas se **rechazan**, no se
  ignoran: un error tipográfico que no hace nada en silencio es el bug que nunca
  encuentras.

El primer comando de workflow tras la instalación avisa una sola vez que el
enrutamiento es configurable, y no vuelve a insistir. Ese aviso se guarda en
`~/.pi/agent/pi-agentic-workflow-state.json`, no en tu configuración.

## Cuando el modelo configurado no está disponible

Por defecto el comando **se niega a arrancar** y te dice por qué: el modelo no
está en el registro, no tiene credenciales, o no se pudo seleccionar. No se envía
nada, así que nada corre en un modelo que no elegiste. Para usar el modelo actual
aun así:

```json
{ "onUnavailableRoute": "inherit" }
```

## Tu sesión después de un comando

Por defecto (**`onSettle: "keep"`**), el modelo enrutado y el nivel de thinking
**se quedan** en la ventana de chat abierta cuando el comando termina. Si
`plan-feature` corre en `glm-5` y quieres retocar el plan que produjo, tu siguiente
prompt sigue corriendo en `glm-5` — igual con una pregunta posterior. Cuando no
necesitas el modelo pesado, lo cambias tú con `/model` (o Ctrl+P) a algo más
barato; nada restaura sobre tu elección.

Para volver a traer el modelo y el nivel de thinking previos al comando cuando este
termina, pon:

```json
{ "onSettle": "restore" }
```

(El modo `restore` es el histórico contrato AC8: tras un comando enrutado la
sesión vuelve a como estaba — el modelo *y* el nivel de thinking, porque
seleccionar un modelo puede mover el nivel. Si cambias el modelo tú mismo a
mitad de turno, con `/model` por ejemplo, no se restaura nada: tu elección gana,
y el comando lo dice. Si mueves solo el nivel de thinking, lo conservas mientras
el modelo vuelve.)

## Consola de configuración

```
/agentic-workflow-settings
```

`/aw-settings` es un atajo para la misma consola.

Muestra en qué corre cada comando ahora mismo, y qué archivo se niega a parsearse,
y luego deja editar **un archivo a la vez** y guardar en alcance global o de
proyecto. No guarda encima de un archivo que no sabe leer, y no toca el
archivo de proyecto mientras el proyecto no sea de confianza.

Los selectores de modelo y thinking de la consola son buscables y con ventana:
escribir estrecha la lista, el cursor se queda en pantalla, un indicador de
posición muestra dónde estás y el valor en vigor viene preseleccionado y
etiquetado `(current)` / `(default route)`. Una edición de ruta pregunta qué
campo cambiar (model, thinking), así que guardar sin cambios deja el archivo
byte a byte idéntico; el campo de modelo puede construir una cadena de respaldo
ordenada (`a/m1 → b/m2`); y una sola pasada puede aplicar o limpiar una ruta en
varios comandos, avisando por comando cuando una referencia falta del registro
vivo. Fuera de una sesión TUI los selectores caen a un prompt simple, así que la
consola nunca se queda sin salida.

## Diagnóstico

| Ves | Significa |
| --- | --- |
| `refused: invalid configuration` | Un archivo de configuración fue rechazado. El mismo mensaje nombra el campo, p. ej. `$.commands.plan-feature.model`. Ejecuta `/agentic-workflow-settings` para ver el archivo o arregla el JSON. |
| `stopped: the configured model` … `is not in the model registry` | La referencia es incorrecta o el proveedor no está configurado. Usa `/model` para ver el `provider/modelId` exacto. |
| `has no configured credentials` | El modelo existe pero aún no puedes usarlo. Autentica, o pon `onUnavailableRoute` en `inherit`. |
| `could not be selected` | Pi rechazó el cambio. El comando se detiene con el motivo — salvo que `onUnavailableRoute` sea `inherit`, en cuyo caso avisa y se ejecuta con tu modelo actual. |
| `refused: the agent is busy` | Hay un turno en ejecución. Espera a que termine. |
| `is still routed` | El comando enrutado anterior no ha terminado. |
| `leaving the model you chose in place` | (en modo `restore`) Cambiaste el modelo durante un turno enrutado, así que no se restauró nada: tu elección ganó. |
| `these configured routes match no command` | Una clave de `commands` no nombra nada. Corrige la escritura o elimina la entrada. |

## Notas

- Probado con Pi 0.85.1 (2026-09-05) (`pi install`, skills de paquete, registro de
  comandos amigables, set/clear enrutado, round-trip de consola de ajustes,
  `sendUserMessage` con expansión de plantillas).
- El paquete declara Pi como peer dependency; no incluye ninguna copia de Pi.
- Las skills pueden indicar al modelo que ejecute comandos. Revísalas como con
  cualquier paquete de terceros.

MIT · [Repositorio](https://github.com/gtrabanco/agentic-workflow) ·
[`docs/features/27-pi-agentic-workflow/`](../../docs/features/27-pi-agentic-workflow/SPEC.md)
