# Tramo 3 — Medir la invasión y proteger el cambio

Resultado: `node scripts/uso.mjs --sesiones` muestra, por sesión del principal, ediciones fuera de lo permitido y corridas de `verify`; `verify` falla si el principal vuelve a las frases viejas.
Archivos: `scripts/uso.mjs`, `pruebas/uso/probar.mjs`, `pruebas/uso/fixtures/`, `verify`, `docs/evaluaciones/costos.md`, `AGENTS.md`.

## Pasos
- [x] En `agentes/principal.md` separa en dos viñetas «…hace solo ese tramo.   - En planes pesados…» (paso 4) y deja una línea en blanco antes de `## Revisión por tramo`. Sin cambiar texto; ≤ 8000 bytes. (A1, A6)
  - evidencia: `agentes/principal.md` línea 30 («…hace solo ese tramo.» y viñeta «En planes pesados» en línea propia) y línea 41 en blanco antes de la línea 42 `## Revisión por tramo`; `wc -c` = 7982 bytes.
- [x] En `scripts/uso.mjs`, para Codex, Claude Code y Pi, cuenta por sesión `ediciones_fuera` (escrituras a rutas que no empiezan por `cambios/` y no son `AGENTS.md` ni `docs/proyecto.md`; en Codex lee `apply_patch` y escrituras de `python`/`cat >` en `exec_command`; en Claude `Edit`/`Write` con `file_path`; en Pi `edit`/`write`) y `corridas_verify` (comandos que ejecutan `./verify` o `npm run verify`). Se muestran con `--sesiones` y en `--json`. Solo sesiones principales: las de subagente (constructor) no cuentan. (A4)
  - evidencia: `scripts/uso.mjs` (helpers `esPermitida`, `rutasDeParche`, `rutasDeShell`, `esVerify`, `argumentosDe`, `textoDePatch`; contadores en `procesarClaude`, `procesarPi` y `procesarCodex`; columnas en `COLUMNAS_SESIONES`); `node --check scripts/uso.mjs`, exit 0.
- [x] Añade fixtures de las tres herramientas: uno sin ediciones fuera (esperado 0), uno con una edición en `src/` (esperado 1), uno con una edición en `cambios/` (esperado 0). (A4)
  - evidencia: `pruebas/uso/fixtures/invasion/sin-ediciones/`, `pruebas/uso/fixtures/invasion/edicion-src/` (incluye un subagente de Claude con una edición en `src/` que no suma) y `pruebas/uso/fixtures/invasion/edicion-cambios/`, cada una con `claude/`, `codex/` y `pi/`.
- [x] Amplía `pruebas/uso/probar.mjs` con esos casos y un caso negativo: una sesión sin ninguna escritura no puede dar `null` por error de lectura. (A4)
  - evidencia: `pruebas/uso/probar.mjs` (caso A4i sobre los 9 fixtures; `sin-ediciones` exige 0 y 0, no `null`; expectativas de sesiones con `ediciones_fuera` y `corridas_verify`); `node pruebas/uso/probar.mjs`, exit 0 (19 de 19 ok).
- [x] Agrega al `verify` el paso 8i, al estilo de 8f: las cadenas `Solo creas o editas`, `APROBADO`, `no corriges`, `una sola espera` presentes en `agentes/principal.md`; copia con `Fuera de eso no tienes límites` restituida o sin `Solo creas o editas`: debe fallar. (A5)
  - evidencia: `verify`, bloque «8k» (el número 8i ya lo usa el bloque del constructor). `bash -n verify`, exit 0; `./verify` final: «ok 8k: principal con …» y exit 0.
- [x] En `docs/evaluaciones/costos.md` agrega la sección «Invasión del principal»: línea base del 9 nov (README de Memory-AI: 10 créditos del principal frente a 0,7 del constructor; 58 llamadas; 3 ediciones de pruebas del producto en 2 sesiones) y la tabla «después» vacía con las métricas: ediciones fuera, corridas de `verify`, llamadas tras el retorno (no medible aún: anótalo), créditos del principal ÷ créditos del constructor. (A4)
  - evidencia: `docs/evaluaciones/costos.md`, sección «Invasión del principal» al final (línea base y tabla «después» con la fila «pendiente»).
- [x] En `AGENTS.md` cambia la línea del principal para decir que planifica y revisa, y que el constructor ejecuta toda edición. Sin pasar de 5600 bytes. (A1)
  - evidencia: `AGENTS.md` línea 7; `wc -c` = 5574 bytes.
- [x] `./verify` final sin caché (A1–A6)
  - evidencia: `./verify`, exit 0; «VERIFY OK»; «pruebas del medidor: 19 de 19 ok»; aviso no bloqueante de `pruebas/comparar-openspec/` (paso 10). Salida completa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/verify-tramo3.log`.

Verificación del tramo: `./verify`; cubre A1–A6.
