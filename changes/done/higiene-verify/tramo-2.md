# Tramo 2

## Steps

### Segment 2 — Story: verify limpio y breve
As persona usuaria I want que cada corrida use un solo directorio temporal so that no queden restos, pase o falle.
Dependencies: Segment 1 — `tools/temporales/barrido.mjs`.
Contracts to keep: registro de `kit-verificado` (`iniciar`/`cerrar`, `fase-verify.txt`, sin registro con `VERIFY_TARGET`), `unset CODEX_HOME`, funciones `paso`/`fallo`, código de salida.
Paths likely to change: `verify`; `tools/verify/envoltorio.sh` (nuevo).
Concrete example of the expected result: `TMPDIR=/x ./verify` que falla en un paso deja `/x` sin `flucastr-verify.*`.
Scope: `verify`, `tools/verify/envoltorio.sh`.
Files: verify, tools/verify/envoltorio.sh
WHEN verify termina, falla o recibe INT o TERM THEN su directorio temporal desaparece (A2)
WHEN falta espacio libre THEN verify sale antes de empezar con un mensaje claro (A3)
Acceptance:
- A2: las herramientas hijas escriben dentro de `$d`; tras éxito, falla (mismo código), TERM (143) e INT (130) no queda `$d`; `resultado.json` registra `ok` true/false; check with `node --test tests/temporales/envoltorio.test.mjs`; expect exit 0.
- A3: se barren los viejos y, con menos de `VERIFY_MIN_LIBRE_MB` (500), sale 1 sin correr pasos, con `FALLO: sin espacio libre en <base>: hay N MB y se piden M MB (No space left)`; check with la misma prueba; expect exit 0.
TODO:
- [x] Crear `tests/temporales/envoltorio.test.mjs`: repo git temporal con copia de `tools/` y `scripts/`, cuerpo falso; casos A2 (A2). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect falla.
- [x] Crear `tools/verify/envoltorio.sh` con las 4 líneas del Handoff y la lógica de registro movida de `verify` (A2). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect pasan A2.
- [x] Añadir a `tests/temporales/envoltorio.test.mjs` casos de espacio y barrido (A3). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect fallan.
- [x] En `tools/verify/envoltorio.sh`, barrer y comprobar espacio (`df -Pk`) antes de `mktemp` (A3). Check: `node --test tests/temporales/envoltorio.test.mjs`; expect exit 0.
- [x] En `verify`, reemplazar el bloque padre por `exec bash tools/verify/envoltorio.sh "$PWD/verify" "$@"` si `VERIFY_HIJO` está vacío (A2). Check: `bash -n verify`; expect exit 0.
- [x] En `./verify`, añadir paso 24: `node --test tests/temporales/*.test.mjs` antes de `VERIFY OK` (A2). Check: `grep -c 'paso 24' verify`; expect 1.
Segment verification: `node --test tests/temporales/envoltorio.test.mjs` — level 1; exit 0; covers A2, A3.
Handoff: líneas exactas, en este orden y seguidas:

    d=$(mktemp -d "${TMPDIR:-/tmp}/flucastr-verify.XXXXXX")
    trap 'rm -rf -- "$d"' EXIT
    trap 'exit 130' INT; trap 'exit 143' TERM
    export TMPDIR=$d

El envoltorio corre desde la raíz con rutas relativas, no usa `source` de pasos y vale también con `VERIFY_TARGET`. El cuerpo corre con `VERIFY_HIJO=1`. La prueba quita del entorno `VERIFY_HIJO`, `VERIFY_FASE_ARCHIVO`, `VERIFY_TARGET`, `VERIFY_MIN_LIBRE_MB` y fija su `TMPDIR`. El repo falso ignora `pruebas/*`. Señales: proceso `detached`, enviar a todo el grupo, `stdio: "ignore"`. Espacio: probar con `VERIFY_MIN_LIBRE_MB=999999999`.
