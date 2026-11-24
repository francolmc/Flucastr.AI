---
plan: plan.md
segment: 4
---

## Steps

### Segment 4 — Story: captura automática en Codex y Pi por lectura de logs
As a user running the builder in Codex or Pi I want que sus llamadas a herramientas se vuelquen a `progress.jsonl` so that ver lo mismo que en Claude, con la latencia propia del log.
Dependencies: Segment 1.
Contracts to keep: `tools/usage/*` (lectores por lotes) y sus pruebas no cambian; solo se reutiliza `jsonl.mjs`.
Paths likely to change: `tools/progress/lector-codex.mjs` (nuevo), `tools/progress/lector-pi.mjs` (nuevo), `tools/progress/captura.mjs` (nuevo), `tests/progress/run.mjs`, `tests/progress/fixtures/`.
Concrete example of the expected result: un `rollout-*.jsonl` con un `function_call` `exec_command` y su `function_call_output` produce `comando_iniciado` y `comando_terminado` (exit 0, `ms` = diferencia de timestamps); correr la captura dos veces no duplica eventos.
Scope: `tools/progress/lector-codex.mjs`, `tools/progress/lector-pi.mjs`, `tools/progress/captura.mjs`.
Files: tools/progress/lector-codex.mjs, tools/progress/lector-pi.mjs, tools/progress/captura.mjs
WHEN `capturar({herramienta, raiz, plan, desde})` encuentra la sesión cuyo `cwd` es la raíz y cuya fecha es ≥ `desde` THEN anexa los eventos nuevos (A1)
WHEN se invoca dos veces sobre el mismo log THEN no duplica (dedupe por `id` leyendo `progress.jsonl`, sin archivo de offset) (A2)
WHEN el log de sesión tiene líneas truncadas o corruptas THEN las salta y sigue (A3)
WHEN el exit no se puede extraer del resultado THEN `comando_terminado` lleva `exit:null`, nunca un valor inventado (A4)
WHEN no hay sesión que coincida o la herramienta no tiene lector THEN devuelve 0 eventos y un motivo, sin lanzar (A5)
Acceptance:
- A1: casos con fixtures recortados de sesiones reales anonimizadas (`codex-rollout.jsonl`, `pi-session.jsonl`): sin contenido de archivos ni salidas completas, solo estructura; check `node tests/progress/run.mjs`; expect pasa.
- A2: mismo caso que A1 (ver arriba)
- A3: mismo caso que A1 (ver arriba)
- A4: mismo caso que A1 (ver arriba)
- A5: mismo caso que A1 (ver arriba)
- A6: en Evidence queda una nota con lo investigado sobre mecanismos de eventos alternativos de Codex (`notify`) y Pi (extensiones): qué se leyó y si cambia la recomendación; sin prueba real se escribe «no probado».
- A7: sensibilidad: si `captura` no deduplica, A2 falla; check revirtiendo temporalmente; expect rojo y luego verde.
TODO:
- [x] Crear `tools/progress/lector-codex.mjs` (`function_call`/`custom_tool_call` → eventos; usa `listarJsonl`/`reciente` de `tools/usage/jsonl.mjs`) (A1, A3, A4). Check: caso A1 Codex; expect pasa.
- [x] Crear `tools/progress/lector-pi.mjs` (`toolCall` `edit`/`write`/`bash` → eventos) (A1, A3, A4). Check: caso A1 Pi; expect pasa.
- [x] Crear `tools/progress/captura.mjs` (selector por herramienta, dedupe por `id`, devuelve cantidad y motivo) (A2, A5). Check: casos A2 y A5; expect pasan.
- [x] Agregar fixtures y casos A1–A5 a `tests/progress/run.mjs` (A1–A5). Check: `node tests/progress/run.mjs`; expect todos ok.
- [x] Hacer la sensibilidad A7 sobre `tools/progress/captura.mjs` y dejar la nota A6 (A6, A7). Check: rojo y luego verde; nota escrita.
Segment verification: `node tests/progress/run.mjs && node tests/usage/run.mjs` — level 1; exit 0; covers A1–A7 y que el medidor no cambió.
Handoff: ninguna lectura de `.env` ni de contenido de archivos del proyecto; solo se leen los logs de sesión. Fixtures: tomar solo la estructura (tipos, nombres de herramienta, ids, timestamps) y reemplazar rutas y comandos por valores ficticios.

## Evidence

- Código escrito (sin check ejecutado, versión previa a la reaprobación): `tools/progress/lector-codex.mjs`, `tools/progress/lector-pi.mjs`, `tools/progress/captura.mjs`; fixtures `tests/progress/fixtures/codex-rollout.jsonl` y `pi-session.jsonl`. Import de los tres módulos: exit 0.
- Pausa: `node tests/progress/run.mjs` y `node tests/usage/run.mjs` no se ejecutaron; falta una duración previa registrada para el check (regla de continuidad).
- A6 (sin prueba real): `~/.codex/config.toml` sin clave `notify`; `~/.pi/agent/extensions` con pi-subagents y pi-web-access. «no probado» para cualquier mecanismo de eventos distinto de los logs.

Reanudación del segmento 4 (reaprobado por el planner, 2026-11-23). Duración previa de `node tests/progress/run.mjs` ≈ 2,0 s; límite 4 s.
$ node tests/progress/run.mjs
ok A1 Codex: exec_command da comando_iniciado y comando_terminado con exit 0 y ms; cell cerrada por wait; sin exit → null
ok A1 Pi: bash da comando_iniciado y comando_terminado con exit y ms; edit da archivo_editado; sin exit → null
ok A2 codex: capturar dos veces sobre el mismo log no duplica eventos
ok A2 pi: capturar dos veces sobre el mismo log no duplica eventos
ok A3 codex: líneas truncadas o corruptas se saltan y la captura cuenta solo las válidas
ok A3 pi: líneas truncadas o corruptas se saltan y la captura cuenta solo las válidas
ok A4 exit no extraíble queda en null, nunca inventado (Codex call-4 y Pi tc-3)
ok A5 sin lector, sin sesión coincidente o sin directorio devuelve 0 eventos y un motivo sin lanzar
progress: 32 casos pasaron
exit 0

Duración medida de esa misma ejecución: 2070 ms (dentro del límite). Una ejecución anterior con `timeout 4s` excedió el límite (ver Notes).

$ node tests/usage/run.mjs   (duración previa ≈ 3,5 s; límite 7 s)
pruebas del medidor: 20 de 20 ok
exit 0 (2010 ms)

Sensibilidad A7 (dedupe de `tools/progress/captura.mjs` desactivado temporalmente con `if (false && vistos.has(clave)) continue;`; original guardado en una copia temporal y restaurado):
$ node tests/progress/run.mjs
FALLO A2 codex: capturar dos veces sobre el mismo log no duplica eventos
FALLO A2 pi: capturar dos veces sobre el mismo log no duplica eventos
progress: 2 caso(s) fallaron
exit 1
Restaurado (`cmp` idéntico) y `node tests/progress/run.mjs` →
progress: 32 casos pasaron
exit 0

A6 (nota, sin prueba real): se revisó `~/.codex/config.toml`, que no tiene clave `notify`, y `~/.pi/agent/extensions`, con pi-subagents y pi-web-access; no se encontró un mecanismo de eventos de progreso comprobado en ninguno de los dos. Se mantiene la lectura de logs. Cualquier otro mecanismo de eventos de Codex o Pi: «no probado».
