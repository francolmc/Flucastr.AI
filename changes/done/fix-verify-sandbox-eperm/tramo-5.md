---
segment: 5
---
# Segment 5

Plan: [plan.md](plan.md)

## Steps

### Segment 5 — Story: pruebas A (contrato, continuidad, huella)
As mantenedor I want estas pruebas sin stdin pipe so that dejen de dar EPERM en Codex.
Dependencies: Segment 1.
Contracts to keep: lo que cada prueba afirma; no se debilita ninguna aserción (sobre todo `assert.equal(result.error, undefined, ...)`).
Paths likely to change: `tests/builder-contract.mjs`, `tests/continuity/protocol.mjs`, `tests/diagnosis-suggests/fingerprint.test.mjs`, `tools/verify/fingerprint-module.test.mjs`.
Concrete example of the expected result: `tests/builder-contract.mjs:215` pasa a `spawnSyncSeguro('bash',['-e',scriptPath,file],{encoding:'utf8'})` y la aserción de `error` queda igual.
Scope: los 4 archivos de prueba nombrados (las pruebas no cuentan para el límite)
Files: tests/builder-contract.mjs, tests/continuity/protocol.mjs, tests/diagnosis-suggests/fingerprint.test.mjs, tools/verify/fingerprint-module.test.mjs
WHEN corren estas pruebas THEN sus hijos síncronos no usan stdin pipe y las aserciones no cambian (A7)
Acceptance:
- A7: sin stdin pipe y con las mismas aserciones; check with `node --test tests/acceptance/builder-contract.test.mjs` y `git diff` sin líneas `assert` borradas; expect exit 0.
TODO:
- [x] Migrar `spawnSync` de `tests/builder-contract.mjs` (A7). Check: `node tests/builder-contract.mjs`; expect exit 0.
- [x] Migrar `spawnSync` de `tests/continuity/protocol.mjs` (A7). Check: `node --check tests/continuity/protocol.mjs`; expect exit 0. No ejecutar el archivo: lanza `codex-builder` real (modelo, costo) y no forma parte de `./verify`; su corrida viva la hace la persona usuaria.
- [x] Migrar `spawnSync` de `tests/diagnosis-suggests/fingerprint.test.mjs` y `tools/verify/fingerprint-module.test.mjs` (A7). Check: `node --test tests/diagnosis-suggests/fingerprint.test.mjs tools/verify/fingerprint-module.test.mjs`; expect exit 0.
Segment verification: `node --test tests/acceptance/builder-contract.test.mjs && node --test tests/diagnosis-suggests/*.test.mjs` — level 1; exit 0; covers A7.
Handoff: no editar aserciones; solo cambiar la función que lanza el hijo.

## Evidence
Paso 1 (`tests/builder-contract.mjs`): migrado `spawnSync` → `spawnSyncSeguro` (import desde `../tools/spawn/sync-seguro.mjs`; línea 215 `spawnSyncSeguro('bash', ['-e', scriptPath, file], { encoding: 'utf8' })`).
$ timeout 60 node tests/builder-contract.mjs
ok A6: ambos agentes adaptan sus respuestas al idioma de la persona y las mutaciones negativas fallan
ok A4: contrato nuevo y compatibilidad con el contrato anterior
ok A2: 17 condiciones del modo continuo y compatibilidad verificadas
ok A5: plantilla y revisión exigen dependencias externas, contratos, rutas y ejemplo; 12 mutaciones negativas detectadas
registro real A2 interrumpido: casilla pendiente y nota de una línea validadas; no vuelve a ejecutar el modelo
registro real A2 interrumpido: mutación de casilla rechazada
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

Paso 3 (`tests/diagnosis-suggests/fingerprint.test.mjs` y `tools/verify/fingerprint-module.test.mjs`): `spawnSync` → `spawnSyncSeguro` en ambos; `execFileSync` de `fingerprint.test.mjs` ya llevaba `stdio` literal y no cambió.
$ timeout 60 node --test tests/diagnosis-suggests/fingerprint.test.mjs tools/verify/fingerprint-module.test.mjs
✔ the contract and diagnostic exclude tracked edits and new files under changes/ (232.672959ms)
✔ a repository without HEAD keeps the status-only fingerprint behavior (230.197777ms)
✔ a resultado.json written with the legacy key is still read (86.791752ms)
✔ fingerprint module import has no output or diagnostic execution (35.061683ms)
✔ recorrer visits regular files and skips hidden, dependency, build and linked entries (1.52553ms)
✔ fingerprintCurrent matches the independent fingerprint calculation with and without HEAD (160.628225ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0

A7 (aserciones sin cambios): `git diff` de los 4 archivos, líneas `-` que contienen `assert`:
$ git diff -- tests/builder-contract.mjs tests/continuity/protocol.mjs tests/diagnosis-suggests/fingerprint.test.mjs tools/verify/fingerprint-module.test.mjs | grep -E '^-[^-]' | grep -c assert
0
exit 0

$ git diff --stat -- <los 4 archivos>
 4 files changed, 10 insertions(+), 9 deletions(-)
exit 0

Paso 2 (`tests/continuity/protocol.mjs`): NO ejecutado, pendiente. Migrado en código: `spawnSync` → `spawnSyncSeguro` en `ejecutar` (línea 39) e import desde `../../tools/spawn/sync-seguro.mjs`; `node --check` exit 0. El check `node tests/continuity/protocol.mjs` lanza `codex-builder` real (`LANZADOR`, 30 min por llamada) y no hay duración medida registrada para esta prueba (las «pruebas de tramo unitarias, segundos» del plan no la cubren), así que se pausa antes de correrla (regla de continuidad).

Segment verification: no ejecutada todavía (depende del paso 2).
