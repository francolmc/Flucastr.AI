# `kit run`: ejecutar un plan

`kit run` automatiza el ciclo de ejecución de un plan aprobado con Codex: encarga el trabajo al builder, ejecuta la verificación definida por el plan, pasa una puerta mecánica que no depende de la palabra del builder y pide una revisión final de solo lectura.

## Uso

```bash
node scripts/kit-run.mjs changes/mi-cambio/plan.md --tool codex
```

La herramienta predeterminada es `codex`. La opción `--root <dir>` permite señalar la raíz del kit.

## Ciclo

```
kit run <plan>
 │  preflight: ¿existen kit-check, kit-scope, kit-close? ── no ─▶ salida 2 (avisa cuál falta)
 ▼
┌──▶ builder ─────────── falla / PAUSED / retorno inválido ─────────────▶ escalera (abajo)
│     │ DONE
│     ▼
│   verify (comando del plan) ── rojo ──┐
│     │ verde                           │
│     ▼                                 │
│   PUERTA MECÁNICA                     │
│    kit-check [--segment N]            │
│    kit-scope --json                   │  falla = alguna herramienta con salida 1
│    kit-close --resultado DONE --json  │  (3 y 2 = «no verificable», no bloquea)
│     │ pasa          └─ falla ─────────┤
│     ▼                                 ▼
│   revisor (modelo, solo lectura)   ¿relanzamientos < 2?
│   recibe el resultado de la puerta    │ sí: relanzamientos++ y el builder recibe
│     │                                 │     lista EXACTA (A# rojos, archivos fuera
│     ├─ APPROVED ─▶ DONE (exit 0)      │     de alcance, casillas sin evidencia,
│     ├─ PAUSED ───▶ PAUSED (design)    │     omisiones) + progress-resumen.md
│     └─ RETURNED ─▶ ¿relanzamientos<2? │
│                    sí ──────────────┐ │
└─────────────────────────────────────┴─┘
                     no / escalera agotada ─▶ PAUSED (exit 1; motivo scope|verify|design)
Contador de relanzamientos: UNO solo, compartido por verify, puerta y revisor.
```

Pasos:

1. Antes de tocar el plan, comprueba que existan `kit-check.mjs`, `kit-scope.mjs` y `kit-close.mjs` en `scripts/`. Si falta alguno, sale con código 2 y nombra cuál falta.
2. Ejecuta el plan con el builder.
3. Corre el comando de la sección `Verificación` del plan (o `./verify` si no se indicó uno). Si falla, la escalera decide (ver «Escalera de recuperación» más abajo).
4. Con la verificación aprobada, corre la **puerta mecánica** (`tools/run/puerta.mjs`), que ejecuta en este orden `kit-check` (con `--segment N` en planes segmentados), `kit-scope --json` y `kit-close --resultado DONE --json`. Las tres corren siempre, para que la lista de faltantes llegue completa en un solo relanzamiento:
   - Bloquea si alguna herramienta sale con 1: un criterio A# en rojo, un archivo fuera de `Scope`, una casilla sin evidencia o una omisión probable. En ese caso no hay revisor. El builder se relanza con la lista exacta de lo que falta y con el resumen de progreso.
   - No bloquea si una herramienta sale con 3 (no verificable) o 2 (uso o plan sin tabla de A#). Esos casos viajan al revisor como ítems no automatizables.
   - Si la puerta pasa, el revisor recibe su resultado para enfocarse en diseño, riesgos y lo que no se pudo automatizar.
5. Con la puerta aprobada, un proceso nuevo revisa el diff en modo de solo lectura. Si devuelve defectos, el builder se relanza con esos defectos y el flujo vuelve a verificación.

Hay un **solo contador de relanzamientos** (máximo dos en total), compartido por fallos de verificación, bloqueos de la puerta y devoluciones del revisor. Al agotarlo, la corrida pausa. El motivo de la pausa por la puerta es `scope` si hubo un archivo fuera de `Scope`, y `verify` en los demás casos. Las fallas de infraestructura del builder también consumen ese contador, sin avanzar la escalera; el paso 3 de la escalera cuenta como un relanzamiento más y solo se hace con tu sí.

El builder dispone de hasta 45 minutos por corrida, la verificación y la puerta 30 minutos y la revisión 15 minutos. `KIT_RUN_TOPE_MS` reemplaza esos topes por un valor común en milisegundos.

## Escalera de recuperación

Cuando el builder no termina, `kit run` clasifica la falla (campo `clase` de `runs.jsonl`) y toma la salida más barata que funcione. El planner sigue el mismo orden en `core/references/planner/paused-and-interrupted.md`; en el flujo por subagente lo aplica `node "<kit-root>/scripts/kit-escalera.mjs" <plan> --salida <archivo> --herramienta <claude|pi|codex> --raiz <proyecto>`.

| Clase | Qué es | Acción |
|---|---|---|
| `infra` | el proceso murió (thrashing, `invalid_request`, corte por tope del builder o del revisor) | relanza con el mismo modelo mientras haya cupo; no avanza el paso |
| `entorno` | espacio, Docker, permisos, navegador, límite de uso, red, corte por tope de la verificación | pausa con diagnóstico; no relanza ni ofrece relevo |
| `plan` | alcance o plan que el builder no resuelve solo | pausa con diagnóstico; no relanza ni ofrece relevo |
| `decision` | `ambiguous` o `design` del builder o del revisor | pausa; la persona deja la decisión escrita como `Resuelto:` |
| `tarea` | defecto de verificación, puerta mecánica o revisión | pasos 1 a 4 |

Pasos para `tarea`:

1. Primera falla: relanza con un handoff (último error, archivos cambiados y estado de las casillas).
2. Segunda falla: pide consejo. El planner escribe `Consejo (tramo N): …` en *Notes* (hasta 500 tokens, 2000 caracteres) y `kit run` relanza con ese consejo. Es el segundo relanzamiento.
3. Escalera agotada (dos relanzamientos y al menos una falla de tarea): subir el nivel del builder un tramo solo con tu sí en cada caso. Claude Code lo hace con el parámetro `model` del subagente, solo en ese lanzamiento; Codex usa `kit run --paso 3`; en Pi no hay mecanismo de un solo lanzamiento (`kit run` solo mapea Codex), así que es tu decisión. Si falla por tarea, no se repite.
4. Relevo al planner, solo tras un paso 3 que falló por tarea y con tu sí: la pregunta muestra el costo estimado con `--tokens entrada,caché,salida`. Sin respuesta explícita no se ejecuta. Si el relevo termina DONE, se cierra con `--resuelto --paso 4`.

`--resuelto` (con `--paso 3` o `--paso 4` si el DONE viene de esos pasos) cierra el tramo tras la revisión. La escalera no cambia los motivos de `PAUSED` ni el límite de dos relanzamientos.

## Builder pegado

Mientras el builder trabaja, `kit run` lee `changes/<nombre>/progress.jsonl` cada `KIT_RUN_PEGADO_INTERVALO_MS` (30 s por defecto) y decide si el builder parece **pegado**. El detector es una función pura (`tools/run/pegado.mjs`) que solo usa esa señal; no mide CPU ni red.

«Avance» es un evento `fingerprint_cambió`, `casilla_marcada`, `archivo_editado` o `paso_iniciado`. Un comando está abierto si tiene `comando_iniciado` sin `comando_terminado` con el mismo `id`.

Patrones (no se evalúan los primeros 5 min de la corrida; ese arranque no se configura salvo por la variable de prueba indicada abajo):

- `sin_avance`: no hay avance durante `KIT_RUN_PEGADO_SIN_AVANCE_MS` (20 min por defecto).
- `comando_repetido`: el mismo comando normalizado (espacios y números colapsados) se repite `KIT_RUN_PEGADO_REPETIDOS` veces seguidas (6) sin avance, durante al menos 5 min.
- `sondeos`: `KIT_RUN_PEGADO_SONDEOS` sondeos seguidos (10) sin avance, durante al menos 5 min. Un sondeo es `sleep`, `tail`, `watch`, `write_stdin` o `cat *.log`.

Esperas legítimas, que no se cuentan como pegado:

- Un comando declarado largo en curso: cualquier comando que contenga `verify`, y los que liste `KIT_RUN_PEGADO_LARGOS` (separados por coma). Se exime hasta 30 min desde su inicio; pasado ese tope vuelve a contar.
- Los primeros 5 min de la corrida no se evalúan.
- Sin ningún `comando_iniciado` en el log, el estado es «no verificable» y no corta.

Modos (`KIT_RUN_PEGADO`):

- `observar` (predeterminado; cualquier valor distinto de `0` y `cortar`): no interrumpe. Si detecta un patrón, añade `intento.pegado = {modo, patron, detalle, minuto}` a `runs.jsonl` y un evento `bloqueo` «pegado (observado): <patron>» a `progress.jsonl`.
- `cortar`: además de lo anterior, mata al builder (SIGTERM al grupo de procesos y SIGKILL a los 10 s) y deja la corrida en `PAUSED motivo=access`, con estado `partial`. No relanza. Escribe una nota en `## Notes` del plan: `kit run: builder pegado (<patron>); hecho=<h>/<t>; falta=<primera casilla pendiente>; causa=<detalle>. No se relanzó; revisar el plan antes de reanudar.`. No marca ni desmarca casillas.
- `0`: apaga el detector. No se evalúa nada y no hay registro ni bloqueo.

Otras variables: `KIT_RUN_PEGADO_SIN_AVANCE_MS`, `KIT_RUN_PEGADO_REPETIDOS`, `KIT_RUN_PEGADO_SONDEOS` y `KIT_RUN_PEGADO_INTERVALO_MS` reemplazan los umbrales anteriores (valores positivos; si no, se usa el predeterminado). `KIT_PROGRESO=0` deja la señal no verificable.

Dos variables existen solo para las pruebas de `tests/kit-run/run.mjs`, como `KIT_RUN_TOPE_MS`: `KIT_RUN_PEGADO_ARRANQUE_MS` (periodo sin evaluar, 5 min por defecto) y `KIT_RUN_PEGADO_MIN_REP_MS` (mínimo de tiempo sin avance para repetidos y sondeos, 5 min por defecto). Permiten que D2 y D4 corran en segundos.

Calibración: los umbrales son los predeterminados de planeación y no hay mediciones reales de corridas que los respalden todavía. Antes de usar `cortar` por defecto conviene revisar `runs.jsonl` de varias corridas y ver cuántos `pegado` se marcaron sobre trabajo real.

## Registro de intentos

Cada intento agrega una línea a `changes/<nombre>/runs.jsonl`. Dos campos describen la puerta:

- `puerta`: `pasa`, `falla`, `no_verificable`, o `null` si la puerta no llegó a correr.
- `puerta_ms`: duración de la puerta en milisegundos.
- `clase`: la clase de la falla (`infra`, `entorno`, `plan`, `decision` o `tarea`); null si el intento no falló.
- `paso`: el paso de la escalera en que corrió el intento (0 al empezar, 1 a 4 en los relanzamientos).
- `resuelto_por`: el paso que cerró el tramo; `kit run` lo escribe en su línea DONE y, en el flujo por subagente, `--resuelto` lo escribe. Null mientras no cierre.
- `builder_modelo`: el modelo con que corrió el builder.

Un relanzamiento causado por la puerta deja `motivo_relanzamiento: "puerta"`. El registro solo mide; no cambia la decisión. `node scripts/runs-report.mjs` agrega estos campos junto con los demás.

## Resultado

La primera línea informa `DONE` si la puerta pasa y el revisor aprueba; el plan queda en estado `done`.

Si el ciclo no puede terminar, informa `PAUSED`; el plan queda en estado `partial`. El proceso devuelve código 0 para `done`, 1 para `partial` y 2 si el uso es incorrecto, el plan no está aprobado o falta una de las herramientas de la puerta.
