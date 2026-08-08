# Notas de migración

> 🇬🇧 [English version](MIGRATION.md)

## 2026-08-05 — `review-change` publica un recibo ligado al SHA; `audit-pr` lo consume

**Feature 21 (consolidación del contrato de workflow).** `review-change` 2.10.0
ahora termina una revisión final obligatoria limpia publicando un comentario de
PR idempotente ligado al SHA con `<!-- review-change:pass sha=<40-hex> contract=v1 -->` y el
cuerpo fijo del recibo (vía `--body-file`, nunca commiteado a la rama).
`audit-pr` 4.3.0 consume ese recibo como la evidencia de revisión en lugar de
re-revisar el diff: un marcador vigente se reconoce, uno ausente u obsoleto es
un bloqueante enrutado a `/review-change`, y la auditoría nunca compone una
revisión. Las puertas de merge se estrechan al conjunto solo-auditoría del SPEC
(la puerta `Tests` y el re-mapeo de criterios de aceptación por diff se
sustituyen por los campos del recibo).

**Migración.** Actualiza las skills **juntas** — `review-change` y `audit-pr`
deben moverse como par. Un `review-change` antiguo (sin recibo) deja a
`audit-pr` 4.3.0 bloqueado sin marcador en el head: re-ejecuta la revisión
final para que el head actual lleve un recibo antes de auditar. No mezcles
versiones: un recibo publicado por 2.10.0 queda invalidado por cualquier commit
posterior, y un `review-change` previo al recibo no tiene marcador que consumir.
No hay cambio de autoridad de merge — audit-pr sigue sin fusionar nunca.

## 2026-07-31 — el merge automatizado se mueve exclusivamente a `ship-roadmap --fullauto`

**Cambio incompatible.** `audit-pr` 4.0.0 ya no fusiona bajo una política
documentada del proyecto ni por una instrucción standalone. Siempre devuelve un
veredicto ligado al SHA y publica el comentario MERGE-READY existente.
`ship-roadmap` 3.0.0 es ahora la única autoridad de merge automatizado: solo una
invocación activa `--continue --fullauto` con `merge: fullauto` en
`SHIP_DECISIONS.md` puede llamar al wrapper transitorio del repositorio. Los
comandos directos de merge siguen bloqueados y el wrapper registra un automerge
correcto mediante un comentario idempotente en la PR.

**Migración.** Actualiza las skills, ejecuta después `init-workspace` en modo
upgrade y acepta el adaptador de seguridad para el agente que realmente corre en
el repositorio. No conserves permisos de `gh pr merge` a nivel de agente/sesión
ni un archivo `.automerge` genérico. Las llamadas standalone a `audit-pr` ahora
entregan la URL al humano; los drivers fullauto existentes deben conservar el
flag en cada iteración y dejar que la skill invoque
`.agentic-workflow/hooks/fullauto-merge.sh`.

## 2026-07-31 — `product-audit` pasa a requerir invocación explícita

**Cambio incompatible de invocación.** `product-audit` 3.0.0 declara activación
manual-only en Claude Code y deshabilita la autoinvocación de OpenCode. Su
contrato `/product-audit [ruta-o-área]` no cambia. Los drivers y las skills ya lo
entregan al humano porque su barrido de producto a esfuerzo máximo nunca debe
componerse; no necesitan cambiar el enrutamiento. Quien lo pida en lenguaje
natural debe invocar ahora la skill por su nombre.

## Ruta de actualización desde una instalación anterior a 2026-07-09

El backlog de 2026-07-09/07-10 (11 unidades) trajo dos **cambios mayores**
más varios cambios aditivos. Si tu instalación es anterior a ese backlog,
sigue esta ruta ordenada una vez — las notas fechadas de abajo siguen
siendo el registro detallado de cada paso; esta sección es solo el mapa.

1. **`plan-feature` 2.0.0 — la definición de producto se separa en
   `design-feature`.** La entrevista de idea-en-bruto y la checklist de
   cierre de capacidades se movieron fuera de `plan-feature` a una skill
   nueva, `design-feature`. `plan-feature` ahora es solo planificación de
   ingeniería y **se niega a planificar una feature sin diseñar** (sin flag
   de bypass) — en su lugar redirige a `/design-feature <slug>`. Cualquier
   feature cuyo `SPEC.md` sea anterior a esta separación se lee como "sin
   diseñar" la próxima vez que `plan-feature`/`execute-phase` la toque;
   ejecuta `design-feature <slug>` una vez para rellenar la mitad de
   producto. Ver
   [la nota fechada](#2026-07-09--plan-feature-200-la-definición-de-producto-se-separa-en-design-feature)
   de abajo para la tabla completa de memoria muscular de comandos.
2. **El sobre-máquina se traslada a la capa de orquestación.** 14 skills
   orientadas al usuario (todas menos `workflow-status`) dejaron de emitir
   el bloque JSON `## Machine envelope` al final sin que se les pida. El
   uso interactivo no se ve afectado; un driver/orquestador ahora inyecta
   el fragmento canónico de system-prompt de `orchestration-envelope` e
   implementa el bucle de reparación él mismo. Ver
   [la nota fechada](#2026-07-10--el-sobre-máquina-se-traslada-a-la-capa-de-orquestación)
   de abajo para lo que debe cambiar un driver.
3. **Actualiza las skills, luego el sustrato.** `npx skills update` (o un
   `npx skills add …` nuevo) solo refresca *comportamiento* de las skills.
   Ejecuta **`init-workspace`** después — ahora detecta un andamiaje
   existente y entra en **modo actualización**, proponiendo solo los
   bloques de `template/` que le faltan a tu proyecto (máquina de cinco
   estados del roadmap, revisión `--adversarial`, etc.) — nunca reescribe
   un bloque que ya has personalizado.
4. **Opcionalmente ejecuta `product-audit`** para ver qué *capacidades*
   recién disponibles — no solo bloques de docs — aplican ahora a tu
   código.

Todo lo que sigue a partir de aquí es el registro fechado y detallado —
lee una entrada específica cuando el resumen de arriba no dé suficiente
contexto para actuar.

## 2026-07-19 — inventario de capacidades, cierre de integración y barrido de expectativas

**Qué cambió.** `design-feature` 2.3.0 ataca el hueco de los requisitos
implícitos ("añade un blog" debe implicar el permiso en el ACL, el enlace en
el dashboard, el requisito de auth) con tres adiciones:

- **`docs/CAPABILITIES.md` — el inventario de capacidades** (nuevo fichero de
  plantilla + fila en el mapa de documentación): la lista mantenida de los
  roles y subsistemas transversales del proyecto (auth, ACL, navegación,
  notificaciones, búsqueda, auditoría, ajustes, …). Lo siembra
  `init-workspace` (entrevista de bootstrap o modo upgrade), lo extiende
  aditivamente `execute-phase` cuando una fase introduce un
  subsistema/rol/permiso, y `product-audit` comprueba su frescura.
- **Cierre de integración** — el `### Capability closure` de la plantilla de
  SPEC lleva ahora tres checklists fijas: el cierre de entidades existente,
  un nuevo cierre de integración (una fila resuelta por subsistema del
  inventario — ninguno omitido) y una matriz de roles (cada rol del
  inventario explícitamente `allowed`/`denied` por capacidad). Tres nuevas
  casillas de producto del Spec-lint las hacen cumplir.
- **`### Expectation sweep`** — nueva sección del SPEC: ≥ 10 (M/L) / ≥ 5
  (XS/S) expectativas de dominio que un humano asumiría implícitamente, cada
  una forzada a in-scope / out-of-scope / deferred.

**Migración.** Aditivo — nada se rompe. Los SPECs legados sin las nuevas
secciones siguen siendo válidos hasta el siguiente upsert de
`design-feature <slug>`, que las rellena (la misma ruta de retrofit que la
regla original de cierre; la puerta de integridad de cierre de `audit-pr`
sigue tratando los SPECs legados como aviso fechado, nunca como bloqueante).
Para adoptarlo: `npx skills update`, y después `init-workspace` (el modo
upgrade propone `docs/CAPABILITIES.md` sembrado desde el descubrimiento) — o
copia `template/docs/CAPABILITIES.md` y rellénalo a mano.

## 2026-07-10 — `init-workspace` gana un modo de actualización para andamiajes existentes

**Aditivo, no rompe nada.** `init-workspace` gana un segundo modo: en un
repositorio que el Paso 0 reconoce como un andamiaje agentic-workflow
existente (marcador: `CLAUDE.md` + `docs/features/ROADMAP.md` o
`docs/workflow/`), ahora ofrece **actualizar** junto a las opciones
existentes de fusionar/adaptar/abortar. El modo actualización obtiene el
`template/` actual, compara el sustrato `CLAUDE.md`/`docs/` del proyecto
contra él, lee este archivo (`MIGRATION.md`) para conocer el razonamiento
detrás de cada bloque faltante, y propone **solo los bloques que le faltan
al proyecto** mediante una entrevista corta, con valores por defecto
descubiertos — nunca reescribe un bloque que el proyecto ya ha
personalizado, y nunca borra nada. El modo bootstrap (un repositorio vacío
o ajeno) queda idéntico byte a byte.

**Por qué.** Actualizar las skills (`npx skills add …` / `npx skills
update`) solo refrescaba siempre el *comportamiento*. Nada migraba el
*sustrato* de un proyecto — el bloque `Docs site` (feature 01),
`Performance commands` (02), la máquina de estados de cinco fases del
roadmap (07), y cada otro bloque que una feature posterior añadió a
`template/` seguía ausente en los proyectos que adoptaron el flujo de
trabajo antes. `product-audit` podía detectar esa desviación pero nunca
arreglarla (solo propone). El modo actualización cierra ese hueco.

**Acción necesaria para instalaciones existentes.** Tras actualizar las
skills, ejecuta `init-workspace` una vez — ahora detecta tu andamiaje
existente y propone los bloques que te faltan en lugar de re-arrancar
desde cero. Ver la sección "Updating an existing install" en `README.md` /
`README.es.md` para la ruta ordenada completa (actualizar skills → leer
este archivo → actualización de `init-workspace` → `product-audit`
opcional). Nada se aplica sin confirmación; saltarte la ejecución deja tu
sustrato exactamente como está hoy — sin regresión, solo sin los bloques
más nuevos hasta que decidas incorporarlos.

## 2026-07-10 — `review-change` gana `--adversarial N` opt-in

**Aditivo, no rompe nada.** `review-change` añade un flag opt-in
`--adversarial N`: N revisores adversariales independientes, de contexto
limpio, solo-diff, se ejecutan en paralelo (subagentes de Claude Code /
invocaciones headless / fallback de conversaciones nuevas secuenciales), y
sus hallazgos se fusionan y deduplican por `file:line`+eje en la misma
tabla de decisión única que la skill ya producía, con una columna de
confianza `Reviewers n/N` y un umbral de inclusión de ≥1 revisor (sin
quórum). **Sin flag → nada cambia** — el camino de un solo revisor por
defecto es idéntico byte a byte a como era antes de que esta capacidad
existiera. El modo también se **auto-recomienda (nunca se fuerza)** en la
propia salida de `review-change` cuando un cambio es `L` o está marcado
como sensible, y la etapa REVIEW no supervisada de `ship-roadmap` ahora
**activa `--adversarial 2` como piso obligatorio** para features
`L`/sensibles — una política deliberadamente distinta de (y no alineada
con) esa recomendación interactiva, ya que una ejecución no supervisada no
tiene ningún humano para ejercer el juicio de saltarla. Nada que migrar:
ningún flag eliminado, ninguna forma de salida cambiada, ninguna acción
requerida para que el uso existente siga funcionando. Ver
`docs/workflow/REVIEW_AND_CLASSIFY.md` para el cuándo/cómo práctico.

## 2026-07-10 — el sobre-máquina se traslada a la capa de orquestación

**Cambio disruptivo al contrato de salida de 14 skills.** Cada skill
orientada al usuario excepto `workflow-status` — `audit-docs, audit-pr,
bump-skill, design-feature, execute-phase, generate-docs, init-workspace,
log-session, plan-feature, plan-fix, product-audit, review-change,
ship-roadmap, triage-issue` — ya no termina su turno con el bloque JSON
entre comillas `## Machine envelope`. La casilla del contrato de turno que
exigía esa emisión también se eliminó, y cada bloque de cierre `→ Next:`
es ahora la salida genuinamente última del turno.

**Por qué.** El único consumidor del sobre es un driver/orquestador
externo; en chat interactivo el JSON al final era ruido, y los modelos
débiles — que omiten obligaciones de fin de documento, según el propio
razonamiento del flujo de trabajo para anteponer los contratos de turno —
eran penalizados por omitir una obligación que una instrucción estática de
`SKILL.md` nunca podía realmente aplicar ni recuperar. La aplicación ahora
vive en la capa que lee el sobre: un driver puede detectar un sobre
faltante y volver a preguntar, algo que el cuerpo de una skill no puede
hacer por sí mismo.

**Qué cambió:**

- La sección `## Machine envelope` y su línea de contrato de turno se
  eliminan de las 14 skills listadas arriba (subida MAJOR cada una — ver
  `CHANGELOG.md`).
- **`workflow-status` no cambia** — emitir el sobre en línea *es* su
  función (`--json-only` no tiene sentido sin él); conserva la sección.
- **`orchestration-envelope`** (interna, `user-invocable: false`) es ahora
  el único hogar del contrato: gana el **fragmento canónico de
  system-prompt inyectado por el driver** (textual, entre comillas) y
  documenta el **bucle de reparación** (`parseEnvelope()` falla →
  reinvocar la misma sesión con `Emit only the machine envelope for the
  turn above.`; un reintento, luego un `FAILED` a nivel de driver). Subida
  menor.
- `docs/workflow/ORCHESTRATION.md` y `docs/workflow/PORTABLE_PROMPT.md`
  reflejan el fragmento + el protocolo de bucle de reparación para autores
  de drivers.
- **El esquema JSON del sobre y el paquete npm
  `@gtrabanco/agentic-workflow-schema` no cambian** — `parseEnvelope()` y
  los drivers existentes siguen funcionando; solo cambió *quién* inyecta
  el requisito, no el esquema que consumen.

**Acción necesaria para drivers existentes.** Un driver que dependía de
que cada skill emitiera el sobre sin que se le pidiera ahora debe inyectar
el fragmento canónico de system-prompt (de `orchestration-envelope`) en
sus invocaciones, e implementar el bucle de reparación para un turno que
vuelve sin un sobre válido. `workflow-status` no necesita ningún cambio —
sigue emitiendo en línea. Los drivers que ya inyectan su propio system
prompt no pierden nada añadiendo este fragmento; los drivers sin
mecanismo de inyección de prompt deberían añadir uno antes de actualizar
más allá de este punto.

## 2026-07-09 — el estado del roadmap se convierte en la máquina de estados del pipeline

**No rompe nada, retrocompatible.** La columna `Status` del roadmap es
ahora la única máquina de estados de verdad fundamental del pipeline —
`idea → defined → planned → in-progress → done` — y la señal de puerta
principal que lee cada sensor/ejecutor (`workflow-status`, la puerta de
dependencias de `execute-phase`, la puerta de redirección de
`plan-feature`). Antes solo existían `planned / in-progress / done`, lo
que confundía una fila de lista de deseos escueta con una unidad
completamente planificada y lista para ejecutar. El marcador
`## Design status` local al SPEC (introducido por la separación de
`design-feature` de arriba) se **conserva** como el registro local al SPEC
y como el fallback de compatibilidad heredada descrito abajo — no se
elimina.

**Regla de compatibilidad heredada.** Una fila del roadmap anterior a este
cambio — un estado `planned` simple sin historial `idea`/`defined` — cuya
mitad de producto en `SPEC.md` está completa (`## Design status:
designed`, cierre de capacidades relleno) se trata como
**`defined`+`planned`**: es completamente ejecutable, no se dispara
ninguna redirección, y no se requiere reetiquetado. Una fila `planned`
heredada cuyo SPEC no tiene una mitad de producto completa (o no tiene
SPEC en absoluto) se trata como `idea` y se redirige a
`/design-feature <slug>` en su siguiente invocación de
`execute-phase`/`plan-feature`.

**Acción necesaria:** ninguna. Las filas existentes siguen funcionando
bajo la regla de equivalencia de arriba. Los proyectos que quieran el
historial explícito de cinco estados en filas antiguas pueden reetiquetar
a mano, pero nada lo requiere.

> **Sustituido por el fix [#51](https://github.com/gtrabanco/agentic-workflow/issues/51)
> (2026-07-12).** "No se dispara ninguna redirección" arriba describe la
> puerta de `plan-feature` tal como existía en esa fecha, que dejaba pasar una
> fila equivalente a `defined`+`planned` hasta `plan-feature-scaffold` y la
> volvía a generar. El fix #51 cerró ese bucle de replanificación: la puerta
> ahora trata *cualquier* fila equivalente a `planned` — heredada o nativa de
> cinco estados — como ya planificada y **SE DETIENE**, remitiendo a
> `/execute-phase` en su lugar. Una fila `planned` heredada y diseñada sigue
> siendo "completamente ejecutable" (no se redirige a `/design-feature`), pero
> ya no se regenera silenciosamente. Ver la puerta de redirección de
> `skills/plan-feature/SKILL.md` para el comportamiento actual.

## 2026-07-09 — `plan-feature` 2.0.0: la definición de producto se separa en `design-feature`

**Cambio disruptivo al contrato de `plan-feature`.** La definición de
producto (la entrevista de idea-en-bruto, y la nueva checklist de
**cierre de capacidades** que obliga a que cada entidad/capacidad/rol que
introduce una feature llegue a su superficie completa — CRUD +
transiciones de estado + UI + API + test, o un `n/a` explícito en tiempo
de diseño) se movió fuera de `plan-feature` a una nueva skill orientada al
usuario, **`design-feature`**. `plan-feature` ahora es **solo
planificación de ingeniería**.

**Qué cambió:**

- **Skill nueva `design-feature`** (v1.0.0, `user-invocable: true`).
  Incorpora la entrevista de idea-en-bruto, recorre el cierre de
  capacidades, escribe la **mitad de producto** del SPEC, y sella
  `## Design status: designed`. Las frases disparadoras "add feature" /
  "add a feature" / "new feature" ahora aterrizan aquí, no en
  `plan-feature`.
- **`plan-feature` gana una puerta de redirección, sin flag de bypass.**
  Dada una feature cuyo SPEC falta, o cuyo `## Design status` no es
  `designed`, o cuya sección de cierre de capacidades está vacía,
  `plan-feature` **SE DETIENE** e imprime `run /design-feature <slug>` en
  lugar de planificarla. No hay ningún flag para saltarse esto — una
  feature sin diseñar nunca se planifica en ingeniería.
- **El paso interno de entrevista de idea-en-bruto que solía vivir dentro
  del enrutamiento de `plan-feature` se retira** y se elimina del conjunto
  de skills; su lógica ahora vive en `design-feature` (ver arriba). El
  flag `--interview` de `plan-feature` ya no existe — pasa una idea en
  bruto directamente a `design-feature` en su lugar.
- **`docs/features/_TEMPLATE/SPEC.md`** ahora es **un SPEC en dos
  mitades**: una **mitad de producto** (`design-feature` escribe:
  contexto, objetivos de negocio, alcance, cierre de capacidades →
  criterios de aceptación, herramientas, decisiones de producto,
  `## Design status`) y una **mitad de ingeniería**
  (`plan-feature-scaffold` escribe: objetivos técnicos, impacto en
  arquitectura, diseño, decisiones a confirmar, requisitos de testing,
  escenarios de desarrollo, fases, despliegue y rollback, entregables).
  Sin `DESIGN.md` separado — esto fue un rechazo deliberado para evitar
  que dos documentos se desviaran entre sí.
- **`plan-feature-from-issue`** ahora escribe la mitad de producto del
  SPEC y debe satisfacer el cierre de capacidades — un issue escueto se
  entrega a `design-feature`, no es un atajo alrededor de la puerta.

**Memoria muscular de comandos:**

| Antes | Ahora |
|---|---|
| `plan-feature "<idea>"` / `--interview` | `design-feature "<idea>"`, luego `plan-feature <slug>` una vez `## Design status: designed` |
| `plan-feature <slug>` (sin diseñar) | `plan-feature <slug>` ahora **se detiene y redirige** a `design-feature <slug>` — ejecuta eso primero |
| `plan-feature <slug>` (ya diseñada) | sin cambios — enruta directamente al andamiaje de la mitad de ingeniería |
| `plan-feature <N>` / `--from-issue N` | punto de entrada sin cambios; internamente ahora escribe la mitad de producto y satisface el cierre de capacidades antes de construir el andamiaje |

**Acción necesaria:**

- Si tenías memoria muscular de `plan-feature "<idea>" --interview`,
  cambia a `design-feature "<idea>"` — `plan-feature` rechazará el
  patrón de flag antiguo (ya no enruta una entrevista).
- Si un proyecto tiene features cuyo `SPEC.md` es anterior a este cambio
  (esquema de una sola mitad, sin `## Design status`), se leen como "sin
  diseñar" bajo la nueva puerta la próxima vez que se invoque
  `plan-feature` sobre ellas. Ejecuta `design-feature <slug>` una vez para
  rellenar retroactivamente las secciones de la mitad de producto (el
  cierre de capacidades se puede escribir retroactivamente a partir de los
  criterios de aceptación existentes) antes de seguir planificando o
  ejecutando — ver `docs/features/_TEMPLATE/SPEC.md` para el esquema
  exacto de secciones contra el que rellenar.
- La contabilidad de `bump-skill` ya está reflejada en `CHANGELOG.md` /
  `CHANGELOG.es.md` y en las tablas de skills + modelos del README para
  este cambio.

## 2026-07-04 — v3: la rama por defecto se vuelve agnóstica de modelo

**Cambio disruptivo a cómo instalas este flujo de trabajo** (no al
comportamiento de ninguna skill). Antes de v3, `npx skills add
gtrabanco/agentic-workflow` (sin `#ref`) instalaba la distribución con
opinión propia: cada skill fijaba su propio frontmatter `model:`/`effort:`
(Opus/high para skills de juicio, Sonnet/medium para las mecánicas, etc. —
ver la tabla "Recommended model & effort" del README). Una rama separada
`#inheritance`, auto-sincronizada por CI, eliminaba esas dos líneas de
cada skill para poder instalarla agnóstica de modelo en su lugar.

**v3 invierte cuál rama es la por defecto:**

| Ref | Antes de v3 | Desde v3 |
|---|---|---|
| *(ninguna)* — `npx skills add gtrabanco/agentic-workflow` | con opinión propia, niveles de Claude fijados por skill | **agnóstica de modelo** — ninguna skill fija un nivel; cada una hereda el modelo/effort de la sesión anfitriona |
| `#claude` | no existía | **nueva** — la distribución con opinión propia, ajustada por skill, que solía ser la por defecto; una instantánea congelada del `main` previo a v3, mantenida al día por CI desde `docs/workflow/model-routing.yml` |
| `#inheritance` | agnóstica de modelo (eliminada de `main` por CI) | **sin cambios en el contenido**, ahora forzada (force-pushed) como espejo exacto de la rama por defecto (ya agnóstica de modelo); se conserva solo como un alias estable para quien la fijó antes de v3 |

**Por qué:** usar este flujo de trabajo no debería atar un proyecto a la
gama de modelos de un solo proveedor de IA. La disciplina (docs, SPECs,
fases, revisión, la puerta de merge) es el producto; qué modelo la ejecuta
no debería ser un valor por defecto oculto. Mover la responsabilidad de
elegir el modelo correcto al usuario, con `#claude` todavía disponible
para quien quiera los niveles de Claude ajustados a mano por skill, reduce
ese coste de bloqueo sin eliminar la opción.

**Acción necesaria:**

- **¿Estás en Claude Code y dependes de los niveles por-skill de la
  instalación por defecto?** Reinstala con `#claude`:
  `npx skills add gtrabanco/agentic-workflow#claude`. Nada más cambia —
  mismas skills, mismo comportamiento, solo los niveles que tenías antes
  de v3.
- **¿Ya fijaste `#inheritance`?** Nada que hacer. Sigue resolviendo, con
  contenido idéntico al que siempre tuvo (ahora simplemente también es lo
  que `main` sirve por defecto).
- **¿En cualquier otro agente, o feliz eligiendo el modelo tú mismo?**
  Nada que hacer — el comando de instalación simple ya te da esta rama.
- **¿Mantienes un fork o una separación similar para tu propio proyecto?**
  Ver `.github/workflows/sync-derived-branches.yml` para el patrón de CI
  (espejo + inyección de frontmatter desde config), y
  `docs/workflow/model-routing.yml` para la fuente de verdad de niveles
  por skill.

Ninguna instrucción, checklist, o contrato de salida de ninguna skill
cambió en este release (ver las filas de subida de patch por skill
fechadas 2026-07-04 en [`CHANGELOG.md`](../../CHANGELOG.md) — solo cambios
mecánicos de frontmatter/descripción). Este es un cambio de modelo de
distribución, no un cambio de comportamiento.

## 2026-07-04 — `audit-pr` 2.0.0: auto-merge opt-in

> Nota histórica, reemplazada por `audit-pr` 4.0.0 y `ship-roadmap` 3.0.0
> (2026-07-31): ahora `audit-pr` standalone nunca fusiona; fullauto usa solo el
> wrapper transitorio del repositorio.

El contrato de `audit-pr` cambió de un incondicional **"nunca fusiona"** a
**"nunca fusiona por defecto"**. Nada cambia para las configuraciones
existentes — sin el opt-in se comporta exactamente como antes (veredicto
de solo lectura, el humano fusiona). Qué hay de nuevo:

- El encabezado del veredicto ahora siempre imprime la **URL completa del
  PR** (no solo `#N`).
- Si los docs del proyecto declaran una política de auto-merge (p. ej.
  `merge: auto` / `merge: fullauto` en las convenciones del flujo de
  trabajo o `SHIP_DECISIONS.md`), **o** el usuario lo instruye
  explícitamente en la conversación, un veredicto MERGE-READY procede a
  fusionar — pero solo después de una checklist pre-merge a prueba de
  fallos: árbol limpio, nada sin empujar/sin traer, cabeza remota == SHA
  auditado, CI verde y fresco en ese SHA, sin diff sensible/destructivo.
  Cualquier cosa pendiente → no fusiona; enruta a confirmar+empujar,
  espera a CI, y requiere una reauditoría fresca.

**Acción necesaria:** ninguna, a menos que *quieras* auto-merge — entonces
escribe la política en las convenciones del flujo de trabajo de tu
proyecto. Si los docs de tu proyecto citan la frase antigua "never merges,
never edits", actualízala a "never edits; merges only under a documented
auto-merge policy".

---

# Migración — actualizar al conjunto de skills v2

Si instalaste estas skills **antes del rediseño v2** (el conjunto de 9
skills), esta página es la ruta de actualización. Tres skills fueron
**renombradas**, así que una simple reinstalación actualiza las skills
conservadas y añade las nuevas — pero deja atrás las tres carpetas
antiguas. La CLI `skills` nunca elimina skills que desaparecieron de la
fuente, así que tienes que eliminar esas tres tú mismo.

> ¿Instalación nueva? Ignora esta página — solo sigue
> [REPLICATE.es.md](REPLICATE.es.md).

## Resumen rápido

```sh
# 1. Re-add: updates the 6 kept skills in place and installs the 8 new ones.
npx skills add gtrabanco/agentic-workflow
#   Private repo? Use the SSH URL (the shorthand can fail under bunx):
#   npx skills add git@github.com:gtrabanco/agentic-workflow.git

# 2. Remove the three renamed skills (the CLI won't prune them for you):
npx skills remove design-feature draft-fix-spec feature-from-issue -y

# 3. Verify:
npx skills list
```

Eso es todo. Los comandos de arriba también funcionan con `--global` (si
instalaste globalmente) y `--agent <name>` (para apuntar a un agente
específico).

## Qué cambió

Las 9 skills orientadas al usuario se convirtieron en **13** en esa
actualización (9 orientadas al usuario + 4 internas) — **14 hoy**, con la
adición posterior del autopiloto `ship-roadmap` (10 orientadas al usuario
+ 4 internas). Nada se perdió — tres puntos de entrada de planificación
**colapsaron en un router**, una skill fue **renombrada por simetría**, y
se añadieron cuatro skills **nuevas** de calidad/automatización.

| Estado | Skill | Acción al actualizar |
|---|---|---|
| 🔴 **Eliminada** (renombrada) | `design-feature` | **Borrar.** Su trabajo se movió al router `plan-feature` (camino de idea); el motor es el `plan-feature-interview` interno. |
| 🔴 **Eliminada** (renombrada) | `feature-from-issue` | **Borrar.** Su trabajo se movió al router `plan-feature` (camino de issue); el motor es el `plan-feature-from-issue` interno. |
| 🔴 **Eliminada** (renombrada) | `draft-fix-spec` | **Borrar.** Renombrada a `plan-fix`. |
| 🟡 **Conservada** (mismo nombre) | `plan-feature` | Se actualiza en su lugar — **pero su significado cambió**: antes solo construía el andamiaje; ahora es el **router** (detecta idea / issue / slug acotado y despacha). El paso de andamiaje antiguo es ahora el `plan-feature-scaffold` interno. |
| 🟡 **Conservada** (mismo nombre) | `execute-phase` | Se actualiza en su lugar. Ahora entrega el control a `review-change` en checkpoints basados en disparadores (ver `#77`). |
| 🟡 **Conservada** (mismo nombre) | `init-workspace` | Se actualiza en su lugar. Ahora también sugiere las skills de revisión complementarias de la plataforma. |
| 🟡 **Conservada** (mismo nombre) | `review-implementation` | Se actualiza en su lugar. Ahora también es el motor que compone `review-change`. |
| 🟡 **Conservada** (mismo nombre) | `audit-docs` | Se actualiza en su lugar. |
| 🟡 **Conservada** (mismo nombre) | `triage-issue` | Se actualiza en su lugar. Ahora enruta fix-now → `plan-fix`, promote → `plan-feature`. |
| 🟢 **Nueva** | `plan-fix` | Instalada por el re-add. La contraparte de flujo-de-fix de `plan-feature`. |
| 🟢 **Nueva** | `review-change` | Instalada. Orquestador de revisión adaptable a la plataforma. |
| 🟢 **Nueva** | `audit-pr` | Instalada. Puerta de merge a nivel de PR. |
| 🟢 **Nueva** | `product-audit` | Instalada. Chequeo de salud periódico de todo el producto. |
| 🟢 **Nueva** (interna) | `plan-feature-interview`, `plan-feature-from-issue`, `plan-feature-scaffold` | Instaladas pero ocultas del menú — solo el router `plan-feature` las invoca. |

## Memoria muscular de comandos

Tus comandos antiguos se mapean limpiamente al router:

| Antes | Ahora |
|---|---|
| `/design-feature "<idea>"` | `/plan-feature "<idea>"` (el router detecta la idea → entrevista) |
| `/feature-from-issue <N>` | `/plan-feature <N>` (el router detecta el issue → SPEC acotado) |
| `/draft-fix-spec <N>` | `/plan-fix <N>` |
| `/plan-feature <slug>` (andamiaje antiguo) | `/plan-feature <slug>` — **sin cambios**; el router detecta el slug acotado y construye el andamiaje |

Así que en la práctica: donde antes recurrías a `design-feature` o
`feature-from-issue`, simplemente llama a `plan-feature` y deja que
enrute; `draft-fix-spec` se convierte en `plan-fix`.

## Si `skills remove` no está disponible

`npx skills remove` es la forma soportada de eliminar una skill instalada.
Como alternativa, borra las carpetas directamente del directorio de skills
de tu agente — para Claude Code eso es el `.claude/skills/` del proyecto
(o `~/.claude/skills/` si instalaste con `--global`):

```sh
rm -rf .claude/skills/design-feature \
       .claude/skills/draft-fix-spec \
       .claude/skills/feature-from-issue
```

## Verifica el resultado

Después de actualizar deberías ver **14 skills** (10 en el menú `/` + 4
internas), y **ninguno** de los tres nombres eliminados:

```sh
npx skills list
# expect: init-workspace, plan-feature, plan-fix, execute-phase,
#         review-change, audit-pr, audit-docs,
#         product-audit, triage-issue, ship-roadmap
#         (+ the 4 internal steps: 3 plan-feature-* + review-implementation)
# expect: NO design-feature, draft-fix-spec, feature-from-issue
```

Si los docs de un proyecto que configuraste antes todavía referencian los
nombres antiguos, vuelve a ejecutar `init-workspace` (o `audit-docs`) para
poner la copia de `docs/workflow/` de ese proyecto en línea con el
conjunto v2.
