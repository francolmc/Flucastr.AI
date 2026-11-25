---
segment: 1
---
# Segment 1

Plan: [plan.md](plan.md)

## Steps

### Segment 1 — Story: helper de spawn síncrono seguro
As mantenedor of the kit I want un helper que lance hijos síncronos sin stdin pipe so that `./verify` no dé EPERM en el sandbox de Codex.
Dependencies: Not applicable.
Contracts to keep: la API es la de `spawnSync`/`execFileSync` de Node; el resultado conserva `status`, `stdout`, `stderr`, `error`.
Paths likely to change: nuevo `tools/spawn/sync-seguro.mjs` y `tests/spawn-seguro/run.mjs`; sin rutas existentes.
Concrete example of the expected result: `spawnSyncSeguro("bash",["-c","cat"])` devuelve `status 0` y `stdout ""` (stdin cerrado, no cuelga); con `input:"hola"` y `["-c","cat"]` devuelve `stdout "hola"`.
Scope: `tools/spawn/sync-seguro.mjs`
Files: tools/spawn/sync-seguro.mjs
WHEN no se pasa `stdio` ni `input` THEN el hijo recibe `stdio ["ignore","pipe","pipe"]` (A1)
WHEN se pasa `input` THEN el helper escribe un archivo temporal, lo pasa como fd de stdin, lo borra y el hijo lo lee (A2)
WHEN se pasa `stdio` explícito THEN el helper no lo cambia (A3)
Acceptance:
- A1: sin `stdio`/`input`, el hijo ve stdin cerrado; check with `node tests/spawn-seguro/run.mjs`; expect exit 0 y caso «cat» con `stdout ""`.
- A2: con `input`, el hijo recibe el texto y no queda archivo temporal; check with el mismo test; expect `stdout "hola"` y directorio temporal sin restos.
- A3: `stdio: "inherit"` explícito se respeta; check with el mismo test; expect `result.stdout` nulo.
TODO:
- [x] Crear `tools/spawn/sync-seguro.mjs` exportando `spawnSyncSeguro` y `execFileSyncSeguro` con las reglas A1–A3 (A1,A2,A3). Check: `node --check tools/spawn/sync-seguro.mjs`; expect exit 0.
- [x] Crear `tests/spawn-seguro/run.mjs` con los casos A1, A2, A3 y un caso de `execFileSyncSeguro` (A1,A2,A3). Check: `node tests/spawn-seguro/run.mjs`; expect exit 0.
- [x] Añadir sensibilidad: un caso que use `spawnSync` crudo con `input` y compruebe que el archivo temporal no es el mecanismo (control) en `tests/spawn-seguro/run.mjs` (A2). Check: `node tests/spawn-seguro/run.mjs`; expect exit 0 e imprime el caso de control.
Segment verification: `node tests/spawn-seguro/run.mjs` — level 1; exit 0; covers A1, A2, A3.
Handoff: no hay forma de reproducir EPERM aquí; el helper se valida por comportamiento. Anota en Notes si `input` por archivo falla al correr el builder bajo Codex.

## Evidence
$ node --check tools/spawn/sync-seguro.mjs
(sin salida)
exit 0

$ node tests/spawn-seguro/run.mjs
ok - A1 sin stdio ni input: stdin cerrado, cat termina con stdout vacío
ok - A2 con input: el hijo recibe el texto y no quedan restos temporales
ok - A2 execFileSyncSeguro con input devuelve el texto y no deja restos
ok - A2 execFileSyncSeguro sin input: stdin cerrado
ok - A3 stdio explícito: el helper no lo cambia (stdout null con inherit)
control: spawnSync crudo status=0 stdout="hola" (sin helper)
ok - control: spawnSync crudo con input coincide con el helper
6 casos pasaron
exit 0
