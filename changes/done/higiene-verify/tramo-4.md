# Tramo 4

## Steps

### Segment 4 — Story: verify limpio y breve
As persona que mantiene el kit I want que verify rechace temporales sin limpieza so that el problema no vuelva.
Dependencies: Segment 2 — paso 24 de `verify` y el envoltorio; Segment 3 — salida resumida.
Contracts to keep: ningún script existente cambia en este tramo.
Paths likely to change: `tests/temporales/estatico.test.mjs` (nuevo), `README.md`, `docs/implementacion.md`.
Concrete example of the expected result: un `.sh` nuevo en `scripts/` con `t=$(mktemp)` sin trap hace fallar el paso 24 con `ruta:línea`.
Scope: `tests/temporales/estatico.test.mjs`, `README.md`, `docs/implementacion.md`.
Files: tests/temporales/estatico.test.mjs, README.md, docs/implementacion.md
WHEN un script crea temporales sin limpieza o fuera de TMPDIR THEN la prueba falla señalando archivo y línea (A6)
WHEN corre verify completo THEN pasa, resume y no deja temporales (A7)
Acceptance:
- A6: fixtures malos (shell sin trap, `mktemp` sin variable, `-p` o plantilla `/…`, JS sin `rm`, JS sin `finally`/`after`, `/tmp/` literal) fallan; buenos pasan; un escaneo sin creaciones falla; una excepción obsoleta falla; check with `node --test tests/temporales/estatico.test.mjs`; expect exit 0.
- A7: `./verify` pasa con salida ≤ 5 líneas y deja vacío un `TMPDIR` nuevo; la documentación lo describe; check with el último TODO; expect `0` entradas.
TODO:
- [x] Crear `tests/temporales/estatico.test.mjs` con las reglas del Handoff y fixtures malos y buenos (A6). Check: `node --test tests/temporales/estatico.test.mjs`; expect exit 0.
- [x] Probar la sensibilidad de `tests/temporales/estatico.test.mjs` con una sonda temporal (A6). Check: crear `scripts/zz-sonda.sh` con `t=$(mktemp)`, correr `node --test tests/temporales/estatico.test.mjs` y borrarla; expect falla citando la sonda; sin ella, pasa.
- [x] Describir temporal único, barrido, log y espacio en `README.md` y `docs/implementacion.md` (A7). Check: `grep -l 'verify.log' README.md docs/implementacion.md`; expect ambos.
- [x] Verificar `./verify` (≈3 min): `t=$(mktemp -d); trap 'rm -rf -- "$t"' EXIT; TMPDIR="$t" ./verify; echo $?; find "$t" -mindepth 1 | wc -l; wc -l -c pruebas/.temporales/verify.log` (A7). Check: salida; expect `VERIFY OK`, 0 y `0`.
Segment verification: `./verify` — level 3; exit 0; covers A6, A7.
Handoff: escanear `verify`, `install*.sh`, `uninstall.sh`, `tools/`, `scripts/`, `tests/`, `adapters/`, `core/` (`.sh .mjs .js .cjs`), salvo la propia prueba. Shell: `X=$(mktemp…)` exige línea `trap … EXIT` con `$X`, excepto bajo `tools/verify/`; todo otro `mktemp` fuera de comentario falla; `-p`, `--tmpdir=` o plantilla `/…` fallan siempre. JS: `X = mkdtemp(Sync)(` o `X = join(tmpdir(), …)` exige `rm(Sync)(X`, o `L.push(X)` con bucle `of L` que borre; con `mkdtemp`, además `finally` o `after(`. Excepciones `ruta:variable` con motivo: `install.sh:NUEVO` (trap `guardar_manifiesto`), `install-remote.sh:TMP` (trap `limpiar`), `tools/install/migration/names.sh:tmp` (rm tras uso), `adapters/claude-code/install-compaction.sh:tmp` (mv), `tools/run/process.mjs:dir` (borra en `finalizar`). Heurística textual: declararlo en la cabecera.
