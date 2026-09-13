---
title: Settings crash when model list exceeds 24 options — need provider-first two-step selection
labels: bug, ui, pi-agentic-workflow
---

## Resumen

Cuando se abre `/agentic-workflow-settings` y hay más de **24 modelos** en el
registro vivo de Pi, el diálogo de selección de modelo falla con el error:

```
Settings could not be opened: A select dialog must not offer more than 24 options
```

Esto ocurre en cualquier operación que requiera elegir un modelo: override de
comando, ruta por defecto, bulk apply, etc.

## Causa raíz

En `src/settings/console.ts`, la función `pickModelEntry()` pasa toda la lista
de modelos directamente a `deps.ui.select()`:

```typescript
// línea 269
answer = await deps.ui.select(prompts.modelPicked(target), [...deps.models, TYPED]);
```

Pi tiene un límite duro de **24 opciones** por diálogo select. Cuando el registro
de modelos (con todos los providers y modelos registrados) supera ese número, la
llamada falla.

El mismo problema existe para la selección de comandos en `pickCommand()` (línea
363) y `pickCommandsMulti()` (línea 382).

## Comportamiento actual

1. El usuario abre `/agentic-workflow-settings`.
2. Selecciona "Set a command override" o cualquier opción que pida un modelo.
3. Pi muestra el error y **no permite continuar** — la consola de settings se
   bloquea.

## Comportamiento esperado

Cuando la lista de modelos supere las 24 opciones, la selección debe dividirse en
**dos pasos**:

1. **Paso 1** — Mostrar los providers únicos (extraídos de `provider/modelId`),
   siempre ≤ 24 porque el registro de providers de Pi es pequeño.
2. **Paso 2** — Tras elegir un provider, mostrar solo los modelos de ese provider.

Si la lista es ≤ 24, el flujo de un solo paso se mantiene igual (sin cambios).

El botón "Type another reference…" se mantiene como última opción en cada
diálogo.

## Archivos afectados

- `packages/pi-agentic-workflow/src/settings/console.ts` — funciones
  `pickModelEntry()`, `pickCommand()`, `pickCommandsMulti()`
- `packages/pi-agentic-workflow/test/settings-console.test.mjs` — tests nuevos

## Pruebas

- Test con > 24 modelos → primer diálogo muestra providers, segundo muestra
  modelos del provider elegido.
- Test con ≤ 24 modelos → flujo de un solo paso preservado.
- Test con > 24 comandos → selector de comandos también acotado.
- Todos los tests existentes deben seguir pasando (sin regresión).