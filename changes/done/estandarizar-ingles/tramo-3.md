# Tramo 3

## Pasos

### Tramo 3 — Historia: cambios/ pasa a changes/
Como persona usuaria quiero que los planes vivan en `changes/` y los archivados en `changes/done/` para que el kit use un solo nombre de carpeta.
Dependencias: Tramo 2.
Contratos a conservar: El texto de los planes archivados no cambia; `changes/HISTORY.md` se conserva.
Rutas susceptibles de cambio: `core/`, `adapters/`, `scripts/revisar-plan.mjs`, `scripts/kit-run.mjs`, `tools/run/*`, `tools/verify/*`, `AGENTS.md`, `README.md`, `.gitignore`.
Ejemplo concreto del resultado esperado: `git ls-files cambios` vacío; `./verify` pasa.
Alcance: renombre mecánico; supera tres archivos de producto (ver Decisiones del plan).
Archivos: scripts/revisar-plan.mjs, scripts/kit-run.mjs, core/agents/principal.md
CUANDO se mueven los planes ENTONCES los planes en curso están en `changes/<name>/` y los archivados en `changes/done/`, y el código y los contratos usan esas rutas (A1).
Aceptación:
- A1: los planes en curso están en `changes/<name>/` y los archivados en `changes/done/`, y el código y los contratos usan esas rutas; comprobar con `git grep -n 'cambios/' -- . ':!old' ':!cambios/hechos' ':!changes/done'`; esperar solo citas históricas ya aprobadas
TODO:
- [x] `git mv` de `cambios/hechos/*` a `changes/done/` y de los demás planes a `changes/` (A1). Comprobación: `git ls-files cambios`; sin salida.
- [x] En `scripts/revisar-plan.mjs`, `scripts/kit-run.mjs` y `core/agents/principal.md`, actualizar rutas, y luego en `core/`, `adapters/`, `scripts/`, `tools/`, `tests/`, instaladores, `.gitignore`, `AGENTS.md` y `README.md` (A1). Comprobación: el `git grep` de la aceptación.
- [x] Con `verify` ya actualizado, correr `./verify` (A1). Comprobación: exit 0 y VERIFY OK.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A1.
Handoff: este plan también se mueve: desde este paso trabajar en `changes/estandarizar-ingles/` y anotarlo en Notas; actualizar la ruta del plan en la ventana que lo ejecute.
