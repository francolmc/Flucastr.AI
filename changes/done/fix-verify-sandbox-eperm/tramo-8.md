---
segment: 8
---
# Segment 8

Plan: [plan.md](plan.md)

## Steps

### Segment 8 — Story: prueba estática de regresión en `./verify`
As mantenedor I want que `./verify` falle si alguien añade un spawn síncrono con stdin pipe so that el EPERM de Codex no vuelva.
Dependencies: Segments 2 a 7 — el código ya migrado (si no, la prueba nueva fallaría).
Contracts to keep: pasos 1–18 de `./verify` sin cambios.
Paths likely to change: nuevo `tests/spawn-seguro/estatico.mjs`; `verify` o `tools/verify/usage-and-run.sh` (un paso nuevo).
Concrete example of the expected result: una llamada `spawnSync("bash",["-c","x"],{encoding:"utf8"})` en un archivo temporal hace fallar la prueba; con `stdio:["ignore","pipe","pipe"]` pasa.
Scope: `tools/verify/usage-and-run.sh`, `tools/verify/docker-observer.sh` (una línea `cp -R tools/spawn` junto a `cp -R tools/observe`, paso 8r)
Files: tools/verify/usage-and-run.sh, tools/verify/docker-observer.sh
WHEN `./verify` corre THEN un escaneo estático de `spawnSync`/`execFileSync`/`execSync` en `tools/`, `scripts/`, `core/`, `tests/`, `adapters/` (sin `old/`, `changes/`, `evals/`) falla ante una llamada cuyo stdin sea pipe (A10)
WHEN el escaneo corre sobre una fixture con una llamada mala THEN falla (A11)
WHEN el escaneo no encuentra ninguna llamada THEN falla (no acepta una lista vacía) (A12)
Acceptance:
- A10: el repo pasa el escaneo; check with `node tests/spawn-seguro/estatico.mjs`; expect exit 0 y recuento de llamadas > 0.
- A11: la fixture mala falla; check with `node tests/spawn-seguro/estatico.mjs --fixture-mala`; expect exit 1 que nombra archivo y línea.
- A12: sin llamadas descubiertas el escaneo falla; check with `node tests/spawn-seguro/estatico.mjs --vacio`; expect exit 1.
TODO:
- [x] Crear `tests/spawn-seguro/estatico.mjs`: recorre archivos `.mjs/.js`, analiza cada llamada incluso multilínea (argumentos hasta el cierre) y acepta stdin `ignore`/`inherit`/fd/`"inherit"`/`"ignore"`, `exec*` con `stdio` o helper; rechaza el resto (A10). Check: `node tests/spawn-seguro/estatico.mjs`; expect exit 0.
- [x] Añadir `--fixture-mala` y `--vacio` a `tests/spawn-seguro/estatico.mjs` (A11,A12). Check: `node tests/spawn-seguro/estatico.mjs --fixture-mala; echo $?`; expect 1, y lo mismo con `--vacio`.
- [x] Añadir en `tools/verify/usage-and-run.sh` el paso 19 que corre el escaneo y las dos comprobaciones negativas (esperadas con exit 1) (A10,A11,A12). Check: `bash -n tools/verify/usage-and-run.sh`; expect exit 0.
- [x] Anotar en `AGENTS.md` una línea nueva en «Cómo funciona (v2)» y en `tests/README.md` el paso 19 (A10). Check: `rg -n "spawn-seguro" AGENTS.md tests/README.md`; expect ≥ 2 coincidencias.
Segment verification: `./verify` — level 3; exit 0; covers A10, A11, A12 y la regresión completa (≈2 min; `VERIFY_RAPIDO=1` solo para iterar).
Handoff: el último tramo corre `./verify` completo. Si el escaneo marca un sitio ya migrado como falso positivo, ajustar el escaneo, no relajar la regla de stdin; anotar el caso en Notes.

## Evidence
Comprobaciones de los cuatro TODO (2026-11-24, salidas reales):

$ node tests/spawn-seguro/estatico.mjs
estatico: OK 14 llamadas en 96 archivos (3 exentas: helper o control marcado)
exit 0

$ node tests/spawn-seguro/estatico.mjs --fixture-mala
tools/llamada-mala.mjs:2: spawnSync sin stdio: stdin queda como pipe por defecto
estatico: FALLO 1 llamada(s) con stdin que puede ser pipe
exit 1

$ node tests/spawn-seguro/estatico.mjs --vacio
estatico: FALLO no se descubrió ninguna llamada síncrona; un escaneo sin llamadas no prueba nada
exit 1

$ bash -n tools/verify/usage-and-run.sh
exit 0

$ rg -c "spawn-seguro" AGENTS.md tests/README.md
AGENTS.md:1
tests/README.md:1
(2 coincidencias)

$ node tests/spawn-seguro/run.mjs
6 casos pasaron
exit 0

Intento 1, histórico: `./verify` completo (nivel 3) no pasa. Salida real: el paso 19 imprime `ok 19` y el run se detiene en el paso 8r con `FALLO: 8r: informe filtrado sin builds del fixture` (`tools/verify/docker-observer.sh:32`). Causa: `tools/observe/diagnose.mjs` importa `../spawn/sync-seguro.mjs` (migrado en un tramo anterior), y el paso 8r copia solo `tools/observe` a un kit temporal; reproducido aparte con `node <kit-temporal>/scripts/observe.mjs report --data scripts/fixtures-observer/datos --since 2026-01-01` → `ERR_MODULE_NOT_FOUND` (exit 1). Log completo: `/tmp/claude-1000/verify-tramo8.log`. `$ ./verify` → exit 1.

Intento 1 de `./verify` (antes de añadir `tools/spawn` al paso 8r): no pasa, como se describe arriba.

Reanudación (2026-11-25, Scope ampliado a `tools/verify/docker-observer.sh`): se añadió `cp -R tools/spawn "$T8R/kit con espacios/tools/"` tras la línea `cp -R tools/observe` (línea 19 ahora). `bash -n tools/verify/docker-observer.sh` → exit 0.

$ ./verify
ok 18: pruebas de kit-close pasaron sobre los fixtures
== 19. spawn-seguro: escaneo estático de llamadas síncronas con stdin pipe (tests/spawn-seguro/estatico.mjs) ==
estatico: OK 14 llamadas en 96 archivos (3 exentas: helper o control marcado)
tools/llamada-mala.mjs:2: spawnSync sin stdio: stdin queda como pipe por defecto
estatico: FALLO 1 llamada(s) con stdin que puede ser pipe
estatico: FALLO no se descubrió ninguna llamada síncrona; un escaneo sin llamadas no prueba nada
ok 19: escaneo de stdin pasó sobre el repo y falló como se esperaba en las dos fixtures
== 8r. observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom ==
ok 8r A1-A3: el informe del fixture coincide con README.txt (medianas, máximos, caché, OOM, solape y pico)
ok 8r idioma: informes, mezcla, errores y mutación de opción equivalentes con datos aislados
ok 8r negativa: la copia sin oom no muestra OOM
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. small change: definición, riesgo y prácticas por tecnología ==
ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
exit 0

Estado: TODO 1 a 4 cumplidos; `./verify` completo pasó (exit 0) en la reanudación. Segmento 8 verificado. Ver Notes de `plan.md`.
