---
plan: plan.md
segment: 5
---

## Steps

### Segment 5 — Story: resumen de corrida y huella que ignora `changes/`
As a planner I want `progress-resumen.md` y que escribir el log no cambie la huella so that retomar un corte por tope sin falsas alarmas del revisor.
Dependencies: Segment 1.
Contracts to keep: `core/contracts/verification.md` (la huella excluye `changes/`); `tests/kit-run/run.mjs` R5 (huellas `null` sin git y distintas si el builder cambió archivos); la salida `DONE:`/`PAUSED:`.
Paths likely to change: `tools/progress/resumen.mjs` (nuevo), `tools/run/tree-fingerprint.mjs`, `.gitignore`, `tests/progress/run.mjs`, `tests/kit-run/run.mjs` (solo si un caso asumía que `changes/` entra en la huella).
Concrete example of the expected result: `generarResumen(eventos, plan)` produce un `.md` con secciones «Hecho», «Tiempo por paso», «Dónde esperó», «Dónde reintentó», «Falta» y, si hubo corte, un encabezado `CORTE POR TOPE DE TIEMPO — no es un PAUSED del producto` con el punto de reanudación.
Scope: `tools/progress/resumen.mjs`, `tools/run/tree-fingerprint.mjs`, `.gitignore`.
Files: tools/progress/resumen.mjs, tools/run/tree-fingerprint.mjs, .gitignore
WHEN el resultado es DONE o PAUSED de producto THEN el resumen lleva encabezado `DONE`/`PAUSED` y las cinco secciones (A1)
WHEN la causa es el tope de tiempo THEN el encabezado es `CORTE POR TOPE DE TIEMPO — no es un PAUSED del producto`, indica el último paso, archivo y comando, y la primera casilla pendiente como punto de reanudación (A2)
WHEN `changes/<n>/progress.jsonl` o `progress-resumen.md` cambian THEN la huella no cambia (A3)
WHEN el builder cambia un archivo fuera de `changes/` THEN la huella cambia como antes (A4)
WHEN git ignora los archivos de harness THEN `git check-ignore` confirma ambos (A5)
Acceptance:
- A1: casos con fixtures; el tiempo por paso se calcula entre `casilla_marcada`; «dónde esperó» lista comandos con `ms` ≥ 30 s; «dónde reintentó» agrupa comandos idénticos repetidos; check `node tests/progress/run.mjs`; expect pasa.
- A2: mismo caso que A1 (ver arriba)
- A3: casos en repo temporal con git; check `node tests/progress/run.mjs && node tests/kit-run/run.mjs`; expect R5 y los previos siguen verdes (salvo la línea base conocida del sandbox, que se anota sin atribuirla a este cambio).
- A4: mismo caso que A3 (ver arriba)
- A5: `git check-ignore -q changes/x/progress.jsonl changes/x/progress-resumen.md`; expect exit 0.
- A6: sensibilidad: si la huella vuelve a incluir `changes/`, A3 falla; check revirtiendo temporalmente; expect rojo y luego verde.
TODO:
- [x] Crear `tools/progress/resumen.mjs` (`generarResumen` y `escribirResumen`, esta última best effort) (A1, A2). Check: casos A1–A2; expect pasan.
- [x] En `tools/run/tree-fingerprint.mjs` excluir `changes/` de `git status` y `git diff HEAD` con pathspec `':(exclude,top)changes/**'`, igual que el contrato (A3, A4). Check: casos A3–A4; expect pasan.
- [x] Agregar a `.gitignore` las líneas `changes/*/progress.jsonl` y `changes/*/progress-resumen.md` (A5). Check: `git check-ignore`; expect exit 0.
- [x] Agregar los casos A1–A4 a `tests/progress/run.mjs` y la sensibilidad A6 (A1–A4, A6). Check: `node tests/progress/run.mjs`; expect todos ok.
Segment verification: `node tests/progress/run.mjs && node tests/kit-run/run.mjs` — level 1; exit 0 (salvo línea base conocida anotada); covers A1–A6.
Handoff: no tocar `scripts/kit-run.mjs` en este tramo. Si un caso de `tests/kit-run/run.mjs` falla por la exclusión de `changes/`, se detiene con nota (es decisión del planner, no se debilita el caso).

## Evidence
- TODO 1 (`tools/progress/resumen.mjs`, A1–A2):
  $ timeout 4.2s node tests/progress/run.mjs
  ok S5-A1 resumen DONE: encabezado, tiempo entre casillas, espera ≥ 30 s y reintentos agrupados
  ok S5-A1 resumen PAUSED de producto lleva PAUSED: motivo=… y no el encabezado de corte
  ok S5-A2 corte por tope: encabezado de corte, último paso, archivo, comando y primera casilla pendiente
  ok S5-A1 escribirResumen escribe el archivo y devuelve false sin lanzar ante ruta imposible
  progress: 36 casos pasaron
  exit 0 (duración medida después: 2,3 s y 2,5 s en dos corridas; límite 4,2 s; la cifra 2,1 s de la entrada original no se midió en ese momento)
- TODO 2 (`tools/run/tree-fingerprint.mjs`, A3–A4): los casos S5-A3 y S5-A4 se añadieron en el paso de TODO 4 y pasan con la exclusión aplicada.
  $ timeout 4.2s node tests/progress/run.mjs
  ok S5-A3 cambiar progress.jsonl y progress-resumen.md no cambia la huella
  ok S5-A4 cambiar un archivo fuera de changes/ cambia la huella
  progress: 38 casos pasaron
  exit 0
- TODO 3 (`.gitignore`, A5): se añadieron `changes/*/progress.jsonl` y `changes/*/progress-resumen.md`.
  $ git check-ignore -q changes/x/progress.jsonl; echo $?   → 0
  $ git check-ignore -q changes/x/progress-resumen.md; echo $?   → 0
  Nota: con este git, `check-ignore -q` admite una sola ruta; por eso se comprueba cada archivo por separado. `git check-ignore -v` confirma `.gitignore:4` y `.gitignore:5`.
- TODO 4 (`tests/progress/run.mjs`, A1–A4 y A6): casos S5-A1 a S5-A4 en el archivo; 38 casos pasan.
  A6 (sensibilidad): se revirtió temporalmente la exclusión (`const fuera = ["."];`), S5-A3 falló (`FALLO S5-A3 cambiar progress.jsonl y progress-resumen.md no cambia la huella`); se restauró el archivo desde copia (cmp idéntico) y 38 casos volvieron a pasar.
- Segment verification: `node tests/progress/run.mjs && node tests/kit-run/run.mjs`
  progress: 38 casos pasaron, exit 0.
  kit-run: 28 casos ok y 1 fallido, 29 en total (duración 15,1 s, dentro de 2x de 12,3 s = 24,6 s). R5 («huellas null sin git; cadenas distintas cuando el builder cambió archivos») pasa.
  Falla de línea base conocida del sandbox, no atribuida a este cambio: «las opciones en inglés conservan el recorrido y las mezclas con mayúsculas no cambian nada». La diferencia está en la ruta del esquema: `/tmp/claude-1000/kit-run-<aleatorio>/veredicto.schema.json` cambia entre corridas, y el normalizador de la línea 189 solo cubre `/tmp/kit-run-…json`.
