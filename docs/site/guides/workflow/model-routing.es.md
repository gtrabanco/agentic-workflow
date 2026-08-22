<!--
generated-by: agentic-workflow/generate-docs
source-unit: docs/workflow/model-routing.yml
updated: 2026-08-22
-->

> 🇬🇧 [English version](model-routing.md)

# Enrutar modelos y esfuerzo por skill del workflow

## Qué es esto

Esta guía asigna a cada skill de Agentic Workflow un modelo principal, un
esfuerzo y fallbacks para cinco combinaciones habituales de suscripciones. Es
una instantánea operativa del **2026-08-22**, no un ranking permanente. Los
aliases, ofertas gratuitas, cuotas, revisiones servidas y comportamiento de los
modelos cambian: consulta el dashboard y `/models` antes de una ejecución larga.
La especificación congelada, los tests, el estado actual del repositorio y la
evidencia de review siguen siendo la autoridad; la respuesta confiada de un
modelo no es un recibo válido del workflow.

## Cómo hacerlo

1. Instala la rama portable `#inheritance` cuando el host deba elegir el modelo,
   o `#claude` cuando Claude Code deba aplicar los tiers canónicos Opus/Sonnet:

   ```sh
   npx skills add gtrabanco/agentic-workflow#inheritance
   npx skills add gtrabanco/agentic-workflow#claude
   ```

2. Selecciona en la matriz el modelo y esfuerzo para el **siguiente turno de la
   skill**. Ejecuta cada frontera de modelo en un contexto nuevo. Una skill
   cargada por otra hereda modelo y esfuerzo de la llamadora; no puede elevarse
   a mitad de turno. Haz el hand-off, cambia el modelo e invoca la skill siguiente.
3. Sigue el flujo normal y sus artefactos persistidos:

   ```text
   design-feature → plan-feature → execute-phase
     → loop-review-fold → audit-pr → merge humano
   ```

4. Si el modelo principal no está disponible o agota su cuota, reinicia la skill
   completa en un contexto limpio con el fallback. No cambies de modelo a mitad
   de un resultado. Omite el fallback si pertenece a la familia que escribió el
   cambio y necesitas una revisión independiente.
5. Usa `review-change --adversarial 2` para una feature `L`, un cambio sensible,
   trabajo escrito por un modelo más débil o un gate de release sin diversidad
   de familias. Usa tres revisores sólo en seguridad crítica o cuando todos los
   revisores disponibles pertenezcan a una familia.

### Vocabulario de esfuerzo

| Esfuerzo | Significado portable | Uso |
|---|---|---|
| `low` | Razonamiento apagado o mínimo; una pasada directa | Recopilar evidencia y dar formato |
| `medium` | Razonamiento por defecto; bucle de herramientas acotado | Implementación mecánica y comprobaciones deterministas |
| `high` | Razonamiento/thinking activo; pasada explícita de verificación | Planificación, review, triaje e implementación sutil |
| `max` | Máximo razonamiento disponible y revalidación adversarial | Arquitectura, seguridad, auditoría de producto y arbitraje de merge |

Si el proveedor sólo ofrece thinking on/off, traduce `high` y `max` a thinking
activo. Para `max`, añade una pasada de crítica en otro contexto limpio en vez de
pedir al mismo contexto que piense más tiempo.

### Abreviaturas de modelos

| Plan | Abreviaturas |
|---|---|
| NaN | `Q36` = Qwen3.6; `DSF` = DeepSeek V4 Flash; `M25` = MiMo 2.5 |
| OpenCode Go | `G53` = GLM-5.3; `K3` = Kimi K3; `DSP` = DeepSeek V4 Pro; `K27` = Kimi K2.7 Code; `M25P` = MiMo 2.5 Pro; `Luna` = GPT-5.6 Luna |
| Zen gratis | `M25F` = MiMo-V2.5 Free; `Hy3F` = Hy3 Free; `N3UF` = Nemotron 3 Ultra Free; `OxF` = Ox Alpha Free |
| Claude | `O5` = Opus 5; `S5` = Sonnet 5 |
| ChatGPT/Codex | `Sol` = GPT-5.6 Sol; `Terra` = GPT-5.6 Terra; `Luna` = GPT-5.6 Luna |

Una flecha significa “fallback”, no una cadena dentro del mismo turno. El punto y
coma separa modelos con roles diferentes dentro de una skill orquestadora. La
columna Claude presupone Pro o Max; Free sólo tiene Sonnet y no incluye fallback
Opus. La columna ChatGPT presupone Plus o Pro; Free/Go ofrece actualmente acceso
limitado a Terra en Codex, así que usa la entrada Terra y asume que no hay
fallback frontier incluido.

### Límite de automatización

La matriz es una receta de routing, no un cambio automático de modelo dentro del
workflow. `main`/`#inheritance` hereda el modelo actual del host; el
[`model-routing.yml`](../../../workflow/model-routing.yml) canónico sólo aporta
los tiers flotantes de la rama `#claude`. Para usar `Q36 → M25 → DSF` o
`G53 → K27 → K3`, el driver externo (por ejemplo un adaptador Pi/OpenCode/AWL)
debe seleccionar el modelo en cada turno nuevo de la skill. Sin ese driver,
cambia el modelo manualmente entre los hand-offs que imprime cada skill.

### Pipeline por defecto según suscripción

| Planes disponibles | Workflow por defecto | Limitación importante |
|---|---|---|
| Sólo NaN | Q36 descubre/redacta → M25 cuestiona → DSF ejecuta → M25 revisa → Q36 verifica evidencia | Adecuado para trabajo normal acotado; gate humano en planificación y merge sensibles |
| OpenCode Go + Zen gratis | G53 planifica → K27 o DSF ejecuta → M25P revisa → K3/G53 audita; Zen gratis absorbe trabajo mecánico público | Conserva la cuota escasa de K3/G53; no envíes código confidencial a rutas gratuitas que entrenan/registran |
| Sólo Claude | O5 diseña/planifica → S5 ejecuta → O5 revisa/audita | Modelos fuertes, pero planificador, ejecutor y reviewer siguen siendo de una familia; añade review humana en trabajo sensible |
| Sólo ChatGPT | Sol diseña/planifica → Terra ejecuta → Sol revisa/audita; Luna hace lo mecánico | Plus basta para acceder a los modelos; persiste la correlación de una sola familia |
| NaN + OpenCode Go | Q36 descubre → G53/K3 planifica → DSF ejecuta → M25 revisa → G53/K3 audita | Configuración estable recomendada: NaN aporta volumen y Go juicio/arbitraje |

### Dónde se descubre y dónde se cuestiona

“Descubrir” y “cuestionar” son responsabilidades existentes del workflow, no
prompts ocultos que haya que inventar:

| Responsabilidad | Skill del workflow | Qué hace realmente |
|---|---|---|
| Discovery del repositorio | `discover-repository-state` | Recopila hechos observados, separa hechos de documentación/inferencia y congela o contradice el snapshot del estado. No recomienda una implementación. |
| Discovery del estado | `workflow-status` | Sensor de sólo lectura para roadmap, dependencias, PRs, findings y trabajo iniciable. Informa del estado; no juzga calidad. |
| Discovery de producto | `design-feature` | Ejecuta la entrevista de idea, el cierre de capacidades/roles y el barrido de expectativas antes de marcar una feature como `designed`. |
| Cuestionamiento de ingeniería | `plan-feature` + `planning-preflight` | Comprueba alcance, dependencias, invariantes, tamaño y clasificación arquitectónica antes de congelar fases. |
| Cuestionamiento del código | `review-change` | Compone el pack interno `review-*`, contrasta acceptance con el diff, clasifica findings y devuelve `REVIEW-PASS`, `REVIEW-FAIL` o `NEEDS-DECISION`. |
| Cuestionamiento adversarial | `review-change --adversarial 2` o `3` | Ejecuta reviewers aislados en contextos nuevos con roles fijos de corrección, seguridad y cobertura de SPEC, y fusiona sus findings. Es una ruta integrada, no un prompt externo. |
| Cuestionamiento de producto | `product-audit` | Cuestiona código, proceso, documentación, roadmap y tooling de todo el producto. |
| Resolución de contradicciones | `resolve-repository-state` y `triage-issue` | Resuelve hechos contradictorios o comprueba si un issue/finding es real y accionable. |

Por tanto, “Qwen descubre → MiMo cuestiona” significa usar Qwen para
`discover-repository-state`/recopilar evidencia y después ejecutar MiMo en un
turno separado de `design-feature`, de un challenge del plan o de review. El
challenge del plan es una receta del operador; la review de código sí tiene
soporte directo con `review-change --adversarial`. No existe una skill oculta
llamada `discover-and-question`. Tampoco existe hoy una skill de cara al usuario
`review-plan`: un challenge independiente previo a ejecutar es un turno nuevo
del modelo sobre el SPEC/plan, y sus conclusiones deben incorporarse al plan
antes de `execute-phase`.

### Matriz de routing por skill

| Skill | Base | Sólo NaN | OpenCode Go + Zen gratis | Sólo Claude | Sólo ChatGPT | NaN + OpenCode Go |
|---|---|---|---|---|---|---|
| `audit-docs` | medium | Q36/medium → M25/medium | M25P/medium → M25F/medium | S5/medium → O5/high | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `audit-pr` | high | M25/high + Q36/high; gate humano → DSF/max si no fue el autor | G53/max → K3/max → DSP/max | O5/max → S5/max + gate humano | Sol/max → Terra/max + gate humano | G53/max → K3/max → M25/high |
| `bump-skill` | medium | Q36/medium → DSF/medium | M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `design-feature` | high | M25/high + Q36/high → DSF/max; una persona cierra diseños de alto riesgo | K3/max → G53/max → DSP/max | O5/max → S5/max | Sol/max → Terra/max | K3/max → G53/max; Q36 recopila evidencia |
| `discover-repository-state` | medium | Q36/medium → DSF/medium | M25P/medium → Luna/medium → M25F/medium | S5/medium → O5/high | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `execute-phase` | medium | DSF/high → Q36/medium para fases mecánicas | K27/high → DSF/high → Luna/medium; M25F sólo para trabajo mecánico público | S5/medium (high para lógica sutil) → O5/high | Terra/medium (high para lógica sutil) → Luna/medium | DSF/high → Q36/medium; Go sólo si NaN está bloqueado |
| `fold-findings` | high | DSF/high → Q36/high para findings mecánicos | DSP/high → G53/high → DSF/high | O5/high → S5/high | Sol/high → Terra/high | DSF/high → DSP/high; G53 para findings discutidos |
| `generate-docs` | medium | Q36/medium → M25/medium | M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `init-workspace` | high | M25/high + evidencia Q36 → DSF/max | G53/max → K3/max | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 recopila evidencia → crítica M25 |
| `log-session` | medium | Q36/low → M25/low | M25F/low → Hy3F/low → Luna/low | S5/low | Luna/low → Terra/low | Q36/low → M25F/low para logs no confidenciales |
| `loop-review-fold` | high | Q36/high conduce; DSF corrige; M25 revisa | G53/high conduce; DSP/DSF corrigen; K3 o M25P revisan | O5/high conduce; S5 ejecuta | Sol/high conduce; Terra ejecuta | G53/high conduce; DSF corrige; M25 revisa |
| `orchestration-envelope` | medium | Q36/medium → DSF/high | M25P/medium → Luna/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → DSF/high |
| `phase-contract` | llamadora, mínimo medium | Q36/medium → DSF/high | M25P/medium → Luna/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → DSF/high |
| `plan-feature` | high | borrador Q36/high + crítica M25/high → DSF/max; una persona cierra planes de alto riesgo | G53/max → K3/max → DSP/max | O5/high (max para planes críticos) → S5/max | Sol/high (max para planes críticos) → Terra/max | G53/max → K3/max; Q36 prepara evidencia |
| `plan-feature-from-issue` | high | Q36/high + M25/high → DSF/max | G53/high → K3/high → DSP/high | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 acota la evidencia del issue |
| `plan-feature-scaffold` | medium | Q36/high → DSF/high | DSP/high → G53/high → M25P/high | O5/high → S5/high | Sol/high → Terra/high | Q36/high → G53/high para unidades `M/L` |
| `plan-fix` | high | DSF/max + crítica M25 → Q36/high | G53/max → DSP/max → K3/max | O5/high (max para fixes críticos) → S5/max | Sol/high (max para fixes críticos) → Terra/max | G53/max; DSF aporta reproducción → crítica M25 |
| `planning-preflight` | llamadora, high | M25/high + evidencia Q36 → DSF/max | G53/max → K3/max → DSP/max | O5/high → S5/max | Sol/high → Terra/max | G53/max; Q36 aporta evidencia → crítica M25 |
| `product-audit` | max | M25/max + DSF/max + evidencia Q36; gate del responsable de producto | K3/max + G53/max → DSP/max; gate de producto | O5/max → S5/max + gate de producto | Sol/max → Terra/max + gate de producto | K3/max + G53/max; dissent M25; gate de producto |
| `resolve-repository-state` | high | M25/high + evidencia Q36 → DSF/max | G53/max → K3/max → DSP/max | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 aporta evidencia → crítica M25 |
| `review-a11y` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium para UI pública | S5/medium → O5/high | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-brand` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium para copy público | S5/medium → O5/high | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-change` | high | M25/high principal + verificación Q36/high; gate humano en trabajo sensible | G53/max → K3/max → M25P/high | O5/high (max para trabajo sensible) → S5/max + gate humano | Sol/high (max para trabajo sensible) → Terra/max + gate humano | pasada independiente M25/high; síntesis G53/max → K3/max |
| `review-code` | high | M25/high → Q36/high; DSF/max sólo si no fue autor | G53/high → DSP/high → K3/high | O5/high → S5/high | Sol/high → Terra/high | M25/high → G53/high; omite la familia autora |
| `review-debt` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-design` | medium | M25/high → Q36/high | G53/high → K3/high → M25P/high | O5/high → S5/high | Sol/high → Terra/high | M25/high → G53/high |
| `review-implementation` | high | M25/high → Q36/high; DSF sólo si no fue autor | G53/high → DSP/high → K3/high | O5/high → S5/high | Sol/high → Terra/high | M25/high → G53/high; omite la familia autora |
| `review-perf` | medium | M25/high → DSF/high si no fue autor | DSP/high → G53/high → M25P/high | S5/high → O5/high | Terra/high → Sol/high | M25/high → G53/high |
| `review-security` | high | M25/max + Q36/max; gate humano/de seguridad obligatorio | G53/max + K3/max → DSP/max; sin fallback Zen gratis | O5/max → S5/max + gate humano/de seguridad | Sol/max → Terra/max + gate humano/de seguridad | G53/max + K3/max; dissent M25; gate humano/de seguridad |
| `review-seo` | medium | M25/medium → Q36/medium | M25P/medium → M25F/medium para páginas públicas | S5/medium | Terra/medium → Luna/medium | M25/medium → Q36/medium |
| `review-verify` | medium | Q36/medium → M25/medium | Luna/medium → M25P/medium → M25F/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → M25/medium |
| `ship-roadmap` | high | Q36/high conduce; DSF ejecuta; M25 revisa; gates humanos | K3/max o G53/max conduce; K27/DSP ejecutan; reviews de familia distinta | O5/max conduce; S5 ejecuta | Sol/max conduce; Terra ejecuta | G53/max conduce; Q36 descubre; DSF ejecuta; M25 revisa; K3 audita |
| `triage-issue` | high | M25/high + evidencia Q36 → DSF/high | G53/high → DSP/high → K3/high | O5/high → S5/high | Sol/high → Terra/high | G53/high; Q36 recopila evidencia → dissent M25 |
| `verification-contract` | llamadora, mínimo medium | Q36/medium → DSF/high | M25P/medium → Luna/medium | S5/medium | Terra/medium → Luna/medium | Q36/medium → DSF/high |
| `workflow-status` | medium | Q36/low → M25/low | M25F/low → Luna/low → Hy3F/low | S5/low | Luna/low → Terra/low | Q36/low → M25/low |

### Política para modelos gratuitos de OpenCode Zen

Los modelos gratuitos documentados de Zen son temporales y no tienen una cuota
fija de tokens o peticiones publicada. Úsalos como overflow para trabajo
público, reversible y de bajo riesgo:

| Modelo gratuito documentado | Uso adecuado | Precaución sobre datos |
|---|---|---|
| MiMo-V2.5 Free | Docs, estado y review independiente barata | Los datos del periodo de feedback pueden mejorar el modelo |
| Hy3 Free | Trabajo mecánico tras superar un canary | Los datos del periodo de feedback pueden mejorar el modelo |
| Nemotron 3 Ultra Free / 3.5 Lightning Free | Experimentos públicos tras un canary | NVIDIA registra el uso; no enviar datos personales o confidenciales |
| Ox Alpha Free | Experimentos no críticos | Documenta retención cero, pero no identifica el modelo |
| Big Pickle | Sólo experimentos públicos | Modelo stealth; los datos recogidos pueden mejorarlo |
| Muse Spark 1.2 Contributor Free | Tareas públicas desechables | Prompts y respuestas pueden entrenar futuros modelos de Meta |

- Prefiere `M25F` para documentación, estado, recopilación de evidencia y una
  review independiente barata; usa `Hy3F` o `N3UF` sólo tras un canary local.
- `OxF` documenta retención cero, pero su propietario y capacidades no están
  publicados. No lo conviertas en gate de merge.
- Big Pickle y MiMo Free pueden usar los datos recogidos para mejorar; los
  trials de Nemotron registran el uso; Muse Contributor puede usar prompts y
  respuestas para entrenamiento. No envíes código privado, credenciales, datos
  de clientes, vulnerabilidades no publicadas ni información regulada.
- `deepseek-v4-flash-free` y `laguna-s-2.1-free` aparecían en el endpoint
  oficial de modelos de Zen en la fecha de esta guía, pero no tenían cuota ni
  política de datos documentada. Trátalos como previews, no como fallbacks,
  hasta que la documentación textual los cubra.

Ejecuta un canary canónico antes de usar Kimi K2.7 Code: comprueba que lee la
skill completa, emite el recibo requerido, respeta las acciones prohibidas y
sigue el hand-off final. Mantenlo como ejecutor, no como conductor, hasta que
pase repetidamente.

### Política de privacidad de la inferencia en NaN

NaN es distinto de las rutas de feedback/trial gratuitas de OpenCode Zen. La
[política oficial de privacidad de NaN](https://www.nan.builders/privacy) afirma
que el cluster de inferencia no guarda logs de prompts ni respuestas, procesa la
inferencia en la Unión Europea, no usa el código del usuario para entrenar
modelos y sólo conserva métricas de servidor necesarias para mantenimiento. Esa
misma política sí recoge datos administrativos necesarios para operar el
servicio, como email de waitlist, membresía y facturación. En esta guía, “NaN no
recopila datos” significa **no recopila datos de inferencia**, no que no existan
registros administrativos o de pago.

El operador de NaN también declara cumplir el AI Act europeo. Es una declaración
de cumplimiento del proveedor; esta guía no la convierte en una certificación
legal independiente. Esta distinción sólo corrige el tratamiento de NaN: las
precauciones de datos de Zen gratis siguen aplicando a esas rutas separadas.

### Cuándo está prohibido planificar sólo con modelos débiles

NaN y Zen gratis pueden recopilar evidencia, crear prototipos e implementar
fases acotadas en los siguientes casos. No deben ser los **únicos** modelos que
congelen el diseño, aprueben el plan o autoricen el merge/despliegue. Exige al
menos una pasada frontier/de juicio (`O5`, `Sol`, `K3` o `G53`) y al responsable
humano/del dominio cuando corresponda:

- autenticación, autorización, aislamiento multi-tenant, permisos, secretos,
  criptografía, pagos, facturación o controles antifraude;
- migraciones destructivas o difíciles de revertir, borrado, reconciliación o
  cambios en la fuente de verdad de datos de producción;
- compatibilidad de APIs/esquemas/protocolos públicos, contratos criptográficos
  o máquina y cambios consumidos por clientes externos desconocidos;
- estado concurrente/distribuido, leases, idempotencia, promesas exactly-once,
  recuperación, despliegue, redes, privilegios de CI o supply-chain security;
- comportamiento legal, de seguridad, médico, financiero, de privacidad o
  regulado donde un requisito incorrecto pueda dañar o crear responsabilidad;
- una feature transversal `L/XL` con ownership ambiguo, tests débiles, sin
  oráculo fiable, infraestructura desconocida o desacuerdo entre modelos;
- un cambio crítico para release cuyo rollback sea lento, destructivo o no probado.

El riesgo y la ambigüedad importan más que las líneas. Un cambio grande de docs
generadas puede ser de bajo riesgo; un bypass de autorización de una línea puede
ser crítico. Si no hay un modelo fuerte o una persona cualificada, detente en
discovery/prototipo: no marques el diseño como `designed`, no congeles acceptance,
no declares `REVIEW-PASS` y no hagas merge.

### Optimización de costes y calendario de suscripciones

Un único **mes de diseño** premium puede ser una buena estrategia, con límites:

1. Usa ese mes para producir especificaciones de producto completas,
   decisiones de arquitectura, matrices de roles/permisos, contratos públicos,
   registros de riesgos, criterios de aceptación, dependencias del roadmap y
   planes de rollback.
2. Detalla completamente sólo una o dos unidades siguientes. Los planes a nivel
   de archivos envejecen rápido cuando cambian `HEAD`, dependencias, proveedores
   y diseños aceptados. Añade supuestos y disparadores de revalidación a las
   entradas posteriores del roadmap.
3. Durante los meses sin premium, usa NaN o Go para refrescar cada plan contra
   la evidencia actual del repositorio justo antes de ejecutarlo, dividirlo en
   fases pequeñas, implementar y ejecutar gates deterministas antes de gastar
   juicio del modelo.
4. Para un release sensible, compra o reserva otro mes premium para
   `review-change`, `product-audit` y `audit-pr`. Pagar una vez para planificar y
   usar después sólo modelos débiles que implementan y se autoaprueban deja un
   hueco inseguro.

Otras palancas:

- Mantén OpenCode Go durante meses de desarrollo intenso: sus $10 recurrentes
  suelen aportar más en los puntos de planificación/review que gastar contexto
  premium escaso en implementación.
- Usa `max` sólo para ambigüedad, seguridad, auditoría global o findings
  discutidos. Usa workers `medium/high` para `execute-phase`.
- Deja que fallen antes los tests, type-check, builds, linters y sensores de
  estado. No pagues Opus/Sol para descubrir errores del compilador.
- Completa la implementación antes del checkpoint normal `review-change`. Evita
  una review completa cara tras cada fase mecánica salvo que sea desplegable o
  irreversible por separado.
- Conserva contextos limpios para reviewers, pero usa prefijos estables de
  sistema/skill si el host soporta prompt caching. No sacrifiques independencia
  de review para ahorrar caché.
- Mide findings aceptados, falsos positivos, retrabajo, tiempo y cuota en entre
  tres y cinco tareas representativas. Optimiza resultados aceptados por coste,
  no el ranking del benchmark ni tokens nominalmente gratuitos.

### Planes, fuentes oficiales y enlaces referidos

- [Catálogo de modelos](https://nan.builders/docs/models), [referencia
  API](https://nan.builders/docs/api) y [política de
  privacidad](https://www.nan.builders/privacy) oficiales de NaN. NaN no loguea
  prompts ni respuestas de inferencia, no entrena con el código del usuario y
  procesa la inferencia en la UE; las cuentas y pagos son una categoría
  administrativa distinta. Sus páginas discrepan actualmente entre 500M y 2B
  tokens mensuales para DeepSeek V4 Flash; manda el dashboard autenticado o la respuesta de soporte. Alta mediante el
  [enlace referido de NaN](https://cloud.nan.builders/r/7GK06FX8) del mantenedor.
- Documentación de [modelos gratis de Zen](https://opencode.ai/docs/zen) y
  [límites de Go](https://opencode.ai/docs/go/). Las peticiones de Go son
  estimaciones por valor y caché observada, no cuotas garantizadas. Alta mediante
  el [enlace referido de OpenCode Go](https://opencode.ai/go?ref=H9JGRCGJZT) del
  mantenedor.
- Documentación de Anthropic sobre [Claude Pro](https://support.claude.com/en/articles/8325606-what-is-the-pro-plan),
  [Opus 5](https://www.anthropic.com/news/claude-opus-5) y
  [Sonnet 5](https://www.anthropic.com/news/claude-sonnet-5).
- [Acceso por plan a GPT-5.6](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt/)
  y [precios/límites de Codex](https://chatgpt.com/codex/pricing/) de OpenAI.
  ChatGPT Plus ya expone Sol, Terra y Luna en Codex; Pro incrementa sobre todo la
  cuota. Sol Pro no está documentado como modelo seleccionable en Codex.

## Dónde está cada pieza

| Rol | Ruta |
|---|---|
| Tiers canónicos de la rama Claude | [`docs/workflow/model-routing.yml`](../../../workflow/model-routing.yml) |
| Contratos y hand-offs de las skills | [`skills/`](../../../../skills/) |
| Referencia de invocación | [`docs/workflow/SKILLS.es.md`](../../../workflow/SKILLS.es.md) |
| Investigación fechada de modelos/proveedores | [`docs/research/model-routing-2026-08-22.md`](../../../research/model-routing-2026-08-22.md) |
| Esta guía operativa | [`docs/site/guides/workflow/model-routing.es.md`](model-routing.es.md) |

## Relacionado

- [Referencia de skills](../../../workflow/SKILLS.es.md)
- [Routing canónico de Claude](../../../workflow/model-routing.yml)
- [Investigación y notas de fuentes](../../../research/model-routing-2026-08-22.md)
- [Versión inglesa](model-routing.md)
