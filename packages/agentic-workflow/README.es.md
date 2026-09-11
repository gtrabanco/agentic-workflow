# `@gtrabanco/agentic-workflow`

> 🇬🇧 [English version](README.md)

Crate productora de los scripts deterministas de agentic-workflow. La feature 37
lo creó como el vehículo que exigía la hoja de ruta (filas 37/38/42/45, 43
declinada): la primera feature productora crea la crate y las siguientes
aterrizan sus scripts como subcomandos de ella.

- **Privada, cero dependencias, sin paso de build.** El tooling del repositorio
  se ejecuta con bun primero y node como fallback garantizado (`CLAUDE.md`
  §Verification).
- **Convención de scratch:** `.agentic-workflow/tmp/` en la raíz del repositorio
  guarda la salida desechable de los productores. Se versiona como directorio
  (`.gitkeep`) para que la convención exista en un clon nuevo.

Productores actuales: ninguno todavía. `scripts/phase-lint.mjs` se queda
deliberadamente en el árbol `scripts/` del repositorio (feature 37 ED1); las
features 38 y 42 añaden los primeros subcomandos de la crate.
