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
| `/loop-review-fold` | Revisar una unidad y plegar lo que encontró. |
| `/plan-feature` | Dirigir el trabajo diseñado a planificación y roadmap. |
| `/plan-fix` | Redactar un SPEC de fix por fases desde uno o varios issues. |
| `/product-audit` | Auditar la superficie del producto, no solo el diff. |
| `/resolve-repository-state` | Resolver una contradicción en hechos congelados. |
| `/review-change` | Revisar un cambio con los ejes que apliquen. |
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
    "plan-feature": { "model": "anthropic/claude-sonnet-4-5", "thinking": "medium" },
    "review-change": { "thinking": "max" }
  },
  "onUnavailableRoute": "stop"
}
```

Cada valor se toma del primer sitio que lo declara: **comando en proyecto →
comando global → ruta por defecto resuelta → defecto del paquete**. `review-change`
de arriba usa el modelo del default con thinking `max`; todo lo demás corre con lo
que ya tuviera la sesión, porque la ruta por defecto del paquete es
`{"model": "inherit", "thinking": "inherit"}`.

- `model` debe ser `provider/modelId` — la referencia exacta que muestra
  `/model` — o `"inherit"`.
- `thinking` es uno de `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`,
  o `"inherit"`.
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

## Tu sesión vuelve

El enrutamiento dura un comando. El modelo y el nivel de thinking anteriores se
restauran cuando el turno termina, y si cambias el modelo tú mismo a mitad de
turno — con `/model`, por ejemplo — el paquete respeta tu elección en lugar de
deshacerla.

## Consola de configuración

```
/agentic-workflow-settings
```

Muestra en qué corre cada comando ahora mismo, y qué archivo se niega a parsearse,
y luego deja editar **un archivo a la vez** y guardar en alcance global o de
proyecto. No guarda encima de un archivo que no sabe leer, y no toca el
archivo de proyecto mientras el proyecto no sea de confianza.

## Diagnóstico

| Ves | Significa |
| --- | --- |
| `agentic-workflow config is invalid — nothing was dispatched` | Un archivo de configuración fue rechazado. El mensaje nombra el campo, p. ej. `$.commands.plan-feature.model`. Ejecuta `/agentic-workflow-settings` para ver el archivo o arregla el JSON. |
| `… is not available (not in the model registry)` | La referencia es incorrecta o el proveedor no está configurado. Usa `/model` para ver el `provider/modelId` exacto. |
| `… has no configured credentials` | El modelo existe pero aún no puedes usarlo. Autentica, o pon `onUnavailableRoute` en `inherit`. |
| `Pi is busy — nothing was dispatched` | Hay un turno en ejecución. Espera a que termine. |
| `A routed command is already running in this session` | El turno enrutado anterior no ha terminado. |
| No pasa nada al escribir un comando | La skill no está incluida con ese nombre, o no reiniciaste Pi tras la instalación. |

## Notas

- Probado con Pi 0.84.3 (`pi install`, skills de paquete, `sendUserMessage` con
  expansión de plantillas).
- El paquete declara Pi como peer dependency; no incluye ninguna copia de Pi.
- Las skills pueden indicar al modelo que ejecute comandos. Revísalas como con
  cualquier paquete de terceros.

MIT · [Repositorio](https://github.com/gtrabanco/agentic-workflow) ·
[`docs/features/27-pi-agentic-workflow/`](../../docs/features/27-pi-agentic-workflow/SPEC.md)
