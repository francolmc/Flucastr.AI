---
plan: plan.md
segment: 6
---

## Steps

### Segment 6 — Story: `kit run` muestra la señal y deja el resumen
As a user running `kit run` I want una línea de estado cada N segundos y un resumen al terminar so that saber si el builder avanza o espera, y retomar tras un corte por tope.
Dependencies: Segments 1, 4 and 5.
Contracts to keep: salida `DONE:`/`PAUSED:`, códigos de salida 0/1/2, relanzamientos, `runs.jsonl`, topes de tiempo, decisiones del revisor. Las líneas del resumen periódico van a stderr.
Paths likely to change: `scripts/progress-watch.mjs` (nuevo), `scripts/kit-run.mjs`, `tests/kit-run/run.mjs`, `tests/progress/run.mjs`.
Concrete example of the expected result: durante un builder simulado de 3 s con `KIT_PROGRESO_INTERVALO=1`, stderr muestra ≥ 2 líneas `[progreso] avanzando · paso … · última actividad hace Ns`; al terminar existe `changes/<n>/progress-resumen.md`; la salida estándar y el código de salida son idénticos a los de antes.
Scope: `scripts/progress-watch.mjs`, `scripts/kit-run.mjs`.
Files: scripts/progress-watch.mjs, scripts/kit-run.mjs
WHEN arranca el builder THEN `kit run` lanza `progress-watch.mjs` como proceso hijo asíncrono (`spawn`, no `spawnSync`) con la herramienta, el plan y la hora de inicio, y lo detiene al terminar el builder (A1)
WHEN el hijo corre THEN cada intervalo captura (Codex/Pi con `captura.mjs`), registra `casilla_marcada` y `fingerprint_cambió`, e imprime una línea con la señal en stderr (A2)
WHEN el builder termina en DONE, PAUSED o por tope THEN se escribe `progress-resumen.md` (con el encabezado de corte por tope si aplica) antes de la salida final (A3)
WHEN el hijo falla o no arranca THEN `kit run` sigue igual y avisa por stderr (A4)
WHEN se comparan salida estándar y código de salida con y sin el watcher THEN son idénticos en DONE, PAUSED por verify, PAUSED por tope y exit 2 (A5)
WHEN corte por tope THEN además se anexa un evento `bloqueo` con origen `kitrun` y texto `corte por tope` (A6)
Acceptance:
- A1: casos nuevos en `tests/progress/run.mjs` con builder, verify y revisor simulados (patrón `tests/kit-run/run.mjs`); el corte por tope se simula con `KIT_RUN_TOPE_MS` bajo; check `node tests/progress/run.mjs`; expect pasa.
- A2: mismo caso que A1 (ver arriba)
- A3: mismo caso que A1 (ver arriba)
- A4: mismo caso que A1 (ver arriba)
- A6: mismo caso que A1 (ver arriba)
- A5: los casos previos de `tests/kit-run/run.mjs` siguen verdes (línea base del sandbox anotada); check `node tests/kit-run/run.mjs`; expect igual que antes.
- A7: sobrecarga: se mide el tiempo de un `kit run` simulado con y sin watcher; se anota en Evidence; expect diferencia < 2 s.
- A8: sensibilidad: si `kit run` no lanza el watcher, A1 falla; check revirtiendo temporalmente; expect rojo y luego verde.
TODO:
- [x] Crear `scripts/progress-watch.mjs` (bucle con `setInterval`, lee `progress.jsonl`, llama a `captura.mjs`, calcula estado con `estado.mjs`, imprime a stderr, termina con SIGTERM) (A2). Check: caso A2; expect pasa.
- [x] En `scripts/kit-run.mjs` lanzar y detener el watcher alrededor de la llamada al builder, y llamar a `escribirResumen` antes de la salida final, sin tocar condiciones ni códigos (A1, A3, A4, A5, A6). Check: `node tests/kit-run/run.mjs`; expect los casos previos igual que la línea base.
- [x] Agregar los casos A1–A6 a `tests/progress/run.mjs` (A1–A6). Check: `node tests/progress/run.mjs`; expect todos ok.
- [x] Medir A7 y hacer la sensibilidad A8 sobre `scripts/kit-run.mjs` (A7, A8). Check: números anotados; rojo y luego verde.
Segment verification: `node tests/progress/run.mjs && node tests/kit-run/run.mjs` — level 1; exit 0 (salvo línea base conocida anotada); covers A1–A8.
Handoff: nunca cambiar la lógica de decisión. El watcher escribe `progress.jsonl` solo con `anexar`; `progress-resumen.md` lo escribe solo `kit run`. Si el builder se cortó por tope, el mensaje existente «superó el tope de N ms» (`tools/run/process.mjs`) es la señal; no se agregan campos al `PAUSED`.

## Evidence

TODO 1 (`scripts/progress-watch.mjs`, caso A2 en `tests/progress/run.mjs`):
$ node tests/progress/run.mjs   (salida relevante)
ok A2 progress-watch imprime líneas de estado, registra la casilla marcada y sale 0 con SIGTERM sin escribir en stdout
progress: 39 casos pasaron
exit 0
Duración de `node tests/progress/run.mjs`: 4,7 s (medida con `date +%s%N`; la línea base registrada era ≈ 2,5 s sin el caso A2, que espera ≈ 2,6 s por diseño). 4,7 s < 2 × 2,5 s = 5 s: pasa.

TODO 2 (`scripts/kit-run.mjs`: `spawn` del vigilante alrededor del builder, `kill` tras el builder, cierre con `--una-vez` y `escribirResumen`, `bloqueo` por corte; decisiones, salida y códigos sin cambios):
$ node --check scripts/kit-run.mjs   → syntax ok
$ node tests/kit-run/run.mjs   → 49 líneas de casos; `kit-run: 1 caso(s) fallaron`, exit 1
FALLO las opciones en inglés conservan el recorrido y las mezclas con mayúsculas no cambian nada
  (única diferencia: el nombre aleatorio del directorio temporal `kit-run-XXXXXX`; falla de línea base conocida, la misma que antes del tramo)
Resto: todos los casos «ok», incluidos A1, A2, A3a–d, A5a–c, A6, A7, A8, C1, C2, R1–R5, V2–V5 y M1.
Duración: 14,5 s (línea base ≈ 15 s; 2 × 15 s = 30 s: pasa).

TODO 3 (casos A1, A3, A4, A5 y A6 de kit run en `tests/progress/run.mjs`):
$ node tests/progress/run.mjs   (salida relevante)
ok A1, ok A3 (DONE, PAUSED por verify y PAUSED por tope con resumen y encabezado de corte), ok A4, ok A5 (DONE, PAUSED verify, PAUSED tope y exit 2 idénticos con y sin vigilante), ok A6 (`bloqueo` con `o:"kitrun"` y `texto:"corte por tope"` solo en el corte)
progress: 44 casos pasaron
exit 0
Duración: 12,9 s (12 884 ms). Supera 2 × 2,5 s de la línea base: el aumento viene de los 3 s del builder de A1 y de la espera de ≈2,6 s de A2, que son parte del diseño de los casos. Regla de modo continuo: se detiene el tramo antes de TODO 4 (ver Notas del plan).

TODO 4 (A7 y A8 sobre `scripts/kit-run.mjs`):
A7 (sobrecarga): `kit run` simulado con builder de 3 s, `KIT_PROGRESO_INTERVALO=1` y los mismos falsos de `tests/progress/run.mjs`; tres repeticiones alternadas, medidas con `date +%s%N`. Corrida con vigilante (`KIT_PROGRESO=1`) y sin él (`KIT_PROGRESO=0`):
$ kit run con vigilante / sin vigilante, 3 repeticiones
con-1 exit=0 ms=3306 stdout=DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa| lineas_progreso=2
sin-1 exit=0 ms=3243 stdout=DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa| lineas_progreso=0
con-2 exit=0 ms=3286 stdout=DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa| lineas_progreso=2
sin-2 exit=0 ms=3275 stdout=DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa| lineas_progreso=0
con-3 exit=0 ms=3286 stdout=DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa| lineas_progreso=2
sin-3 exit=0 ms=3253 stdout=DONE: plan=changes/prueba/plan.md; segment=1; verify=pasa| lineas_progreso=0
exit 0 en las seis corridas. Medias: con vigilante ≈ 3293 ms, sin vigilante ≈ 3257 ms; diferencia ≈ 36 ms, < 2 s: pasa. Salida estándar y códigos iguales con y sin vigilante.
A8 (sensibilidad): copia de respaldo de `scripts/kit-run.mjs` y sustitución temporal de `lanzarVigilante(...)` por `null`.
$ node tests/progress/run.mjs   (con la llamada quitada)
FALLO A1 kit run lanza el vigilante alrededor del builder: un builder de 3 s deja ≥ 2 líneas de estado y el run termina
progress: 1 caso(s) fallaron
exit 1
Restaurado con `cp` desde la copia; `cmp` contra el respaldo sin diferencias (exit 0); `grep` de la marca temporal sin resultados.
$ node tests/progress/run.mjs   (tras restaurar)
progress: 44 casos pasaron
exit 0
Segment verification (`node tests/progress/run.mjs && node tests/kit-run/run.mjs`, ejecutado por separado):
$ node tests/progress/run.mjs
progress: 44 casos pasaron
exit 0
$ node tests/kit-run/run.mjs
FALLO las opciones en inglés conservan el recorrido y las mezclas con mayúsculas no cambian nada
kit-run: 1 caso(s) fallaron   (línea base conocida; R5 ok)
exit 1
