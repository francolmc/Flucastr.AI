# Tramo 1

## Steps

### Segment 1 — Story: cada falla del builder tiene una clase
As user I want failures classified so that only real task failures climb the ladder.
Dependencies: Not applicable.
Contracts to keep: motivos de `PAUSED` sin cambios; función pura, sin leer archivos ni red.
Paths likely to change: `tools/run/clasificar.mjs`, `tools/verify/usage-and-run.sh`.
Concrete example of the expected result: builder con exit 1 y stderr `Autocompact is thrashing` da `{clase:"infra", senal:"thrashing"}`.
Scope: clasificador, fixtures y su paso en la verificación.
Files: tools/run/clasificar.mjs, tools/verify/usage-and-run.sh
WHEN se clasifica una falla THEN devuelve infra, entorno, plan, decision o tarea con su señal (A1)
Acceptance:
- A1: un fixture por clase y por señal de las Assumptions, más: salida de verificación que contiene `invalid_request` da tarea, y falla desconocida da entorno; check with `node --test tests/escalera/clasificar.test.mjs`; expect pass.
TODO:
- [x] Crear fixtures en `tests/escalera/fixtures/clases.json` y `tests/escalera/clasificar.test.mjs` (A1). Check: `node --test tests/escalera/clasificar.test.mjs`; expect rojo por módulo ausente.
- [x] Crear `tools/run/clasificar.mjs` según el Handoff (A1). Check: `node --test tests/escalera/clasificar.test.mjs`; expect pass.
- [x] Añadir `node --test tests/escalera/*.test.mjs` al paso 13 de `tools/verify/usage-and-run.sh` (A1). Check: `bash -n tools/verify/usage-and-run.sh`; expect exit 0.
- [x] Corrección: en `tools/run/clasificar.mjs` toda tarea de verify da señal `verify`; ajustar su fixture en `tests/escalera/fixtures/clases.json` (A1). Check: `node --test tests/escalera/clasificar.test.mjs`; expect pass.
Segment verification: `node --test tests/escalera/clasificar.test.mjs` — level 1; exit 0; covers A1.
Handoff: exportar `clasificar({origen, status, error, salida, retorno})`; `origen` es `builder`, `revisor` o `verify`; `salida` es stderr (o stdout+stderr de verify, últimas 40 líneas); `retorno` es la primera línea del builder. Devuelve `{clase, senal}`. Orden: `retorno` PAUSED → tabla de Assumptions de `plan.md`, salvo señal de entorno en el texto; proceso muerto (error o status distinto de 0) → infra (`thrashing`, `invalid_request`, `tope`) y si no, entorno; `verify` → entorno (`ENOSPC|No space left`, `Cannot connect to the Docker daemon`, `EPERM|Operation not permitted`, `pull access denied|No such image`, `Executable doesn't exist`, status 137/143, tope) y si no, tarea. Sin patrón y sin retorno: entorno, señal `desconocida`.

## Evidence
- Tramo 1, paso 1 (fixtures y prueba): `$ node --test tests/escalera/clasificar.test.mjs` antes del módulo: ERR_MODULE_NOT_FOUND para `tools/run/clasificar.mjs` (rojo esperado). exit 1.
- Tramo 1, paso 2 (`tools/run/clasificar.mjs`): `$ node --test tests/escalera/clasificar.test.mjs` → `ℹ tests 27`, `ℹ pass 27`, `ℹ fail 0`. exit 0.
- Tramo 1, paso 3 (`tools/verify/usage-and-run.sh`, paso 13): `$ bash -n tools/verify/usage-and-run.sh` → sin salida. exit 0. Además `$ node --test tests/escalera/*.test.mjs` → `ℹ tests 27`, `ℹ pass 27`, `ℹ fail 0`. exit 0.
- Segment verification (tramo 1): `$ node --test tests/escalera/clasificar.test.mjs` → `ℹ pass 27`, `ℹ fail 0`. exit 0.
- Corrección tramo 1 (verify → señal `verify`): `$ node --test tests/escalera/clasificar.test.mjs` → `ℹ pass 27`, `ℹ fail 0`. exit 0.
## Notes
- Tramo 1 (checkpoint): archivos nuevos `tools/run/clasificar.mjs`, `tests/escalera/clasificar.test.mjs`, `tests/escalera/fixtures/clases.json`; cambio en `tools/verify/usage-and-run.sh` (paso 13: una línea `node --test tests/escalera/*.test.mjs` con `fallo`). Sin commit.
- Decisiones menores tomadas en el tramo (dentro de Scope): la señal de entorno en `PAUSED` se busca solo en la línea `PAUSED` (primera línea del retorno); límite de uso y error de red se reconocen como señales de un proceso muerto (`limite_uso`, `red`), además del default `desconocida`; `RETURNED` del revisor es tarea. Un `origen` distinto de `verify` se trata como builder o revisor.
- Estado: paso 1 a 3 completos; verificación del tramo pasa.
- Resuelto (relanzamiento 1): `clasificar.mjs` da `verify` a toda tarea de verify; fixture `tarea: verify con invalid_request` ajustado. Tramo 1 verificado de nuevo: 27 de 27. Sin commit.
- Planner: APPROVED (2026-11-26). Corrida propia: 27/27, exit 0; A1 cumple.
