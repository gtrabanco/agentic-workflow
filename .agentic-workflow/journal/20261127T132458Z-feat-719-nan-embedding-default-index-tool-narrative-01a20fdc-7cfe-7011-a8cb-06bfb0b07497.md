## 2026-11-27T13:24:58Z — feat/719-nan-embedding-default-index-tool — narrative

## Summary

Se creó el worktree `feat/719-nan-embedding-default-index-tool` para la issue #719
("pi-nan-agentic-workflow: resolve the NaN embedding provider by default and
expose the index as a pi tool"). El worktree se creó desde main HEAD, con Serena
config copiada. Listo para iniciar el unit-lane.

## Decisions

- **Branch format:** `feat/719-nan-embedding-default-index-tool` — issue #719 es
  un feature "promoted (medium)", no un fix.
- **Worktree path:** `.worktrees/feat-719-nan-embedding-default-index-tool`
  (IR8 compliant — dentro del repo tree, nunca bajo `.git/worktrees/`).
- **No remote branch:** no existía `origin/feat/719-...`, se creó desde main.
- **Serena config:** copiada desde root para que language servers funcionen
  desde el primer momento.

## Next

Iniciar unit-lane en el worktree feat/719 para implementar:

1. **Default-on provider resolution** en `pi-nan-agentic-workflow` cuando
   `NAN_API_KEY` está presente — kills la activation ceremony del doc index.
2. **Exponer doc index como primera herramienta pi** (`doc_search`) — skills y
   models lo usan sin shell commands.
3. **Actualizar template index.json** defaults y docs de embedding activation.

**Surfaces afectadas:**
- `packages/pi-nan-agentic-workflow` (embed profile, resolveEmbedConfig)
- `packages/agentic-workflow` (doc/index.json consumer)
- `packages/pi-agentic-workflow` (pi tool registration)
- `template` (index.json defaults)
- `docs` (workflow docs on embedding activation)
