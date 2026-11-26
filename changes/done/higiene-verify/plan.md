---
status: done
branch: feature/higiene-verify
base: main
repos: [.]
executor: builder
segment: 1
continuity: continuous
type: code
---
# Higiene de /tmp y de la salida de verify

## Goal
`./verify` y las pruebas del kit no dejan temporales en `/tmp` ni vuelcan su detalle en el contexto de quien los ejecuta.

## Exploration
Cifras en `notes.md`. Causa raíz: `verify` carga los pasos con `source` y cada `trap EXIT` de nivel superior reemplaza al anterior; hay además pasos sin trap. Salida verde: 61.123 B en 856 líneas; roja: 22.891 a 31.898 B. Restos del kit en `$TMPDIR`: 3,6 MB en `tmp.*`. `pruebas/.temporales`: 12 KB hoy. Sin preguntas abiertas.

## Evaluation
- Elegida: un envoltorio dueño del temporal y de los traps, con `TMPDIR` exportado. Cubre todos los pasos, también los futuros, sin tocarlos.
- Descartada: arreglar cada trap. Toca muchos archivos y el siguiente paso puede repetir el error.
- Beneficio principal: la salida (≈15.000 tokens por verde, estimado). El disco hoy es menor. Riesgo: ocultar el detalle; queda en el log.

## Assumptions
- Log: `pruebas/.temporales/verify.log`, se sobrescribe en cada corrida. Si se quiere historial, cambia la ruta en el tramo 3.
- Mínimo libre: 500 MB, ajustable con `VERIFY_MIN_LIBRE_MB`. Otro umbral cambia una línea.
- Sin líneas de avance mientras corre y sin modo detallado; el detalle se mira en el log.
- El barrido mira solo `${TMPDIR:-/tmp}`, directorios propios del usuario.
- La prueba estática acepta los pasos de `tools/verify/` sin trap propio: los cubre el envoltorio.
- Los restos actuales (`tmp.*`, `kit-run-*`) no se borran.

## Decisions already taken
- Pedido por la persona: líneas exactas de `mktemp`, `trap` y `export` (tramo 2); barrido de más de 120 min; tramos de hasta 3 archivos.
- Sin quitar cobertura: ningún paso ni prueba existente se edita, borra o debilita.
- 5 limpiezas actuales fuera de `tools/verify/` que no calzan con la regla estática van como excepciones con motivo (tramo 4); no se tocan esos scripts.
- Executor: builder, porque requisitos, contexto y comprobaciones están completos y no hay credenciales ni despliegue.

## Decisions
- Tramo 2: TODO 3 (casos de espacio y barrido) se marcó tras escribir en la misma pasada el código de TODO 4 en `envoltorio.sh`; su rojo previo no se observó. Los casos A3 pasan contra el código actual. Sin cambio de alcance.

## Validation
Aprobado por la persona el 2026-11-26 («apruebo»), supuestos incluidos. Builder como subagente.

## Scope
`verify`, `tools/verify/envoltorio.sh`, `tools/temporales/barrido.mjs`, `scripts/kit-run.mjs`, `tests/temporales/`, `README.md`, `docs/implementacion.md`, `changes/higiene-verify/`.

## Verification
`./verify` — nivel 3; exit 0 y última línea `VERIFY OK` (≈3 min).

## Stop conditions
Continuar si el control pasa, el paso siguiente está en Scope y no falta una decisión. Parar si la misma causa falla dos veces, hay que salir de Scope o un control tarda más del doble. Líneas base: `./verify` 128 s (25 nov, WSL2); las pruebas nuevas no existen aún: estimado 10 s, anotar la medida real en la primera corrida.

Reglas de trabajo: toda salida larga va a un archivo en `${TMPDIR:-/tmp}` y se lee solo la cola o un conteo; anotar avance en `notes.md` y retomar desde ahí tras compactar; borrar solo temporales creados por este trabajo; `pruebas/.temporales` lo borra la persona. Sin commit ni push.

## Steps
Revisión: fin de historia. Cada tramo vive en su archivo:

1. [tramo-1.md](tramo-1.md): barrido de temporales viejos y `kit run`.
2. [tramo-2.md](tramo-2.md): temporal único por corrida, traps y espacio libre.
3. [tramo-3.md](tramo-3.md): resumen corto y log.
4. [tramo-4.md](tramo-4.md): prueba estática y documentación.

## Evidence

### Tramo 1
$ node --test tests/temporales/barrido.test.mjs  (TODO 1: falla esperada por módulo ausente)
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/tools/temporales/barrido.mjs' imported from …/tests/temporales/barrido.test.mjs
ℹ tests 1 · ℹ pass 0 · ℹ fail 1
exit 1

$ node --test tests/temporales/barrido.test.mjs  (TODO 2, 3 y verificación del tramo)
ℹ tests 5 · ℹ pass 5 · ℹ fail 0 · ℹ duration_ms 83.7
exit 0

$ timeout 120 node tests/kit-run/run.mjs > "${TMPDIR:-/tmp}/kr.log" 2>&1  (TODO 4; límite 2× del ≈1 min del plan)
kit-run: 50 casos pasaron
exit 0 (43 s)

Handoff (kit run con base propia): `TMPDIR=<base> node scripts/kit-run.mjs no-existe.md --tool codex --root <repo>`; el `flucastr-verify.aaaaaa` de 3 h se borró y `flucastr-verify.recien` quedó; la salida fue `error: no existe el plan no-existe.md` con `exit 2`.

### Tramo 2
$ node --test tests/temporales/envoltorio.test.mjs  (TODO 1, antes de tools/verify/envoltorio.sh)
ℹ tests 5 · ℹ pass 0 · ℹ fail 5 (tras éxito, fallo, TERM, INT y VERIFY_TARGET)
exit 1

$ node --test tests/temporales/envoltorio.test.mjs  (TODO 2, A2)
ℹ tests 5 · ℹ pass 5 · ℹ fail 0
exit 0

$ node --test tests/temporales/envoltorio.test.mjs  (TODO 3 y TODO 4, A3; verificación del tramo)
ℹ tests 7 · ℹ pass 7 · ℹ fail 0 · ℹ duration_ms 1071.5
exit 0

$ bash -n verify
exit 0

$ bash -n tools/verify/envoltorio.sh
exit 0

$ grep -c 'paso 24' verify
1

### Tramo 3
$ node --test tests/temporales/envoltorio.test.mjs  (verificación del tramo, TODO 2 y 4: A4 y A5)
ℹ tests 11 · ℹ pass 11 · ℹ fail 0
exit 0
Nota: el rojo de A4 (TODO 1) no se conservó; el rojo de A5 se vio al primer intento (salida de 41 líneas porque `cerrar` escribía en stderr) y se corrigió con el registro en el log.

### Tramo 4
$ node --test tests/temporales/estatico.test.mjs  (TODO 1, primera corrida)
ℹ tests 14 · ℹ pass 13 · ℹ fail 1 (falló «el repo pasa»: `await mkdtemp(` no se reconocía como creación en tests/permissions-contract/generation.test.mjs:13 ni en tests/review-plan/review-plan.test.mjs:14; se corrigió el patrón para aceptar `await`, sin tocar esos tests)

$ node --test tests/temporales/estatico.test.mjs  (TODO 1, tras corregir el patrón)
ℹ tests 14 · ℹ pass 14 · ℹ fail 0
exit 0

$ sonda: `scripts/zz-sonda.sh` con `t=$(mktemp)` sin trap; node --test tests/temporales/estatico.test.mjs  (TODO 2)
exit 1; ℹ pass 13 · ℹ fail 1; cita «scripts/zz-sonda.sh:2 sin trap con $t»
$ rm -f scripts/zz-sonda.sh; node --test tests/temporales/estatico.test.mjs
exit 0; ℹ pass 14 · ℹ fail 0

$ grep -l 'verify.log' README.md docs/implementacion.md  (TODO 3)
docs/implementacion.md
README.md

$ t=$(mktemp -d); trap 'rm -rf -- "$t"' EXIT; TMPDIR="$t" ./verify; echo $?; find "$t" -mindepth 1 | wc -l; wc -l -c pruebas/.temporales/verify.log  (TODO 4)
verify: 34 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: c14ce0a15e1c
VERIFY OK
exit 0
0
915 64375 pruebas/.temporales/verify.log
Duración de `./verify` no cronometrada en esta corrida; medir en la siguiente.

### Revisión 1 (builder): correcciones de los cinco `Devuelto:`

Devuelto 1 (tramo 1, dueño): `tools/temporales/barrido.mjs` salta entradas con `st.uid` distinto de `uid` (por defecto `process.getuid?.()`).
$ node --test tests/temporales/barrido.test.mjs
ℹ tests 7 · ℹ pass 7 · ℹ fail 0
exit 0
$ sensibilidad: sin el filtro de dueño (línea de `uid` comentada) · node --test tests/temporales/barrido.test.mjs
ℹ pass 6 · ℹ fail 1
exit 1 (restaurado; md5 igual al de antes)

Devuelto 2 (tramo 1, arranque de kit run): caso nuevo en `tests/temporales/barrido.test.mjs` con base propia (`TMPDIR=<base>`, `no-existe.md --tool codex --root <tmp>`): sale 2, borra el viejo y conserva el reciente.
$ sensibilidad: sin `barrer(tmpdir())` en `scripts/kit-run.mjs` · node --test tests/temporales/barrido.test.mjs
ℹ pass 6 · ℹ fail 1
exit 1 (restaurado; md5 igual al de antes)

Devuelto 3 (tramo 2, hijo con su TMPDIR): el cuerpo falso guarda `$TMPDIR` en `pruebas/tmpdir.txt`; el caso de éxito comprueba que su directorio es la base y su nombre `flucastr-verify.*`.
$ node --test tests/temporales/envoltorio.test.mjs
ℹ tests 11 · ℹ pass 11 · ℹ fail 0
exit 0
$ sensibilidad: sin `export TMPDIR=$d` en `tools/verify/envoltorio.sh` · node --test tests/temporales/envoltorio.test.mjs
ℹ pass 10 · ℹ fail 1
exit 1 (restaurado; md5 igual al de antes)

Devuelto 4 (tramo 3, registro en verde y en rojo): verde muestra `resultado registrado: …` o `no se registra: motivo=…` (hasta 3 líneas); rojo muestra cola de ≤30 líneas y ≤3000 bytes, el registro y la línea final (≤40 líneas y ≤4096 bytes en total). Hallazgo al verificar: el registro ya se añadía al log y la cola lo mostraba, así que imprimirlo otra vez lo habría repetido y la prueba de rojo no detectaba su ausencia. Se añade al log al final, después de imprimir, y la prueba exige una sola línea `resultado registrado`.
$ node --test tests/temporales/envoltorio.test.mjs
ℹ tests 15 · ℹ pass 15 · ℹ fail 0
exit 0
$ sensibilidad: sin la impresión del registro en verde · node --test tests/temporales/envoltorio.test.mjs
ℹ pass 13 · ℹ fail 2
exit 1 (restaurado; md5 igual al de antes)
$ sensibilidad: sin la impresión del registro en rojo · node --test tests/temporales/envoltorio.test.mjs
ℹ pass 13 · ℹ fail 2
exit 1 (restaurado; md5 igual al de antes)
Sensibilidad previa, descartada: la primera versión (registro en el log antes de la cola) pasaba la prueba de rojo sin la impresión, por la razón anterior.

Devuelto 5 (tramo 4, documentación): `docs/implementacion.md` corrige «los pasos no ponen trap EXIT» (varios sí; corren como hijo y sus temporales van bajo `$TMPDIR`), actualiza la cola (≤30 líneas, ≤3000 bytes; ≤40 líneas y ≤4096 bytes en total) y dice que el barrido solo toca el uid de quien ejecuta. Comprobación de cifras viejas: `grep -rn '3800\|38 líneas\|≤ 38\|no ponen sus propios' tools/verify tools/temporales docs/implementacion.md README.md verify tests/temporales` → 0 coincidencias.
$ node --test tests/temporales/*.test.mjs
ℹ tests 36 · ℹ pass 36 · ℹ fail 0 · ℹ duration_ms 2750.5
exit 0

Verificación final del relanzamiento (plan «Verification», nivel 3):
$ timeout 256 ./verify   (límite 2× de la línea base 128 s; salida completa en un archivo temporal, solo se lee la cola)
verify: 34 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 805ba0ef47ac
VERIFY OK
exit 0 (175 s medidos; la línea base de 128 s queda anotada en el plan)
Fingerprint: 805ba0ef47ac

## Notes
- Checkpoint tramo 4 (segmento 4, misma historia): archivo nuevo `tests/temporales/estatico.test.mjs` (14 pruebas: reglas de shell y de JS con fixtures malos y buenos, escaneo sin creaciones, excepción obsoleta y repositorio con 5 excepciones con motivo). Cambios en `README.md` (sección «Verify: temporales y salida») y `docs/implementacion.md` (subsección «Temporales y salida de `./verify`»). Ningún script existente cambió. La sonda `scripts/zz-sonda.sh` se creó, fue detectada y se borró. Check del tramo: `./verify` exit 0, última línea `VERIFY OK`, `TMPDIR` propio con 0 entradas.
- Checkpoint tramo 3 (segmento 3, misma historia): cambios en `tools/verify/envoltorio.sh` (A4: en verde solo resumen de 3 líneas y `VERIFY OK`, detalle en `pruebas/.temporales/verify.log`; A5: en rojo encabezado del paso, cola de hasta 38 líneas y 3800 bytes, y línea `VERIFY FALLO: paso <id>`; sin paso, cola del log) y `tests/temporales/envoltorio.test.mjs` (11 casos: A2 cinco, A3 dos, A4 uno, A5 tres). Check del tramo: envoltorio 11/11, exit 0.
- Checkpoint tramo 2 (segmento 2, misma historia): archivos nuevos `tools/verify/envoltorio.sh` y `tests/temporales/envoltorio.test.mjs` (7 casos: A2 cinco, A3 dos); cambios en `verify` (bloque padre sustituido por `exec bash tools/verify/envoltorio.sh "$PWD/verify" "$@"` cuando `VERIFY_HIJO` está vacío; paso 24 con `node --test tests/temporales/*.test.mjs` antes de `VERIFY OK`). Las cuatro líneas del Handoff están seguidas en `envoltorio.sh`, después del barrido y de la comprobación de espacio (`df -Pk`). Check del tramo: envoltorio 7/7, exit 0. Verificación completa de `./verify` pendiente para el final de la historia.
- Orden: TODO 3 (casos de espacio y barrido) se marcó después de escribir el código de TODO 4 en la misma pasada de `envoltorio.sh`; por eso su check («expect fallan») vio pasar los casos y no un rojo previo. Anotado en Decisions del plan.
- Checkpoint tramo 1 (segmento 1, historia «verify limpio y breve»): archivos nuevos `tools/temporales/barrido.mjs` (48 líneas) y `tests/temporales/barrido.test.mjs` (96 líneas); cambio en `scripts/kit-run.mjs` (+2: import y `barrer(tmpdir())` tras `leerArgs`). Check del tramo: `node --test tests/temporales/barrido.test.mjs` exit 0, 5/5. Duración medida de la prueba nueva: ≈0,1 s (estimado 10 s). Duración de `tests/kit-run/run.mjs`: 43 s, dentro del límite.

### Revisión 1 (planner): RETURNED. Corregir solo esto; verify actual pasa.
Devuelto: omision — tramo 1 — tools/temporales/barrido.mjs:29, A1: no comprueba el dueño; saltar entradas con `st.uid` distinto de `process.getuid()` (inyectable, p. ej. opción `uid`, con caso en la prueba).
Devuelto: omision — tramo 1 — tests/temporales/barrido.test.mjs:85, A1: ninguna prueba cubre que `kit run` barre al iniciar; añadir el caso del Handoff con base propia.
Devuelto: omision — tramo 2 — tests/temporales/envoltorio.test.mjs:98, A2: nada afirma que el hijo escribe en `$d`; el cuerpo falso registra `$TMPDIR` y se comprueba que es `<base>/flucastr-verify.*` (sensibilidad: sin `export TMPDIR` falla).
Devuelto: defecto — tramo 3 — tools/verify/envoltorio.sh:54, A4/A5 y «Contracts to keep»: en verde se oculta `no se registra: motivo=…` y en rojo la línea `resultado registrado: …`. Mostrar `$registro` si no está vacío en ambos casos; en rojo ajustar la cola para seguir en ≤ 40 líneas y ≤ 4096 bytes totales; casos de prueba para ambos.
Devuelto: defecto — tramo 4 — docs/implementacion.md:183, A7: es falso que los pasos no ponen `trap EXIT` propios (varios lo hacen; el envoltorio los cubre porque corren en un hijo y dentro de `$d`). Corregir y actualizar límites de la cola y «dueño propio» del barrido.
Corregido (builder, relanzamiento 1): los cinco `Devuelto:` están resueltos; ver «Revisión 1 (builder)» en Evidence. Cambios: `tools/temporales/barrido.mjs` (filtro de uid), `scripts/kit-run.mjs` sin cambios en esta pasada, `tools/verify/envoltorio.sh` (registro en verde y rojo, cola 30/3000, registro al final del log), `tests/temporales/barrido.test.mjs` y `tests/temporales/envoltorio.test.mjs` (solo se añadieron casos y aserciones), `docs/implementacion.md`.
Nota: en la raíz del repo aparecieron archivos sin seguimiento (`.bashrc`, `.gitconfig`, `.profile`, `.zshrc`, `.idea`, `.vscode`, entre otros) que esta corrida no creó; no se tocaron ni se incluyen en el cambio.

### Veredicto (planner): APPROVED
A1–A7 cumplidos; 5 puntos de la revisión 1 comprobados en el código. Huella 805ba0ef47ac vigente (`kit-verificado estado`, exit 0): no se relanza `verify`. Sin pruebas existentes tocadas. El rojo se probó con cuerpo falso, no rompiendo el `verify` real. Pendiente: Gate 2.
