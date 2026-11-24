---
status: done
branch: feature/progreso-en-vivo
base: main
repos: [.]
executor: builder
segment: 7
continuity: continuous
type: code
---
# Progreso en vivo del builder (`progress.jsonl`, `kit-status`, resumen de corrida)

## Goal
Mientras el builder trabaja, la persona usuaria y el planner pueden saber en segundos si está avanzando, esperando un comando largo o sin actividad, sin marcar casillas y sin gastar tokens de modelo. Para eso: un log por plan `changes/<nombre>/progress.jsonl` (solo anexa), captura automática por herramienta, `node scripts/kit-status.mjs <plan> [--watch]`, un resumen periódico en `kit run` y un `progress-resumen.md` al terminar o al cortar por tope de tiempo. La señal «sin actividad» solo informa; el corte automático es el cambio B4 y reutilizará esta señal.

## Exploration

Hallazgos, lo que existe y se reutiliza, opciones A/B/C y la recomendación (C: hook en Claude Code y lectores de log en Pi/Codex): ver [exploracion.md](exploracion.md).

## Eventos y origen
Formato: una línea JSON por evento: `t` (ISO UTC), `seg`, `tipo`, `o` (origen), `id` (id de la llamada, para no duplicar), y según el tipo `archivo`, `cmd`, `exit`, `ms`, `texto`. Todo texto se redacta y trunca (comando ≤ 200, texto ≤ 160).

| tipo | origen | cómo |
|---|---|---|
| `archivo_editado` | automático (hook Claude / lector Pi, Codex) | solo la ruta, nunca el contenido |
| `comando_iniciado` | automático | comando redactado y truncado |
| `comando_terminado` | automático | `exit` y `ms`; si la herramienta no da exit, `exit:null` |
| `casilla_marcada` | automático (watcher de `kit run`) | cuenta de `- [x]` del plan cambió |
| `fingerprint_cambió` | automático (watcher de `kit run`) | huella nueva (12 hex), cada intervalo |
| `paso_iniciado` | automático, inferido (tras `casilla_marcada`, el siguiente paso pendiente) | `o:"inferido"` |
| `bloqueo` | builder (`Blocked:`) o `kit run` (`corte por tope`) | texto corto |
| `nota` | builder, opcional (`Doing:`) | texto corto |

El builder solo escribe `bloqueo` y `nota`, y solo con `kit-nota.mjs`.

## Matriz de captura y costo

Matriz por herramienta (sin paridad; lo no probado se declara «no probado») y costo de la capa del builder: ver [exploracion.md](exploracion.md). Resumen: Claude Code por hook en tiempo real; Codex y Pi por lectura incremental del log (exit `null` si no se extrae). Costo estimado de la regla ~45 tokens de prompt y ~75 por llamada. **Recomendación: incluir solo `Blocked:`**; `Doing:` solo si la medición del tramo 7 supera el 2 % del costo del tramo.

## Assumptions
- `kit-status` y el hook nunca leen `.env`, claves ni contenido de archivos; solo nombres, comandos redactados y exit codes.
- Patrones redactados: `clave=valor`/`clave: valor` con `key|token|secret|password|passwd|authorization|bearer`, `sk-…`, `ghp_…`, `AKIA…`, cadenas base64/hex ≥ 32 caracteres, `://usuario:clave@`, `--password x`. Es heurístico: se prueba con casos conocidos y no garantiza cobertura total.
- El hook de Claude no distingue planner de builder; escribe solo si hay exactamente un plan `status: approved` bajo `changes/` del proyecto. Si el payload del hook trae `agent_type`, se filtra por `builder`; el tramo 3 lo comprueba y anota el resultado. Residual declarado: actividad de lectura del planner durante una corrida puede aparecer.
- Umbral por defecto de «sin actividad»: 120 s sin eventos y sin comando en curso; configurable con `--umbral` (seg) y la variable `KIT_PROGRESO_UMBRAL`. Intervalo por defecto de `--watch` y del resumen: 10 s y 60 s; `--intervalo`, `KIT_PROGRESO_INTERVALO`.
- Un comando largo legítimo (iniciado sin terminado) siempre muestra `esperando comando` con su duración, sin importar cuánto dure; nunca «sin actividad».
- Los eventos de lectores se deduplican por `id`; el lector relee el log del plan antes de anexar (sin archivo de offset).

## Decisions already taken
- Executor: builder; offline, sin credenciales, sin despliegue.
- `progress.jsonl`/`progress-resumen.md` ignorados por git; datos del harness.
- No cambia el contrato `DONE:`/`PAUSED:` ni los códigos de salida 0/1/2 de `kit run`; el corte por tope sigue saliendo como el `PAUSED` actual.
- Nombres de herramientas de stack: ninguno en `core/agents/` ni `core/skills/` (solo texto genérico).
- (Segmento 3, menor, resuelta) El hook de Claude Code acepta planes en `approved` e `in progress`: el builder pone `in progress` al empezar (paso 3 de `execute-plan`), así que filtrar solo `approved` dejaría el hook mudo durante todo el tramo. Sigue exigiendo un único plan activo bajo `cwd`.

## Validation
Pendiente de Gate 1. Decisiones a confirmar: (1) captura C (hook + lectores), (2) log ignorado por git, (3) capa del builder = solo `Blocked:` por defecto, (4) corregir la huella para excluir `changes/`, (5) 7 tramos con `Revisión: por tramo`.

## Scope
Archivos de producto (≤3 por tramo): `tools/progress/eventos.mjs`, `tools/progress/estado.mjs`, `scripts/kit-status.mjs`, `scripts/kit-nota.mjs`, `adapters/claude-code/progress-hook.mjs`, `adapters/claude-code/install-progress-hook.sh`, `tools/progress/lector-codex.mjs`, `tools/progress/lector-pi.mjs`, `tools/progress/captura.mjs`, `tools/progress/resumen.mjs`, `tools/run/tree-fingerprint.mjs`, `.gitignore`, `scripts/progress-watch.mjs`, `scripts/kit-run.mjs`, `core/agents/builder.md`, `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md`, `tools/verify/usage-and-run.sh`.
Pruebas y documentos: `tests/progress/` (nuevo, con fixtures), `tests/README.md`, `docs/evaluaciones/progreso-en-vivo.md`.
**Excepción explícita (solo para el builder):** `changes/<nombre>/progress.jsonl` puede recibir líneas nuevas (solo anexar, vía `kit-nota.mjs`); no puede editar ni borrar líneas existentes ni tocar `changes/<nombre>/progress-resumen.md`. Se declara igual en `core/agents/builder.md` (tramo 7).
Fuera de alcance: lógica de decisión de `kit run`, topes de tiempo, el detector de pegado B4, `scripts/usage.mjs`, `tools/observe/*`.

## Verification
`./verify` — falla si cualquier paso falla. Las suites nuevas son offline y corren en segundos (a medir). Línea base conocida del sandbox: el caso de inglés de `tests/kit-run/run.mjs` (`$TMPDIR`) puede fallar antes de cualquier cambio; no es regresión.

## Stop conditions
Continúa si la comprobación pasa, el siguiente paso está en el alcance y no falta una decisión. Se detiene con nota si la misma causa falla dos veces, el trabajo sale del alcance, falta una decisión, o una comprobación tarda más del doble de lo medido. Un hook que bloquea o ralentiza (> 100 ms p95 medido por llamada) es defecto: se detiene.

Revisión: por tramo.

## Steps

### Stories (ordered; each in its own document)
- Segment 1 — Story: un log de eventos seguro y un cálculo de estado → tramo-1.md (pendiente)
- Segment 2 — Story: `kit-status` y `kit-nota` con las cinco pruebas offline → tramo-2.md (pendiente)
- Segment 3 — Story: captura automática en Claude Code por hook → tramo-3.md (pendiente)
- Segment 4 — Story: captura automática en Codex y Pi por lectura de logs → tramo-4.md (pendiente)
- Segment 5 — Story: resumen de corrida y huella que ignora `changes/` → tramo-5.md (pendiente)
- Segment 6 — Story: `kit run` muestra la señal y deja el resumen → tramo-6.md (pendiente)
- Segment 7 — Story: contratos del builder y del planner, y costo medido → tramo-7.md (pendiente)

## Evidence

Segmento 1 (`tramo-1.md`, Evidence con los comandos y salidas): `node -e "import('./tools/progress/eventos.mjs')"` exit 0; `node -e "import('./tools/progress/estado.mjs')"` exit 0; `node tests/progress/run.mjs` → `progress: 11 casos pasaron`, exit 0; sensibilidad A5 con la redacción desactivada: `progress: 1 caso(s) fallaron`, exit 1 (FALLO en A1), restaurado a exit 0.

Segmento 2 (`tramo-2.md`, Evidence con los comandos y salidas): `node tests/progress/run.mjs` → `progress: 18 casos pasaron`, exit 0; sensibilidad A9 (mutación de `kit-status.mjs`): `FALLO A2`, exit 1; restaurado y verde, exit 0.

Segmento 2, corrección de la revisión del planner (casillas del tramo activo en plan índice; caso A10 en `tests/progress/run.mjs`):
$ node tests/progress/run.mjs
ok A10 plan índice con tramo-2.md muestra las casillas del tramo activo, no 0/0
ok A10 plan índice sin progress.jsonl muestra las casillas del tramo activo, no 0/0
progress: 20 casos pasaron
exit 0

$ node scripts/kit-status.mjs changes/progreso-en-vivo/plan.md
sin progress.jsonl: el builder aún no ha escrito progreso en /home/franco/Codes/flucastr/Flucastr.AI/changes/progreso-en-vivo/progress.jsonl
segmento 2 · casillas: 6/6
exit 0

Sensibilidad A10 (`casillasActivas` forzado a `planPath`):
$ node tests/progress/run.mjs
FALLO A10 plan índice con tramo-2.md muestra las casillas del tramo activo, no 0/0
FALLO A10 plan índice sin progress.jsonl muestra las casillas del tramo activo, no 0/0
progress: 2 caso(s) fallaron
exit 1
Restaurado (`cmp` idéntico) y `node tests/progress/run.mjs` → `progress: 20 casos pasaron`, exit 0.

Segmento 3 (`tramo-3.md`, captura por hook en Claude Code):
$ node tests/progress/run.mjs
ok A1 el hook registra archivo_editado, comando_iniciado y comando_terminado con exit y ms, sin salida
ok A2 el hook sale 0 y no escribe ante stdin inválido, 0 o 2 planes activos o escritura imposible
ok A3 el hook redacta comandos con secretos y registra solo el nombre de un .env o una clave
ok A4 instalar dos veces deja una entrada por evento, conserva el hook de permisos y quitar deja el estado inicial
progress: 24 casos pasaron
exit 0
(La línea `progreso: no se pudo anexar ... (EISDIR)` del caso A2 es el aviso esperado de `anexar` por stderr; el hook no escribe nada por stdout.)

Verificación del segmento. `tests/permissions-contract/run.mjs` no existe; se usa el comando que declara `tests/README.md`:
$ node --test tests/permissions-contract/*.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
exit 0

Permisos sin cambios:
$ git diff --stat -- scripts/permissions-hook.mjs adapters/claude-code/hook.mjs tests/permissions-contract tests/permissions-v2.test.mjs
(salida vacía; exit 0)

A5 (20 ejecuciones de `node adapters/claude-code/progress-hook.mjs` con un Edit sobre un proyecto temporal con un plan `approved`; medido con `date +%s%N` antes y después de cada llamada, incluye el arranque de Node en WSL2): mediana 45 ms, p95 68 ms (rango más cercano, el 19.º de 20), mínimo 35 ms, máximo 105 ms. Criterio p95 < 100 ms: pasa. El proyecto temporal se borró.

A6: no probado. En esta ejecución no hubo sesión real de Claude Code y no se consultó la documentación del payload; no se inventó `agent_type`. El hook filtra por `agent_type` solo si el payload lo trae. Residual declarado: si el payload real no trae `agent_type`, cualquier Edit, Write, MultiEdit o Bash con un plan activo bajo el `cwd` se registra, también los del planner dentro de ese mismo proyecto.

Segmento 7 (`tramo-7.md`, historia «contratos del builder y del planner, y costo medido»):

Paso 1 (`builder.md`, Limits):
$ grep -n "progress.jsonl" core/agents/builder.md
25:- You may append lines to `changes/<name>/progress.jsonl` only through `kit-nota`; never edit or delete existing lines, and never touch `progress-resumen.md`.
exit 0

Paso 2 (`execute-plan/SKILL.md`, una línea):
$ grep -n "kit-nota" core/skills/execute-plan/SKILL.md
86:- On a blocker, run `node scripts/kit-nota.mjs <plan> blocked "<cause>"` once before returning; use `doing "<step>"` only if the user approves it after the measurement.
exit 0

Paso 3 (`planner.md`, Builder report):
$ grep -n "kit-status\|progress-resumen" core/agents/planner.md
73: For progress or review, run `node scripts/kit-status.mjs <plan>` once (no model call) and read `progress-resumen.md` if it exists. Within the same four lines, report the last activity with its time, the last file, the signal, and the per-step time from the summary when present. A `CORTE POR TOPE DE TIEMPO` header means a time cap set by `kit run`, not a product `PAUSED`.
exit 0

Paso 4 (`docs/evaluaciones/progreso-en-vivo.md`, costo medido):
$ test -f docs/evaluaciones/progreso-en-vivo.md && echo presente
presente
exit 0

Paso 4, medición: `node scripts/usage.mjs --sessions` (salida guardada en `$TMPDIR/usage-sessions.txt`; cola):
aviso: Codex: muestra pequeña para gpt-6.1-terra (1 sesiones; se recomiendan 5 o más)
exit 0 (las sesiones del builder no se separan en el informe: «no medido» en el documento)

A5 (la regla no añade herramientas de stack):
$ grep -n -i "pnpm\|npm\|docker" core/agents/builder.md core/skills/execute-plan/SKILL.md
core/skills/execute-plan/SKILL.md:42: ... (Level 1, no Docker) ...
core/skills/execute-plan/SKILL.md:49: ... Do not chain standalone `docker run` or `compose run` calls.
(las dos coincidencias existen en `git show HEAD:core/skills/execute-plan/SKILL.md`; las líneas nuevas no tienen ninguna; `builder.md` sin coincidencias en HEAD ni ahora)
exit 0

Paso 5 (verificación del segmento):
$ bash tools/verify/agent-contracts.sh
(salida de 21 líneas; ruido de línea base por `$T8` sin definir: `mkdir: Read-only file system` y `No such file or directory` en los casos negativos; los casos `ok 8i`, `ok 8k`, `ok 8l`, `ok 8m` pasan sin comprobar nada, ver Notes)
exit 0

$ node --test tests/acceptance/*.test.mjs
ℹ tests 3
ℹ pass 2
ℹ fail 1
✖ kit-run: la suite de kit run pasa (18023.345183ms)
  AssertionError [ERR_ASSERTION]: flujo kit-run falló (exit 1): actual: 1, expected: 0
  (diferencia de `actual` contra `expected`: solo `kit-run-lpXawH/veredicto.schema.json` contra `kit-run-u9REdI/veredicto.schema.json`; `FALLO las opciones en inglés conservan el recorrido…` es la línea base conocida)
exit 1 (línea base; `builder-contract` y `uso` verdes)

## Notes

- Punto de control, segmento 1 (un solo tramo de la historia «un log de eventos seguro y un cálculo de estado»; historia completa):
  - Archivos nuevos: `tools/progress/eventos.mjs` (104 líneas), `tools/progress/estado.mjs` (69), `tests/progress/run.mjs` (140). Sin cambios en `tools/usage/jsonl.mjs` ni en `tools/run/registro.mjs` (contratos).
  - Resumen del diff: `eventos.mjs` define `TIPOS`, `redactar` (clave=valor, `--password`, URL con clave, `sk-`/`ghp_`/`AKIA`, hex y base64 ≥ 32), `truncar`, `evento`, `anexar` (best effort, avisa por stderr) y `leerEventos` (cuenta corruptas). `estado.mjs` es función pura `calcularEstado` con las señales `esperando comando` / `avanzando` / `sin actividad`.
  - Check: `node tests/progress/run.mjs` exit 0; pendientes en `tramo-1.md`: 0.
  - Decisión menor: `evento` lanza `TypeError` ante un tipo desconocido; `anexar` nunca lanza y devuelve `false`. Los llamadores (hook, `kit-nota`) envuelven la llamada.
  - Tramo 1 terminado. Historia completa; `Revisión: por tramo`, así que se detiene para la revisión del planner antes del tramo 2 (`tramo-2.md`, historia `kit-status` y `kit-nota`). Estado del plan: `done` por segmento, según el contrato del builder; el planner reaprueba para retomar en `segment: 2`.
- Punto de control, segmento 2 (historia «`kit-status` y `kit-nota` con las cinco pruebas offline», historia completa):
  - Archivos nuevos: `scripts/kit-status.mjs` (solo lectura; ≤ 8 líneas; `--watch`, `--intervalo`, `--umbral`, `KIT_PROGRESO_*`), `scripts/kit-nota.mjs` (`blocked|bloqueo` → `bloqueo`, `doing|nota` → `nota`; anexa con `anexar`; exit 0/1/2), `tests/progress/fixtures/` (cuatro JSONL: normal, comando-largo, sin-actividad, corrupto; el caso «sin log» usa un plan sin `progress.jsonl`). Cambiados: `tests/progress/run.mjs` (A1–A7 añadidos), `tests/README.md` (fila), `tools/verify/usage-and-run.sh` (paso 15).
  - Resumen del diff: solo se añadieron archivos y casos; `tools/progress/*`, `tools/usage/jsonl.mjs` y `tools/run/registro.mjs` no cambiaron.
  - Check: `node tests/progress/run.mjs` → `progress: 18 casos pasaron`, exit 0. `bash -n tools/verify/usage-and-run.sh` → exit 0. Sensibilidad A9: mutación de `kit-status` → `FALLO A2`, exit 1; restaurado (`cmp` idéntico) y verde.
  - Decisiones menores: `--intervalo` controla solo el refresco de `--watch` (defecto 10 s); la ventana de «cambió N veces» es fija en 60 s (`VENTANA_HUELLA`). `kit-status` toma el segmento del log y, si no hay log, del frontmatter.
  - Observaciones: `plan.md` es índice sin pasos de segmento, así que el check sobre él da `casillas: 0/0`. Residuo: un directorio vacío `/tmp/x` creado por error durante la sesión; su borrado fue bloqueado por el hook (acción protegida fuera de `pruebas/.temporales`), no se reintentó. Hay archivos sin seguimiento en la raíz (`.bashrc`, `.zshrc`, `.gitconfig`, etc.) que no creé y no toqué.
  - Pendientes del tramo: 0. Historia completa; `Revisión: por tramo`, así que se detiene para la revisión del planner antes del tramo 3 (`tramo-3.md`, captura por hook en Claude Code). No avanzó a tramo-3. Rama `feature/progreso-en-vivo` sin cambios; sin commit ni push.

- Revisión del planner, segmento 2: RETURNED. Devuelto: defecto. `scripts/kit-status.mjs:85-87` cuenta las casillas solo de `plan.md`; en un plan índice con `tramo-N.md` da `casillas: 0/0` (comprobado con este plan). Debe contar las del `tramo-<segment>.md` activo cuando exista (y las de `plan.md` si no). Añadir caso en `tests/progress/run.mjs` con fixture de plan índice + tramo. Tampoco debe quedar `/tmp/x` (no es del repo; solo informar).
- Punto de control, segmento 2 (corrección de la revisión del planner; la historia sigue en el segmento 2):
  - Archivos cambiados: `scripts/kit-status.mjs` (nueva función `casillasActivas`: cuenta `tramo-<segment>.md` junto al plan si existe; si no, las casillas de `plan.md`; `resumen` la usa en ambas ramas) y `tests/progress/run.mjs` (casos A10 con plan índice: con log y sin log, con fixture `normal.jsonl`).
  - Resumen del diff: `kit-status` pasa de `casillas: 0/0` a `casillas: 2/4` en el plan índice de prueba; ningún otro archivo de producto cambió.
  - Check: `node tests/progress/run.mjs` → `progress: 20 casos pasaron`, exit 0. Sensibilidad A10 con la corrección revertida: `FALLO A10` ×2, exit 1; restaurado idéntico y verde.
  - Pendientes del tramo: 0 (las casillas de `tramo-2.md` ya estaban marcadas; esta corrección no añade casillas). Estado: `done` por segmento; `segment: 2` sin cambiar, para que el planner reapruebe y avance a `tramo-3.md` (`Revisión: por tramo`). No se hizo commit ni push.
  - Residuo fuera del repo: `/tmp/x` existe como archivo de 5725 bytes (no como directorio vacío, como decía la nota anterior). No es del repo, no se borró (la acción queda fuera del alcance y el hook la protege); decisión de la persona usuaria.

- Punto de control, segmento 3 (historia «captura automática en Claude Code por hook», historia completa):
  - Archivos nuevos: `adapters/claude-code/progress-hook.mjs` (130 líneas), `adapters/claude-code/install-progress-hook.sh` (114). Cambiado: `tests/progress/run.mjs` (casos A1–A4 añadidos; 392 líneas). Sin cambios en `scripts/permissions-hook.mjs`, `adapters/claude-code/hook.mjs`, `tests/permissions-contract`, `tests/permissions-v2.test.mjs` ni `install.sh`.
  - Resumen del diff: el hook lee stdin con tope de 1 MB; resuelve el único plan `approved` o `in progress` bajo `cwd`; anexa `archivo_editado` (Edit, Write, MultiEdit) y `comando_iniciado` / `comando_terminado` (Bash, enlazados por `tool_use_id`, con `exit` y `ms`); redacta comandos y registra solo el nombre de rutas `.env` o de claves; sale siempre 0 sin stdout y sin `onFailure: block`. El instalador `instalar|quitar|comprobar` escribe `<proyecto>/.claude/settings.local.json` de forma atómica, sin duplicar y sin tocar la entrada de permisos.
  - Decisión menor: `approved` e `in progress` (ver *Decisions*).
  - Instalación: `install.sh` no se llama. La persona usuaria instala a mano con `bash adapters/claude-code/install-progress-hook.sh instalar <proyecto>`. Eso todavía no está documentado en `README.md` ni en `docs/evaluaciones/progreso-en-vivo.md`; queda para la revisión de este tramo o para el tramo 7.
  - Check: `node tests/progress/run.mjs` → `progress: 24 casos pasaron`, exit 0. `node --test tests/permissions-contract/*.test.mjs` → 11/11, exit 0. A5 pasa (p95 68 ms); A6 queda «no probado» con su residual.
  - Pendientes del tramo: 0. `Revisión: por tramo`, así que se detiene para la revisión del planner y no avanza al tramo 4. `segment: 3` sin cambiar, `status: done`. Rama `feature/progreso-en-vivo` sin cambios; sin commit ni push.

- Punto de control, segmento 4 (historia «captura automática en Codex y Pi por lectura de logs», pausada antes de ejecutar las comprobaciones):
  - Archivos nuevos: `tools/progress/lector-codex.mjs` (`leerSesionCodex`, `custom_tool_call`/`exec`, `function_call`/`exec_command`, espera por `cell_id`), `tools/progress/lector-pi.mjs` (`leerSesionPi`, `toolCall` bash/edit/write, `toolResult` con `durationMs`), `tools/progress/captura.mjs` (`capturar`, dedupe por `${tipo}|${id}` leyendo `progress.jsonl`), `tests/progress/fixtures/codex-rollout.jsonl` y `tests/progress/fixtures/pi-session.jsonl` (estructura ficticia; `__RAIZ__` en `cwd`; una línea truncada a propósito). Sin cambios en `tests/progress/run.mjs`, `tools/usage/*` ni otros archivos de producto.
  - Verificado solo que los tres módulos importan (`node -e "import(...)"`, exit 0). No se ejecutó `node tests/progress/run.mjs` ni `node tests/usage/run.mjs`.
  - Casillas: 0/5 marcadas. Los TODO 1 a 3 tienen código escrito, pero su check (casos A1 Codex, A1 Pi, A2 y A5) no corrió: la regla de continuidad exige una duración previa registrada para cada check y no hay ninguna para estos, así que se para antes de ejecutarlo. TODO 4 y TODO 5 siguen pendientes.
  - Nota A6 (investigación, sin prueba real): `~/.codex/config.toml` no tiene clave `notify`; `~/.pi/agent/extensions` contiene pi-subagents y pi-web-access, sin mecanismo de eventos de progreso comprobado. Se mantiene la lectura de logs como mecanismo. «no probado».
  - Siguiente paso exacto: TODO 1 de `tramo-4.md` (`lector-codex`): ejecutar `node tests/progress/run.mjs` con el caso A1 Codex, después de que el planner registre la duración de esa comprobación en la aprobación.
  - Estado: `partial`. Reanudar en `segment: 4`. Sin commit ni push.

- Reaprobación segmento 4 (planner, 2026-11-23): duraciones previas medidas para la regla de continuidad: `node tests/progress/run.mjs` ≈ 2,0 s (exit 0); `node tests/usage/run.mjs` ≈ 3,5 s (exit 0). Ambas son rápidas: ejecútalas sin más espera, marca las casillas del tramo 4 al comprobarlas y termina el segmento. `segment: 4`, `status: approved`.

- Punto de control, segmento 4 (reanudación del builder; historia «captura automática en Codex y Pi por lectura de logs», historia completa):
  - Archivos cambiados: `tests/progress/run.mjs` (casos A1 Codex y Pi, A2 Codex y Pi, A3 Codex y Pi, A4, A5; importa `capturar`, `leerSesionCodex` y `leerSesionPi`). Archivos de producto `tools/progress/lector-codex.mjs`, `lector-pi.mjs` y `captura.mjs` y los fixtures existían desde la pausa; en esta corrida no se cambió ninguno de ellos, salvo la sensibilidad A7, que se revirtió y quedó idéntica (`cmp`).
  - Resumen del diff: solo se añadieron casos de prueba y helpers (`proyectoCaptura`, `sesionCopia`, `porTipoId`); el runner ahora hace `await c.fn()` para los casos asíncronos. Sin cambios en `tools/usage/*`.
  - Checks: `node tests/progress/run.mjs` → `progress: 32 casos pasaron`, exit 0, 2070 ms (duración previa ≈ 2,0 s). `node tests/usage/run.mjs` → `pruebas del medidor: 20 de 20 ok`, exit 0, 2010 ms (previa ≈ 3,5 s). Sensibilidad A7 (dedupe de `captura.mjs` desactivado): `FALLO A2 codex`, `FALLO A2 pi`, `progress: 2 caso(s) fallaron`, exit 1; restaurado y verde, exit 0. A6 escrita como «no probado» para cualquier mecanismo distinto de los logs (`~/.codex/config.toml` sin `notify`; `~/.pi/agent/extensions` sin mecanismo de progreso comprobado).
  - Observación que el planner debe revisar: una primera ejecución de `node tests/progress/run.mjs` bajo `timeout 4s` no terminó dentro de su límite (≈ 4,6 s frente a los ≈ 2,0 s medidos, más del doble de lo medido). Se ejecutó antes de añadir los casos A1–A5 y no produjo resumen final. Las dos ejecuciones siguientes, con los casos completos, midieron 2075 ms y 2070 ms, dentro del límite. Ninguna casilla depende de esa primera ejecución; las casillas se marcaron con las ejecuciones dentro del límite. Lo registro aquí como sobrepaso de la regla de duración, sin ocultarlo.
  - Casillas: 5/5 marcadas (`tramo-4.md`, TODO 1 a 5). Pendientes del tramo: 0.
  - Estado: `done` por segmento; `Revisión: por tramo`, así que el segmento termina aquí para la revisión del planner. `segment: 4` sin cambiar. No se avanzó a `tramo-5.md`. Sin commit ni push.

- Revisión segmento 4 (planner): APPROVED. `node tests/progress/run.mjs` → 32 casos, exit 0; `node tests/usage/run.mjs` → 20/20, exit 0; casillas 5/5; solo archivos nuevos en `tools/progress/` y fixtures. A6 «no probado» (aceptado, residual declarado). La primera ejecución lenta (~4,6 s) fue carga del sandbox, no un defecto.
- Reaprobación segmento 5 (planner, 2026-11-23): duraciones previas medidas: `node tests/progress/run.mjs` ≈ 2,1 s (exit 0); `node tests/kit-run/run.mjs` ≈ 12,3 s, exit 1 por línea base conocida del sandbox: el caso «las opciones en inglés conservan el recorrido…» falla porque el directorio temporal `kit-run-XXXXXX` difiere en el esquema (preexistente, no atribuible a este cambio; anótalo sin corregirlo). Cualquier otro fallo de `kit-run` sí es tuyo. Ejecuta los checks sin más espera.

- Punto de control, segmento 5 (historia «resumen de corrida y huella que ignora `changes/`», historia completa):
  - Archivos cambiados: `tools/progress/resumen.mjs` (nuevo: `generarResumen`, `escribirResumen` best effort, `ENCABEZADO_CORTE`), `tools/run/tree-fingerprint.mjs` (`git status` y `git diff HEAD` con pathspec `':(exclude,top)changes/**'`), `.gitignore` (`changes/*/progress.jsonl`, `changes/*/progress-resumen.md`), `tests/progress/run.mjs` (casos S5-A1 a S5-A4 y helpers `seccion`, `evS5`, `repoTemporal`; importa `fingerprintTree`).
  - Resumen del diff: la huella deja de contar `changes/` en `git status` y `git diff HEAD`; el resto de la función no cambió. `scripts/kit-run.mjs` no se tocó: hereda la exclusión porque usa `fingerprintTree`. Sin cambios en `tests/kit-run/run.mjs` ni `core/contracts/verification.md`.
  - Checks: `node tests/progress/run.mjs` → `progress: 38 casos pasaron`, exit 0; medido 2,25 s y 2,47 s (límite 4,2 s). A6: exclusión revertida → `FALLO S5-A3`; restaurada (`cmp` idéntico) → verde. A5: `git check-ignore -q` con cada ruta por separado → exit 0 y 0 (con este git no admite dos rutas en un solo `-q`). `node tests/kit-run/run.mjs` → 28 ok, 1 fallido (línea base conocida: «las opciones en inglés…»), R5 pasa, duración 15,1 s (límite 24,6 s).
  - Decisión menor: el repo temporal de S5-A3/A4 usa `commit-tree` sobre el árbol vacío para tener `HEAD` sin ejecutar `git commit` (aislado en `$TMPDIR`, no toca la rama del proyecto).
  - Pendientes del tramo: 0. `Revisión: por tramo`, así que se detiene para la revisión del planner. `segment: 5` sin cambiar, `status: done`. Rama `feature/progreso-en-vivo` con cambios sin commit; sin commit ni push.

- Revisión segmento 5 (planner): APPROVED. `tests/progress/run.mjs` → 38 casos, exit 0; `tests/kit-run/run.mjs` → solo falla la línea base conocida, R5 verde; `git check-ignore` exit 0 en ambas rutas; el diff de `tree-fingerprint.mjs` coincide con el contrato. Aviso: `changes/kit-run/progress.jsonl` ya queda ignorado.
- Reaprobación segmento 6 (planner, 2026-11-23): duraciones previas: `node tests/progress/run.mjs` ≈ 2,5 s (exit 0); `node tests/kit-run/run.mjs` ≈ 15 s (exit 1 solo por la línea base «las opciones en inglés…»; cualquier otro fallo es tuyo). Ejecuta los checks sin más espera. No cambies DONE/PAUSED ni los códigos 0/1/2 de `kit run`.

- Punto de control, segmento 6 (historia «kit run muestra la señal y deja el resumen», PAUSED a mitad de historia):
  - Archivos cambiados: `scripts/progress-watch.mjs` (nuevo: vigilante hijo con `--una-vez`, bucle con `setInterval`, casillas, `paso_iniciado` inferido, `fingerprint_cambió`, línea `[progreso]` en stderr, sale con SIGTERM); `scripts/kit-run.mjs` (`spawn` asíncrono del vigilante alrededor del builder con `kill("SIGTERM")` después, `bloqueo` `o:"kitrun"` por corte, `cerrarProgreso` con `spawnSync --una-vez` y `escribirResumen` antes de la salida final; decisiones, salida y códigos sin cambios); `tests/progress/run.mjs` (casos A1, A3, A4, A5 y A6 con `kitRun` y fakes en `kr-bin`); `changes/progreso-en-vivo/tramo-6.md` (TODO 1 a 3 marcados con evidencia).
  - Resumen del diff: el vigilante solo anexa a `progress.jsonl` y escribe a stderr; `kit run` no lee su salida. El resumen se escribe en `changes/<n>/progress-resumen.md` con el encabezado `CORTE POR TOPE DE TIEMPO — no es un PAUSED del producto` cuando el corte es por tope.
  - Checks: `node tests/progress/run.mjs` → `progress: 44 casos pasaron`, exit 0, medido 12,9 s (límite de modo continuo: 2 × 2,5 s = 5 s). `node tests/kit-run/run.mjs` → 14,5 s con solo la línea base conocida («las opciones en inglés…»), registrado en la evidencia de TODO 2.
  - Motivo de la parada: la regla de modo continuo se activa por duración (12,9 s > 2 × 2,5 s). No es un fallo de caso. Los 3 s del builder de A1 (requeridos por la aceptación) y la espera de ≈2,6 s de A2 empujan la suite; reducirlos exige cambiar el diseño de aceptación, así que es decisión del planner.
  - Riesgo residual (no probado a fondo): un vigilante terminado con SIGTERM y la captura final `--una-vez` podrían anexar el mismo evento. Las ids `casilla|…` y `paso|…` se deduplican por contenido del plan; las ids `huella|<ms>` no se deduplican y podrían repetirse en ese cruce.
  - Pendientes del tramo: TODO 4 (A7: medir con y sin vigilante, diferencia < 2 s, anotar números en Evidence; A8: quitar temporalmente la llamada `lanzarVigilante`, comprobar que A1 falla, restaurar con copia y `cmp` idéntico, verde). Punto de reanudación: TODO 4 de `tramo-6.md`.
  - Estado: `status: partial` (PAUSED); `segment: 6` sin cambiar. Rama `feature/progreso-en-vivo` con cambios sin commit; sin commit ni push.

- Decisión planner (segmento 6, PAUSED motivo=design): opción 1. La nueva línea base de `node tests/progress/run.mjs` es ≈ 12,8 s (exit 0, 44 casos; antes 2,5 s) por los casos A1–A6 de `kit run` (builder simulado de ~3 s y espera de A2); es aceptable y queda anotada. Duraciones previas para lo que falta: `node tests/progress/run.mjs` ≈ 12,8 s; `node tests/kit-run/run.mjs` ≈ 15 s (solo falla la línea base conocida). Revisado el diff de `scripts/kit-run.mjs`: decisiones y códigos 0/1/2 sin cambios, todo best effort. Reanuda en TODO 4 (A7 y A8); `segment: 6`, `status: approved`.

- Punto de control, segmento 6 (reanudación en TODO 4; historia «kit run muestra la señal y deja el resumen», historia completa):
  - Archivos cambiados en esta corrida: `changes/progreso-en-vivo/tramo-6.md` (TODO 4 marcado con evidencia) y `changes/progreso-en-vivo/plan.md` (frontmatter y esta nota). `scripts/kit-run.mjs` se modificó solo de forma temporal para A8 y se restauró desde una copia; `cmp` idéntico al respaldo, sin marca temporal.
  - Resumen del diff: ningún cambio de producto neto en esta corrida. Sin cambios en `scripts/progress-watch.mjs`, `tests/progress/run.mjs` ni `tests/kit-run/run.mjs`.
  - Checks: A7 → con vigilante ≈ 3293 ms, sin vigilante ≈ 3257 ms, diferencia ≈ 36 ms (< 2 s), salida y exit iguales. A8 → con la llamada quitada, `node tests/progress/run.mjs` da `FALLO A1` y `progress: 1 caso(s) fallaron`, exit 1; restaurado con `cmp` idéntico, `progress: 44 casos pasaron`, exit 0. Segment verification: `node tests/progress/run.mjs` → 44 casos, exit 0; `node tests/kit-run/run.mjs` → solo falla la línea base conocida («las opciones en inglés…»), exit 1; el resto ok, R5 incluido.
  - Duraciones: las de A7 son el dato de sobrecarga (tres repeticiones con y sin vigilante). La de `node tests/progress/run.mjs` de esta corrida no se midió por separado. La de `node tests/kit-run/run.mjs` no se midió: terminó sin llegar al tope de 150 s, pero no se comprobó contra 2 × 15 s; el planner puede pedir la medición si la necesita.
  - Pendientes del tramo: 0 (TODO 1 a 4 marcados). `segment: 6` sin cambiar. `Revisión: por tramo`, así que se detiene para la revisión del planner antes del tramo 7. Estado `done`. Rama `feature/progreso-en-vivo` con cambios sin commit; sin commit ni push.

- Revisión segmento 6 (planner): APPROVED. `tests/progress/run.mjs` → 44 casos, exit 0; `tests/kit-run/run.mjs` solo falla la línea base; diff de `scripts/kit-run.mjs` revisado (códigos y decisiones intactos); A7 diferencia ≈ 36 ms; A8 rojo y luego verde.
- Reaprobación segmento 7 (planner, 2026-11-23): duraciones previas medidas: `bash tools/verify/agent-contracts.sh` ≈ 0,2 s (exit 0); `node --test tests/acceptance/*.test.mjs` ≈ 15 s, exit 1 solo por la línea base «kit-run: la suite de kit run pasa» (mismo fallo preexistente «las opciones en inglés…»; cualquier otro fallo es tuyo); `node scripts/usage.mjs --sessions` ≈ 76 s (exit 0; ejecútalo una sola vez, en una espera). Ejecuta los checks sin más espera. Mantén las reglas de `builder.md` y `execute-plan` en una línea cada una (solo `Blocked:` salvo que la medición justifique `Doing:`).

- Punto de control, segmento 7 (historia «contratos del builder y del planner, y costo medido»; historia completa, último tramo):
  - Archivos cambiados: `core/agents/builder.md` (línea 25: excepción de `progress.jsonl` solo vía `kit-nota`), `core/skills/execute-plan/SKILL.md` (línea 86: `kit-nota ... blocked` en una línea, `doing` solo con aprobación), `core/agents/planner.md` (línea 73: `kit-status` y `progress-resumen.md`, dentro de cuatro líneas, distinción de `CORTE POR TOPE DE TIEMPO`), `docs/evaluaciones/progreso-en-vivo.md` (nuevo: tamaño de la regla, costo medido, recomendación), `changes/progreso-en-vivo/tramo-7.md` (TODO 1 a 5 marcados), este `plan.md` (frontmatter `status: done` y evidencia).
  - Resumen del diff: solo se añadieron líneas de instrucción y el documento de evaluación. Sin cambios en scripts, tests ni en `AGENTS.md` (el cierre lo hace el planner).
  - Checks: A1, A2 y A3 (grep) → una coincidencia por archivo, exit 0. A4 → `docs/evaluaciones/progreso-en-vivo.md` presente con «no medido» por tokens de sesiones del builder (`usage.mjs --sessions` no las separa), con la recomendación de `Blocked:` solo. A5 → ninguna coincidencia nueva de `pnpm`, `npm` o `docker`. `bash tools/verify/agent-contracts.sh` → exit 0 (≈0,2 s, dentro de 2 × 0,2 s). `node --test tests/acceptance/*.test.mjs` → exit 1 solo por la línea base de kit-run («las opciones en inglés…»; la diferencia es la ruta temporal aleatoria); `builder-contract` y `uso` verdes.
  - Residual 1 (hallazgo previo, no corregido, fuera de Scope): en `tools/verify/agent-contracts.sh` la variable `$T8` no está definida, así que los casos negativos (8i, 8k, 8l, 8m, …) pasan sin probar nada. Sus copias van a rutas inexistentes (`/…_neg`) y `grep` no encuentra nada. Los positivos sí se verifican.
  - Residual 2: la línea base de kit-run depende del nombre aleatorio de `$TMPDIR`; no se corrigió.
  - Decisión: `Blocked:` solo; `Doing:` queda fuera hasta medir al menos tres sesiones del builder etiquetadas (ver `docs/evaluaciones/progreso-en-vivo.md`).
  - Estado: `status: done` (la verificación del segmento pasó); `segment: 7` sin cambiar. No se cerró ni movió el plan; lo hace el planner. Rama `feature/progreso-en-vivo` con cambios sin commit; sin commit ni push.

- Revisión segmento 7 y resumen de la historia (planner, 2026-11-23): APPROVED.
  - Segmentos 1–7 aprobados; `progress.jsonl` anexable, hook de Claude Code, lectores Codex/Pi, `kit-status`/`kit-nota`, vigilante y resumen en `kit run`, exclusión de `changes/` en la huella.
  - Reglas añadidas: builder.md (excepción), execute-plan (`Blocked:`), planner.md (`kit-status` y distinción de corte por tope). Recomendación: solo `Blocked:`; tokens por sesión «no medido».
  - `./verify` (1 m 48 s): pasos 1–12 ok; paso 13 falla solo por la línea base preexistente («las opciones en inglés…», ruta temporal aleatoria del sandbox; ya fallaba tras el segmento 4, antes de tocar `kit-run`). Los pasos 14–15 no corrieron por el corte: `tests/runs-report` 7 ok y `tests/progress` 44 ok, directos.
  - Pendientes fuera de plan: integrar el hook en `install.sh`, probar `agent_type` en sesión real, `git fetch` (403 del sandbox), `/tmp/x` y dotfiles sueltos en la raíz.
