# Tramo 1

## Pasos

### Tramo 1 — Historia: sin copias en español
Como persona usuaria quiero una sola fuente en inglés para agentes, skills y contratos, sin duplicados en español para mantener una sola fuente que no se desincronice.
Dependencias: No aplica.
Contratos a conservar: el contenido de los agentes no cambia; en `core/` solo cambia el `name:` del frontmatter de cada skill a su nombre en inglés (ver Supuestos del plan); las pruebas de `tools/verify/` que leían las copias pasan a leer `core/` y `tests/acceptance/`.
Rutas susceptibles de cambio: `install.sh`, `tools/install/*`, `tools/verify/*`, `tools/core-compatibility.json`, `README.md`, `AGENTS.md`.
Ejemplo concreto del resultado esperado: `git ls-files agentes skills nucleo pruebas/aceptacion` no devuelve nada y `./verify` pasa.
Alcance: renombre mecánico; supera tres archivos de producto (ver Decisiones del plan).
Archivos: tools/core-compatibility.json, tools/install/manifest.sh, tools/install/skills.sh
CUANDO se eliminan las copias de compatibilidad ENTONCES no existe `agentes/`, `skills/`, `nucleo/`, `pruebas/aceptacion/` ni `tools/core-compatibility.json`, y nada instala ni comprueba esas rutas (A1).
Aceptación:
- A1: no existe `agentes/`, `skills/`, `nucleo/`, `pruebas/aceptacion/` ni `tools/core-compatibility.json`, y nada instala ni comprueba esas rutas; comprobar con `git grep -nE '(^|[^a-z-])(agentes|nucleo)/|core-compatibility|skills/(definir|ejecutar|planificar|preparar|migrar|diagnosticar|disenar)' -- install.sh tools tests README.md AGENTS.md`; esperar sin resultados
TODO:
- [x] Quitar de los instaladores y de `tools/verify/*` toda lectura de las copias y de `tools/core-compatibility.json` (A1). Comprobación: `git grep -n core-compatibility -- install.sh tools tests README.md AGENTS.md`; esperar sin resultados.
- [x] `git rm -r agentes skills nucleo pruebas/aceptacion tools/core-compatibility.json tools/verify/core-compatibility.mjs tools/verify/core-compatibility.test.mjs` y apuntar `README.md`, `AGENTS.md` y `tests/README.md` a `tests/acceptance/` y `core/` (A1). Comprobación: el `git grep` de la aceptación; esperar sin resultados.
- [x] En `README.md` y `AGENTS.md`, ajustar el comando de aceptación a `node --test tests/acceptance/*.test.mjs` donde aparezca (A1). Comprobación: ese comando; exit 0.
Verificación del tramo: `node --test tests/acceptance/*.test.mjs` — nivel 1; exit 0; cubre A1.
Handoff: los instaladores deben instalar desde `core/`; si algo solo existe en una copia, moverlo a `core/` antes de borrar.
