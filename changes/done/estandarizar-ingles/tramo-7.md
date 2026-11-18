# Tramo 7

## Pasos

### Tramo 7 — Historia: migrador y barrido final
Como persona usuaria quiero migrar un proyecto instalado al vocabulario nuevo y comprobar que no quedan nombres en español para actualizar mis proyectos sin editar a mano.
Dependencias: Tramo 6.
Contratos a conservar: No se toca `old/`, `changes/done/` ni las excepciones aprobadas; la migración no hace commit y es simulable.
Rutas susceptibles de cambio: `install.sh`, `tools/install/migration/*`, `core/skills/migrate-project/`, `tests/`, `AGENTS.md`, `README.md`.
Ejemplo concreto del resultado esperado: `bash install.sh --migrate-names <project> --dry-run` lista cambios y sin `--dry-run` los aplica; `./verify` pasa.
Alcance: renombre mecánico; supera tres archivos de producto (ver Decisiones del plan).
Archivos: tools/install/migration/names.sh, install.sh, tests/migration/names.test.mjs
CUANDO se ejecuta el migrador sobre un proyecto de prueba ENTONCES renombra `cambios/`→`changes/`, `hechos/`→`done/`, las claves y secciones de los planes y los agentes instalados, y es idempotente (A1).
Aceptación:
- A1: la prueba del migrador sobre un proyecto temporal termina con exit 0 y una segunda corrida no cambia nada; el barrido final no encuentra nombres en español fuera de `old/`, `changes/done/`, `docs/` y las excepciones aprobadas.
TODO:
- [x] Escribir `tools/install/migration/names.sh` y la opción `--migrate-names` (con `--dry-run`) en `install.sh` (A1). Comprobación: `bash install.sh --migrate-names <fixture> --dry-run`; lista cambios y no escribe.
- [x] Escribir la prueba `tests/migration/names.test.mjs` con un proyecto temporal con claves viejas (A1). Comprobación: `node --test tests/migration/names.test.mjs`; exit 0 y segunda corrida sin cambios.
- [x] Migrar con `tools/install/migration/names.sh` los 6 planes en curso de `changes/` y este plan (A1). Comprobación: `node scripts/revisar-plan.mjs changes/estandarizar-ingles/plan.md`; sin avisos de claves desconocidas.
- [x] Barrido final con `git ls-files` y `git grep` en `README.md` y `AGENTS.md` (actualizarlos); anotar en Notas lo que quede (A1). Comprobación: el barrido; solo coincidencias ya aprobadas.
- [x] Correr `./verify` (A1). Comprobación: `./verify`; exit 0 y VERIFY OK.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A1.
Handoff: no ejecutar el migrador sobre proyectos reales de la persona usuaria; esa migración la hace ella tras el merge.
