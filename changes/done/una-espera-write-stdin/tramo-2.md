## Steps

### Segment 2 — Story: el medidor cuenta `write_stdin` y el antes queda registrado
As persona usuaria del kit I want ver cuántos `write_stdin` hizo cada sesión de Codex so that pueda comparar el antes y el después sin estimar.
Dependencies: Not applicable (el medidor no depende del tramo 1; el «después» sí necesita sesiones nuevas tras reinstalar).
Contracts to keep: las columnas existentes de `--sessions` y sus valores (`sondeos`, `esperas`, `llamadas`, `creditos`); las filas de Claude Code y Pi no cambian de valores; salida `--json` válida.
Paths likely to change: `tests/usage/run.mjs` actualiza las filas esperadas si el formateador añade la clave; nueva fixture `tests/usage/fixtures/codex-write-stdin/`.
Concrete example of the expected result: `node scripts/usage.mjs --sessions --tool codex --codex-dir tests/usage/fixtures/codex-write-stdin --json` devuelve una sesión con `write_stdin: 3` (1 `function_call` directa + 2 ocurrencias de `tools.write_stdin(` dentro de un `custom_tool_call` de `exec`) y otra con `write_stdin: 0`.
Scope: `tools/usage/codex.mjs`, `scripts/usage.mjs`, `tools/usage/report.mjs`
Files: tools/usage/codex.mjs, scripts/usage.mjs, tools/usage/report.mjs
WHEN se mide una sesión de Codex con llamadas `write_stdin` directas o dentro de `exec` THEN la fila trae `write_stdin: <n>` (A5).
WHEN la sesión no tiene `write_stdin` THEN la fila trae `write_stdin: 0`, y Claude/Pi muestran `-` (A6).
WHEN se lee `docs/evaluaciones/costos.md` THEN define la columna, trae el «antes» recalculado y dice cómo obtener el «después» sin estimar ahorro (A7).
Acceptance:
- A5: conteo en Codex; check with `node scripts/usage.mjs --sessions --tool codex --codex-dir tests/usage/fixtures/codex-write-stdin --json`; expect `write_stdin` 3 y 0 en las dos sesiones.
- A6: no rompe lo existente; check with `node tests/usage/run.mjs`; expect exit 0, filas de Claude/Pi con `write_stdin` ausente en JSON y `-` en tabla, y una prueba de sensibilidad (fixture sin `write_stdin` da 0, no el de la otra).
- A7: antes y método en `costos.md`; check with `grep -n 'write_stdin' docs/evaluaciones/costos.md`; expect definición, tabla del antes (sesiones con `corridas_verify` ≥ 1: mediana y máximo de `write_stdin`) y la frase «No se estima sin datos» conservada.
- A8: lo vecino no se rompe; check with `./verify`; expect exit 0 y `VERIFY OK` (paso 11 o el que corra `tests/usage`).
TODO:
- [x] Crea la fixture `tests/usage/fixtures/codex-write-stdin/` con dos rollouts mínimos (con tres `write_stdin`: uno directo y dos dentro de un `exec`; sin ninguno) copiando el formato de `codex-sondeos/`. (A5). Check: `ls tests/usage/fixtures/codex-write-stdin`; expect dos `.jsonl`.
- [x] En `tools/usage/codex.mjs`, cuenta `write_stdin`: `function_call` con `name` `write_stdin` más ocurrencias de `tools.write_stdin(` en la entrada de `custom_tool_call` con `name` `exec`; añádelo a la fila de sesión. (A5). Check: `node scripts/usage.mjs --sessions --tool codex --codex-dir tests/usage/fixtures/codex-write-stdin --json`; expect 3 y 0.
- [x] En `scripts/usage.mjs`, añade `write_stdin` a `COLUMNAS_SESIONES` (tras `sondeos`) y a la ayuda/comentario inicial. (A5). Check: `node scripts/usage.mjs --help`; expect la columna mencionada.
- [x] En `tools/usage/report.mjs` (línea 15), formatea `write_stdin` con `?? "-"`. (A6). Check: `node scripts/usage.mjs --sessions --tool pi --pi-dir tests/usage/fixtures/pi-sesiones`; expect `-` en esa columna.
- [x] En `tests/usage/run.mjs`, añade la prueba de `write_stdin` (3 y 0) y ajusta solo las filas esperadas que la clave nueva afecte, sin cambiar otros valores. (A6). Check: `node tests/usage/run.mjs`; expect exit 0.
- [x] Sensibilidad: confirma que quitar la rama de `custom_tool_call` en `codex.mjs` hace fallar la prueba nueva y restáurala. (A6). Check: `node tests/usage/run.mjs` con la rama quitada; expect fallo, y exit 0 al restaurar.
- [x] En `docs/evaluaciones/costos.md` («Créditos y espera»), define `write_stdin`, anota que `sondeos` no lo cuenta, y registra el antes: `node scripts/usage.mjs --sessions --tool codex --json` sobre los rollouts locales, mediana y máximo de `write_stdin` en sesiones con `corridas_verify` ≥ 1, con fecha y nº de sesiones. Si no se pueden leer, anota «bloqueado: sin acceso a los rollouts» y no inventes cifras. (A7). Check: `grep -n 'write_stdin' docs/evaluaciones/costos.md`; expect coincidencias.
- [x] En el mismo documento, deja el método del después: tras `bash install.sh`, sesiones nuevas de Codex con `verify`; misma consulta; comparar mediana de `write_stdin` por sesión con `corridas_verify` ≥ 1; criterio de éxito 2 o menos por corrida; sin cifra de ahorro hasta tener esas sesiones. (A7). Check: `grep -n 'después' docs/evaluaciones/costos.md`; expect el método.
- [x] Corre `./verify` y pega la cola en *Evidence*. (A8). Check: `VERIFY OK`; expect exit 0.
Segment verification: `./verify` — level 3; exit 0 (≈1 min 35 s medido el 2026-11-25); covers A5–A8 y repite A1–A4.
Handoff: Claude Code y Pi no cambian de valores. No cambies `claude.mjs` ni `pi.mjs`: la clave ausente se muestra como `-`. Si la clave ausente rompe la comparación de filas de los tests, ajusta solo esas filas esperadas (documento de prueba, no producto). El «después» no se puede cerrar en este cambio: necesita sesiones nuevas tras reinstalar; queda como método en `costos.md` y como revisión manual de la persona usuaria.


## Evidence
- Paso 1 (fixture): `ls tests/usage/fixtures/codex-write-stdin/sessions/2026/11/25/` da `rollout-2026-11-25T10-00-00-con-write-stdin.jsonl` y `rollout-2026-11-25T11-00-00-sin-write-stdin.jsonl`. Fecha movida de 2026-11-10 a 2026-11-25 (ver Notes).
- Paso 2 (A5): `node scripts/usage.mjs --sessions --tool codex --codex-dir tests/usage/fixtures/codex-write-stdin --json` da `write_stdin: 3` (con-write-stdin) y `write_stdin: 0` (sin-write-stdin), sin `--since`.
- Paso 3 (A5): `node scripts/usage.mjs --help` sale 0 y la línea de `--sessions` nombra `write_stdin (solo Codex)`.
- Paso 4 (A6): `node scripts/usage.mjs --sessions --tool pi --pi-dir tests/usage/fixtures/pi-sesiones` sin `--since` dice «sin sesiones desde 2026-11-18» (la fixture es de 2026-11-08). Con `--since 2026-01-01` la fila de Pi sale con `write_stdin` = `-`.
- Paso 5 (A6): `node tests/usage/run.mjs` sale 0: «pruebas del medidor: 21 de 21 ok» (incluye la nueva A5w).
- Paso 6 (A6, sensibilidad): copia en `$TMPDIR` con `scripts/` y `tools/` y sin la línea `writeStdin += contarWriteStdin(p.input)`; `node tests/usage/run.mjs --script <copia>/scripts/usage.mjs` sale 1 con «FALLO A5w»; el árbol real sale 0 con 21 de 21.
- Paso 7 (A7, antes): `node scripts/usage.mjs --sessions --tool codex --since 2026-11-01 --json` sobre `~/.codex/sessions`: 300 sesiones; 152 con `write_stdin` > 0, mediana 14, máximo 955 (8 a 24 de noviembre). Sesiones con `corridas_verify` ≥ 1: 0. Causa: el contador solo mira `exec_command` y `shell`, y los `./verify` van dentro de `exec`. Cifras en `docs/evaluaciones/costos.md`.
- Paso 8 (A7, después): método escrito en `docs/evaluaciones/costos.md`; `grep -n 'después'` da 1 línea con el método; «No se estima sin datos» conservada (1 coincidencia).
- Paso 9 (A8): `./verify` sale 0 y termina con `VERIFY OK`; el paso 12 («medidor de costos») corre `pruebas del medidor: 21 de 21 ok`. Cola de la corrida:

```
ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
```

Duración: no se midió con cronómetro en esta corrida (dentro de 300 s, el límite de `timeout`).
