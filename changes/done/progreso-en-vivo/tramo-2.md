---
plan: plan.md
segment: 2
---

## Steps

### Segment 2 — Story: `kit-status` y `kit-nota` con las cinco pruebas offline
As a planner or user I want `node scripts/kit-status.mjs <plan>` so that saber en ≤ 8 líneas si el builder avanza, espera o está sin actividad, sin gastar tokens.
Dependencies: Segment 1.
Contracts to keep: salida de `kit run`, `DONE:`/`PAUSED:`, códigos de salida; `kit-status` es de solo lectura.
Paths likely to change: `scripts/kit-status.mjs` (nuevo), `scripts/kit-nota.mjs` (nuevo), `tools/verify/usage-and-run.sh`, `tests/progress/run.mjs`, `tests/progress/fixtures/`, `tests/README.md`.
Concrete example of the expected result:
```
segmento 2 · paso: Crear scripts/kit-status.mjs (último «Doing» o casilla)
última actividad: hace 14 s
último archivo: tools/progress/estado.mjs
último comando: node tests/progress/run.mjs — en curso (38 s)
casillas: 3/6
huella: cambió 2 veces en el último intervalo
señal: esperando comando
```
Scope: `scripts/kit-status.mjs`, `scripts/kit-nota.mjs`, `tools/verify/usage-and-run.sh`.
Files: scripts/kit-status.mjs, scripts/kit-nota.mjs, tools/verify/usage-and-run.sh
WHEN se ejecuta `kit-status <plan>` con `progress.jsonl` THEN imprime ≤ 8 líneas con los siete datos y la señal, exit 0 (A1)
WHEN hay un comando iniciado sin terminar hace mucho THEN la señal es `esperando comando` con su duración y nunca «sin actividad» (A2)
WHEN no hay eventos recientes ni comando en curso THEN la señal es `sin actividad desde hace N min` (A3)
WHEN el log tiene líneas corruptas o truncadas THEN `kit-status` no se rompe, muestra el estado de las válidas y avisa cuántas se ignoraron (A4)
WHEN el plan no tiene `progress.jsonl` THEN imprime un mensaje claro («sin progress.jsonl: …»), muestra las casillas del plan y sale 0 (A5)
WHEN se usa `--watch` THEN repite con el intervalo configurable (`--intervalo` seg, `KIT_PROGRESO_INTERVALO`) hasta Ctrl+C y no usa modelo (A6)
WHEN el builder ejecuta `kit-nota <plan> blocked "<causa>"` o `doing "<paso>"` THEN se anexa una línea `bloqueo`/`nota` válida, redactada y truncada, sin editar las existentes (A7)
Acceptance:
- A1: casos en `tests/progress/run.mjs` con fixtures `normal.jsonl`, `comando-largo.jsonl`, `sin-actividad.jsonl`, `corrupto.jsonl` y un plan sin log; el reloj se fija con `KIT_PROGRESO_AHORA=<iso>`; check `node tests/progress/run.mjs`; expect pasa, salida ≤ 8 líneas.
- A2: mismo caso que A1 (ver arriba)
- A3: mismo caso que A1 (ver arriba)
- A4: mismo caso que A1 (ver arriba)
- A5: mismo caso que A1 (ver arriba)
- A6: caso que corre `--watch --intervalo 1` con un límite de 2 ciclos de prueba (`KIT_PROGRESO_CICLOS=2`) y comprueba 2 impresiones; expect pasa.
- A7: caso que llama a `kit-nota`, comprueba una línea nueva válida y que las anteriores quedaron idénticas byte a byte; expect pasa.
- A8: `tools/verify/usage-and-run.sh` ejecuta `node tests/progress/run.mjs` como paso 15; check: `bash -n tools/verify/usage-and-run.sh`; expect exit 0.
- A9: sensibilidad: si `kit-status` marca `sin actividad` con comando en curso, A2 falla; check revirtiendo temporalmente; expect rojo y luego verde.
TODO:
- [x] Crear `scripts/kit-status.mjs` (solo lectura; usa `leerEventos`, `calcularEstado` y `tools/run/plan.mjs`) con la salida de ≤ 8 líneas y mensaje de degradación (A1–A5). Check: `node scripts/kit-status.mjs changes/progreso-en-vivo/plan.md`; expect exit 0 y el mensaje «sin progress.jsonl» si no existe.
- [x] En `scripts/kit-status.mjs` agregar `--watch`, `--intervalo`, `--umbral` y las variables `KIT_PROGRESO_*` (A6). Check: caso A6; expect pasa.
- [x] Crear `scripts/kit-nota.mjs` (`doing|blocked`, valida, redacta, trunca, anexa) (A7). Check: caso A7; expect pasa.
- [x] Agregar los cinco fixtures y los casos A1–A7 a `tests/progress/run.mjs` (A1–A7). Check: `node tests/progress/run.mjs`; expect todos ok.
- [x] Agregar el paso 15 a `tools/verify/usage-and-run.sh` y una fila en `tests/README.md` (A8). Check: `bash -n tools/verify/usage-and-run.sh`; expect exit 0.
- [x] Hacer la sensibilidad A9 sobre `scripts/kit-status.mjs` (A9). Check: rojo y luego verde.
Segment verification: `node tests/progress/run.mjs` — level 1; exit 0; covers A1–A9.
Handoff: `kit-status` no escribe nada. `kit-nota` solo anexa a `changes/<n>/progress.jsonl` (excepción del Scope del plan). Sin dependencias nuevas.

## Evidence

- Paso 1 (`kit-status`, check `node scripts/kit-status.mjs changes/progreso-en-vivo/plan.md`):
```
$ node scripts/kit-status.mjs changes/progreso-en-vivo/plan.md
sin progress.jsonl: el builder aún no ha escrito progreso en /home/franco/Codes/flucastr/Flucastr.AI/changes/progreso-en-vivo/progress.jsonl
segmento 2 · casillas: 0/0
exit 0
```
(`plan.md` es el índice: no tiene pasos de segmento, de ahí `0/0`.)
- Pasos 1–4 (A1–A5, salidas reales sobre copias temporales de los fixtures, reloj `KIT_PROGRESO_AHORA=2026-11-23T12:00:00.000Z`):
```
$ node scripts/kit-status.mjs <plan normal>            # A1
segmento 2 · paso: Crear scripts/kit-status.mjs
última actividad: hace 14 s
último archivo: scripts/kit-status.mjs
último comando: node tests/progress/run.mjs — exit 0 (5 s)
casillas: 2/4
huella: cambió 1 vez en el último intervalo
señal: avanzando                                       (exit 0)
$ node scripts/kit-status.mjs <plan comando-largo>     # A2
último comando: node tests/progress/run.mjs — en curso (38 s)
señal: esperando comando (38 s)                        (exit 0; sin «sin actividad»)
$ node scripts/kit-status.mjs <plan sin-actividad>     # A3
señal: sin actividad desde hace 15 min                 (exit 0)
$ node scripts/kit-status.mjs <plan corrupto>          # A4
señal: avanzando
líneas ignoradas: 2 (corruptas o truncadas)            (exit 0)
$ node scripts/kit-status.mjs <plan sin log>           # A5
sin progress.jsonl: el builder aún no ha escrito progreso en …/progress.jsonl
segmento 2 · casillas: 2/4                             (exit 0)
```
- Paso 5 (A6): `KIT_PROGRESO_CICLOS=2 node scripts/kit-status.mjs <plan> --watch --intervalo 1 | grep -c "^señal: "` → `2`, exit 0.
- Paso 6 (A7, `kit-nota`): caso «A7 kit-nota anexa líneas válidas y deja intactas las anteriores byte a byte» en `node tests/progress/run.mjs` → `ok`. Escribe `bloqueo` (con token redactado) y `nota`, y `clase` inválida sale 2. Sobre copia temporal, no sobre el log real.
- Paso 7 (A8): `bash -n tools/verify/usage-and-run.sh` → exit 0. Paso 15 añadido (`node tests/progress/run.mjs`) y fila en `tests/README.md`.
- Paso 8 (A9, sensibilidad): se mutó `scripts/kit-status.mjs` para que `esperando comando` devuelva `sin actividad`:
```
$ node tests/progress/run.mjs   # con la mutación
FALLO A2 comando iniciado sin terminar da esperando comando con su duración, nunca sin actividad
progress: 1 caso(s) fallaron   (exit 1)
$ cmp scripts/kit-status.mjs <copia original>          # restaurado: idéntico
$ node tests/progress/run.mjs
progress: 18 casos pasaron                              (exit 0)
```
- Segment verification `node tests/progress/run.mjs`:
```
progress: 18 casos pasaron
exit 0
```
