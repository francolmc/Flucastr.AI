---
plan: plan.md
segment: 1
---

## Steps

### Segment 1 — Story: un log de eventos seguro y un cálculo de estado
As a kit user I want un formato de eventos con redacción y una función que calcule el estado so that todo lo demás (hook, lectores, `kit-status`) comparta una sola definición.
Dependencies: Not applicable.
Contracts to keep: `tools/usage/jsonl.mjs` no cambia; `registrar` de `tools/run/registro.mjs` no cambia.
Paths likely to change: `tools/progress/eventos.mjs` (nuevo), `tools/progress/estado.mjs` (nuevo), `tests/progress/run.mjs` (nuevo), `tests/progress/fixtures/` (nuevo).
Concrete example of the expected result: `redactar("curl -H 'Authorization: Bearer abc123def456ghi789jkl012mno345' http://x")` devuelve el comando con `Authorization: [redactado]`; un `progress.jsonl` con un `comando_iniciado` sin `comando_terminado` da señal `esperando comando`.
Scope: `tools/progress/eventos.mjs`, `tools/progress/estado.mjs`.
Files: tools/progress/eventos.mjs, tools/progress/estado.mjs
WHEN se arma un evento con comando o texto largo o con apariencia de secreto THEN queda truncado (comando ≤ 200, texto ≤ 160) y redactado (A1)
WHEN `anexar(ruta, evento)` falla al escribir THEN no lanza y avisa por stderr (A2)
WHEN `leerEventos(ruta)` encuentra líneas corruptas o truncadas THEN las cuenta y devuelve las válidas, sin lanzar (A3)
WHEN se calcula el estado THEN devuelve segmento, paso actual, último archivo, último comando (con `enCurso` y duración), segundos desde la última actividad, señal (`avanzando`, `esperando comando`, `sin actividad`) y cambios de huella en el último intervalo (A4)
Acceptance:
- A1: casos con `password=`, `Bearer …`, `sk-…`, `ghp_…`, `AKIA…`, `://u:p@`, `--password x` y una cadena de 40 hex quedan redactados; un comando de 500 caracteres queda ≤ 200; check con `node tests/progress/run.mjs`; expect pasa.
- A2: ruta no escribible (directorio con ese nombre) no lanza; check con caso; expect pasa.
- A3: log con una línea JSON truncada y una basura devuelve las válidas y `corruptas: 2`; check con caso; expect pasa.
- A4: comando iniciado sin terminado, 10 min atrás, con un evento reciente de otro tipo o no, da `esperando comando` (nunca `sin actividad`); sin comando en curso y último evento hace > umbral da `sin actividad`; dentro del umbral da `avanzando`; check con casos; expect pasan.
- A5: sensibilidad: si `redactar` devuelve su entrada, A1 falla; check revirtiéndola temporalmente; expect rojo y luego verde.
TODO:
- [x] Crear `tools/progress/eventos.mjs` con `redactar`, `truncar`, `evento(tipo, campos)` (valida tipos de la lista del plan), `anexar(ruta, evento)` (best effort) y `leerEventos(ruta)` (reusa `leerJsonl` de `tools/usage/jsonl.mjs` o su patrón, y cuenta líneas inválidas) (A1–A3). Check: `node -e "import('./tools/progress/eventos.mjs')"`; expect sin error.
- [x] Crear `tools/progress/estado.mjs` con `calcularEstado(eventos, {ahora, umbralSeg, intervaloSeg, casillas})` que devuelve el objeto de A4 (A4). Check: `node -e "import('./tools/progress/estado.mjs')"`; expect sin error.
- [x] Crear `tests/progress/run.mjs` (estilo `caso(nombre, fn)` de `tests/kit-run/run.mjs`) con A1–A4 (A1–A4). Check: `node tests/progress/run.mjs`; expect todos ok.
- [x] Hacer la sensibilidad A5 sobre `tools/progress/eventos.mjs` y dejar la evidencia en `plan.md` (A5). Check: rojo y luego verde; expect como arriba.
Segment verification: `node tests/progress/run.mjs` — level 1; exit 0; covers A1–A5.
Handoff: ni `eventos.mjs` ni `estado.mjs` leen archivos fuera de la ruta del log recibida; nunca leen `.env`. `anexar` nunca lanza. Tipos válidos: `paso_iniciado`, `archivo_editado`, `comando_iniciado`, `comando_terminado`, `fingerprint_cambió`, `casilla_marcada`, `bloqueo`, `nota`. Campos y origen: tabla «Eventos y origen» del plan.

## Evidence

- Paso 1 (`eventos.mjs`), check `node -e "import('./tools/progress/eventos.mjs')"`:
```
$ node -e "import('./tools/progress/eventos.mjs')"
exit 0
```
- Paso 2 (`estado.mjs`), check `node -e "import('./tools/progress/estado.mjs')"`:
```
$ node -e "import('./tools/progress/estado.mjs')"
exit 0
```
- Paso 3 (`tests/progress/run.mjs`, A1–A4), check `node tests/progress/run.mjs`:
```
$ node tests/progress/run.mjs
ok A1 redacta Bearer, password=, sk-, ghp_, AKIA, URL con clave, --password y hex de 40
ok A1 un comando de 500 caracteres queda en 200 o menos y los textos en 160 o menos
progreso: no se pudo anexar a /tmp/claude-1000/progreso-GA1wUw/bloqueado/progress.jsonl (EISDIR)
ok A2 anexar no lanza si la ruta es un directorio y avisa
ok A3 leerEventos devuelve las válidas y cuenta dos corruptas
ok A3 un archivo inexistente devuelve lista vacía sin lanzar
ok anexar escribe una línea JSON que leerEventos recupera
ok A4 comando iniciado sin terminar hace 10 min da esperando comando, nunca sin actividad
ok A4 sin comando en curso y último evento hace más del umbral da sin actividad
ok A4 actividad dentro del umbral da avanzando
ok A4 un comando terminado deja de estar en curso y reporta exit y duración
ok A4 reporta segmento, paso, huellas en el último intervalo y casillas
progress: 11 casos pasaron
exit 0
```
- Paso 4 (A5, sensibilidad): con la línea de redacción de `redactar` desactivada (`s = s.replace(...)` retirado), `node tests/progress/run.mjs` sale con 1 y reporta `FALLO` en A1 («redacta Bearer, password=, …»). Restaurado el archivo original, sale con 0 y `progress: 11 casos pasaron`.
```
$ node tests/progress/run.mjs   # con redacción desactivada
FALLO A1 redacta Bearer, password=, sk-, ghp_, AKIA, URL con clave, --password y hex de 40
progress: 1 caso(s) fallaron   (exit 1)
$ node tests/progress/run.mjs   # archivo restaurado
progress: 11 casos pasaron
exit 0
```
- Segment verification `node tests/progress/run.mjs`: exit 0; cubre A1–A4 y A5 (sensibilidad) como arriba.
