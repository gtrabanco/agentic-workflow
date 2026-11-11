## Motivación

El accumulator de telemetría (`session-telemetry.ts`) mide por turno `input`, `output`, `cacheRead`, `cacheWrite`, `reasoning` y `totalTokens` de cada `MessageUsage`, pero los reduce todos a un solo `tokens: number`. El `TelemetrySample` resultante no almacena:

- **`model`**: no sabemos qué modelo consumió qué cantidad
- **Desglose por campo**: solo tenemos `tokens` agregado, no `input/output/cache/reasoning` separados

Sin el desglose no se puede comparar consumo por modelo, diagnosticar por qué un modelo gasta más, ni generar reportes de debug.

## Problema documentado

El 10-11-2026 se descubrió que `deepseek-v4-flash` consume tokens ~1.57x más rápido que `glm5.3-flash` para el mismo tipo de trabajo (external verify + correction batch). La causa raíz — ~648 output tokens/turno vs ~489 de GLM — no se pudo verificar desde el ledger porque el accumulator reduce todo a un `tokens: number`.

Los datos solo están disponibles en los JSONL crudos de Pi (`~/.pi/agent/sessions/**/*.jsonl`), que no son un mecanismo del repositorio ni reproducibles desde el repo.

## Alcance

### 1. Pasar `model` al `TelemetrySample`

El provider ya conoce el modelo en cada evento de turno. Pasar la cadena al accumulator y al sample es trivial.

```ts
// session-telemetry.ts
export interface TelemetrySample {
  readonly unit: string;
  readonly changed_paths: number;
  readonly tokens: number;
  readonly turns: number;
  readonly model: string;
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly cache_read_tokens: number;
  readonly cache_write_tokens: number;
  readonly reasoning_tokens: number;
  readonly model_ms: number;
  readonly tool_ms: number;
  readonly observed: string;
  readonly source: string;
}
```

### 2. Dejar de reducir `tokensOf()` a un solo número

El accumulator mantiene los campos desglosados al recibir cada `MessageUsage`. `TelemetrySample` los expone directamente y el ledger los escribe como columnas adicionales.

### 3. Ledger `tier-cost@2` con nuevas columnas

La gramática del ledger cambia de versión para admitir las nuevas columnas. `tier-cost@1` sigue existiendo para backward compat.

### 4. CLI: `pi telemetry report`

Comando que lee los samples del ledger y genera un reporte JSON/CSV anonimizado:

```bash
# Generar reporte anonimizado a stdout
pi telemetry report --anonymize

# Generar reporte con detalles (solo local)
pi telemetry report --details

# Generar reporte JSON a archivo
pi telemetry report --json --output telemetry.json

# Filtros
pi telemetry report --model deepseek-v4-flash
pi telemetry report --unit feat/227
pi telemetry report --from 2026-11-01 --to 2026-11-10
```

### 5. Sistema de sinks configurables (plugins de telemetría)

La interfaz `TelemetrySink` ya existe. Se extenderá con la configuración del ledger para soportar múltiples sinks en `agentic-workflow.json`:

```json
{
  "agentic-workflow": {
    "telemetry": {
      "enabled": true,
      "sinks": [
        { "type": "ledger", "path": "docs/workflow/TIER_COST.md" },
        { "type": "json-file", "path": ".pi/.telemetry/sessions.jsonl" }
      ]
    }
  }
}
```

Cada sink implementa `TelemetrySink` (la interfaz ya existe):

```ts
export interface TelemetrySink {
  readonly name: string;
  write(sample: TelemetrySample): void;
}
```

### 6. Sinks shipped por defecto

- **Ledger** (existente): markdown table `tier-cost@2`
- **JSONL file**: escribe un JSONL por sesión en `.pi/.telemetry/sessions.jsonl`
- **CLI report**: genera el reporte (punto 4)

### 7. Esquema y ejemplos para terceros

`docs/telemetry/` con:

- `schema.json` — JSON Schema del `TelemetrySample` completo
- `README.md` — cómo funciona el sistema
- `plugins/example-webhook.ts` — ejemplo de sink HTTP POST
- `plugins/example-cmd.ts` — ejemplo de sink que ejecuta comando con sample como JSON stdin

### 8. Configuración y privacidad

- `telemetry.enabled` = `true` por defecto
- `telemetry.anonymize` = `true` para los reportes
- Sin telemetría remota por defecto
- Sinks de terceros se configuran explícitamente

## No incluido (out of scope)

- Telemetría remota automática
- Opt-out por usuario final
- Dashboard web o infraestructura de backend

## Impacto

- **Breaking**: `TelemetrySample` cambia — nuevos campos requeridos
- **Non-breaking**: `tier-cost@1` coexiste con `@2`
- **Tests**: actualizar `session-telemetry.test.mjs` y `telemetry-sinks.test.mjs`

## Dependencias

- Depende de `@gtrabanco/agentic-workflow-schema` para el esquema del sample (opcional)
- Todo en un solo PR — código interno del package

## Verificación previa — casuísticas detectables

Antes de implementar, se puede auditar qué se puede detectar y qué casuísticas se pueden cerrar con los datos que Pi ya expone (JSONL de sesión) y con los datos que ya se miden a nivel de Pi (providers, config, settings). Lo que no está explícitamente incluido: **no se guarda prompt literal por defecto** (demasiado espacio, no se puede usar para debug general, no da información sobre performance o accuracy).

### Casuísticas detectables con datos actuales (sin añadir nada nuevo a Pi)

| Casuística | Dato necesario | ¿Ya disponible? | ¿Suficiente? | Observaciones |
|---|---|---|---|---|
| Modelo más caro por turno promedio | `model` + `totalTokens` + `turns` | ✅ | ✅ | Ya se puede detectar que deepseek quema más rápido |
| Modelo que gasta más tokens en `output` vs `input` | `model` + `output_tokens` + `input_tokens` | ✅ | ✅ | El output alto vs input puede indicar prompts redundantes o respuestas verbosas del modelo |
| Modelo que gasta más en `cacheRead` que en `input` | `model` + `cacheRead` + `input` | ✅ | ✅ | Caché que crece más rápido que el input puede indicar prompts mal diseñados |
| Modelos que generan más `reasoning` tokens | `model` + `reasoning` | ✅ | ✅ | reasoning alto puede indicar prompts que no están bien enfocados |
| Errores por turno del modelo | `stopReason=error` + `errorMessage` | ✅ | ✅ | Ya se puede detectar patrones de error por modelo |
| Aborted turns por timeout o interrupción | `stopReason=aborted` | ✅ | ✅ | Se puede detectar si un modelo tarda demasiado en responder |
| Herramientas más llamadas con más errores | `toolName` + `toolResult.isError` | ✅ | ✅ | Se puede detectar que una herramienta se usa mal frecuentemente |
| Herramientas con `durationMs` alto | `durationMs` (tool) | ✅ | ✅ | Se puede detectar que una herramienta tiene latencia alta |
| Cambios de modelo frecuentes en una sesión | `model_change` entries | ✅ | ✅ | Si el usuario cambia mucho de modelo puede indicar insatisfacción |
| Sesiones con compaction frecuente | `compaction` entries | ✅ | ✅ | Si se compacta mucho puede indicar que el contexto es insuficiente o los prompts son muy largos |
| Herramientas raramente usadas | tool call counts | ✅ | ✅ | Se puede detectar tool dead code |

### Casuísticas detectables añadiendo datos mínimos a Pi (sin prompts)

| Casuística | Dato adicional | ¿Suficiente? | Observaciones |
|---|---|---|---|
| Prompt length average por modelo | `promptLength` en message | ✅ | Solo longitud en bytes/tokens, no contenido |
| Contenido promedio de tool call arguments | tool call arguments (truncado a X chars) | ⚠️ | Podría contener sensitive data, se necesitaría sanitización |
| Herramientas que generan `toolCall` con `content: ""` | tool call results content length | ✅ | Se puede detectar tool dead code o uso erróneo |
| Tool calls que no se ejecutan (sin `toolResult` seguido) | tool call without follow-up toolResult | ✅ | Se puede detectar tool hangs o dead ends |
| Modelos que generan `stopReason=stop` con `content` corta | assistant `content` length | ✅ | Se puede detectar modelos que terminan antes de hora |
| Modelos que generan `stopReason=toolUse` con toolCall vacío | toolCall array length 0 | ✅ | Se puede detectar modelos que "piensan" y no hacen nada útil |
| Tiempo medio de `model_ms` por modelo | `durationMs` + `model` | ✅ | Se puede detectar modelos lentos por turno |
| Tiempo medio de `tool_ms` por herramienta | `durationMs` (tool) + toolName | ✅ | Se puede detectar herramientas lentas |

### Casuísticas NO detectables (o no sin prompts, por privacidad)

| Casuística | ¿Se puede hacer? | ¿Por qué? |
|---|---|---|
| Accuracy del modelo | ❌ | Se necesita comparar output con ground truth |
| Prompt engineering | ❌ | Los prompts literales no se guardan por defecto |
| Contenido de archivos leídos/escritos | ❌ | No se guarda el contenido de `read`/`write`/`edit` |
| Contenido de tool call arguments | ⚠️ | Podría contener sensitive data, se necesitaría sanitización explícita |
| Sesiones que terminan por decisión del usuario | ❌ | No se registra por qué el usuario paró la sesión |
| Tiempo de espera del usuario entre turnos | ❌ | No se registra el tiempo entre `session` entries |

### Recomendación: qué añadir a Pi como dato mínimo

Los datos que Pi ya expone (JSONL, `model_change`, `thinking_level_change`, `stopReason`, `errorMessage`, `durationMs`, tool call names) son suficientes para cubrir el 80% de las casuísticas de debug que se podrían detectar. 

Para cerrar el resto sin entrar en prompts literales, se podría añadir:

1. **`promptTokens`** (nuevo campo en `usage` de assistant messages) — Pi ya tiene `input`, `output`, `cacheRead`, `cacheWrite`, `reasoning`, `totalTokens`. Si `input` es prompt + tool results, un campo `promptTokens` claro ayudaría a medir la proporción real de prompt vs tool results.

2. **`stopReason` en toolResult entries** — Pi ya tiene `stopReason` en assistant messages, pero no en toolResult entries. Esto ayudaría a detectar sesiones que terminan sin toolResult.

3. **`toolResult.isError` ya está, pero falta `toolResult.durationMs`** — Si se añada `durationMs` en toolResult entries, se podría correlacionar tool call con tool result más precisamente.

4. **`content` length en assistant messages** — Pi ya tiene `content` como array, pero no un campo `contentLength` (número). Sería útil para detectar modelos que generan contenido corto (poco útil) o muy largo (demasiado detallado).

### Resumen

Con lo que Pi ya expone se puede detectar el 80% de las casuísticas de debug. Para los otros 20%, se pueden añadir 4-5 campos nuevos a Pi sin entrar en prompts literales. El sistema de sinks permite que cualquier proyecto analice sus datos como quiera sin exponer prompts.