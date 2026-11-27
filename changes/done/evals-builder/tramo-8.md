## Steps

### Segment 8 — Story: correr una variante
As persona dueña del kit I want ejecutar el corpus con una semilla so that obtenga una línea base reanudable.
Dependencies: Segment 4 — calibración; Segment 5 — variante; Segment 7 — métricas; External — Codex con sesión, solo en la corrida real.
Contracts to keep: D-02, D-04, D-05.
Paths likely to change: `evals/builder/lib/correr.mjs`, `evals/builder/lib/calibrar.mjs`, `tests/evals-builder/correr.test.mjs`.
Concrete example of the expected result: `bench.mjs correr --variante base --semilla 1 --salida /tmp/eb` añade una línea por tramo a `resultados.jsonl`.
Scope: los dos módulos y la prueba.
Files: evals/builder/lib/correr.mjs, evals/builder/lib/calibrar.mjs, tests/evals-builder/correr.test.mjs
WHEN se corre una variante THEN cada tramo válido pasa por `kit run` y queda medido (A8)
WHEN falla el contrato, se agota el límite de uso o el tope THEN la corrida se detiene y puede reanudarse (A9)
Acceptance:
- A8: orden determinado por la semilla, `corrida.json` (semilla, orden, repeticiones, hash de corpus, huellas, modelos resueltos, versión de Codex), oráculo reaplicado y hash comparado, copias borradas; check with `node --test tests/evals-builder/correr.test.mjs`; expect exit 0.
- A9: sin calibración o con menos de 10 válidos (sin `--tramos`) sale con 1 sin lanzar nada; `contrato_ok` false, límite de uso o `--tope-tokens` detienen; al repetir se saltan los terminados y se reintentan `entorno` e `invalida`; check with la misma prueba; expect exit 0.
TODO:
- [x] Escribir casos con builder y revisor falsos en `tests/evals-builder/correr.test.mjs` (A8, A9). Check: la prueba; expect rojo.
- [x] Devolver `oraculo` y aceptar un nombre de carpeta en `prepararTramo` de `evals/builder/lib/calibrar.mjs` (A8). Check: `tests/evals-builder/correr.test.mjs`; expect carpeta `bench-<corrida>-<ID>-r<k>` y hashes.
- [x] Implementar el ciclo en `evals/builder/lib/correr.mjs` (A8). Check: la prueba; expect una línea por tramo.
- [x] Añadir cortes y reanudación en `evals/builder/lib/correr.mjs` (A9). Check: la prueba; expect exit 0.
- [x] Probar `main` de `evals/builder/lib/correr.mjs` en `tests/evals-builder/correr.test.mjs` con ejecutor real, `KIT_RUN_BUILDER`/`KIT_RUN_REVIEWER` falsos, `--local` y carpeta de Codex falsos, raíz sola y repo hijo (A8, D-24). Check: la prueba; expect rojo.
- [x] Mezclar `process.env` con el de la variante, pasar `codexReal` a `prepararVariante` y limpiarla siempre en `evals/builder/lib/correr.mjs` (A8). Check: la prueba; expect builder falso lanzado y sin temporales.
- [x] Devolver `referencia` (`git diff --numstat` de `Files:`) y las carpetas de cada repo en `prepararTramo` de `evals/builder/lib/calibrar.mjs` (A8). Check: la prueba; expect archivos y líneas.
- [x] Contar cambios en cada repo de la copia y filtrar `usage.mjs` por nombre de carpeta en `evals/builder/lib/correr.mjs` (A8). Check: la prueba; expect tokens y líneas del hijo.
- [x] Leer las sesiones de la copia y pasar `textos` y rutas a `calcularMetricas` en `evals/builder/lib/correr.mjs` (A8, A9, D-24). Check: la prueba; expect `contrato_ok` true y false con corte.
- [x] Escribir modelos resueltos y versión de Codex en `corrida.json` desde `evals/builder/lib/correr.mjs` (A8). Check: la prueba; expect nombres de modelo y versión o null si falta el binario.
- [x] Anotar `entorno` si `kit run` no deja intentos, en `evals/builder/lib/correr.mjs` (A9). Check: la prueba; expect ese resultado.
Segment verification: `node --test tests/evals-builder/correr.test.mjs` — level 1; exit 0; covers A8, A9.
Handoff: rutas para `contrato_ok`: la copia es `execute-plan/SKILL.md` bajo el HOME temporal y bajo la copia del kit; la viva, bajo el HOME real y bajo este repo. `rutasFuente`: raíces de `local.json` de proyectos privados y, en K, este repo salvo la propia copia. Sesiones: `<codex>/sessions/**`, solo las cuyo `cwd` es la copia; formato como lo lee `scripts/usage.mjs`. Modelos: resolver como `scripts/kit-run.mjs`. El texto de sesiones no se escribe en la salida (D-05). reutilizar `prepararTramo` de `lib/calibrar.mjs` para armar cada copia; `--tramos` recibe IDs. Comando: `node <copia-kit>/scripts/kit-run.mjs changes/<ID>/plan.md --tool codex --root <copia>`. Opciones (alias): `--variante/--variant`, `--semilla/--seed`, `--repeticiones/--repeats` (1), `--tramos/--segments`, `--tope-tokens/--token-cap`, `--salida/--output`, `--local`. Reanudar exige igual cabecera.

## Evidence

Antes de la implementación (rojo): `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `Cannot find module .../evals/builder/lib/correr.mjs`; `exit 1`.

Tras la implementación (verde): `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `ℹ tests 11`, `ℹ pass 11`, `ℹ fail 0`; `exit 0`. Cubre A8 (orden por semilla, `corrida.json`, una línea por tramo, oráculo reaplicado y comparado, copias borradas, carpeta `bench-<corrida>-<ID>-r<k>`) y A9 (sin calibración o con menos de diez válidos sale con 1 sin lanzar nada; `contrato_ok` falso y `--tope-tokens` cortan con 3; límite de uso no deja línea; al reanudar se saltan DONE y PAUSED, se reintenta entorno e invalida; cabecera distinta sale con 2).

Regresión de `prepararTramo` (ahora con `carpeta`, `oraculo` y `reaplicarOraculo`): `timeout 60 node --test tests/evals-builder/calibrar.test.mjs` → `ℹ tests 13`, `ℹ pass 13`, `exit 0`.

Suite del banco: `timeout 300 node --test tests/evals-builder/*.test.mjs` → `ℹ tests 65`, `ℹ pass 65`, `ℹ fail 0`; `exit 0`.

Despacho: `node evals/builder/bench.mjs correr` → `correr: falta --salida (o --output)`; `exit 2`. Con `--calibracion` inexistente → `correr: no se lee la calibración (--calibracion)`; `exit 1`.

Paso 21 (rojo, builder, 2026-11-26): `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `ℹ tests 20`, `ℹ pass 11`, `ℹ fail 9`; `exit 1`. Fallan las 6 pruebas `main` (raíz sola, repo hijo, entorno, contrato copia y viva, corrida.json) y las de `correr` (sin-intentos) y `prepararTramo` (referencia, carpetas). Primera falla: `'entorno' !== 'DONE'` (el ejecutor real no recibe el entorno del proceso).

Paso 23 (builder, 2026-11-26): `prepararTramo` devuelve `referencia` (`git diff --numstat base referencia -- <Files:>`, binarios fuera) y `carpetas` (una por repo). `timeout 60 node --test --test-name-pattern=prepararTramo tests/evals-builder/correr.test.mjs` → `ℹ tests 3`, `ℹ pass 3`; `exit 0`. Regresión `timeout 60 node --test tests/evals-builder/calibrar.test.mjs` → `ℹ tests 13`, `ℹ pass 13`; `exit 0`.

Paso 22 (builder, 2026-11-26): `main` mezcla `process.env` con `variante.env` (`env = { ...process.env, ...variante.env }`), pasa `codexReal` a `prepararVariante` y llama `variante.limpiar()` en `finally`. Causa de que el builder no corriera: la copia de `prepararVariante` no trae `adapters/`, que `scripts/resolver.mjs` importa. `main` lo copia desde el kit dentro del `try` que limpia la variante; `variante.mjs` queda sin cambios (fuera de *Scope*; D-25). Rojo previo: `'entorno' !== 'DONE'` con el builder sin lanzar. `timeout 60 node --test --test-name-pattern="entorno mezcla" tests/evals-builder/correr.test.mjs` → `ℹ pass 1`, `ℹ fail 0`; `exit 0`.

Paso 24 (builder, 2026-11-26): `ejecutorReal` cuenta los cambios de cada carpeta de `copia.carpetas` (raíz e hijo; la ruta del hijo sale relativa a la copia), con la base sintética de cada repo, y filtra `usage.mjs` por `basename(copia.destino)` (antes se pasaba la ruta completa y el filtro no coincidía). El builder falso ahora marca las casillas y escribe `$ node -e …` con `exit 0` bajo `## Evidence`, para que la puerta (`kit-close`) pase. Rojo previo: la aserción de `producto` del repo hijo (2) fallaba. Verde: el test comprueba `producto` 2 y `tokens.entrada` 100 / `tokens.salida` 10 de la sesión de la copia. `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `ℹ pass 21`, `ℹ fail 0`; `exit 0`.

Paso 25 (builder, 2026-11-26): `sesionesDeCarpetas` lee las sesiones de Codex cuyo `session_meta.cwd` es una carpeta de la copia y las pasa como `textos` a `calcularMetricas`, con `rutasCopia` (HOME temporal y kit de la copia), `rutasViva` (HOME real y `RAIZ_KIT`) y `rutasFuente` (raíces de `local.json`, más `RAIZ_KIT` si el alias es K). Las líneas no se escriben (D-05). Rojo previo: `null !== true` (contrato sin leer). Verde: copia → `contrato_ok` true y `contaminado` false, `exit 0`; contrato vivo → `contrato_ok` false, código 3 y una línea. `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `ℹ pass 21`, `ℹ fail 0`; `exit 0`.

Paso 26 (builder, 2026-11-26): `corrida.json` lleva `modelos` resueltos con `crearResolucionModelos(kitDestino)` (`FLUCASTR_MODELOS` apunta a la copia mientras resuelve) y `version: versionCodex(env)`, que llama `spawnSyncSeguro("codex", ["--version"])` y da null si falla. Verde: `version` es `codex-cli 9.9.9` con un codex falso en el PATH; `modelos.builder` es una cadena; `versionCodex` con PATH vacío da null (`versionCodex: sin binario codex en el PATH devuelve null`). `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `ℹ pass 21`, `ℹ fail 0`; `exit 0`.

Paso 27 (builder, 2026-11-26): `correr` deja una línea `entorno` con motivo `sin-intentos` cuando `kit run` no deja intentos, y sigue con el tramo siguiente. Rojo previo: `null !== 'entorno'`. Verde: `correr: un tramo que deja cero intentos queda entorno con motivo sin-intentos (A9)` pasa. `timeout 60 node --test tests/evals-builder/correr.test.mjs` → `ℹ pass 21`, `ℹ fail 0`; `exit 0`.

Segment check (tramo 8): `node --test tests/evals-builder/correr.test.mjs` → `ℹ tests 21`, `ℹ pass 21`, `ℹ fail 0`; `exit 0`, con la prueba del ejecutor real (A8, A9). Suite del banco: `timeout 300 node --test tests/evals-builder/*.test.mjs` → `ℹ tests 75`, `ℹ pass 75`; `exit 0`.
