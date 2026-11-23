---
status: partial
branch: feature/medir-corridas
base: main
repos: [.]
executor: builder
segment: 3
continuity: continuous
type: code
---
# Medir corridas de `kit run` (duración por fase y retrabajo)

## Goal
Cada `kit run` deja un registro `.jsonl` por intento, y `node scripts/runs-report.mjs` da mediana y p90 por fase, tasa de relanzamiento y motivos de relanzamiento. Una convención mínima `Devuelto:` en las notas del plan permite contar las devoluciones del planner cuando el builder se lanzó a mano.

## Exploration
- `scripts/kit-run.mjs` (175 líneas): bucle builder → verify → revisor, `MAX_RELANZAMIENTOS = 2`, topes con `topeMs()` (`tools/run/process.mjs`). Usa `fingerprintTree(raiz)` (`tools/run/tree-fingerprint.mjs`; `null` sin git).
- `tools/run/profiles.mjs` ya resuelve `etiquetaRevisor`; falta un equivalente para el builder (`modelo:esfuerzo` vía `scripts/resolver.mjs modelo-esfuerzo builder <herramienta>`).
- `tools/run/plan.mjs`: `frontmatter` (da `segment`), `anotarNotas`.
- `scripts/usage.mjs` y `tools/usage/jsonl.mjs` leen logs de sesiones y saltan en silencio las líneas inválidas: el informe nuevo NO debe hacerlo.
- Estilo de pruebas: `tests/kit-run/run.mjs` (`caso(nombre, fn)`, ejecutables falsos, `KR_LOG`); `tools/verify/usage-and-run.sh` pasos 12 y 13; las suites de aceptación son tres envoltorios y no se agrega un cuarto.
- No existe ningún «Devuelto» previo en el repo. La única instrucción de devolución está en `core/agents/planner.md`, paso 5 («Record it in *Notes* (file, line, criterion)»).
- Los logs de sesiones de `usage.mjs` no se tocan: el registro nuevo solo guarda métricas del propio `kit run`.

## Evaluation
- Ubicación del registro: A) `changes/<nombre>/runs.jsonl`; B) `~/.flucastr-ai/runs.jsonl`; C) `pruebas/.temporales/`. Recomendada A: va junto al plan (el `changes/<nombre>/` ya es la unidad de traspaso), viaja a `changes/done/` al cerrar, es visible en el PR y no sale del equipo. Costo: ensucia el diff con una línea por intento; es solo métricas (sin prompts ni salidas). B pierde el vínculo con el plan; C está ignorado y se borra.
- Instrumentación: envolver cada fase con `medir(...)` y volcar el registro con un `flush()` diferido (inicio de la siguiente iteración y tras el bucle) evita reindentar el bucle y no toca la lógica de decisión. Fallos de escritura solo avisan por stderr.
- Informe: `scripts/runs-report.mjs` hermano (no extender `usage.mjs`): fuente de datos y semántica de errores distintas.
- Recomendación: A + wrapper + informe hermano.

## Assumptions
- El registro es de solo métricas, se versiona con el plan. Si prefieres que no vaya en git, se agrega `changes/*/runs.jsonl` a `.gitignore` y el informe lee igual.
- El denominador de la tasa de relanzamiento es el número de intentos del `.jsonl`; las devoluciones manuales se cuentan aparte (no se suman, para no duplicar con corridas de `kit run`).
- Sin git, las huellas de árbol quedan `null` y el informe las ignora.
- Duraciones en milisegundos enteros; fecha en ISO 8601 UTC.
- Percentil p90 por rango más cercano (nearest rank); con un solo dato mediana = p90 = ese dato.

## Decisions already taken
- Executor: builder, porque los requisitos, contexto y comprobaciones están escritos, no hay credenciales ni despliegue y las verificaciones corren offline.
- Registro en `changes/<nombre>/runs.jsonl`, una línea por intento, con los campos: `plan`, `tramo`, `fecha`, `herramienta`, `builder_modelo` (`modelo:esfuerzo`), `builder_ms`, `verify_ms`, `revisor_ms`, `resultado` (`DONE|PAUSED|devuelto`), `motivo_relanzamiento` (`verify|revisor|null`), `relanzamientos` (acumulados al cierre del intento), `huella_inicio`, `huella_fin`.
- `kit run` no cambia su decisión: solo agrega registro.
- Semántica del informe: log vacío → mensaje «sin registros», exit 0; líneas corruptas → se listan `archivo:línea` + causa, se imprimen las estadísticas de las líneas válidas y sale con exit 1; ausencia de `changes/` → exit 2.
- Nombres de herramientas de stack: ninguno en `core/agents/` ni `core/skills/` (solo se agrega texto genérico en `planner.md`).

## Decisions
- Segment 1 (builder, 2026-11-23): el plan declara 12 campos en A1 y la lista de «Decisions already taken» tiene 13; se implementan los 13 de la lista (`plan`, `tramo`, `fecha`, `herramienta`, `builder_modelo`, `builder_ms`, `verify_ms`, `revisor_ms`, `resultado`, `motivo_relanzamiento`, `relanzamientos`, `huella_inicio`, `huella_fin`). A1 se verifica con esos 13.
- Segment 1: `relanzamientos` se fija al inicio de cada intento (cuántos relanzamientos había antes de ese intento), no al cierre. El intento que lo causa lleva el número anterior; el siguiente lleva el incremento.
- Segment 1: el `resultado` del último intento es `DONE` o `PAUSED` según el veredicto final de `kit run`; los intentos intermedios que se relanzan quedan `devuelto` con `motivo_relanzamiento` (`verify` o `revisor`).
- Segment 1: el intento se vuelca al inicio de la siguiente iteración y tras el bucle, antes de `progreso`/`fijarEstado`/`anotarNotas`; si el proceso muere antes, el último intento abierto no se escribe (la escritura es best effort, como indica el contrato de `registrar`).

## Validation
**Aprobado en Gate 1 (2026-11-23): plan, ubicación del registro y convención «Devuelto:».** Se aprobó:
1. El plan y la ubicación del registro (`changes/<nombre>/runs.jsonl`).
2. La convención «Devuelto:» (abajo). Si no la aprobás, el tramo 3 se omite y el informe igual cuenta las líneas existentes sin imponer nada.

### Convención propuesta «Devuelto:»
En `## Notes` del plan, una línea por devolución del planner al builder:

`- Devuelto: <defecto|omision|verify|otro> — tramo <N> — <archivo:línea, criterio A#: detalle>`

- `defecto`: lo entregado no cumple un criterio; `omision`: falta algo pedido; `verify`: `verify` en rojo; `otro`: resto.
- El informe cuenta las líneas que coinciden con `^- Devuelto: (defecto|omision|verify|otro)\b` por categoría, origen «manual», aparte del `.jsonl`.
- El planner la usa al devolver (paso 5 de `core/agents/planner.md`); no cambia el flujo ni bloquea.

## Scope
Archivos de producto: `scripts/kit-run.mjs`, `tools/run/registro.mjs` (nuevo), `tools/run/profiles.mjs`, `scripts/runs-report.mjs` (nuevo), `tools/run/informe.mjs` (nuevo), `tools/verify/usage-and-run.sh`, `core/agents/planner.md`.
Pruebas y documentos: `tests/kit-run/run.mjs`, `tests/runs-report/` (nuevo, con fixtures), `tests/README.md`.
Fuera de alcance: lógica de decisión de `kit run`, `scripts/usage.mjs`, logs de sesiones, topes de tiempo.

## Verification
`./verify` — falla si cualquier paso falla (≈ tiempo a medir; la suite nueva es offline y corre en segundos).

## Stop conditions
Continúa si la comprobación pasa, el siguiente paso está en el alcance y no falta una decisión de la persona usuaria. Se detiene con nota si la misma causa falla dos veces, el trabajo sale del alcance, falta una decisión, o una comprobación tarda más del doble de lo medido. El tramo 3 solo se ejecuta si «Devuelto:» fue aprobada en Gate 1.

Revisión: fin de historia.

## Steps

### Stories (ordered; each in its own document)
- Segment 1 — Story: cada `kit run` deja un registro por intento → tramo-1.md (hecho, revisado)
- Segment 2 — Story: un informe agrega duración por fase y retrabajo → tramo-2.md (pendiente)
- Segment 3 — Story: convención «Devuelto:» en el contrato del planner (solo si se aprueba) → tramo-3.md (pendiente)

## Evidence
**Segment 1 — cadena de pasos (detalle en `tramo-1.md`, Evidence).** Pasos 1–6 marcados con su check: `node -e "import('./tools/run/registro.mjs')"` exit 0; `etiquetaBuilder` con R1 (`builder_modelo` `x:y`); `medir` en builder, verify y revisor sin cambiar condiciones; volcado con `registrar` en la iteración siguiente y tras el bucle; casos R1–R5 (`node tests/kit-run/run.mjs`: 28 casos verdes); sensibilidad A5 (sin `registrar`: R1–R3 en rojo; restaurado: verde).

**Verificación del segmento (`node tests/kit-run/run.mjs`).** Exit 1 en este sandbox, solo por el caso de la línea base («las opciones en inglés conservan el recorrido…», `$TMPDIR=/tmp/claude-1000`); R1–R5 y los casos previos pasan. Criterio de Notes aplicado. Duración ≈ 9 s, dentro del tope de 18 s; 2× de 9 s = 18 s como tope.

**Segment 2 — informe (detalle en `tramo-2.md`, Evidence).** Pasos 1–4 marcados con su check: `tools/run/informe.mjs`, `scripts/runs-report.mjs`, `Devuelto:` en Notes y `tests/runs-report/run.mjs` con fixtures; `node tests/runs-report/run.mjs` → `7 casos ok`, exit 0 (A6 mediana 25 / p90 100 / 25 % / verify 1; A7 «sin registros»; A8 exit 1 con `archivo:línea`; A9 conteos 2/1 y aviso). Sensibilidad A8: una copia que ignora la corrupción → `FALLO A8`, exit 1. Paso 5 (paso 14 en `tools/verify/usage-and-run.sh` y fila en `tests/README.md`): el cambio está hecho y el paso 14 pasa directo, pero su check `./verify` verde no se cumple (ver abajo); queda pendiente.

**Verificación del segmento 2 (`node tests/runs-report/run.mjs`).** Exit 0, 7 casos ok, ~0,2 s.

**`./verify` medido (2026-11-23, primer plano, tope 20 min).** Exit 1 tras 92 s; falla solo en el paso 13 por el caso de línea base («las opciones en inglés conservan el recorrido…»); el paso 14 no se alcanza dentro de `./verify`. **`VERIFY_RAPIDO=1 ./verify`:** exit 1 tras 72 s, mismo caso. Ninguno de los dos pasa en este sandbox; no se afirma que hayan pasado. Tope de tiempo para adelante: 2× de 92 s = 184 s para `./verify` y 2× de 72 s = 144 s para `VERIFY_RAPIDO=1 ./verify`.

**Segment 3 — convención «Devuelto:» (detalle en `tramo-3.md`, Evidence).** Paso 1 marcado: `grep -n "Devuelto:" core/agents/planner.md` → una coincidencia, en el paso 5 (línea 59). Paso 2 (`./verify`) pendiente: `timeout 184 ./verify` → exit 1 en 87 s; solo falla el paso 13 por el caso de línea base («las opciones en inglés conservan el recorrido…»); el paso 14 no se alcanza. Checks auxiliares: `bash tools/verify/agent-contracts.sh` → exit 0, sin `FALLO`; `node tests/runs-report/run.mjs` → 7 casos ok, exit 0. No se afirma que `./verify` pasó.

## Notes
- Pausa previa del builder: faltaba duración medida de las comprobaciones (resuelto abajo).
- Mediciones del planner (2026-11-23, WSL2, sandbox, Node 24): `node -e "import('./tools/run/registro.mjs')"` ≈ 0,03 s; `node tests/kit-run/run.mjs` ≈ 9 s; `node tests/usage/run.mjs` ≈ 2,4 s; `node tests/runs-report/run.mjs` (nueva) se estima < 5 s, tope 30 s; `./verify` y `VERIFY_RAPIDO=1 ./verify` no medidos: córrelos una vez en primer plano (tope 20 min), anota la duración en Evidence y usa 2× como tope en adelante.
- Línea base conocida: en este sandbox `node tests/kit-run/run.mjs` ya falla un caso antes de cualquier cambio («las opciones en inglés conservan el recorrido y las mezclas con mayúsculas no cambian nada»): el normalizador de `tests/kit-run/run.mjs:183` espera `/tmp/kit-run-*.json` y el sandbox usa `$TMPDIR=/tmp/claude-1000`. No es regresión ni se arregla en este cambio. El criterio de «exit 0» para `tests/kit-run/run.mjs` en este entorno es: solo ese caso falla y todos los demás (incluidos R1–R5) pasan; anótalo en Evidence. En la máquina de la persona usuaria debe dar exit 0.
- Checkpoint Segment 1 (builder, 2026-11-23): archivos cambiados `scripts/kit-run.mjs` (37 líneas en el diff), `tools/run/profiles.mjs` (9), `tests/kit-run/run.mjs` (97), `tools/run/registro.mjs` (nuevo, sin seguimiento aún). Resumen del diff: `medir` en builder/verify/revisor; `intento` y `volcarIntento` antes del bucle; `etiquetaBuilder` en perfiles; casos R1–R5 con ejecutables falsos. Check: `node tests/kit-run/run.mjs` → 28 casos ok; solo falla la línea base (ver arriba). Sin commit ni push.
- Segment 1 cerrado en el fin de la historia: se detiene para la revisión del planner en contexto nuevo (`Revisión: fin de historia`). No se inició `tramo-2.md` ni `tramo-3.md`.
- Pendiente para el planner: medir `./verify` y `VERIFY_RAPIDO=1 ./verify` antes de cerrar el plan (ver Notes de arriba y Evidence).
- Reanudar en: Segment 2, paso 1 de `tramo-2.md` (tras la revisión del planner).
- Revisión tramo 1 (2026-11-23): aceptado; sin cambios en la lógica de decisión; R1–R5 presentes. `relanzamientos` del registro = relanzamientos previos al intento.
- Checkpoint Segment 2 (builder, 2026-11-23): archivos nuevos `tools/run/informe.mjs` (135 líneas), `scripts/runs-report.mjs` (60), `tests/runs-report/run.mjs` (108) y 5 fixtures bajo `tests/runs-report/fixtures/`; modificados `tools/verify/usage-and-run.sh` (+5, paso 14) y `tests/README.md` (+1, fila). Diff: lectura estricta de JSONL con `archivo:línea`; percentil por rango más cercano; CLI con salida 0/1/2; conteo `Devuelto:` solo en `## Notes`. Check del segmento: `node tests/runs-report/run.mjs` → exit 0. Pasos 1–4 marcados; paso 5 pendiente (su `./verify` no pasa por la línea base, ver Evidence). Sin commit ni push.
- Segment 2 cerrado al fin de su historia: se detiene para la revisión del planner en contexto nuevo. No se inició `tramo-3.md` (historia «convención Devuelto», otra historia; requiere revisión del planner antes). Reanudar en: Segment 3, paso 1 de `tramo-3.md` tras esa revisión.
- Revisión tramo 2 (2026-11-23): aceptado; 7 casos ok, lectura estricta, exit 0/1/2 verificados. Paso 5 de tramo-2: cambio hecho y paso 14 pasa directo; su check `./verify` verde queda para la máquina de la persona usuaria (línea base del sandbox).
- Checkpoint Segment 3 (builder): archivos cambiados `core/agents/planner.md` (una línea en el paso 5, formato `Devuelto:`) y `changes/medir-corridas/tramo-3.md` (paso 1 marcado y Evidence). Check del paso 1: `grep -n "Devuelto:"` → 1 coincidencia en el paso 5. Check del paso 2 (`./verify`): exit 1 en 87 s, solo el caso de línea base; casilla pendiente. Sin commit ni push.
- Observación fuera de Scope (no corregida): `tools/verify/agent-contracts.sh` usa `$T8` en las copias negativas (8k, 8l, 8m…) sin definirla; las copias van a `/…_neg` (solo lectura, `mkdir` falla) y el caso sale `ok` sin probar la copia. Corregirlo (p. ej. definir `T8` con `mktemp -d`) es un cambio aparte que requiere decisión de la persona usuaria, porque no está en *Scope*.
- Pausa del segmento 3 (`motivo=verify`): el segmento no cierra porque su verificación (`./verify`) no pasa en este sandbox por la línea base ya registrada. Reanudar en: Segment 3, paso 2 de `tramo-3.md`, en la máquina de la persona usuaria o después de corregir la línea base en un cambio aparte.
- Cierre (2026-11-23): la persona usuaria aprobó la evidencia. `./verify` completo no corrió en el sandbox (línea base, ver arriba); verificar en su máquina. Hallazgo aparte: `$T8` sin definir en `tools/verify/agent-contracts.sh` (8k–8m).
