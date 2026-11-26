# Tramo 6

## Steps

### Segment 6 — Story: el planner sigue la escalera en vez de ofrecer el relevo
As user I want the agent rules to use the ladder so that relief is the last resort.
Dependencies: Segment 5 — `scripts/kit-escalera.mjs`.
Contracts to keep: `planner.md` ≤ 8192 bytes y sus frases exigidas; instrucciones en inglés; «relaunch at most 2 times».
Paths likely to change: `core/agents/planner.md`, `core/references/planner/paused-and-interrupted.md`, `docs/kit-run.md`.
Concrete example of the expected result: ante `PAUSED motivo=access` el planner entrega diagnóstico y no ofrece ejecutar.
Scope: reglas del planner y documentación.
Files: core/agents/planner.md, core/references/planner/paused-and-interrupted.md, docs/kit-run.md
WHEN el builder no termina THEN las reglas mandan la escalera y el relevo exige respuesta explícita con estimación (A9)
Acceptance:
- A9: sin «After two `PAUSED`… offer to execute»; los 4 pasos, las clases y la condición de relevo escritos; tamaños en límite; check with `node --test tests/context-size/*.test.mjs tests/escalera/reglas.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/escalera/reglas.test.mjs` que exija esas frases (A9). Check: `node --test tests/escalera/reglas.test.mjs`; expect rojo.
- [x] Reescribir `core/references/planner/paused-and-interrupted.md` con la escalera (A9). Check: `git diff --check`; expect exit 0.
- [x] Reemplazar la línea «On PAUSED» de `core/agents/planner.md` según el Handoff (A9). Check: `node --test tests/context-size/*.test.mjs tests/escalera/reglas.test.mjs`; expect pass.
- [x] Actualizar diagrama, relanzamientos y campos en `docs/kit-run.md` (A9). Check: `git diff --check`; expect exit 0.
- [x] Corrección: en la referencia y `docs/kit-run.md`, paso 3 en Pi es decisión de la persona; comando `node "<kit-root>/scripts/kit-escalera.mjs" <plan> --salida <file> --herramienta <claude|pi|codex> --raiz <project>`; `resuelto_por` lo escribe `kit run` en la línea DONE y `--resuelto` en subagente; frases en `reglas.test.mjs` (A9). Check: `node --test tests/context-size/*.test.mjs tests/escalera/reglas.test.mjs`; expect pass.
Segment verification: `node --test tests/context-size/*.test.mjs tests/escalera/reglas.test.mjs` — level 1; exit 0; covers A9.
Handoff: línea nueva exacta: `- On PAUSED or crash: follow the ladder in \`paused-and-interrupted.md\`. Never run \`docker system prune\`.` Conservar en la referencia la limpieza de Docker y la reconstrucción por `git status`. Claude Code sube de nivel con el parámetro `model` del subagente solo en ese lanzamiento; Codex usa `kit run --paso 3`; Pi no tiene mecanismo de un solo lanzamiento (`kit run` solo mapea Codex): se presenta a la persona como decisión. Relevo: pregunta cerrada con la salida de `--tokens`; sin respuesta explícita no se ejecuta. Quitar «suggest raising `agents.builder.level`». La referencia explica `scripts/kit-escalera.mjs` (`--salida`, `--resuelto [--paso 3|4]`): una devolución de la revisión se pasa como `PAUSED: …; motivo=verify; <defecto>`; paso 2 con consejo de 500 tokens o menos (≤ 2000 caracteres) en Notas; paso 3 exige el sí cada vez; infra, entorno, plan y decisión nunca llevan relevo.

## Evidence

- Paso 1 (test en rojo antes de los textos): `$ node --test tests/escalera/reglas.test.mjs`
  ```
  ℹ tests 13
  ℹ pass 2
  ℹ fail 11
  ```
  exit 1 (esperado: rojo; las dos que pasan ya se cumplen en el texto actual).
- Paso 2 (referencia reescrita): `$ git diff --check -- core/references/planner/paused-and-interrupted.md` → sin salida, exit 0.
- Paso 3 (`planner.md`, 8190 de 8192 bytes): `$ node --test tests/context-size/*.test.mjs tests/escalera/reglas.test.mjs`
  ```
  ℹ tests 20
  ℹ pass 20
  ℹ fail 0
  ```
  exit 0.
- Paso 4 (`docs/kit-run.md`): `$ git diff --check -- docs/kit-run.md` → sin salida, exit 0. La comprobación de `reglas.test.mjs` del bloque de docs pasó en la corrida del paso 3.

- Verificación final del plan: `$ ./verify` (nivel 3, sin caché; salida completa en `$TMPDIR/verify-final.txt`, 854 líneas). Cola real:
  ```
  ℹ tests 48
  ℹ suites 7
  ℹ pass 48
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  VERIFY OK
  resultado registrado: Fingerprint: 4951b6f49d5e
  ```
  Fingerprint: 4951b6f49d5e. exit 0.
- Corrección (paso 3 en Pi, `--herramienta`/`--raiz`, `resuelto_por`): `$ node --test tests/context-size/*.test.mjs tests/escalera/reglas.test.mjs` → `ℹ tests 22`, `ℹ pass 22`, `ℹ fail 0`; exit 0.
- Verificación final del relanzamiento: `$ ./verify` → `ℹ tests 48`, `ℹ pass 48`, `ℹ fail 0`, `VERIFY OK`; `Fingerprint: 6df8aac37cd4`. exit 0.

## Notes
- Tramo 6 checkpoint: `tests/escalera/reglas.test.mjs` (nuevo, 13 casos; en rojo antes de escribir textos, 11 fallos); `core/references/planner/paused-and-interrupted.md` reescrita con la escalera de cuatro pasos y las clases; `core/agents/planner.md` con la línea de PAUSED o caída (8190 de 8192 bytes); `docs/kit-run.md` con la escalera, la tabla de clases y los campos `clase`, `paso`, `resuelto_por`, `builder_modelo`.
- La primera corrida del segmento, antes de editar `docs/kit-run.md`, dio 19 de 20: falló solo el bloque de docs del paso 4. La corrida final dio 20 de 20.
- Estado del plan: se pasó de `approved` a `done` sin registrar `in progress` al inicio; es el único cambio en `plan.md`. No se añadió nada a su texto.
- Sin cambios en `models.json`, en el límite de dos relanzamientos ni en los motivos de `PAUSED`. Sin commit ni push.
- Relanzamiento 1 de 2 (corrección): el comando de la referencia y de `docs/kit-run.md` se confirmó contra `scripts/kit-escalera.mjs` (`--salida`, `--resuelto`, `--paso 3|4`, `--herramienta`, `--raiz`, `--tokens`). Pi queda como decisión de la persona. Estado del plan: `in progress` al empezar y `done` tras la verificación final.