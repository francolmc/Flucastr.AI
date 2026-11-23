---
plan: plan.md
segment: 1
---

## Steps

### Segment 1 — Story: cada `kit run` deja un registro por intento
As a kit user I want que `kit run` escriba una línea `.jsonl` por intento so that tener datos reales de duración y retrabajo.
Dependencies: Not applicable.
Contracts to keep: salida `DONE:`/`PAUSED:`, códigos de salida, relanzamientos, decisiones y notas existentes de `kit run`; V5 (`revisor=<modelo>:<esfuerzo>`) sigue pasando.
Paths likely to change: `scripts/kit-run.mjs`, `tools/run/profiles.mjs`, `tools/run/registro.mjs` (nuevo), `tests/kit-run/run.mjs` (se amplía; no se mueve).
Concrete example of the expected result: tras una corrida con un verify rojo y luego aprobada, `changes/<n>/runs.jsonl` tiene 2 líneas: la primera `resultado:"devuelto"`, `motivo_relanzamiento:"verify"`, la segunda `resultado:"DONE"`, `relanzamientos:1`.
Scope: `scripts/kit-run.mjs`, `tools/run/registro.mjs`, `tools/run/profiles.mjs`.
Files: scripts/kit-run.mjs, tools/run/registro.mjs, tools/run/profiles.mjs
WHEN `kit run` ejecuta un plan con ejecutables simulados THEN agrega una línea válida por intento a `changes/<n>/runs.jsonl` con todos los campos (A1)
WHEN verify falla o el revisor devuelve THEN el intento queda con `resultado:"devuelto"` y el motivo correspondiente, y el siguiente intento incrementa `relanzamientos` (A2)
WHEN no se puede escribir el registro THEN `kit run` avisa por stderr y su resultado y código de salida no cambian (A3)
Acceptance:
- A1: una corrida aprobada deja 1 línea con los 12 campos y duraciones enteras ≥ 0; check con `node tests/kit-run/run.mjs` (caso nuevo R1); expect pasa.
- A2: verify rojo y luego verde deja 2 líneas (`devuelto`/`verify`, `DONE`); revisor RETURNED deja `motivo_relanzamiento:"revisor"`; check con casos R2 y R3; expect pasan.
- A3: con `runs.jsonl` no escribible (directorio con ese nombre) el código de salida y la salida `DONE:` son los mismos que sin fallo; check con caso R4; expect pasa.
- A4: las huellas inicio/fin son `null` sin git y cadenas distintas si el builder cambió archivos; check con caso R5; expect pasa.
- A5: sensibilidad: si `kit-run.mjs` no llama al registro, los casos R1–R3 fallan; check revirtiendo la llamada temporalmente; expect R1–R3 rojos y luego verdes al restaurarla.
TODO:
- [x] Crear `tools/run/registro.mjs` con `medir(fn)` (devuelve resultado y ms) y `registrar(ruta, obj)` (append de una línea, captura errores y avisa por stderr) (A1, A3). Check: `node -e "import('./tools/run/registro.mjs')"`; expect sin error.
- [x] Agregar `etiquetaBuilder(herramienta)` a `tools/run/profiles.mjs` reutilizando el resolutor existente (A1). Check: caso R1 verifica `builder_modelo` con forma `x:y`; expect pasa.
- [x] En `scripts/kit-run.mjs` envolver builder, verify y revisor con `medir` y acumular el estado del intento sin cambiar condiciones ni orden (A1, A2). Check: `node tests/kit-run/run.mjs`; expect los casos previos A1–A8, M1, C1–C2, V2–V5 siguen verdes.
- [x] En `scripts/kit-run.mjs` volcar el intento con `registrar` al inicio de la siguiente iteración y tras el bucle, antes de `fijarEstado`/`anotarNotas` (A1, A2, A3). Check: casos R1–R4; expect pasan.
- [x] Agregar casos R1–R5 a `tests/kit-run/run.mjs` con ejecutables falsos (A1–A4). Check: `node tests/kit-run/run.mjs`; expect todos verdes.
- [x] En `scripts/kit-run.mjs` hacer la comprobación de sensibilidad A5 (quitar y restaurar la llamada) y dejar la evidencia en el plan (A5). Check: salida de R1–R3 en rojo y luego en verde; expect como arriba.
Segment verification: `node tests/kit-run/run.mjs` — level 1; exit 0; covers A1–A5.
Handoff: no tocar la lógica de decisión; `registrar` nunca debe lanzar. Campos y nombres en «Decisions already taken». Caso de referencia para ejecutables falsos: `tests/kit-run/run.mjs` (`caso`, `KR_LOG`). La ruta del registro es `dirname(planPath)/runs.jsonl`.

## Evidence
**Paso 1 (`tools/run/registro.mjs`).**
$ node -e "import('./tools/run/registro.mjs')"
(sin salida; exporta `medir` y `registrar`)
exit 0

**Paso 2 (`etiquetaBuilder` en `tools/run/profiles.mjs`).** Check: `node tests/kit-run/run.mjs`, caso R1: `builder_modelo` cumple `^[^:\s]+:[^:\s]+$`. Pasa.

**Paso 3 (`medir` en builder, verify y revisor en `scripts/kit-run.mjs`).** Sin cambiar condiciones ni orden. Check: `node tests/kit-run/run.mjs` mantiene verdes A1, A2, A7, A8, M1, A3a–A3d, A5a–A5c, C1, C2, A6, uso, V2–V5 (23 casos, igual que la línea base). Salida en `$TMPDIR/kr-paso4.txt`.

**Paso 4 (volcado con `registrar`).** `volcarIntento()` al inicio de cada iteración y tras el bucle, antes de `progreso`/`fijarEstado`/`anotarNotas`. Check: R1–R4 pasan (ver paso 5).

**Paso 5 (casos R1–R5 en `tests/kit-run/run.mjs`).** `node tests/kit-run/run.mjs`: `ok R1` a `ok R5`; 28 casos verdes. Sin fallo nuevo; el único fallo es el caso previo de la línea base (inglés, normalizador de `/tmp/kit-run-*` frente a `$TMPDIR=/tmp/claude-1000`). Salida en `$TMPDIR/kr-a5-verde.txt`.

**Paso 6 (sensibilidad A5).** Con `volcarIntento` sin `registrar` temporalmente: R1, R2 y R3 en rojo (R4 y R5 también fallan porque comprueban el archivo y el aviso; esperado). Restaurado: 28 casos verdes, solo falla el caso de la línea base. Salida en `$TMPDIR/kr-a5-rojo.txt` y `$TMPDIR/kr-a5-verde.txt`.

**Verificación del tramo (`node tests/kit-run/run.mjs`).** Exit 1 en este sandbox solo por el caso de la línea base; R1–R5 pasan. Criterio de Notes aplicado. Duración: dentro del tope de 18 s usado para la corrida; no medida con precisión.
