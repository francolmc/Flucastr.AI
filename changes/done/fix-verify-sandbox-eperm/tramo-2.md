---
segment: 2
---
# Segment 2

Plan: [plan.md](plan.md)

## Steps

### Segment 2 — Story: llamadas de `tools/run` sin stdin pipe
As mantenedor I want que `kit run` y sus ayudantes no usen stdin pipe so that corran dentro del sandbox de Codex.
Dependencies: Segment 1 — el helper.
Contracts to keep: salida y códigos de `tools/run/*`; `tests/kit-run/run.mjs` y `tests/progress/run.mjs` siguen pasando.
Paths likely to change: `tools/run/profiles.mjs`, `tools/run/process.mjs`, `tools/run/tree-fingerprint.mjs`; las pruebas no se mueven.
Concrete example of the expected result: `tools/run/profiles.mjs` llama `spawnSyncSeguro(process.execPath, [...])` y devuelve lo mismo que antes.
Scope: `tools/run/profiles.mjs`, `tools/run/process.mjs`, `tools/run/tree-fingerprint.mjs`
Files: tools/run/profiles.mjs, tools/run/process.mjs, tools/run/tree-fingerprint.mjs
WHEN `kit run` lanza hijos síncronos THEN ninguno usa stdin pipe (A4)
Acceptance:
- A4: ninguna llamada síncrona de esos 3 archivos deja stdin como pipe; check with `node tests/kit-run/run.mjs && node tests/progress/run.mjs`; expect exit 0.
TODO:
- [x] En `tools/run/profiles.mjs` importar el helper y cambiar sus 4 `spawnSync` (A4). Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] En `tools/run/tree-fingerprint.mjs` cambiar sus 3 `spawnSync` (A4). Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] En `tools/run/process.mjs` revisar el `spawnSync` de la línea ~12: si su `stdio` ya deja stdin en `ignore`/`inherit`/fd, no tocar; si no, migrarlo (A4). Check: `node tests/progress/run.mjs`; expect exit 0.
Segment verification: `node tests/kit-run/run.mjs && node tests/progress/run.mjs` — level 1; exit 0; covers A4.
Handoff: `process.mjs` puede pasar `input` o stdio propio al hijo (el agente); no cambiar ese comportamiento: leerlo antes de editar.

## Evidence

Duración previa medida (línea base antes de editar, ambos tests juntos): 33 s. Tope por comprobación: 2x = 66 s.

$ timeout 66 node tests/kit-run/run.mjs
ok puerta-fuera-de-alcance: un archivo fuera de Scope bloquea sin revisor y agota con motivo scope
ok puerta-tercer-fallo: la tercera corrida con la puerta en rojo pausa con exit 1 y sin revisor
ok runs-report-puerta: el informe acepta el motivo puerta y los campos nuevos
ok M2 mutación sensible: sin la compuerta de la puerta la roja-relanza falla
kit-run: 45 casos pasaron
exit 0

$ timeout 66 node tests/progress/run.mjs
ok A4 si el vigilante no arranca, kit run deja la salida y el código y avisa por stderr
ok A5 stdout y código de salida son idénticos con y sin vigilante en DONE, PAUSED por verify, PAUSED por tope y exit 2
ok A6 un corte por tope anexa bloqueo con origen kitrun y texto corte por tope; un DONE no lo anexa
progress: 44 casos pasaron
exit 0

$ grep -n "spawnSync" tools/run/profiles.mjs tools/run/process.mjs tools/run/tree-fingerprint.mjs
tools/run/process.mjs:10:// tope: milisegundos; si se supera, spawnSync mata el proceso y error dice que superó el tope.
(solo un comentario; ninguna llamada síncrona cruda queda en los 3 archivos, A4)
exit 0
