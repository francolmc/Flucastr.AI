## Steps

### Segment 4 — Story: calibración del corpus
As persona dueña del kit I want saber qué tramos discriminan so that ninguna medición use un tramo roto.
Dependencies: Segment 3 — plan reconstruido; External — dependencias o Docker solo en corridas reales.
Contracts to keep: D-05.
Paths likely to change: `evals/builder/bench.mjs`, `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/calibrar.test.mjs`.
Concrete example of the expected result: `node evals/builder/bench.mjs calibrar --salida /tmp/eb` escribe `calibracion.json` con `{"id":"K-02","valido":true}`.
Scope: los dos módulos y la prueba.
Files: evals/builder/bench.mjs, evals/builder/lib/calibrar.mjs, tests/evals-builder/calibrar.test.mjs
WHEN se calibra THEN un tramo vale solo si la base falla, la referencia pasa y `kit-check` no marca fallas (A4)
Acceptance:
- A4: casos válido, base verde, referencia roja y `kit-check` en falla quedan con su motivo; `calibracion.json` lleva el hash del corpus y no contiene salida ni rutas de proyectos; check with `node --test tests/evals-builder/calibrar.test.mjs`; expect exit 0.
TODO:
- [x] Escribir los cuatro casos en `tests/evals-builder/calibrar.test.mjs` (A4). Check: la prueba; expect rojo. (Rojo antes de crear `calibrar.mjs`: `Cannot find module`, exit 1.)
- [x] Crear `evals/builder/bench.mjs` que cargue `lib/<orden>.mjs` y llame `main(argv)` (A4). Check: orden desconocida; expect exit 2. (`node evals/builder/bench.mjs no-existe` → exit 2; también la prueba de orden desconocida.)
- [x] Implementar `evals/builder/lib/calibrar.mjs` con `--salida`, `--tramos`, `--local` (A4). Check: la prueba; expect exit 0. (6/6 en verde; `--local` se acepta y se valida como opción, pero aún no se lee: la corrida real la hace la persona, D-12, superada por D-13.)
- [x] Probar el ejecutor real con repos falsos en temporal y `--local` falso en `tests/evals-builder/calibrar.test.mjs`: raíz sola y raíz con repo hijo (A4). Check: la prueba; expect rojo. (Rojo antes de implementar: `ejecutarTramo` no existía, exit 1.)
- [x] Exportar `prepararTramo` en `evals/builder/lib/calibrar.mjs`: leer `--local`, copiar, superponer, preparar y escribir el plan (A4). Check: la prueba; expect copia lista. (Prueba «prepararTramo deja la copia lista»: plan escrito, base sin `Files:` de la referencia, `limpiar` borra la copia.)
- [x] Ejecutar en `evals/builder/lib/calibrar.mjs` base, `Files:` de la referencia, preparación, verificación y `kit-check`; `main` lo usa por defecto (A4, D-13). Check: la prueba; expect `calibracion.json`. (`ejecutarTramo` más `main` sin `ejecutar` inyectado: la prueba «--local falso» escribe `calibracion.json`.)
- [x] Filtrar `--tramos` por ID (`K-02,P1-01`) en `evals/builder/lib/calibrar.mjs` (A4). Check: la prueba; expect solo esos IDs; ID desconocido sale con 2. (Resultados solo de `K-01`; `ZZ-99` sale con 2.)
- [x] Leer el comando con `comandoVerificacion` en `evals/builder/lib/calibrar.mjs` (A4). Check: `tests/evals-builder/calibrar.test.mjs`; expect exit 0. (13/13; `comandoDeVerificacion` usa `comandoVerificacion` de `tools/run/plan.mjs`, D-18.)
- [x] Quitar el punto final de `Files:`, también en tramos previos, en `evals/builder/lib/calibrar.mjs` (A4). Check: caso con punto final en la prueba; expect referencia aplicada. (Prueba «Files: con punto final aplica la referencia»: exit 0; `filesDe` sirve también a los previos.)
- [x] Fallar con `error-preparacion` en `evals/builder/lib/calibrar.mjs` si una ruta propia no está en base ni referencia (A4). Check: la prueba; expect ese motivo. (Prueba «ruta propia sin base ni referencia»: `rejects` con `motivo === "error-preparacion"`, copia borrada.)
Segment verification: `node --test tests/evals-builder/calibrar.test.mjs` — level 1; exit 0; covers A4.
Handoff: orden por tramo: copia, preparación (`preparacion`, `env`, manifiestos de referencia si aplica), verificación en base, aplicar `Files:` de la referencia, verificación, `kit-check --segment N`. Registros crudos en `<salida>/logs/`. Alias de opciones: `--output`, `--segments`.
Ejecutor real (D-13), reglas probadas en exploración:
- `--local` por defecto `evals/builder/local.json`: `repos[alias]` es la raíz; `tramos[id].repo_codigo` la subcarpeta del código (`.` = raíz). Plan: `HEAD` de la raíz, `changes/done/<cambio>/plan.md` o `changes/<cambio>/plan.md`, con su `decisions.md` si existe.
- Base: sin hijo, `base` en la raíz; con hijo, `base` en el hijo y `ultimoAntesDe` la fecha de `referencia` en la raíz.
- `Files:` puede venir con prefijo `<repo_codigo>/`: quitarlo para leer y escribir en el repo del código.
- Superposición desde `referencia`: previos (`Files:` de tramos < N menos los de N; omitir los que no existan), oráculo (`seleccionarOraculo`) y, si `manifiestos_referencia`, los que existan de `package.json`, `pnpm-lock.yaml`, `package-lock.json`. Pruebas citadas en la verificación que falten: desde `HEAD` del repo del código, como oráculo.
- `preparacion` corre en el repo del código con `env`; se repite tras aplicar los `Files:` de la referencia (un archivo borrado en la referencia se borra).
- Verificación: en la copia raíz; en el hijo solo si `verificacion_en` es `codigo` (ese valor decide también la `subcarpeta` de `reconstruirPlan`).
- Plan en `changes/<ID>/plan.md` de la copia; `kit-check` como lo invoca `tools/run/`.
- Cada comando con tope de tiempo; salida cruda solo en `<salida>/logs/`; la copia se borra siempre. Un error de copia o preparación deja `valido: false` con motivo fijo y sigue con el siguiente.
- No corras la calibración sobre los repos privados: la corre la persona. Evidencia solo con IDs y conteos.

## Evidence
