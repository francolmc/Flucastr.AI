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
┌──▶ builder ─────────── falla / PAUSED / retorno inválido ─────────────▶ PAUSED (access|motivo del builder)
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
                     no / tercer fallo ─▶ PAUSED (exit 1; motivo scope|verify|design)
Contador de relanzamientos: UNO solo, compartido por verify, puerta y revisor.
```

Pasos:

1. Antes de tocar el plan, comprueba que existan `kit-check.mjs`, `kit-scope.mjs` y `kit-close.mjs` en `scripts/`. Si falta alguno, sale con código 2 y nombra cuál falta.
2. Ejecuta el plan con el builder.
3. Corre el comando de la sección `Verificación` del plan (o `./verify` si no se indicó uno). Si falla, vuelve a ejecutar el builder con la salida de la verificación.
4. Con la verificación aprobada, corre la **puerta mecánica** (`tools/run/puerta.mjs`), que ejecuta en este orden `kit-check` (con `--segment N` en planes segmentados), `kit-scope --json` y `kit-close --resultado DONE --json`. Las tres corren siempre, para que la lista de faltantes llegue completa en un solo relanzamiento:
   - Bloquea si alguna herramienta sale con 1: un criterio A# en rojo, un archivo fuera de `Scope`, una casilla sin evidencia o una omisión probable. En ese caso no hay revisor. El builder se relanza con la lista exacta de lo que falta y con el resumen de progreso.
   - No bloquea si una herramienta sale con 3 (no verificable) o 2 (uso o plan sin tabla de A#). Esos casos viajan al revisor como ítems no automatizables.
   - Si la puerta pasa, el revisor recibe su resultado para enfocarse en diseño, riesgos y lo que no se pudo automatizar.
5. Con la puerta aprobada, un proceso nuevo revisa el diff en modo de solo lectura. Si devuelve defectos, el builder se relanza con esos defectos y el flujo vuelve a verificación.

Hay un **solo contador de relanzamientos** (máximo dos en total), compartido por fallos de verificación, bloqueos de la puerta y devoluciones del revisor. Al agotarlo, la corrida pausa. El motivo de la pausa por la puerta es `scope` si hubo un archivo fuera de `Scope`, y `verify` en los demás casos.

El builder dispone de hasta 45 minutos por corrida, la verificación y la puerta 30 minutos y la revisión 15 minutos. `KIT_RUN_TOPE_MS` reemplaza esos topes por un valor común en milisegundos.

## Registro de intentos

Cada intento agrega una línea a `changes/<nombre>/runs.jsonl`. Dos campos describen la puerta:

- `puerta`: `pasa`, `falla`, `no_verificable`, o `null` si la puerta no llegó a correr.
- `puerta_ms`: duración de la puerta en milisegundos.

Un relanzamiento causado por la puerta deja `motivo_relanzamiento: "puerta"`. El registro solo mide; no cambia la decisión. `node scripts/runs-report.mjs` agrega estos campos junto con los demás.

## Resultado

La primera línea informa `DONE` si la puerta pasa y el revisor aprueba; el plan queda en estado `done`.

Si el ciclo no puede terminar, informa `PAUSED`; el plan queda en estado `partial`. El proceso devuelve código 0 para `done`, 1 para `partial` y 2 si el uso es incorrecto, el plan no está aprobado o falta una de las herramientas de la puerta.
