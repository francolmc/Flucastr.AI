# Tramo 2

## Pasos

### Tramo 2 — Historia: pruebas/ pasa a tests/
Como persona usuaria quiero que las pruebas vivan en `tests/` con nombres en inglés para encontrarlas y ejecutarlas bajo un solo nombre.
Dependencias: Tramo 1.
Contratos a conservar: Los comandos de prueba siguen pasando con las rutas nuevas; los datos de fixtures no cambian de contenido.
Rutas susceptibles de cambio: `verify`, `tools/verify/*`, `scripts/*`, `tests/README.md`, `README.md`, `AGENTS.md`, `.gitignore` (`pruebas/.temporales/`).
Ejemplo concreto del resultado esperado: `git ls-files pruebas` vacío y `./verify` pasa.
Alcance: renombre mecánico; supera tres archivos de producto (ver Decisiones del plan).
Archivos: verify, tools/verify/usage-and-run.sh, tests/README.md
CUANDO se mueven los archivos de `pruebas/` ENTONCES todo vive en `tests/` con el mapa de subcarpetas del plan y las referencias apuntan a las rutas nuevas (A1).
Aceptación:
- A1: todo vive en `tests/` con el mapa de subcarpetas del plan y las referencias apuntan a las rutas nuevas; comprobar con `git grep -n 'pruebas/' -- . ':!old' ':!cambios/hechos'`; esperar solo citas históricas ya aprobadas
TODO:
- [ ] `git mv` de cada subcarpeta y archivo de `pruebas/` a `tests/` con el mapa de nombres del plan; `pruebas/.temporales/` (ignorado) no se mueve ni se borra: ajustar `.gitignore` para ignorar `tests/.tmp` y dejar la carpeta vieja intacta (A1). Comprobación: `git ls-files pruebas`; sin salida.
- [x] Actualizar referencias en `verify`, `tools/`, `scripts/`, `core/`, `adapters/`, `install.sh`, `README.md`, `AGENTS.md` (A1). Comprobación: el `git grep` de la aceptación.
- [x] Con `verify` y `tests/README.md` ya apuntando a las rutas nuevas, correr `./verify` (A1). Comprobación: exit 0 y VERIFY OK.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A1.
Handoff: no borrar `pruebas/.temporales/` (3,9 GB, decisión de la persona usuaria); los resultados históricos `resultados.jsonl` se mueven sin editar.
